import { execFileSync, spawnSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const guard = path.join(root, 'scripts/check-env-boundaries.mjs');
const temporary: string[] = [];
function project() {
  const cwd = mkdtempSync(path.join(os.tmpdir(), 'xerify-env-boundaries-'));
  temporary.push(cwd);
  execFileSync('git', ['init', '-q'], { cwd });
  return cwd;
}
function check(cwd: string, ...args: string[]) {
  return spawnSync(process.execPath, [guard, ...args], { cwd, encoding: 'utf8' });
}
afterEach(() => {
  for (const cwd of temporary.splice(0)) rmSync(cwd, { recursive: true, force: true });
});

describe('environment file boundaries', () => {
  it('blocks a forced dotenv commit through the real pre-commit hook without exposing contents', () => {
    const cwd = project();
    mkdirSync(path.join(cwd, '.githooks'));
    mkdirSync(path.join(cwd, 'scripts'));
    copyFileSync(path.join(root, '.githooks/pre-commit'), path.join(cwd, '.githooks/pre-commit'));
    chmodSync(path.join(cwd, '.githooks/pre-commit'), 0o755);
    copyFileSync(guard, path.join(cwd, 'scripts/check-env-boundaries.mjs'));
    copyFileSync(path.join(root, '.gitignore'), path.join(cwd, '.gitignore'));
    writeFileSync(path.join(cwd, '.env'), 'TYPESAFE_API_KEY=synthetic-never-print-this\n');
    execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { cwd });
    execFileSync('git', ['add', '-f', '.env'], { cwd });
    const commit = spawnSync(
      'git',
      [
        '-c',
        'user.name=Fixture',
        '-c',
        'user.email=fixture@example.test',
        '-c',
        'commit.gpgsign=false',
        'commit',
        '-m',
        'must fail'
      ],
      { cwd, encoding: 'utf8' }
    );
    expect(commit.status).not.toBe(0);
    expect(commit.stderr).toContain('Environment file found in the Git index');
    expect(commit.stdout + commit.stderr).not.toContain('synthetic-never-print-this');
  });

  it('allows the empty public template but rejects populated template values', () => {
    const cwd = project();
    writeFileSync(path.join(cwd, '.env.example'), '# Empty template\nTYPESAFE_API_KEY=\n');
    execFileSync('git', ['add', '.env.example'], { cwd });
    expect(check(cwd, '--staged').status).toBe(0);
    writeFileSync(path.join(cwd, '.env.example'), 'TYPESAFE_API_KEY=synthetic-never-print-this\n');
    execFileSync('git', ['add', '.env.example'], { cwd });
    const result = check(cwd, '--staged');
    expect(result.status).toBe(1);
    expect(result.stderr).not.toContain('synthetic-never-print-this');
  });

  it('keeps nested dotenv files and backups ignored and out of the real npm pack manifest', () => {
    const cwd = project();
    const manifest = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
    writeFileSync(
      path.join(cwd, 'package.json'),
      JSON.stringify({ name: 'fixture-env-boundaries', version: '1.0.0', files: manifest.files })
    );
    copyFileSync(path.join(root, '.gitignore'), path.join(cwd, '.gitignore'));
    copyFileSync(path.join(root, '.npmignore'), path.join(cwd, '.npmignore'));
    mkdirSync(path.join(cwd, 'tools'));
    writeFileSync(path.join(cwd, 'tools/public.js'), 'export const publicValue = 1;\n');
    const forbidden = [
      '.env',
      '.env.local',
      '.env~',
      'tools/.env',
      'tools/.env.production',
      'tools/.env.example'
    ];
    for (const name of forbidden) writeFileSync(path.join(cwd, name), 'DUMMY_KEY=synthetic-only\n');
    writeFileSync(path.join(cwd, '.env.example'), 'DUMMY_KEY=\n');
    const ignored = execFileSync('git', ['check-ignore', '--stdin'], {
      cwd,
      input: forbidden.join('\n'),
      encoding: 'utf8'
    })
      .trim()
      .split('\n');
    expect(ignored).toEqual(forbidden);
    const result = check(cwd, '--package');
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    // Root npmignore alone does not protect explicitly allowlisted directories; the guard
    // must catch a regression if the package-level exclusions are removed.
    writeFileSync(
      path.join(cwd, 'package.json'),
      JSON.stringify({ name: 'fixture-env-boundaries', version: '1.0.0', files: ['tools'] })
    );
    expect(check(cwd, '--package').status).toBe(1);
  });

  it('rejects nested dotenv files in a site upload directory', () => {
    const cwd = project();
    mkdirSync(path.join(cwd, '_site/nested'), { recursive: true });
    writeFileSync(path.join(cwd, '_site/index.html'), '<p>Public</p>');
    expect(check(cwd, '--site', '_site').status).toBe(0);
    writeFileSync(path.join(cwd, '_site/nested/.env'), 'DUMMY_KEY=synthetic-never-print-this');
    const result = check(cwd, '--site', '_site');
    expect(result.status).toBe(1);
    expect(result.stderr).not.toContain('synthetic-never-print-this');
  });
});
