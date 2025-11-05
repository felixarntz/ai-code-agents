import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['cjs', 'esm'],
  dts: {
    compilerOptions: {
      // See: https://github.com/egoist/tsup/issues/571#issuecomment-2457920686
      composite: false,
    },
  },
  sourcemap: true,
});
