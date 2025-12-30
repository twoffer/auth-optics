/**
 * Flow Step Types
 *
 * Individual step tracking within OAuth2/OIDC flows
 *
 * @remarks
 * Each flow consists of multiple sequential steps (e.g., authorization
 * request, token request, token validation). This module captures all
 * information about individual steps.
 */

import type { Timestamp } from '../utils';

// Forward type declarations to avoid circular dependencies
import type { HttpRequest, HttpResponse } from '../http';
type SecurityIndicator = any; // Implemented in security/security-indicators.ts
type ValidationResult = any; // Implemented in validation/validation-result.ts

/**
 * Individual step within an OAuth2/OIDC flow
 *
 * @remarks
 * Each flow consists of multiple sequential steps. This type captures all
 * information about a single step, including timing, HTTP communication,
 * security indicators, and validation results.
 *
 * @example
 * ```typescript
 * const authRequestStep: FlowStep = {
 *   stepNumber: 1,
 *   name: 'Authorization Request',
 *   description: 'Build and send authorization request with PKCE',
 *   status: StepStatus.COMPLETE,
 *   startedAt: '2025-12-30T10:30:00.000Z',
 *   completedAt: '2025-12-30T10:30:01.500Z',
 *   duration: 1500,
 *   request: httpRequest,
 *   response: httpResponse
 * };
 * ```
 */
export interface FlowStep {
  /** Step number (1-indexed) */
  readonly stepNumber: number;

  /** Human-readable step name */
  readonly name: string;

  /** Detailed description of what this step does */
  readonly description: string;

  /** Current status of this step */
  status: StepStatus;

  /** Timestamp when step started (ISO 8601) */
  startedAt?: Timestamp;

  /** Timestamp when step completed (ISO 8601) */
  completedAt?: Timestamp;

  /** Step duration in milliseconds */
  duration?: number;

  /** HTTP request made in this step (if applicable) */
  request?: HttpRequest;

  /** HTTP response received in this step (if applicable) */
  response?: HttpResponse;

  /** Security indicators specific to this step */
  securityIndicators?: SecurityIndicator[];

  /** Validation results for this step */
  validationResults?: ValidationResult[];

  /** Additional metadata for this step */
  metadata?: StepMetadata;
}

/**
 * Status of an individual flow step
 *
 * @remarks
 * Steps progress through states:
 * PENDING → RUNNING → (COMPLETE | WARNING | ERROR | SKIPPED)
 */
export enum StepStatus {
  /** Step is waiting to be executed */
  PENDING = 'pending',

  /** Step is currently executing */
  RUNNING = 'running',

  /** Step completed successfully */
  COMPLETE = 'complete',

  /** Step completed with warnings (e.g., security concerns) */
  WARNING = 'warning',

  /** Step failed */
  ERROR = 'error',

  /** Step was skipped (e.g., optional step not needed) */
  SKIPPED = 'skipped',
}

/**
 * Additional metadata for a flow step
 *
 * @remarks
 * Provides context for UI display, education, and debugging
 */
export interface StepMetadata {
  /** Whether this step is user-interactive (e.g., login screen) */
  isUserInteractive?: boolean;

  /** Whether this step involves external redirect */
  isExternalRedirect?: boolean;

  /** Related RFC sections */
  rfcReferences?: RFCReference[];

  /** Educational notes about this step */
  educationalNotes?: string;

  /** Common issues that occur in this step */
  commonIssues?: string[];
}

/**
 * Reference to an RFC specification section
 *
 * @remarks
 * Used to link flow steps to their specification source
 * for educational purposes
 *
 * @example
 * ```typescript
 * const pkceReference: RFCReference = {
 *   rfcNumber: '7636',
 *   section: '4.1',
 *   description: 'Client Creates a Code Verifier',
 *   url: 'https://datatracker.ietf.org/doc/html/rfc7636#section-4.1'
 * };
 * ```
 */
export interface RFCReference {
  /** RFC number (e.g., "6749", "7636") */
  rfcNumber: string;

  /** Section within RFC (e.g., "4.1.1", "A.1") */
  section?: string;

  /** Brief description of what this section covers */
  description?: string;

  /** URL to the RFC section */
  url?: string;
}
