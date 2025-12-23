# Authorization Code Flow with PKCE

## Specification Reference for OAuth2/OIDC Debugging Tool

> *"The ships hung in the sky in much the same way that bricks don't. Authorization codes, similarly, hang in the redirect URI in much the same way that access tokens shouldn't."*

---

## 1. Overview

The Authorization Code Flow is the OAuth 2.0 grant type designed for applications that can securely maintain a client secret (confidential clients) or that use PKCE to protect the authorization code exchange (public clients). The flow separates user authentication from token issuance, ensuring that access tokens are never exposed to the user-agent or potentially malicious browser history, referrer headers, or shoulder-surfers.

**PKCE (Proof Key for Code Exchange)** extends this flow to protect against authorization code interception attacks, making it the **REQUIRED** flow for all OAuth 2.0 clients per OAuth 2.1 and Security BCP (draft-ietf-oauth-security-topics-27) §2.1.1.

### When to Use This Flow

| Scenario | Use Authorization Code + PKCE? | Alternative |
|----------|-------------------------------|-------------|
| Web application with backend | ✅ Yes (REQUIRED) | None recommended |
| Single-page application (SPA) | ✅ Yes (REQUIRED) | None recommended |
| Native mobile application | ✅ Yes (REQUIRED) | None recommended |
| Native desktop application | ✅ Yes (REQUIRED) | None recommended |
| CLI tool with user interaction | ✅ Yes | Device Authorization Flow (RFC 8628) |
| Machine-to-machine (no user) | ❌ No | Client Credentials Flow |
| IoT device with no browser | ❌ No | Device Authorization Flow (RFC 8628) |

### Primary Specifications

| Specification | Sections | Purpose |
|---------------|----------|---------|
| RFC 6749 | §4.1 (complete) | Core Authorization Code Grant |
| RFC 7636 | §1-7 (complete) | PKCE extension |
| OAuth 2.1 | §4.1 | Updated requirements (PKCE mandatory) |
| Security BCP (draft-ietf-oauth-security-topics-27) | §2.1, §4.5, §4.8 | Security requirements |
| RFC 6819 | §4.4.1, §4.4.2, §4.4.3 | Threat model |
| OIDC Core 1.0 | §3.1 | OpenID Connect extensions |

---

## 2. Flow Diagram

### Complete Sequence (6 Steps)

```
┌──────────┐                                    ┌──────────────────┐                                    ┌──────────────┐
│          │                                    │                  │                                    │              │
│  User    │                                    │  Client          │                                    │  AuthZ       │
│  Agent   │                                    │  Application     │                                    │  Server      │
│ (Browser)│                                    │                  │                                    │              │
└────┬─────┘                                    └────────┬─────────┘                                    └──────┬───────┘
     │                                                   │                                                     │
     │  ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐   │
     │  │ STEP 0: PKCE Setup (Client-Side, Before Flow Begins)                                            │   │
     │  │   • Generate cryptographically random code_verifier (43-128 chars)                              │   │
     │  │   • Compute code_challenge = BASE64URL(SHA256(code_verifier))                                   │   │
     │  │   • Store code_verifier securely for later use                                                  │   │
     │  └─────────────────────────────────────────────────────────────────────────────────────────────────┘   │
     │                                                   │                                                     │
     │  ═══════════════════════════════════════════════════════════════════════════════════════════════════   │
     │                                          STEP 1: Authorization Request                                  │
     │  ═══════════════════════════════════════════════════════════════════════════════════════════════════   │
     │                                                   │                                                     │
     │         (1a) User clicks "Login"                  │                                                     │
     │   ─────────────────────────────────────────────►  │                                                     │
     │                                                   │                                                     │
     │         (1b) Redirect to Authorization Endpoint   │                                                     │
     │   ◄─────────────────────────────────────────────  │                                                     │
     │         HTTP 302 Location: authz_endpoint?        │                                                     │
     │           response_type=code                      │                                                     │
     │           &client_id=...                          │                                                     │
     │           &redirect_uri=...                       │                                                     │
     │           &scope=...                              │                                                     │
     │           &state=...                              │                                                     │
     │           &code_challenge=...                     │                                                     │
     │           &code_challenge_method=S256             │                                                     │
     │                                                   │                                                     │
     │  ═══════════════════════════════════════════════════════════════════════════════════════════════════   │
     │                                          STEP 2: User Authentication                                    │
     │  ═══════════════════════════════════════════════════════════════════════════════════════════════════   │
     │                                                   │                                                     │
     │         (2a) Follow redirect to AuthZ Server      │                                                     │
     │   ──────────────────────────────────────────────────────────────────────────────────────────────────►  │
     │                                                   │                                                     │
     │         (2b) AuthZ Server authenticates user      │                                                     │
     │              (login form, MFA, SSO, etc.)         │                                                     │
     │   ◄──────────────────────────────────────────────────────────────────────────────────────────────────  │
     │                                                   │                                                     │
     │         (2c) User provides credentials/consent    │                                                     │
     │   ──────────────────────────────────────────────────────────────────────────────────────────────────►  │
     │                                                   │                                                     │
     │  ═══════════════════════════════════════════════════════════════════════════════════════════════════   │
     │                                          STEP 3: Authorization Response                                 │
     │  ═══════════════════════════════════════════════════════════════════════════════════════════════════   │
     │                                                   │                                                     │
     │         (3) Redirect back to Client with code     │                                                     │
     │   ◄──────────────────────────────────────────────────────────────────────────────────────────────────  │
     │         HTTP 302 Location: redirect_uri?          │                                                     │
     │           code=AUTHORIZATION_CODE                 │                                                     │
     │           &state=ORIGINAL_STATE                   │                                                     │
     │                                                   │                                                     │
     │         (3b) Browser follows redirect             │                                                     │
     │   ─────────────────────────────────────────────►  │                                                     │
     │         GET redirect_uri?code=...&state=...       │                                                     │
     │                                                   │                                                     │
     │  ═══════════════════════════════════════════════════════════════════════════════════════════════════   │
     │                                          STEP 4: Token Request (Back-Channel)                           │
     │  ═══════════════════════════════════════════════════════════════════════════════════════════════════   │
     │                                                   │                                                     │
     │                                                   │  (4) POST to Token Endpoint                         │
     │                                                   │      grant_type=authorization_code                  │
     │                                                   │      &code=AUTHORIZATION_CODE                       │
     │                                                   │      &redirect_uri=...                              │
     │                                                   │      &client_id=...                                 │
     │                                                   │      &code_verifier=ORIGINAL_VERIFIER               │
     │                                                   │   ─────────────────────────────────────────────────►│
     │                                                   │                                                     │
     │  ═══════════════════════════════════════════════════════════════════════════════════════════════════   │
     │                                          STEP 5: Token Response                                         │
     │  ═══════════════════════════════════════════════════════════════════════════════════════════════════   │
     │                                                   │                                                     │
     │                                                   │  (5) Token Response (JSON)                          │
     │                                                   │      {                                              │
     │                                                   │        "access_token": "...",                       │
     │                                                   │        "token_type": "Bearer",                      │
     │                                                   │        "expires_in": 3600,                          │
     │                                                   │        "refresh_token": "...",                      │
     │                                                   │        "scope": "..."                               │
     │                                                   │      }                                              │
     │                                                   │   ◄─────────────────────────────────────────────────│
     │                                                   │                                                     │
     │  ═══════════════════════════════════════════════════════════════════════════════════════════════════   │
     │                                          STEP 6: Resource Access                                        │
     │  ═══════════════════════════════════════════════════════════════════════════════════════════════════   │
     │                                                   │                                                     │
     │                                                   │  (6) Access Protected Resource                      │
     │                                                   │      Authorization: Bearer ACCESS_TOKEN             │
     │                                                   │   ─────────────────────────────────────────────────►│
     │                                                   │                                                     │
     │         (Response to user)                        │  (Resource Response)                                │
     │   ◄─────────────────────────────────────────────  │   ◄─────────────────────────────────────────────────│
     │                                                   │                                                     │
     ▼                                                   ▼                                                     ▼
```

