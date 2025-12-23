# KeyCloak Integration Requirements
## Tool-to-KeyCloak Communication Specifications

> *"Integration is just a fancy word for 'making two things talk that really don't want to.'"*

---

## Overview

This document specifies how the OAuth2/OIDC debugging tool should integrate with the KeyCloak instance, including API communication, configuration management, and user interaction patterns.

**Target**: Claude Code implementing tool-KeyCloak integration  
**Related Docs**: `keycloak-deployment.md`, `keycloak-realm-configuration.md`

---

## Configuration Management

### Tool Configuration File

**Location**: `config/keycloak.json` or environment variables

**Structure**:
```json
{
  "keycloak": {
    "baseUrl": "http://localhost:8080",
    "realm": "oauth2-demo",
    "issuerUrl": "http://localhost:8080/realms/oauth2-demo",
    "discoveryUrl": "http://localhost:8080/realms/oauth2-demo/.well-known/openid-configuration",
    "autoDiscover": true,
    "healthCheckInterval": 30000
  },
  "defaults": {
    "clientId": "web-app",
    "responseType": "code",
    "scope": "openid profile email"
  },
  "features": {
    "vulnerabilityMode": true,
    "showDeprecatedFlows": true
  }
}
```

**Environment Variable Overrides**:
```bash
KEYCLOAK_BASE_URL=http://localhost:8080
KEYCLOAK_REALM=oauth2-demo
KEYCLOAK_AUTO_DISCOVER=true
```

---

## Startup Sequence

### Initialization Flow

```
1. Tool Starts
   ↓
2. Load Configuration
   - Read config file
   - Apply environment variable overrides
   ↓
3. Health Check KeyCloak
   - GET /health/ready
   - Timeout: 5 seconds
   - Retries: 3 attempts with 2-second delay
   ↓
4. Fetch OIDC Discovery (if autoDiscover=true)
   - GET /.well-known/openid-configuration
   - Parse and cache endpoint URLs
   - Extract supported features
   ↓
5. Fetch JWKS
   - GET /protocol/openid-connect/certs
   - Cache public keys for token validation
   ↓
6. Display Connection Status
   - ✅ Connected OR ❌ Disconnected with troubleshooting
   ↓
7. Ready for User Interaction
```

### Health Check Implementation

**Endpoint**: `GET http://localhost:8080/health/ready`

**Expected Response**: 
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "UP",
  "checks": [...]
}
```

**Implementation**:
```javascript
async function checkKeyCloakHealth() {
  const url = `${KEYCLOAK_BASE_URL}/health/ready`;
  const timeout = 5000;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(timeout)
    });
    
    return response.ok;  // true if 200-299
  } catch (error) {
    console.error('KeyCloak health check failed:', error);
    return false;
  }
}
```

**Retry Logic**:
```javascript
async function waitForKeyClo ak(maxRetries = 3, delayMs = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    if (await checkKeyCloakHealth()) {
      return true;
    }
    if (i < maxRetries - 1) {
      await sleep(delayMs);
    }
  }
  return false;
}
```

---

## OIDC Discovery Integration

### Discovery Endpoint

**URL**: `GET /.well-known/openid-configuration`

**Response Structure**:
```json
{
  "issuer": "http://localhost:8080/realms/oauth2-demo",
  "authorization_endpoint": "http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/auth",
  "token_endpoint": "http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/token",
  "userinfo_endpoint": "http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/userinfo",
  "jwks_uri": "http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/certs",
  "end_session_endpoint": "http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/logout",
  "introspection_endpoint": "http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/token/introspect",
  "revocation_endpoint": "http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/revoke",
  
  "grant_types_supported": [
    "authorization_code",
    "client_credentials",
    "refresh_token",
    "urn:ietf:params:oauth:grant-type:device_code"
  ],
  "response_types_supported": [
    "code",
    "none",
    "id_token",
    "token",
    "id_token token",
    "code id_token",
    "code token",
    "code id_token token"
  ],
  "scopes_supported": [
    "openid",
    "profile",
    "email",
    "address",
    "phone",
    "offline_access",
    "read",
    "write",
    "admin"
  ],
  "code_challenge_methods_supported": ["plain", "S256"]
}
```

### Discovery Data Usage

**Cache These Values**:
- `issuer`: For token validation (iss claim check)
- `authorization_endpoint`: For authorization requests
- `token_endpoint`: For token exchange/refresh
- `userinfo_endpoint`: For user info requests
- `jwks_uri`: For fetching public keys
- `introspection_endpoint`: For token introspection
- `revocation_endpoint`: For token revocation

**Display These to User**:
- Supported grant types
- Supported response types
- Available scopes
- Supported PKCE methods

**Refresh Interval**: Re-fetch every 24 hours or on manual refresh

---

## Client Configuration

### Client Metadata Structure

**Data Model**:
```typescript
interface Client {
  clientId: string;
  name: string;
  type: 'confidential' | 'public';
  secret?: string;  // Only for confidential clients
  
