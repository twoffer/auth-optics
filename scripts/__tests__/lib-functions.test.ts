/**
 * Unit tests for library functions
 *
 * Tests the core library functions used by both scripts:
 * - config-loader.ts: loadYaml, loadJsonSchema
 * - validator.ts: validateSchema, validateSessionLogic
 * - context-builder.ts: calculateSessionVariables, buildTemplateContext
 */

import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { loadYaml, loadJsonSchema } from '../src/lib/config-loader.js';
import { validateSchema, validateSessionLogic } from '../src/lib/validator.js';
import {
  calculateSessionVariables,
  buildTemplateContext,
} from '../src/lib/context-builder.js';
import type { Config } from '../src/types/config.js';

const PROJECT_ROOT = join(__dirname, '../..');
const SCHEMA_FILE = join(PROJECT_ROOT, 'docs/prompts/config.schema.json');

/**
 * Create temporary test directory
 */
function createTempDir(): string {
  const tempDir = join(tmpdir(), `lib-test-${Date.now()}`);
  mkdirSync(tempDir, { recursive: true });
  return tempDir;
}

/**
 * Create minimal valid config
 */
function createMinimalConfig(sessionEnabled: boolean = false): Config {
  const config: Config = {
    component: { name: 'Test Component', type: 'types' },
    session: { enabled: sessionEnabled, current: 1, total: 1 },
    paths: {
      specification: '@docs/specs/test.md',
      master_plan: '@docs/plans/master.md',
      detailed_plan: '@docs/plans/detail.md',
      output_plan: '@docs/output/plan.md',
      output_review: '@docs/output/review.md',
      output_test_report: '@docs/output/test.md',
    },
    github: {
      pr: '#1',
      issue: '#1',
      branch: 'feature/test',
    },
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

  if (sessionEnabled) {
    (config.session as any).session_1 = {
      scope: 'Foundation Types',
      duration: '2-3 hours',
      file_count: 5,
      plan_sections: {
        file_list: 'Section 3.1',
        implementation: 'Section 3.2',
        verification: 'Section 4.1',
        completion_checklist: 'Section 5.1',
      },
      prerequisites_check_ref: 'Section 2.1',
    };
  }

  return config;
}

describe('config-loader.ts', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('loadYaml', () => {
    it('should successfully load valid YAML file', () => {
      const config = createMinimalConfig();
      const configPath = join(tempDir, 'config.yaml');
      writeFileSync(configPath, JSON.stringify(config));

      const result = loadYaml(configPath);

      expect(result.success).toBe(true);
      expect(result.config).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should return error for non-existent file', () => {
      const nonExistentPath = join(tempDir, 'non-existent.yaml');

      const result = loadYaml(nonExistentPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.type).toBe('not_found');
      expect(result.error?.message).toContain('not found');
    });

    it('should return error for invalid YAML syntax', () => {
      const configPath = join(tempDir, 'config.yaml');
      writeFileSync(configPath, 'invalid: yaml: [[[');

      const result = loadYaml(configPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.type).toBe('invalid_yaml');
    });
  });

  describe('loadJsonSchema', () => {
    it('should successfully load valid JSON schema', () => {
      const schema = { type: 'object', properties: {} };
      const schemaPath = join(tempDir, 'schema.json');
      writeFileSync(schemaPath, JSON.stringify(schema));

      const result = loadJsonSchema(schemaPath);

      expect(result.success).toBe(true);
      expect(result.config).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should return error for non-existent schema file', () => {
      const nonExistentPath = join(tempDir, 'non-existent.json');

      const result = loadJsonSchema(nonExistentPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.type).toBe('not_found');
    });

    it('should return error for invalid JSON syntax', () => {
      const schemaPath = join(tempDir, 'schema.json');
      writeFileSync(schemaPath, '{ invalid json }');

      const result = loadJsonSchema(schemaPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.type).toBe('invalid_json');
    });
  });
});

