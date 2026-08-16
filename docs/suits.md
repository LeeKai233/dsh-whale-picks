# 套件 · Suits

English below. 套件（suit）是鲸选对「1+1>2」的官方背书：把边界清晰、可组合的单功能插件打包成一套推荐组合。数据在 data/suits.json，schema 在 data/suits.schema.json；suits.json 已由 CI 按 suits.schema.json 校验（成员 tier 不允许 candidate）。

## 为什么套件属于鲸选

Unix 哲学的另一半：**单功能插件单独看是零件，组合起来才是工具**。大而全的插件之所以被门槛挡在门外，就是为了把「组合权」留给用户与套件——边界清晰的插件才能预测性地组合。

## 组合标准（suit 上架同样过门槛）

1. **成员全部 listed 以上**：套件不装候选池的东西（成员必须先亲测转正；schema 直接禁止 candidate 成员）。
2. **冲突面干净**：成员 patches.insertIds / namespaces / slots 的并集无重复；有冲突的插件只能互相排斥（写进 suit.conflicts）。注意：同槽位不同 priority 的合法遮蔽（平台遮蔽语义，最低 priority 渲染）不算冲突。
3. **synergy 必须说清**：为什么是 1+1>2 而不是 1+1=2——场景、工作流或数据的化学反应，双语写进 synergy 字段。
4. **套件级六轴雷达**：由成员分聚合（最小值保底 + 均值），同样展示雷达图；套件 tier 与插件同一分级。
5. **宁缺毋滥**：当前已收录插件只有 1 件，因此 data/suits.json 是空数组——**不造假**。第一个真实套件会在转正插件足够时出现（预期：鲸选商店插件转正后，与某个互补插件组成第一套）。

## 未来套件方向（示例，不作承诺）

- 商店 + 发现：鲸选商店插件 × 插件发现类插件——逛店与找货闭环；
- 提醒 + 用量：dsh-ui-attention × 用量统计——回合结束提醒 + 成本感知；
- 终端 + 桌面：TUI × 桌面壳——同 profile 的跨端组合。

---

# Suits

A suit is the store's official endorsement of "1+1>2": sharply-bounded, composable single-purpose plugins packaged into one recommended bundle. Data lives in data/suits.json, schema in data/suits.schema.json; suits.json is validated in CI against suits.schema.json (candidate-tier members are not allowed).

## Why suits belong to whale-picks

The other half of the Unix philosophy: **a single-purpose plugin alone is a part; composed, they become tools**. Kitchen-sink plugins are kept out by the gate precisely so that the power of composition stays with users and suits — only sharply-bounded plugins compose predictably.

## Composition criteria (suits pass a gate too)

1. **All members listed or above**: suits carry nothing from the candidate pool (members must pass the founder's hands-on test first; the schema flatly rejects candidate members).
2. **Clean conflict surface**: the union of members' patches.insertIds / namespaces / slots has no duplicates; clashing plugins can only be mutually exclusive (recorded in suit.conflicts). Note: legitimate shadowing of the same slot with different priorities (the platform shadowing semantics — lowest priority renders) is NOT a conflict.
3. **synergy must be spelled out**: why it is 1+1>2 and not 1+1=2 — the chemistry of scenarios, workflows or data, written bilingually into the synergy field.
4. **Suit-level six-axis radar**: aggregated from member scores (floor = minimum, plus the mean), rendered as a radar chart like plugins; suits share the plugins' tier scale.
5. **宁缺毋滥 (no filler)**: only one plugin is currently listed, so data/suits.json is an empty array — **no fake data**. The first real suit appears once enough plugins are promoted (expected: the whale-picks store plugin, once promoted, composed with a complementary plugin).

## Future suit directions (examples, no promises)

- Store + discovery: the whale-picks store plugin × a plugin-discovery plugin — browsing and finding in one loop;
- Attention + usage: dsh-ui-attention × a usage-stats plugin — turn-finished alerts plus cost awareness;
- Terminal + desktop: TUI × desktop shell — a cross-end combo on the same profile.
