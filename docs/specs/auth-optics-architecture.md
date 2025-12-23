# AuthOptics - High-Level Architecture

## Document Information

| Property | Value |
|----------|-------|
| **Version** | 1.0.0 |
| **Date** | December 2024 |
| **Status** | Approved for Implementation |
| **Target** | MVP Development with Claude Code |
| **Estimated Effort** | 15-20 hours (AI-assisted) |

---

## 1. Executive Summary

### 1.1 Purpose

AuthOptics is a local development application designed for security professionals to:

1. **Debug OAuth2/OIDC flows** - Execute and inspect authentication flows against identity providers with full visibility into every request, response, and token exchanged
2. **Learn OAuth2/OIDC security** - Understand how security mechanisms protect against attacks through interactive vulnerability demonstrations

### 1.2 Target Users

- Security professionals debugging OAuth2/OIDC integrations
- Developers implementing OAuth2/OIDC clients
- Security auditors assessing OAuth2/OIDC implementations
- Educators teaching authentication security
- Penetration testers studying OAuth2/OIDC vulnerabilities

### 1.3 Key Capabilities (MVP)

- Execute Authorization Code Flow with PKCE against a pre-configured KeyCloak instance
- Visualize each step of the OAuth2 flow with detailed request/response data
- Inspect and decode JWT tokens (access tokens, ID tokens, refresh tokens)
- Display security indicators showing protection status (PKCE, state parameter, HTTPS)
- Demonstrate the DISABLE_PKCE vulnerability to show why PKCE is required
- Validate tokens against a mock protected resource server

---

## 2. Architecture Overview

### 2.1 System Context

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              Docker Compose Network                              │
│                              (auth-optics-network)                               │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────   │
│  │                         auth-optics (Monorepo)                      │   │
│  │                                                                           │   │
│  │  ┌─────────────────────         ┌─────────────────────────────────┐ │   │
│  │  │  packages/frontend  │         │        packages/backend             │ │   │
│  │  │  (React + TS)       │         │        (Node.js + TS)               │ │   │
│  │  │  Port: 3000         │  HTTP   │        Port: 3001                   │ │   │
│  │  │                     │◄───────►│                                     │ │   │
│  │  │  • Flow Timeline    │   API   │  • OAuth2 Client Logic              │ │   │
│  │  │  • Request Viewer   │         │  • PKCE Generation                  │ │   │
│  │  │  • Token Inspector  │   SSE   │  • State Management                 │ │   │
│  │  │  • Security Badges  │◄────────│  • Flow Orchestration               │ │   │
│  │  │  • Config Panel     │  Events │  • Vulnerability Mode               │ │   │
│  │  │  • Vuln Toggle      │         │  • Discovery Client                 │ │   │
│  │  └─────────────────────┘         └──────────────┬──────────────────────┘ │   │
│  │                                                  │                        │   │
│  │  ┌─────────────────────                        │                        │   │
│  │  │ packages/shared     │                        │                        │   │
│  │  │ (TypeScript types)  │                        │                        │   │
│  │  │                     │                        │                        │   │
│  │  │ • FlowStep          │                        │                        │   │
│  │  │ • TokenData         │                        │                        │   │
│  │  │ • VulnConfig        │                        │                        │   │
│  │  │ • API contracts     │                        │                        │   │
│  │  └─────────────────────┘                        │                        │   │
│  │                                                  │                        │   │
│  │  ┌─────────────────────                        │                        │   │
│  │  │ packages/           │                        │                        │   │
│  │  │ mock-resource-server│◄───────────────────────┘                        │   │
│  │  │ (Node.js + TS)      │      Token Validation                           │   │
│  │  │ Port: 3002          │                                                 │   │
│  │  │                     │                                                 │   │
│  │  │ • /api/protected    │                                                 │   │
│  │  │ • JWT Verification  │                                                 │   │
│  │  │ • Scope Checking    │                                                 │   │
│  │  └─────────────────────┘                                                 │   │
│  └───────────────────────────────────────────────────────────────────────────   │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────   │
│  │                            KeyCloak Container                             │   │
│  │                            Port: 8080                                     │   │
│  │                                                                           │   │
│  │  Realm: oauth2-demo                                                       │   │
│  │  ├── Clients: web-app (confidential), spa-client (public+PKCE)           │   │
│  │  ├── Users: alice, bob (Password123!)                                     │   │
│  │  └── Endpoints:                                                           │   │
│  │      • /realms/oauth2-demo/.well-known/openid-configuration              │   │
│  │      • /realms/oauth2-demo/protocol/openid-connect/auth                  │   │
│  │      • /realms/oauth2-demo/protocol/openid-connect/token                 │   │
│  │      • /realms/oauth2-demo/protocol/openid-connect/certs                 │   │
│  └───────────────────────────────────────────────────────────────────────────   │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘

                                    │
                                    │ User's Browser
                                    ▼
                    ┌───────────────────────────────┐
                    │        Browser Window         │
                    │                               │
                    │  ┌─────────────────────────  │
                    │  │   Main App (Port 3000)  │  │
                    │  │   AuthOptics UI         │  │
                    │  └─────────────────────────  │
                    │                               │
                    │  ┌─────────────────────────  │
                    │  │  Popup (KeyCloak Login) │  │
                    │  │  Port 8080              │  │
                    │  └─────────────────────────  │
                    └───────────────────────────────┘
