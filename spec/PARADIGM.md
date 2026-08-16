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

机器断言分两档：**门槛断言**（check-plugin 门槛，一票否决；当前只覆盖合同层 / 装载层 /
仓库规范层的部分断言，--strict 才把全部七层断言并入差距并追加构建冒烟与测试断言）与
**报告断言**（--structure 对齐报告，覆盖全部七层，只报告，永远 exit 0）。

| 分区 | 内容 | 门槛断言（check-plugin 门槛 / --strict） | 报告断言（--structure，只报告） |
| --- | --- | --- | --- |
| 合同层 | whalepicks.json：身份、scope 单功能合同、patches 冲突面、capabilities、成本 | 门槛：过 schema + 与 package.json 名称/版本/仓库一致 + OSI 许可证 | schemaVersion=1.1；files 含 whalepicks.json |
| 宿主半区 | src/index.ts + plugin-schema.ts / plugin-settings.ts 拆分 | 仅 --strict：文件存在 | src/index.ts 存在 |
| 浏览器半区 | src/client/index.ts | 仅 --strict：文件存在 + 仅 import 平台模块 | src/client/index.ts 存在；client purity |
| 文案层 | locales zh/en + README.md/README.zh.md | 门槛：README.md 存在；仅 --strict：双语齐全 + 无 CJK 硬编码 | zh+en 双词典；README.zh.md；locales 之外无 UI 文案 |
| 验证层 | tests/ + vitest | 仅 --strict：vitest 配置 + ≥1 条 spec + 禁 passWithNoTests:true | vitest 配置 + 测试文件存在 |
| 装载层 | cordis.patch.yml | 门槛：patch 存在 + insert id 与 patches.insertIds 双向一致 + 与 registry 交叉无冲突 | insert id 无重复（双向一致复用门槛同一实现） |
| 仓库规范层 | AGENTS.md / LICENSE / .gitignore / tsconfig / tsdown 双产物 | 门槛：LICENSE 存在；仅 --strict：全部报告断言 + 构建冒烟（npm run bundle、lib 双产物、client 含 __ModuleLoader__.load） | 文件齐全、lib 不跟踪、tsdown banner、dsh.client/exports/scripts 声明 |

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
   getState, setState, roots? }。任何希望把参数交给宿主面板渲染、并参与通用冲突/危险/性能
   体检的插件都实现它；dsh-appearance 是第一个消费者。可选的 roots() 返回模块当前
   挂载的根元素，供管理页统计实时 DOM 节点占用（每插件精确的实时指标；分插件 JS 堆
   在同 realm 页面里不可测量）。
6. **半区豁免（对称）**：browser-only 插件允许宿主半区 apply 为 no-op——接口允许空实现，
   文件仍保留（可审查性不因功能少而打折）；反过来，host-only 插件（package.json 无
   dsh.client 块且无 src/client/）允许无浏览器半区——结构报告与 --strict 的浏览器半区
   断言（src/client、locale 词典、tsdown banner、exports ./client、构建冒烟的 client
   产物）记为豁免而非缺失，判定是纯机械的。

## 3. 九目标一原则：闭环如何兑现

**横切原则：机械可执行性。** 每个目标必须能回答「机器断言是什么、在哪个工件上跑、
不过会怎样」，否则降级为愿望，不列入本表。

**生命周期环**：生产 → 迁移 → 准入 → 分发 → 组合 → 运行 → 持续 → 退出 → 回流
（退出与复核结论回流 decisions.md 与模板，修正生产端，环闭合）。

