# AuthOptics Backend - Implementation Tasks

## Document Information

| Property | Value |
|----------|-------|
| **Component** | packages/backend implementation roadmap |
| **Purpose** | Week-by-week implementation plan for MVP |
| **Status** | ✅ MVP Roadmap Complete |
| **Parent Doc** | [backend-specification.md](auth-optics-backend-specification.md) |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Week 1: Foundation](#2-week-1-foundation)
3. [Week 2: Flow Orchestration](#3-week-2-flow-orchestration)
4. [Week 3: Integration & Polish](#4-week-3-integration--polish)
5. [Success Criteria](#5-success-criteria)
6. [Phase 2/3 Roadmap](#6-phase-23-roadmap)

---

## 1. Overview

### 1.1 MVP Timeline

```
Week 1 (34-46 hours total)
├─ Days 1-2: Project Setup + Core Services (10-12h)
├─ Days 3-4: OAuth2 Client (4-5h)
└─ Days 5-7: Testing & Documentation (2-3h)

Week 2
├─ Days 8-10: Flow Orchestration (10-12h)
├─ Days 11-12: SSE Events (3-4h)
└─ Days 13-14: Security Assessment (2-3h)

Week 3
├─ Days 15-17: KeyCloak Integration (7-9h)
├─ Days 18-19: API Routes & Middleware (6-7h)
└─ Days 20-21: Testing & Polish (5-6h)
```

### 1.2 Implementation Order

Critical path (must be done in order):
1. PKCE & State services
2. OAuth2 Client
3. Flow State Manager
4. Flow Orchestrator
5. KeyCloak integration
6. API routes
7. SSE events

---

## 2. Week 1: Foundation

### Day 1-2: Project Setup + Core Services (10-12 hours)

#### Task 1.1: Project Initialization (2h)
**File: Setup**

```bash
# Initialize package
cd packages/backend
pnpm init

# Install dependencies
pnpm add express axios jose dotenv cors helmet uuid
pnpm add -D typescript @types/express @types/node @types/cors ts-node nodemon vitest

# Configure TypeScript
# Create tsconfig.json, package.json scripts
```

**Deliverables:**
- ✅ package.json with scripts
- ✅ tsconfig.json configured
- ✅ .env.example template
- ✅ Directory structure created

---

#### Task 1.2: PKCEGenerator Service (2h)
**File: `src/services/PKCEGenerator.ts`**

**Steps:**
1. Create PKCEGenerator class
2. Implement `generate()` method
   - Generate 32 random bytes
   - Base64URL encode to get code verifier (43 chars)
   - SHA-256 hash code verifier
   - Base64URL encode hash to get code challenge
3. Implement `validate()` method
   - Verify code verifier format
   - Compute expected challenge
   - Constant-time comparison
4. Write unit tests (10 test cases)

**Test Cases:**
```typescript
// tests/unit/PKCEGenerator.test.ts
- Should generate 43-character code verifier
- Should use valid characters only
- Should generate Base64URL-encoded challenge
- Should validate matching verifier/challenge
- Should reject mismatched verifier/challenge
- Should reject invalid verifier format
- Should use S256 method
- Should generate unique values each time
```

**Success Criteria:**
- ✅ All tests pass
- ✅ Code verifier: 43 characters, valid charset
- ✅ Code challenge: Base64URL-encoded SHA-256
- ✅ Validation works correctly

---

#### Task 1.3: StateManager Service (2h)
**File: `src/services/StateManager.ts`**

**Steps:**
1. Create StateManager class with Map storage
2. Implement `generate()` method
   - Generate 32 random bytes (base64url)
   - Set expiration (10 minutes)
   - Bind to flowId
   - Store in Map
3. Implement `validate()` method
   - Check existence
   - Check expiration
   - Check single-use (replay protection)
   - Check flow binding
4. Implement `cleanupExpired()` method
5. Write unit tests (12 test cases)

**Test Cases:**
```typescript
- Should generate unique state values
- Should include expiration timestamp
- Should bind state to flow ID
- Should validate correct state
- Should reject unknown state
- Should reject expired state
- Should reject already-used state (replay)
- Should reject state for wrong flow
- Should cleanup expired states
```

**Success Criteria:**
- ✅ All tests pass
- ✅ State: 43 characters, cryptographically random
- ✅ Expiration: 10 minutes default
- ✅ Single-use enforced
- ✅ Flow binding enforced

---

#### Task 1.4: HttpCaptureService (1h)
**File: `src/services/HttpCaptureService.ts`**

**Steps:**
1. Create HttpCaptureService class
2. Implement `prepareRequest()` method
   - Generate request ID
   - Capture method, URL, headers, body
   - Generate cURL command
3. Implement `captureResponse()` method
   - Capture status, headers, body
   - Link to request via ID
4. Write unit tests (5 test cases)

**Success Criteria:**
- ✅ Captures complete request/response
- ✅ Generates valid cURL commands
- ✅ Links requests to responses

---

#### Task 1.5: OAuth2Client Service (4h)
**File: `src/services/OAuth2Client.ts`**

**Steps:**
1. Create OAuth2Client class
2. Inject dependencies (PKCE, State, HttpCapture)
3. Implement `generateAuthorizationUrl()` method
   - Generate PKCE (if not disabled)
   - Generate state
   - Build authorization request
   - Construct URL with parameters
4. Implement `exchangeCodeForTokens()` method
   - Build token request (form-encoded)
   - Add client authentication (Basic Auth)
   - Include code_verifier (PKCE)
   - POST to token endpoint
   - Capture request/response
5. Implement `validateState()` method
6. Write unit tests (15 test cases)

**Test Cases:**
```typescript
- Should generate authorization URL with PKCE
- Should generate authorization URL without PKCE (vuln mode)
- Should include all required parameters
- Should add OIDC parameters (nonce)
- Should exchange code for tokens
- Should include client authentication
- Should include code_verifier
- Should capture HTTP interactions
- Should validate state successfully
- Should reject invalid state
```

**Success Criteria:**
- ✅ All tests pass
- ✅ Authorization URL: correct format, all params
- ✅ Token exchange: correct format, auth header
- ✅ PKCE: correctly applied or disabled
- ✅ HTTP capture: complete request/response

---

### Day 3-4: Testing & Documentation (2-3h)

#### Task 1.6: Unit Test Suite (2h)
- Run all unit tests
- Achieve 60% coverage minimum
- Fix any failing tests
- Add missing test cases

#### Task 1.7: Documentation (1h)
- Add JSDoc comments to all public methods
- Create README for services
- Document design decisions

---

## 3. Week 2: Flow Orchestration

### Day 8-10: Flow State & Orchestration (10-12 hours)

#### Task 2.1: FlowStateManager Service (3h)
**File: `src/services/FlowStateManager.ts`**

**Steps:**
1. Create FlowStateManager class with Map storage
2. Implement CRUD operations for flows
3. Implement storage methods:
   - `storePKCE()` / `getPKCE()`
   - `storeState()` / `getState()`
   - `storeTokens()` / `getTokens()`
   - `storeNonce()` / `getNonce()`
4. Implement flow lifecycle methods
5. Write unit tests (10 test cases)

**Success Criteria:**
- ✅ All CRUD operations work
- ✅ Data properly isolated by flow ID
- ✅ Cleanup removes all associated data

---

#### Task 2.2: FlowOrchestrator Service (5-6h)
**File: `src/services/FlowOrchestrator.ts`**

**Steps:**
1. Create FlowOrchestrator class extending EventEmitter
2. Implement `startAuthorizationCodeFlow()` method
   - Create flow execution
   - Execute step 1 (authorization request)
   - Emit events
3. Implement `executeAuthorizationRequest()` method
4. Implement `handleCallback()` method
   - Execute steps 2-5
5. Implement step methods:
   - `recordAuthorizationResponse()`
   - `executeTokenRequest()`
   - `executeTokenValidation()`
   - `executeSecurityAssessment()`
6. Implement error handling
7. Write integration tests (5 test cases)

**Success Criteria:**
- ✅ Complete flow from start to finish
- ✅ All events emitted correctly
- ✅ All steps recorded with timing
- ✅ Errors handled gracefully

---

### Day 11-12: SSE Events (3-4h)

#### Task 2.3: SSE Route Handler (3h)
**File: `src/routes/events.routes.ts`**

**Steps:**
1. Create SSE route handler
2. Set SSE headers correctly
3. Register event handlers on orchestrator
4. Implement keep-alive ping (15s interval)
5. Handle client disconnect
6. Test with frontend EventSource

**Success Criteria:**
- ✅ SSE connection established
- ✅ Events received in real-time
- ✅ Keep-alive prevents timeout
- ✅ Cleanup on disconnect

---

### Day 13-14: Security Assessment (2-3h)

#### Task 2.4: SecurityAssessor Service (2-3h)
**File: `src/services/SecurityAssessor.ts`**

**Steps:**
1. Create SecurityAssessor class
2. Implement `assess()` method
3. Implement security checks:
   - PKCE enabled/disabled
   - State parameter present
   - HTTPS used
   - ID token validated (if OIDC)
4. Implement scoring algorithm
5. Generate recommendations
6. Write unit tests (8 test cases)

**Success Criteria:**
- ✅ Accurate security scoring
- ✅ Helpful recommendations
- ✅ Vulnerability detection

---

## 4. Week 3: Integration & Polish

### Day 15-17: KeyCloak Integration (7-9 hours)

#### Task 3.1: DiscoveryClient Service (3h)
**File: `src/services/DiscoveryClient.ts`**

**Steps:**
1. Create DiscoveryClient class
2. Implement `fetch()` method
   - Construct `.well-known` URL
   - Fetch discovery document
   - Validate required fields
   - Cache with TTL
3. Implement cache management
4. Test with KeyCloak
5. Write unit tests (6 test cases)

**Success Criteria:**
- ✅ Successfully fetches from KeyCloak
- ✅ Caching works correctly
- ✅ Validation catches invalid documents

---

#### Task 3.2: JWKSClient Service (2h)
**File: `src/services/JWKSClient.ts`**

**Steps:**
1. Create JWKSClient class
2. Implement `fetch()` method
3. Implement `findKey()` method
4. Implement caching
5. Test with KeyCloak JWKS endpoint
6. Write unit tests (5 test cases)

**Success Criteria:**
- ✅ Successfully fetches JWKS
- ✅ Key lookup works
- ✅ Caching prevents repeated fetches

---

#### Task 3.3: TokenValidator Service (3-4h)
**File: `src/services/TokenValidator.ts`**

**Steps:**
1. Create TokenValidator class
2. Implement `validateAccessToken()` method
   - Decode JWT header
   - Fetch JWKS
   - Find signing key
   - Verify signature (jose library)
   - Validate claims (iss, exp, aud)
3. Implement `validateIDToken()` method
   - All access token validations
   - Validate nonce
   - Validate at_hash
4. Test with KeyCloak tokens
5. Write unit tests (10 test cases)

**Success Criteria:**
- ✅ Correctly validates KeyCloak tokens
- ✅ Rejects tampered tokens
- ✅ Rejects expired tokens
- ✅ OIDC validations work (nonce, at_hash)

---

### Day 18-19: API Routes & Middleware (6-7h)

#### Task 3.4: Flow Routes (2h)
**File: `src/routes/flows.routes.ts`**

**Steps:**
1. Create router
2. Implement endpoints:
   - POST /start
   - GET /:flowId
   - GET /:flowId/callback
   - DELETE /:flowId
3. Add validation middleware
4. Test with Postman/curl

---

#### Task 3.5: Config Routes (1h)
**File: `src/routes/config.routes.ts`**

**Steps:**
1. Implement GET /discovery
2. Implement GET /jwks
3. Test with KeyCloak

---

#### Task 3.6: Middleware (2h)
**Files: `src/middleware/*.ts`**

**Steps:**
1. Implement error handler
2. Implement request logger
3. Configure CORS
4. Implement validation middleware
5. Test middleware chain

---

#### Task 3.7: Server Setup (1h)
**File: `src/server.ts`**

**Steps:**
1. Create Express app
2. Register middleware
3. Register routes
4. Add health check endpoint
5. Start server

---

### Day 20-21: Testing & Polish (5-6h)

#### Task 3.8: Integration Testing (3h)
- Test complete flow end-to-end
- Test with real KeyCloak instance
- Test error scenarios
- Fix any bugs

#### Task 3.9: Documentation (2h)
- Update README with setup instructions
- Document all environment variables
- Create API documentation
- Add troubleshooting guide

#### Task 3.10: Code Review & Cleanup (1h)
- Code review checklist
- Remove debug code
- Optimize imports
- Format code

---

## 5. Success Criteria

### 5.1 MVP Complete When:

1. ✅ **All services implemented**
   - PKCEGenerator, StateManager, OAuth2Client
   - FlowOrchestrator, FlowStateManager
   - DiscoveryClient, JWKSClient, TokenValidator
   - SecurityAssessor, HttpCaptureService

2. ✅ **All API endpoints working**
   - POST /flows/start → Returns flowId and authorization URL
   - GET /flows/:id → Returns flow status
   - GET /flows/:id/callback → Processes OAuth2 callback
   - GET /events/:id → Streams SSE events

3. ✅ **Integration tests passing**
   - Complete authorization code flow works
   - PKCE correctly applied
   - State validation works
   - Token validation works
   - SSE events received in real-time

4. ✅ **KeyCloak integration working**
   - Discovery document fetched
   - JWKS fetched
   - Tokens validated
   - User can complete full flow

5. ✅ **Security assessment functional**
   - PKCE status detected
   - State parameter detected
   - HTTPS usage detected
   - Security score calculated

6. ✅ **DISABLE_PKCE vulnerability mode working**
   - Can toggle PKCE on/off
   - Authorization URL changes accordingly
   - Security assessment reflects status

7. ✅ **Documentation complete**
   - README with setup instructions
   - API documentation
   - Environment variables documented
   - Troubleshooting guide

---

## 6. Phase 2/3 Roadmap

### 6.1 Phase 2 Features (Post-MVP)

**Client Credentials Flow (5-6h)**
- Implement client credentials grant
- Add machine-to-machine flow
- Update orchestrator

**Device Authorization Flow (6-8h)**
- Implement device code flow
- Add device_code endpoint
- Handle polling logic

**Refresh Token Flow (4-5h)**
- Implement token refresh
- Add refresh logic to orchestrator
- Handle token rotation

**Token Introspection (3-4h)**
- Implement introspection endpoint
- Add introspection client
- Support RFC 7662

**Token Revocation (2-3h)**
- Implement revocation endpoint
- Add revocation client
- Support RFC 7009

**Additional Vulnerability Modes (10-15h)**
- Implement 10-15 additional toggles
- Update security assessor
- Add comprehensive threat demonstrations

**Total Phase 2: ~35-50 hours**

### 6.2 Phase 3 Features (Future)

**Flow History & Persistence (8-10h)**
- Database integration (PostgreSQL/MongoDB)
- Flow history API
- Flow comparison features

**Rate Limiting (3-4h)**
- Implement rate limiting middleware
- Per-IP and per-user limits
- Rate limit headers

**Advanced Security Features (10-12h)**
- DPoP support
- mTLS support
- Advanced token binding

**External IdP Support (15-20h)**
- Support Auth0, Okta, Azure AD
- Dynamic discovery
- Multi-IdP configuration

**Total Phase 3: ~35-50 hours**

---

## Document Metadata

| Property | Value |
|----------|-------|
| **Version** | 1.0.0 |
| **Status** | ✅ Complete MVP Implementation Roadmap |
| **Parent** | [backend-specification.md](auth-optics-backend-specification.md) |
| **Total MVP Hours** | 34-46 hours over 3 weeks |

---

**Start with Week 1, Day 1, Task 1.1!** 🚀