```

### 2.2 Component Summary

| Component | Technology | Port | Responsibility |
|-----------|------------|------|----------------|
| **Frontend** | React + TypeScript + Vite | 3000 | User interface, visualization, state management |
| **Backend** | Node.js + TypeScript + Express | 3001 | OAuth2 client logic, flow orchestration, SSE events |
| **Mock Resource Server** | Node.js + TypeScript | 3002 | Token validation, protected resource simulation |
| **Shared** | TypeScript | N/A | Type definitions, API contracts |
| **KeyCloak** | KeyCloak 22.x | 8080 | Identity provider, OIDC endpoints |

---

## 3. Technology Stack

### 3.1 Stack Summary

| Layer | Technology | Version | Rationale |
|-------|------------|---------|-----------|
| **Frontend Framework** | React | 18.x | Component-based architecture, large ecosystem |
| **Frontend Build** | Vite | 5.x | Fast development server, modern tooling |
| **Frontend Styling** | Tailwind CSS | 3.x | Utility-first CSS, rapid development |
| **UI Components** | Radix UI | Latest | Accessible, unstyled primitives |
| **State Management** | React Context + useReducer | Built-in | Sufficient for MVP scope, no external deps |
| **Backend Runtime** | Node.js | 20.x LTS | JavaScript ecosystem, async I/O |
| **Backend Framework** | Express | 4.x | Minimal, flexible, well-documented |
| **HTTP Client** | axios | 1.x | OAuth2 requests to KeyCloak |
| **JWT Library** | jose | 5.x | Modern, secure JWT handling |
| **TypeScript** | TypeScript | 5.x | Type safety, better DX |
| **Package Manager** | pnpm | 8.x | Fast, efficient monorepo support |
| **Containerization** | Docker Compose | 2.x | Local development environment |
| **Identity Provider** | KeyCloak | 22.x | Full OIDC/OAuth2 support |

### 3.2 Key Library Choices

#### Frontend Libraries

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-dialog": "^1.0.5",
    "lucide-react": "^0.292.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.3.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
```

