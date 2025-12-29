# Implementation Plan: Shared Types Package Sections 1-3

**Document Version:** 1.0
**Created:** 2025-12-26
**Target:** Sections 1-3 of plan-shared-types-package-2025-12-24.md
**Scope:** Project Initialization, Directory Structure Setup, TypeScript Configuration

---

## Overview

This plan provides detailed, step-by-step instructions for implementing Sections 1-3 of the shared types package implementation plan. These sections establish the foundational infrastructure for the entire AuthOptics monorepo.

**What we're implementing:**
- Section 1: Project Initialization (monorepo workspace setup)
- Section 2: Directory Structure Setup (all type category directories)
- Section 3: TypeScript Configuration (package.json, tsconfig.json, dependencies)

**What we're NOT implementing yet:**
- Any actual type definitions (Sections 4+)
- Build configuration beyond basic tsconfig
- Testing infrastructure

---

## Prerequisites Verification

Before starting, verify these requirements are met:

### ✓ Checklist

```bash
# 1. Check Node.js version (requires 20.x LTS)
node --version
# Expected output: v20.x.x

# 2. Check pnpm installation
pnpm --version
# Expected output: 8.x.x or higher

# 3. Verify current directory
pwd
# Expected output: /home/toffer/auth-optics-workspace/auth-optics

# 4. Verify git repository
git status
# Should not error (this is a git repository)

# 5. Verify packages/ directory does not exist yet (clean slate)
ls -la packages/ 2>&1
# Expected: "No such file or directory" OR empty directory
```

**If any prerequisite fails, STOP and resolve before proceeding.**

---

## Section 1: Project Initialization

**Goal:** Create monorepo infrastructure with pnpm workspace configuration
**Duration:** 10-15 minutes
**Files Created:** 2 (pnpm-workspace.yaml, root package.json)

### Step 1.1: Navigate to Project Root

```bash
cd /home/toffer/auth-optics-workspace/auth-optics
```

**Verify:**
```bash
pwd
# Should output: /home/toffer/auth-optics-workspace/auth-optics
```

---

### Step 1.2: Create pnpm Workspace Configuration

**File:** `/home/toffer/auth-optics-workspace/auth-optics/pnpm-workspace.yaml`

**Content:**
```yaml
packages:
  - 'packages/*'
```

**Verification:**
```bash
# Check file was created
test -f pnpm-workspace.yaml && echo "✓ pnpm-workspace.yaml exists" || echo "✗ File missing"

# Check content
cat pnpm-workspace.yaml
# Should show exactly:
# packages:
#   - 'packages/*'
```

---

### Step 1.3: Create Root package.json

**File:** `/home/toffer/auth-optics-workspace/auth-optics/package.json`

**Content:**
```json
{
  "name": "auth-optics",
  "version": "1.0.0",
  "private": true,
  "description": "OAuth2/OIDC debugging and educational tool",
  "scripts": {
    "dev": "pnpm -r --parallel dev",
    "build": "pnpm -r build",
    "build:shared": "pnpm --filter @auth-optics/shared build",
    "type-check": "pnpm -r type-check",
    "clean": "pnpm -r clean",
    "lint": "pnpm -r lint",
    "test": "pnpm -r test"
  },
  "keywords": ["oauth2", "oidc", "security", "debugging"],
  "author": "",
  "license": "MIT",
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

**Verification:**
```bash
# Check file was created
test -f package.json && echo "✓ package.json exists" || echo "✗ File missing"

# Validate JSON syntax
node -e "const pkg = require('./package.json'); console.log('✓ Valid JSON');"

# Check key properties
node -e "const pkg = require('./package.json'); console.log('Name:', pkg.name); console.log('Private:', pkg.private); console.log('Scripts:', Object.keys(pkg.scripts).length);"
# Should output:
# Name: auth-optics
# Private: true
# Scripts: 7
```

---

### Step 1.4: Create packages/ Directory

```bash
mkdir -p packages
```

**Verification:**
```bash
# Check directory exists
test -d packages && echo "✓ packages/ directory exists" || echo "✗ Directory missing"

# Check directory is empty (or has no unexpected content)
ls -la packages/
# Should show only . and .. (empty directory)
```

---

### Step 1.5: Install Root Dependencies

```bash
pnpm install
```

**Expected Output:**
```
Lockfile is up to date, resolution step is skipped
Packages: +1
+
+ typescript 5.3.x

Done in Xs
```

**Verification:**
```bash
# Check node_modules was created
test -d node_modules && echo "✓ node_modules exists" || echo "✗ Missing"

