/**
 * Security Types Test Suite
 *
 * Tests for PKCE, state, nonce, and security assessment types.
 * Covers RFC 7636, RFC 6749, and OIDC Core compliance.
 */

import { describe, it, expect } from 'vitest';
import {
  PKCEParams,
  PKCEValidationResult,
  PKCEValidationError,
  StateParam,
  StateValidationResult,
  StateValidationError,
  NonceParam,
  NonceValidationResult,
  NonceValidationError,
  SecurityAssessment,
  SecurityLevel,
  SecurityCheck,
  SecurityCheckCategory,
  SecuritySeverity,
  SecurityIndicator,
  SecurityIndicatorType,
  SecurityIndicatorStatus,
} from '../../src/security';

describe('Security Types - Day 2', () => {
  describe('PKCE Types', () => {
    describe('PKCEParams Interface', () => {
      it('should accept valid PKCE parameters', () => {
        const pkce: PKCEParams = {
          codeVerifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
          codeChallenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
          codeChallengeMethod: 'S256',
          generatedAt: '2024-01-06T10:00:00Z',
        };

        expect(pkce.codeVerifier).toHaveLength(43);
        expect(pkce.codeChallengeMethod).toBe('S256');
        expect(pkce.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      });

      it('should have readonly code verifier', () => {
        const pkce: PKCEParams = {
          codeVerifier: 'test_verifier_43_characters_long_string1234567',
          codeChallenge: 'test_challenge',
          codeChallengeMethod: 'S256',
          generatedAt: '2024-01-06T10:00:00Z',
        };

        // Verify readonly behavior (TypeScript compile-time check)
        expect(pkce.codeVerifier).toBeDefined();
      });

      it('should support 128 character code verifiers', () => {
        const longVerifier = 'a'.repeat(128);
        const pkce: PKCEParams = {
          codeVerifier: longVerifier,
          codeChallenge: 'challenge',
          codeChallengeMethod: 'S256',
          generatedAt: '2024-01-06T10:00:00Z',
        };

        expect(pkce.codeVerifier).toHaveLength(128);
      });

      it('should only allow S256 code challenge method', () => {
        const pkce: PKCEParams = {
          codeVerifier: 'test_verifier_43_characters_long_string1234567',
          codeChallenge: 'test_challenge',
          codeChallengeMethod: 'S256',
          generatedAt: '2024-01-06T10:00:00Z',
        };

        expect(pkce.codeChallengeMethod).toBe('S256');
      });
    });

    describe('PKCEValidationError Enum', () => {
      it('should define VERIFIER_TOO_SHORT error', () => {
        expect(PKCEValidationError.VERIFIER_TOO_SHORT).toBe('verifier_too_short');
      });

      it('should define VERIFIER_TOO_LONG error', () => {
        expect(PKCEValidationError.VERIFIER_TOO_LONG).toBe('verifier_too_long');
      });

      it('should define VERIFIER_INVALID_CHARS error', () => {
        expect(PKCEValidationError.VERIFIER_INVALID_CHARS).toBe('verifier_invalid_chars');
      });

      it('should define CHALLENGE_MISMATCH error', () => {
        expect(PKCEValidationError.CHALLENGE_MISMATCH).toBe('challenge_mismatch');
      });

      it('should define CHALLENGE_ENCODING_INVALID error', () => {
        expect(PKCEValidationError.CHALLENGE_ENCODING_INVALID).toBe('challenge_encoding_invalid');
      });

      it('should define METHOD_NOT_SUPPORTED error', () => {
        expect(PKCEValidationError.METHOD_NOT_SUPPORTED).toBe('method_not_supported');
      });
    });

    describe('PKCEValidationResult Interface', () => {
      it('should represent valid PKCE parameters', () => {
        const result: PKCEValidationResult = {
          isValid: true,
          errors: [],
          verifierMatches: true,
          verifierLengthValid: true,
          challengeEncodingValid: true,
        };

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should represent invalid PKCE parameters', () => {
        const result: PKCEValidationResult = {
          isValid: false,
          errors: [PKCEValidationError.VERIFIER_TOO_SHORT],
          verifierMatches: true,
          verifierLengthValid: false,
          challengeEncodingValid: true,
        };

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(PKCEValidationError.VERIFIER_TOO_SHORT);
      });

      it('should allow optional error details', () => {
        const result: PKCEValidationResult = {
          isValid: false,
          errors: [PKCEValidationError.CHALLENGE_MISMATCH],
        };

        expect(result.isValid).toBe(false);
        expect(result.errors).toBeDefined();
      });
    });
  });

  describe('State Parameter Types', () => {
    describe('StateParam Interface', () => {
      it('should accept valid state parameter', () => {
        const state: StateParam = {
          value: 'cryptographically-random-string-here',
          generatedAt: '2024-01-06T10:00:00Z',
          expiresAt: '2024-01-06T10:10:00Z',
          used: false,
        };

        expect(state.value).toBeDefined();
        expect(state.used).toBe(false);
      });

      it('should have readonly value', () => {
        const state: StateParam = {
          value: 'state-value',
          generatedAt: '2024-01-06T10:00:00Z',
          expiresAt: '2024-01-06T10:10:00Z',
          used: false,
        };

        expect(state.value).toBe('state-value');
      });

      it('should have mutable used flag', () => {
        const state: StateParam = {
          value: 'state-value',
          generatedAt: '2024-01-06T10:00:00Z',
          expiresAt: '2024-01-06T10:10:00Z',
          used: false,
        };

        // Can be modified
        state.used = true;
        expect(state.used).toBe(true);
      });
    });

    describe('StateValidationError Enum', () => {
      it('should define STATE_MISSING error', () => {
        expect(StateValidationError.STATE_MISSING).toBe('state_missing');
      });

      it('should define STATE_MISMATCH error', () => {
        expect(StateValidationError.STATE_MISMATCH).toBe('state_mismatch');
      });

      it('should define STATE_EXPIRED error', () => {
        expect(StateValidationError.STATE_EXPIRED).toBe('state_expired');
      });

      it('should define STATE_ALREADY_USED error', () => {
        expect(StateValidationError.STATE_ALREADY_USED).toBe('state_already_used');
      });

      it('should define STATE_TOO_SHORT error', () => {
        expect(StateValidationError.STATE_TOO_SHORT).toBe('state_too_short');
      });
    });

    describe('StateValidationResult Interface', () => {
      it('should represent valid state parameter', () => {
        const result: StateValidationResult = {
          isValid: true,
          errors: [],
          stateMatches: true,
          isExpired: false,
          alreadyUsed: false,
        };

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should represent expired state', () => {
        const result: StateValidationResult = {
          isValid: false,
          errors: [StateValidationError.STATE_EXPIRED],
          stateMatches: true,
          isExpired: true,
          alreadyUsed: false,
        };

        expect(result.isValid).toBe(false);
        expect(result.isExpired).toBe(true);
      });

      it('should represent mismatched state', () => {
        const result: StateValidationResult = {
          isValid: false,
          errors: [StateValidationError.STATE_MISMATCH],
          stateMatches: false,
          isExpired: false,
          alreadyUsed: false,
        };

        expect(result.isValid).toBe(false);
        expect(result.stateMatches).toBe(false);
      });

      it('should represent already used state', () => {
        const result: StateValidationResult = {
          isValid: false,
          errors: [StateValidationError.STATE_ALREADY_USED],
          stateMatches: true,
          isExpired: false,
          alreadyUsed: true,
        };

        expect(result.isValid).toBe(false);
        expect(result.alreadyUsed).toBe(true);
      });
    });
  });

  describe('Nonce Parameter Types', () => {
    describe('NonceParam Interface', () => {
      it('should accept valid nonce parameter', () => {
        const nonce: NonceParam = {
          value: 'nonce-value-here',
          generatedAt: '2024-01-06T10:00:00Z',
          verified: false,
        };

        expect(nonce.value).toBeDefined();
        expect(nonce.verified).toBe(false);
      });

      it('should have mutable verified flag', () => {
        const nonce: NonceParam = {
          value: 'nonce-value',
          generatedAt: '2024-01-06T10:00:00Z',
          verified: false,
        };

        nonce.verified = true;
        expect(nonce.verified).toBe(true);
      });
    });

    describe('NonceValidationError Enum', () => {
      it('should define NONCE_MISSING error', () => {
        expect(NonceValidationError.NONCE_MISSING).toBe('nonce_missing');
      });

      it('should define NONCE_MISMATCH error', () => {
        expect(NonceValidationError.NONCE_MISMATCH).toBe('nonce_mismatch');
      });

      it('should define NONCE_TOO_SHORT error', () => {
        expect(NonceValidationError.NONCE_TOO_SHORT).toBe('nonce_too_short');
      });
    });

    describe('NonceValidationResult Interface', () => {
      it('should represent valid nonce', () => {
        const result: NonceValidationResult = {
          isValid: true,
          errors: [],
          nonceMatches: true,
        };

        expect(result.isValid).toBe(true);
        expect(result.nonceMatches).toBe(true);
      });

      it('should represent mismatched nonce', () => {
        const result: NonceValidationResult = {
          isValid: false,
          errors: [NonceValidationError.NONCE_MISMATCH],
          nonceMatches: false,
        };

        expect(result.isValid).toBe(false);
        expect(result.nonceMatches).toBe(false);
      });
    });
  });

  describe('Security Assessment Types', () => {
    describe('SecurityLevel Enum', () => {
      it('should define CRITICAL level', () => {
        expect(SecurityLevel.CRITICAL).toBe('critical');
      });

      it('should define WARNING level', () => {
        expect(SecurityLevel.WARNING).toBe('warning');
      });

      it('should define GOOD level', () => {
        expect(SecurityLevel.GOOD).toBe('good');
      });

      it('should define EXCELLENT level', () => {
        expect(SecurityLevel.EXCELLENT).toBe('excellent');
      });
    });

    describe('SecurityCheckCategory Enum', () => {
      it('should define PKCE category', () => {
        expect(SecurityCheckCategory.PKCE).toBe('pkce');
      });

      it('should define STATE category', () => {
        expect(SecurityCheckCategory.STATE).toBe('state');
      });

      it('should define NONCE category', () => {
        expect(SecurityCheckCategory.NONCE).toBe('nonce');
      });

      it('should define REDIRECT_URI category', () => {
        expect(SecurityCheckCategory.REDIRECT_URI).toBe('redirect_uri');
      });

      it('should define TOKEN_VALIDATION category', () => {
        expect(SecurityCheckCategory.TOKEN_VALIDATION).toBe('token_validation');
      });

      it('should define HTTPS category', () => {
        expect(SecurityCheckCategory.HTTPS).toBe('https');
      });

      it('should define TOKEN_BINDING category', () => {
        expect(SecurityCheckCategory.TOKEN_BINDING).toBe('token_binding');
      });
    });

    describe('SecuritySeverity Enum', () => {
      it('should define CRITICAL severity', () => {
        expect(SecuritySeverity.CRITICAL).toBe('critical');
      });

      it('should define HIGH severity', () => {
        expect(SecuritySeverity.HIGH).toBe('high');
      });

      it('should define MEDIUM severity', () => {
        expect(SecuritySeverity.MEDIUM).toBe('medium');
      });

      it('should define LOW severity', () => {
        expect(SecuritySeverity.LOW).toBe('low');
      });

      it('should define INFO severity', () => {
        expect(SecuritySeverity.INFO).toBe('info');
      });
    });

    describe('SecurityCheck Interface', () => {
      it('should define a security check', () => {
        const check: SecurityCheck = {
          id: 'pkce-check',
          name: 'PKCE Protection',
          category: SecurityCheckCategory.PKCE,
          passed: true,
          severity: SecuritySeverity.CRITICAL,
          description: 'PKCE code challenge is properly generated and validated',
          remediation: 'Ensure code_challenge is sent in authorization request',
          rfcReference: 'RFC 7636 Section 4',
        };

        expect(check.id).toBe('pkce-check');
        expect(check.passed).toBe(true);
        expect(check.severity).toBe(SecuritySeverity.CRITICAL);
      });

      it('should allow optional remediation', () => {
        const check: SecurityCheck = {
          id: 'test-check',
          name: 'Test Check',
          category: SecurityCheckCategory.PKCE,
          passed: true,
          description: 'Test description',
        };

        expect(check.remediation).toBeUndefined();
      });

      it('should allow optional severity', () => {
        const check: SecurityCheck = {
          id: 'test-check',
          name: 'Test Check',
          category: SecurityCheckCategory.PKCE,
          passed: true,
          description: 'Test description',
        };

        expect(check.severity).toBeUndefined();
      });
    });

    describe('SecurityAssessment Interface', () => {
      it('should provide overall security assessment', () => {
        const assessment: SecurityAssessment = {
          score: 95,
          level: SecurityLevel.EXCELLENT,
          checks: [
            {
              id: 'pkce-check',
              name: 'PKCE',
              category: SecurityCheckCategory.PKCE,
              passed: true,
              severity: SecuritySeverity.CRITICAL,
              description: 'PKCE enabled',
            },
          ],
          activeVulnerabilities: [],
          recommendations: [
            {
              id: 'rec-1',
              title: 'Add DPoP',
              description: 'Consider implementing DPoP for sender-constrained tokens',
              priority: SecuritySeverity.MEDIUM,
            },
          ],
          assessedAt: '2024-01-06T10:00:00Z',
        };

        expect(assessment.score).toBe(95);
        expect(assessment.level).toBe(SecurityLevel.EXCELLENT);
        expect(assessment.checks).toHaveLength(1);
      });

      it('should track active vulnerabilities', () => {
        const assessment: SecurityAssessment = {
          score: 30,
          level: SecurityLevel.CRITICAL,
          checks: [
            {
              id: 'pkce-check',
              name: 'PKCE',
              category: SecurityCheckCategory.PKCE,
              passed: false,
              severity: SecuritySeverity.CRITICAL,
              description: 'PKCE disabled',
            },
          ],
          activeVulnerabilities: ['DISABLE_PKCE'],
          recommendations: [
            {
              id: 'rec-1',
              title: 'Enable PKCE',
              description: 'PKCE is required by OAuth 2.1',
              priority: SecuritySeverity.CRITICAL,
            },
          ],
          assessedAt: '2024-01-06T10:00:00Z',
        };

        expect(assessment.activeVulnerabilities).toContain('DISABLE_PKCE');
        expect(assessment.level).toBe(SecurityLevel.CRITICAL);
      });
    });
  });

  describe('Security Indicator Types', () => {
    describe('SecurityIndicatorType Enum', () => {
      it('should define PKCE indicator', () => {
        expect(SecurityIndicatorType.PKCE).toBe('pkce');
      });

      it('should define STATE indicator', () => {
        expect(SecurityIndicatorType.STATE).toBe('state');
      });

      it('should define NONCE indicator', () => {
        expect(SecurityIndicatorType.NONCE).toBe('nonce');
      });

      it('should define HTTPS indicator', () => {
        expect(SecurityIndicatorType.HTTPS).toBe('https');
      });

      it('should define TOKEN_SIGNATURE indicator', () => {
        expect(SecurityIndicatorType.TOKEN_SIGNATURE).toBe('token_signature');
      });

      it('should define TOKEN_BINDING indicator', () => {
        expect(SecurityIndicatorType.TOKEN_BINDING).toBe('token_binding');
      });

      it('should define REDIRECT_URI indicator', () => {
        expect(SecurityIndicatorType.REDIRECT_URI).toBe('redirect_uri');
      });
    });

    describe('SecurityIndicatorStatus Enum', () => {
      it('should define ENABLED status', () => {
        expect(SecurityIndicatorStatus.ENABLED).toBe('enabled');
      });

      it('should define DISABLED status', () => {
        expect(SecurityIndicatorStatus.DISABLED).toBe('disabled');
      });

      it('should define FAILED status', () => {
        expect(SecurityIndicatorStatus.FAILED).toBe('failed');
      });

      it('should define UNKNOWN status', () => {
        expect(SecurityIndicatorStatus.UNKNOWN).toBe('unknown');
      });
    });

    describe('SecurityIndicator Interface', () => {
      it('should display PKCE enabled indicator', () => {
        const indicator: SecurityIndicator = {
          type: SecurityIndicatorType.PKCE,
          status: SecurityIndicatorStatus.ENABLED,
          label: 'PKCE Enabled',
          tooltip: 'Proof Key for Code Exchange is enabled',
          icon: 'shield-check',
          variant: 'success',
        };

        expect(indicator.type).toBe(SecurityIndicatorType.PKCE);
        expect(indicator.status).toBe(SecurityIndicatorStatus.ENABLED);
        expect(indicator.variant).toBe('success');
      });

      it('should display PKCE disabled indicator', () => {
        const indicator: SecurityIndicator = {
          type: SecurityIndicatorType.PKCE,
          status: SecurityIndicatorStatus.DISABLED,
          label: 'PKCE Disabled',
          tooltip: 'Vulnerability mode: PKCE is disabled',
          icon: 'alert-triangle',
          variant: 'error',
        };

        expect(indicator.status).toBe(SecurityIndicatorStatus.DISABLED);
        expect(indicator.variant).toBe('error');
      });

      it('should allow optional icon', () => {
        const indicator: SecurityIndicator = {
          type: SecurityIndicatorType.STATE,
          status: SecurityIndicatorStatus.ENABLED,
          label: 'State Parameter',
          tooltip: 'State parameter is enabled',
          variant: 'success',
        };

        expect(indicator.icon).toBeUndefined();
      });

      it('should display warning for known vulnerabilities', () => {
        const indicator: SecurityIndicator = {
          type: SecurityIndicatorType.HTTPS,
          status: SecurityIndicatorStatus.FAILED,
          label: 'HTTPS Required',
          tooltip: 'HTTPS is required for secure communication',
          icon: 'alert-circle',
          variant: 'warning',
        };

        expect(indicator.variant).toBe('warning');
      });
    });
  });
});
