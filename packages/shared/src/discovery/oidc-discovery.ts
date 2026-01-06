/**
 * OpenID Connect Discovery Document Types
 *
 * Type definitions for OpenID Connect Discovery 1.0 documents.
 * The discovery document is retrieved from the well-known configuration endpoint
 * and contains metadata about the OpenID Provider's capabilities and endpoints.
 *
 * @see OIDC Discovery Section 3 - OpenID Provider Metadata
 * @see OIDC Discovery Section 4 - Obtaining OpenID Provider Configuration
 * @see RFC 8414 - OAuth 2.0 Authorization Server Metadata
 *
 * @module discovery/oidc-discovery
 */

/**
 * OpenID Connect Discovery Document
 *
 * Metadata about an OpenID Provider's configuration and capabilities.
 * This document is typically retrieved from:
 * `{issuer}/.well-known/openid-configuration`
 *
 * For KeyCloak:
 * `http://localhost:8080/realms/oauth2-demo/.well-known/openid-configuration`
 *
 * @see OIDC Discovery Section 3 - OpenID Provider Metadata
 * @see RFC 8414 Section 2 - Authorization Server Metadata
 *
 * @example
 * ```typescript
 * // Fetching discovery document
 * const response = await fetch('http://localhost:8080/realms/oauth2-demo/.well-known/openid-configuration');
 * const discovery: OIDCDiscoveryDocument = await response.json();
 *
 * console.log('Authorization endpoint:', discovery.authorization_endpoint);
 * console.log('Token endpoint:', discovery.token_endpoint);
 * console.log('JWKS URI:', discovery.jwks_uri);
 * ```
 */
export interface OIDCDiscoveryDocument {
  /**
   * Issuer identifier
   *
   * The authorization server's issuer identifier URL.
   * This value MUST be identical to the issuer claim in ID tokens.
   *
   * @see OIDC Discovery Section 3 - issuer (REQUIRED)
   * @see OIDC Core Section 2 - ID Token
   */
  issuer: string;

  /**
   * Authorization endpoint
   *
   * URL of the authorization server's authorization endpoint.
   *
   * @see OIDC Discovery Section 3 - authorization_endpoint (REQUIRED)
   * @see RFC 6749 Section 3.1 - Authorization Endpoint
   */
  authorization_endpoint: string;

  /**
   * Token endpoint
   *
   * URL of the authorization server's token endpoint.
   *
   * @see OIDC Discovery Section 3 - token_endpoint (REQUIRED unless only Implicit Flow)
   * @see RFC 6749 Section 3.2 - Token Endpoint
   */
  token_endpoint: string;

  /**
   * UserInfo endpoint
   *
   * URL of the OpenID Connect UserInfo endpoint.
   *
   * @see OIDC Discovery Section 3 - userinfo_endpoint (RECOMMENDED)
   * @see OIDC Core Section 5.3 - UserInfo Endpoint
   */
  userinfo_endpoint?: string;

  /**
   * JSON Web Key Set URI
   *
   * URL of the authorization server's JWK Set document.
   *
   * @see OIDC Discovery Section 3 - jwks_uri (REQUIRED)
   * @see RFC 7517 - JSON Web Key (JWK)
   */
  jwks_uri: string;

  /**
   * Registration endpoint
   *
   * URL of the authorization server's dynamic client registration endpoint.
   *
   * @see OIDC Discovery Section 3 - registration_endpoint (RECOMMENDED)
   * @see OIDC Dynamic Registration - OpenID Connect Dynamic Client Registration
   */
  registration_endpoint?: string;

  /**
   * Scopes supported
   *
   * JSON array containing a list of the OAuth 2.0 scope values that this server supports.
   *
   * @see OIDC Discovery Section 3 - scopes_supported (RECOMMENDED)
   * @see RFC 6749 Section 3.3 - Access Token Scope
   */
  scopes_supported?: string[];

  /**
   * Response types supported
   *
   * JSON array containing a list of the OAuth 2.0 response_type values that this
   * authorization server supports.
   *
   * @see OIDC Discovery Section 3 - response_types_supported (REQUIRED)
   * @see OIDC Core Section 3 - Authentication
   */
  response_types_supported: string[];

