/**
 * OAuth 2.0 Authorization Server Metadata Types
 *
 * Type definitions for OAuth 2.0 Authorization Server Metadata as defined in RFC 8414.
 * This is the OAuth 2.0-specific metadata, separate from OIDC-specific extensions.
 *
 * @see RFC 8414 - OAuth 2.0 Authorization Server Metadata
 *
 * @module discovery/oauth-metadata
 */

/**
 * OAuth 2.0 Authorization Server Metadata
 *
 * Metadata about an OAuth 2.0 authorization server's configuration and capabilities.
 * This document is typically retrieved from:
 * `{issuer}/.well-known/oauth-authorization-server`
 *
 * Note: For OpenID Connect, use OIDCDiscoveryDocument instead, which extends this
 * with OIDC-specific fields.
 *
 * @see RFC 8414 Section 2 - Authorization Server Metadata
 * @see RFC 8414 Section 3 - Obtaining Authorization Server Metadata
 *
 * @example
 * ```typescript
 * // Fetching OAuth 2.0 metadata
 * const response = await fetch('https://auth.example.com/.well-known/oauth-authorization-server');
 * const metadata: OAuth2Metadata = await response.json();
 *
 * console.log('Issuer:', metadata.issuer);
 * console.log('Token endpoint:', metadata.token_endpoint);
 * console.log('Supported grant types:', metadata.grant_types_supported);
 * ```
 */
export interface OAuth2Metadata {
  /**
   * Issuer identifier
   *
   * The authorization server's issuer identifier URL.
   * This value MUST be identical to the issuer claim in issued tokens.
   *
   * @see RFC 8414 Section 2 - issuer (REQUIRED)
   */
  issuer: string;

  /**
   * Authorization endpoint
   *
   * URL of the authorization server's authorization endpoint.
   *
   * @see RFC 8414 Section 2 - authorization_endpoint (OPTIONAL)
   * @see RFC 6749 Section 3.1 - Authorization Endpoint
   */
  authorization_endpoint?: string;

  /**
   * Token endpoint
   *
   * URL of the authorization server's token endpoint.
   *
   * @see RFC 8414 Section 2 - token_endpoint (REQUIRED unless only Implicit Flow)
   * @see RFC 6749 Section 3.2 - Token Endpoint
   */
  token_endpoint: string;

  /**
   * JSON Web Key Set URI
   *
   * URL of the authorization server's JWK Set document.
   *
   * @see RFC 8414 Section 2 - jwks_uri (OPTIONAL)
   * @see RFC 7517 - JSON Web Key (JWK)
   */
  jwks_uri?: string;

  /**
   * Registration endpoint
   *
   * URL of the authorization server's OAuth 2.0 dynamic client registration endpoint.
   *
   * @see RFC 8414 Section 2 - registration_endpoint (OPTIONAL)
   * @see RFC 7591 - OAuth 2.0 Dynamic Client Registration Protocol
   */
  registration_endpoint?: string;

  /**
   * Scopes supported
   *
   * JSON array containing a list of the OAuth 2.0 scope values that this server supports.
   *
   * @see RFC 8414 Section 2 - scopes_supported (RECOMMENDED)
   * @see RFC 6749 Section 3.3 - Access Token Scope
   */
  scopes_supported?: string[];

  /**
   * Response types supported
   *
   * JSON array containing a list of the OAuth 2.0 response_type values that this
   * authorization server supports.
   *
   * @see RFC 8414 Section 2 - response_types_supported (REQUIRED)
   * @see RFC 6749 Section 3.1.1 - Response Type
   */
  response_types_supported: string[];

  /**
   * Response modes supported
   *
   * JSON array containing a list of the OAuth 2.0 response_mode values that this
   * authorization server supports.
   *
   * @see RFC 8414 Section 2 - response_modes_supported (OPTIONAL)
   * @see OAuth 2.0 Multiple Response Types
   */
  response_modes_supported?: string[];

