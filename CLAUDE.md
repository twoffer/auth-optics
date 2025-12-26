@ROADMAP.md
@docs/specs/auth-optics-architecture.md
@docs/reference/00-NAVIGATION-START-HERE.md

# AuthOptics - Claude Code Context Guide

## Important Subdocuments

### 🗓️ [ROADMAP.md](ROADMAP.md) - Implementation Roadmap & Project Status

**PRIMARY REFERENCE** for implementation planning, task tracking, and project status

This is the authoritative source for:
- Detailed implementation phases (M phases, Day 1-N)
- Task breakdowns with time estimates
- Current project status and progress tracking
- Component dependencies and critical path
- Next actions and immediate tasks
- Success criteria and completion checklist

**When to use**: Consult this before starting any implementation work, checking project status, or planning next steps.

### 📚 [docs/CLAUDE.md](docs/CLAUDE.md) - Documentation Guidelines

**CRITICAL:** Read this BEFORE modifying any markdown files

**When you MUST read this:**
- Before using Edit/Write tools on any .md file
- If you see corrupted characters (âœ…, ðŸ"š, â"Œâ"€)
- Before creating new documentation

The documentation contains special Unicode characters (emojis, box-drawing, symbols) that require UTF-8 encoding. This subdocument contains:
- File encoding requirements and rules (UTF-8 non-negotiable)
- How to preserve special characters (emojis ✅📚, box-drawing ┌─│, symbols →←)
- Correct vs incorrect modification approaches
- Recovery procedures if encoding corruption occurs (fix_encoding.py script)

**Key Rule:** Always use the Read/Edit/Write tools for markdown files. NEVER use bash text manipulation commands (sed, awk, echo >, cat <<EOF).

**What's at stake:** Using wrong tools causes mojibake corruption (UTF-8 double-encoding) requiring script recovery.

## Project Status

**Implementation Progress:** 0% (Specifications Complete, No Code Written)
**Current Phase:** Pre-implementation
**Next Milestone:** Phase 1 - Foundation (Shared Types + KeyCloak Setup)

**Quick Status Check:**
- **Code Status:** No implementation yet - repository contains only documentation
- **Documentation:** Complete - 67 specification documents ready for implementation
- **Your Starting Point:** See ROADMAP.md Section "Next Actions" for Day 1 tasks
- **If Resuming Work:** Check ROADMAP.md "Current Project Status" table for latest progress

## Project Overview

OAuth2/OIDC debugging and educational tool for security professionals. Real-time flow visualization with vulnerability toggles for security education.

**MVP**: Authorization Code Flow with PKCE, flow visualization, JWT decoder, DISABLE_PKCE toggle, mock resource server.

**Philosophy**: RFC-compliant, security-first, functional over polish (rough UI acceptable for MVP)


## Architecture

**Monorepo**: pnpm workspace with 4 packages + KeyCloak

- **Frontend** (3000): React + Vite, flow visualization, JWT decoder
- **Backend** (3001): Express, OAuth2 client, PKCE, SSE events
- **Shared**: TypeScript types for all packages
- **Mock Resource Server** (3002): JWT validation demo, protected endpoints
- **KeyCloak** (8080): IdP with `oauth2-demo` realm, 7 clients, 4 users

**Full details**: `@docs/specs/auth-optics-architecture.md`


## Tech Stack

- **Frontend**: React 18, Vite 5, TypeScript 5, Tailwind CSS 3, Radix UI, axios
- **Backend**: Node.js 20 LTS, Express 4, TypeScript 5, axios, jose 5, uuid
- **Infrastructure**: pnpm 8 (monorepo), Docker Compose, KeyCloak 22

**Full dependency lists**: See package.json files or component specs in `@docs/specs/`


## Repository Structure

```
auth-optics/
├── docker/
│   ├── docker-compose.yml
│   └── keycloak/realm-export.json
├── packages/
│   ├── frontend/          # React app (port 3000)
│   ├── backend/           # Express API (port 3001)
│   ├── mock-resource-server/  # JWT validation (port 3002)
│   └── shared/            # Shared TypeScript types
├── scripts/
│   ├── init-keycloak.sh
│   └── test-keycloak.sh
├── docs/
│   ├── reference/         # OAuth2/OIDC specs
│   ├── specs/             # Implementation specs
│   ├── context/           # Shared context for subagent coordination
│   ├── implementation-plans/  # Technical architecture plans
│   ├── reviews/           # Code and security reviews
│   └── test-reports/      # Test results and coverage reports
├── .env.example
├── pnpm-workspace.yaml
├── CLAUDE.md              # This file
└── README.md
```

**Detailed structure**: See `@docs/specs/auth-optics-architecture.md`


## Build & Development

### Setup

```bash
git clone https://github.com/twoffer/auth-optics.git
cd auth-optics
pnpm install
cp .env.example .env
cd docker && docker-compose up -d keycloak
cd .. && ./scripts/init-keycloak.sh
pnpm dev
```

### Quick Commands

```bash
# Initial setup (run once)
pnpm install && cp .env.example .env
cd docker && docker-compose up -d keycloak && cd .. && ./scripts/init-keycloak.sh

# Development (daily)
pnpm dev           # Start all services with hot reload

# Docker operations
cd docker && docker-compose up -d keycloak    # Start KeyCloak only
cd docker && docker-compose down              # Stop all services
```

**Full command reference:** See ROADMAP.md Appendix B or package.json scripts

### Environment Variables

```env
# Backend (.env)
NODE_ENV=development
PORT=3001
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=oauth2-demo
KEYCLOAK_CLIENT_ID=web-app
KEYCLOAK_CLIENT_SECRET=<secret>
FRONTEND_URL=http://localhost:3000

# Frontend (.env)
VITE_API_URL=http://localhost:3001
VITE_RESOURCE_URL=http://localhost:3002

# Mock Resource Server (.env)
PORT=3002
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=oauth2-demo
```

**Full configuration details**: `@docs/specs/backend-configuration.md`


## Documentation Reference

### OAuth2/OIDC Reference Library

**Location**: `@docs/reference/`  
**Start here**: `@docs/reference/00-NAVIGATION-START-HERE.md`

Contains: OAuth2 flows, token specs, threat model (35+ attacks), PKCE, state parameter, JWT validation, security best practices, JWKS, discovery endpoints.

### What to Read When

**Starting a new session?**
→ Read this CLAUDE.md (you are here)
→ Then ROADMAP.md Section "Next Actions" for immediate tasks

**Implementing a specific component?**
→ Read `docs/specs/[component]-specification.md`
→ Example: Backend work? Read `authoptics-backend-specification.md`
→ Example: Frontend work? Read `authoptics-frontend-specification.md`

**Need OAuth2/OIDC protocol details?**
→ Start: `docs/reference/00-NAVIGATION-START-HERE.md`
→ Then navigate to specific flow/token/security document

**About to modify markdown files?**
→ Read `docs/CLAUDE.md` FIRST (UTF-8 encoding rules)

**Debugging KeyCloak integration?**
→ Read `docs/reference/keycloak/keycloak-troubleshooting.md`
→ Also: `docs/reference/keycloak/keycloak-testing-and-troubleshooting.md`

**Understanding security vulnerabilities?**
→ Start: `docs/reference/security/oauth2-oidc-threat-model.md`
→ Then: `docs/specs/vulnerability-mode-overview.md`

**Lost or unsure?**
→ Check ROADMAP.md "Critical Path" to understand dependencies
→ Check this CLAUDE.md for quick orientation
→ Check 00-NAVIGATION-START-HERE.md for OAuth2/OIDC reference navigation

### Implementation Specifications

**Location**: `@docs/specs/`  
**Start here**: `@docs/specs/auth-optics-architecture.md`

**Key specs by component:**
- **Shared**: `authoptics-shared-types-specification.md`
- **Backend**: `authoptics-backend-specification.md`, `backend-implementation-tasks.md` (3-week roadmap), `backend-core-services.md`, `backend-api-routes.md`, `backend-sse-events.md`
- **Frontend**: `authoptics-frontend-specification.md`, `frontend-components.md`, `frontend-state-management.md`, `frontend-implementation-guide.md`
- **Mock Resource**: `authoptics-mock-resource-server-specification.md`, `mock-resource-server-services.md`, `mock-resource-server-implementation-guide.md`
- **KeyCloak**: `keycloak-deployment.md`, `keycloak-realm-configuration.md`
- **Vulnerability Mode**: `vulnerability-mode-overview.md`, `vulnerability-mode-implementation.md`
- **Visualization**: `visualization-overview.md`, `visualization-implementation-guide.md`

### Usage Pattern

1. Read this `CLAUDE.md` for quick context
2. Read `@ROADMAP.md` for current status and next tasks
3. Read Claude subdocuments such as `@docs/CLAUDE.md`
4. Read `@docs/specs/auth-optics-architecture.md` for architecture overview
5. Read `@docs/reference/00-NAVIGATION-START-HERE.md` for OAuth2/OIDC reference
6. Find relevant spec in `@docs/specs/` for your component
7. Consult reference docs in `@docs/reference/` for RFC details


## Git Workflow

### Branch Naming Conventions

```bash
feature/<description>    # New features (e.g., feature/oauth2-client)
fix/<description>        # Bug fixes (e.g., fix/pkce-validation)
docs/<description>       # Documentation updates
refactor/<description>   # Code refactoring
chore/<description>      # Maintenance tasks
```

### Commit Messages (Conventional Commits)

```
<type>[scope]: <description>

[optional body]

[optional footer]
```

**Types**: feat, fix, docs, style, refactor, perf, test, chore, ci

**Examples:**
- `feat(backend): implement OAuth2 authorization flow with PKCE`
- `docs: add comprehensive OAuth2/OIDC reference library`
- `chore(shared): initialize TypeScript configuration`

### Git Worktrees (Optional)

For working on multiple features simultaneously:

```bash
# Create worktree for feature
git worktree add ../auth-optics-feature feature/feature-name
cd ../auth-optics-feature

# When done
cd ../auth-optics
git worktree remove ../auth-optics-feature
```

### Before Committing

- [ ] Run `pnpm lint` to check code style
- [ ] Run `pnpm test` to verify tests pass
- [ ] Verify markdown files don't have encoding corruption (check for âœ…, ðŸ"š patterns)
- [ ] Update ROADMAP.md progress if applicable


## Implementation Guidelines

**TypeScript**: Strict mode, explicit types, JSDoc for public APIs, named exports, interfaces for objects  
**Organization**: One component per file, service pattern for business logic, separation of concerns, DRY  
**Errors**: Custom error classes, React Error Boundaries, consistent API error format, user-friendly messages  
**Security**: No secrets in code, strict CORS, validate inputs, verify JWT signatures (jose), state + PKCE required  
**Testing**: Unit tests for services, integration tests for APIs, component tests with @testing-library/react, 70% coverage MVP target

**Details**: See component specs in `@docs/specs/`

## Implementation Decision Authority

**Claude Code CAN decide autonomously:**
- Variable/function naming (follow TypeScript conventions)
- Code organization within files
- Minor optimizations
- Testing approaches (unit vs integration)
- Error message wording
- Log message format

**Claude Code SHOULD consult specs for:**
- API endpoint paths and methods
- Type definitions (see shared package specs)
- OAuth2/OIDC protocol details (consult docs/reference/)
- Security implementations (PKCE, state validation, JWT verification)
- KeyCloak integration patterns

**Claude Code MUST NOT change without explicit user approval:**
- Package architecture (4-package monorepo structure)
- OAuth2/OIDC flow sequences (must follow RFCs)
- Port numbers (3000 frontend, 3001 backend, 3002 mock, 8080 KeyCloak)
- MVP scope (no feature creep beyond Authorization Code + PKCE)
- Dependency choices (React, Express, jose, Vite, etc.)

## Subagent Coordination & Output Locations

When multiple Claude Code subagents work in parallel or tandem on this project, they must maintain shared context and write outputs to standardized locations for seamless coordination.

### Standard Output Locations

All subagents performing development tasks MUST write outputs to these directories:

| Output Type | Location | Purpose | Naming Convention |
|-------------|----------|---------|-------------------|
| **Implementation Plans** | `@docs/implementation-plans/` | Technical architecture plans from technical-architect agent | `plan-[component]-[date].md` |
| **Detailed Implementation Plans** | `@docs/implementation-plans/[agent-type]/` | Agent-specific detailed plans (subsections, step-by-step) | `[descriptive-name].md` |
| **Code Reviews** | `@docs/reviews/` | Security and quality reviews from code-security-reviewer agent | `review-[component]-[date].md` |
| **Test Reports** | `@docs/test-reports/` | Test results and coverage reports from test-suite-generator or integration-validator agent | `test-[component]-[date].md` or `test-integration-[components]-[date].md` |
| **Current Context** | `@docs/context/` | Shared state for cross-agent coordination | See Context Files below |

### Context Files (Always Current)

The `@docs/context/` directory contains living documents that subagents MUST update when relevant. These files use **links** to other documents rather than duplicating content.

#### Required Context Files

| File | Purpose | Updated By |
|------|---------|------------|
| **`@docs/context/current-phase.md`** | Tracks active phase, component progress, recently completed work, and next steps | technical-architect, feature-implementer |
| **`@docs/context/pending-issues.md`** | Tracks issues by priority with links to reviews/tests that flagged them | code-security-reviewer, integration-validator |
| **`@docs/context/integration-checklist.md`** | Tracks pending, completed, and blocked integration tests | technical-architect, integration-validator |

**See**: `@docs/context/README.md` for detailed format guidelines and best practices.

### Subagent Responsibilities

**All subagents performing development tasks MUST:**

1. **Read context on startup**: Check `@docs/context/` files to understand current state
2. **Write outputs to standard locations**: Use the directories specified above
3. **Update context files**: Keep current-phase.md, pending-issues.md, integration-checklist.md current
4. **Use links, not duplication**: Reference other documents instead of copying content
5. **Update ROADMAP.md progress**: Mark tasks complete in the roadmap when finishing work

### Agent-Specific Output Requirements

| Agent Type | Primary Output Location | Context Updates Required |
|------------|------------------------|--------------------------|
| **technical-architect** | `@docs/implementation-plans/` | Update current-phase.md, integration-checklist.md |
| **feature-implementer** | Code files + inline docs; detailed plans to `@docs/implementation-plans/feature-implementer/` | Update current-phase.md when completing components |
| **code-security-reviewer** | `@docs/reviews/` | Update pending-issues.md with flagged issues and after reviewing fixed issues |
| **test-suite-generator** | `@docs/test-reports/` + test code | Update integration-checklist.md for integration tests |
| **integration-validator** | `@docs/test-reports/` | Update integration-checklist.md, pending-issues.md if failures |

### Example Workflow: Multiple Agents

**Scenario**: Implementing backend OAuth2 client service

1. **technical-architect** writes plan to `@docs/implementation-plans/plan-backend-oauth2-client-2025-12-24.md`
2. **technical-architect** updates `@docs/context/current-phase.md` with "Starting backend OAuth2 client implementation"
3. **feature-implementer** reads context, implements code
4. **feature-implementer** updates `@docs/context/current-phase.md` with progress
5. **code-security-reviewer** reviews code, writes to `@docs/reviews/review-backend-oauth2-client-2025-12-24.md`
6. **code-security-reviewer** updates `@docs/context/pending-issues.md` with any security concerns
7. **test-suite-generator** creates tests, writes results to `@docs/test-reports/test-backend-oauth2-client-2025-12-24.md`
8. **integration-validator** tests integration with KeyCloak, updates `@docs/context/integration-checklist.md`

### Context File Guidelines

**DO:**
- ✅ Link to detailed documents: `See @docs/reviews/review-name.md Section 3`
- ✅ Keep summaries brief (1-2 sentences per item)
- ✅ Update timestamps when modifying files
- ✅ Mark issues resolved when fixed
- ✅ Cross-reference related context files

**DON'T:**
- ❌ Copy full issue descriptions from reviews
- ❌ Duplicate roadmap content
- ❌ Leave stale entries (remove or mark resolved)
- ❌ Create new context file types without documenting here

## File Modification Quick Reference

| File Type | Read With | Modify With | ⚠️ Never Use |
|-----------|-----------|-------------|-------------|
| `.md` files | Read tool | Edit tool | bash sed/awk/echo > |
| `.ts/.tsx/.js` files | Read tool | Edit tool | ✓ bash ok for git ops |
| `package.json` | Read tool | Edit tool | ✓ bash ok for pnpm |
| `.env` files | Read tool | Edit tool | -- |
| Generated files (dist/) | Read tool | Don't modify | -- |

**Encoding Rule:** All markdown files are UTF-8. Special characters (✅ 📚 ┌─│ →) must be preserved exactly.

**Why this matters:** Markdown files contain Unicode characters that corrupt if wrong tools are used. See docs/CLAUDE.md for full details.

## Common Pitfalls

| Issue | Solution |
|-------|----------|
| CORS errors | Configure backend middleware with correct FRONTEND_URL |
| JWT verification fails | Verify KEYCLOAK_URL and JWKS endpoint accessibility |
| PKCE validation error | Ensure code_verifier stored and passed to token endpoint |
| State mismatch | Verify state stored in backend matches callback parameter |
| KeyCloak not ready | Run `./scripts/init-keycloak.sh` and wait for health check |
| Type import issues | Build shared package: `cd packages/shared && pnpm build` |


## MVP Scope & Implementation Status

**See [ROADMAP.md](ROADMAP.md)** for:
- Complete MVP feature checklist with status tracking
- Detailed implementation phases (Days 1-N)
- Current project status and progress (X% complete)
- Component-by-component breakdown with time estimates

**Quick Summary**: Authorization Code + PKCE, flow visualization, request/response inspector, JWT decoder, security indicators, DISABLE_PKCE toggle, mock resource server, KeyCloak integration

**Architecture details**: See `@docs/specs/auth-optics-architecture.md` section 10

## Success Criteria

**See [ROADMAP.md](ROADMAP.md) Section 9 "Success Criteria"** for complete acceptance criteria covering:
- Backend acceptance criteria (6 items)
- Frontend acceptance criteria (7 items)
- Integration acceptance criteria (4 items)
- Testing acceptance criteria (4 items)
- Documentation acceptance criteria (4 items)

**Key MVP Milestone**: User can successfully complete Authorization Code Flow with PKCE against KeyCloak, with all steps visualized in real-time, tokens decoded and validated, and security indicators displayed.


## Key Resources

**Specs**: [RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749), [RFC 7636 PKCE](https://datatracker.ietf.org/doc/html/rfc7636), [OIDC Core](https://openid.net/specs/openid-connect-core-1_0.html), [OAuth BCP](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)  
**Libraries**: [jose](https://github.com/panva/jose), [KeyCloak](https://www.keycloak.org/documentation), [React](https://react.dev/), [Express](https://expressjs.com/)

## Session Start Checklist

Every Claude Code session:

1. ✅ Read this `CLAUDE.md`
2. ✅ Read `@ROADMAP.md` for current project status and next tasks
3. ✅ Read Claude subdocuments such as `@docs/CLAUDE.md`
4. ✅ Read `@docs/specs/auth-optics-architecture.md`
5. ✅ Read `@docs/reference/00-NAVIGATION-START-HERE.md`
6. ✅ Find relevant component spec in `@docs/specs/`
7. ✅ **Only if debugging or testing live interactions with Keycloak**: Verify KeyCloak is running -> `curl http://localhost:8080/health/ready`

Before starting implementation work:
- Check `@ROADMAP.md` for current phase, next tasks, and blockers
- Identify where your work fits in the critical path
- Review relevant component specifications in `@docs/specs/`

Before implementing OAuth2/OIDC features:
- Consult `@docs/reference/` for RFC compliance
- Check threat model for security implications
- Verify implementation matches specifications

**Remember**: RFC compliance critical, security-first, functional > polish
