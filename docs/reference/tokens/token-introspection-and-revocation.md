# OAuth2 Token Introspection and Revocation

## Specification Reference for OAuth2/OIDC Debugging Tool

> *"Token introspection is like calling the hotel to confirm a reservation is still valid. Token revocation is like calling to cancel it. In both cases, you're making a phone call, and you'd better have a good reason for the hotel to take you seriously."*

---

## 1. Overview

OAuth2 provides two separate but complementary mechanisms for managing token lifecycle:

### 1.1 Token Introspection (RFC 7662)

**Purpose:** Query the authorization server to determine the active status and metadata of a token.

**Use Cases:**
- Validate opaque access tokens (cannot be decoded locally)
- Check refresh token status
- Verify JWT hasn't been revoked (real-time revocation check)
- Retrieve token metadata (scopes, expiration, user info)

**Primary Specification:** RFC 7662 - OAuth 2.0 Token Introspection

### 1.2 Token Revocation (RFC 7009)

**Purpose:** Invalidate an access or refresh token before its natural expiration.

**Use Cases:**
- User logout (revoke refresh token)
- Security events (password change, breach detection)
- Client deactivation
- User revokes consent/authorization
- Admin-initiated token invalidation

**Primary Specification:** RFC 7009 - OAuth 2.0 Token Revocation

### 1.3 Relationship Between Mechanisms

```
┌─────────────────────────────────────────────────────────┐
│ Token Lifecycle Management                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Token Issued                                           │
│       │                                                 │
│       ▼                                                 │
│  ┌──────────────┐                                       │
│  │ Token Active │◄────────────┐                         │
│  └──────┬───────┘              │                        │
│         │                      │                        │
│         │                 Introspection                 │
│         │                 Query Status                  │
│         │                      │                        │
│         ▼                      │                        │
│  ┌──────────────┐              │                        │
│  │ Token Used   ├──────────────┘                        │
│  │ (at RS)      │                                       │
│  └──────┬───────┘                                       │
│         │                                               │
│         │ (Natural exp                                  │
│         │  OR revocation)                               │
│         │                                               │
│         ▼                                               │
│  ┌──────────────┐        Revocation                    │
│  │ Token        │◄────── Explicit                      │
│  │ Inactive     │        Invalidation                   │
│  └──────────────┘                                       │
│                                                         │
│  Introspection: Check current status                    │
│  Revocation: Make inactive immediately                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 1.4 Mechanisms Comparison

| Aspect | Introspection | Revocation |
|--------|--------------|-----------|
| **Purpose** | Query token status | Invalidate token |
| **Operation** | Read-only | Write (state change) |
| **Frequency** | Every token use (potentially) | Rare events only |
| **Response** | Token metadata | Success/error status |
| **Effect** | No state change | Token becomes inactive |
| **Use Case** | Validation | Lifecycle management |

---

## 2. Token Introspection (RFC 7662)

### 2.1 Purpose and Scope

Token introspection allows resource servers and authorized clients to query the authorization server about the current state of an access or refresh token.

**Primary Use:** Opaque token validation

```
Opaque Token:
  Format: Random string (e.g., "2YotnFZFEjr1zCsicMWpAA")
  Problem: Cannot decode locally
  Solution: Introspect to determine validity and claims

JWT Token:
  Format: Header.Payload.Signature (can decode locally)
  Problem: Cannot detect revocation locally
  Solution: Introspect for real-time revocation status
```

### 2.2 When to Use Introspection

| Scenario | Use Introspection? | Reasoning |
|----------|-------------------|-----------|
| **Opaque access token** | ✅ YES | Only way to validate |
| **JWT access token (normal request)** | ❌ NO | Local validation faster |
| **JWT access token (critical operation)** | ⚠️ MAYBE | Check revocation status |
| **Refresh token status** | ✅ YES | Verify still active before refresh |
| **Token metadata needed** | ✅ YES | Get scopes, user info, etc. |
| **High-frequency validation** | ❌ NO | Use local validation + caching |

### 2.3 Alternative: JWT Local Validation

**Comparison:**

```
Introspection (Opaque Token):
  1. Extract token from request
  2. Call introspection endpoint (network call)
  3. Parse JSON response
  4. Check active=true
  5. Extract claims (scope, sub, etc.)
  Latency: 50-200ms
  
JWT Local Validation:
  1. Extract token from request
  2. Verify signature with public key
  3. Validate exp, iss, aud claims
  4. Extract claims from payload
  Latency: <5ms
  
Trade-off: Introspection slower but detects revocation
```

**See §14 for detailed comparison.**

---

## 3. Introspection Endpoint

### 3.1 Endpoint Discovery

The introspection endpoint URL is published in the authorization server metadata:

```json
{
  "issuer": "https://auth.example.com",
  "introspection_endpoint": "https://auth.example.com/oauth2/introspect",
  "introspection_endpoint_auth_methods_supported": [
    "client_secret_basic",
    "client_secret_post",
    "private_key_jwt"
  ]
}
```

**Discovery URL:** `https://auth.example.com/.well-known/oauth-authorization-server`

**See:** `authorization-server-metadata.md` for complete metadata documentation.

### 3.2 Endpoint Characteristics

| Property | Value | Spec Reference |
|----------|-------|----------------|
| **HTTP Method** | POST | RFC 7662 §2.1 |
| **Content-Type** | application/x-www-form-urlencoded | RFC 7662 §2.1 |
| **Authentication** | REQUIRED | RFC 7662 §2.1 |
| **TLS** | REQUIRED | RFC 7662 §4 |
| **Typical URL** | `/oauth2/introspect` | Implementation-specific |

### 3.3 Authentication Methods

**RFC 7662 §2.1:** Clients MUST authenticate when making introspection requests.

**Supported Methods:**

| Method | Description | Usage |
|--------|-------------|-------|
| **client_secret_basic** | HTTP Basic Auth with client credentials | Most common |
| **client_secret_post** | Client credentials in POST body | Alternative |
| **private_key_jwt** | JWT signed with client private key | High security |
| **Bearer token** | Resource server uses access token | For resource servers |

**Example URL:**
```
https://auth.example.com/oauth2/introspect
```

---

## 4. Introspection Request (RFC 7662 §2.1)

### 4.1 Request Parameters

| Parameter | Required? | Description | Spec Reference |
|-----------|-----------|-------------|----------------|
| **token** | REQUIRED | The token to introspect | RFC 7662 §2.1 |
| **token_type_hint** | OPTIONAL | "access_token" or "refresh_token" | RFC 7662 §2.1 |

### 4.2 Request Format

**Content-Type:** `application/x-www-form-urlencoded`

**Authentication:** Client credentials (REQUIRED)

### 4.3 Example Requests

#### Example 1: Basic Authentication (Most Common)

```http
POST /oauth2/introspect HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW

token=2YotnFZFEjr1zCsicMWpAA&token_type_hint=access_token
```

**Authorization Header Breakdown:**
```
Original: client_id:client_secret
Example: s6BhdRkqt3:gX1fBat3bV
Base64: czZCaGRSa3F0MzpnWDFmQmF0M2JW
Header: Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW
```

#### Example 2: Client Credentials in POST Body

```http
POST /oauth2/introspect HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

token=2YotnFZFEjr1zCsicMWpAA&token_type_hint=access_token&client_id=s6BhdRkqt3&client_secret=gX1fBat3bV
```

#### Example 3: Resource Server Using Bearer Token

```http
POST /oauth2/introspect HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded
Authorization: Bearer resource_server_access_token_here

token=2YotnFZFEjr1zCsicMWpAA&token_type_hint=access_token
```

**Use Case:** Resource server has its own access token (client credentials grant) and uses it to authenticate introspection requests.

#### Example 4: Introspecting Refresh Token

```http
POST /oauth2/introspect HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW

token=8xLOxBtZp8&token_type_hint=refresh_token
```

### 4.4 token_type_hint Parameter

**Purpose:** Optimize token lookup (access tokens and refresh tokens may be stored differently).

**Values:**
- `"access_token"` - Hint that token is an access token
- `"refresh_token"` - Hint that token is a refresh token

**Behavior (RFC 7662 §2.1):**
- Authorization server SHOULD search hinted type first
- Authorization server MUST search other types if not found
- Hint is for optimization only, not restriction

**Example:**
```
token_type_hint=access_token

Authorization Server:
  1. Check access_token storage → Not found
  2. Check refresh_token storage → Found!
  3. Return metadata for refresh token
```

**See §15 for detailed token_type_hint behavior.**

---

## 5. Introspection Response (RFC 7662 §2.2)

### 5.1 Response Format

**HTTP Status:** 200 OK (even for inactive tokens)

**Content-Type:** `application/json`

**Critical:** Authorization server MUST return 200 OK for both active and inactive tokens. This prevents information disclosure about token validity to unauthorized callers.

### 5.2 Response Parameters

#### 5.2.1 REQUIRED Parameter

| Parameter | Type | Description | Spec Reference |
|-----------|------|-------------|----------------|
| **active** | Boolean | `true` if token is active, `false` otherwise | RFC 7662 §2.2 |

#### 5.2.2 OPTIONAL Parameters (if active=true)

| Parameter | Type | Description | Spec Reference |
|-----------|------|-------------|----------------|
| **scope** | String | Space-delimited scopes | RFC 7662 §2.2 |
| **client_id** | String | Client identifier | RFC 7662 §2.2 |
| **username** | String | Human-readable user identifier | RFC 7662 §2.2 |
| **token_type** | String | Type of token (e.g., "Bearer") | RFC 7662 §2.2 |
| **exp** | Number | Expiration time (NumericDate) | RFC 7662 §2.2 |
| **iat** | Number | Issuance time (NumericDate) | RFC 7662 §2.2 |
| **nbf** | Number | Not before time (NumericDate) | RFC 7662 §2.2 |
| **sub** | String | Subject identifier | RFC 7662 §2.2 |
| **aud** | String/Array | Audience(s) | RFC 7662 §2.2 |
| **iss** | String | Issuer identifier | RFC 7662 §2.2 |
| **jti** | String | JWT ID (unique identifier) | RFC 7662 §2.2 |

