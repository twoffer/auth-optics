/**
 * Branded Types (Nominal Typing)
 *
 * Branded types provide compile-time type safety for primitive values
 * by creating distinct types that prevent accidental mixing of values.
 *
 * @remarks
 * TypeScript uses structural typing, meaning two types with the same structure
 * are considered compatible. Branded types add a unique symbol to create
 * nominal typing behavior, preventing accidental type mismatches.
 *
 * @example
 * ```typescript
 * const clientId = asClientId('my-client');
 * const userId = asUserId('user-123');
 *
 * function getClient(id: ClientId) { ... }
 *
 * getClient(clientId);  // ✓ OK
 * getClient(userId);    // ✗ Type error - UserId is not assignable to ClientId
 * ```
 */

/**
 * Unique brand symbol
 *
 * Used to create nominal types from structural types
 */
declare const brand: unique symbol;

/**
 * Generic branded type helper
 *
 * Creates a nominal type by adding a unique brand symbol
 *
 * @template T - Base type (usually string or number)
 * @template B - Brand identifier (unique string literal)
 */
export type Branded<T, B extends string> = T & { readonly [brand]: B };

/**
 * OAuth2 client identifier
 *
 * Uniquely identifies an OAuth2 client application
 * Per RFC 6749 Section 2.2
 *
 * @example "web-app-client-id"
 */
export type ClientId = Branded<string, 'ClientId'>;

/**
 * User/subject identifier
 *
 * Uniquely identifies a user (subject)
 * Per RFC 7519 'sub' claim
 *
 * @example "user-550e8400-e29b-41d4-a716-446655440000"
 */
export type UserId = Branded<string, 'UserId'>;

/**
 * Flow execution identifier
 *
 * Uniquely identifies a flow execution instance
 * Internal identifier for tracking flow state
 *
 * @example "flow-123e4567-e89b-12d3-a456-426614174000"
 */
export type FlowId = Branded<string, 'FlowId'>;

/**
 * Authorization code
 *
 * One-time authorization code returned from authorization endpoint
 * Per RFC 6749 Section 4.1.2
 *
 * @remarks
 * Must be short-lived (typically 1-10 minutes)
 * Single-use only
 *
 * @example "SplxlOBeZQQYbYS6WxSbIA"
 */
export type AuthorizationCode = Branded<string, 'AuthorizationCode'>;

/**
 * Access token string
 *
 * Bearer access token (opaque or JWT)
 * Per RFC 6749 Section 1.4 and RFC 6750
 *
 * @example "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
 */
export type AccessTokenString = Branded<string, 'AccessTokenString'>;

/**
 * Refresh token string
 *
 * Long-lived token for obtaining new access tokens
 * Per RFC 6749 Section 1.5
 *
 * @remarks
 * Should be stored securely and never exposed to browser
 * Supports token rotation per OAuth 2.1
 *
 * @example "tGzv3JOkF0XG5Qx2TlKWIA"
 */
export type RefreshTokenString = Branded<string, 'RefreshTokenString'>;

/**
 * ID token string (OIDC)
 *
 * OpenID Connect ID token (always JWT)
 * Per OIDC Core Section 2
 *
 * @remarks
 * Unlike access tokens, ID tokens are ALWAYS JWTs
 * Contains user authentication claims
 *
 * @example "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
 */
export type IDTokenString = Branded<string, 'IDTokenString'>;

/**
 * PKCE code verifier
 *
 * High-entropy cryptographic random string
 * Per RFC 7636 Section 4.1
 *
 * @remarks
 * Requirements (RFC 7636):
 * - Minimum length: 43 characters
 * - Maximum length: 128 characters
 * - Character set: [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"
 *
 * @example "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
 */
export type CodeVerifier = Branded<string, 'CodeVerifier'>;

/**
 * PKCE code challenge
 *
 * Transformed code verifier sent to authorization endpoint
 * Per RFC 7636 Section 4.2
 *
 * @remarks
 * Generated from code_verifier using code_challenge_method:
 * - plain: challenge = verifier
 * - S256: challenge = BASE64URL(SHA256(ASCII(verifier)))
 *
 * OAuth 2.1 REQUIRES S256 method
 *
 * @example "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
 */
