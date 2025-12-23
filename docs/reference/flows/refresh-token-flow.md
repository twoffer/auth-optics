# Refresh Token Flow

## Specification Reference for OAuth2/OIDC Debugging Tool

> *"In the beginning, access tokens were created. This made a lot of people very happy and been widely regarded as a good move. Then they expired. This made a lot of people very unhappy and been widely regarded as a bad move. Thus, refresh tokens were invented to make everyone slightly less unhappy."*

---

## 1. Overview

The Refresh Token Flow is OAuth 2.0's mechanism for obtaining new access tokens without requiring the user to re-authenticate. While access tokens are intentionally short-lived (minutes to hours) to limit the damage from theft, refresh tokens enable long-lived sessions (days to weeks) by allowing clients to silently request new access tokens when the old ones expire.

**The Core Trade-off:** Short-lived access tokens minimize risk but create UX friction. Refresh tokens solve this by separating session lifetime from token lifetime.

### The Problem Refresh Tokens Solve

**Without refresh tokens:**
```
User logs in → Access token issued (expires in 1 hour)
[59 minutes pass]
User clicks button → Access token expired
→ User redirected to login again (terrible UX!)
```

**With refresh tokens:**
```
User logs in → Access token + refresh token issued
[59 minutes pass]
User clicks button → Client detects expired access token
→ Client silently uses refresh token to get new access token
→ Request succeeds (seamless UX!)
```

### When Refresh Tokens Are Issued

| Flow | Refresh Token Issued? | Rationale |
|------|----------------------|-----------|
| Authorization Code Flow | ✅ Yes (typically) | User authorized, may want long session |
| Device Authorization Flow | ✅ Yes (typically) | Same as authorization code |
| **Client Credentials Flow** | ❌ **MUST NOT** | No user, client can just re-authenticate |
| **Implicit Flow** | ❌ **MUST NOT** | Flow is deprecated, no secure storage |
| Resource Owner Password Flow | ⚠️ MAY (flow deprecated) | Flow should not be used |

**Critical distinction:** Refresh tokens represent **user sessions**, not client authentication. They're only issued when a user has authorized access.

### Primary Specifications

| Specification | Sections | Purpose |
|---------------|----------|---------|
| RFC 6749 | §6 (complete), §1.5 | OAuth 2.0 Refresh Token Grant |
| OAuth 2.1 | §6 | Updated requirements (rotation mandatory for public clients) |
| Security BCP (draft-ietf-oauth-security-topics-27) | §4.13 | Refresh token security, rotation, theft detection |
| RFC 7009 | Complete | Token Revocation |
| RFC 9449 | §6 | DPoP-bound refresh tokens |
| OIDC Core 1.0 | §11, §12 | offline_access scope, token endpoint |

---

## 2. Refresh Token Characteristics

### 2.1 Token Structure

| Characteristic | Value | Rationale |
|---------------|-------|-----------|
| **Structure** | Typically opaque (reference token) | Prevents parsing/manipulation, enables server-side control |
| **Alternative** | MAY be structured JWT | Enables stateless validation (less common) |
| **Format** | Implementation-specific | No format specified by RFC 6749 |

**Opaque refresh token example:**
```
eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjEifQ...  ← JWT access token
tGzv3JOkF0XG5Qx2TlKWIA                                    ← Opaque refresh token
```

**Why opaque?**
- Authorization server can revoke instantly (no waiting for expiration)
- Prevents token introspection by clients
- Reduces token size
- Centralizes token management

### 2.2 Token Lifetime

| Token Type | Typical Lifetime | Rationale |
|------------|-----------------|-----------|
| Access Token | 5-60 minutes | Minimize blast radius from theft |
| Refresh Token | 30-90 days | Balance security vs UX |
| Long-lived Refresh Token | 6-12 months | For native apps, with rotation |

**Lifetime considerations:**

| Client Type | Recommended Lifetime | Security Measures |
|-------------|---------------------|-------------------|
| Web backend | 30 days | Encrypted database storage, rotation |
| Native mobile app | 90 days | OS keychain, rotation, DPoP |
| SPA (via BFF) | Backend: 30 days, Frontend: none | Backend-for-Frontend pattern |
| Desktop app | 90 days | Secure OS storage, rotation |

**Critical:** Longer lifetime = greater risk if stolen. MUST be balanced with security measures like rotation.

### 2.3 Scope Binding

Refresh tokens are bound to the scope granted during the original authorization.

| Operation | Allowed? | Spec Reference |
|-----------|---------|----------------|
| Request same scope | ✅ Yes (default if scope omitted) | RFC 6749 §6 |
| Request reduced scope | ✅ Yes (subset of original) | RFC 6749 §6 |
| Request expanded scope | ❌ **NO** - MUST reject | RFC 6749 §6 |
| Omit scope parameter | ✅ Yes (implies same scope) | RFC 6749 §6 |

**Example:**
```
Original authorization: scope=profile email calendar
Valid refresh request: scope=profile email          ← Reduced (OK)
Invalid refresh request: scope=profile email admin  ← Expanded (REJECT)
```

### 2.4 Client Binding

**Per RFC 6749 §6:** Refresh tokens MUST be bound to the client_id that requested them.

| Requirement | Description | Spec Reference |
|-------------|-------------|----------------|
| Client binding | Refresh token MUST only be accepted from the client it was issued to | RFC 6749 §6 |
| Cross-client usage | Server MUST reject refresh token from different client_id | Security BCP §4.13 |
| Client authentication | Confidential clients MUST authenticate when using refresh token | RFC 6749 §3.2.1 |

### 2.5 Storage Requirements

**Critical security requirement:** Refresh tokens MUST be stored securely.

| Client Type | Storage Location | Security Measures | Spec Reference |
|-------------|-----------------|-------------------|----------------|
| **Backend server** | Encrypted database | Encryption at rest, access controls | Security BCP §4.13 |
| **Native mobile app** | OS keychain (iOS Keychain, Android Keystore) | OS-provided secure storage | Security BCP §4.13 |
| **Native desktop app** | OS credential manager | Windows Credential Manager, macOS Keychain | Security BCP §4.13 |
| **SPA (Single Page App)** | ❌ **NEVER in browser** | Use BFF (Backend-for-Frontend) pattern | Security BCP §4.13.2 |
| **Command-line tool** | Secure file with restricted permissions | 0600 permissions, encryption | Security best practice |

**Why SPAs MUST NOT store refresh tokens in browser:**
- LocalStorage/SessionStorage accessible to JavaScript (XSS risk)
- Cookies vulnerable to XSS if not properly configured
- No truly secure storage in browser environment
- Solution: Use BFF pattern (backend proxy manages refresh tokens)

---

## 3. Initial Token Issuance (When Refresh Tokens Are Granted)

Refresh tokens are issued by the authorization server during the initial token response of certain OAuth 2.0 flows.

### 3.1 Flows That Issue Refresh Tokens

#### Authorization Code Flow (RFC 6749 §4.1.4)

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "access_token": "SlAV32hkKG",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "tGzv3JOkF0XG5Qx2TlKWIA",  ← Refresh token issued
  "scope": "profile email"
}
```

#### Device Authorization Flow (RFC 8628 §3.5)

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "8xLOxBtZp8",  ← Refresh token issued
  "scope": "profile email"
}
```

### 3.2 Flows That MUST NOT Issue Refresh Tokens

#### Client Credentials Flow (RFC 6749 §4.4.3)

**Per RFC 6749 §4.4.3:** The authorization server MUST NOT issue a refresh token.

**Rationale:** Client Credentials represents the client itself, not a user. The client can simply re-authenticate using its credentials when tokens expire.

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "access_token": "2YotnFZFEjr1zCsicMWpAA",
  "token_type": "Bearer",
  "expires_in": 3600
  // NO refresh_token field
}
```

#### Implicit Flow (RFC 6749 §4.2)

**Per Security BCP:** Implicit Flow is deprecated and SHOULD NOT be used. Additionally, refresh tokens were never issued in this flow due to lack of secure storage.

### 3.3 Server Decision Factors for Issuing Refresh Tokens

The authorization server decides whether to issue a refresh token based on:

| Factor | Consideration | Example |
|--------|--------------|---------|
| **Client type** | Confidential clients more likely to receive | Web backends get refresh tokens |
| **Scope requested** | Some scopes may prohibit offline access | Payment processing: no refresh tokens |
| **offline_access scope** (OIDC) | Explicit request for refresh token | User must consent to offline access |
| **Policy** | Organization security policy | Healthcare app: shorter refresh token lifetime |
| **Client registration** | Pre-configured during client registration | Client registered with refresh_token_lifetime=30d |

### 3.4 OIDC offline_access Scope (OIDC Core §11)

In OpenID Connect, the `offline_access` scope explicitly requests a refresh token.

**Per OIDC Core §11:**
- If `offline_access` scope is requested and granted, server SHOULD issue refresh token
- Enables access when user is not present (offline)
- MUST show on consent screen (user must understand they're granting offline access)

**Example authorization request:**
```http
GET /authorize?
  response_type=code
  &client_id=s6BhdRkqt3
  &redirect_uri=https%3A%2F%2Fclient.example.org%2Fcallback
  &scope=openid%20profile%20email%20offline_access  ← Request offline access
  &state=af0ifjsldkj
  &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  &code_challenge_method=S256
