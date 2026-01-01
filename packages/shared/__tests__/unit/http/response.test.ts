/**
 * Functional Tests: HTTP Response Types
 *
 * Priority 1: getStatusCategory() function tests
 *
 * Coverage:
 * - All 5 HTTP status categories (1xx, 2xx, 3xx, 4xx, 5xx)
 * - Boundary values
 * - Edge cases (invalid status codes)
 *
 * Framework: Vitest
 */

import { describe, it, expect } from 'vitest';
import { getStatusCategory, HttpStatusCategory } from '@/http/response';

describe('HTTP Response Functions', () => {
  describe('getStatusCategory()', () => {
    describe('1xx Informational Responses', () => {
      it('should categorize 100 as INFORMATIONAL', () => {
        expect(getStatusCategory(100)).toBe(HttpStatusCategory.INFORMATIONAL);
      });

      it('should categorize 101 as INFORMATIONAL', () => {
        expect(getStatusCategory(101)).toBe(HttpStatusCategory.INFORMATIONAL);
      });

      it('should categorize 103 as INFORMATIONAL', () => {
        expect(getStatusCategory(103)).toBe(HttpStatusCategory.INFORMATIONAL);
      });

      it('should categorize 199 as INFORMATIONAL (boundary)', () => {
        expect(getStatusCategory(199)).toBe(HttpStatusCategory.INFORMATIONAL);
      });
    });

    describe('2xx Success Responses', () => {
      it('should categorize 200 as SUCCESS', () => {
        expect(getStatusCategory(200)).toBe(HttpStatusCategory.SUCCESS);
      });

      it('should categorize 201 as SUCCESS', () => {
        expect(getStatusCategory(201)).toBe(HttpStatusCategory.SUCCESS);
      });

      it('should categorize 204 as SUCCESS', () => {
        expect(getStatusCategory(204)).toBe(HttpStatusCategory.SUCCESS);
      });

      it('should categorize 206 as SUCCESS', () => {
        expect(getStatusCategory(206)).toBe(HttpStatusCategory.SUCCESS);
      });

      it('should categorize 299 as SUCCESS (boundary)', () => {
        expect(getStatusCategory(299)).toBe(HttpStatusCategory.SUCCESS);
      });
    });

    describe('3xx Redirection Responses', () => {
      it('should categorize 300 as REDIRECTION', () => {
        expect(getStatusCategory(300)).toBe(HttpStatusCategory.REDIRECTION);
      });

      it('should categorize 301 as REDIRECTION', () => {
        expect(getStatusCategory(301)).toBe(HttpStatusCategory.REDIRECTION);
      });

      it('should categorize 302 as REDIRECTION', () => {
        expect(getStatusCategory(302)).toBe(HttpStatusCategory.REDIRECTION);
      });

      it('should categorize 304 as REDIRECTION', () => {
        expect(getStatusCategory(304)).toBe(HttpStatusCategory.REDIRECTION);
      });

      it('should categorize 307 as REDIRECTION', () => {
        expect(getStatusCategory(307)).toBe(HttpStatusCategory.REDIRECTION);
      });

      it('should categorize 308 as REDIRECTION', () => {
        expect(getStatusCategory(308)).toBe(HttpStatusCategory.REDIRECTION);
      });

      it('should categorize 399 as REDIRECTION (boundary)', () => {
        expect(getStatusCategory(399)).toBe(HttpStatusCategory.REDIRECTION);
      });
    });

    describe('4xx Client Error Responses', () => {
      it('should categorize 400 as CLIENT_ERROR', () => {
        expect(getStatusCategory(400)).toBe(HttpStatusCategory.CLIENT_ERROR);
      });

      it('should categorize 401 as CLIENT_ERROR', () => {
        expect(getStatusCategory(401)).toBe(HttpStatusCategory.CLIENT_ERROR);
      });

      it('should categorize 403 as CLIENT_ERROR', () => {
        expect(getStatusCategory(403)).toBe(HttpStatusCategory.CLIENT_ERROR);
      });

      it('should categorize 404 as CLIENT_ERROR', () => {
        expect(getStatusCategory(404)).toBe(HttpStatusCategory.CLIENT_ERROR);
      });

      it('should categorize 429 as CLIENT_ERROR', () => {
        expect(getStatusCategory(429)).toBe(HttpStatusCategory.CLIENT_ERROR);
      });

      it('should categorize 499 as CLIENT_ERROR (boundary)', () => {
        expect(getStatusCategory(499)).toBe(HttpStatusCategory.CLIENT_ERROR);
      });
    });

    describe('5xx Server Error Responses', () => {
      it('should categorize 500 as SERVER_ERROR', () => {
        expect(getStatusCategory(500)).toBe(HttpStatusCategory.SERVER_ERROR);
      });

      it('should categorize 501 as SERVER_ERROR', () => {
        expect(getStatusCategory(501)).toBe(HttpStatusCategory.SERVER_ERROR);
      });

      it('should categorize 502 as SERVER_ERROR', () => {
        expect(getStatusCategory(502)).toBe(HttpStatusCategory.SERVER_ERROR);
      });

      it('should categorize 503 as SERVER_ERROR', () => {
        expect(getStatusCategory(503)).toBe(HttpStatusCategory.SERVER_ERROR);
      });

      it('should categorize 504 as SERVER_ERROR', () => {
        expect(getStatusCategory(504)).toBe(HttpStatusCategory.SERVER_ERROR);
      });

      it('should categorize 599 as SERVER_ERROR', () => {
        expect(getStatusCategory(599)).toBe(HttpStatusCategory.SERVER_ERROR);
      });

      it('should categorize 600 as SERVER_ERROR (above standard range)', () => {
        expect(getStatusCategory(600)).toBe(HttpStatusCategory.SERVER_ERROR);
      });

      it('should categorize 999 as SERVER_ERROR (very high)', () => {
        expect(getStatusCategory(999)).toBe(HttpStatusCategory.SERVER_ERROR);
      });
    });

    describe('Edge Cases', () => {
      it('should categorize 0 as SERVER_ERROR (invalid status)', () => {
        expect(getStatusCategory(0)).toBe(HttpStatusCategory.SERVER_ERROR);
      });

      it('should categorize -1 as SERVER_ERROR (negative)', () => {
        expect(getStatusCategory(-1)).toBe(HttpStatusCategory.SERVER_ERROR);
      });

      it('should categorize 99 as SERVER_ERROR (below 100)', () => {
        expect(getStatusCategory(99)).toBe(HttpStatusCategory.SERVER_ERROR);
      });

      it('should categorize 1000 as SERVER_ERROR (very large)', () => {
        expect(getStatusCategory(1000)).toBe(HttpStatusCategory.SERVER_ERROR);
      });
    });

    describe('Boundary Values', () => {
      it('should have boundary at 100 (99 vs 100)', () => {
        expect(getStatusCategory(99)).toBe(HttpStatusCategory.SERVER_ERROR);
        expect(getStatusCategory(100)).toBe(HttpStatusCategory.INFORMATIONAL);
      });

      it('should have boundary at 200 (199 vs 200)', () => {
        expect(getStatusCategory(199)).toBe(HttpStatusCategory.INFORMATIONAL);
        expect(getStatusCategory(200)).toBe(HttpStatusCategory.SUCCESS);
      });

      it('should have boundary at 300 (299 vs 300)', () => {
        expect(getStatusCategory(299)).toBe(HttpStatusCategory.SUCCESS);
        expect(getStatusCategory(300)).toBe(HttpStatusCategory.REDIRECTION);
      });

      it('should have boundary at 400 (399 vs 400)', () => {
        expect(getStatusCategory(399)).toBe(HttpStatusCategory.REDIRECTION);
        expect(getStatusCategory(400)).toBe(HttpStatusCategory.CLIENT_ERROR);
      });

      it('should have boundary at 500 (499 vs 500)', () => {
        expect(getStatusCategory(499)).toBe(HttpStatusCategory.CLIENT_ERROR);
        expect(getStatusCategory(500)).toBe(HttpStatusCategory.SERVER_ERROR);
      });
    });
  });

  describe('HttpStatusCategory Enum Values', () => {
    it('should have INFORMATIONAL = "1xx"', () => {
      expect(HttpStatusCategory.INFORMATIONAL).toBe('1xx');
    });

    it('should have SUCCESS = "2xx"', () => {
      expect(HttpStatusCategory.SUCCESS).toBe('2xx');
    });

    it('should have REDIRECTION = "3xx"', () => {
      expect(HttpStatusCategory.REDIRECTION).toBe('3xx');
    });

    it('should have CLIENT_ERROR = "4xx"', () => {
      expect(HttpStatusCategory.CLIENT_ERROR).toBe('4xx');
    });

    it('should have SERVER_ERROR = "5xx"', () => {
      expect(HttpStatusCategory.SERVER_ERROR).toBe('5xx');
    });

    it('should have exactly 5 enum values', () => {
      const values = Object.values(HttpStatusCategory);
      expect(values).toHaveLength(5);
    });
  });
});
