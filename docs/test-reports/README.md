# Test Reports

This directory contains test results and coverage reports created by the **test-suite-generator** and **integration-validator** subagents.

## Purpose

Test reports document test coverage, results, and validation of component functionality and integration.

## Naming Convention

**Unit/Component Tests**:
`test-[component]-[date].md`

**Integration Tests**:
`test-integration-[components]-[date].md`

**Examples**:
- `test-backend-oauth2-client-2025-12-24.md`
- `test-frontend-flow-timeline-2025-12-25.md`
- `test-integration-backend-keycloak-2025-12-26.md`
- `test-integration-shared-backend-2025-12-23.md`

## Contents

Each test report should include:

1. **Summary** - Overall test results (Pass/Fail counts, coverage %)
2. **Test Scope** - What was tested
3. **Test Results** - Detailed pass/fail for each test case
4. **Coverage Report** - Code coverage metrics
5. **Failed Tests** - Details of any failures
6. **Performance Metrics** - Execution time, resource usage (if relevant)
7. **Integration Points** - For integration tests, what was validated
8. **Recommendations** - Areas needing additional test coverage

## Test Types

### Unit Tests
- Individual service/component testing
- Mock dependencies
- Focus on logic correctness
- Target: 70%+ coverage for MVP

### Integration Tests
- Cross-component testing
- Real dependencies (or docker containers)
- Focus on interface contracts
- Examples: Backend ↔ KeyCloak, Frontend ↔ Backend API

### End-to-End Tests
- Complete flow testing
- All components involved
- User workflow validation
- Examples: Full Authorization Code Flow execution

## Workflow

1. **test-suite-generator** creates test suite for component
2. Tests are executed (automated or manual)
3. Results are written to this directory
4. Coverage gaps are identified
5. Failed tests are added to @docs/context/pending-issues.md
6. Integration test results update @docs/context/integration-checklist.md

## Cross-References

- Test reports should reference implementation plans when available
- Test reports should reference @docs/specs/ for requirement coverage
- Failed tests should be tracked in @docs/context/pending-issues.md
- Integration results should update @docs/context/integration-checklist.md
