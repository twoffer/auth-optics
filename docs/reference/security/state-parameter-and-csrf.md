# OAuth2 State Parameter and CSRF Protection

## Complete Technical Reference for CSRF Prevention

> *"The state parameter is like the secret handshake you agree upon with the bouncer before you go into a crowded nightclub. When you come back out through the exit—possibly hours later, definitely more confused, and surrounded by redirects that all look suspiciously similar—the bouncer asks for the handshake. If you can't reproduce it exactly, you're probably an attacker who snuck in through the side door. Or worse, you're an attacker who convinced someone else to give them your coat check ticket."*

---

## Document Metadata

**Parameter:** `state`  
**Primary Purpose:** Cross-Site Request Forgery (CSRF) protection  
**Secondary Purpose:** Application state preservation across redirects  
**Primary RFCs:** RFC 6749 §4.1.1, §10.12, Security BCP §4.7  
**Status:** RECOMMENDED (RFC 6749), effectively REQUIRED for security  
**Version:** 1.0.0  
**Last Updated:** December 8, 2025  

**Target Audience:**
- Security professionals implementing OAuth2/OIDC flows
- Security auditors evaluating CSRF vulnerabilities
- Developers debugging state validation failures
- Penetration testers assessing OAuth2 security

**Prerequisites:**
- Understanding of OAuth 2.0 authorization code flow (RFC 6749 §4.1)
- Basic knowledge of CSRF attacks
- Familiarity with session management concepts

**Related Documentation:**
- [OAuth2/OIDC Threat Model](./oauth2-oidc-threat-model-INDEX.md) - Complete attack catalog
- [Authorization Code Flow with PKCE](../flows/authorization-code-flow-with-pkce.md) - Flow specification
- [PKCE Implementation](./pkce-implementation.md) - Code interception protection

---

## Table of Contents

