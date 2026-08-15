/**
 * Browser half of {{PLUGIN_ID}}: a single General-settings row toggling the
 * example switch, persisted in the browser via a localStorage-backed store
 * (see settings-store.ts for why the Host settings scope is not used).
 * Registers the feature-owned General-settings row via the slots ledger.
 */
import type { BoundActions } from '@deepseek-ai/dsh-client-ui-slots'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { createSettingsStore } from './settings-store.ts'
import { ExampleRow, createExampleRowStore } from './ExampleRow.tsx'
import type { ExampleRowInjected } from './ExampleRow.tsx'
import { en, zh } from './locales.ts'
import type { ExampleKey } from './locales.ts'

export { ExampleRow } from './ExampleRow.tsx'
export type { ExampleRowComponentProps, ExampleRowInjected, ExampleRowState } from './ExampleRow.tsx'
export type { ExampleKey } from './locales.ts'

/** Locale namespace owned by this plugin (row copy). */
const NS = '{{PLUGIN_ID}}'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    [NS]: ExampleKey
  }
}

/** Required services: slot registry + locale. */
export const inject = ['slots', 'locale']

export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), '{{PLUGIN_ID}}: dictionaries')

  const settings = createSettingsStore().create()
  const rowStore = createExampleRowStore()
  let bound: BoundActions<typeof rowStore> | undefined
  const syncRow = (): void => {
    bound?.sync(settings.getSnapshot())
  }

  ctx.effect(() => settings.subscribe(syncRow), '{{PLUGIN_ID}}: settings store subscription')

  ctx.slots.inject('settings.general.item', () => ctx.slots.register({
    name: 'settings.general.item',
    id: '{{PLUGIN_ID}}',
    order: 30,
    store: rowStore,
    locale: NS,
    inject: (actions: BoundActions<typeof rowStore>): ExampleRowInjected => {
      bound = actions
      syncRow()
      return {
        setExampleEnabled: (value) => { settings.actions.setExampleEnabled(value) },
      }
    },
  }, ExampleRow))
}
