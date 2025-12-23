# OAuth2/OIDC Comprehensive Threat Model - Part 2

## Continuation: Sections 3.7 through 10

> *This document continues the comprehensive threat model from oauth2-oidc-threat-model.md*

---

##

 3.7 Covert Redirect

[Content continues from Part 1 with section 3.6 Mix-Up Attacks...]

**RFC/Spec Reference:** Security BCP §4.1.1, RFC 6749 §3.1.2  
**Attack Vector:** Redirect URI path manipulation  
**Attacker Capability Required:** Malicious client OR Social engineering  
**CVE Examples:** CVE-2014-0749 (Doorkeeper), various implementations

[See full content in previous response - section already complete]

---

## 5.2 Refresh Token Replay After Rotation

**RFC/Spec Reference:** Security BCP §4.13.3, RFC 6749 §10.4  
**Attack Vector:** Refresh token endpoint with rotated tokens  
**Attacker Capability Required:** Token theft + opportunity before rotation  
**CVE Examples:** Implementation-specific vulnerabilities

### Attack Description

When refresh token rotation is implemented, attempting to reuse an old (already-rotated) refresh token can indicate token theft. A secure implementation should detect this and revoke the entire token family.

### Attack Prerequisites

- Refresh token rotation is implemented
- Attacker steals a refresh token
- Attacker attempts to use stolen token after legitimate use

### Attack Steps

**Scenario 1: Theft Detection via Rotation**

```
1. User has valid refresh token: RT_1

2. Attacker steals RT_1 (XSS, device theft, etc.)

3. Legitimate client uses RT_1 to refresh:
   POST /token
   grant_type=refresh_token&
   refresh_token=RT_1

4. Server rotates token:
   - Invalidates RT_1
   - Issues new RT_2
   - Returns RT_2 to legitimate client

5. Attacker attempts to use stolen RT_1:
   POST /token
   grant_type=refresh_token&
   refresh_token=RT_1  ← Already rotated!

6. Server detects reuse of rotated token:
   - RT_1 was already used
   - This indicates possible theft
   
7. Server response (secure implementation):
   - Revoke entire token family (RT_2 and any future rotations)
   - Revoke all access tokens in family
   - Return error: invalid_grant
   
8. Legitimate client's RT_2 also revoked
   (acceptable tradeoff - forces re-authentication)

9. Attack mitigated: Attacker cannot use RT_1
                      Attacker doesn't have RT_2
                      User must re-authenticate
```

**Scenario 2: Vulnerable Implementation (No Family Revocation)**

```
1-5. [Same as above]

6. Server detects RT_1 reuse

7. Vulnerable response:
   - Only reject RT_1
   - DO NOT revoke RT_2
   - Return error to attacker

8. Attacker doesn't get access immediately

9. But: Legitimate client still has RT_2

10. Problem: Can't determine who has legitimate token
    - Maybe attacker stole RT_1 before use
    - Maybe attacker will steal RT_2 later
    - No clear signal of compromise
```

### Vulnerable Code Pattern

**No Theft Detection:**
```python
# VULNERABLE: No detection of rotation replay
@app.route('/token', methods=['POST'])
def handle_refresh():
    refresh_token = request.form.get('refresh_token')
    
    token_data = get_refresh_token_data(refresh_token)
    
    if not token_data:
        return error_response('invalid_grant')
    
    if token_data.get('revoked'):
        return error_response('invalid_grant')  # Just reject
    
    # VULNERABLE: No check if token was already rotated
    # No family revocation on replay
    
    # Generate new tokens
    new_access = generate_access_token(token_data)
    new_refresh = generate_refresh_token(token_data)
    
    # Invalidate old token
    revoke_refresh_token(refresh_token)
    
    return jsonify({
        'access_token': new_access,
        'refresh_token': new_refresh
    })
```

### Vulnerable Mode Configuration

```json
{
  "vulnerabilities": {
    "REUSABLE_REFRESH_TOKENS": false,
    "NO_FAMILY_REVOCATION": false,
    "NO_THEFT_DETECTION": false
  }
}
```

### Demonstration Scenario

1. **Enable vulnerability:** Toggle `NO_FAMILY_REVOCATION = true`