describe('validator.ts', () => {
  describe('validateSchema', () => {
    it('should validate correct config against schema', () => {
      const config = createMinimalConfig();
      const schema = JSON.parse(
        require('fs').readFileSync(SCHEMA_FILE, 'utf-8')
      );

      const result = validateSchema(config, schema);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject config with invalid type', () => {
      const config: any = createMinimalConfig();
      config.component.type = 'invalid-type';
      const schema = JSON.parse(
        require('fs').readFileSync(SCHEMA_FILE, 'utf-8')
      );

      const result = validateSchema(config, schema);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject config with missing required fields', () => {
      const config: any = { component: { name: 'Test' } };
      const schema = JSON.parse(
        require('fs').readFileSync(SCHEMA_FILE, 'utf-8')
      );

      const result = validateSchema(config, schema);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should provide detailed error information', () => {
      const config: any = createMinimalConfig();
      delete config.paths;
      const schema = JSON.parse(
        require('fs').readFileSync(SCHEMA_FILE, 'utf-8')
      );

      const result = validateSchema(config, schema);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toHaveProperty('path');
      expect(result.errors[0]).toHaveProperty('message');
    });
  });

  describe('validateSessionLogic', () => {
    it('should return no warnings for valid single-session config', () => {
      const config = createMinimalConfig(false);

      const warnings = validateSessionLogic(config);

      expect(warnings).toHaveLength(0);
    });

    it('should return no warnings for valid multi-session config', () => {
      const config = createMinimalConfig(true);
      config.session.enabled = true;
      config.session.current = 1;
      config.session.total = 1;

      const warnings = validateSessionLogic(config);

      expect(warnings).toHaveLength(0);
    });

    it('should warn when current > total', () => {
      const config = createMinimalConfig(true);
      config.session.enabled = true;
      config.session.current = 3;
      config.session.total = 2;

      const warnings = validateSessionLogic(config);

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0]).toContain('session.current');
      expect(warnings[0]).toContain('session.total');
    });

    it('should warn when session_N keys are missing', () => {
      const config = createMinimalConfig(false);
      config.session.enabled = true;
      config.session.current = 1;
      config.session.total = 3;
      // Only session_1 exists (from createMinimalConfig), missing session_2 and session_3

      const warnings = validateSessionLogic(config);

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some((w) => w.includes('session_2'))).toBe(true);
      expect(warnings.some((w) => w.includes('session_3'))).toBe(true);
    });

    it('should return empty array for disabled sessions', () => {
      const config = createMinimalConfig(false);
      config.session.enabled = false;

      const warnings = validateSessionLogic(config);

      expect(warnings).toHaveLength(0);
    });
  });
});

