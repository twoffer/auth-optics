/**
 * Type definitions for agent prompt configuration
 */

export interface SessionPlanSections {
  file_list: string;
  implementation: string;
  verification: string;
  completion_checklist: string;
  comprehensive_verification?: string;
}

export interface SessionConfig {
  scope: string;
  duration: string;
  file_count: number;
  plan_sections: SessionPlanSections;
  prerequisites_check_ref: string;
}

export interface SessionConfiguration {
  enabled: boolean;
  current: number;
  total: number;
  [key: `session_${number}`]: SessionConfig;
}

export interface ComponentConfig {
  name: string;
  type: 'types' | 'service' | 'component' | 'feature' | 'api' | 'ui' | 'integration';
}

export interface PathsConfig {
  specification: string;
  master_plan: string;
  detailed_plan: string;
  output_plan: string;
  output_review: string;
  output_test_report: string;
}

export interface GitHubConfig {
  pr: string;
  issue: string;
  branch: string;
}

export interface ContextConfig {
  requires_oauth: boolean;
  requires_keycloak: boolean;
  security_critical: boolean;
}

export interface ModelsConfig {
  technical_architect: 'haiku' | 'sonnet' | 'opus';
  feature_implementer_plan: 'haiku' | 'sonnet' | 'opus';
  feature_implementer: 'haiku' | 'sonnet' | 'opus';
  test_suite_generator: 'haiku' | 'sonnet' | 'opus';
  code_security_reviewer: 'haiku' | 'sonnet' | 'opus';
}

export interface PlanModeConfig {
  master_plan_sections: string;
}

export interface Config {
  component: ComponentConfig;
  session: SessionConfiguration;
  paths: PathsConfig;
  github: GitHubConfig;
  context: ContextConfig;
  models: ModelsConfig;
  plan_mode?: PlanModeConfig;
}

/**
 * Template rendering context
 */
export interface TemplateContext {
  // Session mode
  session_mode: boolean;
  session_number?: number;
  total_sessions?: number;
  session_scope?: string;
  session_duration?: string;
  session_file_count?: number;

  // Session plan sections
  session_implementation_section?: string;
  session_file_list_section?: string;
  session_verification_section?: string;
  session_completion_checklist_section?: string;
  comprehensive_verification_section?: string;
  session_prerequisites_section?: string;

  // Conditional flags
  session_number_gt_1?: boolean;
  is_final_session?: boolean;
  not_final_session?: boolean;

  // Navigation
  previous_session?: number;
  next_session?: number;
  next_session_scope?: string;
  next_session_file_count?: number;
  next_session_duration?: string;
  next_session_file_list_section?: string;

  // Component info
  component_name: string;
  component_type: string;

  // Paths
  specification: string;
  master_plan: string;
  detailed_plan: string;
  output_plan: string;
  output_review: string;
  output_report: string;

  // GitHub info
  github_pr: string;
  github_issue: string;
  git_branch: string;

  // Context flags
  requires_oauth_context: boolean;
  requires_keycloak_context: boolean;
  security_critical: boolean;

  // Model recommendations
  model_technical_architect: string;
  model_feature_implementer_plan: string;
  model_feature_implementer: string;
  model_test_suite_generator: string;
  model_code_security_reviewer: string;

  // Plan mode
  master_plan_sections: string;

  // Metadata
  generation_timestamp: string;

  // Model-specific (added per-template)
  model?: string;
}

/**
 * Prompt generation configuration
 */
export interface PromptConfig {
  templateFile: string;
  outputFile: string;
  description: string;
  modelVar: keyof ModelsConfig;
}