**Note:** Authorization servers MAY include additional custom fields.

### 5.3 Example Responses

#### Example 1: Active Access Token

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "active": true,
  "scope": "read:messages write:messages",
  "client_id": "client_abc123",
  "username": "alice@example.com",
  "token_type": "Bearer",
  "exp": 1735776000,
  "iat": 1735772400,
  "nbf": 1735772400,
  "sub": "user_12345",
  "aud": "https://api.example.com",
  "iss": "https://auth.example.com"
}
```

#### Example 2: Inactive Token (Expired)

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "active": false
}
```

**Note:** No additional metadata when `active=false`. This prevents information disclosure.

#### Example 3: Active Token with Custom Claims

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "active": true,
  "scope": "read:data write:data",
  "client_id": "client_xyz789",
  "username": "bob@corp.com",
  "token_type": "Bearer",
  "exp": 1735776000,
  "iat": 1735772400,
  "sub": "user_67890",
  "aud": "https://api.corp.com",
  "iss": "https://auth.corp.com",
  
  "organization_id": "org_12345",
  "department": "Engineering",
  "roles": ["admin", "developer"],
  "permissions": ["users:read", "users:write", "data:delete"]
}
```

#### Example 4: Active Refresh Token

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "active": true,
  "client_id": "client_abc123",
  "token_type": "refresh_token",
  "exp": 1738368000,
  "iat": 1735772400,
  "sub": "user_12345",
  "scope": "offline_access read:messages write:messages"
}
```

### 5.4 Response Parameter Details

#### 5.4.1 active (Boolean)

**Definition:** Indicates whether the token is currently active.

**Values:**
- `true` - Token is active and valid
- `false` - Token is inactive (expired, revoked, invalid, or unknown)

**Usage:**
```javascript
if (introspection_response.active === true) {
  // Token is valid, proceed with request
  // Extract claims (scope, sub, etc.)
} else {
  // Token is invalid
  // Return 401 Unauthorized
}
```

#### 5.4.2 scope (String)

**Format:** Space-delimited list of scopes

**Examples:**
```json
"scope": "read"
"scope": "read write"
"scope": "openid profile email"
"scope": "read:messages write:messages delete:messages"
```

**Usage:**
```javascript
const scopes = introspection_response.scope.split(' ');
if (scopes.includes('write:messages')) {
  // Client has write permission
}
```

#### 5.4.3 client_id (String)

**Definition:** Identifier of the client to whom the token was issued.

**Example:**
```json
"client_id": "client_abc123"
```

**Usage:** Identify which client is using the token, enforce client-specific policies.

#### 5.4.4 username (String)

**Definition:** Human-readable identifier for the resource owner who authorized the token.

**Examples:**
```json
"username": "alice@example.com"
"username": "alice"
"username": "Alice Smith"
```

**Note:** This is for human display only. Use `sub` for programmatic user identification.

#### 5.4.5 token_type (String)

**Common Values:**
- `"Bearer"` - Bearer token (RFC 6750)
- `"refresh_token"` - Refresh token
- `"access_token"` - Generic access token

**Example:**
```json
"token_type": "Bearer"
```

#### 5.4.6 exp, iat, nbf (NumericDate)

**Format:** Seconds since Unix epoch (1970-01-01T00:00:00Z)

**Examples:**
```json
"exp": 1735776000,  // 2025-01-02T00:00:00Z (expiration)
"iat": 1735772400,  // 2025-01-01T23:00:00Z (issued at)
"nbf": 1735772400   // 2025-01-01T23:00:00Z (not before)
```

**Usage:**
```javascript
const now = Math.floor(Date.now() / 1000);
const ttl = introspection_response.exp - now;
console.log(`Token expires in ${ttl} seconds`);
```

#### 5.4.7 sub (String)

**Definition:** Subject identifier - unique identifier for the resource owner.

**Examples:**
```json
"sub": "user_12345"
"sub": "248289761001"
```

**Usage:** Primary user identifier for authorization decisions.

#### 5.4.8 aud (String or Array)

**Definition:** Intended audience(s) for the token.

**Examples:**
```json
"aud": "https://api.example.com"
"aud": ["https://api.example.com", "https://api2.example.com"]
```

**Usage:** Validate token is intended for this resource server.

#### 5.4.9 iss (String)

**Definition:** Issuer identifier (authorization server that issued the token).

**Example:**
```json
"iss": "https://auth.example.com"
```

**Usage:** Verify token is from expected authorization server.

#### 5.4.10 jti (String)

**Definition:** JWT ID - unique identifier for the token.

**Example:**
```json
"jti": "550e8400-e29b-41d4-a716-446655440000"
```

**Usage:** Track specific tokens, detect replay attacks.

### 5.5 Complete Response Parameters Table

| Parameter | Type | Required? | Description | Example |
|-----------|------|-----------|-------------|---------|
| active | Boolean | YES | Token active status | `true` |
| scope | String | NO | Space-delimited scopes | `"read write"` |
| client_id | String | NO | Client identifier | `"client_abc123"` |
| username | String | NO | Human-readable user ID | `"alice@example.com"` |
| token_type | String | NO | Token type | `"Bearer"` |
| exp | Number | NO | Expiration time | `1735776000` |
| iat | Number | NO | Issued at time | `1735772400` |
| nbf | Number | NO | Not before time | `1735772400` |
| sub | String | NO | Subject identifier | `"user_12345"` |
| aud | String/Array | NO | Audience(s) | `"https://api.example.com"` |
| iss | String | NO | Issuer | `"https://auth.example.com"` |
| jti | String | NO | Token ID | `"550e8400-..."` |

---

## 6. Token Active Status Determination

The authorization server determines `active=true` if ALL of the following conditions are met:

### 6.1 Active Status Conditions

```
Token is ACTIVE if:
  ✅ Token exists in authorization server's database/cache
  ✅ Token has not been revoked
  ✅ Token has not expired (current_time < exp)
  ✅ Token is not before nbf time (current_time >= nbf)
  ✅ Token is valid for the requesting client (authorization check)

If ANY condition fails → active = false
```

### 6.2 Decision Flowchart

```
                Introspection Request Received
                          │
                          ▼
                ┌──────────────────┐
                │ Authenticate     │
                │ Caller           │
                └────────┬─────────┘
                         │
                  ┌──────▼──────┐
                  │ Find Token  │
                  │ in Database │
                  └──┬───────┬──┘
                     │       │
              Found  │       │ Not Found
                     │       │
                     ▼       ▼
            ┌──────────┐  ┌──────────────┐
            │ Check    │  │ Return       │
            │ Revoked? │  │ active=false │
            └────┬─────┘  └──────────────┘
                 │
          ┌──────┴──────┐
          │             │
     Not Revoked    Revoked
          │             │
          ▼             ▼
    ┌──────────┐  ┌──────────────┐
    │ Check    │  │ Return       │
    │ exp      │  │ active=false │
    └────┬─────┘  └──────────────┘
         │
    ┌────┴────┐
    │         │
Not Expired Expired
    │         │
    ▼         ▼
┌──────────┐  ┌──────────────┐
│ Check    │  │ Return       │
│ nbf      │  │ active=false │
└────┬─────┘  └──────────────┘
     │
┌────┴────┐
│         │
Valid  Not Valid
│         │
▼         ▼
┌──────────────┐  ┌──────────────┐
│ Check        │  │ Return       │
│ Authorization│  │ active=false │
└────┬─────────┘  └──────────────┘
     │
┌────┴────┐
│         │
Authorized Not Authorized
│         │
▼         ▼
┌──────────────┐  ┌──────────────┐
│ Return       │  │ Return       │
│ active=true  │  │ active=false │
│ + metadata   │  └──────────────┘
└──────────────┘
```

### 6.3 Reasons for active=false

| Reason | Example | Status Returned |
|--------|---------|-----------------|
| **Token not found** | Invalid token string | `{"active": false}` |
| **Token revoked** | User logged out | `{"active": false}` |
| **Token expired** | exp in past | `{"active": false}` |
| **Not yet valid** | nbf in future | `{"active": false}` |
| **Authorization failure** | Caller not authorized to introspect | `{"active": false}` |
| **Token malformed** | Cannot parse token | `{"active": false}` |

**IMPORTANT (RFC 7662 §2.2):** Authorization server SHOULD NOT indicate why token is inactive. Always return `{"active": false}` without details to prevent information disclosure.

### 6.4 Example Active Status Checks

**Scenario 1: Valid Token**
```
Token: "2YotnFZFEjr1zCsicMWpAA"
Database: Found
Revoked: No
exp: 1735776000 (future)
nbf: 1735772400 (past)
Authorization: Caller authorized

Result: {"active": true, ...metadata}
```

**Scenario 2: Expired Token**
```
Token: "2YotnFZFEjr1zCsicMWpAA"
Database: Found
Revoked: No
exp: 1735772000 (past)  ← Expired
nbf: 1735768400 (past)

Result: {"active": false}
```

**Scenario 3: Revoked Token**
```
Token: "2YotnFZFEjr1zCsicMWpAA"
Database: Found
Revoked: Yes  ← User logged out
exp: 1735776000 (future)
nbf: 1735772400 (past)

Result: {"active": false}
```

**Scenario 4: Unknown Token**
```
Token: "invalid_random_string"
Database: Not found  ← Token doesn't exist

Result: {"active": false}
```

---

## 7. Introspection Security Considerations (RFC 7662 §4)

### 7.1 Authentication Requirement (RFC 7662 §2.1)

**CRITICAL:** Authorization servers MUST require authentication for introspection requests.

**Rationale:**
- Prevents unauthorized parties from querying token metadata
- Protects user privacy (introspection reveals user information)
- Prevents token enumeration attacks

