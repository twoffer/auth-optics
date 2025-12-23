# AuthOptics Backend - Configuration & Deployment

## Document Information

| Property | Value |
|----------|-------|
| **Component** | packages/backend configuration |
| **Purpose** | Environment variables, deployment, Docker setup |
| **Status** | ✅ MVP Required |
| **Parent Doc** | [backend-specification.md](auth-optics-backend-specification.md) |

---

## Table of Contents

1. [Environment Variables](#1-environment-variables)
2. [Application Configuration](#2-application-configuration)
3. [Docker Setup](#3-docker-setup)
4. [Deployment Guide](#4-deployment-guide)

---

## 1. Environment Variables

### 1.1 .env File

Create `.env` file in `packages/backend`:

```bash
# Server Configuration
NODE_ENV=development
PORT=3001
LOG_LEVEL=info

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# KeyCloak Configuration
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=oauth2-demo
KEYCLOAK_CLIENT_ID=web-app
KEYCLOAK_CLIENT_SECRET=your-secret-here

# Default Issuer (for testing)
DEFAULT_ISSUER=http://localhost:8080/realms/oauth2-demo

# Security Settings
STATE_EXPIRATION_MS=600000        # 10 minutes
PKCE_CODE_VERIFIER_LENGTH=43      # Characters
FLOW_CLEANUP_INTERVAL_MS=3600000  # 1 hour

# Cache Settings
DISCOVERY_CACHE_TTL_MS=3600000    # 1 hour
JWKS_CACHE_TTL_MS=3600000         # 1 hour

# Rate Limiting (Phase 2)
# RATE_LIMIT_WINDOW_MS=900000     # 15 minutes
# RATE_LIMIT_MAX_REQUESTS=100
```

### 1.2 .env.example Template

```bash
# Copy this file to .env and fill in values
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=oauth2-demo
KEYCLOAK_CLIENT_ID=web-app
KEYCLOAK_CLIENT_SECRET=
```

---

## 2. Application Configuration

### 2.1 Configuration File

**File: `src/config/app-config.ts`**

```typescript
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Application configuration
 */
export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  allowedOrigins: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  
  // KeyCloak
  keycloak: {
    url: process.env.KEYCLOAK_URL || 'http://localhost:8080',
    realm: process.env.KEYCLOAK_REALM || 'oauth2-demo',
    clientId: process.env.KEYCLOAK_CLIENT_ID || 'web-app',
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
    issuer: process.env.DEFAULT_ISSUER || 
      `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`
  },
  
  // Security
  security: {
    stateExpirationMs: parseInt(
      process.env.STATE_EXPIRATION_MS || '600000', 10
    ),
    pkceCodeVerifierLength: parseInt(
      process.env.PKCE_CODE_VERIFIER_LENGTH || '43', 10
    )
  },
  
  // Cache
  cache: {
    discoveryCacheTTLMs: parseInt(
      process.env.DISCOVERY_CACHE_TTL_MS || '3600000', 10
    ),
    jwksCacheTTLMs: parseInt(
      process.env.JWKS_CACHE_TTL_MS || '3600000', 10
    )
  },
  
  // Flow Management
  flow: {
    cleanupIntervalMs: parseInt(
      process.env.FLOW_CLEANUP_INTERVAL_MS || '3600000', 10
    ),
    maxFlowAgeMs: 24 * 60 * 60 * 1000 // 24 hours
  },
  
  // Development
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test'
} as const;

/**
 * Validate required configuration
 */
export function validateConfig(): void {
  const required = [
    'PORT',
    'FRONTEND_URL',
    'KEYCLOAK_URL',
    'KEYCLOAK_REALM'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}
```

### 2.2 Constants

**File: `src/config/constants.ts`**

```typescript
/**
 * Application constants
 */

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
  BAD_GATEWAY: 502
} as const;

// Error Codes (OAuth2)
export const OAUTH2_ERRORS = {
  INVALID_REQUEST: 'invalid_request',
  INVALID_CLIENT: 'invalid_client',
  INVALID_GRANT: 'invalid_grant',
  UNAUTHORIZED_CLIENT: 'unauthorized_client',
  UNSUPPORTED_GRANT_TYPE: 'unsupported_grant_type',
  INVALID_SCOPE: 'invalid_scope'
} as const;

// Application Error Codes
export const APP_ERRORS = {
  FLOW_NOT_FOUND: 'flow_not_found',
  INTERNAL_ERROR: 'internal_error',
  DISCOVERY_FAILED: 'discovery_failed',
  JWKS_FETCH_FAILED: 'jwks_fetch_failed',
  VALIDATION_FAILED: 'validation_failed'
} as const;

// Flow Settings
export const FLOW_SETTINGS = {
  MAX_STEPS: 10,
  MAX_DURATION_MS: 30 * 60 * 1000, // 30 minutes
  CLEANUP_BATCH_SIZE: 100
} as const;
```

---

## 3. Docker Setup

### 3.1 Dockerfile

**File: `Dockerfile`**

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3001

CMD ["node", "dist/server.js"]
```

### 3.2 docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: authoptics-backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - FRONTEND_URL=http://localhost:3000
      - KEYCLOAK_URL=http://keycloak:8080
      - KEYCLOAK_REALM=oauth2-demo
      - KEYCLOAK_CLIENT_ID=web-app
      - KEYCLOAK_CLIENT_SECRET=${KEYCLOAK_CLIENT_SECRET}
    depends_on:
      - keycloak
    networks:
      - authoptics
    restart: unless-stopped

  keycloak:
    image: quay.io/keycloak/keycloak:22.0
    container_name: authoptics-keycloak
    ports:
      - "8080:8080"
    environment:
      - KEYCLOAK_ADMIN=admin
      - KEYCLOAK_ADMIN_PASSWORD=admin
      - KC_HTTP_RELATIVE_PATH=/
    command:
      - start-dev
    networks:
      - authoptics
    restart: unless-stopped

networks:
  authoptics:
    driver: bridge
```

---

## 4. Deployment Guide

### 4.1 Local Development

```bash
# 1. Install dependencies
cd packages/backend
pnpm install

# 2. Configure environment
cp .env.example .env
vim .env  # Edit configuration

# 3. Start development server
pnpm dev

# Server runs on http://localhost:3001
```

### 4.2 Production Build

```bash
# 1. Build TypeScript
pnpm build

# 2. Run production server
pnpm start

# Or use PM2
pm2 start dist/server.js --name authoptics-backend
```

### 4.3 Docker Deployment

```bash
# 1. Build Docker image
docker build -t authoptics-backend .

# 2. Run container
docker run -d \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e KEYCLOAK_URL=http://keycloak:8080 \
  --name authoptics-backend \
  authoptics-backend

# Or use docker-compose
docker-compose up -d
```

### 4.4 Health Checks

```bash
# Check server health
curl http://localhost:3001/api/health

# Expected response:
# {"status":"ok","timestamp":"2024-12-17T10:00:00Z"}
```

---

## Document Metadata

| Property | Value |
|----------|-------|
| **Version** | 1.0.0 |
| **Status** | ✅ Complete for MVP Configuration |
| **Parent** | [backend-specification.md](auth-optics-backend-specification.md) |
