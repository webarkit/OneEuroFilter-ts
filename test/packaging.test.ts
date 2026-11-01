import { describe, it, expect } from 'vitest';
import { execFileSync, execSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { version } from '../package.json';

const root = path.resolve(__dirname, '..');
const tsc = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');

/** Runs a command and returns its stdout; on failure, the error carries the command's output. */
function run(command: string, args: string[], cwd: string): string {
  try {
    if (command === 'npm') {
      // npm is a .cmd script on Windows, which needs a shell
      return execSync(['npm', ...args.map((a) => JSON.stringify(a))].join(' '), { cwd, encoding: 'utf8' });
    }
    return execFileSync(command, args, { cwd, encoding: 'utf8' });
  } catch (error) {
    const e = error as { stdout?: string; stderr?: string; message: string };
    throw new Error(`${command} ${args.join(' ')} failed:\n${e.stdout ?? ''}${e.stderr ?? ''}${e.message}`);
  }
}

/** Fails with a clear message when the built files are missing or older than their sources. */
function assertFreshBuild(): void {
  const built = ['dist/OneEuroFilter.mjs', 'dist/OneEuroFilter.js', 'types/index.d.ts', 'types/index.d.mts'];
  const sources = ['package.json', 'vite.config.ts', ...readdirSync(path.join(root, 'src')).map((f) => `src/${f}`)];
  const mtime = (f: string) => statSync(path.join(root, f)).mtimeMs;
  const newestSource = Math.max(...sources.map(mtime));
  const problems = built.flatMap((f) => {
    if (!existsSync(path.join(root, f))) return [`${f} is missing`];
    return mtime(f) < newestSource ? [`${f} is older than the sources`] : [];
  });
  if (problems.length > 0) {
    throw new Error(`Run "npm run build-ts" before this test: ${problems.join(', ')}`);
  }
}

// Packs the package as npm would publish it (so it needs a fresh `npm run build-ts`),
// installs it into a NodeNext TypeScript project, type-checks it, and runs it from ESM and CommonJS.
describe('Packaging', () => {
  it('resolves with its types from NodeNext ESM and CommonJS consumers', () => {
    assertFreshBuild();
    const tmp = mkdtempSync(path.join(tmpdir(), 'oef-consumer-'));
    try {
      const [{ filename }] = JSON.parse(run('npm', ['pack', '--json', '--pack-destination', tmp], root));
      const consumer = path.join(tmp, 'consumer');
      cpSync(path.join(__dirname, 'fixtures', 'nodenext-consumer'), consumer, { recursive: true });
      run('npm', ['install', '--offline', '--no-audit', '--no-fund', '--ignore-scripts', path.join(tmp, filename)], consumer);

      run(process.execPath, [tsc, '-p', consumer], consumer);

      expect(run(process.execPath, [path.join(consumer, 'out', 'esm.mjs')], consumer).trim()).toBe(`esm ${version} 2 1`);
      expect(run(process.execPath, [path.join(consumer, 'out', 'cjs.cjs')], consumer).trim()).toBe(`cjs ${version} 2 1`);
    } finally {
      rmSync(tmp, { recursive: true, force: true, maxRetries: 3 });
    }
  }, 120_000);

  it.each(['dist/OneEuroFilter.mjs.map', 'dist/OneEuroFilter.js.map'])(
    '%s does not embed package.json',
    (file) => {
      assertFreshBuild();
      const map = JSON.parse(readFileSync(path.join(root, file), 'utf8')) as { sources: string[] };

      // sourcesContent holds the text of each source, so this also keeps package.json's text out
      expect(map.sources).toEqual(['../src/OneEuroFilter.ts']);
    }
  );
});
