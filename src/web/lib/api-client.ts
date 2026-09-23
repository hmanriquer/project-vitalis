import ky, { HTTPError } from 'ky';
import { type ApiErrorBody, apiErrorSchema } from '@/shared/api-error';

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(body: ApiErrorBody['error'], status: number) {
    super(body.message);
    this.name = 'ApiError';
    this.code = body.code;
    this.status = status;
    this.details = body.details;
  }
}

export const apiClient = ky.create({
  prefix: '/api',
  credentials: 'include',
  hooks: {
    beforeError: [
      async ({ error }) => {
        if (error instanceof HTTPError && error.response) {
          try {
            const json: unknown = await error.response.clone().json();
            const parsed = apiErrorSchema.safeParse(json);
            if (parsed.success) {
              throw new ApiError(parsed.data.error, error.response.status);
            }
          } catch (inner) {
            if (inner instanceof ApiError) {
              throw inner;
            }
          }
        }
        return error;
      },
    ],
  },
});

/** Test hook: parse a Response through the same logic as beforeError. */
export async function parseApiErrorResponse(response: Response): Promise<ApiError | null> {
  try {
    const json: unknown = await response.json();
    const parsed = apiErrorSchema.safeParse(json);
    if (parsed.success) {
      return new ApiError(parsed.data.error, response.status);
    }
  } catch {
    return null;
  }
  return null;
}
