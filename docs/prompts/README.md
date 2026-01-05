# Agent Prompts (Template-Based System)

This directory contains agent prompt files that are **generated** from templates.

## ⚠️ Important

**DO NOT EDIT THE AGENT PROMPT FILES DIRECTLY!**

Files like `agent-technical-architect.md`, `agent-feature-implementer.md`, etc. are automatically generated from templates and will be overwritten when you run the generation script.

## How It Works

```
config.yaml                    → Single source of truth (EDIT THIS)
templates/*.template           → Prompt templates (DO NOT EDIT unless changing structure)
        ↓
../../scripts/generate-agent-prompts.sh → Generation script
        ↓
agent-*.md                     → Generated prompts (DO NOT EDIT)
```

## Quick Start: Updating for a New Component

### 1. Edit the configuration

```bash
vim config.yaml
```

Update these sections:
- `component.name` - Component name (e.g., "Backend OAuth2 Client")
- `component.type` - Component type (types|backend|frontend|mock-resource-server)
- `paths.*` - File paths for specs, plans, reviews, etc.
- `github.*` - PR number, issue number, branch name
- `context.*` - Context loading flags (requires_oauth, requires_keycloak, security_critical)
- `testing.*` - Test configuration (type, write_test_code)

### 2. Generate prompts

```bash
cd ../../  # Go to project root
./scripts/generate-agent-prompts.sh
```

**That's it!** All 5 agent prompts are now updated with the new configuration.

## Example Configurations

### Shared Types (Current)

```yaml
component:
  name: "Shared Types package initialization"
  type: "types"

context:
  requires_oauth: false
  requires_keycloak: false
  security_critical: false
```

### Backend OAuth2 Client (Example)

```yaml
component:
  name: "Backend OAuth2 Client"
  type: "backend"

paths:
  specification: "@docs/specs/auth-optics-backend-specification.md"
  master_plan: "@docs/implementation-plans/plan-backend-oauth2-2025-12-29.md"
  # ... etc ...

github:
  pr: "#X"
  issue: "#Y"
  branch: "feature/backend-oauth2"

context:
  requires_oauth: true      # Loads OAuth2/OIDC specs
  requires_keycloak: true   # Loads KeyCloak docs
  security_critical: true   # Loads threat model

testing:
  type: "integration"
  write_test_code: true
```

### Frontend Flow Timeline Component (Example)

```yaml
component:
  name: "Frontend Flow Timeline Component"
  type: "frontend"

context:
  requires_oauth: false     # UI component, doesn't need OAuth specs
  requires_keycloak: false
  security_critical: false

testing:
  type: "unit"
  write_test_code: true
```

## Configuration File Reference

### Schema Structure

The configuration file is validated against `config.schema.json`. Key sections:

**component** (required):
```yaml
component:
  name: "Component Name"
  type: types|service|component|feature|api|ui|integration
```

**session** (required):
```yaml
session:
  enabled: true
  current: 1
  total: 2
  session_1:
    scope: "Description"
    duration: "2-4 hours"  # Pattern: N-N hours
    file_count: 8
    plan_sections:
      file_list: "Section 3.1"
      implementation: "Section 3.1, Section 3.2"
      verification: "Section 4.3"
      completion_checklist: "Section 1.1-4.3"
    prerequisites_check_ref: "Section 2.1"
```

**paths** (required):
```yaml
paths:
  specification: "@docs/specs/spec.md"
  master_plan: "@docs/plans/plan.md"
  detailed_plan: "@docs/plans/detail.md"
```

**github** (optional):
```yaml
github:
  pr: "#12"        # Pattern: #N
  issue: "#10"     # Pattern: #N
  branch: "feature/name"
```

**context** (optional):
```yaml
context:
  requires_oauth: false
  requires_keycloak: false
  security_critical: false
```

