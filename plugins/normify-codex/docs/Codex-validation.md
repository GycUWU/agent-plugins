# Codex 接入验收记录

验证日期：2026-10-04。上游基线：`ed404e5b8db0010ff57ec8486ec8749421072545`。插件版本：`0.5.4-codex.1`。

## 已通过

- 上游 `npm test`：引擎、伴随开发、0.5.2 / 0.5.3 / 0.5.4 回归测试全部通过。
- `npm run typecheck`：通过。
- `npm run build:codex`：Windows 下构建成功，运行依赖内联进单文件。
- `npm run test:mcp`：实际启动 STDIO 服务，31 个工具逐个调用通过。
- 负例：缺必填参数、错误参数类型、额外字段、未知帮助主题、空补丁均报告错误；错误之后后续请求可继续执行。
- 未激活计划态模块时 close 拒绝关闭，变更保留 in_progress；激活并通过源码证据校验后 close 为 verified，revision.after 等于真实 Git HEAD。
- build 生成的 tree.json、outline.md、api-index.json 与 receipt 中的 SHA-256 和字节数逐项一致；render 产出 HTML。
- 修改源码后 sync 的 drift_fingerprints 包含对应模块；dry_run 不落盘；并发提交的两个补丁均保留。
- 安装后 `codex plugin list` 显示 normify@personal 为 installed, enabled。
- 依据 `codex mcp get normify --json` 返回的 command/args/cwd，重新启动缓存中的插件并通过同一套 MCP 测试；安装副本没有 node_modules，运行不依赖开发目录。

## 边界

实际运行环境是 Windows、Node.js 24.19.0；构建目标为 Node.js 18，上游及 MCP SDK 要求以各自 package.json 为准，未另跑 Node.js 18。

每个工具都至少调用一次，不表示已经穷举该工具的所有参数组合。上游已有回归测试负责引擎场景，新测试负责协议转换与完整流程。

当前聊天尚未重新加载工具目录；安装验证不等同于本聊天已获得工具。重启应用或新建会话后检查 normify 工具可见性。

DSH 可选写文件计数提醒未移植；跨进程调用的隔离仍沿用上游文件机制。未增加自动钩子、自动批准规则或公共发布。
