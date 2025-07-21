export interface ApiError {
  code: string
  message: string
  statusCode?: number
  details?: any
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  message?: string
}

export function apiSuccess<T> (data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message
  };
}

export function apiError (
  code: string,
  message: string,
  statusCode: number = 400,
  details?: any
): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message,
      statusCode,
      details
    }
  };
}

export const ErrorCodes = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_INPUT: 'INVALID_INPUT',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // External service errors
  NOTION_API_ERROR: 'NOTION_API_ERROR',
  STRIPE_API_ERROR: 'STRIPE_API_ERROR',
  SUPABASE_ERROR: 'SUPABASE_ERROR',

  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Subscription errors
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
  TIER_LIMIT_EXCEEDED: 'TIER_LIMIT_EXCEEDED'
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes]
