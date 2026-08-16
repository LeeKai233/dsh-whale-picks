/**
 * localStorage-backed settings store for the browser half.
 *
 * Extension point: settings persistence (pick ONE idiom):
 * 1. This plain localStorage store (simplest; used by the template default).
 * 2. The runtime snapshot-store engine: `defineStore({ init, persist, actions })`
 *    from '@deepseek-ai/dsh-client-runtime/client' (attention's idiom — see its
 *    docs/DEVELOPMENT.md; needs the runtime store exemption in tsdown).
 * 3. No persistence at all for stateless plugins.
 *
 * localStorage (not the Host settings scope) is used so the row keeps
 * working before/without the host settings round-trip: the rc.6 web API
 * gateway exposes only an allowlisted set of settings namespaces to the
 * browser. The node half still registers the namespace Host-side so the
 * durable scope lights up once the upstream limitation is lifted.
 *
 * Migration path once the upstream limitation is lifted (the web API
 * gateway opens the settings namespace allowlist): DELETE this file and
 * rewire the rowStore to the Host settings scope — the PLUGIN_SETTINGS_NAMESPACE
 * registered by the host half is reserved exactly for that switch.
 */
import { DEFAULT_PLUGIN_SETTINGS } from '../plugin-settings.ts'
import type { PluginSettings } from '../plugin-settings.ts'

const STORAGE_KEY = '{{PLUGIN_ID}}.settings'

export interface SettingsStore {
  getSnapshot(): PluginSettings
  subscribe(listener: () => void): () => void
  actions: { setExampleEnabled(value: boolean): void }
}

export function createSettingsStore(): { create(): SettingsStore } {
  return {
    create() {
      let state: PluginSettings = load()
      const listeners = new Set<() => void>()
      const notify = (): void => { for (const l of listeners) l() }
      const persist = (): void => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* storage unavailable */ }
      }
      return {
        getSnapshot: () => ({ ...state }),
        subscribe(listener) {
          listeners.add(listener)
          return () => { listeners.delete(listener) }
        },
        actions: {
          setExampleEnabled(value) { state = { ...state, exampleEnabled: value }; persist(); notify() },
        },
      }
    },
  }
}

function load(): PluginSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_PLUGIN_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<PluginSettings>
    return { ...DEFAULT_PLUGIN_SETTINGS, ...parsed }
  } catch {
    return { ...DEFAULT_PLUGIN_SETTINGS }
  }
}
