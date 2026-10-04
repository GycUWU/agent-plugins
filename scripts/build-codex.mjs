import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

// added by gyc 2026-10-04：打包：编译上游引擎并内联运行依赖，安装后的插件只需 Node.js。
const root = fileURLToPath(new URL('../', import.meta.url));
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.json'], { cwd: root, stdio: 'inherit' });
await build({
  absWorkingDir: root,
  entryPoints: ['mcp/server.mjs'],
  outfile: 'dist/normify.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node18',
  banner: { js: "import { createRequire as _createRequire } from 'node:module'; const require = _createRequire(import.meta.url);" },
  legalComments: 'eof',
});
console.log('Codex 插件已构建：dist/normify.mjs');
