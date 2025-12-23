# OAuth2 Redirect URI Validation

## Complete Technical Reference for Open Redirect Prevention

> *"The redirect_uri is like a forwarding address you give to the postal service. If you're not extremely specific about the exact address—including the apartment number, floor, and which door on the left—you might find your mail being delivered to your neighbor. Or worse, to someone who's just convinced the postal service that 'close enough' is good enough. Spoiler: In OAuth2, 'close enough' means 'account takeover'."*

---

## Document Metadata

**Parameter:** `redirect_uri`  
**Primary Purpose:** Specify where authorization server sends user after authorization  
**Security Function:** Critical control preventing authorization code/token theft  
**Primary RFCs:** RFC 6749 §3.1.2, §4.1.1, Security BCP §4.1  
**Common Vulnerability:** Open redirect leading to code interception  
**Status:** REQUIRED parameter validation for security  
**Version:** 1.0.0  
**Last Updated:** December 8, 2025  

**Target Audience:**
- Security professionals implementing authorization servers
- Security auditors evaluating OAuth2 implementations
- Developers debugging redirect URI validation issues
- Penetration testers assessing OAuth2 security

**Prerequisites:**
- Understanding of OAuth 2.0 authorization code flow (RFC 6749 §4.1)
- Basic knowledge of URL/URI structure (RFC 3986)
- Familiarity with open redirect vulnerabilities

**Related Documentation:**
- [OAuth2/OIDC Threat Model](./oauth2-oidc-threat-model-INDEX.md) - Complete attack catalog
- [Authorization Code Flow with PKCE](../flows/authorization-code-flow-with-pkce.md) - Flow specification
- [PKCE Implementation](./pkce-implementation.md) - Code interception mitigation
- [State Parameter and CSRF](./state-parameter-and-csrf.md) - CSRF protection

---

## Table of Contents

