# JWT Structure and Validation

## Specification Reference for OAuth2/OIDC Debugging Tool

> *"A JWT is like a note from your doctor saying you don't need to go to gym class. It's signed, so it's trustworthy (assuming you verify the signature). Unlike a forged doctor's note, a JWT with alg=none is immediately obvious to anyone paying attention."*

---

## 1. Overview

A JSON Web Token (JWT) is a compact, URL-safe means of representing claims to be transferred between two parties. The claims in a JWT are encoded as a JSON object that is used as the payload of a JSON Web Signature (JWS) structure or as the plaintext of a JSON Web Encryption (JWE) structure, enabling the claims to be digitally signed or integrity protected with a Message Authentication Code (MAC) and/or encrypted.

**In OAuth2/OIDC Context:**

| Token Type | JWT Usage | Spec Reference |
|------------|-----------|----------------|
| **ID Tokens** | MUST be JWT (signed) | OIDC Core §2 |
| **Access Tokens** | MAY be JWT or opaque | RFC 6749 §1.4 |
| **Refresh Tokens** | Typically opaque (rarely JWT) | RFC 6749 §1.5 |

### 1.1 Key Benefits of JWTs

| Benefit | Explanation |
|---------|-------------|
| **Self-contained** | All information in token (no lookup required) |
| **Local validation** | No network call needed (verify signature with public key) |
| **Stateless** | No server-side session storage |
| **Portable** | JSON format, works across platforms |
| **Compact** | Base64url encoded, URL-safe |
| **Extensible** | Custom claims supported |

### 1.2 Primary Specifications

| Specification | Purpose | Key Sections |
|---------------|---------|--------------|
| RFC 7519 | JSON Web Token (JWT) | Complete specification |
| RFC 7515 | JSON Web Signature (JWS) | Signature format and algorithms |
| RFC 7516 | JSON Web Encryption (JWE) | Encryption format |
| RFC 7517 | JSON Web Key (JWK) | Key format |
| RFC 7518 | JSON Web Algorithms (JWA) | Cryptographic algorithms |

---

## 2. JWT vs JWS vs JWE

Understanding the relationship between these specifications is essential for debugging JWT issues.

### 2.1 Terminology

**JWT (JSON Web Token) - RFC 7519:**
- Generic term for JSON-based security tokens
- Can be signed (JWS) or encrypted (JWE) or both
- "JWT" typically means "signed JWT" in common usage

**JWS (JSON Web Signature) - RFC 7515:**
- JWT with a signature
- Three parts: Header, Payload, Signature
- Most common in OAuth2/OIDC
- Claims visible (base64url encoded, not encrypted)

**JWE (JSON Web Encryption) - RFC 7516:**
- JWT with encryption
- Five parts: Header, Encrypted Key, IV, Ciphertext, Tag
- Less common in OAuth2/OIDC
- Claims hidden (encrypted)

### 2.2 Typical OAuth2/OIDC Usage

```
┌─────────────────────────────────────────────────┐
│  OAuth2/OIDC Token Types                        │
├─────────────────────────────────────────────────┤
│                                                 │
│  ID Token (OIDC):                               │
│    Format: JWS (signed JWT)                     │
│    Signed: ✅ Always                            │
│    Encrypted: ❌ Rarely                         │
│    Claims visible: ✅ Yes (base64url)           │
│                                                 │
│  Access Token (OAuth2):                         │
│    Format: Opaque OR JWS                        │
│    Signed: ✅ If JWT                            │
│    Encrypted: ❌ Rarely                         │
│    Claims visible: ✅ If JWT                    │
│                                                 │
│  Refresh Token (OAuth2):                        │
│    Format: Opaque (typically)                   │
│    Signed: ❌ Rarely JWT                        │
│    Encrypted: ❌ N/A                            │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 2.3 Relationship Diagram

```
                    JWT (Generic Token)
                           │
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
   JWS (Signed)                         JWE (Encrypted)
   ┌──────────┐                         ┌──────────┐
   │ Header   │                         │ Header   │
   │ Payload  │                         │ Enc Key  │
   │ Signature│                         │ IV       │
   └──────────┘                         │ Ciphertext│
                                        │ Auth Tag │
                                        └──────────┘
        │                                     │
        └──────────────┬──────────────────────┘
                       │
                       ▼
              Nested JWT (JWS inside JWE)
              ┌────────────────────┐
              │ Encrypted(Signed)  │
              │ - Outer: JWE       │
              │ - Inner: JWS       │
              └────────────────────┘
```

### 2.4 OAuth2/OIDC Standard Practice

| Scenario | Typical Format | Reasoning |
|----------|---------------|-----------|
| **ID tokens** | JWS (signed, not encrypted) | Claims need to be verifiable by client |
| **Access tokens (public)** | JWS or opaque | Balance between stateless validation and size |
| **Access tokens (confidential)** | JWS or opaque | Same as above |
| **High-security environments** | JWE (encrypted) or opaque | Protect PII in tokens |
| **Internal microservices** | JWS | Fast local validation |

**This document focuses on JWS (signed JWTs)**, which are by far the most common in OAuth2/OIDC implementations.

---

## 3. JWT Structure (Three Parts)

A signed JWT (JWS) consists of three parts separated by dots (`.`):

```
<header>.<payload>.<signature>
```

### 3.1 Complete Example JWT

**Encoded:**
```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEifQ.eyJpc3MiOiJodHRwczovL2F1dGguZXhhbXBsZS5jb20iLCJzdWIiOiJ1c2VyXzEyMyIsImF1ZCI6Imh0dHBzOi8vYXBpLmV4YW1wbGUuY29tIiwiZXhwIjoxNzMzNDMyMDAwLCJpYXQiOjE3MzM0Mjg0MDAsInNjb3BlIjoicmVhZDptZXNzYWdlcyB3cml0ZTptZXNzYWdlcyJ9.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

**Structure breakdown:**
```
Part 1 (Header):
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEifQ

Part 2 (Payload):
eyJpc3MiOiJodHRwczovL2F1dGguZXhhbXBsZS5jb20iLCJzdWIiOiJ1c2VyXzEyMyIsImF1ZCI6Imh0dHBzOi8vYXBpLmV4YW1wbGUuY29tIiwiZXhwIjoxNzMzNDMyMDAwLCJpYXQiOjE3MzM0Mjg0MDAsInNjb3BlIjoicmVhZDptZXNzYWdlcyB3cml0ZTptZXNzYWdlcyJ9

Part 3 (Signature):
dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

### 3.2 Base64URL Encoding (RFC 7519 §7)

**Base64URL encoding** is standard base64 encoding with modifications for URL safety:

| Aspect | Standard Base64 | Base64URL |
|--------|----------------|-----------|
| **Character 62** | `+` | `-` (hyphen) |
| **Character 63** | `/` | `_` (underscore) |
| **Padding** | `=` at end | No padding (removed) |
| **URL safe?** | No (`+` and `/` are special in URLs) | Yes |

**Example encoding:**
```
Input: {"alg":"RS256","typ":"JWT"}

Standard Base64:
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9

Base64URL (no padding):
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9
(Same in this case, but padding would be removed if present)

With padding example:
Standard: eyJ0eXAiOiJKV1QifQ==
Base64URL: eyJ0eXAiOiJKV1QifQ
```

**Why base64url?**
- URL-safe (can be in query parameters, fragments)
- No special character escaping needed
- Compact representation

### 3.3 Part 1: Header (JOSE Header)

The header describes the cryptographic operations applied to the JWT.

**Decoded header example:**
```json
{
  "typ": "JWT",
  "alg": "RS256",
  "kid": "2024-12-key-1"
}
```

**Common Header Parameters:**

| Parameter | Required? | Description | Example | Spec Reference |
|-----------|-----------|-------------|---------|----------------|
| **alg** | REQUIRED | Signature algorithm | `"RS256"` | RFC 7515 §4.1.1 |
| **typ** | OPTIONAL | Token type (SHOULD be "JWT") | `"JWT"` | RFC 7519 §5.1 |
| **kid** | OPTIONAL | Key identifier | `"key-2024-01"` | RFC 7515 §4.1.4 |
| **cty** | OPTIONAL | Content type (for nested JWT) | `"JWT"` | RFC 7515 §4.1.10 |
| **jku** | OPTIONAL | JWK Set URL | `"https://..."` | RFC 7515 §4.1.2 |
| **jwk** | OPTIONAL | JSON Web Key | `{...}` | RFC 7515 §4.1.3 |
| **x5u** | OPTIONAL | X.509 URL | `"https://..."` | RFC 7515 §4.1.5 |
| **x5c** | OPTIONAL | X.509 certificate chain | `[...]` | RFC 7515 §4.1.6 |
| **x5t** | OPTIONAL | X.509 thumbprint | `"..."` | RFC 7515 §4.1.7 |

**Most Common in OAuth2/OIDC:**
```json
{
  "typ": "JWT",
  "alg": "RS256",
  "kid": "1"
}
```

**Header with all optional parameters (rare):**
```json
{
  "typ": "JWT",
  "alg": "RS256",
  "kid": "signing-key-2024",
  "jku": "https://auth.example.com/.well-known/jwks.json"
}
```

### 3.4 Part 2: Payload (Claims)

The payload contains the claims (statements about an entity and additional data).

**Decoded payload example (access token):**
```json
{
  "iss": "https://auth.example.com",
  "sub": "user_123",
  "aud": "https://api.example.com",
  "exp": 1733432000,
  "iat": 1733428400,
  "scope": "read:messages write:messages",
  "client_id": "client_abc123"
}
```

**Decoded payload example (ID token):**
```json
{
  "iss": "https://auth.example.com",
  "sub": "user_123",
  "aud": "client_abc123",
  "exp": 1733432000,
  "iat": 1733428400,
  "nonce": "n-0S6_WzA2Mj",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "email_verified": true
}
```

**See §4 for complete claims documentation.**

### 3.5 Part 3: Signature

The signature ensures the JWT hasn't been tampered with.

**Signature Calculation (RFC 7515 §5.1):**
```
1. Create signing input:
   signing_input = base64url(header) + "." + base64url(payload)

2. Sign the input:
   signature = sign(signing_input, private_key, algorithm)

3. Base64URL encode signature:
   signature_encoded = base64url(signature)
