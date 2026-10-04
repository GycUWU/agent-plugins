# Normify 的 Codex 本地插件

基于 yan-mc/dsh-normify；原作者与 MIT 许可证保留。适配层复用上游 `registerTools`，不复制 31 个工具的业务实现。

## 构建与验证

```powershell
npm ci --ignore-scripts --legacy-peer-deps
npm run build:codex
npm test
npm run test:mcp
```

安装包包含 `.codex-plugin/plugin.json`、`.mcp.json`、`dist/normify.mjs`、`skills/`、`docs/` 和 `LICENSE`。运行只需 Node.js 18 或以上，无需安装 DSH 或启动网络服务。打包脚本使用 `createRequire` 保留内联 CommonJS 依赖的 Node 兼容性。

## 本地安装

Windows 下在仓库运行 `pwsh -File scripts/install-codex.ps1`。脚本复制运行文件到 `~/.codex/plugins/local/normify`，保留个人 marketplace 其他条目，再调用 Codex CLI 安装。也可手动复制上述文件，在 `~/.agents/plugins/marketplace.json` 添加 `normify` 条目，再运行 `codex plugin add normify@personal`。重启或新建会话后检查插件工具是否可见。

CLI、桌面端和 IDE 共用 Codex 插件配置。当前运行中的会话不会因写入配置自动获得新的工具，安装状态与会话工具可用状态要分别验证。

## 工作目录与兼容性

所有工具名及参数保持上游兼容。Codex 可能为工具添加 MCP 或插件前缀；以当前工具目录显示的名字调用。

优先给工具传结构数据目录的绝对 `dir` 和源码目录的绝对 `repoRoot`；仅传 `project` 时从 `NORMIFY_ROOT`（未设置则进程工作目录）寻找 `normify-<slug>`，不要默认插件缓存就是项目目录。

`.mcp.json` 使用相对参数和 `cwd: "."`，由 Codex 把工作目录解析为安装后的插件目录。当前版本的 `codex mcp get` 未展开参数中的 `${CLAUDE_PLUGIN_ROOT}`，因此不依赖该占位符启动服务。

接入层校验 JSON Schema，把上游 `ok: false` 映射为 MCP `isError`，并将调用顺序执行以避免文件读写竞争。顺序调度只保护同一个服务进程；不同会话仍需使用上游 `expect_updated_at` 防止覆盖，不承诺跨进程事务隔离。

上游根模块允许 `parent: null`，但其注册 schema 仅声明字符串；适配层把 `frontmatter.parent` 的协议类型修正为 `string | null`，引擎语义不变。新增模块尚不存在时先以空模块清单开启变更，计划态建树后通过 `change_update` 补全清单。

上游三层校验、双语要求、架构规则、源码指纹、原子批量操作、变更日志和 HTML 渲染保持原样。生成结构时只读源码；只有用户已授权的开发任务才修改源码。Skill 不扩大授权。

DSH 的可选 `tools/post-execute` 写文件次数提醒未移植；Codex 的 Skill 与 MCP 初始化指令承担流程提示，不声称监听其他工具的写入次数。本插件不新增自动执行或批准策略，也不修改全局 AGENTS.md。
