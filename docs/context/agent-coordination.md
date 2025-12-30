# Agent Coordination Guide

**Last Updated:** 2025-12-29
**Purpose:** Defines coordination protocols, responsibilities, and context scoping for Claude Code subagents

---

## Overview

This document establishes coordination rules for the 5 agent types working on AuthOptics:
1. `technical-architect` - Creates high-level implementation plans
2. `feature-implementer` (plan mode) - Creates detailed step-by-step plans
3. `feature-implementer` - Implements code according to detailed plans
4. `test-suite-generator` - Validates implementations
5. `code-security-reviewer` - Reviews code for security and quality

---

## Template-Based Prompt System

**IMPORTANT:** Agent prompts are **generated files** created from templates.

### How It Works

```
docs/prompts/config.yaml          → Configuration (EDIT THIS)
docs/prompts/templates/*.template → Templates (DO NOT EDIT)
        ↓
scripts/generate-agent-prompts.sh → Generation script
        ↓
docs/prompts/agent-*.md           → Generated prompts (DO NOT EDIT)
```

### To Update Prompts for New Component

**1. Edit the configuration:**
```bash
vim docs/prompts/config.yaml
# Update component name, paths, GitHub refs, and context flags
```

**2. Regenerate prompts:**
```bash
./scripts/generate-agent-prompts.sh
```

**That's it!** All 5 agent prompts are updated with the new configuration.

### Example: Switching to Backend Component

```yaml
# docs/prompts/config.yaml
component:
  name: "Backend OAuth2 Client"
  type: "backend"

paths:
  specification: "@docs/specs/auth-optics-backend-specification.md"
  # ... update other paths ...

github:
  pr: "#X"
  issue: "#Y"
  branch: "feature/backend-oauth2"

context:
  requires_oauth: true      # ← CHANGED
  requires_keycloak: true   # ← CHANGED
  security_critical: true   # ← CHANGED
```

Then run: `./scripts/generate-agent-prompts.sh`

### Benefits

✅ **Single source of truth** - Only edit config.yaml
✅ **No duplication** - Configuration appears in all 5 prompts automatically
✅ **Less error-prone** - No risk of updating one prompt but forgetting another
✅ **Version controlled** - config.yaml tracks component configuration over time

---

## Update Ownership Matrix

**Principle:** Each file has a PRIMARY owner to avoid conflicts. Others may add but not modify existing content.

| File/Section | Primary Owner | Others May Add | Update Frequency |
|-------------|---------------|----------------|------------------|
| **current-phase.md** | | | |
| → "Current Phase" | technical-architect | feature-implementer (update progress) | Daily |
| → "Recently Completed" | feature-implementer | - | Per completion |
| → "Next Steps" | technical-architect | feature-implementer (if blocked) | Per phase |
| **ROADMAP.md** | | | |
| → Task checkboxes `[x]` | feature-implementer | - | Per task |
| → Component progress % | feature-implementer | - | Per milestone |
| → "Known Blockers" | feature-implementer | test/review (if critical) | When discovered |
| → "Implementation Notes" | feature-implementer | - | Per decision |
| **CLAUDE.md** | | | |
| → "Project Status" | feature-implementer | - | Per milestone |
| **pending-issues.md** | | | |
| → New issues | test-suite-generator, code-security-reviewer | feature-implementer (if discovered during impl) | Immediately |
| → Mark resolved | feature-implementer | - | When fixed |
| **integration-checklist.md** | | | |
| → Add tests | technical-architect | feature-implementer (if discovered) | Per component |
| → Update status | integration-validator | - | Per test run |
| **Detailed plan docs** | | | |
| → Mark tasks `[x]` | feature-implementer | - | During implementation |

---

## Context Loading Rules (Per Agent Type)

**Problem:** Loading all 67+ reference docs wastes tokens and pollutes context.
**Solution:** Load only what's relevant to the current task.

### technical-architect

**Always Load:**
- Component specification: `@docs/specs/[component]-specification.md`
- Architecture overview: `@docs/specs/auth-optics-architecture.md`
- Project roadmap: `@ROADMAP.md`
- Current context: `@docs/context/current-phase.md`

**Conditionally Load:**
- **If planning OAuth2/OIDC flows**: `@docs/reference/flows/[specific-flow].md`
- **If planning token handling**: `@docs/reference/tokens/`
- **If planning security features**: `@docs/reference/security/oauth2-oidc-threat-model.md`
- **If planning KeyCloak integration**: `@docs/reference/keycloak/keycloak-integration-requirements.md`

**Never Load:**
- Entire `@docs/reference/` directory (too broad)
- Implementation plans from other components
- Test reports or reviews

### feature-implementer (plan mode)