```

**Example signing input:**
```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2F1dGguZXhhbXBsZS5jb20iLCJzdWIiOiJ1c2VyXzEyMyJ9
```

**Signature algorithms:** See §6 for complete algorithm documentation.

**Signature verification:**
```
1. Extract header, payload, signature from JWT
2. Recreate signing input: base64url(header) + "." + base64url(payload)
3. Verify signature matches per algorithm
4. If valid: Trust the payload
5. If invalid: Reject the JWT
```

### 3.6 Complete JWT Anatomy

```
┌────────────────────────────────────────────────────────────────┐
│ Complete JWT                                                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEifQ         │
│  │                                                             │
│  │ Header (base64url encoded)                                 │
│  │ Decoded: {"alg":"RS256","typ":"JWT","kid":"1"}            │
│  │                                                             │
│  │                                                             │
│  .────────────────────────────────────────                    │
│  │                                                             │
│  │                                                             │
│  eyJpc3MiOiJodHRwczovL2F1dGguZXhhbXBsZS5jb20iLCJzdWIiOi...   │
│  │                                                             │
│  │ Payload (base64url encoded)                                │
│  │ Decoded: {"iss":"https://auth.example.com","sub":"user_... │
│  │                                                             │
│  │                                                             │
│  .────────────────────────────────────────                    │
│  │                                                             │
│  │                                                             │
│  dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk                  │
│  │                                                             │
│  │ Signature (base64url encoded)                              │
│  │ Cryptographic signature of header + payload                │
│  │                                                             │
└────────────────────────────────────────────────────────────────┘

Verification Process:
  1. Split JWT on dots → 3 parts
  2. Decode header → Extract alg, kid
  3. Fetch verification key (public key if asymmetric)
  4. Verify: sign(header + "." + payload) == signature
  5. If valid: Trust payload, extract claims
  6. If invalid: Reject JWT
```

---

## 4. JWT Claims (RFC 7519 §4)

Claims are statements about an entity (typically the user) and additional metadata.

### 4.1 Registered Claims (RFC 7519 §4.1)

Registered claims are predefined claims with standardized meanings.

| Claim | Name | Type | Description | Required? | Spec Reference |
|-------|------|------|-------------|-----------|----------------|
| **iss** | Issuer | String | Who issued the JWT | RECOMMENDED | RFC 7519 §4.1.1 |
| **sub** | Subject | String | Who the JWT is about | RECOMMENDED | RFC 7519 §4.1.2 |
| **aud** | Audience | String or Array | Who the JWT is for | RECOMMENDED | RFC 7519 §4.1.3 |
| **exp** | Expiration Time | NumericDate | When JWT expires | RECOMMENDED | RFC 7519 §4.1.4 |
| **nbf** | Not Before | NumericDate | When JWT becomes valid | OPTIONAL | RFC 7519 §4.1.5 |
| **iat** | Issued At | NumericDate | When JWT was issued | OPTIONAL | RFC 7519 §4.1.6 |
| **jti** | JWT ID | String | Unique identifier for JWT | OPTIONAL | RFC 7519 §4.1.7 |

#### 4.1.1 iss (Issuer)

**Purpose:** Identifies the principal that issued the JWT.

**Format:** String (typically a URL with https scheme)

**Examples:**
```json
"iss": "https://auth.example.com"
"iss": "https://accounts.google.com"
"iss": "https://login.microsoftonline.com/tenant-id/v2.0"
```

**Validation:**
- MUST be case-sensitive string comparison
- SHOULD be URL with https scheme
- Client/validator MUST verify matches expected issuer

#### 4.1.2 sub (Subject)

**Purpose:** Identifies the principal that is the subject of the JWT.

**Format:** String (case-sensitive, opaque to applications)

**Examples:**
```json
"sub": "user_123"
"sub": "248289761001"
"sub": "alice@corp.example.com"
```

**Requirements (RFC 7519 §4.1.2):**
- MUST be unique within issuer's scope
- MUST be persistent (never reassigned)
- Maximum 255 ASCII characters
- SHOULD be opaque (don't assume format)

**Privacy Note:** Different clients MAY receive different `sub` values for the same user (pairwise identifiers in OIDC).

#### 4.1.3 aud (Audience)

**Purpose:** Identifies the recipients that the JWT is intended for.

**Format:** String (single audience) or Array of Strings (multiple audiences)

**Examples:**
```json
Single audience:
"aud": "https://api.example.com"

Multiple audiences:
"aud": ["https://api.example.com", "https://api2.example.com"]
```

**Validation (RFC 7519 §4.1.3):**
- If string: MUST equal expected audience
- If array: MUST contain expected audience
- Validator MUST reject if its identifier not present

#### 4.1.4 exp (Expiration Time)

**Purpose:** Identifies the expiration time on or after which the JWT MUST NOT be accepted.

**Format:** NumericDate (seconds since Unix epoch)

**Examples:**
```json
"exp": 1733432000    // 2025-12-05T11:00:00Z
"exp": 1733432000.5  // With fractional seconds (rare)
```

**Validation (RFC 7519 §4.1.4):**
- Current time MUST be before exp
- Implementers MAY provide for clock skew (typically ±5 minutes)
- If exp validation fails: REJECT token

**Calculation:**
```javascript
const now = Math.floor(Date.now() / 1000);  // Current time in seconds
const lifetime = 3600;  // 1 hour
const exp = now + lifetime;  // Token expires in 1 hour
```

#### 4.1.5 nbf (Not Before)

**Purpose:** Identifies the time before which the JWT MUST NOT be accepted.

**Format:** NumericDate

**Examples:**
```json
"nbf": 1733428400    // Token valid from 2025-12-05T10:00:00Z
```

**Use cases:**
- Delayed token activation
- Time-based access control
- Token issued for future use

**Validation:**
- Current time MUST be on or after nbf
- MAY provide for clock skew

#### 4.1.6 iat (Issued At)

**Purpose:** Identifies the time at which the JWT was issued.

**Format:** NumericDate

**Examples:**
```json
"iat": 1733428400    // Token issued at 2025-12-05T10:00:00Z
```

**Use cases:**
- Determine token age
- Reject tokens that are "too old"
- Audit logging

#### 4.1.7 jti (JWT ID)

**Purpose:** Provides a unique identifier for the JWT.

**Format:** String (case-sensitive, unique)

**Examples:**
```json
"jti": "550e8400-e29b-41d4-a716-446655440000"
"jti": "jwt_a1b2c3d4e5f6"
```

**Use cases:**
- Prevent replay attacks (track jti values)
- One-time use tokens
- Token revocation (blocklist by jti)

**Requirements:**
- MUST be unique (collision probability negligible)
- Typically UUID or random string

### 4.2 NumericDate Format (RFC 7519 §2)

**Definition:** Number of seconds from 1970-01-01T00:00:00Z UTC until the specified UTC date/time, ignoring leap seconds.

**Format:** Integer or decimal number

**Examples:**
```json
"exp": 1733432000         // Integer (common)
"exp": 1733432000.123     // With fractional seconds (rare)
```

**Conversion:**

```javascript
// JavaScript: Date to NumericDate
const numericDate = Math.floor(Date.now() / 1000);

// JavaScript: NumericDate to Date
const date = new Date(numericDate * 1000);

// Python
import time
numeric_date = int(time.time())

// Java
long numericDate = System.currentTimeMillis() / 1000;
```

**Example timestamps:**
```
1733428400 = 2025-12-05T10:00:00Z
1733432000 = 2025-12-05T11:00:00Z
1735776000 = 2025-01-02T00:00:00Z
```

### 4.3 Public Claims (RFC 7519 §4.2)

**Definition:** Claims defined by those using JWTs, registered in IANA registry or using collision-resistant names.

**Naming Requirements:**
- Use URI format OR
- Register in IANA JWT Claims Registry

**Examples:**
```json
"http://example.com/claims/department": "Engineering"
"https://example.com/claims/employee_level": 5
"custom:organization_id": "org_12345"
```

**OIDC Standard Public Claims (registered in IANA):**
```json
"name": "Jane Doe"
"email": "jane@example.com"
"email_verified": true
"picture": "https://example.com/jane.jpg"
```

### 4.4 Private Claims (RFC 7519 §4.3)

**Definition:** Custom claims agreed upon between parties.

**No collision protection:** Parties must coordinate to avoid conflicts.

**Examples:**
```json
"employee_id": "EMP-12345"
"role": "admin"
"permissions": ["read:data", "write:data"]
"department": "Engineering"
"organization_id": "org_12345"
"subscription_level": "premium"
```

**Best Practices:**
- Use clear, descriptive names
- Document custom claims
- Avoid conflicts with registered claims
- Consider using namespaced names

### 4.5 Complete Claims Example

**Access Token:**
```json
{
  "iss": "https://auth.example.com",        // Registered
  "sub": "user_123",                        // Registered
  "aud": "https://api.example.com",         // Registered
  "exp": 1733432000,                        // Registered
  "iat": 1733428400,                        // Registered
  "nbf": 1733428400,                        // Registered
  "jti": "550e8400-e29b-41d4-a716",         // Registered
  "scope": "read:messages write:messages",  // OAuth2 claim
  "client_id": "client_abc123",             // OAuth2 claim
  "role": "user",                           // Private claim
  "permissions": ["read", "write"],         // Private claim
  "organization_id": "org_12345"            // Private claim
}
```

---

## 5. Common JWT Claim Examples

### 5.1 OAuth2 Access Token Claims

**Typical access token payload:**
```json
{
  "iss": "https://auth.example.com",
  "sub": "user_123",
  "aud": "https://api.example.com",
  "exp": 1733432000,
  "iat": 1733428400,
  "scope": "read:messages write:messages delete:messages",
  "client_id": "client_abc123"
}
```

**With custom claims:**
```json
{
  "iss": "https://auth.example.com",
  "sub": "user_123",
  "aud": "https://api.example.com",
  "exp": 1733432000,
  "iat": 1733428400,
  "scope": "read:messages write:messages",
  "client_id": "client_abc123",
  "roles": ["user", "moderator"],
  "permissions": ["messages:read", "messages:write", "users:read"],
  "organization_id": "org_12345",
  "tenant_id": "tenant_abc",
  "subscription_tier": "premium"
}
```

### 5.2 OIDC ID Token Claims

**Basic ID token:**
```json
{
  "iss": "https://auth.example.com",
  "sub": "user_123",
  "aud": "client_abc123",
  "exp": 1733432000,
  "iat": 1733428400,
  "nonce": "n-0S6_WzA2Mj",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "email_verified": true
}
```

**Extended ID token:**
```json
{
  "iss": "https://auth.example.com",
  "sub": "user_123",
  "aud": "client_abc123",
  "exp": 1733432000,
  "iat": 1733428400,
  "auth_time": 1733428390,
  "nonce": "n-0S6_WzA2Mj",
  "acr": "urn:mace:incommon:iap:silver",
  "amr": ["pwd", "mfa"],
  "at_hash": "LDktKdoQak3Pk0cnXxPA2Q",
  "name": "Jane Doe",
  "given_name": "Jane",
  "family_name": "Doe",
  "email": "jane@example.com",
  "email_verified": true,
  "picture": "https://example.com/jane.jpg"
}
```

**See:** `id-tokens-oidc.md` for complete ID token claim documentation.

### 5.3 Custom Application Claims

**E-commerce application:**
```json
{
  "iss": "https://auth.shop.com",
  "sub": "user_123",
  "aud": "https://api.shop.com",
  "exp": 1733432000,
  "iat": 1733428400,
  "customer_id": "CUST-12345",
  "loyalty_tier": "gold",
  "loyalty_points": 15000,
  "preferred_currency": "USD",
  "preferred_language": "en-US",
  "cart_id": "cart_abc123"
}
```

**Enterprise application:**
```json
{
  "iss": "https://auth.corp.com",
  "sub": "user_123",
  "aud": "https://api.corp.com",
  "exp": 1733432000,
  "iat": 1733428400,
  "employee_id": "EMP-12345",
  "department": "Engineering",
  "cost_center": "CC-1000",
  "manager_id": "EMP-67890",
  "clearance_level": "confidential",
  "groups": ["engineers", "team-backend", "oncall"],
  "entitlements": ["vpn", "aws", "github", "jira"]
}
```

### 5.4 Microservices Token

**Service-to-service JWT:**
```json
{
  "iss": "https://auth.internal.com",
  "sub": "service:payment-service",
  "aud": "service:order-service",
  "exp": 1733432000,
  "iat": 1733428400,
  "jti": "550e8400-e29b-41d4-a716",
  "service_id": "payment-service-prod-1",
  "deployment_env": "production",
  "region": "us-west-2",
  "permissions": [
    "orders:read",
    "orders:update_payment_status",
    "customers:read"
  ]
}
```

---

## 6. Signature Algorithms (RFC 7518 §3)

Signature algorithms determine how JWTs are signed and verified.

### 6.1 Algorithm Categories

| Category | Description | Key Type | Use Case |
|----------|-------------|----------|----------|
| **Symmetric (HMAC)** | Same secret for signing and verification | Shared secret | Internal services, testing |
| **Asymmetric (RSA)** | Private key signs, public key verifies | RSA key pair | Authorization servers, most common |
| **Asymmetric (ECDSA)** | Private key signs, public key verifies | EC key pair | Modern implementations, mobile |
| **None** | No signature | N/A | ⚠️ FORBIDDEN in security contexts |

### 6.2 Symmetric Algorithms (HMAC - RFC 7518 §3.2)

**HMAC (Hash-based Message Authentication Code)** uses a shared secret.

| Algorithm | Description | Key Length | Output Length | Security |
|-----------|-------------|------------|---------------|----------|
| **HS256** | HMAC with SHA-256 | ≥256 bits | 256 bits | Good |
| **HS384** | HMAC with SHA-384 | ≥384 bits | 384 bits | Better |
| **HS512** | HMAC with SHA-512 | ≥512 bits | 512 bits | Best |

**Signing:**
```
signature = HMAC-SHA256(
  base64url(header) + "." + base64url(payload),
  shared_secret
)
```

**Verification:**
```
computed_signature = HMAC-SHA256(
  base64url(header) + "." + base64url(payload),
  shared_secret
)

if computed_signature == received_signature:
    token is valid
else:
    token is invalid
```

**Advantages:**
- Fast (symmetric crypto)
- Simple implementation
- Small signatures

**Disadvantages:**
- Both parties have secret (security risk)
- Cannot distribute public verification key
- Key management complex

**Use Cases:**
```
✅ Good for:
  - Internal microservices (shared secret)
  - Development/testing
  - Client-server where server issues and validates

❌ NOT good for:
  - Multiple validators (shared secret exposure)
  - Public clients
  - Distributed systems with many services
```

### 6.3 Asymmetric Algorithms - RSA (RFC 7518 §3.3)

**RSA (Rivest-Shamir-Adleman)** with PKCS#1 v1.5 padding.

| Algorithm | Description | Key Length | Signature Length | Security |
|-----------|-------------|------------|------------------|----------|
| **RS256** | RSASSA-PKCS1-v1_5 with SHA-256 | ≥2048 bits | 256 bytes | Good (most common) |
| **RS384** | RSASSA-PKCS1-v1_5 with SHA-384 | ≥2048 bits | 384 bytes | Better |
| **RS512** | RSASSA-PKCS1-v1_5 with SHA-512 | ≥2048 bits | 512 bytes | Best |

**Signing:**
```
signature = RSA_SIGN(
  SHA256(base64url(header) + "." + base64url(payload)),
  private_key
)
```

**Verification:**
```
is_valid = RSA_VERIFY(
  base64url(header) + "." + base64url(payload),
  signature,
  public_key
)
```

**Key Characteristics:**
- Key size: 2048 bits (minimum), 4096 bits (recommended for long-term)
- Widely supported
- Mature, well-tested

**Advantages:**
- Widely supported (all platforms)
- Public key can be distributed freely
- Well-understood security properties
- Multiple verifiers with single public key

**Disadvantages:**
- Larger signatures than ECDSA
- Slower than ECDSA
- Larger keys than ECDSA

**Use Cases:**
```
✅ Best for:
  - OAuth2 Authorization Servers
  - OIDC ID tokens
  - Access tokens validated by multiple resource servers
  - Maximum compatibility needed

❌ Consider alternatives for:
  - Mobile applications (ECDSA is more efficient)
  - High-performance requirements (ECDSA is faster)
```

### 6.4 Asymmetric Algorithms - ECDSA (RFC 7518 §3.4)

**ECDSA (Elliptic Curve Digital Signature Algorithm)** with P-256, P-384, or P-521 curves.

| Algorithm | Description | Curve | Key Length | Signature Length | Security |
|-----------|-------------|-------|------------|------------------|----------|
| **ES256** | ECDSA with P-256 and SHA-256 | P-256 | 256 bits | 64 bytes | Good |
| **ES384** | ECDSA with P-384 and SHA-384 | P-384 | 384 bits | 96 bytes | Better |
| **ES512** | ECDSA with P-521 and SHA-512 | P-521 | 521 bits | 132 bytes | Best |

**Signing:**
```
signature = ECDSA_SIGN(
  SHA256(base64url(header) + "." + base64url(payload)),
  ec_private_key
)
```

**Verification:**
```
is_valid = ECDSA_VERIFY(
  base64url(header) + "." + base64url(payload),
  signature,
  ec_public_key
)
```

**Advantages:**
- Smaller keys than RSA (256-bit EC ≈ 3072-bit RSA)
- Smaller signatures than RSA
- Faster signing and verification than RSA
- Modern, efficient

**Disadvantages:**
- Less widely supported than RSA (but growing)
- More complex implementation
- Signature format includes R and S components (requires care)

**Use Cases:**
```
✅ Best for:
  - Modern applications
  - Mobile applications (smaller keys, faster)
  - IoT devices (efficient)
  - High-performance systems

❌ Avoid if:
  - Legacy system compatibility required
  - Implementation complexity is a concern
```

### 6.5 Algorithm Comparison Table

| Algorithm | Type | Key Size | Sig Size | Speed | Compatibility | Recommendation |
|-----------|------|----------|----------|-------|---------------|----------------|
| **HS256** | Symmetric | 256 bits | 32 bytes | Fast | Excellent | Internal only |
| **RS256** | Asymmetric | 2048 bits | 256 bytes | Moderate | Excellent | Default choice |
| **RS512** | Asymmetric | 2048 bits | 512 bytes | Moderate | Excellent | High security |
| **ES256** | Asymmetric | 256 bits | 64 bytes | Fast | Good | Modern apps |
| **ES512** | Asymmetric | 521 bits | 132 bytes | Fast | Good | Modern apps |
| **none** | None | N/A | 0 bytes | Fastest | N/A | ⚠️ FORBIDDEN |

### 6.6 alg=none (RFC 7518 §3.6)

**CRITICAL SECURITY WARNING:** The "none" algorithm represents an unsecured JWT with no signature.

**Format:**
```
eyJhbGciOiJub25lIn0.eyJzdWIiOiJ1c2VyXzEyMyJ9.
                                              ↑
                                              Empty signature
```

**Header:**
```json
{
  "alg": "none"
}
```

**Use cases:**
- Testing only (non-production)
- Contexts where cryptographic protection already provided
- MUST NOT be used in security-sensitive contexts

**Security Requirements:**
- Validators MUST reject `alg=none` in production
- Libraries SHOULD reject by default
- Explicit opt-in required if needed

**Common Vulnerability:**
```
Attacker creates JWT with alg=none:
  Header: {"alg":"none"}
  Payload: {"sub":"admin","role":"admin"}
  Signature: (empty)

Vulnerable validator:
  if header.alg == "none":
      skip signature verification  # ← CRITICAL VULNERABILITY
      trust payload

Result: Attacker authenticated as admin with no signature
```

**Mitigation:**
```
✅ CORRECT:
if header.alg == "none":
    reject("alg=none forbidden in security contexts")

❌ WRONG:
if header.alg == "none":
    # Skip verification - DANGEROUS
    return payload
```

---

## 7. JWT Validation Algorithm (RFC 7519 §7.2)

Proper JWT validation is critical for security. Skipping any step is a vulnerability.

### 7.1 Complete Validation Algorithm

```
FUNCTION validate_jwt(jwt_string, expected_issuer, expected_audience, expected_algorithm):
    
    # ════════════════════════════════════════════════════════════
    # STEP 1: Parse JWT Structure (RFC 7519 §7.2 step 1)
    # ════════════════════════════════════════════════════════════
    
    parts = split(jwt_string, ".")
    IF length(parts) != 3:
        RETURN error("Malformed JWT: must have exactly 3 parts")
    
    header_encoded = parts[0]
    payload_encoded = parts[1]
    signature_encoded = parts[2]
    
    # ════════════════════════════════════════════════════════════
    # STEP 2: Decode Header (RFC 7515 §5.2 step 1)
    # ════════════════════════════════════════════════════════════
    
    TRY:
        header_json = base64url_decode(header_encoded)
        header = parse_json(header_json)
    CATCH:
        RETURN error("Failed to decode/parse header")
    
    # Extract algorithm
    alg = header.alg
    kid = header.kid  # May be null
    
    # ════════════════════════════════════════════════════════════
    # STEP 3: Validate Algorithm (CRITICAL)
    # ════════════════════════════════════════════════════════════
    
    # CRITICAL: Reject alg=none
    IF alg == "none":
        RETURN error("alg=none forbidden in security contexts")
    
    # CRITICAL: Validate algorithm matches expected
    IF alg != expected_algorithm:
        RETURN error("Algorithm mismatch: expected " + expected_algorithm + 
                     ", got " + alg)
    
    # Additional check: Prevent algorithm confusion
    IF expected_algorithm IN ["RS256", "RS384", "RS512"]:
        # Expecting RSA, reject HMAC
        IF alg IN ["HS256", "HS384", "HS512"]:
            RETURN error("Algorithm confusion attempt detected")
    
    # ════════════════════════════════════════════════════════════
    # STEP 4: Obtain Verification Key
    # ════════════════════════════════════════════════════════════
    
    IF alg IN ["HS256", "HS384", "HS512"]:
        # Symmetric algorithm - use shared secret
        verification_key = get_shared_secret()
    ELSE IF alg IN ["RS256", "RS384", "RS512", "ES256", "ES384", "ES512"]:
        # Asymmetric algorithm - fetch public key from JWKS
        jwks = fetch_jwks(expected_issuer)
        verification_key = find_key_in_jwks(jwks, kid, alg)
        
        IF verification_key is NULL:
            RETURN error("Cannot find key with kid=" + kid + " and alg=" + alg)
    ELSE:
        RETURN error("Unsupported algorithm: " + alg)
    
    # ════════════════════════════════════════════════════════════
    # STEP 5: Verify Signature (RFC 7515 §5.2)
    # ════════════════════════════════════════════════════════════
    
    signing_input = header_encoded + "." + payload_encoded
    signature = base64url_decode(signature_encoded)
    
    is_valid_signature = verify_signature(
        algorithm=alg,
        signing_input=signing_input,
        signature=signature,
        key=verification_key
    )
    
    IF NOT is_valid_signature:
        RETURN error("Invalid signature")
    
    # ════════════════════════════════════════════════════════════
    # STEP 6: Decode Payload (RFC 7519 §7.2 step 2)
    # ════════════════════════════════════════════════════════════
    
    TRY:
        payload_json = base64url_decode(payload_encoded)
        payload = parse_json(payload_json)
    CATCH:
        RETURN error("Failed to decode/parse payload")
    
    # ════════════════════════════════════════════════════════════
    # STEP 7: Validate Expiration (exp) (RFC 7519 §4.1.4)
    # ════════════════════════════════════════════════════════════
    
    IF payload.exp exists:
        current_time = unix_timestamp_now()
        clock_skew = 300  # 5 minutes
        
        IF current_time > (payload.exp + clock_skew):
            RETURN error("JWT expired")
    
    # ════════════════════════════════════════════════════════════
    # STEP 8: Validate Not Before (nbf) (RFC 7519 §4.1.5)
    # ════════════════════════════════════════════════════════════
    
    IF payload.nbf exists:
        current_time = unix_timestamp_now()
        clock_skew = 300  # 5 minutes
        
        IF current_time < (payload.nbf - clock_skew):
            RETURN error("JWT not yet valid")
    
    # ════════════════════════════════════════════════════════════
    # STEP 9: Validate Issuer (iss) (RFC 7519 §4.1.1)
    # ════════════════════════════════════════════════════════════
    
    IF payload.iss exists AND expected_issuer is not NULL:
        IF payload.iss != expected_issuer:
            RETURN error("Invalid issuer: expected " + expected_issuer + 
                         ", got " + payload.iss)
    
    # ════════════════════════════════════════════════════════════
    # STEP 10: Validate Audience (aud) (RFC 7519 §4.1.3)
    # ════════════════════════════════════════════════════════════
    
    IF payload.aud exists AND expected_audience is not NULL:
        IF payload.aud is String:
            IF payload.aud != expected_audience:
                RETURN error("Invalid audience")
        ELSE IF payload.aud is Array:
            IF expected_audience NOT IN payload.aud:
                RETURN error("Expected audience not in aud array")
        ELSE:
            RETURN error("Invalid aud claim format")
    
    # ════════════════════════════════════════════════════════════
    # STEP 11: Validate Application-Specific Claims
    # ════════════════════════════════════════════════════════════
    
    # Validate scope, client_id, custom claims, etc.
    # (Implementation-specific)
    
    # ════════════════════════════════════════════════════════════
    # All Validations Passed
    # ════════════════════════════════════════════════════════════
    
    RETURN {
        valid: true,
        header: header,
        payload: payload
    }
```

### 7.2 Validation Decision Flowchart

```
                    Start: Receive JWT
                           │
                           ▼
                 ┌──────────────────┐
                 │ Split on dots    │
                 │ Exactly 3 parts? │
                 └────┬─────────┬───┘
                      │NO       │YES
                      ▼         ▼
              ┌───────────┐  ┌─────────────┐
              │ REJECT    │  │ Decode      │
              │ Malformed │  │ Header      │
              └───────────┘  └──────┬──────┘
                                    │
                             ┌──────▼──────┐
                             │ alg=none?   │
                             └──┬───────┬──┘
                                │YES    │NO
                                ▼       ▼
                         ┌──────────┐ ┌────────────────┐
                         │ REJECT   │ │ alg matches    │
                         │ CRITICAL │ │ expected?      │
                         └──────────┘ └────┬───────┬───┘
                                           │NO     │YES
                                           ▼       ▼
                                    ┌──────────┐ ┌───────────┐
                                    │ REJECT   │ │ Get Key   │
                                    │ alg      │ │ (JWKS)    │
                                    │ mismatch │ └─────┬─────┘
                                    └──────────┘       │
                                                       ▼
                                                ┌──────────────┐
                                                │ Verify       │
                                                │ Signature    │
                                                └────┬─────┬───┘
                                                     │FAIL │PASS
                                                     ▼     ▼
                                              ┌──────────┐ ┌─────────┐
                                              │ REJECT   │ │ Decode  │
                                              │ Invalid  │ │ Payload │
                                              │ Signature│ └────┬────┘
                                              └──────────┘      │
                                                                ▼
                                                         ┌──────────────┐
                                                         │ Validate exp │
                                                         │ (with skew)  │
                                                         └────┬─────┬───┘
                                                              │FAIL │PASS
                                                              ▼     ▼
                                                       ┌──────────┐ ┌────────┐
                                                       │ REJECT   │ │Validate│
                                                       │ Expired  │ │nbf     │
                                                       └──────────┘ └───┬────┘
                                                                        │PASS
                                                                        ▼
                                                                 ┌──────────┐
                                                                 │Validate  │
                                                                 │iss       │
                                                                 └────┬─────┘
                                                                      │PASS
                                                                      ▼
                                                               ┌──────────────┐
                                                               │Validate aud  │
                                                               └────┬─────────┘
                                                                    │PASS
                                                                    ▼
                                                             ┌──────────────┐
                                                             │ JWT VALID ✅ │
                                                             │ Trust Payload│
                                                             └──────────────┘
```

### 7.3 Common Validation Failures

| Failure Reason | Error Message | HTTP Status | Cause |
|---------------|---------------|-------------|-------|
| Malformed JWT | "JWT must have 3 parts" | 400 | Wrong format, not enough dots |
| Invalid base64 | "Failed to decode header/payload" | 400 | Corrupted encoding |
| alg=none | "alg=none forbidden" | 401 | Security bypass attempt |
| Algorithm mismatch | "Expected RS256, got HS256" | 401 | Algorithm confusion attack |
| Invalid signature | "Signature verification failed" | 401 | Tampered token or wrong key |
| Expired token | "JWT expired" | 401 | exp claim in past |
| Not yet valid | "JWT not yet valid" | 401 | nbf claim in future |
| Invalid issuer | "Invalid issuer" | 401 | iss doesn't match expected |
| Invalid audience | "Invalid audience" | 401 | aud doesn't contain expected |
| Missing key | "Cannot find key with kid=X" | 401 | Key rotation, wrong kid |

---

## 8. Clock Skew Handling (RFC 7519 §4.1.4, §4.1.5)

Distributed systems have clock differences. Clock skew handling prevents legitimate tokens from being rejected due to minor time differences.

### 8.1 The Problem

```
Authorization Server Clock:  2025-12-05T11:00:00Z
Resource Server Clock:       2025-12-05T11:00:05Z  (5 seconds ahead)

Token issued at 11:00:00, expires at 11:01:00 (1 minute lifetime)

Without clock skew handling:
  RS validates at 11:00:05 (its clock)
  exp = 11:01:00
  Current time (11:00:05) < exp (11:01:00)  ✅ Still valid

But if RS clock is 2 minutes ahead:
  RS clock: 11:02:00
  exp = 11:01:00
  Current time (11:02:00) > exp (11:01:00)  ❌ Rejected (false positive)
```

### 8.2 Clock Skew Solution

**Add leeway (tolerance) to time-based validations:**

```
Typical leeway: 300 seconds (5 minutes)

exp validation WITH clock skew:
  current_time < (exp + leeway)
  
nbf validation WITH clock skew:
  current_time >= (nbf - leeway)
```

### 8.3 Example Calculations

**Expiration (exp) with clock skew:**
```javascript
const current_time = 1733432000;  // 11:00:00
const exp = 1733431700;            // 10:55:00 (expired 5 minutes ago)
const clock_skew = 300;            // 5 minutes leeway

// Without clock skew:
if (current_time > exp) {
  // 1733432000 > 1733431700  ✅ TRUE
  // REJECT: Token expired
}

// With clock skew:
if (current_time > (exp + clock_skew)) {
  // 1733432000 > (1733431700 + 300)
  // 1733432000 > 1733432000  ❌ FALSE
  // ACCEPT: Within clock skew tolerance
}
```

**Not Before (nbf) with clock skew:**
```javascript
const current_time = 1733428000;  // 10:00:00
const nbf = 1733428200;            // 10:03:20 (valid in 3 minutes 20 seconds)
const clock_skew = 300;            // 5 minutes leeway

// Without clock skew:
if (current_time < nbf) {
  // 1733428000 < 1733428200  ✅ TRUE
  // REJECT: Token not yet valid
}

// With clock skew:
if (current_time < (nbf - clock_skew)) {
  // 1733428000 < (1733428200 - 300)
  // 1733428000 < 1733427900  ❌ FALSE
  // ACCEPT: Within clock skew tolerance
}
```

### 8.4 Clock Skew Configuration

| Leeway | Use Case | Trade-off |
|--------|----------|-----------|
| **0 seconds** | High-security, synchronized clocks | Strict, may reject valid tokens |
| **60 seconds** | Conservative | Minimal tolerance |
| **300 seconds (5 min)** | Standard (RECOMMENDED) | Good balance |
| **600 seconds (10 min)** | Lenient | More permissive, larger attack window |

**Security Trade-off:**
```
Smaller leeway:
  ✅ More secure (smaller attack window for expired tokens)
  ❌ More false rejections due to clock differences

Larger leeway:
  ✅ Fewer false rejections
  ❌ Less secure (expired tokens accepted longer)

Recommendation: 5 minutes (300 seconds) is industry standard
```

### 8.5 Implementation Example

```javascript
function validateTimeClaims(payload) {
  const now = Math.floor(Date.now() / 1000);
  const clockSkew = 300;  // 5 minutes
  
  // Validate exp (expiration)
  if (payload.exp !== undefined) {
    if (now > (payload.exp + clockSkew)) {
      throw new Error(`JWT expired (exp: ${payload.exp}, now: ${now})`);
    }
  }
  
  // Validate nbf (not before)
  if (payload.nbf !== undefined) {
    if (now < (payload.nbf - clockSkew)) {
      throw new Error(`JWT not yet valid (nbf: ${payload.nbf}, now: ${now})`);
    }
  }
  
  // Validate iat (issued at) - optional check for "too old"
  if (payload.iat !== undefined) {
    const maxAge = 86400;  // 24 hours
    if ((now - payload.iat) > maxAge) {
      throw new Error(`JWT too old (iat: ${payload.iat}, now: ${now})`);
    }
  }
}
```

---

## 9. Signature Verification Details by Algorithm

### 9.1 RS256 (RSA with SHA-256)

**Algorithm:** RSASSA-PKCS1-v1_5 using SHA-256

**Signing (Authorization Server):**
```
FUNCTION sign_jwt_rs256(header, payload, rsa_private_key):
    # 1. Create signing input
    signing_input = base64url(header) + "." + base64url(payload)
    
    # 2. Hash the signing input
    hash = SHA256(signing_input)
    
    # 3. Sign the hash with RSA private key
    signature_bytes = RSA_SIGN_PKCS1_V1_5(hash, rsa_private_key)
    
    # 4. Base64URL encode signature
    signature = base64url(signature_bytes)
    
    # 5. Create JWT
    jwt = signing_input + "." + signature
    
    RETURN jwt
```

**Verification (Resource Server):**
```
FUNCTION verify_jwt_rs256(jwt, rsa_public_key):
    # 1. Split JWT
    parts = split(jwt, ".")
    header_encoded = parts[0]
    payload_encoded = parts[1]
    signature_encoded = parts[2]
    
    # 2. Recreate signing input
    signing_input = header_encoded + "." + payload_encoded
    
    # 3. Decode signature
    signature_bytes = base64url_decode(signature_encoded)
    
    # 4. Verify signature
    is_valid = RSA_VERIFY_PKCS1_V1_5(
        message=signing_input,
        signature=signature_bytes,
        public_key=rsa_public_key
    )
    
    RETURN is_valid
```

**Library Examples:**
```javascript
// Node.js with jsonwebtoken
const jwt = require('jsonwebtoken');

// Signing
const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });

