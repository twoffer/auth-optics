/**
 * HTTP Headers Types
 *
 * HTTP header definitions and constants
 *
 * @remarks
 * Provides type-safe header definitions and common HTTP header constants
 * used in OAuth2/OIDC flows.
 */

/**
 * HTTP headers
 *
 * @remarks
 * Case-insensitive header name to value mapping.
 * Values can be single strings or arrays for multi-value headers.
 *
 * @example
 * ```typescript
 * const headers: HttpHeaders = {
 *   'Content-Type': 'application/json',
 *   'Accept': ['application/json', 'application/xml'],
 *   'Authorization': 'Bearer eyJhbGc...'
 * };
 * ```
 */
export type HttpHeaders = Record<string, string | string[]>;

/**
 * Common HTTP header names
 *
 * @remarks
 * Standard header names used in OAuth2/OIDC flows.
 * Provides type-safe constants to avoid typos.
 *
 * @example
 * ```typescript
 * const headers: HttpHeaders = {
 *   [CommonHeaders.CONTENT_TYPE]: ContentTypes.JSON,
 *   [CommonHeaders.AUTHORIZATION]: `Bearer ${token}`
 * };
 * ```
 */
export const CommonHeaders = {
  // ========================================
  // Request Headers
  // ========================================

  /** Authorization: Bearer token or Basic auth */
  AUTHORIZATION: 'Authorization',

  /** Content-Type: Media type of request body */
  CONTENT_TYPE: 'Content-Type',

  /** Accept: Media types client can process */
  ACCEPT: 'Accept',

  /** User-Agent: Client application identifier */
  USER_AGENT: 'User-Agent',

  /** Referer: Previous page URL */
  REFERER: 'Referer',

  /** Origin: Request origin for CORS */
  ORIGIN: 'Origin',

  // ========================================
  // Response Headers
  // ========================================

  /** Content-Length: Size of response body in bytes */
  CONTENT_LENGTH: 'Content-Length',

  /** Cache-Control: Caching directives */
  CACHE_CONTROL: 'Cache-Control',

  /** Set-Cookie: Set HTTP cookie */
  SET_COOKIE: 'Set-Cookie',

  /** Location: Redirect target URL */
  LOCATION: 'Location',

  /** WWW-Authenticate: Authentication method required */
  WWW_AUTHENTICATE: 'WWW-Authenticate',

  // ========================================
  // Security Headers
  // ========================================

  /** Strict-Transport-Security: HSTS header */
  STRICT_TRANSPORT_SECURITY: 'Strict-Transport-Security',

  /** X-Frame-Options: Clickjacking protection */
  X_FRAME_OPTIONS: 'X-Frame-Options',

  /** X-Content-Type-Options: MIME sniffing protection */
  X_CONTENT_TYPE_OPTIONS: 'X-Content-Type-Options',

  /** Content-Security-Policy: CSP directives */
  CONTENT_SECURITY_POLICY: 'Content-Security-Policy',

  // ========================================
  // CORS Headers
  // ========================================

  /** Access-Control-Allow-Origin: Allowed origins for CORS */
  ACCESS_CONTROL_ALLOW_ORIGIN: 'Access-Control-Allow-Origin',

  /** Access-Control-Allow-Methods: Allowed HTTP methods for CORS */
  ACCESS_CONTROL_ALLOW_METHODS: 'Access-Control-Allow-Methods',

  /** Access-Control-Allow-Headers: Allowed headers for CORS */
  ACCESS_CONTROL_ALLOW_HEADERS: 'Access-Control-Allow-Headers',

  /** Access-Control-Allow-Credentials: Allow credentials in CORS */
  ACCESS_CONTROL_ALLOW_CREDENTIALS: 'Access-Control-Allow-Credentials',
} as const;

/**
 * Content types
 *
 * @remarks
 * Standard content type values used in OAuth2/OIDC.
 * Provides type-safe constants for Content-Type header.
 *
 * @example
 * ```typescript
 * const headers: HttpHeaders = {
 *   [CommonHeaders.CONTENT_TYPE]: ContentTypes.FORM_URLENCODED
 * };
 * ```
 */
export const ContentTypes = {
  /** application/json - JSON data */
  JSON: 'application/json',

  /** application/x-www-form-urlencoded - Form data (OAuth2 token endpoint) */
  FORM_URLENCODED: 'application/x-www-form-urlencoded',

  /** text/html - HTML documents */
  HTML: 'text/html',

  /** text/plain - Plain text */
  PLAIN_TEXT: 'text/plain',

  /** application/jwt - JWT token */
  JWT: 'application/jwt',

  /** application/jose - JOSE (JSON Object Signing and Encryption) */
  JOSE: 'application/jose',
} as const;
