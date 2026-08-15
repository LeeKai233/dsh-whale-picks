# 已有插件合规化教程 · Adopting an existing plugin

把一件已存在的 DSH 插件改造成鲸选合规，最快三步。完整示例：dsh-ui-attention 的改造（该仓库现在根目录就带着 whalepicks.json 与本文件对应的 AGENTS.md）。

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

exit 0 即合规。它同时给出六轴机器分（安全/边界/成本/活跃度），兼容性与真人分由商店侧补充。常见差距：

- package.json version ≠ manifest version（发布新版忘了同步——CI 会持续盯着）；
- insert id 漏列或与别家冲突；
- 仓库已 archived / 半年无推送（硬门槛）；
- 许可证不是 OSI 认可项。

## 之后

把仓库链接投给鲸选（issue 表单 / PR），进候选池 → 机器打分 → 创始人亲测 → 转正。合规只是门票，评分与手记才决定你在货架上的位置。
