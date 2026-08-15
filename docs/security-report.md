# 鲸选安全体检报告 · Security Pass Report

> 体检日期：2026-08-15 · dsh 0.1.0-rc.6 · 范围：编辑精选 1 件 + 候选池 10 件
> Pass date: 2026-08-15 · dsh 0.1.0-rc.6 · Scope: 1 Featured + 10 Candidates

## 方法学（Method）

机器体检检查 5 项（每一项都可复现、可质疑）：

1. **许可证**：GitHub API 的 license 字段（none = 红旗）。
2. **npm 发布与防冒名**：包在 npm registry 存在；包的 repository 指针归一化后必须指向条目仓库（防同名/抢注包）。
3. **维护活跃度**：pushed_at 在近 6 个月内；仓库未 archived。
4. **文档**：仓库 README 存在且含安装命令。
5. **红旗关键词扫描**：对仓库元数据与 README 扫描遥测端点、矿池、混淆代码等明显红旗。

**机器体检查不了的东西**（这些需要创始人转正时的深度人工复核）：运行时行为、依赖供应链、安装后实际联网去向、代码质量。**体检 ≠ 审计**，本报告不构成任何安全保证。

## 摘要（Summary）

| 条目 | 体检结果 | 红旗 |
| --- | --- | --- |
| dsh-ui-attention | ✅ 干净（深度复核通过） | 0 |
| dshmarket | ⚠️ 待人工复核 | 1（无 LICENSE） |
| dsh-plugin-workshop | ✅ 机器项干净 | 0（npm 未发布，转正需发布） |
| dsh-find-plugin | ✅ 机器项干净 | 0 |
| dsh-web-ui | ✅ 机器项干净 | 0 |
| dsh-skin | ❌ 防冒名校验失败 | 1 |
| dsh-tianshu-tui | ✅ 机器项干净 | 0 |
| deepseek-harness-tui | ✅ 机器项干净 | 0 |
| deepseek-harness-desktop | ⚠️ 待创始人裁定 | 1（非插件形态） |
| dsh-agent-teams | ✅ 机器项干净 | 0 |
| dsh-usage-stats | ❌ 防冒名校验失败 | 1 |

## 逐件结论（Per-plugin findings）

### dsh-ui-attention

- 许可证 MIT ✅ · npm 发布 ✅ 且指针正确 ✅ · 活跃 ✅ · 文档 ✅ · 关键词扫描 ✅。
- 深度复核（创始人自研，天天在用）：纯本地实现——WebAudio 合成提示音、浏览器通知、标题闪烁，**零网络请求**；通知权限仅在用户手势中申请；无遥测。
- 结论：**深度复核通过（reviewed）**。

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
