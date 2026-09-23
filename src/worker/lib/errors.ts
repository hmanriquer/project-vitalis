import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { ApiErrorBody } from '@/shared/api-error';

export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: string, message: string, status = 400, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function notFound(): never {
  throw new HTTPException(404, { message: 'Not Found' });
}

export function onError(err: Error, c: Context): Response {
  if (err instanceof AppError) {
    const body: ApiErrorBody = {
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    };
    return c.json(body, err.status as ContentfulStatusCode);
  }

  if (err instanceof HTTPException) {
    const body: ApiErrorBody = {
      error: {
        code: 'not_found',
        message: err.message || 'Not Found',
      },
    };
    return c.json(body, err.status);
  }

  console.error(err);
  const body: ApiErrorBody = {
    error: {
      code: 'internal_error',
      message: 'Error interno del servidor',
    },
  };
  return c.json(body, 500);
}
