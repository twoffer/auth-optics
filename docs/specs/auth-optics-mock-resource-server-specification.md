# AuthOptics Mock Resource Server Component - Index & Overview

## Document Information

| Property | Value |
|----------|-------|
| **Component** | packages/mock-resource-server |
| **Purpose** | Simulated protected resource server for OAuth2 token validation demonstration |
| **Technology** | Node.js + TypeScript + Express |
| **Port** | 3002 |
| **Dependencies** | @auth-optics/shared, express, jose, axios |
| **Version** | 1.0.0 (MVP) |
| **Target** | AI-assisted implementation with Claude Code |
| **Document Type** | Index / Navigation |

---

## 📚📚 Documentation Structure

This specification is organized into **3 comprehensive documents** for easier navigation and implementation:

### Core Documents

1. **[This Document]** - Index & Overview
   - High-level architecture
   - MVP scope summary
   - Quick start guide
   - Navigation to other documents
   - System architecture diagrams
   - Technology stack overview

2. **[mock-resource-server-services.md](mock-resource-server-services.md)** ✅ MVP Critical
   - Complete service implementations with full TypeScript code
   - TokenValidator service - JWT verification pipeline (200-250 lines)
   - JWKSClient service - JWKS fetching and caching (100-120 lines)
   - ScopeChecker service - Scope-based access control (80-100 lines)
   - ResponseFormatter service - Standardized API responses (60-80 lines)
   - Usage examples and test patterns

3. **[mock-resource-server-implementation-guide.md](mock-resource-server-implementation-guide.md)** ✅ MVP Complete
   - **Section 1: Middleware Implementation** - Bearer token extraction, JWT verification, scope validation, error handling
   - **Section 2: API Routes Implementation** - Server setup, health check, all protected endpoints
   - **Section 3: Configuration & Environment** - Environment variables, package.json, TypeScript config, Docker setup
   - **Section 4: Testing Strategy** - Unit tests, integration tests, complete test examples
   - **Section 5: Implementation Tasks & Roadmap** - 5-phase implementation plan (5 hours total)

---

## Table of Contents

