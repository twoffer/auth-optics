# AuthOptics Backend Component - Index & Overview

## Document Information

| Property | Value |
|----------|-------|
| **Component** | packages/backend |
| **Purpose** | OAuth2/OIDC flow orchestration, KeyCloak integration, and API services |
| **Technology** | Node.js + TypeScript + Express |
| **Port** | 3001 |
| **Dependencies** | @auth-optics/shared, express, axios, jose, etc. |
| **Version** | 1.0.0 (MVP) |
| **Target** | AI-assisted implementation with Claude Code |
| **Document Type** | Index / Navigation |

---

## 📚 Documentation Structure

This specification is organized into **8 focused documents** for easier navigation and implementation:

### Core Documents

1. **[This Document]** - Index & Overview
   - High-level architecture
   - MVP scope summary
   - Quick start guide
   - Navigation to all other documents

2. **[backend-core-services.md](backend-core-services.md)** ✅ MVP Critical
   - OAuth2Client service
   - PKCEGenerator service
   - StateManager service
   - FlowOrchestrator service
   - FlowStateManager service
   - HttpCaptureService

3. **[backend-api-routes.md](backend-api-routes.md)** ✅ MVP Critical
   - All REST API endpoints
   - Request/response formats
   - Validation rules
   - Error responses
   - OpenAPI/Swagger specs

4. **[backend-keycloak-integration.md](backend-keycloak-integration.md)** ✅ MVP Critical
   - DiscoveryClient service
   - JWKSClient service
   - TokenValidator service
   - OIDC Discovery implementation
   - JWT signature verification

5. **[backend-sse-events.md](backend-sse-events.md)** ✅ MVP Critical
   - Server-Sent Events implementation
   - Event types and formats
   - Connection management
   - Client reconnection handling

6. **[backend-middleware.md](backend-middleware.md)** ✅ MVP Required
   - Error handling middleware
   - Request logging
   - CORS configuration
   - Request validation
   - Security headers (Helmet)

7. **[backend-configuration.md](backend-configuration.md)** ✅ MVP Required
   - Environment variables
   - Application configuration
   - Docker setup
   - Deployment guide
   - Production considerations

8. **[backend-testing.md](backend-testing.md)** ⚠️ MVP Basic, Phase 2 Comprehensive
   - Unit testing strategy
   - Integration testing
   - E2E testing
   - Test fixtures
   - Mocking strategies

9. **[backend-implementation-tasks.md](backend-implementation-tasks.md)** ✅ MVP Roadmap
   - Week-by-week implementation plan
   - Task breakdown with estimates
   - Dependencies and ordering
   - Success criteria
   - Phase 2/3 roadmap

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

The backend component is the **core orchestration engine** of AuthOptics, serving as the bridge between the frontend visualization and OAuth2/OIDC identity providers (primarily KeyCloak in MVP).

**Primary Responsibilities:**

- 🔐 **OAuth2/OIDC Protocol Implementation** - RFC-compliant Authorization Code Flow with PKCE
- 🎯 **Flow Orchestration** - Multi-step authentication flow coordination with state management
- 🔗 **KeyCloak Integration** - OIDC Discovery, JWKS fetching, token endpoint communication
- 📡 **Real-time Updates** - Server-Sent Events (SSE) streaming flow progress to frontend
- 🛡️ **Security Assessment** - Analyzing flows for best practices and vulnerabilities
- 🎓 **Educational Demonstrations** - Vulnerability mode for teaching security concepts
- 🎫 **Token Management** - JWT validation, introspection, and lifecycle handling

### 1.2 Architecture Philosophy

The backend is designed with these principles:

1. **Service-Oriented** - Clear separation of concerns with focused service classes
2. **Event-Driven** - SSE events enable real-time frontend updates without polling
3. **Stateful Sessions** - In-memory flow state for MVP (database in Phase 3)
4. **RFC-Compliant** - Strict adherence to OAuth2/OIDC specifications
5. **Capture Everything** - Complete HTTP request/response capture for visualization
6. **Educational First** - Support for vulnerability demonstrations without compromising actual security

### 1.3 Key Features

