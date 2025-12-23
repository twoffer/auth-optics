# OAuth 2.0 Authorization Server Metadata

> "The story so far: In the beginning, OAuth 2.0 was created. This has made a lot of people very angry and been widely regarded as a bad move. Then RFC 8414 was created to help people actually figure out where all the OAuth endpoints were, which made slightly fewer people angry."
> 
> OAuth 2.0 Authorization Server Metadata (RFC 8414) provides dynamic discovery for pure OAuth2 systems. It's like OIDC Discovery's minimalist cousin who moved to the countryside, eschewed identity tokens, and focused solely on the essential business of access control. Same family, different life choices.

## Document Purpose

This document provides authoritative reference for OAuth 2.0 Authorization Server Metadata (RFC 8414), the OAuth2 equivalent of OIDC Discovery, targeting security professionals implementing OAuth2-only systems, understanding metadata advertisement, or debugging discovery in mixed OAuth2/OIDC environments.

**Primary Use Cases:**
- Implementing OAuth2 metadata endpoints in authorization servers
- Understanding differences between OAuth2 Metadata and OIDC Discovery
- Implementing pure OAuth2 systems (without OpenID Connect)
- Configuring clients for OAuth2-only authorization servers
- Supporting multi-tenant OAuth2 deployments
- Migrating between OAuth2 and OIDC

**Target Audience:** Security professionals, OAuth2 implementers, system architects, and developers working with OAuth2-only (non-OIDC) authorization servers.

## Table of Contents

