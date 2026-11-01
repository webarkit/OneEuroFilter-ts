import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';
import path from 'path';
import { version } from './package.json';

export default defineConfig({
  // Only the version string goes into the bundles, not package.json (see src/OneEuroFilter.ts)
  define: {
    __VERSION__: JSON.stringify(version)
  },
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
      // .d.ts for CommonJS consumers (require) and .d.mts for ESM consumers (import), see package.json "exports"
      outDirs: ['types', { dir: 'types', moduleFormat: 'esm' }],
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