```

**Consent screen should display:**
```
MyApp wants to:
• View your profile
• View your email
• Access your account when you're not present  ← offline_access
```

---

## 4. Token Refresh Request (RFC 6749 §6)

When an access token expires, the client can use the refresh token to obtain a new access token without user interaction.

### HTTP Method and Endpoint

```http
POST /token HTTP/1.1
Host: authorization-server.example.com
Content-Type: application/x-www-form-urlencoded
```

### Parameters

| Parameter | RFC 2119 | Description | Spec Reference |
|-----------|----------|-------------|----------------|
| `grant_type` | **REQUIRED** | MUST be set to `refresh_token` | RFC 6749 §6 |
| `refresh_token` | **REQUIRED** | The refresh token issued to the client | RFC 6749 §6 |
| `scope` | OPTIONAL | Requested scope (MUST be subset of original scope) | RFC 6749 §6 |

### Client Authentication

**Per RFC 6749 §3.2.1:**

| Client Type | Authentication Requirement | Method |
|-------------|---------------------------|--------|
| Confidential client | **MUST** authenticate | client_secret_basic, client_secret_post, private_key_jwt, etc. |
| Public client | Cannot authenticate reliably | Include client_id in request body |

**Why public clients can't authenticate reliably:**
- Cannot securely store client_secret (it can be extracted from app binary)
- Rely on PKCE and rotation for security instead

### Example Token Refresh Request (Confidential Client)

```http
POST /token HTTP/1.1
Host: authorization-server.example.com
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=tGzv3JOkF0XG5Qx2TlKWIA
```

**With scope reduction:**

```http
POST /token HTTP/1.1
Host: authorization-server.example.com
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=tGzv3JOkF0XG5Qx2TlKWIA
&scope=profile%20email
```

### Example Token Refresh Request (Public Client)

```http
POST /token HTTP/1.1
Host: authorization-server.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=tGzv3JOkF0XG5Qx2TlKWIA
&client_id=s6BhdRkqt3
```

### Parameter Validation Rules

| Rule | Validation | Spec Reference |
|------|------------|----------------|
| grant_type | MUST equal `"refresh_token"` exactly | RFC 6749 §6 |
| refresh_token | MUST be valid and not expired | RFC 6749 §6 |
| refresh_token | MUST be bound to authenticated client | RFC 6749 §6 |
| scope | If present, MUST be subset of original scope | RFC 6749 §6 |
| Client authentication | Confidential clients MUST authenticate | RFC 6749 §3.2.1 |

---

## 5. Token Refresh Response

The authorization server validates the refresh token and issues a new access token.

### 5.1 Success Response Parameters

| Parameter | RFC 2119 | Description | Spec Reference |
|-----------|----------|-------------|----------------|
| `access_token` | **REQUIRED** | New access token | RFC 6749 §5.1 |
| `token_type` | **REQUIRED** | Token type (typically `Bearer`) | RFC 6749 §5.1 |
| `expires_in` | RECOMMENDED | Lifetime in seconds of the new access token | RFC 6749 §5.1 |
| `refresh_token` | OPTIONAL | New refresh token (if rotation enabled) | RFC 6749 §5.1 |
| `scope` | OPTIONAL* | Scope of the access token | RFC 6749 §5.1 |

> \* `scope` is OPTIONAL if identical to requested scope, REQUIRED if different.

### 5.2 Response Without Rotation

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
Pragma: no-cache

{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "profile email"
}
```

**Note:** No new `refresh_token` in response means the client continues using the same refresh token.

### 5.3 Response With Rotation (Security BCP §4.13.2)

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
Pragma: no-cache

{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "8xLOxBtZp8",  ← NEW refresh token
  "scope": "profile email"
}
```

**Critical:** When new refresh_token is issued:
1. Client MUST replace old refresh token with new one
2. Server MUST invalidate old refresh token
3. Old refresh token MUST NOT work for future requests

### 5.4 Error Response Parameters (RFC 6749 §5.2)

| Parameter | RFC 2119 | Description |
|-----------|----------|-------------|
| `error` | **REQUIRED** | Error code from table below |
| `error_description` | OPTIONAL | Human-readable error description |
| `error_uri` | OPTIONAL | URI to error documentation |

### Error Codes

| Error Code | Description | Client Action | Spec Reference |
|------------|-------------|---------------|----------------|
| `invalid_grant` | Refresh token invalid, expired, revoked, or mismatched | Re-authenticate user | RFC 6749 §5.2 |
| `invalid_client` | Client authentication failed | Check credentials | RFC 6749 §5.2 |
| `invalid_scope` | Requested scope exceeds original scope | Request valid scope or re-authenticate | RFC 6749 §5.2 |
| `invalid_request` | Malformed request | Fix request format | RFC 6749 §5.2 |
| `unauthorized_client` | Client not authorized to use refresh tokens | Contact administrator | RFC 6749 §5.2 |

### Example Error Responses

#### invalid_grant (Expired Refresh Token)

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json
Cache-Control: no-store

{
  "error": "invalid_grant",
  "error_description": "The refresh token has expired"
}
```

**Client action:** User MUST re-authenticate via authorization flow.

#### invalid_grant (Revoked Refresh Token)

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json
Cache-Control: no-store

{
  "error": "invalid_grant",
  "error_description": "The refresh token has been revoked"
}
```

**Possible causes:**
- User logged out
- User changed password
- Security event triggered revocation
- Replay detection triggered revocation (theft detected)

#### invalid_scope (Scope Escalation Attempt)

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json
Cache-Control: no-store

{
  "error": "invalid_scope",
  "error_description": "Requested scope 'admin' exceeds original authorization"
}
```

---

## 6. Refresh Token Rotation (Security BCP §4.13.2)

Refresh token rotation is a critical security mechanism where the authorization server issues a new refresh token each time a refresh token is used, invalidating the old one.

### 6.1 How Rotation Works

```
┌────────────────────┐                           ┌────────────────────┐
│                    │                           │                    │
│  Client            │                           │  Authorization     │
│                    │                           │  Server            │
│                    │                           │                    │
└──────┬─────────────┘                           └──────┬─────────────┘
       │                                                │
       │  (1) POST /token                              │
       │      grant_type=refresh_token                 │
       │      refresh_token=RT_1                       │
       │  ─────────────────────────────────────────► │
       │                                                │
       │                    ┌───────────────────────────────────┐
       │                    │ Server validates RT_1:           │
       │                    │ • Check not expired              │
       │                    │ • Check not revoked              │
       │                    │ • Check bound to client          │
       │                    │ • Check not already rotated      │
       │                    └───────────────────────────────────┘
       │                                                │
       │  (2) Response with NEW tokens                 │
       │      {                                         │
       │        "access_token": "AT_2",                │
       │        "refresh_token": "RT_2"  ← NEW         │
       │      }                                         │
       │  ◄───────────────────────────────────────── │
       │                                                │
       │                    ┌───────────────────────────────────┐
       │                    │ Server actions:                  │
       │                    │ • Issue new access token (AT_2)  │
       │                    │ • Issue new refresh token (RT_2) │
       │                    │ • Mark RT_1 as used              │
       │                    │ • Invalidate RT_1                │
       │                    └───────────────────────────────────┘
       │                                                │
       │  (3) Client stores new tokens                 │
       │      • Replace RT_1 with RT_2                 │
       │      • Store AT_2                             │
       │      • Delete RT_1 from storage               │
       │                                                │
       ▼                                                ▼
```

### 6.2 Rotation Requirements by Client Type

| Client Type | Rotation Requirement | Spec Reference |
|-------------|---------------------|----------------|
| Public client | **REQUIRED** in OAuth 2.1 | OAuth 2.1 §6 |
| Public client | SHOULD in RFC 6749 | Security BCP §4.13.2 |
| Confidential client | MAY rotate | Security BCP §4.13.2 |

**Why required for public clients?**
- Cannot securely authenticate with client_secret
- Rotation provides mitigation against token theft
- Enables theft detection via replay

### 6.3 Theft Detection via Replay (Security BCP §4.13.3)

Rotation enables detection of refresh token theft through race condition detection:

```
Scenario: Attacker steals RT_1

Timeline:
---------
T0: User has RT_1
T1: Attacker steals RT_1
T2: Legitimate user uses RT_1 → Server issues RT_2, invalidates RT_1
T3: Attacker tries to use RT_1 → Server detects replay!
    ↓
    Server action: REVOKE ALL TOKENS in this refresh token family
    Result: Both attacker and user lose access, user must re-authenticate
```

**Detection logic:**

```
IF refresh_token is marked as "already_used":
    # This refresh token was already rotated
    # Someone is replaying it (either attacker or race condition)
    
    IF within_replay_detection_window:
        # Could be legitimate race condition
        RETURN error("invalid_grant", "Token already used")
    ELSE:
        # Likely theft - old token being replayed
        REVOKE_ALL_TOKENS_IN_FAMILY(refresh_token.family_id)
        ALERT_SECURITY_TEAM(user_id, "Possible refresh token theft")
        RETURN error("invalid_grant", "Token replay detected")
```

**Replay detection window:** Typically 5-10 seconds to account for:
- Network retries
- Load balancer duplicate requests
- Client-side bugs

### 6.4 Rotation Strategies

#### Strategy 1: Per-Use Rotation (Most Secure)

Every refresh token use triggers rotation.

```
RT_1 → AT_1 + RT_2
RT_2 → AT_2 + RT_3
RT_3 → AT_3 + RT_4
...
```

**Benefits:**
- Maximum security - stolen token valid for minimal time
- Best theft detection

**Drawbacks:**
- More database writes
- Requires careful handling of concurrent requests

#### Strategy 2: Time-Based Rotation

Rotate only after certain time period or number of uses.

