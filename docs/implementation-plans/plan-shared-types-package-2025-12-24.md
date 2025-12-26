# Implementation Plan: Shared Types Package (packages/shared)

## Document Information

| Property | Value |
|----------|-------|
| **Component** | packages/shared |
| **Plan Date** | December 24, 2025 |
| **Implementation Status** | 0% Complete (Not Started) |
| **Estimated Completion** | 12-18 hours total |
| **Phase** | Phase 1 - Foundation |
| **Dependencies** | None (zero runtime dependencies) |
| **Blocks** | Backend, Frontend, Mock Resource Server |

---

## Executive Summary

This implementation plan provides step-by-step instructions to implement the complete Shared Types Package (`packages/shared`) from scratch, which serves as the foundational type library for the entire AuthOptics monorepo. This plan covers all type categories required for the MVP: Flow types, Token types, HTTP types, Security types, Vulnerability configuration types, Configuration types, Discovery types, Validation types, UI types, Events types, and Utility types.

**Current State**: Nothing has been created yet - starting from 0%
**Target State**: Complete TypeScript type library with all MVP-required types, built and ready for consumption by other packages

**Exit Criteria**: All packages can import types from `@auth-optics/shared` successfully

---

## Revision History

**Version 1.1.0 (December 24, 2025)**:
- **CRITICAL CORRECTION**: Revised plan to reflect actual project status (0% complete, not 40%)
- Updated time estimates from 4-6 hours to 12-18 hours (complete implementation)
- Added all missing type categories to implementation roadmap:
  - Flow Types (2-3 hours)
  - Token Types (2-3 hours)
  - Configuration Types (1-2 hours)
  - Discovery Types (1-2 hours)
  - UI Types (1 hour)
  - Events Types (1 hour)
- Restructured implementation sequence into a 3-day plan
- Updated priority ordering to reflect dependencies (Utility types first)
- Added references to specification document for complete type definitions

**Version 1.0.0 (December 24, 2025)**: Initial plan (incorrectly assumed 40% completion)

---

## Table of Contents