| # | 目标 | 环节 | 声明 | 机器断言 | 消费方 | 时效 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 可生产性 | 生产 | 模板 + scaffold + spec/AGENT.md | CI scaffold 冒烟（生成骨架 → 门槛 → --strict） | 作者与 agent | 模板漂移检查（template-sync） |
| 2 | 可迁移性 | 迁移 | docs/adopt.md + check-plugin --init + migrate 文档 | --init 产物过 schema；双语完整性 | 第三方作者 | 文档与工具同步 |
| 3 | 准入基线 | 准入 | whalepicks.json | check-plugin 门槛；转正（listed/featured）--strict | 商店评审 | 每次提交重跑（CI） |
| 4 | 分发契约 | 分发 | install.spec、registry API | install.spec 格式校验、registry schema 校验；/v1 端点 + 完整性校验和为路线图项 | 商店前端与第三方消费方 | schema bump 必须带迁移路径 |
| 5 | 组合契约 | 组合 | patches.*、deps | 与事实交叉比对（对方仓库实际 patch）、遮蔽合法共存规则 | check-plugin、appearance 体检、suits | freshness nightly 事实回写 |
| 6 | 运行安全 | 运行 | capabilities、security（商店侧填写） | 静态信号对账（warning，非门槛、非审计）、redFlags 压安全轴 ≤2 | appearance 体检、雷达 | 发版重扫、红旗 30 天 SLA |
| 7 | 运行成本 | 运行 | perf 申报 | 申报格式校验；bundle 体积实测为路线图项 | appearance 体检、用户 | 发版实测 |
| 8 | 持续有效性 | 持续 | runtime.dsh、verifiedAgainst、radar | 范围格式校验 + 覆盖提示、分数衰减、freshness 后重算 | registry、雷达 | 90/180 天衰减、季度复核 |
| 9 | 退出与救济 | 退出 | charter 下架政策、decisions.md | 红旗 30 天 SLA、申诉通道 | 作者、用户 | SLA 计时 |

**四问自检法**：声明在哪？谁机器断言？谁消费？何时失效/复核？——缺一不成环。

与原「四目标」的关系：规范性 → 目标 3；可审查性 → 横切原则 + 目标 3；依赖冲突可
排查 → 目标 5；agent 友好 → 目标 1。安全与性能从准入表述中拆出，归入运行期
（目标 6/7）。

## 4. 迁移与实例

任何已有插件都可以迁移到范式，流程见 docs/migrate-to-paradigm.md。三个完整实例：

1. dsh-ui-attention —— 试验品（第一个过范式的插件），设置行插件形态；
2. dsh-appearance —— 服务提供者形态（settings.section + appearance.manager）；
3. dsh-statusbar —— 服务消费者 + 内置槽位遮蔽 + 联网形态。

普适性自测已机器化为 CI 步骤（.github/workflows/ci.yml 的 scaffold 冒烟）：每次提交
都从模板生成全新骨架，依次过占位符清零检查 → check-plugin 门槛 → --structure（报告
须全绿）→ npm install → npm run bundle → npm test → check-plugin --strict——骨架任何
退化都会直接红 CI。模板默认形态是 settings.general.item 设置行；任意槽位的插件
（侧边栏、dock、section……）在同样的扩展点上填内容即可，不需要新模板——保证范式
不会重新滑向按类型分化。

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

Every section carries machine assertions in two tiers: **gate assertions**
(the check-plugin admission gate, one-vote veto; today it covers only parts
of the contract / loading / repo-convention sections — --strict folds every
section assertion into the gap list and adds build + test smoke) and
**report assertions** (the --structure alignment report, covering all seven
sections, report-only, always exits 0).

| Section | Contents | Gate assertion (check-plugin gate / --strict) | Report assertion (--structure, report-only) |
| --- | --- | --- | --- |
| Contract | whalepicks.json (identity, scope contract, patches surface, capabilities, cost) | gate: schema-valid + name/version/repo matching package.json + OSI license | schemaVersion=1.1; files includes whalepicks.json |
| Host half | src/index.ts + plugin-schema.ts / plugin-settings.ts split | --strict only: file present | src/index.ts present |
| Browser half | src/client/index.ts | --strict only: file present + platform modules only | src/client/index.ts present; client purity |
| Copy | locales zh/en + README.md/README.zh.md | gate: README.md present; --strict only: bilingual + no hardcoded CJK | zh+en dictionaries; README.zh.md; no UI copy outside locales |
| Verification | tests/ + vitest | --strict only: vitest config + ≥1 spec + no passWithNoTests:true | vitest config + spec files present |
| Loading | cordis.patch.yml | gate: patch present + insert ids bidirectionally matching patches.insertIds + no clash with the registry | no duplicate insert ids (bidirectional check shared with the gate) |
| Repo conventions | AGENTS.md / LICENSE / .gitignore / tsconfig / tsdown dual build | gate: LICENSE present; --strict only: all report assertions + build smoke (npm run bundle, lib dual artifacts, client carries __ModuleLoader__.load) | files present; lib/ untracked; tsdown banner; dsh.client/exports/scripts declared |

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
   whalepicks, settingsSchema, getState, setState, roots? }. Any plugin that
   wants its parameters rendered by a host panel and to join generic
   conflict/danger/performance checks implements it; dsh-appearance is its
   first consumer. The optional roots() returns the module's currently-mounted
   root elements so the manager page can count its live DOM footprint (the
   exact per-plugin real-time metric — per-plugin JS heap is not measurable
   inside a shared-realm page).
