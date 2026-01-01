/**
 * ID Token Types (OIDC)
 *
 * OpenID Connect ID token structure and payload (OIDC Core §2)
 *
 * @remarks
 * ID tokens are ALWAYS JWTs in OIDC. They represent authentication events
 * and contain user identity information.
 *
 * **IMPORTANT:** ID tokens are NOT access tokens.
 * - ID tokens: Proof of authentication, for client
 * - Access tokens: Authorization to access resources, for resource server
 */

import type { IDTokenString, NonceValue, UnixTimestamp, IssuerURL, UserId, ClientId } from '../utils';
import type { JWTHeader, JWTPayload } from './jwt';

/**
 * ID Token structure (OIDC Core §2)
 *
 * @remarks
 * ID tokens are always JWTs in OIDC. They represent authentication events
 * and contain user identity information.
 *
 * **Key characteristics:**
 * - Always signed (JWS)
 * - Optionally encrypted (JWE)
 * - Contains authentication claims
 * - NOT used for API access (use access tokens instead)
 *
 * @example
 * ```typescript
 * const idToken: IDToken = {
 *   token: 'eyJhbGc...',
 *   payload: {
 *     iss: 'https://auth.example.com',
 *     sub: 'user-123',
 *     aud: 'client-id',
 *     exp: 1704009600,
 *     iat: 1704006000,
 *     nonce: 'n-0S6_WzA2Mj',
 *     name: 'John Doe',
 *     email: 'john.doe@example.com'
 *   },
 *   header: { alg: 'RS256', typ: 'JWT', kid: 'key-123' },
 *   signature: 'TJVA95...'
 * };
 * ```
 */
export interface IDToken {
  /** Raw ID token JWT string */
  readonly token: IDTokenString;

  /** Decoded ID token payload */
  readonly payload: IDTokenPayload;

  /** JWT header */
  readonly header: JWTHeader;

  /** JWT signature (Base64URL encoded) */
  readonly signature: string;

  /** ID token metadata (validation status) */
  readonly metadata?: IDTokenMetadata;
}

/**
 * ID Token Payload (OIDC Core §2)
 *
 * Contains claims about the authentication event and the authenticated user.
 *
 * @remarks
 * Extends standard JWT claims with OIDC-specific authentication claims
 * and user profile information (standard claims).
 */
export interface IDTokenPayload extends JWTPayload {
  /**
   * REQUIRED: Issuer identifier
   * Per OIDC Core §2
   *
   * @remarks
   * Must match the issuer value from discovery document
   * Client MUST validate this
   *
   * @example "https://auth.example.com"
   */
  iss: IssuerURL;

  /**
   * REQUIRED: Subject identifier (unique user ID)
   * Per OIDC Core §2
   *
   * @remarks
   * Locally unique and never reassigned identifier
   * within the issuer for the end-user
   * Maximum 255 ASCII characters
   *
   * @example "24400320" or "user-550e8400-e29b-41d4-a716-446655440000"
   */
  sub: UserId;

  /**
   * REQUIRED: Audience (client ID)
   * Per OIDC Core §2
   *
   * @remarks
   * Client MUST validate it contains its client_id
   * If array, client_id MUST be present
   *
   * @example "my-client-id"
   * @example ["my-client-id", "another-client-id"]
   */
  aud: string | string[];

  /**
   * REQUIRED: Expiration time (Unix timestamp)
   * Per OIDC Core §2
   *
   * @remarks
   * Time after which ID token MUST NOT be accepted
   * Typically short-lived (5-60 minutes)
   *
   * @example 1704009600
   */
  exp: UnixTimestamp;

  /**
   * REQUIRED: Time of token issuance (Unix timestamp)
   * Per OIDC Core §2
   *
   * @example 1704006000
   */
  iat: UnixTimestamp;

  /**
   * OPTIONAL: Time of authentication (Unix timestamp)
   * Per OIDC Core §2
   *
   * @remarks
   * When the end-user authentication occurred
   * Used for max_age validation
   *
   * @example 1704005900
   */
  auth_time?: UnixTimestamp;

  /**
   * OPTIONAL: Nonce from authentication request
   * Per OIDC Core §3.1.2.1
   *
   * @remarks
   * REQUIRED for Implicit Flow
   * RECOMMENDED for Authorization Code Flow
   * Client MUST validate this matches request nonce
   * Mitigates token substitution attacks
   *
   * @example "n-0S6_WzA2Mj"
   */
  nonce?: NonceValue;

