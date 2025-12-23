# OAuth 2.0 Security Best Current Practice - Part 3 (Final)

## Sections 17-26 (Conclusion)

> *This document completes the comprehensive OAuth 2.0 Security BCP master reference*

---

## 17. Device Flow Security (Security BCP §5.5, RFC 8628)

**Reference:** RFC 8628 (Device Authorization Grant)
**Detailed Spec:** [device-authorization-flow.md](../flows/device-authorization-flow.md)

### 17.1 Device Flow Overview

**Use Case:** Input-constrained devices (smart TVs, IoT, printers)

```
Flow:
1. Device requests device_code and user_code
2. Device displays user_code and verification_uri
3. User visits verification_uri on phone/computer
4. User enters user_code
5. User authenticates and authorizes
6. Device polls token endpoint
7. Device receives tokens when authorized
```

### 17.2 User Code Security

**Requirements:**

| Property | Requirement | Rationale |
|----------|-------------|-----------|
| **Entropy** | 8+ characters recommended | Prevent guessing |
| **Case** | Case-insensitive preferred | Easier user input |
| **Characters** | Distinguishable (no 0/O, 1/l/I) | Reduce user errors |
| **Format** | Grouped (ABCD-EFGH) | Easier to read |
| **Lifetime** | 10-15 minutes | Balance UX/security |

**Good User Code Examples:**

```
✓ BDWP-HQMK (8 chars, grouped, no confusing chars)
✓ GMTP-XVSR (readable, case-insensitive)
✓ RNQJ-FLVW (distinguishable characters)

✗ a1b2c3d4 (has confusing 1, lowercase)
✗ ABCDEFGH (too long, no grouping)
✗ ABC (too short, low entropy)
```

### 17.3 Device Code Security

**Requirements:**

```
Device Code:
├─ Entropy: 128+ bits (cryptographically random)
├─ Lifetime: 10-15 minutes (match user code)
├─ Single-use: Consumed after successful token issuance
└─ Rate limiting: Limit code generation per IP/device
```

### 17.4 Polling Requirements

**Poll Interval Enforcement:**

```
Client Behavior:
├─ Default interval: 5 seconds (from device_code response)
├─ MUST respect interval
├─ MUST handle slow_down error
└─ Increase interval on slow_down

Server Response:
├─ pending: Authorization not yet complete (keep polling)
├─ slow_down: Increase interval by 5 seconds
├─ access_denied: User denied authorization
├─ authorization_pending: Still waiting
└─ Success: Return tokens
```

**Rate Limiting Implementation:**

```python
@app.route('/token', methods=['POST'])
def device_token_endpoint():
    device_code = request.form.get('device_code')
    
    # Check poll interval
    last_poll = get_last_poll_time(device_code)
    min_interval = get_poll_interval(device_code)
    
    if current_time() - last_poll < min_interval:
        # Too fast - return slow_down
        increase_poll_interval(device_code, 5)
        return {
            "error": "slow_down",
            "error_description": "Polling too frequently"
        }, 400
    
    # Update last poll time
    update_last_poll_time(device_code)
    
    # Check authorization status
    # ...
```

### 17.5 Phishing Prevention

**User Education:**

```
Display clearly to user:
├─ Verification URI: https://example.com/device
├─ User code: BDWP-HQMK
├─ Instructions: "Visit URL and enter code"
└─ Warning: "Only use this URL, check carefully"

Phishing Risks:
├─ Attacker shows fake verification_uri
├─ User enters code on attacker's site
├─ Attacker uses code on real site
└─ Attacker gains access to user's account

Mitigations:
├─ Clear, prominent display of official URI
├─ User education about phishing
├─ Short user code lifetime (10-15 min)
└─ QR code with verification_uri (harder to fake)
```

---

## 18. OpenID Connect Specific Guidance

### 18.1 ID Token Validation (OIDC Core §3.1.3.7)

**Reference:** OIDC Core §3.1.3.7
**Detailed Spec:** [id-tokens-oidc.md](../tokens/id-tokens-oidc.md)

**Complete Validation Process:**

```
For ID Tokens, client MUST validate:

1. Signature (REQUIRED)
   ✓ Verify JWT signature with issuer's public key
   ✓ Get key from JWKS endpoint
   ✓ MUST reject if signature invalid
   ✓ MUST reject alg=none

2. iss (issuer) claim (REQUIRED)
   ✓ MUST match expected authorization server
   ✓ Case-sensitive comparison
   ✓ Reject if mismatch

3. aud (audience) claim (REQUIRED)
   ✓ MUST contain client's client_id
   ✓ If array, client_id MUST be present
   ✓ If azp present, MUST match client_id

4. exp (expiration) claim (REQUIRED)
   ✓ Current time MUST be before exp
   ✓ Account for clock skew (±5 minutes)
   ✓ Reject if expired

5. iat (issued at) claim (REQUIRED)
   ✓ Timestamp when token issued
   ✓ MUST be reasonable (not far in future)

6. nonce claim (REQUIRED if sent in request)
   ✓ MUST match nonce sent in authorization request
   ✓ Prevents token replay
   ✓ Use constant-time comparison

7. at_hash (if applicable)
   ✓ If using hybrid flow with access_token
   ✓ MUST validate at_hash = BASE64URL(SHA256(access_token)[0:128 bits])

8. azp (authorized party) if present
   ✓ If multiple audiences, azp MUST be present
   ✓ azp MUST equal client_id
```

**Validation Implementation:**

