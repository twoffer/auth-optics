# Visualization Requirements - Flow Sequences
## Detailed Flow-Specific Visualization Requirements

> *"A picture of the protocol is worth a thousand RFCs."*

---

## Document Information

| Property | Value |
|----------|-------|
| **Document Type** | UI/UX Requirements |
| **Target Audience** | Frontend developers implementing flow visualizations |
| **Purpose** | Define step-by-step visualization for each OAuth2/OIDC flow |
| **Related Docs** | Flow specifications, security docs |
| **Part** | 2 of 6 (Flow Sequences) |

---

## 1. Authorization Code Flow with PKCE

### 1.1 Complete Flow Overview

**7 Steps**:
1. Authorization Request
2. User Authentication & Consent
3. Authorization Response
4. Token Request
5. Token Response
6. Token Storage
7. Resource Access (optional)

**Timeline Visualization**:
```
User/Browser          Client App          Auth Server          Resource Server
     |                     |                     |                     |
     |--1. Initiate------->|                     |                     |
     |<--Redirect----------|                     |                     |
     |----------2. Authorization Request-------->|                     |
     |<---------3. Login/Consent Screen----------|                     |
     |----------User Authenticates-------------->|                     |
     |<---------4. Authorization Response--------|                     |
     |--5. Code------------>|                     |                     |
     |                      |--6. Token Request-->|                     |
     |                      |<--7. Tokens---------|                     |
     |                      |                     |                     |
     |                      |--------8. API Request (Bearer Token)----->|
     |                      |<-------9. Protected Resource-------------|
```

---

### 1.2 Step 1: Authorization Request

**Display Title**: "Step 1: Authorization Request to Authorization Server"

**Visual Card**:
```
┌─────────────────────────────────────────────────────────────┐
│  1. Authorization Request                          ✓ 0.15s  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Browser redirects user to authorization server             │
│                                                              │
│  GET /realms/oauth2-demo/protocol/openid-connect/auth      │
│  🔒 https://localhost:8080                                  │
│                                                              │
│  ▼ Query Parameters (7)                        [Copy URL]   │
│  ┌──────────────────────┬────────────────────────────────┐ │
│  │ Parameter            │ Value                          │ │
│  ├──────────────────────┼────────────────────────────────┤ │
│  │ response_type        │ code                           │ │
│  │ ℹ️ RFC 6749 §4.1.1    │ ✓ Required                    │ │
│  │                      │ Requesting authorization code  │ │
│  ├──────────────────────┼────────────────────────────────┤ │
│  │ client_id            │ web-app                        │ │
│  │ ℹ️ RFC 6749 §4.1.1    │ ✓ Required                    │ │
│  │                      │ Client identifier              │ │
│  ├──────────────────────┼────────────────────────────────┤ │
│  │ redirect_uri         │ https://localhost:3000/cb     │ │
│  │ ℹ️ RFC 6749 §4.1.1    │ ⚠️ Conditional (recommended)  │ │
│  │                      │ Where to send code             │ │
│  ├──────────────────────┼────────────────────────────────┤ │
│  │ scope                │ openid profile email           │ │
│  │ ℹ️ RFC 6749 §3.3      │ ⚠️ Optional                   │ │
│  │                      │ Requested permissions          │ │
│  ├──────────────────────┼────────────────────────────────┤ │
│  │ state                │ af0ifjsldkj                    │ │
│  │ ℹ️ RFC 6749 §10.12    │ ✓ Recommended (CSRF)          │ │
│  │                      │ CSRF protection token          │ │
│  ├──────────────────────┼────────────────────────────────┤ │
│  │ code_challenge       │ E9Melhoa2OwvFrEMTJguCHaoeK1t8U │ │
│  │ ℹ️ RFC 7636 §4.3      │ ✓ Required for public clients │ │
│  │                      │ PKCE challenge (SHA-256 hash)  │ │
│  ├──────────────────────┼────────────────────────────────┤ │
│  │ code_challenge_method│ S256                           │ │
│  │ ℹ️ RFC 7636 §4.3      │ ✓ Required if challenge       │ │
│  │                      │ Challenge method               │ │
│  └──────────────────────┴────────────────────────────────┘ │
│                                                              │
│  🔒 Security Checks                                          │
│  ✓ PKCE included (code_challenge + method)                  │
│  ✓ State parameter present (CSRF protection)                │
│  ✓ HTTPS URL (TLS encryption)                               │
│  ✓ Redirect URI matches registered URI                      │
│                                                              │
│  [View Full URL] [Copy cURL] [View Spec Reference]         │
└─────────────────────────────────────────────────────────────┘
```

**Interactive Features**:
- Click parameter name: Show tooltip with full RFC reference
- Click "View Full URL": Show complete URL in copyable format
- Click "Copy cURL": Generate curl command equivalent
- Hover over security check: Explain why it matters

