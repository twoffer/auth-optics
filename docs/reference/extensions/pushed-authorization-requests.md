# Pushed Authorization Requests (PAR)

> "The Authorization Server, wisely, had long considered a terrible truth: if you're going to hand over the keys to the kingdom, perhaps don't write the address on a postcard that everyone can read. This revelation led to PAR, where authorization parameters are sent via secure backchannel rather than dangled in browser URLs like digital party streamers. The URLs became refreshingly short, the parameters became wonderfully invisible, and the phishers became considerably less successful. Progress."
>
> Pushed Authorization Requests (RFC 9126) moves authorization request parameters from the frontchannel (browser, visible in URLs) to the backchannel (direct server-to-server), exchanging them for an opaque `request_uri` reference. It's like checking your luggage instead of carrying it through security—more secure, less visible, and nobody sees what you're traveling with.

## Document Purpose

This document provides authoritative reference for Pushed Authorization Requests (PAR, RFC 9126), targeting security professionals implementing PAR for enhanced security, financial services (FAPI) compliance, or debugging PAR issues in production OAuth2/OIDC systems.

**Primary Use Cases:**
- High-security applications requiring parameter confidentiality
- Financial services and FAPI compliance
- Phishing protection and URL-based attack mitigation
- Large authorization requests exceeding URL length limits
- Protecting sensitive authorization parameters

**Target Audience:** Security professionals, FAPI implementers, OAuth2/OIDC developers, financial services security architects, and penetration testers.

## Table of Contents

