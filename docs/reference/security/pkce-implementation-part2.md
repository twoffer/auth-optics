# PKCE Implementation Specification - Part 2

## Sections 13-20

> *This document continues the comprehensive PKCE specification from pkce-implementation.md*

---

## 13. PKCE Downgrade Attack

### 13.1 Attack Description (Security BCP §4.8.2)

**PKCE downgrade attack** exploits authorization servers that make PKCE optional, allowing attackers to strip PKCE parameters from authorization requests.

**Attack Flow:**
```
┌─────────────────────────────────────────────────────────────────┐
│                     PKCE Downgrade Attack                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Legitimate client initiates flow WITH PKCE:                 │
│     GET /authorize?                                              │
│         client_id=myapp&                                         │
│         code_challenge=E9Melhoa2Ow...&                          │
│         code_challenge_method=S256                               │
│                                                                  │
│  2. Network attacker (MITM) intercepts request                  │
│                                                                  │
│  3. Attacker modifies request, REMOVES PKCE:                    │
│     GET /authorize?                                              │
│         client_id=myapp                                          │
│         (no code_challenge!)                                     │
│                                                                  │
│  4. If server accepts request without PKCE:                     │
│     Authorization code issued WITHOUT challenge binding         │
│                                                                  │
│  5. User completes authentication                               │
│                                                                  │
│  6. Server redirects with code (not bound to verifier):        │
│     myapp://callback?code=ABC123                                │
│                                                                  │
│  7. Attacker intercepts authorization code                      │
│                                                                  │
│  8. Attacker exchanges code (no verifier needed):              │
│     POST /token                                                  │
│     code=ABC123&                                                 │
│     client_id=myapp                                              │
│     (no code_verifier - server doesn't expect it!)              │
│                                                                  │
│  9. ✓ Server issues tokens to attacker                          │
│                                                                  │
│ 10. 🚨 ATTACK SUCCEEDS                                           │
│     PKCE protection completely bypassed                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 13.2 Why This Attack Succeeds

**Root Cause:**
```
Server accepts authorization requests both WITH and WITHOUT PKCE

Problem:
- Server cannot distinguish:
  * Legitimate client that doesn't use PKCE
  * Attacker who stripped PKCE parameters

Result:
- PKCE becomes optional
- Attacker can always force non-PKCE flow
- Protection meaningless
```

### 13.3 Detection Mechanisms

**Method 1: Per-Client PKCE Requirement**
```python
# Track which clients use PKCE
class ClientConfiguration:
    def __init__(self, client_id):
        self.client_id = client_id
        self.type = get_client_type(client_id)  # 'public' or 'confidential'
        self.pkce_required = (self.type == 'public')  # Required for public
        self.has_used_pkce = False  # Track first PKCE use
        
    def update_pkce_usage(self, used_pkce):
        if used_pkce and not self.has_used_pkce:
            # First time this client used PKCE
            self.has_used_pkce = True
            # Now require PKCE for all future requests
            self.pkce_required = True
            save_client_config(self)

def validate_authorization_request(request):
    client = ClientConfiguration(request.client_id)
    has_challenge = bool(request.code_challenge)
    
    # Check if PKCE required
    if client.pkce_required and not has_challenge:
        return error(
            'invalid_request',
            'PKCE required for this client'
        )
    
    # Update usage tracking
    if has_challenge:
        client.update_pkce_usage(True)
    
    return SUCCESS
```

**Method 2: Global PKCE Enforcement (OAuth 2.1)**
```python
# Simplest: Require PKCE for ALL clients
REQUIRE_PKCE_FOR_ALL_CLIENTS = True

def validate_authorization_request(request):
    if REQUIRE_PKCE_FOR_ALL_CLIENTS:
        if not request.code_challenge:
            return error(
                'invalid_request',
                'PKCE is required'
            )
    
    return SUCCESS
```

### 13.4 Mitigation Strategies

**Strategy 1: Mandatory PKCE for Public Clients (OAuth 2.1)**
```python
@app.route('/authorize')
def authorize():
    client_id = request.args.get('client_id')
    code_challenge = request.args.get('code_challenge')
    
    client = get_client(client_id)
    
    # Enforce PKCE for public clients (REQUIRED in OAuth 2.1)
    if client.type == 'public':
        if not code_challenge:
            return error_response(
                'invalid_request',
                'PKCE required for public clients'
            )
        
        # Also check method
        method = request.args.get('code_challenge_method', 'plain')
        if method == 'plain':
            return error_response(
                'invalid_request',
                'Only S256 code_challenge_method supported'
            )
    
    # Continue with authorization...
```

**Strategy 2: Client Registration Policy**
```python
def register_new_client(registration_data):
    client_type = registration_data.get('client_type', 'public')
    
    client = Client(
        client_id=generate_client_id(),
        client_type=client_type,
        redirect_uris=registration_data['redirect_uris']
    )
    
    # Set PKCE policy based on type
    if client_type == 'public':
        client.pkce_required = True      # MUST use PKCE
        client.pkce_enforcement = 'mandatory'
    else:
        client.pkce_required = False     # SHOULD use PKCE
        client.pkce_enforcement = 'recommended'
    
    save_client(client)
    return client
```

**Strategy 3: Downgrade Monitoring**
```python
def log_potential_downgrade_attack(client_id, request_details):
    """Log potential PKCE downgrade attempts for security monitoring"""
    logger.warning(
        "Potential PKCE downgrade attack",
        extra={
            'client_id': client_id,
            'ip_address': request.remote_addr,
            'user_agent': request.headers.get('User-Agent'),
            'timestamp': datetime.utcnow(),
            'request_params': request_details,
            'alert': 'PKCE_DOWNGRADE'
        }
    )
    
    # Optional: Alert security team
    send_security_alert('PKCE downgrade attempt', client_id)
```

### 13.5 OAuth 2.1 Solution

**OAuth 2.1 eliminates downgrade attacks by:**

1. **Mandatory PKCE:** All authorization code flows MUST use PKCE
2. **No exceptions:** Even confidential clients SHOULD use PKCE
3. **Server enforcement:** Servers MUST reject requests without PKCE (for public clients)

**OAuth 2.1 Compliant Implementation:**
```python
# OAuth 2.1 authorization server
@app.route('/authorize')
def authorize_oauth21():
    client_id = request.args.get('client_id')
    code_challenge = request.args.get('code_challenge')
    code_challenge_method = request.args.get('code_challenge_method', 'plain')
    
    client = get_client(client_id)
    
    # OAuth 2.1: PKCE REQUIRED for all authorization code flows
    if not code_challenge:
        return error_response(
            'invalid_request',
            'code_challenge is required (OAuth 2.1)'
        )
    
    # S256 MUST be supported, plain SHOULD NOT be used
    if code_challenge_method != 'S256':
        return error_response(
            'invalid_request',
            'code_challenge_method must be S256'
        )
    
    # Proceed with authorization...