**Code Verifier Visualization** (collapsible):
```
▼ PKCE Details
  Code Verifier Generated:
    dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
    
    Properties:
    - Length: 43 characters (minimum)
    - Character set: [A-Z] [a-z] [0-9] - _ . ~
    - Entropy: 256 bits
    - Stored securely: ✓ In memory
    
  Code Challenge Calculation:
    Input:  dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
    SHA-256 hash
    Base64URL encode
    Output: E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
    
    [View SHA-256 Process] [Copy Verifier]
```

---

### 1.3 Step 2: User Authentication & Consent

**Display Title**: "Step 2: User Authenticates at Authorization Server"

**Visual Card**:
```
┌─────────────────────────────────────────────────────────────┐
│  2. User Authentication & Consent                  External  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ℹ️ This step happens at the authorization server           │
│     Tool cannot capture this interaction                    │
│                                                              │
│  What Happens:                                              │
│  1. User is redirected to authorization server login page   │
│  2. User enters credentials (username/password)             │
│  3. Authorization server authenticates user                 │
│  4. User is shown consent screen with requested scopes:     │
│                                                              │
│     ┌───────────────────────────────────────────────┐       │
│     │  OAuth2 Demo App wants to:                   │       │
│     │                                               │       │
│     │  ☑ View your basic profile info (openid)     │       │
│     │  ☑ View your full profile (profile)          │       │
│     │  ☑ View your email address (email)           │       │
│     │                                               │       │
│     │  [Deny]  [Allow]                             │       │
│     └───────────────────────────────────────────────┘       │
│                                                              │
│  5. User clicks "Allow"                                     │
│  6. Authorization server generates authorization code       │
│                                                              │
│  Duration: Varies (user interaction)                        │
│                                                              │
│  [View Typical Login Screen] [View Consent Screen]         │
└─────────────────────────────────────────────────────────────┘
```

**Educational Note**:
```
💡 Why can't we show this?
   This step occurs entirely at the authorization server. The client
   application never sees the user's credentials - this is the core
   security benefit of OAuth2!
   
   In production: User interacts with authorization server's UI
   In this demo: Using KeyCloak's login/consent pages
```

---

### 1.4 Step 3: Authorization Response

**Display Title**: "Step 3: Authorization Server Redirects Back to Client"

**Visual Card**:
```
┌─────────────────────────────────────────────────────────────┐
│  3. Authorization Response                         ✓ 0.08s  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Browser redirects back to client application               │
│                                                              │
│  GET /callback                                              │
│  🔒 https://localhost:3000                                  │
│                                                              │
│  ▼ Query Parameters (2)                        [Copy URL]   │
│  ┌──────────────┬────────────────────────────────────────┐ │
│  │ Parameter    │ Value                                  │ │
│  ├──────────────┼────────────────────────────────────────┤ │
│  │ code         │ SplxlOBeZQQYbYS6WxSbIA                │ │
│  │ ℹ️ §4.1.2     │ ✓ Authorization code (single-use)     │ │
│  │              │ Expires in: 60 seconds                 │ │
│  │              │ Bound to: client_id, redirect_uri,     │ │
│  │              │           PKCE challenge               │ │
│  ├──────────────┼────────────────────────────────────────┤ │
│  │ state        │ af0ifjsldkj                            │ │
│  │ ℹ️ §4.1.2     │ ✓ Matches request state               │ │
│  │              │ CSRF protection validated              │ │
│  └──────────────┴────────────────────────────────────────┘ │
│                                                              │
│  🔒 Validation Performed                                     │
│  ✓ State matches expected value (CSRF check passed)         │
│  ✓ Authorization code received (no error)                   │
│  ✓ Redirect to registered URI (exact match)                 │
│                                                              │
│  Authorization Code Properties:                             │
│  • Single-use: Yes (must be used once only)                 │
│  • Lifetime: 60 seconds (expires quickly)                   │
│  • Bound to: client_id, redirect_uri, code_challenge        │
│  • Can be exchanged for: access_token, refresh_token,       │
│                          id_token                           │
│                                                              │
│  [View Code Details] [Next: Exchange Code]                 │
└─────────────────────────────────────────────────────────────┘
```

**State Validation Visualization**:
```
▼ State Parameter Validation
  Sent in Request:     af0ifjsldkj
  Received in Response: af0ifjsldkj
  Comparison:          ✓ MATCH
  
  CSRF Protection: ✓ ACTIVE
  
  What this prevents:
  Attacker cannot trick victim into authorizing attacker's
  request by crafting a malicious authorization response.
  
  [Learn More About CSRF]
```

