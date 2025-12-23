# OAuth 2.0 Security Best Current Practice - Part 2

## Sections 7-26 (Continued)

> *This document continues the comprehensive OAuth 2.0 Security BCP master reference*

---

## 7. Token Endpoint Security (Security BCP §4)

### 7.1 Client Authentication (Security BCP §4.5.2)

**Requirements by Client Type:**

| Client Type | Authentication Method | Requirement |
|------------|----------------------|-------------|
| **Public** | None | MUST NOT use client_secret |
| **Confidential** | client_secret_post, client_secret_basic, private_key_jwt, or mTLS | MUST authenticate |

**Authentication Methods Comparison:**

```
client_secret_basic (HTTP Basic Auth):
├─ Security: Medium
├─ Complexity: Low
├─ Use: Simple confidential clients
└─ Format: Authorization: Basic base64(client_id:client_secret)

client_secret_post (POST body):
├─ Security: Medium
├─ Complexity: Low
├─ Use: Clients that cannot use HTTP Basic
└─ Format: client_id=...&client_secret=... in POST body

private_key_jwt (Asymmetric):
├─ Security: High
├─ Complexity: Medium
├─ Use: High-security scenarios
└─ Format: Signed JWT as client_assertion

mTLS (Certificate-based):
├─ Security: Very High
├─ Complexity: High
├─ Use: Enterprise, B2B, regulated industries
└─ Format: X.509 certificate in TLS handshake
```

**Recommendations:**

```
For Confidential Clients:
✅ BEST: private_key_jwt or mTLS
   - Asymmetric cryptography
   - No shared secrets
   - Better key management

⚠️ ACCEPTABLE: client_secret_basic or client_secret_post
   - If using: Strong secret (256+ bits)
   - Rotate regularly (every 90 days)
   - Store encrypted

❌ NEVER: None (for confidential clients)
   - Client impersonation possible
   - Security vulnerability
```

**Client Secret Requirements:**

```
If using client_secret:

☐ Length: 256+ bits (32+ characters)
☐ Randomness: Cryptographically secure RNG
☐ Storage: Encrypted at rest
☐ Transmission: TLS only
☐ Rotation: Every 90 days or after breach
☐ Access: Restricted (need-to-know)
```

### 7.2 PKCE Validation (Security BCP §4.8)

**Server-Side Validation:**

```python
def validate_token_request(request):
    """
    Token endpoint validation with PKCE
    """
    code = request.form.get('code')
    code_verifier = request.form.get('code_verifier')
    
    # Get stored authorization code info
    auth_code_info = get_authorization_code(code)
    
    if not auth_code_info:
        return error("invalid_grant", "Code not found or expired")
    
    # CRITICAL: Validate PKCE
    if auth_code_info['client_type'] == 'public':
        # Public clients MUST have code_verifier
        if not code_verifier:
            return error("invalid_request", "code_verifier required")
    
    if auth_code_info.get('code_challenge'):
        # PKCE was used, validate it
        if not code_verifier:
            return error("invalid_request", "code_verifier required")
        
        # Calculate challenge from verifier
        import hashlib, base64
        calculated_challenge = base64.urlsafe_b64encode(
            hashlib.sha256(code_verifier.encode()).digest()
        ).rstrip(b'=').decode()
        
        # Compare (constant-time)
        if not hmac.compare_digest(
            calculated_challenge,
            auth_code_info['code_challenge']
        ):
            return error("invalid_grant", "Invalid code_verifier")
    
    # PKCE validation passed
    return issue_tokens(auth_code_info)
```

**Enforcement by Client Type:**

| Client Type | PKCE Enforcement | Action if Missing |
|------------|------------------|-------------------|
| **Public** | REQUIRED | REJECT request |
| **Confidential** | RECOMMENDED | ACCEPT but log warning |

### 7.3 Authorization Code Security

**Code Requirements:**