```python
from jose import jwt, JWTError
import hashlib
import base64

def validate_id_token(id_token_string, client_id, nonce, jwks_uri):
    """
    Complete ID token validation (OIDC Core §3.1.3.7)
    """
    try:
        # Get public key from JWKS
        public_key = get_key_from_jwks(jwks_uri, id_token_string)
        
        # Decode and verify signature
        claims = jwt.decode(
            id_token_string,
            public_key,
            algorithms=['RS256', 'ES256'],  # Never 'none'
            audience=client_id,
            issuer='https://auth.example.com',
            options={
                'verify_exp': True,
                'verify_iat': True,
                'verify_aud': True,
                'verify_iss': True
            }
        )
        
        # Validate nonce
        if nonce:
            if 'nonce' not in claims:
                raise ValueError("Missing nonce in ID token")
            
            if not hmac.compare_digest(claims['nonce'], nonce):
                raise ValueError("nonce mismatch")
        
        # Validate azp if present
        if 'azp' in claims:
            if claims['azp'] != client_id:
                raise ValueError("azp mismatch")
        
        return claims
        
    except JWTError as e:
        raise ValueError(f"Invalid ID token: {e}")
```

### 18.2 ID Token Usage

**Critical Distinction:**

```
ID Token: For AUTHENTICATION
├─ Contains user identity claims (sub, name, email)
├─ Purpose: Prove user authenticated
├─ Usage: Client verifies user identity
└─ NOT for API authorization

Access Token: For AUTHORIZATION
├─ Purpose: Authorize API calls
├─ Usage: Present to resource server
└─ Contains authorization info (scopes, permissions)

NEVER:
❌ Use ID token as access token
❌ Send ID token to resource server
❌ Use access token for authentication
```

### 18.3 UserInfo Endpoint

**Using UserInfo:**

```
Purpose: Get additional user claims

Flow:
1. Client has access token
2. Client calls UserInfo with access token
3. Authorization server returns user claims

Request:
GET /userinfo HTTP/1.1
Host: auth.example.com
Authorization: Bearer <access_token>

Response:
{
  "sub": "user123",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "email_verified": true
}
```

**Validation:**

```python
def get_user_info(access_token, id_token_sub):
    """
    Get user info and validate
    """
    # Call UserInfo endpoint
    response = requests.get(
        'https://auth.example.com/userinfo',
        headers={'Authorization': f'Bearer {access_token}'}
    )
    
    user_info = response.json()
    
    # CRITICAL: Validate sub matches ID token
    if user_info['sub'] != id_token_sub:
        raise SecurityError("sub mismatch between ID token and UserInfo")
    
    return user_info
```

---

## 19. Cryptographic Recommendations

### 19.1 Signature Algorithms

**Recommended Algorithms:**

| Algorithm | Type | Key Size | Use Case | Status |
|-----------|------|----------|----------|--------|
| **ES256** | ECDSA | P-256 (256-bit) | JWT signing, DPoP | ✅ RECOMMENDED |
| **RS256** | RSA | 2048+ bits | JWT signing | ✅ RECOMMENDED |
| **PS256** | RSA-PSS | 2048+ bits | JWT signing | ✅ RECOMMENDED |
| **HS256** | HMAC | 256+ bits | Internal services only | ⚠️ LIMITED USE |
| **none** | None | N/A | NEVER | ❌ PROHIBITED |

**Algorithm Selection:**

```
Prefer ES256 (ECDSA):
✓ Smaller keys (256 bits vs 2048 bits RSA)
✓ Faster signing and verification
✓ Modern, secure algorithm
✓ Good for mobile/embedded

Use RS256 (RSA) if:
✓ Existing infrastructure uses RSA
✓ Compatibility requirements
✓ Still secure with 2048+ bit keys

NEVER use:
❌ alg=none (no signature)
❌ HS256 for public APIs (shared secret)
❌ RS256 with <2048 bit keys
❌ Weak algorithms (MD5, SHA1)
```

**Enforcing Algorithm:**

```python
# ALWAYS specify allowed algorithms
claims = jwt.decode(
    token,
    public_key,
    algorithms=['ES256', 'RS256']  # Explicit allowlist
)

# NEVER:
claims = jwt.decode(token, public_key)  # No algorithm check!
```

### 19.2 Key Management

**Key Rotation:**

```
Signing Keys SHOULD be rotated:
├─ Regular schedule: Every 90-180 days
├─ After security incident
├─ When employee with key access leaves
└─ Proactively (before compromise)

Rotation Process:
1. Generate new key pair
2. Add new public key to JWKS endpoint
3. Start signing new tokens with new key
4. Keep old key in JWKS for validation (overlap period)
5. After all old tokens expired: Remove old key from JWKS
```

**JWKS Endpoint:**

```json
GET /.well-known/jwks.json

{
  "keys": [
    {
      "kty": "RSA",
      "kid": "2025-01",
      "use": "sig",
      "alg": "RS256",
      "n": "...",
      "e": "AQAB"
    },
    {
      "kty": "EC",
      "kid": "2025-02",
      "use": "sig",
      "alg": "ES256",
      "crv": "P-256",
      "x": "...",
      "y": "..."
    }
  ]
}
```

**Key ID (kid) Usage:**

```
JWT Header includes kid:
{
  "alg": "RS256",
  "kid": "2025-01",  ← Key identifier
  "typ": "JWT"
}

Verification:
1. Extract kid from JWT header
2. Look up public key in JWKS by kid
3. Verify signature with that key
4. If kid not found: Reject
```