  /**
   * Response modes supported
   *
   * JSON array containing a list of the OAuth 2.0 response_mode values that this
   * authorization server supports.
   *
   * @see OIDC Discovery Section 3 - response_modes_supported (OPTIONAL)
   * @see OAuth 2.0 Multiple Response Types - OAuth 2.0 Multiple Response Type Encoding Practices
   */
  response_modes_supported?: string[];

  /**
   * Grant types supported
   *
   * JSON array containing a list of the OAuth 2.0 grant type values that this
   * authorization server supports.
   *
   * @see OIDC Discovery Section 3 - grant_types_supported (OPTIONAL)
   * @see RFC 6749 Section 4 - Obtaining Authorization
   */
  grant_types_supported?: string[];

  /**
   * ACR values supported
   *
   * JSON array containing a list of the Authentication Context Class References
   * that this server supports.
   *
   * @see OIDC Discovery Section 3 - acr_values_supported (OPTIONAL)
   * @see OIDC Core Section 2 - ID Token
   */
  acr_values_supported?: string[];

  /**
   * Subject types supported
   *
   * JSON array containing a list of the Subject Identifier types that this server supports.
   * Valid values: 'pairwise', 'public'
   *
   * @see OIDC Discovery Section 3 - subject_types_supported (REQUIRED)
   * @see OIDC Core Section 8 - Subject Identifier Types
   */
  subject_types_supported: string[];

  /**
   * ID token signing algorithms supported
   *
   * JSON array containing a list of the JWS signing algorithms (alg values) supported
   * by the authorization server for the ID Token.
   *
   * @see OIDC Discovery Section 3 - id_token_signing_alg_values_supported (REQUIRED)
   * @see RFC 7518 - JSON Web Algorithms (JWA)
   */
  id_token_signing_alg_values_supported: string[];

  /**
   * ID token encryption algorithms supported
   *
   * JSON array containing a list of the JWE encryption algorithms (alg values) supported
   * by the authorization server for the ID Token.
   *
   * @see OIDC Discovery Section 3 - id_token_encryption_alg_values_supported (OPTIONAL)
   * @see RFC 7518 - JSON Web Algorithms (JWA)
   */
  id_token_encryption_alg_values_supported?: string[];

  /**
   * ID token encryption encoding algorithms supported
   *
   * JSON array containing a list of the JWE encryption algorithms (enc values) supported
   * by the authorization server for the ID Token.
   *
   * @see OIDC Discovery Section 3 - id_token_encryption_enc_values_supported (OPTIONAL)
   * @see RFC 7518 - JSON Web Algorithms (JWA)
   */
  id_token_encryption_enc_values_supported?: string[];

  /**
   * UserInfo signing algorithms supported
   *
   * JSON array containing a list of the JWS signing algorithms (alg values) supported
   * by the UserInfo endpoint.
   *
   * @see OIDC Discovery Section 3 - userinfo_signing_alg_values_supported (OPTIONAL)
   * @see RFC 7518 - JSON Web Algorithms (JWA)
   */
  userinfo_signing_alg_values_supported?: string[];

  /**
   * UserInfo encryption algorithms supported
   *
   * JSON array containing a list of the JWE encryption algorithms (alg values) supported
   * by the UserInfo endpoint.
   *
   * @see OIDC Discovery Section 3 - userinfo_encryption_alg_values_supported (OPTIONAL)
   * @see RFC 7518 - JSON Web Algorithms (JWA)
   */
  userinfo_encryption_alg_values_supported?: string[];

  /**
   * UserInfo encryption encoding algorithms supported
   *
   * JSON array containing a list of the JWE encryption algorithms (enc values) supported
   * by the UserInfo endpoint.
   *
   * @see OIDC Discovery Section 3 - userinfo_encryption_enc_values_supported (OPTIONAL)
   * @see RFC 7518 - JSON Web Algorithms (JWA)
   */
  userinfo_encryption_enc_values_supported?: string[];

  /**
   * Request object signing algorithms supported
   *
   * JSON array containing a list of the JWS signing algorithms (alg values) supported
   * for Request Objects.
   *
   * @see OIDC Discovery Section 3 - request_object_signing_alg_values_supported (OPTIONAL)
   * @see OIDC Core Section 6.1 - Passing Request Parameters as JWTs
   */
  request_object_signing_alg_values_supported?: string[];

