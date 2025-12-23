# OpenID Connect ID Tokens

## Specification Reference for OAuth2/OIDC Debugging Tool

> *"An ID token is to authentication what a passport is to international travel: it proves who you are, not what you're allowed to do. Using it as an access token is like trying to use your passport to pay for dinner. It won't work, and you'll look foolish."*

---

## 1. Overview

An ID token is a security token that contains claims about the authentication of an end-user by an authorization server. It is a JSON Web Token (JWT) that provides identity information to the client application, allowing the client to verify the user's identity and obtain basic profile information.

**CRITICAL DISTINCTION:** ID tokens are for **authentication** (proving who the user is), NOT for **authorization** (proving what the client can access). This is perhaps the most commonly violated principle in OAuth2/OIDC implementations.

### 1.1 Purpose and Scope

| Aspect | ID Token |
|--------|----------|
| **Primary Purpose** | Authenticate the user to the client application |
| **Contains** | User identity claims (sub, name, email, etc.) |
| **Consumed By** | Client application (NOT resource servers) |
| **Format** | MUST be JWT (RFC 7519) |
| **Validation** | Performed by client (NOT resource server) |
| **Lifetime** | Typically 5-60 minutes |

**Key Difference from Access Tokens:**
```
ID Token:
  - Proves WHO the user is
  - Client reads it directly
  - Contains user identity claims
  - "You are Jane Doe, jane@example.com"

Access Token:
  - Proves WHAT client can do
  - Resource server validates it
  - Contains scopes/permissions
  - "You can read:messages, write:messages"
```

### 1.2 Primary Specifications

| Specification | Sections | Purpose |
|---------------|----------|---------|
| OIDC Core 1.0 | §2, §3.1.3.7 | ID token definition and validation |
| OIDC Core 1.0 | §5.1 | Standard user claims |
| OIDC Core 1.0 | §3.1.3.3 | at_hash calculation |
| OIDC Core 1.0 | §3.3.2.11 | c_hash calculation |
| OIDC Core 1.0 | §16 | Security considerations |
| RFC 7519 | Complete | JSON Web Token (JWT) |
| RFC 7515 | Complete | JSON Web Signature (JWS) |

### 1.3 CRITICAL: ID Tokens MUST NOT Be Used as Access Tokens

**OIDC Core §2:** "The ID Token is consumed by the Client and is not sent to the resource server."

**Why this is a critical mistake:**

| Problem | Consequence |
|---------|-------------|
| **Audience mismatch** | ID token aud=client_id, but resource server expects aud=resource_server |
| **Privacy violation** | ID tokens contain PII (name, email), resource servers shouldn't see this |
| **Security violation** | Resource servers can't validate ID tokens (different audience) |
| **Violates specification** | Explicitly prohibited by OIDC Core §2 |

**Example of WRONG usage:**
```http
❌ WRONG: Using ID token as access token
GET /api/messages HTTP/1.1
Authorization: Bearer <ID_TOKEN>    ← ID token used at resource server

This is WRONG because:
  - ID token aud = "client_abc123" (the client)
  - Resource server expects aud = "https://api.example.com" (itself)
  - Resource server should reject (aud mismatch)
```

**Correct usage:**
```http
✅ CORRECT: Use access token at resource server
GET /api/messages HTTP/1.1
Authorization: Bearer <ACCESS_TOKEN>    ← Access token

✅ CORRECT: Use ID token at client
Client validates ID token to determine:
  - User is authenticated
  - User's identity (sub, email, name)
  - Authentication method (amr)
  - Authentication time (auth_time)
```

---

## 2. ID Token vs Access Token

Understanding the distinction between ID tokens and access tokens is fundamental to implementing OIDC correctly.

### 2.1 Comparison Table

| Property | ID Token | Access Token |
|----------|----------|--------------|
| **Primary Purpose** | Authentication (who is the user) | Authorization (what can client access) |
| **Intended Audience** | Client application (aud=client_id) | Resource server (aud=api.example.com) |
| **Format** | MUST be JWT (signed) | MAY be opaque or JWT |
| **Consumed By** | Client application | Resource server |
| **Validation By** | Client | Resource server |
| **Contains PII** | YES (name, email, address, etc.) | NO (scopes only) |
| **Sent To** | Client only (never leaves client) | Resource server (with every request) |
| **Typical Lifetime** | 5-60 minutes | 5-60 minutes (similar) |
| **Can Be Refreshed** | NO (use refresh token to get new one) | YES (via refresh token) |
| **Spec Reference** | OIDC Core §2 | RFC 6749 §1.4 |

### 2.2 When to Use Each Token

| Scenario | Use ID Token? | Use Access Token? | Explanation |
|----------|---------------|-------------------|-------------|
| **Verify user logged in** | ✅ Yes | ❌ No | ID token proves authentication |
| **Display user's name** | ✅ Yes | ❌ No | ID token contains user claims |
| **Call protected API** | ❌ No | ✅ Yes | Access token grants resource access |
| **Authorize API operation** | ❌ No | ✅ Yes | Access token contains scopes |
| **Store in session** | ✅ Yes (client-side) | ⚠️ Maybe (see security) | ID token = auth proof, Access token = API credential |
| **Send to resource server** | ❌ NEVER | ✅ Yes | ID tokens are for client only |

### 2.3 Common Mistakes

**Mistake #1: Using ID token as access token**
```javascript
❌ WRONG:
fetch('https://api.example.com/messages', {
  headers: {
    'Authorization': `Bearer ${idToken}`    // Wrong token type!
  }
});

✅ CORRECT:
fetch('https://api.example.com/messages', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

**Mistake #2: Putting scopes in ID token**
```json
❌ WRONG ID Token:
{
  "iss": "https://auth.example.com",
  "sub": "user_123",
  "aud": "client_abc",
  "scope": "read:messages write:messages"    // Wrong! Scopes belong in access tokens
}

✅ CORRECT ID Token:
{
  "iss": "https://auth.example.com",
  "sub": "user_123",
  "aud": "client_abc",
  "name": "Jane Doe",
  "email": "jane@example.com"    // User claims, not scopes
}
```

**Mistake #3: Sending ID token to resource server**
```
❌ WRONG Flow:
Client → ID Token → Resource Server    // Resource server can't validate (wrong audience)

✅ CORRECT Flow:
Client → Access Token → Resource Server
Client uses ID Token internally only
```

### 2.4 Why Two Tokens?

**Historical Context:**
- OAuth 2.0 (RFC 6749): Defined access tokens for authorization
- OpenID Connect: Extended OAuth 2.0 to add authentication
- Solution: Add ID token alongside access token

**Design Rationale:**

| Token | Solves | Consumed By |
|-------|--------|-------------|
| **Access Token** | "What can this client do?" | Resource servers |
| **ID Token** | "Who is this user?" | Client application |

**Example Use Case:**
```
User logs in to photo sharing app:
  1. User authenticates → Authorization server issues tokens
  2. ID token returned to client:
     - Client knows user is "Jane Doe" (authenticated)
     - Client displays "Welcome, Jane!" (using name claim)
  3. Access token returned to client:
     - Client calls API to fetch photos
     - Resource server validates access token
     - Resource server grants access based on scopes

Two tokens, two purposes, perfect harmony ✅
```

---

## 3. ID Token Structure (JWT Format)

ID tokens MUST be JWTs (JSON Web Tokens) consisting of three base64url-encoded parts separated by dots.

### 3.1 JWT Structure

```
<header>.<payload>.<signature>

eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEifQ.eyJpc3MiOiJodHRwczovL2F1dGguZXhhbXBsZS5jb20iLCJzdWIiOiJ1c2VyXzEyMyIsImF1ZCI6ImNsaWVudF9hYmMxMjMiLCJleHAiOjE3MzM0MzIwMDAsImlhdCI6MTczMzQyODQwMCwibmFtZSI6IkphbmUgRG9lIiwiZW1haWwiOiJqYW5lQGV4YW1wbGUuY29tIn0.signature_bytes_here
```

### 3.2 Header (JOSE Header)

**Base64url-decoded:**
```json
{
  "alg": "RS256",           // Signature algorithm
  "typ": "JWT",             // Token type
  "kid": "2024-12-05-key-1" // Key ID for signature verification
}
```

**Header Parameters:**

| Parameter | Required | Description | Spec Reference |
|-----------|----------|-------------|----------------|
| **alg** | REQUIRED | Signature algorithm (RS256, ES256, etc.) | RFC 7515 §4.1.1 |
| **typ** | OPTIONAL | SHOULD be "JWT" | RFC 7519 §5.1 |
| **kid** | OPTIONAL | Key identifier (RECOMMENDED) | RFC 7515 §4.1.4 |

**Supported Algorithms (OIDC Core §8):**
- **RS256** (RSA with SHA-256): Most common, REQUIRED
- **ES256** (ECDSA with P-256 and SHA-256): Recommended
- **PS256** (RSA-PSS with SHA-256): Alternative
- **HS256** (HMAC with SHA-256): For client secrets (symmetric)
- **none**: MUST NEVER be accepted (critical security issue)

### 3.3 Payload (Claims)

**Base64url-decoded example:**
```json
{
  "iss": "https://auth.example.com",
  "sub": "user_123",
  "aud": "client_abc123",
  "exp": 1733432000,
  "iat": 1733428400,
  "auth_time": 1733428390,
  "nonce": "n-0S6_WzA2Mj",
  "name": "Jane Doe",
  "given_name": "Jane",
  "family_name": "Doe",
  "email": "jane@example.com",
  "email_verified": true,
  "picture": "https://example.com/jane.jpg"
}
```

**Categories of Claims:**
1. **Required Claims** (OIDC Core §2): iss, sub, aud, exp, iat
2. **Recommended Claims**: auth_time, nonce, acr, amr, azp
3. **Standard User Claims** (OIDC Core §5.1): name, email, etc.
4. **Hash Claims** (for token binding): at_hash, c_hash
5. **Custom Claims**: Application-specific

### 3.4 Signature (JWS)

The signature ensures the ID token hasn't been tampered with and was issued by the claimed issuer.

**Signature Calculation (RFC 7515 §5):**
```
1. Create signing input: BASE64URL(header) + '.' + BASE64URL(payload)
2. Sign using algorithm specified in header.alg
3. Signature = BASE64URL(SIGN(signing_input, private_key))
```

**Verification (by client):**
```
1. Fetch issuer's JWKS (JSON Web Key Set)
2. Find public key matching kid from header
3. Verify signature using public key
4. If signature valid, trust claims in payload
```

**See:** `jwt-structure-and-validation.md` for complete JWT signing/verification details.

### 3.5 Complete Example with Annotations

**Encoded ID Token:**
```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEifQ.eyJpc3MiOiJodHRwczovL2F1dGguZXhhbXBsZS5jb20iLCJzdWIiOiJ1c2VyXzEyMyIsImF1ZCI6ImNsaWVudF9hYmMxMjMiLCJleHAiOjE3MzM0MzIwMDAsImlhdCI6MTczMzQyODQwMCwibm9uY2UiOiJuLTBTNl9XekEyTWoiLCJuYW1lIjoiSmFuZSBEb2UiLCJlbWFpbCI6ImphbmVAZXhhbXBsZS5jb20ifQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk

