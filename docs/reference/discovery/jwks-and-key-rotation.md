# JWKS and Key Rotation

> "For a moment, nothing happened. Then, after a second or so, nothing continued to happen."
> 
> This is precisely what should happen during a properly executed key rotation. Users notice nothing. Tokens verify seamlessly. The old key quietly retires to a nice JSON array in the sky while the new key takes over. Any other outcome means you're about to have a very bad day involving many angry users and even angrier incident response teams.

## Document Purpose

This document provides authoritative reference for JSON Web Key Sets (RFC 7517), cryptographic key management, and key rotation strategies, targeting security professionals implementing JWKS endpoints, managing signing keys, or debugging JWT signature verification issues.

**Primary Use Cases:**
- Implementing JWKS endpoints in authorization servers
- Managing cryptographic key lifecycle and rotation
- Debugging JWT signature verification failures
- Implementing zero-downtime key rotation
- Responding to key compromise incidents
- Migrating between cryptographic algorithms

**Target Audience:** Security professionals, OAuth2/OIDC implementers, cryptographic engineers, security auditors, and developers debugging authentication issues.

## Table of Contents

1. [Overview](#overview)
2. [JSON Web Key (JWK) Structure](#json-web-key-jwk-structure)
3. [Example JWK (RSA Public Key)](#example-jwk-rsa-public-key)
4. [JWKS Structure](#jwks-structure)
5. [JWKS Endpoint](#jwks-endpoint)
6. [kid (Key ID) Parameter](#kid-key-id-parameter)
7. [Signature Verification Process](#signature-verification-process)
8. [JWKS Caching Strategy](#jwks-caching-strategy)
9. [Key Rotation Overview](#key-rotation-overview)
10. [Key Rotation Process (Zero Downtime)](#key-rotation-process-zero-downtime)
11. [Multi-Key JWKS During Rotation](#multi-key-jwks-during-rotation)
12. [Emergency Key Rotation](#emergency-key-rotation)
13. [Algorithm Migration](#algorithm-migration)
14. [Key Storage and Security](#key-storage-and-security)
15. [Key Generation Best Practices](#key-generation-best-practices)
16. [JWKS Response Headers](#jwks-response-headers)
17. [Client-Side Key Management](#client-side-key-management)
18. [Multi-Tenant JWKS](#multi-tenant-jwks)
19. [JWKS Endpoint Security](#jwks-endpoint-security)
20. [Common Implementation Errors](#common-implementation-errors)
21. [Key Compromise Detection and Response](#key-compromise-detection-and-response)
22. [JWKS in Different Deployment Scenarios](#jwks-in-different-deployment-scenarios)
23. [Testing and Validation](#testing-and-validation)
24. [Related Specifications](#related-specifications)
25. [Example Scenarios](#example-scenarios)

---

## Overview

**Purpose:** JWKS (JSON Web Key Set) provides a standardized way to publish cryptographic public keys for JWT signature verification, enabling dynamic key distribution and seamless key rotation.

**Primary Specifications:**
- RFC 7517: JSON Web Key (JWK)
- RFC 7518: JSON Web Algorithms (JWA)
- RFC 7515: JSON Web Signature (JWS)
- OpenID Connect Core §10: Key Management

**JWKS:** A JSON document containing a collection (set) of cryptographic keys. Each key is represented as a JSON Web Key (JWK).

### Why JWKS Matters

**Without JWKS:**
```python
# The dark ages: Hardcoded public keys
public_key = """-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0vx7agoebGc...
-----END PUBLIC KEY-----"""

# What happens when you need to rotate this key?
# 1. Generate new key
# 2. Update every client with new public key
# 3. Deploy all clients
# 4. Hope nothing breaks
# 5. Handle all the things that broke
```

**With JWKS:**
```python
# The enlightened present: Dynamic key discovery
jwks = fetch_jwks("https://auth.example.com/.well-known/jwks.json")
kid = jwt_header['kid']
public_key = find_key_by_kid(jwks, kid)

# Key rotation:
# 1. Add new key to JWKS
# 2. Start signing with new key
# 3. Remove old key after token expiration
# 4. No client updates needed!
```

### Key Benefits

1. **Dynamic Key Distribution:** Clients fetch keys automatically
2. **Zero-Downtime Rotation:** Multiple keys during transition
3. **Algorithm Flexibility:** Support multiple algorithms simultaneously
4. **No Client Reconfiguration:** Key changes transparent to clients
5. **Security:** Regular key rotation limits compromise impact

### Use Cases

- **ID Token Verification:** Verify OpenID Connect ID tokens
- **Access Token Verification:** Verify JWT access tokens
- **Request Object Signing:** JWT-secured authorization requests (RFC 9101)
- **Client Assertion Signing:** JWT-based client authentication
- **UserInfo Response Signing:** Signed UserInfo responses

### JWKS Flow Diagram

```
┌──────────┐                                    ┌─────────────────────┐
│  Client  │                                    │ Authorization Server│
└─────┬────┘                                    └──────────┬──────────┘
      │                                                    │
      │ 1. Fetch JWKS (once, then cache)                  │
      │───────────────────────────────────────────────────>│
      │                                                    │
      │ 2. JWKS Response                                  │
      │ {                                                  │
      │   "keys": [                                        │
      │     {                                              │
      │       "kid": "2024-01-key",                        │
      │       "kty": "RSA",                                │
      │       "use": "sig",                                │
      │       "n": "...",                                  │
      │       "e": "AQAB"                                  │
      │     }                                              │
      │   ]                                                │
      │ }                                                  │
      │<───────────────────────────────────────────────────│
      │                                                    │
      │ 3. Cache JWKS (TTL: 1 hour)                       │
      │                                                    │
      │ 4. Later: Receive JWT                             │
      │    Header: {"kid": "2024-01-key", "alg": "RS256"} │
      │                                                    │
      │ 5. Lookup key by kid in cached JWKS               │
      │                                                    │
      │ 6. Verify JWT signature with public key           │
      │                                                    │
```

---

## JSON Web Key (JWK) Structure

**Specification:** RFC 7517 - JSON Web Key (JWK)

A **JSON Web Key (JWK)** is a JSON data structure representing a cryptographic key. JWKs provide a standardized format for key representation that works with JWT-based protocols.

### Common JWK Parameters (RFC 7517 §4)

#### Core Parameters

| Parameter | Description | Required | RFC Reference |
|-----------|-------------|----------|---------------|
| `kty` | Key Type (RSA, EC, oct, OKP) | REQUIRED | RFC 7517 §4.1 |
| `use` | Public Key Use (sig, enc) | OPTIONAL | RFC 7517 §4.2 |
| `key_ops` | Key Operations array | OPTIONAL | RFC 7517 §4.3 |
| `alg` | Algorithm intended for key | OPTIONAL | RFC 7517 §4.4 |
| `kid` | Key ID (identifier) | OPTIONAL but RECOMMENDED | RFC 7517 §4.5 |

**Note:** While RFC 7517 lists `kid` as OPTIONAL, it is **effectively REQUIRED** for JWKS in practice. Without `kid`, clients cannot determine which key to use for signature verification.

#### Key Type (kty)

**Specification:** RFC 7517 §4.1

**Values:**
- `RSA`: RSA key (RFC 7518 §6.3)
- `EC`: Elliptic Curve key (RFC 7518 §6.2)
- `oct`: Octet sequence (symmetric key) (RFC 7518 §6.4)
- `OKP`: Octet string key pairs (e.g., Ed25519) (RFC 8037)

**Example:**
```json
{
  "kty": "RSA"
}
```

#### Public Key Use (use)

**Specification:** RFC 7517 §4.2

**Values:**
- `sig`: Signature verification
- `enc`: Encryption

**Example:**
```json
{
  "use": "sig"
}
```

**Note:** For JWKS in OAuth2/OIDC, `use` is typically `"sig"` since keys are used for signature verification.

#### Algorithm (alg)

**Specification:** RFC 7517 §4.4

**Purpose:** Identifies the algorithm intended for use with the key.

**Common Values:**
- `RS256`: RSASSA-PKCS1-v1_5 using SHA-256
- `RS384`: RSASSA-PKCS1-v1_5 using SHA-384
- `RS512`: RSASSA-PKCS1-v1_5 using SHA-512
- `ES256`: ECDSA using P-256 and SHA-256
- `ES384`: ECDSA using P-384 and SHA-384
- `ES512`: ECDSA using P-521 and SHA-512
- `PS256`: RSASSA-PSS using SHA-256
- `PS384`: RSASSA-PSS using SHA-384
- `PS512`: RSASSA-PSS using SHA-512
- `EdDSA`: EdDSA signature algorithms

**Example:**
```json
{
  "alg": "RS256"
}
```

#### Key ID (kid)

**Specification:** RFC 7517 §4.5

**Purpose:** Unique identifier for the key, used to match JWT header `kid` to JWKS key.

**Format:** String (arbitrary, issuer-defined)

**Common Patterns:**
- Date-based: `"2024-01-15"`, `"2024-Q1"`
- Hash-based: `"sha256-abc123..."`, `"thumbprint-xyz"`
- Sequential: `"key-1"`, `"key-2"`, `"v3"`
- Descriptive: `"prod-rsa-2024"`, `"ec-primary"`
- UUID: `"a1b2c3d4-e5f6-..."

**Example:**
```json
{
  "kid": "2024-01-rsa-key"
}
```

**Best Practice:** Use descriptive, sortable `kid` values that indicate:
- Date/version (for rotation tracking)
- Algorithm (for multi-algorithm scenarios)
- Environment (for multi-tenant deployments)

### RSA Key Parameters (kty="RSA")

**Specification:** RFC 7518 §6.3

RSA public keys are defined by two parameters:

| Parameter | Description | Required | Format |
|-----------|-------------|----------|--------|
| `n` | Modulus | REQUIRED | Base64url-encoded |
| `e` | Exponent | REQUIRED | Base64url-encoded |

**Additional Parameters:**
- `d`: Private exponent (MUST NOT be in public JWKS)
- `p`, `q`, `dp`, `dq`, `qi`: Other private parameters (MUST NOT be in public JWKS)

**Example RSA Public Key:**
```json
{
  "kty": "RSA",
  "use": "sig",
  "kid": "2024-01-rsa",
  "alg": "RS256",
  "n": "0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbIS",
  "e": "AQAB"
}
```

**Key Components:**
- `n`: The modulus (2048-4096 bits, base64url-encoded)
- `e`: The exponent (typically 65537, encoded as "AQAB")

### EC Key Parameters (kty="EC")

**Specification:** RFC 7518 §6.2

Elliptic Curve public keys are defined by:

| Parameter | Description | Required | Format |
|-----------|-------------|----------|--------|
| `crv` | Curve name | REQUIRED | String |
| `x` | X coordinate | REQUIRED | Base64url-encoded |
| `y` | Y coordinate | REQUIRED | Base64url-encoded |

**Supported Curves:**
- `P-256`: NIST P-256 (secp256r1) - Used with ES256
- `P-384`: NIST P-384 (secp384r1) - Used with ES384
- `P-521`: NIST P-521 (secp521r1) - Used with ES512

**Additional Parameters:**
- `d`: Private key (MUST NOT be in public JWKS)

**Example EC Public Key:**
```json
{
  "kty": "EC",
  "use": "sig",
  "kid": "2024-01-ec",
  "alg": "ES256",
  "crv": "P-256",
  "x": "WKn-ZIGevcwGIyyrzFoZNBdaq9_TsqzGl96oc0CWuis",
  "y": "y77t-RvAHRKTsSGdIYUfweuOvwrvDD-Q3Hv5J0fSKbE"
}
```

### Symmetric Key Parameters (kty="oct")

**Specification:** RFC 7518 §6.4

**WARNING:** Symmetric keys MUST NEVER appear in public JWKS endpoints. They are only used for shared secrets between parties.

| Parameter | Description | Required |
|-----------|-------------|----------|
| `k` | Key value | REQUIRED |

**Example (NOT for public JWKS):**
```json
{
  "kty": "oct",
  "alg": "HS256",
  "kid": "symmetric-secret",
  "k": "AyM1SysPpbyDfgZld3umj1qzKObwVMkoqQ-EstJQLr_T-1qS0gZH75aKtMN3Yj0iPS4hcgUuTwjAzZr1Z9CAow"
}
```

**Use Cases:**
- Client secret JWTs (`client_secret_jwt`)
- Shared secret scenarios
- Never in public JWKS!

### X.509 Certificate Parameters (Optional)

**Specification:** RFC 7517 §4.6, §4.7

| Parameter | Description |
|-----------|-------------|
| `x5c` | X.509 certificate chain (array of base64 certs) |
| `x5t` | X.509 certificate SHA-1 thumbprint |
| `x5t#S256` | X.509 certificate SHA-256 thumbprint |
| `x5u` | X.509 URL (reference to certificate) |

**Example with Certificate:**
```json
{
  "kty": "RSA",
  "use": "sig",
  "kid": "2024-01-rsa",
  "n": "...",
  "e": "AQAB",
  "x5c": [
    "MIIC...base64cert...",
    "MIIC...base64cert..."
  ],
  "x5t": "sha1thumbprint",
  "x5t#S256": "sha256thumbprint"
}
```

**Use Case:** When public key is derived from X.509 certificate infrastructure.

---

## Example JWK (RSA Public Key)

**Complete RSA Public Key Example:**

```json
{
  "kty": "RSA",
  "use": "sig",
  "kid": "2024-01-rsa-prod",
  "alg": "RS256",
  "n": "0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw",
  "e": "AQAB"
}
```

**Field Breakdown:**

- **kty:** `"RSA"` - This is an RSA key
- **use:** `"sig"` - Used for signature verification
- **kid:** `"2024-01-rsa-prod"` - Unique identifier (January 2024, RSA, production)
- **alg:** `"RS256"` - Intended for RS256 algorithm
- **n:** Modulus (2048-bit RSA key, base64url-encoded)
- **e:** Exponent (`"AQAB"` represents 65537 in base64url)

**Converting JWK to PEM:**

```python
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
import base64

def jwk_to_pem(jwk):
    """Convert JWK to PEM format"""
    # Decode base64url
    n_bytes = base64.urlsafe_b64decode(jwk['n'] + '==')
    e_bytes = base64.urlsafe_b64decode(jwk['e'] + '==')
    
    # Convert to integers
    n = int.from_bytes(n_bytes, 'big')
    e = int.from_bytes(e_bytes, 'big')
    
    # Create RSA public key
    public_numbers = rsa.RSAPublicNumbers(e, n)
    public_key = public_numbers.public_key()
    
    # Serialize to PEM
    pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    
    return pem

# Result:
# -----BEGIN PUBLIC KEY-----
# MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0vx7agoebGcQSuuPiLJX...
# -----END PUBLIC KEY-----
```

**Complete EC Public Key Example:**

```json
{
  "kty": "EC",
  "use": "sig",
  "kid": "2024-01-ec-prod",
  "alg": "ES256",
  "crv": "P-256",
  "x": "WKn-ZIGevcwGIyyrzFoZNBdaq9_TsqzGl96oc0CWuis",
  "y": "y77t-RvAHRKTsSGdIYUfweuOvwrvDD-Q3Hv5J0fSKbE"
}
```

**Field Breakdown:**

- **kty:** `"EC"` - Elliptic Curve key
- **use:** `"sig"` - Used for signature verification
- **kid:** `"2024-01-ec-prod"` - Unique identifier
- **alg:** `"ES256"` - Intended for ES256 algorithm
- **crv:** `"P-256"` - NIST P-256 curve
- **x:** X coordinate on the curve (base64url-encoded)
- **y:** Y coordinate on the curve (base64url-encoded)

---

## JWKS Structure

**Specification:** RFC 7517 §5 - JWK Set Format

A **JWKS (JSON Web Key Set)** is a JSON object containing a collection of JWKs.

### Structure

```json
{
  "keys": [
    // Array of JWK objects
  ]
}
```

**Required Field:**
- `keys`: JSON array of JWK objects (RFC 2119: REQUIRED)

**Specification:** The `keys` member is a JSON array of JWK values. By default, the order of the JWK values within the array does not imply an order of preference among them, although applications may choose to assign a meaning to the order for their purposes.

### Single-Key JWKS Example

```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "2024-01-rsa",
      "alg": "RS256",
      "n": "0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw",
      "e": "AQAB"
    }
  ]
}
```

### Multi-Key JWKS Example

**Why Multiple Keys?**
- Key rotation: Old and new keys coexist
- Multiple algorithms: RS256 and ES256 simultaneously
- Multiple purposes: Signing and encryption keys
- Multi-tenant: Different keys per tenant

```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "2024-01-rsa",
      "alg": "RS256",
      "n": "0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw",
      "e": "AQAB"
    },
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "2024-04-rsa",
      "alg": "RS256",
      "n": "xjlCRBqkQRZvBPhsgsncviDvZOGVcKSSQjZ55FvcGDZFq4mLPYKBdFZTQMKPNYPTQVW7GQZ86ZqJ0gYFTHRsS5Z0wKuqYxQQRJw4HWONd8vZLJMF3LNVJsNIYXe39N6sKLJ8QvZHiCWmDvWeKvyIvLRvvZJtmVTx5lLABJC6vCeNQGzRCDqFh2NZ8DqQcMkQHSbJ5SCYd5hPRRPmxLqD13c0AXYMm9KBw5G8tDVs8PJmM5RG8bYWdg2MLwKJMx8VBt3dLz4VQHcYFLWxZLdGqPMDvWhZMKZQmxJLSvDxNLwY8MqXVJYPQXxc4dFcbYSZ7vZQRYqZMQQvLQXZFvKp8w",
      "e": "AQAB"
    },
    {
      "kty": "EC",
      "use": "sig",
      "kid": "2024-01-ec",
      "alg": "ES256",
      "crv": "P-256",
      "x": "WKn-ZIGevcwGIyyrzFoZNBdaq9_TsqzGl96oc0CWuis",
      "y": "y77t-RvAHRKTsSGdIYUfweuOvwrvDD-Q3Hv5J0fSKbE"
    },
    {
      "kty": "RSA",
      "use": "enc",
      "kid": "2024-01-enc",
      "alg": "RSA-OAEP",
      "n": "sXchDaQebHnPiGvyDOAT4saGEUetSyo9MKLOoWFsueri23bOdgWp4Dy1WlUzewbgBHod5pcM9H95GQRV3JDXboIRROSBigeC5yjU1hGzHHyXss8UDprecbAYxknTcQkhslANGRUZmdTOQ5qTRsLAt6BTYuyvVRdhS8exSZEy_c4gs_7svlJJQ4H9_NxsiIoLwAEk7-Q3UXERGYw_75IDrGA84-lA_-Ct4eTlXHBIY2EaV7t7LjJaynVJCpkv4LKjTTAumiGUIuQhrNhZLuF_RJLqHpM2kgWFLU7-VTdL1VbC2tejvcI2BlMkEpk1BzBZI0KQB0GaDWFLN-aEAw3vRw",
      "e": "AQAB"
    }
  ]
}
```

**Key Purposes:**
1. **2024-01-rsa:** Current RSA signing key
2. **2024-04-rsa:** New RSA signing key (rotation in progress)
3. **2024-01-ec:** EC signing key (algorithm diversity)
4. **2024-01-enc:** Encryption key (use="enc")

### JWKS Array Characteristics

**Order:** No implied preference or order (RFC 7517 §5)
- Client should not assume first key is "primary"
- Select key by matching `kid` from JWT header

**Empty JWKS:**
```json
{
  "keys": []
}
```
**Valid but useless:** No keys available for verification.

**Large JWKS:**
- Typical: 1-5 keys
- During rotation: 2-3 keys per algorithm
- Multi-algorithm: 4-8 keys
- Very large (>20 keys): Unusual, may indicate misconfiguration

---

## JWKS Endpoint

**Specification:** OpenID Connect Core §10.1.1, OpenID Connect Discovery §4.2

### Endpoint Discovery

The JWKS endpoint URL is published in the OpenID Provider's discovery document:

```json
{
  "issuer": "https://auth.example.com",
  "jwks_uri": "https://auth.example.com/.well-known/jwks.json",
  ...
}
```

**Discovery Process:**
1. Client fetches `/.well-known/openid-configuration`
2. Extracts `jwks_uri` field
3. Fetches JWKS from `jwks_uri`

**Related Documentation:** See `well-known-configuration.md` for complete discovery specification.

### Endpoint Characteristics

**URL:** Arbitrary, typically:
- `https://auth.example.com/.well-known/jwks.json`
- `https://auth.example.com/oauth2/v1/keys`
- `https://keys.auth.example.com/jwks`

**HTTP Method:** GET (RFC 2119: REQUIRED)

**Authentication:** None (public endpoint) (RFC 2119: MUST be publicly accessible)

**Response Format:** JSON with Content-Type `application/json`

**HTTP Status:** `200 OK` for success

### Example Request

```http
GET /.well-known/jwks.json HTTP/1.1
Host: auth.example.com
Accept: application/json
```

### Example Response

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=UTF-8
Cache-Control: max-age=3600
Access-Control-Allow-Origin: *

{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "2024-01-rsa",
      "alg": "RS256",
      "n": "0vx7ago...",
      "e": "AQAB"
    }
  ]
}
```

### Error Responses

| Status | Meaning | Client Action |
|--------|---------|---------------|
| 404 | JWKS endpoint not found | Check `jwks_uri` configuration |
| 500 | Server error | Retry with exponential backoff |
| 503 | Service unavailable | Use cached JWKS if available |

### Endpoint Requirements

**Authorization Server MUST (RFC 2119):**
- Provide publicly accessible JWKS endpoint
- Use HTTPS for endpoint (production)
- Return valid JSON with `keys` array
- Include only public keys (never private keys!)
- Update JWKS when keys are added/removed

**Authorization Server SHOULD (RFC 2119):**
- Set appropriate Cache-Control headers
- Enable CORS for browser-based clients
- Implement rate limiting
- Monitor endpoint availability

---

## kid (Key ID) Parameter

**Specification:** RFC 7517 §4.5, RFC 7515 §4.1.4

The **Key ID (`kid`)** is the critical parameter that enables key selection during signature verification.

### Purpose

The `kid` parameter serves as a unique identifier to match:
- JWT header `kid` → JWKS key `kid`

**Without kid:**
```
Client receives JWT with signature
Client has JWKS with 3 keys
Which key should client use? ¯\_(ツ)_/¯
Client must try all keys (slow, error-prone)
```

**With kid:**
```
Client receives JWT: {"kid": "2024-01-rsa", "alg": "RS256"}
Client looks up kid="2024-01-rsa" in JWKS
Client finds matching key immediately
Client verifies signature with correct key
```

### kid in JWT Header

**JWT Header Example:**
```json
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "2024-01-rsa"
}
```

**Specification:** The `kid` (key ID) Header Parameter is a hint indicating which key was used to secure the JWS (RFC 7515 §4.1.4).

### kid in JWKS

**JWKS Example:**
```json
{
  "keys": [
    {
      "kid": "2024-01-rsa",
      "kty": "RSA",
      "use": "sig",
      "alg": "RS256",
      "n": "...",
      "e": "AQAB"
    },
    {
      "kid": "2024-04-rsa",
      "kty": "RSA",
      "use": "sig",
      "alg": "RS256",
      "n": "...",
      "e": "AQAB"
    }
  ]
}
```

### kid Format and Best Practices

**Format:** String (RFC 7515: case-sensitive)

**Requirements:**
- MUST be unique within JWKS
- SHOULD be stable (don't change for same key)
- SHOULD be descriptive enough for debugging

**Common Patterns:**

#### Pattern 1: Date-Based
```json
"kid": "2024-01-15"
"kid": "2024-Q1"
"kid": "2024-W03"
```
**Pros:** Clear rotation timeline, sortable
**Cons:** Reveals rotation schedule

#### Pattern 2: Hash/Thumbprint
```json
"kid": "sha256-a1b2c3d4e5f6..."
"kid": "x5t-abc123..."
```
**Pros:** Derived from key material, verifiable
**Cons:** Not human-readable

#### Pattern 3: Sequential
```json
"kid": "1"
"kid": "2"
"kid": "v3"
```
**Pros:** Simple, sortable
**Cons:** Not descriptive

#### Pattern 4: Descriptive
```json
"kid": "prod-rsa-2024-01"
"kid": "staging-ec-primary"
"kid": "tenant-123-key-v2"
```
**Pros:** Very clear purpose, easy debugging
**Cons:** More verbose

#### Pattern 5: UUID
```json
"kid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```
**Pros:** Guaranteed unique, no collision
**Cons:** Not human-readable, not sortable

**Recommendation:** Use descriptive, date-based pattern for production:
```json
"kid": "prod-rsa-2024-01"
```

### kid Collision and Uniqueness

**CRITICAL:** `kid` values MUST be unique within a JWKS.

**Bad (Collision):**
```json
{
  "keys": [
    {
      "kid": "primary-key",  // ❌ Duplicate kid
      "kty": "RSA",
      "alg": "RS256",
      "n": "...",
      "e": "AQAB"
    },
    {
      "kid": "primary-key",  // ❌ Duplicate kid
      "kty": "EC",
      "alg": "ES256",
      "crv": "P-256",
      "x": "...",
      "y": "..."
    }
  ]
}
```

**Result:** Client cannot determine which key to use.

**Good (Unique):**
```json
{
  "keys": [
    {
      "kid": "rsa-primary-2024-01",  // ✓ Unique
      "kty": "RSA",
      "alg": "RS256",
      "n": "...",
      "e": "AQAB"
    },
    {
      "kid": "ec-primary-2024-01",   // ✓ Unique
      "kty": "EC",
      "alg": "ES256",
      "crv": "P-256",
      "x": "...",
      "y": "..."
    }
  ]
}
```

### Key Selection Algorithm

**Client Algorithm:**

```python
def find_key_by_kid(jwks, target_kid):
    """
    Find JWK in JWKS by kid
    
    Args:
        jwks: JWKS document (dict with 'keys' array)
        target_kid: kid from JWT header
    
    Returns:
        JWK dict or None if not found
    """
    for jwk in jwks.get('keys', []):
        if jwk.get('kid') == target_kid:
            return jwk
    
    return None

# Usage
jwt_header = decode_jwt_header(jwt_token)
target_kid = jwt_header['kid']

jwks = fetch_jwks(jwks_uri)
jwk = find_key_by_kid(jwks, target_kid)

if jwk is None:
    # kid not found - refresh JWKS and retry
    jwks = fetch_jwks(jwks_uri, force_refresh=True)
    jwk = find_key_by_kid(jwks, target_kid)
    
    if jwk is None:
        raise KeyNotFoundError(f"Key {target_kid} not found in JWKS")

# Verify signature with found key
verify_signature(jwt_token, jwk)
```

### Missing kid in JWT

**Problem:** JWT header doesn't include `kid`.

**Client Behavior:**
1. Try all keys in JWKS (performance issue)
2. Use default key (if configured)
3. Reject JWT (safest)

**Recommendation:** Authorization servers SHOULD always include `kid` in JWT headers.

---

## Signature Verification Process

**Specification:** RFC 7515 - JSON Web Signature (JWS)

### High-Level Verification Algorithm

```
┌─────────────────────────────────────────────────────────────┐
│ JWT Signature Verification Process                          │
└─────────────────────────────────────────────────────────────┘

1. Parse JWT
   ├── Split on '.' → [header, payload, signature]
   └── Decode header (base64url)

2. Extract kid and alg from header
   ├── kid: Key identifier
   └── alg: Algorithm (RS256, ES256, etc.)

3. Fetch JWKS (from cache or HTTP)
   └── GET jwks_uri

4. Find key by kid in JWKS
   ├── Match jwk.kid == jwt_header.kid
   └── If not found → Refresh JWKS, retry once

5. Validate algorithm
   ├── Check jwk.alg == jwt_header.alg
   └── Ensure algorithm is allowed (prevent algorithm confusion)

6. Construct public key from JWK
   ├── RSA: Extract n, e → RSA public key
   └── EC: Extract crv, x, y → EC public key

7. Verify signature
   ├── Signing input: base64url(header) + '.' + base64url(payload)
   ├── Signature: base64url-decode(jwt_signature)
   └── Verify using public key and algorithm

8. Result
   ├── Valid: Signature verified successfully
   └── Invalid: Reject JWT
```

### Detailed Verification Pseudocode

```python
def verify_jwt_signature(jwt_token, jwks_uri, allowed_algorithms):
    """
    Verify JWT signature using JWKS
    
    Args:
        jwt_token: JWT string
        jwks_uri: JWKS endpoint URL
        allowed_algorithms: List of allowed algorithms
    
    Returns:
        True if signature valid
    
    Raises:
        InvalidSignatureError: Signature verification failed
        KeyNotFoundError: kid not in JWKS
        AlgorithmError: Algorithm not allowed
    """
    
    # 1. Parse JWT
    parts = jwt_token.split('.')
    if len(parts) != 3:
        raise InvalidJWTError("JWT must have 3 parts")
    
    header_b64, payload_b64, signature_b64 = parts
    
    # 2. Decode header
    header = json.loads(base64url_decode(header_b64))
    kid = header.get('kid')
    alg = header.get('alg')
    
    if not kid:
        raise MissingKidError("JWT header must include kid")
    
    if not alg:
        raise MissingAlgorithmError("JWT header must include alg")
    
    # 3. Validate algorithm is allowed
    if alg not in allowed_algorithms:
        raise AlgorithmError(f"Algorithm {alg} not allowed")
    
    # 4. Fetch JWKS (with caching)
    jwks = get_jwks_cached(jwks_uri)
    
    # 5. Find key by kid
    jwk = find_key_by_kid(jwks, kid)
    
    if jwk is None:
        # Kid not found - refresh JWKS once
        jwks = fetch_jwks(jwks_uri, force_refresh=True)
        jwk = find_key_by_kid(jwks, kid)
        
        if jwk is None:
            raise KeyNotFoundError(f"Key {kid} not found in JWKS")
    
    # 6. Validate JWK algorithm matches JWT algorithm
    if jwk.get('alg') and jwk.get('alg') != alg:
        raise AlgorithmMismatchError(
            f"JWK algorithm {jwk.get('alg')} doesn't match JWT algorithm {alg}"
        )
    
    # 7. Construct public key from JWK
    public_key = construct_public_key_from_jwk(jwk)
    
    # 8. Verify signature
    signing_input = header_b64 + '.' + payload_b64
    signature = base64url_decode(signature_b64)
    
    is_valid = verify_signature(
        signing_input=signing_input,
        signature=signature,
        public_key=public_key,
        algorithm=alg
    )
    
    if not is_valid:
        raise InvalidSignatureError("Signature verification failed")
    
    return True


def construct_public_key_from_jwk(jwk):
    """Construct cryptographic public key from JWK"""
    kty = jwk.get('kty')
    
    if kty == 'RSA':
        return construct_rsa_public_key(jwk)
    elif kty == 'EC':
        return construct_ec_public_key(jwk)
    else:
        raise UnsupportedKeyTypeError(f"Unsupported key type: {kty}")


def construct_rsa_public_key(jwk):
    """Construct RSA public key from JWK"""
    from cryptography.hazmat.primitives.asymmetric import rsa
    import base64
    
    # Decode n and e
    n_bytes = base64.urlsafe_b64decode(jwk['n'] + '==')
    e_bytes = base64.urlsafe_b64decode(jwk['e'] + '==')
    
    n = int.from_bytes(n_bytes, 'big')
    e = int.from_bytes(e_bytes, 'big')
    
    # Create RSA public key
    public_numbers = rsa.RSAPublicNumbers(e, n)
    return public_numbers.public_key()


def construct_ec_public_key(jwk):
    """Construct EC public key from JWK"""
    from cryptography.hazmat.primitives.asymmetric import ec
    import base64
    
    # Get curve
    crv = jwk['crv']
    if crv == 'P-256':
        curve = ec.SECP256R1()
    elif crv == 'P-384':
        curve = ec.SECP384R1()
    elif crv == 'P-521':
        curve = ec.SECP521R1()
    else:
        raise UnsupportedCurveError(f"Unsupported curve: {crv}")
    
    # Decode x and y
    x_bytes = base64.urlsafe_b64decode(jwk['x'] + '==')
    y_bytes = base64.urlsafe_b64decode(jwk['y'] + '==')
    
    x = int.from_bytes(x_bytes, 'big')
    y = int.from_bytes(y_bytes, 'big')
    
    # Create EC public key
    public_numbers = ec.EllipticCurvePublicNumbers(x, y, curve)
    return public_numbers.public_key()


def verify_signature(signing_input, signature, public_key, algorithm):
    """Verify signature using public key and algorithm"""
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.asymmetric import padding, ec
    from cryptography.exceptions import InvalidSignature
    
    try:
        if algorithm in ['RS256', 'RS384', 'RS512']:
            # RSASSA-PKCS1-v1_5
            hash_alg = {
                'RS256': hashes.SHA256(),
                'RS384': hashes.SHA384(),
                'RS512': hashes.SHA512()
            }[algorithm]
            
            public_key.verify(
                signature,
                signing_input.encode(),
                padding.PKCS1v15(),
                hash_alg
            )
            return True
            
        elif algorithm in ['ES256', 'ES384', 'ES512']:
            # ECDSA
            hash_alg = {
                'ES256': hashes.SHA256(),
                'ES384': hashes.SHA384(),
                'ES512': hashes.SHA512()
            }[algorithm]
            
            public_key.verify(
                signature,
                signing_input.encode(),
                ec.ECDSA(hash_alg)
            )
            return True
            
        elif algorithm in ['PS256', 'PS384', 'PS512']:
            # RSASSA-PSS
            hash_alg = {
                'PS256': hashes.SHA256(),
                'PS384': hashes.SHA384(),
                'PS512': hashes.SHA512()
            }[algorithm]
            
            public_key.verify(
                signature,
                signing_input.encode(),
                padding.PSS(
                    mgf=padding.MGF1(hash_alg),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hash_alg
            )
            return True
            
        else:
            raise UnsupportedAlgorithmError(f"Algorithm {algorithm} not supported")
            
    except InvalidSignature:
        return False
```

### Error Scenarios and Handling

#### 1. kid Not Found in JWKS

**Scenario:** JWT has `kid: "2024-04-rsa"` but JWKS only has `kid: "2024-01-rsa"`.

**Possible Causes:**
- Key recently added, JWKS cache stale
- Wrong `jwks_uri`
- Authorization server error

**Client Response:**
```python
# Try once with cache
jwk = find_key_by_kid(cached_jwks, kid)

if jwk is None:
    # Refresh JWKS and retry
    fresh_jwks = fetch_jwks(jwks_uri, force_refresh=True)
    jwk = find_key_by_kid(fresh_jwks, kid)
    
    if jwk is None:
        raise KeyNotFoundError(f"Key {kid} not found even after refresh")
```

#### 2. Algorithm Mismatch

**Scenario:** JWT header has `alg: "RS256"`, JWK has `alg: "ES256"`.

**Client Response:**
```python
if jwk.get('alg') and jwk.get('alg') != jwt_alg:
    raise AlgorithmMismatchError(
        f"JWK algorithm {jwk['alg']} doesn't match JWT {jwt_alg}"
    )
```

#### 3. Signature Invalid

**Scenario:** Signature doesn't verify (possible tampering or wrong key).

**Client Response:**
```python
try:
    verify_signature(jwt, public_key, algorithm)
except InvalidSignature:
    raise SignatureVerificationError("Signature verification failed")
```

**Do NOT:**
- Retry with different key
- Try different algorithm
- Accept JWT anyway

#### 4. JWKS Endpoint Unavailable

**Scenario:** Cannot fetch JWKS (network error, server down).

**Client Response:**
```python
try:
    jwks = fetch_jwks(jwks_uri)
except RequestException as e:
    # Use cached JWKS if available
    jwks = get_cached_jwks(jwks_uri)
    
    if jwks is None:
        raise JWKSUnavailableError(
            "JWKS endpoint unavailable and no cache available"
        )
    
    # Log warning
    logger.warning(f"JWKS fetch failed, using cache: {e}")
```

### Algorithm Confusion Attack Prevention

**Threat:** Attacker changes `alg` in JWT header to trick verifier.

**Example Attack:**
```json
// JWT signed with symmetric key HS256
{
  "alg": "RS256",  // ❌ Attacker changed to RS256
  "kid": "2024-01-rsa"
}
```

**If verifier doesn't check algorithm:**
- Uses RSA public key as HMAC secret
- Attacker can forge signatures

**Defense:**
```python
# Allowed algorithms list
ALLOWED_ALGORITHMS = ['RS256', 'ES256']

# Validate before verification
if jwt_header['alg'] not in ALLOWED_ALGORITHMS:
    raise AlgorithmNotAllowedError(f"Algorithm {jwt_header['alg']} not allowed")
```

**Best Practice:** Always specify allowed algorithms explicitly. Never allow `"none"` algorithm.

---

## JWKS Caching Strategy

**Specification:** RFC 7517 (implicit), HTTP caching standards

### Why Cache JWKS?

**Problem Without Caching:**
```
Every JWT verification:
1. Fetch JWKS from HTTP endpoint (50-200ms)
2. Parse JSON
3. Extract key
4. Verify signature

For 1000 requests/second:
- 1000 JWKS fetches per second
- Massive load on authorization server
- High latency for verification
- Unnecessary network traffic
```

**With Caching:**
```
First verification:
1. Fetch JWKS (50-200ms)
2. Cache JWKS in memory (1 hour TTL)
3. Verify signature

Subsequent verifications:
1. Read JWKS from cache (< 1ms)
2. Verify signature

Result:
- 1 JWKS fetch per hour (instead of 1000/second)
- Low latency
- Minimal load on authorization server
```

### Caching Recommendations

#### TTL (Time-To-Live)

**Recommended TTL:** 1-24 hours

**Considerations:**

| TTL | Pros | Cons | Use Case |
|-----|------|------|----------|
| 5 minutes | Fresh keys, quick rotation | High fetch frequency | High-security scenarios |
| 1 hour | Good balance | Standard | Most applications |
| 6 hours | Low traffic | Delayed key rotation | Low-traffic applications |
| 24 hours | Minimal traffic | Very delayed rotation | Cache-heavy scenarios |

**Recommendation:** Start with 1 hour, adjust based on:
- Key rotation frequency
- Token lifetime
- Traffic patterns

#### Cache-Control Headers

**Authorization Server Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: max-age=3600, public
```

**Client Behavior:**
```python
def get_cache_ttl(response):
    """Extract TTL from Cache-Control header"""
    cache_control = response.headers.get('Cache-Control', '')
    
    # Parse max-age
    for directive in cache_control.split(','):
        directive = directive.strip()
        if directive.startswith('max-age='):
            return int(directive.split('=')[1])
    
    # Default TTL if not specified
    return 3600  # 1 hour
```

#### Cache Storage Options

**Option 1: In-Memory Cache (Single Instance)**

```python
import time
from threading import Lock

class InMemoryJWKSCache:
    def __init__(self):
        self.cache = {}
        self.lock = Lock()
    
    def get(self, jwks_uri):
        """Get cached JWKS"""
        with self.lock:
            entry = self.cache.get(jwks_uri)
            
            if entry is None:
                return None
            
            # Check expiration
            if time.time() > entry['expires_at']:
                del self.cache[jwks_uri]
                return None
            
            return entry['jwks']
    
    def set(self, jwks_uri, jwks, ttl=3600):
        """Store JWKS in cache"""
        with self.lock:
            self.cache[jwks_uri] = {
                'jwks': jwks,
                'expires_at': time.time() + ttl
            }
```

**Option 2: Redis Cache (Distributed)**

```python
import redis
import json

class RedisJWKSCache:
    def __init__(self, redis_client):
        self.redis = redis_client
    
    def get(self, jwks_uri):
        """Get cached JWKS"""
        cache_key = f"jwks:{jwks_uri}"
        data = self.redis.get(cache_key)
        
        if data is None:
            return None
        
        return json.loads(data)
    
    def set(self, jwks_uri, jwks, ttl=3600):
        """Store JWKS in cache"""
        cache_key = f"jwks:{jwks_uri}"
        self.redis.setex(
            cache_key,
            ttl,
            json.dumps(jwks)
        )
```

**Option 3: Multi-Level Cache**

```python
class MultiLevelJWKSCache:
    """In-memory cache with Redis fallback"""
    
    def __init__(self, redis_client):
        self.memory_cache = InMemoryJWKSCache()
        self.redis_cache = RedisJWKSCache(redis_client)
    
    def get(self, jwks_uri):
        """Get from memory, fallback to Redis"""
        # Try memory first
        jwks = self.memory_cache.get(jwks_uri)
        if jwks:
            return jwks
        
        # Fallback to Redis
        jwks = self.redis_cache.get(jwks_uri)
        if jwks:
            # Populate memory cache
            self.memory_cache.set(jwks_uri, jwks, ttl=300)  # 5 min
            return jwks
        
        return None
    
    def set(self, jwks_uri, jwks, ttl=3600):
        """Store in both caches"""
        self.memory_cache.set(jwks_uri, jwks, ttl)
        self.redis_cache.set(jwks_uri, jwks, ttl)
```

### Complete Caching Implementation

```python
import requests
import time
from threading import Lock

class JWKSClient:
    """JWKS client with intelligent caching"""
    
    def __init__(self, jwks_uri, cache_ttl=3600):
        self.jwks_uri = jwks_uri
        self.cache_ttl = cache_ttl
        
        # Cache storage
        self.jwks = None
        self.cached_at = None
        self.lock = Lock()
        
        # Key lookup optimization
        self.key_by_kid = {}
    
    def get_jwks(self, force_refresh=False):
        """
        Get JWKS (cached or fresh)
        
        Args:
            force_refresh: Force fetch even if cached
        
        Returns:
            JWKS dict
        """
        with self.lock:
            # Check if cache valid
            if not force_refresh and self._is_cache_valid():
                return self.jwks
            
            # Fetch fresh JWKS
            try:
                self.jwks = self._fetch_jwks()
                self.cached_at = time.time()
                
                # Rebuild key index
                self._rebuild_key_index()
                
                return self.jwks
                
            except Exception as e:
                # Fetch failed - use stale cache if available
                if self.jwks is not None:
                    logger.warning(
                        f"JWKS fetch failed, using stale cache: {e}"
                    )
                    return self.jwks
                
                raise
    
    def get_key(self, kid):
        """
        Get key by kid
        
        Args:
            kid: Key ID
        
        Returns:
            JWK dict or None
        """
        # Get JWKS (from cache if valid)
        jwks = self.get_jwks()
        
        # Fast lookup by kid
        jwk = self.key_by_kid.get(kid)
        
        if jwk is None:
            # Kid not found - refresh JWKS once
            logger.info(f"Kid {kid} not found, refreshing JWKS")
            jwks = self.get_jwks(force_refresh=True)
            jwk = self.key_by_kid.get(kid)
        
        return jwk
    
    def _is_cache_valid(self):
        """Check if cache is still valid"""
        if self.jwks is None or self.cached_at is None:
            return False
        
        age = time.time() - self.cached_at
        return age < self.cache_ttl
    
    def _fetch_jwks(self):
        """Fetch JWKS from endpoint"""
        response = requests.get(
            self.jwks_uri,
            timeout=10,
            headers={'Accept': 'application/json'}
        )
        
        if response.status_code != 200:
            raise JWKSFetchError(
                f"JWKS fetch failed: HTTP {response.status_code}"
            )
        
        jwks = response.json()
        
        # Validate JWKS structure
        if 'keys' not in jwks:
            raise InvalidJWKSError("JWKS must have 'keys' array")
        
        return jwks
    
    def _rebuild_key_index(self):
        """Build kid -> JWK index for fast lookup"""
        self.key_by_kid = {}
        
        for jwk in self.jwks.get('keys', []):
            kid = jwk.get('kid')
            if kid:
                self.key_by_kid[kid] = jwk
```

### Cache Invalidation Strategies

#### 1. TTL-Based Expiration

```python
# Simplest: Just expire after TTL
if time.time() - cached_at > ttl:
    fetch_fresh_jwks()
```

#### 2. On-Verification-Failure

```python
try:
    verify_jwt(jwt, cached_jwks)
except KeyNotFoundError:
    # Kid not in cache - refresh
    fresh_jwks = fetch_jwks(force_refresh=True)
    verify_jwt(jwt, fresh_jwks)
```

#### 3. Background Refresh

```python
import threading

def background_refresh_thread(jwks_client, interval=3600):
    """Background thread to refresh JWKS"""
    while True:
        time.sleep(interval)
        try:
            jwks_client.get_jwks(force_refresh=True)
            logger.info("JWKS refreshed in background")
        except Exception as e:
            logger.error(f"Background JWKS refresh failed: {e}")

# Start background thread
thread = threading.Thread(
    target=background_refresh_thread,
    args=(jwks_client, 3600),
    daemon=True
)
thread.start()
```

### What NOT to Cache

**Never cache:**
- Error responses (404, 5xx)
- Empty JWKS (`{"keys": []}`)
- Invalid JSON

```python
def should_cache(response):
    """Determine if response should be cached"""
    if response.status_code != 200:
        return False
    
    try:
        jwks = response.json()
        if 'keys' not in jwks:
            return False
        if len(jwks['keys']) == 0:
            return False
        return True
    except:
        return False
```

---

## Key Rotation Overview

**Why Rotate Cryptographic Keys?**

Like changing passwords regularly, key rotation is a fundamental security practice.

### Security Benefits

1. **Limit Compromise Impact**
   - If key compromised, only tokens signed with that key are affected
   - Old tokens become invalid after key removal

2. **Cryptographic Hygiene**
   - Regular rotation reduces risk of cryptanalytic attacks
   - Limits amount of data signed with single key

3. **Compliance Requirements**
   - Many standards require periodic key rotation
   - PCI-DSS, HIPAA, SOC 2, etc.

4. **Defense in Depth**
   - Reduces attack window
   - Limits blast radius of key compromise

### When to Rotate Keys

#### Scheduled Rotation

**Frequency Recommendations:**

| Risk Level | Rotation Frequency | Rationale |
|------------|-------------------|-----------|
| High Security | Monthly | Maximum security, frequent rotation |
| Standard Security | Quarterly (3 months) | Balanced security and operations |
| Low Risk | Annually | Minimal operational overhead |
| Legacy Systems | Every 2 years | Compliance minimum |

**Recommendation:** Quarterly rotation for production systems.

#### Event-Driven Rotation

**Immediate Rotation Required:**
- Suspected or confirmed key compromise
- Employee with key access terminated
- Security audit finding
- Intrusion detection alert
- Vulnerability disclosure

**Planned Rotation:**
- Algorithm deprecation (e.g., SHA-1 → SHA-256)
- Key size upgrade (e.g., RSA 2048 → 4096)
- Migration to new infrastructure
- Compliance audit preparation

### Rotation Types

#### 1. Regular Scheduled Rotation

**Characteristics:**
- Planned ahead
- Zero downtime
- Gradual transition
- No service disruption

**Process:** See [Key Rotation Process](#key-rotation-process-zero-downtime)

#### 2. Emergency Rotation

**Characteristics:**
- Immediate action required
- Possible service disruption
- Revoke compromised key
- Force re-authentication

**Process:** See [Emergency Key Rotation](#emergency-key-rotation)

#### 3. Algorithm Migration

**Characteristics:**
- Change cryptographic algorithm
- Support multiple algorithms during transition
- Gradual client migration
- Extended transition period

**Process:** See [Algorithm Migration](#algorithm-migration)

### Rotation Impact Analysis

**Tokens Affected:**
- All tokens signed with old key become invalid after key removal
- Token lifetime: Determines rotation timeline

**Clients Affected:**
- None (if done correctly with JWKS)
- Clients automatically fetch new keys from JWKS

**Downtime:**
- Zero (with proper process)
- Brief (emergency rotation)

---

## Key Rotation Process (Zero Downtime)

**Goal:** Rotate signing keys without service disruption or token verification failures.

**Duration:** Days to weeks, depending on token lifetime.

### Three-Phase Rotation

```
Phase 1: ADD          Phase 2: TRANSITION       Phase 3: REMOVE
┌─────────────┐      ┌─────────────┐           ┌─────────────┐
│             │      │             │           │             │
│ Add new key │──────>│ Sign with  │──────────>│ Remove old  │
│ to JWKS     │      │ new key     │           │ key from    │
│             │      │             │           │ JWKS        │
│             │      │             │           │             │
└─────────────┘      └─────────────┘           └─────────────┘
                                                               
 Old key: In JWKS     Old key: In JWKS         Old key: REMOVED
 New key: Added       New key: Active          New key: Active
                                                               
 Tokens: Old valid    Tokens: Both valid       Tokens: New only
```

### Phase 1: Add New Key to JWKS

**Timeline:** Day 0

**Actions:**

1. **Generate New Key Pair**
   ```bash
   # RSA 4096-bit
   openssl genrsa -out new-private-2024-04.pem 4096
   openssl rsa -in new-private-2024-04.pem -pubout -out new-public-2024-04.pem
   
   # Or EC P-256
   openssl ecparam -genkey -name prime256v1 -out new-ec-2024-04.pem
   openssl ec -in new-ec-2024-04.pem -pubout -out new-ec-public-2024-04.pem
   ```

2. **Convert to JWK Format**
   ```python
   def convert_pem_to_jwk(pem_file, kid):
       """Convert PEM public key to JWK"""
       from cryptography.hazmat.primitives import serialization
       from cryptography.hazmat.backends import default_backend
       
       with open(pem_file, 'rb') as f:
           public_key = serialization.load_pem_public_key(
               f.read(),
               backend=default_backend()
           )
       
       # Extract parameters and build JWK
       # (implementation depends on key type)
       return jwk
   ```

3. **Add New JWK to JWKS**
   ```json
   {
     "keys": [
       {
         "kid": "2024-01-rsa",  // OLD KEY (still active)
         "kty": "RSA",
         "use": "sig",
         "alg": "RS256",
         "n": "...",
         "e": "AQAB"
       },
       {
         "kid": "2024-04-rsa",  // NEW KEY (added)
         "kty": "RSA",
         "use": "sig",
         "alg": "RS256",
         "n": "...",
         "e": "AQAB"
       }
     ]
   }
   ```

4. **Deploy Updated JWKS**
   - Update JWKS endpoint
   - Verify JWKS accessible
   - Monitor for errors

**Duration:** Maintain this state for 1-7 days (overlap period).

**Result:**
- JWKS has both old and new keys
- Authorization server still signing with old key
- Both keys available for verification

### Phase 2: Start Signing with New Key

**Timeline:** Day 1-7 (after Phase 1)

**Actions:**

1. **Update Authorization Server Configuration**
   ```python
   # Update signing key configuration
   SIGNING_KEY_ID = "2024-04-rsa"
   SIGNING_KEY_PATH = "/path/to/new-private-2024-04.pem"
   ```

2. **Deploy Authorization Server Update**
   - Rolling deployment recommended
   - Monitor token issuance
   - Verify JWT headers include new kid

3. **Verify New Tokens**
   ```bash
   # Decode JWT header
   echo $JWT_TOKEN | cut -d. -f1 | base64 -d 2>/dev/null | jq .
   
   # Should show:
   {
     "alg": "RS256",
     "typ": "JWT",
     "kid": "2024-04-rsa"  # New kid
   }
   ```

**Duration:** Maintain this state until all old tokens expire.

**Calculation:**
```
Grace Period = Token Lifetime + Margin

Examples:
- Access token lifetime: 1 hour → Grace: 1 day
- ID token lifetime: 5 minutes → Grace: 1 day
- Refresh token lifetime: 30 days → Grace: 35 days
```

**Result:**
- New tokens signed with new key
- Old tokens still valid (old key in JWKS)
- Clients verify both token types successfully

### Phase 3: Remove Old Key from JWKS

**Timeline:** Day 30+ (after all old tokens expired)

**Prerequisites:**
- All tokens signed with old key have expired
- Grace period elapsed
- No verification failures reported

**Actions:**

1. **Remove Old Key from JWKS**
   ```json
   {
     "keys": [
       {
         "kid": "2024-04-rsa",  // NEW KEY (only key now)
         "kty": "RSA",
         "use": "sig",
         "alg": "RS256",
         "n": "...",
         "e": "AQAB"
       }
       // 2024-01-rsa removed
     ]
   }
   ```

2. **Deploy Updated JWKS**

3. **Archive Old Private Key**
   ```bash
   # Move to archive (encrypted storage)
   mv 2024-01-rsa-private.pem archive/2024-01-rsa-private.pem.enc
   
   # Or securely delete if no archival needed
   shred -vfz -n 10 2024-01-rsa-private.pem
   ```

4. **Monitor for Issues**
   - Watch for signature verification failures
   - If failures occur: May need to rollback

**Result:**
- JWKS contains only new key
- Old tokens no longer verify (expected)
- Users with old tokens must re-authenticate

### Complete Rotation Timeline Example

**Scenario:** Token lifetime = 1 day, Grace period = 7 days

```
Day 0: Generate new key (2024-04-rsa)
       Add to JWKS
       JWKS: [2024-01-rsa, 2024-04-rsa]
       Signing: 2024-01-rsa
       ├─ Deploy JWKS update
       └─ Wait for client JWKS cache refresh

Day 1: Start signing with new key
       JWKS: [2024-01-rsa, 2024-04-rsa]
       Signing: 2024-04-rsa
       ├─ Deploy AS update
       └─ Monitor new token issuance

Day 2-7: Both keys in JWKS
         New tokens: kid=2024-04-rsa
         Old tokens: Still valid, being used until expiry
         Monitor: No verification failures

Day 8: All old tokens expired (1 day lifetime + 7 day grace)
       Remove old key from JWKS
       JWKS: [2024-04-rsa]
       Signing: 2024-04-rsa
       ├─ Deploy JWKS update
       └─ Monitor for verification failures

Day 9+: Rotation complete
        Archive old key
        Normal operations
```

### Rotation Checklist

**Pre-Rotation:**
- [ ] Generate new key pair securely
- [ ] Choose descriptive kid
- [ ] Test key generation locally
- [ ] Schedule rotation maintenance window
- [ ] Notify team of rotation

**Phase 1 (Add Key):**
- [ ] Convert new public key to JWK format
- [ ] Add new JWK to JWKS
- [ ] Deploy updated JWKS
- [ ] Verify JWKS endpoint returns both keys
- [ ] Wait for client cache refresh (1-24 hours)

**Phase 2 (Transition):**
- [ ] Update authorization server configuration
- [ ] Deploy authorization server update
- [ ] Verify new tokens have new kid
- [ ] Monitor token issuance rates
- [ ] Check for verification failures
- [ ] Wait for old tokens to expire + grace period

**Phase 3 (Remove Old Key):**
- [ ] Confirm all old tokens expired
- [ ] Remove old key from JWKS
- [ ] Deploy updated JWKS
- [ ] Monitor for verification failures
- [ ] Archive or destroy old private key
- [ ] Document rotation completion

**Post-Rotation:**
- [ ] Update rotation documentation
- [ ] Schedule next rotation
- [ ] Review any issues encountered
- [ ] Update monitoring dashboards

---

## Multi-Key JWKS During Rotation

**Purpose:** Support multiple keys simultaneously during rotation periods.

### Example: Rotation in Progress

```json
{
  "keys": [
    {
      "kid": "2024-01-rsa",
      "kty": "RSA",
      "use": "sig",
      "alg": "RS256",
      "n": "0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw",
      "e": "AQAB"
    },
    {
      "kid": "2024-04-rsa",
      "kty": "RSA",
      "use": "sig",
      "alg": "RS256",
      "n": "xjlCRBqkQRZvBPhsgsncviDvZOGVcKSSQjZ55FvcGDZFq4mLPYKBdFZTQMKPNYPTQVW7GQZ86ZqJ0gYFTHRsS5Z0wKuqYxQQRJw4HWONd8vZLJMF3LNVJsNIYXe39N6sKLJ8QvZHiCWmDvWeKvyIvLRvvZJtmVTx5lLABJC6vCeNQGzRCDqFh2NZ8DqQcMkQHSbJ5SCYd5hPRRPmxLqD13c0AXYMm9KBw5G8tDVs8PJmM5RG8bYWdg2MLwKJMx8VBt3dLz4VQHcYFLWxZLdGqPMDvWhZMKZQmxJLSvDxNLwY8MqXVJYPQXxc4dFcbYSZ7vZQRYqZMQQvLQXZFvKp8w",
      "e": "AQAB"
    }
  ]
}
```

**Current State:**
- **2024-01-rsa:** Old key, still in JWKS for old token verification
- **2024-04-rsa:** New key, currently used for signing new tokens

**Token Distribution:**
```
Tokens signed with 2024-01-rsa: 40% (declining)
Tokens signed with 2024-04-rsa: 60% (increasing)
```

### Client Verification Behavior

```python
def verify_token_during_rotation(jwt_token, jwks):
    """Verify token during key rotation"""
    # Extract kid from JWT
    header = decode_jwt_header(jwt_token)
    kid = header['kid']
    
    # Find key in JWKS
    if kid == "2024-01-rsa":
        # Old token - still valid
        jwk = find_key_by_kid(jwks, "2024-01-rsa")
        print("Verifying with old key")
        
    elif kid == "2024-04-rsa":
        # New token
        jwk = find_key_by_kid(jwks, "2024-04-rsa")
        print("Verifying with new key")
        
    else:
        raise KeyNotFoundError(f"Unknown kid: {kid}")
    
    # Verify signature
    verify_signature(jwt_token, jwk)
```

### Multiple Rotations Simultaneously

**Scenario:** Rotating two key types at same time.

```json
{
  "keys": [
    {
      "kid": "rsa-2024-01",
      "kty": "RSA",
      "alg": "RS256",
      ...
    },
    {
      "kid": "rsa-2024-04",  // New RSA key
      "kty": "RSA",
      "alg": "RS256",
      ...
    },
    {
      "kid": "ec-2024-01",
      "kty": "EC",
      "alg": "ES256",
      ...
    },
    {
      "kid": "ec-2024-04",   // New EC key
      "kty": "EC",
      "alg": "ES256",
      ...
    }
  ]
}
```

**Management Complexity:**
- Track multiple rotation timelines
- Coordinate key removal
- Monitor verification success per key

**Recommendation:** Stagger rotations (don't rotate all keys simultaneously).

---

## Emergency Key Rotation

**Scenario:** Key compromise suspected or confirmed.

**Objective:** Minimize damage, restore security quickly.

### Emergency Rotation Process

#### Step 1: Immediate Response (Minutes)

**Actions:**

1. **Activate Incident Response**
   - Page on-call security team
   - Start incident log
   - Assess scope of compromise

2. **Generate New Key Immediately**
   ```bash
   # Generate emergency replacement key
   openssl genrsa -out emergency-2024-04-15.pem 4096
   openssl rsa -in emergency-2024-04-15.pem -pubout -out emergency-2024-04-15-pub.pem
   ```

3. **Add New Key to JWKS**
   ```python
   # Emergency JWKS update
   new_jwk = {
       "kid": "emergency-2024-04-15",
       "kty": "RSA",
       "use": "sig",
       "alg": "RS256",
       "n": "...",
       "e": "AQAB"
   }
   
   jwks['keys'].append(new_jwk)
   deploy_jwks(jwks)
   ```

4. **Start Signing with New Key**
   - Deploy authorization server update
   - Verify new tokens issued with new kid

**Duration:** 15-60 minutes

#### Step 2: Revoke Compromised Tokens (Hours)

**Actions:**

1. **Identify Affected Tokens**
   ```sql
   -- Find all tokens signed with compromised key
   SELECT token_id, user_id, issued_at, expires_at
   FROM tokens
   WHERE signing_key_id = 'compromised-key-2024-01'
     AND expires_at > NOW();
   ```

2. **Revoke All Affected Tokens**
   ```python
   def revoke_all_tokens_by_key(key_id):
       """Revoke all tokens signed with compromised key"""
       affected_tokens = db.query(
           "SELECT token_id FROM tokens WHERE signing_key_id = ?",
           [key_id]
       )
       
       for token in affected_tokens:
           revoke_token(token['token_id'])
       
       logger.info(f"Revoked {len(affected_tokens)} tokens")
   ```

3. **Update Token Revocation List**
   - Add to revocation list (if using)
   - Update revocation cache

**Duration:** 1-4 hours

#### Step 3: Remove Compromised Key (Immediate)

**Actions:**

1. **Remove Compromised Public Key from JWKS**
   ```json
   {
     "keys": [
       {
         "kid": "emergency-2024-04-15",  // Only new key
         "kty": "RSA",
         "use": "sig",
         "alg": "RS256",
         "n": "...",
         "e": "AQAB"
       }
       // Compromised key REMOVED
     ]
   }
   ```

2. **Deploy Immediately**
   - No waiting for token expiration
   - Accept that old tokens will fail verification

**Duration:** Immediate

#### Step 4: Force Re-Authentication (Optional but Recommended)

**Actions:**

1. **Invalidate All Sessions**
   ```python
   def invalidate_all_sessions():
       """Force re-authentication for all users"""
       db.execute("DELETE FROM sessions")
       cache.flushall()  # Clear session cache
       
       logger.critical("All sessions invalidated - users must re-authenticate")
   ```

2. **Notify Users**
   - Email notification
   - In-app notification
   - Status page update

**Example Notification:**
```
Subject: Security Alert - Re-authentication Required

We detected a potential security issue and have taken immediate action 
to protect your account. As a precaution, all users must log in again.

Your account remains secure. This is a preventive measure.

For questions, contact security@example.com.
```

**Duration:** Immediate

#### Step 5: Investigation and Remediation (Days)

**Actions:**

1. **Investigate Compromise**
   - How was key accessed?
   - What data was exposed?
   - Who had access?
   - Are there other compromised keys?

2. **Secure Key Storage**
   - Review access controls
   - Implement HSM if not already
   - Audit key access logs
   - Update key management procedures

3. **Post-Mortem**
   - Document incident timeline
   - Identify root cause
   - Implement preventive measures
   - Update incident response procedures

**Duration:** Days to weeks

### Emergency Rotation Trade-Offs

**Immediate Removal vs. Graceful Removal:**

| Aspect | Immediate Removal | Graceful Removal |
|--------|-------------------|------------------|
| Security | Highest (no compromised key use) | Lower (compromised key usable) |
| Availability | Lower (old tokens fail) | Higher (old tokens work) |
| User Impact | High (forced re-auth) | Low (gradual expiration) |
| Recommended | Key compromise confirmed | Key compromise suspected |

### Emergency Rotation Checklist

**Immediate Actions:**
- [ ] Activate incident response team
- [ ] Generate new key pair
- [ ] Add new key to JWKS
- [ ] Start signing with new key
- [ ] Remove compromised key from JWKS
- [ ] Deploy all updates

**Within 1 Hour:**
- [ ] Revoke all tokens signed with compromised key
- [ ] Invalidate sessions (optional)
- [ ] Notify security team
- [ ] Start incident log

**Within 24 Hours:**
- [ ] Notify affected users
- [ ] Update security documentation
- [ ] Review access logs
- [ ] Secure compromised key storage

**Within 1 Week:**
- [ ] Complete investigation
- [ ] Implement remediation measures
- [ ] Update incident response procedures
- [ ] Conduct post-mortem
- [ ] Schedule follow-up security audit

### Communication Template

**Internal (Immediate):**
```
SECURITY ALERT: Key Compromise

Compromised Key: [kid]
Detection Time: [timestamp]
Actions Taken:
- New key generated and deployed
- Compromised key removed from JWKS
- Token revocation in progress

Current Status: [status]
Incident Lead: [name]
Next Update: [time]
```

**External (As Needed):**
```
Security Update

We've taken proactive steps to enhance account security following 
the detection of unusual activity. All users must re-authenticate 
as a precautionary measure.

Actions Taken:
- Security credentials rotated
- All sessions invalidated
- Enhanced monitoring deployed

Your data remains secure. Questions? Contact security@example.com
```

---

## Algorithm Migration

**Scenario:** Upgrade cryptographic algorithm (e.g., RS256 → ES256).

**Reasons:**
- Stronger security (e.g., EC vs RSA)
- Better performance (EC signing faster)
- Compliance requirements
- Industry best practices

### Migration Process

#### Phase 1: Add New Algorithm Keys

**Actions:**

1. **Generate New Key with New Algorithm**
   ```bash
   # Generate EC P-256 key (for ES256)
   openssl ecparam -genkey -name prime256v1 -out ec-2024-04.pem
   openssl ec -in ec-2024-04.pem -pubout -out ec-2024-04-pub.pem
   ```

2. **Add to JWKS Alongside Old Algorithm**
   ```json
   {
     "keys": [
       {
         "kid": "rsa-2024-01",
         "kty": "RSA",
         "use": "sig",
         "alg": "RS256",
         "n": "...",
         "e": "AQAB"
       },
       {
         "kid": "ec-2024-04",  // NEW ALGORITHM
         "kty": "EC",
         "use": "sig",
         "alg": "ES256",
         "crv": "P-256",
         "x": "...",
         "y": "..."
       }
     ]
   }
   ```

**Duration:** Indefinite (support both algorithms)

#### Phase 2: Gradual Client Migration

**Strategies:**

**Strategy 1: Server-Driven (Recommended)**

Authorization server starts issuing tokens with new algorithm:

```python
def select_signing_key(client_preferences):
    """Select signing key based on client capabilities"""
    
    # New clients (support ES256)
    if 'ES256' in client_preferences:
        return signing_keys['ec-2024-04']
    
    # Legacy clients (RS256 only)
    else:
        return signing_keys['rsa-2024-01']
```

**Strategy 2: Client-Driven**

Clients request preferred algorithm in token request:

```http
POST /token HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=...
&preferred_algorithm=ES256
```

**Strategy 3: Percentage-Based Rollout**

```python
import random

def select_signing_algorithm():
    """Gradually increase ES256 usage"""
    
    # 20% ES256, 80% RS256
    if random.random() < 0.20:
        return 'ES256', signing_keys['ec-2024-04']
    else:
        return 'RS256', signing_keys['rsa-2024-01']
```

Gradually increase percentage:
- Week 1: 20% ES256
- Week 2: 40% ES256
- Week 3: 60% ES256
- Week 4: 80% ES256
- Week 5: 100% ES256

**Monitor:**
- Verification success rates per algorithm
- Client compatibility issues
- Performance metrics

#### Phase 3: Deprecate Old Algorithm

**After Migration Complete:**

1. **Announce Deprecation**
   - 6-12 months notice
   - Document new algorithm requirements
   - Provide migration guide

2. **Monitor Usage**
   ```sql
   -- Tokens by algorithm
   SELECT algorithm, COUNT(*) 
   FROM tokens 
   WHERE expires_at > NOW()
   GROUP BY algorithm;
   
   -- Result:
   -- RS256: 15%
   -- ES256: 85%
   ```

3. **Remove Old Algorithm Keys**
   - When usage < 5%
   - After deprecation period
   - With sufficient notice

**Final JWKS:**
```json
{
  "keys": [
    {
      "kid": "ec-2024-04",
      "kty": "EC",
      "use": "sig",
      "alg": "ES256",
      "crv": "P-256",
      "x": "...",
      "y": "..."
    }
  ]
}
```

### Algorithm Comparison

| Algorithm | Type | Key Size | Signature Size | Performance | Security Level |
|-----------|------|----------|----------------|-------------|----------------|
| RS256 | RSA | 2048-4096 bit | 256 bytes | Slow signing, fast verify | Good |
| ES256 | ECDSA | 256 bit | ~64 bytes | Fast signing, fast verify | Very Good |
| PS256 | RSA-PSS | 2048-4096 bit | 256 bytes | Slow signing, fast verify | Very Good |
| EdDSA | EdDSA | 256 bit | 64 bytes | Very fast | Excellent |

**Migration Recommendations:**
- RS256 → ES256: Most common, good balance
- RS256 → PS256: Better RSA, similar performance
- RS256 → EdDSA: Best performance, limited support

### Client Compatibility

**Check Client Algorithm Support:**

```python
def verify_algorithm_support(jwks):
    """Check which algorithms client supports"""
    supported = set()
    
    for jwk in jwks['keys']:
        alg = jwk.get('alg')
        if alg:
            supported.add(alg)
    
    return supported

# Test
jwks = fetch_jwks(jwks_uri)
algorithms = verify_algorithm_support(jwks)
print(f"Supported algorithms: {algorithms}")
```

**Fallback Strategy:**

```python
def verify_jwt_with_fallback(jwt_token, jwks_uri):
    """Verify JWT with algorithm fallback"""
    header = decode_jwt_header(jwt_token)
    kid = header['kid']
    alg = header['alg']
    
    # Try primary verification
    try:
        jwks = fetch_jwks(jwks_uri)
        jwk = find_key_by_kid(jwks, kid)
        verify_signature(jwt_token, jwk, alg)
        return True
    
    except UnsupportedAlgorithmError:
        # Algorithm not supported by this client
        logger.warning(f"Unsupported algorithm: {alg}")
        return False
```

---

## Key Storage and Security

**Critical Principle:** Private keys MUST be kept secret. Compromise = complete security failure.

### Private Key Security Requirements

**MUST (RFC 2119):**
- Store private keys encrypted
- Restrict access to minimum necessary personnel/services
- Use secure key management system
- Log all key access
- Never transmit private keys in plaintext
- Never include private keys in JWKS (only public keys!)

**SHOULD (RFC 2119):**
- Use Hardware Security Module (HSM) for production
- Implement key access monitoring
- Require multi-party authorization for key access
- Rotate keys regularly
- Backup keys securely

### Storage Options

#### Option 1: File System (Development Only)

**Example:**
```bash
# Generate key
openssl genrsa -out private.pem 4096

# Set restrictive permissions
chmod 600 private.pem
chown appuser:appuser private.pem

# Location
/etc/oauth2/keys/private.pem
```

**Pros:**
- Simple
- No external dependencies

**Cons:**
- File system security relies on OS permissions
- Key in plaintext on disk
- No audit trail
- Not recommended for production

#### Option 2: Encrypted File System

**Example:**
```bash
# Encrypt private key
openssl enc -aes-256-cbc -salt -in private.pem -out private.pem.enc

# Decrypt at runtime (password from environment)
openssl enc -aes-256-cbc -d -in private.pem.enc -out private.pem -pass env:KEY_PASSWORD
```

**Pros:**
- Key encrypted at rest
- Standard encryption

**Cons:**
- Password management challenge
- Key still in memory
- Limited audit trail

#### Option 3: Key Management Service (KMS)

**Cloud KMS Examples:**
- AWS KMS
- Google Cloud KMS
- Azure Key Vault

**Example (AWS KMS):**
```python
import boto3
import base64

class KMSKeyManager:
    def __init__(self, key_id):
        self.kms = boto3.client('kms')
        self.key_id = key_id
    
    def sign_data(self, data):
        """Sign data using KMS key"""
        response = self.kms.sign(
            KeyId=self.key_id,
            Message=data,
            MessageType='RAW',
            SigningAlgorithm='RSASSA_PKCS1_V1_5_SHA_256'
        )
        
        return base64.b64decode(response['Signature'])
    
    def get_public_key(self):
        """Get public key from KMS"""
        response = self.kms.get_public_key(KeyId=self.key_id)
        return response['PublicKey']
```

**Pros:**
- Professional key management
- Audit logging
- Access control
- Automatic backups
- Key rotation support

**Cons:**
- Cloud dependency
- Cost
- Latency (network calls for signing)

**Recommendation:** Use KMS for production systems.

#### Option 4: Hardware Security Module (HSM)

**HSM Characteristics:**
- Tamper-resistant hardware
- Keys never leave HSM
- FIPS 140-2 certified
- High performance

**Example (PKCS#11 Interface):**
```python
from PyKCS11 import *

class HSMKeyManager:
    def __init__(self, library_path, slot, pin):
        self.pkcs11 = PyKCS11Lib()
        self.pkcs11.load(library_path)
        
        self.session = self.pkcs11.openSession(slot)
        self.session.login(pin)
    
    def sign_data(self, data, key_handle):
        """Sign data using HSM key"""
        signature = self.session.sign(key_handle, data)
        return bytes(signature)
```

**Pros:**
- Highest security
- Keys never extractable
- FIPS compliance
- High performance

**Cons:**
- Expensive
- Complex setup
- Hardware dependency

**Recommendation:** Use for high-security / compliance requirements.

### Key Access Control

**Principle of Least Privilege:**

```yaml
# Example access control policy
key_access:
  private_keys:
    read:
      - authorization_server_service
      - key_rotation_service
    write:
      - key_management_admin
  
  public_keys:
    read:
      - everyone  # JWKS is public
    write:
      - authorization_server_service
      - key_rotation_service
```

**Implementation:**
- Use IAM roles/policies
- Require MFA for administrative access
- Log all key access
- Alert on unusual access patterns

### Key Backup and Disaster Recovery

**Backup Requirements:**
- Encrypted backups
- Secure backup storage
- Regular backup testing
- Off-site backup storage
- Documented recovery procedures

**Backup Strategy:**

```python
def backup_private_key(private_key_pem, backup_path, encryption_key):
    """Backup private key with encryption"""
    from cryptography.fernet import Fernet
    
    # Encrypt private key
    f = Fernet(encryption_key)
    encrypted_key = f.encrypt(private_key_pem.encode())
    
    # Write to backup location
    with open(backup_path, 'wb') as f:
        f.write(encrypted_key)
    
    # Verify backup
    with open(backup_path, 'rb') as f:
        backup_data = f.read()
    
    # Test decryption
    decrypted = f.decrypt(backup_data)
    assert decrypted == private_key_pem.encode()
    
    logger.info(f"Key backed up to {backup_path}")
```

**Recovery Testing:**
- Quarterly recovery drills
- Document recovery time
- Test in non-production environment
- Update procedures based on tests

### Key Destruction

**When to Destroy Keys:**
- After rotation complete (old key expired)
- Emergency rotation (compromised key)
- Decommissioned service
- End of retention period

**Secure Deletion:**

```bash
# Overwrite file multiple times
shred -vfz -n 10 old-private-key.pem

# Verify deletion
ls -la old-private-key.pem  # Should not exist
```

**HSM/KMS:**
```python
# AWS KMS key deletion (30-day waiting period)
kms.schedule_key_deletion(
    KeyId=old_key_id,
    PendingWindowInDays=30
)
```

**Documentation:**
- Log key destruction
- Record reason
- Maintain audit trail

---

## Key Generation Best Practices

**Specification:** RFC 7518 §3 - Cryptographic Algorithms

### RSA Key Generation

**Key Size Recommendations:**

| Key Size | Security Level | Use Case | Status |
|----------|---------------|----------|--------|
| 1024-bit | 80-bit | Legacy only | ❌ DEPRECATED |
| 2048-bit | 112-bit | Minimum acceptable | ✓ OK |
| 3072-bit | 128-bit | Recommended | ✓ GOOD |
| 4096-bit | 152-bit | High security | ✓ BEST |

**Recommendation:** Use 4096-bit for new keys.

**OpenSSL Generation:**

```bash
# Generate 4096-bit RSA key
openssl genrsa -out private-rsa-4096.pem 4096

# Extract public key
openssl rsa -in private-rsa-4096.pem -pubout -out public-rsa-4096.pem

# View key details
openssl rsa -in private-rsa-4096.pem -text -noout
```

**Python Generation:**

```python
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

def generate_rsa_keypair(key_size=4096):
    """Generate RSA key pair"""
    # Generate private key
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=key_size,
        backend=default_backend()
    )
    
    # Serialize private key
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    # Get public key
    public_key = private_key.public_key()
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    
    return private_pem, public_pem

# Generate
private_pem, public_pem = generate_rsa_keypair(4096)
```

### EC Key Generation

**Curve Recommendations:**

| Curve | Security Level | Use Case | Algorithm | Status |
|-------|---------------|----------|-----------|--------|
| P-256 | 128-bit | Recommended | ES256 | ✓ BEST |
| P-384 | 192-bit | High security | ES384 | ✓ GOOD |
| P-521 | 256-bit | Very high security | ES512 | ✓ OK |
| secp256k1 | 128-bit | Bitcoin/crypto | - | ⚠️ Special use |

**Recommendation:** Use P-256 (secp256r1/prime256v1) for balance of security and performance.

**OpenSSL Generation:**

```bash
# Generate EC P-256 key
openssl ecparam -genkey -name prime256v1 -out private-ec-p256.pem

# Extract public key
openssl ec -in private-ec-p256.pem -pubout -out public-ec-p256.pem

# View key details
openssl ec -in private-ec-p256.pem -text -noout
```

**Python Generation:**

```python
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

def generate_ec_keypair(curve=ec.SECP256R1()):
    """Generate EC key pair"""
    # Generate private key
    private_key = ec.generate_private_key(
        curve=curve,
        backend=default_backend()
    )
    
    # Serialize private key
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    # Get public key
    public_key = private_key.public_key()
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    
    return private_pem, public_pem

# Generate P-256 key
private_pem, public_pem = generate_ec_keypair(ec.SECP256R1())

# Generate P-384 key
private_pem_384, public_pem_384 = generate_ec_keypair(ec.SECP384R1())
```

### EdDSA Key Generation (Ed25519)

**Characteristics:**
- Fast signing and verification
- Small signatures (64 bytes)
- Deterministic signatures
- High security (128-bit equivalent)

**Python Generation:**

```python
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization

def generate_ed25519_keypair():
    """Generate Ed25519 key pair"""
    # Generate private key
    private_key = ed25519.Ed25519PrivateKey.generate()
    
    # Serialize private key
    private_bytes = private_key.private_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PrivateFormat.Raw,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    # Get public key
    public_key = private_key.public_key()
    public_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw
    )
    
    return private_bytes, public_bytes
```

### Random Number Generation

**CRITICAL:** Use cryptographically secure random number generator.

**Python:**
```python
import secrets

# Good: Cryptographically secure
random_bytes = secrets.token_bytes(32)

# Bad: Not cryptographically secure
import random
bad_random = random.getrandbits(256)  # ❌ Don't use for keys!
```

**OpenSSL:**
```bash
# Generate random bytes
openssl rand -hex 32
```

### Key Generation Checklist

- [ ] Use sufficient key size (RSA 4096-bit, EC P-256)
- [ ] Use cryptographically secure RNG
- [ ] Generate keys in secure environment
- [ ] Test key pair (sign and verify)
- [ ] Store private key securely immediately
- [ ] Generate unique kid
- [ ] Document key purpose and lifecycle
- [ ] Set key expiration/rotation date

---

## JWKS Response Headers

**Specification:** HTTP/1.1 standards, CORS

### Recommended Response Headers

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=UTF-8
Cache-Control: max-age=3600, public
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD, OPTIONS
Access-Control-Allow-Headers: Content-Type
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY

{
  "keys": [...]
}
```

### Header Breakdown

#### Content-Type (REQUIRED)

```
Content-Type: application/json; charset=UTF-8
```

**Purpose:** Indicates response is JSON

**Character Encoding:** Always UTF-8

#### Cache-Control (RECOMMENDED)

```
Cache-Control: max-age=3600, public
```

**Directives:**
- `max-age=3600`: Cache for 1 hour (3600 seconds)
- `public`: Can be cached by any cache
- `private`: Only cache in browser (not CDN)
- `no-cache`: Revalidate before using cached copy
- `no-store`: Don't cache at all

**TTL Selection:**

```python
def calculate_cache_ttl(key_rotation_frequency):
    """Calculate appropriate cache TTL based on rotation frequency"""
    
    if key_rotation_frequency == "monthly":
        return 3600  # 1 hour
    elif key_rotation_frequency == "quarterly":
        return 14400  # 4 hours
    elif key_rotation_frequency == "annually":
        return 86400  # 24 hours
    else:
        return 3600  # Default: 1 hour
```

**Recommendation:** `max-age=3600` (1 hour) for most cases.

#### CORS Headers (REQUIRED for Browser Clients)

**Purpose:** Allow browser-based clients to fetch JWKS

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

**JWKS is Public:** `Access-Control-Allow-Origin: *` is safe because JWKS contains only public keys.

**Preflight Request:**
```http
OPTIONS /.well-known/jwks.json HTTP/1.1
Host: auth.example.com
Origin: https://client.example.com
Access-Control-Request-Method: GET
```

**Preflight Response:**
```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD, OPTIONS
Access-Control-Max-Age: 86400
```

#### Security Headers (RECOMMENDED)

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'none'
```

**Purpose:** Defense-in-depth security

### Complete Response Example

```http
HTTP/1.1 200 OK
Date: Mon, 15 Apr 2024 10:30:00 GMT
Content-Type: application/json; charset=UTF-8
Content-Length: 1234
Cache-Control: max-age=3600, public
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD, OPTIONS
Access-Control-Allow-Headers: Content-Type
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY

{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "2024-04-rsa",
      "alg": "RS256",
      "n": "0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw",
      "e": "AQAB"
    }
  ]
}
```

---

## Client-Side Key Management

### Fetch and Cache Strategy

**Complete Client Implementation:**

```python
import requests
import time
from threading import Lock
import logging

logger = logging.getLogger(__name__)

class JWKSClient:
    """
    Complete JWKS client with caching, refresh, and error handling
    """
    
    def __init__(self, jwks_uri, cache_ttl=3600, max_retries=3):
        """
        Initialize JWKS client
        
        Args:
            jwks_uri: JWKS endpoint URL
            cache_ttl: Cache TTL in seconds
            max_retries: Maximum retry attempts
        """
        self.jwks_uri = jwks_uri
        self.cache_ttl = cache_ttl
        self.max_retries = max_retries
        
        # Cache
        self.jwks = None
        self.cached_at = None
        self.lock = Lock()
        
        # Optimized key lookup
        self.key_index = {}  # kid -> JWK mapping
        
        # Statistics
        self.stats = {
            'cache_hits': 0,
            'cache_misses': 0,
            'fetch_errors': 0,
            'key_not_found': 0
        }
    
    def get_key(self, kid):
        """
        Get key by kid (main entry point)
        
        Args:
            kid: Key ID from JWT header
        
        Returns:
            JWK dict or None if not found
        """
        # Try cached JWKS first
        jwk = self._get_key_from_cache(kid)
        
        if jwk:
            self.stats['cache_hits'] += 1
            return jwk
        
        # Cache miss - refresh JWKS
        self.stats['cache_misses'] += 1
        logger.info(f"Kid {kid} not in cache, refreshing JWKS")
        
        try:
            self._refresh_jwks()
            jwk = self.key_index.get(kid)
            
            if jwk:
                logger.info(f"Kid {kid} found after refresh")
                return jwk
            else:
                self.stats['key_not_found'] += 1
                logger.warning(f"Kid {kid} not found even after refresh")
                return None
                
        except Exception as e:
            logger.error(f"JWKS refresh failed: {e}")
            self.stats['fetch_errors'] += 1
            
            # Use stale cache if available
            if self.jwks:
                logger.warning("Using stale JWKS cache")
                return self.key_index.get(kid)
            
            raise
    
    def _get_key_from_cache(self, kid):
        """Get key from cache if valid"""
        with self.lock:
            if not self._is_cache_valid():
                return None
            
            return self.key_index.get(kid)
    
    def _is_cache_valid(self):
        """Check if cache is still valid"""
        if self.jwks is None or self.cached_at is None:
            return False
        
        age = time.time() - self.cached_at
        return age < self.cache_ttl
    
    def _refresh_jwks(self):
        """Fetch fresh JWKS with retry logic"""
        with self.lock:
            for attempt in range(self.max_retries):
                try:
                    logger.debug(f"Fetching JWKS (attempt {attempt + 1})")
                    
                    response = requests.get(
                        self.jwks_uri,
                        timeout=10,
                        headers={'Accept': 'application/json'}
                    )
                    
                    if response.status_code != 200:
                        raise JWKSFetchError(
                            f"HTTP {response.status_code}: {response.text}"
                        )
                    
                    jwks = response.json()
                    
                    # Validate JWKS structure
                    if 'keys' not in jwks:
                        raise InvalidJWKSError("JWKS missing 'keys' array")
                    
                    # Update cache
                    self.jwks = jwks
                    self.cached_at = time.time()
                    
                    # Rebuild index
                    self._rebuild_key_index()
                    
                    logger.info(
                        f"JWKS refreshed successfully, {len(jwks['keys'])} keys"
                    )
                    return
                    
                except requests.exceptions.RequestException as e:
                    logger.warning(f"JWKS fetch attempt {attempt + 1} failed: {e}")
                    
                    if attempt < self.max_retries - 1:
                        # Exponential backoff
                        sleep_time = 2 ** attempt
                        logger.debug(f"Retrying in {sleep_time} seconds")
                        time.sleep(sleep_time)
                    else:
                        raise JWKSFetchError(f"JWKS fetch failed after {self.max_retries} attempts")
    
    def _rebuild_key_index(self):
        """Build kid -> JWK index for O(1) lookup"""
        self.key_index = {}
        
        for jwk in self.jwks.get('keys', []):
            kid = jwk.get('kid')
            if kid:
                if kid in self.key_index:
                    logger.warning(f"Duplicate kid in JWKS: {kid}")
                
                self.key_index[kid] = jwk
        
        logger.debug(f"Key index rebuilt: {len(self.key_index)} keys")
    
    def force_refresh(self):
        """Force JWKS refresh (for testing or emergency)"""
        logger.info("Forcing JWKS refresh")
        self._refresh_jwks()
    
    def get_stats(self):
        """Get cache statistics"""
        total_requests = self.stats['cache_hits'] + self.stats['cache_misses']
        
        if total_requests > 0:
            hit_rate = (self.stats['cache_hits'] / total_requests) * 100
        else:
            hit_rate = 0
        
        return {
            **self.stats,
            'total_requests': total_requests,
            'cache_hit_rate': f"{hit_rate:.1f}%",
            'cache_age': time.time() - self.cached_at if self.cached_at else None
        }

class JWKSFetchError(Exception):
    """JWKS fetch error"""
    pass

class InvalidJWKSError(Exception):
    """Invalid JWKS structure"""
    pass


# Usage
jwks_client = JWKSClient(
    jwks_uri='https://auth.example.com/.well-known/jwks.json',
    cache_ttl=3600
)

# Get key for verification
kid = jwt_header['kid']
jwk = jwks_client.get_key(kid)

if jwk:
    # Verify signature
    verify_signature(jwt, jwk)
else:
    raise KeyNotFoundError(f"Key {kid} not found")

# View statistics
stats = jwks_client.get_stats()
print(f"Cache hit rate: {stats['cache_hit_rate']}")
```

### Background Refresh (Optional)

**Proactive Cache Refresh:**

```python
import threading

class BackgroundRefreshJWKSClient(JWKSClient):
    """JWKS client with background refresh"""
    
    def __init__(self, *args, refresh_interval=3600, **kwargs):
        super().__init__(*args, **kwargs)
        self.refresh_interval = refresh_interval
        
        # Start background thread
        self.refresh_thread = threading.Thread(
            target=self._background_refresh_loop,
            daemon=True
        )
        self.refresh_thread.start()
    
    def _background_refresh_loop(self):
        """Background refresh loop"""
        while True:
            time.sleep(self.refresh_interval)
            
            try:
                logger.info("Background JWKS refresh")
                self._refresh_jwks()
            except Exception as e:
                logger.error(f"Background refresh failed: {e}")

# Usage with background refresh
jwks_client = BackgroundRefreshJWKSClient(
    jwks_uri='https://auth.example.com/.well-known/jwks.json',
    cache_ttl=3600,
    refresh_interval=3000  # Refresh every 50 minutes
)
```

---

## Multi-Tenant JWKS

**Scenario:** Multiple tenants sharing authorization server infrastructure.

### Separate JWKS Per Tenant

**Pattern:** Each tenant has dedicated JWKS endpoint.

**Structure:**
```
Tenant A: https://auth.example.com/tenant-a/.well-known/jwks.json
Tenant B: https://auth.example.com/tenant-b/.well-known/jwks.json
Tenant C: https://auth.example.com/tenant-c/.well-known/jwks.json
```

**JWKS for Tenant A:**
```json
{
  "keys": [
    {
      "kid": "tenant-a-2024-01",
      "kty": "RSA",
      "use": "sig",
      "alg": "RS256",
      "n": "...",
      "e": "AQAB"
    }
  ]
}
```

**Benefits:**
- Complete tenant isolation
- Independent key rotation per tenant
- Clear security boundaries
- Per-tenant key compromise containment

**Implementation:**

```python
class MultiTenantJWKSManager:
    """Manage separate JWKS per tenant"""
    
    def __init__(self):
        self.tenant_keys = {}  # tenant_id -> keys
    
    def get_jwks_for_tenant(self, tenant_id):
        """Get JWKS for specific tenant"""
        keys = self.tenant_keys.get(tenant_id, [])
        
        return {
            "keys": [key.to_jwk() for key in keys]
        }
    
    def add_key_for_tenant(self, tenant_id, key, kid):
        """Add key for specific tenant"""
        if tenant_id not in self.tenant_keys:
            self.tenant_keys[tenant_id] = []
        
        self.tenant_keys[tenant_id].append(KeyPair(kid, key))
    
    def rotate_key_for_tenant(self, tenant_id, new_key, new_kid):
        """Rotate key for specific tenant"""
        # Add new key
        self.add_key_for_tenant(tenant_id, new_key, new_kid)
        
        # Keep old keys for grace period
        # Remove after token expiration
```

### Shared JWKS with Tenant-Specific kid

**Pattern:** Single JWKS endpoint with tenant identifier in kid.

**Structure:**
```
All Tenants: https://auth.example.com/.well-known/jwks.json
```

**Shared JWKS:**
```json
{
  "keys": [
    {
      "kid": "tenant-a-2024-01",  // Tenant A key
      "kty": "RSA",
      "use": "sig",
      "alg": "RS256",
      "n": "...",
      "e": "AQAB"
    },
    {
      "kid": "tenant-b-2024-01",  // Tenant B key
      "kty": "RSA",
      "use": "sig",
      "alg": "RS256",
      "n": "...",
      "e": "AQAB"
    },
    {
      "kid": "tenant-c-2024-01",  // Tenant C key
      "kty": "RSA",
      "use": "sig",
      "alg": "RS256",
      "n": "...",
      "e": "AQAB"
    }
  ]
}
```

**Token Verification:**
```python
def verify_tenant_token(jwt_token, tenant_id, jwks):
    """Verify token for specific tenant"""
    header = decode_jwt_header(jwt_token)
    kid = header['kid']
    
    # Validate kid belongs to tenant
    expected_prefix = f"{tenant_id}-"
    if not kid.startswith(expected_prefix):
        raise TenantMismatchError(
            f"Token kid {kid} doesn't match tenant {tenant_id}"
        )
    
    # Find key in shared JWKS
    jwk = find_key_by_kid(jwks, kid)
    
    if jwk is None:
        raise KeyNotFoundError(f"Key {kid} not found")
    
    # Verify signature
    verify_signature(jwt_token, jwk)
```

**Benefits:**
- Single JWKS endpoint
- Simpler client configuration
- Centralized key management

**Drawbacks:**
- Less isolation
- Larger JWKS document
- Shared cache (all tenants)

**Recommendation:** Use separate JWKS per tenant for better isolation.

### Multi-Tenant Key Rotation

**Coordinated Rotation:**
```python
def rotate_all_tenant_keys():
    """Rotate keys for all tenants (coordinated)"""
    for tenant_id in get_all_tenants():
        logger.info(f"Rotating key for tenant {tenant_id}")
        
        # Generate new key
        new_key = generate_rsa_keypair()
        new_kid = f"{tenant_id}-{datetime.now().strftime('%Y-%m')}"
        
        # Add to tenant JWKS
        add_key_for_tenant(tenant_id, new_key, new_kid)
        
        # Start signing with new key
        update_signing_key_for_tenant(tenant_id, new_kid)
        
        # Schedule old key removal
        schedule_key_removal(tenant_id, old_kid, delay_days=30)
```

**Staggered Rotation:**
```python
def rotate_tenant_keys_staggered():
    """Rotate keys with stagger to reduce load"""
    tenants = get_all_tenants()
    
    for i, tenant_id in enumerate(tenants):
        # Stagger by 1 day per tenant
        schedule_time = datetime.now() + timedelta(days=i)
        
        schedule_rotation(tenant_id, schedule_time)
```

---

## JWKS Endpoint Security

### HTTPS Requirement

**CRITICAL:** JWKS endpoint MUST use HTTPS (RFC 2119: MUST).

**Rationale:**
- Protects JWKS integrity during transit
- Prevents MITM modification of public keys
- Ensures clients get authentic keys

**Attack Scenario (HTTP):**

```
1. Client requests: http://auth.example.com/.well-known/jwks.json
2. Attacker intercepts (MITM)
3. Attacker modifies JWKS:
   {
     "keys": [
       {
         "kid": "2024-01-rsa",
         "n": "ATTACKER_MODULUS",  // Attacker's key!
         "e": "AQAB"
       }
     ]
   }
4. Client uses attacker's key
5. Attacker can forge tokens that client accepts
```

**Defense:** HTTPS with valid certificate.

### Rate Limiting

**Purpose:** Prevent abuse and DDoS attacks.

**Recommended Limits:**

| Client Type | Rate Limit | Rationale |
|-------------|------------|-----------|
| Per IP | 100 requests/minute | Prevent single IP abuse |
| Global | 10,000 requests/minute | Protect server capacity |
| Per kid lookup | Unlimited | Cached lookups, no backend hit |

**Implementation:**

```python
from flask import Flask, jsonify, request
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

app = Flask(__name__)
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["100 per minute"]
)

@app.route('/.well-known/jwks.json')
@limiter.limit("100 per minute")
def jwks_endpoint():
    """JWKS endpoint with rate limiting"""
    jwks = get_current_jwks()
    return jsonify(jwks)
```

**Response Headers on Rate Limit:**
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
Content-Type: application/json

{
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please retry after 60 seconds."
}
```

### Monitoring and Alerting

**Metrics to Track:**

```python
class JWKSMetrics:
    """JWKS endpoint metrics"""
    
    def __init__(self):
        self.requests_total = 0
        self.requests_per_minute = []
        self.cache_hits = 0
        self.errors = 0
        self.unique_clients = set()
    
    def record_request(self, client_ip):
        """Record JWKS request"""
        self.requests_total += 1
        self.unique_clients.add(client_ip)
    
    def record_error(self, error_type):
        """Record error"""
        self.errors += 1
        alert_if_threshold_exceeded(error_type)
    
    def get_metrics(self):
        """Get current metrics"""
        return {
            'requests_total': self.requests_total,
            'requests_per_minute': len(self.requests_per_minute),
            'unique_clients': len(self.unique_clients),
            'error_rate': self.errors / max(self.requests_total, 1),
            'cache_hit_rate': self.cache_hits / max(self.requests_total, 1)
        }
```

**Alert Conditions:**

```python
def check_alert_conditions(metrics):
    """Check if alert conditions met"""
    
    # High request rate (possible DDoS)
    if metrics['requests_per_minute'] > 1000:
        alert('high_request_rate', 
              f"JWKS requests: {metrics['requests_per_minute']}/min")
    
    # High error rate
    if metrics['error_rate'] > 0.05:  # 5%
        alert('high_error_rate',
              f"JWKS error rate: {metrics['error_rate']:.1%}")
    
    # Unusual client pattern
    if metrics['unique_clients'] > 10000:
        alert('unusual_client_count',
              f"Unique clients: {metrics['unique_clients']}")
```

**Monitoring Dashboard:**
```
JWKS Endpoint Health
====================
Requests/minute: 87
Total requests (24h): 125,430
Unique clients: 1,234
Error rate: 0.02%
Cache hit rate: 98.5%
P95 latency: 45ms
Availability: 99.97%
```

### DDoS Protection

**Strategies:**

1. **CDN Distribution**
   ```
   Origin: https://auth.example.com/.well-known/jwks.json
   CDN: https://cdn.auth.example.com/.well-known/jwks.json
   
   Benefits:
   - Global edge caching
   - DDoS mitigation at edge
   - Reduced origin load
   ```

2. **Request Validation**
   ```python
   @app.before_request
   def validate_request():
       """Validate JWKS request"""
       # Check User-Agent
       ua = request.headers.get('User-Agent', '')
       if len(ua) == 0 or len(ua) > 500:
           return jsonify({'error': 'invalid_request'}), 400
       
       # Check Accept header
       accept = request.headers.get('Accept', '')
       if 'application/json' not in accept and '*/*' not in accept:
           return jsonify({'error': 'invalid_accept'}), 406
   ```

3. **Geographic Filtering** (if applicable)
   ```python
   ALLOWED_COUNTRIES = ['US', 'CA', 'GB', 'DE', 'FR']
   
   def check_geographic_restrictions():
       """Block requests from unexpected regions"""
       client_country = get_client_country(request.remote_addr)
       
       if client_country not in ALLOWED_COUNTRIES:
           logger.warning(f"Request from unexpected country: {client_country}")
           return False
       
       return True
   ```

### Availability Requirements

**SLA Target:** 99.9% uptime (43.8 minutes downtime per month)

**High Availability Architecture:**

```
                    ┌───────────────┐
                    │  Load Balancer │
                    └───────┬───────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
      ┌─────▼─────┐   ┌────▼────┐   ┌─────▼─────┐
      │  AS Node 1│   │AS Node 2│   │ AS Node 3 │
      └───────────┘   └─────────┘   └───────────┘
            │               │               │
            └───────────────┼───────────────┘
                            │
                    ┌───────▼───────┐
                    │  Shared JWKS  │
                    │  Storage/DB   │
                    └───────────────┘
```

**Redundancy:**
- Multiple server instances
- Load balancing
- Shared JWKS storage
- Health checks

**Disaster Recovery:**
- Backup JWKS storage
- Documented recovery procedures
- Regular DR testing

---

## Common Implementation Errors

### Authorization Server Errors

#### Error 1: Missing kid in JWT Header

**Problem:**
```json
// JWT header without kid
{
  "alg": "RS256",
  "typ": "JWT"
  // kid missing!
}
```

**Impact:** Client cannot determine which key to use.

**Solution:**
```python
def create_jwt_header(kid, algorithm='RS256'):
    """Always include kid in JWT header"""
    return {
        'alg': algorithm,
        'typ': 'JWT',
        'kid': kid  # REQUIRED
    }
```

#### Error 2: Removing Key Before Tokens Expire

**Problem:**
```
Day 0: Start signing with new key (2024-04-rsa)
Day 1: Remove old key (2024-01-rsa) from JWKS
       But tokens signed with 2024-01-rsa still valid for 7 days!
       
Result: All existing tokens fail verification
```

**Solution:** Wait for token expiration + grace period before removing key.

```python
def can_remove_key(key_last_used, token_lifetime, grace_period):
    """Determine if key can be safely removed"""
    required_wait = token_lifetime + grace_period
    elapsed = datetime.now() - key_last_used
    
    return elapsed > required_wait
```

#### Error 3: Including Private Key Parameters in JWKS

**CRITICAL SECURITY ERROR:**

```json
// WRONG - Private key in public JWKS!
{
  "keys": [
    {
      "kty": "RSA",
      "kid": "2024-01-rsa",
      "n": "...",
      "e": "AQAB",
      "d": "GRtbIQmhOZ..."  // ❌❌❌ PRIVATE KEY EXPOSED!
    }
  ]
}
```

**Impact:** Complete security compromise. Anyone can forge tokens.

**Solution:** NEVER include private key parameters (`d`, `p`, `q`, `dp`, `dq`, `qi`).

```python
def jwk_to_public_only(jwk):
    """Ensure JWK contains only public parameters"""
    if jwk['kty'] == 'RSA':
        return {
            'kty': jwk['kty'],
            'use': jwk.get('use'),
            'kid': jwk.get('kid'),
            'alg': jwk.get('alg'),
            'n': jwk['n'],
            'e': jwk['e']
            # Explicitly exclude d, p, q, dp, dq, qi
        }
    elif jwk['kty'] == 'EC':
        return {
            'kty': jwk['kty'],
            'use': jwk.get('use'),
            'kid': jwk.get('kid'),
            'alg': jwk.get('alg'),
            'crv': jwk['crv'],
            'x': jwk['x'],
            'y': jwk['y']
            # Explicitly exclude d
        }
```

#### Error 4: Not Caching JWKS Generation

**Problem:**
```python
@app.route('/.well-known/jwks.json')
def jwks_endpoint():
    # Regenerate JWKS on every request (SLOW!)
    keys = load_keys_from_database()
    jwks = build_jwks_from_keys(keys)  # Expensive!
    return jsonify(jwks)
```

**Impact:** High CPU usage, slow response times.

**Solution:** Cache JWKS document.

```python
from functools import lru_cache
import time

class JWKSCache:
    def __init__(self, ttl=300):
        self.jwks = None
        self.generated_at = None
        self.ttl = ttl
    
    def get_jwks(self):
        """Get cached JWKS or regenerate"""
        if self.jwks is None or time.time() - self.generated_at > self.ttl:
            self.jwks = self._generate_jwks()
            self.generated_at = time.time()
        
        return self.jwks
    
    def _generate_jwks(self):
        """Generate JWKS from current keys"""
        keys = load_keys_from_database()
        return build_jwks_from_keys(keys)
    
    def invalidate(self):
        """Force regeneration on next request"""
        self.jwks = None

jwks_cache = JWKSCache(ttl=300)

@app.route('/.well-known/jwks.json')
def jwks_endpoint():
    return jsonify(jwks_cache.get_jwks())
```

### Client Errors

#### Error 1: Not Caching JWKS

**Problem:**
```python
def verify_jwt(jwt_token):
    # Fetch JWKS on EVERY verification (SLOW!)
    jwks = requests.get(jwks_uri).json()
    kid = decode_jwt_header(jwt_token)['kid']
    jwk = find_key_by_kid(jwks, kid)
    verify_signature(jwt_token, jwk)
```

**Impact:** Excessive network requests, high latency.

**Solution:** Cache JWKS as shown in [JWKS Caching Strategy](#jwks-caching-strategy).

#### Error 2: Not Refreshing JWKS on kid Not Found

**Problem:**
```python
def verify_jwt(jwt_token):
    jwks = get_cached_jwks()
    kid = decode_jwt_header(jwt_token)['kid']
    jwk = find_key_by_kid(jwks, kid)
    
    if jwk is None:
        raise KeyNotFoundError(f"Key {kid} not found")
        # Doesn't try refreshing JWKS!
```

**Impact:** Verification failures during key rotation.

**Solution:**
```python
def verify_jwt(jwt_token):
    jwks = get_cached_jwks()
    kid = decode_jwt_header(jwt_token)['kid']
    jwk = find_key_by_kid(jwks, kid)
    
    if jwk is None:
        # Refresh JWKS and retry once
        jwks = fetch_fresh_jwks()
        jwk = find_key_by_kid(jwks, kid)
        
        if jwk is None:
            raise KeyNotFoundError(f"Key {kid} not found even after refresh")
    
    verify_signature(jwt_token, jwk)
```

#### Error 3: Not Validating Algorithm

**Problem:**
```python
def verify_jwt(jwt_token):
    header = decode_jwt_header(jwt_token)
    kid = header['kid']
    alg = header['alg']  # Attacker-controlled!
    
    jwk = get_key(kid)
    verify_signature(jwt_token, jwk, alg)  # Uses attacker's algorithm
```

**Impact:** Algorithm confusion attack.

**Solution:**
```python
ALLOWED_ALGORITHMS = ['RS256', 'ES256']

def verify_jwt(jwt_token):
    header = decode_jwt_header(jwt_token)
    alg = header['alg']
    
    # Validate algorithm BEFORE verification
    if alg not in ALLOWED_ALGORITHMS:
        raise UnsupportedAlgorithmError(f"Algorithm {alg} not allowed")
    
    kid = header['kid']
    jwk = get_key(kid)
    verify_signature(jwt_token, jwk, alg)
```

#### Error 4: Accepting "none" Algorithm

**CRITICAL SECURITY ERROR:**

**Problem:**
```python
# JWT with "none" algorithm (no signature)
{
  "alg": "none",
  "typ": "JWT"
}
```

**Impact:** Anyone can create "valid" tokens with no signature.

**Solution:**
```python
ALLOWED_ALGORITHMS = ['RS256', 'ES256']  # Explicitly list allowed

def verify_jwt(jwt_token):
    header = decode_jwt_header(jwt_token)
    alg = header['alg']
    
    if alg == 'none':
        raise SecurityError("Algorithm 'none' not allowed")
    
    if alg not in ALLOWED_ALGORITHMS:
        raise UnsupportedAlgorithmError(f"Algorithm {alg} not allowed")
```

#### Error 5: Not Handling JWKS Fetch Failures

**Problem:**
```python
def verify_jwt(jwt_token):
    jwks = requests.get(jwks_uri).json()  # What if this fails?
    # No error handling!
```

**Impact:** Service disruption on network issues.

**Solution:**
```python
def verify_jwt(jwt_token):
    try:
        jwks = get_jwks_with_fallback()
    except JWKSUnavailableError:
        # Use cached JWKS if available
        jwks = get_stale_cached_jwks()
        
        if jwks is None:
            raise ServiceUnavailableError("JWKS unavailable and no cache")
        
        logger.warning("Using stale JWKS cache due to fetch failure")
    
    # Proceed with verification
    verify_signature(jwt_token, jwks)
```

---

## Key Compromise Detection and Response

### Detection Methods

#### 1. Intrusion Detection Systems (IDS)

**Indicators:**
- Unusual key access patterns
- Key file modifications
- Unauthorized database queries
- Failed authentication attempts with valid keys

**Monitoring:**
```python
def monitor_key_access(access_log):
    """Monitor for suspicious key access patterns"""
    
    # Check for unusual access times
    if is_outside_business_hours(access_log.timestamp):
        alert('unusual_access_time', access_log)
    
    # Check for unusual access location
    if not is_expected_ip(access_log.ip_address):
        alert('unusual_access_location', access_log)
    
    # Check for unusual access frequency
    if access_log.count_last_hour > 100:
        alert('high_access_frequency', access_log)
```

#### 2. Anomalous Token Issuance

**Detection:**
```python
def detect_anomalous_tokens():
    """Detect unusual token issuance patterns"""
    
    # Check for unusual issuance rate
    recent_tokens = count_tokens_last_hour()
    baseline = get_baseline_token_rate()
    
    if recent_tokens > baseline * 3:
        alert('high_token_issuance', {
            'current': recent_tokens,
            'baseline': baseline
        })
    
    # Check for unusual token parameters
    for token in get_recent_tokens():
        if token.lifetime > MAX_ALLOWED_LIFETIME:
            alert('unusual_token_lifetime', token)
        
        if token.scopes not in EXPECTED_SCOPES:
            alert('unusual_token_scopes', token)
```

#### 3. Security Audit Findings

**Regular Audits:**
- Key storage review
- Access control audit
- Key rotation compliance
- Cryptographic strength assessment

#### 4. Third-Party Disclosure

**Example Scenarios:**
- Security researcher reports vulnerability
- Partner organization reports suspicious tokens
- Threat intelligence indicates compromise

### Response Procedures

**Immediate Actions (0-1 hours):**

1. **Activate Incident Response Team**
   ```python
   def activate_incident_response(incident_type, severity):
       """Activate incident response"""
       # Page on-call team
       page_oncall_team(incident_type, severity)
       
       # Start incident log
       incident_id = create_incident(incident_type, severity)
       
       # Notify stakeholders
       notify_stakeholders(incident_id)
       
       return incident_id
   ```

2. **Assess Scope**
   - Which keys compromised?
   - When was compromise?
   - What data accessed?
   - How many tokens affected?

3. **Emergency Rotation**
   - Follow [Emergency Key Rotation](#emergency-key-rotation) process

**Short-Term Actions (1-24 hours):**

1. **Revoke Affected Tokens**
2. **Investigate Root Cause**
3. **Secure Key Storage**
4. **Notify Affected Users**

**Long-Term Actions (1-4 weeks):**

1. **Post-Mortem Analysis**
2. **Implement Preventive Measures**
3. **Update Incident Response Procedures**
4. **Security Audit Follow-Up**

### Post-Incident Review

**Post-Mortem Template:**

```markdown
# Key Compromise Incident Post-Mortem

## Incident Summary
- **Date:** [Date]
- **Duration:** [Hours]
- **Severity:** [Critical/High/Medium/Low]
- **Keys Affected:** [Key IDs]

## Timeline
- [Time] Detection
- [Time] Incident response activated
- [Time] Emergency rotation started
- [Time] Compromised key removed
- [Time] All tokens revoked
- [Time] Incident resolved

## Root Cause
[Detailed root cause analysis]

## Impact
- **Tokens Affected:** [Number]
- **Users Affected:** [Number]
- **Services Disrupted:** [List]
- **Downtime:** [Duration]

## Response Effectiveness
### What Went Well
- [Points]

### What Needs Improvement
- [Points]

## Action Items
- [ ] [Action 1] - Owner: [Name] - Due: [Date]
- [ ] [Action 2] - Owner: [Name] - Due: [Date]

## Preventive Measures
- [Measure 1]
- [Measure 2]

## Lessons Learned
[Key learnings]
```

---

## JWKS in Different Deployment Scenarios

### Scenario 1: Single Authorization Server

**Architecture:**
```
┌─────────────────────────┐
│ Authorization Server    │
│ - Key storage           │
│ - JWKS endpoint         │
│ - Token signing         │
└─────────────────────────┘
```

**JWKS Management:**
- Simple: One instance
- Keys stored locally or in KMS
- JWKS endpoint serves current keys
- Rotation managed by single instance

**Configuration:**
```python
class SingleServerJWKS:
    def __init__(self):
        self.keys = load_keys_from_storage()
    
    def get_jwks(self):
        return {
            'keys': [key.to_jwk() for key in self.keys]
        }
```

### Scenario 2: Load-Balanced Authorization Servers

**Architecture:**
```
                    ┌──────────────┐
          ┌─────────│Load Balancer │─────────┐
          │         └──────────────┘         │
          │                                  │
    ┌─────▼─────┐                      ┌────▼────┐
    │  AS-1     │                      │  AS-2   │
    └───────────┘                      └─────────┘
          │                                  │
          └──────────┬───────────────────────┘
                     │
              ┌──────▼──────┐
              │ Shared Key  │
              │ Storage (DB)│
              └─────────────┘
```

**Requirements:**
- Shared key storage (database or KMS)
- Consistent JWKS across all instances
- Synchronized key rotation
- Session stickiness not required (JWKS is stateless)

**Implementation:**
```python
class LoadBalancedJWKS:
    def __init__(self, shared_storage):
        self.storage = shared_storage
        self.cache = None
        self.cache_time = None
    
    def get_jwks(self):
        """Get JWKS with caching"""
        # Cache for 5 minutes
        if self.cache and time.time() - self.cache_time < 300:
            return self.cache
        
        # Fetch from shared storage
        keys = self.storage.get_current_keys()
        jwks = {
            'keys': [key.to_jwk() for key in keys]
        }
        
        self.cache = jwks
        self.cache_time = time.time()
        
        return jwks
```

### Scenario 3: Geo-Distributed Deployment

**Architecture:**
```
┌──────────────┐              ┌──────────────┐
│  US Region   │              │  EU Region   │
│  AS Cluster  │◄────────────►│  AS Cluster  │
└──────────────┘              └──────────────┘
       │                             │
       └──────────┬──────────────────┘
                  │
          ┌───────▼────────┐
          │ Global Key DB  │
          │ (Replicated)   │
          └────────────────┘
```

**Challenges:**
- Key synchronization across regions
- Latency considerations
- Disaster recovery

**Solutions:**

1. **Database Replication**
   ```python
   class GeoDistributedJWKS:
       def __init__(self, local_db, global_db):
           self.local_db = local_db  # Read replica
           self.global_db = global_db  # Master
       
       def get_jwks(self):
           """Get JWKS from local replica"""
           return self.local_db.get_jwks()
       
       def rotate_key(self, new_key):
           """Rotate key globally"""
           # Write to master
           self.global_db.add_key(new_key)
           
           # Wait for replication
           self.wait_for_replication(new_key.kid)
   ```

2. **CDN Distribution**
   ```
   Origin (US): https://auth.example.com/.well-known/jwks.json
   CDN Edge: Multiple global locations
   
   Benefits:
   - Low latency globally
   - Automatic caching
   - DDoS protection
   ```

3. **Active-Active Replication**
   - Keys generated in one region
   - Immediately replicated to all regions
   - All regions serve identical JWKS

### Scenario 4: Microservices Architecture

**Architecture:**
```
┌─────────────┐      ┌──────────────┐
│Auth Service │      │ API Gateway  │
│(Issues JWTs)│      │(Verifies JWT)│
└──────┬──────┘      └──────┬───────┘
       │                    │
       │   JWKS             │
       └────────────────────┘
              │
     ┌────────▼────────┐
     │  Service A      │
     │  (Verifies JWT) │
     └────────┬────────┘
              │
     ┌────────▼────────┐
     │  Service B      │
     │  (Verifies JWT) │
     └─────────────────┘
```

**Pattern:**
- Auth service: Manages keys, issues tokens
- Other services: Verify tokens using JWKS
- All services cache JWKS independently

**Service Implementation:**
```python
class MicroserviceJWTVerifier:
    """JWT verification for microservices"""
    
    def __init__(self, jwks_uri):
        self.jwks_client = JWKSClient(jwks_uri, cache_ttl=3600)
    
    def verify_request(self, request):
        """Verify JWT in request"""
        # Extract JWT from Authorization header
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            raise Unauthorized("Missing Bearer token")
        
        jwt_token = auth_header[7:]  # Remove "Bearer "
        
        # Verify JWT
        try:
            self.verify_jwt(jwt_token)
        except Exception as e:
            raise Unauthorized(f"Invalid token: {e}")
    
    def verify_jwt(self, jwt_token):
        """Verify JWT signature and claims"""
        header = decode_jwt_header(jwt_token)
        kid = header['kid']
        
        # Get key from JWKS
        jwk = self.jwks_client.get_key(kid)
        if not jwk:
            raise KeyNotFoundError(f"Key {kid} not found")
        
        # Verify signature
        verify_signature(jwt_token, jwk)
        
        # Verify claims
        claims = decode_jwt_claims(jwt_token)
        validate_claims(claims)
```

---

## Testing and Validation

### Test Scenarios

#### 1. Verify JWT with Correct Key

**Test:**
```python
def test_verify_jwt_with_correct_key():
    """Verify JWT with matching key in JWKS"""
    # Setup
    private_key, public_key = generate_rsa_keypair()
    kid = "test-key-2024"
    
    # Create JWKS
    jwks = {
        'keys': [
            create_jwk_from_public_key(public_key, kid)
        ]
    }
    
    # Create JWT
    jwt_token = create_jwt(
        claims={'sub': 'user123'},
        private_key=private_key,
        kid=kid
    )
    
    # Verify
    assert verify_jwt(jwt_token, jwks) == True
```

#### 2. JWT with Unknown kid

**Test:**
```python
def test_jwt_with_unknown_kid():
    """Verify JWT with kid not in JWKS triggers refresh"""
    # Setup
    private_key_old, public_key_old = generate_rsa_keypair()
    private_key_new, public_key_new = generate_rsa_keypair()
    
    # Initial JWKS (only old key)
    jwks_old = {
        'keys': [create_jwk_from_public_key(public_key_old, "old-key")]
    }
    
    # Updated JWKS (both keys)
    jwks_new = {
        'keys': [
            create_jwk_from_public_key(public_key_old, "old-key"),
            create_jwk_from_public_key(public_key_new, "new-key")
        ]
    }
    
    # Mock JWKS client
    client = MockJWKSClient(jwks_old)
    
    # Create JWT with new key
    jwt_token = create_jwt(
        claims={'sub': 'user123'},
        private_key=private_key_new,
        kid="new-key"
    )
    
    # First verification fails (kid not found)
    with pytest.raises(KeyNotFoundError):
        client.verify_jwt(jwt_token)
    
    # Client should refresh JWKS
    client.set_jwks(jwks_new)
    
    # Second verification succeeds
    assert client.verify_jwt(jwt_token) == True
    assert client.fetch_count == 2  # Refreshed once
```

#### 3. JWT with Wrong Algorithm

**Test:**
```python
def test_jwt_with_wrong_algorithm():
    """Reject JWT with disallowed algorithm"""
    # Setup
    private_key, public_key = generate_rsa_keypair()
    
    jwks = {
        'keys': [create_jwk_from_public_key(public_key, "test-key")]
    }
    
    # Create JWT with HS256 (symmetric)
    jwt_token = create_jwt_hmac(
        claims={'sub': 'user123'},
        secret='secret',
        alg='HS256',
        kid='test-key'
    )
    
    # Verify with allowed algorithms (only RS256)
    with pytest.raises(AlgorithmNotAllowedError):
        verify_jwt(jwt_token, jwks, allowed_algorithms=['RS256'])
```

#### 4. JWKS Unavailable

**Test:**
```python
def test_jwks_unavailable_uses_cache():
    """Use cached JWKS when endpoint unavailable"""
    # Setup
    client = JWKSClient('https://auth.example.com/.well-known/jwks.json')
    
    # Initial successful fetch
    jwks = client.get_jwks()
    assert jwks is not None
    
    # Simulate JWKS endpoint down
    mock_network_error()
    
    # Should use cached JWKS
    jwks_cached = client.get_jwks()
    assert jwks_cached == jwks
    
    # Verify warning logged
    assert "Using stale JWKS cache" in logs
```

#### 5. Key Rotation Verification

**Test:**
```python
def test_key_rotation():
    """Verify tokens during key rotation"""
    # Phase 1: Old key only
    jwks_phase1 = {
        'keys': [create_jwk("old-key")]
    }
    
    token_old = create_jwt(private_key_old, kid="old-key")
    assert verify_jwt(token_old, jwks_phase1)
    
    # Phase 2: Both keys (rotation in progress)
    jwks_phase2 = {
        'keys': [
            create_jwk("old-key"),
            create_jwk("new-key")
        ]
    }
    
    token_new = create_jwt(private_key_new, kid="new-key")
    assert verify_jwt(token_old, jwks_phase2)  # Old still works
    assert verify_jwt(token_new, jwks_phase2)  # New works
    
    # Phase 3: New key only
    jwks_phase3 = {
        'keys': [create_jwk("new-key")]
    }
    
    with pytest.raises(KeyNotFoundError):
        verify_jwt(token_old, jwks_phase3)  # Old fails
    
    assert verify_jwt(token_new, jwks_phase3)  # New works
```

### Validation Checklist

**JWKS Endpoint:**
- [ ] Endpoint accessible via HTTPS
- [ ] Returns valid JSON
- [ ] Contains 'keys' array
- [ ] All keys have required fields (kty, kid)
- [ ] No private key parameters exposed
- [ ] Cache-Control headers set appropriately
- [ ] CORS headers configured (if needed)
- [ ] Rate limiting implemented
- [ ] Monitoring enabled

**Key Structure:**
- [ ] kid present and unique
- [ ] kty valid (RSA, EC, oct)
- [ ] use field set to "sig"
- [ ] alg field matches intended algorithm
- [ ] RSA keys: n and e present
- [ ] EC keys: crv, x, y present
- [ ] No private parameters (d, p, q, etc.)

**JWT Verification:**
- [ ] JWT header contains kid
- [ ] kid found in JWKS
- [ ] Algorithm validated against allowlist
- [ ] Signature verification succeeds
- [ ] JWKS cached appropriately
- [ ] Refresh on kid not found implemented
- [ ] Error handling for JWKS unavailability

**Key Rotation:**
- [ ] New key added to JWKS before use
- [ ] Old key remains during grace period
- [ ] Old key removed after tokens expire
- [ ] No verification failures during rotation
- [ ] Monitoring alerts configured
- [ ] Rollback plan documented

**Security:**
- [ ] HTTPS enforced
- [ ] Private keys secured (HSM/KMS)
- [ ] Access controls implemented
- [ ] Key access logged
- [ ] Regular key rotation scheduled
- [ ] Incident response procedures documented

---

## Related Specifications

### Primary Specifications

1. **RFC 7517: JSON Web Key (JWK)**
   - URL: https://www.rfc-editor.org/rfc/rfc7517.html
   - Sections:
     - §4: JSON Web Key (JWK) Format
     - §4.1-4.8: JWK Parameters
     - §5: JWK Set Format
     - §6-8: String Comparison, Encrypted JWK, URI for JWK Sets

2. **RFC 7518: JSON Web Algorithms (JWA)**
   - URL: https://www.rfc-editor.org/rfc/rfc7518.html
   - Sections:
     - §3: Cryptographic Algorithms for Keys
     - §6: Cryptographic Algorithms for JWK
     - §6.2: Parameters for Elliptic Curve Keys
     - §6.3: Parameters for RSA Keys

3. **RFC 7515: JSON Web Signature (JWS)**
   - URL: https://www.rfc-editor.org/rfc/rfc7515.html
   - Sections:
     - §4.1.4: "kid" (Key ID) Header Parameter
     - §5: Producing and Consuming JWSs
     - §7: Key Identification

4. **OpenID Connect Core 1.0**
   - URL: https://openid.net/specs/openid-connect-core-1_0.html
   - Section §10: Key Management
   - Section §10.1.1: Rotation of Asymmetric Signing Keys

### Supporting Specifications

5. **RFC 8037: CFRG Elliptic Curve Signatures (EdDSA)**
   - For Ed25519/Ed448 keys

6. **RFC 7516: JSON Web Encryption (JWE)**
   - For encryption keys (use="enc")

7. **NIST SP 800-57: Key Management Recommendations**
   - Key lifecycle management
   - Key rotation best practices

---

## Example Scenarios

### Scenario 1: Client Verifies ID Token Using JWKS

**Flow:**
```python
# 1. Client receives ID token
id_token = "eyJhbGc...payload...signature"

# 2. Decode header to get kid
header = decode_jwt_header(id_token)
kid = header['kid']  # "2024-04-rsa"

# 3. Fetch JWKS (cached)
jwks_client = JWKSClient('https://auth.example.com/.well-known/jwks.json')
jwk = jwks_client.get_key(kid)

# 4. Construct public key from JWK
public_key = construct_public_key_from_jwk(jwk)

# 5. Verify signature
verify_signature(id_token, public_key, header['alg'])

# 6. Decode and validate claims
claims = decode_jwt_claims(id_token)
validate_claims(claims)

print(f"Token verified for user: {claims['sub']}")
```

### Scenario 2: Authorization Server Rotates Signing Key

**Zero-Downtime Rotation:**

```python
# Day 0: Add new key
new_key = generate_rsa_keypair()
new_kid = "2024-04-rsa"

# Add to JWKS
jwks_manager.add_key(new_key, new_kid)

# JWKS now: [2024-01-rsa, 2024-04-rsa]
print("New key added to JWKS")

# Day 1: Start signing with new key
config.signing_key_id = new_kid
deploy_authorization_server()

print("Now signing with new key")

# Day 1-30: Both keys in JWKS
# Old tokens: verified with 2024-01-rsa
# New tokens: verified with 2024-04-rsa

# Day 30: Remove old key
jwks_manager.remove_key("2024-01-rsa")

print("Old key removed, rotation complete")
```

### Scenario 3: Emergency Key Rotation After Compromise

**Immediate Response:**

```python
# ALERT: Key compromise detected
print("SECURITY ALERT: Key compromise detected")

# 1. Generate emergency key
emergency_key = generate_rsa_keypair()
emergency_kid = f"emergency-{datetime.now().strftime('%Y%m%d')}"

# 2. Add to JWKS immediately
jwks_manager.add_key(emergency_key, emergency_kid)

# 3. Start signing with emergency key
config.signing_key_id = emergency_kid
deploy_authorization_server_emergency()

# 4. Remove compromised key
compromised_kid = "2024-01-rsa"
jwks_manager.remove_key(compromised_kid)

# 5. Revoke all tokens signed with compromised key
revoke_tokens_by_key(compromised_kid)

print(f"Emergency rotation complete. Compromised key {compromised_kid} removed.")
```

### Scenario 4: Algorithm Migration (RS256 → ES256)

**Gradual Migration:**

```python
# Phase 1: Add ES256 key
ec_key = generate_ec_keypair(curve='P-256')
ec_kid = "2024-04-ec"

jwks_manager.add_key(ec_key, ec_kid)

# JWKS: [rsa-2024-01 (RS256), ec-2024-04 (ES256)]

# Phase 2: Gradual rollout (20% ES256)
def select_signing_algorithm():
    if random.random() < 0.20:
        return 'ES256', ec_kid
    else:
        return 'RS256', rsa_kid

# Monitor ES256 adoption

# Phase 3: Increase ES256 percentage over time
# Week 1: 20%
# Week 2: 40%
# Week 3: 60%
# Week 4: 80%
# Week 5: 100%

# Phase 4: Remove RS256 key (after full migration)
jwks_manager.remove_key(rsa_kid)

print("Algorithm migration complete: RS256 → ES256")
```

### Scenario 5: kid Not Found - Client Refreshes JWKS

**Client Behavior:**

```python
def verify_jwt_with_refresh(jwt_token):
    """Verify JWT with automatic JWKS refresh"""
    header = decode_jwt_header(jwt_token)
    kid = header['kid']
    
    # Try with cached JWKS
    jwk = jwks_cache.get_key(kid)
    
    if jwk is None:
        print(f"Kid {kid} not in cache, refreshing JWKS")
        
        # Refresh JWKS
        jwks_cache.refresh()
        
        # Retry
        jwk = jwks_cache.get_key(kid)
        
        if jwk is None:
            raise KeyNotFoundError(f"Kid {kid} not found even after refresh")
        
        print(f"Kid {kid} found after refresh")
    
    # Verify signature
    verify_signature(jwt_token, jwk)
    
    return True
```

### Scenario 6: JWKS Caching for Performance

**High-Performance Caching:**

```python
class HighPerformanceJWKSClient:
    """JWKS client optimized for high throughput"""
    
    def __init__(self, jwks_uri):
        self.jwks_uri = jwks_uri
        
        # In-memory cache with index
        self.key_by_kid = {}
        self.last_refresh = 0
        self.refresh_interval = 3600  # 1 hour
        
        # Pre-load JWKS
        self.refresh_jwks()
    
    def get_key(self, kid):
        """O(1) key lookup"""
        # Check if refresh needed
        if time.time() - self.last_refresh > self.refresh_interval:
            self.refresh_jwks()
        
        return self.key_by_kid.get(kid)
    
    def refresh_jwks(self):
        """Refresh JWKS in background"""
        jwks = fetch_jwks(self.jwks_uri)
        
        # Rebuild index
        new_index = {}
        for jwk in jwks['keys']:
            if 'kid' in jwk:
                new_index[jwk['kid']] = jwk
        
        self.key_by_kid = new_index
        self.last_refresh = time.time()

# Performance test
client = HighPerformanceJWKSClient(jwks_uri)

start = time.time()
for i in range(10000):
    kid = f"key-{i % 10}"
    jwk = client.get_key(kid)
end = time.time()

print(f"10,000 lookups in {end - start:.3f} seconds")
# Result: ~0.001 seconds (O(1) lookup)
```

### Scenario 7: Multi-Tenant with Unique Keys

**Tenant-Specific Keys:**

```python
# Tenant A receives token
tenant_a_token = "eyJhbGc...tenant-a-key..."
header = decode_jwt_header(tenant_a_token)
kid = header['kid']  # "tenant-a-2024-01"

# Extract tenant from kid
tenant_id = kid.split('-')[0] + '-' + kid.split('-')[1]  # "tenant-a"

# Fetch tenant-specific JWKS
jwks_uri = f"https://auth.example.com/{tenant_id}/.well-known/jwks.json"
jwks = fetch_jwks(jwks_uri)

# Find key
jwk = find_key_by_kid(jwks, kid)

# Verify
verify_signature(tenant_a_token, jwk)

print(f"Token verified for tenant: {tenant_id}")
```

---

## Conclusion

JWKS (JSON Web Key Sets) and proper key rotation are fundamental to secure JWT-based authentication. This document has covered the complete lifecycle of cryptographic keys in OAuth2/OIDC systems, from generation through rotation to retirement.

**Key Takeaways:**

1. **Always Include kid:** JWT headers MUST include `kid` for key identification
2. **Cache JWKS:** Cache with appropriate TTL (1-24 hours) for performance
3. **Refresh on Unknown kid:** Automatically refresh JWKS when kid not found
4. **Rotate Regularly:** Quarterly rotation recommended for production systems
5. **Zero-Downtime Rotation:** Use three-phase process (add, transition, remove)
6. **Never Expose Private Keys:** JWKS contains only public keys
7. **Validate Algorithms:** Always validate algorithm against allowlist
8. **Use HTTPS:** JWKS endpoint MUST use HTTPS
9. **Monitor and Alert:** Track JWKS usage and key rotation health
10. **Plan for Emergencies:** Have documented emergency rotation procedures

**Security Principles:**

- **Defense in Depth:** Multiple layers of security (HTTPS, algorithm validation, key rotation)
- **Least Privilege:** Restrict key access to minimum necessary
- **Regular Rotation:** Limit impact of potential compromise
- **Monitoring:** Detect anomalies early
- **Incident Response:** Be prepared for key compromise

**Implementation Priority:**

1. Implement JWKS endpoint with current keys
2. Add kid to all JWT headers
3. Implement JWKS caching in clients
4. Set up regular key rotation (quarterly)
5. Document emergency rotation procedures
6. Enable monitoring and alerting
7. Test disaster recovery procedures

For questions or issues, refer to the primary specifications (RFC 7517, RFC 7518, RFC 7515) or consult with your security team.

---

**Document Version:** 1.0
**Last Updated:** 2024
**Specification References:**
- RFC 7517 (JSON Web Key - JWK)
- RFC 7518 (JSON Web Algorithms - JWA)
- RFC 7515 (JSON Web Signature - JWS)
- OpenID Connect Core §10 (Key Management)

Perfect! I've created the first part of your comprehensive JWKS and Key Rotation specification reference. Due to the character limit, I need to continue with the remaining sections. Let me complete the document...
