/**
 * Security Assessment and Scoring Types
 *
 * RFC 6819: OAuth 2.0 Threat Model and Security Considerations
 * https://datatracker.ietf.org/doc/html/rfc6819
 *
 * OAuth 2.1 Security Requirements
 * https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1
 *
 * This module provides types for assessing the security posture of OAuth2/OIDC
 * flows, identifying vulnerabilities, and providing recommendations.
 *
 * @module security/security-assessment
 */

/**
 * Overall Security Assessment for an OAuth2 Flow
 *
 * Aggregates multiple security checks into a single assessment with score,
 * level, and recommendations.
 *
 * @example
 * ```typescript
 * const assessment: SecurityAssessment = {
 *   score: 85,
 *   level: SecurityLevel.GOOD,
 *   checks: [
 *     {
 *       id: 'pkce-check',
 *       name: 'PKCE Enabled',
 *       category: SecurityCheckCategory.PKCE,
 *       passed: true,
 *       severity: SecuritySeverity.CRITICAL,
 *       description: 'PKCE is enabled for authorization code flow',
 *       rfcReference: 'RFC 7636'
 *     }
 *   ],
 *   activeVulnerabilities: [],
 *   recommendations: [],
 *   assessedAt: '2024-01-06T10:00:00Z'
 * };
 * ```
 */
export interface SecurityAssessment {
  /**
   * Overall security score (0-100)
   *
   * Calculation:
   * - 100: All critical checks pass, no vulnerabilities
   * - 75-99: Good security, minor issues
   * - 50-74: Warning level, some security issues
   * - 0-49: Critical issues, flow is vulnerable
   *
   * Scoring algorithm:
   * - Critical check failure: -20 points
   * - High severity failure: -10 points
   * - Medium severity failure: -5 points
   * - Low severity failure: -2 points
   */
  score: number;

  /**
   * Security level based on score
   *
   * - EXCELLENT (90-100): Best practices followed
   * - GOOD (75-89): Secure with minor improvements possible
   * - WARNING (50-74): Some security issues present
   * - CRITICAL (0-49): Serious vulnerabilities present
   */
  level: SecurityLevel;

  /**
   * Individual security checks performed
   *
   * Each check evaluates a specific security aspect:
   * - PKCE implementation
   * - State parameter usage
   * - Nonce parameter usage (OIDC)
   * - Redirect URI validation
   * - Token validation
   * - HTTPS usage
   * - Token binding (DPoP/mTLS)
   */
  checks: SecurityCheck[];

  /**
   * List of active vulnerability mode toggles
   *
   * Vulnerabilities intentionally enabled for educational purposes.
   * Empty array in production (should always be secure).
   *
   * Example: ['DISABLE_PKCE', 'PREDICTABLE_STATE']
   */
  activeVulnerabilities: string[];

  /**
   * Security recommendations for improvement
   *
   * Actionable recommendations sorted by priority:
   * - CRITICAL: Must fix immediately
   * - HIGH: Should fix soon
   * - MEDIUM: Recommended improvement
   * - LOW: Nice to have
   */
  recommendations: SecurityRecommendation[];

  /**
   * Timestamp when assessment was performed (ISO 8601)
   */
  assessedAt: string;
}

/**
 * Security Level Classification
 *
 * Categorizes overall security posture based on assessment score.
 */
export enum SecurityLevel {
  /**
   * Excellent security (90-100 score)
   *
   * - All critical checks pass
   * - Best practices followed
   * - No active vulnerabilities
   * - OAuth 2.1 compliant
   */
  EXCELLENT = 'excellent',

  /**
   * Good security (75-89 score)
   *
   * - Critical checks pass
   * - Minor improvements possible
   * - No critical vulnerabilities
   * - Generally secure
   */
  GOOD = 'good',

  /**
   * Warning level (50-74 score)
   *
   * - Some security issues present
   * - Recommendations should be addressed
   * - May have medium severity vulnerabilities
   * - Not recommended for production
   */
  WARNING = 'warning',

  /**
   * Critical security issues (0-49 score)
   *
   * - Critical checks failed
   * - Serious vulnerabilities present
   * - Flow is exploitable
   * - Must not be used in production
   */
  CRITICAL = 'critical',
}

/**
 * Individual Security Check
 *
 * Represents evaluation of a specific security aspect.
 *
 * @example
 * ```typescript
 * const check: SecurityCheck = {
 *   id: 'pkce-enabled',
 *   name: 'PKCE Protection',
 *   category: SecurityCheckCategory.PKCE,
 *   passed: false,
 *   severity: SecuritySeverity.CRITICAL,
 *   description: 'PKCE is not enabled for this authorization code flow',
 *   remediation: 'Enable PKCE by setting usePKCE: true in client configuration',
 *   rfcReference: 'RFC 7636 Section 1'
 * };
 * ```
 */
export interface SecurityCheck {
  /**
   * Unique identifier for this check
   *
   * Example: 'pkce-enabled', 'state-present', 'https-used'
   */
  id: string;

  /**
   * Human-readable check name
   *
   * Example: 'PKCE Protection', 'State Parameter', 'HTTPS Transport'
   */
  name: string;

