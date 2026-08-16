# 选品宪章 · Curation Charter

English below. 鲸选 dsh-whale-picks 只收「敢装、值得装」的插件。本文件是全店的最高规则：任何条目必须满足硬门槛，正式收录还必须通过品味门槛。规则写在这里而不是创始人的脑子里——所有人都能拿它来挑战我们的决定。

## 硬门槛（Hard gates，一票否决）

**第 0 条（规范门槛）**：仓库根目录携带符合 spec/SPEC.md 的 whalepicks.json，并通过 scripts/check-plugin.mjs（manifestCompliant=true）。不合规连候选池的评分资格都没有——这是模板的强制力。

任何条目（包括候选池）必须全部满足：

1. **开源许可证**：无 LICENSE 的条目可入候选池，但必须挂红旗展示（待人工复核）；转正（listed/featured）必须有 LICENSE 文件且为 OSI 认可许可证——无许可证不转正。
2. **可溯源**：有公开 GitHub 仓库；若发布到 npm，npm 包的 `repository` 指针必须指回同一仓库（防冒名校验，防止同名包/抢注包混入）。
3. **有文档**：有 README 和明确的安装命令。
4. **有维护**：近 6 个月内有代码推送；仓库未 archived。
5. **无安全红线**：机器体检（见 security-report.md 方法学）未发现红旗；有红旗的条目必须以「待人工复核」状态展示，复核通过前不得转正。

## 品味门槛（Taste gates，转正必需）

从候选池转正为「已收录 / 编辑精选」还必须：

1. **创始人亲测**：创始人在真实 profile 中安装并至少完成一个完整会话的使用。
2. **手记**：创始人写下使用手记（为什么入选、使用感受、注意事项、不适合谁），写入 registry 的 reviewNotes。
3. **六轴雷达评分过线**：按 rubric.md 打分，总分 ≥ 24 且安全 ≥ 4 且兼容 ≥ 4 且真人轴非空。
4. **同类唯一**：同一功能场景只收最好的一件。若两件难分高下，收先亲测的一件，另一件记录在 decisions.md 并说明理由。
5. **每分类上限 5 件**：满员后新插件必须挤掉现有条目（下架记录进 decisions.md）。宁缺毋滥不是口号，是上限写死。

## 下架政策（Delisting）

- 条目 archived、停更超过 6 个月且无替代维护者、出现新的安全红线：直接下架。
- 下架、拒收、转正，全部记入 docs/decisions.md，附日期与理由。**决定公开是鲸选的信用来源。**

## 退出与救济（Exit & remedy）

- **下架政策**：见上节（archived / 停更超 6 个月 / 新安全红线 → 直接下架）。
- **申诉与复核**：作者对拒收、下架或红旗有异议，可通过 issue 表单申诉；创始人 14 天内复核，结论公开记入 docs/decisions.md。
- **红旗处置 SLA**：红旗自记录起 30 天内必须处置——修复并验证、转为下架、或裁定保留；逾期自动升级为创始人亲裁。

---

# Curation Charter

Whale-picks (dsh-whale-picks) carries only plugins you can install with confidence. This file is the store's highest law: hard gates for any listing, taste gates for promotion. The rules live here — not in the founder's head — so anyone can hold our decisions against them.

## Hard gates (one-strike vetoes)

Every entry, including candidates, must satisfy all of:

1. **Open-source license**: entries without a LICENSE file may enter the candidate pool but are displayed with a red flag (pending human review); promotion (listed/featured) requires a LICENSE file under an OSI-approved license — no license, no promotion.
2. **Traceable**: a public GitHub repo; when published to npm, the npm `repository` pointer must resolve to that same repo (anti-squatting check against same-name/typosquat packages).
3. **Documented**: a README and an explicit install command.
4. **Maintained**: pushed within the last 6 months; not archived.
5. **No red flags**: the machine pass (method in security-report.md) finds no red flags; flagged entries stay visible as "pending human review" and cannot be promoted until cleared.

## Taste gates (required for promotion)

To become Listed / Featured:

1. **Founder-tested**: installed by the founder in a real profile and used through at least one full session.
2. **Notes**: the founder writes review notes (why it got in, how it feels, gotchas, who it is not for) into the registry's reviewNotes.
3. **Six-axis radar above the gate**: per rubric.md — total ≥ 24 with security ≥ 4, compatibility ≥ 4, and a non-empty human axis.
4. **One per niche**: only the single best plugin per use case. Ties go to the one tested first; the runner-up is recorded in decisions.md with the reasoning.
5. **Max 5 per category**: when a category is full, a new admission must displace an existing one (delisting goes to decisions.md). 宁缺毋滥 is enforced by hard caps, not slogans.

## Delisting

Archived, stalled for 6+ months without a maintainer, or new red flags → delisted immediately. Every delisting, rejection, and promotion is logged in docs/decisions.md with date and reasoning. **Published decisions are the store's credit.**

## Exit & remedy

- **Delisting policy**: see the previous section (archived / stalled 6+ months / new red flags → immediate delisting).
- **Appeals**: an author may appeal a rejection, delisting or red flag via the issue form; the founder re-reviews within 14 days and publishes the conclusion in docs/decisions.md.
- **Red-flag SLA**: every red flag must be disposed within 30 days of recording — fixed and verified, converted to a delisting, or ruled to stay; overdue flags auto-escalate to a founder ruling.
