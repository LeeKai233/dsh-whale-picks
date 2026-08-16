# AGENTS.md — {{PLUGIN_ID}} 插件仓库 agent 规则

在本仓库工作的 agent：

1. 先读鲸选规范 https://github.com/LeeKai233/dsh-whale-picks/blob/main/spec/SPEC.md 、
   spec/PARADIGM.md（插件范式）与 spec/AGENT.md。
2. 本仓库按鲸选插件范式组织：固定分区（合同层/宿主半区/浏览器半区/文案层/验证层/
   装载层/仓库规范层）一个不少；插件自己的"唯一一件事"填进扩展点，不另造结构。
3. whalepicks.json 是上架合同：改动功能时同步检查 scope/patches/capabilities/deps/perf
   声明是否仍然属实。
4. package.json 的 name/version 与 whalepicks.json 必须同步；files 必须含 whalepicks.json。
5. cordis.patch.yml 的 insert id（{{INSERT_ID}}）保持唯一，绝不写进用户 profile 补丁层
   （duplicate loader entry id 会拒绝启动）。
6. 槽位遮蔽：要遮蔽同 id 的内置/其他条目，必须用更低的 priority（最低者渲染）；
   同 id 同 priority 会被槽位核心拒绝。
7. 客户端 bundle 只 import 平台模块（react/cordis/dsh-client-ui-*）；schemastery 只许
   出现在宿主半区；文案走 locale zh/en 双语（locales.ts 之外不得出现 UI 文案）。
8. 设置持久化三选一：宿主命名空间注册 / localStorage（或 runtime 快照引擎）/ 不持久化；
   browser-only 插件允许宿主半区空实现（文件仍保留）。
9. 实现模块自述描述符（id/name/whalepicks 嵌入/settingsSchema/getState/setState）时，
   文案走模块自己的 locale 命名空间（{ key } + t），纯字符串仅作旧值兼容。
10. 测试：npm test 必须绿。
11. 门槛校验：跑 whale-picks 仓库的 scripts/check-plugin.mjs（exit 0 才算合规）与
    --structure（模板对齐度报告）；结构漂移可用 scripts/template-sync.mjs 自查。
    转正（listed/featured）需过 --strict（含构建冒烟与测试断言）。
