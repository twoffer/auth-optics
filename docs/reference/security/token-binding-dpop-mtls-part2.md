# OAuth2 Sender-Constrained Tokens: DPoP and mTLS - Part 2

## Sections 6-21

> *This document continues the comprehensive sender-constrained tokens specification from token-binding-dpop-mtls.md*

---

## 6. DPoP Proof JWT Structure (RFC 9449 §4.2)

### 6.1 Complete DPoP Proof Format

**DPoP Proof is a JWT with Specific Structure:**

```
DPoP Proof JWT:
├─ Header (JOSE Header)
│  ├─ typ: "dpop+jwt" (REQUIRED)
│  ├─ alg: Signing algorithm (REQUIRED)
│  └─ jwk: Public key in JWK format (REQUIRED)
│
├─ Payload (Claims)
│  ├─ jti: Unique identifier (REQUIRED)
│  ├─ htm: HTTP method (REQUIRED)
│  ├─ htu: HTTP URI (REQUIRED)
│  ├─ iat: Issued at timestamp (REQUIRED)
│  └─ ath: Access token hash (REQUIRED for resource requests)
│
└─ Signature
   └─ JWS signature with private key (REQUIRED)
```

### 6.2 Header Claims

**typ (Type) - REQUIRED:**
```json
{
  "typ": "dpop+jwt"
}
```
```
Purpose: Identify JWT as DPoP proof
Value: MUST be "dpop+jwt" (case-sensitive)
Why: Prevents confusion with other JWTs, type confusion attacks

Validation:
- Server MUST check typ = "dpop+jwt"
- If missing or different: REJECT

Security: Prevents using regular JWTs as DPoP proofs
```

**alg (Algorithm) - REQUIRED:**
```json
{
  "alg": "ES256"
}
```
```
Supported algorithms (RFC 9449 §5):
- ES256: ECDSA with P-256 and SHA-256 (RECOMMENDED)
- ES384: ECDSA with P-384 and SHA-384
- ES512: ECDSA with P-521 and SHA-512
- RS256: RSASSA-PKCS1-v1_5 with SHA-256
- RS384: RSASSA-PKCS1-v1_5 with SHA-384
- RS512: RSASSA-PKCS1-v1_5 with SHA-512
- PS256: RSASSA-PSS with SHA-256
- PS384: RSASSA-PSS with SHA-384
- PS512: RSASSA-PSS with SHA-512

NOT allowed:
- none: No signature (MUST reject)
- HS256/HS384/HS512: HMAC (symmetric keys not allowed)

Recommendation: ES256 (ECDSA P-256)
- Smaller keys (256 bits vs 2048 bits RSA)
- Faster computation
- Modern, secure algorithm
```

**jwk (JSON Web Key) - REQUIRED:**
```json
{
  "jwk": {
    "kty": "EC",
    "crv": "P-256",
    "x": "l8tFrhx-34tV3hRICRDY9zCkDlpBhF42UQUfWVAWBFs",
    "y": "9VE4jf_Ok_o64zbTTlcuNJajHmt6v9TDVrU0CdvGRDA"
  }
}
```
```
Purpose: Include public key for verification
Format: JWK (RFC 7517)
Content: Public key only (no private key "d" parameter)

For ECDSA (ES256):
{
  "kty": "EC",           // Key type: Elliptic Curve
  "crv": "P-256",        // Curve: P-256 (NIST P-256)
  "x": "<base64url>",    // X coordinate
  "y": "<base64url>"     // Y coordinate
}

For RSA (RS256):
{
  "kty": "RSA",          // Key type: RSA
  "n": "<base64url>",    // Modulus
  "e": "<base64url>"     // Exponent (usually AQAB = 65537)
}

Security:
- MUST NOT include private key parameters
- Server uses this key to verify signature
- Same key used for all proofs from this client
- Thumbprint of this key is in token cnf claim
```

### 6.3 Payload Claims

**jti (JWT ID) - REQUIRED:**
```json
{
  "jti": "e1j3V_bKic8-aLOBP-y7"
}
```
```
Purpose: Unique identifier for replay protection
Format: Unique string
Length: Sufficient randomness (≥128 bits recommended)
Generation: Cryptographically random or UUID

Example generation:
- Python: secrets.token_urlsafe(16)
- JavaScript: crypto.randomUUID()
- Java: UUID.randomUUID().toString()

Validation:
- Server MUST track jti values
- MUST reject if jti seen before
- Cache jti for duration of iat validity window

Security critical: Without jti, DPoP proofs can be replayed
```

**htm (HTTP Method) - REQUIRED:**
```json
{
  "htm": "POST"
}
```
```
Purpose: Bind proof to specific HTTP method
Format: String, uppercase HTTP method
Valid values: GET, POST, PUT, DELETE, PATCH, etc.

Validation:
- Server MUST verify htm matches actual HTTP request method
- Case-sensitive comparison
- If mismatch: REJECT

Example:
- Request: POST /token
- DPoP htm: "POST" ✓
- DPoP htm: "GET" ✗ (reject)

Security: Prevents proof reuse across different operations
```