  /**
   * Request object encryption algorithms supported
   *
   * JSON array containing a list of the JWE encryption algorithms (alg values) supported
   * for Request Objects.
   *
   * @see OIDC Discovery Section 3 - request_object_encryption_alg_values_supported (OPTIONAL)
   * @see OIDC Core Section 6.1 - Passing Request Parameters as JWTs
   */
  request_object_encryption_alg_values_supported?: string[];

  /**
   * Request object encryption encoding algorithms supported
   *
   * JSON array containing a list of the JWE encryption algorithms (enc values) supported
   * for Request Objects.
   *
   * @see OIDC Discovery Section 3 - request_object_encryption_enc_values_supported (OPTIONAL)
   * @see OIDC Core Section 6.1 - Passing Request Parameters as JWTs
   */
  request_object_encryption_enc_values_supported?: string[];

  /**
   * Token endpoint authentication methods supported
   *
   * JSON array containing a list of client authentication methods supported by the
   * token endpoint.
   *
   * @see OIDC Discovery Section 3 - token_endpoint_auth_methods_supported (OPTIONAL)
   * @see OIDC Core Section 9 - Client Authentication
   */
  token_endpoint_auth_methods_supported?: string[];

  /**
   * Token endpoint authentication signing algorithms supported
   *
   * JSON array containing a list of the JWS signing algorithms (alg values) supported
   * by the token endpoint for the signature on the JWT used to authenticate the client.
   *
   * @see OIDC Discovery Section 3 - token_endpoint_auth_signing_alg_values_supported (OPTIONAL)
   * @see OIDC Core Section 9 - Client Authentication
   */
  token_endpoint_auth_signing_alg_values_supported?: string[];

  /**
   * Display values supported
   *
   * JSON array containing a list of the display parameter values that the
   * authorization server supports.
   *
   * @see OIDC Discovery Section 3 - display_values_supported (OPTIONAL)
   * @see OIDC Core Section 3.1.2.1 - Authentication Request
   */
  display_values_supported?: string[];

  /**
   * Claim types supported
   *
   * JSON array containing a list of the Claim Types that the authorization server supports.
   * Valid values: 'normal', 'aggregated', 'distributed'
   *
   * @see OIDC Discovery Section 3 - claim_types_supported (OPTIONAL)
   * @see OIDC Core Section 5.6 - Claim Types
   */
  claim_types_supported?: string[];

  /**
   * Claims supported
   *
   * JSON array containing a list of the Claim Names that the authorization server supports.
   *
   * @see OIDC Discovery Section 3 - claims_supported (RECOMMENDED)
   * @see OIDC Core Section 5.1 - Standard Claims
   */
  claims_supported?: string[];

  /**
   * Service documentation URL
   *
   * URL of a page containing human-readable information that developers might want or need
   * to know when using the authorization server.
   *
   * @see OIDC Discovery Section 3 - service_documentation (OPTIONAL)
   */
  service_documentation?: string;

  /**
   * Claims locales supported
   *
   * Languages and scripts supported for values in Claims being returned.
   *
   * @see OIDC Discovery Section 3 - claims_locales_supported (OPTIONAL)
   * @see OIDC Core Section 5.2 - Claims Languages and Scripts
   */
  claims_locales_supported?: string[];

  /**
   * UI locales supported
   *
   * Languages and scripts supported for the user interface.
   *
   * @see OIDC Discovery Section 3 - ui_locales_supported (OPTIONAL)
   * @see OIDC Core Section 3.1.2.1 - Authentication Request
   */
  ui_locales_supported?: string[];

  /**
   * Claims parameter supported
   *
   * Boolean value specifying whether the authorization server supports use of the
   * claims parameter.
   *
   * @see OIDC Discovery Section 3 - claims_parameter_supported (OPTIONAL)
   * @see OIDC Core Section 5.5 - Requesting Claims using the "claims" Request Parameter
   */
  claims_parameter_supported?: boolean;

  /**
   * Request parameter supported
   *
   * Boolean value specifying whether the authorization server supports use of the
   * request parameter.
   *
   * @see OIDC Discovery Section 3 - request_parameter_supported (OPTIONAL)
   * @see OIDC Core Section 6.1 - Passing Request Parameters as JWTs
   */
  request_parameter_supported?: boolean;

  /**
   * Request URI parameter supported
   *
   * Boolean value specifying whether the authorization server supports use of the
   * request_uri parameter.
   *
   * @see OIDC Discovery Section 3 - request_uri_parameter_supported (OPTIONAL)
   * @see OIDC Core Section 6.2 - Passing a Request Object by Reference
   */
  request_uri_parameter_supported?: boolean;

