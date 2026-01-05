# YAML Schema Validation - Quick Reference

## Common Commands

```bash
# Validate config
pnpm validate

# Validate specific file
pnpm --filter auth-optics-scripts validate -- docs/prompts/my-config.yaml

# Run test suite
pnpm --filter auth-optics-scripts test

# Watch mode for development
pnpm --filter auth-optics-scripts test:watch

# Complete validation (Schema + Tests)
pnpm validate:all

# Install pre-commit hooks
pip install pre-commit && pre-commit install

# Run pre-commit manually
pre-commit run --all-files
```

## When Things Go Wrong

### ❌ "Additional property X is not allowed"
**Fix**: Remove the extra field or update the schema

### ❌ "Property 'X' is required"
**Fix**: Add the missing field

### ❌ "'value' does not match pattern"
**Fix**: Update value to match expected format
- Durations: `2-4 hours` (not `2 hours`)
- GitHub: `#12` (not `12`)

**Note**: Section references are freeform (any format is valid)

### ❌ "session.current (X) is greater than session.total (Y)"
**Fix**: Ensure `current <= total`

## Quick Setup

### VS Code
1. Install "YAML" extension by Red Hat
2. Open config.yaml
3. Schema validates automatically ✨

### Terminal
```bash
# One-time setup
pnpm install

# Use anytime
pnpm validate
```

### Pre-commit Hooks
```bash
# Setup once
pre-commit install

# Now validates on every commit automatically
```

## Schema Cheat Sheet

```yaml
component:
  name: "Component Name"
  type: types|service|component|feature|api|ui|integration

session:
  enabled: true
  current: 1
  total: 2
  session_1:
    scope: "Description"
    duration: "2-4 hours"  # Must match pattern: N-N hours
    file_count: 8
    plan_sections:
      # Section references are freeform - any of these formats work:
      file_list: "Section 3.1"                    # Single section
      implementation: "Section 3.1, Section 3.2"  # Multiple sections
      verification: "Section 4.3"
      completion_checklist: "Section 1.1-4.3"     # Range
    prerequisites_check_ref: "Section 2.1"

paths:
  specification: "@docs/specs/spec.md"
  master_plan: "@docs/plans/plan.md"
  detailed_plan: "@docs/plans/detail.md"

github:  # Optional
  pr: "#12"
  issue: "#10"
  branch: "feature/name"

context:  # Optional
  requires_oauth: false
  requires_keycloak: false
  security_critical: false

models:
  feature_implementer: haiku|sonnet|opus  # Required
  technical_architect: haiku|sonnet|opus   # Optional
  test_suite_generator: haiku|sonnet|opus  # Optional
  code_security_reviewer: haiku|sonnet|opus  # Optional
```

## Files to Know

| File | Purpose |
|------|---------|
| `config.yaml` | Main configuration |
| `config.schema.json` | Schema definition |
| `README-SCHEMA.md` | Detailed documentation |
| `VALIDATION-GUIDE.md` | Best practices guide |
| `scripts/src/validate-config.ts` | Validation script |

## Help

- **Detailed docs**: See `VALIDATION-GUIDE.md`
- **Schema reference**: See `README-SCHEMA.md`
- **Implementation notes**: See `VALIDATION-SUMMARY.md`

---
*For full documentation, see VALIDATION-GUIDE.md*
