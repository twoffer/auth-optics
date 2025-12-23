# KeyCloak Testing and Troubleshooting
## Validation, Debugging, and Common Issues

> *"The difference between a working demo and a broken demo is usually one missing redirect URI."*

---

## Overview

This document provides testing procedures, troubleshooting guides, and debugging techniques for KeyCloak integration issues.

**Target**: Claude Code implementing testing and debugging features  
**Related Docs**: `keycloak-deployment.md`, `keycloak-integration-requirements.md`

---

## Automated Testing

### Test Script Requirements

**Script**: `scripts/test-keycloak.sh`

**Purpose**: Validate KeyCloak configuration

**Test Categories**:
1. Connectivity Tests
2. Configuration Tests
3. Flow Execution Tests
4. Security Tests

### Test Suite Implementation

**Structure**:
```bash
#!/bin/bash

# Test counters
PASS=0
FAIL=0

# Test function
test_case() {
  local name=$1
  local command=$2
  local expected=$3
  
  echo -n "Testing: $name ... "
  
  result=$(eval "$command" 2>&1)
  
  if echo "$result" | grep -q "$expected"; then
    echo "PASS ✓"
    ((PASS++))
  else
    echo "FAIL ✗"
    echo "  Expected: $expected"
    echo "  Got: $result"
    ((FAIL++))
  fi
}

# Run tests
echo "KeyCloak Configuration Test Suite"
echo "=================================="

# Test 1: Health check
test_case "Health check" \
  "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/health/ready" \
  "200"

# Test 2: OIDC Discovery
test_case "OIDC Discovery" \
  "curl -s http://localhost:8080/realms/oauth2-demo/.well-known/openid-configuration | jq -r '.issuer'" \
  "http://localhost:8080/realms/oauth2-demo"

# Test 3: JWKS
test_case "JWKS endpoint" \
  "curl -s http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/certs | jq -r '.keys | length'" \
  "[0-9]"  # At least one key

# Test 4: Client credentials flow
test_case "Client Credentials Flow" \
  "curl -s -X POST http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/token -d 'grant_type=client_credentials&client_id=service-account&client_secret=service-secret-67890'" \
  "access_token"

# Test 5: Token introspection
ACCESS_TOKEN=$(curl -s -X POST http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/token \
  -d 'grant_type=client_credentials&client_id=service-account&client_secret=service-secret-67890' \
  | jq -r '.access_token')

test_case "Token Introspection" \
  "curl -s -X POST http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/token/introspect -u 'service-account:service-secret-67890' -d 'token=$ACCESS_TOKEN' | jq -r '.active'" \
  "true"

# Summary
echo ""
echo "=================================="
echo "Test Results:"
echo "  Passed: $PASS"
echo "  Failed: $FAIL"
echo "=================================="

[ $FAIL -eq 0 ] && exit 0 || exit 1
```

### Integration Tests

**Test Framework**: Jest, Mocha, or Pytest

**Example Test Cases**:

