# 已有插件合规化教程 · Adopting an existing plugin

English below. 把一件已存在的 DSH 插件改造成鲸选合规，最快三步。完整示例：dsh-ui-attention 的改造（该仓库现在根目录就带着 whalepicks.json 与本文件对应的 AGENTS.md）。

## 第 0 步：理解门槛

上架门槛 = whalepicks.json 过 schema + 与仓库事实一致 + 硬文件齐全（LICENSE/README/cordis.patch.yml）。
门槛是一票否决：不合规连评分资格都没有。但门槛不要求你重写插件——**只补声明，不改行为**。

## 第 1 步：生成骨架

在插件仓库目录跑：

```sh
node <path-to>/dsh-whale-picks/scripts/check-plugin.mjs . --init
```

--init 会从 package.json 推断 name/version/repository/license，从 cordis.patch.yml 提取 insert id，生成一份 schema 合法的 whalepicks.json 骨架，并打印 TODO 清单。

## 第 2 步：补齐声明

逐项填真实内容：

- description.zh / description.en：一句话双语描述；
- **scope.does / scope.doesNot：Unix 单功能合同，全店最有分量的两行**。does 说清它做的唯一一件事（≤3 条，理想 1 条）；doesNot 明确拒绝做什么（≥1 条）；
- category：真实分类；capabilities.network / telemetry：按事实填（本地插件就 false）；
- maintainers / links：真实信息。
- v1.1 可选字段（供 dsh-appearance 外观管理器的体检使用，不填不影响门槛）：
  - `deps`：依赖的其他鲸选插件 id（依赖缺失 → 冲突提示）；
  - `perf.polls` / `perf.memoryEstimateMB` / `perf.gpu` / `perf.timers`：轮询周期、内存估算、是否用显存、常驻定时器数（性能检查输入）；
  - `security.verdict` / `security.scanBy`：体检裁决（`passed`/`review`/`unknown`）与来源——**由商店侧体检管道填写，作者自填无效**（registry 的 security 字段为准）；浏览器端管理器只呈现裁决，不重复扫描代码。模板与 --init 均不预填此字段。

示例（dsh-ui-attention 的实际声明）：

```json
"scope": {
  "does": ["当 DSH 页面不在前台时，对两类事件发出本地提醒（浏览器通知 + 提示音 + 标题闪烁）：待处理交互（提问/审批）与回合完成"],
  "doesNot": [
    "不发送任何网络请求，不上传任何数据（提醒完全在浏览器本地合成）",
    "不改变会话行为、模型调用或任何 DSH 内部逻辑",
    "不提供跨设备推送或移动端通知（那是另一个产品的事）"
  ]
}
```

## 第 3 步：过门槛

```sh
node <path-to>/dsh-whale-picks/scripts/check-plugin.mjs .
```

exit 0 即合规。它同时给出机器轴分（安全/边界/成本/活跃度/兼容性——无实测时兼容性为 null），真人分由商店侧补充。每次运行还附带 signals 小节：静态信号扫描 src 的网络/危险特征并与 capabilities 声明对账，不一致出 warning（不影响 exit code，供人工复核参考）。常见差距：

- package.json version ≠ manifest version（发布新版忘了同步——CI 会持续盯着）；
- insert id 漏列或与别家冲突；
- 仓库已 archived / 半年无推送（硬门槛）；
- 许可证不是 OSI 认可项。

候选（candidate）过门槛即可；要转 listed/featured 还须过 `--strict`（七分区结构断言 + 构建冒烟 + 测试断言）：

```sh
node <path-to>/dsh-whale-picks/scripts/check-plugin.mjs . --strict
```

## 阶段二：迁移为范式结构（可选但推荐）

上面三步只补声明、不改行为。若插件要长期演进、接受机器审查、或想成为鲸选范式范例，
还可以做完整结构迁移：把代码装进 templates/plugin 骨架、文案进 locale、测试进验证层。
完整指南见 [docs/migrate-to-paradigm.md](./migrate-to-paradigm.md)，
范式定义见 [spec/PARADIGM.md](../spec/PARADIGM.md)。三个范例：dsh-ui-attention
（试验品）、dsh-appearance、dsh-statusbar。

## 之后

把仓库链接投给鲸选（issue 表单 / PR），进候选池 → 机器打分 → 创始人亲测 → 转正。合规只是门票，评分与手记才决定你在货架上的位置。