**Error Response** (alternative display if error):
```
┌─────────────────────────────────────────────────────────────┐
│  3. Authorization Response                         ✗ Error  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ✗ Authorization Failed                                     │
│                                                              │
│  Error: access_denied                                       │
│  Description: The user denied the authorization request     │
│                                                              │
│  ℹ️ RFC 6749 §4.1.2.1 - Error Response                      │
│                                                              │
│  Common Causes:                                             │
│  • User clicked "Deny" on consent screen                    │
│  • Authorization server denied request                      │
│  • Invalid client configuration                             │
│                                                              │
│  Next Steps:                                                │
│  • Review client configuration                              │
│  • Check authorization server logs                          │
│  • Verify user has necessary permissions                    │
│                                                              │
│  [View Error Details] [Retry Authorization]                │
└─────────────────────────────────────────────────────────────┘
```

---

### 1.5 Step 4: Token Request

**Display Title**: "Step 4: Client Requests Tokens from Token Endpoint"

**Visual Card**:
```
┌─────────────────────────────────────────────────────────────┐
│  4. Token Request                                  ✓ 0.21s  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Direct server-to-server request (backchannel)             │
│  🔒 Credentials not exposed to browser                      │
│                                                              │
│  POST /realms/oauth2-demo/protocol/openid-connect/token    │
│  🔒 https://localhost:8080                                  │
│                                                              │
│  ▼ Headers (3)                                 [Copy All]   │
│    Content-Type: application/x-www-form-urlencoded          │
│    Authorization: Basic czZCaGRSa3F0M...       [Copy]       │
│    ℹ️ Basic Auth = Base64(client_id:client_secret)          │
│    User-Agent: OAuth2-Debug-Tool/1.0           [Copy]       │
│                                                              │
│  ▼ Body Parameters (5)                         [Copy All]   │
│  ┌───────────────┬───────────────────────────────────────┐ │
│  │ Parameter     │ Value                                 │ │
│  ├───────────────┼───────────────────────────────────────┤ │
│  │ grant_type    │ authorization_code                    │ │
│  │ ℹ️ §4.1.3      │ ✓ Required (specifies grant type)    │ │
│  ├───────────────┼───────────────────────────────────────┤ │
│  │ code          │ SplxlOBeZQQYbYS6WxSbIA               │ │
│  │ ℹ️ §4.1.3      │ ✓ Required (authorization code)      │ │
│  ├───────────────┼───────────────────────────────────────┤ │
│  │ redirect_uri  │ https://localhost:3000/cb            │ │
│  │ ℹ️ §4.1.3      │ ✓ Required (must match original)     │ │
│  ├───────────────┼───────────────────────────────────────┤ │
│  │ client_id     │ web-app                               │ │
│  │ ℹ️ §4.1.3      │ ✓ Required for public clients        │ │
│  ├───────────────┼───────────────────────────────────────┤ │
│  │ code_verifier │ dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW... │ │
│  │ ℹ️ RFC 7636    │ ✓ Required (PKCE verifier)           │ │
│  │               │ Matches challenge sent in step 1      │ │
│  └───────────────┴───────────────────────────────────────┘ │
│                                                              │
│  🔒 Client Authentication                                    │
│  Type: client_secret_basic                                  │
│  Status: ✓ Authenticated                                    │
│  Method: HTTP Basic Auth header                             │
│                                                              │
│  🔒 Security Validations (Server-Side)                       │
│  1. ✓ Client authenticated (valid client_secret)            │
│  2. ✓ Authorization code valid and not expired              │
│  3. ✓ Authorization code not previously used                │
│  4. ✓ redirect_uri matches original request                 │
│  5. ✓ PKCE: code_verifier matches code_challenge            │
│                                                              │
│  [View cURL Command] [View PKCE Verification]              │
└─────────────────────────────────────────────────────────────┘
```

**PKCE Verification Visualization**:
```
▼ PKCE Verification Process (Server-Side)
  
  Step 1: Receive code_verifier
    dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
  
  Step 2: Retrieve stored code_challenge
    E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  
  Step 3: Apply S256 transformation to verifier
    SHA-256(code_verifier)
    Base64URL encode
    Result: E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  
  Step 4: Compare calculated vs stored challenge
    Calculated: E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
    Stored:     E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
    Result:     ✓ MATCH
  
  Step 5: Issue tokens
    ✓ PKCE verification successful
    ✓ Code is bound to original client
    ✓ Tokens issued
  
  [View Without PKCE Comparison]
```

---

### 1.6 Step 5: Token Response

**Display Title**: "Step 5: Authorization Server Returns Tokens"

