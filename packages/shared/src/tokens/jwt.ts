/**
 * JWT (JSON Web Token) Types
 *
 * Generic JWT structure and payload types (RFC 7519)
 *
 * @remarks
 * JWTs are used for both access tokens and ID tokens in OAuth2/OIDC.
 * This module provides the base JWT types that other token types extend.
 */

import type { JWTString, IssuerURL, UserId, UnixTimestamp } from '../utils';

/**
 * Generic JWT structure
 *
 * Represents any JSON Web Token (RFC 7519)
 *
 * @remarks
 * JWT format: header.payload.signature
 * All three parts are Base64URL-encoded
 *
 * @example
 * ```typescript
 * const jwt: JWT = {
 *   raw: 'eyJhbGc...payload...signature',
 *   header: { alg: 'RS256', typ: 'JWT', kid: 'key-123' },
 *   payload: { iss: 'https://auth.example.com', sub: 'user-123', ... },
 *   signature: 'TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ'
 * };
 * ```
 */
export interface JWT {
  /** Raw JWT string (header.payload.signature) */
  readonly raw: JWTString;

  /** JWT header (JOSE header) */
  readonly header: JWTHeader;

  /** JWT payload (claims) */
  readonly payload: JWTPayload;

  /** JWT signature (Base64URL encoded) */
  readonly signature: string;
}

/**
 * JWT Header (RFC 7515 §4)
 *
 * JOSE (JSON Object Signing and Encryption) header containing
 * metadata about the token's cryptographic operations
 *
 * @remarks
 * The header specifies the algorithms and keys used to sign/encrypt the JWT
 */
export interface JWTHeader {
  /**
   * REQUIRED: Algorithm
   * Per RFC 7515 §4.1.1
   *
   * @remarks
   * Common values:
   * - RS256: RSA signature with SHA-256
   * - ES256: ECDSA signature with P-256 and SHA-256
   * - HS256: HMAC with SHA-256 (symmetric)
   * - none: Unsecured JWT (DANGEROUS - not recommended)
   *
   * @example "RS256"
   */
  alg: string;

  /**
   * OPTIONAL: Token type
   * Per RFC 7519 §5.1
   *
   * @remarks
   * Typically "JWT" for JWTs
   *
   * @example "JWT"
   */
  typ?: string;

  /**
   * OPTIONAL: Content type
   * Per RFC 7519 §5.2
   *
   * @remarks
   * Declares media type of secured content
   */
  cty?: string;

  /**
   * OPTIONAL: Key ID
   * Per RFC 7515 §4.1.4
   *
   * @remarks
   * Identifies the key used to sign the JWT
   * Used to lookup public key from JWKS endpoint
   *
   * @example "2021-05-01-key"
   */
  kid?: string;

  /**
   * OPTIONAL: JWK Set URL
   * Per RFC 7515 §4.1.2
   *
   * @remarks
   * URL pointing to a set of JSON Web Keys
   */
  jku?: string;

  /**
   * OPTIONAL: JSON Web Key
   * Per RFC 7515 §4.1.3
   *
   * @remarks
   * Public key embedded directly in header
   */
  jwk?: JsonWebKey;

  /**
   * OPTIONAL: X.509 URL
   * Per RFC 7515 §4.1.5
   */
  x5u?: string;

  /**
   * OPTIONAL: X.509 certificate chain
   * Per RFC 7515 §4.1.6
   */
  x5c?: string[];

  /**
   * OPTIONAL: X.509 certificate SHA-1 thumbprint
   * Per RFC 7515 §4.1.7
   */
  x5t?: string;

  /**
   * OPTIONAL: X.509 certificate SHA-256 thumbprint
   * Per RFC 7515 §4.1.8
   */
  'x5t#S256'?: string;

  /**
   * OPTIONAL: Critical headers
   * Per RFC 7515 §4.1.11
   *
   * @remarks
   * Lists header parameters that MUST be understood and processed
   */
  crit?: string[];

  /** Additional header parameters */
  [key: string]: unknown;
}

/**
 * JWT Payload (RFC 7519 §4)
 *
 * Contains claims about an entity (typically a user) and additional metadata
 *
 * @remarks
 * Claims can be:
 * - Registered: Standardized in RFC 7519
 * - Public: Collision-resistant names (IANA registry)
 * - Private: Custom claims agreed upon by parties
 */
