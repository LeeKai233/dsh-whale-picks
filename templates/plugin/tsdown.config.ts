/**
 * tsdown config for the {{PLUGIN_ID}} plugin (whale-picks compliant).
 * node half: plain ESM lib; client half: CJS bundle wrapped in
 * window.__ModuleLoader__.load({id, factory}) with platform modules external.
 * Do not add non-platform imports to the client entry (bundle purity rule).
 */
import { defineConfig } from 'tsdown'

const PLUGIN_ID = '{{PLUGIN_ID}}'

/**
 * The module specifiers the web shell shares into the frozen module table.
 * Full inventory of the dsh-client-ui-* family; trim to what the plugin's
 * client half actually imports (smaller surface, cleaner --structure report).
 */
const PLATFORM_MODULES = [
  'react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-web-react',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-attachment',
  '@deepseek-ai/dsh-client-schema-form',
  '@deepseek-ai/dsh-client-ui-settings',
] as const

/** Documented exemption: snapshot-store engine answered by the lazy runtime table. */
const RUNTIME_STORE_EXEMPTION = '@deepseek-ai/dsh-client-runtime/client'

/**
 * Host node-half dependencies resolved through the profile flat fallback.
 * Browser-only plugins (no host settings namespace) may drop dsh-settings and
 * schemastery from here AND from package.json peer/devDependencies; the
 * node half then stays a no-op (extension point: host half may be empty).
 */
const NODE_EXTERNALS = ['@deepseek-ai/cordis', '@deepseek-ai/dsh-settings', '@deepseek-ai/schemastery']

export default defineConfig([
  {
    name: PLUGIN_ID,
    entry: ['src/index.ts'],
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    dts: false,
    fixedExtension: false,
    clean: false,
    deps: { neverBundle: NODE_EXTERNALS },
  },
  {
    name: PLUGIN_ID + '/client',
    entry: { client: 'src/client/index.ts' },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    dts: false,
    sourcemap: true,
    clean: false,
    deps: { neverBundle: [...PLATFORM_MODULES, RUNTIME_STORE_EXEMPTION] },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
      'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
      'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
    },
    outputOptions: {
      entryFileNames: 'client.js',
      banner: 'window.__ModuleLoader__.load({ id: ' + JSON.stringify(PLUGIN_ID) + ', factory: (require) => {',
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  },
])
