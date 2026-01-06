/**
 * OAuth2/OIDC Client Configuration Types
 *
 * Type definitions for OAuth2 client configuration supporting multiple grant types.
 * Implements RFC 6749 (OAuth 2.0), RFC 7636 (PKCE), and OAuth 2.1 requirements.
 *
 * @see RFC 6749 Section 4 - Grant Types
 * @see RFC 7636 - Proof Key for Code Exchange (PKCE)
 * @see OAuth 2.1 - Authorization Code Flow with PKCE required
 *
 * @module config/client-config
 */

/**
 * OAuth2 response types
 *
 * Defines the type of response expected from the authorization endpoint.
 *
 * @see RFC 6749 Section 3.1.1 - Response Type
 * @see OIDC Core Section 3 - Authentication
 */
export enum ResponseType {
  /**
   * Authorization code response (most common, most secure)
   *
   * Used in Authorization Code Flow. The authorization server returns an
   * authorization code that is exchanged for tokens at the token endpoint.
   *
   * @see RFC 6749 Section 4.1 - Authorization Code Grant
   */
  CODE = 'code',

  /**
   * Access token response (deprecated in OAuth 2.1)
   *
   * Used in Implicit Flow. The authorization server returns the access token
   * directly in the URL fragment. This flow is deprecated due to security concerns.
   *
   * @see RFC 6749 Section 4.2 - Implicit Grant
   * @deprecated Use Authorization Code Flow with PKCE instead
   */
  TOKEN = 'token',

  /**
   * ID token response (OpenID Connect)
   *
   * Used in OpenID Connect Implicit Flow. The authorization server returns
   * an ID token directly in the URL fragment.
   *
   * @see OIDC Core Section 3.2 - Authentication using the Implicit Flow
   * @deprecated Use Authorization Code Flow with PKCE instead
   */
  ID_TOKEN = 'id_token',
}

/**
 * OAuth2 grant types
 *
 * Defines the OAuth2 flow to be used for obtaining tokens.
 *
 * @see RFC 6749 Section 4 - Obtaining Authorization
 */
export enum GrantType {
  /**
   * Authorization Code Grant
   *
   * The most secure OAuth2 flow. Requires PKCE for public clients (OAuth 2.1).
   * The client exchanges an authorization code for access and refresh tokens.
   *
   * @see RFC 6749 Section 4.1 - Authorization Code Grant
   * @see RFC 7636 - PKCE for OAuth Public Clients
   */
  AUTHORIZATION_CODE = 'authorization_code',

  /**
   * Client Credentials Grant
   *
   * Used for machine-to-machine authentication. The client uses its own
   * credentials to obtain an access token without user interaction.
   *
   * @see RFC 6749 Section 4.4 - Client Credentials Grant
   */
  CLIENT_CREDENTIALS = 'client_credentials',

  /**
   * Device Authorization Grant
   *
   * Used for devices with limited input capabilities (e.g., smart TVs, CLI tools).
   * The user authenticates on a secondary device.
   *
   * @see RFC 8628 - OAuth 2.0 Device Authorization Grant
   */
  DEVICE_CODE = 'device_code',

  /**
   * Refresh Token Grant
   *
   * Used to obtain a new access token using a refresh token.
   *
   * @see RFC 6749 Section 6 - Refreshing an Access Token
   */
  REFRESH_TOKEN = 'refresh_token',

  /**
   * Resource Owner Password Credentials Grant (deprecated in OAuth 2.1)
   *
   * The client collects the user's username and password directly.
   * This flow is deprecated due to security concerns.
   *
   * @see RFC 6749 Section 4.3 - Resource Owner Password Credentials Grant
   * @deprecated Do not use in new implementations
   */
  PASSWORD = 'password',
}

/**
 * PKCE code challenge methods
 *
 * Defines how the code challenge is generated from the code verifier.
 *
 * @see RFC 7636 Section 4.2 - Client Creates a Code Challenge
 */
export enum CodeChallengeMethod {
  /**
   * SHA-256 code challenge method (RECOMMENDED)
   *
   * The code challenge is the Base64URL-encoded SHA-256 hash of the code verifier.
   * This is the recommended and most secure method.
   *
   * Formula: code_challenge = BASE64URL(SHA256(code_verifier))
   *
   * @see RFC 7636 Section 4.2 - Client Creates a Code Challenge
   */
  S256 = 'S256',

  /**
   * Plain code challenge method (NOT RECOMMENDED)
   *
   * The code challenge is the same as the code verifier.
   * This method provides minimal security and should only be used when
   * SHA-256 is not available.
   *
   * Formula: code_challenge = code_verifier
   *
   * @see RFC 7636 Section 4.2 - Client Creates a Code Challenge
   * @deprecated Use S256 unless SHA-256 is not available
   */
  PLAIN = 'plain',
}

/**
 * OAuth2/OIDC Client Configuration
 *
 * Configuration for an OAuth2 or OpenID Connect client application.
 * Supports multiple grant types and security features.
 *
 * @example
 * ```typescript
 * const config: ClientConfig = {
 *   clientId: 'my-spa-client',
 *   redirectUri: 'http://localhost:3000/callback',
 *   responseType: ResponseType.CODE,
 *   scope: ['openid', 'profile', 'email'],
 *   grantType: GrantType.AUTHORIZATION_CODE,
 *   usePKCE: true,
 *   useState: true,
 *   useNonce: true,
 *   codeChallengeMethod: CodeChallengeMethod.S256,
 * };
 * ```
 */
export interface ClientConfig {
  /**
   * OAuth2 client identifier
   *
   * A unique identifier for the client application registered with the
   * authorization server.
   *
   * @see RFC 6749 Section 2.2 - Client Identifier
   */
  clientId: string;