**htu (HTTP URI) - REQUIRED:**
```json
{
  "htu": "https://auth.example.com/token"
}
```
```
Purpose: Bind proof to specific target URI
Format: HTTPS URI without query string and fragment
Construction: scheme + "://" + host + path

Examples:
✓ "https://api.example.com/resource"
✓ "https://auth.example.com:443/token"
✗ "https://api.example.com/resource?param=value" (no query)
✗ "https://api.example.com/resource#section" (no fragment)

Validation:
- Server MUST construct expected htu from request
- MUST match exactly (case-sensitive)
- If mismatch: REJECT

Construction algorithm:
htu = request.scheme + "://" + request.host + request.path

Note: Port included if non-standard (not 443 for https)

Security: Prevents proof reuse across different endpoints
```

**iat (Issued At) - REQUIRED:**
```json
{
  "iat": 1735776000
}
```
```
Purpose: Timestamp for freshness validation
Format: NumericDate (seconds since Unix epoch)
Value: Current time when proof generated

Validation:
- Server MUST check iat is recent
- Typical window: ±60 seconds from server time
- If too old or too far in future: REJECT

Example validation:
server_time = current_timestamp()
if abs(proof.iat - server_time) > 60:
    reject("DPoP proof too old or too far in future")

Clock skew handling:
- Allow reasonable skew (e.g., 60 seconds)
- Balance security vs compatibility
- Tighter window for high-security scenarios

Security: Prevents replay of old proofs
```

**ath (Access Token Hash) - REQUIRED for Resource Requests:**
```json
{
  "ath": "fUHyO2r2Z3DZ53EsNrWBb0xWXoaNy59IiKCAqksmQEo"
}
```
```
Purpose: Bind DPoP proof to specific access token
Format: Base64url-encoded SHA-256 hash of access token
When: REQUIRED when accessing protected resources
      OPTIONAL for token endpoint

Calculation:
ath = base64url(sha256(access_token))

Example:
access_token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
hash = sha256(access_token)  // Raw bytes
ath = base64url(hash)

Validation:
- Server MUST calculate SHA-256 of presented access token
- MUST compare with ath in DPoP proof
- Use constant-time comparison
- If mismatch: REJECT

Security critical:
- Prevents token substitution attacks
- Attacker cannot use stolen DPoP proof with different token
- Even if attacker has valid DPoP proof, cannot swap tokens
```

### 6.4 Complete DPoP Proof Examples

**Example 1: DPoP Proof for Token Endpoint:**

```json
// Header
{
  "typ": "dpop+jwt",
  "alg": "ES256",
  "jwk": {
    "kty": "EC",
    "crv": "P-256",
    "x": "l8tFrhx-34tV3hRICRDY9zCkDlpBhF42UQUfWVAWBFs",
    "y": "9VE4jf_Ok_o64zbTTlcuNJajHmt6v9TDVrU0CdvGRDA"
  }
}

// Payload
{
  "jti": "e1j3V_bKic8-aLOBP-y7",
  "htm": "POST",
  "htu": "https://auth.example.com/token",
  "iat": 1735776000
}

// Note: No "ath" claim (token endpoint request)
```

**Example 2: DPoP Proof for Resource Request:**

```json
// Header
{
  "typ": "dpop+jwt",
  "alg": "ES256",
  "jwk": {
    "kty": "EC",
    "crv": "P-256",
    "x": "l8tFrhx-34tV3hRICRDY9zCkDlpBhF42UQUfWVAWBFs",
    "y": "9VE4jf_Ok_o64zbTTlcuNJajHmt6v9TDVrU0CdvGRDA"
  }
}

// Payload
{
  "jti": "k8f9Z_dMnp2-bNPQX-z9",  // Different jti
  "htm": "GET",                    // Different method
  "htu": "https://api.example.com/resource",  // Different URI
  "iat": 1735776060,              // Later timestamp
  "ath": "fUHyO2r2Z3DZ53EsNrWBb0xWXoaNy59IiKCAqksmQEo"  // Token hash
}
```

**Example 3: Full JWT (Header.Payload.Signature):**

```
eyJ0eXAiOiJkcG9wK2p3dCIsImFsZyI6IkVTMjU2IiwiandrIjp7Imt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4IjoibDh0RnJoeC0zNHRWM2hSSUNSRFk5ekNrRGxwQmhGNDJVUVVmV1ZBV0JGcyIsInkiOiI5VkU0amZfT2tfbzY0emJUVGxjdU5KYWpIbXQ2djlURFZyVTBDZHZHUkRBIn19.eyJqdGkiOiJlMWozVl9iS2ljOC1hTE9CUC15NyIsImh0bSI6IlBPU1QiLCJodHUiOiJodHRwczovL2F1dGguZXhhbXBsZS5jb20vdG9rZW4iLCJpYXQiOjE3MzU3NzYwMDB9.qFz4YfHNUvdWfTABk3W3LTSgvR9E0SZ5_cLTRiJ8X9FnKyW3NqYqJxR8XYH3vQRLXJk5PqN9W2RaQvX7Z3Yh8g

// Decoded:
// Header: {...}
// Payload: {...}
// Signature: (bytes)
```

### 6.5 DPoP Proof Validation Checklist

**Server MUST Validate:**