#### Backend Libraries

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "axios": "^1.6.0",
    "jose": "^5.1.0",
    "dotenv": "^16.3.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "tsx": "^4.6.0",
    "nodemon": "^3.0.2"
  }
}
```

---

## 4. Monorepo Structure

### 4.1 Repository Layout

```
auth-optics/
├── docker/
│   ├── docker-compose.yml          # Multi-container orchestration
│   └── keycloak/
│       ├── realm-export.json       # KeyCloak realm configuration
│       └── init/                   # KeyCloak initialization scripts
├── packages/
│   ├── frontend/                   # React application
│   │   ├── src/
│   │   │   ├── components/         # React components
│   │   │   ├── hooks/              # Custom React hooks
│   │   │   ├── services/           # API clients
│   │   │   ├── types/              # Frontend-specific types
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── public/
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   └── tailwind.config.js
│   ├── backend/                    # Node.js backend
│   │   ├── src/
│   │   │   ├── services/           # OAuth2 client logic
│   │   │   ├── routes/             # Express routes
│   │   │   ├── middleware/         # Express middleware
│   │   │   ├── types/              # Backend-specific types
│   │   │   └── server.ts           # Entry point
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── nodemon.json
│   ├── mock-resource-server/       # Protected resource server
│   │   ├── src/
│   │   │   ├── middleware/         # JWT verification
│   │   │   ├── routes/             # Protected endpoints
│   │   │   └── server.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── shared/                     # Shared TypeScript types
│       ├── src/
│       │   ├── types/              # Common types
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── scripts/
│   ├── init-keycloak.sh            # KeyCloak setup script
│   └── test-keycloak.sh            # KeyCloak connectivity test
├── .env.example                    # Environment variables template
├── pnpm-workspace.yaml             # pnpm monorepo config
├── package.json                    # Root package.json
└── README.md
```

### 4.2 Package Dependencies

```
┌─────────────────────────────────────────────┐
│          pnpm Workspace (auth-optics)       │
│                                             │
│  ┌──────────────┐         ┌──────────────┐ │
│  │   frontend   │─────────►│   backend    │ │
│  │  (port 3000) │   HTTP   │  (port 3001) │ │
│  │              │   SSE    │              │ │
│  └──────┬───────┘         └──────┬───────┘ │
│         │                        │         │
│         │   ┌───────────────┐    │         │
│         └───►    shared     │◄───┘         │
│             │  (types only) │              │
│             └───────────────┘              │
│                                             │
│  ┌────────────────────────────────┐        │
│  │  mock-resource-server          │        │
│  │      (port 3002)               │        │
│  └────────────────────────────────┘        │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 5. Component Specifications

### 5.1 Frontend (React + TypeScript)

#### 5.1.1 Main Components

**`App.tsx`** - Root component
- Global layout (header, main content area, footer)
- OAuth flow state management (Context API)
- Configuration panel (client settings, scope selection)
- Start flow button

**`FlowTimeline.tsx`** - Step-by-step flow visualization
- Vertical timeline showing each OAuth2 step
- Visual indicators (completed, in-progress, pending)
- Click to view detailed request/response data
- Real-time updates via SSE

**`RequestResponseViewer.tsx`** - HTTP details
- Request: Method, URL, headers, body
- Response: Status, headers, body
- JSON syntax highlighting
- Collapsible sections for readability

**`TokenInspector.tsx`** - JWT token decoder
- Decoded header, payload, signature
- Claim explanations with tooltips
- Expiration countdown
- Copy-to-clipboard functionality

**`SecurityIndicators.tsx`** - Security status badges
- PKCE enabled/disabled
- State parameter used/not used
- HTTPS/HTTP protocol
- Token signature validation status

**`VulnerabilityModeToggle.tsx`** - Educational controls
- DISABLE_PKCE toggle (MVP)
- Warning messages when vulnerabilities enabled
- RFC reference links for each toggle

**`ConfigPanel.tsx`** - OAuth2 client configuration
- Client ID, redirect URI settings
- Scope selector (checkboxes)
- Response type (code, token, etc.)
- Saved configurations (localStorage)

#### 5.1.2 State Management

```typescript
// Context shape
interface OAuth2FlowState {
  config: ClientConfig;
  currentFlow: FlowExecution | null;
  steps: FlowStep[];
  tokens: TokenData;
  vulnerabilityMode: VulnConfig;
  isExecuting: boolean;
}

// Actions
type OAuth2Action =
  | { type: 'START_FLOW'; config: ClientConfig }
  | { type: 'ADD_STEP'; step: FlowStep }
  | { type: 'UPDATE_TOKENS'; tokens: TokenData }
  | { type: 'TOGGLE_VULNERABILITY'; vuln: VulnerabilityToggle }
  | { type: 'RESET_FLOW' };
```

