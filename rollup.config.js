import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import eslint from '@rollup/plugin-eslint';
import del from 'rollup-plugin-delete';
import fs from 'fs';
import path from 'path';
import packageJson from './package.json';

const externalPackages = Object.keys({
  ...packageJson.dependencies,
  ...packageJson.peerDependencies,
});

const getOutput = (path, format) => ({
  file: path,
  format: format,
  sourcemap: false,
  compact: true,
  exports: 'named',
});

const getConfig = () => ({
  input: 'src/index.ts',
  output: [getOutput(packageJson.main, 'cjs'), getOutput(packageJson.module, 'esm')],
  external: (id) => externalPackages.some((name) => id === name || id.startsWith(`${name}/`)),
  context: 'globalThis',
  plugins: [
    (typeof del === 'function' ? del : del.default)({ targets: 'dist/*' }),
    peerDepsExternal(),
    eslint({
      throwOnError: true,
      throwOnWarning: true,
      include: ['src/**'],
      exclude: ['node_modules/**', 'dist/**', 'examples/**', 'test/**'],
    }),
    typescript({ useTsconfigDeclarationDir: true }),
    resolve({ extensions: ['.js', '.jsx', '.ts', '.tsx'] }),
    commonjs({
      include: /node_modules/,
    }),
    // *.private 디렉토리, *.private.d.ts 파일 제거
    {
      name: 'remove-d-ts-plugin',
      generateBundle() {
        const removeFromDir = (dir) => {
          const files = fs.readdirSync(dir);
          files.forEach((file) => {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
              if (filePath.endsWith('.private')) {
                fs.rmSync(filePath, { recursive: true, force: true });
              } else {
                removeFromDir(filePath);
              }
            } else {
              if (filePath.endsWith('.private.d.ts')) {
                fs.unlinkSync(filePath);
              } else if (filePath.endsWith('.d.ts')) {
                const declaration = fs.readFileSync(filePath, 'utf8')
                  .replace(/(from\s+['"]|import\(['"])(\.\.?\/[^'"]+)(['"])/g, (match, prefix, specifier, quote) =>
                    `${prefix}${specifier.endsWith('.js') ? specifier : `${specifier}.js`}${quote}`
                  )
                  .replace(/import\("\."\)/g, 'import("./index.js")')
                  .replace(/import\("\.\."\)/g, 'import("../index.js")');
                fs.writeFileSync(filePath, declaration);
                fs.writeFileSync(
                  filePath.replace(/\.d\.ts$/, '.d.cts'),
                  declaration.replace(/(from\s+['"]|import\(['"])(\.\.?\/[^'"]+)\.js(['"])/g, '$1$2.cjs$3')
                );
              }
            }
          });
        };
        removeFromDir('./dist');
      },
    },
  ],
});

export default [getConfig()];
