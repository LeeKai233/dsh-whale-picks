# DEVELOPMENT.md — {{PLUGIN_ID}} developer docs

This is the development-doc skeleton of the whale-picks plugin paradigm. Fill
it in as the plugin grows; the canonical worked example is dsh-ui-attention's
docs/DEVELOPMENT.md.

## Build and test

```sh
pnpm install
pnpm test        # vitest
pnpm bundle      # tsdown -> lib/index.js (host) + lib/client.js (browser)
```

## Architecture

- Host node half: `src/index.ts` + `src/plugin-schema.ts` +
  `src/plugin-settings.ts`. Registers the plugin-owned settings namespace
  when the optional settings service is composed; browser-only plugins may
  leave `apply` a no-op (extension point: the host half may be empty).
- Browser half: `src/client/index.ts`. Registers the plugin's slot
  (settings.general.item in the default skeleton; any slot name works) and
  its locale dictionaries.
- `src/client/settings-store.ts`: settings persistence — plain localStorage
  by default, or the runtime snapshot-store engine (see attention), or none.

## Why browser-local settings

The rc.6 web API gateway exposes only a hardcoded settings namespace
allowlist to the browser (WEB_SETTINGS_NAMESPACES in
packages/host/apiproxy/src/api-proxy.ts) and answers settings-not-exposed for
anything else. Plugins therefore persist their switches in browser storage
while still registering the namespace Host-side for future compatibility.

## Publishing

```sh
npm version patch          # or minor / major
pnpm bundle && pnpm test
npm publish                # add --otp=<code> when the account enforces 2FA
```

The tarball ships the prebuilt lib/ plus the bundle patch, so consumers never
need a build step.

## Standalone install without dsh plugin

As an ALTERNATIVE to the bundle route (never both): copy the package into
~/.dsh/profiles/web/node_modules/ and insert this row into the profile patch
layer ~/.dsh/profiles/web/cordis.patch.yml:

```yaml
- insert:
    - id: {{INSERT_ID}}
      name: "{{PLUGIN_NAME}}"
```

insert rows are not deduplicated by id across layers: the bundle patch and the
profile patch providing the same id make the loader refuse to boot with
duplicate loader entry id. Pick exactly one route.

## Requirements

- DeepSeek Harness 0.1.0-rc.6 or newer
- the web profile (dsh --profile web)