```

### 13.6 Vulnerability Mode Toggle

**For educational/testing purposes:**
```json
{
  "vulnerabilities": {
    "PKCE_OPTIONAL": false,
    "ALLOW_PKCE_DOWNGRADE": false,
    "SKIP_PKCE_ENFORCEMENT": false
  }
}
```

**Demo Implementation:**
```python
# For debugging tool demonstration only!
VULNERABILITY_MODE = {
    'PKCE_OPTIONAL': False  # Set True to demonstrate attack
}

@app.route('/authorize')
def authorize():
    client_id = request.args.get('client_id')
    code_challenge = request.args.get('code_challenge')
    
    client = get_client(client_id)
    
    # Check vulnerability mode
    if not VULNERABILITY_MODE['PKCE_OPTIONAL']:
        # Secure mode: Enforce PKCE
        if client.type == 'public' and not code_challenge:
            return error_response('invalid_request', 'PKCE required')
    else:
        # Vulnerable mode: PKCE optional (demonstrates attack)
        logger.warning("VULNERABILITY MODE: PKCE optional enabled")
    
    # Continue...
```

---

## 14. Common Implementation Errors

### 14.1 Client-Side Errors

**Error 1: Not Storing code_verifier**
```javascript
// ❌ WRONG
function initiateOAuth() {
    const verifier = generateCodeVerifier();
    const challenge = generateCodeChallenge(verifier);
    
    // Send challenge in auth request
    window.location = buildAuthUrl(challenge);
    
    // ERROR: verifier not stored!
    // Cannot complete token request without it
}

// ✅ CORRECT
function initiateOAuth() {
    const verifier = generateCodeVerifier();
    const challenge = generateCodeChallenge(verifier);
    
    // Store verifier for token request
    sessionStorage.setItem('pkce_verifier', verifier);
    
    window.location = buildAuthUrl(challenge);
}
```

**Error 2: Predictable code_verifier**
```python
# ❌ WRONG: Using timestamp (predictable!)
import time
code_verifier = str(time.time())  # Predictable!

# ❌ WRONG: Using user input
code_verifier = f"{user_id}_{session_id}"  # Not random!

# ✅ CORRECT: Cryptographically random
import secrets
code_verifier = secrets.token_urlsafe(32)
```

**Error 3: code_verifier Too Short**
```python
# ❌ WRONG: Only 16 characters (not enough entropy)
code_verifier = secrets.token_urlsafe(12)  # Too short!
print(len(code_verifier))  # ~16 chars, only 128 bits

# ✅ CORRECT: 43+ characters (256+ bits)
code_verifier = secrets.token_urlsafe(32)  # 32 bytes
print(len(code_verifier))  # ~43 chars, 256 bits
```

**Error 4: Wrong Character Set**
```javascript
// ❌ WRONG: Using invalid characters
const verifier = "my verifier with spaces!";  // Spaces not allowed!

// ✅ CORRECT: Only [A-Za-z0-9-._~]
const verifier = generateCodeVerifier();  // Base64URL encoded
```

**Error 5: Not Sending code_challenge_method**
```http
❌ WRONG:
GET /authorize?
    code_challenge=E9Melhoa2...
    (missing code_challenge_method)

Server assumes: plain method (weak!)

✅ CORRECT:
GET /authorize?
    code_challenge=E9Melhoa2...&
    code_challenge_method=S256
```

### 14.2 Server-Side Errors

**Error 1: Not Storing code_challenge**
```python
# ❌ WRONG: Challenge not stored with code
@app.route('/authorize')
def authorize():
    code_challenge = request.args.get('code_challenge')
    
    # Generate code
    auth_code = generate_code()
    
    # ERROR: Not storing challenge!
    store_code(auth_code, client_id=client_id)
    
    return redirect_with_code(auth_code)

# ✅ CORRECT: Store challenge with code
@app.route('/authorize')
def authorize():
    code_challenge = request.args.get('code_challenge')
    code_challenge_method = request.args.get('code_challenge_method', 'plain')
    
    auth_code = generate_code()
    
    # Store challenge AND method
    store_code(
        auth_code,
        client_id=client_id,
        code_challenge=code_challenge,
        code_challenge_method=code_challenge_method
    )
    
    return redirect_with_code(auth_code)
```

**Error 2: Incorrect Transformation**
```python
# ❌ WRONG: Wrong hash algorithm
derived = hashlib.md5(verifier.encode()).hexdigest()  # Should be SHA-256!

# ❌ WRONG: Not base64url encoding
derived = hashlib.sha256(verifier.encode()).digest()  # Raw bytes, not encoded!

# ❌ WRONG: Keeping padding
derived = base64.urlsafe_b64encode(hash_bytes).decode()  # Don't rstrip('=')!

# ✅ CORRECT
hash_bytes = hashlib.sha256(verifier.encode()).digest()
derived = base64.urlsafe_b64encode(hash_bytes).decode().rstrip('=')
```

**Error 3: Accepting Requests Without PKCE**
```python
# ❌ WRONG: PKCE optional for public clients
@app.route('/authorize')
def authorize():
    client = get_client(request.args.get('client_id'))
    code_challenge = request.args.get('code_challenge')
    
    # ERROR: Not enforcing PKCE for public clients!
    # Allows downgrade attacks
    
    # Continue regardless of code_challenge...

# ✅ CORRECT: Enforce PKCE for public clients
@app.route('/authorize')
def authorize():
    client = get_client(request.args.get('client_id'))
    code_challenge = request.args.get('code_challenge')
    
    # Enforce PKCE for public clients
    if client.type == 'public' and not code_challenge:
        return error('invalid_request', 'PKCE required for public clients')
    
    # Continue...
```

**Error 4: Not Validating code_verifier Format**
```python
# ❌ WRONG: No format validation
@app.route('/token', methods=['POST'])
def token():
    verifier = request.form.get('code_verifier')
    
    # ERROR: Not validating verifier format
    # Attacker could send arbitrary strings
    
    derived = derive_challenge(verifier)
    # Continue...

# ✅ CORRECT: Validate format
@app.route('/token', methods=['POST'])
def token():
    verifier = request.form.get('code_verifier')
    
    # Validate length
    if not (43 <= len(verifier) <= 128):
        return error('invalid_request', 'Invalid code_verifier length')
    
    # Validate character set
    if not re.match(r'^[A-Za-z0-9\-._~]+$', verifier):
        return error('invalid_request', 'Invalid code_verifier characters')
    
    derived = derive_challenge(verifier)
    # Continue...
