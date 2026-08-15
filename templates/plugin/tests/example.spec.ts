import { describe, expect, it } from 'vitest'
import { DEFAULT_PLUGIN_SETTINGS } from '../src/plugin-settings.ts'

describe('{{PLUGIN_ID}} defaults', () => {
  it('enables the example toggle by default', () => {
    expect(DEFAULT_PLUGIN_SETTINGS.exampleEnabled).toBe(true)
  })
})
