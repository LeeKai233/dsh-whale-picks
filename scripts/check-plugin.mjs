// check-plugin.mjs — the whale-picks admission gate (spec compliance, one-vote veto)
// and machine-score evaluator. Zero runtime dependencies (Node built-ins + ajv).
//
// Usage:
//   node scripts/check-plugin.mjs <plugin-dir>            evaluate; exit 0 = compliant
//   node scripts/check-plugin.mjs <plugin-dir> --strict   gate + structure + build/test smoke; exit 0 = strict pass
//   node scripts/check-plugin.mjs <plugin-dir> --init     generate whalepicks.json skeleton
//   node scripts/check-plugin.mjs <plugin-dir> --json     machine-readable report
//
// Six-axis scores produced here: security, scope (边界与冲突), cost, activity,
// compatibility (only when the store registry knows a verified state), and human
// (always null — humans only). The store's compute-scores.mjs consumes these.
//
// Report sections: gaps (门槛/strict 裁决), info, scores, signals (静态信号扫描 —
// 提示性质，永远不影响 exit code；--strict 也不升级 signals)。
// The CLI entry (--init / --structure / gate / --strict) is guarded by
// `process.argv[1] === this file` so importing the exported functions
// (compute-scores.mjs, freshness.mjs) never triggers argv side effects.
import { readFile, writeFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv from 'ajv'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '..')
const SCHEMA_URL = new URL('../spec/whalepicks.schema.json', import.meta.url)

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || ''
const GH_HEADERS = {
  'User-Agent': 'dsh-whale-picks-check/1.0',
  Accept: 'application/vnd.github+json',
  ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
}

const OSI = new Set([
  'MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'MPL-2.0', 'LGPL-2.1', 'LGPL-3.0',
  'GPL-2.0', 'GPL-3.0', 'AGPL-3.0', 'EPL-2.0', 'CDDL-1.0', 'Zlib', '0BSD', 'Unlicense',
])