```

**Error 5: Timing Attacks**
```python
# ❌ WRONG: Vulnerable to timing attacks
def verify_challenge(received, stored):
    if received == stored:  # Early exit reveals information!
        return True
    return False

# ✅ CORRECT: Constant-time comparison
import secrets

def verify_challenge(received, stored):
    return secrets.compare_digest(received, stored)
```

### 14.3 Integration Errors

**Error 1: PKCE with Implicit Flow**
```javascript
// ❌ WRONG: PKCE doesn't work with implicit flow!
const authUrl = `${AUTH_ENDPOINT}?` +
    `response_type=token&` +  // Implicit flow!
    `code_challenge=${challenge}`;  // PKCE only for code flow!

// ✅ CORRECT: Use authorization code flow
const authUrl = `${AUTH_ENDPOINT}?` +
    `response_type=code&` +  // Code flow
    `code_challenge=${challenge}`;
```

**Error 2: Mixing PKCE with Client Credentials Flow**
```python
# ❌ WRONG: Client Credentials doesn't use authorization codes
POST /token
grant_type=client_credentials&
client_id=...&
client_secret=...&
code_verifier=...  # No authorization code in this flow!

# ✅ CORRECT: Client Credentials without PKCE
POST /token
grant_type=client_credentials&
client_id=...&
client_secret=...
```

### 14.4 Error Detection Checklist

**Client-Side Checklist:**
```
☐ code_verifier generated with cryptographically secure random
☐ code_verifier length 43-128 characters
☐ code_verifier uses only allowed characters [A-Za-z0-9-._~]
☐ code_verifier stored securely for token request
☐ code_challenge correctly derived (SHA-256 + Base64URL, no padding)
☐ code_challenge_method explicitly set to "S256"
☐ code_verifier sent in token request
☐ code_verifier deleted after successful token exchange
```

**Server-Side Checklist:**
```
☐ PKCE enforced for public clients
☐ code_challenge stored with authorization code
☐ code_challenge_method stored with authorization code
☐ code_verifier format validated in token request
☐ Transformation correctly applied based on method
☐ Constant-time comparison used
☐ plain method rejected (or explicitly allowed with warning)
☐ Authorization code deleted/invalidated after use
☐ PKCE verification failure logged
```

---

## 15. PKCE with Different Client Types

### 15.1 Native Mobile Apps (RFC 8252)

**Requirements:**
- PKCE REQUIRED (RFC 8252 §8.1)
- Custom URI schemes vulnerable to hijacking
- PKCE protects against malicious apps

**iOS Implementation:**
```swift
import AuthenticationServices

class OAuthManager {
    private var codeVerifier: String?
    private var authSession: ASWebAuthenticationSession?
    
    func startOAuthFlow() {
        // Generate PKCE
        let (verifier, challenge) = generatePKCE()
        self.codeVerifier = verifier
        
        // Build authorization URL
        let authURL = buildAuthURL(
            responseType: "code",
            clientId: "com.example.myapp",
            redirectURI: "com.example.myapp://callback",
            codeChallenge: challenge,
            codeChallengeMethod: "S256",
            state: generateState()
        )
        
        // Use ASWebAuthenticationSession (secure)
        authSession = ASWebAuthenticationSession(
            url: authURL,
            callbackURLScheme: "com.example.myapp"
        ) { [weak self] callbackURL, error in
            guard let self = self,
                  let callbackURL = callbackURL,
                  let code = self.extractCode(from: callbackURL),
                  let verifier = self.codeVerifier else {
                return
            }
            
            // Exchange code with PKCE
            self.exchangeCode(code, verifier: verifier)
        }
        
        authSession?.presentationContextProvider = self
        authSession?.start()
    }
    
    private func generatePKCE() -> (verifier: String, challenge: String) {
        // Generate verifier
        let verifierData = Data((0..<32).map { _ in UInt8.random(in: 0...255) })
        let verifier = verifierData.base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
        
        // Derive challenge
        let challengeData = Data(SHA256.hash(data: verifier.data(using: .utf8)!))
        let challenge = challengeData.base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
        
        return (verifier, challenge)
    }
}
```

**Android Implementation:**
```kotlin
import net.openid.appauth.*

class OAuthManager(private val context: Context) {
    fun startOAuthFlow() {
        // Configure service
        val serviceConfig = AuthorizationServiceConfiguration(
            Uri.parse("https://auth.example.com/authorize"),
            Uri.parse("https://auth.example.com/token")
        )
        
        // Build authorization request with PKCE (automatic!)
        val authRequest = AuthorizationRequest.Builder(
            serviceConfig,
            "com.example.myapp",
            ResponseTypeValues.CODE,
            Uri.parse("com.example.myapp://callback")
        )
        .setScope("openid profile email")
        .build()  // AppAuth automatically adds PKCE!
        
        // Initiate authorization
        val authService = AuthorizationService(context)
        val authIntent = authService.getAuthorizationRequestIntent(authRequest)
        
        startActivityForResult(authIntent, AUTH_REQUEST_CODE)
    }
    
    fun handleAuthorizationResponse(data: Intent?) {
        val response = AuthorizationResponse.fromIntent(data)
        val ex = AuthorizationException.fromIntent(data)
        
        if (response != null) {
            // Exchange code with PKCE (automatic!)
            val authService = AuthorizationService(context)
            authService.performTokenRequest(response.createTokenExchangeRequest()) { tokenResponse, exception ->
                if (tokenResponse != null) {
                    // Success - tokens received
                    handleTokens(tokenResponse)
                }
            }
        }
    }
}
```

### 15.2 Single Page Applications (SPAs)

**Requirements:**
- PKCE REQUIRED (OAuth 2.1)
- No client_secret possible
- Alternative: Backend-For-Frontend pattern

**SPA with PKCE:**
```javascript
class SPAOAuthClient {
    constructor(config) {
        this.clientId = config.clientId;
        this.authEndpoint = config.authEndpoint;
        this.tokenEndpoint = config.tokenEndpoint;
        this.redirectUri = config.redirectUri;
    }
    
