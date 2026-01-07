/**
 * PKCE (Proof Key for Code Exchange) Types
 *
 * RFC 7636: Proof Key for Code Exchange by OAuth Public Clients
 * https://datatracker.ietf.org/doc/html/rfc7636
 *
 * PKCE is a security extension to OAuth 2.0 that prevents authorization code
 * interception attacks. It's REQUIRED for all authorization code flows in OAuth 2.1.
 *
 * @module security/pkce
 */

/**
 * PKCE Parameters for Authorization Code Flow
 *
 * RFC 7636 Section 4.1 - Client Creates a Code Verifier
 * RFC 7636 Section 4.2 - Client Creates the Code Challenge
 *
 * The code_verifier is a cryptographically random string using the characters
 * [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~" with a minimum length of 43
 * characters and a maximum length of 128 characters.
 *
 * The code_challenge is derived from the code_verifier using the S256 method:
 * code_challenge = BASE64URL(SHA256(ASCII(code_verifier)))
 *
 * @example
 * ```typescript
 * const pkceParams: PKCEParams = {
 *   codeVerifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
 *   codeChallenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
 *   codeChallengeMethod: 'S256',
 *   generatedAt: '2024-01-06T10:00:00Z'
 * };
 * ```
 */
export interface PKCEParams {
  /**
   * Code verifier - cryptographically random string (43-128 chars)
   *
   * RFC 7636 Section 4.1:
   * - MUST be 43-128 characters long
   * - MUST use only [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"
   * - MUST have sufficient entropy (minimum 256 bits recommended)
   */
  readonly codeVerifier: string;

  /**
   * Code challenge - BASE64URL(SHA256(code_verifier))
   *
   * RFC 7636 Section 4.2:
   * - Derived from code_verifier using S256 transformation
   * - Sent in authorization request
   * - Server validates against code_verifier in token request
   */
  readonly codeChallenge: string;

  /**
   * Code challenge method - transformation algorithm
   *
   * RFC 7636 Section 4.3:
   * - S256: BASE64URL(SHA256(ASCII(code_verifier)))
   * - 'plain' is NOT RECOMMENDED and not supported in MVP
   *
   * OAuth 2.1: Only S256 is allowed
   */
  readonly codeChallengeMethod: 'S256';

  /**
   * Timestamp when PKCE parameters were generated (ISO 8601)
   *
   * Used for:
   * - Debugging and flow tracing
   * - Detecting stale parameters (though no expiration in spec)
   */
  readonly generatedAt: string;
}

/**
 * Result of PKCE Parameter Validation
 *
 * Used by backend services to validate PKCE parameters during flow execution.
 *
 * @example
 * ```typescript
 * const result: PKCEValidationResult = {
 *   isValid: false,
 *   errors: [PKCEValidationError.VERIFIER_TOO_SHORT],
 *   verifierMatches: true,
 *   verifierLengthValid: false,
 *   challengeEncodingValid: true
 * };
 * ```
 */
export interface PKCEValidationResult {
  /**
   * Overall validation status
   *
   * true: All checks passed, PKCE parameters are valid
   * false: At least one check failed, see errors array
   */
  isValid: boolean;

  /**
   * List of validation errors (if any)
   *
   * Empty array if isValid === true
   */
  errors?: PKCEValidationError[];

  /**
   * Whether code_challenge matches SHA256(code_verifier)
   *
   * RFC 7636 Section 4.6: Token endpoint validates this match
   */
  verifierMatches?: boolean;

  /**
   * Whether code_verifier length is valid (43-128 chars)
   *
   * RFC 7636 Section 4.1
   */
  verifierLengthValid?: boolean;

  /**
   * Whether code_challenge is valid Base64URL encoding
   *
   * RFC 7636 Section 4.2
   */
  challengeEncodingValid?: boolean;
}

/**
 * PKCE Validation Error Types
 *
 * RFC 7636 defines various error conditions for PKCE.
 *
 * Error responses per RFC 7636 Section 4.6:
 * - invalid_request: Malformed PKCE parameters
 * - invalid_grant: code_verifier doesn't match code_challenge
 */
export enum PKCEValidationError {
  /**
   * Code verifier is shorter than 43 characters
   *
   * RFC 7636 Section 4.1: Minimum length is 43 characters
   */
  VERIFIER_TOO_SHORT = 'verifier_too_short',

  /**
   * Code verifier is longer than 128 characters
   *
   * RFC 7636 Section 4.1: Maximum length is 128 characters
   */
  VERIFIER_TOO_LONG = 'verifier_too_long',

  /**
   * Code verifier contains invalid characters
   *
   * RFC 7636 Section 4.1: Only [A-Z][a-z][0-9]-._~ allowed
   */
  VERIFIER_INVALID_CHARS = 'verifier_invalid_chars',

  /**
   * Code challenge doesn't match SHA256(code_verifier)
   *
   * RFC 7636 Section 4.6: Token endpoint MUST verify this
   * OAuth error: invalid_grant
   */
  CHALLENGE_MISMATCH = 'challenge_mismatch',

  /**
   * Code challenge is not valid Base64URL encoding
   *
   * RFC 7636 Section 4.2
   */
  CHALLENGE_ENCODING_INVALID = 'challenge_encoding_invalid',

  /**
   * Code challenge method is not supported
   *
   * RFC 7636 Section 4.3: Only S256 is supported in OAuth 2.1
   * 'plain' is NOT RECOMMENDED and not supported in this implementation
   */
  METHOD_NOT_SUPPORTED = 'method_not_supported',
}

/**
 * PKCE Generation Options
 *
 * Configuration for generating PKCE parameters.
 */
export interface PKCEGenerationOptions {
  /**
   * Length of code_verifier (43-128 chars)
   *
   * Default: 43 (minimum secure length)
   * Recommended: 43-128 for balance of security and URL length
   */
  verifierLength?: number;

  /**
   * Code challenge method
   *
   * Default: 'S256' (only supported method in MVP)
   */
  codeChallengeMethod?: 'S256';
}

/**
 * PKCE Validation Options
 *
 * Configuration for validating PKCE parameters.
 */
export interface PKCEValidationOptions {
  /**
   * Whether to allow 'plain' code challenge method
   *
   * Default: false (not allowed in OAuth 2.1)
   * RFC 7636 Section 4.3: S256 is REQUIRED
   */
  allowPlain?: boolean;

  /**
   * Strict mode enforces all RFC 7636 requirements
   *
   * Default: true
   * - Verifier length 43-128
   * - Only allowed characters
   * - Challenge encoding validation
   */
  strict?: boolean;
}