**Visual Card**:
```
┌─────────────────────────────────────────────────────────────┐
│  5. Token Response                                 ✓ 200 OK │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  HTTP/1.1 200 OK                                            │
│  Content-Type: application/json                             │
│  Cache-Control: no-store                                    │
│  Pragma: no-cache                                           │
│                                                              │
│  ▼ Response Body (JSON)                        [Copy All]   │
│  {                                                           │
│    "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVC...", │
│    "token_type": "Bearer",                                  │
│    "expires_in": 3600,                                      │
│    "refresh_token": "tGzv3JOkF0XG5Qx2TlKWIA",             │
│    "scope": "openid profile email",                         │
│    "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."   │
│  }                                                           │
│                                                              │
│  ▼ Token Details                                            │
│  ┌──────────────────┬──────────────────────────────────┐   │
│  │ Token Type       │ Details                          │   │
│  ├──────────────────┼──────────────────────────────────┤   │
│  │ Access Token     │ Type: JWT                        │   │
│  │ [Inspect]        │ Format: RS256 signed             │   │
│  │                  │ Lifetime: 60 minutes             │   │
│  │                  │ Purpose: API authorization       │   │
│  │                  │ Claims: iss, sub, aud, exp, scope│   │
│  ├──────────────────┼──────────────────────────────────┤   │
│  │ Refresh Token    │ Type: Opaque                     │   │
│  │ [Inspect]        │ Format: Random string            │   │
│  │                  │ Lifetime: 30 days                │   │
│  │                  │ Purpose: Get new access token    │   │
│  │                  │ Single-use: Yes (with rotation)  │   │
│  ├──────────────────┼──────────────────────────────────┤   │
│  │ ID Token         │ Type: JWT                        │   │
│  │ [Inspect]        │ Format: RS256 signed             │   │
│  │                  │ Lifetime: 60 minutes             │   │
│  │                  │ Purpose: User authentication     │   │
│  │                  │ Claims: iss, sub, aud, exp,      │   │
│  │                  │         name, email, etc.        │   │
│  └──────────────────┴──────────────────────────────────┘   │
│                                                              │
│  📊 Token Summary                                            │
│  Token Type: Bearer                                         │
│  Scopes Granted: openid, profile, email                    │
│  Access Token Expires: 2024-12-10 13:45:00 (60 min)        │
│  Refresh Token Expires: 2025-01-09 12:45:00 (30 days)      │
│                                                              │
│  [Inspect All Tokens] [View Token Lifetimes] [Use Token]   │
└─────────────────────────────────────────────────────────────┘
```

**Token Inspect Modal** (opens when clicking [Inspect]):
- Shows full JWT token inspector (see Token Inspector component)
- Decoded header, payload, signature
- Validation status
- Claim-by-claim breakdown

---

### 1.7 Step 6: Token Storage

**Display Title**: "Step 6: Client Stores Tokens Securely"

**Visual Card**:
```
┌─────────────────────────────────────────────────────────────┐
│  6. Token Storage                                  ✓ Secure │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Tokens must be stored securely to prevent theft           │
│                                                              │
│  ▼ Storage Location: Backend Session (Recommended)         │
│  ┌────────────────────────────────────────────────────┐    │
│  │  ✓ Backend Server                                  │    │
│  │    • Access token: Session storage (HttpOnly)      │    │
│  │    • Refresh token: Encrypted database             │    │
│  │    • ID token: Session storage                     │    │
│  │                                                     │    │
│  │  Security Properties:                              │    │
│  │  ✓ Not accessible to JavaScript (XSS protection)   │    │
│  │  ✓ HttpOnly cookies (browser security)             │    │
│  │  ✓ Secure flag (HTTPS only)                        │    │
│  │  ✓ SameSite=Strict (CSRF protection)               │    │
│  │  ✓ Refresh token encrypted at rest                 │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Alternative Storage Options:                               │
│                                                              │
│  ✓ Platform Keychain (Native Apps)                         │
│    iOS: Keychain Services                                   │
│    Android: KeyStore                                        │
│    Security: ✓ Excellent (OS-level protection)             │
│                                                              │
│  ⚠️ Memory Only (Single Page Apps)                          │
│    Security: ⚠️ Moderate (tokens lost on refresh)          │
│    Use case: Short-lived sessions only                      │
│                                                              │
│  ✗ localStorage (NEVER USE)                                 │
│    Security: ✗ VULNERABLE (XSS can steal tokens)           │
│    Reason: Accessible to any JavaScript                     │
│                                                              │
│  📊 Security Assessment                                      │
│  Storage Method: Backend session                            │
│  Confidentiality: ✓ Protected                               │
│  Integrity: ✓ Protected                                     │
│  Availability: ✓ Session-based                              │
│  XSS Risk: ✓ Mitigated                                      │
│                                                              │
│  [View Storage Best Practices] [View Security Guide]       │
└─────────────────────────────────────────────────────────────┘
```