```
Day 1: RT_1 → AT_1 (RT_1 reused)
Day 2: RT_1 → AT_2 (RT_1 reused)
Day 3: RT_1 → AT_3 (RT_1 reused)
Day 7: RT_1 → AT_4 + RT_2 (rotated after 7 days)
```

**Benefits:**
- Fewer database operations
- Simpler implementation

**Drawbacks:**
- Longer window for stolen token use
- Delayed theft detection

#### Strategy 3: Rotation Families

Track refresh token lineage for better revocation.

```
Family: family_abc123

RT_1 (generation=1, family=family_abc123)
  → AT_1 + RT_2 (generation=2, family=family_abc123)
    → AT_2 + RT_3 (generation=3, family=family_abc123)
      → AT_3 + RT_4 (generation=4, family=family_abc123)

IF replay detected on any token in family_abc123:
  REVOKE ALL tokens with family=family_abc123
```

**Implementation:**

```javascript
{
  refresh_token: "RT_3",
  family_id: "family_abc123",
  generation: 3,
  issued_at: 1638360000,
  expires_at: 1641038400,
  parent_token: "RT_2",
  client_id: "s6BhdRkqt3",
  user_id: "user123",
  scope: "profile email",
  used: false
}
```

### 6.5 Rotation Implementation Example

```javascript
async function refreshTokenWithRotation(refreshToken, clientId) {
  // 1. Find refresh token
  const storedToken = await db.findRefreshToken(refreshToken);
  
  if (!storedToken) {
    return error("invalid_grant", "Invalid refresh token");
  }
  
  // 2. Check if already used (replay detection)
  if (storedToken.used) {
    const timeSinceUse = Date.now() - storedToken.used_at;
    
    if (timeSinceUse > REPLAY_WINDOW_MS) {
      // Replay outside window - likely theft
      await revokeTokenFamily(storedToken.family_id);
      await alertSecurity({
        event: "refresh_token_replay",
        user_id: storedToken.user_id,
        family_id: storedToken.family_id
      });
      return error("invalid_grant", "Token replay detected");
    }
    
    // Within replay window - could be race condition
    return error("invalid_grant", "Token already used");
  }
  
  // 3. Validate
  if (storedToken.expires_at < Date.now()) {
    return error("invalid_grant", "Refresh token expired");
  }
  
  if (storedToken.client_id !== clientId) {
    return error("invalid_grant", "Token not issued to this client");
  }
  
  // 4. Mark as used
  await db.updateRefreshToken(refreshToken, {
    used: true,
    used_at: Date.now()
  });
  
  // 5. Generate new tokens
  const newAccessToken = await generateAccessToken({
    user_id: storedToken.user_id,
    client_id: storedToken.client_id,
    scope: storedToken.scope,
    expires_in: 3600
  });
  
  const newRefreshToken = await generateRefreshToken({
    user_id: storedToken.user_id,
    client_id: storedToken.client_id,
    scope: storedToken.scope,
    family_id: storedToken.family_id,
    generation: storedToken.generation + 1,
    parent_token: refreshToken,
    expires_in: 30 * 24 * 3600  // 30 days
  });
  
  // 6. Return new tokens
  return {
    access_token: newAccessToken,
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token: newRefreshToken,
    scope: storedToken.scope
  };
}
```

---

## 7. Scope Handling (RFC 6749 §6)

The refresh token request allows clients to request a reduced scope, but never an expanded scope.

### 7.1 Scope Rules

| Operation | Allowed? | Example | Spec Reference |
|-----------|---------|---------|----------------|
| **Same scope** | ✅ Yes | Original: `profile email`<br>Request: `profile email` | RFC 6749 §6 |
| **Omit scope** | ✅ Yes (defaults to original) | Original: `profile email`<br>Request: (omitted)<br>Result: `profile email` | RFC 6749 §6 |
| **Reduce scope** | ✅ Yes | Original: `profile email calendar`<br>Request: `profile email`<br>Result: `profile email` | RFC 6749 §6 |
| **Expand scope** | ❌ **NO** - MUST reject | Original: `profile email`<br>Request: `profile email admin`<br>Result: **ERROR** | RFC 6749 §6 |

### 7.2 Scope Validation Logic

```
FUNCTION validateRefreshScope(requestedScope, originalScope):
    # If scope omitted, use original scope
    IF requestedScope IS empty:
        RETURN originalScope
    
    # Parse scopes
    requestedSet = parseScopes(requestedScope)
    originalSet = parseScopes(originalScope)
    
    # Check if requested is subset of original
    IF NOT (requestedSet ⊆ originalSet):
        # Scope expansion attempted
        extraScopes = requestedSet - originalSet
        RETURN error("invalid_scope", 
                    "Cannot expand scope. Unauthorized scopes: " + extraScopes)
    
    # Scope reduction is OK
    RETURN requestedScope
```

### 7.3 Example Scenarios

#### Scenario 1: Scope Reduction (Valid)

**Original authorization:**
```
scope=profile email calendar contacts
```

**Refresh request:**
```http
POST /token HTTP/1.1
Host: authorization-server.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=tGzv3JOkF0XG5Qx2TlKWIA
&scope=profile%20email
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "profile email"  ← Reduced scope granted
}
```

**Use case:** User revoked calendar permission, app adapts by requesting only profile and email.

#### Scenario 2: Scope Expansion (Invalid)

**Original authorization:**
```
scope=profile email
```

**Refresh request:**
```http
POST /token HTTP/1.1
Host: authorization-server.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=tGzv3JOkF0XG5Qx2TlKWIA
&scope=profile%20email%20admin
```

**Response:**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "invalid_scope",
  "error_description": "Requested scope 'admin' exceeds original authorization. Original scope: 'profile email'"
}
```

**Client action:** Must initiate new authorization flow to request expanded scope.

#### Scenario 3: Scope Omitted (Uses Original)

**Original authorization:**
```
scope=profile email calendar
```

**Refresh request (no scope parameter):**
```http
POST /token HTTP/1.1
Host: authorization-server.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=tGzv3JOkF0XG5Qx2TlKWIA
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "profile email calendar"  ← Original scope maintained
}
```

---

## 8. Security Threat Model for Refresh Tokens

### 8.1 Refresh Token Theft (Security BCP §4.13.1)

#### Attack Description

An attacker gains access to a refresh token through various means and uses it to obtain access tokens, potentially maintaining persistent access to the victim's account.

**Attack vectors:**
- **Insecure storage:** Token stored in plaintext file, localStorage, or unencrypted database
- **Log exposure:** Token logged in application logs, debug output, or error messages
- **Network interception:** Token transmitted over HTTP or logged by proxy
- **Backup exposure:** Token in unencrypted backups
- **Memory dump:** Token extracted from process memory
- **XSS attack:** JavaScript reads token from insecure storage in browser
- **Malware:** Malicious software accesses token storage

#### Attack Sequence

```
1. Attacker gains access to token storage:
   - Compromised server → reads database
   - XSS attack → reads localStorage
   - Malware → reads files

2. Attacker extracts refresh_token:
   refresh_token=tGzv3JOkF0XG5Qx2TlKWIA

3. Attacker uses stolen token:
   POST /token
   grant_type=refresh_token
   refresh_token=tGzv3JOkF0XG5Qx2TlKWIA

4. Server issues access token to attacker

5. Attacker has persistent access:
   - Can obtain new access tokens indefinitely
   - Access lasts until token expires or is revoked
   - May remain undetected for days/weeks
```

#### Exploit Demonstration (Vulnerable Mode: `INSECURE_STORAGE` + `ALLOW_TOKEN_EXPORT`)

```javascript
// Tool demonstrates: Insecure token storage

// Vulnerable: localStorage (XSS can steal)
localStorage.setItem('refresh_token', 'tGzv3JOkF0XG5Qx2TlKWIA');  // ❌ WRONG

// Vulnerable: Plaintext file
fs.writeFileSync('tokens.txt', refresh_token);  // ❌ WRONG

// Vulnerable: Logged to console/files
console.log('Refresh token:', refresh_token);  // ❌ WRONG
logger.debug(`Token refresh successful: ${refresh_token}`);  // ❌ WRONG

// Vulnerable: Unencrypted database
db.query('INSERT INTO tokens VALUES (?)', [refresh_token]);  // ❌ WRONG

// Attack simulation:
async function stealAndUseToken() {
  // Attacker gains access to storage
  const stolenToken = localStorage.getItem('refresh_token');
  
  // Attacker uses stolen token
  const response = await fetch('https://auth.example.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: stolenToken,
      client_id: 'victim_client_id'
    })
  });
  
  const tokens = await response.json();
  // Attacker now has valid access token
  return tokens.access_token;
}
```

#### Mitigation

| Mitigation | Description | Spec Reference |
|------------|-------------|----------------|
| **Secure storage** | Use OS keychain, encrypted database, or secure vault | Security BCP §4.13 |
| **Refresh token rotation** | Issue new refresh token on each use, invalidate old | Security BCP §4.13.2 |
| **Sender-constrained tokens (DPoP)** | Bind refresh token to public key proof | RFC 9449 |
| **Short lifetimes** | Limit refresh token validity (30-90 days) | Security best practice |
| **Never log tokens** | Exclude tokens from all logging | Security best practice |
| **Encryption at rest** | Encrypt tokens in database | Security best practice |
| **Access controls** | Limit who/what can access token storage | Security best practice |
| **BFF pattern for SPAs** | Keep refresh tokens on backend, never in browser | Security BCP §4.13.2 |

#### Validation Requirements

| Check | Implementation | Spec Reference |
|-------|----------------|----------------|
| Secure storage | Tokens MUST be encrypted at rest | Security BCP §4.13 |
| Access controls | Restrict token storage access | Security best practice |
| Rotation enabled | Public clients MUST rotate | OAuth 2.1 §6 |
| No browser storage | SPAs MUST use BFF pattern | Security BCP §4.13.2 |

---

### 8.2 Refresh Token Replay After Rotation (Security BCP §4.13.3)

#### Attack Description

After a refresh token has been rotated (used once and replaced), an attacker attempts to use the old (invalidated) refresh token. This indicates either token theft or a serious client bug.

**Attack variants:**
- **Direct replay:** Attacker has old token, tries to use it
- **Race condition abuse:** Attacker captures token mid-rotation
- **Backup restoration:** Old token recovered from backup

#### Attack Sequence

```
Normal flow:
1. User uses RT_1 → Server issues AT_1 + RT_2, invalidates RT_1
2. User stores RT_2