**Implementation:**
```
✅ CORRECT: Require client credentials
POST /introspect
Authorization: Basic <credentials>

❌ WRONG: Allow unauthenticated introspection
POST /introspect
(No authorization header)
```

### 7.2 Authorization and Access Control

**RFC 7662 §4:** Authorization servers MAY restrict which tokens a client can introspect.

**Authorization Strategies:**

| Strategy | Description | Use Case |
|----------|-------------|----------|
| **Own tokens only** | Client can introspect only tokens issued to it | Confidential clients |
| **All tokens** | Resource server can introspect any token | Resource servers |
| **Scope-based** | Based on introspection scope | Fine-grained control |
| **Audience-based** | Only tokens where aud matches | Multi-tenant systems |

**Example Policy:**
```
Client A introspects token:
  - Token issued to Client A: ✅ Allowed
  - Token issued to Client B: ❌ Denied
  
Resource Server introspects token:
  - Any token with aud=RS: ✅ Allowed
  - Token with different aud: ❌ Denied (return active=false)
```

### 7.3 Information Disclosure

**Risk:** Introspection responses contain sensitive user data.

**Mitigation:**

| Threat | Mitigation |
|--------|-----------|
| **User PII exposure** | Only return metadata to authorized callers |
| **Scope enumeration** | Limit scope details to need-to-know basis |
| **Client enumeration** | Don't reveal client_id to unauthorized callers |
| **Token validity leakage** | Return active=false without details |

**Example:**
```json
❌ BAD: Revealing why token is inactive
{
  "active": false,
  "error": "token_expired",
  "error_description": "Token expired on 2025-01-01T10:00:00Z"
}

✅ GOOD: No details for inactive token
{
  "active": false
}
```

### 7.4 Performance and DoS Protection

**Risk:** Introspection adds latency and server load.

**Mitigation Strategies:**

| Strategy | Description | Trade-off |
|----------|-------------|-----------|
| **Rate limiting** | Limit requests per client | May affect legitimate traffic |
| **Caching** | Cache positive responses (short TTL) | Delayed revocation detection |
| **Database indexing** | Index tokens for fast lookup | Storage overhead |
| **Request throttling** | Queue requests during high load | Increased latency |
| **Separate infrastructure** | Dedicated introspection servers | Operational complexity |

### 7.5 Caching Strategies

**Caching Introspection Results:**

```
✅ SAFE: Cache positive responses with short TTL
  GET token introspection result
  IF active=true:
      Cache for min(300 seconds, exp - now)
      Use cached result for subsequent requests
  
❌ UNSAFE: Cache negative responses
  IF active=false:
      DO NOT cache
      (Token might become active, or different caller might be authorized)

✅ SAFE: Cache key should be hash of token + caller identity
  cache_key = SHA256(token + client_id)
  This prevents cache poisoning
```

**Recommended TTL:**
```
cache_ttl = min(
  300 seconds,                    // Maximum 5 minutes
  token_exp - current_time,       // Don't exceed token lifetime
  introspection_response.exp - current_time
)
```

### 7.6 TLS Requirement

**RFC 7662 §4:** Introspection endpoints MUST use TLS.

**Rationale:**
- Protect tokens in transit
- Protect introspection metadata (user data)
- Prevent eavesdropping

**Implementation:**
```
✅ CORRECT:
https://auth.example.com/oauth2/introspect

❌ WRONG:
http://auth.example.com/oauth2/introspect
```

### 7.7 Security Best Practices Summary

| Practice | Importance | Specification |
|----------|-----------|---------------|
| ✅ Require TLS | CRITICAL | RFC 7662 §4 |
| ✅ Require authentication | CRITICAL | RFC 7662 §2.1 |
| ✅ Implement authorization | HIGH | RFC 7662 §4 |
| ✅ Rate limit requests | HIGH | Best practice |
| ✅ Cache carefully (positive only, short TTL) | MEDIUM | Best practice |
| ✅ Return active=false without details | HIGH | RFC 7662 §2.2 |
| ✅ Log introspection requests | MEDIUM | Audit/security |
| ✅ Monitor for anomalies | MEDIUM | Detect attacks |

---

## 8. Token Revocation (RFC 7009)

### 8.1 Purpose and Scope

Token revocation allows clients to notify the authorization server that a token is no longer needed and should be invalidated.

**Key Characteristics:**
- Immediate effect (token becomes inactive)
- Idempotent operation (safe to call multiple times)
- Applies to access tokens and refresh tokens

### 8.2 When to Use Revocation

| Scenario | Revoke What? | Why |
|----------|-------------|-----|
| **User logout** | Refresh token | Invalidate session, prevent new access tokens |
| **Password change** | All tokens for user | Security event, force re-authentication |
| **Suspicious activity** | Specific token(s) | Prevent further abuse |
| **Client deactivation** | All client tokens | Client no longer trusted |
| **User revokes consent** | Authorization-specific tokens | User withdrew permission |
| **Admin action** | User/client tokens | Policy enforcement |

### 8.3 Revocation vs Expiration

```
Expiration (Natural):
  - Token reaches exp time
  - Automatic, no action required
  - Predictable timeline
  - Cannot be prevented

Revocation (Explicit):
  - Manual invalidation
  - Immediate effect
  - Unpredictable timing
  - Requires server action
```

**Example:**
```
Access Token:
  Issued: 2025-01-01T10:00:00Z
  Expires: 2025-01-01T11:00:00Z (1 hour lifetime)
  
Scenario 1: Natural expiration
  Time: 2025-01-01T11:00:01Z
  Token: Inactive (expired)
  
Scenario 2: Early revocation
  Time: 2025-01-01T10:30:00Z (30 minutes after issuance)
  Action: Client calls revocation endpoint
  Token: Inactive (revoked)
  exp still shows 11:00:00Z, but token is revoked
```

---

## 9. Revocation Endpoint

### 9.1 Endpoint Discovery

The revocation endpoint URL is published in the authorization server metadata:

```json
{
  "issuer": "https://auth.example.com",
  "revocation_endpoint": "https://auth.example.com/oauth2/revoke",
  "revocation_endpoint_auth_methods_supported": [
    "client_secret_basic",
    "client_secret_post",
    "private_key_jwt"
  ]
}
```

### 9.2 Endpoint Characteristics

| Property | Value | Spec Reference |
|----------|-------|----------------|
| **HTTP Method** | POST | RFC 7009 §2.1 |
| **Content-Type** | application/x-www-form-urlencoded | RFC 7009 §2.1 |
| **Authentication** | REQUIRED | RFC 7009 §2.1 |
| **TLS** | REQUIRED | RFC 7009 §4 |
| **Typical URL** | `/oauth2/revoke` | Implementation-specific |

### 9.3 Authentication Requirements

**RFC 7009 §2.1:** The client MUST authenticate.

**Supported Methods:**
- client_secret_basic (HTTP Basic Auth)
- client_secret_post (POST body credentials)
- private_key_jwt (JWT assertion)

**Rationale:**
- Prevents unauthorized revocation
- Associates revocation with specific client
- Audit trail

**Example URL:**
```
https://auth.example.com/oauth2/revoke
```

---

## 10. Revocation Request (RFC 7009 §2.1)

### 10.1 Request Parameters

| Parameter | Required? | Description | Spec Reference |
|-----------|-----------|-------------|----------------|
| **token** | REQUIRED | The token to revoke | RFC 7009 §2.1 |
| **token_type_hint** | OPTIONAL | "access_token" or "refresh_token" | RFC 7009 §2.1 |

### 10.2 Request Format

**Content-Type:** `application/x-www-form-urlencoded`

**Authentication:** Client credentials (REQUIRED)

### 10.3 Example Requests

#### Example 1: Revoke Refresh Token (User Logout)

```http
POST /oauth2/revoke HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW

token=8xLOxBtZp8&token_type_hint=refresh_token
```

**Scenario:** User clicks "Logout", client revokes refresh token.

#### Example 2: Revoke Access Token

```http
POST /oauth2/revoke HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW

token=2YotnFZFEjr1zCsicMWpAA&token_type_hint=access_token
```

**Scenario:** User removes app authorization, client revokes current access token.

#### Example 3: Client Credentials in POST Body

```http
POST /oauth2/revoke HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

token=8xLOxBtZp8&token_type_hint=refresh_token&client_id=s6BhdRkqt3&client_secret=gX1fBat3bV
```

#### Example 4: Revoke Without Hint

```http
POST /oauth2/revoke HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW

token=45ghiukldjahdnhzdauz
```

**Note:** Without `token_type_hint`, authorization server searches all token types.

### 10.4 Client Authentication

**RFC 7009 §2.1:** Clients MUST authenticate when revoking tokens.

**Purpose:**
- Verify client is authorized to revoke the token
- Prevent unauthorized revocation by attackers
- Audit trail (track who revoked what)

**Authorization:**
```
Client A attempts to revoke token:
  - Token issued to Client A: ✅ Allowed
  - Token issued to Client B: ❌ Denied (401 or 200 with no action)

Authorization server behavior:
  - Verify client is authorized to revoke this token
  - Typically: Client can only revoke its own tokens
```

---

## 11. Revocation Response (RFC 7009 §2.2)

### 11.1 Success Response

**HTTP Status:** 200 OK

**Response Body:** Empty (or minimal JSON)

**Critical (RFC 7009 §2.2):** The authorization server responds with HTTP status 200 even if the token was already inactive or if the client submitted an invalid token.

**Rationale:** Prevents information disclosure about token validity.

#### Example Success Responses

**Example 1: Empty Body (Most Common)**
```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

```

**Example 2: Minimal JSON**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{}
```

**Example 3: Confirmation Message (Non-standard)**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "revoked": true
}
```

**Note:** Example 3 is non-standard. RFC 7009 doesn't require any response body.

### 11.2 Idempotent Operation

**RFC 7009 §2.2:** The revocation endpoint MUST be idempotent.