#### 5.1.3 API Client

```typescript
// src/services/api.ts
class OAuth2ApiClient {
  async startFlow(config: ClientConfig): Promise<{ flowId: string }>;
  async getFlowStatus(flowId: string): Promise<FlowExecution>;
  async testToken(token: string): Promise<ResourceResponse>;
  connectSSE(flowId: string, handlers: SSEHandlers): EventSource;
}
```

---

### 5.2 Backend (Node.js + TypeScript)

#### 5.2.1 Core Services

**`OAuth2Client`** - OAuth2 protocol implementation
- Generate authorization URL with PKCE
- Handle redirect callback
- Exchange authorization code for tokens
- Refresh token logic
- Validate tokens locally (JWT)

**`KeyCloakDiscoveryClient`** - OIDC discovery
- Fetch `.well-known/openid-configuration`
- Cache endpoints (authorization, token, JWKS)
- Parse and validate discovery document

**`FlowOrchestrator`** - Flow execution coordination
- Create flow execution instances
- Coordinate steps (auth request, token exchange, validation)
- Track flow state
- Emit SSE events for frontend updates

**`VulnerabilityModeManager`** - Toggle handler
- Apply vulnerability configurations to OAuth2Client
- DISABLE_PKCE: Skip code_challenge in auth URL
- Validate toggle compatibility

**`TokenValidator`** - JWT validation
- Verify signatures using JWKS
- Check expiration, audience, issuer
- Scope verification

#### 5.2.2 REST API Endpoints

```typescript
// Flow Management
POST   /api/flows/start              // Start a new OAuth2 flow
GET    /api/flows/:flowId            // Get flow status
POST   /api/flows/:flowId/callback   // OAuth2 redirect callback
DELETE /api/flows/:flowId            // Cancel/delete flow

// Configuration
GET    /api/config/discovery         // Get cached discovery document
GET    /api/config/jwks              // Get JWKS keys

// Vulnerability Mode
GET    /api/vuln/toggles             // List available toggles
PUT    /api/vuln/toggles             // Update toggle states

// Token Testing
POST   /api/tokens/validate          // Validate token locally
POST   /api/tokens/test-resource     // Test token against mock resource

// Server-Sent Events
GET    /api/flows/:flowId/events     // SSE stream for flow updates
```

#### 5.2.3 Event Stream Format

```typescript
// SSE event types
interface FlowStepEvent {
  type: 'step_started' | 'step_completed' | 'step_failed';
  flowId: string;
  step: FlowStep;
  timestamp: string;
}

interface TokenReceivedEvent {
  type: 'tokens_received';
  flowId: string;
  tokens: TokenData;
  timestamp: string;
}

// Example SSE message
data: {
  "type": "step_completed",
  "flowId": "flow-123",
  "step": {
    "id": "authorization-request",
    "status": "completed",
    "request": {...},
    "response": {...}
  },
  "timestamp": "2024-12-16T10:30:00Z"
}
```

---

### 5.3 Mock Resource Server

#### 5.3.1 Protected Endpoints

```typescript
GET /api/protected              // Requires valid access token
GET /api/protected/profile      // Requires 'profile' scope
GET /api/protected/email        // Requires 'email' scope
```

#### 5.3.2 JWT Verification Middleware

```typescript
// Middleware to verify JWT tokens
async function verifyAccessToken(req, res, next) {
  const token = extractBearerToken(req);
  const jwks = await fetchJWKS();
  const payload = await jose.jwtVerify(token, jwks);
  
  // Check expiration, issuer, audience
  validateClaims(payload);
  
  req.user = payload;
  next();
}
```

---

### 5.4 Shared Types Package

#### 5.4.1 Core Type Definitions

