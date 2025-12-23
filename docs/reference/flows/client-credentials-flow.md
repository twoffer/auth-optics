# Client Credentials Flow

## Specification Reference for OAuth2/OIDC Debugging Tool

> *"In the beginning, machines were created to talk to other machines. This has made a lot of authentication architects very happy and been widely regarded as a good move. Unlike the Resource Owner Password flow, which was a mistake."*

---

## 1. Overview

The Client Credentials Flow is OAuth 2.0's streamlined grant type for machine-to-machine authentication. Unlike flows involving users, browsers, and consent screens, this flow cuts straight to the chase: a confidential client authenticates directly with the authorization server and receives an access token representing its own identity and permissions.

**No users. No redirects. No nonsense.**

This flow operates on a simple principle: if you can prove you are who you say you are (via client credentials), and you're authorized to do what you want to do (via scopes), then here's your token. Go forth and automate.

### When to Use This Flow

| Scenario | Use Client Credentials? | Why |
|----------|------------------------|-----|
| Backend service calling another backend service | ✅ Yes | Perfect match - no user context needed |
| Microservice authentication | ✅ Yes | Services authenticate as themselves |
| Daemon process accessing APIs | ✅ Yes | Long-running processes without user interaction |
| CLI tool for administrative tasks | ✅ Yes | Tool acts on its own authority, not user's |
| Scheduled jobs/cron tasks | ✅ Yes | Automated processes with service account |
| IoT gateway aggregating data | ✅ Yes | Device acts as service, not on behalf of user |
| Service accessing its own resources | ✅ Yes | Classic use case |
| **User authentication** | ❌ **NO** | Use Authorization Code Flow instead |
| **Actions on behalf of user** | ❌ **NO** | Need user's authorization, not service's |
| **Frontend applications (SPA, mobile)** | ❌ **NO** | Cannot securely store client_secret |
| **Public clients** | ❌ **NO** | Only confidential clients allowed |

### When NOT to Use This Flow

The Client Credentials Flow is inappropriate (and dangerous) when:

1. **User identity matters** - If you need to know *who* is performing an action (audit trails, personalization, authorization decisions based on user), you need a user-centric flow
2. **User authorization required** - If users need to consent to access their data, you need Authorization Code Flow
3. **Public clients** - If your client cannot securely store a secret (SPAs, mobile apps, native apps distributed to users), this flow is impossible and dangerous
4. **Delegated access** - If you're accessing resources on behalf of a user, use Authorization Code Flow to get user-consented tokens

### Primary Specifications

| Specification | Sections | Purpose |
|---------------|----------|---------|
| RFC 6749 | §4.4 (complete), §2.3, §3.2 | Core Client Credentials Grant |
| OAuth 2.1 | §4.2 | Updated requirements |
| RFC 6819 | §4.5.2 | Threat model for client credential theft |
| Security BCP (draft-ietf-oauth-security-topics-27) | §4.11 | Security considerations |
| RFC 7523 | Complete | JWT Bearer Token authentication |

---

## 2. Flow Diagram

### Complete Sequence (3 Steps)

```
┌──────────────────┐                                    ┌──────────────────┐
│                  │                                    │                  │
│  Client          │                                    │  Authorization   │
│  Application     │                                    │  Server          │
│  (Service)       │                                    │  (Token          │
│                  │                                    │   Endpoint)      │
└────────┬─────────┘                                    └────────┬─────────┘
         │                                                       │
         │  ╔════════════════════════════════════════════════════════════╗
         │                      STEP 1: Token Request                    │
         │  ╚════════════════════════════════════════════════════════════╝
         │                                                       │
         │  (1) POST to Token Endpoint                          │
         │      with Client Credentials                         │
         │      grant_type=client_credentials                   │
         │      &scope=...                                      │
         │                                                       │
         │      Authentication via:                             │
         │        - HTTP Basic Auth (client_secret_basic), OR   │
         │        - POST body (client_secret_post), OR          │
         │        - JWT assertion (private_key_jwt), OR         │
         │        - mTLS certificate                            │
         │  ─────────────────────────────────────────────────►  │
         │                                                       │
         │  ╔════════════════════════════════════════════════════════════╗
         │                    STEP 2: Server Validation                  │
         │  ╚════════════════════════════════════════════════════════════╝
         │                                                       │
         │                                      ┌────────────────┴─────────────┐
         │                                      │ Validate:                    │
         │                                      │  • Client credentials        │
         │                                      │  • grant_type = "client_..." │
         │                                      │  • Requested scopes          │
         │                                      │  • Client authorized for     │
         │                                      │    requested scopes          │
         │                                      └────────────────┬─────────────┘
         │                                                       │
         │  ╔════════════════════════════════════════════════════════════╗
         │                     STEP 3: Token Response                    │
         │  ╚════════════════════════════════════════════════════════════╝
         │                                                       │
         │  (3) Token Response (JSON)                           │
         │      {                                               │
         │        "access_token": "...",                        │
         │        "token_type": "Bearer",                       │
         │        "expires_in": 3600,                           │
         │        "scope": "..."                                │
         │      }                                               │
         │      Note: NO refresh_token (RFC 6749 §4.4.3)       │
         │  ◄─────────────────────────────────────────────────  │
         │                                                       │
         ▼                                                       ▼

┌──────────────────┐                                    ┌──────────────────┐
│                  │                                    │                  │
│  Client uses     │  ─────────────────────────────►    │  Resource        │
│  access_token to │   Authorization: Bearer TOKEN      │  Server          │
│  access resource │  ◄─────────────────────────────    │                  │
│                  │       Protected Resource           │                  │
└──────────────────┘                                    └──────────────────┘
```

### Key Differences from User-Centric Flows

| Aspect | Client Credentials | Authorization Code |
|--------|-------------------|-------------------|
| User interaction | **None** | Required (authentication + consent) |
| Authorization endpoint | **Not used** | Required |
| Number of requests | **1** (direct to token endpoint) | 2 (authz endpoint, then token endpoint) |
| Redirect URIs | **Not needed** | Required |
| Browser required | **No** | Yes |
| PKCE | **N/A** | Required (OAuth 2.1) |
| state parameter | **N/A** | Required for CSRF protection |
| Token represents | **Client identity** | User identity + client |
| Refresh tokens | **MUST NOT be issued** | May be issued |

---

## 3. Token Request Specification (RFC 6749 §4.4.2)

The client makes a direct POST request to the token endpoint with client credentials.

### HTTP Method and Endpoint

```http
POST /token HTTP/1.1
Host: authorization-server.example.com
Content-Type: application/x-www-form-urlencoded
```

### Parameters

| Parameter | RFC 2119 | Description | Spec Reference |
|-----------|----------|-------------|----------------|
| `grant_type` | **REQUIRED** | MUST be set to `client_credentials` | RFC 6749 §4.4.2 |
| `scope` | OPTIONAL | Space-delimited list of requested scopes | RFC 6749 §4.4.2, §3.3 |

> **Critical:** Unlike other flows, there is no `code`, `redirect_uri`, or `code_verifier`. The client authenticates via the client authentication mechanism, not request parameters.

### Client Authentication Methods (RFC 6749 §2.3)

The client MUST authenticate with the authorization server using one of these methods:

| Method | Description | Security | Spec Reference |
|--------|-------------|----------|----------------|
| `client_secret_basic` | HTTP Basic Authentication with `client_id:client_secret` | Medium (secret in transit) | RFC 6749 §2.3.1 |
| `client_secret_post` | `client_id` and `client_secret` in POST body | Medium (secret in request body) | RFC 6749 §2.3.1 |
| `client_secret_jwt` | JWT signed with `client_secret` (HMAC) | High (secret never transmitted) | RFC 7523 |
| `private_key_jwt` | JWT signed with private key (RSA/EC) | **Highest** (asymmetric, no shared secret) | RFC 7523 |
| `tls_client_auth` | mTLS certificate authentication | High (certificate-based) | RFC 8705 |

#### Method 1: client_secret_basic (HTTP Basic Auth)

The client_id and client_secret are combined as `client_id:client_secret`, Base64-encoded, and sent in the Authorization header.