    async startLogin() {
        // Generate PKCE
        const codeVerifier = this.generateCodeVerifier();
        const codeChallenge = await this.generateCodeChallenge(codeVerifier);
        
        // Store verifier in session storage (temporary)
        sessionStorage.setItem('pkce_verifier', codeVerifier);
        
        // Generate state
        const state = this.generateState();
        sessionStorage.setItem('oauth_state', state);
        
        // Build authorization URL
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            scope: 'openid profile email',
            state: state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256'
        });
        
        // Redirect to authorization server
        window.location = `${this.authEndpoint}?${params}`;
    }
    
    async handleCallback() {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        
        // Validate state
        const storedState = sessionStorage.getItem('oauth_state');
        if (state !== storedState) {
            throw new Error('State mismatch');
        }
        
        // Get verifier
        const verifier = sessionStorage.getItem('pkce_verifier');
        if (!verifier) {
            throw new Error('No code_verifier found');
        }
        
        // Clean up
        sessionStorage.removeItem('pkce_verifier');
        sessionStorage.removeItem('oauth_state');
        
        // Exchange code for tokens
        const tokens = await this.exchangeCode(code, verifier);
        
        return tokens;
    }
    
    async exchangeCode(code, codeVerifier) {
        const response = await fetch(this.tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: this.redirectUri,
                client_id: this.clientId,
                code_verifier: codeVerifier
            })
        });
        
        if (!response.ok) {
            throw new Error('Token exchange failed');
        }
        
        return response.json();
    }
    
    generateCodeVerifier() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return this.base64URLEncode(array);
    }
    
    async generateCodeChallenge(verifier) {
        const encoder = new TextEncoder();
        const data = encoder.encode(verifier);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return this.base64URLEncode(new Uint8Array(hash));
    }
    
    base64URLEncode(buffer) {
        return btoa(String.fromCharCode(...buffer))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }
    
    generateState() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return this.base64URLEncode(array);
    }
}

// Usage
const oauth = new SPAOAuthClient({
    clientId: 'spa_client_123',
    authEndpoint: 'https://auth.example.com/authorize',
    tokenEndpoint: 'https://auth.example.com/token',
    redirectUri: 'https://myapp.com/callback'
});

// Start login
await oauth.startLogin();

// Handle callback (on redirect page)
const tokens = await oauth.handleCallback();
```

### 15.3 Desktop Applications

**Requirements:**
- PKCE REQUIRED
- Localhost redirect with random port
- Platform-specific browser integration

**Python Desktop App:**
```python
import secrets
import hashlib
import base64
import webbrowser
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlencode, parse_qs, urlparse

class OAuthCallbackHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Parse callback URL
        query = parse_qs(urlparse(self.path).query)
        
        # Store code for main thread
        if 'code' in query:
            self.server.authorization_code = query['code'][0]
            
            # Send success page to browser
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b'<html><body><h1>Authorization successful!</h1>'
                           b'<p>You can close this window.</p></body></html>')
        else:
            self.send_response(400)
            self.end_headers()

class DesktopOAuthClient:
    def __init__(self, client_id, auth_endpoint, token_endpoint):
        self.client_id = client_id
        self.auth_endpoint = auth_endpoint
        self.token_endpoint = token_endpoint
        self.server = None
        self.code_verifier = None
    
    def start_authorization(self):
        # Start local server on random available port
        self.server = HTTPServer(('localhost', 0), OAuthCallbackHandler)
        port = self.server.server_address[1]
        redirect_uri = f'http://localhost:{port}/callback'
        
        # Generate PKCE
        self.code_verifier = self.generate_code_verifier()
        code_challenge = self.generate_code_challenge(self.code_verifier)
        
        # Build authorization URL
        params = {
            'response_type': 'code',
            'client_id': self.client_id,
            'redirect_uri': redirect_uri,
            'scope': 'openid profile email',
            'state': secrets.token_urlsafe(32),
            'code_challenge': code_challenge,
            'code_challenge_method': 'S256'
        }
        
        auth_url = f"{self.auth_endpoint}?{urlencode(params)}"
        
        # Open browser
        print(f"Opening browser for authorization...")
        webbrowser.open(auth_url)
        
        # Wait for callback
        print(f"Waiting for authorization callback on port {port}...")
        self.server.handle_request()  # Handle one request
        
        # Get code from callback
        code = getattr(self.server, 'authorization_code', None)
        
        if not code:
            raise Exception("Authorization failed")
        
        # Exchange code for tokens
        tokens = self.exchange_code(code, redirect_uri)
        
        return tokens
    
    def generate_code_verifier(self):
        random_bytes = secrets.token_bytes(32)
        return base64.urlsafe_b64encode(random_bytes).decode('utf-8').rstrip('=')
    
    def generate_code_challenge(self, verifier):
        sha256_hash = hashlib.sha256(verifier.encode('utf-8')).digest()
        return base64.urlsafe_b64encode(sha256_hash).decode('utf-8').rstrip('=')
    
    def exchange_code(self, code, redirect_uri):
        import requests
        
        response = requests.post(self.token_endpoint, data={
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': redirect_uri,
            'client_id': self.client_id,
            'code_verifier': self.code_verifier
        })
        
        if response.status_code != 200:
            raise Exception(f"Token exchange failed: {response.text}")
        
        return response.json()

# Usage
client = DesktopOAuthClient(
    client_id='desktop_app_123',
    auth_endpoint='https://auth.example.com/authorize',
    token_endpoint='https://auth.example.com/token'
)

tokens = client.start_authorization()
print(f"Access Token: {tokens['access_token']}")
```

### 15.4 Server-Side Web Applications

**Confidential client with PKCE for defense in depth:**

```python
from flask import Flask, session, redirect, request
import requests

app = Flask(__name__)
app.secret_key = 'your-secret-key'

# Client credentials (confidential client)
CLIENT_ID = 'web_app_123'
CLIENT_SECRET = 'super_secret_key'
AUTH_ENDPOINT = 'https://auth.example.com/authorize'
TOKEN_ENDPOINT = 'https://auth.example.com/token'
REDIRECT_URI = 'https://myapp.com/callback'

@app.route('/login')
def login():
    # Generate PKCE (defense in depth)
    code_verifier = generate_code_verifier()
    code_challenge = generate_code_challenge(code_verifier)
    
    # Store verifier in server-side session
    session['pkce_verifier'] = code_verifier
    
    # Generate state
    state = secrets.token_urlsafe(32)
    session['oauth_state'] = state
    
    # Build authorization URL
    params = {
        'response_type': 'code',
        'client_id': CLIENT_ID,
        'redirect_uri': REDIRECT_URI,
        'scope': 'openid profile email',
        'state': state,
        'code_challenge': code_challenge,
        'code_challenge_method': 'S256'
    }
    
    auth_url = f"{AUTH_ENDPOINT}?{urlencode(params)}"
    
    return redirect(auth_url)

@app.route('/callback')
def callback():
    code = request.args.get('code')
    state = request.args.get('state')
    
    # Validate state
    if state != session.get('oauth_state'):
        return "State mismatch", 403
    
    # Get verifier
    code_verifier = session.get('pkce_verifier')
    
    # Exchange code with BOTH client_secret AND PKCE
    response = requests.post(TOKEN_ENDPOINT, data={
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,  # Confidential client auth
        'code_verifier': code_verifier    # PKCE (defense in depth)
    })
    
    tokens = response.json()
    
    # Clean up
    session.pop('pkce_verifier', None)
    session.pop('oauth_state', None)
    
    # Store tokens
    session['access_token'] = tokens['access_token']
    
    return redirect('/dashboard')