│                            │                              │
│        Header              │         Payload              │         Signature
│    (base64url encoded)     │    (base64url encoded)       │    (base64url encoded)
```

**Decoded and Annotated:**
```json
{
  "header": {
    "alg": "RS256",                         // ← Signature algorithm
    "typ": "JWT",                           // ← Token type
    "kid": "1"                              // ← Key ID (match to JWKS)
  },
  "payload": {
    "iss": "https://auth.example.com",      // ← REQUIRED: Issuer
    "sub": "user_123",                      // ← REQUIRED: User ID
    "aud": "client_abc123",                 // ← REQUIRED: Client ID
    "exp": 1733432000,                      // ← REQUIRED: Expiration (Unix timestamp)
    "iat": 1733428400,                      // ← REQUIRED: Issued at (Unix timestamp)
    "nonce": "n-0S6_WzA2Mj",                // ← Replay protection
    "name": "Jane Doe",                     // ← User's full name
    "email": "jane@example.com",            // ← User's email
    "email_verified": true,                 // ← Email verification status
    "auth_time": 1733428390,                // ← When authentication occurred
    "acr": "urn:mace:incommon:iap:silver",  // ← Authentication context
    "amr": ["pwd", "mfa"]                   // ← Authentication methods (password + MFA)
  },
  "signature": "..."                        // ← JWS signature (verify with public key)
}
```

---

## 4. Standard ID Token Claims (OIDC Core §2)

ID token claims fall into several categories: required, recommended, and optional.

### 4.1 REQUIRED Claims (OIDC Core §2)

These claims MUST be present in every ID token:

| Claim | Type | Description | Example | Spec Reference |
|-------|------|-------------|---------|----------------|
| **iss** | String | Issuer identifier | `"https://auth.example.com"` | OIDC Core §2, RFC 7519 §4.1.1 |
| **sub** | String | Subject identifier (unique user ID) | `"user_123"` | OIDC Core §2, RFC 7519 §4.1.2 |
| **aud** | String or Array | Audience (client_id or array) | `"client_abc123"` | OIDC Core §2, RFC 7519 §4.1.3 |
| **exp** | Number | Expiration time (Unix timestamp) | `1733432000` | OIDC Core §2, RFC 7519 §4.1.4 |
| **iat** | Number | Issued at time (Unix timestamp) | `1733428400` | OIDC Core §2, RFC 7519 §4.1.6 |

#### 4.1.1 iss (Issuer)

**Purpose:** Identifies the authorization server that issued the ID token.

**Requirements (OIDC Core §2):**
- MUST be a case-sensitive URL using https scheme
- MUST NOT include URL fragments or query parameters
- SHOULD be the same as issuer in discovery document

**Examples:**
```json
✅ Valid:
"iss": "https://auth.example.com"
"iss": "https://auth.example.com/"              // Trailing slash OK
"iss": "https://accounts.google.com"

❌ Invalid:
"iss": "http://auth.example.com"                // HTTP not allowed
"iss": "https://auth.example.com?param=value"   // Query parameters not allowed
"iss": "https://auth.example.com#fragment"      // Fragments not allowed
```

#### 4.1.2 sub (Subject)

**Purpose:** Identifier for the end-user (subject) at the issuer.

**Requirements (OIDC Core §2):**
- MUST be unique within the issuer
- MUST be persistent (never reassigned)
- Maximum length: 255 ASCII characters
- Case-sensitive
- SHOULD be opaque to clients (don't assume format)

**Examples:**
```json
"sub": "user_123"                    // Simple numeric
"sub": "248289761001"                // Google-style
"sub": "6WeGX.x7gKRiY.c9u6EqVE"     // Opaque identifier
"sub": "alice@corp.example.com"     // Email-like (not recommended)

⚠️ Important: sub is immutable. If user changes email, sub stays same.
```

**Privacy Note (OIDC Core §8.1):**
- Different clients MAY receive different `sub` values for same user (pairwise identifiers)
- This prevents cross-client user tracking

#### 4.1.3 aud (Audience)

**Purpose:** Identifies the intended recipient(s) of the ID token.

**Requirements (OIDC Core §2):**
- MUST contain the client's `client_id`
- MAY be a string (single audience) or array (multiple audiences)
- If array with multiple values, `azp` claim MUST be present

**Examples:**
```json
Single audience:
"aud": "client_abc123"

Multiple audiences:
"aud": ["client_abc123", "client_xyz789"],
"azp": "client_abc123"              // Authorized party (which client requested)
```

#### 4.1.4 exp (Expiration Time)

**Purpose:** Time after which the ID token is no longer valid.

**Requirements (OIDC Core §2):**
- Unix timestamp (seconds since epoch)
- Clients MUST reject tokens with exp in the past
- Typically 5-60 minutes from issuance

**Examples:**
```json
"exp": 1733432000    // 2025-12-05T11:00:00Z
"iat": 1733428400    // 2025-12-05T10:00:00Z
// Token lifetime: 3600 seconds (1 hour)
```

**Validation with Clock Skew:**
```
current_time = 1733431950           // 2025-12-05T10:59:10Z
token_exp = 1733432000              // 2025-12-05T11:00:00Z
clock_skew_allowance = 300          // 5 minutes

if current_time > (token_exp + clock_skew_allowance):
    reject token as expired
else:
    accept token
```

#### 4.1.5 iat (Issued At)

**Purpose:** Time when the ID token was issued.

**Requirements (OIDC Core §2):**
- Unix timestamp
- Used to determine token age
- MAY be used to reject tokens that are too old

**Examples:**
```json
"iat": 1733428400    // 2025-12-05T10:00:00Z

Validation:
current_time = 1733432000
max_age = 3600  // Client policy: reject tokens older than 1 hour

if (current_time - iat) > max_age:
    reject token as too old
```

### 4.2 RECOMMENDED/OPTIONAL Claims

| Claim | Type | Description | When Required | Spec Reference |
|-------|------|-------------|---------------|----------------|
| **auth_time** | Number | Time when authentication occurred | If max_age requested | OIDC Core §2 |
| **nonce** | String | Replay protection value | If nonce in request | OIDC Core §2, §3.1.2.1 |
| **acr** | String | Authentication Context Class Reference | If acr_values requested | OIDC Core §2 |
| **amr** | Array | Authentication Methods References | Optional | OIDC Core §2 |
| **azp** | String | Authorized party (client_id) | If multiple audiences | OIDC Core §2 |

#### 4.2.1 auth_time

**Purpose:** Time when end-user authentication occurred.

**When Required:**
- If `max_age` parameter was in authorization request
- Allows client to require recent authentication

**Example:**
```json
"auth_time": 1733428390,    // User authenticated at 10:59:50Z
"iat": 1733428400,          // Token issued at 11:00:00Z
// User authenticated 10 seconds before token issued

Authorization request included:
max_age=3600   // Require authentication within last hour

Client validation:
if (current_time - auth_time) > max_age:
    require re-authentication
```

#### 4.2.2 nonce

**Purpose:** String value used to associate a client session with an ID token, mitigate replay attacks.

**Requirements:**
- MUST be present if nonce in authorization request
- MUST exactly match nonce from request
- REQUIRED for implicit flow (OIDC Core §3.2.2.1)
- RECOMMENDED for authorization code flow

**Example:**
```json
Authorization Request:
  nonce=n-0S6_WzA2Mj

ID Token:
  "nonce": "n-0S6_WzA2Mj"    // Must match exactly

Client Validation:
  if id_token.nonce != stored_nonce_from_request:
      reject (potential replay attack)
```

**See §9 for detailed nonce protection.**

#### 4.2.3 acr (Authentication Context Class Reference)

**Purpose:** String specifying an authentication context class reference value.

**Use Case:** Client can request specific authentication methods (e.g., MFA).

**Examples:**
```json
"acr": "urn:mace:incommon:iap:silver"           // Standard URN
"acr": "http://auth.example.com/policy/mfa"     // Custom URL
"acr": "2"                                       // Numeric level

Authorization Request:
  acr_values=urn:mace:incommon:iap:silver urn:mace:incommon:iap:bronze

Client Validation:
  if acr not in requested_acr_values:
      reject (insufficient authentication level)
```

#### 4.2.4 amr (Authentication Methods References)

**Purpose:** JSON array of strings that are identifiers for authentication methods used.

**Examples:**
```json
"amr": ["pwd"]                      // Password only
"amr": ["pwd", "mfa"]              // Password + MFA
"amr": ["biometric"]               // Biometric (TouchID, FaceID)
"amr": ["otp", "sms"]              // One-time password via SMS
"amr": ["federation"]              // Federated authentication
```

**Standard amr values (IETF RFC 8176):**
- `pwd`: Password
- `sms`: SMS OTP
- `otp`: One-time password
- `mfa`: Multiple-factor authentication
- `biometric`: Biometric authentication
- `smartcard`: Smartcard
- `federation`: Federated authentication

#### 4.2.5 azp (Authorized Party)

**Purpose:** Client ID of the party to which the ID token was issued.

**When Required (OIDC Core §2):**
- If `aud` claim contains multiple values
- Value MUST equal the client's `client_id`

**Example:**
```json
Single audience (azp optional):
"aud": "client_abc123"

Multiple audiences (azp REQUIRED):
"aud": ["client_abc123", "client_xyz789"],
"azp": "client_abc123"              // This client requested the token

Client Validation:
if aud is array:
    if azp not present:
        reject
    if azp != client_id:
        reject
```

### 4.3 Claims Summary Table

| Claim | Required? | Type | Description |
|-------|-----------|------|-------------|
| iss | REQUIRED | String | Issuer identifier |
| sub | REQUIRED | String | Subject (user) identifier |
| aud | REQUIRED | String/Array | Audience (client_id) |
| exp | REQUIRED | Number | Expiration time |
| iat | REQUIRED | Number | Issued at time |
| auth_time | Conditional | Number | Authentication time (if max_age requested) |
| nonce | Conditional | String | Replay protection (if nonce in request) |
| acr | OPTIONAL | String | Authentication context class |
| amr | OPTIONAL | Array | Authentication methods |
| azp | Conditional | String | Authorized party (if multiple aud values) |

---

## 5. Standard User Claims (OIDC Core §5.1)

If requested via scope or claims parameter, ID tokens MAY include standard user profile claims.

### 5.1 Scope-to-Claims Mapping

| Scope | Claims Included |
|-------|----------------|
| **profile** | name, family_name, given_name, middle_name, nickname, preferred_username, profile, picture, website, gender, birthdate, zoneinfo, locale, updated_at |
| **email** | email, email_verified |
| **address** | address (JSON object) |
| **phone** | phone_number, phone_verified |

### 5.2 Standard User Claims Table

| Claim | Type | Description | Example |
|-------|------|-------------|---------|
| **name** | String | Full name | `"Jane Doe"` |
| **given_name** | String | First name | `"Jane"` |
| **family_name** | String | Last name | `"Doe"` |
| **middle_name** | String | Middle name | `"Marie"` |
| **nickname** | String | Casual name | `"Janie"` |
| **preferred_username** | String | Username for display | `"janedoe"` |
| **profile** | String | Profile page URL | `"https://example.com/jane"` |
| **picture** | String | Profile photo URL | `"https://example.com/jane.jpg"` |
| **website** | String | Website URL | `"https://janedoe.com"` |
| **email** | String | Email address | `"jane@example.com"` |
| **email_verified** | Boolean | Email verified? | `true` |
| **gender** | String | Gender | `"female"` |
| **birthdate** | String | Birthdate (ISO 8601) | `"1990-01-15"` |
| **zoneinfo** | String | Timezone | `"America/Los_Angeles"` |
| **locale** | String | Locale/Language | `"en-US"` |
| **phone_number** | String | Phone number (E.164) | `"+1 (555) 123-4567"` |
| **phone_verified** | Boolean | Phone verified? | `true` |
| **address** | Object | Physical address | See below |
| **updated_at** | Number | Last profile update (Unix timestamp) | `1733428400` |

### 5.3 Address Claim Structure

The `address` claim is a JSON object with the following fields:

```json
"address": {
  "formatted": "123 Main St\nApt 4B\nSan Francisco, CA 94105\nUSA",
  "street_address": "123 Main St\nApt 4B",
  "locality": "San Francisco",
  "region": "CA",
  "postal_code": "94105",
  "country": "USA"
}
```

### 5.4 Example ID Token with User Claims

```json
{
  "iss": "https://auth.example.com",
  "sub": "user_123",
  "aud": "client_abc123",
  "exp": 1733432000,
  "iat": 1733428400,
  "nonce": "n-0S6_WzA2Mj",
  
  "name": "Jane Marie Doe",
  "given_name": "Jane",
  "family_name": "Doe",
  "middle_name": "Marie",
  "nickname": "Janie",
  "preferred_username": "janedoe",
  "profile": "https://example.com/janedoe",
  "picture": "https://example.com/janedoe.jpg",
  "website": "https://janedoe.com",
  
  "email": "jane@example.com",
  "email_verified": true,
  
  "gender": "female",
  "birthdate": "1990-01-15",
  "zoneinfo": "America/Los_Angeles",
  "locale": "en-US",
  
  "phone_number": "+1 (555) 123-4567",
  "phone_verified": true,
  
  "address": {
    "street_address": "123 Main St",
    "locality": "San Francisco",
    "region": "CA",
    "postal_code": "94105",
    "country": "USA"
  },
  
  "updated_at": 1733428400
}
```

### 5.5 ID Token vs UserInfo Endpoint

Claims can be delivered via ID token or UserInfo endpoint. Here's when to use each:

| Aspect | ID Token | UserInfo Endpoint |
|--------|----------|-------------------|
| **Delivery** | Immediate (with token response) | Separate request required |
| **Latency** | Lower (no additional request) | Higher (extra HTTP request) |
| **Size** | Limited (URL/token size limits) | Unlimited (separate response) |
| **Claims** | Core claims + requested claims | All available claims |
| **Authentication** | N/A (returned with token) | Requires access token |
| **Consistency** | `sub` MUST match access token | `sub` MUST match ID token |

**Recommendation:**
- ID token: Core identity claims (sub, name, email)
- UserInfo endpoint: Extended profile data, large claims

**Example:**
```
ID Token (compact):
{
  "sub": "user_123",
  "name": "Jane Doe",
  "email": "jane@example.com"
}

