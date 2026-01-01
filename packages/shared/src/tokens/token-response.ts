/**
 * Token Response Types
 *
 * OAuth2 token endpoint request and response types (RFC 6749 §5, RFC 7662, RFC 7009)
 *
 * @remarks
 * These types represent the data structures exchanged with the OAuth2 token endpoint:
 * - Successful token responses
 * - Error responses
 * - Token introspection (RFC 7662)
 * - Token revocation (RFC 7009)
 */

import type { IssuerURL, UserId, ClientId, UnixTimestamp } from '../utils';

/**
 * Token endpoint response (RFC 6749 §5.1)
 *
 * Successful response from the token endpoint
 *
 * @remarks
 * Returned when token request succeeds. Format is consistent across
 * all grant types (authorization_code, client_credentials, refresh_token, etc.)
 *
 * @example
 * ```typescript
 * const tokenResponse: TokenResponse = {
 *   access_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
 *   token_type: 'Bearer',
 *   expires_in: 3600,
 *   refresh_token: 'tGzv3JOkF0XG5Qx2TlKWIA',
 *   scope: 'openid profile email',
 *   id_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...'
 * };
 * ```
 */
export interface TokenResponse {
  /**
   * REQUIRED: Access token
   * Per RFC 6749 §5.1
   *
   * @remarks
   * The access token issued by the authorization server
   * Can be JWT or opaque string
   */
  access_token: string;

  /**
   * REQUIRED: Token type
   * Per RFC 6749 §5.1
   *
   * @remarks
   * Typically "Bearer" (RFC 6750)
   * Case-insensitive
   *
   * @example "Bearer"
   */
  token_type: string;

  /**
   * RECOMMENDED: Access token lifetime in seconds
   * Per RFC 6749 §5.1
   *
   * @remarks
   * Number of seconds until access token expires
   * If omitted, authorization server should document default
   *
   * @example 3600 (1 hour)
   */
  expires_in?: number;

  /**
   * OPTIONAL: Refresh token
   * Per RFC 6749 §5.1
   *
   * @remarks
   * Used to obtain new access tokens
   * Not issued for client_credentials grant
   * Should be kept confidential
   */
  refresh_token?: string;

  /**
   * OPTIONAL: Authorized scope
   * Per RFC 6749 §5.1
   *
   * @remarks
   * If identical to requested scope, may be omitted
   * Space-separated list of scope values
   *
   * @example "openid profile email"
   */
  scope?: string;

  /**
   * OIDC: ID token
   * Per OIDC Core §3.1.3.3
   *
   * @remarks
   * Only present if 'openid' scope was requested
   * Always a JWT
   */
  id_token?: string;

  /** Additional response parameters (server-specific extensions) */
  [key: string]: unknown;
}

/**
 * Token error response (RFC 6749 §5.2)
 *
 * Error response from the token endpoint
 *
 * @example
 * ```typescript
 * const errorResponse: TokenErrorResponse = {
 *   error: 'invalid_grant',
 *   error_description: 'The authorization code is invalid or expired',
 *   error_uri: 'https://auth.example.com/docs/errors#invalid_grant'
 * };
 * ```
 */
export interface TokenErrorResponse {
  /**
   * REQUIRED: Error code
   * Per RFC 6749 §5.2
   *
   * @remarks
   * Single ASCII error code from defined set
   */
  error: TokenErrorCode;

  /**
   * OPTIONAL: Human-readable error description
   * Per RFC 6749 §5.2
   *
   * @remarks
   * ASCII text providing additional information
   * For developer consumption, not end-users
   */
  error_description?: string;

  /**
   * OPTIONAL: URI for error information
   * Per RFC 6749 §5.2
   *
   * @remarks
   * URI identifying a human-readable web page with error information
   */
  error_uri?: string;
}

/**
 * Token error codes (RFC 6749 §5.2)
 *
 * Standard OAuth2 token endpoint error codes
 */
export type TokenErrorCode =
  | 'invalid_request' // Request is missing parameter or malformed
  | 'invalid_client' // Client authentication failed
  | 'invalid_grant' // Authorization code/refresh token is invalid/expired
  | 'unauthorized_client' // Client not authorized for this grant type
  | 'unsupported_grant_type' // Grant type not supported by server
  | 'invalid_scope'; // Requested scope is invalid/unknown/exceeds granted

