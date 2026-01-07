/**
 * OAuth2/OIDC Authorization Server Configuration Types
 *
 * Type definitions for OAuth2 authorization server endpoints and capabilities.
 * Implements RFC 8414 (OAuth 2.0 Authorization Server Metadata) and
 * OpenID Connect Discovery specifications.
 *
 * @see RFC 8414 - OAuth 2.0 Authorization Server Metadata
 * @see OIDC Discovery - OpenID Connect Discovery 1.0
 *
 * @module config/server-config
 */

/**
 * OAuth2/OIDC Authorization Server Configuration
 *
 * Configuration for an OAuth2 authorization server or OpenID Connect provider.
 * This interface represents the essential information needed to interact with
 * an authorization server, typically obtained from the discovery endpoint.
 *
 * For KeyCloak, this information is available at:
 * `{KEYCLOAK_URL}/realms/{realm}/.well-known/openid-configuration`
 *
 * @example
 * ```typescript
 * const serverConfig: ServerConfig = {
 *   issuer: 'http://localhost:8080/realms/oauth2-demo',
 *   authorizationEndpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/auth',
 *   tokenEndpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/token',
 *   jwksUri: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/certs',
 *   userInfoEndpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/userinfo',
 *   supportedScopes: ['openid', 'profile', 'email', 'offline_access'],
 *   supportedResponseTypes: ['code', 'id_token', 'token id_token'],
 *   supportedGrantTypes: ['authorization_code', 'refresh_token', 'client_credentials'],
 * };
 * ```
 */
export interface ServerConfig {
  /**
   * Issuer identifier
   *
   * The authorization server's issuer identifier URL.
   * Must match the 'iss' claim in issued tokens.
   *
   * @see RFC 8414 Section 2 - Authorization Server Metadata
   * @see OIDC Discovery Section 3 - OpenID Provider Metadata
   */
  issuer: string;

  /**
   * Authorization endpoint URL
   *
   * The URL of the authorization server's authorization endpoint.
   * Used to initiate the authorization code flow.
   *
   * @see RFC 6749 Section 3.1 - Authorization Endpoint
   * @see RFC 8414 Section 2 - authorization_endpoint
   */
  authorizationEndpoint: string;

  /**
   * Token endpoint URL
   *
   * The URL of the authorization server's token endpoint.
   * Used to exchange authorization codes for tokens.
   *
   * @see RFC 6749 Section 3.2 - Token Endpoint
   * @see RFC 8414 Section 2 - token_endpoint
   */
  tokenEndpoint: string;

  /**
   * UserInfo endpoint URL (optional, OIDC only)
   *
   * The URL of the OpenID Connect UserInfo endpoint.
   * Used to retrieve claims about the authenticated user.
   *
   * @see OIDC Core Section 5.3 - UserInfo Endpoint
   */
  userInfoEndpoint?: string;

  /**
   * JSON Web Key Set (JWKS) URI
   *
   * The URL of the authorization server's JWK Set document.
   * Used to obtain public keys for verifying token signatures.
   *
   * @see RFC 7517 - JSON Web Key (JWK)
   * @see RFC 8414 Section 2 - jwks_uri
   */
  jwksUri: string;

  /**
   * Token revocation endpoint URL (optional)
   *
   * The URL of the authorization server's token revocation endpoint.
   * Used to revoke access tokens and refresh tokens.
   *
   * @see RFC 7009 - OAuth 2.0 Token Revocation
   * @see RFC 8414 Section 2 - revocation_endpoint
   */
  revocationEndpoint?: string;

  /**
   * Token introspection endpoint URL (optional)
   *
   * The URL of the authorization server's token introspection endpoint.
   * Used to query the status and metadata of a token.
   *
   * @see RFC 7662 - OAuth 2.0 Token Introspection
   * @see RFC 8414 Section 2 - introspection_endpoint
   */
  introspectionEndpoint?: string;

  /**
   * Registration endpoint URL (optional)
   *
   * The URL of the authorization server's dynamic client registration endpoint.
   * Used to register new OAuth2 clients programmatically.
   *
   * @see RFC 7591 - OAuth 2.0 Dynamic Client Registration Protocol
   * @see RFC 8414 Section 2 - registration_endpoint
   */
  registrationEndpoint?: string;

  /**
   * Discovery document URL (optional)
   *
   * The URL of the well-known configuration endpoint.
   * Typically: `{issuer}/.well-known/openid-configuration`
   *
   * @see RFC 8414 - OAuth 2.0 Authorization Server Metadata
   * @see OIDC Discovery Section 4 - Obtaining OpenID Provider Configuration
   */
  discoveryUrl?: string;

  /**
   * End session endpoint URL (optional, OIDC only)
   *
   * The URL of the OpenID Connect RP-initiated logout endpoint.
   * Used to log the user out of the authorization server.
   *
   * @see OIDC Session Management - RP-Initiated Logout
   */
  endSessionEndpoint?: string;

  /**
   * Supported OAuth2 scopes
   *
   * Array of scope values supported by the authorization server.
   * Common scopes: openid, profile, email, address, phone, offline_access
   *
   * @see RFC 6749 Section 3.3 - Access Token Scope
   * @see OIDC Core Section 5.4 - Requesting Claims using Scope Values
   */
  supportedScopes: string[];