UserInfo Endpoint (comprehensive):
GET /userinfo HTTP/1.1
Authorization: Bearer <access_token>

Response:
{
  "sub": "user_123",              ← MUST match ID token
  "name": "Jane Doe",
  "email": "jane@example.com",
  "address": {...},               ← Additional claims
  "picture": "...",
  "custom_claim": "..."
}
```

### 5.6 Privacy Considerations

**CRITICAL:** ID tokens may contain personally identifiable information (PII).

| Risk | Mitigation |
|------|-----------|
| **PII exposure** | Only request necessary claims |
| **Over-sharing** | Use UserInfo endpoint for sensitive claims |
| **Token logging** | Never log full ID tokens |
| **Token storage** | Encrypt if stored; prefer session-only |
| **Cross-client tracking** | Use pairwise `sub` identifiers |

---

## 6. Hash Claims for Token Validation

Hash claims (`at_hash` and `c_hash`) bind ID tokens to access tokens and authorization codes, preventing token substitution attacks.

### 6.1 at_hash (Access Token Hash) - OIDC Core §3.1.3.3

**Purpose:** Binds access token to ID token, prevents token substitution.

**When Required:**
- Implicit flow when `response_type` includes both `id_token` and `token`
- Hybrid flow when access token returned in authorization response

**Calculation Algorithm:**

```
FUNCTION calculate_at_hash(access_token, alg):
    # 1. Get hash algorithm from JWT alg header
    hash_algorithm = get_hash_algorithm(alg)
    # Examples: RS256 → SHA-256, ES384 → SHA-384
    
    # 2. Hash the access token
    hash = hash_algorithm(access_token)
    
    # 3. Take left-most half of hash
    left_half = hash[0 : length(hash)/2]
    
    # 4. Base64url encode
    at_hash = base64url_encode(left_half)
    
    RETURN at_hash
```

**Example Calculation:**

```
Access Token: "2YotnFZFEjr1zCsicMWpAA"
Algorithm: RS256 (uses SHA-256)

Step 1: Hash access token with SHA-256
  SHA256("2YotnFZFEjr1zCsicMWpAA") = 
  77cb5e3e5d4f9b0e8c7a2b1c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2

Step 2: Take left half (128 bits = 16 bytes)
  left_half = 77cb5e3e5d4f9b0e8c7a2b1c3d4e5f6g

Step 3: Base64url encode
  at_hash = "d8xOPlTfm-w4eisy09Tl9g"

ID Token includes:
  "at_hash": "d8xOPlTfm-w4eisy09Tl9g"
```

**Validation Algorithm:**

```
FUNCTION validate_at_hash(id_token, access_token):
    # 1. Calculate expected at_hash
    expected_hash = calculate_at_hash(access_token, id_token.header.alg)
    
    # 2. Compare to at_hash in ID token
    IF id_token.at_hash != expected_hash:
        RETURN error("at_hash mismatch - token substitution detected")
    
    RETURN valid
```

**Why This Matters:**

```
Without at_hash:
  Attacker has:
    - Victim's ID token (with victim's name, email)
    - Attacker's access token (with attacker's permissions)
  
  Attacker presents:
    - Victim's ID token → Client thinks user is victim
    - Attacker's access token → APIs grant attacker's permissions
  
  Result: Client displays "Welcome, Victim!" but operates with attacker's access

With at_hash:
  Attacker presents:
    - Victim's ID token (at_hash for victim's access token)
    - Attacker's access token
  
  Client validates:
    - calculate_at_hash(attacker_access_token) != victim_id_token.at_hash
    - REJECT (token substitution detected)
  
  Result: Attack blocked ✅
```

### 6.2 c_hash (Code Hash) - OIDC Core §3.3.2.11

**Purpose:** Binds authorization code to ID token in hybrid flows.

**When Required:**
- Hybrid flow when `response_type` includes both `code` and `id_token`
- Examples: `code id_token`, `code id_token token`

**Calculation Algorithm:**

Same as `at_hash`, but hash the authorization code instead:

```
FUNCTION calculate_c_hash(authorization_code, alg):
    hash_algorithm = get_hash_algorithm(alg)
    hash = hash_algorithm(authorization_code)
    left_half = hash[0 : length(hash)/2]
    c_hash = base64url_encode(left_half)
    RETURN c_hash
```

**Example:**

```
Authorization Code: "SplxlOBeZQQYbYS6WxSbIA"
Algorithm: RS256

c_hash = calculate_c_hash("SplxlOBeZQQYbYS6WxSbIA", "RS256")
       = "LDktKdoQak3Pk0cnXxPA2Q"

ID Token in authorization response includes:
  "c_hash": "LDktKdoQak3Pk0cnXxPA2Q"
```

**Validation:**

```
Client receives authorization response:
  - Authorization code: "SplxlOBeZQQYbYS6WxSbIA"
  - ID token with c_hash: "LDktKdoQak3Pk0cnXxPA2Q"

Client validates:
  expected = calculate_c_hash("SplxlOBeZQQYbYS6WxSbIA", alg)
  if id_token.c_hash != expected:
      reject (code substitution detected)
```

### 6.3 Hash Algorithm Mapping

| JWT alg | Hash Algorithm | Output Size | Half Size |
|---------|----------------|-------------|-----------|
| RS256, ES256, PS256 | SHA-256 | 256 bits | 128 bits |
| RS384, ES384, PS384 | SHA-384 | 384 bits | 192 bits |
| RS512, ES512, PS512 | SHA-512 | 512 bits | 256 bits |

### 6.4 Hash Claims Summary

| Claim | Hashes | When Required | Attack Prevented |
|-------|--------|---------------|------------------|
| **at_hash** | Access token | Implicit flow (id_token token), Hybrid flow | Access token substitution |
| **c_hash** | Authorization code | Hybrid flow (code id_token) | Authorization code substitution |

---

## 7. ID Token Issuance

ID tokens are issued in different places depending on the OIDC flow used.

### 7.1 Authorization Code Flow (OIDC Core §3.1.3)

**Issuance Location:** Token endpoint response (alongside access token).

**Token Request:**
```http
POST /token HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=SplxlOBeZQQYbYS6WxSbIA
&redirect_uri=https://client.example.com/callback
&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
&client_id=client_abc123
```

**Token Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "access_token": "SlAV32hkKG",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "8xLOxBtZp8",
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M..."    ← ID token here
}
```

**ID Token Characteristics:**
- Returned with access token
- No `at_hash` required (both tokens in same response)
- `nonce` MUST be present if sent in authorization request

### 7.2 Implicit Flow (OIDC Core §3.2) [DEPRECATED]

**Issuance Location:** Authorization response (URL fragment).

⚠️ **WARNING:** Implicit flow is deprecated in OAuth 2.1. Use authorization code flow with PKCE instead.

**Authorization Response (response_type=id_token):**
```http
HTTP/1.1 302 Found
Location: https://client.example.com/callback#
  id_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
  &state=af0ifjsldkj
```

**Authorization Response (response_type=id_token token):**
```http
HTTP/1.1 302 Found
Location: https://client.example.com/callback#
  access_token=SlAV32hkKG
  &token_type=Bearer
  &id_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
  &expires_in=3600
  &state=af0ifjsldkj
```

**ID Token Characteristics:**
- `nonce` REQUIRED in ID token
- `at_hash` REQUIRED if access token also returned
- No refresh token (implicit flow cannot issue refresh tokens)

### 7.3 Hybrid Flow (OIDC Core §3.3)

**Issuance Location:** Both authorization response AND token response.

**Response Types:**
- `code id_token`: ID token in auth response, another ID token in token response
- `code token`: Access token in auth response, ID token in token response
- `code id_token token`: Everything in auth response, more in token response

**Example (response_type=code id_token):**

**Authorization Response:**
```http
HTTP/1.1 302 Found
Location: https://client.example.com/callback#
  code=SplxlOBeZQQYbYS6WxSbIA
  &id_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...    ← ID token #1
  &state=af0ifjsldkj
```

**ID Token #1 in Authorization Response:**
```json
{
  "iss": "https://auth.example.com",
  "sub": "user_123",
  "aud": "client_abc123",
  "exp": 1733432000,
  "c_hash": "LDktKdoQak3Pk0cnXxPA2Q"    ← c_hash REQUIRED
}
```

**Token Response:**
```http
POST /token HTTP/1.1
...

Response:
{
  "access_token": "SlAV32hkKG",
  "token_type": "Bearer",
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."    ← ID token #2
}
```

**ID Token #2 in Token Response:**
```json
{
  "iss": "https://auth.example.com",
  "sub": "user_123",
  "aud": "client_abc123",
  "exp": 1733432000
  // No c_hash (code already used)
}
```

### 7.4 Flow Comparison Table

| Flow | ID Token Location | at_hash Required? | c_hash Required? | nonce Required? |
|------|------------------|-------------------|------------------|-----------------|
| **Authorization Code** | Token response | No | No | If sent in request |
| **Implicit (id_token)** | Auth response | No | No | YES |
| **Implicit (id_token token)** | Auth response | YES | No | YES |
| **Hybrid (code id_token)** | Both responses | No (token resp) | YES (auth resp) | YES |
| **Hybrid (code token)** | Token response | YES (auth resp) | No | If sent in request |
| **Hybrid (code id_token token)** | Both responses | YES (auth resp) | YES (auth resp) | YES |

---

## 8. ID Token Validation Algorithm (OIDC Core §3.1.3.7)

**CRITICAL:** Clients MUST validate ALL of the following steps. Skipping any step is a security vulnerability.

### 8.1 Complete Validation Algorithm

