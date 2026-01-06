# Detailed Implementation Plan: Shared Types Day 2 - Configuration & Security Types

## Document Information

| Property | Value |
|----------|-------|
| **Component** | packages/shared (Day 2 of 3) |
| **Phase** | Phase 1 - Foundation |
| **Session Focus** | Configuration & Security types |
| **Date Created** | January 1, 2026 |
| **Estimated Duration** | 5-7 hours |
| **Status** | Ready for Implementation |
| **Prerequisite** | Day 1 completion + PR #11 merged |

---

## Executive Summary

This detailed implementation plan breaks down "Day 2: Configuration & Security" from the master plan (`@docs/implementation-plans/plan-shared-types-package-2025-12-24.md` Section 4.2) into step-by-step instructions with verification procedures.

**Goal**: Implement all configuration, discovery, security, and vulnerability types for the shared types package, enabling backend OAuth2 client logic and security assessment functionality.

**Scope**: 15 files across 4 type categories
- Configuration types (3 files)
- Discovery & metadata types (3 files)
- Security types (5 files)
- Vulnerability types (3 files)

**Dependencies**: Day 1 foundation types must be complete and available for import

---

## Table of Contents

1. [Prerequisites & Setup](#1-prerequisites--setup)
2. [Implementation Sessions](#2-implementation-sessions)
3. [Type-by-Type Implementation Checklist](#3-type-by-type-implementation-checklist)
4. [Verification Procedures](#4-verification-procedures)
5. [Common Issues & Solutions](#5-common-issues--solutions)
6. [Completion Checklist](#6-completion-checklist)

---

## 1. Prerequisites & Setup

### 1.1 Pre-Implementation Verification

Before starting Day 2 implementation, verify Day 1 is complete:

```bash
# Verify Day 1 files exist
cd /home/toffer/auth-optics-workspace/auth-optics/packages/shared/src

# Check utilities exist
ls -la utils/common.ts utils/branded-types.ts utils/index.ts

# Check flows exist
ls -la flows/flow-types.ts flows/flow-steps.ts flows/authorization-code.ts flows/index.ts

# Check tokens exist
ls -la tokens/*.ts tokens/index.ts

# Check HTTP types exist
ls -la http/*.ts http/index.ts
```

**Expected Output**: All 18 Day 1 files should exist

### 1.2 Verify Build Status

```bash
cd /home/toffer/auth-optics-workspace/auth-optics/packages/shared

# Build Day 1 types (should succeed)
pnpm build

# Type check
pnpm type-check
```

**Expected**: No compilation errors from Day 1 implementation

### 1.3 Prepare Directory Structure

Day 1 should have created all directories. Verify they exist:

```bash
cd /home/toffer/auth-optics-workspace/auth-optics/packages/shared/src

# Verify config, discovery, security, vulnerability directories exist
test -d config && echo "✓ config/" || echo "✗ config/ missing"
test -d discovery && echo "✓ discovery/" || echo "✗ discovery/ missing"
test -d security && echo "✓ security/" || echo "✗ security/ missing"
test -d vulnerability && echo "✓ vulnerability/" || echo "✗ vulnerability/ missing"
```

**Expected**: All 4 directories should exist

---

## 2. Implementation Sessions

Day 2 is divided into 2 sessions to avoid context overload:

### 2.1 Session 1: Configuration & Discovery Types (2-4 hours)

**Goal**: Implement all client, server, and application configuration types plus basic discovery types

**Files to Create**:
1. `src/config/client-config.ts` (1 hour)
2. `src/config/server-config.ts` (30 min)
3. `src/config/app-config.ts` (30 min)
4. `src/config/index.ts` (barrel export, 5 min)
5. `src/discovery/oidc-discovery.ts` (1 hour)
6. `src/discovery/oauth-metadata.ts` (30 min)
7. `src/discovery/jwks.ts` (30 min)
8. `src/discovery/index.ts` (barrel export, 5 min)

**Total for Session 1**: 4-5 files, 2-4 hours

### 2.2 Session 2: Security & Vulnerability Types (3-4 hours)

**Goal**: Implement all security primitives (PKCE, state, nonce) and vulnerability mode types

**Files to Create**:
1. `src/security/pkce.ts` (1 hour)
2. `src/security/state.ts` (1 hour)
3. `src/security/nonce.ts` (30 min)
4. `src/security/security-assessment.ts` (1 hour)
5. `src/security/security-indicators.ts` (30 min)
6. `src/security/index.ts` (barrel export, 5 min)
7. `src/vulnerability/vulnerability-config.ts` (1 hour)
8. `src/vulnerability/vulnerability-toggle.ts` (30 min)
9. `src/vulnerability/vulnerability-category.ts` (30 min)
10. `src/vulnerability/index.ts` (barrel export, 5 min)

**Total for Session 2**: 10 files, 5-6 hours

---

## 3. Type-by-Type Implementation Checklist

### SESSION 1: CONFIGURATION & DISCOVERY TYPES

#### ✓ File 1: src/config/client-config.ts (1 hour)

**Purpose**: OAuth2 client configuration for the frontend/backend

**Verification After Creation**:
```bash
cd /home/toffer/auth-optics-workspace/auth-optics/packages/shared
npx tsc --noEmit src/config/client-config.ts
```

**Checklist**:
- [ ] Create file with UTF-8 encoding (no BOM)
- [ ] Define `ClientConfig` interface with:
  - `clientId: string` (required)
  - `clientSecret?: string` (optional, for confidential clients)
  - `redirectUri: string` (required)
  - `responseType: 'code' | 'token' | 'id_token'` (enum)
  - `scope: string[]` (array of requested scopes)
  - `audience?: string` (optional, for specific resource)
  - `grantType: 'authorization_code' | 'client_credentials' | 'device_code'` (enum)
  - `usePKCE: boolean` (PKCE toggle)
  - `state?: boolean` (state parameter toggle)
  - `nonce?: boolean` (nonce parameter toggle)
  - `codeChallengeMethno: 'S256' | 'plain'` (PKCE method)
- [ ] Define enums for `ResponseType`, `GrantType`, `CodeChallengeMethod`
- [ ] Add JSDoc comments with RFC references
- [ ] Export all types in barrel export
- [ ] Type check passes
- [ ] No `any` types except where explicitly allowed

**Key References** (from master plan, Section 5.2):
- RFC 6749 Section 4.1 - Authorization Code Flow
- RFC 7636 - PKCE
- Must support MVP (PKCE required)

#### ✓ File 2: src/config/server-config.ts (30 min)

**Purpose**: Authorization server configuration (endpoints, key settings)

**Verification After Creation**:
```bash
npx tsc --noEmit src/config/server-config.ts
```

**Checklist**:
- [ ] Create file with UTF-8 encoding
- [ ] Define `ServerConfig` interface with:
  - `issuer: string` (OIDC issuer URL)
  - `authorizationEndpoint: string`
  - `tokenEndpoint: string`
  - `userInfoEndpoint?: string`
  - `jwksUri: string` (JSON Web Key Set endpoint)
  - `revocationEndpoint?: string`
  - `introspectionEndpoint?: string`
  - `discoveryUrl?: string` (well-known config endpoint)
  - `supportedScopes: string[]`
  - `supportedResponseTypes: string[]`
  - `supportedGrantTypes: string[]`
- [ ] Add JSDoc with RFC 8414 reference (OIDC Discovery)
- [ ] Include type for endpoint configuration
- [ ] Export all types

**Key References**:
- RFC 8414 - OAuth 2.0 Authorization Server Metadata
- OIDC Core Section 4.1 - Discovery

#### ✓ File 3: src/config/app-config.ts (30 min)

**Purpose**: Application-level configuration combining client and server config

**Verification After Creation**:
```bash
npx tsc --noEmit src/config/app-config.ts
```

**Checklist**:
- [ ] Create file with UTF-8 encoding
- [ ] Define `AppConfig` interface with:
  - `client: ClientConfig` (import from client-config)
  - `server: ServerConfig` (import from server-config)
  - `environment: 'development' | 'staging' | 'production'`
  - `logLevel: 'debug' | 'info' | 'warn' | 'error'`
  - `persistConfig: boolean` (localStorage persistence)
- [ ] Import `ClientConfig` and `ServerConfig` from respective files
- [ ] Add JSDoc comments
- [ ] Export all types

#### ✓ File 4: src/config/index.ts (5 min)

**Purpose**: Barrel export for config types

**Content**:
```typescript
export * from './client-config';
export * from './server-config';
export * from './app-config';
```

**Verification**:
```bash
npx tsc --noEmit src/config/index.ts
```

#### ✓ File 5: src/discovery/oidc-discovery.ts (1 hour)

**Purpose**: OIDC Discovery document structure

**Verification After Creation**:
```bash
npx tsc --noEmit src/discovery/oidc-discovery.ts
```

**Checklist**:
- [ ] Create file with UTF-8 encoding
- [ ] Define `OIDCDiscoveryDocument` interface with:
  - `issuer: string` (required)
  - `authorization_endpoint: string` (required)
  - `token_endpoint: string` (required)
  - `userinfo_endpoint?: string`
  - `jwks_uri: string` (required)
  - `scopes_supported: string[]`
  - `response_types_supported: string[]` (e.g., "code", "id_token")
  - `subject_types_supported: string[]` (e.g., "public")
  - `id_token_signing_alg_values_supported: string[]` (e.g., "RS256")
  - `claims_supported: string[]`
  - `grant_types_supported: string[]`
  - `token_endpoint_auth_methods_supported: string[]`
  - `response_modes_supported?: string[]`
  - `revocation_endpoint?: string`
  - `introspection_endpoint?: string`
  - `end_session_endpoint?: string`
  - Additional optional fields per OIDC spec
- [ ] Add JSDoc with OIDC Core Section 3 & RFC 8414 references
- [ ] Include optional fields for Phase 2 extensions
- [ ] Export all types

**Key References**:
- OIDC Core Section 3 - Discovery
- RFC 8414 - OAuth 2.0 Authorization Server Metadata

#### ✓ File 6: src/discovery/oauth-metadata.ts (30 min)

**Purpose**: OAuth 2.0 server metadata (RFC 8414)

**Verification After Creation**:
```bash
npx tsc --noEmit src/discovery/oauth-metadata.ts
```

**Checklist**:
- [ ] Create file with UTF-8 encoding
- [ ] Define `OAuth2Metadata` interface (extends basic OAuth2 server info)
- [ ] Include fields for:
  - `issuer: string`
  - `authorization_endpoint: string`
  - `token_endpoint: string`
  - `jwks_uri: string`
  - `scopes_supported: string[]`
  - `response_types_supported: string[]`
  - `response_modes_supported?: string[]`
  - `grant_types_supported: string[]`
  - `token_endpoint_auth_methods_supported: string[]`
  - Additional RFC 8414 fields
- [ ] Add JSDoc with RFC 8414 reference
- [ ] Keep separate from OIDC to allow independent OAuth2 implementations

**Key References**:
- RFC 8414 - OAuth 2.0 Authorization Server Metadata

#### ✓ File 7: src/discovery/jwks.ts (30 min)

**Purpose**: JSON Web Key Set for signature verification

**Verification After Creation**:
```bash
npx tsc --noEmit src/discovery/jwks.ts
```

**Checklist**:
- [ ] Create file with UTF-8 encoding
- [ ] Define `JWK` interface with:
  - `kty: string` (key type: "RSA", "EC", "oct")
  - `use?: string` (key use: "sig", "enc")
  - `key_ops?: string[]` (key operations)
  - `alg?: string` (algorithm, e.g., "RS256")
  - `kid?: string` (key ID)
  - `x5c?: string[]` (X.509 certificate chain)
  - RSA-specific fields: `n`, `e`, `p`, `q`, `dp`, `dq`, `qi`, `d`
  - Elliptic Curve specific fields: `crv`, `x`, `y`, `d`
- [ ] Define `JWKS` interface (JSON Web Key Set) with:
  - `keys: JWK[]`
- [ ] Add JSDoc with RFC 7517, RFC 7518 references
- [ ] Export all types

**Key References**:
- RFC 7517 - JSON Web Key (JWK)
- RFC 7518 - JSON Web Algorithms (JWA)
- OIDC Core Section 5.1 - ID Token

#### ✓ File 8: src/discovery/index.ts (5 min)

**Purpose**: Barrel export for discovery types

**Content**:
```typescript
export * from './oidc-discovery';
export * from './oauth-metadata';
export * from './jwks';
```

**Verification**:
```bash
npx tsc --noEmit src/discovery/index.ts
```

---

### SESSION 2: SECURITY & VULNERABILITY TYPES

#### ✓ File 9: src/security/pkce.ts (1 hour)

**Purpose**: PKCE (Proof Key for Code Exchange) parameters and validation

**Verification After Creation**:
```bash
npx tsc --noEmit src/security/pkce.ts
```

**Checklist**:
- [ ] Create file with UTF-8 encoding
- [ ] Define `PKCEParams` interface with:
  - `codeVerifier: string` (readonly, 43-128 chars Base64URL)
  - `codeChallenge: string` (readonly, Base64URL(SHA256(verifier)))
  - `codeChallengeMethod: 'S256'` (readonly, only S256 in MVP)
  - `generatedAt: string` (readonly, ISO 8601 timestamp)
- [ ] Define `PKCEValidationResult` interface with:
  - `isValid: boolean`
  - `errors?: PKCEValidationError[]`
  - `verifierMatches?: boolean`
  - `verifierLengthValid?: boolean`
  - `challengeEncodingValid?: boolean`
- [ ] Define `PKCEValidationError` enum with values:
  - `VERIFIER_TOO_SHORT`, `VERIFIER_TOO_LONG`, `VERIFIER_INVALID_CHARS`
  - `CHALLENGE_MISMATCH`, `CHALLENGE_ENCODING_INVALID`
  - `METHOD_NOT_SUPPORTED`
- [ ] Add JSDoc with RFC 7636 Section 4 reference
- [ ] Add RFC 7636 compliance notes (required for OAuth 2.1)
- [ ] Export all types

**Key References**:
- RFC 7636 - Proof Key for Code Exchange by OAuth Public Clients
- RFC 7636 Section 4 - Protocol

#### ✓ File 10: src/security/state.ts (1 hour)

**Purpose**: OAuth2 state parameter for CSRF protection

**Verification After Creation**:
```bash
npx tsc --noEmit src/security/state.ts
```

**Checklist**:
- [ ] Create file with UTF-8 encoding
- [ ] Define `StateParam` interface with:
  - `value: string` (readonly, cryptographically random)
  - `generatedAt: string` (readonly, ISO 8601)
  - `expiresAt: string` (readonly, ISO 8601)
  - `used: boolean` (mutable, single-use protection)
- [ ] Define `StateValidationResult` interface with:
  - `isValid: boolean`
  - `errors?: StateValidationError[]`
  - `stateMatches?: boolean`
  - `isExpired?: boolean`
  - `alreadyUsed?: boolean`
- [ ] Define `StateValidationError` enum with values:
  - `STATE_MISSING`, `STATE_MISMATCH`, `STATE_EXPIRED`
  - `STATE_ALREADY_USED`, `STATE_TOO_SHORT`
- [ ] Add JSDoc with RFC 6749 Section 10.12 reference
- [ ] Note that state is RECOMMENDED in RFC 6749 but REQUIRED by OAuth 2.1
- [ ] Export all types

**Key References**:
- RFC 6749 Section 10.12 - Cross-Site Request Forgery
- OAuth 2.1 - State Parameter REQUIRED

#### ✓ File 11: src/security/nonce.ts (30 min)

**Purpose**: OIDC nonce parameter for ID token binding

**Verification After Creation**:
```bash
npx tsc --noEmit src/security/nonce.ts
```

**Checklist**:
- [ ] Create file with UTF-8 encoding
- [ ] Define `NonceParam` interface with:
  - `value: string` (readonly, cryptographically random)
  - `generatedAt: string` (readonly, ISO 8601)
  - `verified: boolean` (mutable, verified in ID token)
- [ ] Define `NonceValidationResult` interface with:
  - `isValid: boolean`
  - `errors?: NonceValidationError[]`
  - `nonceMatches?: boolean`
- [ ] Define `NonceValidationError` enum with values:
  - `NONCE_MISSING`, `NONCE_MISMATCH`, `NONCE_TOO_SHORT`
- [ ] Add JSDoc with OIDC Core Section 3.1.2.1 reference
- [ ] Note that nonce is RECOMMENDED for Authorization Code Flow
- [ ] Export all types

**Key References**:
- OIDC Core Section 3.1.2.1 - Authentication Request
- OIDC Core Section 3.1.3.7 - Nonce Validation

#### ✓ File 12: src/security/security-assessment.ts (1 hour)

**Purpose**: Security assessment and scoring for OAuth2 flows

**Verification After Creation**:
```bash
npx tsc --noEmit src/security/security-assessment.ts
```

**Checklist**:
- [ ] Create file with UTF-8 encoding
- [ ] Define `SecurityAssessment` interface with:
  - `score: number` (0-100)
  - `level: SecurityLevel` (enum)
  - `checks: SecurityCheck[]` (array of individual checks)
  - `activeVulnerabilities: string[]` (from vulnerability mode)
  - `recommendations: SecurityRecommendation[]`
  - `assessedAt: string` (ISO 8601)
- [ ] Define `SecurityLevel` enum with values:
  - `CRITICAL`, `WARNING`, `GOOD`, `EXCELLENT`
- [ ] Define `SecurityCheck` interface with:
  - `id: string`
  - `name: string`
  - `category: SecurityCheckCategory` (enum)
  - `passed: boolean`
  - `severity?: SecuritySeverity` (enum)
  - `description: string`
  - `remediation?: string`
  - `rfcReference?: string`
- [ ] Define `SecurityCheckCategory` enum:
  - `PKCE`, `STATE`, `NONCE`, `REDIRECT_URI`
  - `TOKEN_VALIDATION`, `HTTPS`, `TOKEN_BINDING`
- [ ] Define `SecuritySeverity` enum:
  - `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO`
- [ ] Define `SecurityRecommendation` interface with:
  - `id: string`
  - `title: string`
  - `description: string`
  - `priority: SecuritySeverity`
  - `learnMoreUrl?: string`
- [ ] Add JSDoc with RFC references for each check category
- [ ] Export all types

**Key References**:
- RFC 6819 - OAuth 2.0 Threat Model and Security Considerations
- OAuth 2.1 Security Requirements

#### ✓ File 13: src/security/security-indicators.ts (30 min)

**Purpose**: Security indicator badges for UI display

**Verification After Creation**:
```bash
npx tsc --noEmit src/security/security-indicators.ts
```

**Checklist**:
- [ ] Create file with UTF-8 encoding
- [ ] Define `SecurityIndicator` interface with:
  - `type: SecurityIndicatorType` (enum)
  - `status: SecurityIndicatorStatus` (enum)
  - `label: string` (display text)
  - `tooltip: string` (hover text)
  - `icon?: string` (icon name)
  - `variant: 'success' | 'warning' | 'error' | 'info'` (color/styling)
- [ ] Define `SecurityIndicatorType` enum:
  - `PKCE`, `STATE`, `NONCE`, `HTTPS`
  - `TOKEN_SIGNATURE`, `TOKEN_BINDING`, `REDIRECT_URI`
- [ ] Define `SecurityIndicatorStatus` enum:
  - `ENABLED`, `DISABLED`, `FAILED`, `UNKNOWN`
- [ ] Add JSDoc with descriptions for each indicator type
- [ ] Include notes about vulnerability mode affecting status
- [ ] Export all types

**Key References**:
- UI visualization requirements for security status

#### ✓ File 14: src/security/index.ts (5 min)

**Purpose**: Barrel export for security types

**Content**:
```typescript
export * from './pkce';
export * from './state';
export * from './nonce';
export * from './security-assessment';
export * from './security-indicators';
```

**Verification**:
```bash
npx tsc --noEmit src/security/index.ts
```

#### ✓ File 15: src/vulnerability/vulnerability-config.ts (1 hour)

**Purpose**: Vulnerability mode configuration with all 39 toggles defined

**Important Notes**:
- MVP: Only `DISABLE_PKCE` is functional
- Phase 2-3: Other toggles are defined but not implemented
- All toggles default to `false` (secure)

**Verification After Creation**:
```bash
npx tsc --noEmit src/vulnerability/vulnerability-config.ts
```

**Checklist**:
- [ ] Create file with UTF-8 encoding
- [ ] Define `VulnerabilityConfig` interface with:
  - `enabled: boolean`
  - `toggles: VulnerabilityToggles`
  - `lastModified: string` (ISO 8601)
  - `warningAcknowledged: boolean`
- [ ] Define `VulnerabilityToggles` interface with all 39 toggles:
  - **MVP (1 toggle)**:
    - `DISABLE_PKCE: boolean`
  - **Phase 2 toggles** (grouped with comments):
    - State/CSRF: `DISABLE_STATE`, `PREDICTABLE_STATE`, `SKIP_STATE_VERIFICATION`
    - Nonce: `DISABLE_NONCE`, `PREDICTABLE_NONCE`, `SKIP_NONCE_VERIFICATION`
    - Redirect URI: `LAX_REDIRECT_URI`, `ALLOW_OPEN_REDIRECT`, `PATTERN_MATCHING_URI`
    - Token: `SKIP_SIGNATURE_VERIFICATION`, `SKIP_EXPIRATION_CHECK`, `SKIP_ISSUER_VALIDATION`, `SKIP_AUDIENCE_VALIDATION`, `SKIP_AT_HASH`, `SKIP_C_HASH`
    - Token Binding: `DISABLE_DPOP`, `ALLOW_TOKEN_REUSE`, `DISABLE_MTLS`
    - Client Auth: `SKIP_CLIENT_AUTH`, `WEAK_CLIENT_SECRET`, `CLIENT_SECRET_IN_QUERY`
    - Scope: `SKIP_SCOPE_VALIDATION`, `ALLOW_SCOPE_ESCALATION`
    - Refresh Token: `DISABLE_REFRESH_ROTATION`, `REUSABLE_REFRESH`, `SKIP_REFRESH_BINDING`
    - Transport: `ALLOW_HTTP`, `SKIP_CERT_VALIDATION`
    - Token Leakage: `ALLOW_FRAGMENT_TOKENS`, `ALLOW_TOKENS_IN_HISTORY`, `DISABLE_TOKEN_ENCRYPTION`
    - Auth Code: `ALLOW_CODE_REUSE`, `PREDICTABLE_AUTH_CODE`, `EXTENDED_CODE_LIFETIME`
  - **Phase 3 toggles** (3 toggles):
    - `ALLOW_IFRAME`, `DISABLE_CORS`, `ALLOW_MIXED_CONTENT`
- [ ] Define `SECURE_DEFAULTS` constant with all toggles set to `false`
- [ ] Add JSDoc with vulnerability descriptions
- [ ] Add section comments grouping related toggles with phase info
- [ ] Export all types and constants

**Key References**:
- Vulnerability Mode Overview from specs
- Each toggle description should include RFC reference
- Master plan Section 9.3 for vulnerability list

#### ✓ File 16: src/vulnerability/vulnerability-toggle.ts (30 min)

**Purpose**: Metadata for vulnerability toggles (descriptions, severity, implementation status)

**Verification After Creation**:
```bash
npx tsc --noEmit src/vulnerability/vulnerability-toggle.ts
```

**Checklist**:
- [ ] Create file with UTF-8 encoding
- [ ] Define `VulnerabilityToggleMetadata` interface with:
  - `key: keyof VulnerabilityToggles`
  - `name: string` (human-readable name)
  - `description: string` (detailed description)
  - `category: VulnerabilityCategory` (enum)
  - `severity: 'critical' | 'high' | 'medium' | 'low'`
  - `rfcReferences: string[]` (RFC sections)
  - `attackVector: string` (attack description)
  - `mitigation: string` (defense description)
  - `phase: 'mvp' | 'phase-2' | 'phase-3'`
  - `implemented: boolean` (whether currently functional)
  - `demoScenario?: string` (suggested demo scenario)
- [ ] Define `VULNERABILITY_METADATA` registry with:
  - MVP: Only `DISABLE_PKCE` metadata (fully populated)
  - Include comment: "Phase 2/3 metadata will be added in future implementations"
- [ ] For `DISABLE_PKCE` metadata, include:
  - `name: 'Disable PKCE'`
  - `description: 'Removes Proof Key for Code Exchange protection'`
  - `severity: 'critical'`
  - `rfcReferences: ['RFC 7636', 'OAuth 2.1 Section 4.1']`
  - `attackVector: 'Authorization code interception attack...'`
  - `mitigation: 'Always use PKCE (RFC 7636)...'`
  - `phase: 'mvp'`
  - `implemented: true`
- [ ] Import `VulnerabilityCategory` from vulnerability-category.ts
- [ ] Add JSDoc with educational purpose note
- [ ] Export all types

**Key References**:
- RFC 7636 - PKCE
- OAuth 2.1 Section 4.1 - Authorization Code Flow

#### ✓ File 17: src/vulnerability/vulnerability-category.ts (30 min)

**Purpose**: Vulnerability categories for grouping related toggles

**Verification After Creation**:
```bash
npx tsc --noEmit src/vulnerability/vulnerability-category.ts
```

**Checklist**:
- [ ] Create file with UTF-8 encoding
- [ ] Define `VulnerabilityCategory` enum with values:
  - `AUTHORIZATION_ENDPOINT = 'authorization_endpoint'`
  - `TOKEN_ENDPOINT = 'token_endpoint'`
  - `TOKEN_VALIDATION = 'token_validation'`
  - `CLIENT_AUTHENTICATION = 'client_authentication'`
  - `STATE_CSRF = 'state_csrf'`
  - `REDIRECT_URI = 'redirect_uri'`
  - `TRANSPORT_SECURITY = 'transport_security'`
  - `TOKEN_BINDING = 'token_binding'`
  - `TOKEN_LEAKAGE = 'token_leakage'`
  - `SCOPE_HANDLING = 'scope_handling'`
  - `REFRESH_TOKEN = 'refresh_token'`
  - `UI_UX_SECURITY = 'ui_ux_security'`
- [ ] Define `VulnerabilityCategoryMetadata` interface with:
  - `category: VulnerabilityCategory`
  - `name: string` (display name)
  - `description: string` (category description)
  - `icon?: string` (icon name, e.g., 'shield-alert')
- [ ] Define `CATEGORY_METADATA` registry with 6 entries for MVP:
  - AUTHORIZATION_ENDPOINT, TOKEN_ENDPOINT, TOKEN_VALIDATION
  - STATE_CSRF, REDIRECT_URI, TRANSPORT_SECURITY
  - Comment: "Additional categories for Phase 2/3"
- [ ] Add JSDoc with category purposes
- [ ] Export all types

**Key References**:
- Vulnerability Mode Overview from specs

#### ✓ File 18: src/vulnerability/index.ts (5 min)

**Purpose**: Barrel export for vulnerability types

**Content**:
```typescript
export * from './vulnerability-config';
export * from './vulnerability-toggle';
export * from './vulnerability-category';
```

**Verification**:
```bash
npx tsc --noEmit src/vulnerability/index.ts
```

---

## 4. Verification Procedures

### 4.1 After Each File Creation

```bash
# Type check the specific file
cd /home/toffer/auth-optics-workspace/auth-optics/packages/shared
npx tsc --noEmit src/CATEGORY/filename.ts

# Verify no syntax errors
```

### 4.2 After Each Category (4 categories total)

```bash
# Type check entire category
npx tsc --noEmit src/config/
npx tsc --noEmit src/discovery/
npx tsc --noEmit src/security/
npx tsc --noEmit src/vulnerability/

# Build entire package
pnpm build

# Verify dist/ contains category exports
ls -la dist/config/
ls -la dist/discovery/
ls -la dist/security/
ls -la dist/vulnerability/
```

### 4.3 After Session 1 (Configuration & Discovery)

```bash
cd /home/toffer/auth-optics-workspace/auth-optics/packages/shared

# Build package
pnpm build

# Expected: No compilation errors

# Verify barrel exports work
npx tsc --noEmit <<'EOF'
import { ClientConfig, ServerConfig } from './src/config';
import { OIDCDiscoveryDocument, JWKS } from './src/discovery';

const client: ClientConfig = {} as any;
const discovery: OIDCDiscoveryDocument = {} as any;
console.log('Config & Discovery types imported successfully');
EOF
```

### 4.4 After Session 2 (Security & Vulnerability)

```bash
cd /home/toffer/auth-optics-workspace/auth-optics/packages/shared

# Build package
pnpm build

# Expected: No compilation errors

# Verify all Day 2 types can be imported
npx tsc --noEmit <<'EOF'
import {
  PKCEParams, StateParam, NonceParam,
  SecurityAssessment, SecurityIndicator,
  VulnerabilityConfig, VulnerabilityToggles
} from './src';

const pkce: PKCEParams = {} as any;
const security: SecurityAssessment = {} as any;
const vuln: VulnerabilityConfig = {} as any;
console.log('All Day 2 types imported successfully');
EOF
```

### 4.5 Day 2 Completion Verification

Run this comprehensive verification after all 18 files are created:

```bash
cd /home/toffer/auth-optics-workspace/auth-optics/packages/shared

# 1. Build package
pnpm build
# Expected: No errors, dist/ updated

# 2. Verify all category exports exist
test -f dist/config/index.d.ts && echo "✓ config barrel exports exist"
test -f dist/discovery/index.d.ts && echo "✓ discovery barrel exports exist"
test -f dist/security/index.d.ts && echo "✓ security barrel exports exist"
test -f dist/vulnerability/index.d.ts && echo "✓ vulnerability barrel exports exist"

# 3. Import test (comprehensive)
cat > test-day2-imports.ts <<'EOF'
import {
  // Config
  ClientConfig, ServerConfig, AppConfig,

  // Discovery
  OIDCDiscoveryDocument, OAuth2Metadata, JWKS, JWK,

  // Security
  PKCEParams, PKCEValidationResult, PKCEValidationError,
  StateParam, StateValidationResult, StateValidationError,
  NonceParam, NonceValidationResult, NonceValidationError,
  SecurityAssessment, SecurityLevel, SecurityCheck, SecurityCheckCategory,
  SecuritySeverity, SecurityRecommendation, SecurityIndicator,
  SecurityIndicatorType, SecurityIndicatorStatus,

  // Vulnerability
  VulnerabilityConfig, VulnerabilityToggles, SECURE_DEFAULTS,
  VulnerabilityToggleMetadata, VULNERABILITY_METADATA,
  VulnerabilityCategory, VulnerabilityCategoryMetadata, CATEGORY_METADATA
} from './src';

console.log('✓ All Day 2 types imported successfully');
console.log('✓ Configuration types ready');
console.log('✓ Discovery types ready');
console.log('✓ Security types ready');
console.log('✓ Vulnerability types ready');
EOF

npx tsc --noEmit test-day2-imports.ts

# 4. Check file count
echo "Day 2 files created:"
find src/config -name "*.ts" | wc -l
find src/discovery -name "*.ts" | wc -l
find src/security -name "*.ts" | wc -l
find src/vulnerability -name "*.ts" | wc -l
# Expected: 4 + 4 + 6 + 4 = 18 files total

# 5. Verify TypeScript strict mode compliance
npx tsc --noEmit
# Expected: 0 errors

# Cleanup test file
rm -f test-day2-imports.ts
```

---

## 5. Common Issues & Solutions

### Issue 1: Import Errors Between Categories

**Symptom**: `Cannot find module '@auth-optics/shared'` when importing from Day 1 types

**Solution**:
- Ensure Day 1 types (flows, tokens, http, utils) exist and compile
- Run `pnpm build` to generate dist/
- Use relative imports in Day 2 files if needed: `import { FlowType } from '../flows'`

### Issue 2: Circular Dependencies

**Symptom**: TypeScript warning about circular imports

**Solution**:
- Use forward declarations: `import type { X } from './module'`
- Avoid importing entire index files in type definitions
- Move shared types to utils if needed

### Issue 3: UUID/Timestamp Type Issues

**Symptom**: UUID or timestamp fields not recognized

**Solution**:
- Use `string` type for ISO 8601 timestamps
- Use `string` type for UUIDs
- These are defined in utils/common.ts as type aliases
- Reference Day 1 implementation for examples

### Issue 4: "Module has no exported member"

**Symptom**: Type exists but cannot be imported

**Solution**:
1. Verify the type is exported in the category index.ts
2. Verify the category index.ts is exported in main src/index.ts
3. Run `pnpm build` to regenerate dist/
4. Check dist/ for compiled files

### Issue 5: Enum Export Issues

**Symptom**: Enum values not available at runtime in dist/

**Solution**:
- Enums compile to JavaScript objects
- Verify enum is defined in .ts file (not just type alias)
- Confirm enum has explicit values (e.g., `PKCE = 'pkce'`)
- Build package: `pnpm build`

---

## 6. Completion Checklist

### 6.1 Session 1 Completion (Configuration & Discovery)

- [x] **src/config/client-config.ts** created and compiles
- [x] **src/config/server-config.ts** created and compiles
- [x] **src/config/app-config.ts** created and compiles
- [x] **src/config/index.ts** barrel export created
- [x] **src/discovery/oidc-discovery.ts** created and compiles
- [x] **src/discovery/oauth-metadata.ts** created and compiles
- [x] **src/discovery/jwks.ts** created and compiles
- [x] **src/discovery/index.ts** barrel export created
- [x] Package builds successfully: `pnpm build`
- [x] No TypeScript errors from config/discovery types
- [x] **Updated main src/index.ts** to export config and discovery categories
- [x] **Committed to branch** feature/shared-types-day-2-config-security (commit f728763)

### 6.2 Session 2 Completion (Security & Vulnerability)

- [ ] **src/security/pkce.ts** created and compiles
- [ ] **src/security/state.ts** created and compiles
- [ ] **src/security/nonce.ts** created and compiles
- [ ] **src/security/security-assessment.ts** created and compiles
- [ ] **src/security/security-indicators.ts** created and compiles
- [ ] **src/security/index.ts** barrel export created
- [ ] **src/vulnerability/vulnerability-config.ts** created and compiles
- [ ] **src/vulnerability/vulnerability-toggle.ts** created and compiles
- [ ] **src/vulnerability/vulnerability-category.ts** created and compiles
- [ ] **src/vulnerability/index.ts** barrel export created
- [ ] Package builds successfully: `pnpm build`
- [ ] No TypeScript errors from security/vulnerability types

### 6.3 Day 2 Integration (Both Sessions)

- [ ] All 18 files created (4 config + 4 discovery + 6 security + 4 vulnerability)
- [ ] All files compile without errors: `pnpm type-check`
- [ ] Package builds without errors: `pnpm build`
- [ ] **main src/index.ts** has been updated to export all Day 2 categories
  - [ ] Check that `export * from './config'` exists
  - [ ] Check that `export * from './discovery'` exists
  - [ ] Check that `export * from './security'` exists
  - [ ] Check that `export * from './vulnerability'` exists
- [ ] dist/ directory contains all compiled types:
  - [ ] `dist/config/` exists
  - [ ] `dist/discovery/` exists
  - [ ] `dist/security/` exists
  - [ ] `dist/vulnerability/` exists
- [ ] Import test passes (can import all Day 2 types)
- [ ] No `any` types except where explicitly necessary
- [ ] All types have JSDoc comments with RFC references
- [ ] File encoding is UTF-8 (no special character corruption)

### 6.4 Quality Assurance

- [ ] TypeScript strict mode: `noImplicitAny` enabled
- [ ] All properties have explicit types (no implicit `any`)
- [ ] RFC references in JSDoc comments where applicable
- [ ] Immutable fields marked `readonly` where appropriate
- [ ] Enums have explicit string values (e.g., `PKCE = 'pkce'`)
- [ ] Optional fields marked with `?`
- [ ] No unused imports or exports
- [ ] Consistent naming conventions followed

### 6.5 Post-Implementation Tasks

After all files are created and verified:

1. **Update main index.ts** (if not already done):
   ```bash
   # Verify these lines exist in src/index.ts:
   grep "export \* from './config'" src/index.ts
   grep "export \* from './discovery'" src/index.ts
   grep "export \* from './security'" src/index.ts
   grep "export \* from './vulnerability'" src/index.ts
   ```

2. **Run final comprehensive verification**:
   ```bash
   cd /home/toffer/auth-optics-workspace/auth-optics/packages/shared
   pnpm build
   pnpm type-check
   ```

3. **Document time spent**:
   - Session 1 actual time: _____ (planned: 2-4 hours)
   - Session 2 actual time: _____ (planned: 3-4 hours)
   - Total Day 2 time: _____ (planned: 5-7 hours)

4. **Commit changes** (to be done by feature-implementer after verification):
   ```bash
   git add packages/shared/src/config packages/shared/src/discovery \
           packages/shared/src/security packages/shared/src/vulnerability
   git commit -m "feat(shared): implement Day 2 configuration & security types

   - Implemented configuration types (client, server, app config)
   - Implemented discovery types (OIDC discovery, OAuth metadata, JWKS)
   - Implemented security types (PKCE, state, nonce, assessment, indicators)
   - Implemented vulnerability types (config, toggles, categories)
   - All 18 files created with comprehensive JSDoc
   - RFC compliance verified (RFC 6749, 7636, 8414, OIDC Core)
   - All types integrate with Day 1 foundation types

   Phase 1 - Foundation: Shared Types (Day 2 complete)"
   ```

---

## Implementation Notes for Feature Implementer

### Key Decisions Already Made

1. **MVP Scope**: Only `DISABLE_PKCE` vulnerability toggle is functional in MVP; all 39 toggles are defined but inactive
2. **PKCE Required**: RFC 7636 compliance requires PKCE for all authorization code flows
3. **State Parameter**: RECOMMENDED in RFC 6749, but OAuth 2.1 makes it REQUIRED
4. **Nonce Parameter**: RECOMMENDED in Authorization Code Flow (required for Implicit)
5. **Type Safety**: No `any` types except where JSON parsing is necessary
6. **Immutability**: Security-critical fields (PKCE, state, nonce values) marked `readonly`

### Resources Available

- **Master Plan**: `@docs/implementation-plans/plan-shared-types-package-2025-12-24.md`
- **Component Spec**: `@docs/specs/auth-optics-shared-types-specification.md`
- **Architecture**: `@docs/specs/auth-optics-architecture.md`
- **OAuth2 Reference**: `@docs/reference/00-NAVIGATION-START-HERE.md`
- **Day 1 Implementation Example**: `@docs/implementation-plans/feature-implementer/shared-types-day-1-foundation.md`

### Time Expectations

- **Total estimated time**: 5-7 hours
- **Session 1** (config + discovery): 2-4 hours
  - Can break into sub-sessions if needed
  - Each file takes 30 min - 1 hour depending on complexity
- **Session 2** (security + vulnerability): 3-4 hours
  - Security types are more complex but well-specified
  - Vulnerability types have large config but well-structured
  - Testing and verification: 30 min - 1 hour

### What to Do If You Get Stuck

1. **Type definition issue**: Check Day 1 foundation types for patterns
2. **Import problem**: Verify barrel exports are set up correctly
3. **RFC reference**: Check `@docs/reference/00-NAVIGATION-START-HERE.md` for navigation
4. **Build error**: Run `pnpm clean && pnpm install && pnpm build`
5. **Unclear requirement**: Read the master plan Section 5 (Type Category Implementation)

---

**Document Created**: January 1, 2026
**Ready for Implementation**: Yes
**Blocks**: Backend OAuth2 client logic, Frontend security assessment display
**Blocked By**: Day 1 foundation types + PR #11 merge
