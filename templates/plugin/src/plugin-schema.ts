/**
 * Host-side settings schema for the {{PLUGIN_ID}} namespace. Kept apart from
 * plugin-settings.ts: the browser bundle must not import schemastery, while
 * the Host node half resolves it through the profile flat fallback.
 */
import z from '@deepseek-ai/schemastery'
import type { PluginSettings } from './plugin-settings.ts'

export const PluginSettingsSchema: z<PluginSettings> = z.object({
  exampleEnabled: z.boolean().default(true),
})