Attack:
3. Attacker (who stole RT_1 earlier) tries: RT_1
4. Server detects: RT_1 was already rotated
5. Server action: 
   - If within replay window (5-10s): return error
   - If outside replay window: REVOKE ALL tokens in family

Timeline visualization:
T0: User has RT_1
T1: Attacker steals RT_1
T2: User uses RT_1 → RT_2 (RT_1 now invalid)
T3: User uses RT_2 → RT_3 (RT_2 now invalid)
T4: Attacker tries RT_1 → REPLAY DETECTED → REVOKE ALL
```

#### Exploit Demonstration (Vulnerable Mode: `REUSABLE_REFRESH_TOKENS`)

```javascript
// Tool demonstrates: No rotation enforcement

// Vulnerable server: Allows reuse of refresh tokens
async function refreshTokenNoRotation(refreshToken) {
  // Server validates but doesn't rotate
  if (isValid(refreshToken)) {
    return {
      access_token: generateNewAccessToken(),
      // No new refresh_token! Client keeps reusing same one
      token_type: "Bearer",
      expires_in: 3600
    };
  }
}

// Attack scenario:
async function demonstrateReplay() {
  // T0: Legitimate user has refresh token
  const refreshToken = "tGzv3JOkF0XG5Qx2TlKWIA";
  
  // T1: Attacker steals refresh token
  const stolenToken = stealToken();  // stolenToken = "tGzv3JOkF0XG5Qx2TlKWIA"
  
  // T2: User refreshes (no rotation, keeps same token)
  await userRefresh(refreshToken);
  
  // T3: Attacker can still use stolen token!
  const attackerTokens = await attackerRefresh(stolenToken);
  // Attack succeeds - no rotation means stolen token still valid
  
  // T4: User refreshes again
  await userRefresh(refreshToken);
  
  // T5: Attacker STILL can use it
  await attackerRefresh(stolenToken);  // Still works!
  
  // Without rotation, attacker has indefinite access
}
```

#### Mitigation

| Mitigation | Description | Spec Reference |
|------------|-------------|----------------|
| **Per-use rotation** | Issue new refresh token on every use | Security BCP §4.13.2 |
| **Replay detection** | Track used tokens, detect reuse attempts | Security BCP §4.13.3 |
| **Family revocation** | Revoke all tokens in family on replay | Security BCP §4.13.3 |
| **Grace period** | Allow 5-10s window for legitimate race conditions | Security best practice |
| **Monitoring** | Alert on replay attempts | Security best practice |

#### Validation Requirements

| Check | Implementation | Spec Reference |
|-------|----------------|----------------|
| Rotation enabled | Public clients MUST rotate | OAuth 2.1 §6 |
| Single-use enforcement | Mark token as used, reject reuse | Security BCP §4.13.2 |
| Replay detection | Detect out-of-window reuse | Security BCP §4.13.3 |
| Family revocation | Revoke all on replay | Security BCP §4.13.3 |

---

### 8.3 Scope Escalation via Refresh (RFC 6749 §6)

#### Attack Description

A malicious or compromised client attempts to request broader scope during token refresh than was originally authorized, bypassing the user's original consent.

**Attack variants:**
- **Direct escalation:** Request explicitly includes unauthorized scope
- **Gradual escalation:** Slowly add scopes over multiple refreshes
- **Scope confusion:** Similar scope names to trick validation

#### Attack Sequence

```
1. User authorizes app with limited scope:
   Original authorization: scope=profile email

2. Attacker (compromised client) attempts escalation:
   POST /token
   grant_type=refresh_token
   refresh_token=tGzv3JOkF0XG5Qx2TlKWIA
   scope=profile email admin  ← Added 'admin'

3a. Vulnerable server: Grants expanded scope
    → Attacker gains admin access without user consent

3b. Secure server: Rejects request
    → Attack fails with invalid_scope error
```

#### Exploit Demonstration (Vulnerable Mode: `ALLOW_SCOPE_ESCALATION`)

```javascript
// Tool demonstrates: Insufficient scope validation

// Vulnerable server: Doesn't validate scope expansion
async function refreshTokenUnsafe(refreshToken, requestedScope) {
  const storedToken = await db.findRefreshToken(refreshToken);
  
  // ❌ WRONG: No validation that requested ⊆ original
  const newAccessToken = generateAccessToken({
    user_id: storedToken.user_id,
    scope: requestedScope  // Blindly uses requested scope!
  });
  
  return {
    access_token: newAccessToken,
    scope: requestedScope
  };
}

// Attack scenario:
async function escalatePrivileges() {
  // User originally authorized: profile email
  const originalScope = "profile email";
  
  // Attacker's compromised client requests more:
  const maliciousScope = "profile email admin delete_all";
  
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: stolenToken,
      scope: maliciousScope
    })
  });
  
  const tokens = await response.json();
  // Vulnerable server grants admin scope without user consent!
  // tokens.scope = "profile email admin delete_all"
}
```

#### Mitigation

| Mitigation | Description | Spec Reference |
|------------|-------------|----------------|
| **Scope validation** | Server MUST validate requested ⊆ original | RFC 6749 §6 |
| **Scope binding** | Bind refresh token to original authorized scope | RFC 6749 §6 |
| **Audit logging** | Log scope changes for review | Security best practice |
| **Scope reduction only** | Allow reduction, reject expansion | RFC 6749 §6 |

#### Validation Requirements

| Check | Implementation | Spec Reference |
|-------|----------------|----------------|
| Subset validation | requestedScope ⊆ originalScope | RFC 6749 §6 |
| Scope binding | Refresh token stores original scope | RFC 6749 §6 |
| Rejection on expansion | Return invalid_scope error | RFC 6749 §5.2 |
| Audit trail | Log all scope changes | Security best practice |

---

### 8.4 Long-Lived Refresh Token Exposure

#### Attack Description

Refresh tokens with excessively long lifetimes (months to years) create extended windows for theft and exploitation.

**Attack vectors:**
- **Forgotten tokens:** Token in old backup valid for years
- **Compromised storage:** Attacker gains access to long-lived tokens
- **Insider threat:** Employee with old credentials
- **Lost device:** Mobile device with long-lived token

#### Attack Sequence

```
1. User authorizes app, receives refresh token
   expires_in: 31536000 (1 year)

2. [6 months pass]

3. Attacker gains access to token storage
   refresh_token still valid for 6 more months

4. Attacker uses token:
   - Can obtain new access tokens for 6 months
   - User may not notice (app still works normally)
   - No expiration forcing re-authentication

5. Extended attack window allows:
   - Data exfiltration over time
   - Subtle account modifications
   - Maintaining persistent backdoor
```

#### Exploit Demonstration (Vulnerable Mode: `INFINITE_REFRESH_LIFETIME`)

```javascript
// Tool demonstrates: Excessively long token lifetime

// Vulnerable: 10-year refresh token
const refreshToken = generateRefreshToken({
  user_id: userId,
  expires_in: 10 * 365 * 24 * 3600  // 10 years! ❌ WRONG
});

// Vulnerable: No expiration at all
const immortalToken = generateRefreshToken({
  user_id: userId,
  expires_in: null  // Never expires ❌ WRONG
});

// Attack scenario:
async function longTermCompromise() {
  // 2020: Token issued with 10-year lifetime
  const token = issueToken(userId, 10 * 365 * 24 * 3600);
  
  // 2025: Attacker finds token in old backup
  const stolenToken = discoverInBackup();
  
  // Token still valid for 5 more years!
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: stolenToken
    })
  });
  
  // Attack succeeds - attacker has access until 2030
}
```

#### Mitigation

| Mitigation | Description | Spec Reference |
|------------|-------------|----------------|
| **Reasonable expiration** | 30-90 days for most use cases | Security best practice |
| **Rotation** | Regular rotation reduces effective lifetime | Security BCP §4.13.2 |
| **Activity-based expiration** | Expire after period of inactivity | Security best practice |
| **Security events** | Revoke on password change, suspicious activity | Security best practice |
| **User logout** | Revoke all refresh tokens on explicit logout | RFC 7009 |

#### Validation Requirements

| Check | Implementation | Spec Reference |
|-------|----------------|----------------|
| Maximum lifetime | Enforce reasonable limit (e.g., 90 days) | Security best practice |
| Expiration enforcement | Actually expire tokens | RFC 6749 §6 |
| Inactivity timeout | Expire after 30 days inactive | Security best practice |

---

### 8.5 Cross-Client Refresh Token Usage

#### Attack Description

An attacker attempts to use a refresh token with a different client_id than the one it was issued to, bypassing client binding.

**Attack vectors:**
- **Compromised client:** Attacker has access to multiple clients' credentials
- **Token theft:** Attacker steals token and uses with their own client
- **Malicious client:** Rogue client tries tokens from other clients

#### Attack Sequence

```
1. User authorizes App A (client_id: app-a-123)
   → Refresh token issued, bound to app-a-123