**models** (required):
```yaml
models:
  feature_implementer: haiku|sonnet|opus  # REQUIRED
  technical_architect: haiku|sonnet|opus   # Optional
  test_suite_generator: haiku|sonnet|opus  # Optional
  code_security_reviewer: haiku|sonnet|opus  # Optional
```

See `config.yaml` for complete structure and inline documentation.

## Generated Files

The following files are automatically generated:

- `agent-technical-architect.md` - Creates implementation plans
- `agent-feature-implementer-plan-mode.md` - Creates detailed step-by-step plans
- `agent-feature-implementer.md` - Implements code
- `agent-test-suite-generator.md` - Tests implementations
- `agent-code-security-reviewer.md` - Reviews code for security/quality

## Templates

Templates are stored in `templates/` and use two types of syntax:

### Variable Substitution

Simple `{{variable}}` placeholders that are replaced with values from config.yaml:

- `{{component_name}}` - Component name from config
- `{{specification}}` - Path to component specification
- `{{github_pr}}` - GitHub PR number
- ... and many more (see templates for full list)

### Conditional Blocks

Templates use `{{#if condition}}...{{#endif condition}}` blocks to include/exclude sections based on boolean configuration flags:

```markdown
{{#if requires_oauth_context}}
**OAuth2/OIDC Context:**
- START HERE: @docs/reference/00-NAVIGATION-START-HERE.md
- ...
{{#endif requires_oauth_context}}
```

**How it works:**
- If `requires_oauth: true` in config → Section is included, conditional markers are removed
- If `requires_oauth: false` in config → Entire section is completely removed

**Result:** Agents receive only the context loading instructions relevant to their specific component.

**Example:** For Shared Types (requires_oauth: false), the generated prompt contains NO OAuth2/OIDC context sections. For Backend OAuth Client (requires_oauth: true), those sections are present.

**Available conditional flags:**
- `{{#if requires_oauth_context}}` - OAuth2/OIDC specifications
- `{{#if requires_keycloak_context}}` - KeyCloak integration docs
- `{{#if security_critical}}` - Security threat model
- `{{#if write_test_code}}` - Test code writing guidance

## Modifying Templates

⚠️ **Only modify templates if you need to change the prompt structure itself, not the component-specific information.**

If you need to:
- Change component name, paths, GitHub refs → Edit `config.yaml`
- Add/modify sections in all prompts → Edit templates, then regenerate

After modifying templates, always run the generation script to update the prompt files.

## Validation

The configuration is validated using JSON Schema before prompt generation.

### Automatic Validation

**Editor Integration** (real-time feedback):
- VS Code: Install "YAML" extension by Red Hat
- Schema is automatically detected via the header comment in `config.yaml`
- Get autocomplete, inline errors, and hover documentation

**Command-line validation**:
```bash
pnpm validate              # Validate default config
pnpm validate:all          # Validate + run tests
```

**CI/CD**: Validation runs automatically in GitHub Actions on pull requests.

### Common Validation Errors

**"Additional property X is not allowed"**: Remove the extra field or update the schema

**"Property 'X' is required"**: Add the missing field

**"'value' does not match pattern"**:
- Durations must be `N-N hours` (not `N hours`)
- GitHub refs must be `#N` (not `N`)

**"session.current > session.total"**: Ensure current session ≤ total sessions

## Troubleshooting

### Generated files look corrupted

Check that templates use UTF-8 encoding and contain valid `{{variable}}` placeholders.

### Validation fails

Run `pnpm validate` to see detailed error messages with location and constraint information.

### Need to revert to previous configuration

Use git to view previous versions of `config.yaml`:

```bash
git log -p config.yaml
git checkout <commit> config.yaml
pnpm generate-prompts
```

## See Also

- **Coordination guide:** `@docs/context/agent-coordination.md` - Agent coordination protocols
- **Context README:** `@docs/context/README.md` - Context file usage
- **Architecture:** `@docs/specs/auth-optics-architecture.md` - Overall system design

---

**Last Updated:** 2025-12-29
**Maintained by:** Project lead