**Behavior:**
```
First call:
  POST /revoke
  token=abc123
  Result: 200 OK (token revoked)

Second call (same token):
  POST /revoke
  token=abc123
  Result: 200 OK (token already revoked, no action)

Third call (same token):
  POST /revoke
  token=abc123
  Result: 200 OK (still returns success)
```

**Implementation:**
```
FUNCTION revoke_token(token, client):
    IF token exists AND issued to client:
        mark_as_revoked(token)
    # Always return 200 OK
    RETURN 200 OK
```

### 11.3 Error Responses

**Error responses are rare.** Most failures return 200 OK.

| HTTP Status | Error Code | Description | Spec Reference |
|-------------|-----------|-------------|----------------|
| 400 | invalid_request | Malformed request (missing token parameter) | RFC 6749 §5.2 |
| 401 | invalid_client | Client authentication failed | RFC 6749 §5.2 |
| 503 | — | Service temporarily unavailable | HTTP spec |

#### Example Error Responses

**Example 1: Missing token Parameter**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "invalid_request",
  "error_description": "The request is missing the required parameter 'token'"
}
```

**Example 2: Client Authentication Failed**
```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Basic realm="OAuth2 Revocation"
Content-Type: application/json

{
  "error": "invalid_client",
  "error_description": "Client authentication failed"
}
```

**Example 3: Service Unavailable**
```http
HTTP/1.1 503 Service Unavailable
Retry-After: 300

{
  "error": "temporarily_unavailable",
  "error_description": "The authorization server is currently unable to handle the request"
}
```

### 11.4 Information Disclosure Prevention

**Why 200 OK for all tokens?**

```
❌ BAD: Different responses for valid vs invalid tokens
  Valid token: 200 OK
  Invalid token: 404 Not Found
  
  Attacker learns: Token exists or doesn't exist

✅ GOOD: Same response for all tokens
  Valid token: 200 OK
  Invalid token: 200 OK
  Already revoked: 200 OK
  
  Attacker learns: Nothing
```

**RFC 7009 §2.2:** "The authorization server validates the client credentials and verifies whether the token was issued to the client making the revocation request. If this validation fails, the request is refused and the client is informed of the error."

**However:** If validation succeeds but token is invalid/unknown, still return 200 OK.

---

## 12. Cascade Revocation Behavior

### 12.1 Refresh Token Revocation (RFC 7009 §2.1)

**When refresh token is revoked:**

**RECOMMENDED Behavior:** Revoke all associated access tokens.

**Rationale:**
- Refresh token represents the authorization grant
- Revoking grant should revoke all derived tokens
- Ensures complete session termination

**Example:**
```
User Authorization:
  Refresh Token: rt_12345
  Access Token 1: at_abc (expires 11:00)
  Access Token 2: at_def (expires 11:15)
  Access Token 3: at_ghi (expires 11:30)

User logs out → Client revokes rt_12345:
  Authorization server:
    1. Mark rt_12345 as revoked
    2. Mark at_abc as revoked    ← Cascade
    3. Mark at_def as revoked    ← Cascade
    4. Mark at_ghi as revoked    ← Cascade
    5. Return 200 OK

  Result: All tokens from this authorization are now inactive
```

### 12.2 Access Token Revocation

**When access token is revoked:**

**Two Approaches:**

| Approach | Behavior | Trade-off |
|----------|----------|-----------|
| **Conservative** | Keep refresh token active | User can get new access tokens |
| **Aggressive** | Revoke refresh token too | Complete session termination |

**RFC 7009 does not mandate either approach.**

**Conservative Example:**
```
Revoke at_abc:
  Authorization server:
    1. Mark at_abc as revoked
    2. Keep rt_12345 active
    3. Keep other access tokens active

  User can refresh to get new access token
```

**Aggressive Example:**
```
Revoke at_abc:
  Authorization server:
    1. Mark at_abc as revoked
    2. Mark rt_12345 as revoked  ← Cascade
    3. Mark all access tokens as revoked

  User must re-authenticate
```

### 12.3 Token Family Concept

**Token Family:** All tokens derived from a single authorization.

```
User Authorization (family: auth_xyz):
  ┌─ Refresh Token: rt_12345
  ├─ Access Token 1: at_abc
  ├─ Access Token 2: at_def
  └─ Access Token 3: at_ghi

Revoke family:
  Mark all tokens in family as revoked
```

### 12.4 Implementation Strategies

| Strategy | Revoke RT | Revoke AT | Complexity | Use Case |
|----------|-----------|-----------|------------|----------|
| **Conservative** | RT + associated ATs | AT only | Low | Standard apps |
| **Aggressive** | RT + all ATs | AT + RT + all ATs | Medium | High security |
| **Family-based** | Entire token family | Entire token family | High | Enterprise |
| **Selective** | RT + ATs from last N days | AT only | High | Complex scenarios |

**Recommendation:** Start with conservative for RT, selective for AT. Adjust based on security requirements.

### 12.5 Example Scenarios

#### Scenario 1: User Logout (Refresh Token Revocation)

```
Request:
  POST /revoke
  token=rt_12345&token_type_hint=refresh_token

Authorization Server Action:
  1. Find rt_12345
  2. Mark rt_12345 as revoked
  3. Find all access tokens for same authorization
  4. Mark all access tokens as revoked
  5. Return 200 OK

Result:
  - Refresh token: Inactive
  - All access tokens: Inactive
  - User must re-authenticate to get new tokens
```

#### Scenario 2: Suspicious Activity (Access Token Revocation)

```
Request:
  POST /revoke
  token=at_abc&token_type_hint=access_token

Authorization Server Action (Conservative):
  1. Find at_abc
  2. Mark at_abc as revoked
  3. Keep rt_12345 active
  4. Return 200 OK

Result:
  - Suspicious access token: Inactive
  - Refresh token: Still active
  - User can get new access token via refresh
```

#### Scenario 3: Password Change (All Tokens)

```
Security Event: User changed password

Authorization Server Action:
  1. Find all tokens for user (user_id=123)
  2. Mark all refresh tokens as revoked
  3. Mark all access tokens as revoked
  4. Return (no revocation API call, server-side action)

Result:
  - All user sessions terminated
  - User must re-authenticate with new password
```

---

## 13. Revocation for Different Token Types

### 13.1 Opaque Tokens

**Revocation:** Simple and immediate.

**Implementation:**
```sql
-- Token storage (opaque)
CREATE TABLE access_tokens (
  token_value VARCHAR(255) PRIMARY KEY,
  client_id VARCHAR(255),
  user_id VARCHAR(255),
  scope TEXT,
  exp TIMESTAMP,
  revoked BOOLEAN DEFAULT FALSE
);

-- Revocation
UPDATE access_tokens
SET revoked = TRUE
WHERE token_value = 'abc123';

-- Introspection
SELECT * FROM access_tokens
WHERE token_value = 'abc123'
  AND revoked = FALSE
  AND exp > NOW();
```

**Characteristics:**
- ✅ Immediate revocation detection
- ✅ Simple implementation
- ✅ Introspection required for validation
- ❌ Every validation requires database/cache lookup

### 13.2 JWT Tokens

**Challenge:** JWTs are self-contained and validated locally.

**Problem:**
```
JWT Token:
  Header: {"alg":"RS256"}
  Payload: {"sub":"user_123","exp":1735776000}
  Signature: (valid)

Resource Server:
  1. Verify signature: ✅ Valid
  2. Check exp: ✅ Not expired
  3. Accept token: ✅
  
Problem: Resource server doesn't know token was revoked!
```

**Solutions:**

#### Solution 1: Revocation List (jti Tracking)

```
JWT includes jti claim:
  {"jti":"550e8400-e29b-41d4-a716","exp":1735776000}

Revocation:
  1. Add jti to revocation list (Redis/database)
  2. TTL = token expiration

Validation:
  1. Verify JWT signature ✅
  2. Check jti not in revocation list ✅
  3. Check exp ✅
  4. Accept token
```

**Implementation:**
```javascript
// Revocation
await redis.setex(
  `revoked:${jti}`,
  ttl_seconds,
  'true'
);

// Validation
const isRevoked = await redis.exists(`revoked:${jti}`);
if (isRevoked) {
  return 401; // Token revoked
}
```

**Trade-off:** Requires database/cache lookup (loses JWT statelessness).

#### Solution 2: Require Introspection

```
Despite JWT format, require introspection:
  1. Resource server calls introspection endpoint
  2. Authorization server checks revocation status
  3. Returns active=true/false
```

**Trade-off:** Network call for every request (slow).

#### Solution 3: Short Expiration Times

```
JWT with short exp:
  exp = issued_at + 5_minutes

Revocation window: Maximum 5 minutes

Strategy:
  - Accept cannot detect revocation immediately
  - Rely on short exp to limit exposure
  - Revoke refresh token to prevent new access tokens
```

**Trade-off:** More frequent token refreshes, limited revocation window.

#### Solution 4: Hybrid Approach

```
Normal requests:
  - Validate JWT locally (fast)

High-value operations:
  - Introspect JWT (check revocation)

Example:
  GET /api/messages: JWT validation only
  POST /api/transfer_funds: JWT + introspection
