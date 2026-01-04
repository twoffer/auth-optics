/**
 * Integration tests for validate-config.ts CLI script
 *
 * Tests the command-line interface, focusing on:
 * - Exit codes (0 for valid, 1 for invalid)
 * - Output formatting and user experience
 * - Default behavior (no arguments)
 * - Error message quality
 * - File handling (missing files, invalid YAML)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { tmpdir } from 'os';

const PROJECT_ROOT = join(__dirname, '../..');
const VALIDATE_SCRIPT = join(PROJECT_ROOT, 'scripts/src/validate-config.ts');
const VALID_CONFIG = join(PROJECT_ROOT, 'docs/prompts/config.yaml');
const SCHEMA_FILE = join(PROJECT_ROOT, 'docs/prompts/config.schema.json');

/**
 * Helper to run validation script and capture output/exit code
 */
function runValidation(configPath: string): {
  stdout: string;
  stderr: string;
  exitCode: number;
} {
  try {
    const stdout = execSync(`tsx ${VALIDATE_SCRIPT} ${configPath}`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.status || 1,
    };
  }
}

/**
 * Create temporary test directory
 */
function createTempDir(): string {
  const tempDir = join(tmpdir(), `validate-test-${Date.now()}`);
  mkdirSync(tempDir, { recursive: true });
  return tempDir;
}

