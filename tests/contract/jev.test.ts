import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_LIMITS,
  VerifyRequestSchema,
  VerifyResultSchema
} from '../../src/core/contracts.js';
import { executeAsk, executeVerify } from '../../src/core/execute.js';
import { verificationExitCode } from '../../src/core/verdict.js';
import { JevAdapter } from '../../src/providers/jev.js';
import { ProviderRegistry } from '../../src/providers/registry.js';
import { runCli, stdinFromString } from '../../src/cli/program.js';
import { summarizeForAudit } from '../../src/core/audit.js';
import { JevProviderConfigSchema } from '../../src/config/schema.js';

const request = VerifyRequestSchema.parse({
  from: { provider: 'openai', model: 'author', provenance: 'declared' },
  to: { provider: 'typesafe', model: 'jev-latest' },
  claim: 'The migration preserves nullable values',
  context: 'ALTER TABLE users ALTER name SET NOT NULL;'
});
const answer = {
  type: 'choice',
  choice: 'refuted',
  probabilities: { confirmed: 0.01, refuted: 0.98, unclear: 0.01 },
  confidence: 0.95
};
function response(overrides: Record<string, unknown> = {}) {
  return {
    model: 'jev-1.13.0',
    answers: { verdict: { ...answer, ...overrides } },
    usage: { input_tokens: 123, output_tokens: 0 }
  };
}
function setup(
  value: unknown = response(),
  options: { minProbability?: number; minConfidence?: number } = {}
) {
  const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response(JSON.stringify(value)));
  const adapter = new JevAdapter({ env: { TYPESAFE_API_KEY: 'test-secret' }, fetch, ...options });
  return { fetch, adapter, registry: new ProviderRegistry([adapter]) };
}
afterEach(() => vi.unstubAllGlobals());