| Property | Requirement | Rationale |
|----------|-------------|-----------|
| **Lifetime** | 30-60 seconds | Limit exposure window |
| **Single-use** | MUST reject replay | Prevent code reuse |
| **Binding** | Bind to client_id, redirect_uri, PKCE | Prevent theft |
| **Entropy** | 128+ bits | Prevent guessing |

**Authorization Code Structure:**

```json
{
  "code": "random_128_bit_value",
  "client_id": "abc123",
  "redirect_uri": "https://client.com/callback",
  "code_challenge": "sha256_hash",
  "code_challenge_method": "S256",
  "scope": "openid profile",
  "issued_at": 1735776000,
  "expires_at": 1735776060,
  "used": false
}
```

**Validation Algorithm:**

```python
def validate_authorization_code(code, client_id, redirect_uri, code_verifier):
    """
    Complete authorization code validation
    """
    # 1. Retrieve code
    code_data = get_code(code)
    if not code_data:
        return error("invalid_grant")
    
    # 2. Check expiration
    if current_time() > code_data['expires_at']:
        delete_code(code)
        return error("invalid_grant", "Code expired")
    
    # 3. Check single-use
    if code_data['used']:
        # Possible theft - revoke all tokens
        revoke_all_tokens_for_client(client_id)
        return error("invalid_grant", "Code already used")
    
    # 4. Validate client_id
    if code_data['client_id'] != client_id:
        return error("invalid_grant", "Client mismatch")
    
    # 5. Validate redirect_uri
    if code_data['redirect_uri'] != redirect_uri:
        return error("invalid_grant", "Redirect URI mismatch")
    
    # 6. Validate PKCE (if present)
    if code_data.get('code_challenge'):
        # ... PKCE validation ...
    
    # 7. Mark as used
    mark_code_used(code)
    
    return code_data
```

---

## 8. Access Token Security (Security BCP §4.3)

### 8.1 Token Lifetime (Security BCP §4.3.1)

**Recommendations:**

| Scenario | Recommended Lifetime | Rationale |
|----------|---------------------|-----------|
| **Public clients (SPA, mobile)** | 5-15 minutes | High theft risk |
| **Confidential clients** | 30-60 minutes | Lower risk, better UX |
| **High-security operations** | 1-5 minutes | Financial, admin operations |
| **Service-to-service** | 1-4 hours | Stable environment |

**Lifetime Decision Tree:**

```
START: What is your client type?
  │
  ├─ Public client (SPA, mobile)
  │  │
  │  ├─ Normal operations
  │  │  └─> 10-15 minutes
  │  │
  │  └─ Sensitive operations (payment, admin)
  │     └─> 2-5 minutes
  │
  └─ Confidential client (backend)
     │
     ├─ User-facing operations
     │  └─> 30-60 minutes
     │
     ├─ Service-to-service
     │  └─> 1-4 hours
     │
     └─ High-security (financial)
        └─> 5-15 minutes

Balance: Security (shorter) vs UX (longer)
```

**Configuration Example:**

```json
{
  "access_token_lifetimes": {
    "public_client_default": 900,      // 15 min
    "public_client_sensitive": 300,    // 5 min
    "confidential_client_default": 3600,  // 1 hour
    "confidential_client_service": 14400, // 4 hours
    "high_security": 180               // 3 min
  }
}
```

### 8.2 Token Storage (Security BCP §4.3.3)

**Storage Requirements by Environment:**

| Environment | Storage Method | DON'T Use |
|------------|----------------|-----------|
| **Browser (SPA)** | Memory only | ❌ localStorage, sessionStorage, cookies (non-httpOnly) |
| **Native Mobile** | Keychain (iOS), Keystore (Android) | ❌ Shared Preferences, UserDefaults (unencrypted) |
| **Native Desktop** | OS credential manager, encrypted file | ❌ Plain text files, environment variables |
| **Backend Server** | Encrypted database, secure memory, HSM | ❌ Plain text database, logs |

**SPA Token Storage (CRITICAL):**