**Always Load:**
- Master implementation plan: `@docs/implementation-plans/plan-[component]-[date].md`
- Component specification: `@docs/specs/[component]-specification.md`

**Conditionally Load:**
- **If component involves OAuth2 logic**: Relevant flow specs from master plan
- **If component involves JWT/tokens**: Token validation specs

**Never Load:**
- OAuth2 RFCs for non-OAuth components (e.g., shared types)
- Entire reference library

### feature-implementer (implementation)

**Always Load:**
- Detailed implementation plan: `@docs/implementation-plans/feature-implementer/[plan-name].md`
- Component specification: `@docs/specs/[component]-specification.md`
- Current context: `@docs/context/current-phase.md`

**Conditionally Load:**
- **If implementing OAuth2 client**: `@docs/reference/flows/authorization-code-flow-with-pkce.md`, `@docs/reference/security/pkce-implementation.md`
- **If implementing token validation**: `@docs/reference/tokens/jwt-structure-and-validation.md`
- **If implementing KeyCloak integration**: `@docs/reference/keycloak/keycloak-integration-requirements.md`
- **If implementing vulnerability mode**: `@docs/reference/security/oauth2-oidc-threat-model.md`

**Never Load:**
- Deprecated flow specs unless explicitly required
- Full reference library

### test-suite-generator

**Always Load:**
- Detailed implementation plan: `@docs/implementation-plans/feature-implementer/[plan-name].md`
- Component specification: `@docs/specs/[component]-specification.md`
- GitHub PR diff (if available)

**Conditionally Load:**
- **If testing OAuth2 flows**: Expected behavior from flow specs
- **If testing token validation**: JWT validation requirements
- **If testing security features**: Threat model for expected protections

**Never Load:**
- Implementation plans (only verification checklists)
- Full reference library

### code-security-reviewer

**Always Load:**
- Component specification: `@docs/specs/[component]-specification.md`
- Detailed implementation plan: `@docs/implementation-plans/feature-implementer/[plan-name].md`
- GitHub PR diff (if available)
- Security BCP: `@docs/reference/security/security-best-current-practice.md`

**Conditionally Load:**
- **If reviewing OAuth2 client code**: `@docs/reference/flows/`, `@docs/reference/security/pkce-implementation.md`
- **If reviewing token handling**: `@docs/reference/tokens/jwt-structure-and-validation.md`
- **If reviewing KeyCloak integration**: `@docs/reference/keycloak/keycloak-security-and-vulnerability-mode.md`
- **If reviewing input validation**: `@docs/reference/security/redirect-uri-validation.md`

**Never Load:**
- Test reports
- Other components' reviews

---

## Model Recommendations

**Cost/Performance Tradeoffs:**
- **haiku**: Fast, cheap, good for straightforward tasks
- **sonnet**: Balanced, good for most complex reasoning
- **opus**: Most capable, use sparingly for critical decisions

| Agent Type | Recommended Model | Rationale |
|-----------|-------------------|-----------|
| technical-architect | **sonnet** | Architecture decisions require complex reasoning |
| feature-implementer (plan mode) | **haiku** | Creating checklists is straightforward |
| feature-implementer | **sonnet** | Code writing requires understanding specs and patterns |
| test-suite-generator | **haiku** | Test execution is mostly mechanical |
| code-security-reviewer | **sonnet** | Security analysis requires deep understanding |

**Override to opus if:**
- Critical security features (PKCE, token validation, state management)
- Complex architectural decisions (flow orchestration, state management patterns)
- Debugging obscure OAuth2/OIDC compliance issues

---

## Agent Handoff Protocol

### Completion Signal Format

When an agent completes its task, it MUST output:

```markdown
---
✅ AGENT COMPLETE: [agent-type]

📁 Artifacts Created:
   - @docs/[path]/[filename].md
   - packages/[component]/[files] (if code written)

📋 Context Updates:
   - current-phase.md (updated: [section names])
   - pending-issues.md (added: [count] issues)
   - integration-checklist.md (updated: [items])

🎯 Ready For: [next-agent-type or "User Review"]

⚠️ Blockers for Next Agent:
   - [None / List specific blockers]
   - [Example: "KeyCloak configuration needed before integration tests"]

📝 Notes:
   - [Optional: key decisions, deviations from plan, etc.]
---
```

### Handoff Sequences

**Standard Flow:**
```
1. technical-architect
   ↓ (creates master plan)
2. feature-implementer (plan mode)
   ↓ (creates detailed plan)
3. feature-implementer
   ↓ (implements code, creates PR)
4. test-suite-generator ──┐
   ↓                       │ (can run in parallel)
5. code-security-reviewer ─┘
   ↓ (both complete)
6. User reviews PR and merges
```