  /**
   * Require request URI registration
   *
   * Boolean value specifying whether the authorization server requires any request_uri
   * values used to be pre-registered.
   *
   * @see OIDC Discovery Section 3 - require_request_uri_registration (OPTIONAL)
   * @see OIDC Core Section 6.2 - Passing a Request Object by Reference
   */
  require_request_uri_registration?: boolean;

  /**
   * OP policy URI
   *
   * URL that the authorization server provides to the person registering the client
   * to read about the authorization server's requirements on how the client can use
   * the data provided by the authorization server.
   *
   * @see OIDC Discovery Section 3 - op_policy_uri (OPTIONAL)
   */
  op_policy_uri?: string;

  /**
   * OP terms of service URI
   *
   * URL that the authorization server provides to the person registering the client
   * to read about the authorization server's terms of service.
   *
   * @see OIDC Discovery Section 3 - op_tos_uri (OPTIONAL)
   */
  op_tos_uri?: string;

  /**
   * Revocation endpoint
   *
   * URL of the authorization server's OAuth 2.0 revocation endpoint.
   *
   * @see RFC 7009 - OAuth 2.0 Token Revocation
   * @see RFC 8414 Section 2 - revocation_endpoint
   */
  revocation_endpoint?: string;

  /**
   * Revocation endpoint authentication methods supported
   *
   * JSON array containing a list of client authentication methods supported by the
   * revocation endpoint.
   *
   * @see RFC 8414 Section 2 - revocation_endpoint_auth_methods_supported
   */
  revocation_endpoint_auth_methods_supported?: string[];

  /**
   * Introspection endpoint
   *
   * URL of the authorization server's OAuth 2.0 introspection endpoint.
   *
   * @see RFC 7662 - OAuth 2.0 Token Introspection
   * @see RFC 8414 Section 2 - introspection_endpoint
   */
  introspection_endpoint?: string;

  /**
   * Introspection endpoint authentication methods supported
   *
   * JSON array containing a list of client authentication methods supported by the
   * introspection endpoint.
   *
   * @see RFC 8414 Section 2 - introspection_endpoint_auth_methods_supported
   */
  introspection_endpoint_auth_methods_supported?: string[];

  /**
   * Code challenge methods supported
   *
   * JSON array containing a list of PKCE code challenge methods supported.
   * Values: 'plain', 'S256'
   *
   * @see RFC 7636 Section 4.2 - Client Creates a Code Challenge
   * @see RFC 8414 Section 2 - code_challenge_methods_supported
   */
  code_challenge_methods_supported?: string[];

  /**
   * End session endpoint
   *
   * URL of the authorization server's RP-initiated logout endpoint.
   *
   * @see OIDC Session Management - RP-Initiated Logout
   */
  end_session_endpoint?: string;

  /**
   * Check session iframe
   *
   * URL of an iframe that supports cross-origin communications for session state information.
   *
   * @see OIDC Session Management - Session Management
   */
  check_session_iframe?: string;
}

/**
 * Type guard to check if discovery document supports PKCE
 *
 * @param doc - OIDC discovery document
 * @returns True if PKCE is supported
 */
export function oidcSupportsPKCE(doc: OIDCDiscoveryDocument): boolean {
  return (
    doc.code_challenge_methods_supported !== undefined &&
    doc.code_challenge_methods_supported.length > 0
  );
}

/**
 * Type guard to check if discovery document supports a specific response type
 *
 * @param doc - OIDC discovery document
 * @param responseType - Response type to check (e.g., 'code')
 * @returns True if the response type is supported
 */
export function oidcSupportsResponseType(
  doc: OIDCDiscoveryDocument,
  responseType: string
): boolean {
  return doc.response_types_supported.includes(responseType);
}

/**
 * Type guard to check if discovery document supports a specific grant type
 *
 * @param doc - OIDC discovery document
 * @param grantType - Grant type to check (e.g., 'authorization_code')
 * @returns True if the grant type is supported
 */
export function oidcSupportsGrantType(
  doc: OIDCDiscoveryDocument,
  grantType: string
): boolean {
  return (
    doc.grant_types_supported !== undefined &&
    doc.grant_types_supported.includes(grantType)
  );
}
