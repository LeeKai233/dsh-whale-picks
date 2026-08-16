# 鲸选安全体检报告 · Security Pass Report

> 体检日期：2026-08-16 · dsh 0.1.0-rc.6 · 范围：编辑精选 2 件 + 候选池 13 件（registry 全量 15 件）
> Pass date: 2026-08-16 · dsh 0.1.0-rc.6 · Scope: 2 Featured + 13 Candidates (15 registry entries)

## 方法学（Method）

机器体检检查 5 项（每一项都可复现、可质疑）：

1. **许可证**：GitHub API 的 license 字段（none = 红旗；2026-08-16 起无 LICENSE 可入候选池但挂红旗展示、不得转正）。
2. **npm 发布与防冒名**：包在 npm registry 存在；包的 repository 指针归一化后必须指向条目仓库（防同名/抢注包）。
3. **维护活跃度**：pushed_at 在近 6 个月内；仓库未 archived。
4. **文档与安装命令**：插件仓库 README 存在（check-plugin 门槛硬文件）；registry 条目的 install 命令以 `dsh plugin ` 开头（validate.mjs 强制）。
5. **静态信号对账（scanSignals）**：check-plugin 递归扫描 src/** 的网络特征（fetch(/XMLHttpRequest/sendBeacon/WebSocket）与危险特征（eval(/new Function），与 capabilities.network 声明比对，不一致出 warning（非门槛、非审计，不影响 exit code）；红旗由人工复核确认后记入 registry security.redFlags，非空即压安全轴 ≤2（compute-scores）。

**机器体检查不了的东西**（这些需要创始人转正时的深度人工复核）：运行时行为、依赖供应链、安装后实际联网去向、代码质量。**体检 ≠ 审计**，本报告不构成任何安全保证。

## 摘要（Summary）

| 条目 | 体检结果 | 红旗 |
| --- | --- | --- |
| dsh-ui-attention | ✅ 干净（深度复核通过） | 0 |
| dsh-session-search-warmup | ✅ 干净（深度复核通过） | 0 |
| dsh-session-search-plus | ✅ 干净（深度复核通过） | 0 |
| dsh-market | ⚠️ 待人工复核 | 1（无 LICENSE） |
| dsh-plugin-workshop | ✅ 机器项干净 | 0（npm 未发布，转正需发布） |
| dsh-find-plugin | ✅ 机器项干净 | 0 |
| dsh-whale-picks-store | ✅ 机器项干净 | 0（npm 未发布，转正需发布） |
| dsh-appearance | ✅ 机器项干净 | 0（npm 未发布，转正需发布） |
| dsh-statusbar | ✅ 机器项干净 | 0（npm 未发布，转正需发布） |
| dsh-web-ui | ✅ 机器项干净 | 0 |
| dsh-skin | ❌ 防冒名校验失败 | 1 |
| dsh-tianshu-tui | ✅ 机器项干净 | 0 |
| deepseek-harness-tui | ✅ 机器项干净 | 0 |
| deepseek-harness-desktop | ⚠️ 待创始人裁定 | 1（非插件形态） |
| dsh-agent-teams | ✅ 机器项干净 | 0 |
| dsh-usage-stats | ❌ 防冒名校验失败 | 1 |

## 逐件结论（Per-plugin findings）

### dsh-ui-attention

- 许可证 MIT ✅ · npm 发布 ✅ 且指针正确 ✅ · 活跃 ✅ · 文档 ✅ · 信号对账无命中 ✅（2026-08-16 复跑：src/** 无网络/危险特征，与 network=false 声明一致）。
- 深度复核（创始人自研，天天在用）：纯本地实现——WebAudio 合成提示音、浏览器通知、标题闪烁，**零网络请求**；通知权限仅在用户手势中申请；无遥测。
- 结论：**深度复核通过（reviewed）**。

### dsh-session-search-warmup

- 许可证 MIT ✅ · npm 0.3.1 发布 ✅ 且 repository 指针正确 ✅ · 活跃 ✅ · 文档 ✅ · 信号对账无命中 ✅（2026-08-16 实跑：src/** 无网络/危险特征，与 network=false 声明一致）。
- 深度复核（创始人自研，日常在用）：纯宿主态插件——无 dsh.client 块、无 src/client/，零网络请求；仅在启动安静窗口调用官方 sessionQuery 触发 FTS5 索引构建，15s×20 有界重试后放弃，无长驻轮询。check-plugin --strict 全绿（含宿主态豁免判定、构建冒烟、测试断言）。
- 实测（2026-08-16，dsh 0.1.0-rc.6）：预热后官方搜索首次查询 9–29ms（三种典型 MATCH），索引 12702 段文档、覆盖磁盘全部 22 条会话；索引库 mtime 与当日 harness 启动时刻（19:36）一致，预热按设计在启动窗口生效。
- 结论：**深度复核通过（reviewed）**。

### dsh-session-search-plus

- 许可证 MIT ✅ · npm 0.1.0 发布 ✅ 且 repository 指针正确 ✅（含 manifest 的 0.1.1 待 OTP 发布）· 活跃 ✅（2026-08-17 推送）· 文档 ✅（双语 README + 仓内 AGENTS.md）· 规范门槛 ✅（2026-08-17 本地复跑 check-plugin 门槛 PASS）。
- 信号对账（2026-08-17 实跑）：1 处网络特征 fetch(（src/client/workspace-browser.js:2716）——人工复核为**本机同源** `/api/search-plus/query`（自身宿主半区提供，非外部请求），与 network=false 声明的语义一致；无危险特征命中。
- 功能复核（深度复核）：宿主半区内存索引只存 user/assistant 消息文本，不碰工具参数/结果/推理；浏览器半区为官方 WorkspaceBrowser 逐字节 fork（改动带 [search-plus] 标记），页内高亮是纯 DOM 操作；跳转定位走运行时 chat 快照 anchorSeq，不做文本猜测。
- 实测（2026-08-17，Playwright + dsh 0.1.0-rc.6）：搜 npm 点命中后折叠 context 注入行自动展开、填充高亮 1 处 + 页内框选 97 处；深历史命中（seq 12）约 15s 翻页后精确定位；范式迁移后冒烟（搜索出结果、过滤按钮在位、无页面错误）。
- 结论：**深度复核通过（reviewed）**；同日完成范式结构迁移，check-plugin --strict 全绿。

### dsh-market

- 许可证：**GitHub API 返回 none —— 仓库无 LICENSE 文件** ⚠️。
- 其余机器项 ✅（npm 1.2.3 发布，指针正确，活跃）。
- 结论：**待人工复核**。转正前作者需补齐许可证（宪章硬门槛 #1）。功能本身口碑好，红旗更像疏漏而非恶意——但不补证不上架。

### dsh-plugin-workshop

- 机器项全 ✅（MIT、活跃、文档齐全）。
- npm 未发布（package.json 声明 @dsh-external/dsh-plugin-workshop 但 registry 404），仅 GitHub 安装。
- 结论：机器项干净；转正需先发布 npm（宪章硬门槛 #2，防冒名）。

### dsh-find-plugin

- 机器项全 ✅（MIT、npm 0.3.6 且指针正确、活跃）。
- 结论：机器项干净，无待复核项。

### dsh-whale-picks-store

- 许可证 MIT ✅ · 维护活跃 ✅（pushed_at 2026-08-15）· 规范门槛 ✅（manifestCompliant=true，2026-08-16 本地复跑 check-plugin 门槛 PASS）。
- npm 未发布（registry npmName 为 null；目前 file: 安装可用，转正前需 npm publish）。
- 信号对账（2026-08-16 实跑）：网络特征 fetch(（src/client/store-data.ts:72）与 capabilities.network=true 声明一致（info）；无危险特征命中。registry notes：只读远端 registry，无遥测。
- 结论：机器项干净，无待复核项；待创始人亲测转正。

### dsh-appearance

- 许可证 MIT ✅ · 维护活跃 ✅（pushed_at 2026-08-16）· 规范门槛 ✅（manifestCompliant=true，2026-08-16 本地复跑 check-plugin 门槛 PASS）。
- npm 未发布（转正前需 npm publish；目前 file: 安装可用）。
- 信号对账（2026-08-16 实跑）：无任何网络/危险特征命中，与 registry notes「外观管理器：零网络请求」一致。
- 结论：机器项干净，无待复核项；待创始人亲测转正。

### dsh-statusbar

- 许可证 MIT ✅ · 维护活跃 ✅（pushed_at 2026-08-16）· 规范门槛 ✅（manifestCompliant=true，2026-08-16 本地复跑 check-plugin 门槛 PASS）。
- npm 未发布（转正前需 npm publish）。
- 信号对账（2026-08-16 实跑）：3 处网络特征 fetch(（src/client/balance.ts:31、src/client/weather.ts:206/342）与 capabilities.network=true 声明一致（info）；无危险特征命中。registry notes：余额/天气浏览器直连官方接口。
- 结论：机器项干净，无待复核项；待创始人亲测转正。

### dsh-web-ui

- 机器项全 ✅（Apache-2.0、聚合包 @linxin666/dsh-web-ui-all 0.1.13 且指针正确指向本仓库、活跃）。
- 注意：monorepo，npm scope（linxin666）与 GitHub owner（zhu1090093659）不同，但指针正确，不构成红旗。
- 结论：机器项干净。

### dsh-skin

- **红旗：防冒名校验失败** ❌。npm 包 dsh-skin 0.2.0 的 repository 指针指向 **Highjobop/dsh-gadgets**，与本仓库 **KinGao294/dsh-skin** 不符。
- 可能原因：作者双账号、旧包未清理、或同名包被抢先发布。安装 dsh-skin 存在拿到别人代码的风险。
- 结论：**待人工核实**，核实前不建议按 npm 包名安装；核实结果记入 decisions.md。

### dsh-tianshu-tui

- 机器项全 ✅（Apache-2.0、npm 0.1.2-rc.6 且指针正确、活跃）。
- 结论：机器项干净。

### deepseek-harness-tui

- 机器项全 ✅（MIT、npm 0.2.1 且指针正确、活跃）。
- 结论：机器项干净。

### deepseek-harness-desktop

- 机器项全 ✅（MIT、活跃、文档齐全），但**非 dsh plugin 形态**（桌面应用而非 bundle）。
- 结论：**待创始人裁定**——本店以插件为主；若保留，需在条目中明确标注「非插件形态」。

### dsh-agent-teams

- 机器项全 ✅（MIT、npm 0.1.2 且指针正确、活跃）。
- 结论：机器项干净。

### dsh-usage-stats

- **红旗：防冒名校验失败** ❌。npm 包 dsh-usage-stats 0.1.12 的 repository 指针指向 **lanlandeli/dsh-usage-stats**，与本仓库 **Make0209/dsh-usage-stats** 不符。
- 结论：**待人工核实**，核实前不建议按 npm 包名安装；核实结果记入 decisions.md。

## 局限与声明（Limits & disclaimer）

本报告是机器体检快照，**不是安全审计**：不覆盖运行时行为、依赖供应链与安装后的真实联网去向。深度人工复核由创始人在转正时完成。安装任何第三方插件都意味着在你的机器上以你的权限运行第三方代码。
