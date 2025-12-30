# Detailed Implementation Plan: Shared Types Day 1 - Foundation Types

## Document Information

| Property | Value |
|----------|-------|
| **Component** | packages/shared (Day 1 implementation) |
| **Plan Date** | December 30, 2025 |
| **Based On** | @docs/implementation-plans/plan-shared-types-package-2025-12-24.md Section 4.2 Day 1 |
| **Estimated Duration** | 4-6 hours |
| **Phase** | Phase 1 - Foundation |
| **Status** | Ready for Implementation |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Session 1: Utilities & Flow Types](#3-session-1-utilities--flow-types)
4. [Session 2: Token & HTTP Types](#4-session-2-token--http-types)
5. [Verification Procedures](#5-verification-procedures)
6. [Troubleshooting](#6-troubleshooting)
7. [Exit Criteria](#7-exit-criteria)

---

## 1. Overview

### 1.1 Purpose

This detailed plan breaks down **Day 1** of the Shared Types Package implementation into executable step-by-step tasks. Day 1 focuses on **Foundation Types**: utilities, flows, tokens, and HTTP communication primitives.

**Day 1 Deliverables:**
- ✅ Utility types (common.ts, branded-types.ts)
- ✅ Flow types (flow-types.ts, flow-steps.ts, authorization-code.ts)
- ✅ Token types (jwt.ts, access-token.ts, refresh-token.ts, id-token.ts, token-response.ts)
- ✅ HTTP types (request.ts, response.ts, headers.ts)
- ✅ Barrel exports for all implemented categories

### 1.2 Implementation Strategy

**Priority Order (Critical Path):**
1. **Utility Types FIRST** - Foundation for all other types (branded types, common utilities)
2. **Flow Types** - Core flow execution and step tracking
3. **Token Types** - JWT structure, access tokens, ID tokens
4. **HTTP Types** - Request/response capture for visualization

**Why This Order:**
- Utility types provide primitives (Timestamp, ClientId, FlowId) used throughout
- Flow types depend on utilities but not tokens
- Token types depend on utilities
- HTTP types are independent but referenced by flow steps

### 1.3 Time Estimates

| Session | Tasks | Estimated Time | Files Created |
|---------|-------|----------------|---------------|
| **Session 1** | Utilities + Flow Types | 2.5-4 hours | 5 files |
| **Session 2** | Token + HTTP Types | 2-3 hours | 8 files |
| **TOTAL** | **Day 1 Complete** | **4.5-7 hours** | **13 files** |

---

## 2. Prerequisites

### 2.1 Verify Infrastructure Complete

Before starting implementation, verify that the infrastructure setup from PR #7 is merged and ready:

**Step 2.1.1: Check Git Status**
```bash
cd /home/toffer/auth-optics-workspace/auth-optics
git status
git log -1 --oneline
```

**Expected:** PR #7 merged, infrastructure complete

**Step 2.1.2: Verify Directory Structure**
```bash
ls -la packages/shared/src/
```

**Expected directories:**
- flows/
- tokens/
- http/
- security/
- vulnerability/
- config/
- discovery/
- validation/
- ui/
- events/
- utils/

**Step 2.1.3: Verify Build Works**
```bash
cd /home/toffer/auth-optics-workspace/auth-optics/packages/shared
pnpm build
```

**Expected:** TypeScript compiles successfully (no source files yet, so empty dist/)

**Step 2.1.4: Verify TypeScript Configuration**
```bash
cat tsconfig.json | grep -E "(strict|target|module)"
```

**Expected:**
- `"strict": true`
- `"target": "ES2020"`
- `"module": "commonjs"`

### 2.2 Required Context Documents

Before implementation, ensure you have access to:
- ✅ @docs/specs/auth-optics-shared-types-specification.md (Sections 5-14 for type definitions)
- ✅ @docs/implementation-plans/plan-shared-types-package-2025-12-24.md (Master plan)
- ✅ @ROADMAP.md (Project roadmap)

### 2.3 Tool Declaration (Markdown Files)

**IMPORTANT:** Before modifying any markdown files (like index.ts barrel exports), declare tool choice:

> **Tool Choice:** Edit tool (for .ts files), never bash text manipulation

---

## 3. Session 1: Utilities & Flow Types

**Estimated Time:** 2.5-4 hours

### 3.1 Implement Utility Types (30 min)

#### Task 3.1.1: Create Common Utility Types

**File:** `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/utils/common.ts`

**Instructions:**
1. Use the **Edit** tool (or **Write** for new file creation)
2. Implement ALL utility types from Section 5.5.1 of the master plan
3. Include JSDoc comments for all type aliases

**Type Checklist:**
- [ ] `Timestamp` - ISO 8601 timestamp string
- [ ] `URL` - URL string
- [ ] `Base64String` - Base64-encoded string
- [ ] `Base64URLString` - Base64URL-encoded string (RFC 4648)
- [ ] `JWTString` - JWT string (header.payload.signature)
- [ ] `UUID` - UUID v4 string
- [ ] `UnixTimestamp` - Unix timestamp (seconds since epoch)
- [ ] `DeepPartial<T>` - Deep partial type helper
- [ ] `DeepReadonly<T>` - Deep readonly type helper
- [ ] `RequireProps<T, K>` - Require specific properties
- [ ] `PartialProps<T, K>` - Make specific properties optional
- [ ] `DiscriminatedUnion<K, T>` - Discriminated union helper

**Verification:**
```bash
npx tsc --noEmit src/utils/common.ts
```

**Expected:** No TypeScript errors

---

#### Task 3.1.2: Create Branded Types

**File:** `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/utils/branded-types.ts`

**Instructions:**
1. Implement ALL branded types from Section 5.5.2 of the master plan
2. Include the `brand` symbol and `Branded<T, B>` helper
3. Implement helper functions (asClientId, asFlowId, etc.)

**Type Checklist:**
- [ ] `Branded<T, B>` - Generic branded type helper
- [ ] `ClientId` - Client identifier
- [ ] `UserId` - User/subject identifier
- [ ] `FlowId` - Flow execution identifier
- [ ] `AuthorizationCode` - Authorization code
- [ ] `AccessTokenString` - Access token string
- [ ] `RefreshTokenString` - Refresh token string
- [ ] `IDTokenString` - ID token string
- [ ] `CodeVerifier` - PKCE code verifier
- [ ] `CodeChallenge` - PKCE code challenge
- [ ] `StateValue` - State parameter value
- [ ] `NonceValue` - Nonce parameter value
- [ ] `ScopeString` - Scope string (space-separated)
- [ ] `IssuerURL` - Issuer URL
- [ ] `RedirectURI` - Redirect URI

**Helper Functions:**
- [ ] `asClientId(value: string): ClientId`
- [ ] `asUserId(value: string): UserId`
- [ ] `asFlowId(value: string): FlowId`
- [ ] `asAuthorizationCode(value: string): AuthorizationCode`
- [ ] `asCodeVerifier(value: string): CodeVerifier`
- [ ] `asCodeChallenge(value: string): CodeChallenge`
- [ ] `asStateValue(value: string): StateValue`
- [ ] `asNonceValue(value: string): NonceValue`

**Verification:**
```bash
npx tsc --noEmit src/utils/branded-types.ts
```

---

#### Task 3.1.3: Create Utils Index Barrel

**File:** `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/utils/index.ts`

**Content:**
```typescript
export * from './common';
export * from './branded-types';
```

**Verification:**
```bash
npx tsc --noEmit src/utils/index.ts
```

---

### 3.2 Implement Flow Types (2-3 hours)

#### Task 3.2.1: Create Core Flow Types

**File:** `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/flows/flow-types.ts`

**Reference:** Section 5.1 of auth-optics-shared-types-specification.md (lines 396-558)

**Instructions:**
1. Read specification Section 5.1 carefully
2. Implement ALL types EXACTLY as specified
3. Import utility types from `../utils`

**Type Checklist:**
- [ ] `FlowType` enum (AUTHORIZATION_CODE_PKCE in MVP, others for future)
- [ ] `FlowStatus` enum (IDLE, RUNNING, COMPLETE, ERROR, CANCELLED)
- [ ] `FlowExecution` interface (complete flow execution instance)
- [ ] `FlowTokens` interface (tokens obtained from flow)
- [ ] `FlowError` interface (flow execution error)
- [ ] `FlowConfig` interface (flow configuration)

**Critical Details:**
- `FlowExecution.id` should use `FlowId` branded type from utils
- All timestamps should use `Timestamp` from utils
- Mark appropriate fields as `readonly`
- Include comprehensive JSDoc comments

**JSDoc Requirements:**
- [ ] Explain what FlowType enum values represent
- [ ] Document FlowExecution as "single execution instance"
- [ ] Reference RFCs where applicable (e.g., PKCE = RFC 7636)
- [ ] Note MVP vs Phase 2/3 distinctions in comments

**Verification:**
```bash
npx tsc --noEmit src/flows/flow-types.ts
```

---

#### Task 3.2.2: Create Flow Step Types

**File:** `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/flows/flow-steps.ts`

**Reference:** Section 5.2 of auth-optics-shared-types-specification.md (lines 560-669)

**Type Checklist:**
- [ ] `FlowStep` interface (individual flow step)
- [ ] `StepStatus` enum (PENDING, RUNNING, COMPLETE, WARNING, ERROR, SKIPPED)
- [ ] `StepMetadata` interface (additional step metadata)
- [ ] `RFCReference` interface (RFC section references)

**Import Dependencies:**
- `HttpRequest`, `HttpResponse` from `../http` (will implement later, use type imports)
- `SecurityIndicator` from `../security` (stub for now)
- `ValidationResult` from `../validation` (stub for now)

**Forward Declaration Pattern:**
```typescript
// Use type-only imports to avoid circular dependencies
import type { HttpRequest, HttpResponse } from '../http';
import type { SecurityIndicator } from '../security';
import type { ValidationResult } from '../validation';
```

**Note:** These imports will resolve once we implement the referenced types

**Verification:**
```bash
npx tsc --noEmit src/flows/flow-steps.ts
```

---

#### Task 3.2.3: Create Authorization Code Flow Types

**File:** `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/flows/authorization-code.ts`

**Reference:** Section 5.3 of auth-optics-shared-types-specification.md (lines 671-782)

**Type Checklist:**
- [ ] `AuthorizationRequest` interface (RFC 6749 §4.1.1)
- [ ] `AuthorizationResponse` interface (RFC 6749 §4.1.2)
- [ ] `AuthorizationErrorResponse` interface (RFC 6749 §4.1.2.1)
- [ ] `AuthorizationErrorCode` type (union of error codes)
- [ ] `TokenRequest` interface (RFC 6749 §4.1.3)

**Critical RFC Compliance:**
- [ ] REQUIRED fields marked with JSDoc "REQUIRED"
- [ ] OPTIONAL fields marked with JSDoc "OPTIONAL"
- [ ] RECOMMENDED fields noted as "RECOMMENDED"
- [ ] `code_challenge_method` limited to 'S256' | 'plain'
- [ ] `response_type` must be 'code' for authorization code flow

**Verification:**
```bash
npx tsc --noEmit src/flows/authorization-code.ts
```

---

#### Task 3.2.4: Create Flows Index Barrel

**File:** `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/flows/index.ts`

**Content:**
```typescript
export * from './flow-types';
export * from './flow-steps';
export * from './authorization-code';

// Future flows (Phase 2) - not exported in MVP
// export * from './client-credentials';
// export * from './device-authorization';
// export * from './refresh-token';
```

**Verification:**
```bash
npx tsc --noEmit src/flows/index.ts
```

---

### 3.3 Session 1 Checkpoint

**After completing Section 3.2.4, verify:**

```bash
cd /home/toffer/auth-optics-workspace/auth-optics/packages/shared

# Type check all files created so far
npx tsc --noEmit src/utils/common.ts
npx tsc --noEmit src/utils/branded-types.ts
npx tsc --noEmit src/utils/index.ts
npx tsc --noEmit src/flows/flow-types.ts
npx tsc --noEmit src/flows/flow-steps.ts
npx tsc --noEmit src/flows/authorization-code.ts
npx tsc --noEmit src/flows/index.ts

# Try building the package
pnpm build
```

**Expected Results:**
- ✅ No TypeScript compilation errors
- ✅ Build produces `dist/utils/` and `dist/flows/` directories
- ✅ Declaration files (*.d.ts) generated for all types

**Session 1 Deliverables:**
- ✅ 2 utility type files (common.ts, branded-types.ts)
- ✅ 3 flow type files (flow-types.ts, flow-steps.ts, authorization-code.ts)
- ✅ 2 index barrel files (utils/index.ts, flows/index.ts)
- ✅ **Total: 7 files**

---

## 4. Session 2: Token & HTTP Types

**Estimated Time:** 2-3 hours

### 4.1 Implement Token Types (2-3 hours)

#### Task 4.1.1: Create JWT Base Types

**File:** `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/tokens/jwt.ts`

**Reference:** Section 6 of auth-optics-shared-types-specification.md (Token Types)

**Instructions:**
1. Read spec carefully for JWT structure requirements
2. Implement base JWT types used by all token types

**Type Checklist:**
- [ ] `JWT` interface (complete JWT structure)
- [ ] `JWTHeader` interface (JOSE header)
- [ ] `JWTPayload` interface (standard claims)
- [ ] `RegisteredClaims` interface (RFC 7519 registered claims)

**Import Dependencies:**
```typescript
import { Timestamp, UnixTimestamp, JWTString, IssuerURL } from '../utils';
```

**Key Fields:**
- `JWT.raw` - Raw JWT string
- `JWT.header` - Decoded JOSE header
- `JWT.payload` - Decoded claims
- `JWT.signature` - Base64URL-encoded signature
- `JWTPayload.iss` - Issuer (use IssuerURL branded type)
- `JWTPayload.sub` - Subject (use UserId branded type)
- `JWTPayload.exp` - Expiration (UnixTimestamp)
- `JWTPayload.iat` - Issued at (UnixTimestamp)

**JSDoc Requirements:**
- [ ] Reference RFC 7519 for JWT structure
- [ ] Document registered claims per spec
- [ ] Note security considerations for signature verification

**Verification:**
```bash
npx tsc --noEmit src/tokens/jwt.ts
```

---

#### Task 4.1.2: Create Access Token Types

**File:** `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/tokens/access-token.ts`

**Reference:** Section 6.1 of auth-optics-shared-types-specification.md

**Type Checklist:**
- [ ] `AccessToken` interface (access token structure)
- [ ] `AccessTokenPayload` interface (JWT access token payload - RFC 9068)
- [ ] `AccessTokenMetadata` interface (metadata for access token)

**Critical Details:**
- `AccessToken.isJWT` - Boolean flag (true for JWT, false for opaque)
- `AccessToken.payload` - Optional (only if JWT)
- `AccessTokenPayload` extends standard JWT claims
- Include scope handling (`scope` claim as space-separated string)

**Import Dependencies:**
```typescript
import { JWTString, Timestamp, UnixTimestamp, ClientId } from '../utils';
import { JWTPayload } from './jwt';
```

**Verification:**
```bash
npx tsc --noEmit src/tokens/access-token.ts
```

---

#### Task 4.1.3: Create ID Token Types (OIDC)

**File:** `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/tokens/id-token.ts`

**Reference:** Section 6 of auth-optics-shared-types-specification.md

**Type Checklist:**
- [ ] `IDToken` interface (OIDC ID token)
- [ ] `IDTokenPayload` interface (OIDC Core claims)
- [ ] `IDTokenMetadata` interface (ID token metadata)

**OIDC-Specific Claims:**
- `nonce` - Nonce parameter binding
- `at_hash` - Access token hash (for validation)
- `c_hash` - Authorization code hash (for validation)
- `auth_time` - Authentication timestamp
- `acr` - Authentication context class reference
- `amr` - Authentication methods references

**Import Dependencies:**
```typescript
import { NonceValue, Timestamp, UnixTimestamp } from '../utils';
import { JWTPayload } from './jwt';
```

**JSDoc Requirements:**
- [ ] Reference OIDC Core Section 2 for ID token purpose
- [ ] Document hash validation requirements (at_hash, c_hash)
- [ ] Note that ID tokens are NOT access tokens (common mistake)

**Verification:**
```bash
npx tsc --noEmit src/tokens/id-token.ts
```

---

#### Task 4.1.4: Create Refresh Token Types

**File:** `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/tokens/refresh-token.ts`

**Reference:** Section 6 of auth-optics-shared-types-specification.md

**Type Checklist:**
- [ ] `RefreshToken` interface (refresh token structure)
- [ ] `RefreshTokenMetadata` interface (refresh token metadata)

**MVP Note:** Basic structure only. Full refresh token rotation and flow logic in Phase 2.

**Import Dependencies:**
```typescript
import { RefreshTokenString, Timestamp } from '../utils';
```

**Verification:**
```bash
npx tsc --noEmit src/tokens/refresh-token.ts
```

---

#### Task 4.1.5: Create Token Response Types

**File:** `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/tokens/token-response.ts`

**Reference:** RFC 6749 Section 5.1

**Type Checklist:**
- [ ] `TokenResponse` interface (successful token endpoint response)
- [ ] `TokenErrorResponse` interface (token endpoint error response)
- [ ] `TokenErrorCode` type (union of OAuth2 token error codes)

**Token Response Fields (RFC 6749 §5.1):**
- `access_token` - REQUIRED
- `token_type` - REQUIRED (typically "Bearer")
- `expires_in` - RECOMMENDED
- `refresh_token` - OPTIONAL
- `scope` - OPTIONAL (if differs from requested)
- `id_token` - OIDC only

**Token Error Codes (RFC 6749 §5.2):**
- `invalid_request`
- `invalid_client`
- `invalid_grant`
- `unauthorized_client`
- `unsupported_grant_type`
- `invalid_scope`

**Verification:**
```bash
npx tsc --noEmit src/tokens/token-response.ts
```

---

#### Task 4.1.6: Create Tokens Index Barrel

**File:** `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/tokens/index.ts`

**Content:**
```typescript
export * from './jwt';
export * from './access-token';
export * from './id-token';
export * from './refresh-token';
export * from './token-response';
```

**Verification:**
```bash
npx tsc --noEmit src/tokens/index.ts
```

---

### 4.2 Implement HTTP Types (1-2 hours)

#### Task 4.2.1: Create HTTP Request Types

**File:** `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/http/request.ts`

**Reference:** Section 5.1 of plan-shared-types-package-2025-12-24.md

**Type Checklist:**
- [ ] `HttpRequest` interface (HTTP request representation)
- [ ] `HttpMethod` enum (GET, POST, PUT, DELETE, etc.)
- [ ] `HttpRequestBody` discriminated union (none, json, form, text, binary)

**Import Dependencies:**
```typescript
import { Timestamp, UUID } from '../utils';
import { HttpHeaders } from './headers';
```

**Critical Details:**
- `requestId` - UUID for correlation with response
- `timestamp` - ISO 8601 timestamp
- `body` - Discriminated union with `type` field
- Use readonly for immutable fields

**Verification:**
```bash
npx tsc --noEmit src/http/request.ts
```

---

#### Task 4.2.2: Create HTTP Response Types

**File:** `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/http/response.ts`

**Reference:** Section 5.1 of plan-shared-types-package-2025-12-24.md

**Type Checklist:**
- [ ] `HttpResponse` interface (HTTP response representation)
- [ ] `HttpResponseBody` discriminated union (none, json, text, html, binary, error)
- [ ] `HttpStatusCategory` enum (1xx, 2xx, 3xx, 4xx, 5xx)
- [ ] `getStatusCategory(statusCode: number)` helper function

**Critical Details:**
- `responseTime` - Duration in milliseconds
- `requestId` - Matches request for correlation
- Status code categorization helper

**Verification:**
```bash
npx tsc --noEmit src/http/response.ts
```

---

#### Task 4.2.3: Create HTTP Headers Types

**File:** `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/http/headers.ts`

**Reference:** Section 5.1 of plan-shared-types-package-2025-12-24.md

**Type Checklist:**
- [ ] `HttpHeaders` type (Record<string, string | string[]>)
- [ ] `CommonHeaders` constant object (lowercase header names)
- [ ] `ContentTypes` constant object (content-type values)

**CommonHeaders to include:**
- `content-type`, `content-length`, `user-agent`, `accept`
- `authorization`, `www-authenticate`
- `access-control-allow-origin`, `access-control-allow-credentials`
- `strict-transport-security`, `x-frame-options`
- `cache-control`, `location`

**ContentTypes to include:**
- `application/json`
- `application/x-www-form-urlencoded`
- `text/html`
- `text/plain`
- `application/jwt`

**Verification:**
```bash
npx tsc --noEmit src/http/headers.ts
```

---

#### Task 4.2.4: Create HTTP Index Barrel

**File:** `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/src/http/index.ts`

**Content:**
```typescript
export * from './request';
export * from './response';
export * from './headers';
```

**Verification:**
```bash
npx tsc --noEmit src/http/index.ts
```

---

### 4.3 Session 2 Checkpoint

**After completing Section 4.2.4, verify:**

```bash
cd /home/toffer/auth-optics-workspace/auth-optics/packages/shared

# Type check token types
npx tsc --noEmit src/tokens/jwt.ts
npx tsc --noEmit src/tokens/access-token.ts
npx tsc --noEmit src/tokens/id-token.ts
npx tsc --noEmit src/tokens/refresh-token.ts
npx tsc --noEmit src/tokens/token-response.ts
npx tsc --noEmit src/tokens/index.ts

# Type check HTTP types
npx tsc --noEmit src/http/request.ts
npx tsc --noEmit src/http/response.ts
npx tsc --noEmit src/http/headers.ts
npx tsc --noEmit src/http/index.ts

# Try building the entire package
pnpm build
```

**Expected Results:**
- ✅ No TypeScript compilation errors
- ✅ Build produces `dist/tokens/` and `dist/http/` directories
- ✅ All declaration files generated

**Session 2 Deliverables:**
- ✅ 5 token type files (jwt.ts, access-token.ts, id-token.ts, refresh-token.ts, token-response.ts)
- ✅ 3 HTTP type files (request.ts, response.ts, headers.ts)
- ✅ 2 index barrel files (tokens/index.ts, http/index.ts)
- ✅ **Total: 10 files**

---

## 5. Verification Procedures

### 5.1 Type System Verification

**Step 5.1.1: Create Verification Test File**

Create a test file to verify all Day 1 types are importable:

**File:** `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/test-day1-imports.ts`

```typescript
/**
 * Day 1 Type Import Verification
 *
 * This file verifies that all Day 1 types can be imported and used together.
 */

import {
  // Utilities
  Timestamp,
  URL,
  Base64String,
  ClientId,
  FlowId,
  asClientId,
  asFlowId,

  // Flows
  FlowType,
  FlowStatus,
  FlowExecution,
  FlowStep,
  StepStatus,
  AuthorizationRequest,
  AuthorizationResponse,
  TokenRequest,

  // Tokens
  JWT,
  JWTPayload,
  AccessToken,
  AccessTokenPayload,
  IDToken,
  IDTokenPayload,
  RefreshToken,
  TokenResponse,

  // HTTP
  HttpRequest,
  HttpResponse,
  HttpMethod,
  HttpHeaders,
  CommonHeaders,
  ContentTypes
} from './src';

// Type assertions to verify types exist and are usable
const testClientId: ClientId = asClientId('test-client');
const testFlowId: FlowId = asFlowId('flow-123');

const testFlow: FlowExecution = {
  id: testFlowId,
  flowType: FlowType.AUTHORIZATION_CODE_PKCE,
  status: FlowStatus.IDLE,
  startedAt: new Date().toISOString(),
  steps: [],
  config: {
    client: {} as any, // Stub - will implement in Session 2 Day 2
    server: {} as any  // Stub - will implement in Session 2 Day 2
  }
};

const testRequest: HttpRequest = {
  method: HttpMethod.GET,
  url: 'https://example.com',
  headers: {},
  timestamp: new Date().toISOString(),
  requestId: 'req-123'
};

const testTokenResponse: TokenResponse = {
  access_token: 'at-123',
  token_type: 'Bearer',
  expires_in: 3600
};

console.log('✅ All Day 1 types imported successfully!');
console.log('Verified categories:');
console.log('  - Utilities (common, branded types)');
console.log('  - Flows (flow types, steps, auth code flow)');
console.log('  - Tokens (JWT, access, ID, refresh, response)');
console.log('  - HTTP (request, response, headers)');
```

**Step 5.1.2: Run Verification**

```bash
cd /home/toffer/auth-optics-workspace/auth-optics/packages/shared
npx tsc --noEmit test-day1-imports.ts
```

**Expected Output:** No TypeScript errors

---

### 5.2 Build Verification

**Step 5.2.1: Full Package Build**

```bash
cd /home/toffer/auth-optics-workspace/auth-optics/packages/shared
pnpm clean
pnpm build
```

**Expected Output:**
```
> @auth-optics/shared@1.0.0 build
> tsc

[No errors]
```

**Step 5.2.2: Verify Output Structure**

```bash
tree dist/ -L 2
```

**Expected Structure:**
```
dist/
├── index.js
├── index.d.ts
├── utils/
│   ├── common.js
│   ├── common.d.ts
│   ├── branded-types.js
│   ├── branded-types.d.ts
│   └── index.js/d.ts
├── flows/
│   ├── flow-types.js/d.ts
│   ├── flow-steps.js/d.ts
│   ├── authorization-code.js/d.ts
│   └── index.js/d.ts
├── tokens/
│   ├── jwt.js/d.ts
│   ├── access-token.js/d.ts
│   ├── id-token.js/d.ts
│   ├── refresh-token.js/d.ts
│   ├── token-response.js/d.ts
│   └── index.js/d.ts
└── http/
    ├── request.js/d.ts
    ├── response.js/d.ts
    ├── headers.js/d.ts
    └── index.js/d.ts
```

**Step 5.2.3: Verify Declaration Files**

```bash
cat dist/index.d.ts | head -30
```

**Expected:** Should show exported types from all categories

---

### 5.3 Integration Test

**Step 5.3.1: Create Mock Consumer Package**

```bash
cd /home/toffer/auth-optics-workspace/auth-optics
mkdir -p packages/test-consumer
cd packages/test-consumer

cat > package.json <<'EOF'
{
  "name": "@auth-optics/test-consumer",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@auth-optics/shared": "workspace:*"
  }
}
EOF

pnpm install
```

**Step 5.3.2: Create Test Import**

```bash
cat > test-import.ts <<'EOF'
import { FlowExecution, HttpRequest, AccessToken } from '@auth-optics/shared';

console.log('Imports successful from @auth-optics/shared');
EOF

npx tsx test-import.ts
```

**Expected Output:** `Imports successful from @auth-optics/shared`

**Step 5.3.3: Clean Up Test Package**

```bash
cd /home/toffer/auth-optics-workspace/auth-optics
rm -rf packages/test-consumer
```

---

### 5.4 Verification Checklist

Before marking Day 1 complete, verify:

- [ ] All 13 files created (7 from Session 1, 6 from Session 2)
- [ ] No TypeScript compilation errors
- [ ] `pnpm build` succeeds
- [ ] `dist/` directory contains all expected outputs
- [ ] Test import file (`test-day1-imports.ts`) passes type check
- [ ] Mock consumer package can import types
- [ ] All JSDoc comments present
- [ ] All RFC references documented where applicable
- [ ] Branded types work correctly
- [ ] Forward type declarations resolve

---

## 6. Troubleshooting

### 6.1 Common Issues

#### Issue 1: "Cannot find module '../utils'"

**Cause:** Incorrect relative import path

**Solution:**
```typescript
// Check file location and adjust path
// From src/flows/flow-types.ts:
import { FlowId, Timestamp } from '../utils';

// From src/tokens/access-token.ts:
import { JWTString, ClientId } from '../utils';
```

#### Issue 2: "Type 'X' is not assignable to type 'Y'"

**Cause:** Type mismatch, likely missing branded type conversion

**Solution:**
```typescript
// Use branded type helpers
const id: FlowId = asFlowId('flow-123');

// NOT:
const id: FlowId = 'flow-123'; // Error!
```

#### Issue 3: Circular dependency warnings

**Cause:** Mutual imports between type files

**Solution:**
```typescript
// Use type-only imports
import type { HttpRequest } from '../http';

// Instead of:
import { HttpRequest } from '../http';
```

#### Issue 4: "Property 'readonly' is not a valid attribute"

**Cause:** Incorrect readonly syntax

**Solution:**
```typescript
// Correct:
interface Example {
  readonly field: string;
}

// NOT:
interface Example {
  field: readonly string; // Wrong placement
}
```

---

### 6.2 TypeScript Configuration Issues

If TypeScript errors seem incorrect:

**Check tsconfig.json:**
```bash
cat tsconfig.json | grep -E "(strict|rootDir|outDir)"
```

**Verify:**
- `"strict": true`
- `"rootDir": "./src"`
- `"outDir": "./dist"`

**Reset build:**
```bash
pnpm clean
rm -rf node_modules
pnpm install
pnpm build
```

---

### 6.3 Import Resolution Issues

**Check package.json exports:**
```bash
cat package.json | grep -E "(main|types)"
```

**Expected:**
```json
{
  "main": "dist/index.js",
  "types": "dist/index.d.ts"
}
```

---

## 7. Exit Criteria

### 7.1 Deliverables Checklist

**Session 1 Deliverables:**
- [x] `src/utils/common.ts` - Common utility types
- [x] `src/utils/branded-types.ts` - Branded/nominal types
- [x] `src/utils/index.ts` - Utils barrel export
- [x] `src/flows/flow-types.ts` - Core flow types
- [x] `src/flows/flow-steps.ts` - Flow step types
- [x] `src/flows/authorization-code.ts` - Auth code flow types
- [x] `src/flows/index.ts` - Flows barrel export

**Session 2 Deliverables:**
- [x] `src/tokens/jwt.ts` - JWT base types
- [x] `src/tokens/access-token.ts` - Access token types
- [x] `src/tokens/id-token.ts` - ID token types (OIDC)
- [x] `src/tokens/refresh-token.ts` - Refresh token types
- [x] `src/tokens/token-response.ts` - Token endpoint response types
- [x] `src/tokens/index.ts` - Tokens barrel export
- [x] `src/http/request.ts` - HTTP request types
- [x] `src/http/response.ts` - HTTP response types
- [x] `src/http/headers.ts` - HTTP header types
- [x] `src/http/index.ts` - HTTP barrel export

**Total Files:** 17 (including barrel exports)

---

### 7.2 Quality Checklist

- [ ] All types have comprehensive JSDoc comments
- [ ] All RFC references documented where applicable
- [ ] No `any` types except where truly necessary
- [ ] Branded types used for domain identifiers (ClientId, FlowId, etc.)
- [ ] Readonly used for immutable fields
- [ ] Discriminated unions used for variant types (HttpRequestBody, etc.)
- [ ] Enums used for fixed value sets (FlowType, HttpMethod, etc.)
- [ ] Type-only imports used to avoid circular dependencies

---

### 7.3 Verification Checklist

- [ ] All TypeScript files compile without errors
- [ ] `pnpm build` succeeds
- [ ] `dist/` directory contains all expected outputs
- [ ] Test import file passes type checking
- [ ] Mock consumer package can import types
- [ ] No circular dependency warnings
- [ ] IntelliSense shows JSDoc tooltips in VS Code

---

### 7.4 Ready for Day 2

**Before proceeding to Day 2 (Configuration & Security Types):**

1. ✅ All Day 1 files created and verified
2. ✅ All verifications passed
3. ✅ No blocking issues in troubleshooting
4. ✅ Build output verified
5. ✅ Integration test successful

**Next Steps (Day 2):**
- Configuration types (client-config.ts, server-config.ts, app-config.ts)
- Discovery types (oidc-discovery.ts, oauth-metadata.ts, jwks.ts)
- Security types (pkce.ts, state.ts, nonce.ts, security-assessment.ts, security-indicators.ts)
- Vulnerability types (vulnerability-config.ts, vulnerability-toggle.ts, vulnerability-category.ts)

See: `@docs/implementation-plans/plan-shared-types-package-2025-12-24.md` Section 4.2 Day 2

---

## 8. Project Tracking Updates

### 8.1 Update ROADMAP.md

After completing Day 1, update ROADMAP.md:

**Section to update:** "Phase 1: Days 1-2"

**Mark as complete:**
```markdown
- [x] Utility types - common.ts, branded-types.ts (30 min)
- [x] Flow types - flow-types.ts, flow-steps.ts, authorization-code.ts (2-3 hours)
- [x] Token types - jwt.ts, access-token.ts, refresh-token.ts, id-token.ts, token-response.ts (2-3 hours)
- [x] HTTP types - request.ts, response.ts, headers.ts (1-2 hours)
- [x] Create barrel exports for utils/, flows/, tokens/, http/
```

**Update progress:**
```markdown
| Component | Status | Progress |
|-----------|--------|----------|
| **Shared Types** | 🟡 In Progress | 40% |
```

---

### 8.2 Update current-phase.md

After completing Day 1, update current-phase.md:

**Section: "Recently Completed"**

Add:
```markdown
- ✅ **Shared Types Day 1: Foundation Types** (2025-12-30)
  - Completed by feature-implementer agent
  - Implemented utilities, flows, tokens, HTTP types
  - 17 files created, all verifications passed
  - See: @docs/implementation-plans/feature-implementer/shared-types-day-1-foundation.md
  - Next: Day 2 - Configuration & Security types
```

**Section: "Next Steps"**

Update to:
```markdown
**IMMEDIATE** (feature-implementer agent):
1. Day 2: Configuration & Security types
   - See: @docs/implementation-plans/plan-shared-types-package-2025-12-24.md Section 4.2 Day 2
   - Priority: HIGH (continues shared types implementation)
```

---

## Completion Signal

When Day 1 is complete, output:

```markdown
---
✅ AGENT COMPLETE: feature-implementer

📁 Artifacts Created:
   - packages/shared/src/utils/ (3 files)
   - packages/shared/src/flows/ (4 files)
   - packages/shared/src/tokens/ (6 files)
   - packages/shared/src/http/ (4 files)
   - Total: 17 TypeScript files

📋 Context Updates:
   - ROADMAP.md (marked Day 1 tasks complete, updated progress to 40%)
   - current-phase.md (added to Recently Completed, updated Next Steps)

🎯 Ready For: Day 2 - Configuration & Security Types

⚠️ Blockers for Next Agent: None

📝 Notes:
   - All Day 1 foundation types implemented
   - Build successful, all verifications passed
   - Integration test with mock consumer package successful
   - Forward type references resolved correctly
---
```

---

**End of Detailed Implementation Plan: Day 1 - Foundation Types**