**Storage Comparison** (collapsible):
```
▼ Storage Security Comparison

  ┌──────────────┬────────────┬───────────┬──────────────┐
  │ Method       │ XSS Risk   │ CSRF Risk │ Recommended  │
  ├──────────────┼────────────┼───────────┼──────────────┤
  │ Backend      │ ✓ Low      │ ✓ Low     │ ✓ Yes        │
  │ HttpOnly     │            │ (SameSite)│              │
  ├──────────────┼────────────┼───────────┼──────────────┤
  │ Platform     │ ✓ None     │ N/A       │ ✓ Yes        │
  │ Keychain     │            │           │ (Native)     │
  ├──────────────┼────────────┼───────────┼──────────────┤
  │ Memory Only  │ ⚠️ Medium  │ ✓ Low     │ ⚠️ Acceptable│
  │              │ (page only)│           │ (SPAs)       │
  ├──────────────┼────────────┼───────────┼──────────────┤
  │ localStorage │ ✗ HIGH     │ ⚠️ Medium │ ✗ NEVER      │
  │              │ (any XSS)  │           │              │
  └──────────────┴────────────┴───────────┴──────────────┘
```

---

### 1.8 Step 7: Resource Access (Optional)

**Display Title**: "Step 7: Client Accesses Protected Resource"

**Visual Card**:
```
┌─────────────────────────────────────────────────────────────┐
│  7. Resource Access (API Call)                     ✓ 0.15s │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Client uses access token to call protected API            │
│                                                              │
│  GET /api/user/profile                                      │
│  🔒 https://api.example.com                                 │
│                                                              │
│  ▼ Headers (2)                                 [Copy All]   │
│    Authorization: Bearer eyJhbGciOiJSUzI1NiIsI...  [Copy]   │
│    ℹ️ Bearer token in Authorization header                  │
│    Accept: application/json                      [Copy]     │
│                                                              │
│  🔒 Resource Server Validation Steps                         │
│  1. ✓ Extract token from Authorization header               │
│  2. ✓ Validate JWT signature                                │
│     - Retrieved public key from JWKS                        │
│     - Verified RS256 signature                              │
│  3. ✓ Check token expiration (exp claim)                    │
│     - Token not expired (expires in 42 minutes)             │
│  4. ✓ Validate audience (aud claim)                         │
│     - Audience matches this API                             │
│  5. ✓ Validate issuer (iss claim)                           │
│     - Issued by trusted authorization server                │
│  6. ✓ Check required scopes                                 │
│     - Token has 'profile' scope (required for this API)     │
│                                                              │
│  ▼ Response (200 OK)                           [Copy All]   │
│  {                                                           │
│    "sub": "user123",                                        │
│    "name": "Alice Anderson",                                │
│    "email": "alice@example.com",                            │
│    "email_verified": true,                                  │
│    "picture": "https://example.com/avatar.jpg"             │
│  }                                                           │
│                                                              │
│  ℹ️ Protected Resource Successfully Retrieved               │
│                                                              │
│  [View Token Validation] [View API Response]               │
└─────────────────────────────────────────────────────────────┘
```

---

### 1.9 Complete Flow Summary

**Display After All Steps Complete**:
```
┌─────────────────────────────────────────────────────────────┐
│  Authorization Code Flow - Complete                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ✓ Flow Completed Successfully                              │
│  Total Time: 3.2 seconds                                    │
│                                                              │
│  Timeline:                                                  │
│  1. Authorization Request ──────────────── ✓ 0.15s         │
│  2. User Authentication ────────────────── ✓ External      │
│  3. Authorization Response ─────────────── ✓ 0.08s         │
│  4. Token Request ──────────────────────── ✓ 0.21s         │
│  5. Token Response ─────────────────────── ✓ 0.18s         │
│  6. Token Storage ──────────────────────── ✓ Secure        │
│  7. Resource Access ────────────────────── ✓ 0.15s         │
│                                                              │
│  📊 Security Assessment                                      │
│  ┌──────────────────────────────────┬──────────────────┐   │
│  │ Security Feature                 │ Status           │   │
│  ├──────────────────────────────────┼──────────────────┤   │
│  │ PKCE Protection                  │ ✓ Enabled (S256) │   │
│  │ CSRF Protection                  │ ✓ State validated│   │
│  │ Transport Security               │ ✓ HTTPS          │   │
│  │ Token Storage                    │ ✓ Secure         │   │
│  │ Token Lifetime                   │ ⚠️ 60 min        │   │
│  │ Client Authentication            │ ✓ Secret used    │   │
│  │ Scope Minimization               │ ✓ Minimal scopes │   │
│  └──────────────────────────────────┴──────────────────┘   │
│                                                              │
│  Overall Security Score: 95/100                             │
│  Grade: A                                                   │
│                                                              │
│  ✅ Recommendations:                                         │
│  • Consider shorter access token lifetime (15 min optimal) │
│  • Implement token rotation for refresh tokens             │
│  • Consider DPoP for sender-constrained tokens             │
│                                                              │
│  [View Detailed Scorecard] [Export Flow] [Start New Flow]  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Client Credentials Flow

### 2.1 Flow Overview

**2 Steps** (simplified, no user interaction):
1. Token Request (with client credentials)
2. Token Response
3. Resource Access (optional)

**Timeline**:
```
Client App          Auth Server          Resource Server
     |                    |                     |
     |--1. Token Request->|                     |
     |    (client creds)  |                     |
     |<-2. Access Token---|                     |
     |                    |                     |
     |--------3. API Request (Bearer token)---->|
     |<-------4. Protected Resource-------------|
