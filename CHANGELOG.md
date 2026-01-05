# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- TypeScript implementation of agent prompt generation system
- Automated template-based prompt generation using Handlebars
- Configuration validation using JSON Schema (Ajv)
- Comprehensive test suite (59 tests, 100% pass rate)
- Multi-session agent prompt support
- Session variable calculation and context building

### Changed
- **BREAKING**: Agent prompt generation migrated from Bash / sed to TypeScript
- **BREAKING**: Generation command changed from `scripts/generate-agent-prompts.sh` to `pnpm generate`
- All dependencies now managed by pnpm (single package manager)

### Removed
- **BREAKING**: Bash script removed (`generate-agent-prompts.sh`)

### Technical Details

**Implementation:**
- Template engine: Handlebars 4.7.8
- Validation: Ajv 8.12.0 (JSON Schema)
- YAML parsing: yaml 2.3.4
- Testing: Vitest 1.0.0
- TypeScript: 5.3.0

**Test Coverage:**
- 59 tests across 3 test files
- 100% pass rate
- Average validation time: <100ms
- Average context build time: <5ms

**Files Changed:**
- Added: `scripts/src/` directory with TypeScript implementation
- Added: Comprehensive test suite in `scripts/__tests__/`
- Removed: Bash script
- Modified: Template files converted from sed placeholders to Handlebars

---

## [0.1.0] - 2025-12-23

### Added
- Initial project setup
- Shared types package foundation (Day 1 types)
- OAuth2/OIDC reference documentation library
- Project architecture and specifications

---

**Legend:**
- **BREAKING**: Breaking change requiring action
- ✅: Backward compatible
- ❌: Not backward compatible