```

**Trade-off:** Complexity, but balanced performance and security.

### 13.3 Comparison Table

| Token Type | Revocation Method | Detection Speed | Performance | Statelessness |
|------------|------------------|-----------------|-------------|---------------|
| **Opaque** | Database flag | Immediate | Requires lookup | Stateful |
| **JWT + jti list** | Revocation list | Immediate | Requires lookup | Hybrid |
| **JWT + introspection** | Introspection endpoint | Immediate | Slow (network) | Hybrid |
| **JWT + short exp** | Wait for expiration | Delayed (up to exp) | Fast | Stateless |

### 13.4 Recommendation by Use Case

| Use Case | Recommendation | Rationale |
|----------|---------------|-----------|
| **High-security API** | Opaque or JWT + jti list | Real-time revocation critical |
| **Standard web app** | JWT + short exp (15 min) | Balance performance and security |
| **Internal microservices** | JWT + short exp | Performance priority |
| **Financial transactions** | JWT + introspection | Critical operations need verification |
| **Public API** | JWT + medium exp (60 min) | Scalability priority |

---

## 14. Introspection vs Local JWT Validation

### 14.1 Detailed Comparison

| Aspect | Introspection | JWT Local Validation |
|--------|--------------|---------------------|
| **Token Type** | Any (opaque or JWT) | JWT only |
| **Latency** | 50-200ms (network call) | <5ms (local) |
| **Network Dependency** | Yes (every validation) | No (after JWKS fetch) |
| **Revocation Detection** | Real-time | None (until exp) |
| **Server Load** | High (introspection endpoint) | Low (resource server only) |
| **Scalability** | Limited (bottleneck at AS) | High (stateless) |
| **Implementation Complexity** | Low (simple HTTP call) | Medium (JWT library, JWKS) |
| **Caching** | Can cache (short TTL) | No caching needed |
| **Database Dependency** | Yes (token lookup) | No |
| **Claims Availability** | From introspection response | From JWT payload |
| **Token Size Impact** | None | Large tokens = overhead |

### 14.2 Performance Comparison

**Introspection:**
```
Token Validation Timeline:
  t=0ms:   Receive request with token
  t=2ms:   Extract token from Authorization header
  t=5ms:   Initiate introspection HTTP call
  t=60ms:  Introspection response received
  t=62ms:  Parse JSON response
  t=63ms:  Check active=true
  t=65ms:  Extract claims (scope, sub, etc.)
  t=67ms:  Continue with business logic
  
Total: ~67ms overhead
```

**JWT Local Validation:**
```
Token Validation Timeline:
  t=0ms:   Receive request with token
  t=1ms:   Extract token from Authorization header
  t=2ms:   Decode JWT (base64url)
  t=3ms:   Fetch public key from cache (or JWKS)
  t=4ms:   Verify signature
  t=5ms:   Validate exp, iss, aud claims
  t=6ms:   Extract claims from payload
  t=7ms:   Continue with business logic
  
Total: ~7ms overhead
```

**Performance Gain:** ~90% faster (7ms vs 67ms)

### 14.3 Decision Flowchart

```
                  Token Received
                       │
                       ▼
                ┌─────────────┐
                │ Token Type? │
                └──────┬──────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
    ┌─────────┐               ┌──────────┐
    │ Opaque  │               │   JWT    │
    └────┬────┘               └────┬─────┘
         │                         │
         ▼                         ▼
    ┌──────────────┐        ┌──────────────────┐
    │ INTROSPECT   │        │ Critical         │
    │ (only option)│        │ Operation?       │
    └──────────────┘        └────┬─────────┬───┘
                                 │         │
                            YES  │         │ NO
                                 │         │
                                 ▼         ▼
                          ┌─────────┐  ┌──────────────┐
                          │INTROSPECT│  │ Local JWT    │
                          │(check    │  │ Validation   │
                          │revocation)│  │(fast)        │
                          └─────────┘  └──────────────┘
```

### 14.4 Hybrid Strategies

#### Strategy 1: Operation-Based

```javascript
function validateToken(token, operation) {
  const criticalOps = ['transfer_funds', 'delete_account', 'change_password'];
  
  if (operation in criticalOps) {
    // Critical operation: Introspect to check revocation
    return introspectToken(token);
  } else {
    // Normal operation: Local JWT validation
    return validateJwtLocally(token);
  }
}
```

#### Strategy 2: Cache-Assisted Introspection

```javascript
async function validateToken(token) {
  // Check cache first
  const cached = await cache.get(`introspect:${hashToken(token)}`);
  if (cached) {
    return cached; // Use cached introspection result
  }
  
  // Cache miss: Introspect
  const result = await introspectToken(token);
  
  // Cache positive results only
  if (result.active) {
    const ttl = Math.min(300, result.exp - now());
    await cache.setex(`introspect:${hashToken(token)}`, ttl, result);
  }
  
  return result;
}
```

#### Strategy 3: Periodic Verification

```javascript
async function validateToken(token) {
  // Always validate JWT locally
  const jwtValid = await validateJwtLocally(token);
  if (!jwtValid) {
    return false;
  }
  
  // Periodically check revocation (1% of requests)
  if (Math.random() < 0.01) {
    const introspection = await introspectToken(token);
    if (!introspection.active) {
      // Token revoked! Add to local revocation list
      await addToRevocationList(token.jti);
      return false;
    }
  }
  
  return true;
}
```

### 14.5 Use Case Recommendations

| Use Case | Strategy | Rationale |
|----------|----------|-----------|
| **Opaque tokens** | Always introspect | No alternative |
| **JWTs, normal operations** | Local validation | Performance |
| **JWTs, high-value operations** | Introspect | Security |
| **JWTs, very high traffic** | Local + cache | Balance |
| **JWTs with short exp (5-15 min)** | Local only | Revocation window acceptable |
| **JWTs with long exp (hours)** | Introspect or jti list | Revocation important |

---

## 15. token_type_hint Parameter

### 15.1 Purpose

The `token_type_hint` parameter optimizes token lookup by indicating the expected token type.

**Rationale:**
- Access tokens and refresh tokens may be stored separately
- Searching the correct store first improves performance
- Hint reduces database queries

### 15.2 Supported Values

| Value | Description | Use Case |
|-------|-------------|----------|
| `"access_token"` | Token is an access token | Introspecting access token |
| `"refresh_token"` | Token is a refresh token | Revoking refresh token on logout |

### 15.3 Authorization Server Behavior (RFC 7662 §2.1, RFC 7009 §2.1)

**SHOULD:** Search hinted type first.
**MUST:** Search other types if not found.

**Algorithm:**
```
FUNCTION find_token(token_value, hint):
    IF hint == "access_token":
        token = search_access_tokens(token_value)
        IF token found:
            RETURN token
        ELSE:
            token = search_refresh_tokens(token_value)
            RETURN token
    
    ELSE IF hint == "refresh_token":
        token = search_refresh_tokens(token_value)
        IF token found:
            RETURN token
        ELSE:
            token = search_access_tokens(token_value)
            RETURN token
    
    ELSE: # No hint
        token = search_access_tokens(token_value)
        IF token found:
            RETURN token
        token = search_refresh_tokens(token_value)
        RETURN token
```

### 15.4 Performance Impact

**With Hint (Correct):**
```
Token: refresh_token "8xLOxBtZp8"
Hint: token_type_hint=refresh_token

Database Queries:
  1. SELECT * FROM refresh_tokens WHERE value='8xLOxBtZp8' → Found!

Result: 1 query
```

**With Hint (Incorrect):**
```
Token: refresh_token "8xLOxBtZp8"
Hint: token_type_hint=access_token (wrong!)

Database Queries:
  1. SELECT * FROM access_tokens WHERE value='8xLOxBtZp8' → Not found
  2. SELECT * FROM refresh_tokens WHERE value='8xLOxBtZp8' → Found!

Result: 2 queries
```

**Without Hint:**
```
Token: refresh_token "8xLOxBtZp8"
Hint: (none)

Database Queries:
  1. SELECT * FROM access_tokens WHERE value='8xLOxBtZp8' → Not found
  2. SELECT * FROM refresh_tokens WHERE value='8xLOxBtZp8' → Found!

Result: 2 queries
```

**Recommendation:** Always include correct hint when known.

### 15.5 Client Best Practices

```javascript
✅ GOOD: Include hint when known

// Revoking refresh token (logout)
revokeToken(refreshToken, 'refresh_token');

// Introspecting access token
introspectToken(accessToken, 'access_token');

⚠️ ACCEPTABLE: No hint (worse performance)
revokeToken(someToken);  // Server will search both types

❌ WRONG: Include wrong hint
revokeToken(refreshToken, 'access_token');  // Misleading, slower
```

---

## 16. Security Threat Model

### 16.1 Threat: Unauthorized Introspection

**Attack Vector:** Attacker queries introspection endpoint without authentication to gather token metadata.

**Attack Scenario:**
```
Attacker captures token: "2YotnFZFEjr1zCsicMWpAA"

Attacker attempts introspection:
  POST /introspect
  token=2YotnFZFEjr1zCsicMWpAA
  (No authentication)

Vulnerable Server:
  - Accepts request without authentication
  - Returns token metadata:
    {
      "active": true,
      "scope": "admin",
      "username": "alice@example.com",
      "sub": "user_123"
    }

Attacker learns:
  - Token is valid
  - User is alice@example.com
  - Token has admin scope
```

**Vulnerability Mode:** `UNAUTHENTICATED_INTROSPECTION`

**Demonstration (Vuln Mode Enabled):**
```
Request:
POST /introspect HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

token=2YotnFZFEjr1zCsicMWpAA

Server with UNAUTHENTICATED_INTROSPECTION:
  1. Receive request
  2. Authentication check: ⚠️ SKIPPED
  3. Look up token: Found
  4. Return metadata: ✅

Response:
{
  "active": true,
  "username": "alice@example.com",
  "scope": "admin delete:users"
}

Result: Attacker obtains sensitive metadata ✅ (vulnerability!)
```

**Mitigation:**
```
✅ CORRECT: Require authentication

Authorization Server:
  IF request missing authentication:
      RETURN 401 Unauthorized
  
  IF authentication invalid:
      RETURN 401 Unauthorized
  
  # Continue with introspection

Implementation:
POST /introspect
Authorization: Basic <client_credentials>
token=2YotnFZFEjr1zCsicMWpAA
```

**Validation:**
```
MUST require client authentication (RFC 7662 §2.1)
MUST return 401 if authentication missing/invalid
SHOULD use client_secret_basic or stronger method
```

---

### 16.2 Threat: Token Metadata Disclosure

**Attack Vector:** Introspection reveals sensitive user data to unauthorized clients.

**Attack Scenario:**
```
Client A introspects token issued to Client B:
  POST /introspect
  Authorization: Basic <Client A credentials>
  token=<Client B's token>