1. [Overview](#overview)
2. [The Problem PAR Solves](#the-problem-par-solves)
3. [PAR Flow Overview](#par-flow-overview)
4. [PAR Endpoint Discovery](#par-endpoint-discovery)
5. [Pushed Authorization Request](#pushed-authorization-request)
6. [PAR Response](#par-response)
7. [Authorization Request with request_uri](#authorization-request-with-request_uri)
8. [PAR Security Benefits](#par-security-benefits)
9. [Client Authentication in PAR](#client-authentication-in-par)
10. [request_uri Lifecycle](#request_uri-lifecycle)
11. [Parameter Validation and Binding](#parameter-validation-and-binding)
12. [PAR vs Request Objects (JAR)](#par-vs-request-objects-jar)
13. [FAPI Requirements](#fapi-requirements)
14. [PAR Error Handling](#par-error-handling)
15. [Implementation Requirements Checklist](#implementation-requirements-checklist)
16. [PAR with Different Client Types](#par-with-different-client-types)
17. [PAR Performance Considerations](#par-performance-considerations)
18. [PAR in Multi-Tenant Scenarios](#par-in-multi-tenant-scenarios)
19. [Security Considerations](#security-considerations)
20. [Testing and Validation](#testing-and-validation)
21. [Relationship to Other Specifications](#relationship-to-other-specifications)
22. [Example Scenarios](#example-scenarios)
23. [Migration to PAR](#migration-to-par)

---

## Overview

**Specification:** RFC 9126 - OAuth 2.0 Pushed Authorization Requests (PAR)

**Purpose:** PAR enables clients to push authorization request parameters to the authorization server via a backchannel (direct server-to-server) request before initiating the authorization flow, receiving an opaque `request_uri` in return that references the pushed parameters.

**Key Benefits:**

1. **Enhanced Security:** Authorization parameters not visible in URLs
2. **Phishing Protection:** Minimal frontchannel exposure reduces attack surface
3. **Parameter Integrity:** Parameters pushed via authenticated channel
4. **Large Request Support:** No URL length limitations
5. **Parameter Confidentiality:** Sensitive data not exposed in browser

**Primary Use Cases:**

- **Financial Services (FAPI):** Required for financial-grade API security
- **High-Security Applications:** Healthcare, government, enterprise
- **Phishing Protection:** Reduces effectiveness of URL-based phishing
- **Complex Authorization Requests:** Large scope sets, extensive claims
- **Sensitive Parameter Protection:** login_hint with PII, complex policies

### Traditional vs PAR Authorization Flow

**Traditional Authorization Request (All Parameters in URL):**

```
GET /authorize?response_type=code
               &client_id=s6BhdRkqt3
               &redirect_uri=https://client.example.com/cb
               &scope=openid%20profile%20email%20read%20write
               &state=af0ifjsldkj
               &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
               &code_challenge_method=S256
               &login_hint=user@example.com
               &max_age=3600
               &claims=...very-long-json...
```

**Problems:**
- ❌ All parameters visible in URL (browser history, logs, referrer)
- ❌ URL length limitations (~2000 characters in many browsers)
- ❌ Phishing risk (attacker crafts URL with malicious parameters)
- ❌ MITM can see/modify parameters
- ❌ Sensitive data exposed (login_hint, claims, etc.)

**PAR Authorization Request (Minimal Frontchannel):**

```
GET /authorize?client_id=s6BhdRkqt3
               &request_uri=urn:ietf:params:oauth:request_uri:bwc4JK-ESC0w8acc191e-Y1LTC2
```

**Advantages:**
- ✅ Only `client_id` and `request_uri` visible
- ✅ No URL length limits
- ✅ Parameters protected via backchannel
- ✅ Harder to craft convincing phishing URLs
- ✅ Sensitive data never in frontchannel

---

## The Problem PAR Solves

### Traditional Authorization Request Vulnerabilities

#### 1. Parameter Visibility

**Problem:** All authorization parameters visible in URL.

**Exposure Points:**
```
Browser History:
  https://auth.example.com/authorize?...&login_hint=victim@example.com&...

Server Logs:
  [2024-01-15 10:30:15] GET /authorize?...&login_hint=victim@example.com&...

Referrer Headers:
  Referer: https://auth.example.com/authorize?...&login_hint=victim@example.com&...

Browser Extensions:
  Can read full URL including parameters

Network Monitoring:
  HTTPS encrypts transport, but parameters visible once decrypted
```

**Impact:**
- Personal Identifiable Information (PII) exposed
- Authorization policies visible
- Scope requests visible
- State parameter visible (potential CSRF insight)

#### 2. URL Length Limitations

**Problem:** Browsers and servers have URL length limits.

**Typical Limits:**
```
Internet Explorer: ~2,083 characters
Chrome: ~32,779 characters
Firefox: ~65,536 characters
Edge: ~2,083 characters (legacy), ~32,779 characters (Chromium)

Many servers: 8,192 characters default
CDNs/proxies: Often 2,000-4,000 character limits
```

**Impact on OAuth2:**
```json
// Complex authorization request with extensive claims
{
  "claims": {
    "id_token": {
      "email": {"essential": true},
      "email_verified": {"essential": true},
      "name": {"essential": true},
      "given_name": {"essential": true},
      "family_name": {"essential": true},
      "phone_number": {"essential": true},
      "address": {"essential": true},
      ...many more fields...
    },
    "userinfo": {...similar extensive claims...}
  }
}

// URL-encoded and added to authorization request
GET /authorize?response_type=code&...&claims=<3000+ characters>
// Exceeds many URL limits!
```

#### 3. Phishing Attack Surface

**Problem:** Attackers can craft convincing authorization URLs.

**Attack Scenario:**

```
Legitimate Authorization URL:
https://auth.bank.example.com/authorize
  ?response_type=code
  &client_id=banking_app
  &redirect_uri=https://banking-app.example.com/callback
  &scope=accounts%20transactions
  &state=abc123

Phishing URL (looks similar):
https://auth.bank.example.com/authorize
  ?response_type=code
  &client_id=banking_app
  &redirect_uri=https://evil-phishing-site.com/steal-code
  &scope=accounts%20transactions
  &state=xyz789
```

**User Perspective:**
- URL looks authoritative (correct domain in hostname)
- Parameters are complex and intimidating
- User unlikely to scrutinize query parameters
- Attacker can modify `redirect_uri`, `state`, add extra parameters

**With PAR:**
```
Legitimate:
https://auth.bank.example.com/authorize
  ?client_id=banking_app
  &request_uri=urn:ietf:params:oauth:request_uri:6esc_11ACC5bwc014ltc14eY

Phishing Attempt:
https://auth.bank.example.com/authorize
  ?client_id=banking_app
  &request_uri=urn:ietf:params:oauth:request_uri:FAKE_NOT_REAL
```

**Why Harder to Phish:**
- Attacker cannot generate valid `request_uri` (requires client authentication)
- `request_uri` is opaque (attacker can't guess valid values)
- Even if attacker gets old `request_uri`, single-use prevents reuse
- Minimal parameters make URL tampering more obvious

#### 4. Man-in-the-Middle (MITM) Visibility

**Problem:** While HTTPS protects transport, parameters visible once decrypted.

**Scenarios:**
```
Corporate Proxy/TLS Interception:
  - Company decrypts HTTPS for inspection
  - Full URL visible to proxy logs
  - Authorization parameters exposed

Browser Extensions:
  - Can read URL after TLS decryption
  - Malicious extensions harvest parameters

Compromised Browser:
  - Malware can read URLs
  - Parameters fully visible
```

**PAR Defense:**
- Parameters only in backchannel POST (never in browser URL)
- Browser/proxy never sees actual authorization parameters
- Only `request_uri` visible (meaningless to attacker)

### PAR Solution Summary

| Problem | Traditional Auth | PAR |
|---------|-----------------|-----|
| **Parameters in URL** | All parameters visible | Only client_id + request_uri |
| **Browser History** | Full authorization request logged | Minimal, no sensitive data |
| **Server Logs** | Full parameters in access logs | Only request_uri logged |
| **URL Length** | Limited (~2000-8000 chars) | No limit (backchannel POST) |
| **Phishing** | Easy to craft malicious URL | Attacker cannot generate valid request_uri |
| **Parameter Integrity** | Can be modified in frontchannel | Protected by authenticated backchannel |
| **Sensitive Data Exposure** | login_hint, claims visible | Never in frontchannel |

---

## PAR Flow Overview

**Complete PAR Flow:**

```
┌────────────┐                                           ┌─────────────────────┐
│   Client   │                                           │Authorization Server │
│  (Backend) │                                           │                     │
└──────┬─────┘                                           └──────────┬──────────┘
       │                                                            │
       │ STEP 1: Push Authorization Request (Backchannel)          │
       │                                                            │
       │  POST /par                                                 │
       │  Content-Type: application/x-www-form-urlencoded          │
       │  Authorization: Basic <client_credentials>                │
       │                                                            │
       │  response_type=code                                        │
       │  &client_id=s6BhdRkqt3                                     │
       │  &redirect_uri=https://client.example.com/cb              │
       │  &scope=openid profile email                              │
       │  &state=af0ifjsldkj                                        │
       │  &code_challenge=E9Melhoa2...                             │
       │  &code_challenge_method=S256                              │
       │────────────────────────────────────────────────────────────>│
       │                                                            │
       │                          STEP 2: Validate & Store         │
       │                                - Authenticate client       │
       │                                - Validate parameters       │
       │                                - Generate request_uri      │
       │                                - Store with parameters     │
       │                                                            │
       │  HTTP/1.1 201 Created                                      │
       │  Content-Type: application/json                            │
       │                                                            │
       │  {                                                         │
       │    "request_uri": "urn:ietf:params:oauth:request_uri:...",│
       │    "expires_in": 90                                        │
       │  }                                                         │
       │<────────────────────────────────────────────────────────────│
       │                                                            │
       
┌──────┴─────┐                                           ┌──────────┴──────────┐
│   Client   │                                           │Authorization Server │
│ (Frontend) │                                           │                     │
└──────┬─────┘                                           └──────────┬──────────┘
       │                                                            │
       │ STEP 3: Authorization Request (Frontchannel)              │
       │         User redirected by client                          │
       │                                                            │
       │  GET /authorize?client_id=s6BhdRkqt3                      │
       │                &request_uri=urn:ietf:params:oauth:...     │
       │────────────────────────────────────────────────────────────>│
       │                                                            │
       │                          STEP 4: Retrieve Request          │
       │                                - Extract request_uri       │
       │                                - Lookup stored parameters  │
       │                                - Validate not expired      │
       │                                - Validate client_id match  │
       │                                - Invalidate request_uri    │
       │                                  (single-use)              │
       │                                                            │
       │  STEP 5: Normal Authorization Flow                         │
       │  - Display consent screen (using stored parameters)        │
       │  - User authenticates and authorizes                       │
       │  - Generate authorization code                             │
       │                                                            │
       │  HTTP/1.1 302 Found                                        │
       │  Location: https://client.example.com/cb?code=xyz&state=...│
       │<────────────────────────────────────────────────────────────│
       │                                                            │
       
┌──────┴─────┐                                           ┌──────────┴──────────┐
│   Client   │                                           │Authorization Server │
│  (Backend) │                                           │                     │
└──────┬─────┘                                           └──────────┬──────────┘
       │                                                            │
       │ STEP 6: Token Request (Standard OAuth2)                    │
       │                                                            │
       │  POST /token                                               │
       │  grant_type=authorization_code&code=xyz&...               │
       │────────────────────────────────────────────────────────────>│
       │                                                            │
       │  {                                                         │
       │    "access_token": "...",                                  │
       │    "token_type": "Bearer",                                 │
       │    "expires_in": 3600                                      │
       │  }                                                         │
       │<────────────────────────────────────────────────────────────│
       │                                                            │
```

### Flow Steps Explained

**Step 1: Push Authorization Request (Backchannel)**
- Client sends authorization parameters to PAR endpoint
- Direct server-to-server communication (not via browser)
- Client authenticates (confidential clients MUST, public clients SHOULD)
- All normal authorization request parameters included

**Step 2: Validate and Store**
- Authorization server authenticates client
- Validates all authorization parameters
- Generates opaque, high-entropy `request_uri`
- Stores authorization parameters associated with `request_uri`
- Returns `request_uri` and `expires_in` to client

**Step 3: Authorization Request with request_uri (Frontchannel)**
- Client redirects user to authorization endpoint
- Minimal parameters: only `client_id` and `request_uri`
- User's browser makes request (frontchannel)

**Step 4: Retrieve Stored Request**
- Authorization server extracts `request_uri` from URL
- Retrieves stored authorization parameters
- Validates `request_uri` not expired
- Validates `client_id` matches client that pushed request
- Invalidates `request_uri` (single-use enforcement)

**Step 5: Normal Authorization Flow**
- Proceeds with standard OAuth2 authorization using stored parameters
- User authenticates and consents
- Authorization code generated and returned

**Step 6: Token Exchange**
- Standard OAuth2 token exchange
- No PAR-specific changes

### Key Insights

**Backchannel vs Frontchannel:**
- **Backchannel (Step 1):** Direct server-to-server, authenticated, parameters secure
- **Frontchannel (Step 3):** Via browser, minimal parameters, reduced attack surface

**Security Properties:**
- Parameters never visible to user/browser
- Client authenticated before storing parameters
- `request_uri` opaque and unpredictable
- Short lifetime limits exposure
- Single-use prevents replay

---

## PAR Endpoint Discovery

**Specification:** RFC 9126 §5 - Authorization Server Metadata

### Discovery Field

**Field Name:** `pushed_authorization_request_endpoint`

**Location:** Authorization Server Metadata (RFC 8414) or OIDC Discovery

**Type:** String (URL)

**Description:** URL of the authorization server's PAR endpoint where clients can push authorization request parameters.

### Discovery Example

**OAuth2 Authorization Server Metadata:**

```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "pushed_authorization_request_endpoint": "https://auth.example.com/par",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "code_challenge_methods_supported": ["S256"]
}
```

**OIDC Discovery:**

```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "userinfo_endpoint": "https://auth.example.com/userinfo",
  "pushed_authorization_request_endpoint": "https://auth.example.com/par",
  "jwks_uri": "https://auth.example.com/.well-known/jwks.json",
  "response_types_supported": ["code"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"]
}
```

### Client Discovery Process

```python
def discover_par_endpoint(issuer_url):
    """
    Discover PAR endpoint from authorization server metadata
    
    Args:
        issuer_url: Authorization server issuer URL
    
    Returns:
        PAR endpoint URL or None if not supported
    """
    # Fetch metadata (try OIDC Discovery first, fall back to OAuth2)
    metadata = fetch_metadata(issuer_url)
    
    # Check for PAR endpoint
    par_endpoint = metadata.get('pushed_authorization_request_endpoint')
    
    if par_endpoint:
        logger.info(f"PAR supported: {par_endpoint}")
        return par_endpoint
    else:
        logger.info("PAR not supported by this authorization server")
        return None

# Usage
issuer = 'https://auth.example.com'
par_endpoint = discover_par_endpoint(issuer)

if par_endpoint:
    # Use PAR flow
    request_uri = push_authorization_request(par_endpoint, params)
else:
    # Fall back to traditional authorization request
    authorization_url = build_authorization_url(auth_endpoint, params)
```

### Checking PAR Support

```python
class OAuth2Client:
    """OAuth2 client with PAR support detection"""
    
    def __init__(self, issuer):
        self.issuer = issuer
        self.metadata = self.fetch_metadata()
    
    def supports_par(self):
        """Check if authorization server supports PAR"""
        return 'pushed_authorization_request_endpoint' in self.metadata
    
    def get_par_endpoint(self):
        """Get PAR endpoint URL"""
        if not self.supports_par():
            raise UnsupportedFeatureError("PAR not supported")
        return self.metadata['pushed_authorization_request_endpoint']

# Usage
client = OAuth2Client('https://auth.example.com')

if client.supports_par():
    print(f"PAR endpoint: {client.get_par_endpoint()}")
else:
    print("PAR not available")
```

---

## Pushed Authorization Request

**Specification:** RFC 9126 §2.1 - Pushed Authorization Request

### PAR Endpoint Characteristics

**HTTP Method:** POST (RFC 2119: REQUIRED)

**Content-Type:** `application/x-www-form-urlencoded` (RFC 2119: REQUIRED)

**Authentication:** 
- Confidential clients: REQUIRED (RFC 2119: REQUIRED)
- Public clients: RECOMMENDED (RFC 2119: RECOMMENDED)

**URL:** From `pushed_authorization_request_endpoint` in metadata

### Request Parameters

**PAR Request Contains:** All normal authorization request parameters

**Standard OAuth2/OIDC Authorization Parameters:**

| Parameter | Description | Example |
|-----------|-------------|---------|
| `response_type` | OAuth2 response type | `code` |
| `client_id` | Client identifier | `s6BhdRkqt3` |
| `redirect_uri` | Callback URL | `https://client.example.com/cb` |
| `scope` | Requested scopes | `openid profile email` |
| `state` | CSRF protection | `af0ifjsldkj` |
| `code_challenge` | PKCE challenge | `E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM` |
| `code_challenge_method` | PKCE method | `S256` |
| `nonce` | OIDC replay protection | `n-0S6_WzA2Mj` |
| `login_hint` | User identifier hint | `user@example.com` |
| `acr_values` | Authentication context | `urn:mace:incommon:iap:silver` |
| `claims` | OIDC claims request | JSON object |
| `max_age` | Max authentication age | `3600` |
| `prompt` | User interaction | `login`, `consent`, `none` |

**IMPORTANT:** Do NOT include `request_uri` parameter in PAR request. The `request_uri` is the RESPONSE from PAR, not a parameter in the request.

### Complete PAR Request Example

**HTTP Request:**

```http
POST /par HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW

response_type=code
&client_id=s6BhdRkqt3
&redirect_uri=https%3A%2F%2Fclient.example.com%2Fcb
&scope=openid%20profile%20email
&state=af0ifjsldkj
&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
&code_challenge_method=S256
&nonce=n-0S6_WzA2Mj
&login_hint=user%40example.com
```

**Decoded Parameters:**

```
response_type: code
client_id: s6BhdRkqt3
redirect_uri: https://client.example.com/cb
scope: openid profile email
state: af0ifjsldkj
code_challenge: E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
code_challenge_method: S256
nonce: n-0S6_WzA2Mj
login_hint: user@example.com
```

### Client Implementation

```python
import requests
import base64
from urllib.parse import urlencode

def push_authorization_request(
    par_endpoint,
    client_id,
    client_secret,
    redirect_uri,
    scope,
    state,
    code_challenge,
    code_challenge_method='S256',
    **extra_params
):
    """
    Push authorization request to PAR endpoint
    
    RFC 9126 §2.1: Pushed Authorization Request
    
    Args:
        par_endpoint: PAR endpoint URL
        client_id: OAuth2 client ID
        client_secret: OAuth2 client secret
        redirect_uri: Callback URL
        scope: Space-separated scopes
        state: CSRF token
        code_challenge: PKCE challenge
        code_challenge_method: PKCE method (S256 or plain)
        **extra_params: Additional parameters (nonce, login_hint, etc.)
    
    Returns:
        dict: PAR response with request_uri and expires_in
    """
    # Build authorization request parameters
    params = {
        'response_type': 'code',
        'client_id': client_id,
        'redirect_uri': redirect_uri,
        'scope': scope,
        'state': state,
        'code_challenge': code_challenge,
        'code_challenge_method': code_challenge_method,
        **extra_params  # nonce, login_hint, claims, etc.
    }
    
    # Create HTTP Basic authentication header
    credentials = f"{client_id}:{client_secret}"
    encoded_credentials = base64.b64encode(credentials.encode()).decode()
    
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': f'Basic {encoded_credentials}'
    }
    
    # Make PAR request
    response = requests.post(
        par_endpoint,
        data=params,  # application/x-www-form-urlencoded
        headers=headers,
        timeout=10
    )
    
    # Handle response
    if response.status_code == 201:
        # Success - return request_uri and expires_in
        return response.json()
    else:
        # Error
        error_data = response.json()
        raise PARError(
            error=error_data.get('error'),
            error_description=error_data.get('error_description')
        )

# Usage
try:
    par_response = push_authorization_request(
        par_endpoint='https://auth.example.com/par',
        client_id='my_client_id',
        client_secret='my_client_secret',
        redirect_uri='https://myapp.example.com/callback',
        scope='openid profile email',
        state='abc123',
        code_challenge='E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
        code_challenge_method='S256',
        nonce='n-0S6_WzA2Mj',
        login_hint='user@example.com'
    )
    
    request_uri = par_response['request_uri']
    expires_in = par_response['expires_in']
    
    print(f"request_uri: {request_uri}")
    print(f"Expires in: {expires_in} seconds")
    
except PARError as e:
    print(f"PAR failed: {e.error} - {e.error_description}")
```

### Client Authentication Methods

**1. HTTP Basic Authentication (`client_secret_basic`):**

```http
POST /par HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW

response_type=code&client_id=s6BhdRkqt3&...
```

**2. POST Body (`client_secret_post`):**

```http
POST /par HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

response_type=code
&client_id=s6BhdRkqt3
&client_secret=gX1fBat3bV
&...
```

**3. Private Key JWT (`private_key_jwt`):**

```http
POST /par HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

response_type=code
&client_id=s6BhdRkqt3
&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
&client_assertion=eyJhbGciOiJSUzI1NiIsImtpZCI6IjIyIn0.eyJpc3Mi...
&...
```

**4. Public Client (No Authentication):**

```http
POST /par HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

response_type=code
&client_id=public_client_id
&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
&code_challenge_method=S256
&...
```

**Note:** Public clients MUST use PKCE.

### PAR with Complex Claims

**Large OIDC Claims Request:**

```python
# Complex claims request
claims = {
    "id_token": {
        "email": {"essential": True},
        "email_verified": {"essential": True},
        "name": {"essential": True},
        "given_name": {"essential": True},
        "family_name": {"essential": True},
        "phone_number": {"essential": True},
        "phone_number_verified": {"essential": True},
        "address": {"essential": True}
    },
    "userinfo": {
        "birthdate": {"essential": True},
        "gender": {"essential": False},
        "locale": {"essential": False},
        "picture": {"essential": False}
    }
}

# Push to PAR (no URL length concerns)
par_response = push_authorization_request(
    par_endpoint='https://auth.example.com/par',
    client_id='my_client',
    client_secret='my_secret',
    redirect_uri='https://myapp.example.com/callback',
    scope='openid profile email phone address',
    state='xyz789',
    code_challenge='...',
    claims=json.dumps(claims)  # Large JSON, no problem in POST body
)
```

---

## PAR Response

**Specification:** RFC 9126 §2.2 - Successful Response

### Success Response

**HTTP Status:** 201 Created (RFC 2119: REQUIRED)

**Content-Type:** `application/json` (RFC 2119: REQUIRED)

**Response Fields:**

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `request_uri` | String | Opaque reference to pushed request | REQUIRED |
| `expires_in` | Integer | Lifetime in seconds | REQUIRED |

### Success Response Example

**HTTP Response:**

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store

{
  "request_uri": "urn:ietf:params:oauth:request_uri:bwc4JK-ESC0w8acc191e-Y1LTC2",
  "expires_in": 90
}
```

### request_uri Format

**Specification:** RFC 9126 §2.2.1 - Request URI

**Format:** URN using the `urn:ietf:params:oauth:request_uri` namespace

**Structure:**
```
urn:ietf:params:oauth:request_uri:<unique-identifier>
```

**Requirements (RFC 9126 §2.2.1):**

1. **Opaque to Client:** Client treats as opaque string, no semantic meaning
2. **High Entropy:** Sufficient entropy to prevent guessing (RFC 2119: REQUIRED)
3. **Unique:** Each PAR request generates new `request_uri`
4. **Single-Use:** RECOMMENDED (RFC 2119: RECOMMENDED)

**Examples:**

```
urn:ietf:params:oauth:request_uri:bwc4JK-ESC0w8acc191e-Y1LTC2
urn:ietf:params:oauth:request_uri:6esc_11ACC5bwc014ltc14eY
urn:ietf:params:oauth:request_uri:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Generation Algorithm:**

```python
import secrets
import hashlib

def generate_request_uri():
    """
    Generate cryptographically secure request_uri
    
    RFC 9126 §2.2.1: High entropy required
    """
    # Generate 32 random bytes (256 bits of entropy)
    random_bytes = secrets.token_bytes(32)
    
    # Convert to URL-safe base64 (43 characters)
    identifier = secrets.token_urlsafe(32)
    
    # Construct URN
    request_uri = f"urn:ietf:params:oauth:request_uri:{identifier}"
    
    return request_uri

# Examples
print(generate_request_uri())
# urn:ietf:params:oauth:request_uri:Xk9vM2pPQmRKWnZ4bXJGcEhTR3RZV1VJYmNlZg

print(generate_request_uri())
# urn:ietf:params:oauth:request_uri:bDRyT3ZBa1JmU2hoNmJMQ0NQRzJreFdsUVNucA
```

**Security Note:** The identifier MUST have sufficient entropy to be unguessable. Use cryptographically secure random number generators.

### expires_in Field

**Type:** Integer (seconds)

**Purpose:** Indicates how long the `request_uri` is valid.

**Typical Values:**
- **10 seconds:** Very high security, tight timeframe
- **30 seconds:** Balanced (FAPI common)
- **60 seconds:** User-friendly, still secure
- **90 seconds:** Maximum recommended (accommodates slow users)
- **120+ seconds:** Not recommended (increases exposure window)

**Trade-offs:**

| Lifetime | Security | User Experience | Use Case |
|----------|----------|-----------------|----------|
| 10-30s | Highest | May timeout for slow users | FAPI, highest security |
| 30-60s | High | Good balance | Enterprise applications |
| 60-90s | Good | Very user-friendly | Consumer applications |
| 90-120s | Moderate | Best UX | Low-security applications |
| 120+s | Low | Excellent UX | Not recommended |

**Client Handling:**

```python
def handle_par_response(par_response):
    """Handle PAR response with expiration awareness"""
    request_uri = par_response['request_uri']
    expires_in = par_response['expires_in']
    
    # Calculate absolute expiration time
    expiration_time = datetime.now() + timedelta(seconds=expires_in)
    
    logger.info(f"request_uri expires at {expiration_time}")
    logger.info(f"Have {expires_in} seconds to complete authorization")
    
    # Warn if very short lifetime
    if expires_in < 30:
        logger.warning(f"Short request_uri lifetime: {expires_in}s")
    
    # Must initiate authorization before expiration
    if datetime.now() >= expiration_time:
        raise RequestURIExpiredError("request_uri expired before use")
    
    return request_uri, expiration_time
```

### Error Response

**HTTP Status:** 400 Bad Request (standard OAuth2 errors)

**Content-Type:** `application/json`

**Error Response Fields:**

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `error` | String | OAuth2 error code | REQUIRED |
| `error_description` | String | Human-readable description | OPTIONAL |
| `error_uri` | String | URL for error documentation | OPTIONAL |

**Common Error Codes:**

| Error Code | Description | Cause |
|------------|-------------|-------|
| `invalid_request` | Malformed request | Missing/invalid parameters |
| `invalid_client` | Client authentication failed | Bad credentials |
| `unauthorized_client` | Client not authorized for PAR | Client not registered for PAR |
| `invalid_redirect_uri` | redirect_uri invalid | Not registered for client |
| `invalid_scope` | Scope invalid | Unknown or unauthorized scope |
| `unsupported_response_type` | response_type not supported | Invalid response_type |

**Error Response Example:**

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json
Cache-Control: no-store

{
  "error": "invalid_request",
  "error_description": "Missing required parameter: redirect_uri"
}
```

**Client Error Handling:**

```python
def push_authorization_request_with_error_handling(par_endpoint, params):
    """Push authorization request with comprehensive error handling"""
    try:
        response = requests.post(par_endpoint, data=params, timeout=10)
        
        if response.status_code == 201:
            # Success
            return response.json()
        
        elif response.status_code == 400:
            # OAuth2 error
            error_data = response.json()
            error = error_data.get('error')
            description = error_data.get('error_description', 'No description')
            
            logger.error(f"PAR error: {error} - {description}")
            
            # Handle specific errors
            if error == 'invalid_client':
                raise AuthenticationError("Client authentication failed")
            elif error == 'invalid_redirect_uri':
                raise ConfigurationError("redirect_uri not registered")
            elif error == 'invalid_scope':
                raise ConfigurationError(f"Invalid scope: {description}")
            else:
                raise PARError(f"{error}: {description}")
        
        elif response.status_code == 401:
            raise AuthenticationError("Client authentication required")
        
        else:
            raise PARError(f"Unexpected status: {response.status_code}")
    
    except requests.exceptions.Timeout:
        raise PARError("PAR endpoint timeout")
    except requests.exceptions.ConnectionError:
        raise PARError("Cannot connect to PAR endpoint")
```

---

## Authorization Request with request_uri

**Specification:** RFC 9126 §2.3 - Using the Request URI

### Authorization Request Format

After receiving `request_uri` from PAR endpoint, client initiates authorization request with minimal parameters.

**Required Parameters:**
- `client_id`: OAuth2 client identifier (RFC 2119: REQUIRED)
- `request_uri`: Value from PAR response (RFC 2119: REQUIRED)

**Prohibited Parameters:**
- All other authorization parameters (they're in the pushed request)
- Specifically: Do NOT include scope, redirect_uri, state, etc.

**HTTP Method:** GET (standard OAuth2 authorization request)

### Complete Example

**Authorization Request:**

```http
GET /authorize?client_id=s6BhdRkqt3&request_uri=urn:ietf:params:oauth:request_uri:bwc4JK-ESC0w8acc191e-Y1LTC2 HTTP/1.1
Host: auth.example.com
```

**URL:**
```
https://auth.example.com/authorize?client_id=s6BhdRkqt3&request_uri=urn:ietf:params:oauth:request_uri:bwc4JK-ESC0w8acc191e-Y1LTC2
```

**Comparison with Traditional Authorization Request:**

```
Traditional (Without PAR):
https://auth.example.com/authorize
  ?response_type=code
  &client_id=s6BhdRkqt3
  &redirect_uri=https://client.example.com/cb
  &scope=openid%20profile%20email
  &state=af0ifjsldkj
  &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  &code_challenge_method=S256
  &nonce=n-0S6_WzA2Mj
  &login_hint=user@example.com
  
Length: ~300+ characters
Visible: All parameters

With PAR:
https://auth.example.com/authorize
  ?client_id=s6BhdRkqt3
  &request_uri=urn:ietf:params:oauth:request_uri:bwc4JK-ESC0w8acc191e-Y1LTC2

Length: ~150 characters
Visible: Only client_id and request_uri
```

### Client Implementation

```python
def build_authorization_url_with_par(
    authorization_endpoint,
    client_id,
    request_uri
):
    """
    Build authorization URL using request_uri from PAR
    
    RFC 9126 §2.3: Authorization request with request_uri
    
    Args:
        authorization_endpoint: Authorization endpoint URL
        client_id: OAuth2 client ID
        request_uri: request_uri from PAR response
    
    Returns:
        Complete authorization URL
    """
    from urllib.parse import urlencode
    
    # Minimal parameters (RFC 9126: only client_id and request_uri)
    params = {
        'client_id': client_id,
        'request_uri': request_uri
    }
    
    # Build URL
    query_string = urlencode(params)
    authorization_url = f"{authorization_endpoint}?{query_string}"
    
    return authorization_url

# Complete PAR + Authorization flow
def initiate_authorization_with_par(
    par_endpoint,
    authorization_endpoint,
    client_id,
    client_secret,
    redirect_uri,
    scope,
    state,
    code_challenge
):
    """Complete PAR flow: push request, then redirect user"""
    
    # Step 1: Push authorization request
    par_response = push_authorization_request(
        par_endpoint=par_endpoint,
        client_id=client_id,
        client_secret=client_secret,
        redirect_uri=redirect_uri,
        scope=scope,
        state=state,
        code_challenge=code_challenge
    )
    
    request_uri = par_response['request_uri']
    expires_in = par_response['expires_in']
    
    logger.info(f"PAR successful, request_uri: {request_uri}")
    logger.info(f"Expires in: {expires_in} seconds")
    
    # Step 2: Build authorization URL
    authorization_url = build_authorization_url_with_par(
        authorization_endpoint=authorization_endpoint,
        client_id=client_id,
        request_uri=request_uri
    )
    
    logger.info(f"Authorization URL: {authorization_url}")
    
    # Step 3: Redirect user (in web app context)
    return authorization_url
```

### Authorization Server Processing

**Specification:** RFC 9126 §3 - Server Responsibilities

**Algorithm:**

```python
def process_authorization_request_with_request_uri(request):
    """
    Authorization server processes authorization request with request_uri
    
    RFC 9126 §3: Authorization server responsibilities
    """
    # Step 1: Extract parameters
    client_id = request.args.get('client_id')
    request_uri = request.args.get('request_uri')
    
    # Step 2: Validate required parameters
    if not client_id or not request_uri:
        return oauth2_error('invalid_request', 'Missing client_id or request_uri')
    
    # Step 3: Retrieve stored authorization request
    stored_request = get_stored_request(request_uri)
    
    if not stored_request:
        return oauth2_error('invalid_request_uri', 'request_uri not found or expired')
    
    # Step 4: Validate request_uri not expired
    if is_expired(stored_request):
        delete_stored_request(request_uri)  # Clean up
        return oauth2_error('invalid_request_uri', 'request_uri expired')
    
    # Step 5: Validate client_id matches
    if stored_request['client_id'] != client_id:
        logger.security_alert(
            f"client_id mismatch: request has {client_id}, "
            f"stored request has {stored_request['client_id']}"
        )
        return oauth2_error('invalid_request', 'client_id mismatch')
    
    # Step 6: Invalidate request_uri (single-use enforcement)
    delete_stored_request(request_uri)
    
    # Step 7: Proceed with authorization flow using stored parameters
    return process_authorization_request(stored_request)

def get_stored_request(request_uri):
    """Retrieve stored authorization request by request_uri"""
    # In-memory cache (production: use Redis)
    return request_cache.get(request_uri)

def is_expired(stored_request):
    """Check if stored request expired"""
    expiration_time = stored_request['expires_at']
    return datetime.now() >= expiration_time

def delete_stored_request(request_uri):
    """Invalidate request_uri (single-use)"""
    request_cache.delete(request_uri)
    logger.info(f"Invalidated request_uri: {request_uri}")
```

### Error Handling

**Invalid request_uri:**

```http
HTTP/1.1 302 Found
Location: https://client.example.com/cb?error=invalid_request_uri&error_description=request_uri+not+found+or+expired&state=af0ifjsldkj
```

**Expired request_uri:**

```http
HTTP/1.1 302 Found
Location: https://client.example.com/cb?error=invalid_request_uri&error_description=request_uri+expired&state=af0ifjsldkj
```

**Client mismatch:**

```http
HTTP/1.1 302 Found
Location: https://client.example.com/cb?error=invalid_request&error_description=client_id+mismatch&state=af0ifjsldkj
```

---

## PAR Security Benefits

**Specification:** RFC 9126 §7 - Security Considerations

### 1. Parameter Confidentiality

**Problem Solved:** Authorization parameters visible in URLs.

**PAR Solution:**
- All parameters sent via backchannel POST (server-to-server)
- Never appear in browser URL, history, or logs
- User never sees sensitive parameters

**Protected Information:**

```python
# These sensitive parameters are NOT visible to user with PAR:
sensitive_params = {
    'login_hint': 'victim@company.com',  # User identity
    'claims': json.dumps({...}),         # Requested user data
    'acr_values': 'high-security',       # Security requirements
    'max_age': '0',                      # Force re-authentication
    'scope': 'read:salary write:records' # Specific permissions
}

# With PAR: All parameters only in backchannel POST
# User only sees: ?client_id=...&request_uri=urn:...
```

**Attack Prevention:**
- Browser history doesn't leak parameters
- Server access logs don't expose sensitive data
- Referrer headers don't leak parameters
- Browser extensions can't harvest parameters

### 2. Parameter Integrity

**Problem Solved:** Frontchannel parameters can be modified.

**PAR Solution:**
- Parameters pushed via authenticated backchannel
- Authorization server validates before storing
- Stored parameters cannot be modified
- Authorization request cannot override pushed parameters

**Integrity Protection Flow:**

```
1. Client authenticates to PAR endpoint
   → Authorization server knows who is pushing

2. Authorization server validates parameters
   → Invalid parameters rejected immediately

3. Parameters stored with request_uri
   → Immutable association

4. Authorization request only contains request_uri
   → Cannot modify stored parameters

5. Authorization server retrieves stored parameters
   → Guaranteed integrity
```

**Attack Scenario (Without PAR):**

```
Attacker intercepts authorization URL and modifies:

Original:
https://auth.example.com/authorize?...&redirect_uri=https://legitimate.com/cb

Modified by attacker:
https://auth.example.com/authorize?...&redirect_uri=https://evil.com/steal

User approves → Authorization code sent to evil.com
```

**PAR Defense:**

```
Parameters stored on authorization server after validation.
Frontchannel URL only contains request_uri.
Attacker cannot modify redirect_uri or any other parameter.
```

### 3. Phishing Protection

**Problem Solved:** Attackers can craft convincing malicious URLs.

**Traditional Phishing Attack:**

```
Legitimate Authorization URL:
https://auth.bank.example.com/authorize
  ?response_type=code
  &client_id=banking_app
  &redirect_uri=https://banking-app.example.com/callback
  &scope=accounts%20transactions
  &state=abc123

Phishing URL (attacker creates):
https://auth.bank.example.com/authorize
  ?response_type=code
  &client_id=banking_app
  &redirect_uri=https://evil-steal-codes.com/phish  ← Changed!
  &scope=accounts%20transactions%20admin            ← Escalated!
  &state=xyz789

User perspective:
- Domain looks correct (auth.bank.example.com)
- URL is complex and intimidating
- User clicks "Authorize"
- Authorization code sent to attacker
```

**PAR Phishing Defense:**

```
Legitimate PAR URL:
https://auth.bank.example.com/authorize
  ?client_id=banking_app
  &request_uri=urn:ietf:params:oauth:request_uri:6esc_11ACC5

Attacker's attempt:
https://auth.bank.example.com/authorize
  ?client_id=banking_app
  &request_uri=urn:ietf:params:oauth:request_uri:FAKE123  ← Invalid!

Attack fails because:
1. Attacker cannot generate valid request_uri (needs client authentication)
2. request_uri is opaque (can't guess valid values)
3. Even if attacker steals old request_uri, single-use prevents reuse
4. Short expiration limits usefulness of stolen request_uri
```

**Why PAR Makes Phishing Harder:**

| Aspect | Traditional | PAR |
|--------|-------------|-----|
| **URL Complexity** | Many parameters visible | Only 2 parameters (client_id, request_uri) |
| **Parameter Modification** | Attacker can modify in URL | Stored securely, cannot modify |
| **Valid URL Generation** | Attacker can craft | Attacker cannot generate valid request_uri |
| **URL Stealing** | Stolen URL works until used | request_uri single-use, short expiration |
| **User Scrutiny** | Too complex to verify | Simpler, tampering more obvious |

### 4. Request Size Support

**Problem Solved:** URL length limitations.

**Browser/Server URL Limits:**
```
IE/Edge (legacy): 2,083 characters
Chrome: 32,779 characters
Many servers: 8,192 characters default
CDNs/proxies: Often 2,000-4,000 character limits
```

**Complex Authorization Request:**

```json
{
  "response_type": "code",
  "client_id": "my_client",
  "redirect_uri": "https://myapp.example.com/callback",
  "scope": "openid profile email address phone offline_access api:read api:write api:admin",
  "claims": {
    "id_token": {
      "email": {"essential": true},
      "email_verified": {"essential": true},
      "name": {"essential": true},
      "given_name": {"essential": true},
      "family_name": {"essential": true},
      "middle_name": {"essential": false},
      "nickname": {"essential": false},
      "preferred_username": {"essential": false},
      "profile": {"essential": false},
      "picture": {"essential": false},
      "website": {"essential": false},
      "gender": {"essential": false},
      "birthdate": {"essential": false},
      "zoneinfo": {"essential": false},
      "locale": {"essential": false},
      "phone_number": {"essential": true},
      "phone_number_verified": {"essential": true},
      "address": {
        "essential": true,
        "value": {
          "street_address": null,
          "locality": null,
          "region": null,
          "postal_code": null,
          "country": null
        }
      }
    },
    "userinfo": {
      "custom_claim_1": {"essential": true},
      "custom_claim_2": {"essential": false},
      "custom_claim_3": {"essential": false}
    }
  },
  "acr_values": "urn:mace:incommon:iap:silver urn:mace:incommon:iap:bronze",
  "max_age": 3600,
  "login_hint": "user@example.com"
}

// URL-encoded length: ~2,500+ characters
// Exceeds many limits!
```

**PAR Solution:**
- Send entire request via POST body (no URL length limit)
- Receive short request_uri
- Authorization URL remains short

```python
# Complex request? No problem with PAR
large_claims = json.dumps({...extensive claims object...})

par_response = push_authorization_request(
    par_endpoint='https://auth.example.com/par',
    client_id='my_client',
    client_secret='my_secret',
    redirect_uri='https://myapp.example.com/callback',
    scope='openid profile email address phone offline_access ' + 
          'api:read api:write api:admin',
    state='abc123',
    code_challenge='...',
    claims=large_claims  # Thousands of characters, no problem!
)

# Authorization URL remains short
authorization_url = (
    f"https://auth.example.com/authorize"
    f"?client_id=my_client"
    f"&request_uri={par_response['request_uri']}"
)
# Always short, regardless of parameter complexity
```

### 5. Comprehensive Security Summary

**Attack Vectors Mitigated:**

| Attack | Without PAR | With PAR | Mitigation |
|--------|-------------|----------|------------|
| **Parameter Harvesting** | High risk | Low risk | Parameters not in URL |
| **Phishing** | Easy | Hard | Cannot generate valid request_uri |
| **MITM Parameter Modification** | Possible | Prevented | Parameters in authenticated backchannel |
| **Browser History Leakage** | Leaks all parameters | Leaks nothing sensitive | Only request_uri visible |
| **Log File Exposure** | Parameters in logs | Only request_uri in logs | No sensitive data |
| **Referrer Header Leakage** | Full parameters | Only request_uri | No sensitive data |
| **URL Length Attacks** | Possible (truncation) | Prevented | No URL length dependency |

---

## Client Authentication in PAR

**Specification:** RFC 9126 §2.1 - Client Authentication

### Authentication Requirements

**Confidential Clients:** MUST authenticate (RFC 2119: REQUIRED)

**Public Clients:** SHOULD authenticate if possible (RFC 2119: RECOMMENDED)

**Rationale:**
- Binds pushed request to authenticated client
- Prevents unauthorized request_uri generation
- Authorization server validates client identity before storing request
- Enables client-specific validation and policies

### Authentication Methods

#### 1. Client Secret Basic (HTTP Basic Auth)

```python
import base64
import requests

def push_with_basic_auth(par_endpoint, client_id, client_secret, params):
    """Push authorization request with HTTP Basic authentication"""
    # Create credentials string
    credentials = f"{client_id}:{client_secret}"
    
    # Base64 encode
    encoded = base64.b64encode(credentials.encode()).decode()
    
    # Add to headers
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': f'Basic {encoded}'
    }
    
    # Add client_id to params (RFC 9126 requires it)
    params['client_id'] = client_id
    
    response = requests.post(par_endpoint, data=params, headers=headers)
    return response.json()
```

**HTTP Request:**
```http
POST /par HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW

response_type=code&client_id=s6BhdRkqt3&redirect_uri=...
```

#### 2. Client Secret Post (POST Body)

```python
def push_with_post_auth(par_endpoint, client_id, client_secret, params):
    """Push authorization request with POST body authentication"""
    # Add client credentials to parameters
    params['client_id'] = client_id
    params['client_secret'] = client_secret
    
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    response = requests.post(par_endpoint, data=params, headers=headers)
    return response.json()
```

**HTTP Request:**
```http
POST /par HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

response_type=code&client_id=s6BhdRkqt3&client_secret=gX1fBat3bV&redirect_uri=...
```

#### 3. Private Key JWT (Asymmetric)

```python
import jwt
import time
import uuid

def create_client_assertion(client_id, token_endpoint, private_key):
    """
    Create JWT client assertion for authentication
    
    RFC 7523: JWT client authentication
    """
    now = int(time.time())
    
    claims = {
        'iss': client_id,           # Issuer: client_id
        'sub': client_id,           # Subject: client_id
        'aud': token_endpoint,      # Audience: token endpoint
        'jti': str(uuid.uuid4()),   # Unique ID
        'exp': now + 300,           # Expires in 5 minutes
        'iat': now                  # Issued at
    }
    
    # Sign with client's private key
    assertion = jwt.encode(claims, private_key, algorithm='RS256')
    
    return assertion

def push_with_private_key_jwt(par_endpoint, client_id, private_key, params):
    """Push authorization request with private_key_jwt authentication"""
    # Create client assertion
    assertion = create_client_assertion(client_id, par_endpoint, private_key)
    
    # Add authentication parameters
    params['client_id'] = client_id
    params['client_assertion_type'] = 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer'
    params['client_assertion'] = assertion
    
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    response = requests.post(par_endpoint, data=params, headers=headers)
    return response.json()
```

**HTTP Request:**
```http
POST /par HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

response_type=code
&client_id=s6BhdRkqt3
&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
&client_assertion=eyJhbGciOiJSUzI1NiIsImtpZCI6IjIyIn0.eyJpc3MiOiJzNkJoZFJrcXQzIiwic3ViIjoiczZCaGRSa3F0MyIsImF1ZCI6Imh0dHBzOi8vYXV0aC5leGFtcGxlLmNvbS9wYXIiLCJqdGkiOiJhYmNkZWYxMjM0NTYiLCJleHAiOjE2Mzg0NTY0MDAsImlhdCI6MTYzODQ1NjEwMH0.signature
&redirect_uri=...
```

#### 4. Public Client (No Authentication)

```python
def push_without_authentication(par_endpoint, client_id, params):
    """
    Push authorization request without authentication (public client)
    
    Note: PKCE REQUIRED for public clients
    """
    # Add client_id
    params['client_id'] = client_id
    
    # MUST include PKCE for public clients
    if 'code_challenge' not in params:
        raise ValueError("PKCE required for public clients")
    
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    response = requests.post(par_endpoint, data=params, headers=headers)
    return response.json()
```

**HTTP Request:**
```http
POST /par HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

response_type=code
&client_id=public_client_id
&redirect_uri=https://app.example.com/callback
&scope=openid profile
&state=abc123
&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
&code_challenge_method=S256
```

**Note:** Public clients MUST use PKCE (RFC 2119: REQUIRED).

### Why Authenticate at PAR?

**Benefits of Client Authentication:**

1. **Bind Request to Client:**
   - Authorization server knows which client pushed request
   - Can enforce client-specific policies
   - Prevents unauthorized request_uri generation

2. **Prevent Abuse:**
   - Unauthenticated endpoint could be abused
   - Attacker cannot generate request_uri for other clients
   - Rate limiting per authenticated client

3. **Parameter Validation:**
   - Validate redirect_uri against registered URIs for client
   - Validate scopes against client's allowed scopes
   - Validate other client-specific constraints

4. **Audit Trail:**
   - Log which client pushed which request
   - Security monitoring and forensics
   - Detect suspicious patterns

**Authorization Server Validation:**

```python
def validate_par_request(request, authenticated_client_id):
    """Validate PAR request from authenticated client"""
    # Extract parameters
    client_id = request.form.get('client_id')
    redirect_uri = request.form.get('redirect_uri')
    scope = request.form.get('scope')
    
    # Validate client_id matches authenticated client
    if client_id != authenticated_client_id:
        return error_response('invalid_request', 'client_id mismatch')
    
    # Get client configuration
    client_config = get_client_config(authenticated_client_id)
    
    # Validate redirect_uri registered for this client
    if redirect_uri not in client_config.registered_redirect_uris:
        return error_response('invalid_redirect_uri', 'redirect_uri not registered')
    
    # Validate scopes allowed for this client
    requested_scopes = set(scope.split())
    allowed_scopes = set(client_config.allowed_scopes)
    
    if not requested_scopes.issubset(allowed_scopes):
        unauthorized = requested_scopes - allowed_scopes
        return error_response('invalid_scope', f'Unauthorized scopes: {unauthorized}')
    
    # All validations passed
    return None  # No error
```

---

## request_uri Lifecycle

### Generation

**Specification:** RFC 9126 §2.2.1 - Request URI

**Generation Requirements:**

1. **Opaque to Client:** No semantic meaning, treat as string
2. **High Entropy:** Cryptographically random, unpredictable
3. **Unique:** Each PAR request generates new request_uri
4. **URN Format:** Use `urn:ietf:params:oauth:request_uri:` namespace

**Implementation:**

```python
import secrets
import hashlib
import time
from datetime import datetime, timedelta

class RequestURIManager:
    """Manage request_uri lifecycle"""
    
    def __init__(self, storage, default_ttl=90):
        self.storage = storage  # Redis, in-memory, database
        self.default_ttl = default_ttl
    
    def generate_request_uri(self, authorization_params, client_id, ttl=None):
        """
        Generate request_uri and store authorization request
        
        RFC 9126 §2.2.1: High entropy, opaque identifier
        
        Returns:
            (request_uri, expires_in)
        """
        # Generate cryptographically secure random identifier
        # 32 bytes = 256 bits of entropy
        identifier = secrets.token_urlsafe(32)
        
        # Construct URN
        request_uri = f"urn:ietf:params:oauth:request_uri:{identifier}"
        
        # Calculate expiration
        ttl = ttl or self.default_ttl
        expires_at = datetime.now() + timedelta(seconds=ttl)
        
        # Store authorization request
        stored_data = {
            'params': authorization_params,
            'client_id': client_id,
            'created_at': datetime.now().isoformat(),
            'expires_at': expires_at.isoformat(),
            'used': False  # For single-use enforcement
        }
        
        self.storage.set(request_uri, stored_data, ex=ttl)
        
        logger.info(f"Generated request_uri: {request_uri}")
        logger.info(f"Expires in: {ttl} seconds")
        
        return request_uri, ttl
    
    def retrieve_request(self, request_uri):
        """
        Retrieve stored authorization request
        
        Returns:
            Stored authorization params or None if not found/expired
        """
        stored_data = self.storage.get(request_uri)
        
        if not stored_data:
            logger.warning(f"request_uri not found: {request_uri}")
            return None
        
        # Check if already used (single-use enforcement)
        if stored_data.get('used'):
            logger.security_alert(f"request_uri reuse attempted: {request_uri}")
            return None
        
        return stored_data
    
    def invalidate_request_uri(self, request_uri):
        """
        Invalidate request_uri (single-use enforcement)
        
        RFC 9126 §4: Single-use recommended
        """
        stored_data = self.storage.get(request_uri)
        
        if stored_data:
            # Mark as used
            stored_data['used'] = True
            stored_data['used_at'] = datetime.now().isoformat()
            
            # Update in storage (keep until expiration for audit)
            self.storage.set(request_uri, stored_data)
            
            logger.info(f"Invalidated request_uri: {request_uri}")
        
        # Alternative: Delete immediately
        # self.storage.delete(request_uri)
```

### Storage

**Storage Requirements:**

1. **Short-Term Storage:** Only need to store for `expires_in` seconds
2. **Fast Retrieval:** Authorization request accesses storage
3. **Atomic Operations:** For single-use enforcement
4. **Secure:** Protect stored authorization parameters

**Storage Options:**

| Storage | Pros | Cons | Use Case |
|---------|------|------|----------|
| **Redis** | Fast, distributed, TTL support | External dependency | Production (recommended) |
| **In-Memory** | Very fast, simple | Not distributed, lost on restart | Development, single-server |
| **Database** | Persistent, familiar | Slower, need cleanup job | Long-term audit trail |
| **File System** | Simple, no dependencies | Slow, not scalable | Not recommended |

**Redis Implementation:**

```python
import redis
import json

class RedisRequestURIStorage:
    """Redis-backed request_uri storage"""
    
    def __init__(self, redis_url='redis://localhost:6379/0'):
        self.redis = redis.from_url(redis_url)
    
    def set(self, request_uri, data, ex):
        """Store with expiration"""
        self.redis.setex(
            request_uri,
            ex,  # TTL in seconds
            json.dumps(data)
        )
    
    def get(self, request_uri):
        """Retrieve stored data"""
        data = self.redis.get(request_uri)
        return json.loads(data) if data else None
    
    def delete(self, request_uri):
        """Delete stored data"""
        self.redis.delete(request_uri)
```

### Expiration

**Typical Lifetimes:**

```python
# Security vs UX trade-off
EXPIRATION_PROFILES = {
    'maximum_security': 10,    # 10 seconds (FAPI high-security)
    'high_security': 30,       # 30 seconds (FAPI standard)
    'balanced': 60,            # 60 seconds (good balance)
    'user_friendly': 90,       # 90 seconds (accommodates slow users)
    'lenient': 120             # 120 seconds (not recommended)
}

# Choose based on use case
expires_in = EXPIRATION_PROFILES['balanced']  # 60 seconds
```

**Expiration Handling:**

```python
def handle_expired_request_uri(request_uri):
    """Handle expired request_uri scenario"""
    logger.info(f"request_uri expired: {request_uri}")
    
    # Clean up expired entry
    storage.delete(request_uri)
    
    # Return error to client
    return oauth2_error(
        error='invalid_request_uri',
        error_description='request_uri expired or not found',
        state=extract_state_from_request()
    )
```

**Client Handling:**

```python
def handle_authorization_with_expiration(par_response):
    """Client handles request_uri expiration"""
    request_uri = par_response['request_uri']
    expires_in = par_response['expires_in']
    
    # Warn if very short
    if expires_in < 30:
        logger.warning(f"Short request_uri lifetime: {expires_in}s")
    
    # Must redirect user before expiration
    # If expired, need to re-push
    try:
        # Redirect user to authorization endpoint
        redirect_user(authorization_url)
    except RequestURIExpiredError:
        logger.info("request_uri expired, re-pushing request")
        # Re-push to get new request_uri
        new_par_response = push_authorization_request(...)
        redirect_user(build_authorization_url(new_par_response['request_uri']))
```

### Single-Use Enforcement

**Specification:** RFC 9126 §4 - Security Considerations (RECOMMENDED)

**Why Single-Use:**
- Prevents request_uri replay attacks
- Limits exposure window
- Provides clear audit trail

**Implementation:**

```python
def enforce_single_use(request_uri):
    """
    Enforce single-use for request_uri
    
    RFC 9126 §4: Single-use recommended
    """
    # Retrieve stored request
    stored_data = storage.get(request_uri)
    
    if not stored_data:
        return None  # Not found or expired
    
    # Check if already used
    if stored_data.get('used'):
        logger.security_alert(
            f"request_uri reuse detected: {request_uri}",
            details={
                'first_use': stored_data.get('used_at'),
                'second_use': datetime.now().isoformat()
            }
        )
        return None  # Reject reuse
    
    # Mark as used
    stored_data['used'] = True
    stored_data['used_at'] = datetime.now().isoformat()
    
    # Update storage
    storage.set(request_uri, stored_data, ex=60)  # Keep for audit
    
    return stored_data['params']
```

**Client Impact:**

```
If user clicks "back" button after authorization:
- Without single-use: Authorization might proceed again
- With single-use: Error returned (request_uri already used)

Client must handle gracefully:
- Detect error
- Re-push authorization request
- Get new request_uri
- Redirect user again
```

---

## Parameter Validation and Binding

### PAR Endpoint Validation

**Specification:** RFC 9126 §2.1 - Authorization server validates at PAR endpoint

**Validation Benefits:**
- **Fail Fast:** Errors detected before user interaction
- **Better UX:** User not shown authorization page for invalid request
- **Security:** Invalid requests rejected early
- **Resource Efficiency:** Don't store invalid requests

**Complete Validation:**

```python
def validate_par_request_comprehensive(request, client):
    """
    Comprehensive PAR request validation
    
    RFC 9126: Validate all parameters at PAR endpoint
    """
    errors = []
    
    # 1. Validate required parameters
    required = ['response_type', 'client_id', 'redirect_uri', 'scope']
    for param in required:
        if param not in request.form:
            errors.append(f"Missing required parameter: {param}")
    
    if errors:
        return error_response('invalid_request', '; '.join(errors))
    
    # 2. Validate response_type
    response_type = request.form.get('response_type')
    if response_type not in ['code', 'token']:  # Adjust based on server support
        return error_response('unsupported_response_type', 
                            f'response_type {response_type} not supported')
    
    # 3. Validate redirect_uri against registered URIs
    redirect_uri = request.form.get('redirect_uri')
    if redirect_uri not in client.registered_redirect_uris:
        return error_response('invalid_redirect_uri',
                            'redirect_uri not registered for this client')
    
    # 4. Validate scope
    requested_scopes = set(request.form.get('scope', '').split())
    allowed_scopes = set(client.allowed_scopes)
    
    if not requested_scopes.issubset(allowed_scopes):
        unauthorized = requested_scopes - allowed_scopes
        return error_response('invalid_scope',
                            f'Unauthorized scopes: {", ".join(unauthorized)}')
    
    # 5. Validate PKCE (if present or required)
    code_challenge = request.form.get('code_challenge')
    code_challenge_method = request.form.get('code_challenge_method', 'plain')
    
    if client.is_public:
        # Public clients MUST use PKCE
        if not code_challenge:
            return error_response('invalid_request',
                                'PKCE required for public clients')
    
    if code_challenge:
        # Validate code_challenge_method
        if code_challenge_method not in ['plain', 'S256']:
            return error_response('invalid_request',
                                'Invalid code_challenge_method')
        
        # Validate code_challenge format
        if not is_valid_code_challenge(code_challenge):
            return error_response('invalid_request',
                                'Invalid code_challenge format')
    
    # 6. Validate state (recommended but not required)
    state = request.form.get('state')
    if state and len(state) < 8:
        logger.warning('state parameter too short (< 8 characters)')
    
    # 7. Validate OIDC-specific parameters (if OIDC)
    nonce = request.form.get('nonce')
    if 'openid' in requested_scopes:
        # OIDC: nonce recommended
        if not nonce:
            logger.warning('nonce missing for OIDC request')
    
    # 8. Validate claims parameter (if present)
    claims_param = request.form.get('claims')
    if claims_param:
        try:
            claims = json.loads(claims_param)
            # Validate claims structure
            if not isinstance(claims, dict):
                return error_response('invalid_request',
                                    'claims parameter must be JSON object')
        except json.JSONDecodeError:
            return error_response('invalid_request',
                                'Invalid claims parameter (invalid JSON)')
    
    # All validations passed
    return None  # No error
```

### Client Binding

**Purpose:** Ensure request_uri can only be used by client that pushed it.

**Binding Process:**

```
1. Client authenticates at PAR endpoint
   → Authorization server knows client_id

2. Authorization server stores client_id with request_uri
   {
     'request_uri': 'urn:...',
     'client_id': 's6BhdRkqt3',  ← Bound to this client
     'params': {...}
   }

3. Client includes client_id in authorization request
   GET /authorize?client_id=s6BhdRkqt3&request_uri=urn:...

4. Authorization server validates match
   if request_client_id != stored_client_id:
       reject()
```

**Implementation:**

```python
def validate_client_binding(authorization_request, stored_request):
    """
    Validate client_id in authorization request matches stored request
    
    RFC 9126 §3: Client binding
    """
    request_client_id = authorization_request.args.get('client_id')
    stored_client_id = stored_request['client_id']
    
    if request_client_id != stored_client_id:
        logger.security_alert(
            "Client binding violation",
            details={
                'request_client_id': request_client_id,
                'stored_client_id': stored_client_id,
                'request_uri': authorization_request.args.get('request_uri')
            }
        )
        
        return error_response(
            error='invalid_request',
            error_description='client_id mismatch',
            state=stored_request['params'].get('state')
        )
    
    return None  # Validation passed
```

**Attack Prevented:**

```
Attack scenario without client binding:

1. Attacker (client A) pushes request
   POST /par (authenticated as client A)
   → receive request_uri_A

2. Attacker gives request_uri_A to victim app (client B)

3. Victim app uses request_uri_A in authorization
   GET /authorize?client_id=client_B&request_uri=request_uri_A

4. Without client binding:
   - Authorization proceeds with attacker's parameters
   - Redirect_uri could be attacker's
   - Code sent to attacker

5. With client binding:
   - Authorization server checks client_B != client_A
   - Request rejected
   - Attack fails
```

### Parameter Immutability

**Principle:** Parameters pushed via PAR cannot be modified by authorization request.

**Enforcement:**

```python
def process_authorization_with_par(authorization_request):
    """
    Process authorization request with request_uri
    
    Stored parameters take precedence over any request parameters
    """
    # Extract request_uri
    request_uri = authorization_request.args.get('request_uri')
    
    # Retrieve stored request
    stored_request = storage.get(request_uri)
    
    # Use ONLY stored parameters
    # Ignore any other parameters in authorization request
    authorization_params = stored_request['params']
    
    # Authorization request MUST NOT override stored parameters
    # Even if authorization_request contains scope=different_scope,
    # use stored_request['params']['scope']
    
    return process_authorization(authorization_params)
```

**What This Prevents:**

```
Without immutability:

1. Client pushes legitimate request
   scope=read

2. Attacker intercepts authorization URL
   GET /authorize?client_id=...&request_uri=...&scope=admin
                                                   ↑ Attacker adds

3. Without immutability: scope=admin might be used
   → Privilege escalation

With immutability:

1. Client pushes request (scope=read)
2. Attacker tries to add scope=admin in URL
3. Authorization server ignores URL parameters
4. Uses stored scope=read
5. Attack fails
```

---

## PAR vs Request Objects (JAR)

**Specifications:**
- PAR: RFC 9126 (Pushed Authorization Requests)
- JAR: RFC 9101 (JWT-Secured Authorization Requests)

### Conceptual Difference

**Request Objects (JAR):**
- Authorization parameters packaged in signed/encrypted JWT
- JWT passed as `request` parameter (inline) or `request_uri` (by reference)
- Provides integrity (signature) and optionally confidentiality (encryption)
- JWT travels in frontchannel (URL or referred-to URL)

**PAR:**
- Authorization parameters pushed via backchannel before authorization
- Server returns opaque `request_uri` reference
- No JWT required (but can push JWT)
- Parameters never in frontchannel

### Detailed Comparison

| Feature | PAR | JAR (Request Objects) |
|---------|-----|----------------------|
| **Parameter Transport** | Backchannel POST | Frontchannel (URL or reference) |
| **Request Signing** | No (but can push signed JAR) | Yes (JWT signature) |
| **Confidentiality** | Yes (backchannel HTTPS) | Optional (JWE encryption) |
| **Phishing Protection** | High (minimal frontchannel) | Medium (signed, but URL visible) |
| **URL Length** | No limit | Limit (if inline), no limit (if by reference) |
| **Client Authentication** | Yes (at PAR endpoint) | No (unless combined with PAR) |
| **Complexity** | Medium | Higher (JWT creation/validation) |
| **Server State** | Stateful (stores request) | Can be stateless (JWT self-contained) |

### Request Objects Without PAR

**JAR Inline (request parameter):**

```http
GET /authorize?response_type=code
               &client_id=s6BhdRkqt3
               &request=eyJhbGciOiJSUzI1NiIsImtpZCI6ImsyYmRjIn0.ew...
```

**JWT Contains:**
```json
{
  "iss": "s6BhdRkqt3",
  "aud": "https://auth.example.com",
  "response_type": "code",
  "client_id": "s6BhdRkqt3",
  "redirect_uri": "https://client.example.com/cb",
  "scope": "openid profile email",
  "state": "af0ifjsldkj",
  "code_challenge": "E9Melhoa2...",
  "code_challenge_method": "S256"
}
```

**Properties:**
- ✅ Parameters signed (integrity)
- ✅ Parameters optionally encrypted (confidentiality via JWE)
- ❌ JWT in URL (visible, logged)
- ❌ URL length limits (if JWT large)
- ❌ No phishing protection (full URL visible)

### Combining PAR and JAR

**Best Practice for High-Security (FAPI):**

Push signed JWT via PAR for maximum security.

**Flow:**

```
1. Client creates signed JWT request object
   JWT contains authorization parameters
   Signed with client's private key

2. Client pushes JWT via PAR
   POST /par
   Content-Type: application/x-www-form-urlencoded
   Authorization: (client authentication)
   
   request=eyJhbGciOiJSUzI1NiIsImtpZCI6ImsyYmRjIn0.ew...

3. Authorization server validates JWT
   - Verify signature
   - Validate claims
   - Store parameters

4. Authorization server returns request_uri

5. Client uses request_uri in authorization request
   GET /authorize?client_id=...&request_uri=urn:...

6. Authorization server retrieves JWT, validates, proceeds
```

**Benefits of PAR + JAR:**
- ✅ Request signing (JAR provides)
- ✅ Backchannel transport (PAR provides)
- ✅ Phishing protection (PAR provides)
- ✅ Parameter confidentiality (PAR provides)
- ✅ Client authentication (PAR provides)
- ✅ Maximum security

**Implementation:**

```python
import jwt

def push_signed_request_object_via_par(
    par_endpoint,
    authorization_params,
    client_id,
    client_secret,
    private_key,
    audience
):
    """
    Combine PAR + JAR: Push signed request object via PAR
    
    FAPI high-security scenario
    """
    # Step 1: Create signed JWT request object
    jwt_claims = {
        'iss': client_id,
        'aud': audience,
        **authorization_params  # Include all authorization parameters
    }
    
    signed_jwt = jwt.encode(jwt_claims, private_key, algorithm='RS256')
    
    # Step 2: Push JWT via PAR
    par_params = {
        'request': signed_jwt
    }
    
    par_response = push_authorization_request(
        par_endpoint=par_endpoint,
        params=par_params,
        client_id=client_id,
        client_secret=client_secret
    )
    
    return par_response['request_uri']
```

### When to Use Which

| Scenario | Recommendation |
|----------|----------------|
| **High-Security (FAPI)** | PAR + JAR (signed JWT via PAR) |
| **Enhanced Phishing Protection** | PAR alone (sufficient) |
| **Parameter Integrity** | JAR or PAR (both provide) |
| **Parameter Confidentiality** | PAR (backchannel) or JAR with JWE (encryption) |
| **Large Requests** | PAR (no URL limit) |
| **Simplicity** | PAR alone (easier than JAR) |
| **Legacy Compatibility** | JAR (doesn't require server changes for PAR support) |

---

## FAPI Requirements

**Specification:** Financial-grade API (FAPI) Security Profile

**FAPI** (Financial-grade API) is an OpenID Foundation specification for high-security scenarios, particularly financial services (open banking).

### FAPI Mandate for PAR

**FAPI 2.0:** PAR is REQUIRED (RFC 2119: REQUIRED)

**Rationale:**
- Financial applications need maximum security
- PAR provides phishing protection
- PAR provides parameter confidentiality
- PAR provides integrity protection

### FAPI Security Profile Requirements

**FAPI requires ALL of the following:**

1. **PAR (Pushed Authorization Requests):** REQUIRED
2. **JAR (JWT-Secured Requests):** REQUIRED (signed request objects)
3. **Strong Client Authentication:** mTLS or private_key_jwt
4. **PKCE:** REQUIRED for all clients
5. **Short request_uri lifetime:** ≤ 90 seconds RECOMMENDED
6. **Single-use request_uri:** REQUIRED

### FAPI PAR Configuration

```python
# FAPI-compliant PAR configuration
FAPI_PAR_CONFIG = {
    'par_required': True,                    # PAR mandatory
    'request_object_required': True,         # Signed JWT required
    'request_uri_lifetime': 60,              # 60 seconds (≤ 90)
    'request_uri_single_use': True,          # Strict single-use
    'client_auth_methods': [
        'private_key_jwt',                   # FAPI preferred
        'tls_client_auth'                    # mTLS acceptable
    ],
    'pkce_required': True,                   # Always
    'response_types': ['code'],              # Only authorization code
    'token_endpoint_auth_signing_alg': [
        'PS256', 'ES256'                     # FAPI-approved algorithms
    ]
}
```

### FAPI PAR Flow

```
1. Client creates signed JWT request object
   - All authorization parameters in JWT
   - Signed with PS256 or ES256
   - Includes aud, iss, exp, nbf, iat claims

2. Client authenticates with mTLS or private_key_jwt

3. Client pushes signed JWT via PAR
   POST /par
   (mTLS client certificate or private_key_jwt)
   
   request=eyJhbGciOiJQUzI1NiIsImtpZCI6ImsyYmRjIn0.ew...

4. Authorization server validates:
   - Client authentication (mTLS or JWT)
   - JWT signature
   - JWT claims (aud, exp, etc.)
   - Authorization parameters

5. Authorization server returns request_uri (expires in ≤90s)

6. Client uses request_uri in authorization
   (Must complete within ≤90 seconds)

7. Authorization proceeds with validated parameters
```

### FAPI Implementation Example

```python
import jwt
import ssl
import requests

class FAPICompliantClient:
    """FAPI-compliant OAuth2 client with PAR"""
    
    def __init__(self, config):
        self.client_id = config['client_id']
        self.private_key = config['private_key']
        self.par_endpoint = config['par_endpoint']
        self.authorization_endpoint = config['authorization_endpoint']
        self.token_endpoint = config['token_endpoint']
        
        # mTLS configuration
        self.cert_file = config['client_cert']
        self.key_file = config['client_key']
    
    def create_signed_request_object(self, params):
        """
        Create FAPI-compliant signed request object
        
        FAPI: Requires PS256 or ES256
        """
        import time
        
        now = int(time.time())
        
        jwt_claims = {
            # FAPI required claims
            'iss': self.client_id,
            'aud': self.authorization_endpoint,
            'exp': now + 300,  # 5 minutes
            'nbf': now,
            'iat': now,
            
            # Authorization parameters
            **params
        }
        
        # Sign with PS256 (FAPI-compliant)
        signed_jwt = jwt.encode(
            jwt_claims,
            self.private_key,
            algorithm='PS256',  # or ES256
            headers={'kid': 'my-key-id'}
        )
        
        return signed_jwt
    
    def push_via_par_with_mtls(self, authorization_params):
        """
        Push signed request object via PAR with mTLS
        
        FAPI: Requires strong client authentication
        """
        # Create signed request object
        request_object = self.create_signed_request_object(authorization_params)
        
        # PAR request with mTLS
        par_data = {
            'request': request_object
        }
        
        # mTLS session
        response = requests.post(
            self.par_endpoint,
            data=par_data,
            cert=(self.cert_file, self.key_file),  # mTLS client certificate
            verify=True,  # Verify server certificate
            timeout=10
        )
        
        if response.status_code == 201:
            par_response = response.json()
            
            request_uri = par_response['request_uri']
            expires_in = par_response['expires_in']
            
            # FAPI: Verify expires_in ≤ 90 seconds
            if expires_in > 90:
                logger.warning(f"request_uri lifetime {expires_in}s exceeds FAPI recommendation (90s)")
            
            return request_uri, expires_in
        else:
            raise FAPIError(f"PAR failed: {response.status_code}")
    
    def initiate_fapi_authorization(self, authorization_params):
        """Complete FAPI authorization flow"""
        # Push via PAR
        request_uri, expires_in = self.push_via_par_with_mtls(authorization_params)
        
        # Build authorization URL (minimal)
        authorization_url = (
            f"{self.authorization_endpoint}"
            f"?client_id={self.client_id}"
            f"&request_uri={request_uri}"
        )
        
        return authorization_url

# Usage
fapi_client = FAPICompliantClient({
    'client_id': 'fapi_client',
    'private_key': load_private_key('private_key.pem'),
    'par_endpoint': 'https://bank.example.com/par',
    'authorization_endpoint': 'https://bank.example.com/authorize',
    'token_endpoint': 'https://bank.example.com/token',
    'client_cert': 'client_cert.pem',
    'client_key': 'client_key.pem'
})

authorization_url = fapi_client.initiate_fapi_authorization({
    'response_type': 'code',
    'redirect_uri': 'https://myapp.example.com/callback',
    'scope': 'openid accounts transactions',
    'state': generate_state(),
    'code_challenge': generate_pkce_challenge(),
    'code_challenge_method': 'S256',
    'nonce': generate_nonce()
})
```

### FAPI Compliance Checklist

Authorization Server:
- [ ] PAR endpoint implemented
- [ ] Supports signed request objects (JWT)
- [ ] Validates JWT signatures (PS256 or ES256)
- [ ] Requires strong client authentication (mTLS or private_key_jwt)
- [ ] request_uri lifetime ≤ 90 seconds
- [ ] Single-use request_uri enforced
- [ ] PKCE validated

Client:
- [ ] Uses PAR for all authorization requests
- [ ] Creates signed request objects (PS256 or ES256)
- [ ] Authenticates with mTLS or private_key_jwt
- [ ] Uses PKCE for all requests
- [ ] Completes authorization within request_uri lifetime

---

## PAR Error Handling

### PAR Endpoint Errors

**Standard OAuth2 Error Codes:**

| Error Code | HTTP Status | Description | Client Action |
|------------|-------------|-------------|---------------|
| `invalid_request` | 400 | Malformed request, missing parameters | Fix request, retry |
| `invalid_client` | 400/401 | Client authentication failed | Fix credentials |
| `unauthorized_client` | 400 | Client not authorized for PAR | Check client configuration |
| `invalid_redirect_uri` | 400 | redirect_uri invalid or not registered | Register redirect_uri |
| `invalid_scope` | 400 | Requested scope invalid or unauthorized | Adjust scope |
| `unsupported_response_type` | 400 | response_type not supported | Use supported response_type |
| `server_error` | 500 | Server error | Retry with backoff |
| `temporarily_unavailable` | 503 | Service temporarily unavailable | Retry with backoff |

**Error Response Format:**

```json
{
  "error": "invalid_request",
  "error_description": "Missing required parameter: redirect_uri",
  "error_uri": "https://auth.example.com/docs/errors#invalid_request"
}
```

### Authorization Endpoint Errors with request_uri

**PAR-Specific Errors:**

| Error Code | Description | Cause |
|------------|-------------|-------|
| `invalid_request_uri` | request_uri invalid | request_uri not found, expired, or already used |
| `invalid_request` | Client mismatch | client_id doesn't match pushed request |

**Error Response (redirected to client):**

```http
HTTP/1.1 302 Found
Location: https://client.example.com/cb
         ?error=invalid_request_uri
         &error_description=request_uri+expired
         &state=af0ifjsldkj
```

### Comprehensive Error Handling

**Client Implementation:**

```python
class PARErrorHandler:
    """Handle PAR-related errors"""
    
    def handle_par_error(self, error_response):
        """Handle error from PAR endpoint"""
        error = error_response.get('error')
        description = error_response.get('error_description', '')
        
        if error == 'invalid_request':
            # Fix request parameters
            logger.error(f"Invalid PAR request: {description}")
            raise ConfigurationError(f"Fix parameters: {description}")
        
        elif error == 'invalid_client':
            # Client authentication failed
            logger.error("Client authentication failed at PAR endpoint")
            raise AuthenticationError("Check client credentials")
        
        elif error == 'invalid_redirect_uri':
            # redirect_uri not registered
            logger.error(f"redirect_uri not registered: {description}")
            raise ConfigurationError("Register redirect_uri with authorization server")
        
        elif error == 'invalid_scope':
            # Unauthorized scope
            logger.error(f"Invalid scope: {description}")
            raise ConfigurationError(f"Adjust scopes: {description}")
        
        elif error == 'server_error' or error == 'temporarily_unavailable':
            # Retry with backoff
            logger.warning(f"PAR endpoint error: {error}")
            raise RetryablePARError(error, description)
        
        else:
            logger.error(f"Unknown PAR error: {error}")
            raise PARError(f"{error}: {description}")
    
    def handle_authorization_error(self, error_params):
        """Handle error from authorization endpoint"""
        error = error_params.get('error')
        description = error_params.get('error_description', '')
        state = error_params.get('state')
        
        # Validate state
        if not self.validate_state(state):
            raise CSRFError("State parameter mismatch")
        
        if error == 'invalid_request_uri':
            # request_uri expired or invalid
            logger.info(f"request_uri issue: {description}")
            
            if 'expired' in description.lower():
                # Re-push and try again
                logger.info("request_uri expired, re-pushing request")
                return 'repush'
            else:
                # Invalid request_uri
                raise PARError(f"Invalid request_uri: {description}")
        
        elif error == 'invalid_request' and 'client_id' in description.lower():
            # Client mismatch
            logger.security_alert("client_id mismatch in authorization request")
            raise SecurityError("Client binding violation")
        
        else:
            # Standard authorization error
            raise AuthorizationError(f"{error}: {description}")

# Usage with retry logic
def initiate_authorization_with_retry(client, params, max_retries=3):
    """Initiate authorization with automatic retry on expiration"""
    error_handler = PARErrorHandler()
    
    for attempt in range(max_retries):
        try:
            # Push authorization request
            par_response = client.push_authorization_request(params)
            request_uri = par_response['request_uri']
            
            # Build authorization URL
            authorization_url = client.build_authorization_url(request_uri)
            
            # Redirect user
            return redirect_user(authorization_url)
        
        except RetryablePARError as e:
            # Server error, retry with backoff
            if attempt < max_retries - 1:
                backoff = 2 ** attempt  # Exponential backoff
                logger.info(f"Retrying PAR in {backoff}s (attempt {attempt + 1}/{max_retries})")
                time.sleep(backoff)
            else:
                raise
        
        except AuthorizationError as e:
            # Check if should retry
            if error_handler.handle_authorization_error(e.params) == 'repush':
                # request_uri expired, retry immediately
                logger.info(f"Retrying due to expired request_uri (attempt {attempt + 1}/{max_retries})")
                continue
            else:
                raise
```

### Error Logging and Monitoring

```python
def log_par_error_for_monitoring(error_type, error_details):
    """Log PAR errors for monitoring and alerting"""
    
    # Structured logging for monitoring systems
    logger.error(
        "PAR error occurred",
        extra={
            'error_type': error_type,
            'error_code': error_details.get('error'),
            'error_description': error_details.get('error_description'),
            'client_id': error_details.get('client_id'),
            'timestamp': datetime.now().isoformat(),
            'par_endpoint': error_details.get('par_endpoint')
        }
    )
    
    # Metric for monitoring dashboard
    metrics.increment('par.errors', tags=[
        f'error_type:{error_type}',
        f'error_code:{error_details.get("error")}'
    ])
    
    # Alert if error rate exceeds threshold
    error_rate = metrics.get_rate('par.errors', time_window=300)  # 5 minutes
    if error_rate > 0.1:  # > 10% error rate
        alert('high_par_error_rate', {
            'error_rate': error_rate,
            'error_type': error_type
        })
```

---

## Implementation Requirements Checklist

### Authorization Server Requirements

**MUST (RFC 2119):**

- [ ] **Implement PAR Endpoint**
  - [ ] POST method at `pushed_authorization_request_endpoint`
  - [ ] Accept `application/x-www-form-urlencoded`
  - [ ] Return HTTP 201 Created on success
  - [ ] Return `application/json` response

- [ ] **Authenticate Confidential Clients**
  - [ ] Require authentication at PAR endpoint
  - [ ] Support client_secret_basic, client_secret_post, or private_key_jwt
  - [ ] Validate client credentials

- [ ] **Generate Secure request_uri**
  - [ ] High entropy (cryptographically random)
  - [ ] Opaque to client
  - [ ] URN format: `urn:ietf:params:oauth:request_uri:<identifier>`
  - [ ] Unique for each PAR request

- [ ] **Store Authorization Parameters**
  - [ ] Associate parameters with request_uri
  - [ ] Store client_id with request_uri
  - [ ] Implement storage with TTL

- [ ] **Enforce request_uri Expiration**
  - [ ] Set and enforce expires_in
  - [ ] Reject expired request_uri
  - [ ] Return invalid_request_uri error

- [ ] **Validate Client Binding**
  - [ ] Verify client_id in authorization request matches stored
  - [ ] Reject mismatched client_id

- [ ] **Support All Authorization Parameters**
  - [ ] Accept all standard OAuth2/OIDC parameters
  - [ ] Store and use in authorization flow

**SHOULD (RFC 2119):**

- [ ] **Enforce Single-Use request_uri**
  - [ ] Mark request_uri as used after authorization request
  - [ ] Reject reuse attempts

- [ ] **Use Short request_uri Lifetime**
  - [ ] 10-90 seconds typical
  - [ ] Balance security vs UX

- [ ] **Validate Parameters at PAR Endpoint**
  - [ ] Fail fast (reject invalid parameters immediately)
  - [ ] Validate redirect_uri, scope, etc.
  - [ ] Return specific error codes

- [ ] **Support High-Security Scenarios**
  - [ ] Accept signed request objects (JAR + PAR)
  - [ ] Support mTLS and private_key_jwt
  - [ ] FAPI-compliant configuration option

### Client Requirements

**MUST (RFC 2119):**

- [ ] **Push All Authorization Parameters**
  - [ ] Include all parameters in PAR request
  - [ ] Don't include parameters in authorization request (except client_id and request_uri)

- [ ] **Use Returned request_uri**
  - [ ] Extract request_uri and expires_in from PAR response
  - [ ] Use request_uri in authorization request

- [ ] **Include client_id in Authorization Request**
  - [ ] Required for client binding validation

- [ ] **Handle request_uri Expiration**
  - [ ] Monitor expires_in
  - [ ] Re-push if request_uri expires before use

**SHOULD (RFC 2119):**

- [ ] **Complete Flow Quickly**
  - [ ] Initiate authorization promptly after PAR
  - [ ] Don't delay user redirect unnecessarily

- [ ] **Authenticate at PAR Endpoint**
  - [ ] Confidential clients: MUST authenticate
  - [ ] Public clients: Authenticate if possible

- [ ] **Handle Errors Gracefully**
  - [ ] Retry on server_error/temporarily_unavailable
  - [ ] Re-push on invalid_request_uri
  - [ ] Provide user-friendly error messages

---

## PAR with Different Client Types

### Confidential Clients (Server-Side Web Apps)

**Characteristics:**
- Can securely store client_secret
- Backend communicates with authorization server
- MUST authenticate at PAR endpoint

**Flow:**

```
Backend Server (Confidential Client)
     │
     │ 1. Push Authorization Request (with authentication)
     ├──────────────────────────────────────────►
     │                              Authorization Server
     │                                     │
     │                                     │ Validate, Store
     │                                     │
     │ 2. Receive request_uri              │
     │◄────────────────────────────────────┤
     │                                     │
     │ 3. Redirect user to authorization   │
     │────► User Browser ──────────────────►
                                           │
                                     [User authenticates]
                                           │
                                     Authorization code
                                           │
     │◄────── User Browser ◄───────────────┤
     │
```

**Implementation:**

```python
class ConfidentialClientPAR:
    """Confidential client using PAR"""
    
    def __init__(self, client_id, client_secret, metadata):
        self.client_id = client_id
        self.client_secret = client_secret
        self.par_endpoint = metadata['pushed_authorization_request_endpoint']
        self.authorization_endpoint = metadata['authorization_endpoint']
    
    def initiate_authorization(self, redirect_uri, scope, state, code_challenge):
        """Full PAR flow for confidential client"""
        # Step 1: Push request with authentication
        par_response = self.push_request(
            redirect_uri=redirect_uri,
            scope=scope,
            state=state,
            code_challenge=code_challenge
        )
        
        request_uri = par_response['request_uri']
        
        # Step 2: Build authorization URL
        authorization_url = (
            f"{self.authorization_endpoint}"
            f"?client_id={self.client_id}"
            f"&request_uri={request_uri}"
        )
        
        return authorization_url
    
    def push_request(self, **params):
        """Push with client_secret_basic authentication"""
        credentials = f"{self.client_id}:{self.client_secret}"
        encoded = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            'Authorization': f'Basic {encoded}',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        
        params['response_type'] = 'code'
        params['client_id'] = self.client_id
        
        response = requests.post(self.par_endpoint, data=params, headers=headers)
        return response.json()
```

### Public Clients (SPAs, Native Apps)

**Characteristics:**
- Cannot securely store client_secret
- Frontend communicates with authorization server
- SHOULD authenticate if possible (e.g., DPoP)
- MUST use PKCE

**Flow:**

```
Single-Page App (Public Client)
     │
     │ 1. Push Request (no authentication, but PKCE)
     ├──────────────────────────────────────────►
     │                              Authorization Server
     │                                     │
     │ 2. Receive request_uri              │
     │◄────────────────────────────────────┤
     │                                     │
     │ 3. Redirect user                    │
     │────────────────────────────────────►
                                           │
                                     [User authenticates]
                                           │
                                     Authorization code
                                           │
     │◄────────────────────────────────────┤
     │
     │ 4. Exchange code (with code_verifier)
     ├──────────────────────────────────────────►
     │                                     │
     │ 5. Receive tokens                   │
     │◄────────────────────────────────────┤
```

**Implementation:**

```javascript
// Public client (SPA) using PAR
class PublicClientPAR {
  constructor(clientId, metadata) {
    this.clientId = clientId;
    this.parEndpoint = metadata.pushed_authorization_request_endpoint;
    this.authorizationEndpoint = metadata.authorization_endpoint;
    this.tokenEndpoint = metadata.token_endpoint;
  }
  
  async initiateAuthorization(redirectUri, scope, state) {
    // Generate PKCE (REQUIRED for public clients)
    const { codeVerifier, codeChallenge } = await this.generatePKCE();
    
    // Store code_verifier for token exchange
    sessionStorage.setItem('code_verifier', codeVerifier);
    sessionStorage.setItem('state', state);
    
    // Step 1: Push request (no authentication)
    const parResponse = await this.pushRequest({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: redirectUri,
      scope: scope,
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });
    
    const requestUri = parResponse.request_uri;
    
    // Step 2: Redirect to authorization
    const authorizationUrl = 
      `${this.authorizationEndpoint}` +
      `?client_id=${this.clientId}` +
      `&request_uri=${encodeURIComponent(requestUri)}`;
    
    window.location.href = authorizationUrl;
  }
  
  async pushRequest(params) {
    const response = await fetch(this.parEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(params)
    });
    
    return response.json();
  }
  
  async generatePKCE() {
    // Generate code_verifier (43-128 characters)
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const codeVerifier = base64URLEncode(array);
    
    // Generate code_challenge = BASE64URL(SHA256(code_verifier))
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const codeChallenge = base64URLEncode(new Uint8Array(digest));
    
    return { codeVerifier, codeChallenge };
  }
}

function base64URLEncode(buffer) {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
```

**Why PAR for Public Clients:**

Even without authentication:
- ✅ Phishing protection (minimal frontchannel)
- ✅ Parameter confidentiality (not visible in URL)
- ✅ Large request support (no URL length limits)
- ✅ Combined with PKCE provides strong security

### Native Apps

**Characteristics:**
- Mobile/desktop applications
- Custom URI schemes or app-claimed HTTPS URIs
- MUST use PKCE
- PAR protects authorization parameters in custom URIs

**Benefits for Native Apps:**

```
Without PAR:
Custom URI scheme exposes parameters:
myapp://callback?code=xyz&state=abc&scope=...&...

With PAR:
Custom URI scheme only has essential parameters:
myapp://callback?code=xyz&state=abc

Scope, claims, other parameters not visible in custom URI
```

**Implementation (Swift - iOS):**

```swift
class NativeAppPARClient {
    let clientId: String
    let parEndpoint: URL
    let authorizationEndpoint: URL
    
    func initiateAuthorization(
        redirectUri: String,
        scope: String,
        state: String,
        codeChallenge: String
    ) async throws -> URL {
        // Push request
        let parResponse = try await pushRequest(
            redirectUri: redirectUri,
            scope: scope,
            state: state,
            codeChallenge: codeChallenge
        )
        
        let requestUri = parResponse.requestUri
        
        // Build authorization URL
        var components = URLComponents(url: authorizationEndpoint, resolvingAgainstBaseURL: false)!
        components.queryItems = [
            URLQueryItem(name: "client_id", value: clientId),
            URLQueryItem(name: "request_uri", value: requestUri)
        ]
        
        return components.url!
    }
    
    func pushRequest(
        redirectUri: String,
        scope: String,
        state: String,
        codeChallenge: String
    ) async throws -> PARResponse {
        let parameters = [
            "response_type": "code",
            "client_id": clientId,
            "redirect_uri": redirectUri,
            "scope": scope,
            "state": state,
            "code_challenge": codeChallenge,
            "code_challenge_method": "S256"
        ]
        
        var request = URLRequest(url: parEndpoint)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        request.httpBody = parameters.percentEncoded()
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 201 else {
            throw PARError.requestFailed
        }
        
        return try JSONDecoder().decode(PARResponse.self, from: data)
    }
}
```

---

## PAR Performance Considerations

### Additional Round-Trip

**Latency Impact:**

```
Traditional Authorization:
User initiates → Authorization endpoint
└─ 1 HTTP request

PAR Flow:
User initiates → PAR endpoint → Authorization endpoint
└─ 2 HTTP requests
   (but 1st is server-to-server, fast)
```

**Typical Latencies:**

```
PAR Request (backchannel): 50-200ms
Authorization Request (frontchannel): 100-500ms (depends on user)

Additional latency: ~50-200ms for PAR
```

**Mitigation:**

```python
# Optimize PAR request
def optimized_par_request(par_endpoint, params):
    """Optimized PAR with connection pooling"""
    # Use connection pooling
    session = requests.Session()
    adapter = requests.adapters.HTTPAdapter(
        pool_connections=10,
        pool_maxsize=20,
        max_retries=0  # Don't retry automatically
    )
    session.mount('https://', adapter)
    
    # Make request
    start = time.time()
    response = session.post(par_endpoint, data=params, timeout=5)
    elapsed = time.time() - start
    
    logger.info(f"PAR request completed in {elapsed*1000:.2f}ms")
    
    return response.json()
```

### Server-Side Storage

**Storage Requirements:**

```python
# Estimate storage per request_uri
storage_per_request = {
    'request_uri': 80 bytes,  # "urn:ietf:params:oauth:request_uri:..." + identifier
    'client_id': 50 bytes,
    'authorization_params': 500-2000 bytes,  # Depends on complexity
    'metadata': 200 bytes,  # Timestamps, flags, etc.
}

# Total: ~1-2 KB per request_uri

# Capacity calculation
requests_per_second = 100
request_uri_lifetime = 90  # seconds
concurrent_requests = requests_per_second * request_uri_lifetime
# = 9,000 concurrent request_uris

storage_needed = concurrent_requests * 2  # KB
# = 18 MB

# Very manageable!
```

**Storage Optimization:**

```python
class OptimizedRequestURIStorage:
    """Optimized storage for request_uri"""
    
    def __init__(self, redis_client):
        self.redis = redis_client
    
    def store(self, request_uri, data, ttl):
        """Store with compression"""
        # Compress data (especially large claims)
        import zlib
        compressed = zlib.compress(json.dumps(data).encode())
        
        # Store with TTL
        self.redis.setex(request_uri, ttl, compressed)
    
    def retrieve(self, request_uri):
        """Retrieve and decompress"""
        compressed = self.redis.get(request_uri)
        if not compressed:
            return None
        
        import zlib
        decompressed = zlib.decompress(compressed)
        return json.loads(decompressed)
```

### When to Use PAR

**Decision Matrix:**

| Application Type | Security Needs | Recommendation |
|------------------|----------------|----------------|
| Financial Services | Critical | Always use PAR (FAPI requires) |
| Healthcare | High | Always use PAR |
| Enterprise | High | Use PAR |
| E-commerce | Medium | Consider PAR (phishing protection) |
| Consumer Apps | Medium | Consider PAR (UX benefit) |
| Internal Tools | Low-Medium | Optional |
| Development/Testing | Low | Optional |

**Trade-Off Analysis:**

```
Benefits:
+ Enhanced security (parameter confidentiality)
+ Phishing protection
+ No URL length limits
+ Better audit trail

Costs:
- Additional round-trip (~50-200ms)
- Server-side storage required
- Implementation complexity
- Client must support PAR

Verdict: Benefits usually outweigh costs for production applications
```

---

## PAR in Multi-Tenant Scenarios

### Separate PAR Endpoint Per Tenant

**Configuration:**

```json
// Tenant A
{
  "issuer": "https://auth.example.com/tenant-a",
  "pushed_authorization_request_endpoint": "https://auth.example.com/tenant-a/par",
  "authorization_endpoint": "https://auth.example.com/tenant-a/authorize"
}

// Tenant B
{
  "issuer": "https://auth.example.com/tenant-b",
  "pushed_authorization_request_endpoint": "https://auth.example.com/tenant-b/par",
  "authorization_endpoint": "https://auth.example.com/tenant-b/authorize"
}
```

**Benefits:**
- Complete tenant isolation
- Separate storage per tenant
- Tenant-specific configurations

**Implementation:**

```python
class MultiTenantPAREndpoint:
    """PAR endpoint with tenant isolation"""
    
    def handle_par_request(self, tenant_id, request):
        """Handle PAR for specific tenant"""
        # Get tenant-specific configuration
        tenant_config = get_tenant_config(tenant_id)
        
        # Tenant-specific storage
        storage = get_tenant_storage(tenant_id)
        
        # Generate request_uri (tenant-scoped)
        request_uri = generate_request_uri(tenant_id)
        
        # Store in tenant-specific storage
        storage.store(request_uri, request.form.to_dict())
        
        return jsonify({
            'request_uri': request_uri,
            'expires_in': tenant_config.par_lifetime
        }), 201
```

### Shared PAR Endpoint

**Configuration:**

```json
{
  "issuer": "https://auth.example.com",
  "pushed_authorization_request_endpoint": "https://auth.example.com/par"
}

// Single PAR endpoint for all tenants
// Tenant determined by client_id
```

**Implementation:**

```python
class SharedPAREndpoint:
    """Shared PAR endpoint for multiple tenants"""
    
    def handle_par_request(self, request):
        """Handle PAR with tenant resolution"""
        # Authenticate client
        client_id = authenticate_client(request)
        
        # Determine tenant from client_id
        tenant_id = get_tenant_for_client(client_id)
        
        # Generate tenant-scoped request_uri
        identifier = secrets.token_urlsafe(32)
        request_uri = f"urn:ietf:params:oauth:request_uri:{tenant_id}:{identifier}"
        
        # Store with tenant context
        storage.store(request_uri, {
            'tenant_id': tenant_id,
            'client_id': client_id,
            'params': request.form.to_dict()
        })
        
        return jsonify({
            'request_uri': request_uri,
            'expires_in': 90
        }), 201
```

**request_uri Format for Multi-Tenant:**

```
Separate endpoints:
urn:ietf:params:oauth:request_uri:abc123def456

Shared endpoint (tenant in identifier):
urn:ietf:params:oauth:request_uri:tenant-a:abc123def456
urn:ietf:params:oauth:request_uri:tenant-b:xyz789ghi012
```

---

## Security Considerations

**Specification:** RFC 9126 §7 - Security Considerations

### request_uri Guessing Prevention

**Threat:** Attacker attempts to guess valid request_uri values.

**Defense:** High-entropy identifier.

```python
# GOOD: 256 bits of entropy
identifier = secrets.token_urlsafe(32)  # 32 bytes = 256 bits
request_uri = f"urn:ietf:params:oauth:request_uri:{identifier}"

# BAD: Low entropy
identifier = str(uuid.uuid4())  # Only 122 bits
identifier = str(int(time.time()))  # Predictable!
```

**Entropy Calculation:**

```
32 random bytes = 256 bits of entropy
Possible values: 2^256 ≈ 10^77

Brute force attempts:
  1 million/second: 10^71 years to exhaust
  1 billion/second: 10^68 years to exhaust

Conclusion: Impossible to guess
```

### Client Authentication Enforcement

**Threat:** Unauthenticated client generates request_uri for any client_id.

**Defense:** Require client authentication at PAR endpoint.

```python
def par_endpoint_with_auth(request):
    """PAR endpoint with mandatory authentication"""
    # Authenticate client (REQUIRED for confidential clients)
    try:
        authenticated_client_id = authenticate_client(request)
    except AuthenticationError:
        return error_response('invalid_client', 'Authentication required'), 401
    
    # Extract client_id from request
    request_client_id = request.form.get('client_id')
    
    # Validate match
    if request_client_id != authenticated_client_id:
        return error_response('invalid_request', 'client_id mismatch'), 400
    
    # Proceed with validated client
    return process_par_request(authenticated_client_id, request)
```

### Short request_uri Lifetime

**Threat:** Long-lived request_uri increases exposure window.

**Defense:** Short expires_in (10-90 seconds).

**Recommendations:**

```python
RECOMMENDED_LIFETIMES = {
    'fapi_maximum_security': 10,  # FAPI high-security
    'high_security': 30,           # High-security apps
    'balanced': 60,                # Most applications
    'user_friendly': 90            # Maximum recommended
}

# Choose based on risk profile
expires_in = RECOMMENDED_LIFETIMES['balanced']  # 60 seconds
```

**Why Short Lifetime Matters:**

```
Scenario: Attacker intercepts authorization URL

With 10-second lifetime:
- Attacker has 10 seconds to exploit
- Likely too short to mount attack
- request_uri expires quickly

With 600-second (10-minute) lifetime:
- Attacker has 10 minutes
- Time to analyze, prepare phishing
- Larger attack window

Conclusion: Shorter is more secure
```

### Single-Use Enforcement

**Threat:** request_uri replay attack.

**Defense:** Invalidate after first use.

```python
def single_use_enforcement(request_uri):
    """Enforce single-use for request_uri"""
    # Retrieve with atomic check-and-set
    stored_data = storage.get(request_uri)
    
    if not stored_data:
        return None  # Not found or expired
    
    # Check used flag
    if stored_data.get('used'):
        # SECURITY ALERT: Replay attempt
        logger.security_alert(
            "request_uri replay detected",
            {
                'request_uri': request_uri,
                'first_use': stored_data.get('used_at'),
                'replay_attempt': datetime.now().isoformat()
            }
        )
        return None
    
    # Mark as used atomically
    # Use Redis WATCH/MULTI/EXEC for atomic operation
    with storage.pipeline() as pipe:
        pipe.watch(request_uri)
        pipe.multi()
        stored_data['used'] = True
        stored_data['used_at'] = datetime.now().isoformat()
        pipe.set(request_uri, json.dumps(stored_data))
        pipe.execute()
    
    return stored_data['params']
```

### Parameter Validation at PAR

**Threat:** Invalid parameters cause errors during authorization.

**Defense:** Validate at PAR endpoint (fail fast).

**Benefits:**
- Errors detected before user interaction
- Better user experience
- Resource efficiency (don't store invalid requests)
- Security (reject malicious parameters early)

```python
def validate_at_par_endpoint(request, client):
    """Comprehensive validation at PAR"""
    # Validate BEFORE storing
    errors = []
    
    # Redirect URI validation
    redirect_uri = request.form.get('redirect_uri')
    if redirect_uri not in client.registered_redirect_uris:
        errors.append('invalid_redirect_uri')
    
    # Scope validation
    requested_scopes = set(request.form.get('scope', '').split())
    if not requested_scopes.issubset(client.allowed_scopes):
        errors.append('invalid_scope')
    
    # PKCE validation (if present)
    code_challenge = request.form.get('code_challenge')
    if client.requires_pkce and not code_challenge:
        errors.append('pkce_required')
    
    # Return errors immediately (don't store invalid request)
    if errors:
        return error_response('invalid_request', '; '.join(errors)), 400
    
    # Valid request - proceed with storage
    return None
```

---

## Testing and Validation

### Test Scenarios

**1. Happy Path: PAR → Authorization → Token**

```python
def test_par_happy_path():
    """Test complete PAR flow"""
    # Step 1: Push authorization request
    par_response = client.push_authorization_request({
        'response_type': 'code',
        'client_id': TEST_CLIENT_ID,
        'redirect_uri': TEST_REDIRECT_URI,
        'scope': 'openid profile',
        'state': 'abc123',
        'code_challenge': generate_pkce_challenge(),
        'code_challenge_method': 'S256'
    })
    
    assert par_response['request_uri'].startswith('urn:ietf:params:oauth:request_uri:')
    assert par_response['expires_in'] > 0
    
    request_uri = par_response['request_uri']
    
    # Step 2: Authorization request
    authorization_response = client.authorize(
        client_id=TEST_CLIENT_ID,
        request_uri=request_uri
    )
    
    assert 'code' in authorization_response
    
    # Step 3: Token exchange
    token_response = client.exchange_code(
        code=authorization_response['code'],
        code_verifier=code_verifier
    )
    
    assert 'access_token' in token_response
```

**2. Expired request_uri**

```python
def test_expired_request_uri():
    """Test request_uri expiration"""
    # Push request
    par_response = client.push_authorization_request(params)
    request_uri = par_response['request_uri']
    expires_in = par_response['expires_in']
    
    # Wait for expiration
    time.sleep(expires_in + 1)
    
    # Attempt authorization (should fail)
    response = client.authorize(client_id=TEST_CLIENT_ID, request_uri=request_uri)
    
    assert response['error'] == 'invalid_request_uri'
    assert 'expired' in response['error_description'].lower()
```

**3. request_uri Reuse (Single-Use Enforcement)**

```python
def test_request_uri_single_use():
    """Test single-use enforcement"""
    # Push request
    par_response = client.push_authorization_request(params)
    request_uri = par_response['request_uri']
    
    # First use (should succeed)
    response1 = client.authorize(client_id=TEST_CLIENT_ID, request_uri=request_uri)
    assert 'code' in response1
    
    # Second use (should fail)
    response2 = client.authorize(client_id=TEST_CLIENT_ID, request_uri=request_uri)
    assert response2['error'] == 'invalid_request_uri'
```

**4. Client Mismatch**

```python
def test_client_mismatch():
    """Test client binding violation"""
    # Client A pushes request
    par_response = client_a.push_authorization_request(params)
    request_uri = par_response['request_uri']
    
    # Client B tries to use Client A's request_uri (should fail)
    response = client_b.authorize(client_id=CLIENT_B_ID, request_uri=request_uri)
    
    assert response['error'] == 'invalid_request'
    assert 'client_id' in response['error_description'].lower()
```

**5. Invalid Parameters in PAR**

```python
def test_invalid_parameters_rejected():
    """Test PAR endpoint rejects invalid parameters"""
    # Missing redirect_uri
    response = client.push_authorization_request({
        'response_type': 'code',
        'client_id': TEST_CLIENT_ID,
        # redirect_uri missing!
        'scope': 'openid'
    })
    
    assert response['error'] == 'invalid_request'
    
    # Invalid redirect_uri
    response = client.push_authorization_request({
        'response_type': 'code',
        'client_id': TEST_CLIENT_ID,
        'redirect_uri': 'https://evil.com/steal',  # Not registered
        'scope': 'openid'
    })
    
    assert response['error'] == 'invalid_redirect_uri'
```

**6. Large Authorization Request**

```python
def test_large_authorization_request():
    """Test PAR handles large requests (no URL length limit)"""
    # Create very large claims object
    large_claims = {
        'id_token': {f'claim_{i}': {'essential': True} for i in range(100)},
        'userinfo': {f'claim_{i}': {'essential': False} for i in range(100, 200)}
    }
    
    # This would exceed URL length limits without PAR
    par_response = client.push_authorization_request({
        'response_type': 'code',
        'client_id': TEST_CLIENT_ID,
        'redirect_uri': TEST_REDIRECT_URI,
        'scope': 'openid profile email',
        'state': 'abc123',
        'claims': json.dumps(large_claims),  # Very large
        'code_challenge': generate_pkce_challenge(),
        'code_challenge_method': 'S256'
    })
    
    # Should succeed despite large size
    assert 'request_uri' in par_response
    
    # Authorization proceeds normally
    response = client.authorize(client_id=TEST_CLIENT_ID, request_uri=par_response['request_uri'])
    assert 'code' in response
```

### Validation Checklist

**Authorization Server:**

- [ ] PAR endpoint requires authentication for confidential clients
- [ ] request_uri has sufficient entropy (256+ bits)
- [ ] request_uri expires (expires_in enforced)
- [ ] Single-use enforced (second use rejected)
- [ ] Client binding enforced (client_id validated)
- [ ] Authorization parameters validated at PAR endpoint
- [ ] Invalid parameters rejected with specific errors
- [ ] Large requests supported (no size limit)
- [ ] HTTPS required for PAR endpoint
- [ ] Proper error responses returned

**Client:**

- [ ] Authenticates at PAR endpoint (if confidential)
- [ ] Handles PAR errors appropriately
- [ ] Uses returned request_uri in authorization request
- [ ] Includes only client_id and request_uri in authorization URL
- [ ] Handles request_uri expiration (re-push if needed)
- [ ] Monitors expires_in and completes flow promptly
- [ ] PKCE used (if public client)

---

## Relationship to Other Specifications

### Primary Specifications

1. **RFC 9126 - OAuth 2.0 Pushed Authorization Requests**
   - URL: https://www.rfc-editor.org/rfc/rfc9126.html
   - This specification
   - Sections:
     - §2.1: Pushed Authorization Request
     - §2.2: Successful Response
     - §2.3: Using the Request URI
     - §3: Authorization Server Responsibilities
     - §4: Security Considerations

2. **RFC 9101 - JWT-Secured Authorization Requests (JAR)**
   - URL: https://www.rfc-editor.org/rfc/rfc9101.html
   - Complementary to PAR
   - Can combine: Push signed JWT via PAR

3. **Financial-grade API (FAPI)**
   - URL: https://openid.net/wg/fapi/
   - Requires PAR for financial services
   - FAPI 2.0 Security Profile mandates PAR + JAR

### Supporting Specifications

4. **RFC 6749 - OAuth 2.0 Framework**
   - Base OAuth 2.0 specification
   - PAR extends authorization request

5. **RFC 7636 - PKCE**
   - Related Document: `pkce-implementation.md`
   - Used with PAR for public clients

6. **RFC 8414 - OAuth 2.0 Authorization Server Metadata**
   - `pushed_authorization_request_endpoint` field
   - Related Document: `authorization-server-metadata.md`

7. **OpenID Connect Discovery 1.0**
   - OIDC Discovery includes PAR endpoint
   - Related Document: `well-known-configuration.md`

---

## Example Scenarios

### Scenario 1: Confidential Client Uses PAR

**Complete Flow:**

```python
# Initialize client
client = ConfidentialClient(
    client_id='web_app_123',
    client_secret='secret_xyz',
    par_endpoint='https://auth.example.com/par',
    authorization_endpoint='https://auth.example.com/authorize',
    token_endpoint='https://auth.example.com/token'
)

# Generate PKCE (best practice even for confidential clients)
code_verifier, code_challenge = generate_pkce()

# Step 1: Push authorization request
par_response = client.push_authorization_request(
    redirect_uri='https://myapp.example.com/callback',
    scope='openid profile email',
    state=generate_state(),
    code_challenge=code_challenge,
    code_challenge_method='S256'
)

request_uri = par_response['request_uri']
print(f"Received request_uri: {request_uri}")
print(f"Expires in: {par_response['expires_in']} seconds")

# Step 2: Redirect user to authorization
authorization_url = (
    f"{client.authorization_endpoint}"
    f"?client_id={client.client_id}"
    f"&request_uri={request_uri}"
)

print(f"Redirecting user to: {authorization_url}")
# Minimal URL, no sensitive parameters visible
```

### Scenario 2: Public Client (SPA) Uses PAR with PKCE

**JavaScript Implementation:**

```javascript
// SPA using PAR
async function initiateLogin() {
  const client = new PublicClient('spa_client_456', metadata);
  
  // Generate PKCE (REQUIRED for public clients)
  const { codeVerifier, codeChallenge } = await generatePKCE();
  const state = generateState();
  
  // Store for later
  sessionStorage.setItem('code_verifier', codeVerifier);
  sessionStorage.setItem('state', state);
  
  // Push request (no authentication, but PKCE provides security)
  const parResponse = await fetch(metadata.pushed_authorization_request_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      response_type: 'code',
      client_id: 'spa_client_456',
      redirect_uri: 'https://myapp.example.com/callback',
      scope: 'openid profile email',
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    })
  });
  
  const { request_uri, expires_in } = await parResponse.json();
  
  console.log(`request_uri expires in ${expires_in} seconds`);
  
  // Redirect to authorization
  const authUrl = new URL(metadata.authorization_endpoint);
  authUrl.searchParams.set('client_id', 'spa_client_456');
  authUrl.searchParams.set('request_uri', request_uri);
  
  window.location.href = authUrl.toString();
  // User sees minimal URL with no sensitive parameters
}
```

### Scenario 3: request_uri Expires - Client Re-pushes

**Handling Expiration:**

```python
def handle_authorization_with_retry():
    """Client handles request_uri expiration gracefully"""
    max_attempts = 3
    
    for attempt in range(max_attempts):
        try:
            # Push request
            par_response = client.push_authorization_request(params)
            request_uri = par_response['request_uri']
            expires_in = par_response['expires_in']
            
            print(f"Attempt {attempt + 1}: request_uri expires in {expires_in}s")
            
            # Build authorization URL
            authorization_url = build_authorization_url(client_id, request_uri)
            
            # Redirect user immediately (minimize delay)
            return redirect_user(authorization_url)
        
        except RequestURIExpiredError:
            print(f"request_uri expired on attempt {attempt + 1}, retrying...")
            if attempt < max_attempts - 1:
                continue  # Retry
            else:
                raise  # Give up after max attempts
```

### Scenario 4: Large Authorization Request (Complex Claims)

**Complex OIDC Request:**

```python
# Very complex claims request
complex_claims = {
    'id_token': {
        'email': {'essential': True},
        'email_verified': {'essential': True},
        'name': {'essential': True},
        'given_name': {'essential': True},
        'family_name': {'essential': True},
        'middle_name': {'essential': False},
        'nickname': {'essential': False},
        'preferred_username': {'essential': False},
        'profile': {'essential': False},
        'picture': {'essential': False},
        'website': {'essential': False},
        'gender': {'essential': False},
        'birthdate': {'essential': False},
        'zoneinfo': {'essential': False},
        'locale': {'essential': False},
        'phone_number': {'essential': True},
        'phone_number_verified': {'essential': True},
        'address': {
            'essential': True,
            'value': {
                'street_address': None,
                'locality': None,
                'region': None,
                'postal_code': None,
                'country': None
            }
        },
        'updated_at': {'essential': False},
        # Custom claims
        'employee_id': {'essential': True},
        'department': {'essential': True},
        'manager': {'essential': False},
        'cost_center': {'essential': False}
    },
    'userinfo': {
        # Similar extensive claims for userinfo
        # ... another 20+ claims ...
    }
}

# This JSON is ~3000+ characters when serialized
# Would exceed URL length limits without PAR

# With PAR: No problem!
par_response = client.push_authorization_request(
    redirect_uri='https://enterprise.example.com/callback',
    scope='openid profile email phone address employee_profile',
    state=generate_state(),
    claims=json.dumps(complex_claims),  # Very large
    code_challenge=generate_pkce_challenge(),
    code_challenge_method='S256'
)

# Authorization URL remains short
# Only client_id and request_uri visible
```

### Scenario 5: FAPI - PAR + JAR + mTLS

**Maximum Security:**

```python
# FAPI-compliant flow
def fapi_authorization_flow():
    """FAPI: PAR + signed request object + mTLS"""
    
    # Step 1: Create signed JWT request object
    jwt_claims = {
        'iss': 'fapi_client_789',
        'aud': 'https://bank.example.com',
        'exp': int(time.time()) + 300,
        'nbf': int(time.time()),
        'iat': int(time.time()),
        'response_type': 'code',
        'client_id': 'fapi_client_789',
        'redirect_uri': 'https://fintech.example.com/callback',
        'scope': 'openid accounts transactions',
        'state': generate_state(),
        'code_challenge': generate_pkce_challenge(),
        'code_challenge_method': 'S256',
        'nonce': generate_nonce()
    }
    
    # Sign with PS256 (FAPI requirement)
    signed_jwt = jwt.encode(jwt_claims, private_key, algorithm='PS256')
    
    # Step 2: Push signed JWT via PAR with mTLS
    response = requests.post(
        'https://bank.example.com/par',
        data={'request': signed_jwt},
        cert=('client_cert.pem', 'client_key.pem'),  # mTLS
        verify=True
    )
    
    par_response = response.json()
    request_uri = par_response['request_uri']
    expires_in = par_response['expires_in']
    
    # FAPI: Verify short lifetime (≤ 90 seconds)
    assert expires_in <= 90, "FAPI requires request_uri lifetime ≤ 90s"
    
    # Step 3: Redirect user (minimal authorization URL)
    authorization_url = (
        f"https://bank.example.com/authorize"
        f"?client_id=fapi_client_789"
        f"&request_uri={request_uri}"
    )
    
    return authorization_url
    # User sees only client_id and request_uri
    # All parameters (including signed JWT) in authorization server storage
```

### Scenario 6: Phishing Attempt Blocked

**Attack Scenario:**

```python
# Attacker tries to phish user

# 1. Attacker tries to generate valid request_uri (fails)
try:
    # Attacker doesn't have client credentials
    fake_par_response = requests.post(
        'https://auth.example.com/par',
        data={
            'response_type': 'code',
            'client_id': 'legitimate_client',
            'redirect_uri': 'https://evil-phishing.com/steal',
            'scope': 'openid profile email'
        }
        # No authentication!
    )
    # Returns 401 Unauthorized
except AuthenticationError:
    print("Attacker cannot create request_uri without authentication")

# 2. Attacker tries to use old stolen request_uri (fails)
stolen_request_uri = 'urn:ietf:params:oauth:request_uri:old_uri_123'

phishing_url = (
    f"https://auth.example.com/authorize"
    f"?client_id=legitimate_client"
    f"&request_uri={stolen_request_uri}"
)

# User clicks phishing link
# Authorization server checks:
# - request_uri expired? → Reject
# - request_uri already used (single-use)? → Reject
# → Phishing attempt fails

print("Phishing blocked by PAR security mechanisms")
```

### Scenario 7: request_uri Replay Blocked

**Single-Use Enforcement:**

```python
# Legitimate flow
par_response = client.push_authorization_request(params)
request_uri = par_response['request_uri']

# First use: Success
authorization_response_1 = client.authorize(
    client_id=client.client_id,
    request_uri=request_uri
)
# User completes authorization, receives code

# Attacker tries to replay request_uri
# (Perhaps intercepted authorization URL)
authorization_response_2 = client.authorize(
    client_id=client.client_id,
    request_uri=request_uri  # Same request_uri
)

# Authorization server checks:
# - request_uri marked as used? → YES
# - Return error: invalid_request_uri

print("Replay attack blocked by single-use enforcement")
print(f"Error: {authorization_response_2['error']}")
# Error: invalid_request_uri
```

---

## Migration to PAR

### Adding PAR Support

**Phase 1: Implement PAR Endpoint**

```python
# Authorization server adds PAR endpoint
@app.route('/par', methods=['POST'])
def par_endpoint():
    """PAR endpoint implementation"""
    # Authenticate client
    client_id = authenticate_client(request)
    
    # Validate parameters
    validation_error = validate_authorization_params(request.form, client_id)
    if validation_error:
        return jsonify(validation_error), 400
    
    # Generate request_uri
    request_uri = generate_request_uri()
    expires_in = 90
    
    # Store authorization request
    storage.store(request_uri, {
        'client_id': client_id,
        'params': request.form.to_dict(),
        'expires_at': datetime.now() + timedelta(seconds=expires_in)
    }, ttl=expires_in)
    
    # Return response
    return jsonify({
        'request_uri': request_uri,
        'expires_in': expires_in
    }), 201
```

**Phase 2: Advertise in Metadata**

```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "pushed_authorization_request_endpoint": "https://auth.example.com/par",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code"]
}
```

**Phase 3: Support Both PAR and Traditional**

```python
# Authorization endpoint supports both
@app.route('/authorize')
def authorization_endpoint():
    """Authorization with PAR and traditional support"""
    request_uri = request.args.get('request_uri')
    
    if request_uri:
        # PAR flow
        return process_par_authorization(request_uri)
    else:
        # Traditional flow (backward compatibility)
        return process_traditional_authorization(request.args)
```

### Client Adoption

**Gradual Rollout:**

```python
class AdaptiveOAuth2Client:
    """Client that adapts to PAR support"""
    
    def __init__(self, metadata):
        self.metadata = metadata
        self.supports_par = 'pushed_authorization_request_endpoint' in metadata
    
    def initiate_authorization(self, params):
        """Use PAR if available, fall back to traditional"""
        if self.supports_par:
            # Use PAR
            return self.initiate_with_par(params)
        else:
            # Fall back to traditional
            return self.initiate_traditional(params)
    
    def initiate_with_par(self, params):
        """PAR flow"""
        par_response = self.push_request(params)
        request_uri = par_response['request_uri']
        
        return self.build_authorization_url(request_uri)
    
    def initiate_traditional(self, params):
        """Traditional authorization request"""
        return self.build_traditional_authorization_url(params)
```

### Monitoring Adoption

```python
class PARAdoptionMonitor:
    """Monitor PAR adoption rates"""
    
    def log_authorization_method(self, method):
        """Log which method used"""
        metrics.increment('authorization.method', tags=[f'method:{method}'])
    
    def get_par_adoption_rate(self):
        """Calculate PAR adoption rate"""
        par_count = metrics.get_count('authorization.method', tags=['method:par'])
        total_count = metrics.get_count('authorization.method')
        
        return (par_count / total_count * 100) if total_count > 0 else 0
    
    def generate_adoption_report(self):
        """Generate adoption report"""
        adoption_rate = self.get_par_adoption_rate()
        
        return {
            'par_adoption_rate': f'{adoption_rate:.2f}%',
            'par_requests': metrics.get_count('authorization.method', tags=['method:par']),
            'traditional_requests': metrics.get_count('authorization.method', tags=['method:traditional']),
            'recommendation': 'Continue rollout' if adoption_rate < 80 else 'Consider enforcing PAR'
        }
```

### Enforcing PAR

**Phase 4: Gradually Enforce (Optional)**

```python
# Enforce PAR for high-security clients first
ENFORCE_PAR_FOR_CLIENTS = [
    'financial_app_client',
    'healthcare_app_client',
    'enterprise_app_client'
]

@app.route('/authorize')
def authorization_endpoint():
    """Authorization with selective PAR enforcement"""
    client_id = request.args.get('client_id')
    request_uri = request.args.get('request_uri')
    
    # Check if PAR required for this client
    if client_id in ENFORCE_PAR_FOR_CLIENTS:
        if not request_uri:
            return error_response(
                'invalid_request',
                'PAR required for this client'
            )
    
    # Process authorization
    if request_uri:
        return process_par_authorization(request_uri)
    else:
        return process_traditional_authorization(request.args)
```

**Phase 5: Full Enforcement (Optional)**

```python
# Enforce PAR for all clients
PAR_ENFORCEMENT_DATE = datetime(2025, 1, 1)

@app.route('/authorize')
def authorization_endpoint():
    """Authorization with full PAR enforcement"""
    request_uri = request.args.get('request_uri')
    
    if datetime.now() >= PAR_ENFORCEMENT_DATE:
        # PAR required for all
        if not request_uri:
            return error_response(
                'invalid_request',
                'PAR required. See migration guide: https://docs.example.com/par'
            )
    
    # Process PAR authorization
    return process_par_authorization(request_uri)
```

---

## Conclusion

Pushed Authorization Requests (PAR, RFC 9126) provides significant security enhancements for OAuth 2.0 authorization flows by moving authorization request parameters from the frontchannel (browser URL) to the backchannel (direct server-to-server). This simple architectural change delivers multiple security benefits: parameter confidentiality, phishing protection, parameter integrity, and support for large requests.

**Key Takeaways:**

1. **Security Benefits:** PAR provides parameter confidentiality, integrity, and phishing protection
2. **FAPI Requirement:** Financial-grade API mandates PAR for high-security scenarios
3. **Simple Integration:** Client pushes request, receives request_uri, uses in minimal authorization URL
4. **Short-Lived request_uri:** 10-90 seconds typical, balancing security and user experience
5. **Single-Use Enforcement:** Recommended to prevent replay attacks
6. **Client Binding:** Validates client_id matches to prevent cross-client attacks
7. **Fail Fast:** Parameter validation at PAR endpoint improves UX and security
8. **Complementary to JAR:** Can combine PAR with signed request objects for maximum security

**When to Use PAR:**
- **Always:** High-security applications (financial, healthcare, enterprise)
- **Recommended:** Consumer applications wanting phishing protection
- **Consider:** Any application with complex authorization requests
- **Required:** FAPI-compliant implementations

**Implementation Priority:**

1. Implement PAR endpoint with proper authentication
2. Generate high-entropy request_uri with short lifetime
3. Store and validate authorization parameters
4. Enforce client binding and single-use
5. Advertise in authorization server metadata
6. Update clients to use PAR
7. Monitor adoption and performance

PAR represents a significant improvement in OAuth 2.0 security with minimal implementation complexity. The trade-off of one additional backchannel round-trip is well worth the security benefits for most production applications.

---

**Document Version:** 1.0
**Last Updated:** 2024
**Specification References:**
- RFC 9126 (OAuth 2.0 Pushed Authorization Requests)
- RFC 9101 (JWT-Secured Authorization Requests)
- Financial-grade API (FAPI) Security Profile
- RFC 6749 (OAuth 2.0 Framework)