### 19.3 Random Number Generation

**Requirements:**

```
Cryptographically Secure RNG REQUIRED for:
├─ state parameter (256 bits)
├─ nonce (256 bits)
├─ PKCE code_verifier (256+ bits)
├─ Authorization codes (128+ bits)
├─ Client secrets (256+ bits)
├─ Refresh tokens (128+ bits)
└─ Session IDs (128+ bits)
```

**Platform-Specific:**

```python
# Python
import secrets
state = secrets.token_urlsafe(32)  # 256 bits

# JavaScript (Browser)
const array = new Uint8Array(32);
crypto.getRandomValues(array);
const state = base64url(array);

# Java
import java.security.SecureRandom;
SecureRandom random = new SecureRandom();
byte[] bytes = new byte[32];
random.nextBytes(bytes);

# NEVER use:
❌ Math.random() (JavaScript) - Not cryptographically secure
❌ random.random() (Python) - Not cryptographically secure
❌ new Random() (Java) - Not cryptographically secure
```

---

## 20. Monitoring and Incident Response

### 20.1 Security Logging

**What to Log:**

```
✅ Authorization requests:
   - Timestamp
   - client_id
   - scope
   - redirect_uri (for validation failures)
   - IP address
   - User agent

✅ Authentication events:
   - Successful logins
   - Failed login attempts
   - MFA events

✅ Token operations:
   - Token issuance (client_id, user_id, timestamp)
   - Token refresh (success/failure)
   - Token revocation

✅ Security events:
   - PKCE validation failures
   - state validation failures
   - redirect_uri validation failures
   - Refresh token theft detection
   - Rate limit violations

✅ Administrative actions:
   - Client registration
   - Client configuration changes
   - User deletions

❌ NEVER log:
   - Access tokens
   - Refresh tokens
   - Authorization codes
   - Client secrets
   - User passwords
   - code_verifier
```

**Log Format (Example):**

```json
{
  "timestamp": "2025-12-08T21:30:00Z",
  "event_type": "authorization_request",
  "client_id": "abc123",
  "user_id": "user456",
  "scope": "openid profile",
  "result": "success",
  "ip_address": "192.0.2.1",
  "user_agent": "Mozilla/5.0...",
  "metadata": {
    "pkce_used": true,
    "state_validated": true
  }
}
```

### 20.2 Monitoring and Alerting

**Key Metrics:**

```
Track and alert on:

1. Failed Authentication Rate
   - Baseline: <1% failure rate
   - Alert if: >5% failures in 5 minutes
   - Indicates: Potential brute force attack

2. PKCE Validation Failures
   - Expected: 0 for public clients
   - Alert if: Any failures for public clients
   - Indicates: Misconfiguration or attack attempt

3. state Validation Failures
   - Expected: Very low (<0.1%)
   - Alert if: >1% failures
   - Indicates: CSRF attack attempts

4. redirect_uri Validation Failures
   - Expected: Low (<0.5%)
   - Alert if: >2% failures
   - Indicates: Open redirect attack attempts

5. Refresh Token Theft Detection
   - Expected: 0 detections
   - Alert if: Any detection
   - Action: Auto-revoke token family, notify user

6. Rate Limit Hits
   - Track: Clients hitting rate limits
   - Alert if: Same client repeatedly
   - Indicates: Abuse or misconfiguration

7. Unusual Access Patterns
   - Multiple clients from same IP
   - Rare scopes requested
   - Off-hours access (if unusual)
   - Geographic anomalies
```

**Alerting Rules (Example):**

```yaml
alerts:
  - name: high_failure_rate
    condition: auth_failures > 5% over 5min
    severity: high
    action: alert_security_team
    
  - name: pkce_missing
    condition: public_client without PKCE
    severity: critical
    action: block_request, alert_team
    
  - name: refresh_token_theft
    condition: old_refresh_token_used
    severity: critical
    action: revoke_family, notify_user, alert_team
    
  - name: suspicious_redirect
    condition: redirect_uri_validation_failure
    severity: medium
    action: log, alert_if_repeated
```

### 20.3 Incident Response

**Response Playbook:**

```
Incident: Suspected Token Theft

1. Detection
   ☐ Alert triggered (refresh token theft, unusual access, etc.)
   ☐ User report
   ☐ Security scan finding

2. Initial Response (within 15 minutes)
   ☐ Identify affected user(s)
   ☐ Identify affected client(s)
   ☐ Determine attack vector
   ☐ Assess scope of compromise

3. Containment (immediate)
   ☐ Revoke compromised tokens
   ☐ Revoke entire token family if refresh token theft
   ☐ Force user re-authentication
   ☐ Block malicious IPs (if identified)
   ☐ Disable compromised clients (if needed)

4. Investigation (within 1 hour)
   ☐ Review logs for attack timeline
   ☐ Identify all compromised accounts
   ☐ Determine data accessed
   ☐ Identify attack source

5. Communication (within 4 hours)
   ☐ Notify affected users
   ☐ Notify security team
   ☐ Notify legal/compliance (if required)
   ☐ Notify data protection officer (GDPR)

6. Remediation (within 24 hours)
   ☐ Fix vulnerability (if identified)
   ☐ Deploy patches
   ☐ Update security controls
   ☐ Force password resets (if needed)

7. Post-Incident (within 1 week)
   ☐ Incident report
   ☐ Root cause analysis
   ☐ Update response procedures
   ☐ Security training (if needed)
   ☐ Breach notification (if required by law)
```

