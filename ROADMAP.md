# AuthOptics Implementation Roadmap

**Document Version:** 1.0.0  
**Last Updated:** December 23, 2025  
**Status:** MVP Development Phase  
**Target Completion:** January 15, 2026 (~3 weeks)

---

## 🎯 Quick Orientation

**What is AuthOptics?**  
OAuth2/OIDC debugging and educational tool with real-time flow visualization, designed for security professionals to debug production auth issues and learn about OAuth2/OIDC vulnerabilities.

**Architecture:** Monorepo with 4 packages (shared → backend, frontend, mock-resource-server)  
**MVP Focus:** Authorization Code Flow with PKCE + DISABLE_PKCE vulnerability toggle  
**Identity Provider:** KeyCloak (pre-configured)  
**Primary Documents:** See [CLAUDE.md](CLAUDE.md) for context, [auth-optics-architecture.md](docs/specs/auth-optics-architecture.md) for architecture

---

## 📊 Current Project Status

**Overall Progress:** `███░░░░░░░ 30%` (Specifications Complete, Implementation Starting)

| Component | Status | Progress | Estimated Completion |
|-----------|--------|----------|---------------------|
| **Specifications** | ✅ Complete | 100% | Done |
| **Shared Types** | 🟡 In Progress | 40% | Week 1, Day 3 |
| **Backend** | 🔴 Not Started | 0% | Week 2-3 |
| **Frontend** | 🔴 Not Started | 0% | Week 2-3 |
| **Mock Resource Server** | 🔴 Not Started | 0% | Week 3 |
| **KeyCloak Setup** | 🔴 Not Started | 0% | Week 1 |
| **Integration Testing** | 🔴 Not Started | 0% | Week 3 |

**Legend:** ✅ Complete | 🟡 In Progress | 🔴 Not Started | ⚠️ Blocked

---

## 🏗️ Component Overview & Dependencies

### Dependency Graph

```
                    ┌─────────────┐
                    │   shared     │ ← START HERE
                    │  (types)     │
                    └──────┬──────┘
                            │
        ┌─────────────────┼──────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
  ┌──────────┐       ┌──────────┐      ┌─────────────┐
  │ backend   │       │ frontend  │      │ mock-resource│
  │(port 3001)│       │(port 3000)│      │ (port 3002)  │
  └────┬─────┘       └────┬─────┘      └──────┬──────┘
       │                   │                     │
       └────────┬────────┴───────────────────┘
                 │
                 ▼
         ┌─────────────┐
         │  KeyCloak    │
         │ (port 8080)  │
         └─────────────┘
```

### Component Details

#### 1. **shared** (Foundation - Build First)
- **Purpose:** TypeScript type definitions for all packages
- **Dependencies:** None (zero dependencies)
- **Consumers:** backend, frontend, mock-resource-server
- **Estimated Time:** 4-6 hours
- **Status:** 🟡 40% Complete
- **Spec:** [auth-optics-shared-types-specification.md](docs/specs/auth-optics-shared-types-specification.md)

#### 2. **backend** (Core Logic)
- **Purpose:** OAuth2/OIDC flow orchestration, KeyCloak integration, API
- **Dependencies:** shared
- **Estimated Time:** 34-46 hours (Week 1-3)
- **Status:** 🔴 Not Started
- **Spec:** [auth-optics-backend-specification.md](docs/specs/auth-optics-backend-specification.md)
- **Tasks:** [backend-implementation-tasks.md](docs/specs/backend-implementation-tasks.md)

#### 3. **frontend** (User Interface)
- **Purpose:** React-based visualization and debugging interface
- **Dependencies:** shared
- **Estimated Time:** 16-23 hours (6 phases)
- **Status:** 🔴 Not Started
- **Spec:** [auth-optics-frontend-specification.md](docs/specs/auth-optics-frontend-specification.md)
- **Guide:** [frontend-implementation-guide.md](docs/specs/frontend-implementation-guide.md)

#### 4. **mock-resource-server** (Testing)
- **Purpose:** OAuth2-protected API for testing token exchange
- **Dependencies:** shared
- **Estimated Time:** 8-10 hours
- **Status:** 🔴 Not Started
- **Spec:** [auth-optics-mock-resource-server-specification.md](docs/specs/auth-optics-mock-resource-server-specification.md)

