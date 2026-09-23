import { describe, expect, it } from 'vitest';
import { ApiError, parseApiErrorResponse } from '@/web/lib/api-client';

describe('parseApiErrorResponse', () => {
  it('parses the shared API error envelope', async () => {
    const response = new Response(
      JSON.stringify({
        error: { code: 'stock_short', message: 'Sin stock', details: { sku: 'x' } },
      }),
      { status: 409, headers: { 'Content-Type': 'application/json' } },
    );
    const err = await parseApiErrorResponse(response);
    expect(err).toBeInstanceOf(ApiError);
    expect(err?.code).toBe('stock_short');
    expect(err?.status).toBe(409);
    expect(err?.details).toEqual({ sku: 'x' });
  });
});