---

# Adopting an existing plugin

Making an existing DSH plugin whale-picks compliant takes three steps. Full worked example: the dsh-ui-attention migration (that repo now ships whalepicks.json at its root plus the matching AGENTS.md).

## Step 0: understand the gate

The listing gate = whalepicks.json passes the schema + matches repo facts + hard files present (LICENSE/README/cordis.patch.yml).
The gate is a one-vote veto: without compliance there is no scoring at all. But the gate does not ask you to rewrite the plugin — **declarations only, no behavior changes**.

## Step 1: generate the skeleton

Run inside the plugin repo:

```sh
node <path-to>/dsh-whale-picks/scripts/check-plugin.mjs . --init
```

--init infers name/version/repository/license from package.json, extracts insert ids from cordis.patch.yml, writes a schema-valid whalepicks.json skeleton, and prints a TODO list.

## Step 2: fill in the declarations

Fill every field with real content:

- description.zh / description.en: one-line bilingual description;
- **scope.does / scope.doesNot: the Unix single-purpose contract — the two most valuable lines in the store**. does names the ONE thing it does (≤3 entries, ideally 1); doesNot states what it refuses to do (≥1 entry);
- category: the real category; capabilities.network / telemetry: fill truthfully (local plugins: false);
- maintainers / links: real information.
- v1.1 optional fields (consumed by the dsh-appearance manager's checks; skipping them does not affect the gate):
  - `deps`: ids of other whale-picks plugins this one depends on (missing dependency → conflict hint);
  - `perf.polls` / `perf.memoryEstimateMB` / `perf.gpu` / `perf.timers`: poll intervals, memory estimate, GPU usage, resident timer count (performance-check inputs);
  - `security.verdict` / `security.scanBy`: the pass verdict (`passed`/`review`/`unknown`) and its source — **filled by the store-side pass pipeline; author-filled values are void** (the registry security field prevails); the browser-side manager only presents the verdict and never rescans code. Neither the template nor --init pre-fills this field.

Example (dsh-ui-attention's actual declaration):

```json
"scope": {
  "does": ["当 DSH 页面不在前台时，对两类事件发出本地提醒（浏览器通知 + 提示音 + 标题闪烁）：待处理交互（提问/审批）与回合完成"],
  "doesNot": [
    "不发送任何网络请求，不上传任何数据（提醒完全在浏览器本地合成）",
    "不改变会话行为、模型调用或任何 DSH 内部逻辑",
    "不提供跨设备推送或移动端通知（那是另一个产品的事）"
  ]
}
```

## Step 3: pass the gate

```sh
node <path-to>/dsh-whale-picks/scripts/check-plugin.mjs .
```

exit 0 means compliant. It also prints the machine-axis scores (security/scope/cost/activity/compatibility — compatibility is null without a verification); the human axis is filled store-side. Every run also prints a signals section: a static scan of src for network/danger fingerprints reconciled against the capabilities declaration — mismatches raise warnings (they never affect the exit code; they feed human review). Common gaps:

- package.json version ≠ manifest version (a release forgot to sync — CI keeps watching);
- an insert id is unlisted or clashes with another plugin;
- the repo is archived / silent for 6 months (hard gate);
- the license is not OSI-approved.

A candidate only needs the gate; promotion to listed/featured additionally requires `--strict` (seven-section structure assertions + build smoke + test assertions):

```sh
node <path-to>/dsh-whale-picks/scripts/check-plugin.mjs . --strict
```

## Phase 2: migrate to the paradigm structure (optional but recommended)

The three steps above only add declarations and change no behavior. If the plugin will evolve long-term, accept machine review, or aims to become a paradigm exemplar, do the full structural migration: code into the templates/plugin skeleton, copy into locales, tests into the verification layer.
Full guide: [docs/migrate-to-paradigm.md](./migrate-to-paradigm.md); paradigm definition: [spec/PARADIGM.md](../spec/PARADIGM.md). Three exemplars: dsh-ui-attention (the trial subject), dsh-appearance, dsh-statusbar.

## Afterwards

Submit the repo link to whale-picks (issue form / PR): candidate pool → machine scoring → founder hands-on test → promotion. Compliance is only the ticket; scores and notes decide your shelf position.
