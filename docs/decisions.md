# 审核决定流水 · Decisions Log

鲸选的信用来自公开的决定。收录、转正、拒收、下架，每一条都在这里，附日期与理由。规则见 charter.md。

## 2026-08-17

| 决定 | 条目 | 理由 |
| --- | --- | --- |
| 🧪 进入候选池 | [dsh-session-search-plus](https://github.com/LeeKai233/dsh-session-search-plus) | 创始人自研：侧栏搜索就地增强（内存索引毫秒检索 + 过滤 + 多命中下拉 + seq 锚点跳转高亮）。check-plugin 门槛 2026-08-17 PASS；npm 0.1.0 已发布且 repository 指针正确（含 manifest 的 0.1.1 待 OTP 发布）。当日 Playwright 实测（dsh 0.1.0-rc.6）：锚点跳转、折叠 context 自动展开、填充高亮+框选全通。signals 一条 fetch( 警告已人工复核为本机同源路由。未做范式结构迁移、--strict 未过 + 创始人亲测记录未补——维持候选，转正时再补。compute-scores 因 raw.githubusercontent.com 超时未跑通，机器轴为人工按门槛口径填写，待网络恢复后复跑校准 |

## 2026-08-16

| 决定 | 条目 | 理由 |
| --- | --- | --- |
| 🧪 试验品（存档标记，开始） | [dsh-ui-attention](https://github.com/LeeKai233/dsh-ui-attention) | 鲸选插件范式（spec/PARADIGM.md）的第一个试验品：先行通过模板 v2 对齐与工具链验证（scaffold/--structure/template-sync），确立 canonical reference 后再迁移 appearance/statusbar。迁移前存档：git tag v0.1.2-pre-paradigm。试验结论待闭环补写 |
| 🧪 试验品（存档标记，闭环） | dsh-ui-attention | 试验结论：删除残留 TEMPORARY PROBE 调试代码；files 补 whalepicks.json；whalepicks.json bump 1.1（deps/perf/security 按事实填写）；AGENTS/README 标记试验品身份。验收全绿：npm test 93/93、check-plugin 门槛 PASS、--structure 全绿、template-sync 零漂移。有意豁免 4 项归档于其 docs/DEVELOPMENT（runtime 快照引擎、2 个额外平台模块、3 个额外 devDeps、shims 已回流模板）。试验品状态：已归档，确立为 canonical reference |
| 📐 模板 v2 + 范式成文 | templates/plugin 全体 + spec/PARADIGM.md | 模板 whalepicks.json bump 1.1（deps/perf/security）；补齐全量平台模块表、测试 shims、DEVELOPMENT 骨架、扩展点注释；新增 PARADIGM.md 把「统一范式、不按类型分化」正式成文；SPEC 第 3 节同步 |
| 🛠 迁移工具链上线 | scripts/scaffold.mjs + check-plugin --init 1.1 / --structure + scripts/template-sync.mjs | 第三方迁移能力：scaffold 生成范式骨架；--structure 输出对齐报告（只报告不进门槛，门槛仍以 whalepicks.json 事实一致性为准）；template-sync 做骨架漂移自查。全部零运行时依赖 |
| 📐 appearance.manager 契约 i18n 接缝 | dsh-appearance | 模块自述描述符的 name/title/desc/placeholder 支持 string（旧值直显）或 { key }（走模块 t）；检查结果改为结构化 CheckItem {level, key, params}（manager 保持纯函数），渲染经 locale 词典——范式「文案双语」规则在通用体检页面的落实 |
| 🧪 进入候选池 | [dsh-appearance](https://github.com/LeeKai233/dsh-appearance) | 范式范例 #2（服务提供者 + settings.section）：迁移完成，check-plugin 门槛 PASS、--structure 全绿、template-sync 零漂移、12/12 测试；迁移前存档 git tag v0.1.0-pre-paradigm。npm 发布后转正 |
| 🧪 进入候选池 | [dsh-statusbar](https://github.com/LeeKai233/dsh-statusbar) | 范式范例 #3（服务消费者 + dock#stats 遮蔽 + 联网）：迁移完成，check-plugin 门槛 PASS（安全 4=诚实声明联网）、--structure 全绿、template-sync 零漂移、20/20 测试（zh 栏内文案逐字不变）；迁移前存档 git tag v0.1.0-pre-paradigm。npm 发布后转正 |
| 📐 registry schema 校验收紧 | data/schema.json + data/suits.schema.json | radar 轴 evidence 加 minLength:4、updatedAt 加日期 pattern；suits 成员 tier 去 candidate。SPEC §7 已记录，validate.mjs 同步强制 |
| 🛠 check-plugin --strict 上线 | scripts/check-plugin.mjs | 门槛 + 七分区结构断言 + 构建冒烟（npm run bundle、lib 双产物、client 含 __ModuleLoader__.load）+ 测试断言（≥1 条 spec、禁 passWithNoTests:true）；listed/featured 转正强挂 --strict（根 AGENTS.md / SPEC / AGENT.md / 模板 AGENTS.md 同步） |
| 🛠 静态信号对账上线 | scripts/check-plugin.mjs（scanSignals） | 递归扫描 src/** 网络特征（fetch(/XMLHttpRequest/sendBeacon/WebSocket）与危险特征（eval(/new Function），与 capabilities 声明比对出 warning；非门槛、非审计，不影响 exit code |
| 📐 redFlags 压安全轴 ≤2 | scripts/compute-scores.mjs | registry 条目 security.redFlags 非空 → security 轴 ≤2 且 evidence 追加「存在未解决红旗（N 条）」 |
| 🛠 freshness 事实回写 + 链式重算 | scripts/freshness.mjs + freshness.yml | 每晚刷新 stars/pushedAt 后回写事实：拉各条目实际 cordis.patch.yml 重抽 insertIds、拉 whalepicks.json 回写 namespaces/slots（拉不到保持原值）；链式 compute-scores → render-radar → render-readme 并自动提交 |
| 📐 security.verdict 改商店侧填写 | spec/whalepicks.schema.json + templates/plugin | verdict description 改为「商店侧体检管道填写，作者自填无效（registry security 字段为准）」；模板 whalepicks.json 与 --init 均不再预填 security 块 |
| 📐 宪章修订 | docs/charter.md | 转正线改六轴雷达（总分 ≥ 24 且安全 ≥ 4 且兼容 ≥ 4 且真人轴非空，与 rubric/validate 一致）；无 LICENSE 可入候选池但挂红旗展示、不得转正（listed/featured 必须 OSI 许可证）；新增「退出与救济」（申诉 14 天复核、红旗 30 天 SLA） |
| ⏳ 红旗处置 SLA 启动 | dsh-market（无 LICENSE）、dsh-skin（防冒名失败）、dsh-usage-stats（防冒名失败） | 三件悬置红旗处置期限 2026-09-15（30 天 SLA 自 2026-08-16 起）：修复并验证、转为下架或裁定保留；逾期自动升级创始人亲裁 |
| ⏳ 待裁定 SLA | [deepseek-harness-desktop](https://github.com/anywhere-labs/deepseek-harness-desktop) | 非 dsh plugin 形态的待裁定项同期限（2026-09-15） |
| 🏆 转正复核（维持 featured） | [dsh-ui-attention](https://github.com/LeeKai233/dsh-ui-attention) | 按新标复核通过：check-plugin --strict 全绿（七分区 + 构建冒烟 + 93 测试）、信号对账零命中、作者预填 security 块随插件仓库 6235471 移除；机器轴分值不变故 evidence/updatedAt 保持原值（mergeAxis 语义），human 轴与 lastVerified 仍为 2026-08-15 创始人实测；同次重算为 dsh-appearance / dsh-statusbar 两件合规候选补上机器五轴 |
| 📐 范式补对称豁免（host-only 形态） | spec/PARADIGM.md 扩展点 6 + scripts/check-plugin.mjs | 豁免原只覆盖 browser-only（宿主半区可空实现）；dsh-session-search-warmup 是首个纯宿主态插件，逼出反向缺口：package.json 无 dsh.client 块且无 src/client/ 即 host-only，浏览器半区断言（src/client、locale、tsdown banner、exports ./client、构建冒烟 client 产物）机械判定为豁免而非缺失。schemaVersion 不动（无 manifest 字段变更） |
| 🏆 收录（编辑精选） | [dsh-session-search-warmup](https://github.com/LeeKai233/dsh-session-search-warmup) | 创始人自研并日常使用；2026-08-16 实测（dsh 0.1.0-rc.6）：预热后官方搜索首次查询 9–29ms，索引 12702 段文档覆盖全部 22 条会话。机器五轴 5/5/5/5/5 + 真人 5 = 30 ≥ 24；check-plugin --strict 全绿、信号对账零命中；npm 0.3.1 发布且 repository 指针正确；深度复核见 security-report.md。范式纯宿主态对称豁免的首个实例 |
| 🐛 registry schema 对齐 manifest | data/schema.json | category 枚举漏了 manifest 合法的 "other"（此前无条目使用该值而未暴露）；已补齐，validate 通过 |
| 🐛 转正合同去掉旧四维 score 硬要求 | scripts/validate.mjs | featured/listed 仍要求 legacy score 字段——四维→六轴迁移的残留（score 已声明仅历史、README 已撤下展示）；现以六轴雷达合同为准，attention 条目的旧 score 字段保留为历史 |
| 🐛 README 渲染吞掉 other 分类 | scripts/render-readme.mjs | CATEGORY_ORDER/CATEGORY_LABEL 无 "other"，featured 条目渲染时静默消失；已补分类并加兜底——未知分类按原始 key 渲染而非丢弃 |
| 📐 registry schemaVersion 1.1 → 1.2 | data/schema.json + data/plugins.json + scripts/compute-scores.mjs | radar 轴重定义为九范式机器轴（producibility/adoptability/baseline/distribution/composition/safety/footprint/freshness/remedy）+ human 真人轴保留；旧 security/compatibility/scope/cost/activity 五键移除（activity/compatibility 内部逻辑改作 freshness 输入）；迁移 = 机器轴全部重算（compute-scores 全量重跑，mergeAxis 语义不变） |
| 📐 转正合同重定义 | scripts/validate.mjs + docs/rubric.md + docs/charter.md | 十轴总分 ≥ 40 且 safety ≥ 4 且 freshness 非空 ≥ 4 且 human 非空（evidence 非占位串）；旧 security/compatibility 轴检查随轴重定义退役 |

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
