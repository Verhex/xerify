import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

function preview(env: NodeJS.ProcessEnv = {}, args: string[] = []) {
  return spawnSync(process.execPath, ['scripts/benchmark-providers.mjs', ...args], {
    encoding: 'utf8',
    env
  });
}

describe('cross-provider benchmark', () => {
  it('freezes a balanced twelve-case matrix across every distinct pair without calling providers', () => {
    const processResult = preview();
    expect(processResult.status).toBe(0);
    const plan = JSON.parse(processResult.stdout);
    expect(plan).toMatchObject({
      mode: 'preview',
      suite: 'xerify-cross-provider-v3',
      maxCalls: 72,
      repeats: 1,
      sourceMode: 'declared-fixture-identity-only'
    });
    expect(plan.routes.map((r: { id: string }) => r.id)).toEqual([
      'openai-to-anthropic',
      'openai-to-typesafe',
      'anthropic-to-openai',
      'anthropic-to-typesafe',
      'typesafe-to-openai',
      'typesafe-to-anthropic'
    ]);
    for (const label of ['confirmed', 'refuted', 'unclear'])
      expect(plan.scenarios.filter((s: { expected: string }) => s.expected === label)).toHaveLength(
        4
      );
    expect(new Set(plan.scenarios.map((s: { id: string }) => s.id)).size).toBe(12);
  });

  it('requires an explicit billable gate and key before importing the built CLI', () => {
    expect(preview({}, ['--live']).status).toBe(2);
    expect(preview({ XERIFY_LIVE_CONFIRM_BILLABLE: 'YES' }, ['--live']).status).toBe(3);
  });

  it('bounds repeat count and rejects ambiguous or auto model identifiers', () => {
    expect(preview({ XERIFY_BENCH_REPEATS: '4' }).status).not.toBe(0);
    expect(preview({ XERIFY_BENCH_OPENAI_MODEL: 'auto' }).status).not.toBe(0);
    expect(preview({ XERIFY_BENCH_REPEATS: '2' }).status).toBe(0);
    expect(JSON.parse(preview({ XERIFY_BENCH_REPEATS: '2' }).stdout).maxCalls).toBe(144);
  });

  it('keeps failures out of semantic successes and missing usage out of zero totals', () => {
    const script = `
      import { summarizeBenchmark, percentile } from './scripts/benchmark-metrics.mjs';
      const rows = [
        {route:'r', scenario:'s', expected:'unclear',status:'attempted',verdict:'unclear',failureCode:'TIMEOUT',wallMs:90000,usage:null},
        {route:'r', scenario:'s', expected:'unclear',status:'attempted',verdict:'unclear',failureCode:null,wallMs:300,usage:{inputTokens:0,outputTokens:2,costUsd:null}},
        {route:'r', scenario:'s', expected:'unclear',status:'attempted',verdict:'confirmed',failureCode:null,wallMs:500,usage:null},
        {route:'r', scenario:'s', expected:'unclear',status:'skipped',verdict:null,failureCode:null}
      ];
      console.log(JSON.stringify({summary:summarizeBenchmark(rows,[{id:'r'}],[{id:'s',category:'context'}],4)[0], median:percentile([3,1,2],.5),empty:percentile([],.95)}));
    `;
    const run = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
      encoding: 'utf8',
      env: {}
    });
    expect(run.status).toBe(0);
    expect(JSON.parse(run.stdout)).toMatchObject({
      median: 2,
      empty: null,
      summary: {
        attempted: 3,
        skipped: 1,
        valid: 2,
        correct: 1,
        exactMatchRate: 1 / 3,
        contextCorrect: 1,
        contextAttempted: 3,
        falseConfirmations: 1,
        latencyMs: { n: 2, p50: 300, p95: 500 },
        failedLatencyMs: { n: 1, p50: 90000 },
        inputTokens: { reported: 1, total: 0 },
        outputTokens: { reported: 1, total: 2 },
        costUsd: { reported: 0, total: null },
        confusion: { unclear: { unclear: 1, confirmed: 1, failure: 1, skipped: 1 } }
      }
    });
  });

  it('keeps the published v2 matrix complete and its aggregates reproducible without live calls', () => {
    const script = `
      import assert from 'node:assert/strict';
      import { readFileSync } from 'node:fs';
      import { benchmarkCases, benchmarkRoutes } from './scripts/benchmark-cases.mjs';
      import { digest, summarizeBenchmark } from './scripts/benchmark-metrics.mjs';
      const report = JSON.parse(readFileSync('docs/benchmarks/2026-09-18-v2-three-providers.json', 'utf8'));
      const routes = benchmarkRoutes(report.models);
      assert.deepEqual(Object.keys(report.models), ['openai','anthropic','typesafe']);
      assert.equal(report.selection.originalCalls, 144);
      assert.equal(report.selection.selectedCalls, 72);
      assert.equal(report.caseDigest, digest(benchmarkCases));
      assert.equal(report.observations.length, 72);
      assert.equal(new Set(report.observations.map(r => r.route+'/'+r.scenario+'/'+r.repeat)).size, 72);
      for (const row of report.observations) {
        assert(routes.some(r => r.id === row.route));
        assert.equal(row.repeat, 1);
        assert.equal(row.expected, benchmarkCases.find(c => c.id === row.scenario)?.expected);
        assert.equal(row.status, 'attempted');
        assert(!Object.keys(row).some(k => /prompt|context|summary|response|secret|key|path/i.test(k)));
      }
      const records = report.observations.map(r => ({...r, usage: {
        inputTokens:r.inputTokens, outputTokens:r.outputTokens, costUsd:r.costUsd
      }}));
      assert.deepEqual(summarizeBenchmark(records, routes, benchmarkCases, report.repeats), report.summary);
    `;
    const run = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
      encoding: 'utf8',
      env: {}
    });
    expect(run.stderr).toBe('');
    expect(run.status).toBe(0);
  });
});
