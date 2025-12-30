/**
 * Refresh Token Types
 *
 * OAuth2 refresh token structure (RFC 6749 §1.5)
 *
 * @remarks
 * Refresh tokens are long-lived credentials used to obtain new access tokens
 * without re-authenticating the user. They are typically opaque strings but
 * may be JWTs in some implementations.
 *
 * **MVP Note:** Basic structure only. Full refresh token rotation and flow
 * logic will be implemented in Phase 2.
 */

import type { RefreshTokenString, Timestamp, UnixTimestamp, IssuerURL, UserId, ClientId } from '../utils';

/**
 * Refresh token structure
 *
 * @remarks
 * Refresh tokens are typically opaque strings but may be JWTs in some implementations.
 * Unlike access tokens, refresh tokens:
 * - Are long-lived (hours to months)
 * - Should be stored securely (never in browser localStorage)
 * - Are used only with token endpoint
 * - Should support rotation (OAuth 2.1 recommendation)
 *
 * @example
 * ```typescript
 * // Opaque refresh token
 * const opaqueToken: RefreshToken = {
 *   token: 'tGzv3JOkF0XG5Qx2TlKWIA',
 *   isJWT: false,
 *   expiresIn: 2592000, // 30 days
 *   scopes: ['openid', 'offline_access']
 * };
 *
 * // JWT refresh token
 * const jwtToken: RefreshToken = {
 *   token: 'eyJhbGc...',
 *   isJWT: true,
 *   payload: { iss: 'https://auth.example.com', sub: 'user-123', ... },
 *   expiresIn: 2592000
 * };
 * ```
 */
export interface RefreshToken {
  /** Raw refresh token string (opaque or JWT) */
  readonly token: RefreshTokenString;

  /** Whether this is a JWT refresh token (uncommon, but possible) */
  readonly isJWT: boolean;

  /** Decoded payload (only if JWT) */
  readonly payload?: RefreshTokenPayload;

  /** Expiration time in seconds (if known) */
  readonly expiresIn?: number;

  /** Absolute expiration timestamp (Unix time, if known) */
  readonly expiresAt?: UnixTimestamp;

  /** Scopes this refresh token can request */
  readonly scopes?: string[];

  /** Refresh token metadata */
  readonly metadata?: RefreshTokenMetadata;
}

/**
 * JWT Refresh Token Payload
 *
 * @remarks
 * Refresh token payload structure is not standardized in OAuth2/OIDC.
 * This represents a common implementation pattern seen in practice.
 *
 * Most implementations use opaque refresh tokens and rely on database
 * lookups. JWT refresh tokens are less common due to revocation complexity.
 */
export interface RefreshTokenPayload {
  /** Issuer identifier */
  iss?: IssuerURL;

  /** Subject (user ID) */
  sub?: UserId;

  /** Client ID that owns this refresh token */
  client_id?: ClientId;

  /** Expiration time (Unix timestamp) */
  exp?: UnixTimestamp;

  /** Issued at time (Unix timestamp) */
  iat?: UnixTimestamp;

  /** JWT ID (unique identifier) */
  jti?: string;

  /**
   * Token family ID (for rotation)
   *
   * @remarks
   * Used in refresh token rotation to track token families
   * If a token from a revoked family is used, entire family is revoked
   */
  family?: string;

  /** Authorized scopes (space-separated) */
  scope?: string;

  /** Additional claims */
  [key: string]: unknown;
}

/**
 * Refresh token metadata
 *
 * @remarks
 * Additional information about the refresh token's lifecycle and usage
 */
export interface RefreshTokenMetadata {
  /** Whether refresh token is currently valid */
  isValid: boolean;

  /** Whether token has been revoked */
  isRevoked?: boolean;

  /** Whether token has been rotated (replaced with new token) */
  isRotated?: boolean;

  /** When token was last used (ISO 8601) */
  lastUsedAt?: Timestamp;

  /** How many times token has been used */
  useCount?: number;

  /**
   * Rotation family ID
   *
   * @remarks
   * All tokens in a rotation chain share the same family ID
   * If any token in family is reused after rotation, entire family is revoked
   */
  familyId?: string;

  /**
   * Previous token in rotation chain
   *
   * @remarks
   * Used to track token lineage in rotation implementations
   */
  previousToken?: string;
}