```javascript
// ❌ NEVER DO THIS (XSS vulnerable):
localStorage.setItem('access_token', token);
sessionStorage.setItem('access_token', token);

// ✅ CORRECT (memory only):
class TokenManager {
    constructor() {
        this.accessToken = null;  // In-memory only
    }
    
    setToken(token) {
        this.accessToken = token;
    }
    
    getToken() {
        return this.accessToken;
    }
    
    clearToken() {
        this.accessToken = null;
    }
}

// When page reloads: User must re-authenticate
// Trade-off: Security over convenience
```

**Backend for Frontend (BFF) Pattern:**

```
Problem: SPAs cannot securely store tokens
Solution: Backend component manages tokens

Architecture:
┌─────────┐              ┌─────────┐              ┌──────────┐
│   SPA   │─────────────>│   BFF   │─────────────>│   API    │
│(Browser)│   httpOnly   │(Backend)│   Bearer     │          │
│         │   cookie     │         │   token      │          │
└─────────┘              └─────────┘              └──────────┘

Benefits:
✓ Tokens never in browser
✓ httpOnly secure cookies
✓ Backend handles refresh
✓ More secure than pure SPA

Trade-offs:
✗ More complex architecture
✗ Additional backend component
✗ Session management needed
```

### 8.3 Token Transmission (Security BCP §4.3.2)

**Transmission Methods:**

| Method | Security | Recommendation |
|--------|----------|----------------|
| **Authorization header** | ✅ High | RECOMMENDED |
| **POST body** | ⚠️ Medium | Acceptable if header not possible |
| **Query parameter** | ❌ Low | MUST NOT use (logs, referrer) |

**Authorization Header (Best Practice):**

```http
GET /api/resource HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Why Query Parameter is Dangerous:**

```
❌ NEVER: https://api.example.com/resource?access_token=SECRET

Problems:
1. Server logs:
   2025-12-08 GET /resource?access_token=SECRET

2. Proxy logs:
   Proxy recorded: /resource?access_token=SECRET

3. Browser history:
   History contains full URL with token

4. Referrer header:
   If API links to external site, token in Referer

5. Shared URLs:
   User copies URL, shares with token included

Result: Token leakage in multiple places
```

### 8.4 Token Revocation (Security BCP §4.3.4)

**Requirements:**

```
Authorization Server SHOULD support:
├─ RFC 7009 (Token Revocation)
├─ Immediate effect for opaque tokens
└─ Introspection for JWTs (or short exp)

Revocation Triggers:
├─ User logout
├─ User password change
├─ Security event detected
├─ Administrator action
└─ Client requests revocation
```

**Revocation Endpoint:**

```http
POST /revoke HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW

token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...&
token_type_hint=access_token
```

**JWT Revocation Challenge:**

```
Problem: JWTs are self-contained
- Resource server doesn't call authorization server
- Cannot revoke immediately

Solutions:
1. Short expiration (5-15 min)
   - Limits revocation lag
   - Acceptable for most cases

2. Token introspection (RFC 7662)
   - Resource server checks with auth server
   - Real-time revocation
   - Performance impact

3. Revocation list
   - Maintain list of revoked token JTIs
   - Resource server checks list
   - Complexity: List management

4. Event-driven revocation
   - Push revocation events to resource servers
   - WebSockets or pub/sub
   - Complexity: Event infrastructure
```

### 8.5 Sender-Constrained Tokens (Security BCP §4.3.5)

**Reference:** Security BCP §4.3.5  
**Detailed Spec:** [token-binding-dpop-mtls.md](./token-binding-dpop-mtls.md)

**When to Use:**

```
SHOULD use sender-constrained tokens for:
├─ High-value transactions (financial, healthcare)
├─ Administrative operations
├─ Long-lived tokens
├─ Regulated industries (PSD2, FAPI)
└─ Zero-trust architectures

Mechanisms:
1. DPoP (RFC 9449)
   - Application-layer binding
   - JWT proof with each request
   - Good for web/mobile apps

2. mTLS (RFC 8705)
   - Transport-layer binding
   - Client certificate required
   - Good for backend services