```
FUNCTION validate_id_token(id_token, client_id, expected_issuer, stored_nonce):
    
    # ═══════════════════════════════════════════════════════════════
    # STEP 1: Verify JWT Signature (OIDC Core §3.1.3.7 step 1)
    # ═══════════════════════════════════════════════════════════════
    
    # 1.1: Decode JWT structure
    parts = split(id_token, ".")
    IF length(parts) != 3:
        RETURN error("Malformed JWT")
    
    header = base64url_decode(parts[0])
    payload = base64url_decode(parts[1])
    signature = parts[2]
    
    # 1.2: Fetch issuer's JWKS
    jwks_uri = get_jwks_uri_from_discovery(expected_issuer)
    jwks = fetch(jwks_uri)
    
    # 1.3: Find matching key
    kid = header.kid
    public_key = find_key_in_jwks(jwks, kid)
    IF public_key is NULL:
        RETURN error("Cannot find key with kid=" + kid)
    
    # 1.4: Verify signature
    IF NOT verify_signature(header, payload, signature, public_key):
        RETURN error("Invalid signature")
    
    # ═══════════════════════════════════════════════════════════════
    # STEP 2: Validate iss claim (OIDC Core §3.1.3.7 step 2)
    # ═══════════════════════════════════════════════════════════════
    
    IF payload.iss != expected_issuer:
        RETURN error("Invalid issuer: " + payload.iss)
    
    # ═══════════════════════════════════════════════════════════════
    # STEP 3: Validate aud claim (OIDC Core §3.1.3.7 step 3)
    # ═══════════════════════════════════════════════════════════════
    
    IF payload.aud is String:
        IF payload.aud != client_id:
            RETURN error("Invalid audience")
    ELSE IF payload.aud is Array:
        IF client_id NOT IN payload.aud:
            RETURN error("Client ID not in audience")
    ELSE:
        RETURN error("Invalid aud claim format")
    
    # ═══════════════════════════════════════════════════════════════
    # STEP 4: If azp present, validate (OIDC Core §3.1.3.7 step 4)
    # ═══════════════════════════════════════════════════════════════
    
    IF payload.azp exists:
        IF payload.azp != client_id:
            RETURN error("azp does not match client_id")
    
    # If aud is array with multiple values, azp MUST be present
    IF payload.aud is Array AND length(payload.aud) > 1:
        IF payload.azp is NULL:
            RETURN error("azp required when multiple audiences")
    
    # ═══════════════════════════════════════════════════════════════
    # STEP 5: Validate algorithm (OIDC Core §3.1.3.7 step 5)
    # ═══════════════════════════════════════════════════════════════
    
    # CRITICAL: Reject alg=none
    IF header.alg == "none":
        RETURN error("alg=none is forbidden")
    
    # Validate algorithm matches expected
    expected_alg = get_expected_algorithm(client_id)  # e.g., "RS256"
    IF header.alg != expected_alg:
        RETURN error("Unexpected algorithm: " + header.alg)
    
    # ═══════════════════════════════════════════════════════════════
    # STEP 6: Validate exp claim (OIDC Core §3.1.3.7 step 6)
    # ═══════════════════════════════════════════════════════════════
    
    current_time = unix_timestamp_now()
    clock_skew_allowance = 300  # 5 minutes
    
    IF current_time > (payload.exp + clock_skew_allowance):
        RETURN error("ID token expired")
    
    # ═══════════════════════════════════════════════════════════════
    # STEP 7: Validate iat claim (OIDC Core §3.1.3.7 step 7)
    # ═══════════════════════════════════════════════════════════════
    
    IF payload.iat exists:
        max_token_age = 86400  # 24 hours (configurable)
        IF (current_time - payload.iat) > max_token_age:
            RETURN error("ID token too old")
    
    # ═══════════════════════════════════════════════════════════════
    # STEP 8: Validate nonce (OIDC Core §3.1.3.7 step 8)
    # ═══════════════════════════════════════════════════════════════
    
    IF stored_nonce is not NULL:
        # Nonce was sent in authorization request
        IF payload.nonce is NULL:
            RETURN error("nonce missing from ID token")
        
        IF payload.nonce != stored_nonce:
            RETURN error("nonce mismatch - potential replay attack")
    
    # ═══════════════════════════════════════════════════════════════
    # STEP 9: Validate acr claim (OIDC Core §3.1.3.7 step 9)
    # ═══════════════════════════════════════════════════════════════
    
    IF acr_values_requested exists:
        IF payload.acr is NULL:
            RETURN error("acr claim missing")
        
        IF payload.acr NOT IN acr_values_requested:
            RETURN error("Insufficient authentication context")
    
    # ═══════════════════════════════════════════════════════════════
    # STEP 10: Validate auth_time (OIDC Core §3.1.3.7 step 10)
    # ═══════════════════════════════════════════════════════════════
    
    IF max_age_requested exists:
        IF payload.auth_time is NULL:
            RETURN error("auth_time required when max_age requested")
        
        IF (current_time - payload.auth_time) > max_age_requested:
            RETURN error("Authentication too old, re-authentication required")
    
    # ═══════════════════════════════════════════════════════════════
    # STEP 11: Validate at_hash (OIDC Core §3.1.3.7 step 11)
    # ═══════════════════════════════════════════════════════════════
    
    IF access_token exists AND payload.at_hash exists:
        expected_at_hash = calculate_at_hash(access_token, header.alg)
        IF payload.at_hash != expected_at_hash:
            RETURN error("at_hash mismatch - token substitution detected")
    
    # ═══════════════════════════════════════════════════════════════
    # STEP 12: Validate c_hash (OIDC Core §3.3.2.11)
    # ═══════════════════════════════════════════════════════════════
    
    IF authorization_code exists AND payload.c_hash exists:
        expected_c_hash = calculate_c_hash(authorization_code, header.alg)
        IF payload.c_hash != expected_c_hash:
            RETURN error("c_hash mismatch - code substitution detected")
    
    # ═══════════════════════════════════════════════════════════════
    # All validations passed
    # ═══════════════════════════════════════════════════════════════
    
    RETURN valid
```

### 8.2 Validation Decision Flowchart

```
                        Start: Receive ID Token
                                  │
                                  ▼
                        ┌───────────────────┐
                        │ Decode JWT        │
                        │ (3 parts?)        │
                        └─────────┬─────────┘
                                  │
                        ┌─────────▼─────────┐
                        │ Fetch JWKS        │
                        │ Find Public Key   │
                        │ (by kid)          │
                        └─────────┬─────────┘
                                  │
                        ┌─────────▼─────────┐
                        │ Verify Signature  │
                        └───┬───────────┬───┘
                            │FAIL       │PASS
                            ▼           ▼
                    ┌───────────┐   ┌─────────────┐
                    │ REJECT    │   │ Validate    │
                    │ 401       │   │ iss claim   │
                    └───────────┘   └──────┬──────┘
                                           │
                                    ┌──────▼──────┐
                                    │ iss match?  │
                                    └──┬───────┬──┘
                                       │NO     │YES
                                       ▼       ▼
                                ┌──────────┐ ┌────────────┐
                                │ REJECT   │ │ Validate   │
                                └──────────┘ │ aud claim  │
                                             └──────┬─────┘
                                                    │
                                             ┌──────▼──────┐
                                             │ client_id   │
                                             │ in aud?     │
                                             └──┬───────┬──┘
                                                │NO     │YES
                                                ▼       ▼
                                         ┌──────────┐ ┌─────────┐
                                         │ REJECT   │ │ azp OK? │
                                         └──────────┘ └────┬────┘
                                                           │YES
                                                           ▼
                                                    ┌──────────────┐
                                                    │ alg != none? │
                                                    └──┬────────┬──┘
                                                       │NO      │YES
                                                       ▼        ▼
                                                ┌──────────┐ ┌─────────┐
                                                │ REJECT   │ │ Check   │
                                                │ CRITICAL │ │ exp     │
                                                └──────────┘ └────┬────┘
                                                                  │
                                                           ┌──────▼───────┐
                                                           │ Not expired? │
                                                           └──┬────────┬──┘
                                                              │NO      │YES
                                                              ▼        ▼
                                                       ┌──────────┐ ┌──────────┐
                                                       │ REJECT   │ │ nonce OK?│
                                                       └──────────┘ └────┬─────┘
                                                                         │YES
                                                                         ▼
                                                                  ┌─────────────┐
                                                                  │ at_hash OK? │
                                                                  │ (if present)│
                                                                  └──────┬──────┘
                                                                         │YES
                                                                         ▼
                                                                  ┌─────────────┐
                                                                  │ c_hash OK?  │
                                                                  │ (if present)│
                                                                  └──────┬──────┘
                                                                         │YES
                                                                         ▼
                                                                  ┌─────────────┐
                                                                  │ ID TOKEN    │
                                                                  │ VALID ✅    │
                                                                  └─────────────┘
```

### 8.3 Common Validation Failures

| Failure Reason | HTTP Status | Error Description | Likely Cause |
|---------------|-------------|-------------------|--------------|
| Invalid signature | 401 | JWT signature verification failed | Wrong key, tampered token, or key rotation |
| Invalid issuer | 401 | iss claim doesn't match expected | Wrong authorization server or issuer mismatch |
| Invalid audience | 401 | Client ID not in aud claim | Token for different client |
| alg=none | 401 | Unsigned tokens forbidden | Security bypass attempt |
| Token expired | 401 | exp claim in past | Token too old or clock skew |
| nonce mismatch | 401 | nonce doesn't match request | Replay attack or session mismatch |
| at_hash mismatch | 401 | Access token hash invalid | Token substitution attack |
| c_hash mismatch | 401 | Code hash invalid | Code substitution attack |
| Missing azp | 401 | Multiple audiences without azp | Protocol violation |

---

## 9. nonce Parameter for Replay Protection

The `nonce` parameter is a crucial security mechanism that binds the ID token to the client's session and prevents replay attacks.

### 9.1 nonce Flow

```
Client                     Authorization Server
  │                              │
  │  (1) Generate nonce          │
  │  nonce = random(256 bits)    │
  │  Store in session            │
  │                              │
  │  (2) Authorization Request   │
  │  nonce=n-0S6_WzA2Mj         │
  ├─────────────────────────────►│
  │                              │
  │                              │  (3) Store nonce with
  │                              │      authorization session
  │                              │
  │  (4) Authorization Response  │
  │  (after user authenticates)  │
  │◄─────────────────────────────┤
  │                              │
  │  (5) Token Response          │
  │  ID token with nonce claim   │
  │◄─────────────────────────────┤
  │                              │
  │  (6) Validate nonce          │
  │  id_token.nonce ==           │
  │  session.stored_nonce        │
  │                              │
  │  (7) Accept/Reject           │
  │                              │
  ▼                              ▼
```

### 9.2 nonce Requirements

| Requirement | Specification | Rationale |
|-------------|--------------|-----------|
| **Entropy** | 128+ bits | Prevent guessing |
| **Randomness** | Cryptographically secure random | Unpredictable |
| **Single-use** | One nonce per authorization | Prevent replay |
| **Session binding** | Store with client session | Associate with auth request |
| **REQUIRED for Implicit** | OIDC Core §3.2.2.1 | Critical for front-channel flows |
| **RECOMMENDED for Code** | OIDC Core §3.1.2.1 | Defense in depth |

### 9.3 nonce Generation

**Good nonce generation:**
```javascript
// Node.js
const crypto = require('crypto');
const nonce = crypto.randomBytes(32).toString('base64url');
// Result: "n-0S6_WzA2MjI3Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkw"

// Browser
const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');
```

**Bad nonce generation:**
```javascript
❌ Predictable:
const nonce = `nonce_${Date.now()}`;    // Predictable

❌ Low entropy:
const nonce = Math.random().toString();  // Not cryptographically secure

❌ Sequential:
let nonceCounter = 0;
const nonce = `nonce_${++nonceCounter}`;  // Guessable
```

### 9.4 nonce Attack Scenarios