// Verification
try {
  const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
} catch(err) {
  console.error('Invalid signature');
}
```

### 9.2 ES256 (ECDSA with P-256 and SHA-256)

**Algorithm:** ECDSA using P-256 curve and SHA-256

**Signing:**
```
FUNCTION sign_jwt_es256(header, payload, ec_private_key):
    # 1. Create signing input
    signing_input = base64url(header) + "." + base64url(payload)
    
    # 2. Hash the signing input
    hash = SHA256(signing_input)
    
    # 3. Sign with ECDSA
    (r, s) = ECDSA_SIGN_P256(hash, ec_private_key)
    
    # 4. Encode signature (R || S, both 32 bytes for P-256)
    signature_bytes = r + s  # Concatenate R and S
    
    # 5. Base64URL encode
    signature = base64url(signature_bytes)
    
    # 6. Create JWT
    jwt = signing_input + "." + signature
    
    RETURN jwt
```

**Verification:**
```
FUNCTION verify_jwt_es256(jwt, ec_public_key):
    # 1. Split JWT
    parts = split(jwt, ".")
    signing_input = parts[0] + "." + parts[1]
    signature_encoded = parts[2]
    
    # 2. Decode signature
    signature_bytes = base64url_decode(signature_encoded)
    
    # 3. Extract R and S components
    r = signature_bytes[0:32]   # First 32 bytes
    s = signature_bytes[32:64]  # Second 32 bytes
    
    # 4. Hash signing input
    hash = SHA256(signing_input)
    
    # 5. Verify ECDSA signature
    is_valid = ECDSA_VERIFY_P256(
        hash=hash,
        r=r,
        s=s,
        public_key=ec_public_key
    )
    
    RETURN is_valid
