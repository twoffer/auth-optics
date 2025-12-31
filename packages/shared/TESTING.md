# Shared Types - Testing Guide

## Quick Start

### Run Tests

```bash
# From root
pnpm --filter @auth-optics/shared test

# Or from packages/shared
cd packages/shared
pnpm test
```

### Run Tests in Watch Mode

```bash
pnpm --filter @auth-optics/shared test -- --watch
```

### View Test Coverage

```bash
pnpm --filter @auth-optics/shared test:coverage
```

### Open Visual Test Dashboard

```bash
pnpm --filter @auth-optics/shared test:ui
```

## Adding New Tests

### Option 1: Use Vitest (Recommended)

1. Create a new file in the appropriate test directory:
   - Unit tests: `__tests__/unit/your-test-name.test.ts`
   - Integration tests: `__tests__/integration/your-test-name.test.ts`
   - E2E tests: `__tests__/e2e/your-test-name.test.ts`

2. Import vitest and types:
   ```typescript
   import { describe, it, expect } from 'vitest';
   import type { YourType } from '../../src/index';
   ```

3. Write tests:
   ```typescript
   describe('Your Type', () => {
     it('should work as expected', () => {
       const instance: YourType = { /* ... */ };
       expect(instance).toBeDefined();
     });
   });
   ```

4. Run tests:
   ```bash
   pnpm test
   ```

### Option 2: Type Assertions (TypeScript Compile-Time)

For simple type validation that should happen at compile time:

```typescript
import type { YourType } from '../src/index';

// These lines validate at compile time
type Test1 = YourType; // ✓ Pass if type exists, ✗ fail if not
type Test2 = YourType extends { property: string } ? true : false;
```

This is lighter-weight but doesn't provide runtime validation.

## Viewing Tests

### In the Terminal

```bash
pnpm test
```

Shows:
- List of all tests
- Pass/fail status
- Execution time
- Coverage (with `--coverage` flag)

### In the Browser (Visual Dashboard)

```bash
pnpm test:ui
```

Opens interactive dashboard showing:
- Test execution progress
- File browser
- Test details
- Coverage visualization

## Debugging Tests

### Run Single Test File

```bash
pnpm test -- types.test.ts
```

### Run Tests Matching Pattern

```bash
pnpm test -- --grep "Flow"
```

### Run with Detailed Output

```bash
pnpm test -- --reporter=verbose
```

### Watch Mode (Re-runs on File Changes)

```bash
pnpm test -- --watch
```

## Understanding Test Output

### Passing Test

```
✓ Flow Types (5 tests)
  ✓ should have FlowType enum with AUTHORIZATION_CODE_PKCE
  ✓ should have FlowStatus enum
  ✓ should support FlowExecution interface
  ✓ should support AuthorizationRequest with RFC 6749
  ✓ should support PKCE (RFC 7636) parameters
```

### Failing Test

```
✗ Token Types (1 test)
  ✗ should support AccessToken interface
    AssertionError: expected undefined to be defined
    at TokenTests (types.test.ts:42:12)
```

## Coverage Reports

### View Coverage in Terminal

```bash
pnpm test:coverage
```

Shows:
```
File      | % Statements | % Branch | % Funcs | % Lines
----------|--------------|----------|---------|--------
All files |        100   |    100   |   100   |   100
```

### View Coverage HTML Report

```bash
pnpm test:coverage
open coverage/index.html
```

Generates interactive HTML coverage report.

## Best Practices

1. **Organize by feature**: Use `describe()` blocks for each type or feature
2. **Write descriptive names**: Test names should explain what's being tested
3. **Test both happy path and error cases**: Include positive and negative tests
4. **Keep tests focused**: Each test should validate one thing
5. **Use meaningful assertions**: `expect(x).toBe(y)` is clearer than just checking existence
6. **Add comments for complex tests**: Help future maintainers understand the test

## Common Assertions

```typescript
// Existence
expect(value).toBeDefined();
expect(value).not.toBeUndefined();

// Equality
expect(value).toBe(expectedValue);
expect(value).toEqual(expectedObject);

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();

// Types
expect(Array.isArray(value)).toBe(true);
expect(typeof value).toBe('string');

// Strings
expect(value).toContain('substring');
expect(value).toMatch(/regex/);

// Arrays/Objects
expect(array).toContain(item);
expect(object).toHaveProperty('key');
```

## Continuous Integration

For CI/CD pipelines, run:

```bash
# Exits with non-zero if any test fails
pnpm test --run

# With coverage check
pnpm test:coverage --run
```

## Troubleshooting

### Tests not running
- Ensure files are in `__tests__/` directory or have `.test.ts/.test.js` extension
- Run `pnpm test -- --list` to see discovered tests

### TypeScript errors
- Check `pnpm type-check` for compilation errors
- Ensure imports match exports in `src/index.ts`

### Coverage not generating
- Install coverage provider: `pnpm install -D @vitest/coverage-v8`
- Already included in `package.json`

## Test Organization

Tests are organized into subdirectories by type:

- **`__tests__/unit/`** - Unit tests for individual functions, types, and utilities
  - Example: `infrastructure.test.ts`, `types-verification.test.ts`
- **`__tests__/integration/`** - Integration tests for interactions between modules
- **`__tests__/e2e/`** - End-to-end tests for complete workflows

This structure makes it easy to:
- Run specific types of tests (e.g., `vitest run unit/`)
- Understand test scope at a glance
- Scale the test suite as the project grows

## References

- **Vitest Docs**: https://vitest.dev/
- **Unit Test Examples**: `__tests__/unit/types-verification.test.ts`, `__tests__/unit/infrastructure.test.ts`

---

**Last Updated**: December 31, 2025
**Status**: ✅ Ready for development
