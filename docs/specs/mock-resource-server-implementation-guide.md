# AuthOptics Mock Resource Server - Complete Implementation Guide

## Document Information

| Property | Value |
|----------|-------|
| **Component** | packages/mock-resource-server |
| **Purpose** | Complete implementation guide covering middleware, routes, configuration, testing, and tasks |
| **Status** | ✅ MVP Complete Reference |
| **Companion Docs** | [Main Spec](auth-optics-mock-resource-server-specification.md), [Services](mock-resource-server-services.md) |

---

## Table of Contents

1. [Middleware Implementation](#1-middleware-implementation)
2. [API Routes Implementation](#2-api-routes-implementation)
3. [Configuration & Environment](#3-configuration--environment)
4. [Testing Strategy](#4-testing-strategy)
5. [Implementation Tasks & Roadmap](#5-implementation-tasks--roadmap)

---

# 1. Middleware Implementation

## 1.1 Overview

Middleware components form the request validation pipeline. Each request passes through these middleware functions in order before reaching route handlers.

**Middleware Pipeline:**
```
Request
  |
  +-> CORS Middleware (allow frontend origin)
  |
  +-> Helmet (security headers)
  |
  +-> Request Logger
  |
  +-> Bearer Token Extraction
  |
  +-> JWT Verification
  |
  +-> Scope Validation (route-specific)
  |
  +-> Route Handler
```

## 1.2 Bearer Token Extraction Middleware

**File: `src/middleware/extractBearerToken.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import { ResponseFormatter } from '../services/ResponseFormatter';

/**
 * Extract bearer token from Authorization header
 * 
 * Implements RFC 6750 2.1: Authorization Request Header Field
 * 
 * Format: Authorization: Bearer <token>
 * 
 * @example
 * app.use('/api/protected', extractBearerToken);
 */
export function extractBearerToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  
  // Check header exists
  if (!authHeader) {
    console.warn('[Auth] Missing Authorization header');
    return ResponseFormatter.unauthorized(
      res,
      'invalid_request',
      'Missing Authorization header',
      'Bearer'
    );
  }
  
  // Check format: "Bearer <token>"
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2) {
    console.warn('[Auth] Malformed Authorization header');
    return ResponseFormatter.unauthorized(
      res,
      'invalid_request',
      'Malformed Authorization header',
      'Bearer error="invalid_request", error_description="Format must be: Bearer <token>"'
    );
  }
  
  const [scheme, token] = parts;
  
  // Check scheme is "Bearer"
  if (scheme !== 'Bearer') {
    console.warn(`[Auth] Invalid auth scheme: ${scheme}`);
    return ResponseFormatter.unauthorized(
      res,
      'invalid_request',
      'Authorization scheme must be Bearer',
      'Bearer error="invalid_request", error_description="Only Bearer tokens supported"'
    );
  }
  
  // Check token not empty
  if (!token || token.trim() === '') {
    console.warn('[Auth] Empty bearer token');
    return ResponseFormatter.unauthorized(
      res,
      'invalid_token',
      'Bearer token is empty',
      'Bearer error="invalid_token"'
    );
  }
  
  // Attach token to request for downstream middleware
  (req as any).token = token;
  
  console.log('[Auth] Bearer token extracted successfully');
  next();
}
```

## 1.3 JWT Verification Middleware

**File: `src/middleware/verifyToken.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import { TokenValidator } from '../services/TokenValidator';
import { ResponseFormatter } from '../services/ResponseFormatter';

/**
 * Create JWT verification middleware
 * 
 * @param validator - TokenValidator instance
 * @returns Express middleware function
 * 
 * @example
 * const verifyToken = createVerifyTokenMiddleware(tokenValidator);
 * app.use('/api/protected', extractBearerToken, verifyToken);
 */
export function createVerifyTokenMiddleware(validator: TokenValidator) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const token = (req as any).token;
    
    // Token should have been extracted by extractBearerToken middleware
    if (!token) {
      console.error('[Auth] Token missing from request (extractBearerToken not called?)');
      return ResponseFormatter.internalError(res, 'Token extraction failed');
    }
    
    console.log('[Auth] Validating JWT token...');
    
    // Validate token (signature + claims)
    const result = await validator.validate(token);
    
    if (!result.valid) {
      console.warn('[Auth] Token validation failed:', result.error?.message);
      return ResponseFormatter.unauthorized(
        res,
        result.error!.type,
        result.error!.message,
        result.error!.wwwAuthenticate
      );
    }
    
    // Token valid - attach payload to request
    (req as any).user = result.payload;
    
    console.log('[Auth] Token validated successfully');
    console.log('[Auth] User:', result.payload?.sub);
    console.log('[Auth] Scopes:', result.payload?.scope);
    
    next();
  };
}
```

## 1.4 Scope Validation Middleware

**File: `src/middleware/requireScope.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import { ScopeChecker, InsufficientScopeError } from '../services/ScopeChecker';
import { ResponseFormatter } from '../services/ResponseFormatter';

/**
 * Create scope validation middleware (single required scope)
 * 
 * @param requiredScope - Scope required to access endpoint
 * @returns Express middleware function
 * 
 * @example
 * app.get('/api/protected/profile', 
 *   extractBearerToken,
 *   verifyToken,
 *   requireScope('profile'),
 *   profileHandler
 * );
 */
export function requireScope(requiredScope: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    
    if (!user) {
      console.error('[Scope] User payload missing from request');
      return ResponseFormatter.internalError(res, 'Token verification failed');
    }
    
    console.log(`[Scope] Checking for required scope: ${requiredScope}`);
    
    try {
      ScopeChecker.requireScope(user, requiredScope);
      console.log(`[Scope] Scope validated: ${requiredScope}`);
      next();
    } catch (error) {
      if (error instanceof InsufficientScopeError) {
        console.warn('[Scope] Insufficient scope:', error.message);
        return ResponseFormatter.insufficientScope(
          res,
          error.requiredScope,
          error.providedScopes
        );
      }
      throw error;
    }
  };
}

/**
 * Create scope validation middleware (any of multiple scopes)
 * 
 * @param requiredScopes - Array of acceptable scopes (OR logic)
 * @returns Express middleware function
 * 
 * @example
 * // Requires 'profile' OR 'email'
 * app.get('/api/protected/user-info',
 *   extractBearerToken,
 *   verifyToken,
 *   requireAnyScope(['profile', 'email']),
 *   userInfoHandler
 * );
 */
export function requireAnyScope(requiredScopes: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    
    if (!user) {
      console.error('[Scope] User payload missing from request');
      return ResponseFormatter.internalError(res, 'Token verification failed');
    }
    
    console.log(`[Scope] Checking for any of: ${requiredScopes.join(', ')}`);
    
    try {
      ScopeChecker.requireAnyScope(user, requiredScopes);
      console.log(`[Scope] Scope validated (any of): ${requiredScopes.join(', ')}`);
      next();
    } catch (error) {
      if (error instanceof InsufficientScopeError) {
        console.warn('[Scope] Insufficient scope:', error.message);
        return ResponseFormatter.insufficientScope(
          res,
          error.requiredScope,
          error.providedScopes
        );
      }
      throw error;
    }
  };
}

/**
 * Create scope validation middleware (all of multiple scopes)
 * 
 * @param requiredScopes - Array of required scopes (AND logic)
 * @returns Express middleware function
 * 
 * @example
 * // Requires 'profile' AND 'email'
 * app.post('/api/protected/update-profile',
 *   extractBearerToken,
 *   verifyToken,
 *   requireAllScopes(['profile', 'email']),
 *   updateProfileHandler
 * );
 */
export function requireAllScopes(requiredScopes: string[]) {
  return (req: Request, res: Response, next: NextFunction): void {
    const user = (req as any).user;
    
    if (!user) {
      console.error('[Scope] User payload missing from request');
      return ResponseFormatter.internalError(res, 'Token verification failed');
    }
    
    console.log(`[Scope] Checking for all of: ${requiredScopes.join(', ')}`);
    
    try {
      ScopeChecker.requireAllScopes(user, requiredScopes);
      console.log(`[Scope] Scope validated (all of): ${requiredScopes.join(', ')}`);
      next();
    } catch (error) {
      if (error instanceof InsufficientScopeError) {
        console.warn('[Scope] Insufficient scope:', error.message);
        return ResponseFormatter.insufficientScope(
          res,
          error.requiredScope,
          error.providedScopes
        );
      }
      throw error;
    }
  };
}
```

## 1.5 Error Handler Middleware

**File: `src/middleware/errorHandler.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import { ResponseFormatter } from '../services/ResponseFormatter';

/**
 * Global error handler middleware
 * 
 * Catches all unhandled errors and returns consistent error responses
 * 
 * MUST be registered LAST in middleware chain
 * 
 * @example
 * app.use(errorHandler);
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('[Error] Unhandled error:', error);
  console.error('[Error] Stack:', error.stack);
  
  // If headers already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(error);
  }
  
  ResponseFormatter.internalError(res, error.message);
}
```

## 1.6 Request Logger Middleware

**File: `src/middleware/requestLogger.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';

/**
 * Request logging middleware
 * 
 * Logs all incoming requests with method, path, and timestamp
 * 
 * @example
 * app.use(requestLogger);
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();
  
  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} - ` +
      `${res.statusCode} (${duration}ms)`
    );
  });
  
  next();
}
```

---

# 2. API Routes Implementation

## 2.1 Overview

The mock resource server provides several protected endpoints demonstrating different scope requirements.

**Endpoint Summary:**

| Endpoint | Method | Required Scope | Purpose |
|----------|--------|----------------|---------|
| `/health` | GET | None (public) | Server health check |
| `/api/protected` | GET | None (any valid token) | Basic protected endpoint |
| `/api/protected/profile` | GET | `profile` | User profile data |
| `/api/protected/email` | GET | `email` | User email data |
| `/api/protected/admin` | GET | `admin` | Admin-only endpoint |

## 2.2 Server Setup

**File: `src/server.ts`**

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { JWKSClient } from './services/JWKSClient';
import { TokenValidator } from './services/TokenValidator';
import { extractBearerToken } from './middleware/extractBearerToken';
import { createVerifyTokenMiddleware } from './middleware/verifyToken';
import { requireScope } from './middleware/requireScope';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { createApiRouter } from './routes/api';
import { createHealthRouter } from './routes/health';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3002;
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'oauth2-demo';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Initialize services
const jwksUri = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs`;
const jwksClient = new JWKSClient(jwksUri);

const tokenValidator = new TokenValidator(jwksClient, {
  expectedIssuer: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`,
  expectedAudience: ['account', 'resource-server'],
  clockTolerance: 5 // 5 seconds
});

// Create Express app
const app = express();

// Middleware (order matters!)
app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/health', createHealthRouter());
app.use('/api', createApiRouter(tokenValidator));

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`[Server] Mock Resource Server started`);
  console.log(`[Server] Port: ${PORT}`);
  console.log(`[Server] JWKS URI: ${jwksUri}`);
  console.log(`[Server] Expected Issuer: ${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`);
  console.log(`[Server] CORS Origin: ${CORS_ORIGIN}`);
});
```

## 2.3 Health Check Route

**File: `src/routes/health.ts`**

```typescript
import { Router } from 'express';
import { ResponseFormatter } from '../services/ResponseFormatter';

/**
 * Health check router (no authentication required)
 */
export function createHealthRouter(): Router {
  const router = Router();
  
  /**
   * GET /health
   * 
   * Server health check endpoint
   * 
   * @returns 200 OK if server is running
   */
  router.get('/', (req, res) => {
    ResponseFormatter.success(res, {
      status: 'healthy',
      service: 'mock-resource-server',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });
  
  return router;
}
```

## 2.4 Protected API Routes

**File: `src/routes/api.ts`**

```typescript
import { Router } from 'express';
import { TokenValidator } from '../services/TokenValidator';
import { ResponseFormatter } from '../services/ResponseFormatter';
import { ScopeChecker } from '../services/ScopeChecker';
import { extractBearerToken } from '../middleware/extractBearerToken';
import { createVerifyTokenMiddleware } from '../middleware/verifyToken';
import { requireScope } from '../middleware/requireScope';

/**
 * Protected API router
 * 
 * All routes in this router require valid OAuth2 access tokens
 */
export function createApiRouter(tokenValidator: TokenValidator): Router {
  const router = Router();
  
  // Create middleware
  const verifyToken = createVerifyTokenMiddleware(tokenValidator);
  
  /**
   * GET /api/protected
   * 
   * Basic protected endpoint - requires any valid token
   * No specific scope required
   * 
   * @security Bearer token required
   */
  router.get('/protected', extractBearerToken, verifyToken, (req, res) => {
    const user = (req as any).user;
    
    ResponseFormatter.success(res, {
      message: 'Access granted to protected resource',
      user_id: user.sub,
      scopes: ScopeChecker.extractScopes(user),
      token_type: 'Bearer',
      authenticated: true
    });
  });
  
  /**
   * GET /api/protected/profile
   * 
   * User profile endpoint - requires 'profile' scope
   * 
   * @security Bearer token with 'profile' scope required
   */
  router.get('/protected/profile',
    extractBearerToken,
    verifyToken,
    requireScope('profile'),
    (req, res) => {
      const user = (req as any).user;
      
      ResponseFormatter.success(res, {
        message: 'Access granted to profile data',
        user_id: user.sub,
        profile: {
          preferred_username: user.preferred_username,
          name: user.name,
          given_name: user.given_name,
          family_name: user.family_name,
          email_verified: user.email_verified
        }
      });
    }
  );
  
  /**
   * GET /api/protected/email
   * 
   * User email endpoint - requires 'email' scope
   * 
   * @security Bearer token with 'email' scope required
   */
  router.get('/protected/email',
    extractBearerToken,
    verifyToken,
    requireScope('email'),
    (req, res) => {
      const user = (req as any).user;
      
      ResponseFormatter.success(res, {
        message: 'Access granted to email data',
        user_id: user.sub,
        email: user.email,
        email_verified: user.email_verified
      });
    }
  );
  
  /**
   * GET /api/protected/admin
   * 
   * Admin-only endpoint - requires 'admin' scope
   * 
   * @security Bearer token with 'admin' scope required
   */
  router.get('/protected/admin',
    extractBearerToken,
    verifyToken,
    requireScope('admin'),
    (req, res) => {
      const user = (req as any).user;
      
      ResponseFormatter.success(res, {
        message: 'Access granted to admin endpoint',
        user_id: user.sub,
        admin_data: {
          server_info: 'Mock Resource Server v1.0.0',
          environment: process.env.NODE_ENV,
          realm: process.env.KEYCLOAK_REALM
        }
      });
    }
  );
  
  return router;
}
```

---

# 3. Configuration & Environment

## 3.1 Environment Variables

**File: `.env.example`**

```env
# Server Configuration
PORT=3002
NODE_ENV=development

# KeyCloak Configuration
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=oauth2-demo

# JWKS Caching
JWKS_CACHE_DURATION=3600000  # 1 hour in milliseconds

# Token Validation
TOKEN_ISSUER=http://localhost:8080/realms/oauth2-demo
TOKEN_AUDIENCE=account,resource-server
CLOCK_TOLERANCE=5  # seconds

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug  # debug, info, warn, error
```

## 3.2 package.json

```json
{
  "name": "@auth-optics/mock-resource-server",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "eslint src --ext .ts",
    "test": "vitest",
    "test:watch": "vitest --watch"
  },
  "dependencies": {
    "@auth-optics/shared": "workspace:*",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "jose": "^5.2.0",
    "axios": "^1.6.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.11.5",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3",
    "vitest": "^1.2.0",
    "supertest": "^6.3.4"
  }
}
```

## 3.3 TypeScript Configuration

**File: `tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "module": "ESNext",
    "moduleResolution": "node",
    "target": "ES2022",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

## 3.4 Docker Configuration

**File: `Dockerfile`**

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN pnpm build

EXPOSE 3002

CMD ["pnpm", "start"]
```

---

# 4. Testing Strategy

## 4.1 Unit Tests

### Test: TokenValidator

**File: `src/services/TokenValidator.test.ts`**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { TokenValidator } from './TokenValidator';
import { JWKSClient } from './JWKSClient';
import * as jose from 'jose';

describe('TokenValidator', () => {
  let validator: TokenValidator;
  let mockJWKSClient: JWKSClient;
  
  beforeEach(() => {
    // Mock JWKS client
    mockJWKSClient = new JWKSClient('http://mock-jwks');
    
    validator = new TokenValidator(mockJWKSClient, {
      expectedIssuer: 'http://localhost:8080/realms/oauth2-demo',
      expectedAudience: ['account', 'resource-server']
    });
  });
  
  it('should validate token with correct signature and claims', async () => {
    // Test implementation
  });
  
  it('should reject expired token', async () => {
    // Test implementation
  });
  
  it('should reject token with invalid issuer', async () => {
    // Test implementation
  });
  
  it('should reject token with invalid audience', async () => {
    // Test implementation
  });
  
  it('should reject token with invalid signature', async () => {
    // Test implementation
  });
});
```

### Test: ScopeChecker

**File: `src/services/ScopeChecker.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { ScopeChecker, InsufficientScopeError } from './ScopeChecker';

describe('ScopeChecker', () => {
  it('should extract scopes from space-separated string', () => {
    const payload = { scope: 'profile email openid' };
    const scopes = ScopeChecker.extractScopes(payload);
    expect(scopes).toEqual(['profile', 'email', 'openid']);
  });
  
  it('should check single scope correctly', () => {
    const payload = { scope: 'profile email' };
    expect(ScopeChecker.hasScope(payload, 'profile')).toBe(true);
    expect(ScopeChecker.hasScope(payload, 'admin')).toBe(false);
  });
  
  it('should throw InsufficientScopeError when scope missing', () => {
    const payload = { scope: 'email' };
    expect(() => {
      ScopeChecker.requireScope(payload, 'profile');
    }).toThrow(InsufficientScopeError);
  });
});
```

## 4.2 Integration Tests

**File: `src/integration.test.ts`**

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createApiRouter } from './routes/api';
import { TokenValidator } from './services/TokenValidator';

describe('Protected API Endpoints', () => {
  let app: express.Application;
  let validToken: string;
  let expiredToken: string;
  
  beforeAll(async () => {
    // Setup test app
    // Generate test tokens
  });
  
  afterAll(async () => {
    // Cleanup
  });
  
  it('should return 401 for missing token', async () => {
    const response = await request(app)
      .get('/api/protected')
      .expect(401);
    
    expect(response.body.error).toBe('invalid_request');
  });
  
  it('should return 200 for valid token', async () => {
    const response = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
  
  it('should return 403 for insufficient scope', async () => {
    const response = await request(app)
      .get('/api/protected/profile')
      .set('Authorization', `Bearer ${validToken}`)  // Token without 'profile' scope
      .expect(403);
    
    expect(response.body.error).toBe('insufficient_scope');
  });
});
```

---

# 5. Implementation Tasks & Roadmap

## 5.1 MVP Implementation Plan (5 hours)

### Phase 1: Project Setup (30 minutes)

```
[ ] Initialize package
    [ ] Create directory structure
    [ ] Configure package.json
    [ ] Configure tsconfig.json
    [ ] Create .env.example
    [ ] Install dependencies

[ ] TypeScript configuration
    [ ] Strict mode enabled
    [ ] Path aliases configured
    [ ] Build scripts working
```

### Phase 2: Core Services (1.5 hours)

```
[ ] JWKSClient service
    [ ] Constructor with JWKS URI
    [ ] getJWKS() with caching
    [ ] getKey(kid) implementation
    [ ] getPublicKey(kid) implementation
    [ ] Error handling
    [ ] Unit tests

[ ] TokenValidator service
    [ ] Constructor with config
    [ ] validate(token) pipeline
    [ ] Error handling and mapping
    [ ] Claims validation
    [ ] Unit tests

[ ] ScopeChecker service
    [ ] extractScopes() implementation
    [ ] hasScope() / hasAnyScope() / hasAllScopes()
    [ ] requireScope() with errors
    [ ] Unit tests

[ ] ResponseFormatter service
    [ ] success() method
    [ ] unauthorized() method
    [ ] insufficientScope() method
    [ ] internalError() method
```

### Phase 3: Middleware (1 hour)

```
[ ] Bearer token extraction
    [ ] extractBearerToken middleware
    [ ] RFC 6750 compliance
    [ ] Error responses

[ ] JWT verification
    [ ] createVerifyTokenMiddleware
    [ ] Integration with TokenValidator
    [ ] Error handling

[ ] Scope validation
    [ ] requireScope middleware
    [ ] requireAnyScope middleware
    [ ] requireAllScopes middleware
    [ ] Error responses

[ ] Utility middleware
    [ ] Request logger
    [ ] Error handler
```

### Phase 4: API Routes (1 hour)

```
[ ] Health check endpoint
    [ ] GET /health (no auth)
    [ ] Server status response

[ ] Protected endpoints
    [ ] GET /api/protected (any valid token)
    [ ] GET /api/protected/profile (requires 'profile')
    [ ] GET /api/protected/email (requires 'email')
    [ ] GET /api/protected/admin (requires 'admin')

[ ] Response formatting
    [ ] Consistent success/error responses
    [ ] RFC 6750 error responses
```

### Phase 5: Testing & Integration (1 hour)

```
[ ] Unit tests
    [ ] TokenValidator tests
    [ ] ScopeChecker tests
    [ ] JWKSClient tests (with mock JWKS)

[ ] Integration tests
    [ ] Protected endpoint tests
    [ ] Token validation flow tests
    [ ] Scope enforcement tests

[ ] KeyCloak integration
    [ ] JWKS connectivity test
    [ ] Real token validation test
    [ ] End-to-end flow test
```

### Phase 6: Documentation & Polish (30 minutes)

```
[ ] README.md
    [ ] Setup instructions
    [ ] API documentation
    [ ] Environment variables
    [ ] Testing guide

[ ] Code documentation
    [ ] JSDoc comments
    [ ] Inline comments for complex logic
    [ ] Examples in docstrings

[ ] Docker configuration
    [ ] Dockerfile
    [ ] docker-compose.yml integration
```

## 5.2 Success Criteria

MVP is complete when:

1. ✅ Server starts and listens on port 3002
2. ✅ JWKS is fetched and cached from KeyCloak
3. ✅ JWT tokens from KeyCloak are validated correctly
4. ✅ Invalid tokens (expired, wrong signature, etc.) are rejected with 401
5. ✅ Requests without required scopes are rejected with 403
6. ✅ Protected endpoints return correct data with valid tokens
7. ✅ Error responses follow RFC 6750 format
8. ✅ Backend can successfully test tokens against the resource server
9. ✅ All unit tests pass
10. ✅ Integration tests pass with real KeyCloak

## 5.3 Phase 2 Enhancements (Future)

```
❌ Token Introspection
    - Implement RFC 7662 introspection endpoint
    - Support for opaque tokens
    - Introspection caching

❌ Advanced Scope Features
    - Hierarchical scopes
    - Dynamic scope validation
    - Scope-based rate limiting

❌ DPoP Support
    - RFC 9449 DPoP token validation
    - Proof-of-possession verification
    - Key binding validation

❌ Enhanced Logging
    - Structured logging
    - Request/response correlation IDs
    - Audit logs for security events

❌ Metrics & Monitoring
    - Prometheus metrics
    - Token validation success/failure rates
    - Response time metrics
```

## 5.4 Implementation Tips

1. **Start with Services** - Build and test services first, then wire them together
2. **Use Type Safety** - TypeScript strict mode prevents many runtime errors
3. **Test Early** - Write unit tests as you build each service
4. **Follow RFCs** - Stick to RFC 6750 error response formats
5. **Log Everything** - Comprehensive logging helps debug token validation issues
6. **Cache Aggressively** - JWKS rarely changes, cache for 1 hour
7. **Handle Errors** - Every jose error should map to appropriate HTTP response

## 5.5 Common Pitfalls to Avoid

1. ❌ Don't verify signatures without JWKS - always fetch public keys
2. ❌ Don't skip claims validation - exp, nbf, iss, aud all matter
3. ❌ Don't expose error details in production - log them, don't return them
4. ❌ Don't forget WWW-Authenticate headers - required by RFC 6750
5. ❌ Don't cache tokens - only cache JWKS keys
6. ❌ Don't implement your own JWT parsing - use jose library

---

## 6. Quick Reference

### Middleware Stack for Protected Endpoints

```typescript
app.get('/api/protected/profile',
  extractBearerToken,     // Extract "Bearer <token>"
  verifyToken,            // Verify JWT signature & claims
  requireScope('profile'), // Check for 'profile' scope
  profileHandler          // Route handler
);
```

### Error Response Format (RFC 6750)

```json
{
  "success": false,
  "error": "invalid_token",
  "error_description": "The access token expired",
  "timestamp": "2024-12-17T10:00:00Z"
}
```

### Success Response Format

```json
{
  "success": true,
  "data": {
    "user_id": "user-123",
    "message": "Access granted"
  },
  "timestamp": "2024-12-17T10:00:00Z"
}
```

### Testing with cURL

```bash
# Get token from OAuth flow (in main app)
TOKEN="eyJhbGciOiJSUzI1NiI..."

# Test basic protected endpoint
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3002/api/protected

# Test profile endpoint (requires 'profile' scope)
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3002/api/protected/profile

# Test without token (should fail with 401)
curl http://localhost:3002/api/protected

# Test with invalid token (should fail with 401)
curl -H "Authorization: Bearer invalid_token" \
     http://localhost:3002/api/protected
```

---

**Implementation complete!** This guide provides everything needed to build the mock resource server component. Start with Phase 1 (Project Setup) and proceed through each phase systematically.