```

**Key Notes:**
- P-256 signature: 64 bytes total (32 bytes R + 32 bytes S)
- P-384 signature: 96 bytes total (48 bytes R + 48 bytes S)
- P-521 signature: 132 bytes total (66 bytes R + 66 bytes S)

### 9.3 HS256 (HMAC with SHA-256)

**Algorithm:** HMAC-SHA256

**Signing:**
```
FUNCTION sign_jwt_hs256(header, payload, shared_secret):
    # 1. Create signing input
    signing_input = base64url(header) + "." + base64url(payload)
    
    # 2. Compute HMAC
    hmac = HMAC_SHA256(
        message=signing_input,
        key=shared_secret
    )
    
    # 3. Base64URL encode
    signature = base64url(hmac)
    
    # 4. Create JWT
    jwt = signing_input + "." + signature
    
    RETURN jwt
```

**Verification:**
```
FUNCTION verify_jwt_hs256(jwt, shared_secret):
    # 1. Split JWT
    parts = split(jwt, ".")
    signing_input = parts[0] + "." + parts[1]
    received_signature = parts[2]
    
    # 2. Compute expected signature
    expected_hmac = HMAC_SHA256(
        message=signing_input,
        key=shared_secret
    )
    expected_signature = base64url(expected_hmac)
    
    # 3. Compare signatures (constant-time comparison)
    is_valid = constant_time_compare(
        received_signature,
        expected_signature
    )
    
    RETURN is_valid
