# ZCode 验收记录

日期：2026-10-04。宿主：本机 Z.ai ZCode 3.11.2，内置 CLI 0.16.5；测试运行时：Node.js 24.19.0。

- 使用本机 `zcode.cjs plugins list --json --cwd <临时工作区>` 实际加载插件；临时 `.zcode/config.json` 指向本插件目录，不修改用户全局配置。
- 加载器识别到已启用的 Normify、1 个 Skill 和 1 个 MCP 服务，无该插件自身的 error 诊断。
- 根目录市场来源路径和版本与插件清单一致。
- 两版服务字节一致；ZCode 包的服务通过 MCP 客户端对全部 31 个工具的调用测试，包含无效输入、变更关闭门禁、并发写入和 dry-run 检查。
- 本机加载器源码确认支持 `${ZCODE_PLUGIN_ROOT}` 和 `${ZCODE_PROJECT_DIR}` 替换。

尚未验证 ZCode 桌面界面从 GitHub 安装后的完整模型调用；协议测试和本地加载通过不等于该界面流程已验收。DSH 专用可选工具和 post-execute 提醒未移植，详见 Codex 兼容说明。

复现加载器检查：在 `plugins/normify-codex` 中设置 `ZCODE_CLI` 为本机 ZCode 的 `resources/glm/zcode.cjs` 绝对路径，运行 `node tests/zcode-package.mjs`。此检查不需要模型账号或 API 密钥。
