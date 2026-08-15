// Cloudflare Workers entry: bundles the registry snapshot at deploy time.
// Data source of truth remains the GitHub repo; every deploy ships a fresh snapshot.
import plugins from '../../data/plugins.json'
import suits from '../../data/suits.json'
import { createHandler } from './handler.js'

export default {
  fetch: (request) => createHandler({ plugins, suits })(request),
}
