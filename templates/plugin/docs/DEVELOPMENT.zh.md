# DEVELOPMENT.zh.md — {{PLUGIN_ID}} 开发者文档

这是鲸选插件范式的开发文档骨架，随插件成长逐步填写；规范范例是
dsh-ui-attention 的 docs/DEVELOPMENT.zh.md。

## 构建与测试

```sh
pnpm install
pnpm test        # vitest
pnpm bundle      # tsdown -> lib/index.js（宿主）+ lib/client.js（浏览器）
```

## 架构

- 宿主 node 半区：`src/index.ts` + `src/plugin-schema.ts` +
  `src/plugin-settings.ts`。在可选 settings 服务被组合时注册插件拥有的设置
  命名空间；纯浏览器插件可让 `apply` 保持空实现（扩展点：宿主半区允许为空）。
- 浏览器半区：`src/client/index.ts`。注册插件的槽位（默认骨架是
  settings.general.item；任何槽位名均可）与 locale 词典。
- `src/client/settings-store.ts`：设置持久化——默认裸 localStorage，或
  runtime 快照存储引擎（见 attention），或不持久化。

## 设置持久化的取舍

rc.6 的 Web API 网关只向浏览器暴露硬编码的设置命名空间白名单
（packages/host/apiproxy/src/api-proxy.ts 中的 WEB_SETTINGS_NAMESPACES），
其余命名空间一律返回 settings-not-exposed。因此插件把开关持久化在浏览器
存储中，同时仍在宿主侧注册命名空间，等上游放开限制后自动生效。

## 发布

```sh
npm version patch          # 或 minor / major
pnpm bundle && pnpm test
npm publish                # 账号开启 2FA 时加 --otp=<验证码>
```

发布包自带已构建的 lib/ 与 bundle 补丁，使用者无需任何构建步骤。

## 手工安装（不经过 dsh plugin）

作为 bundle 路线的替代方案（二选一，绝不能同时用）：把包拷进
~/.dsh/profiles/web/node_modules/，并把下面这行插进 profile 补丁层
~/.dsh/profiles/web/cordis.patch.yml：

```yaml
- insert:
    - id: {{INSERT_ID}}
      name: "{{PLUGIN_NAME}}"
```

insert 行不会跨层按 id 去重：bundle 补丁与 profile 补丁同时提供同一个 id 会让
加载器拒绝启动，报错 duplicate loader entry id。两条组合路线只能选一条。

## 环境要求

- DeepSeek Harness 0.1.0-rc.6 或更新
- web profile（dsh --profile web）