Vulnerable Server:
  - Authenticates Client A: ✅
  - Does NOT check authorization: ⚠️
  - Returns metadata for Client B's token:
    {
      "active": true,
      "username": "bob@example.com",
      "scope": "read:private_data",
      "email": "bob@example.com",
      "phone": "+1-555-1234"
    }

Client A learns:
  - User identity (bob@example.com)
  - Phone number
  - Scopes
```

**Vulnerability Mode:** `VERBOSE_INTROSPECTION`

**Demonstration (Vuln Mode Enabled):**
```
Token issued to: Client B
Token contains: User PII

Client A introspects:
POST /introspect
Authorization: Basic <Client A credentials>
token=<Client B's token>

Server with VERBOSE_INTROSPECTION:
  1. Authenticate Client A: ✅
  2. Authorization check: ⚠️ SKIPPED (should verify Client A authorized)
  3. Return full metadata: ✅

Response:
{
  "active": true,
  "username": "bob@example.com",
  "email": "bob@example.com",
  "phone": "+1-555-1234",
  "address": "123 Main St, City, State",
  "ssn_last4": "1234",
  "account_balance": 50000
}

Result: Unauthorized PII disclosure ✅ (vulnerability!)
```

**Mitigation:**
```
✅ CORRECT: Implement authorization

Authorization Server:
  IF client not authorized to introspect this token:
      RETURN {"active": false}  # Don't reveal why
  
  IF authorized:
      RETURN full metadata

Authorization Policy Examples:
  - Client can only introspect own tokens
  - Resource servers can introspect any token for their audience
  - Admin clients can introspect all tokens
```

**Validation:**
```
SHOULD implement authorization checks
SHOULD limit metadata to authorized callers
MUST NOT reveal sensitive data to unauthorized clients
MAY return active=false without details if not authorized
```

---

### 16.3 Threat: Revocation Bypass (JWT without Introspection)

**Attack Vector:** Revoked JWT still validates at resource server that only performs local validation.

**Attack Scenario:**
```
1. User authenticates, receives JWT access token:
   Header: {"alg":"RS256"}
   Payload: {"sub":"user_123","exp":1735780000}

2. User logs out → Client revokes token:
   POST /revoke
   token=<JWT>
   
3. Authorization server marks token as revoked

4. Attacker uses revoked JWT at resource server:
   GET /api/data
   Authorization: Bearer <revoked JWT>

5. Resource server (vulnerable):
   - Verify JWT signature: ✅ Valid
   - Check exp: ✅ Not expired
   - Accept token: ✅
   - Grant access: ✅

Problem: Resource server doesn't know token was revoked!
```

**Vulnerability Mode:** `JWT_VALIDATION_ONLY`

**Demonstration (Vuln Mode Enabled):**
```
JWT Token:
  {"jti":"abc123","sub":"user_123","exp":1735780000}
  (Signed, valid signature)

Server Action:
  Token revoked (jti "abc123" added to revocation list)

Resource Server with JWT_VALIDATION_ONLY:
  1. Receive request with JWT
  2. Verify signature: ✅ Valid
  3. Check exp: ✅ Not expired (exp in future)
  4. Revocation check: ⚠️ SKIPPED
  5. Accept token: ✅

Result: Revoked token still works ✅ (vulnerability!)
```

**Mitigation:**
```
✅ Option 1: Introspect JWTs for critical operations

FUNCTION validate_token(jwt, operation):
    # Always verify signature
    IF NOT verify_signature(jwt):
        RETURN invalid
    
    # For critical operations, introspect
    IF operation in CRITICAL_OPERATIONS:
        result = introspect(jwt)
        IF NOT result.active:
            RETURN invalid
    
    RETURN valid

✅ Option 2: Maintain revocation list (jti claims)

Revocation:
  redis.sadd('revoked_tokens', jti)
  redis.expire('revoked_tokens', token_exp - now)

Validation:
  IF redis.sismember('revoked_tokens', jwt.jti):
      RETURN invalid

✅ Option 3: Short JWT expiration times

JWT exp: 5-15 minutes
  - Revocation window: Maximum 15 minutes
  - Revoke refresh token to prevent new access tokens
  - Accept limited revocation window
```

**Validation:**
```
SHOULD introspect JWTs for high-value operations
SHOULD maintain jti revocation list if real-time revocation required
MUST use short exp times if relying on expiration
MAY accept revocation delay if exp is short
```

---

### 16.4 Threat: Revocation DoS

**Attack Vector:** Attacker repeatedly calls revocation endpoint to overload authorization server.

**Attack Scenario:**
```
Attacker:
  FOR i = 1 to 1,000,000:
      POST /revoke
      Authorization: Basic <compromised credentials>
      token=random_token_${i}

Authorization Server (vulnerable):
  - Accepts all requests
  - Searches database for each token
  - Database overloaded
  - Legitimate requests fail
```

**Vulnerability Mode:** `NO_RATE_LIMIT_REVOCATION`

**Demonstration (Vuln Mode Enabled):**
```
Attacker script:
  while True:
      requests.post(
          'https://auth.example.com/revoke',
          auth=('client', 'secret'),
          data={'token': generate_random_token()}
      )

Server with NO_RATE_LIMIT_REVOCATION:
  1. Receive request: ✅
  2. Rate limit check: ⚠️ SKIPPED
  3. Search database: ✅ (expensive query)
  4. Return 200 OK: ✅

Result: Database saturated, service degraded ✅ (vulnerability!)
```

**Mitigation:**
```
✅ CORRECT: Implement rate limiting

Rate Limit Configuration:
  - Per client: 10 revocations per minute
  - Per IP: 100 revocations per minute
  - Global: 10,000 revocations per minute

Implementation:
  IF rate_limit_exceeded(client_id):
      RETURN 429 Too Many Requests
      Retry-After: 60

Additional Protections:
  - CAPTCHA for repeated failures
  - Account lockout after excessive attempts
  - Monitor for abuse patterns
  - Require client authentication (prevents anonymous abuse)
```

**Validation:**
```
MUST implement rate limiting
SHOULD monitor for abuse patterns
SHOULD require client authentication (RFC 7009 §2.1)
MAY implement CAPTCHA for suspicious activity
```

---

### 16.5 Threat: Information Leakage via Revocation Response

**Attack Vector:** Different responses reveal whether token exists.

**Attack Scenario:**
```
Attacker wants to know if token "abc123" exists:

Attempt 1:
  POST /revoke
  token=abc123

Vulnerable Server:
  - Token exists → 200 OK
  - Token doesn't exist → 404 Not Found

Attacker learns: Token exists

Attempt 2:
  POST /revoke
  token=xyz789

Server:
  - 404 Not Found

Attacker learns: Token doesn't exist

Attacker can enumerate valid tokens
```

**Vulnerability Mode:** `DESCRIPTIVE_REVOCATION_ERRORS`

**Demonstration (Vuln Mode Enabled):**
```
Request 1 (valid token):
POST /revoke
token=valid_token_123

Server with DESCRIPTIVE_REVOCATION_ERRORS:
HTTP/1.1 200 OK
{
  "message": "Token successfully revoked"
}

Request 2 (invalid token):
POST /revoke
token=invalid_xyz_789

Server with DESCRIPTIVE_REVOCATION_ERRORS:
HTTP/1.1 404 Not Found
{
  "error": "token_not_found",
  "message": "The specified token does not exist"
}

Result: Attacker can enumerate valid tokens ✅ (vulnerability!)
```

**Mitigation:**
```
✅ CORRECT: Always return 200 OK (RFC 7009 §2.2)

Authorization Server:
  FUNCTION revoke_token(token, client):
      IF token exists AND issued to client:
          mark_as_revoked(token)
      ELSE IF token doesn't exist:
          # Still return success
          pass
      ELSE IF token issued to different client:
          # Still return success (don't reveal)
          pass
      
      RETURN 200 OK  # Always

Implementation:
POST /revoke
token=<any_value>