| Feature | Description | MVP Status |
|---------|-------------|------------|
| **Authorization Code Flow** | Complete RFC 7636 implementation | ✅ MVP |
| **PKCE** | Code verifier/challenge generation and validation | ✅ MVP |
| **State Parameter** | CSRF protection with secure state management | ✅ MVP |
| **OIDC Support** | ID tokens, nonce, at_hash validation | ✅ MVP |
| **JWT Validation** | Signature verification using JWKS | ✅ MVP |
| **Flow Visualization** | Complete HTTP capture for frontend display | ✅ MVP |
| **SSE Streaming** | Real-time flow updates | ✅ MVP |
| **Security Scoring** | Basic assessment (PKCE, HTTPS, state) | ✅ MVP |
| **Vulnerability Mode** | DISABLE_PKCE toggle only | ⚠️ MVP Limited |
| **Client Credentials** | Machine-to-machine flow | ❌ Phase 2 |
| **Device Authorization** | Device code flow | ❌ Phase 2 |
| **Token Introspection** | RFC 7662 introspection | ❌ Phase 2 |

---

## 2. MVP Scope Summary

### 2.1 What's Included in MVP

Based on `auth-optics-architecture.md`, the MVP includes:

**✅ MUST HAVE (Critical Path):**

1. **Authorization Code Flow with PKCE** - Complete implementation
2. **OAuth2 Client Logic** - URL generation, token exchange
3. **PKCE Generation** - RFC 7636 compliant code verifier/challenge
4. **State Management** - CSRF protection with secure state handling
5. **Token Exchange** - Authorization code to access token
6. **JWT Validation** - Signature verification, claims validation
7. **OIDC Discovery** - `.well-known/openid-configuration` fetching
8. **JWKS Client** - Public key fetching and caching
9. **Flow Orchestration** - Multi-step flow coordination
10. **SSE Events** - Real-time frontend updates
11. **HTTP Capture** - Complete request/response recording
12. **Security Assessment** - Basic scoring (PKCE, state, HTTPS)
13. **REST API** - Flow management endpoints
14. **Vulnerability Mode** - DISABLE_PKCE toggle infrastructure

**Estimated MVP Effort:** 34-46 hours

**⚠️ PARTIAL (Basic Implementation):**

- **Vulnerability Toggles** - Infrastructure ready, only DISABLE_PKCE functional
- **Token Validation** - JWT signatures and basic claims (no advanced binding)
- **Error Handling** - Basic patterns (comprehensive in Phase 2)

**❌ EXCLUDED (Phase 2+):**

- Client Credentials Flow
- Device Authorization Flow  
- Refresh Token Flow (as standalone)
- Token Introspection/Revocation
- External IdP support (only KeyCloak in MVP)
- Flow persistence (in-memory only)
- Rate limiting
- 38 additional vulnerability toggles

### 2.2 MVP Success Criteria

The backend MVP is **complete and successful** when:

1. ✅ Frontend can initiate Authorization Code Flow via API
2. ✅ Backend generates valid authorization URL with PKCE
3. ✅ SSE events stream each flow step to frontend in real-time
4. ✅ Backend handles OAuth2 callback with state validation
5. ✅ Backend exchanges authorization code for tokens
6. ✅ Backend validates JWT signatures using KeyCloak JWKS
7. ✅ Backend returns complete flow execution with all steps
8. ✅ Security assessment shows PKCE enabled/disabled status
9. ✅ DISABLE_PKCE vulnerability mode can be toggled
10. ✅ All HTTP requests/responses are captured for frontend visualization
11. ✅ Integration tests pass for happy path flow
12. ✅ Frontend can display complete flow timeline with captured data

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AuthOptics Backend                          │
│                       (Node.js + TypeScript)                        │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                      Express Server                         │   │
│  │                       (Port 3001)                           │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                │                                    │
│                                │                                    │
│         ┌──────────────────────┼──────────────────────┐            │
│         │                      │                      │            │
│         ▼                      ▼                      ▼            │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐       │
│  │   Routes    │      │  Services   │      │ Middleware  │       │
│  │             │      │             │      │             │       │
│  │ • flows     │      │ • OAuth2    │      │ • CORS      │       │
│  │ • config    │      │ • PKCE      │      │ • Errors    │       │
│  │ • tokens    │      │ • State     │      │ • Logging   │       │
│  │ • events    │      │ • Flow      │      │ • Validate  │       │
│  │ • vuln      │      │ • Discovery │      │             │       │
│  └─────────────┘      │ • JWKS      │      └─────────────┘       │
│                       │ • Validator │                             │
│                       │ • Assessor  │                             │
│                       └─────────────┘                             │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                  Flow State Manager                         │   │
│  │              (In-Memory Storage - MVP)                      │   │
│  │                                                             │   │
│  │  • Active flows: Map<flowId, FlowExecution>               │   │
│  │  • PKCE params: Map<flowId, PKCEParams>                   │   │
│  │  • State params: Map<state, StateParam>                   │   │
│  │  • Tokens: Map<flowId, TokenResponse>                     │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                     ┌───────────┼───────────┐
                     │           │           │
                     ▼           ▼           ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │ Frontend │ │ KeyCloak │ │   Mock   │
              │  (3000)  │ │  (8080)  │ │ Resource │
              │          │ │          │ │  (3002)  │
              └──────────┘ └──────────┘ └──────────┘
                   │             │
                   │   SSE       │   HTTP
                   │  Events     │  Requests
                   │             │
                   └─────────────┘