export function extractInsertIds(patchText) {
  // Line-based state machine for the fixed cordis patch shape (see
  // templates/plugin/cordis.patch.yml):
  //   - insert:
  //       - id: <id>
  //         name: "..."
  // Only `id:` values INSIDE `- insert:` list items are collected; an `id:`
  // anywhere else in the file (other lists, comments are skipped too) is not
  // part of the conflict surface.
  const ids = []
  let inInsert = false
  let insertIndent = -1
  for (const line of patchText.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const indent = line.length - line.trimStart().length
    if (/^\s*-\s*insert\s*:/.test(line)) {
      inInsert = true
      insertIndent = indent
      continue
    }
    if (!inInsert) continue
    if (indent <= insertIndent) {
      inInsert = false // dedent closed the insert block
      continue
    }
    const m = line.match(/^\s*-\s*id:\s*['"]?([A-Za-z0-9_.@/-]+)/)
    if (m) ids.push(m[1])
  }
  return ids
}

// Two-way consistency between manifest patches.insertIds and the ids actually
// present in the bundle patch. Shared by the admission gate and the
// --structure loading-layer check (single implementation, no copies).
export function diffInsertIds(declaredIds, actualIds) {
  const issues = []
  const declared = new Set(declaredIds)
  for (const id of actualIds) if (!declared.has(id)) issues.push('cordis.patch.yml 的 insert id "' + id + '" 未列入 patches.insertIds')
  for (const id of declared) if (!actualIds.includes(id)) issues.push('patches.insertIds 中的 "' + id + '" 在 patch 文件中不存在')
  return issues
}

// --- runtime.dsh semver-range subset (zero-dep): comparator sets like ">=0.1.0-rc.6 <0.2.0" ---
const CMP_RE = /^(>=|<=|>|<|=)?\s*(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/

function parseComparatorSet(range) {
  const parts = String(range).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return null
  const out = []
  for (const p of parts) {
    const m = p.match(CMP_RE)
    if (!m) return null
    out.push({ op: m[1] || '=', major: +m[2], minor: +m[3], patch: +m[4], pre: m[5] || null })
  }
  return out
}

function cmpPrerelease(a, b) {
  if (a === b) return 0
  if (a === null) return 1 // release > prerelease
  if (b === null) return -1
  const as = a.split('.'), bs = b.split('.')
  for (let i = 0; i < Math.max(as.length, bs.length); i++) {
    if (i >= as.length) return -1
    if (i >= bs.length) return 1
    const an = /^\d+$/.test(as[i]), bn = /^\d+$/.test(bs[i])
    if (an && bn) { const d = +as[i] - +bs[i]; if (d) return d < 0 ? -1 : 1 }
    else if (an !== bn) return an ? -1 : 1 // numeric identifiers rank below alphanumeric
    else if (as[i] !== bs[i]) return as[i] < bs[i] ? -1 : 1
  }
  return 0
}

function cmpVersions(a, b) {
  for (const k of ['major', 'minor', 'patch']) {
    if (a[k] !== b[k]) return a[k] < b[k] ? -1 : 1
  }
  return cmpPrerelease(a.pre, b.pre)
}

function satisfiesComparatorSet(version, comparators) {
  const v = parseComparatorSet(version)?.[0]
  if (!v) return null // version itself unparseable
  for (const c of comparators) {
    const d = cmpVersions(v, c)
    if (c.op === '>=' && d < 0) return false
    if (c.op === '<=' && d > 0) return false
    if (c.op === '>' && d <= 0) return false
    if (c.op === '<' && d >= 0) return false
    if (c.op === '=' && d !== 0) return false
  }
  return true
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
    gaps.push(...diffInsertIds(manifest.patches?.insertIds || [], actualInsertIds))
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

  // runtime.dsh: range format check + coverage hint vs the store-maintained dsh version
  const dshRange = manifest.runtime?.dsh
  if (typeof dshRange === 'string' && dshRange.trim()) {
    const comparators = parseComparatorSet(dshRange)
    if (!comparators) {
      info.push('⚠️ runtime.dsh 无法解析（支持空格分隔的比较器集，如 ">=0.1.0-rc.6 <0.2.0"）: ' + dshRange)
    } else if (registry?.dshVersion) {
      const covered = satisfiesComparatorSet(registry.dshVersion, comparators)
      if (covered === true) info.push('runtime.dsh 范围覆盖当前商店维护版本 ' + registry.dshVersion)
      else if (covered === false) info.push('⚠️ runtime.dsh 范围不覆盖当前商店维护版本 ' + registry.dshVersion + ': ' + dshRange)
    }
  }

  // GitHub activity facts (activity axis + maintenance gate signal)
  let pushedAt = opts.pushedAt ?? null
  let archived = opts.archived ?? false
  const ghMatch = (manifest.links?.repo || '').match(/github\.com\/([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)/)
  if (!pushedAt && ghMatch) {
    try {
      const res = await fetch('https://api.github.com/repos/' + ghMatch[1], { headers: GH_HEADERS })
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
  const clientPlatform = pkg.dsh?.client?.platform
  const profile = clientPlatform === 'web' ? 'web' : 'any'
  const manifest = {
    schemaVersion: '1.1',
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
    runtime: {
      // platform 从 package.json 的 dsh.client.platform 读取；缺失/非法才默认 ['web']
      platforms: ['web', 'tui', 'headless'].includes(clientPlatform) ? [clientPlatform] : ['web'],
      dsh: '>=0.1.0-rc.6 <0.2.0',
    },
    patches: {
      bundle: 'cordis.patch.yml',
      insertIds,
      namespaces: [pkg.name || 'TODO'],
      slots: [],
    },
    capabilities: { network: false, telemetry: false, permissions: [] },
    deps: [],
    perf: { polls: {}, memoryEstimateMB: 2, gpu: false, timers: 0 },
    // security 字段由商店侧体检管道填写（registry security 为准），--init 不再预填
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

/**
 * Template-alignment report (whale-picks plugin paradigm, --structure mode).
 * REPORT ONLY — never a gate: the admission gate stays manifest-fact-based.
 * Each check asserts one fixed section of the paradigm skeleton.
 * Returns structured checks: { id, ok, message }[] — --structure prints them
 * (always exit 0), --strict merges the non-ok ones into the gate's gaps.
 */
export async function structureReport(dir) {
  const checks = []
  const ok = (id, message = '') => checks.push({ id, ok: true, message })
  const warn = (id, message) => checks.push({ id, ok: false, message })
  const read = (rel) => existsSync(path.join(dir, rel))
    ? readFile(path.join(dir, rel), 'utf8')
    : Promise.resolve('')
  const list = async (rel) => {
    if (!existsSync(path.join(dir, rel))) return []
    return await readdir(path.join(dir, rel))
  }
  // recursive walk (src/client purity/CJK must see nested directories too)
  const listRecursive = async (rel) => {
    const out = []
    const walk = async (sub) => {
      if (!existsSync(path.join(dir, sub))) return
      for (const entry of await readdir(path.join(dir, sub), { withFileTypes: true })) {
        const r = path.join(sub, entry.name)
        if (entry.isDirectory()) await walk(r)
        else out.push(r)
      }
    }
    await walk(rel)
    return out
  }

  let manifest = null
  if (existsSync(path.join(dir, 'whalepicks.json'))) {
    try {
      manifest = JSON.parse(await read('whalepicks.json'))
    } catch (e) {
      warn('清单 whalepicks.json', '非法 JSON: ' + e.message)
    }
  }

  // -- contract layer
  if (manifest) {
    if (manifest.schemaVersion === '1.1') ok('清单 schemaVersion', '1.1（含 deps/perf/security）')
    else warn('清单 schemaVersion', '建议 1.1（deps/perf/security 供通用体检读取），当前 ' + (manifest.schemaVersion ?? '缺失'))
  } else if (!checks.some((c) => c.id === '清单 whalepicks.json')) {
    warn('清单 schemaVersion', 'whalepicks.json 缺失')
  }

  // -- package facts
  let hostOnly = false
  if (!existsSync(path.join(dir, 'package.json'))) {
    warn('package.json', '缺失')
  } else {
    const pkg = JSON.parse(await read('package.json'))
    const dsh = pkg.dsh ?? {}
    // Host-only shape: no dsh.client block and no src/client — the browser-half
    // assertions below become documented exemptions (paradigm symmetric exemption).
    hostOnly = !dsh.client && !existsSync(path.join(dir, 'src/client'))
    if (hostOnly) {
      if (dsh.bundle?.patch) ok('dsh 块', '宿主态插件：bundle.patch 已声明（无 dsh.client，浏览器半区豁免）')
      else warn('dsh 块', '缺少 bundle.patch 路径')
      ok('exports "./client"', '宿主态插件豁免（无浏览器半区）')
    } else if (dsh.client?.platform === 'web' && Array.isArray(dsh.client.inject) && dsh.client.inject.length > 0 && dsh.bundle?.patch) {
      ok('dsh.client 块', 'platform=web、inject 已声明、bundle.patch 已声明')
    } else {
      warn('dsh.client 块', '需声明 platform=web、inject 服务列表与 bundle.patch 路径')
    }
    if (!hostOnly) {
      if (pkg.exports?.['./client']) ok('exports "./client"', pkg.exports['./client'])
      else warn('exports "./client"', '客户端半区必须通过 ./client 暴露')
    }
    if (typeof pkg.scripts?.bundle === 'string' && pkg.scripts.bundle.includes('tsdown')) ok('build 脚本', 'bundle = tsdown')
    else warn('build 脚本', '缺少 tsdown 构建脚本')
    if (typeof pkg.scripts?.test === 'string' && pkg.scripts.test.includes('vitest')) ok('test 脚本', 'test = vitest')
    else warn('test 脚本', '缺少 vitest 测试脚本')
    if (Array.isArray(pkg.files) && pkg.files.includes('whalepicks.json')) ok('files 含 whalepicks.json', '合同随包分发')
    else warn('files 含 whalepicks.json', '发布包应带上 whalepicks.json（上架合同）')
  }

  // -- loading layer: reuse the gate's extractInsertIds/diffInsertIds —
  // assert no duplicate insert ids and two-way manifest consistency.
  const bundleRel = manifest?.patches?.bundle || 'cordis.patch.yml'
  if (!existsSync(path.join(dir, bundleRel))) {
    warn('装载层 bundle patch', bundleRel + ' 缺失（装载层）')
  } else {
    const actual = extractInsertIds(await read(bundleRel))
    const dupes = [...new Set(actual.filter((id, i) => actual.indexOf(id) !== i))]
    const issues = diffInsertIds(manifest?.patches?.insertIds ?? [], actual)
    if (dupes.length === 0 && issues.length === 0) {
      ok('装载层 insert ids', actual.length + ' 个，无重复且与 manifest 双向一致')
    } else {
      warn('装载层 insert ids', dupes.map((d) => 'patch 内重复 id "' + d + '"').concat(issues).join('；'))
    }
  }

  // -- host half
  if (existsSync(path.join(dir, 'src/index.ts'))) ok('宿主半区 src/index.ts', '存在')
  else warn('宿主半区 src/index.ts', '缺失')

  // -- browser half
  if (hostOnly) ok('浏览器半区 src/client/index.ts', '宿主态插件豁免（无 dsh.client 块）')
  else if (existsSync(path.join(dir, 'src/client/index.ts'))) ok('浏览器半区 src/client/index.ts', '存在')
  else warn('浏览器半区 src/client/index.ts', '缺失')

  // -- copy layer
  const localesText = await read('src/client/locales.ts')
  if (hostOnly) ok('locale zh/en 双词典', '宿主态插件豁免（无浏览器文案）')
  else if (localesText.includes('zh') && localesText.includes('en')) ok('locale zh/en 双词典', 'src/client/locales.ts')
  else warn('locale zh/en 双词典', 'src/client/locales.ts 需导出 zh 与 en')
  if (existsSync(path.join(dir, 'README.zh.md'))) ok('README 双语', 'README.md + README.zh.md')
  else warn('README 双语', '缺少 README.zh.md')

  // -- verification layer
  if (existsSync(path.join(dir, 'vitest.config.ts'))) ok('vitest 配置', '存在')
  else warn('vitest 配置', '缺失（验证层）')
  const testFiles = (await list('tests')).filter((f) => f.endsWith('.spec.ts') || f.endsWith('.spec.tsx'))
  if (testFiles.length > 0) ok('测试文件', testFiles.length + ' 个 spec')
  else warn('测试文件', 'tests/ 下暂无 spec（passWithNoTests 只是开发期豁免）')

  // -- repo-convention layer
  for (const f of ['AGENTS.md', 'tsconfig.json', 'LICENSE']) {
    if (existsSync(path.join(dir, f))) ok(f, '存在')
    else warn(f, '缺失（仓库规范层）')
  }
  const gitignore = await read('.gitignore')
  if (/^lib\/$/m.test(gitignore)) ok('.gitignore 忽略 lib/', '构建产物不入库')
  else warn('.gitignore 忽略 lib/', '模板约定 lib/ 不入库')

  // -- build config
  const tsdown = await read('tsdown.config.ts')
  if (hostOnly) ok('tsdown 双产物包装', '宿主态插件豁免（单产物 lib/index.js）')
  else if (tsdown.includes('window.__ModuleLoader__')) ok('tsdown 双产物包装', 'window.__ModuleLoader__ banner 存在')
  else warn('tsdown 双产物包装', '缺少 __ModuleLoader__ banner（浏览器半区无法装载）')

  // -- client bundle purity (recursive over src/client)
  const PLATFORM_RE = /^(react(\/.*)?|react-dom(\/.*)?|@deepseek-ai\/cordis|@deepseek-ai\/dsh-client-runtime\/client|@deepseek-ai\/dsh-client-[a-z-]+(\/.*)?)$/
  const clientFiles = (await listRecursive('src/client')).filter((f) => /\.(ts|tsx|js|jsx)$/.test(f))
  const nonPlatform = new Set()
  for (const f of clientFiles) {
    const text = await read(f)
    for (const m of text.matchAll(/from\s+['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]/g)) {
      const spec = m[1] ?? m[2]
      if (spec === undefined || spec.startsWith('.')) continue
      if (!PLATFORM_RE.test(spec)) nonPlatform.add(spec)
    }
  }
  if (nonPlatform.size === 0) ok('client bundle purity', 'src/client 仅 import 平台模块')
  else warn('client bundle purity', '非平台 import: ' + [...nonPlatform].join(', '))

  // -- copy leak: CJK literals outside locales/comments (recursive)
  const cjkLeaks = []
  for (const f of clientFiles) {
    if (path.basename(f) === 'locales.ts') continue
    let text = await read(f)
    text = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/^\s*\*.*$/gm, '')
    if (/[\u4e00-\u9fff]/.test(text)) cjkLeaks.push(f)
  }
  if (cjkLeaks.length === 0) ok('文案无硬编码中文', 'locales.ts 之外无 CJK 字面量')
  else warn('文案无硬编码中文', '发现硬编码中文: ' + cjkLeaks.join(', ') + '（应进 locales.ts zh/en 词典）')

  return { checks, clean: checks.every((c) => c.ok) }
}

/**
 * Static signal scan (提示信号 — never a gate, never a --strict gap).
 * Recursively scans <dir>/src/**.{ts,tsx,js,jsx,mjs,cjs} (skipping
 * node_modules/lib/tests) for network/danger fingerprints and cross-checks
 * them against the manifest's capabilities.network declaration.
 * Returns [{ level: 'info' | 'warning' | 'danger', message }].
 */
const SIGNAL_PATTERNS = [
  { re: /\bfetch\s*\(/, kind: 'network', label: 'fetch(' },
  { re: /XMLHttpRequest/, kind: 'network', label: 'XMLHttpRequest' },
  { re: /sendBeacon/, kind: 'network', label: 'sendBeacon' },
  { re: /WebSocket/, kind: 'network', label: 'WebSocket' },
  { re: /\beval\s*\(/, kind: 'danger', label: 'eval(' },
  { re: /new\s+Function\b/, kind: 'danger', label: 'new Function' },
]

async function collectSignalSources(srcDir, base = srcDir) {
  const out = []
  if (!existsSync(srcDir)) return out
  for (const entry of await readdir(srcDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (['node_modules', 'lib', 'tests'].includes(entry.name)) continue
      out.push(...await collectSignalSources(path.join(srcDir, entry.name), base))
    } else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) {
      out.push(path.join(srcDir, entry.name))
    }
  }
  return out
}

export async function scanSignals(dir) {
  const signals = []
  let networkDeclared = null
  try {
    const manifest = JSON.parse(await readFile(path.join(dir, 'whalepicks.json'), 'utf8'))
    if (typeof manifest.capabilities?.network === 'boolean') networkDeclared = manifest.capabilities.network
  } catch {
    // no readable manifest — declaration unknown, signals stay informational
  }
  for (const file of await collectSignalSources(path.join(dir, 'src'))) {
    const rel = path.relative(dir, file)
    const lines = (await readFile(file, 'utf8')).split(/\r?\n/)
    lines.forEach((lineText, i) => {
      const at = rel + ':' + (i + 1)
      for (const s of SIGNAL_PATTERNS) {
        if (!s.re.test(lineText)) continue
        if (s.kind === 'danger') {
          signals.push({ level: 'danger', message: '危险特征 ' + s.label + '（' + at + '）— 无论声明如何都需人工裁决' })
        } else if (networkDeclared === false) {
          signals.push({ level: 'warning', message: '声明 network=false 但源码出现网络特征 ' + s.label + '（' + at + '）' })
        } else if (networkDeclared === true) {
          signals.push({ level: 'info', message: '网络特征 ' + s.label + '（' + at + '）与 network=true 声明一致' })
        } else {
          signals.push({ level: 'info', message: '网络特征 ' + s.label + '（' + at + '），capabilities.network 未声明' })
        }
      }
    })
  }
  return signals
}

/** --strict build smoke: npm run bundle, then assert the dual artifacts. */
async function buildSmokeGaps(dir) {
  const gaps = []
  if (!existsSync(path.join(dir, 'node_modules'))) {
    gaps.push('依赖未安装，构建冒烟未执行（先 npm install）')
    return gaps
  }
  const run = spawnSync('npm', ['run', 'bundle'], { cwd: dir, encoding: 'utf8', timeout: 300000 })
  if (run.error || run.status !== 0) {
    const tail = ((run.stderr || '') + (run.stdout || '')).trim().split(/\r?\n/).slice(-5).join(' | ')
    gaps.push('构建冒烟失败: npm run bundle ' + (run.error ? run.error.message : 'exit ' + run.status) + (tail ? ' — ' + tail.slice(0, 400) : ''))
    return gaps
  }
  // Host-only plugins (no dsh.client block, no src/client) build a single artifact.
  let hostOnly = false
  try {
    const pkg = JSON.parse(await readFile(path.join(dir, 'package.json'), 'utf8'))
    hostOnly = !pkg.dsh?.client && !existsSync(path.join(dir, 'src/client'))
  } catch { /* unreadable package.json — treat as dual-artifact */ }
  if (!existsSync(path.join(dir, 'lib/index.js'))) gaps.push('构建冒烟: 缺少产物 lib/index.js')
  if (hostOnly) return gaps
  if (!existsSync(path.join(dir, 'lib/client.js'))) gaps.push('构建冒烟: 缺少产物 lib/client.js')
  const clientPath = path.join(dir, 'lib/client.js')
  if (existsSync(clientPath)) {
    const client = await readFile(clientPath, 'utf8')
    if (!client.includes('__ModuleLoader__.load')) gaps.push('构建冒烟: lib/client.js 不含 __ModuleLoader__.load 包装（浏览器半区无法装载）')
  }
  return gaps
}

/** --strict test assertions: spec files exist + no passWithNoTests exemption. */
async function testAssertionGaps(dir) {
  const gaps = []
  const testsDir = path.join(dir, 'tests')
  const specs = existsSync(testsDir) ? (await readdir(testsDir)).filter((f) => f.endsWith('.spec.ts') || f.endsWith('.spec.tsx')) : []
  if (specs.length === 0) gaps.push('tests/ 下至少需要一个 *.spec.* 文件')
  for (const cfg of ['vitest.config.ts', 'vitest.config.mts', 'vitest.config.js', 'vitest.config.mjs']) {
    const p = path.join(dir, cfg)
    if (existsSync(p) && /passWithNoTests\s*:\s*true/.test(await readFile(p, 'utf8'))) {
      gaps.push(cfg + ' 含 passWithNoTests: true —— passWithNoTests 仅限开发期豁免')
    }
  }
  return gaps
}

/**
 * --strict report: admission gate + every structureReport assertion +
 * build smoke + test assertions, all merged into gaps (any gap => exit 1).
 * Signals stay advisory and are NOT merged (提示信号，不是裁决).
 */
export async function strictReport(dir, opts = {}) {
  const gate = await evaluatePlugin(dir, opts)
  const structure = await structureReport(dir)
  const gaps = [...gate.gaps]
  for (const c of structure.checks) {
    if (!c.ok) gaps.push('structure: ' + c.id + ' — ' + (c.message || '未通过'))
  }
  gaps.push(...await buildSmokeGaps(dir))
  gaps.push(...await testAssertionGaps(dir))
  return { pass: gaps.length === 0, gaps, info: gate.info, scores: gate.scores, manifest: gate.manifest, structure }
}

// CLI — guarded so importing this module (compute-scores/freshness) never
// triggers --init/--structure/gate side effects from someone else's argv.
const isMain = typeof process.argv[1] === 'string' && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const args = process.argv.slice(2)
  const asJson = args.includes('--json')
  if (args.length === 0) {
    console.log('用法: node scripts/check-plugin.mjs <plugin-dir> [--strict|--structure|--json|--init]')
    process.exit(0)
  }
  if (args.includes('--init')) {
    const dir = path.resolve(args.find(a => !a.startsWith('--')) || '.')
    const out = await initManifest(dir)
    console.log('已生成 ' + out.written)
    for (const t of out.todos) console.log(' - TODO ' + t)
    process.exit(0)
  }
  const dir = path.resolve(args.find(a => !a.startsWith('--')) || '.')
  if (args.includes('--structure')) {
    const report = await structureReport(dir)
    console.log(report.clean ? '✅ 模板对齐 — 范式结构齐全' : '⚠️ 模板对齐报告（只报告，不进门槛）:')
    for (const c of report.checks) console.log((c.ok ? '   ✅ ' : '   ⚠️ ') + c.id + (c.message ? ' — ' + c.message : ''))
    process.exit(0)
  }
  let registry = null
  const registryPath = path.join(REPO, 'data', 'plugins.json')
  if (existsSync(registryPath)) registry = JSON.parse(await readFile(registryPath, 'utf8'))
  const strict = args.includes('--strict')
  const report = strict ? await strictReport(dir, { registry }) : await evaluatePlugin(dir, { registry })
  const signals = await scanSignals(dir)
  if (asJson) {
    console.log(JSON.stringify({ ...report, signals }, null, 2))
  } else {
    console.log(report.pass
      ? (strict ? '✅ 严格模式 PASS — 门槛 + 结构 + 构建/测试冒烟全绿' : '✅ 门槛 PASS — 鲸选合规')
      : (strict ? '❌ 严格模式 FAIL — 差距清单:' : '❌ 门槛 FAIL — 差距清单:'))
    for (const g of report.gaps) console.log('   - ' + g)
    for (const i of report.info) console.log('   ℹ ' + i)
    if (report.scores) {
      console.log('六轴机器分: ' + JSON.stringify(report.scores))
    }
    console.log('signals（静态信号扫描，不影响门槛）:')
    if (signals.length === 0) console.log('   (无网络/危险特征命中)')
    for (const s of signals) console.log('   [' + s.level + '] ' + s.message)
  }
  process.exit(report.pass ? 0 : 1)
}
