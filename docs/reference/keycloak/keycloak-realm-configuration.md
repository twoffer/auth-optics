# KeyCloak Realm Configuration
## Clients, Users, Tokens, and Scopes for OAuth2/OIDC Tool

> *"Seven clients walk into a bar. Six are secure. One is there for educational purposes."*

---

## Overview

This document specifies the complete realm configuration for the `oauth2-demo` realm, including all pre-configured clients, users, roles, scopes, and token settings.

**Target**: Claude Code implementing realm configuration and tool integration  
**Related Docs**: `keycloak-deployment.md`, `keycloak-security-and-vulnerability-mode.md`

---

## Realm Settings

### Basic Configuration

| Setting | Value | Purpose |
|---------|-------|---------|
| **Realm Name** | `oauth2-demo` | Namespace for all configuration |
| **Display Name** | OAuth2/OIDC Learning Demo | User-friendly name |
| **Enabled** | true | Active realm |
| **User Registration** | Enabled | Allow self-registration (demo) |
| **Email as Username** | false | Use simple usernames |
| **Login with Email** | true | Support email login |
| **Verify Email** | false | Skip verification (demo) |
| **Reset Password** | true | Allow password reset |

### OIDC Endpoints (Base URL: `http://localhost:8080/realms/oauth2-demo`)

| Endpoint | Path | Use |
|----------|------|-----|
| Authorization | `/protocol/openid-connect/auth` | Start auth flows |
| Token | `/protocol/openid-connect/token` | Token exchange/refresh |
| UserInfo | `/protocol/openid-connect/userinfo` | Get user claims |
| JWKS | `/protocol/openid-connect/certs` | Public keys |
| Discovery | `/.well-known/openid-configuration` | Metadata |
| Introspection | `/protocol/openid-connect/token/introspect` | Validate tokens |
| Revocation | `/protocol/openid-connect/revoke` | Revoke tokens |
| Device Authorization | `/protocol/openid-connect/auth/device` | Device flow start |
| Logout | `/protocol/openid-connect/logout` | End session |

---

## Pre-Configured Clients

### Client Overview

| Client ID | Type | Secret | PKCE | Primary Flow | Purpose |
|-----------|------|--------|------|--------------|---------|
| `web-app` | Confidential | `web-app-secret-12345` | Optional | Authorization Code | Traditional web apps |
| `spa-client` | Public | N/A | Required S256 | Authorization Code | SPAs |
| `mobile-app` | Public | N/A | Required S256 | Authorization Code | Native/mobile |
| `service-account` | Confidential | `service-secret-67890` | N/A | Client Credentials | M2M |
| `device-client` | Public | N/A | N/A | Device Authorization | Smart TVs, CLIs |
| `legacy-implicit` | Public | N/A | N/A | Implicit (DEPRECATED) | Education only |
| `vulnerable-client` | Confidential | `weak-secret` | Not enforced | Authorization Code | Vulnerability demos |

---

### Client 1: web-app (Traditional Web Application)

**Purpose**: Demonstrate confidential client with server-side secret

**Configuration**:
```json
{
  "clientId": "web-app",
  "name": "Web Application Client",
  "enabled": true,
  "protocol": "openid-connect",
  "publicClient": false,
  "clientAuthenticatorType": "client-secret",
  "secret": "web-app-secret-12345",
  
  "standardFlowEnabled": true,
  "implicitFlowEnabled": false,
  "directAccessGrantsEnabled": false,
  "serviceAccountsEnabled": false,
  
  "redirectUris": [
    "http://localhost:3000/callback",
    "http://localhost:3000/oauth2/callback",
    "https://oauth.pstmn.io/v1/callback"
  ],
  "webOrigins": ["http://localhost:3000"],
  
  "attributes": {
    "pkce.code.challenge.method": ""  // Optional PKCE
  }
}
```

**Key Features**:
- Confidential client (has secret)
- PKCE optional (for comparison demonstrations)
- Standard authorization code flow
- Supports Postman testing

