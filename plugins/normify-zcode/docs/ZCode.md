# Normify 的 ZCode 插件

适用于智谱 Z.ai 的 ZCode，按 [官方插件规范](https://zcode.z.ai/cn/docs/plugin) 打包。引擎与 MCP 服务和 Codex 版本共用构建产物，单独维护 `.zcode-plugin/plugin.json` 与 `.mcp.json`。

## 安装

在 ZCode 打开工作区，进入 设置 → 插件 → 创建 → 添加插件市场，输入：

```text
https://github.com/GycUWU/agent-plugins
```

在 `gyc-zcode-plugins` 市场中安装并启用 `normify`。系统需有可从 PATH 调用的 Node.js 18 或以上，无需 npm install 或 DSH。

启用后确认设置 → MCP 的 Plugin MCP 分组包含 Normify，执行 `normify_help` 的 tools 主题验证连接。ZCode 会给工具添加插件命名空间，以实际显示的名字为准。

### 手动安装（无桌面界面或脚本化）

本机没有 `zcode` CLI 时，可按官方插件的注册表结构直接写入用户级缓存，重启 ZCode 后生效（2026-10-05 在 Windows 实机验证，见[验收记录](ZCode-validation.md)）：

1. 插件缓存：`~/.zcode/cli/plugins/cache/gyc-zcode-plugins/normify/<version>/`，内容即本插件目录。
2. 市场缓存：`~/.zcode/cli/plugins/marketplaces/gyc-zcode-plugins/`，放置本仓库内容（根目录 `marketplace.json`）。
3. 在 `~/.zcode/cli/plugins/known_marketplaces.json` 增加市场条目（`source` 为 `{"source":"github","repo":"GycUWU/agent-plugins"}`），在 `~/.zcode/cli/plugins/installed_plugins.json` 增加插件条目，`id` 为 `normify@gyc-zcode-plugins`，`installPath` 指向上面的插件缓存目录。字段结构照抄官方插件（如 `github@zcode-plugins-official`）的既有条目即可。

**关键一步**：在 `~/.zcode/cli/config.json` 的 `plugins.enabledPlugins` 中加入 `"normify@gyc-zcode-plugins": true`。只写 `installed_plugins.json` 而不加该标志，插件会注册成功但不加载，且没有任何 error 诊断——这正是「已安装但工具不可见」的静默失败来源。桌面安装界面通常会自动写入该标志；脚本化安装必须自己补上。

修改前备份 `config.json` 与两个注册表 JSON。验证方式：对 `dist/normify.mjs` 直接做 stdio `initialize` + `tools/list`，应返回 31 个工具；再实际调用一次 `normify_help`。

## 工作目录与授权

`${ZCODE_PLUGIN_ROOT}` 由 ZCode 解析为安装目录；`${ZCODE_PROJECT_DIR}` 为当前工作区，所以数据默认写入当前工作区而不是插件缓存。调用时仍优先传绝对 `dir` 和 `repoRoot`。

结构生成只读源码，开发仅修改用户已授权范围。planned → activate、policy 约束、指纹校验和 close 零 error 门禁保持不变。不增加自动批准或自动钩子。

## 构建

从 `../normify-codex` 运行 `npm run build:codex`，会同步生成本插件的服务、Skill、规范和许可证。两个插件的 `dist/normify.mjs` 必须字节一致，避免维护两份引擎。

由于共用构建产物，服务的 `serverInfo.version` 报告的是 Codex 清单的版本号，与本插件清单的版本不同。这是预期行为，不是装错了包；以插件清单版本为准。

协议测试可在 Codex 插件开发目录将 `NORMIFY_MCP_ENTRY` 指向本插件的 `dist/normify.mjs`，再运行 `npm run test:mcp`，覆盖全部 31 个工具。
