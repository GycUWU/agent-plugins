# Normify 的 ZCode 插件

适用于智谱 Z.ai 的 ZCode，按 [官方插件规范](https://zcode.z.ai/cn/docs/plugin) 打包。引擎与 MCP 服务和 Codex 版本共用构建产物，单独维护 `.zcode-plugin/plugin.json` 与 `.mcp.json`。

## 安装

在 ZCode 打开工作区，进入 设置 → 插件 → 创建 → 添加插件市场，输入：

```text
https://github.com/GycUWU/agent-plugins
```

在 `gyc-zcode-plugins` 市场中安装并启用 `normify`。系统需有可从 PATH 调用的 Node.js 18 或以上，无需 npm install 或 DSH。

启用后确认设置 → MCP 的 Plugin MCP 分组包含 Normify，执行 `normify_help` 的 tools 主题验证连接。ZCode 会给工具添加插件命名空间，以实际显示的名字为准。

## 工作目录与授权

`${ZCODE_PLUGIN_ROOT}` 由 ZCode 解析为安装目录；`${ZCODE_PROJECT_DIR}` 为当前工作区，所以数据默认写入当前工作区而不是插件缓存。调用时仍优先传绝对 `dir` 和 `repoRoot`。

结构生成只读源码，开发仅修改用户已授权范围。planned → activate、policy 约束、指纹校验和 close 零 error 门禁保持不变。不增加自动批准或自动钩子。

## 构建

从 `../normify-codex` 运行 `npm run build:codex`，会同步生成本插件的服务、Skill、规范和许可证。两个插件的 `dist/normify.mjs` 必须字节一致，避免维护两份引擎。

协议测试可在 Codex 插件开发目录将 `NORMIFY_MCP_ENTRY` 指向本插件的 `dist/normify.mjs`，再运行 `npm run test:mcp`，覆盖全部 31 个工具。