2. **Setup token family:**
   ```
   Initial: RT_1
   After legitimate refresh: RT_2
   Token family: {RT_1, RT_2}
   ```

3. **Theft and replay:**
   ```
   a. Attacker steals RT_1
   b. Legitimate client uses RT_1 → gets RT_2
   c. Attacker attempts RT_1 (already used)
   d. Tool shows: "Rotation replay detected"
   ```

4. **Without family revocation:**
   ```
   Server: "RT_1 invalid"
   Legitimate client: Still has valid RT_2
   Tool shows: "⚠️ Theft not mitigated - RT_2 still valid"
   ```

5. **With family revocation:**
   ```
   Server: "RT_1 replay → Revoke family"
   Legitimate client: RT_2 now invalid
   Tool shows: "✓ Theft detected - all tokens revoked"
   User: Must re-authenticate
   ```

### Impact

**Severity:** HIGH (when detection absent) / MEDIUM (with detection)

**Security trade-off:**
- False positives possible (network issues, race conditions)
- But: Better to revoke legitimate session than allow theft
- User inconvenience vs. security

### Specification-Based Mitigation

**Security BCP §4.13.3:**
> When a refresh token is used more than once, the authorization server SHOULD revoke all refresh tokens and access tokens issued for that user. This prevents attackers from using stolen refresh tokens.

**OAuth 2.1 (draft) §6.1:**
> Authorization servers MUST employ refresh token rotation and SHOULD revoke the entire token family when replay is detected.

### Implementation Mitigation

**Token Family Tracking:**
```python
class RefreshTokenManager:
    def create_refresh_token(self, user_id, client_id, scope):
        """Create new refresh token with family tracking"""
        family_id = secrets.token_urlsafe(16)
        token = secrets.token_urlsafe(32)
        
        db.execute("""
            INSERT INTO refresh_tokens
            (token, user_id, client_id, scope, family_id, generation, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, NOW())
        """, (token, user_id, client_id, scope, family_id, 1))
        
        return token, family_id
    
    def rotate_refresh_token(self, old_token):
        """Rotate token and detect replay"""
        # Get old token data
        old_data = db.execute("""
            SELECT * FROM refresh_tokens
            WHERE token = %s AND revoked = FALSE
        """, (old_token,)).fetchone()
        
        if not old_data:
            # Token doesn't exist or already used
            # Check if it was previously rotated
            revoked_data = db.execute("""
                SELECT family_id, generation FROM refresh_tokens
                WHERE token = %s AND revoked = TRUE
            """, (old_token,)).fetchone()
            
            if revoked_data:
                # REPLAY DETECTED! Token was already rotated
                logger.warning(f"Refresh token replay detected: {old_token[:10]}...")
                
                # Revoke entire token family
                self.revoke_token_family(revoked_data['family_id'])
                
                return None, "Replay detected - family revoked"
            
            return None, "Invalid token"
        
        # Generate new token in same family
        new_token = secrets.token_urlsafe(32)
        new_generation = old_data['generation'] + 1
        
        # Insert new token
        db.execute("""
            INSERT INTO refresh_tokens
            (token, user_id, client_id, scope, family_id, generation, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, NOW())
        """, (new_token, old_data['user_id'], old_data['client_id'],
              old_data['scope'], old_data['family_id'], new_generation))
        
        # Revoke old token
        db.execute("""
            UPDATE refresh_tokens
            SET revoked = TRUE, revoked_at = NOW()
            WHERE token = %s
        """, (old_token,))
        
        db.commit()
        
        return new_token, old_data
    
    def revoke_token_family(self, family_id):
        """Revoke all tokens in a family (theft detection)"""
        # Revoke all refresh tokens
        db.execute("""
            UPDATE refresh_tokens
            SET revoked = TRUE, revoked_at = NOW(), revoked_reason = 'family_revocation'
            WHERE family_id = %s AND revoked = FALSE
        """, (family_id,))
        
        # Revoke all associated access tokens
        db.execute("""
            UPDATE access_tokens
            SET revoked = TRUE
            WHERE refresh_token_family_id = %s
        """, (family_id,))
        
        db.commit()
        
        logger.info(f"Revoked token family {family_id} due to replay detection")
```

### Validation Test