# Check TypeScript was installed
test -f node_modules/.bin/tsc && echo "✓ TypeScript installed" || echo "✗ TypeScript missing"

# Check pnpm-lock.yaml was created
test -f pnpm-lock.yaml && echo "✓ Lock file exists" || echo "✗ Lock file missing"

# Verify TypeScript version
npx tsc --version
# Should output: Version 5.3.x
```

---

## Section 2: Directory Structure Setup

**Goal:** Create complete directory structure for all type categories
**Duration:** 5-10 minutes
**Directories Created:** 13 (1 package root + 12 type categories)

### Step 2.1: Create Shared Package Root Directory

```bash
mkdir -p packages/shared
```

**Verification:**
```bash
# Check directory exists
test -d packages/shared && echo "✓ packages/shared exists" || echo "✗ Missing"
```

---

### Step 2.2: Create All Type Category Directories

Execute this single command block to create all directories at once:

```bash
# Create all src/ subdirectories for type categories
mkdir -p packages/shared/src/flows
mkdir -p packages/shared/src/tokens
mkdir -p packages/shared/src/http
mkdir -p packages/shared/src/security
mkdir -p packages/shared/src/vulnerability
mkdir -p packages/shared/src/config
mkdir -p packages/shared/src/discovery
mkdir -p packages/shared/src/validation
mkdir -p packages/shared/src/ui
mkdir -p packages/shared/src/events
mkdir -p packages/shared/src/utils
```

**Verification:**
```bash
# Verify all directories were created
for dir in flows tokens http security vulnerability config discovery validation ui events utils; do
  test -d "packages/shared/src/$dir" && echo "✓ src/$dir exists" || echo "✗ src/$dir missing"
done

# Expected output:
# ✓ src/flows exists
# ✓ src/tokens exists
# ✓ src/http exists
# ✓ src/security exists
# ✓ src/vulnerability exists
# ✓ src/config exists
# ✓ src/discovery exists
# ✓ src/validation exists
# ✓ src/ui exists
# ✓ src/events exists
# ✓ src/utils exists
```

---

### Step 2.3: Verify Complete Directory Structure

Use tree command to visualize structure:

```bash
tree -L 3 packages/shared
```

**Expected Output:**
```
packages/shared/
└── src/
    ├── flows/
    ├── tokens/
    ├── http/
    ├── security/
    ├── vulnerability/
    ├── config/
    ├── discovery/
    ├── validation/
    ├── ui/
    ├── events/
    └── utils/

12 directories, 0 files
```

**Alternative verification (if tree not available):**
```bash
# Count directories (should be 12: 11 type categories + src/)
find packages/shared/src -type d | wc -l
# Should output: 12
```

---

## Section 3: TypeScript Configuration

**Goal:** Configure TypeScript strict mode and package metadata
**Duration:** 10-15 minutes
**Files Created:** 2 (package.json, tsconfig.json)

### Step 3.1: Create Shared Package package.json

**File:** `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/package.json`

**Content:**
```json
{
  "name": "@auth-optics/shared",
  "version": "1.0.0",
  "description": "Shared TypeScript types for AuthOptics",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist",
    "watch": "tsc --watch"
  },
  "keywords": [
    "oauth2",
    "oidc",
    "types",
    "typescript"
  ],
  "author": "",
  "license": "MIT",
  "devDependencies": {
    "typescript": "^5.3.0"
  },
  "files": [
    "dist/**/*",
    "src/**/*"
  ]
}
```

**Verification:**
```bash
cd packages/shared

# Check file exists
test -f package.json && echo "✓ package.json exists" || echo "✗ File missing"

# Validate JSON syntax
node -e "const pkg = require('./package.json'); console.log('✓ Valid JSON');"

# Check key properties
node -e "const pkg = require('./package.json'); console.log('Name:', pkg.name); console.log('Main:', pkg.main); console.log('Types:', pkg.types);"
# Should output:
# Name: @auth-optics/shared
# Main: dist/index.js
# Types: dist/index.d.ts

# Check scripts
node -e "const pkg = require('./package.json'); console.log('Scripts:', Object.keys(pkg.scripts).join(', '));"
# Should output: Scripts: build, type-check, clean, watch
```

---

### Step 3.2: Create TypeScript Configuration

**File:** `/home/toffer/auth-optics-workspace/auth-optics/packages/shared/tsconfig.json`

**Content:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

**Verification:**
```bash
# Check file exists
test -f tsconfig.json && echo "✓ tsconfig.json exists" || echo "✗ File missing"

