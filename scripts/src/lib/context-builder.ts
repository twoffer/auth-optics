/**
 * Build template rendering context from configuration
 */

import type { Config, SessionConfig, TemplateContext } from '../types/config.js';

/**
 * Calculate session-specific variables from config
 */
export function calculateSessionVariables(config: Config): Partial<TemplateContext> {
  const sessionConfig = config.session;

  if (!sessionConfig?.enabled) {
    // Single-session mode
    return {
      session_mode: false,
    };
  }

  const current = sessionConfig.current;
  const total = sessionConfig.total;
  const sessionKey = `session_${current}` as `session_${number}`;

  if (!(sessionKey in sessionConfig)) {
    throw new Error(`${sessionKey} not defined in config.yaml`);
  }

  const sessionData = sessionConfig[sessionKey] as SessionConfig;

  // Calculate conditional flags
  const session_number_gt_1 = current > 1;
  const is_final_session = current === total;
  const not_final_session = current < total;

  // Get next session data if exists
  const nextSessionKey = `session_${current + 1}` as `session_${number}`;
  const nextSessionData = !is_final_session && nextSessionKey in sessionConfig
    ? (sessionConfig[nextSessionKey] as SessionConfig)
    : undefined;

  // Build session variables
  const variables: Partial<TemplateContext> = {
    session_mode: true,
    session_number: current,
    total_sessions: total,
    session_scope: sessionData.scope,
    session_duration: sessionData.duration,
    session_file_count: sessionData.file_count,

    // Section references
    session_implementation_section: sessionData.plan_sections.implementation,
    session_file_list_section: sessionData.plan_sections.file_list,
    session_verification_section: sessionData.plan_sections.verification,
    session_completion_checklist_section: sessionData.plan_sections.completion_checklist,
    session_prerequisites_section: sessionData.prerequisites_check_ref,

    // Conditional flags
    session_number_gt_1,
    is_final_session,
    not_final_session,

    // Navigation
    previous_session: session_number_gt_1 ? current - 1 : 0,
    next_session: not_final_session ? current + 1 : 0,
  };

  // Add comprehensive verification section if exists
  if (sessionData.plan_sections.comprehensive_verification) {
    variables.comprehensive_verification_section =
      sessionData.plan_sections.comprehensive_verification;
  }

  // Add next session data if exists
  if (nextSessionData) {
    variables.next_session_scope = nextSessionData.scope;
    variables.next_session_file_count = nextSessionData.file_count;
    variables.next_session_duration = nextSessionData.duration;
    variables.next_session_file_list_section = nextSessionData.plan_sections.file_list;
  }

  return variables;
}

/**
 * Build complete template context from config
 */
export function buildTemplateContext(config: Config): TemplateContext {
  // Start with session variables
  const context: any = calculateSessionVariables(config);

  // Add component info
  context.component_name = config.component.name;
  context.component_type = config.component.type;

  // Add paths
  context.specification = config.paths.specification;
  context.master_plan = config.paths.master_plan;
  context.detailed_plan = config.paths.detailed_plan;
  context.output_plan = config.paths.output_plan;
  context.output_review = config.paths.output_review;
  context.output_report = config.paths.output_test_report;

  // Add GitHub info
  context.github_pr = config.github.pr;
  context.github_issue = config.github.issue;
  context.git_branch = config.github.branch;

  // Add context flags
  context.requires_oauth_context = config.context.requires_oauth;
  context.requires_keycloak_context = config.context.requires_keycloak;
  context.security_critical = config.context.security_critical;

  // Add model recommendations
  context.model_technical_architect = config.models.technical_architect;
  context.model_feature_implementer_plan = config.models.feature_implementer_plan;
  context.model_feature_implementer = config.models.feature_implementer;
  context.model_test_suite_generator = config.models.test_suite_generator;
  context.model_code_security_reviewer = config.models.code_security_reviewer;

  // Add plan mode config (optional)
  context.master_plan_sections = config.plan_mode?.master_plan_sections || '';

  // Add generation metadata
  context.generation_timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  return context as TemplateContext;
}