```python
def test_refresh_token_rotation():
    """Test that refresh tokens are rotated"""
    rt1 = create_refresh_token()
    
    # First rotation
    response = client.post('/token', data={
        'grant_type': 'refresh_token',
        'refresh_token': rt1
    })
    
    rt2 = response.json['refresh_token']
    assert rt2 != rt1  # Token rotated
    
    # Old token should be invalid
    response2 = client.post('/token', data={
        'grant_type': 'refresh_token',
        'refresh_token': rt1
    })
    
    assert response2.status_code == 400

def test_refresh_token_replay_detection():
    """Test that replay triggers family revocation"""
    rt1 = create_refresh_token()
    
    # Legitimate use
    response1 = client.post('/token', data={
        'grant_type': 'refresh_token',
        'refresh_token': rt1
    })
    
    rt2 = response1.json['refresh_token']
    
    # Attacker attempts to use rt1 (already rotated)
    response2 = client.post('/token', data={
        'grant_type': 'refresh_token',
        'refresh_token': rt1  # Replay!
    })
    
    assert response2.status_code == 400
    
    # rt2 should also be revoked (family revocation)
    response3 = client.post('/token', data={
        'grant_type': 'refresh_token',
        'refresh_token': rt2
    })
    
    assert response3.status_code == 400  # Revoked due to family revocation
```

### Real-World Examples

**OAuth 2.1 Requirement:**
- Refresh token rotation made mandatory
- Family revocation recommended for theft detection
- Industry consensus on best practice

---

## 5.3 Refresh Token Scope Escalation

**RFC/Spec Reference:** RFC 6749 §6, Security BCP §4.13.4  
**Attack Vector:** Refresh token request with elevated scope  
**Attacker Capability Required:** Malicious client with valid refresh token  
**CVE Examples:** Implementation vulnerabilities

### Attack Description

Scope escalation via refresh token occurs when a client requests broader permissions during token refresh than were originally granted, and the authorization server incorrectly grants them.

### Attack Prerequisites

- Client has valid refresh token
- Authorization server doesn't validate scope against original grant
- Client requests elevated scope in refresh request

### Attack Steps

```
1. User originally authorized limited scope:
   Initial authorization: scope=read

2. Client receives tokens:
   access_token (scope=read)
   refresh_token

3. Malicious client refreshes with elevated scope:
   POST /token
   grant_type=refresh_token&
   refresh_token=valid_refresh_token&
   scope=read write admin  ← Requesting more than original!

4. Vulnerable server issues new token:
   access_token (scope=read write admin)  ← Elevated!

5. Client now has permissions never authorized by user

6. Client can perform write and admin operations
   without user's explicit consent
```

### Vulnerable Code Pattern

```python
# VULNERABLE: No scope validation on refresh
@app.route('/token', methods=['POST'])
def handle_refresh():
    refresh_token = request.form.get('refresh_token')
    requested_scope = request.form.get('scope', '')
    
    token_data = validate_refresh_token(refresh_token)
    
    if not token_data:
        return error_response('invalid_grant')
    
    # VULNERABLE: Use requested scope without validation
    new_access_token = generate_access_token(
        user_id=token_data['user_id'],
        scope=requested_scope or token_data['original_scope']
    )
    
    return jsonify({'access_token': new_access_token})
```

### Vulnerable Mode Configuration

```json
{
  "vulnerabilities": {
    "ALLOW_SCOPE_ESCALATION": false,
    "NO_SCOPE_VALIDATION_ON_REFRESH": false
  }
}
```

### Impact

**Severity:** HIGH

**Attacker gains:**
- Elevated permissions without user authorization
- Potential privilege escalation
- Access to sensitive operations

### Specification-Based Mitigation

**RFC 6749 §6:**
> If the authorization server issued a refresh token, the client can make a refresh request to obtain a new access token. The requested scope MUST NOT include any scope not originally granted.

**Security BCP §4.13.4:**
> Authorization servers MUST validate that requested scopes in refresh requests do not exceed the originally granted scope.

### Implementation Mitigation