```typescript
// Flow step representation
interface FlowStep {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  timestamp: string;
  request?: HttpRequest;
  response?: HttpResponse;
  metadata?: Record<string, any>;
}

// Token data structure
interface TokenData {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  tokenType: string;
  expiresIn: number;
  scope: string;
  decodedAccessToken?: JWTPayload;
  decodedIdToken?: JWTPayload;
}

// Client configuration
interface ClientConfig {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scope: string[];
  responseType: 'code' | 'token' | 'id_token';
  usePKCE: boolean;
}

// Vulnerability toggles
interface VulnConfig {
  disablePKCE: boolean;
  disableState: boolean;
  // More toggles in Phase 2
}
```

---

## 6. Data Flow

### 6.1 Authorization Code Flow with PKCE (MVP)

```
┌──────────┐                     ┌─────────┐                   ┌──────────┐
│  Browser │                     │ Backend │                   │ KeyCloak │
│ (Frontend)                     │         │                   │          │
└────┬─────┘                     └────┬────┘                   └────┬─────┘
     │                                │                             │
     │ 1. Start Flow (config)         │                             │
     ├───────────────────────────────►│                             │
     │                                │                             │
     │                                │ 2. Generate PKCE            │
     │                                │    code_verifier            │
     │                                │    code_challenge           │
     │                                │                             │
     │                                │ 3. Build Auth URL           │
     │                                │    + code_challenge         │
     │                                │    + state                  │
     │                                │                             │
     │ 4. Auth URL                    │                             │
     │◄───────────────────────────────┤                             │
     │                                │                             │
     │ 5. Redirect to Auth URL        │                             │
     ├────────────────────────────────┴────────────────────────────►│
     │                                                               │
     │ 6. Login form (popup)                                         │
     │◄──────────────────────────────────────────────────────────────┤
     │                                                               │
     │ 7. User authenticates                                         │
     ├──────────────────────────────────────────────────────────────►│
     │                                                               │
     │ 8. Redirect to callback with code                             │
     │◄──────────────────────────────────────────────────────────────┤
     │                                                               │
     │ 9. Send code + state to backend                               │
     ├───────────────────────────────►│                             │
     │                                │                             │
     │                                │ 10. Exchange code for tokens│
     │                                │     POST /token             │
     │                                │     + code_verifier         │
     │                                ├────────────────────────────►│
     │                                │                             │
     │                                │ 11. Tokens response         │
     │                                │◄────────────────────────────┤
     │                                │                             │
     │                                │ 12. Decode JWT tokens       │
     │                                │                             │
     │ 13. Tokens + decoded data      │                             │
     │◄───────────────────────────────┤                             │
     │                                │                             │
     │ 14. Display tokens in UI       │                             │
     │                                │                             │
```

### 6.2 Server-Sent Events Flow

```
Frontend                         Backend
   │                               │
   │ 1. Start flow                 │
   ├──────────────────────────────►│
   │                               │
   │ 2. Open SSE connection        │
   ├──────────────────────────────►│
   │   /api/flows/:id/events       │
   │                               │
   │                               │ Backend starts executing flow
   │                               │
   │ 3. Event: step_started        │
   │◄──────────────────────────────┤
   │                               │
   │ 4. Update UI (step 1 progress)│
   │                               │
   │                               │ Backend completes step
   │                               │
   │ 5. Event: step_completed      │
   │◄──────────────────────────────┤
   │                               │
   │ 6. Update UI (step 1 done)    │
   │                               │
   │                               │ Backend executes next step
   │                               │
   │ 7. Event: tokens_received     │
   │◄──────────────────────────────┤
   │                               │
   │ 8. Display tokens             │
   │                               │
```

---

## 7. Security Considerations

### 7.1 Authentication Security (KeyCloak)

- HTTPS required in production (HTTP OK for localhost development)
- Strong passwords for demo users (Password123!)
- PKCE required for public clients (SPA client)
- State parameter required for CSRF protection
- Short-lived access tokens (5 minutes for demo)
- Refresh token rotation enabled

### 7.2 Application Security