```

**Security Note:**
```javascript
// ❌ WRONG: Timing attack vulnerable
if (received_signature === expected_signature) {
  return true;
}

// ✅ CORRECT: Constant-time comparison
const crypto = require('crypto');
return crypto.timingSafeEqual(
  Buffer.from(received_signature),
  Buffer.from(expected_signature)
);
```

### 9.4 Algorithm Comparison

| Aspect | RS256 | ES256 | HS256 |
|--------|-------|-------|-------|
| **Key Type** | RSA (2048+ bits) | EC (256 bits) | Shared secret (256+ bits) |
| **Signature Size** | 256 bytes | 64 bytes | 32 bytes |
| **Sign Speed** | Slow | Fast | Fastest |
| **Verify Speed** | Fast | Fast | Fastest |
| **Key Distribution** | Public key OK | Public key OK | Secret (both parties) |
| **Use Case** | Most common | Modern apps | Internal services |

---

## 10. Security Threat Model for JWTs

JWTs face several well-documented security threats. Understanding these is critical for secure implementation.

### 10.1 Threat: Algorithm Confusion (RS256 to HS256)

**Attack Vector:** Attacker changes algorithm from RS256 (asymmetric) to HS256 (symmetric) and signs with public key as HMAC secret.

**CVE References:** CVE-2015-2951, CVE-2016-10555

**Attack Scenario:**
```
1. Authorization server uses RS256:
   - Signs JWTs with RSA private key
   - Publishes RSA public key in JWKS

2. Attacker downloads public key from JWKS

3. Attacker creates malicious JWT:
   - Header: {"alg":"HS256","kid":"1"}     ← Changed to HMAC
   - Payload: {"sub":"admin","role":"admin"}
   - Signature: HMAC-SHA256(header+payload, public_key_as_secret)

4. Vulnerable validator:
   - Reads alg from header: "HS256"
   - Fetches "key" for kid="1" from JWKS → Gets RSA public key
   - Uses public key as HMAC secret
   - Verifies HMAC: ✅ Valid (mathematically)
   - Trusts payload: User is "admin"
```

**Vulnerability Mode:** `FLEXIBLE_JWT_ALGORITHM`

**Demonstration (Vuln Mode Enabled):**
```
Legitimate JWT (RS256):
  Header: {"alg":"RS256","kid":"1"}
  Signed with: RSA private key
  Verified with: RSA public key from JWKS

Malicious JWT:
  Header: {"alg":"HS256","kid":"1"}        ← Changed algorithm
  Payload: {"sub":"admin","role":"admin"}   ← Malicious payload
  Signature: HMAC-SHA256(header+payload, public_key_bytes)

Vulnerable Validator with FLEXIBLE_JWT_ALGORITHM:
  1. Parse header: alg = "HS256"
  2. Fetch key for kid="1" → RSA public key
  3. Verify HMAC using public key as secret
  4. Signature valid ✅ (wrong algorithm but mathematically correct)
  5. Accept JWT, user is "admin"

Result: Attacker forges admin token ✅ (critical vulnerability!)
```

**Mitigation:**
```
✅ CORRECT: Strict algorithm whitelist per key

FUNCTION get_verification_key(header, jwks):
    kid = header.kid
    alg = header.alg
    
    # Find key in JWKS
    key = find_key_by_kid(jwks, kid)
    
    # Validate algorithm matches key type
    IF key.kty == "RSA":
        # RSA key, only allow RS* algorithms
        IF alg NOT IN ["RS256", "RS384", "RS512"]:
            RETURN error("RSA key cannot verify " + alg)
    ELSE IF key.kty == "EC":
        # EC key, only allow ES* algorithms
        IF alg NOT IN ["ES256", "ES384", "ES512"]:
            RETURN error("EC key cannot verify " + alg)
    ELSE IF key.kty == "oct":
        # Symmetric key, only allow HS* algorithms
        IF alg NOT IN ["HS256", "HS384", "HS512"]:
            RETURN error("Symmetric key cannot verify " + alg)
    
    RETURN key

Configuration:
  expected_algorithm = "RS256"  # Hardcoded or per-client config
  
  IF header.alg != expected_algorithm:
      REJECT("Algorithm mismatch")
```

**Validation:**
```
MUST whitelist specific algorithm per key type
MUST NOT dynamically accept any algorithm from header
MUST validate key type matches algorithm
```

### 10.2 Threat: None Algorithm Acceptance

**Attack Vector:** Set alg=none and remove signature.

**CVE Reference:** CVE-2015-9235

**Attack Scenario:**
```
Attacker creates "unsecured JWT":
  Header: {"alg":"none"}
  Payload: {"sub":"admin","role":"admin"}
  Signature: (empty)

JWT: eyJhbGciOiJub25lIn0.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiJ9.

Vulnerable validator:
  1. Parse header: alg = "none"
  2. Check if alg == "none": YES
  3. Skip signature verification
  4. Trust payload
  5. User is "admin"
```

**Vulnerability Mode:** `ACCEPT_NONE_ALGORITHM`

**Demonstration (Vuln Mode Enabled):**
```
Attacker's JWT:
  eyJhbGciOiJub25lIn0.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiJ9.
  
  Header: {"alg":"none"}
  Payload: {"sub":"admin","role":"admin"}
  Signature: (empty)

Validator with ACCEPT_NONE_ALGORITHM:
  1. Parse JWT: 3 parts (last part empty)
  2. Decode header: alg = "none"
  3. Signature verification: ⚠️ SKIPPED (alg=none)
  4. Decode payload: sub="admin", role="admin"
  5. Accept JWT ✅

Result: Attacker authenticated as admin with no signature ✅ (critical!)
```

**Mitigation:**
```
✅ CORRECT: Always reject alg=none

FUNCTION validate_algorithm(header):
    alg = header.alg
    
    # CRITICAL: Reject alg=none
    IF alg == "none":
        RETURN error("alg=none is forbidden in security contexts")
    
    # Continue with normal validation
    ...

Most JWT libraries reject alg=none by default (check yours!)
```

**Validation:**
```
MUST reject alg=none in security contexts
Library SHOULD reject by default (explicit opt-in if ever needed)
Never skip signature verification
```

### 10.3 Threat: Weak HMAC Secrets

**Attack Vector:** Brute force or dictionary attack on HS256/HS384/HS512 secret.

**Attack Scenario:**
```
JWT using HS256 with weak secret:
  Header: {"alg":"HS256"}
  Payload: {"sub":"user_123"}
  Secret: "password123"    ← Weak secret

Attacker:
  1. Captures JWT
  2. Attempts common secrets:
     - "password"
     - "secret"
     - "12345"
     - "password123"     ← Matches!
  3. Verifies: HMAC-SHA256(header+payload, "password123") == signature
  4. Forges new JWTs with any payload
```

**Vulnerability Mode:** `WEAK_JWT_SECRET`

**Demonstration (Vuln Mode Enabled):**
```
JWT with WEAK_JWT_SECRET="secret":
  eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyXzEyMyJ9.signature

Attacker dictionary attack:
  common_secrets = ["password", "secret", "admin", "12345"]
  
  FOR EACH secret IN common_secrets:
      computed = HMAC-SHA256(header+payload, secret)
      IF computed == jwt_signature:
          FOUND secret: "secret"
          BREAK

Attacker forges token:
  malicious_payload = {"sub":"admin","role":"admin"}
  forged_jwt = sign_hs256(header, malicious_payload, "secret")
  
Result: Attacker can forge any JWT ✅ (critical!)
```

**Mitigation:**
```
✅ Use strong secrets (256+ bits):

# Generate cryptographically random secret
secret = random_bytes(32)  # 256 bits
# Store securely (environment variable, secrets manager)

✅ OR better: Use asymmetric algorithms (RS256, ES256):
  - Public key can be distributed freely
  - Private key never leaves authorization server
  - Cannot be brute forced
```

**Secret Strength Requirements:**

| Secret Length | Security Level | Recommendation |
|--------------|----------------|----------------|
| <128 bits | Weak | ❌ Do not use |
| 128-191 bits | Marginal | ⚠️ Not recommended |
| 192-255 bits | Good | ⚠️ Minimum |
| 256+ bits | Strong | ✅ Recommended |

**Validation:**
```
MUST use cryptographically random secrets (≥256 bits)
SHOULD use asymmetric algorithms for multi-party systems
NEVER use dictionary words, common passwords, or predictable values
```

### 10.4 Threat: Token Replay

**Attack Vector:** Reuse valid JWT for unauthorized purposes.

**Attack Scenario:**
```
1. User authenticates, receives JWT:
   {"sub":"user_123","role":"user","exp":1733432000}

2. Attacker steals JWT (network sniff, XSS, logs)

3. Attacker replays JWT to access API:
   - JWT is valid (signature OK, not expired)
   - Attacker uses victim's JWT
   - Attacker accesses victim's resources

4. JWT remains valid until expiration
```

**Mitigation:**
```
1. Short expiration times (minutes, not hours/days):
   exp = now + 900  // 15 minutes

2. jti claim tracking for critical operations:
   {
     "jti": "550e8400-e29b-41d4-a716",
     "sub": "user_123",
     "operation": "transfer_funds"
   }
   
   Server tracks jti in cache/database:
   IF jti_already_used(jti):
       REJECT("Token already used")
   ELSE:
       mark_jti_as_used(jti)
       process_operation()

3. Sender-constraint tokens (DPoP, mTLS):
   - Bind token to client's key
   - Stolen token useless without private key
```

**Validation:**
```
Use short exp times (15-60 minutes typical)
Track jti for one-time tokens
Consider sender-constraint for high-value operations
```

### 10.5 Threat: Expired Token Acceptance

**Attack Vector:** Validator skips expiration check.

**Attack Scenario:**
```
JWT issued:
  {"sub":"user_123","exp":1733428400}  // Expired 1 hour ago