```

### 2.2 Step 1: Token Request (Client Credentials)

```
┌─────────────────────────────────────────────────────────────┐
│  1. Token Request (Client Credentials)             ✓ 0.18s │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Machine-to-machine authentication (no user)                │
│                                                              │
│  POST /realms/oauth2-demo/protocol/openid-connect/token    │
│  🔒 https://localhost:8080                                  │
│                                                              │
│  ▼ Headers (2)                                 [Copy All]   │
│    Content-Type: application/x-www-form-urlencoded          │
│    Authorization: Basic c2VydmljZS1hY2NvdW50...  [Copy]     │
│    ℹ️ Basic Auth = Base64(client_id:client_secret)          │
│                                                              │
│  ▼ Body Parameters (1)                         [Copy All]   │
│  ┌──────────────┬──────────────────────────────────────┐   │
│  │ Parameter    │ Value                                │   │
│  ├──────────────┼──────────────────────────────────────┤   │
│  │ grant_type   │ client_credentials                   │   │
│  │ ℹ️ RFC 6749   │ ✓ Required (machine-to-machine)     │   │
│  │ §4.4.2       │ No user involved                     │   │
│  └──────────────┴──────────────────────────────────────┘   │
│                                                              │
│  🔒 Security                                                 │
│  ✓ Client authenticated via client_secret                   │
│  ✓ HTTPS protects credentials in transit                    │
│  ✓ No PKCE needed (direct server-to-server)                 │
│  ✓ No state needed (no user session)                        │
│                                                              │
│  ℹ️ Use Case: Backend service accessing APIs               │
│  ℹ️ No user context - service acts on its own behalf       │
│                                                              │
│  [View cURL] [View Spec Reference]                         │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Step 2: Token Response

```
┌─────────────────────────────────────────────────────────────┐
│  2. Token Response                                 ✓ 200 OK │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  {                                                           │
│    "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ...",│
│    "token_type": "Bearer",                                  │
│    "expires_in": 3600,                                      │
│    "scope": "api:read api:write"                            │
│  }                                                           │
│                                                              │
│  ⚠️ No refresh_token (not applicable for client credentials)│
│  ℹ️ No id_token (no user authentication)                    │
│                                                              │
│  [Inspect Access Token] [Use Token]                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Device Authorization Flow

### 3.1 Flow Overview

**Steps**:
1. Device Authorization Request
2. Device Authorization Response (device code + user code)
3. Display User Code to User
4. User Visits Verification URI
5. User Enters Code and Authenticates
6. Client Polls Token Endpoint
7. Token Response (after user completes)

**Timeline**:
```
Device              Auth Server         User (Browser)
  |                      |                     |
  |--1. Device Auth----->|                     |
  |<-2. Device Code------|                     |
  |    User Code         |                     |
  |                      |                     |
  |--3. Display Code-----|---Visit URI-------->|
  |                      |<----Enter Code------|
  |                      |<----Authenticate----|
  |                      |                     |
  |--4. Poll Token------>|                     |
  |<-authorization_pending                     |
  |--5. Poll Token------>|                     |
  |<-authorization_pending                     |
  |--6. Poll Token------>|                     |
  |<-7. Access Token-----|                     |
```

### 3.2 Device Authorization Request

```
┌─────────────────────────────────────────────────────────────┐
│  1. Device Authorization Request                   ✓ 0.12s │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  POST /realms/oauth2-demo/protocol/openid-connect/auth/device
│  🔒 https://localhost:8080                                  │
│                                                              │
│  ▼ Body Parameters (2)                         [Copy All]   │
│  ┌──────────────┬──────────────────────────────────────┐   │
│  │ Parameter    │ Value                                │   │
│  ├──────────────┼──────────────────────────────────────┤   │
│  │ client_id    │ device-client                        │   │
│  │ ℹ️ RFC 8628   │ ✓ Required (identifies device)      │   │
│  ├──────────────┼──────────────────────────────────────┤   │
│  │ scope        │ openid profile                       │   │
│  │ ℹ️ §3.1       │ ⚠️ Optional (requested permissions) │   │
│  └──────────────┴──────────────────────────────────────┘   │
│                                                              │
│  [View Request Details]                                     │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Device Authorization Response