**Token Revocation Procedure:**

```python
def emergency_token_revocation(user_id, reason):
    """
    Emergency token revocation procedure
    """
    # 1. Log incident
    log_security_incident({
        'type': 'emergency_revocation',
        'user_id': user_id,
        'reason': reason,
        'timestamp': current_time()
    })
    
    # 2. Revoke all tokens for user
    revoke_all_access_tokens(user_id)
    revoke_all_refresh_tokens(user_id)
    
    # 3. Invalidate sessions
    invalidate_all_sessions(user_id)
    
    # 4. Notify user
    send_security_notification(user_id, 
        "Your tokens have been revoked due to suspicious activity. "
        "Please log in again and change your password."
    )
    
    # 5. Alert security team
    alert_security_team({
        'user_id': user_id,
        'action': 'emergency_revocation',
        'reason': reason
    })
    
    # 6. Create audit trail
    create_audit_log({
        'action': 'token_revocation',
        'user_id': user_id,
        'reason': reason,
        'performed_by': 'system',
        'timestamp': current_time()
    })
```

---

## 21. Testing and Validation

### 21.1 Security Testing Checklist

**Authorization Server Testing:**

```
☐ PKCE Enforcement
  ☐ Public clients rejected without PKCE
  ☐ S256 method accepted
  ☐ Plain method rejected
  ☐ code_verifier validation correct
  ☐ Invalid code_verifier rejected

☐ state Parameter
  ☐ state required for all flows
  ☐ state validation enforced
  ☐ Invalid state rejected
  ☐ Replay of state rejected

☐ redirect_uri Validation
  ☐ Exact string matching enforced
  ☐ Prefix matching rejected
  ☐ Pattern matching rejected
  ☐ Wildcards rejected
  ☐ Invalid URI rejected without redirect
  ☐ HTTPS enforced (except localhost)

☐ Authorization Code Security
  ☐ Single-use enforced
  ☐ Expiration enforced (30-60 seconds)
  ☐ Bound to client_id
  ☐ Bound to redirect_uri
  ☐ Bound to PKCE challenge

☐ Token Issuance
  ☐ Short access token lifetime
  ☐ Refresh token rotation (public clients)
  ☐ Tokens properly signed
  ☐ Correct claims in tokens

☐ Rate Limiting
  ☐ Token endpoint rate limited
  ☐ Authorization endpoint rate limited
  ☐ Rate limits enforced per client_id

☐ Deprecated Flows
  ☐ Implicit flow disabled
  ☐ Password flow disabled
```

**Client Testing:**

```
☐ PKCE Implementation
  ☐ PKCE used for all authorization requests
  ☐ code_verifier properly generated (256+ bits)
  ☐ code_challenge correctly calculated (S256)
  ☐ code_verifier sent in token request

☐ state Parameter
  ☐ state generated properly (256+ bits)
  ☐ state validated on callback
  ☐ state single-use enforced
  ☐ Constant-time comparison used

☐ Token Storage
  ☐ SPAs: Tokens in memory only (NOT localStorage)
  ☐ Native apps: Tokens in Keychain/Keystore
  ☐ Backend: Tokens encrypted at rest

☐ Token Usage
  ☐ Access token in Authorization header
  ☐ NOT in query parameters
  ☐ Token refreshed when expired
  ☐ Refresh token rotation handled

☐ Security Controls
  ☐ TLS certificate validation
  ☐ HTTPS only (except localhost)
  ☐ XSS protections (CSP, sanitization)
```

### 21.2 Penetration Testing Scenarios

**Test Cases:**

```
1. Authorization Code Interception
   ☐ Attempt to use intercepted code without PKCE
   ☐ Expected: Rejected (PKCE validation fails)

2. CSRF Attack
   ☐ Craft authorization request without state
   ☐ Trick victim into using attacker's code
   ☐ Expected: Rejected (state validation fails)

3. Open Redirect
   ☐ Attempt to use malicious redirect_uri
   ☐ Try prefix attack: callback.evil.com
   ☐ Expected: Rejected (exact matching)

4. Token Theft
   ☐ Steal access token from localStorage
   ☐ Attempt to use stolen token
   ☐ Expected: Success (bearer token) OR
               Rejected (if DPoP/mTLS used)

5. Refresh Token Replay
   ☐ Use old refresh token after rotation
   ☐ Expected: Entire token family revoked

6. Code Replay
   ☐ Attempt to reuse authorization code
   ☐ Expected: Rejected (single-use)

7. PKCE Downgrade
   ☐ Send authorization request without PKCE
   ☐ Expected: Rejected for public clients

8. alg=none Attack
   ☐ Create JWT with alg=none
   ☐ Expected: Rejected (signature validation)
```

### 21.3 Automated Security Scanning

**Tools and Techniques:**

```
1. OWASP ZAP
   - Automated vulnerability scanning
   - Active and passive scanning
   - OAuth-specific tests

2. Burp Suite
   - Manual testing and automation
   - OAuth-specific extensions
   - Custom test sequences

3. Custom Test Suites
   - Pytest, Jest, JUnit tests
   - Test all security requirements
   - CI/CD integration

4. Fuzzing
   - Fuzz redirect_uri parameter
   - Fuzz token endpoints
   - Test boundary conditions

5. This Tool's Vulnerability Modes
   - Test implementations against vulnerable configurations
   - Verify mitigations work
   - Educational demonstrations
```

---