#### 5. **KeyCloak** (Identity Provider)
- **Purpose:** Pre-configured OIDC provider for testing/demo
- **Dependencies:** None (external service)
- **Estimated Time:** 4-5 hours
- **Status:** 🔴 Not Started
- **Spec:** [keycloak-deployment.md](docs/reference/keycloak/keycloak-deployment.md), [keycloak-realm-configuration.md](docs/reference/keycloak/keycloak-realm-configuration.md)

---

## 🗓️ Implementation Phases

### **PHASE 1: Foundation** (Week 1 - Days 1-4)
**Goal:** Establish shared types and project infrastructure  
**Duration:** ~16-20 hours

#### Day 1-2: Shared Types Package (4-6h)
- [ ] Initialize `packages/shared` with TypeScript
- [ ] Implement core flow types (FlowExecution, FlowStep, FlowStatus)
- [ ] Implement token types (AccessToken, IDToken, JWT)
- [ ] Implement HTTP types (HttpRequest, HttpResponse)
- [ ] Implement security types (PKCE, StateManager, SecurityIndicator)
- [ ] Implement vulnerability config types (VulnerabilityConfig)
- [ ] Build and verify type exports
- [ ] **Exit Criteria:** All packages can import from `@auth-optics/shared`

**Detailed Tasks:** See Section 15 of [auth-optics-shared-types-specification.md](docs/specs/auth-optics-shared-types-specification.md)

#### Day 2-3: KeyCloak Setup (4-5h)
- [ ] Set up Docker Compose for KeyCloak
- [ ] Create `oauth2-demo` realm
- [ ] Configure `web-app` client (public, PKCE required)
- [ ] Configure test users and roles
- [ ] Verify OIDC Discovery endpoint (`.well-known/openid-configuration`)
- [ ] Document client secrets and configuration
- [ ] **Exit Criteria:** KeyCloak accessible at `localhost:8080`, discovery working

**Detailed Tasks:** See [keycloak-deployment.md](docs/reference/keycloak/keycloak-deployment.md) Section 3

#### Day 4: Backend Project Setup (2-3h)
- [ ] Initialize `packages/backend` with Express + TypeScript
- [ ] Install dependencies (express, axios, jose, uuid, cors, helmet)
- [ ] Configure TypeScript (strict mode, ES modules)
- [ ] Set up environment variables (.env.example)
- [ ] Create directory structure (services, routes, middleware)
- [ ] Implement health check endpoint
- [ ] **Exit Criteria:** Backend server starts on port 3001

**Detailed Tasks:** See [backend-implementation-tasks.md](docs/specs/backend-implementation-tasks.md) Section 2.1