6. **Half exemption (symmetric)**: browser-only plugins may leave the host-side
   apply a no-op — the interface permits an empty implementation, the files
   remain. Conversely, host-only plugins (no dsh.client block in package.json
   and no src/client/) may have no browser half at all — the structure report
   and --strict then record the browser-half assertions (src/client, locale
   dictionaries, tsdown banner, exports ./client, the client artifact in the
   build smoke) as exempt rather than missing; the detection is purely
   mechanical.

## 3. Nine goals, one principle: how the loop closes

**Cross-cutting principle: mechanical executability.** Every goal must answer
"what is the machine assertion, on which artifact does it run, what happens
when it fails" — otherwise it degrades to a wish and stays off this table.

**Lifecycle ring**: produce → migrate → admit → distribute → compose → run →
sustain → exit → feed back (exit and review outcomes flow back into
decisions.md and the template, fixing the production end — the ring closes).

| # | Goal | Stage | Declared in | Machine assertion | Consumers | Expiry |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Producibility | produce | template + scaffold + spec/AGENT.md | CI scaffold smoke (generate skeleton → gate → --strict) | authors & agents | template drift check (template-sync) |
| 2 | Migratability | migrate | docs/adopt.md + check-plugin --init + migration guide | --init output passes schema; bilingual completeness | third-party authors | docs stay in sync with the tools |
| 3 | Admission baseline | admit | whalepicks.json | check-plugin gate; --strict for promotion (listed/featured) | store review | re-run on every commit (CI) |
| 4 | Distribution contract | distribute | install.spec, registry API | install.spec format check, registry schema validation; /v1 endpoints + integrity checksums are roadmap items | store frontend & third-party consumers | schema bumps must carry a migration path |
| 5 | Composition contract | compose | patches.*, deps | cross-checked against facts (the other repo's actual patch); shadowing coexistence rules | check-plugin, appearance checks, suits | freshness nightly fact write-back |
| 6 | Runtime safety | run | capabilities, security (filled store-side) | static signal reconciliation (warning — not a gate, not an audit); redFlags cap the security axis at ≤2 | appearance checks, radar | rescan on release; red-flag 30-day SLA |
| 7 | Runtime cost | run | perf declarations | declaration format check; bundle-size measurement is a roadmap item | appearance checks, users | measured on release |
| 8 | Sustained validity | sustain | runtime.dsh, verifiedAgainst, radar | range format check + coverage hint, score decay, recompute after freshness | registry, radar | 90/180-day decay, quarterly review |
| 9 | Exit & remedy | exit | charter delisting policy, decisions.md | red-flag 30-day SLA, appeal channel | authors, users | SLA clock |

**Four-question self-check**: where is it declared? who asserts it by machine?
who consumes it? when does it expire / get re-reviewed? Missing any one breaks
the ring.

Mapping from the original four goals: baseline quality → goal 3; reviewability
→ the cross-cutting principle + goal 3; conflict diagnosability → goal 5;
agent-friendliness → goal 1. Security and performance are split out of the
admission wording into the runtime stage (goals 6/7).

## 4. Migration and worked examples

Any existing plugin can migrate; see docs/migrate-to-paradigm.md. Three full
examples:

1. dsh-ui-attention — the trial subject (first plugin through the paradigm),
   settings-row shape;
2. dsh-appearance — service-provider shape (settings.section +
   appearance.manager);
3. dsh-statusbar — service-consumer + builtin-slot shadowing + network shape.

The universality self-test is mechanized as a CI step (the scaffold smoke in
.github/workflows/ci.yml): every commit generates a fresh skeleton from the
template and runs it through a placeholder-free check → check-plugin gate →
--structure (the report must come back all-green) → npm install → npm run
bundle → npm test → check-plugin --strict — any skeleton regression turns CI
red. The template's default shape is a settings.general.item row; a plugin on
any other slot (sidebar, dock, section …) fills the same extension points and
needs no new template — keeping the paradigm from ever forking per plugin
type.