**Attack Without nonce:**
```
Attacker obtains ID token from previous session:
  ID Token: {sub: "victim", exp: <future>}
  (No nonce claim)

Attacker replays ID token:
  1. Attacker initiates authorization with victim's client
  2. Attacker intercepts authorization response
  3. Attacker replays old ID token
  4. Client accepts (no nonce validation)
  5. Attacker authenticated as victim ✅ ← Bad

Result: Replay attack succeeds
```

**Defense With nonce:**
```
Legitimate Request:
  Client generates: nonce_1 = "n-0S6_WzA2Mj"
  Authorization request includes nonce_1
  ID token includes: "nonce": "n-0S6_WzA2Mj"
  Client validates: id_token.nonce == stored_nonce ✅

Attacker Replay Attempt:
  Attacker obtains old ID token: {nonce: "n-0S6_WzA2Mj"}
  Client generates new session: nonce_2 = "m-1T7_XyB3Nk"
  Authorization request includes nonce_2
  Attacker replays old ID token: {nonce: "n-0S6_WzA2Mj"}
  Client validates: "n-0S6_WzA2Mj" != "m-1T7_XyB3Nk" ❌
  Client rejects: nonce mismatch

Result: Replay attack blocked ✅
```

### 9.5 nonce Validation

```
FUNCTION validate_nonce(id_token, session):
    stored_nonce = session.get("oauth_nonce")
    
    # If nonce was sent, it MUST be in ID token
    IF stored_nonce exists:
        IF id_token.nonce is NULL:
            RETURN error("nonce missing from ID token")
        
        # Exact string comparison
        IF id_token.nonce != stored_nonce:
            RETURN error("nonce mismatch - potential replay attack")
        
        # Clear nonce after validation (single-use)
        session.delete("oauth_nonce")
    
    RETURN valid
```

### 9.6 nonce Best Practices

| Practice | Recommendation |
|----------|----------------|
| **Always use nonce** | Even for authorization code flow (defense in depth) |
| **Sufficient entropy** | 128+ bits (32+ characters base64url) |
| **Cryptographic random** | Use crypto.randomBytes() or equivalent |
| **Session binding** | Store with server-side session |
| **Single-use** | Delete after validation |
| **Timeout** | Expire if not used within reasonable time |

---

## 10. Security Threat Model for ID Tokens

ID tokens face several security threats. Each threat has a corresponding vulnerability mode toggle for the debugging tool.

### 10.1 Threat: ID Token Substitution (OIDC Core §16.3)

**Attack Vector:** Attacker substitutes their ID token with victim's access token.

**Attack Scenario:**
```
Attacker has:
  - Victim's ID token (stolen or social-engineered)
  - Attacker's access token

Attacker presents both to client:
  ID token: {sub: "victim", name: "Victim User"}
  Access token: <attacker's token>

Client without at_hash validation:
  - Reads ID token: "User is Victim User"
  - Uses access token for API calls: <attacker's permissions>
  
Result: Client displays "Welcome, Victim!" but operates with attacker's access
```

**Vulnerability Mode:** `SKIP_AT_HASH`

**Demonstration (Vuln Mode Enabled):**
```
Implicit Flow (response_type=id_token token):
  
Response (legitimate):
  id_token: {sub: "user_123", at_hash: "LDkt..."}
  access_token: "2YotnF..."

Attacker substitutes access token:
  id_token: {sub: "user_123", at_hash: "LDkt..."}    ← Victim's
  access_token: "ATTACKERS_TOKEN_HERE"                ← Attacker's

Client with SKIP_AT_HASH vulnerability:
  1. Validate signature: ✅
  2. Validate exp, iss, aud: ✅
  3. Validate at_hash: ⚠️ SKIPPED
  4. Accept ID token + access token: ✅
  
Result: Token substitution succeeds ✅ (vulnerability!)
```

**Mitigation:**
```
Client MUST validate at_hash:
  expected_hash = calculate_at_hash(access_token, alg)
  if id_token.at_hash != expected_hash:
      reject("Token substitution detected")

With at_hash validation:
  id_token.at_hash: "LDkt..." (for victim's access token)
  actual access token: "ATTACKERS_TOKEN_HERE"
  calculate_at_hash("ATTACKERS_TOKEN_HERE"): "XyZ9..." ≠ "LDkt..."
  Result: Mismatch detected, attack blocked ✅
```

**Validation:**
```
MUST validate at_hash when:
  - response_type includes "id_token token" (implicit flow)
  - Hybrid flow with access token in authorization response
```

### 10.2 Threat: Replay Attack (OIDC Core §16.11)

**Attack Vector:** Attacker captures and replays ID token.

**Attack Scenario:**
```
1. Victim authenticates, receives ID token
2. Attacker intercepts ID token (network sniff, XSS, etc.)
3. Attacker initiates new authorization with same client
4. Attacker replays captured ID token
5. Client without nonce validation accepts ID token
6. Attacker authenticated as victim
```

**Vulnerability Mode:** `SKIP_NONCE`

**Demonstration (Vuln Mode Enabled):**
```
Session 1 (Victim):
  Client generates nonce: "n-0S6_WzA2Mj"
  ID token received: {sub: "victim", exp: <future>, nonce: "n-0S6_WzA2Mj"}
  Attacker captures this ID token

Session 2 (Attacker):
  Attacker initiates auth (same client)
  Client generates new nonce: "m-1T7_XyB3Nk"
  Attacker replays old ID token: {sub: "victim", nonce: "n-0S6_WzA2Mj"}
  
Client with SKIP_NONCE vulnerability:
  1. Validate signature: ✅ (still valid)
  2. Validate exp: ✅ (not expired yet)
  3. Validate nonce: ⚠️ SKIPPED
  4. Accept ID token: ✅
  
Result: Replay attack succeeds, attacker authenticated as victim ✅ (vulnerability!)
```

**Mitigation:**
```
Client MUST validate nonce:
  stored_nonce = session.get("oauth_nonce")  // "m-1T7_XyB3Nk"
  if id_token.nonce != stored_nonce:
      reject("nonce mismatch - replay attack")

With nonce validation:
  stored_nonce: "m-1T7_XyB3Nk" (current session)
  id_token.nonce: "n-0S6_WzA2Mj" (old session)
  Mismatch detected, attack blocked ✅
```

**Validation:**
```
MUST include nonce in authorization request
MUST validate nonce matches in ID token
MUST clear nonce after validation (single-use)
```

### 10.3 Threat: Signature Bypass (alg=none) (RFC 7515 §8.1)

**Attack Vector:** Attacker removes signature and sets alg=none.

**Attack Scenario:**
```
Legitimate ID token:
  Header: {alg: "RS256", kid: "1"}
  Payload: {sub: "user_123", ...}
  Signature: <valid signature>

Attacker modifies:
  Header: {alg: "none"}              ← Changed
  Payload: {sub: "admin", ...}        ← Tampered
  Signature: (removed)                ← No signature

Client with alg=none acceptance:
  1. Parse header: alg = "none"
  2. Skip signature validation (alg=none)
  3. Accept payload as-is
  4. Attacker is now "admin"
```

**Vulnerability Mode:** `ACCEPT_UNSIGNED_TOKENS`

**Demonstration (Vuln Mode Enabled):**
```
Attacker crafts ID token:
  eyJhbGciOiJub25lIn0.eyJzdWIiOiJhZG1pbiIsImF1ZCI6ImNsaWVudF9hYmMifQ.
  
  Header: {"alg":"none"}
  Payload: {"sub":"admin","aud":"client_abc"}
  Signature: (empty)

Client with ACCEPT_UNSIGNED_TOKENS vulnerability:
  1. Decode header: alg = "none"
  2. Signature validation: ⚠️ SKIPPED (alg=none)
  3. Validate claims: ✅ (aud matches, etc.)
  4. Accept ID token: ✅
  
Result: Attacker authenticated as "admin" with no signature ✅ (critical vulnerability!)
```

**Mitigation:**
```
CRITICAL: Client MUST reject alg=none

FUNCTION validate_algorithm(header):
    if header.alg == "none":
        RETURN error("alg=none is forbidden - unsigned tokens not accepted")
    
    # Also validate algorithm is expected
    if header.alg not in ALLOWED_ALGORITHMS:
        RETURN error("Unsupported algorithm: " + header.alg)
    
    RETURN valid

Configuration:
  ALLOWED_ALGORITHMS = ["RS256", "ES256"]  // Whitelist only
```

**Validation:**
```
MUST reject alg=none (CRITICAL)
MUST whitelist allowed algorithms
MUST NOT dynamically accept any algorithm
```

### 10.4 Threat: Algorithm Confusion (RS256 to HS256)

**Attack Vector:** Attacker changes RS256 to HS256 and signs with public key.

**Attack Scenario:**
```
Authorization server uses RS256:
  - Signs ID tokens with private key
  - Publishes public key in JWKS

Attacker exploits:
  1. Fetches public key from JWKS
  2. Creates malicious payload: {sub: "admin"}
  3. Sets alg: "HS256" (symmetric algorithm)
  4. Signs payload with public key as HMAC secret
  5. Client with vulnerable validation accepts

Why this works:
  - Client expects RS256 (asymmetric, verify with public key)
  - Attacker provides HS256 (symmetric, verify with secret)
  - Client uses public key as HMAC secret
  - Signature validates (wrong algorithm, but same key)
```

**Vulnerability Mode:** `FLEXIBLE_ALGORITHM`

**Demonstration (Vuln Mode Enabled):**
```
Legitimate ID token (RS256):
  Header: {alg: "RS256", kid: "1"}
  Signed with: AS private key
  Verified with: AS public key (from JWKS)

Attacker's malicious token:
  Header: {alg: "HS256"}              ← Changed to symmetric
  Payload: {sub: "admin", ...}         ← Malicious payload
  Signature: HMAC-SHA256(payload, public_key_as_secret)

Client with FLEXIBLE_ALGORITHM vulnerability:
  1. Decode header: alg = "HS256"
  2. Fetch public key from JWKS
  3. Verify signature using public key as HMAC secret
  4. Signature validates (wrong algorithm, but mathematically valid)
  5. Accept ID token: ✅
  
Result: Attacker authenticated with forged token ✅ (critical vulnerability!)
```

**Mitigation:**
```
Client MUST enforce expected algorithm:

FUNCTION validate_algorithm(header, expected_alg):
    # Strict algorithm validation
    if header.alg != expected_alg:
        RETURN error("Algorithm mismatch. Expected " + expected_alg + 
                     ", got " + header.alg)
    
    # Additional check: Don't allow symmetric algorithms for public clients
    if header.alg in ["HS256", "HS384", "HS512"]:
        if client_type == "public":
            RETURN error("Symmetric algorithms not allowed for public clients")
    
    RETURN valid

Client configuration:
  expected_algorithm = "RS256"  // Strictly enforce
  
Per OIDC discovery:
  id_token_signing_alg_values_supported: ["RS256", "ES256"]
  Client MUST only accept algorithms in this list
```

**Validation:**
```
MUST whitelist specific algorithm (e.g., "RS256")
MUST NOT dynamically accept algorithm from token header
MUST NOT use public key as HMAC secret
For public clients: MUST NOT accept symmetric algorithms
```

### 10.5 Threat: Token Substitution Across Clients

**Attack Vector:** Use ID token intended for client A with client B.

**Attack Scenario:**
```
Client A (client_abc123):
  User authenticates
  Receives ID token: {aud: "client_abc123", sub: "user_123"}

Client B (client_xyz789):
  Attacker presents Client A's ID token
  ID token: {aud: "client_abc123", sub: "user_123"}

Client B without aud validation:
  - Validates signature: ✅ (same issuer)
  - Validates exp: ✅ (not expired)
  - Skips aud validation: ⚠️
  - Accepts ID token: ✅
  
Result: User authenticated at wrong client
```

**Vulnerability Mode:** `SKIP_AUD_CHECK`