# Validate JSON syntax
node -e "const cfg = require('./tsconfig.json'); console.log('✓ Valid JSON');"

# Check strict mode is enabled
node -e "const cfg = require('./tsconfig.json'); console.log('Strict mode:', cfg.compilerOptions.strict); console.log('NoImplicitAny:', cfg.compilerOptions.noImplicitAny);"
# Should output:
# Strict mode: true
# NoImplicitAny: true

# Check output directory
node -e "const cfg = require('./tsconfig.json'); console.log('OutDir:', cfg.compilerOptions.outDir); console.log('RootDir:', cfg.compilerOptions.rootDir);"
# Should output:
# OutDir: ./dist
# RootDir: ./src
```

---

### Step 3.3: Install Shared Package Dependencies

```bash
# From packages/shared directory
pnpm install
```

**Expected Output:**
```
Lockfile is up to date, resolution step is skipped
Packages: +1
+
+ typescript 5.3.x

Done in Xs
```

**Verification:**
```bash
# Check node_modules exists in shared package
test -d node_modules && echo "✓ node_modules exists" || echo "✗ Missing"

# Check TypeScript is available
test -f node_modules/.bin/tsc && echo "✓ TypeScript binary exists" || echo "✗ Missing"

# Verify TypeScript can run
npx tsc --version
# Should output: Version 5.3.x

# Check pnpm linked to workspace
pnpm list typescript
# Should show TypeScript version linked from workspace
```

---

### Step 3.4: Navigate Back to Project Root

```bash
cd /home/toffer/auth-optics-workspace/auth-optics
```

**Verification:**
```bash
pwd
# Should output: /home/toffer/auth-optics-workspace/auth-optics
```

---

## Final Verification

Run this comprehensive verification to ensure all sections are complete:

```bash
#!/bin/bash

echo "=== Section 1: Project Initialization ==="

# Check root package.json
test -f package.json && echo "✓ Root package.json exists" || echo "✗ Missing"

# Check pnpm-workspace.yaml
test -f pnpm-workspace.yaml && echo "✓ pnpm-workspace.yaml exists" || echo "✗ Missing"

# Check packages directory
test -d packages && echo "✓ packages/ directory exists" || echo "✗ Missing"

# Check root node_modules
test -d node_modules && echo "✓ Root node_modules exists" || echo "✗ Missing"

# Check TypeScript installed
test -f node_modules/.bin/tsc && echo "✓ TypeScript installed globally" || echo "✗ Missing"

echo ""
echo "=== Section 2: Directory Structure ==="

# Check shared package directory
test -d packages/shared && echo "✓ packages/shared exists" || echo "✗ Missing"

# Check all type category directories
for dir in flows tokens http security vulnerability config discovery validation ui events utils; do
  test -d "packages/shared/src/$dir" && echo "✓ src/$dir exists" || echo "✗ Missing"
done

echo ""
echo "=== Section 3: TypeScript Configuration ==="

# Check shared package.json
test -f packages/shared/package.json && echo "✓ Shared package.json exists" || echo "✗ Missing"

# Check shared tsconfig.json
test -f packages/shared/tsconfig.json && echo "✓ Shared tsconfig.json exists" || echo "✗ Missing"

# Check shared node_modules
test -d packages/shared/node_modules && echo "✓ Shared node_modules exists" || echo "✗ Missing"

# Validate package names
ROOT_NAME=$(node -e "console.log(require('./package.json').name)" 2>/dev/null)
SHARED_NAME=$(node -e "console.log(require('./packages/shared/package.json').name)" 2>/dev/null)

echo ""
echo "=== Configuration Validation ==="
echo "Root package name: $ROOT_NAME (expected: auth-optics)"
echo "Shared package name: $SHARED_NAME (expected: @auth-optics/shared)"

# Check TypeScript strict mode
STRICT_MODE=$(node -e "console.log(require('./packages/shared/tsconfig.json').compilerOptions.strict)" 2>/dev/null)
echo "TypeScript strict mode: $STRICT_MODE (expected: true)"

echo ""
echo "=== Summary ==="
echo "If all checks show ✓, Sections 1-3 are complete."
echo "Ready to proceed with type implementation (Sections 4+)."
```

**Expected Output:**
```
=== Section 1: Project Initialization ===
✓ Root package.json exists
✓ pnpm-workspace.yaml exists
✓ packages/ directory exists
✓ Root node_modules exists
✓ TypeScript installed globally

