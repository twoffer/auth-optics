/**
 * Security Indicator Badge Types
 *
 * Types for displaying security status indicators in the UI.
 * Security indicators provide visual feedback about the security posture
 * of an OAuth2/OIDC flow.
 *
 * @module security/security-indicators
 */

/**
 * Security Indicator Badge
 *
 * Represents a visual security status indicator displayed in the UI.
 *
 * @example
 * ```typescript
 * const pkceIndicator: SecurityIndicator = {
 *   type: SecurityIndicatorType.PKCE,
 *   status: SecurityIndicatorStatus.ENABLED,
 *   label: 'PKCE',
 *   tooltip: 'Proof Key for Code Exchange is enabled',
 *   icon: 'shield-check',
 *   variant: 'success'
 * };
 * ```
 */
export interface SecurityIndicator {
  /**
   * Type of security feature
   *
   * Identifies which security mechanism this indicator represents
   */
  type: SecurityIndicatorType;

  /**
   * Current status of the security feature
   *
   * - ENABLED: Feature is active and protecting the flow
   * - DISABLED: Feature is not active (vulnerability)
   * - FAILED: Feature attempted but failed validation
   * - UNKNOWN: Status cannot be determined
   */
  status: SecurityIndicatorStatus;

  /**
   * Display label for the badge
   *
   * Short text shown in the badge, e.g., 'PKCE', 'State', 'HTTPS'
   */
  label: string;

  /**
   * Tooltip text shown on hover
   *
   * Detailed explanation of what this indicator means
   * Example: 'Proof Key for Code Exchange protects against authorization code interception'
   */
  tooltip: string;

  /**
   * Icon identifier (optional)
   *
   * Icon name for display (e.g., 'shield-check', 'alert-triangle', 'x-circle')
   * Actual icon rendering depends on UI component library
   */
  icon?: string;

  /**
   * Visual variant for styling
   *
   * Determines color and styling of the badge:
   * - success: Green, feature enabled
   * - warning: Yellow/orange, feature disabled but not critical
   * - error: Red, critical feature disabled
   * - info: Blue, informational status
   */
  variant: 'success' | 'warning' | 'error' | 'info';
}

/**
 * Security Indicator Types
 *
 * Identifies the security feature being indicated.
 */
export enum SecurityIndicatorType {
  /**
   * PKCE (Proof Key for Code Exchange) indicator
   *
   * RFC 7636:
   * - Shows whether PKCE is enabled
   * - Critical for public clients
   * - Required in OAuth 2.1
   */
  PKCE = 'pkce',

  /**
   * State parameter indicator
   *
   * RFC 6749 Section 10.12:
   * - Shows whether state parameter is used
   * - CSRF protection
   * - Required in OAuth 2.1
   */
  STATE = 'state',

  /**
   * Nonce parameter indicator (OIDC)
   *
   * OIDC Core Section 3.1.2.1:
   * - Shows whether nonce is used in ID Token
   * - Replay attack protection
   * - Recommended for Authorization Code Flow
   */
  NONCE = 'nonce',

  /**
   * HTTPS/TLS indicator
   *
   * RFC 6749 Section 3.1:
   * - Shows whether HTTPS is used for all endpoints
   * - Transport security
   * - Required for production
   */
  HTTPS = 'https',

  /**
   * Token signature verification indicator
   *
   * RFC 7519, OIDC Core:
   * - Shows whether JWT signatures are verified
   * - Token authenticity
   * - Critical security check
   */
  TOKEN_SIGNATURE = 'token_signature',

  /**
   * Token binding indicator (DPoP/mTLS)
   *
   * RFC 9449 (DPoP), RFC 8705 (mTLS):
   * - Shows whether tokens are sender-constrained
   * - Advanced security feature
   * - Prevents token theft
   */
  TOKEN_BINDING = 'token_binding',

  /**
   * Redirect URI validation indicator
   *
   * RFC 6749 Section 3.1.2:
   * - Shows redirect URI validation strictness
   * - Prevents open redirect attacks
   * - Critical security check
   */
  REDIRECT_URI = 'redirect_uri',
}

/**
 * Security Indicator Status
 *
 * Represents the current state of a security feature.
 */
export enum SecurityIndicatorStatus {
  /**
   * Security feature is enabled and active
   *
   * The security mechanism is properly configured and protecting the flow.
   *
   * Display: Green/success styling
   */
  ENABLED = 'enabled',

  /**
   * Security feature is disabled
   *
   * The security mechanism is not active, creating a vulnerability.
   * May be intentionally disabled in vulnerability mode.
   *
   * Display: Red/error styling for critical features, yellow/warning for optional
   */
  DISABLED = 'disabled',

  /**
   * Security feature attempted but validation failed
   *
   * The security mechanism was used but failed validation:
   * - PKCE: Challenge/verifier mismatch
   * - State: State parameter mismatch
   * - Nonce: Nonce validation failed
   * - Token signature: Invalid signature
   *
   * Display: Red/error styling
   */
  FAILED = 'failed',

  /**
   * Security feature status cannot be determined
   *
   * Status is unknown, typically early in the flow before validation occurs.
   *
   * Display: Gray/neutral styling
   */
  UNKNOWN = 'unknown',
}

/**
 * Security Indicator Group
 *
 * Groups related security indicators for organized display.
 *
 * @example
 * ```typescript
 * const authGroup: SecurityIndicatorGroup = {
 *   id: 'authorization',
 *   name: 'Authorization Security',
 *   description: 'Security features for authorization request',
 *   indicators: [pkceIndicator, stateIndicator, httpsIndicator]
 * };
 * ```
 */
export interface SecurityIndicatorGroup {
  /**
   * Unique identifier for this group
   */
  id: string;

  /**
   * Display name for the group
   *
   * Example: 'Authorization Security', 'Token Security'
   */
  name: string;

  /**
   * Description of this group
   *
   * Explains what security aspects this group covers
   */
  description: string;

  /**
   * Security indicators in this group
   */
  indicators: SecurityIndicator[];
}

/**
 * Security Indicator Factory Options
 *
 * Configuration for creating security indicators based on flow state.
 */
export interface SecurityIndicatorOptions {
  /**
   * Whether PKCE is enabled
   */
  pkceEnabled?: boolean;

  /**
   * Whether state parameter is used
   */
  stateUsed?: boolean;

  /**
   * Whether nonce parameter is used (OIDC)
   */
  nonceUsed?: boolean;

  /**
   * Whether HTTPS is used for all endpoints
   */
  httpsUsed?: boolean;

  /**
   * Whether token signatures are verified
   */
  tokenSignatureVerified?: boolean;

  /**
   * Whether token binding is used (DPoP/mTLS)
   */
  tokenBindingUsed?: boolean;

  /**
   * Redirect URI validation strictness
   *
   * - strict: Exact matching required
   * - lax: Pattern matching allowed
   * - none: No validation
   */
  redirectUriValidation?: 'strict' | 'lax' | 'none';

  /**
   * Active vulnerability mode toggles
   *
   * Affects indicator status (shows vulnerabilities as disabled/warning)
   */
  activeVulnerabilities?: string[];
}
