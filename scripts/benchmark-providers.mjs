import { chmod, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { Buffer } from 'node:buffer';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { benchmarkCases, benchmarkModels, benchmarkRoutes } from './benchmark-cases.mjs';
import { digest, summarizeBenchmark } from './benchmark-metrics.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const repeats = Number(process.env.XERIFY_BENCH_REPEATS ?? '1');
if (!Number.isInteger(repeats) || repeats < 1 || repeats > 3)
  throw new Error('XERIFY_BENCH_REPEATS must be 1..3');
if (args.some((arg) => arg !== '--live' && !arg.startsWith('--resume=')))
  throw new Error('Use --live and optionally --resume=REPORT; no arguments previews the plan');
const resumePath = args.find((arg) => arg.startsWith('--resume='))?.slice(9);
const models = Object.fromEntries(
  Object.entries(benchmarkModels).map(([provider, fallback]) => [
    provider,
    process.env[`XERIFY_BENCH_${provider.toUpperCase()}_MODEL`] ?? fallback
  ])
);
if (
  Object.values(models).some(
    (m) => !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(m) || m.toLowerCase() === 'auto'
  )
)
  throw new Error('Explicit model identifiers are required');
const routes = benchmarkRoutes(models);
const plan = {
  suite: 'xerify-cross-provider-v3',
  sourceMode: 'declared-fixture-identity-only',
  models,
  routes,
  repeats,
  maxCalls: routes.length * benchmarkCases.length * repeats,
  limits: { timeoutMs: 0, maxInputBytes: 32768, maxOutputBytes: 131072 },
  caseDigest: digest(benchmarkCases),
  scenarios: benchmarkCases
};

if (!args.includes('--live')) {
  process.stdout.write(`${JSON.stringify({ mode: 'preview', ...plan }, null, 2)}\n`);
} else if (process.env.XERIFY_LIVE_CONFIRM_BILLABLE !== 'YES') {
  process.stderr.write(
    'Live benchmark requires XERIFY_LIVE_CONFIRM_BILLABLE=YES; no calls made.\n'
  );
  process.exitCode = 2;
} else if (!process.env.TYPESAFE_API_KEY) {
  process.stderr.write('TYPESAFE_API_KEY is missing; no calls made.\n');
  process.exitCode = 3;
} else {
  let previous;
  if (resumePath) {
    const resolved = path.resolve(resumePath);
    const relative = path.relative(path.join(root, '.xerify/benchmarks'), resolved);
    if (
      relative.startsWith('..') ||
      path.isAbsolute(relative) ||
      path.basename(resolved) !== 'report.json'
    )
      throw new Error('Resume only a private .xerify/benchmarks run report');
    previous = JSON.parse(await readFile(resolved, 'utf8'));
    for (const field of [
      'suite',
      'sourceMode',
      'models',
      'routes',
      'repeats',
      'limits',
      'caseDigest'
    ]) {
      if (digest(previous[field]) !== digest(plan[field]))
        throw new Error(`Resume plan differs: ${field}`);
    }
  }
  const { runCli, stdinFromString } = await import('../dist/cli/program.js');
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'xerify-benchmark-'));
  const startedAt = new Date().toISOString();
  const reportDir = path.join(root, '.xerify/benchmarks', startedAt.replaceAll(':', '-'));
  await mkdir(reportDir, { recursive: true, mode: 0o700 });
  await chmod(reportDir, 0o700);
  const records = previous?.records.filter((r) => r.status === 'attempted') ?? [];
  // Pin the benchmark's limits/config rather than inheriting Xerify-specific overrides.
  const cliEnvironment = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith('XERIFY_'))
  );
  const recordKey = (r) => `${r.route}/${r.scenario}/${r.repeat}`;
  const completed = new Set(records.map(recordKey));
  if (completed.size !== records.length || records.length > plan.maxCalls)
    throw new Error('Invalid resume records');
  const disabled = new Map();
  let cancelled = false;
  const cancel = () => {
    cancelled = true;
  };
  process.on('SIGINT', cancel);
  process.on('SIGTERM', cancel);
  const hashes = Object.fromEntries(
    await Promise.all(
      [
        'src/core/prompts.ts',
        'src/providers/jev.ts',
        'src/providers/codex.ts',
        'src/providers/claude.ts',
        'scripts/benchmark-providers.mjs',
        'scripts/benchmark-cases.mjs',
        'scripts/benchmark-metrics.mjs'
      ].map(async (file) => [file, digest(await readFile(path.join(root, file), 'utf8'))])
    )
  );
  const metadata = {
    ...plan,
    startedAt,
    runtime: { node: process.version, platform: process.platform, architecture: process.arch },
    implementationDigests: hashes,
    ...(previous
      ? { resumedFromStartedAt: previous.startedAt, carriedAttempts: records.length }
      : {})
  };
  if (previous) {
    for (const file of Object.keys(hashes).filter((file) => file.startsWith('src/'))) {
      if (hashes[file] !== previous.implementationDigests[file])
        throw new Error('Cannot resume after changing adapter or prompt code');
    }
  }
  const persist = async () => {
    await writeFile(
      path.join(reportDir, 'report.tmp'),
      `${JSON.stringify({ ...metadata, records, summary: summarizeBenchmark(records, routes, benchmarkCases, repeats) }, null, 2)}\n`,
      { mode: 0o600 }
    );
    await rename(path.join(reportDir, 'report.tmp'), path.join(reportDir, 'report.json'));
  };
  try {
    await chmod(cwd, 0o700);
    await mkdir(path.join(cwd, '.xerify'), { mode: 0o700 });
    await writeFile(
      path.join(cwd, '.xerify/xverify-config.json'),
      JSON.stringify({
        history: { enabled: false },
        logPath: null,
        limits: plan.limits
      }),
      { mode: 0o600 }
    );
    await persist();
    benchmark: for (let repeat = 0; repeat < repeats; repeat++) {
      for (const [index, scenario] of benchmarkCases.entries()) {
        // Rotate the six routes deterministically to spread order/time effects; never run concurrently.
        const offset = (index + repeat) % routes.length;
        for (const route of [...routes.slice(offset), ...routes.slice(0, offset)]) {
          if (cancelled) break benchmark;
          const base = {
            route: route.id,
            scenario: scenario.id,
            category: scenario.category,
            repeat: repeat + 1,
            expected: scenario.expected,
            evidenceDigest: digest({ claim: scenario.claim, context: scenario.context }),
            contextBytes: Buffer.byteLength(scenario.context, 'utf8')
          };
          if (completed.has(recordKey(base))) continue;
          if (disabled.has(route.to.provider)) {
            records.push({
              ...base,
              status: 'skipped',
              reason: disabled.get(route.to.provider),
              verdict: null,
              failureCode: null
            });
            await persist();
            continue;
          }
          let stdout = '';
          const before = performance.now();
          process.stdout.write(`Starting ${route.id} / ${scenario.id}; no lifecycle deadline\n`);
          const exitCode = await runCli(
            [
              '--json',
              '--timeout',
              String(plan.limits.timeoutMs),
              'verify',
              '--from',
              `${route.from.provider}:${route.from.model}`,
              '--to',
              `${route.to.provider}:${route.to.model}`,
              '--adapter',
              route.adapter,
              '--claim',
              scenario.claim
            ],
            {
              cwd,
              env: { ...cliEnvironment, XERIFY_USER_CONFIG_PATH: path.join(cwd, 'absent.json') },
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
          const wallMs = Math.round(performance.now() - before);
          let envelope;
          try {
            envelope = JSON.parse(stdout);
          } catch {
            envelope = { error: { code: 'RUNNER_INVALID_ENVELOPE' } };
          }
          const result = envelope.data;
          const record = {
            ...base,
            status: 'attempted',
            exitCode,
            wallMs,
            xerifyDurationMs: result?.durationMs ?? null,
            verdict: result?.verdict ?? null,
            failureCode:
              result?.failure?.code ??
              envelope.error?.code ??
              (result ? null : 'RUNNER_INVALID_ENVELOPE'),
            usage: result?.usage ?? null,
            truncation: result?.truncation ?? null,
            decision: result?.decision ?? null,
            findingsCount: result?.findings?.length ?? null,
            evidenceCount: result?.evidence?.length ?? null
          };
          records.push(record);
          // Structural/unavailability errors disable a target; never silently rerun or substitute a model.
          if (
            record.failureCode &&
            !['INVALID_PROVIDER_RESPONSE', 'TIMEOUT'].includes(record.failureCode)
          )
            disabled.set(route.to.provider, record.failureCode);
          await persist();
          process.stdout.write(
            `${JSON.stringify({ route: record.route, scenario: record.scenario, verdict: record.verdict, expected: record.expected, failureCode: record.failureCode, wallMs })}\n`
          );
        }
      }
    }
  } finally {
    process.removeListener('SIGINT', cancel);
    process.removeListener('SIGTERM', cancel);
    await persist();
    await rm(cwd, { recursive: true, force: true });
    process.stdout.write(`Private normalized benchmark: ${reportDir}/report.json\n`);
  }
  const summary = summarizeBenchmark(records, routes, benchmarkCases, repeats);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  process.exitCode =
    cancelled || summary.some((s) => s.failures || s.skipped || s.attempted !== s.planned)
      ? 1
      : summary.some((s) => s.correct !== s.planned)
        ? 11
        : 0;
}