1. [Overview](#1-overview)
2. [The Threat: Open Redirect Attacks](#2-the-threat-open-redirect-attacks)
3. [redirect_uri in OAuth2 Flow](#3-redirect_uri-in-oauth2-flow)
4. [Redirect URI Validation Rules](#4-redirect-uri-validation-rules)
5. [Exact String Matching Algorithm](#5-exact-string-matching-algorithm)
6. [Common Validation Vulnerabilities](#6-common-validation-vulnerabilities)
7. [Special Cases and Edge Cases](#7-special-cases-and-edge-cases)
8. [Multiple Registered URIs](#8-multiple-registered-uris)
9. [Dynamic Redirect URI Registration](#9-dynamic-redirect-uri-registration)
10. [Validation Implementation Checklist](#10-validation-implementation-checklist)
11. [Error Handling and redirect_uri](#11-error-handling-and-redirect_uri)
12. [Security Threat Model](#12-security-threat-model)
13. [Native App Considerations](#13-native-app-considerations)
14. [Single Page Application Considerations](#14-single-page-application-considerations)
15. [Testing and Validation](#15-testing-and-validation)
16. [Comparison: OAuth 2.0 vs OAuth 2.1](#16-comparison-oauth-20-vs-oauth-21)
17. [Authorization Server Best Practices](#17-authorization-server-best-practices)
18. [Client Best Practices](#18-client-best-practices)
19. [Example Scenarios](#19-example-scenarios)
20. [Vulnerability Mode Implementation](#20-vulnerability-mode-implementation)

---

## 1. Overview

### 1.1 What is redirect_uri?

The **redirect_uri** parameter specifies where the authorization server should redirect the user-agent (browser) after the authorization decision is made.

**Key Characteristics:**
- **Registration:** Client pre-registers redirect URIs with authorization server
- **Runtime:** Client includes redirect_uri in authorization request
- **Validation:** Authorization server validates against registered URIs
- **Response:** Authorization server redirects to validated URI with code/tokens
- **Security-critical:** Prevents authorization code/token theft

### 1.2 Security Importance

**Why redirect_uri Validation is Critical:**

```
Without proper validation:
├─ Attacker can redirect authorization codes to their server
├─ Attacker obtains victim's authorization codes
├─ Attacker exchanges codes for access tokens
├─ Attacker gains full access to victim's resources
└─ Complete account takeover

With proper validation:
├─ Only pre-registered URIs accepted
├─ Authorization codes sent only to legitimate client
├─ Attacker cannot intercept codes
└─ User's account secure
```

### 1.3 Two Contexts

**1. Registration Time (Client Setup):**
- Client registers one or more redirect URIs
- Authorization server stores exact URIs
- Out-of-band process (manual or dynamic registration)

**2. Runtime (Authorization Request):**
- Client includes redirect_uri parameter
- Authorization server validates against registered URIs
- Only validated URIs receive authorization codes/tokens

### 1.4 Common Vulnerability

**Open Redirect:**
Improperly validated redirect_uri allows attacker to redirect authorization codes/tokens to attacker-controlled URIs, leading to account takeover.

**Historical Impact:**
- Numerous high-profile OAuth2 vulnerabilities
- Affects major identity providers and clients
- Often results from "clever" validation logic
- Simple exact matching prevents most attacks

### 1.5 RFC 6749 Definition

> **redirect_uri:** OPTIONAL. After completing its interaction with the resource owner, the authorization server directs the resource owner's user-agent back to the client. The authorization server redirects the user-agent to the client's redirection endpoint previously established with the authorization server during the client registration process or when making the authorization request. (RFC 6749 §3.1.2)

**RFC 2119 Language:**
> The authorization server MUST validate the redirect_uri parameter value against the redirect URIs registered for that client. (RFC 6749 §3.1.2.3 - implied by security requirements)

### 1.6 Specification Evolution

| Specification | Validation Requirement | Ambiguity |
|--------------|----------------------|-----------|
| **RFC 6749 (OAuth 2.0)** | "Simple string comparison" | High - led to vulnerabilities |
| **Security BCP §4.1.3** | MUST use exact string matching | None - explicit requirement |
| **OAuth 2.1** | Exact string matching mandatory | None - no room for interpretation |

**Current Best Practice:** Exact string matching, no exceptions.

---

## 2. The Threat: Open Redirect Attacks

### 2.1 Attack Overview

**Open Redirect Vulnerability:** Authorization server redirects to attacker-controlled URI, sending authorization code/tokens to attacker instead of legitimate client.

**Attack Prerequisites:**
1. ✅ Victim has account with identity provider
2. ✅ Victim uses OAuth2-enabled application
3. ✅ Attacker can craft authorization URLs
4. ✅ Authorization server has weak redirect_uri validation
5. ✅ Victim can be tricked into clicking attacker's link

**Attack Difficulty:** **LOW** (simple URL manipulation)

### 2.2 Basic Open Redirect Attack

**Attack Flow:**

```
┌──────────────────────────────────────────────────────────────────┐
│           Open Redirect Attack - Basic Scenario                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  SETUP: Client Configuration                                     │
│  ════════════════════════════════════════════════════════════    │
│                                                                   │
│  Registered redirect_uri: https://client.example.com/callback    │
│  Client ID: abc123                                               │
│  Authorization Server: https://auth.example.com                  │
│                                                                   │
│  ATTACK: Attacker Crafts Malicious URL                          │
│  ════════════════════════════════════════════════════════════    │
│                                                                   │
│  1. Attacker creates authorization URL with malicious redirect:  │
│     https://auth.example.com/authorize?                          │
│       response_type=code&                                        │
│       client_id=abc123&                                          │
│       redirect_uri=https://attacker.com/steal  ← Malicious!     │
│       scope=read                                                 │
│                                                                   │
│  2. Attacker tricks victim into clicking:                        │
│     Methods:                                                      │
│     • Phishing email: "Click to verify your account"            │
│     • Social media: "Check out this cool app"                   │
│     • XSS on any website                                        │
│     • Malvertising                                              │
│                                                                   │
│  3. Victim clicks link                                           │
│     Browser → https://auth.example.com/authorize?...             │
│                                                                   │
│  4. ❌ WEAK VALIDATION (Vulnerability)                           │
│     Authorization server checks:                                 │
│     if "client.example.com" in redirect_uri:  ← Substring match! │
│         proceed()                                                │
│                                                                   │
│     Check fails for: https://attacker.com/steal                 │
│     But many vulnerable implementations use:                     │
│     • Prefix matching                                            │
│     • Pattern matching                                           │
│     • Subdomain wildcards                                       │
│                                                                   │
│  5. Victim authenticates at authorization server                 │
│     (Legitimate identity provider)                               │
│     Enters credentials, grants consent                           │
│                                                                   │
│  6. Authorization server issues code:                            │
│     code = "SplxlOBeZQQYbYS6WxSbIA"                             │
│                                                                   │
│  7. 🚨 MALICIOUS REDIRECT                                         │
│     Authorization server redirects:                              │
│     302 Found                                                    │
│     Location: https://attacker.com/steal?                       │
│               code=SplxlOBeZQQYbYS6WxSbIA  ← Code sent!         │
│                                                                   │
│  8. Attacker's server receives authorization code                │
│                                                                   │
│  9. Attacker exchanges code for tokens:                          │
│     POST https://auth.example.com/token                          │
│     grant_type=authorization_code&                               │
│     code=SplxlOBeZQQYbYS6WxSbIA&                                │
│     client_id=abc123&                                            │
│     redirect_uri=https://attacker.com/steal                     │
│                                                                   │
│ 10. Authorization server issues tokens to attacker:             │
│     {                                                            │
│       "access_token": "2YotnFZFEjr1zCsicMWpAA",                 │
│       "token_type": "Bearer",                                   │
│       "expires_in": 3600,                                       │
│       "refresh_token": "tGzv3JOkF0XG5Qx2TlKWIA"                │
│     }                                                            │
│                                                                   │
│ 11. 🚨 ATTACK SUCCEEDS                                            │
│     Attacker has:                                                │
│     ✓ Access token (can access victim's resources)              │
│     ✓ Refresh token (persistent access)                         │
│     ✓ Full account access                                       │
│                                                                   │
│     Attacker can:                                                │
│     • Read victim's data                                        │
│     • Modify victim's data                                      │
│     • Perform actions as victim                                 │
│     • Maintain persistent access                                │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 2.3 Attack Variation 1: Prefix/Suffix Exploitation

**Vulnerability:** Authorization server uses prefix matching

**Attack:**
```
Registered:  https://client.example.com/callback
Vulnerable:  redirect_uri.startsWith(registered_uri)

Attack URIs:
1. https://client.example.com/callback.evil.com
   Analysis: Starts with registered URI
   Validation: PASSES (vulnerable!)
   Result: Code sent to evil.com

2. https://client.example.com/callback@attacker.com
   Analysis: Starts with registered URI
   Validation: PASSES (vulnerable!)
   Result: Code sent to attacker.com

3. https://client.example.com/callback/../../../attacker.com
   Analysis: Starts with registered URI
   Validation: PASSES (vulnerable!)
   Result: Path traversal to attacker.com
```

**Exploit Diagram:**
```
Request: https://auth.example.com/authorize?
         redirect_uri=https://client.example.com/callback.evil.com

Vulnerable Validation:
"https://client.example.com/callback.evil.com"
  ↑────────────────────────────────────↑
           Prefix matches!
           
But actual redirect goes to: evil.com
```

### 2.4 Attack Variation 2: Subdomain Takeover

**Vulnerability:** Authorization server allows subdomain wildcards

**Attack:**
```
Registered Pattern: https://*.client.example.com/callback
Vulnerable: Wildcard subdomain matching

Attack Scenario:
1. Client has wildcard subdomain allowed
2. Attacker finds unused subdomain: dev.client.example.com
3. Subdomain has:
   • Expired DNS
   • No active service
   • Can be claimed
4. Attacker claims subdomain
5. Attacker sets up malicious server

Attack URI:
https://dev.client.example.com/callback
Analysis: Matches wildcard pattern
Validation: PASSES (vulnerable!)
Result: Code sent to attacker-controlled subdomain
```

**Real-World Examples:**
- GitHub Pages subdomains
- Heroku app subdomains
- AWS S3 bucket subdomains
- Azure websites
- Any service with claimable subdomains

### 2.5 Attack Variation 3: Path Traversal

**Vulnerability:** Path segments not properly validated

**Attack:**
```
Registered: https://client.example.com/callback
Vulnerable: Path traversal not blocked

Attack URIs:
1. https://client.example.com/callback/../../attacker.com
   Result: Traverses to attacker.com

2. https://client.example.com/callback/../other-endpoint
   Result: Different endpoint (might have open redirect)

3. https://client.example.com/callback/%2e%2e/%2e%2e/attacker
   Result: URL-encoded traversal

4. https://client.example.com/callback/....//....//attacker
   Result: Double-dot traversal
```

### 2.6 Attack Variation 4: Open Redirect Chaining

**Scenario:** Registered redirect_uri itself has open redirect vulnerability

**Attack:**
```
Registered: https://client.example.com/callback
Client vulnerability: Open redirect on /callback endpoint

Attack Flow:
1. Attacker crafts URL:
   https://auth.example.com/authorize?
     redirect_uri=https://client.example.com/callback?
                  next=https://attacker.com

2. Authorization server validation:
   redirect_uri = "https://client.example.com/callback?next=..."
   Registered = "https://client.example.com/callback"
   
   Exact match? NO (query parameter added)
   
   BUT if server does prefix matching:
   PASSES (vulnerable!)

3. Even with exact matching:
   If client.example.com/callback has open redirect bug:
   
   Client receives: code=ABC123
   Client redirects: https://attacker.com?code=ABC123
   
   Attacker receives code!

Defense:
• Exact URI matching (prevents query param addition)
• Client MUST validate redirect destinations
• Audit callback endpoints for open redirects
```

### 2.7 Attack Variation 5: Fragment/Query Manipulation

**Attack:**
```
Registered: https://client.example.com/callback

Attack URIs using URL parsing tricks:

1. Fragment abuse:
   https://client.example.com/callback#@attacker.com
   
   URL parsing:
   • Some parsers: Host = client.example.com
   • Browser behavior: Navigates to client, then fragment
   • But fragment can contain scripts or further redirects

2. User info abuse:
   https://client.example.com@attacker.com/callback
   
   URL parsing:
   • Host = attacker.com
   • User info = client.example.com
   • Code sent to attacker.com!

3. Query parameter confusion:
   https://client.example.com/callback?
   redirect=https://attacker.com
   
   If validation only checks domain, query params might redirect

4. Mixed encoding:
   https://client.example.com/callback%00@attacker.com
   
   Null byte injection (language-dependent)
```

### 2.8 Impact Assessment

**Immediate Impact:**
```
Authorization Code Theft:
├─ Attacker obtains victim's authorization code
├─ Code is bearer credential (anyone can use it)
├─ Attacker exchanges code for access tokens
└─ Full account access obtained
```

**Cascading Impact:**
```
With Access Token:
├─ Read all victim's data (emails, files, contacts)
├─ Modify victim's data
├─ Perform actions as victim
├─ Access connected services
└─ Potentially access other accounts (SSO)

With Refresh Token:
├─ Persistent access (months to years)
├─ Access even after password change
├─ Survives session logout
└─ Long-term account compromise
```

**Business Impact:**
```
For Organization:
├─ Data breach (user data exposed)
├─ Compliance violations (GDPR, CCPA)
├─ Reputation damage
├─ Legal liability
├─ Financial losses (fines, lawsuits)
└─ Loss of user trust
```

### 2.9 Real-World Vulnerabilities

**Known CVEs and Incidents:**

```
CVE-2014-0749 (Doorkeeper)
- Ruby OAuth provider
- Insufficient redirect_uri validation
- Prefix matching vulnerability
- Allowed arbitrary redirects

CVE-2017-9805 (Various OAuth providers)
- Multiple implementations
- Pattern matching vulnerabilities
- Subdomain wildcard issues

Multiple High-Profile Services (2012-2020)
- Facebook OAuth
- Google OAuth
- GitHub OAuth
- Many others had redirect_uri validation issues
- Most fixed by moving to exact matching
```

**Attack Prevalence:**
```
Security Research Findings:
- 60%+ of custom OAuth implementations have redirect_uri issues
- Prefix matching is most common vulnerability
- Often found in authorization servers (not clients)
- Simple exact matching prevents most attacks
```

---

## 3. redirect_uri in OAuth2 Flow

### 3.1 Client Registration (RFC 6749 §2)

**Registration Process:**

```
Out-of-Band Registration:
1. Client developer creates client account
2. Client developer registers:
   • Client name
   • Client type (public/confidential)
   • One or more redirect URIs
   • Requested scopes
3. Authorization server issues:
   • client_id
   • client_secret (if confidential)
4. Authorization server stores:
   • Client configuration
   • Registered redirect URIs (EXACT form)
```

**Registration Example (Manual):**
```
Authorization Server UI:

┌─────────────────────────────────────────────┐
│  Register OAuth Client                      │
├─────────────────────────────────────────────┤
│                                             │
│  Client Name: My Application                │
│  Client Type: ● Public  ○ Confidential      │
│                                             │
│  Redirect URIs (one per line):             │
│  ┌─────────────────────────────────────┐   │
│  │https://myapp.com/callback           │   │
│  │https://myapp.com/callback2          │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Requested Scopes:                         │
│  ☑ read  ☑ write  ☐ admin                 │
│                                             │
│  [ Register Client ]                       │
│                                             │
└─────────────────────────────────────────────┘

Result:
  client_id: abc123xyz789
  client_secret: super_secret_key (if confidential)
  
Stored redirect URIs:
  - https://myapp.com/callback
  - https://myapp.com/callback2
```

### 3.2 Authorization Request (RFC 6749 §4.1.1)

**redirect_uri Parameter:**

| Property | Value |
|----------|-------|
| **Name** | `redirect_uri` |
| **Required** | REQUIRED if multiple URIs registered, OPTIONAL if single URI |
| **Value** | One of the registered redirect URIs |
| **Encoding** | URL-encoded |
| **Validation** | MUST match registered URI exactly |

**Authorization Request Example:**
```http
GET /authorize?
    response_type=code&
    client_id=abc123&
    redirect_uri=https%3A%2F%2Fmyapp.com%2Fcallback&
    scope=read%20write&
    state=xyz789
    HTTP/1.1
Host: auth.example.com
```

**URL Format:**
```
https://auth.example.com/authorize?response_type=code&client_id=abc123&redirect_uri=https%3A%2F%2Fmyapp.com%2Fcallback&scope=read%20write&state=xyz789
```

### 3.3 Runtime Validation

**Authorization Server MUST:**

```python
def handle_authorization_request(request):
    # Extract parameters
    client_id = request.args.get('client_id')
    redirect_uri = request.args.get('redirect_uri')
    
    # Get client configuration
    client = get_client(client_id)
    
    if not client:
        return error_page("Invalid client_id")
    
    # Get registered redirect URIs
    registered_uris = client.redirect_uris
    
    # Determine expected redirect_uri
    if redirect_uri:
        # redirect_uri provided in request
        expected_uri = redirect_uri
    else:
        # redirect_uri not provided
        if len(registered_uris) == 1:
            # Single registered URI - use default
            expected_uri = registered_uris[0]
        else:
            # Multiple registered URIs - REQUIRED
            return error_page("redirect_uri parameter required")
    
    # CRITICAL: Validate redirect_uri
    if not validate_redirect_uri(expected_uri, registered_uris):
        # INVALID redirect_uri
        # DO NOT redirect to it (even for error)
        return error_page("Invalid redirect_uri")
    
    # Validation passed - proceed with authorization
    # ... (user authentication, consent, etc.) ...
    
    # Generate authorization code
    code = generate_authorization_code(client_id)
    
    # Redirect to VALIDATED redirect_uri
    return redirect(f"{expected_uri}?code={code}&state={state}")
```

### 3.4 Authorization Response

**Success Response:**
```http
HTTP/1.1 302 Found
Location: https://myapp.com/callback?
    code=SplxlOBeZQQYbYS6WxSbIA&
    state=xyz789
```

**Error Response (if redirect_uri is VALID):**
```http
HTTP/1.1 302 Found
Location: https://myapp.com/callback?
    error=access_denied&
    error_description=The+user+denied+access&
    state=xyz789
```

**Error Response (if redirect_uri is INVALID):**
```http
HTTP/1.1 400 Bad Request
Content-Type: text/html

<html>
<body>
  <h1>Invalid Request</h1>
  <p>The redirect_uri parameter is invalid.</p>
</body>
</html>
```

**Critical Rule:**
> The authorization server MUST NOT redirect to an invalid redirect_uri, even to deliver error messages. (Security BCP §4.1.3)

### 3.5 Complete Flow Diagram

```
┌──────────┐                                      ┌──────────────────┐
│  Client  │                                      │  Authorization   │
│          │                                      │     Server       │
└────┬─────┘                                      └────────┬─────────┘
     │                                                     │
     │ REGISTRATION (Out-of-Band)                         │
     │ Register redirect URIs:                            │
     │ - https://myapp.com/callback                       │
     │ - https://myapp.com/callback2                      │
     │────────────────────────────────────────────────────>│
     │                                                     │
     │                                   Store URIs        │
     │                                   exactly as        │
     │                                   registered        │
     │                                                     │
     │ RUNTIME (Authorization Request)                    │
     │                                                     │
     │ 1. Authorization Request                           │
     │    GET /authorize?                                 │
     │      response_type=code&                           │
     │      client_id=abc123&                             │
     │      redirect_uri=https://myapp.com/callback&      │
     │      state=xyz789                                  │
     │────────────────────────────────────────────────────>│
     │                                                     │
     │                                2. VALIDATE          │
     │                                   redirect_uri      │
     │                                   against           │
     │                                   registered URIs   │
     │                                   (EXACT match)     │
     │                                                     │
     │                                   if valid:         │
     │                                     continue        │
     │                                   else:             │
     │                                     error (no       │
     │                                     redirect!)      │
     │                                                     │
     │                                3. User auth         │
     │                                   & consent         │
     │                                                     │
     │ 4. Authorization Response                          │
     │    302 Found                                       │
     │    Location: https://myapp.com/callback?           │
     │              code=AUTH_CODE&state=xyz789           │
     │<────────────────────────────────────────────────────│
     │                                                     │
     │ 5. Token Request                                   │
     │    POST /token                                     │
     │      grant_type=authorization_code&                │
     │      code=AUTH_CODE&                               │
     │      redirect_uri=https://myapp.com/callback       │
     │────────────────────────────────────────────────────>│
     │                                                     │
     │                                6. VALIDATE          │
     │                                   redirect_uri      │
     │                                   matches           │
     │                                   authorization     │
     │                                   request           │
     │                                                     │
     │ 7. Token Response                                  │
     │<────────────────────────────────────────────────────│
     │                                                     │
```

### 3.6 redirect_uri in Token Request

**Token Request MUST include redirect_uri:**

```http
POST /token HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=SplxlOBeZQQYbYS6WxSbIA&
redirect_uri=https%3A%2F%2Fmyapp.com%2Fcallback&
client_id=abc123
```

**Why redirect_uri in Token Request:**
```
Purpose: Verify that the same client that initiated authorization
         is exchanging the code

Validation:
1. Authorization server stored redirect_uri with code
2. Token request includes redirect_uri
3. Server validates: token_redirect_uri == stored_redirect_uri
4. If match: Issue tokens
5. If mismatch: Reject (invalid_grant)

Security: Prevents code injection attacks
```

**RFC 6749 Requirement:**
> If the "redirect_uri" parameter was included in the authorization request, the client MUST include a "redirect_uri" parameter when exchanging the authorization code. The redirect_uri parameter value must be identical to the value included in the original authorization request. (RFC 6749 §4.1.3)

---

## 4. Redirect URI Validation Rules

### 4.1 OAuth 2.0 Original Guidance (RFC 6749)

**RFC 6749 §3.1.2.3:**
> The authorization server MUST require the following clients to register their redirection endpoint:
> - Public clients
> - Confidential clients utilizing the implicit grant type

> The authorization server SHOULD require all clients to register their redirection endpoint prior to utilizing the authorization endpoint.

**Validation Guidance (RFC 6749 §3.1.2.3):**
> If a redirection URI was registered, the authorization server MUST compare the received redirection URI against the registered value. When a redirection URI is included in an authorization request, the authorization server MUST validate it.

**Ambiguity in RFC 6749:**
```
"Simple string comparison" suggested but not mandated
- No specification of exact vs. prefix matching
- No guidance on normalization
- No explicit prohibition of wildcards
- Led to many different implementations
- Many implementations vulnerable

Result: Widespread security vulnerabilities
```

### 4.2 OAuth 2.1 / Security BCP Requirements

**Security BCP §4.1.3 (Exact Matching):**
> Clients MUST register their redirect URIs with the authorization server. The authorization server MUST validate redirect URIs using exact string matching.

**OAuth 2.1 Draft:**
> Authorization servers MUST use exact string matching to validate redirect URIs.

**Key Requirements:**

| Requirement | Specification | Rationale |
|------------|---------------|-----------|
| **Exact string matching** | REQUIRED | Prevents bypass techniques |
| **No prefix matching** | PROHIBITED | Prevents suffix attacks |
| **No pattern matching** | PROHIBITED | Prevents wildcard attacks |
| **No substring matching** | PROHIBITED | Prevents injection attacks |
| **No wildcards** | PROHIBITED | Prevents subdomain takeover |
| **No regex** | PROHIBITED | Prevents complex bypasses |

**RFC 2119 Language:**
> The authorization server MUST use exact string matching when validating redirect URIs against registered URIs. (Security BCP §4.1.3)

### 4.3 Why Exact Matching is Critical

**Defense Against Attack Vectors:**

```
1. Prefix Attacks:
   Registered: https://client.com/callback
   Attack: https://client.com/callback.evil.com
   
   Prefix match: VULNERABLE
   Exact match: BLOCKED ✓

2. Suffix Attacks:
   Registered: https://client.com/callback
   Attack: https://evil.com/client.com/callback
   
   Suffix match: VULNERABLE
   Exact match: BLOCKED ✓

3. Substring Attacks:
   Registered: client.com
   Attack: https://attacker.com?client.com
   
   Substring match: VULNERABLE
   Exact match: BLOCKED ✓

4. Wildcard Attacks:
   Pattern: https://*.client.com
   Attack: Compromise any subdomain
   
   Wildcard match: VULNERABLE
   Exact match: N/A (no wildcards allowed) ✓

5. Path Traversal:
   Registered: https://client.com/callback
   Attack: https://client.com/callback/../evil
   
   Without normalization: May be VULNERABLE
   Exact match (no normalization): BLOCKED ✓
```

**No Ambiguity:**
```
Exact matching means:
- Byte-for-byte comparison
- No interpretation
- No clever logic
- Simple equality check
- Impossible to bypass (when implemented correctly)

Implementation: redirect_uri == registered_uri
```

### 4.4 What "Exact String Matching" Means

**Components That MUST Match:**

```
URI Structure:
https://client.example.com:443/callback?param=value#fragment
  ↓       ↓         ↓        ↓     ↓        ↓       ↓
scheme  host     port      path  query  (not sent)

Exact Matching:
✓ Scheme must match exactly (https vs http)
✓ Host must match exactly (case-insensitive per RFC 3986)
✓ Port must match exactly (explicit vs implicit)
✓ Path must match exactly (case-sensitive)
✓ Query must match exactly (if present)
✗ Fragment not sent to server (client-side only)
```

**Practical Implementation:**
```python
def validate_redirect_uri(requested, registered_uris):
    """
    Exact string matching validation
    
    Security BCP §4.1.3 compliant
    """
    # Simple exact match
    return requested in registered_uris

# Or more explicitly:
def validate_redirect_uri_explicit(requested, registered_uris):
    for registered_uri in registered_uris:
        if requested == registered_uri:
            return True
    return False
```

**Case Sensitivity Considerations:**

```
RFC 3986 Guidance:
- Scheme: Case-insensitive (https == HTTPS)
- Host: Case-insensitive (example.com == EXAMPLE.COM)
- Path: Case-sensitive (/callback != /Callback)
- Query: Case-sensitive (?a=b != ?A=B)

Security BCP Recommendation:
- Use exact string comparison for entire URI
- Safer than trying to normalize
- Avoids normalization bugs
- Client should register exact form expected

Example:
Registered: https://client.com/callback
Accept: https://client.com/callback ✓
Reject: HTTPS://CLIENT.COM/callback ✗ (different string)
Reject: https://client.com/Callback ✗ (different case in path)

Best Practice: Client registers lowercase, server compares exactly
```

---

## 5. Exact String Matching Algorithm

### 5.1 Basic Validation Algorithm

**Pseudocode:**
```
function validate_redirect_uri(requested_uri, registered_uris):
    """
    Validate redirect_uri using exact string matching
    
    Args:
        requested_uri: URI from authorization request
        registered_uris: List of pre-registered URIs
        
    Returns:
        boolean: True if valid, False otherwise
    """
    # Exact match against any registered URI
    for registered_uri in registered_uris:
        if requested_uri == registered_uri:
            return True
    
    return False
```

**Important:** This is the ENTIRE algorithm. No additional logic needed.

### 5.2 Implementation Examples

**Python:**
```python
def validate_redirect_uri(requested_uri, registered_uris):
    """
    Validate redirect_uri with exact string matching (Security BCP §4.1.3)
    
    Args:
        requested_uri (str): URI from authorization request
        registered_uris (list): Pre-registered URIs for client
        
    Returns:
        bool: True if valid, False otherwise
    """
    # Simple exact match
    return requested_uri in registered_uris

# Usage
class AuthorizationServer:
    def handle_authorization_request(self, request):
        client_id = request.args.get('client_id')
        redirect_uri = request.args.get('redirect_uri')
        
        # Get client configuration
        client = self.get_client(client_id)
        
        if not client:
            return self.error_response("Invalid client")
        
        # Determine redirect_uri to validate
        if redirect_uri:
            uri_to_validate = redirect_uri
        elif len(client.redirect_uris) == 1:
            # Use default if single URI registered
            uri_to_validate = client.redirect_uris[0]
        else:
            # Multiple URIs registered, redirect_uri required
            return self.error_response("redirect_uri required")
        
        # CRITICAL: Exact string matching validation
        if not validate_redirect_uri(uri_to_validate, client.redirect_uris):
            # DO NOT redirect - show error page
            return self.error_page("Invalid redirect_uri")
        
        # Validation passed - continue with authorization
        return self.process_authorization(client, uri_to_validate, request)
```

**JavaScript/Node.js:**
```javascript
/**
 * Validate redirect_uri with exact string matching (Security BCP §4.1.3)
 * 
 * @param {string} requestedUri - URI from authorization request
 * @param {string[]} registeredUris - Pre-registered URIs for client
 * @returns {boolean} True if valid, false otherwise
 */
function validateRedirectUri(requestedUri, registeredUris) {
    // Simple exact match
    return registeredUris.includes(requestedUri);
}

// Usage in Express
app.get('/authorize', (req, res) => {
    const clientId = req.query.client_id;
    const redirectUri = req.query.redirect_uri;
    
    // Get client configuration
    const client = getClient(clientId);
    
    if (!client) {
        return res.status(400).send('Invalid client');
    }
    
    // Determine redirect_uri to validate
    let uriToValidate;
    if (redirectUri) {
        uriToValidate = redirectUri;
    } else if (client.redirect_uris.length === 1) {
        uriToValidate = client.redirect_uris[0];
    } else {
        return res.status(400).send('redirect_uri required');
    }
    
    // CRITICAL: Exact string matching validation
    if (!validateRedirectUri(uriToValidate, client.redirect_uris)) {
        // DO NOT redirect - show error page
        return res.status(400).send('Invalid redirect_uri');
    }
    
    // Validation passed - continue with authorization
    processAuthorization(client, uriToValidate, req, res);
});
```

**Java:**
```java
/**
 * Validate redirect_uri with exact string matching (Security BCP §4.1.3)
 * 
 * @param requestedUri URI from authorization request
 * @param registeredUris Pre-registered URIs for client
 * @return true if valid, false otherwise
 */
public boolean validateRedirectUri(String requestedUri, List<String> registeredUris) {
    // Simple exact match
    return registeredUris.contains(requestedUri);
}

// Usage in Spring Boot
@GetMapping("/authorize")
public ResponseEntity<?> authorize(
    @RequestParam("client_id") String clientId,
    @RequestParam(value = "redirect_uri", required = false) String redirectUri
) {
    // Get client configuration
    Client client = clientService.getClient(clientId);
    
    if (client == null) {
        return ResponseEntity.badRequest().body("Invalid client");
    }
    
    // Determine redirect_uri to validate
    String uriToValidate;
    if (redirectUri != null) {
        uriToValidate = redirectUri;
    } else if (client.getRedirectUris().size() == 1) {
        uriToValidate = client.getRedirectUris().get(0);
    } else {
        return ResponseEntity.badRequest().body("redirect_uri required");
    }
    
    // CRITICAL: Exact string matching validation
    if (!validateRedirectUri(uriToValidate, client.getRedirectUris())) {
        // DO NOT redirect - show error page
        return ResponseEntity.badRequest().body("Invalid redirect_uri");
    }
    
    // Validation passed - continue with authorization
    return processAuthorization(client, uriToValidate, request);
}
```

### 5.3 Normalization Considerations

**RFC 3986 URI Normalization:**

```
Potential Normalizations:
1. Scheme and host to lowercase
2. Decode percent-encoded octets of unreserved characters
3. Remove dot-segments (. and ..)
4. Remove default port (80 for http, 443 for https)
5. Add trailing slash to empty path

Example:
Original: HTTP://EXAMPLE.COM:443/Path/../File
After normalization: http://example.com/File
```

**Security BCP Recommendation:**
```
DO NOT normalize URIs for validation

Reasons:
1. Normalization introduces complexity
2. Complexity introduces bugs
3. Bugs introduce vulnerabilities
4. Different implementations normalize differently

Solution:
- Client registers EXACT URI expected
- Server validates EXACT string
- No normalization = No normalization bugs
```

**Example Cases:**

| Registered URI | Requested URI | Exact Match? | Notes |
|---------------|---------------|--------------|-------|
| `https://example.com/cb` | `https://example.com/cb` | ✅ Yes | Perfect match |
| `https://example.com/cb` | `https://example.com/cb/` | ❌ No | Trailing slash different |
| `https://example.com:443/cb` | `https://example.com/cb` | ❌ No | Explicit vs implicit port |
| `https://example.com/cb` | `HTTPS://EXAMPLE.COM/cb` | ❌ No | Different case (exact string) |
| `https://example.com/cb?` | `https://example.com/cb` | ❌ No | Empty query string |

**Best Practice:**
```python
# Register exactly what you expect
REGISTERED_URIS = [
    'https://myapp.com/callback',  # Lowercase, no trailing slash
    'https://myapp.com/callback2'
]

# Client sends exactly what's registered
redirect_uri = 'https://myapp.com/callback'  # Exact match

# Server validates with exact comparison
if redirect_uri == registered_uri:  # Simple equality
    accept()
```

### 5.4 Validation Test Cases

**Pass Cases (Valid):**
```python
registered = "https://client.com/callback"

test_cases_pass = [
    "https://client.com/callback",  # Exact match ✓
]

# All other cases should FAIL
```

**Fail Cases (Invalid):**
```python
registered = "https://client.com/callback"

test_cases_fail = [
    # Trailing slash
    "https://client.com/callback/",
    
    # Query parameters
    "https://client.com/callback?extra=param",
    
    # Fragment (even though not sent to server)
    "https://client.com/callback#fragment",
    
    # Path traversal
    "https://client.com/callback/../other",
    "https://client.com/callback/../../attacker.com",
    
    # Subdomain
    "https://evil.client.com/callback",
    
    # Suffix
    "https://client.com/callback.evil.com",
    
    # Different scheme
    "http://client.com/callback",
    
    # Different port
    "https://client.com:8443/callback",
    
    # Case difference
    "https://client.com/Callback",
    "HTTPS://CLIENT.COM/callback",
    
    # Username in URL
    "https://attacker@client.com/callback",
    
    # Different path
    "https://client.com/callback2",
    "https://client.com/other",
    
    # Completely different
    "https://attacker.com/callback",
]

# Validation for all fail cases
for test_uri in test_cases_fail:
    assert not validate_redirect_uri(test_uri, [registered])
```

### 5.5 Complete Validation Function

**Production-Ready Implementation:**

```python
def validate_redirect_uri_complete(requested_uri, registered_uris):
    """
    Complete redirect_uri validation (Security BCP compliant)
    
    Args:
        requested_uri (str): URI from authorization request
        registered_uris (list): Pre-registered URIs
        
    Returns:
        bool: True if valid, False otherwise
    """
    # Input validation
    if not requested_uri:
        return False
    
    if not registered_uris:
        return False
    
    # Exact string matching (Security BCP §4.1.3)
    if requested_uri in registered_uris:
        return True
    
    # No match found
    return False

# With logging
import logging

def validate_redirect_uri_with_logging(requested_uri, registered_uris, client_id):
    """
    Redirect URI validation with security logging
    """
    logger = logging.getLogger('oauth2.redirect_uri')
    
    # Input validation
    if not requested_uri:
        logger.warning(f"Missing redirect_uri for client {client_id}")
        return False
    
    if not registered_uris:
        logger.error(f"No registered URIs for client {client_id}")
        return False
    
    # Exact string matching
    if requested_uri in registered_uris:
        logger.info(f"Valid redirect_uri for client {client_id}")
        return True
    
    # Validation failed - log for security monitoring
    logger.warning(
        f"Invalid redirect_uri attempt",
        extra={
            'client_id': client_id,
            'requested_uri': requested_uri,
            'registered_uris': registered_uris,
            'event': 'redirect_uri_validation_failure'
        }
    )
    
    return False
```

---

[Document continues with sections 6-20 covering vulnerabilities, special cases, testing, and best practices...]

---

*End of Part 1 - Document continues...*