```

### 3.2 Request Flow Diagram

```
Frontend                Backend                 KeyCloak
   │                       │                        │
   │  POST /flows/start    │                        │
   │─────────────────────>│                        │
   │                       │                        │
   │                       │  Generate PKCE         │
   │                       │  Generate State        │
   │                       │  Build Auth URL        │
   │                       │                        │
   │<─────────────────────│                        │
   │  {authUrl, flowId}   │                        │
   │                       │                        │
   │  SSE: step_complete   │                        │
   │<─────────────────────│                        │
   │                       │                        │
   │  User clicks authUrl  │                        │
   │──────────────────────────────────────────────>│
   │                       │                        │
   │                       │    User authenticates  │
   │<──────────────────────────────────────────────│
   │  302 redirect with    │                        │
   │  code & state         │                        │
   │                       │                        │
   │  GET /callback?code=..&state=..               │
   │─────────────────────>│                        │
   │                       │                        │
   │                       │  Validate state        │
   │                       │  POST /token           │
   │                       │─────────────────────>│
   │                       │                        │
   │                       │<─────────────────────│
   │                       │  {access_token,        │
   │                       │   id_token, ...}       │
   │                       │                        │
   │                       │  Validate JWTs         │
   │                       │  Assess security       │
   │                       │                        │
   │  SSE: flow_complete   │                        │
   │<─────────────────────│                        │
   │                       │                        │
   │  302 redirect to      │                        │
   │  /flow/:id?success    │                        │
   │<─────────────────────│                        │
