#!/usr/bin/env node

/**
 * Infrastructure Test Suite for Shared Types Package (Sections 1-3)
 *
 * Tests the foundational setup of the AuthOptics monorepo and shared types package.
 * This validates Sections 1-3 of the implementation plan:
 * - Section 1: Project Initialization (monorepo workspace)
 * - Section 2: Directory Structure Setup (all type category directories)
 * - Section 3: TypeScript Configuration (package.json, tsconfig.json, dependencies)
 *
 * Usage: node infrastructure.test.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let warnings = 0;
const testResults = {
  section1: [],
  section2: [],
  section3: []
};

/**
 * Log test result with color coding
 */
function logResult(testName, passed, details = '', isWarning = false) {
  totalTests++;

  if (isWarning) {
    warnings++;
    console.log(`${colors.yellow}⚠ WARN${colors.reset}  ${testName}`);
    if (details) console.log(`         ${details}`);
  } else if (passed) {
    passedTests++;
    console.log(`${colors.green}✓ PASS${colors.reset}  ${testName}`);
    if (details) console.log(`         ${details}`);
  } else {
    failedTests++;
    console.log(`${colors.red}✗ FAIL${colors.reset}  ${testName}`);
    if (details) console.log(`         ${colors.red}${details}${colors.reset}`);
  }

  return { testName, passed, details, isWarning };
}

/**
 * Test file existence
 */
function testFileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  return logResult(
    description,
    exists,
    exists ? `File found: ${filePath}` : `File missing: ${filePath}`
  );
}

/**
 * Test directory existence
 */
function testDirectoryExists(dirPath, description) {
  const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  return logResult(
    description,
    exists,
    exists ? `Directory found: ${dirPath}` : `Directory missing: ${dirPath}`
  );
}

/**
 * Test JSON file validity and schema
 */
function testJSONFile(filePath, description, schema = {}) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(content);

    // Check required fields if schema provided
    const missingFields = [];
    const wrongValues = [];

    Object.keys(schema).forEach(key => {
      const keyPath = key.split('.');
      let value = json;

      for (const part of keyPath) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part];
        } else {
          missingFields.push(key);
          return;
        }
      }

      // Check expected value if specified
      if (schema[key] !== undefined && value !== schema[key]) {
        wrongValues.push(`${key}: expected "${schema[key]}", got "${value}"`);
      }
    });

    if (missingFields.length > 0) {
      return logResult(description, false, `Missing fields: ${missingFields.join(', ')}`);
    }

    if (wrongValues.length > 0) {
      return logResult(description, false, wrongValues.join('; '));
    }

    return logResult(description, true, 'Valid JSON with correct schema');
  } catch (error) {
    return logResult(description, false, `Error: ${error.message}`);
  }
}

/**
 * Execute a shell command and return success/failure
 */
function testCommand(command, description, shouldSucceed = true) {
  try {
    execSync(command, { stdio: 'pipe', encoding: 'utf-8' });
    return logResult(description, shouldSucceed, `Command: ${command}`);
  } catch (error) {
    return logResult(description, !shouldSucceed, `Command failed: ${command}\n${error.message}`);
  }
}

/**
 * Test TypeScript configuration
 */
function testTSConfig(filePath, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const config = JSON.parse(content);
    const compilerOptions = config.compilerOptions || {};

    // Check strict mode settings
    const strictChecks = {
      'strict': true,
      'noImplicitAny': true,
      'strictNullChecks': true,
      'strictFunctionTypes': true,
      'strictBindCallApply': true,
      'strictPropertyInitialization': true,
      'noImplicitThis': true,
      'alwaysStrict': true
    };

    const failedChecks = [];
    Object.keys(strictChecks).forEach(key => {
      if (compilerOptions[key] !== strictChecks[key]) {
        failedChecks.push(`${key}: expected ${strictChecks[key]}, got ${compilerOptions[key]}`);
      }
    });

    // Check output directories
    if (compilerOptions.outDir !== './dist') {
      failedChecks.push(`outDir: expected "./dist", got "${compilerOptions.outDir}"`);
    }

    if (compilerOptions.rootDir !== './src') {
      failedChecks.push(`rootDir: expected "./src", got "${compilerOptions.rootDir}"`);
    }

    if (failedChecks.length > 0) {
      return logResult(description, false, failedChecks.join('; '));
    }

    return logResult(description, true, 'All strict mode settings and paths correct');
  } catch (error) {
    return logResult(description, false, `Error: ${error.message}`);
  }
}

/**
 * Main test execution
 */