### Flow Summary Table

| Step | Direction | Channel | Contains Secrets? | Spec Reference |
|------|-----------|---------|-------------------|----------------|
| 1. Authorization Request | Client → AuthZ Server (via User-Agent) | Front-channel (browser redirect) | No (code_challenge is public) | RFC 6749 §4.1.1, RFC 7636 §4.3 |
| 2. User Authentication | User ↔ AuthZ Server | Front-channel | Yes (user credentials) | Implementation-specific |
| 3. Authorization Response | AuthZ Server → Client (via User-Agent) | Front-channel (browser redirect) | Yes (authorization code) | RFC 6749 §4.1.2 |
| 4. Token Request | Client → AuthZ Server | Back-channel (server-to-server) | Yes (code, code_verifier, client_secret) | RFC 6749 §4.1.3, RFC 7636 §4.5 |
| 5. Token Response | AuthZ Server → Client | Back-channel | Yes (access_token, refresh_token) | RFC 6749 §4.1.4 |
| 6. Resource Access | Client → Resource Server | Back-channel | Yes (access_token) | RFC 6750 §2.1 |

---

## 3. Request/Response Specifications

### 3.1 Authorization Request (RFC 6749 §4.1.1, RFC 7636 §4.3)

The client initiates the flow by redirecting the user-agent to the authorization endpoint.

#### Parameters

| Parameter | RFC 2119 | Source | Description | Spec Reference |
|-----------|----------|--------|-------------|----------------|
| `response_type` | **REQUIRED** | RFC 6749 | MUST be set to `code` | RFC 6749 §4.1.1 |
| `client_id` | **REQUIRED** | RFC 6749 | The client identifier | RFC 6749 §4.1.1, §2.2 |
| `redirect_uri` | **REQUIRED*** | RFC 6749 | Callback URI for authorization response | RFC 6749 §4.1.1, §3.1.2 |
| `scope` | OPTIONAL | RFC 6749 | Space-delimited scope values | RFC 6749 §4.1.1, §3.3 |
| `state` | **RECOMMENDED** | RFC 6749 | Opaque CSRF token (effectively REQUIRED per Security BCP) | RFC 6749 §4.1.1, §10.12 |
| `code_challenge` | **REQUIRED*** | RFC 7636 | BASE64URL(SHA256(code_verifier)) or code_verifier | RFC 7636 §4.3 |
| `code_challenge_method` | OPTIONAL | RFC 7636 | `plain` or `S256` (default: `plain`, SHOULD use `S256`) | RFC 7636 §4.3 |

> \* `redirect_uri` is REQUIRED if multiple URIs are registered or if no URI is registered (RFC 6749 §3.1.2.3). Per Security BCP §4.1.3, it SHOULD always be sent.
> 
> \* `code_challenge` is REQUIRED per OAuth 2.1 §4.1.1 and Security BCP §2.1.1 for all clients.

#### OIDC Additional Parameters (OIDC Core §3.1.2.1)

| Parameter | RFC 2119 | Description | Spec Reference |
|-----------|----------|-------------|----------------|
| `nonce` | OPTIONAL* | String value to associate client session with ID Token | OIDC Core §3.1.2.1 |
| `prompt` | OPTIONAL | `none`, `login`, `consent`, `select_account` | OIDC Core §3.1.2.1 |
| `max_age` | OPTIONAL | Maximum authentication age in seconds | OIDC Core §3.1.2.1 |
| `ui_locales` | OPTIONAL | Preferred locales for UI | OIDC Core §3.1.2.1 |
| `id_token_hint` | OPTIONAL | Previously issued ID Token | OIDC Core §3.1.2.1 |
| `login_hint` | OPTIONAL | Hint about user identifier | OIDC Core §3.1.2.1 |
| `acr_values` | OPTIONAL | Requested Authentication Context Class Reference | OIDC Core §3.1.2.1 |

> \* `nonce` is REQUIRED for Implicit Flow but OPTIONAL for Authorization Code Flow per OIDC Core. However, it SHOULD be used when ID Tokens are requested to prevent replay attacks.

#### Example Authorization Request

```http
GET /authorize?
    response_type=code
    &client_id=s6BhdRkqt3
    &redirect_uri=https%3A%2F%2Fclient.example.org%2Fcallback
    &scope=openid%20profile%20email
    &state=af0ifjsldkj
    &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
    &code_challenge_method=S256
    &nonce=n-0S6_WzA2Mj
HTTP/1.1
Host: server.example.com
```

#### Full URL Example

```
https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fclient.example.org%2Fcallback&scope=openid%20profile%20email&state=af0ifjsldkj&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256&nonce=n-0S6_WzA2Mj
```

---

### 3.2 Authorization Response (RFC 6749 §4.1.2)

Upon successful authentication and consent, the authorization server redirects the user-agent back to the client.

#### Success Response Parameters

| Parameter | RFC 2119 | Description | Spec Reference |
|-----------|----------|-------------|----------------|
| `code` | **REQUIRED** | The authorization code | RFC 6749 §4.1.2 |
| `state` | **REQUIRED*** | The exact `state` value from the request | RFC 6749 §4.1.2 |

> \* `state` is REQUIRED in response if it was present in the request.

#### Example Success Response

```http
HTTP/1.1 302 Found
Location: https://client.example.org/callback?
    code=SplxlOBeZQQYbYS6WxSbIA
    &state=af0ifjsldkj
```

#### Error Response Parameters (RFC 6749 §4.1.2.1)

| Parameter | RFC 2119 | Description |
|-----------|----------|-------------|
| `error` | **REQUIRED** | Error code from table below |
| `error_description` | OPTIONAL | Human-readable error description |
| `error_uri` | OPTIONAL | URI to error documentation |
| `state` | **REQUIRED*** | The exact `state` value from the request |

#### Error Codes (RFC 6749 §4.1.2.1)