```

**See [token-binding-dpop-mtls.md](./token-binding-dpop-mtls.md) for complete details.**

---

## 9. Refresh Token Security (Security BCP §4.13)

**Reference:** Security BCP §4.13
**Detailed Spec:** [refresh-token-flow.md](../flows/refresh-token-flow.md)

### 9.1 Refresh Token Rotation (Security BCP §4.13.2)

**Requirements:**

| Client Type | Rotation Requirement | Reference |
|------------|---------------------|-----------|
| **Public** | MUST rotate | OAuth 2.1, Security BCP §4.13.2 |
| **Confidential** | SHOULD rotate | Security BCP §4.13.2 |

**Rotation Flow:**

```
Token Refresh Request:
1. Client sends refresh_token
2. Server validates refresh_token
3. Server issues NEW access_token
4. Server issues NEW refresh_token
5. Server INVALIDATES old refresh_token

Result: Each refresh token single-use
```

**Implementation:**

```python
def handle_refresh_token_request(refresh_token, client_id):
    """
    Refresh token rotation implementation
    """
    # 1. Validate refresh token
    token_data = get_refresh_token(refresh_token)
    if not token_data or token_data['revoked']:
        return error("invalid_grant")
    
    # 2. Check expiration
    if current_time() > token_data['expires_at']:
        return error("invalid_grant", "Refresh token expired")
    
    # 3. Validate client
    if token_data['client_id'] != client_id:
        return error("invalid_grant")
    
    # 4. Issue NEW tokens
    new_access_token = create_access_token(token_data['user_id'])
    new_refresh_token = create_refresh_token(token_data['user_id'])
    
    # 5. CRITICAL: Invalidate old refresh token
    revoke_refresh_token(refresh_token)
    
    # 6. Store token family for theft detection
    link_token_family(refresh_token, new_refresh_token)
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "Bearer",
        "expires_in": 900
    }
```

### 9.2 Theft Detection (Security BCP §4.13.3)

**Token Family Tracking:**

```
Concept: Track lineage of refresh tokens

Token Family:
├─ Original refresh token (RT1)
│  └─ First rotation → RT2
│     └─ Second rotation → RT3
│        └─ Third rotation → RT4

Theft Detection:
- If RT2 used after RT3 issued
- Attacker likely replaying stolen token
- Action: Revoke ENTIRE family

Race Condition Handling:
- Network delay may cause legitimate RT2 use after RT3 issued
- Grace period: 5-10 seconds
- If within grace period: Allow, if outside: Revoke
```

**Implementation:**

```python
def detect_refresh_token_theft(used_token, client_id):
    """
    Detect refresh token theft via family tracking
    """
    # Get token family
    family = get_token_family(used_token)
    
    # Check if this token is in the family
    if used_token not in family['tokens']:
        # Not in family, different issue
        return error("invalid_grant")
    
    # Check if this token is the current (latest) token
    current_token = family['current_token']
    
    if used_token == current_token:
        # This is the current token - legitimate use
        return None
    
    # Check grace period for race conditions
    token_data = family['tokens'][used_token]
    time_since_rotation = current_time() - token_data['rotated_at']
    
    if time_since_rotation < 10:  # 10 second grace period
        # Within grace period - probably race condition
        logging.warning(f"Old refresh token used within grace period: {client_id}")
        return None
    
    # Old token used outside grace period - THEFT DETECTED
    logging.critical(f"REFRESH TOKEN THEFT DETECTED: {client_id}")
    
    # CRITICAL: Revoke ALL tokens in family
    revoke_token_family(family['family_id'])
    
    # Optional: Notify user
    notify_user_of_security_event(family['user_id'])
    
    return error("invalid_grant", "Token theft detected - all tokens revoked")
```

### 9.3 Refresh Token Storage

**Storage Requirements:**

```
Same as access tokens, but MORE critical:
├─ Longer lifetime (days/weeks)
├─ Can issue new access tokens
├─ Higher value target

Backend:
✓ Encrypted database
✓ Hash before storage
✓ Secure memory