## 22. Common Security Pitfalls

### 22.1 Top 10 OAuth2 Security Mistakes

**Mistake #1: Using Implicit Flow**

```
❌ Problem:
- Tokens in URL fragment
- Exposed in browser history, referrer
- No refresh token
- Cannot use PKCE

✅ Fix:
- Use authorization code flow + PKCE
- Works for all client types including SPAs

Impact: HIGH - Token exposure, theft risk
Reference: Security BCP §2.1.2
```

**Mistake #2: Not Using PKCE for Public Clients**

```
❌ Problem:
- Authorization code can be intercepted
- Attacker can exchange code for tokens
- Complete account takeover

✅ Fix:
- MUST use PKCE for all public clients
- SHOULD use PKCE for confidential clients (defense in depth)

Impact: CRITICAL - Authorization code interception
Reference: Security BCP §2.1.1, OAuth 2.1
```

**Mistake #3: Not Validating state Parameter**

```
❌ Problem:
- CSRF attacks possible
- Attacker can trick victim into using attacker's authorization

✅ Fix:
- Generate random state (256 bits)
- Store in session
- Validate on callback
- Use constant-time comparison

Impact: HIGH - CSRF, account linking attacks
Reference: Security BCP §4.7
```

**Mistake #4: Using Prefix Matching for redirect_uri**

```
❌ Problem:
if requested_uri.startswith(registered_uri):  # WRONG!
    allow()

Attack: callback.evil.com passes check

✅ Fix:
if requested_uri == registered_uri:  # CORRECT
    allow()

Impact: CRITICAL - Open redirect, code theft
Reference: Security BCP §4.1.3
```

**Mistake #5: Storing Tokens in localStorage (SPAs)**

```
❌ Problem:
localStorage.setItem('token', token);  // XSS vulnerable
- XSS can read localStorage
- Token theft via cross-site scripting

✅ Fix:
- Store tokens in memory only (JavaScript variable)
- OR use Backend for Frontend (BFF) pattern

Impact: HIGH - XSS token theft
Reference: Security BCP §4.3.3
```

**Mistake #6: Using Long Token Lifetimes**

```
❌ Problem:
access_token_lifetime = 86400;  // 24 hours - TOO LONG

✅ Fix:
Public clients: 5-15 minutes
Confidential clients: 30-60 minutes

Impact: MEDIUM - Extended exposure window if stolen
Reference: Security BCP §4.3.1
```

**Mistake #7: Not Rotating Refresh Tokens**

```
❌ Problem:
- Refresh token reused indefinitely
- If stolen, attacker has persistent access
- No theft detection

✅ Fix:
- Rotate refresh tokens on each use
- Track token families
- Revoke family if old token used

Impact: HIGH - Persistent unauthorized access
Reference: Security BCP §4.13.2, OAuth 2.1
```

**Mistake #8: Accepting alg=none in JWTs**

```
❌ Problem:
# Vulnerable code
token = jwt.decode(token_string, verify=False)  # WRONG!

✅ Fix:
# Secure code
token = jwt.decode(
    token_string,
    public_key,
    algorithms=['RS256', 'ES256']  # Explicit allowlist
)

Impact: CRITICAL - Token forgery
Reference: RFC 7518 §3.1
```

**Mistake #9: Incomplete ID Token Validation**

```
❌ Problem:
- Not validating signature
- Not validating nonce
- Not validating iss, aud, exp

✅ Fix:
- Validate ALL claims per OIDC Core §3.1.3.7
- Verify signature
- Check nonce if sent
- Validate iss, aud, exp

Impact: HIGH - Authentication bypass
Reference: OIDC Core §3.1.3.7
```

**Mistake #10: Using Resource Owner Password Flow**

```
❌ Problem:
- User enters password into client app
- Client sees user's password
- Phishing opportunity
- Cannot do MFA
- Breaks OAuth delegation model

✅ Fix:
- Use authorization code flow
- User enters password at authorization server only

Impact: HIGH - Credential exposure, phishing
Reference: Security BCP §2.4, OAuth 2.1 (removed)
```

### 22.2 Pitfalls Summary Table

| Pitfall | Impact | Fix | Detection |
|---------|--------|-----|-----------|
| Implicit flow | HIGH | Use code flow + PKCE | Check response_type=token |
| No PKCE | CRITICAL | Implement PKCE | Check code_challenge absent |
| No state validation | HIGH | Validate state | Check state validation logic |
| Prefix matching | CRITICAL | Exact matching only | Test with .evil.com |
| localStorage | HIGH | Memory or BFF | Code review |
| Long lifetimes | MEDIUM | Shorter lifetimes | Check config |
| No rotation | HIGH | Rotate refresh tokens | Check rotation logic |
| alg=none | CRITICAL | Reject alg=none | Test with none algorithm |
| Incomplete ID token validation | HIGH | Full validation | Test validation code |
| Password flow | HIGH | Remove flow | Check supported flows |

---

## 23. OAuth 2.1 vs OAuth 2.0

### 23.1 Key Differences

**OAuth 2.1 Changes (Relative to OAuth 2.0):**

| Feature | OAuth 2.0 (RFC 6749) | OAuth 2.1 |
|---------|---------------------|-----------|
| **PKCE** | Optional | REQUIRED for authorization code flow |
| **Implicit Flow** | Allowed | REMOVED |
| **Password Flow** | Allowed | REMOVED |
| **Exact redirect_uri** | "Simple string comparison" | MUST use exact string matching |
| **Refresh Token Rotation** | Not specified | REQUIRED for public clients |
| **Bearer token in query** | Allowed | SHOULD NOT use |
| **state parameter** | RECOMMENDED | Effectively REQUIRED |

