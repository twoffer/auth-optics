/**
 * HTTP Response Types
 *
 * HTTP response representation for OAuth2/OIDC flow visualization
 *
 * @remarks
 * Captures all information about HTTP responses received during OAuth2/OIDC flows
 * for debugging and educational purposes.
 */

import type { Timestamp, UUID } from '../utils';
import type { HttpHeaders } from './headers';

/**
 * HTTP response representation
 *
 * @example
 * ```typescript
 * const response: HttpResponse = {
 *   id: 'res-550e8400-e29b-41d4-a716-446655440000',
 *   requestId: 'req-550e8400-e29b-41d4-a716-446655440000',
 *   statusCode: 200,
 *   statusText: 'OK',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'Cache-Control': 'no-store'
 *   },
 *   body: {
 *     type: 'json',
 *     data: {
 *       access_token: 'eyJhbGc...',
 *       token_type: 'Bearer',
 *       expires_in: 3600
 *     },
 *     raw: '{"access_token":"eyJhbGc...","token_type":"Bearer","expires_in":3600}'
 *   },
 *   receivedAt: '2025-12-30T10:30:01.500Z',
 *   size: 512
 * };
 * ```
 */
export interface HttpResponse {
  /** Unique ID for this response (UUID) */
  readonly id: UUID;

  /** Corresponding request ID (for correlation) */
  readonly requestId: UUID;

  /** HTTP status code */
  readonly statusCode: number;

  /** HTTP status text (e.g., "OK", "Bad Request") */
  readonly statusText: string;

  /** Response headers */
  readonly headers: HttpHeaders;

  /** Response body (if applicable) */
  readonly body?: HttpResponseBody;

  /** Timestamp when response was received (ISO 8601) */
  readonly receivedAt: Timestamp;

  /** Response size in bytes */
  readonly size?: number;
}

/**
 * HTTP response body
 *
 * Discriminated union for different response body types
 *
 * @remarks
 * OAuth2/OIDC responses typically use:
 * - JSON: Token endpoint responses, error responses
 * - HTML: Authorization endpoint (login pages)
 * - Text: Plain text errors
 * - Binary: File downloads, images
 */
export type HttpResponseBody =
  | JsonResponseBody
  | TextResponseBody
  | HtmlResponseBody
  | BinaryResponseBody;

/**
 * JSON response body
 *
 * Used by OAuth2 token endpoint and APIs
 *
 * @example
 * ```typescript
 * const jsonResponse: JsonResponseBody = {
 *   type: 'json',
 *   data: {
 *     access_token: 'eyJhbGc...',
 *     token_type: 'Bearer',
 *     expires_in: 3600
 *   },
 *   raw: '{"access_token":"eyJhbGc...","token_type":"Bearer","expires_in":3600}'
 * };
 * ```
 */
export interface JsonResponseBody {
  /** Discriminator */
  type: 'json';

  /** Parsed JSON data */
  data: unknown;

  /** Raw JSON string */
  raw: string;
}

/**
 * Plain text response body
 *
 * @example
 * ```typescript
 * const textResponse: TextResponseBody = {
 *   type: 'text',
 *   content: 'Error: Invalid request'
 * };
 * ```
 */
export interface TextResponseBody {
  /** Discriminator */
  type: 'text';

  /** Text content */
  content: string;
}

/**
 * HTML response body
 *
 * Used by authorization endpoints for login pages
 *
 * @example
 * ```typescript
 * const htmlResponse: HtmlResponseBody = {
 *   type: 'html',
 *   html: '<!DOCTYPE html><html>...</html>'
 * };
 * ```
 */
export interface HtmlResponseBody {
  /** Discriminator */
  type: 'html';

  /** HTML content */
  html: string;
}

/**
 * Binary response body
 *
 * @example
 * ```typescript
 * const binaryResponse: BinaryResponseBody = {
 *   type: 'binary',
 *   data: new ArrayBuffer(1024),
 *   contentType: 'image/png'
 * };
 * ```
 */
export interface BinaryResponseBody {
  /** Discriminator */
  type: 'binary';

  /** Binary data */
  data: ArrayBuffer;

  /** Content type of binary data */
  contentType: string;
}

/**
 * HTTP status code categories
 *
 * Categorizes HTTP status codes by their first digit
 */
export enum HttpStatusCategory {
  /** 1xx: Informational responses */
  INFORMATIONAL = '1xx',

  /** 2xx: Successful responses */
  SUCCESS = '2xx',

  /** 3xx: Redirection messages */
  REDIRECTION = '3xx',

  /** 4xx: Client error responses */
  CLIENT_ERROR = '4xx',

  /** 5xx: Server error responses */
  SERVER_ERROR = '5xx',
}

/**
 * Get status category from status code
 *
 * @param statusCode - HTTP status code (100-599)
 * @returns Category enum value
 *
 * @example
 * ```typescript
 * getStatusCategory(200); // HttpStatusCategory.SUCCESS
 * getStatusCategory(404); // HttpStatusCategory.CLIENT_ERROR
 * getStatusCategory(500); // HttpStatusCategory.SERVER_ERROR
 * ```
 */
export function getStatusCategory(statusCode: number): HttpStatusCategory {
  if (statusCode >= 100 && statusCode < 200) return HttpStatusCategory.INFORMATIONAL;
  if (statusCode >= 200 && statusCode < 300) return HttpStatusCategory.SUCCESS;
  if (statusCode >= 300 && statusCode < 400) return HttpStatusCategory.REDIRECTION;
  if (statusCode >= 400 && statusCode < 500) return HttpStatusCategory.CLIENT_ERROR;
  return HttpStatusCategory.SERVER_ERROR;
}