  /**
   * Grant types supported
   *
   * JSON array containing a list of the OAuth 2.0 grant type values that this
   * authorization server supports.
   *
   * Default if omitted: ['authorization_code', 'implicit']
   *
   * @see RFC 8414 Section 2 - grant_types_supported (OPTIONAL)
   * @see RFC 6749 Section 4 - Obtaining Authorization
   */
  grant_types_supported?: string[];

  /**
   * Token endpoint authentication methods supported
   *
   * JSON array containing a list of client authentication methods supported by the
   * token endpoint.
   *
   * Default if omitted: ['client_secret_basic']
   *
   * @see RFC 8414 Section 2 - token_endpoint_auth_methods_supported (OPTIONAL)
   * @see RFC 6749 Section 2.3 - Client Authentication
   */
  token_endpoint_auth_methods_supported?: string[];

  /**
   * Token endpoint authentication signing algorithms supported
   *
   * JSON array containing a list of the JWS signing algorithms (alg values) supported
   * by the token endpoint for the signature on the JWT used to authenticate the client
   * at the token endpoint for the private_key_jwt and client_secret_jwt authentication methods.
   *
   * @see RFC 8414 Section 2 - token_endpoint_auth_signing_alg_values_supported (OPTIONAL)
   * @see RFC 7518 - JSON Web Algorithms (JWA)
   */
  token_endpoint_auth_signing_alg_values_supported?: string[];

  /**
   * Service documentation URL
   *
   * URL of a page containing human-readable information that developers might want or need
   * to know when using the authorization server.
   *
   * @see RFC 8414 Section 2 - service_documentation (OPTIONAL)
   */
  service_documentation?: string;

  /**
   * UI locales supported
   *
   * Languages and scripts supported for the user interface, represented as a JSON array
   * of BCP47 language tag values.
   *
   * @see RFC 8414 Section 2 - ui_locales_supported (OPTIONAL)
   * @see BCP47 - Tags for Identifying Languages
   */
  ui_locales_supported?: string[];

  /**
   * OP policy URI
   *
   * URL that the authorization server provides to the person registering the client
   * to read about the authorization server's requirements on how the client can use
   * the data provided by the authorization server.
   *
   * @see RFC 8414 Section 2 - op_policy_uri (OPTIONAL)
   */
  op_policy_uri?: string;

  /**
   * OP terms of service URI
   *
   * URL that the authorization server provides to the person registering the client
   * to read about the authorization server's terms of service.
   *
   * @see RFC 8414 Section 2 - op_tos_uri (OPTIONAL)
   */
  op_tos_uri?: string;

  /**
   * Revocation endpoint
   *
   * URL of the authorization server's OAuth 2.0 revocation endpoint.
   *
   * @see RFC 8414 Section 2 - revocation_endpoint (OPTIONAL)
   * @see RFC 7009 - OAuth 2.0 Token Revocation
   */
  revocation_endpoint?: string;

  /**
   * Revocation endpoint authentication methods supported
   *
   * JSON array containing a list of client authentication methods supported by the
   * revocation endpoint.
   *
   * @see RFC 8414 Section 2 - revocation_endpoint_auth_methods_supported (OPTIONAL)
   */
  revocation_endpoint_auth_methods_supported?: string[];

  /**
   * Revocation endpoint authentication signing algorithms supported
   *
   * JSON array containing a list of the JWS signing algorithms (alg values) supported
   * by the revocation endpoint for the signature on the JWT used to authenticate the
   * client at the revocation endpoint.
   *
   * @see RFC 8414 Section 2 - revocation_endpoint_auth_signing_alg_values_supported (OPTIONAL)
   */
  revocation_endpoint_auth_signing_alg_values_supported?: string[];

  /**
   * Introspection endpoint
   *
   * URL of the authorization server's OAuth 2.0 introspection endpoint.
   *
   * @see RFC 8414 Section 2 - introspection_endpoint (OPTIONAL)
   * @see RFC 7662 - OAuth 2.0 Token Introspection
   */
  introspection_endpoint?: string;

