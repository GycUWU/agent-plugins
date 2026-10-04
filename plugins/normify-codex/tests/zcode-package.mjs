import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// added by gyc 2026-10-04：验证：临时工作区加载本地插件，不安装、不调用模型、不改用户配置。
assert.ok(process.env.ZCODE_CLI, '请设置 ZCODE_CLI 为本机 zcode.cjs 的路径');
const workspacePath = fileURLToPath(new URL('../../../', import.meta.url));
const pluginPath = resolve(workspacePath, 'plugins/normify-zcode');
const marketplace = JSON.parse(readFileSync(resolve(workspacePath, 'marketplace.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(resolve(pluginPath, '.zcode-plugin/plugin.json'), 'utf8'));
const entry = marketplace.plugins.find(item => item.name === manifest.name);
assert.ok(entry, '市场清单缺少插件');
assert.equal(resolve(workspacePath, entry.source), pluginPath);
assert.equal(entry.version, manifest.version);
assert.deepEqual(readFileSync(resolve(pluginPath, 'dist/normify.mjs')), readFileSync(resolve(workspacePath, 'plugins/normify-codex/dist/normify.mjs')));
const temporary = mkdtempSync(join(tmpdir(), 'normify-zcode-package-'));
try {
  mkdirSync(join(temporary, '.zcode'));
  const settings = join(temporary, '.zcode/config.json');
  writeFileSync(settings, JSON.stringify({ plugins: { enabled: true, dirs: [pluginPath] } }), 'utf8');
  const output = execFileSync(process.execPath, [process.env.ZCODE_CLI, 'plugins', 'list', '--json', '--cwd', temporary], { encoding: 'utf8', timeout: 30000 });
  const report = JSON.parse(output);
  const plugin = report.plugins.find(item => item.name === 'normify');
  assert.ok(plugin, 'ZCode 未加载 Normify 插件');
  assert.equal(plugin.enabled, true);
  assert.equal(plugin.skillCount, 1);
  assert.equal(plugin.mcpServerNames.length, 1);
  const errors = report.diagnostics.filter(item => item.pluginId === plugin.id && item.severity === 'error');
  assert.deepEqual(errors, []);
  console.log('ZCode PASS：实际加载器识别 1 个 Skill、1 个 MCP 服务，插件已启用且无自身错误；两版服务字节一致。');
} finally {
  // 清理仅限本测试创建的临时目录。
  rmSync(temporary, { recursive: true, force: true });
}
