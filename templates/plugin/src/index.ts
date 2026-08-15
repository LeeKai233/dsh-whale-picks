/**
 * Host half of {{PLUGIN_ID}}: registers the plugin-owned settings namespace
 * when the optional settings service is composed (ui-theme's registration
 * precedent); absent settings (TUI, headless), registration is skipped.
 */
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import { PLUGIN_SETTINGS_NAMESPACE } from './plugin-settings.ts'
import { PluginSettingsSchema } from './plugin-schema.ts'

export { PLUGIN_SETTINGS_NAMESPACE, DEFAULT_PLUGIN_SETTINGS } from './plugin-settings.ts'
export type { PluginSettings } from './plugin-settings.ts'
export { PluginSettingsSchema } from './plugin-schema.ts'

/** Required services: none — the settings registration is conditional. */
export const inject = []

export function apply(ctx: { inject: (names: string[], cb: (s: unknown) => void) => void }): void {
  ctx.inject(['settings'], (settingsCtx) => {
    const settings = (settingsCtx as { settings?: { register?: (...a: unknown[]) => void } }).settings
    if (!settings?.register) return
    settings.register(
      settingsNamespace(PLUGIN_SETTINGS_NAMESPACE),
      PluginSettingsSchema,
      undefined,
    )
  })
}
