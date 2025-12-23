# OAuth 2.0 Security Best Current Practice (BCP)

## Master Security Guidance for OAuth2 and OpenID Connect Implementations

> *"Security is a bit like insurance: nobody thinks they need it until something goes catastrophically wrong. The difference being that insurance companies will at least send you a nice letter explaining why they're not paying out. With OAuth2 security, you just wake up one day to find all your users' data is being sold on the dark web, and you get to explain to your CEO that yes, you knew about PKCE, state parameters, and exact redirect URI matching, but you thought they were 'optional recommendations' rather than 'the things that prevent your company from becoming tomorrow's breach headline.' Spoiler: they weren't optional."*

---

## Document Metadata

**Document Type:** Master Security Reference  
**Primary Source:** OAuth 2.0 Security Best Current Practice (draft-ietf-oauth-security-topics)  
**Status:** Consolidates IETF Security BCP, OAuth 2.1 guidance, and current best practices  
**Purpose:** Authoritative security guidance for OAuth2/OIDC implementations  
**Last Updated:** December 8, 2025  
**Version:** 1.0.0  

**Target Audience:**
- Security architects designing OAuth2/OIDC systems
- Developers implementing OAuth2/OIDC flows
- Security auditors reviewing implementations
- Penetration testers assessing OAuth2/OIDC security
- Compliance officers ensuring regulatory adherence

**Prerequisites:**
- Basic understanding of OAuth 2.0 concepts
- Familiarity with HTTP and TLS
- Understanding of client types (public vs confidential)

**Document Organization:**
This document is organized by **topic area** (not by RFC section) for practical usability. Each section includes:
- Security BCP section references
- Requirement levels (MUST/SHOULD/MAY per RFC 2119)
- Threats mitigated
- Implementation guidance
- Cross-references to detailed documents

---

## Table of Contents

