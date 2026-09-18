import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('Jev live scenario gate', () => {
  it('previews all ten synthetic cases without a build, key, or network', () => {
    const result = spawnSync(process.execPath, ['scripts/live-jev-scenarios.mjs'], {
      encoding: 'utf8',
      env: {}
    });
    expect(result.status).toBe(0);
    const preview = JSON.parse(result.stdout);
    expect(preview).toMatchObject({ mode: 'preview', maxCalls: 10, model: 'jev-1.13.0' });
    expect(new Set(preview.scenarios.map((s: { id: string }) => s.id)).size).toBe(10);
  });

  it('refuses live execution without explicit billable acknowledgement', () => {
    const result = spawnSync(process.execPath, ['scripts/live-jev-scenarios.mjs', '--live'], {
      encoding: 'utf8',
      env: {}
    });
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('no calls made');
  });

  it('refuses acknowledged live execution without a key', () => {
    const result = spawnSync(process.execPath, ['scripts/live-jev-scenarios.mjs', '--live'], {
      encoding: 'utf8',
      env: { XERIFY_LIVE_CONFIRM_BILLABLE: 'YES' }
    });
    expect(result.status).toBe(3);
    expect(result.stderr).toContain('no calls made');
  });
});
