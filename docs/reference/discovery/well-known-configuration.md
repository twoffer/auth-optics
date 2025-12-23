# OIDC Discovery and .well-known/openid-configuration

> "The Guide is definitive. Reality is frequently inaccurate."
> 
> Much like The Hitchhiker's Guide to the Galaxy, OIDC Discovery provides definitive configuration information that prevents clients from making assumptions about reality that are frequently inaccurate. Unlike the Guide's advice about towels, discovery tells you where the actual endpoints are.

## Document Purpose

This document provides authoritative reference for OpenID Connect Discovery 1.0 and OAuth 2.0 Authorization Server Metadata (RFC 8414), targeting security professionals implementing discovery mechanisms, debugging configuration issues, or auditing authorization server capabilities.

**Primary Use Cases:**
- Implementing OIDC Discovery endpoints in authorization servers
- Configuring clients to use dynamic discovery
- Debugging client configuration issues
- Auditing authorization server capabilities
- Understanding multi-tenant discovery scenarios
- Troubleshooting discovery-related failures

**Target Audience:** Security professionals, OAuth2/OIDC implementers, security auditors, penetration testers, and developers debugging authentication issues.

## Table of Contents

1. [Overview](#overview)
2. [Discovery Endpoint Specification](#discovery-endpoint-specification)
3. [Issuer Identifier](#issuer-identifier)
4. [Discovery Response Structure](#discovery-response-structure)
5. [Complete Discovery Response Example](#complete-discovery-response-example)
6. [Core Metadata Fields](#core-metadata-fields)
7. [OAuth2-Specific Metadata (RFC 8414)](#oauth2-specific-metadata-rfc-8414)
8. [Endpoint URLs and HTTPS Requirements](#endpoint-urls-and-https-requirements)
9. [Supported Features Advertisement](#supported-features-advertisement)
10. [Client Authentication Methods](#client-authentication-methods)
11. [PKCE Support Advertisement](#pkce-support-advertisement)
12. [Advanced Features](#advanced-features)
13. [Client Discovery Process](#client-discovery-process)
14. [Discovery Response Validation](#discovery-response-validation)
15. [Issuer Identifier Validation](#issuer-identifier-validation)
16. [Dynamic Updates and Configuration Changes](#dynamic-updates-and-configuration-changes)
17. [Multi-Tenant Scenarios](#multi-tenant-scenarios)
18. [Security Considerations](#security-considerations)
19. [Implementation Checklist](#implementation-checklist)
20. [Discovery in Different Deployment Scenarios](#discovery-in-different-deployment-scenarios)
21. [Example Client Configuration Using Discovery](#example-client-configuration-using-discovery)
22. [Troubleshooting Discovery Issues](#troubleshooting-discovery-issues)
23. [Discovery vs Manual Configuration](#discovery-vs-manual-configuration)
24. [Related Specifications](#related-specifications)
25. [Example Scenarios](#example-scenarios)

---

## Overview

**Purpose:** OIDC Discovery provides dynamic discovery of authorization server configuration, eliminating the need for hardcoded endpoint URLs and configuration values in client applications.

**Primary Specifications:**
- OpenID Connect Discovery 1.0 §4: OpenID Provider Metadata
- RFC 8414: OAuth 2.0 Authorization Server Metadata
- RFC 7517: JSON Web Key (JWK) for JWKS endpoint

**Discovery Endpoint:** `/.well-known/openid-configuration`

**Alternative Endpoint (OAuth 2.0 only):** `/.well-known/oauth-authorization-server`

### Why Discovery Matters

Before discovery, clients needed to hardcode:
```python
# The bad old days
authorization_endpoint = "https://auth.example.com/authorize"
token_endpoint = "https://auth.example.com/token"
jwks_uri = "https://auth.example.com/keys"
```

With discovery, clients automatically fetch current configuration:
```python
# The enlightened present
config = fetch_discovery(issuer_url)
authorization_endpoint = config['authorization_endpoint']
token_endpoint = config['token_endpoint']
jwks_uri = config['jwks_uri']
```

**Benefits:**
1. **Automatic Configuration:** Clients configure themselves from authoritative source
2. **Capability Advertisement:** Authorization servers advertise supported features
3. **Reduced Errors:** Eliminates hardcoded configuration mistakes
4. **Future-Proof:** New endpoints added without client updates
5. **Environment Management:** Different configurations per environment (dev/staging/prod)
6. **Multi-Tenant Support:** Different configurations per tenant

### Discovery Flow Diagram

```
┌──────────┐                                    ┌─────────────────────┐
│  Client  │                                    │ Authorization Server│
└─────┬────┘                                    └──────────┬──────────┘
      │                                                    │
      │ 1. GET /.well-known/openid-configuration          │
      │───────────────────────────────────────────────────>│
      │                                                    │
      │                              2. Discovery Response │
      │ {                                                  │
      │   "issuer": "https://auth.example.com",           │
      │   "authorization_endpoint": "...",                 │
      │   "token_endpoint": "...",                         │
      │   "jwks_uri": "...",                               │
      │   ...                                              │
      │ }                                                  │
      │<───────────────────────────────────────────────────│
      │                                                    │
      │ 3. Cache configuration                             │
      │                                                    │
      │ 4. Use endpoints for OAuth2/OIDC flows             │
      │                                                    │
```

---

## Discovery Endpoint Specification

**Specification:** OpenID Connect Discovery 1.0 §4

### Endpoint Path

**Format:** `/.well-known/openid-configuration`

**Construction:** `{issuer}/.well-known/openid-configuration`

### Examples

| Issuer URL | Discovery URL |
|------------|---------------|
| `https://auth.example.com` | `https://auth.example.com/.well-known/openid-configuration` |
| `https://example.com/oauth2` | `https://example.com/.well-known/openid-configuration` |
| `https://accounts.google.com` | `https://accounts.google.com/.well-known/openid-configuration` |
| `https://login.microsoftonline.com/common` | `https://login.microsoftonline.com/.well-known/openid-configuration` |

**Note:** The discovery URL is constructed by appending `/.well-known/openid-configuration` to the issuer URL. If the issuer has a path component, it is preserved in the discovery URL construction.

### HTTP Method

**Method:** `GET`

**Authentication:** None required (public endpoint)

**Request Headers:**
```http
GET /.well-known/openid-configuration HTTP/1.1
Host: auth.example.com
Accept: application/json
```

### Response Format

**Status Code:** `200 OK` for success

**Content-Type:** `application/json`

**Response Body:** JSON document containing authorization server metadata

**Error Responses:**
- `404 Not Found`: Discovery not supported or issuer incorrect
- `500 Internal Server Error`: Authorization server error
- `503 Service Unavailable`: Temporary unavailability

### Response Example (Minimal)

```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "jwks_uri": "https://auth.example.com/.well-known/jwks.json",
  "response_types_supported": ["code", "id_token", "token id_token"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"]
}
```

---

## Issuer Identifier

**Specification:** OpenID Connect Discovery 1.0 §2, §3

### Definition

The **issuer identifier** is a URL that identifies the authorization server. It MUST be an HTTPS URL and is used to construct the discovery URL.

### Format Requirements (OIDC Discovery §2)

An issuer identifier MUST meet these requirements:

1. **HTTPS Scheme:** MUST use `https://` scheme (RFC 2119: MUST)
2. **No Query Component:** MUST NOT contain a query component
3. **No Fragment Component:** MUST NOT contain a fragment identifier
4. **Case-Sensitive:** Compared as case-sensitive strings

### Valid Issuer Examples

```
https://auth.example.com
https://example.com/oauth2
https://accounts.google.com
https://login.microsoftonline.com/common
https://auth.example.com:8443
```

### Invalid Issuer Examples

```
http://auth.example.com                    ❌ HTTP not allowed
https://auth.example.com?tenant=foo        ❌ Query not allowed
https://auth.example.com#section1          ❌ Fragment not allowed
auth.example.com                           ❌ Missing scheme
```

### Issuer and Token Validation

The `issuer` field in the discovery response MUST exactly match the `iss` claim in all tokens issued by the authorization server.

**Token Validation Rule:**
```python
# Client validates ID token or access token
def validate_token_issuer(token, expected_issuer):
    claims = decode_jwt(token)
    if claims['iss'] != expected_issuer:
        raise InvalidTokenError("Issuer mismatch")
```

**Security Implication:** This prevents issuer substitution attacks where an attacker could use tokens from one authorization server with another.

### Discovery URL Construction

**Algorithm (OIDC Discovery §3):**

1. Start with issuer URL (e.g., `https://auth.example.com`)
2. Append `/.well-known/openid-configuration`
3. Result: `https://auth.example.com/.well-known/openid-configuration`

**Path Preservation:**

If issuer includes a path:
```
Issuer: https://example.com/oauth2
Discovery: https://example.com/.well-known/openid-configuration
```

**Note:** The `/.well-known/` component is added at the root of the host, not appended to the issuer's path.

**Specification Reference:** The exact construction rules are in OpenID Connect Discovery 1.0 §3: "Obtaining OpenID Provider Configuration Information."

### Trailing Slash Handling

**Question:** Does `https://auth.example.com` differ from `https://auth.example.com/`?

**Answer:** Treat them as the same for issuer identifier purposes, but be consistent. Remove trailing slashes when storing issuer identifiers.

```python
# Normalize issuer
def normalize_issuer(issuer_url):
    return issuer_url.rstrip('/')
```

---

## Discovery Response Structure

**Specification:** OpenID Connect Discovery 1.0 §4.2

The discovery response is a JSON document containing authorization server metadata. Fields are categorized as REQUIRED, RECOMMENDED, or OPTIONAL.

### Metadata Categories

#### REQUIRED Metadata (OIDC Discovery §4.2)

These fields MUST be present in every OIDC discovery response:

| Field | Type | Description | Spec Reference |
|-------|------|-------------|----------------|
| `issuer` | String | Authorization server identifier | OIDC Discovery §4.2 |
| `authorization_endpoint` | String | Authorization endpoint URL | OIDC Discovery §4.2 |
| `token_endpoint` | String | Token endpoint URL | OIDC Discovery §4.2 |
| `jwks_uri` | String | JWKS endpoint URL | OIDC Discovery §4.2 |
| `response_types_supported` | Array[String] | Supported response types | OIDC Discovery §4.2 |
| `subject_types_supported` | Array[String] | Subject identifier types | OIDC Discovery §4.2 |
| `id_token_signing_alg_values_supported` | Array[String] | ID token signing algorithms | OIDC Discovery §4.2 |

**Note:** `token_endpoint` is required for all flows except pure implicit flow (which is deprecated anyway, so always include it).

#### RECOMMENDED Metadata

These fields SHOULD be present:

| Field | Type | Description |
|-------|------|-------------|
| `userinfo_endpoint` | String | UserInfo endpoint URL |
| `registration_endpoint` | String | Dynamic client registration endpoint |
| `scopes_supported` | Array[String] | Supported OAuth 2.0 scopes |
| `claims_supported` | Array[String] | Supported claims |
| `grant_types_supported` | Array[String] | Supported grant types |
| `token_endpoint_auth_methods_supported` | Array[String] | Token endpoint authentication methods |

#### OPTIONAL Metadata

Many additional fields exist for advanced features:

- `response_modes_supported`: Supported response modes
- `acr_values_supported`: Supported ACR values
- `request_parameter_supported`: Request parameter (JWT) support
- `request_uri_parameter_supported`: Request URI parameter support
- `pushed_authorization_request_endpoint`: PAR endpoint (RFC 9126)
- `device_authorization_endpoint`: Device flow endpoint (RFC 8628)
- `revocation_endpoint`: Token revocation endpoint (RFC 7009)
- `introspection_endpoint`: Token introspection endpoint (RFC 7662)
- `code_challenge_methods_supported`: PKCE methods
- `dpop_signing_alg_values_supported`: DPoP algorithms (RFC 9449)

---

## Complete Discovery Response Example

**Comprehensive Example with All Common Fields:**

```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "userinfo_endpoint": "https://auth.example.com/userinfo",
  "jwks_uri": "https://auth.example.com/.well-known/jwks.json",
  "registration_endpoint": "https://auth.example.com/register",
  "scopes_supported": [
    "openid",
    "profile",
    "email",
    "address",
    "phone",
    "offline_access"
  ],
  "response_types_supported": [
    "code",
    "token",
    "id_token",
    "code token",
    "code id_token",
    "id_token token",
    "code id_token token"
  ],
  "response_modes_supported": [
    "query",
    "fragment",
    "form_post"
  ],
  "grant_types_supported": [
    "authorization_code",
    "implicit",
    "refresh_token",
    "client_credentials",
    "urn:ietf:params:oauth:grant-type:device_code"
  ],
  "subject_types_supported": [
    "public",
    "pairwise"
  ],
  "id_token_signing_alg_values_supported": [
    "RS256",
    "ES256",
    "HS256"
  ],
  "id_token_encryption_alg_values_supported": [
    "RSA-OAEP",
    "RSA-OAEP-256",
    "A256KW"
  ],
  "id_token_encryption_enc_values_supported": [
    "A128CBC-HS256",
    "A256CBC-HS512",
    "A128GCM",
    "A256GCM"
  ],
  "userinfo_signing_alg_values_supported": [
    "RS256",
    "ES256",
    "HS256"
  ],
  "userinfo_encryption_alg_values_supported": [
    "RSA-OAEP",
    "A256KW"
  ],
  "userinfo_encryption_enc_values_supported": [
    "A128CBC-HS256",
    "A128GCM"
  ],
  "request_object_signing_alg_values_supported": [
    "RS256",
    "ES256",
    "none"
  ],
  "request_object_encryption_alg_values_supported": [
    "RSA-OAEP",
    "A256KW"
  ],
  "request_object_encryption_enc_values_supported": [
    "A128CBC-HS256",
    "A128GCM"
  ],
  "token_endpoint_auth_methods_supported": [
    "client_secret_basic",
    "client_secret_post",
    "client_secret_jwt",
    "private_key_jwt",
    "none"
  ],
  "token_endpoint_auth_signing_alg_values_supported": [
    "RS256",
    "ES256",
    "PS256"
  ],
  "display_values_supported": [
    "page",
    "popup",
    "touch",
    "wap"
  ],
  "claim_types_supported": [
    "normal",
    "aggregated",
    "distributed"
  ],
  "claims_supported": [
    "sub",
    "iss",
    "aud",
    "exp",
    "iat",
    "auth_time",
    "nonce",
    "acr",
    "amr",
    "azp",
    "name",
    "given_name",
    "family_name",
    "middle_name",
    "nickname",
    "preferred_username",
    "profile",
    "picture",
    "website",
    "email",
    "email_verified",
    "gender",
    "birthdate",
    "zoneinfo",
    "locale",
    "phone_number",
    "phone_number_verified",
    "address",
    "updated_at"
  ],
  "service_documentation": "https://auth.example.com/docs",
  "claims_locales_supported": [
    "en-US",
    "en-GB",
    "en-CA",
    "fr-FR",
    "fr-CA",
    "de-DE",
    "es-ES"
  ],
  "ui_locales_supported": [
    "en-US",
    "en-GB",
    "en-CA",
    "fr-FR",
    "fr-CA",
    "de-DE",
    "es-ES"
  ],
  "claims_parameter_supported": true,
  "request_parameter_supported": true,
  "request_uri_parameter_supported": true,
  "require_request_uri_registration": false,
  "op_policy_uri": "https://auth.example.com/policy",
  "op_tos_uri": "https://auth.example.com/tos",
  "revocation_endpoint": "https://auth.example.com/revoke",
  "revocation_endpoint_auth_methods_supported": [
    "client_secret_basic",
    "client_secret_post",
    "client_secret_jwt",
    "private_key_jwt"
  ],
  "revocation_endpoint_auth_signing_alg_values_supported": [
    "RS256",
    "ES256"
  ],
  "introspection_endpoint": "https://auth.example.com/introspect",
  "introspection_endpoint_auth_methods_supported": [
    "client_secret_basic",
    "client_secret_post",
    "client_secret_jwt",
    "private_key_jwt"
  ],
  "introspection_endpoint_auth_signing_alg_values_supported": [
    "RS256",
    "ES256"
  ],
  "code_challenge_methods_supported": [
    "plain",
    "S256"
  ],
  "pushed_authorization_request_endpoint": "https://auth.example.com/par",
  "device_authorization_endpoint": "https://auth.example.com/device",
  "end_session_endpoint": "https://auth.example.com/logout",
  "backchannel_logout_supported": true,
  "backchannel_logout_session_supported": true,
  "frontchannel_logout_supported": true,
  "frontchannel_logout_session_supported": true,
  "dpop_signing_alg_values_supported": [
    "RS256",
    "ES256",
    "PS256"
  ],
  "mtls_endpoint_aliases": {
    "token_endpoint": "https://mtls.auth.example.com/token",
    "revocation_endpoint": "https://mtls.auth.example.com/revoke",
    "introspection_endpoint": "https://mtls.auth.example.com/introspect"
  }
}
```

**Field Count:** ~40 fields in this comprehensive example.

**Real-World Note:** Actual discovery responses vary widely. Google's might have 30 fields, while a minimal implementation might have only the 7 required fields.

---

## Core Metadata Fields

### issuer (REQUIRED)

**Type:** String

**Description:** Authorization server's issuer identifier.

**Requirements (OIDC Discovery §4.2):**
- MUST be an HTTPS URL
- MUST match `iss` claim in all issued tokens
- Case-sensitive comparison

**Example:**
```json
"issuer": "https://auth.example.com"
```

**Validation:**
```python
def validate_issuer(discovery_issuer, expected_issuer):
    if discovery_issuer != expected_issuer:
        raise ConfigurationError("Issuer mismatch")
    if not discovery_issuer.startswith("https://"):
        raise ConfigurationError("Issuer must use HTTPS")
```

### authorization_endpoint (REQUIRED)

**Type:** String

**Description:** Full URL of the authorization endpoint.

**Requirements:**
- MUST use HTTPS
- Used for authorization code and implicit flows
- Accepts authorization requests per OAuth 2.0 §3.1

**Example:**
```json
"authorization_endpoint": "https://auth.example.com/authorize"
```

**Usage:**
```python
# Client constructs authorization URL
params = {
    'response_type': 'code',
    'client_id': client_id,
    'redirect_uri': redirect_uri,
    'scope': 'openid profile email',
    'state': state,
    'code_challenge': code_challenge,
    'code_challenge_method': 'S256'
}
authorization_url = authorization_endpoint + '?' + urlencode(params)
```

### token_endpoint (REQUIRED)

**Type:** String

**Description:** Full URL of the token endpoint.

**Requirements:**
- MUST use HTTPS
- Used for token exchange (authorization code, refresh token, client credentials)
- Accepts requests per OAuth 2.0 §3.2

**Example:**
```json
"token_endpoint": "https://auth.example.com/token"
```

**When Optional:** If only implicit flow is supported (which is deprecated), `token_endpoint` MAY be omitted. In practice, always include it.

### jwks_uri (REQUIRED)

**Type:** String

**Description:** URL of the JSON Web Key Set (JWKS) document containing public keys for signature verification.

**Requirements:**
- MUST use HTTPS
- Contains public keys in JWK format (RFC 7517)
- Used to verify signatures on ID tokens and signed responses

**Example:**
```json
"jwks_uri": "https://auth.example.com/.well-known/jwks.json"
```

**JWKS Document Example:**
```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "2024-01-key",
      "n": "0vx7agoebG...",
      "e": "AQAB"
    }
  ]
}
```

**Related Documentation:** See `jwks-and-key-rotation.md` for complete JWKS specification.

### response_types_supported (REQUIRED)

**Type:** Array of strings

**Description:** OAuth 2.0 `response_type` values that the authorization server supports.

**Common Values:**
- `code`: Authorization code flow
- `token`: Implicit flow (access token)
- `id_token`: OIDC implicit flow (ID token only)
- `code id_token`: Hybrid flow
- `code token`: Hybrid flow
- `id_token token`: OIDC implicit flow
- `code id_token token`: Hybrid flow

**Example:**
```json
"response_types_supported": [
  "code",
  "code id_token",
  "id_token"
]
```

**Client Usage:**
```python
# Client checks if authorization code flow is supported
if 'code' not in config['response_types_supported']:
    raise ConfigurationError("Authorization code flow not supported")
```

**Security Note:** Modern implementations SHOULD only support `code` (authorization code flow with PKCE). Implicit and hybrid flows are deprecated per OAuth 2.1.

### subject_types_supported (REQUIRED)

**Type:** Array of strings

**Description:** Subject identifier types supported by the OpenID Provider.

**Values:**
- `public`: Same `sub` value for all clients (simpler)
- `pairwise`: Different `sub` value per client (more privacy)

**Example:**
```json
"subject_types_supported": ["public", "pairwise"]
```

**Public Subject:**
```json
// User "alice" gets same sub for all clients
{
  "sub": "248289761001",
  "name": "Alice Smith"
}
```

**Pairwise Subject:**
```json
// User "alice" gets different sub for each client
// Client A sees:
{
  "sub": "76529841002",
  "name": "Alice Smith"
}

// Client B sees:
{
  "sub": "98234719234",
  "name": "Alice Smith"
}
```

**Privacy Implication:** Pairwise subjects prevent clients from correlating users across different services.

### id_token_signing_alg_values_supported (REQUIRED)

**Type:** Array of strings

**Description:** JWS signing algorithms (alg values) supported for ID tokens.

**Requirements:**
- MUST include `RS256` (OIDC Core §3.1.3.7)
- Common algorithms: `RS256`, `ES256`, `PS256`, `HS256`

**Example:**
```json
"id_token_signing_alg_values_supported": [
  "RS256",
  "ES256",
  "PS256"
]
```

**Algorithm Selection:**
```python
# Client verifies ID token signature
def verify_id_token_signature(id_token, jwks_uri):
    header = decode_jwt_header(id_token)
    alg = header['alg']
    
    # Check if algorithm is supported
    if alg not in config['id_token_signing_alg_values_supported']:
        raise UnsupportedAlgorithmError(f"Algorithm {alg} not supported")
    
    # Fetch public key and verify
    jwks = fetch_jwks(jwks_uri)
    key = find_key(jwks, header['kid'])
    verify_signature(id_token, key, alg)
```

**Related Documentation:** See `jwt-structure-and-validation.md` for JWT signature verification.

---

## OAuth2-Specific Metadata (RFC 8414)

**Specification:** RFC 8414 - OAuth 2.0 Authorization Server Metadata

### OAuth 2.0 Discovery vs OIDC Discovery

OAuth 2.0 has its own discovery mechanism that predates but is similar to OIDC Discovery.

**Key Differences:**

| Aspect | OIDC Discovery | OAuth 2.0 Metadata |
|--------|----------------|---------------------|
| Specification | OpenID Connect Discovery 1.0 | RFC 8414 |
| Endpoint | `/.well-known/openid-configuration` | `/.well-known/oauth-authorization-server` |
| Required Fields | OIDC-specific (ID tokens, UserInfo) | OAuth 2.0 only |
| Use Case | OpenID Connect implementations | Pure OAuth 2.0 (no identity) |

### OAuth 2.0 Discovery Endpoint

**Endpoint:** `/.well-known/oauth-authorization-server`

**Construction:**
```
https://auth.example.com/.well-known/oauth-authorization-server
```

**For path-based issuers (RFC 8414 §3.1):**
```
Issuer: https://example.com/oauth2
Discovery: https://example.com/.well-known/oauth-authorization-server/oauth2
```

**Note:** For path-based issuers, the path is appended after the `/.well-known/oauth-authorization-server` component.

### OAuth 2.0 Metadata Fields

**Required Fields (RFC 8414 §2):**

| Field | Description |
|-------|-------------|
| `issuer` | Authorization server identifier |
| `authorization_endpoint` | Authorization endpoint URL (if supported) |
| `token_endpoint` | Token endpoint URL |
| `response_types_supported` | Supported response types |

**OIDC-Specific Fields Not in OAuth 2.0 Metadata:**
- `jwks_uri` (optional in OAuth 2.0, required in OIDC)
- `userinfo_endpoint`
- `id_token_signing_alg_values_supported`
- `subject_types_supported`
- Any `id_token_*` fields
- Any `userinfo_*` fields

### OAuth 2.0 Metadata Example

```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "jwks_uri": "https://auth.example.com/.well-known/jwks.json",
  "response_types_supported": ["code"],
  "grant_types_supported": [
    "authorization_code",
    "client_credentials",
    "refresh_token"
  ],
  "token_endpoint_auth_methods_supported": [
    "client_secret_basic",
    "client_secret_post",
    "private_key_jwt"
  ],
  "revocation_endpoint": "https://auth.example.com/revoke",
  "introspection_endpoint": "https://auth.example.com/introspect",
  "code_challenge_methods_supported": ["S256"]
}
```

**Note:** No OIDC-specific fields like `userinfo_endpoint` or `id_token_signing_alg_values_supported`.

### Client Discovery Strategy

**Recommended Approach:**

```python
def discover_authorization_server(issuer):
    # Try OIDC Discovery first
    oidc_url = issuer + "/.well-known/openid-configuration"
    try:
        config = http_get(oidc_url)
        if config.status == 200:
            return config, "oidc"
    except Exception:
        pass
    
    # Fallback to OAuth 2.0 metadata
    oauth_url = issuer + "/.well-known/oauth-authorization-server"
    try:
        config = http_get(oauth_url)
        if config.status == 200:
            return config, "oauth2"
    except Exception:
        pass
    
    raise DiscoveryError("No discovery endpoint found")
```

**Why Try OIDC First?**
- OIDC Discovery is superset of OAuth 2.0 metadata
- Most modern authorization servers implement OIDC
- OIDC provides more complete configuration

---

## Endpoint URLs and HTTPS Requirements

**Specification:** OIDC Discovery §4.2, RFC 8414 §2

### HTTPS Requirement

All endpoint URLs in discovery response MUST use HTTPS (RFC 2119: MUST).

**Rationale:**
- Protects token exchange from interception
- Prevents MITM attacks on authorization flow
- Protects discovery response integrity

**Valid Endpoint URL:**
```json
"token_endpoint": "https://auth.example.com/token"
```

**Invalid Endpoint URL:**
```json
"token_endpoint": "http://auth.example.com/token"  ❌
```

**Exception:** Development/testing environments MAY use HTTP with `localhost`, but NEVER in production.

```json
// Development only
"token_endpoint": "http://localhost:8080/token"  ⚠️
```

### Complete vs Relative URLs

All endpoint URLs MUST be complete URLs (RFC 2119: MUST), not relative paths.

**Valid:**
```json
"authorization_endpoint": "https://auth.example.com/authorize"
```

**Invalid:**
```json
"authorization_endpoint": "/authorize"  ❌
```

### Port Numbers

Endpoint URLs MAY include explicit port numbers.

**Example:**
```json
"authorization_endpoint": "https://auth.example.com:8443/authorize"
```

**Default Ports:**
- HTTPS: Port 443 (typically omitted)
- HTTP: Port 80 (development only)

### Different Hosts for Different Endpoints

Endpoints MAY be on different hosts. This is common for:
- **JWKS URI:** Served from CDN for performance
- **UserInfo Endpoint:** Different service/domain
- **Token Endpoint:** Different security zone

**Example:**
```json
{
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "jwks_uri": "https://cdn.example.com/jwks/keys.json",
  "userinfo_endpoint": "https://api.example.com/userinfo"
}
```

**Security Consideration:** All hosts MUST be under control of the authorization server operator. Never reference third-party hosts.

### Path Handling

Endpoints MAY have arbitrary paths.

**Example:**
```json
{
  "authorization_endpoint": "https://auth.example.com/oauth2/v1/authorize",
  "token_endpoint": "https://auth.example.com/oauth2/v1/token"
}
```

**No Assumptions:** Clients MUST NOT assume endpoint paths. Always use values from discovery.

### Endpoint URL Validation

**Client Validation Algorithm:**

```python
def validate_endpoint_url(url, endpoint_name):
    # Parse URL
    parsed = urlparse(url)
    
    # Check HTTPS (allow HTTP for localhost in development)
    if parsed.scheme != 'https':
        if parsed.hostname != 'localhost':
            raise ConfigurationError(
                f"{endpoint_name} must use HTTPS"
            )
    
    # Check it's a complete URL
    if not parsed.scheme or not parsed.netloc:
        raise ConfigurationError(
            f"{endpoint_name} must be complete URL"
        )
    
    # URL is valid
    return True
```

---

## Supported Features Advertisement

Discovery allows authorization servers to advertise which features they support, enabling clients to adapt their behavior.

### Response Types and Grant Types

#### response_types_supported

**Purpose:** Advertises which OAuth 2.0 response types are available.

**Values Indicate Which Flows Are Supported:**

| Response Type | Flow | Status |
|---------------|------|--------|
| `code` | Authorization Code | ✅ Recommended (OAuth 2.1) |
| `token` | Implicit (access token) | ⚠️ Deprecated |
| `id_token` | OIDC Implicit (ID token) | ⚠️ Deprecated |
| `code id_token` | Hybrid | ⚠️ Deprecated |
| `code token` | Hybrid | ⚠️ Deprecated |
| `id_token token` | OIDC Implicit | ⚠️ Deprecated |
| `code id_token token` | Hybrid | ⚠️ Deprecated |

**Modern Configuration:**
```json
"response_types_supported": ["code"]
```

**Legacy Configuration Supporting Multiple Flows:**
```json
"response_types_supported": [
  "code",
  "token",
  "id_token",
  "code id_token",
  "code token",
  "id_token token",
  "code id_token token"
]
```

#### grant_types_supported

**Purpose:** Advertises which grant types are available at the token endpoint.

**Common Grant Types:**

| Grant Type | Use Case | Specification |
|------------|----------|---------------|
| `authorization_code` | Authorization code exchange | OAuth 2.0 §4.1.3 |
| `refresh_token` | Token refresh | OAuth 2.0 §6 |
| `client_credentials` | Service-to-service | OAuth 2.0 §4.4 |
| `urn:ietf:params:oauth:grant-type:device_code` | Device flow | RFC 8628 |
| `password` | Resource owner password | ⚠️ Deprecated (OAuth 2.1) |
| `implicit` | Implicit flow | ⚠️ Deprecated (OAuth 2.1) |

**Example:**
```json
"grant_types_supported": [
  "authorization_code",
  "refresh_token",
  "client_credentials",
  "urn:ietf:params:oauth:grant-type:device_code"
]
```

**Client Usage:**
```python
# Client checks if refresh tokens are supported
if 'refresh_token' in config['grant_types_supported']:
    # Request offline_access scope
    scopes.append('offline_access')
```

### Scopes and Claims

#### scopes_supported

**Purpose:** Lists OAuth 2.0 scopes that can be requested.

**Standard OIDC Scopes:**
- `openid`: Required for OIDC
- `profile`: Name, picture, etc.
- `email`: Email address
- `address`: Physical address
- `phone`: Phone number
- `offline_access`: Refresh token

**Example:**
```json
"scopes_supported": [
  "openid",
  "profile",
  "email",
  "address",
  "phone",
  "offline_access",
  "api:read",
  "api:write"
]
```

**Client Behavior:**
```python
# Client selects scopes based on discovery
available_scopes = set(config['scopes_supported'])
requested_scopes = ['openid', 'profile', 'email', 'api:read']

# Only request supported scopes
valid_scopes = [s for s in requested_scopes if s in available_scopes]
```

#### claims_supported

**Purpose:** Lists user claims that may be returned in ID tokens or UserInfo responses.

**Standard OIDC Claims:**
```json
"claims_supported": [
  "sub",
  "name",
  "given_name",
  "family_name",
  "middle_name",
  "nickname",
  "preferred_username",
  "profile",
  "picture",
  "website",
  "email",
  "email_verified",
  "gender",
  "birthdate",
  "zoneinfo",
  "locale",
  "phone_number",
  "phone_number_verified",
  "address",
  "updated_at"
]
```

**Client Usage:**
```python
# Client checks which claims are available
if 'email' in config['claims_supported']:
    # Can request email scope
    scopes.append('email')
```

**Note:** `claims_supported` indicates which claims MAY be available, not which claims WILL be returned for every user.

### Response Modes

**Purpose:** Indicates how authorization responses can be returned.

**Standard Response Modes:**
- `query`: Response parameters in query string (default for code flow)
- `fragment`: Response parameters in URL fragment (default for implicit)
- `form_post`: Response parameters via POST to redirect URI (RFC 9101)

**Example:**
```json
"response_modes_supported": [
  "query",
  "fragment",
  "form_post"
]
```

**form_post Example:**
```http
POST /callback HTTP/1.1
Host: client.example.com
Content-Type: application/x-www-form-urlencoded

code=SplxlOBeZQQYbYS6WxSbIA&state=af0ifjsldkj
```

**Security Benefit:** `form_post` prevents authorization code from appearing in browser history or server logs.

### Cryptographic Algorithm Support

Discovery advertises supported algorithms for:
- ID token signing: `id_token_signing_alg_values_supported`
- ID token encryption: `id_token_encryption_alg_values_supported`, `id_token_encryption_enc_values_supported`
- UserInfo signing: `userinfo_signing_alg_values_supported`
- UserInfo encryption: `userinfo_encryption_alg_values_supported`
- Request object signing: `request_object_signing_alg_values_supported`
- Token endpoint authentication: `token_endpoint_auth_signing_alg_values_supported`

**Example:**
```json
"id_token_signing_alg_values_supported": ["RS256", "ES256", "PS256"],
"id_token_encryption_alg_values_supported": ["RSA-OAEP", "RSA-OAEP-256"],
"id_token_encryption_enc_values_supported": ["A128CBC-HS256", "A256GCM"]
```

---

## Client Authentication Methods

**Specification:** OIDC Discovery §4.2, RFC 7591 §2

### token_endpoint_auth_methods_supported

**Purpose:** Advertises client authentication methods supported at the token endpoint.

**Standard Methods:**

| Method | Description | Security | Spec |
|--------|-------------|----------|------|
| `client_secret_basic` | HTTP Basic Auth with client_id and client_secret | Medium | OAuth 2.0 §2.3.1 |
| `client_secret_post` | client_id and client_secret in POST body | Medium | OAuth 2.0 §2.3.1 |
| `client_secret_jwt` | Signed JWT with symmetric key (HS256) | High | OIDC Core §9 |
| `private_key_jwt` | Signed JWT with asymmetric key (RS256) | Highest | OIDC Core §9 |
| `none` | No authentication (public clients) | None | OAuth 2.0 §2.1 |
| `tls_client_auth` | mTLS authentication | Highest | RFC 8705 |
| `self_signed_tls_client_auth` | mTLS with self-signed cert | High | RFC 8705 |

**Example:**
```json
"token_endpoint_auth_methods_supported": [
  "client_secret_basic",
  "client_secret_post",
  "client_secret_jwt",
  "private_key_jwt",
  "none"
]
```

### client_secret_basic

**Mechanism:** HTTP Basic Authentication

**Example:**
```http
POST /token HTTP/1.1
Host: auth.example.com
Authorization: Basic Y2xpZW50X2lkOmNsaWVudF9zZWNyZXQ=
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code=SplxlOBeZQQYbYS6WxSbIA
&redirect_uri=https://client.example.com/callback
```

**Base64 Encoding:**
```
client_id:client_secret → base64 → Y2xpZW50X2lkOmNsaWVudF9zZWNyZXQ=
```

### client_secret_post

**Mechanism:** Client credentials in POST body

**Example:**
```http
POST /token HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=SplxlOBeZQQYbYS6WxSbIA
&redirect_uri=https://client.example.com/callback
&client_id=my_client_id
&client_secret=my_client_secret
```

**Security Note:** Less secure than Basic Auth because credentials appear in POST body (more logging risk).

### private_key_jwt

**Mechanism:** Client creates signed JWT assertion

**JWT Claims:**
```json
{
  "iss": "my_client_id",
  "sub": "my_client_id",
  "aud": "https://auth.example.com/token",
  "jti": "unique_identifier",
  "exp": 1638360000,
  "iat": 1638356400
}
```

**Token Request:**
```http
POST /token HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=SplxlOBeZQQYbYS6WxSbIA
&redirect_uri=https://client.example.com/callback
&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
&client_assertion=eyJhbGciOiJSUzI1NiIsImtpZCI6IjIwMjQtMDEta2V5In0.eyJpc3MiOiJteV9jbGllbnRfaWQiLCJzdWIiOiJteV9jbGllbnRfaWQiLCJhdWQiOiJodHRwczovL2F1dGguZXhhbXBsZS5jb20vdG9rZW4iLCJqdGkiOiJ1bmlxdWVfaWRlbnRpZmllciIsImV4cCI6MTYzODM2MDAwMCwiaWF0IjoxNjM4MzU2NDAwfQ.signature
```

**Security Benefit:** No shared secret, asymmetric cryptography, per-request authentication.

### none (Public Clients)

**Use Case:** Public clients (SPAs, mobile apps) that cannot securely store secrets.

**Token Request:**
```http
POST /token HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=SplxlOBeZQQYbYS6WxSbIA
&redirect_uri=https://client.example.com/callback
&client_id=my_public_client_id
&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

**Security:** PKCE (code_verifier) provides authentication in lieu of client secret.

### token_endpoint_auth_signing_alg_values_supported

**Purpose:** Algorithms supported for JWT-based client authentication.

**Example:**
```json
"token_endpoint_auth_signing_alg_values_supported": [
  "RS256",
  "ES256",
  "PS256",
  "EdDSA"
]
```

**Applies To:**
- `client_secret_jwt` (symmetric algorithms like HS256)
- `private_key_jwt` (asymmetric algorithms like RS256, ES256)

### Similar Fields for Other Endpoints

**Revocation Endpoint:**
```json
"revocation_endpoint_auth_methods_supported": [
  "client_secret_basic",
  "private_key_jwt"
],
"revocation_endpoint_auth_signing_alg_values_supported": ["RS256"]
```

**Introspection Endpoint:**
```json
"introspection_endpoint_auth_methods_supported": [
  "client_secret_basic",
  "private_key_jwt"
],
"introspection_endpoint_auth_signing_alg_values_supported": ["RS256"]
```

---

## PKCE Support Advertisement

**Specification:** RFC 7636, OAuth 2.1 draft

### code_challenge_methods_supported

**Purpose:** Indicates PKCE support and which transformation methods are available.

**Values:**
- `plain`: No transformation (code_verifier = code_challenge)
- `S256`: SHA-256 hash (RECOMMENDED)

**Example:**
```json
"code_challenge_methods_supported": ["plain", "S256"]
```

**Presence Indicates PKCE Support:** If this field is present, the authorization server supports PKCE.

**Absence:** May indicate no PKCE support, but OAuth 2.1 requires PKCE for all clients.

### PKCE Requirement (OAuth 2.1)

**OAuth 2.1 Requirement:** ALL clients MUST use PKCE, regardless of client type.

**Authorization Server MUST:**
- Support PKCE for all authorization code flows
- Support `S256` transformation method
- Reject authorization requests without PKCE (for non-legacy clients)

**Discovery Response for OAuth 2.1 Compliant Server:**
```json
{
  "code_challenge_methods_supported": ["S256"]
}
```

**Note:** `plain` method is NOT RECOMMENDED for production. Only include for legacy client compatibility.

### Client Behavior Based on Discovery

```python
def should_use_pkce(config):
    # Check if PKCE is advertised
    methods = config.get('code_challenge_methods_supported', [])
    
    if not methods:
        # No PKCE advertised - but OAuth 2.1 requires it
        # Try PKCE anyway for modern servers
        return True
    
    # PKCE is advertised
    return True

def select_pkce_method(config):
    methods = config.get('code_challenge_methods_supported', [])
    
    # Prefer S256
    if 'S256' in methods:
        return 'S256'
    
    # Fallback to plain (not recommended)
    if 'plain' in methods:
        return 'plain'
    
    # No PKCE support (shouldn't happen with OAuth 2.1)
    return None
```

### PKCE Flow with Discovery

```
┌──────────┐                                    ┌─────────────────────┐
│  Client  │                                    │ Authorization Server│
└─────┬────┘                                    └──────────┬──────────┘
      │                                                    │
      │ 1. Fetch discovery                                │
      │───────────────────────────────────────────────────>│
      │                                                    │
      │ 2. Discovery response includes                    │
      │    code_challenge_methods_supported: ["S256"]     │
      │<───────────────────────────────────────────────────│
      │                                                    │
      │ 3. Client generates code_verifier                 │
      │    and code_challenge                             │
      │                                                    │
      │ 4. Authorization request with code_challenge      │
      │───────────────────────────────────────────────────>│
      │                                                    │
      │ 5. Authorization code                             │
      │<───────────────────────────────────────────────────│
      │                                                    │
      │ 6. Token request with code_verifier               │
      │───────────────────────────────────────────────────>│
      │                                                    │
      │ 7. Tokens                                         │
      │<───────────────────────────────────────────────────│
```

**Related Documentation:** See `pkce-implementation.md` for complete PKCE specification.

---

## Advanced Features

### Request Objects (RFC 9101)

**Fields:**
- `request_parameter_supported`: Whether request parameter (JWT) is supported
- `request_uri_parameter_supported`: Whether request_uri parameter is supported
- `request_object_signing_alg_values_supported`: Signing algorithms for request objects
- `require_request_uri_registration`: Whether request URIs must be pre-registered

**Example:**
```json
"request_parameter_supported": true,
"request_uri_parameter_supported": true,
"request_object_signing_alg_values_supported": ["RS256", "ES256"],
"require_request_uri_registration": false
```

**Use Case:** JWT-secured authorization requests provide integrity and confidentiality.

**Authorization Request with Request Object:**
```http
GET /authorize?
  client_id=my_client_id
  &request=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNwb25zZV90eXBlIjoiY29kZSIsImNsaWVudF9pZCI6Im15X2NsaWVudF9pZCIsInJlZGlyZWN0X3VyaSI6Imh0dHBzOi8vY2xpZW50LmV4YW1wbGUuY29tL2NhbGxiYWNrIiwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCIsInN0YXRlIjoiYWYwaWZqc2xka2oiLCJub25jZSI6Im4tMFM2X1d6QTJNaiIsImNvZGVfY2hhbGxlbmdlIjoiRTlNZWxoVDJmeWhfVzNRYlVBQ3Ezb1VQb3NmbVdiTG55cUh2NWEydUVOYyIsImNvZGVfY2hhbGxlbmdlX21ldGhvZCI6IlMyNTYifQ.signature
```

### Pushed Authorization Requests (PAR - RFC 9126)

**Field:** `pushed_authorization_request_endpoint`

**Example:**
```json
"pushed_authorization_request_endpoint": "https://auth.example.com/par"
```

**Use Case:** Client pushes authorization parameters directly to authorization server, receives request URI.

**PAR Request:**
```http
POST /par HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded
Authorization: Basic Y2xpZW50X2lkOmNsaWVudF9zZWNyZXQ=

response_type=code
&client_id=my_client_id
&redirect_uri=https://client.example.com/callback
&scope=openid%20profile%20email
&state=af0ifjsldkj
&code_challenge=E9MelhT2fyh_W3QbUACq3oUPosfmWbLnyqHv5a2uENc
&code_challenge_method=S256
```

**PAR Response:**
```json
{
  "request_uri": "urn:ietf:params:oauth:request_uri:bwc4JK-ESC0w8acc191e-Y1LTC2",
  "expires_in": 90
}
```

**Security Benefit:** Authorization parameters never appear in front channel (browser).

**Related Documentation:** See `pushed-authorization-requests.md` (create if needed).

### Device Authorization (RFC 8628)

**Field:** `device_authorization_endpoint`

**Example:**
```json
"device_authorization_endpoint": "https://auth.example.com/device"
```

**Use Case:** Input-constrained devices (smart TVs, IoT devices).

**Related Documentation:** See `device-authorization-flow.md` for complete specification.

### Token Revocation (RFC 7009)

**Field:** `revocation_endpoint`

**Example:**
```json
"revocation_endpoint": "https://auth.example.com/revoke",
"revocation_endpoint_auth_methods_supported": [
  "client_secret_basic",
  "private_key_jwt"
]
```

**Related Documentation:** See `token-introspection-and-revocation.md` for complete specification.

### Token Introspection (RFC 7662)

**Field:** `introspection_endpoint`

**Example:**
```json
"introspection_endpoint": "https://auth.example.com/introspect",
"introspection_endpoint_auth_methods_supported": [
  "client_secret_basic",
  "private_key_jwt"
]
```

**Related Documentation:** See `token-introspection-and-revocation.md` for complete specification.

### DPoP (RFC 9449)

**Field:** `dpop_signing_alg_values_supported`

**Example:**
```json
"dpop_signing_alg_values_supported": ["RS256", "ES256", "PS256", "EdDSA"]
```

**Use Case:** Proof-of-possession for access tokens (sender-constrained tokens).

**Related Documentation:** See `token-binding-dpop-mtls.md` for complete DPoP specification.

### mTLS Endpoint Aliases (RFC 8705)

**Field:** `mtls_endpoint_aliases`

**Example:**
```json
"mtls_endpoint_aliases": {
  "token_endpoint": "https://mtls.auth.example.com/token",
  "revocation_endpoint": "https://mtls.auth.example.com/revoke",
  "introspection_endpoint": "https://mtls.auth.example.com/introspect"
}
```

**Use Case:** Separate endpoints requiring mTLS authentication.

**Related Documentation:** See `token-binding-dpop-mtls.md` for complete mTLS specification.

### Session Management

**Fields:**
- `end_session_endpoint`: Logout endpoint
- `frontchannel_logout_supported`: Front-channel logout support
- `frontchannel_logout_session_supported`: Front-channel logout with session
- `backchannel_logout_supported`: Back-channel logout support
- `backchannel_logout_session_supported`: Back-channel logout with session

**Example:**
```json
"end_session_endpoint": "https://auth.example.com/logout",
"frontchannel_logout_supported": true,
"backchannel_logout_supported": true,
"backchannel_logout_session_supported": true
```

---

## Client Discovery Process

### Discovery Algorithm

**Step-by-Step Process:**

```
1. Client has issuer URL
   ├── From user configuration
   ├── From service discovery
   └── From domain metadata

2. Construct discovery URL
   └── issuer + "/.well-known/openid-configuration"

3. Perform HTTP GET to discovery URL
   ├── Set Accept: application/json
   └── Follow redirects (with caution)

4. Receive HTTP 200 with JSON response
   └── Or handle error (404, 500, etc.)

5. Parse JSON response
   └── Handle parse errors

6. Validate discovery response
   ├── Check required fields present
   ├── Validate issuer matches expected
   ├── Validate endpoint URLs use HTTPS
   └── Check supported features meet requirements

7. Extract endpoint URLs
   ├── authorization_endpoint
   ├── token_endpoint
   ├── jwks_uri
   └── Other endpoints as needed

8. Cache configuration
   └── With reasonable TTL (e.g., 1 hour)

9. Use endpoints for OAuth2/OIDC flows
```

### Client Implementation (Python Example)

```python
import requests
import json
from urllib.parse import urljoin
from datetime import datetime, timedelta

class OIDCDiscoveryClient:
    def __init__(self, issuer_url, cache_ttl_seconds=3600):
        self.issuer_url = issuer_url.rstrip('/')
        self.cache_ttl_seconds = cache_ttl_seconds
        self.config = None
        self.config_cached_at = None
    
    def get_configuration(self):
        """Fetch or return cached configuration"""
        # Check cache
        if self._is_cache_valid():
            return self.config
        
        # Fetch new configuration
        self.config = self._fetch_configuration()
        self.config_cached_at = datetime.now()
        
        return self.config
    
    def _is_cache_valid(self):
        """Check if cached configuration is still valid"""
        if self.config is None or self.config_cached_at is None:
            return False
        
        cache_age = datetime.now() - self.config_cached_at
        return cache_age.total_seconds() < self.cache_ttl_seconds
    
    def _fetch_configuration(self):
        """Fetch configuration from discovery endpoint"""
        # Construct discovery URL
        discovery_url = self.issuer_url + "/.well-known/openid-configuration"
        
        try:
            # Perform GET request
            response = requests.get(
                discovery_url,
                headers={'Accept': 'application/json'},
                timeout=10
            )
            
            # Check status code
            if response.status_code != 200:
                raise ConfigurationError(
                    f"Discovery failed with status {response.status_code}"
                )
            
            # Parse JSON
            config = response.json()
            
            # Validate configuration
            self._validate_configuration(config)
            
            return config
            
        except requests.exceptions.RequestException as e:
            raise ConfigurationError(f"Discovery request failed: {e}")
        except json.JSONDecodeError as e:
            raise ConfigurationError(f"Invalid JSON in discovery response: {e}")
    
    def _validate_configuration(self, config):
        """Validate discovery response"""
        # Check required fields
        required_fields = [
            'issuer',
            'authorization_endpoint',
            'token_endpoint',
            'jwks_uri',
            'response_types_supported',
            'subject_types_supported',
            'id_token_signing_alg_values_supported'
        ]
        
        for field in required_fields:
            if field not in config:
                raise ConfigurationError(f"Missing required field: {field}")
        
        # Validate issuer matches expected
        if config['issuer'] != self.issuer_url:
            raise ConfigurationError(
                f"Issuer mismatch: expected {self.issuer_url}, "
                f"got {config['issuer']}"
            )
        
        # Validate endpoint URLs use HTTPS
        endpoints = [
            'authorization_endpoint',
            'token_endpoint',
            'jwks_uri'
        ]
        
        for endpoint in endpoints:
            url = config.get(endpoint)
            if url and not url.startswith('https://'):
                # Allow localhost for development
                if not url.startswith('http://localhost'):
                    raise ConfigurationError(
                        f"{endpoint} must use HTTPS: {url}"
                    )
        
        # Configuration is valid
    
    def get_authorization_endpoint(self):
        """Get authorization endpoint URL"""
        config = self.get_configuration()
        return config['authorization_endpoint']
    
    def get_token_endpoint(self):
        """Get token endpoint URL"""
        config = self.get_configuration()
        return config['token_endpoint']
    
    def get_jwks_uri(self):
        """Get JWKS URI"""
        config = self.get_configuration()
        return config['jwks_uri']
    
    def supports_pkce(self):
        """Check if PKCE is supported"""
        config = self.get_configuration()
        methods = config.get('code_challenge_methods_supported', [])
        return 'S256' in methods or 'plain' in methods
    
    def get_supported_scopes(self):
        """Get list of supported scopes"""
        config = self.get_configuration()
        return config.get('scopes_supported', [])

class ConfigurationError(Exception):
    """Configuration error"""
    pass

# Usage
try:
    client = OIDCDiscoveryClient('https://auth.example.com')
    
    # Get endpoints
    auth_endpoint = client.get_authorization_endpoint()
    token_endpoint = client.get_token_endpoint()
    jwks_uri = client.get_jwks_uri()
    
    # Check features
    if client.supports_pkce():
        print("PKCE is supported")
    
    scopes = client.get_supported_scopes()
    print(f"Supported scopes: {scopes}")
    
except ConfigurationError as e:
    print(f"Configuration error: {e}")
```

### Error Handling

**Common Errors:**

| Error | Status Code | Handling |
|-------|-------------|----------|
| Discovery endpoint not found | 404 | Check issuer URL construction |
| Server error | 500 | Retry with exponential backoff |
| Invalid JSON | 200 (but bad content) | Reject and log error |
| Missing required fields | 200 (but incomplete) | Reject configuration |
| Network timeout | N/A | Retry or use cached config |
| TLS/certificate error | N/A | Check server certificate |

**Error Handling Strategy:**

```python
def fetch_with_retry(discovery_url, max_retries=3):
    """Fetch discovery with retry logic"""
    for attempt in range(max_retries):
        try:
            response = requests.get(discovery_url, timeout=10)
            if response.status_code == 200:
                return response.json()
            elif response.status_code >= 500:
                # Server error - retry
                time.sleep(2 ** attempt)  # Exponential backoff
                continue
            else:
                # Client error - don't retry
                raise ConfigurationError(f"Discovery failed: {response.status_code}")
        except requests.exceptions.Timeout:
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
                continue
            raise
    
    raise ConfigurationError("Discovery failed after retries")
```

### Configuration Caching

**Caching Strategy:**

1. **Cache TTL:** 1 hour (3600 seconds) is reasonable
   - Balances freshness vs performance
   - Reduces load on authorization server
   - Allows configuration updates without long delays

2. **Cache Invalidation:**
   - Expired by TTL
   - Explicit invalidation on error
   - Periodic refresh in background

3. **Cache Storage:**
   - In-memory for single instance
   - Redis/Memcached for distributed systems
   - File system for long-term caching

**Cache Implementation:**

```python
import redis
import json
from datetime import timedelta

class CachedDiscoveryClient:
    def __init__(self, issuer_url, redis_client, ttl_seconds=3600):
        self.issuer_url = issuer_url
        self.redis = redis_client
        self.ttl_seconds = ttl_seconds
        self.cache_key = f"oidc:discovery:{issuer_url}"
    
    def get_configuration(self):
        """Get configuration (from cache if available)"""
        # Try cache first
        cached = self.redis.get(self.cache_key)
        if cached:
            return json.loads(cached)
        
        # Cache miss - fetch and cache
        config = self._fetch_configuration()
        self.redis.setex(
            self.cache_key,
            timedelta(seconds=self.ttl_seconds),
            json.dumps(config)
        )
        
        return config
```

---

## Discovery Response Validation

**Specification:** OIDC Discovery §4.2, RFC 8414 §3.2

### Client MUST Validate

The client MUST perform these validations on the discovery response:

#### 1. Issuer Field Validation

```python
def validate_issuer(config, expected_issuer):
    """Validate issuer field"""
    if config['issuer'] != expected_issuer:
        raise ValidationError(
            f"Issuer mismatch: expected '{expected_issuer}', "
            f"got '{config['issuer']}'"
        )
    
    if not config['issuer'].startswith('https://'):
        raise ValidationError("Issuer must use HTTPS")
```

**Requirement:** `issuer` field MUST exactly match the expected issuer URL (case-sensitive).

#### 2. Required Fields Presence

```python
def validate_required_fields(config):
    """Check all required fields are present"""
    required_oidc = [
        'issuer',
        'authorization_endpoint',
        'token_endpoint',
        'jwks_uri',
        'response_types_supported',
        'subject_types_supported',
        'id_token_signing_alg_values_supported'
    ]
    
    missing = [f for f in required_oidc if f not in config]
    
    if missing:
        raise ValidationError(f"Missing required fields: {missing}")
```

#### 3. HTTPS Requirement for Endpoints

```python
def validate_https_endpoints(config):
    """Validate all endpoint URLs use HTTPS"""
    endpoints = [
        'authorization_endpoint',
        'token_endpoint',
        'jwks_uri',
        'userinfo_endpoint',
        'registration_endpoint'
    ]
    
    for endpoint_name in endpoints:
        url = config.get(endpoint_name)
        if url:
            if not url.startswith('https://'):
                # Allow localhost for development
                if not url.startswith('http://localhost'):
                    raise ValidationError(
                        f"{endpoint_name} must use HTTPS: {url}"
                    )
```

#### 4. JSON Well-Formedness

```python
def parse_discovery_response(response_text):
    """Parse and validate JSON"""
    try:
        config = json.loads(response_text)
        return config
    except json.JSONDecodeError as e:
        raise ValidationError(f"Invalid JSON: {e}")
```

### Client SHOULD Validate

The client SHOULD additionally validate:

#### 1. Supported Features Meet Requirements

```python
def validate_features(config, required_response_types, required_scopes):
    """Check authorization server supports required features"""
    # Check response types
    supported_types = config.get('response_types_supported', [])
    for rt in required_response_types:
        if rt not in supported_types:
            raise ValidationError(f"Required response type not supported: {rt}")
    
    # Check scopes
    supported_scopes = config.get('scopes_supported', [])
    for scope in required_scopes:
        if scope not in supported_scopes:
            # Warning, not error (authorization server may support but not advertise)
            print(f"Warning: Scope {scope} not in discovery response")
```

#### 2. Signing Algorithms

```python
def validate_algorithms(config, client_alg):
    """Check authorization server supports client's preferred algorithm"""
    supported = config.get('id_token_signing_alg_values_supported', [])
    
    if client_alg not in supported:
        raise ValidationError(
            f"Client algorithm {client_alg} not supported. "
            f"Supported: {supported}"
        )
```

#### 3. Response Type "code" for Authorization Code Flow

```python
def validate_code_flow_support(config):
    """Check if authorization code flow is supported"""
    response_types = config.get('response_types_supported', [])
    
    if 'code' not in response_types:
        raise ValidationError("Authorization code flow not supported")
```

### Validation Failure Handling

**On Validation Failure:**

1. **Reject Configuration:** Do not use configuration
2. **Log Error:** Record detailed error information
3. **Alert:** Notify operations/monitoring
4. **Do Not Proceed:** Do not attempt OAuth2/OIDC flow

**Example:**

```python
def configure_client_from_discovery(issuer_url):
    """Configure client using discovery"""
    try:
        # Fetch discovery
        config = fetch_discovery(issuer_url)
        
        # Validate
        validate_issuer(config, issuer_url)
        validate_required_fields(config)
        validate_https_endpoints(config)
        validate_code_flow_support(config)
        
        # Configuration is valid - use it
        return OIDCClient(config)
        
    except ValidationError as e:
        # Log error
        logger.error(f"Discovery validation failed: {e}")
        
        # Alert monitoring
        alert_monitoring("discovery_validation_failed", {
            'issuer': issuer_url,
            'error': str(e)
        })
        
        # Fail gracefully
        raise ConfigurationError(f"Cannot configure client: {e}")
```

---

## Issuer Identifier Validation

**Specification:** OpenID Connect Discovery 1.0 §2, §4.2

### Issuer URL Requirements (OIDC Discovery §2)

The issuer identifier MUST meet these requirements:

1. **HTTPS Scheme (MUST):**
   ```python
   if not issuer.startswith('https://'):
       raise ValidationError("Issuer must use HTTPS scheme")
   ```

2. **No Query Component (MUST):**
   ```python
   from urllib.parse import urlparse
   parsed = urlparse(issuer)
   if parsed.query:
       raise ValidationError("Issuer must not contain query component")
   ```

3. **No Fragment Component (MUST):**
   ```python
   if parsed.fragment:
       raise ValidationError("Issuer must not contain fragment")
   ```

4. **Case-Sensitive (MUST):**
   ```python
   # Do NOT normalize to lowercase
   # These are different issuers:
   # https://Auth.Example.Com
   # https://auth.example.com
   ```

### Complete Issuer Validation

```python
from urllib.parse import urlparse

def validate_issuer_url(issuer):
    """Validate issuer URL per OIDC Discovery §2"""
    # Parse URL
    try:
        parsed = urlparse(issuer)
    except Exception as e:
        raise ValidationError(f"Invalid URL: {e}")
    
    # Check HTTPS scheme
    if parsed.scheme != 'https':
        raise ValidationError(
            f"Issuer must use HTTPS scheme, got: {parsed.scheme}"
        )
    
    # Check no query
    if parsed.query:
        raise ValidationError(
            f"Issuer must not contain query component: {parsed.query}"
        )
    
    # Check no fragment
    if parsed.fragment:
        raise ValidationError(
            f"Issuer must not contain fragment: {parsed.fragment}"
        )
    
    # Check has hostname
    if not parsed.netloc:
        raise ValidationError("Issuer must have hostname")
    
    # Issuer is valid
    return True

# Examples
validate_issuer_url('https://auth.example.com')  # ✅ Valid
validate_issuer_url('https://example.com/oauth2')  # ✅ Valid
validate_issuer_url('http://auth.example.com')  # ❌ Not HTTPS
validate_issuer_url('https://auth.example.com?tenant=foo')  # ❌ Has query
validate_issuer_url('https://auth.example.com#section')  # ❌ Has fragment
```

### Discovery URL Construction (OIDC Discovery §3)

**Algorithm:**

```python
def construct_discovery_url(issuer):
    """Construct discovery URL from issuer"""
    # Validate issuer first
    validate_issuer_url(issuer)
    
    # Remove trailing slash if present
    issuer = issuer.rstrip('/')
    
    # Append discovery path
    discovery_url = issuer + '/.well-known/openid-configuration'
    
    return discovery_url

# Examples
construct_discovery_url('https://auth.example.com')
# → https://auth.example.com/.well-known/openid-configuration

construct_discovery_url('https://example.com/oauth2')
# → https://example.com/.well-known/openid-configuration

construct_discovery_url('https://auth.example.com/')  # Trailing slash
# → https://auth.example.com/.well-known/openid-configuration
```

**Important:** The `/.well-known/` component is added at the root of the host, NOT appended to the issuer's path.

### Token Issuer Validation

When validating tokens, the `iss` claim MUST exactly match the issuer from discovery:

```python
def validate_token_issuer(token_iss, discovery_issuer):
    """Validate token issuer claim"""
    # Case-sensitive exact match (RFC 2119: MUST)
    if token_iss != discovery_issuer:
        raise ValidationError(
            f"Token issuer '{token_iss}' does not match "
            f"discovery issuer '{discovery_issuer}'"
        )
    
    return True

# Example with ID token validation
def validate_id_token(id_token, discovery_config):
    """Validate ID token"""
    # Decode (without verification first)
    claims = decode_jwt_without_verification(id_token)
    
    # Validate issuer
    expected_issuer = discovery_config['issuer']
    if claims.get('iss') != expected_issuer:
        raise ValidationError(f"Invalid issuer: {claims.get('iss')}")
    
    # Continue with other validations...
```

### Security Implications

**Issuer Substitution Attack:**

An attacker could try to use tokens from one authorization server with another:

```
Attacker's Server: https://evil.com
Legitimate Server: https://auth.example.com

Attacker issues token with:
{
  "iss": "https://auth.example.com",  // Forged
  "sub": "victim_user",
  ...
}
```

**Defense:**

Client validates:
1. Discovery response has `"issuer": "https://auth.example.com"`
2. Token `iss` claim exactly matches discovery issuer
3. Token signature verified using keys from discovery `jwks_uri`

**Result:** Attacker cannot create valid token because they don't have authorization server's private key.

---

## Dynamic Updates and Configuration Changes

### Configuration Updates

Authorization servers may update their configuration over time:

**Safe Changes (Non-Breaking):**
- Add new endpoints (e.g., new `revocation_endpoint`)
- Add new supported features (e.g., new scope)
- Add new signing algorithms
- Add new response modes

**Example:**
```json
// Before
{
  "scopes_supported": ["openid", "profile", "email"]
}

// After (backward compatible)
{
  "scopes_supported": ["openid", "profile", "email", "phone", "address"]
}
```

**Breaking Changes:**
- Remove endpoints (e.g., remove `userinfo_endpoint`)
- Remove supported features (e.g., remove scope)
- Change issuer identifier
- Remove signing algorithms

**Example (BREAKING):**
```json
// Before
{
  "issuer": "https://auth.example.com",
  "scopes_supported": ["openid", "profile", "email", "legacy_api"]
}

// After (breaks clients using legacy_api)
{
  "issuer": "https://auth.example.com",
  "scopes_supported": ["openid", "profile", "email"]
}
```

### Client Handling of Updates

**Client Strategy:**

1. **Cache Configuration:** Cache discovery response (e.g., 1 hour)
2. **Periodic Refresh:** Refresh periodically based on TTL
3. **Ignore Unknown Fields:** Clients MUST ignore fields they don't understand
4. **Graceful Degradation:** Handle missing optional features

**Unknown Field Handling:**

```python
def parse_discovery_response(response):
    """Parse discovery response, ignoring unknown fields"""
    config = json.loads(response)
    
    # Extract known fields
    known_config = {
        'issuer': config.get('issuer'),
        'authorization_endpoint': config.get('authorization_endpoint'),
        # ... other known fields
    }
    
    # Store full response for future compatibility
    known_config['_raw'] = config
    
    return known_config
```

**Backward Compatibility:**

Authorization servers SHOULD maintain backward compatibility:

```python
# Authorization server adds new endpoint
# Old config:
{
  "token_endpoint": "https://auth.example.com/token"
}

# New config (backward compatible):
{
  "token_endpoint": "https://auth.example.com/token",  // Keep old
  "token_endpoint_v2": "https://auth.example.com/v2/token"  // Add new
}
```

### Configuration Versioning

**No Version Field:**

Discovery has no explicit version field. Clients must handle configuration evolution gracefully.

**Version Indication (Implicit):**

```json
{
  "issuer": "https://auth.example.com",
  // Presence of these fields indicates support
  "code_challenge_methods_supported": ["S256"],  // PKCE support
  "dpop_signing_alg_values_supported": ["RS256"],  // DPoP support
  "pushed_authorization_request_endpoint": "..."  // PAR support
}
```

### Deprecation Strategy

**Authorization Server Deprecating Features:**

1. **Announce Deprecation:** Document deprecation timeline
2. **Keep Supporting:** Continue supporting for grace period
3. **Warn Clients:** Log warnings for deprecated feature usage
4. **Remove Eventually:** Remove after sufficient warning

**Example Deprecation Timeline:**

```
Month 0: Announce deprecation of implicit flow
Month 3: Add warnings to authorization responses
Month 6: Reduce support (rate limit)
Month 12: Remove from discovery response
Month 18: Complete removal
```

---

## Multi-Tenant Scenarios

### Multi-Tenant Architecture Patterns

#### Pattern 1: Path-Based Issuers

**Structure:** Different paths for different tenants

**Example:**
```
Tenant A: https://auth.example.com/tenantA
Tenant B: https://auth.example.com/tenantB
```

**Discovery URLs:**
```
Tenant A: https://auth.example.com/.well-known/openid-configuration
          (with issuer: "https://auth.example.com/tenantA")
Tenant B: https://auth.example.com/.well-known/openid-configuration
          (with issuer: "https://auth.example.com/tenantB")
```

**Discovery Response (Tenant A):**
```json
{
  "issuer": "https://auth.example.com/tenantA",
  "authorization_endpoint": "https://auth.example.com/tenantA/authorize",
  "token_endpoint": "https://auth.example.com/tenantA/token",
  "jwks_uri": "https://auth.example.com/tenantA/.well-known/jwks.json"
}
```

**Note:** RFC 8414 §3.1 specifies that for path-based issuers, the discovery URL includes the path in a specific way:
```
Issuer: https://example.com/tenants/tenant1
Discovery: https://example.com/.well-known/oauth-authorization-server/tenants/tenant1
```

#### Pattern 2: Subdomain-Based Issuers

**Structure:** Different subdomains for different tenants

**Example:**
```
Tenant A: https://tenanta.auth.example.com
Tenant B: https://tenantb.auth.example.com
```

**Discovery URLs:**
```
Tenant A: https://tenanta.auth.example.com/.well-known/openid-configuration
Tenant B: https://tenantb.auth.example.com/.well-known/openid-configuration
```

**Discovery Response (Tenant A):**
```json
{
  "issuer": "https://tenanta.auth.example.com",
  "authorization_endpoint": "https://tenanta.auth.example.com/authorize",
  "token_endpoint": "https://tenanta.auth.example.com/token",
  "jwks_uri": "https://tenanta.auth.example.com/.well-known/jwks.json"
}
```

#### Pattern 3: Query Parameter (NOT RECOMMENDED)

**Structure:** Tenant ID in query parameter

**Problem:** Issuer MUST NOT contain query component (OIDC Discovery §2)

**Invalid Example:**
```
❌ https://auth.example.com?tenant=tenantA
```

**Workaround:** Use path or subdomain instead.

### Client Configuration in Multi-Tenant Scenarios

```python
class MultiTenantOIDCClient:
    def __init__(self):
        self.tenant_configs = {}  # Cache per tenant
    
    def get_config_for_tenant(self, tenant_id):
        """Get discovery config for specific tenant"""
        # Check cache
        if tenant_id in self.tenant_configs:
            return self.tenant_configs[tenant_id]
        
        # Construct tenant-specific issuer
        issuer = f"https://auth.example.com/{tenant_id}"
        
        # Fetch discovery
        client = OIDCDiscoveryClient(issuer)
        config = client.get_configuration()
        
        # Cache
        self.tenant_configs[tenant_id] = config
        
        return config
    
    def authorize_for_tenant(self, tenant_id):
        """Start authorization for tenant"""
        config = self.get_config_for_tenant(tenant_id)
        
        # Use tenant-specific endpoints
        authorization_url = config['authorization_endpoint']
        # ... construct authorization request
```

### Shared vs Separate JWKS

**Option 1: Separate JWKS per Tenant**

```json
// Tenant A
{
  "issuer": "https://auth.example.com/tenantA",
  "jwks_uri": "https://auth.example.com/tenantA/.well-known/jwks.json"
}

// Tenant B
{
  "issuer": "https://auth.example.com/tenantB",
  "jwks_uri": "https://auth.example.com/tenantB/.well-known/jwks.json"
}
```

**Option 2: Shared JWKS**

```json
// Both tenants
{
  "jwks_uri": "https://auth.example.com/.well-known/jwks.json"
}
```

**Recommendation:** Separate JWKS per tenant provides:
- Better isolation
- Independent key rotation
- Tenant-specific key compromise containment

---

## Security Considerations

**Specification:** OIDC Discovery §5, RFC 8414 §5

### HTTPS Requirement

**Requirement:** Discovery endpoint MUST use HTTPS (RFC 2119: MUST).

**Rationale:**
- Protects discovery response integrity
- Prevents MITM modification of endpoints
- Ensures clients connect to legitimate endpoints

**Attack Scenario (HTTP Discovery):**

```
1. Client requests: http://auth.example.com/.well-known/openid-configuration
2. Attacker intercepts and modifies:
   {
     "issuer": "https://auth.example.com",
     "authorization_endpoint": "https://evil.com/authorize",  // Modified!
     "token_endpoint": "https://evil.com/token"              // Modified!
   }
3. Client uses attacker's endpoints
4. Attacker captures credentials and tokens
```

**Defense:** HTTPS prevents modification, client validates TLS certificate.

### Issuer Validation

**Requirement:** Client MUST validate issuer in discovery response matches expected issuer.

**Attack Scenario (Issuer Substitution):**

```
1. Client expects issuer: https://auth.example.com
2. Attacker returns discovery with: https://evil.com
3. Client uses attacker's endpoints
4. Attacker captures credentials
```

**Defense:**

```python
def validate_issuer(config, expected_issuer):
    if config['issuer'] != expected_issuer:
        raise SecurityError("Issuer mismatch - possible attack")
```

### JWKS Caching and Verification

**Discovery provides `jwks_uri`:**

```json
{
  "jwks_uri": "https://auth.example.com/.well-known/jwks.json"
}
```

**Security Requirements:**

1. **Fetch JWKS over HTTPS:** Prevent key tampering
2. **Cache JWKS:** With reasonable TTL (e.g., 1 hour)
3. **Refresh on Unknown kid:** If token has unknown `kid`, refresh JWKS
4. **Verify Signatures:** Using keys from JWKS

**JWKS Caching:**

```python
class JWKSCache:
    def __init__(self, jwks_uri, ttl_seconds=3600):
        self.jwks_uri = jwks_uri
        self.ttl_seconds = ttl_seconds
        self.jwks = None
        self.cached_at = None
    
    def get_key(self, kid):
        """Get key by kid, refresh if necessary"""
        # Check cache
        if self._is_cache_valid():
            key = self._find_key(kid)
            if key:
                return key
        
        # Refresh JWKS
        self._refresh_jwks()
        
        # Try again
        key = self._find_key(kid)
        if not key:
            raise KeyNotFoundError(f"Key {kid} not found in JWKS")
        
        return key
    
    def _refresh_jwks(self):
        """Fetch fresh JWKS"""
        response = requests.get(self.jwks_uri)
        self.jwks = response.json()
        self.cached_at = datetime.now()
```

**Related Documentation:** See `jwks-and-key-rotation.md` for complete JWKS specification.

### Configuration Cache Poisoning

**Threat:** Attacker poisons cached discovery configuration.

**Attack Scenario:**

```
1. Attacker compromises cache (Redis, Memcached)
2. Attacker modifies cached discovery response
3. Client uses poisoned configuration
4. Client connects to attacker's endpoints
```

**Defenses:**

1. **Secure Cache:** Authenticate cache access
2. **Validate on Retrieval:** Re-validate cached configuration
3. **Reasonable TTL:** Don't cache forever
4. **Integrity Protection:** HMAC cached configuration

**Cache with Integrity Protection:**

```python
import hmac
import hashlib

class SecureCachedDiscovery:
    def __init__(self, cache, secret_key):
        self.cache = cache
        self.secret_key = secret_key
    
    def set_config(self, issuer, config):
        """Store configuration with HMAC"""
        config_json = json.dumps(config)
        
        # Compute HMAC
        mac = hmac.new(
            self.secret_key.encode(),
            config_json.encode(),
            hashlib.sha256
        ).hexdigest()
        
        # Store both config and MAC
        self.cache.set(f"config:{issuer}", config_json)
        self.cache.set(f"mac:{issuer}", mac)
    
    def get_config(self, issuer):
        """Retrieve and verify configuration"""
        config_json = self.cache.get(f"config:{issuer}")
        stored_mac = self.cache.get(f"mac:{issuer}")
        
        if not config_json or not stored_mac:
            return None
        
        # Verify HMAC
        computed_mac = hmac.new(
            self.secret_key.encode(),
            config_json,
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(stored_mac, computed_mac):
            raise SecurityError("Configuration integrity check failed")
        
        return json.loads(config_json)
```

### Discovery Response Size

**Consideration:** Discovery responses can be large (1-10 KB).

**Security Implications:**
- **Large Response:** May indicate attack (amplification)
- **Reasonable Limit:** Reject responses > 100 KB

**Size Validation:**

```python
def fetch_discovery_with_size_limit(discovery_url, max_size=102400):
    """Fetch discovery with size limit"""
    response = requests.get(
        discovery_url,
        stream=True,
        timeout=10
    )
    
    # Check Content-Length if provided
    content_length = response.headers.get('Content-Length')
    if content_length and int(content_length) > max_size:
        raise SecurityError(f"Discovery response too large: {content_length}")
    
    # Read with limit
    content = b''
    for chunk in response.iter_content(chunk_size=8192):
        content += chunk
        if len(content) > max_size:
            raise SecurityError("Discovery response exceeded size limit")
    
    return json.loads(content)
```

### Redirect Following

**Consideration:** Discovery endpoint may return redirects.

**Security Risk:** Redirect to malicious host.

**Recommendation:**

1. **Limit Redirects:** Maximum 3 redirects
2. **Validate Redirect Target:** Must be HTTPS
3. **Prevent Redirect Loops:** Track visited URLs

**Safe Redirect Handling:**

```python
def fetch_discovery_with_safe_redirects(discovery_url, max_redirects=3):
    """Fetch discovery following redirects safely"""
    session = requests.Session()
    session.max_redirects = max_redirects
    
    # Custom redirect handling
    class SafeRedirectPolicy:
        def __call__(self, response, *args, **kwargs):
            # Check redirect target uses HTTPS
            if response.is_redirect:
                redirect_url = response.headers.get('Location')
                if not redirect_url.startswith('https://'):
                    raise SecurityError("Redirect must use HTTPS")
            return response
    
    session.hooks['response'] = SafeRedirectPolicy()
    
    return session.get(discovery_url).json()
```

---

## Implementation Checklist

### Authorization Server Checklist

Authorization servers implementing discovery MUST:

- [ ] **Implement Discovery Endpoint**
  - [ ] Endpoint at `/.well-known/openid-configuration`
  - [ ] Returns JSON with `application/json` content type
  - [ ] HTTP 200 status for success
  - [ ] HTTPS required for production

- [ ] **Required Metadata Fields (OIDC Discovery §4.2)**
  - [ ] `issuer` field present and matches expected value
  - [ ] `authorization_endpoint` (HTTPS URL)
  - [ ] `token_endpoint` (HTTPS URL)
  - [ ] `jwks_uri` (HTTPS URL to JWKS document)
  - [ ] `response_types_supported` array
  - [ ] `subject_types_supported` array (at least "public")
  - [ ] `id_token_signing_alg_values_supported` (includes RS256)

- [ ] **Recommended Metadata Fields**
  - [ ] `userinfo_endpoint` if supported
  - [ ] `registration_endpoint` if dynamic registration supported
  - [ ] `scopes_supported` array
  - [ ] `claims_supported` array
  - [ ] `grant_types_supported` array
  - [ ] `token_endpoint_auth_methods_supported` array

- [ ] **Security Features**
  - [ ] `code_challenge_methods_supported` includes "S256" (PKCE)
  - [ ] Advertise only actually supported features
  - [ ] All endpoint URLs use HTTPS
  - [ ] JWKS endpoint properly configured

- [ ] **Advanced Features (if supported)**
  - [ ] `revocation_endpoint` if token revocation supported
  - [ ] `introspection_endpoint` if introspection supported
  - [ ] `device_authorization_endpoint` if device flow supported
  - [ ] `pushed_authorization_request_endpoint` if PAR supported

- [ ] **Configuration Management**
  - [ ] Keep discovery response updated
  - [ ] Maintain backward compatibility when possible
  - [ ] Document breaking changes
  - [ ] Provide migration path for deprecated features

### Client Checklist

Clients using discovery SHOULD:

- [ ] **Discovery Implementation**
  - [ ] Fetch discovery on initialization (don't hardcode endpoints)
  - [ ] Construct discovery URL correctly from issuer
  - [ ] Use HTTPS for discovery requests
  - [ ] Handle discovery endpoint errors gracefully

- [ ] **Discovery Response Validation**
  - [ ] Validate `issuer` matches expected value
  - [ ] Check all required fields present
  - [ ] Validate endpoint URLs use HTTPS
  - [ ] Reject invalid or incomplete configuration

- [ ] **Configuration Caching**
  - [ ] Cache discovery response (recommended: 1 hour TTL)
  - [ ] Implement cache invalidation
  - [ ] Use cached config on discovery failure (if fresh enough)

- [ ] **Feature Detection**
  - [ ] Check `response_types_supported` for flow availability
  - [ ] Check `code_challenge_methods_supported` for PKCE
  - [ ] Check `scopes_supported` before requesting scopes
  - [ ] Check signing algorithms supported

- [ ] **Token Validation**
  - [ ] Validate token `iss` claim matches discovery `issuer`
  - [ ] Fetch JWKS from `jwks_uri`
  - [ ] Cache JWKS with appropriate TTL
  - [ ] Refresh JWKS on unknown `kid`

- [ ] **Error Handling**
  - [ ] Handle discovery endpoint unavailable
  - [ ] Handle malformed JSON
  - [ ] Handle missing required fields
  - [ ] Log errors for debugging

- [ ] **Security**
  - [ ] Validate TLS certificates
  - [ ] Limit redirect following
  - [ ] Implement size limits for responses
  - [ ] Protect cached configuration

### Common Implementation Errors

**❌ DON'T:**

1. **Hardcode endpoint URLs**
   ```python
   # Wrong!
   token_endpoint = "https://auth.example.com/token"
   ```

2. **Skip discovery validation**
   ```python
   # Wrong!
   config = requests.get(discovery_url).json()
   # (no validation)
   ```

3. **Cache forever**
   ```python
   # Wrong!
   if not self.config:
       self.config = fetch_discovery()
   # (never refreshes)
   ```

4. **Ignore issuer mismatch**
   ```python
   # Wrong!
   config = fetch_discovery(issuer_url)
   # (don't check config['issuer'] == issuer_url)
   ```

5. **Assume features without checking**
   ```python
   # Wrong!
   # (assume PKCE supported without checking discovery)
   ```

**✅ DO:**

1. **Use discovery to get endpoints**
   ```python
   config = fetch_and_validate_discovery(issuer_url)
   token_endpoint = config['token_endpoint']
   ```

2. **Validate discovery response**
   ```python
   config = fetch_discovery(discovery_url)
   validate_required_fields(config)
   validate_issuer(config, expected_issuer)
   validate_https_endpoints(config)
   ```

3. **Cache with TTL**
   ```python
   if cache_expired or not self.config:
       self.config = fetch_discovery()
       self.cached_at = datetime.now()
   ```

4. **Validate issuer**
   ```python
   if config['issuer'] != expected_issuer:
       raise ConfigurationError("Issuer mismatch")
   ```

5. **Check features in discovery**
   ```python
   methods = config.get('code_challenge_methods_supported', [])
   use_pkce = 'S256' in methods
   ```

---

## Discovery in Different Deployment Scenarios

### Scenario 1: Single Authorization Server

**Architecture:**
```
┌─────────────────────────┐
│ Authorization Server    │
│ https://auth.example.com│
└─────────────────────────┘
```

**Discovery:**
- Single discovery endpoint
- Simple configuration
- All endpoints on same host

**Discovery URL:**
```
https://auth.example.com/.well-known/openid-configuration
```

**Discovery Response:**
```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "jwks_uri": "https://auth.example.com/.well-known/jwks.json"
}
```

### Scenario 2: Load-Balanced Authorization Servers

**Architecture:**
```
                     ┌──────────────┐
          ┌──────────│ Load Balancer│──────────┐
          │          └──────────────┘          │
          │                                    │
    ┌─────▼─────┐                      ┌──────▼────┐
    │  AS Node 1│                      │ AS Node 2 │
    └───────────┘                      └───────────┘
```

**Discovery:**
- Same discovery response from all nodes
- Load balancer handles routing
- Consistent configuration across instances

**Discovery URL:**
```
https://auth.example.com/.well-known/openid-configuration
```

**All Nodes Return Same Response:**
```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "jwks_uri": "https://auth.example.com/.well-known/jwks.json"
}
```

**Implementation Note:** Configuration MUST be identical across all nodes.

### Scenario 3: Geo-Distributed Deployment

**Architecture:**
```
┌─────────────────┐              ┌─────────────────┐
│  US Region      │              │  EU Region      │
│  auth-us.ex.com │              │  auth-eu.ex.com │
└─────────────────┘              └─────────────────┘
```

**Option A: Different Issuers per Region**

```json
// US
{
  "issuer": "https://auth-us.example.com",
  "authorization_endpoint": "https://auth-us.example.com/authorize",
  "token_endpoint": "https://auth-us.example.com/token"
}

// EU
{
  "issuer": "https://auth-eu.example.com",
  "authorization_endpoint": "https://auth-eu.example.com/authorize",
  "token_endpoint": "https://auth-eu.example.com/token"
}
```

**Option B: Shared Issuer with Routing**

```json
// Both regions, issuer same but routing differs
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token"
}
```

**Routing:** DNS or load balancer routes to closest region.

### Scenario 4: Development/Staging/Production

**Architecture:**
```
Dev:     http://localhost:8080
Staging: https://auth-staging.example.com
Prod:    https://auth.example.com
```

**Different Issuers per Environment:**

```python
class EnvironmentConfig:
    ENVIRONMENTS = {
        'dev': {
            'issuer': 'http://localhost:8080',
            'allow_http': True
        },
        'staging': {
            'issuer': 'https://auth-staging.example.com',
            'allow_http': False
        },
        'prod': {
            'issuer': 'https://auth.example.com',
            'allow_http': False
        }
    }
    
    @classmethod
    def get_issuer(cls, env):
        return cls.ENVIRONMENTS[env]['issuer']

# Usage
issuer = EnvironmentConfig.get_issuer(os.getenv('ENV'))
client = OIDCDiscoveryClient(issuer)
```

**Discovery URLs:**
```
Dev:     http://localhost:8080/.well-known/openid-configuration
Staging: https://auth-staging.example.com/.well-known/openid-configuration
Prod:    https://auth.example.com/.well-known/openid-configuration
```

### Scenario 5: Microservices Architecture

**Architecture:**
```
┌────────────────┐      ┌──────────────┐
│ Auth Service   │      │ API Gateway  │
│ (auth.ex.com)  │      │ (api.ex.com) │
└────────────────┘      └──────────────┘
        │                       │
        └───────────────────────┘
                  │
        ┌─────────▼─────────┐
        │  Resource Services │
        └───────────────────┘
```

**Discovery:**
- Auth service provides discovery
- API Gateway validates tokens using JWKS from discovery
- Resource services validate tokens using shared JWKS

**Auth Service Discovery:**
```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "jwks_uri": "https://auth.example.com/.well-known/jwks.json"
}
```

**Resource Service Validation:**
```python
class ResourceService:
    def __init__(self, auth_issuer):
        # Fetch discovery once
        self.discovery = OIDCDiscoveryClient(auth_issuer)
        self.jwks_client = JWKSClient(self.discovery.get_jwks_uri())
    
    def validate_access_token(self, access_token):
        """Validate token using discovered JWKS"""
        key = self.jwks_client.get_key(access_token.kid)
        verify_signature(access_token, key)
        
        claims = decode_jwt(access_token)
        if claims['iss'] != self.discovery.get_issuer():
            raise ValidationError("Invalid issuer")
```

---

## Example Client Configuration Using Discovery

### Complete Python Example

```python
#!/usr/bin/env python3
"""
Complete OIDC Discovery Client Example
Demonstrates best practices for discovery-based configuration
"""

import requests
import json
import time
from datetime import datetime, timedelta
from urllib.parse import urlencode, urlparse

class ConfigurationError(Exception):
    """Configuration error"""
    pass

class OIDCClient:
    """Complete OIDC client with discovery support"""
    
    def __init__(self, issuer_url, client_id, client_secret=None, 
                 redirect_uri=None, cache_ttl=3600):
        """
        Initialize OIDC client
        
        Args:
            issuer_url: Authorization server issuer URL
            client_id: Client ID
            client_secret: Client secret (None for public clients)
            redirect_uri: Redirect URI
            cache_ttl: Discovery cache TTL in seconds
        """
        self.issuer_url = issuer_url.rstrip('/')
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
        self.cache_ttl = cache_ttl
        
        # Discovery configuration
        self.config = None
        self.config_cached_at = None
        
        # Initialize: fetch discovery
        self._refresh_configuration()
    
    def _refresh_configuration(self):
        """Fetch fresh discovery configuration"""
        discovery_url = self.issuer_url + "/.well-known/openid-configuration"
        
        try:
            response = requests.get(
                discovery_url,
                headers={'Accept': 'application/json'},
                timeout=10
            )
            
            if response.status_code != 200:
                raise ConfigurationError(
                    f"Discovery failed: HTTP {response.status_code}"
                )
            
            config = response.json()
            
            # Validate configuration
            self._validate_configuration(config)
            
            # Store configuration
            self.config = config
            self.config_cached_at = datetime.now()
            
        except requests.exceptions.RequestException as e:
            raise ConfigurationError(f"Discovery request failed: {e}")
        except json.JSONDecodeError as e:
            raise ConfigurationError(f"Invalid JSON in discovery: {e}")
    
    def _validate_configuration(self, config):
        """Validate discovery response"""
        # Required fields
        required = [
            'issuer',
            'authorization_endpoint',
            'token_endpoint',
            'jwks_uri',
            'response_types_supported',
            'subject_types_supported',
            'id_token_signing_alg_values_supported'
        ]
        
        missing = [f for f in required if f not in config]
        if missing:
            raise ConfigurationError(f"Missing required fields: {missing}")
        
        # Validate issuer
        if config['issuer'] != self.issuer_url:
            raise ConfigurationError(
                f"Issuer mismatch: expected {self.issuer_url}, "
                f"got {config['issuer']}"
            )
        
        # Validate HTTPS
        for field in ['authorization_endpoint', 'token_endpoint', 'jwks_uri']:
            url = config[field]
            if not url.startswith('https://'):
                if not url.startswith('http://localhost'):
                    raise ConfigurationError(f"{field} must use HTTPS")
    
    def _get_configuration(self):
        """Get configuration (cached or fresh)"""
        # Check if cache expired
        if self.config_cached_at:
            age = datetime.now() - self.config_cached_at
            if age.total_seconds() >= self.cache_ttl:
                self._refresh_configuration()
        
        return self.config
    
    def build_authorization_url(self, scope, state, code_challenge=None,
                               code_challenge_method='S256', **extra_params):
        """
        Build authorization URL
        
        Args:
            scope: Space-separated scopes (e.g., "openid profile email")
            state: State parameter for CSRF protection
            code_challenge: PKCE code challenge
            code_challenge_method: PKCE method (S256 or plain)
            **extra_params: Additional parameters
        
        Returns:
            Authorization URL
        """
        config = self._get_configuration()
        
        # Check if authorization code flow is supported
        if 'code' not in config['response_types_supported']:
            raise ConfigurationError("Authorization code flow not supported")
        
        # Build parameters
        params = {
            'response_type': 'code',
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'scope': scope,
            'state': state
        }
        
        # Add PKCE if provided
        if code_challenge:
            params['code_challenge'] = code_challenge
            params['code_challenge_method'] = code_challenge_method
        elif self._supports_pkce():
            # PKCE supported but not provided - warn
            print("Warning: PKCE supported but code_challenge not provided")
        
        # Add extra parameters
        params.update(extra_params)
        
        # Build URL
        authorization_endpoint = config['authorization_endpoint']
        return f"{authorization_endpoint}?{urlencode(params)}"
    
    def exchange_code(self, code, code_verifier=None):
        """
        Exchange authorization code for tokens
        
        Args:
            code: Authorization code
            code_verifier: PKCE code verifier
        
        Returns:
            Token response dictionary
        """
        config = self._get_configuration()
        token_endpoint = config['token_endpoint']
        
        # Build token request
        data = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': self.redirect_uri,
            'client_id': self.client_id
        }
        
        # Add code verifier for PKCE
        if code_verifier:
            data['code_verifier'] = code_verifier
        
        # Authentication
        auth = None
        if self.client_secret:
            # Confidential client - use client_secret_basic
            auth = (self.client_id, self.client_secret)
        
        # Make request
        response = requests.post(
            token_endpoint,
            data=data,
            auth=auth,
            headers={'Accept': 'application/json'},
            timeout=10
        )
        
        if response.status_code != 200:
            raise ConfigurationError(
                f"Token exchange failed: HTTP {response.status_code} - {response.text}"
            )
        
        return response.json()
    
    def refresh_token(self, refresh_token):
        """
        Refresh access token
        
        Args:
            refresh_token: Refresh token
        
        Returns:
            Token response dictionary
        """
        config = self._get_configuration()
        token_endpoint = config['token_endpoint']
        
        # Check if refresh token grant is supported
        grant_types = config.get('grant_types_supported', [])
        if 'refresh_token' not in grant_types:
            raise ConfigurationError("Refresh token grant not supported")
        
        # Build request
        data = {
            'grant_type': 'refresh_token',
            'refresh_token': refresh_token,
            'client_id': self.client_id
        }
        
        # Authentication
        auth = None
        if self.client_secret:
            auth = (self.client_id, self.client_secret)
        
        # Make request
        response = requests.post(
            token_endpoint,
            data=data,
            auth=auth,
            headers={'Accept': 'application/json'},
            timeout=10
        )
        
        if response.status_code != 200:
            raise ConfigurationError(
                f"Token refresh failed: HTTP {response.status_code}"
            )
        
        return response.json()
    
    def _supports_pkce(self):
        """Check if PKCE is supported"""
        config = self._get_configuration()
        methods = config.get('code_challenge_methods_supported', [])
        return 'S256' in methods or 'plain' in methods
    
    def get_supported_scopes(self):
        """Get list of supported scopes"""
        config = self._get_configuration()
        return config.get('scopes_supported', [])
    
    def get_jwks_uri(self):
        """Get JWKS URI"""
        config = self._get_configuration()
        return config['jwks_uri']

# Usage Example
def main():
    """Example usage"""
    try:
        # Initialize client with discovery
        client = OIDCClient(
            issuer_url='https://auth.example.com',
            client_id='my_client_id',
            client_secret='my_client_secret',
            redirect_uri='https://client.example.com/callback'
        )
        
        # Check supported scopes
        scopes = client.get_supported_scopes()
        print(f"Supported scopes: {scopes}")
        
        # Build authorization URL with PKCE
        import secrets
        import hashlib
        import base64
        
        # Generate PKCE parameters
        code_verifier = secrets.token_urlsafe(32)
        code_challenge = base64.urlsafe_b64encode(
            hashlib.sha256(code_verifier.encode()).digest()
        ).decode().rstrip('=')
        
        # Generate state
        state = secrets.token_urlsafe(32)
        
        # Build URL
        auth_url = client.build_authorization_url(
            scope='openid profile email',
            state=state,
            code_challenge=code_challenge,
            code_challenge_method='S256'
        )
        
        print(f"Authorization URL: {auth_url}")
        
        # After user authorizes and returns with code...
        # code = '...'  # From query parameters
        
        # Exchange code for tokens
        # token_response = client.exchange_code(code, code_verifier)
        # print(f"Access token: {token_response['access_token']}")
        
    except ConfigurationError as e:
        print(f"Configuration error: {e}")

if __name__ == '__main__':
    main()
```

---

## Troubleshooting Discovery Issues

### Common Issues and Solutions

#### Issue 1: Discovery Endpoint Returns 404

**Symptoms:**
```
HTTP 404 Not Found
GET https://auth.example.com/.well-known/openid-configuration
```

**Possible Causes:**
1. Incorrect issuer URL
2. Discovery not implemented
3. Incorrect path construction

**Diagnosis:**
```bash
# Test manually
curl -v https://auth.example.com/.well-known/openid-configuration

# Check different paths
curl -v https://auth.example.com/oauth2/.well-known/openid-configuration
```

**Solutions:**
- Verify issuer URL is correct
- Check if server implements OIDC Discovery
- Try OAuth 2.0 metadata endpoint: `/.well-known/oauth-authorization-server`
- Contact authorization server administrator

#### Issue 2: Invalid JSON Response

**Symptoms:**
```
JSONDecodeError: Expecting value: line 1 column 1 (char 0)
```

**Possible Causes:**
1. Server returning HTML error page
2. Malformed JSON
3. Empty response

**Diagnosis:**
```bash
# Check response content
curl -v https://auth.example.com/.well-known/openid-configuration

# Check Content-Type
curl -I https://auth.example.com/.well-known/openid-configuration
```

**Solutions:**
```python
def fetch_discovery_with_validation(discovery_url):
    """Fetch discovery with content type validation"""
    response = requests.get(discovery_url)
    
    # Check Content-Type
    content_type = response.headers.get('Content-Type', '')
    if 'application/json' not in content_type:
        raise ConfigurationError(
            f"Invalid Content-Type: {content_type}. "
            f"Response: {response.text[:200]}"
        )
    
    try:
        return response.json()
    except json.JSONDecodeError as e:
        raise ConfigurationError(
            f"Invalid JSON: {e}. Response: {response.text[:200]}"
        )
```

#### Issue 3: Missing Required Fields

**Symptoms:**
```
ConfigurationError: Missing required field: jwks_uri
```

**Possible Causes:**
1. Incomplete discovery implementation
2. Server misconfiguration
3. OAuth 2.0 metadata instead of OIDC discovery

**Diagnosis:**
```bash
# Check which fields are present
curl -s https://auth.example.com/.well-known/openid-configuration | jq 'keys'

# Compare with OIDC required fields
```

**Solutions:**
- Check server documentation
- Contact authorization server administrator
- If using OAuth 2.0 (not OIDC), adjust required fields
- Implement fallback to manual configuration

#### Issue 4: HTTPS Certificate Error

**Symptoms:**
```
SSLError: [SSL: CERTIFICATE_VERIFY_FAILED]
```

**Possible Causes:**
1. Self-signed certificate
2. Expired certificate
3. Certificate hostname mismatch
4. Missing CA certificate

**Diagnosis:**
```bash
# Check certificate
openssl s_client -connect auth.example.com:443 -servername auth.example.com

# Check certificate expiry
echo | openssl s_client -connect auth.example.com:443 2>/dev/null | openssl x509 -noout -dates
```

**Solutions:**
```python
# Development only - disable verification (DON'T USE IN PRODUCTION)
response = requests.get(discovery_url, verify=False)

# Production - add CA certificate
response = requests.get(
    discovery_url,
    verify='/path/to/ca-bundle.crt'
)

# Or install system CA certificates
import certifi
response = requests.get(discovery_url, verify=certifi.where())
```

#### Issue 5: Issuer Mismatch

**Symptoms:**
```
ConfigurationError: Issuer mismatch: expected https://auth.example.com, 
                    got https://auth-prod.example.com
```

**Possible Causes:**
1. Incorrect issuer URL in client configuration
2. Server redirecting to different issuer
3. Load balancer returning different issuer

**Diagnosis:**
```bash
# Check issuer in discovery
curl -s https://auth.example.com/.well-known/openid-configuration | jq '.issuer'

# Check for redirects
curl -v https://auth.example.com/.well-known/openid-configuration 2>&1 | grep Location
```

**Solutions:**
- Update client configuration with correct issuer
- Configure server to return correct issuer
- Normalize issuer URL (remove trailing slash)

### Debug Checklist

When troubleshooting discovery issues:

- [ ] **Verify Issuer URL**
  - [ ] Correct hostname
  - [ ] Correct path (if any)
  - [ ] HTTPS scheme
  - [ ] No trailing slash (or normalize)

- [ ] **Test Discovery Endpoint Manually**
  ```bash
  curl -v https://auth.example.com/.well-known/openid-configuration
  ```

- [ ] **Check HTTP Response**
  - [ ] Status code 200
  - [ ] Content-Type: application/json
  - [ ] Valid JSON body

- [ ] **Validate JSON Structure**
  ```bash
  curl -s https://auth.example.com/.well-known/openid-configuration | jq .
  ```

- [ ] **Check Required Fields**
  - [ ] `issuer` present and correct
  - [ ] `authorization_endpoint` present
  - [ ] `token_endpoint` present
  - [ ] `jwks_uri` present
  - [ ] `response_types_supported` present
  - [ ] `subject_types_supported` present
  - [ ] `id_token_signing_alg_values_supported` present

- [ ] **Verify HTTPS Endpoints**
  - [ ] All endpoint URLs use HTTPS
  - [ ] Certificates valid
  - [ ] No certificate warnings

- [ ] **Test JWKS Endpoint**
  ```bash
  # Get jwks_uri from discovery
  jwks_uri=$(curl -s https://auth.example.com/.well-known/openid-configuration | jq -r '.jwks_uri')
  
  # Fetch JWKS
  curl -s "$jwks_uri" | jq .
  ```

- [ ] **Check Network/Firewall**
  - [ ] Can reach discovery endpoint
  - [ ] No proxy issues
  - [ ] No firewall blocking

### Logging for Debugging

**Comprehensive Logging:**

```python
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def fetch_discovery_with_logging(discovery_url):
    """Fetch discovery with comprehensive logging"""
    logger.info(f"Fetching discovery from: {discovery_url}")
    
    try:
        # Make request
        response = requests.get(
            discovery_url,
            headers={'Accept': 'application/json'},
            timeout=10
        )
        
        # Log response
        logger.debug(f"Response status: {response.status_code}")
        logger.debug(f"Response headers: {response.headers}")
        logger.debug(f"Response body: {response.text[:500]}")
        
        # Check status
        if response.status_code != 200:
            logger.error(f"Discovery failed with status {response.status_code}")
            raise ConfigurationError(f"HTTP {response.status_code}")
        
        # Parse JSON
        config = response.json()
        logger.info(f"Discovery successful. Issuer: {config.get('issuer')}")
        
        # Log important fields
        logger.debug(f"Authorization endpoint: {config.get('authorization_endpoint')}")
        logger.debug(f"Token endpoint: {config.get('token_endpoint')}")
        logger.debug(f"JWKS URI: {config.get('jwks_uri')}")
        
        return config
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Request failed: {e}")
        raise
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode failed: {e}")
        logger.error(f"Response text: {response.text[:500]}")
        raise
```

---

## Discovery vs Manual Configuration

### When to Use Discovery

**Advantages of Discovery:**

1. **Always Up-to-Date**
   - Automatic endpoint updates
   - No hardcoded configuration
   - Reflects current server capabilities

2. **Reduces Configuration Errors**
   - No typos in endpoint URLs
   - No outdated configurations
   - Automatic feature detection

3. **Supports Multiple Environments**
   - Same code works in dev/staging/prod
   - Just change issuer URL
   - No environment-specific configs

4. **Future-Proof**
   - New endpoints discovered automatically
   - New features advertised
   - No client updates needed for endpoint changes

5. **Standard Compliance**
   - OIDC/OAuth 2.0 best practice
   - Interoperability with multiple providers
   - Follows specifications

**Use Discovery When:**
- Implementing new client
- Supporting multiple authorization servers
- Deploying across multiple environments
- Server configuration may change
- Following OAuth 2.1 / OIDC best practices

### When to Use Manual Configuration

**Advantages of Manual Configuration:**

1. **Works Without Discovery Support**
   - Legacy authorization servers
   - Custom implementations
   - Discovery not available

2. **Explicit Control**
   - Know exactly which endpoints used
   - No runtime discovery failures
   - Configuration in code/config files

3. **Offline Operation**
   - No discovery fetch at startup
   - No dependency on discovery endpoint
   - Works without network access

4. **Simpler for Single Provider**
   - If only one authorization server
   - Configuration rarely changes
   - Less complexity

**Use Manual Configuration When:**
- Authorization server doesn't support discovery
- Deploying in restricted network environments
- Absolute control over configuration required
- Discovery endpoint unreliable
- Legacy system constraints

### Hybrid Approach (Recommended)

**Strategy:** Try discovery first, fallback to manual configuration.

```python
class FlexibleOIDCClient:
    """OIDC client with discovery and manual config fallback"""
    
    def __init__(self, issuer_url=None, manual_config=None, client_id=None):
        """
        Initialize with either discovery or manual config
        
        Args:
            issuer_url: Issuer URL for discovery
            manual_config: Manual configuration dict
            client_id: Client ID
        """
        self.client_id = client_id
        
        if manual_config:
            # Use manual configuration
            self.config = self._validate_manual_config(manual_config)
            self.config_source = 'manual'
        elif issuer_url:
            # Try discovery
            try:
                self.config = self._fetch_discovery(issuer_url)
                self.config_source = 'discovery'
            except Exception as e:
                # Discovery failed
                print(f"Discovery failed: {e}")
                if manual_config:
                    print("Falling back to manual configuration")
                    self.config = manual_config
                    self.config_source = 'manual_fallback'
                else:
                    raise
        else:
            raise ValueError("Either issuer_url or manual_config required")
    
    def _validate_manual_config(self, config):
        """Validate manual configuration"""
        required = [
            'issuer',
            'authorization_endpoint',
            'token_endpoint'
        ]
        
        for field in required:
            if field not in config:
                raise ValueError(f"Manual config missing: {field}")
        
        return config
    
    def _fetch_discovery(self, issuer_url):
        """Fetch discovery configuration"""
        # ... discovery implementation
        pass

# Usage Examples

# Example 1: Discovery only
client = FlexibleOIDCClient(
    issuer_url='https://auth.example.com',
    client_id='my_client'
)

# Example 2: Manual configuration
client = FlexibleOIDCClient(
    manual_config={
        'issuer': 'https://auth.example.com',
        'authorization_endpoint': 'https://auth.example.com/authorize',
        'token_endpoint': 'https://auth.example.com/token',
        'jwks_uri': 'https://auth.example.com/.well-known/jwks.json'
    },
    client_id='my_client'
)

# Example 3: Discovery with manual fallback
client = FlexibleOIDCClient(
    issuer_url='https://auth.example.com',
    manual_config={
        'issuer': 'https://auth.example.com',
        'authorization_endpoint': 'https://auth.example.com/authorize',
        'token_endpoint': 'https://auth.example.com/token',
        'jwks_uri': 'https://auth.example.com/.well-known/jwks.json'
    },
    client_id='my_client'
)
```

### Comparison Table

| Aspect | Discovery | Manual Config | Hybrid |
|--------|-----------|---------------|--------|
| Setup Complexity | Simple (just issuer URL) | Moderate (all endpoints) | Moderate |
| Runtime Dependency | Requires discovery endpoint | None | Optional discovery |
| Configuration Updates | Automatic | Manual | Automatic if discovery works |
| Network Requirements | Initial fetch required | None | Optional |
| Future-Proof | Yes | No | Yes |
| Debugging | Easier (all info in discovery) | Harder (distributed config) | Moderate |
| Standards Compliance | High | Medium | High |
| Production Readiness | High (if discovery reliable) | High | Highest |

### Best Practices

1. **Default to Discovery**
   ```python
   # Preferred approach
   client = OIDCClient(issuer_url='https://auth.example.com')
   ```

2. **Provide Manual Override**
   ```python
   # Allow manual config for special cases
   if os.getenv('USE_MANUAL_CONFIG'):
       client = OIDCClient(manual_config=load_config())
   else:
       client = OIDCClient(issuer_url=os.getenv('ISSUER_URL'))
   ```

3. **Cache Discovery Response**
   ```python
   # Cache to reduce discovery fetches
   client = OIDCClient(
       issuer_url='https://auth.example.com',
       cache_ttl=3600  # 1 hour
   )
   ```

4. **Monitor Discovery Failures**
   ```python
   # Alert on discovery failures
   try:
       client = OIDCClient(issuer_url=issuer)
   except DiscoveryError as e:
       alert_monitoring('discovery_failed', {'issuer': issuer})
       # Use fallback or fail
   ```

---

## Related Specifications

### Primary Specifications

1. **OpenID Connect Discovery 1.0**
   - URL: https://openid.net/specs/openid-connect-discovery-1_0.html
   - Sections:
     - §2: Terminology
     - §3: Obtaining OpenID Provider Configuration Information
     - §4: OpenID Provider Metadata
     - §4.2: OpenID Provider Metadata (required fields)
     - §5: Security Considerations

2. **RFC 8414: OAuth 2.0 Authorization Server Metadata**
   - URL: https://www.rfc-editor.org/rfc/rfc8414.html
   - Sections:
     - §2: Authorization Server Metadata
     - §3: Obtaining Authorization Server Metadata
     - §5: Security Considerations

### Supporting Specifications

3. **RFC 7517: JSON Web Key (JWK)**
   - URL: https://www.rfc-editor.org/rfc/rfc7517.html
   - For: JWKS endpoint (`jwks_uri`)
   - Related Document: `jwks-and-key-rotation.md`

4. **RFC 7662: OAuth 2.0 Token Introspection**
   - URL: https://www.rfc-editor.org/rfc/rfc7662.html
   - For: `introspection_endpoint`
   - Related Document: `token-introspection-and-revocation.md`

5. **RFC 7009: OAuth 2.0 Token Revocation**
   - URL: https://www.rfc-editor.org/rfc/rfc7009.html
   - For: `revocation_endpoint`
   - Related Document: `token-introspection-and-revocation.md`

6. **RFC 7636: Proof Key for Code Exchange (PKCE)**
   - URL: https://www.rfc-editor.org/rfc/rfc7636.html
   - For: `code_challenge_methods_supported`
   - Related Document: `pkce-implementation.md`

7. **RFC 8628: OAuth 2.0 Device Authorization Grant**
   - URL: https://www.rfc-editor.org/rfc/rfc8628.html
   - For: `device_authorization_endpoint`
   - Related Document: `device-authorization-flow.md`

8. **RFC 9126: OAuth 2.0 Pushed Authorization Requests (PAR)**
   - URL: https://www.rfc-editor.org/rfc/rfc9126.html
   - For: `pushed_authorization_request_endpoint`

9. **RFC 9449: OAuth 2.0 Demonstrating Proof of Possession (DPoP)**
   - URL: https://www.rfc-editor.org/rfc/rfc9449.html
   - For: `dpop_signing_alg_values_supported`
   - Related Document: `token-binding-dpop-mtls.md`

10. **RFC 8705: OAuth 2.0 Mutual-TLS Client Authentication**
    - URL: https://www.rfc-editor.org/rfc/rfc8705.html
    - For: `mtls_endpoint_aliases`
    - Related Document: `token-binding-dpop-mtls.md`

11. **RFC 9101: The OAuth 2.0 Authorization Framework: JWT-Secured Authorization Request (JAR)**
    - URL: https://www.rfc-editor.org/rfc/rfc9101.html
    - For: `request_parameter_supported`, `request_uri_parameter_supported`

12. **OpenID Connect Dynamic Client Registration 1.0**
    - URL: https://openid.net/specs/openid-connect-registration-1_0.html
    - For: `registration_endpoint`

---

## Example Scenarios

### Scenario 1: Client Discovers and Configures Itself

**Situation:** New client needs to configure itself for authorization server.

**Steps:**

```python
# 1. Client has issuer URL
issuer_url = 'https://auth.example.com'

# 2. Fetch discovery
discovery_url = issuer_url + '/.well-known/openid-configuration'
response = requests.get(discovery_url)
config = response.json()

# 3. Extract endpoints
authorization_endpoint = config['authorization_endpoint']
token_endpoint = config['token_endpoint']
jwks_uri = config['jwks_uri']

# 4. Validate
assert config['issuer'] == issuer_url
assert 'code' in config['response_types_supported']

# 5. Client is configured - ready to use
print(f"Client configured for {issuer_url}")
print(f"Authorization endpoint: {authorization_endpoint}")
```

### Scenario 2: Checking PKCE Support

**Situation:** Client wants to determine if it should use PKCE.

**Implementation:**

```python
config = fetch_discovery(issuer_url)

# Check PKCE support
methods = config.get('code_challenge_methods_supported', [])

if 'S256' in methods:
    print("PKCE is supported with S256 method")
    use_pkce = True
    pkce_method = 'S256'
elif 'plain' in methods:
    print("PKCE is supported with plain method (not recommended)")
    use_pkce = True
    pkce_method = 'plain'
else:
    print("PKCE not advertised in discovery")
    # OAuth 2.1 requires PKCE, so use it anyway
    use_pkce = True
    pkce_method = 'S256'
```

### Scenario 3: Determining Available Scopes

**Situation:** Client wants to know which scopes it can request.

**Implementation:**

```python
config = fetch_discovery(issuer_url)

# Get supported scopes
supported_scopes = config.get('scopes_supported', [])

print(f"Supported scopes: {supported_scopes}")

# Client decides which scopes to request
desired_scopes = ['openid', 'profile', 'email', 'custom_api']

# Filter to only supported scopes
valid_scopes = [s for s in desired_scopes if s in supported_scopes]

print(f"Requesting scopes: {' '.join(valid_scopes)}")
```

### Scenario 4: Multi-Tenant with Path-Based Issuers

**Situation:** Authorization server supports multiple tenants with path-based issuers.

**Configuration:**

```python
class TenantAwareClient:
    def __init__(self, base_url, tenant_id):
        """Initialize for specific tenant"""
        # Construct tenant-specific issuer
        self.issuer = f"{base_url}/{tenant_id}"
        
        # Fetch tenant-specific discovery
        self.config = self.fetch_discovery(self.issuer)
        
        # Validate issuer matches
        if self.config['issuer'] != self.issuer:
            raise ValueError("Issuer mismatch")
    
    def fetch_discovery(self, issuer):
        """Fetch discovery for tenant"""
        discovery_url = issuer + '/.well-known/openid-configuration'
        return requests.get(discovery_url).json()

# Usage
tenant_a_client = TenantAwareClient(
    'https://auth.example.com',
    'tenant_a'
)

tenant_b_client = TenantAwareClient(
    'https://auth.example.com',
    'tenant_b'
)

# Each client has tenant-specific configuration
print(f"Tenant A issuer: {tenant_a_client.config['issuer']}")
print(f"Tenant B issuer: {tenant_b_client.config['issuer']}")
```

### Scenario 5: Discovery Failure with Cached Fallback

**Situation:** Discovery endpoint temporarily unavailable, client uses cached config.

**Implementation:**

```python
class ResilientClient:
    def __init__(self, issuer_url, cache_path='discovery_cache.json'):
        self.issuer_url = issuer_url
        self.cache_path = cache_path
        self.config = self._get_configuration()
    
    def _get_configuration(self):
        """Get configuration with fallback"""
        try:
            # Try discovery first
            config = self._fetch_discovery()
            
            # Cache successful fetch
            self._save_cache(config)
            
            return config
            
        except Exception as e:
            print(f"Discovery failed: {e}")
            
            # Try cache
            cached = self._load_cache()
            if cached:
                print("Using cached discovery configuration")
                return cached
            
            # No cache available
            raise ConfigurationError("Discovery failed and no cache available")
    
    def _fetch_discovery(self):
        """Fetch discovery"""
        url = self.issuer_url + '/.well-known/openid-configuration'
        response = requests.get(url, timeout=5)
        return response.json()
    
    def _save_cache(self, config):
        """Save configuration to cache"""
        cache_data = {
            'config': config,
            'cached_at': datetime.now().isoformat()
        }
        with open(self.cache_path, 'w') as f:
            json.dump(cache_data, f)
    
    def _load_cache(self):
        """Load configuration from cache"""
        try:
            with open(self.cache_path, 'r') as f:
                cache_data = json.load(f)
            
            # Check cache age
            cached_at = datetime.fromisoformat(cache_data['cached_at'])
            age = datetime.now() - cached_at
            
            if age.total_seconds() < 86400:  # 24 hours
                return cache_data['config']
            else:
                print("Cache too old")
                return None
                
        except (FileNotFoundError, json.JSONDecodeError, KeyError):
            return None
```

### Scenario 6: Authorization Server Adds New Endpoint

**Situation:** Authorization server adds token revocation endpoint.

**Before:**
```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "jwks_uri": "https://auth.example.com/.well-known/jwks.json"
}
```

**After:**
```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "jwks_uri": "https://auth.example.com/.well-known/jwks.json",
  "revocation_endpoint": "https://auth.example.com/revoke"
}
```

**Client Behavior:**

```python
# Client checks if revocation is supported
config = fetch_discovery(issuer_url)

if 'revocation_endpoint' in config:
    print("Token revocation is supported")
    revocation_endpoint = config['revocation_endpoint']
    # Client can now revoke tokens
else:
    print("Token revocation not supported")
    # Client handles gracefully
```

**Result:** Client automatically discovers new feature without code changes.

---

## Conclusion

OIDC Discovery and the `.well-known/openid-configuration` endpoint provide a standardized mechanism for dynamic authorization server configuration. By implementing discovery, both authorization servers and clients benefit from reduced configuration errors, automatic feature detection, and improved interoperability.

**Key Takeaways:**

1. **Always Use Discovery:** Eliminates hardcoded configuration
2. **Validate Thoroughly:** Ensure issuer matches and required fields present
3. **Cache Sensibly:** Balance freshness and performance (e.g., 1 hour TTL)
4. **Handle Failures:** Graceful fallback strategies
5. **Follow Standards:** OIDC Discovery 1.0 and RFC 8414 compliance

**Remember:** Discovery is not optional anymore—it's a best practice that significantly improves OAuth2/OIDC implementation quality and maintainability.

For questions or issues, refer to the primary specifications or consult with your authorization server documentation.

---

**Document Version:** 1.0
**Last Updated:** 2024
**Specification References:**
- OpenID Connect Discovery 1.0
- RFC 8414 (OAuth 2.0 Authorization Server Metadata)
- RFC 7517 (JSON Web Key - JWK)
- OAuth 2.1 (draft)