/**
 * Token introspection response (RFC 7662 §2.2)
 *
 * @remarks
 * Response from token introspection endpoint. Used by resource servers
 * to validate opaque access tokens.
 *
 * @example
 * ```typescript
 * const introspection: IntrospectionResponse = {
 *   active: true,
 *   scope: 'openid profile email',
 *   client_id: 'my-client-id',
 *   username: 'john.doe',
 *   token_type: 'Bearer',
 *   exp: 1704009600,
 *   iat: 1704006000,
 *   sub: 'user-123',
 *   aud: 'https://api.example.com',
 *   iss: 'https://auth.example.com'
 * };
 * ```
 */
export interface IntrospectionResponse {
  /**
   * REQUIRED: Whether token is active
   * Per RFC 7662 §2.2
   *
   * @remarks
   * If false, all other fields may be omitted
   * If true, additional fields provide token metadata
   */
  active: boolean;

  /**
   * OPTIONAL: Scope (space-separated)
   * Per RFC 7662 §2.2
   *
   * @example "openid profile email"
   */
  scope?: string;

  /**
   * OPTIONAL: Client ID
   * Per RFC 7662 §2.2
   */
  client_id?: ClientId;

  /**
   * OPTIONAL: Username
   * Per RFC 7662 §2.2
   *
   * @remarks
   * Human-readable identifier for resource owner
   */
  username?: string;

  /**
   * OPTIONAL: Token type
   * Per RFC 7662 §2.2
   *
   * @example "Bearer"
   */
  token_type?: string;

  /**
   * OPTIONAL: Expiration timestamp
   * Per RFC 7662 §2.2
   *
   * @remarks
   * Unix timestamp indicating when token expires
   */
  exp?: UnixTimestamp;

  /**
   * OPTIONAL: Issued at timestamp
   * Per RFC 7662 §2.2
   */
  iat?: UnixTimestamp;

  /**
   * OPTIONAL: Not before timestamp
   * Per RFC 7662 §2.2
   */
  nbf?: UnixTimestamp;

  /**
   * OPTIONAL: Subject
   * Per RFC 7662 §2.2
   */
  sub?: UserId;

  /**
   * OPTIONAL: Audience
   * Per RFC 7662 §2.2
   */
  aud?: string | string[];

  /**
   * OPTIONAL: Issuer
   * Per RFC 7662 §2.2
   */
  iss?: IssuerURL;

  /**
   * OPTIONAL: JWT ID
   * Per RFC 7662 §2.2
   */
  jti?: string;

  /** Additional claims (server-specific extensions) */
  [key: string]: unknown;
}

/**
 * Token revocation request (RFC 7009 §2.1)
 *
 * @remarks
 * Request to revoke an access token or refresh token
 *
 * @example
 * ```typescript
 * const revocationRequest: TokenRevocationRequest = {
 *   token: 'tGzv3JOkF0XG5Qx2TlKWIA',
 *   token_type_hint: 'refresh_token',
 *   client_id: 'my-client-id',
 *   client_secret: 'my-client-secret'
 * };
 * ```
 */
export interface TokenRevocationRequest {
  /**
   * REQUIRED: Token to revoke
   * Per RFC 7009 §2.1
   *
   * @remarks
   * The token that the client wants to revoke
   */
  token: string;

  /**
   * OPTIONAL: Token type hint
   * Per RFC 7009 §2.1
   *
   * @remarks
   * Hint about token type to improve performance
   * Server may ignore hint
   */
  token_type_hint?: 'access_token' | 'refresh_token';

  /**
   * REQUIRED: Client ID
   * Per RFC 7009 §2.1
   *
   * @remarks
   * Client authentication may be via HTTP Basic Auth instead
   */
  client_id: string;

  /**
   * Client secret (if confidential client)
   *
   * @remarks
   * For confidential clients
   * May be provided via HTTP Basic Auth instead of request body
   */
  client_secret?: string;
}