Current time: 1733432000

Vulnerable validator:
  1. Verify signature: ✅ Valid
  2. Check expiration: ⚠️ SKIPPED
  3. Accept token: ✅

Result: Expired token accepted
```

**Vulnerability Mode:** `SKIP_EXPIRATION_CHECK`

**Mitigation:**
```
✅ CORRECT: Always validate exp

FUNCTION validate_expiration(payload):
    IF payload.exp is NULL:
        RETURN error("exp claim required")
    
    current_time = unix_timestamp_now()
    clock_skew = 300  // 5 minutes
    
    IF current_time > (payload.exp + clock_skew):
        RETURN error("JWT expired")
    
    RETURN valid
```

**Validation:**
```
MUST validate exp claim
MUST use current time
SHOULD allow clock skew (±5 minutes)
MUST reject if expired
```

### 10.6 Threat: Wrong Audience Acceptance

**Attack Vector:** Use JWT intended for service A at service B.

**Attack Scenario:**
```
JWT for Service A:
  {
    "iss": "https://auth.example.com",
    "aud": "https://service-a.example.com",
    "sub": "user_123"
  }

Attacker uses at Service B:
  Service B expects: aud = "https://service-b.example.com"
  JWT has: aud = "https://service-a.example.com"

Vulnerable Service B:
  1. Verify signature: ✅
  2. Check aud: ⚠️ SKIPPED
  3. Accept token: ✅

Result: Token for Service A works at Service B
```

**Vulnerability Mode:** `SKIP_AUD_CHECK`

**Mitigation:**
```
✅ CORRECT: Always validate aud

FUNCTION validate_audience(payload, expected_aud):
    IF payload.aud is NULL:
        # Decide: Reject OR allow (based on policy)
        IF strict_mode:
            RETURN error("aud claim required")
    
    IF payload.aud is String:
        IF payload.aud != expected_aud:
            RETURN error("Invalid audience")
    ELSE IF payload.aud is Array:
        IF expected_aud NOT IN payload.aud:
            RETURN error("Expected audience not in aud array")
    
    RETURN valid
```

**Validation:**
```
MUST validate aud claim
MUST check against expected audience
Resource server MUST know its own identifier
```

### 10.7 Threat: Signature Verification Bypass

**Attack Vector:** Skip signature verification entirely.

**Attack Scenario:**
```
Attacker creates JWT:
  Header: {"alg":"RS256","kid":"1"}
  Payload: {"sub":"admin","role":"admin"}
  Signature: (random_bytes or omitted)

Vulnerable validator:
  1. Parse JWT: ✅
  2. Decode payload: ✅
  3. Signature verification: ⚠️ SKIPPED
  4. Trust payload: ✅

Result: Any JWT accepted regardless of signature
```

**Vulnerability Mode:** `SKIP_JWT_VERIFICATION`

**Mitigation:**
```
✅ CORRECT: ALWAYS verify signature

FUNCTION validate_jwt(jwt):
    # Parse
    parts = split(jwt, ".")
    header = decode(parts[0])
    payload = decode(parts[1])
    signature = parts[2]
    
    # CRITICAL: Always verify signature
    is_valid = verify_signature(header, payload, signature, key)
    IF NOT is_valid:
        RETURN error("Invalid signature")
    
    # Continue with claims validation
    ...
```

**Validation:**
```
MUST ALWAYS verify signature
NEVER skip verification "for testing" in production
NEVER trust payload without signature validation
```

### 10.8 Threat: Key Confusion (kid Manipulation)

**Attack Vector:** Manipulate kid header to use attacker-controlled key.

**Attack Scenario:**
```
Legitimate JWT:
  Header: {"alg":"RS256","kid":"auth-server-key-1"}
  
Attacker crafts JWT:
  Header: {"alg":"RS256","kid":"https://attacker.com/evil-key"}
  
Vulnerable validator:
  1. Read kid: "https://attacker.com/evil-key"
  2. Fetch key from kid URL: → Attacker's public key
  3. Verify signature with attacker's key: ✅ Valid
  4. Accept JWT
```

**Vulnerability Mode:** `UNRESTRICTED_KID`

**Mitigation:**
```
✅ CORRECT: Only fetch keys from trusted JWKS

FUNCTION get_verification_key(header, trusted_issuer):
    kid = header.kid
    
    # CRITICAL: Fetch JWKS from trusted issuer only
    jwks_uri = get_jwks_uri_from_discovery(trusted_issuer)
    # e.g., "https://auth.example.com/.well-known/jwks.json"
    
    # NEVER use kid as URL directly
    # NEVER fetch from arbitrary URLs
    
    jwks = fetch(jwks_uri)
    key = find_key_in_jwks(jwks, kid)
    
    IF key is NULL:
        RETURN error("Key not found in trusted JWKS")
    
    RETURN key
```

**Validation:**
```
MUST fetch keys from trusted JWKS only
MUST NOT use kid as URL
MUST NOT fetch from arbitrary locations
Whitelist JWKS endpoints
```

### 10.9 Security Threat Summary

| Threat | Attack | Vuln Mode | Mitigation | CVE |
|--------|--------|-----------|------------|-----|
| **Algorithm Confusion** | RS256→HS256, sign with public key | `FLEXIBLE_JWT_ALGORITHM` | Strict alg whitelist per key | CVE-2015-2951, CVE-2016-10555 |
| **None Algorithm** | alg=none, no signature | `ACCEPT_NONE_ALGORITHM` | Reject alg=none | CVE-2015-9235 |
| **Weak HMAC Secret** | Brute force secret | `WEAK_JWT_SECRET` | Strong secrets (256+ bits), use RS256/ES256 | — |
| **Token Replay** | Reuse valid JWT | — | Short exp, jti tracking, DPoP | — |
| **Expired Token** | Skip exp validation | `SKIP_EXPIRATION_CHECK` | Always validate exp | — |
| **Wrong Audience** | Use JWT at wrong service | `SKIP_AUD_CHECK` | Always validate aud | — |
| **Signature Bypass** | Skip verification | `SKIP_JWT_VERIFICATION` | ALWAYS verify signature | — |
| **Key Confusion** | kid points to attacker key | `UNRESTRICTED_KID` | Fetch from trusted JWKS only | — |

---

## 11. JWT vs Opaque Tokens

Choosing between JWT and opaque tokens depends on your use case.

### 11.1 Comparison Table

| Aspect | JWT | Opaque Token |
|--------|-----|--------------|
| **Format** | JSON, base64url-encoded | Random string |
| **Self-contained** | Yes (claims in token) | No (reference to server data) |
| **Validation** | Local (verify signature) | Remote (introspection endpoint) |
| **Network Dependency** | No (after fetching JWKS) | Yes (every validation) |
| **Revocation** | Difficult (wait for exp) | Easy (server-side tracking) |
| **Size** | Large (500-2000 bytes) | Small (20-100 bytes) |
| **Performance** | Signature verification overhead | Introspection call overhead |
| **Scalability** | High (stateless) | Limited (introspection endpoint) |
| **Claims Visibility** | Visible (base64-encoded) | Hidden (server-side only) |
| **Flexibility** | Fixed at issuance | Can change server-side |

### 11.2 Advantages and Disadvantages

**JWT Advantages:**
- ✅ Stateless validation (no database lookup)
- ✅ Reduced latency (no network call)
- ✅ Better scalability (distribute load)
- ✅ Can include custom claims
- ✅ Offline validation possible

**JWT Disadvantages:**
- ❌ Larger size (HTTP overhead)
- ❌ Cannot revoke before expiration
- ❌ Claims visible (privacy concern)
- ❌ Must wait for expiration to update claims
- ❌ Signature verification overhead

**Opaque Token Advantages:**
- ✅ Smaller size
- ✅ Easy instant revocation
- ✅ Claims hidden (privacy)
- ✅ Can update claims without reissue
- ✅ Simpler for clients (no JWT library needed)

**Opaque Token Disadvantages:**
- ❌ Requires introspection call (latency)
- ❌ Introspection endpoint must be highly available
- ❌ Database/cache lookup required
- ❌ Less scalable (centralized validation)

### 11.3 When to Use Each

| Use Case | Recommendation | Reasoning |
|----------|---------------|-----------|
| **High-traffic public API** | JWT | Stateless validation reduces load |
| **Internal microservices** | JWT | Offline validation, low latency |
| **Mobile applications** | JWT or Opaque | JWT for offline, opaque for revocation |
| **High-security financial API** | Opaque or sender-constrained JWT | Easy revocation critical |
| **Single resource server** | Opaque | Simpler, centralized control |
| **Many resource servers** | JWT | Distribute validation |
| **Privacy-sensitive data** | Opaque | Claims not visible in token |
| **Frequent claim updates** | Opaque | Change without reissue |
| **Long-lived sessions** | Opaque | Revocation important |
| **Short-lived sessions** | JWT | Revocation less critical |

### 11.4 Hybrid Approach

**Strategy:** Use both based on context

```
Access Token: JWT (for API calls, validated frequently)
  - Short lifetime (15-60 minutes)
  - Stateless validation
  - Distributed across many resource servers

Refresh Token: Opaque (for token renewal, used rarely)
  - Long lifetime (30-90 days)
  - Easy revocation
  - Validated by authorization server only

Benefits:
  ✅ Scalable API access (JWT)
  ✅ Revocation control (opaque refresh)
  ✅ Best of both worlds
```

---

## 12. JWT Encoding/Decoding Libraries

**WARNING:** Choose JWT libraries carefully. Some have had critical security vulnerabilities.

### 12.1 Recommended Libraries by Language

**JavaScript/Node.js:**
```javascript
// jsonwebtoken (most popular)
const jwt = require('jsonwebtoken');

// Signing
const token = jwt.sign(payload, privateKey, {
  algorithm: 'RS256',
  expiresIn: '1h'
});

// Verifying
try {
  const decoded = jwt.verify(token, publicKey, {
    algorithms: ['RS256'],  // Whitelist algorithms
    issuer: 'https://auth.example.com',
    audience: 'https://api.example.com'
  });
} catch(err) {
  console.error('Invalid JWT:', err.message);
}
```

```javascript
// jose (modern, ESM-first)
const { SignJWT, jwtVerify } = require('jose');

// Signing
const token = await new SignJWT(payload)
  .setProtectedHeader({ alg: 'RS256' })
  .setIssuedAt()
  .setExpirationTime('1h')
  .sign(privateKey);

// Verifying
const { payload } = await jwtVerify(token, publicKey, {
  algorithms: ['RS256'],
  issuer: 'https://auth.example.com'
});
```

**Python:**
```python
# PyJWT (most popular)
import jwt

# Signing
token = jwt.encode(
    payload,
    private_key,
    algorithm='RS256',
    headers={'kid': 'key-1'}
)

# Verifying
try:
    decoded = jwt.decode(
        token,
        public_key,
        algorithms=['RS256'],  # Whitelist algorithms
        issuer='https://auth.example.com',
        audience='https://api.example.com'
    )
except jwt.ExpiredSignatureError:
    print('Token expired')
except jwt.InvalidTokenError:
    print('Invalid token')
```

**Java:**
```java
// nimbus-jose-jwt (most mature)
import com.nimbusds.jwt.*;
import com.nimbusds.jose.*;

// Signing
JWTClaimsSet claims = new JWTClaimsSet.Builder()
    .subject("user_123")
    .issuer("https://auth.example.com")
    .expirationTime(new Date(System.currentTimeMillis() + 3600000))
    .build();

SignedJWT signedJWT = new SignedJWT(
    new JWSHeader.Builder(JWSAlgorithm.RS256).keyID("key-1").build(),
    claims
);
signedJWT.sign(signer);
String token = signedJWT.serialize();

