import type { H3Event } from 'h3';
import { createError } from 'h3';
import type { ApiResponse, ApiError, ErrorCode } from '~/lib/api-response';
import { apiSuccess as clientApiSuccess, apiError as clientApiError, ErrorCodes } from '~/lib/api-response';

export { ErrorCodes, type ErrorCode, type ApiResponse, type ApiError };

export function sendSuccess<T> (event: H3Event, data: T, message?: string): ApiResponse<T> {
  const response = clientApiSuccess(data, message);
  setResponseStatus(event, 200);
  return response;
}

export function sendError (
  event: H3Event,
  code: ErrorCode,
  message: string,
  statusCode: number = 400,
  details?: any
): never {
  const response = clientApiError(code, message, statusCode, details);
  throw createError({
    statusCode,
    statusMessage: message,
    data: response.error
  });
}

export function handleError (event: H3Event, error: any): never {
  console.error('[API Error]', error);

  // If it's already a formatted H3 error, re-throw it
  if (error.statusCode && error.data?.code) {
    throw error;
  }

  // Handle Supabase errors
  if (error.code && error.message) {
    const statusCode = error.status || 400;
    sendError(event, ErrorCodes.SUPABASE_ERROR, error.message, statusCode, {
      code: error.code
    });
  }

  // Handle generic errors
  sendError(
    event,
    ErrorCodes.INTERNAL_ERROR,
    'An unexpected error occurred',
    500,
    process.env.NODE_ENV === 'development' ? { originalError: error.message } : undefined
  );
}

export async function requireAuth (event: H3Event): Promise<string> {
  const user = event.context.user;

  if (!user?.id) {
    sendError(event, ErrorCodes.UNAUTHORIZED, 'Authentication required', 401);
  }

  return user.id;
}

export async function validateBody<T> (
  event: H3Event,
  schema: {
    parse: (data: any) => T
  }
): Promise<T> {
  try {
    const body = await readBody(event);
    return schema.parse(body);
  } catch (error: any) {
    sendError(
      event,
      ErrorCodes.VALIDATION_ERROR,
      'Invalid request body',
      400,
      error.errors || error.message
    );
  }
}
