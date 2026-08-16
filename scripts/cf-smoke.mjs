// cf-smoke.mjs — local smoke test for the Workers handler (no wrangler needed).
// Structural assertions only: status codes, JSON parseability, payload SHAPES
// and headers (CORS/ETag/Cache-Control). Never asserts concrete data values
// (counts, per-plugin scores, tier contents) — the registry changes daily and
// hardcoded data expectations turn the smoke test falsely red.
import { readFile } from 'node:fs/promises'
import { createHandler } from '../cloudflare/src/handler.js'

const plugins = JSON.parse(await readFile(new URL('../data/plugins.json', import.meta.url), 'utf8'))
const suits = JSON.parse(await readFile(new URL('../data/suits.json', import.meta.url), 'utf8'))
const handle = createHandler({ plugins, suits })

const checks = []
function expect(cond, label) {
  checks.push([cond, label])
  if (!cond) console.error('✗', label)
}

async function call(path, method = 'GET') {
  const res = await handle(new Request('https://whale-picks.example' + path, { method }))
  let body = null
  let jsonOk = true
  try {
    body = await res.json()
  } catch {
    jsonOk = false
  }
  return { res, body, jsonOk }
}

const health = await call('/health')
expect(health.res.status === 200, '/health 200')
expect(health.jsonOk, '/health JSON 可解析')
expect(typeof health.body?.plugins === 'number', '/health plugins 计数是数值')
expect(typeof health.body?.suits === 'number', '/health suits 计数是数值')
expect(health.body.plugins === plugins.plugins.length, '/health plugins 计数与数据一致')
expect(health.body.suits === suits.suits.length, '/health suits 计数与数据一致')

const list = await call('/plugins.json')
expect(list.res.status === 200, '/plugins.json 200')
expect(list.jsonOk, '/plugins.json JSON 可解析')
expect(Array.isArray(list.body?.plugins), '/plugins.json plugins 是数组')
expect(list.body.plugins.every((p) => typeof p?.id === 'string' && typeof p?.tier === 'string' && typeof p?.category === 'string'), '/plugins.json 每条目含 id/tier/category 字段')
expect(list.res.headers.get('Access-Control-Allow-Origin') === '*', 'CORS *')
expect(!!list.res.headers.get('ETag'), 'ETag present')
expect(list.res.headers.get('Cache-Control') === 'public, max-age=600', 'Cache-Control')

const radar = await call('/radar.json')
expect(radar.res.status === 200, '/radar.json 200')
expect(radar.jsonOk, '/radar.json JSON 可解析')
expect(radar.body?.plugins !== null && typeof radar.body?.plugins === 'object' && !Array.isArray(radar.body?.plugins), '/radar.json plugins 是按 id 索引的对象')
expect(Object.values(radar.body.plugins).every((r) => r === null || typeof r === 'object'), '/radar.json 每条目 radar 为对象或 null（待测）')

const suitsRes = await call('/suits.json')
expect(suitsRes.res.status === 200, '/suits.json 200')
expect(suitsRes.jsonOk, '/suits.json JSON 可解析')
expect(Array.isArray(suitsRes.body?.suits), '/suits.json suits 是数组')

const missing = await call('/nope')
expect(missing.res.status === 404, 'unknown route 404')

const opts = await handle(new Request('https://whale-picks.example/plugins.json', { method: 'OPTIONS' }))
expect(opts.status === 204, 'OPTIONS 204')

const failed = checks.filter(([ok]) => !ok).length
console.log((checks.length - failed) + '/' + checks.length + ' smoke checks passed')
process.exit(failed ? 1 : 0)
