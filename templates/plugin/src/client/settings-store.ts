/**
 * localStorage-backed settings store for the browser half.
 * localStorage (not the Host settings scope) is used so the row keeps
 * working before/without the host settings round-trip; see the store
 * interface for the persisted shape.
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
