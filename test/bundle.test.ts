import { describe, it, expect, beforeAll } from 'vitest';
import { build, loadConfigFromFile, type Plugin, type PluginOption } from 'vite';
import path from 'path';
import packageJson from '../package.json';

const root = path.resolve(__dirname, '..');

// Builds the library with the project's own Vite config, in memory.
// The dts plugin is dropped: it writes declaration files to disk.
async function buildBundles(): Promise<Map<string, string>> {
  const loaded = await loadConfigFromFile(
    { command: 'build', mode: 'production' },
    path.join(root, 'vite.config.ts'),
    root,
    'silent'
  );
  if (!loaded) throw new Error('vite.config.ts not found');

  // `Infinity as 1`: flat(Infinity) makes TypeScript recurse too deep (TS2589)
  const allPlugins = ((loaded.config.plugins ?? []).flat(Infinity as 1) as PluginOption[])
    .filter((p): p is Plugin => !!p && typeof p === 'object' && 'name' in p);
  const plugins = allPlugins.filter((p) => !p.name.includes('dts'));
  if (plugins.length === allPlugins.length) {
    throw new Error('dts plugin not found: the build would write into types/');
  }

  const result = await build({
    ...loaded.config,
    configFile: false,
    root,
    logLevel: 'silent',
    plugins,
    build: { ...loaded.config.build, write: false },
  });

  const outputs = Array.isArray(result) ? result : [result];
  const chunks = new Map<string, string>();
  for (const output of outputs) {
    if (!('output' in output)) throw new Error('Unexpected watcher from build()');
    for (const item of output.output) {
      if (item.type === 'chunk') chunks.set(item.fileName, item.code);
    }
  }
  return chunks;
}

describe('Published bundles (issue #6)', () => {
  let chunks: Map<string, string>;

  beforeAll(async () => {
    chunks = await buildBundles();
  }, 60_000);

  it('builds both the ES and the UMD bundle', () => {
    expect([...chunks.keys()].sort()).toEqual(['OneEuroFilter.js', 'OneEuroFilter.mjs']);
  });

  it.each(['OneEuroFilter.mjs', 'OneEuroFilter.js'])(
    '%s keeps the version string but not the package.json object',
    (fileName) => {
      expect(chunks.has(fileName)).toBe(true);
      const code = chunks.get(fileName)!;

      expect(code).toContain(packageJson.version);

      expect(code).not.toContain(packageJson.description);
      expect(code).not.toContain(packageJson.author);
      expect(code).not.toContain(packageJson.repository.url);
      expect(code).not.toContain('devDependencies');
    }
  );
});