export interface JWTPayload {
  /**
   * Issuer
   * Per RFC 7519 §4.1.1
   *
   * @remarks
   * Identifies the principal that issued the JWT
   * Case-sensitive string (typically a URL)
   *
   * @example "https://auth.example.com"
   */
  iss?: IssuerURL;

  /**
   * Subject
   * Per RFC 7519 §4.1.2
   *
   * @remarks
   * Identifies the principal that is the subject of the JWT
   * Must be unique within the issuer's context
   *
   * @example "user-550e8400-e29b-41d4-a716-446655440000"
   */
  sub?: UserId;

  /**
   * Audience
   * Per RFC 7519 §4.1.3
   *
   * @remarks
   * Identifies the recipients that the JWT is intended for
   * Each principal must verify that it is an intended audience
   * Can be a single string or array of strings
   *
   * @example "https://api.example.com"
   * @example ["https://api.example.com", "https://api2.example.com"]
   */
  aud?: string | string[];

  /**
   * Expiration time
   * Per RFC 7519 §4.1.4
   *
   * @remarks
   * Unix timestamp indicating when the JWT expires
   * Implementations MUST reject tokens after this time
   *
   * @example 1704009600 (2024-01-01 00:00:00 UTC)
   */
  exp?: UnixTimestamp;

  /**
   * Not before time
   * Per RFC 7519 §4.1.5
   *
   * @remarks
   * Unix timestamp indicating when the JWT becomes valid
   * Implementations MUST reject tokens before this time
   *
   * @example 1704006000 (2023-12-31 23:00:00 UTC)
   */
  nbf?: UnixTimestamp;

  /**
   * Issued at time
   * Per RFC 7519 §4.1.6
   *
   * @remarks
   * Unix timestamp indicating when the JWT was issued
   * Can be used to determine JWT age
   *
   * @example 1704006000
   */
  iat?: UnixTimestamp;

  /**
   * JWT ID
   * Per RFC 7519 §4.1.7
   *
   * @remarks
   * Unique identifier for the JWT
   * Used to prevent replay attacks
   * Case-sensitive string
   *
   * @example "jwt-550e8400-e29b-41d4-a716-446655440000"
   */
  jti?: string;

  /** Additional claims (public, private, or custom) */
  [key: string]: unknown;
}

/**
 * JSON Web Key (RFC 7517)
 *
 * Represents a cryptographic key in JSON format
 *
 * @remarks
 * Used in JWKS (JSON Web Key Set) endpoints for key distribution
 */
export interface JsonWebKey {
  /**
   * REQUIRED: Key type
   * Per RFC 7517 §4.1
   *
   * @remarks
   * Common values:
   * - RSA: RSA key
   * - EC: Elliptic Curve key
   * - oct: Octet sequence (symmetric key)
   */
  kty: string;

  /**
   * OPTIONAL: Public key use
   * Per RFC 7517 §4.2
   *
   * @remarks
   * - sig: Signature
   * - enc: Encryption
   */
  use?: string;

  /**
   * OPTIONAL: Key operations
   * Per RFC 7517 §4.3
   *
   * @remarks
   * Array of operations for which the key may be used
   */
  key_ops?: string[];

  /**
   * OPTIONAL: Algorithm
   * Per RFC 7517 §4.4
   *
   * @example "RS256"
   */
  alg?: string;

  /**
   * OPTIONAL: Key ID
   * Per RFC 7517 §4.5
   */
  kid?: string;

  /** OPTIONAL: X.509 URL */
  x5u?: string;

  /** OPTIONAL: X.509 certificate chain */
  x5c?: string[];

  /** OPTIONAL: X.509 SHA-1 thumbprint */
  x5t?: string;

  /** OPTIONAL: X.509 SHA-256 thumbprint */
  'x5t#S256'?: string;

  /** RSA: Modulus (Base64URL encoded) */
  n?: string;

  /** RSA: Exponent (Base64URL encoded) */
  e?: string;

  /** RSA: Private exponent (Base64URL encoded) */
  d?: string;

  /** EC: Curve (e.g., "P-256") */
  crv?: string;

  /** EC: X coordinate (Base64URL encoded) */
  x?: string;

  /** EC: Y coordinate (Base64URL encoded) */
  y?: string;

  /** Symmetric: Key value (Base64URL encoded) */
  k?: string;

  /** Additional parameters */
  [key: string]: unknown;
}