Native Apps:
✓ Platform Keychain/Keystore
✓ NEVER shared preferences

SPAs:
❌ NEVER store in browser
✓ Use BFF pattern instead
```

### 9.4 Refresh Token Lifetime

**Recommendations:**

| Scenario | Lifetime | Rationale |
|----------|----------|-----------|
| **Public clients** | 7-14 days | Balance security/UX |
| **Confidential clients** | 30-90 days | More secure environment |
| **High-security** | 1-7 days | Financial, admin |

**Expiration Triggers:**

```
Refresh token MUST expire on:
├─ Absolute expiration time reached
├─ User logout (explicit)
├─ User password change
├─ Security event (theft detected, suspicious activity)
├─ Inactivity timeout (e.g., 90 days no use)
└─ Administrator revocation
```

---

## 10. Redirect URI Security (Security BCP §4.1)

**Reference:** Security BCP §4.1  
**Detailed Spec:** [redirect-uri-validation.md](./redirect-uri-validation.md)

### 10.1 Exact String Matching (Security BCP §4.1.3)

**Requirement:**
```
Authorization Server MUST use exact string matching
NO pattern matching, NO prefix matching, NO wildcards
```

**Why Exact Matching:**

```
Vulnerable (Prefix Matching):
Registered: https://client.com/callback
Attack: https://client.com/callback.evil.com
Validation: Starts with registered → PASS (vulnerable!)
Result: Code sent to evil.com

Secure (Exact Matching):
Registered: https://client.com/callback
Attack: https://client.com/callback.evil.com
Validation: Exact match → FAIL ✓
Result: Attack blocked
```

**See [redirect-uri-validation.md](./redirect-uri-validation.md) for complete details.**

### 10.2 HTTPS Requirement (Security BCP §4.1.1)

**Requirements:**

```
Redirect URIs MUST use HTTPS