| Error Code | Description | Common Cause |
|------------|-------------|--------------|
| `invalid_request` | Missing required parameter, invalid parameter value, or malformed request | Missing `response_type`, `client_id` |
| `unauthorized_client` | Client not authorized for this grant type | Client registered for different flow |
| `access_denied` | Resource owner denied the request | User clicked "Deny" on consent screen |
| `unsupported_response_type` | Authorization server doesn't support `response_type` | Using `token` when not allowed |
| `invalid_scope` | Requested scope is invalid, unknown, or exceeds granted scope | Typo in scope, requesting unregistered scope |
| `server_error` | Unexpected server error | Authorization server internal error |
| `temporarily_unavailable` | Server temporarily overloaded or in maintenance | Rate limiting, maintenance mode |

#### Example Error Response

```http
HTTP/1.1 302 Found
Location: https://client.example.org/callback?
    error=access_denied
    &error_description=The%20resource%20owner%20denied%20the%20request
    &state=af0ifjsldkj
```

---

### 3.3 Token Request (RFC 6749 §4.1.3, RFC 7636 §4.5)

The client exchanges the authorization code for tokens via a back-channel POST request.

#### Parameters

| Parameter | RFC 2119 | Description | Spec Reference |
|-----------|----------|-------------|----------------|
| `grant_type` | **REQUIRED** | MUST be `authorization_code` | RFC 6749 §4.1.3 |
| `code` | **REQUIRED** | The authorization code received | RFC 6749 §4.1.3 |
| `redirect_uri` | **REQUIRED*** | MUST match the `redirect_uri` from authorization request | RFC 6749 §4.1.3 |
| `client_id` | **REQUIRED*** | The client identifier | RFC 6749 §4.1.3 |
| `code_verifier` | **REQUIRED*** | The original PKCE code verifier | RFC 7636 §4.5 |

> \* `redirect_uri` is REQUIRED if it was included in the authorization request (RFC 6749 §4.1.3).
>
> \* `client_id` is REQUIRED if client is not authenticating via other means (RFC 6749 §4.1.3).
>
> \* `code_verifier` is REQUIRED if `code_challenge` was sent in the authorization request (RFC 7636 §4.5).

#### Client Authentication Methods

The client MUST authenticate with the authorization server (RFC 6749 §3.2.1) using one of:

| Method | Description | Spec Reference |
|--------|-------------|----------------|
| `client_secret_basic` | HTTP Basic Auth with client_id:client_secret | RFC 6749 §2.3.1 |
| `client_secret_post` | client_id and client_secret in request body | RFC 6749 §2.3.1 |
| `client_secret_jwt` | JWT signed with client_secret (HMAC) | RFC 7523 |
| `private_key_jwt` | JWT signed with private key (RSA/EC) | RFC 7523 |
| `tls_client_auth` | mTLS certificate authentication | RFC 8705 |
| `none` | Public client (no secret) — MUST use PKCE | RFC 6749 §2.1 |

#### Example Token Request (Confidential Client with client_secret_basic)

```http
POST /token HTTP/1.1
Host: server.example.com
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=SplxlOBeZQQYbYS6WxSbIA
&redirect_uri=https%3A%2F%2Fclient.example.org%2Fcallback
&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

#### Example Token Request (Public Client)

```http
POST /token HTTP/1.1
Host: server.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=SplxlOBeZQQYbYS6WxSbIA
&redirect_uri=https%3A%2F%2Fclient.example.org%2Fcallback
&client_id=s6BhdRkqt3
&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

---

### 3.4 Token Response (RFC 6749 §4.1.4, §5.1)

#### Success Response Parameters

| Parameter | RFC 2119 | Description | Spec Reference |
|-----------|----------|-------------|----------------|
| `access_token` | **REQUIRED** | The access token | RFC 6749 §5.1 |
| `token_type` | **REQUIRED** | Token type (typically `Bearer`) | RFC 6749 §5.1, RFC 6750 |
| `expires_in` | RECOMMENDED | Lifetime in seconds | RFC 6749 §5.1 |
| `refresh_token` | OPTIONAL | Refresh token for obtaining new access tokens | RFC 6749 §5.1 |
| `scope` | OPTIONAL* | Scope of access token | RFC 6749 §5.1 |

> \* `scope` is OPTIONAL if identical to requested scope, REQUIRED if different (RFC 6749 §5.1).

#### OIDC Additional Response Parameters (OIDC Core §3.1.3.3)

| Parameter | RFC 2119 | Description | Spec Reference |
|-----------|----------|-------------|----------------|
| `id_token` | **REQUIRED*** | ID Token value | OIDC Core §3.1.3.3 |

> \* `id_token` is REQUIRED when `openid` scope was requested.

#### Example Success Response

```http
HTTP/1.1 200 OK
Content-Type: application/json;charset=UTF-8
Cache-Control: no-store
Pragma: no-cache

{
    "access_token": "SlAV32hkKG",
    "token_type": "Bearer",
    "expires_in": 3600,
    "refresh_token": "8xLOxBtZp8",
    "scope": "openid profile email",
    "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Error Response (RFC 6749 §5.2)

| Parameter | RFC 2119 | Description |
|-----------|----------|-------------|
| `error` | **REQUIRED** | Error code from table below |
| `error_description` | OPTIONAL | Human-readable error description |
| `error_uri` | OPTIONAL | URI to error documentation |

#### Token Error Codes (RFC 6749 §5.2)

| Error Code | Description | Common Cause |
|------------|-------------|--------------|
| `invalid_request` | Missing required parameter or malformed request | Missing `grant_type`, malformed POST body |
| `invalid_client` | Client authentication failed | Wrong client_secret, unknown client_id |
| `invalid_grant` | Grant invalid, expired, revoked, or mismatched | Code expired, code already used, wrong redirect_uri, invalid code_verifier |
| `unauthorized_client` | Client not authorized for this grant type | Client not registered for authorization_code |
| `unsupported_grant_type` | Grant type not supported | Using `password` when disabled |
| `invalid_scope` | Requested scope is invalid | Scope exceeds what was originally authorized |

#### Example Error Response

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json;charset=UTF-8
Cache-Control: no-store
Pragma: no-cache

{
    "error": "invalid_grant",
    "error_description": "The authorization code has expired"
}
```

---

## 4. PKCE Deep Dive

### 4.1 Why PKCE Exists (RFC 7636 §1)

PKCE (pronounced "pixy") was designed to protect authorization code grants from interception attacks, particularly on mobile and native applications where:

1. **Custom URI schemes can be hijacked** — A malicious app can register the same custom scheme (e.g., `myapp://`) and intercept the authorization response (RFC 7636 §1, RFC 8252 §8.1)

2. **Authorization codes travel through potentially hostile environments** — Browser history, HTTP referrer headers, proxy logs, and shared devices can all leak codes

3. **Public clients cannot securely store client secrets** — Without a secret, anyone who intercepts the code can exchange it for tokens

**PKCE status per specification:**

| Specification | PKCE Requirement |
|---------------|------------------|
| RFC 6749 (OAuth 2.0) | Not mentioned (predates PKCE) |
| RFC 7636 | REQUIRED for public clients, RECOMMENDED for confidential clients |
| OAuth 2.1 | **REQUIRED for ALL clients** |
| Security BCP (draft-ietf-oauth-security-topics-27) §2.1.1 | **REQUIRED for ALL clients** |