2. Attacker (with access to App B, client_id: app-b-456) steals token

3. Attacker tries to use token with App B:
   POST /token
   client_id=app-b-456
   refresh_token=[stolen from App A]

4a. Vulnerable server: Doesn't check client binding
    → Grants tokens to App B

4b. Secure server: Validates client binding
    → Rejects with invalid_grant
```

#### Exploit Demonstration (Vulnerable Mode: `SKIP_CLIENT_BINDING_CHECK`)

```javascript
// Tool demonstrates: Missing client binding validation

// Vulnerable server: Doesn't verify client_id
async function refreshTokenNoBinding(refreshToken, requestClientId) {
  const storedToken = await db.findRefreshToken(refreshToken);
  
  if (!storedToken || storedToken.expired) {
    return error("invalid_grant");
  }
  
  // ❌ WRONG: No check that requestClientId === storedToken.client_id
  
  const newAccessToken = generateAccessToken({
    user_id: storedToken.user_id,
    client_id: requestClientId  // Uses whatever client requested!
  });
  
  return { access_token: newAccessToken };
}

// Attack scenario:
async function crossClientAttack() {
  // App A issues token
  const appAToken = await authorizeAppA();
  // Token bound to client_id: "app-a-123"
  
  // Attacker steals token
  const stolenToken = stealFromAppA();
  
  // Attacker tries with App B
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: stolenToken,
      client_id: 'app-b-456'  // Different client!
    })
  });
  
  // Vulnerable server grants tokens to App B
  const tokens = await response.json();
  // Attack succeeds - attacker bypassed client binding
}
```

#### Mitigation

| Mitigation | Description | Spec Reference |
|------------|-------------|----------------|
| **Client binding** | Refresh token MUST be bound to client_id | RFC 6749 §6 |
| **Strict validation** | Reject if client_id doesn't match | RFC 6749 §6 |
| **Client authentication** | Confidential clients MUST authenticate | RFC 6749 §3.2.1 |
| **Audit logging** | Log client_id for all refresh requests | Security best practice |

#### Validation Requirements

| Check | Implementation | Spec Reference |
|-------|----------------|----------------|
| Client binding | storedToken.client_id === requestClientId | RFC 6749 §6 |
| Authentication | Confidential clients authenticate | RFC 6749 §3.2.1 |
| Rejection | Return invalid_grant on mismatch | RFC 6749 §5.2 |

---

## 9. Implementation Requirements Checklist

### 9.1 Authorization Server MUST Implement

| # | Requirement | Spec Reference | Vuln Mode |
|---|-------------|----------------|-----------|
| AS1 | Bind refresh tokens to client_id | RFC 6749 §6 | `SKIP_CLIENT_BINDING_CHECK` |
| AS2 | Validate scope not expanded in refresh requests | RFC 6749 §6 | `ALLOW_SCOPE_ESCALATION` |
| AS3 | Enforce refresh token expiration | RFC 6749 §6 | `INFINITE_REFRESH_LIFETIME` |
| AS4 | NOT issue refresh tokens for Client Credentials Flow | RFC 6749 §4.4.3 | `ISSUE_REFRESH_FOR_CLIENT_CREDS` |
| AS5 | Validate client authentication for confidential clients | RFC 6749 §3.2.1 | `SKIP_CLIENT_AUTH` |
| AS6 | Invalidate old refresh token when issuing new (rotation) | Security BCP §4.13.2 | `REUSABLE_REFRESH_TOKENS` |
| AS7 | Provide token revocation endpoint | RFC 7009 | - |
| AS8 | Return proper error codes per RFC 6749 §5.2 | RFC 6749 §5.2 | - |

### 9.2 Authorization Server SHOULD Implement

| # | Requirement | Spec Reference | Vuln Mode |
|---|-------------|----------------|-----------|
| AS9 | Rotate refresh tokens for public clients (REQUIRED in OAuth 2.1) | OAuth 2.1 §6 | `REUSABLE_REFRESH_TOKENS` |
| AS10 | Detect refresh token replay and revoke token family | Security BCP §4.13.3 | `NO_REPLAY_DETECTION` |
| AS11 | Support sender-constrained refresh tokens via DPoP | RFC 9449 §6 | - |
| AS12 | Implement reasonable refresh token lifetime (30-90 days) | Security best practice | `INFINITE_REFRESH_LIFETIME` |
| AS13 | Revoke refresh tokens on security events (password change, etc.) | Security best practice | - |
| AS14 | Implement token families for better rotation tracking | Security BCP §4.13.2 | - |

### 9.3 Client MUST Implement

| # | Requirement | Spec Reference | Vuln Mode |
|---|-------------|----------------|-----------|
| C1 | Store refresh tokens securely | Security BCP §4.13 | `INSECURE_STORAGE` |
| C2 | Replace old refresh token with new when rotation occurs | Security BCP §4.13.2 | - |
| C3 | Handle invalid_grant error (re-authenticate user) | RFC 6749 §5.2 | - |
| C4 | Refresh access token before expiration | Security best practice | - |
| C5 | Use HTTPS for all token endpoint requests | RFC 6749 §1.6 | `ALLOW_HTTP` |
| C6 | NOT request expanded scope in refresh requests | RFC 6749 §6 | `ALLOW_SCOPE_ESCALATION` |
| C7 | Authenticate if confidential client | RFC 6749 §3.2.1 | - |
| C8 | NOT log or expose refresh tokens | Security BCP §4.13 | `ALLOW_TOKEN_EXPORT` |

### 9.4 Public Clients MUST

| # | Requirement | Spec Reference |
|---|-------------|----------------|
| PC1 | Use refresh token rotation (OAuth 2.1) | OAuth 2.1 §6 |
| PC2 | Use PKCE with initial authorization | OAuth 2.1 §4.1 |
| PC3 | Store refresh tokens in OS-provided secure storage | Security BCP §4.13 |
| PC4 | NOT store refresh tokens in browser (use BFF pattern for SPAs) | Security BCP §4.13.2 |

### 9.5 Common Implementation Pitfalls

| Pitfall | Problem | Consequence | Spec Reference |
|---------|---------|-------------|----------------|
| Browser storage (localStorage) | Vulnerable to XSS | Token theft | Security BCP §4.13.2 |
| No rotation | Same token reused indefinitely | Extended theft window, no theft detection | Security BCP §4.13.2 |
| Long expiration | Tokens valid for years | Extended compromise window | Security best practice |
| Scope expansion allowed | Client can escalate privileges | Unauthorized access | RFC 6749 §6 |
| No client binding | Token works with any client | Cross-client attacks | RFC 6749 §6 |
| Logging tokens | Tokens in log files | Token exposure | Security BCP §4.13 |
| Plaintext storage | Tokens in unencrypted database | Easy theft | Security BCP §4.13 |
| No revocation endpoint | Cannot revoke compromised tokens | Persistent compromise | RFC 7009 |
| Issuing for Client Credentials | Client can refresh indefinitely | Violates RFC 6749 | RFC 6749 §4.4.3 |
| No replay detection | Replay attacks undetected | Theft goes unnoticed | Security BCP §4.13.3 |

---

## 10. Refresh Token Lifecycle

### 10.1 Lifecycle Stages

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Refresh Token Lifecycle                             │
└─────────────────────────────────────────────────────────────────────────┘

   ┌───────────┐
   │ ISSUANCE  │
   └─────┬─────┘
         │
         │ Initial authorization (Authorization Code / Device Flow)
         ▼
   ┌─────────────┐
   │   ACTIVE    │◄──────────┐
   └─────┬───────┘           │
         │                   │ Rotation: Issue new token
         │                   │
         │ Token used        │
         ├──────────────────►│
         │                   
         │ Expiration / Revocation / Security Event
         ▼
   ┌─────────────┐
   │  INVALIDATED│
   └─────────────┘
         │
         │ Replay attempt
         ▼
   ┌─────────────┐
   │  REVOKED    │ (All tokens in family revoked)
   └─────────────┘
```

### 10.2 Issuance Conditions

Refresh tokens are issued when:

| Condition | Description |
|-----------|-------------|
| Flow type | Authorization Code or Device Authorization Flow |
| Client type | Typically issued to both confidential and public clients |
| Scope requested | `offline_access` scope (OIDC) or server policy |
| Server policy | Based on client registration settings |
| User consent | User must consent to offline access (OIDC) |

**Not issued when:**
- Client Credentials Flow (forbidden by RFC 6749 §4.4.3)
- Implicit Flow (deprecated, insecure)
- Server policy prohibits for specific client/scope

### 10.3 Storage Requirements by Client Type

#### Backend Server (Confidential Client)

```javascript
// Store in encrypted database
const encryptedToken = encrypt(refreshToken, encryptionKey);

await db.query(`
  INSERT INTO user_tokens (user_id, client_id, refresh_token, expires_at)
  VALUES (?, ?, ?, ?)
`, [userId, clientId, encryptedToken, expiresAt]);

// Retrieve and decrypt
const row = await db.query('SELECT refresh_token FROM user_tokens WHERE user_id = ?', [userId]);
const refreshToken = decrypt(row.refresh_token, encryptionKey);
```

**Requirements:**
- Encryption at rest
- Access controls
- Audit logging
- Backup encryption

#### Native Mobile App (Public Client)

