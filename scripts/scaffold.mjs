// scaffold.mjs — instantiate the whale-picks plugin paradigm skeleton.
// Copies templates/plugin, substitutes the {{...}} tokens, and leaves a TODO
// at every extension point. Zero runtime dependencies (Node built-ins).
//
// Usage:
//   node scripts/scaffold.mjs <plugin-name> [options]
//     --dest DIR            output directory (default: ./<plugin-name>)
//     --id SLUG             whalepicks id (default: <plugin-name>)
//     --insert-id ID        cordis.patch.yml insert id (default: <plugin-name>)
//     --repo URL            repository URL (default: placeholder)
//     --author NAME         maintainer name (default: placeholder)
//     --contact C           maintainer contact (default: placeholder)
//     --description-zh S    one-line Chinese description (default: TODO)
//     --description-en S    one-line English description (default: TODO)
import { cp, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const TEMPLATE_DIR = path.resolve(HERE, '..', 'templates', 'plugin')

function parseArgs(argv) {
  const out = { pluginName: null, options: {} }
  let i = 0
  const keyFor = {
    '--dest': 'dest', '--id': 'id', '--insert-id': 'insertId', '--repo': 'repo',
    '--author': 'author', '--contact': 'contact', '--description-zh': 'descriptionZh',
    '--description-en': 'descriptionEn',
  }
  while (i < argv.length) {
    const arg = argv[i]
    if (arg in keyFor) {
      out.options[keyFor[arg]] = argv[i + 1]
      i += 2
    } else if (arg.startsWith('--')) {
      throw new Error('未知参数: ' + arg)
    } else if (out.pluginName === null) {
      out.pluginName = arg
      i += 1
    } else {
      throw new Error('多余的参数: ' + arg)
    }
  }
  if (out.pluginName === null) {
    throw new Error('用法: node scripts/scaffold.mjs <plugin-name> [--dest DIR] [--id SLUG] [--insert-id ID] [--repo URL] [--author A] [--contact C]')
  }
  return out
}

const TOKENS = {
  '{{PLUGIN_NAME}}': (o) => o.pluginName,
  '{{PLUGIN_ID}}': (o) => o.id,
  '{{INSERT_ID}}': (o) => o.insertId,
  '{{REPO_URL}}': (o) => o.repo,
  '{{AUTHOR}}': (o) => o.author,
  '{{CONTACT}}': (o) => o.contact,
  '{{YEAR}}': () => String(new Date().getFullYear()),
  '{{DESCRIPTION}}': (o) => o.descriptionEn,
  '{{DESCRIPTION_ZH}}': (o) => o.descriptionZh,
  '{{DESCRIPTION_EN}}': (o) => o.descriptionEn,
  '{{ONE_THING}}': () => 'TODO: 一句话说明它做的唯一一件事（Unix 单功能合同）',
  '{{NON_GOAL}}': () => 'TODO: 明确它不做什么（拒绝 = 边界 = 可组合性）',
}

const SCAFFOLD_SKIP_DIRS = new Set(['node_modules', 'lib', '.git'])

async function collectFiles(dir, base = '') {
  const files = []
  for (const entry of await readdir(dir)) {
    const rel = path.join(base, entry)
    const full = path.join(dir, entry)
    if ((await stat(full)).isDirectory()) {
      if (SCAFFOLD_SKIP_DIRS.has(entry)) continue // 构建产物与依赖不进骨架
      files.push(...await collectFiles(full, rel))
    } else {
      files.push(rel)
    }
  }
  return files
}

async function main() {
  const { pluginName, options } = parseArgs(process.argv.slice(2))
  const slug = (options.id ?? pluginName).toLowerCase()
  const opts = {
    pluginName,
    id: slug,
    insertId: options.insertId ?? slug,
    repo: options.repo ?? 'TODO:https://github.com/you/' + pluginName,
    author: options.author ?? 'TODO: your name',
    contact: options.contact ?? 'TODO: github/email',
    descriptionZh: options.descriptionZh ?? 'TODO: 一句话中文描述',
    descriptionEn: options.descriptionEn ?? 'TODO: one-line English description',
  }
  const dest = path.resolve(options.dest ?? './' + pluginName)
  const files = await collectFiles(TEMPLATE_DIR)
  await mkdir(dest, { recursive: true })
  for (const rel of files) {
    const target = path.join(dest, rel)
    await mkdir(path.dirname(target), { recursive: true })
    let content = await readFile(path.join(TEMPLATE_DIR, rel), 'utf8')
    let leftovers = []
    content = content.replace(/\{\{[A-Z_]+\}\}/g, (match) => {
      const fn = TOKENS[match]
      if (fn === undefined) { leftovers.push(match); return match }
      return fn(opts)
    })
    if (leftovers.length > 0) {
      throw new Error('未知令牌 ' + leftovers.join(', ') + ' in ' + rel)
    }
    await writeFile(target, content)
  }
  // The template's settings namespace/ids default to the plugin id.
  console.log('已生成范式骨架: ' + dest)
  console.log('')
  console.log('TODO 清单（按顺序补齐）:')
  console.log(' 1. whalepicks.json: scope.does/doesNot 改成真实单功能合同；category 改真实分类；')
  console.log('    capabilities.network/telemetry/permissions 按事实填写；maintainers 填真实信息。')
  console.log(' 2. src/client/index.ts 的 TODO 扩展点: 填插件自己的"唯一一件事"（inject/槽位/服务/设置）。')
  console.log(' 3. locales.ts 与 README 双语文案替换占位。')
  console.log(' 4. 安装依赖: pnpm install')
  console.log(' 5. 测试与门槛: pnpm test && node ' + path.relative(process.cwd(), path.join(HERE, 'check-plugin.mjs')) + ' ' + dest + ' --structure')
}

main().catch((error) => {
  console.error('scaffold 失败: ' + error.message)
  process.exit(1)
})