1. [High-Level Overview](#1-high-level-overview)
2. [MVP Scope Summary](#2-mvp-scope-summary)
3. [System Architecture](#3-system-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Quick Start Guide](#5-quick-start-guide)
6. [Document Navigation](#6-document-navigation)

---

## 1. High-Level Overview

### 1.1 Purpose

The mock resource server is a **simulated protected API** that demonstrates proper OAuth2 access token validation and scope-based access control. It serves as an educational component showing how resource servers should validate bearer tokens in production systems.

**Primary Responsibilities:**

- **Token Validation** - JWT signature verification using KeyCloak's JWKS
- **Scope Enforcement** - Access control based on token scopes
- **Validation Feedback** - Detailed responses showing why tokens succeed or fail
- **Educational Demonstrations** - Clear examples of proper token validation
- **Test Target** - Endpoint for the main application to test obtained tokens

### 1.2 Architecture Philosophy

The mock resource server is designed with these principles:

1. **RFC-Compliant** - Strict adherence to RFC 6750 (Bearer Token Usage)
2. **Educational Focus** - Clear, detailed responses for learning
3. **Production Patterns** - Real-world JWT validation patterns
4. **Minimal State** - Stateless validation (no database required)
5. **Security First** - Proper error handling without information leakage

### 1.3 Key Features

| Feature | Description | MVP Status |
|---------|-------------|------------|
| **JWT Validation** | Signature verification using JWKS | ✅ MVP |
| **Scope Checking** | Fine-grained scope-based access control | ✅ MVP |
| **JWKS Integration** | Fetch and cache KeyCloak's public keys | ✅ MVP |
| **Protected Endpoints** | Multiple endpoints with different scope requirements | ✅ MVP |
| **Detailed Errors** | Educational error responses | ✅ MVP |
| **Claims Validation** | Expiration, issuer, audience checking | ✅ MVP |
| **Health Check** | Server status endpoint | ✅ MVP |
| **Token Introspection** | RFC 7662 introspection endpoint | ❌ Phase 2 |
| **DPoP Support** | RFC 9449 sender-constrained tokens | ❌ Phase 3 |

---

## 2. MVP Scope Summary

### 2.1 What's Included in MVP

Based on `auth-optics-architecture.md`, the MVP includes:

**✅ MUST HAVE (Critical Path):**

1. **JWT Token Validation** - Complete RFC 6750 / RFC 9068 implementation
2. **JWKS Client** - Fetch and cache KeyCloak's public keys
3. **Bearer Token Extraction** - RFC 6750 2.1 compliant extraction
4. **Signature Verification** - Using `jose` library with JWKS
5. **Claims Validation** - exp, nbf, iss, aud claims
6. **Scope Enforcement** - Check token contains required scopes
7. **Protected Endpoints** - At least 3 endpoints with different scope requirements
8. **Error Responses** - RFC 6750 3 compliant error responses
9. **CORS Support** - Allow requests from frontend (port 3000)
10. **Health Check** - Basic server status endpoint

**⚠️ NICE TO HAVE (Time Permitting):**

11. **Detailed Validation Response** - Show validation steps for education
12. **Multiple Resource Types** - User profile, email, contacts endpoints
13. **Request Logging** - Log all token validation attempts

**❌ NOT IN MVP (Future Phases):**

- Token introspection endpoint (Phase 2)
- DPoP token support (Phase 3)
- mTLS support (Phase 3)
- Rate limiting (Phase 2)
- Database integration (Phase 3)

### 2.2 MVP Acceptance Criteria

1. **Token Validation**: Server successfully validates JWT tokens from KeyCloak
2. **Signature Verification**: Invalid signatures are rejected with 401
3. **Expiration Checking**: Expired tokens are rejected with 401
4. **Scope Enforcement**: Requests without required scopes are rejected with 403
5. **Protected Access**: Valid tokens can access protected endpoints
6. **Error Clarity**: Error responses clearly explain why validation failed
7. **Integration**: Backend can successfully test tokens against the resource server

---

## 3. System Architecture

### 3.1 Component Context

```
+-----------------------------------------------------------------------+
|                      AuthOptics System                                |
|                                                                       |
|  +---------------+           +---------------+           +------------+
|  |   Frontend    |           |   Backend     |           | KeyCloak   |
|  |   (Port 3000) |---------->|   (Port 3001) |---------->| (Port 8080)|
|  |               |   HTTP    |               |   OAuth2  +------------+
|  +---------------+           +-------+-------+                        |
|                                      |                                |
|                                      | Test Token                     |
|                                      | with Bearer Token              |
|                                      |                                |
|                                      v                                |
|                   +------------------------------+                    |
|                   |  Mock Resource Server        |                    |
|                   |  (Port 3002)                 |                    |
|                   |                              |                    |
|                   |  +----------------------+    |                    |
|                   |  | JWT Verification     |    |                    |
|                   |  | Middleware           |    |                    |
|                   |  |  1. Extract Bearer   |    |                    |
|                   |  |  2. Fetch JWKS       |<---+----Fetch JWKS     |
|                   |  |  3. Verify Sig       |    |    (cached)       |
|                   |  |  4. Check Claims     |    |                   |
|                   |  |  5. Validate Scope   |    |                   |
|                   |  +----------------------+    |                   |
|                   |          |                   |                   |
|                   |          | If valid          |                   |
|                   |          v                   |                   |
|                   |  +----------------------+    |                   |
|                   |  | Protected Endpoints  |    |                   |
|                   |  |  * /api/protected    |    |                   |
|                   |  |  * /api/profile      |    |                   |
|                   |  |  * /api/email        |    |                   |
|                   |  +----------------------+    |                   |
|                   +------------------------------+                   |
|                                                                       |
+-----------------------------------------------------------------------+
```

### 3.2 Request Flow

```
1. Client Request
   |
   |  GET /api/protected/profile
   |  Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
   |
   |
2. Bearer Token Extraction Middleware
   |
   |--> Extract "Bearer eyJ..." from Authorization header
   |   Validate header format (RFC 6750 2.1)
   |
   |
3. JWT Verification Middleware
   |
   |--> Decode JWT header (extract kid, alg)
   |--> Fetch JWKS from KeyCloak (cached)
   |--> Find matching public key by kid
   |--> Verify JWT signature with public key
   |--> Decode JWT payload
   |--> Validate claims:
   |   +-- exp (expiration): Must be in future
   |   +-- nbf (not before): Must be in past
   |   +-- iss (issuer): Must match KeyCloak issuer
   |   +-- aud (audience): Must include this resource server
   |
   |
4. Scope Validation Middleware
   |
   |--> Extract scopes from token payload
   |--> Check route's required scope
   |--> Validate token contains required scope
   |   (e.g., /api/profile requires "profile" scope)
   |
   |
5. Route Handler
   |
   |--> Return protected resource data
       {
         "user_id": "user-123",
         "message": "Access granted",
         "token_valid": true,
         "scopes_validated": ["profile", "email"]
       }
```

### 3.3 Token Validation Steps (Detailed)

```
+------------------------------------------------------------+
| Step 1: Extract Bearer Token                                     |
+------------------------------------------------------------+
| Input:  Authorization: Bearer eyJhbGci...                        |
| Action: Extract token after "Bearer " prefix                     |
| Output: eyJhbGci...                                              |
| Errors: 401 if header missing or malformed                       |
+------------------------------------------------------------+

+------------------------------------------------------------+
| Step 2: Decode JWT (without verification)                        |
+------------------------------------------------------------+
| Input:  eyJhbGci... (JWT token)                                  |
| Action: Base64 decode header and payload                         |
| Output: { kid: "abc123", alg: "RS256" } (header)                |
| Errors: 401 if not valid JWT format                              |
+------------------------------------------------------------+

+------------------------------------------------------------+
| Step 3: Fetch JWKS                                               |
+------------------------------------------------------------+
| Action: GET {keycloak}/realms/oauth2-demo/protocol/openid-      |
|         connect/certs                                            |
| Cache:  1 hour (or until key rotation)                           |
| Output: Array of public keys { kid, kty, use, n, e, ... }       |
| Errors: 500 if JWKS fetch fails                                  |
+------------------------------------------------------------+

+------------------------------------------------------------+
| Step 4: Find Matching Key                                        |
+------------------------------------------------------------+
| Input:  kid from JWT header + JWKS key array                     |
| Action: Find public key where jwks_key.kid === jwt_header.kid   |
| Output: Matching RSA public key                                  |
| Errors: 401 if no matching key found                             |
+------------------------------------------------------------+

+------------------------------------------------------------+
| Step 5: Verify JWT Signature                                     |
+------------------------------------------------------------+
| Input:  JWT token + RSA public key                               |
| Action: jose.jwtVerify(token, publicKey, options)               |
| Output: Verified payload (if signature valid)                    |
| Errors: 401 if signature verification fails                      |
+------------------------------------------------------------+

+------------------------------------------------------------+
| Step 6: Validate JWT Claims                                      |
+------------------------------------------------------------+
| exp:  Expiration time must be in future                          |
|       Current time < exp                                          |
|       Error: 401 "Token expired"                                  |
|                                                                   |
| nbf:  Not before time must be in past                            |
|       Current time >= nbf                                         |
|       Error: 401 "Token not yet valid"                            |
|                                                                   |
| iss:  Issuer must match KeyCloak                                 |
|       iss === "http://localhost:8080/realms/oauth2-demo"         |
|       Error: 401 "Invalid issuer"                                 |
|                                                                   |
| aud:  Audience must include this resource server                 |
|       aud includes "resource-server" or "account"                |
|       Error: 401 "Invalid audience"                               |
+------------------------------------------------------------+

+------------------------------------------------------------+
| Step 7: Check Required Scopes                                    |
+------------------------------------------------------------+
| Input:  Route's required scope (e.g., "profile")                 |
| Action: Extract scopes from token payload                        |
|         scopes = payload.scope.split(' ')                        |
|         Check: required_scope in scopes                           |
| Output: Scope validation result                                  |
| Errors: 403 "Insufficient scope" if scope missing                |
+------------------------------------------------------------+

+------------------------------------------------------------+
| Step 8: Grant Access                                             |
+------------------------------------------------------------+
| All validation passed ✅                                          |
| Attach user info to request: req.user = payload                 |
| Call next() to proceed to route handler                          |
+------------------------------------------------------------+
```

---

## 4. Technology Stack

### 4.1 Core Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20.x | Runtime environment |
| **TypeScript** | 5.x | Type-safe development |
| **Express** | 4.x | Web server framework |
| **jose** | 5.x | JWT verification and JWKS |
| **axios** | 1.x | HTTP client for JWKS fetching |
| **cors** | 2.x | CORS middleware |
| **helmet** | 7.x | Security headers |
| **dotenv** | 16.x | Environment configuration |
| **@auth-optics/shared** | workspace:* | Shared type definitions |

### 4.2 Development Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| **tsx** | 4.x | TypeScript execution |
| **nodemon** | 3.x | Hot reload |
| **@types/node** | 20.x | Node type definitions |
| **@types/express** | 4.x | Express type definitions |
| **vitest** | 1.x | Testing framework |
| **supertest** | 6.x | HTTP endpoint testing |

---

## 5. Quick Start Guide

### 5.1 Installation

```bash
# From monorepo root
cd packages/mock-resource-server

# Install dependencies (via pnpm workspace)
pnpm install

# Build shared types first
cd ../shared && pnpm build

# Return to mock-resource-server
cd ../mock-resource-server
```

### 5.2 Configuration

Create `.env` file:

```env
# Server
PORT=3002
NODE_ENV=development

# KeyCloak Configuration
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=oauth2-demo
JWKS_CACHE_DURATION=3600000  # 1 hour in ms

# Expected Token Claims
TOKEN_ISSUER=http://localhost:8080/realms/oauth2-demo
TOKEN_AUDIENCE=account,resource-server

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug  # debug, info, warn, error
```

### 5.3 Development

```bash
# Development mode (hot reload)
pnpm dev

# Build
pnpm build

# Production mode
pnpm start

# Run tests
pnpm test

# Lint
pnpm lint
```

### 5.4 Testing with cURL

```bash
# Get access token from KeyCloak first
# (This would come from the main OAuth2 flow)
TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."

# Test protected endpoint
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3002/api/protected

# Test profile endpoint (requires 'profile' scope)
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3002/api/protected/profile

# Test without token (should return 401)
curl http://localhost:3002/api/protected

# Test with invalid token (should return 401)
curl -H "Authorization: Bearer invalid_token_here" \
     http://localhost:3002/api/protected
```

---

## 6. Document Navigation

### 6.1 Recommended Reading Order

**For AI-Assisted Implementation (Claude Code):**

1. **Start Here: Main Specification** (this document)
   - Understand high-level architecture
   - Review MVP scope
   - Understand system design and request flow

2. **Core Services Implementation**
   - Read: [mock-resource-server-services.md](mock-resource-server-services.md)
   - Implement: JWKSClient, TokenValidator, ScopeChecker, ResponseFormatter
   - Time: 1.5 hours

3. **Complete Implementation**
   - Read: [mock-resource-server-implementation-guide.md](mock-resource-server-implementation-guide.md)
   - Follow sections 1-5 in order:
     - Middleware (bearer token, JWT verification, scope validation)
     - API Routes (server setup, protected endpoints)
     - Configuration (environment, Docker)
     - Testing (unit tests, integration tests)
     - Implementation roadmap (5-phase plan)
   - Time: 3.5 hours

### 6.2 By Development Phase

**Phase 1: Foundation (30 minutes)**
- Read: Main specification overview
- Read: Implementation guide section 3 (Configuration)
- Implement: Project setup, TypeScript config, environment variables

**Phase 2: Core Services (1.5 hours)**
- Read: [mock-resource-server-services.md](mock-resource-server-services.md) (complete)
- Implement: JWKSClient, TokenValidator, ScopeChecker services
- Test: Unit tests for each service

**Phase 3: Middleware (1 hour)**
- Read: Implementation guide section 1 (Middleware)
- Implement: Bearer token extraction, JWT verification, scope validation, error handling
- Test: Middleware integration

**Phase 4: API Routes (1 hour)**
- Read: Implementation guide section 2 (API Routes)
- Implement: Server setup, health check, all protected endpoints
- Test: Endpoint responses

**Phase 5: Testing & Integration (1 hour)**
- Read: Implementation guide section 4 (Testing Strategy)
- Implement: Unit tests, integration tests
- Test: Complete end-to-end flow with KeyCloak

### 6.3 Quick Reference Checklist

Use this to track your implementation progress:

```
MVP Implementation Checklist:

[ ] Project Setup
    [ ] Directory structure created
    [ ] package.json configured
    [ ] TypeScript configuration
    [ ] Environment variables (.env)
    [ ] Dependencies installed

[ ] Core Services
    [ ] JWKSClient service (fetch and cache keys)
    [ ] TokenValidator service (JWT verification)
    [ ] ScopeChecker service (scope enforcement)
    [ ] ResponseFormatter service

[ ] Middleware
    [ ] Bearer token extraction
    [ ] JWT verification middleware
    [ ] Scope validation middleware
    [ ] Error handling middleware
    [ ] CORS configuration

[ ] API Routes
    [ ] /health endpoint
    [ ] /api/protected endpoint
    [ ] /api/protected/profile endpoint (requires 'profile')
    [ ] /api/protected/email endpoint (requires 'email')
    [ ] Error responses (401, 403, 500)

[ ] Testing
    [ ] Unit tests for TokenValidator
    [ ] Unit tests for ScopeChecker
    [ ] Integration tests for protected endpoints
    [ ] Token validation edge cases

[ ] Integration
    [ ] Docker configuration
    [ ] KeyCloak JWKS connectivity test
    [ ] Backend integration test
    [ ] End-to-end flow test

[ ] Documentation
    [ ] README with setup instructions
    [ ] API documentation
    [ ] Error response guide
```

---

## 7. Key Specifications Reference

### 7.1 RFC Standards

| RFC | Title | Relevant Sections | Purpose |
|-----|-------|-------------------|---------|
| **RFC 6750** | Bearer Token Usage | Complete | Token extraction, validation, errors |
| **RFC 7519** | JSON Web Token (JWT) | 4, 7 | JWT structure and validation |
| **RFC 7517** | JSON Web Key (JWK) | Complete | JWKS format and key selection |
| **RFC 9068** | JWT Profile for OAuth 2.0 Access Tokens | Complete | Access token claims and validation |
| **Security BCP** | OAuth 2.0 Security Best Current Practice | 4 (Resource Servers) | Token validation requirements |

### 7.2 KeyCloak Integration

**JWKS Endpoint:**
```
GET http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/certs

Response:
{
  "keys": [
    {
      "kid": "abc123",
      "kty": "RSA",
      "alg": "RS256",
      "use": "sig",
      "n": "...",
      "e": "AQAB"
    }
  ]
}
```

**Expected Token Claims:**
```json
{
  "exp": 1733428800,
  "iat": 1733425200,
  "jti": "uuid",
  "iss": "http://localhost:8080/realms/oauth2-demo",
  "aud": ["account", "resource-server"],
  "sub": "user-123",
  "typ": "Bearer",
  "azp": "spa-client",
  "scope": "profile email openid",
  "email_verified": true,
  "preferred_username": "alice"
}
```

---

## 8. Next Steps

### 8.1 For Implementation

1. **Read Core Services Document**
   - [mock-resource-server-services.md](mock-resource-server-services.md)
   - Understand JWKSClient, TokenValidator, ScopeChecker, and ResponseFormatter services
   - Review full TypeScript implementations with examples

2. **Read Implementation Guide**
   - [mock-resource-server-implementation-guide.md](mock-resource-server-implementation-guide.md)
   - **Section 1**: Middleware implementation (bearer token, JWT verification, scope validation)
   - **Section 2**: API routes and server setup
   - **Section 3**: Configuration and environment setup
   - **Section 4**: Testing strategy and test examples
   - **Section 5**: 5-phase implementation roadmap (5 hours total)

3. **Follow the Implementation Plan**
   - Phase 1: Project setup (30 minutes)
   - Phase 2: Core services (1.5 hours)
   - Phase 3: Middleware (1 hour)
   - Phase 4: API routes (1 hour)
   - Phase 5: Testing & integration (1 hour)

### 8.2 For Understanding

- Review RFC 6750 for bearer token usage patterns
- Review RFC 9068 for JWT access token profile
- Study the existing backend TokenValidator for consistency
- Review KeyCloak's JWKS endpoint structure

---

## 9. Common Questions

### Q: Why a separate mock resource server?

**A:** To demonstrate the complete OAuth2 flow including token usage. This shows:
- How resource servers validate tokens
- Why signature verification is critical
- How scope-based access control works
- Proper error responses per RFC 6750

### Q: Why not use KeyCloak's token introspection?

**A:** MVP uses JWT validation (signature verification) because:
- More performant (no network call per request)
- Shows proper JWT validation patterns
- Educational: demonstrates JWKS usage
- Phase 2 will add introspection as an alternative

### Q: How does this differ from the backend's TokenValidator?

**A:** 
- **Backend**: Validates tokens for the OAuth2 client
- **Resource Server**: Validates tokens for API access
- Both use similar logic but serve different roles in OAuth2

### Q: Can this be used with real identity providers?

**A:** Yes! The JWT validation logic is RFC-compliant and works with:
- KeyCloak (MVP)
- Auth0 (Phase 2)
- Okta (Phase 2)
- Azure AD (Phase 2)
- Any RFC 9068-compliant IdP

---

**Ready to implement?** Start with [mock-resource-server-services.md](mock-resource-server-services.md) to build the core token validation services!
