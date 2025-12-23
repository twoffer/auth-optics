# PKCE Implementation Specification

## Proof Key for Code Exchange - Complete Technical Reference

> *"PKCE (pronounced 'pixie') is a bit like the Somebody Else's Problem field from The Hitchhiker's Guide to the Galaxy. It makes authorization code interception attacks somebody else's problem—specifically, the problem of attackers who don't have the code_verifier, which is to say, all of them."*

---

## Document Metadata

**Full Name:** Proof Key for Code Exchange  
**Pronunciation:** "pixie" (P-K-C-E)  
**Primary RFC:** RFC 7636  
**Status:** REQUIRED for all authorization code flows in OAuth 2.1  
**Version:** 1.0.0  
**Last Updated:** December 8, 2025  

**Target Audience:**
- Security professionals implementing OAuth2 authorization code flows
- Developers debugging PKCE validation failures
- Security architects migrating from non-PKCE to PKCE implementations
- Penetration testers validating PKCE implementations

**Prerequisites:**
- Understanding of OAuth 2.0 authorization code flow (RFC 6749 §4.1)
- Basic cryptography concepts (SHA-256, Base64URL encoding)
- Understanding of public vs confidential clients

**Related Documentation:**
- [Authorization Code Flow with PKCE](../flows/authorization-code-flow-with-pkce.md) - Complete flow specification
- [OAuth2/OIDC Threat Model](./oauth2-oidc-threat-model-INDEX.md) - Security attacks and mitigations
- [Access Tokens](../tokens/access-tokens.md) - Token usage and validation

---

## Table of Contents

