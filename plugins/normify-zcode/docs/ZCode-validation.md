# ZCode 验收记录

日期：2026-10-04。宿主：本机 Z.ai ZCode 3.11.2，内置 CLI 0.16.5；测试运行时：Node.js 24.19.0。

- 使用本机 `zcode.cjs plugins list --json --cwd <临时工作区>` 实际加载插件；临时 `.zcode/config.json` 指向本插件目录，不修改用户全局配置。
- 加载器识别到已启用的 Normify、1 个 Skill 和 1 个 MCP 服务，无该插件自身的 error 诊断。
- 根目录市场来源路径和版本与插件清单一致。
- 两版服务字节一致；ZCode 包的服务通过 MCP 客户端对全部 31 个工具的调用测试，包含无效输入、变更关闭门禁、并发写入和 dry-run 检查。
- 本机加载器源码确认支持 `${ZCODE_PLUGIN_ROOT}` 和 `${ZCODE_PROJECT_DIR}` 替换。

尚未验证 ZCode 桌面界面从 GitHub 安装后的完整模型调用；协议测试和本地加载通过不等于该界面流程已验收。DSH 专用可选工具和 post-execute 提醒未移植，详见 Codex 兼容说明。

复现加载器检查：在 `plugins/normify-codex` 中设置 `ZCODE_CLI` 为本机 ZCode 的 `resources/glm/zcode.cjs` 绝对路径，运行 `node tests/zcode-package.mjs`。此检查不需要模型账号或 API 密钥。

## 2026-10-05 追加：Windows 实机手动安装

宿主：Z.ai ZCode（Windows 10），Node.js 可从 PATH 调用；本机未安装 `zcode` CLI。安装方式为直接写入用户级插件注册表，未走桌面安装界面。

- 插件缓存 `~/.zcode/cli/plugins/cache/gyc-zcode-plugins/normify/0.5.4-zcode.2/`，市场缓存 `~/.zcode/cli/plugins/marketplaces/gyc-zcode-plugins/`；`known_marketplaces.json` 与 `installed_plugins.json` 参照官方插件 `github@zcode-plugins-official` 的既有条目结构手写。
- **发现静默失败点**：`installed_plugins.json` 注册成功、但未在 `config.json` 的 `plugins.enabledPlugins` 置 true 时，插件不加载且无任何 error 诊断。加入 `"normify@gyc-zcode-plugins": true` 后才生效。此为「已安装但工具不可见」的原因。
- 对缓存路径下的 `dist/normify.mjs` 直接做 stdio 验证：`initialize` 正常，`tools/list` 返回 31 个工具，实际调用 `normify_help`（`topic: "tools"`）返回全部 31 个工具名。
- 两版 `dist/normify.mjs` SHA-256 一致：`f6571349027e0726529a12eb69879e17f500dcd7e8dfb7011ef2da6dd05b37fd`，与上方「字节一致」要求相符。该 bundle 无需 `node_modules`，裸 `node` 即可运行。
- 服务的 `serverInfo.version` 报告 Codex 清单版本号，与本插件清单不同，属共用构建产物的预期结果。

仍未验证：ZCode 桌面界面从 GitHub 市场安装的完整流程，以及模型驱动的完整会话调用。本次验证的是包本体与手动安装路径；桌面界面流程的验收缺口保持原状。