```http
POST /token HTTP/1.1
Host: authorization-server.example.com
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&scope=read:api%20write:api
```

**Base64 encoding:**
```
client_id:client_secret → s6BhdRkqt3:gX1fBat3bV
Base64("s6BhdRkqt3:gX1fBat3bV") → czZCaGRSa3F0MzpnWDFmQmF0M2JW
```

**Security note:** Despite the name "Basic," this requires HTTPS. The secret is Base64-encoded (easily decoded), not encrypted.

#### Method 2: client_secret_post (POST Body)

The client_id and client_secret are included in the POST body as form parameters.

```http
POST /token HTTP/1.1
Host: authorization-server.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=s6BhdRkqt3
&client_secret=gX1fBat3bV
&scope=read:api%20write:api
```

**Security note:** Slightly more vulnerable than Basic Auth as credentials may be logged in server request logs. Always use HTTPS.

#### Method 3: private_key_jwt (Asymmetric Key)

The client generates a signed JWT assertion using its private key. This is the **most secure** method as the secret (private key) never leaves the client.

**JWT Header:**
```json
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "client-key-1"
}
```

**JWT Payload (Claims):**
```json
{
  "iss": "s6BhdRkqt3",
  "sub": "s6BhdRkqt3",
  "aud": "https://authorization-server.example.com/token",
  "jti": "unique-jwt-id-12345",
  "exp": 1638360000,
  "iat": 1638359400
}
```

| Claim | RFC 2119 | Description | Spec Reference |
|-------|----------|-------------|----------------|
| `iss` | **REQUIRED** | Issuer - MUST be the client_id | RFC 7523 §3.1 |
| `sub` | **REQUIRED** | Subject - MUST be the client_id | RFC 7523 §3.1 |
| `aud` | **REQUIRED** | Audience - token endpoint URL | RFC 7523 §3.1 |
| `jti` | **REQUIRED** | JWT ID - unique identifier for replay prevention | RFC 7523 §3.1 |
| `exp` | **REQUIRED** | Expiration time (Unix timestamp) | RFC 7523 §3.1 |
| `iat` | OPTIONAL | Issued at time (Unix timestamp) | RFC 7523 §3.1 |

**HTTP Request:**
```http
POST /token HTTP/1.1
Host: authorization-server.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&scope=read:api%20write:api
&client_assertion_type=urn%3Aietf%3Aparams%3Aoauth%3Aclient-assertion-type%3Ajwt-bearer
&client_assertion=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImNsaWVudC1rZXktMSJ9.eyJpc3MiOiJzNkJoZFJrcXQzIiwic3ViIjoiczZCaGRSa3F0MyIsImF1ZCI6Imh0dHBzOi8vYXV0aG9yaXphdGlvbi1zZXJ2ZXIuZXhhbXBsZS5jb20vdG9rZW4iLCJqdGkiOiJ1bmlxdWUtand0LWlkLTEyMzQ1IiwiZXhwIjoxNjM4MzYwMDAwLCJpYXQiOjE2MzgzNTk0MDB9.signature_here
```

**Advantages of private_key_jwt:**
- Private key never transmitted
- No shared secrets to rotate or leak
- Standard public key infrastructure (PKI)
- Supports key rotation without coordination
- Replay protection via `jti` claim

#### Method 4: client_secret_jwt (Symmetric Key)

Similar to `private_key_jwt`, but uses HMAC with the client_secret instead of asymmetric keys.

```http
POST /token HTTP/1.1
Host: authorization-server.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&scope=read:api
&client_assertion_type=urn%3Aietf%3Aparams%3Aoauth%3Aclient-assertion-type%3Ajwt-bearer
&client_assertion=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzNkJoZFJrcXQzIiwic3ViIjoiczZCaGRSa3F0MyIsImF1ZCI6Imh0dHBzOi8vYXV0aG9yaXphdGlvbi1zZXJ2ZXIuZXhhbXBsZS5jb20vdG9rZW4iLCJqdGkiOiJ1bmlxdWUtand0LWlkLTY3ODkwIiwiZXhwIjoxNjM4MzYwMDAwfQ.signature_here
```

### Parameter Validation Rules

| Rule | Validation | Spec Reference |
|------|------------|----------------|
| grant_type | MUST equal `"client_credentials"` (exact match) | RFC 6749 §4.4.2 |
| scope | If present, MUST be valid space-delimited list | RFC 6749 §3.3 |
| scope values | MUST NOT request scopes the client is not authorized for | RFC 6749 §4.4.2 |
| Client authentication | Client MUST successfully authenticate via one of the supported methods | RFC 6749 §3.2.1 |
| HTTPS | Token endpoint MUST use TLS (except localhost development) | RFC 6749 §1.6 |

---

## 4. Token Response Specification (RFC 6749 §4.4.3)

### Success Response Parameters

| Parameter | RFC 2119 | Description | Spec Reference |
|-----------|----------|-------------|----------------|
| `access_token` | **REQUIRED** | The access token issued by the authorization server | RFC 6749 §5.1 |
| `token_type` | **REQUIRED** | Token type (typically `Bearer`) | RFC 6749 §5.1, RFC 6750 |
| `expires_in` | RECOMMENDED | Lifetime in seconds (e.g., 3600 for 1 hour) | RFC 6749 §5.1 |
| `scope` | OPTIONAL* | Scope of the access token | RFC 6749 §5.1 |

> \* `scope` is OPTIONAL if identical to requested scope. If the authorization server grants a different scope than requested, it MUST include the `scope` parameter to inform the client (RFC 6749 §5.1).

#### Critical Restriction: No Refresh Tokens

**Per RFC 6749 §4.4.3:** The authorization server MUST NOT issue a refresh token in response to a client credentials grant.

**Rationale:** Refresh tokens are designed to avoid re-prompting users for authentication. Since there is no user in this flow, and the client can simply re-authenticate using its credentials whenever needed, refresh tokens serve no purpose and represent an unnecessary security risk.

If your client credentials token expires, simply request a new one using the same credentials.

### Example Success Response

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
Pragma: no-cache

{
  "access_token": "2YotnFZFEjr1zCsicMWpAA",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "read:api write:api"
}
```

### Error Response Parameters (RFC 6749 §5.2)

| Parameter | RFC 2119 | Description |
|-----------|----------|-------------|
| `error` | **REQUIRED** | Error code from table below |
| `error_description` | OPTIONAL | Human-readable error description |
| `error_uri` | OPTIONAL | URI to error documentation page |

### Error Codes (RFC 6749 §5.2)

| Error Code | Description | Common Causes |
|------------|-------------|---------------|
| `invalid_request` | Request is malformed or missing required parameters | Missing `grant_type`, invalid Content-Type |
| `invalid_client` | Client authentication failed | Wrong client_id, wrong client_secret, expired JWT assertion |
| `invalid_grant` | Grant is invalid (not applicable for client_credentials, but included in spec) | N/A for this flow |
| `unauthorized_client` | Client is not authorized to use this grant type | Client not configured for client_credentials |
| `unsupported_grant_type` | Authorization server doesn't support this grant type | `grant_type` value is not `client_credentials` |
| `invalid_scope` | Requested scope is invalid, unknown, or exceeds client's authorized scope | Typo in scope, requesting scope client isn't registered for |

### Example Error Responses

#### invalid_client (Authentication Failed)

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Basic realm="Authorization Server"
Content-Type: application/json
Cache-Control: no-store

{
  "error": "invalid_client",
  "error_description": "Client authentication failed"
}
```

#### invalid_scope (Requesting Unauthorized Scope)

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json
Cache-Control: no-store

{
  "error": "invalid_scope",
  "error_description": "The requested scope 'admin:all' exceeds the client's authorized scopes"
}
```

#### unauthorized_client (Wrong Grant Type)

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json
Cache-Control: no-store

{
  "error": "unauthorized_client",
  "error_description": "The authenticated client is not authorized to use grant_type=client_credentials"
}
```

---

## 5. Client Credentials Deep Dive

### 5.1 Client Types: Confidential Only