describe('Jev verification', () => {
  it('uses typed state/questions and preserves decision metadata without inventing citations or costs', async () => {
    const { fetch, registry } = setup();
    const result = VerifyResultSchema.parse(await executeVerify(request, registry));
    expect(result).toMatchObject({
      verdict: 'refuted',
      findings: [],
      evidence: [],
      failure: null,
      to: { provider: 'typesafe', model: 'jev-latest', provenance: 'declared' },
      decision: {
        model: 'jev-1.13.0',
        choice: 'refuted',
        confidence: 0.95,
        probabilities: answer.probabilities
      },
      usage: { inputTokens: 123, outputTokens: 0, totalTokens: null, costUsd: null }
    });
    expect(verificationExitCode(result)).toBe(10);
    const body = JSON.parse(String(fetch.mock.calls[0]?.[1]?.body));
    expect(body).toMatchObject({
      model: 'jev-latest',
      state: { claim: request.claim, context: request.context },
      questions: {
        verdict: {
          type: 'choice',
          criteria: {
            confirmed: expect.any(String),
            refuted: expect.any(String),
            unclear: expect.any(String)
          }
        }
      }
    });
    expect(body).not.toHaveProperty('prompt');
    expect(JSON.stringify(body)).not.toContain('test-secret');
    expect(summarizeForAudit(result)).not.toHaveProperty('decision');
  });

  it.each(['confirmed', 'refuted', 'unclear'] as const)(
    'maps a decisive %s without changing exit semantics',
    async (choice) => {
      const probabilities = { confirmed: 0.01, refuted: 0.01, unclear: 0.01, [choice]: 0.98 };
      const result = await executeVerify(
        request,
        setup(response({ choice, probabilities })).registry
      );
      expect(result.verdict).toBe(choice);
      expect(verificationExitCode(result)).toBe({ confirmed: 0, refuted: 10, unclear: 11 }[choice]);
    }
  );

  it.each([
    { confidence: 0.79 },
    { probabilities: { confirmed: 0.1, refuted: 0.89, unclear: 0.01 } },
    { probabilities: { confirmed: 0.5, refuted: 0.5, unclear: 0 }, confidence: 1 }
  ])('abstains on uncertain or tied decisions', async (override) => {
    const result = await executeVerify(request, setup(response(override)).registry);
    expect(result).toMatchObject({
      verdict: 'unclear',
      failure: null,
      decision: { choice: 'refuted' }
    });
    expect(verificationExitCode(result)).toBe(11);
  });

  it('honors configured thresholds including exact boundaries', async () => {
    const { registry } = setup(
      response({ confidence: 0.6, probabilities: { confirmed: 0.1, refuted: 0.8, unclear: 0.1 } }),
      { minProbability: 0.8, minConfidence: 0.6 }
    );
    expect((await executeVerify(request, registry)).verdict).toBe('refuted');
  });

  it.each([
    [0.9, 0.8, 'refuted'],
    [0.899999, 0.8, 'unclear'],
    [0.9, 0.799999, 'unclear'],
    [1, 1, 'refuted']
  ] as const)(
    'applies default boundaries at p=%s confidence=%s',
    async (p, confidence, verdict) => {
      const result = await executeVerify(
        request,
        setup(
          response({
            confidence,
            probabilities: { confirmed: 1 - p, refuted: p, unclear: 0 }
          })
        ).registry
      );
      expect(result).toMatchObject({ verdict, failure: null });
    }
  );

  it('abstains on a tied maximum even when both thresholds are zero', async () => {
    const result = await executeVerify(
      request,
      setup(
        response({
          confidence: 1,
          probabilities: { confirmed: 0.5, refuted: 0.5, unclear: 0 }
        }),
        { minProbability: 0, minConfidence: 0 }
      ).registry
    );
    expect(result).toMatchObject({
      verdict: 'unclear',
      failure: null,
      decision: { choice: 'refuted' }
    });
  });

  it.each([
    {},
    { ...response(), model: undefined },
    { ...response(), model: '' },
    { ...response(), answers: {} },
    response({ confidence: undefined }),
    response({ confidence: '0.95' }),
    response({ probabilities: { confirmed: -0.1, refuted: 1, unclear: 0.1 } }),
    response({ probabilities: { confirmed: 0, refuted: '1', unclear: 0 } }),
    { ...response(), usage: { input_tokens: -1 } }
  ])('rejects incomplete envelopes and invalid numeric metadata', async (value) => {
    const result = await executeVerify(request, setup(value).registry);
    expect(result).toMatchObject({
      verdict: 'unclear',
      failure: { code: 'INVALID_PROVIDER_RESPONSE' }
    });
    expect(result).not.toHaveProperty('decision');
  });

  it.each([undefined, {}, { input_tokens: 0 }, { output_tokens: 7 }])(
    'does not invent absent usage',
    async (usage) => {
      const result = await executeVerify(request, setup({ ...response(), usage }).registry);
      expect(result.usage).toEqual(
        usage === undefined
          ? null
          : {
              inputTokens: 'input_tokens' in usage ? usage.input_tokens : null,
              outputTokens: 'output_tokens' in usage ? usage.output_tokens : null,
              totalTokens: null,
              costUsd: null
            }
      );
    }
  );

  it.each([
    { provider: 'openai' },
    { minProbability: -0.01 },
    { minProbability: 1.01 },
    { minConfidence: -0.01 },
    { minConfidence: 1.01 },
    { endpoint: 'not-a-url' },
    { apiKeyEnvironment: 'bad variable' }
  ])('rejects invalid Jev identity and configuration', (override) => {
    expect(JevProviderConfigSchema.safeParse({ kind: 'jev', ...override }).success).toBe(false);
  });

  it.each([
    { choice: 'maybe' },
    { type: 'score' },
    { confidence: 1.1 },
    { probabilities: { confirmed: 0, refuted: 0.8, unclear: 0 } },
    { probabilities: { confirmed: 0, refuted: 1 } },
    { probabilities: { confirmed: 0.99, refuted: 0.01, unclear: 0 } },
    { probabilities: { confirmed: 0, refuted: 1, unclear: 0, surprise: 0 } }
  ])('rejects malformed or inconsistent decisions', async (override) => {
    const result = await executeVerify(request, setup(response(override)).registry);
    expect(result).toMatchObject({
      verdict: 'unclear',
      failure: { code: 'INVALID_PROVIDER_RESPONSE' }
    });
    expect(result).not.toHaveProperty('decision');
  });

  it('rejects same-provider requests and unsupported ask before fetching', async () => {
    const { fetch, registry } = setup();
    await expect(
      executeVerify({ ...request, from: { ...request.from, provider: 'typesafe' } }, registry)
    ).rejects.toMatchObject({ code: 'SAME_PROVIDER' });
    await expect(
      executeAsk(
        { to: request.to, question: 'Explain', context: '', limits: DEFAULT_LIMITS },
        registry
      )
    ).rejects.toMatchObject({ code: 'UNSUPPORTED' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('checks presence only, prefers environment auth, and never probes the evaluation endpoint', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(
      async () => new Response(JSON.stringify(response()))
    );
    const adapter = new JevAdapter({
      env: { TYPESAFE_API_KEY: 'env-secret' },
      apiKey: 'config-secret',
      fetch
    });
    expect(await adapter.probe({ network: true, timeoutMs: 100 })).toMatchObject({
      available: true,
      auth: { source: 'env' }
    });
    expect(fetch).not.toHaveBeenCalled();
    await executeVerify(request, new ProviderRegistry([adapter]));
    expect(fetch.mock.calls[0]?.[1]?.headers).toMatchObject({ authorization: 'Bearer env-secret' });
    await expect(
      executeVerify(request, new ProviderRegistry([new JevAdapter({ env: {}, fetch })]))
    ).rejects.toMatchObject({ code: 'AUTH_UNAVAILABLE' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('fails closed on input/output bounds and already-aborted signals', async () => {
    const { fetch, registry } = setup();
    expect(
      await executeVerify({ ...request, limits: { ...DEFAULT_LIMITS, maxInputBytes: 1 } }, registry)
    ).toMatchObject({ verdict: 'unclear', truncation: { input: true } });
    const controller = new AbortController();
    controller.abort();
    expect(await executeVerify(request, registry, { signal: controller.signal })).toMatchObject({
      verdict: 'unclear',
      failure: { code: 'CANCELLED' }
    });
    expect(fetch).not.toHaveBeenCalled();
    expect(
      await executeVerify(
        { ...request, limits: { ...DEFAULT_LIMITS, maxOutputBytes: 10 } },
        registry
      )
    ).toMatchObject({ verdict: 'unclear', failure: { code: 'INVALID_PROVIDER_RESPONSE' } });
  });

  it('preserves the output-truncation flag when a bounded HTTP body is invalid JSON', async () => {
    const result = await executeVerify(
      { ...request, limits: { ...DEFAULT_LIMITS, maxOutputBytes: 10 } },
      setup().registry
    );
    expect(result).toMatchObject({
      verdict: 'unclear',
      truncation: { input: false, output: true },
      failure: { code: 'INVALID_PROVIDER_RESPONSE' }
    });
    expect(verificationExitCode(result)).toBe(6);
  });

  it.each([401, 403])(
    'surfaces HTTP %s as an auth error without leaking the response',
    async (status) => {
      const fetch = vi.fn<typeof globalThis.fetch>(
        async () => new Response('private body secret', { status })
      );
      const registry = new ProviderRegistry([
        new JevAdapter({ env: { TYPESAFE_API_KEY: 'fixture' }, fetch })
      ]);
      await expect(executeVerify(request, registry)).rejects.toMatchObject({
        code: 'AUTH_UNAVAILABLE',
        message: 'Provider rejected authentication'
      });
      expect(fetch).toHaveBeenCalledTimes(1);
    }
  );

  it.each([
    [400, false],
    [422, false],
    [408, true],
    [409, true],
    [500, true],
    [503, true]
  ] as const)(
    'classifies HTTP %s retryability without automatically retrying',
    async (status, retryable) => {
      const fetch = vi.fn<typeof globalThis.fetch>(
        async () => new Response('private body', { status })
      );
      const registry = new ProviderRegistry([
        new JevAdapter({ env: { TYPESAFE_API_KEY: 'fixture' }, fetch })
      ]);
      const result = await executeVerify(request, registry);
      expect(result).toMatchObject({
        verdict: 'unclear',
        failure: { code: 'PROVIDER_FAILURE', retryable }
      });
      expect(verificationExitCode(result)).toBe(5);
      expect(JSON.stringify(result)).not.toContain('private body');
      expect(fetch).toHaveBeenCalledTimes(1);
    }
  );

  it.each(['', 'not JSON', '{"answers":'])(
    'rejects invalid JSON without treating it as a semantic judgment',
    async (body) => {
      const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response(body));
      const result = await executeVerify(
        request,
        new ProviderRegistry([new JevAdapter({ env: { TYPESAFE_API_KEY: 'fixture' }, fetch })])
      );
      expect(result).toMatchObject({
        verdict: 'unclear',
        truncation: { output: false },
        failure: { code: 'INVALID_PROVIDER_RESPONSE' }
      });
      expect(result).not.toHaveProperty('decision');
    }
  );

  it('redacts network exception text and does not retry', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => {
      throw new Error('secret key and private evidence');
    });
    const result = await executeVerify(
      request,
      new ProviderRegistry([new JevAdapter({ env: { TYPESAFE_API_KEY: 'fixture' }, fetch })])
    );
    expect(result).toMatchObject({
      verdict: 'unclear',
      failure: { code: 'PROVIDER_FAILURE', retryable: true }
    });
    expect(JSON.stringify(result)).not.toContain('secret key');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('rejects unknown authors and raw requests before making a call', async () => {
    const { fetch, adapter, registry } = setup();
    await expect(
      executeVerify({ ...request, from: { ...request.from, provenance: 'unknown' } }, registry)
    ).rejects.toMatchObject({ code: 'PROVENANCE_UNPROVABLE' });
    await expect(
      adapter.invoke(
        {
          operation: 'request',
          model: 'jev-latest',
          prompt: 'raw request',
          limits: DEFAULT_LIMITS
        },
        new AbortController().signal
      )
    ).rejects.toMatchObject({ code: 'UNSUPPORTED' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([429, 529])(
    'preserves retryable HTTP %s failures without provider body leakage',
    async (status) => {
      const fetch = vi.fn<typeof globalThis.fetch>(
        async () => new Response('private provider body', { status })
      );
      const result = await executeVerify(
        request,
        new ProviderRegistry([new JevAdapter({ env: { TYPESAFE_API_KEY: 'secret' }, fetch })])
      );
      expect(result).toMatchObject({
        verdict: 'unclear',
        failure: { code: 'PROVIDER_FAILURE', retryable: true }
      });
      expect(JSON.stringify(result)).not.toContain('private provider body');
      expect(fetch).toHaveBeenCalledTimes(1);
    }
  );

  it('cancels an in-flight HTTP evaluation and distinguishes timeout', async () => {
    const fetch: typeof globalThis.fetch = async (_url, init) =>
      await new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
      });
    const registry = new ProviderRegistry([
      new JevAdapter({ env: { TYPESAFE_API_KEY: 'fixture' }, fetch })
    ]);
    const result = await executeVerify(
      { ...request, limits: { ...DEFAULT_LIMITS, timeoutMs: 20 } },
      registry
    );
    expect(result).toMatchObject({ verdict: 'unclear', failure: { code: 'TIMEOUT' } });
    const controller = new AbortController();
    const pending = executeVerify(request, registry, { signal: controller.signal });
    controller.abort();
    expect(await pending).toMatchObject({ verdict: 'unclear', failure: { code: 'CANCELLED' } });
  });

  it('resolves --to jev through the default config and rejects alias self-verification', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'xerify-jev-cli-'));
    const { fetch } = setup();
    vi.stubGlobal('fetch', fetch);
    let stdout = '';
    const dependencies = {
      cwd,
      env: {
        TYPESAFE_API_KEY: 'test-secret',
        XERIFY_USER_CONFIG_PATH: path.join(cwd, 'absent.json')
      },
      stdin: stdinFromString(request.context),
      stdinIsTTY: false,
      writer: {
        stdout: (v: string) => {
          stdout += v;
        },
        stderr: () => {}
      }
    };
    try {
      const code = await runCli(
        [
          '--json',
          '--timeout',
          '0',
          'verify',
          '--from',
          'openai:author',
          '--to',
          'jev',
          '--claim',
          request.claim
        ],
        dependencies
      );
      expect(code).toBe(10);
      expect(JSON.parse(stdout).data.to.provider).toBe('typesafe');
      stdout = '';
      expect(
        await runCli(
          ['--json', 'verify', '--from', 'jev:old', '--to', 'typesafe:jev-latest', '--claim', 'x'],
          { ...dependencies, stdinIsTTY: true }
        )
      ).toBe(2);
      expect(JSON.parse(stdout).error.code).toBe('SAME_PROVIDER');
      expect(fetch).toHaveBeenCalledTimes(1);
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it.each([
    ['confirmed', 0.95, 200, 0, 'confirmed'],
    ['refuted', 0.95, 200, 10, 'refuted'],
    ['unclear', 0.95, 200, 11, 'unclear'],
    ['refuted', 0.79, 200, 11, 'unclear'],
    ['refuted', 0.95, 401, 3, null],
    ['refuted', 0.95, 429, 5, 'unclear']
  ] as const)(
    'preserves CLI exits for choice=%s confidence=%s HTTP=%s',
    async (choice, confidence, status, expectedExit, verdict) => {
      const cwd = await mkdtemp(path.join(os.tmpdir(), 'xerify-jev-exits-'));
      const fetch = vi.fn<typeof globalThis.fetch>(
        async () =>
          new Response(
            JSON.stringify(
              response({
                choice,
                confidence,
                probabilities: { confirmed: 0.01, refuted: 0.01, unclear: 0.01, [choice]: 0.98 }
              })
            ),
            { status }
          )
      );
      vi.stubGlobal('fetch', fetch);
      let stdout = '';
      try {
        const exit = await runCli(
          [
            '--json',
            'verify',
            '--from',
            'openai:author',
            '--to',
            'jev:jev-1.13.0',
            '--claim',
            request.claim
          ],
          {
            cwd,
            env: {
              TYPESAFE_API_KEY: 'fixture',
              XERIFY_USER_CONFIG_PATH: path.join(cwd, 'absent.json')
            },
            stdin: stdinFromString(request.context),
            stdinIsTTY: false,
            writer: {
              stdout: (v) => {
                stdout += v;
              },
              stderr: () => {}
            }
          }
        );
        expect(exit).toBe(expectedExit);
        const envelope = JSON.parse(stdout);
        if (verdict === null)
          expect(envelope).toMatchObject({ ok: false, error: { code: 'AUTH_UNAVAILABLE' } });
        else
          expect(envelope.data).toMatchObject({
            verdict,
            to: { provider: 'typesafe', model: 'jev-1.13.0' }
          });
        expect(stdout).not.toContain('fixture');
        expect(fetch).toHaveBeenCalledTimes(1);
      } finally {
        await rm(cwd, { recursive: true, force: true });
      }
    }
  );
});
