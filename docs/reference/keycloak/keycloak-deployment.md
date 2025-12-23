# KeyCloak Deployment Guide
## Infrastructure and Setup for OAuth2/OIDC Tool

> *"Getting the IdP running is half the battle. The other half is understanding why it's running."*

---

## Overview

This document covers KeyCloak deployment architecture, Docker configuration, and initialization requirements for the OAuth2/OIDC debugging tool.

**Target**: Claude Code implementing deployment infrastructure  
**Prerequisites**: Docker/Docker Compose knowledge, KeyCloak 22.x  
**Related Docs**: `keycloak-realm-configuration.md`, `keycloak-integration-requirements.md`

---

## Deployment Architecture

### Component Layout

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Host                          │
│                                                          │
│  ┌──────────────────┐         ┌────────────────────┐   │
│  │   KeyCloak       │         │  OAuth2/OIDC Tool  │   │
│  │   Container      │◄────────┤  Container         │   │
│  │                  │  HTTP   │                    │   │
│  │  Port: 8080      │  (dev)  │  Port: 3000        │   │
│  │  Realm: oauth2-  │         │                    │   │
│  │  demo            │         │                    │   │
│  └──────────────────┘         └────────────────────┘   │
│         │                                                │
│         │ (Optional - persistent mode)                  │
│         ▼                                                │
│  ┌──────────────────┐                                   │
│  │  PostgreSQL      │                                   │
│  │  Container       │                                   │
│  └──────────────────┘                                   │
└─────────────────────────────────────────────────────────┘
```

**Key Points**:
- Separate containers for isolation
- Custom Docker network for inter-container communication
- KeyCloak on port 8080 (configurable)
- Tool on port 3000 (configurable)
- Optional PostgreSQL for persistent storage

---

## Docker Compose Configuration

### Requirements

**File**: `docker-compose.yml` in project root

**Services Required**:

1. **keycloak** (required)
   - Image: `quay.io/keycloak/keycloak:22.0.5`
   - Container name: `oauth2-demo-keycloak`
   - Ports: `8080:8080`
   - Database: H2 in-memory (default) or PostgreSQL (persistent profile)
   - Import: Auto-import realm on startup

2. **postgres** (optional, enabled via profile)
   - Image: `postgres:15-alpine`
   - Container name: `oauth2-demo-postgres`
   - Used only when `--profile persistent` flag provided
   - Persists data across restarts

3. **tool** (future - defined in separate docker-compose)
   - OAuth2/OIDC debugging tool
   - Depends on KeyCloak service

### KeyCloak Service Configuration

**Environment Variables**:
```yaml
KEYCLOAK_ADMIN: admin                    # Admin username
KEYCLOAK_ADMIN_PASSWORD: admin           # Admin password (DEMO ONLY)
KC_DB: dev-mem                           # H2 in-memory (or 'postgres' for persistent)
KC_HTTP_ENABLED: "true"                  # Allow HTTP (dev only)
KC_HTTP_PORT: "8080"                     # Port number
KC_HOSTNAME_STRICT: "false"              # Allow localhost (dev only)
KC_HOSTNAME_STRICT_HTTPS: "false"        # Disable HTTPS requirement (dev only)
KC_LOG_LEVEL: INFO                       # Logging verbosity
```

**Command**:
```yaml
command:
  - start-dev        # Development mode (DO NOT use in production)
  - --import-realm   # Auto-import realm from volume
```

**Volumes**:
```yaml
volumes:
  - ./keycloak-data/realm-export.json:/opt/keycloak/data/import/oauth2-demo-realm.json:ro
  - keycloak-data:/opt/keycloak/data
