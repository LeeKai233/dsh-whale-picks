// compute-scores.mjs — programmatic six-axis evaluation.
// For every registry entry it fetches whalepicks.json / package.json / the
// bundle patch (manifest-declared patches.bundle path, falling back to
// cordis.patch.yml) from the entry's repo, re-runs the admission gate
// (check-plugin), and writes back:
//   manifestCompliant (gate), specVersion, patches (conflict surface), and the five
//   machine axes (security/scope/cost/activity/compatibility). The human axis is
//   preserved from the registry (founder/community ratings only).
// Robustness: a single entry's invalid JSON / fetch failure never crashes the
// batch — the entry keeps its old scores and a warning is printed.
// security.redFlags: a non-empty registry redFlags list caps the security axis
// at min(computed, 2) and appends the flag count to the axis evidence.
import { readFile, writeFile, mkdtemp, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { evaluatePlugin } from './check-plugin.mjs'

const registryFile = new URL('../data/plugins.json', import.meta.url)
const registry = JSON.parse(await readFile(registryFile, 'utf8'))
const today = new Date().toISOString().slice(0, 10)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || ''
const GH_HEADERS = {
  'User-Agent': 'dsh-whale-picks-scores/1.0',
  Accept: 'application/vnd.github+json',
  ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
}

async function fetchRepoFile(repo, branch, file) {
  const res = await fetch(`https://raw.githubusercontent.com/${repo}/${branch}/${file}`, { headers: GH_HEADERS })
  return res.status === 200 ? await res.text() : null
}

async function fetchWithFallback(repo, file) {
  for (const branch of ['main', 'master']) {
    const text = await fetchRepoFile(repo, branch, file)
    if (text !== null) return text
  }
  return null
}

function mergeAxis(oldAxis, next) {
  if (next == null) return oldAxis ?? null
  if (oldAxis && oldAxis.value === next.value) return oldAxis // stable updatedAt
  return next
}

function compatibilityAxis(e) {
  if (!e.verifiedAgainst || !e.lastVerified) {
    return { value: null, evidence: '创始人尚未实测当前 dsh 版本（待测）', updatedAt: today }
  }
  const days = (Date.now() - new Date(e.lastVerified).getTime()) / 86400000
  const current = e.verifiedAgainst === registry.dshVersion
  if (current && days < 90) return { value: 5, evidence: `实测于 dsh ${e.verifiedAgainst}（${e.lastVerified}）`, updatedAt: today }
  if (current && days < 180) return { value: 4, evidence: `实测于 dsh ${e.verifiedAgainst}，但复核已 ${Math.floor(days)} 天`, updatedAt: today }
  return { value: 3, evidence: `上次实测 dsh ${e.verifiedAgainst}（${e.lastVerified}），与当前 ${registry.dshVersion} 不一致`, updatedAt: today }
}

function securityAxis(e, computed) {
  if (computed == null) return null
  const redFlags = Array.isArray(e.security?.redFlags) ? e.security.redFlags : []
  let evidence = '机器体检映射：网络/遥测声明 + 许可证（详见 security-report.md）'
  let value = computed
  if (redFlags.length) {
    // rubric: 0 = 有未解决红旗；≤2 是折中（红旗存在即压低，不直接归零）
    value = Math.min(computed, 2)
    evidence += `；存在未解决红旗（${redFlags.length} 条）`
  }
  return { value, evidence, updatedAt: today }
}

for (const e of registry.plugins) {
  const manifestText = await fetchWithFallback(e.repo, 'whalepicks.json')
  if (manifestText === null) {
    // 拉不到清单：保留旧分与原 updatedAt（不造假），但必须留下显式日志
    e.manifestCompliant = false
    console.warn(`⚠ ${e.id}: 拉不到 whalepicks.json（main/master 均失败），跳过本次重算 — 保留旧分与原 updatedAt；manifestCompliant=false`)
    continue
  }
  const tmp = await mkdtemp(path.join(tmpdir(), 'whale-check-'))
  try {
    let declaredBundle = 'cordis.patch.yml'
    try {
      declaredBundle = JSON.parse(manifestText).patches?.bundle || 'cordis.patch.yml'
    } catch (err) {
      console.warn(`⚠ ${e.id}: whalepicks.json 非法 JSON（${err.message}），保留旧分并跳过`)
      continue
    }
    const pkgText = await fetchWithFallback(e.repo, 'package.json')
    let patchText = await fetchWithFallback(e.repo, declaredBundle)
    if (patchText === null && declaredBundle !== 'cordis.patch.yml') {
      patchText = await fetchWithFallback(e.repo, 'cordis.patch.yml')
      if (patchText !== null) console.log(`ℹ ${e.id}: 自声明 bundle 路径 ${declaredBundle} 拉取失败，回退 cordis.patch.yml`)
    }

    await writeFile(path.join(tmp, 'whalepicks.json'), manifestText)
    if (pkgText !== null) await writeFile(path.join(tmp, 'package.json'), pkgText)
    if (patchText !== null) {
      const patchTarget = path.join(tmp, declaredBundle)
      await mkdir(path.dirname(patchTarget), { recursive: true })
      await writeFile(patchTarget, patchText)
    }
    const report = await evaluatePlugin(tmp, {
      registry,
      pushedAt: e.pushedAt,
      archived: e.archived,
      compatibility: null,
      skipFileChecks: true,
    })
    e.manifestCompliant = report.pass
    e.specVersion = report.manifest?.schemaVersion ?? null
    e.patches = {
      insertIds: report.manifest?.patches?.insertIds ?? [],
      namespaces: report.manifest?.patches?.namespaces ?? [],
      slots: report.manifest?.patches?.slots ?? [],
    }
    const s = report.scores
    const human = e.radar?.human ?? { value: null, source: 'founder', count: 0, evidence: '待创始人/社区评分', updatedAt: today }
    const prev = e.radar
    e.radar = {
      human,
      security: mergeAxis(prev?.security, securityAxis(e, s?.security ?? null)),
      scope: mergeAxis(prev?.scope, s?.scope != null ? { value: s.scope, evidence: 'scope.does/doesNot 单功能声明 + insert id 交叉冲突检测', updatedAt: today } : null),
      cost: mergeAxis(prev?.cost, s?.cost != null ? { value: s.cost, evidence: '许可证（SPDX）与付费墙声明', updatedAt: today } : null),
      activity: mergeAxis(prev?.activity, s?.activity != null ? { value: s.activity, evidence: 'pushed_at ' + e.pushedAt + ' 映射', updatedAt: today } : null),
      compatibility: mergeAxis(prev?.compatibility, compatibilityAxis(e)),
    }
    console.log(`${report.pass ? '✓' : '✗'} ${e.id}: gate ${report.pass ? 'PASS' : 'FAIL'} ${report.gaps.length ? '· gaps: ' + report.gaps.slice(0, 3).join('; ') : ''}`)
  } catch (err) {
    // 单个条目的失败（非法 package.json、evaluatePlugin 异常等）不得让整个批次崩溃
    console.warn(`⚠ ${e.id}: 评分失败（${err.message}），保留旧分并跳过`)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
}

registry.updatedAt = today
await writeFile(registryFile, JSON.stringify(registry, null, 2) + '\n')
console.log(`scores written (${registry.plugins.length} entries)`)
