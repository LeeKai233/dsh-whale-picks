// handler.js — zero-dependency request handler for the whale-picks API.
// Pure logic, dependency-injected data: unit-testable in Node (scripts/cf-smoke.mjs)
// and deployable on Cloudflare Workers via index.js.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}
const CACHE = 'public, max-age=600'

export function createHandler(data) {
  const { plugins, suits } = data
  const etag = '"whale-' + plugins.updatedAt + '-' + suits.updatedAt + '"'
  const json = (body, extraHeaders = {}) => new Response(JSON.stringify(body), {
    headers: {
      ...CORS,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': CACHE,
      ETag: etag,
      ...extraHeaders,
    },
  })

  return function handle(request) {
    const url = new URL(request.url)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })
    switch (url.pathname) {
      case '/health':
        return json({ ok: true, dshVersion: plugins.dshVersion, updatedAt: plugins.updatedAt, plugins: plugins.plugins.length, suits: suits.suits.length })
      case '/plugins.json':
        return json(plugins)
      case '/suits.json':
        return json(suits)
      case '/radar.json':
        return json({
          updatedAt: plugins.updatedAt,
          dshVersion: plugins.dshVersion,
          plugins: Object.fromEntries(plugins.plugins.map((p) => [p.id, p.radar])),
        })
      default:
        return new Response(JSON.stringify({ error: 'not found' }), {
          status: 404,
          headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
        })
    }
  }
}