- No secrets stored in frontend code
- Client secrets only in backend environment variables
- CORS configured to allow only localhost origins
- Input validation on all API endpoints
- No user data persisted (flows are in-memory only)
- Docker containers run as non-root users

### 7.3 Vulnerability Mode Safety

- Vulnerability toggles are for **educational purposes only**
- UI clearly warns when vulnerabilities are enabled
- Vulnerable configurations are **never** recommended for production
- All vulnerability demonstrations include explanations of the risks
- Default state is secure (all protections enabled)

---

## 8. Deployment

### 8.1 Docker Compose Setup

#### 8.1.1 docker-compose.yml

```yaml
version: '3.8'

networks:
  auth-optics-network:
    driver: bridge

services:
  keycloak:
    image: quay.io/keycloak/keycloak:22.0
    container_name: auth-optics-keycloak
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
    ports:
      - "8080:8080"
    volumes:
      - ./keycloak/realm-export.json:/opt/keycloak/data/import/realm.json
    command:
      - start-dev
      - --import-realm
    networks:
      - auth-optics-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health/ready"]
      interval: 10s
      timeout: 5s
      retries: 30

  backend:
    build:
      context: ../packages/backend
      dockerfile: Dockerfile
    container_name: auth-optics-backend
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: development
      PORT: 3001
      KEYCLOAK_URL: http://keycloak:8080
      KEYCLOAK_REALM: oauth2-demo
      FRONTEND_URL: http://localhost:3000
    networks:
      - auth-optics-network
    depends_on:
      keycloak:
        condition: service_healthy

  frontend:
    build:
      context: ../packages/frontend
      dockerfile: Dockerfile
    container_name: auth-optics-frontend
    ports:
      - "3000:3000"
    environment:
      VITE_API_URL: http://localhost:3001
      VITE_RESOURCE_URL: http://localhost:3002
    networks:
      - auth-optics-network
    depends_on:
      - backend

  mock-resource-server:
    build:
      context: ../packages/mock-resource-server
      dockerfile: Dockerfile
    container_name: auth-optics-resource-server
    ports:
      - "3002:3002"
    environment:
      PORT: 3002
      KEYCLOAK_URL: http://keycloak:8080
      KEYCLOAK_REALM: oauth2-demo
    networks:
      - auth-optics-network
    depends_on:
      keycloak:
        condition: service_healthy
```

### 8.2 Development Workflow

#### 8.2.1 Initial Setup

```bash
# Clone repository
git clone https://github.com/your-org/auth-optics.git
cd auth-optics

# Install dependencies
pnpm install

# Start KeyCloak (development mode)
npm run docker:up

# Wait for KeyCloak to be ready (30-60 seconds)
npm run keycloak:test

# Start development servers
npm run dev
```

#### 8.2.2 Development Commands

```bash
# Start all services in dev mode (hot reload)
npm run dev

# Build all packages
npm run build

# Run linters
npm run lint

# Run tests
npm run test

# Start/stop KeyCloak
npm run docker:up
npm run docker:down

# Reset KeyCloak realm
npm run keycloak:init
```

---

## 9. KeyCloak Configuration

### 9.1 Realm: oauth2-demo

**Realm Settings**:
- Realm: `oauth2-demo`
- Display name: OAuth2 Demo Realm
- Enabled: Yes
- User registration: Disabled
- Forgot password: Disabled
- Remember me: Yes
- Verify email: No (for demo simplicity)
- Login with email: Yes

### 9.2 Clients

#### 9.2.1 SPA Client (Public + PKCE)

```json
{
  "clientId": "spa-client",
  "name": "SPA Client (Public with PKCE)",
  "enabled": true,
  "clientAuthenticatorType": "client-secret",
  "secret": "",
  "publicClient": true,
  "protocol": "openid-connect",
  "redirectUris": [
    "http://localhost:3000/callback",
    "http://localhost:3001/callback"
  ],
  "webOrigins": [
    "http://localhost:3000",
    "http://localhost:3001"
  ],
  "standardFlowEnabled": true,
  "directAccessGrantsEnabled": false,
  "implicitFlowEnabled": false,
  "attributes": {
    "pkce.code.challenge.method": "S256",
    "post.logout.redirect.uris": "+"
  }
}
```