  /**
   * Category of security check
   *
   * Groups related checks together for organization
   */
  category: SecurityCheckCategory;

  /**
   * Whether the check passed
   *
   * true: Security requirement met
   * false: Security issue detected
   */
  passed: boolean;

  /**
   * Severity if check failed
   *
   * Indicates impact of security issue:
   * - CRITICAL: Immediately exploitable
   * - HIGH: Serious security risk
   * - MEDIUM: Moderate security risk
   * - LOW: Minor security issue
   * - INFO: Informational finding
   */
  severity?: SecuritySeverity;

  /**
   * Detailed description of the check
   *
   * Explains what was checked and why it matters
   */
  description: string;

  /**
   * Remediation steps if check failed
   *
   * Actionable guidance for fixing the issue
   */
  remediation?: string;

  /**
   * RFC/specification reference
   *
   * Points to relevant section in OAuth2/OIDC specifications
   * Example: 'RFC 7636 Section 4', 'OIDC Core Section 3.1.3.7'
   */
  rfcReference?: string;
}

/**
 * Security Check Categories
 *
 * Organizes security checks by functional area.
 */
export enum SecurityCheckCategory {
  /**
   * PKCE (Proof Key for Code Exchange) checks
   *
   * RFC 7636:
   * - PKCE enabled
   * - Code challenge method (S256)
   * - Code verifier validation
   */
  PKCE = 'pkce',

  /**
   * State parameter checks
   *
   * RFC 6749 Section 10.12:
   * - State parameter present
   * - State validation
   * - CSRF protection
   */
  STATE = 'state',

  /**
   * Nonce parameter checks (OIDC)
   *
   * OIDC Core Section 3.1.3.7:
   * - Nonce present in ID Token
   * - Nonce validation
   * - Replay attack protection
   */
  NONCE = 'nonce',

  /**
   * Redirect URI validation checks
   *
   * RFC 6749 Section 3.1.2:
   * - Exact URI matching
   * - No open redirects
   * - Proper URI encoding
   */
  REDIRECT_URI = 'redirect_uri',

  /**
   * Token validation checks
   *
   * RFC 7519, OIDC Core:
   * - Signature verification
   * - Expiration check
   * - Issuer validation
   * - Audience validation
   */
  TOKEN_VALIDATION = 'token_validation',

  /**
   * HTTPS/TLS checks
   *
   * RFC 6749 Section 3.1:
   * - HTTPS required for endpoints
   * - Certificate validation
   * - TLS version
   */
  HTTPS = 'https',

  /**
   * Token binding checks (DPoP, mTLS)
   *
   * RFC 9449 (DPoP), RFC 8705 (mTLS):
   * - Sender-constrained tokens
   * - Token binding validation
   */
  TOKEN_BINDING = 'token_binding',
}

/**
 * Security Severity Levels
 *
 * Indicates the impact of a security issue.
 */
export enum SecuritySeverity {
  /**
   * Critical - Immediately exploitable vulnerability
   *
   * Examples:
   * - Missing PKCE
   * - Missing state parameter
   * - No token signature verification
   */
  CRITICAL = 'critical',

  /**
   * High - Serious security risk
   *
   * Examples:
   * - Weak code challenge method (plain)
   * - Lax redirect URI validation
   * - Missing nonce in ID Token
   */
  HIGH = 'high',

  /**
   * Medium - Moderate security risk
   *
   * Examples:
   * - Short state/nonce values
   * - Missing HTTPS in non-production
   * - Weak token expiration
   */
  MEDIUM = 'medium',

  /**
   * Low - Minor security issue
   *
   * Examples:
   * - Missing optional security headers
   * - Suboptimal token lifetimes
   * - Missing rate limiting
   */
  LOW = 'low',

  /**
   * Informational - No immediate security impact
   *
   * Examples:
   * - Best practice recommendations
   * - Performance optimizations
   * - Documentation suggestions
   */
  INFO = 'info',
}

/**
 * Security Recommendation
 *
 * Actionable advice for improving security posture.
 *
 * @example
 * ```typescript
 * const recommendation: SecurityRecommendation = {
 *   id: 'enable-pkce',
 *   title: 'Enable PKCE for Authorization Code Flow',
 *   description: 'PKCE prevents authorization code interception attacks...',
 *   priority: SecuritySeverity.CRITICAL,
 *   learnMoreUrl: 'https://datatracker.ietf.org/doc/html/rfc7636'
 * };
 * ```
 */
export interface SecurityRecommendation {
  /**
   * Unique identifier for this recommendation
   */
  id: string;

  /**
   * Recommendation title
   *
   * Brief, actionable summary
   */
  title: string;

  /**
   * Detailed description
   *
   * Explains the issue and why the recommendation matters
   */
  description: string;

  /**
   * Priority of this recommendation
   *
   * Based on security severity:
   * - CRITICAL: Fix immediately
   * - HIGH: Fix soon
   * - MEDIUM: Recommended
   * - LOW: Nice to have
   */
  priority: SecuritySeverity;

  /**
   * URL to learn more
   *
   * Links to RFC sections, documentation, or security guides
   */
  learnMoreUrl?: string;
}
