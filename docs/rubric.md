# 评分标准 · Scoring Rubric

English below。鲸选对**已上架（listed/featured）**插件展示九维兑现度雷达：九个范式机器轴各 0–5 分，由 scripts/compute-scores.mjs 程序化重算。**真人轴不进雷达图**，在 README 条目块单列一行。**规范符合（manifestCompliant）不是雷达轴，而是上架门槛**：whalepicks.json 过 schema 且与仓库事实一致，由 scripts/check-plugin.mjs 判定，一票否决（其结果同时构成准入轴）。

## 九范式轴（机器）

| 轴 | key | 0–5 计分 | 打分方式 |
| --- | --- | --- | --- |
| **生产 Producibility** | producibility | 起 5：manifest schemaVersion≠1.1 −1；package.json files 未含 whalepicks.json −2；dsh 块不完整 −2；floor 0 | 机器：manifest + package.json 事实 |
| **迁移 Adoptability** | adoptability | 起 5：README.zh.md 不可达 −2；description 非双语 −2；install.spec 空 −1；keywords 空 −1；links.repo 空 −1；floor 0 | 机器：manifest 声明 + 仓库拉取 |
| **准入 Baseline** | baseline | check-plugin 门槛 PASS → 5；FAIL → 0 | 机器：门槛复跑 |
| **分发 Distribution** | distribution | npm 已发布且 repository 指针正确 → 5；已发布但指针不符 → 2；未发布 → 1；未知 → 2 | 机器：registry security 事实 |
| **组合 Composition** | composition | 起 5：insertIds 非数组 −2；slots/namespaces 字段缺失各 −1；无 deps 字段 −1；floor 0 | 机器：manifest 冲突面申报 |
| **安全 Safety** | safety | 起 5：network −1、telemetry −2、许可证 gap 扣分；未解决红旗压 ≤2 | 机器：体检映射 + 能力声明（详见 security-report.md） |
| **开销 Footprint** | footprint | perf 四键（polls/memoryEstimateMB/gpu/timers）齐 → 5；部分 → 3；无 perf → 2 | 机器：manifest perf 申报 |
| **保鲜 Freshness** | freshness | 活跃度（pushed_at 映射）与兼容性（verifiedAgainst/lastVerified 衰减）可用值平均（四舍五入）；双缺 → null | 机器：pushed_at + 实测衰减合成 |
| **救济 Remedy** | remedy | 未决红旗 → 2；reviewStatus=reviewed → 5；pending-human → 3；其他 → 3 | 机器：registry 治理状态 |

## 真人轴（Human，单列，不进雷达）

| 0 | 3 | 5 | 打分方式 |
| --- | --- | --- | --- |
| 无人用过 / 差评居多 | 少数人用过，褒贬不一 | 创始人 + 社区一致好评 | 人工（创始人起步，二期接 GitHub Discussions） |

## 转正门槛（candidate → listed/featured）

1. **门槛 PASS**：check-plugin.mjs 通过（manifestCompliant=true）；
2. **雷达底线**：安全 ≥ 4、保鲜非空且 ≥ 4、真人评分非空且 evidence 非占位串（创始人亲测），十轴（九机器轴 + 真人轴）总分 ≥ 40；
3. 其余条件见 charter.md（亲测、手记、同类唯一、每分类上限 5）。

分数与理由记入 decisions.md；机器轴每次 compute-scores 重算，人工轴带证据与日期。评分不是终身制：每次 dsh 版本变化或每季度复核，复核日期写入 lastVerified。

---

Whale-picks shows a nine-goal radar for every **listed/featured** plugin: nine paradigm machine axes, each 0–5, recomputed programmatically by scripts/compute-scores.mjs. **The human axis is not part of the radar chart** — it renders as a separate line in the README entry block. **Spec compliance is not an axis — it is the admission gate**: whalepicks.json schema-valid and matching repo facts, judged by scripts/check-plugin.mjs, one-vote veto (its result also forms the baseline axis).

## The nine paradigm axes (machine)

| Axis | Key | 0–5 scoring | Source |
| --- | --- | --- | --- |
| **Producibility** | producibility | start at 5: manifest schemaVersion≠1.1 −1; package.json files missing whalepicks.json −2; incomplete dsh block −2; floor 0 | machine: manifest + package.json facts |
| **Adoptability** | adoptability | start at 5: README.zh.md unreachable −2; description not bilingual −2; empty install.spec −1; empty keywords −1; empty links.repo −1; floor 0 | machine: manifest declarations + repo fetches |
| **Baseline** | baseline | check-plugin gate PASS → 5; FAIL → 0 | machine: gate re-run |
| **Distribution** | distribution | npm published with a correct repository pointer → 5; published but mismatched → 2; unpublished → 1; unknown → 2 | machine: registry security facts |
| **Composition** | composition | start at 5: insertIds not an array −2; slots/namespaces fields missing −1 each; no deps field −1; floor 0 | machine: manifest conflict-surface declaration |
| **Safety** | safety | start at 5: network −1, telemetry −2, license gaps; unresolved red flags cap at ≤2 | machine: pass mapping + capability declarations (see security-report.md) |
| **Footprint** | footprint | all four perf keys (polls/memoryEstimateMB/gpu/timers) → 5; partial → 3; no perf → 2 | machine: manifest perf declaration |
| **Freshness** | freshness | rounded mean of the available values of activity (pushed_at mapping) and compatibility (verifiedAgainst/lastVerified decay); null when both missing | machine: pushed_at + verification decay |
| **Remedy** | remedy | unresolved red flags → 2; reviewStatus=reviewed → 5; pending-human → 3; otherwise → 3 | machine: registry governance state |

## The human axis (separate, not in the radar)

| 0 | 3 | 5 | Source |
| --- | --- | --- | --- |
| nobody uses it / mostly negative | few users, mixed | founder + community consistently positive | humans (founder first; GitHub Discussions in phase 2) |

## Promotion gate (candidate → listed/featured)

1. **Gate PASS**: check-plugin.mjs green (manifestCompliant=true);
2. **Radar floor**: safety ≥ 4, freshness present and ≥ 4, human rating present with non-placeholder evidence (founder test), ten-axis total (nine machine axes + human) ≥ 40;
3. Everything else lives in charter.md (hands-on test, notes, one per niche, max 5 per category).

Scores and reasoning go to decisions.md; machine axes recompute on every compute-scores run, human axes carry evidence and dates. Scores expire: re-verified per dsh release or quarterly, recorded in lastVerified.
