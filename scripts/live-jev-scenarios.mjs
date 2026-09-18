import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { jevScenarios } from './jev-scenarios.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const model = 'jev-1.13.0';
if (!process.argv.includes('--live')) {
  process.stdout.write(
    `${JSON.stringify({ mode: 'preview', model, maxCalls: jevScenarios.length, scenarios: jevScenarios }, null, 2)}\n`
  );
} else if (process.env.XERIFY_LIVE_CONFIRM_BILLABLE !== 'YES') {
  process.stderr.write('Live mode requires XERIFY_LIVE_CONFIRM_BILLABLE=YES; no calls made.\n');
  process.exitCode = 2;
} else if (!process.env.TYPESAFE_API_KEY) {
  process.stderr.write('TYPESAFE_API_KEY is missing; no calls made.\n');
  process.exitCode = 3;
} else {
  const { runCli, stdinFromString } = await import('../dist/cli/program.js');
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'xerify-jev-scenarios-'));
  const results = [];
  const startedAt = new Date().toISOString();
  try {
    await chmod(cwd, 0o700);
    await mkdir(path.join(cwd, '.xerify'), { mode: 0o700 });
    await writeFile(
      path.join(cwd, '.xerify/xverify-config.json'),
      JSON.stringify({ history: { enabled: false }, logPath: null }),
      { mode: 0o600 }
    );
    for (const scenario of jevScenarios) {
      let stdout = '';
      const exitCode = await runCli(
        [
          '--json',
          '--timeout',
          '30000',
          'verify',
          '--from',
          'openai:gpt-6',
          '--to',
          `jev:${model}`,
          '--claim',
          scenario.claim
        ],
        {
          cwd,
          env: {
            TYPESAFE_API_KEY: process.env.TYPESAFE_API_KEY,
            XERIFY_USER_CONFIG_PATH: path.join(cwd, 'absent.json')
          },
          stdin: stdinFromString(scenario.context),
          stdinIsTTY: false,
          writer: {
            stdout: (value) => {
              stdout += value;
            },
            stderr: () => {}
          }
        }
      );
      const envelope = JSON.parse(stdout);
      const result = envelope.data;
      const record = {
        id: scenario.id,
        expected: scenario.expected,
        exitCode,
        verdict: result?.verdict ?? null,
        choice: result?.decision?.choice ?? null,
        probabilities: result?.decision?.probabilities ?? null,
        confidence: result?.decision?.confidence ?? null,
        policy: result?.decision?.policy ?? null,
        model: result?.decision?.model ?? null,
        durationMs: result?.durationMs ?? null,
        usage: result?.usage ?? null,
        truncation: result?.truncation ?? null,
        failureCode: result?.failure?.code ?? envelope.error?.code ?? null,
        choiceMatches: result?.decision?.choice === scenario.expected,
        verdictMatches: result?.verdict === scenario.expected
      };
      results.push(record);
      process.stdout.write(`${JSON.stringify(record)}\n`);
      // Do not spend more on an unhealthy endpoint or credential. Never retry a case.
      if (record.failureCode !== null) break;
    }
  } finally {
    const reportDir = path.join(root, '.xerify/live-jev-scenarios');
    await mkdir(reportDir, { recursive: true, mode: 0o700 });
    await chmod(reportDir, 0o700);
    const reportPath = path.join(reportDir, `${startedAt.replaceAll(':', '-')}.json`);
    await writeFile(
      reportPath,
      `${JSON.stringify({ startedAt, requestedModel: model, maxCalls: jevScenarios.length, results }, null, 2)}\n`,
      { mode: 0o600 }
    );
    await rm(cwd, { recursive: true, force: true });
    process.stdout.write(`Local normalized report: ${reportPath}\n`);
  }
  // A semantic mismatch is reported explicitly; it is not a transport failure or an automatic retry.
  if (results.length !== jevScenarios.length || results.some((r) => r.failureCode !== null))
    process.exitCode = 1;
  else if (results.some((r) => !r.verdictMatches)) process.exitCode = 11;
}
