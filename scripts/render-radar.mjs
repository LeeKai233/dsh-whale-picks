// render-radar.mjs — renders the nine-goal radar chart as a static SVG per plugin.
// Zero-dependency polygon math. Null axes render as '—' (待测) and do not
// contribute to the value polygon. Output: assets/radar/<id>.svg
// The nine paradigm machine axes only — the human axis is a separate line in
// the README block, never part of the radar polygon.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.resolve(HERE, '../assets/radar')
const registry = JSON.parse(await readFile(new URL('../data/plugins.json', import.meta.url), 'utf8'))

const AXES = [
  { key: 'producibility', zh: '生产', en: 'Producibility' },
  { key: 'adoptability', zh: '迁移', en: 'Adoptability' },
  { key: 'baseline', zh: '准入', en: 'Baseline' },
  { key: 'distribution', zh: '分发', en: 'Distribution' },
  { key: 'composition', zh: '组合', en: 'Composition' },
  { key: 'safety', zh: '安全', en: 'Safety' },
  { key: 'footprint', zh: '开销', en: 'Footprint' },
  { key: 'freshness', zh: '保鲜', en: 'Freshness' },
  { key: 'remedy', zh: '救济', en: 'Remedy' },
]
const CX = 170, CY = 150, R = 104, LABEL_R = 128

function point(i, radius) {
  // 九轴：40° 步进，首轴正上
  const angle = (-90 + i * 40) * Math.PI / 180
  return [CX + radius * Math.cos(angle), CY + radius * Math.sin(angle)]
}

function ringPoints(radius) {
  return AXES.map((_, i) => {
    const [x, y] = point(i, radius)
    return x.toFixed(1) + ',' + y.toFixed(1)
  }).join(' ')
}

export function radarSvg(radar, id) {
  const values = AXES.map(a => radar?.[a.key]?.value ?? null)
  const hasAny = values.some(v => v != null)
  if (!hasAny) return null
  let grid = ''
  for (let step = 1; step <= 5; step++) {
    grid += `<polygon points="${ringPoints(R * step / 5)}" fill="none" stroke="#2a3142" stroke-width="1"/>`
  }
  let spokes = ''
  AXES.forEach((_, i) => {
    const [x, y] = point(i, R)
    spokes += `<line x1="${CX}" y1="${CY}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#2a3142" stroke-width="1"/>`
  })
  const polyPoints = AXES.map((_, i) => {
    const v = values[i]
    const [x, y] = point(i, v == null ? 0 : R * v / 5)
    return x.toFixed(1) + ',' + y.toFixed(1)
  }).join(' ')
  let dots = ''
  AXES.forEach((_, i) => {
    const v = values[i]
    if (v == null) return
    const [x, y] = point(i, R * v / 5)
    dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="#4D6BFE"/>`
  })
  let labels = ''
  AXES.forEach((a, i) => {
    const [x, y] = point(i, LABEL_R)
    const v = values[i]
    const shown = v == null ? '—' : String(v)
    const anchor = Math.abs(x - CX) < 12 ? 'middle' : x > CX ? 'start' : 'end'
    labels += `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" fill="#aeb6c6" font-family="Verdana,DejaVu Sans,sans-serif" font-size="10" text-anchor="${anchor}">${a.zh} ${shown}</text>`
  })
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="300" viewBox="0 0 340 300" role="img" aria-label="${id} nine-goal radar">`,
    `<rect width="340" height="300" fill="#161b26"/>`,
    grid, spokes,
    `<polygon points="${polyPoints}" fill="rgba(77,107,254,0.32)" stroke="#4D6BFE" stroke-width="2"/>`,
    dots, labels,
    `<text x="170" y="288" fill="#5c6577" font-family="Verdana,DejaVu Sans,sans-serif" font-size="9" text-anchor="middle">dsh-whale-picks · ${id} · ${radar?.human?.updatedAt ?? ''}</text>`,
    '</svg>'
  ].join('')
}

await mkdir(OUT, { recursive: true })
let rendered = 0
for (const e of registry.plugins) {
  const svg = radarSvg(e.radar, e.id)
  if (!svg) continue
  await writeFile(path.join(OUT, e.id + '.svg'), svg + '\n')
  rendered++
}
console.log(`rendered ${rendered} radar SVGs → assets/radar/`)
