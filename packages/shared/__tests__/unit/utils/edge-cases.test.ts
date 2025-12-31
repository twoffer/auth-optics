/**
 * Edge Case Tests: Validation Functions
 *
 * Priority 2: Comprehensive edge case coverage
 *
 * Coverage:
 * - Empty strings, null, undefined
 * - Very long strings (1000+, 10000+ chars)
 * - Unicode characters (emojis, Chinese, special symbols)
 * - Whitespace variants
 * - Special characters
 * - Enum edge cases
 * - getStatusCategory() special values
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

import { FlowStatus, FlowType } from '@/flows/flow-types';
import { StepStatus } from '@/flows/flow-steps';
import { HttpMethod } from '@/http/request';
import { getStatusCategory, HttpStatusCategory } from '@/http/response';

describe('Edge Case Tests: Validation Functions', () => {
  describe('Empty Strings', () => {
    it('should accept empty string for asClientId', () => {
      expect(asClientId('')).toBe('');
    });

    it('should accept empty string for asUserId', () => {
      expect(asUserId('')).toBe('');
    });

    it('should accept empty string for asFlowId', () => {
      expect(asFlowId('')).toBe('');
    });

    it('should accept empty string for asAuthorizationCode', () => {
      expect(asAuthorizationCode('')).toBe('');
    });

    it('should reject empty string for asCodeVerifier', () => {
      expect(() => asCodeVerifier('')).toThrow();
    });

    it('should accept empty string for asCodeChallenge', () => {
      expect(asCodeChallenge('')).toBe('');
    });

    it('should accept empty string for asStateValue', () => {
      expect(asStateValue('')).toBe('');
    });

    it('should accept empty string for asNonceValue', () => {
      expect(asNonceValue('')).toBe('');
    });

    it('should accept empty string for asScopeString', () => {
      expect(asScopeString('')).toBe('');
    });

    it('should accept empty string for asIssuerURL', () => {
      expect(asIssuerURL('')).toBe('');
    });

    it('should accept empty string for asRedirectURI', () => {
      expect(asRedirectURI('')).toBe('');
    });

    it('should accept empty string for asAccessTokenString', () => {
      expect(asAccessTokenString('')).toBe('');
    });

    it('should accept empty string for asRefreshTokenString', () => {
      expect(asRefreshTokenString('')).toBe('');
    });

    it('should accept empty string for asIDTokenString', () => {
      expect(asIDTokenString('')).toBe('');
    });
  });

  describe('Very Long Strings', () => {
    it('should accept 1000-character string for asClientId', () => {
      const longString = 'a'.repeat(1000);
      expect(asClientId(longString)).toBe(longString);
    });

    it('should accept 10000-character string for asClientId', () => {
      const veryLongString = 'a'.repeat(10000);
      expect(asClientId(veryLongString)).toBe(veryLongString);
    });

    it('should accept 1000-character string for asUserId', () => {
      const longString = 'user-' + 'a'.repeat(995);
      expect(asUserId(longString)).toBe(longString);
    });

    it('should accept 10000-character string for asFlowId', () => {
      const veryLongString = 'flow-' + 'a'.repeat(9995);
      expect(asFlowId(veryLongString)).toBe(veryLongString);
    });

    it('should accept 1000-character authorization code', () => {
      const longCode = 'a'.repeat(1000);
      expect(asAuthorizationCode(longCode)).toBe(longCode);
    });

    it('should accept 200-character code verifier (>128 max per RFC)', () => {
      // Note: RFC 7636 specifies max 128, but current implementation doesn't enforce max
      const longVerifier = 'a'.repeat(200);
      expect(() => asCodeVerifier(longVerifier)).not.toThrow();
    });

    it('should accept 1000-character state value', () => {
      const longState = 'a'.repeat(1000);
      expect(asStateValue(longState)).toBe(longState);
    });

    it('should accept 5000-character scope string', () => {
      const longScope = 'openid ' + 'scope'.repeat(1000);
      expect(asScopeString(longScope)).toBe(longScope);
    });

    it('should accept 1000-character URL', () => {
      const longUrl = 'https://example.com/' + 'path/'.repeat(100) + 'file.html';
      expect(asIssuerURL(longUrl)).toBe(longUrl);
    });

    it('should accept 10000-character JWT token', () => {
      const longToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.' + 'a'.repeat(9950) + '.signature';
      expect(asAccessTokenString(longToken)).toBe(longToken);
    });
  });

  describe('Unicode Characters', () => {
    it('should accept emoji in asClientId', () => {
      const emojiClientId = 'client-🔐-app';
      expect(asClientId(emojiClientId)).toBe(emojiClientId);
    });

    it('should accept Chinese characters in asUserId', () => {
      const chineseUserId = '用户-123';
      expect(asUserId(chineseUserId)).toBe(chineseUserId);
    });

    it('should accept emoji in asFlowId', () => {
      const emojiFlowId = 'flow-✅-complete';
      expect(asFlowId(emojiFlowId)).toBe(emojiFlowId);
    });

    it('should accept mixed unicode in asStateValue', () => {
      const unicodeState = 'state-🔒-安全-état-🛡️';
      expect(asStateValue(unicodeState)).toBe(unicodeState);
    });

    it('should accept special symbols in asScopeString', () => {
      const symbolScope = 'openid profile:read ✓verified';
      expect(asScopeString(symbolScope)).toBe(symbolScope);
    });

    it('should accept internationalized domain in asIssuerURL', () => {
      const i18nUrl = 'https://认证.example.com';
      expect(asIssuerURL(i18nUrl)).toBe(i18nUrl);
    });

    it('should accept emoji in asNonceValue', () => {
      const emojiNonce = 'nonce-🎲-random';
      expect(asNonceValue(emojiNonce)).toBe(emojiNonce);
    });

    it('should accept combined unicode characters', () => {
      // Combining diacritics and emojis
      const combinedString = 'café-👨‍👩‍👧‍👦-família';
      expect(asClientId(combinedString)).toBe(combinedString);
    });
  });

  describe('Whitespace Variants', () => {
    it('should accept leading whitespace in asClientId', () => {
      const leadingSpace = '   client-id';
      expect(asClientId(leadingSpace)).toBe(leadingSpace);
    });

    it('should accept trailing whitespace in asClientId', () => {
      const trailingSpace = 'client-id   ';
      expect(asClientId(trailingSpace)).toBe(trailingSpace);
    });

    it('should accept internal whitespace in asUserId', () => {
      const internalSpace = 'user id with spaces';
      expect(asUserId(internalSpace)).toBe(internalSpace);
    });

    it('should accept tabs in asFlowId', () => {
      const withTabs = 'flow\t\tid';
      expect(asFlowId(withTabs)).toBe(withTabs);
    });

    it('should accept newlines in asStateValue', () => {
      const withNewlines = 'state\nvalue\n';
      expect(asStateValue(withNewlines)).toBe(withNewlines);
    });

    it('should accept carriage returns in asAuthorizationCode', () => {
      const withCR = 'code\r\nvalue';
      expect(asAuthorizationCode(withCR)).toBe(withCR);
    });

    it('should accept mixed whitespace in asScopeString', () => {
      const mixedWhitespace = '  openid  \t profile  \n email  ';
      expect(asScopeString(mixedWhitespace)).toBe(mixedWhitespace);
    });

    it('should accept only whitespace string', () => {
      const onlySpaces = '     ';
      expect(asClientId(onlySpaces)).toBe(onlySpaces);
    });

    it('should accept tab-only string', () => {
      const onlyTabs = '\t\t\t';
      expect(asUserId(onlyTabs)).toBe(onlyTabs);
    });

    it('should accept newline-only string', () => {
      const onlyNewlines = '\n\n\n';
      expect(asFlowId(onlyNewlines)).toBe(onlyNewlines);
    });
  });

  describe('Special Characters', () => {
    it('should accept angle brackets in asClientId', () => {
      const withBrackets = '<client>-id';
      expect(asClientId(withBrackets)).toBe(withBrackets);
    });

    it('should accept quotes in asUserId', () => {
      const withQuotes = 'user-"john"-\'doe\'';
      expect(asUserId(withQuotes)).toBe(withQuotes);
    });

    it('should accept ampersand in asFlowId', () => {
      const withAmpersand = 'flow&id';
      expect(asFlowId(withAmpersand)).toBe(withAmpersand);
    });

    it('should accept semicolon in asStateValue', () => {
      const withSemicolon = 'state;value';
      expect(asStateValue(withSemicolon)).toBe(withSemicolon);
    });

    it('should accept parentheses in asNonceValue', () => {
      const withParens = 'nonce-(123)';
      expect(asNonceValue(withParens)).toBe(withParens);
    });

    it('should accept curly braces in asAuthorizationCode', () => {
      const withBraces = 'code{value}';
      expect(asAuthorizationCode(withBraces)).toBe(withBraces);
    });

    it('should accept square brackets in asCodeChallenge', () => {
      const withBrackets = 'challenge[abc]';
      expect(asCodeChallenge(withBrackets)).toBe(withBrackets);
    });

    it('should accept all special characters together', () => {
      const allSpecial = '<>\'\"&;(){}[]!@#$%^*+=|\\/?';
      expect(asClientId(allSpecial)).toBe(allSpecial);
    });

    it('should accept URL-encoded characters in asRedirectURI', () => {
      const urlEncoded = 'https://app.example.com/callback?param=value%20with%20spaces';
      expect(asRedirectURI(urlEncoded)).toBe(urlEncoded);
    });

    it('should accept special OAuth2 characters in asScopeString', () => {
      const oauthScope = 'openid profile:read email.verified user-data+write';
      expect(asScopeString(oauthScope)).toBe(oauthScope);
    });
  });

  describe('Enum Edge Cases', () => {
    describe('FlowStatus Enum', () => {
      it('should accept valid FlowStatus values', () => {
        expect(FlowStatus.IDLE).toBe('idle');
        expect(FlowStatus.RUNNING).toBe('running');
        expect(FlowStatus.COMPLETE).toBe('complete');
        expect(FlowStatus.ERROR).toBe('error');
        expect(FlowStatus.CANCELLED).toBe('cancelled');
      });

      it('should have correct enum keys', () => {
        const keys = Object.keys(FlowStatus);
        expect(keys).toContain('IDLE');
        expect(keys).toContain('RUNNING');
        expect(keys).toContain('COMPLETE');
        expect(keys).toContain('ERROR');
        expect(keys).toContain('CANCELLED');
      });

      it('should be case-sensitive enum values', () => {
        // Enum values are lowercase strings
        expect(FlowStatus.IDLE).not.toBe('IDLE');
        expect(FlowStatus.IDLE).toBe('idle');
      });
    });

    describe('FlowType Enum', () => {
      it('should accept valid FlowType values', () => {
        expect(FlowType.AUTHORIZATION_CODE_PKCE).toBe('authorization_code_pkce');
        expect(FlowType.CLIENT_CREDENTIALS).toBe('client_credentials');
        expect(FlowType.DEVICE_AUTHORIZATION).toBe('device_authorization');
        expect(FlowType.REFRESH_TOKEN).toBe('refresh_token');
        expect(FlowType.IMPLICIT).toBe('implicit');
        expect(FlowType.RESOURCE_OWNER_PASSWORD).toBe('resource_owner_password');
      });
    });

    describe('StepStatus Enum', () => {
      it('should accept valid StepStatus values', () => {
        expect(StepStatus.PENDING).toBe('pending');
        expect(StepStatus.RUNNING).toBe('running');
        expect(StepStatus.COMPLETE).toBe('complete');
        expect(StepStatus.WARNING).toBe('warning');
        expect(StepStatus.ERROR).toBe('error');
        expect(StepStatus.SKIPPED).toBe('skipped');
      });
    });

    describe('HttpMethod Enum', () => {
      it('should accept valid HttpMethod values', () => {
        expect(HttpMethod.GET).toBe('GET');
        expect(HttpMethod.POST).toBe('POST');
        expect(HttpMethod.PUT).toBe('PUT');
        expect(HttpMethod.PATCH).toBe('PATCH');
        expect(HttpMethod.DELETE).toBe('DELETE');
        expect(HttpMethod.OPTIONS).toBe('OPTIONS');
        expect(HttpMethod.HEAD).toBe('HEAD');
      });

      it('should be uppercase for HTTP methods', () => {
        expect(HttpMethod.GET).not.toBe('get');
        expect(HttpMethod.POST).not.toBe('post');
      });
    });

    // Note: HttpStatusCode enum does not exist in the codebase
    // Status codes are plain numbers in HttpResponse.statusCode field
    // This is intentional per HTTP Response specification
  });

  describe('getStatusCategory() Special Values', () => {
    it('should handle negative numbers (falls back to SERVER_ERROR)', () => {
      // Note: Current implementation returns SERVER_ERROR for all out-of-range values
      expect(getStatusCategory(-1)).toBe(HttpStatusCategory.SERVER_ERROR);
      expect(getStatusCategory(-100)).toBe(HttpStatusCategory.SERVER_ERROR);
      expect(getStatusCategory(-999)).toBe(HttpStatusCategory.SERVER_ERROR);
    });

    it('should handle zero (falls back to SERVER_ERROR)', () => {
      expect(getStatusCategory(0)).toBe(HttpStatusCategory.SERVER_ERROR);
    });

    it('should handle float values (treats as integer part)', () => {
      expect(getStatusCategory(200.5)).toBe(HttpStatusCategory.SUCCESS);
      expect(getStatusCategory(404.7)).toBe(HttpStatusCategory.CLIENT_ERROR);
      expect(getStatusCategory(500.1)).toBe(HttpStatusCategory.SERVER_ERROR);
    });

    it('should handle very large numbers (falls back to SERVER_ERROR)', () => {
      expect(getStatusCategory(10000)).toBe(HttpStatusCategory.SERVER_ERROR);
      expect(getStatusCategory(999999)).toBe(HttpStatusCategory.SERVER_ERROR);
    });

    it('should handle NaN (falls back to SERVER_ERROR)', () => {
      expect(getStatusCategory(NaN)).toBe(HttpStatusCategory.SERVER_ERROR);
    });

    it('should handle Infinity (falls back to SERVER_ERROR)', () => {
      expect(getStatusCategory(Infinity)).toBe(HttpStatusCategory.SERVER_ERROR);
      expect(getStatusCategory(-Infinity)).toBe(HttpStatusCategory.SERVER_ERROR);
    });

    it('should handle valid 1xx status codes', () => {
      expect(getStatusCategory(100)).toBe(HttpStatusCategory.INFORMATIONAL);
      expect(getStatusCategory(101)).toBe(HttpStatusCategory.INFORMATIONAL);
      expect(getStatusCategory(199)).toBe(HttpStatusCategory.INFORMATIONAL);
    });

    it('should handle valid 2xx status codes', () => {
      expect(getStatusCategory(200)).toBe(HttpStatusCategory.SUCCESS);
      expect(getStatusCategory(201)).toBe(HttpStatusCategory.SUCCESS);
      expect(getStatusCategory(204)).toBe(HttpStatusCategory.SUCCESS);
      expect(getStatusCategory(299)).toBe(HttpStatusCategory.SUCCESS);
    });

    it('should handle valid 3xx status codes', () => {
      expect(getStatusCategory(300)).toBe(HttpStatusCategory.REDIRECTION);
      expect(getStatusCategory(301)).toBe(HttpStatusCategory.REDIRECTION);
      expect(getStatusCategory(302)).toBe(HttpStatusCategory.REDIRECTION);
      expect(getStatusCategory(399)).toBe(HttpStatusCategory.REDIRECTION);
    });

    it('should handle valid 4xx status codes', () => {
      expect(getStatusCategory(400)).toBe(HttpStatusCategory.CLIENT_ERROR);
      expect(getStatusCategory(401)).toBe(HttpStatusCategory.CLIENT_ERROR);
      expect(getStatusCategory(404)).toBe(HttpStatusCategory.CLIENT_ERROR);
      expect(getStatusCategory(499)).toBe(HttpStatusCategory.CLIENT_ERROR);
    });

    it('should handle valid 5xx status codes', () => {
      expect(getStatusCategory(500)).toBe(HttpStatusCategory.SERVER_ERROR);
      expect(getStatusCategory(501)).toBe(HttpStatusCategory.SERVER_ERROR);
      expect(getStatusCategory(503)).toBe(HttpStatusCategory.SERVER_ERROR);
      expect(getStatusCategory(599)).toBe(HttpStatusCategory.SERVER_ERROR);
    });

    it('should handle edge of status code ranges', () => {
      expect(getStatusCategory(99)).toBe(HttpStatusCategory.SERVER_ERROR);
      expect(getStatusCategory(100)).toBe(HttpStatusCategory.INFORMATIONAL);
      expect(getStatusCategory(199)).toBe(HttpStatusCategory.INFORMATIONAL);
      expect(getStatusCategory(200)).toBe(HttpStatusCategory.SUCCESS);
      expect(getStatusCategory(299)).toBe(HttpStatusCategory.SUCCESS);
      expect(getStatusCategory(300)).toBe(HttpStatusCategory.REDIRECTION);
      expect(getStatusCategory(399)).toBe(HttpStatusCategory.REDIRECTION);
      expect(getStatusCategory(400)).toBe(HttpStatusCategory.CLIENT_ERROR);
      expect(getStatusCategory(499)).toBe(HttpStatusCategory.CLIENT_ERROR);
      expect(getStatusCategory(500)).toBe(HttpStatusCategory.SERVER_ERROR);
      expect(getStatusCategory(599)).toBe(HttpStatusCategory.SERVER_ERROR);
      expect(getStatusCategory(600)).toBe(HttpStatusCategory.SERVER_ERROR);
    });

    it('should handle uncommon but valid status codes', () => {
      expect(getStatusCategory(418)).toBe(HttpStatusCategory.CLIENT_ERROR); // I'm a teapot
      expect(getStatusCategory(103)).toBe(HttpStatusCategory.INFORMATIONAL); // Early Hints
      expect(getStatusCategory(451)).toBe(HttpStatusCategory.CLIENT_ERROR); // Unavailable For Legal Reasons
    });
  });

  describe('Code Verifier Edge Cases', () => {
    it('should reject 42-character verifier (one below minimum)', () => {
      const tooShort = 'a'.repeat(42);
      expect(() => asCodeVerifier(tooShort)).toThrow();
    });

    it('should accept exactly 43-character verifier (minimum)', () => {
      const minimum = 'a'.repeat(43);
      expect(() => asCodeVerifier(minimum)).not.toThrow();
    });

    it('should accept exactly 128-character verifier (RFC maximum)', () => {
      const maximum = 'a'.repeat(128);
      expect(() => asCodeVerifier(maximum)).not.toThrow();
    });

    it('should accept 129-character verifier (current impl does not enforce max)', () => {
      const overMax = 'a'.repeat(129);
      expect(() => asCodeVerifier(overMax)).not.toThrow();
    });

    it('should accept verifier with all allowed characters', () => {
      const allChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~' + 'a'.repeat(20);
      expect(() => asCodeVerifier(allChars)).not.toThrow();
    });

    it('should accept verifier with only hyphens', () => {
      const onlyHyphens = '-'.repeat(43);
      expect(() => asCodeVerifier(onlyHyphens)).not.toThrow();
    });

    it('should accept verifier with only underscores', () => {
      const onlyUnderscores = '_'.repeat(43);
      expect(() => asCodeVerifier(onlyUnderscores)).not.toThrow();
    });

    it('should accept verifier with only periods', () => {
      const onlyPeriods = '.'.repeat(43);
      expect(() => asCodeVerifier(onlyPeriods)).not.toThrow();
    });

    it('should accept verifier with only tildes', () => {
      const onlyTildes = '~'.repeat(43);
      expect(() => asCodeVerifier(onlyTildes)).not.toThrow();
    });
  });

  describe('Null and Undefined Handling', () => {
    it('should handle null by throwing TypeError for asCodeVerifier', () => {
      // TypeScript would catch this, but test runtime behavior
      expect(() => asCodeVerifier(null as any)).toThrow();
    });

    it('should handle undefined by throwing TypeError for asCodeVerifier', () => {
      expect(() => asCodeVerifier(undefined as any)).toThrow();
    });

    // Note: Other as*() functions are type casts (identity functions) that don't validate/convert
    // They pass through null/undefined as-is
    it('should pass through null for non-validating functions', () => {
      // This documents current behavior - branded types are simple type casts
      const result = asClientId(null as any);
      expect(result).toBe(null);
    });

    it('should pass through undefined for non-validating functions', () => {
      const result = asUserId(undefined as any);
      expect(result).toBe(undefined);
    });
  });
});
