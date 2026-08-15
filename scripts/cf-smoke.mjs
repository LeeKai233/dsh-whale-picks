// cf-smoke.mjs — local smoke test for the Workers handler (no wrangler needed).
// Verifies routing, CORS, ETag and payload shape against the committed data.
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
  const body = await res.json()
  return { res, body }
}

const health = await call('/health')
expect(health.res.status === 200, '/health 200')
expect(health.body.plugins === plugins.plugins.length, '/health plugin count')
expect(health.body.suits === 0, '/health suits count')

const list = await call('/plugins.json')
expect(list.res.status === 200, '/plugins.json 200')
expect(list.body.plugins.length === plugins.plugins.length, '/plugins.json payload')
expect(list.res.headers.get('Access-Control-Allow-Origin') === '*', 'CORS *')
expect(!!list.res.headers.get('ETag'), 'ETag present')
expect(list.res.headers.get('Cache-Control') === 'public, max-age=600', 'Cache-Control')

const radar = await call('/radar.json')
expect(radar.body.plugins['dsh-ui-attention']?.human?.value === 5, 'radar.json pilot human=5')
expect(radar.body.plugins['dsh-market'] === null, 'radar.json candidate null')

const suitsRes = await call('/suits.json')
expect(suitsRes.body.suits.length === 0, 'suits.json empty')

const missing = await call('/nope')
expect(missing.res.status === 404, 'unknown route 404')

const opts = await handle(new Request('https://whale-picks.example/plugins.json', { method: 'OPTIONS' }))
expect(opts.status === 204, 'OPTIONS 204')

const failed = checks.filter(([ok]) => !ok).length
console.log((checks.length - failed) + '/' + checks.length + ' smoke checks passed')
process.exit(failed ? 1 : 0)