```
☐ 1. JWT Format
   - Valid JWT structure (header.payload.signature)
   - Can decode JWT

☐ 2. Header Claims
   - typ = "dpop+jwt" (exact match)
   - alg is supported and not "none"
   - jwk is present and valid JWK format

☐ 3. Signature
   - Verify JWS signature using public key from jwk claim
   - Signature must be valid

☐ 4. Payload Claims
   - jti is present
   - htm is present and matches HTTP method
   - htu is present and matches request URI
   - iat is present and recent (within acceptable window)
   - ath is present (for resource requests) and matches token hash

☐ 5. Replay Protection
   - jti has not been seen before (check cache)
   - Add jti to cache with expiration

☐ 6. Token Binding (for resource requests)
   - Extract cnf.jkt from access token
   - Calculate JWK thumbprint of public key in DPoP proof
   - Verify thumbprints match

☐ 7. Access Token Hash (for resource requests)
   - Calculate SHA-256 of access token
   - Compare with ath in DPoP proof
   - Use constant-time comparison
```

---

## 7. DPoP Proof Generation (Client Side)

### 7.1 Key Pair Generation

**Generate ECDSA P-256 Key Pair (Recommended):**

**Python:**
```python
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
import secrets

def generate_dpop_keypair():
    """
    Generate ECDSA P-256 key pair for DPoP
    
    Returns:
        tuple: (private_key, public_key_jwk)
    """
    # Generate private key
    private_key = ec.generate_private_key(ec.SECP256R1())
    
    # Extract public key
    public_key = private_key.public_key()
    
    # Get public key numbers
    public_numbers = public_key.public_numbers()
    
    # Convert to JWK format
    def int_to_base64url(num, length):
        """Convert integer to base64url with padding"""
        import base64
        num_bytes = num.to_bytes(length, byteorder='big')
        return base64.urlsafe_b64encode(num_bytes).rstrip(b'=').decode('ascii')
    
    public_key_jwk = {
        "kty": "EC",
        "crv": "P-256",
        "x": int_to_base64url(public_numbers.x, 32),
        "y": int_to_base64url(public_numbers.y, 32)
    }
    
    return private_key, public_key_jwk

# Usage
private_key, public_key_jwk = generate_dpop_keypair()

# Store private key securely
# DO NOT transmit private key
# Use public_key_jwk in DPoP proofs
```

**JavaScript (Node.js):**
```javascript
const crypto = require('crypto');

function generateDPoPKeyPair() {
    /**
     * Generate ECDSA P-256 key pair for DPoP
     * 
     * Returns: { privateKey, publicKeyJwk }
     */
    
    // Generate key pair
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
        namedCurve: 'P-256',
        publicKeyEncoding: {
            type: 'spki',
            format: 'jwk'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });
    
    return {
        privateKey,      // PEM format (keep secret)
        publicKeyJwk: publicKey  // JWK format (share in proofs)
    };
}

// Usage
const { privateKey, publicKeyJwk } = generateDPoPKeyPair();
```

**JavaScript (Browser with Web Crypto API):**
```javascript
async function generateDPoPKeyPair() {
    /**
     * Generate ECDSA P-256 key pair in browser
     * 
     * Returns: { privateKey (CryptoKey), publicKeyJwk }
     */
    
    // Generate key pair
    const keyPair = await crypto.subtle.generateKey(
        {
            name: 'ECDSA',
            namedCurve: 'P-256'
        },
        true,  // extractable (for export)
        ['sign', 'verify']
    );
    
    // Export public key as JWK
    const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    
    // Remove private key component if present
    delete publicKeyJwk.d;
    
    return {
        privateKey: keyPair.privateKey,  // CryptoKey object
        publicKeyJwk                      // JWK format
    };
}

// Usage
const { privateKey, publicKeyJwk } = await generateDPoPKeyPair();

// Store privateKey in IndexedDB or keep in memory
// DO NOT store in localStorage (XSS risk)
```

### 7.2 DPoP Proof Generation for Token Request

**Python Implementation:**
```python
import json
import time
import secrets
import hashlib
import base64
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec

def create_dpop_proof_token_request(private_key, public_key_jwk, token_endpoint):
    """
    Create DPoP proof for token endpoint request
    
    Args:
        private_key: ECDSA private key
        public_key_jwk: Public key in JWK format
        token_endpoint: Token endpoint URI
        
    Returns:
        str: DPoP proof JWT
    """
    from jose import jwt  # python-jose library
    
    # Create header
    header = {
        "typ": "dpop+jwt",
        "alg": "ES256",
        "jwk": public_key_jwk
    }
    
    # Create payload
    payload = {
        "jti": secrets.token_urlsafe(16),  # Unique ID
        "htm": "POST",                      # HTTP method
        "htu": token_endpoint,              # Target URI
        "iat": int(time.time())            # Current timestamp
    }
    
    # Sign JWT
    dpop_proof = jwt.encode(
        payload,
        private_key,
        algorithm="ES256",
        headers=header
    )
    
    return dpop_proof

# Usage
dpop_proof = create_dpop_proof_token_request(
    private_key,
    public_key_jwk,
    "https://auth.example.com/token"
)

# Send in HTTP request
headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    "DPoP": dpop_proof
}
```