**Demonstration (Vuln Mode Enabled):**
```
ID Token (for client_abc123):
  {
    "iss": "https://auth.example.com",
    "sub": "user_123",
    "aud": "client_abc123",           ← Intended for client A
    "exp": 1733432000
  }

Client B (client_xyz789) with SKIP_AUD_CHECK:
  1. Validate signature: ✅ (issuer key)
  2. Validate exp: ✅
  3. Validate aud: ⚠️ SKIPPED
  4. Accept ID token: ✅
  
Result: Token for client A used at client B ✅ (vulnerability!)
```

**Mitigation:**
```
Client MUST validate aud contains client_id:

FUNCTION validate_audience(id_token, client_id):
    aud = id_token.aud
    
    IF aud is String:
        IF aud != client_id:
            RETURN error("aud mismatch: " + aud + " != " + client_id)
    ELSE IF aud is Array:
        IF client_id NOT IN aud:
            RETURN error("client_id not in aud array")
    ELSE:
        RETURN error("Invalid aud format")
    
    RETURN valid

Client B validates:
  id_token.aud: "client_abc123"
  client_id: "client_xyz789"
  Mismatch: "client_abc123" != "client_xyz789"
  Result: Attack blocked ✅
```

**Validation:**
```
MUST validate aud claim
MUST check client_id is in aud (string or array)
MUST reject if aud doesn't match
```

### 10.6 Threat: Expired Token Acceptance

**Attack Vector:** Use expired ID token if exp not validated.

**Attack Scenario:**
```
ID token issued:
  exp: 1733428400  // 2025-12-05T10:00:00Z
  
Current time: 1733432000  // 2025-12-05T11:00:00Z (1 hour later)

Client without exp validation:
  - Validates signature: ✅
  - Skips exp check: ⚠️
  - Accepts expired token: ✅
  
Result: Expired token accepted
```

**Vulnerability Mode:** `SKIP_EXPIRATION_CHECK`

**Demonstration (Vuln Mode Enabled):**
```
ID Token:
  {
    "exp": 1733428400,    // 2025-12-05T10:00:00Z
    "iat": 1733424800,    // 2025-12-05T09:00:00Z
    ...
  }

Current time: 1733432000  // 2025-12-05T11:00:00Z

Client with SKIP_EXPIRATION_CHECK:
  1. Validate signature: ✅
  2. Validate exp: ⚠️ SKIPPED
  3. Accept ID token: ✅
  
Result: Token 1 hour past expiration accepted ✅ (vulnerability!)
```

**Mitigation:**
```
Client MUST validate exp:

FUNCTION validate_expiration(id_token):
    current_time = unix_timestamp_now()
    clock_skew = 300  // 5 minutes allowance
    
    IF current_time > (id_token.exp + clock_skew):
        age_seconds = current_time - id_token.exp
        RETURN error("ID token expired " + age_seconds + " seconds ago")
    
    RETURN valid

Validation with clock skew:
  current_time: 1733432000
  token_exp: 1733428400
  clock_skew: 300
  
  1733432000 > (1733428400 + 300)?
  1733432000 > 1733428700?
  YES → Reject (expired)
```

**Validation:**
```
MUST validate exp claim
MUST use current time
SHOULD allow clock skew (±5 minutes typical)
MUST reject if expired (even recently)
```

### 10.7 Threat: Issuer Substitution

**Attack Vector:** Attacker uses ID token from malicious issuer.

**Attack Scenario:**
```
Legitimate issuer: https://auth.example.com
Malicious issuer: https://evil.com (controlled by attacker)

Attacker sets up malicious AS:
  1. Issues ID tokens with iss: "https://evil.com"
  2. User somehow directed to evil AS
  3. Attacker receives ID token: {iss: "https://evil.com", sub: "victim"}

Client without iss validation:
  - Validates signature: ✅ (using evil.com's public key)
  - Skips iss check: ⚠️
  - Accepts malicious ID token: ✅
```

**Vulnerability Mode:** `SKIP_ISS_CHECK`

**Demonstration (Vuln Mode Enabled):**
```
Malicious ID Token:
  {
    "iss": "https://evil.com",        ← Malicious issuer
    "sub": "victim",
    "aud": "client_abc123",
    "exp": 1733432000
  }
  Signature: Valid (for evil.com's key)

Client with SKIP_ISS_CHECK:
  1. Fetch JWKS from iss URL: https://evil.com/.well-known/jwks.json
  2. Verify signature: ✅ (valid for evil.com's key)
  3. Validate iss: ⚠️ SKIPPED
  4. Accept ID token: ✅
  
Result: Malicious issuer accepted ✅ (vulnerability!)
```

**Mitigation:**
```
Client MUST validate iss:

FUNCTION validate_issuer(id_token, expected_issuer):
    # Case-sensitive exact match
    IF id_token.iss != expected_issuer:
        RETURN error("Invalid issuer. Expected " + expected_issuer + 
                     ", got " + id_token.iss)
    
    # Fetch JWKS only from expected issuer
    jwks_uri = get_jwks_uri_from_discovery(expected_issuer)
    # Never use iss claim to determine JWKS location
    
    RETURN valid

Client configuration:
  expected_issuer = "https://auth.example.com"  // Hardcoded or config
  
Validation:
  id_token.iss: "https://evil.com"
  expected_issuer: "https://auth.example.com"
  Mismatch detected, attack blocked ✅
```

**Validation:**
```
MUST validate iss matches expected issuer
MUST use exact string comparison (case-sensitive)
MUST NOT fetch JWKS from iss claim (use configured value)
MUST hardcode or configure expected issuer
```

### 10.8 Security Threat Summary

| Threat | Attack | Vuln Mode | Mitigation | Required Validation |
|--------|--------|-----------|------------|---------------------|
| **ID Token Substitution** | Substitute victim's ID token + attacker's access token | `SKIP_AT_HASH` | Validate at_hash | at_hash verification |
| **Replay Attack** | Replay captured ID token | `SKIP_NONCE` | Validate nonce | nonce verification |
| **Signature Bypass** | alg=none removes signature | `ACCEPT_UNSIGNED_TOKENS` | Reject alg=none | Algorithm validation |
| **Algorithm Confusion** | RS256→HS256, sign with public key | `FLEXIBLE_ALGORITHM` | Strict alg whitelist | Algorithm enforcement |
| **Cross-Client Substitution** | Use token from client A at client B | `SKIP_AUD_CHECK` | Validate aud | Audience verification |
| **Expired Token** | Use token past expiration | `SKIP_EXPIRATION_CHECK` | Validate exp | Expiration check |
| **Issuer Substitution** | Malicious issuer issues tokens | `SKIP_ISS_CHECK` | Validate iss | Issuer verification |

---

## 11. ID Token Lifetime

ID tokens have a limited lifetime to minimize the impact of token theft.

### 11.1 Typical Lifetime

| Use Case | Recommended Lifetime | Rationale |
|----------|---------------------|-----------|
| **Standard web application** | 15-60 minutes | Balance security vs session UX |
| **High-security application** | 5-15 minutes | Minimize theft impact |
| **Mobile application** | 30-60 minutes | Reduce re-authentication frequency |
| **Long-lived session** | 60 minutes (ID token) + refresh token | ID token proves recent auth |

### 11.2 Lifetime Considerations

**ID Token Lifetime vs Access Token Lifetime:**

| Scenario | ID Token Lifetime | Access Token Lifetime | Why Different? |
|----------|------------------|----------------------|----------------|
| Typical | 60 minutes | 60 minutes | Same (common) |
| High-security | 15 minutes | 30 minutes | ID token shorter (auth proof more sensitive) |
| Long session | 60 minutes | 15 minutes | Short access token, longer auth proof |

**Clock Skew Allowance:**

Clients SHOULD allow clock skew (typically ±5 minutes) when validating exp:

```javascript
const current_time = Math.floor(Date.now() / 1000);
const clock_skew = 300;  // 5 minutes

if (current_time > (id_token.exp + clock_skew)) {
  throw new Error('ID token expired');
}
```

### 11.3 Lifetime in Different Scenarios

**Scenario 1: Initial Authentication**
```
User logs in:
  - ID token issued: exp = now + 60 minutes
  - Access token issued: exp = now + 60 minutes
  - Refresh token issued: exp = now + 30 days

After 60 minutes:
  - ID token expires (authentication proof expires)
  - Access token expires (API access expires)
  - Client uses refresh token to get new access token
  - New ID token NOT issued (use refresh token to re-authenticate if needed)
```

**Scenario 2: max_age Parameter**
```
Client requests recent authentication:
  max_age=3600  // Require auth within last hour

User authenticated 2 hours ago:
  ID token: {auth_time: 2 hours ago, exp: future}

Client validates:
  (current_time - auth_time) = 7200 seconds
  7200 > 3600 (max_age)
  Result: Re-authentication required

Even though ID token not expired, authentication too old
```

---

## 12. UserInfo Endpoint vs ID Token Claims

Claims can be delivered via ID token or UserInfo endpoint. Understanding when to use each is important for performance and privacy.

### 12.1 Comparison

| Aspect | ID Token | UserInfo Endpoint |
|--------|----------|-------------------|
| **Delivery** | Immediate (with token response) | Separate HTTP request |
| **Request Required** | No | Yes (with access token) |
| **Latency** | Low (no additional request) | Higher (extra round-trip) |
| **Size Limit** | Yes (browser URL limits, token size) | No (separate response) |
| **Claims Available** | Requested via scope or claims param | All claims available |
| **Format** | JWT (signed) | JSON (may or may not be signed) |
| **Authentication** | N/A (comes with token) | Access token required |
| **Caching** | Can cache ID token | Can cache UserInfo response |

### 12.2 When to Use Each

| Use Case | Recommendation | Reason |
|----------|---------------|--------|
| **Core identity (sub, name, email)** | ID Token | Fast, immediate, essential claims |
| **Extended profile (address, phone)** | UserInfo | Large, optional, not always needed |
| **Profile picture (large URL)** | UserInfo | Reduce ID token size |
| **Custom claims (many fields)** | UserInfo | Avoid token bloat |
| **Real-time data (balance, status)** | UserInfo | Always fetch latest |
| **Static identity** | ID Token | Doesn't change often |

### 12.3 UserInfo Endpoint Request

**Request:**
```http
GET /userinfo HTTP/1.1
Host: auth.example.com
Authorization: Bearer <access_token>
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "sub": "user_123",                    ← MUST match ID token sub
  "name": "Jane Doe",
  "given_name": "Jane",
  "family_name": "Doe",
  "email": "jane@example.com",
  "email_verified": true,
  "picture": "https://example.com/jane.jpg",
  "address": {
    "street_address": "123 Main St",
    "locality": "San Francisco",
    "region": "CA",
    "postal_code": "94105",
    "country": "USA"
  },
  "custom_claim": "custom_value"
}
```

### 12.4 Consistency Requirement

**CRITICAL:** The `sub` claim in UserInfo response MUST match the `sub` in ID token.

```javascript
// ID Token
const id_token_sub = "user_123";

// UserInfo Response
const userinfo_response = {
  sub: "user_123",    // MUST match ID token
  ...
};

// Validation
if (userinfo_response.sub !== id_token_sub) {
  throw new Error('sub mismatch between ID token and UserInfo');
}
```

**Why This Matters:**
- Prevents token substitution
- Ensures claims belong to authenticated user
- Maintains binding between ID token and UserInfo

### 12.5 Example: Combining ID Token + UserInfo