#### 9.2.2 Confidential Client (Optional for Phase 2)

```json
{
  "clientId": "web-app",
  "name": "Web Application (Confidential)",
  "enabled": true,
  "clientAuthenticatorType": "client-secret",
  "secret": "your-client-secret-here",
  "publicClient": false,
  "protocol": "openid-connect",
  "redirectUris": [
    "http://localhost:3001/callback"
  ],
  "webOrigins": [
    "http://localhost:3000"
  ],
  "standardFlowEnabled": true,
  "directAccessGrantsEnabled": false,
  "serviceAccountsEnabled": true,
  "authorizationServicesEnabled": false
}
```

### 9.3 Users

```json
{
  "users": [
    {
      "username": "alice",
      "enabled": true,
      "email": "alice@example.com",
      "firstName": "Alice",
      "lastName": "Anderson",
      "credentials": [
        {
          "type": "password",
          "value": "Password123!",
          "temporary": false
        }
      ]
    },
    {
      "username": "bob",
      "enabled": true,
      "email": "bob@example.com",
      "firstName": "Bob",
      "lastName": "Builder",
      "credentials": [
        {
          "type": "password",
          "value": "Password123!",
          "temporary": false
        }
      ]
    }
  ]
}
```

### 9.4 Scopes

- `openid` - Required for OIDC
- `profile` - User profile information (name, username)
- `email` - User email address
- `offline_access` - Refresh token support

### 9.5 Token Lifespans

```json
{
  "accessTokenLifespan": 300,          // 5 minutes
  "accessTokenLifespanForImplicitFlow": 300,
  "ssoSessionIdleTimeout": 1800,       // 30 minutes
  "ssoSessionMaxLifespan": 36000,      // 10 hours
  "offlineSessionIdleTimeout": 2592000, // 30 days
  "refreshTokenMaxReuse": 0,           // Rotation enabled
  "accessCodeLifespan": 60,            // 1 minute
  "accessCodeLifespanUserAction": 300  // 5 minutes
}
```

---

## 10. MVP Scope

### 10.1 Included in MVP

| Category | Feature | Priority | Status |
|----------|---------|----------|--------|
| **Flows** | Authorization Code with PKCE | Critical | Planned |
| **Visualization** | Step-by-step timeline | Critical | Planned |
| **Visualization** | Request/response viewer | Critical | Planned |
| **Visualization** | Token inspector (JWT decoder) | Critical | Planned |
| **Visualization** | Security indicators | High | Planned |
| **Vulnerability** | DISABLE_PKCE toggle | High | Planned |
| **Configuration** | Client settings panel | Critical | Planned |
| **Configuration** | Scope selection | Critical | Planned |
| **Infrastructure** | KeyCloak setup | Critical | Planned |
| **Infrastructure** | Docker Compose | Critical | Planned |
| **Infrastructure** | Mock resource server | High | Planned |
| **Documentation** | README with setup | Critical | Planned |

### 10.2 Excluded from MVP (Future Work)

| Category | Feature | Priority | Phase |
|----------|---------|----------|-------|
| **Flows** | Client Credentials Flow | High | 2 |
| **Flows** | Device Authorization Flow | Medium | 2 |
| **Flows** | Refresh Token Flow | High | 2 |
| **Visualization** | Animated Sequence Diagrams | Medium | 3 |
| **Visualization** | Comparison View | High | 2 |
| **Visualization** | Export (JSON, cURL, Markdown) | Medium | 2 |
| **Vulnerability** | Additional toggles (38 more) | High | 2-3 |
| **Learning Mode** | Step-through execution | Medium | 3 |
| **IdP Support** | External IdPs (Okta, Entra ID) | High | 2 |
| **Persistence** | Flow History | Low | 3 |
| **Deployment** | Standalone single-binary | Medium | 3 |
| **UI** | Advanced animations | Low | 3 |
| **UI** | Mobile responsiveness | Low | 3 |