  /**
   * OPTIONAL: Access token hash
   * Per OIDC Core §3.1.3.3
   *
   * @remarks
   * Used to bind ID token to access token
   * Prevents token substitution attacks
   * Required when ID token is issued with access token
   *
   * @example "jHkWEdUXMU1BwAsC4vtUsZwnNvTIxEl0z9K3vx5KF0Y"
   */
  at_hash?: string;

  /**
   * OPTIONAL: Authorization code hash
   * Per OIDC Core §3.3.2.11
   *
   * @remarks
   * Used in Hybrid Flow to bind ID token to authorization code
   * Base64URL(SHA256(code)[0:128 bits])
   *
   * @example "77QmUPtjPfzWtF2AnpK9RQ"
   */
  c_hash?: string;

  /**
   * OPTIONAL: Authentication Context Class Reference
   * Per OIDC Core §2
   *
   * @remarks
   * Indicates the authentication method used
   * Values defined in IANA registry or proprietary
   *
   * @example "urn:mace:incommon:iap:silver"
   */
  acr?: string;

  /**
   * OPTIONAL: Authentication Methods References
   * Per OIDC Core §2
   *
   * @remarks
   * Array of authentication methods used
   *
   * @example ["pwd", "mfa", "otp"]
   */
  amr?: string[];

  /**
   * OPTIONAL: Authorized party
   * Per OIDC Core §2
   *
   * @remarks
   * Client ID of the party to which ID token was issued
   * REQUIRED when aud contains multiple values
   * If present, client MUST verify it matches client_id
   *
   * @example "my-client-id"
   */
  azp?: ClientId;

  // ========================================
  // Standard Claims (OIDC Core §5.1)
  // ========================================

  /** User's full name */
  name?: string;

  /** User's given/first name */
  given_name?: string;

  /** User's surname/last name */
  family_name?: string;

  /** User's middle name */
  middle_name?: string;

  /** User's casual name/nickname */
  nickname?: string;

  /** Username (shorthand for username) */
  preferred_username?: string;

  /** Profile page URL */
  profile?: string;

  /** Profile picture URL */
  picture?: string;

  /** Web page URL */
  website?: string;

  /** Email address */
  email?: string;

  /** Email verified flag */
  email_verified?: boolean;

  /** Gender */
  gender?: string;

  /** Birthdate (YYYY-MM-DD format) */
  birthdate?: string;

  /** Zoneinfo (e.g., "America/Los_Angeles") */
  zoneinfo?: string;

  /** Locale (e.g., "en-US", "fr-CA") */
  locale?: string;

  /** Phone number (E.164 format recommended) */
  phone_number?: string;

  /** Phone number verified flag */
  phone_number_verified?: boolean;

  /**
   * Address
   * Per OIDC Core §5.1.1
   */
  address?: {
    /** Full mailing address */
    formatted?: string;
    /** Street address component */
    street_address?: string;
    /** City/locality */
    locality?: string;
    /** State/province/region */
    region?: string;
    /** Zip code/postal code */
    postal_code?: string;
    /** Country */
    country?: string;
  };

  /**
   * Last update time (Unix timestamp)
   * Per OIDC Core §5.1
   *
   * @remarks
   * Time user information was last updated
   */
  updated_at?: UnixTimestamp;

  /** Additional claims (custom or proprietary) */
  [key: string]: unknown;
}

/**
 * ID Token metadata
 *
 * @remarks
 * Validation results and additional context for the ID token
 */
export interface IDTokenMetadata {
  /** Whether ID token is currently valid */
  isValid: boolean;

  /**
   * Validation results
   *
   * @remarks
   * Detailed validation checks performed on the ID token
   */
  validation?: {
    /** Signature is valid (verified with JWKS) */
    signatureValid: boolean;

    /** Token has not expired (exp claim) */
    notExpired: boolean;

    /** Issuer matches expected value */
    issuerValid: boolean;

    /** Audience contains client_id */
    audienceValid: boolean;

    /** Nonce matches request (if present) */
    nonceValid?: boolean;

    /** Access token hash is valid (if present) */
    atHashValid?: boolean;

    /** Authorization code hash is valid (if present) */
    cHashValid?: boolean;
  };

  /** Time remaining until expiration (milliseconds) */
  timeRemaining?: number;

  /** Related access token (if issued together) */
  relatedAccessToken?: string;
}