### 4.2 code_verifier Requirements (RFC 7636 §4.1)

The `code_verifier` is a cryptographically random string that the client generates and stores before initiating the authorization request.

| Requirement | Value | Spec Reference |
|-------------|-------|----------------|
| Length | 43-128 characters | RFC 7636 §4.1 |
| Character set | `[A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"` (unreserved URI characters per RFC 3986 §2.3) | RFC 7636 §4.1 |
| Entropy | MUST be generated using a cryptographically secure random number generator | RFC 7636 §4.1 |
| Minimum entropy | 256 bits (achieved by 43+ chars from 66-char alphabet) | RFC 7636 §7.1 |

#### code_verifier Generation (Pseudocode)

```
function generateCodeVerifier():
    # Generate 32 random bytes (256 bits of entropy)
    randomBytes = cryptographicallySecureRandomBytes(32)
    
    # Base64url encode (produces 43 characters)
    codeVerifier = base64urlEncode(randomBytes)
    
    # Remove any padding characters
    codeVerifier = codeVerifier.replace("=", "")
    
    return codeVerifier
```

#### Example code_verifier

```
dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

### 4.3 code_challenge Generation (RFC 7636 §4.2)

The `code_challenge` is derived from the `code_verifier` using one of two transformation methods.

#### Transformation Methods

| Method | Transformation | Security | Spec Reference |
|--------|---------------|----------|----------------|
| `plain` | `code_challenge = code_verifier` | Weak (no protection if challenge intercepted) | RFC 7636 §4.2 |
| `S256` | `code_challenge = BASE64URL(SHA256(code_verifier))` | Strong (recommended) | RFC 7636 §4.2 |

**Per RFC 7636 §4.2:** Clients MUST use `S256` unless they cannot support it (e.g., constrained environment without SHA256), in which case `plain` MAY be used. Authorization servers MUST support `S256` and MAY support `plain`.

**Per Security BCP §2.1.1:** Clients MUST use `S256`. `plain` SHOULD NOT be used.

#### S256 code_challenge Generation (Pseudocode)

```
function generateCodeChallenge(codeVerifier):
    # Compute SHA-256 hash
    hash = SHA256(ASCII(codeVerifier))
    
    # Base64url encode
    codeChallenge = base64urlEncode(hash)
    
    # Remove any padding characters
    codeChallenge = codeChallenge.replace("=", "")
    
    return codeChallenge
```

#### Example Transformation

```
code_verifier:  dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk

SHA256 hash:    19a1d5ed 7852b5e4 85130938 dfc3d749
                8de1a86f 8ad15a7e 6854a720 fcab39d1

code_challenge: E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
```

### 4.4 Server-Side Validation (RFC 7636 §4.6)

When the authorization server receives the token request with `code_verifier`:

```
function validatePKCE(storedChallenge, storedMethod, receivedVerifier):
    if storedMethod == "S256":
        computedChallenge = BASE64URL(SHA256(ASCII(receivedVerifier)))
    else if storedMethod == "plain":
        computedChallenge = receivedVerifier
    else:
        return error("unsupported_transform")
    
    if computedChallenge != storedChallenge:
        return error("invalid_grant")
    
    return success
```

**Critical validation requirements:**

| Requirement | Description | Spec Reference |
|-------------|-------------|----------------|
| Code challenge binding | Authorization server MUST associate `code_challenge` and `code_challenge_method` with the issued authorization code | RFC 7636 §4.4 |
| Verifier presence | If `code_challenge` was sent, `code_verifier` MUST be present in token request | RFC 7636 §4.6 |
| Method enforcement | Server MUST use stored `code_challenge_method` for verification | RFC 7636 §4.6 |
| Timing-safe comparison | Implementations SHOULD use constant-time comparison to prevent timing attacks | Security best practice |

---

## 5. Security Threat Model for This Flow

### 5.1 Authorization Code Interception (RFC 6819 §4.4.1.1, RFC 7636 §1)

#### Attack Description

An attacker intercepts the authorization code during the redirect from authorization server to client. This can occur via:

- **Malicious app registration** (mobile): Attacker registers same custom URI scheme
- **Referrer header leakage**: Code in URL leaks to third-party resources
- **Browser history/logs**: Code persists in browser history
- **Network interception**: Code visible in URLs even over HTTPS (SNI, logs)
- **Shared devices**: Previous user's code visible in history

#### Attack Sequence (Without PKCE)

```
1. Victim initiates login
2. Victim authenticates at authorization server
3. Authorization server redirects: client://callback?code=ABC123
4. Attacker intercepts code (via malicious app, referrer, etc.)
5. Attacker sends token request with code=ABC123
6. Authorization server issues tokens to attacker
7. Attacker has victim's access
```

#### Exploit Demonstration (Vulnerable Mode: `DISABLE_PKCE`)

```javascript
// Tool demonstrates: Code interception without PKCE protection
const interceptedCode = captureFromRedirect();

// Attacker can exchange code without knowing code_verifier
const tokenResponse = await fetch(tokenEndpoint, {
    method: 'POST',
    body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: interceptedCode,
        redirect_uri: legitimateRedirectUri,
        client_id: publicClientId
        // No code_verifier needed when PKCE disabled
    })
});
// Attack succeeds - attacker gets victim's tokens
```

#### Mitigation

**PKCE (RFC 7636)** — The authorization code is bound to a secret (`code_verifier`) that only the legitimate client knows:

| Without PKCE | With PKCE |
|--------------|-----------|
| Attacker intercepts `code` | Attacker intercepts `code` |
| Attacker exchanges `code` for tokens | Attacker cannot provide valid `code_verifier` |
| **Attack succeeds** | **Attack fails with `invalid_grant`** |

#### Validation Requirements

| Check | Implementation | Spec Reference |
|-------|----------------|----------------|
| PKCE required | Reject authorization requests without `code_challenge` | Security BCP §2.1.1 |
| code_verifier validated | Reject token requests with invalid/missing `code_verifier` | RFC 7636 §4.6 |
| S256 enforced | Reject `plain` method (or at minimum require S256 support) | Security BCP §2.1.1 |

---

### 5.2 CSRF Attacks (RFC 6749 §10.12, Security BCP §4.7)

#### Attack Description

An attacker tricks a victim into completing an OAuth flow initiated by the attacker, causing the victim's client to be authorized with the attacker's identity/resources.

#### Attack Sequence (Without State Parameter)

```
1. Attacker initiates OAuth flow with their own account
2. Attacker captures redirect URL: client://callback?code=ATTACKER_CODE
3. Attacker tricks victim into visiting this URL (CSRF)
4. Victim's browser sends request to client with attacker's code
5. Client exchanges attacker's code for attacker's tokens
6. Victim's session is now associated with attacker's account
7. Attacker can access victim's client account, or victim unknowingly 
   acts on attacker's resources (e.g., uploads to attacker's cloud storage)
```

#### Exploit Demonstration (Vulnerable Mode: `PREDICTABLE_STATE`)

```html
<!-- Attacker's malicious page -->
<img src="https://client.example.org/callback?code=ATTACKER_AUTH_CODE&state=1234" />