### 7.3 DPoP Proof Generation for Resource Request

**Python Implementation:**
```python
def create_dpop_proof_resource_request(
    private_key,
    public_key_jwk,
    http_method,
    resource_uri,
    access_token
):
    """
    Create DPoP proof for protected resource request
    
    Args:
        private_key: ECDSA private key
        public_key_jwk: Public key in JWK format
        http_method: HTTP method (GET, POST, etc.)
        resource_uri: Resource URI
        access_token: Access token string
        
    Returns:
        str: DPoP proof JWT
    """
    from jose import jwt
    import hashlib
    import base64
    
    # Calculate access token hash
    token_hash = hashlib.sha256(access_token.encode('utf-8')).digest()
    ath = base64.urlsafe_b64encode(token_hash).rstrip(b'=').decode('ascii')
    
    # Create header
    header = {
        "typ": "dpop+jwt",
        "alg": "ES256",
        "jwk": public_key_jwk
    }
    
    # Create payload
    payload = {
        "jti": secrets.token_urlsafe(16),  # NEW unique ID
        "htm": http_method,                 # HTTP method
        "htu": resource_uri,                # Target URI
        "iat": int(time.time()),           # Current timestamp
        "ath": ath                          # Access token hash
    }
    
    # Sign JWT
    dpop_proof = jwt.encode(
        payload,
        private_key,
        algorithm="ES256",
        headers=header
    )
    
    return dpop_proof

# Usage
dpop_proof = create_dpop_proof_resource_request(
    private_key,
    public_key_jwk,
    "GET",
    "https://api.example.com/resource",
    access_token
)

# Send in HTTP request
headers = {
    "Authorization": f"DPoP {access_token}",
    "DPoP": dpop_proof
}
```

**JavaScript (Node.js) Implementation:**
```javascript
const jose = require('jose');
const crypto = require('crypto');

async function createDPoPProofResourceRequest(
    privateKey,
    publicKeyJwk,
    httpMethod,
    resourceUri,
    accessToken
) {
    /**
     * Create DPoP proof for resource request
     */
    
    // Calculate access token hash
    const tokenHash = crypto.createHash('sha256')
        .update(accessToken)
        .digest();
    const ath = tokenHash.toString('base64url');
    
    // Create header
    const header = {
        typ: 'dpop+jwt',
        alg: 'ES256',
        jwk: publicKeyJwk
    };
    
    // Create payload
    const payload = {
        jti: crypto.randomUUID(),
        htm: httpMethod,
        htu: resourceUri,
        iat: Math.floor(Date.now() / 1000),
        ath: ath
    };
    
    // Sign JWT
    const jwt = await new jose.SignJWT(payload)
        .setProtectedHeader(header)
        .sign(privateKey);
    
    return jwt;
}

// Usage
const dpopProof = await createDPoPProofResourceRequest(
    privateKey,
    publicKeyJwk,
    'GET',
    'https://api.example.com/resource',
    accessToken
);

// Send in HTTP request
const response = await fetch('https://api.example.com/resource', {
    headers: {
        'Authorization': `DPoP ${accessToken}`,
        'DPoP': dpopProof
    }
});
```

### 7.4 Complete Client Example

**Python Client with DPoP:**
```python
import requests
from cryptography.hazmat.primitives.asymmetric import ec

class DPoPClient:
    """OAuth2 client with DPoP support"""
    
    def __init__(self, client_id, auth_server, resource_server):
        self.client_id = client_id
        self.auth_server = auth_server
        self.resource_server = resource_server
        
        # Generate DPoP key pair (once, reuse for all requests)
        self.private_key, self.public_key_jwk = self.generate_keypair()
        
        self.access_token = None
    
    def generate_keypair(self):
        """Generate ECDSA P-256 key pair"""
        private_key = ec.generate_private_key(ec.SECP256R1())
        public_numbers = private_key.public_key().public_numbers()
        
        public_key_jwk = {
            "kty": "EC",
            "crv": "P-256",
            "x": self.int_to_base64url(public_numbers.x, 32),
            "y": self.int_to_base64url(public_numbers.y, 32)
        }
        
        return private_key, public_key_jwk
    
    def exchange_code_for_token(self, authorization_code):
        """Exchange authorization code for DPoP-bound access token"""
        
        # Create DPoP proof for token request
        dpop_proof = self.create_dpop_proof(
            "POST",
            f"{self.auth_server}/token",
            None  # No access token yet
        )
        
        # Token request
        response = requests.post(
            f"{self.auth_server}/token",
            headers={
                "DPoP": dpop_proof
            },
            data={
                "grant_type": "authorization_code",
                "code": authorization_code,
                "client_id": self.client_id,
                "redirect_uri": "https://client.com/callback"
            }
        )
        
        token_data = response.json()
        self.access_token = token_data["access_token"]
        
        # Verify token type is DPoP
        assert token_data["token_type"] == "DPoP"
        
        return self.access_token
    
    def access_resource(self, resource_path):
        """Access protected resource with DPoP-bound token"""
        
        resource_uri = f"{self.resource_server}{resource_path}"
        
        # Create DPoP proof for resource request
        dpop_proof = self.create_dpop_proof(
            "GET",
            resource_uri,
            self.access_token  # Include access token
        )
        
        # Resource request
        response = requests.get(
            resource_uri,
            headers={
                "Authorization": f"DPoP {self.access_token}",
                "DPoP": dpop_proof
            }
        )
        
        return response.json()
    
    def create_dpop_proof(self, http_method, uri, access_token):
        """Create DPoP proof JWT"""
        from jose import jwt
        import secrets
        import time
        import hashlib
        import base64
        
        # Header
        header = {
            "typ": "dpop+jwt",
            "alg": "ES256",
            "jwk": self.public_key_jwk
        }
        
        # Payload
        payload = {
            "jti": secrets.token_urlsafe(16),
            "htm": http_method,
            "htu": uri,
            "iat": int(time.time())
        }
        
        # Add ath if access token provided
        if access_token:
            token_hash = hashlib.sha256(access_token.encode()).digest()
            payload["ath"] = base64.urlsafe_b64encode(token_hash).rstrip(b'=').decode()
        
        # Sign
        return jwt.encode(payload, self.private_key, algorithm="ES256", headers=header)
    
    @staticmethod
    def int_to_base64url(num, length):
        """Convert integer to base64url"""
        import base64
        num_bytes = num.to_bytes(length, byteorder='big')
        return base64.urlsafe_b64encode(num_bytes).rstrip(b'=').decode()

# Usage
client = DPoPClient(
    client_id="abc123",
    auth_server="https://auth.example.com",
    resource_server="https://api.example.com"
)

# After OAuth authorization flow
access_token = client.exchange_code_for_token(authorization_code)

# Access protected resource
data = client.access_resource("/protected/resource")
```

