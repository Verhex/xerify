import { setTimeout as delay } from 'node:timers/promises';
import { describe, expect, it } from 'vitest';
import { RequestLimitsSchema, DEFAULT_LIMITS } from '../../src/core/contracts.js';
import { runProcess } from '../../src/process/spawn.js';
import { postJson } from '../../src/providers/http.js';

describe('explicit no-deadline invocations', () => {
  it('accepts zero, rejects negative deadlines, and keeps byte bounds positive', () => {
    expect(RequestLimitsSchema.safeParse({ ...DEFAULT_LIMITS, timeoutMs: 0 }).success).toBe(true);
    expect(RequestLimitsSchema.safeParse({ ...DEFAULT_LIMITS, timeoutMs: -1 }).success).toBe(false);
    expect(RequestLimitsSchema.safeParse({ ...DEFAULT_LIMITS, maxInputBytes: 0 }).success).toBe(
      false
    );
  });

  it('lets a delayed subprocess finish with zero deadline', async () => {
    const result = await runProcess(
      {
        executable: process.execPath,
        args: ['-e', 'setTimeout(()=>console.log("finished"),40)'],
        stdin: '',
        env: {},
        timeoutMs: 0,
        maxInputBytes: 1024,
        maxOutputBytes: 1024
      },
      new AbortController().signal
    );
    expect(result).toMatchObject({ exitCode: 0, stdout: 'finished\n' });
  });

  it('still cancels a running subprocess with zero deadline', async () => {
    const controller = new AbortController();
    const result = runProcess(
      {
        executable: process.execPath,
        args: ['-e', 'setInterval(()=>{},1000)'],
        stdin: '',
        env: {},
        timeoutMs: 0,
        maxInputBytes: 1024,
        maxOutputBytes: 1024
      },
      controller.signal
    );
    const assertion = expect(result).rejects.toMatchObject({ code: 'CANCELLED' });
    await delay(40);
    controller.abort();
    await assertion;
  });

  it('allows a delayed HTTP response and still propagates cancellation', async () => {
    const options = {
      endpoint: 'https://fixture.invalid',
      headers: {},
      body: {},
      timeoutMs: 0,
      maxOutputBytes: 1024,
      fetch: (async (_url, init) => {
        await delay(40, undefined, { signal: init?.signal ?? undefined });
        return new Response('{"ok":true}');
      }) as typeof fetch
    };
    expect(await postJson(options, new AbortController().signal)).toMatchObject({
      data: { ok: true }
    });
    const controller = new AbortController();
    const pending = postJson(options, controller.signal);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ code: 'CANCELLED' });
  });
});
