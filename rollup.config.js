import { defineConfig } from 'rollup';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

const esOutDir = 'dist';
const cjsOutDir = 'dist/cjs';
const externals = ['dotenv', 'fs', 'node:events', 'path', 'url'];

/**
 * @return {import('rollup').RollupOptions[]}
 */
function generateModuleConfig(input) {
  return [
    {
      input,
      external: externals,
      output: [
        {
          format: 'es',
          dir: esOutDir,
          sourcemap: true,
        },
        {
          format: 'cjs',
          dir: cjsOutDir,
          sourcemap: true,
        },
      ],
      plugins: [typescript(), terser({ keep_classnames: true })],
    },
    {
      input,
      external: externals,
      output: [
        {
          format: 'es',
          dir: esOutDir,
        },
        {
          format: 'cjs',
          dir: cjsOutDir,
        },
      ],
      plugins: [dts()],
    },
  ];
}

export default defineConfig(
  generateModuleConfig({
    common: './src/common/index.ts',
    node: './src/node/index.ts',
    browser: './src/browser/index.ts',
  }),
);