### 23.2 OAuth 2.1 Requirements Summary

**Authorization Code Flow:**
```
OAuth 2.1 REQUIRES:
├─ PKCE (code_challenge + code_verifier)
├─ Exact redirect_uri matching
├─ state parameter (CSRF protection)
└─ Refresh token rotation (public clients)

Effectively REQUIRES:
├─ HTTPS for all URIs (except localhost)
├─ Short token lifetimes
└─ Secure token storage
```

**Removed Flows:**
```
❌ Implicit Flow
   - response_type=token
   - Tokens in URL
   - Removed entirely from OAuth 2.1

❌ Resource Owner Password Credentials Flow
   - grant_type=password
   - Client sees user password
   - Removed entirely from OAuth 2.1
```

### 23.3 Migration from OAuth 2.0 to OAuth 2.1

**Migration Steps:**

```
1. Authorization Code Flow
   ☐ Add PKCE support
   ☐ Enforce PKCE for public clients
   ☐ Test PKCE implementation

2. redirect_uri Validation
   ☐ Change to exact string matching
   ☐ Remove pattern/prefix matching logic
   ☐ Test with attack URIs

3. Refresh Token Rotation
   ☐ Implement rotation for public clients
   ☐ Implement theft detection
   ☐ Test rotation logic

4. Deprecate Flows
   ☐ Disable implicit flow
   ☐ Disable password flow
   ☐ Notify affected clients
   ☐ Provide migration guide

5. Token Handling
   ☐ Discourage token in query parameters
   ☐ Update client libraries
   ☐ Update documentation

6. Testing
   ☐ Test all OAuth 2.1 requirements
   ☐ Security testing
   ☐ Regression testing
```

**Backward Compatibility:**

```
Challenges:
- Existing clients may not support PKCE
- Existing clients may use implicit flow
- Existing clients may use password flow

Migration Strategy:
1. Announce deprecation timeline (e.g., 12 months)
2. Support both OAuth 2.0 and 2.1 during transition
3. Gradually enforce OAuth 2.1 requirements
4. Provide migration documentation and support
5. Eventually require OAuth 2.1 for all clients
```

---

## 24. Compliance and Regulatory Considerations

### 24.1 Financial-Grade API (FAPI)

**FAPI Security Profile:**
```
Use Case: Financial services APIs (open banking)

Additional Requirements Beyond OAuth 2.1:
├─ MUST use mTLS or signed requests (DPoP/private_key_jwt)
├─ MUST use PKCE with S256
├─ MUST use OIDC
├─ MUST use signed authorization requests (JAR)
├─ MUST use short-lived access tokens (<10 min)
├─ MUST validate state and nonce
└─ MUST use JARM (JWT Authorization Response Mode)

Resources:
- OpenID FAPI 1.0 Part 1 and Part 2
- OpenID FAPI 2.0 (in development)
```

### 24.2 Healthcare (SMART on FHIR)

**SMART App Launch:**
```
Use Case: Healthcare applications accessing FHIR APIs

Requirements:
├─ OAuth 2.0 authorization code flow
├─ PKCE REQUIRED
├─ Patient-specific scopes (patient/*.read)
├─ Launch context parameters
├─ OIDC for authentication
└─ Considerations for PHI (HIPAA compliance)

Resources:
- SMART App Launch Framework
- HL7 FHIR Security Guidance
```

### 24.3 GDPR and Privacy

**Privacy Considerations:**

```
Data Minimization:
├─ Minimize claims in tokens
├─ Only request necessary scopes
├─ Limit token lifetime
└─ Don't store unnecessary user data

User Consent:
├─ Clear consent screen (scope descriptions)
├─ Allow users to review and revoke consent
├─ Log consent decisions
└─ Respect user data preferences

Data Retention:
├─ Define token retention policy
├─ Delete expired tokens
├─ Log retention policy
└─ Right to erasure (delete user data on request)

Cross-Border Data Transfer:
├─ Consider where tokens are stored
├─ Standard contractual clauses
└─ Adequacy decisions
```

### 24.4 PSD2 (European Banking)

**PSD2 Requirements:**
```
Strong Customer Authentication (SCA):
├─ Two-factor authentication required
├─ Dynamic linking for transactions
├─ 90-day re-authentication

API Security:
├─ Qualified certificates (eIDAS)
├─ mTLS required
├─ OAuth 2.0 for authorization
└─ FAPI-compatible

Resources:
- EBA RTS on SCA
- NextGenPSD2 Framework
```

---

## 25. Cross-References

**For Complete Implementation Details:**

| Topic | Document | Description |
|-------|----------|-------------|
| **Threat Model** | [oauth2-oidc-threat-model-INDEX.md](./oauth2-oidc-threat-model-INDEX.md) | Complete catalog of 35+ attacks |
| **PKCE** | [pkce-implementation.md](./pkce-implementation.md) | Complete PKCE specification |
| **State/CSRF** | [state-parameter-and-csrf.md](./state-parameter-and-csrf.md) | CSRF protection complete guide |
| **Redirect URI** | [redirect-uri-validation.md](./redirect-uri-validation.md) | Open redirect prevention |
| **Token Binding** | [token-binding-dpop-mtls.md](./token-binding-dpop-mtls.md) | DPoP and mTLS specifications |
| **Authorization Code Flow** | [authorization-code-flow-with-pkce.md](../flows/authorization-code-flow-with-pkce.md) | Recommended flow details |
| **Refresh Tokens** | [refresh-token-flow.md](../flows/refresh-token-flow.md) | Token renewal specification |
| **Access Tokens** | [access-tokens.md](../tokens/access-tokens.md) | Access token details |
| **ID Tokens** | [id-tokens-oidc.md](../tokens/id-tokens-oidc.md) | OIDC ID token validation |
| **JWT** | [jwt-structure-and-validation.md](../tokens/jwt-structure-and-validation.md) | JWT specification |

