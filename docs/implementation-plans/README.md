# Implementation Plans

This directory contains technical architecture plans created by the **technical-architect** subagent.

## Purpose

Implementation plans provide detailed technical design and implementation strategies for components and features before coding begins.

## Naming Convention

**High-level plans (technical-architect)**: `plan-[component]-[date].md`

**Examples**:
- `plan-backend-oauth2-client-2025-12-24.md`
- `plan-frontend-flow-visualization-2025-12-25.md`
- `plan-integration-backend-keycloak-2025-12-26.md`

**Detailed plans (other agents)**: `[agent-type]/[descriptive-name].md`

**Examples**:
- `feature-implementer/shared-types-package-sections-1-to-3.md`
- `feature-implementer/backend-oauth2-client-step-by-step.md`
- `test-suite-generator/backend-services-test-plan.md`

**When to create detailed plans**: Agents should create their own detailed implementation plans in their subdirectory when breaking down a high-level plan into specific steps or when creating step-by-step guides for complex subsections.

## Contents

Each implementation plan should include:

1. **Component Overview** - What is being implemented
2. **Architecture** - High-level design decisions
3. **Dependencies** - What this component depends on
4. **Implementation Steps** - Detailed step-by-step tasks
5. **Testing Strategy** - How to verify the implementation
6. **Integration Points** - How this integrates with other components
7. **Security Considerations** - OAuth2/OIDC security requirements
8. **RFC References** - Relevant specification sections

## Workflow

1. **technical-architect** agent creates plan based on specifications
2. Plan is reviewed and approved
3. **feature-implementer** agent uses plan to guide implementation
4. Plan is referenced in code reviews and test reports

## Cross-References

- Plans should reference @docs/specs/ specifications
- Plans should reference @docs/reference/ OAuth2/OIDC documents
- Plans should update @docs/context/current-phase.md when created
- Plans should update @docs/context/integration-checklist.md with integration needs
