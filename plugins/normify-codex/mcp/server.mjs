import { resolve } from 'node:path';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';
import { registerTools } from '../lib/tools.js';

// added by gyc 2026-10-04：接入：复用上游注册入口，避免复制工具实现或加载 DSH 专属启动日志。
const tools = new Map();
registerTools({ tools: { register: tool => {
  // fixed by gyc 2026-10-04：兼容：上游根 parent 接受 null，但注册 schema 写成 string；仅修正协议声明。
  const parameters = structuredClone(tool.parameters);
  if (parameters.properties?.frontmatter?.properties?.parent) {
    parameters.properties.frontmatter.properties.parent.type = ['string', 'null'];
  }
  tools.set(tool.name, { ...tool, parameters });
} } }, {
  rootDir: resolve(process.env.NORMIFY_ROOT || process.cwd()),
  requireBilingual: true,
});
const provider = new AjvJsonSchemaValidator();
const validators = new Map([...tools].map(([name, tool]) => [name, provider.getValidator(tool.parameters)]));
const server = new Server({ name: 'normify', version: '0.5.4-codex.1' }, {
  capabilities: { tools: {} },
  instructions: 'Normify 架构数据库工具。先读取现有结构并核对源码。生成结构时只读源码；用户已授权的开发按 change_open → brief → check → planned → 实现 → refresh → change_close 执行。查询参数用 normify_help(topic="tool:<工具名>")。调用时优先传绝对 dir、repoRoot，project 使用 NORMIFY_ROOT 或进程工作目录。validate/build/close 以 0 error 为门禁；warning 汇报但不阻断。Skill 和工具不扩大用户授权。',
});
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [...tools.values()].map(tool => ({
  name: tool.name,
  description: tool.description,
  inputSchema: tool.parameters,
  annotations: {
    readOnlyHint: tool.readOnly,
    destructiveHint: tool.destructive || tool.name === 'normify_policy_upsert',
    idempotentHint: tool.idempotent,
    openWorldHint: false,
  },
})) }));

const failure = message => ({ content: [{ type: 'text', text: message }], isError: true });
// added by gyc 2026-10-04：调度：单进程顺序执行，读取也排队，避免读到批量写入或移动的中间状态。
let pending = Promise.resolve();
server.setRequestHandler(CallToolRequestSchema, request => {
  const run = pending.then(async () => {
    const tool = tools.get(request.params.name);
    if (!tool) return failure('未知 Normify 工具：' + request.params.name);
    const args = request.params.arguments ?? {};
    const checked = validators.get(tool.name)(args);
    if (!checked.valid) return failure('参数校验失败：' + checked.errorMessage);
    try {
      const value = await tool.execute(args);
      return { content: tool.output.render(args, value), isError: value?.ok === false };
    } catch (error) {
      return failure('Normify 执行失败：' + String(error?.message ?? error));
    }
  });
  pending = run.catch(() => {});
  return run;
});
await server.connect(new StdioServerTransport());
