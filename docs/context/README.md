# Shared Context

This directory contains living documents that maintain the current state of the project for subagent coordination.

## Purpose

Context files allow multiple Claude Code subagents working in parallel or tandem to:
- Understand the current project state
- Identify pending issues and blockers
- Track integration testing needs
- Coordinate work without duplicating effort
- Maintain continuity across sessions

## Key Principle: Links Over Duplication

Context files should be **brief summaries with links** to detailed documents, not duplicates of full content.

**Good Example**:
```markdown
- [ ] PKCE validation error - See @docs/reviews/review-backend-oauth2-2025-12-24.md Section 3.2
```

**Bad Example** (too much detail):
```markdown
- [ ] PKCE validation error: The code_verifier is not being properly stored in the
  session state, causing token exchange to fail. The OAuth2Client.generateAuthUrl()
  method needs to be updated to store the verifier in sessionStorage...
```

## Agent Coordination

**See:** [agent-coordination.md](agent-coordination.md) for detailed coordination protocols including:
- **Template-based prompt system** (how to update prompts for new components)
- Update ownership matrix (who updates what)
- Context loading rules (scoped references per agent type)
- Model recommendations (haiku/sonnet/opus)
- Handoff protocol (completion signals)
- Scope guards (what agents should/shouldn't do)
- Error recovery procedures

**All agents MUST consult agent-coordination.md before starting work.**

### Updating Agent Prompts

Agent prompts in `docs/prompts/` are **generated files**. To update them:

1. Edit `docs/prompts/config.yaml` (single source of truth)
2. Run `./scripts/generate-agent-prompts.sh`

Do NOT edit the agent prompt files directly - your changes will be overwritten!

---

## Required Files

### current-phase.md
**Purpose**: Track which implementation phase is active and component progress

**Updated by**:
- technical-architect (when starting new phases)
- feature-implementer (when completing components)

**Update frequency**: Daily during active development

### pending-issues.md
**Purpose**: Track issues flagged by reviews and tests with priority levels

**Updated by**:
- code-security-reviewer (when flagging security/quality issues)
- integration-validator (when tests fail)
- feature-implementer (when resolving issues)

**Update frequency**: Immediately when issues are found or resolved

### integration-checklist.md
**Purpose**: Track integration testing needs and status

**Updated by**:
- technical-architect (when identifying integration points)
- integration-validator (when completing integration tests)
- feature-implementer (when components become ready for integration)

**Update frequency**: When components complete or integration tests run

## Subagent Responsibilities

**All development subagents MUST**:
1. Read context files at startup to understand current state
2. Update relevant context files when completing work
3. Use links to reference detailed documents
4. Update timestamps when modifying files
5. Remove or mark resolved items (don't leave stale entries)

## File Format

All context files use Markdown format with:
- **Last Updated** timestamp at top or bottom
- Clear section headers
- Checkbox lists for trackable items
- Links using `@docs/path/to/file.md` format
- Brief summaries (1-2 sentences max per item)

## Cross-References

- Context files reference @docs/implementation-plans/ for technical designs
- Context files reference @docs/reviews/ for security and quality issues
- Context files reference @docs/test-reports/ for test results
- Context files reference @ROADMAP.md for phase details and task breakdowns
- Context files reference @docs/specs/ for component specifications

## Workflow Integration

```
┌─────────────────────────────────────────────────────────────┐
│  Subagent starts work                                       │
│  ↓                                                           │
│  Reads @docs/context/* to understand current state          │
│  ↓                                                           │
│  Performs task (planning, implementation, review, testing)  │
│  ↓                                                           │
│  Writes output to standard location:                        │
│    - Implementation plans → @docs/implementation-plans/     │
│    - Code reviews → @docs/reviews/                          │
│    - Test reports → @docs/test-reports/                     │
│  ↓                                                           │
│  Updates @docs/context/* with:                              │
│    - current-phase.md (progress updates)                    │
│    - pending-issues.md (new issues or resolutions)          │
│    - integration-checklist.md (integration status)          │
│  ↓                                                           │
│  Next subagent can pick up with current context             │
└─────────────────────────────────────────────────────────────┘
```

## Best Practices

**DO**:
- ✅ Keep entries brief (1-2 sentences)
- ✅ Link to detailed documents
- ✅ Update timestamps
- ✅ Remove stale entries
- ✅ Mark items complete when resolved
- ✅ Use consistent formatting
- ✅ Cross-reference related files

**DON'T**:
- ❌ Copy full issue descriptions
- ❌ Duplicate roadmap content
- ❌ Leave outdated entries
- ❌ Create new context file types without documenting
- ❌ Write implementation details here (use links)
- ❌ Forget to update timestamps