// Verifying
SignedJWT jwt = SignedJWT.parse(token);
JWSVerifier verifier = new RSASSAVerifier(publicKey);
if (jwt.verify(verifier)) {
    JWTClaimsSet claims = jwt.getJWTClaimsSet();
}
```

**Go:**
```go
// golang-jwt/jwt
import "github.com/golang-jwt/jwt/v5"

// Signing
token := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims{
    "sub": "user_123",
    "exp": time.Now().Add(time.Hour).Unix(),
    "iss": "https://auth.example.com",
})
token.Header["kid"] = "key-1"
tokenString, err := token.SignedString(privateKey)

// Verifying
token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
    // Validate algorithm
    if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
        return nil, fmt.Errorf("unexpected algorithm: %v", token.Header["alg"])
    }
    return publicKey, nil
})

if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
    // Use claims
}
```

**C#/.NET:**
```csharp
// Microsoft.IdentityModel.Tokens
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;

// Signing
var tokenHandler = new JwtSecurityTokenHandler();
var tokenDescriptor = new SecurityTokenDescriptor
{
    Subject = new ClaimsIdentity(new[] {
        new Claim("sub", "user_123")
    }),
    Expires = DateTime.UtcNow.AddHours(1),
    Issuer = "https://auth.example.com",
    SigningCredentials = new SigningCredentials(
        rsaSecurityKey,
        SecurityAlgorithms.RsaSha256
    )
};
var token = tokenHandler.CreateToken(tokenDescriptor);
string tokenString = tokenHandler.WriteToken(token);

// Verifying
var validationParameters = new TokenValidationParameters
{
    ValidateIssuer = true,
    ValidIssuer = "https://auth.example.com",
    ValidateAudience = true,
    ValidAudience = "https://api.example.com",
    ValidateLifetime = true,
    IssuerSigningKey = rsaSecurityKey,
    ValidAlgorithms = new[] { SecurityAlgorithms.RsaSha256 }
};

ClaimsPrincipal principal = tokenHandler.ValidateToken(
    tokenString,
    validationParameters,
    out SecurityToken validatedToken
);
```

### 12.2 Library Security Checklist

When choosing a JWT library, verify:

| Feature | Importance | Why |
|---------|-----------|-----|
| ✅ Rejects alg=none by default | CRITICAL | Prevents signature bypass |
| ✅ Algorithm whitelist | CRITICAL | Prevents algorithm confusion |
| ✅ Validates exp by default | HIGH | Prevents expired token use |
| ✅ Validates aud/iss | HIGH | Prevents token misuse |
| ✅ Constant-time comparison (HMAC) | MEDIUM | Prevents timing attacks |
| ✅ Recent CVE-free | HIGH | Avoid known vulnerabilities |
| ✅ Active maintenance | MEDIUM | Security updates |
| ✅ Good documentation | MEDIUM | Correct usage |

### 12.3 Known Vulnerable Libraries (Historical)

**Avoid or update these:**
- `node-jsonwebtoken` < 4.2.2 (CVE-2015-9235 - alg=none bypass)
- `pyjwt` < 1.5.0 (CVE-2017-11424 - key confusion)
- `php-jwt` < 2.0.0 (various vulnerabilities)

**Always use latest stable versions.**

### 12.4 Common Library Mistakes

```javascript
❌ WRONG: Accept any algorithm
jwt.verify(token, key);  // No algorithm whitelist

✅ CORRECT: Whitelist specific algorithm
jwt.verify(token, key, { algorithms: ['RS256'] });

❌ WRONG: Skip expiration validation
jwt.verify(token, key, { ignoreExpiration: true });

✅ CORRECT: Always validate expiration
jwt.verify(token, key, { algorithms: ['RS256'] });

❌ WRONG: Trust header values
const kid = jwt.decode(token, { complete: true }).header.kid;
fetchKeyFromAnyUrl(kid);  // kid could be attacker URL

✅ CORRECT: Fetch from trusted JWKS only
const jwks = await fetch('https://auth.example.com/.well-known/jwks.json');
const key = findKeyInJwks(jwks, kid);
```

---

## 13. JWT Best Practices

### 13.1 DO

| Practice | Reasoning |
|----------|-----------|
| ✅ Use strong algorithms (RS256, ES256) | Widely supported, secure |
| ✅ Validate ALL claims (exp, nbf, iss, aud) | Comprehensive security |
| ✅ Use short expiration times | Limit damage from theft (15-60 minutes typical) |
| ✅ Whitelist expected algorithms | Prevent algorithm confusion |
| ✅ Use kid header parameter | Simplify key rotation |
| ✅ Always use HTTPS for transmission | Prevent token interception |
| ✅ Validate signature FIRST | Before trusting any claims |
| ✅ Use constant-time comparison for HMAC | Prevent timing attacks |
| ✅ Store secrets securely | Use secrets manager, env variables |
| ✅ Implement clock skew handling | Allow ±5 minutes for time drift |
| ✅ Log validation failures | Detect attack attempts |
| ✅ Use standard libraries | Avoid custom crypto |

### 13.2 DO NOT

| Practice | Why Not |
|----------|---------|
| ❌ Accept alg=none | Critical security bypass |
| ❌ Skip signature verification | Trust forged tokens |
| ❌ Store sensitive data in payload | Claims are base64-encoded, NOT encrypted |
| ❌ Use weak HMAC secrets | Brute force vulnerable |
| ❌ Trust header values without validation | Manipulation attacks |
| ❌ Use excessively long expiration times | Extend theft impact (no days/weeks) |
| ❌ Accept any algorithm dynamically | Algorithm confusion vulnerable |
| ❌ Fetch keys from arbitrary URLs | Key confusion attack |
| ❌ Log full JWTs | Contains sensitive data |
| ❌ Store JWTs in localStorage (SPAs) | XSS vulnerable |
| ❌ Use JWT for sessions requiring instant revocation | Cannot revoke before exp |
| ❌ Roll your own crypto | Use established libraries |

### 13.3 Secure JWT Workflow

```
┌────────────────────────────────────────────────────────┐
│ Secure JWT Lifecycle                                   │
├────────────────────────────────────────────────────────┤
│                                                        │
│ 1. ISSUANCE (Authorization Server)                     │
│    ✅ Use RS256 or ES256                               │
│    ✅ Include exp (15-60 minutes)                      │
│    ✅ Include iss, aud claims                          │
│    ✅ Sign with secure private key                     │
│    ✅ Add kid to header                                │
│                                                        │
│ 2. TRANSMISSION                                        │
│    ✅ Use HTTPS only                                   │
│    ✅ Send in Authorization header                     │
│    ✅ Never in URL query parameters                    │
│                                                        │
│ 3. STORAGE (Client)                                    │
│    ✅ Memory only (SPAs)                               │
│    ✅ httpOnly cookie (via BFF)                        │
│    ✅ Platform keychain (mobile)                       │
│    ❌ NEVER localStorage                               │
│                                                        │
│ 4. VALIDATION (Resource Server)                        │
│    ✅ Reject alg=none                                  │
│    ✅ Whitelist algorithm (RS256)                      │
│    ✅ Verify signature with public key                 │
│    ✅ Validate exp (with clock skew)                   │
│    ✅ Validate iss (exact match)                       │
│    ✅ Validate aud (contains expected)                 │
│    ✅ Validate custom claims (scope, etc.)             │
│                                                        │
│ 5. EXPIRATION                                          │
│    ✅ Token expires after 15-60 minutes                │
│    ✅ Client refreshes with refresh token              │
│    ✅ New JWT issued                                   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 14. Nested JWTs

Nested JWTs allow multiple layers of signing and/or encryption.

### 14.1 What is a Nested JWT?

**Definition:** A JWT whose payload is itself another JWT.

**Format:** The inner JWT becomes the payload of the outer JWT.

**Use Cases:**
- Multiple signatures (different parties)
- Sign then encrypt (confidentiality + integrity)
- Encrypt then sign (visibility + integrity)

### 14.2 Nested JWT Example

**Inner JWT (signed):**
```
Header: {"alg":"RS256","typ":"JWT"}
Payload: {"sub":"user_123","data":"sensitive"}
Signature: (signature)

Compact: eyJ0eX...inner-jwt...signature
```

**Outer JWT (encrypted):**
```
Header: {"alg":"RSA-OAEP","enc":"A256GCM","cty":"JWT"}
Encrypted Key: (encrypted)
IV: (initialization vector)
Ciphertext: (encrypted inner JWT)
Auth Tag: (authentication tag)

Compact: eyJhbG...outer-header...encrypted_key.iv.ciphertext.tag
```

### 14.3 cty (Content Type) Claim

**Purpose:** Indicates nested JWT.

**Value:** `"JWT"` when payload is a JWT

**Example header:**
```json
{
  "alg": "RSA-OAEP",
  "enc": "A256GCM",
  "cty": "JWT"          ← Indicates nested
}
```

### 14.4 Complexity Trade-off

**Advantages:**
- Multiple layers of security
- Separate concerns (sign vs encrypt)
- Different parties can sign/encrypt

**Disadvantages:**
- Complex implementation
- Larger token size
- Performance overhead
- Debugging difficulty

**Recommendation:** Avoid unless explicitly needed. Most OAuth2/OIDC implementations use simple (non-nested) JWTs.

---

## 15. Implementation Requirements Checklist

### 15.1 JWT Issuer (Authorization Server) MUST

| # | Requirement | Spec Reference |
|---|-------------|----------------|
| I1 | Use secure algorithms (RS256, ES256 recommended) | RFC 7518 §3 |
| I2 | Include exp claim with reasonable lifetime | RFC 7519 §4.1.4 |
| I3 | Include iss claim (issuer identifier) | RFC 7519 §4.1.1 |
| I4 | Include aud claim (intended audience) | RFC 7519 §4.1.3 |
| I5 | Include iat claim (issued at time) | RFC 7519 §4.1.6 |
| I6 | Sign with appropriate private/secret key | RFC 7515 §5 |
| I7 | Include kid in header for key rotation | RFC 7515 §4.1.4 |
| I8 | Publish public keys in JWKS | RFC 7517 §5 |
| I9 | Use TLS for all token issuance | RFC 6749 §1.6 |
| I10 | Set Cache-Control: no-store on token responses | RFC 6749 §5.1 |

### 15.2 JWT Validator (Resource Server, Client) MUST

| # | Requirement | Spec Reference | Vuln Mode |
|---|-------------|----------------|-----------|
| V1 | Parse JWT into header, payload, signature | RFC 7519 §7.2 | — |
| V2 | Decode base64url-encoded parts | RFC 7519 §7 | — |
| V3 | Reject alg=none | RFC 7518 §3.6 | `ACCEPT_NONE_ALGORITHM` |
| V4 | Whitelist expected algorithms | RFC 7518 §3 | `FLEXIBLE_JWT_ALGORITHM` |
| V5 | Verify signature with appropriate key | RFC 7515 §5.2 | `SKIP_JWT_VERIFICATION` |
| V6 | Validate exp (with clock skew) | RFC 7519 §4.1.4 | `SKIP_EXPIRATION_CHECK` |
| V7 | Validate nbf if present (with clock skew) | RFC 7519 §4.1.5 | — |
| V8 | Validate iss (exact string match) | RFC 7519 §4.1.1 | — |
| V9 | Validate aud (contains expected audience) | RFC 7519 §4.1.3 | `SKIP_AUD_CHECK` |
| V10 | Fetch verification keys from trusted JWKS only | RFC 7517 §5 | `UNRESTRICTED_KID` |
| V11 | Implement clock skew tolerance (±5 min typical) | RFC 7519 §4.1.4 | — |
| V12 | Validate before using any claims | RFC 7519 §7.2 | — |

