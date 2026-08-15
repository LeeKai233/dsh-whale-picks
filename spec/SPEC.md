# 鲸选插件规范 · Whale-picks Plugin SPEC (v1.0)

本文件是鲸选商店的**插件准入合同**。任何想在鲸选上架的插件，仓库根目录必须携带一份符合 [whalepicks.schema.json](./whalepicks.schema.json) 的 whalepicks.json，并通过 scripts/check-plugin.mjs 的门槛校验。合规是上架的一票否决门槛：不合规，连被评分的资格都没有。

配套文件：
- [whalepicks.schema.json](./whalepicks.schema.json) — manifest JSON Schema（字段的机器契约）
- [AGENT.md](./AGENT.md) — 给 agent 的执行指引（构建/改造插件时读它）
- [templates/plugin/](../templates/plugin/) — 合规插件模板工程
- [docs/adopt.md](../docs/adopt.md) — 已有插件合规化教程

---

This file is the **listing contract** of the whale-picks store. To be listed, a plugin repo must ship a whalepicks.json at its root conforming to [whalepicks.schema.json](./whalepicks.schema.json) and pass scripts/check-plugin.mjs. Compliance is the one-vote veto: without it, a plugin is not even scored.

---

## 1. Unix 设计哲学：只做一件事并把它做好

鲸选的核心品味。一件插件解决**一个**明确问题：
- scope.does 最多 3 条，理想是 1 条——一句话说清它做的唯一一件事；
- scope.doesNot 至少 1 条——明确它拒绝做什么（拒绝 = 边界，边界 = 可组合性）；
- 功能过剩是缺陷：一件插件若「顺手」带了皮肤切换、余额看板、文件管理，它应该被拆成多件，而不是打包进店；
- 套件（suits）存在的意义正是让边界清晰的单功能插件组合出 1+1>2，而不是让大而全的插件上架。

## 2. whalepicks.json 字段说明

字段全契约见 whalepicks.schema.json。要点：

| 字段组 | 字段 | 说明 |
| --- | --- | --- |
| 身份 | id / name / version | id 是全店唯一 slug；name 必须等于 package.json 的 name；version 必须等于 package.json 的 version（check-plugin 强制） |
| 描述 | description.zh / description.en | 一句话双语描述；keywords 用于搜索 |
| 分类 | category | discovery / ui / terminal-desktop / agents / usage / notifications / other |
| **边界** | scope.does / scope.doesNot | Unix 单功能合同，见第 1 节 |
| 安装 | install.profile / install.spec | 目标 profile（web/tui/headless/any）与 pnpm spec（npm 名或 github:owner/repo） |
| 运行时 | runtime.platforms / runtime.dsh | 平台与 dsh 版本范围（semver range） |
| **冲突面** | patches.bundle / patches.insertIds / patches.namespaces / patches.slots | 机器可提取的冲突表面：cordis.patch.yml 路径、全部 insert id、占用的设置命名空间与 UI 插槽。两个插件 insertIds 交集非空 = 冲突（见 docs/suits.md） |
| 安全声明 | capabilities.network / telemetry / permissions | 诚实声明联网、遥测与权限面。声明是上架信用的一部分，机器体检会交叉验证 |
| 成本 | cost.license / paid / paidTiers | SPDX 许可证；是否付费、付费档位 |
| 链接 | links.repo / npm / docs | 仓库（必填）、npm 页、文档 |
| 维护 | maintainers[] | 维护者与联系方式（活跃度评估的依据之一） |

## 3. 工程结构要求

以 templates/plugin/ 为基准：
- **打包**：tsdown 双产物——node 侧 ESM lib/index.js + 浏览器侧 CJS bundle（window.__ModuleLoader__ 包装）；浏览器 bundle 只允许 import 平台模块（react/cordis/dsh-client-ui-* 等），禁止拖入非平台库（见模板 tsdown.config.ts 的 external 列表与注释）。
- **声明**：package.json 的 dsh.client 块声明平台与 inject 的服务（web profile）；cordis.patch.yml 提供 bundle 插槽（insert 行 id 全店唯一）。
- **双语文案**：README.md（英文）+ README.zh.md（中文）；客户端 locale zh/en 双词典。
- **测试**：vitest 覆盖核心逻辑（状态机/纯函数/组件），passWithNoTests 只是开发期豁免。
- **许可证**：LICENSE 文件，OSI 认可许可证（硬门槛）。

## 4. cordis.patch.yml 约定

- 只做 bundle 层 insert（让 dsh plugin add 自动进入组合）；同一个 insert id 绝不写入用户 profile 补丁层（duplicate loader entry id 会拒绝启动）。
- 全部 insert id 必须列进 manifest 的 patches.insertIds。
- 插件占用的设置命名空间（settingsNamespace）与 UI 插槽（settings.general.item / settings.section 等）必须列进 patches.namespaces / patches.slots。

## 5. 上架流程

1. 提交（PR / issue 表单）→ 2. check-plugin 门槛（一票否决）→ 3. 机器六轴打分（安全/兼容/边界/成本/活跃）→ 4. 创始人亲测 + 真人评分 + 手记 → 5. 转正 listed/featured（雷达图渲染展示）。

任何拒收、下架决定公开记入 docs/decisions.md。

## 6. 版本与演进

- manifest 的 schemaVersion 目前固定 1.0；任何破坏性变更必须 bump 并在本文件与 schema 的 description 中记录迁移路径。
- runtime.dsh 的版本范围随 DSH 发布滚动更新；check-plugin 会把「范围是否覆盖当前商店维护版本」纳入兼容性评分。