**Simplified Flow (for simple components):**
```
1. technical-architect
   ↓ (creates master plan with implementation details)
2. feature-implementer
   ↓ (implements directly from master plan)
3. code-security-reviewer
   ↓
4. User reviews PR and merges
```

**When to skip plan mode:**
- Component is <200 lines of code
- No complex logic (e.g., config files, type definitions)
- Implementation is straightforward from spec

---

## Scope Guards (What Agents Should NOT Do)

### technical-architect
**DO:**
- Create comprehensive implementation plans
- Identify integration points and dependencies
- Recommend technologies and patterns
- Break down components into phases

**DO NOT:**
- Write code (only plan)
- Modify specifications (flag discrepancies instead)
- Update ROADMAP.md phases (read only)
- Make decisions requiring user input without asking

### feature-implementer (plan mode)
**DO:**
- Break master plan into step-by-step checklists
- Create verification procedures
- Identify required context for implementation

**DO NOT:**
- Write code (only planning)
- Deviate from master plan scope
- Add features not in master plan

### feature-implementer
**DO:**
- Implement exactly what's in the detailed plan
- Document implementation decisions in ROADMAP.md "Implementation Notes"
- Mark tasks complete as you finish them
- Update progress tracking

**DO NOT:**
- Implement features beyond the detailed plan (no scope creep)
- Refactor code outside the component scope
- Modify specification documents (flag discrepancies in pending-issues.md)
- Change architectural decisions (escalate to user)
- Skip verification steps

### test-suite-generator
**DO:**
- Validate against specification requirements
- Write test code if component has logic
- Document test failures in pending-issues.md
- Verify security properties

**DO NOT:**
- Fix code (report issues only)
- Modify implementation (testing only)
- Change test requirements (follow spec)

### code-security-reviewer
**DO:**
- Identify security vulnerabilities
- Check OAuth2/OIDC RFC compliance
- Suggest improvements
- Flag deviations from specifications

**DO NOT:**
- Fix code directly (suggest fixes in review)
- Modify specifications (flag discrepancies)
- Approve/reject PRs (user decision)
- Implement suggestions (reviewer role only)

---

## Exit Criteria Definitions

### "Implementation plan verified"
**Means:**
- ✓ All specification sections mapped to plan steps
- ✓ All file paths validated (existing files confirmed to exist)
- ✓ All dependencies explicitly listed
- ✓ Integration points documented
- ✓ Verification procedures defined

**How to verify:**
1. Compare plan sections to spec table of contents
2. Check for any spec requirements not covered in plan
3. Validate all file path references
4. Confirm all external dependencies listed

### "Ready for next phase"
**Means:**
- ✓ All exit criteria checkboxes checked
- ✓ Required artifacts created and documented
- ✓ No critical blockers in pending-issues.md
- ✓ Context files updated with current status
- ✓ Next agent has all required inputs

**How to verify:**
1. Review all exit criteria checkboxes
2. Confirm artifact files exist at specified paths
3. Check pending-issues.md for Critical/High priority blockers
4. Verify context files have "Last Updated" timestamp

### "All verifications pass"
**Means:**
- ✓ All verification scripts executed successfully
- ✓ All manual verification steps completed
- ✓ No test failures (or failures documented in pending-issues.md)
- ✓ Code builds without errors
- ✓ No critical issues blocking merge

**How to verify:**
1. Run all verification commands from detailed plan
2. Check exit codes (0 = success)
3. Review test output for failures
4. Confirm build succeeds

---

## Error Recovery

### If Agent Fails or Is Interrupted

**Immediate Actions:**
1. Document partial completion in `current-phase.md`:
   - What was completed (specific tasks/steps)
   - What remains (specific next steps)
   - Blockers encountered (technical details)

2. Check `pending-issues.md` for existing blockers related to failure

3. Add new blocker if not already documented:
   ```markdown
   - [ ] **CRITICAL**: [Brief description] - Agent [agent-type] failed at [step]
         - Details: [specific error or blocker]
         - File: [path if applicable]
         - See: [link to logs or details]
   ```

**Recovery Options:**

**Option 1: Resume Agent**
- Use `resume` parameter with agent ID
- Agent continues with full context preserved
- Best for: Temporary failures (API timeout, network issue)

**Option 2: Restart Agent**
- Start new agent instance
- Provide updated context from current-phase.md
- Best for: Agent went off track, need fresh start

**Option 3: Manual Intervention**
- Fix blocker manually
- Update pending-issues.md (mark resolved)
- Resume or restart agent

**Option 4: Escalate to User**
- If blocker requires architectural decision
- If external dependency unavailable
- If specification is ambiguous

