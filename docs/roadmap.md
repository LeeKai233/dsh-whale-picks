# 路线图 · Roadmap

## 一期（基座，已完成）

- ✅ 插件规范与模板：spec/SPEC.md + whalepicks.schema.json + spec/AGENT.md（agent 可执行）+ templates/plugin 脚手架 + scripts/check-plugin.mjs（门槛一票否决，含 --init 合规化）。
- ✅ 六轴雷达：真人/安全/兼容/边界与冲突/成本/活跃；compute-scores.mjs 程序化打分 + render-radar.mjs 雷达 SVG；规范符合 = 上架门槛（不进雷达图）。
- ✅ 结构化 registry（data/plugins.json v1.1）+ suits 数据模型（data/suits.json，空数组不造假）。
- ✅ 机器安全体检 + 公开体检报告 + 公开决定流水 + 每晚新鲜度巡检。
- ✅ Cloudflare Workers 数据托管（cloudflare/，零依赖，/plugins.json /suits.json /radar.json /health；部署教程 docs/cloudflare.md）。
- ✅ DSH 内置鲸选入口：dsh-whale-picks-store（settings.section，「Agent 预设」正下方；套件/插件货架 + 雷达 + 复制安装命令；本地冒烟安装通过）。
- ✅ 两个 dogfood 插件（dsh-ui-attention 改造 + store 新建）均过规范门槛。
- ✅ 插件范式成文（spec/PARADIGM.md）：固定分区 + 扩展点，对任何 DSH 插件成立、不按类型分化。
- ✅ 迁移工具链：scripts/scaffold.mjs（范式骨架生成）+ check-plugin --init 1.1 / --structure（对齐报告）+ scripts/template-sync.mjs（漂移自查）。
- ✅ 三个范式范例：dsh-ui-attention（试验品，存档标记）、dsh-appearance（服务提供者）、dsh-statusbar（服务消费者 + 槽位遮蔽 + 联网）。

## 二期：商店网站（VitePress + GitHub Pages）

- 可逛的店面：分类、搜索、详情页、一键复制安装命令、评分与体检结论可视化。
- 与 registry 同源渲染（同一个 plugins.json，网站只是另一层皮）。
- 配品牌域名，接入 jsDelivr 分发 plugins.json，供第三方消费。

## 二期末 / 三期：DSH 内置鲸选插件

- 类似 dsh-market 的安装体验，但货架只放本店条目：读本店 registry，一键安装/更新。
- 差异化：展示评分、体检结论与创始人手记——把「敢装、值得装」带进 DSH 界面。

## 三期：社区评分与讨论

- GitHub Discussions 承载每件插件的用户评价与踩坑记录，反哺候选池转正。
- 考虑「鲸选认证」徽章发给入选仓库（作者可挂 badge）。

## 明确不做

- 不做自动爬取/无脑收录（与雷达、大列表错位）。
- 不承诺安全审计（只承诺体检方法公开、结论可复现）。
- 不追求条目数量；每分类上限 5 件，宁缺毋滥。
