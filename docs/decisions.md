# 审核决定流水 · Decisions Log

鲸选的信用来自公开的决定。收录、转正、拒收、下架，每一条都在这里，附日期与理由。规则见 charter.md。

## 2026-08-15

| 决定 | 条目 | 理由 |
| --- | --- | --- |
| 📐 manifest schema v1.0 → v1.1 | spec/whalepicks.schema.json | 新增**可选**字段 deps / perf（polls、memoryEstimateMB、gpu、timers）/ security（verdict、scanBy），供 dsh-appearance 外观管理器的通用冲突/危险/性能检查读取；1.0 清单保持合法（schemaVersion 枚举放宽）；adopt.md 同步说明 |
| 🏆 收录（编辑精选） | [dsh-ui-attention](https://github.com/LeeKai233/dsh-ui-attention) | 创始人自研并天天使用；深度复核通过（纯本地、零网络请求）；四维评分 5/4/4/5，总分 18 ≥ 16 门槛 |
| 🧪 进入候选池 ×10 | 见 README 候选池 | 机器体检完成（见 security-report.md）；待创始人亲测转正。其中 3 件带红旗，转正前必须处理：dshmarket（无 LICENSE）、dsh-skin（防冒名校验失败）、dsh-usage-stats（防冒名校验失败） |
| ⏳ 待裁定 | [deepseek-harness-desktop](https://github.com/anywhere-labs/deepseek-harness-desktop) | 非 dsh plugin 形态（桌面应用）；是否保留由创始人裁定 |
## 2026-08-15（基座一期）

| 决定 | 条目 | 理由 |
| --- | --- | --- |
| 📐 registry schema v1.0 → v1.1 | 全体条目 | 新增 specVersion / manifestCompliant（门槛）/ patches 冲突面 / 六轴 radar 字段；旧四维 score 字段保留为历史，转正门槛改用六轴（rubric.md 重写） |
| 🚧 启用规范门槛 | 全体条目 | spec/SPEC.md + whalepicks.schema.json + scripts/check-plugin.mjs 上线；listed/featured 必须 manifestCompliant=true |
| 🧪 试验品闭环 | dsh-ui-attention | 补 whalepicks.json（v1.0）+ AGENTS.md 并推送；check-plugin 门槛 PASS；六轴机器分：安全 5 / 边界 5 / 成本 5 / 活跃 5 / 兼容 5；真人分 5（创始人）；雷达 SVG 生成 |
| 🧪 门槛复查 | 候选池 ×10 | compute-scores 实测：10 件均无 whalepicks.json → manifestCompliant=false，转正前必须补 manifest（见 docs/adopt.md） |
| 🧪 进入候选池 | [dsh-whale-picks-store](https://github.com/LeeKai233/dsh-whale-picks-store) | 鲸选商店插件（第二个 dogfood）：模板脚手架创建，check-plugin 门槛 PASS（安全 4=诚实声明只读联网），已在创始人本地 web profile 冒烟安装（--dump-config 验证无冲突）；npm 发布后转正 |
