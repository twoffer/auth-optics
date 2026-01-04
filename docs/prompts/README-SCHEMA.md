# Configuration Schema Validation

This directory contains the agent prompt configuration system with JSON Schema validation.

## Files

| File | Purpose |
|------|---------|
| `config.yaml` | Main configuration file for agent prompt generation |
| `config.schema.json` | JSON Schema defining the valid structure of config.yaml |
| `config-*.yaml` | Alternative/example configurations |

## Validation

### Command Line Validation

Validate the default config file:
```bash
pnpm validate
```

Validate a specific config file:
```bash
pnpm --filter auth-optics-scripts validate -- docs/prompts/config.yaml
```

### Editor Integration

The config.yaml file includes a schema directive at the top:
```yaml
# yaml-language-server: $schema=./config.schema.json
```

This enables automatic validation in editors that support the YAML Language Server:
- **VS Code**: Install the "YAML" extension by Red Hat
- **IntelliJ/PyCharm**: Built-in YAML support
- **Vim/Neovim**: Use coc-yaml or yaml-language-server

### CI/CD Integration

Add validation to your CI pipeline:
```yaml
# .github/workflows/validate.yml
- name: Validate config
  run: pnpm validate
```

## Schema Structure

The schema validates the following top-level sections:

### `component` (required)
Defines the component being implemented.

```yaml
component:
  name: "Component Name"
  type: "types" # One of: types, service, component, feature, api, ui, integration
```

### `session` (required)
Multi-session implementation configuration.

```yaml
session:
  enabled: true
  current: 1
  total: 2

  session_1:
    scope: "Session description"
    duration: "2-4 hours"
    file_count: 8
    plan_sections:
      file_list: "Section 3.1"
      implementation: "Section 3.1"
      verification: "Section 4.3"
      completion_checklist: "Section 6.1"
    prerequisites_check_ref: "Section 2.1"
```

**Section Reference Formats**:
Section references are freeform strings and can use any of these formats:
- Single section: `"Section 3.1"`
- Multiple sections: `"Section 1.2, Section 6.4"`
- Section ranges: `"Section 1.1-4.3"`
- Combined: `"Section 1.1-4.3, Section 5"`

**Validation rules**:
- `current` must be between 1 and `total`
- `duration` must match pattern: `N-N hours`
- Section references must be non-empty strings (flexible format)
- `session_N` objects must exist for each session from 1 to `total`

### `paths` (required)
File path references using `@docs/` notation.

```yaml
paths:
  specification: "@docs/specs/component-spec.md"
  master_plan: "@docs/implementation-plans/master-plan.md"
  detailed_plan: "@docs/implementation-plans/agent/detailed-plan.md"
  output_plan: "@docs/implementation-plans/agent/output.md"          # optional
  output_review: "@docs/reviews/review-output.md"                   # optional
  output_test_report: "@docs/test-reports/test-output.md"          # optional
```

### `github` (optional)
GitHub references.

```yaml
github:
  pr: "#12"
  issue: "#10"
  branch: "feature/branch-name"
```

**Validation rules**:
- `pr` and `issue` must match pattern: `#N` where N is a number

### `context` (optional)
Context loading flags for agent initialization.

```yaml
context:
  requires_oauth: false
  requires_keycloak: false
  security_critical: false
```

### `models` (required)
Model recommendations for different agent types.

```yaml
models:
  technical_architect: "sonnet"       # optional
  feature_implementer_plan: "haiku"   # optional
  feature_implementer: "sonnet"       # REQUIRED
  test_suite_generator: "haiku"       # optional
  code_security_reviewer: "sonnet"    # optional
  integration_validator: "sonnet"     # optional
```

**Valid model values**: `haiku`, `sonnet`, `opus`

## Common Validation Errors

### Error: "Additional property X is not allowed"
**Cause**: You have an extra field that's not in the schema.
**Fix**: Remove the extra field or update the schema if it's a new valid field.

### Error: "Property 'X' is required"
**Cause**: A required field is missing.
**Fix**: Add the missing field to your config.

### Error: "Value does not match pattern"
**Cause**: A string value doesn't match the expected format (e.g., durations must be `N-N hours`).
**Fix**: Update the value to match the pattern shown in the error message.

**Note**: Section references are freeform strings and have no pattern restrictions.

### Warning: "session.current (X) is greater than session.total (Y)"
**Cause**: The current session number exceeds the total.
**Fix**: Ensure `current <= total`.

### Warning: "session.session_N is missing"
**Cause**: You have `total: 3` but only `session_1` and `session_2` are defined.
**Fix**: Add the missing session configuration or adjust `total`.

## Extending the Schema

To add new configuration options:

1. Edit `config.schema.json`
2. Add the new property to the appropriate section
3. Define the type, validation rules, and description
4. Update this README with the new field
5. Validate your changes: `pnpm validate`

Example addition:
```json
{
  "properties": {
    "myNewSection": {
      "type": "object",
      "description": "My new configuration section",
      "properties": {
        "myField": {
          "type": "string",
          "description": "My new field",
          "minLength": 1
        }
      }
    }
  }
}
```

## Schema Development

### Testing Schema Changes

1. Make changes to `config.schema.json`
2. Test with valid config: `pnpm validate`
3. Test with intentionally invalid config to ensure errors are caught
4. Update documentation

### Schema Validation Tools

- **Online validator**: https://www.jsonschemavalidator.net/
- **Schema generator**: https://transform.tools/json-to-json-schema

## Dependencies

Required packages (install with `pnpm install`):
- `yaml` - YAML parsing
- `ajv` - JSON Schema validation
- `handlebars` - Template rendering (for agent prompt generation)

## References

- [JSON Schema Documentation](https://json-schema.org/)
- [JSON Schema Draft 7](http://json-schema.org/draft-07/schema)
- [YAML Language Server](https://github.com/redhat-developer/yaml-language-server)

---

**Last Updated**: 2026-01-02
**Schema Version**: 1.0.0
