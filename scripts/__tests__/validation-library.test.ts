/**
 * Unit tests for validation library functions
 *
 * Tests the core validation logic without CLI overhead:
 * - Schema compilation and validation
 * - Session logic validation
 * - Edge cases and error handling
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as yaml from 'yaml';
import { validateSchema, validateSessionLogic } from '../src/lib/validator.js';
import type { Config } from '../src/types/config.js';

const PROJECT_ROOT = join(__dirname, '../..');
const PROMPTS_DIR = join(PROJECT_ROOT, 'docs/prompts');
const SCHEMA_PATH = join(PROMPTS_DIR, 'config.schema.json');

// Load schema once for all tests
const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8'));

describe('Validation Library', () => {
  describe('Schema Validation', () => {
    describe('Schema Structure', () => {
      it('should have a valid JSON Schema', () => {
        expect(schema).toBeDefined();
        expect(schema.$schema).toBe('http://json-schema.org/draft-07/schema#');
        expect(schema.type).toBe('object');
      });

      it('should define required top-level properties', () => {
        expect(schema.required).toContain('component');
        expect(schema.required).toContain('session');
        expect(schema.required).toContain('paths');
        expect(schema.required).toContain('models');
      });
    });

    describe('Valid Configurations', () => {
      it('should accept minimal valid single-session config', () => {
        const config = {
          component: { name: 'Test Component', type: 'types' },
          session: { enabled: false, current: 1, total: 1 },
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

        const result = validateSchema(config, schema);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept valid multi-session config', () => {
        const config = {
          component: { name: 'Multi Session Component', type: 'feature' },
          session: {
            enabled: true,
            current: 2,
            total: 3,
            session_1: {
              scope: 'Foundation',
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
              scope: 'Core Features',
              duration: '3-4 hours',
              file_count: 8,
              plan_sections: {
                file_list: 'Section 3.3',
                implementation: 'Section 3.4',
                verification: 'Section 4.2',
                completion_checklist: 'Section 5.2',
              },
              prerequisites_check_ref: 'Section 2.2',
            },
            session_3: {
              scope: 'Integration',
              duration: '2-3 hours',
              file_count: 4,
              plan_sections: {
                file_list: 'Section 3.5',
                implementation: 'Section 3.6',
                verification: 'Section 4.3',
                completion_checklist: 'Section 5.3',
                comprehensive_verification: 'Section 6.1',
              },
              prerequisites_check_ref: 'Section 2.3',
            },
          },
          paths: {
            specification: '@docs/specs/multi-session.md',
            master_plan: '@docs/plans/master.md',
            detailed_plan: '@docs/plans/detail.md',
            output_plan: '@docs/output/plan.md',
            output_review: '@docs/output/review.md',
            output_test_report: '@docs/output/test.md',
          },
          github: {
            pr: '#2',
            issue: '#2',
            branch: 'feature/multi-session',
          },
          context: {
            requires_oauth: true,
            requires_keycloak: true,
            security_critical: true,
          },
          models: {
            technical_architect: 'opus',
            feature_implementer_plan: 'sonnet',
            feature_implementer: 'sonnet',
            test_suite_generator: 'sonnet',
            code_security_reviewer: 'opus',
          },
        };

        const result = validateSchema(config, schema);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept all valid component types', () => {
        const types = ['types', 'service', 'component', 'feature', 'api', 'ui', 'integration'];

        types.forEach((type) => {
          const config = {
            component: { name: `${type} Component`, type },
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

          const result = validateSchema(config, schema);
          expect(result.valid).toBe(true);
        });
      });

      it('should accept all valid model values', () => {
        const models = ['haiku', 'sonnet', 'opus'];

        models.forEach((model) => {
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
              technical_architect: model,
              feature_implementer_plan: model,
              feature_implementer: model,
              test_suite_generator: model,
              code_security_reviewer: model,
            },
          };

          const result = validateSchema(config, schema);
          expect(result.valid).toBe(true);
        });
      });
    });

    describe('Invalid Configurations', () => {
      it('should reject config with missing required fields', () => {
        const config = {
          component: { name: 'Test', type: 'types' },
          // Missing session, paths, github, context, models
        };

        const result = validateSchema(config, schema);

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should reject invalid component type', () => {
        const config = {
          component: { name: 'Test', type: 'invalid-type' },
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

        const result = validateSchema(config, schema);

        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.constraint === 'enum')).toBe(true);
      });

      it('should reject invalid duration pattern', () => {
        const config = {
          component: { name: 'Test', type: 'types' },
          session: {
            enabled: true,
            current: 1,
            total: 1,
            session_1: {
              scope: 'Test',
              duration: '2 hours', // Invalid - should be "2-3 hours"
              file_count: 5,
              plan_sections: {
                file_list: 'Section 3.1',
                implementation: 'Section 3.2',
                verification: 'Section 4.1',
                completion_checklist: 'Section 5.1',
              },
              prerequisites_check_ref: 'Section 2.1',
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

        const result = validateSchema(config, schema);

        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.constraint === 'pattern')).toBe(true);
      });

      it('should reject invalid model value', () => {
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
            technical_architect: 'invalid-model',
            feature_implementer_plan: 'sonnet',
            feature_implementer: 'sonnet',
            test_suite_generator: 'haiku',
            code_security_reviewer: 'opus',
          },
        };

        const result = validateSchema(config, schema);

        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.path.includes('models'))).toBe(true);
      });
    });
  });

  describe('Session Logic Validation', () => {
    it('should pass for disabled sessions', () => {
      const config: Config = {
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

      const warnings = validateSessionLogic(config);

      expect(warnings).toHaveLength(0);
    });

    it('should warn when current > total', () => {
      const config: any = {
        component: { name: 'Test', type: 'types' },
        session: {
          enabled: true,
          current: 3,
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

      const warnings = validateSessionLogic(config);

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some((w) => w.includes('current') && w.includes('total'))).toBe(true);
    });

    it('should warn when session keys are missing', () => {
      const config: any = {
        component: { name: 'Test', type: 'types' },
        session: {
          enabled: true,
          current: 1,
          total: 3,
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
          // Missing session_2 and session_3
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

      const warnings = validateSessionLogic(config);

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some((w) => w.includes('session_2'))).toBe(true);
      expect(warnings.some((w) => w.includes('session_3'))).toBe(true);
    });

    it('should warn about extra session keys', () => {
      const config: any = {
        component: { name: 'Test', type: 'types' },
        session: {
          enabled: true,
          current: 1,
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
          session_3: {
            // Extra session beyond total
            scope: 'Session 3',
            duration: '2-3 hours',
            file_count: 5,
            plan_sections: {
              file_list: 'Section 3.5',
              implementation: 'Section 3.6',
              verification: 'Section 4.3',
              completion_checklist: 'Section 5.3',
            },
            prerequisites_check_ref: 'Section 2.3',
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

      const warnings = validateSessionLogic(config);

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some((w) => w.includes('session_3'))).toBe(true);
    });
  });

  describe('Production Config Validation', () => {
    it('should validate the production config.yaml file', () => {
      const configPath = join(PROMPTS_DIR, 'config.yaml');
      const content = readFileSync(configPath, 'utf-8');
      const config = yaml.parse(content);

      // Schema validation
      const schemaResult = validateSchema(config, schema);
      if (!schemaResult.valid) {
        console.error('Schema validation errors:', schemaResult.errors);
      }
      expect(schemaResult.valid).toBe(true);

      // Session logic validation
      const warnings = validateSessionLogic(config as Config);
      if (warnings.length > 0) {
        console.error('Session logic warnings:', warnings);
      }
      expect(warnings).toHaveLength(0);
    });
  });
});
