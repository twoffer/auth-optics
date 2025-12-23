# AuthOptics Frontend Component - Index & Overview

## Document Information

| Property | Value |
|----------|-------|
| **Component** | packages/frontend |
| **Purpose** | React-based UI for OAuth2/OIDC flow visualization and debugging |
| **Technology** | React 18 + TypeScript + Vite + Tailwind CSS |
| **Port** | 3000 |
| **Dependencies** | @auth-optics/shared, react, @radix-ui/*, axios, lucide-react |
| **Version** | 1.0.0 (MVP) |
| **Target** | AI-assisted implementation with Claude Code |
| **Document Type** | Index / Navigation |

---

## 📚 Documentation Structure

This specification is organized into **5 comprehensive documents** for easier navigation and implementation:

### Core Documents

1. **[This Document]** - Index & Overview
   - High-level architecture
   - MVP scope summary
   - System architecture diagrams
   - Technology stack overview
   - Quick start guide
   - Navigation to other documents

2. **[frontend-components.md](frontend-components.md)** ✅ MVP Critical
   - Complete React component specifications with full TypeScript implementations
   - **FlowTimeline** - Step-by-step flow visualization (200-250 lines)
   - **TokenInspector** - JWT decoder with validation (300-350 lines)
   - **RequestResponseViewer** - HTTP details display (250-300 lines)
   - **SecurityIndicators** - Security status badges (150-200 lines)
   - **ConfigPanel** - OAuth2 client configuration (200-250 lines)
   - **VulnerabilityModePanel** - Educational security toggles (150-200 lines)
   - Component props, state, hooks, and usage examples

3. **[frontend-state-management.md](frontend-state-management.md)** ✅ MVP Critical
   - FlowContext implementation with React Context + useReducer
   - Complete reducer with 20+ action types
   - Custom hooks (useFlowEvents, useFlowExecution, useTokenValidation, useConfig, useVulnerabilityMode)
   - State management patterns and best practices
   - Testing strategies for reducers and hooks

4. **[frontend-services.md](frontend-services.md)** ✅ MVP Critical
   - **ApiService** - Axios-based HTTP client with interceptors (150-200 lines)
   - **SSEService** - EventSource for real-time flow updates (150-200 lines)
   - **TokenService** - JWT decode, validate, inspect operations (100-150 lines)
   - **ConfigService** - localStorage persistence (50-80 lines)
   - Error handling patterns and service testing

5. **[frontend-implementation-guide.md](frontend-implementation-guide.md)** ✅ MVP Complete
   - **Section 1**: Project setup (Vite, TypeScript, Tailwind, Radix UI)
   - **Section 2**: Component implementation order and dependencies
   - **Section 3**: Routing and navigation with React Router 6
   - **Section 4**: Testing strategy (unit, component, E2E with Playwright)
   - **Section 5**: Build and deployment configuration
   - **Section 6**: 6-phase implementation roadmap (16-23 hours total)

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

The frontend is the **primary user interface** for AuthOptics, providing real-time visualization and debugging capabilities for OAuth2/OIDC authentication flows. It serves as an educational and diagnostic tool for security professionals.

**Primary Responsibilities:**

- **Flow Visualization** - Real-time step-by-step display of OAuth2 flows
- **Request/Response Inspection** - Detailed HTTP request and response viewing
- **Token Analysis** - JWT decoding, validation, and claims explanation
- **Security Assessment** - Visual indicators and scoring for security best practices
- **Configuration Management** - OAuth2 client and server settings
- **Educational Features** - Vulnerability demonstrations and RFC references

### 1.2 Architecture Philosophy

The frontend is designed with these principles:

1. **Component-Based** - Modular, reusable React components
2. **Real-Time Updates** - SSE for live flow progress without polling
3. **Educational First** - Clear explanations with RFC citations
4. **Type-Safe** - Full TypeScript coverage for reliability
5. **Accessible** - WCAG 2.1 Level AA compliance
6. **Performant** - Code splitting, memoization, lazy loading

### 1.3 Key Features

| Feature | Description | MVP Status |
|---------|-------------|------------|
| **Flow Timeline** | Horizontal step-by-step visualization | ✅ MVP |
| **Request Viewer** | HTTP request details with syntax highlighting | ✅ MVP |
| **Response Viewer** | HTTP response details with status codes | ✅ MVP |
| **Token Inspector** | JWT decoder with claims explanation | ✅ MVP |
| **Security Badges** | PKCE, state, HTTPS status indicators | ✅ MVP |
| **Config Panel** | Client ID, scopes, redirect URI settings | ✅ MVP |
| **Vulnerability Toggle** | DISABLE_PKCE educational demonstration | ✅ MVP |
| **SSE Integration** | Real-time flow updates from backend | ✅ MVP |
| **Sequence Diagrams** | Animated flow visualizations | ❌ Phase 3 |
| **Comparison View** | Side-by-side flow comparison | ❌ Phase 2 |
| **Export Features** | JSON, cURL, Markdown export | ❌ Phase 2 |

---

## 2. MVP Scope Summary

### 2.1 What's Included in MVP

Based on `auth-optics-architecture.md`, the MVP includes:

**✅ MUST HAVE (Critical Path):**

1. **Authorization Code Flow Visualization** - Complete flow timeline
2. **Flow Timeline Component** - Horizontal step display with progress
3. **Request/Response Viewer** - HTTP details with JSON highlighting
4. **Token Inspector** - JWT decoder showing header, payload, signature
5. **Security Indicators** - PKCE, state, HTTPS badges
6. **Config Panel** - Client ID, redirect URI, scope selection
7. **Vulnerability Toggle** - DISABLE_PKCE toggle with warnings
8. **SSE Integration** - Real-time flow updates from backend
9. **State Management** - React Context for flow state
10. **API Client** - axios-based backend communication
11. **Error Handling** - User-friendly error messages
12. **Responsive Layout** - Desktop-optimized (mobile in Phase 3)

**⚠️ NICE TO HAVE (Time Permitting):**

13. **Dark Mode** - Theme toggle
14. **Token Validation** - Test against mock resource server
15. **Copy to Clipboard** - For tokens and requests

**❌ NOT IN MVP (Future Phases):**

- Animated sequence diagrams (Phase 3)
- Flow comparison view (Phase 2)
- Export functionality (Phase 2)
- Additional vulnerability toggles (Phase 2-3)
- Flow history persistence (Phase 3)
- Mobile optimization (Phase 3)

### 2.2 MVP Acceptance Criteria

1. **Flow Visualization**: User can see all steps of Authorization Code Flow
2. **Real-Time Updates**: Steps update in real-time via SSE
3. **Request Inspection**: User can view complete HTTP request details
4. **Token Decoding**: JWT tokens are decoded and displayed clearly
5. **Security Status**: PKCE and state parameter status are visible
6. **Configuration**: User can configure client settings before starting flow
7. **Vulnerability Demo**: DISABLE_PKCE toggle works and shows warnings
8. **Error Handling**: Errors are displayed clearly with recovery options

---

## 3. System Architecture

### 3.1 Component Architecture

```
+-----------------------------------------------------------------------+
|                         AuthOptics Frontend (Port 3000)               |
|                                                                       |
|  +---------------------------+    +--------------------------------+  |
|  |        App.tsx            |    |     State Management           |  |
|  |  - Route configuration    |    |  - OAuth2Context               |  |
|  |  - Global layout          |    |  - FlowState (useReducer)      |  |
|  |  - Theme provider         |    |  - ConfigContext               |  |
|  +---------------------------+    +--------------------------------+  |
|               |                                  |                    |
|               v                                  v                    |
|  +-----------------------------------------------------------+        |
|  |                    Main Layout                            |        |
|  |                                                           |        |
|  |  +------------------+  +--------------------------------+ |        |
|  |  |  Sidebar         |  |       Main Content Area        | |        |
|  |  |                  |  |                                | |        |
|  |  |  - ConfigPanel   |  |  +---------------------------+ | |        |
|  |  |  - FlowSelector  |  |  |   FlowTimeline            | | |        |
|  |  |  - VulnToggle    |  |  |   (Step 1 > Step 2 > ...) | | |        |
|  |  +------------------+  |  +---------------------------+ | |        |
|  |                        |                                | |        |
|  |                        |  +---------------------------+ | |        |
|  |                        |  |   RequestResponseViewer   | | |        |
|  |                        |  |   - Request tab           | | |        |
|  |                        |  |   - Response tab          | | |        |
|  |                        |  +---------------------------+ | |        |
|  |                        |                                | |        |
|  |                        |  +---------------------------+ | |        |
|  |                        |  |   TokenInspector          | | |        |
|  |                        |  |   - Header                | | |        |
|  |                        |  |   - Payload               | | |        |
|  |                        |  |   - Signature             | | |        |
|  |                        |  +---------------------------+ | |        |
|  |                        |                                | |        |
|  |                        |  +---------------------------+ | |        |
|  |                        |  |   SecurityIndicators      | | |        |
|  |                        |  |   - PKCE badge            | | |        |
|  |                        |  |   - State badge           | | |        |
|  |                        |  |   - HTTPS badge           | | |        |
|  |                        |  +---------------------------+ | |        |
|  |                        +--------------------------------+ |        |
|  +-----------------------------------------------------------+        |
|                                                                       |
|  +---------------------------+    +--------------------------------+  |
|  |     API Client            |    |     SSE Client                 |  |
|  |  - POST /api/flows/start  |    |  - GET /api/flows/:id/events   |  |
|  |  - GET /api/flows/:id     |    |  - Real-time step updates      |  |
|  |  - Backend communication  |    |  - Token received events       |  |
|  +---------------------------+    +--------------------------------+  |
|                                                                       |
+-----------------------------------------------------------------------+
                    |                           ^
                    | HTTP/REST                 | SSE
                    v                           |
        +-------------------+        +-------------------+
        |  Backend          |        |  Backend          |
        |  (Port 3001)      |        |  (Port 3001)      |
        |  - Flow control   |        |  - Event stream   |
        +-------------------+        +-------------------+
```

### 3.2 Data Flow

```
1. User Configuration
   |
   |--> ConfigPanel
   |    - Set client_id, redirect_uri, scopes
   |    - Set vulnerability toggles
   |    - Click "Start Flow"
   |
   v
2. API Request to Backend
   |
   |--> POST /api/flows/start
   |    { clientConfig, vulnerabilityConfig }
   |
   v
3. Backend Response
   |
   |--> { flowId: "flow-123", authUrl: "https://..." }
   |
   v
4. SSE Connection Established
   |
   |--> EventSource: /api/flows/flow-123/events
   |
   v
5. Real-Time Events Received
   |
   |--> step_started: { stepNumber: 1, name: "Authorization Request" }
   |--> step_completed: { stepNumber: 1, request: {...}, response: {...} }
   |--> tokens_received: { accessToken, idToken, refreshToken }
   |
   v
6. UI Updates (via State Management)
   |
   |--> FlowTimeline: Update step status
   |--> RequestResponseViewer: Display HTTP details
   |--> TokenInspector: Decode and display JWT
   |--> SecurityIndicators: Update badge status
```

### 3.3 Component Communication

```
App (Context Provider)
  |
  +-- OAuth2Context.Provider
  |     - flowState (current flow data)
  |     - dispatch (state updates)
  |     - startFlow, cancelFlow actions
  |
  +-- ConfigContext.Provider
  |     - clientConfig
  |     - vulnerabilityConfig
  |     - updateConfig actions
  |
  +-- Components (Context Consumers)
        |
        +-- ConfigPanel
        |     - useConfig() hook
        |     - Updates clientConfig
        |
        +-- FlowTimeline
        |     - useFlowState() hook
        |     - Displays flow.steps
        |
        +-- RequestResponseViewer
        |     - useFlowState() hook
        |     - Displays selectedStep request/response
        |
        +-- TokenInspector
        |     - useFlowState() hook
        |     - Displays flow.tokens
        |
        +-- SecurityIndicators
              - useFlowState() hook
              - Displays flow.securityAssessment
```

---

## 4. Technology Stack

### 4.1 Core Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.x | UI framework |
| **TypeScript** | 5.3.x | Type safety |
| **Vite** | 5.0.x | Build tool and dev server |
| **Tailwind CSS** | 3.3.x | Utility-first styling |
| **@radix-ui/*** | Latest | Accessible UI primitives |
| **axios** | 1.6.x | HTTP client for backend API |
| **lucide-react** | 0.292.x | Icon library |
| **@auth-optics/shared** | workspace:* | Shared types |

### 4.2 Development Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| **@vitejs/plugin-react** | 4.2.x | React support for Vite |
| **@types/react** | 18.2.x | React type definitions |
| **@types/react-dom** | 18.2.x | React DOM type definitions |
| **autoprefixer** | 10.4.x | PostCSS plugin for Tailwind |
| **postcss** | 8.4.x | CSS transformation |
| **vitest** | 1.2.x | Unit testing framework |
| **@testing-library/react** | 14.1.x | React component testing |
| **@testing-library/user-event** | 14.5.x | User interaction testing |
| **happy-dom** | 12.10.x | DOM implementation for tests |

### 4.3 Radix UI Components (MVP)

```json
{
  "@radix-ui/react-tabs": "^1.0.4",
  "@radix-ui/react-accordion": "^1.1.2",
  "@radix-ui/react-switch": "^1.0.3",
  "@radix-ui/react-tooltip": "^1.0.7",
  "@radix-ui/react-dialog": "^1.0.5",
  "@radix-ui/react-select": "^2.0.0"
}
```

---

## 5. Quick Start Guide

### 5.1 Installation

```bash
# From monorepo root
cd packages/frontend

# Install dependencies (via pnpm workspace)
pnpm install

# Build shared types first
cd ../shared && pnpm build

# Return to frontend
cd ../frontend
```

### 5.2 Configuration

Create `.env` file:

```env
# Backend API
VITE_API_URL=http://localhost:3001
VITE_RESOURCE_URL=http://localhost:3002

# Feature Flags
VITE_ENABLE_DARK_MODE=true
VITE_ENABLE_DEBUG_MODE=false

# Application
VITE_APP_TITLE=AuthOptics
VITE_APP_VERSION=1.0.0
```

### 5.3 Development

```bash
# Development mode (hot reload)
pnpm dev
# Opens http://localhost:3000

# Build
pnpm build

# Preview production build
pnpm preview

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Lint
pnpm lint

# Type check
pnpm type-check
```

### 5.4 Project Structure

```
src/
├── components/              # React components
│   ├── FlowTimeline.tsx     # ✅ MVP Critical
│   ├── TokenInspector.tsx   # ✅ MVP Critical
│   ├── RequestResponseViewer.tsx  # ✅ MVP Critical
│   ├── SecurityIndicators.tsx     # ✅ MVP Critical
│   ├── ConfigPanel.tsx      # ✅ MVP Critical
│   ├── VulnerabilityToggle.tsx    # ✅ MVP Critical
│   ├── Layout.tsx           # Main layout wrapper
│   └── ui/                  # Radix UI wrappers
│       ├── Button.tsx
│       ├── Badge.tsx
│       ├── Card.tsx
│       └── ...
├── context/                 # React Context providers
│   ├── OAuth2Context.tsx    # Flow state management
│   └── ConfigContext.tsx    # Configuration state
├── hooks/                   # Custom React hooks
│   ├── useFlowState.ts      # Flow state hook
│   ├── useSSE.ts            # SSE connection hook
│   └── useAPI.ts            # API client hook
├── services/                # API and SSE clients
│   ├── api.ts               # Backend HTTP client
│   └── sse.ts               # SSE event handler
├── types/                   # Frontend-specific types
│   └── index.ts             # UI state types
├── utils/                   # Utility functions
│   ├── jwt.ts               # JWT decoding utilities
│   ├── format.ts            # Formatting helpers
│   └── validation.ts        # Input validation
├── App.tsx                  # Root component
├── main.tsx                 # Application entry point
└── index.css                # Global styles + Tailwind
```

---

## 6. Document Navigation

### 6.1 Recommended Reading Order

**For AI-Assisted Implementation (Claude Code):**

1. **Start Here: Main Specification** (this document)
   - Understand high-level architecture
   - Review MVP scope
   - Understand technology stack

2. **Core Components**
   - Read: [frontend-components.md](frontend-components.md)
   - Implement: FlowTimeline, TokenInspector, RequestResponseViewer, SecurityIndicators, ConfigPanel, VulnerabilityModePanel
   - Time: 6-8 hours

3. **State Management**
   - Read: [frontend-state-management.md](frontend-state-management.md)
   - Implement: FlowContext, reducer, custom hooks (useFlowEvents, useFlowExecution, useTokenValidation, useConfig, useVulnerabilityMode)
   - Time: 2-3 hours

4. **Services Layer**
   - Read: [frontend-services.md](frontend-services.md)
   - Implement: ApiService, SSEService, TokenService, ConfigService
   - Time: 2-3 hours

5. **Complete Implementation**
   - Read: [frontend-implementation-guide.md](frontend-implementation-guide.md)
   - Follow sections 1-6 in order:
     - Project setup (Vite, TypeScript, Tailwind)
     - Component implementation order
     - Routing and navigation
     - Testing strategy
     - Build and deployment
     - 6-phase implementation roadmap
   - Time: 6-9 hours

### 6.2 By Development Phase

**Phase 1: Project Setup (2-3 hours)**
- Read: Implementation guide section 1 (Project Setup)
- Setup: Vite, TypeScript, Tailwind CSS, Radix UI
- Configure: ESLint, Prettier, tsconfig.json
- Create: Basic project structure

**Phase 2: Core Components (6-8 hours)**
- Read: [frontend-components.md](frontend-components.md) (complete)
- Implement: All 6 core components
- Test: Component unit tests
- Integrate: Components into main layout

**Phase 3: State Management (2-3 hours)**
- Read: [frontend-state-management.md](frontend-state-management.md) (complete)
- Implement: FlowContext with reducer
- Create: Custom hooks (useFlowEvents, useFlowExecution, useTokenValidation)
- Test: State transitions

**Phase 4: Services (2-3 hours)**
- Read: [frontend-services.md](frontend-services.md) (complete)
- Implement: ApiService, SSEService, TokenService, ConfigService
- Test: Service integration with backend
- Handle: Error cases and retries

**Phase 5: Integration (2-3 hours)**
- Wire: Components to state and services
- Test: Complete flow execution
- Fix: Integration issues
- Polish: Loading states, error handling

**Phase 6: Testing & Polish (2-3 hours)**
- Write: Component tests
- Test: E2E flow with Playwright
- Fix: Accessibility issues
- Polish: UI/UX refinements

### 6.3 Quick Reference Checklist

```
MVP Implementation Checklist:

[ ] Project Setup
    [ ] Vite + React + TypeScript configuration
    [ ] Tailwind CSS setup
    [ ] Radix UI installation
    [ ] Environment variables
    [ ] Directory structure

[ ] State Management
    [ ] OAuth2Context (flow state)
    [ ] ConfigContext (client/server config)
    [ ] useReducer for flow updates
    [ ] Custom hooks (useFlowState, useConfig)

[ ] Core Components
    [ ] FlowTimeline - step-by-step visualization
    [ ] RequestResponseViewer - HTTP details
    [ ] TokenInspector - JWT decoder
    [ ] SecurityIndicators - status badges
    [ ] ConfigPanel - OAuth2 settings
    [ ] VulnerabilityToggle - DISABLE_PKCE

[ ] API Integration
    [ ] API client (axios)
    [ ] POST /api/flows/start
    [ ] GET /api/flows/:id
    [ ] SSE client (EventSource)
    [ ] Real-time event handlers

[ ] Styling
    [ ] Tailwind configuration
    [ ] Component styling
    [ ] Responsive layout (desktop)
    [ ] Dark mode (optional)

[ ] Testing
    [ ] Component unit tests
    [ ] Hook tests
    [ ] API client tests
    [ ] SSE integration tests

[ ] Integration
    [ ] Backend connectivity
    [ ] SSE real-time updates
    [ ] End-to-end flow
    [ ] Error handling
```

---

## 7. Key Specifications Reference

### 7.1 Design Tokens (Tailwind CSS)

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Flow states
        'flow-idle': '#94a3b8',
        'flow-running': '#3b82f6',
        'flow-complete': '#10b981',
        'flow-error': '#ef4444',
        
        // Security levels
        'security-high': '#10b981',
        'security-medium': '#f59e0b',
        'security-low': '#ef4444',
        
        // Component colors
        'primary': '#3b82f6',
        'secondary': '#6366f1',
        'accent': '#8b5cf6',
      }
    }
  }
}
```

### 7.2 Component Props Interface Examples

```typescript
// FlowTimeline
interface FlowTimelineProps {
  flow: FlowExecution;
  selectedStep?: number;
  onStepSelect: (stepNumber: number) => void;
}

// TokenInspector
interface TokenInspectorProps {
  token: string | null;
  tokenType: 'access' | 'id' | 'refresh';
  onValidate?: (result: TokenValidationResult) => void;
}

// RequestResponseViewer
interface RequestResponseViewerProps {
  request: HttpRequest | null;
  response: HttpResponse | null;
  loading?: boolean;
}

// SecurityIndicators
interface SecurityIndicatorsProps {
  assessment: SecurityAssessment;
  showDetails?: boolean;
}

// ConfigPanel
interface ConfigPanelProps {
  config: ClientConfig;
  onChange: (config: ClientConfig) => void;
  onStartFlow: () => void;
  disabled?: boolean;
}

// VulnerabilityToggle
interface VulnerabilityToggleProps {
  config: VulnerabilityConfig;
  onChange: (config: VulnerabilityConfig) => void;
  availableToggles: VulnerabilityToggleMetadata[];
}
```

---

## 8. Next Steps

### 8.1 For Implementation

1. **Read Component Specifications**
   - [frontend-components.md](frontend-components.md)
   - Detailed specifications for all 6 core components
   - Complete TypeScript implementations with examples

2. **Read State Management**
   - [frontend-state-management.md](frontend-state-management.md)
   - FlowContext implementation with useReducer
   - Custom hooks (useFlowEvents, useFlowExecution, useTokenValidation, useConfig, useVulnerabilityMode)

3. **Read Services Layer**
   - [frontend-services.md](frontend-services.md)
   - ApiService, SSEService, TokenService, ConfigService
   - Error handling patterns and testing strategies

4. **Read Implementation Guide**
   - [frontend-implementation-guide.md](frontend-implementation-guide.md)
   - **Section 1**: Project setup (Vite, TypeScript, Tailwind, Radix UI)
   - **Section 2**: Component implementation order and dependencies
   - **Section 3**: Routing & navigation (React Router 6)
   - **Section 4**: Testing strategy (unit, component, E2E)
   - **Section 5**: Build and deployment configuration
   - **Section 6**: 6-phase implementation roadmap (16-23 hours total)

5. **Follow the Implementation Plan**
   - Phase 1: Project setup (2-3 hours)
   - Phase 2: Core components (6-8 hours)
   - Phase 3: State management (2-3 hours)
   - Phase 4: Services layer (2-3 hours)
   - Phase 5: Integration (2-3 hours)
   - Phase 6: Testing & polish (2-3 hours)
   - Phase 6: Testing - unit tests, integration (1 hour)

### 8.2 For Understanding

- Review React 18 documentation for hooks and Context API
- Study Tailwind CSS utility classes
- Review Radix UI components for accessibility patterns
- Understand SSE (Server-Sent Events) specification

---

## 9. Common Questions

### Q: Why React over Vue or Svelte?

**A:** React provides:
- Mature ecosystem with extensive component libraries
- Excellent TypeScript support
- Large community and resources
- Well-documented patterns for state management
- Radix UI provides accessible components

### Q: Why Context API instead of Redux?

**A:** For MVP scope:
- Context API is sufficient for moderate state complexity
- No external dependencies
- Built into React
- Easier to understand and maintain
- Phase 2 can migrate to Redux/Zustand if needed

### Q: How does SSE work for real-time updates?

**A:** 
- Backend sends flow updates via `/api/flows/:id/events`
- Frontend creates EventSource connection
- Events automatically update flow state via reducer
- Unidirectional: server → client (no client → server via SSE)
- More efficient than polling for our use case

### Q: Why Vite over Create React App?

**A:**
- Faster development server (instant HMR)
- Optimized production builds
- Modern tooling (ESM-first)
- Better TypeScript support
- Smaller bundle sizes

### Q: Can this frontend work with other backends?

**A:** Yes! The frontend communicates via:
- Standard REST API (any OAuth2-aware backend)
- SSE for real-time updates (server can be swapped)
- Shared types ensure interface compatibility

---

**Ready to implement?** Start with [frontend-components.md](frontend-components.md) to build the core React components!