**Per RFC 6749 §2.1:** Only confidential clients can use the Client Credentials Flow.

| Client Type | Can Use Client Credentials? | Why |
|-------------|---------------------------|-----|
| Confidential Client | ✅ Yes | Can securely store credentials (backend servers, secure services) |
| Public Client | ❌ No | Cannot securely store credentials (SPAs, mobile apps, native apps) |

**Confidential client examples:**
- Backend web servers
- Microservices running in secure environments
- Daemon processes on secured servers
- Internal tools with protected credential storage

**Why public clients are prohibited:**
The entire security model relies on the client proving its identity via a secret. If that secret can be extracted (decompiled from app, read from JavaScript, etc.), any attacker can impersonate the client.

### 5.2 Credential Management

#### Secret Rotation Strategies

| Strategy | Frequency | Implementation | Risk Level |
|----------|-----------|----------------|------------|
| Manual rotation | Annually / when compromised | Admin manually updates secret in both IdP and client | Low risk if done correctly, high risk if delayed |
| Automated rotation | Every 30-90 days | Script updates secret in IdP, pushes to secret manager | Low risk, requires automation infrastructure |
| Dual secrets | Continuous | Two secrets valid simultaneously during rotation period | Lowest risk, zero downtime |
| Certificate-based (`private_key_jwt`) | Per certificate policy (1-2 years) | Use PKI infrastructure for key lifecycle | Lowest risk, best practice |

**Dual secret rotation flow:**
```
Day 0:   secret_1 (active), secret_2 (none)
Day 30:  Generate secret_2, register with IdP → secret_1 (active), secret_2 (valid)
Day 31:  Deploy secret_2 to clients → Both secrets work
Day 32:  Verify all clients using secret_2 → Both secrets work
Day 33:  Revoke secret_1 → secret_2 (active)
Day 60:  Repeat with secret_1...
```

#### Secret Storage Requirements

| Storage Method | Security | Appropriate For |
|---------------|----------|-----------------|
| **Environment variables** | Medium | Development, containerized apps with secure env injection |
| **Secret management systems** (HashiCorp Vault, AWS Secrets Manager, Azure Key Vault) | **High** | **Production (recommended)** |
| **Configuration files** (encrypted at rest) | Medium-Low | Legacy systems, with strict file permissions |
| **Configuration files** (plaintext) | ❌ **Unacceptable** | Never use |
| **Source code / version control** | ❌ **Unacceptable** | Never use |
| **Hardware Security Modules (HSM)** | Very High | High-security requirements, financial services |

**Best practices:**
- Use secret management systems in production
- Rotate secrets regularly
- Audit secret access
- Never log secrets
- Use least-privilege access to secrets
- Encrypt secrets at rest and in transit

#### Asymmetric Key Advantages (private_key_jwt)

| Advantage | Description |
|-----------|-------------|
| **No shared secrets** | Private key never leaves the client, public key stored on server |
| **PKI infrastructure** | Leverage existing certificate management systems |
| **Easier rotation** | Update public key on server without coordinating secret distribution |
| **Cryptographic strength** | RSA/EC keys more secure than shared secrets |
| **Audit trail** | JWT contains client identity and timestamp, non-repudiation |
| **Multi-server support** | Same private key can authenticate to multiple authorization servers |

**Migration path:** If using `client_secret_basic` or `client_secret_post`, consider migrating to `private_key_jwt` for enhanced security.

### 5.3 Scope Limitations

#### No User Context

**Critical principle:** Client credentials tokens represent the **client's identity**, not any user.

| Flow | Token Represents | Example Scope |
|------|-----------------|---------------|
| Client Credentials | **Client itself** | `service:backup`, `api:internal`, `reports:generate` |
| Authorization Code | **User + Client** | `user:email`, `calendar:read`, `contacts:write` |

**Anti-pattern example:**
```json
// ❌ WRONG: Client credentials requesting user scopes
{
  "grant_type": "client_credentials",
  "scope": "user:read user:write"  // These imply USER actions!
}
```

**Correct example:**
```json
// ✅ CORRECT: Client credentials requesting service scopes
{
  "grant_type": "client_credentials",
  "scope": "service:backup service:monitoring"  // Service capabilities
}
```

#### Scope Design for Service Accounts

| Scope Type | Example | Description |
|------------|---------|-------------|
| Service capabilities | `service:backup`, `service:sync` | What the service can do |
| Resource-level | `api:read`, `api:write`, `api:delete` | Operations on resources |
| Domain-specific | `payments:process`, `reports:generate` | Business domain capabilities |
| **Avoid: User-specific** | ❌ `user:profile`, `user:email` | Implies acting as/for a user |

**Authorization server responsibility:** Scope validation MUST ensure clients cannot request scopes that imply user actions.

### 5.4 Token Lifetime Considerations

| Token Lifetime | Appropriate For | Rationale |
|---------------|-----------------|-----------|
| 5-15 minutes | **High-frequency API calls** (microservices) | Minimize blast radius if token stolen, minimal performance impact due to caching |
| 1 hour | **Moderate-frequency API calls** | Balance between security and token request overhead |
| 8-24 hours | **Batch jobs, scheduled tasks** | Reduces token requests for long-running processes |
| > 24 hours | ❌ Generally not recommended | Excessive risk if token compromised |

**Key consideration:** Unlike user tokens, there's no refresh token, so the client will need to re-authenticate when the token expires. Balance:
- **Security:** Shorter lifetimes limit damage from token theft
- **Performance:** Longer lifetimes reduce token endpoint requests
- **Token caching:** Clients SHOULD cache tokens and reuse until near expiration

**Best practice:** 
```
Token lifetime = 2 × expected_job_duration (with reasonable maximum)
```

For continuous services, use short lifetimes (5-60 minutes) and implement automatic token renewal before expiration.

---

## 6. Security Threat Model for This Flow

### 6.1 Client Credential Theft (RFC 6819 §4.5.2)

#### Attack Description

An attacker gains access to the client's credentials (client_secret or private key) and uses them to impersonate the legitimate client.

**Attack vectors:**
- **Source code exposure:** Credentials hardcoded in source code, accidentally committed to public repositories
- **Configuration file leak:** Unencrypted config files exposed via misconfiguration (e.g., `.env` in web root)
- **Server compromise:** Attacker gains access to server and extracts credentials from memory, disk, or environment
- **Insider threat:** Malicious or negligent employee with access to secrets
- **Supply chain attack:** Compromised dependencies or deployment tools
- **Backup exposure:** Credentials in unencrypted backups

#### Attack Sequence

```
1. Attacker obtains client_id and client_secret
   (via repository scan, server breach, leaked backup, etc.)

2. Attacker sends token request:
   POST /token
   Authorization: Basic {base64(client_id:stolen_secret)}
   grant_type=client_credentials&scope=api:all

3. Authorization server validates credentials → Success
   (Server cannot distinguish legitimate client from attacker)

4. Authorization server issues access_token to attacker

5. Attacker uses access_token to:
   - Access APIs as the compromised service
   - Exfiltrate data
   - Modify resources
   - Launch further attacks
```

#### Exploit Demonstration (Vulnerable Mode: `WEAK_CLIENT_SECRET`)

```javascript
// Tool demonstrates: Weak credential security

// Vulnerable: Hardcoded in source (committed to git)
const CLIENT_SECRET = 'super_secret_123';  // ❌ WRONG

// Vulnerable: Short, easily brute-forced secret
const CLIENT_SECRET = '12345678';  // ❌ WRONG - weak entropy

// Vulnerable: Predictable pattern
const CLIENT_SECRET = 'client_' + CLIENT_ID;  // ❌ WRONG - derivable

// Attack simulation:
async function stealTokens(leakedClientId, leakedSecret) {
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(leakedClientId + ':' + leakedSecret),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials&scope=admin:all'
  });
  
  const tokens = await response.json();
  // Attacker now has valid access_token for victim service
  return tokens.access_token;
}
```

#### Mitigation

