/**
 * Authorization Code Flow Types
 *
 * Types for OAuth2 Authorization Code Flow with PKCE (RFC 6749 §4.1, RFC 7636)
 *
 * @remarks
 * This is the primary flow for AuthOptics MVP. All types follow RFC specifications
 * exactly to ensure protocol compliance.
 *
 * **Key RFCs:**
 * - RFC 6749 §4.1: Authorization Code Grant
 * - RFC 7636: Proof Key for Code Exchange (PKCE)
 * - OpenID Connect Core 1.0: OIDC additions
 * - RFC 9207: OAuth 2.0 Authorization Server Issuer Identification
 */

/**
 * Authorization request parameters (RFC 6749 §4.1.1)
 *
 * @remarks
 * Parameters sent to the authorization endpoint to initiate the flow.
 * PKCE parameters (code_challenge, code_challenge_method) are REQUIRED
 * per OAuth 2.1 recommendations.
 *
 * @example
 * ```typescript
 * const authRequest: AuthorizationRequest = {
 *   response_type: 'code',
 *   client_id: 'my-client-id',
 *   redirect_uri: 'https://app.example.com/callback',
 *   scope: 'openid profile email',
 *   state: 'xyz123abc',
 *   code_challenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
 *   code_challenge_method: 'S256',
 *   nonce: 'n-0S6_WzA2Mj'
 * };
 * ```
 */
export interface AuthorizationRequest {
  /**
   * REQUIRED: Must be "code" for authorization code flow
   * Per RFC 6749 §4.1.1
   */
  response_type: 'code';

  /**
   * REQUIRED: Client identifier issued during registration
   * Per RFC 6749 §4.1.1
   */
  client_id: string;

  /**
   * OPTIONAL: Redirection URI where response will be sent
   * Per RFC 6749 §4.1.1
   *
   * @remarks
   * If provided, must match registered redirect URI exactly
   * REQUIRED if multiple redirect URIs are registered
   */
  redirect_uri?: string;

  /**
   * OPTIONAL: Scope of the access request
   * Per RFC 6749 §4.1.1
   *
   * @remarks
   * Space-separated list of scope values
   * For OIDC, must include 'openid' scope
   *
   * @example "openid profile email"
   */
  scope?: string;

  /**
   * RECOMMENDED: Opaque value for CSRF protection
   * Per RFC 6749 §4.1.1, §10.12
   *
   * @remarks
   * While OPTIONAL in RFC 6749, it's effectively REQUIRED for security
   * Client must validate state matches on callback
   */
  state?: string;

  /**
   * PKCE: Code challenge derived from code verifier
   * Per RFC 7636 §4.2
   *
   * @remarks
   * REQUIRED for public clients per OAuth 2.1
   * Generated as BASE64URL(SHA256(ASCII(code_verifier)))
   * when using S256 method
   */
  code_challenge?: string;

  /**
   * PKCE: Code challenge method
   * Per RFC 7636 §4.3
   *
   * @remarks
   * OAuth 2.1 REQUIRES "S256" method
   * "plain" method is NOT RECOMMENDED for security
   */
  code_challenge_method?: 'S256' | 'plain';

  /**
   * OIDC: Nonce for ID token binding
   * Per OIDC Core §3.1.2.1
   *
   * @remarks
   * REQUIRED for Implicit Flow
   * RECOMMENDED for Authorization Code Flow
   * Mitigates token substitution attacks
   */
  nonce?: string;

  /**
   * OIDC: Authentication Context Class Reference values
   * Per OIDC Core §3.1.2.1
   *
   * @remarks
   * Space-separated string specifying acr values
   * Indicates authentication methods required
   */
  acr_values?: string;

  /**
   * OIDC: Display preference
   * Per OIDC Core §3.1.2.1
   *
   * @remarks
   * Specifies how authorization server displays authentication UI
   */
  display?: 'page' | 'popup' | 'touch' | 'wap';

  /**
   * OIDC: Prompt preference
   * Per OIDC Core §3.1.2.1
   *
   * @remarks
   * - none: No authentication/consent UI
   * - login: Force re-authentication
   * - consent: Force consent screen
   * - select_account: Account selection
   */
  prompt?: 'none' | 'login' | 'consent' | 'select_account';

  /**
   * Additional custom parameters
   *
   * @remarks
   * Allows for authorization server-specific extensions
   */
  [key: string]: string | undefined;
}

/**
 * Authorization response parameters (RFC 6749 §4.1.2)
 *
 * @remarks
 * Parameters returned from authorization endpoint on successful authentication
 *
 * @example
 * ```typescript
 * const authResponse: AuthorizationResponse = {
 *   code: 'SplxlOBeZQQYbYS6WxSbIA',
 *   state: 'xyz123abc',
 *   iss: 'https://auth.example.com'
 * };
 * ```
 */
