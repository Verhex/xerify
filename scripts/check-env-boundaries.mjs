import { execFileSync } from 'node:child_process';
import { readdirSync, lstatSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

// Inspect filenames and the public empty template only. Never read a real dotenv file.
const isEnvironmentPath = (name) =>
  name.split(/[\\/]/).some((part) => /^\.env(?:$|[.~])/i.test(part));
const fail = (message) => {
  throw new Error(message);
};

function tracked() {
  const names = execFileSync('git', ['ls-files', '--cached', '-z'], { encoding: 'utf8' })
    .split('\0')
    .filter(Boolean);
  if (names.some((name) => isEnvironmentPath(name) && name !== '.env.example')) {
    fail('Environment file found in the Git index. Unstage it; keep credentials local.');
  }
  if (names.includes('.env.example')) {
    const template = execFileSync('git', ['show', ':.env.example'], { encoding: 'utf8' });
    // Only comments, blank lines, and empty assignments may be committed as the template.
    if (
      template.split(/\r?\n/).some((line) => {
        const value = line.trim();
        return value && !value.startsWith('#') && !/^[A-Za-z_][A-Za-z0-9_]*=\s*$/.test(value);
      })
    )
      fail('.env.example must contain only comments and empty assignments.');
  }
}

function site(directory) {
  let metadata;
  try {
    metadata = lstatSync(directory);
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  if (metadata.isSymbolicLink()) fail('Site output must not contain symbolic links.');
  if (isEnvironmentPath(directory)) fail('Environment file found in site output.');
  if (metadata.isDirectory()) {
    for (const name of readdirSync(directory)) site(path.join(directory, name));
  }
}

function packageFiles() {
  const args = ['pack', '--dry-run', '--ignore-scripts', '--json'];
  const command = process.env.npm_execpath
    ? process.execPath
    : process.platform === 'win32'
      ? 'npm.cmd'
      : 'npm';
  const output = execFileSync(
    command,
    process.env.npm_execpath ? [process.env.npm_execpath, ...args] : args,
    {
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
      timeout: 60_000,
      windowsHide: true
    }
  );
  const packed = JSON.parse(output);
  if (!Array.isArray(packed) || !Array.isArray(packed[0]?.files))
    fail('Unable to inspect npm package manifest.');
  if (packed[0].files.some((file) => isEnvironmentPath(file.path)))
    fail('Environment file found in npm package.');
}

try {
  const [mode, directory, ...extra] = process.argv.slice(2);
  if (extra.length || (directory && mode !== '--site'))
    fail('Invalid environment boundary arguments.');
  if (mode === '--staged' || mode === '--tracked') tracked();
  else if (mode === '--site' && directory) site(directory);
  else if (mode === '--package') packageFiles();
  else if (mode === undefined) {
    tracked();
    site('site');
    packageFiles();
  } else fail('Use --staged, --tracked, --site <directory>, or --package.');
  process.stdout.write('Environment boundaries passed; no dotenv contents were printed.\n');
} catch (error) {
  // Errors from external commands can contain their output; expose only our own category.
  const message =
    error instanceof Error && !('status' in error)
      ? error.message
      : 'Unable to verify environment boundaries.';
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}