```javascript
describe('KeyCloak Integration', () => {
  describe('Connectivity', () => {
    it('should connect to KeyCloak health endpoint', async () => {
      const response = await fetch('http://localhost:8080/health/ready');
      expect(response.ok).toBe(true);
    });
    
    it('should fetch OIDC Discovery', async () => {
      const discovery = await fetchDiscovery();
      expect(discovery.issuer).toBe('http://localhost:8080/realms/oauth2-demo');
      expect(discovery.authorization_endpoint).toBeDefined();
      expect(discovery.token_endpoint).toBeDefined();
    });
  });
  
  describe('Authorization Code Flow', () => {
    it('should execute full authorization code flow with web-app', async () => {
      const config = {
        clientId: 'web-app',
        clientSecret: 'web-app-secret-12345',
        redirectUri: 'http://localhost:3000/callback',
        scopes: ['openid', 'profile']
      };
      
      // This would require automating browser interaction
      // or using mock authorization server
      const tokens = await executeAuthorizationCodeFlow(config);
      
      expect(tokens.access_token).toBeDefined();
      expect(tokens.id_token).toBeDefined();
      expect(tokens.refresh_token).toBeDefined();
    });
  });
  
  describe('Client Credentials Flow', () => {
    it('should obtain access token with service-account', async () => {
      const tokens = await executeClientCredentialsFlow({
        clientId: 'service-account',
        clientSecret: 'service-secret-67890',
        scopes: ['read']
      });
      
      expect(tokens.access_token).toBeDefined();
      expect(tokens.id_token).toBeUndefined();  // No ID token
      expect(tokens.refresh_token).toBeUndefined();  // No refresh token
    });
  });
  
  describe('PKCE Enforcement', () => {
    it('should reject spa-client without PKCE', async () => {
      // Token exchange without code_verifier should fail
      await expect(
        exchangeCodeForTokens({
          clientId: 'spa-client',
          code: 'SOME_CODE',
          redirectUri: 'http://localhost:3000/spa/callback'
          // No codeVerifier
        })
      ).rejects.toThrow('invalid_grant');
    });
  });
  
  describe('Token Management', () => {
    it('should refresh access token', async () => {
      // Get initial tokens
      const initial = await getTokens();
      
      // Wait for expiration (or mock)
      await sleep(5000);
      
      // Refresh
      const refreshed = await refreshAccessToken(
        initial.refresh_token,
        'web-app',
        'web-app-secret-12345'
      );
      
      expect(refreshed.access_token).toBeDefined();
      expect(refreshed.access_token).not.toBe(initial.access_token);
      expect(refreshed.refresh_token).toBeDefined();
      expect(refreshed.refresh_token).not.toBe(initial.refresh_token);  // Rotation
    });
    
    it('should revoke refresh token', async () => {
      const tokens = await getTokens();
      
      // Revoke
      await revokeToken(tokens.refresh_token, 'web-app', 'web-app-secret-12345');
      
      // Attempt to use revoked token
      await expect(
        refreshAccessToken(tokens.refresh_token, 'web-app', 'web-app-secret-12345')
      ).rejects.toThrow();
    });
  });
});
```

---

## Manual Testing Procedures

### Test Checklist

**Before Demo/Presentation**:

- [ ] **KeyCloak Running**
  ```bash
  docker ps | grep oauth2-demo-keycloak
  # Should show RUNNING status
  ```

- [ ] **Health Check Passes**
  ```bash
  curl http://localhost:8080/health/ready
  # Should return 200 OK
  ```

- [ ] **All 7 Clients Exist**
  - Open Admin Console: http://localhost:8080/admin
  - Login: admin/admin
  - Navigate to Clients
  - Verify: web-app, spa-client, mobile-app, service-account, device-client, legacy-implicit, vulnerable-client

- [ ] **All 4 Users Exist**
  - Navigate to Users
  - Verify: alice, bob, admin, carol

- [ ] **Quick Flow Test**
  ```bash
  # Test client credentials flow
  curl -X POST http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/token \
    -d "grant_type=client_credentials" \
    -d "client_id=service-account" \
    -d "client_secret=service-secret-67890" \
    | jq '.access_token'
  # Should return token
  ```

- [ ] **Tool Connects Successfully**
  - Start tool
  - Verify "Connected to KeyCloak" status
  - Verify no error messages

---

## Troubleshooting Guide

### Issue 1: KeyCloak Won't Start

**Symptoms**:
- Container exits immediately after starting
- `docker ps` shows no KeyCloak container
- Port 8080 not listening

**Diagnosis**:
```bash
# Check container logs
docker logs oauth2-demo-keycloak

# Check if port in use
lsof -i :8080
# OR
netstat -an | grep 8080

# Check Docker resources
docker stats
```

**Common Causes & Solutions**:

| Cause | Solution |
|-------|----------|
| Port 8080 already in use | Kill process: `kill $(lsof -t -i:8080)` OR change port in docker-compose.yml |
| Insufficient Docker memory | Increase: Docker Desktop → Preferences → Resources → Memory (min 2GB) |
| Corrupted H2 database | Remove volume: `docker-compose down -v && docker-compose up -d` |
| Invalid realm export JSON | Validate JSON: `jq . keycloak-data/realm-export.json` |
| Permission issues on volume | Check file permissions: `ls -la keycloak-data/` |