  flows: {
    authorizationCode: boolean;
    implicit: boolean;
    clientCredentials: boolean;
    deviceAuthorization: boolean;
    password: boolean;  // Direct grant
  };
  
  pkce: {
    required: boolean;
    method?: 'S256' | 'plain';
  };
  
  redirectUris: string[];
  webOrigins: string[];
  
  scopes: string[];  // Available scopes
  defaultScopes: string[];
  
  deprecated?: boolean;
  vulnerable?: boolean;
  warningMessage?: string;
}
```

### Pre-Configured Clients

**Load from Configuration**:
```json
{
  "clients": [
    {
      "clientId": "web-app",
      "name": "Web Application Client",
      "type": "confidential",
      "secret": "web-app-secret-12345",
      "flows": {
        "authorizationCode": true,
        "clientCredentials": false
      },
      "pkce": {
        "required": false
      },
      "redirectUris": [
        "http://localhost:3000/callback",
        "http://localhost:3000/oauth2/callback"
      ],
      "scopes": ["openid", "profile", "email", "read", "write"]
    },
    {
      "clientId": "spa-client",
      "name": "Single Page Application",
      "type": "public",
      "flows": {
        "authorizationCode": true
      },
      "pkce": {
        "required": true,
        "method": "S256"
      },
      "redirectUris": ["http://localhost:3000/spa/callback"],
      "scopes": ["openid", "profile", "email", "read"]
    },
    // ... other clients
    {
      "clientId": "vulnerable-client",
      "name": "Vulnerable Client (EDUCATIONAL)",
      "type": "confidential",
      "secret": "weak-secret",
      "flows": {
        "authorizationCode": true,
        "implicit": true,
        "password": true
      },
      "pkce": {
        "required": false
      },
      "vulnerable": true,
      "warningMessage": "This client has intentionally insecure configuration for educational purposes."
    }
  ]
}
```

---

## User Configuration

### User Metadata Structure

**Data Model**:
```typescript
interface User {
  username: string;
  password: string;
  email: string;
  name: string;
  enabled: boolean;
  roles: string[];
  warningMessage?: string;
}
```

### Pre-Configured Users

```json
{
  "users": [
    {
      "username": "alice",
      "password": "Password123!",
      "email": "alice@example.com",
      "name": "Alice Anderson",
      "enabled": true,
      "roles": ["user"]
    },
    {
      "username": "bob",
      "password": "Password123!",
      "email": "bob@example.com",
      "name": "Bob Builder",
      "enabled": true,
      "roles": ["user"]
    },
    {
      "username": "admin",
      "password": "AdminPass123!",
      "email": "admin@example.com",
      "name": "Admin User",
      "enabled": true,
      "roles": ["user", "admin"]
    },
    {
      "username": "carol",
      "password": "Password123!",
      "email": "carol@example.com",
      "name": "Carol Cooper",
      "enabled": false,
      "roles": ["user"],
      "warningMessage": "This user is disabled for testing authentication failures."
    }
  ]
}
```

---

## Flow Execution

### Authorization Code Flow

**Implementation**:

```javascript
async function executeAuthorizationCodeFlow(config) {
  // 1. Generate PKCE (if required)
  let codeVerifier, codeChallenge;
  if (config.usePKCE) {
    codeVerifier = generateCodeVerifier();
    codeChallenge = await generateCodeChallenge(codeVerifier, 'S256');
  }
  
  // 2. Generate state
  const state = generateRandomString(32);
  storeState(state);  // Store for CSRF validation
  
  // 3. Build authorization URL
  const authUrl = buildAuthorizationUrl({
    authorizationEndpoint: endpoints.authorization,
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    scope: config.scopes.join(' '),
    state: state,
    responseType: 'code',
    codeChallenge: codeChallenge,
    codeChallengeMethod: config.usePKCE ? 'S256' : undefined
  });
  
  // 4. Redirect user to KeyCloak (or open in popup)
  window.location.href = authUrl;
  // OR
  const popup = window.open(authUrl, 'oauth', 'width=600,height=800');
  
  // 5. Handle callback (in callback route)
  // - Verify state matches
  // - Extract authorization code
  // - Exchange code for tokens
  
  // 6. Token exchange
  const tokens = await exchangeCodeForTokens({
    tokenEndpoint: endpoints.token,
    code: authorizationCode,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: config.redirectUri,
    codeVerifier: config.usePKCE ? codeVerifier : undefined
  });
  
  return tokens;
}
```

### Client Credentials Flow

**Implementation**:

```javascript
async function executeClientCredentialsFlow(config) {
  const response = await fetch(endpoints.token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${config.clientId}:${config.clientSecret}`)
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: config.scopes.join(' ')
    })
  });
  
  if (!response.ok) {
    throw new Error(`Token request failed: ${response.status}`);
  }
  
  return await response.json();
}
```

### Device Authorization Flow

**Implementation**:

```javascript
async function executeDeviceFlow(config) {
  // 1. Device authorization request
  const deviceResponse = await fetch(endpoints.deviceAuthorization, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      scope: config.scopes.join(' ')
    })
  });
  
  const deviceData = await deviceResponse.json();
  /*
    {
      "device_code": "GmRh...4j",
      "user_code": "WDJB-MJHT",
      "verification_uri": "http://localhost:8080/realms/oauth2-demo/device",
      "verification_uri_complete": "http://...",
      "expires_in": 600,
      "interval": 5
    }
  */
  
  // 2. Display user code to user
  displayUserCode(deviceData.user_code, deviceData.verification_uri);
  
  // 3. Poll token endpoint
  const tokens = await pollForTokens({
    tokenEndpoint: endpoints.token,
    deviceCode: deviceData.device_code,
    clientId: config.clientId,
    interval: deviceData.interval
  });
  
  return tokens;
}

async function pollForTokens(config) {
  while (true) {
    await sleep(config.interval * 1000);
    
    const response = await fetch(config.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        device_code: config.deviceCode,
        client_id: config.clientId
      })
    });
    
    if (response.ok) {
      return await response.json();  // Tokens!
    }
    
    const error = await response.json();
    
    if (error.error === 'authorization_pending') {
      continue;  // Keep polling
    } else if (error.error === 'slow_down') {
      config.interval += 5;  // Increase interval
      continue;
    } else {
      throw new Error(`Device flow error: ${error.error}`);
    }
  }
}
```

---

## Token Management

### Token Storage

**In-Memory Storage** (recommended for tool):
```javascript
const tokenStore = {
  accessToken: null,
  idToken: null,
  refreshToken: null,
  expiresAt: null
};
```

**Do NOT use localStorage** (browser storage restriction in Claude.ai artifacts)

### Token Validation

**JWT Decoding**:
```javascript
function decodeJWT(token) {
  const [headerB64, payloadB64, signatureB64] = token.split('.');
  
  const header = JSON.parse(atob(headerB64));
  const payload = JSON.parse(atob(payloadB64));
  
  return { header, payload, signature: signatureB64 };
}
```

**Signature Verification**:
```javascript
async function verifyTokenSignature(token, jwks) {
  const { header, payload } = decodeJWT(token);
  
  // Find matching key in JWKS
  const key = jwks.keys.find(k => k.kid === header.kid);
  if (!key) {
    throw new Error('No matching key in JWKS');
  }
  
  // Verify signature using Web Crypto API
  const publicKey = await importJWK(key);
  const [headerB64, payloadB64, signatureB64] = token.split('.');
  const data = `${headerB64}.${payloadB64}`;
  const signature = base64UrlDecode(signatureB64);
  
  const isValid = await crypto.subtle.verify(
    { name: 'RSASSA-PKCS1-v1_5' },
    publicKey,
    signature,
    new TextEncoder().encode(data)
  );
  
  return isValid;
}
```

**Token Introspection** (alternative to local validation):
```javascript
async function introspectToken(token, clientId, clientSecret) {
  const response = await fetch(endpoints.introspection, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`)
    },
    body: new URLSearchParams({
      token: token,
      token_type_hint: 'access_token'
    })
  });
  
  return await response.json();
  // { active: true, exp: 1703001534, ... }
}
```

### Token Refresh

**Implementation**:
```javascript
async function refreshAccessToken(refreshToken, clientId, clientSecret) {
  const response = await fetch(endpoints.token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret  // If confidential client
    })
  });
  
  if (!response.ok) {
    throw new Error('Token refresh failed');
  }
  
  const tokens = await response.json();
  // Note: New refresh token issued (rotation)
  
  return tokens;
}
```

### Token Revocation

**Implementation**:
```javascript
async function revokeToken(token, clientId, clientSecret, tokenTypeHint = 'refresh_token') {
  const response = await fetch(endpoints.revocation, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`)
    },
    body: new URLSearchParams({
      token: token,
      token_type_hint: tokenTypeHint
    })
  });
  
  // Success: 200 OK with no content
  return response.ok;
}
```

---

## UI Components

### Connection Status Indicator

**Component**:
```jsx
function KeyCloakStatus({ connected, latency }) {
  return (
    <div className="status-indicator">
      {connected ? (
        <>
          <span className="status-icon">✅</span>
          <span>Connected to KeyCloak</span>
          <span className="latency">({latency}ms)</span>
        </>
      ) : (
        <>
          <span className="status-icon">❌</span>
          <span>Disconnected</span>
          <a href="#troubleshooting">Troubleshoot</a>
        </>
      )}
    </div>
  );
}
```

### Client Selector

**Component**:
```jsx
function ClientSelector({ clients, selectedClient, onChange, vulnerabilityModeEnabled }) {
  return (
    <select value={selectedClient} onChange={e => onChange(e.target.value)}>
      {clients
        .filter(c => vulnerabilityModeEnabled || !c.vulnerable)
        .map(client => (
          <option key={client.clientId} value={client.clientId}>
            {client.name}
            {client.vulnerable && ' ⚠️ VULNERABLE'}
            {client.deprecated && ' ⚠️ DEPRECATED'}
          </option>
        ))}
    </select>
  );
}
```

### User Selector

**Component**:
```jsx
function UserSelector({ users, selectedUser, onChange }) {
  return (
    <select value={selectedUser} onChange={e => onChange(e.target.value)}>
      {users.map(user => (
        <option key={user.username} value={user.username} disabled={!user.enabled}>
          {user.name}
          {!user.enabled && ' (Disabled)'}
        </option>
      ))}
    </select>
  );
}
```

---

## Error Handling

### Common Errors

| Error | Cause | User Action |
|-------|-------|-------------|
| `ECONNREFUSED` | KeyCloak not running | Start KeyCloak: `docker-compose up -d` |
| `ETIMEDOUT` | Network issue or KeyCloak unresponsive | Check logs: `docker logs oauth2-demo-keycloak` |
| `invalid_client` | Client ID not found or disabled | Verify client exists in KeyCloak |
| `unauthorized_client` | Wrong client secret or grant type not enabled | Check client configuration |
| `invalid_grant` | Authorization code expired/invalid, PKCE mismatch | Restart flow, check code_verifier |
| `invalid_redirect_uri` | Redirect URI mismatch | Use exact registered URI |
| `access_denied` | User denied authorization | Normal behavior (user choice) |

### Error Display

**UI Component**:
```jsx
function ErrorDisplay({ error }) {
  const errorMessages = {
    'invalid_client': {
      message: 'Client not found or disabled',
      action: 'Verify client exists in KeyCloak Admin Console'
    },
    'invalid_grant': {
      message: 'Authorization code invalid or expired',
      action: 'Restart the authorization flow'
    },
    // ... other errors
  };
  
  const errorInfo = errorMessages[error.error] || {
    message: error.error_description || error.error,
    action: 'Check the console for details'
  };
  
  return (
    <div className="error-banner">
      <strong>Error:</strong> {errorInfo.message}
      <br />
      <strong>Action:</strong> {errorInfo.action}
    </div>
  );
}
```

---

## Testing Integration

### Integration Test Requirements

**Test Cases**:

1. **Connectivity Test**
   - Verify KeyCloak health check succeeds
   - Verify OIDC Discovery accessible
   - Verify JWKS endpoint accessible

2. **Authorization Code Flow Test**
   - Execute full flow with each client
   - Verify tokens received
   - Verify token claims correct

3. **PKCE Enforcement Test**
   - Verify spa-client rejects without PKCE
   - Verify web-app allows without PKCE

4. **Client Credentials Test**
   - Verify service-account can obtain token
   - Verify no ID token in response

5. **Token Refresh Test**
   - Obtain tokens
   - Refresh access token
   - Verify new tokens issued

6. **Token Revocation Test**
   - Obtain tokens
   - Revoke refresh token
   - Verify subsequent refresh fails

### Mock Mode

**For Development Without KeyCloak**:

```javascript
const MOCK_MODE = process.env.MOCK_KEYCLOAK === 'true';

async function fetchDiscovery() {
  if (MOCK_MODE) {
    return {
      issuer: 'http://localhost:8080/realms/oauth2-demo',
      authorization_endpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/auth',
      // ... mock endpoints
    };
  }
  
  return await fetch(discoveryUrl).then(r => r.json());
}
```

---

## Document Metadata

| Property | Value |
|----------|-------|
| **Version** | 1.0.0 |
| **Related Docs** | All KeyCloak docs, OAuth2/OIDC specs |
| **Target** | Claude Code (implementation) |

---

**Next**: See `keycloak-testing-and-troubleshooting.md` for comprehensive testing and debugging guidance.