```

**Health Check**:
```yaml
healthcheck:
  test: ["CMD-SHELL", "exec 3<>/dev/tcp/localhost/8080 && echo -e 'GET /health/ready HTTP/1.1\\r\\nHost: localhost\\r\\n\\r\\n' >&3 && cat <&3 | grep -q '200 OK'"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 60s
```

### PostgreSQL Service Configuration (Optional)

**Profile**: `persistent` (opt-in)

**Environment Variables**:
```yaml
POSTGRES_DB: keycloak
POSTGRES_USER: keycloak
POSTGRES_PASSWORD: keycloak_password    # Change for production
```

**Volumes**:
```yaml
volumes:
  - postgres-data:/var/lib/postgresql/data
```

**When to Use**:
- Team development (shared state)
- Testing that requires data persistence
- CI/CD pipelines

**When NOT to Use**:
- Quick demos (slower startup)
- Workshops (H2 in-memory is faster)
- Solo development (unless needed)

### Network Configuration

**Network**: `oauth2-demo-network`
```yaml
networks:
  oauth2-demo-network:
    driver: bridge
```

**DNS Resolution**:
- Services accessible by container name
- KeyCloak: `http://keycloak:8080` (internal)
- PostgreSQL: `postgres:5432` (internal)
- External access via localhost port mapping

---

## Realm Import Configuration

### Realm Export File

**Location**: `keycloak-data/realm-export.json`

**Purpose**: Pre-configured realm with all clients, users, roles

**Structure**:
```json
{
  "id": "oauth2-demo",
  "realm": "oauth2-demo",
  "enabled": true,
  "displayName": "OAuth2/OIDC Learning Demo",
  
  "clients": [ /* 7 pre-configured clients */ ],
  "users": [ /* 4 pre-configured users */ ],
  "roles": { /* realm and client roles */ },
  "clientScopes": [ /* standard and custom scopes */ ],
  
  "accessTokenLifespan": 300,
  "refreshTokenMaxReuse": 0,
  
  // ... complete realm configuration
}
```

**Import Mechanism**:
- Placed in `/opt/keycloak/data/import/` directory
- KeyCloak auto-imports on startup with `--import-realm` flag
- If realm exists, import is skipped (no overwrite)

**Export Process**: See section on maintenance scripts

### Directory Structure

```
project-root/
├── docker-compose.yml
├── keycloak-data/
│   ├── realm-export.json         # Pre-configured realm
│   └── README.md                  # Instructions
├── scripts/
│   ├── init-keycloak.sh           # Initialization and health check
│   ├── test-keycloak.sh           # Configuration validation
│   └── backup-keycloak.sh         # Backup realm configuration
└── docs/
    └── keycloak-*.md              # This and related docs
```

---

## Initialization Script Requirements

### Script: `scripts/init-keycloak.sh`

**Purpose**: Verify KeyCloak is ready and properly configured

**Language**: Bash (cross-platform compatibility)

**Functionality**:

1. **Wait for KeyCloak Startup**
   - Poll `/health/ready` endpoint
   - Timeout after 120 seconds
   - Display progress indicator
   - Exit with error if timeout

2. **Obtain Admin Token**
   - POST to master realm token endpoint
   - Credentials: admin/admin
   - Extract access_token from response
   - Use for subsequent API calls

3. **Verify Realm Exists**
   - GET `/admin/realms/oauth2-demo`
   - Confirm realm imported successfully
   - Exit with error if not found

4. **Test OIDC Discovery**
   - GET `/.well-known/openid-configuration`
   - Parse and display key endpoints
   - Verify JSON structure valid

5. **Verify Clients**
   - Check all 7 clients exist
   - List: web-app, spa-client, mobile-app, service-account, device-client, legacy-implicit, vulnerable-client
   - Display checkmarks for found, warnings for missing

6. **Verify Users**
   - Check all 4 users exist
   - List: alice, bob, admin, carol
   - Display status for each

7. **Test Authentication**
   - Attempt token request with alice credentials
   - Verify access_token received
   - Confirms end-to-end functionality

8. **Display Summary**
   - KeyCloak URL
   - Admin console URL and credentials
   - List of clients and users
   - OIDC endpoint URLs
   - Security warnings

**Exit Codes**:
- 0: Success, all checks passed
- 1: Failure, configuration issue detected

**Output Format**: Colored terminal output with status indicators (✓, ✗, ⚠)

---

## Testing Script Requirements

### Script: `scripts/test-keycloak.sh`

**Purpose**: Automated configuration validation

**Functionality**:

1. **Health Check**: `/health/ready` returns 200
2. **Discovery Check**: OIDC Discovery endpoint accessible
3. **JWKS Check**: Public keys endpoint returns valid JSON
4. **Client Credentials Flow**: service-account can obtain token
5. **Authorization Endpoint**: Authorization endpoint accessible
6. **Token Endpoint**: Token endpoint accessible
7. **Introspection Endpoint**: Token introspection works
8. **Revocation Endpoint**: Token revocation works

**Output**: Test results summary with pass/fail counts

**Use Cases**:
- CI/CD validation
- Pre-demo verification
- Troubleshooting

---

## Backup Script Requirements

### Script: `scripts/backup-keycloak.sh`

**Purpose**: Export realm configuration

**Functionality**:

1. **Create Backup Directory**: `./backups/`
2. **Generate Filename**: `oauth2-demo-realm-YYYYMMDD-HHMMSS.json`
3. **Export Realm**:
   - Execute `kc.sh export` in container
   - Specify realm: `oauth2-demo`
   - Copy exported file from container to host
4. **Optional: Backup Database** (if PostgreSQL)
   - Use `pg_dump` to export database
   - Save to backup directory
5. **Display Success Message**: Show backup location

**Scheduling**: Recommend running before updates or configuration changes

---

## Deployment Commands

### Standard Deployment (H2 In-Memory)

```bash
# Start KeyCloak
docker-compose up -d

# Verify configuration
./scripts/init-keycloak.sh

# View logs
docker-compose logs -f keycloak
```

### Persistent Deployment (PostgreSQL)

```bash
# Start with persistent database
docker-compose --profile persistent up -d

# Verify configuration
./scripts/init-keycloak.sh
```

### Stop and Clean

```bash
# Stop services (keep data)
docker-compose down

# Stop services (remove data - fresh start)
docker-compose down -v
```

### Update KeyCloak Version

```bash
# 1. Backup current configuration
./scripts/backup-keycloak.sh

# 2. Stop services
docker-compose down

# 3. Update image version in docker-compose.yml
# Change: quay.io/keycloak/keycloak:22.0.5
# To:     quay.io/keycloak/keycloak:23.0.0

# 4. Start with new version
docker-compose up -d

# 5. Verify
./scripts/init-keycloak.sh
```

---

## Health Check Integration

### For Tool Startup

The OAuth2/OIDC tool should:

1. **Check KeyCloak Availability** on startup
   - GET `/health/ready`
   - Timeout: 5 seconds
   - Retry: 3 times with 2-second delay

2. **Fetch OIDC Discovery** on successful health check
   - GET `/.well-known/openid-configuration`
   - Cache endpoint URLs
   - Extract supported features

3. **Display Connection Status** in UI
   - ✅ Connected (green indicator)
   - ❌ Disconnected (red indicator, troubleshooting link)
   - ⏳ Connecting (yellow indicator)

4. **Provide Troubleshooting Guidance** if unreachable
   - "Is KeyCloak running? Run: docker ps"
   - "Start KeyCloak: docker-compose up -d"
   - "Check logs: docker-compose logs keycloak"

---

## Resource Requirements

### Minimum System Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 1 core | 2 cores |
| RAM | 512 MB (KeyCloak) | 1 GB |
| Disk | 100 MB | 500 MB |
| Docker Version | 20.10+ | Latest stable |

### Container Resource Limits

Consider adding resource limits in docker-compose.yml:

```yaml
services:
  keycloak:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

---

## Security Considerations for Deployment

### Development Mode Settings (Current)

⚠️ **DEMO ONLY** - These settings are INSECURE:

- HTTP only (no HTTPS)
- Weak admin password (admin/admin)
- H2 in-memory database (no persistence)
- Hostname validation disabled
- Development mode enabled

### Production Hardening (If Needed)

If deploying beyond localhost:

1. **Enable HTTPS**:
   - Obtain TLS certificate
   - Configure reverse proxy (nginx, Apache)
   - Set `KC_HOSTNAME_STRICT: "true"`

2. **Strong Credentials**:
   - Change admin password
   - Use secrets management (Docker secrets, Vault)

3. **Production Database**:
   - Use PostgreSQL or MySQL
   - Enable backups
   - Configure replication

4. **Network Security**:
   - Restrict port exposure
   - Use firewall rules
   - Enable rate limiting

---

## Troubleshooting Deployment

### KeyCloak Won't Start

**Symptoms**: Container exits immediately

**Diagnosis**:
```bash
docker logs oauth2-demo-keycloak
```

**Common Causes**:
- Port 8080 already in use → Check: `lsof -i :8080`
- Insufficient memory → Increase Docker memory limit
- Invalid realm export JSON → Validate JSON syntax
- Corrupted H2 database → Remove volume and restart

### Realm Import Failed

**Symptoms**: Clients/users missing after startup

**Diagnosis**:
```bash
docker logs oauth2-demo-keycloak | grep -i import
docker logs oauth2-demo-keycloak | grep -i error
```

**Common Causes**:
- Realm export file not mounted → Check volume mapping
- JSON syntax error → Validate realm-export.json
- File permissions → Ensure readable by container

**Solution**: Manual import
```bash
docker cp keycloak-data/realm-export.json oauth2-demo-keycloak:/tmp/
docker exec -it oauth2-demo-keycloak \
  /opt/keycloak/bin/kc.sh import --file /tmp/realm-export.json
```

### Cannot Access Admin Console

**Symptoms**: 404 or connection refused at /admin

**Diagnosis**:
- Check KeyCloak running: `docker ps`
- Check port mapping: Should see `0.0.0.0:8080->8080/tcp`
- Test health endpoint: `curl http://localhost:8080/health/ready`

**Solution**: Verify docker-compose.yml ports section correct

---

## Integration with CI/CD

### GitHub Actions Example Structure

```yaml
name: Test OAuth2 Tool with KeyCloak

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Start KeyCloak
        run: docker-compose up -d
      
      - name: Wait for KeyCloak
        run: ./scripts/init-keycloak.sh
      
      - name: Run integration tests
        run: npm test
      
      - name: Cleanup
        run: docker-compose down -v
```

### GitLab CI Example Structure

```yaml
test:
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker-compose up -d
    - ./scripts/init-keycloak.sh
    - npm test
  after_script:
    - docker-compose down -v
```

---

## Document Metadata

| Property | Value |
|----------|-------|
| **Version** | 1.0.0 |
| **Related Docs** | `keycloak-realm-configuration.md`, `keycloak-integration-requirements.md` |
| **Target Audience** | Claude Code (implementation) |
| **KeyCloak Version** | 22.0.5 |

---

**Next Steps**: See `keycloak-realm-configuration.md` for details on clients, users, and token configuration.