**Step-by-Step Fix**:
```bash
# 1. Stop everything
docker-compose down -v

# 2. Verify port is free
lsof -i :8080
# Should return nothing

# 3. Verify realm JSON is valid
jq . keycloak-data/realm-export.json > /dev/null
echo $?  # Should be 0

# 4. Start fresh
docker-compose up -d

# 5. Watch logs
docker-compose logs -f keycloak

# 6. Wait for "Listening on: http://0.0.0.0:8080"

# 7. Test health check
curl http://localhost:8080/health/ready
```

---

### Issue 2: Realm Import Failed

**Symptoms**:
- Clients missing in Admin Console
- Users don't exist
- Logs show "import failed" or errors

**Diagnosis**:
```bash
# Check import logs
docker logs oauth2-demo-keycloak | grep -i import

# Check for errors
docker logs oauth2-demo-keycloak | grep -i error

# Verify realm file is mounted
docker exec oauth2-demo-keycloak ls -la /opt/keycloak/data/import/
```

**Common Causes & Solutions**:

| Cause | Solution |
|-------|----------|
| JSON syntax error | Validate: `jq . keycloak-data/realm-export.json` |
| File not mounted | Check docker-compose.yml volumes section |
| File permissions | `chmod 644 keycloak-data/realm-export.json` |
| Wrong file path in volume | Verify: `/opt/keycloak/data/import/oauth2-demo-realm.json` |
| Realm already exists | KeyCloak won't overwrite. Delete realm first or use `--override true` |

**Manual Import**:
```bash
# Copy realm file into container
docker cp keycloak-data/realm-export.json oauth2-demo-keycloak:/tmp/realm.json

# Import manually
docker exec -it oauth2-demo-keycloak \
  /opt/keycloak/bin/kc.sh import \
  --file /tmp/realm.json \
  --override true

# Restart
docker-compose restart keycloak
```

---

### Issue 3: Users Can't Authenticate

**Symptoms**:
- Login page shows "Invalid username or password"
- Alice/Bob/Admin login fails

**Diagnosis**:
```bash
# Verify user exists
curl -u "admin:admin" \
  http://localhost:8080/admin/realms/oauth2-demo/users?username=alice | jq

# Check if user is enabled
# Look for "enabled": true in response

# Check events
# Admin Console → Events → Login Events
# Look for LOGIN_ERROR events
```

**Common Causes & Solutions**:

| Cause | Solution |
|-------|----------|
| Wrong password | Verify using documented passwords (Password123! for alice/bob) |
| User doesn't exist | Check realm import, verify users in Admin Console |
| User disabled (carol case) | This is intentional for carol. Use alice or bob. |
| Realm name wrong | Ensure using "oauth2-demo" realm |
| Caps Lock on | Passwords are case-sensitive |

**Test Authentication**:
```bash
# Using password grant (if enabled)
curl -X POST http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/token \
  -d "grant_type=password" \
  -d "client_id=web-app" \
  -d "client_secret=web-app-secret-12345" \
  -d "username=alice" \
  -d "password=Password123!" \
  | jq

# Should return tokens if authentication successful
```

**Reset Password**:
```
Admin Console → Users → alice → Credentials → Set Password
Enter new password, set Temporary: OFF
```

---

### Issue 4: PKCE Not Enforced

**Symptoms**:
- spa-client allows token exchange without code_verifier
- No PKCE errors when expected

**Diagnosis**:
```bash
# Check client configuration
curl -u "admin:admin" \
  'http://localhost:8080/admin/realms/oauth2-demo/clients?clientId=spa-client' \
  | jq '.[0].attributes."pkce.code.challenge.method"'

# Should return "S256"
```

**Solution**:
```
Admin Console → Clients → spa-client → Settings
→ Advanced Settings
→ Proof Key for Code Exchange Code Challenge Method: S256
→ Save
```

**Verify Fix**:
```bash
# Attempt token exchange without code_verifier
curl -X POST http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/token \
  -d "grant_type=authorization_code" \
  -d "code=SOME_CODE" \
  -d "client_id=spa-client" \
  -d "redirect_uri=http://localhost:3000/spa/callback"

# Should return error: "PKCE code verifier not specified"
```