```

### 3.3 Directory Structure Overview

See **[backend-core-services.md](backend-core-services.md)** for complete structure.

```
packages/backend/
├── src/
│   ├── server.ts              # Express app entry point
│   ├── config/                # Configuration files
│   ├── services/              # Business logic (8 core services)
│   ├── routes/                # API endpoints (5 route files)
│   ├── middleware/            # Express middleware (4 middleware)
│   ├── utils/                 # Utility functions
│   └── types/                 # Backend-specific types
├── tests/                     # Test files
├── package.json
├── tsconfig.json
└── README.md
```

---

## 4. Technology Stack

### 4.1 Core Dependencies

| Package | Version | Purpose | MVP Status |
|---------|---------|---------|------------|
| `express` | ^4.18.2 | Web framework | ✅ Required |
| `@auth-optics/shared` | workspace:* | Shared types | ✅ Required |
| `axios` | ^1.6.0 | HTTP client for IdP | ✅ Required |
| `jose` | ^5.1.0 | JWT/JWKS handling | ✅ Required |
| `uuid` | ^9.0.1 | Flow ID generation | ✅ Required |
| `cors` | ^2.8.5 | CORS middleware | ✅ Required |
| `helmet` | ^7.1.0 | Security headers | ✅ Required |
| `dotenv` | ^16.3.1 | Environment config | ✅ Required |

### 4.2 Development Dependencies

| Package | Version | Purpose | MVP Status |
|---------|---------|---------|------------|
| `typescript` | ^5.3.0 | TypeScript compiler | ✅ Required |
| `ts-node` | ^10.9.2 | TS execution | ✅ Required |
| `nodemon` | ^3.0.2 | Auto-reload | ✅ Required |
| `vitest` | ^1.0.4 | Testing framework | ⚠️ Basic MVP |
| `@types/*` | latest | Type definitions | ✅ Required |

### 4.3 Why These Technologies?

**Express** - Industry standard, lightweight, extensive middleware ecosystem
**axios** - Robust HTTP client with interceptors for request capture
**jose** - Modern JWT library with excellent TypeScript support and RFC compliance
**uuid** - Standard for generating unique flow identifiers
**TypeScript** - Type safety critical for OAuth2 protocol implementation

---

## 5. Quick Start Guide

### 5.1 Installation

```bash
# From monorepo root
cd packages/backend

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Edit configuration
vim .env
```

### 5.2 Environment Configuration

```bash
# .env file
NODE_ENV=development
PORT=3001

# KeyCloak Configuration
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=oauth2-demo
KEYCLOAK_CLIENT_ID=web-app
KEYCLOAK_CLIENT_SECRET=your-secret-here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Security
STATE_EXPIRATION_MS=600000  # 10 minutes
PKCE_CODE_VERIFIER_LENGTH=43
```

See **[backend-configuration.md](backend-configuration.md)** for complete configuration guide.

### 5.3 Development

```bash
# Development mode (auto-reload)
pnpm dev

# Production build
pnpm build

# Run production
pnpm start

# Run tests
pnpm test
```

### 5.4 First Flow Test

```bash
# 1. Start backend
pnpm dev

# 2. Test health endpoint
curl http://localhost:3001/health

# 3. Start a flow
curl -X POST http://localhost:3001/api/flows/start \
  -H "Content-Type: application/json" \
  -d '{
    "clientConfig": {
      "clientId": "web-app",
      "clientSecret": "secret",
      "redirectUris": ["http://localhost:3001/api/flows/test-flow/callback"],
      "scopes": ["openid", "profile"]
    },
    "serverConfig": {
      "issuer": "http://localhost:8080/realms/oauth2-demo",
      "authorizationEndpoint": "http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/auth",
      "tokenEndpoint": "http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/token"
    }
  }'

# 4. Open authorizationUrl in browser
# 5. Complete login
# 6. Check flow status
curl http://localhost:3001/api/flows/{flowId}
```

---

## 6. Document Navigation

### 6.1 Implementation Order

For new implementers, follow this reading order:

1. **[This Document]** - Understand overall architecture ⬅️ You are here
2. **[backend-implementation-tasks.md](backend-implementation-tasks.md)** - See week-by-week plan
3. **[backend-core-services.md](backend-core-services.md)** - Core business logic (Start here for coding)
4. **[backend-api-routes.md](backend-api-routes.md)** - API endpoints
5. **[backend-keycloak-integration.md](backend-keycloak-integration.md)** - KeyCloak integration
6. **[backend-sse-events.md](backend-sse-events.md)** - Real-time events
7. **[backend-middleware.md](backend-middleware.md)** - Middleware implementation
8. **[backend-configuration.md](backend-configuration.md)** - Configuration & deployment
9. **[backend-testing.md](backend-testing.md)** - Testing strategy

### 6.2 Quick Reference by Feature

**Need to implement OAuth2 flow?**
→ See [backend-core-services.md](backend-core-services.md) sections 1-4

**Need to add API endpoint?**
→ See [backend-api-routes.md](backend-api-routes.md)

**Need JWT validation?**
→ See [backend-keycloak-integration.md](backend-keycloak-integration.md) section 3

**Need real-time updates?**
→ See [backend-sse-events.md](backend-sse-events.md)

**Need error handling?**
→ See [backend-middleware.md](backend-middleware.md) section 1

**Need deployment info?**
→ See [backend-configuration.md](backend-configuration.md) section 4

**Need test examples?**
→ See [backend-testing.md](backend-testing.md)

### 6.3 Document Status

| Document | Status | Completeness | MVP Critical | Size |
|----------|--------|--------------|--------------|------|
| **Index (this)** | ✅ Complete | 100% | Yes | 25KB |
| **Core Services** | ✅ Complete | 100% | Yes | 59KB |
| **API Routes** | ✅ Complete | 100% | Yes | 25KB |
| **KeyCloak Integration** | ✅ Complete | 100% | Yes | 28KB |
| **SSE Events** | ✅ Complete | 100% | Yes | 15KB |
| **Middleware** | ✅ Complete | 100% | Yes | 8KB |
| **Configuration** | ✅ Complete | 100% | Yes | 8KB |
| **Testing** | ✅ Complete | 100% | No | 6KB |
| **Implementation Tasks** | ✅ Complete | 100% | Yes | 15KB |

**Total Documentation:** ~190KB across 9 comprehensive documents

---

## 7. Key Concepts & Terminology

### 7.1 OAuth2/OIDC Terms

**Authorization Code** - One-time code exchanged for tokens (RFC 6749 §1.3.1)
**PKCE** - Proof Key for Code Exchange, protects authorization code (RFC 7636)
**Code Verifier** - Random string (43-128 chars) used in PKCE
**Code Challenge** - SHA-256 hash of code verifier
**State Parameter** - Random value for CSRF protection (RFC 6749 §10.12)
**Nonce** - Number used once, for ID token replay protection (OIDC Core)
**at_hash** - Access token hash in ID token (OIDC Core §3.1.3.3)
**JWKS** - JSON Web Key Set, public keys for JWT verification (RFC 7517)

### 7.2 Backend-Specific Terms

**Flow Execution** - Single instance of an OAuth2 flow with all steps
**Flow Step** - Individual step within a flow (e.g., authorization request)
**Flow State** - Current status and data for an active flow
**HTTP Capture** - Recording complete request/response for visualization
**SSE** - Server-Sent Events, one-way server-to-client streaming
**Vulnerability Mode** - Educational mode where security features can be disabled

---

## 8. MVP Implementation Roadmap

### 8.1 Three-Week Plan

**Week 1: Foundation (10-12 hours)**
- Project setup
- PKCE & State services
- OAuth2 Client service
- HTTP capture

**Week 2: Orchestration (12-15 hours)**
- Flow orchestration
- Flow state management
- SSE events
- Security assessment

**Week 3: Integration (12-19 hours)**
- OIDC Discovery
- JWKS client
- Token validation
- API routes
- Middleware
- Testing

**Total: 34-46 hours**

See **[backend-implementation-tasks.md](backend-implementation-tasks.md)** for detailed breakdown.

### 8.2 Critical Path

```
Day 1-2:   Project Setup + PKCE + State
           ↓
Day 3-4:   OAuth2Client Service
           ↓
Day 5-7:   Flow Orchestrator + State Manager
           ↓
Day 8-9:   SSE Events + API Routes
           ↓
Day 10-12: KeyCloak Integration (Discovery + JWKS)
           ↓
Day 13-14: Token Validation
           ↓
Day 15-16: Middleware + Error Handling
           ↓
Day 17-18: Integration Testing
           ↓
Day 19-20: Documentation + Polish
```

---

## 9. Support & Resources

### 9.1 Related Documentation

- **Shared Types**: See `auth-optics-shared-types-specification.md`
- **OAuth2/OIDC Specs**: See project knowledge base documents
- **KeyCloak**: See `keycloak-*.md` documents

### 9.2 Key RFC References

- RFC 6749 - OAuth 2.0 Authorization Framework
- RFC 7636 - PKCE
- RFC 7519 - JSON Web Token (JWT)
- RFC 7517 - JSON Web Key (JWK)
- OIDC Core - OpenID Connect Core 1.0

### 9.3 Troubleshooting

Common issues and solutions will be documented in:
- [backend-configuration.md](backend-configuration.md) - Configuration issues
- [backend-testing.md](backend-testing.md) - Testing issues
- [backend-keycloak-integration.md](backend-keycloak-integration.md) - KeyCloak issues

---

## Document Metadata

| Property | Value |
|----------|-------|
| **Version** | 1.0.0 |
| **Created** | December 2024 |
| **Type** | Index / Navigation |
| **Target** | AI-assisted development |
| **Status** | ✅ Complete |

---

**Next Steps:**
1. Read the [Implementation Tasks](backend-implementation-tasks.md) for the detailed roadmap
2. Start with [Core Services](backend-core-services.md) for the OAuth2 implementation
3. Refer back to this index for navigation


---

**Next Steps:**
1. Read the [Implementation Tasks](backend-implementation-tasks.md) for the detailed roadmap
2. Start with [Core Services](backend-core-services.md) for the OAuth2 implementation
3. Refer back to this index for navigation

**Happy coding! 🚀**