<!-- Or if state is predictable/reused -->
<img src="https://client.example.org/callback?code=ATTACKER_AUTH_CODE&state=user123" />
```

#### Mitigation

**State Parameter (RFC 6749 §10.12):**

| Requirement | Description | Spec Reference |
|-------------|-------------|----------------|
| Generation | MUST be unpredictable, cryptographically random | RFC 6749 §10.12 |
| Binding | MUST be bound to user-agent session (e.g., session cookie) | RFC 6749 §10.12 |
| Validation | Client MUST verify state matches before processing code | RFC 6749 §10.12 |
| Single-use | State SHOULD be used only once | Security BCP §4.7.1 |

#### Validation Requirements

| Check | Implementation | Spec Reference |
|-------|----------------|----------------|
| State present | Reject callbacks without state parameter | Security BCP §4.7 |
| State matches | Reject if state doesn't match stored value | RFC 6749 §10.12 |
| State bound to session | State must be tied to authenticated session | RFC 6749 §10.12 |
| State not reused | Invalidate state after use | Security BCP §4.7.1 |

---

### 5.3 Authorization Code Replay (RFC 6819 §4.4.1.3)

#### Attack Description

An attacker captures a valid authorization code and attempts to use it multiple times, or uses it after the legitimate client has already exchanged it.

#### Mitigation

| Requirement | Description | Spec Reference |
|-------------|-------------|----------------|
| Single-use codes | Authorization server MUST ensure code is used only once | RFC 6749 §4.1.2 |
| Revocation on reuse | If code reuse detected, SHOULD revoke all tokens issued from that code | Security BCP §4.5 |
| Short lifetime | Code MUST expire shortly after issuance (RECOMMENDED: 10 minutes max, typically 30-60 seconds) | RFC 6749 §4.1.2 |

#### Server Implementation

```
function exchangeCode(code, clientId, redirectUri, codeVerifier):
    storedCode = codeStore.get(code)
    
    if storedCode == null:
        return error("invalid_grant", "Code not found or expired")
    
    if storedCode.used:
        # Potential replay attack - revoke all associated tokens
        revokeAllTokensForGrant(storedCode.grantId)
        return error("invalid_grant", "Code already used")
    
    # Mark as used BEFORE validation to prevent race conditions
    storedCode.used = true
    codeStore.update(storedCode)
    
    # Continue with validation...
```

---

### 5.4 Redirect URI Manipulation (RFC 6749 §10.6, Security BCP §4.1)

#### Attack Description

An attacker modifies the `redirect_uri` to point to an attacker-controlled endpoint, causing the authorization code to be sent to the attacker.

#### Attack Variants

| Variant | Description | Example |
|---------|-------------|---------|
| Open redirect | Exploit open redirector on legitimate client | `redirect_uri=https://client.com/redirect?url=https://attacker.com` |
| Subdomain takeover | Register abandoned subdomain | `redirect_uri=https://abandoned.client.com/callback` |
| Path traversal | Bypass path-based validation | `redirect_uri=https://client.com/callback/../../../attacker/callback` |
| Fragment injection | Leak code via fragment | `redirect_uri=https://client.com/callback#attacker` |
| Homograph attack | Visually similar domain | `redirect_uri=https://clíent.com/callback` (note: í not i) |

#### Exploit Demonstration (Vulnerable Mode: `LAX_REDIRECT_URI`)

```javascript
// Tool demonstrates: What happens with pattern matching instead of exact match

// Registered redirect_uri: https://client.example.org/callback

// These might be accepted with lax validation:
const exploits = [
    'https://client.example.org/callback?evil=param',           // Query params
    'https://client.example.org/callback/../../../evil',        // Path traversal  
    'https://client.example.org.attacker.com/callback',         // Subdomain
    'https://client.example.org/callback#evil',                 // Fragment
];
```

#### Mitigation

**Exact String Matching (Security BCP §4.1.1):**

| Requirement | Description | Spec Reference |
|-------------|-------------|----------------|
| Exact match | redirect_uri MUST exactly match registered URI | Security BCP §4.1.1 |
| No pattern matching | Do not allow wildcards, regex, or partial matching | Security BCP §4.1.1 |
| HTTPS required | redirect_uri MUST use HTTPS (except localhost for development) | Security BCP §4.1.2 |
| No localhost in production | `http://localhost` only for development/native apps | RFC 8252 §7.3 |
| Pre-registration | All redirect_uris MUST be pre-registered | Security BCP §4.1 |

#### Validation Requirements

| Check | Implementation | Spec Reference |
|-------|----------------|----------------|
| Exact string match | `registeredUri === requestedUri` (byte-for-byte) | Security BCP §4.1.1 |
| No query params unless registered | Query string must be part of registered URI | Security BCP §4.1.1 |
| No fragments | Reject URIs with fragment component | RFC 6749 §3.1.2 |

---

### 5.5 Mix-Up Attacks (Security BCP §4.4, RFC 9207)

#### Attack Description

When a client uses multiple authorization servers, an attacker can cause the client to send an authorization code obtained from an honest server to an attacker-controlled server, or vice versa.

#### Attack Sequence

```
1. Client supports IdP-A (honest) and IdP-B (attacker-controlled)
2. User initiates login, intending to use IdP-A
3. Attacker intercepts and modifies initial request to point to IdP-B
4. User authenticates at IdP-B (attacker's server)
5. IdP-B redirects with code, but client thinks it's from IdP-A
6. Client sends code to IdP-A's token endpoint
7. IdP-A rejects code (it wasn't issued by IdP-A)
   OR
   Attacker's IdP-B issues code that works at IdP-A (if same code format)
```

#### Mitigation

**Issuer Verification (RFC 9207, Security BCP §4.4):**

| Requirement | Description | Spec Reference |
|-------------|-------------|----------------|
| `iss` in response | Authorization server SHOULD include `iss` parameter in authorization response | RFC 9207 §2 |
| Verify `iss` | Client MUST verify `iss` matches expected authorization server | RFC 9207 §2.4 |
| Per-AS state | Use different state values per authorization server | Security BCP §4.4.2 |
| Per-AS redirect_uri | Use different redirect_uris per authorization server | Security BCP §4.4.2 |

#### Exploit Demonstration (Vulnerable Mode: `DISABLE_ISS_CHECK`)

```javascript
// Without iss verification, client can't detect mix-up
const callbackParams = parseCallback(window.location);

// Client assumes this came from the AS it initiated with
// but it could be from any AS
const tokenResponse = await exchangeCode(
    expectedTokenEndpoint,  // Might be wrong AS!
    callbackParams.code
);
```

---

### 5.6 Token Leakage via Referrer (Security BCP §4.2.4)

#### Attack Description

Authorization codes or tokens in URLs can leak via the HTTP Referer header when the page containing the URL loads external resources.

#### Attack Sequence

```
1. Authorization server redirects: https://client.com/callback?code=SECRET
2. Client's callback page loads external resource (analytics, CDN, etc.)
3. Browser sends Referer header: Referer: https://client.com/callback?code=SECRET
4. External resource (or attacker monitoring network) captures code
```

