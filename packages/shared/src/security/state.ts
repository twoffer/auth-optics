/**
 * OAuth2 State Parameter Types
 *
 * RFC 6749 Section 10.12: Cross-Site Request Forgery (CSRF)
 * https://datatracker.ietf.org/doc/html/rfc6749#section-10.12
 *
 * OAuth 2.1: State parameter is REQUIRED for all authorization requests
 * https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1
 *
 * The state parameter is used to prevent CSRF attacks by binding the authorization
 * request to the client session. The client generates a cryptographically random
 * value, includes it in the authorization request, and validates it matches when
 * receiving the authorization response.
 *
 * @module security/state
 */

/**
 * OAuth2 State Parameter
 *
 * RFC 6749 Section 10.12:
 * "The client MUST implement CSRF protection for its redirection URI. This is
 * typically accomplished by requiring any request sent to the redirection URI
 * endpoint to include a value that binds the request to the user-agent's
 * authenticated state."
 *
 * OAuth 2.1: State is REQUIRED, not just RECOMMENDED
 *
 * @example
 * ```typescript
 * const state: StateParam = {
 *   value: 'af0ifjsldkj',
 *   generatedAt: '2024-01-06T10:00:00Z',
 *   expiresAt: '2024-01-06T10:10:00Z',
 *   used: false
 * };
 * ```
 */
export interface StateParam {
  /**
   * Cryptographically random state value
   *
   * RFC 6749 Section 10.10: "Unguessable value"
   *
   * MUST:
   * - Be cryptographically random (sufficient entropy)
   * - Be unique per authorization request
   * - Be opaque to the authorization server
   *
   * Recommended length: 32+ characters (128+ bits of entropy)
   */
  readonly value: string;

  /**
   * Timestamp when state was generated (ISO 8601)
   *
   * Used for:
   * - Calculating expiration
   * - Debugging and flow tracing
   */
  readonly generatedAt: string;

  /**
   * Timestamp when state expires (ISO 8601)
   *
   * Recommended: 10 minutes after generation
   *
   * Security BCP: State should have limited lifetime to prevent
   * replay attacks if somehow leaked.
   */
  readonly expiresAt: string;

  /**
   * Whether this state has been used (single-use protection)
   *
   * CSRF protection requires state be single-use:
   * - Initially false when generated
   * - Set to true when validated in callback
   * - Rejected if already true (replay attack)
   */
  used: boolean;
}

/**
 * Result of State Parameter Validation
 *
 * Used by backend to validate state parameter in OAuth callback.
 *
 * @example
 * ```typescript
 * const result: StateValidationResult = {
 *   isValid: true,
 *   stateMatches: true,
 *   isExpired: false,
 *   alreadyUsed: false
 * };
 * ```
 */
export interface StateValidationResult {
  /**
   * Overall validation status
   *
   * true: State is valid and can be used
   * false: State failed validation, reject request
   */
  isValid: boolean;

  /**
   * List of validation errors (if any)
   *
   * Empty if isValid === true
   */
  errors?: StateValidationError[];

  /**
   * Whether state from callback matches stored state
   *
   * RFC 6749 Section 10.12: MUST verify exact match
   */
  stateMatches?: boolean;

  /**
   * Whether state has expired
   *
   * Expired state indicates potential replay attack or stale flow
   */
  isExpired?: boolean;

  /**
   * Whether state has already been used
   *
   * Used state indicates potential replay attack
   */
  alreadyUsed?: boolean;
}

/**
 * State Parameter Validation Errors
 *
 * Security-critical errors that prevent flow continuation.
 */
export enum StateValidationError {
  /**
   * State parameter is missing from callback
   *
   * RFC 6749 Section 10.12: State MUST be present if sent in request
   * OAuth 2.1: State is REQUIRED in all flows
   */
  STATE_MISSING = 'state_missing',

  /**
   * State from callback doesn't match stored state
   *
   * RFC 6749 Section 10.12: "MUST ensure that the value received in the
   * redirection URI matches the value sent in the authorization request"
   *
   * This indicates a CSRF attack attempt.
   */
  STATE_MISMATCH = 'state_mismatch',

  /**
   * State has expired
   *
   * Security BCP: Limit state lifetime to 10 minutes
   * Expired state may indicate replay attack or user delay
   */
  STATE_EXPIRED = 'state_expired',

  /**
   * State has already been used (replay attack)
   *
   * Security BCP: State MUST be single-use
   * Reused state indicates potential replay attack
   */
  STATE_ALREADY_USED = 'state_already_used',

  /**
   * State value is too short (insufficient entropy)
   *
   * Security BCP: Minimum 128 bits of entropy recommended
   * Approximately 22+ characters Base64URL encoded
   */
  STATE_TOO_SHORT = 'state_too_short',
}

/**
 * State Generation Options
 *
 * Configuration for generating state parameters.
 */
export interface StateGenerationOptions {
  /**
   * Length of state value in characters
   *
   * Default: 32 (192 bits of entropy with Base64URL)
   * Minimum recommended: 22 (128 bits of entropy)
   */
  length?: number;

  /**
   * State expiration time in seconds
   *
   * Default: 600 (10 minutes)
   * RFC 6749: No specific requirement, but short lifetime recommended
   */
  expiresInSeconds?: number;
}

/**
 * State Storage Entry
 *
 * Backend stores state with associated metadata for validation.
 *
 * @example
 * ```typescript
 * const storageEntry: StateStorageEntry = {
 *   state: {
 *     value: 'af0ifjsldkj',
 *     generatedAt: '2024-01-06T10:00:00Z',
 *     expiresAt: '2024-01-06T10:10:00Z',
 *     used: false
 *   },
 *   flowId: 'flow-123',
 *   clientSessionId: 'session-456'
 * };
 * ```
 */
export interface StateStorageEntry {
  /**
   * State parameter
   */
  state: StateParam;

  /**
   * Associated flow ID
   *
   * Links state to specific OAuth2 flow execution
   */
  flowId: string;

  /**
   * Client session ID (optional)
   *
   * Additional binding to client session for enhanced security
   */
  clientSessionId?: string;
}

/**
 * State Validation Options
 *
 * Configuration for validating state parameters.
 */
export interface StateValidationOptions {
  /**
   * Whether to enforce single-use state
   *
   * Default: true (REQUIRED for security)
   * RFC 6749 Section 10.12 + Security BCP
   */
  enforceSingleUse?: boolean;

  /**
   * Whether to check expiration
   *
   * Default: true (RECOMMENDED for security)
   * Security BCP: Limit state lifetime
   */
  checkExpiration?: boolean;

  /**
   * Minimum state length in characters
   *
   * Default: 22 (approximately 128 bits of entropy)
   * Security BCP recommendation
   */
  minLength?: number;
}
