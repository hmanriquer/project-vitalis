import { env, SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import { apiErrorSchema } from '@/shared/api-error';
import { createApp } from '@/worker/app';
import { createFakeClock } from '@/worker/services';

describe('worker app', () => {
  it('GET /api/health returns ok', async () => {
    const response = await SELF.fetch('https://example.com/api/health');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'ok' });
  });

  it('unknown /api route returns 404 envelope', async () => {
    const response = await SELF.fetch('https://example.com/api/does-not-exist');
    expect(response.status).toBe(404);
    const body = apiErrorSchema.parse(await response.json());
    expect(body.error.code).toBe('not_found');
  });

  it('AppError maps to status and code', async () => {
    const response = await SELF.fetch('https://example.com/api/_test/app-error');
    expect(response.status).toBe(418);
    const body = apiErrorSchema.parse(await response.json());
    expect(body.error.code).toBe('test_error');
  });

  it('createApp accepts service overrides', async () => {
    const fixed = new Date('2026-01-15T12:00:00.000Z');
    const app = createApp({ clock: createFakeClock(fixed) });
    const response = await app.fetch(
      new Request('https://example.com/api/_test/clock'),
      env,
      {} as ExecutionContext,
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ iso: fixed.toISOString() });
  });
});
