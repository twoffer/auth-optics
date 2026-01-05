# Test Suite Organization

This directory contains comprehensive tests for the TypeScript agent prompt generation system.

## Test Files

### Unit Tests (Library Functions)

#### `validation-library.test.ts` (15 tests)
Tests the core validation logic without CLI overhead:
- **Schema validation** - JSON Schema compilation and validation
- **Session logic** - Business rule validation (current ≤ total, session keys present, etc.)
- **Edge cases** - Invalid types, missing fields, malformed data
- **Production config** - Validates the actual `docs/prompts/config.yaml`

**What it tests:**
- `validateSchema()` function from `src/lib/validator.ts`
- `validateSessionLogic()` function from `src/lib/validator.ts`
- Direct function calls (no CLI execution)

#### `lib-functions.test.ts` (29 tests)
Tests other library functions:
- **Config loading** - YAML/JSON parsing
- **Context building** - Template context generation
- **Performance** - Validation and context building speed

**What it tests:**
- `loadConfig()` from `src/lib/config-loader.ts`
- `buildContext()` from `src/lib/context-builder.ts`
- Direct function calls (no CLI execution)

### Integration Tests (CLI Scripts)

#### `validate-config-cli.test.ts` (15 tests)
Tests the validate-config.ts command-line script:
- **Exit codes** - 0 for valid, 1 for invalid
- **Output formatting** - Success messages (✅), errors (❌), warnings (⚠️)
- **Error handling** - Missing files, invalid YAML, missing schema
- **Default behavior** - No arguments uses `docs/prompts/config.yaml`
- **End-to-end** - Full validation workflow

**What it tests:**
- `src/validate-config.ts` script execution via `execSync()`
- Command-line interface behavior
- User experience (error messages, formatting)

## Test Organization Philosophy

The test suite is organized by **what is being tested** rather than duplicating test cases:

### ✅ Unit Tests
- Test library functions **directly** (function imports)
- Fast execution (no process spawning)
- Focus on logic correctness
- Located in: `validation-library.test.ts`, `lib-functions.test.ts`

### ✅ Integration Tests
- Test CLI scripts **via execution** (`execSync()`)
- Slower execution (spawn processes)
- Focus on user experience
- Located in: `validate-config-cli.test.ts`

## Why This Structure?

### Before Consolidation ❌
- **config-validation.test.ts** - Mixed library and production config tests
- **validate-config.test.ts** - Mixed library and CLI tests
- **Result:** Confusion about which file tests what, redundant test cases

### After Consolidation ✅
- **validation-library.test.ts** - Pure unit tests for validation logic
- **validate-config-cli.test.ts** - Pure integration tests for CLI
- **lib-functions.test.ts** - Unit tests for other library functions
- **Result:** Clear separation of concerns, no redundancy

## Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test validation-library
pnpm test validate-config-cli
pnpm test lib-functions

# Run in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage
```

## Test Results

```
✅ Test Files  3 passed (3)
✅ Tests       59 passed (59)
⏱️  Duration   ~13-15 seconds
```

## Adding New Tests

### When to add to `validation-library.test.ts`:
- Testing `validateSchema()` or `validateSessionLogic()`
- Testing new validation rules
- Testing edge cases in validation logic
- No need to spawn processes

### When to add to `validate-config-cli.test.ts`:
- Testing CLI behavior (exit codes, output formatting)
- Testing user experience (error messages, default paths)
- Testing end-to-end workflows
- Requires running the actual script

### When to add to `lib-functions.test.ts`:
- Testing config loading, context building, or other utilities
- Testing performance of library functions
- No CLI interaction needed

## Coverage

All tests use the **AAA pattern** (Arrange, Act, Assert) for clarity and maintainability.

The test suite provides comprehensive coverage of:
- ✅ Valid configurations (single-session, multi-session)
- ✅ Invalid configurations (missing fields, wrong types, bad patterns)
- ✅ Session logic validation
- ✅ CLI exit codes and output formatting
- ✅ Error handling (missing files, invalid YAML)
- ✅ Default behavior
- ✅ Production config validation

---

**Last Updated:** 2026-01-03
**Total Tests:** 59
**Pass Rate:** 100%