export interface AuthorizationResponse {
  /**
   * REQUIRED: Authorization code
   * Per RFC 6749 §4.1.2
   *
   * @remarks
   * Short-lived (typically 1-10 minutes)
   * Single-use only
   * Client exchanges this for tokens at token endpoint
   */
  code: string;

  /**
   * REQUIRED if state was in request
   * Per RFC 6749 §4.1.2
   *
   * @remarks
   * Must match state parameter from request
   * Client MUST verify this matches
   */
  state?: string;

  /**
   * OIDC: Issuer identifier
   * Per RFC 9207 (OAuth 2.0 Authorization Server Issuer Identification)
   *
   * @remarks
   * Mitigates mix-up attacks
   * Client SHOULD validate this matches expected issuer
   */
  iss?: string;
}

/**
 * Authorization error response (RFC 6749 §4.1.2.1)
 *
 * @remarks
 * Returned when authorization request fails
 *
 * @example
 * ```typescript
 * const authError: AuthorizationErrorResponse = {
 *   error: 'access_denied',
 *   error_description: 'User denied the authorization request',
 *   state: 'xyz123abc'
 * };
 * ```
 */
export interface AuthorizationErrorResponse {
  /**
   * REQUIRED: Error code
   * Per RFC 6749 §4.1.2.1
   */
  error: AuthorizationErrorCode;

  /**
   * OPTIONAL: Human-readable error description
   * Per RFC 6749 §4.1.2.1
   *
   * @remarks
   * ASCII text providing additional information
   * Intended for developer consumption, not end-users
   */
  error_description?: string;

  /**
   * OPTIONAL: URI for error information
   * Per RFC 6749 §4.1.2.1
   *
   * @remarks
   * URI identifying a human-readable web page with error information
   */
  error_uri?: string;

  /**
   * REQUIRED if state was in request
   * Per RFC 6749 §4.1.2.1
   */
  state?: string;
}

/**
 * Authorization error codes (RFC 6749 §4.1.2.1)
 *
 * @remarks
 * Standard OAuth2 authorization endpoint error codes
 */
export type AuthorizationErrorCode =
  | 'invalid_request' // Request is missing required parameter or malformed
  | 'unauthorized_client' // Client not authorized for this grant type
  | 'access_denied' // Resource owner or authorization server denied request
  | 'unsupported_response_type' // Authorization server does not support this response type
  | 'invalid_scope' // Requested scope is invalid, unknown, or malformed
  | 'server_error' // Authorization server encountered unexpected condition
  | 'temporarily_unavailable'; // Authorization server temporarily unavailable

/**
 * Token request parameters (RFC 6749 §4.1.3)
 *
 * @remarks
 * Parameters sent to token endpoint to exchange authorization code for tokens
 *
 * @example
 * ```typescript
 * const tokenRequest: TokenRequest = {
 *   grant_type: 'authorization_code',
 *   code: 'SplxlOBeZQQYbYS6WxSbIA',
 *   redirect_uri: 'https://app.example.com/callback',
 *   client_id: 'my-client-id',
 *   code_verifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
 * };
 * ```
 */
export interface TokenRequest {
  /**
   * REQUIRED: Must be "authorization_code"
   * Per RFC 6749 §4.1.3
   */
  grant_type: 'authorization_code';

  /**
   * REQUIRED: Authorization code received from authorization endpoint
   * Per RFC 6749 §4.1.3
   */
  code: string;

  /**
   * REQUIRED if included in authorization request
   * Per RFC 6749 §4.1.3
   *
   * @remarks
   * Must be identical to redirect_uri in authorization request
   */
  redirect_uri?: string;

  /**
   * REQUIRED: Client identifier
   * Per RFC 6749 §4.1.3
   *
   * @remarks
   * For confidential clients, may be provided via HTTP Basic Authentication
   */
  client_id: string;

  /**
   * REQUIRED for confidential clients (if not using HTTP Basic Auth)
   * Per RFC 6749 §4.1.3
   *
   * @remarks
   * NOT RECOMMENDED for public clients
   * Public clients should use PKCE instead
   */
  client_secret?: string;

  /**
   * PKCE: Code verifier
   * Per RFC 7636 §4.5
   *
   * @remarks
   * REQUIRED if code_challenge was sent in authorization request
   * Server verifies: BASE64URL(SHA256(code_verifier)) == code_challenge
   */
  code_verifier?: string;
}