| Mitigation | Description | Spec Reference |
|------------|-------------|----------------|
| **Use private_key_jwt** | Asymmetric keys prevent shared secret compromise | RFC 7523 |
| Strong secret generation | Minimum 256 bits entropy (43+ random characters) | Security best practice |
| Secret management systems | Store in Vault, AWS Secrets Manager, Azure Key Vault, not config files | Security BCP §4.11 |
| Regular rotation | Rotate secrets every 30-90 days | Security BCP §4.11 |
| Access logging | Monitor all token requests for anomalies | RFC 6819 §4.5.2 |
| IP allowlisting | Restrict token endpoint access to known service IPs | Security best practice |
| Secret scanning | Use tools to detect credentials in repos (GitHub Secret Scanning, GitGuardian) | Security best practice |
| Secure storage | Encrypt secrets at rest | Security best practice |

#### Validation Requirements

| Check | Implementation | Spec Reference |
|-------|----------------|----------------|
| Secret complexity | Enforce minimum entropy (256+ bits) | Security best practice |
| Failed auth monitoring | Alert on repeated authentication failures | RFC 6819 §4.5.2 |
| Anomaly detection | Alert on unusual patterns (geographic, volume, time) | Security best practice |
| Credential rotation | Force periodic rotation | Security best practice |
| Audit logging | Log all token issuance with client_id, timestamp, IP | RFC 6749 §1.7 |

---

### 6.2 Privilege Escalation via Scope Abuse (RFC 6749 §3.3, Security BCP §4.11)

#### Attack Description

A compromised or malicious client requests scopes beyond its legitimate authorization, attempting to gain elevated privileges.

**Attack variants:**
- **Scope enumeration:** Attacker tries random scope values to discover available scopes
- **Scope injection:** Attacker requests known privileged scopes (e.g., `admin:all`, `superuser`)
- **Scope confusion:** Attacker exploits loose scope validation to access unintended resources
- **Privilege creep:** Over time, client accumulates excessive scopes that were never revoked

#### Attack Sequence

```
1. Legitimate service has scopes: ["service:backup", "api:read"]

2. Attacker compromises service credentials

3. Attacker requests token with escalated scopes:
   grant_type=client_credentials&scope=admin:all api:write api:delete

4a. Vulnerable server: Grants requested scopes
    → Attacker has admin privileges

4b. Secure server: Rejects with invalid_scope
    → Attack fails
```

#### Exploit Demonstration (Vulnerable Mode: `LAX_SCOPE_VALIDATION`)

```javascript
// Tool demonstrates: Insufficient scope validation

// Legitimate service registered for:
const AUTHORIZED_SCOPES = ['service:backup', 'api:read'];

// Attacker attempts privilege escalation:
const exploitScopes = [
  'admin:all',           // Attempt admin access
  'api:write api:delete', // Attempt destructive operations
  'superuser',           // Attempt elevated privileges
  '*',                   // Attempt wildcard access
  '../admin:all',        // Attempt path traversal in scope
];

for (const maliciousScope of exploitScopes) {
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + credentials,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `grant_type=client_credentials&scope=${encodeURIComponent(maliciousScope)}`
  });
  
  const result = await response.json();
  if (!result.error) {
    // Vulnerable server granted unauthorized scope!
    console.log('Privilege escalation succeeded:', maliciousScope);
  }
}
```

#### Mitigation

| Mitigation | Description | Spec Reference |
|------------|-------------|----------------|
| Pre-registered scopes | Client MUST pre-register all authorized scopes during registration | RFC 6749 §2.3 |
| Strict scope validation | Authorization server MUST validate requested scopes against client's authorized scopes | RFC 6749 §4.4.2 |
| Scope allowlist | Use explicit allowlist, never implicit grants | Security BCP §4.11 |
| Principle of least privilege | Grant only minimum scopes necessary for client's function | Security BCP §4.11 |
| Scope auditing | Regularly audit client scopes and revoke unused scopes | Security best practice |
| No wildcards | Do not support wildcard scopes (e.g., `*`, `admin:*`) | Security best practice |
| Hierarchical scopes | Use hierarchical scope design with clear boundaries | Security best practice |

#### Validation Requirements

| Check | Implementation | Spec Reference |
|-------|----------------|----------------|
| Scope pre-registration | Reject clients without pre-registered scopes | RFC 6749 §2 |
| Scope validation | Requested scope ⊆ Authorized scope | RFC 6749 §4.4.2 |
| Scope existence | All requested scopes must exist in server's scope registry | RFC 6749 §3.3 |
| Scope response | Return granted scopes in response if different from request | RFC 6749 §5.1 |
| Audit trail | Log all scope requests and grants | Security best practice |

---

### 6.3 Lack of Client Authentication (RFC 6749 §2.3, §3.2.1)

#### Attack Description

Authorization server fails to properly authenticate clients, allowing attackers to request tokens without valid credentials.

**Attack variants:**
- **Anonymous token requests:** Server accepts requests without authentication
- **Weak authentication:** Server accepts easily guessable credentials
- **Authentication bypass:** Implementation flaws allow bypassing authentication checks
- **Null byte injection:** Using null bytes to bypass authentication logic

#### Attack Sequence

```
1. Vulnerable server doesn't enforce client authentication

2. Attacker sends token request WITHOUT credentials:
   POST /token
   Content-Type: application/x-www-form-urlencoded
   
   grant_type=client_credentials&scope=api:all

3. Vulnerable server processes request without authentication

4. Server issues access_token to unauthenticated request

5. Attacker uses token to access protected resources
```

#### Exploit Demonstration (Vulnerable Mode: `SKIP_CLIENT_AUTH`)

```javascript
// Tool demonstrates: Missing client authentication enforcement

// Attack 1: No authentication at all
const response1 = await fetch(tokenEndpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
    // No Authorization header!
  },
  body: 'grant_type=client_credentials&scope=api:all'
});

// Attack 2: Empty credentials
const response2 = await fetch(tokenEndpoint, {
  method: 'POST',
  headers: {
    'Authorization': 'Basic ',  // Empty credentials
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: 'grant_type=client_credentials&scope=api:all'
});

// Attack 3: Null client_id
const response3 = await fetch(tokenEndpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: 'grant_type=client_credentials&client_id=&client_secret=&scope=api:all'
});

// If any succeed, authentication is not properly enforced
```

#### Mitigation

| Mitigation | Description | Spec Reference |
|------------|-------------|----------------|
| **REQUIRED authentication** | Client MUST authenticate on ALL token requests | RFC 6749 §3.2.1 |
| Early authentication | Authenticate client BEFORE processing request | Security best practice |
| Authentication method validation | Support and enforce strong auth methods (private_key_jwt preferred) | RFC 7523 |
| Constant-time comparison | Use timing-safe comparison for credentials | Security best practice |
| No default credentials | Never configure default/fallback credentials | Security best practice |

#### Validation Requirements

| Check | Implementation | Spec Reference |
|-------|----------------|----------------|
| Authentication present | MUST verify authentication credentials present | RFC 6749 §3.2.1 |
| Authentication valid | MUST validate credentials against stored values | RFC 6749 §3.2.1 |
| Client exists | MUST verify client_id exists in registration | RFC 6749 §2.3 |
| Early rejection | Reject unauthenticated requests before processing | Security best practice |
| Error response | Return `invalid_client` (HTTP 401) for auth failures | RFC 6749 §5.2 |

---

### 6.4 Credential Stuffing Attacks

#### Attack Description

Attacker attempts to brute-force or credential-stuff client_id/client_secret combinations, often using leaked credentials from other breaches.

**Attack vectors:**
- **Brute force:** Systematic attempts of random credentials
- **Credential stuffing:** Using leaked credentials from other services
- **Dictionary attacks:** Using common patterns and weak secrets
- **Rainbow tables:** Precomputed hashes for common secrets

#### Attack Sequence

```
1. Attacker obtains or generates list of potential credentials:
   - Leaked credentials from other services
   - Common patterns: "client123:secret123"
   - Brute force combinations

2. Attacker sends high volume of token requests:
   for each (client_id, client_secret) pair:
     POST /token
     Authorization: Basic {base64(client_id:client_secret)}
     grant_type=client_credentials

3a. Vulnerable server: Processes all attempts, eventually finds match
    → Attacker gains access

3b. Secure server: Rate limits, locks account after failures
    → Attack fails
```