```
┌─────────────────────────────────────────────────────────────┐
│  2. Device Authorization Response                  ✓ 200 OK │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  {                                                           │
│    "device_code": "GmRhmhcxhwAzkoEqiMEg_DnyEysNkuNhszIySk9eS",│
│    "user_code": "WDJB-MJHT",                                │
│    "verification_uri": "https://localhost:8080/device",     │
│    "verification_uri_complete":                             │
│      "https://localhost:8080/device?user_code=WDJB-MJHT",  │
│    "expires_in": 600,                                       │
│    "interval": 5                                            │
│  }                                                           │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Instructions for User:                            │     │
│  │                                                     │     │
│  │  1. Visit: https://localhost:8080/device          │     │
│  │     [Copy URL] [Show QR Code]                      │     │
│  │                                                     │     │
│  │  2. Enter code:                                    │     │
│  │     ┌───────────────┐                              │     │
│  │     │   WDJB-MJHT   │  [Copy Code]                │     │
│  │     └───────────────┘                              │     │
│  │                                                     │     │
│  │  3. Authenticate and approve request               │     │
│  │                                                     │     │
│  │  Code expires in: 9 minutes 45 seconds            │     │
│  │  [⏱ Timer]                                         │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  Device will poll for authorization...                      │
│  Polling interval: 5 seconds                                │
│                                                              │
│  [Start Polling] [View Instructions]                       │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 Token Polling Visualization

```
┌─────────────────────────────────────────────────────────────┐
│  Polling for User Authorization                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Status: ⏳ Waiting for user to authorize                   │
│                                                              │
│  Polling Progress:                                          │
│  [=====>                           ] Poll attempt 3 of 120  │
│                                                              │
│  ▼ Polling History                                          │
│  Poll #1: authorization_pending (⏱ 00:00)                   │
│  Poll #2: authorization_pending (⏱ 00:05)                   │
│  Poll #3: authorization_pending (⏱ 00:10) ← Current         │
│                                                              │
│  Next poll in: 2 seconds                                    │
│  Time remaining: 9 minutes 30 seconds                       │
│                                                              │
│  ℹ️ Waiting for user to:                                    │
│  1. Visit verification URI                                  │
│  2. Enter user code: WDJB-MJHT                              │
│  3. Authenticate and approve                                │
│                                                              │
│  Possible Outcomes:                                         │
│  • authorization_pending: User hasn't completed yet         │
│  • slow_down: Polling too fast, slow down                   │
│  • access_denied: User denied authorization                 │
│  • expired_token: Device code expired (10 min)             │
│  • Success: Tokens issued                                   │
│                                                              │
│  [Stop Polling] [View Polling Details]                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Refresh Token Flow

### 4.1 Flow Overview

**2 Steps**:
1. Token Refresh Request
2. Token Response (new access token + optional new refresh token)

```
┌─────────────────────────────────────────────────────────────┐
│  Token Refresh Flow                                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ⏱ Access token expired or expiring soon                   │
│  Access token lifetime: 60 minutes                          │
│  Access token expires at: 2024-12-10 13:45:00              │
│  Current time: 2024-12-10 13:43:00                         │
│  Time remaining: 2 minutes                                  │
│                                                              │
│  ✓ Refresh token available                                  │
│  Refresh token lifetime: 30 days remaining                  │
│                                                              │
│  [Use Refresh Token] [View Token Status]                   │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Refresh Token Request

```
┌─────────────────────────────────────────────────────────────┐
│  1. Refresh Token Request                          ✓ 0.16s │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  POST /realms/oauth2-demo/protocol/openid-connect/token    │
│  🔒 https://localhost:8080                                  │
│                                                              │
│  ▼ Headers (2)                                 [Copy All]   │
│    Content-Type: application/x-www-form-urlencoded          │
│    Authorization: Basic czZCaGRSa3F0M...       [Copy]       │
│                                                              │
│  ▼ Body Parameters (3)                         [Copy All]   │
│  ┌──────────────┬──────────────────────────────────────┐   │
│  │ Parameter    │ Value                                │   │
│  ├──────────────┼──────────────────────────────────────┤   │
│  │ grant_type   │ refresh_token                        │   │
│  │ ℹ️ RFC 6749   │ ✓ Required (specifies grant)        │   │
│  ├──────────────┼──────────────────────────────────────┤   │
│  │ refresh_token│ tGzv3JOkF0XG5Qx2TlKWIA              │   │
│  │ ℹ️ §6         │ ✓ Required (refresh token)          │   │
│  ├──────────────┼──────────────────────────────────────┤   │
│  │ scope        │ openid profile email                 │   │
│  │ ℹ️ §6         │ ⚠️ Optional (can request subset)    │   │
│  └──────────────┴──────────────────────────────────────┘   │
│                                                              │
│  🔒 Security Validations (Server-Side)                       │
│  1. ✓ Client authenticated                                  │
│  2. ✓ Refresh token valid and not expired                   │
│  3. ✓ Refresh token not previously used                     │
│  4. ✓ Refresh token bound to this client                    │
│                                                              │
│  [View Request Details]                                     │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Refresh Token Response

