import { z } from 'zod';

/**
 * Standard error response schema used for OpenAPI documentation
 */
export const ErrorResponse = z.object({
  type: z.enum([
    'validation',
    'authentication',
    'forbidden',
    'not_found',
    'rate_limit',
    'internal',
  ]),
  code: z.string(),
  message: z.string(),
  param: z.string().optional(),
  details: z.any().optional(),
});

export type ErrorResponseType = z.infer<typeof ErrorResponse>;

/**
 * Standardized error codes for the API
 */
export const ErrorCodes = {
  // Validation errors (400)
  Validation: {
    INVALID_PARAMETER: 'invalid_parameter',
    MISSING_REQUIRED_FIELD: 'missing_required_field',
    INVALID_FORMAT: 'invalid_format',
    ALREADY_EXISTS: 'already_exists',
    IN_USE: 'resource_in_use',
    INVALID_STATE: 'invalid_state',
  },

  // Authentication errors (401)
  Authentication: {
    UNAUTHORIZED: 'unauthorized',
    INVALID_TOKEN: 'invalid_token',
    EXPIRED_TOKEN: 'expired_token',
    INVALID_CREDENTIALS: 'invalid_credentials',
  },

  // Permission errors (403)
  Permission: {
    FORBIDDEN: 'forbidden',
    INSUFFICIENT_PERMISSIONS: 'insufficient_permissions',
    ACCOUNT_RESTRICTED: 'account_restricted',
  },

  // Resource not found errors (404)
  NotFound: {
    RESOURCE_NOT_FOUND: 'resource_not_found',
  },

  // Rate limit errors (429)
  RateLimit: {
    TOO_MANY_REQUESTS: 'too_many_requests',
    QUOTA_EXCEEDED: 'quota_exceeded',
  },

  // Server errors (500)
  Server: {
    INTERNAL_ERROR: 'internal_error',
    SERVICE_UNAVAILABLE: 'service_unavailable',
    DEPENDENCY_FAILURE: 'dependency_failure',
  },
};

/**
 * Standard error that will be exposed to clients through API responses
 */
export class VisibleError extends Error {
  constructor(
    public type: ErrorResponseType['type'],
    public code: string,
    public message: string,
    public param?: string,
    // biome-ignore lint/suspicious/noExplicitAny: valid any
    public details?: any,
  ) {
    super(message);
  }

  /**
   * Convert this error to an HTTP status code
   */
  public statusCode(): number {
    switch (this.type) {
      case 'validation':
        return 400;
      case 'authentication':
        return 401;
      case 'forbidden':
        return 403;
      case 'not_found':
        return 404;
      case 'rate_limit':
        return 429;
      case 'internal':
        return 500;
      default:
        return 500;
    }
  }

  /**
   * Convert this error to a standard response object
   */
  public toResponse(): ErrorResponseType {
    const response: ErrorResponseType = {
      type: this.type,
      code: this.code,
      message: this.message,
    };

    if (this.param) response.param = this.param;
    if (this.details) response.details = this.details;

    return response;
  }
}

// CHAT SPECIFIC ERRORS
export type ErrorType =
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'rate_limit'
  | 'offline';

export type Surface =
  | 'chat'
  | 'auth'
  | 'api'
  | 'stream'
  | 'database'
  | 'history'
  | 'vote'
  | 'document'
  | 'suggestions';

export type ErrorCode = `${ErrorType}:${Surface}`;

export type ErrorVisibility = 'response' | 'log' | 'none';

export const visibilityBySurface: Record<Surface, ErrorVisibility> = {
  database: 'log',
  chat: 'response',
  auth: 'response',
  stream: 'response',
  api: 'response',
  history: 'response',
  vote: 'response',
  document: 'response',
  suggestions: 'response',
};

export class ChatSDKError extends Error {
  public type: ErrorType;
  public surface: Surface;
  public statusCode: number;

  constructor(errorCode: ErrorCode, cause?: string) {
    super();

    const [type, surface] = errorCode.split(':');

    this.type = type as ErrorType;
    this.cause = cause;
    this.surface = surface as Surface;
    this.message = getMessageByErrorCode(errorCode);
    this.statusCode = getStatusCodeByType(this.type);
  }

  public toResponse() {
    const code: ErrorCode = `${this.type}:${this.surface}`;
    const visibility = visibilityBySurface[this.surface];

    const { message, cause, statusCode } = this;

    if (visibility === 'log') {
      console.error({
        code,
        message,
        cause,
      });

      return Response.json(
        { code: '', message: 'Something went wrong. Please try again later.' },
        { status: statusCode },
      );
    }

    return Response.json({ code, message, cause }, { status: statusCode });
  }
}

export function getMessageByErrorCode(errorCode: ErrorCode): string {
  if (errorCode.includes('database')) {
    return 'An error occurred while executing a database query.';
  }

  switch (errorCode) {
    case 'bad_request:api':
      return "The request couldn't be processed. Please check your input and try again.";

    case 'unauthorized:auth':
      return 'You need to sign in before continuing.';
    case 'forbidden:auth':
      return 'Your account does not have access to this feature.';

    case 'rate_limit:chat':
      return 'You have exceeded your maximum number of messages for the day. Please try again later.';
    case 'not_found:chat':
      return 'The requested chat was not found. Please check the chat ID and try again.';
    case 'forbidden:chat':
      return 'This chat belongs to another user. Please check the chat ID and try again.';
    case 'unauthorized:chat':
      return 'You need to sign in to view this chat. Please sign in and try again.';
    case 'offline:chat':
      return "We're having trouble sending your message. Please check your internet connection and try again.";

    case 'not_found:document':
      return 'The requested document was not found. Please check the document ID and try again.';
    case 'forbidden:document':
      return 'This document belongs to another user. Please check the document ID and try again.';
    case 'unauthorized:document':
      return 'You need to sign in to view this document. Please sign in and try again.';
    case 'bad_request:document':
      return 'The request to create or update the document was invalid. Please check your input and try again.';

    default:
      return 'Something went wrong. Please try again later.';
  }
}

function getStatusCodeByType(type: ErrorType) {
  switch (type) {
    case 'bad_request':
      return 400;
    case 'unauthorized':
      return 401;
    case 'forbidden':
      return 403;
    case 'not_found':
      return 404;
    case 'rate_limit':
      return 429;
    case 'offline':
      return 503;
    default:
      return 500;
  }
}

/**
 * Type for database errors that may contain PostgreSQL-specific properties
 */
export interface DatabaseError extends Error {
  code?: string;
  detail?: string;
  constraint?: string;
}