  /**
   * Supported response types
   *
   * Array of OAuth2 response_type values supported by the authorization server.
   * Examples: 'code', 'token', 'id_token', 'code id_token', 'token id_token'
   *
   * @see RFC 6749 Section 3.1.1 - Response Type
   * @see OIDC Core Section 3 - Authentication
   */
  supportedResponseTypes: string[];

  /**
   * Supported grant types
   *
   * Array of OAuth2 grant_type values supported by the authorization server.
   * Examples: 'authorization_code', 'refresh_token', 'client_credentials', 'device_code'
   *
   * @see RFC 6749 Section 4 - Obtaining Authorization
   * @see RFC 8414 Section 2 - grant_types_supported
   */
  supportedGrantTypes: string[];

  /**
   * Supported token endpoint authentication methods (optional)
   *
   * Array of client authentication methods supported at the token endpoint.
   * Examples: 'client_secret_basic', 'client_secret_post', 'private_key_jwt'
   *
   * @see RFC 6749 Section 2.3 - Client Authentication
   * @see RFC 8414 Section 2 - token_endpoint_auth_methods_supported
   */
  supportedTokenAuthMethods?: string[];

  /**
   * Supported code challenge methods (optional, PKCE)
   *
   * Array of PKCE code challenge methods supported.
   * Values: 'plain', 'S256'
   *
   * @see RFC 7636 Section 4.2 - Client Creates a Code Challenge
   * @see RFC 8414 Section 2 - code_challenge_methods_supported
   */
  supportedCodeChallengeMethods?: string[];
}

/**
 * Type guard to check if server supports PKCE
 *
 * Checks if the authorization server supports PKCE (Proof Key for Code Exchange).
 *
 * @param config - Server configuration to check
 * @returns True if server supports PKCE (has code challenge methods)
 */
export function serverSupportsPKCE(config: ServerConfig): boolean {
  return (
    config.supportedCodeChallengeMethods !== undefined &&
    config.supportedCodeChallengeMethods.length > 0
  );
}

/**
 * Type guard to check if server supports OpenID Connect
 *
 * Checks if the authorization server supports OpenID Connect by looking for
 * the 'openid' scope and UserInfo endpoint.
 *
 * @param config - Server configuration to check
 * @returns True if server supports OIDC (has openid scope and userinfo endpoint)
 */
export function serverSupportsOIDC(config: ServerConfig): boolean {
  return (
    config.supportedScopes.includes('openid') &&
    config.userInfoEndpoint !== undefined
  );
}

/**
 * Type guard to check if server supports a specific grant type
 *
 * @param config - Server configuration to check
 * @param grantType - Grant type to check (e.g., 'authorization_code')
 * @returns True if the grant type is supported
 */
export function serverSupportsGrantType(config: ServerConfig, grantType: string): boolean {
  return config.supportedGrantTypes.includes(grantType);
}

/**
 * Type guard to check if server supports a specific scope
 *
 * @param config - Server configuration to check
 * @param scope - Scope to check (e.g., 'profile')
 * @returns True if the scope is supported
 */
export function serverSupportsScope(config: ServerConfig, scope: string): boolean {
  return config.supportedScopes.includes(scope);
}

/**
 * Validate server configuration
 *
 * Checks that the server configuration has all required fields and valid URLs.
 *
 * @param config - Server configuration to validate
 * @returns Array of validation error messages (empty if valid)
 */
export function validateServerConfig(config: ServerConfig): string[] {
  const errors: string[] = [];

  // Required fields
  if (!config.issuer || config.issuer.trim().length === 0) {
    errors.push('Issuer is required');
  }

  if (!config.authorizationEndpoint || config.authorizationEndpoint.trim().length === 0) {
    errors.push('Authorization endpoint is required');
  }

  if (!config.tokenEndpoint || config.tokenEndpoint.trim().length === 0) {
    errors.push('Token endpoint is required');
  }

  if (!config.jwksUri || config.jwksUri.trim().length === 0) {
    errors.push('JWKS URI is required');
  }

  // Validate URLs (basic validation - check for http/https protocol)
  if (!config.issuer.startsWith('http://') && !config.issuer.startsWith('https://')) {
    errors.push('Issuer must be a valid URL starting with http:// or https://');
  }

  if (
    !config.authorizationEndpoint.startsWith('http://') &&
    !config.authorizationEndpoint.startsWith('https://')
  ) {
    errors.push(
      'Authorization endpoint must be a valid URL starting with http:// or https://'
    );
  }

  if (
    !config.tokenEndpoint.startsWith('http://') &&
    !config.tokenEndpoint.startsWith('https://')
  ) {
    errors.push('Token endpoint must be a valid URL starting with http:// or https://');
  }

  if (!config.jwksUri.startsWith('http://') && !config.jwksUri.startsWith('https://')) {
    errors.push('JWKS URI must be a valid URL starting with http:// or https://');
  }

  // Validate arrays
  if (!config.supportedScopes || config.supportedScopes.length === 0) {
    errors.push('At least one supported scope is required');
  }

  if (!config.supportedResponseTypes || config.supportedResponseTypes.length === 0) {
    errors.push('At least one supported response type is required');
  }

  if (!config.supportedGrantTypes || config.supportedGrantTypes.length === 0) {
    errors.push('At least one supported grant type is required');
  }

  return errors;
}