=== Section 2: Directory Structure ===
✓ packages/shared exists
✓ src/flows exists
✓ src/tokens exists
✓ src/http exists
✓ src/security exists
✓ src/vulnerability exists
✓ src/config exists
✓ src/discovery exists
✓ src/validation exists
✓ src/ui exists
✓ src/events exists
✓ src/utils exists

=== Section 3: TypeScript Configuration ===
✓ Shared package.json exists
✓ Shared tsconfig.json exists
✓ Shared node_modules exists

=== Configuration Validation ===
Root package name: auth-optics (expected: auth-optics)
Shared package name: @auth-optics/shared (expected: @auth-optics/shared)
TypeScript strict mode: true (expected: true)

=== Summary ===
If all checks show ✓, Sections 1-3 are complete.
Ready to proceed with type implementation (Sections 4+).
```

---

## Troubleshooting

### Issue 1: "pnpm: command not found"

**Solution:**
```bash
npm install -g pnpm@8
```

### Issue 2: "node: command not found" or wrong version

**Solution:**
```bash
# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js 20.x LTS
nvm install 20
nvm use 20
```

### Issue 3: "Permission denied" when creating directories

**Solution:**
```bash
# Check current user owns the directory
ls -la /home/toffer/auth-optics-workspace/

# If ownership is wrong, fix it:
sudo chown -R $USER:$USER /home/toffer/auth-optics-workspace/auth-optics
```

### Issue 4: JSON syntax error in package.json

**Solution:**
```bash
# Use a JSON validator
cat package.json | python3 -m json.tool

# If error, re-create file from template above
```

### Issue 5: TypeScript not found after pnpm install

**Solution:**
```bash
# Clear pnpm cache
pnpm store prune

# Re-install
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## Next Steps

After completing Sections 1-3, you are ready to implement Sections 4+:

**Section 4: Implementation Roadmap**
- Review type category priorities
- Understand implementation dependencies
- Plan 3-day implementation schedule

**Section 5: Type Category Implementation**
- Start with Utility Types (foundation)
- Implement Flow Types (critical path)
- Continue with Token, HTTP, Security types

**Recommended Order:**
1. Section 5.5: Utility Types (30 min) - **START HERE**
2. Section 5.1: HTTP Types (1-2 hours)
3. Flow Types from specification (2-3 hours)
4. Token Types from specification (2-3 hours)
5. Continue with remaining categories

---

## File Manifest

After completing Sections 1-3, these files should exist:

```
/home/toffer/auth-optics-workspace/auth-optics/
├── package.json                           # Root package (auth-optics)
├── pnpm-workspace.yaml                    # Workspace configuration
├── pnpm-lock.yaml                         # Lock file (generated)
├── node_modules/                          # Dependencies (generated)
│   └── typescript/                        # TypeScript 5.3.x
└── packages/
    └── shared/
        ├── package.json                   # Shared package (@auth-optics/shared)
        ├── tsconfig.json                  # TypeScript strict config
        ├── node_modules/                  # Shared dependencies (linked from root)
        └── src/
            ├── flows/                     # (empty)
            ├── tokens/                    # (empty)
            ├── http/                      # (empty)
            ├── security/                  # (empty)
            ├── vulnerability/             # (empty)
            ├── config/                    # (empty)
            ├── discovery/                 # (empty)
            ├── validation/                # (empty)
            ├── ui/                        # (empty)
            ├── events/                    # (empty)
            └── utils/                     # (empty)
```

**Total:** 5 files created, 13 directories created

---

## Completion Checklist

Mark each item when complete:

### Section 1: Project Initialization
- [ ] pnpm-workspace.yaml created
- [ ] Root package.json created
- [ ] packages/ directory created
- [ ] Root dependencies installed (TypeScript)
- [ ] pnpm-lock.yaml generated

### Section 2: Directory Structure
- [ ] packages/shared/ created
- [ ] packages/shared/src/ created
- [ ] All 11 type category directories created
- [ ] Directory structure verified with tree or find

### Section 3: TypeScript Configuration
- [ ] packages/shared/package.json created
- [ ] packages/shared/tsconfig.json created
- [ ] Shared package dependencies installed
- [ ] TypeScript strict mode enabled
- [ ] Package names validated

### Final Verification
- [ ] All ✓ marks in verification script
- [ ] No error messages in any verification step
- [ ] Ready to implement type definitions (Sections 4+)

---

**End of Plan for Sections 1-3**

**Status:** Ready for implementation
**Estimated Time:** 30-45 minutes total
**Dependencies:** Node.js 20.x, pnpm 8.x
**Next:** Implement Sections 4+ (type definitions)
