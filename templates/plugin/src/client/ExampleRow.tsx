/**
 * The General-settings row for the {{PLUGIN_ID}} feature: a single checkbox
 * bound to the example toggle. Plain DOM — no primitives imports, keeping
 * the client bundle lean (bundle purity rule).
 */
import { createStore } from '@deepseek-ai/dsh-client-ui-slots'
import type { PropsLocale, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import type { PluginSettings } from '../plugin-settings.ts'
import type { ExampleKey } from './locales.ts'

export interface ExampleRowState {
  settings: PluginSettings
}

export interface ExampleRowInjected {
  setExampleEnabled(value: boolean): void
}

export type ExampleRowComponentProps = PropsStore<ReturnType<typeof createExampleRowStore>>
  & PropsLocale<ExampleKey>
  & ExampleRowInjected

export function createExampleRowStore() {
  return createStore<ExampleRowState>({
    settings: { exampleEnabled: true },
  })
}

export function ExampleRow(props: ExampleRowComponentProps): JSX.Element {
  const t = props.t
  const settings = props.useStore((s) => s.settings)
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="checkbox"
        checked={settings.exampleEnabled}
        onChange={(e) => props.setExampleEnabled(e.currentTarget.checked)}
      />
      <span>{t('rowLabel')}</span>
    </label>
  )
}