```swift
// iOS: Store in Keychain
let query: [String: Any] = [
    kSecClass as String: kSecClassGenericPassword,
    kSecAttrAccount as String: "refresh_token",
    kSecValueData as String: refreshToken.data(using: .utf8)!,
    kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock
]

let status = SecItemAdd(query as CFDictionary, nil)
```

```kotlin
// Android: Store in Keystore
val keyStore = KeyStore.getInstance("AndroidKeyStore")
keyStore.load(null)

val encryptionKey = keyStore.getKey("token_encryption_key", null) as SecretKey
val cipher = Cipher.getInstance("AES/GCM/NoPadding")
cipher.init(Cipher.ENCRYPT_MODE, encryptionKey)

val encryptedToken = cipher.doFinal(refreshToken.toByteArray())
sharedPreferences.edit()
    .putString("refresh_token", Base64.encodeToString(encryptedToken, Base64.DEFAULT))
    .apply()
```

**Requirements:**
- OS-provided secure storage (Keychain/Keystore)
- Hardware-backed encryption when available
- Biometric protection (optional but recommended)

#### Single Page Application (Public Client)

```
❌ WRONG: Store in browser
localStorage.setItem('refresh_token', token);
sessionStorage.setItem('refresh_token', token);
document.cookie = `refresh_token=${token}`;

✅ CORRECT: Backend-for-Frontend (BFF) Pattern

Frontend (SPA)              BFF (Backend)              Auth Server
    │                           │                           │
    │ (1) Login request          │                           │
    ├──────────────────────────►│                           │
    │                           │ (2) Authorization         │
    │                           ├──────────────────────────►│
    │                           │                           │
    │                           │ (3) Tokens (AT + RT)      │
    │                           │◄──────────────────────────┤
    │                           │                           │
    │                           │ Store RT in session       │
    │                           │ Return AT in secure       │
    │                           │ HttpOnly cookie           │
    │ (4) Access token cookie   │                           │
    │◄──────────────────────────┤                           │
    │                           │                           │
    │ (5) API request with AT   │                           │
    ├──────────────────────────►│                           │
    │                           │                           │
    │ (6) AT expired            │                           │
    │                           │ (7) Use RT to refresh     │
    │                           ├──────────────────────────►│
    │                           │                           │
    │                           │ (8) New tokens            │
    │                           │◄──────────────────────────┤
    │                           │                           │
    │ (9) New AT cookie         │                           │
    │◄──────────────────────────┤                           │
```

**BFF Implementation:**

```javascript
// BFF endpoint
app.post('/auth/refresh', sessionMiddleware, async (req, res) => {
  // Refresh token stored server-side in session
  const refreshToken = req.session.refreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token' });
  }
  
  try {
    // Use refresh token
    const response = await fetch(authServer + '/token', {
      method: 'POST',
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      })
    });
    
    const tokens = await response.json();
    
    // Store new refresh token in session
    req.session.refreshToken = tokens.refresh_token || refreshToken;
    
    // Return access token in HttpOnly cookie
    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: tokens.expires_in * 1000
    });
    
    res.json({ success: true });
  } catch (error) {
    // Refresh failed - user must re-authenticate
    req.session.destroy();
    res.status(401).json({ error: 'Refresh failed' });
  }
});
```

**Why BFF is necessary for SPAs:**
- No secure storage in browser
- LocalStorage vulnerable to XSS
- Cookies vulnerable without HttpOnly flag
- Refresh tokens too valuable to expose to JavaScript

### 10.4 Expiration Scenarios

#### Time-Based Expiration

```javascript
// Token issued with expiration
{
  refresh_token: "tGzv3JOkF0XG5Qx2TlKWIA",
  issued_at: 1638360000,
  expires_at: 1640952000  // 30 days later
}

// Token refresh attempt after expiration
if (currentTime > token.expires_at) {
  return error("invalid_grant", "Refresh token expired");
}
```

#### Explicit Revocation

```javascript
// User logs out - revoke all tokens
async function logout(userId) {
  // Revoke all refresh tokens for user
  await db.query('UPDATE refresh_tokens SET revoked = true WHERE user_id = ?', [userId]);
  
  // Optionally revoke associated access tokens
  await db.query('UPDATE access_tokens SET revoked = true WHERE user_id = ?', [userId]);
  
  return { success: true };
}
```

#### Security Event Revocation

```javascript
// User changes password - revoke all refresh tokens
async function onPasswordChange(userId) {
  await db.query(`
    UPDATE refresh_tokens 
    SET revoked = true, 
        revoked_at = NOW(), 
        revoke_reason = 'password_change'
    WHERE user_id = ?
  `, [userId]);
  
  await notifyUser(userId, 'All devices have been logged out due to password change');
}

// Suspicious activity detected
async function onSuspiciousActivity(userId, reason) {
  await db.query(`
    UPDATE refresh_tokens 
    SET revoked = true, 
        revoked_at = NOW(), 
        revoke_reason = ?
    WHERE user_id = ?
  `, [reason, userId]);
  
  await alertSecurityTeam({ userId, reason });
}
```

### 10.5 Token Revocation (RFC 7009)

**Per RFC 7009:** Authorization servers SHOULD provide a revocation endpoint.

#### Revocation Request

```http
POST /revoke HTTP/1.1
Host: authorization-server.example.com
Content-Type: application/x-www-form-urlencoded
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW

token=tGzv3JOkF0XG5Qx2TlKWIA
&token_type_hint=refresh_token
```

**Parameters:**

| Parameter | RFC 2119 | Description | Spec Reference |
|-----------|----------|-------------|----------------|
| `token` | **REQUIRED** | The token to revoke | RFC 7009 §2.1 |
| `token_type_hint` | OPTIONAL | Hint about token type (`refresh_token` or `access_token`) | RFC 7009 §2.1 |

#### Revocation Response

```http
HTTP/1.1 200 OK
```

**Per RFC 7009 §2.2:** The server responds with HTTP 200 whether the token was valid or not (prevents token scanning).

#### Cascade Revocation

When a refresh token is revoked:

```javascript
async function revokeRefreshToken(refreshToken) {
  // 1. Find token
  const token = await db.findRefreshToken(refreshToken);
  
  if (!token) {
    // RFC 7009: Respond 200 even if token not found
    return { success: true };
  }
  
  // 2. Mark refresh token as revoked
  await db.query('UPDATE refresh_tokens SET revoked = true WHERE id = ?', [token.id]);
  
  // 3. Revoke all access tokens issued from this refresh token
  await db.query(`
    UPDATE access_tokens 
    SET revoked = true 
    WHERE refresh_token_id = ?
  `, [token.id]);
  
  // 4. If part of family, optionally revoke family
  if (shouldRevokFamily(token)) {
    await revokeTokenFamily(token.family_id);
  }
  
  return { success: true };
}
```

---

## 11. Relationship with OIDC offline_access

### 11.1 OIDC offline_access Scope (OIDC Core §11)

In OpenID Connect, the `offline_access` scope provides explicit control over refresh token issuance.

**Per OIDC Core §11:**
- `offline_access` scope requests that an OAuth 2.0 refresh token be issued
- Used to obtain access to the UserInfo Endpoint when the user is not present
- MUST be shown on consent screen
- If granted, OpenID Provider SHOULD return refresh token

### 11.2 Authorization Request with offline_access

```http
GET /authorize?
  response_type=code
  &client_id=s6BhdRkqt3
  &redirect_uri=https%3A%2F%2Fclient.example.org%2Fcallback
  &scope=openid%20profile%20email%20offline_access
  &state=af0ifjsldkj
  &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  &code_challenge_method=S256
  &nonce=n-0S6_WzA2Mj
HTTP/1.1
Host: auth.example.com
```

### 11.3 Consent Screen Requirements

**Per OIDC Core §11:** When `offline_access` is requested, authorization server MUST inform the user.

**Example consent screen:**

```
┌─────────────────────────────────────────┐
│  MyApp wants to access your account    │
│                                         │
│  This application is requesting:        │
│  • View your profile                    │
│  • View your email address              │
│  • Access your account when you're      │
│    not present (offline access)         │
│                                         │
│  ⚠️ Offline access allows this app to  │
│     access your data even when you're   │
│     not actively using it.              │
│                                         │
│  [Deny]  [Allow]                        │
└─────────────────────────────────────────┘
```

### 11.4 Token Response with offline_access

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "access_token": "SlAV32hkKG",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "tGzv3JOkF0XG5Qx2TlKWIA",  ← Issued due to offline_access
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "scope": "openid profile email offline_access"
}
```

### 11.5 offline_access vs Regular OAuth 2.0

| Aspect | OIDC with offline_access | OAuth 2.0 (no offline_access) |
|--------|-------------------------|------------------------------|
| Refresh token issuance | Explicit via scope | Server policy decision |
| User awareness | MUST be shown on consent | May or may not be explicit |
| Intended use | Access UserInfo when offline | Extend session without re-auth |
| Specification | OIDC Core §11 | RFC 6749 §6 |

---

## 12. Validation Rules (Exact Spec Requirements)

### 12.1 Client Authentication Validation

```
FUNCTION validateClientForRefresh(request):
    client = extractClientCredentials(request)
    
    # Confidential clients MUST authenticate (RFC 6749 §3.2.1)
    IF client.type == "confidential":
        IF NOT authenticated(request):
            RETURN error("invalid_client", "Client authentication required")
    
    # Public clients include client_id in request
    IF client.type == "public":
        IF NOT request.body.contains("client_id"):
            RETURN error("invalid_request", "client_id required")
    
    RETURN client