#### Mitigation

| Requirement | Description | Spec Reference |
|-------------|-------------|----------------|
| Referrer-Policy | Set `Referrer-Policy: no-referrer` on callback pages | Security BCP §4.2.4 |
| Immediate redirect | Redirect away from callback URL immediately after processing | Security BCP §4.2.4 |
| No external resources | Callback page should not load third-party resources | Security BCP §4.2.4 |
| History manipulation | Replace callback URL in history using `history.replaceState()` | Best practice |

---

## 6. Implementation Requirements Checklist

### 6.1 Client-Side MUST Implement

| # | Requirement | Spec Reference | Vuln Mode |
|---|-------------|----------------|-----------|
| C1 | Generate cryptographically random `code_verifier` (43-128 chars, 256+ bits entropy) | RFC 7636 §4.1 | `WEAK_VERIFIER` |
| C2 | Use S256 for `code_challenge_method` | Security BCP §2.1.1 | `PLAIN_PKCE` |
| C3 | Store `code_verifier` securely until token exchange | RFC 7636 §4.3 | - |
| C4 | Generate cryptographically random `state` parameter | RFC 6749 §10.12 | `PREDICTABLE_STATE` |
| C5 | Bind `state` to user session | RFC 6749 §10.12 | `UNBOUND_STATE` |
| C6 | Validate `state` matches before processing callback | RFC 6749 §10.12 | `SKIP_STATE_CHECK` |
| C7 | Use exact registered `redirect_uri` in requests | Security BCP §4.1 | - |
| C8 | Send token request via back-channel (HTTPS POST) | RFC 6749 §4.1.3 | - |
| C9 | Validate TLS certificate of token endpoint | RFC 6749 §1.6 | `SKIP_TLS_VERIFY` |
| C10 | Verify `iss` in response matches expected AS (if multiple AS supported) | RFC 9207 §2.4 | `DISABLE_ISS_CHECK` |
| C11 | Use HTTPS for all redirect_uris (except localhost dev) | Security BCP §4.1.2 | `ALLOW_HTTP_REDIRECT` |
| C12 | Do not include tokens in URLs or Referer headers | Security BCP §4.2.4 | - |

### 6.2 Server-Side MUST Implement (Authorization Server)

| # | Requirement | Spec Reference | Vuln Mode |
|---|-------------|----------------|-----------|
| S1 | Require PKCE for all clients (or at minimum public clients) | Security BCP §2.1.1 | `DISABLE_PKCE` |
| S2 | Support S256 code_challenge_method | RFC 7636 §4.2 | - |
| S3 | Validate `code_verifier` matches stored `code_challenge` | RFC 7636 §4.6 | `SKIP_PKCE_VERIFY` |
| S4 | Use exact string matching for redirect_uri validation | Security BCP §4.1.1 | `LAX_REDIRECT_URI` |
| S5 | Require pre-registration of all redirect_uris | Security BCP §4.1 | `DYNAMIC_REDIRECT` |
| S6 | Issue single-use authorization codes | RFC 6749 §4.1.2 | `REUSABLE_CODE` |
| S7 | Expire codes quickly (RECOMMENDED ≤60 seconds) | RFC 6749 §4.1.2 | `LONG_CODE_LIFETIME` |
| S8 | Bind code to client_id, redirect_uri, code_challenge | RFC 6749 §4.1.3, RFC 7636 §4.4 | - |
| S9 | Revoke tokens if code reuse detected | Security BCP §4.5 | `NO_REPLAY_DETECTION` |
| S10 | Include `iss` in authorization response | RFC 9207 §2 | `OMIT_ISS` |
| S11 | Return proper error codes per RFC 6749 §4.1.2.1, §5.2 | RFC 6749 | - |
| S12 | Set `Cache-Control: no-store` on token responses | RFC 6749 §5.1 | - |

### 6.3 SHOULD Implement (Recommended)

| # | Requirement | Spec Reference |
|---|-------------|----------------|
| R1 | Use `nonce` parameter when requesting ID tokens | OIDC Core §3.1.2.1 |
| R2 | Implement refresh token rotation | Security BCP §4.13.2 |
| R3 | Use sender-constrained tokens (DPoP or mTLS) | RFC 9449, RFC 8705 |
| R4 | Implement PAR for confidential authorization requests | RFC 9126 |
| R5 | Set `Referrer-Policy: no-referrer` on callback pages | Security BCP §4.2.4 |
| R6 | Use PKCE even for confidential clients | Security BCP §2.1.1 |
| R7 | Implement token binding for refresh tokens | Security BCP §4.13 |
| R8 | Use short access token lifetimes (minutes, not hours) | Security BCP §4.12 |

### 6.4 Common Implementation Pitfalls (RFC 6819)

| Pitfall | Problem | Consequence | Spec Reference |
|---------|---------|-------------|----------------|
| Predictable state | Using sequential numbers, timestamps, or user IDs | CSRF attacks succeed | RFC 6819 §4.4.1.8 |
| State not bound to session | State validated but not tied to user's session | CSRF attacks succeed | RFC 6749 §10.12 |
| Substring redirect_uri matching | `https://client.com/callback` matches `https://client.com/callback.evil.com` | Open redirect | Security BCP §4.1.1 |
| Long-lived codes | Codes valid for hours/days | Larger attack window | RFC 6749 §4.1.2 |
| Code reuse allowed | Same code can be exchanged multiple times | Token theft | RFC 6749 §4.1.2 |
| PKCE verifier in URL | Putting code_verifier in query string | Defeats PKCE purpose | RFC 7636 |
| Weak code_verifier entropy | Using non-random values | Attacker can guess verifier | RFC 7636 §7.1 |
| Plain PKCE in production | Using `plain` method when S256 available | Weaker protection | Security BCP §2.1.1 |

---

## 7. Validation Rules (Exact Spec Requirements)

### 7.1 redirect_uri Validation (RFC 6749 §3.1.2, Security BCP §4.1.1)

```
FUNCTION validateRedirectUri(requestedUri, registeredUris):
    # RFC 6749 §3.1.2: redirect_uri MUST NOT include fragment
    IF requestedUri contains "#":
        RETURN error("invalid_request", "redirect_uri must not contain fragment")
    
    # Security BCP §4.1.1: MUST use exact string matching
    FOR EACH registeredUri IN registeredUris:
        IF requestedUri == registeredUri:  # Byte-for-byte comparison
            RETURN valid
    
    RETURN error("invalid_request", "redirect_uri does not match registered URI")
```

**Key rules:**