  /**
   * OAuth2 client secret (optional, for confidential clients)
   *
   * A secret known only to the client and the authorization server.
   * Required for confidential clients, must not be used for public clients.
   *
   * @see RFC 6749 Section 2.3.1 - Client Password
   */
  clientSecret?: string;

  /**
   * Redirect URI for authorization callback
   *
   * The URI to which the authorization server will redirect the user after
   * authorization. Must exactly match a pre-registered URI.
   *
   * @see RFC 6749 Section 3.1.2 - Redirection Endpoint
   */
  redirectUri: string;

  /**
   * Response type for authorization request
   *
   * Determines what is returned in the authorization response.
   * For MVP, only 'code' is supported.
   *
   * @see RFC 6749 Section 3.1.1 - Response Type
   */
  responseType: ResponseType;

  /**
   * OAuth2 scopes requested
   *
   * An array of scope strings defining the access privileges requested.
   * Common scopes: 'openid', 'profile', 'email', 'offline_access'
   *
   * @see RFC 6749 Section 3.3 - Access Token Scope
   * @see OIDC Core Section 5.4 - Requesting Claims using Scope Values
   */
  scope: string[];

  /**
   * Audience for access token (optional)
   *
   * Identifies the intended recipient of the access token.
   * Useful for obtaining tokens for specific resource servers.
   *
   * @see RFC 8693 Section 4.3 - Audience
   */
  audience?: string;

  /**
   * Grant type for token request
   *
   * Determines which OAuth2 flow will be used.
   * For MVP, only AUTHORIZATION_CODE is supported.
   *
   * @see RFC 6749 Section 4 - Obtaining Authorization
   */
  grantType: GrantType;

  /**
   * Enable PKCE (Proof Key for Code Exchange)
   *
   * When true, PKCE parameters (code_challenge, code_verifier) are generated
   * and used in the authorization code flow.
   *
   * OAuth 2.1 REQUIRES PKCE for all authorization code flows.
   * For AuthOptics MVP, this should always be true.
   *
   * @see RFC 7636 - Proof Key for Code Exchange
   * @see OAuth 2.1 Section 4.1 - Authorization Code Flow (PKCE required)
   */
  usePKCE: boolean;

  /**
   * Enable state parameter for CSRF protection
   *
   * When true, a state parameter is generated and validated to prevent
   * Cross-Site Request Forgery (CSRF) attacks.
   *
   * RECOMMENDED in RFC 6749, REQUIRED in OAuth 2.1.
   *
   * @see RFC 6749 Section 10.12 - Cross-Site Request Forgery
   * @see OAuth 2.1 - State parameter required
   */
  useState?: boolean;

  /**
   * Enable nonce parameter for ID token binding
   *
   * When true, a nonce parameter is generated and included in the
   * authorization request. The nonce is then validated in the ID token.
   *
   * REQUIRED for OpenID Connect Implicit Flow.
   * RECOMMENDED for Authorization Code Flow.
   *
   * @see OIDC Core Section 3.1.2.1 - Authentication Request
   * @see OIDC Core Section 3.1.3.7 - ID Token Validation
   */
  useNonce?: boolean;

  /**
   * Code challenge method for PKCE
   *
   * Determines how the code challenge is derived from the code verifier.
   * S256 (SHA-256) is RECOMMENDED and used by default.
   *
   * @see RFC 7636 Section 4.2 - Client Creates a Code Challenge
   */
  codeChallengeMethod: CodeChallengeMethod;
}

/**
 * Type guard to check if a client is confidential
 *
 * A confidential client has a client secret and can authenticate securely
 * with the authorization server.
 *
 * @param config - Client configuration to check
 * @returns True if the client has a client secret (confidential client)
 */
export function isConfidentialClient(config: ClientConfig): boolean {
  return config.clientSecret !== undefined && config.clientSecret.length > 0;
}

/**
 * Type guard to check if a client is public
 *
 * A public client cannot securely store a client secret.
 * Public clients MUST use PKCE for authorization code flows.
 *
 * @param config - Client configuration to check
 * @returns True if the client does not have a client secret (public client)
 */
export function isPublicClient(config: ClientConfig): boolean {
  return !isConfidentialClient(config);
}

/**
 * Validate client configuration for OAuth 2.1 compliance
 *
 * Checks that the client configuration meets OAuth 2.1 security requirements:
 * - PKCE is enabled for authorization code flow
 * - State parameter is used for CSRF protection
 *
 * @param config - Client configuration to validate
 * @returns Array of validation error messages (empty if valid)
 */
export function validateClientConfig(config: ClientConfig): string[] {
  const errors: string[] = [];

  // OAuth 2.1 requires PKCE for authorization code flow
  if (config.grantType === GrantType.AUTHORIZATION_CODE && !config.usePKCE) {
    errors.push('PKCE is required for Authorization Code Flow (OAuth 2.1)');
  }

  // OAuth 2.1 requires state parameter
  if (config.grantType === GrantType.AUTHORIZATION_CODE && config.useState === false) {
    errors.push('State parameter is required for CSRF protection (OAuth 2.1)');
  }

  // Public clients must not have a client secret
  if (isPublicClient(config) && config.clientSecret !== undefined) {
    errors.push('Public clients should not have a client secret');
  }

  // Validate redirect URI format
  if (!config.redirectUri || config.redirectUri.trim().length === 0) {
    errors.push('Redirect URI is required');
  }

  // Validate scope array
  if (!config.scope || config.scope.length === 0) {
    errors.push('At least one scope is required');
  }

  return errors;
}