#### Exploit Demonstration (Vulnerable Mode: `NO_RATE_LIMITING`)

```javascript
// Tool demonstrates: Brute force without rate limiting

const commonSecrets = [
  'password', '123456', 'secret', 'admin', 'client_secret',
  'changeme', 'default', 'test', 'demo', 'password123'
];

const knownClientIds = ['client_1', 'client_2', 'api_service'];

async function bruteForceAttack(clientIds, secretList) {
  for (const clientId of clientIds) {
    for (const secret of secretList) {
      const credentials = btoa(`${clientId}:${secret}`);
      
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials&scope=api:read'
      });
      
      if (response.ok) {
        console.log(`SUCCESS! Found credentials: ${clientId}:${secret}`);
        return await response.json();
      }
      
      // Vulnerable server: No rate limiting, can try unlimited combinations
    }
  }
}
```

#### Mitigation

| Mitigation | Description | Spec Reference |
|------------|-------------|----------------|
| Rate limiting | Limit token requests per client_id (e.g., 5 failures per 15 minutes) | RFC 6819 §4.5.2 |
| Account lockout | Temporarily lock client_id after repeated failures | Security best practice |
| IP-based rate limiting | Limit requests per source IP | Security best practice |
| CAPTCHA / Challenge | Require proof-of-work after failures | Security best practice |
| Exponential backoff | Increase delay between attempts after failures | Security best practice |
| Monitoring & alerting | Alert on brute force patterns | RFC 6819 §4.5.2 |
| Strong credential requirements | Enforce high entropy for client_secrets | Security best practice |

#### Validation Requirements

| Check | Implementation | Spec Reference |
|-------|----------------|----------------|
| Rate limits | Max 5-10 failures per client_id per 15 min | RFC 6819 §4.5.2 |
| IP rate limits | Max 100 requests per IP per minute | Security best practice |
| Temporary lockout | Lock account for 15-60 minutes after threshold | Security best practice |
| Alert on patterns | Alert on distributed brute force attempts | Security best practice |
| Logging | Log all failed authentication attempts | RFC 6749 §1.7 |

---

## 7. Implementation Requirements Checklist

### 7.1 Authorization Server MUST Implement

| # | Requirement | Spec Reference | Vuln Mode |
|---|-------------|----------------|-----------|
| AS1 | Require client authentication on all client_credentials requests | RFC 6749 §3.2.1 | `SKIP_CLIENT_AUTH` |
| AS2 | Validate `grant_type` equals `"client_credentials"` exactly | RFC 6749 §4.4.2 | - |
| AS3 | Validate requested scopes against client's authorized scopes | RFC 6749 §4.4.2 | `LAX_SCOPE_VALIDATION` |
| AS4 | Reject requests for scopes client is not authorized for | RFC 6749 §4.4.2 | `LAX_SCOPE_VALIDATION` |
| AS5 | Issue access tokens with appropriate lifetime | RFC 6749 §4.4.3 | - |
| AS6 | MUST NOT issue refresh tokens | RFC 6749 §4.4.3 | `ISSUE_REFRESH_TOKEN` |
| AS7 | Return proper error codes per RFC 6749 §5.2 | RFC 6749 §5.2 | - |
| AS8 | Set `Cache-Control: no-store` on token responses | RFC 6749 §5.1 | - |
| AS9 | Support at least one secure authentication method (prefer private_key_jwt) | RFC 7523 | - |
| AS10 | Implement rate limiting on token endpoint | RFC 6819 §4.5.2 | `NO_RATE_LIMITING` |
| AS11 | Log all token issuance with client_id, timestamp, scopes, IP | RFC 6749 §1.7 | - |
| AS12 | Monitor for anomalous authentication patterns | RFC 6819 §4.5.2 | - |
| AS13 | Enforce minimum credential entropy | Security best practice | `WEAK_CLIENT_SECRET` |
| AS14 | Return granted scopes in response if different from request | RFC 6749 §5.1 | - |

### 7.2 Client MUST Implement

| # | Requirement | Spec Reference | Vuln Mode |
|---|-------------|----------------|-----------|
| C1 | Store credentials securely (secret manager, not source code/config) | RFC 6819 §4.5.2 | `HARDCODED_SECRET` |
| C2 | Use HTTPS for all token endpoint requests | RFC 6749 §1.6 | `ALLOW_HTTP` |
| C3 | Validate TLS certificate of token endpoint | RFC 6749 §1.6 | `SKIP_TLS_VERIFY` |
| C4 | Cache access tokens and reuse until expiration | Security best practice | - |
| C5 | Handle token expiration gracefully and request new token | RFC 6749 §4.4 | - |
| C6 | Use strong authentication method (prefer private_key_jwt) | RFC 7523 | - |
| C7 | Implement token refresh before expiration (not after) | Security best practice | - |
| C8 | Never log or expose credentials in error messages | RFC 6819 §4.5.2 | - |
| C9 | Rotate credentials regularly | Security best practice | - |
| C10 | Request only minimum required scopes | Security best practice | - |

### 7.3 SHOULD Implement (Recommended)

| # | Requirement | Spec Reference |
|---|-------------|----------------|
| R1 | Use `private_key_jwt` authentication method | RFC 7523 |
| R2 | Implement credential rotation without downtime (dual secrets) | Security best practice |
| R3 | Monitor token usage for anomalies | Security best practice |
| R4 | Implement scope-based access control in resource servers | RFC 6749 §7 |
| R5 | Use short-lived access tokens (5-60 minutes) for high-security scenarios | Security BCP §4.12 |
| R6 | Implement IP allowlisting for known service locations | Security best practice |
| R7 | Use mutual TLS (mTLS) for token endpoint | RFC 8705 |
| R8 | Audit and revoke unused scopes periodically | Security best practice |

### 7.4 Common Implementation Pitfalls

| Pitfall | Problem | Consequence | Spec Reference |
|---------|---------|-------------|----------------|
| Credentials in source code | Secrets hardcoded in application code | Leaked in version control, easily discovered | RFC 6819 §4.5.2 |
| Credentials in plaintext config | Secrets in unencrypted config files | Exposed via misconfiguration, backups | RFC 6819 §4.5.2 |
| Excessive token lifetimes | Tokens valid for days/weeks | Large window for token theft exploitation | Security BCP §4.12 |
| No token caching | Requesting new token for every API call | Performance issues, rate limiting, log bloat | RFC 6749 §4.4 |
| Weak client secrets | Short, predictable secrets | Vulnerable to brute force | RFC 6819 §4.5.2 |
| No rate limiting | Unlimited authentication attempts | Brute force attacks succeed | RFC 6819 §4.5.2 |
| Scope creep | Accumulating unused scopes over time | Excessive privileges if compromised | Security best practice |
| Logging secrets | Secrets in application/server logs | Credential exposure via logs | RFC 6819 §4.5.2 |
| Using user scopes | Requesting user-centric scopes for service | Confusion about token's authority | RFC 6749 §4.4 |
| Issuing refresh tokens | Server issues refresh_token | Violates RFC 6749 §4.4.3 | RFC 6749 §4.4.3 |

---

## 8. Validation Rules (Exact Spec Requirements)

### 8.1 grant_type Validation (RFC 6749 §4.4.2)

```
FUNCTION validateGrantType(grantType):
    # Exact string match required
    IF grantType != "client_credentials":
        RETURN error("unsupported_grant_type", 
                     "grant_type must be 'client_credentials'")
    
    RETURN valid
```

**Key rule:** The value MUST be exactly `"client_credentials"` (case-sensitive). No variations allowed.

### 8.2 Client Authentication Validation (RFC 6749 §2.3, §3.2.1)