---

## 26. Summary Checklists by Role

### 26.1 Authorization Server Security Checklist

**Implementation Requirements:**

```
☐ Flow Support
  ☐ Authorization code flow implemented
  ☐ Client credentials flow implemented (if needed)
  ☐ Device flow implemented (if needed)
  ☐ Implicit flow DISABLED
  ☐ Password flow DISABLED

☐ PKCE
  ☐ PKCE enforced for ALL public clients
  ☐ PKCE recommended for confidential clients
  ☐ Only S256 method accepted (not plain)
  ☐ code_verifier validation implemented
  ☐ Proper error messages for PKCE failures

☐ redirect_uri Validation
  ☐ Exact string matching enforced
  ☐ No pattern matching, wildcards, or prefix matching
  ☐ HTTPS enforced (except localhost)
  ☐ Registered URIs validated during client registration
  ☐ Invalid redirect_uri rejected without redirect

☐ Authorization Code Security
  ☐ Single-use enforced (reject replay)
  ☐ Short lifetime (30-60 seconds)
  ☐ Bound to client_id
  ☐ Bound to redirect_uri
  ☐ Bound to PKCE code_challenge
  ☐ Cryptographically random (128+ bits)

☐ Token Issuance
  ☐ Short access token lifetime (public: 5-15 min, confidential: 30-60 min)
  ☐ Refresh token rotation for public clients
  ☐ Tokens properly signed (RS256/ES256)
  ☐ Correct claims in tokens (iss, aud, exp, sub)
  ☐ cnf claim for DPoP/mTLS tokens (if applicable)

☐ Security Controls
  ☐ TLS 1.2+ enforced on all endpoints
  ☐ HSTS enabled
  ☐ Rate limiting on token endpoint
  ☐ Rate limiting on authorization endpoint
  ☐ CORS properly configured
  ☐ Logging and monitoring implemented
  ☐ Incident response procedures documented

☐ Client Management
  ☐ Client registration validation
  ☐ Client authentication enforced (confidential clients)
  ☐ Client secrets strong (256+ bits)
  ☐ Support for asymmetric authentication (private_key_jwt)
  ☐ Client configuration auditing

☐ Testing
  ☐ Security testing completed
  ☐ Penetration testing performed
  ☐ Vulnerability scanning regular
  ☐ All MUST requirements verified
```

### 26.2 Client Application Security Checklist

**Public Client (SPA, Mobile) Checklist:**

```
☐ Flow Implementation
  ☐ Authorization code flow implemented
  ☐ PKCE implemented (REQUIRED)
  ☐ state parameter implemented (REQUIRED)
  ☐ NOT using implicit flow
  ☐ NOT using password flow

☐ PKCE Implementation
  ☐ code_verifier generated securely (256+ bits)
  ☐ code_challenge calculated correctly (SHA-256, S256 method)
  ☐ code_verifier stored securely (memory, not localStorage)
  ☐ code_verifier sent in token request

☐ state Parameter
  ☐ state generated securely (256+ bits)
  ☐ state stored in session
  ☐ state validated on callback
  ☐ Constant-time comparison used
  ☐ Single-use enforced

☐ Token Storage
  ☐ SPAs: Tokens in memory ONLY (NOT localStorage/sessionStorage)
  ☐ Native apps: Tokens in Keychain (iOS) or Keystore (Android)
  ☐ Desktop apps: Secure platform storage
  ☐ NO tokens in plain text files
  ☐ NO tokens in logs

☐ Token Usage
  ☐ Access token in Authorization header
  ☐ NOT in query parameters
  ☐ TLS (HTTPS) for all requests
  ☐ Token refreshed when expired
  ☐ Refresh token rotation handled correctly

☐ Security Controls
  ☐ TLS certificate validation
  ☐ HTTPS enforced (except localhost development)
  ☐ XSS protections (CSP, input sanitization)
  ☐ Native apps: System browser used (not WebView)
  ☐ Error handling doesn't leak sensitive info

☐ Testing
  ☐ Security testing performed
  ☐ PKCE tested
  ☐ state validation tested
  ☐ Token storage tested
  ☐ All MUST requirements verified
```

**Confidential Client (Backend) Checklist:**

```
☐ Flow Implementation
  ☐ Authorization code flow implemented
  ☐ Client credentials flow (if needed)
  ☐ PKCE recommended (defense in depth)
  ☐ state parameter implemented (REQUIRED)

☐ Client Authentication
  ☐ client_secret or private_key_jwt used
  ☐ Client secrets stored securely (encrypted, env vars, Vault)
  ☐ Client secrets rotated regularly (90 days)
  ☐ TLS enforced for all communications

☐ Token Management
  ☐ Tokens stored securely (encrypted database, HSM)
  ☐ Access tokens cached appropriately
  ☐ Refresh tokens handled securely
  ☐ Token expiration respected

☐ Session Management
  ☐ Server-side sessions used
  ☐ httpOnly, Secure cookies for session
  ☐ SameSite cookie attribute set
  ☐ Session expiration enforced
  ☐ Logout implemented properly

☐ Security Controls
  ☐ HTTPS enforced everywhere
  ☐ CORS configured properly
  ☐ Rate limiting implemented
  ☐ Input validation on all endpoints
  ☐ Output encoding for XSS prevention
  ☐ Logging and monitoring
```