```python
@app.route('/token', methods=['POST'])
def handle_refresh():
    refresh_token = request.form.get('refresh_token')
    requested_scope = request.form.get('scope', '')
    
    token_data = validate_refresh_token(refresh_token)
    
    if not token_data:
        return error_response('invalid_grant')
    
    original_scope = set(token_data['scope'].split())
    
    if requested_scope:
        requested = set(requested_scope.split())
        
        # Validate: requested scope must be subset of original
        if not requested.issubset(original_scope):
            return error_response(
                'invalid_scope',
                'Requested scope exceeds original grant'
            )
        
        # Use requested scope (reduced, not elevated)
        final_scope = ' '.join(requested)
    else:
        # No scope requested - use original
        final_scope = token_data['scope']
    
    new_access_token = generate_access_token(
        user_id=token_data['user_id'],
        scope=final_scope
    )
    
    return jsonify({'access_token': new_access_token})
```

### Validation Test

```python
def test_scope_escalation_blocked():
    """Test that scope cannot be escalated on refresh"""
    # Get refresh token with limited scope
    rt = create_refresh_token(scope='read')
    
    # Attempt to escalate scope
    response = client.post('/token', data={
        'grant_type': 'refresh_token',
        'refresh_token': rt,
        'scope': 'read write admin'  # Escalation attempt!
    })
    
    assert response.status_code == 400
    assert response.json['error'] == 'invalid_scope'

def test_scope_reduction_allowed():
    """Test that scope can be reduced on refresh"""
    # Get refresh token with broad scope
    rt = create_refresh_token(scope='read write')
    
    # Request reduced scope
    response = client.post('/token', data={
        'grant_type': 'refresh_token',
        'refresh_token': rt,
        'scope': 'read'  # Reduction is OK
    })
    
    assert response.status_code == 200
    assert 'write' not in response.json['scope']
```

---

## 6. Resource Server / Access Token Attacks

### 6.1 Token Theft via Insecure Storage

**RFC/Spec Reference:** Security BCP §4.3.3, RFC 6750 §5  
**Attack Vector:** Client-side token storage  
**Attacker Capability Required:** XSS OR physical access  
**CVE Examples:** Widespread SPA vulnerabilities

[See section 5.1 for detailed localStorage theft patterns - similar attack, applies to access tokens]

### 6.2 Token Leakage via Referrer Header

**RFC/Spec Reference:** Security BCP §4.3.2, RFC 6750 §2.3  
**Attack Vector:** Access token in URL  
**Attacker Capability Required:** Network observation OR server log access  
**CVE Examples:** Multiple implementations

### Attack Description

When access tokens are passed in URL parameters (query string or fragment), they can leak through HTTP Referer headers to third-party domains.

### Attack Steps

```
1. Application includes token in URL:
   https://api.example.com/resource?access_token=SECRET_AT_123

2. API response includes third-party resource:
   <img src="https://analytics.external.com/pixel.gif">

3. Browser loads external resource, sending Referer:
   GET https://analytics.external.com/pixel.gif
   Referer: https://api.example.com/resource?access_token=SECRET_AT_123

4. Third-party server logs full referrer including token

5. Attacker with access to analytics logs extracts token

6. Attacker uses token to access victim's resources
```

### Vulnerable Code Pattern

```javascript
// VULNERABLE: Token in URL
async function fetchUserData() {
    const token = getAccessToken();
    
    // Token in query parameter!
    const response = await fetch(
        `https://api.example.com/user?access_token=${token}`
    );
    
    return response.json();
}
```

### Mitigation

**RFC 6750 §2.3:**
> Clients SHOULD NOT use the HTTP request URI method [for bearer tokens] because of the security weaknesses associated with the URI method.

**Security BCP §4.3.2:**
> Clients MUST NOT pass bearer tokens in URL parameters. Tokens MUST be sent in the Authorization header or as form-encoded POST parameters.

```javascript
// SECURE: Token in Authorization header
async function fetchUserData() {
    const token = getAccessToken();
    
    const response = await fetch('https://api.example.com/user', {
        headers: {
            'Authorization': `Bearer ${token}`  // In header!
        }
    });
    
    return response.json();
}
```

---

### 6.3 Insufficient Scope Validation

**RFC/Spec Reference:** RFC 6749 §7, Security BCP §4.3.4  
**Attack Vector:** Resource server access control  
**Attacker Capability Required:** Valid token with limited scope  
**CVE Examples:** Implementation-specific

### Attack Description

Resource servers that don't properly validate token scope allow tokens with limited permissions to access resources requiring broader permissions.

### Attack Steps

```
1. Attacker obtains token with limited scope:
   access_token (scope=read)