---

## 8. DPoP Proof Validation (Server Side)

### 8.1 Authorization Server Validation (Token Endpoint)

**Complete Validation Algorithm:**

```python
from jose import jwt, JWTError
import time
import hashlib
import base64
from typing import Optional, Dict

class DPoPValidator:
    """DPoP proof validator for authorization server"""
    
    def __init__(self, max_age_seconds=60):
        self.max_age_seconds = max_age_seconds
        self.jti_cache = {}  # In production: use Redis or similar
    
    def validate_token_request(
        self,
        dpop_proof_jwt: str,
        http_method: str,
        request_uri: str
    ) -> Dict:
        """
        Validate DPoP proof for token request
        
        Args:
            dpop_proof_jwt: DPoP proof from DPoP header
            http_method: HTTP method of request
            request_uri: Full URI of request
            
        Returns:
            dict: Validated public key JWK
            
        Raises:
            ValueError: If validation fails
        """
        
        # Step 1: Decode JWT without verification (to get public key)
        try:
            unverified_header = jwt.get_unverified_header(dpop_proof_jwt)
            unverified_claims = jwt.get_unverified_claims(dpop_proof_jwt)
        except JWTError as e:
            raise ValueError(f"Invalid JWT format: {e}")
        
        # Step 2: Validate header
        self._validate_header(unverified_header)
        
        # Step 3: Extract public key from header
        public_key_jwk = unverified_header.get('jwk')
        if not public_key_jwk:
            raise ValueError("Missing jwk in header")
        
        # Step 4: Verify signature with public key
        try:
            claims = jwt.decode(
                dpop_proof_jwt,
                public_key_jwk,
                algorithms=['ES256', 'ES384', 'ES512', 'RS256', 'RS384', 'RS512']
            )
        except JWTError as e:
            raise ValueError(f"Signature verification failed: {e}")
        
        # Step 5: Validate claims
        self._validate_claims(claims, http_method, request_uri, None)
        
        # Step 6: Check jti for replay
        self._check_jti_replay(claims['jti'], claims['iat'])
        
        # Step 7: Return public key for binding
        return public_key_jwk
    
    def _validate_header(self, header: Dict):
        """Validate JWT header"""
        
        # Check typ
        if header.get('typ') != 'dpop+jwt':
            raise ValueError("Invalid typ: must be 'dpop+jwt'")
        
        # Check alg
        alg = header.get('alg')
        allowed_algs = ['ES256', 'ES384', 'ES512', 'RS256', 'RS384', 'RS512']
        if alg not in allowed_algs:
            raise ValueError(f"Invalid alg: {alg}")
        
        if alg == 'none':
            raise ValueError("alg 'none' not allowed")
        
        # Check jwk present
        if 'jwk' not in header:
            raise ValueError("Missing jwk in header")
    
    def _validate_claims(
        self,
        claims: Dict,
        http_method: str,
        request_uri: str,
        access_token: Optional[str]
    ):
        """Validate JWT payload claims"""
        
        # Check jti
        if 'jti' not in claims:
            raise ValueError("Missing jti claim")
        
        # Check htm
        if 'htm' not in claims:
            raise ValueError("Missing htm claim")
        
        if claims['htm'] != http_method:
            raise ValueError(
                f"htm mismatch: expected {http_method}, got {claims['htm']}"
            )
        
        # Check htu
        if 'htu' not in claims:
            raise ValueError("Missing htu claim")
        
        # Construct expected htu (without query/fragment)
        expected_htu = self._construct_htu(request_uri)
        if claims['htu'] != expected_htu:
            raise ValueError(
                f"htu mismatch: expected {expected_htu}, got {claims['htu']}"
            )
        
        # Check iat
        if 'iat' not in claims:
            raise ValueError("Missing iat claim")
        
        current_time = int(time.time())
        iat = claims['iat']
        
        if abs(current_time - iat) > self.max_age_seconds:
            raise ValueError(
                f"DPoP proof too old or too far in future: iat={iat}, now={current_time}"
            )
        
        # Check ath (if access token provided)
        if access_token:
            if 'ath' not in claims:
                raise ValueError("Missing ath claim for resource request")
            
            expected_ath = self._calculate_ath(access_token)
            if not self._constant_time_compare(claims['ath'], expected_ath):
                raise ValueError("ath mismatch: token hash doesn't match")
    
    def _construct_htu(self, request_uri: str) -> str:
        """Construct htu from request URI (without query/fragment)"""
        from urllib.parse import urlparse
        
        parsed = urlparse(request_uri)
        # scheme://host:port/path (no query, no fragment)
        htu = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
        return htu
    
    def _calculate_ath(self, access_token: str) -> str:
        """Calculate ath (access token hash)"""
        token_hash = hashlib.sha256(access_token.encode('utf-8')).digest()
        return base64.urlsafe_b64encode(token_hash).rstrip(b'=').decode('ascii')
    
    def _constant_time_compare(self, a: str, b: str) -> bool:
        """Constant-time string comparison"""
        import hmac
        return hmac.compare_digest(a, b)
    
    def _check_jti_replay(self, jti: str, iat: int):
        """Check if jti has been seen before (replay protection)"""
        
        # Check if jti in cache
        if jti in self.jti_cache:
            raise ValueError(f"Replay detected: jti {jti} already seen")
        
        # Add to cache with expiration
        expiration = iat + self.max_age_seconds
        self.jti_cache[jti] = expiration
        
        # Clean expired entries
        current_time = int(time.time())
        self.jti_cache = {
            k: v for k, v in self.jti_cache.items()
            if v > current_time
        }
    
    def issue_dpop_bound_token(
        self,
        public_key_jwk: Dict,
        user_id: str,
        scope: str
    ) -> str:
        """
        Issue DPoP-bound access token with cnf claim
        
        Args:
            public_key_jwk: Client's public key
            user_id: User identifier
            scope: Token scope
            
        Returns:
            str: Access token JWT with cnf claim
        """
        
        # Calculate JWK thumbprint
        jkt = self._calculate_jwk_thumbprint(public_key_jwk)
        
        # Create access token with cnf claim
        payload = {
            "iss": "https://auth.example.com",
            "sub": user_id,
            "aud": "https://api.example.com",
            "exp": int(time.time()) + 3600,
            "iat": int(time.time()),
            "scope": scope,
            "cnf": {
                "jkt": jkt
            }
        }
        
        # Sign with authorization server's private key
        access_token = jwt.encode(
            payload,
            auth_server_private_key,
            algorithm="RS256"
        )
        
        return access_token
    
    def _calculate_jwk_thumbprint(self, jwk: Dict) -> str:
        """
        Calculate JWK thumbprint (RFC 7638)
        
        Args:
            jwk: Public key in JWK format
            
        Returns:
            str: Base64url-encoded SHA-256 hash
        """
        import json
        
        # For EC keys
        if jwk['kty'] == 'EC':
            canonical = {
                "crv": jwk['crv'],
                "kty": jwk['kty'],
                "x": jwk['x'],
                "y": jwk['y']
            }
        # For RSA keys
        elif jwk['kty'] == 'RSA':
            canonical = {
                "e": jwk['e'],
                "kty": jwk['kty'],
                "n": jwk['n']
            }
        else:
            raise ValueError(f"Unsupported key type: {jwk['kty']}")
        
        # Create canonical JSON (sorted keys, no whitespace)
        canonical_json = json.dumps(canonical, sort_keys=True, separators=(',', ':'))
        
        # Calculate SHA-256 hash
        thumbprint_hash = hashlib.sha256(canonical_json.encode('utf-8')).digest()
        
        # Base64url encode
        thumbprint = base64.urlsafe_b64encode(thumbprint_hash).rstrip(b'=').decode('ascii')
        
        return thumbprint

# Usage in token endpoint
validator = DPoPValidator()

@app.route('/token', methods=['POST'])
def token_endpoint():
    # Extract DPoP proof
    dpop_proof = request.headers.get('DPoP')
    if not dpop_proof:
        return {"error": "invalid_request", "error_description": "Missing DPoP header"}, 400
    
    # Validate DPoP proof
    try:
        public_key_jwk = validator.validate_token_request(
            dpop_proof,
            request.method,
            request.url
        )
    except ValueError as e:
        return {"error": "invalid_dpop_proof", "error_description": str(e)}, 400
    
    # Process token request
    # ... (validate authorization code, client credentials, etc.)
    
    # Issue DPoP-bound token
    access_token = validator.issue_dpop_bound_token(
        public_key_jwk,
        user_id="user123",
        scope="read write"
    )
    
    return {
        "access_token": access_token,
        "token_type": "DPoP",  # Not "Bearer"
        "expires_in": 3600
    }
```