```
┌─────────────────────────────────────────────────────────────┐
│  2. Token Response                                 ✓ 200 OK │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  {                                                           │
│    "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",│
│    "token_type": "Bearer",                                  │
│    "expires_in": 3600,                                      │
│    "refresh_token": "8xLOxBtZp8",                          │
│    "scope": "openid profile email"                          │
│  }                                                           │
│                                                              │
│  ✓ New access token issued                                  │
│  ✓ New refresh token issued (rotation enabled)              │
│  ✗ Old refresh token invalidated (single-use)               │
│                                                              │
│  🔒 Refresh Token Rotation                                   │
│  ℹ️ Rotation prevents replay attacks                        │
│  Old token: tGzv3JOkF0XG5Qx2TlKWIA (invalidated)           │
│  New token: 8xLOxBtZp8 (use for next refresh)              │
│                                                              │
│  Token Lifetimes:                                           │
│  • New access token expires: 2024-12-10 14:45:00 (60 min)  │
│  • New refresh token expires: 2025-01-09 13:45:00 (30 days)│
│                                                              │
│  [Inspect New Tokens] [View Rotation Details]              │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Swimlane Sequence Diagrams

### 5.1 Authorization Code Flow Swimlane

```
┌─────────────┬───────────────┬─────────────────┬──────────────────┐
│   User      │  Client App   │   Auth Server   │ Resource Server  │
│  (Browser)  │               │                 │                  │
├─────────────┼───────────────┼─────────────────┼──────────────────┤
│             │               │                 │                  │
│ 1. Click    │               │                 │                  │
│   "Login"   │               │                 │                  │
│     │       │               │                 │                  │
│     v       │               │                 │                  │
│ ────────────>               │                 │                  │
│             │ 2. Redirect   │                 │                  │
│             │   to auth     │                 │                  │
│<────────────│               │                 │                  │
│             │               │                 │                  │
│ 3. Auth Request             │                 │                  │
│ ────────────────────────────>                 │                  │
│             │ GET /auth     │                 │                  │
│             │ +PKCE +state  │                 │                  │
│             │               │                 │                  │
│<────────────────────────────│ 4. Login Page   │                  │
│             │               │                 │                  │
│ 5. Enter    │               │                 │                  │
│ credentials │               │                 │                  │
│ ────────────────────────────>                 │                  │
│             │ POST /auth    │                 │                  │
│             │               │                 │                  │
│<────────────────────────────│ 6. Consent Page │                  │
│             │               │                 │                  │
│ 7. Approve  │               │                 │                  │
│ ────────────────────────────>                 │                  │
│             │               │                 │                  │
│             │               │ 8. Generate code│                  │
│             │               │    +bind PKCE   │                  │
│             │               │                 │                  │
│ 9. Redirect with code       │                 │                  │
│<────────────────────────────│                 │                  │
│             │ +code +state  │                 │                  │
│     │       │               │                 │                  │
│     v       │               │                 │                  │
│ ────────────>               │                 │                  │
│             │ 10. Code      │                 │                  │
│             │   received    │                 │                  │
│             │               │                 │                  │
│             │ 11. Token Request               │                  │
│             │ ────────────────────────────────>                  │
│             │ POST /token   │ +code           │                  │
│             │ +client auth  │ +code_verifier  │                  │
│             │               │                 │                  │
│             │               │ 12. Validate:   │                  │
│             │               │  - client auth  │                  │
│             │               │  - code valid   │                  │
│             │               │  - PKCE match   │                  │
│             │               │  - redirect_uri │                  │
│             │               │                 │                  │
│             │ 13. Tokens    │                 │                  │
│             │<────────────────────────────────│                  │
│             │ access_token  │                 │                  │
│             │ refresh_token │                 │                  │
│             │ id_token      │                 │                  │
│             │               │                 │                  │
│ 14. Success │               │                 │                  │
│<────────────│               │                 │                  │
│             │               │                 │                  │
│             │ 15. API Call with Bearer token  │                  │
│             │ ─────────────────────────────────────────────────>│
│             │ GET /api/user │                 │ Authorization:   │
│             │               │                 │ Bearer <token>   │
│             │               │                 │                  │
│             │               │                 │ 16. Validate:    │
│             │               │                 │  - signature     │
│             │               │                 │  - exp, aud, iss │
│             │               │                 │  - scopes        │
│             │               │                 │                  │
│             │ 17. Protected Resource          │                  │
│             │<─────────────────────────────────────────────────│
│             │               │                 │                  │
│ 18. Display │               │                 │                  │
│    user     │               │                 │                  │
│    data     │               │                 │                  │
│<────────────│               │                 │                  │
│             │               │                 │                  │
└─────────────┴───────────────┴─────────────────┴──────────────────┘

[Click any step to view details]
[Animate Flow] [Export Diagram]
```

---

## Document Metadata

| Property | Value |
|----------|-------|
| **Version** | 1.0.0 |
| **Part** | 2 of 6 (Flow Sequences) |
| **Related Docs** | All flow specifications |
| **Completeness** | Covers 4 major flows + sequence diagrams |

---

**Next**: See `visualization-security-features.md` for security mechanism visualizations.