**ID Token (compact, essential claims):**
```json
{
  "iss": "https://auth.example.com",
  "sub": "user_123",
  "aud": "client_abc123",
  "exp": 1733432000,
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

**UserInfo Response (comprehensive, extended claims):**
```json
{
  "sub": "user_123",              ← Matches ID token
  "name": "Jane Doe",
  "given_name": "Jane",
  "family_name": "Doe",
  "email": "jane@example.com",
  "email_verified": true,
  "picture": "https://example.com/jane-large.jpg",
  "address": {
    "street_address": "123 Main St",
    "locality": "San Francisco",
    "region": "CA",
    "postal_code": "94105"
  },
  "phone_number": "+1 (555) 123-4567",
  "phone_verified": true,
  "updated_at": 1733428400,
  
  "custom_department": "Engineering",
  "custom_employee_id": "EMP-12345",
  "custom_preferences": {
    "theme": "dark",
    "language": "en-US"
  }
}
```

**Usage Pattern:**
```javascript
// 1. Authenticate user, get ID token
const id_token = parseIdToken(token_response.id_token);
console.log(`Welcome, ${id_token.name}!`);  // "Welcome, Jane Doe!"

// 2. Fetch additional claims from UserInfo (if needed)
const userinfo = await fetch('https://auth.example.com/userinfo', {
  headers: { 'Authorization': `Bearer ${access_token}` }
}).then(r => r.json());

// 3. Verify sub matches
if (userinfo.sub !== id_token.sub) {
  throw new Error('sub mismatch');
}

// 4. Use extended claims
displayProfile(userinfo);  // Show full profile with address, phone, etc.
```

---

## 13. ID Token in Different Response Types

ID tokens appear in different locations depending on the OIDC response type.

### 13.1 Response Types Summary

| response_type | ID Token Location | Access Token Location | at_hash Required? | c_hash Required? |
|--------------|-------------------|----------------------|-------------------|------------------|
| `code` | Token response | Token response | No | No |
| `id_token` | Auth response | N/A | No | No |
| `id_token token` | Auth response | Auth response | YES | No |
| `code id_token` | Both responses | Token response | No | YES (auth resp) |
| `code token` | Token response | Auth response | YES (auth resp) | No |
| `code id_token token` | Both responses | Both responses | YES (auth resp) | YES (auth resp) |

### 13.2 Authorization Code Flow (response_type=code)

**Authorization Response:**
```http
HTTP/1.1 302 Found
Location: https://client.example.com/callback?
  code=SplxlOBeZQQYbYS6WxSbIA
  &state=af0ifjsldkj
```

**Token Response:**
```http
{
  "access_token": "SlAV32hkKG",
  "token_type": "Bearer",
  "expires_in": 3600,
  "id_token": "eyJhbGci...",          ← ID token HERE
  "refresh_token": "8xLOxBtZp8"
}
```

**ID Token Claims:**
- No `at_hash` (both tokens in same response, already bound)
- No `c_hash` (code already used)
- `nonce` if sent in authorization request

### 13.3 Implicit Flow - ID Token Only (response_type=id_token)

⚠️ **DEPRECATED:** Don't use for new implementations.

**Authorization Response:**
```http
HTTP/1.1 302 Found
Location: https://client.example.com/callback#
  id_token=eyJhbGci...
  &state=af0ifjsldkj
```

**ID Token Claims:**
- `nonce` REQUIRED
- No `at_hash` (no access token)
- No `c_hash` (no code)

### 13.4 Implicit Flow - ID Token + Access Token (response_type=id_token token)

⚠️ **DEPRECATED:** Don't use for new implementations.

**Authorization Response:**
```http
HTTP/1.1 302 Found
Location: https://client.example.com/callback#
  access_token=SlAV32hkKG
  &token_type=Bearer
  &id_token=eyJhbGci...
  &expires_in=3600
  &state=af0ifjsldkj
```

**ID Token Claims:**
- `nonce` REQUIRED
- `at_hash` REQUIRED (binds ID token to access token)
- No `c_hash` (no code)

### 13.5 Hybrid Flow (response_type=code id_token)

**Authorization Response:**
```http
HTTP/1.1 302 Found
Location: https://client.example.com/callback#
  code=SplxlOBeZQQYbYS6WxSbIA
  &id_token=eyJhbGci...             ← ID token #1
  &state=af0ifjsldkj
```

**ID Token #1 Claims:**
- `c_hash` REQUIRED (binds ID token to code)
- `nonce` REQUIRED
- No `at_hash` (no access token yet)

**Token Response:**
```http
{
  "access_token": "SlAV32hkKG",
  "token_type": "Bearer",
  "id_token": "eyJhbGci..."          ← ID token #2
}
```

**ID Token #2 Claims:**
- No `c_hash` (code already used)
- `nonce` if sent in request
- No `at_hash` (tokens in same response)

---

## 14. Implementation Requirements Checklist

### 14.1 Client MUST Implement

| # | Requirement | Spec Reference | Vuln Mode |
|---|-------------|----------------|-----------|
| C1 | Validate ID token per OIDC Core §3.1.3.7 (all 12 steps) | OIDC Core §3.1.3.7 | Multiple |
| C2 | Verify signature using issuer's public keys from JWKS | OIDC Core §3.1.3.7 step 1 | `SKIP_SIGNATURE_CHECK` |
| C3 | Validate `iss` matches expected issuer (exact match) | OIDC Core §3.1.3.7 step 2 | `SKIP_ISS_CHECK` |
| C4 | Validate `aud` contains client_id | OIDC Core §3.1.3.7 step 3 | `SKIP_AUD_CHECK` |
| C5 | Validate `exp` is in future (with clock skew) | OIDC Core §3.1.3.7 step 6 | `SKIP_EXPIRATION_CHECK` |
| C6 | Reject `alg=none` (CRITICAL) | RFC 7515 §8.1 | `ACCEPT_UNSIGNED_TOKENS` |
| C7 | Validate `nonce` if sent in request | OIDC Core §3.1.3.7 step 8 | `SKIP_NONCE` |
| C8 | Validate `at_hash` if present | OIDC Core §3.1.3.7 step 11 | `SKIP_AT_HASH` |
| C9 | Validate `c_hash` if present | OIDC Core §3.3.2.11 | `SKIP_C_HASH` |
| C10 | Enforce expected algorithm (whitelist) | OIDC Core §3.1.3.7 step 5 | `FLEXIBLE_ALGORITHM` |
| C11 | Generate cryptographically random nonce (if used) | OIDC Core §3.1.2.1 | `WEAK_NONCE` |
| C12 | NEVER use ID token as access token | OIDC Core §2 | `ID_TOKEN_AS_ACCESS` |

### 14.2 Authorization Server MUST Implement

| # | Requirement | Spec Reference |
|---|-------------|----------------|
| AS1 | Issue ID tokens as signed JWTs | OIDC Core §2 |
| AS2 | Include all REQUIRED claims (iss, sub, aud, exp, iat) | OIDC Core §2 |
| AS3 | Include `nonce` from request in ID token | OIDC Core §3.1.3.1 |
| AS4 | Calculate `at_hash` correctly for relevant flows | OIDC Core §3.1.3.3 |
| AS5 | Calculate `c_hash` correctly for hybrid flows | OIDC Core §3.3.2.11 |
| AS6 | Use secure signing algorithms (RS256, ES256) | OIDC Core §8 |
| AS7 | Publish JWKS at jwks_uri | OIDC Discovery §3 |
| AS8 | Set appropriate ID token lifetime (5-60 min) | OIDC Core §2 |
| AS9 | Include `auth_time` if max_age requested | OIDC Core §3.1.3.1 |
| AS10 | Never issue ID tokens with alg=none | RFC 7515 §8.1 |

### 14.3 Common Implementation Errors

| Error | Impact | Fix |
|-------|--------|-----|
| **Using ID token as access token** | CRITICAL - Resource servers can't validate | Use access token for APIs |
| **Skipping signature validation** | CRITICAL - Accept forged tokens | Always verify signature |
| **Not validating nonce** | HIGH - Replay attacks possible | Validate nonce matches |
| **Accepting alg=none** | CRITICAL - Accept unsigned tokens | Reject alg=none |
| **Not validating aud** | HIGH - Cross-client attacks | Validate aud = client_id |
| **Flexible algorithm acceptance** | CRITICAL - Algorithm confusion | Whitelist specific alg |
| **Skipping at_hash validation** | HIGH - Token substitution | Validate at_hash when present |
| **Not checking exp** | MEDIUM - Expired tokens accepted | Validate exp with clock skew |

---

## 15. Example Scenarios

### 15.1 Happy Path: Authorization Code Flow with ID Token Validation

**Flow:**
```
1. User initiates login
2. Client redirects to authorization endpoint
3. User authenticates
4. Authorization server redirects back with code
5. Client exchanges code for tokens
6. Client validates ID token
7. Client extracts user identity
```

**Authorization Request:**
```http
GET /authorize?
  response_type=code
  &client_id=client_abc123
  &redirect_uri=https://client.example.com/callback
  &scope=openid profile email
  &state=af0ifjsldkj
  &nonce=n-0S6_WzA2Mj
  &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  &code_challenge_method=S256 HTTP/1.1
Host: auth.example.com
```

**Authorization Response:**
```http
HTTP/1.1 302 Found
Location: https://client.example.com/callback?
  code=SplxlOBeZQQYbYS6WxSbIA
  &state=af0ifjsldkj
```

**Token Request:**
```http
POST /token HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=SplxlOBeZQQYbYS6WxSbIA
&redirect_uri=https://client.example.com/callback
&client_id=client_abc123
&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

**Token Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "access_token": "SlAV32hkKG",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "8xLOxBtZp8",
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEifQ.eyJpc3MiOiJodHRwczovL2F1dGguZXhhbXBsZS5jb20iLCJzdWIiOiJ1c2VyXzEyMyIsImF1ZCI6ImNsaWVudF9hYmMxMjMiLCJleHAiOjE3MzM0MzIwMDAsImlhdCI6MTczMzQyODQwMCwibm9uY2UiOiJuLTBTNl9XekEyTWoiLCJuYW1lIjoiSmFuZSBEb2UiLCJlbWFpbCI6ImphbmVAZXhhbXBsZS5jb20ifQ.signature_here"
}
```

**Client Validation:**
```javascript
// 1. Decode ID token
const id_token = decodeJWT(token_response.id_token);

// 2. Fetch JWKS
const jwks = await fetch('https://auth.example.com/.well-known/jwks.json')
  .then(r => r.json());

// 3. Find matching key
const key = jwks.keys.find(k => k.kid === id_token.header.kid);

// 4. Verify signature
if (!verifySignature(id_token, key)) {
  throw new Error('Invalid signature');
}

// 5. Validate claims
if (id_token.iss !== 'https://auth.example.com') {
  throw new Error('Invalid issuer');
}

if (id_token.aud !== 'client_abc123') {
  throw new Error('Invalid audience');
}

if (id_token.header.alg === 'none') {
  throw new Error('alg=none forbidden');
}

const now = Math.floor(Date.now() / 1000);
if (now > id_token.exp + 300) {  // 5 min clock skew
  throw new Error('ID token expired');
}

if (id_token.nonce !== stored_nonce) {
  throw new Error('nonce mismatch');
}

// 6. Extract user identity
console.log(`Authenticated user: ${id_token.sub}`);
console.log(`Name: ${id_token.name}`);
console.log(`Email: ${id_token.email}`);

// Result: ✅ User authenticated successfully
```

---

### 15.2 ID Token Substitution Attack Blocked by at_hash

**Scenario:** Implicit flow (response_type=id_token token)

**Legitimate Response:**
```http
HTTP/1.1 302 Found
Location: https://client.example.com/callback#
  access_token=2YotnFZFEjr1zCsicMWpAA
  &token_type=Bearer
  &id_token=eyJhbGci...
  &expires_in=3600
  &state=af0ifjsldkj
```

**ID Token (decoded):**
```json
{
  "iss": "https://auth.example.com",
  "sub": "user_123",
  "aud": "client_abc123",
  "exp": 1733432000,
  "nonce": "n-0S6_WzA2Mj",
  "at_hash": "LDktKdoQak3Pk0cnXxPA2Q"    ← Hash of legitimate access token
}
```

**Attacker Substitutes Access Token:**
```
Attacker has:
  - Victim's ID token (above)
  - Attacker's access token: "ATTACKERS_TOKEN_123"