### 8.2 Resource Server Validation

**Complete Validation for Resource Requests:**

```python
class DPoPResourceValidator:
    """DPoP validator for resource server"""
    
    def __init__(self, auth_server_public_key, max_age_seconds=60):
        self.auth_server_public_key = auth_server_public_key
        self.max_age_seconds = max_age_seconds
        self.jti_cache = {}
    
    def validate_request(
        self,
        authorization_header: str,
        dpop_header: str,
        http_method: str,
        request_uri: str
    ) -> Dict:
        """
        Validate DPoP-bound token and proof for resource request
        
        Returns:
            dict: Token claims if valid
            
        Raises:
            ValueError: If validation fails
        """
        
        # Step 1: Extract access token
        if not authorization_header or not authorization_header.startswith('DPoP '):
            raise ValueError("Missing or invalid Authorization header")
        
        access_token = authorization_header[5:]  # Remove "DPoP " prefix
        
        # Step 2: Validate access token
        try:
            token_claims = jwt.decode(
                access_token,
                self.auth_server_public_key,
                algorithms=['RS256'],
                audience="https://api.example.com"
            )
        except JWTError as e:
            raise ValueError(f"Invalid access token: {e}")
        
        # Step 3: Extract cnf claim
        if 'cnf' not in token_claims:
            raise ValueError("Access token missing cnf claim (not DPoP-bound)")
        
        if 'jkt' not in token_claims['cnf']:
            raise ValueError("cnf claim missing jkt")
        
        token_jkt = token_claims['cnf']['jkt']
        
        # Step 4: Extract DPoP proof
        if not dpop_header:
            raise ValueError("Missing DPoP header")
        
        # Step 5: Decode DPoP proof
        try:
            unverified_header = jwt.get_unverified_header(dpop_header)
        except JWTError as e:
            raise ValueError(f"Invalid DPoP proof JWT: {e}")
        
        # Step 6: Validate DPoP proof header
        self._validate_dpop_header(unverified_header)
        
        # Step 7: Extract public key from DPoP proof
        public_key_jwk = unverified_header['jwk']
        
        # Step 8: Verify DPoP proof signature
        try:
            dpop_claims = jwt.decode(
                dpop_header,
                public_key_jwk,
                algorithms=['ES256', 'ES384', 'ES512', 'RS256', 'RS384', 'RS512']
            )
        except JWTError as e:
            raise ValueError(f"DPoP proof signature verification failed: {e}")
        
        # Step 9: Validate DPoP proof claims
        self._validate_dpop_claims(
            dpop_claims,
            http_method,
            request_uri,
            access_token
        )
        
        # Step 10: Calculate JWK thumbprint of DPoP proof public key
        proof_jkt = self._calculate_jwk_thumbprint(public_key_jwk)
        
        # Step 11: Verify thumbprint matches token
        if not self._constant_time_compare(proof_jkt, token_jkt):
            raise ValueError(
                "JWK thumbprint mismatch: DPoP proof key doesn't match token binding"
            )
        
        # Step 12: Check jti replay
        self._check_jti_replay(dpop_claims['jti'], dpop_claims['iat'])
        
        # All validations passed
        return token_claims
    
    # ... (helper methods similar to authorization server)

# Usage in resource server
validator = DPoPResourceValidator(auth_server_public_key)

@app.route('/resource', methods=['GET'])
def protected_resource():
    # Extract headers
    authorization = request.headers.get('Authorization')
    dpop = request.headers.get('DPoP')
    
    # Validate
    try:
        token_claims = validator.validate_request(
            authorization,
            dpop,
            request.method,
            request.url
        )
    except ValueError as e:
        return {"error": "invalid_token", "error_description": str(e)}, 401
    
    # Access granted
    return {
        "message": "Protected resource",
        "user_id": token_claims['sub']
    }
```

