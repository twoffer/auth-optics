/**
 * Access Token Types
 *
 * OAuth2 access token structure and payload (RFC 6749, RFC 9068)
 *
 * @remarks
 * Access tokens can be either:
 * - JWT (structured, self-contained) - RFC 9068
 * - Opaque (reference token, requires introspection)
 *
 * This module handles both types.
 */

import type { UnixTimestamp, ClientId, IssuerURL, UserId } from '../utils';
import type { JWTPayload } from './jwt';

// Forward declarations
type TokenBinding = any; // Implemented in security/token-binding.ts
type IntrospectionResponse = any; // Implemented in ./token-response.ts

/**
 * Access token structure
 *
 * @remarks
 * Can be either a JWT (structured) or opaque token (unstructured).
 * RFC 6750 does not mandate a specific format for access tokens.
 * RFC 9068 defines JWT profile for access tokens.
 *
 * @example
 * ```typescript
 * // JWT access token
 * const jwtToken: AccessToken = {
 *   token: 'eyJhbGc...',
 *   tokenType: 'Bearer',
 *   isJWT: true,
 *   payload: { iss: 'https://auth.example.com', sub: 'user-123', ... },
 *   expiresIn: 3600,
 *   scopes: ['openid', 'profile', 'email']
 * };
 *
 * // Opaque access token
 * const opaqueToken: AccessToken = {
 *   token: 'opaque-token-string-abc123',
 *   tokenType: 'Bearer',
 *   isJWT: false,
 *   expiresIn: 3600,
 *   scopes: ['openid', 'profile']
 * };
 * ```
 */
export interface AccessToken {
  /** Raw token string (JWT or opaque) */
  readonly token: string;

  /** Token type (typically "Bearer" per RFC 6750) */
  readonly tokenType: string;

  /** Whether this is a JWT or opaque token */
  readonly isJWT: boolean;

  /** Decoded JWT payload (only if isJWT === true) */
  readonly payload?: AccessTokenPayload;

  /** Expiration time in seconds from issuance */
  readonly expiresIn?: number;

  /** Absolute expiration timestamp (Unix time) */
  readonly expiresAt?: UnixTimestamp;

  /** Granted scopes (space-separated string or array) */
  readonly scopes?: string[];

  /** Token metadata (validation status, introspection, etc.) */
  readonly metadata?: AccessTokenMetadata;
}

/**
 * JWT Access Token Payload (RFC 9068)
 *
 * @remarks
 * This represents the standardized JWT access token profile from RFC 9068.
 * Legacy/custom implementations may have different claims.
 *
 * RFC 9068 standardizes JWT access tokens for improved interoperability
 * and security. It extends standard JWT claims with OAuth2-specific fields.
 */
export interface AccessTokenPayload extends JWTPayload {
  /**
   * REQUIRED: Issuer identifier
   * Per RFC 9068 §2.2.1
   *
   * @example "https://auth.example.com"
   */
  iss: IssuerURL;

  /**
   * REQUIRED: Subject (usually user ID)
   * Per RFC 9068 §2.2.2
   *
   * @remarks
   * For client credentials flow, may be client ID
   *
   * @example "user-550e8400-e29b-41d4-a716-446655440000"
   */
  sub: UserId;

  /**
   * REQUIRED: Audience (resource server identifier)
   * Per RFC 9068 §2.2.3
   *
   * @remarks
   * Identifies the resource server(s) that should accept this token
   * Resource servers MUST verify they are in the audience
   *
   * @example "https://api.example.com"
   * @example ["https://api.example.com", "https://api2.example.com"]
   */
  aud: string | string[];

  /**
   * REQUIRED: Expiration time (Unix timestamp)
   * Per RFC 9068 §2.2.4
   *
   * @remarks
   * After this time, the token MUST be rejected
   *
   * @example 1704009600
   */
  exp: UnixTimestamp;

  /**
   * REQUIRED: Issued at time (Unix timestamp)
   * Per RFC 9068 §2.2.5
   *
   * @example 1704006000
   */
  iat: UnixTimestamp;

  /**
   * OPTIONAL: Not before time (Unix timestamp)
   * Per RFC 7519 §4.1.5
   *
   * @remarks
   * Token is not valid before this time
   */
  nbf?: UnixTimestamp;

  /**
   * RECOMMENDED: JWT ID (unique identifier)
   * Per RFC 9068 §2.2.7
   *
   * @remarks
   * Used for token revocation and replay prevention
   *
   * @example "at-550e8400-e29b-41d4-a716-446655440000"
   */
  jti?: string;

  /**
   * OPTIONAL: Client ID that requested token
   * Per RFC 9068 §2.2.2
   *
   * @example "web-app-client-id"
   */
  client_id?: ClientId;

  /**
   * OPTIONAL: Authorized scopes (space-separated)
   * Per RFC 9068 §2.2.8
   *
   * @remarks
   * Space-separated list of granted scopes
   * If omitted, token has no scopes (or default scopes)
   *
   * @example "openid profile email"
   */
  scope?: string;

  /**
   * OPTIONAL: Authorization details (RFC 9396)
   * Per RFC 9068 §2.2.8
   *
   * @remarks
   * Rich authorization requests for fine-grained permissions
   * beyond simple scope strings
   */
  authorization_details?: AuthorizationDetail[];

  /** Additional custom claims */
  [key: string]: unknown;
}

/**
 * Authorization detail (RFC 9396)
 *
 * @remarks
 * Provides fine-grained authorization beyond scope strings
 * Used in Rich Authorization Requests (RAR)
 */
export interface AuthorizationDetail {
  /**
   * REQUIRED: Type of authorization
   *
   * @example "payment_initiation"
   * @example "account_information"
   */
  type: string;

  /** OPTIONAL: Locations where authorization applies */
  locations?: string[];

  /** OPTIONAL: Actions authorized */
  actions?: string[];

  /** OPTIONAL: Data types authorized */
  datatypes?: string[];

  /** Additional type-specific fields */
  [key: string]: unknown;
}

/**
 * Access token metadata
 *
 * @remarks
 * Additional information about the access token,
 * including validation status and introspection results
 */
export interface AccessTokenMetadata {
  /** Whether token is currently valid (not expired, not revoked) */
  isValid: boolean;

  /** Time remaining until expiration (milliseconds) */
  timeRemaining?: number;

  /** Whether token has been revoked */
  isRevoked?: boolean;

  /** Token binding type (if bound to client/device) */
  binding?: TokenBinding;

  /** Token introspection result (if introspected per RFC 7662) */
  introspection?: IntrospectionResponse;
}
