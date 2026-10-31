import { describe, it, expect } from 'vitest';
import { execFileSync, execSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
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

// Packs the package as npm would publish it (so it needs a fresh `npm run build-ts`),
// installs it into a NodeNext TypeScript project, type-checks it, and runs it from ESM and CommonJS.
describe('Packaging', () => {
  it('resolves with its types from NodeNext ESM and CommonJS consumers', () => {
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
      rmSync(tmp, { recursive: true, force: true });
    }
  }, 120_000);
});