```

---

## 16. PKCE in OAuth 2.1

### 16.1 Changes from OAuth 2.0

**OAuth 2.1 makes PKCE mandatory:**

| Aspect | OAuth 2.0 (RFC 6749) | OAuth 2.1 (draft) |
|--------|---------------------|-------------------|
| **PKCE Status** | Extension (RFC 7636) | Core requirement |
| **Public Clients** | Optional | REQUIRED |
| **Confidential Clients** | N/A | RECOMMENDED |
| **S256 Method** | SHOULD | MUST support |
| **plain Method** | MAY support | Discouraged |
| **Server Support** | MAY support | MUST support |
| **Downgrade Protection** | Optional | Required |

### 16.2 OAuth 2.1 Requirements

**MUST Requirements:**
```
1. Clients MUST use PKCE for authorization code flow
2. Servers MUST support PKCE
3. Servers MUST support S256 transformation method
4. Servers MUST enforce PKCE for public clients
5. code_verifier MUST be cryptographically random
6. code_verifier MUST be 43-128 characters
```

**SHOULD Requirements:**
```
1. Clients SHOULD NOT use plain method
2. Servers SHOULD reject plain method
3. Servers SHOULD require PKCE for all clients (not just public)
4. code_verifier SHOULD have at least 256 bits of entropy
```

### 16.3 Migration Path

**From OAuth 2.0 to OAuth 2.1:**

```
Phase 1: Support (Current OAuth 2.0)
├─ Implement PKCE support in authorization server
├─ Test with PKCE-enabled clients
└─ Keep PKCE optional for backward compatibility

Phase 2: Encourage (Transition)
├─ Update documentation to recommend PKCE
├─ Update client libraries to use PKCE by default
├─ Log clients not using PKCE
└─ Communicate deprecation timeline

Phase 3: Enforce for Public (OAuth 2.1 Step 1)
├─ Require PKCE for all public clients
├─ Reject authorization requests without PKCE (public clients)
├─ Allow confidential clients without PKCE (temporarily)
└─ Monitor and assist stragglers

Phase 4: Enforce for All (OAuth 2.1 Complete)
├─ Require PKCE for ALL authorization code flows
├─ Reject any authorization request without PKCE
├─ OAuth 2.1 compliance achieved
└─ Security posture maximized
```

### 16.4 Compliance Checklist

**OAuth 2.1 PKCE Compliance:**
```
Client Checklist:
☐ PKCE implemented for all authorization code flows
☐ code_verifier generated with cryptographic randomness
☐ code_verifier length 43-128 characters
☐ S256 transformation method used
☐ plain method not used
☐ code_challenge_method explicitly set to "S256"
☐ code_verifier stored securely during flow
☐ code_verifier sent in token request
☐ Works with your authorization server

Server Checklist:
☐ PKCE support implemented
☐ S256 transformation method supported
☐ PKCE required for public clients (minimum)
☐ PKCE required for all clients (recommended)
☐ plain method rejected
☐ code_challenge stored with authorization code
☐ code_verifier format validated
☐ Verification using constant-time comparison
☐ Downgrade attacks prevented
☐ Comprehensive testing completed
```

---

## 17. Testing and Validation

### 17.1 Test Cases

**Test Suite for PKCE Implementation:**

**Happy Path Tests:**
```python
def test_pkce_happy_path():
    """Test complete PKCE flow succeeds"""
    # Generate PKCE
    verifier = generate_code_verifier()
    challenge = generate_code_challenge(verifier)
    
    # Authorization request
    auth_response = client.get('/authorize', query_string={
        'response_type': 'code',
        'client_id': 'test_client',
        'code_challenge': challenge,
        'code_challenge_method': 'S256'
    })
    
    code = extract_code(auth_response)
    
    # Token request
    token_response = client.post('/token', data={
        'grant_type': 'authorization_code',
        'code': code,
        'client_id': 'test_client',
        'code_verifier': verifier
    })
    
    assert token_response.status_code == 200
    assert 'access_token' in token_response.json

def test_pkce_s256_transformation():
    """Test that S256 transformation is correct"""
    # Use RFC 7636 Appendix B test vector
    verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
    expected_challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
    
    actual_challenge = generate_code_challenge(verifier)
    
    assert actual_challenge == expected_challenge
```

**Negative Tests:**
```python
def test_pkce_wrong_verifier():
    """Test that wrong verifier is rejected"""
    # Authorization with correct challenge
    verifier1 = generate_code_verifier()
    challenge1 = generate_code_challenge(verifier1)
    
    code = get_authorization_code(challenge=challenge1)
    
    # Token request with different verifier
    verifier2 = generate_code_verifier()
    
    response = client.post('/token', data={
        'grant_type': 'authorization_code',
        'code': code,
        'code_verifier': verifier2  # Wrong!
    })
    
    assert response.status_code == 400
    assert response.json['error'] == 'invalid_grant'

def test_pkce_missing_verifier():
    """Test that missing verifier is rejected"""
    verifier = generate_code_verifier()
    challenge = generate_code_challenge(verifier)
    
    code = get_authorization_code(challenge=challenge)
    
    # Token request without verifier
    response = client.post('/token', data={
        'grant_type': 'authorization_code',
        'code': code
        # Missing code_verifier!
    })
    
    assert response.status_code == 400
    assert response.json['error'] in ['invalid_request', 'invalid_grant']

def test_pkce_plain_method_rejected():
    """Test that plain method is rejected"""
    response = client.get('/authorize', query_string={
        'response_type': 'code',
        'client_id': 'test_client',
        'code_challenge': 'plain_challenge',
        'code_challenge_method': 'plain'
    })
    
    assert 'error=invalid_request' in response.location
```

**Security Tests:**
```python
def test_pkce_downgrade_protection():
    """Test that PKCE cannot be downgraded"""
    # First request WITH PKCE
    response1 = client.get('/authorize', query_string={
        'client_id': 'public_client',
        'code_challenge': 'challenge1'
    })
    
    assert response1.status_code in [200, 302]
    
    # Second request WITHOUT PKCE (downgrade attempt)
    response2 = client.get('/authorize', query_string={
        'client_id': 'public_client'
        # No code_challenge!
    })
    
    # Should be rejected
    assert 'error=invalid_request' in response2.location