Exceptions:
├─ localhost (http://localhost:8080)
├─ 127.0.0.1 (http://127.0.0.1:8080)
├─ [::1] (http://[::1]:8080)
└─ Custom URI schemes for native apps (myapp://)

Everything else: MUST be HTTPS
```

### 10.3 Native App Redirect URIs (Security BCP §4.1.4)

**Preference Order:**

```
1. BEST: Claimed HTTPS URIs
   - https://app.example.com/callback
   - Verified by OS (Universal Links, App Links)
   - Cannot be hijacked
   - MUST still use PKCE

2. ACCEPTABLE: Custom URI Schemes
   - myapp://callback
   - Can be hijacked by malicious apps
   - MUST use PKCE (critical!)

3. ACCEPTABLE: Loopback
   - http://127.0.0.1/callback
   - May allow dynamic port (RFC 8252)
   - MUST use PKCE
```

---

## 11. CSRF Protection (Security BCP §4.7)

**Reference:** Security BCP §4.7  
**Detailed Spec:** [state-parameter-and-csrf.md](./state-parameter-and-csrf.md)

### 11.1 State Parameter Requirements

```
MUST use state parameter for ALL authorization requests

Requirements:
├─ Unpredictable (128+ bits entropy)
├─ Single-use (one-time validation)
├─ Session-bound (tied to user session)
├─ Short-lived (5-10 minutes)
└─ Constant-time comparison
```

**See [state-parameter-and-csrf.md](./state-parameter-and-csrf.md) for complete implementation.**

---

## 12. Mix-Up Attack Prevention (Security BCP §4.4)

### 12.1 Mix-Up Attack Overview

**Threat:**
```
Attacker mixes responses from different authorization servers

Scenario:
1. Client supports multiple AS (Google, Microsoft, etc.)
2. Attacker intercepts authorization request to AS1
3. Attacker forwards to AS2 instead
4. Client receives response from AS2
5. Client thinks it's from AS1
6. Client sends AS2 code to AS1 for exchange
7. Attacker can exploit confusion
```

### 12.2 Mitigations

**Mitigation 1: Track Expected AS**

```python
# During authorization request
def initiate_authorization(authorization_server):
    state = generate_state()
    
    # Store which AS this request is for
    session['oauth_state'] = state
    session['expected_issuer'] = authorization_server.issuer
    
    return redirect(authorization_url)

# During callback
def handle_callback(request):
    state = request.args.get('state')
    
    # Validate state
    if state != session.get('oauth_state'):
        raise SecurityError("Invalid state")
    
    # Get tokens
    tokens = exchange_code(code)
    
    # CRITICAL: Validate iss claim matches expected
    id_token = decode_id_token(tokens['id_token'])
    
    if id_token['iss'] != session.get('expected_issuer'):
        raise SecurityError("Issuer mismatch - mix-up attack")
    
    return tokens
```

**Mitigation 2: Issuer Identification (RFC 9207)**

```
Authorization Response includes iss parameter:
https://client.com/callback?
    code=ABC123&
    state=XYZ789&
    iss=https://auth.example.com  ← Issuer identification

Client validates:
1. iss in authorization response
2. iss in ID token
3. Both match expected AS

OAuth 2.1: Requires iss in authorization response
```

### 12.3 Implementation Checklist

```
☐ Support multiple AS? Implement mix-up protections
☐ Store expected issuer with state
☐ Validate iss in authorization response (OAuth 2.1)
☐ Validate iss in ID token (OIDC)
☐ Reject if issuer mismatch
```

---

## 13. Authorization Server Security (Security BCP §4)

### 13.1 TLS Requirements

**Requirements:**

```
Authorization Server MUST:
├─ Use TLS 1.2 or higher (TLS 1.3 recommended)
├─ Use strong cipher suites (no RC4, 3DES, etc.)
├─ Validate certificates properly
├─ Use HSTS (HTTP Strict Transport Security)
└─ Disable SSLv3, TLS 1.0, TLS 1.1
```

**HSTS Configuration:**

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### 13.2 Endpoint Security

**Rate Limiting:**

```
Critical endpoints requiring rate limiting:
├─ /authorize: Prevent authorization spam
├─ /token: Prevent brute force attacks
├─ /userinfo: Prevent data scraping
└─ /revoke: Prevent DoS

Recommended Limits:
├─ /token: 10 requests/minute per client_id
├─ /authorize: 20 requests/minute per IP
└─ Failed attempts: 5 failures → temporary block
```

**Implementation:**

```python
from flask_limiter import Limiter

limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

@app.route('/token', methods=['POST'])
@limiter.limit("10 per minute")
def token_endpoint():
    # Token issuance logic
    pass
```

### 13.3 Logging and Monitoring

**What to Log:**

```
✓ Authorization requests (client_id, scope, timestamp)
✓ Token issuance (client_id, user_id, timestamp)
✓ Authentication failures (client_id, reason)
✓ Token validation failures (reason)
✓ PKCE validation failures
✓ state validation failures
✓ redirect_uri validation failures
✓ Unusual patterns (multiple clients, rare scopes)

✗ DO NOT log: tokens, secrets, passwords, codes
```

**Monitoring Alerts:**

```
Alert on:
├─ High rate of failed authentications (potential attack)
├─ PKCE missing for public clients (misconfiguration)
├─ state validation failures (CSRF attempts)
├─ redirect_uri validation failures (open redirect attempts)
├─ Multiple token refresh failures (theft detection)
└─ Unusual access patterns (compromised account)
```

---

## 14. Resource Server Security (Security BCP §4)

### 14.1 Token Validation

**Complete Validation Process:**

```
For EVERY request:

1. Extract access token from Authorization header
   ✓ Check header present
   ✓ Check format: "Bearer <token>"

2. Validate token structure (if JWT)
   ✓ Valid JWT format
   ✓ Decode header, payload, signature

3. Verify signature
   ✓ Get public key from JWKS endpoint
   ✓ Verify signature with public key
   ✓ MUST reject if signature invalid

4. Validate claims
   ✓ exp (expiration): Not expired
   ✓ nbf (not before): Time has come
   ✓ iss (issuer): Expected authorization server
   ✓ aud (audience): This resource server
   ✓ scope: Contains required scope

5. Check token binding (if DPoP/mTLS)
   ✓ Validate cnf claim
   ✓ Verify binding to client

6. Check revocation (optional)
   ✓ Call introspection endpoint
   ✓ Or check revocation list
```

**Implementation:**

```python
from jose import jwt, JWTError

def validate_access_token(token_string, required_scope):
    """
    Complete access token validation
    """
    try:
        # Get public key
        public_key = get_public_key_from_jwks()
        
        # Decode and verify
        claims = jwt.decode(
            token_string,
            public_key,
            algorithms=['RS256'],
            audience='https://api.example.com',  # This resource server
            issuer='https://auth.example.com'    # Expected AS
        )
        
        # Validate expiration (handled by jwt.decode with options)
        # Validate scope
        token_scopes = claims.get('scope', '').split()
        if required_scope not in token_scopes:
            raise ValueError(f"Insufficient scope: {required_scope} required")
        
        return claims
        
    except JWTError as e:
        raise Unauthorized(f"Invalid token: {e}")
```

### 14.2 Scope Enforcement

**Principle: Least Privilege**

```
Resource Server MUST:
├─ Check token contains required scope
├─ Implement fine-grained scopes
├─ Deny access if scope insufficient
└─ Log scope violations

Example scopes:
✓ Fine-grained: read:own_messages, write:own_profile
✗ Too broad: read:*, admin
```

**Scope Hierarchy:**

```python
SCOPE_HIERARCHY = {
    'admin': ['read:*', 'write:*', 'delete:*'],
    'write:messages': ['read:messages'],
    'read:*': ['read:messages', 'read:profile', 'read:contacts']
}

def has_scope(token_scopes, required_scope):
    """
    Check if token has required scope (with hierarchy)
    """
    # Direct match
    if required_scope in token_scopes:
        return True
    
    # Check hierarchy
    for scope in token_scopes:
        if required_scope in SCOPE_HIERARCHY.get(scope, []):
            return True
    
    return False
```

---

## 15. Browser-Based Application Guidance (Security BCP §4.3.3)

### 15.1 Single Page Applications (SPAs)

**Security Requirements:**

```
SPAs MUST:
├─ Use authorization code flow + PKCE (not implicit)
├─ NOT store tokens in localStorage (XSS vulnerable)
├─ Store tokens in memory only
├─ Use short access token lifetime (5-15 min)
├─ Implement proper CORS restrictions
└─ Consider Backend for Frontend (BFF) pattern
```

**Token Storage (CRITICAL):**

```javascript
// ❌ NEVER DO THIS:
localStorage.setItem('token', accessToken);  // XSS vulnerability
sessionStorage.setItem('token', accessToken);  // XSS vulnerability
document.cookie = 'token=' + accessToken;  // XSS if not httpOnly

// ✅ CORRECT:
class SecureTokenManager {
    #accessToken = null;  // Private field, memory only
    
    setToken(token) {
        this.#accessToken = token;
    }
    
    getToken() {
        return this.#accessToken;
    }
    
    clearToken() {
        this.#accessToken = null;
    }
}
```

### 15.2 Backend for Frontend (BFF) Pattern

**Architecture:**

```
┌──────────────────────────────────────────────────────┐
│           Backend for Frontend (BFF) Pattern          │
├──────────────────────────────────────────────────────┤
│                                                       │
│   ┌─────────┐         ┌──────────┐     ┌─────────┐ │
│   │   SPA   │────────>│   BFF    │────>│   API   │ │
│   │(Browser)│ Cookie  │(Backend) │Token│(Resource│ │
│   └─────────┘         └──────────┘     │ Server) │ │
│                                        └─────────┘ │
│                                                       │
│   SPA:                                                │
│   ├─ User interface only                             │
│   ├─ No tokens                                       │
│   └─ httpOnly secure cookie for session              │
│                                                       │
│   BFF:                                                │
│   ├─ Handles OAuth flow                              │
│   ├─ Stores tokens server-side                       │
│   ├─ Refreshes tokens                                │
│   └─ Proxies API requests                            │
│                                                       │
│   Benefits:                                           │
│   ✓ Tokens never in browser                          │
│   ✓ XSS cannot steal tokens                          │
│   ✓ Better security                                  │
│                                                       │
│   Trade-offs:                                         │
│   ✗ More complex                                     │
│   ✗ Additional backend component                     │
│                                                       │
└──────────────────────────────────────────────────────┘
```

### 15.3 XSS Protection for SPAs

**Defense Layers:**

```
1. Content Security Policy (CSP)
   Content-Security-Policy: 
     default-src 'self'; 
     script-src 'self'; 
     object-src 'none'

2. Input Sanitization
   - Sanitize all user input
   - Use DOMPurify or similar

3. Output Encoding
   - Encode output based on context
   - Use framework's built-in encoding

4. Avoid Dangerous APIs
   - Never use eval()
   - Avoid innerHTML with untrusted data
   - Use textContent instead

5. Token in Memory Only
   - No localStorage/sessionStorage
   - Limits XSS impact
```

---

## 16. Native Application Guidance (RFC 8252, Security BCP §2.1.1)

### 16.1 System Browser Requirement

**MUST use system browser (not embedded WebView)**

```
Why system browser:
✓ Separate security context from app
✓ User can see real URL
✓ Saved credentials/SSO available
✓ Better security updates
✓ User trust (familiar browser)

Why NOT embedded WebView:
✗ App can intercept credentials
✗ App can inject JavaScript
✗ No URL visibility
✗ Phishing opportunity
✗ No security isolation
```

### 16.2 Redirect URI for Native Apps

**Preference Order:**

```
1. Claimed HTTPS URIs (BEST)
   https://app.example.com/oauth/callback
   
   iOS: Universal Links
   - Associated Domains entitlement
   - apple-app-site-association file
   
   Android: App Links
   - Intent filters
   - assetlinks.json file
   
   Benefits:
   ✓ Verified ownership
   ✓ Cannot be hijacked
   ✓ Fallback to web if app not installed

2. Custom URI Schemes (ACCEPTABLE)
   com.example.myapp://oauth/callback
   
   Risks:
   ✗ Can be hijacked by malicious apps
   ✗ OS may show disambiguation dialog
   
   Requirements:
   ✓ MUST use PKCE (critical!)
   ✓ Use reverse domain notation

3. Loopback (http://127.0.0.1)
   http://127.0.0.1:8080/callback
   
   Use: Desktop applications
   May allow dynamic port (RFC 8252 §8.3)
   MUST use PKCE
```

### 16.3 Token Storage for Native Apps

**Platform Keychain/Keystore REQUIRED:**

```
iOS: Keychain Services
├─ Store access token, refresh token
├─ kSecAttrAccessible: kSecAttrAccessibleAfterFirstUnlock
├─ Encrypted by system
└─ Survives app reinstall

Swift Example:
let query: [String: Any] = [
    kSecClass as String: kSecClassGenericPassword,
    kSecAttrAccount as String: "oauth_access_token",
    kSecValueData as String: token.data(using: .utf8)!
]
SecItemAdd(query as CFDictionary, nil)

Android: Android Keystore
├─ Store access token, refresh token
├─ Hardware-backed if available
├─ Encrypted by system
└─ Protected by device credentials

Kotlin Example:
val keyStore = KeyStore.getInstance("AndroidKeyStore")
keyStore.load(null)
// Use keyStore to encrypt token before storage
```

---

*[Document continues with remaining sections 17-26...]*

---

**Note:** This is Part 2. Part 3 will complete sections 17-26 with testing, pitfalls, OAuth 2.1 comparison, compliance, and comprehensive checklists.

*"Security best practices aren't suggestions—they're the lessons learned from everyone else's expensive mistakes. Learn from them, not by repeating them."*
