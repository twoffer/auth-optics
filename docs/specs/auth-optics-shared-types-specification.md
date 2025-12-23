# AuthOptics Shared Types Package - Component Functional Specification

## Document Information

| Property | Value |
|----------|-------|
| **Component** | packages/shared |
| **Purpose** | Type-safe TypeScript definitions shared across all AuthOptics packages |
| **Dependencies** | None (zero dependencies) |
| **Consumers** | frontend, backend, mock-resource-server |
| **Version** | 1.0.0 (MVP) |
| **Target** | AI-assisted implementation with Claude Code |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Package Structure](#2-package-structure)
3. [MVP Quick Reference](#3-mvp-quick-reference)
4. [Type Categories](#4-type-categories)
5. [OAuth2/OIDC Flow Types](#5-oauth2oidc-flow-types)
6. [Token Types](#6-token-types)
7. [HTTP Communication Types](#7-http-communication-types)
8. [Security Types](#8-security-types)
9. [Vulnerability Mode Types](#9-vulnerability-mode-types)
10. [Configuration Types](#10-configuration-types)
11. [Discovery & Metadata Types](#11-discovery--metadata-types)
12. [UI State Types](#12-ui-state-types)
13. [Validation & Error Types](#13-validation--error-types)
14. [Utility Types](#14-utility-types)
15. [Implementation Tasks](#15-implementation-tasks)
16. [Testing Strategy](#16-testing-strategy)
17. [Future Extensions](#17-future-extensions)

---

## 1. Overview

### 1.1 Purpose

The `packages/shared` component provides a centralized, type-safe TypeScript library containing all common type definitions used across the AuthOptics monorepo. This ensures:

- **Type Safety**: Compile-time verification of data structures across package boundaries
- **Consistency**: Single source of truth for data shapes
- **Documentation**: Types serve as living documentation of system contracts
- **Refactoring Safety**: Changes propagate throughout the codebase with TypeScript errors
- **API Contracts**: Clear interfaces between frontend, backend, and resource server

### 1.2 MVP Scope (Based on auth-optics-architecture.md)

**INCLUDED IN MVP:**
- ✅ **Authorization Code Flow with PKCE** - Complete flow types (Critical)
- ✅ **Basic Flow Execution** - FlowExecution, FlowStep, FlowStatus (Critical)
- ✅ **HTTP Communication** - HttpRequest, HttpResponse for visualization (Critical)
- ✅ **Token Types** - AccessToken, IDToken, JWT for token inspector (Critical)
- ✅ **Security Types** - PKCE parameters, state, security indicators (High)
- ✅ **Vulnerability Config** - Focus on DISABLE_PKCE toggle (High)
- ✅ **Client/Server Config** - OAuth2 client and server configuration (Critical)
- ✅ **Basic UI State** - View modes, theme, basic UI state (High)
- ✅ **Validation Types** - Token validation, JWT verification (High)

**EXCLUDED FROM MVP (Future Phases):**
- ❌ **Client Credentials Flow** types (Phase 2)
- ❌ **Device Authorization Flow** types (Phase 2)
- ❌ **Refresh Token Flow** types as separate flow (Phase 2)
- ❌ **Additional Vulnerability Toggles** beyond DISABLE_PKCE (Phase 2-3)
- ❌ **Comparison View** types (Phase 2)
- ❌ **Export Functionality** types (Phase 2)
- ❌ **Learning Mode** types (Phase 3)
- ❌ **Flow History** types (Phase 3)
- ❌ **External IdP** types (Phase 2)
- ❌ **Advanced Animations** types (Phase 3)

### 1.3 Design Principles

1. **Zero Dependencies**: No runtime dependencies to avoid version conflicts
2. **Strict Typing**: No `any` types except where truly necessary (e.g., JSON parsing)
3. **Immutability**: Prefer `readonly` arrays and properties where appropriate
4. **Discriminated Unions**: Use tagged unions for type-safe variant handling
5. **JSDoc Comments**: All exported types include comprehensive documentation
6. **RFC Alignment**: Types reflect OAuth2/OIDC RFC specifications exactly
7. **Extensibility**: Design for future OAuth2/OIDC extensions
8. **MVP-First Development**: Implement only types required for MVP features initially

### 1.4 Package Configuration

```json
{
  "name": "@auth-optics/shared",
  "version": "1.0.0",
  "description": "Shared TypeScript types for AuthOptics",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  },
  "files": [
    "dist/**/*"
  ]
}
```

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 2. Package Structure

### 2.1 Directory Layout

```
packages/shared/
├── src/
│   ├── index.ts                    # Main export barrel
│   ├── flows/                      # ✅ MVP (Authorization Code Flow only)
│   │   ├── index.ts
│   │   ├── flow-types.ts           # ✅ MVP - FlowType, FlowExecution
│   │   ├── flow-steps.ts           # ✅ MVP - FlowStep, StepStatus
│   │   ├── authorization-code.ts   # ✅ MVP - Authorization code flow specifics
│   │   ├── client-credentials.ts   # ❌ PHASE 2 - Client credentials flow
│   │   ├── device-authorization.ts # ❌ PHASE 2 - Device flow
│   │   └── refresh-token.ts        # ❌ PHASE 2 - Refresh token flow
│   ├── tokens/                     # ✅ MVP (Access & ID tokens)
│   │   ├── index.ts
│   │   ├── access-token.ts         # ✅ MVP - AccessToken, AccessTokenPayload
│   │   ├── refresh-token.ts        # ⚠️  PARTIAL MVP - Basic types only
│   │   ├── id-token.ts             # ✅ MVP - IDToken, IDTokenPayload (OIDC)
│   │   ├── jwt.ts                  # ✅ MVP - JWT structure, header, payload
│   │   └── token-response.ts       # ✅ MVP - TokenResponse from token endpoint
│   ├── http/                       # ✅ MVP (Full implementation)
│   │   ├── index.ts
│   │   ├── request.ts              # ✅ MVP - HttpRequest
│   │   ├── response.ts             # ✅ MVP - HttpResponse
│   │   └── headers.ts              # ✅ MVP - Common HTTP headers
│   ├── security/                   # ✅ MVP (Core security types)
│   │   ├── index.ts
│   │   ├── pkce.ts                 # ✅ MVP - PKCE code verifier/challenge
│   │   ├── state.ts                # ✅ MVP - State parameter
│   │   ├── nonce.ts                # ✅ MVP - Nonce (OIDC)
│   │   ├── security-assessment.ts  # ✅ MVP - SecurityAssessment, SecurityScore
│   │   ├── security-indicators.ts  # ✅ MVP - SecurityIndicator badges
│   │   └── token-binding.ts        # ❌ PHASE 2/3 - DPoP, mTLS
│   ├── vulnerability/              # ⚠️  PARTIAL MVP (DISABLE_PKCE only)
│   │   ├── index.ts
│   │   ├── vulnerability-config.ts # ⚠️  MVP - Config structure with all toggles defined
│   │   ├── vulnerability-toggle.ts # ⚠️  MVP - Metadata, but only DISABLE_PKCE active
│   │   └── vulnerability-category.ts # ⚠️  MVP - Categories defined for future use
│   ├── config/                     # ✅ MVP (Full implementation)
│   │   ├── index.ts
│   │   ├── client-config.ts        # ✅ MVP - OAuth2 client configuration
│   │   ├── server-config.ts        # ✅ MVP - Authorization server config
│   │   └── app-config.ts           # ✅ MVP - Application-level config
│   ├── discovery/                  # ⚠️  PARTIAL MVP (Basic discovery only)
│   │   ├── index.ts
│   │   ├── oidc-discovery.ts       # ⚠️  MVP - Basic OIDC Discovery document
│   │   ├── oauth-metadata.ts       # ⚠️  MVP - OAuth 2.0 metadata (RFC 8414)
│   │   └── jwks.ts                 # ⚠️  MVP - JSON Web Key Set (basic)
│   ├── validation/                 # ✅ MVP (Full implementation)
│   │   ├── index.ts
│   │   ├── validation-result.ts    # ✅ MVP - ValidationResult
│   │   ├── validation-error.ts     # ✅ MVP - ValidationError
│   │   └── validators.ts           # ✅ MVP - Validator function signatures
│   ├── ui/                         # ⚠️  PARTIAL MVP (Basic UI only)
│   │   ├── index.ts
│   │   ├── ui-state.ts             # ⚠️  MVP - Basic UI state (no comparison/export)
│   │   ├── theme.ts                # ✅ MVP - Theme configuration
│   │   └── view-modes.ts           # ⚠️  MVP - Basic view modes only
│   ├── events/                     # ✅ MVP (SSE for flow updates)
│   │   ├── index.ts
│   │   ├── flow-events.ts          # ✅ MVP - SSE event types
│   │   └── event-payloads.ts       # ✅ MVP - Event data structures
│   └── utils/                      # ✅ MVP (Full implementation)
│       ├── index.ts
│       ├── common.ts               # ✅ MVP - Common utility types
│       └── branded-types.ts        # ✅ MVP - Branded/nominal typing utilities
├── package.json
├── tsconfig.json
└── README.md

Legend:
  ✅ MVP - Fully included in MVP
  ⚠️  PARTIAL MVP - Types defined but limited functionality in MVP
  ❌ PHASE 2/3 - Not included in MVP, future work
```

### 2.2 Export Strategy

**Main index.ts (src/index.ts)**:
```typescript
// Flows
export * from './flows';

// Tokens
export * from './tokens';

// HTTP
export * from './http';

// Security
export * from './security';

// Vulnerability
export * from './vulnerability';

// Configuration
export * from './config';

// Discovery
export * from './discovery';

// Validation
export * from './validation';

// UI
export * from './ui';

// Events
export * from './events';

// Utilities
export * from './utils';
```

Each subdirectory has its own index.ts that re-exports all types from that category.

---

## 3. MVP Quick Reference

### 3.1 What's Included in MVP

This section provides a quick reference for what types are needed for the MVP implementation based on `auth-optics-architecture.md`.

**✅ COMPLETE IMPLEMENTATION REQUIRED:**

| Type Category | Files/Types | Why MVP Critical |
|---------------|-------------|------------------|
| **Authorization Code Flow** | `authorization-code.ts` | Core MVP flow (RFC 7636) |
| **Flow Execution** | `flow-types.ts`, `flow-steps.ts` | Flow visualization backbone |
| **HTTP Communication** | `request.ts`, `response.ts`, `headers.ts` | Request/response viewer |
| **Access Tokens** | `access-token.ts`, `jwt.ts` | Token inspector (JWT decoder) |
| **ID Tokens (OIDC)** | `id-token.ts` | OpenID Connect ID token display |
| **PKCE** | `pkce.ts` | Authorization Code Flow security |
| **State/Nonce** | `state.ts`, `nonce.ts` | CSRF protection, ID token binding |
| **Security Assessment** | `security-assessment.ts`, `security-indicators.ts` | Security indicator badges |
| **Client/Server Config** | `client-config.ts`, `server-config.ts` | OAuth2 client configuration panel |
| **Validation** | `validation-result.ts`, `validation-error.ts` | Token validation display |
| **HTTP Types** | All HTTP types | Complete request/response capture |
| **Utilities** | `common.ts`, `branded-types.ts` | Type system helpers |

**⚠️ PARTIAL IMPLEMENTATION (Types defined, limited functionality):**

| Type Category | What's Included | What's Deferred |
|---------------|-----------------|-----------------|
| **Vulnerability Mode** | All 39 toggles defined | Only `DISABLE_PKCE` functional; others Phase 2-3 |
| **Refresh Tokens** | Basic `RefreshToken` type | Full refresh flow in Phase 2 |
| **Discovery** | Basic discovery types | Advanced features in Phase 2 |
| **UI State** | `TIMELINE`, `DETAILED` views | `COMPARISON`, `LEARNING` modes in Phase 2-3 |
| **Modals** | Educational, settings modals | Export, comparison modals in Phase 2 |

**❌ EXPLICITLY EXCLUDED FROM MVP:**

| Type Category | Phase | Reason |
|---------------|-------|--------|
| Client Credentials Flow | Phase 2 | Not in MVP scope |
| Device Authorization Flow | Phase 2 | Not in MVP scope |
| Refresh Token Flow (standalone) | Phase 2 | Not in MVP scope |
| Token Binding (DPoP, mTLS) | Phase 2-3 | Advanced security features |
| Additional Vulnerability Toggles (38) | Phase 2-3 | Only DISABLE_PKCE in MVP |
| Comparison View Types | Phase 2 | Not in MVP UI |
| Export Functionality Types | Phase 2 | Not in MVP UI |
| Learning Mode Types | Phase 3 | Advanced educational feature |
| Flow History Types | Phase 3 | Not in MVP |

### 3.2 MVP Type System Architecture

```typescript
// MVP: These imports work and have full functionality
import {
  // Flows (Authorization Code only)
  FlowType,              // AUTHORIZATION_CODE_PKCE is MVP
  FlowExecution,
  FlowStep,
  FlowStatus,
  
  // Tokens (Access & ID tokens)
  AccessToken,
  IDToken,
  JWT,
  TokenResponse,
  
  // HTTP
  HttpRequest,
  HttpResponse,
  
  // Security (Core)
  PKCEParams,
  StateParam,
  NonceParam,
  SecurityAssessment,
  SecurityIndicator,
  
  // Config
  ClientConfig,
  ServerConfig,
  
  // Vulnerability (structure only, DISABLE_PKCE active)
  VulnerabilityConfig,    // All 39 toggles defined
  VulnerabilityToggles,   // Only DISABLE_PKCE is functional
  
  // Validation
  ValidationResult,
  TokenValidationResult
} from '@auth-optics/shared';

// Phase 2: These are defined but not fully functional in MVP
import {
  ClientCredentialsRequest,      // Type exists, flow not implemented
  DeviceAuthorizationRequest,    // Type exists, flow not implemented
  DPoPProof,                      // Type exists, feature not implemented
  ExportFormat                    // Type exists, export not in MVP
} from '@auth-optics/shared';
```

### 3.3 MVP Implementation Priority

**Week 1 (Critical - Cannot proceed without these):**
- ✅ Flow types (Authorization Code Flow)
- ✅ Token types (Access & ID tokens, JWT)
- ✅ HTTP types (complete)

**Week 2 (High Priority - Core functionality):**
- ✅ Security types (PKCE, state, nonce, assessment)
- ✅ Configuration types (client/server)
- ⚠️ Vulnerability types (DISABLE_PKCE focus)

**Week 3 (Medium Priority - Polish):**
- ✅ Validation types
- ✅ Utility types
- ⚠️ Basic discovery types
- ⚠️ Basic UI types
- ✅ Documentation

---

## 4. Type Categories

### 4.1 Category Overview

| Category | Purpose | Key Types | MVP Status |
|----------|---------|-----------|------------|
| **Flows** | OAuth2/OIDC flow definitions | `FlowType`, `FlowExecution`, `FlowStep` | ✅ MVP (Auth Code only) |
| **Tokens** | Token structures and payloads | `AccessToken`, `RefreshToken`, `IDToken`, `JWT` | ✅ MVP (Access & ID tokens) |
| **HTTP** | HTTP communication primitives | `HttpRequest`, `HttpResponse`, `Headers` | ✅ MVP (Full) |
| **Security** | Security primitives and assessment | `PKCEParams`, `StateParam`, `SecurityAssessment` | ✅ MVP (Core types) |
| **Vulnerability** | Vulnerability mode configuration | `VulnerabilityConfig`, `VulnerabilityToggle` | ⚠️ MVP (DISABLE_PKCE only) |
| **Config** | Application and client configuration | `ClientConfig`, `ServerConfig`, `AppConfig` | ✅ MVP (Full) |
| **Discovery** | OIDC Discovery and OAuth metadata | `OIDCDiscoveryDocument`, `OAuthMetadata`, `JWKS` | ⚠️ MVP (Basic only) |
| **Validation** | Validation results and errors | `ValidationResult`, `ValidationError` | ✅ MVP (Full) |
| **UI** | UI state and presentation types | `UIState`, `Theme`, `ViewMode` | ⚠️ MVP (Basic only) |
| **Events** | SSE events and payloads | `FlowEvent`, `EventPayload` | ✅ MVP (Flow events) |
| **Utils** | Utility and helper types | `Timestamp`, `URL`, `Base64String` | ✅ MVP (Full) |

**Legend:**
- ✅ **MVP (Full)**: Complete implementation required for MVP
- ⚠️ **MVP (Partial)**: Types defined but limited functionality in MVP
- ❌ **Phase 2/3**: Not required for MVP

---

## 5. OAuth2/OIDC Flow Types

### 5.1 Core Flow Types

**File: `src/flows/flow-types.ts`**

```typescript
/**
 * Supported OAuth2/OIDC flow types
 * 
 * @remarks
 * MVP includes only AUTHORIZATION_CODE_PKCE. Other flows are future phases.
 * 
 * **MVP:**
 * - AUTHORIZATION_CODE_PKCE: RFC 7636 (✅ MVP - Critical)
 * 
 * **Phase 2:**
 * - CLIENT_CREDENTIALS: RFC 6749 §4.4 (machine-to-machine)
 * - DEVICE_AUTHORIZATION: RFC 8628 (input-constrained devices)
 * - REFRESH_TOKEN: RFC 6749 §6 (token refresh as standalone flow)
 * 
 * **Educational/Demo Only (Phase 2-3):**
 * - IMPLICIT: RFC 6749 §4.2 (DEPRECATED - vulnerability demonstrations)
 * - RESOURCE_OWNER_PASSWORD: RFC 6749 §4.3 (DEPRECATED - vulnerability demonstrations)
 */
export enum FlowType {
  // ✅ MVP - Critical
  AUTHORIZATION_CODE_PKCE = 'authorization_code_pkce',
  
  // ❌ Phase 2 - Future Work
  CLIENT_CREDENTIALS = 'client_credentials',
  DEVICE_AUTHORIZATION = 'device_authorization',
  REFRESH_TOKEN = 'refresh_token',
  
  // ❌ Phase 2-3 - Deprecated flows (for educational/vulnerability demonstrations)
  IMPLICIT = 'implicit',
  RESOURCE_OWNER_PASSWORD = 'resource_owner_password'
}

/**
 * Flow execution status
 */
export enum FlowStatus {
  /** Flow has been initialized but not started */
  IDLE = 'idle',
  
  /** Flow is currently executing */
  RUNNING = 'running',
  
  /** Flow completed successfully */
  COMPLETE = 'complete',
  
  /** Flow failed with an error */
  ERROR = 'error',
  
  /** Flow was cancelled by user */
  CANCELLED = 'cancelled'
}

/**
 * Complete flow execution instance
 * 
 * Represents a single execution of an OAuth2/OIDC flow with all
 * associated data, steps, tokens, and security information.
 */
export interface FlowExecution {
  /** Unique identifier for this flow execution */
  readonly id: string;
  
  /** Type of OAuth2/OIDC flow */
  readonly flowType: FlowType;
  
  /** Current status of flow execution */
  status: FlowStatus;
  
  /** Timestamp when flow was initiated (ISO 8601) */
  readonly startedAt: string;
  
  /** Timestamp when flow completed/failed (ISO 8601) */
  completedAt?: string;
  
  /** Ordered list of flow steps */
  steps: FlowStep[];
  
  /** Tokens obtained during flow */
  tokens?: FlowTokens;
  
  /** Security assessment for this flow */
  securityAssessment?: SecurityAssessment;
  
  /** Error information if flow failed */
  error?: FlowError;
  
  /** Flow configuration used */
  config: FlowConfig;
  
  /** Total execution time in milliseconds */
  duration?: number;
}

/**
 * Tokens obtained from successful flow execution
 */
export interface FlowTokens {
  /** Access token (always present on success) */
  accessToken: string;
  
  /** Token type (typically "Bearer") */
  tokenType: string;
  
  /** Access token expiration in seconds */
  expiresIn?: number;
  
  /** Refresh token (optional, not in client credentials flow) */
  refreshToken?: string;
  
  /** ID token (OIDC only) */
  idToken?: string;
  
  /** Granted scopes (may differ from requested) */
  scope?: string;
}

/**
 * Flow execution error
 */
export interface FlowError {
  /** OAuth2 error code (e.g., "invalid_grant", "access_denied") */
  error: string;
  
  /** Human-readable error description */
  errorDescription?: string;
  
  /** Error URI for more information */
  errorUri?: string;
  
  /** Which step the error occurred in */
  step?: number;
  
  /** Underlying technical error */
  technicalError?: string;
  
  /** Stack trace (development only) */
  stackTrace?: string;
}

/**
 * Configuration for a specific flow execution
 */
export interface FlowConfig {
  /** Client configuration */
  client: ClientConfig;
  
  /** Server configuration */
  server: ServerConfig;
  
  /** Vulnerability mode settings */
  vulnerability?: VulnerabilityConfig;
  
  /** Additional flow-specific parameters */
  parameters?: Record<string, string>;
}
```

### 5.2 Flow Step Types

**File: `src/flows/flow-steps.ts`**

```typescript
/**
 * Individual step within an OAuth2/OIDC flow
 * 
 * Each flow consists of multiple sequential steps (e.g., authorization
 * request, token request, token validation). This type captures all
 * information about a single step.
 */
export interface FlowStep {
  /** Step number (1-indexed) */
  readonly stepNumber: number;
  
  /** Human-readable step name */
  readonly name: string;
  
  /** Detailed description of what this step does */
  readonly description: string;
  
  /** Current status of this step */
  status: StepStatus;
  
  /** Timestamp when step started (ISO 8601) */
  startedAt?: string;
  
  /** Timestamp when step completed (ISO 8601) */
  completedAt?: string;
  
  /** Step duration in milliseconds */
  duration?: number;
  
  /** HTTP request made in this step (if applicable) */
  request?: HttpRequest;
  
  /** HTTP response received in this step (if applicable) */
  response?: HttpResponse;
  
  /** Security indicators specific to this step */
  securityIndicators?: SecurityIndicator[];
  
  /** Validation results for this step */
  validationResults?: ValidationResult[];
  
  /** Additional metadata for this step */
  metadata?: StepMetadata;
}

/**
 * Status of an individual flow step
 */
export enum StepStatus {
  /** Step is waiting to be executed */
  PENDING = 'pending',
  
  /** Step is currently executing */
  RUNNING = 'running',
  
  /** Step completed successfully */
  COMPLETE = 'complete',
  
  /** Step completed with warnings */
  WARNING = 'warning',
  
  /** Step failed */
  ERROR = 'error',
  
  /** Step was skipped */
  SKIPPED = 'skipped'
}

/**
 * Additional metadata for a flow step
 */
export interface StepMetadata {
  /** Whether this step is user-interactive (e.g., login screen) */
  isUserInteractive?: boolean;
  
  /** Whether this step involves external redirect */
  isExternalRedirect?: boolean;
  
  /** Related RFC sections */
  rfcReferences?: RFCReference[];
  
  /** Educational notes about this step */
  educationalNotes?: string;
  
  /** Common issues that occur in this step */
  commonIssues?: string[];
}

/**
 * Reference to an RFC specification section
 */
export interface RFCReference {
  /** RFC number (e.g., "6749", "7636") */
  rfcNumber: string;
  
  /** Section within RFC (e.g., "4.1.1", "A.1") */
  section?: string;
  
  /** Brief description of what this section covers */
  description?: string;
  
  /** URL to the RFC section */
  url?: string;
}
```

### 5.3 Authorization Code Flow Types

**File: `src/flows/authorization-code.ts`**

```typescript
/**
 * Authorization request parameters (RFC 6749 §4.1.1)
 */
export interface AuthorizationRequest {
  /** REQUIRED: "code" */
  response_type: 'code';
  
  /** REQUIRED: Client identifier */
  client_id: string;
  
  /** OPTIONAL: Redirection URI */
  redirect_uri?: string;
  
  /** OPTIONAL: Scope of access request */
  scope?: string;
  
  /** RECOMMENDED: Opaque value for CSRF protection */
  state?: string;
  
  /** PKCE: Code challenge (RFC 7636 §4.2) */
  code_challenge?: string;
  
  /** PKCE: Code challenge method ("S256" or "plain") */
  code_challenge_method?: 'S256' | 'plain';
  
  /** OIDC: Nonce for ID token binding */
  nonce?: string;
  
  /** OIDC: Authentication method references */
  acr_values?: string;
  
  /** OIDC: Display preference */
  display?: 'page' | 'popup' | 'touch' | 'wap';
  
  /** OIDC: Prompt preference */
  prompt?: 'none' | 'login' | 'consent' | 'select_account';
  
  /** Additional custom parameters */
  [key: string]: string | undefined;
}

/**
 * Authorization response parameters (RFC 6749 §4.1.2)
 */
export interface AuthorizationResponse {
  /** Authorization code */
  code: string;
  
  /** State parameter (must match request) */
  state?: string;
  
  /** OIDC: Issuer identifier (RFC 9207) */
  iss?: string;
}

/**
 * Authorization error response (RFC 6749 §4.1.2.1)
 */
export interface AuthorizationErrorResponse {
  /** Error code */
  error: AuthorizationErrorCode;
  
  /** Human-readable error description */
  error_description?: string;
  
  /** URI for error information */
  error_uri?: string;
  
  /** State parameter (if provided in request) */
  state?: string;
}

/**
 * Authorization error codes (RFC 6749 §4.1.2.1)
 */
export type AuthorizationErrorCode =
  | 'invalid_request'
  | 'unauthorized_client'
  | 'access_denied'
  | 'unsupported_response_type'
  | 'invalid_scope'
  | 'server_error'
  | 'temporarily_unavailable';

/**
 * Token request parameters (RFC 6749 §4.1.3)
 */
export interface TokenRequest {
  /** REQUIRED: "authorization_code" */
  grant_type: 'authorization_code';
  
  /** REQUIRED: Authorization code */
  code: string;
  
  /** REQUIRED if included in authorization request */
  redirect_uri?: string;
  
  /** REQUIRED for confidential clients */
  client_id: string;
  
  /** REQUIRED for confidential clients (if not using client authentication) */
  client_secret?: string;
  
  /** PKCE: Code verifier (RFC 7636 §4.5) */
  code_verifier?: string;
}
```

### 5.4 Client Credentials Flow Types

**File: `src/flows/client-credentials.ts`**

```typescript
/**
 * Client credentials token request (RFC 6749 §4.4.2)
 * 
 * @remarks
 * ❌ Phase 2 - Not in MVP
 */
export interface ClientCredentialsRequest {
  /** REQUIRED: "client_credentials" */
  grant_type: 'client_credentials';
  
  /** OPTIONAL: Requested scope */
  scope?: string;
  
  /** REQUIRED: Client identifier */
  client_id: string;
  
  /** REQUIRED: Client secret */
  client_secret: string;
}

/**
 * Client credentials flow configuration
 */
export interface ClientCredentialsFlowConfig extends FlowConfig {
  /** Requested scopes */
  scopes: string[];
  
  /** Client authentication method */
  authMethod: ClientAuthMethod;
}

/**
 * Client authentication methods (RFC 6749 §2.3)
 */
export enum ClientAuthMethod {
  /** HTTP Basic authentication */
  CLIENT_SECRET_BASIC = 'client_secret_basic',
  
  /** Include credentials in request body */
  CLIENT_SECRET_POST = 'client_secret_post',
  
  /** JWT assertion (RFC 7523) */
  PRIVATE_KEY_JWT = 'private_key_jwt',
  
  /** No authentication (public client) */
  NONE = 'none'
}
```

### 4.5 Device Authorization Flow Types

**File: `src/flows/device-authorization.ts`**

```typescript
/**
 * Device authorization request (RFC 8628 §3.1)
 */
export interface DeviceAuthorizationRequest {
  /** REQUIRED: Client identifier */
  client_id: string;
  
  /** OPTIONAL: Requested scope */
  scope?: string;
}

/**
 * Device authorization response (RFC 8628 §3.2)
 */
export interface DeviceAuthorizationResponse {
  /** REQUIRED: Device verification code */
  device_code: string;
  
  /** REQUIRED: End-user verification code */
  user_code: string;
  
  /** REQUIRED: Verification URI */
  verification_uri: string;
  
  /** OPTIONAL: Verification URI with user_code */
  verification_uri_complete?: string;
  
  /** REQUIRED: Device code lifetime in seconds */
  expires_in: number;
  
  /** OPTIONAL: Minimum polling interval in seconds */
  interval?: number;
}

/**
 * Device token request (RFC 8628 §3.4)
 */
export interface DeviceTokenRequest {
  /** REQUIRED: "urn:ietf:params:oauth:grant-type:device_code" */
  grant_type: 'urn:ietf:params:oauth:grant-type:device_code';
  
  /** REQUIRED: Device verification code */
  device_code: string;
  
  /** REQUIRED: Client identifier */
  client_id: string;
}

/**
 * Device authorization error codes (RFC 8628 §3.5)
 */
export type DeviceAuthorizationError =
  | 'authorization_pending'
  | 'slow_down'
  | 'access_denied'
  | 'expired_token';
```

### 4.6 Refresh Token Flow Types

**File: `src/flows/refresh-token.ts`**

```typescript
/**
 * Refresh token request (RFC 6749 §6)
 */
export interface RefreshTokenRequest {
  /** REQUIRED: "refresh_token" */
  grant_type: 'refresh_token';
  
  /** REQUIRED: Refresh token */
  refresh_token: string;
  
  /** OPTIONAL: Requested scope (must not exceed original scope) */
  scope?: string;
  
  /** REQUIRED: Client identifier */
  client_id: string;
  
  /** REQUIRED for confidential clients */
  client_secret?: string;
}

/**
 * Refresh token metadata
 */
export interface RefreshTokenMetadata {
  /** Whether refresh token rotation is enabled */
  rotationEnabled: boolean;
  
  /** Whether this is part of a token family */
  tokenFamily?: string;
  
  /** Original access token this refresh token was issued with */
  originalAccessToken?: string;
  
  /** Number of times this refresh token has been used */
  useCount?: number;
  
  /** Maximum allowed uses (if limited) */
  maxUses?: number;
}
```

---

## 5. Token Types

### 5.1 Access Token Types

**File: `src/tokens/access-token.ts`**

```typescript
/**
 * Access token structure
 * 
 * Can be either a JWT (structured) or opaque token (unstructured).
 */
export interface AccessToken {
  /** Raw token string */
  readonly token: string;
  
  /** Token type (typically "Bearer") */
  readonly tokenType: string;
  
  /** Whether this is a JWT or opaque token */
  readonly isJWT: boolean;
  
  /** Decoded JWT payload (if JWT) */
  readonly payload?: AccessTokenPayload;
  
  /** Expiration time in seconds from issuance */
  readonly expiresIn?: number;
  
  /** Absolute expiration timestamp (Unix time) */
  readonly expiresAt?: number;
  
  /** Granted scopes */
  readonly scopes?: string[];
  
  /** Token metadata */
  readonly metadata?: AccessTokenMetadata;
}

/**
 * JWT Access Token Payload (RFC 9068)
 * 
 * @remarks
 * This represents the standardized JWT access token profile from RFC 9068.
 * Legacy/custom implementations may have different claims.
 */
export interface AccessTokenPayload {
  /** REQUIRED: Issuer identifier */
  iss: string;
  
  /** REQUIRED: Subject (usually user ID) */
  sub: string;
  
  /** REQUIRED: Audience (resource server identifier) */
  aud: string | string[];
  
  /** REQUIRED: Expiration time (Unix timestamp) */
  exp: number;
  
  /** REQUIRED: Issued at time (Unix timestamp) */
  iat: number;
  
  /** OPTIONAL: Not before time (Unix timestamp) */
  nbf?: number;
  
  /** REQUIRED: JWT ID (unique identifier) */
  jti?: string;
  
  /** OPTIONAL: Client ID that requested token */
  client_id?: string;
  
  /** OPTIONAL: Authorized scopes (space-separated) */
  scope?: string;
  
  /** OPTIONAL: Authorization details (RFC 9396) */
  authorization_details?: AuthorizationDetail[];
  
  /** Additional custom claims */
  [key: string]: unknown;
}

/**
 * Access token metadata
 */
export interface AccessTokenMetadata {
  /** Whether token is currently valid */
  isValid: boolean;
  
  /** Time remaining until expiration (milliseconds) */
  timeRemaining?: number;
  
  /** Whether token has been revoked */
  isRevoked?: boolean;
  
  /** Token binding type (if bound) */
  binding?: TokenBinding;
  
  /** Token introspection result (if introspected) */
  introspection?: IntrospectionResponse;
}

/**
 * Authorization detail (RFC 9396)
 */
export interface AuthorizationDetail {
  /** REQUIRED: Type of authorization */
  type: string;
  
  /** OPTIONAL: Locations where authorization applies */
  locations?: string[];
  
  /** OPTIONAL: Actions authorized */
  actions?: string[];
  
  /** OPTIONAL: Data types authorized */
  datatypes?: string[];
  
  /** Additional type-specific fields */
  [key: string]: unknown;
}
```

### 5.2 Refresh Token Types

**File: `src/tokens/refresh-token.ts`**

```typescript
/**
 * Refresh token structure
 * 
 * Refresh tokens are typically opaque strings but may be JWTs in some implementations.
 */
export interface RefreshToken {
  /** Raw refresh token string */
  readonly token: string;
  
  /** Whether this is a JWT refresh token */
  readonly isJWT: boolean;
  
  /** Decoded payload (if JWT) */
  readonly payload?: RefreshTokenPayload;
  
  /** Expiration time in seconds (if known) */
  readonly expiresIn?: number;
  
  /** Absolute expiration timestamp (if known) */
  readonly expiresAt?: number;
  
  /** Scopes this refresh token can request */
  readonly scopes?: string[];
  
  /** Refresh token metadata */
  readonly metadata?: RefreshTokenMetadata;
}

/**
 * JWT Refresh Token Payload
 * 
 * @remarks
 * Refresh token payload structure is not standardized. This represents
 * a common implementation pattern.
 */
export interface RefreshTokenPayload {
  /** Issuer */
  iss?: string;
  
  /** Subject (user ID) */
  sub?: string;
  
  /** Client ID */
  client_id?: string;
  
  /** Expiration time */
  exp?: number;
  
  /** Issued at time */
  iat?: number;
  
  /** JWT ID */
  jti?: string;
  
  /** Token family ID (for rotation) */
  family?: string;
  
  /** Authorized scopes */
  scope?: string;
  
  /** Additional claims */
  [key: string]: unknown;
}
```

### 5.3 ID Token Types (OIDC)

**File: `src/tokens/id-token.ts`**

```typescript
/**
 * ID Token structure (OIDC Core §2)
 * 
 * @remarks
 * ID tokens are always JWTs in OIDC. They represent authentication events
 * and contain user identity information.
 */
export interface IDToken {
  /** Raw ID token JWT string */
  readonly token: string;
  
  /** Decoded ID token payload */
  readonly payload: IDTokenPayload;
  
  /** JWT header */
  readonly header: JWTHeader;
  
  /** JWT signature */
  readonly signature: string;
  
  /** ID token metadata */
  readonly metadata?: IDTokenMetadata;
}

/**
 * ID Token Payload (OIDC Core §2)
 * 
 * Contains claims about the authentication event and the authenticated user.
 */
export interface IDTokenPayload {
  /** REQUIRED: Issuer identifier */
  iss: string;
  
  /** REQUIRED: Subject identifier (unique user ID) */
  sub: string;
  
  /** REQUIRED: Audience (client ID) */
  aud: string | string[];
  
  /** REQUIRED: Expiration time (Unix timestamp) */
  exp: number;
  
  /** REQUIRED: Time of token issuance (Unix timestamp) */
  iat: number;
  
  /** OPTIONAL: Time of authentication (Unix timestamp) */
  auth_time?: number;
  
  /** OPTIONAL: Nonce from authentication request */
  nonce?: string;
  
  /** OPTIONAL: Access token hash (for token binding) */
  at_hash?: string;
  
  /** OPTIONAL: Authorization code hash (for hybrid flow) */
  c_hash?: string;
  
  /** OPTIONAL: Authentication Context Class Reference */
  acr?: string;
  
  /** OPTIONAL: Authentication Methods References */
  amr?: string[];
  
  /** OPTIONAL: Authorized party (client ID if different from aud) */
  azp?: string;
  
  /** Standard Claims */
  
  /** User's full name */
  name?: string;
  
  /** User's given/first name */
  given_name?: string;
  
  /** User's surname/last name */
  family_name?: string;
  
  /** User's middle name */
  middle_name?: string;
  
  /** User's casual name/nickname */
  nickname?: string;
  
  /** Username */
  preferred_username?: string;
  
  /** Profile page URL */
  profile?: string;
  
  /** Profile picture URL */
  picture?: string;
  
  /** Web page URL */
  website?: string;
  
  /** Email address */
  email?: string;
  
  /** Email verified flag */
  email_verified?: boolean;
  
  /** Gender */
  gender?: string;
  
  /** Birthdate (YYYY-MM-DD) */
  birthdate?: string;
  
  /** Zoneinfo (e.g., "America/Los_Angeles") */
  zoneinfo?: string;
  
  /** Locale (e.g., "en-US") */
  locale?: string;
  
  /** Phone number */
  phone_number?: string;
  
  /** Phone number verified flag */
  phone_number_verified?: boolean;
  
  /** Address */
  address?: {
    formatted?: string;
    street_address?: string;
    locality?: string;
    region?: string;
    postal_code?: string;
    country?: string;
  };
  
  /** Last update time (Unix timestamp) */
  updated_at?: number;
  
  /** Additional claims */
  [key: string]: unknown;
}

/**
 * ID Token metadata
 */
export interface IDTokenMetadata {
  /** Whether ID token is currently valid */
  isValid: boolean;
  
  /** Validation results */
  validation?: {
    signatureValid: boolean;
    notExpired: boolean;
    issuerValid: boolean;
    audienceValid: boolean;
    nonceValid?: boolean;
    atHashValid?: boolean;
    cHashValid?: boolean;
  };
  
  /** Time remaining until expiration (milliseconds) */
  timeRemaining?: number;
  
  /** Related access token (if available) */
  relatedAccessToken?: string;
}
```

### 5.4 JWT Generic Types

**File: `src/tokens/jwt.ts`**

```typescript
/**
 * Generic JWT structure
 * 
 * Represents any JSON Web Token (RFC 7519)
 */
export interface JWT {
  /** JWT header */
  readonly header: JWTHeader;
  
  /** JWT payload */
  readonly payload: JWTPayload;
  
  /** JWT signature (Base64URL encoded) */
  readonly signature: string;
  
  /** Raw JWT string (header.payload.signature) */
  readonly raw: string;
}

/**
 * JWT Header (RFC 7515 §4)
 */
export interface JWTHeader {
  /** REQUIRED: Algorithm (e.g., "RS256", "HS256", "ES256") */
  alg: string;
  
  /** OPTIONAL: Token type (typically "JWT") */
  typ?: string;
  
  /** OPTIONAL: Content type */
  cty?: string;
  
  /** OPTIONAL: Key ID (for key lookup) */
  kid?: string;
  
  /** OPTIONAL: JWK Set URL */
  jku?: string;
  
  /** OPTIONAL: JSON Web Key */
  jwk?: JsonWebKey;
  
  /** OPTIONAL: X.509 URL */
  x5u?: string;
  
  /** OPTIONAL: X.509 certificate chain */
  x5c?: string[];
  
  /** OPTIONAL: X.509 certificate SHA-1 thumbprint */
  x5t?: string;
  
  /** OPTIONAL: X.509 certificate SHA-256 thumbprint */
  'x5t#S256'?: string;
  
  /** OPTIONAL: Critical headers */
  crit?: string[];
  
  /** Additional header parameters */
  [key: string]: unknown;
}

/**
 * JWT Payload (RFC 7519 §4)
 * 
 * Contains claims about an entity and additional metadata
 */
export interface JWTPayload {
  /** Registered Claims (RFC 7519 §4.1) */
  
  /** Issuer */
  iss?: string;
  
  /** Subject */
  sub?: string;
  
  /** Audience */
  aud?: string | string[];
  
  /** Expiration time (Unix timestamp) */
  exp?: number;
  
  /** Not before time (Unix timestamp) */
  nbf?: number;
  
  /** Issued at time (Unix timestamp) */
  iat?: number;
  
  /** JWT ID */
  jti?: string;
  
  /** Additional claims */
  [key: string]: unknown;
}

/**
 * JSON Web Key (RFC 7517)
 */
export interface JsonWebKey {
  /** Key type (e.g., "RSA", "EC", "oct") */
  kty: string;
  
  /** Public key use (e.g., "sig", "enc") */
  use?: string;
  
  /** Key operations */
  key_ops?: string[];
  
  /** Algorithm */
  alg?: string;
  
  /** Key ID */
  kid?: string;
  
  /** X.509 URL */
  x5u?: string;
  
  /** X.509 certificate chain */
  x5c?: string[];
  
  /** X.509 SHA-1 thumbprint */
  x5t?: string;
  
  /** X.509 SHA-256 thumbprint */
  'x5t#S256'?: string;
  
  /** RSA: Modulus */
  n?: string;
  
  /** RSA: Exponent */
  e?: string;
  
  /** RSA: Private exponent */
  d?: string;
  
  /** EC: Curve */
  crv?: string;
  
  /** EC: X coordinate */
  x?: string;
  
  /** EC: Y coordinate */
  y?: string;
  
  /** Symmetric: Key value */
  k?: string;
  
  /** Additional parameters */
  [key: string]: unknown;
}
```

### 5.5 Token Response Types

**File: `src/tokens/token-response.ts`**

```typescript
/**
 * Token endpoint response (RFC 6749 §5.1)
 * 
 * Successful response from the token endpoint
 */
export interface TokenResponse {
  /** REQUIRED: Access token */
  access_token: string;
  
  /** REQUIRED: Token type (typically "Bearer") */
  token_type: string;
  
  /** RECOMMENDED: Access token lifetime in seconds */
  expires_in?: number;
  
  /** OPTIONAL: Refresh token */
  refresh_token?: string;
  
  /** OPTIONAL: Authorized scope */
  scope?: string;
  
  /** OIDC: ID token (if OpenID scope requested) */
  id_token?: string;
  
  /** Additional response parameters */
  [key: string]: unknown;
}

/**
 * Token error response (RFC 6749 §5.2)
 */
export interface TokenErrorResponse {
  /** REQUIRED: Error code */
  error: TokenErrorCode;
  
  /** OPTIONAL: Human-readable error description */
  error_description?: string;
  
  /** OPTIONAL: URI for error information */
  error_uri?: string;
}

/**
 * Token error codes (RFC 6749 §5.2)
 */
export type TokenErrorCode =
  | 'invalid_request'
  | 'invalid_client'
  | 'invalid_grant'
  | 'unauthorized_client'
  | 'unsupported_grant_type'
  | 'invalid_scope';

/**
 * Token introspection response (RFC 7662 §2.2)
 */
export interface IntrospectionResponse {
  /** REQUIRED: Whether token is active */
  active: boolean;
  
  /** OPTIONAL: Scope (space-separated) */
  scope?: string;
  
  /** OPTIONAL: Client ID */
  client_id?: string;
  
  /** OPTIONAL: Username */
  username?: string;
  
  /** OPTIONAL: Token type */
  token_type?: string;
  
  /** OPTIONAL: Expiration timestamp */
  exp?: number;
  
  /** OPTIONAL: Issued at timestamp */
  iat?: number;
  
  /** OPTIONAL: Not before timestamp */
  nbf?: number;
  
  /** OPTIONAL: Subject */
  sub?: string;
  
  /** OPTIONAL: Audience */
  aud?: string | string[];
  
  /** OPTIONAL: Issuer */
  iss?: string;
  
  /** OPTIONAL: JWT ID */
  jti?: string;
  
  /** Additional claims */
  [key: string]: unknown;
}

/**
 * Token revocation request (RFC 7009 §2.1)
 */
export interface TokenRevocationRequest {
  /** REQUIRED: Token to revoke */
  token: string;
  
  /** OPTIONAL: Token type hint ("access_token" or "refresh_token") */
  token_type_hint?: 'access_token' | 'refresh_token';
  
  /** REQUIRED: Client ID */
  client_id: string;
  
  /** Client secret (if confidential client) */
  client_secret?: string;
}
```

---

## 6. HTTP Communication Types

### 6.1 HTTP Request Types

**File: `src/http/request.ts`**

```typescript
/**
 * HTTP request representation
 * 
 * Captures all information about an HTTP request made during OAuth2/OIDC flows
 */
export interface HttpRequest {
  /** Unique ID for this request */
  readonly id: string;
  
  /** HTTP method */
  readonly method: HttpMethod;
  
  /** Full URL including query parameters */
  readonly url: string;
  
  /** Request headers */
  readonly headers: HttpHeaders;
  
  /** Request body (if applicable) */
  readonly body?: HttpRequestBody;
  
  /** Timestamp when request was sent (ISO 8601) */
  readonly sentAt: string;
  
  /** Request duration in milliseconds (if completed) */
  duration?: number;
  
  /** cURL equivalent of this request */
  readonly curlCommand?: string;
}

/**
 * HTTP methods
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  OPTIONS = 'OPTIONS',
  HEAD = 'HEAD'
}

/**
 * HTTP request body
 * 
 * Can be form-encoded, JSON, or other content types
 */
export type HttpRequestBody =
  | FormEncodedBody
  | JsonBody
  | TextBody
  | BinaryBody;

/**
 * Form-encoded request body (application/x-www-form-urlencoded)
 */
export interface FormEncodedBody {
  type: 'form';
  parameters: Record<string, string>;
  raw: string;
}

/**
 * JSON request body (application/json)
 */
export interface JsonBody {
  type: 'json';
  data: unknown;
  raw: string;
}

/**
 * Plain text request body
 */
export interface TextBody {
  type: 'text';
  content: string;
}

/**
 * Binary request body
 */
export interface BinaryBody {
  type: 'binary';
  data: ArrayBuffer;
  contentType: string;
}
```

### 6.2 HTTP Response Types

**File: `src/http/response.ts`**

```typescript
/**
 * HTTP response representation
 */
export interface HttpResponse {
  /** Unique ID for this response */
  readonly id: string;
  
  /** Corresponding request ID */
  readonly requestId: string;
  
  /** HTTP status code */
  readonly statusCode: number;
  
  /** HTTP status text (e.g., "OK", "Bad Request") */
  readonly statusText: string;
  
  /** Response headers */
  readonly headers: HttpHeaders;
  
  /** Response body */
  readonly body?: HttpResponseBody;
  
  /** Timestamp when response was received (ISO 8601) */
  readonly receivedAt: string;
  
  /** Response size in bytes */
  readonly size?: number;
}

/**
 * HTTP response body
 */
export type HttpResponseBody =
  | JsonResponseBody
  | TextResponseBody
  | HtmlResponseBody
  | BinaryResponseBody;

/**
 * JSON response body
 */
export interface JsonResponseBody {
  type: 'json';
  data: unknown;
  raw: string;
}

/**
 * Plain text response body
 */
export interface TextResponseBody {
  type: 'text';
  content: string;
}

/**
 * HTML response body
 */
export interface HtmlResponseBody {
  type: 'html';
  html: string;
}

/**
 * Binary response body
 */
export interface BinaryResponseBody {
  type: 'binary';
  data: ArrayBuffer;
  contentType: string;
}

/**
 * HTTP status code categories
 */
export enum HttpStatusCategory {
  INFORMATIONAL = '1xx',
  SUCCESS = '2xx',
  REDIRECTION = '3xx',
  CLIENT_ERROR = '4xx',
  SERVER_ERROR = '5xx'
}

/**
 * Get status category from status code
 */
export function getStatusCategory(statusCode: number): HttpStatusCategory {
  if (statusCode >= 100 && statusCode < 200) return HttpStatusCategory.INFORMATIONAL;
  if (statusCode >= 200 && statusCode < 300) return HttpStatusCategory.SUCCESS;
  if (statusCode >= 300 && statusCode < 400) return HttpStatusCategory.REDIRECTION;
  if (statusCode >= 400 && statusCode < 500) return HttpStatusCategory.CLIENT_ERROR;
  return HttpStatusCategory.SERVER_ERROR;
}
```

### 6.3 HTTP Headers Types

**File: `src/http/headers.ts`**

```typescript
/**
 * HTTP headers
 * 
 * Case-insensitive header name to value mapping
 */
export type HttpHeaders = Record<string, string | string[]>;

/**
 * Common HTTP header names
 */
export const CommonHeaders = {
  // Request headers
  AUTHORIZATION: 'Authorization',
  CONTENT_TYPE: 'Content-Type',
  ACCEPT: 'Accept',
  USER_AGENT: 'User-Agent',
  REFERER: 'Referer',
  ORIGIN: 'Origin',
  
  // Response headers
  CONTENT_LENGTH: 'Content-Length',
  CACHE_CONTROL: 'Cache-Control',
  SET_COOKIE: 'Set-Cookie',
  LOCATION: 'Location',
  WWW_AUTHENTICATE: 'WWW-Authenticate',
  
  // Security headers
  STRICT_TRANSPORT_SECURITY: 'Strict-Transport-Security',
  X_FRAME_OPTIONS: 'X-Frame-Options',
  X_CONTENT_TYPE_OPTIONS: 'X-Content-Type-Options',
  CONTENT_SECURITY_POLICY: 'Content-Security-Policy',
  
  // CORS headers
  ACCESS_CONTROL_ALLOW_ORIGIN: 'Access-Control-Allow-Origin',
  ACCESS_CONTROL_ALLOW_METHODS: 'Access-Control-Allow-Methods',
  ACCESS_CONTROL_ALLOW_HEADERS: 'Access-Control-Allow-Headers',
  ACCESS_CONTROL_ALLOW_CREDENTIALS: 'Access-Control-Allow-Credentials'
} as const;

/**
 * Content types
 */
export const ContentTypes = {
  JSON: 'application/json',
  FORM_URLENCODED: 'application/x-www-form-urlencoded',
  HTML: 'text/html',
  PLAIN_TEXT: 'text/plain',
  JWT: 'application/jwt',
  JOSE: 'application/jose'
} as const;
```

---

## 7. Security Types

### 7.1 PKCE Types

**File: `src/security/pkce.ts`**

```typescript
/**
 * PKCE parameters (RFC 7636)
 */
export interface PKCEParams {
  /** Code verifier (43-128 character random string) */
  readonly codeVerifier: string;
  
  /** Code challenge (derived from verifier) */
  readonly codeChallenge: string;
  
  /** Code challenge method ("S256" or "plain") */
  readonly codeChallengeMethod: 'S256' | 'plain';
  
  /** Timestamp when PKCE params were generated */
  readonly generatedAt: string;
}

/**
 * PKCE validation result
 */
export interface PKCEValidationResult {
  /** Whether PKCE validation passed */
  valid: boolean;
  
  /** Code verifier used */
  codeVerifier?: string;
  
  /** Expected code challenge */
  expectedChallenge?: string;
  
  /** Received code challenge */
  receivedChallenge?: string;
  
  /** Challenge method used */
  method?: 'S256' | 'plain';
  
  /** Validation error (if failed) */
  error?: string;
}
```

### 7.2 State Parameter Types

**File: `src/security/state.ts`**

```typescript
/**
 * State parameter for CSRF protection (RFC 6749 §10.12)
 */
export interface StateParam {
  /** State value (random string) */
  readonly value: string;
  
  /** Timestamp when state was generated */
  readonly generatedAt: string;
  
  /** When state expires (ISO 8601) */
  readonly expiresAt?: string;
  
  /** Associated flow ID */
  readonly flowId?: string;
  
  /** Whether state has been used */
  used: boolean;
}

/**
 * State validation result
 */
export interface StateValidationResult {
  /** Whether state validation passed */
  valid: boolean;
  
  /** Expected state value */
  expected?: string;
  
  /** Received state value */
  received?: string;
  
  /** Whether state is expired */
  isExpired?: boolean;
  
  /** Whether state was already used */
  wasAlreadyUsed?: boolean;
  
  /** Validation error (if failed) */
  error?: string;
}
```

### 7.3 Nonce Types (OIDC)

**File: `src/security/nonce.ts`**

```typescript
/**
 * Nonce parameter for ID token replay protection (OIDC Core §3.1.2.1)
 */
export interface NonceParam {
  /** Nonce value (random string) */
  readonly value: string;
  
  /** Timestamp when nonce was generated */
  readonly generatedAt: string;
  
  /** When nonce expires */
  readonly expiresAt?: string;
  
  /** Associated flow ID */
  readonly flowId?: string;
  
  /** Whether nonce has been used */
  used: boolean;
}

/**
 * Nonce validation result
 */
export interface NonceValidationResult {
  /** Whether nonce validation passed */
  valid: boolean;
  
  /** Expected nonce value */
  expected?: string;
  
  /** Received nonce value (from ID token) */
  received?: string;
  
  /** Whether nonce is expired */
  isExpired?: boolean;
  
  /** Whether nonce was already used */
  wasAlreadyUsed?: boolean;
  
  /** Validation error (if failed) */
  error?: string;
}
```

### 7.4 Security Assessment Types

**File: `src/security/security-assessment.ts`**

```typescript
/**
 * Comprehensive security assessment for a flow execution
 */
export interface SecurityAssessment {
  /** Overall security score (0-100) */
  readonly score: number;
  
  /** Security level categorization */
  readonly level: SecurityLevel;
  
  /** Individual security checks */
  readonly checks: SecurityCheck[];
  
  /** Security indicators for display */
  readonly indicators: SecurityIndicator[];
  
  /** Security warnings */
  readonly warnings: SecurityWarning[];
  
  /** Security recommendations */
  readonly recommendations: string[];
  
  /** Timestamp of assessment */
  readonly assessedAt: string;
}

/**
 * Security level categories
 */
export enum SecurityLevel {
  /** Excellent security (score 90-100) */
  EXCELLENT = 'excellent',
  
  /** Good security (score 70-89) */
  GOOD = 'good',
  
  /** Adequate security (score 50-69) */
  ADEQUATE = 'adequate',
  
  /** Weak security (score 30-49) */
  WEAK = 'weak',
  
  /** Poor security (score 0-29) */
  POOR = 'poor'
}

/**
 * Individual security check
 */
export interface SecurityCheck {
  /** Unique check identifier */
  readonly id: string;
  
  /** Human-readable check name */
  readonly name: string;
  
  /** Check result status */
  readonly status: SecurityCheckStatus;
  
  /** Detailed description */
  readonly description: string;
  
  /** Related RFC section */
  readonly rfcReference?: RFCReference;
  
  /** Points awarded (if passed) */
  readonly points: number;
  
  /** Maximum possible points */
  readonly maxPoints: number;
  
  /** Severity if check fails */
  readonly severity: SecuritySeverity;
}

/**
 * Security check status
 */
export enum SecurityCheckStatus {
  /** Check passed */
  PASS = 'pass',
  
  /** Check failed */
  FAIL = 'fail',
  
  /** Check passed with warnings */
  WARN = 'warn',
  
  /** Check not applicable */
  NA = 'na',
  
  /** Check was skipped */
  SKIP = 'skip'
}

/**
 * Security severity levels
 */
export enum SecuritySeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

/**
 * Security warning
 */
export interface SecurityWarning {
  /** Warning severity */
  readonly severity: SecuritySeverity;
  
  /** Warning message */
  readonly message: string;
  
  /** Which check triggered warning */
  readonly checkId?: string;
  
  /** Remediation steps */
  readonly remediation?: string;
  
  /** Related documentation */
  readonly documentation?: string;
}
```

### 7.5 Security Indicators

**File: `src/security/security-indicators.ts`**

```typescript
/**
 * Security indicator badge for UI display
 */
export interface SecurityIndicator {
  /** Indicator type */
  readonly type: SecurityIndicatorType;
  
  /** Display label */
  readonly label: string;
  
  /** Current status */
  readonly status: SecurityIndicatorStatus;
  
  /** Tooltip/explanation */
  readonly tooltip: string;
  
  /** Badge color/style */
  readonly variant: SecurityIndicatorVariant;
  
  /** Related vulnerability toggle (if applicable) */
  readonly relatedToggle?: string;
}

/**
 * Security indicator types
 */
export enum SecurityIndicatorType {
  PKCE = 'pkce',
  STATE = 'state',
  NONCE = 'nonce',
  HTTPS = 'https',
  JWT_SIGNATURE = 'jwt_signature',
  TOKEN_BINDING = 'token_binding',
  CLIENT_AUTH = 'client_auth',
  REFRESH_ROTATION = 'refresh_rotation',
  TOKEN_STORAGE = 'token_storage',
  REDIRECT_URI = 'redirect_uri'
}

/**
 * Security indicator status
 */
export enum SecurityIndicatorStatus {
  /** Security control is active and working */
  ENABLED = 'enabled',
  
  /** Security control is disabled */
  DISABLED = 'disabled',
  
  /** Security control is present but weak */
  WEAK = 'weak',
  
  /** Security control is not applicable */
  NOT_APPLICABLE = 'not_applicable',
  
  /** Security control status is unknown */
  UNKNOWN = 'unknown'
}

/**
 * Security indicator display variant
 */
export enum SecurityIndicatorVariant {
  SUCCESS = 'success',
  WARNING = 'warning',
  DANGER = 'danger',
  INFO = 'info',
  NEUTRAL = 'neutral'
}
```

### 7.6 Token Binding Types

**File: `src/security/token-binding.ts`**

```typescript
/**
 * Token binding type (RFC 8705, RFC 9449)
 */
export enum TokenBindingType {
  /** No token binding */
  NONE = 'none',
  
  /** DPoP proof (RFC 9449) */
  DPOP = 'dpop',
  
  /** mTLS certificate binding (RFC 8705) */
  MTLS = 'mtls'
}

/**
 * Token binding information
 */
export interface TokenBinding {
  /** Binding type */
  readonly type: TokenBindingType;
  
  /** DPoP proof (if DPoP binding) */
  readonly dpopProof?: DPoPProof;
  
  /** Certificate thumbprint (if mTLS binding) */
  readonly certificateThumbprint?: string;
  
  /** Whether binding is valid */
  isValid: boolean;
}

/**
 * DPoP proof structure (RFC 9449 §4)
 */
export interface DPoPProof {
  /** DPoP proof JWT */
  readonly jwt: string;
  
  /** Decoded DPoP proof header */
  readonly header: {
    typ: 'dpop+jwt';
    alg: string;
    jwk: JsonWebKey;
  };
  
  /** Decoded DPoP proof payload */
  readonly payload: {
    jti: string;
    htm: string;
    htu: string;
    iat: number;
    ath?: string;
    nonce?: string;
  };
}
```

---

## 8. Vulnerability Mode Types

### 8.1 Vulnerability Configuration

**File: `src/vulnerability/vulnerability-config.ts`**

```typescript
/**
 * Complete vulnerability mode configuration
 * 
 * Controls which security protections are intentionally disabled
 * for educational demonstrations.
 * 
 * @remarks
 * **MVP SCOPE:** Only DISABLE_PKCE toggle is functional in MVP.
 * All other toggles are defined but not implemented until Phase 2-3.
 * This allows the type system to be complete while implementation
 * proceeds incrementally.
 * 
 * **MVP Implementation:** DISABLE_PKCE only
 * **Phase 2:** Add 10-15 additional toggles
 * **Phase 3:** Complete all 39 toggles
 */
export interface VulnerabilityConfig {
  /** Master toggle - whether vulnerability mode is enabled */
  enabled: boolean;
  
  /** Individual vulnerability toggles */
  toggles: VulnerabilityToggles;
  
  /** Whether user has accepted educational disclaimer */
  acceptedDisclaimer: boolean;
  
  /** Timestamp of last modification */
  lastModified: string;
  
  /** Optional description/notes */
  notes?: string;
}

/**
 * All individual vulnerability toggles
 * 
 * When a toggle is TRUE, that vulnerability is ACTIVE (protection disabled).
 * When a toggle is FALSE, the system is SECURE (protection enabled).
 * 
 * @remarks
 * **MVP:** Only DISABLE_PKCE is functional
 * **Phase 2-3:** Remaining toggles will be implemented incrementally
 */
export interface VulnerabilityToggles {
  // ===================================================================
  // Authorization Endpoint (9 toggles)
  // ===================================================================
  
  /** ✅ MVP - Disable PKCE (RFC 7636) - allows code interception */
  DISABLE_PKCE: boolean;
  
  /** ❌ Phase 2 - Skip state parameter validation - allows CSRF attacks */
  SKIP_STATE_VALIDATION: boolean;
  
  /** ❌ Phase 2 - Use predictable state values - weak CSRF protection */
  PREDICTABLE_STATE: boolean;
  
  /** ❌ Phase 2 - Lax redirect URI validation - allows open redirect */
  LAX_REDIRECT_URI: boolean;
  
  /** ❌ Phase 2 - Pattern-matching redirect URI - allows URI bypass */
  PATTERN_MATCHING_URI: boolean;
  
  /** ❌ Phase 2 - Allow iframe embedding - allows clickjacking */
  ALLOW_IFRAME: boolean;
  
  /** ❌ Phase 2 - Use HTTP for authorization endpoint - allows network interception */
  HTTP_AUTHORIZATION_ENDPOINT: boolean;
  
  /** ❌ Phase 2 - Disable issuer check (iss parameter) - allows mix-up attacks */
  DISABLE_ISS_CHECK: boolean;
  
  /** ❌ Phase 2 - Allow PKCE downgrade to plain - weakens PKCE protection */
  PKCE_DOWNGRADE: boolean;
  
  // ===================================================================
  // Token Endpoint (5 toggles) - ❌ All Phase 2
  // ===================================================================
  
  /** Skip client authentication - allows client impersonation */
  SKIP_CLIENT_AUTH: boolean;
  
  /** Use weak client secret - allows secret compromise */
  WEAK_CLIENT_SECRET: boolean;
  
  /** Allow authorization code reuse - allows code replay */
  REUSABLE_AUTH_CODE: boolean;
  
  /** Allow scope escalation - allows privilege escalation */
  ALLOW_SCOPE_ESCALATION: boolean;
  
  /** Use HTTP for token endpoint - allows network interception */
  HTTP_TOKEN_ENDPOINT: boolean;
  
  // ===================================================================
  // Token Validation (9 toggles) - ❌ All Phase 2-3
  // ===================================================================
  
  /** Skip JWT signature verification - allows token forgery */
  SKIP_JWT_VERIFICATION: boolean;
  
  /** Accept "none" algorithm JWTs - critical vulnerability */
  ACCEPT_NONE_ALGORITHM: boolean;
  
  /** Flexible algorithm (RS256 -> HS256) - algorithm confusion */
  FLEXIBLE_JWT_ALGORITHM: boolean;
  
  /** Skip token expiration check - allows expired token use */
  SKIP_EXPIRATION_CHECK: boolean;
  
  /** Skip audience check - allows token misuse */
  SKIP_AUD_CHECK: boolean;
  
  /** Skip issuer check - allows token from wrong issuer */
  SKIP_ISS_CHECK: boolean;
  
  /** Skip nonce validation (OIDC) - allows ID token replay */
  SKIP_NONCE: boolean;
  
  /** Skip at_hash validation (OIDC) - allows token substitution */
  SKIP_AT_HASH: boolean;
  
  /** Skip all hash validation (at_hash, c_hash) */
  SKIP_HASH_VALIDATION: boolean;
  
  // ===================================================================
  // Token Storage (3 toggles) - ❌ All Phase 2-3
  // ===================================================================
  
  /** Store tokens in localStorage - allows XSS theft */
  LOCALSTORAGE_TOKENS: boolean;
  
  /** Store refresh token insecurely - allows token theft */
  INSECURE_REFRESH_STORAGE: boolean;
  
  /** Allow token export/copy - allows token leakage */
  ALLOW_TOKEN_EXPORT: boolean;
  
  // ===================================================================
  // Token Transmission (3 toggles) - ❌ All Phase 2-3
  // ===================================================================
  
  /** Allow tokens in URL - allows token leakage via logs */
  ALLOW_TOKEN_IN_URL: boolean;
  
  /** Use HTTP for resource server - allows token interception */
  HTTP_RESOURCE_SERVER: boolean;
  
  /** Allow tokens in URL fragment - allows referrer leakage */
  ALLOW_FRAGMENT_TOKENS: boolean;
  
  // ===================================================================
  // Refresh Token (3 toggles) - ❌ All Phase 2
  // ===================================================================
  
  /** Allow refresh token reuse - allows token replay */
  REUSABLE_REFRESH_TOKENS: boolean;
  
  /** Infinite refresh token lifetime - never expires */
  INFINITE_REFRESH_LIFETIME: boolean;
  
  /** Skip refresh token rotation - allows token theft */
  SKIP_REFRESH_ROTATION: boolean;
  
  // ===================================================================
  // Flow-Specific (3 toggles) - ❌ All Phase 2-3
  // ===================================================================
  
  /** Enable implicit flow (DEPRECATED) */
  IMPLICIT_FLOW: boolean;
  
  /** Enable password grant (DEPRECATED) */
  PASSWORD_GRANT: boolean;
  
  /** Log credentials in debug output - exposes secrets */
  LOG_CREDENTIALS: boolean;
  
  // ===================================================================
  // Other (4 toggles) - ❌ All Phase 2-3
  // ===================================================================
  
  /** Disable rate limiting - allows brute force */
  NO_RATE_LIMITING: boolean;
  
  /** Skip certificate validation - allows MITM */
  SKIP_CERT_VALIDATION: boolean;
  
  /** Allow client-side open redirect - phishing risk */
  CLIENT_OPEN_REDIRECT: boolean;
  
  /** Verbose error messages - information disclosure */
  VERBOSE_ERROR_MESSAGES: boolean;
}

/**
 * Default secure configuration (all protections enabled)
 */
export const SECURE_DEFAULTS: VulnerabilityConfig = {
  enabled: false,
  toggles: {
    DISABLE_PKCE: false,
    SKIP_STATE_VALIDATION: false,
    PREDICTABLE_STATE: false,
    LAX_REDIRECT_URI: false,
    PATTERN_MATCHING_URI: false,
    ALLOW_IFRAME: false,
    HTTP_AUTHORIZATION_ENDPOINT: false,
    DISABLE_ISS_CHECK: false,
    PKCE_DOWNGRADE: false,
    SKIP_CLIENT_AUTH: false,
    WEAK_CLIENT_SECRET: false,
    REUSABLE_AUTH_CODE: false,
    ALLOW_SCOPE_ESCALATION: false,
    HTTP_TOKEN_ENDPOINT: false,
    SKIP_JWT_VERIFICATION: false,
    ACCEPT_NONE_ALGORITHM: false,
    FLEXIBLE_JWT_ALGORITHM: false,
    SKIP_EXPIRATION_CHECK: false,
    SKIP_AUD_CHECK: false,
    SKIP_ISS_CHECK: false,
    SKIP_NONCE: false,
    SKIP_AT_HASH: false,
    SKIP_HASH_VALIDATION: false,
    LOCALSTORAGE_TOKENS: false,
    INSECURE_REFRESH_STORAGE: false,
    ALLOW_TOKEN_EXPORT: false,
    ALLOW_TOKEN_IN_URL: false,
    HTTP_RESOURCE_SERVER: false,
    ALLOW_FRAGMENT_TOKENS: false,
    REUSABLE_REFRESH_TOKENS: false,
    INFINITE_REFRESH_LIFETIME: false,
    SKIP_REFRESH_ROTATION: false,
    IMPLICIT_FLOW: false,
    PASSWORD_GRANT: false,
    LOG_CREDENTIALS: false,
    NO_RATE_LIMITING: false,
    SKIP_CERT_VALIDATION: false,
    CLIENT_OPEN_REDIRECT: false,
    VERBOSE_ERROR_MESSAGES: false
  },
  acceptedDisclaimer: false,
  lastModified: new Date().toISOString()
};
```

### 8.2 Vulnerability Toggle Metadata

**File: `src/vulnerability/vulnerability-toggle.ts`**

```typescript
/**
 * Metadata for a vulnerability toggle
 */
export interface VulnerabilityToggleMetadata {
  /** Toggle identifier (matches key in VulnerabilityToggles) */
  readonly id: keyof VulnerabilityToggles;
  
  /** Category */
  readonly category: VulnerabilityCategory;
  
  /** Human-readable name */
  readonly name: string;
  
  /** Detailed description */
  readonly description: string;
  
  /** Attack enabled by this vulnerability */
  readonly attackType: string;
  
  /** Severity level */
  readonly severity: SecuritySeverity;
  
  /** Related RFC sections */
  readonly rfcReferences: RFCReference[];
  
  /** Related documentation files */
  readonly relatedDocs: string[];
  
  /** Educational explanation */
  readonly educationalContent: string;
  
  /** How to demonstrate this vulnerability */
  readonly demonstrationSteps: string[];
  
  /** How to mitigate this vulnerability */
  readonly mitigation: string;
}

/**
 * Vulnerability toggle with current state
 */
export interface VulnerabilityToggleState extends VulnerabilityToggleMetadata {
  /** Whether this vulnerability is currently active */
  enabled: boolean;
  
  /** When it was last toggled */
  lastToggledAt?: string;
}
```

### 8.3 Vulnerability Categories

**File: `src/vulnerability/vulnerability-category.ts`**

```typescript
/**
 * Vulnerability toggle categories
 */
export enum VulnerabilityCategory {
  /** Authorization endpoint vulnerabilities */
  AUTHORIZATION = 'authorization',
  
  /** Token endpoint vulnerabilities */
  TOKEN_ENDPOINT = 'token_endpoint',
  
  /** Token validation vulnerabilities */
  TOKEN_VALIDATION = 'token_validation',
  
  /** Token storage vulnerabilities */
  TOKEN_STORAGE = 'token_storage',
  
  /** Token transmission vulnerabilities */
  TOKEN_TRANSMISSION = 'token_transmission',
  
  /** Refresh token vulnerabilities */
  REFRESH_TOKEN = 'refresh_token',
  
  /** Flow-specific vulnerabilities */
  FLOW_SPECIFIC = 'flow_specific',
  
  /** Other vulnerabilities */
  OTHER = 'other'
}

/**
 * Category display information
 */
export interface VulnerabilityCategoryInfo {
  /** Category enum value */
  readonly category: VulnerabilityCategory;
  
  /** Display name */
  readonly name: string;
  
  /** Description */
  readonly description: string;
  
  /** Icon */
  readonly icon: string;
  
  /** Number of toggles in this category */
  toggleCount: number;
}
```

---

## 9. Configuration Types

### 9.1 Client Configuration

**File: `src/config/client-config.ts`**

```typescript
/**
 * OAuth2/OIDC client configuration
 */
export interface ClientConfig {
  /** Client identifier (RFC 6749 §2.2) */
  clientId: string;
  
  /** Client secret (for confidential clients) */
  clientSecret?: string;
  
  /** Client type */
  clientType: ClientType;
  
  /** Redirect URIs */
  redirectUris: string[];
  
  /** Default redirect URI */
  defaultRedirectUri?: string;
  
  /** Requested scopes */
  scopes: string[];
  
  /** Response type (e.g., "code", "token") */
  responseType: ResponseType;
  
  /** Grant types supported */
  grantTypes: GrantType[];
  
  /** Client authentication method */
  authMethod: ClientAuthMethod;
  
  /** Token endpoint authentication method */
  tokenEndpointAuthMethod?: TokenEndpointAuthMethod;
  
  /** Application name */
  applicationName?: string;
  
  /** Application description */
  applicationDescription?: string;
  
  /** Logo URI */
  logoUri?: string;
  
  /** Policy URI */
  policyUri?: string;
  
  /** Terms of service URI */
  tosUri?: string;
  
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Client types (RFC 6749 §2.1)
 */
export enum ClientType {
  /** Confidential client (can securely store credentials) */
  CONFIDENTIAL = 'confidential',
  
  /** Public client (cannot securely store credentials) */
  PUBLIC = 'public'
}

/**
 * OAuth2 response types
 */
export type ResponseType =
  | 'code'
  | 'token'
  | 'id_token'
  | 'code token'
  | 'code id_token'
  | 'id_token token'
  | 'code id_token token';

/**
 * OAuth2 grant types (RFC 6749 §1.3)
 */
export type GrantType =
  | 'authorization_code'
  | 'implicit'
  | 'password'
  | 'client_credentials'
  | 'refresh_token'
  | 'urn:ietf:params:oauth:grant-type:device_code'
  | 'urn:ietf:params:oauth:grant-type:jwt-bearer';

/**
 * Token endpoint authentication methods (RFC 7591 §2)
 */
export type TokenEndpointAuthMethod =
  | 'none'
  | 'client_secret_post'
  | 'client_secret_basic'
  | 'client_secret_jwt'
  | 'private_key_jwt'
  | 'tls_client_auth'
  | 'self_signed_tls_client_auth';
```

### 9.2 Server Configuration

**File: `src/config/server-config.ts`**

```typescript
/**
 * Authorization server configuration
 */
export interface ServerConfig {
  /** Issuer identifier URL */
  issuer: string;
  
  /** Authorization endpoint URL */
  authorizationEndpoint: string;
  
  /** Token endpoint URL */
  tokenEndpoint: string;
  
  /** Revocation endpoint URL (optional) */
  revocationEndpoint?: string;
  
  /** Introspection endpoint URL (optional) */
  introspectionEndpoint?: string;
  
  /** UserInfo endpoint URL (OIDC) */
  userinfoEndpoint?: string;
  
  /** JWKS URI */
  jwksUri?: string;
  
  /** Registration endpoint URL (optional) */
  registrationEndpoint?: string;
  
  /** Device authorization endpoint (RFC 8628) */
  deviceAuthorizationEndpoint?: string;
  
  /** Pushed authorization request endpoint (RFC 9126) */
  parEndpoint?: string;
  
  /** Supported scopes */
  scopesSupported?: string[];
  
  /** Supported response types */
  responseTypesSupported?: string[];
  
  /** Supported grant types */
  grantTypesSupported?: string[];
  
  /** Supported token endpoint auth methods */
  tokenEndpointAuthMethodsSupported?: string[];
  
  /** Supported claims (OIDC) */
  claimsSupported?: string[];
  
  /** Code challenge methods supported (PKCE) */
  codeChallengeMethodsSupported?: string[];
  
  /** Whether PKCE is required */
  pkceRequired?: boolean;
  
  /** Server metadata */
  metadata?: OAuthServerMetadata;
}

/**
 * OAuth 2.0 Authorization Server Metadata (RFC 8414)
 */
export interface OAuthServerMetadata {
  /** REQUIRED: Authorization server issuer */
  issuer: string;
  
  /** Authorization endpoint URL */
  authorization_endpoint?: string;
  
  /** Token endpoint URL */
  token_endpoint?: string;
  
  /** JWKS URI */
  jwks_uri?: string;
  
  /** Registration endpoint */
  registration_endpoint?: string;
  
  /** Scopes supported */
  scopes_supported?: string[];
  
  /** Response types supported */
  response_types_supported: string[];
  
  /** Response modes supported */
  response_modes_supported?: string[];
  
  /** Grant types supported */
  grant_types_supported?: string[];
  
  /** Token endpoint auth methods */
  token_endpoint_auth_methods_supported?: string[];
  
  /** Token endpoint auth signing algs */
  token_endpoint_auth_signing_alg_values_supported?: string[];
  
  /** Service documentation URL */
  service_documentation?: string;
  
  /** UI locales supported */
  ui_locales_supported?: string[];
  
  /** Policy URI */
  op_policy_uri?: string;
  
  /** Terms of service URI */
  op_tos_uri?: string;
  
  /** Revocation endpoint */
  revocation_endpoint?: string;
  
  /** Introspection endpoint */
  introspection_endpoint?: string;
  
  /** Code challenge methods */
  code_challenge_methods_supported?: string[];
  
  /** Additional metadata */
  [key: string]: unknown;
}
```

### 9.3 Application Configuration

**File: `src/config/app-config.ts`**

```typescript
/**
 * Application-level configuration
 */
export interface AppConfig {
  /** Application version */
  version: string;
  
  /** Environment */
  environment: Environment;
  
  /** API configuration */
  api: APIConfig;
  
  /** UI preferences */
  ui: UIPreferences;
  
  /** Logging configuration */
  logging: LoggingConfig;
  
  /** Feature flags */
  features: FeatureFlags;
}

/**
 * Environment
 */
export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production'
}

/**
 * API configuration
 */
export interface APIConfig {
  /** Backend base URL */
  baseUrl: string;
  
  /** Request timeout (milliseconds) */
  timeout: number;
  
  /** Retry configuration */
  retry: {
    enabled: boolean;
    maxRetries: number;
    backoff: 'linear' | 'exponential';
  };
}

/**
 * UI preferences
 */
export interface UIPreferences {
  /** Theme */
  theme: 'light' | 'dark' | 'auto';
  
  /** Default view mode */
  defaultView: ViewMode;
  
  /** Show educational content */
  showEducationalContent: boolean;
  
  /** Auto-expand flow steps */
  autoExpandSteps: boolean;
  
  /** Syntax highlighting theme */
  syntaxTheme: string;
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  /** Log level */
  level: LogLevel;
  
  /** Enable console logging */
  console: boolean;
  
  /** Enable remote logging */
  remote: boolean;
  
  /** Remote logging endpoint */
  remoteEndpoint?: string;
}

/**
 * Log levels
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace'
}

/**
 * Feature flags
 */
export interface FeatureFlags {
  /** Enable vulnerability mode */
  vulnerabilityMode: boolean;
  
  /** Enable comparison view */
  comparisonView: boolean;
  
  /** Enable export functionality */
  exportFunctionality: boolean;
  
  /** Enable external IdP support */
  externalIdP: boolean;
  
  /** Enable advanced visualizations */
  advancedVisualizations: boolean;
}
```

---

## 10. Discovery & Metadata Types

### 10.1 OIDC Discovery

**File: `src/discovery/oidc-discovery.ts`**

```typescript
/**
 * OIDC Discovery Document (OIDC Discovery §3)
 */
export interface OIDCDiscoveryDocument extends OAuthServerMetadata {
  /** REQUIRED: Issuer identifier */
  issuer: string;
  
  /** REQUIRED: Authorization endpoint */
  authorization_endpoint: string;
  
  /** Token endpoint */
  token_endpoint?: string;
  
  /** REQUIRED: UserInfo endpoint */
  userinfo_endpoint?: string;
  
  /** REQUIRED: JWKS URI */
  jwks_uri: string;
  
  /** Registration endpoint */
  registration_endpoint?: string;
  
  /** RECOMMENDED: Scopes supported */
  scopes_supported?: string[];
  
  /** REQUIRED: Response types supported */
  response_types_supported: string[];
  
  /** Response modes supported */
  response_modes_supported?: ('query' | 'fragment' | 'form_post')[];
  
  /** Grant types supported */
  grant_types_supported?: string[];
  
  /** ACR values supported */
  acr_values_supported?: string[];
  
  /** REQUIRED: Subject types supported */
  subject_types_supported: ('public' | 'pairwise')[];
  
  /** REQUIRED: ID token signing algorithms */
  id_token_signing_alg_values_supported: string[];
  
  /** ID token encryption algorithms */
  id_token_encryption_alg_values_supported?: string[];
  
  /** ID token encryption encoding */
  id_token_encryption_enc_values_supported?: string[];
  
  /** UserInfo signing algorithms */
  userinfo_signing_alg_values_supported?: string[];
  
  /** UserInfo encryption algorithms */
  userinfo_encryption_alg_values_supported?: string[];
  
  /** Request object signing algorithms */
  request_object_signing_alg_values_supported?: string[];
  
  /** Request object encryption algorithms */
  request_object_encryption_alg_values_supported?: string[];
  
  /** Token endpoint auth methods */
  token_endpoint_auth_methods_supported?: string[];
  
  /** Token endpoint signing algorithms */
  token_endpoint_auth_signing_alg_values_supported?: string[];
  
  /** Display values supported */
  display_values_supported?: ('page' | 'popup' | 'touch' | 'wap')[];
  
  /** Claim types supported */
  claim_types_supported?: ('normal' | 'aggregated' | 'distributed')[];
  
  /** RECOMMENDED: Claims supported */
  claims_supported?: string[];
  
  /** Service documentation */
  service_documentation?: string;
  
  /** Claims locales supported */
  claims_locales_supported?: string[];
  
  /** UI locales supported */
  ui_locales_supported?: string[];
  
  /** Claims parameter supported */
  claims_parameter_supported?: boolean;
  
  /** Request parameter supported */
  request_parameter_supported?: boolean;
  
  /** Request URI parameter supported */
  request_uri_parameter_supported?: boolean;
  
  /** Require request URI registration */
  require_request_uri_registration?: boolean;
  
  /** OP policy URI */
  op_policy_uri?: string;
  
  /** OP terms of service URI */
  op_tos_uri?: string;
  
  /** Revocation endpoint */
  revocation_endpoint?: string;
  
  /** Revocation endpoint auth methods */
  revocation_endpoint_auth_methods_supported?: string[];
  
  /** Introspection endpoint */
  introspection_endpoint?: string;
  
  /** Introspection endpoint auth methods */
  introspection_endpoint_auth_methods_supported?: string[];
  
  /** Code challenge methods supported */
  code_challenge_methods_supported?: string[];
  
  /** DPoP signing algorithms supported */
  dpop_signing_alg_values_supported?: string[];
  
  /** Additional metadata */
  [key: string]: unknown;
}
```

### 10.2 JWKS Types

**File: `src/discovery/jwks.ts`**

```typescript
/**
 * JSON Web Key Set (RFC 7517)
 */
export interface JWKS {
  /** Array of JSON Web Keys */
  keys: JsonWebKey[];
}

/**
 * JWKS fetch result
 */
export interface JWKSFetchResult {
  /** JWKS document */
  jwks: JWKS;
  
  /** When JWKS was fetched */
  fetchedAt: string;
  
  /** Cache expiration time */
  expiresAt?: string;
  
  /** Source URL */
  sourceUrl: string;
}

/**
 * Key lookup result
 */
export interface KeyLookupResult {
  /** Matching key (if found) */
  key?: JsonWebKey;
  
  /** Whether key was found */
  found: boolean;
  
  /** Error (if lookup failed) */
  error?: string;
}
```

---

## 11. UI State Types

### 11.1 UI State Management

**File: `src/ui/ui-state.ts`**

```typescript
/**
 * Global UI state
 */
export interface UIState {
  /** Current view mode */
  viewMode: ViewMode;
  
  /** Sidebar state */
  sidebar: SidebarState;
  
  /** Current flow being viewed */
  currentFlowId?: string;
  
  /** Selected flow step */
  selectedStep?: number;
  
  /** Modal state */
  modals: ModalState;
  
  /** Toast notifications */
  toasts: ToastNotification[];
  
  /** Loading states */
  loading: LoadingState;
  
  /** Theme */
  theme: Theme;
}

/**
 * View modes
 * 
 * @remarks
 * **MVP:** TIMELINE and DETAILED views only
 * **Phase 2:** COMPARISON view
 * **Phase 3:** LEARNING mode and COMPACT view
 */
export enum ViewMode {
  /** ✅ MVP - Timeline view (horizontal) */
  TIMELINE = 'timeline',
  
  /** ✅ MVP - Detailed view (vertical) */
  DETAILED = 'detailed',
  
  /** ❌ Phase 3 - Compact view */
  COMPACT = 'compact',
  
  /** ❌ Phase 2 - Comparison view (side-by-side) */
  COMPARISON = 'comparison',
  
  /** ❌ Phase 3 - Learning mode */
  LEARNING = 'learning'
}

/**
 * Sidebar state
 */
export interface SidebarState {
  /** Whether sidebar is open */
  isOpen: boolean;
  
  /** Current sidebar tab */
  activeTab: SidebarTab;
  
  /** Sidebar width */
  width: number;
}

/**
 * Sidebar tabs
 */
export enum SidebarTab {
  FLOWS = 'flows',
  CONFIG = 'config',
  VULNERABILITY = 'vulnerability',
  HELP = 'help'
}

/**
 * Modal state
 * 
 * @remarks
 * **MVP:** Educational and settings modals only
 * **Phase 2:** Comparison and export modals
 */
export interface ModalState {
  /** ✅ MVP - Educational modal */
  educational?: {
    isOpen: boolean;
    content?: string;
    title?: string;
  };
  
  /** ❌ Phase 2 - Comparison modal */
  comparison?: {
    isOpen: boolean;
    flowIds?: [string, string];
  };
  
  /** ❌ Phase 2 - Export modal */
  export?: {
    isOpen: boolean;
    format?: ExportFormat;
  };
  
  /** ✅ MVP - Settings modal */
  settings?: {
    isOpen: boolean;
  };
}

/**
 * Export formats
 * 
 * @remarks
 * ❌ Phase 2 - Export functionality not in MVP
 */
export enum ExportFormat {
  JSON = 'json',
  CURL = 'curl',
  MARKDOWN = 'markdown',
  HAR = 'har'
}

/**
 * Toast notification
 */
export interface ToastNotification {
  /** Unique ID */
  id: string;
  
  /** Notification type */
  type: ToastType;
  
  /** Message */
  message: string;
  
  /** Title */
  title?: string;
  
  /** Duration (milliseconds, 0 = persistent) */
  duration?: number;
  
  /** Dismiss button */
  dismissible?: boolean;
  
  /** Action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Toast types
 */
export enum ToastType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

/**
 * Loading state
 */
export interface LoadingState {
  /** Global loading */
  global: boolean;
  
  /** Flow execution loading */
  flowExecution: boolean;
  
  /** Discovery loading */
  discovery: boolean;
  
  /** Token validation loading */
  tokenValidation: boolean;
  
  /** Custom loading states */
  [key: string]: boolean;
}
```

### 11.2 Theme Types

**File: `src/ui/theme.ts`**

```typescript
/**
 * Theme configuration
 */
export interface Theme {
  /** Theme mode */
  mode: ThemeMode;
  
  /** Color palette */
  colors: ColorPalette;
  
  /** Typography */
  typography: Typography;
  
  /** Spacing scale */
  spacing: SpacingScale;
  
  /** Border radius scale */
  borderRadius: BorderRadiusScale;
  
  /** Shadows */
  shadows: Shadows;
}

/**
 * Theme modes
 */
export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto'
}

/**
 * Color palette
 */
export interface ColorPalette {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  border: string;
  divider: string;
}

/**
 * Typography
 */
export interface Typography {
  fontFamily: {
    sans: string;
    mono: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

/**
 * Spacing scale (in pixels or rem)
 */
export type SpacingScale = {
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
  8: string;
  10: string;
  12: string;
  16: string;
  20: string;
  24: string;
  32: string;
};

/**
 * Border radius scale
 */
export type BorderRadiusScale = {
  none: string;
  sm: string;
  base: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
};

/**
 * Shadow definitions
 */
export interface Shadows {
  sm: string;
  base: string;
  md: string;
  lg: string;
  xl: string;
}
```

---

## 12. Validation & Error Types

### 12.1 Validation Result Types

**File: `src/validation/validation-result.ts`**

```typescript
/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  
  /** Validation errors (if any) */
  errors: ValidationError[];
  
  /** Validation warnings (if any) */
  warnings: ValidationWarning[];
  
  /** What was validated */
  subject: string;
  
  /** When validation occurred */
  validatedAt: string;
  
  /** Additional validation metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Validation warning (non-fatal)
 */
export interface ValidationWarning {
  /** Warning code */
  code: string;
  
  /** Warning message */
  message: string;
  
  /** Field that triggered warning */
  field?: string;
  
  /** Severity */
  severity: 'low' | 'medium' | 'high';
}

/**
 * Token-specific validation result
 */
export interface TokenValidationResult extends ValidationResult {
  /** Token type validated */
  tokenType: 'access' | 'refresh' | 'id';
  
  /** Specific checks performed */
  checks: {
    signatureValid?: boolean;
    notExpired?: boolean;
    issuerValid?: boolean;
    audienceValid?: boolean;
    scopesValid?: boolean;
    nonceValid?: boolean;
    hashesValid?: boolean;
  };
  
  /** Decoded token (if valid) */
  decoded?: JWT;
}
```

### 12.2 Error Types

**File: `src/validation/validation-error.ts`**

```typescript
/**
 * Validation error
 */
export interface ValidationError {
  /** Error code */
  code: string;
  
  /** Error message */
  message: string;
  
  /** Field that failed validation */
  field?: string;
  
  /** Expected value */
  expected?: unknown;
  
  /** Actual value */
  actual?: unknown;
  
  /** Path to error (for nested objects) */
  path?: string[];
}

/**
 * OAuth2/OIDC error response
 */
export interface OAuth2Error {
  /** Error code (RFC 6749 §5.2) */
  error: string;
  
  /** Error description */
  error_description?: string;
  
  /** Error URI */
  error_uri?: string;
  
  /** State (if present in request) */
  state?: string;
}

/**
 * Application error
 */
export interface AppError {
  /** Error type */
  type: ErrorType;
  
  /** Error message */
  message: string;
  
  /** Error code */
  code?: string;
  
  /** Underlying error */
  cause?: Error;
  
  /** Stack trace */
  stack?: string;
  
  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Error types
 */
export enum ErrorType {
  /** Network/communication error */
  NETWORK = 'network',
  
  /** OAuth2/OIDC protocol error */
  OAUTH2 = 'oauth2',
  
  /** Token validation error */
  VALIDATION = 'validation',
  
  /** Configuration error */
  CONFIG = 'config',
  
  /** Internal application error */
  INTERNAL = 'internal',
  
  /** Unknown error */
  UNKNOWN = 'unknown'
}
```

---

## 13. Utility Types

### 13.1 Common Utility Types

**File: `src/utils/common.ts`**

```typescript
/**
 * ISO 8601 timestamp string
 */
export type Timestamp = string;

/**
 * URL string
 */
export type URL = string;

/**
 * Base64-encoded string
 */
export type Base64String = string;

/**
 * Base64URL-encoded string (RFC 4648 §5)
 */
export type Base64URLString = string;

/**
 * JWT string (header.payload.signature)
 */
export type JWTString = string;

/**
 * Optional type helper
 */
export type Optional<T> = T | undefined;

/**
 * Nullable type helper
 */
export type Nullable<T> = T | null;

/**
 * Maybe type (optional or null)
 */
export type Maybe<T> = T | undefined | null;

/**
 * Deep partial (recursively optional)
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Deep readonly (recursively readonly)
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Extract enum values
 */
export type EnumValues<T> = T[keyof T];

/**
 * Make specific properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
```

### 13.2 Branded Types

**File: `src/utils/branded-types.ts`**

```typescript
/**
 * Branded type for nominal typing
 * 
 * Allows creating types that are structurally identical but
 * nominally different for type safety.
 */
export type Brand<K, T> = K & { __brand: T };

/**
 * Client ID (branded string)
 */
export type ClientId = Brand<string, 'ClientId'>;

/**
 * User ID (branded string)
 */
export type UserId = Brand<string, 'UserId'>;

/**
 * Flow ID (branded string)
 */
export type FlowId = Brand<string, 'FlowId'>;

/**
 * Session ID (branded string)
 */
export type SessionId = Brand<string, 'SessionId'>;

/**
 * Token JTI (branded string)
 */
export type TokenJTI = Brand<string, 'TokenJTI'>;

/**
 * Scope (branded string)
 */
export type Scope = Brand<string, 'Scope'>;

/**
 * Create branded value
 */
export function brand<K, T>(value: K): Brand<K, T> {
  return value as Brand<K, T>;
}

/**
 * Unwrap branded value
 */
export function unbrand<K, T>(value: Brand<K, T>): K {
  return value as K;
}
```

---

## 14. Implementation Tasks

### 14.1 MVP Implementation Checklist

**CRITICAL: Focus on MVP features only. Phase 2/3 types are defined but not fully implemented.**

**Phase 1: Core Infrastructure (2-3 hours) - ✅ REQUIRED FOR MVP**

- [ ] Initialize package structure
  - [ ] Create directory structure
  - [ ] Set up package.json and tsconfig.json
  - [ ] Configure build scripts
  - [ ] Set up index.ts barrel exports

**Phase 2: Flow Types (2-3 hours) - ✅ REQUIRED FOR MVP**

- [ ] Implement core flow types (MVP scope only)
  - [ ] FlowType enum (define all, but only Auth Code Flow used in MVP)
  - [ ] FlowStatus enum
  - [ ] FlowExecution interface
  - [ ] FlowStep interface
  - [ ] StepStatus enum
- [ ] Implement authorization code flow types (✅ MVP)
  - [ ] AuthorizationRequest interface
  - [ ] AuthorizationResponse interface
  - [ ] TokenRequest interface
  - [ ] TokenResponse interface
- [ ] Define (but don't fully implement) future flow types
  - [ ] Client credentials types (stub for Phase 2)
  - [ ] Device authorization types (stub for Phase 2)
  - [ ] Refresh token types (stub for Phase 2)

**Phase 3: Token Types (3-4 hours) - ✅ REQUIRED FOR MVP**

- [ ] Implement token structures (MVP focus: Access & ID tokens)
  - [ ] AccessToken interface
  - [ ] AccessTokenPayload interface
  - [ ] IDToken interface (OIDC)
  - [ ] IDTokenPayload interface (OIDC)
  - [ ] JWT generic structure
  - [ ] JWTHeader interface
  - [ ] JWTPayload interface
  - [ ] TokenResponse interface
  - [ ] RefreshToken interface (basic type only, not full flow)
  - [ ] IntrospectionResponse interface

**Phase 4: HTTP Types (1-2 hours) - ✅ REQUIRED FOR MVP**

- [ ] Implement HTTP communication types (complete)
  - [ ] HttpRequest interface
  - [ ] HttpResponse interface
  - [ ] HttpMethod enum
  - [ ] HttpHeaders type
  - [ ] Request/response body types (all variants)

**Phase 5: Security Types (2-3 hours) - ✅ REQUIRED FOR MVP**

- [ ] Implement security primitives (MVP essentials)
  - [ ] PKCEParams interface
  - [ ] PKCEValidationResult interface
  - [ ] StateParam interface
  - [ ] StateValidationResult interface
  - [ ] NonceParam interface (OIDC)
  - [ ] NonceValidationResult interface
  - [ ] SecurityAssessment interface
  - [ ] SecurityIndicator interface
  - [ ] SecurityCheck interface
- [ ] Skip token binding types (Phase 2/3)

**Phase 6: Vulnerability Types (1-2 hours) - ⚠️ PARTIAL MVP**

- [ ] Implement vulnerability mode types (focus on structure)
  - [ ] VulnerabilityConfig interface (complete)
  - [ ] VulnerabilityToggles interface (all 39 defined, only DISABLE_PKCE active)
  - [ ] VulnerabilityToggleMetadata interface (for DISABLE_PKCE only)
  - [ ] VulnerabilityCategory enum
  - [ ] SECURE_DEFAULTS constant
- [ ] Note: Only DISABLE_PKCE toggle is functional in MVP

**Phase 7: Configuration Types (1-2 hours) - ✅ REQUIRED FOR MVP**

- [ ] Implement configuration types (complete)
  - [ ] ClientConfig interface
  - [ ] ServerConfig interface
  - [ ] AppConfig interface
  - [ ] ClientType enum
  - [ ] ResponseType type
  - [ ] GrantType type
  - [ ] ClientAuthMethod enum

**Phase 8: Discovery Types (1 hour) - ⚠️ BASIC MVP**

- [ ] Implement discovery types (basic only)
  - [ ] OIDCDiscoveryDocument interface (basic fields)
  - [ ] OAuthServerMetadata interface (basic fields)
  - [ ] JWKS interface
  - [ ] JsonWebKey interface (basic)
- [ ] Note: Advanced discovery features in Phase 2

**Phase 9: UI Types (1 hour) - ⚠️ BASIC MVP**

- [ ] Implement UI state types (MVP views only)
  - [ ] UIState interface (without comparison/export fields)
  - [ ] ViewMode enum (define all, use TIMELINE/DETAILED only)
  - [ ] Theme interface
  - [ ] ModalState interface (educational & settings only)
  - [ ] ToastNotification interface
- [ ] Note: Comparison and export modals in Phase 2

**Phase 10: Validation Types (1 hour) - ✅ REQUIRED FOR MVP**

- [ ] Implement validation types (complete)
  - [ ] ValidationResult interface
  - [ ] ValidationError interface
  - [ ] TokenValidationResult interface
  - [ ] OAuth2Error interface
  - [ ] AppError interface

**Phase 11: Utility Types (1 hour) - ✅ REQUIRED FOR MVP**

- [ ] Implement utility types (complete)
  - [ ] Common type aliases (Timestamp, URL, Base64String, etc.)
  - [ ] Branded types (ClientId, UserId, FlowId, etc.)
  - [ ] Generic utility types (DeepPartial, DeepReadonly, etc.)

**Phase 12: Documentation & Testing (2-3 hours) - ✅ REQUIRED FOR MVP**

- [ ] Add JSDoc comments to all exported types
- [ ] Create README.md with usage examples
- [ ] Add inline examples for complex types
- [ ] Type-check entire package
- [ ] Build and verify dist output
- [ ] Test integration with backend package
- [ ] Test integration with frontend package

### 14.2 MVP Task Estimates (Revised)

| Phase | Estimated Hours | Priority | MVP Status |
|-------|-----------------|----------|------------|
| Core Infrastructure | 2-3 | Critical | ✅ Full MVP |
| Flow Types | 2-3 | Critical | ✅ Auth Code only |
| Token Types | 3-4 | Critical | ✅ Access & ID tokens |
| HTTP Types | 1-2 | Critical | ✅ Full MVP |
| Security Types | 2-3 | High | ✅ Core types only |
| Vulnerability Types | 1-2 | High | ⚠️ DISABLE_PKCE only |
| Configuration Types | 1-2 | High | ✅ Full MVP |
| Discovery Types | 1 | Medium | ⚠️ Basic only |
| UI Types | 1 | Medium | ⚠️ Basic views |
| Validation Types | 1 | Medium | ✅ Full MVP |
| Utility Types | 1 | Low | ✅ Full MVP |
| Documentation | 2-3 | High | ✅ Full MVP |
| **Total MVP** | **17-24 hours** | - | **Complete** |

**Phase 2/3 Work (Future):**
- Client Credentials Flow types: 2-3 hours
- Device Authorization Flow types: 2-3 hours
- Refresh Token Flow types: 1-2 hours
- Additional vulnerability toggles (38 more): 4-6 hours
- Token binding types (DPoP, mTLS): 2-3 hours
- Advanced discovery features: 2-3 hours
- Comparison & export UI types: 1-2 hours
- **Total Phase 2/3:** 14-22 hours

### 14.3 Implementation Order (MVP Priority)

**CRITICAL PATH (Must complete for MVP):**
1. ✅ Core infrastructure setup
2. ✅ Flow types (Authorization Code Flow only)
3. ✅ Token types (Access & ID tokens)
4. ✅ HTTP types (complete)
5. ✅ Security types (PKCE, state, nonce, assessment)
6. ✅ Configuration types (client/server config)
7. ⚠️ Vulnerability types (DISABLE_PKCE focus)
8. ✅ Validation types (complete)
9. ✅ Utility types (complete)
10. ✅ Documentation

**SECONDARY (Minimal for MVP):**
11. ⚠️ Discovery types (basic discovery)
12. ⚠️ UI types (basic views only)

**DEFERRED TO PHASE 2/3:**
- Additional flow types
- Additional vulnerability toggles
- Token binding
- Advanced UI features
- Export functionality

---

## 15. Testing Strategy

### 15.1 Type Testing

**Goal**: Ensure types are correctly defined and provide expected compile-time guarantees

**Approach**:
```typescript
// tests/type-tests.ts

import { FlowExecution, FlowStatus, FlowType } from '../src';

// Test: FlowExecution requires all mandatory fields
const validFlow: FlowExecution = {
  id: 'flow-123',
  flowType: FlowType.AUTHORIZATION_CODE_PKCE,
  status: FlowStatus.RUNNING,
  startedAt: '2024-01-01T00:00:00Z',
  steps: [],
  config: {
    client: {
      clientId: 'test-client',
      clientType: ClientType.PUBLIC,
      redirectUris: ['http://localhost:3000/callback'],
      scopes: ['openid'],
      responseType: 'code',
      grantTypes: ['authorization_code'],
      authMethod: ClientAuthMethod.NONE
    },
    server: {
      issuer: 'http://localhost:8080',
      authorizationEndpoint: 'http://localhost:8080/authorize',
      tokenEndpoint: 'http://localhost:8080/token'
    }
  }
};

// Test: This should NOT compile (missing required fields)
// @ts-expect-error - Missing 'id' field
const invalidFlow: FlowExecution = {
  flowType: FlowType.AUTHORIZATION_CODE_PKCE,
  status: FlowStatus.RUNNING,
  startedAt: '2024-01-01T00:00:00Z',
  steps: []
};

// Test: Discriminated unions work correctly
function handleFlowStatus(flow: FlowExecution) {
  switch (flow.status) {
    case FlowStatus.COMPLETE:
      // TypeScript knows `completedAt` should be present
      console.log(flow.completedAt);
      break;
    case FlowStatus.ERROR:
      // TypeScript knows `error` should be present
      console.log(flow.error);
      break;
  }
}
```

### 15.2 Integration Testing

**Goal**: Verify types work correctly when used across packages

**Approach**:
- Import types in backend, frontend, and mock-resource-server
- Ensure no compilation errors
- Verify IntelliSense works correctly
- Test type narrowing and inference

### 15.3 Documentation Testing

**Goal**: Ensure JSDoc comments are present and accurate

**Approach**:
- Visual inspection of generated type definitions
- Verify examples in JSDoc compile correctly
- Check that IDE tooltips show helpful information

---

## 16. Future Extensions

### 16.1 Extended Flow Types

**Future Work: Additional OAuth2 flows**

- Implicit flow types (deprecated, for education)
- Resource Owner Password Credentials types (deprecated, for education)
- Token Exchange (RFC 8693)
- JWT Bearer assertions (RFC 7523)
- SAML Bearer assertions (RFC 7522)

### 16.2 Advanced OIDC Features

**Future Work: Extended OIDC support**

- Claims parameter types (OIDC Core §5.5)
- Request objects (RFC 9101)
- Aggregated and distributed claims
- UserInfo endpoint request/response types
- Session management types (OIDC Session Management)
- Front-channel logout types
- Back-channel logout types (OIDC Back-Channel Logout)

### 16.3 Advanced Security Features

**Future Work: Additional security mechanisms**

- Rich Authorization Requests (RFC 9396)
- Resource Indicators (RFC 8707)
- JWT Secured Authorization Requests (RFC 9101)
- Mutual TLS (RFC 8705) - full certificate types
- Step-up authentication
- Transaction authorization

### 16.4 Extended Vulnerability Modes

**Future Work: Additional vulnerability toggles**

- Replay detection bypass toggles
- Session fixation demonstration
- Authorization code substitution
- Token substitution attacks
- OAuth 1.0 vulnerabilities (if supporting OAuth 1.0)

### 16.5 Visualization Enhancements

**Future Work: Advanced visualization types**

- Sequence diagram types
- Performance metrics types
- Animation timeline types
- Comparison view types (detailed)
- Interactive tutorial types

### 16.6 External IdP Support

**Future Work: Multi-IdP types**

- IdP registry types
- IdP-specific configuration types
- IdP metadata mapping types
- Multi-tenant types

---

## Appendix A: Type Naming Conventions

### A.1 Naming Guidelines

**Interfaces**: PascalCase, descriptive noun
- ✅ `FlowExecution`, `TokenResponse`, `SecurityAssessment`
- ❌ `flowExecution`, `tokenResp`, `security_assessment`

**Enums**: PascalCase, singular noun
- ✅ `FlowType`, `FlowStatus`, `HttpMethod`
- ❌ `FlowTypes`, `flow_status`, `HTTPMethods`

**Enum Members**: SCREAMING_SNAKE_CASE
- ✅ `AUTHORIZATION_CODE_PKCE`, `CLIENT_CREDENTIALS`
- ❌ `AuthorizationCodePkce`, `clientCredentials`

**Type Aliases**: PascalCase
- ✅ `ResponseType`, `GrantType`, `TokenErrorCode`
- ❌ `responseType`, `grant_type`

**Branded Types**: PascalCase, descriptive
- ✅ `ClientId`, `UserId`, `FlowId`
- ❌ `CLIENT_ID`, `userId`

### A.2 File Naming Conventions

- kebab-case for all files: `flow-types.ts`, `access-token.ts`
- Match primary export name: `flow-execution.ts` exports `FlowExecution`
- Use `index.ts` for barrel exports in each directory

---

## Appendix B: JSDoc Guidelines

### B.1 Required JSDoc Elements

All exported types must include:

1. **Description**: What the type represents
2. **@remarks**: Additional context, RFC references, usage notes
3. **@example**: Usage example (for complex types)
4. **@see**: Related types or documentation

**Example**:
```typescript
/**
 * Authorization Code Flow execution with PKCE
 * 
 * Represents a complete OAuth2 authorization code flow with PKCE
 * as defined in RFC 7636. This flow provides the strongest security
 * guarantees for OAuth2 clients.
 * 
 * @remarks
 * This flow type should be used for:
 * - Single-page applications (SPAs)
 * - Native mobile applications
 * - Public clients that cannot securely store secrets
 * 
 * @example
 * ```typescript
 * const flow: FlowExecution = {
 *   id: 'flow-123',
 *   flowType: FlowType.AUTHORIZATION_CODE_PKCE,
 *   status: FlowStatus.RUNNING,
 *   // ... other fields
 * };
 * ```
 * 
 * @see FlowExecution
 * @see PKCEParams
 * @see RFC 7636 - Proof Key for Code Exchange
 */
export interface AuthorizationCodePKCEFlow extends FlowExecution {
  // ...
}
```

---

## Appendix C: Quick Reference

### C.1 Import Patterns

**Backend:**
```typescript
import {
  FlowExecution,
  FlowType,
  TokenResponse,
  PKCEParams,
  VulnerabilityConfig
} from '@auth-optics/shared';
```

**Frontend:**
```typescript
import {
  FlowStep,
  SecurityIndicator,
  UIState,
  Theme
} from '@auth-optics/shared';
```

**Mock Resource Server:**
```typescript
import {
  AccessToken,
  IntrospectionResponse,
  ValidationResult
} from '@auth-optics/shared';
```

### C.2 Common Type Patterns

**Creating a flow execution:**
```typescript
const flow: FlowExecution = {
  id: generateId(),
  flowType: FlowType.AUTHORIZATION_CODE_PKCE,
  status: FlowStatus.IDLE,
  startedAt: new Date().toISOString(),
  steps: [],
  config: {
    client: clientConfig,
    server: serverConfig
  }
};
```

**Handling discriminated unions:**
```typescript
function getFlowStatusColor(status: FlowStatus): string {
  switch (status) {
    case FlowStatus.COMPLETE:
      return 'green';
    case FlowStatus.ERROR:
      return 'red';
    case FlowStatus.RUNNING:
      return 'blue';
    default:
      return 'gray';
  }
}
```

**Type narrowing:**
```typescript
function processToken(token: string) {
  if (isJWT(token)) {
    const jwt: JWT = decodeJWT(token);
    // TypeScript knows jwt has header, payload, signature
    console.log(jwt.payload);
  }
}
```

---

## Document Metadata

| Property | Value |
|----------|-------|
| **Version** | 1.0.0 |
| **Created** | December 2024 |
| **Target** | Claude Code, AI-assisted development |
| **Scope** | MVP + Future Extensions |
| **Estimated Effort** | 20-28 hours |
| **Dependencies** | TypeScript 5.3+ |
| **Package** | @auth-optics/shared |

---

**End of Shared Types Component Specification**
