# 鲸选插件范式 · Whale-picks Plugin Paradigm

English below. 本文是鲸选对 DSH 插件的**范式**定义：一套适用于**任何 DSH 插件**的统一
写作结构，而不是按插件类型定制的模板。类比：期刊论文的 IMRaD（标题-摘要-介绍-相关
工作-方法论-实验与结果-总结-参考文献）对所有论文成立；Python 抽象类、C++ 接口对所
有实现成立。写论文最稳当的写法是整体按范式来，做插件同样如此。

模板 templates/plugin 是范式的**唯一规范骨架**：固定分区一个不少，扩展点留给插件填
自己的"唯一一件事"。插件不在固定分区之外另造结构，也**不按类型分化**——没有"外观
模板""状态栏模板"，只有一组扩展点；明天有人写侧边栏插件，在同样的扩展点上填内容
即可。

## 1. 固定分区（七层，每节必有）

每层都有机器断言（check-plugin 门槛 + --structure 对齐报告），断言不通过即有信号。

| 分区 | 内容 | 机器断言 |
| --- | --- | --- |
| 合同层 | whalepicks.json：身份、scope 单功能合同、patches 冲突面、capabilities、成本 | schema + 与 package.json/patch 事实一致 |
| 宿主半区 | src/index.ts + plugin-schema.ts / plugin-settings.ts 拆分 | 存在；schema 与 client 隔离（purity） |
| 浏览器半区 | src/client/index.ts | 存在；仅 import 平台模块 |
| 文案层 | locales zh/en + README.md/README.zh.md | zh+en 双词典；locales 之外无 UI 文案 |
| 验证层 | tests/ + vitest | vitest 配置 + 测试存在 |
| 装载层 | cordis.patch.yml | insert id 唯一、与 patches.insertIds 双向一致 |
| 仓库规范层 | AGENTS.md / LICENSE / .gitignore / tsconfig / tsdown 双产物 | 文件齐全、lib 不跟踪 |

## 2. 扩展点（插件在固定位置填自己的内容）

1. **inject**：声明需要哪些平台服务（slots / locale / sessions / timer / …）。
2. **槽位注册**：任何槽位名均可（settings.general.item、settings.section、任意 dock
   单元……）。遮蔽规则是范式内置规则：要遮蔽同 id 的既有条目必须用更低的 priority
   （最低者渲染）；同 id 同 priority 会被槽位核心拒绝。
3. **服务提供/消费**：ctx.provide / ctx.get。dsh-appearance 的 appearance.manager 只是
   这种服务的第一个实例——范式教的是"如何定义与消费一个服务"，不是"如何接入外观"。
4. **设置持久化**：三选一——宿主命名空间注册 / localStorage（或 runtime 快照引擎）/
   不持久化。
5. **模块自述描述符**（范式级契约）：{ id, name, whalepicks 嵌入, settingsSchema,
   getState, setState }。任何希望把参数交给宿主面板渲染、并参与通用冲突/危险/性能
   体检的插件都实现它；dsh-appearance 是第一个消费者。
6. **宿主半区空实现**：browser-only 插件允许 apply 为 no-op——接口允许空实现，文件
   仍保留（可审查性不因功能少而打折）。

## 3. 四目标如何兑现

- **规范性（最低质量保证）**：门槛（whalepicks.json 过 schema + 与仓库事实一致）一票
  否决；--structure 对七个分区逐项断言，任何分区缺失都有信号。
- **可审查性**：固定阅读路径——合同 → 装载 → 宿主半区 → 浏览器半区 → 文案 → 验证。
  审查者不看代码也能定位任何插件的关键事实；结构检查保证这张地图总是存在。
- **依赖冲突可排查性**：冲突面（patches.insertIds / namespaces / slots / deps）在
  whalepicks.json 单点声明；check-plugin 与 registry 做交叉检测，运行期通用体检
  （dsh-appearance 的通用 checks）读同一份声明——声明一份、两处消费，不存在两套真相。
- **agent 友好性**：spec/AGENT.md 给出可执行的提示词；scaffold 生成骨架；--structure
  与 template-sync 给出机械的验证回路。agent 的工作回路固定为：生成/对齐骨架 → 填
  扩展点 → npm test → check-plugin（门槛）→ --structure（对齐）。

## 4. 迁移与实例

任何已有插件都可以迁移到范式，流程见 docs/migrate-to-paradigm.md。三个完整实例：