### 15.3 Common Implementation Errors

| Error | Impact | Fix |
|-------|--------|-----|
| **Not validating signature** | CRITICAL - Accept forged tokens | ALWAYS verify signature |
| **Accepting alg=none** | CRITICAL - Accept unsigned tokens | Reject alg=none |
| **Algorithm confusion vulnerability** | CRITICAL - Forged tokens accepted | Strict algorithm whitelist |
| **Skipping exp validation** | HIGH - Expired tokens accepted | Always validate exp |
| **Not validating aud** | HIGH - Cross-service attacks | Always validate aud |
| **Using kid as URL** | HIGH - Key confusion attack | Fetch from trusted JWKS only |
| **Weak HMAC secrets** | CRITICAL - Brute force attack | Use strong secrets (256+ bits) or RSA/ECDSA |
| **No clock skew handling** | MEDIUM - False rejections | Allow ±5 minutes tolerance |
| **Trusting payload before validation** | CRITICAL - Trust untrusted data | Validate FIRST, use SECOND |

---

## 16. Example Scenarios

### 16.1 Creating and Signing JWT (RS256)

**Scenario:** Authorization server issues access token.

```javascript
const jwt = require('jsonwebtoken');
const fs = require('fs');

// Load private key
const privateKey = fs.readFileSync('private-key.pem');

// Create payload
const payload = {
  iss: 'https://auth.example.com',
  sub: 'user_123',
  aud: 'https://api.example.com',
  exp: Math.floor(Date.now() / 1000) + 3600,  // 1 hour
  iat: Math.floor(Date.now() / 1000),
  scope: 'read:messages write:messages'
};

// Sign JWT
const token = jwt.sign(payload, privateKey, {
  algorithm: 'RS256',
  keyid: '2024-12-key-1'
});

console.log('JWT:', token);
// eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjIwMjQtMTItay...
```

---

### 16.2 Validating JWT Signature

**Scenario:** Resource server validates access token.

```javascript
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// Configure JWKS client
const client = jwksClient({
  jwksUri: 'https://auth.example.com/.well-known/jwks.json'
});

// Get signing key
function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

// Validate JWT
jwt.verify(token, getKey, {
  algorithms: ['RS256'],              // Whitelist algorithm
  issuer: 'https://auth.example.com',
  audience: 'https://api.example.com',
  clockTolerance: 300                 // 5 minutes clock skew
}, (err, decoded) => {
  if (err) {
    console.error('JWT invalid:', err.message);
    // Return 401 Unauthorized
  } else {
    console.log('JWT valid:', decoded);
    // Grant access, use claims
  }
});
```

---

### 16.3 Expired JWT Rejection

**Scenario:** Token expired, validation fails.

```javascript
const token = createExpiredToken();  // exp in past

jwt.verify(token, publicKey, {
  algorithms: ['RS256']
}, (err, decoded) => {
  if (err) {
    if (err.name === 'TokenExpiredError') {
      console.error('JWT expired at:', err.expiredAt);
      // Return 401 with error="invalid_token"
      // Client should refresh token
    }
  }
});

// Response:
// HTTP/1.1 401 Unauthorized
// WWW-Authenticate: Bearer error="invalid_token",
//                          error_description="JWT expired"
```

---

### 16.4 Algorithm Confusion Attack Blocked

**Scenario:** Attacker attempts RS256→HS256 algorithm confusion.

```javascript
// Malicious JWT
const maliciousHeader = {
  alg: 'HS256',           // Changed from RS256
  kid: '2024-12-key-1'
};

// Secure validator
jwt.verify(maliciousToken, publicKey, {
  algorithms: ['RS256']   // ← Strict whitelist
}, (err, decoded) => {
  if (err) {
    // Error: invalid algorithm
    // JWT alg "HS256" doesn't match algorithms whitelist ["RS256"]
    console.error('Algorithm mismatch detected');
    // Return 401
  }
});

// Result: Attack blocked ✅
```

---

### 16.5 None Algorithm Attack Blocked

**Scenario:** Attacker attempts alg=none bypass.

```javascript
// Malicious JWT with alg=none
const maliciousJWT = 'eyJhbGciOiJub25lIn0.eyJzdWIiOiJhZG1pbiJ9.';

// Secure validator (default behavior in most libraries)
jwt.verify(maliciousJWT, publicKey, {
  algorithms: ['RS256']
}, (err, decoded) => {
  if (err) {
    // Error: jwt algorithm not allowed
    console.error('alg=none forbidden');
    // Return 401
  }
});

// Most libraries reject alg=none by default
// Result: Attack blocked ✅
```

---

### 16.6 Decoding JWT in Debugging Tool

**Tool Display:**
```
┌─────────────────────────────────────────────────────────────┐
│ JWT Decoder & Validator                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Paste JWT:                                                  │
│ [eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEifQ...]    │
│                                                             │
│ ═══════════════════════════════════════════════════════     │
│ HEADER                                                      │
│ ═══════════════════════════════════════════════════════     │
│ {                                                           │
│   "alg": "RS256",         ✅ Valid (RSA with SHA-256)       │
│   "typ": "JWT",                                             │
│   "kid": "2024-12-key-1"  → Key identifier                  │
│ }                                                           │
│                                                             │
│ ═══════════════════════════════════════════════════════     │
│ PAYLOAD                                                     │
│ ═══════════════════════════════════════════════════════     │
│ {                                                           │
│   "iss": "https://auth.example.com",  ✅ Issuer            │
│   "sub": "user_123",                  → User ID            │
│   "aud": "https://api.example.com",   ✅ Audience          │
│   "exp": 1733432000,                  ✅ Not expired       │
│   "iat": 1733428400,                  → Issued 1 hour ago  │
│   "scope": "read:messages write:messages"                  │
│ }                                                           │
│                                                             │
│ ═══════════════════════════════════════════════════════     │
│ SIGNATURE VERIFICATION                                      │
│ ═══════════════════════════════════════════════════════     │
│ Algorithm: RS256                                            │
│ Key Source: JWKS (https://auth.example.com/.well-known/...) │
│ Key ID: 2024-12-key-1                                       │
│ Status: ✅ VALID                                            │
│                                                             │
│ ═══════════════════════════════════════════════════════     │
│ VALIDATION RESULTS                                          │
│ ═══════════════════════════════════════════════════════     │
│ ✅ Signature valid (RS256)                                  │
│ ✅ Algorithm acceptable (not alg=none)                      │
│ ✅ Not expired (valid for 55 minutes)                       │
│ ✅ Issuer matches expected                                  │
│ ✅ Audience matches expected                                │
│ ⚠️  nbf claim not present (optional)                        │
│                                                             │
│ Result: JWT VALID ✅                                        │
│                                                             │
│ [ Copy Payload ] [ Copy Header ] [ Verify Again ]          │
└─────────────────────────────────────────────────────────────┘
```

---

### 16.7 JWKS Key Rotation Scenario

**Scenario:** Authorization server rotates signing keys.

**Initial State:**
```json
JWKS at https://auth.example.com/.well-known/jwks.json:
{
  "keys": [
    {
      "kid": "2024-11-key-1",
      "kty": "RSA",
      "use": "sig",
      "alg": "RS256",
      "n": "...",
      "e": "AQAB"
    }
  ]
}

Active signing key: 2024-11-key-1
```

**Key Rotation (new key added):**
```json
JWKS updated:
{
  "keys": [
    {
      "kid": "2024-12-key-1",  ← New key
      "kty": "RSA",
      "use": "sig",
      "alg": "RS256",
      "n": "...",
      "e": "AQAB"
    },
    {
      "kid": "2024-11-key-1",  ← Old key (still present)
      "kty": "RSA",
      "use": "sig",
      "alg": "RS256",
      "n": "...",
      "e": "AQAB"
    }
  ]
}

Active signing key: 2024-12-key-1 (new JWTs)
Old tokens: Still valid (signed with 2024-11-key-1)
```

**Resource Server Validation:**
```javascript
// Token signed with old key
const oldToken = 'eyJ...kid:2024-11-key-1...';

// Token signed with new key
const newToken = 'eyJ...kid:2024-12-key-1...';

// Both validate successfully (both keys in JWKS)
jwt.verify(oldToken, getKeyFromJWKS, ...);   // ✅ Valid
jwt.verify(newToken, getKeyFromJWKS, ...);   // ✅ Valid

// After grace period, old key removed from JWKS
// Old tokens fail validation (key not found)
```

**See:** `jwks-and-key-rotation.md` for complete key rotation specification.

---

### 16.8 Cross-Service JWT Validation with aud Claim

**Scenario:** Microservices architecture with multiple services.

**JWT issued for Service A:**
```json
{
  "iss": "https://auth.internal.com",
  "sub": "user_123",
  "aud": "service-a.internal.com",
  "exp": 1733432000,
  "scope": "read write"
}
```

**Service A validates:**
```javascript
jwt.verify(token, publicKey, {
  audience: 'service-a.internal.com'
}, (err, decoded) => {
  if (err) {
    // Error
  } else {
    // ✅ Valid (aud matches)
    processRequest(decoded);
  }
});
```

**Attacker uses at Service B:**
```javascript
// Service B expects aud="service-b.internal.com"
jwt.verify(token, publicKey, {
  audience: 'service-b.internal.com'
}, (err, decoded) => {
  if (err) {
    // Error: jwt audience invalid. expected: service-b.internal.com
    // ❌ Rejected (aud mismatch)
    return401();
  }
});

// Result: Cross-service attack blocked ✅
```

---

## Appendix A: RFC Cross-Reference Index

| Topic | RFC 7519 | RFC 7515 | RFC 7518 | Other Specs |
|-------|----------|----------|----------|-------------|
| JWT structure | §3 | — | — | — |
| Base64URL encoding | §7 | §2 | — | — |
| Header (JOSE) | — | §4 | — | — |
| Registered claims | §4.1 | — | — | — |
| exp, nbf, iat | §4.1.4-6 | — | — | — |
| Signature algorithms | — | — | §3 | — |
| RS256 | — | — | §3.3 | — |
| ES256 | — | — | §3.4 | — |
| HS256 | — | — | §3.2 | — |
| alg=none | — | — | §3.6 | — |
| Validation | §7.2 | §5.2 | — | — |
| JWKS format | — | — | — | RFC 7517 §5 |

---

## Appendix B: Vulnerability Mode Quick Reference

| Toggle | Attack Demonstrated | Spec Violation | Section |
|--------|-------------------|----------------|---------|
| `FLEXIBLE_JWT_ALGORITHM` | Algorithm confusion (RS256→HS256) | RFC 7518 §3 | §10.1 |
| `ACCEPT_NONE_ALGORITHM` | Signature bypass (alg=none) | RFC 7518 §3.6 | §10.2 |
| `WEAK_JWT_SECRET` | HMAC secret brute force | RFC 7518 §3.2 | §10.3 |
| `SKIP_EXPIRATION_CHECK` | Expired token acceptance | RFC 7519 §4.1.4 | §10.5 |
| `SKIP_AUD_CHECK` | Wrong audience acceptance | RFC 7519 §4.1.3 | §10.6 |
| `SKIP_JWT_VERIFICATION` | Complete signature bypass | RFC 7515 §5.2 | §10.7 |
| `UNRESTRICTED_KID` | Key confusion (kid manipulation) | RFC 7515 §4.1.4 | §10.8 |

---

*Document Version: 1.0.0*
*Last Updated: December 6, 2025*
*Specification References: RFC 7519, RFC 7515, RFC 7516, RFC 7517, RFC 7518*
