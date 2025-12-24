# Code Reviews

This directory contains security and quality reviews created by the **code-security-reviewer** subagent.

## Purpose

Code reviews ensure implemented code meets security requirements, follows best practices, and adheres to OAuth2/OIDC specifications.

## Naming Convention

`review-[component]-[date].md`

**Examples**:
- `review-backend-oauth2-client-2025-12-24.md`
- `review-frontend-token-inspector-2025-12-25.md`
- `review-shared-types-2025-12-23.md`

## Contents

Each code review should include:

1. **Summary** - Overall assessment (Pass/Pass with Issues/Fail)
2. **Scope** - What code was reviewed
3. **Security Findings** - OAuth2/OIDC security issues
4. **Quality Issues** - Code quality, TypeScript usage, patterns
5. **Best Practices** - Adherence to project guidelines
6. **Recommendations** - Suggested improvements
7. **Critical Issues** - Must-fix items blocking merge
8. **RFC Compliance** - Verification against specifications

## Severity Levels

- **Critical** - Security vulnerability or RFC violation (blocks merge)
- **High** - Significant issue affecting reliability or security
- **Medium** - Code quality or maintainability concern
- **Low** - Minor improvement suggestion

## Workflow

1. **feature-implementer** completes component implementation
2. **code-security-reviewer** agent reviews code
3. Review is written to this directory
4. Critical/High issues are added to @docs/context/pending-issues.md
5. Developer addresses issues
6. Follow-up review if needed

## Cross-References

- Reviews should reference @docs/specs/ for requirements verification
- Reviews should reference @docs/reference/ for RFC compliance
- Critical issues should be tracked in @docs/context/pending-issues.md
- Reviews should reference implementation plans when available