```
FUNCTION authenticateClient(request):
    # Determine authentication method
    IF request.headers['Authorization'] startsWith "Basic ":
        RETURN authenticateBasic(request)
    ELSE IF request.body contains "client_id" AND "client_secret":
        RETURN authenticatePost(request)
    ELSE IF request.body contains "client_assertion":
        RETURN authenticateJWT(request)
    ELSE IF request has valid mTLS certificate:
        RETURN authenticateMTLS(request)
    ELSE:
        RETURN error("invalid_client", "Client authentication required")

FUNCTION authenticateBasic(request):
    authHeader = request.headers['Authorization']
    credentials = base64Decode(authHeader.substring(6))  # Remove "Basic "
    [clientId, clientSecret] = credentials.split(":")
    
    storedSecret = clientStore.getSecret(clientId)
    
    IF storedSecret IS null:
        RETURN error("invalid_client", "Unknown client")
    
    # Constant-time comparison to prevent timing attacks
    IF NOT constantTimeEquals(clientSecret, storedSecret):
        logFailedAuth(clientId, request.ip)
        checkBruteForce(clientId)
        RETURN error("invalid_client", "Invalid credentials")
    
    RETURN clientId

FUNCTION authenticateJWT(request):
    assertion = request.body['client_assertion']
    assertionType = request.body['client_assertion_type']
    
    IF assertionType != "urn:ietf:params:oauth:client-assertion-type:jwt-bearer":
        RETURN error("invalid_client", "Unsupported assertion type")
    
    # Parse and validate JWT
    jwt = parseJWT(assertion)
    
    # Validate claims per RFC 7523 §3.1
    IF jwt.claims['iss'] != jwt.claims['sub']:
        RETURN error("invalid_client", "iss and sub must be equal")
    
    IF jwt.claims['aud'] != tokenEndpointUrl:
        RETURN error("invalid_client", "Invalid audience")
    
    IF jwt.claims['exp'] < currentTime():
        RETURN error("invalid_client", "JWT expired")
    
    # Check for replay (jti must be unique)
    IF jtiStore.exists(jwt.claims['jti']):
        RETURN error("invalid_client", "JWT replay detected")
    
    jtiStore.add(jwt.claims['jti'], jwt.claims['exp'])
    
    # Verify signature
    clientId = jwt.claims['iss']
    publicKey = clientStore.getPublicKey(clientId)
    
    IF NOT verifySignature(jwt, publicKey):
        RETURN error("invalid_client", "Invalid signature")
    
    RETURN clientId
```

**Authentication requirements:**

| Requirement | Description | Spec Reference |
|-------------|-------------|----------------|
| Authentication REQUIRED | Client MUST authenticate on every request | RFC 6749 §3.2.1 |
| Support multiple methods | Server SHOULD support multiple authentication methods | RFC 6749 §2.3 |
| Constant-time comparison | Use timing-safe comparison for secrets | Security best practice |
| Log failures | Log all failed authentication attempts | RFC 6819 §4.5.2 |
| Rate limiting | Limit failed attempts per client_id | RFC 6819 §4.5.2 |

### 8.3 Scope Validation (RFC 6749 §3.3, §4.4.2)

```
FUNCTION validateScopes(requestedScopes, clientId):
    # Parse space-delimited scopes
    scopeList = requestedScopes.split(" ")
    
    # Get client's authorized scopes
    authorizedScopes = clientStore.getAuthorizedScopes(clientId)
    
    # Validate each requested scope
    grantedScopes = []
    FOR EACH scope IN scopeList:
        # Check if scope exists
        IF NOT scopeRegistry.exists(scope):
            RETURN error("invalid_scope", "Unknown scope: " + scope)
        
        # Check if client is authorized for this scope
        IF scope NOT IN authorizedScopes:
            RETURN error("invalid_scope", 
                        "Client not authorized for scope: " + scope)
        
        grantedScopes.add(scope)
    
    RETURN grantedScopes
```

**Scope validation requirements:**

| Requirement | Description | Spec Reference |
|-------------|-------------|----------------|
| Pre-registration | All scopes must be pre-registered during client registration | RFC 6749 §2 |
| Scope existence | Requested scopes must exist in server's scope registry | RFC 6749 §3.3 |
| Authorization check | Requested scopes ⊆ Client's authorized scopes | RFC 6749 §4.4.2 |
| Scope response | Return granted scopes if different from request | RFC 6749 §5.1 |
| No wildcards | Do not support wildcard scopes | Security best practice |

### 8.4 Token Issuance Validation (RFC 6749 §4.4.3)

```
FUNCTION issueToken(clientId, grantedScopes):
    # Generate access token
    accessToken = generateSecureToken()
    
    # Determine token lifetime
    tokenLifetime = determineLifetime(clientId, grantedScopes)
    expiresAt = currentTime() + tokenLifetime
    
    # Store token metadata
    tokenStore.save({
        token: accessToken,
        clientId: clientId,
        scopes: grantedScopes,
        issuedAt: currentTime(),
        expiresAt: expiresAt,
        tokenType: "Bearer"
    })
    
    # Log token issuance
    auditLog.log({
        event: "token_issued",
        clientId: clientId,
        scopes: grantedScopes,
        lifetime: tokenLifetime,
        timestamp: currentTime(),
        ip: request.ip
    })
    
    # Prepare response (RFC 6749 §5.1)
    response = {
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: tokenLifetime,
        scope: grantedScopes.join(" ")
    }
    
    # CRITICAL: Do NOT include refresh_token (RFC 6749 §4.4.3)
    # refresh_token MUST NOT be issued for client_credentials
    
    RETURN response
```

**Token issuance requirements:**

| Requirement | Value | Spec Reference |
|-------------|-------|----------------|
| access_token | REQUIRED - secure random token | RFC 6749 §5.1 |
| token_type | REQUIRED - typically "Bearer" | RFC 6749 §5.1 |
| expires_in | RECOMMENDED - lifetime in seconds | RFC 6749 §5.1 |
| scope | OPTIONAL if identical to request | RFC 6749 §5.1 |
| refresh_token | **MUST NOT** be included | RFC 6749 §4.4.3 |

---

## 9. Comparison with Other Flows

### 9.1 Client Credentials vs Authorization Code

| Aspect | Client Credentials | Authorization Code |
|--------|-------------------|-------------------|
| **User involvement** | None | Required (authentication + consent) |
| **Token represents** | Client identity | User identity + client |
| **Endpoints used** | Token endpoint only | Authorization + Token endpoints |
| **Browser required** | No | Yes |
| **Redirect URIs** | Not used | Required |
| **PKCE** | N/A | Required (OAuth 2.1) |
| **Authorization code** | Not issued | Central to flow |
| **Refresh tokens** | **MUST NOT** issue | May issue |
| **Typical use case** | Service-to-service | User authorizing client |
| **Request complexity** | Simple (1 request) | Complex (2 requests + redirects) |
| **Security model** | Client proves its identity | User authorizes client access |

**When to use which:**
- **Client Credentials:** Backend service needs to access its own resources or call another service's API
- **Authorization Code:** Application needs to access user's resources with their permission

### 9.2 Client Credentials vs Resource Owner Password

| Aspect | Client Credentials | Resource Owner Password |
|--------|-------------------|------------------------|
| **User credentials** | Not used | User provides username/password to client |
| **Token represents** | Client identity | User identity |
| **User trust required** | No user | High (user trusts client with credentials) |
| **RFC status** | Active | **Deprecated** (Security BCP) |
| **Security** | Good (no user credentials exposed) | Poor (credentials exposed to client) |
| **Use case** | Service-to-service | Legacy migration only |
| **Recommendation** | ✅ Use for services | ❌ Avoid, migrate to Authorization Code |

**Key difference:** Resource Owner Password Credentials (ROPC) flow is fundamentally flawed because it requires users to share their credentials with the client. Client Credentials Flow doesn't involve users at all, so this anti-pattern doesn't apply.

### 9.3 Client Credentials vs Implicit Flow

| Aspect | Client Credentials | Implicit Flow |
|--------|-------------------|---------------|
| **Client type** | Confidential only | Public clients (SPAs) |
| **Token delivery** | Back-channel (server-to-server) | Front-channel (URL fragment) |
| **Client secret** | Required | Not supported |
| **Token in URL** | Never | Yes (major security issue) |
| **RFC status** | Active | **Deprecated** (OAuth 2.1) |
| **Security** | Good (credentials + back-channel) | Poor (tokens in URL, no client auth) |
| **Use case** | Backend services | **None** (migrate to Authorization Code + PKCE) |