1. [Overview](#overview)
2. [OAuth2 Metadata vs OIDC Discovery](#oauth2-metadata-vs-oidc-discovery)
3. [Metadata Endpoint Specification](#metadata-endpoint-specification)
4. [Path-Specific Issuer Identifiers](#path-specific-issuer-identifiers)
5. [Required Metadata Fields](#required-metadata-fields)
6. [Comprehensive Metadata Example](#comprehensive-metadata-example)
7. [Core Metadata Fields Detailed](#core-metadata-fields-detailed)
8. [Grant Types and Response Types](#grant-types-and-response-types)
9. [Client Authentication Methods](#client-authentication-methods)
10. [Introspection and Revocation](#introspection-and-revocation)
11. [Extension Endpoints](#extension-endpoints)
12. [Scope and Claims](#scope-and-claims)
13. [Client Discovery Process](#client-discovery-process)
14. [Metadata Validation](#metadata-validation)
15. [OAuth2-Only vs OAuth2+OIDC Authorization Servers](#oauth2-only-vs-oauth2oidc-authorization-servers)
16. [Security Considerations](#security-considerations)
17. [Multi-Tenant Metadata](#multi-tenant-metadata)
18. [Metadata Update and Versioning](#metadata-update-and-versioning)
19. [Implementation Checklist](#implementation-checklist)
20. [OAuth2 Metadata in Different Environments](#oauth2-metadata-in-different-environments)
21. [Testing and Troubleshooting](#testing-and-troubleshooting)
22. [Relationship to Other Specifications](#relationship-to-other-specifications)
23. [Migration Between OAuth2 and OIDC](#migration-between-oauth2-and-oidc)
24. [Example Scenarios](#example-scenarios)
25. [Comparison: Metadata vs Manual Configuration](#comparison-metadata-vs-manual-configuration)

---

## Overview

**Purpose:** OAuth 2.0 Authorization Server Metadata (RFC 8414) provides a standardized mechanism for authorization servers to advertise their capabilities, endpoints, and supported features.

**Primary Specification:** RFC 8414 - OAuth 2.0 Authorization Server Metadata

**Relationship to OIDC Discovery:**
- OAuth2 Metadata is the foundation
- OIDC Discovery extends OAuth2 Metadata with identity-specific fields
- OIDC Discovery is a superset of OAuth2 Metadata

**Use Case:** Pure OAuth2 implementations that provide API authorization without identity functionality (no ID tokens, no UserInfo endpoint).

### Why OAuth2 Metadata Exists

**The Problem Before RFC 8414:**

```python
# Client needs manual configuration for each authorization server
oauth_config = {
    'issuer': 'https://auth.example.com',
    'authorization_endpoint': 'https://auth.example.com/authorize',
    'token_endpoint': 'https://auth.example.com/token',
    'revocation_endpoint': 'https://auth.example.com/revoke',
    # ... hardcoded everywhere
}
```

**With RFC 8414:**

```python
# Client discovers configuration automatically
metadata = fetch_metadata('https://auth.example.com')
authorization_endpoint = metadata['authorization_endpoint']
token_endpoint = metadata['token_endpoint']
# ... all endpoints discovered dynamically
```

### Key Benefits

1. **Dynamic Configuration:** Clients discover endpoints automatically
2. **Feature Advertisement:** Authorization servers advertise supported capabilities
3. **Reduced Configuration Errors:** No hardcoded endpoint URLs
4. **Multi-Environment Support:** Same client code works across dev/staging/prod
5. **Future-Proof:** New endpoints added without client updates

### OAuth2 Metadata Flow

```
┌──────────┐                                    ┌─────────────────────┐
│  Client  │                                    │ Authorization Server│
└─────┬────┘                                    └──────────┬──────────┘
      │                                                    │
      │ 1. GET /.well-known/oauth-authorization-server    │
      │───────────────────────────────────────────────────>│
      │                                                    │
      │ 2. OAuth2 Metadata Response                       │
      │ {                                                  │
      │   "issuer": "https://auth.example.com",           │
      │   "authorization_endpoint": "...",                 │
      │   "token_endpoint": "...",                         │
      │   "response_types_supported": ["code"],            │
      │   "grant_types_supported": [...]                   │
      │ }                                                  │
      │<───────────────────────────────────────────────────│
      │                                                    │
      │ 3. Cache metadata                                  │
      │                                                    │
      │ 4. Use endpoints for OAuth2 flows                  │
      │                                                    │
```

---

## OAuth2 Metadata vs OIDC Discovery

**Specification:** RFC 8414 (OAuth2 Metadata), OpenID Connect Discovery 1.0 (OIDC Discovery)

Understanding the relationship between these two specifications is critical for implementation decisions.

### Core Differences

| Aspect | OAuth2 Metadata (RFC 8414) | OIDC Discovery |
|--------|----------------------------|----------------|
| **Specification** | RFC 8414 | OpenID Connect Discovery 1.0 |
| **Discovery Path** | `/.well-known/oauth-authorization-server` | `/.well-known/openid-configuration` |
| **Focus** | API authorization (access tokens) | Authentication + Authorization |
| **ID Tokens** | Not supported | Supported (core feature) |
| **UserInfo Endpoint** | Not included | Included |
| **Subject Types** | Not specified | Required (public/pairwise) |
| **ID Token Algorithms** | Not applicable | Required fields |
| **Minimum Required Fields** | 5 fields | 7 fields |
| **Use Case** | Pure OAuth2 API access | Authentication + API access |

### Detailed Field Comparison

#### Fields Present in Both

**Common Core Fields:**
- `issuer`: Authorization server identifier
- `authorization_endpoint`: Authorization endpoint URL
- `token_endpoint`: Token endpoint URL
- `jwks_uri`: JSON Web Key Set endpoint
- `response_types_supported`: Supported response types
- `grant_types_supported`: Supported grant types
- `token_endpoint_auth_methods_supported`: Client authentication methods

#### OAuth2-Specific Fields

**OAuth2 Metadata Only:**
- Generally uses same fields as OIDC Discovery
- But does NOT include OIDC-specific fields (see below)

#### OIDC-Specific Fields (Not in OAuth2 Metadata)

**OIDC Discovery Adds:**
- `userinfo_endpoint`: UserInfo endpoint URL
- `subject_types_supported`: Subject identifier types (public, pairwise)
- `id_token_signing_alg_values_supported`: ID token signing algorithms
- `id_token_encryption_alg_values_supported`: ID token encryption algorithms
- `id_token_encryption_enc_values_supported`: ID token encryption encodings
- `userinfo_signing_alg_values_supported`: UserInfo response signing
- `claims_supported`: Supported user claims
- `claims_parameter_supported`: Claims parameter support
- `request_parameter_supported`: Request parameter (JWT) support
- `request_uri_parameter_supported`: Request URI parameter support

### Discovery Path Differences

#### OAuth2 Metadata Discovery Path

**Specification:** RFC 8414 §3

**Standard Path (No Issuer Path Component):**
```
Issuer: https://auth.example.com
Metadata: https://auth.example.com/.well-known/oauth-authorization-server
```

**Path-Based Issuer (With Path Component):**
```
Issuer: https://example.com/oauth2
Metadata: https://example.com/.well-known/oauth-authorization-server/oauth2
```

**Note:** Path component appears AFTER `/.well-known/oauth-authorization-server`

#### OIDC Discovery Path

**Standard Path:**
```
Issuer: https://auth.example.com
Discovery: https://auth.example.com/.well-known/openid-configuration
```

**Path-Based Issuer:**
```
Issuer: https://example.com/oauth2
Discovery: https://example.com/.well-known/openid-configuration
```

**Note:** OIDC Discovery path construction is simpler (no path component movement)

### Compatibility and Superset Relationship

**OIDC Discovery is a Superset:**

```json
// OAuth2 Metadata (subset)
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "jwks_uri": "https://auth.example.com/.well-known/jwks.json",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code"]
}

// OIDC Discovery (superset - includes all above PLUS)
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "jwks_uri": "https://auth.example.com/.well-known/jwks.json",
  "response_types_supported": ["code", "id_token", "code id_token"],
  "grant_types_supported": ["authorization_code"],
  
  // OIDC-specific additions
  "userinfo_endpoint": "https://auth.example.com/userinfo",
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"],
  "claims_supported": ["sub", "name", "email"]
}
```

**Implication:** Authorization servers supporting OIDC typically only need to implement OIDC Discovery endpoint. Pure OAuth2 servers implement OAuth2 Metadata endpoint.

### When to Use Which

#### Use OAuth2 Metadata When:

1. **Pure API Authorization:**
   - No user authentication required
   - Only access tokens needed
   - Machine-to-machine communication
   - Example: Service accounts, API keys, backend services

2. **No Identity Requirements:**
   - Don't need user profile information
   - Don't need ID tokens
   - Focus solely on authorization

3. **Simplicity:**
   - Want minimal OAuth2 implementation
   - Don't need OIDC complexity

**Example Use Case:**
```
Scenario: IoT devices accessing cloud API
- Devices authenticate with client credentials
- Receive access tokens
- Call protected APIs
- No user identity involved
→ Pure OAuth2, use OAuth2 Metadata
```

#### Use OIDC Discovery When:

1. **User Authentication Required:**
   - Need to identify users
   - Need user profile information
   - Web/mobile application login

2. **ID Tokens Needed:**
   - Want claims about user authentication
   - Need standardized identity token
   - SSO implementation

3. **OpenID Connect Features:**
   - UserInfo endpoint
   - Standard claims (email, profile, etc.)
   - Subject types (pairwise subjects)

**Example Use Case:**
```
Scenario: Web application user login
- Users sign in with username/password or social login
- Application receives ID token + access token
- Application uses UserInfo endpoint for profile
- User identity central to application
→ OIDC, use OIDC Discovery
```

### Client Discovery Strategy

**Recommended Approach for Clients:**

```python
def discover_authorization_server(issuer_url):
    """
    Attempt discovery in order of specificity
    
    Strategy:
    1. Try OIDC Discovery first (more specific)
    2. Fall back to OAuth2 Metadata (more general)
    3. Fail if neither works
    """
    
    # Try OIDC Discovery (superset)
    oidc_url = issuer_url + "/.well-known/openid-configuration"
    try:
        response = http_get(oidc_url)
        if response.status_code == 200:
            metadata = response.json()
            return metadata, "oidc"
    except Exception as e:
        logger.debug(f"OIDC Discovery failed: {e}")
    
    # Fall back to OAuth2 Metadata
    oauth2_url = construct_oauth2_metadata_url(issuer_url)
    try:
        response = http_get(oauth2_url)
        if response.status_code == 200:
            metadata = response.json()
            return metadata, "oauth2"
    except Exception as e:
        logger.debug(f"OAuth2 Metadata failed: {e}")
    
    raise DiscoveryError("Neither OIDC Discovery nor OAuth2 Metadata available")
```

**Why Try OIDC First?**
- OIDC Discovery is superset of OAuth2 Metadata
- Most modern authorization servers support OIDC
- If OIDC works, you get more information
- If OIDC fails, fall back to OAuth2

### Both Endpoints Supported

**Scenario:** Authorization server supports both OAuth2 and OIDC.

**Implementation Strategy:**

```python
class DualModeAuthorizationServer:
    """Authorization server supporting both OAuth2 and OIDC"""
    
    def get_oauth2_metadata(self):
        """OAuth2 Metadata endpoint"""
        metadata = {
            'issuer': self.issuer,
            'authorization_endpoint': self.auth_endpoint,
            'token_endpoint': self.token_endpoint,
            'jwks_uri': self.jwks_uri,
            'response_types_supported': ['code', 'token'],
            'grant_types_supported': ['authorization_code', 'client_credentials']
        }
        return metadata
    
    def get_oidc_metadata(self):
        """OIDC Discovery endpoint (superset)"""
        # Start with OAuth2 metadata
        metadata = self.get_oauth2_metadata()
        
        # Add OIDC-specific fields
        metadata.update({
            'userinfo_endpoint': self.userinfo_endpoint,
            'subject_types_supported': ['public'],
            'id_token_signing_alg_values_supported': ['RS256'],
            'claims_supported': ['sub', 'name', 'email']
        })
        
        return metadata
```

**Endpoints:**
```
OAuth2 Metadata:
GET /.well-known/oauth-authorization-server
→ Returns OAuth2 metadata (no OIDC fields)

OIDC Discovery:
GET /.well-known/openid-configuration
→ Returns OIDC metadata (includes all OAuth2 fields + OIDC fields)
```

**Client Behavior:**
- Clients supporting OIDC: Use OIDC Discovery endpoint
- Clients only supporting OAuth2: Use OAuth2 Metadata endpoint
- Both work correctly, serving appropriate client needs

---

## Metadata Endpoint Specification

**Specification:** RFC 8414 §3 - Obtaining Authorization Server Metadata

### Discovery Endpoint URL

**Standard Format (No Path in Issuer):**

```
Pattern: {issuer}/.well-known/oauth-authorization-server
```

**Examples:**

| Issuer | Metadata URL |
|--------|--------------|
| `https://auth.example.com` | `https://auth.example.com/.well-known/oauth-authorization-server` |
| `https://oauth.example.com` | `https://oauth.example.com/.well-known/oauth-authorization-server` |
| `https://example.com:8443` | `https://example.com:8443/.well-known/oauth-authorization-server` |

**Construction Algorithm:**

```python
def construct_oauth2_metadata_url(issuer):
    """
    Construct OAuth2 metadata URL from issuer
    
    For issuers without path component
    """
    # Remove trailing slash if present
    issuer = issuer.rstrip('/')
    
    # Append metadata path
    metadata_url = issuer + "/.well-known/oauth-authorization-server"
    
    return metadata_url

# Examples
construct_oauth2_metadata_url("https://auth.example.com")
# → https://auth.example.com/.well-known/oauth-authorization-server
```

### HTTP Characteristics

**HTTP Method:** GET (RFC 2119: REQUIRED)

**Authentication:** None (public endpoint) (RFC 2119: MUST be publicly accessible)

**Request Headers:**
```http
GET /.well-known/oauth-authorization-server HTTP/1.1
Host: auth.example.com
Accept: application/json
```

**Response Format:** JSON with Content-Type `application/json`

**HTTP Status Codes:**

| Status | Meaning | Client Action |
|--------|---------|---------------|
| 200 OK | Success | Parse metadata |
| 404 Not Found | Metadata not supported | Try OIDC Discovery or manual config |
| 500 Internal Server Error | Server error | Retry with backoff |
| 503 Service Unavailable | Temporarily unavailable | Use cached metadata if available |

### Response Headers

**Recommended Headers:**

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=UTF-8
Cache-Control: max-age=3600, public
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD, OPTIONS
```

**Cache-Control:**
- `max-age=3600`: Cache for 1 hour
- Clients should respect cache headers
- Balance freshness vs performance

**CORS Headers:**
- `Access-Control-Allow-Origin: *` is safe (metadata is public)
- Allows browser-based clients to fetch metadata

### Complete Request/Response Example

**Request:**
```http
GET /.well-known/oauth-authorization-server HTTP/1.1
Host: auth.example.com
Accept: application/json
User-Agent: MyOAuth2Client/1.0
```

**Response:**
```http
HTTP/1.1 200 OK
Date: Mon, 15 Apr 2024 10:30:00 GMT
Content-Type: application/json; charset=UTF-8
Content-Length: 567
Cache-Control: max-age=3600, public
Access-Control-Allow-Origin: *

{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "jwks_uri": "https://auth.example.com/.well-known/jwks.json",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"]
}
```

---

## Path-Specific Issuer Identifiers

**Specification:** RFC 8414 §3.3 - Obtaining Authorization Server Metadata Using a Path-Specific Issuer Identifier

### The Problem

Authorization servers may be deployed at a sub-path rather than at the root of a domain:

```
❌ Simple case (no path):
Issuer: https://auth.example.com

✅ Complex case (with path):
Issuer: https://example.com/oauth2
Issuer: https://example.com/tenant/acme-corp
```

**Challenge:** How to construct metadata URL when issuer has a path component?

### Solution: Path-Specific Discovery

**RFC 8414 §3.3 specifies a special construction rule for path-based issuers:**

**Pattern:**
```
{scheme}://{host}/.well-known/oauth-authorization-server{path}
```

The path from the issuer is appended AFTER `/.well-known/oauth-authorization-server`

### Construction Algorithm

**Algorithm:**

```python
def construct_oauth2_metadata_url_with_path(issuer):
    """
    Construct OAuth2 metadata URL with path-specific handling
    
    RFC 8414 §3.3: Path component appended after /.well-known/...
    """
    from urllib.parse import urlparse
    
    # Parse issuer URL
    parsed = urlparse(issuer)
    
    # Extract components
    scheme = parsed.scheme
    host = parsed.netloc
    path = parsed.path.rstrip('/')
    
    if path:
        # Path-specific issuer
        # Pattern: scheme://host/.well-known/oauth-authorization-server/path
        metadata_url = f"{scheme}://{host}/.well-known/oauth-authorization-server{path}"
    else:
        # Standard issuer (no path)
        metadata_url = f"{scheme}://{host}/.well-known/oauth-authorization-server"
    
    return metadata_url

# Examples
construct_oauth2_metadata_url_with_path("https://auth.example.com")
# → https://auth.example.com/.well-known/oauth-authorization-server

construct_oauth2_metadata_url_with_path("https://example.com/oauth2")
# → https://example.com/.well-known/oauth-authorization-server/oauth2

construct_oauth2_metadata_url_with_path("https://example.com/tenant/acme")
# → https://example.com/.well-known/oauth-authorization-server/tenant/acme
```

### Detailed Examples

#### Example 1: Simple Path

**Issuer:**
```
https://example.com/oauth2
```

**Metadata URL Construction:**
```
1. Extract scheme: https
2. Extract host: example.com
3. Extract path: /oauth2
4. Construct: https://example.com/.well-known/oauth-authorization-server/oauth2
```

**Metadata URL:**
```
https://example.com/.well-known/oauth-authorization-server/oauth2
```

#### Example 2: Multi-Level Path (Tenant)

**Issuer:**
```
https://example.com/tenant/acme-corp
```

**Metadata URL:**
```
https://example.com/.well-known/oauth-authorization-server/tenant/acme-corp
```

#### Example 3: No Path

**Issuer:**
```
https://auth.example.com
```

**Metadata URL:**
```
https://auth.example.com/.well-known/oauth-authorization-server
```

### Comparison: OAuth2 Metadata vs OIDC Discovery Path Handling

**Important Difference:**

| Issuer | OAuth2 Metadata | OIDC Discovery |
|--------|----------------|----------------|
| `https://example.com` | `https://example.com/.well-known/oauth-authorization-server` | `https://example.com/.well-known/openid-configuration` |
| `https://example.com/oauth2` | `https://example.com/.well-known/oauth-authorization-server/oauth2` | `https://example.com/.well-known/openid-configuration` |

**Key Insight:**
- **OAuth2 Metadata:** Path moves to AFTER `/.well-known/oauth-authorization-server`
- **OIDC Discovery:** Path stays in original position, simply append `/.well-known/openid-configuration`

**Example:**
```
Issuer: https://example.com/oauth2

OAuth2 Metadata:
https://example.com/.well-known/oauth-authorization-server/oauth2
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                   Path moved after well-known component

OIDC Discovery:
https://example.com/oauth2/.well-known/openid-configuration
                   ^^^^^^
                   Path stays in place
```

### Multi-Tenant Scenario

**Use Case:** Multiple tenants on same authorization server.

**Configuration:**

```
Tenant 1:
  Issuer: https://example.com/tenant/acme
  Metadata: https://example.com/.well-known/oauth-authorization-server/tenant/acme

Tenant 2:
  Issuer: https://example.com/tenant/globex
  Metadata: https://example.com/.well-known/oauth-authorization-server/tenant/globex

Tenant 3:
  Issuer: https://example.com/tenant/initech
  Metadata: https://example.com/.well-known/oauth-authorization-server/tenant/initech
```

**Authorization Server Implementation:**

```python
class MultiTenantMetadataHandler:
    """Handle metadata for multiple tenants"""
    
    def get_metadata(self, request_path):
        """
        Extract tenant from path and return tenant-specific metadata
        
        Path format: /.well-known/oauth-authorization-server/tenant/{tenant_id}
        """
        # Extract tenant from path
        # Path: /.well-known/oauth-authorization-server/tenant/acme
        path_parts = request_path.split('/')
        
        if len(path_parts) >= 4 and path_parts[3] == 'tenant':
            tenant_id = path_parts[4]
        else:
            raise NotFoundError("Invalid tenant path")
        
        # Get tenant configuration
        tenant_config = get_tenant_config(tenant_id)
        
        # Build tenant-specific metadata
        metadata = {
            'issuer': f'https://example.com/tenant/{tenant_id}',
            'authorization_endpoint': f'https://example.com/tenant/{tenant_id}/authorize',
            'token_endpoint': f'https://example.com/tenant/{tenant_id}/token',
            'jwks_uri': f'https://example.com/tenant/{tenant_id}/.well-known/jwks.json',
            'response_types_supported': tenant_config.response_types,
            'grant_types_supported': tenant_config.grant_types
        }
        
        return metadata
```

### Testing Path-Based Discovery

**Manual Testing:**

```bash
# Test path-based issuer
curl https://example.com/.well-known/oauth-authorization-server/oauth2

# Should return metadata with issuer: https://example.com/oauth2
```

**Validation:**

```python
def validate_path_based_metadata(issuer, metadata):
    """Validate metadata for path-based issuer"""
    # Extract path from issuer
    path = urlparse(issuer).path
    
    # Metadata issuer must exactly match
    if metadata['issuer'] != issuer:
        raise ValidationError(f"Issuer mismatch: {metadata['issuer']} != {issuer}")
    
    # All endpoint URLs should include path
    for endpoint_key in ['authorization_endpoint', 'token_endpoint']:
        endpoint_url = metadata.get(endpoint_key)
        if endpoint_url:
            endpoint_path = urlparse(endpoint_url).path
            if not endpoint_path.startswith(path):
                logger.warning(f"{endpoint_key} path doesn't start with issuer path")
```

---

## Required Metadata Fields

**Specification:** RFC 8414 §2 - Authorization Server Metadata

### Required Fields (RFC 2119: REQUIRED)

| Field | Type | Description | RFC Reference |
|-------|------|-------------|---------------|
| `issuer` | String | Authorization server identifier (HTTPS URL) | RFC 8414 §2 |
| `authorization_endpoint` | String | Authorization endpoint URL | RFC 8414 §2* |
| `token_endpoint` | String | Token endpoint URL | RFC 8414 §2 |
| `response_types_supported` | Array[String] | Supported response types | RFC 8414 §2 |

**Note:** `authorization_endpoint` is REQUIRED unless the authorization server only supports grant types that don't use the authorization endpoint (e.g., client credentials flow only).

### Recommended Fields (RFC 2119: RECOMMENDED)

| Field | Type | Description |
|-------|------|-------------|
| `grant_types_supported` | Array[String] | Supported grant types |
| `jwks_uri` | String | JSON Web Key Set endpoint |
| `scopes_supported` | Array[String] | Supported OAuth 2.0 scopes |
| `token_endpoint_auth_methods_supported` | Array[String] | Client authentication methods |

**Note:** While technically RECOMMENDED, `grant_types_supported` is effectively required in practice for clients to understand which flows are available.

### Minimal Valid Metadata

**Absolute Minimum (RFC compliant):**

```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "response_types_supported": ["code"]
}
```

**Practical Minimum (includes recommended fields):**

```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "jwks_uri": "https://auth.example.com/.well-known/jwks.json",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "token_endpoint_auth_methods_supported": [
    "client_secret_basic",
    "client_secret_post"
  ]
}
```

### Field Validation

**Client-Side Validation:**

```python
def validate_oauth2_metadata(metadata):
    """
    Validate OAuth2 metadata has required fields
    
    RFC 8414 §2: Required fields
    """
    required_fields = [
        'issuer',
        'token_endpoint',
        'response_types_supported'
    ]
    
    # Check required fields
    for field in required_fields:
        if field not in metadata:
            raise ValidationError(f"Missing required field: {field}")
    
    # authorization_endpoint required if not client-credentials-only
    grant_types = metadata.get('grant_types_supported', [])
    if grant_types != ['client_credentials']:
        if 'authorization_endpoint' not in metadata:
            raise ValidationError(
                "authorization_endpoint required for non-client-credentials flows"
            )
    
    # Validate issuer format
    issuer = metadata['issuer']
    if not issuer.startswith('https://'):
        raise ValidationError("Issuer must use HTTPS")
    
    # Validate endpoint URLs
    for endpoint_key in ['authorization_endpoint', 'token_endpoint', 'jwks_uri']:
        url = metadata.get(endpoint_key)
        if url and not url.startswith('https://'):
            raise ValidationError(f"{endpoint_key} must use HTTPS")
    
    return True
```

---

## Comprehensive Metadata Example

**Real-World OAuth2 Metadata with Common Fields:**

```json
{
  "issuer": "https://auth.example.com",
  
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "jwks_uri": "https://auth.example.com/.well-known/jwks.json",
  "registration_endpoint": "https://auth.example.com/register",
  
  "scopes_supported": [
    "read",
    "write",
    "admin",
    "read:users",
    "write:users",
    "delete:users"
  ],
  
  "response_types_supported": [
    "code",
    "token"
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
    "urn:ietf:params:oauth:grant-type:device_code",
    "urn:ietf:params:oauth:grant-type:jwt-bearer"
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
    "RS384",
    "RS512",
    "ES256",
    "ES384",
    "ES512",
    "PS256",
    "PS384",
    "PS512"
  ],
  
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
  
  "device_authorization_endpoint": "https://auth.example.com/device",
  
  "code_challenge_methods_supported": [
    "plain",
    "S256"
  ],
  
  "service_documentation": "https://auth.example.com/docs",
  "ui_locales_supported": [
    "en-US",
    "es-ES",
    "fr-FR",
    "de-DE"
  ],
  "op_policy_uri": "https://auth.example.com/policy",
  "op_tos_uri": "https://auth.example.com/tos"
}
```

**Field Count:** ~25 fields in this comprehensive example.

**Note:** Real-world metadata varies significantly. Some authorization servers provide 10 fields, others 40+. Include only fields for features you actually support.

---

## Core Metadata Fields Detailed

### issuer (REQUIRED)

**Specification:** RFC 8414 §2

**Type:** String

**Description:** The authorization server's identifier, which is a URL that uses the "https" scheme.

**Requirements (RFC 8414 §2):**
- MUST use `https://` scheme
- MUST NOT contain query or fragment components
- Case-sensitive
- MUST match the `iss` claim in access tokens (if JWT)

**Examples:**
```json
"issuer": "https://auth.example.com"
"issuer": "https://example.com/oauth2"
"issuer": "https://oauth.provider.com:8443"
```

**Invalid Examples:**
```json
"issuer": "http://auth.example.com"              // ❌ Must be HTTPS
"issuer": "https://auth.example.com?tenant=1"    // ❌ No query
"issuer": "https://auth.example.com#section"     // ❌ No fragment
```

**Validation:**
```python
def validate_issuer(issuer):
    """Validate issuer per RFC 8414 §2"""
    from urllib.parse import urlparse
    
    parsed = urlparse(issuer)
    
    # Must be HTTPS
    if parsed.scheme != 'https':
        raise ValidationError("Issuer must use HTTPS scheme")
    
    # Must not have query
    if parsed.query:
        raise ValidationError("Issuer must not contain query component")
    
    # Must not have fragment
    if parsed.fragment:
        raise ValidationError("Issuer must not contain fragment")
    
    return True
```

### authorization_endpoint (CONDITIONALLY REQUIRED)

**Specification:** RFC 8414 §2

**Type:** String

**Description:** URL of the authorization server's authorization endpoint.

**Requirements:**
- REQUIRED unless only client credentials grant is supported
- MUST use HTTPS
- Complete URL (not relative)

**Example:**
```json
"authorization_endpoint": "https://auth.example.com/authorize"
```

**When Not Required:**
- Authorization server only supports client credentials flow
- No user authorization needed

**Example (Client Credentials Only):**
```json
{
  "issuer": "https://auth.example.com",
  "token_endpoint": "https://auth.example.com/token",
  "response_types_supported": [],  // Empty - no authorization flow
  "grant_types_supported": ["client_credentials"]
  // authorization_endpoint omitted
}
```

### token_endpoint (REQUIRED)

**Specification:** RFC 8414 §2

**Type:** String

**Description:** URL of the authorization server's token endpoint.

**Requirements:**
- REQUIRED in all cases (RFC 2119: REQUIRED)
- MUST use HTTPS
- Complete URL

**Example:**
```json
"token_endpoint": "https://auth.example.com/token"
```

**Usage:** All grant types use the token endpoint to obtain tokens.

### jwks_uri (RECOMMENDED)

**Specification:** RFC 8414 §2

**Type:** String

**Description:** URL of the authorization server's JWK Set document.

**Requirements:**
- RECOMMENDED for JWT access tokens
- MUST use HTTPS
- Returns JWK Set per RFC 7517

**Example:**
```json
"jwks_uri": "https://auth.example.com/.well-known/jwks.json"
```

**Use Case:**
- Clients fetch public keys for JWT access token verification
- See: `jwks-and-key-rotation.md` for complete JWKS specification

**When Not Needed:**
- Opaque (non-JWT) access tokens
- Tokens verified via introspection endpoint only

### response_types_supported (REQUIRED)

**Specification:** RFC 8414 §2

**Type:** Array of strings

**Description:** JSON array containing a list of the OAuth 2.0 `response_type` values that this authorization server supports.

**Common Values:**
- `code`: Authorization code flow
- `token`: Implicit flow (deprecated in OAuth 2.1)

**Example:**
```json
"response_types_supported": ["code", "token"]
```

**OAuth 2.1 Recommendation:**
```json
"response_types_supported": ["code"]
```

**Interpretation:**
- `["code"]`: Supports authorization code flow only
- `["token"]`: Supports implicit flow only (unusual)
- `["code", "token"]`: Supports both flows

### grant_types_supported (RECOMMENDED)

**Specification:** RFC 8414 §2

**Type:** Array of strings

**Description:** JSON array containing a list of the OAuth 2.0 grant type values that this authorization server supports.

**Standard Grant Types:**
- `authorization_code`: Authorization code flow (RFC 6749 §4.1)
- `implicit`: Implicit flow (RFC 6749 §4.2) - Deprecated
- `password`: Resource owner password credentials (RFC 6749 §4.3) - Deprecated
- `client_credentials`: Client credentials flow (RFC 6749 §4.4)
- `refresh_token`: Refresh token (RFC 6749 §6)

**Extension Grant Types:**
- `urn:ietf:params:oauth:grant-type:device_code`: Device flow (RFC 8628)
- `urn:ietf:params:oauth:grant-type:jwt-bearer`: JWT assertion (RFC 7523)
- `urn:ietf:params:oauth:grant-type:saml2-bearer`: SAML 2.0 assertion (RFC 7522)

**Example:**
```json
"grant_types_supported": [
  "authorization_code",
  "refresh_token",
  "client_credentials",
  "urn:ietf:params:oauth:grant-type:device_code"
]
```

**Modern Recommendation (OAuth 2.1):**
```json
"grant_types_supported": [
  "authorization_code",
  "refresh_token",
  "client_credentials"
]
```

---

## Grant Types and Response Types

### Understanding the Relationship

**Response Types:** Used at authorization endpoint
**Grant Types:** Used at token endpoint

```
Authorization Endpoint              Token Endpoint
response_type=code      →          grant_type=authorization_code
response_type=token     →          (no token endpoint call)
```

### Common Combinations

#### Authorization Code Flow

**Metadata:**
```json
{
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"]
}
```

**Flow:**
```
1. Authorization request: response_type=code
2. Authorization response: code=abc123
3. Token request: grant_type=authorization_code&code=abc123
4. Token response: access_token + refresh_token
```

#### Client Credentials Flow

**Metadata:**
```json
{
  "response_types_supported": [],  // No authorization endpoint
  "grant_types_supported": ["client_credentials"]
}
```

**Flow:**
```
1. Token request: grant_type=client_credentials
2. Token response: access_token
```

#### Implicit Flow (Deprecated)

**Metadata:**
```json
{
  "response_types_supported": ["token"],
  "grant_types_supported": ["implicit"]
}
```

**Flow:**
```
1. Authorization request: response_type=token
2. Authorization response: access_token (in fragment)
```

### PKCE Support Indication

**Field:** `code_challenge_methods_supported`

**Purpose:** Indicates PKCE support and which methods are available.

**Values:**
- `plain`: No transformation (not recommended for production)
- `S256`: SHA-256 hash (RECOMMENDED)

**Example:**
```json
"code_challenge_methods_supported": ["S256"]
```

**Client Behavior:**
```python
def should_use_pkce(metadata):
    """Determine if PKCE should be used"""
    methods = metadata.get('code_challenge_methods_supported', [])
    
    # PKCE supported if field present
    if methods:
        return True
    
    # OAuth 2.1 requires PKCE even if not advertised
    # Modern clients should always use PKCE
    return True

def select_pkce_method(metadata):
    """Select PKCE method"""
    methods = metadata.get('code_challenge_methods_supported', [])
    
    # Prefer S256
    if 'S256' in methods:
        return 'S256'
    
    # Fallback to plain (not recommended)
    if 'plain' in methods:
        return 'plain'
    
    # Default to S256 even if not advertised
    return 'S256'
```

**Related Documentation:** See `pkce-implementation.md` for complete PKCE specification.

### Response Modes

**Field:** `response_modes_supported`

**Purpose:** Indicates how authorization response parameters are returned.

**Values:**
- `query`: Parameters in query string (default for code flow)
- `fragment`: Parameters in URL fragment (default for implicit flow)
- `form_post`: Parameters via HTTP POST to redirect URI

**Example:**
```json
"response_modes_supported": ["query", "fragment", "form_post"]
```

**Usage:**

```http
# Query mode
GET /callback?code=abc123&state=xyz

# Fragment mode
GET /callback#access_token=abc123&token_type=Bearer

# Form post mode
POST /callback
Content-Type: application/x-www-form-urlencoded

code=abc123&state=xyz
```

---

## Client Authentication Methods

**Specification:** RFC 8414 §2, RFC 7591 §2

### token_endpoint_auth_methods_supported

**Type:** Array of strings

**Description:** JSON array containing a list of client authentication methods supported by the token endpoint.

**Standard Methods:**

| Method | Description | Use Case | Security Level |
|--------|-------------|----------|----------------|
| `client_secret_basic` | HTTP Basic Authentication | Confidential clients | Medium |
| `client_secret_post` | POST body parameters | Confidential clients | Medium |
| `client_secret_jwt` | JWT with symmetric key | High-security clients | High |
| `private_key_jwt` | JWT with asymmetric key | Highest-security clients | Highest |
| `none` | No authentication | Public clients | None |

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

### Method Details

#### client_secret_basic

**Mechanism:** HTTP Basic Authentication with client_id and client_secret

**Example:**
```http
POST /token HTTP/1.1
Host: auth.example.com
Authorization: Basic Y2xpZW50X2lkOmNsaWVudF9zZWNyZXQ=
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code=abc123
```

**Encoding:**
```python
import base64

credentials = f"{client_id}:{client_secret}"
encoded = base64.b64encode(credentials.encode()).decode()
auth_header = f"Basic {encoded}"
```

#### client_secret_post

**Mechanism:** Client credentials in POST body

**Example:**
```http
POST /token HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=abc123
&client_id=my_client_id
&client_secret=my_client_secret
```

#### private_key_jwt

**Mechanism:** Client creates signed JWT assertion

**Example:**
```http
POST /token HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=abc123
&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
&client_assertion=eyJhbGc...signature
```

**JWT Assertion Claims:**
```json
{
  "iss": "my_client_id",
  "sub": "my_client_id",
  "aud": "https://auth.example.com/token",
  "jti": "unique_id",
  "exp": 1638360000,
  "iat": 1638356400
}
```

#### none (Public Clients)

**Mechanism:** No client authentication

**Example:**
```http
POST /token HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=abc123
&client_id=my_public_client_id
&code_verifier=dBjftJeZ...
```

**Note:** PKCE provides security for public clients.

### token_endpoint_auth_signing_alg_values_supported

**Type:** Array of strings

**Description:** Algorithms supported for JWT-based client authentication.

**Example:**
```json
"token_endpoint_auth_signing_alg_values_supported": [
  "RS256",
  "RS384",
  "RS512",
  "ES256",
  "ES384",
  "ES512",
  "PS256",
  "PS384",
  "PS512"
]
```

**Applies to:**
- `client_secret_jwt` (symmetric algorithms like HS256)
- `private_key_jwt` (asymmetric algorithms like RS256, ES256)

### Similar Fields for Other Endpoints

**Revocation Endpoint:**
```json
"revocation_endpoint_auth_methods_supported": [
  "client_secret_basic",
  "client_secret_post",
  "private_key_jwt"
],
"revocation_endpoint_auth_signing_alg_values_supported": [
  "RS256",
  "ES256"
]
```

**Introspection Endpoint:**
```json
"introspection_endpoint_auth_methods_supported": [
  "client_secret_basic",
  "client_secret_post",
  "private_key_jwt"
],
"introspection_endpoint_auth_signing_alg_values_supported": [
  "RS256",
  "ES256"
]
```

---

## Introspection and Revocation

### Token Introspection (RFC 7662)

**Endpoint Field:** `introspection_endpoint`

**Purpose:** Allows resource servers to query the authorization server about the current state of an access token.

**Example:**
```json
"introspection_endpoint": "https://auth.example.com/introspect"
```

**Introspection Request:**
```http
POST /introspect HTTP/1.1
Host: auth.example.com
Authorization: Basic Y2xpZW50X2lkOmNsaWVudF9zZWNyZXQ=
Content-Type: application/x-www-form-urlencoded

token=2YotnFZFEjr1zCsicMWpAA
```

**Introspection Response:**
```json
{
  "active": true,
  "scope": "read write",
  "client_id": "my_client_id",
  "username": "user@example.com",
  "token_type": "Bearer",
  "exp": 1638360000,
  "iat": 1638356400,
  "sub": "user123"
}
```

**Related Documentation:** See `token-introspection-and-revocation.md` for complete specification.

### Token Revocation (RFC 7009)

**Endpoint Field:** `revocation_endpoint`

**Purpose:** Allows clients to revoke access tokens or refresh tokens.

**Example:**
```json
"revocation_endpoint": "https://auth.example.com/revoke"
```

**Revocation Request:**
```http
POST /revoke HTTP/1.1
Host: auth.example.com
Authorization: Basic Y2xpZW50X2lkOmNsaWVudF9zZWNyZXQ=
Content-Type: application/x-www-form-urlencoded

token=2YotnFZFEjr1zCsicMWpAA
&token_type_hint=access_token
```

**Revocation Response:**
```http
HTTP/1.1 200 OK
```

**Note:** Revocation endpoint returns 200 OK regardless of whether token was valid or already revoked.

**Related Documentation:** See `token-introspection-and-revocation.md` for complete specification.

### Authentication Methods

**Purpose:** Advertise which client authentication methods are supported for introspection and revocation endpoints.

**Example:**
```json
{
  "introspection_endpoint": "https://auth.example.com/introspect",
  "introspection_endpoint_auth_methods_supported": [
    "client_secret_basic",
    "client_secret_post",
    "private_key_jwt"
  ],
  
  "revocation_endpoint": "https://auth.example.com/revoke",
  "revocation_endpoint_auth_methods_supported": [
    "client_secret_basic",
    "client_secret_post",
    "private_key_jwt"
  ]
}
```

**Client Behavior:**
```python
def introspect_token(token, metadata):
    """Introspect token using advertised authentication method"""
    # Check which methods are supported
    methods = metadata.get('introspection_endpoint_auth_methods_supported', [])
    
    # Use preferred method
    if 'private_key_jwt' in methods:
        auth = create_jwt_assertion()
    elif 'client_secret_basic' in methods:
        auth = create_basic_auth()
    else:
        raise UnsupportedAuthMethodError()
    
    # Make introspection request
    response = requests.post(
        metadata['introspection_endpoint'],
        data={'token': token},
        auth=auth
    )
    
    return response.json()
```

---

## Extension Endpoints

OAuth 2.0 supports various extension specifications that add new endpoints. These extensions are advertised in metadata.

### Device Authorization (RFC 8628)

**Endpoint Field:** `device_authorization_endpoint`

**Purpose:** URL of the device authorization endpoint for the device flow.

**Example:**
```json
"device_authorization_endpoint": "https://auth.example.com/device"
```

**Use Case:** Input-constrained devices (smart TVs, IoT devices, CLI tools)

**Flow:**
```
1. Device requests device code: POST /device
2. Server returns device_code and user_code
3. User visits verification URI and enters user_code
4. Device polls token endpoint with device_code
5. Server returns access token when user authorizes
```

**Related Documentation:** See `device-authorization-flow.md` for complete specification.

### Pushed Authorization Requests (RFC 9126)

**Endpoint Field:** `pushed_authorization_request_endpoint`

**Purpose:** URL for pushed authorization requests (PAR).

**Example:**
```json
"pushed_authorization_request_endpoint": "https://auth.example.com/par"
```

**Use Case:** Security enhancement - push authorization parameters to server before redirecting user.

**Flow:**
```
1. Client pushes authorization parameters: POST /par
2. Server returns request_uri
3. Client redirects user with request_uri
4. Authorization proceeds normally
```

**Security Benefit:** Authorization parameters never appear in front channel (browser).

**Related Documentation:** See `pushed-authorization-requests.md` (if created).

### Dynamic Client Registration (RFC 7591)

**Endpoint Field:** `registration_endpoint`

**Purpose:** URL for dynamic client registration.

**Example:**
```json
"registration_endpoint": "https://auth.example.com/register"
```

**Use Case:** Clients can register themselves programmatically without manual registration.

**Registration Request:**
```http
POST /register HTTP/1.1
Host: auth.example.com
Content-Type: application/json

{
  "redirect_uris": ["https://client.example.com/callback"],
  "client_name": "My Application",
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "client_secret_basic"
}
```

**Registration Response:**
```json
{
  "client_id": "generated_client_id",
  "client_secret": "generated_client_secret",
  "client_id_issued_at": 1638356400,
  "client_secret_expires_at": 1669892400
}
```

### Custom Extensions

**Authorization servers may add custom extension endpoints:**

```json
{
  "issuer": "https://auth.example.com",
  
  // Standard endpoints
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  
  // Custom extension endpoints
  "custom_batch_token_endpoint": "https://auth.example.com/tokens/batch",
  "custom_webhook_registration": "https://auth.example.com/webhooks"
}
```

**Client Behavior:** Clients SHOULD ignore unknown fields they don't understand.

---

## Scope and Claims

### scopes_supported

**Type:** Array of strings

**Description:** JSON array containing a list of the OAuth 2.0 [RFC6749] scope values that this authorization server supports.

**Purpose:** Helps clients understand which permissions are available.

**Example:**
```json
"scopes_supported": [
  "read",
  "write",
  "admin",
  "read:users",
  "write:users",
  "delete:users",
  "read:posts",
  "write:posts"
]
```

### OAuth2 vs OIDC Scopes

**OAuth2 Scopes (Application-Specific):**
```json
"scopes_supported": [
  "read",
  "write",
  "admin",
  "api:full_access"
]
```

**OIDC Scopes (Standard + Application-Specific):**
```json
"scopes_supported": [
  "openid",      // OIDC required
  "profile",     // OIDC standard
  "email",       // OIDC standard
  "address",     // OIDC standard
  "phone",       // OIDC standard
  "offline_access",  // OIDC refresh token
  "read",        // Application-specific
  "write"        // Application-specific
]
```

**Key Difference:**
- **OAuth2:** All scopes are application-defined
- **OIDC:** Standard scopes (`openid`, `profile`, `email`) + application-defined

### Client Usage

```python
def request_authorization(metadata, desired_scopes):
    """Request authorization with supported scopes"""
    # Get supported scopes
    supported = set(metadata.get('scopes_supported', []))
    
    # Filter to only supported scopes
    valid_scopes = [s for s in desired_scopes if s in supported]
    
    if not valid_scopes:
        raise NoValidScopesError("No requested scopes are supported")
    
    # Build authorization URL
    params = {
        'response_type': 'code',
        'client_id': client_id,
        'scope': ' '.join(valid_scopes),
        'redirect_uri': redirect_uri
    }
    
    return build_authorization_url(
        metadata['authorization_endpoint'],
        params
    )
```

### Scope Documentation

**Best Practice:** Provide detailed scope documentation at `service_documentation` URL.

```json
{
  "scopes_supported": ["read", "write", "admin"],
  "service_documentation": "https://auth.example.com/docs"
}
```

**Scope Documentation Example:**
```markdown
# Supported Scopes

## read
- **Description:** Read-only access to resources
- **Permissions:** GET requests to API endpoints
- **Example:** GET /api/users

## write
- **Description:** Write access to resources
- **Permissions:** POST, PUT, PATCH requests
- **Example:** POST /api/users

## admin
- **Description:** Full administrative access
- **Permissions:** All operations including DELETE
- **Requires:** Admin role
- **Example:** DELETE /api/users/:id
```

---

## Client Discovery Process

**Specification:** RFC 8414 §3 - Obtaining Authorization Server Metadata

### Discovery Algorithm (OAuth2)

```
1. Client has issuer URL
   └── From configuration or service discovery

2. Construct metadata URL
   ├── If issuer has no path: issuer + "/.well-known/oauth-authorization-server"
   └── If issuer has path: See path-specific construction (§4)

3. GET metadata URL
   ├── HTTP GET request
   └── Accept: application/json

4. Receive HTTP 200 with JSON response
   └── Or handle error (404, 500, etc.)

5. Parse JSON response
   └── Handle parse errors

6. Validate metadata
   ├── Check required fields present
   ├── Validate issuer matches expected
   └── Validate endpoint URLs use HTTPS

7. Extract endpoints
   ├── authorization_endpoint
   ├── token_endpoint
   └── Other endpoints as needed

8. Cache metadata
   └── With reasonable TTL (e.g., 1 hour)

9. Use endpoints for OAuth2 flows
```

### Fallback Strategy (Mixed OAuth2/OIDC Environments)

**Problem:** Client doesn't know if authorization server supports OIDC or just OAuth2.

**Solution:** Try both discovery endpoints in order of specificity.

```python
def discover_authorization_server_with_fallback(issuer_url):
    """
    Discover authorization server supporting either OIDC or OAuth2
    
    Strategy:
    1. Try OIDC Discovery (more specific, superset)
    2. Fall back to OAuth2 Metadata (more general)
    3. Fail if neither works
    """
    
    # Step 1: Try OIDC Discovery
    oidc_url = issuer_url + "/.well-known/openid-configuration"
    
    try:
        response = requests.get(oidc_url, timeout=10)
        if response.status_code == 200:
            metadata = response.json()
            logger.info("Discovered using OIDC Discovery")
            return metadata, "oidc"
    except Exception as e:
        logger.debug(f"OIDC Discovery failed: {e}")
    
    # Step 2: Fall back to OAuth2 Metadata
    oauth2_url = construct_oauth2_metadata_url(issuer_url)
    
    try:
        response = requests.get(oauth2_url, timeout=10)
        if response.status_code == 200:
            metadata = response.json()
            logger.info("Discovered using OAuth2 Metadata")
            return metadata, "oauth2"
    except Exception as e:
        logger.debug(f"OAuth2 Metadata failed: {e}")
    
    # Step 3: Both failed
    raise DiscoveryError(
        f"Neither OIDC Discovery nor OAuth2 Metadata available for {issuer_url}"
    )

def construct_oauth2_metadata_url(issuer):
    """Construct OAuth2 metadata URL with path handling"""
    from urllib.parse import urlparse
    
    parsed = urlparse(issuer)
    path = parsed.path.rstrip('/')
    
    if path:
        # Path-specific: scheme://host/.well-known/oauth-authorization-server/path
        return f"{parsed.scheme}://{parsed.netloc}/.well-known/oauth-authorization-server{path}"
    else:
        # Standard: scheme://host/.well-known/oauth-authorization-server
        return f"{parsed.scheme}://{parsed.netloc}/.well-known/oauth-authorization-server"
```

### Complete Client Implementation

```python
import requests
import json
from datetime import datetime, timedelta
from urllib.parse import urlparse

class OAuth2MetadataClient:
    """OAuth2 metadata client with caching and fallback"""
    
    def __init__(self, issuer_url, cache_ttl=3600):
        self.issuer_url = issuer_url.rstrip('/')
        self.cache_ttl = cache_ttl
        self.metadata = None
        self.metadata_cached_at = None
        self.discovery_type = None  # 'oidc' or 'oauth2'
    
    def get_metadata(self, force_refresh=False):
        """
        Get metadata (cached or fresh)
        
        Args:
            force_refresh: Force fetch even if cached
        
        Returns:
            Metadata dict
        """
        # Check cache
        if not force_refresh and self._is_cache_valid():
            return self.metadata
        
        # Fetch fresh metadata
        self.metadata, self.discovery_type = self._fetch_metadata()
        self.metadata_cached_at = datetime.now()
        
        return self.metadata
    
    def _is_cache_valid(self):
        """Check if cached metadata is still valid"""
        if self.metadata is None or self.metadata_cached_at is None:
            return False
        
        age = datetime.now() - self.metadata_cached_at
        return age.total_seconds() < self.cache_ttl
    
    def _fetch_metadata(self):
        """Fetch metadata with OIDC/OAuth2 fallback"""
        # Try OIDC Discovery
        oidc_url = self.issuer_url + "/.well-known/openid-configuration"
        
        try:
            response = requests.get(oidc_url, timeout=10)
            if response.status_code == 200:
                metadata = response.json()
                self._validate_metadata(metadata)
                return metadata, "oidc"
        except Exception as e:
            logger.debug(f"OIDC Discovery failed: {e}")
        
        # Fall back to OAuth2 Metadata
        oauth2_url = self._construct_oauth2_url()
        
        try:
            response = requests.get(oauth2_url, timeout=10)
            if response.status_code == 200:
                metadata = response.json()
                self._validate_metadata(metadata)
                return metadata, "oauth2"
        except Exception as e:
            logger.debug(f"OAuth2 Metadata failed: {e}")
        
        raise DiscoveryError("Discovery failed")
    
    def _construct_oauth2_url(self):
        """Construct OAuth2 metadata URL"""
        parsed = urlparse(self.issuer_url)
        path = parsed.path.rstrip('/')
        
        if path:
            return f"{parsed.scheme}://{parsed.netloc}/.well-known/oauth-authorization-server{path}"
        else:
            return f"{parsed.scheme}://{parsed.netloc}/.well-known/oauth-authorization-server"
    
    def _validate_metadata(self, metadata):
        """Validate metadata"""
        # Check issuer matches
        if metadata.get('issuer') != self.issuer_url:
            raise ValidationError(
                f"Issuer mismatch: {metadata.get('issuer')} != {self.issuer_url}"
            )
        
        # Check required fields
        required = ['issuer', 'token_endpoint', 'response_types_supported']
        for field in required:
            if field not in metadata:
                raise ValidationError(f"Missing required field: {field}")
    
    def get_authorization_endpoint(self):
        """Get authorization endpoint"""
        metadata = self.get_metadata()
        return metadata.get('authorization_endpoint')
    
    def get_token_endpoint(self):
        """Get token endpoint"""
        metadata = self.get_metadata()
        return metadata['token_endpoint']
    
    def supports_pkce(self):
        """Check if PKCE is supported"""
        metadata = self.get_metadata()
        methods = metadata.get('code_challenge_methods_supported', [])
        return 'S256' in methods or 'plain' in methods
    
    def get_supported_scopes(self):
        """Get supported scopes"""
        metadata = self.get_metadata()
        return metadata.get('scopes_supported', [])

# Usage
client = OAuth2MetadataClient('https://auth.example.com')

# Get endpoints
authorization_endpoint = client.get_authorization_endpoint()
token_endpoint = client.get_token_endpoint()

# Check features
if client.supports_pkce():
    print("PKCE supported")

scopes = client.get_supported_scopes()
print(f"Supported scopes: {scopes}")
```

---

## Metadata Validation

**Specification:** RFC 8414 §3.2 - Authorization Server Metadata Validation

### Client MUST Validate (RFC 2119)

#### 1. Issuer Matches Expected

```python
def validate_issuer_match(metadata, expected_issuer):
    """Validate issuer field matches expected"""
    if metadata['issuer'] != expected_issuer:
        raise ValidationError(
            f"Issuer mismatch: metadata has '{metadata['issuer']}', "
            f"expected '{expected_issuer}'"
        )
```

**Security Importance:** Prevents issuer substitution attacks.

#### 2. Required Fields Present

```python
def validate_required_fields(metadata):
    """Validate all required fields present"""
    required = [
        'issuer',
        'token_endpoint',
        'response_types_supported'
    ]
    
    # authorization_endpoint required unless client_credentials only
    grant_types = metadata.get('grant_types_supported', [])
    if grant_types != ['client_credentials']:
        required.append('authorization_endpoint')
    
    missing = [f for f in required if f not in metadata]
    
    if missing:
        raise ValidationError(f"Missing required fields: {missing}")
```

#### 3. HTTPS Requirement

```python
def validate_https_endpoints(metadata):
    """Validate all endpoint URLs use HTTPS"""
    endpoints = [
        'issuer',
        'authorization_endpoint',
        'token_endpoint',
        'jwks_uri',
        'registration_endpoint',
        'introspection_endpoint',
        'revocation_endpoint'
    ]
    
    for endpoint_name in endpoints:
        url = metadata.get(endpoint_name)
        if url:
            if not url.startswith('https://'):
                # Allow localhost for development
                if not url.startswith('http://localhost'):
                    raise ValidationError(
                        f"{endpoint_name} must use HTTPS: {url}"
                    )
```

#### 4. JSON Well-Formed

```python
def parse_and_validate_json(response_text):
    """Parse and validate JSON"""
    try:
        metadata = json.loads(response_text)
        return metadata
    except json.JSONDecodeError as e:
        raise ValidationError(f"Invalid JSON: {e}")
```

### Client SHOULD Validate (RFC 2119)

#### 1. Supported Features Meet Requirements

```python
def validate_features(metadata, required_grant_types, required_scopes):
    """Validate authorization server supports required features"""
    # Check grant types
    supported_grants = set(metadata.get('grant_types_supported', []))
    required_grants = set(required_grant_types)
    
    if not required_grants.issubset(supported_grants):
        missing = required_grants - supported_grants
        raise ValidationError(
            f"Required grant types not supported: {missing}"
        )
    
    # Check scopes
    supported_scopes = set(metadata.get('scopes_supported', []))
    required_scope_set = set(required_scopes)
    
    if required_scopes and not required_scope_set.issubset(supported_scopes):
        missing = required_scope_set - supported_scopes
        # Warning, not error (AS may support but not advertise)
        logger.warning(f"Required scopes not advertised: {missing}")
```

#### 2. Response Types Include Needed Type

```python
def validate_response_type_support(metadata, needed_response_type):
    """Validate needed response type is supported"""
    supported = metadata.get('response_types_supported', [])
    
    if needed_response_type not in supported:
        raise ValidationError(
            f"Response type '{needed_response_type}' not supported. "
            f"Supported: {supported}"
        )
```

### Complete Validation Function

```python
def validate_oauth2_metadata(metadata, expected_issuer, requirements=None):
    """
    Comprehensive OAuth2 metadata validation
    
    Args:
        metadata: Metadata dict
        expected_issuer: Expected issuer URL
        requirements: Dict of client requirements
    
    Raises:
        ValidationError: If validation fails
    """
    requirements = requirements or {}
    
    # MUST validations
    
    # 1. Issuer match
    if metadata.get('issuer') != expected_issuer:
        raise ValidationError(
            f"Issuer mismatch: {metadata.get('issuer')} != {expected_issuer}"
        )
    
    # 2. Required fields
    required_fields = ['issuer', 'token_endpoint', 'response_types_supported']
    
    grant_types = metadata.get('grant_types_supported', [])
    if grant_types != ['client_credentials']:
        required_fields.append('authorization_endpoint')
    
    for field in required_fields:
        if field not in metadata:
            raise ValidationError(f"Missing required field: {field}")
    
    # 3. HTTPS endpoints
    for field in ['issuer', 'authorization_endpoint', 'token_endpoint', 'jwks_uri']:
        url = metadata.get(field)
        if url and not url.startswith('https://'):
            if not url.startswith('http://localhost'):
                raise ValidationError(f"{field} must use HTTPS")
    
    # SHOULD validations (if requirements specified)
    
    if requirements.get('grant_types'):
        supported = set(metadata.get('grant_types_supported', []))
        required = set(requirements['grant_types'])
        if not required.issubset(supported):
            missing = required - supported
            raise ValidationError(f"Required grant types not supported: {missing}")
    
    if requirements.get('response_types'):
        supported = set(metadata.get('response_types_supported', []))
        required = set(requirements['response_types'])
        if not required.issubset(supported):
            missing = required - supported
            raise ValidationError(f"Required response types not supported: {missing}")
    
    return True
```

---

## OAuth2-Only vs OAuth2+OIDC Authorization Servers

### OAuth2-Only Authorization Servers

**Characteristics:**
- Implements RFC 8414 metadata endpoint
- No ID tokens, no UserInfo endpoint
- Access tokens for API authorization only
- Simpler implementation

**Metadata Example:**
```json
{
  "issuer": "https://api.example.com",
  "authorization_endpoint": "https://api.example.com/authorize",
  "token_endpoint": "https://api.example.com/token",
  "jwks_uri": "https://api.example.com/.well-known/jwks.json",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "client_credentials"]
}
```

**Use Cases:**
- API-only authorization
- Machine-to-machine authentication
- Microservice authorization
- B2B integrations
- IoT device authentication

**Example Scenario:**
```
Company API Gateway:
- Services authenticate with client credentials
- Receive access tokens
- Call internal APIs
- No user identity needed
→ Pure OAuth2, no OIDC
```

### OAuth2+OIDC Authorization Servers

**Characteristics:**
- Implements OIDC Discovery (superset of OAuth2 Metadata)
- Supports ID tokens and UserInfo
- Both authentication and authorization
- More complex implementation

**Metadata Example:**
```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "userinfo_endpoint": "https://auth.example.com/userinfo",
  "jwks_uri": "https://auth.example.com/.well-known/jwks.json",
  
  "response_types_supported": ["code", "id_token"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"],
  
  "grant_types_supported": ["authorization_code", "client_credentials"],
  "claims_supported": ["sub", "name", "email"]
}
```

**Use Cases:**
- User login/authentication
- Single Sign-On (SSO)
- Social login integration
- User profile access
- Identity federation

### Deployment Recommendations

**If Your Authorization Server:**

| Scenario | Recommendation | Endpoint to Implement |
|----------|----------------|----------------------|
| Supports OIDC | Use OIDC Discovery | `/.well-known/openid-configuration` |
| Pure OAuth2 (no OIDC) | Use OAuth2 Metadata | `/.well-known/oauth-authorization-server` |
| Supports both | Implement both endpoints | Both (same content + OIDC additions) |
| Transitioning to OIDC | Implement both, migrate clients | Both during transition |

**Dual Implementation:**

```python
class DualModeAuthorizationServer:
    """Support both OAuth2 and OIDC discovery"""
    
    def oauth2_metadata(self):
        """OAuth2 Metadata endpoint"""
        return {
            'issuer': self.issuer,
            'authorization_endpoint': self.auth_endpoint,
            'token_endpoint': self.token_endpoint,
            'jwks_uri': self.jwks_uri,
            'response_types_supported': ['code'],
            'grant_types_supported': ['authorization_code', 'client_credentials']
        }
    
    def oidc_discovery(self):
        """OIDC Discovery endpoint (includes OAuth2 + OIDC fields)"""
        metadata = self.oauth2_metadata()  # Start with OAuth2
        
        # Add OIDC-specific fields
        metadata.update({
            'userinfo_endpoint': self.userinfo_endpoint,
            'subject_types_supported': ['public'],
            'id_token_signing_alg_values_supported': ['RS256'],
            'claims_supported': ['sub', 'name', 'email']
        })
        
        return metadata
```

---

## Security Considerations

**Specification:** RFC 8414 §5 - Security Considerations

### HTTPS Requirement

**CRITICAL:** Metadata endpoint MUST use HTTPS (RFC 2119: MUST).

**Rationale:**
- Protects metadata integrity during transit
- Prevents MITM modification of endpoint URLs
- Ensures clients receive authentic configuration

**Attack Scenario (Without HTTPS):**
```
1. Client requests: http://auth.example.com/.well-known/oauth-authorization-server
2. Attacker intercepts (MITM)
3. Attacker modifies metadata:
   {
     "token_endpoint": "https://evil.com/token"  // Attacker's endpoint!
   }
4. Client uses attacker's token endpoint
5. Attacker captures all tokens
```

**Defense:** HTTPS prevents modification. Client validates TLS certificate.

### Issuer Validation

**Requirement:** Client MUST validate issuer in metadata matches expected issuer.

**Implementation:**
```python
def validate_issuer_security(metadata, expected_issuer):
    """Validate issuer for security"""
    if metadata['issuer'] != expected_issuer:
        raise SecurityError(
            "Issuer mismatch - possible issuer substitution attack"
        )
```

**Attack Scenario:**
```
Expected: https://auth.example.com
Attacker returns: https://evil.com

If client doesn't validate:
- Client uses attacker's endpoints
- Attacker captures credentials
```

### Endpoint URL Validation

**Requirement:** Client MUST validate all endpoint URLs use HTTPS.

**Additional Validation:**

```python
def validate_endpoint_domain(endpoint_url, expected_domain):
    """Validate endpoint belongs to expected domain"""
    from urllib.parse import urlparse
    
    parsed = urlparse(endpoint_url)
    
    # Check HTTPS
    if parsed.scheme != 'https':
        raise SecurityError(f"Endpoint must use HTTPS: {endpoint_url}")
    
    # Check domain (optional but recommended)
    if not parsed.netloc.endswith(expected_domain):
        logger.warning(
            f"Endpoint domain {parsed.netloc} doesn't match "
            f"expected {expected_domain}"
        )
```

**Rationale:** Prevents redirection to attacker-controlled endpoints.

### Metadata Caching Security

**Secure Caching Requirements:**

1. **Cache with Reasonable TTL**
   ```python
   CACHE_TTL = 3600  # 1 hour
   ```

2. **Secure Cache Storage**
   ```python
   # Don't cache in world-readable location
   cache_file = "/var/cache/oauth2/metadata.json"  # ❌ Insecure
   
   # Use secure storage
   cache_in_memory_or_secure_db()  # ✅ Secure
   ```

3. **Validate on Retrieval**
   ```python
   def get_cached_metadata():
       """Get cached metadata with validation"""
       cached = cache.get('metadata')
       
       if cached:
           # Re-validate even though cached
           validate_oauth2_metadata(cached, expected_issuer)
       
       return cached
   ```

### Configuration Cache Poisoning

**Threat:** Attacker modifies cached metadata.

**Defenses:**

```python
import hmac
import hashlib

class SecureMetadataCache:
    """Metadata cache with integrity protection"""
    
    def __init__(self, secret_key):
        self.secret_key = secret_key
    
    def store(self, metadata):
        """Store metadata with HMAC"""
        metadata_json = json.dumps(metadata)
        
        # Compute HMAC
        mac = hmac.new(
            self.secret_key.encode(),
            metadata_json.encode(),
            hashlib.sha256
        ).hexdigest()
        
        # Store both
        cache.set('metadata', metadata_json)
        cache.set('metadata_mac', mac)
    
    def retrieve(self):
        """Retrieve and verify metadata"""
        metadata_json = cache.get('metadata')
        stored_mac = cache.get('metadata_mac')
        
        if not metadata_json or not stored_mac:
            return None
        
        # Verify HMAC
        computed_mac = hmac.new(
            self.secret_key.encode(),
            metadata_json.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(stored_mac, computed_mac):
            raise SecurityError("Metadata integrity check failed")
        
        return json.loads(metadata_json)
```

### Additional Security Measures

**1. Rate Limiting:**
```python
# Prevent metadata endpoint abuse
@rate_limit("100 per minute")
def metadata_endpoint():
    return get_metadata()
```

**2. Monitoring:**
```python
# Alert on unusual metadata access patterns
def monitor_metadata_access(request):
    if unusual_access_pattern(request):
        alert('unusual_metadata_access', request)
```

**3. Response Size Limits:**
```python
def validate_metadata_size(response):
    """Reject excessively large metadata"""
    if len(response.content) > 100000:  # 100KB
        raise SecurityError("Metadata response too large")
```

---

## Multi-Tenant Metadata

### Path-Based Tenants

**Pattern:** Each tenant has unique issuer with path component.

**Configuration:**
```
Tenant 1:
  Issuer: https://example.com/tenant/acme
  Metadata: https://example.com/.well-known/oauth-authorization-server/tenant/acme

Tenant 2:
  Issuer: https://example.com/tenant/globex
  Metadata: https://example.com/.well-known/oauth-authorization-server/tenant/globex
```

**Implementation:**

```python
class PathBasedTenantMetadata:
    """Handle path-based multi-tenant metadata"""
    
    def get_metadata(self, path):
        """
        Get tenant-specific metadata from path
        
        Path: /.well-known/oauth-authorization-server/tenant/{tenant_id}
        """
        # Extract tenant from path
        parts = path.split('/')
        if len(parts) >= 5 and parts[3] == 'tenant':
            tenant_id = parts[4]
        else:
            raise NotFoundError("Invalid path")
        
        # Get tenant config
        tenant = get_tenant_by_id(tenant_id)
        
        # Build metadata
        return {
            'issuer': f'https://example.com/tenant/{tenant_id}',
            'authorization_endpoint': f'https://example.com/tenant/{tenant_id}/authorize',
            'token_endpoint': f'https://example.com/tenant/{tenant_id}/token',
            'jwks_uri': f'https://example.com/tenant/{tenant_id}/.well-known/jwks.json',
            'response_types_supported': tenant.response_types,
            'grant_types_supported': tenant.grant_types,
            'scopes_supported': tenant.scopes
        }
```

### Subdomain-Based Tenants

**Pattern:** Each tenant on separate subdomain.

**Configuration:**
```
Tenant 1:
  Issuer: https://acme.auth.example.com
  Metadata: https://acme.auth.example.com/.well-known/oauth-authorization-server

Tenant 2:
  Issuer: https://globex.auth.example.com
  Metadata: https://globex.auth.example.com/.well-known/oauth-authorization-server
```

**Implementation:**

```python
class SubdomainBasedTenantMetadata:
    """Handle subdomain-based multi-tenant metadata"""
    
    def get_metadata(self, host):
        """Get tenant-specific metadata from host"""
        # Extract tenant from subdomain
        # host: acme.auth.example.com
        tenant_id = host.split('.')[0]
        
        # Get tenant config
        tenant = get_tenant_by_id(tenant_id)
        
        # Build metadata
        return {
            'issuer': f'https://{host}',
            'authorization_endpoint': f'https://{host}/authorize',
            'token_endpoint': f'https://{host}/token',
            'jwks_uri': f'https://{host}/.well-known/jwks.json',
            'response_types_supported': tenant.response_types,
            'grant_types_supported': tenant.grant_types,
            'scopes_supported': tenant.scopes
        }
```

### Shared vs Isolated Configuration

**Shared Configuration:**
```json
{
  "issuer": "https://example.com",
  "authorization_endpoint": "https://example.com/authorize?tenant={tenant_id}",
  "token_endpoint": "https://example.com/token",
  "scopes_supported": ["read", "write"]
}
```

**Pros:**
- Single metadata endpoint
- Simpler infrastructure

**Cons:**
- Less isolation
- Shared configuration limits tenant customization

**Isolated Configuration (Recommended):**
```json
// Tenant A
{
  "issuer": "https://example.com/tenant/a",
  "authorization_endpoint": "https://example.com/tenant/a/authorize",
  "scopes_supported": ["read", "write", "admin"]
}

// Tenant B
{
  "issuer": "https://example.com/tenant/b",
  "authorization_endpoint": "https://example.com/tenant/b/authorize",
  "scopes_supported": ["read", "write"]  // No admin
}
```

**Pros:**
- Complete tenant isolation
- Per-tenant customization
- Better security boundaries

**Cons:**
- More complex infrastructure
- Separate metadata per tenant

---

## Metadata Update and Versioning

### Updating Metadata

**Scenario:** Authorization server adds new features or endpoints.

**Update Process:**

```python
class MetadataManager:
    """Manage metadata updates"""
    
    def __init__(self):
        self.metadata = self.load_current_metadata()
    
    def add_new_endpoint(self, endpoint_name, endpoint_url):
        """Add new endpoint to metadata"""
        self.metadata[endpoint_name] = endpoint_url
        
        # Persist change
        self.save_metadata()
        
        # Notify monitoring
        logger.info(f"Added {endpoint_name}: {endpoint_url}")
    
    def remove_endpoint(self, endpoint_name):
        """Remove endpoint from metadata (careful!)"""
        if endpoint_name in self.metadata:
            del self.metadata[endpoint_name]
            
            # Alert - this is a breaking change
            alert('endpoint_removed', {
                'endpoint': endpoint_name,
                'timestamp': datetime.now()
            })
            
            self.save_metadata()
```

### Safe Changes (Non-Breaking)

**Can be deployed immediately:**

1. **Add New Endpoints:**
   ```json
   // Before
   {
     "token_endpoint": "https://auth.example.com/token"
   }
   
   // After
   {
     "token_endpoint": "https://auth.example.com/token",
     "device_authorization_endpoint": "https://auth.example.com/device"  // Added
   }
   ```

2. **Add New Scopes:**
   ```json
   "scopes_supported": ["read", "write", "admin"]  // Added "admin"
   ```

3. **Add New Grant Types:**
   ```json
   "grant_types_supported": [
     "authorization_code",
     "client_credentials",
     "urn:ietf:params:oauth:grant-type:device_code"  // Added
   ]
   ```

4. **Add New Authentication Methods:**
   ```json
   "token_endpoint_auth_methods_supported": [
     "client_secret_basic",
     "private_key_jwt"  // Added
   ]
   ```

**Client Behavior:** Clients ignore unknown fields (forward compatibility).

### Breaking Changes

**Require careful coordination:**

1. **Remove Endpoint:**
   ```json
   // Breaks clients using that endpoint
   // "revocation_endpoint" removed
   ```

2. **Change Endpoint URL:**
   ```json
   // Before
   "token_endpoint": "https://auth.example.com/token"
   
   // After (BREAKING)
   "token_endpoint": "https://auth.example.com/v2/token"
   ```

3. **Change Issuer:**
   ```json
   // EXTREMELY BREAKING
   "issuer": "https://new-auth.example.com"
   ```

4. **Remove Supported Feature:**
   ```json
   // Before
   "grant_types_supported": ["authorization_code", "client_credentials"]
   
   // After (BREAKING)
   "grant_types_supported": ["authorization_code"]  // Removed client_credentials
   ```

### Deprecation Strategy

**Best Practice for Breaking Changes:**

```
Phase 1: Announce Deprecation
  - Document change
  - Set timeline (e.g., 6 months)
  - Notify clients

Phase 2: Dual Support
  - Support both old and new
  - Monitor usage of old feature
  - Warn users via logs/emails

Phase 3: Soft Removal
  - Mark as deprecated in metadata
  - Return warnings
  - Continue supporting

Phase 4: Hard Removal
  - Remove from metadata
  - Remove implementation
  - Monitor for issues
```

**Example:**

```json
// Phase 2: Dual support
{
  "token_endpoint": "https://auth.example.com/token",
  "token_endpoint_v2": "https://auth.example.com/v2/token",
  "deprecated_endpoints": ["token_endpoint"]
}

// Phase 4: After transition
{
  "token_endpoint": "https://auth.example.com/v2/token"
}
```

### Backward Compatibility

**Maintain Compatibility:**

```python
class BackwardCompatibleMetadata:
    """Maintain backward compatibility"""
    
    def get_metadata(self, client_version=None):
        """Return version-appropriate metadata"""
        metadata = self.get_current_metadata()
        
        # Remove features not supported by old clients
        if client_version and client_version < '2.0':
            # Remove new fields for old clients
            metadata.pop('device_authorization_endpoint', None)
            metadata.pop('pushed_authorization_request_endpoint', None)
        
        return metadata
```

---

## Implementation Checklist

### Authorization Server Requirements

**MUST (RFC 2119):**

- [ ] **Implement Metadata Endpoint**
  - [ ] Endpoint at `/.well-known/oauth-authorization-server`
  - [ ] Path-specific support if issuer has path
  - [ ] Returns JSON with `application/json` content type
  - [ ] HTTP 200 status for success

- [ ] **Include Required Fields**
  - [ ] `issuer` (HTTPS URL, matches expected)
  - [ ] `authorization_endpoint` (unless client-credentials-only)
  - [ ] `token_endpoint`
  - [ ] `response_types_supported`

- [ ] **Use HTTPS**
  - [ ] Metadata endpoint uses HTTPS
  - [ ] All advertised endpoints use HTTPS
  - [ ] Valid TLS certificates

- [ ] **Advertise Only Supported Features**
  - [ ] Only include endpoints that are implemented
  - [ ] Only include grant types that work
  - [ ] Only include scopes that are available

**SHOULD (RFC 2119):**

- [ ] **Include Recommended Fields**
  - [ ] `grant_types_supported`
  - [ ] `token_endpoint_auth_methods_supported`
  - [ ] `jwks_uri` (for JWT tokens)
  - [ ] `scopes_supported`

- [ ] **Keep Metadata Updated**
  - [ ] Update when adding/removing endpoints
  - [ ] Update when changing supported features
  - [ ] Version metadata appropriately

- [ ] **Support Caching**
  - [ ] Include `Cache-Control` headers
  - [ ] Reasonable TTL (e.g., 1 hour)

- [ ] **Enable CORS** (for browser clients)
  - [ ] `Access-Control-Allow-Origin: *`
  - [ ] `Access-Control-Allow-Methods: GET`

### Client Requirements

**SHOULD (RFC 2119):**

- [ ] **Use Metadata for Configuration**
  - [ ] Fetch metadata from discovery endpoint
  - [ ] Don't hardcode endpoint URLs
  - [ ] Use metadata values for all endpoints

- [ ] **Validate Metadata Response**
  - [ ] Validate issuer matches expected
  - [ ] Check required fields present
  - [ ] Validate HTTPS endpoints
  - [ ] Check supported features meet needs

- [ ] **Cache Metadata**
  - [ ] Cache with reasonable TTL
  - [ ] Respect Cache-Control headers
  - [ ] Refresh on cache expiration

- [ ] **Handle Errors Gracefully**
  - [ ] Handle 404 (metadata not available)
  - [ ] Handle network errors
  - [ ] Use cached metadata on fetch failure
  - [ ] Provide fallback to manual configuration

- [ ] **Implement Fallback Strategy**
  - [ ] Try OIDC Discovery first
  - [ ] Fall back to OAuth2 Metadata
  - [ ] Support manual configuration

### Common Implementation Errors

**Authorization Server Errors:**

❌ **Not implementing path-specific discovery**
```python
# Wrong: Doesn't handle path-based issuers
metadata_url = issuer + "/.well-known/oauth-authorization-server"
```

✅ **Correct:**
```python
# Correct: Handles path-based issuers per RFC 8414 §3.3
if path:
    metadata_url = f"{scheme}://{host}/.well-known/oauth-authorization-server{path}"
```

❌ **Advertising features not implemented**
```json
{
  "device_authorization_endpoint": "https://auth.example.com/device"
}
// But endpoint returns 404!
```

❌ **Using HTTP instead of HTTPS**
```json
{
  "token_endpoint": "http://auth.example.com/token"  // ❌
}
```

**Client Errors:**

❌ **Not validating issuer**
```python
# Wrong: Accepts any issuer
metadata = fetch_metadata(discovery_url)
# No validation!
```

✅ **Correct:**
```python
# Correct: Validates issuer
metadata = fetch_metadata(discovery_url)
if metadata['issuer'] != expected_issuer:
    raise ValidationError("Issuer mismatch")
```

❌ **Not caching metadata**
```python
# Wrong: Fetches on every request
def get_token_endpoint():
    metadata = fetch_metadata(discovery_url)  # Slow!
    return metadata['token_endpoint']
```

✅ **Correct:**
```python
# Correct: Caches metadata
@cache(ttl=3600)
def get_metadata():
    return fetch_metadata(discovery_url)
```

---

## OAuth2 Metadata in Different Environments

### Development Environment

**Configuration:**
```json
{
  "issuer": "https://auth-dev.example.com",
  "authorization_endpoint": "https://auth-dev.example.com/authorize",
  "token_endpoint": "https://auth-dev.example.com/token",
  "jwks_uri": "https://auth-dev.example.com/.well-known/jwks.json",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "client_credentials"]
}
```

**Characteristics:**
- Separate issuer from production
- May use self-signed certificates (not recommended)
- Lower security requirements
- Frequent changes

**Client Configuration:**
```python
ENVIRONMENT = os.getenv('ENV', 'dev')

ISSUER_URLS = {
    'dev': 'https://auth-dev.example.com',
    'staging': 'https://auth-staging.example.com',
    'prod': 'https://auth.example.com'
}

issuer = ISSUER_URLS[ENVIRONMENT]
```

### Staging Environment

**Configuration:**
```json
{
  "issuer": "https://auth-staging.example.com",
  "authorization_endpoint": "https://auth-staging.example.com/authorize",
  "token_endpoint": "https://auth-staging.example.com/token",
  "jwks_uri": "https://auth-staging.example.com/.well-known/jwks.json",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token", "client_credentials"],
  "code_challenge_methods_supported": ["S256"]
}
```

**Characteristics:**
- Mirror of production configuration
- Production-like security
- Testing ground for changes
- Valid certificates

### Production Environment

**Configuration:**
```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "jwks_uri": "https://auth.example.com/.well-known/jwks.json",
  "revocation_endpoint": "https://auth.example.com/revoke",
  "introspection_endpoint": "https://auth.example.com/introspect",
  "registration_endpoint": "https://auth.example.com/register",
  "response_types_supported": ["code"],
  "grant_types_supported": [
    "authorization_code",
    "refresh_token",
    "client_credentials"
  ],
  "code_challenge_methods_supported": ["S256"],
  "token_endpoint_auth_methods_supported": [
    "client_secret_basic",
    "client_secret_post",
    "private_key_jwt"
  ],
  "scopes_supported": ["read", "write", "admin"]
}
```

**Characteristics:**
- High availability
- CDN for global distribution
- Monitoring and alerting
- Regular security audits

### Environment-Agnostic Client

```python
class EnvironmentAwareOAuth2Client:
    """OAuth2 client that adapts to environment"""
    
    def __init__(self, environment='prod'):
        self.environment = environment
        self.issuer = self._get_issuer_for_environment()
        self.metadata_client = OAuth2MetadataClient(self.issuer)
    
    def _get_issuer_for_environment(self):
        """Get issuer URL for current environment"""
        issuers = {
            'dev': 'https://auth-dev.example.com',
            'staging': 'https://auth-staging.example.com',
            'prod': 'https://auth.example.com'
        }
        
        return issuers.get(self.environment)
    
    def get_token(self, grant_type, **params):
        """Get token using environment-specific metadata"""
        metadata = self.metadata_client.get_metadata()
        
        response = requests.post(
            metadata['token_endpoint'],
            data={'grant_type': grant_type, **params}
        )
        
        return response.json()
```

---

## Testing and Troubleshooting

### Manual Testing

**Test Metadata Endpoint:**

```bash
# Test OAuth2 Metadata
curl -v https://auth.example.com/.well-known/oauth-authorization-server

# Test with path-based issuer
curl -v https://example.com/.well-known/oauth-authorization-server/oauth2

# Test with accept header
curl -H "Accept: application/json" \
  https://auth.example.com/.well-known/oauth-authorization-server
```

**Validate JSON:**

```bash
# Fetch and validate JSON
curl -s https://auth.example.com/.well-known/oauth-authorization-server | jq .

# Check specific field
curl -s https://auth.example.com/.well-known/oauth-authorization-server | \
  jq '.token_endpoint'
```

### Validation Checklist

**Metadata Endpoint:**
- [ ] Endpoint accessible via HTTPS
- [ ] Returns HTTP 200 OK
- [ ] Content-Type is `application/json`
- [ ] JSON is well-formed
- [ ] Contains all required fields

**Required Fields:**
- [ ] `issuer` present and correct
- [ ] `token_endpoint` present
- [ ] `response_types_supported` present
- [ ] `authorization_endpoint` present (unless client-credentials-only)

**Endpoint URLs:**
- [ ] All URLs use HTTPS (or localhost for dev)
- [ ] All URLs are complete (not relative)
- [ ] Endpoints are accessible

**Feature Consistency:**
- [ ] `grant_types_supported` includes implemented grants
- [ ] `response_types_supported` includes implemented response types
- [ ] `scopes_supported` includes actual scopes
- [ ] No advertised features are unimplemented

### Common Issues and Solutions

#### Issue 1: 404 Not Found

**Symptoms:**
```bash
curl https://auth.example.com/.well-known/oauth-authorization-server
# HTTP/1.1 404 Not Found
```

**Possible Causes:**
1. Metadata endpoint not implemented
2. Incorrect URL construction
3. Server misconfiguration

**Solutions:**
- Verify metadata endpoint is implemented
- Check path-based issuer URL construction
- Try OIDC Discovery as fallback
- Review server logs

#### Issue 2: Invalid JSON

**Symptoms:**
```bash
curl https://auth.example.com/.well-known/oauth-authorization-server
# Returns HTML error page or malformed JSON
```

**Solutions:**
```bash
# Check Content-Type
curl -I https://auth.example.com/.well-known/oauth-authorization-server

# Should see:
# Content-Type: application/json
```

**Validation:**
```python
def validate_json_response(response):
    """Validate JSON response"""
    # Check Content-Type
    content_type = response.headers.get('Content-Type', '')
    if 'application/json' not in content_type:
        raise ValidationError(f"Invalid Content-Type: {content_type}")
    
    # Try parsing JSON
    try:
        return response.json()
    except json.JSONDecodeError as e:
        raise ValidationError(f"Invalid JSON: {e}")
```

#### Issue 3: Missing Required Fields

**Symptoms:**
```json
{
  "issuer": "https://auth.example.com",
  "token_endpoint": "https://auth.example.com/token"
  // Missing response_types_supported
}
```

**Solution:**
- Add all required fields to metadata
- Validate against RFC 8414 requirements

#### Issue 4: Issuer Mismatch

**Symptoms:**
```
Expected: https://auth.example.com
Metadata: https://auth-prod.example.com
```

**Solutions:**
- Update client configuration with correct issuer
- Update authorization server to return correct issuer
- Check for load balancer / proxy issues

#### Issue 5: Path-Based Issuer Not Working

**Symptoms:**
```
Issuer: https://example.com/oauth2
Trying: https://example.com/oauth2/.well-known/oauth-authorization-server
Result: 404
```

**Solution:**
```bash
# Correct path-specific URL:
curl https://example.com/.well-known/oauth-authorization-server/oauth2
```

**Note:** Path comes AFTER `/.well-known/oauth-authorization-server`

### Debug Mode

**Enable Verbose Logging:**

```python
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def fetch_metadata_debug(issuer_url):
    """Fetch metadata with debug logging"""
    metadata_url = construct_oauth2_metadata_url(issuer_url)
    
    logger.debug(f"Fetching metadata from: {metadata_url}")
    
    try:
        response = requests.get(metadata_url, timeout=10)
        
        logger.debug(f"Response status: {response.status_code}")
        logger.debug(f"Response headers: {response.headers}")
        logger.debug(f"Response body: {response.text[:500]}")
        
        if response.status_code == 200:
            metadata = response.json()
            logger.debug(f"Parsed metadata: {json.dumps(metadata, indent=2)}")
            return metadata
        else:
            raise MetadataError(f"HTTP {response.status_code}")
            
    except Exception as e:
        logger.error(f"Metadata fetch failed: {e}")
        raise
```

---

## Relationship to Other Specifications

### Primary Specifications

1. **RFC 8414 - OAuth 2.0 Authorization Server Metadata**
   - URL: https://www.rfc-editor.org/rfc/rfc8414.html
   - This specification
   - Sections:
     - §2: Authorization Server Metadata
     - §3: Obtaining Authorization Server Metadata
     - §3.3: Path-Specific Issuer Identifiers
     - §5: Security Considerations

2. **OpenID Connect Discovery 1.0**
   - URL: https://openid.net/specs/openid-connect-discovery-1_0.html
   - Extends OAuth2 Metadata for OIDC
   - Related Document: `well-known-configuration.md`

### Supporting Specifications

3. **RFC 6749 - OAuth 2.0 Framework**
   - Base OAuth 2.0 specification
   - Grant types, endpoints, flows

4. **RFC 7591 - Dynamic Client Registration**
   - `registration_endpoint` field
   - Client registration protocol

5. **RFC 7662 - Token Introspection**
   - `introspection_endpoint` field
   - Related Document: `token-introspection-and-revocation.md`

6. **RFC 7009 - Token Revocation**
   - `revocation_endpoint` field
   - Related Document: `token-introspection-and-revocation.md`

7. **RFC 8628 - Device Authorization Grant**
   - `device_authorization_endpoint` field
   - Related Document: `device-authorization-flow.md`

8. **RFC 9126 - Pushed Authorization Requests**
   - `pushed_authorization_request_endpoint` field

9. **RFC 7636 - PKCE**
   - `code_challenge_methods_supported` field
   - Related Document: `pkce-implementation.md`

---

## Migration Between OAuth2 and OIDC

### Migrating from OAuth2 to OIDC

**Scenario:** Adding OIDC capabilities to existing OAuth2 authorization server.

**Process:**

**Phase 1: Implement OIDC Features**
```
1. Add ID token issuance
2. Implement UserInfo endpoint
3. Add OIDC-specific claims
4. Implement subject types
```

**Phase 2: Add OIDC Discovery Endpoint**
```python
# Add OIDC Discovery alongside OAuth2 Metadata
@app.route('/.well-known/openid-configuration')
def oidc_discovery():
    oauth2_metadata = get_oauth2_metadata()
    
    # Add OIDC-specific fields
    oidc_metadata = {
        **oauth2_metadata,
        'userinfo_endpoint': 'https://auth.example.com/userinfo',
        'subject_types_supported': ['public'],
        'id_token_signing_alg_values_supported': ['RS256'],
        'claims_supported': ['sub', 'name', 'email']
    }
    
    return jsonify(oidc_metadata)

# Keep OAuth2 Metadata for compatibility
@app.route('/.well-known/oauth-authorization-server')
def oauth2_metadata():
    return jsonify(get_oauth2_metadata())
```

**Phase 3: Migrate Clients**
```
1. Update clients to use OIDC Discovery
2. Enable OIDC flows in clients
3. Monitor usage of OAuth2 Metadata endpoint
```

**Phase 4: Optional Deprecation**
```
After all clients migrated:
- Continue supporting OAuth2 Metadata for compatibility
- Or deprecate OAuth2 Metadata endpoint (with notice)
```

### Removing OIDC Support (Downgrade to OAuth2-Only)

**Scenario:** Simplifying authorization server by removing OIDC.

**Process:**

**Phase 1: Announce Change**
```
1. Notify all clients
2. Provide migration timeline (e.g., 6 months)
3. Document OAuth2-only capabilities
```

**Phase 2: Add OAuth2 Metadata Endpoint**
```python
@app.route('/.well-known/oauth-authorization-server')
def oauth2_metadata():
    # OAuth2-only metadata (no OIDC fields)
    return jsonify({
        'issuer': 'https://auth.example.com',
        'authorization_endpoint': 'https://auth.example.com/authorize',
        'token_endpoint': 'https://auth.example.com/token',
        'jwks_uri': 'https://auth.example.com/.well-known/jwks.json',
        'response_types_supported': ['code'],
        'grant_types_supported': ['authorization_code', 'client_credentials']
        # No OIDC fields
    })
```

**Phase 3: Remove OIDC Features**
```
1. Remove ID token issuance
2. Remove UserInfo endpoint
3. Update OIDC Discovery to redirect to OAuth2 Metadata
```

**Phase 4: Deprecate OIDC Discovery**
```python
@app.route('/.well-known/openid-configuration')
def oidc_discovery_deprecated():
    # Redirect to OAuth2 Metadata
    return redirect('/.well-known/oauth-authorization-server', code=301)
```

---

## Example Scenarios

### Scenario 1: Client Discovers OAuth2-Only Server

**Flow:**
```python
# Client attempts discovery
issuer = 'https://api.example.com'

# Try OIDC Discovery first
oidc_url = issuer + '/.well-known/openid-configuration'
response = requests.get(oidc_url)

if response.status_code == 404:
    # OIDC not supported, try OAuth2 Metadata
    oauth2_url = issuer + '/.well-known/oauth-authorization-server'
    response = requests.get(oauth2_url)
    
    if response.status_code == 200:
        metadata = response.json()
        print("OAuth2-only server discovered")
        # Use OAuth2 flows only (no ID tokens)
```

### Scenario 2: Path-Based Multi-Tenant Discovery

**Configuration:**
```
Tenant: acme-corp
Issuer: https://auth.example.com/tenant/acme-corp
Metadata: https://auth.example.com/.well-known/oauth-authorization-server/tenant/acme-corp
```

**Client Discovery:**
```python
issuer = 'https://auth.example.com/tenant/acme-corp'

# Construct OAuth2 metadata URL
parsed = urlparse(issuer)
path = parsed.path  # "/tenant/acme-corp"

metadata_url = f"{parsed.scheme}://{parsed.netloc}/.well-known/oauth-authorization-server{path}"
# → https://auth.example.com/.well-known/oauth-authorization-server/tenant/acme-corp

metadata = requests.get(metadata_url).json()

print(f"Tenant issuer: {metadata['issuer']}")
print(f"Token endpoint: {metadata['token_endpoint']}")
```

### Scenario 3: Checking PKCE Support

**Client Code:**
```python
def configure_oauth2_client(issuer):
    """Configure client with PKCE if supported"""
    metadata = fetch_oauth2_metadata(issuer)
    
    # Check PKCE support
    pkce_methods = metadata.get('code_challenge_methods_supported', [])
    
    if 'S256' in pkce_methods:
        print("PKCE with S256 supported - will use PKCE")
        return OAuth2Client(metadata, use_pkce=True, pkce_method='S256')
    elif 'plain' in pkce_methods:
        print("PKCE with plain supported - will use PKCE (plain)")
        return OAuth2Client(metadata, use_pkce=True, pkce_method='plain')
    else:
        print("PKCE not advertised - using OAuth 2.1 default (S256)")
        # Modern clients should use PKCE even if not advertised
        return OAuth2Client(metadata, use_pkce=True, pkce_method='S256')
```

### Scenario 4: Server Adds Device Flow

**Before:**
```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "grant_types_supported": ["authorization_code", "client_credentials"]
}
```

**After (Device Flow Added):**
```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "device_authorization_endpoint": "https://auth.example.com/device",
  "grant_types_supported": [
    "authorization_code",
    "client_credentials",
    "urn:ietf:params:oauth:grant-type:device_code"
  ]
}
```

**Client Behavior:**
```python
metadata = fetch_metadata(issuer)

# Check if device flow supported
if 'device_authorization_endpoint' in metadata:
    print("Device flow supported!")
    device_endpoint = metadata['device_authorization_endpoint']
    # Can now use device flow
else:
    print("Device flow not supported")
    # Use standard authorization code flow
```

### Scenario 5: Validating Issuer

**Client Validation:**
```python
def validate_discovered_metadata(metadata, expected_issuer):
    """Validate metadata from discovery"""
    # CRITICAL: Validate issuer
    if metadata['issuer'] != expected_issuer:
        raise SecurityError(
            f"Issuer mismatch: expected '{expected_issuer}', "
            f"got '{metadata['issuer']}'"
        )
    
    print(f"✓ Issuer validated: {metadata['issuer']}")
    return True

# Usage
expected = 'https://auth.example.com'
metadata = fetch_oauth2_metadata(expected)

try:
    validate_discovered_metadata(metadata, expected)
    print("Metadata validation successful")
except SecurityError as e:
    print(f"Security error: {e}")
    # Do not proceed with OAuth2 flow
```

---

## Comparison: Metadata vs Manual Configuration

### Metadata-Based Configuration (Recommended)

**Advantages:**

1. **Dynamic Configuration**
   - Endpoints discovered automatically
   - No hardcoded URLs
   - Works across environments

2. **Always Up-to-Date**
   - Reflects current server capabilities
   - Automatic feature discovery
   - No stale configuration

3. **Reduced Errors**
   - No typos in endpoint URLs
   - Correct endpoint construction
   - Validated by authorization server

4. **Feature Discovery**
   - Client knows what's supported
   - Can adapt to server capabilities
   - Graceful feature degradation

5. **Multi-Environment**
   - Same client code for dev/staging/prod
   - Just change issuer URL
   - Automatic endpoint adaptation

**Example:**
```python
# Clean, environment-agnostic
client = OAuth2Client(issuer='https://auth.example.com')
token = client.get_token(grant_type='authorization_code', code=code)
```

### Manual Configuration

**Advantages:**

1. **Works Without Metadata Endpoint**
   - Legacy authorization servers
   - Servers not implementing RFC 8414
   - Custom implementations

2. **Explicit Control**
   - Know exactly which endpoints used
   - No runtime discovery overhead
   - No dependency on metadata endpoint

3. **Offline Configuration**
   - No network call needed
   - Can work without internet
   - Configuration in code/files

**Example:**
```python
# Explicit configuration
client = OAuth2Client(
    issuer='https://auth.example.com',
    authorization_endpoint='https://auth.example.com/authorize',
    token_endpoint='https://auth.example.com/token',
    jwks_uri='https://auth.example.com/.well-known/jwks.json'
)
```

### Hybrid Approach (Best Practice)

**Strategy:** Use metadata by default, fall back to manual configuration.

```python
class HybridOAuth2Client:
    """OAuth2 client with metadata discovery and manual fallback"""
    
    def __init__(self, issuer=None, manual_config=None):
        if manual_config:
            # Use manual configuration
            self.config = manual_config
            self.config_source = 'manual'
        elif issuer:
            # Try metadata discovery
            try:
                self.config = self._discover_metadata(issuer)
                self.config_source = 'metadata'
            except DiscoveryError:
                raise ConfigurationError(
                    "Metadata discovery failed and no manual config provided"
                )
        else:
            raise ValueError("Either issuer or manual_config required")
    
    def _discover_metadata(self, issuer):
        """Discover metadata with OAuth2/OIDC fallback"""
        # Try both discovery methods
        client = OAuth2MetadataClient(issuer)
        return client.get_metadata()

# Usage 1: Metadata discovery (preferred)
client = HybridOAuth2Client(issuer='https://auth.example.com')

# Usage 2: Manual configuration (fallback)
client = HybridOAuth2Client(manual_config={
    'issuer': 'https://auth.example.com',
    'authorization_endpoint': 'https://auth.example.com/authorize',
    'token_endpoint': 'https://auth.example.com/token'
})
```

### Recommendation Matrix

| Scenario | Recommendation |
|----------|----------------|
| New implementation | Use metadata discovery |
| Modern authorization server | Use metadata discovery |
| Legacy server (no metadata) | Use manual configuration |
| High-security environment | Use metadata + validate extensively |
| Offline/air-gapped | Use manual configuration |
| Multi-environment deployment | Use metadata discovery |
| Simple proof-of-concept | Either works (metadata preferred) |

---

## Conclusion

OAuth 2.0 Authorization Server Metadata (RFC 8414) provides a standardized mechanism for authorization servers to advertise their capabilities and for clients to discover configuration dynamically. This specification is the foundation upon which OIDC Discovery builds, serving pure OAuth2 implementations and providing a common baseline for all OAuth2-based systems.

**Key Takeaways:**

1. **OAuth2 Metadata vs OIDC Discovery:** OIDC Discovery extends OAuth2 Metadata with identity-specific fields
2. **Path-Specific Issuers:** Special URL construction for path-based issuers (RFC 8414 §3.3)
3. **Dynamic Discovery:** Eliminates hardcoded configuration and enables automatic updates
4. **Security Critical:** HTTPS required, issuer validation mandatory
5. **Backward Compatibility:** Servers can support both OAuth2 Metadata and OIDC Discovery
6. **Multi-Tenant Support:** Path-based and subdomain-based tenant isolation
7. **Client Fallback:** Try OIDC Discovery first, fall back to OAuth2 Metadata

**Implementation Priority:**

1. Implement metadata endpoint at correct path
2. Include all required fields
3. Use HTTPS for all endpoints
4. Validate client requests appropriately
5. Keep metadata synchronized with actual capabilities
6. Cache metadata appropriately
7. Monitor and alert on issues

**When to Use:**
- **OAuth2 Metadata:** Pure OAuth2 systems (no OIDC)
- **OIDC Discovery:** Systems supporting OpenID Connect
- **Both:** Maximum compatibility

For questions or issues, refer to RFC 8414 or consult with your security team.

---

**Document Version:** 1.0
**Last Updated:** 2024
**Specification References:**
- RFC 8414 (OAuth 2.0 Authorization Server Metadata)
- OpenID Connect Discovery 1.0
- RFC 6749 (OAuth 2.0 Framework)
