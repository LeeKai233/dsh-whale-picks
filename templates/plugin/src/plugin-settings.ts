/**
 * Durable settings contract shared by the Host node half and the browser half.
 * Schema-free on purpose: the schemastery schema lives in plugin-schema.ts so
 * the browser bundle never drags the schema library in.
 */

/** Settings namespace owned by the {{PLUGIN_ID}} plugin. */
export const PLUGIN_SETTINGS_NAMESPACE = '{{PLUGIN_ID}}'

/** {{PLUGIN_ID}} switches persisted in the Host user-settings document. */
export interface PluginSettings {
  /** Example toggle: what the plugin's one thing is. */
  exampleEnabled: boolean
}

/** In-memory defaults used while the Host settings scope is still loading. */
export const DEFAULT_PLUGIN_SETTINGS: PluginSettings = {
  exampleEnabled: true,
}