**Key difference:** Implicit Flow was designed for JavaScript apps that couldn't use a back-channel. Client Credentials is for backend services that *only* use back-channel. They solve completely different (and in Implicit's case, poorly) problems.

---

## 10. Example Scenarios

### 10.1 Happy Path: Service-to-Service API Call

**Scenario:** Backup service needs to call the Storage service API to upload backup files.

#### Client Configuration (Backup Service)
```
Client ID: backup-service-prod
Client Secret: 3yJ9K7mN2qP5rT8vW1xZ4cF6gH0jL3nM5pQ8sU1wY4aD7eG9iK2mO5
Authorized Scopes: storage:write storage:read
Authentication Method: client_secret_basic
```

#### Step 1: Backup Service Requests Token

```http
POST /token HTTP/1.1
Host: auth.example.com
Authorization: Basic YmFja3VwLXNlcnZpY2UtcHJvZDozekpyNUt0TjdxUDlyVDh2VzF4WjRjRjZnSDlqTDNuTTVwUThzVTF3WTRhRDdlRzlpSzJtTzU=
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&scope=storage%3Awrite%20storage%3Aread
```

#### Step 2: Authorization Server Validates and Issues Token

**Validation performed:**
1. Decode Basic Auth header → `backup-service-prod:3zJr5KtN7qP9rT8vW1xZ4cF6gH9jL3nM5pQ8sU1wY4aD7eG9iK2mO5`
2. Verify client exists → ✅ Found
3. Verify secret matches → ✅ Match
4. Verify requested scopes ⊆ authorized scopes → ✅ Valid
5. Generate token, lifetime 3600 seconds

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiYWNrdXAtc2VydmljZS1wcm9kIiwic2NvcGUiOiJzdG9yYWdlOndyaXRlIHN0b3JhZ2U6cmVhZCIsImV4cCI6MTcwMDAwMDAwMH0.signature",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "storage:write storage:read"
}
```

#### Step 3: Backup Service Caches Token

```javascript
// Client caches token with expiration
const tokenCache = {
  access_token: response.access_token,
  expires_at: Date.now() + (response.expires_in * 1000),
  scopes: response.scope
};

// Use cached token for all requests until near expiration
function getAccessToken() {
  if (Date.now() >= tokenCache.expires_at - 60000) {  // Refresh 1 min before expiry
    tokenCache = requestNewToken();
  }
  return tokenCache.access_token;
}
```

#### Step 4: Backup Service Calls Storage API

```http
POST /api/v1/backups/upload HTTP/1.1
Host: storage.example.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/octet-stream

[backup file data]
```

#### Step 5: Storage Service Validates Token

```javascript
// Storage service validates token
const token = extractBearerToken(request);
const validation = await introspectToken(token);

if (!validation.active) {
  return response.status(401).json({ error: 'invalid_token' });
}

// Check required scope
if (!validation.scope.includes('storage:write')) {
  return response.status(403).json({ 
    error: 'insufficient_scope',
    required: 'storage:write'
  });
}

// Process upload
await processBackupUpload(request.body);
return response.status(201).json({ status: 'uploaded' });
```

---

### 10.2 Error Scenario: invalid_client (Wrong Credentials)

**Scenario:** Service has incorrect client_secret (typo, old secret after rotation, or compromised attempt).

#### Token Request with Wrong Secret

```http
POST /token HTTP/1.1
Host: auth.example.com
Authorization: Basic YmFja3VwLXNlcnZpY2UtcHJvZDpXUk9OR19TRUNSRVQ=
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&scope=storage%3Awrite
```

#### Authorization Server Response

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Basic realm="Authorization Server"
Content-Type: application/json
Cache-Control: no-store

{
  "error": "invalid_client",
  "error_description": "Client authentication failed"
}
```

#### Server-Side Actions

```javascript
// Authorization server logs failed attempt
auditLog.warn({
  event: 'authentication_failed',
  client_id: 'backup-service-prod',
  method: 'client_secret_basic',
  ip: request.ip,
  timestamp: Date.now()
});

// Increment failure counter
failureCount = incrementFailureCount('backup-service-prod');

// Apply rate limiting
if (failureCount >= 5) {
  lockClient('backup-service-prod', duration='15 minutes');
  alertSecurityTeam('Potential brute force on backup-service-prod');
}
```

#### Client-Side Error Handling

```javascript
// Client handles authentication failure
try {
  const response = await requestToken();
  if (response.error === 'invalid_client') {
    // Log error securely (don't log credentials!)
    logger.error('Token request failed: invalid credentials', {
      client_id: CLIENT_ID,
      error: response.error,
      description: response.error_description
    });
    
    // Alert operations team
    alertOps('Authentication failure - check client credentials');
    
    // Implement exponential backoff before retry
    await backoff(retryCount);
  }
} catch (error) {
  logger.error('Token request error', error);
}
```

**Debugging checklist:**
- [ ] Verify client_id is correct
- [ ] Verify client_secret is current (check for recent rotation)
- [ ] Verify credentials are properly encoded (Base64 for Basic Auth)
- [ ] Check credential storage/retrieval mechanism
- [ ] Verify network path to authorization server
- [ ] Check for client account lockout due to previous failures

---

### 10.3 Error Scenario: invalid_scope (Requesting User Permissions)

**Scenario:** Service mistakenly requests user-centric scopes instead of service scopes.

#### Token Request with User Scopes

```http
POST /token HTTP/1.1
Host: auth.example.com
Authorization: Basic YmFja3VwLXNlcnZpY2UtcHJvZDpWQUxJRF9TRUNSRVQ=
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&scope=user%3Aprofile%20user%3Aemail
```

#### Authorization Server Response

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json
Cache-Control: no-store

{
  "error": "invalid_scope",
  "error_description": "Client is not authorized for user-centric scopes. Requested 'user:profile' and 'user:email', but client is only authorized for service scopes: ['storage:write', 'storage:read']"
}
```

#### Server-Side Validation

```javascript
// Authorization server validates scopes
function validateScopes(clientId, requestedScopes) {
  const authorizedScopes = getClientScopes(clientId);
  // backup-service-prod: ['storage:write', 'storage:read']
  
  const requestedScopeList = requestedScopes.split(' ');
  // ['user:profile', 'user:email']
  
  for (const scope of requestedScopeList) {
    if (!authorizedScopes.includes(scope)) {
      auditLog.warn({
        event: 'invalid_scope_request',
        client_id: clientId,
        requested: scope,
        authorized: authorizedScopes
      });
      
      return {
        error: 'invalid_scope',
        error_description: `Client not authorized for scope: ${scope}`
      };
    }
  }
  
  return { valid: true };
}
```

**Root cause:** Developer confusion about token context. Client credentials tokens represent the *service* not any user.

**Fix:**
```http
// Correct request with service scopes
grant_type=client_credentials&scope=storage%3Awrite%20storage%3Aread
```

---

### 10.4 Real-World Use Case: Backend Service Authentication

**Scenario:** Microservice architecture with multiple services that need to call each other's APIs.

#### Architecture

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   API Gateway   │       │   Auth Service  │       │   Service A     │
│                 │       │  (OAuth Server) │       │  (User API)     │
└────────┬────────┘       └────────┬────────┘       └────────┬────────┘
         │                         │                         │
         │  1. Client credentials  │                         │
         │ ────────────────────────► Token Request           │
         │                         │                         │
         │  2. Access token        │                         │
         │ ◄────────────────────────                         │
         │                         │                         │
         │  3. Call Service A API  │                         │
         │         (with token)    │                         │
         │ ──────────────────────────────────────────────────►
         │                         │                         │
         │  4. Validate token      │                         │
         │         ◄───────────────────────────────────────────
         │                         │                         │
         │  5. API response        │                         │
         │ ◄──────────────────────────────────────────────────
         ▼                         ▼                         ▼
```