1. [Overview](#1-overview)
2. [CSRF Attack Without state Parameter](#2-csrf-attack-without-state-parameter)
3. [CSRF Protection with state Parameter](#3-csrf-protection-with-state-parameter)
4. [state Parameter Specification](#4-state-parameter-specification)
5. [state Value Requirements](#5-state-value-requirements)
6. [state Generation Algorithms](#6-state-generation-algorithms)
7. [state Validation Algorithm](#7-state-validation-algorithm)
8. [CSRF Attack Variations](#8-csrf-attack-variations)
9. [state Parameter in Different Flows](#9-state-parameter-in-different-flows)
10. [state vs nonce](#10-state-vs-nonce)
11. [Security Considerations](#11-security-considerations)
12. [Common Implementation Errors](#12-common-implementation-errors)
13. [Testing and Penetration Testing](#13-testing-and-penetration-testing)
14. [state Parameter and User Experience](#14-state-parameter-and-user-experience)
15. [OAuth 2.1 and Security BCP Guidance](#15-oauth-21-and-security-bcp-guidance)
16. [Vulnerability Mode Implementation](#16-vulnerability-mode-implementation)
17. [Example Scenarios](#17-example-scenarios)
18. [Integration with Other Security Mechanisms](#18-integration-with-other-security-mechanisms)

---

## 1. Overview

### 1.1 What is the state Parameter?

The **state parameter** is an opaque value used by OAuth 2.0 clients to:
1. **Prevent CSRF attacks** (primary purpose)
2. **Maintain application state** across authorization redirects (secondary purpose)

**Key Characteristics:**
- **Opaque to authorization server:** Server doesn't interpret it, just returns it
- **Client-generated:** Client creates and validates the state
- **Round-trip parameter:** Sent in request, returned unchanged in response
- **Security-critical:** Protects against Cross-Site Request Forgery

### 1.2 Primary Purpose: CSRF Protection

**CSRF Attack Definition:**
Cross-Site Request Forgery tricks a victim's authenticated browser into executing unwanted actions on a web application. In OAuth 2.0, this means forcing a victim to authorize access to their resources for an attacker's benefit.

**The state parameter prevents this by:**
- Binding authorization requests to specific user sessions
- Providing a secret value only the legitimate client knows
- Allowing detection of forged authorization responses

### 1.3 Secondary Purpose: State Preservation

Beyond security, `state` can encode application state:
- Which page user was on before authorization
- User's intended action after login
- Application-specific context (filters, selections, etc.)

**Example use case:**
```
User on: /profile/settings/link-account
User clicks: "Link Facebook Account"
After OAuth: Return user to /profile/settings/link-account
```

### 1.4 Specification Status

| Specification | Requirement Level | Notes |
|--------------|------------------|-------|
| **RFC 6749 §10.12** | RECOMMENDED | "Clients SHOULD use the state parameter" |
| **Security BCP §4.7** | RECOMMENDED (strongly) | "MUST be used to prevent CSRF" |
| **OAuth 2.1** | De facto REQUIRED | No security without it |
| **OIDC Core** | REQUIRED | When using implicit/hybrid |

**Practical Reality:**
- RFC says "RECOMMENDED"
- Security requires it: **Effectively REQUIRED**
- Modern guidance: **Always use state**

### 1.5 RFC 6749 Definition

> **state:** RECOMMENDED. An opaque value used by the client to maintain state between the request and callback. The authorization server includes this value when redirecting the user-agent back to the client. The parameter SHOULD be used for preventing cross-site request forgery as described in Section 10.12. (RFC 6749 §4.1.1)

**RFC 2119 Language:**
- "RECOMMENDED" (RFC 6749) = SHOULD
- "SHOULD be used for preventing CSRF" (RFC 6749 §10.12)
- Modern interpretation: Treat as REQUIRED for any security-conscious implementation

---

## 2. CSRF Attack Without state Parameter

### 2.1 Attack Overview

**Scenario:** Authorization Code CSRF Attack

Without the `state` parameter, an attacker can forge authorization responses and trick victims into linking their accounts to attacker-controlled resources.

### 2.2 Attack Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                CSRF Attack Without state Parameter                    │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  SETUP PHASE (Attacker Preparation)                                  │
│  ════════════════════════════════════════════════════════════════    │
│                                                                       │
│  1. Attacker visits victim application                               │
│     https://victim-app.com                                            │
│                                                                       │
│  2. Attacker clicks "Link Google Account"                            │
│                                                                       │
│  3. Attacker is redirected to authorization endpoint:                │
│     GET https://accounts.google.com/o/oauth2/v2/auth?                │
│         response_type=code&                                           │
│         client_id=victim_app_id&                                      │
│         redirect_uri=https://victim-app.com/callback&                │
│         scope=profile+email                                           │
│         (❌ NO STATE PARAMETER)                                       │
│                                                                       │
│  4. Attacker logs in with THEIR Google account                       │
│     Email: attacker@evil.com                                          │
│                                                                       │
│  5. Google issues authorization code for attacker's account:         │
│     https://victim-app.com/callback?code=ATTACKER_CODE_ABC123        │
│                                                                       │
│  6. Attacker STOPS before callback completes                         │
│     Copies the callback URL with authorization code                  │
│     Attacker's URL: https://victim-app.com/callback?                 │
│                     code=ATTACKER_CODE_ABC123                         │
│                                                                       │
│  ════════════════════════════════════════════════════════════════    │
│  ATTACK PHASE (Victim Exploitation)                                  │
│  ════════════════════════════════════════════════════════════════    │
│                                                                       │
│  7. Victim is logged into victim-app.com in their browser            │
│     (Has valid session cookie)                                        │
│                                                                       │
│  8. Attacker tricks victim into visiting the callback URL:           │
│     Methods:                                                          │
│     • Phishing email with link                                       │
│     • Hidden iframe on attacker's website                            │
│     • XSS on any website victim visits                               │
│     • Link on social media                                           │
│                                                                       │
│  9. Victim's browser visits:                                         │
│     https://victim-app.com/callback?code=ATTACKER_CODE_ABC123        │
│     ↑ Attacker's code, but victim's session!                         │
│                                                                       │
│ 10. Victim-app.com callback handler:                                 │
│     - Sees valid session for victim                                  │
│     - Receives authorization code ATTACKER_CODE_ABC123               │
│     - ❌ NO STATE VALIDATION (missing state parameter!)              │
│     - Assumes code belongs to victim                                 │
│                                                                       │
│ 11. Victim-app exchanges code for tokens:                            │
│     POST https://accounts.google.com/token                           │
│     code=ATTACKER_CODE_ABC123                                         │
│                                                                       │
│ 12. Google issues tokens for attacker's account (attacker@evil.com)  │
│                                                                       │
│ 13. Victim-app links victim's account to attacker's Google account:  │
│     victim-app-account (victim) → linked to → attacker@evil.com      │
│                                                                       │
│  ════════════════════════════════════════════════════════════════    │
│  EXPLOITATION PHASE                                                   │
│  ════════════════════════════════════════════════════════════════    │
│                                                                       │
│ 14. 🚨 ATTACK SUCCEEDS:                                               │
│     ├─ Victim's account now linked to attacker's Google account      │
│     ├─ Attacker can log into victim's app account using Google SSO   │
│     ├─ Attacker accesses all of victim's data                        │
│     └─ Victim may not notice until checking linked accounts          │
│                                                                       │
│ 15. Attacker exploitation:                                           │
│     ┌─────────────────────────────────────────────────────┐         │
│     │ Attacker visits: https://victim-app.com             │         │
│     │ Clicks: "Sign in with Google"                       │         │
│     │ Uses: attacker@evil.com credentials                 │         │
│     │ Result: Logged into VICTIM's account!               │         │
│     │ Access: All victim's data, settings, resources      │         │
│     └─────────────────────────────────────────────────────┘         │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.3 Why This Attack Succeeds

**Root Cause:**
The application cannot distinguish between:
1. **Legitimate flow:** User initiated authorization → receives their own code
2. **Forged flow:** Attacker initiated authorization → tricks victim into using attacker's code

**Critical Vulnerability:**
```
Without state:
┌──────────────┐         ┌──────────────┐
│  Legitimate  │         │   Attacker   │
│    Request   │         │   Request    │
└──────┬───────┘         └──────┬───────┘
       │                        │
       │  Both look identical   │
       │  to callback handler   │
       │                        │
       ▼                        ▼
   ┌────────────────────────────────┐
   │  /callback?code=SOME_CODE      │
   │  (No way to verify origin!)    │
   └────────────────────────────────┘
```

### 2.4 Impact Assessment

**Immediate Impact:**
- **Account Takeover:** Attacker gains full access to victim's account
- **Data Exposure:** Attacker accesses all victim's data
- **Privilege Escalation:** Attacker inherits victim's permissions
- **Persistent Access:** Link remains until victim notices and removes it

**Real-World Consequences:**

| Attack Type | Impact | Example |
|------------|---------|---------|
| **Social Media Linkage** | Attacker links their Facebook to victim's app | Can impersonate victim, post as victim |
| **Cloud Storage** | Attacker links their Google Drive to victim's backup app | Accesses all backed-up files |
| **Payment Services** | Attacker links their PayPal to victim's e-commerce account | Makes purchases with victim's stored payment methods |
| **Enterprise SSO** | Attacker links their corporate account to victim's profile | Gains access to enterprise resources |

### 2.5 Attack Prerequisites

**What Attacker Needs:**
1. ✅ Victim has an account on target application
2. ✅ Application supports account linking (e.g., "Link Google Account")
3. ✅ Application doesn't validate `state` parameter
4. ✅ Ability to trick victim into clicking a link (phishing, XSS, etc.)

**What Attacker Does NOT Need:**
- ❌ Victim's credentials (application or OAuth provider)
- ❌ Access to victim's session initially
- ❌ Complex technical exploitation
- ❌ Any vulnerability beyond missing state validation

**Attack Difficulty:** **LOW** (point-and-click exploitation)

### 2.6 Real-World Example

**Scenario: Social Media Photo Sharing App**

```
Application: PhotoShare (photo sharing platform)
Feature: "Link Instagram to auto-import photos"

Attack Flow:
1. Attacker creates PhotoShare account: attacker@evil.com
2. Attacker initiates "Link Instagram" flow
3. Attacker authenticates with THEIR Instagram (@attacker_ig)
4. Attacker captures callback URL with authorization code
5. Attacker crafts phishing email to victim:
   
   From: notifications@photosha.re (spoofed)
   Subject: Your Instagram photos are ready to import!
   Body: Click here to complete Instagram linking: [malicious link]
   Link: https://photoshare.com/callback?code=ATTACKER_CODE

6. Victim (already logged into PhotoShare) clicks link
7. PhotoShare links victim's account to @attacker_ig
8. Attacker logs into PhotoShare using Instagram SSO (@attacker_ig)
9. Attacker accesses victim's PhotoShare account
10. Impact:
    - Attacker sees all victim's private photos
    - Attacker can post photos as victim
    - Attacker can delete victim's photos
    - Attacker can change account settings
```

### 2.7 Historical Vulnerabilities

**Known CVEs and Incidents:**

```
CVE-2014-0749 (Doorkeeper)
- OAuth provider gem for Ruby
- Missing state validation by default
- Account takeover via CSRF

Multiple High-Profile Services (2014-2016)
- Several major OAuth providers and consumers
- Missing or weak state validation
- Account linkage attacks in the wild

OWASP Top 10 2017: A2:2017-Broken Authentication
- CSRF in OAuth flows specifically mentioned
- state parameter as required mitigation
```

---

## 3. CSRF Protection with state Parameter

### 3.1 Protection Overview

The `state` parameter creates a **secret binding** between:
1. The authorization request (initiated by client)
2. The authorization response (received from server)

**Core Principle:** Only the legitimate client knows the `state` value associated with a specific authorization attempt.

### 3.2 Protection Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│              CSRF Protection WITH state Parameter                     │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  LEGITIMATE USER FLOW (Protected)                                    │
│  ════════════════════════════════════════════════════════════════    │
│                                                                       │
│  1. User visits application, clicks "Link Google Account"            │
│                                                                       │
│  2. Client generates cryptographically random state:                 │
│     state = "xyz789abc123def456random"  (128+ bits entropy)          │
│                                                                       │
│  3. Client stores state in user's session:                           │
│     session['oauth_state'] = "xyz789abc123def456random"              │
│                                                                       │
│  4. Client redirects to authorization endpoint WITH state:           │
│     GET https://accounts.google.com/o/oauth2/v2/auth?                │
│         response_type=code&                                           │
│         client_id=my_app_id&                                          │
│         redirect_uri=https://myapp.com/callback&                     │
│         state=xyz789abc123def456random  ← State included!            │
│                                                                       │
│  5. User authenticates at Google with their credentials              │
│                                                                       │
│  6. Google returns authorization code WITH state:                    │
│     302 Found                                                         │
│     Location: https://myapp.com/callback?                            │
│         code=USER_LEGITIMATE_CODE&                                    │
│         state=xyz789abc123def456random  ← State returned unchanged   │
│                                                                       │
│  7. Callback handler receives request                                │
│                                                                       │
│  8. ✅ STATE VALIDATION:                                              │
│     received_state = "xyz789abc123def456random" (from URL)           │
│     expected_state = "xyz789abc123def456random" (from session)       │
│     if received_state == expected_state:                             │
│         ✓ VALID - This is the legitimate response                    │
│                                                                       │
│  9. Client exchanges code for tokens (validation passed)             │
│                                                                       │
│ 10. User's account successfully linked to their own Google account   │
│                                                                       │
│  ════════════════════════════════════════════════════════════════    │
│  CSRF ATTACK ATTEMPT (Blocked)                                       │
│  ════════════════════════════════════════════════════════════════    │
│                                                                       │
│  1. Attacker prepares malicious authorization code:                  │
│     code=ATTACKER_CODE&state=??? ← Attacker doesn't know state!      │
│                                                                       │
│  2. Attacker has three options:                                      │
│                                                                       │
│     Option A: Omit state parameter                                   │
│     ─────────────────────────────────────────                        │
│     https://myapp.com/callback?code=ATTACKER_CODE                    │
│     (no state parameter)                                              │
│     │                                                                 │
│     └─> ❌ Validation fails: received_state = None                   │
│         Application rejects: "Missing state parameter"               │
│                                                                       │
│     Option B: Guess state value                                      │
│     ─────────────────────────────────────────────────────────────    │
│     https://myapp.com/callback?                                      │
│         code=ATTACKER_CODE&                                           │
│         state=guessed_value_123                                       │
│     │                                                                 │
│     └─> ❌ Validation fails:                                          │
│         received_state = "guessed_value_123"                         │
│         expected_state = "xyz789abc123def456random"                  │
│         Mismatch! Application rejects.                               │
│         │                                                             │
│         └─> Attacker would need to guess 128-bit random value       │
│             Probability: 1 / 2^128 ≈ 1 / 3.4×10^38                   │
│             Computationally infeasible                               │
│                                                                       │
│     Option C: Use state from their own session                       │
│     ─────────────────────────────────────────────────────────────    │
│     Attacker initiates their own OAuth flow, gets state value       │
│     state_attacker = "attacker_state_value"                          │
│     │                                                                 │
│     └─> Tries to use it for victim:                                  │
│         https://myapp.com/callback?                                  │
│             code=ATTACKER_CODE&                                       │
│             state=attacker_state_value                               │
│         │                                                             │
│         └─> ❌ Validation fails:                                      │
│             This state is bound to ATTACKER's session                │
│             Victim's session has different state                     │
│             States don't match victim's session                      │
│             Application rejects.                                     │
│                                                                       │
│  3. 🛡️ ATTACK BLOCKED                                                 │
│     All attack vectors fail state validation                         │
│     Victim's account remains secure                                  │
│     Attack attempt logged for security monitoring                    │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.3 Why This Protection Works

**Security Properties:**

**1. Unpredictability**
```
Attacker cannot predict victim's state value
- state generated with cryptographic randomness
- 128+ bits of entropy
- Guessing probability: 1 / 2^128 (impossible)
```

**2. Session Binding**
```
state is bound to specific user session
- Stored server-side in session storage
- Different state for each user
- Different state for each authorization attempt
- Attacker's state ≠ Victim's state
```

**3. Single-Use Property**
```
state is (SHOULD be) invalidated after use
- Cannot replay old authorization responses
- Cannot reuse state from previous attempts
- Prevents authorization response replay attacks
```

**4. Integrity Verification**
```
Authorization server returns state unchanged
- Client can verify response corresponds to its request
- Tampered responses detected (state mismatch)
- Server cannot modify state (opaque value)
```

### 3.4 Attack Prevention Matrix

| Attack Scenario | Without state | With state |
|----------------|---------------|------------|
| **Attacker initiates flow, tricks victim into using code** | ✅ Succeeds | ❌ Blocked (state mismatch) |
| **Attacker intercepts and replays old response** | ✅ Succeeds | ❌ Blocked (state expired/used) |
| **Attacker modifies authorization response** | ✅ May succeed | ❌ Blocked (state validation) |
| **Attacker removes state from response** | N/A | ❌ Blocked (missing state) |
| **Attacker guesses state value** | N/A | ❌ Blocked (probability ≈ 0) |
| **Attacker uses their own state** | N/A | ❌ Blocked (wrong session) |

### 3.5 Mathematical Security

**Brute Force Resistance:**
```
Assumptions:
- state has 128 bits of entropy
- Attacker can test 1 billion values per second
- Each test requires full OAuth round-trip

Calculations:
Total possible values: 2^128 ≈ 3.4 × 10^38
Tests per second:      10^9
Seconds per year:      3.15 × 10^7

Years to exhaust:      (2^128 / 10^9) / (3.15 × 10^7)
                     ≈ 1.08 × 10^22 years

Universe age:          1.38 × 10^10 years

Conclusion: Would take ~1 trillion times the age of the universe
```

### 3.6 Comparison: Before and After

**Without state:**
```
Authorization Request:  /authorize?client_id=app
Authorization Response: /callback?code=ABC
                                         ↓
Can this code belong      [?]  Unknown!  [?]
to this user session?           Vulnerable to CSRF
```

**With state:**
```
Authorization Request:  /authorize?client_id=app&state=xyz789
Session Storage:        session['oauth_state'] = 'xyz789'
Authorization Response: /callback?code=ABC&state=xyz789
                                         ↓
Validation:            received == stored ?
                       'xyz789'  == 'xyz789'  ✓
                                         ↓
Can this code belong      [✓]  YES! States match!  [✓]
to this user session?           Protected from CSRF
```

---

## 4. state Parameter Specification

### 4.1 Authorization Request (RFC 6749 §4.1.1)

**Parameter Specification:**

| Property | Value |
|----------|-------|
| **Parameter name** | `state` |
| **Location** | Query parameter in authorization request |
| **Required** | RECOMMENDED (RFC 6749), effectively REQUIRED |
| **Type** | String (opaque to authorization server) |
| **Encoding** | URL-encoded |
| **Maximum length** | No specification limit (practical: < 2KB) |

**RFC 6749 Definition:**
> **state:** RECOMMENDED. An opaque value used by the client to maintain state between the request and callback. The authorization server includes this value when redirecting the user-agent back to the client. The parameter SHOULD be used for preventing cross-site request forgery as described in Section 10.12. (RFC 6749 §4.1.1)

### 4.2 Authorization Request Example

**Complete Authorization Request:**
```http
GET /authorize?
    response_type=code&
    client_id=s6BhdRkqt3&
    redirect_uri=https%3A%2F%2Fclient.example.com%2Fcb&
    scope=read+write&
    state=af0ifjsldkj
    HTTP/1.1
Host: server.example.com
```

**URL Format:**
```
https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fclient.example.com%2Fcb&scope=read+write&state=af0ifjsldkj
```

**Parameter Breakdown:**
```
state=af0ifjsldkj
  ↓
  └─ Opaque value (client-generated)
     - Unpredictable to authorization server
     - Unpredictable to attacker
     - Bound to client session
```

### 4.3 Authorization Response (RFC 6749 §4.1.2)

**Server Behavior (REQUIRED):**

The authorization server MUST:
1. Store the `state` value received in authorization request
2. Return `state` **unchanged** in authorization response
3. Return state with **exact same value** (byte-for-byte identical)

**RFC 6749 Requirement:**
> If the "state" parameter was present in the client authorization request, the authorization server MUST return the "state" value received from the client. (RFC 6749 §4.1.2)

**Authorization Response Example:**
```http
HTTP/1.1 302 Found
Location: https://client.example.com/cb?
    code=SplxlOBeZQQYbYS6WxSbIA&
    state=af0ifjsldkj
```

**URL Format:**
```
https://client.example.com/cb?code=SplxlOBeZQQYbYS6WxSbIA&state=af0ifjsldkj
```

### 4.4 state Parameter Properties

**Opaque Value:**
```
What "opaque" means:
- Authorization server does NOT interpret state
- Authorization server does NOT modify state
- Authorization server does NOT validate state content
- Authorization server simply echoes it back

Server's job: Storage + Return
Client's job: Generation + Validation
```

**Round-Trip Parameter:**
```
Client → [state=xyz] → Authorization Server
                              ↓
                       (Stores temporarily)
                              ↓
Authorization Server → [state=xyz] → Client
                                        ↓
                                (Validates match)
```

### 4.5 Error Response with state

If authorization fails, server MUST still return state:

**Error Response Example:**
```http
HTTP/1.1 302 Found
Location: https://client.example.com/cb?
    error=access_denied&
    error_description=The+user+denied+access&
    state=af0ifjsldkj
```

**Why state in error responses:**
- Client still needs to validate state
- Prevents CSRF even in error scenarios
- Binds error responses to originating session

### 4.6 Complete Flow with state

```
┌──────────┐                                    ┌──────────────────┐
│  Client  │                                    │  Authorization   │
│          │                                    │     Server       │
└────┬─────┘                                    └────────┬─────────┘
     │                                                   │
     │ 1. Generate state = "xyz789"                     │
     │    Store: session['oauth_state'] = "xyz789"      │
     │                                                   │
     │ 2. Authorization Request                         │
     │    (includes state=xyz789)                       │
     ├──────────────────────────────────────────────────>│
     │                                                   │
     │                                3. Store state     │
     │                                   with request    │
     │                                                   │
     │                                4. User auth       │
     │                                   & consent       │
     │                                                   │
     │ 5. Authorization Response                        │
     │    (includes state=xyz789, unchanged)            │
     │<──────────────────────────────────────────────────│
     │                                                   │
     │ 6. Validate:                                     │
     │    received_state == stored_state ?              │
     │    "xyz789" == "xyz789" ✓                        │
     │                                                   │
     │ 7. If valid: Proceed with token exchange         │
     │    If invalid: Reject (CSRF attempt)             │
     │                                                   │
```

---

## 5. state Value Requirements

### 5.1 Security Requirements (Security BCP §4.7.1)

The state value MUST satisfy these security properties:

| Requirement | Specification | Rationale |
|-------------|---------------|-----------|
| **Cryptographically Random** | MUST | Prevent prediction/guessing |
| **Sufficient Entropy** | 128+ bits RECOMMENDED | Resist brute force |
| **Single-Use** | SHOULD | Prevent replay attacks |
| **Session-Bound** | MUST | Tie to specific user session |
| **Time-Limited** | SHOULD | Prevent stale state attacks |

**RFC 2119 Language from Security BCP:**
> The "state" parameter MUST contain a non-guessable value, and the authorization request and client state MUST be linked against that value. (Security BCP §4.7.1)

### 5.2 Entropy Requirements

**Minimum Entropy:**
```
Recommended: 128 bits (16 bytes)
Acceptable:  96 bits (12 bytes) minimum
Weak:        < 96 bits (vulnerable to prediction)

Example with 128 bits:
Random bytes: [16 random bytes]
Base64URL:    "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1g"
Length:       ~22 characters
Entropy:      128 bits
```

**Entropy Calculation:**
```
Base64URL encoding: 6 bits per character
For 128 bits entropy: 128 / 6 ≈ 21.3 characters minimum
With padding:         22-24 characters typical

Example state values:
"af0ifjsldkj"                          - 11 chars, ~66 bits (weak)
"dBjftJeZ4CVP-mB92K27uhbU"            - 24 chars, 144 bits (good)
"xyz789abc123def456ghi789jkl012mno345" - 36 chars, 216 bits (excellent)
```

### 5.3 Insecure state Examples (VULNERABLE)

**❌ Sequential Values:**
```python
# WRONG: Predictable sequence
state_counter = 0

def generate_state():
    global state_counter
    state_counter += 1
    return f"state{state_counter}"

# Results: "state1", "state2", "state3"
# Attack: Attacker sees "state100", guesses next is "state101"
```

**❌ Timestamp-Based:**
```javascript
// WRONG: Current timestamp
function generateState() {
    return Date.now().toString();
}

// Results: "1735776000000", "1735776001000"
// Attack: Attacker knows approximate time, can guess timestamp
```

**❌ User ID-Based:**
```python
# WRONG: Based on user identifier
def generate_state(user_id):
    return f"user_{user_id}"

# Results: "user_123", "user_456"
# Attack: Attacker knows or can enumerate user IDs
```

**❌ Constant Value:**
```java
// WRONG: Same value for all users
private static final String STATE = "myapp_oauth_state";

// Results: Always "myapp_oauth_state"
// Attack: Attacker uses same value for all victims
```

**❌ Weak Random:**
```python
# WRONG: Non-cryptographic random
import random

def generate_state():
    return ''.join(random.choices(string.ascii_letters, k=16))

# Problem: random module is NOT cryptographically secure
# Attack: Predictable with knowledge of seed
```

### 5.4 Secure state Examples (RECOMMENDED)

**✅ Cryptographically Random String:**
```python
import secrets
import base64

def generate_state():
    """Generate cryptographically secure state (128 bits)"""
    random_bytes = secrets.token_bytes(16)  # 16 bytes = 128 bits
    state = base64.urlsafe_b64encode(random_bytes).decode('utf-8').rstrip('=')
    return state

# Example output: "dBjftJeZ4CVP-mB92K27uhbUJU1"
# Properties:
# - 128 bits of entropy
# - Cryptographically random
# - Base64URL encoded
# - Unpredictable
```

**✅ Simple Random Token:**
```python
import secrets

def generate_state():
    """Generate simple random state token"""
    return secrets.token_urlsafe(32)  # 32 bytes = 256 bits

# Example output: "xyz789abc123def456ghi789jkl012mno345pqr678"
# Properties:
# - 256 bits of entropy
# - URL-safe characters
# - Built-in function (secure)
```

**✅ Signed JWT (Stateless):**
```python
import jwt
import secrets
import time

def generate_state(session_id):
    """Generate signed JWT state (stateless validation)"""
    state_data = {
        'session_id': session_id,
        'timestamp': int(time.time()),
        'nonce': secrets.token_hex(16)  # Additional randomness
    }
    
    state = jwt.encode(state_data, SECRET_KEY, algorithm='HS256')
    return state

# Example output: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNz..."
# Properties:
# - Contains session binding
# - Cryptographically signed
# - Stateless (no server storage needed)
# - Includes timestamp for expiration
```

**✅ HMAC-Based (Session-Bound):**
```python
import hmac
import hashlib

def generate_state(session_token):
    """Generate HMAC-based state tied to session"""
    state = hmac.new(
        SERVER_SECRET.encode(),
        session_token.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return state

# Example output: "a7b3c9d2e5f8g1h4i6j9k2l5m8n1o4p7q0r3s6t9u2v5"
# Properties:
# - Tied to specific session
# - Deterministic (same session = same state)
# - No storage needed
# - Validates with session token + secret
```

### 5.5 State Generation Comparison

| Method | Storage Needed | Entropy | Session Binding | Expiration | Complexity |
|--------|---------------|---------|-----------------|------------|------------|
| **Random String** | Yes (session) | High (128-256 bits) | Via storage | Via storage | Low |
| **JWT Signed** | No (stateless) | High | Via payload | Via payload | Medium |
| **HMAC-Based** | No (derive from session) | High | Via HMAC input | Via session | Medium |

**Recommendation:**
- **Simple apps:** Random string with session storage
- **Stateless apps:** Signed JWT
- **High-scale apps:** HMAC-based (no storage, scalable)

---

## 6. state Generation Algorithms

### 6.1 Method 1: Random String with Session Storage

**Algorithm:**
```
1. Generate cryptographically random bytes (16+ bytes)
2. Encode as Base64URL (or hex)
3. Store in server-side session
4. Return state value
```

**Python Implementation:**
```python
import secrets
from flask import session

def generate_random_state():
    """
    Generate random state and store in session
    
    Returns:
        str: Random state value (128 bits entropy)
    """
    # Generate 16 random bytes (128 bits)
    state = secrets.token_urlsafe(16)
    
    # Store in server-side session
    session['oauth_state'] = state
    session['oauth_state_created'] = time.time()
    
    return state

# Usage
@app.route('/login')
def login():
    state = generate_random_state()
    
    auth_url = build_auth_url(
        client_id=CLIENT_ID,
        redirect_uri=REDIRECT_URI,
        state=state
    )
    
    return redirect(auth_url)
```

**JavaScript/Node.js Implementation:**
```javascript
const crypto = require('crypto');

/**
 * Generate random state and store in session
 * 
 * @param {object} req - Express request object
 * @returns {string} Random state value
 */
function generateRandomState(req) {
    // Generate 16 random bytes (128 bits)
    const state = crypto.randomBytes(16).toString('base64url');
    
    // Store in server-side session
    req.session.oauth_state = state;
    req.session.oauth_state_created = Date.now();
    
    return state;
}

// Usage
app.get('/login', (req, res) => {
    const state = generateRandomState(req);
    
    const authUrl = buildAuthUrl({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        state: state
    });
    
    res.redirect(authUrl);
});
```

**Advantages:**
- ✅ Simple to implement
- ✅ High security (cryptographic randomness)
- ✅ Easy to add expiration
- ✅ Can store additional context

**Disadvantages:**
- ❌ Requires session storage
- ❌ Not stateless
- ❌ Cleanup needed for expired states

### 6.2 Method 2: Signed JWT (Stateless)

**Algorithm:**
```
1. Create payload with session info + timestamp + nonce
2. Sign payload with server secret (HS256)
3. Return JWT as state
4. Validation: Verify signature + check expiration
```

**Python Implementation:**
```python
import jwt
import time
import secrets

def generate_jwt_state(session_id):
    """
    Generate JWT-based state (stateless)
    
    Args:
        session_id: Current user session identifier
        
    Returns:
        str: Signed JWT state token
    """
    # Create payload
    payload = {
        'session_id': session_id,
        'iat': int(time.time()),        # Issued at
        'exp': int(time.time()) + 600,  # Expires in 10 minutes
        'nonce': secrets.token_hex(16)  # Additional randomness
    }
    
    # Sign with server secret
    state = jwt.encode(payload, JWT_SECRET, algorithm='HS256')
    
    return state

def validate_jwt_state(state, session_id):
    """
    Validate JWT state
    
    Args:
        state: JWT state token from response
        session_id: Current user session identifier
        
    Returns:
        bool: True if valid, False otherwise
    """
    try:
        # Verify signature and decode
        payload = jwt.decode(state, JWT_SECRET, algorithms=['HS256'])
        
        # Verify session binding
        if payload['session_id'] != session_id:
            return False
        
        # Expiration checked automatically by jwt.decode
        return True
        
    except jwt.ExpiredSignatureError:
        # Token expired
        return False
    except jwt.InvalidTokenError:
        # Invalid token (signature, format, etc.)
        return False

# Usage
@app.route('/login')
def login():
    session_id = session.get('id')
    state = generate_jwt_state(session_id)
    
    auth_url = build_auth_url(state=state)
    return redirect(auth_url)

@app.route('/callback')
def callback():
    received_state = request.args.get('state')
    session_id = session.get('id')
    
    if not validate_jwt_state(received_state, session_id):
        return "Invalid state", 403
    
    # Continue with authorization...
```

**JavaScript/Node.js Implementation:**
```javascript
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Generate JWT-based state
 * 
 * @param {string} sessionId - Current session ID
 * @returns {string} Signed JWT state
 */
function generateJWTState(sessionId) {
    const payload = {
        session_id: sessionId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 600, // 10 minutes
        nonce: crypto.randomBytes(16).toString('hex')
    };
    
    const state = jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });
    
    return state;
}

/**
 * Validate JWT state
 * 
 * @param {string} state - JWT state from response
 * @param {string} sessionId - Current session ID
 * @returns {boolean} True if valid
 */
function validateJWTState(state, sessionId) {
    try {
        const payload = jwt.verify(state, JWT_SECRET, { algorithms: ['HS256'] });
        
        // Verify session binding
        if (payload.session_id !== sessionId) {
            return false;
        }
        
        return true;
    } catch (err) {
        // Token invalid, expired, or signature failed
        return false;
    }
}

// Usage
app.get('/login', (req, res) => {
    const state = generateJWTState(req.session.id);
    
    const authUrl = buildAuthUrl({ state: state });
    res.redirect(authUrl);
});

app.get('/callback', (req, res) => {
    const receivedState = req.query.state;
    
    if (!validateJWTState(receivedState, req.session.id)) {
        return res.status(403).send('Invalid state');
    }
    
    // Continue...
});
```

**Advantages:**
- ✅ Stateless (no server storage)
- ✅ Self-contained (includes all validation data)
- ✅ Automatic expiration
- ✅ Can include additional claims

**Disadvantages:**
- ❌ Larger state value (JWT overhead)
- ❌ Cannot revoke (stateless)
- ❌ More complex implementation

### 6.3 Method 3: HMAC-Based (Session-Bound)

**Algorithm:**
```
1. Get session token/identifier
2. Compute HMAC(session_token, server_secret)
3. Return HMAC digest as state
4. Validation: Recompute HMAC and compare
```

**Python Implementation:**
```python
import hmac
import hashlib

def generate_hmac_state(session_token):
    """
    Generate HMAC-based state
    
    Args:
        session_token: Current session token
        
    Returns:
        str: HMAC digest as state
    """
    state = hmac.new(
        SERVER_SECRET.encode(),
        session_token.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return state

def validate_hmac_state(received_state, session_token):
    """
    Validate HMAC state
    
    Args:
        received_state: State from authorization response
        session_token: Current session token
        
    Returns:
        bool: True if valid
    """
    expected_state = hmac.new(
        SERVER_SECRET.encode(),
        session_token.encode(),
        hashlib.sha256
    ).hexdigest()
    
    # Constant-time comparison
    return hmac.compare_digest(received_state, expected_state)

# Usage
@app.route('/login')
def login():
    session_token = session.get('token')
    state = generate_hmac_state(session_token)
    
    auth_url = build_auth_url(state=state)
    return redirect(auth_url)

@app.route('/callback')
def callback():
    received_state = request.args.get('state')
    session_token = session.get('token')
    
    if not validate_hmac_state(received_state, session_token):
        return "Invalid state", 403
    
    # Continue...
```

**Node.js Implementation:**
```javascript
const crypto = require('crypto');

/**
 * Generate HMAC-based state
 * 
 * @param {string} sessionToken - Current session token
 * @returns {string} HMAC digest
 */
function generateHMACState(sessionToken) {
    const state = crypto
        .createHmac('sha256', SERVER_SECRET)
        .update(sessionToken)
        .digest('hex');
    
    return state;
}

/**
 * Validate HMAC state
 * 
 * @param {string} receivedState - State from response
 * @param {string} sessionToken - Current session token
 * @returns {boolean} True if valid
 */
function validateHMACState(receivedState, sessionToken) {
    const expectedState = crypto
        .createHmac('sha256', SERVER_SECRET)
        .update(sessionToken)
        .digest('hex');
    
    // Constant-time comparison
    return crypto.timingSafeEqual(
        Buffer.from(receivedState),
        Buffer.from(expectedState)
    );
}
```

**Advantages:**
- ✅ Stateless (no storage needed)
- ✅ Deterministic (same session = same state)
- ✅ Small state value
- ✅ Simple implementation

**Disadvantages:**
- ❌ No automatic expiration (relies on session)
- ❌ Same state for multiple requests from same session (not single-use)
- ❌ Requires secure session tokens

### 6.4 Method Comparison Table

| Aspect | Random String | JWT Signed | HMAC-Based |
|--------|---------------|------------|------------|
| **Storage Required** | Yes (session) | No | No |
| **State Size** | Small (~22 chars) | Large (~100-200 chars) | Medium (~64 chars) |
| **Entropy** | High (128-256 bits) | High (signature + nonce) | Medium (depends on session) |
| **Single-Use** | Yes (invalidate after use) | No (stateless) | No (deterministic) |
| **Expiration** | Custom (in session) | Automatic (JWT exp) | Via session expiration |
| **Session Binding** | Via storage | Via payload | Via HMAC input |
| **Revocation** | Easy (delete from session) | Hard (stateless) | Via session revocation |
| **Implementation Complexity** | Low | Medium | Low |
| **Scalability** | Medium (session storage) | High (stateless) | High (stateless) |

### 6.5 Recommendation by Use Case

**Choose Random String when:**
- Building traditional web application with sessions
- Need single-use state enforcement
- Need to store additional context with state
- Simplicity is priority

**Choose JWT when:**
- Building stateless API or microservices
- Need to include additional claims in state
- Want automatic expiration handling
- Scaling horizontally without session affinity

**Choose HMAC when:**
- Building stateless application
- Want deterministic state (same session = same state)
- Minimizing state size is important
- Already have secure session tokens

---

[Document continues with sections 7-18 covering state validation, CSRF attack variations, different OAuth flows, testing, implementation errors, vulnerability modes, and integration with other security mechanisms...]

---

*End of Part 1 - Document continues...*
