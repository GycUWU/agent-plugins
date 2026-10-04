import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// added by gyc 2026-10-04：验证：通过真实 STDIO 子进程调用，覆盖协议、打包和上游执行链路。
const work = mkdtempSync(join(tmpdir(), 'normify-mcp-'));
const repo = join(work, 'repo');
const dir = join(work, 'normify-demo');
mkdirSync(join(repo, 'src'), { recursive: true });
const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const entry = process.env.NORMIFY_MCP_ENTRY || fileURLToPath(new URL('../dist/normify.mjs', import.meta.url));
const configured = process.env.NORMIFY_MCP_CONFIG ? JSON.parse(readFileSync(process.env.NORMIFY_MCP_CONFIG, 'utf8')) : null;
const transport = new StdioClientTransport({
  command: configured?.command || process.execPath,
  args: configured?.args || [entry],
  cwd: configured?.cwd || work,
  stderr: 'pipe',
});
const client = new Client({ name: 'normify-e2e', version: '1.0.0' });
const called = new Set();
const L = text => ({ zh: text, en: text });
async function call(name, args = {}, successful = true) {
  called.add(name);
  const response = await client.callTool({ name, arguments: args });
  if (!successful) {
    assert.equal(response.isError, true, name + ' 应报告错误');
    return response;
  }
  assert.notEqual(response.isError, true, name + ': ' + JSON.stringify(response.content));
  return JSON.parse(response.content[0].text);
}
function module(id, parent, source, apis) {
  return { frontmatter: {
    uid: createHash('sha256').update(id).digest('hex').slice(0, 8), id, parent,
    name: L(id), description: L(id), source: source.map(path => ({ path })),
    revision: git('rev-parse', 'HEAD'), updated_at: new Date().toISOString(),
    fingerprint: 'pending', state: 'planned', ...(apis ? { apis } : {}),
  } };
}
try {
  writeFileSync(join(repo, 'src/a.js'), 'export const a = 1;\n', 'utf8');
  git('init', '-q'); git('config', 'user.name', 'Normify MCP Test'); git('config', 'user.email', 'normify-test@example.invalid');
  git('add', '.'); git('commit', '-qm', 'initial');
  await client.connect(transport);
  assert.match(client.getInstructions(), /change_open/);
  const { tools } = await client.listTools();
  assert.equal(tools.length, 31);
  assert.equal(new Set(tools.map(t => t.name)).size, 31);
  assert.equal(tools.find(t => t.name === 'normify_module_delete').annotations.destructiveHint, true);
  assert.equal(tools.find(t => t.name === 'normify_sync').annotations.readOnlyHint, true);
  assert.equal(tools.find(t => t.name === 'normify_change_close').annotations.readOnlyHint, false);

  await call('normify_module_upsert', { dir }, false);
  await call('normify_project_init', { dir, unexpected: true }, false);
  await call('normify_module_get', { dir, id: 12 }, false);
  await call('normify_help', { topic: 'unknown' }, false);
  const init = await call('normify_project_init', { dir });
  assert.equal(init.ok, true);
  assert.equal(readFileSync(join(dir, 'policy.yml'), 'utf8').includes('acyclic'), true);
  await call('normify_tree_list');
  await call('normify_help', { topic: 'all' });
  const policy = await call('normify_policy_get', { dir });
  await call('normify_policy_upsert', { dir, rules: policy.policy.rules, dry_run: true });
  const root = module('demo', null, [], undefined);
  const a = module('demo.a', 'demo', ['src/a.js'], [{ protocol: 'rpc', path: 'a/run', description: L('run a') }]);
  await call('normify_module_upsert', { dir, ...root });
  await call('normify_module_promote', { dir, id: 'demo' });
  await call('normify_change_open', { dir, id: '2026-10-04-mcp', title: L('MCP flow'), intent: L('verify flow'), modules: {}, acceptance: ['validate 0 error'] });
  await call('normify_check', { dir, modules: [{ id: 'demo.a', parent: 'demo', state: 'planned' }] });
  await call('normify_module_batch', { dir, items: [a] });
  await call('normify_change_update', { dir, id: '2026-10-04-mcp', patch: { modules: { create: ['demo.a'] } } });
  await call('normify_brief', { dir, task: 'demo.a' });
  await call('normify_layout_upsert', { dir, id: 'demo', order: ['demo.a'], reading: L('root to leaf') });
  await call('normify_layout_get', { dir, id: 'demo' });
  await call('normify_module_get', { dir, id: 'demo.a' });
  await call('normify_module_list', { dir });
  await call('normify_search', { dir, query: 'demo.a' });
  await call('normify_deps_find', { dir, to: 'demo.a' });
  await call('normify_fingerprint', { repoRoot: repo, source: [{ path: 'src/a.js' }] });
  await call('normify_change_close', { dir, id: '2026-10-04-mcp', repoRoot: repo, activate: false }, false);
  const blocked = await call('normify_change_list', { dir });
  assert.equal(blocked.changes[0].status, 'in_progress');
  await call('normify_module_refresh', { dir, ids: ['demo', 'demo.a'], repoRoot: repo, activate: true });
  const validation = await call('normify_validate', { dir, repoRoot: repo });
  assert.equal(validation.errors.length, 0);
  await call('normify_build', { dir, repoRoot: repo });
  await call('normify_outline', { dir });
  await call('normify_render', { dir });
  await call('normify_change_update', { dir, id: '2026-10-04-mcp', patch: { note: 'MCP verified' } });
  await call('normify_change_close', { dir, id: '2026-10-04-mcp', repoRoot: repo, render: true });
  const closed = await call('normify_change_list', { dir });
  assert.equal(closed.changes[0].status, 'verified');
  const change = JSON.parse(readFileSync(join(dir, 'changes/2026-10-04-mcp.json'), 'utf8'));
  assert.equal(change.revision.after, git('rev-parse', 'HEAD'));
  const receipt = JSON.parse(readFileSync(join(dir, 'receipt.json'), 'utf8'));
  for (const name of ['tree.json', 'outline.md', 'api-index.json']) {
    const bytes = readFileSync(join(dir, name));
    assert.equal(receipt.artifacts[name].sha256, createHash('sha256').update(bytes).digest('hex'));
    assert.equal(receipt.artifacts[name].bytes, bytes.length);
  }
  assert.match(readFileSync(join(dir, 'normify.html'), 'utf8'), /<!doctype html>/i);

  // added by gyc 2026-10-04：验证：漂移检出、预览零写入、错误调用后继续执行及并发写入顺序。
  writeFileSync(join(repo, 'src/a.js'), 'export const a = 2;\n', 'utf8');
  const sync = await call('normify_sync', { dir, repoRoot: repo });
  assert.match(JSON.stringify(sync.drift_fingerprints), /demo\.a/);
  const before = readFileSync(join(dir, 'modules/demo/a.md'), 'utf8');
  await call('normify_module_patch', { dir, id: 'demo.a', patch: { tags: ['preview'] }, dry_run: true });
  assert.equal(readFileSync(join(dir, 'modules/demo/a.md'), 'utf8'), before);
  await call('normify_module_patch', { dir, id: 'demo.a', patch: {} }, false);
  await Promise.all([
    call('normify_module_patch', { dir, id: 'demo.a', patch: { tags: ['one'] } }),
    call('normify_module_patch', { dir, id: 'demo.a', patch: { description: L('updated') } }),
  ]);
  const patched = await call('normify_module_get', { dir, id: 'demo.a' });
  assert.deepEqual(patched.module.tags, ['one']);
  assert.equal(patched.module.description.en.trim(), 'updated');
  await call('normify_module_move', { dir, id: 'demo.a', new_id: 'demo.renamed', dry_run: true });
  await call('normify_layout_delete', { dir, id: 'demo' });
  const scratch = join(work, 'normify-scratch');
  await call('normify_module_upsert', { dir: scratch, ...module('scratch', null, [], []) });
  await call('normify_module_delete', { dir: scratch, id: 'scratch' });
  assert.deepEqual([...called].sort(), tools.map(t => t.name).sort());
  if (process.env.NORMIFY_TEST_HTML) copyFileSync(join(dir, 'normify.html'), resolve(process.env.NORMIFY_TEST_HTML));
  console.log('MCP PASS：31 工具均通过真实协议调用；错误门禁、渲染、指纹漂移和 verified/revision 闭环通过。');
} finally {
  await client.close();
  // 清理范围是本测试创建的临时目录，不接收用户输入路径。
  rmSync(work, { recursive: true, force: true });
}