| Rule | Description | Spec Reference |
|------|-------------|----------------|
| No fragments | redirect_uri MUST NOT contain fragment component (#) | RFC 6749 §3.1.2 |
| Exact match | Byte-for-byte string comparison, no normalization | Security BCP §4.1.1 |
| Pre-registered | URI must be pre-registered with authorization server | RFC 6749 §3.1.2.2 |
| HTTPS required | MUST use https:// scheme (except localhost) | Security BCP §4.1.2 |
| No wildcards | Pattern matching, wildcards MUST NOT be used | Security BCP §4.1.1 |

### 7.2 state Parameter Validation (RFC 6749 §10.12, Security BCP §4.7)

```
FUNCTION validateState(receivedState, session):
    # Check state present
    IF receivedState IS empty:
        RETURN error("invalid_request", "Missing state parameter")
    
    # Retrieve stored state bound to session
    storedState = session.getState()
    
    IF storedState IS empty:
        RETURN error("invalid_request", "No state found in session")
    
    # Constant-time comparison to prevent timing attacks
    IF NOT constantTimeEquals(receivedState, storedState):
        RETURN error("invalid_request", "State mismatch - possible CSRF")
    
    # Invalidate state (single-use)
    session.clearState()
    
    RETURN valid
```

**Requirements:**

| Requirement | Value | Spec Reference |
|-------------|-------|----------------|
| Entropy | Minimum 128 bits (256 bits recommended) | Security BCP §4.7 |
| Generation | Cryptographically secure random | RFC 6749 §10.12 |
| Binding | Bound to user-agent session | RFC 6749 §10.12 |
| Single-use | Invalidated after validation | Security BCP §4.7.1 |

### 7.3 Authorization Code Validation (RFC 6749 §4.1.2, §4.1.3)

```
FUNCTION validateAuthorizationCode(code, request):
    storedCode = codeStore.get(code)
    
    # Code exists
    IF storedCode IS null:
        RETURN error("invalid_grant", "Invalid authorization code")
    
    # Code not expired (RECOMMENDED: 10 min max, typically 30-60 sec)
    IF storedCode.issuedAt + CODE_LIFETIME < currentTime():
        RETURN error("invalid_grant", "Authorization code expired")
    
    # Code not already used
    IF storedCode.used:
        # Security BCP §4.5: Revoke all tokens from this grant
        revokeTokensForGrant(storedCode.grantId)
        RETURN error("invalid_grant", "Authorization code already used")
    
    # Mark as used immediately (before further validation)
    storedCode.used = true
    codeStore.update(storedCode)
    
    # Code bound to correct client
    IF storedCode.clientId != request.clientId:
        RETURN error("invalid_grant", "Code was not issued to this client")
    
    # redirect_uri matches (if was in original request)
    IF storedCode.redirectUri IS NOT null:
        IF storedCode.redirectUri != request.redirectUri:
            RETURN error("invalid_grant", "redirect_uri mismatch")
    
    RETURN storedCode
```

**Code requirements:**

| Requirement | Value | Spec Reference |
|-------------|-------|----------------|
| Lifetime | RECOMMENDED ≤10 minutes; typically 30-60 seconds | RFC 6749 §4.1.2 |
| Single-use | MUST be exchanged only once | RFC 6749 §4.1.2 |
| Client binding | MUST be bound to client_id | RFC 6749 §4.1.3 |
| redirect_uri binding | MUST be bound to redirect_uri if present | RFC 6749 §4.1.3 |
| PKCE binding | MUST be bound to code_challenge | RFC 7636 §4.4 |

### 7.4 PKCE code_verifier Validation (RFC 7636 §4.6)

```
FUNCTION validatePKCE(storedCodeChallenge, storedMethod, receivedVerifier):
    # Verifier format validation
    IF length(receivedVerifier) < 43 OR length(receivedVerifier) > 128:
        RETURN error("invalid_grant", "code_verifier length must be 43-128 characters")
    
    IF NOT matches(receivedVerifier, /^[A-Za-z0-9\-._~]+$/):
        RETURN error("invalid_grant", "code_verifier contains invalid characters")
    
    # Compute challenge from verifier
    IF storedMethod == "S256":
        computedChallenge = BASE64URL_ENCODE(SHA256(ASCII(receivedVerifier)))
    ELSE IF storedMethod == "plain":
        computedChallenge = receivedVerifier
    ELSE:
        RETURN error("invalid_grant", "Unsupported code_challenge_method")
    
    # Compare challenges (constant-time)
    IF NOT constantTimeEquals(computedChallenge, storedCodeChallenge):
        RETURN error("invalid_grant", "code_verifier does not match code_challenge")
    
    RETURN valid
```

**PKCE requirements:**

| Parameter | Requirement | Spec Reference |
|-----------|-------------|----------------|
| code_verifier length | 43-128 characters | RFC 7636 §4.1 |
| code_verifier charset | `[A-Z] [a-z] [0-9] - . _ ~` | RFC 7636 §4.1 |
| code_challenge_method | `S256` MUST be supported; `plain` MAY be supported | RFC 7636 §4.2 |
| Comparison | MUST match stored code_challenge | RFC 7636 §4.6 |

---

## 8. Example Scenarios

### 8.1 Happy Path: Complete Flow with All Parameters

#### Step 1: Client Generates PKCE Values

```javascript
// Generate code_verifier (43-128 characters, from unreserved charset)
const codeVerifier = base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)));
// Result: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"

// Generate code_challenge using S256
const codeChallenge = base64UrlEncode(await crypto.subtle.digest('SHA-256', 
    new TextEncoder().encode(codeVerifier)));
// Result: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"

// Generate state
const state = base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)));
// Result: "af0ifjsldkj"

// Store code_verifier and state in session
sessionStorage.setItem('pkce_verifier', codeVerifier);
sessionStorage.setItem('oauth_state', state);
```

#### Step 2: Authorization Request

```http
GET /authorize?
    response_type=code
    &client_id=s6BhdRkqt3
    &redirect_uri=https%3A%2F%2Fclient.example.org%2Fcallback
    &scope=openid%20profile%20email
    &state=af0ifjsldkj
    &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
    &code_challenge_method=S256
    &nonce=n-0S6_WzA2Mj
HTTP/1.1
Host: auth.example.com
```

#### Step 3: User Authenticates (at Authorization Server)

*User enters credentials, completes MFA, grants consent*

#### Step 4: Authorization Response

```http
HTTP/1.1 302 Found
Location: https://client.example.org/callback?
    code=SplxlOBeZQQYbYS6WxSbIA
    &state=af0ifjsldkj
    &iss=https%3A%2F%2Fauth.example.com
```

#### Step 5: Client Validates State and Exchanges Code

```javascript
// Validate state
const storedState = sessionStorage.getItem('oauth_state');
const receivedState = urlParams.get('state');
if (storedState !== receivedState) {
    throw new Error('State mismatch - possible CSRF attack');
}

// Validate issuer (if supporting multiple IdPs)
const receivedIss = urlParams.get('iss');
if (receivedIss !== expectedIssuer) {
    throw new Error('Issuer mismatch - possible mix-up attack');
}

// Retrieve stored code_verifier
const codeVerifier = sessionStorage.getItem('pkce_verifier');
```

```http
POST /token HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW

grant_type=authorization_code
&code=SplxlOBeZQQYbYS6WxSbIA
&redirect_uri=https%3A%2F%2Fclient.example.org%2Fcallback
&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

#### Step 6: Token Response

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
Pragma: no-cache

{
    "access_token": "SlAV32hkKG",
    "token_type": "Bearer",
    "expires_in": 3600,
    "refresh_token": "8xLOxBtZp8",
    "scope": "openid profile email",
    "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEifQ.eyJpc3MiOiJodHRwczovL2F1dGguZXhhbXBsZS5jb20iLCJzdWIiOiIyNDgyODk3NjEwMDEiLCJhdWQiOiJzNkJoZFJrcXQzIiwiZXhwIjoxMzExMjgxOTcwLCJpYXQiOjEzMTEyODA5NzAsIm5vbmNlIjoibi0wUzZfV3pBMk1qIiwiYXRfaGFzaCI6Ijc3UW1VUHRqUGZhd2p2ZHJoRmxQRXcifQ.signature"
}
```

---

### 8.2 Error Scenario: Invalid PKCE code_verifier

#### Token Request with Wrong code_verifier

```http
POST /token HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=SplxlOBeZQQYbYS6WxSbIA
&redirect_uri=https%3A%2F%2Fclient.example.org%2Fcallback
&client_id=s6BhdRkqt3
&code_verifier=WRONG_VERIFIER_VALUE_HERE
```

#### Error Response

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json
Cache-Control: no-store

{
    "error": "invalid_grant",
    "error_description": "code_verifier does not match code_challenge"
}
```

**Debugging checklist:**

| Check | Possible Cause |
|-------|----------------|
| Verifier stored correctly? | Verifier may have been lost/overwritten in session storage |
| Verifier modified? | Some storage mechanisms may alter special characters |
| Challenge method correct? | Mismatch between `plain` and `S256` |
| Verifier length valid? | Must be 43-128 characters |
| Character encoding correct? | Must use ASCII encoding for SHA-256 |

---

### 8.3 Error Scenario: Authorization Code Replay

#### First Token Request (Succeeds)

```http
POST /token HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=SplxlOBeZQQYbYS6WxSbIA
&redirect_uri=https%3A%2F%2Fclient.example.org%2Fcallback
&client_id=s6BhdRkqt3
&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
    "access_token": "SlAV32hkKG",
    "token_type": "Bearer",
    "expires_in": 3600
}
```

#### Second Token Request with Same Code (Fails)

```http
POST /token HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=SplxlOBeZQQYbYS6WxSbIA
&redirect_uri=https%3A%2F%2Fclient.example.org%2Fcallback
&client_id=s6BhdRkqt3
&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
    "error": "invalid_grant",
    "error_description": "Authorization code has already been used"
}
```

**Expected server behavior (Security BCP §4.5):** The authorization server SHOULD revoke all tokens previously issued based on this authorization code, as code reuse may indicate a code interception attack.

---

### 8.4 Error Scenario: State Mismatch (CSRF Detection)

#### Authorization Request

```
State stored in session: "abc123xyz789"
```

#### Malicious Callback (Attacker's Forged Request)

```http
GET /callback?code=ATTACKER_CODE&state=attacker_state HTTP/1.1
Host: client.example.org
Cookie: session=legitimate_user_session
```

#### Client Validation

```javascript
const storedState = session.get('oauth_state');  // "abc123xyz789"
const receivedState = urlParams.get('state');     // "attacker_state"

