// compute-scores.mjs — programmatic nine-machine-axis evaluation (+ preserved human axis).
// For every registry entry it fetches whalepicks.json / package.json / README.zh.md /
// the bundle patch (manifest-declared patches.bundle path, falling back to
// cordis.patch.yml) from the entry's repo, re-runs the admission gate
// (check-plugin), and writes back:
//   manifestCompliant (gate), specVersion, patches (conflict surface), and the nine
//   paradigm machine axes (producibility/adoptability/baseline/distribution/
//   composition/safety/footprint/freshness/remedy). The human axis is preserved
//   from the registry (founder/community ratings only).
// Robustness: a single entry's invalid JSON / fetch failure never crashes the
// batch — the entry keeps its old scores and a warning is printed.
// safety axis: a non-empty registry redFlags list caps the axis at
// min(computed, 2) and appends the flag count to the axis evidence.
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

// 生产 Producibility：范式对齐度（manifest 版本 + 合同随包分发 + dsh 块完整）
function producibilityAxis(manifest, pkg) {
  let value = 5
  const gaps = []
  if (manifest?.schemaVersion !== '1.1') { value -= 1; gaps.push('manifest schemaVersion=' + (manifest?.schemaVersion ?? '缺失') + '（≠1.1）') }
  if (!Array.isArray(pkg?.files) || !pkg.files.includes('whalepicks.json')) { value -= 2; gaps.push('package.json files 未含 whalepicks.json') }
  // host-only 判定同 check-plugin：无 dsh.client 且无 src/client（远程模式下以无 dsh.client 为准）
  const dsh = pkg?.dsh ?? {}
  const hostOnly = !dsh.client
  const dshComplete = Boolean(dsh.bundle?.patch) && (hostOnly || Boolean(dsh.client))
  if (!dshComplete) { value -= 2; gaps.push(hostOnly ? 'dsh.bundle.patch 缺失' : '非 host-only 却缺 dsh.client 声明') }
  value = Math.max(0, value)
  const evidence = gaps.length === 0
    ? '范式对齐：manifest 1.1 + files 含合同 + dsh 块完整'
    : '范式对齐缺口：' + gaps.join('；')
  return { value, evidence, updatedAt: today }
}

// 迁移 Adoptability：双语文案与安装/链接信息的可拉取事实
function adoptabilityAxis(manifest, zhReadme) {
  let value = 5
  const gaps = []
  if (zhReadme === null) { value -= 2; gaps.push('README.zh.md 拉取不可达') }
  const desc = manifest?.description ?? {}
  if (!(desc.zh && desc.en)) { value -= 2; gaps.push('description 非双语') }
  if (!manifest?.install?.spec) { value -= 1; gaps.push('install.spec 空') }
  if (!Array.isArray(manifest?.keywords) || manifest.keywords.length === 0) { value -= 1; gaps.push('keywords 空') }
  if (!manifest?.links?.repo) { value -= 1; gaps.push('links.repo 空') }
  value = Math.max(0, value)
  const evidence = gaps.length === 0
    ? '双语 README + 双语描述 + install/links 齐全'
    : '迁移缺口：' + gaps.join('；')
  return { value, evidence, updatedAt: today }
}

// 准入 Baseline：check-plugin 门槛结果直映射
function baselineAxis(report) {
  return report.pass
    ? { value: 5, evidence: 'check-plugin 门槛通过', updatedAt: today }
    : { value: 0, evidence: 'check-plugin 门槛未过（gaps ' + report.gaps.length + ' 条）', updatedAt: today }
}

// 分发 Distribution：registry security 事实（npm 发布 + 防冒名指针）
function distributionAxis(e) {
  const npm = e.security?.npmPublished ?? null
  const ptr = e.security?.repoPointerMatch ?? null
  if (npm === null) return { value: 2, evidence: 'npm 发布状态未知', updatedAt: today }
  if (npm === false) return { value: 1, evidence: 'npm 未发布（file:/github 安装）', updatedAt: today }
  return ptr === true
    ? { value: 5, evidence: 'npm 已发布且 repository 指针正确', updatedAt: today }
    : { value: 2, evidence: 'npm 已发布但 repository 指针不符', updatedAt: today }
}

// 组合 Composition：冲突面申报完整度（按 manifest 原始字段判定缺失，非空值）
function compositionAxis(manifest) {
  let value = 5
  const gaps = []
  const mp = manifest?.patches ?? {}
  const ids = mp.insertIds
  if (!Array.isArray(ids)) { value -= 2; gaps.push('insertIds 非数组') }
  if (!('slots' in mp)) { value -= 1; gaps.push('slots 字段缺失') }
  if (!('namespaces' in mp)) { value -= 1; gaps.push('namespaces 字段缺失') }
  if (!('deps' in (manifest ?? {}))) { value -= 1; gaps.push('deps 字段缺失') }
  value = Math.max(0, value)
  const n = Array.isArray(ids) ? ids.length : 0
  const evidence = gaps.length === 0
    ? '冲突面申报：insertIds ' + n + ' 个 + slots/namespaces/deps 已声明'
    : '冲突面申报不全：insertIds ' + n + ' 个；' + gaps.join('；')
  return { value, evidence, updatedAt: today }
}