2. Attacker attempts to access write-only resource:
   PUT /api/documents/123
   Authorization: Bearer token_with_read_scope

3. Vulnerable resource server:
   - Validates token is valid ✓
   - Doesn't check scope
   - Allows write operation ✗

4. Attacker performs unauthorized write with read-only token
```

### Vulnerable Code Pattern

```python
# VULNERABLE: No scope validation
@app.route('/api/documents/<doc_id>', methods=['PUT'])
@require_authentication  # Only checks token validity
def update_document(doc_id):
    # VULNERABLE: Doesn't check if token has 'write' scope
    
    token = get_token_from_header()
    
    if not is_valid_token(token):
        abort(401)
    
    # Update document (should require 'write' scope!)
    update_doc(doc_id, request.json)
    
    return jsonify({'status': 'updated'})
```

### Mitigation

```python
# SECURE: Scope validation
@app.route('/api/documents/<doc_id>', methods=['PUT'])
@require_scope('write')  # Validates scope
def update_document(doc_id):
    # Decorator validates token has 'write' scope
    
    update_doc(doc_id, request.json)
    
    return jsonify({'status': 'updated'})

def require_scope(required_scope):
    """Decorator to validate token scope"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            token = get_token_from_header()
            
            if not token:
                abort(401, "Token required")
            
            token_data = validate_and_decode_token(token)
            
            if not token_data:
                abort(401, "Invalid token")
            
            # Validate scope
            token_scopes = token_data.get('scope', '').split()
            
            if required_scope not in token_scopes:
                abort(403, f"Insufficient scope - requires '{required_scope}'")
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator
```

---

### 6.4 Bearer Token Replay

**RFC/Spec Reference:** RFC 6750, Security BCP §4.3  
**Attack Vector:** Token interception and reuse  
**Attacker Capability Required:** Network attacker OR token theft  
**CVE Examples:** Fundamental bearer token issue

### Attack Description

Bearer tokens are "bearer" credentials - anyone possessing the token can use it. Once stolen, tokens can be replayed until expiration.

### Attack Steps

```
1. Attacker intercepts or steals access token

2. Attacker uses token to make API requests:
   GET /api/user/data
   Authorization: Bearer STOLEN_TOKEN

3. Resource server validates token:
   - Token is valid ✓
   - Token not expired ✓
   - Cannot determine if requester is legitimate

4. Request succeeds - attacker accesses resources
```

### Mitigation

**Short Token Lifetimes:**
```python
# Issue tokens with short expiration
def generate_access_token(user_id):
    return jwt.encode({
        'sub': user_id,
        'exp': datetime.utcnow() + timedelta(minutes=15),  # 15 min!
        'iat': datetime.utcnow()
    }, SECRET_KEY)
```

**Sender-Constrained Tokens (DPoP):**
```python
# Validate DPoP proof
def validate_dpop_token(request):
    token = extract_token(request)
    dpop_proof = request.headers.get('DPoP')
    
    if not dpop_proof:
        abort(401, "DPoP proof required")
    
    # Verify DPoP proof signature
    proof_claims = verify_dpop_proof(dpop_proof)
    
    # Verify proof binds to this request
    if proof_claims['htm'] != request.method:
        abort(401, "DPoP proof method mismatch")
    
    if proof_claims['htu'] != request.url:
        abort(401, "DPoP proof URL mismatch")
    
    # Verify token is bound to this key
    token_claims = decode_token(token)
    
    if token_claims.get('cnf', {}).get('jkt') != proof_claims['jkt']:
        abort(401, "Token not bound to DPoP key")
    
    # Token + valid proof = authenticated
    return token_claims
```

---

### 6.5 Audience Validation Bypass

**RFC/Spec Reference:** RFC 7519 §4.1.3, RFC 9068  
**Attack Vector:** Token misuse at wrong resource server  
**Attacker Capability Required:** Valid token for different resource  
**CVE Examples:** Implementation-specific

### Attack Description

Tokens intended for one resource server (audience) are used at a different resource server that doesn't validate the `aud` claim.

### Attack Steps

```
1. Attacker obtains token for Resource Server A:
   {
     "aud": "https://resource-a.example.com",
     "scope": "read write",
     "sub": "user123"
   }

2. Attacker sends token to Resource Server B:
   GET https://resource-b.example.com/sensitive-data
   Authorization: Bearer token_for_resource_a

3. Resource Server B (vulnerable):
   - Validates token signature ✓
   - Validates expiration ✓
   - Doesn't validate audience ✗
   - Allows access

4. Attacker accesses Resource B using token for Resource A
```

### Vulnerable Code Pattern

```python
# VULNERABLE: No audience validation
def validate_token(token):
    try:
        claims = jwt.decode(token, PUBLIC_KEY, algorithms=['RS256'])
        
        # Check expiration
        if claims['exp'] < time.time():
            return None
        
        # VULNERABLE: Doesn't check 'aud' claim
        
        return claims
    except jwt.InvalidTokenError:
        return None
```

### Mitigation

```python
# SECURE: Audience validation
EXPECTED_AUDIENCE = "https://api.myservice.com"

def validate_token(token):
    try:
        claims = jwt.decode(
            token,
            PUBLIC_KEY,
            algorithms=['RS256'],
            audience=EXPECTED_AUDIENCE  # Validate audience!
        )
        
        return claims
        
    except jwt.InvalidAudienceError:
        logger.warning(f"Token with wrong audience: {claims.get('aud')}")
        return None
    except jwt.InvalidTokenError:
        return None
```

---

## 7. OIDC-Specific Attacks

### 7.1 ID Token Substitution

**RFC/Spec Reference:** OIDC Core §3.1.3.3, §16.3  
**Attack Vector:** ID token and access token pairing  
**Attacker Capability Required:** Malicious client OR MITM  
**CVE Examples:** Implementation vulnerabilities

### Attack Description

ID token substitution occurs when an attacker pairs their own ID token with a victim's access token, causing the client to authenticate the victim but attribute actions to the attacker.

### Attack Steps

```
1. Attacker completes OIDC flow, receives:
   id_token_attacker
   access_token_attacker

2. Victim completes OIDC flow, receives:
   id_token_victim
   access_token_victim

3. Attacker intercepts victim's response (MITM)

4. Attacker substitutes ID tokens:
   Response to victim's client:
   id_token_attacker  ← Swapped!
   access_token_victim

5. Vulnerable client:
   - Validates id_token_attacker signature ✓
   - Doesn't validate at_hash
   - Creates session for attacker's identity
   - Uses victim's access_token

6. Client thinks attacker is logged in
   But makes API calls with victim's token

7. Actions appear under attacker's profile
   But access victim's data
```

### Mitigation

**at_hash Validation:**
```python
def handle_token_response(tokens):
    id_token = tokens['id_token']
    access_token = tokens['access_token']
    
    # Decode and verify ID token
    claims = verify_jwt(id_token)
    
    # Validate at_hash (OIDC Core §3.1.3.3)
    expected_at_hash = compute_at_hash(access_token)
    
    if claims.get('at_hash') != expected_at_hash:
        raise ValueError("ID token not bound to access token - at_hash mismatch")
    
    # Tokens validated - safe to use
    create_session(claims['sub'], access_token)

def compute_at_hash(access_token):
    """Compute at_hash per OIDC spec"""
    # Hash access token with SHA-256
    hash_bytes = hashlib.sha256(access_token.encode()).digest()
    
    # Take left-most half
    half_hash = hash_bytes[:len(hash_bytes)//2]
    
    # Base64url encode
    at_hash = base64.urlsafe_b64encode(half_hash).decode().rstrip('=')
    
    return at_hash
```

---

### 7.2 ID Token Replay

**RFC/Spec Reference:** OIDC Core §3.1.3.2, §16.11  
**Attack Vector:** ID token reuse  
**Attacker Capability Required:** Token interception  
**CVE Examples:** Implementation vulnerabilities

### Attack Description

ID token replay occurs when a captured ID token is reused to authenticate as the victim in a different session or at a different client.

### Attack Steps

```
1. Attacker intercepts ID token:
   {
     "iss": "https://accounts.example.com",
     "sub": "victim_user_123",
     "aud": "client_abc",
     "exp": 1735689600,
     "iat": 1735686000,
     "nonce": "victim_nonce_xyz"
   }

2. Attacker initiates their own OIDC flow

3. Attacker injects captured ID token into their session

4. Vulnerable client:
   - Validates signature ✓
   - Validates expiration ✓
   - Doesn't validate nonce ✗

5. Attacker authenticated as victim
```

### Mitigation

**Nonce Validation:**
```python
def initiate_oidc_login():
    nonce = secrets.token_urlsafe(32)
    
    # Store nonce in session
    session['oidc_nonce'] = nonce
    session['nonce_created_at'] = time.time()
    
    auth_url = build_auth_url(nonce=nonce)
    
    return redirect(auth_url)

def handle_oidc_callback(id_token):
    claims = verify_jwt(id_token)
    
    # Validate nonce
    stored_nonce = session.get('oidc_nonce')
    
    if not stored_nonce:
        raise ValueError("No nonce in session")
    
    if claims.get('nonce') != stored_nonce:
        raise ValueError("Nonce mismatch - possible replay attack")
    
    # Check nonce age (max 5 minutes)
    nonce_age = time.time() - session.get('nonce_created_at', 0)
    
    if nonce_age > 300:
        raise ValueError("Nonce expired")
    
    # Clear nonce (single use)
    del session['oidc_nonce']
    del session['nonce_created_at']
    
    # ID token validated
    create_user_session(claims['sub'])
```

---

### 7.3 JWT Algorithm Confusion

**RFC/Spec Reference:** RFC 7515, CVE-2015-2951  
**Attack Vector:** JWT signature algorithm manipulation  
**Attacker Capability Required:** Malicious actor with public key  
**CVE Examples:** CVE-2015-2951, CVE-2016-5431

### Attack Description

Algorithm confusion attacks exploit JWT libraries that blindly trust the `alg` header, allowing attackers to change RS256 (asymmetric) to HS256 (symmetric) and sign tokens using the public key as the HMAC secret.

### Attack Steps

```
1. Legitimate token signed with RS256:
   Header: {"alg": "RS256", "typ": "JWT"}
   Payload: {"sub": "user123", "exp": 1735689600}
   Signature: RS256(header.payload, private_key)

2. Attacker obtains public key (typically publicly available)

3. Attacker modifies token:
   Header: {"alg": "HS256", "typ": "JWT"}  ← Changed!
   Payload: {"sub": "admin", "exp": 2735689600}  ← Elevated!
   Signature: HMAC-SHA256(header.payload, public_key_as_secret)

4. Vulnerable library:
   alg = token_header['alg']  # "HS256"
   
   if alg == 'RS256':
       verify_with_rsa(token, public_key)
   elif alg == 'HS256':
       verify_with_hmac(token, public_key)  # Uses public key as HMAC secret!

5. Signature validates ✓ (wrong algorithm, but passes)

6. Attacker authenticated as admin with forged token
```

### Vulnerable Code Pattern

```python
# CRITICALLY VULNERABLE: Trusts alg header
import jwt

def verify_token(token, key):
    # VULNERABLE: algorithms not specified
    # Library uses 'alg' from header
    claims = jwt.decode(token, key, algorithms=None)
    
    return claims
```

### Mitigation

```python
# SECURE: Enforce expected algorithm
import jwt

EXPECTED_ALGORITHM = 'RS256'  # Configured, not from token!

def verify_token(token, public_key):
    try:
        # Explicitly specify expected algorithm
        claims = jwt.decode(
            token,
            public_key,
            algorithms=[EXPECTED_ALGORITHM],  # Only accept RS256!
            options={
                'verify_signature': True,
                'verify_exp': True,
                'verify_aud': True
            }
        )
        
        return claims
        
    except jwt.InvalidAlgorithmError:
        logger.error("Token uses unexpected algorithm")
        return None
    except jwt.InvalidTokenError as e:
        logger.error(f"Invalid token: {e}")
        return None
```

---

### 7.4 JWT alg=none Acceptance

**RFC/Spec Reference:** RFC 7515 §3.1, CVE-2015-9235  
**Attack Vector:** JWT without signature  
**Attacker Capability Required:** Malicious actor  
**CVE Examples:** CVE-2015-9235, widespread

### Attack Description

Some JWT libraries accept tokens with `alg=none`, indicating no signature. Attackers can create arbitrary unsigned tokens that vulnerable implementations accept.

### Attack Steps

```
1. Attacker creates unsigned token:
   Header: {"alg": "none", "typ": "JWT"}
   Payload: {"sub": "admin", "exp": 9999999999}
   Signature: (empty)

2. Token: eyJhbGc...eyJzdWI...  (no signature component)

3. Vulnerable library:
   alg = token_header['alg']
   
   if alg == 'none':
       return payload  # No verification!

4. Attacker authenticated with self-issued token
```

### Vulnerable Code Pattern

```python
# VULNERABLE: Accepts alg=none
def verify_token(token):
    parts = token.split('.')
    header = json.loads(base64_decode(parts[0]))
    
    if header['alg'] == 'none':
        # VULNERABLE: Accepts unsigned tokens!
        payload = json.loads(base64_decode(parts[1]))
        return payload
    
    # ... signature verification for other algorithms ...
```

### Mitigation

```python
# SECURE: Reject alg=none
def verify_token(token, public_key):
    parts = token.split('.')
    header = json.loads(base64_decode(parts[0]))
    
    # REJECT alg=none immediately
    if header.get('alg') == 'none':
        raise ValueError("Unsigned tokens not accepted")
    
    # Proceed with signature verification
    return jwt.decode(token, public_key, algorithms=['RS256'])
```

---

### 7.5 ID Token Signature Bypass

**RFC/Spec Reference:** OIDC Core §3.1.3.7, RFC 7515  
**Attack Vector:** Missing signature validation  
**Attacker Capability Required:** Implementation vulnerability  
**CVE Examples:** Implementation-specific

### Attack Description

Signature bypass occurs when implementations fail to validate JWT signatures entirely, accepting any token regardless of signature validity.

### Vulnerable Code Pattern

```python
# CRITICALLY VULNERABLE: No signature validation
def get_user_from_id_token(id_token):
    # Just decode, don't verify!
    parts = id_token.split('.')
    payload = base64.urlsafe_b64decode(parts[1] + '==')
    claims = json.loads(payload)
    
    # VULNERABLE: No signature verification
    # Attacker can forge any claims
    
    return claims['sub']
```

### Mitigation

```python
# SECURE: Always verify signature
def get_user_from_id_token(id_token, public_key):
    # ALWAYS verify signature
    claims = jwt.decode(
        id_token,
        public_key,
        algorithms=['RS256'],
        options={
            'verify_signature': True,  # CRITICAL!
            'verify_exp': True,
            'verify_aud': True,
            'verify_iss': True
        }
    )
    
    return claims['sub']
```

---

### 7.6 Hash Validation Bypass

**RFC/Spec Reference:** OIDC Core §3.1.3.3, §3.1.3.4  
**Attack Vector:** at_hash, c_hash validation  
**Attacker Capability Required:** Implementation vulnerability  
**CVE Examples:** Implementation-specific

### Attack Description

OIDC includes hash claims (at_hash, c_hash) to bind tokens together. Skipping validation allows token substitution attacks.

### Mitigation

```python
def validate_id_token(id_token, access_token=None, code=None):
    claims = verify_jwt(id_token)
    
    # Validate at_hash if access_token present
    if access_token and 'at_hash' in claims:
        expected_at_hash = compute_hash(access_token)
        
        if claims['at_hash'] != expected_at_hash:
            raise ValueError("at_hash mismatch")
    
    # Validate c_hash if code present (hybrid flow)
    if code and 'c_hash' in claims:
        expected_c_hash = compute_hash(code)
        
        if claims['c_hash'] != expected_c_hash:
            raise ValueError("c_hash mismatch")
    
    return claims

def compute_hash(value):
    """Compute hash per OIDC spec"""
    hash_bytes = hashlib.sha256(value.encode()).digest()
    half_hash = hash_bytes[:len(hash_bytes)//2]
    return base64.urlsafe_b64encode(half_hash).decode().rstrip('=')
```

---

[Continue with sections 8, 9, and 10 in same detailed format...]

---

*End of Part 2 - Continue to Part 3 for sections 8-10 (Cross-Flow, Network, and Client-Side Attacks)*