### 26.3 Resource Server Security Checklist

**Token Validation Requirements:**

```
☐ Access Token Validation
  ☐ Validate on EVERY request (no caching without expiration check)
  ☐ Verify JWT signature (if JWT)
  ☐ OR call introspection endpoint (if opaque)
  ☐ Validate exp claim (not expired)
  ☐ Validate nbf claim (time has come)
  ☐ Validate iss claim (expected issuer)
  ☐ Validate aud claim (this resource server)

☐ Scope Enforcement
  ☐ Check token contains required scope
  ☐ Implement fine-grained scopes
  ☐ Deny access if insufficient scope
  ☐ Log scope violations

☐ Security Controls
  ☐ TLS enforced for all endpoints
  ☐ CORS configured properly (restrict origins)
  ☐ Rate limiting implemented
  ☐ Generic error messages (don't leak info)
  ☐ WWW-Authenticate header on 401 errors

☐ Sender-Constrained Tokens (if applicable)
  ☐ Validate DPoP proof (if DPoP)
  ☐ Validate certificate binding (if mTLS)
  ☐ Check cnf claim in token
  ☐ Verify binding to presented proof/certificate

☐ Monitoring
  ☐ Log all token validation failures
  ☐ Monitor for unusual patterns
  ☐ Alert on repeated failures
  ☐ Track API usage metrics
```

### 26.4 Security Auditor Checklist

**Audit Points:**

```
☐ Architecture Review
  ☐ Client types identified correctly
  ☐ Appropriate flows used
  ☐ Deprecated flows not used (implicit, password)
  ☐ Security controls documented

☐ Authorization Server Audit
  ☐ PKCE enforced for public clients
  ☐ Exact redirect_uri matching
  ☐ Short authorization code lifetime
  ☐ Short access token lifetime
  ☐ Refresh token rotation (public clients)
  ☐ Rate limiting implemented
  ☐ Logging and monitoring
  ☐ TLS 1.2+ enforced

☐ Client Application Audit
  ☐ PKCE implemented (public clients)
  ☐ state validation implemented
  ☐ Secure token storage (NOT localStorage for SPAs)
  ☐ Tokens in Authorization header (not query)
  ☐ HTTPS enforced
  ☐ Error handling secure

☐ Resource Server Audit
  ☐ Token validation on every request
  ☐ Scope enforcement implemented
  ☐ Proper error responses
  ☐ CORS configured correctly

☐ Security Testing
  ☐ Penetration testing performed
  ☐ Common vulnerabilities tested
  ☐ All MUST requirements verified
  ☐ SHOULD requirements documented if not implemented

☐ Compliance
  ☐ Regulatory requirements met (if applicable)
  ☐ Privacy considerations addressed
  ☐ Data retention policies defined
  ☐ Incident response procedures documented
```

---

## Conclusion

**OAuth 2.0 Security Best Current Practice Summary:**

This document consolidates the most important security guidance for OAuth2 and OpenID Connect implementations. The key takeaways:

1. **Use Authorization Code Flow + PKCE** for all clients
2. **Exact redirect_uri matching** prevents open redirect attacks
3. **state parameter** prevents CSRF attacks
4. **Short token lifetimes** limit exposure
5. **Refresh token rotation** detects theft
6. **Secure token storage** prevents XSS theft
7. **Proper validation** at every layer
8. **Defense in depth** - multiple security layers
9. **Avoid deprecated flows** (implicit, password)
10. **Monitor and respond** to security events

**Security is Not Optional:**

OAuth2 security requirements (especially MUST requirements) are not suggestions. They are lessons learned from real-world attacks and breaches. Implementing these requirements properly prevents the vast majority of OAuth2-related security incidents.

**Continuous Improvement:**

Security is an ongoing process:
- Stay updated on new vulnerabilities
- Update libraries and dependencies
- Regular security testing
- Monitor security advisories
- Learn from incidents (yours and others')

**Resources:**

- OAuth 2.0 Security BCP: https://datatracker.ietf.org/doc/draft-ietf-oauth-security-topics/
- OAuth 2.1: https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/
- RFC 8252 (Native Apps): https://www.rfc-editor.org/rfc/rfc8252
- RFC 9449 (DPoP): https://www.rfc-editor.org/rfc/rfc9449
- RFC 8705 (mTLS): https://www.rfc-editor.org/rfc/rfc8705
- OpenID Connect: https://openid.net/specs/openid-connect-core-1_0.html

**Final Words:**

> *"In the battle between security and convenience, convenience almost always wins in the short term. But in the long term, the lack of security becomes very inconvenient indeed—usually right around the time you're explaining to regulators why your users' data is being sold on the dark web. Choose security. Future you will thank present you."*

---

**End of OAuth 2.0 Security Best Current Practice**

**Total Coverage: 26 comprehensive sections across 3 parts**
**Total Content: ~300,000+ characters of authoritative security guidance**

*May your tokens be short-lived, your PKCE always present, and your redirect URIs forever exactly matched.*
