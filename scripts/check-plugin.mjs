// check-plugin.mjs — the whale-picks admission gate (spec compliance, one-vote veto)
// and machine-score evaluator. Zero runtime dependencies (Node built-ins + ajv).
//
// Usage:
//   node scripts/check-plugin.mjs <plugin-dir>            evaluate; exit 0 = compliant
//   node scripts/check-plugin.mjs <plugin-dir> --init     generate whalepicks.json skeleton
//   node scripts/check-plugin.mjs <plugin-dir> --json     machine-readable report
//
// Six-axis scores produced here: security, scope (边界与冲突), cost, activity,
// compatibility (only when the store registry knows a verified state), and human
// (always null — humans only). The store's compute-scores.mjs consumes these.
import { readFile, writeFile, access } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import Ajv from 'ajv'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '..')
const SCHEMA_URL = new URL('../spec/whalepicks.schema.json', import.meta.url)

const OSI = new Set([
  'MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'MPL-2.0', 'LGPL-2.1', 'LGPL-3.0',
  'GPL-2.0', 'GPL-3.0', 'AGPL-3.0', 'EPL-2.0', 'CDDL-1.0', 'Zlib', '0BSD', 'Unlicense',
])

export function extractInsertIds(patchText) {
  // Subset YAML parser for the bundle patch shape:
  //   - insert:
  //       - id: <id>
  //       - id: <id2>
  //       name: "..."
  const ids = []
  for (const line of patchText.split(/\r?\n/)) {
    const m = line.match(/^\s*-\s*id:\s*['"]?([A-Za-z0-9_.@/-]+)/)
    if (m) ids.push(m[1])
  }
  return ids
}

export function activityScore(pushedAt) {
  if (!pushedAt) return null
  const days = (Date.now() - new Date(pushedAt).getTime()) / 86400000
  if (days < 30) return 5
  if (days < 90) return 4
  if (days < 180) return 3
  return 1
}

export async function evaluatePlugin(dir, opts = {}) {
  const registry = opts.registry ?? null
  const gaps = []
  const info = []
  const manifestPath = path.join(dir, 'whalepicks.json')
  if (!existsSync(manifestPath)) {
    return { pass: false, gaps: ['whalepicks.json 不存在（先跑 --init 生成骨架）'], info, scores: null }
  }
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))

  const schema = JSON.parse(await readFile(SCHEMA_URL, 'utf8'))
  const ajv = new Ajv({ allErrors: true })
  const validate = ajv.compile(schema)
  if (!validate(manifest)) {
    for (const e of validate.errors) gaps.push('schema: ' + (e.instancePath || '/') + ' ' + e.message)
  }

  // package.json sync
  const pkgPath = path.join(dir, 'package.json')
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(await readFile(pkgPath, 'utf8'))
    if (pkg.name && manifest.name && pkg.name !== manifest.name) gaps.push('package.json name (' + pkg.name + ') ≠ manifest name (' + manifest.name + ')')
    if (pkg.version && manifest.version && pkg.version !== manifest.version) gaps.push('package.json version (' + pkg.version + ') ≠ manifest version (' + manifest.version + ')')
    const repoUrl = (pkg.repository?.url || '').replace(/^git\+/, '').replace(/\.git$/, '')
    if (repoUrl && manifest.links?.repo && !repoUrl.toLowerCase().includes(manifest.links.repo.toLowerCase().replace(/^https?:\/\//, ''))) {
      gaps.push('package.json repository (' + repoUrl + ') 与 manifest links.repo 不一致')
    }
  } else {
    gaps.push('package.json 不存在')
  }

  // hard files (skippable for remote scoring where the store's security pass owns these checks)
  if (!opts.skipFileChecks) {
    for (const f of ['LICENSE', 'README.md']) {
      if (!existsSync(path.join(dir, f))) gaps.push('缺少 ' + f)
    }
  }
  const patchPath = path.join(dir, manifest.patches?.bundle || 'cordis.patch.yml')
  let actualInsertIds = []
  if (existsSync(patchPath)) {
    actualInsertIds = extractInsertIds(await readFile(patchPath, 'utf8'))
    const declared = new Set(manifest.patches?.insertIds || [])
    for (const id of actualInsertIds) if (!declared.has(id)) gaps.push('cordis.patch.yml 的 insert id "' + id + '" 未列入 patches.insertIds')
    for (const id of declared) if (!actualInsertIds.includes(id)) gaps.push('patches.insertIds 中的 "' + id + '" 在 patch 文件中不存在')
  } else {
    gaps.push('缺少 bundle patch: ' + patchPath)
  }

  // license gate
  const license = manifest.cost?.license
  if (!license || !OSI.has(license)) gaps.push('许可证不满足硬门槛: ' + (license || '(空)') + '（需 OSI 认可）')

  // conflict surface vs the store registry
  if (registry) {
    const mine = new Set(actualInsertIds)
    for (const other of registry.plugins) {
      if (other.id === manifest.id) continue
      for (const oid of other.patches?.insertIds || []) {
        if (mine.has(oid)) gaps.push('insert id 冲突: "' + oid + '" 已被 ' + other.id + ' 占用')
      }
    }
  } else {
    info.push('未加载商店 registry，跳过 insert id 交叉冲突检测')
  }

  // GitHub activity facts (activity axis + maintenance gate signal)
  let pushedAt = opts.pushedAt ?? null
  let archived = opts.archived ?? false
  const ghMatch = (manifest.links?.repo || '').match(/github\.com\/([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)/)
  if (!pushedAt && ghMatch) {
    try {
      const res = await fetch('https://api.github.com/repos/' + ghMatch[1], {
        headers: { 'User-Agent': 'dsh-whale-picks-check/1.0', Accept: 'application/vnd.github+json' },
      })
      if (res.status === 200) {
        const meta = await res.json()
        pushedAt = meta.pushed_at
        archived = Boolean(meta.archived)
      } else {
        info.push('GitHub API ' + res.status + '，活跃度轴无法计算')
      }
    } catch {
      info.push('GitHub API 不可达，活跃度轴无法计算')
    }
  }
  if (archived) gaps.push('仓库已 archived（硬门槛：有维护）')
  if (pushedAt && activityScore(pushedAt) === 1) gaps.push('近 6 个月无推送（硬门槛：有维护）')

  // machine scores (independent of the gate)
  const scores = {
    security: null,
    scope: null,
    cost: null,
    activity: null,
    compatibility: null,
    human: null,
  }
  if (!gaps.length || true) {
    const cap = manifest.capabilities || {}
    let sec = 5
    if (cap.network) sec -= 1
    if (cap.telemetry) sec -= 2
    sec -= Math.min(gaps.filter(g => g.includes('许可证')).length, 5)
    scores.security = Math.max(0, sec)

    const does = manifest.scope?.does || []
    let sc = does.length === 1 ? 5 : does.length === 2 ? 4 : does.length === 3 ? 3 : 2
    if (!(manifest.scope?.doesNot || []).length) sc -= 2
    if (gaps.some(g => g.includes('insert id 冲突'))) sc -= 2
    scores.scope = Math.max(0, sc)

    scores.cost = license && OSI.has(license) ? (manifest.cost?.paid ? 3 : 5) : 0
    scores.activity = activityScore(pushedAt)
    scores.compatibility = opts.compatibility ?? null
  }

  return { pass: gaps.length === 0, gaps, info, scores, manifest }
}

export async function initManifest(dir) {
  const target = path.join(dir, 'whalepicks.json')
  if (existsSync(target)) throw new Error('whalepicks.json 已存在（--force 覆盖不提供，请手工编辑）')
  const pkgPath = path.join(dir, 'package.json')
  if (!existsSync(pkgPath)) throw new Error('目录下没有 package.json，--init 无法推断')
  const pkg = JSON.parse(await readFile(pkgPath, 'utf8'))
  const repoUrl = (pkg.repository?.url || '').replace(/^git\+/, '').replace(/\.git$/, '')
  const patchText = existsSync(path.join(dir, 'cordis.patch.yml')) ? await readFile(path.join(dir, 'cordis.patch.yml'), 'utf8') : ''
  const insertIds = extractInsertIds(patchText)
  const profile = pkg.dsh?.client?.platform === 'web' ? 'web' : 'any'
  const manifest = {
    schemaVersion: '1.0',
    id: pkg.name || 'TODO-plugin-id',
    name: pkg.name || 'TODO-plugin-name',
    version: pkg.version || '0.0.0',
    description: { zh: 'TODO: 一句话中文描述', en: 'TODO: one-line English description' },
    category: 'other',
    keywords: pkg.keywords || [],
    scope: {
      does: ['TODO: 一句话说明它做的唯一一件事'],
      doesNot: ['TODO: 明确它不做什么'],
    },
    install: { profile, spec: pkg.name || 'TODO' },
    runtime: { platforms: profile === 'web' ? ['web'] : ['web'], dsh: '>=0.1.0-rc.6 <0.2.0' },
    patches: {
      bundle: 'cordis.patch.yml',
      insertIds,
      namespaces: [pkg.name || 'TODO'],
      slots: [],
    },
    capabilities: { network: false, telemetry: false, permissions: [] },
    cost: { license: pkg.license || 'TODO', paid: false, paidTiers: [] },
    links: { repo: repoUrl || 'TODO', npm: pkg.name ? 'https://www.npmjs.com/package/' + pkg.name : undefined },
    maintainers: [{ name: 'TODO: your name', contact: 'TODO: github/email' }],
  }
  await writeFile(target, JSON.stringify(manifest, null, 2) + '\n')
  return {
    written: target,
    todos: [
      '补齐 description.zh/en',
      'scope.does / doesNot 改成真实声明（Unix 单功能合同）',
      'category 从 other 改成真实分类',
      'capabilities.network / telemetry 按事实填写',
      'maintainers 填真实信息',
      '再跑 node scripts/check-plugin.mjs <dir> 看差距清单',
    ],
  }
}

// CLI
const args = process.argv.slice(2)
const asJson = args.includes('--json')
if (args.includes('--init')) {
  const dir = path.resolve(args.find(a => !a.startsWith('--')) || '.')
  const out = await initManifest(dir)
  console.log('已生成 ' + out.written)
  for (const t of out.todos) console.log(' - TODO ' + t)
  process.exit(0)
}
if (import.meta.url === pathToFileURL(process.argv[1]).href && args.length) {
  const dir = path.resolve(args.find(a => !a.startsWith('--')) || '.')
  let registry = null
  const registryPath = path.join(REPO, 'data', 'plugins.json')
  if (existsSync(registryPath)) registry = JSON.parse(await readFile(registryPath, 'utf8'))
  const report = await evaluatePlugin(dir, { registry })
  if (asJson) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    console.log(report.pass ? '✅ 门槛 PASS — 鲸选合规' : '❌ 门槛 FAIL — 差距清单:')
    for (const g of report.gaps) console.log('   - ' + g)
    for (const i of report.info) console.log('   ℹ ' + i)
    if (report.scores) {
      console.log('六轴机器分: ' + JSON.stringify(report.scores))
    }
  }
  process.exit(report.pass ? 0 : 1)
}