if (storedState !== receivedState) {
    // CSRF attack detected
    throw new SecurityError('State mismatch - rejecting callback');
}
```

**Client MUST reject this callback.** The state mismatch indicates either:
1. CSRF attack (attacker forged the callback)
2. Session expired/lost
3. User has multiple tabs/windows with different auth flows

---

### 8.5 Error Scenario: redirect_uri Mismatch

#### Registered redirect_uri

```
https://client.example.org/callback
```

#### Authorization Request (Attempting Open Redirect)

```http
GET /authorize?
    response_type=code
    &client_id=s6BhdRkqt3
    &redirect_uri=https%3A%2F%2Fclient.example.org%2Fcallback%2F..%2F..%2Fattacker.com
    &scope=openid
    &state=xyz
    &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
    &code_challenge_method=S256
HTTP/1.1
Host: auth.example.com
```

#### Error Response (Properly Secured Server)

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
    "error": "invalid_request",
    "error_description": "redirect_uri does not match any registered URI"
}
```

**Note:** This error is displayed directly to the user, NOT redirected, as redirecting to an untrusted URI would be the vulnerability itself.

---

## Appendix A: RFC Cross-Reference Index

| Topic | RFC 6749 | RFC 7636 | Security BCP | OIDC Core |
|-------|----------|----------|--------------|-----------|
| Authorization endpoint | §3.1 | — | §4.1 | §3.1.2 |
| Token endpoint | §3.2 | — | — | §3.1.3 |
| Authorization request | §4.1.1 | §4.3 | — | §3.1.2.1 |
| Authorization response | §4.1.2 | — | — | §3.1.2.5 |
| Token request | §4.1.3 | §4.5 | — | §3.1.3.1 |
| Token response | §4.1.4 | — | — | §3.1.3.3 |
| code_verifier | — | §4.1 | §2.1.1 | — |
| code_challenge | — | §4.2, §4.3 | §2.1.1 | — |
| state parameter | §4.1.1, §10.12 | — | §4.7 | §3.1.2.1 |
| redirect_uri validation | §3.1.2 | — | §4.1 | §3.1.2.1 |
| Error responses | §4.1.2.1, §5.2 | — | — | §3.1.2.6 |
| Threat model | — | §7 | §4 | — |
| CSRF protection | §10.12 | — | §4.7 | — |
| Code interception | — | §1 | §4.5 | — |

---

## Appendix B: Vulnerability Mode Quick Reference

| Toggle | Attack Demonstrated | Spec Violation | Document Section |
|--------|--------------------| ---------------|------------------|
| `DISABLE_PKCE` | Authorization code interception | Security BCP §2.1.1 | §5.1 |
| `WEAK_VERIFIER` | Low-entropy code_verifier guessing | RFC 7636 §7.1 | §4.2 |
| `PLAIN_PKCE` | Weakened PKCE protection | Security BCP §2.1.1 | §4.3 |
| `PREDICTABLE_STATE` | CSRF via guessable state | RFC 6749 §10.12 | §5.2 |
| `UNBOUND_STATE` | CSRF via state not bound to session | RFC 6749 §10.12 | §5.2 |
| `SKIP_STATE_CHECK` | CSRF via state not validated | RFC 6749 §10.12 | §5.2 |
| `LAX_REDIRECT_URI` | Open redirect via pattern matching | Security BCP §4.1.1 | §5.4 |
| `REUSABLE_CODE` | Code replay attack | RFC 6749 §4.1.2 | §5.3 |
| `LONG_CODE_LIFETIME` | Extended attack window | RFC 6749 §4.1.2 | §5.3 |
| `DISABLE_ISS_CHECK` | Mix-up attack | RFC 9207 | §5.5 |

---

*Document Version: 1.0.0*
*Last Updated: [Generation Date]*
*Specification References: RFC 6749, RFC 7636, RFC 6819, OAuth 2.1 (draft-ietf-oauth-v2-1-10), Security BCP (draft-ietf-oauth-security-topics-27), OIDC Core 1.0*
