# Agent Plugins

供 AI 编程助手安装的插件集合，按宿主分别维护适配版本。

| 插件 | 宿主 | 状态 | 说明 |
|---|---|---|---|
| [Normify](plugins/normify-codex/docs/Codex.md) | Codex | 已实现并验证 | 31 个架构模块树工具、指纹同步、严格校验、HTML 渲染和开发变更闭环 |
| [Normify](plugins/normify-zcode/docs/ZCode.md) | Z.ai ZCode | 协议、本机加载器与手动安装验证通过 | 同一服务与引擎，使用 ZCode 插件清单和工作区变量 |

## 安装到 Codex

前置条件：Codex CLI、Git、Node.js 18 或以上。发布仓库包含已构建的服务，安装时不需要 npm install，也不需要 DSH。

```sh
codex plugin marketplace add GycUWU/agent-plugins --ref main
codex plugin add normify@gyc-agent-plugins
```

重启 Codex 或新建会话后，检查 Normify 工具可见性。安装在当前机器的 Codex 主机上；另一台机器需重新安装。本机其他 agent/会话能否调用，还取决于宿主是否给它们加载该插件。

让另一个 agent 安装时，可直接发送：

> 请从 https://github.com/GycUWU/agent-plugins 安装 Normify：运行上述两条 Codex CLI 命令，重启或新建会话后核对 31 个工具，并执行 normify_help 的 tools 主题确认连接。不要将安装成功等同于当前会话已经加载工具。

## 使用

ZCode 用户在 设置 → 插件 → 创建 → 添加插件市场 中输入本仓库地址，然后从 `gyc-zcode-plugins` 安装 `normify`。Codex 使用 `.agents/plugins/marketplace.json`；ZCode 使用根目录 `marketplace.json`，两个市场指向各自的插件目录。

优先传结构数据目录的绝对 `dir` 和源码目录的绝对 `repoRoot`。生成结构时只读源码，开发任务沿用用户已有授权；写时校验、全项目校验和关闭变更的零 error 要求保持原样。

参见 [Codex 使用说明](plugins/normify-codex/docs/Codex.md)、[Codex 验收记录](plugins/normify-codex/docs/Codex-validation.md)、[ZCode 使用说明](plugins/normify-zcode/docs/ZCode.md) 和 [ZCode 验收记录](plugins/normify-zcode/docs/ZCode-validation.md)。

ZCode 无桌面界面或需脚本化安装时，参见 [ZCode 手动安装](plugins/normify-zcode/docs/ZCode.md#手动安装无桌面界面或脚本化)。注意：只写注册表而不在 `config.json` 的 `plugins.enabledPlugins` 中启用插件，会注册成功但不加载，且无任何报错。

## 开发

```sh
cd plugins/normify-codex
npm ci --ignore-scripts --legacy-peer-deps
npm run build:codex
npm test
npm run test:mcp
```

适配层位于 `mcp/server.mjs`，构建服务为 `dist/normify.mjs`。提交源码变更时同时更新已验证的运行包；宿主差异放入对应插件目录，避免修改共享规范来绕过校验。

## 来源与许可证

Normify 引擎来自 [yan-mc/dsh-normify](https://github.com/yan-mc/dsh-normify)，保留原作者、MIT 许可证和上游提交历史。Codex 接入代码由 gyc 增加。各插件及其依赖的许可证见对应目录。
