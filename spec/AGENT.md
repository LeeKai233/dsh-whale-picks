# AGENT.md — 给 agent 的鲸选插件执行指引

本文档写给在插件仓库里工作的 agent（以及想省事的人类）。任务开始前，把下面这段 prompt 交给 agent：

```
按照 https://github.com/LeeKai233/dsh-whale-picks/blob/main/spec/SPEC.md 的鲸选插件规范构建/改造这个插件。
步骤：1) 读 SPEC.md 与 templates/plugin/ 模板；2) 新建/完善 whalepicks.json（schema 见 spec/whalepicks.schema.json）；
3) 确保 package.json 的 name/version 与 manifest 同步；4) 确保 cordis.patch.yml 的 insert id 全部列入 patches.insertIds；
5) 双语文案（README.md + README.zh.md、locale zh/en）；6) vitest 测试覆盖核心逻辑；
7) 用 whale-picks 仓库的 scripts/check-plugin.mjs 跑门槛校验并修复全部差距；
8) 再跑 check-plugin.mjs --strict（listed/featured 转正必过：七分区结构 + 构建冒烟 + 测试断言）并修复全部差距；
9) 汇报改动清单与验证结果。
```

## 构建新插件的检查清单

- [ ] 用 templates/plugin/ 脚手架起步（或对齐其结构：tsdown 双产物、dsh.client 声明、cordis.patch.yml；host-only 插件无浏览器半区：无 dsh.client 块、单产物 lib/index.js，结构断言自动记豁免）
- [ ] whalepicks.json 齐全且过 schema；id 全店唯一（先查 whale-picks registry 无重复）
- [ ] scope.does 一句话、scope.doesNot 至少一条——Unix 单功能合同
- [ ] package.json name/version 与 manifest 同步；repository 指向本仓库
- [ ] cordis.patch.yml 的每个 insert id 列入 patches.insertIds；命名空间与插槽列入 patches.namespaces / patches.slots
- [ ] capabilities.network / telemetry 诚实声明（本地插件就写 false，别留空）
- [ ] LICENSE + README.md + README.zh.md 齐全；locale 双语
- [ ] 测试绿：npm test 通过
- [ ] scripts/check-plugin.mjs 通过（exit 0）
- [ ] 构建产物自检：npm run bundle 后关键导出符号 grep 存在于 lib/client.js 且定义先于使用（再导出不产生本地绑定，自由变量引用会被 tree-shake 静默删除）
- [ ] 转正（listed/featured）前必过 scripts/check-plugin.mjs --strict（七分区结构 + 构建冒烟 + 测试断言）

## 改造已有插件的流程（--init）

1. 在插件仓库跑：node <whale-picks>/scripts/check-plugin.mjs --init . ——从现有 package.json 生成 whalepicks.json 骨架；
2. 手工补齐 description/scope/capabilities/links/maintainers；
3. 再跑 check-plugin 看差距清单，逐项修复；要转正（listed/featured）再跑 --strict 并修复全部差距；
4. 不改行为、只补 manifest 的改造不允许顺手改功能代码（PR 审阅原则）。

## 常见翻车点（do / don't）

- ✅ bundle 层 insert 只写一次，id 全店唯一；❌ 同一个 id 再写进用户 profile 补丁（duplicate loader entry id 直接拒绝启动）
- ✅ 浏览器 bundle 只 import 平台模块（react / cordis / dsh-client-ui-*）；❌ 把 schemastery 或任意 npm 库拖进 client bundle（客户端 purity 规则）
- ✅ 设置/文案走 locale zh+en；❌ 硬编码中文或英文
- ✅ 组件 props 里框架注入的翻译函数叫作 **t**（PropsLocale<N> 注入 t，解构 props.t）；❌ 用 props.locale（undefined，渲染即崩、设置区块空白——2026-08-15 鲸选商店实踩）
- ✅ 单一职责：功能多了拆插件；❌ 一个插件「顺便」做三件事
- ✅ manifest 声明与事实一致；❌ network 写 false 却在代码里 fetch 外部服务（check-plugin 信号对账出 warning；人工复核确认后记 registry 红旗并压安全轴 ≤2）
- ✅ 分数/结论要证据；❌ 编造 verifiedAgainst 或体检日期

## 与鲸选生态的关系

- 合规的插件会被写入 whale-picks 仓库 data/plugins.json（candidate 起步）；机器轴分数由 compute-scores.mjs 从 manifest 与仓库事实自动计算。
- manifest 即简历：scope 写得好，边界与冲突轴就高；network/telemetry 诚实，安全轴才有基础分。
- 转正（listed/featured）需要创始人亲测 + 手记 + 真人评分，且必须过 check-plugin --strict；亲测与评分这部分 agent 无法替代。