**Use Cases**:
- Comparing with/without PKCE
- Client secret authentication
- Traditional backend web applications

---

### Client 2: spa-client (Single Page Application)

**Purpose**: Modern SPA with mandatory PKCE

**Configuration**:
```json
{
  "clientId": "spa-client",
  "name": "Single Page Application",
  "enabled": true,
  "protocol": "openid-connect",
  "publicClient": true,
  
  "standardFlowEnabled": true,
  "implicitFlowEnabled": false,
  "directAccessGrantsEnabled": false,
  
  "redirectUris": ["http://localhost:3000/spa/callback"],
  "webOrigins": ["http://localhost:3000"],
  
  "attributes": {
    "pkce.code.challenge.method": "S256"  // REQUIRED
  }
}
```

**Key Features**:
- Public client (no secret possible)
- **PKCE enforced** - requests without code_challenge rejected
- Only S256 challenge method allowed
- Modern SPA best practices

**Use Cases**:
- PKCE enforcement demonstration
- Browser-based applications
- Security best practice example

---

### Client 3: mobile-app (Native/Mobile Application)

**Purpose**: Native applications with platform-specific redirect URIs

**Configuration**:
```json
{
  "clientId": "mobile-app",
  "name": "Native Mobile Application",
  "enabled": true,
  "protocol": "openid-connect",
  "publicClient": true,
  
  "standardFlowEnabled": true,
  
  "redirectUris": [
    "http://127.0.0.1:*/callback",           // Loopback with dynamic port
    "myapp://callback",                       // Custom URI scheme
    "com.example.myapp://oauth2redirect"      // Reverse domain notation
  ],
  "webOrigins": ["+"],
  
  "attributes": {
    "pkce.code.challenge.method": "S256"
  }
}
```

**Key Features**:
- Loopback with wildcard port (RFC 8252)
- Custom URI scheme support
- PKCE enforced
- Native app patterns

**Redirect URI Patterns**:
- `127.0.0.1:*/callback` - Desktop apps, dynamic port selection
- `myapp://callback` - iOS/Android deep linking
- `com.example.myapp://` - Reverse domain (Android standard)

**Use Cases**:
- Native app authentication
- Custom URI scheme demonstration
- AppAuth SDK compatibility

---

### Client 4: service-account (Machine-to-Machine)

**Purpose**: Service-to-service authentication without user

**Configuration**:
```json
{
  "clientId": "service-account",
  "name": "Service Account Client",
  "enabled": true,
  "protocol": "openid-connect",
  "publicClient": false,
  "secret": "service-secret-67890",
  
  "standardFlowEnabled": false,
  "serviceAccountsEnabled": true,
  
  "attributes": {
    "oauth2.client.credentials.grant.enabled": "true"
  }
}
```

**Key Features**:
- Client credentials flow only
- No user involvement
- Service account user auto-created
- Backend-to-backend communication

**Service Account User**: `service-account-service-account`

**Use Cases**:
- Microservice authentication
- Scheduled jobs
- Backend API calls
- System integrations

**Token Request Example**:
```http
POST /realms/oauth2-demo/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=service-account
&client_secret=service-secret-67890
&scope=read
```

**Response**: Access token only (no ID token, no refresh token)

---

### Client 5: device-client (Device Authorization Flow)

**Purpose**: Input-constrained devices (Smart TVs, CLIs, IoT)

**Configuration**:
```json
{
  "clientId": "device-client",
  "name": "Device Authorization Client",
  "enabled": true,
  "protocol": "openid-connect",
  "publicClient": true,
  
  "standardFlowEnabled": false,
  
  "attributes": {
    "oauth2.device.authorization.grant.enabled": "true",
    "oauth2.device.polling.interval": "5"
  }
}
```

**Key Features**:
- Device authorization flow (RFC 8628)
- User code generation
- Polling mechanism (5 second interval)
- Verification URI for user approval