def test_pkce_timing_attack_resistance():
    """Test that verification is constant-time"""
    verifier = generate_code_verifier()
    challenge = generate_code_challenge(verifier)
    
    code = get_authorization_code(challenge=challenge)
    
    # Measure time for correct verifier
    start = time.perf_counter()
    response1 = exchange_code(code, verifier)
    time_correct = time.perf_counter() - start
    
    # Measure time for wrong verifier (different length)
    code2 = get_authorization_code(challenge=challenge)
    wrong_verifier = "a" * 43
    start = time.perf_counter()
    response2 = exchange_code(code2, wrong_verifier)
    time_wrong = time.perf_counter() - start
    
    # Times should be similar (constant-time comparison)
    # Allow 10% variance
    assert abs(time_correct - time_wrong) / time_correct < 0.1
```

### 17.2 Validation Checklist

**Client Implementation Validation:**
```
☐ code_verifier generation:
   ☐ Uses cryptographically secure random
   ☐ Length 43-128 characters
   ☐ Character set [A-Za-z0-9-._~]
   ☐ Base64URL encoded (no padding)

☐ code_challenge generation:
   ☐ SHA-256 hash of verifier
   ☐ Base64URL encoded (no padding)
   ☐ Matches RFC 7636 Appendix B test vector

☐ Authorization request:
   ☐ Includes code_challenge
   ☐ Includes code_challenge_method=S256
   ☐ verifier stored securely

☐ Token request:
   ☐ Includes code_verifier
   ☐ Verifier retrieved from secure storage
   ☐ Verifier deleted after successful exchange

☐ Error handling:
   ☐ Handles missing verifier gracefully
   ☐ Handles verification failure
   ☐ Cleans up on errors
```

**Server Implementation Validation:**
```
☐ Authorization endpoint:
   ☐ Accepts code_challenge parameter
   ☐ Accepts code_challenge_method parameter
   ☐ Defaults to plain if method omitted (or rejects)
   ☐ Stores challenge with authorization code
   ☐ Stores method with authorization code
   ☐ Enforces PKCE for public clients
   ☐ Validates challenge format

☐ Token endpoint:
   ☐ Accepts code_verifier parameter
   ☐ Validates verifier format
   ☐ Retrieves stored challenge and method
   ☐ Applies correct transformation (S256 or plain)
   ☐ Uses constant-time comparison
   ☐ Returns invalid_grant on mismatch
   ☐ Doesn't reveal specific failure reason

☐ Security policies:
   ☐ PKCE required for public clients
   ☐ plain method rejected (or allowed with warning)
   ☐ Downgrade attacks prevented
   ☐ Timing attacks prevented
   ☐ Failed attempts logged
```

---

## 18. Example Scenarios

### 18.1 Happy Path: Native App

**Complete flow from start to finish:**

```
Scenario: User logs into mobile banking app

1. User taps "Login" button

2. App generates PKCE:
   code_verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
   code_challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"

3. App stores verifier in Keychain (iOS) / Keystore (Android)

4. App opens ASWebAuthenticationSession with:
   https://bank.example.com/authorize?
     response_type=code&
     client_id=mobile_banking_app&
     redirect_uri=com.bank.app://callback&
     scope=accounts transactions&
     code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&
     code_challenge_method=S256

5. User authenticates with bank credentials

6. Bank shows consent screen: "Allow Mobile Banking App to access 
   your accounts and transactions?"

7. User taps "Allow"

8. Bank redirects to:
   com.bank.app://callback?code=ABC123XYZ789

9. App receives callback via URL scheme

10. App retrieves verifier from Keychain

11. App sends token request:
    POST https://bank.example.com/token
    grant_type=authorization_code&
    code=ABC123XYZ789&
    redirect_uri=com.bank.app://callback&
    client_id=mobile_banking_app&
    code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk

12. Bank validates:
    - Code is valid and not expired
    - Code belongs to mobile_banking_app
    - Computes: SHA256(verifier) = E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
    - Compares with stored challenge: ✓ Match!

13. Bank responds with tokens:
    {
      "access_token": "eyJhbGciOiJSUzI1NiIs...",
      "refresh_token": "refresh_abc123...",
      "expires_in": 3600
    }

14. App deletes verifier from Keychain

15. App stores tokens securely

16. User is logged in ✓
```

### 18.2 Attack Blocked: Code Interception

**Malicious app attempts to steal authorization code:**

```
Scenario: Malware tries to intercept banking app's authorization code

1. User initiates login in legitimate banking app

2. Legitimate app generates PKCE:
   verifier_legit = "dBjftJeZ4CVP..."
   challenge_legit = "E9Melhoa2Ow..."

3. Authorization request sent with challenge_legit

4. User authenticates at bank

5. Bank redirects with code:
   com.bank.app://callback?code=ABC123XYZ789

6. ⚠️ Malicious app installed with same URI scheme

7. OS routes callback to malicious app (or shows choice dialog)

8. Malicious app receives code: ABC123XYZ789

9. Malicious app attempts token exchange:
   POST /token
   code=ABC123XYZ789&
   client_id=mobile_banking_app&
   code_verifier=??? ← Malware doesn't have this!

10. Malware tries random verifier:
    code_verifier=guessed_random_string

11. Bank computes: SHA256("guessed_random_string")
    Result: Different from stored challenge

12. Bank responds:
    {
      "error": "invalid_grant",
      "error_description": "PKCE verification failed"
    }

13. ❌ Attack blocked! Malware cannot get tokens

14. Legitimate app eventually exchanges code successfully
    (with correct verifier)

15. User's account safe ✓
```

### 18.3 Implementation Error: Short verifier

**Developer uses insufficient entropy:**

```
Scenario: Developer creates weak code_verifier

1. Developer implements PKCE:
   # ❌ WRONG: Only 8 bytes = 64 bits
   code_verifier = secrets.token_urlsafe(8)
   # Result: ~11 characters (too short!)

2. Server validation:
   - Receives verifier during token request
   - Checks length: 11 characters
   - Minimum required: 43 characters
   - Length check fails!

3. Server responds:
   {
     "error": "invalid_request",
     "error_description": "code_verifier must be 43-128 characters"
   }

4. Token exchange fails

5. User sees error: "Login failed, please try again"

6. Developer checks logs:
   "ERROR: code_verifier too short (11 chars, need 43+)"

7. Developer fixes:
   # ✅ CORRECT: 32 bytes = 256 bits
   code_verifier = secrets.token_urlsafe(32)
   # Result: 43 characters ✓

8. Next attempt succeeds ✓
```

### 18.4 Downgrade Attack Blocked

**Server enforces PKCE preventing downgrade:**

```
Scenario: Attacker tries to remove PKCE from request

1. Legitimate client initiates flow WITH PKCE:
   GET /authorize?
     client_id=mobile_app&
     code_challenge=E9Melhoa2Ow...&
     code_challenge_method=S256