1. [Overview](#1-overview)
2. [The Problem PKCE Solves](#2-the-problem-pkce-solves)
3. [PKCE Flow Overview](#3-pkce-flow-overview)
4. [code_verifier Generation](#4-code_verifier-generation)
5. [code_challenge Generation](#5-code_challenge-generation)
6. [Authorization Request with PKCE](#6-authorization-request-with-pkce)
7. [Authorization Response](#7-authorization-response)
8. [Token Request with PKCE](#8-token-request-with-pkce)
9. [Server-Side Verification](#9-server-side-verification)
10. [Token Response](#10-token-response)
11. [PKCE for Public vs Confidential Clients](#11-pkce-for-public-vs-confidential-clients)
12. [Security Considerations](#12-security-considerations)
13. [PKCE Downgrade Attack](#13-pkce-downgrade-attack)
14. [Common Implementation Errors](#14-common-implementation-errors)
15. [PKCE with Different Client Types](#15-pkce-with-different-client-types)
16. [PKCE in OAuth 2.1](#16-pkce-in-oauth-21)
17. [Testing and Validation](#17-testing-and-validation)
18. [Example Scenarios](#18-example-scenarios)
19. [PKCE Libraries and Tools](#19-pkce-libraries-and-tools)
20. [Migration from non-PKCE to PKCE](#20-migration-from-non-pkce-to-pkce)

---

## 1. Overview

### 1.1 What is PKCE?

**PKCE (Proof Key for Code Exchange)** is an OAuth 2.0 extension that protects authorization codes from interception attacks by cryptographically binding the authorization code to the client instance that initiated the flow.

**Key Characteristics:**
- **RFC:** RFC 7636 - "Proof Key for Code Exchange by OAuth Public Clients"
- **Purpose:** Prevent authorization code interception attacks
- **Status in OAuth 2.0:** OPTIONAL (but widely recommended)
- **Status in OAuth 2.1:** REQUIRED for all authorization code flows
- **Security BCP:** REQUIRED for all clients (Security BCP draft-ietf-oauth-security-topics-27 §2.1.1)

### 1.2 Why PKCE Exists

Authorization codes are bearer credentials in OAuth 2.0. Anyone who intercepts an authorization code can exchange it for tokens at the token endpoint. For public clients (mobile apps, SPAs, native apps) that cannot securely store client secrets, this creates a fundamental security vulnerability.

**PKCE solves this by:**
1. Client generates a secret (`code_verifier`) that stays on the device
2. Client sends a derived challenge (`code_challenge`) in authorization request
3. Authorization server binds the code to this challenge
4. Only the client with the original `code_verifier` can exchange the code

### 1.3 Critical For Public Clients

Public clients include:
- **Mobile applications** (iOS, Android)
- **Single-page applications** (React, Vue, Angular)
- **Native desktop applications**
- **Command-line tools** with user interaction
- **Any client that cannot keep secrets confidential**

### 1.4 Requirement Status

| Specification | Public Clients | Confidential Clients | Enforcement |
|--------------|----------------|---------------------|-------------|
| **OAuth 2.0 (RFC 6749)** | Not mentioned | Not mentioned | N/A |
| **RFC 7636 (PKCE)** | SHOULD | N/A | Optional |
| **OAuth 2.1 (draft)** | REQUIRED | RECOMMENDED | Mandatory for public |
| **Security BCP** | REQUIRED | REQUIRED | Mandatory for all |
| **RFC 8252 (Native Apps)** | REQUIRED | N/A | Mandatory |

**Current Best Practice:** PKCE is REQUIRED for ALL authorization code flows, regardless of client type.

---

## 2. The Problem PKCE Solves

### 2.1 Authorization Code Interception Attack (RFC 7636 §1)

Without PKCE, authorization codes are vulnerable to interception:

**Attack Scenario:**

```
┌────────────────────────────────────────────────────────────────┐
│              Authorization Code Interception (No PKCE)         │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Victim initiates OAuth flow in legitimate app              │
│     App A (legitimate)                                          │
│                                                                 │
│  2. Victim authenticates at authorization server               │
│                                                                 │
│  3. Authorization server redirects with code:                  │
│     myapp://callback?code=AUTHORIZATION_CODE_ABC123            │
│                                                                 │
│  4. ⚠️ INTERCEPTION OCCURS                                      │
│     - Malicious App B registered same URI scheme               │
│     - OS delivers redirect to App B instead of App A           │
│     - OR: Network attacker intercepts redirect                 │
│     - OR: Code leaked via browser history/logs                 │
│                                                                 │
│  5. Attacker (App B) receives code                             │
│                                                                 │
│  6. Attacker exchanges code for tokens:                        │
│     POST /token                                                 │
│     code=AUTHORIZATION_CODE_ABC123&                             │
│     grant_type=authorization_code&                              │
│     client_id=victim_app&                                       │
│     redirect_uri=myapp://callback                              │
│                                                                 │
│  7. ✓ Authorization server issues tokens to attacker           │
│     (Cannot distinguish attacker from legitimate client)       │
│                                                                 │
│  8. 🚨 ATTACK SUCCEEDS                                          │
│     Attacker has full access to victim's account               │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### 2.2 Why Public Clients Are Vulnerable

**Public clients cannot use client secrets:**

```
Problem: No client authentication at token endpoint

Legitimate Client:
  POST /token
  code=ABC123&
  client_id=myapp
  // No client_secret (public client can't keep secrets)

Attacker:
  POST /token
  code=ABC123&  ← Intercepted code
  client_id=myapp  ← Known public client_id
  // No client_secret needed!
  
Result: Server cannot distinguish them!
```

### 2.3 Vulnerable Scenarios

**1. Native Apps with Custom URI Schemes**
```
Problem: Multiple apps can register same custom URI scheme

Legitimate app:     myapp://
Malicious app:      myapp://  ← Same scheme!

OS behavior: May present choice dialog, OR auto-route to last installed
Result: Malicious app receives authorization code
```

**2. Browser-Based Apps (SPAs)**
```
Problem: Authorization code visible in browser

Redirect: https://app.example.com/callback?code=ABC123

Code exposed to:
- Browser history
- Browser extensions
- Referrer headers (if page navigates away)
- Developer console
- Any JavaScript on the page
```

**3. Malware on User Device**
```
Problem: Malware can intercept network traffic or monitor URLs

Malware capabilities:
- Monitor clipboard for OAuth redirect URLs
- Hook into URL handling
- Read browser history
- Intercept network requests
```

### 2.4 The PKCE Solution

**With PKCE, authorization codes are bound to client instance:**

```
┌────────────────────────────────────────────────────────────────┐
│           Authorization Code Protected with PKCE                │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Legitimate client generates secret:                        │
│     code_verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1g..."   │
│     (Client keeps this SECRET)                                  │
│                                                                 │
│  2. Client derives challenge:                                  │
│     code_challenge = SHA256(code_verifier)                     │
│     code_challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URW..."     │
│                                                                 │
│  3. Authorization request includes challenge:                  │
│     GET /authorize?                                             │
│         code_challenge=E9Melhoa2...&                            │
│         code_challenge_method=S256&                             │
│         client_id=myapp&...                                     │
│                                                                 │
│  4. Server stores code_challenge with authorization code       │
│                                                                 │
│  5. Server redirects with code:                                │
│     myapp://callback?code=ABC123                               │
│                                                                 │
│  6. ⚠️ ATTACKER INTERCEPTS CODE                                 │
│                                                                 │
│  7. Attacker attempts token exchange:                          │
│     POST /token                                                 │
│     code=ABC123&                                                │
│     client_id=myapp&                                            │
│     code_verifier=??? ← ATTACKER DOESN'T HAVE THIS!            │
│                                                                 │
│  8. ❌ ATTACK FAILS                                             │
│     Server: "Invalid code_verifier"                            │
│     Attacker cannot exchange code without verifier             │
│                                                                 │
│  9. Legitimate client exchanges code:                          │
│     POST /token                                                 │
│     code=ABC123&                                                │
│     code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1g...       │
│                                                                 │
│ 10. ✓ SUCCESS                                                   │
│     Server validates: SHA256(verifier) == stored_challenge     │
│     Tokens issued to legitimate client only                    │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### 2.5 Security Guarantee

**PKCE ensures:**
- Authorization code can ONLY be exchanged by the client instance that initiated the flow
- Intercepted codes are useless without the `code_verifier`
- Each client instance has a unique `code_verifier` per flow
- Even if attacker obtains `code_challenge`, they cannot reverse it to get `code_verifier` (one-way hash)

**Attack Prevention:**
- ✅ Custom URI scheme hijacking → Blocked
- ✅ Network interception → Blocked  
- ✅ Browser history leakage → Blocked
- ✅ Malware code theft → Blocked
- ✅ Code injection attacks → Blocked

---

## 3. PKCE Flow Overview

### 3.1 PKCE Components

PKCE introduces two related secrets:

| Component | Description | Visibility | Location |
|-----------|-------------|------------|----------|
| **code_verifier** | High-entropy random string | PRIVATE | Client only |
| **code_challenge** | Derived from code_verifier | PUBLIC | Authorization server |

**Relationship:**
```
code_verifier (secret)
    ↓ SHA-256
    ↓ Base64URL
code_challenge (public)
```

### 3.2 Complete PKCE Flow Diagram

```
┌──────────────┐                                      ┌──────────────────┐
│    Client    │                                      │  Authorization   │
│  (Web/App)   │                                      │     Server       │
└──────┬───────┘                                      └────────┬─────────┘
       │                                                       │
       │ 1. Generate code_verifier (random, 43-128 chars)    │
       │    code_verifier = "dBjftJeZ4CVP-mB92K27uhbU..."    │
       │                                                       │
       │ 2. Derive code_challenge                             │
       │    code_challenge = BASE64URL(SHA256(verifier))      │
       │    code_challenge = "E9Melhoa2OwvFrEMTJguCH..."     │
       │                                                       │
       │ 3. Authorization Request                             │
       │──────────────────────────────────────────────────────>│
       │    GET /authorize?                                   │
       │      response_type=code&                             │
       │      client_id=s6BhdRkqt3&                           │
       │      state=xyz&                                      │
       │      code_challenge=E9Melhoa2...&                    │
       │      code_challenge_method=S256                      │
       │                                                       │
       │                                       4. Store:       │
       │                                          auth_code    │
       │                                          ↓            │
       │                                       code_challenge  │
       │                                       method          │
       │                                                       │
       │                    5. User authenticates & authorizes│
       │                                                       │
       │ 6. Authorization Response (redirect)                 │
       │<──────────────────────────────────────────────────────│
       │    302 Found                                         │
       │    Location: https://client.com/cb?                  │
       │              code=SplxlOBeZQQYbYS6WxSbIA&            │
       │              state=xyz                               │
       │                                                       │
       │ 7. Token Request                                     │
       │──────────────────────────────────────────────────────>│
       │    POST /token                                       │
       │      grant_type=authorization_code&                  │
       │      code=SplxlOBeZQQYbYS6WxSbIA&                   │
       │      redirect_uri=https://client.com/cb&             │
       │      client_id=s6BhdRkqt3&                          │
       │      code_verifier=dBjftJeZ4CVP-mB92K27uhbU...      │
       │                                                       │
       │                                   8. Verify:          │
       │                                      SHA256(verifier) │
       │                                           ==          │
       │                                      stored_challenge │
       │                                                       │
       │ 9. Token Response                                    │
       │<──────────────────────────────────────────────────────│
       │    200 OK                                            │
       │    {                                                 │
       │      "access_token": "2YotnFZFEjr1zCsicMWpAA",      │
       │      "token_type": "Bearer",                        │
       │      "expires_in": 3600,                            │
       │      "refresh_token": "tGzv3JOkF0XG5Qx2TlKWIA"     │
       │    }                                                 │
       │                                                       │
```

### 3.3 PKCE Workflow Steps

**Step-by-Step Process:**

1. **Client generates code_verifier**
   - Creates cryptographically random string (43-128 characters)
   - Stores in memory/session (never sends in authorization request)

2. **Client derives code_challenge**
   - Applies transformation: `SHA256(code_verifier)` then Base64URL encode
   - This can be sent publicly (one-way transformation)

3. **Authorization request with challenge**
   - Client sends `code_challenge` and `code_challenge_method` in request
   - Authorization server stores challenge with the authorization code

4. **User authenticates**
   - Standard OAuth flow (user login, consent screen)
   - Authorization server issues authorization code

5. **Code returned to client**
   - Standard redirect with `code` parameter
   - Code is bound to the stored challenge

6. **Token request with verifier**
   - Client sends original `code_verifier` (the secret)
   - Authorization server validates verifier against stored challenge

7. **Verification**
   - Server applies same transformation to received verifier
   - Compares result with stored challenge
   - If match: Issue tokens
   - If mismatch: Reject with `invalid_grant`

### 3.4 Key Security Properties

**Binding Mechanism:**
```
Authorization Code ←──bound to──→ code_challenge
                                         ↑
                                    derived from
                                         │
                                  code_verifier
                                  (client secret)
```

**Protection Properties:**
- **Forward Secrecy:** Each flow uses unique `code_verifier`
- **Challenge-Response:** Server verifies client possesses secret
- **One-Way Binding:** Cannot derive `code_verifier` from `code_challenge`
- **Instance Binding:** Binds code to specific client instance, not just client_id

---

## 4. code_verifier Generation

### 4.1 Specification Requirements (RFC 7636 §4.1)

The `code_verifier` is a cryptographically random string that MUST meet these requirements:

| Requirement | Specification | Rationale |
|-------------|---------------|-----------|
| **Length** | 43-128 characters | Sufficient entropy, not excessive |
| **Character Set** | `[A-Z] [a-z] [0-9] - . _ ~` | Unreserved URI characters (RFC 3986) |
| **Randomness** | Cryptographically secure | Prevent brute force attacks |
| **Entropy** | Minimum 256 bits | ~43 chars of Base64URL = 256 bits |

**RFC 2119 Language:**
> A "code_verifier" is a cryptographically random string that is used to correlate the authorization request to the token request. The client creates and records a secret named the "code_verifier" and derives a transformed version "t(code_verifier)" (referred to as the "code_challenge"), which is sent in the authorization request along with the transformation method "t_m". (RFC 7636 §4.1)

### 4.2 Generation Algorithm

**Standard Generation Process:**

```
1. Generate random bytes
   random_bytes = securely_random(32)  // 32 bytes = 256 bits

2. Base64URL encode (no padding)
   code_verifier = base64url_encode_no_padding(random_bytes)

3. Verify length
   assert 43 <= length(code_verifier) <= 128

Result: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
        (43 characters, 256 bits of entropy)
```

### 4.3 Code Examples

**Python:**
```python
import secrets
import base64

def generate_code_verifier():
    """
    Generate PKCE code_verifier per RFC 7636 §4.1
    
    Returns:
        str: Base64URL-encoded random string (43 chars, 256 bits entropy)
    """
    # Generate 32 random bytes (256 bits)
    random_bytes = secrets.token_bytes(32)
    
    # Base64URL encode without padding
    code_verifier = base64.urlsafe_b64encode(random_bytes).decode('utf-8')
    code_verifier = code_verifier.rstrip('=')  # Remove padding
    
    # Verify requirements
    assert 43 <= len(code_verifier) <= 128, "Invalid verifier length"
    
    return code_verifier

# Example usage
verifier = generate_code_verifier()
print(f"code_verifier: {verifier}")
# Output: dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

**JavaScript/Node.js:**
```javascript
const crypto = require('crypto');

/**
 * Generate PKCE code_verifier per RFC 7636 §4.1
 * 
 * @returns {string} Base64URL-encoded random string (43 chars, 256 bits)
 */
function generateCodeVerifier() {
    // Generate 32 random bytes (256 bits)
    const randomBytes = crypto.randomBytes(32);
    
    // Base64URL encode without padding
    const codeVerifier = randomBytes
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    
    // Verify requirements
    if (codeVerifier.length < 43 || codeVerifier.length > 128) {
        throw new Error('Invalid verifier length');
    }
    
    return codeVerifier;
}

// Example usage
const verifier = generateCodeVerifier();
console.log(`code_verifier: ${verifier}`);
// Output: dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

**Swift (iOS):**
```swift
import Foundation
import CommonCrypto

/**
 Generate PKCE code_verifier per RFC 7636 §4.1
 
 - Returns: Base64URL-encoded random string (43 chars, 256 bits)
 */
func generateCodeVerifier() -> String {
    // Generate 32 random bytes (256 bits)
    var randomBytes = [UInt8](repeating: 0, count: 32)
    let result = SecRandomCopyBytes(kSecRandomDefault, 32, &randomBytes)
    
    guard result == errSecSuccess else {
        fatalError("Failed to generate random bytes")
    }
    
    // Base64URL encode without padding
    let data = Data(randomBytes)
    var codeVerifier = data.base64EncodedString()
        .replacingOccurrences(of: "+", with: "-")
        .replacingOccurrences(of: "/", with: "_")
        .replacingOccurrences(of: "=", with: "")
    
    // Verify requirements
    assert((43...128).contains(codeVerifier.count), "Invalid verifier length")
    
    return codeVerifier
}

// Example usage
let verifier = generateCodeVerifier()
print("code_verifier: \(verifier)")
// Output: dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

**Java:**
```java
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Generate PKCE code_verifier per RFC 7636 §4.1
 * 
 * @return Base64URL-encoded random string (43 chars, 256 bits)
 */
public static String generateCodeVerifier() {
    // Generate 32 random bytes (256 bits)
    SecureRandom secureRandom = new SecureRandom();
    byte[] randomBytes = new byte[32];
    secureRandom.nextBytes(randomBytes);
    
    // Base64URL encode without padding
    String codeVerifier = Base64.getUrlEncoder()
        .withoutPadding()
        .encodeToString(randomBytes);
    
    // Verify requirements
    if (codeVerifier.length() < 43 || codeVerifier.length() > 128) {
        throw new IllegalStateException("Invalid verifier length");
    }
    
    return codeVerifier;
}

// Example usage
String verifier = generateCodeVerifier();
System.out.println("code_verifier: " + verifier);
// Output: dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

### 4.4 Common Mistakes

**❌ VULNERABLE: Non-random values**
```python
# DON'T: Using timestamp (predictable!)
code_verifier = base64.urlsafe_b64encode(
    str(time.time()).encode()
).decode().rstrip('=')

# DON'T: Using user input
code_verifier = base64.urlsafe_b64encode(
    user_id.encode()
).decode().rstrip('=')

# DON'T: Using pseudorandom (not cryptographic)
import random  # ← NOT SECURE
code_verifier = ''.join(random.choices(string.ascii_letters, k=43))
```

**❌ VULNERABLE: Insufficient entropy**
```python
# DON'T: Too short (< 43 characters)
random_bytes = secrets.token_bytes(16)  # Only 128 bits
code_verifier = base64.urlsafe_b64encode(random_bytes).decode().rstrip('=')
# Length: ~22 characters - INSUFFICIENT!
```

**❌ VULNERABLE: Invalid character set**
```python
# DON'T: Using characters outside allowed set
code_verifier = "my-verifier-with-spaces and/slashes"  # Invalid!

# Allowed: [A-Z] [a-z] [0-9] - . _ ~
# NOT allowed: spaces, /, \, etc.
```

**❌ VULNERABLE: Not storing verifier**
```javascript
// DON'T: Generate but not store
function initiateOAuth() {
    const verifier = generateCodeVerifier();
    const challenge = generateChallenge(verifier);
    
    // Send challenge in auth request
    window.location = buildAuthUrl(challenge);
    
    // ❌ verifier lost! Cannot use in token request
}

// DO: Store verifier for later use
function initiateOAuth() {
    const verifier = generateCodeVerifier();
    const challenge = generateChallenge(verifier);
    
    // ✅ Store verifier
    sessionStorage.setItem('pkce_verifier', verifier);
    
    window.location = buildAuthUrl(challenge);
}
```

### 4.5 Security Considerations

**Entropy Requirements:**
```
Minimum entropy: 256 bits
Recommended:     256 bits (32 bytes)
Maximum:         1024 bits (128 bytes)

Calculation:
- Base64URL encoding: 6 bits per character
- 43 characters × 6 bits = 258 bits ✓
- 128 characters × 6 bits = 768 bits ✓
```

**Brute Force Resistance:**
```
With 256 bits of entropy:
Possible values: 2^256 ≈ 1.16 × 10^77

Brute force attempts:
- 1 billion attempts/second
- Would take 3.67 × 10^60 years

Conclusion: Effectively impossible to brute force
```

**Storage Requirements:**
```
Client-side storage (temporary):
- Session storage (web)
- Memory (native apps)
- Secure temporary storage (clear after use)

DON'T store:
- In cookies accessible to JavaScript
- In localStorage (persists too long)
- In URL parameters
- In logs
```

---

## 5. code_challenge Generation

### 5.1 Transformation Methods (RFC 7636 §4.2)

PKCE supports two transformation methods for deriving `code_challenge` from `code_verifier`:

| Method | Transformation | Security | Status |
|--------|---------------|----------|--------|
| **S256** | `BASE64URL(SHA256(code_verifier))` | Strong | RECOMMENDED |
| **plain** | `code_challenge = code_verifier` | Weak | NOT RECOMMENDED |

**RFC 2119 Language:**
> If the client is capable of using "S256", it MUST use "S256", as "S256" is Mandatory To Implement (MTI) on the server. Clients are permitted to use "plain" only if they cannot support "S256" for some technical reason and know via out-of-band configuration that the server supports "plain". (RFC 7636 §4.2)

### 5.2 S256 Transformation (RECOMMENDED)

**Algorithm:**
```
code_challenge = BASE64URL(SHA256(ASCII(code_verifier)))
```

**Step-by-Step:**
```
1. Take code_verifier (ASCII string)
   "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"

2. Compute SHA-256 hash
   SHA256 = 11f25da9762c8a4a8ee61ffb2f8d9d0f...

3. Base64URL encode (no padding)
   code_challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
```

### 5.3 Code Examples

**Python:**
```python
import hashlib
import base64

def generate_code_challenge(code_verifier):
    """
    Generate PKCE code_challenge using S256 method (RFC 7636 §4.2)
    
    Args:
        code_verifier: The code verifier string
        
    Returns:
        str: Base64URL-encoded SHA256 hash of verifier
    """
    # Compute SHA-256 hash
    sha256_hash = hashlib.sha256(code_verifier.encode('ascii')).digest()
    
    # Base64URL encode without padding
    code_challenge = base64.urlsafe_b64encode(sha256_hash).decode('utf-8')
    code_challenge = code_challenge.rstrip('=')
    
    return code_challenge

# Example
verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
challenge = generate_code_challenge(verifier)
print(f"code_challenge: {challenge}")
# Output: E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
```

**JavaScript:**
```javascript
const crypto = require('crypto');

/**
 * Generate PKCE code_challenge using S256 method (RFC 7636 §4.2)
 * 
 * @param {string} codeVerifier - The code verifier string
 * @returns {string} Base64URL-encoded SHA256 hash
 */
function generateCodeChallenge(codeVerifier) {
    // Compute SHA-256 hash
    const sha256Hash = crypto
        .createHash('sha256')
        .update(codeVerifier)
        .digest();
    
    // Base64URL encode without padding
    const codeChallenge = sha256Hash
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    
    return codeChallenge;
}

// Browser-compatible version using Web Crypto API
async function generateCodeChallengeWeb(codeVerifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    
    // Compute SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Convert to Base64URL
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashBase64 = btoa(String.fromCharCode(...hashArray))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    
    return hashBase64;
}

// Example
const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
const challenge = generateCodeChallenge(verifier);
console.log(`code_challenge: ${challenge}`);
// Output: E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
```

**Swift:**
```swift
import Foundation
import CommonCrypto

/**
 Generate PKCE code_challenge using S256 method (RFC 7636 §4.2)
 
 - Parameter codeVerifier: The code verifier string
 - Returns: Base64URL-encoded SHA256 hash
 */
func generateCodeChallenge(codeVerifier: String) -> String {
    // Compute SHA-256 hash
    guard let data = codeVerifier.data(using: .ascii) else {
        fatalError("Invalid code_verifier")
    }
    
    var hash = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
    data.withUnsafeBytes {
        _ = CC_SHA256($0.baseAddress, CC_LONG(data.count), &hash)
    }
    
    // Base64URL encode without padding
    let hashData = Data(hash)
    var codeChallenge = hashData.base64EncodedString()
        .replacingOccurrences(of: "+", with: "-")
        .replacingOccurrences(of: "/", with: "_")
        .replacingOccurrences(of: "=", with: "")
    
    return codeChallenge
}

// Example
let verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
let challenge = generateCodeChallenge(codeVerifier: verifier)
print("code_challenge: \(challenge)")
// Output: E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
```

**Java:**
```java
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

/**
 * Generate PKCE code_challenge using S256 method (RFC 7636 §4.2)
 * 
 * @param codeVerifier The code verifier string
 * @return Base64URL-encoded SHA256 hash
 */
public static String generateCodeChallenge(String codeVerifier) 
        throws NoSuchAlgorithmException {
    // Compute SHA-256 hash
    MessageDigest digest = MessageDigest.getInstance("SHA-256");
    byte[] hash = digest.digest(codeVerifier.getBytes(StandardCharsets.US_ASCII));
    
    // Base64URL encode without padding
    String codeChallenge = Base64.getUrlEncoder()
        .withoutPadding()
        .encodeToString(hash);
    
    return codeChallenge;
}

// Example
String verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
String challenge = generateCodeChallenge(verifier);
System.out.println("code_challenge: " + challenge);
// Output: E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
```

### 5.4 Plain Transformation (NOT RECOMMENDED)

**Algorithm:**
```
code_challenge = code_verifier
```

**When to use:** NEVER, unless:
- Client cannot perform SHA-256 (extremely rare)
- Out-of-band confirmation that server supports `plain`
- No other option available

**Security Weakness:**
```
Problem: code_challenge is sent in authorization request (public)

If plain method:
  code_challenge = code_verifier
  
Consequence:
  Anyone who sees authorization request knows code_verifier!
  
Attack:
  1. Attacker observes authorization request
  2. Extracts code_challenge (which IS the verifier)
  3. Intercepts authorization code
  4. Uses observed verifier to exchange code
  5. Attack succeeds!
  
Result: PKCE provides NO protection with plain method
```

**Server Policy:**
```python
# RECOMMENDED: Reject plain method
ALLOWED_CHALLENGE_METHODS = ['S256']  # No 'plain'

def validate_authorization_request(request):
    method = request.args.get('code_challenge_method', 'plain')
    
    if method not in ALLOWED_CHALLENGE_METHODS:
        return error_response(
            'invalid_request',
            'code_challenge_method must be S256'
        )
```

### 5.5 S256 vs Plain Comparison

| Aspect | S256 Method | Plain Method |
|--------|-------------|--------------|
| **Transformation** | SHA-256 hash + Base64URL | None (identity function) |
| **Security** | Strong (one-way hash) | Weak (reversible) |
| **code_challenge visibility** | Safe to transmit publicly | Exposes code_verifier! |
| **Brute force resistance** | Yes (cannot reverse SHA-256) | No (challenge IS verifier) |
| **Client support** | MUST support (MTI) | MAY support |
| **Server support** | MUST support (MTI) | MAY support |
| **Recommendation** | ✅ REQUIRED | ❌ DO NOT USE |
| **OAuth 2.1 status** | REQUIRED | Discouraged |
| **Security BCP** | REQUIRED | SHOULD NOT use |

### 5.6 Verification Examples

**Test Vector (from RFC 7636 Appendix B):**
```
code_verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"

Expected code_challenge (S256):
"E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"

Verification:
1. SHA256("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")
   = 13f25da9762c8a4a8ee61ffb2f8d9d0fca7eaacc9e1c7e6a9b1c33b6e8f6e8b2 (hex)

2. Base64URL(hex_to_bytes(above))
   = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
```

**Validation Test:**
```python
def test_code_challenge_generation():
    """Test code_challenge generation per RFC 7636 Appendix B"""
    verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
    expected_challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
    
    actual_challenge = generate_code_challenge(verifier)
    
    assert actual_challenge == expected_challenge, \
        f"Challenge mismatch: {actual_challenge} != {expected_challenge}"
    
    print("✓ code_challenge generation correct")
```

---

## 6. Authorization Request with PKCE

### 6.1 Additional Parameters (RFC 7636 §4.3)

PKCE adds two parameters to the standard OAuth 2.0 authorization request:

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `code_challenge` | REQUIRED | Derived challenge | `E9Melhoa2Ow...` |
| `code_challenge_method` | OPTIONAL | Transformation method | `S256` or `plain` |

**Default behavior:**
- If `code_challenge_method` is omitted, server assumes `plain`
- Clients SHOULD always explicitly specify `S256`

### 6.2 Complete Authorization Request Example

**HTTP Request:**
```http
GET /authorize?
    response_type=code&
    client_id=s6BhdRkqt3&
    state=xyz&
    redirect_uri=https%3A%2F%2Fclient.example.com%2Fcb&
    scope=openid%20profile%20email&
    code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&
    code_challenge_method=S256
    HTTP/1.1
Host: server.example.com
```

**URL-Encoded Format:**
```
https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&state=xyz&redirect_uri=https%3A%2F%2Fclient.example.com%2Fcb&scope=openid%20profile%20email&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256
```

### 6.3 Parameter Specification

**code_challenge:**
```
Format:      Base64URL-encoded string (no padding)
Length:      43 characters (for S256 with 256-bit verifier)
Character Set: [A-Z] [a-z] [0-9] - _
Example:     "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
```

**code_challenge_method:**
```
Values:      "S256" | "plain"
Default:     "plain" (if omitted)
Recommended: Always specify "S256"
Example:     "S256"
```

### 6.4 Server Behavior (RFC 7636 §4.3)

**Server MUST:**
1. Associate the `code_challenge` and `code_challenge_method` with the authorization code
2. Store this association for later verification during token request
3. Return authorization code as usual

**Server SHOULD:**
- Reject requests without `code_challenge` for public clients
- Reject `plain` method (accept only S256)
- Validate `code_challenge` format

**Storage Requirements:**
```
Authorization Code Record:
{
  "code": "SplxlOBeZQQYbYS6WxSbIA",
  "client_id": "s6BhdRkqt3",
  "redirect_uri": "https://client.example.com/cb",
  "scope": "openid profile email",
  "code_challenge": "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
  "code_challenge_method": "S256",
  "expires_at": 1735689000,
  "created_at": 1735688400
}
```

### 6.5 Client Implementation Example

**Python (requests library):**
```python
import requests
from urllib.parse import urlencode

def initiate_pkce_flow(auth_endpoint, client_id, redirect_uri, scope):
    """Initiate OAuth flow with PKCE"""
    # Generate PKCE parameters
    code_verifier = generate_code_verifier()
    code_challenge = generate_code_challenge(code_verifier)
    
    # Generate state for CSRF protection
    state = secrets.token_urlsafe(32)
    
    # Store verifier and state (session storage)
    store_pkce_verifier(code_verifier, state)
    
    # Build authorization URL
    params = {
        'response_type': 'code',
        'client_id': client_id,
        'redirect_uri': redirect_uri,
        'scope': scope,
        'state': state,
        'code_challenge': code_challenge,
        'code_challenge_method': 'S256'
    }
    
    auth_url = f"{auth_endpoint}?{urlencode(params)}"
    
    return auth_url  # Redirect user to this URL

# Usage
auth_url = initiate_pkce_flow(
    auth_endpoint='https://auth.example.com/authorize',
    client_id='s6BhdRkqt3',
    redirect_uri='https://myapp.com/callback',
    scope='openid profile email'
)
print(f"Redirect user to: {auth_url}")
```

**JavaScript (browser):**
```javascript
async function initiatePKCEFlow() {
    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallengeWeb(codeVerifier);
    
    // Generate state
    const state = generateRandomString(32);
    
    // Store in session storage
    sessionStorage.setItem('pkce_verifier', codeVerifier);
    sessionStorage.setItem('oauth_state', state);
    
    // Build authorization URL
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: 's6BhdRkqt3',
        redirect_uri: 'https://myapp.com/callback',
        scope: 'openid profile email',
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
    });
    
    const authUrl = `https://auth.example.com/authorize?${params}`;
    
    // Redirect
    window.location = authUrl;
}
```

### 6.6 Server Validation

**Authorization Server Implementation:**
```python
from flask import request, session, redirect

@app.route('/authorize')
def authorize():
    # Extract parameters
    response_type = request.args.get('response_type')
    client_id = request.args.get('client_id')
    redirect_uri = request.args.get('redirect_uri')
    code_challenge = request.args.get('code_challenge')
    code_challenge_method = request.args.get('code_challenge_method', 'plain')
    
    # Validate client
    client = get_client(client_id)
    if not client:
        return error_response('invalid_client')
    
    # PKCE validation for public clients (REQUIRED in OAuth 2.1)
    if client.type == 'public':
        if not code_challenge:
            return error_response(
                'invalid_request',
                'code_challenge is required for public clients'
            )
        
        # Reject plain method
        if code_challenge_method == 'plain':
            return error_response(
                'invalid_request',
                'plain code_challenge_method not supported'
            )
    
    # Validate code_challenge format
    if code_challenge:
        if not is_valid_code_challenge(code_challenge):
            return error_response(
                'invalid_request',
                'Invalid code_challenge format'
            )
    
    # ... rest of authorization flow ...
    
    # Generate authorization code
    auth_code = generate_authorization_code()
    
    # Store code with PKCE parameters
    store_authorization_code(
        code=auth_code,
        client_id=client_id,
        redirect_uri=redirect_uri,
        code_challenge=code_challenge,
        code_challenge_method=code_challenge_method,
        expires_at=time.time() + 600  # 10 minutes
    )
    
    # Redirect back to client
    return redirect(f"{redirect_uri}?code={auth_code}&state={state}")
```

---

## 7. Authorization Response

### 7.1 No Changes from Standard OAuth 2.0

The authorization response is identical to standard OAuth 2.0 - PKCE does NOT change this phase.

**HTTP Response:**
```http
HTTP/1.1 302 Found
Location: https://client.example.com/cb?
    code=SplxlOBeZQQYbYS6WxSbIA&
    state=xyz
```

### 7.2 Response Parameters

| Parameter | Description | PKCE Impact |
|-----------|-------------|-------------|
| `code` | Authorization code | Bound to code_challenge (server-side) |
| `state` | CSRF token | No change |

**Key Points:**
- Authorization code looks identical with or without PKCE
- `code_challenge` is NOT included in response (stored server-side)
- Client receives code and proceeds to token request
- The binding between code and challenge is invisible to client

### 7.3 Server-Side State

**What Server Stores:**
```json
{
  "authorization_code": "SplxlOBeZQQYbYS6WxSbIA",
  "client_id": "s6BhdRkqt3",
  "redirect_uri": "https://client.example.com/cb",
  "scope": "openid profile email",
  "user_id": "user123",
  "code_challenge": "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
  "code_challenge_method": "S256",
  "issued_at": 1735688400,
  "expires_at": 1735689000
}
```

### 7.4 Client Behavior

**Client receives authorization code and prepares for token request:**

```javascript
// Handle redirect callback
function handleCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    
    // Validate state (CSRF protection)
    const storedState = sessionStorage.getItem('oauth_state');
    if (state !== storedState) {
        throw new Error('State mismatch - possible CSRF attack');
    }
    
    // Retrieve code_verifier (stored during authorization request)
    const codeVerifier = sessionStorage.getItem('pkce_verifier');
    
    if (!codeVerifier) {
        throw new Error('code_verifier not found');
    }
    
    // Now ready to exchange code for tokens
    exchangeCodeForTokens(code, codeVerifier);
}
```

---

## 8. Token Request with PKCE

### 8.1 Additional Parameter (RFC 7636 §4.5)

PKCE adds ONE parameter to the token request:

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `code_verifier` | REQUIRED | Original verifier secret | `dBjftJeZ4CVP...` |

### 8.2 Complete Token Request Example

**HTTP Request:**
```http
POST /token HTTP/1.1
Host: server.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=SplxlOBeZQQYbYS6WxSbIA&
redirect_uri=https%3A%2F%2Fclient.example.com%2Fcb&
client_id=s6BhdRkqt3&
code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

**For Public Clients:**
- `code_verifier` replaces client authentication
- No `client_secret` needed
- PKCE provides the security

**For Confidential Clients:**
- Include both `code_verifier` AND client authentication
- Defense in depth approach

### 8.3 Parameter Specification

**code_verifier:**
```
Format:      Original verifier string
Length:      43-128 characters
Character Set: [A-Z] [a-z] [0-9] - . _ ~
Must Match:  The verifier used to generate code_challenge
Example:     "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
```

### 8.4 Client Implementation Examples

**Python:**
```python
import requests

def exchange_code_for_tokens(code, code_verifier, token_endpoint, client_id, redirect_uri):
    """
    Exchange authorization code for tokens using PKCE
    
    Args:
        code: Authorization code from callback
        code_verifier: Original PKCE verifier
        token_endpoint: Token endpoint URL
        client_id: OAuth client ID
        redirect_uri: Redirect URI (must match authorization request)
        
    Returns:
        dict: Token response containing access_token, etc.
    """
    # Build token request
    data = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': redirect_uri,
        'client_id': client_id,
        'code_verifier': code_verifier
    }
    
    # Send request
    response = requests.post(
        token_endpoint,
        data=data,
        headers={'Content-Type': 'application/x-www-form-urlencoded'}
    )
    
    if response.status_code != 200:
        raise Exception(f"Token request failed: {response.text}")
    
    return response.json()

# Usage
tokens = exchange_code_for_tokens(
    code='SplxlOBeZQQYbYS6WxSbIA',
    code_verifier='dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
    token_endpoint='https://server.example.com/token',
    client_id='s6BhdRkqt3',
    redirect_uri='https://client.example.com/cb'
)

print(f"Access Token: {tokens['access_token']}")
```

**JavaScript (Node.js):**
```javascript
const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

async function exchangeCodeForTokens(code, codeVerifier, tokenEndpoint, clientId, redirectUri) {
    const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: codeVerifier
    });
    
    const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token request failed: ${error}`);
    }
    
    return response.json();
}

// Usage
const tokens = await exchangeCodeForTokens(
    'SplxlOBeZQQYbYS6WxSbIA',
    'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
    'https://server.example.com/token',
    's6BhdRkqt3',
    'https://client.example.com/cb'
);

console.log(`Access Token: ${tokens.access_token}`);
```

**Swift:**
```swift
func exchangeCodeForTokens(
    code: String,
    codeVerifier: String,
    tokenEndpoint: URL,
    clientId: String,
    redirectUri: String,
    completion: @escaping (Result<[String: Any], Error>) -> Void
) {
    var request = URLRequest(url: tokenEndpoint)
    request.httpMethod = "POST"
    request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
    
    let params = [
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": redirectUri,
        "client_id": clientId,
        "code_verifier": codeVerifier
    ]
    
    let bodyString = params
        .map { "\($0.key)=\($0.value.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")" }
        .joined(separator: "&")
    
    request.httpBody = bodyString.data(using: .utf8)
    
    URLSession.shared.dataTask(with: request) { data, response, error in
        if let error = error {
            completion(.failure(error))
            return
        }
        
        guard let data = data,
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            completion(.failure(NSError(domain: "TokenExchange", code: -1)))
            return
        }
        
        completion(.success(json))
    }.resume()
}

// Usage
exchangeCodeForTokens(
    code: "SplxlOBeZQQYbYS6WxSbIA",
    codeVerifier: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
    tokenEndpoint: URL(string: "https://server.example.com/token")!,
    clientId: "s6BhdRkqt3",
    redirectUri: "https://client.example.com/cb"
) { result in
    switch result {
    case .success(let tokens):
        print("Access Token: \(tokens["access_token"] ?? "")")
    case .failure(let error):
        print("Error: \(error)")
    }
}
```

### 8.5 Confidential Client with PKCE

**Including client authentication:**
```python
def exchange_code_confidential(code, code_verifier, client_id, client_secret):
    """Token exchange for confidential client with PKCE (defense in depth)"""
    data = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI,
        'client_id': client_id,
        'client_secret': client_secret,  # Confidential client auth
        'code_verifier': code_verifier   # PKCE (additional protection)
    }
    
    response = requests.post(TOKEN_ENDPOINT, data=data)
    return response.json()
```

**Or using HTTP Basic Authentication:**
```python
import base64

def exchange_code_confidential_basic(code, code_verifier, client_id, client_secret):
    """Token exchange with Basic authentication + PKCE"""
    # Encode client credentials
    credentials = f"{client_id}:{client_secret}"
    encoded = base64.b64encode(credentials.encode()).decode()
    
    headers = {
        'Authorization': f'Basic {encoded}',
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    data = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI,
        'code_verifier': code_verifier  # PKCE
    }
    
    response = requests.post(TOKEN_ENDPOINT, headers=headers, data=data)
    return response.json()
```

---

## 9. Server-Side Verification

### 9.1 Verification Algorithm (RFC 7636 §4.6)

**Server MUST perform these steps:**

```
1. Retrieve authorization code record
   ├─ code_challenge
   ├─ code_challenge_method
   └─ other metadata

2. Extract code_verifier from token request

3. Validate code_verifier format:
   ├─ Length: 43-128 characters
   ├─ Character set: [A-Z][a-z][0-9]-._~
   └─ If invalid → return error

4. Apply transformation based on code_challenge_method:
   IF method == "S256":
       derived_challenge = BASE64URL(SHA256(code_verifier))
   ELSE IF method == "plain":
       derived_challenge = code_verifier
   ELSE:
       return error (unsupported method)

5. Compare derived_challenge with stored code_challenge:
   IF derived_challenge == code_challenge:
       ✓ Verification successful
       → Issue tokens
   ELSE:
       ✗ Verification failed
       → Return error "invalid_grant"
```

### 9.2 Implementation Example

**Python (Flask):**
```python
import hashlib
import base64
import secrets
from flask import request

@app.route('/token', methods=['POST'])
def token():
    grant_type = request.form.get('grant_type')
    
    if grant_type != 'authorization_code':
        return error_response('unsupported_grant_type')
    
    code = request.form.get('code')
    code_verifier = request.form.get('code_verifier')
    client_id = request.form.get('client_id')
    redirect_uri = request.form.get('redirect_uri')
    
    # Retrieve stored authorization code data
    code_data = get_authorization_code(code)
    
    if not code_data:
        return error_response('invalid_grant', 'Invalid authorization code')
    
    # Check expiration
    if time.time() > code_data['expires_at']:
        delete_authorization_code(code)
        return error_response('invalid_grant', 'Authorization code expired')
    
    # Validate client_id
    if code_data['client_id'] != client_id:
        return error_response('invalid_grant', 'Client mismatch')
    
    # Validate redirect_uri
    if code_data['redirect_uri'] != redirect_uri:
        return error_response('invalid_grant', 'Redirect URI mismatch')
    
    # === PKCE VERIFICATION ===
    
    stored_challenge = code_data.get('code_challenge')
    stored_method = code_data.get('code_challenge_method', 'plain')
    
    # Check if PKCE was used in authorization request
    if stored_challenge:
        # PKCE required - verify code_verifier
        if not code_verifier:
            return error_response('invalid_request', 'code_verifier required')
        
        # Validate code_verifier format
        if not validate_code_verifier_format(code_verifier):
            return error_response('invalid_request', 'Invalid code_verifier format')
        
        # Compute derived challenge
        if stored_method == 'S256':
            # SHA-256 transformation
            sha256_hash = hashlib.sha256(code_verifier.encode('ascii')).digest()
            derived_challenge = base64.urlsafe_b64encode(sha256_hash).decode('utf-8').rstrip('=')
        elif stored_method == 'plain':
            # No transformation
            derived_challenge = code_verifier
        else:
            return error_response('invalid_request', 'Unsupported code_challenge_method')
        
        # Constant-time comparison (prevent timing attacks)
        if not secrets.compare_digest(derived_challenge, stored_challenge):
            # PKCE verification failed
            delete_authorization_code(code)  # Prevent retry
            return error_response('invalid_grant', 'Invalid code_verifier')
    
    # PKCE verification passed (or not used)
    
    # Delete authorization code (single use)
    delete_authorization_code(code)
    
    # Issue tokens
    access_token = generate_access_token(code_data)
    refresh_token = generate_refresh_token(code_data)
    
    return jsonify({
        'access_token': access_token,
        'token_type': 'Bearer',
        'expires_in': 3600,
        'refresh_token': refresh_token,
        'scope': code_data['scope']
    })

def validate_code_verifier_format(verifier):
    """Validate code_verifier format per RFC 7636"""
    if not verifier:
        return False
    
    # Length check
    if not (43 <= len(verifier) <= 128):
        return False
    
    # Character set check: [A-Z] [a-z] [0-9] - . _ ~
    import re
    if not re.match(r'^[A-Za-z0-9\-._~]+$', verifier):
        return False
    
    return True
```

### 9.3 Verification Pseudocode

**Detailed Algorithm:**
```python
function verify_pkce(authorization_code, received_code_verifier):
    # Step 1: Retrieve stored code data
    code_record = database.get(authorization_code)
    
    if code_record is null:
        return ERROR("invalid_grant", "Code not found")
    
    stored_challenge = code_record.code_challenge
    stored_method = code_record.code_challenge_method
    
    # Step 2: Check if PKCE was used
    if stored_challenge is null:
        # PKCE not used in authorization request
        # For public clients, this should be an error (OAuth 2.1)
        if client_is_public(code_record.client_id):
            return ERROR("invalid_request", "PKCE required for public clients")
        else:
            return SUCCESS  # Confidential client without PKCE (allowed in OAuth 2.0)
    
    # Step 3: Validate code_verifier presence
    if received_code_verifier is null:
        return ERROR("invalid_request", "code_verifier required")
    
    # Step 4: Validate code_verifier format
    if not (43 <= length(received_code_verifier) <= 128):
        return ERROR("invalid_request", "Invalid verifier length")
    
    if not matches_charset(received_code_verifier, "[A-Za-z0-9\-._~]+"):
        return ERROR("invalid_request", "Invalid verifier characters")
    
    # Step 5: Apply transformation
    if stored_method == "S256":
        hash_bytes = SHA256(received_code_verifier)
        derived_challenge = BASE64URL_NO_PADDING(hash_bytes)
    else if stored_method == "plain":
        derived_challenge = received_code_verifier
    else:
        return ERROR("invalid_request", "Unsupported challenge method")
    
    # Step 6: Constant-time comparison
    if constant_time_equals(derived_challenge, stored_challenge):
        return SUCCESS
    else:
        return ERROR("invalid_grant", "Code verifier validation failed")
```

### 9.4 Error Handling

**Error Responses:**

| Error Code | Description | HTTP Status |
|------------|-------------|-------------|
| `invalid_request` | Missing or invalid code_verifier format | 400 |
| `invalid_grant` | code_verifier doesn't match challenge | 400 |
| `unsupported_code_challenge_method` | Server doesn't support method | 400 |

**Error Response Example:**
```json
{
  "error": "invalid_grant",
  "error_description": "PKCE verification failed"
}
```

**Security Note:**
- Don't reveal specific reason for failure in error_description
- Log details server-side for debugging
- Use generic message to client: "PKCE verification failed"

### 9.5 Timing Attack Prevention

**Vulnerable Comparison:**
```python
# ❌ VULNERABLE: Early exit on mismatch
def compare_challenges(received, stored):
    if len(received) != len(stored):
        return False  # Early exit reveals length
    
    for i in range(len(received)):
        if received[i] != stored[i]:
            return False  # Early exit reveals position of difference
    
    return True

# Timing difference reveals information to attacker!
```

**Secure Comparison:**
```python
# ✅ SECURE: Constant-time comparison
import secrets

def compare_challenges(received, stored):
    # Use secrets.compare_digest for constant-time comparison
    return secrets.compare_digest(received, stored)

# OR implement manually:
def constant_time_equals(a, b):
    if len(a) != len(b):
        return False
    
    result = 0
    for x, y in zip(a, b):
        result |= ord(x) ^ ord(y)
    
    return result == 0  # Always compares all characters
```

---

## 10. Token Response

### 10.1 Standard OAuth 2.0 Response

PKCE does NOT change the token response format. The response is identical to standard OAuth 2.0:

**HTTP Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
Pragma: no-cache

{
  "access_token": "2YotnFZFEjr1zCsicMWpAA",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "tGzv3JOkF0XG5Qx2TlKWIA",
  "scope": "openid profile email"
}
```

### 10.2 Response Parameters

| Parameter | Description | PKCE Impact |
|-----------|-------------|-------------|
| `access_token` | Bearer token for API access | None |
| `token_type` | Always "Bearer" | None |
| `expires_in` | Lifetime in seconds | None |
| `refresh_token` | Long-lived token (optional) | None |
| `scope` | Granted scopes | None |

**With OpenID Connect:**
```json
{
  "access_token": "2YotnFZFEjr1zCsicMWpAA",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "tGzv3JOkF0XG5Qx2TlKWIA",
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "scope": "openid profile email"
}
```

### 10.3 Client Handling

**After receiving tokens:**
```javascript
async function handleTokenResponse(tokens) {
    // Clean up PKCE data (no longer needed)
    sessionStorage.removeItem('pkce_verifier');
    sessionStorage.removeItem('oauth_state');
    
    // Store tokens securely
    // For SPAs: Consider Backend-For-Frontend pattern
    // For native apps: Use secure storage (Keychain/Keystore)
    
    // Access token
    const accessToken = tokens.access_token;
    
    // Refresh token (if present)
    if (tokens.refresh_token) {
        // Store securely for token refresh
        storeRefreshToken(tokens.refresh_token);
    }
    
    // ID token (if OIDC)
    if (tokens.id_token) {
        const claims = parseJWT(tokens.id_token);
        // Use claims for user info
    }
    
    // Proceed with application flow
    loadUserProfile(accessToken);
}
```

### 10.4 Success Flow Complete

**End-to-End PKCE Flow Summary:**

```
Client                                    Server
  |                                         |
  | 1. Generate code_verifier              |
  | 2. Derive code_challenge               |
  |                                         |
  | 3. Authorization Request                |
  |    (with code_challenge)                |
  |─────────────────────────────────────────>
  |                                         | 4. Store challenge
  |                                         | 5. User auth
  | 6. Authorization Code                  |
  <─────────────────────────────────────────|
  |                                         |
  | 7. Token Request                        |
  |    (with code_verifier)                 |
  |─────────────────────────────────────────>
  |                                         | 8. Verify:
  |                                         |    SHA256(verifier)
  |                                         |    == challenge
  | 9. Tokens (access + refresh)           |
  <─────────────────────────────────────────|
  |                                         |
  | 10. Clear PKCE data                    |
  | 11. Use tokens                         |
  |                                         |
```

---

## 11. PKCE for Public vs Confidential Clients

### 11.1 Client Type Definitions

**Public Clients:**
- Cannot securely store client secrets
- Examples: Mobile apps, SPAs, native desktop apps
- Authentication: PKCE only (no client_secret)

**Confidential Clients:**
- Can securely store client secrets
- Examples: Server-side web applications, backend services
- Authentication: client_secret AND optionally PKCE

### 11.2 PKCE Requirements by Client Type

| Client Type | OAuth 2.0 (RFC 6749) | RFC 7636 | OAuth 2.1 | Security BCP | Recommendation |
|-------------|---------------------|----------|-----------|--------------|----------------|
| **Public** | Not specified | SHOULD | REQUIRED | REQUIRED | ✅ REQUIRED |
| **Confidential** | client_secret | N/A | RECOMMENDED | REQUIRED | ✅ RECOMMENDED |

### 11.3 Public Client Implementation

**Mobile App Example:**
```swift
class OAuthManager {
    func initiateLogin() {
        // Generate PKCE (REQUIRED for public clients)
        let verifier = generateCodeVerifier()
        let challenge = generateCodeChallenge(verifier: verifier)
        
        // Store verifier securely
        KeychainManager.save(key: "pkce_verifier", value: verifier)
        
        // Build authorization URL (no client_secret)
        let authURL = buildAuthURL(
            clientId: "public_mobile_app",
            challenge: challenge,
            challengeMethod: "S256"
        )
        
        // Open authorization page
        openAuthenticationSession(url: authURL)
    }
    
    func handleCallback(code: String) {
        // Retrieve verifier
        guard let verifier = KeychainManager.get(key: "pkce_verifier") else {
            return
        }
        
        // Exchange code for tokens (no client_secret)
        exchangeCode(
            code: code,
            codeVerifier: verifier,
            clientId: "public_mobile_app"
            // No client_secret!
        )
    }
}
```

### 11.4 Confidential Client Implementation

**Server-Side App Example:**
```python
class OAuthClient:
    def __init__(self, client_id, client_secret):
        self.client_id = client_id
        self.client_secret = client_secret  # Can store securely
    
    def initiate_login(self):
        # Generate PKCE (RECOMMENDED for defense in depth)
        code_verifier = generate_code_verifier()
        code_challenge = generate_code_challenge(code_verifier)
        
        # Store verifier in server-side session
        session['pkce_verifier'] = code_verifier
        
        # Build authorization URL
        auth_url = build_auth_url(
            client_id=self.client_id,
            code_challenge=code_challenge,
            code_challenge_method='S256'
        )
        
        return redirect(auth_url)
    
    def handle_callback(self, code):
        # Retrieve verifier
        code_verifier = session.get('pkce_verifier')
        
        # Exchange code with BOTH client_secret AND PKCE
        response = requests.post(TOKEN_ENDPOINT, data={
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': REDIRECT_URI,
            'client_id': self.client_id,
            'client_secret': self.client_secret,  # Client authentication
            'code_verifier': code_verifier         # PKCE (defense in depth)
        })
        
        return response.json()
```

### 11.5 Why Confidential Clients Should Use PKCE

**Defense in Depth:**

1. **Primary Protection:** client_secret
2. **Additional Protection:** PKCE

**Scenarios where PKCE helps confidential clients:**

**Scenario 1: Client Secret Compromise**
```
If client_secret is leaked (logs, source control, etc.):
- Without PKCE: Attacker can use any intercepted code
- With PKCE: Attacker still needs code_verifier for each specific code
```

**Scenario 2: Code Injection Attacks**
```
Attacker tricks victim into using attacker's authorization code:
- Without PKCE: Victim's session linked to attacker's account
- With PKCE: Attack fails (code bound to attacker's verifier)
```

**Scenario 3: Forward Security**
```
If preparing for OAuth 2.1 migration:
- Start using PKCE now
- When removing client_secret later, already protected
```

### 11.6 Server Policy Recommendations

**Authorization Server Configuration:**

```python
PKCE_POLICY = {
    'public_clients': {
        'pkce_required': True,              # MUST in OAuth 2.1
        'allow_plain_method': False,        # Only S256
        'require_code_challenge': True
    },
    'confidential_clients': {
        'pkce_required': False,             # SHOULD but not MUST
        'allow_plain_method': False,
        'require_code_challenge': False     # Optional but recommended
    }
}

def validate_authorization_request(request):
    client = get_client(request.client_id)
    code_challenge = request.code_challenge
    
    if client.type == 'public':
        # Enforce PKCE for public clients
        if not code_challenge:
            return error('invalid_request', 'PKCE required for public clients')
    
    if code_challenge:
        # If PKCE used, enforce S256
        method = request.code_challenge_method or 'plain'
        if method == 'plain':
            return error('invalid_request', 'Only S256 method supported')
    
    return SUCCESS
```

### 11.7 Comparison Table

| Aspect | Public Client | Confidential Client |
|--------|---------------|---------------------|
| **Can store secrets** | ❌ No | ✅ Yes |
| **PKCE requirement** | ✅ REQUIRED | ⚠️ RECOMMENDED |
| **client_secret** | ❌ Not used | ✅ Required |
| **Token request auth** | PKCE only | client_secret + optional PKCE |
| **Primary security** | PKCE | client_secret |
| **Defense in depth** | N/A | Add PKCE for extra protection |
| **OAuth 2.1 mandate** | MUST use PKCE | SHOULD use PKCE |
| **Risk without PKCE** | CRITICAL | MEDIUM |

---

## 12. Security Considerations

### 12.1 code_verifier Entropy (RFC 7636 §7.1)

**Minimum Entropy Requirement:**

| Aspect | Requirement | Rationale |
|--------|-------------|-----------|
| **Minimum bits** | 256 bits | Resist brute force |
| **Recommended** | 256 bits | Balance security and length |
| **Maximum** | 1024 bits (128 chars) | Avoid excessive length |

**Entropy Calculation:**
```
Base64URL encoding:
- 6 bits per character
- 43 characters minimum
- 43 × 6 = 258 bits ✓

Brute Force Resistance:
- 2^256 possible values
- At 1 billion attempts/second:
  Time to crack = 2^256 / 10^9 / (365.25 × 24 × 3600)
                ≈ 3.67 × 10^60 years

Conclusion: 256 bits provides sufficient security
```

**Insufficient Entropy Example:**
```python
# ❌ VULNERABLE: Only 64 bits of entropy
code_verifier = secrets.token_urlsafe(8)  # 8 bytes = 64 bits
# Length: ~11 characters (too short!)

# Attack feasibility:
# 2^64 ≈ 1.8 × 10^19 attempts
# At 1 billion/sec: ~585 years (marginally feasible with future tech)
```

### 12.2 code_challenge_method Preference

**Security Comparison:**

| Method | Security Level | Why |
|--------|---------------|-----|
| **S256** | ✅ Strong | One-way hash, cannot reverse |
| **plain** | ❌ Weak | Challenge = verifier (exposed!) |

**Attack on Plain Method:**
```
Authorization request (public):
GET /authorize?
    code_challenge=abc123xyz789&  ← Attacker sees this
    code_challenge_method=plain

With plain method:
code_challenge = code_verifier = "abc123xyz789"

Result:
- Attacker knows code_verifier!
- If attacker intercepts code, can exchange it
- PKCE provides ZERO protection

Conclusion: plain method defeats the purpose of PKCE
```

**Server Policy:**
```python
# RECOMMENDED: Only accept S256
SUPPORTED_METHODS = ['S256']  # No 'plain'

def validate_challenge_method(method):
    if method not in SUPPORTED_METHODS:
        return error(
            'invalid_request',
            'Only S256 code_challenge_method supported'
        )
```

### 12.3 Authorization Server Policy

**RFC 7636 Recommendations:**

**MUST:**
- Support S256 transformation method
- Validate code_verifier format
- Use constant-time comparison

**SHOULD:**
- Require PKCE for public clients (OAuth 2.1: MUST)
- Reject plain method
- Track if client previously used PKCE (prevent downgrade)

**MAY:**
- Require PKCE for all clients
- Log PKCE verification failures for security monitoring

**Implementation:**
```python
class AuthorizationServerPolicy:
    REQUIRE_PKCE_FOR_PUBLIC = True   # OAuth 2.1
    REQUIRE_PKCE_FOR_ALL = True      # Security BCP
    ALLOW_PLAIN_METHOD = False       # Security BCP
    TRACK_CLIENT_PKCE_USAGE = True   # Prevent downgrade
    
    def validate_authorization(self, request):
        client = get_client(request.client_id)
        
        # Check PKCE requirement
        if self.REQUIRE_PKCE_FOR_ALL:
            if not request.code_challenge:
                return error('invalid_request', 'PKCE required')
        elif self.REQUIRE_PKCE_FOR_PUBLIC and client.type == 'public':
            if not request.code_challenge:
                return error('invalid_request', 'PKCE required for public clients')
        
        # Check challenge method
        if request.code_challenge:
            method = request.code_challenge_method or 'plain'
            if not self.ALLOW_PLAIN_METHOD and method == 'plain':
                return error('invalid_request', 'plain method not supported')
        
        # Track PKCE usage for downgrade detection
        if self.TRACK_CLIENT_PKCE_USAGE and request.code_challenge:
            mark_client_uses_pkce(request.client_id)
        
        return SUCCESS
```

### 12.4 Downgrade Attack Protection

**Attack Scenario:**
```
1. Client normally uses PKCE

2. Attacker intercepts authorization request

3. Attacker removes code_challenge parameters:
   Original: ...&code_challenge=xyz&code_challenge_method=S256
   Modified: ... (parameters removed)

4. If server allows: Code issued without PKCE binding

5. Attacker intercepts code and exchanges it (no verifier needed)

6. Attack succeeds (PKCE protection bypassed)
```

**Mitigation:**
```python
# Track which clients use PKCE
CLIENT_PKCE_HISTORY = {}

def validate_authorization_request(request):
    client_id = request.client_id
    has_challenge = bool(request.code_challenge)
    
    # Check if client previously used PKCE
    previously_used_pkce = CLIENT_PKCE_HISTORY.get(client_id, False)
    
    if previously_used_pkce and not has_challenge:
        # Downgrade attack detected!
        logger.warning(f"PKCE downgrade attempt: {client_id}")
        return error(
            'invalid_request',
            'PKCE required (client previously used PKCE)'
        )
    
    if has_challenge:
        # Mark that client uses PKCE
        CLIENT_PKCE_HISTORY[client_id] = True
    
    return SUCCESS
```

### 12.5 Code Expiration

**Short Lifetime Required:**
```
RFC 6749 §4.1.2:
"The authorization code MUST expire shortly after it is issued to 
mitigate the risk of leaks. A maximum authorization code lifetime 
of 10 minutes is RECOMMENDED."

With PKCE:
- Code is bound to verifier
- But short lifetime still important
- Limits attack window if PKCE bypassed somehow
```

**Implementation:**
```python
# Configuration
AUTHORIZATION_CODE_LIFETIME = 600  # 10 minutes (max recommended)
AUTHORIZATION_CODE_LIFETIME_STRICT = 60  # 1 minute (more secure)

def generate_authorization_code(client_id, code_challenge):
    code = secrets.token_urlsafe(32)
    
    store_code(
        code=code,
        client_id=client_id,
        code_challenge=code_challenge,
        expires_at=time.time() + AUTHORIZATION_CODE_LIFETIME
    )
    
    return code

def validate_authorization_code(code):
    code_data = get_code(code)
    
    if not code_data:
        return None
    
    # Check expiration
    if time.time() > code_data['expires_at']:
        delete_code(code)  # Clean up expired codes
        return None
    
    return code_data
```

---

[Document continues with sections 13-20 covering PKCE Downgrade Attack, Common Implementation Errors, PKCE with Different Client Types, PKCE in OAuth 2.1, Testing and Validation, Example Scenarios, Libraries and Tools, and Migration guidance...]

---

*End of Part 1 - Document continues...*