Attacker presents to client:
  id_token: (victim's, with at_hash="LDktKdo...")
  access_token: "ATTACKERS_TOKEN_123"
```

**Client Validation:**
```javascript
// Calculate expected at_hash
const expected_hash = calculate_at_hash("ATTACKERS_TOKEN_123", "RS256");
// Result: "XyZ9Abc3Def4Ghi5Jkl6Mno7Pqr8Stu9"

// Compare to ID token at_hash
if (expected_hash !== id_token.at_hash) {
  // "XyZ9Abc..." !== "LDktKdo..."
  throw new Error('at_hash mismatch - token substitution detected');
}

// Result: ❌ Attack blocked, tokens don't match
```

---

### 15.3 Replay Attack Blocked by nonce Validation

**Session 1 (Victim):**
```javascript
// Client generates nonce
const nonce_1 = generateNonce();  // "n-0S6_WzA2Mj"
sessionStorage.setItem('oauth_nonce', nonce_1);

// Authorization request includes nonce_1
// ID token received:
{
  "sub": "user_123",
  "nonce": "n-0S6_WzA2Mj",
  "exp": 1733432000  // Future
}

// Attacker captures this ID token
```

**Session 2 (Attacker):**
```javascript
// Attacker initiates new authorization
// Client generates NEW nonce
const nonce_2 = generateNonce();  // "m-1T7_XyB3Nk"
sessionStorage.setItem('oauth_nonce', nonce_2);

// Attacker replays old ID token from Session 1
const replayed_token = {
  "sub": "user_123",
  "nonce": "n-0S6_WzA2Mj",  // Old nonce
  "exp": 1733432000  // Still valid (not expired)
};

// Client validates
const stored_nonce = sessionStorage.getItem('oauth_nonce');  // "m-1T7_XyB3Nk"

if (replayed_token.nonce !== stored_nonce) {
  // "n-0S6_WzA2Mj" !== "m-1T7_XyB3Nk"
  throw new Error('nonce mismatch - replay attack detected');
}

// Result: ❌ Attack blocked, nonces don't match
```

---

### 15.4 Algorithm Confusion Attack Blocked by Strict Validation

**Attacker's Malicious Token:**
```
Header:
{
  "alg": "HS256",    ← Changed from RS256 to HS256
  "kid": "1"
}

Payload:
{
  "iss": "https://auth.example.com",
  "sub": "admin",    ← Attacker wants to be admin
  "aud": "client_abc123",
  "exp": 1733432000
}

Signature:
HMAC-SHA256(header + payload, public_key_as_secret)
```

**Vulnerable Client (accepts any algorithm):**
```javascript
❌ VULNERABLE CODE:
const header = decodeHeader(token);
const key = getKey(header.kid);

// Blindly uses algorithm from header
if (header.alg === 'RS256') {
  verifyRS256(token, key);
} else if (header.alg === 'HS256') {
  verifyHS256(token, key);  // Uses public key as HMAC secret!
}

// Result: Signature validates (wrong algorithm, but passes)
// Attacker authenticated as "admin" ✅ (vulnerability!)
```

**Secure Client (enforces expected algorithm):**
```javascript
✅ SECURE CODE:
const EXPECTED_ALGORITHM = 'RS256';  // Configured/hardcoded

const header = decodeHeader(token);

// Strict algorithm check FIRST
if (header.alg !== EXPECTED_ALGORITHM) {
  throw new Error(`Algorithm mismatch. Expected ${EXPECTED_ALGORITHM}, got ${header.alg}`);
}

// Only now proceed with verification
const key = getKey(header.kid);
verifyRS256(token, key);

// Result: ❌ Attack blocked, algorithm mismatch detected
```

---

### 15.5 Expired ID Token Rejected

**ID Token:**
```json
{
  "iss": "https://auth.example.com",
  "sub": "user_123",
  "aud": "client_abc123",
  "exp": 1733428400,  // 2025-12-05T10:00:00Z
  "iat": 1733424800   // 2025-12-05T09:00:00Z
}
```

**Client Validation (at 11:00:00Z):**
```javascript
const current_time = 1733432000;  // 2025-12-05T11:00:00Z
const clock_skew = 300;  // 5 minutes

if (current_time > (id_token.exp + clock_skew)) {
  const expired_seconds_ago = current_time - id_token.exp;
  throw new Error(`ID token expired ${expired_seconds_ago} seconds ago`);
  // "ID token expired 3600 seconds ago" (1 hour)
}

// Result: ❌ Token rejected (expired)
```

---

### 15.6 Cross-Client Token Usage Blocked by aud Validation

**ID Token (for client_abc123):**
```json
{
  "iss": "https://auth.example.com",
  "sub": "user_123",
  "aud": "client_abc123",    ← Intended for client A
  "exp": 1733432000
}
```

**Client B (client_xyz789) Validation:**
```javascript
const CLIENT_ID = 'client_xyz789';

if (id_token.aud !== CLIENT_ID) {
  throw new Error(`aud mismatch: ${id_token.aud} !== ${CLIENT_ID}`);
  // "aud mismatch: client_abc123 !== client_xyz789"
}

// Result: ❌ Token rejected (wrong client)
```

---

### 15.7 Decoding and Displaying ID Token Claims in Tool

**Tool Display:**
```
┌─────────────────────────────────────────────────────────────┐
│ ID Token Decoder                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Encoded ID Token:                                           │
│ eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEifQ...      │
│                                                             │
│ ═══════════════════════════════════════════════════════     │
│ HEADER                                                      │
│ ═══════════════════════════════════════════════════════     │
│ {                                                           │
│   "alg": "RS256",         ✅ Valid algorithm                │
│   "typ": "JWT",                                             │
│   "kid": "1"              → Key ID for signature verify     │
│ }                                                           │
│                                                             │
│ ═══════════════════════════════════════════════════════     │
│ PAYLOAD (Claims)                                            │
│ ═══════════════════════════════════════════════════════     │
│ {                                                           │
│   "iss": "https://auth.example.com",   ✅ Valid issuer      │
│   "sub": "user_123",                   → User ID            │
│   "aud": "client_abc123",              ✅ Matches client    │
│   "exp": 1733432000,                   ✅ Not expired       │
│   "iat": 1733428400,                   → Issued 1 hour ago  │
│   "nonce": "n-0S6_WzA2Mj",             ✅ Matches request   │
│   "name": "Jane Doe",                  → User's name        │
│   "email": "jane@example.com",         → User's email       │
│   "email_verified": true               → Email confirmed    │
│ }                                                           │
│                                                             │
│ ═══════════════════════════════════════════════════════     │
│ SIGNATURE                                                   │
│ ═══════════════════════════════════════════════════════     │
│ Algorithm: RS256                                            │
│ Status: ✅ VALID                                            │
│ Verified with key ID: 1                                     │
│                                                             │
│ ═══════════════════════════════════════════════════════     │
│ VALIDATION RESULTS                                          │
│ ═══════════════════════════════════════════════════════     │
│ ✅ Signature valid                                          │
│ ✅ Issuer matches expected                                  │
│ ✅ Audience matches client ID                               │
│ ✅ Algorithm is RS256 (not alg=none)                        │
│ ✅ Not expired (valid for 55 more minutes)                  │
│ ✅ nonce matches request                                    │
│                                                             │
│ Result: ID TOKEN VALID ✅                                   │
│                                                             │
│ Authenticated User:                                         │
│   User ID: user_123                                         │
│   Name: Jane Doe                                            │
│   Email: jane@example.com (verified)                        │
└─────────────────────────────────────────────────────────────┘
```

---

### 15.8 Comparing ID Token Claims to UserInfo Endpoint Response

**ID Token Claims:**
```json
{
  "sub": "user_123",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "email_verified": true
}
```

**UserInfo Response:**
```http
GET /userinfo HTTP/1.1
Authorization: Bearer SlAV32hkKG

HTTP/1.1 200 OK
Content-Type: application/json

{
  "sub": "user_123",                      ← ✅ Matches ID token
  "name": "Jane Doe",
  "given_name": "Jane",
  "family_name": "Doe",
  "email": "jane@example.com",
  "email_verified": true,
  "picture": "https://example.com/jane.jpg",
  "address": {
    "street_address": "123 Main St",
    "locality": "San Francisco",
    "region": "CA",
    "postal_code": "94105"
  },
  "phone_number": "+1 (555) 123-4567",
  "custom_department": "Engineering"
}
```

**Client Validation:**
```javascript
// 1. Validate sub matches
if (userinfo.sub !== id_token.sub) {
  throw new Error('sub mismatch between ID token and UserInfo');
}

// 2. Merge claims
const user_profile = {
  ...id_token,        // ID token claims
  ...userinfo         // UserInfo claims (override if conflict)
};

// Result:
{
  "sub": "user_123",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "email_verified": true,
  "given_name": "Jane",              ← From UserInfo
  "family_name": "Doe",              ← From UserInfo
  "picture": "https://...",          ← From UserInfo
  "address": {...},                  ← From UserInfo
  "phone_number": "+1 (555) 123-4567", ← From UserInfo
  "custom_department": "Engineering" ← From UserInfo
}
```

---

## Appendix A: OIDC Core Cross-Reference Index

| Topic | OIDC Core Section | Related Specs |
|-------|------------------|---------------|
| ID token definition | §2 | RFC 7519 |
| ID token validation | §3.1.3.7 | RFC 7515, RFC 7519 |
| Standard claims | §5.1 | — |
| at_hash calculation | §3.1.3.3 | — |
| c_hash calculation | §3.3.2.11 | — |
| nonce parameter | §3.1.2.1, §15.5.2 | — |
| Authorization code flow | §3.1 | RFC 6749 §4.1 |
| Implicit flow (deprecated) | §3.2 | RFC 6749 §4.2 |
| Hybrid flow | §3.3 | — |
| UserInfo endpoint | §5.3 | — |
| Security considerations | §16 | RFC 6819 |
| Signature algorithms | §8 | RFC 7515 |

---

## Appendix B: Vulnerability Mode Quick Reference

| Toggle | Attack Demonstrated | Spec Violation | Section |
|--------|-------------------|----------------|---------|
| `SKIP_AT_HASH` | ID token substitution | OIDC Core §3.1.3.7 | §10.1 |
| `SKIP_NONCE` | Replay attack | OIDC Core §3.1.2.1 | §10.2 |
| `ACCEPT_UNSIGNED_TOKENS` | Signature bypass (alg=none) | RFC 7515 §8.1 | §10.3 |
| `FLEXIBLE_ALGORITHM` | Algorithm confusion (RS256→HS256) | OIDC Core §3.1.3.7 | §10.4 |
| `SKIP_AUD_CHECK` | Cross-client token substitution | OIDC Core §3.1.3.7 | §10.5 |
| `SKIP_EXPIRATION_CHECK` | Expired token acceptance | OIDC Core §3.1.3.7 | §10.6 |
| `SKIP_ISS_CHECK` | Issuer substitution | OIDC Core §3.1.3.7 | §10.7 |
| `SKIP_SIGNATURE_CHECK` | Forged token acceptance | OIDC Core §3.1.3.7 | §8.1 |
| `ID_TOKEN_AS_ACCESS` | Using ID token at resource server | OIDC Core §2 | §1.3 |
| `WEAK_NONCE` | Low-entropy nonce guessing | OIDC Core §15.5.2 | §9.2 |
| `SKIP_C_HASH` | Code substitution (hybrid flow) | OIDC Core §3.3.2.11 | §6.2 |

---

*Document Version: 1.0.0*
*Last Updated: December 5, 2025*
*Specification References: OpenID Connect Core 1.0, RFC 7519, RFC 7515, RFC 6749*