Response (always):
HTTP/1.1 200 OK
```

**Validation:**
```
MUST return 200 OK for all revocation attempts (RFC 7009 §2.2)
MUST NOT reveal whether token exists
MUST NOT reveal whether token was already revoked
MAY log attempts for security monitoring
```

---

### 16.6 Security Threat Summary

| Threat | Attack | Vuln Mode | Mitigation | Spec Reference |
|--------|--------|-----------|------------|----------------|
| **Unauthorized Introspection** | Query without auth | `UNAUTHENTICATED_INTROSPECTION` | Require authentication | RFC 7662 §2.1 |
| **Metadata Disclosure** | Introspect other's tokens | `VERBOSE_INTROSPECTION` | Implement authorization | RFC 7662 §4 |
| **Revocation Bypass** | Use revoked JWT | `JWT_VALIDATION_ONLY` | Introspect or jti list or short exp | Best practice |
| **Revocation DoS** | Flood revocation endpoint | `NO_RATE_LIMIT_REVOCATION` | Rate limiting | Best practice |
| **Information Leakage** | Enumerate tokens | `DESCRIPTIVE_REVOCATION_ERRORS` | Always return 200 OK | RFC 7009 §2.2 |

---

## 17. Implementation Requirements Checklist

### 17.1 Authorization Server MUST

| # | Requirement | Spec Reference |
|---|-------------|----------------|
| AS1 | Require authentication for introspection endpoint | RFC 7662 §2.1 |
| AS2 | Require authentication for revocation endpoint | RFC 7009 §2.1 |
| AS3 | Return HTTP 200 OK for introspection (active and inactive) | RFC 7662 §2.2 |
| AS4 | Return HTTP 200 OK for revocation (valid and invalid tokens) | RFC 7009 §2.2 |
| AS5 | Include `active` field in introspection response | RFC 7662 §2.2 |
| AS6 | Make revoked tokens immediately inactive | RFC 7009 §1 |
| AS7 | Use TLS for introspection endpoint | RFC 7662 §4 |
| AS8 | Use TLS for revocation endpoint | RFC 7009 §4 |
| AS9 | Search all token types if token_type_hint doesn't match | RFC 7662 §2.1, RFC 7009 §2.1 |

### 17.2 Authorization Server SHOULD

| # | Requirement | Spec Reference |
|---|-------------|----------------|
| AS10 | Cascade revoke access tokens when refresh token revoked | RFC 7009 §2.1 |
| AS11 | Implement authorization for introspection requests | RFC 7662 §4 |
| AS12 | Rate limit introspection and revocation requests | Best practice |
| AS13 | Cache introspection results carefully (short TTL) | Best practice |
| AS14 | Use token_type_hint to optimize lookup | RFC 7662 §2.1 |
| AS15 | Not reveal why token is inactive | RFC 7662 §2.2 |
| AS16 | Publish introspection_endpoint in metadata | OAuth Discovery |
| AS17 | Publish revocation_endpoint in metadata | OAuth Discovery |

### 17.3 Resource Server SHOULD

| # | Requirement | Reasoning |
|---|-------------|-----------|
| RS1 | Use introspection for opaque tokens | Only validation method |
| RS2 | Cache introspection responses (TTL < token exp) | Reduce latency, server load |
| RS3 | Handle introspection endpoint failures gracefully | Resilience |
| RS4 | Validate JWT locally for normal operations | Performance |
| RS5 | Introspect JWTs for high-value operations | Security (detect revocation) |
| RS6 | Include token_type_hint when known | Optimize lookup |

### 17.4 Client SHOULD

| # | Requirement | Reasoning |
|---|-------------|-----------|
| C1 | Revoke refresh token on user logout | Security |
| C2 | Include token_type_hint in requests | Optimize lookup |
| C3 | Handle revocation errors gracefully | UX |
| C4 | Not assume revocation succeeded based on 200 OK | Idempotent operation |
| C5 | Use cascade revocation for logout | Complete session termination |

---

## 18. Discovery and Metadata

### 18.1 Authorization Server Metadata Fields

| Field | Type | Description | Spec Reference |
|-------|------|-------------|----------------|
| **introspection_endpoint** | String | URL of introspection endpoint | RFC 8414 §2 |
| **revocation_endpoint** | String | URL of revocation endpoint | RFC 8414 §2 |
| **introspection_endpoint_auth_methods_supported** | Array | Supported auth methods for introspection | RFC 8414 §2 |
| **revocation_endpoint_auth_methods_supported** | Array | Supported auth methods for revocation | RFC 8414 §2 |

### 18.2 Example Metadata

```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/oauth2/authorize",
  "token_endpoint": "https://auth.example.com/oauth2/token",
  "introspection_endpoint": "https://auth.example.com/oauth2/introspect",
  "revocation_endpoint": "https://auth.example.com/oauth2/revoke",
  "jwks_uri": "https://auth.example.com/.well-known/jwks.json",
  
  "introspection_endpoint_auth_methods_supported": [
    "client_secret_basic",
    "client_secret_post",
    "private_key_jwt"
  ],
  
  "revocation_endpoint_auth_methods_supported": [
    "client_secret_basic",
    "client_secret_post"
  ],
  
  "token_endpoint_auth_methods_supported": [
    "client_secret_basic",
    "client_secret_post",
    "private_key_jwt"
  ]
}
```

**Discovery URL:**
```
https://auth.example.com/.well-known/oauth-authorization-server
```

**See:** `authorization-server-metadata.md` for complete metadata documentation.

---

## 19. Example Scenarios

### 19.1 Happy Path: Resource Server Introspects Opaque Access Token

**Scenario:** API receives opaque access token, introspects to validate.

```http
Step 1: Client Request to API
GET /api/messages HTTP/1.1
Host: api.example.com
Authorization: Bearer 2YotnFZFEjr1zCsicMWpAA
```

```http
Step 2: Resource Server Introspects Token
POST /oauth2/introspect HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded
Authorization: Basic <resource_server_credentials>

token=2YotnFZFEjr1zCsicMWpAA&token_type_hint=access_token
```

```http
Step 3: Authorization Server Response
HTTP/1.1 200 OK
Content-Type: application/json

{
  "active": true,
  "scope": "read:messages",
  "client_id": "client_abc123",
  "username": "alice@example.com",
  "token_type": "Bearer",
  "exp": 1735776000,
  "iat": 1735772400,
  "sub": "user_12345",
  "aud": "https://api.example.com"
}
```

```http
Step 4: Resource Server Response to Client
HTTP/1.1 200 OK
Content-Type: application/json

{
  "messages": [...]
}
```

**Result:** ✅ Token validated, request processed.

---

### 19.2 Inactive Token: Expired Token Introspection

**Scenario:** Token expired, introspection returns active=false.

```http
Step 1: Resource Server Introspects Expired Token
POST /oauth2/introspect HTTP/1.1
Host: auth.example.com
Authorization: Basic <credentials>

token=expired_token_xyz&token_type_hint=access_token
```

```http
Step 2: Authorization Server Response
HTTP/1.1 200 OK
Content-Type: application/json

{
  "active": false
}
```

**Note:** No metadata returned (active=false).

```http
Step 3: Resource Server Response to Client
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer error="invalid_token",
                         error_description="The access token expired"

{
  "error": "invalid_token",
  "error_description": "The access token expired"
}
```

**Result:** ✅ Client receives 401, must refresh token.

---

### 19.3 Revocation: User Logs Out, Client Revokes Refresh Token

**Scenario:** User clicks logout, client revokes refresh token.

```http
Step 1: User Initiates Logout
(User clicks "Logout" button in client app)
```

```javascript
Step 2: Client Revokes Refresh Token
const response = await fetch('https://auth.example.com/oauth2/revoke', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': 'Basic ' + btoa(client_id + ':' + client_secret)
  },
  body: 'token=' + refresh_token + '&token_type_hint=refresh_token'
});

// response.status === 200
```

```http
HTTP Request:
POST /oauth2/revoke HTTP/1.1
Host: auth.example.com
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW
Content-Type: application/x-www-form-urlencoded

token=8xLOxBtZp8&token_type_hint=refresh_token
```

```http
Step 3: Authorization Server Response
HTTP/1.1 200 OK
```

```javascript
Step 4: Client Clears Local Storage
localStorage.removeItem('access_token');
localStorage.removeItem('refresh_token');
window.location = '/login';
```

**Authorization Server Actions:**
1. Mark refresh token `8xLOxBtZp8` as revoked
2. Mark all associated access tokens as revoked (cascade)
3. Return 200 OK

**Result:** ✅ All tokens revoked, user logged out.

---

### 19.4 Cascade Revocation: Refresh Token Revoked, Access Tokens Invalidated

**Scenario:** Authorization server cascade revokes access tokens.

**Initial State:**
```
User Authorization:
  Refresh Token: rt_abc123
  Access Token 1: at_xyz (exp: 11:00)
  Access Token 2: at_def (exp: 11:15)
```

**Revocation Request:**
```http
POST /oauth2/revoke HTTP/1.1
Host: auth.example.com
Authorization: Basic <credentials>

token=rt_abc123&token_type_hint=refresh_token
```

**Authorization Server Processing:**
```sql
-- Step 1: Mark refresh token as revoked
UPDATE refresh_tokens
SET revoked = TRUE
WHERE token = 'rt_abc123';

-- Step 2: Find all access tokens from same authorization
SELECT token FROM access_tokens
WHERE authorization_id = (
  SELECT authorization_id FROM refresh_tokens WHERE token = 'rt_abc123'
);
-- Results: ['at_xyz', 'at_def']

-- Step 3: Mark all access tokens as revoked (cascade)
UPDATE access_tokens
SET revoked = TRUE
WHERE authorization_id = (
  SELECT authorization_id FROM refresh_tokens WHERE token = 'rt_abc123'
);

-- Step 4: Return success
RETURN 200 OK
```

**Result:**
```
Refresh Token rt_abc123: Revoked
Access Token at_xyz: Revoked (cascade)
Access Token at_def: Revoked (cascade)
```

**Subsequent Introspection:**
```http
POST /introspect
token=at_xyz

Response:
{
  "active": false
}
```

**Result:** ✅ All tokens in authorization invalidated.

---

### 19.5 JWT Introspection: Checking Revocation Status

**Scenario:** Resource server introspects JWT to check revocation.

```http
Step 1: Client Request with JWT
GET /api/transfer_funds HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

```javascript
Step 2: Resource Server Validates JWT Locally
const jwt = extractToken(request);
const isValid = verifyJwtSignature(jwt);  // ✅ Valid signature
const notExpired = jwt.exp > now();       // ✅ Not expired

// Critical operation: Also check revocation
```

```http
Step 3: Resource Server Introspects JWT
POST /oauth2/introspect HTTP/1.1
Host: auth.example.com
Authorization: Basic <credentials>

token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

```http
Step 4: Authorization Server Response
HTTP/1.1 200 OK
Content-Type: application/json

{
  "active": true,
  "scope": "transfer:funds",
  "client_id": "client_abc123",
  "exp": 1735776000,
  "jti": "550e8400-e29b-41d4-a716"
}
```

```http
Step 5: Resource Server Processes Request
HTTP/1.1 200 OK

{
  "transfer_id": "txn_12345",
  "status": "completed"
}
```

**Result:** ✅ JWT validated locally AND checked for revocation.

---

### 19.6 Caching: Resource Server Caches Introspection Response

**Scenario:** Resource server caches introspection to reduce latency.

```http
First Request (Cache Miss):
GET /api/data HTTP/1.1
Authorization: Bearer 2YotnFZFEjr1zCsicMWpAA

Resource Server:
  1. Check cache: Miss
  2. Introspect token: → active=true, exp=1735776000
  3. Cache result (TTL = min(300, exp - now))
  4. Process request
  
