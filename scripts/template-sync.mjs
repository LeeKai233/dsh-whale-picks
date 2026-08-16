// template-sync.mjs — 结构与不变量自查（非逐文件 diff）：检查插件仓库与
// whale-picks 范式骨架（templates/plugin）的固定分区与关键不变量是否漂移。
// Report-only by default; --strict exits 1 on any finding.
// Zero runtime dependencies (Node built-ins).
//
// Usage:
//   node scripts/template-sync.mjs <plugin-dir> [--strict]
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const TEMPLATE_DIR = path.resolve(HERE, '..', 'templates', 'plugin')

// The paradigm's fixed sections — every paradigm plugin carries these files.
const REQUIRED_FILES = [
  'whalepicks.json', 'cordis.patch.yml', 'package.json', 'LICENSE', 'AGENTS.md',
  'README.md', 'README.zh.md', 'tsconfig.json', 'tsdown.config.ts',
  'vitest.config.ts', 'src/index.ts', 'src/client/index.ts', 'src/client/locales.ts',
]

// The minimal platform-module core every client bundle must externalize.
const CORE_PLATFORM_MODULES = [
  'react', 'react/jsx-runtime', 'react-dom', 'react-dom/client',
  '@deepseek-ai/cordis', '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-web-react',
]

async function read(rel) {
  return existsSync(rel) ? readFile(rel, 'utf8') : ''
}

export async function syncReport(pluginDir) {
  const findings = []
  const ok = (name, detail = '') => findings.push({ name, ok: true, detail })
  const warn = (name, detail) => findings.push({ name, ok: false, detail })

  // Fixed sections present?
  for (const f of REQUIRED_FILES) {
    const full = path.join(pluginDir, f)
    if (existsSync(full)) ok(f, '存在')
    else warn(f, '缺失 — 范式固定分区不完整')
  }

  // Manifest version follows the template (1.1 carries deps/perf/security).
  if (existsSync(path.join(pluginDir, 'whalepicks.json'))) {
    const manifest = JSON.parse(await read(path.join(pluginDir, 'whalepicks.json')))
    if (manifest.schemaVersion === '1.1') ok('whalepicks schemaVersion', '1.1 与模板一致')
    else warn('whalepicks schemaVersion', '模板为 1.1（deps/perf/security），当前 ' + (manifest.schemaVersion ?? '缺失'))
  }

  // Published tarball carries the listing contract.
  if (existsSync(path.join(pluginDir, 'package.json'))) {
    const pkg = JSON.parse(await read(path.join(pluginDir, 'package.json')))
    if (Array.isArray(pkg.files) && pkg.files.includes('whalepicks.json')) ok('files 含 whalepicks.json', '与模板一致')
    else warn('files 含 whalepicks.json', '模板要求发布包带上合同文件')
  }

  // Client bundle externalizes the platform core.
  const tsdown = await read(path.join(pluginDir, 'tsdown.config.ts'))
  if (tsdown === '') {
    warn('tsdown 平台模块核心', 'tsdown.config.ts 缺失')
  } else {
    const missing = CORE_PLATFORM_MODULES.filter((mod) => !tsdown.includes(mod))
    if (missing.length === 0) ok('tsdown 平台模块核心', '核心 external 齐全')
    else warn('tsdown 平台模块核心', '缺少 external: ' + missing.join(', '))
  }

  // Build artifacts stay out of git (template .gitignore).
  const gitignore = await read(path.join(pluginDir, '.gitignore'))
  if (/^lib\/$/m.test(gitignore)) ok('.gitignore 忽略 lib/', '与模板一致')
  else warn('.gitignore 忽略 lib/', '模板约定 lib/ 不入库')

  const git = spawnSync('git', ['-C', pluginDir, 'ls-files', 'lib'], { encoding: 'utf8' })
  if (git.status !== 0) {
    ok('git 跟踪检查', '目录不是 git 仓库，跳过')
  } else if (git.stdout.trim() === '') {
    ok('lib/ 未被 git 跟踪', '与模板一致')
  } else {
    warn('lib/ 未被 git 跟踪', 'lib/ 已被 git 跟踪（' + git.stdout.trim().split(/\r?\n/).length + ' 个文件）— 建议 git rm --cached')
  }

  return { findings, clean: findings.every((f) => f.ok) }
}

const args = process.argv.slice(2)
const pluginDir = path.resolve(args.find((a) => !a.startsWith('--')) || '.')
const strict = args.includes('--strict')
const report = await syncReport(pluginDir)
console.log(report.clean ? '✅ 结构与不变量自查（非逐文件 diff）— 无漂移: ' + pluginDir : '⚠️ 结构与不变量自查（非逐文件 diff）— 漂移清单: ' + pluginDir)
for (const f of report.findings) console.log((f.ok ? '   ✅ ' : '   ⚠️ ') + f.name + (f.detail ? ' — ' + f.detail : ''))
process.exit(strict && !report.clean ? 1 : 0)