2. Network attacker (MITM) intercepts request

3. Attacker modifies request, removes PKCE:
   GET /authorize?
     client_id=mobile_app
     (no code_challenge!)

4. Server receives modified request

5. Server checks:
   - client_id = mobile_app
   - Client type: public
   - PKCE present: NO
   - Policy: PKCE required for public clients

6. Server rejects:
   HTTP/1.1 302 Found
   Location: error_page?
     error=invalid_request&
     error_description=PKCE+required+for+public+clients

7. ❌ Attack blocked!

8. Legitimate client retries (PKCE intact this time)

9. Flow succeeds ✓
```

---

## 19. PKCE Libraries and Tools

### 19.1 Client Libraries

**JavaScript/TypeScript:**
```
- oauth4webapi
  * Modern, standards-compliant OAuth 2.1 library
  * Automatic PKCE support
  * npm install oauth4webapi

- openid-client
  * Mature OIDC client library
  * Built-in PKCE support
  * npm install openid-client
  
- AppAuth-JS
  * Reference implementation for web apps
  * Full PKCE support
  * npm install @openid/appauth
```

**Python:**
```
- Authlib
  * Comprehensive OAuth/OIDC library
  * PKCE support for clients and servers
  * pip install authlib --break-system-packages

- oauthlib
  * OAuth 1.0a/2.0 implementation
  * PKCE support via RFC7636 extension
  * pip install oauthlib --break-system-packages
```

**Java:**
```
- Nimbus OAuth 2.0 SDK
  * Complete OAuth 2.0/OIDC implementation
  * Full PKCE support
  * com.nimbusds:oauth2-oidc-sdk

- Spring Security OAuth
  * Enterprise-grade OAuth framework
  * Automatic PKCE for public clients
  * org.springframework.security:spring-security-oauth2-client
```

**Mobile:**
```
- AppAuth (iOS)
  * Official OIDC/OAuth library for iOS
  * Automatic PKCE
  * pod 'AppAuth'

- AppAuth (Android)
  * Official OIDC/OAuth library for Android
  * Automatic PKCE
  * implementation 'net.openid:appauth:0.11.1'
```

### 19.2 Testing Tools

**PKCE Test Vectors:**
```
RFC 7636 Appendix B test vector:

code_verifier:
"dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"

Expected code_challenge (S256):
"E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"

Use for testing your implementation!
```

**Online PKCE Generator:**
```
https://tonyxu-io.github.io/pkce-generator/

Features:
- Generate random code_verifier
- Compute code_challenge
- Validate format
- Educational tool
```

**OAuth Debugger:**
```
https://oauthdebugger.com/

Features:
- Test OAuth flows with PKCE
- Visualize parameters
- Debug authorization requests
- Inspect tokens
```

### 19.3 Debugging Tool Features

**PKCE Visualization:**
```
Feature: Show PKCE flow step-by-step

Display:
1. code_verifier generation
   └─ Show random bytes → Base64URL

2. code_challenge derivation
   └─ Show SHA-256 → Base64URL transformation

3. Authorization request
   └─ Highlight code_challenge in URL

4. Token request
   └─ Highlight code_verifier in body

5. Server verification
   └─ Show comparison: derived vs stored

6. Success/failure indication
```

**Vulnerability Modes:**
```
Toggle: PKCE_OPTIONAL
- Demonstrates downgrade attack
- Shows code interception succeeding
- Educational: why PKCE is necessary

Toggle: SHORT_VERIFIER
- Demonstrates insufficient entropy
- Shows validation failure
- Educational: importance of 256-bit entropy

Toggle: PLAIN_METHOD
- Demonstrates plain method weakness
- Shows verifier exposure
- Educational: why S256 is required
```

---

## 20. Migration from non-PKCE to PKCE

### 20.1 Migration Strategy

**Phased Approach:**

```
┌──────────────────────────────────────────────────────────────┐
│                    PKCE Migration Timeline                    │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ Phase 1: Preparation (Weeks 1-4)                            │
│ ├─ Implement PKCE support in authorization server           │
│ ├─ Test thoroughly in staging environment                    │
│ ├─ Update documentation                                      │
│ └─ Communicate to client developers                         │
│                                                               │
│ Phase 2: Optional PKCE (Weeks 5-12)                         │
│ ├─ Deploy PKCE-enabled server to production                 │
│ ├─ PKCE is optional (backward compatible)                   │
│ ├─ Monitor adoption rate                                     │
│ ├─ Update client SDKs to use PKCE by default               │
│ └─ Provide migration guides                                 │
│                                                               │
│ Phase 3: Recommended PKCE (Weeks 13-20)                     │
│ ├─ Update documentation: PKCE strongly recommended          │
│ ├─ Log clients not using PKCE                               │
│ ├─ Reach out to high-traffic clients                        │
│ └─ Announce enforcement timeline                            │
│                                                               │
│ Phase 4: Required for Public (Weeks 21-28)                  │
│ ├─ Enforce PKCE for all public clients                      │
│ ├─ Reject public client requests without PKCE              │
│ ├─ Continue monitoring                                       │
│ └─ Assist stragglers with migration                         │
│                                                               │
│ Phase 5: Required for All (Week 29+)                        │
│ ├─ Enforce PKCE for ALL clients                            │
│ ├─ OAuth 2.1 compliant                                      │
│ └─ Security posture maximized                               │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 20.2 Server-Side Migration

**Step 1: Add PKCE Support**
```python
# Add PKCE fields to authorization code storage
class AuthorizationCode:
    code: str
    client_id: str
    redirect_uri: str
    scope: str
    user_id: str
    expires_at: datetime
    # NEW: PKCE fields
    code_challenge: Optional[str] = None
    code_challenge_method: Optional[str] = None

# Update authorization endpoint
@app.route('/authorize')
def authorize():
    # ... existing code ...
    
    # NEW: Accept PKCE parameters
    code_challenge = request.args.get('code_challenge')
    code_challenge_method = request.args.get('code_challenge_method', 'plain')
    
    # Store with authorization code
    save_authorization_code(
        code=auth_code,
        # ... existing fields ...
        code_challenge=code_challenge,  # NEW
        code_challenge_method=code_challenge_method  # NEW
    )

# Update token endpoint
@app.route('/token', methods=['POST'])
def token():
    code = request.form.get('code')
    code_verifier = request.form.get('code_verifier')  # NEW
    
    code_data = get_authorization_code(code)
    
    # NEW: PKCE verification if challenge present
    if code_data.code_challenge:
        if not code_verifier:
            return error('invalid_request', 'code_verifier required')
        
        if not verify_pkce(code_verifier, code_data.code_challenge, 
                          code_data.code_challenge_method):
            return error('invalid_grant', 'Invalid code_verifier')
    
    # ... continue with token issuance ...
```