### Common Failure Scenarios

| Scenario | Recovery Action |
|----------|-----------------|
| KeyCloak not running | Start KeyCloak: `cd docker && docker-compose up -d keycloak` |
| Missing environment variable | Copy `.env.example` to `.env`, configure |
| Build failure | Check `pending-issues.md` for known issues, fix dependencies |
| Test timeout | Increase timeout in test config, or mark as known flaky test |
| Specification ambiguity | Escalate to user with specific question |
| Agent went out of scope | Restart with clearer scope guards |

---

## Decision Authority

**Agents CAN decide autonomously:**
- Variable/function naming (follow TypeScript conventions)
- Code organization within files (follow established patterns)
- Minor optimizations (readability, performance)
- Testing approaches (unit vs integration, within scope)
- Error message wording (user-friendly, informative)
- Log message format (structured logging patterns)

**Agents SHOULD consult specs for:**
- API endpoint paths and methods (exact routes)
- Type definitions (must match shared package)
- OAuth2/OIDC protocol details (RFC compliance critical)
- Security implementations (PKCE, state, JWT validation)
- KeyCloak integration patterns (realm config, endpoints)

**Agents MUST NOT change without user approval:**
- Package architecture (4-package monorepo structure)
- OAuth2/OIDC flow sequences (must follow RFCs exactly)
- Port numbers (3000 frontend, 3001 backend, 3002 mock, 8080 KeyCloak)
- MVP scope (no features beyond Authorization Code + PKCE)
- Dependency choices (React, Express, jose, Vite, etc.)
- Specification documents (read-only; flag issues instead)

**Escalation triggers:**
- Specification contradicts RFC
- Security tradeoff decision needed
- Performance vs. security tradeoff
- Architectural pattern choice with multiple valid options
- Budget/timeline impact (major scope change)

---

## Quick Reference: When to Run Which Agent

```
┌─────────────────────────────────────────────────────────────────┐
│ Decision Tree: Which Agent Should I Run?                       │
└─────────────────────────────────────────────────────────────────┘

START: Need to implement a component?
  │
  ├─→ Is there an implementation plan? ──NO──→ Run: technical-architect
  │                                              (creates master plan)
  │                                              ↓
  ├─→ YES                                       Returns to START
  │
  ├─→ Is the plan detailed enough? ──NO──→ Run: feature-implementer (plan mode)
  │   (step-by-step checklist?)               (creates detailed plan)
  │                                              ↓
  ├─→ YES                                       Returns to START
  │
  ├─→ Is code already written? ──NO──→ Run: feature-implementer
  │                                     (implements code)
  │                                              ↓
  ├─→ YES                                       Creates PR
  │
  ├─→ Has code been tested? ──NO──→ Run: test-suite-generator
  │                                  (validates implementation)
  │                                              ↓
  ├─→ YES                                       Documents in test-reports/
  │
  ├─→ Has code been reviewed? ──NO──→ Run: code-security-reviewer
  │                                    (security & quality review)
  │                                              ↓
  └─→ YES                                       Documents in reviews/
      │
      └─→ All agents complete → User reviews PR → Merge
```

**Skip plan mode if:**
- Component is <200 LOC
- No complex logic (types, configs)
- Master plan has sufficient detail

**Skip tests if:**
- Pure type definitions (no logic)
- Documentation only
- Configuration files

**Skip review if:**
- Documentation changes only
- Non-code changes (configs without logic)

---

## Integration with Existing Workflow

This coordination guide integrates with the existing subagent workflow defined in `CLAUDE.md`:

```
Subagent Workflow (from CLAUDE.md):
┌────────────────────────────────────────────────────────┐
│ 1. Read context (@docs/context/*)                      │
│    → Now includes: agent-coordination.md for rules     │
├────────────────────────────────────────────────────────┤
│ 2. Perform task (using scoped context loading)        │
│    → Reference context loading rules in this doc      │
├────────────────────────────────────────────────────────┤
│ 3. Write output to standard locations                 │
│    → No change (same as before)                        │
├────────────────────────────────────────────────────────┤
│ 4. Update context files (per ownership matrix)        │
│    → Reference update ownership matrix in this doc    │
├────────────────────────────────────────────────────────┤
│ 5. Output completion signal (new requirement)         │
│    → Use handoff protocol format                       │
└────────────────────────────────────────────────────────┘
```

**Key additions:**
- Agents check this doc for context loading rules (avoid loading entire reference library)
- Agents check update ownership matrix before modifying shared files
- Agents use handoff protocol when complete

---

**Last Updated:** 2025-12-29
**Next Review:** After backend component complete
**Maintained by:** Project lead (update as patterns emerge)