**Device Flow Settings**:
- Device code lifespan: 600 seconds (10 minutes)
- Polling interval: 5 seconds
- User code format: BASE20 (easy typing)

**Use Cases**:
- Smart TV authentication
- CLI tools (like GitHub CLI)
- IoT devices with limited input
- Game consoles

---

### Client 6: legacy-implicit (DEPRECATED - Educational Only)

**Purpose**: Demonstrate WHY implicit flow is insecure

**Configuration**:
```json
{
  "clientId": "legacy-implicit",
  "name": "Legacy Implicit Flow Client (DEPRECATED)",
  "enabled": true,
  "protocol": "openid-connect",
  "publicClient": true,
  
  "standardFlowEnabled": false,
  "implicitFlowEnabled": true,
  
  "redirectUris": ["http://localhost:3000/implicit/callback"],
  "webOrigins": ["http://localhost:3000"]
}
```

**⚠️ SECURITY ISSUES** (why it's deprecated):
1. Tokens in URL fragment (browser history leak)
2. No client authentication
3. No refresh tokens
4. Token leakage via HTTP Referer
5. Cannot use PKCE
6. Vulnerable to token theft

**Tool Requirements**:
- Display prominent deprecation warning
- Explain each security issue
- Show modern alternative (authorization code + PKCE)
- Reference: OAuth 2.0 Security BCP Section 2.1.2

**Use Cases**: Education and legacy system debugging ONLY

---

### Client 7: vulnerable-client (Intentionally Insecure)

**Purpose**: Security education and vulnerability demonstrations

**Configuration**:
```json
{
  "clientId": "vulnerable-client",
  "name": "Vulnerable Client (EDUCATIONAL)",
  "enabled": true,
  "protocol": "openid-connect",
  "publicClient": false,
  "secret": "weak-secret",
  
  "standardFlowEnabled": true,
  "implicitFlowEnabled": true,
  "directAccessGrantsEnabled": true,
  
  "redirectUris": [
    "http://localhost:3000/vuln/callback",
    "http://localhost:3000/*",              // VULNERABILITY: Wildcard
    "http://attacker.example.com/steal"     // VULNERABILITY: Attacker domain
  ],
  "webOrigins": ["*"],                      // VULNERABILITY: Wildcard CORS
  
  "attributes": {
    "pkce.code.challenge.method": ""        // VULNERABILITY: PKCE not enforced
  }
}
```

**Intentional Vulnerabilities**:
1. Weak secret (`weak-secret`)
2. Overly permissive redirect URIs (wildcard)
3. PKCE not enforced (code interception possible)
4. Wildcard CORS (cross-origin attacks)
5. All flows enabled (multiple attack surfaces)

**Tool Integration**: See `keycloak-security-and-vulnerability-mode.md`

---

## Pre-Configured Users

### User Overview

| Username | Password | Email | Status | Roles | Use Case |
|----------|----------|-------|--------|-------|----------|
| alice | Password123! | alice@example.com | Enabled | user | Primary test user |
| bob | Password123! | bob@example.com | Enabled | user | Multi-user scenarios |
| admin | AdminPass123! | admin@example.com | Enabled | user, admin | Admin privileges |
| carol | Password123! | carol@example.com | **Disabled** | user | Failure testing |

### User 1: alice (Standard User)

**Configuration**:
```json
{
  "username": "alice",
  "email": "alice@example.com",
  "emailVerified": true,
  "enabled": true,
  "firstName": "Alice",
  "lastName": "Anderson",
  
  "credentials": [{
    "type": "password",
    "value": "Password123!",
    "temporary": false
  }],
  
  "realmRoles": ["user"],
  "clientRoles": {
    "web-app": ["user-role"]
  },
  
  "attributes": {
    "department": ["Engineering"],
    "employee_id": ["EMP001"]
  }
}
```

**Custom Attributes** (for token mapper demonstration):
- `department`: "Engineering"
- `employee_id`: "EMP001"

**Use Cases**: Primary user for all standard flow demonstrations

---

### User 2: bob (Standard User)

**Configuration**: Same structure as alice

**Differences**:
- `firstName`: "Bob"
- `lastName`: "Builder"
- `employee_id`: "EMP002"

**Use Cases**:
- Multi-user testing
- Token substitution attack demos
- Comparing different user sessions

---

### User 3: admin (Administrative User)

**Configuration**: Same structure as alice

**Differences**:
- Password: `AdminPass123!`
- Roles: `["user", "admin"]`
- Client roles: `["user-role", "admin-role"]`
- `employee_id`: "EMP999"

**Use Cases**:
- Role-based access control (RBAC) demonstrations
- Elevated privilege scenarios
- Authorization vs authentication distinction
- Impersonation attack demonstrations

---

### User 4: carol (Disabled User)

**Configuration**: Same structure as alice

**Differences**:
- `enabled`: **false**
- No client roles assigned

**Expected Behavior**: Authentication attempts fail with error

**Use Cases**:
- Testing authentication failures
- Error handling demonstrations
- Account state validation

---

## Scope Configuration

### Standard OIDC Scopes

| Scope | Claims | Spec Reference |
|-------|--------|----------------|
| `openid` | `sub` | OIDC Core 5.4 (required) |
| `profile` | `name`, `given_name`, `family_name`, `preferred_username`, etc. | OIDC Core 5.4 |
| `email` | `email`, `email_verified` | OIDC Core 5.4 |
| `address` | `address` (formatted address object) | OIDC Core 5.4 |
| `phone` | `phone_number`, `phone_number_verified` | OIDC Core 5.4 |
| `offline_access` | Enables refresh token issuance | OIDC Core 11 |

### Custom Scopes

| Scope | Description | Claims Added |
|-------|-------------|--------------|
| `read` | Read permission | `read_permission: true` |
| `write` | Write permission | `write_permission: true` |
| `admin` | Admin permission | `admin_permission: true` |

### Scope Assignment to Clients

| Client | Available Scopes | Default Scopes |
|--------|------------------|----------------|
| web-app | All scopes | `openid`, `profile`, `email` |
| spa-client | `openid`, `profile`, `email`, `read`, `write` | `openid`, `profile` |
| mobile-app | `openid`, `profile`, `email`, `read`, `offline_access` | `openid`, `profile` |
| service-account | `read` (no user scopes) | `read` |
| device-client | `openid`, `profile`, `email` | `openid`, `profile` |

**Note**: Consent screens disabled for demo (would normally show requested scopes)

---

## Roles Configuration

### Realm Roles

| Role | Description | Assigned To |
|------|-------------|-------------|
| `user` | Standard user access | alice, bob, admin, carol |
| `admin` | Administrative access | admin |

### Client-Specific Roles

**Client: web-app**
- `user-role`: Basic web app access
- `admin-role`: Admin features in web app

**Client: service-account**
- `service-role`: Service API access

### Role Mappings

| User | Realm Roles | Client Roles (web-app) |
|------|-------------|------------------------|
| alice | user | user-role |
| bob | user | user-role |
| admin | user, admin | user-role, admin-role |
| carol | user | (none) |

**Service Account User** (`service-account-service-account`):
- Realm roles: `service-role`
- Auto-created when service account enabled

---

## Token Configuration

### Token Lifespans

| Token Type | Lifespan | Purpose |
|------------|----------|---------|
| Authorization Code | 60 seconds | Force quick exchange |
| Access Token | 300 seconds (5 min) | Short-lived for demos |
| ID Token | 300 seconds (5 min) | Matches access token |
| Refresh Token | 1800 seconds (30 min) | Longer-lived |
| SSO Session Idle | 1800 seconds (30 min) | User inactivity timeout |
| SSO Session Max | 36000 seconds (10 hours) | Absolute session limit |

**Rationale**: Short lifespans for:
- Demonstrating token expiration
- Testing refresh flows
- Security education (short-lived = more secure)

### Refresh Token Settings

**Key Configuration**:
```json
{
  "refreshTokenMaxReuse": 0  // CRITICAL: Single-use refresh tokens
}
```

**Behavior**:
- Each refresh token can only be used once
- New refresh token issued with each refresh
- Old refresh token immediately invalidated
- Implements refresh token rotation (Security BCP 4.13.2)

**Security Benefit**: Stolen refresh tokens become useless after legitimate use

### Token Format

**Access Tokens**: JWT (RS256 signature)
**ID Tokens**: JWT (RS256 signature)
**Refresh Tokens**: Opaque or JWT (implementation detail)

**Signing Algorithm**: RS256 (RSA with SHA-256)
**Key Rotation**: Auto-rotated by KeyCloak (default 90 days)

---

## Protocol Mappers

### Standard Mappers

KeyCloak automatically includes:

| Mapper | Claim | Source | Tokens |
|--------|-------|--------|--------|
| username | `preferred_username` | User.username | ID, Access |
| email | `email` | User.email | ID, Access |
| email verified | `email_verified` | User.emailVerified | ID, Access |
| given name | `given_name` | User.firstName | ID, Access |
| family name | `family_name` | User.lastName | ID, Access |
| full name | `name` | firstName + lastName | ID, Access |

### Custom Mappers

#### Department Mapper

Maps user attribute `department` to token claim:

```json
{
  "name": "department-mapper",
  "protocol": "openid-connect",
  "protocolMapper": "oidc-usermodel-attribute-mapper",
  "config": {
    "user.attribute": "department",
    "claim.name": "department",
    "jsonType.label": "String",
    "id.token.claim": "true",
    "access.token.claim": "true"
  }
}
```

#### Employee ID Mapper

Maps user attribute `employee_id` to token claim:

```json
{
  "name": "employee-id-mapper",
  "protocol": "openid-connect",
  "protocolMapper": "oidc-usermodel-attribute-mapper",
  "config": {
    "user.attribute": "employee_id",
    "claim.name": "employee_id",
    "jsonType.label": "String",
    "access.token.claim": "true"
  }
}
```

#### Roles Mapper

Maps realm and client roles to token claims:

```json
{
  "name": "realm-roles-mapper",
  "protocolMapper": "oidc-usermodel-realm-role-mapper",
  "config": {
    "claim.name": "realm_access.roles",
    "multivalued": "true",
    "access.token.claim": "true"
  }
}
```

### Example Token with Custom Claims

```json
{
  "sub": "alice",
  "preferred_username": "alice",
  "email": "alice@example.com",
  "email_verified": true,
  "name": "Alice Anderson",
  "given_name": "Alice",
  "family_name": "Anderson",
  
  "department": "Engineering",
  "employee_id": "EMP001",
  
  "realm_access": {
    "roles": ["user"]
  },
  "resource_access": {
    "web-app": {
      "roles": ["user-role"]
    }
  },
  
  "iss": "http://localhost:8080/realms/oauth2-demo",
  "aud": ["web-app", "account"],
  "exp": 1703001534,
  "iat": 1703001234
}
```

---

## PKCE Configuration

### Enforcement by Client

| Client | PKCE Setting | Enforcement |
|--------|--------------|-------------|
| web-app | Optional | Can request without PKCE |
| spa-client | **Required (S256)** | Must include code_challenge |
| mobile-app | **Required (S256)** | Must include code_challenge |
| service-account | N/A | No auth code flow |
| device-client | N/A | No auth code flow |
| vulnerable-client | Not enforced | Can request without PKCE |

### PKCE Methods Supported

- **S256** (SHA-256): `code_challenge = BASE64URL(SHA256(code_verifier))`
- **plain**: `code_challenge = code_verifier` (NOT RECOMMENDED)

**Configuration**: `pkce.code.challenge.method` client attribute
- Empty/"": PKCE optional
- "S256": PKCE required, S256 method only
- "plain": PKCE required, plain method allowed

### PKCE Error Responses

| Error | Cause | Client Config |
|-------|-------|---------------|
| `invalid_request` | Missing code_challenge | PKCE required |
| `invalid_grant` | code_verifier mismatch | Wrong verifier |
| `invalid_request` | Invalid challenge method | Only S256 allowed |

---

## Authentication Flows

### Enabled Flows by Client

| Flow | web-app | spa-client | mobile-app | service-account | device-client | legacy-implicit | vulnerable-client |
|------|---------|------------|------------|-----------------|---------------|-----------------|-------------------|
| Authorization Code | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Client Credentials | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Device Authorization | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Implicit | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Password (Direct Grant) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

**Realm-Level Settings**:
- Browser Flow: Standard (username/password)
- Direct Grant Flow: **Disabled** (security - password grant deprecated)
- Registration Flow: Enabled (allow self-registration)

---

## Realm Export Structure

### JSON Overview

The complete realm export contains:

```json
{
  "id": "oauth2-demo",
  "realm": "oauth2-demo",
  "enabled": true,
  
  "clients": [ /* 7 clients defined above */ ],
  "users": [ /* 4 users defined above */ ],
  "roles": {
    "realm": [ /* realm roles */ ],
    "client": { /* client-specific roles */ }
  },
  "clientScopes": [ /* standard + custom scopes */ ],
  "protocolMappers": [ /* token claim mappers */ ],
  
  "accessTokenLifespan": 300,
  "ssoSessionIdleTimeout": 1800,
  "ssoSessionMaxLifespan": 36000,
  "refreshTokenMaxReuse": 0,
  
  "browserFlow": "browser",
  "directGrantFlow": "direct grant",
  "registrationFlow": "registration",
  
  "requiredCredentials": ["password"],
  "passwordPolicy": "length(8)",
  
  "internationalizationEnabled": false,
  "supportedLocales": ["en"],
  "defaultLocale": "en"
}
```

### Generation

The realm export is generated once and version-controlled. To regenerate:

```bash
docker exec oauth2-demo-keycloak \
  /opt/keycloak/bin/kc.sh export \
  --file /tmp/realm.json \
  --realm oauth2-demo

docker cp oauth2-demo-keycloak:/tmp/realm.json \
  ./keycloak-data/realm-export.json
```

---

## Tool Integration Requirements

### Discovery

Tool should fetch OIDC Discovery on startup:

**Endpoint**: `GET /.well-known/openid-configuration`

**Cache**: Authorization endpoint, token endpoint, userinfo endpoint, jwks_uri, supported flows

### Client Selection

Tool UI should provide dropdown:
```
[web-app                           ▼]
 web-app (Confidential, Optional PKCE)
 spa-client (Public, PKCE Required)
 mobile-app (Public, PKCE Required)
 service-account (Client Credentials)
 device-client (Device Flow)
 legacy-implicit (DEPRECATED) ⚠️
 vulnerable-client (INSECURE) ⚠️
```

### User Selection

Tool UI should provide dropdown:
```
[alice                             ▼]
 alice (Standard User)
 bob (Standard User)
 admin (Administrator)
 carol (Disabled) ⚠️
```

### Scope Selection

Tool UI should allow multi-select:
```
☑ openid (required)
☑ profile
☑ email
☐ read
☐ write
☐ admin
☐ offline_access
```

---

## Document Metadata

| Property | Value |
|----------|-------|
| **Version** | 1.0.0 |
| **Related Docs** | `keycloak-deployment.md`, `keycloak-security-and-vulnerability-mode.md` |
| **Target** | Claude Code (implementation) |

---

**Next**: See `keycloak-security-and-vulnerability-mode.md` for vulnerability demonstrations and security configurations.
