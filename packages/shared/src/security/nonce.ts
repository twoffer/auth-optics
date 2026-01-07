/**
 * OIDC Nonce Parameter Types
 *
 * OpenID Connect Core 1.0 Section 3.1.2.1: Authentication Request
 * https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest
 *
 * OpenID Connect Core 1.0 Section 3.1.3.7: ID Token Validation
 * https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation
 *
 * The nonce parameter is used to bind the ID Token to the client session and
 * mitigate replay attacks. It's RECOMMENDED for Authorization Code Flow and
 * REQUIRED for Implicit Flow.
 *
 * @module security/nonce
 */

/**
 * OIDC Nonce Parameter
 *
 * OIDC Core Section 3.1.2.1:
 * "String value used to associate a Client session with an ID Token, and to
 * mitigate replay attacks. The value is passed through unmodified from the
 * Authentication Request to the ID Token."
 *
 * The nonce value MUST be present in the ID Token and match the value sent
 * in the authorization request.
 *
 * @example
 * ```typescript
 * const nonce: NonceParam = {
 *   value: 'n-0S6_WzA2Mj',
 *   generatedAt: '2024-01-06T10:00:00Z',
 *   verified: false
 * };
 * ```
 */
export interface NonceParam {
  /**
   * Cryptographically random nonce value
   *
   * OIDC Core Section 3.1.2.1:
   * "A nonce Claim MUST be included in the ID Token when nonce is present
   * in the Authentication Request."
   *
   * MUST:
   * - Be cryptographically random (sufficient entropy)
   * - Be unique per authorization request
   * - Be passed unmodified to ID Token
   *
   * Recommended length: 32+ characters (128+ bits of entropy)
   */
  readonly value: string;

  /**
   * Timestamp when nonce was generated (ISO 8601)
   *
   * Used for:
   * - Debugging and flow tracing
   * - Detecting stale nonces
   */
  readonly generatedAt: string;

  /**
   * Whether nonce has been verified in ID Token
   *
   * OIDC Core Section 3.1.3.7 Step 11:
   * "If a nonce value was sent in the Authentication Request, a nonce Claim
   * MUST be present and its value checked to verify that it is the same value
   * as the one that was sent in the Authentication Request."
   *
   * - Initially false when generated
   * - Set to true after successful ID Token validation
   * - Used to prevent ID Token replay attacks
   */
  verified: boolean;
}

/**
 * Result of Nonce Parameter Validation
 *
 * Used to validate nonce in ID Token against stored nonce.
 *
 * @example
 * ```typescript
 * const result: NonceValidationResult = {
 *   isValid: true,
 *   nonceMatches: true
 * };
 * ```
 */
export interface NonceValidationResult {
  /**
   * Overall validation status
   *
   * true: Nonce is valid
   * false: Nonce validation failed, reject ID Token
   */
  isValid: boolean;

  /**
   * List of validation errors (if any)
   *
   * Empty if isValid === true
   */
  errors?: NonceValidationError[];

  /**
   * Whether nonce from ID Token matches stored nonce
   *
   * OIDC Core Section 3.1.3.7: MUST verify exact match
   * This is critical for preventing ID Token replay attacks
   */
  nonceMatches?: boolean;
}

/**
 * Nonce Parameter Validation Errors
 *
 * Security-critical errors in nonce validation.
 */
export enum NonceValidationError {
  /**
   * Nonce is missing from ID Token
   *
   * OIDC Core Section 3.1.3.7:
   * "If a nonce value was sent in the Authentication Request, a nonce Claim
   * MUST be present"
   *
   * Missing nonce when expected indicates:
   * - Authorization server error
   * - Potential ID Token manipulation
   */
  NONCE_MISSING = 'nonce_missing',

  /**
   * Nonce from ID Token doesn't match stored nonce
   *
   * OIDC Core Section 3.1.3.7:
   * "its value checked to verify that it is the same value as the one that
   * was sent in the Authentication Request"
   *
   * Nonce mismatch indicates:
   * - ID Token replay attack
   * - ID Token substitution attack
   * - Authorization server error
   */
  NONCE_MISMATCH = 'nonce_mismatch',

  /**
   * Nonce value is too short (insufficient entropy)
   *
   * Security BCP: Minimum 128 bits of entropy recommended
   * Approximately 22+ characters Base64URL encoded
   *
   * Weak nonces may be guessable, enabling replay attacks
   */
  NONCE_TOO_SHORT = 'nonce_too_short',
}

/**
 * Nonce Generation Options
 *
 * Configuration for generating nonce parameters.
 */
export interface NonceGenerationOptions {
  /**
   * Length of nonce value in characters
   *
   * Default: 32 (192 bits of entropy with Base64URL)
   * Minimum recommended: 22 (128 bits of entropy)
   */
  length?: number;
}

/**
 * Nonce Storage Entry
 *
 * Backend stores nonce with associated metadata for ID Token validation.
 *
 * @example
 * ```typescript
 * const storageEntry: NonceStorageEntry = {
 *   nonce: {
 *     value: 'n-0S6_WzA2Mj',
 *     generatedAt: '2024-01-06T10:00:00Z',
 *     verified: false
 *   },
 *   flowId: 'flow-123',
 *   stateValue: 'af0ifjsldkj'
 * };
 * ```
 */
export interface NonceStorageEntry {
  /**
   * Nonce parameter
   */
  nonce: NonceParam;

  /**
   * Associated flow ID
   *
   * Links nonce to specific OAuth2 flow execution
   */
  flowId: string;

  /**
   * Associated state parameter value
   *
   * Nonce and state are both sent in authorization request
   * Linking them helps with flow correlation
   */
  stateValue?: string;
}

/**
 * Nonce Validation Options
 *
 * Configuration for validating nonce parameters.
 */
export interface NonceValidationOptions {
  /**
   * Minimum nonce length in characters
   *
   * Default: 22 (approximately 128 bits of entropy)
   * OIDC recommendation for security
   */
  minLength?: number;

  /**
   * Whether to require nonce in ID Token
   *
   * Default: true if nonce was sent in auth request
   *
   * OIDC Core Section 3.1.3.7:
   * "If a nonce value was sent in the Authentication Request, a nonce Claim
   * MUST be present"
   */
  requireNonce?: boolean;
}