#### Implementation Details

**Service Registration:**
```yaml
# API Gateway client configuration
client_id: api-gateway-prod
authentication_method: private_key_jwt
public_key: |
  -----BEGIN PUBLIC KEY-----
  MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
  -----END PUBLIC KEY-----
authorized_scopes:
  - users:read
  - users:write
  - orders:read
  - inventory:read
token_lifetime: 900  # 15 minutes
```

**API Gateway Token Management:**
```javascript
class TokenManager {
  constructor() {
    this.tokens = new Map();  // scope → token cache
  }
  
  async getToken(requiredScopes) {
    const scopeKey = requiredScopes.sort().join(' ');
    const cached = this.tokens.get(scopeKey);
    
    // Check if cached token is still valid (with 1 min buffer)
    if (cached && cached.expires_at > Date.now() + 60000) {
      return cached.access_token;
    }
    
    // Request new token
    const newToken = await this.requestToken(requiredScopes);
    this.tokens.set(scopeKey, {
      access_token: newToken.access_token,
      expires_at: Date.now() + (newToken.expires_in * 1000)
    });
    
    return newToken.access_token;
  }
  
  async requestToken(scopes) {
    // Generate JWT assertion
    const jwt = await this.createJWTAssertion();
    
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: scopes.join(' '),
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: jwt
      })
    });
    
    if (!response.ok) {
      throw new Error(`Token request failed: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  async createJWTAssertion() {
    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: 'gateway-key-2024-01'
    };
    
    const payload = {
      iss: 'api-gateway-prod',
      sub: 'api-gateway-prod',
      aud: 'https://auth.example.com/token',
      jti: crypto.randomUUID(),
      exp: Math.floor(Date.now() / 1000) + 300,  // 5 min validity
      iat: Math.floor(Date.now() / 1000)
    };
    
    return signJWT(header, payload, privateKey);
  }
}

// Usage in API Gateway
const tokenManager = new TokenManager();

app.get('/api/users/:id', async (req, res) => {
  // Get token for users:read scope
  const token = await tokenManager.getToken(['users:read']);
  
  // Call User Service API
  const userResponse = await fetch(`https://users.example.com/api/users/${req.params.id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const userData = await userResponse.json();
  res.json(userData);
});
```

**Benefits of this approach:**
- ✅ No user credentials involved
- ✅ Services authenticate as themselves
- ✅ Scopes limit what each service can do
- ✅ Tokens cached for performance
- ✅ Asymmetric keys eliminate shared secrets
- ✅ Standard OAuth 2.0, works with any compliant auth server

---

### 10.5 Real-World Use Case: CLI Tool Accessing APIs

**Scenario:** Administrative CLI tool for managing cloud resources, running on developer workstations.

#### CLI Tool Configuration

```bash
# ~/.cloudcli/config
[default]
client_id = cli-tool-admin
auth_method = private_key_jwt
private_key_path = ~/.cloudcli/keys/cli-key.pem
token_endpoint = https://auth.cloud.example.com/token
api_base_url = https://api.cloud.example.com
default_scopes = resources:read resources:write
```

#### CLI Tool Implementation

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

class CloudCLI {
  constructor(configPath) {
    this.config = this.loadConfig(configPath);
    this.tokenCache = this.loadTokenCache();
  }
  
  async executeCommand(command, args) {
    // Get valid access token
    const token = await this.getAccessToken();
    
    // Execute API call
    switch (command) {
      case 'list':
        return await this.listResources(token);
      case 'create':
        return await this.createResource(token, args);
      case 'delete':
        return await this.deleteResource(token, args);
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  }
  
  async getAccessToken() {
    // Check cached token
    if (this.tokenCache.expires_at > Date.now() + 60000) {
      return this.tokenCache.access_token;
    }
    
    // Request new token using client credentials
    const assertion = this.createJWTAssertion();
    
    const response = await fetch(this.config.token_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: this.config.default_scopes,
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: assertion
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Authentication failed:', error.error_description);
      process.exit(1);
    }
    
    const tokenData = await response.json();
    
    // Cache token
    this.tokenCache = {
      access_token: tokenData.access_token,
      expires_at: Date.now() + (tokenData.expires_in * 1000)
    };
    this.saveTokenCache();
    
    return tokenData.access_token;
  }
  
  createJWTAssertion() {
    const privateKey = fs.readFileSync(this.config.private_key_path);
    
    const payload = {
      iss: this.config.client_id,
      sub: this.config.client_id,
      aud: this.config.token_endpoint,
      jti: crypto.randomUUID(),
      exp: Math.floor(Date.now() / 1000) + 300,
      iat: Math.floor(Date.now() / 1000)
    };
    
    return jwt.sign(payload, privateKey, { 
      algorithm: 'RS256',
      header: { kid: 'cli-key-2024' }
    });
  }
  
  async listResources(token) {
    const response = await fetch(`${this.config.api_base_url}/resources`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    return await response.json();
  }
}

// CLI entry point
const cli = new CloudCLI('~/.cloudcli/config');
const [command, ...args] = process.argv.slice(2);

cli.executeCommand(command, args)
  .then(result => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
```

#### Usage

```bash
# List resources
$ cloudcli list
{
  "resources": [
    {"id": "res-123", "name": "webserver-1", "status": "running"},
    {"id": "res-456", "name": "database-1", "status": "running"}
  ]
}

# Create resource
$ cloudcli create --type compute --name webserver-2
{
  "id": "res-789",
  "name": "webserver-2",
  "status": "creating"
}

# Delete resource
$ cloudcli delete res-456
{
  "status": "deleted",
  "id": "res-456"
}
```

**Why client credentials is appropriate here:**
- CLI tool acts with its own authority (administrative tool)
- No user consent needed (admin has already authorized CLI tool)
- Tool runs on trusted workstation
- Uses asymmetric keys for better security
- Tokens cached locally for performance
- No browser interaction required

---

## Appendix A: RFC Cross-Reference Index

| Topic | RFC 6749 | RFC 7523 | Security BCP | OAuth 2.1 |
|-------|----------|----------|--------------|-----------|
| Client Credentials Grant | §4.4 | — | §4.11 | §4.2 |
| Token endpoint | §3.2 | — | — | §3.2 |
| Client authentication | §2.3, §3.2.1 | Complete | — | §2.3 |
| Token request | §4.4.2 | — | — | §4.2.1 |
| Token response | §4.4.3 | — | — | §4.2.2 |
| Scope parameter | §3.3 | — | §4.11 | §3.3 |
| Error responses | §5.2 | — | — | §5.2 |
| JWT client auth | — | Complete | — | — |
| Threat model | — | — | §4 | — |
| Credential theft | — | — | — | — |
| No refresh tokens | §4.4.3 | — | — | §4.2.2 |

---

## Appendix B: Vulnerability Mode Quick Reference

| Toggle | Attack Demonstrated | Spec Violation | Document Section |
|--------|-------------------|----------------|------------------|
| `SKIP_CLIENT_AUTH` | Anonymous token requests | RFC 6749 §3.2.1 | §6.3 |
| `WEAK_CLIENT_SECRET` | Credential brute force | RFC 6819 §4.5.2 | §6.1 |
| `LAX_SCOPE_VALIDATION` | Privilege escalation via scope | RFC 6749 §4.4.2 | §6.2 |
| `NO_RATE_LIMITING` | Credential stuffing attack | RFC 6819 §4.5.2 | §6.4 |
| `ISSUE_REFRESH_TOKEN` | Improper refresh token issuance | RFC 6749 §4.4.3 | §4, §7.4 |
| `HARDCODED_SECRET` | Secret exposure in source code | RFC 6819 §4.5.2 | §6.1 |
| `ALLOW_HTTP` | Credentials transmitted insecurely | RFC 6749 §1.6 | §7.2 |

---

*Document Version: 1.0.0*
*Last Updated: December 4, 2025*
*Specification References: RFC 6749 §4.4, RFC 7523, OAuth 2.1 §4.2, RFC 6819 §4.5.2, Security BCP §4.11*

---

> *"So long, and thanks for all the tokens."*
