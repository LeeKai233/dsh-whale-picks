# 已有插件迁移到鲸选范式 · Migrating an existing plugin to the paradigm

English below. 本文是把一件**已存在的 DSH 插件**迁移到鲸选范式（spec/PARADIGM.md）
的完整指南。范式对所有插件成立：web/tui/headless、任何功能、任何槽位。迁移的目标是
让插件获得规范性、可审查性、冲突可排查性与 agent 友好性，**同时保持功能逐字不变**。

与 docs/adopt.md 的关系：adopt.md 只补 whalepicks.json（"只补声明，不改行为"）；
本文做完整结构迁移（"把代码装进范式骨架"）。两个路径的判定见第 1 节。

## 1. 判定表：只补声明，还是迁移结构？

| 情况 | 建议 |
| --- | --- |
| 只想上架候选池、不想动代码 | adopt.md（--init 补清单） |
| 插件要长期演进、要接受机器审查、要当范例 | 迁移结构（本文） |
| 插件结构已经混乱、文档缺失、测试为零 | 迁移结构（顺便偿还技术债） |

## 2. 通用映射表：任意插件解剖 → 范式分区

| 你现有的东西 | 范式里的位置 |
| --- | --- |
| 入口文件（node 侧加载逻辑、设置注册） | src/index.ts（宿主半区）；无宿主逻辑则留 no-op |
| 设置 schema（zod/schemastery/手写校验） | src/plugin-schema.ts（宿主半区，只许在此 import schemastery） |
| 设置类型与默认值 | src/plugin-settings.ts |
| 浏览器入口（UI、槽位、事件监听） | src/client/index.ts（浏览器半区） |
| UI 组件 | src/client/*.tsx |
| 文案（界面字符串） | src/client/locales.ts（zh/en 双词典；locales 之外禁止 UI 文案） |
| 持久化（宿主设置/浏览器存储） | 扩展点 4：宿主命名空间注册 / localStorage / runtime 快照引擎 |
| 测试 | tests/*.spec.ts（验证层） |
| 装载声明（patch、insert id） | cordis.patch.yml（装载层） |
| 冲突面声明 | whalepicks.json patches.insertIds/namespaces/slots + deps |
| 构建（单文件/单格式） | tsdown 双产物（tsdown.config.ts，模板自带） |
| 文档 | README.md + README.zh.md + docs/DEVELOPMENT(.zh).md |
| 仓库规则 | AGENTS.md（模板自带，改 id/insert-id 即可） |

## 3. 扩展点怎么填（三个真实范例）

1. **dsh-ui-attention（试验品）**：设置行插件。inject = slots/locale/sessions；槽位
   settings.general.item；设置用 runtime 快照引擎；宿主半区注册 ui-attention 命名空间。
2. **dsh-appearance**：服务提供者。inject = slots/locale；槽位 settings.section；
   提供 appearance.manager 服务；宿主半区 no-op（browser-only，扩展点 6）；模块自述
   描述符契约 + i18n 接缝（title/desc 支持 { key } 走模块 t）。
3. **dsh-statusbar**：服务消费者 + 遮蔽 + 联网。inject = slots/timer；槽位
   conversation.composer.dock 的 stats 单元（priority -1 遮蔽内置条目）；消费
   appearance.manager（实现模块自述描述符）；宿主半区注册 dsh-statusbar.settings
   命名空间；浏览器走 localStorage；capabilities.network = true。

**最小侧边栏示例**（普适性自测）：假设你要写一个侧边栏插件——不需要任何新模板：
inject = slots；槽位注册你选中的 sidebar 槽位名；设置持久化三选一；其余分区照抄。
scaffold 生成的骨架 + 这一段扩展点填写就是全部工作。

## 4. 迁移步骤

1. **存档**：迁移前打 git tag（如 v0.1.0-pre-paradigm），记录迁移前 commit；
   试验品/范例迁移还要在 dsh-whale-picks/docs/decisions.md 写存档标记。
2. **生成骨架**：node <whale-picks>/scripts/scaffold.mjs <name> --dest <你的仓库>
   （或手工对齐 templates/plugin 的文件清单）。
3. **搬运**：按第 2 节映射表把代码搬进对应分区；功能代码只移动、不改行为。
4. **填扩展点**：inject / 槽位 / 服务 / 设置持久化 / 模块自述描述符（如适用）。
5. **双语**：README.zh.md；locales.ts 收编全部 UI 文案（zh 保持原文，补 en）。
6. **测试**：npm test 全绿（原有断言必须继续通过或做等价更新）。
7. **校验**：
   - node scripts/check-plugin.mjs <仓库> —— 门槛，exit 0；
   - node scripts/check-plugin.mjs <仓库> --structure —— 范式对齐报告；
   - node scripts/template-sync.mjs <仓库> —— 骨架漂移自查。
8. **收尾**：git rm --cached lib（如曾被跟踪）；构建；如安装于 profile，删除过期
   file: 副本重装并验证生效副本（见工作区 AGENTS.md）。

## 5. 常见翻车点

- 遮蔽内置槽位忘了更低 priority（同 id 同 priority 被槽位核心拒绝）。
- schemastery 混进 client bundle（purity 规则：只许宿主半区 import）。
- 迁移时顺手改功能（PR 审阅原则：结构迁移与功能改动分开提交）。
- 文案只移了一半：locales.ts 之外仍有硬编码文案（--structure 会报）。
- bundle patch 与 profile patch 双写同一个 insert id（duplicate loader entry id）。

---

# Migrating an existing plugin to the paradigm

This guide migrates an **existing DSH plugin** onto the whale-picks paradigm
(spec/PARADIGM.md). The paradigm applies to every plugin — web/tui/headless,
any feature, any slot. The migration earns the plugin baseline quality,
reviewability, conflict diagnosability and agent-friendliness **without
changing its behavior**.

Relation to docs/adopt.md: adopt.md only adds whalepicks.json ("declare only,
never change behavior"); this guide does the full structural migration
("fit the code into the paradigm skeleton"). See §1 for how to choose.

## 1. Declare only, or migrate?

| Situation | Path |
| --- | --- |
| Just want a candidate listing, no code changes | adopt.md (--init manifest) |
| Long-lived plugin, machine review, reference example | migrate (this guide) |
| Messy structure, missing docs, zero tests | migrate (pay the debt) |

## 2. Mapping: arbitrary plugin anatomy → paradigm sections

| What you have today | Where it goes |
| --- | --- |
| Entry (node-side wiring, settings registration) | src/index.ts (host half); no-op if none |
| Settings schema (zod/schemastery/hand-rolled) | src/plugin-schema.ts (host half; the only place importing schemastery) |
| Settings types & defaults | src/plugin-settings.ts |
| Browser entry (UI, slots, listeners) | src/client/index.ts (browser half) |
| UI components | src/client/*.tsx |
| Copy (UI strings) | src/client/locales.ts (zh/en; no UI copy outside locales) |
| Persistence | Extension point 4: host namespace / localStorage / runtime snapshot engine |
| Tests | tests/*.spec.ts (verification) |
| Loading declaration (patch, insert id) | cordis.patch.yml (loading) |
| Conflict surface | whalepicks.json patches.insertIds/namespaces/slots + deps |
| Build | tsdown dual output (tsdown.config.ts, ships with the template) |
| Docs | README.md + README.zh.md + docs/DEVELOPMENT(.zh).md |
| Repo rules | AGENTS.md (ship with the template; edit id/insert-id) |

## 3. Filling the extension points (three real examples)

1. **dsh-ui-attention (trial)**: settings-row shape. inject = slots/locale/sessions;
   slot settings.general.item; runtime snapshot-engine settings; host half
   registers the ui-attention namespace.
2. **dsh-appearance**: service provider. inject = slots/locale; slot
   settings.section; provides appearance.manager; host half no-op
   (browser-only, extension point 6); module self-descriptor contract with the
   i18n seam (title/desc accept { key } rendered through the module's t).
3. **dsh-statusbar**: service consumer + shadowing + network. inject = slots/timer;
   slot conversation.composer.dock cell stats (priority -1 shadows the builtin);
   consumes appearance.manager (implements the self-descriptor); host half
   registers dsh-statusbar.settings; browser persists to localStorage;
   capabilities.network = true.

**Minimal sidebar example** (universality self-test): a sidebar plugin needs no
new template — inject = slots; register your chosen sidebar slot; pick one
persistence option; copy the rest of the sections. The scaffolder's skeleton
plus this paragraph is the entire job.

## 4. Steps

1. **Archive**: git tag before migrating (e.g. v0.1.0-pre-paradigm); trial/
   example migrations also get an archive marker in docs/decisions.md.
2. **Scaffold**: node <whale-picks>/scripts/scaffold.mjs <name> --dest <repo>
   (or align the template file list by hand).
3. **Move**: map the code into its sections per §2 — move only, never change
   behavior in the same commit.
4. **Fill extension points**: inject / slots / services / persistence /
   self-descriptor (where applicable).
5. **Bilingual**: README.zh.md; move every UI string into locales.ts (zh keeps
   the original copy, add en).
6. **Test**: npm test green (existing assertions must still pass or get
   equivalent updates).
7. **Verify**:
   - node scripts/check-plugin.mjs <repo> — gate, exit 0;
   - node scripts/check-plugin.mjs <repo> --structure — alignment report;
   - node scripts/template-sync.mjs <repo> — skeleton drift self-check.
8. **Finish**: git rm --cached lib (if tracked); rebuild; for profile installs,
   remove the stale file: copy, reinstall and verify the live copy (workspace
   AGENTS.md).

## 5. Common pitfalls

- Shadowing a builtin slot without a lower priority (same id + same priority
  is rejected by the slot core).
- Schemastery leaking into the client bundle (purity: host half only).
- Changing behavior while migrating (separate commits for structure vs features).
- Half-moved copy: UI strings still hardcoded outside locales (--structure reports).
- The same insert id in both the bundle patch and the profile patch (duplicate
  loader entry id).
