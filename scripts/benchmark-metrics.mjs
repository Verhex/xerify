import { createHash } from 'node:crypto';

export const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(p * sorted.length) - 1)];
}

function measured(values) {
  const present = values.filter((v) => typeof v === 'number' && Number.isFinite(v));
  return {
    reported: present.length,
    total: present.length ? present.reduce((a, b) => a + b, 0) : null
  };
}

export function summarizeBenchmark(records, routes, cases, repeats) {
  return routes.map((route) => {
    const rows = records.filter((r) => r.route === route.id);
    const attempted = rows.filter((r) => r.status !== 'skipped');
    const valid = attempted.filter((r) => r.failureCode === null && r.verdict !== null);
    const contextIds = new Set(cases.filter((c) => c.category === 'context').map((c) => c.id));
    const confusion = Object.fromEntries(
      ['confirmed', 'refuted', 'unclear'].map((expected) => [
        expected,
        Object.fromEntries(
          ['confirmed', 'refuted', 'unclear', 'failure', 'skipped'].map((actual) => [actual, 0])
        )
      ])
    );
    for (const r of rows)
      confusion[r.expected][
        r.status === 'skipped' ? 'skipped' : r.failureCode !== null ? 'failure' : r.verdict
      ]++;
    const correct = valid.filter((r) => r.verdict === r.expected).length;
    return {
      route: route.id,
      planned: cases.length * repeats,
      attempted: attempted.length,
      skipped: rows.filter((r) => r.status === 'skipped').length,
      valid: valid.length,
      failures: attempted.length - valid.length,
      correct,
      exactMatchRate: attempted.length ? correct / attempted.length : null,
      contextCorrect: valid.filter((r) => contextIds.has(r.scenario) && r.verdict === r.expected)
        .length,
      contextAttempted: attempted.filter((r) => contextIds.has(r.scenario)).length,
      falseConfirmations: valid.filter(
        (r) => r.verdict === 'confirmed' && r.expected !== 'confirmed'
      ).length,
      decisive: valid.filter((r) => r.verdict !== 'unclear').length,
      unnecessaryAbstentions: valid.filter(
        (r) => r.verdict === 'unclear' && r.expected !== 'unclear'
      ).length,
      latencyMs: {
        n: valid.length,
        min: valid.length ? Math.min(...valid.map((r) => r.wallMs)) : null,
        p50: percentile(
          valid.map((r) => r.wallMs),
          0.5
        ),
        p95: percentile(
          valid.map((r) => r.wallMs),
          0.95
        ),
        max: valid.length ? Math.max(...valid.map((r) => r.wallMs)) : null
      },
      failedLatencyMs: {
        n: attempted.length - valid.length,
        p50: percentile(
          attempted.filter((r) => r.failureCode !== null).map((r) => r.wallMs),
          0.5
        )
      },
      inputTokens: measured(attempted.map((r) => r.usage?.inputTokens)),
      outputTokens: measured(attempted.map((r) => r.usage?.outputTokens)),
      costUsd: measured(attempted.map((r) => r.usage?.costUsd)),
      confusion
    };
  });
}