#### Day 4: Frontend Project Setup (2-3h)
- [ ] Initialize `packages/frontend` with Vite + React + TypeScript
- [ ] Install dependencies (react, @radix-ui/*, axios, lucide-react)
- [ ] Configure Tailwind CSS
- [ ] Set up routing with React Router 6
- [ ] Create basic layout (header, main, footer)
- [ ] Configure environment variables
- [ ] **Exit Criteria:** Frontend dev server starts on port 3000

**Detailed Tasks:** See [frontend-implementation-guide.md](docs/specs/frontend-implementation-guide.md) Section 1

---

### **PHASE 2: Backend Core Services** (Week 1 - Days 5-7)
**Goal:** Build OAuth2 client logic and core services  
**Duration:** ~12-16 hours

#### Day 5-6: Core Services Implementation (8-10h)
- [ ] **PKCEGenerator Service** (2h)
  - Generate code verifier (43 chars, Base64URL)
  - Generate code challenge (SHA-256 of verifier)
  - Validate PKCE parameters
- [ ] **StateManager Service** (2h)
  - Generate cryptographic state tokens
  - Store state with expiration (10 min default)
  - Validate state on callback
- [ ] **OAuth2Client Service** (4-5h)
  - Build authorization URL with PKCE/state
  - Exchange authorization code for tokens
  - Validate token responses
  - Handle errors per RFC 6749
- [ ] **HttpCaptureService** (1-2h)
  - Capture HTTP requests/responses
  - Format for visualization
  - Redact sensitive data (client secrets)

**Detailed Tasks:** See [backend-core-services.md](docs/specs/backend-core-services.md)

#### Day 6-7: Flow Orchestration (4-6h)
- [ ] **FlowStateManager Service** (2-3h)
  - In-memory flow state storage
  - Flow CRUD operations
  - State transitions (IDLE → RUNNING → COMPLETE/ERROR)
- [ ] **FlowOrchestrator Service** (2-3h)
  - Coordinate multi-step OAuth2 flows
  - Execute Authorization Code Flow with PKCE
  - Emit SSE events for each step
  - Handle errors gracefully

**Detailed Tasks:** See [backend-core-services.md](docs/specs/backend-core-services.md) Sections 4-5

---

### **PHASE 3: Backend KeyCloak Integration** (Week 2 - Days 8-10)
**Goal:** Integrate with KeyCloak for OIDC discovery and token validation  
**Duration:** ~10-13 hours

#### Day 8-9: OIDC Discovery & JWKS (6-8h)
- [ ] **DiscoveryClient Service** (3-4h)
  - Fetch `.well-known/openid-configuration`
  - Parse OIDC metadata
  - Cache discovery document (30 min TTL)
  - Handle discovery errors
- [ ] **JWKSClient Service** (3-4h)
  - Fetch JWKS from `jwks_uri`
  - Parse JWK sets
  - Cache JWKS (1 hour TTL)
  - Support key rotation

**Detailed Tasks:** See [backend-keycloak-integration.md](docs/specs/backend-keycloak-integration.md) Sections 2-3

#### Day 10: Token Validation (4-5h)
- [ ] **TokenValidator Service** (4-5h)
  - Verify JWT signatures with JWKS
  - Validate standard claims (iss, aud, exp, iat)
  - Validate OIDC-specific claims (nonce, at_hash)
  - Return validation results with detailed errors

**Detailed Tasks:** See [backend-keycloak-integration.md](docs/specs/backend-keycloak-integration.md) Section 4

---

### **PHASE 4: Backend API & Events** (Week 2 - Days 11-14)
**Goal:** Complete REST API and real-time event streaming  
**Duration:** ~12-15 hours

#### Day 11-12: API Routes (6-7h)
- [ ] **POST /api/flows/start** - Start new flow (2h)
- [ ] **GET /api/flows/:id** - Get flow state (1h)
- [ ] **GET /api/flows/:id/steps** - Get flow steps (1h)
- [ ] **GET /api/config/discovery** - Get KeyCloak discovery (1h)
- [ ] **PUT /api/config/vulnerability** - Update vulnerability config (1-2h)
- [ ] Request validation middleware
- [ ] Error handling middleware

**Detailed Tasks:** See [backend-api-routes.md](docs/specs/backend-api-routes.md)

#### Day 13: Server-Sent Events (3-4h)
- [ ] SSE endpoint: `GET /api/flows/:id/events`
- [ ] Event types: `flow.step`, `flow.complete`, `flow.error`
- [ ] Connection management (keep-alive, reconnection)
- [ ] Event formatting per specification

**Detailed Tasks:** See [backend-sse-events.md](docs/specs/backend-sse-events.md)

#### Day 14: Security & Middleware (3-4h)
- [ ] CORS configuration (allow frontend origin)
- [ ] Helmet security headers
- [ ] Request logging
- [ ] Error handling middleware
- [ ] Input validation

**Detailed Tasks:** See [backend-middleware.md](docs/specs/backend-middleware.md)

---

### **PHASE 5: Frontend Implementation** (Week 2-3 - Days 15-20)
**Goal:** Build React UI with real-time visualization  
**Duration:** ~16-23 hours

#### Day 15-17: Core Components (8-10h)
- [ ] **FlowTimeline Component** (2h)
  - Horizontal step-by-step visualization
  - Step status indicators (pending, running, complete, error)
  - Click to view details
- [ ] **RequestResponseViewer Component** (2h)
  - Display HTTP requests/responses
  - Syntax highlighting
  - Collapsible sections
- [ ] **TokenInspector Component** (2-3h)
  - Decode JWT tokens
  - Display header, payload, signature
  - Claim explanations
  - Expiration countdown
- [ ] **SecurityIndicators Component** (1h)
  - PKCE badge (enabled/disabled)
  - State parameter badge
  - HTTPS/HTTP protocol indicator
- [ ] **ConfigPanel Component** (1-2h)
  - Client ID, redirect URI inputs
  - Scope selector (checkboxes)
  - Start flow button

**Detailed Tasks:** See [frontend-components.md](docs/specs/frontend-components.md)

#### Day 17-18: State Management (4-5h)
- [ ] **FlowContext** (2h)
  - React Context + useReducer
  - Flow state management
  - Action creators
- [ ] **Custom Hooks** (2-3h)
  - `useFlowEvents` - SSE integration
  - `useFlowExecution` - Start/stop flows
  - `useTokenValidation` - Token operations
  - `useConfig` - Client configuration

**Detailed Tasks:** See [frontend-state-management.md](docs/specs/frontend-state-management.md)

#### Day 18-19: Services Layer (2-3h)
- [ ] **ApiService** - HTTP client (axios)
- [ ] **SSEService** - EventSource wrapper
- [ ] **TokenService** - JWT decode/validate
- [ ] **ConfigService** - localStorage persistence

**Detailed Tasks:** See [frontend-services.md](docs/specs/frontend-services.md)

#### Day 19-20: Integration & Polish (2-5h)
- [ ] Wire components to state
- [ ] Connect services to backend API
- [ ] Handle loading/error states
- [ ] Implement dark mode toggle
- [ ] Add copy-to-clipboard for tokens
- [ ] UI polish and accessibility

**Detailed Tasks:** See [frontend-implementation-guide.md](docs/specs/frontend-implementation-guide.md) Section 4-5

---

### **PHASE 6: Mock Resource Server** (Week 3 - Days 21-22)
**Goal:** OAuth2-protected API for testing token exchange  
**Duration:** ~8-10 hours

#### Day 21-22: Mock Resource Server (8-10h)
- [ ] Project setup (Express + TypeScript)
- [ ] **TokenValidationMiddleware** (2-3h)
  - Extract bearer token
  - Verify with KeyCloak JWKS
  - Validate scopes
- [ ] **Protected Routes** (2-3h)
  - `GET /api/user/profile` (scope: profile)
  - `GET /api/user/email` (scope: email)
  - `GET /api/admin/users` (scope: admin)
- [ ] **Introspection Endpoint** (2-3h)
  - `POST /api/token/info`
  - Token introspection per RFC 7662
- [ ] Error responses per OAuth2 spec
- [ ] Testing with Postman/curl

**Detailed Tasks:** See [mock-resource-server-implementation-guide.md](docs/specs/mock-resource-server-implementation-guide.md)

---

### **PHASE 7: Integration & Testing** (Week 3 - Days 23-25)
**Goal:** End-to-end testing and bug fixes  
**Duration:** ~10-12 hours

#### Day 23: Backend Testing (4-5h)
- [ ] Unit tests for services (vitest)
- [ ] Integration tests for API routes
- [ ] PKCE generation tests
- [ ] Token validation tests
- [ ] Error handling tests

**Detailed Tasks:** See [backend-testing.md](docs/specs/backend-testing.md)

#### Day 24: Frontend Testing (3-4h)
- [ ] Component tests (React Testing Library)
- [ ] Hook tests
- [ ] Service integration tests
- [ ] E2E test (Playwright): Complete auth flow

**Detailed Tasks:** See [frontend-implementation-guide.md](docs/specs/frontend-implementation-guide.md) Section 4

#### Day 25: End-to-End Integration (3-4h)
- [ ] Test complete authorization code flow
- [ ] Test DISABLE_PKCE vulnerability mode
- [ ] Test error scenarios (invalid client_id, expired state)
- [ ] Test SSE reconnection
- [ ] Performance testing (multiple concurrent flows)
- [ ] Fix bugs and edge cases

---

### **PHASE 8: Documentation & Deployment** (Week 3 - Days 26-27)
**Goal:** Prepare for production deployment  
**Duration:** ~4-6 hours

#### Day 26: Documentation (2-3h)
- [ ] Update README.md with setup instructions
- [ ] Create API documentation (OpenAPI/Swagger)
- [ ] Document environment variables
- [ ] Create troubleshooting guide
- [ ] Add inline code comments

#### Day 27: Deployment Preparation (2-3h)
- [ ] Docker Compose setup (all services)
- [ ] Production build configuration
- [ ] Environment variable templates
- [ ] Nginx configuration for frontend
- [ ] Health check endpoints
- [ ] CI/CD pipeline (optional)

**Detailed Tasks:** See [backend-configuration.md](docs/specs/backend-configuration.md)

---

## 🎯 Critical Path & Blockers

### Critical Path (Must Complete in Order)

```
1. Shared Types (Day 1-2)
   ↓
2. KeyCloak Setup (Day 2-3) ← Can start after shared types begin
   ↓
3. Backend Project Setup (Day 4)
   ↓
4. Backend Core Services (Day 5-6)
   ↓
5. Backend Flow Orchestration (Day 6-7)
   ↓
6. Backend KeyCloak Integration (Day 8-10)
   ↓
7. Backend API Routes (Day 11-12)
   ↓
8. Backend SSE Events (Day 13)
   ↓
9. Frontend Implementation (Day 15-20) ← Can start after backend API is stable
   ↓
10. Integration Testing (Day 23-25)
```

### Parallel Work Opportunities

- **Frontend Setup** (Day 4) can happen in parallel with Backend Setup
- **Mock Resource Server** (Day 21-22) can be built while frontend polish is ongoing
- **Documentation** (Day 26) can be written incrementally throughout development

### Known Blockers

⚠️ **Blocker 1:** Frontend cannot be fully tested until backend API routes are complete (Day 11-12)  
**Mitigation:** Use mock API responses during early frontend development

⚠️ **Blocker 2:** Token validation requires KeyCloak JWKS endpoint (Day 8-9)  
**Mitigation:** Ensure KeyCloak is fully configured before starting token validation

⚠️ **Blocker 3:** SSE events depend on FlowOrchestrator (Day 6-7)  
**Mitigation:** Complete flow orchestration before implementing SSE

---

## 📋 Status Tracking Mechanism

### How to Update Status

1. **Mark tasks as complete:** Change `[ ]` to `[x]`
2. **Update component progress:** Modify percentages in "Current Project Status" table
3. **Track blockers:** Add new blockers to "Known Blockers" section
4. **Document decisions:** Add notes in "Implementation Notes" section below

### Progress Calculation Formula

```
Component Progress = (Completed Tasks / Total Tasks) × 100
Overall Progress = Average of all component progress
```

### Daily Standup Questions (for Claude Code)

1. **What did I complete yesterday?** (Check `[x]` items)
2. **What am I working on today?** (Next `[ ]` items in sequence)
3. **What blockers do I have?** (Check "Known Blockers")
4. **What decisions do I need?** (Note in "Implementation Notes")

---

## 🧭 Next Actions (Start Here!)

### Immediate Next Steps (Day 1)

1. **Read Context Documents:**
   - [ ] Read [CLAUDE.md](CLAUDE.md) for quick project context
   - [ ] Read [auth-optics-architecture.md](docs/specs/auth-optics-architecture.md) for architecture overview
   - [ ] Skim [auth-optics-shared-types-specification.md](docs/specs/auth-optics-shared-types-specification.md) Section 15 (Implementation Tasks)

2. **Initialize Shared Types Package:**
   ```bash
   cd packages/shared
   pnpm init
   pnpm add -D typescript@^5.3.0
   # Create tsconfig.json, directory structure
   ```

3. **Implement Core Types (Priority Order):**
   - Start with `src/flows/flow-types.ts` (FlowExecution, FlowType, FlowStatus)
   - Then `src/flows/flow-steps.ts` (FlowStep, StepStatus)
   - Then `src/tokens/jwt.ts` (JWT, JWTHeader, JWTPayload)
   - See detailed implementation in [auth-optics-shared-types-specification.md](docs/specs/auth-optics-shared-types-specification.md) Sections 5-6

4. **Verify Type Exports:**
   ```bash
   pnpm build
   # Check dist/ directory for compiled types
   ```

### Tomorrow (Day 2)

- Continue shared types implementation (tokens, HTTP, security types)
- Begin KeyCloak Docker setup in parallel
- See Phase 1 checklist above

---

## 📚 Quick Reference: Key Documents

### Essential Reading (Read First)
- **[CLAUDE.md](CLAUDE.md)** - Quick context for Claude Code sessions
- **[auth-optics-architecture.md](docs/specs/auth-optics-architecture.md)** - System architecture overview
- **[00-NAVIGATION-START-HERE.md](docs/reference/00-NAVIGATION-START-HERE.md)** - OAuth2/OIDC reference navigation

### Implementation Specs (Reference During Development)

#### Shared Types
- [auth-optics-shared-types-specification.md](docs/specs/auth-optics-shared-types-specification.md) - Complete type library

#### Backend
- [auth-optics-backend-specification.md](docs/specs/auth-optics-backend-specification.md) - Backend overview
- [backend-implementation-tasks.md](docs/specs/backend-implementation-tasks.md) - Detailed task breakdown
- [backend-core-services.md](docs/specs/backend-core-services.md) - Service implementations
- [backend-api-routes.md](docs/specs/backend-api-routes.md) - API endpoint specs
- [backend-keycloak-integration.md](docs/specs/backend-keycloak-integration.md) - KeyCloak integration
- [backend-sse-events.md](docs/specs/backend-sse-events.md) - Real-time events

#### Frontend
- [auth-optics-frontend-specification.md](docs/specs/auth-optics-frontend-specification.md) - Frontend overview
- [frontend-implementation-guide.md](docs/specs/frontend-implementation-guide.md) - Step-by-step guide
- [frontend-components.md](docs/specs/frontend-components.md) - React components
- [frontend-state-management.md](docs/specs/frontend-state-management.md) - State patterns
- [frontend-services.md](docs/specs/frontend-services.md) - API/SSE services

#### Mock Resource Server
- [auth-optics-mock-resource-server-specification.md](docs/specs/auth-optics-mock-resource-server-specification.md) - Overview
- [mock-resource-server-implementation-guide.md](docs/specs/mock-resource-server-implementation-guide.md) - Implementation

#### KeyCloak
- [keycloak-deployment.md](docs/reference/keycloak/keycloak-deployment.md) - Docker setup
- [keycloak-realm-configuration.md](docs/reference/keycloak/keycloak-realm-configuration.md) - Realm config

#### OAuth2/OIDC Reference (For Understanding Flows)
- [authorization-code-flow-with-pkce.md](docs/reference/flows/authorization-code-flow-with-pkce.md) - Auth code flow spec
- [pkce-implementation.md](docs/reference/security/pkce-implementation.md) - PKCE details
- [state-parameter-and-csrf.md](docs/reference/security/state-parameter-and-csrf.md) - State parameter
- [jwt-structure-and-validation.md](docs/reference/tokens/jwt-structure-and-validation.md) - JWT validation

---

## 🎓 Implementation Philosophy for Claude Code

### Principles for AI-Assisted Development

1. **Read Specs Before Coding:** Always consult the relevant specification document before starting implementation
2. **Type-Driven Development:** Let TypeScript types guide implementation decisions
3. **Test as You Go:** Write tests immediately after implementing each service/component
4. **Incremental Validation:** Test each component independently before integration
5. **Follow Critical Path:** Don't skip ahead - dependencies matter
6. **Document Decisions:** Add notes to "Implementation Notes" section when making design choices
7. **Ask When Unclear:** If specifications are ambiguous, note it in "Questions" section

### Decision-Making Autonomy

**Claude Code CAN decide autonomously:**
- Variable/function naming (follow TypeScript conventions)
- Code organization within files
- Minor optimizations
- Testing approaches (unit vs integration)
- Error message wording
- Log message format

**Claude Code SHOULD consult specs for:**
- API endpoint paths and methods
- Type definitions
- OAuth2/OIDC protocol details
- Security implementations (PKCE, state validation)
- KeyCloak integration patterns

**Claude Code MUST NOT change:**
- Package architecture (4-package monorepo structure)
- OAuth2/OIDC flow sequences (must follow RFCs)
- Port numbers (3000 frontend, 3001 backend, 3002 mock, 8080 KeyCloak)
- MVP scope (no feature creep beyond Authorization Code + PKCE)

---

## 📝 Implementation Notes

### Design Decisions

*Document key implementation decisions here as development progresses*

**Example:**
- **2025-12-23:** Decided to use Context API instead of Redux for frontend state management (simpler for MVP scope)
- **2025-12-23:** Using in-memory storage for flow state in MVP (database deferred to Phase 3)

---

### Questions & Clarifications

*Add questions that arise during implementation*

**Example:**
- Q: Should we support multiple concurrent flows per user?
- A: Yes, each flow gets unique ID, user can start multiple flows

---

### Known Issues & TODOs

*Track bugs and future improvements*

**Example:**
- TODO: Add rate limiting to API endpoints (Phase 3)
- TODO: Implement database persistence (Phase 3)
- TODO: Add unit tests for TokenValidator service
- BUG: SSE connection drops after 30s (need keep-alive implementation)

---

## 🚀 Phase 2/3 Preview (Post-MVP)

### Phase 2 Features (~35-50 hours)
- Client Credentials Flow (5-6h)
- Device Authorization Flow (6-8h)
- Refresh Token Flow (4-5h)
- Token Introspection (3-4h)
- Token Revocation (2-3h)
- Additional Vulnerability Modes (10-15h)

### Phase 3 Features (~35-50 hours)
- Flow History & Persistence (8-10h)
- Rate Limiting (3-4h)
- Advanced Security Features (DPoP, mTLS) (10-12h)
- External IdP Support (Auth0, Okta, Azure AD) (15-20h)

See [backend-implementation-tasks.md](docs/specs/backend-implementation-tasks.md) Section 6 for details.

---

## 📞 Support & Resources

### Getting Help

1. **Specifications:** All questions should be answered in the 67 spec documents
2. **OAuth2/OIDC:** Refer to RFC documents in project knowledge base
3. **KeyCloak:** See KeyCloak-specific docs for identity provider setup
4. **Claude Code:** This ROADMAP.md is your primary guide

### External Resources

- **OAuth 2.0 RFCs:** [RFC 6749](https://tools.ietf.org/html/rfc6749), [RFC 7636 (PKCE)](https://tools.ietf.org/html/rfc7636)
- **OIDC Spec:** [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- **KeyCloak Docs:** [https://www.keycloak.org/documentation](https://www.keycloak.org/documentation)
- **JWT:** [jwt.io](https://jwt.io) for token debugging

---

## 🎯 Success Criteria

### MVP is Complete When:

**Backend:**
- [ ] Authorization Code Flow with PKCE works end-to-end
- [ ] DISABLE_PKCE vulnerability toggle functions correctly
- [ ] SSE events stream flow progress in real-time
- [ ] Token validation with KeyCloak JWKS succeeds
- [ ] All API endpoints respond correctly
- [ ] Error handling covers major failure scenarios

**Frontend:**
- [ ] User can configure OAuth2 client (client ID, redirect URI, scopes)
- [ ] Flow timeline displays all steps with status indicators
- [ ] Request/response viewer shows complete HTTP details
- [ ] Token inspector decodes JWT and displays claims
- [ ] Security indicators show PKCE, state, HTTPS status
- [ ] Vulnerability toggle affects flow behavior
- [ ] UI is keyboard accessible (WCAG 2.1 AA)

**Integration:**
- [ ] Complete flow: Start → Authorize → Token Exchange → Display
- [ ] SSE connection remains stable throughout flow
- [ ] Error states display user-friendly messages
- [ ] Multiple concurrent flows work without interference

**Testing:**
- [ ] Backend unit tests >70% coverage
- [ ] Frontend component tests >70% coverage
- [ ] End-to-end test passes (Playwright)
- [ ] Manual testing checklist complete

**Documentation:**
- [ ] README.md has clear setup instructions
- [ ] Environment variables documented
- [ ] API endpoints documented (OpenAPI)
- [ ] Troubleshooting guide exists

---

## 📊 Metrics & Estimates

### Time Investment Summary

| Component | Estimated Hours | Actual Hours | Variance |
|-----------|----------------|--------------|----------|
| Shared Types | 4-6h | - | - |
| Backend | 34-46h | - | - |
| Frontend | 16-23h | - | - |
| Mock Resource Server | 8-10h | - | - |
| KeyCloak Setup | 4-5h | - | - |
| Integration Testing | 10-12h | - | - |
| Documentation | 4-6h | - | - |
| **TOTAL MVP** | **80-108h** | - | - |

*Update "Actual Hours" as work completes*

### Velocity Tracking

- **Target:** 4-6 hours/day (part-time development)
- **Days:** 20 working days (4 weeks)
- **Total Capacity:** 80-120 hours
- **MVP Estimate:** 80-108 hours
- **Buffer:** 12 hours (10-15%)

---

## 🎉 Conclusion

This roadmap provides a comprehensive, phase-based implementation plan optimized for AI-assisted development with Claude Code. Follow the critical path, consult specifications frequently, and update status as you progress.

**Remember:** Specifications are complete. Focus on implementation, not design. When in doubt, check the specs!

**Happy coding! 🚀**

---

**Document Metadata:**
- **Version:** 1.0.0
- **Created:** December 23, 2025
- **Author:** Tony (via Claude)
- **License:** MIT
- **Project:** AuthOptics
- **Repository:** https://github.com/twoffer/auth-optics