---

## 11. Implementation Phases

### Phase 1: MVP (15-20 hours)

| Task | Estimated Hours |
|------|-----------------|
| Project setup (monorepo, Docker, KeyCloak) | 2-3 |
| Backend: OAuth2 client, PKCE, state management | 4-5 |
| Backend: Flow orchestration, SSE | 1-2 |
| Frontend: Components (Timeline, Request/Response) | 3-4 |
| Frontend: Token Inspector, Security Indicators | 1-2 |
| Frontend: State management, API integration | 1-2 |
| Mock Resource Server | 1 |
| Vulnerability Mode: DISABLE_PKCE | 1-2 |
| Integration, testing, debugging | 2-3 |
| **Total** | **16-23 hours** |

### Phase 2: Core Features (Future)

- Client Credentials Flow
- Device Authorization Flow  
- Refresh Token Flow
- Additional vulnerability toggles (5-10)
- Comparison view
- Export functionality

### Phase 3: Polish & Advanced (Future)

- Remaining vulnerability toggles
- Step-through learning mode
- External IdP support
- Animated visualizations
- Flow history
- Standalone binary version

---

## 12. Success Criteria

### 12.1 MVP Acceptance Criteria

1. **Flow Execution**: User can successfully complete Authorization Code Flow with PKCE against KeyCloak
2. **Visualization**: All flow steps are displayed with request/response data
3. **Token Inspection**: JWT tokens are decoded and displayed with all claims
4. **Security Indicators**: PKCE, state, and HTTPS status are visible
5. **Vulnerability Demo**: DISABLE_PKCE toggle works and shows the difference
6. **Resource Access**: Token can be used to access mock protected resource
7. **Configuration**: Client and scope settings persist across sessions
8. **Documentation**: README with setup and usage instructions

### 12.2 Quality Requirements

- TypeScript strict mode enabled
- No critical security vulnerabilities in dependencies
- Application starts within 2 minutes (including KeyCloak)
- Flow execution completes within 10 seconds (excluding user authentication)

---

## 13. Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| KeyCloak configuration complexity | Medium | Medium | Detailed realm export, comprehensive init scripts |
| SSE browser compatibility | Low | Low | Fallback to polling if needed |
| CORS issues between services | Medium | High | Proper CORS configuration in backend |
| JWT validation complexity | Medium | Medium | Use well-tested jose library |
| Time estimation optimistic | High | Medium | Prioritize must-have features, defer nice-to-haves |

---

## 14. Appendices

### Appendix A: Environment Variables

```bash
# Backend
NODE_ENV=development
PORT=3001
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=oauth2-demo
FRONTEND_URL=http://localhost:3000

# Frontend (Vite)
VITE_API_URL=http://localhost:3001
VITE_RESOURCE_URL=http://localhost:3002

# Mock Resource Server
PORT=3002
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=oauth2-demo
```

### Appendix B: NPM Scripts

```json
{
  "scripts": {
    "dev": "pnpm -r --parallel dev",
    "build": "pnpm -r build",
    "lint": "pnpm -r lint",
    "test": "pnpm -r test",
    "docker:up": "docker-compose -f docker/docker-compose.yml up -d",
    "docker:down": "docker-compose -f docker/docker-compose.yml down",
    "keycloak:init": "./scripts/init-keycloak.sh",
    "keycloak:test": "./scripts/test-keycloak.sh"
  }
}
```

### Appendix C: References

- [RFC 6749 - OAuth 2.0 Authorization Framework](https://datatracker.ietf.org/doc/html/rfc6749)
- [RFC 7636 - PKCE](https://datatracker.ietf.org/doc/html/rfc7636)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [OAuth 2.0 Security Best Current Practice](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [KeyCloak Documentation](https://www.keycloak.org/documentation)

---

## Document Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Author | Claude (AI Assistant) | December 2024 | ✓ |
| Reviewer | | | |
| Approver | | | |
