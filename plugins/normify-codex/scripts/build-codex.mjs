import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { copyFileSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { build } from 'esbuild';

// added by gyc 2026-10-04：打包：编译上游引擎并内联运行依赖，安装后的插件只需 Node.js。
const root = fileURLToPath(new URL('../', import.meta.url));
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.json'], { cwd: root, stdio: 'inherit' });
const result = await build({
  absWorkingDir: root,
  entryPoints: ['mcp/server.mjs'],
  outfile: 'dist/normify.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node18',
  banner: { js: "import { createRequire as _createRequire } from 'node:module'; const require = _createRequire(import.meta.url);" },
  legalComments: 'eof',
  metafile: true,
});
// added by gyc 2026-10-04 start：发布：仅收集实际内联依赖的许可证，随运行包分发。
const packages = new Set();
for (const input of Object.keys(result.metafile.inputs)) {
  const start = input.lastIndexOf('node_modules/');
  if (start < 0) continue;
  const base = start + 'node_modules/'.length;
  const segments = input.slice(base).split('/');
  const name = segments.slice(0, segments[0].startsWith('@') ? 2 : 1).join('/');
  packages.add(resolve(root, input.slice(0, base), name));
}
const notices = ['Third-party licenses for the bundled Normify MCP service.\n'];
for (const packageDir of [...packages].sort()) {
  const metadata = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'));
  const licenses = readdirSync(packageDir).filter(name => /^(licen[cs]e|copying|notice)(\.|$)/i.test(name) && statSync(join(packageDir, name)).isFile());
  if (licenses.length === 0) throw new Error('依赖缺少许可证文件：' + metadata.name);
  notices.push(metadata.name + '@' + metadata.version + ' (' + metadata.license + ')');
  for (const name of licenses) notices.push(readFileSync(join(packageDir, name), 'utf8'));
}
writeFileSync(join(root, 'dist/THIRD-PARTY-NOTICES.txt'), notices.join('\n\n'), 'utf8');
// added by gyc 2026-10-04 end
// added by gyc 2026-10-04 start：分发：宿主仅有清单差异，两版服务从同一次构建同步。
const zcode = resolve(root, '../normify-zcode');
for (const path of ['dist/normify.mjs', 'dist/THIRD-PARTY-NOTICES.txt', 'docs/SPEC.zh-CN.md', 'LICENSE']) {
  mkdirSync(join(zcode, dirname(path)), { recursive: true });
  copyFileSync(join(root, path), join(zcode, path));
}
mkdirSync(join(zcode, 'skills/normify-gen'), { recursive: true });
const skill = readFileSync(join(root, 'skills/normify-gen/SKILL.md'), 'utf8')
  .replace('## Codex 接入', '## ZCode 接入')
  .replace('Docs/Codex.md', 'docs/ZCode.md');
writeFileSync(join(zcode, 'skills/normify-gen/SKILL.md'), skill, 'utf8');
// added by gyc 2026-10-04 end
console.log('Codex 插件已构建：dist/normify.mjs');