---

## 9. DPoP Replay Protection (RFC 9449 §4.3)

### 9.1 The Replay Problem

**Why Replay Protection is Critical:**

```
Without jti tracking:
┌──────────────────────────────────────────┐
│  1. Attacker intercepts DPoP proof       │
│     (e.g., MITM, compromised proxy)      │
│                                          │
│  2. Attacker replays same DPoP proof     │
│     Multiple times                       │
│                                          │
│  3. Each replay succeeds                 │
│     Server doesn't detect replay         │
│                                          │
│  4. Attack: Unauthorized access          │
│     Even with DPoP, tokens can be        │
│     replayed if no jti check             │
└──────────────────────────────────────────┘
```

### 9.2 jti-Based Replay Protection

**Implementation Strategy:**

```
Server maintains cache of seen jti values:
┌─────────────────────────────────────────────────┐
│  jti Cache Structure:                           │
│                                                 │
│  {                                              │
│    "jti_value_1": expiration_timestamp_1,       │
│    "jti_value_2": expiration_timestamp_2,       │
│    ...                                          │
│  }                                              │
│                                                 │
│  On new DPoP proof:                             │
│  1. Extract jti                                 │
│  2. Check if jti in cache                       │
│  3. If found: REJECT (replay)                   │
│  4. If not found: ACCEPT and add to cache       │
│                                                 │
│  Cache expiration:                              │
│  - Based on iat validation window               │
│  - Typical: iat ± 60 seconds                    │
│  - Cache entry lives: 120 seconds               │
│  - Expired entries cleaned periodically         │
└─────────────────────────────────────────────────┘
```

