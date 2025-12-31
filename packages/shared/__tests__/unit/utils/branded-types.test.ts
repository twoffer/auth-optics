/**
 * Functional Tests: Branded Types Validation Functions
 *
 * Priority 1: Critical validation logic tests
 *
 * Coverage:
 * - asCodeVerifier() validation (RFC 7636 compliance)
 * - All other as*() functions (type casting)
 * - Edge cases and error conditions
 *
 * Framework: Vitest
 */

import { describe, it, expect } from 'vitest';
import {
  asClientId,
  asUserId,
  asFlowId,
  asAuthorizationCode,
  asCodeVerifier,
  asCodeChallenge,
  asStateValue,
  asNonceValue,
  asScopeString,
  asIssuerURL,
  asRedirectURI,
  asAccessTokenString,
  asRefreshTokenString,
  asIDTokenString,
} from '@/utils/branded-types';

describe('Branded Types Validation Functions', () => {
  describe('asCodeVerifier()', () => {
    describe('Valid Input (RFC 7636 Section 4.1)', () => {
      it('should accept valid 43-character code verifier', () => {
        // Exactly 43 characters
        const validVerifier = 'a'.repeat(43);
        expect(validVerifier.length).toBe(43);
        expect(() => asCodeVerifier(validVerifier)).not.toThrow();
        const result = asCodeVerifier(validVerifier);
        expect(result).toBe(validVerifier);
      });

      it('should accept valid 44-character code verifier', () => {
        // Exactly 44 characters
        const validVerifier = 'a'.repeat(44);
        expect(validVerifier.length).toBe(44);
        expect(() => asCodeVerifier(validVerifier)).not.toThrow();
      });

      it('should accept valid 128-character code verifier (maximum)', () => {
        // RFC 7636: Maximum length is 128 characters
        const validVerifier = 'a'.repeat(128);
        expect(() => asCodeVerifier(validVerifier)).not.toThrow();
      });

      it('should accept valid 60-character code verifier (mid-range)', () => {
        const validVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk-ZyAbcDef123';
        expect(() => asCodeVerifier(validVerifier)).not.toThrow();
      });

      it('should accept code verifier with allowed characters (A-Z, a-z, 0-9, -, ., _, ~)', () => {
        const validVerifier = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklm-._~';
        expect(() => asCodeVerifier(validVerifier)).not.toThrow();
      });
    });

    describe('Invalid Input (Below Minimum Length)', () => {
      it('should reject 42-character code verifier (one below minimum)', () => {
        const invalidVerifier = 'a'.repeat(42);
        expect(() => asCodeVerifier(invalidVerifier)).toThrow();
      });

      it('should reject empty string', () => {
        expect(() => asCodeVerifier('')).toThrow();
      });

      it('should reject 1-character string', () => {
        expect(() => asCodeVerifier('a')).toThrow();
      });

      it('should reject 20-character string', () => {
        expect(() => asCodeVerifier('a'.repeat(20))).toThrow();
      });
    });

    describe('Error Messages', () => {
      it('should throw error with correct message for short verifier', () => {
        expect(() => asCodeVerifier('short')).toThrow(
          'Code verifier must be at least 43 characters (RFC 7636)'
        );
      });

      it('should throw error with correct message for 42-character verifier', () => {
        const invalidVerifier = 'a'.repeat(42);
        expect(() => asCodeVerifier(invalidVerifier)).toThrow(
          'Code verifier must be at least 43 characters (RFC 7636)'
        );
      });
    });

    describe('Edge Cases', () => {
      it('should reject 0-character string', () => {
        expect(() => asCodeVerifier('')).toThrow();
      });

      it('should accept very long string (>128 chars - no max validation)', () => {
        // Note: Current implementation only validates minimum, not maximum
        // RFC 7636 specifies max 128, but this test documents current behavior
        const longVerifier = 'a'.repeat(200);
        expect(() => asCodeVerifier(longVerifier)).not.toThrow();
      });
    });
  });

  describe('asClientId()', () => {
    it('should accept valid client ID', () => {
      const clientId = 'web-app-client-id';
      const result = asClientId(clientId);
      expect(result).toBe(clientId);
    });

    it('should accept empty string', () => {
      const result = asClientId('');
      expect(result).toBe('');
    });

    it('should accept client ID with special characters', () => {
      const clientId = 'client-123_ABC.xyz';
      const result = asClientId(clientId);
      expect(result).toBe(clientId);
    });

    it('should accept UUID format client ID', () => {
      const clientId = '550e8400-e29b-41d4-a716-446655440000';
      const result = asClientId(clientId);
      expect(result).toBe(clientId);
    });
  });

  describe('asUserId()', () => {
    it('should accept valid user ID', () => {
      const userId = 'user-550e8400-e29b-41d4-a716-446655440000';
      const result = asUserId(userId);
      expect(result).toBe(userId);
    });

    it('should accept empty string', () => {
      const result = asUserId('');
      expect(result).toBe('');
    });

    it('should accept numeric user ID', () => {
      const userId = '12345';
      const result = asUserId(userId);
      expect(result).toBe(userId);
    });
  });

  describe('asFlowId()', () => {
    it('should accept valid flow ID', () => {
      const flowId = 'flow-123e4567-e89b-12d3-a456-426614174000';
      const result = asFlowId(flowId);
      expect(result).toBe(flowId);
    });

    it('should accept empty string', () => {
      const result = asFlowId('');
      expect(result).toBe('');
    });

    it('should accept short flow ID', () => {
      const flowId = 'flow-1';
      const result = asFlowId(flowId);
      expect(result).toBe(flowId);
    });
  });

  describe('asAuthorizationCode()', () => {
    it('should accept valid authorization code', () => {
      const authCode = 'SplxlOBeZQQYbYS6WxSbIA';
      const result = asAuthorizationCode(authCode);
      expect(result).toBe(authCode);
    });

    it('should accept empty string', () => {
      const result = asAuthorizationCode('');
      expect(result).toBe('');
    });

    it('should accept long authorization code', () => {
      const authCode = 'a'.repeat(100);
      const result = asAuthorizationCode(authCode);
      expect(result).toBe(authCode);
    });
  });

  describe('asCodeChallenge()', () => {
    it('should accept valid code challenge', () => {
      const challenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';
      const result = asCodeChallenge(challenge);
      expect(result).toBe(challenge);
    });

    it('should accept empty string', () => {
      const result = asCodeChallenge('');
      expect(result).toBe('');
    });

    it('should accept base64url encoded challenge', () => {
      const challenge = 'w6uP8Tcg6K2QR905Rms8iXTlksL6OD1KOWBxTK7wxPI';
      const result = asCodeChallenge(challenge);
      expect(result).toBe(challenge);
    });
  });

  describe('asStateValue()', () => {
    it('should accept valid state value', () => {
      const state = 'xyzABC123';
      const result = asStateValue(state);
      expect(result).toBe(state);
    });

    it('should accept empty string', () => {
      const result = asStateValue('');
      expect(result).toBe('');
    });

    it('should accept long state value', () => {
      const state = 'a'.repeat(64);
      const result = asStateValue(state);
      expect(result).toBe(state);
    });
  });

  describe('asNonceValue()', () => {
    it('should accept valid nonce value', () => {
      const nonce = 'n-0S6_WzA2Mj';
      const result = asNonceValue(nonce);
      expect(result).toBe(nonce);
    });

    it('should accept empty string', () => {
      const result = asNonceValue('');
      expect(result).toBe('');
    });

    it('should accept UUID format nonce', () => {
      const nonce = '550e8400-e29b-41d4-a716-446655440000';
      const result = asNonceValue(nonce);
      expect(result).toBe(nonce);
    });
  });

  describe('asScopeString()', () => {
    it('should accept valid space-separated scopes', () => {
      const scope = 'openid profile email';
      const result = asScopeString(scope);
      expect(result).toBe(scope);
    });

    it('should accept single scope', () => {
      const scope = 'openid';
      const result = asScopeString(scope);
      expect(result).toBe(scope);
    });

    it('should accept empty string', () => {
      const result = asScopeString('');
      expect(result).toBe('');
    });

    it('should accept custom scopes', () => {
      const scope = 'openid profile email read:users write:users';
      const result = asScopeString(scope);
      expect(result).toBe(scope);
    });
  });

  describe('asIssuerURL()', () => {
    it('should accept valid HTTPS issuer URL', () => {
      const issuer = 'https://auth.example.com';
      const result = asIssuerURL(issuer);
      expect(result).toBe(issuer);
    });

    it('should accept HTTP localhost URL (development)', () => {
      const issuer = 'http://localhost:8080';
      const result = asIssuerURL(issuer);
      expect(result).toBe(issuer);
    });

    it('should accept issuer URL with path', () => {
      const issuer = 'https://auth.example.com/realms/demo';
      const result = asIssuerURL(issuer);
      expect(result).toBe(issuer);
    });

    it('should accept empty string', () => {
      const result = asIssuerURL('');
      expect(result).toBe('');
    });
  });

  describe('asRedirectURI()', () => {
    it('should accept valid HTTPS redirect URI', () => {
      const uri = 'https://app.example.com/callback';
      const result = asRedirectURI(uri);
      expect(result).toBe(uri);
    });

    it('should accept HTTP localhost redirect URI', () => {
      const uri = 'http://localhost:3000/callback';
      const result = asRedirectURI(uri);
      expect(result).toBe(uri);
    });

    it('should accept redirect URI with query parameters', () => {
      const uri = 'https://app.example.com/callback?param=value';
      const result = asRedirectURI(uri);
      expect(result).toBe(uri);
    });

    it('should accept empty string', () => {
      const result = asRedirectURI('');
      expect(result).toBe('');
    });

    it('should accept custom scheme redirect URI (mobile)', () => {
      const uri = 'myapp://callback';
      const result = asRedirectURI(uri);
      expect(result).toBe(uri);
    });
  });

  describe('asAccessTokenString()', () => {
    it('should accept valid JWT access token', () => {
      const token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const result = asAccessTokenString(token);
      expect(result).toBe(token);
    });

    it('should accept opaque access token', () => {
      const token = 'tGzv3JOkF0XG5Qx2TlKWIA';
      const result = asAccessTokenString(token);
      expect(result).toBe(token);
    });

    it('should accept empty string', () => {
      const result = asAccessTokenString('');
      expect(result).toBe('');
    });
  });

  describe('asRefreshTokenString()', () => {
    it('should accept valid refresh token', () => {
      const token = 'tGzv3JOkF0XG5Qx2TlKWIA';
      const result = asRefreshTokenString(token);
      expect(result).toBe(token);
    });

    it('should accept JWT refresh token', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      const result = asRefreshTokenString(token);
      expect(result).toBe(token);
    });

    it('should accept empty string', () => {
      const result = asRefreshTokenString('');
      expect(result).toBe('');
    });

    it('should accept long refresh token', () => {
      const token = 'a'.repeat(200);
      const result = asRefreshTokenString(token);
      expect(result).toBe(token);
    });
  });

  describe('asIDTokenString()', () => {
    it('should accept valid ID token (JWT)', () => {
      const token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYXVkIjoiY2xpZW50LWlkIiwiaXNzIjoiaHR0cHM6Ly9hdXRoLmV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDI2MjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const result = asIDTokenString(token);
      expect(result).toBe(token);
    });

    it('should accept empty string', () => {
      const result = asIDTokenString('');
      expect(result).toBe('');
    });

    it('should accept minimal JWT structure', () => {
      const token = 'eyJhbGciOiJub25lIn0.e30.';
      const result = asIDTokenString(token);
      expect(result).toBe(token);
    });
  });
});