1. dsh-ui-attention —— 试验品（第一个过范式的插件），设置行插件形态；
2. dsh-appearance —— 服务提供者形态（settings.section + appearance.manager）；
3. dsh-statusbar —— 服务消费者 + 内置槽位遮蔽 + 联网形态。

普适性自测：脚手架生成的最小侧边栏示例（任意槽位）在不改模板任何文件的前提下通过
全部断言——保证范式不会重新滑向按类型分化。

---

# Whale-picks Plugin Paradigm

This file defines the whale-picks **paradigm** for DSH plugins: one unified
writing structure that applies to **any DSH plugin** — not a per-plugin-type
template. Analogy: a journal paper's IMRaD structure works for every paper;
an abstract class / interface works for every implementation. The surest way
to write a paper is to follow the paradigm; the surest way to write a plugin
is the same.

templates/plugin is the paradigm's **single canonical skeleton**: all fixed
sections present, with extension points left for the plugin's ONE thing.
Plugins add no structure beyond the fixed sections, and the paradigm never
forks per plugin type — there is no "appearance template" or "statusbar
template", only one set of extension points. A future sidebar plugin fills
the same points.

## 1. Fixed sections (seven, all mandatory)

Every section carries a machine assertion (check-plugin gate +
--structure alignment report); a failed assertion is a signal.

| Section | Contents | Machine assertion |
| --- | --- | --- |
| Contract | whalepicks.json (identity, scope contract, patches surface, capabilities, cost) | schema + facts matching package.json/patch |
| Host half | src/index.ts + plugin-schema.ts / plugin-settings.ts split | present; schema isolated from client (purity) |
| Browser half | src/client/index.ts | present; platform modules only |
| Copy | locales zh/en + README.md/README.zh.md | zh+en dictionaries; no UI copy outside locales |
| Verification | tests/ + vitest | vitest config + tests present |
| Loading | cordis.patch.yml | insert ids unique, bidirectionally listed in patches.insertIds |
| Repo conventions | AGENTS.md / LICENSE / .gitignore / tsconfig / tsdown dual build | files present; lib/ untracked |

## 2. Extension points (where the plugin fills in its own content)

1. **inject**: which platform services it needs (slots / locale / sessions / timer / …).
2. **Slot registration**: any slot name works (settings.general.item,
   settings.section, any dock cell …). Shadowing is a paradigm rule: to shadow
   an existing entry with the same id, register with a LOWER priority (lowest
   renders); same id + same priority is rejected by the slot core.
3. **Service provide/consume**: ctx.provide / ctx.get. dsh-appearance's
   appearance.manager is only the first instance of such a service — the
   paradigm teaches how to define and consume a service, not how to plug into
   the appearance page.
4. **Settings persistence**: pick one — host namespace registration /
   localStorage (or the runtime snapshot engine) / none.
5. **Module self-descriptor** (paradigm-level contract): { id, name, embedded
   whalepicks, settingsSchema, getState, setState }. Any plugin that wants its
   parameters rendered by a host panel and to join generic conflict/danger/
   performance checks implements it; dsh-appearance is its first consumer.
6. **Empty host half**: browser-only plugins may leave apply a no-op — the
   interface permits an empty implementation, the files remain.

## 3. How the four goals are delivered

- **Baseline quality**: the gate (schema-valid whalepicks.json matching repo
  facts) is a one-vote veto; --structure asserts every section.
- **Reviewability**: a fixed reading path — contract → loading → host half →
  browser half → copy → verification. A reviewer locates any plugin's key
  facts without reading the code; the structure check guarantees the map.
- **Conflict diagnosability**: the conflict surface (patches.insertIds /
  namespaces / slots / deps) is declared once in whalepicks.json; check-plugin
  cross-checks it against the registry and the runtime generic checks
  (dsh-appearance) read the same declaration — one declaration, two consumers.
- **Agent-friendliness**: spec/AGENT.md gives an executable prompt; scaffold
  generates the skeleton; --structure and template-sync give a mechanical
  verify loop. The agent loop is fixed: generate/align → fill extension points
  → npm test → check-plugin (gate) → --structure (alignment).

## 4. Migration and worked examples

Any existing plugin can migrate; see docs/migrate-to-paradigm.md. Three full
examples:

1. dsh-ui-attention — the trial subject (first plugin through the paradigm),
   settings-row shape;
2. dsh-appearance — service-provider shape (settings.section +
   appearance.manager);
3. dsh-statusbar — service-consumer + builtin-slot shadowing + network shape.

Universality self-test: a minimal sidebar example generated by the scaffolder
passes every assertion without changing any template file — keeping the
paradigm from ever forking per plugin type.
