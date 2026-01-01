/**
 * HTTP Request Types
 *
 * HTTP request representation for OAuth2/OIDC flow visualization
 *
 * @remarks
 * Captures all information about HTTP requests made during OAuth2/OIDC flows
 * for debugging and educational purposes.
 */

import type { Timestamp, UUID, URL } from '../utils';
import type { HttpHeaders } from './headers';

/**
 * HTTP request representation
 *
 * Captures all information about an HTTP request made during OAuth2/OIDC flows
 *
 * @example
 * ```typescript
 * const request: HttpRequest = {
 *   id: 'req-550e8400-e29b-41d4-a716-446655440000',
 *   method: HttpMethod.POST,
 *   url: 'https://auth.example.com/token',
 *   headers: {
 *     'Content-Type': 'application/x-www-form-urlencoded',
 *     'Authorization': 'Basic Y2xpZW50OnNlY3JldA=='
 *   },
 *   body: {
 *     type: 'form',
 *     parameters: {
 *       grant_type: 'authorization_code',
 *       code: 'SplxlOBeZQQYbYS6WxSbIA'
 *     },
 *     raw: 'grant_type=authorization_code&code=SplxlOBeZQQYbYS6WxSbIA'
 *   },
 *   sentAt: '2025-12-30T10:30:00.000Z'
 * };
 * ```
 */
export interface HttpRequest {
  /** Unique ID for this request (UUID) */
  readonly id: UUID;

  /** HTTP method */
  readonly method: HttpMethod;

  /** Full URL including query parameters */
  readonly url: URL;

  /** Request headers */
  readonly headers: HttpHeaders;

  /** Request body (if applicable) */
  readonly body?: HttpRequestBody;

  /** Timestamp when request was sent (ISO 8601) */
  readonly sentAt: Timestamp;

  /** Request duration in milliseconds (if completed) */
  duration?: number;

  /** cURL equivalent of this request (for debugging) */
  readonly curlCommand?: string;
}

/**
 * HTTP methods
 *
 * Standard HTTP request methods used in OAuth2/OIDC
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  OPTIONS = 'OPTIONS',
  HEAD = 'HEAD',
}

/**
 * HTTP request body
 *
 * Discriminated union for different request body types
 *
 * @remarks
 * OAuth2/OIDC requests typically use:
 * - Form-encoded: Token endpoint requests (application/x-www-form-urlencoded)
 * - JSON: Modern APIs (application/json)
 * - Text: Raw text data
 * - Binary: File uploads, binary data
 */
export type HttpRequestBody = FormEncodedBody | JsonBody | TextBody | BinaryBody;

/**
 * Form-encoded request body (application/x-www-form-urlencoded)
 *
 * Used by OAuth2 token endpoint (RFC 6749 §4.1.3)
 *
 * @example
 * ```typescript
 * const formBody: FormEncodedBody = {
 *   type: 'form',
 *   parameters: {
 *     grant_type: 'authorization_code',
 *     code: 'SplxlOBeZQQYbYS6WxSbIA',
 *     redirect_uri: 'https://app.example.com/callback'
 *   },
 *   raw: 'grant_type=authorization_code&code=SplxlOBeZQQYbYS6WxSbIA&redirect_uri=https%3A%2F%2Fapp.example.com%2Fcallback'
 * };
 * ```
 */
export interface FormEncodedBody {
  /** Discriminator */
  type: 'form';

  /** Parsed form parameters */
  parameters: Record<string, string>;

  /** Raw URL-encoded string */
  raw: string;
}

/**
 * JSON request body (application/json)
 *
 * @example
 * ```typescript
 * const jsonBody: JsonBody = {
 *   type: 'json',
 *   data: {
 *     username: 'john.doe',
 *     password: 'secret'
 *   },
 *   raw: '{"username":"john.doe","password":"secret"}'
 * };
 * ```
 */
export interface JsonBody {
  /** Discriminator */
  type: 'json';

  /** Parsed JSON data */
  data: unknown;

  /** Raw JSON string */
  raw: string;
}

/**
 * Plain text request body
 *
 * @example
 * ```typescript
 * const textBody: TextBody = {
 *   type: 'text',
 *   content: 'Plain text content'
 * };
 * ```
 */
export interface TextBody {
  /** Discriminator */
  type: 'text';

  /** Text content */
  content: string;
}

/**
 * Binary request body
 *
 * @example
 * ```typescript
 * const binaryBody: BinaryBody = {
 *   type: 'binary',
 *   data: new ArrayBuffer(1024),
 *   contentType: 'application/octet-stream'
 * };
 * ```
 */
export interface BinaryBody {
  /** Discriminator */
  type: 'binary';

  /** Binary data */
  data: ArrayBuffer;

  /** Content type of binary data */
  contentType: string;
}