function runTests() {
  console.log(`\n${colors.bold}${colors.blue}=== AuthOptics Shared Types Infrastructure Test Suite ===${colors.reset}\n`);
  console.log(`Testing implementation of Sections 1-3`);
  console.log(`GitHub PR: #7`);
  console.log(`Branch: feature/shared-types-init\n`);

  const rootDir = path.resolve(__dirname, '../../../');
  const sharedDir = path.resolve(__dirname, '../');

  // SECTION 1: PROJECT INITIALIZATION
  console.log(`\n${colors.bold}SECTION 1: Project Initialization${colors.reset}\n`);

  testResults.section1.push(
    testFileExists(
      path.join(rootDir, 'package.json'),
      'Root package.json exists'
    )
  );

  testResults.section1.push(
    testJSONFile(
      path.join(rootDir, 'package.json'),
      'Root package.json has correct name and private flag',
      {
        'name': 'auth-optics',
        'private': true
      }
    )
  );

  testResults.section1.push(
    testJSONFile(
      path.join(rootDir, 'package.json'),
      'Root package.json has required scripts',
      {
        'scripts.dev': 'pnpm -r --parallel dev',
        'scripts.build': 'pnpm -r build',
        'scripts.build:shared': 'pnpm --filter @auth-optics/shared build'
      }
    )
  );

  testResults.section1.push(
    testFileExists(
      path.join(rootDir, 'pnpm-workspace.yaml'),
      'pnpm-workspace.yaml exists'
    )
  );

  testResults.section1.push(
    testDirectoryExists(
      path.join(rootDir, 'packages'),
      'packages/ directory exists'
    )
  );

  testResults.section1.push(
    testDirectoryExists(
      path.join(rootDir, 'node_modules'),
      'Root node_modules exists'
    )
  );

  testResults.section1.push(
    testFileExists(
      path.join(rootDir, 'pnpm-lock.yaml'),
      'pnpm-lock.yaml exists'
    )
  );

  // Check TypeScript installation
  testResults.section1.push(
    testCommand(
      'npx tsc --version',
      'TypeScript is installed and accessible',
      true
    )
  );

  // SECTION 2: DIRECTORY STRUCTURE
  console.log(`\n${colors.bold}SECTION 2: Directory Structure${colors.reset}\n`);

  testResults.section2.push(
    testDirectoryExists(
      path.join(rootDir, 'packages/shared'),
      'packages/shared directory exists'
    )
  );

  testResults.section2.push(
    testDirectoryExists(
      path.join(sharedDir, 'src'),
      'packages/shared/src directory exists'
    )
  );

  // Test all 11 type category directories
  const typeCategories = [
    'flows',
    'tokens',
    'http',
    'security',
    'vulnerability',
    'config',
    'discovery',
    'validation',
    'ui',
    'events',
    'utils'
  ];

  typeCategories.forEach(category => {
    testResults.section2.push(
      testDirectoryExists(
        path.join(sharedDir, 'src', category),
        `src/${category} directory exists`
      )
    );
  });

  // Count directories to ensure no extras
  const srcDirs = fs.readdirSync(path.join(sharedDir, 'src'))
    .filter(item => fs.statSync(path.join(sharedDir, 'src', item)).isDirectory());

  if (srcDirs.length === typeCategories.length) {
    testResults.section2.push(
      logResult(
        'Correct number of type category directories',
        true,
        `Found ${srcDirs.length} directories (expected ${typeCategories.length})`
      )
    );
  } else {
    const extra = srcDirs.filter(d => !typeCategories.includes(d));
    testResults.section2.push(
      logResult(
        'Correct number of type category directories',
        false,
        `Found ${srcDirs.length} directories (expected ${typeCategories.length}). Extra: ${extra.join(', ')}`
      )
    );
  }

  // SECTION 3: TYPESCRIPT CONFIGURATION
  console.log(`\n${colors.bold}SECTION 3: TypeScript Configuration${colors.reset}\n`);

  testResults.section3.push(
    testFileExists(
      path.join(sharedDir, 'package.json'),
      'Shared package.json exists'
    )
  );

  testResults.section3.push(
    testJSONFile(
      path.join(sharedDir, 'package.json'),
      'Shared package.json has correct name',
      {
        'name': '@auth-optics/shared'
      }
    )
  );

  testResults.section3.push(
    testJSONFile(
      path.join(sharedDir, 'package.json'),
      'Shared package.json has correct main and types',
      {
        'main': 'dist/index.js',
        'types': 'dist/index.d.ts'
      }
    )
  );

  testResults.section3.push(
    testJSONFile(
      path.join(sharedDir, 'package.json'),
      'Shared package.json has required scripts',
      {
        'scripts.build': 'tsc',
        'scripts.type-check': 'tsc --noEmit',
        'scripts.clean': 'rm -rf dist',
        'scripts.watch': 'tsc --watch'
      }
    )
  );

  testResults.section3.push(
    testFileExists(
      path.join(sharedDir, 'tsconfig.json'),
      'Shared tsconfig.json exists'
    )
  );

  testResults.section3.push(
    testTSConfig(
      path.join(sharedDir, 'tsconfig.json'),
      'TypeScript strict mode is properly configured'
    )
  );

  testResults.section3.push(
    testDirectoryExists(
      path.join(sharedDir, 'node_modules'),
      'Shared package node_modules exists'
    )
  );

  // Check workspace linking
  testResults.section3.push(
    testCommand(
      `cd ${sharedDir} && pnpm list typescript`,
      'TypeScript is available in shared package workspace',
      true
    )
  );

  // SUMMARY
  console.log(`\n${colors.bold}${colors.blue}=== Test Summary ===${colors.reset}\n`);
  console.log(`Total Tests:   ${totalTests}`);
  console.log(`${colors.green}Passed:        ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed:        ${failedTests}${colors.reset}`);
  console.log(`${colors.yellow}Warnings:      ${warnings}${colors.reset}`);

  const successRate = Math.round((passedTests / totalTests) * 100);
  console.log(`Success Rate:  ${successRate}%`);

  if (failedTests === 0) {
    console.log(`\n${colors.green}${colors.bold}✓ ALL TESTS PASSED${colors.reset}\n`);
    console.log('Sections 1-3 implementation is complete and correct.');
    console.log('Ready to proceed with type definitions (Sections 4+).');
  } else {
    console.log(`\n${colors.red}${colors.bold}✗ TESTS FAILED${colors.reset}\n`);
    console.log(`${failedTests} test(s) failed. Review the output above for details.`);
  }

  // Exit with appropriate code
  process.exit(failedTests === 0 ? 0 : 1);
}

// Run the tests
runTests();
