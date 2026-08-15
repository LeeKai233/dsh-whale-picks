# 评分标准 · Scoring Rubric

English below。鲸选对**已上架（listed/featured）**插件展示六轴雷达，每个轴 0–5 分。**规范符合（manifestCompliant）不是雷达轴，而是上架门槛**：whalepicks.json 过 schema 且与仓库事实一致，由 scripts/check-plugin.mjs 判定，一票否决。

## 六轴雷达

| 轴 | 0 | 3 | 5 | 打分方式 |
| --- | --- | --- | --- | --- |
| **真人评分 Human** | 无人用过 / 差评居多 | 少数人用过，褒贬不一 | 创始人 + 社区一致好评 | 人工（创始人起步，二期接 GitHub Discussions） |
| **机器安全 Security** | 有未解决红旗 | 红旗已澄清 | 本地优先、无遥测、权限面最小 | 机器：体检映射 + 能力声明 |
| **兼容性 Compatibility** | 当前 dsh 跑不起来 | 可用但有小问题 | 当前 dsh 版本完整实测通过 | 机器：verifiedAgainst/lastVerified |
| **边界与冲突 Scope** | 大而全 / 与别家 insert id 冲突 | 功能偏多或边界不清 | 单一职责 + 明确非目标 + 冲突面干净 | 机器：scope 声明 + insertIds 交叉检测 |
| **成本 Cost** | 许可证不合规 / 核心功能付费墙 | 许可证合规但有付费档 | 开源许可 + 完全免费 | 机器：SPDX + paid 声明 |
| **活跃度 Activity** | archived / 半年无推送 | 更新不规律 | 近 30 天活跃、issue 有响应 | 机器：pushed_at 映射 |

## 转正门槛（candidate → listed/featured）

1. **门槛 PASS**：check-plugin.mjs 通过（manifestCompliant=true）；
2. **雷达底线**：安全 ≥ 4、兼容 ≥ 4、真人评分非空（创始人亲测），六轴总分 ≥ 24；
3. 其余条件见 charter.md（亲测、手记、同类唯一、每分类上限 5）。

分数与理由记入 decisions.md；机器轴每次 compute-scores 重算，人工轴带证据与日期。评分不是终身制：每次 dsh 版本变化或每季度复核，复核日期写入 lastVerified。

---

Whale-picks shows a six-axis radar for every **listed/featured** plugin, each axis 0–5. **Spec compliance is not an axis — it is the admission gate**: whalepicks.json schema-valid and matching repo facts, judged by scripts/check-plugin.mjs, one-vote veto.

## The six axes

| Axis | 0 | 3 | 5 | Source |
| --- | --- | --- | --- | --- |
| **Human** | nobody uses it / mostly negative | few users, mixed | founder + community consistently positive | humans (founder first; GitHub Discussions in phase 2) |
| **Security** | unresolved red flags | flags clarified | local-first, no telemetry, minimal permissions | machine: pass mapping + capability declarations |
| **Compatibility** | does not run on current dsh | runs with issues | fully verified on the current dsh | machine: verifiedAgainst/lastVerified |
| **Scope & conflict** | kitchen sink / insert-id clashes | feature-heavy or fuzzy boundary | single purpose + explicit non-goals + clean conflict surface | machine: scope declaration + insertIds cross-check |
| **Cost** | non-compliant license / core features paywalled | compliant license, paid tiers | open-source + fully free | machine: SPDX + paid declaration |
| **Activity** | archived / 6+ months silent | irregular updates | active within 30 days, issues answered | machine: pushed_at mapping |

## Promotion gate (candidate → listed/featured)

1. **Gate PASS**: check-plugin.mjs green (manifestCompliant=true);
2. **Radar floor**: security ≥ 4, compatibility ≥ 4, human rating present (founder test), six-axis total ≥ 24;
3. Everything else lives in charter.md (hands-on test, notes, one per niche, max 5 per category).

Scores and reasoning go to decisions.md; machine axes recompute on every compute-scores run, human axes carry evidence and dates. Scores expire: re-verified per dsh release or quarterly, recorded in lastVerified.