1. [Project Initialization](#1-project-initialization)
2. [Directory Structure Setup](#2-directory-structure-setup)
3. [TypeScript Configuration](#3-typescript-configuration)
4. [Implementation Roadmap](#4-implementation-roadmap)
5. [Type Category Implementation](#5-type-category-implementation)
6. [Build Configuration](#6-build-configuration)
7. [Validation & Testing](#7-validation--testing)
8. [Integration Verification](#8-integration-verification)
9. [Troubleshooting Guide](#9-troubleshooting-guide)

---

## 1. Project Initialization

### 1.1 Prerequisites

Verify the following before starting:

```bash
# Check Node.js version (requires 20.x LTS)
node --version  # Should output v20.x.x

# Check pnpm installation
pnpm --version  # Should output 8.x.x or higher

# Verify you're in the project root
pwd  # Should be /home/toffer/auth-optics-workspace/auth-optics
```

### 1.2 Create Monorepo Infrastructure

**Step 1.2.1**: Create root workspace configuration

```bash
cd /home/toffer/auth-optics-workspace/auth-optics
```

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - 'packages/*'
```

**Step 1.2.2**: Create root package.json

```json
{
  "name": "auth-optics",
  "version": "1.0.0",
  "private": true,
  "description": "OAuth2/OIDC debugging and educational tool",
  "scripts": {
    "dev": "pnpm -r --parallel dev",
    "build": "pnpm -r build",
    "build:shared": "pnpm --filter @auth-optics/shared build",
    "type-check": "pnpm -r type-check",
    "clean": "pnpm -r clean",
    "lint": "pnpm -r lint",
    "test": "pnpm -r test"
  },
  "keywords": ["oauth2", "oidc", "security", "debugging"],
  "author": "",
  "license": "MIT",
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

**Step 1.2.3**: Create packages directory

```bash
mkdir -p /home/toffer/auth-optics-workspace/auth-optics/packages
```

---

## 2. Directory Structure Setup

### 2.1 Create Shared Package Directory Structure

Execute these commands to create the complete directory structure:

```bash
# Navigate to project root
cd /home/toffer/auth-optics-workspace/auth-optics

# Create shared package root
mkdir -p packages/shared

# Create src directories for all type categories
mkdir -p packages/shared/src/flows
mkdir -p packages/shared/src/tokens
mkdir -p packages/shared/src/http
mkdir -p packages/shared/src/security
mkdir -p packages/shared/src/vulnerability
mkdir -p packages/shared/src/config
mkdir -p packages/shared/src/discovery
mkdir -p packages/shared/src/validation
mkdir -p packages/shared/src/ui
mkdir -p packages/shared/src/events
mkdir -p packages/shared/src/utils
```

**Verification**:

```bash
tree -L 3 packages/shared
# Should show all directories listed above
```

### 2.2 Expected Directory Tree

```
packages/shared/
├── src/
│   ├── index.ts                    # Main barrel export
│   ├── flows/                      # OAuth2/OIDC flow types
│   │   ├── index.ts
│   │   ├── flow-types.ts
│   │   ├── flow-steps.ts
│   │   └── authorization-code.ts
│   ├── tokens/                     # Token structures
│   │   ├── index.ts
│   │   ├── access-token.ts
│   │   ├── refresh-token.ts
│   │   ├── id-token.ts
│   │   ├── jwt.ts
│   │   └── token-response.ts
│   ├── http/                       # HTTP communication types
│   │   ├── index.ts
│   │   ├── request.ts
│   │   ├── response.ts
│   │   └── headers.ts
│   ├── security/                   # Security primitives
│   │   ├── index.ts
│   │   ├── pkce.ts
│   │   ├── state.ts
│   │   ├── nonce.ts
│   │   ├── security-assessment.ts
│   │   └── security-indicators.ts
│   ├── vulnerability/              # Vulnerability mode types
│   │   ├── index.ts
│   │   ├── vulnerability-config.ts
│   │   ├── vulnerability-toggle.ts
│   │   └── vulnerability-category.ts
│   ├── config/                     # Configuration types
│   │   ├── index.ts
│   │   ├── client-config.ts
│   │   ├── server-config.ts
│   │   └── app-config.ts
│   ├── discovery/                  # OIDC Discovery types
│   │   ├── index.ts
│   │   ├── oidc-discovery.ts
│   │   ├── oauth-metadata.ts
│   │   └── jwks.ts
│   ├── validation/                 # Validation types
│   │   ├── index.ts
│   │   ├── validation-result.ts
│   │   ├── validation-error.ts
│   │   └── validators.ts
│   ├── ui/                         # UI state types
│   │   ├── index.ts
│   │   ├── ui-state.ts
│   │   ├── theme.ts
│   │   └── view-modes.ts
│   ├── events/                     # SSE event types
│   │   ├── index.ts
│   │   ├── flow-events.ts
│   │   └── event-payloads.ts
│   └── utils/                      # Utility types
│       ├── index.ts
│       ├── common.ts
│       └── branded-types.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## 3. TypeScript Configuration

### 3.1 Create package.json for Shared Package

**File**: `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/package.json`

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
    "clean": "rm -rf dist",
    "watch": "tsc --watch"
  },
  "keywords": [
    "oauth2",
    "oidc",
    "types",
    "typescript"
  ],
  "author": "",
  "license": "MIT",
  "devDependencies": {
    "typescript": "^5.3.0"
  },
  "files": [
    "dist/**/*",
    "src/**/*"
  ]
}
```

### 3.2 Create tsconfig.json for Shared Package

**File**: `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

### 3.3 Install Dependencies

```bash
cd /home/toffer/auth-optics-workspace/auth-optics/packages/shared
pnpm install
```

**Expected Output**:
```
Packages: +1
+typescript 5.3.x
```

---

## 4. Implementation Roadmap

### 4.1 Implementation Priority Order

Complete implementation from scratch (0% → 100%). All type categories must be implemented:

| Priority | Category | Files | Estimated Time | Status | Dependencies |
|----------|----------|-------|----------------|--------|--------------|
| **1 (CRITICAL)** | Utility Types | 2 files | 30 min | ❌ Not Started | None (foundation) |
| **2 (CRITICAL)** | Flow Types | 3 files | 2-3 hours | ❌ Not Started | Utility types |
| **3 (CRITICAL)** | Token Types | 5 files | 2-3 hours | ❌ Not Started | Utility types |
| **4 (CRITICAL)** | HTTP Types | 3 files | 1-2 hours | ❌ Not Started | Utility types |
| **5 (HIGH)** | Configuration Types | 3 files | 1-2 hours | ❌ Not Started | Utility types |
| **6 (HIGH)** | Discovery Types | 3 files | 1-2 hours | ❌ Not Started | Utility types |
| **7 (HIGH)** | Security Types | 5 files | 2-3 hours | ❌ Not Started | Utility types |
| **8 (HIGH)** | Vulnerability Types | 3 files | 1-2 hours | ❌ Not Started | Security types |
| **9 (MEDIUM)** | Validation Types | 3 files | 30 min | ❌ Not Started | Security types |
| **10 (MEDIUM)** | UI Types | 3 files | 1 hour | ❌ Not Started | Flow, Token types |
| **11 (MEDIUM)** | Events Types | 2 files | 1 hour | ❌ Not Started | Flow types |
| **12 (CLEANUP)** | Documentation | README.md | 30 min | ❌ Not Started | All types complete |

**Total Estimated Time**: 12-18 hours

**Note**: Utility types must be implemented first as they provide foundational type helpers (branded types, common aliases) used throughout other type categories.

### 4.2 Implementation Sequence (3-Day Plan)

#### **Day 1: Foundation Types** (4-6 hours)

**Session 1: Utilities & Flow Types** (2.5-4 hours)
1. ✅ Utility types - common.ts, branded-types.ts (30 min)
2. ✅ Flow types - flow-types.ts, flow-steps.ts, authorization-code.ts (2-3 hours)
3. ✅ Create barrel exports for flows/ and utils/

**Session 2: Token & HTTP Types** (2-3 hours)
1. ✅ Token types - jwt.ts, access-token.ts, refresh-token.ts, id-token.ts, token-response.ts (2-3 hours)
2. ✅ HTTP types - request.ts, response.ts, headers.ts (1-2 hours)
3. ✅ Create barrel exports for tokens/ and http/

#### **Day 2: Configuration & Security** (5-7 hours)

**Session 1: Configuration & Discovery** (2-4 hours)
1. ✅ Configuration types - client-config.ts, server-config.ts, app-config.ts (1-2 hours)
2. ✅ Discovery types - oidc-discovery.ts, oauth-metadata.ts, jwks.ts (1-2 hours)
3. ✅ Create barrel exports for config/ and discovery/

**Session 2: Security Types** (3-4 hours)
1. ✅ Security types - pkce.ts, state.ts, nonce.ts, security-assessment.ts, security-indicators.ts (2-3 hours)
2. ✅ Vulnerability types - vulnerability-config.ts, vulnerability-toggle.ts, vulnerability-category.ts (1-2 hours)
3. ✅ Create barrel exports for security/ and vulnerability/

#### **Day 3: Validation, UI, Events & Integration** (3-5 hours)

**Session 1: Remaining Types** (2-3 hours)
1. ✅ Validation types - validation-result.ts, validation-error.ts, validators.ts (30 min)
2. ✅ UI types - ui-state.ts, theme.ts, view-modes.ts (1 hour)
3. ✅ Events types - flow-events.ts, event-payloads.ts (1 hour)
4. ✅ Create barrel exports for validation/, ui/, events/

**Session 2: Integration & Verification** (1-2 hours)
1. ✅ Create main index.ts barrel export
2. ✅ Build package and verify type exports
3. ✅ Test imports from mock package
4. ✅ Create README.md documentation
5. ✅ Final verification checklist

---

## 5. Type Category Implementation

**Important Note**: This section provides detailed implementation code for key type categories (Utility, HTTP, Security, Vulnerability, Validation). For complete type definitions of **Flow Types**, **Token Types**, **Configuration Types**, **Discovery Types**, **UI Types**, and **Events Types**, refer to the [AuthOptics Shared Types Specification](../specs/auth-optics-shared-types-specification.md) Sections 5-11. All categories must be implemented following the specification.

**Implementation Order**:
1. Start with Section 5.5 (Utility Types) - foundation for all other types
2. Implement Flow, Token, Config, Discovery types per specification
3. Continue with HTTP (5.1), Security (5.2), Vulnerability (5.3), Validation (5.4) below
4. Complete with UI and Events types per specification
5. Finish with Main Index (5.6)

---

### 5.1 HTTP Types (PRIORITY 4 - CRITICAL)

**Estimated Time**: 1-2 hours

#### 5.1.1 Create HTTP Request Types

**File**: `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/http/request.ts`

```typescript
/**
 * HTTP request representation
 *
 * Captures all relevant information about an HTTP request made during
 * an OAuth2/OIDC flow for visualization and debugging purposes.
 */
export interface HttpRequest {
  /** HTTP method */
  method: HttpMethod;

  /** Request URL (full URL including query parameters) */
  url: string;

  /** HTTP headers */
  headers: HttpHeaders;

  /** Request body (if present) */
  body?: HttpRequestBody;

  /** Timestamp of request (ISO 8601) */
  timestamp: string;

  /** Request ID for correlation with response */
  requestId: string;
}

/**
 * HTTP method enum
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS'
}

/**
 * HTTP request body variants
 */
export type HttpRequestBody =
  | { type: 'none' }
  | { type: 'json'; data: Record<string, unknown> }
  | { type: 'form'; data: Record<string, string> }
  | { type: 'text'; data: string }
  | { type: 'binary'; contentType: string; size: number };
```

#### 5.1.2 Create HTTP Response Types

**File**: `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/http/response.ts`

```typescript
/**
 * HTTP response representation
 *
 * Captures all relevant information about an HTTP response received during
 * an OAuth2/OIDC flow for visualization and debugging purposes.
 */
export interface HttpResponse {
  /** HTTP status code */
  statusCode: number;

  /** HTTP status message */
  statusMessage: string;

  /** Response headers */
  headers: HttpHeaders;

  /** Response body (if present) */
  body?: HttpResponseBody;

  /** Timestamp of response (ISO 8601) */
  timestamp: string;

  /** Request ID for correlation with request */
  requestId: string;

  /** Response time in milliseconds */
  responseTime: number;
}

/**
 * HTTP response body variants
 */
export type HttpResponseBody =
  | { type: 'none' }
  | { type: 'json'; data: Record<string, unknown> }
  | { type: 'text'; data: string }
  | { type: 'html'; data: string }
  | { type: 'binary'; contentType: string; size: number }
  | { type: 'error'; error: string };

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
 * Get HTTP status category from status code
 */
export function getStatusCategory(statusCode: number): HttpStatusCategory {
  if (statusCode >= 100 && statusCode < 200) return HttpStatusCategory.INFORMATIONAL;
  if (statusCode >= 200 && statusCode < 300) return HttpStatusCategory.SUCCESS;
  if (statusCode >= 300 && statusCode < 400) return HttpStatusCategory.REDIRECTION;
  if (statusCode >= 400 && statusCode < 500) return HttpStatusCategory.CLIENT_ERROR;
  if (statusCode >= 500 && statusCode < 600) return HttpStatusCategory.SERVER_ERROR;
  throw new Error(`Invalid HTTP status code: ${statusCode}`);
}
```

#### 5.1.3 Create HTTP Headers Types

**File**: `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/http/headers.ts`

```typescript
/**
 * HTTP headers representation
 *
 * @remarks
 * Keys are case-insensitive per HTTP spec, but stored in lowercase.
 * Values are always string or string[] for multi-value headers.
 */
export type HttpHeaders = Record<string, string | string[]>;

/**
 * Common HTTP header names (lowercase)
 */
export const CommonHeaders = {
  // General Headers
  CONTENT_TYPE: 'content-type',
  CONTENT_LENGTH: 'content-length',
  USER_AGENT: 'user-agent',
  ACCEPT: 'accept',

  // OAuth2/OIDC Specific
  AUTHORIZATION: 'authorization',
  WWW_AUTHENTICATE: 'www-authenticate',

  // CORS
  ACCESS_CONTROL_ALLOW_ORIGIN: 'access-control-allow-origin',
  ACCESS_CONTROL_ALLOW_CREDENTIALS: 'access-control-allow-credentials',

  // Security
  STRICT_TRANSPORT_SECURITY: 'strict-transport-security',
  X_FRAME_OPTIONS: 'x-frame-options',
  X_CONTENT_TYPE_OPTIONS: 'x-content-type-options',

  // Caching
  CACHE_CONTROL: 'cache-control',
  PRAGMA: 'pragma',
  EXPIRES: 'expires',

  // Redirects
  LOCATION: 'location'
} as const;

/**
 * Content-Type values commonly used in OAuth2/OIDC
 */
export const ContentTypes = {
  JSON: 'application/json',
  FORM_URLENCODED: 'application/x-www-form-urlencoded',
  HTML: 'text/html',
  TEXT: 'text/plain',
  JWT: 'application/jwt'
} as const;
```

#### 5.1.4 Create HTTP Index Barrel

**File**: `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/http/index.ts`

```typescript
export * from './request';
export * from './response';
export * from './headers';
```

---

### 5.2 Security Types (PRIORITY 7 - HIGH)

**Estimated Time**: 2-3 hours

#### 5.2.1 Create PKCE Types

**File**: `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/security/pkce.ts`

```typescript
/**
 * PKCE (Proof Key for Code Exchange) parameters
 *
 * @remarks
 * RFC 7636 requires PKCE for all public clients (OAuth 2.1)
 * code_verifier: 43-128 characters, Base64URL(random)
 * code_challenge: Base64URL(SHA256(code_verifier))
 *
 * @see RFC 7636 - Proof Key for Code Exchange by OAuth Public Clients
 */
export interface PKCEParams {
  /** Code verifier (43-128 characters, Base64URL) */
  readonly codeVerifier: string;

  /** Code challenge (Base64URL encoded SHA-256 hash) */
  readonly codeChallenge: string;

  /** Code challenge method (always "S256" for AuthOptics MVP) */
  readonly codeChallengeMethod: 'S256';

  /** Timestamp when PKCE parameters were generated */
  readonly generatedAt: string;
}

/**
 * PKCE validation result
 */
export interface PKCEValidationResult {
  /** Whether PKCE validation succeeded */
  isValid: boolean;

  /** Validation errors (if any) */
  errors?: PKCEValidationError[];

  /** Whether code_verifier matches code_challenge */
  verifierMatches?: boolean;

  /** Whether code_verifier length is valid (43-128 chars) */
  verifierLengthValid?: boolean;

  /** Whether code_challenge is properly Base64URL encoded */
  challengeEncodingValid?: boolean;
}

/**
 * PKCE validation error types
 */
export enum PKCEValidationError {
  VERIFIER_TOO_SHORT = 'verifier_too_short',
  VERIFIER_TOO_LONG = 'verifier_too_long',
  VERIFIER_INVALID_CHARS = 'verifier_invalid_chars',
  CHALLENGE_MISMATCH = 'challenge_mismatch',
  CHALLENGE_ENCODING_INVALID = 'challenge_encoding_invalid',
  METHOD_NOT_SUPPORTED = 'method_not_supported'
}
```

#### 5.2.2 Create State Parameter Types

**File**: `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/security/state.ts`

```typescript
/**
 * OAuth2 state parameter for CSRF protection
 *
 * @remarks
 * RFC 6749 Section 10.12: State parameter is RECOMMENDED for CSRF protection.
 * AuthOptics MVP treats it as REQUIRED.
 *
 * State must be:
 * - Cryptographically random (at least 128 bits of entropy)
 * - Unique per authorization request
 * - Verified on callback
 * - Expired after use or timeout (10 minutes recommended)
 *
 * @see RFC 6749 Section 10.12 - Cross-Site Request Forgery
 */
export interface StateParam {
  /** State value (cryptographically random string) */
  readonly value: string;

  /** Timestamp when state was generated (ISO 8601) */
  readonly generatedAt: string;

  /** Expiration time (ISO 8601) */
  readonly expiresAt: string;

  /** Whether state has been used (single-use protection) */
  used: boolean;
}

/**
 * State validation result
 */
export interface StateValidationResult {
  /** Whether state validation succeeded */
  isValid: boolean;

  /** Validation errors (if any) */
  errors?: StateValidationError[];

  /** Whether state matches expected value */
  stateMatches?: boolean;

  /** Whether state has expired */
  isExpired?: boolean;

  /** Whether state has already been used */
  alreadyUsed?: boolean;
}

/**
 * State validation error types
 */
export enum StateValidationError {
  STATE_MISSING = 'state_missing',
  STATE_MISMATCH = 'state_mismatch',
  STATE_EXPIRED = 'state_expired',
  STATE_ALREADY_USED = 'state_already_used',
  STATE_TOO_SHORT = 'state_too_short'
}
```

#### 5.2.3 Create Nonce Types (OIDC)

**File**: `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/security/nonce.ts`

```typescript
/**
 * OIDC nonce parameter for ID token binding
 *
 * @remarks
 * OpenID Connect Core Section 3.1.2.1: Nonce is REQUIRED for Implicit Flow,
 * RECOMMENDED for Authorization Code Flow.
 *
 * Nonce purpose:
 * - Binds ID token to authentication request
 * - Prevents ID token replay attacks
 * - Must be included in ID token claims
 *
 * @see OIDC Core Section 3.1.2.1 - Authentication Request
 */
export interface NonceParam {
  /** Nonce value (cryptographically random string) */
  readonly value: string;

  /** Timestamp when nonce was generated (ISO 8601) */
  readonly generatedAt: string;

  /** Whether nonce has been verified in ID token */
  verified: boolean;
}

/**
 * Nonce validation result
 */
export interface NonceValidationResult {
  /** Whether nonce validation succeeded */
  isValid: boolean;

  /** Validation errors (if any) */
  errors?: NonceValidationError[];

  /** Whether nonce matches ID token claim */
  nonceMatches?: boolean;
}

/**
 * Nonce validation error types
 */
export enum NonceValidationError {
  NONCE_MISSING = 'nonce_missing',
  NONCE_MISMATCH = 'nonce_mismatch',
  NONCE_TOO_SHORT = 'nonce_too_short'
}
```

#### 5.2.4 Create Security Assessment Types

**File**: `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/security/security-assessment.ts`

```typescript
/**
 * Security assessment for an OAuth2/OIDC flow
 *
 * Evaluates the security posture of a flow execution based on
 * implemented security mechanisms and vulnerability configurations.
 */
export interface SecurityAssessment {
  /** Overall security score (0-100) */
  score: number;

  /** Security level category */
  level: SecurityLevel;

  /** Individual security checks */
  checks: SecurityCheck[];

  /** Active vulnerabilities (from vulnerability mode) */
  activeVulnerabilities: string[];

  /** Security recommendations */
  recommendations: SecurityRecommendation[];

  /** Timestamp of assessment (ISO 8601) */
  assessedAt: string;
}

/**
 * Security level categories
 */
export enum SecurityLevel {
  /** Critical security issues, flow is vulnerable */
  CRITICAL = 'critical',

  /** Important security mechanisms missing */
  WARNING = 'warning',

  /** Good security posture with minor issues */
  GOOD = 'good',

  /** Excellent security, all best practices followed */
  EXCELLENT = 'excellent'
}

/**
 * Individual security check result
 */
export interface SecurityCheck {
  /** Check identifier */
  id: string;

  /** Human-readable check name */
  name: string;

  /** Check category */
  category: SecurityCheckCategory;

  /** Check result */
  passed: boolean;

  /** Severity if check failed */
  severity?: SecuritySeverity;

  /** Check description */
  description: string;

  /** Remediation advice if check failed */
  remediation?: string;

  /** RFC reference */
  rfcReference?: string;
}

/**
 * Security check categories
 */
export enum SecurityCheckCategory {
  PKCE = 'pkce',
  STATE = 'state',
  NONCE = 'nonce',
  REDIRECT_URI = 'redirect_uri',
  TOKEN_VALIDATION = 'token_validation',
  HTTPS = 'https',
  TOKEN_BINDING = 'token_binding'
}

/**
 * Security issue severity levels
 */
export enum SecuritySeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

/**
 * Security recommendation
 */
export interface SecurityRecommendation {
  /** Recommendation ID */
  id: string;

  /** Recommendation title */
  title: string;

  /** Detailed recommendation text */
  description: string;

  /** Priority level */
  priority: SecuritySeverity;

  /** Link to more information */
  learnMoreUrl?: string;
}
```

#### 5.2.5 Create Security Indicator Types

**File**: `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/security/security-indicators.ts`

```typescript
/**
 * Security indicator badge for UI display
 *
 * Visual representation of a security mechanism's status
 * (e.g., PKCE enabled, state parameter used, HTTPS connection)
 */
export interface SecurityIndicator {
  /** Indicator type */
  type: SecurityIndicatorType;

  /** Current status */
  status: SecurityIndicatorStatus;

  /** Display label */
  label: string;

  /** Tooltip description */
  tooltip: string;

  /** Icon name (from lucide-react or similar) */
  icon?: string;

  /** Badge color variant */
  variant: 'success' | 'warning' | 'error' | 'info';
}

/**
 * Security indicator types
 */
export enum SecurityIndicatorType {
  PKCE = 'pkce',
  STATE = 'state',
  NONCE = 'nonce',
  HTTPS = 'https',
  TOKEN_SIGNATURE = 'token_signature',
  TOKEN_BINDING = 'token_binding',
  REDIRECT_URI = 'redirect_uri'
}

/**
 * Security indicator status
 */
export enum SecurityIndicatorStatus {
  /** Security mechanism is active and working correctly */
  ENABLED = 'enabled',

  /** Security mechanism is not active (vulnerability mode) */
  DISABLED = 'disabled',

  /** Security mechanism validation failed */
  FAILED = 'failed',

  /** Security mechanism status unknown/not applicable */
  UNKNOWN = 'unknown'
}
```

#### 5.2.6 Create Security Index Barrel

**File**: `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/security/index.ts`

```typescript
export * from './pkce';
export * from './state';
export * from './nonce';
export * from './security-assessment';
export * from './security-indicators';
```

---

### 5.3 Vulnerability Types (PRIORITY 8 - HIGH)

**Estimated Time**: 1-2 hours

#### 5.3.1 Create Vulnerability Configuration Types

**File**: `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/vulnerability/vulnerability-config.ts`

```typescript
import { VulnerabilityToggles, VulnerabilityToggleMetadata } from './vulnerability-toggle';

/**
 * Vulnerability mode configuration
 *
 * @remarks
 * Controls which security vulnerabilities are intentionally introduced
 * for educational purposes. All toggles are disabled by default (secure).
 *
 * **MVP**: Only DISABLE_PKCE is functional. Other toggles are defined
 * but not implemented until Phase 2/3.
 */
export interface VulnerabilityConfig {
  /** Whether vulnerability mode is enabled */
  enabled: boolean;

  /** Active vulnerability toggles */
  toggles: VulnerabilityToggles;

  /** When vulnerability config was last updated */
  lastModified: string;

  /** Warning acknowledgment (user must acknowledge risks) */
  warningAcknowledged: boolean;
}

/**
 * All vulnerability toggles (39 total, only DISABLE_PKCE active in MVP)
 *
 * @remarks
 * All toggles default to false (secure). Setting to true introduces
 * the vulnerability.
 */
export interface VulnerabilityToggles {
  // ✅ MVP - PKCE Vulnerabilities (Authorization Endpoint)
  /** Disable PKCE code_challenge/code_verifier */
  DISABLE_PKCE: boolean;

  // ❌ PHASE 2 - State/CSRF Vulnerabilities
  /** Disable state parameter */
  DISABLE_STATE: boolean;

  /** Use predictable state values */
  PREDICTABLE_STATE: boolean;

  /** Skip state verification on callback */
  SKIP_STATE_VERIFICATION: boolean;

  // ❌ PHASE 2 - Nonce Vulnerabilities (OIDC)
  /** Disable nonce parameter */
  DISABLE_NONCE: boolean;

  /** Use predictable nonce values */
  PREDICTABLE_NONCE: boolean;

  /** Skip nonce verification in ID token */
  SKIP_NONCE_VERIFICATION: boolean;

  // ❌ PHASE 2 - Redirect URI Vulnerabilities
  /** Allow lax redirect URI matching */
  LAX_REDIRECT_URI: boolean;

  /** Allow open redirects */
  ALLOW_OPEN_REDIRECT: boolean;

  /** Use pattern matching for redirect URIs */
  PATTERN_MATCHING_URI: boolean;

  // ❌ PHASE 2/3 - Token Vulnerabilities
  /** Skip JWT signature verification */
  SKIP_SIGNATURE_VERIFICATION: boolean;

  /** Skip token expiration checks */
  SKIP_EXPIRATION_CHECK: boolean;

  /** Skip issuer (iss) validation */
  SKIP_ISSUER_VALIDATION: boolean;

  /** Skip audience (aud) validation */
  SKIP_AUDIENCE_VALIDATION: boolean;

  /** Skip at_hash validation (ID token) */
  SKIP_AT_HASH: boolean;

  /** Skip c_hash validation (ID token) */
  SKIP_C_HASH: boolean;

  // ❌ PHASE 2/3 - Token Binding Vulnerabilities
  /** Disable DPoP proof */
  DISABLE_DPOP: boolean;

  /** Allow bearer token reuse */
  ALLOW_TOKEN_REUSE: boolean;

  /** Disable mTLS certificate binding */
  DISABLE_MTLS: boolean;

  // ❌ PHASE 2 - Client Authentication Vulnerabilities
  /** Skip client authentication */
  SKIP_CLIENT_AUTH: boolean;

  /** Use weak client secrets */
  WEAK_CLIENT_SECRET: boolean;

  /** Allow client_secret in query string */
  CLIENT_SECRET_IN_QUERY: boolean;

  // ❌ PHASE 2 - Scope Vulnerabilities
  /** Skip scope validation */
  SKIP_SCOPE_VALIDATION: boolean;

  /** Allow scope escalation */
  ALLOW_SCOPE_ESCALATION: boolean;

  // ❌ PHASE 2/3 - Refresh Token Vulnerabilities
  /** Disable refresh token rotation */
  DISABLE_REFRESH_ROTATION: boolean;

  /** Allow reusable refresh tokens */
  REUSABLE_REFRESH: boolean;

  /** Skip refresh token binding */
  SKIP_REFRESH_BINDING: boolean;

  // ❌ PHASE 2/3 - Transport Security
  /** Allow HTTP instead of HTTPS */
  ALLOW_HTTP: boolean;

  /** Disable certificate validation */
  SKIP_CERT_VALIDATION: boolean;

  // ❌ PHASE 2/3 - Token Leakage
  /** Allow tokens in URL fragment */
  ALLOW_FRAGMENT_TOKENS: boolean;

  /** Allow tokens in browser history */
  ALLOW_TOKENS_IN_HISTORY: boolean;

  /** Disable token encryption */
  DISABLE_TOKEN_ENCRYPTION: boolean;

  // ❌ PHASE 2/3 - Authorization Code Vulnerabilities
  /** Allow authorization code reuse */
  ALLOW_CODE_REUSE: boolean;

  /** Use predictable authorization codes */
  PREDICTABLE_AUTH_CODE: boolean;

  /** Extended authorization code lifetime */
  EXTENDED_CODE_LIFETIME: boolean;

  // ❌ PHASE 3 - UI/UX Vulnerabilities
  /** Allow clickjacking (disable X-Frame-Options) */
  ALLOW_IFRAME: boolean;

  /** Disable CORS */
  DISABLE_CORS: boolean;

  /** Allow mixed content */
  ALLOW_MIXED_CONTENT: boolean;
}

/**
 * Secure defaults (all vulnerabilities disabled)
 */
export const SECURE_DEFAULTS: VulnerabilityToggles = {
  // MVP
  DISABLE_PKCE: false,

  // Phase 2
  DISABLE_STATE: false,
  PREDICTABLE_STATE: false,
  SKIP_STATE_VERIFICATION: false,
  DISABLE_NONCE: false,
  PREDICTABLE_NONCE: false,
  SKIP_NONCE_VERIFICATION: false,
  LAX_REDIRECT_URI: false,
  ALLOW_OPEN_REDIRECT: false,
  PATTERN_MATCHING_URI: false,
  SKIP_SIGNATURE_VERIFICATION: false,
  SKIP_EXPIRATION_CHECK: false,
  SKIP_ISSUER_VALIDATION: false,
  SKIP_AUDIENCE_VALIDATION: false,
  SKIP_AT_HASH: false,
  SKIP_C_HASH: false,
  DISABLE_DPOP: false,
  ALLOW_TOKEN_REUSE: false,
  DISABLE_MTLS: false,
  SKIP_CLIENT_AUTH: false,
  WEAK_CLIENT_SECRET: false,
  CLIENT_SECRET_IN_QUERY: false,
  SKIP_SCOPE_VALIDATION: false,
  ALLOW_SCOPE_ESCALATION: false,
  DISABLE_REFRESH_ROTATION: false,
  REUSABLE_REFRESH: false,
  SKIP_REFRESH_BINDING: false,
  ALLOW_HTTP: false,
  SKIP_CERT_VALIDATION: false,
  ALLOW_FRAGMENT_TOKENS: false,
  ALLOW_TOKENS_IN_HISTORY: false,
  DISABLE_TOKEN_ENCRYPTION: false,
  ALLOW_CODE_REUSE: false,
  PREDICTABLE_AUTH_CODE: false,
  EXTENDED_CODE_LIFETIME: false,

  // Phase 3
  ALLOW_IFRAME: false,
  DISABLE_CORS: false,
  ALLOW_MIXED_CONTENT: false
};
```

#### 5.3.2 Create Vulnerability Toggle Metadata

**File**: `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/vulnerability/vulnerability-toggle.ts`

```typescript
import { VulnerabilityCategory } from './vulnerability-category';

/**
 * Metadata for a vulnerability toggle
 *
 * Provides educational context, severity, and implementation details
 */
export interface VulnerabilityToggleMetadata {
  /** Toggle key */
  key: keyof import('./vulnerability-config').VulnerabilityToggles;

  /** Human-readable name */
  name: string;

  /** Detailed description */
  description: string;

  /** Vulnerability category */
  category: VulnerabilityCategory;

  /** Severity level if enabled */
  severity: 'critical' | 'high' | 'medium' | 'low';

  /** RFC/spec references */
  rfcReferences: string[];

  /** Attack vector explanation */
  attackVector: string;

  /** Mitigation/defense explanation */
  mitigation: string;

  /** Implementation phase */
  phase: 'mvp' | 'phase-2' | 'phase-3';

  /** Whether toggle is functional in current version */
  implemented: boolean;

  /** Demo scenario suggestion */
  demoScenario?: string;
}

/**
 * Vulnerability toggle metadata registry (MVP: DISABLE_PKCE only)
 */
export const VULNERABILITY_METADATA: Record<string, VulnerabilityToggleMetadata> = {
  DISABLE_PKCE: {
    key: 'DISABLE_PKCE',
    name: 'Disable PKCE',
    description: 'Removes Proof Key for Code Exchange (PKCE) protection from authorization code flow',
    category: VulnerabilityCategory.AUTHORIZATION_ENDPOINT,
    severity: 'critical',
    rfcReferences: ['RFC 7636', 'OAuth 2.1 Section 4.1'],
    attackVector: 'Authorization code interception attack. Attacker can intercept the authorization code and exchange it for tokens.',
    mitigation: 'Always use PKCE (RFC 7636) for public clients. OAuth 2.1 requires PKCE for all authorization code flows.',
    phase: 'mvp',
    implemented: true,
    demoScenario: 'Demonstrate how an attacker with access to the authorization code can obtain tokens without PKCE protection.'
  }

  // Phase 2/3 toggles metadata will be added in future implementations
};
```

#### 5.3.3 Create Vulnerability Categories

**File**: `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/vulnerability/vulnerability-category.ts`

```typescript
/**
 * Vulnerability categories for grouping related toggles
 */
export enum VulnerabilityCategory {
  /** Authorization endpoint vulnerabilities */
  AUTHORIZATION_ENDPOINT = 'authorization_endpoint',

  /** Token endpoint vulnerabilities */
  TOKEN_ENDPOINT = 'token_endpoint',

  /** Token validation vulnerabilities */
  TOKEN_VALIDATION = 'token_validation',

  /** Client authentication vulnerabilities */
  CLIENT_AUTHENTICATION = 'client_authentication',

  /** State/CSRF vulnerabilities */
  STATE_CSRF = 'state_csrf',

  /** Redirect URI vulnerabilities */
  REDIRECT_URI = 'redirect_uri',

  /** Transport security vulnerabilities */
  TRANSPORT_SECURITY = 'transport_security',

  /** Token binding vulnerabilities */
  TOKEN_BINDING = 'token_binding',

  /** Token leakage vulnerabilities */
  TOKEN_LEAKAGE = 'token_leakage',

  /** Scope handling vulnerabilities */
  SCOPE_HANDLING = 'scope_handling',

  /** Refresh token vulnerabilities */
  REFRESH_TOKEN = 'refresh_token',

  /** UI/UX security vulnerabilities */
  UI_UX_SECURITY = 'ui_ux_security'
}

/**
 * Category display metadata
 */
export interface VulnerabilityCategoryMetadata {
  category: VulnerabilityCategory;
  name: string;
  description: string;
  icon?: string;
}

/**
 * Category metadata registry
 */
export const CATEGORY_METADATA: VulnerabilityCategoryMetadata[] = [
  {
    category: VulnerabilityCategory.AUTHORIZATION_ENDPOINT,
    name: 'Authorization Endpoint',
    description: 'Vulnerabilities related to the OAuth2 authorization endpoint',
    icon: 'shield-alert'
  },
  {
    category: VulnerabilityCategory.TOKEN_ENDPOINT,
    name: 'Token Endpoint',
    description: 'Vulnerabilities in token exchange and issuance',
    icon: 'key'
  },
  {
    category: VulnerabilityCategory.TOKEN_VALIDATION,
    name: 'Token Validation',
    description: 'JWT signature and claim validation issues',
    icon: 'file-check'
  },
  {
    category: VulnerabilityCategory.STATE_CSRF,
    name: 'State & CSRF',
    description: 'Cross-site request forgery protection',
    icon: 'shield-check'
  },
  {
    category: VulnerabilityCategory.REDIRECT_URI,
    name: 'Redirect URI',
    description: 'Redirect URI validation and open redirect issues',
    icon: 'arrow-right-circle'
  },
  {
    category: VulnerabilityCategory.TRANSPORT_SECURITY,
    name: 'Transport Security',
    description: 'HTTPS and certificate validation',
    icon: 'lock'
  }
  // Additional categories for Phase 2/3
];
```

#### 5.3.4 Create Vulnerability Index Barrel

**File**: `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/vulnerability/index.ts`

```typescript
export * from './vulnerability-config';
export * from './vulnerability-toggle';
export * from './vulnerability-category';
```

---

### 5.4 Validation Types (PRIORITY 9 - MEDIUM)

**Estimated Time**: 30 minutes

#### 5.4.1 Create Validation Result Types

**File**: `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/validation/validation-result.ts`

```typescript
/**
 * Generic validation result
 */
export interface ValidationResult<T = unknown> {
  /** Whether validation passed */
  isValid: boolean;

  /** Validated data (if valid) */
  data?: T;

  /** Validation errors (if invalid) */
  errors?: ValidationError[];

  /** Validation warnings (non-critical issues) */
  warnings?: ValidationWarning[];
}

/**
 * Token-specific validation result
 */
export interface TokenValidationResult {
  /** Whether token is valid */
  isValid: boolean;

  /** Signature validation result */
  signatureValid: boolean;

  /** Token expiration status */
  isExpired: boolean;

  /** Issuer validation result */
  issuerValid: boolean;

  /** Audience validation result */
  audienceValid: boolean;

  /** Individual claim validations */
  claimValidations: Record<string, boolean>;

  /** Validation errors */
  errors?: ValidationError[];

  /** Time remaining until expiration (milliseconds) */
  timeRemaining?: number;
}
```

#### 5.4.2 Create Validation Error Types

**File**: `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/validation/validation-error.ts`

```typescript
/**
 * Validation error
 */
export interface ValidationError {
  /** Error code */
  code: string;

  /** Human-readable error message */
  message: string;

  /** Field that failed validation */
  field?: string;

  /** Error severity */
  severity: 'error' | 'warning';

  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Validation warning (non-critical)
 */
export interface ValidationWarning {
  /** Warning code */
  code: string;

  /** Human-readable warning message */
  message: string;

  /** Field that triggered warning */
  field?: string;

  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * OAuth2 error response (RFC 6749 Section 5.2)
 */
export interface OAuth2Error {
  /** Error code */
  error: OAuth2ErrorCode;

  /** Human-readable error description */
  error_description?: string;

  /** URI with error information */
  error_uri?: string;

  /** State parameter (if present in request) */
  state?: string;
}

/**
 * OAuth2 error codes (RFC 6749)
 */
export type OAuth2ErrorCode =
  | 'invalid_request'
  | 'invalid_client'
  | 'invalid_grant'
  | 'unauthorized_client'
  | 'unsupported_grant_type'
  | 'invalid_scope'
  | 'access_denied'
  | 'server_error'
  | 'temporarily_unavailable';

/**
 * Application error
 */
export interface AppError {
  /** Error code */
  code: string;

  /** Error message */
  message: string;

  /** HTTP status code */
  statusCode?: number;

  /** Original error (if wrapping) */
  cause?: Error;

  /** Stack trace */
  stack?: string;
}
```

#### 5.4.3 Create Validators Type Signatures

**File**: `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/validation/validators.ts`

```typescript
import { ValidationResult, TokenValidationResult } from './validation-result';
import { PKCEParams } from '../security/pkce';
import { StateParam } from '../security/state';
import { NonceParam } from '../security/nonce';

/**
 * Validator function type signatures
 *
 * @remarks
 * These are type definitions only. Actual implementations are in
 * backend/frontend services.
 */

/**
 * PKCE validator signature
 */
export type PKCEValidator = (
  codeVerifier: string,
  codeChallenge: string
) => ValidationResult<PKCEParams>;

/**
 * State validator signature
 */
export type StateValidator = (
  receivedState: string,
  expectedState: string
) => ValidationResult<StateParam>;

/**
 * Nonce validator signature
 */
export type NonceValidator = (
  receivedNonce: string,
  expectedNonce: string
) => ValidationResult<NonceParam>;

/**
 * Token validator signature
 */
export type TokenValidator = (
  token: string,
  options?: TokenValidationOptions
) => Promise<TokenValidationResult>;

/**
 * Token validation options
 */
export interface TokenValidationOptions {
  /** Expected issuer */
  issuer?: string;

  /** Expected audience */
  audience?: string | string[];

  /** Clock tolerance in seconds */
  clockTolerance?: number;

  /** Whether to verify signature */
  verifySignature?: boolean;

  /** JWKS for signature verification */
  jwks?: unknown; // Defined in discovery/jwks.ts
}
```

#### 5.4.4 Create Validation Index Barrel

**File**: `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/validation/index.ts`

```typescript
export * from './validation-result';
export * from './validation-error';
export * from './validators';
```

---

### 5.5 Utility Types (PRIORITY 1 - FOUNDATION)

**Estimated Time**: 30 minutes

#### 5.5.1 Create Common Utility Types

**File**: `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/utils/common.ts`

```typescript
/**
 * Common utility type aliases
 */

/** ISO 8601 timestamp string */
export type Timestamp = string;

/** URL string */
export type URL = string;

/** Base64-encoded string */
export type Base64String = string;

/** Base64URL-encoded string (RFC 4648) */
export type Base64URLString = string;

/** JSON Web Token string (header.payload.signature) */
export type JWTString = string;

/** UUID v4 string */
export type UUID = string;

/** Unix timestamp (seconds since epoch) */
export type UnixTimestamp = number;

/**
 * Deep partial type (makes all nested properties optional)
 */
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

/**
 * Deep readonly type (makes all nested properties readonly)
 */
export type DeepReadonly<T> = T extends object
  ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
  : T;

/**
 * Require specific properties of a type
 */
export type RequireProps<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make specific properties optional
 */
export type PartialProps<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Discriminated union helper
 */
export type DiscriminatedUnion<K extends PropertyKey, T extends object> = {
  [P in keyof T]: { [Q in K]: P } & T[P];
}[keyof T];
```

#### 5.5.2 Create Branded Types

**File**: `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/utils/branded-types.ts`

```typescript
/**
 * Branded/Nominal type system for type-safe primitives
 *
 * @remarks
 * Prevents mixing up semantically different strings/numbers at compile time.
 *
 * @example
 * ```typescript
 * const clientId: ClientId = 'my-client' as ClientId;
 * const userId: UserId = 'user-123' as UserId;
 *
 * // This would fail TypeScript compilation:
 * // const wrongId: ClientId = userId; // Error!
 * ```
 */

declare const brand: unique symbol;

/**
 * Branded type helper
 */
export type Branded<T, B> = T & { readonly [brand]: B };

/**
 * OAuth2/OIDC branded types
 */

/** Client ID (unique identifier for OAuth2 client) */
export type ClientId = Branded<string, 'ClientId'>;

/** User ID (subject identifier) */
export type UserId = Branded<string, 'UserId'>;

/** Flow execution ID */
export type FlowId = Branded<string, 'FlowId'>;

/** Authorization code */
export type AuthorizationCode = Branded<string, 'AuthorizationCode'>;

/** Access token string */
export type AccessTokenString = Branded<string, 'AccessToken'>;

/** Refresh token string */
export type RefreshTokenString = Branded<string, 'RefreshToken'>;

/** ID token string */
export type IDTokenString = Branded<string, 'IDToken'>;

/** PKCE code verifier */
export type CodeVerifier = Branded<string, 'CodeVerifier'>;

/** PKCE code challenge */
export type CodeChallenge = Branded<string, 'CodeChallenge'>;

/** State parameter value */
export type StateValue = Branded<string, 'StateValue'>;

/** Nonce parameter value */
export type NonceValue = Branded<string, 'NonceValue'>;

/** Scope string (space-separated scopes) */
export type ScopeString = Branded<string, 'ScopeString'>;

/** Issuer URL */
export type IssuerURL = Branded<string, 'IssuerURL'>;

/** Redirect URI */
export type RedirectURI = Branded<string, 'RedirectURI'>;

/**
 * Brand helper functions
 */

export function asClientId(value: string): ClientId {
  return value as ClientId;
}

export function asUserId(value: string): UserId {
  return value as UserId;
}

export function asFlowId(value: string): FlowId {
  return value as FlowId;
}

export function asAuthorizationCode(value: string): AuthorizationCode {
  return value as AuthorizationCode;
}

export function asCodeVerifier(value: string): CodeVerifier {
  return value as CodeVerifier;
}

export function asCodeChallenge(value: string): CodeChallenge {
  return value as CodeChallenge;
}

export function asStateValue(value: string): StateValue {
  return value as StateValue;
}

export function asNonceValue(value: string): NonceValue {
  return value as NonceValue;
}
```

#### 5.5.3 Create Utils Index Barrel

**File**: `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/utils/index.ts`

```typescript
export * from './common';
export * from './branded-types';
```

---

### 5.6 Main Index Barrel Export

**File**: `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/index.ts`

```typescript
/**
 * AuthOptics Shared Types
 *
 * Centralized TypeScript type definitions for the AuthOptics monorepo.
 * All packages (frontend, backend, mock-resource-server) import from this package.
 *
 * @packageDocumentation
 */

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

---

## 6. Build Configuration

### 6.1 Build the Package

```bash
cd /home/toffer/auth-optics-workspace/auth-optics/packages/shared
pnpm build
```

**Expected Output**:
```
> @auth-optics/shared@1.0.0 build
> tsc

[No errors]
```

### 6.2 Verify Build Output

```bash
ls -la dist/
```

**Expected Files**:
- `index.js` - Compiled JavaScript
- `index.d.ts` - Type definitions
- `*.d.ts.map` - Declaration maps
- Directory structure matching `src/`

### 6.3 Verify Type Exports

```bash
cd /home/toffer/auth-optics-workspace/auth-optics/packages/shared
cat dist/index.d.ts | head -50
```

Should show exported types from all categories.

---

## 7. Validation & Testing

### 7.1 Type Check

```bash
cd /home/toffer/auth-optics-workspace/auth-optics/packages/shared
pnpm type-check
```

**Expected Output**: No errors

### 7.2 Create Test Import File

Create a test file to verify all types are importable:

**File**: `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/test-imports.ts`

```typescript
/**
 * Test file to verify all types can be imported
 */

import {
  // Flows
  FlowType,
  FlowStatus,
  FlowExecution,
  FlowStep,

  // Tokens (if implemented, check actual status)
  // AccessToken,
  // IDToken,
  // JWT,
  // TokenResponse,

  // HTTP
  HttpRequest,
  HttpResponse,
  HttpMethod,
  HttpHeaders,

  // Security
  PKCEParams,
  PKCEValidationResult,
  StateParam,
  StateValidationResult,
  NonceParam,
  SecurityAssessment,
  SecurityIndicator,

  // Vulnerability
  VulnerabilityConfig,
  VulnerabilityToggles,
  SECURE_DEFAULTS,
  VulnerabilityCategory,

  // Validation
  ValidationResult,
  ValidationError,
  TokenValidationResult,
  OAuth2Error,

  // Utils
  Timestamp,
  URL,
  Base64String,
  ClientId,
  FlowId,
  asClientId,
  asFlowId
} from './src';

// Type assertions to verify types exist
const testFlow: FlowExecution = {} as FlowExecution;
const testRequest: HttpRequest = {} as HttpRequest;
const testPKCE: PKCEParams = {} as PKCEParams;
const testConfig: VulnerabilityConfig = {} as VulnerabilityConfig;
const testValidation: ValidationResult = {} as ValidationResult;

console.log('All types imported successfully!');
```

Run type check:
```bash
npx tsc --noEmit test-imports.ts
```

### 7.3 Verify Package Exports

```bash
cd /home/toffer/auth-optics-workspace/auth-optics
node -e "const pkg = require('./packages/shared/package.json'); console.log('Package name:', pkg.name); console.log('Main:', pkg.main); console.log('Types:', pkg.types);"
```

---

## 8. Integration Verification

### 8.1 Test Import from Another Package

Create a test backend package structure to verify imports work:

```bash
cd /home/toffer/auth-optics-workspace/auth-optics
mkdir -p packages/backend-test
cd packages/backend-test

cat > package.json <<EOF
{
  "name": "@auth-optics/backend-test",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@auth-optics/shared": "workspace:*"
  }
}
EOF

cat > test-import.ts <<EOF
import { FlowExecution, HttpRequest, PKCEParams } from '@auth-optics/shared';

const flow: FlowExecution = {
  id: 'test',
  flowType: 'authorization_code_pkce' as any,
  status: 'idle' as any,
  startedAt: new Date().toISOString(),
  steps: [],
  config: {} as any
};

console.log('Import successful!', flow.id);
EOF
```

Install dependencies and test:
```bash
pnpm install
npx tsx test-import.ts
```

**Expected Output**: `Import successful! test`

### 8.2 Verify IntelliSense

Open VS Code and verify:
- Type completions work when importing from `@auth-optics/shared`
- Hover tooltips show JSDoc comments
- Go-to-definition works for imported types

### 8.3 Clean Up Test Package

```bash
rm -rf /home/toffer/auth-optics-workspace/auth-optics/packages/backend-test
```

---

## 9. Troubleshooting Guide

### 9.1 Common Issues

#### Issue 1: "Cannot find module '@auth-optics/shared'"

**Cause**: Package not installed in workspace

**Solution**:
```bash
cd /home/toffer/auth-optics-workspace/auth-optics
pnpm install
```

#### Issue 2: "Module has no exported member 'XYZ'"

**Cause**: Type not exported in barrel file

**Solution**: Check that type is exported in:
1. Category index.ts (e.g., `src/http/index.ts`)
2. Main index.ts (`src/index.ts`)

#### Issue 3: TypeScript compilation errors

**Cause**: Strict mode catches issues

**Solution**:
- Ensure all required fields are marked as required
- Use `readonly` for immutable fields
- Add JSDoc comments for complex types

#### Issue 4: Circular dependency warnings

**Cause**: Types import each other

**Solution**:
- Use forward declarations: `import type { X } from './module'`
- Restructure types to break cycles
- Move shared types to a common file

### 9.2 Verification Checklist

Before marking the package complete, verify:

- [ ] All TypeScript files compile without errors
- [ ] `pnpm build` succeeds
- [ ] `dist/` directory contains compiled output
- [ ] All types are exported in main `index.ts`
- [ ] Test imports work from other packages
- [ ] IntelliSense shows JSDoc comments
- [ ] No circular dependency warnings
- [ ] Package version is 1.0.0
- [ ] Package name is `@auth-optics/shared`

### 9.3 Post-Implementation Tasks

After completing implementation:

1. **Update ROADMAP.md**:
   - Mark shared types package as 100% complete
   - Update "Current Project Status" table
   - Update "Next Actions" section

2. **Update docs/context/current-phase.md**:
   - Document completion of shared types
   - List next component to implement (backend or KeyCloak)

3. **Commit changes**:
   ```bash
   git add packages/shared
   git commit -m "feat(shared): implement shared types package

   - Complete HTTP types (request, response, headers)
   - Complete security types (PKCE, state, nonce, assessment)
   - Complete vulnerability types (config, toggles, categories)
   - Complete validation types (results, errors, validators)
   - Complete utility types (common, branded)
   - Add comprehensive JSDoc comments
   - Configure TypeScript strict mode
   - Verify package builds and exports correctly

   Phase 1 - Foundation: Shared Types (100% complete)
   "
   ```

---

## 10. Exit Criteria Verification

The shared types package is complete when:

✅ **All packages can import from `@auth-optics/shared`**
- [x] Test import succeeds from backend-test package
- [x] IntelliSense works in VS Code
- [x] Type definitions are available

✅ **All MVP-required types are implemented**
- [x] HTTP types (request, response, headers)
- [x] Security types (PKCE, state, nonce, assessment)
- [x] Vulnerability types (config with 39 toggles defined)
- [x] Validation types (results, errors)
- [x] Utility types (common, branded)

✅ **Package builds successfully**
- [x] `pnpm build` completes without errors
- [x] `dist/` directory contains all type definitions
- [x] Declaration maps are generated

✅ **Code quality standards met**
- [x] TypeScript strict mode enabled
- [x] JSDoc comments on all exported types
- [x] No `any` types except where necessary
- [x] Consistent naming conventions followed

---

## Appendix A: Quick Command Reference

### Essential Commands

```bash
# Navigate to shared package
cd /home/toffer/auth-optics-workspace/auth-optics/packages/shared

# Install dependencies
pnpm install

# Build package
pnpm build

# Type check without building
pnpm type-check

# Clean build artifacts
pnpm clean

# Watch mode for development
pnpm watch

# Test from root
cd /home/toffer/auth-optics-workspace/auth-optics
pnpm build:shared
```

### File Operations

```bash
# Create a new type file
touch src/category/new-type.ts

# Add export to category index
echo "export * from './new-type';" >> src/category/index.ts

# Rebuild and verify
pnpm build && pnpm type-check
```

---

## Appendix B: File Template

**Template for new type file**:

```typescript
/**
 * [Type Category] - [Brief Description]
 *
 * @remarks
 * [Detailed explanation, RFC references, usage notes]
 *
 * @see [Related types or documentation]
 */

/**
 * [Type Name]
 *
 * [Description of what this type represents]
 */
export interface TypeName {
  /** [Field description] */
  readonly field1: string;

  /** [Field description] */
  field2: number;

  /** [Optional field description] */
  optionalField?: boolean;
}

/**
 * [Enum Name]
 *
 * [Description of enum purpose]
 */
export enum EnumName {
  VALUE_ONE = 'value_one',
  VALUE_TWO = 'value_two'
}
```

---

## Document Metadata

| Property | Value |
|----------|-------|
| **Plan Version** | 1.1.0 (Revised) |
| **Created** | December 24, 2025 |
| **Revised** | December 24, 2025 |
| **Target Component** | packages/shared |
| **Estimated Effort** | 12-18 hours (total, from 0%) |
| **Prerequisite** | Node.js 20.x, pnpm 8.x |
| **Exit Criteria** | All packages can import from @auth-optics/shared |
| **Next Component** | Backend (packages/backend) or KeyCloak setup |

---

**End of Implementation Plan**