```

### 12.2 Refresh Token Binding Validation

```
FUNCTION validateRefreshTokenBinding(refreshToken, clientId):
    storedToken = tokenStore.get(refreshToken)
    
    IF storedToken IS null:
        RETURN error("invalid_grant", "Invalid refresh token")
    
    # RFC 6749 §6: Refresh token MUST be bound to client
    IF storedToken.client_id != clientId:
        logSecurityEvent("refresh_token_client_mismatch", {
            stored_client: storedToken.client_id,
            requested_client: clientId
        })
        RETURN error("invalid_grant", "Token not issued to this client")
    
    RETURN storedToken
```

### 12.3 Scope Expansion Prevention

```
FUNCTION validateRefreshScope(requestedScope, originalScope):
    # If no scope requested, use original scope (RFC 6749 §6)
    IF requestedScope IS empty:
        RETURN originalScope
    
    # Parse scopes
    requestedSet = parseScopes(requestedScope)
    originalSet = parseScopes(originalScope)
    
    # RFC 6749 §6: Requested scope MUST NOT exceed original scope
    IF NOT (requestedSet ⊆ originalSet):
        extraScopes = requestedSet - originalSet
        RETURN error("invalid_scope", 
                    "Cannot expand scope. Original: " + originalScope + 
                    ", Requested: " + requestedScope +
                    ", Unauthorized: " + extraScopes)
    
    # Scope reduction is allowed
    RETURN requestedScope
```

### 12.4 Refresh Token Rotation Validation

```
FUNCTION validateAndRotateRefreshToken(refreshToken, clientId):
    storedToken = tokenStore.get(refreshToken)
    
    # Check if already used (replay detection)
    IF storedToken.used:
        timeSinceUse = currentTime() - storedToken.used_at
        
        # Security BCP §4.13.3: Detect replay outside grace period
        IF timeSinceUse > REPLAY_GRACE_PERIOD:
            # Replay detected - revoke entire family
            revokeTokenFamily(storedToken.family_id)
            alertSecurity("refresh_token_replay", {
                user_id: storedToken.user_id,
                family_id: storedToken.family_id,
                time_since_use: timeSinceUse
            })
            RETURN error("invalid_grant", "Token replay detected - all tokens revoked")
        
        # Within grace period - might be race condition
        RETURN error("invalid_grant", "Token already used")
    
    # Check expiration
    IF storedToken.expires_at < currentTime():
        RETURN error("invalid_grant", "Refresh token expired")
    
    # Check revocation
    IF storedToken.revoked:
        RETURN error("invalid_grant", "Refresh token revoked")
    
    # Mark as used
    storedToken.used = true
    storedToken.used_at = currentTime()
    tokenStore.update(storedToken)
    
    # OAuth 2.1 §6: Public clients MUST rotate
    # Security BCP §4.13.2: SHOULD rotate for all clients
    IF shouldRotate(clientId):
        newRefreshToken = generateRefreshToken({
            user_id: storedToken.user_id,
            client_id: storedToken.client_id,
            scope: storedToken.scope,
            family_id: storedToken.family_id,
            generation: storedToken.generation + 1,
            parent: refreshToken
        })
        
        RETURN {
            access_token: generateAccessToken(...),
            refresh_token: newRefreshToken,
            rotated: true
        }
    
    RETURN {
        access_token: generateAccessToken(...),
        rotated: false
    }
```

### 12.5 Validation Requirements Summary

| Requirement | Validation | Spec Reference |
|-------------|------------|----------------|
| Client authentication | Confidential clients MUST authenticate | RFC 6749 §3.2.1 |
| Client binding | refresh_token.client_id === request.client_id | RFC 6749 §6 |
| Scope validation | requested_scope ⊆ original_scope | RFC 6749 §6 |
| Expiration check | current_time < token.expires_at | RFC 6749 §6 |
| Rotation (public) | Issue new refresh token for public clients | OAuth 2.1 §6 |
| Replay detection | Detect reuse of rotated tokens | Security BCP §4.13.3 |
| Revocation check | Reject if token.revoked = true | RFC 7009 |

---

## 13. Example Scenarios

### 13.1 Happy Path: Access Token Expires, Client Refreshes

**Scenario:** User is actively using application. Access token expires. Client seamlessly refreshes.

#### Initial State

```javascript
// Client has tokens from initial authorization
const tokens = {
  access_token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  refresh_token: "tGzv3JOkF0XG5Qx2TlKWIA",
  expires_at: Date.now() + 3600000  // 1 hour
};
```

#### Access Token Expiration

```javascript
// User tries to access protected resource
async function fetchUserProfile() {
  // Check if access token expired
  if (Date.now() >= tokens.expires_at - 60000) {  // Refresh 1 min early
    // Token expired or about to expire - refresh it
    await refreshAccessToken();
  }
  
  // Now use access token
  const response = await fetch('https://api.example.com/profile', {
    headers: {
      'Authorization': `Bearer ${tokens.access_token}`
    }
  });
  
  return await response.json();
}
```

#### Refresh Request

```http
POST /token HTTP/1.1
Host: authorization-server.example.com
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=tGzv3JOkF0XG5Qx2TlKWIA
```

#### Refresh Response

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",  ← New token
  "token_type": "Bearer",
  "expires_in": 3600
}
```

#### Client Updates Tokens

```javascript
async function refreshAccessToken() {
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token
    })
  });
  
  if (!response.ok) {
    // Refresh failed - redirect to login
    window.location = '/login';
    return;
  }
  
  const newTokens = await response.json();
  
  // Update access token
  tokens.access_token = newTokens.access_token;
  tokens.expires_at = Date.now() + (newTokens.expires_in * 1000);
  
  // If new refresh token provided (rotation), update it
  if (newTokens.refresh_token) {
    tokens.refresh_token = newTokens.refresh_token;
  }
  
  // Persist updated tokens
  await saveTokens(tokens);
}
```

**Result:** User experiences seamless session continuation without re-authentication.

---

### 13.2 Rotation Scenario: New Refresh Token Issued

**Scenario:** Public client uses refresh token. Server rotates, issuing new refresh token.

#### Initial Tokens

```javascript
{
  access_token: "AT_1",
  refresh_token: "RT_1",
  expires_in: 3600
}
```

#### Refresh Request

```http
POST /token HTTP/1.1
Host: authorization-server.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=RT_1
&client_id=public-client-123
```

#### Server Processing

```javascript
// Server side
const storedToken = await db.findRefreshToken("RT_1");

// Check not already used
if (storedToken.used) {
  // Replay detected!
  await revokeTokenFamily(storedToken.family_id);
  return error("invalid_grant", "Replay detected");
}

// Mark as used
await db.update('refresh_tokens', storedToken.id, { 
  used: true, 
  used_at: Date.now() 
});

// Generate new tokens
const newAccessToken = generateAccessToken({...});
const newRefreshToken = generateRefreshToken({
  ...storedToken,
  generation: storedToken.generation + 1,
  parent: "RT_1"
});
```

#### Response with Rotation

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "access_token": "AT_2",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "RT_2"  ← New refresh token
}
```

#### Client Updates

```javascript
// Client receives response
const newTokens = await response.json();

// CRITICAL: Replace old refresh token with new one
tokens.access_token = newTokens.access_token;
tokens.refresh_token = newTokens.refresh_token;  // RT_1 → RT_2
tokens.expires_at = Date.now() + (newTokens.expires_in * 1000);

// Save updated tokens
await secureStorage.set('tokens', tokens);

// RT_1 is now invalid - cannot be used again
```

**Token lineage:**
```
RT_1 (used) → RT_2 (active) → RT_3 (future) → ...
```

---

### 13.3 Theft Detection: Replay Triggers Revocation

**Scenario:** Attacker steals refresh token. Legitimate user rotates it. Attacker tries to use old token. All tokens revoked.

#### Timeline

```
T0: User has RT_1
T1: Attacker steals RT_1 (via XSS, malware, etc.)
T2: User uses RT_1 → Server issues RT_2, marks RT_1 as used
T3: Attacker tries to use RT_1 → REPLAY DETECTED
T4: Server revokes entire token family
T5: Both user and attacker lose access
T6: User re-authenticates
```

#### T2: Legitimate Use

```http
POST /token HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=RT_1
&client_id=mobile-app
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "access_token": "AT_2",
  "refresh_token": "RT_2"
}
```

**Server marks RT_1 as used:**
```javascript
{
  token: "RT_1",
  used: true,
  used_at: 1638360100,
  family_id: "family_abc123"
}
```

#### T3: Attacker Replay (5 minutes later)

```http
POST /token HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=RT_1  ← Already used!
&client_id=mobile-app
```

#### Server Detection

```javascript
const storedToken = await db.findRefreshToken("RT_1");

if (storedToken.used) {
  const timeSinceUse = Date.now() - storedToken.used_at;
  // 5 minutes = 300,000ms, well outside 10s grace period
  
  if (timeSinceUse > 10000) {  // 10 second grace period
    // REPLAY ATTACK DETECTED
    
    // 1. Revoke entire token family
    await db.query(`
      UPDATE refresh_tokens 
      SET revoked = true, revoke_reason = 'replay_detected'
      WHERE family_id = ?
    `, [storedToken.family_id]);
    
    // 2. Revoke all access tokens
    await db.query(`
      UPDATE access_tokens
      SET revoked = true
      WHERE family_id = ?
    `, [storedToken.family_id]);
    
    // 3. Alert security team
    await alertSecurity({
      event: 'refresh_token_replay',
      user_id: storedToken.user_id,
      family_id: storedToken.family_id,
      suspicious_token: "RT_1",
      time_since_use: timeSinceUse
    });
    
    return error("invalid_grant", "Token replay detected - all tokens revoked");
  }
}
```

#### Server Response

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "invalid_grant",
  "error_description": "Token replay detected - all tokens revoked for security"
}
```