**Step 2: Monitor Adoption**
```python
def log_pkce_usage():
    """Track PKCE adoption metrics"""
    @app.route('/authorize')
    def authorize():
        has_pkce = bool(request.args.get('code_challenge'))
        client_id = request.args.get('client_id')
        
        # Log for metrics
        metrics.increment(
            'authorization_requests',
            tags={
                'client_id': client_id,
                'pkce_enabled': has_pkce
            }
        )
        
        if not has_pkce:
            logger.info(f"Client {client_id} not using PKCE")
        
        # ... continue ...
```

**Step 3: Enforce for Public Clients**
```python
@app.route('/authorize')
def authorize():
    client_id = request.args.get('client_id')
    code_challenge = request.args.get('code_challenge')
    
    client = get_client(client_id)
    
    # Enforce PKCE for public clients
    if client.type == 'public':
        if not code_challenge:
            return error_response(
                'invalid_request',
                'PKCE is required for public clients. '
                'See documentation: https://docs.example.com/pkce'
            )
    
    # ... continue ...
```

### 20.3 Client-Side Migration

**Before (without PKCE):**
```javascript
// Old authorization code flow
function login() {
    const state = generateState();
    sessionStorage.setItem('oauth_state', state);
    
    const authUrl = `${AUTH_ENDPOINT}?` +
        `response_type=code&` +
        `client_id=${CLIENT_ID}&` +
        `redirect_uri=${REDIRECT_URI}&` +
        `state=${state}`;
    
    window.location = authUrl;
}

function handleCallback() {
    const code = new URLSearchParams(window.location.search).get('code');
    
    // Exchange code
    fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            client_id: CLIENT_ID
        })
    });
}
```

**After (with PKCE):**
```javascript
// Modern authorization code flow with PKCE
async function login() {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();  // NEW
    const codeChallenge = await generateCodeChallenge(codeVerifier);  // NEW
    
    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('pkce_verifier', codeVerifier);  // NEW
    
    const authUrl = `${AUTH_ENDPOINT}?` +
        `response_type=code&` +
        `client_id=${CLIENT_ID}&` +
        `redirect_uri=${REDIRECT_URI}&` +
        `state=${state}&` +
        `code_challenge=${codeChallenge}&` +  // NEW
        `code_challenge_method=S256`;  // NEW
    
    window.location = authUrl;
}

async function handleCallback() {
    const code = new URLSearchParams(window.location.search).get('code');
    const verifier = sessionStorage.getItem('pkce_verifier');  // NEW
    
    // Exchange code with PKCE
    const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            client_id: CLIENT_ID,
            code_verifier: verifier  // NEW
        })
    });
    
    sessionStorage.removeItem('pkce_verifier');  // NEW (cleanup)
}
```

### 20.4 Testing During Migration

**Backward Compatibility Test:**
```python
def test_backward_compatibility():
    """Test that old clients still work during migration"""
    # Old client (without PKCE)
    response1 = client.get('/authorize', query_string={
        'response_type': 'code',
        'client_id': 'old_client'
        # No code_challenge
    })
    
    # Should still work during transition
    assert response1.status_code in [200, 302]
    
    # New client (with PKCE)
    response2 = client.get('/authorize', query_string={
        'response_type': 'code',
        'client_id': 'new_client',
        'code_challenge': 'challenge123',
        'code_challenge_method': 'S256'
    })
    
    # Should also work
    assert response2.status_code in [200, 302]
```

**Migration Completion Test:**
```python
def test_pkce_enforcement():
    """Test that PKCE is enforced after migration complete"""
    # Public client without PKCE
    response = client.get('/authorize', query_string={
        'response_type': 'code',
        'client_id': 'public_client'
        # No code_challenge - should fail!
    })
    
    # Should be rejected
    assert 'error=invalid_request' in response.location
    assert 'pkce' in response.location.lower()
```

### 20.5 Communication Plan

**Developer Communication:**
```
Subject: PKCE Required for OAuth Clients - Migration Timeline

Dear Developers,

We're upgrading our OAuth 2.0 implementation to OAuth 2.1, which 
requires PKCE (Proof Key for Code Exchange) for all authorization 
code flows.

Timeline:
- Now - Week 12: PKCE optional (test and migrate your clients)
- Week 13 - Week 20: PKCE strongly recommended
- Week 21+: PKCE REQUIRED for public clients
- Week 29+: PKCE REQUIRED for ALL clients

Resources:
- Migration Guide: https://docs.example.com/oauth/pkce-migration
- PKCE Specification: https://docs.example.com/oauth/pkce
- Code Examples: https://github.com/example/oauth-samples
- Support: oauth-support@example.com

What You Need to Do:
1. Update your OAuth library to a PKCE-supporting version
2. Test in our sandbox environment
3. Deploy to production before Week 21

If you need assistance, please contact our support team.

Best regards,
API Team
```

---

## Appendix A: Quick Reference

### PKCE Flow Summary
```
1. Generate code_verifier (43-128 chars, random)
2. Derive code_challenge = BASE64URL(SHA256(verifier))
3. Authorization request with code_challenge
4. Server stores challenge with code
5. Token request with code_verifier
6. Server validates: SHA256(verifier) == challenge
7. If match: Issue tokens
```

### Key Parameters
| Parameter | Location | Required | Format |
|-----------|----------|----------|--------|
| `code_verifier` | Token request | Yes | 43-128 chars, Base64URL |
| `code_challenge` | Auth request | Yes | 43 chars, Base64URL |
| `code_challenge_method` | Auth request | Yes | "S256" (not "plain") |

### Common Mistakes
- ❌ code_verifier too short (< 43 chars)
- ❌ Not storing code_verifier
- ❌ Using plain method
- ❌ Not validating verifier format
- ❌ Non-constant-time comparison
- ❌ PKCE optional for public clients

### OAuth 2.1 Requirements
- ✅ PKCE REQUIRED for all authorization code flows
- ✅ S256 method MUST be supported
- ✅ plain method SHOULD NOT be used
- ✅ Servers MUST enforce PKCE for public clients

---

*End of PKCE Implementation Specification*

**Document Complete - 100,000+ characters of comprehensive PKCE guidance**

**Total Coverage:**
- Complete PKCE flow explanation
- Multiple programming language examples
- Security considerations and threat mitigation
- Implementation errors and how to avoid them
- Testing and validation procedures
- Real-world scenarios
- Migration guidance
- OAuth 2.1 compliance

*"May your authorization codes be forever bound to their verifiers, and may your tokens always find their way home."*
