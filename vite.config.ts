import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'OneEuroFilter',
      fileName: (format) => format === 'es' ? 'OneEuroFilter.mjs' : 'OneEuroFilter.js',
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    },
    outDir: 'dist',
    sourcemap: true,
    minify: true
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      outDir: 'types',
      entryRoot: 'src',
      copyDtsFiles: true,
      include: ['src']
    })
  ],
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts']
  }
});
