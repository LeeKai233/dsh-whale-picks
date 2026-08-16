# 参与鲸选 · Contributing

中文流程见下。The full pipeline: submit → CI validates → founder reviews → decision published.

## 提交候选插件（Submit a candidate）

1. 打开 [Submit issue 表单](https://github.com/LeeKai233/dsh-whale-picks/issues/new?template=submit.yml)，填写仓库、npm 包名、用途，以及**为什么值得进店**。
2. 创始人审阅后会：放入候选池（机器体检 + 展示）或拒收（理由公开记入 docs/decisions.md）。
3. 候选池条目等创始人亲测后转正（评分 + 手记）。你也可以直接开 PR 提交条目（见下）。

## 直接 PR（Preferred for listed entries）

1. 在 data/plugins.json 添加条目，tier 为 candidate（除非你附上了亲测记录与六轴自评，可申请直接 listed，由创始人复核）。
2. 运行 npm run validate 与 npm run render；README 由 registry 渲染，禁止手改。
3. 提交 PR。CI 会校验 schema、仓库/npm 存在性、链接可达性与 README 同步。
4. 创始人审核并公布决定（docs/decisions.md）。

## 举报与下架请求（Report a problem）

发现安全问题、红旗、停更或质量问题：用 [Report issue 表单](https://github.com/LeeKai233/dsh-whale-picks/issues/new?template=report.yml)。
决定公开，理由公开——这是鲸选与「列表」的区别。对拒收、下架或红旗决定有异议的作者可走申诉通道（见 docs/charter.md 的「退出与救济」一节）。

## 收录标准（What gets in）

见 docs/charter.md（硬门槛 + 品味门槛）与 docs/rubric.md（评分）。一句话：**先过机器体检，再等创始人亲测**。宁缺毋滥，每分类上限 5 件。