#### Impact

**Legitimate user's next request:**
```http
POST /token HTTP/1.1
grant_type=refresh_token
&refresh_token=RT_2
```

```http
HTTP/1.1 400 Bad Request

{
  "error": "invalid_grant",
  "error_description": "Refresh token has been revoked"
}
```

**User redirected to login** - must re-authenticate.

**Result:** Both attacker and legitimate user lose access. User re-authenticates, establishing new token family. Attack is stopped.

---

### 13.4 Scope Reduction Scenario

**Scenario:** App originally requested broad permissions. User revokes some permissions. App adapts by requesting reduced scope.

#### Original Authorization

```
Scope granted: profile email calendar contacts photos
```

#### User Revokes Permissions

User visits account settings and revokes calendar and photos permissions.

#### App Detects Permission Change

```javascript
// App tries to access calendar
const response = await fetch('https://api.example.com/calendar', {
  headers: { 'Authorization': `Bearer ${access_token}` }
});

if (response.status === 403) {
  // Permission denied - user may have revoked scope
  // Request reduced scope on next refresh
}
```

#### Refresh with Reduced Scope

```http
POST /token HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=tGzv3JOkF0XG5Qx2TlKWIA
&scope=profile%20email%20contacts
```

#### Response

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "profile email contacts"  ← Reduced from original
}
```

**Result:** App continues operating with reduced permissions, respecting user's preferences.

---

### 13.5 Error Scenario: Expired Refresh Token

**Scenario:** Refresh token expires (user hasn't used app in 90 days). User returns, attempts to use app. Must re-authenticate.

#### User Returns After 90 Days

```javascript
// App tries to refresh token
async function resumeSession() {
  const tokens = await loadTokens();
  
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    return handleRefreshError(error);
  }
  
  // Success - update tokens
  const newTokens = await response.json();
  await saveTokens(newTokens);
}
```

#### Server Response

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "invalid_grant",
  "error_description": "The refresh token has expired"
}
```

#### Client Handling

```javascript
function handleRefreshError(error) {
  if (error.error === 'invalid_grant') {
    // Refresh token invalid/expired/revoked
    
    // Clear stored tokens
    await clearTokens();
    
    // Redirect to login
    window.location = '/login?message=session_expired';
  }
}
```

#### User Experience

```
┌────────────────────────────────────┐
│  Your session has expired          │
│                                    │
│  For your security, you need to    │
│  sign in again.                    │
│                                    │
│  [Sign In]                         │
└────────────────────────────────────┘
```

**Result:** User must re-authenticate. New authorization = new refresh token with fresh expiration.

---

### 13.6 SPA with BFF Pattern

**Scenario:** Single Page Application using Backend-for-Frontend to manage refresh tokens securely.

#### Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  Browser (SPA)  │◄───────►│  BFF (Backend)  │◄───────►│  Auth Server    │
│                 │  HTTPS  │                 │  HTTPS  │                 │
│  • JavaScript   │         │  • Session      │         │  • OAuth/OIDC   │
│  • No tokens    │         │  • Refresh      │         │  • Tokens       │
│    in browser   │         │    tokens       │         │                 │
│                 │         │  • Proxy        │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

#### BFF Endpoints

```javascript
// Backend-for-Frontend (BFF) server

// 1. Login endpoint
app.post('/auth/login', async (req, res) => {
  // Initiate OAuth flow
  const authUrl = buildAuthorizationUrl({
    client_id: CLIENT_ID,
    redirect_uri: BFF_CALLBACK_URL,
    scope: 'openid profile email',
    state: generateState(),
    code_challenge: generatePKCE()
  });
  
  res.redirect(authUrl);
});

// 2. OAuth callback
app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  
  // Exchange code for tokens
  const tokens = await fetch(authServer + '/token', {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: BFF_CALLBACK_URL
    })
  }).then(r => r.json());
  
  // Store refresh token in server-side session
  req.session.refresh_token = tokens.refresh_token;
  req.session.user_id = decodeToken(tokens.id_token).sub;
  
  // Return access token in HttpOnly cookie
  res.cookie('access_token', tokens.access_token, {
    httpOnly: true,     // JavaScript cannot access
    secure: true,       // HTTPS only
    sameSite: 'strict', // CSRF protection
    maxAge: tokens.expires_in * 1000
  });
  
  res.redirect('/dashboard');
});

// 3. API proxy endpoint (handles token refresh transparently)
app.get('/api/*', sessionMiddleware, async (req, res) => {
  let accessToken = req.cookies.access_token;
  
  // If access token expired, refresh it
  if (!accessToken || isExpired(accessToken)) {
    accessToken = await refreshAccessToken(req);
    
    if (!accessToken) {
      // Refresh failed - session expired
      return res.status(401).json({ error: 'Session expired' });
    }
    
    // Update access token cookie
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 3600000
    });
  }
  
  // Proxy request to API with access token
  const apiResponse = await fetch(API_BASE + req.path, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  res.json(await apiResponse.json());
});

// 4. Token refresh helper
async function refreshAccessToken(req) {
  const refreshToken = req.session.refresh_token;
  
  if (!refreshToken) {
    return null;
  }
  
  try {
    const response = await fetch(authServer + '/token', {
      method: 'POST',
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      })
    });
    
    if (!response.ok) {
      // Refresh failed
      req.session.destroy();
      return null;
    }
    
    const tokens = await response.json();
    
    // Update refresh token if rotated
    if (tokens.refresh_token) {
      req.session.refresh_token = tokens.refresh_token;
    }
    
    return tokens.access_token;
  } catch (error) {
    console.error('Token refresh failed:', error);
    req.session.destroy();
    return null;
  }
}

// 5. Logout endpoint
app.post('/auth/logout', sessionMiddleware, async (req, res) => {
  const refreshToken = req.session.refresh_token;
  
  // Revoke refresh token
  if (refreshToken) {
    await fetch(authServer + '/revoke', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET)
      },
      body: new URLSearchParams({
        token: refreshToken,
        token_type_hint: 'refresh_token'
      })
    });
  }
  
  // Destroy session
  req.session.destroy();
  
  // Clear access token cookie
  res.clearCookie('access_token');
  
  res.json({ success: true });
});
```

#### SPA Frontend

```javascript
// Frontend - no token management!

// Just call BFF API endpoints
async function fetchUserProfile() {
  // BFF handles token refresh transparently
  const response = await fetch('/api/profile');
  
  if (response.status === 401) {
    // Session expired - redirect to login
    window.location = '/login';
    return;
  }
  
  return await response.json();
}

// No tokens in localStorage!
// No tokens in JavaScript scope!
// Refresh token securely managed by BFF!
```

**Benefits of BFF Pattern:**
- Refresh tokens never exposed to browser
- XSS cannot steal refresh tokens
- Transparent token refresh
- Centralized security management
- Simpler frontend code

---

## Appendix A: RFC Cross-Reference Index

| Topic | RFC 6749 | OAuth 2.1 | Security BCP | OIDC Core |
|-------|----------|-----------|--------------|-----------|
| Refresh Token Grant | §6 | §6 | §4.13 | §12 |
| Token characteristics | §1.5 | §1.5 | — | — |
| Token issuance | §5.1 | §5.1 | — | §3.1.3.3 |
| Scope handling | §6 | §6 | — | — |
| Client authentication | §3.2.1 | §3.2.1 | — | — |
| Error responses | §5.2 | §5.2 | — | — |
| Token rotation | — | §6 | §4.13.2 | — |
| Theft detection | — | — | §4.13.3 | — |
| Token revocation | — | — | — | — |
| offline_access scope | — | — | — | §11 |

## Appendix B: Vulnerability Mode Quick Reference

| Toggle | Attack Demonstrated | Spec Violation | Document Section |
|--------|-------------------|----------------|------------------|
| `INSECURE_STORAGE` | Refresh token theft via poor storage | Security BCP §4.13 | §8.1 |
| `ALLOW_TOKEN_EXPORT` | Tokens logged or exposed | Security best practice | §8.1 |
| `REUSABLE_REFRESH_TOKENS` | No rotation, replay allowed | Security BCP §4.13.2 | §8.2 |
| `NO_REPLAY_DETECTION` | Replay not detected | Security BCP §4.13.3 | §8.2 |
| `ALLOW_SCOPE_ESCALATION` | Scope expansion during refresh | RFC 6749 §6 | §8.3 |
| `INFINITE_REFRESH_LIFETIME` | No token expiration | Security best practice | §8.4 |
| `SKIP_CLIENT_BINDING_CHECK` | Cross-client token usage | RFC 6749 §6 | §8.5 |
| `ISSUE_REFRESH_FOR_CLIENT_CREDS` | Refresh token for Client Credentials | RFC 6749 §4.4.3 | §3.1 |

---

*Document Version: 1.0.0*
*Last Updated: December 5, 2025*
*Specification References: RFC 6749 §6 (complete), OAuth 2.1 §6, Security BCP draft-ietf-oauth-security-topics-27 §4.13, RFC 7009 (complete), RFC 9449 §6, OIDC Core 1.0 §11, §12*

---

> *"Refresh tokens are a bit like spare keys. You keep them somewhere safe, they last a long time, and if someone steals them, you're in for a bad day. Also, you should probably change them occasionally, but let's be honest, when was the last time you rotated your spare key?"*
