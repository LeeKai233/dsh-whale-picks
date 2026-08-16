# {{PLUGIN_NAME}}

[![鲸选模板](https://raw.githubusercontent.com/LeeKai233/dsh-whale-picks/main/assets/template-badge.svg)](https://github.com/LeeKai233/dsh-whale-picks/tree/main/templates/plugin)

中文 | [English](README.md)

{{DESCRIPTION_ZH}}

鲸选合规 DSH 插件——见 [whalepicks.json](./whalepicks.json) 与[鲸选插件规范](https://github.com/LeeKai233/dsh-whale-picks/blob/main/spec/SPEC.md)。

本仓库遵循[鲸选插件范式](https://github.com/LeeKai233/dsh-whale-picks/blob/main/spec/PARADIGM.md)：固定分区保持不变，插件自己的「唯一一件事」填进扩展点。开发者文档：[docs/DEVELOPMENT.zh.md](docs/DEVELOPMENT.zh.md)。

## 安装

```sh
dsh plugin --profile web add {{PLUGIN_NAME}}
# 重启一次 dsh web 使新的 bundle 层生效
dsh web
```

或从本地目录安装：

```sh
dsh plugin --profile web add file:/path/to/{{PLUGIN_NAME}}
```

## 它做什么

- {{ONE_THING}}

## 它不做什么

- {{NON_GOAL}}

## 许可证

MIT © {{YEAR}} {{AUTHOR}}
