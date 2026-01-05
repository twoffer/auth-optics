# Pending Issues

**Last Updated**: 2026-01-04 (Updated: Added PR #14 code review findings - 2 medium priority, 7 low priority enhancements)

**Test Status**: Day 1 Foundation Types - All tests PASSED (249/249 Priority 1)
- Infrastructure tests: 30/30 passed
- Type verification tests: 49/49 passed
- Priority 1 functional tests: 170/170 passed
  - Branded types validation: 58/58 passed
  - HTTP response function: 45/45 passed
  - Enum values: 41/41 passed
  - Interface object creation: 26/26 passed
- **Priority 2 tests: ADDED (not yet run)**
  - Integration tests: type-composition.test.ts
  - Edge case tests: edge-cases.test.ts
  - Type guard tests: type-guards.test.ts.skip (SKIPPED - awaiting implementation)
- Test coverage: 100% (tested modules)
- **Status**: ✅ Priority 1 APPROVED FOR PR MERGE

## Critical Issues (Block Progress)

None currently.

## High Priority

None currently.

## Medium Priority

### PR #14 Enhancement: GitHub Actions Error Handling

**Description**: Bash loop in GitHub Actions workflow could be more robust with explicit error handling.

**Impact**: Medium (CI/CD reliability)
**Location**: `.github/workflows/validate-config.yml:61`
**Source**: PR #14 review - [Inline comment](https://github.com/twoffer/auth-optics/pull/14#discussion_r2659927281)
**Recommendation**: Add `set -e` for explicit error handling and clearer error messages on validation failure
**Priority**: Medium
**Status**: Identified, not yet implemented

### PR #14 Enhancement: Session Key Validation

**Description**: Current session key validation could be more precise using regex to catch edge cases like `session_0` or `session_1_backup`.

**Impact**: Low-Medium (validation completeness)
**Location**: `scripts/src/lib/validator.ts:119`
**Source**: PR #14 review - [Inline comment](https://github.com/twoffer/auth-optics/pull/14#discussion_r2659927284)
**Recommendation**: Use regex pattern matching (`/^session_(\d+)$/`) for more comprehensive validation
**Priority**: Medium
**Status**: Identified, not yet implemented

### Missing Feature: Type Guard Functions

**Description**: Runtime type validation functions (type guards) are not yet implemented. These are required for production-ready validation of complex types.

**Impact**: Medium (production code quality)
**Location**: `packages/shared/src/utils/type-guards.ts` (does not exist)
**Test File**: `packages/shared/__tests__/unit/type-guards.test.ts.skip` (SKIPPED - documents expected behavior)

**Required Type Guards**:
1. `isValidJWT(value: unknown): value is JWTString`
   - Validate JWT structure (header.payload.signature)
   - Check base64url encoding
   - Verify non-empty parts

2. `isValidAccessToken(value: unknown): value is AccessToken`
   - Check required fields (token, tokenType, isJWT)
   - Validate token format matches isJWT flag
   - Verify tokenType is valid

3. `isValidFlowExecution(value: unknown): value is FlowExecution`
   - Check required fields
   - Validate enum values (flowType, status)
   - Verify timestamp format (ISO 8601)
   - Check config structure

4. `isValidFlowStep(value: unknown): value is FlowStep`
   - Check required fields
   - Validate stepNumber (non-negative integer)
   - Validate status enum
   - Verify timestamp consistency

**Requires**: feature-implementer agent
**Deferred to**: Day 2-3 or later
**Test Coverage**: Comprehensive test suite exists (SKIPPED until implementation)

### Enhancement: Add Maximum Length Validation to `asCodeVerifier()`

**Description**: RFC 7636 Section 4.1 specifies code verifiers must be between 43-128 characters. Current implementation only validates minimum (43 chars).

**Impact**: Low (spec compliance)
**Location**: `packages/shared/src/utils/branded-types.ts`
**Recommendation**: Add validation: `if (value.length > 128) throw new Error('Code verifier must not exceed 128 characters (RFC 7636)')`
**Deferred to**: Day 2 or later
**Test Coverage**: Edge case documented in tests (currently allows >128 chars)

## Low Priority / Nice to Have

### PR #14: Development Tool Enhancements

**Description**: Multiple low-priority enhancements identified for the prompt generation tool.

**Source**: PR #14 review - [Full review](https://github.com/twoffer/auth-optics/pull/14)

**Enhancements**:

1. **File Size Validation** (`scripts/src/lib/config-loader.ts:26`)
   - Add sanity check for config file size (e.g., 10MB limit)
   - Prevents accidental loading of corrupted/malformed large files
   - [Inline comment](https://github.com/twoffer/auth-optics/pull/14#discussion_r2659927276)

2. **Template Caching** (`scripts/src/generate-agent-prompts.ts:114`)
   - Cache compiled Handlebars templates for performance
   - Currently not needed (5 templates, <100ms validation)
   - Future-proofing for scaling to many templates
   - [Inline comment](https://github.com/twoffer/auth-optics/pull/14#discussion_r2659927278)

3. **Error Value Redaction** (`scripts/src/lib/validator.ts:69`)
   - Redact sensitive fields in validation error messages
   - Defense-in-depth for potential secrets in config
   - [Inline comment](https://github.com/twoffer/auth-optics/pull/14#discussion_r2659927277)

4. **Enhanced Error Messages** (`scripts/src/lib/context-builder.ts:25`)
   - More actionable guidance when config is incorrect
   - Suggest specific fixes in error messages
   - [Inline comment](https://github.com/twoffer/auth-optics/pull/14#discussion_r2659927280)

5. **JSDoc Documentation** (`scripts/src/types/config.ts:30`)
   - Add JSDoc comments for type interfaces
   - Improves IDE autocompletion and hints
   - [Inline comment](https://github.com/twoffer/auth-optics/pull/14#discussion_r2659927282)

6. **Snapshot Testing** (Testing suggestion)
   - Add snapshot tests for generated prompt files
   - Catch unintended changes in output format
   - See [comprehensive review summary](https://github.com/twoffer/auth-optics/pull/14#issuecomment-2571959516)

**Impact**: Low (quality of life improvements)
**Priority**: Low
**Status**: Identified, deferred to future iterations

### Enhancement: Token Utility Functions

**Description**: Common token operations (expiration checking, time remaining, JWT parsing) are not yet implemented as utility functions. These would reduce code duplication across frontend/backend packages.

**Impact**: Low (developer convenience)
**Location**: `packages/shared/src/utils/token-utils.ts` (does not exist)
**Source**: Code review recommendation #3 (@docs/reviews/review-shared-types-day-1-foundation.md)

**Suggested Utility Functions**:
1. `isTokenExpired(token: AccessToken, clockSkewSeconds?: number): boolean`
   - Check if access token has expired
   - Account for clock skew (default 60 seconds)

2. `getTimeRemaining(token: AccessToken): number`
   - Calculate seconds remaining until token expires
   - Return Infinity if no expiration

3. `parseJWT(jwtString: JWTString): { header: unknown; payload: unknown; signature: string }`
   - Parse JWT string into components
   - Decode base64url-encoded parts
   - Validate JWT format (3 parts)

**Requires**: feature-implementer agent
**Deferred to**: Phase 2 (when implementing token handling in frontend/backend)
**Note**: Consider creating separate `@auth-optics/shared-utils` package for consumer-facing utilities

## Resolved Recently

### Dependency Audit in CI (Completed 2026-01-05)

**Description**: Added `pnpm audit` step to GitHub Actions for proactive security monitoring of dependencies.

**Resolution**: Created new top-level CI workflow (`.github/workflows/ci.yml`) with comprehensive checks including security audit, linting, type checking, tests, and build verification.

**Implementation Details**:
- Security audit job runs `pnpm audit --audit-level=moderate` on all workspace packages
- Workflow runs on push/PR to main and develop branches
- Audit failures will block CI and prevent merges
- Additional jobs for lint, type-check, test, and build provide comprehensive CI coverage

**Source**: PR #14 review - [Inline comment](https://github.com/twoffer/auth-optics/pull/14#discussion_r2659927285)
**Implemented by**: Claude Code (2026-01-05)

---

**Notes**:
- Issues flagged by code-security-reviewer agent will appear here with links to full reviews
- Integration test failures from integration-validator agent will be tracked here
- Mark issues as resolved when fixed, with commit reference