Latency: 65ms (introspection)
```

```http
Second Request (Cache Hit):
GET /api/data HTTP/1.1
Authorization: Bearer 2YotnFZFEjr1zCsicMWpAA

Resource Server:
  1. Check cache: Hit! ✅
  2. Use cached result (active=true)
  3. Process request
  
Latency: 5ms (cache lookup only)
```

**Cache Implementation:**
```javascript
async function validateToken(token) {
  const cacheKey = `introspect:${hashToken(token)}`;
  
  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Cache miss: Introspect
  const result = await introspectToken(token);
  
  // Cache positive results only
  if (result.active) {
    const ttl = Math.min(300, result.exp - Math.floor(Date.now() / 1000));
    await redis.setex(cacheKey, ttl, JSON.stringify(result));
  }
  
  return result;
}
```

**Result:** ✅ 90%+ latency reduction for cached tokens.

---

### 19.7 Error Handling: Introspection Endpoint Unavailable

**Scenario:** Introspection endpoint down, resource server fallback strategy.

```http
Step 1: Resource Server Attempts Introspection
POST /oauth2/introspect HTTP/1.1
Host: auth.example.com

Result: Connection timeout (endpoint unavailable)
```

**Resource Server Strategy A: Fail Closed (Secure)**
```javascript
try {
  const result = await introspectToken(token);
  if (result.active) {
    processRequest();
  } else {
    return 401;
  }
} catch (error) {
  // Introspection failed
  console.error('Introspection unavailable:', error);
  return 503;  // Service unavailable
}
```

**Resource Server Strategy B: Fail Open with JWT (Performance)**
```javascript
try {
  const result = await introspectToken(token);
  return result.active;
} catch (error) {
  // Introspection failed, fall back to JWT validation
  console.warn('Introspection unavailable, using JWT validation');
  
  if (isJwt(token)) {
    return validateJwtLocally(token);
  } else {
    // Opaque token, cannot validate without introspection
    return 503;
  }
}
```

**Trade-off:**
- Strategy A: More secure (fail closed), but service unavailable
- Strategy B: Better availability, but may accept revoked tokens

**Recommendation:** Strategy A for high-security, Strategy B for availability-critical systems.

---

### 19.8 Token Metadata: Introspection Reveals Scope and User Information

**Scenario:** Resource server uses introspection metadata for authorization.

```http
Step 1: Introspection Request
POST /introspect HTTP/1.1
token=2YotnFZFEjr1zCsicMWpAA
```

```http
Step 2: Introspection Response with Metadata
HTTP/1.1 200 OK

{
  "active": true,
  "scope": "read:messages write:messages",
  "client_id": "client_abc123",
  "username": "alice@example.com",
  "sub": "user_12345",
  "aud": "https://api.example.com",
  "exp": 1735776000,
  "roles": ["user", "moderator"],
  "organization_id": "org_67890"
}
```

**Resource Server Authorization Logic:**
```javascript
const introspection = await introspectToken(token);

if (!introspection.active) {
  return 401; // Token invalid
}

// Check scope
const requiredScope = 'write:messages';
const scopes = introspection.scope.split(' ');
if (!scopes.includes(requiredScope)) {
  return 403; // Insufficient scope
}

// Check role
if (!introspection.roles.includes('moderator')) {
  return 403; // Insufficient permissions
}

// Check organization
if (introspection.organization_id !== requestedOrg) {
  return 403; // Wrong organization
}

// All checks passed
processRequest(introspection.sub);
```

**Result:** ✅ Introspection metadata enables fine-grained authorization.

---

## 20. Performance Optimization Strategies

### 20.1 Caching Introspection Results

**Strategy:** Cache positive introspection responses to reduce latency and server load.

**Implementation:**
```javascript
const CACHE_PREFIX = 'introspect:';
const MAX_TTL = 300; // 5 minutes

async function introspectWithCache(token) {
  // Generate cache key (hash token for security)
  const cacheKey = CACHE_PREFIX + hashToken(token);
  
  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    const result = JSON.parse(cached);
    console.log('Cache hit');
    return result;
  }
  
  // Cache miss: Introspect
  console.log('Cache miss, introspecting...');
  const result = await introspectToken(token);
  
  // Cache positive results only
  if (result.active) {
    const ttl = calculateTTL(result);
    await redis.setex(cacheKey, ttl, JSON.stringify(result));
  }
  // Never cache negative results (token might become active)
  
  return result;
}

function calculateTTL(introspectionResult) {
  if (!introspectionResult.exp) {
    return MAX_TTL;
  }
  
  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = introspectionResult.exp - now;
  
  // TTL = min(MAX_TTL, time until token expires)
  return Math.min(MAX_TTL, timeUntilExpiry);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
```

**Cache Invalidation:**
```javascript
// When token is revoked:
async function revokeToken(token) {
  // Revoke in database
  await markTokenAsRevoked(token);
  
  // Invalidate cache
  const cacheKey = CACHE_PREFIX + hashToken(token);
  await redis.del(cacheKey);
}
```

**Performance Impact:**
```
Without caching:
  Every request: 50-200ms introspection latency

With caching (5 min TTL):
  First request: 50-200ms (cache miss)
  Subsequent requests: <5ms (cache hit)
  
Cache hit rate: 95%+ (typical)
Average latency: 0.05 * 100ms + 0.95 * 2ms = 6.9ms
```

### 20.2 Introspection Batching (Non-Standard Extension)

**Concept:** Introspect multiple tokens in a single request.

**Example Request:**
```http
POST /oauth2/introspect_batch HTTP/1.1
Host: auth.example.com
Authorization: Basic <credentials>
Content-Type: application/json

{
  "tokens": [
    "2YotnFZFEjr1zCsicMWpAA",
    "8xLOxBtZp8",
    "SlAV32hkKG"
  ]
}
```

**Example Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "results": [
    {
      "token": "2YotnFZFEjr1zCsicMWpAA",
      "active": true,
      "scope": "read write"
    },
    {
      "token": "8xLOxBtZp8",
      "active": false
    },
    {
      "token": "SlAV32hkKG",
      "active": true,
      "scope": "read"
    }
  ]
}
```

**Benefits:**
- Reduced network overhead (one request vs multiple)
- Reduced server processing (single database query)
- Lower latency (parallel processing)

**Trade-offs:**
- Non-standard extension (not in RFC 7662)
- Increased request/response size
- Complexity in implementation

### 20.3 JWT + Introspection Hybrid

**Strategy:** Use JWT local validation for normal requests, introspect for critical operations.

**Implementation:**
```javascript
const CRITICAL_OPERATIONS = [
  'transfer_funds',
  'delete_account',
  'change_password',
  'revoke_access'
];

async function validateToken(token, operation) {
  // Always verify JWT signature if JWT
  if (isJwt(token)) {
    const jwtValid = await validateJwtLocally(token);
    if (!jwtValid) {
      return false;
    }
    
    // For critical operations, also introspect
    if (CRITICAL_OPERATIONS.includes(operation)) {
      const introspection = await introspectToken(token);
      return introspection.active;
    }
    
    // Normal operation: JWT validation sufficient
    return true;
  } else {
    // Opaque token: Always introspect
    const introspection = await introspectToken(token);
    return introspection.active;
  }
}
```

**Performance:**
```
Normal operations (95% of requests):
  JWT validation: <5ms

Critical operations (5% of requests):
  JWT + introspection: ~70ms

Average: 0.95 * 5ms + 0.05 * 70ms = 8.25ms
```

### 20.4 Performance Optimization Summary

| Strategy | Latency Reduction | Complexity | Trade-off |
|----------|------------------|------------|-----------|
| **Caching (positive results)** | 90%+ | Low | Delayed revocation detection (TTL) |
| **Batching (non-standard)** | 50-70% | Medium | Non-standard, implementation complexity |
| **JWT + selective introspection** | 80-90% | Medium | Revocation window for normal ops |
| **Short JWT expiration** | 0% (but limits revocation window) | Low | More frequent refreshes |
| **Database indexing** | 20-30% | Low (AS-side) | Storage overhead |

**Recommended Approach:**
1. Use JWT local validation for normal operations
2. Cache introspection results (TTL = min(5 min, token exp))
3. Introspect for critical operations
4. Use short JWT expiration (15-60 min)
5. Implement rate limiting and monitoring

This achieves the best balance of performance, security, and complexity.

---

## Appendix A: RFC Cross-Reference Index

| Topic | RFC 7662 | RFC 7009 | Related Specs |
|-------|----------|----------|---------------|
| Introspection endpoint | §2 | — | RFC 8414 §2 |
| Introspection request | §2.1 | — | — |
| Introspection response | §2.2 | — | — |
| Introspection security | §4 | — | — |
| Revocation endpoint | — | §2 | RFC 8414 §2 |
| Revocation request | — | §2.1 | — |
| Revocation response | — | §2.2 | — |
| token_type_hint | §2.1 | §2.1 | — |
| Authentication requirement | §2.1 | §2.1 | RFC 6749 §2.3 |
| Authorization considerations | §4 | — | — |

---

## Appendix B: Vulnerability Mode Quick Reference

| Toggle | Attack Demonstrated | Spec Violation | Section |
|--------|-------------------|----------------|---------|
| `UNAUTHENTICATED_INTROSPECTION` | Unauthorized metadata access | RFC 7662 §2.1 | §16.1 |
| `VERBOSE_INTROSPECTION` | PII disclosure to unauthorized callers | RFC 7662 §4 | §16.2 |
| `JWT_VALIDATION_ONLY` | Revoked JWT still validates | Best practice | §16.3 |
| `NO_RATE_LIMIT_REVOCATION` | Revocation DoS | Best practice | §16.4 |
| `DESCRIPTIVE_REVOCATION_ERRORS` | Token enumeration via responses | RFC 7009 §2.2 | §16.5 |

---

*Document Version: 1.0.0*
*Last Updated: December 6, 2025*
*Specification References: RFC 7662, RFC 7009, RFC 6749, RFC 8414*