---

### Issue 5: Token Endpoint Errors

#### Error: `invalid_grant`

**Possible Causes**:
1. Authorization code expired (60 second timeout)
2. Authorization code already used (single-use)
3. redirect_uri mismatch
4. PKCE code_verifier mismatch

**Diagnosis**:
```bash
# Check code age
# Authorization codes expire after 60 seconds
# Exchange code immediately after obtaining it

# Check redirect_uri
# Must EXACTLY match authorization request
# Case-sensitive, including trailing slashes

# Check PKCE
# code_verifier must match code_challenge from authorization request
```

**Solutions**:
- Reduce delay between authorization and token exchange
- Ensure redirect_uri matches exactly
- Verify code_verifier matches code_challenge
- Don't reuse authorization codes

#### Error: `invalid_client`

**Possible Causes**:
1. client_id doesn't exist
2. Client disabled
3. Wrong realm

**Diagnosis**:
```bash
# Check if client exists
curl -u "admin:admin" \
  'http://localhost:8080/admin/realms/oauth2-demo/clients?clientId=web-app' \
  | jq

# Should return array with one client
```

**Solution**:
- Verify client_id spelling
- Check client is enabled in Admin Console
- Ensure using correct realm (oauth2-demo)

#### Error: `unauthorized_client`

**Possible Causes**:
1. Wrong client_secret
2. Grant type not enabled for client
3. Client authentication failed

**Diagnosis**:
```bash
# Verify client secret
# Admin Console → Clients → web-app → Credentials
# Regenerate if needed

# Check grant types enabled
# Admin Console → Clients → web-app → Capability config
# Ensure required grant type is enabled
```

**Solution**:
- Double-check client_secret (case-sensitive)
- Enable required grant type in client settings
- Use correct authentication method (Basic Auth vs form-encoded)

---

### Issue 6: Redirect URI Validation Failures

**Symptom**: `invalid_redirect_uri` error

**Cause**: redirect_uri doesn't match registered URIs

**Common Mistakes**:
```
Registered:     http://localhost:3000/callback
Requested:      http://localhost:3000/callback/    ← Trailing slash!
Result:         ERROR

Registered:     http://localhost:3000/callback
Requested:      http://127.0.0.1:3000/callback     ← localhost vs 127.0.0.1
Result:         ERROR

Registered:     http://localhost:3000/callback
Requested:      https://localhost:3000/callback    ← http vs https
Result:         ERROR
```

**Solution**: Exact matching required
- Same protocol (http/https)
- Same host (localhost vs 127.0.0.1 are different)
- Same port (explicit vs implicit: 80, 443)
- Same path (case-sensitive)
- Same query/fragment handling

**Fix**:
```
Admin Console → Clients → [client] → Settings
→ Valid Redirect URIs
→ Add exact URI user is requesting
→ Save
```

---

### Issue 7: Token Introspection Returns `{"active": false}`

**Possible Causes**:
1. Token expired
2. Token revoked
3. Invalid token
4. Token not from this realm

**Diagnosis**:
```bash
# Decode JWT (access token)
echo "ACCESS_TOKEN" | cut -d. -f2 | base64 -d | jq

# Check expiration
# exp claim: Unix timestamp
# Current time: date +%s
# Token valid if: current_time < exp

# Check issuer
# iss claim should match: http://localhost:8080/realms/oauth2-demo
```

**Solution**:
- Obtain fresh token if expired
- Use token before expiration (5 minutes)
- Don't use tokens after revocation

---

### Issue 8: Tool Can't Connect to KeyCloak

**Symptoms**:
- Tool shows "Disconnected" status
- "Connection refused" errors
- Timeout errors

**Diagnosis**:
```bash
# Is KeyCloak running?
docker ps | grep keycloak

# Is port accessible?
curl http://localhost:8080/health/ready

# Network issues?
ping localhost

# Firewall blocking?
# Check firewall settings
```

**Solutions**:

| Symptom | Solution |
|---------|----------|
| Container not running | Start: `docker-compose up -d` |
| Port not mapped | Check docker-compose.yml ports: "8080:8080" |
| Wrong URL in tool config | Verify: `http://localhost:8080` (not https) |
| Network mode issue | Ensure bridge network configured |

---

## Debugging Tools

### Browser Developer Tools

**Network Tab**:
- View all HTTP requests/responses
- Check request headers, body
- Verify redirect_uri parameters
- Examine token responses

**Console Tab**:
- View JavaScript errors
- Log token contents
- Debug PKCE generation

**Application Tab** (NOT available in artifacts):
- View cookies
- ~~View localStorage~~ (don't use - not supported in artifacts)

### Command Line Tools

**cURL**: HTTP requests
```bash
# Authorization (manual flow)
curl -v "http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/auth?..."

# Token exchange
curl -v -X POST http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/token \
  -d "grant_type=authorization_code&..."

# Token introspection
curl -v -X POST http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/token/introspect \
  -u "client:secret" \
  -d "token=..."
```

**jq**: JSON parsing
```bash
# Pretty-print response
curl ... | jq

# Extract specific field
curl ... | jq -r '.access_token'

# Decode JWT payload
echo "ACCESS_TOKEN" | cut -d. -f2 | base64 -d | jq
```

**jwt.io**: JWT decoder
- Paste JWT at https://jwt.io
- View decoded header and payload
- Verify signature (paste JWKS)

### KeyCloak Admin Console

**URL**: http://localhost:8080/admin

**Useful Sections**:
- **Clients**: View/edit client configuration
- **Users**: View/edit users, reset passwords
- **Events → Login Events**: View authentication attempts, errors
- **Events → Admin Events**: View configuration changes
- **Realm Settings → Keys**: View signing keys, JWKS

### Logging

**KeyCloak Logs**:
```bash
# Real-time logs
docker-compose logs -f keycloak

# Error logs only
docker-compose logs keycloak | grep ERROR

# Specific event
docker-compose logs keycloak | grep "LOGIN_ERROR"
```

**Increase Log Verbosity**:
```yaml
# docker-compose.yml
services:
  keycloak:
    environment:
      KC_LOG_LEVEL: DEBUG  # More detailed logs
```

---

## Pre-Demo Checklist

**1 Day Before**:
- [ ] Test KeyCloak startup: `docker-compose up -d`
- [ ] Run automated tests: `./scripts/test-keycloak.sh`
- [ ] Verify all clients exist
- [ ] Verify all users can authenticate
- [ ] Test one full authorization code flow
- [ ] Backup configuration: `./scripts/backup-keycloak.sh`

**1 Hour Before**:
- [ ] Start KeyCloak: `docker-compose up -d`
- [ ] Run quick health check: `curl http://localhost:8080/health/ready`
- [ ] Test tool connection
- [ ] Open Admin Console in browser tab (stay logged in)
- [ ] Open tool in browser tab

**During Demo**:
- [ ] Keep Admin Console open for quick checks
- [ ] Keep terminal open with `docker-compose logs -f` (hidden from audience)
- [ ] Have troubleshooting commands ready in text file
- [ ] Know how to quickly restart KeyCloak if needed

---

## Common Demo Failures

### "It worked in rehearsal..."

**Murphy's Law Scenarios**:

1. **Docker Updated Overnight**
   - Old images purged
   - Solution: `docker-compose pull` before demo

2. **Network Changed**
   - localhost resolves differently
   - Solution: Use 127.0.0.1 instead

3. **Browser Cached Old Tokens**
   - Tool shows stale tokens
   - Solution: Clear browser cache, restart

4. **Caps Lock**
   - Password authentication fails
   - Solution: Check Caps Lock indicator

5. **Wrong Realm Selected**
   - Admin Console showing master realm
   - Solution: Dropdown → oauth2-demo

---

## Document Metadata

| Property | Value |
|----------|-------|
| **Version** | 1.0.0 |
| **Related Docs** | All KeyCloak configuration docs |
| **Target** | Claude Code (implementation), Troubleshooters |

---

**Pro Tip**: When demoing, always have a backup plan. If live flow fails, have screenshots/video of working flow ready to show.