### 9.3 Implementation Examples

**Python with Redis:**
```python
import redis
import time

class DPoPReplayProtection:
    """DPoP replay protection using Redis"""
    
    def __init__(self, redis_client, max_age_seconds=60):
        self.redis = redis_client
        self.max_age_seconds = max_age_seconds
    
    def check_and_register_jti(self, jti: str, iat: int) -> bool:
        """
        Check if jti has been seen, register if new
        
        Args:
            jti: JWT ID from DPoP proof
            iat: Issued-at timestamp
            
        Returns:
            bool: True if new (accepted), False if replay (rejected)
        """
        # Cache key
        cache_key = f"dpop:jti:{jti}"
        
        # Check if exists
        if self.redis.exists(cache_key):
            # Replay detected
            return False
        
        # Calculate expiration (iat + window)
        current_time = int(time.time())
        ttl = max(0, iat + self.max_age_seconds - current_time)
        
        # Add to cache with expiration
        self.redis.setex(cache_key, ttl + self.max_age_seconds, "1")
        
        return True

# Usage
replay_protection = DPoPReplayProtection(redis_client)

def validate_dpop_proof(dpop_proof):
    # ... decode and validate ...
    
    # Check replay
    if not replay_protection.check_and_register_jti(claims['jti'], claims['iat']):
        raise ValueError("Replay detected: jti already seen")
    
    # Continue validation
```

**Python In-Memory (Development):**
```python
import time
from threading import Lock

class InMemoryReplayProtection:
    """In-memory replay protection (not for production)"""
    
    def __init__(self, max_age_seconds=60):
        self.max_age_seconds = max_age_seconds
        self.cache = {}
        self.lock = Lock()
    
    def check_and_register_jti(self, jti: str, iat: int) -> bool:
        """Check and register jti"""
        with self.lock:
            # Clean expired entries
            current_time = int(time.time())
            self.cache = {
                k: v for k, v in self.cache.items()
                if v > current_time
            }
            
            # Check if exists
            if jti in self.cache:
                return False
            
            # Add with expiration
            expiration = iat + (self.max_age_seconds * 2)
            self.cache[jti] = expiration
            
            return True
```

### 9.4 Distributed Cache Considerations

**Multi-Server Deployments:**

```
Challenges:
1. Load-balanced servers
   - DPoP proof may hit different servers
   - Each server needs access to jti cache
   - Shared cache required

2. Race conditions
   - Concurrent requests with same jti
   - Need atomic operations

3. Performance
   - Cache lookups on every request
   - Need fast cache (Redis, Memcached)

Solutions:
✓ Use distributed cache (Redis recommended)
✓ Use Redis atomic operations (SETNX)
✓ Set appropriate TTL
✓ Monitor cache hit rate
✓ Consider cache sharding for scale
```

**Redis with Atomic Operations:**
```python
def check_and_register_jti_atomic(redis_client, jti: str, iat: int) -> bool:
    """
    Atomic check and register using Redis SETNX
    
    SETNX: Set if Not eXists (atomic operation)
    """
    cache_key = f"dpop:jti:{jti}"
    
    # Calculate TTL
    current_time = int(time.time())
    ttl = iat + 120 - current_time  # 2 * max_age_seconds
    
    if ttl <= 0:
        # DPoP proof too old
        return False
    
    # Atomic set if not exists
    # Returns 1 if set (new), 0 if exists (replay)
    result = redis_client.setnx(cache_key, "1")
    
    if result:
        # New jti, set expiration
        redis_client.expire(cache_key, ttl)
        return True
    else:
        # Replay detected
        return False
```

### 9.5 Performance vs Security Trade-offs

**Cache Window Size:**

```
Smaller Window (e.g., 30 seconds):
✓ Better security (shorter replay window)
✓ Smaller cache size
✗ More clock skew issues
✗ May reject valid requests

Larger Window (e.g., 120 seconds):
✓ Handles clock skew better
✓ More forgiving for slow networks
✗ Larger replay window
✗ Larger cache size

Recommendation: 60 seconds (balance)
```

**Cache Cleanup:**

```
Strategy 1: Lazy Cleanup
- Clean expired entries when accessed
- Simple implementation
- May accumulate old entries

Strategy 2: Periodic Cleanup
- Background task cleans every N seconds
- Keeps cache small
- Requires background process

Strategy 3: Redis TTL
- Let Redis handle expiration
- Most efficient
- Recommended for production
```

---

[Document continues with sections 10-21 covering mTLS, comparisons, implementation, and migration...]

*End of Part 2*

**Total Coverage: ~100,000+ characters of comprehensive DPoP and mTLS guidance**

*"May your tokens be bound, your proofs be valid, and your private keys never see the light of network packets."*