1. [Overview](#1-overview)
2. [Document Structure and Usage](#2-document-structure-and-usage)
3. [Fundamental Security Principles](#3-fundamental-security-principles)
4. [Client Type Recommendations](#4-client-type-recommendations)
5. [Flow Selection](#5-flow-selection)
6. [Authorization Request Security](#6-authorization-request-security)
7. [Token Endpoint Security](#7-token-endpoint-security)
8. [Access Token Security](#8-access-token-security)
9. [Refresh Token Security](#9-refresh-token-security)
10. [Redirect URI Security](#10-redirect-uri-security)
11. [CSRF Protection](#11-csrf-protection)
12. [Mix-Up Attack Prevention](#12-mix-up-attack-prevention)
13. [Authorization Server Security](#13-authorization-server-security)
14. [Resource Server Security](#14-resource-server-security)
15. [Browser-Based Application Guidance](#15-browser-based-application-guidance)
16. [Native Application Guidance](#16-native-application-guidance)
17. [Device Flow Security](#17-device-flow-security)
18. [OpenID Connect Specific Guidance](#18-openid-connect-specific-guidance)
19. [Cryptographic Recommendations](#19-cryptographic-recommendations)
20. [Monitoring and Incident Response](#20-monitoring-and-incident-response)
21. [Testing and Validation](#21-testing-and-validation)
22. [Common Security Pitfalls](#22-common-security-pitfalls)
23. [OAuth 2.1 vs OAuth 2.0](#23-oauth-21-vs-oauth-20)
24. [Compliance and Regulatory Considerations](#24-compliance-and-regulatory-considerations)
25. [Cross-References](#25-cross-references)
26. [Summary Checklists](#26-summary-checklists)

---

## 1. Overview

### 1.1 Purpose of This Document

This document consolidates current security best practices for OAuth 2.0 and OpenID Connect implementations. It addresses vulnerabilities discovered since RFC 6749 was published in 2012 and provides authoritative security guidance.

**Key Sources:**
- OAuth 2.0 Security Best Current Practice (draft-ietf-oauth-security-topics)
- OAuth 2.1 (draft-ietf-oauth-v2-1)
- RFC 8252 (OAuth 2.0 for Native Apps)
- RFC 9449 (DPoP)
- RFC 8705 (mTLS)
- OpenID Connect Core 1.0

### 1.2 Why This Document Exists

**Historical Context:**

```
RFC 6749 (OAuth 2.0) Published: 2012
├─ Flexible framework
├─ Many optional features
├─ Security guidance limited
└─ Assumed secure TLS everywhere

Real World (2012-2025):
├─ Vulnerabilities discovered
│  ├─ Authorization code interception
│  ├─ CSRF attacks
│  ├─ Open redirect exploits
│  ├─ Token theft via XSS
│  └─ Mix-up attacks
├─ Attack surface expanded
│  ├─ Browser-based apps (SPAs)
│  ├─ Mobile applications
│  ├─ IoT devices
│  └─ Sophisticated attackers
└─ Best practices evolved

Security BCP (2017-present):
├─ Documents vulnerabilities
├─ Provides concrete mitigations
├─ Makes security mandatory (not optional)
└─ Forms basis for OAuth 2.1
```

### 1.3 Relationship to OAuth 2.1

**OAuth 2.1 Integration:**

OAuth 2.1 incorporates many Security BCP recommendations as **mandatory requirements**, including:
- PKCE REQUIRED for authorization code flow
- Exact redirect_uri matching REQUIRED
- Implicit flow REMOVED
- Resource owner password flow REMOVED
- Refresh token rotation REQUIRED for public clients

**This Document's Role:**
- Covers security guidance beyond what's in OAuth 2.1
- Explains **why** requirements exist (threat models)
- Provides implementation details
- Addresses edge cases and special scenarios

### 1.4 Document Status

**Security BCP Status:**
- IETF Draft (work in progress)
- Widely adopted as de facto standard
- Implemented by major providers (Google, Microsoft, Auth0, Okta)
- Referenced in compliance frameworks

**This Document's Approach:**
- Treats Security BCP as authoritative
- Incorporates OAuth 2.1 requirements
- Adds practical implementation guidance
- Cross-references detailed specifications

---

## 2. Document Structure and Usage

### 2.1 How to Use This Document

**For Security Architects:**
```
1. Start with Section 3: Fundamental Principles
2. Review Section 4: Client Type Recommendations
3. Study Section 5: Flow Selection
4. Use decision trees for design choices
5. Create security requirements document
6. Reference detailed specs for implementation teams
```

**For Developers:**
```
1. Identify your client type (Section 4)
2. Select appropriate flow (Section 5)
3. Follow flow-specific security requirements
4. Implement all MUST requirements
5. Implement SHOULD requirements (unless documented reason not to)
6. Test with Section 21: Testing and Validation
7. Review Section 22: Common Pitfalls
```

**For Security Auditors:**
```
1. Use Section 26: Summary Checklists
2. Verify each MUST requirement
3. Document any SHOULD requirements not implemented
4. Check for Common Pitfalls (Section 22)
5. Use detailed specs for deep-dive validation
6. Reference threat model for risk assessment
```

**For Compliance Officers:**
```
1. Review Section 24: Compliance Considerations
2. Map requirements to regulatory framework
3. Verify implementation against checklists
4. Document compliance posture
5. Track remediation items
```

### 2.2 Requirement Levels (RFC 2119)

This document uses RFC 2119 language:

| Term | Meaning | Compliance |
|------|---------|-----------|
| **MUST** | Absolute requirement | Mandatory - failure is security vulnerability |
| **MUST NOT** | Absolute prohibition | Mandatory - doing so creates vulnerability |
| **SHOULD** | Strong recommendation | Implement unless documented reason not to |
| **SHOULD NOT** | Strong recommendation against | Avoid unless documented reason |
| **MAY** | Optional | Implementation choice |

**Important:** "SHOULD" does NOT mean "optional if inconvenient." It means "do this unless you have a specific, documented reason not to and understand the security implications."

### 2.3 Organization by Topic

**Why Topic-Based (Not Spec-Section-Based):**

```
Spec-based organization:
├─ Follows RFC structure
├─ Good for implementers
└─ Hard to find security guidance

Topic-based organization:
├─ Groups related security concerns
├─ Easier to find relevant guidance
├─ Better for architects and auditors
└─ More practical for real-world use

Example:
Instead of: "RFC 6749 §4.1.1 authorization request"
We have: "Section 6: Authorization Request Security"
          ├─ PKCE
          ├─ state parameter
          ├─ redirect_uri
          └─ nonce
```

### 2.4 Cross-Reference System

**Detailed Specifications Available:**

Each topic references detailed documents:

| Topic | Detailed Document |
|-------|------------------|
| Threats | `oauth2-oidc-threat-model.md` |
| PKCE | `pkce-implementation.md` |
| State/CSRF | `state-parameter-and-csrf.md` |
| Redirect URI | `redirect-uri-validation.md` |
| Token Binding | `token-binding-dpop-mtls.md` |
| Flows | Flow-specific documents |
| Tokens | Token-specific documents |

**Usage Pattern:**
1. This document: High-level requirements and decision guidance
2. Detailed document: Implementation details, code examples, edge cases

---

## 3. Fundamental Security Principles

### 3.1 Principle 1: Defense in Depth

**Concept:** Multiple independent layers of security, such that failure of one layer doesn't result in complete compromise.

**Application to OAuth2:**

```
Single Protection (Vulnerable):
└─ TLS only
   └─ If TLS compromised → Complete failure

Defense in Depth (Secure):
└─ Layer 1: TLS (transport security)
   └─ Layer 2: PKCE (code binding)
      └─ Layer 3: state parameter (CSRF protection)
         └─ Layer 4: Short token lifetime (limit exposure)
            └─ Layer 5: Token binding (DPoP/mTLS)
               └─ Layer 6: Scope restriction (least privilege)

Result: Attacker must defeat ALL layers
```

**Practical Example:**

```
Authorization Code Flow with Defense in Depth:

1. TLS everywhere
   - Protects: Transport layer attacks
   - If fails: Still have PKCE, state, etc.

2. PKCE (code_verifier)
   - Protects: Authorization code interception
   - If fails: Still have state for CSRF, short code lifetime

3. state parameter
   - Protects: CSRF attacks
   - If fails: Still have PKCE binding, redirect_uri validation

4. Exact redirect_uri matching
   - Protects: Open redirect
   - If fails: Still have PKCE, state

5. Short authorization code lifetime (60s)
   - Limits: Exposure window
   - If fails: Code still bound by PKCE

6. Short access token lifetime (minutes-hours)
   - Limits: Token theft impact
   - If fails: Refresh token rotation helps

7. Refresh token rotation
   - Detects: Theft through reuse
   - If fails: Token lifetime limits exposure
```

**Recommendation:**
> ALWAYS implement multiple security layers. Never rely on a single control.

### 3.2 Principle 2: Least Privilege

**Concept:** Grant minimum privileges necessary for a specific purpose, nothing more.

**Application to OAuth2:**

```
Least Privilege Checklist:

☐ Minimal Scopes
  - Request only scopes actually needed
  - Bad: scope=* or scope=read write admin
  - Good: scope=read:messages
  
☐ Short Token Lifetimes
  - Access token: Minutes to hours
  - Authorization code: Seconds (30-60)
  - Refresh token: Days to weeks (not months)

☐ Limited Redirect URIs
  - Register only URIs actually used
  - Remove unused URIs
  - Don't register "just in case" URIs

☐ Audience Restriction
  - Token valid for specific resource server(s)
  - aud claim specifies target
  - Resource server validates aud

☐ Fine-Grained Scopes
  - Prefer: read:own_profile, write:own_messages
  - Avoid: read:*, admin
```

**Bad Example (Too Much Privilege):**
```json
{
  "client_id": "myapp",
  "scope": "openid profile email read write admin",
  "access_token_lifetime": 86400,  // 24 hours
  "refresh_token_lifetime": 31536000  // 1 year
}
```

**Good Example (Least Privilege):**
```json
{
  "client_id": "myapp",
  "scope": "openid profile read:own_messages",
  "access_token_lifetime": 1800,  // 30 minutes
  "refresh_token_lifetime": 604800  // 7 days
}
```

### 3.3 Principle 3: Secure by Default

**Concept:** Security features should be default behavior, not opt-in.

**Application to OAuth2:**

```
Insecure by Default (Bad):
├─ PKCE optional (must opt-in)
├─ Implicit flow available by default
├─ Long token lifetimes by default
└─ Pattern matching for redirect_uri allowed

Secure by Default (Good):
├─ PKCE required (cannot opt-out)
├─ Implicit flow disabled
├─ Short token lifetimes by default
└─ Exact redirect_uri matching only
```

**OAuth 2.1 Approach:**
- PKCE REQUIRED (not optional)
- Implicit flow REMOVED (not available)
- Refresh token rotation REQUIRED for public clients
- Exact redirect_uri matching REQUIRED

**Implementation Guidance:**
```python
# Bad: Opt-in security
class AuthorizationServer:
    def __init__(self):
        self.require_pkce = False  # Default: insecure
        self.allow_implicit = True  # Default: insecure

# Good: Secure by default
class AuthorizationServer:
    def __init__(self):
        self.require_pkce = True  # Default: secure
        self.allow_implicit = False  # Removed
```

### 3.4 Principle 4: Explicit Over Implicit

**Concept:** Require explicit validation, not implicit trust.

**Application to OAuth2:**

```
Implicit Trust (Bad):
├─ Assume redirect_uri is safe (don't validate)
├─ Assume client_id is authentic (don't verify)
├─ Assume token is valid (don't check expiration)
└─ Trust without verification

Explicit Validation (Good):
├─ Validate redirect_uri against registered URIs
├─ Authenticate client
├─ Validate token signature, expiration, audience
└─ Never trust, always verify
```

**Examples:**

**Bad: Implicit Trust**
```python
def handle_callback(request):
    code = request.args.get('code')
    # Implicitly trust code is valid
    tokens = exchange_code(code)
    return tokens
```

**Good: Explicit Validation**
```python
def handle_callback(request):
    code = request.args.get('code')
    state = request.args.get('state')
    
    # Explicit validation
    if not validate_state(state):
        raise SecurityError("Invalid state")
    
    if not validate_code(code):
        raise SecurityError("Invalid code")
    
    tokens = exchange_code(code)
    
    if not validate_token(tokens['access_token']):
        raise SecurityError("Invalid token")
    
    return tokens
```

### 3.5 Applying All Principles Together

**Example: Secure Authorization Code Flow**

```
Defense in Depth:
✓ TLS everywhere
✓ PKCE (code binding)
✓ state parameter (CSRF)
✓ Exact redirect_uri
✓ Short lifetimes
✓ Refresh token rotation

Least Privilege:
✓ Minimal scopes (read:profile only)
✓ Short access token (30 min)
✓ Limited redirect URIs (1-2)
✓ Audience restriction

Secure by Default:
✓ PKCE required (not optional)
✓ Implicit flow disabled
✓ Exact matching enforced
✓ Secure settings default

Explicit Validation:
✓ Validate state
✓ Validate PKCE
✓ Validate redirect_uri
✓ Validate token claims
✓ Validate scopes

Result: Highly secure implementation
```

---

## 4. Client Type Recommendations (Security BCP §2.1)

### 4.1 Client Types Overview

**RFC 6749 Definition:**

```
Public Client:
├─ Cannot keep credentials confidential
├─ Code runs in user-controlled environment
├─ Examples: SPAs, native apps, JavaScript
└─ Cannot authenticate with client_secret

Confidential Client:
├─ Can keep credentials confidential
├─ Code runs on secure server
├─ Examples: Backend web apps, services
└─ Can authenticate with client_secret
```

### 4.2 Public Client Security Requirements

**MUST Requirements (Security BCP §2.1.1):**

| Requirement | Reference | Threat Mitigated |
|------------|-----------|------------------|
| **MUST use authorization code flow** | Security BCP §2.1.1 | All threats (other flows less secure) |
| **MUST use PKCE** | Security BCP §2.1.1 | Authorization code interception |
| **MUST use state parameter** | Security BCP §4.7 | CSRF attacks |
| **MUST NOT use client_secret** | RFC 6749 §2.1 | Secret exposure (cannot be kept secret) |
| **MUST use exact redirect_uri** | Security BCP §4.1.3 | Open redirect attacks |

**SHOULD Requirements:**

| Requirement | Reference | Benefit |
|------------|-----------|---------|
| **SHOULD use short access token lifetime** | Security BCP §4.3.1 | Limit token theft impact (5-15 min) |
| **SHOULD use refresh token rotation** | Security BCP §4.13.2 | Detect token theft |
| **SHOULD use system browser (native apps)** | RFC 8252 §8.12 | Avoid WebView vulnerabilities |
| **SHOULD use secure storage** | Security BCP §4.3.3 | Protect stored tokens |

**Public Client Configuration Example:**

```json
{
  "client_id": "mobile_app_123",
  "client_type": "public",
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "redirect_uris": [
    "com.example.app://callback",
    "https://app.example.com/callback"
  ],
  "token_endpoint_auth_method": "none",
  "require_pkce": true,
  "access_token_lifetime": 900,  // 15 minutes
  "refresh_token_lifetime": 604800,  // 7 days
  "refresh_token_rotation": true
}
```

### 4.3 Confidential Client Security Requirements

**MUST Requirements:**

| Requirement | Reference | Threat Mitigated |
|------------|-----------|------------------|
| **MUST authenticate at token endpoint** | RFC 6749 §2.3 | Client impersonation |
| **MUST use state parameter** | Security BCP §4.7 | CSRF attacks |
| **MUST use exact redirect_uri** | Security BCP §4.1.3 | Open redirect attacks |
| **MUST protect client credentials** | RFC 6749 §2.3.1 | Credential theft |

**SHOULD Requirements:**

| Requirement | Reference | Benefit |
|------------|-----------|---------|
| **SHOULD use PKCE** | Security BCP §2.1.1 | Defense in depth |
| **SHOULD use asymmetric authentication** | Security BCP §4.5.2 | Better than shared secret |
| **SHOULD rotate credentials** | Security BCP §4.5.2 | Limit credential compromise |
| **SHOULD use confidential storage** | Security BCP §4.5.2 | Protect secrets (HSM, Vault) |

**Confidential Client Configuration Example:**

```json
{
  "client_id": "backend_app_456",
  "client_type": "confidential",
  "client_secret": "256_bit_random_secret",
  "grant_types": ["authorization_code", "client_credentials", "refresh_token"],
  "response_types": ["code"],
  "redirect_uris": [
    "https://backend.example.com/oauth/callback"
  ],
  "token_endpoint_auth_method": "client_secret_post",
  "require_pkce": false,  // SHOULD be true
  "access_token_lifetime": 3600,  // 1 hour (can be longer)
  "refresh_token_lifetime": 2592000  // 30 days
}
```

### 4.4 Client Type Decision Tree

```
┌─────────────────────────────────────────────────────────┐
│         Client Type Decision Tree                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  START: Where does your code run?                       │
│    │                                                     │
│    ├─ User's browser (JavaScript)                       │
│    │  └─> PUBLIC CLIENT                                 │
│    │      Example: SPA (React, Angular, Vue)            │
│    │      Requirements:                                 │
│    │      - Authorization code + PKCE                   │
│    │      - No client_secret                            │
│    │      - Tokens in memory (not localStorage)         │
│    │                                                     │
│    ├─ User's mobile device (native app)                 │
│    │  └─> PUBLIC CLIENT                                 │
│    │      Example: iOS/Android app                      │
│    │      Requirements:                                 │
│    │      - Authorization code + PKCE                   │
│    │      - System browser (not WebView)                │
│    │      - Keychain/Keystore for tokens                │
│    │                                                     │
│    ├─ User's desktop (native app)                       │
│    │  └─> PUBLIC CLIENT                                 │
│    │      Example: Electron, desktop app                │
│    │      Requirements:                                 │
│    │      - Authorization code + PKCE                   │
│    │      - Secure local storage                        │
│    │                                                     │
│    ├─ Your secure server (backend)                      │
│    │  └─> CONFIDENTIAL CLIENT                           │
│    │      Example: Traditional web app, service         │
│    │      Requirements:                                 │
│    │      - Can use client_secret                       │
│    │      - Server-side session management              │
│    │      - PKCE recommended (not required)             │
│    │                                                     │
│    └─ User's device but EMBEDDED in malicious app       │
│       └─> PUBLIC CLIENT (cannot trust environment)      │
│           Example: Code that could be reverse-engineered│
│           Requirements:                                 │
│           - Assume hostile environment                  │
│           - PKCE REQUIRED                               │
│           - No secrets in code                          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 4.5 Client Type Comparison Table

| Characteristic | Public Client | Confidential Client |
|----------------|---------------|---------------------|
| **Environment** | User-controlled | Server-controlled |
| **Examples** | SPA, mobile app, desktop app | Backend web app, service |
| **Can Keep Secret** | ❌ No | ✅ Yes |
| **Client Authentication** | None | client_secret or private_key_jwt |
| **PKCE** | ✅ REQUIRED | ⚠️ RECOMMENDED |
| **Access Token Lifetime** | Short (5-15 min) | Medium (30-60 min) |
| **Refresh Token Rotation** | ✅ REQUIRED | ⚠️ RECOMMENDED |
| **Primary Threats** | Code interception, XSS, app compromise | Server compromise, credential theft |
| **Token Storage** | Memory, Keychain/Keystore | Encrypted database, memory |

---

## 5. Flow Selection (Security BCP §2.1)

### 5.1 Recommended Flows

**RECOMMENDED for Use (Security BCP §2.1):**

```
1. Authorization Code Flow + PKCE
   ├─ Use for: ALL client types (public & confidential)
   ├─ User context: ✓ (user authorization required)
   ├─ Security: Highest
   └─ Status: Standard, OAuth 2.1 default

2. Client Credentials Flow
   ├─ Use for: Service-to-service (no user)
   ├─ User context: ✗ (machine-to-machine)
   ├─ Security: Good (confidential clients only)
   └─ Status: Standard

3. Device Authorization Flow (RFC 8628)
   ├─ Use for: Input-constrained devices
   ├─ User context: ✓ (user authorizes on different device)
   ├─ Security: Good (with proper user code)
   └─ Status: Standard

4. Refresh Token Flow
   ├─ Use for: Token renewal without re-authentication
   ├─ User context: ✓ (extends user session)
   ├─ Security: Good (with rotation)
   └─ Status: Standard
```

### 5.2 Deprecated Flows (DO NOT USE)

**DEPRECATED - Security BCP §2.1.2:**

```
1. Implicit Flow ❌
   ├─ Problems:
   │  ├─ Tokens in URL (browser history, referrer)
   │  ├─ No refresh token
   │  ├─ XSS exposure
   │  └─ Cannot use PKCE
   ├─ Status: REMOVED in OAuth 2.1
   └─ Replacement: Authorization code + PKCE

2. Resource Owner Password Credentials Flow ❌
   ├─ Problems:
   │  ├─ Exposes user credentials to client
   │  ├─ Cannot do MFA
   │  ├─ Phishing risk
   │  └─ Breaks delegation model
   ├─ Status: REMOVED in OAuth 2.1
   └─ Replacement: Authorization code + PKCE
```

**Why These Flows Are Removed:**

```
Implicit Flow:
┌────────────────────────────────────────┐
│  Authorization Request                 │
│  /authorize?response_type=token...    │
│         │                              │
│         ↓                              │
│  Authorization Response                │
│  https://client.com/callback           │
│    #access_token=SECRET123  ← In URL!  │
│                                        │
│  Problems:                             │
│  1. Token in URL (browser history)    │
│  2. Token in referrer header          │
│  3. XSS can read from location.hash   │
│  4. No refresh token                  │
│  5. Cannot use PKCE                   │
└────────────────────────────────────────┘

Resource Owner Password:
┌────────────────────────────────────────┐
│  Client Application                    │
│  [Username: ____]                      │
│  [Password: ____]                      │
│         │                              │
│         ↓                              │
│  POST /token                           │
│  username=user&password=pass           │
│                                        │
│  Problems:                             │
│  1. Client sees user's password       │
│  2. Phishing opportunity              │
│  3. Cannot do MFA                     │
│  4. User trust required               │
│  5. Breaks OAuth delegation model     │
└────────────────────────────────────────┘
```

### 5.3 Flow Selection Decision Tree

```
┌──────────────────────────────────────────────────────────────┐
│               Flow Selection Decision Tree                    │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  START: What is your use case?                               │
│    │                                                          │
│    ├─ User authorization needed?                             │
│    │  │                                                       │
│    │  YES ─> What type of client?                            │
│    │         │                                                │
│    │         ├─ Browser-based (SPA)                          │
│    │         │  └─> Authorization Code + PKCE                │
│    │         │      - MUST use PKCE                          │
│    │         │      - MUST use state                         │
│    │         │      - Tokens in memory only                  │
│    │         │      - Short access token lifetime            │
│    │         │                                                │
│    │         ├─ Native mobile app                            │
│    │         │  └─> Authorization Code + PKCE                │
│    │         │      - MUST use PKCE                          │
│    │         │      - MUST use system browser                │
│    │         │      - Store in Keychain/Keystore             │
│    │         │                                                │
│    │         ├─ Backend web app                              │
│    │         │  └─> Authorization Code (+ PKCE recommended)  │
│    │         │      - MUST authenticate with client_secret   │
│    │         │      - SHOULD use PKCE (defense in depth)     │
│    │         │      - Server-side session management         │
│    │         │                                                │
│    │         └─ Input-constrained device (TV, IoT)           │
│    │            └─> Device Authorization Flow                │
│    │                - User authorizes on phone/computer      │
│    │                - Device polls for completion            │
│    │                - MUST use PKCE if capable               │
│    │                                                          │
│    └─ NO user (service-to-service)                           │
│       └─> Client Credentials Flow                            │
│           - Confidential clients only                        │
│           - Authenticate with client_secret                  │
│           - Or use mTLS for authentication                   │
│           - No user context in tokens                        │
│                                                               │
│  NEVER USE:                                                  │
│  ❌ Implicit Flow (tokens in URL)                            │
│  ❌ Password Flow (exposes credentials)                      │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 5.4 Flow Comparison Table

| Flow | User Context | Client Type | PKCE | Refresh Token | OAuth 2.1 Status | Security Rating |
|------|-------------|-------------|------|---------------|------------------|-----------------|
| **Authorization Code + PKCE** | ✅ Yes | Public & Confidential | ✅ Required | ✅ Yes | ✅ Standard | ⭐⭐⭐⭐⭐ Highest |
| **Client Credentials** | ❌ No | Confidential only | N/A | ❌ No | ✅ Standard | ⭐⭐⭐⭐ High |
| **Device Authorization** | ✅ Yes | Public | ✅ Required | ✅ Yes | ✅ Standard | ⭐⭐⭐⭐ High |
| **Refresh Token** | ✅ Yes (extends) | Public & Confidential | N/A | N/A | ✅ Standard | ⭐⭐⭐⭐ High (with rotation) |
| **Implicit** | ✅ Yes | Public | ❌ No | ❌ No | ❌ REMOVED | ⭐ Very Low - DO NOT USE |
| **Password** | ✅ Yes | Confidential | ❌ No | ✅ Yes | ❌ REMOVED | ⭐ Very Low - DO NOT USE |

---

## 6. Authorization Request Security (Security BCP §4)

### 6.1 PKCE (Proof Key for Code Exchange)

**Reference:** Security BCP §4.8, RFC 7636  
**Detailed Spec:** [pkce-implementation.md](./pkce-implementation.md)

**Requirements:**

| Requirement | Client Type | Reference |
|------------|-------------|-----------|
| **MUST use PKCE** | Public clients | Security BCP §4.8.1, OAuth 2.1 |
| **SHOULD use PKCE** | Confidential clients | Security BCP §4.8.1 |
| **MUST use S256 method** | All | Security BCP §4.8.2 |
| **MUST NOT use plain method** | All | Security BCP §4.8.2 |
| **MUST validate code_verifier** | Authorization server | Security BCP §4.8.3 |

**PKCE Overview:**

```
Purpose: Bind authorization code to client instance
Threat: Authorization code interception

Flow:
1. Client generates code_verifier (random, 43-128 chars)
2. Client calculates code_challenge = BASE64URL(SHA256(code_verifier))
3. Authorization request includes code_challenge
4. Server stores code_challenge with authorization code
5. Token request includes code_verifier
6. Server validates: SHA256(code_verifier) == stored code_challenge

Security: Even if code intercepted, cannot be used without code_verifier
```

**Quick Implementation:**

```python
import secrets
import hashlib
import base64

# Generate code_verifier
code_verifier = secrets.token_urlsafe(32)  # 43 characters

# Calculate code_challenge
challenge_bytes = hashlib.sha256(code_verifier.encode()).digest()
code_challenge = base64.urlsafe_b64encode(challenge_bytes).rstrip(b'=').decode()

# Authorization request
authorization_url = (
    f"/authorize?"
    f"response_type=code&"
    f"client_id={client_id}&"
    f"code_challenge={code_challenge}&"
    f"code_challenge_method=S256"
)

# Token request (after receiving code)
token_request = {
    "grant_type": "authorization_code",
    "code": authorization_code,
    "code_verifier": code_verifier  # Send verifier
}
```

**See [pkce-implementation.md](./pkce-implementation.md) for complete details.**

### 6.2 state Parameter (CSRF Protection)

**Reference:** Security BCP §4.7, RFC 6749 §10.12  
**Detailed Spec:** [state-parameter-and-csrf.md](./state-parameter-and-csrf.md)

**Requirements:**

| Requirement | Level | Reference |
|------------|-------|-----------|
| **MUST use state parameter** | All clients | Security BCP §4.7.1 |
| **MUST be unpredictable** | 128+ bits entropy | Security BCP §4.7.1 |
| **MUST be single-use** | One-time use | Security BCP §4.7.1 |
| **MUST be session-bound** | Tied to user session | Security BCP §4.7.1 |
| **MUST validate on callback** | All clients | Security BCP §4.7.1 |

**state Overview:**

```
Purpose: CSRF protection, session binding
Threat: Cross-Site Request Forgery

Attack without state:
1. Attacker initiates OAuth flow, gets code
2. Attacker tricks victim into using that code
3. Victim's account linked to attacker's resources

Protection with state:
1. Client generates random state (128+ bits)
2. Client stores state in session
3. Authorization request includes state
4. Server returns state unchanged
5. Client validates state matches stored value
6. If mismatch: Reject (CSRF attack)
```

**Quick Implementation:**

```python
import secrets

# Generate state (before authorization)
state = secrets.token_urlsafe(32)  # 32 bytes = 256 bits
session['oauth_state'] = state

# Authorization request
authorization_url = (
    f"/authorize?"
    f"response_type=code&"
    f"client_id={client_id}&"
    f"state={state}"
)

# Callback validation
def callback(request):
    returned_state = request.args.get('state')
    stored_state = session.get('oauth_state')
    
    if not secrets.compare_digest(returned_state, stored_state):
        raise SecurityError("Invalid state - CSRF attack")
    
    # Clear state (single-use)
    del session['oauth_state']
    
    # Continue with code exchange
```

**See [state-parameter-and-csrf.md](./state-parameter-and-csrf.md) for complete details.**

### 6.3 redirect_uri (Open Redirect Prevention)

**Reference:** Security BCP §4.1, RFC 6749 §3.1.2  
**Detailed Spec:** [redirect-uri-validation.md](./redirect-uri-validation.md)

**Requirements:**

| Requirement | Level | Reference |
|------------|-------|-----------|
| **MUST use exact string matching** | Authorization server | Security BCP §4.1.3 |
| **MUST NOT use pattern matching** | Authorization server | Security BCP §4.1.3 |
| **MUST NOT use wildcards** | Authorization server | Security BCP §4.1.3 |
| **MUST use HTTPS** | All (except localhost) | Security BCP §4.1.1 |
| **MUST register minimal URIs** | Clients | Security BCP §4.1.1 |

**redirect_uri Overview:**

```
Purpose: Specify where authorization server sends code
Threat: Open redirect → authorization code theft

Attack with prefix matching (vulnerable):
Registered: https://client.com/callback
Attack: https://client.com/callback.evil.com
Validation: Prefix matches → ACCEPTED (vulnerable!)
Result: Code sent to evil.com

Protection with exact matching:
Registered: https://client.com/callback
Attack: https://client.com/callback.evil.com
Validation: Exact match → REJECTED ✓
Result: Attack blocked
```

**Validation Algorithm:**

```python
def validate_redirect_uri(requested_uri, registered_uris):
    """
    Exact string matching (Security BCP §4.1.3)
    """
    # Simple exact match - no fancy logic
    return requested_uri in registered_uris

# NEVER do this (vulnerable):
# return any(requested_uri.startswith(reg) for reg in registered_uris)  # WRONG!
# return any(reg in requested_uri for reg in registered_uris)  # WRONG!
```

**See [redirect-uri-validation.md](./redirect-uri-validation.md) for complete details.**

### 6.4 nonce (OpenID Connect)

**Reference:** Security BCP §4.7.2, OIDC Core §3.1.2.1

**Requirements:**

| Requirement | Flow | Reference |
|------------|------|-----------|
| **MUST use nonce** | Implicit flow (if still using) | OIDC Core §3.1.2.1 |
| **SHOULD use nonce** | Authorization code flow | OIDC Core §3.1.2.1 |
| **MUST validate nonce** | ID token validation | OIDC Core §3.1.3.3 |

**nonce Overview:**

```
Purpose: ID token replay protection
Threat: ID token theft and replay

Flow:
1. Client generates random nonce (128+ bits)
2. Authorization request includes nonce
3. Authorization server includes nonce in ID token
4. Client validates nonce in ID token matches sent value

Note: nonce is for ID tokens (OIDC)
      state is for authorization codes (OAuth2)
      Both should be used together in OIDC
```

### 6.5 Authorization Request Checklist

**Complete Authorization Request:**

```http
GET /authorize?
    response_type=code&
    client_id=abc123&
    redirect_uri=https://client.com/callback&
    scope=openid profile&
    state=<random_256_bit_value>&
    code_challenge=<sha256_hash_of_verifier>&
    code_challenge_method=S256&
    nonce=<random_256_bit_value>
```

**Validation Checklist:**

```
☐ response_type=code (not token or id_token)
☐ client_id present and valid
☐ redirect_uri present (if multiple registered)
☐ redirect_uri matches registered URI exactly
☐ scope present and valid
☐ state present (CSRF protection)
☐ state is unpredictable (128+ bits)
☐ code_challenge present (PKCE)
☐ code_challenge_method=S256 (not plain)
☐ nonce present (OIDC)
```

---

*[Document continues with Sections 7-26 in next part...]*

---

**Note:** This is Part 1 of the Security BCP master document. The complete document will span multiple parts due to its comprehensive nature.

*"In OAuth2 security, there are no shortcuts, only varying levels of regret. Choose wisely."*
