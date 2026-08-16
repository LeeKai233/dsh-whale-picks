import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      // The installed package's ./client is the browser bundle (window.__ModuleLoader__);
      // tests load the local engine shim instead.
      '@deepseek-ai/dsh-client-runtime/client': fileURLToPath(new URL('./tests/shims/runtime-client.ts', import.meta.url)),
      // The real primitives root pulls the markdown/katex chain (CSS imports);
      // tests load a tiny SVG shim instead (only needed when the plugin uses primitives).
      '@deepseek-ai/dsh-client-ui-primitives': fileURLToPath(new URL('./tests/shims/ui-primitives.tsx', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.spec.{ts,tsx}'],
  },
})