export type CodeChallenge = Branded<string, 'CodeChallenge'>;

/**
 * State parameter value
 *
 * Opaque value for CSRF protection
 * Per RFC 6749 Section 4.1.1
 *
 * @remarks
 * RECOMMENDED in RFC 6749, effectively REQUIRED for security
 * Must be:
 * - Unguessable
 * - Tied to client session
 * - Verified on callback
 *
 * @example "xyzABC123"
 */
export type StateValue = Branded<string, 'StateValue'>;

/**
 * Nonce parameter value (OIDC)
 *
 * Unguessable random string for ID token binding
 * Per OIDC Core Section 3.1.2.1
 *
 * @remarks
 * REQUIRED for Implicit Flow
 * OPTIONAL but RECOMMENDED for Authorization Code Flow
 * Mitigates token substitution attacks
 *
 * @example "n-0S6_WzA2Mj"
 */
export type NonceValue = Branded<string, 'NonceValue'>;

/**
 * Scope string
 *
 * Space-separated list of scope values
 * Per RFC 6749 Section 3.3
 *
 * @remarks
 * OAuth2 scopes are case-sensitive
 * OIDC requires 'openid' scope for ID token
 *
 * @example "openid profile email"
 */
export type ScopeString = Branded<string, 'ScopeString'>;

/**
 * Issuer URL
 *
 * Authorization server's issuer identifier
 * Per RFC 8414 and OIDC Discovery
 *
 * @remarks
 * Must be:
 * - HTTPS URL (except localhost for development)
 * - No query or fragment components
 * - Match 'iss' claim in tokens
 *
 * @example "https://auth.example.com"
 */
export type IssuerURL = Branded<string, 'IssuerURL'>;

/**
 * Redirect URI
 *
 * Client's registered redirect URI
 * Per RFC 6749 Section 3.1.2
 *
 * @remarks
 * Security requirements:
 * - Must match registered URI exactly (no pattern matching)
 * - HTTPS required for production
 * - Fragment component prohibited
 *
 * @example "https://app.example.com/callback"
 */
export type RedirectURI = Branded<string, 'RedirectURI'>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a ClientId branded type
 */
export const asClientId = (value: string): ClientId => value as ClientId;

/**
 * Create a UserId branded type
 */
export const asUserId = (value: string): UserId => value as UserId;

/**
 * Create a FlowId branded type
 */
export const asFlowId = (value: string): FlowId => value as FlowId;

/**
 * Create an AuthorizationCode branded type
 */
export const asAuthorizationCode = (value: string): AuthorizationCode =>
  value as AuthorizationCode;

/**
 * Create a CodeVerifier branded type
 *
 * @remarks
 * Validates minimum length (43 characters) per RFC 7636
 */
export const asCodeVerifier = (value: string): CodeVerifier => {
  if (value.length < 43) {
    throw new Error('Code verifier must be at least 43 characters (RFC 7636)');
  }
  return value as CodeVerifier;
};

/**
 * Create a CodeChallenge branded type
 */
export const asCodeChallenge = (value: string): CodeChallenge => value as CodeChallenge;

/**
 * Create a StateValue branded type
 */
export const asStateValue = (value: string): StateValue => value as StateValue;

/**
 * Create a NonceValue branded type
 */
export const asNonceValue = (value: string): NonceValue => value as NonceValue;

/**
 * Create a ScopeString branded type
 */
export const asScopeString = (value: string): ScopeString => value as ScopeString;

/**
 * Create an IssuerURL branded type
 */
export const asIssuerURL = (value: string): IssuerURL => value as IssuerURL;

/**
 * Create a RedirectURI branded type
 */
export const asRedirectURI = (value: string): RedirectURI => value as RedirectURI;

/**
 * Create an AccessTokenString branded type
 */
export const asAccessTokenString = (value: string): AccessTokenString =>
  value as AccessTokenString;

/**
 * Create a RefreshTokenString branded type
 */
export const asRefreshTokenString = (value: string): RefreshTokenString =>
  value as RefreshTokenString;

/**
 * Create an IDTokenString branded type
 */
export const asIDTokenString = (value: string): IDTokenString => value as IDTokenString;
