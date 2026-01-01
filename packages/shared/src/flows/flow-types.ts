/**
 * Core Flow Types
 *
 * OAuth2/OIDC flow execution types
 *
 * @remarks
 * These types represent the execution of OAuth2/OIDC flows, including
 * flow state, steps, tokens, and security assessments.
 */

import type { Timestamp, FlowId } from '../utils';

// Forward type declarations to avoid circular dependencies
// These will be implemented in their respective modules
type ClientConfig = any; // Implemented in config/client-config.ts
type ServerConfig = any; // Implemented in config/server-config.ts
type VulnerabilityConfig = any; // Implemented in vulnerability/vulnerability-config.ts
type SecurityAssessment = any; // Implemented in security/security-assessment.ts
type FlowStep = any; // Implemented in ./flow-steps.ts

/**
 * Supported OAuth2/OIDC flow types
 *
 * @remarks
 * MVP includes only AUTHORIZATION_CODE_PKCE. Other flows are future phases.
 *
 * **MVP:**
 * - AUTHORIZATION_CODE_PKCE: RFC 7636 (Authorization Code Flow with PKCE)
 *
 * **Phase 2:**
 * - CLIENT_CREDENTIALS: RFC 6749 §4.4 (machine-to-machine)
 * - DEVICE_AUTHORIZATION: RFC 8628 (input-constrained devices)
 * - REFRESH_TOKEN: RFC 6749 §6 (token refresh as standalone flow)
 *
 * **Educational/Demo Only (Phase 2-3):**
 * - IMPLICIT: RFC 6749 §4.2 (DEPRECATED - vulnerability demonstrations)
 * - RESOURCE_OWNER_PASSWORD: RFC 6749 §4.3 (DEPRECATED - vulnerability demonstrations)
 */
export enum FlowType {
  /** ✅ MVP - Authorization Code Flow with PKCE (RFC 7636) */
  AUTHORIZATION_CODE_PKCE = 'authorization_code_pkce',

  /** ❌ Phase 2 - Client Credentials Flow (RFC 6749 §4.4) */
  CLIENT_CREDENTIALS = 'client_credentials',

  /** ❌ Phase 2 - Device Authorization Flow (RFC 8628) */
  DEVICE_AUTHORIZATION = 'device_authorization',

  /** ❌ Phase 2 - Refresh Token Flow (RFC 6749 §6) */
  REFRESH_TOKEN = 'refresh_token',

  /** ❌ Phase 2-3 - Implicit Flow (DEPRECATED - RFC 6749 §4.2) */
  IMPLICIT = 'implicit',

  /** ❌ Phase 2-3 - Resource Owner Password Flow (DEPRECATED - RFC 6749 §4.3) */
  RESOURCE_OWNER_PASSWORD = 'resource_owner_password',
}

/**
 * Flow execution status
 *
 * Represents the current state of a flow execution instance
 */
export enum FlowStatus {
  /** Flow has been initialized but not started */
  IDLE = 'idle',

  /** Flow is currently executing */
  RUNNING = 'running',

  /** Flow completed successfully */
  COMPLETE = 'complete',

  /** Flow failed with an error */
  ERROR = 'error',

  /** Flow was cancelled by user */
  CANCELLED = 'cancelled',
}

/**
 * Complete flow execution instance
 *
 * Represents a single execution of an OAuth2/OIDC flow with all
 * associated data, steps, tokens, and security information.
 *
 * @remarks
 * Each flow execution has a unique ID and tracks all steps from
 * authorization request through token receipt and validation.
 *
 * @example
 * ```typescript
 * const flowExecution: FlowExecution = {
 *   id: asFlowId('flow-550e8400-e29b-41d4-a716-446655440000'),
 *   flowType: FlowType.AUTHORIZATION_CODE_PKCE,
 *   status: FlowStatus.RUNNING,
 *   startedAt: '2025-12-30T10:30:00.000Z',
 *   steps: [],
 *   config: {
 *     client: clientConfig,
 *     server: serverConfig
 *   }
 * };
 * ```
 */
export interface FlowExecution {
  /** Unique identifier for this flow execution */
  readonly id: FlowId;

  /** Type of OAuth2/OIDC flow */
  readonly flowType: FlowType;

  /** Current status of flow execution */
  status: FlowStatus;

  /** Timestamp when flow was initiated (ISO 8601) */
  readonly startedAt: Timestamp;

  /** Timestamp when flow completed/failed (ISO 8601) */
  completedAt?: Timestamp;

  /** Ordered list of flow steps */
  steps: FlowStep[];

  /** Tokens obtained during flow */
  tokens?: FlowTokens;

  /** Security assessment for this flow */
  securityAssessment?: SecurityAssessment;

  /** Error information if flow failed */
  error?: FlowError;

  /** Flow configuration used */
  config: FlowConfig;

  /** Total execution time in milliseconds */
  duration?: number;
}

/**
 * Tokens obtained from successful flow execution
 *
 * @remarks
 * Structure matches OAuth2 token endpoint response (RFC 6749 §5.1)
 * with additional OIDC ID token support
 */
export interface FlowTokens {
  /** Access token (always present on success) */
  accessToken: string;

  /** Token type (typically "Bearer" per RFC 6750) */
  tokenType: string;

  /** Access token expiration in seconds */
  expiresIn?: number;

  /** Refresh token (optional, not in client credentials flow) */
  refreshToken?: string;

  /** ID token (OIDC only) */
  idToken?: string;

  /** Granted scopes (may differ from requested) */
  scope?: string;
}

/**
 * Flow execution error
 *
 * @remarks
 * Captures both OAuth2 protocol errors (per RFC 6749 §5.2)
 * and technical execution errors
 */
export interface FlowError {
  /** OAuth2 error code (e.g., "invalid_grant", "access_denied") */
  error: string;

  /** Human-readable error description */
  errorDescription?: string;

  /** Error URI for more information (RFC 6749 §4.1.2.1) */
  errorUri?: string;

  /** Which step the error occurred in (step number) */
  step?: number;

  /** Underlying technical error (for debugging) */
  technicalError?: string;

  /** Stack trace (development only) */
  stackTrace?: string;
}

/**
 * Configuration for a specific flow execution
 *
 * @remarks
 * Contains all configuration needed to execute a flow:
 * - Client settings (client ID, redirect URI, scopes)
 * - Server settings (issuer, endpoints)
 * - Vulnerability mode settings (optional)
 */
export interface FlowConfig {
  /** Client configuration */
  client: ClientConfig;

  /** Server configuration */
  server: ServerConfig;

  /** Vulnerability mode settings (optional) */
  vulnerability?: VulnerabilityConfig;

  /** Additional flow-specific parameters */
  parameters?: Record<string, string>;
}
