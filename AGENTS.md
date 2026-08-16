# AGENTS.md — 鲸选仓库 agent 协作规则

在本仓库工作的 agent 必须遵守以下规则。人类贡献者同样适用。

## 数据唯一来源

- data/plugins.json 是唯一数据源（data/suits.json 同理）。README.md / README.zh.md 由 scripts/render-readme.mjs 生成，**禁止手改**。
- 改数据 → npm run render → 提交时带上渲染结果。CI 会校验 README 与 registry 同步，不同步即失败。
- 新增/修改条目必须过 npm run validate；修改 schema 必须同步更新校验逻辑与文档。

## 评分与决定

- 十键雷达分（radar 字段：九范式机器轴 + 真人轴）由 scripts/compute-scores.mjs 计算；人工轴（真人评分）必须带 evidence 与 updatedAt，禁止无证据打分。
- 任何收录/转正/拒收/下架决定必须记入 docs/decisions.md（日期 + 理由），并保持 docs/security-report.md 与 registry 的 security 字段一致。
- 规范门槛（manifestCompliant）由 check-plugin 判定；listed/featured 条目必须为 true。

## 质量线

- 脚本（scripts/）保持零运行时依赖，仅用 Node 内置 + ajv（devDependency 已有）。js-yaml 未安装也未使用：cordis patch 结构固定，check-plugin 手写 YAML 子集解析（extractInsertIds 状态机）。
- listed/featured 转正必须过 `check-plugin --strict`（七分区结构断言 + 构建冒烟 + 测试断言全绿）。
- 文档双语：README 与核心 docs（charter/rubric/spec）zh+en 双版；decisions/security-report 可中文为主。
- 不造假：套件为空就显示空；分数缺失显示「待测」；体检结论只写机器可查项。

## 约定

- 提交信息用 conventional commits（feat/fix/docs/chore）。
- 涉及 registry 结构的改动必须 bump schemaVersion 并在 docs/decisions.md 记录。