describe('context-builder.ts', () => {
  describe('calculateSessionVariables', () => {
    it('should return single-session mode for disabled sessions', () => {
      const config = createMinimalConfig(false);

      const variables = calculateSessionVariables(config);

      expect(variables.session_mode).toBe(false);
      expect(variables.session_number).toBeUndefined();
      expect(variables.total_sessions).toBeUndefined();
    });

    it('should calculate session variables for first session', () => {
      const config = createMinimalConfig(true);
      config.session.enabled = true;
      config.session.current = 1;
      config.session.total = 3;

      const variables = calculateSessionVariables(config);

      expect(variables.session_mode).toBe(true);
      expect(variables.session_number).toBe(1);
      expect(variables.total_sessions).toBe(3);
      expect(variables.session_scope).toBe('Foundation Types');
      expect(variables.session_duration).toBe('2-3 hours');
      expect(variables.session_file_count).toBe(5);
    });

    it('should calculate session number > 1 flag correctly', () => {
      const config = createMinimalConfig(true);
      config.session.enabled = true;
      config.session.current = 2;
      config.session.total = 3;
      (config.session as any).session_2 = {
        scope: 'Session 2',
        duration: '3-4 hours',
        file_count: 8,
        plan_sections: {
          file_list: 'Section 3.3',
          implementation: 'Section 3.4',
          verification: 'Section 4.2',
          completion_checklist: 'Section 5.2',
        },
        prerequisites_check_ref: 'Section 2.2',
      };

      const variables = calculateSessionVariables(config);

      expect(variables.session_number_gt_1).toBe(true);
      expect(variables.previous_session).toBe(1);
    });

    it('should calculate final session flag correctly', () => {
      const config = createMinimalConfig(true);
      config.session.enabled = true;
      config.session.current = 3;
      config.session.total = 3;
      (config.session as any).session_3 = {
        scope: 'Final Session',
        duration: '2-3 hours',
        file_count: 4,
        plan_sections: {
          file_list: 'Section 3.5',
          implementation: 'Section 3.6',
          verification: 'Section 4.3',
          completion_checklist: 'Section 5.3',
        },
        prerequisites_check_ref: 'Section 2.3',
      };

      const variables = calculateSessionVariables(config);

      expect(variables.is_final_session).toBe(true);
      expect(variables.not_final_session).toBe(false);
      expect(variables.next_session).toBe(0);
    });

    it('should include section references', () => {
      const config = createMinimalConfig(true);

      const variables = calculateSessionVariables(config);

      expect(variables.session_implementation_section).toBe('Section 3.2');
      expect(variables.session_file_list_section).toBe('Section 3.1');
      expect(variables.session_verification_section).toBe('Section 4.1');
      expect(variables.session_completion_checklist_section).toBe('Section 5.1');
      expect(variables.session_prerequisites_section).toBe('Section 2.1');
    });
  });

  describe('buildTemplateContext', () => {
    it('should build complete context for single-session config', () => {
      const config = createMinimalConfig(false);

      const context = buildTemplateContext(config);

      expect(context.session_mode).toBe(false);
      expect(context.component_name).toBe('Test Component');
      expect(context.component_type).toBe('types');
      expect(context.specification).toBe('@docs/specs/test.md');
      expect(context.master_plan).toBe('@docs/plans/master.md');
      expect(context.github_pr).toBe('#1');
      expect(context.requires_oauth_context).toBe(false);
      expect(context.model_technical_architect).toBe('sonnet');
      expect(context.generation_timestamp).toBeDefined();
    });

    it('should build complete context for multi-session config', () => {
      const config = createMinimalConfig(true);

      const context = buildTemplateContext(config);

      expect(context.session_mode).toBe(true);
      expect(context.session_number).toBe(1);
      expect(context.total_sessions).toBe(1);
      expect(context.session_scope).toBe('Foundation Types');
      expect(context.component_name).toBe('Test Component');
    });

    it('should include all path references', () => {
      const config = createMinimalConfig(false);

      const context = buildTemplateContext(config);

      expect(context.specification).toBe('@docs/specs/test.md');
      expect(context.master_plan).toBe('@docs/plans/master.md');
      expect(context.detailed_plan).toBe('@docs/plans/detail.md');
      expect(context.output_plan).toBe('@docs/output/plan.md');
      expect(context.output_review).toBe('@docs/output/review.md');
      expect(context.output_report).toBe('@docs/output/test.md');
    });

    it('should include all model recommendations', () => {
      const config = createMinimalConfig(false);

      const context = buildTemplateContext(config);

      expect(context.model_technical_architect).toBe('sonnet');
      expect(context.model_feature_implementer_plan).toBe('sonnet');
      expect(context.model_feature_implementer).toBe('sonnet');
      expect(context.model_test_suite_generator).toBe('haiku');
      expect(context.model_code_security_reviewer).toBe('opus');
    });

    it('should include generation timestamp in correct format', () => {
      const config = createMinimalConfig(false);

      const context = buildTemplateContext(config);

      expect(context.generation_timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} UTC$/
      );
    });

    it('should handle optional plan_mode config', () => {
      const config = createMinimalConfig(false);
      config.plan_mode = {
        master_plan_sections: 'Section 1, Section 2',
      };

      const context = buildTemplateContext(config);

      expect(context.master_plan_sections).toBe('Section 1, Section 2');
    });

    it('should handle missing plan_mode config', () => {
      const config = createMinimalConfig(false);

      const context = buildTemplateContext(config);

      expect(context.master_plan_sections).toBe('');
    });
  });
});

describe('Performance', () => {
  it('should validate config in reasonable time', () => {
    const config = createMinimalConfig(true);
    const schema = JSON.parse(
      require('fs').readFileSync(SCHEMA_FILE, 'utf-8')
    );

    const startTime = Date.now();
    for (let i = 0; i < 100; i++) {
      validateSchema(config, schema);
    }
    const endTime = Date.now();

    const avgTime = (endTime - startTime) / 100;
    expect(avgTime).toBeLessThan(100); // Average < 100ms per validation (more realistic)
  });

  it('should build template context in reasonable time', () => {
    const config = createMinimalConfig(true);

    const startTime = Date.now();
    for (let i = 0; i < 1000; i++) {
      buildTemplateContext(config);
    }
    const endTime = Date.now();

    const avgTime = (endTime - startTime) / 1000;
    expect(avgTime).toBeLessThan(5); // Average < 5ms per context build
  });
});