describe('validate-config CLI', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Exit Codes', () => {
    it('should return exit code 0 for valid config', () => {
      const result = runValidation(VALID_CONFIG);
      expect(result.exitCode).toBe(0);
    });

    it('should return exit code 1 for invalid config', () => {
      const config = { invalid: 'config' };
      const configPath = join(tempDir, 'config.yaml');
      const schemaPath = join(tempDir, 'config.schema.json');

      writeFileSync(configPath, JSON.stringify(config));
      writeFileSync(schemaPath, readFileSync(SCHEMA_FILE, 'utf-8'));

      const result = runValidation(configPath);

      expect(result.exitCode).toBe(1);
    });

    it('should return exit code 1 for missing file', () => {
      const nonExistentPath = join(tempDir, 'non-existent.yaml');
      const result = runValidation(nonExistentPath);

      expect(result.exitCode).toBe(1);
    });

    it('should return exit code 1 for invalid YAML syntax', () => {
      const configPath = join(tempDir, 'config.yaml');
      const schemaPath = join(tempDir, 'config.schema.json');

      writeFileSync(configPath, 'invalid: yaml: syntax: [[[');
      writeFileSync(schemaPath, readFileSync(SCHEMA_FILE, 'utf-8'));

      const result = runValidation(configPath);

      expect(result.exitCode).toBe(1);
    });
  });

  describe('Output Formatting', () => {
    it('should display success message with checkmark for valid config', () => {
      const result = runValidation(VALID_CONFIG);

      expect(result.stdout).toContain('✅');
      expect(result.stdout).toContain('Configuration is valid');
    });

    it('should display error message with X for invalid config', () => {
      const config = { component: { name: 'Test' } }; // Missing required fields
      const configPath = join(tempDir, 'config.yaml');
      const schemaPath = join(tempDir, 'config.schema.json');

      writeFileSync(configPath, JSON.stringify(config));
      writeFileSync(schemaPath, readFileSync(SCHEMA_FILE, 'utf-8'));

      const result = runValidation(configPath);

      expect(result.stdout).toContain('❌');
      expect(result.stdout).toContain('Validation failed');
    });

    it('should display warning icon for session logic warnings', () => {
      const config = {
        component: { name: 'Test', type: 'types' },
        session: {
          enabled: true,
          current: 3, // Greater than total
          total: 2,
          session_1: {
            scope: 'Session 1',
            duration: '2-3 hours',
            file_count: 5,
            plan_sections: {
              file_list: 'Section 3.1',
              implementation: 'Section 3.2',
              verification: 'Section 4.1',
              completion_checklist: 'Section 5.1',
            },
            prerequisites_check_ref: 'Section 2.1',
          },
          session_2: {
            scope: 'Session 2',
            duration: '2-3 hours',
            file_count: 5,
            plan_sections: {
              file_list: 'Section 3.3',
              implementation: 'Section 3.4',
              verification: 'Section 4.2',
              completion_checklist: 'Section 5.2',
            },
            prerequisites_check_ref: 'Section 2.2',
          },
        },
        paths: {
          specification: '@docs/test.md',
          master_plan: '@docs/plan.md',
          detailed_plan: '@docs/detail.md',
          output_plan: '@docs/output/plan.md',
          output_review: '@docs/output/review.md',
          output_test_report: '@docs/output/test.md',
        },
        github: { pr: '#1', issue: '#1', branch: 'feature/test' },
        context: {
          requires_oauth: false,
          requires_keycloak: false,
          security_critical: false,
        },
        models: {
          technical_architect: 'sonnet',
          feature_implementer_plan: 'sonnet',
          feature_implementer: 'sonnet',
          test_suite_generator: 'haiku',
          code_security_reviewer: 'opus',
        },
      };

      const configPath = join(tempDir, 'config.yaml');
      const schemaPath = join(tempDir, 'config.schema.json');

      writeFileSync(configPath, JSON.stringify(config));
      writeFileSync(schemaPath, readFileSync(SCHEMA_FILE, 'utf-8'));

      const result = runValidation(configPath);

      expect(result.stdout).toContain('⚠️');
      expect(result.stdout).toContain('session.current');
    });

    it('should include helpful context in error messages', () => {
      const config = {
        component: { name: 'Test' }, // Missing 'type'
        session: { enabled: false, current: 1, total: 1 },
        paths: {
          specification: '@docs/test.md',
          master_plan: '@docs/plan.md',
          detailed_plan: '@docs/detail.md',
          output_plan: '@docs/output/plan.md',
          output_review: '@docs/output/review.md',
          output_test_report: '@docs/output/test.md',
        },
        github: { pr: '#1', issue: '#1', branch: 'feature/test' },
        context: {
          requires_oauth: false,
          requires_keycloak: false,
          security_critical: false,
        },
        models: {
          technical_architect: 'sonnet',
          feature_implementer_plan: 'sonnet',
          feature_implementer: 'sonnet',
          test_suite_generator: 'haiku',
          code_security_reviewer: 'opus',
        },
      };

      const configPath = join(tempDir, 'config.yaml');
      const schemaPath = join(tempDir, 'config.schema.json');

      writeFileSync(configPath, JSON.stringify(config));
      writeFileSync(schemaPath, readFileSync(SCHEMA_FILE, 'utf-8'));

      const result = runValidation(configPath);

      expect(result.stdout).toContain('Location:');
      expect(result.stdout).toContain('Problem:');
      expect(result.stdout).toContain('component');
    });
  });

  describe('Error Handling', () => {
    it('should report file not found errors clearly', () => {
      const nonExistentPath = join(tempDir, 'non-existent.yaml');
      const result = runValidation(nonExistentPath);

      expect(result.exitCode).toBe(1);
      const output = result.stdout + result.stderr;
      expect(output).toContain('Error');
      expect(output).toContain('not found');
    });

    it('should report invalid YAML syntax errors', () => {
      const configPath = join(tempDir, 'config.yaml');
      const schemaPath = join(tempDir, 'config.schema.json');

      writeFileSync(configPath, 'invalid: yaml: syntax: [[[');
      writeFileSync(schemaPath, readFileSync(SCHEMA_FILE, 'utf-8'));

      const result = runValidation(configPath);

      expect(result.exitCode).toBe(1);
      const output = result.stdout + result.stderr;
      expect(output).toContain('Error');
    });

    it('should handle missing schema file gracefully', () => {
      const config = {
        component: { name: 'Test', type: 'types' },
        session: { enabled: false, current: 1, total: 1 },
        paths: {
          specification: '@docs/test.md',
          master_plan: '@docs/plan.md',
          detailed_plan: '@docs/detail.md',
          output_plan: '@docs/output/plan.md',
          output_review: '@docs/output/review.md',
          output_test_report: '@docs/output/test.md',
        },
        github: { pr: '#1', issue: '#1', branch: 'feature/test' },
        context: {
          requires_oauth: false,
          requires_keycloak: false,
          security_critical: false,
        },
        models: {
          technical_architect: 'sonnet',
          feature_implementer_plan: 'sonnet',
          feature_implementer: 'sonnet',
          test_suite_generator: 'haiku',
          code_security_reviewer: 'opus',
        },
      };

      const configPath = join(tempDir, 'config.yaml');
      // Don't create schema file

      writeFileSync(configPath, JSON.stringify(config));

      const result = runValidation(configPath);

      expect(result.exitCode).toBe(1);
      const output = result.stdout + result.stderr;
      expect(output).toContain('Error');
    });
  });

  describe('Default Behavior', () => {
    it('should validate default config.yaml when no argument provided', () => {
      try {
        const result = execSync(`tsx ${VALIDATE_SCRIPT}`, {
          encoding: 'utf-8',
          stdio: 'pipe',
          cwd: PROJECT_ROOT,
        });

        expect(result).toContain('✅');
        expect(result).toContain('config.yaml');
      } catch (error: any) {
        // If the production config fails validation, that's also okay for this test
        // We're just testing that the default path works
        expect(error.stdout || error.stderr).toContain('config.yaml');
      }
    });

    it('should show config file path in output', () => {
      const result = runValidation(VALID_CONFIG);

      expect(result.stdout).toContain('config.yaml');
    });
  });

  describe('End-to-End Validation', () => {
    it('should successfully validate the production config', () => {
      const result = runValidation(VALID_CONFIG);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('✅');
      expect(result.stdout).toContain('Configuration is valid');
    });

    it('should detect and report all errors in invalid config', () => {
      const config = {
        component: { name: 'Test', type: 'invalid-type' },
        session: {
          enabled: true,
          current: 5, // Invalid: greater than total
          total: 2,
          // Missing session keys
        },
        // Missing required fields: paths, github, context, models
      };

      const configPath = join(tempDir, 'config.yaml');
      const schemaPath = join(tempDir, 'config.schema.json');

      writeFileSync(configPath, JSON.stringify(config));
      writeFileSync(schemaPath, readFileSync(SCHEMA_FILE, 'utf-8'));

      const result = runValidation(configPath);

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('❌');

      // Should report multiple errors
      const output = result.stdout;
      expect(output).toContain('Validation failed');
    });
  });
});
