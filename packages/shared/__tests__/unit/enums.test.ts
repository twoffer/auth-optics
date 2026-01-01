/**
 * Functional Tests: Enum Values
 *
 * Priority 1: Verify all enum values match specifications
 *
 * Coverage:
 * - FlowType enum (6 values)
 * - FlowStatus enum (5 values)
 * - StepStatus enum (6 values)
 * - HttpMethod enum (7 values)
 * - HttpStatusCategory enum (5 values)
 *
 * Framework: Vitest
 */

import { describe, it, expect } from 'vitest';
import { FlowType, FlowStatus } from '@/flows/flow-types';
import { StepStatus } from '@/flows/flow-steps';
import { HttpMethod } from '@/http/request';
import { HttpStatusCategory } from '@/http/response';

describe('Enum Values Verification', () => {
  describe('FlowType Enum', () => {
    it('should have AUTHORIZATION_CODE_PKCE = "authorization_code_pkce"', () => {
      expect(FlowType.AUTHORIZATION_CODE_PKCE).toBe('authorization_code_pkce');
    });

    it('should have CLIENT_CREDENTIALS = "client_credentials"', () => {
      expect(FlowType.CLIENT_CREDENTIALS).toBe('client_credentials');
    });

    it('should have DEVICE_AUTHORIZATION = "device_authorization"', () => {
      expect(FlowType.DEVICE_AUTHORIZATION).toBe('device_authorization');
    });

    it('should have REFRESH_TOKEN = "refresh_token"', () => {
      expect(FlowType.REFRESH_TOKEN).toBe('refresh_token');
    });

    it('should have IMPLICIT = "implicit"', () => {
      expect(FlowType.IMPLICIT).toBe('implicit');
    });

    it('should have RESOURCE_OWNER_PASSWORD = "resource_owner_password"', () => {
      expect(FlowType.RESOURCE_OWNER_PASSWORD).toBe('resource_owner_password');
    });

    it('should have exactly 6 values', () => {
      const values = Object.values(FlowType);
      expect(values).toHaveLength(6);
    });

    it('should have all expected flow types', () => {
      const values = Object.values(FlowType);
      expect(values).toContain('authorization_code_pkce');
      expect(values).toContain('client_credentials');
      expect(values).toContain('device_authorization');
      expect(values).toContain('refresh_token');
      expect(values).toContain('implicit');
      expect(values).toContain('resource_owner_password');
    });
  });

  describe('FlowStatus Enum', () => {
    it('should have IDLE = "idle"', () => {
      expect(FlowStatus.IDLE).toBe('idle');
    });

    it('should have RUNNING = "running"', () => {
      expect(FlowStatus.RUNNING).toBe('running');
    });

    it('should have COMPLETE = "complete"', () => {
      expect(FlowStatus.COMPLETE).toBe('complete');
    });

    it('should have ERROR = "error"', () => {
      expect(FlowStatus.ERROR).toBe('error');
    });

    it('should have CANCELLED = "cancelled"', () => {
      expect(FlowStatus.CANCELLED).toBe('cancelled');
    });

    it('should have exactly 5 values', () => {
      const values = Object.values(FlowStatus);
      expect(values).toHaveLength(5);
    });

    it('should have all expected statuses', () => {
      const values = Object.values(FlowStatus);
      expect(values).toContain('idle');
      expect(values).toContain('running');
      expect(values).toContain('complete');
      expect(values).toContain('error');
      expect(values).toContain('cancelled');
    });
  });

  describe('StepStatus Enum', () => {
    it('should have PENDING = "pending"', () => {
      expect(StepStatus.PENDING).toBe('pending');
    });

    it('should have RUNNING = "running"', () => {
      expect(StepStatus.RUNNING).toBe('running');
    });

    it('should have COMPLETE = "complete"', () => {
      expect(StepStatus.COMPLETE).toBe('complete');
    });

    it('should have WARNING = "warning"', () => {
      expect(StepStatus.WARNING).toBe('warning');
    });

    it('should have ERROR = "error"', () => {
      expect(StepStatus.ERROR).toBe('error');
    });

    it('should have SKIPPED = "skipped"', () => {
      expect(StepStatus.SKIPPED).toBe('skipped');
    });

    it('should have exactly 6 values', () => {
      const values = Object.values(StepStatus);
      expect(values).toHaveLength(6);
    });

    it('should have all expected statuses', () => {
      const values = Object.values(StepStatus);
      expect(values).toContain('pending');
      expect(values).toContain('running');
      expect(values).toContain('complete');
      expect(values).toContain('warning');
      expect(values).toContain('error');
      expect(values).toContain('skipped');
    });
  });

  describe('HttpMethod Enum', () => {
    it('should have GET = "GET"', () => {
      expect(HttpMethod.GET).toBe('GET');
    });

    it('should have POST = "POST"', () => {
      expect(HttpMethod.POST).toBe('POST');
    });

    it('should have PUT = "PUT"', () => {
      expect(HttpMethod.PUT).toBe('PUT');
    });

    it('should have PATCH = "PATCH"', () => {
      expect(HttpMethod.PATCH).toBe('PATCH');
    });

    it('should have DELETE = "DELETE"', () => {
      expect(HttpMethod.DELETE).toBe('DELETE');
    });

    it('should have OPTIONS = "OPTIONS"', () => {
      expect(HttpMethod.OPTIONS).toBe('OPTIONS');
    });

    it('should have HEAD = "HEAD"', () => {
      expect(HttpMethod.HEAD).toBe('HEAD');
    });

    it('should have exactly 7 values', () => {
      const values = Object.values(HttpMethod);
      expect(values).toHaveLength(7);
    });

    it('should have all expected HTTP methods', () => {
      const values = Object.values(HttpMethod);
      expect(values).toContain('GET');
      expect(values).toContain('POST');
      expect(values).toContain('PUT');
      expect(values).toContain('PATCH');
      expect(values).toContain('DELETE');
      expect(values).toContain('OPTIONS');
      expect(values).toContain('HEAD');
    });

    it('should only have uppercase method names', () => {
      const values = Object.values(HttpMethod);
      values.forEach((method) => {
        expect(method).toBe(method.toUpperCase());
      });
    });
  });

  describe('HttpStatusCategory Enum', () => {
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

    it('should have exactly 5 values', () => {
      const values = Object.values(HttpStatusCategory);
      expect(values).toHaveLength(5);
    });

    it('should have all expected categories', () => {
      const values = Object.values(HttpStatusCategory);
      expect(values).toContain('1xx');
      expect(values).toContain('2xx');
      expect(values).toContain('3xx');
      expect(values).toContain('4xx');
      expect(values).toContain('5xx');
    });

    it('should follow "Nxx" pattern', () => {
      const values = Object.values(HttpStatusCategory);
      values.forEach((category) => {
        expect(category).toMatch(/^[1-5]xx$/);
      });
    });
  });
});