// 安全 Safety：机器体检映射（网络/遥测声明 + 许可证 gap），未解决红旗压 ≤2
function safetyAxis(e, computed) {
  if (computed == null) return { value: null, evidence: '机器体检缺数据（待测）', updatedAt: today }
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

// 开销 Footprint：perf 申报完整度（polls/memoryEstimateMB/gpu/timers 四键）
function footprintAxis(manifest) {
  const perf = manifest?.perf
  if (!perf) return { value: 2, evidence: '未申报（v1.0 清单）', updatedAt: today }
  const missing = ['polls', 'memoryEstimateMB', 'gpu', 'timers'].filter(k => !(k in perf))
  if (missing.length === 0) return { value: 5, evidence: 'perf 申报（polls/timers/memory/gpu）', updatedAt: today }
  return { value: 3, evidence: 'perf 申报不全（缺 ' + missing.join('/') + '）', updatedAt: today }
}

// 兼容性衰减（freshness 的输入之一；verifiedAgainst/lastVerified）
function compatibilityValue(e) {
  if (!e.verifiedAgainst || !e.lastVerified) return { value: null, evidence: '创始人尚未实测当前 dsh 版本（待测）' }
  const days = (Date.now() - new Date(e.lastVerified).getTime()) / 86400000
  const current = e.verifiedAgainst === registry.dshVersion
  if (current && days < 90) return { value: 5, evidence: `实测于 dsh ${e.verifiedAgainst}（${e.lastVerified}）` }
  if (current && days < 180) return { value: 4, evidence: `实测于 dsh ${e.verifiedAgainst}，但复核已 ${Math.floor(days)} 天` }
  return { value: 3, evidence: `上次实测 dsh ${e.verifiedAgainst}（${e.lastVerified}），与当前 ${registry.dshVersion} 不一致` }
}

// 保鲜 Freshness：活跃度（pushedAt 映射）与兼容性（实测衰减）可用值平均（四舍五入）
function freshnessAxis(e, activity) {
  const compat = compatibilityValue(e)
  const values = []
  const parts = []
  if (activity != null) { values.push(activity); parts.push('pushed_at ' + e.pushedAt + ' 映射') }
  if (compat.value != null) { values.push(compat.value); parts.push(compat.evidence) }
  if (values.length === 0) return { value: null, evidence: 'pushed_at 与实测双缺（待测）', updatedAt: today }
  const value = Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
  return { value, evidence: parts.join(' + ') + ' 合成', updatedAt: today }
}

// 救济 Remedy：治理状态（未决红旗 SLA / 复核状态）
function remedyAxis(e) {
  const redFlags = Array.isArray(e.security?.redFlags) ? e.security.redFlags : []
  const status = e.security?.reviewStatus
  if (redFlags.length) return { value: 2, evidence: '治理状态：未决红旗 SLA 计时中（' + redFlags.length + ' 条）', updatedAt: today }
  if (status === 'reviewed') return { value: 5, evidence: '治理状态：reviewed', updatedAt: today }
  if (status === 'pending-human') return { value: 3, evidence: '治理状态：pending-human', updatedAt: today }
  return { value: 3, evidence: '治理状态：' + (status ?? '未知'), updatedAt: today }
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
    // package.json 非法 JSON 会在 evaluatePlugin 内抛出 → 外层 catch 保留旧分跳过
    const pkg = pkgText === null ? null : JSON.parse(pkgText)
    const zhReadme = await fetchWithFallback(e.repo, 'README.zh.md')
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
      producibility: mergeAxis(prev?.producibility, producibilityAxis(report.manifest, pkg)),
      adoptability: mergeAxis(prev?.adoptability, adoptabilityAxis(report.manifest, zhReadme)),
      baseline: mergeAxis(prev?.baseline, baselineAxis(report)),
      distribution: mergeAxis(prev?.distribution, distributionAxis(e)),
      composition: mergeAxis(prev?.composition, compositionAxis(report.manifest)),
      safety: mergeAxis(prev?.safety, safetyAxis(e, s?.security ?? null)),
      footprint: mergeAxis(prev?.footprint, footprintAxis(report.manifest)),
      freshness: mergeAxis(prev?.freshness, freshnessAxis(e, s?.activity ?? null)),
      remedy: mergeAxis(prev?.remedy, remedyAxis(e)),
      human,
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
