/**
 * Functional Tests: Interface Object Creation
 *
 * Priority 1: Verify interfaces can be used to create valid objects
 *
 * Coverage:
 * - FlowExecution objects (required/optional fields)
 * - JWT objects
 * - AccessToken objects
 * - HttpRequest/HttpResponse objects
 * - TypeScript type satisfaction
 *
 * Framework: Vitest
 */

import { describe, it, expect } from 'vitest';
import type { FlowExecution } from '@/flows/flow-types';
import { FlowType, FlowStatus } from '@/flows/flow-types';
import type { FlowStep } from '@/flows/flow-steps';
import { StepStatus } from '@/flows/flow-steps';
import type { JWT, JWTHeader, JWTPayload } from '@/tokens/jwt';
import type { AccessToken } from '@/tokens/access-token';
import type { HttpRequest } from '@/http/request';
import { HttpMethod } from '@/http/request';
import type { HttpResponse } from '@/http/response';
import { asFlowId, asUserId, asIssuerURL } from '@/utils/branded-types';

describe('Interface Object Creation Tests', () => {
  describe('FlowExecution Objects', () => {
    it('should create valid FlowExecution with required fields only', () => {
      const flow: FlowExecution = {
        id: asFlowId('flow-550e8400-e29b-41d4-a716-446655440000'),
        flowType: FlowType.AUTHORIZATION_CODE_PKCE,
        status: FlowStatus.IDLE,
        startedAt: '2025-12-30T10:30:00.000Z',
        steps: [],
        config: {
          client: {},
          server: {},
        },
      };

      expect(flow.id).toBe('flow-550e8400-e29b-41d4-a716-446655440000');
      expect(flow.flowType).toBe('authorization_code_pkce');
      expect(flow.status).toBe('idle');
      expect(flow.startedAt).toBe('2025-12-30T10:30:00.000Z');
      expect(flow.steps).toEqual([]);
    });

    it('should create valid FlowExecution with all fields', () => {
      const flow: FlowExecution = {
        id: asFlowId('flow-123'),
        flowType: FlowType.CLIENT_CREDENTIALS,
        status: FlowStatus.COMPLETE,
        startedAt: '2025-12-30T10:30:00.000Z',
        completedAt: '2025-12-30T10:30:05.500Z',
        steps: [],
        tokens: {
          accessToken: 'eyJhbGc...',
          tokenType: 'Bearer',
          expiresIn: 3600,
        },
        config: {
          client: {},
          server: {},
        },
        duration: 5500,
      };

      expect(flow.id).toBe('flow-123');
      expect(flow.status).toBe('complete');
      expect(flow.completedAt).toBe('2025-12-30T10:30:05.500Z');
      expect(flow.tokens?.accessToken).toBe('eyJhbGc...');
      expect(flow.duration).toBe(5500);
    });

    it('should create FlowExecution with error information', () => {
      const flow: FlowExecution = {
        id: asFlowId('flow-error'),
        flowType: FlowType.AUTHORIZATION_CODE_PKCE,
        status: FlowStatus.ERROR,
        startedAt: '2025-12-30T10:30:00.000Z',
        completedAt: '2025-12-30T10:30:02.000Z',
        steps: [],
        error: {
          error: 'invalid_grant',
          errorDescription: 'Authorization code expired',
          step: 2,
        },
        config: {
          client: {},
          server: {},
        },
      };

      expect(flow.status).toBe('error');
      expect(flow.error?.error).toBe('invalid_grant');
      expect(flow.error?.errorDescription).toBe('Authorization code expired');
      expect(flow.error?.step).toBe(2);
    });

    it('should allow mutable status field', () => {
      const flow: FlowExecution = {
        id: asFlowId('flow-mutable'),
        flowType: FlowType.AUTHORIZATION_CODE_PKCE,
        status: FlowStatus.IDLE,
        startedAt: '2025-12-30T10:30:00.000Z',
        steps: [],
        config: {
          client: {},
          server: {},
        },
      };

      expect(flow.status).toBe('idle');
      flow.status = FlowStatus.RUNNING;
      expect(flow.status).toBe('running');
      flow.status = FlowStatus.COMPLETE;
      expect(flow.status).toBe('complete');
    });

    it('should create FlowExecution with all FlowType values', () => {
      const flowTypes: FlowType[] = [
        FlowType.AUTHORIZATION_CODE_PKCE,
        FlowType.CLIENT_CREDENTIALS,
        FlowType.DEVICE_AUTHORIZATION,
        FlowType.REFRESH_TOKEN,
        FlowType.IMPLICIT,
        FlowType.RESOURCE_OWNER_PASSWORD,
      ];

      flowTypes.forEach((flowType, index) => {
        const flow: FlowExecution = {
          id: asFlowId(`flow-${index}`),
          flowType,
          status: FlowStatus.IDLE,
          startedAt: '2025-12-30T10:30:00.000Z',
          steps: [],
          config: {
            client: {},
            server: {},
          },
        };

        expect(flow.flowType).toBe(flowType);
      });
    });
  });

  describe('FlowStep Objects', () => {
    it('should create valid FlowStep with required fields', () => {
      const step: FlowStep = {
        stepNumber: 1,
        name: 'Authorization Request',
        description: 'Build and send authorization request',
        status: StepStatus.PENDING,
      };

      expect(step.stepNumber).toBe(1);
      expect(step.name).toBe('Authorization Request');
      expect(step.description).toBe('Build and send authorization request');
      expect(step.status).toBe('pending');
    });

    it('should create FlowStep with all fields', () => {
      const step: FlowStep = {
        stepNumber: 2,
        name: 'Token Request',
        description: 'Exchange code for tokens',
        status: StepStatus.COMPLETE,
        startedAt: '2025-12-30T10:30:00.000Z',
        completedAt: '2025-12-30T10:30:01.500Z',
        duration: 1500,
        metadata: {
          isUserInteractive: false,
          isExternalRedirect: false,
        },
      };

      expect(step.stepNumber).toBe(2);
      expect(step.status).toBe('complete');
      expect(step.duration).toBe(1500);
      expect(step.metadata?.isUserInteractive).toBe(false);
    });

    it('should allow mutable status field', () => {
      const step: FlowStep = {
        stepNumber: 1,
        name: 'Test Step',
        description: 'Test',
        status: StepStatus.PENDING,
      };

      expect(step.status).toBe('pending');
      step.status = StepStatus.RUNNING;
      expect(step.status).toBe('running');
      step.status = StepStatus.COMPLETE;
      expect(step.status).toBe('complete');
    });
  });

  describe('JWT Objects', () => {
    it('should create valid JWT with required fields', () => {
      const jwt: JWT = {
        raw: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature',
        header: {
          alg: 'RS256',
        },
        payload: {},
        signature: 'signature',
      };

      expect(jwt.raw).toContain('eyJhbGc');
      expect(jwt.header.alg).toBe('RS256');
      expect(jwt.payload).toEqual({});
      expect(jwt.signature).toBe('signature');
    });

    it('should create JWT with complete header', () => {
      const header: JWTHeader = {
        alg: 'RS256',
        typ: 'JWT',
        kid: 'key-2021-05-01',
      };

      expect(header.alg).toBe('RS256');
      expect(header.typ).toBe('JWT');
      expect(header.kid).toBe('key-2021-05-01');
    });

    it('should create JWT with complete payload', () => {
      const payload: JWTPayload = {
        iss: asIssuerURL('https://auth.example.com'),
        sub: asUserId('user-123'),
        aud: 'client-id',
        exp: 1704009600,
        iat: 1704006000,
        jti: 'jwt-550e8400-e29b-41d4-a716-446655440000',
      };

      expect(payload.iss).toBe('https://auth.example.com');
      expect(payload.sub).toBe('user-123');
      expect(payload.aud).toBe('client-id');
      expect(payload.exp).toBe(1704009600);
      expect(payload.iat).toBe(1704006000);
      expect(payload.jti).toBe('jwt-550e8400-e29b-41d4-a716-446655440000');
    });

    it('should create JWT payload with array audience', () => {
      const payload: JWTPayload = {
        aud: ['https://api.example.com', 'https://api2.example.com'],
      };

      expect(payload.aud).toBeInstanceOf(Array);
      expect(payload.aud).toHaveLength(2);
    });

    it('should create JWT payload with custom claims', () => {
      const payload: JWTPayload = {
        iss: asIssuerURL('https://auth.example.com'),
        sub: asUserId('user-123'),
        customClaim: 'customValue',
        nestedClaim: {
          foo: 'bar',
        },
      };

      expect(payload.customClaim).toBe('customValue');
      expect(payload.nestedClaim).toEqual({ foo: 'bar' });
    });
  });

  describe('AccessToken Objects', () => {
    it('should create JWT access token', () => {
      const accessToken: AccessToken = {
        token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
        tokenType: 'Bearer',
        isJWT: true,
        payload: {
          iss: asIssuerURL('https://auth.example.com'),
          sub: asUserId('user-123'),
          aud: 'https://api.example.com',
          exp: 1704009600,
          iat: 1704006000,
        },
        expiresIn: 3600,
        scopes: ['openid', 'profile', 'email'],
      };

      expect(accessToken.isJWT).toBe(true);
      expect(accessToken.tokenType).toBe('Bearer');
      expect(accessToken.payload?.iss).toBe('https://auth.example.com');
      expect(accessToken.expiresIn).toBe(3600);
      expect(accessToken.scopes).toHaveLength(3);
    });

    it('should create opaque access token', () => {
      const accessToken: AccessToken = {
        token: 'opaque-token-abc123xyz',
        tokenType: 'Bearer',
        isJWT: false,
        expiresIn: 3600,
        scopes: ['openid', 'profile'],
      };

      expect(accessToken.isJWT).toBe(false);
      expect(accessToken.payload).toBeUndefined();
      expect(accessToken.token).toBe('opaque-token-abc123xyz');
    });

    it('should create access token with metadata', () => {
      const accessToken: AccessToken = {
        token: 'eyJhbGc...',
        tokenType: 'Bearer',
        isJWT: true,
        expiresIn: 3600,
        metadata: {
          isValid: true,
          timeRemaining: 3500000,
        },
      };

      expect(accessToken.metadata?.isValid).toBe(true);
      expect(accessToken.metadata?.timeRemaining).toBe(3500000);
    });

    it('should create access token with expiresAt timestamp', () => {
      const expiresAt = 1704009600;
      const accessToken: AccessToken = {
        token: 'eyJhbGc...',
        tokenType: 'Bearer',
        isJWT: true,
        expiresAt,
      };

      expect(accessToken.expiresAt).toBe(1704009600);
    });
  });

  describe('HttpRequest Objects', () => {
    it('should create valid HttpRequest', () => {
      const request: HttpRequest = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        method: HttpMethod.POST,
        url: 'https://auth.example.com/token',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        sentAt: '2025-12-30T10:30:00.000Z',
      };

      expect(request.method).toBe('POST');
      expect(request.url).toBe('https://auth.example.com/token');
      expect(request.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
      expect(request.sentAt).toBe('2025-12-30T10:30:00.000Z');
    });

    it('should create HttpRequest with form body', () => {
      const request: HttpRequest = {
        id: 'req-123',
        method: HttpMethod.POST,
        url: 'https://auth.example.com/token',
        headers: {},
        sentAt: '2025-12-30T10:30:00.000Z',
        body: {
          type: 'form',
          parameters: {
            grant_type: 'authorization_code',
            code: 'SplxlOBeZQQYbYS6WxSbIA',
          },
          raw: 'grant_type=authorization_code&code=SplxlOBeZQQYbYS6WxSbIA',
        },
      };

      expect(request.body?.type).toBe('form');
      if (request.body?.type === 'form') {
        expect(request.body.parameters.grant_type).toBe('authorization_code');
      }
    });

    it('should create HttpRequest with JSON body', () => {
      const request: HttpRequest = {
        id: 'req-456',
        method: HttpMethod.POST,
        url: 'https://api.example.com/users',
        headers: {
          'Content-Type': 'application/json',
        },
        sentAt: '2025-12-30T10:30:00.000Z',
        body: {
          type: 'json',
          data: { username: 'john.doe' },
          raw: '{"username":"john.doe"}',
        },
      };

      expect(request.body?.type).toBe('json');
      if (request.body?.type === 'json') {
        expect(request.body.data).toEqual({ username: 'john.doe' });
      }
    });

    it('should create HttpRequest for all HTTP methods', () => {
      const methods: HttpMethod[] = [
        HttpMethod.GET,
        HttpMethod.POST,
        HttpMethod.PUT,
        HttpMethod.PATCH,
        HttpMethod.DELETE,
        HttpMethod.OPTIONS,
        HttpMethod.HEAD,
      ];

      methods.forEach((method) => {
        const request: HttpRequest = {
          id: `req-${method}`,
          method,
          url: 'https://api.example.com/resource',
          headers: {},
          sentAt: '2025-12-30T10:30:00.000Z',
        };

        expect(request.method).toBe(method);
      });
    });
  });

  describe('HttpResponse Objects', () => {
    it('should create valid HttpResponse', () => {
      const response: HttpResponse = {
        id: 'res-550e8400-e29b-41d4-a716-446655440000',
        requestId: 'req-550e8400-e29b-41d4-a716-446655440000',
        statusCode: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/json',
        },
        receivedAt: '2025-12-30T10:30:01.500Z',
      };

      expect(response.statusCode).toBe(200);
      expect(response.statusText).toBe('OK');
      expect(response.headers['Content-Type']).toBe('application/json');
      expect(response.receivedAt).toBe('2025-12-30T10:30:01.500Z');
    });

    it('should create HttpResponse with JSON body', () => {
      const response: HttpResponse = {
        id: 'res-123',
        requestId: 'req-123',
        statusCode: 200,
        statusText: 'OK',
        headers: {},
        receivedAt: '2025-12-30T10:30:01.500Z',
        body: {
          type: 'json',
          data: {
            access_token: 'eyJhbGc...',
            token_type: 'Bearer',
            expires_in: 3600,
          },
          raw: '{"access_token":"eyJhbGc...","token_type":"Bearer","expires_in":3600}',
        },
      };

      expect(response.body?.type).toBe('json');
      if (response.body?.type === 'json') {
        const data = response.body.data as Record<string, unknown>;
        expect(data.access_token).toBe('eyJhbGc...');
      }
    });

    it('should create HttpResponse with HTML body', () => {
      const response: HttpResponse = {
        id: 'res-456',
        requestId: 'req-456',
        statusCode: 200,
        statusText: 'OK',
        headers: {},
        receivedAt: '2025-12-30T10:30:01.500Z',
        body: {
          type: 'html',
          html: '<!DOCTYPE html><html>...</html>',
        },
      };

      expect(response.body?.type).toBe('html');
      if (response.body?.type === 'html') {
        expect(response.body.html).toContain('<!DOCTYPE html>');
      }
    });

    it('should create HttpResponse with size', () => {
      const response: HttpResponse = {
        id: 'res-789',
        requestId: 'req-789',
        statusCode: 200,
        statusText: 'OK',
        headers: {},
        receivedAt: '2025-12-30T10:30:01.500Z',
        size: 512,
      };

      expect(response.size).toBe(512);
    });

    it('should create error HttpResponse', () => {
      const response: HttpResponse = {
        id: 'res-error',
        requestId: 'req-error',
        statusCode: 400,
        statusText: 'Bad Request',
        headers: {},
        receivedAt: '2025-12-30T10:30:01.500Z',
        body: {
          type: 'json',
          data: {
            error: 'invalid_request',
            error_description: 'Missing required parameter',
          },
          raw: '{"error":"invalid_request","error_description":"Missing required parameter"}',
        },
      };

      expect(response.statusCode).toBe(400);
      expect(response.statusText).toBe('Bad Request');
      if (response.body?.type === 'json') {
        const data = response.body.data as Record<string, unknown>;
        expect(data.error).toBe('invalid_request');
      }
    });
  });
});