  /**
   * Introspection endpoint authentication methods supported
   *
   * JSON array containing a list of client authentication methods supported by the
   * introspection endpoint.
   *
   * @see RFC 8414 Section 2 - introspection_endpoint_auth_methods_supported (OPTIONAL)
   */
  introspection_endpoint_auth_methods_supported?: string[];

  /**
   * Introspection endpoint authentication signing algorithms supported
   *
   * JSON array containing a list of the JWS signing algorithms (alg values) supported
   * by the introspection endpoint for the signature on the JWT used to authenticate the
   * client at the introspection endpoint.
   *
   * @see RFC 8414 Section 2 - introspection_endpoint_auth_signing_alg_values_supported (OPTIONAL)
   */
  introspection_endpoint_auth_signing_alg_values_supported?: string[];

  /**
   * Code challenge methods supported
   *
   * JSON array containing a list of PKCE code challenge methods supported by this
   * authorization server.
   *
   * Values: 'plain', 'S256'
   *
   * @see RFC 8414 Section 2 - code_challenge_methods_supported (OPTIONAL)
   * @see RFC 7636 - Proof Key for Code Exchange by OAuth Public Clients
   */
  code_challenge_methods_supported?: string[];

  /**
   * Signed metadata
   *
   * A JWT containing metadata values about the authorization server as claims.
   *
   * @see RFC 8414 Section 2.1 - Signed Authorization Server Metadata
   */
  signed_metadata?: string;
}

/**
 * Type guard to check if metadata supports PKCE
 *
 * @param metadata - OAuth 2.0 metadata
 * @returns True if PKCE is supported
 */
export function oauth2SupportsPKCE(metadata: OAuth2Metadata): boolean {
  return (
    metadata.code_challenge_methods_supported !== undefined &&
    metadata.code_challenge_methods_supported.length > 0
  );
}

/**
 * Type guard to check if metadata supports a specific grant type
 *
 * @param metadata - OAuth 2.0 metadata
 * @param grantType - Grant type to check (e.g., 'authorization_code')
 * @returns True if the grant type is supported
 */
export function oauth2SupportsGrantType(
  metadata: OAuth2Metadata,
  grantType: string
): boolean {
  // Default grant types if not specified: authorization_code, implicit
  const supportedGrantTypes = metadata.grant_types_supported || [
    'authorization_code',
    'implicit',
  ];
  return supportedGrantTypes.includes(grantType);
}

/**
 * Type guard to check if metadata supports a specific response type
 *
 * @param metadata - OAuth 2.0 metadata
 * @param responseType - Response type to check (e.g., 'code')
 * @returns True if the response type is supported
 */
export function oauth2SupportsResponseType(
  metadata: OAuth2Metadata,
  responseType: string
): boolean {
  return metadata.response_types_supported.includes(responseType);
}

/**
 * Type guard to check if metadata supports a specific scope
 *
 * @param metadata - OAuth 2.0 metadata
 * @param scope - Scope to check (e.g., 'profile')
 * @returns True if the scope is supported
 */
export function oauth2SupportsScope(metadata: OAuth2Metadata, scope: string): boolean {
  return (
    metadata.scopes_supported !== undefined &&
    metadata.scopes_supported.includes(scope)
  );
}

/**
 * Get default token authentication method
 *
 * Returns the default token endpoint authentication method if none are specified.
 *
 * @param metadata - OAuth 2.0 metadata
 * @returns Default token authentication method ('client_secret_basic')
 */
export function getDefaultTokenAuthMethod(metadata: OAuth2Metadata): string {
  if (
    metadata.token_endpoint_auth_methods_supported &&
    metadata.token_endpoint_auth_methods_supported.length > 0
  ) {
    return metadata.token_endpoint_auth_methods_supported[0];
  }
  return 'client_secret_basic';
}
