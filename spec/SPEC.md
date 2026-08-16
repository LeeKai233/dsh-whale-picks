# 鲸选插件规范 · Whale-picks Plugin SPEC (v1.1)

本文件是鲸选商店的**插件准入合同**。任何想在鲸选上架的插件，仓库根目录必须携带一份符合 [whalepicks.schema.json](./whalepicks.schema.json) 的 whalepicks.json，并通过 scripts/check-plugin.mjs 的门槛校验。合规是上架的一票否决门槛：不合规，连被评分的资格都没有。

配套文件：
- [whalepicks.schema.json](./whalepicks.schema.json) — manifest JSON Schema（字段的机器契约）
- [PARADIGM.md](./PARADIGM.md) — 鲸选插件范式（固定分区 + 扩展点的结构定义）
- [AGENT.md](./AGENT.md) — 给 agent 的执行指引（构建/改造插件时读它）
- [templates/plugin/](../templates/plugin/) — 合规插件模板工程（范式的唯一规范骨架）
- [docs/adopt.md](../docs/adopt.md) — 已有插件合规化教程

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
| 安全声明 | capabilities.network / telemetry / permissions | 诚实声明联网、遥测与权限面。声明是上架信用的一部分；check-plugin 静态信号对账：扫描 src 内网络/危险特征（fetch(/XMLHttpRequest/sendBeacon/WebSocket/eval(/new Function）并与 capabilities 声明比对，不一致出 warning（非门槛、非审计）；红旗由人工复核确认后记入 registry 并压安全轴 ≤2 |
| 安全裁决 | security.verdict / security.scanBy | 商店侧体检管道填写，作者自填无效（registry security 字段为准）；模板与 --init 均不预填 |
| 成本 | cost.license / paid / paidTiers | SPDX 许可证；是否付费、付费档位 |
| 链接 | links.repo / npm / docs | 仓库（必填）、npm 页、文档 |
| 维护 | maintainers[] | 维护者与联系方式（活跃度评估的依据之一） |

## 3. 工程结构要求

以 templates/plugin/ 为基准——它是[鲸选插件范式](./PARADIGM.md)的唯一规范骨架：固定
分区（合同/宿主半区/浏览器半区/文案/验证/装载/仓库规范）一个不少，插件自己的「唯一
一件事」填进扩展点（inject、槽位注册、服务提供/消费、设置持久化、模块自述描述符、
半区豁免）。范式适用于任何 DSH 插件，不按插件类型分化。

- **打包**：tsdown 双产物——node 侧 ESM lib/index.js + 浏览器侧 CJS bundle（window.__ModuleLoader__ 包装）；浏览器 bundle 只允许 import 平台模块（react/cordis/dsh-client-ui-* 等），禁止拖入非平台库（见模板 tsdown.config.ts 的 external 列表与注释）。host-only 插件（无 dsh.client 块）例外：单产物 lib/index.js，结构断言中浏览器半区各项记豁免。
- **声明**：package.json 的 dsh.client 块声明平台与 inject 的服务（web profile）；cordis.patch.yml 提供 bundle 插槽（insert 行 id 全店唯一）。host-only 插件无 dsh.client 块，仅声明 dsh.bundle.patch。
- **双语文案**：README.md（英文）+ README.zh.md（中文）；客户端 locale zh/en 双词典。
- **测试**：vitest 覆盖核心逻辑（状态机/纯函数/组件），passWithNoTests 只是开发期豁免（--strict 禁止该豁免）。
- **许可证**：LICENSE 文件，OSI 认可许可证（硬门槛）。

工具链（全部零运行时依赖）：
- scripts/scaffold.mjs <name>：从模板生成范式骨架并替换全部占位符；
- scripts/check-plugin.mjs <dir> --init：从现有 package.json 生成 whalepicks.json（v1.1）骨架；
- scripts/check-plugin.mjs <dir> --structure：范式对齐度报告（七分区逐项断言；只报告，永远 exit 0，不进门槛）；
- scripts/check-plugin.mjs <dir> --strict：门槛 + 全部七分区结构断言 + 构建冒烟（npm run bundle、lib 双产物、client 含 __ModuleLoader__.load）+ 测试断言（≥1 条 spec、禁 passWithNoTests:true）——listed/featured 转正必过；
- check-plugin 每次运行附带 signals 小节：静态信号扫描 src 的网络/危险特征并与 capabilities 声明对账（warning，永远不影响 exit code）；
- scripts/template-sync.mjs <dir>：结构与不变量自查（非逐文件 diff）。

已有插件迁移范式见 docs/migrate-to-paradigm.md（与 docs/adopt.md 的「只补声明」路径互补）。

## 4. cordis.patch.yml 约定

- 只做 bundle 层 insert（让 dsh plugin add 自动进入组合）；同一个 insert id 绝不写入用户 profile 补丁层（duplicate loader entry id 会拒绝启动）。
- 全部 insert id 必须列进 manifest 的 patches.insertIds。
- 插件占用的设置命名空间（settingsNamespace）与 UI 插槽（settings.general.item / settings.section 等）必须列进 patches.namespaces / patches.slots。

## 5. 分发契约

- **install.spec 格式**：npm 包名（如 `dsh-ui-attention`）或 `github:owner/repo`；registry 条目的 install 命令必须以 `dsh plugin ` 开头（validate.mjs 强制）。
- **registry 是商店对外的分发事实源**：data/plugins.json（+ data/suits.json）是唯一数据源；Cloudflare 端点（whale-picks-api worker）把它暴露给消费方；消费方（商店前端、鲸选商店插件、第三方）按 data/schema.json 消费，不自造字段。
- **schema 演进**走第 7 节版本规矩：破坏性变更必须 bump 并记录迁移路径。
- **路线图项**：端点版本化（/v1）与完整性校验和暂未实现，消费方不得依赖。

## 6. 上架流程

1. 提交（PR / issue 表单）→ 2. check-plugin 门槛（一票否决；candidate 过门槛即可，转 listed/featured 须过 --strict）→ 3. 机器轴打分（安全/边界/成本/活跃/兼容——无实测时兼容为 null）→ 4. 创始人亲测 + 真人评分 + 手记 → 5. 转正 listed/featured（雷达图渲染展示）。

任何拒收、下架决定公开记入 docs/decisions.md。

## 7. 版本与演进

- manifest 的 schemaVersion 当前为 **1.1**。v1.0 → v1.1 迁移记录：纯增量——新增**可选**字段 deps / perf / security，1.0 manifest 仍然有效（schemaVersion 枚举放宽）。破坏性变更必须 bump 并在本文件与 schema 的 description 中记录迁移路径。
- registry（data/schema.json）的校验收紧（radar 轴 evidence minLength:4、updatedAt 日期 pattern、suits 成员 tier 去 candidate）已记入 docs/decisions.md 2026-08-16。
- runtime.dsh 的版本范围随 DSH 发布滚动更新；check-plugin 校验范围格式并对「是否覆盖当前商店维护版本」给出提示；纳入兼容性评分为路线图项。

---

# Whale-picks Plugin SPEC (v1.1)

This file is the **listing contract** of the whale-picks store. To be listed, a plugin repo must ship a whalepicks.json at its root conforming to [whalepicks.schema.json](./whalepicks.schema.json) and pass the scripts/check-plugin.mjs gate. Compliance is the one-vote veto: without it, a plugin is not even scored.

Companion files:
- [whalepicks.schema.json](./whalepicks.schema.json) — manifest JSON Schema (the machine contract of the fields)
- [PARADIGM.md](./PARADIGM.md) — the whale-picks plugin paradigm (fixed sections + extension points)
- [AGENT.md](./AGENT.md) — the execution guide for agents (read it when building/migrating a plugin)
- [templates/plugin/](../templates/plugin/) — the compliant plugin template (the paradigm's canonical skeleton)
- [docs/adopt.md](../docs/adopt.md) — adoption guide for existing plugins

## 1. Unix philosophy: do one thing well

The store's core taste. One plugin solves **one** clear problem:
- scope.does: at most 3 entries, ideally 1 — one sentence naming the single thing it does;
- scope.doesNot: at least 1 entry — what it refuses to do (refusal = boundary, boundary = composability);
- feature bloat is a defect: a plugin that "also" ships skin switching, a balance board and file management should be split into several plugins, not bundled into the store;
- suits exist precisely so that sharply-bounded single-purpose plugins can compose into 1+1>2 — not to let kitchen-sink plugins in.

## 2. whalepicks.json fields

The full contract lives in whalepicks.schema.json. Highlights:

| Group | Fields | Notes |
| --- | --- | --- |
| Identity | id / name / version | id is the store-wide unique slug; name must equal package.json name; version must equal package.json version (enforced by check-plugin) |
| Description | description.zh / description.en | one-line bilingual description; keywords feed search |
| Category | category | discovery / ui / terminal-desktop / agents / usage / notifications / other |
| **Boundary** | scope.does / scope.doesNot | the Unix single-purpose contract, see §1 |
| Install | install.profile / install.spec | target profile (web/tui/headless/any) and pnpm spec (npm name or github:owner/repo) |
| Runtime | runtime.platforms / runtime.dsh | platforms and dsh version range (semver range) |
| **Conflict surface** | patches.bundle / patches.insertIds / patches.namespaces / patches.slots | the machine-extractable conflict surface: cordis.patch.yml path, all insert ids, occupied settings namespaces and UI slots. Two plugins with intersecting insertIds = conflict (see docs/suits.md) |
| Safety declaration | capabilities.network / telemetry / permissions | honestly declare network, telemetry and permission surface. Declarations are part of listing credit; check-plugin reconciles static signals: it scans src for network/danger fingerprints (fetch(/XMLHttpRequest/sendBeacon/WebSocket/eval(/new Function) and compares them with the capabilities declaration — mismatches raise warnings (not a gate, not an audit); red flags are confirmed by human review, recorded in the registry, and cap the security axis at ≤2 |
| Security verdict | security.verdict / security.scanBy | filled by the store-side pass pipeline — author-filled values are void (the registry security field prevails); neither the template nor --init pre-fills it |
| Cost | cost.license / paid / paidTiers | SPDX license; paid or not, paid tiers |
| Links | links.repo / npm / docs | repo (required), npm page, docs |
| Maintenance | maintainers[] | maintainers and contacts (an input to the activity assessment) |

## 3. Engineering structure

templates/plugin/ is the baseline — the canonical skeleton of the [whale-picks plugin paradigm](./PARADIGM.md): all fixed sections (contract / host half / browser half / copy / verification / loading / repo conventions) present, the plugin's ONE thing filling the extension points (inject, slot registration, service provide/consume, settings persistence, module self-descriptor, half exemption). The paradigm fits any DSH plugin and never forks per plugin type.

- **Bundling**: tsdown dual artifacts — node-side ESM lib/index.js + browser-side CJS bundle (wrapped in window.__ModuleLoader__); the browser bundle may only import platform modules (react / cordis / dsh-client-ui-* etc.), never drag in non-platform libs (see the external list and comments in the template's tsdown.config.ts). Host-only plugins (no dsh.client block) are the exception: single artifact lib/index.js, with the browser-half structure assertions recorded as exempt.
- **Declaration**: the dsh.client block of package.json declares the platform and injected services (web profile); cordis.patch.yml provides the bundle slot (insert row ids unique store-wide). Host-only plugins carry no dsh.client block and declare only dsh.bundle.patch.
- **Bilingual copy**: README.md (English) + README.zh.md (Chinese); client locale zh/en dictionaries.
- **Tests**: vitest covers the core logic (state machines / pure functions / components); passWithNoTests is a development-phase exemption only (--strict forbids it).
- **License**: a LICENSE file under an OSI-approved license (hard gate).

Toolchain (all zero-runtime-dependency):
- scripts/scaffold.mjs <name>: generates the paradigm skeleton from the template with every placeholder replaced;
- scripts/check-plugin.mjs <dir> --init: generates a whalepicks.json (v1.1) skeleton from an existing package.json;
- scripts/check-plugin.mjs <dir> --structure: paradigm alignment report (per-section assertions; report-only, always exits 0, never part of the gate);
- scripts/check-plugin.mjs <dir> --strict: gate + all seven-section structure assertions + build smoke (npm run bundle, lib dual artifacts — host-only: single artifact —, client carrying __ModuleLoader__.load) + test assertions (≥1 spec, no passWithNoTests:true) — mandatory for promotion to listed/featured;
- every check-plugin run also prints a signals section: a static scan of src for network/danger fingerprints reconciled against the capabilities declaration (warnings; never affects the exit code);
- scripts/template-sync.mjs <dir>: structure & invariants self-check (not a file-by-file diff).

Migrating an existing plugin to the paradigm: docs/migrate-to-paradigm.md (complements the "declarations only" path in docs/adopt.md).

## 4. cordis.patch.yml conventions

- bundle-layer inserts only (so dsh plugin add composes automatically); the same insert id is NEVER written into the user profile patch layer (duplicate loader entry id refuses to boot).
- every insert id must be listed in the manifest's patches.insertIds.
- settings namespaces (settingsNamespace) and UI slots (settings.general.item / settings.section etc.) occupied by the plugin must be listed in patches.namespaces / patches.slots.

## 5. Distribution contract

- **install.spec format**: an npm package name (e.g. `dsh-ui-attention`) or `github:owner/repo`; a registry entry's install command must start with `dsh plugin ` (enforced by validate.mjs).
- **The registry is the store's public distribution source of truth**: data/plugins.json (+ data/suits.json) is the single source; the Cloudflare endpoint (the whale-picks-api worker) exposes it; consumers (the store frontend, the whale-picks store plugin, third parties) consume it per data/schema.json and never invent fields.
- **Schema evolution** follows the §7 version rules: breaking changes must bump and record a migration path.
- **Roadmap items**: endpoint versioning (/v1) and integrity checksums are not implemented yet; consumers must not rely on them.

## 6. Listing flow

1. submission (PR / issue form) → 2. check-plugin gate (one-vote veto; candidate needs only the gate, promotion to listed/featured requires --strict) → 3. machine-axis scoring (security/scope/cost/activity/compatibility — compatibility is null without a verification) → 4. founder hands-on test + human rating + notes → 5. promotion to listed/featured (radar rendered).

Every rejection or delisting is published in docs/decisions.md.

## 7. Versioning and evolution

- The manifest schemaVersion is currently **1.1**. v1.0 → v1.1 migration record: purely additive — new OPTIONAL fields deps / perf / security; 1.0 manifests stay valid (the schemaVersion enum was relaxed). Breaking changes must bump and record a migration path in this file and in the schema's description.
- The registry (data/schema.json) validation tightening (radar axis evidence minLength:4, updatedAt date pattern, suits member tier dropping candidate) is recorded in docs/decisions.md 2026-08-16.
- runtime.dsh ranges roll forward with DSH releases; check-plugin validates the range format and hints whether it covers the store's currently maintained version; folding that into the compatibility score is a roadmap item.
