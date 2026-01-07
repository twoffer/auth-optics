/**
 * Configuration Types Test Suite
 *
 * Tests for client, server, and application configuration types.
 * Covers RFC 6749 and OAuth 2.1 compliance.
 */

import { describe, it, expect } from 'vitest';
import {
  ClientConfig,
  ServerConfig,
  AppConfig,
  ResponseType,
  GrantType,
  CodeChallengeMethod,
  isConfidentialClient,
  isPublicClient,
  validateClientConfig
} from '../../src/config';

describe('Configuration Types - Day 2', () => {
  describe('ResponseType Enum', () => {
    it('should define CODE response type', () => {
      expect(ResponseType.CODE).toBe('code');
    });

    it('should define TOKEN response type', () => {
      expect(ResponseType.TOKEN).toBe('token');
    });

    it('should define ID_TOKEN response type', () => {
      expect(ResponseType.ID_TOKEN).toBe('id_token');
    });
  });

  describe('GrantType Enum', () => {
    it('should define AUTHORIZATION_CODE grant type', () => {
      expect(GrantType.AUTHORIZATION_CODE).toBe('authorization_code');
    });

    it('should define CLIENT_CREDENTIALS grant type', () => {
      expect(GrantType.CLIENT_CREDENTIALS).toBe('client_credentials');
    });

    it('should define DEVICE_CODE grant type', () => {
      expect(GrantType.DEVICE_CODE).toBe('device_code');
    });

    it('should define REFRESH_TOKEN grant type', () => {
      expect(GrantType.REFRESH_TOKEN).toBe('refresh_token');
    });

    it('should define PASSWORD grant type', () => {
      expect(GrantType.PASSWORD).toBe('password');
    });
  });

  describe('CodeChallengeMethod Enum', () => {
    it('should define S256 code challenge method', () => {
      expect(CodeChallengeMethod.S256).toBe('S256');
    });

    it('should define PLAIN code challenge method', () => {
      expect(CodeChallengeMethod.PLAIN).toBe('plain');
    });
  });

  describe('ClientConfig Interface', () => {
    it('should accept valid public client config', () => {
      const config: ClientConfig = {
        clientId: 'my-spa-client',
        redirectUri: 'http://localhost:3000/callback',
        responseType: ResponseType.CODE,
        scope: ['openid', 'profile', 'email'],
        grantType: GrantType.AUTHORIZATION_CODE,
        usePKCE: true,
        useState: true,
        useNonce: true,
        codeChallengeMethod: CodeChallengeMethod.S256,
      };

      expect(config.clientId).toBe('my-spa-client');
      expect(config.redirectUri).toBe('http://localhost:3000/callback');
      expect(config.scope).toContain('openid');
      expect(config.usePKCE).toBe(true);
    });

    it('should accept valid confidential client config', () => {
      const config: ClientConfig = {
        clientId: 'web-app-client',
        clientSecret: 'super-secret-value',
        redirectUri: 'https://example.com/callback',
        responseType: ResponseType.CODE,
        scope: ['openid', 'profile'],
        grantType: GrantType.AUTHORIZATION_CODE,
        usePKCE: true,
        codeChallengeMethod: CodeChallengeMethod.S256,
      };

      expect(config.clientSecret).toBe('super-secret-value');
      expect(config.clientSecret).toBeDefined();
    });

    it('should allow optional audience field', () => {
      const config: ClientConfig = {
        clientId: 'api-client',
        audience: 'https://api.example.com',
        redirectUri: 'http://localhost:3000/callback',
        responseType: ResponseType.CODE,
        scope: ['api'],
        grantType: GrantType.AUTHORIZATION_CODE,
        usePKCE: true,
        codeChallengeMethod: CodeChallengeMethod.S256,
      };

      expect(config.audience).toBe('https://api.example.com');
    });

    it('should allow optional state parameter flag', () => {
      const config: ClientConfig = {
        clientId: 'test-client',
        redirectUri: 'http://localhost:3000/callback',
        responseType: ResponseType.CODE,
        scope: ['openid'],
        grantType: GrantType.AUTHORIZATION_CODE,
        usePKCE: true,
        useState: false,
        codeChallengeMethod: CodeChallengeMethod.S256,
      };

      expect(config.useState).toBe(false);
    });

    it('should allow optional nonce parameter flag', () => {
      const config: ClientConfig = {
        clientId: 'test-client',
        redirectUri: 'http://localhost:3000/callback',
        responseType: ResponseType.CODE,
        scope: ['openid'],
        grantType: GrantType.AUTHORIZATION_CODE,
        usePKCE: true,
        useNonce: true,
        codeChallengeMethod: CodeChallengeMethod.S256,
      };

      expect(config.useNonce).toBe(true);
    });
  });

  describe('isConfidentialClient Function', () => {
    it('should return true for client with secret', () => {
      const config: ClientConfig = {
        clientId: 'web-app',
        clientSecret: 'secret123',
        redirectUri: 'http://localhost/callback',
        responseType: ResponseType.CODE,
        scope: ['openid'],
        grantType: GrantType.AUTHORIZATION_CODE,
        usePKCE: true,
        codeChallengeMethod: CodeChallengeMethod.S256,
      };

      expect(isConfidentialClient(config)).toBe(true);
    });

    it('should return false for client without secret', () => {
      const config: ClientConfig = {
        clientId: 'spa-client',
        redirectUri: 'http://localhost/callback',
        responseType: ResponseType.CODE,
        scope: ['openid'],
        grantType: GrantType.AUTHORIZATION_CODE,
        usePKCE: true,
        codeChallengeMethod: CodeChallengeMethod.S256,
      };

      expect(isConfidentialClient(config)).toBe(false);
    });

    it('should return false for client with empty secret', () => {
      const config: ClientConfig = {
        clientId: 'spa-client',
        clientSecret: '',
        redirectUri: 'http://localhost/callback',
        responseType: ResponseType.CODE,
        scope: ['openid'],
        grantType: GrantType.AUTHORIZATION_CODE,
        usePKCE: true,
        codeChallengeMethod: CodeChallengeMethod.S256,
      };

      expect(isConfidentialClient(config)).toBe(false);
    });
  });

  describe('isPublicClient Function', () => {
    it('should return true for client without secret', () => {
      const config: ClientConfig = {
        clientId: 'spa-client',
        redirectUri: 'http://localhost/callback',
        responseType: ResponseType.CODE,
        scope: ['openid'],
        grantType: GrantType.AUTHORIZATION_CODE,
        usePKCE: true,
        codeChallengeMethod: CodeChallengeMethod.S256,
      };

      expect(isPublicClient(config)).toBe(true);
    });

    it('should return false for client with secret', () => {
      const config: ClientConfig = {
        clientId: 'web-app',
        clientSecret: 'secret123',
        redirectUri: 'http://localhost/callback',
        responseType: ResponseType.CODE,
        scope: ['openid'],
        grantType: GrantType.AUTHORIZATION_CODE,
        usePKCE: true,
        codeChallengeMethod: CodeChallengeMethod.S256,
      };

      expect(isPublicClient(config)).toBe(false);
    });
  });

  describe('validateClientConfig Function', () => {
    it('should return no errors for valid OAuth 2.1 compliant config', () => {
      const config: ClientConfig = {
        clientId: 'spa-client',
        redirectUri: 'http://localhost:3000/callback',
        responseType: ResponseType.CODE,
        scope: ['openid', 'profile'],
        grantType: GrantType.AUTHORIZATION_CODE,
        usePKCE: true,
        useState: true,
        codeChallengeMethod: CodeChallengeMethod.S256,
      };

      const errors = validateClientConfig(config);
      expect(errors).toHaveLength(0);
    });

    it('should error when PKCE disabled for authorization code flow', () => {
      const config: ClientConfig = {
        clientId: 'spa-client',
        redirectUri: 'http://localhost:3000/callback',
        responseType: ResponseType.CODE,
        scope: ['openid'],
        grantType: GrantType.AUTHORIZATION_CODE,
        usePKCE: false,
        codeChallengeMethod: CodeChallengeMethod.S256,
      };

      const errors = validateClientConfig(config);
      expect(errors).toContain('PKCE is required for Authorization Code Flow (OAuth 2.1)');
    });

    it('should error when state parameter explicitly disabled', () => {
      const config: ClientConfig = {
        clientId: 'spa-client',
        redirectUri: 'http://localhost:3000/callback',
        responseType: ResponseType.CODE,
        scope: ['openid'],
        grantType: GrantType.AUTHORIZATION_CODE,
        usePKCE: true,
        useState: false,
        codeChallengeMethod: CodeChallengeMethod.S256,
      };

      const errors = validateClientConfig(config);
      expect(errors).toContain('State parameter is required for CSRF protection (OAuth 2.1)');
    });

    it('should error when redirect URI is empty', () => {
      const config: ClientConfig = {
        clientId: 'spa-client',
        redirectUri: '',
        responseType: ResponseType.CODE,
        scope: ['openid'],
        grantType: GrantType.AUTHORIZATION_CODE,
        usePKCE: true,
        codeChallengeMethod: CodeChallengeMethod.S256,
      };

      const errors = validateClientConfig(config);
      expect(errors).toContain('Redirect URI is required');
    });

    it('should error when no scopes provided', () => {
      const config: ClientConfig = {
        clientId: 'spa-client',
        redirectUri: 'http://localhost:3000/callback',
        responseType: ResponseType.CODE,
        scope: [],
        grantType: GrantType.AUTHORIZATION_CODE,
        usePKCE: true,
        codeChallengeMethod: CodeChallengeMethod.S256,
      };

      const errors = validateClientConfig(config);
      expect(errors).toContain('At least one scope is required');
    });

    it('should return multiple errors for invalid config', () => {
      const config: ClientConfig = {
        clientId: 'spa-client',
        redirectUri: '',
        responseType: ResponseType.CODE,
        scope: [],
        grantType: GrantType.AUTHORIZATION_CODE,
        usePKCE: false,
        useState: false,
        codeChallengeMethod: CodeChallengeMethod.S256,
      };

      const errors = validateClientConfig(config);
      expect(errors.length).toBeGreaterThan(1);
      expect(errors).toContain('Redirect URI is required');
      expect(errors).toContain('At least one scope is required');
    });
  });

  describe('ServerConfig Interface', () => {
    it('should accept valid server configuration', () => {
      const config: ServerConfig = {
        issuer: 'http://localhost:8080/realms/oauth2-demo',
        authorizationEndpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/auth',
        tokenEndpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/token',
        jwksUri: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/certs',
        supportedScopes: ['openid', 'profile', 'email'],
        supportedResponseTypes: ['code'],
        supportedGrantTypes: ['authorization_code', 'refresh_token'],
      };

      expect(config.issuer).toBe('http://localhost:8080/realms/oauth2-demo');
      expect(config.tokenEndpoint).toBeDefined();
      expect(config.supportedScopes).toContain('openid');
    });

    it('should allow optional userinfo endpoint', () => {
      const config: ServerConfig = {
        issuer: 'http://localhost:8080/realms/oauth2-demo',
        authorizationEndpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/auth',
        tokenEndpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/token',
        userInfoEndpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/userinfo',
        jwksUri: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/certs',
        supportedScopes: ['openid'],
        supportedResponseTypes: ['code'],
        supportedGrantTypes: ['authorization_code'],
      };

      expect(config.userInfoEndpoint).toBe('http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/userinfo');
    });

    it('should allow optional revocation endpoint', () => {
      const config: ServerConfig = {
        issuer: 'http://localhost:8080/realms/oauth2-demo',
        authorizationEndpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/auth',
        tokenEndpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/token',
        revocationEndpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/revoke',
        jwksUri: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/certs',
        supportedScopes: ['openid'],
        supportedResponseTypes: ['code'],
        supportedGrantTypes: ['authorization_code'],
      };

      expect(config.revocationEndpoint).toBeDefined();
    });

    it('should allow optional introspection endpoint', () => {
      const config: ServerConfig = {
        issuer: 'http://localhost:8080/realms/oauth2-demo',
        authorizationEndpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/auth',
        tokenEndpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/token',
        introspectionEndpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/token/introspect',
        jwksUri: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/certs',
        supportedScopes: ['openid'],
        supportedResponseTypes: ['code'],
        supportedGrantTypes: ['authorization_code'],
      };

      expect(config.introspectionEndpoint).toBeDefined();
    });

    it('should allow optional discovery URL', () => {
      const config: ServerConfig = {
        issuer: 'http://localhost:8080/realms/oauth2-demo',
        authorizationEndpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/auth',
        tokenEndpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/token',
        discoveryUrl: 'http://localhost:8080/realms/oauth2-demo/.well-known/openid-configuration',
        jwksUri: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/certs',
        supportedScopes: ['openid'],
        supportedResponseTypes: ['code'],
        supportedGrantTypes: ['authorization_code'],
      };

      expect(config.discoveryUrl).toBeDefined();
    });
  });

  describe('AppConfig Interface', () => {
    it('should combine client and server config', () => {
      const clientConfig: ClientConfig = {
        clientId: 'spa-client',
        redirectUri: 'http://localhost:3000/callback',
        responseType: ResponseType.CODE,
        scope: ['openid', 'profile'],
        grantType: GrantType.AUTHORIZATION_CODE,
        usePKCE: true,
        codeChallengeMethod: CodeChallengeMethod.S256,
      };

      const serverConfig: ServerConfig = {
        issuer: 'http://localhost:8080/realms/oauth2-demo',
        authorizationEndpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/auth',
        tokenEndpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/token',
        jwksUri: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/certs',
        supportedScopes: ['openid', 'profile', 'email'],
        supportedResponseTypes: ['code'],
        supportedGrantTypes: ['authorization_code'],
      };

      const appConfig: AppConfig = {
        client: clientConfig,
        server: serverConfig,
        environment: 'development',
        logLevel: 'debug',
        persistConfig: true,
      };

      expect(appConfig.client.clientId).toBe('spa-client');
      expect(appConfig.server.issuer).toBe('http://localhost:8080/realms/oauth2-demo');
      expect(appConfig.environment).toBe('development');
      expect(appConfig.logLevel).toBe('debug');
      expect(appConfig.persistConfig).toBe(true);
    });

    it('should support production environment', () => {
      const clientConfig: ClientConfig = {
        clientId: 'web-app',
        clientSecret: 'secret',
        redirectUri: 'https://example.com/callback',
        responseType: ResponseType.CODE,
        scope: ['openid'],
        grantType: GrantType.AUTHORIZATION_CODE,
        usePKCE: true,
        codeChallengeMethod: CodeChallengeMethod.S256,
      };

      const serverConfig: ServerConfig = {
        issuer: 'https://auth.example.com',
        authorizationEndpoint: 'https://auth.example.com/oauth/authorize',
        tokenEndpoint: 'https://auth.example.com/oauth/token',
        jwksUri: 'https://auth.example.com/.well-known/jwks.json',
        supportedScopes: ['openid'],
        supportedResponseTypes: ['code'],
        supportedGrantTypes: ['authorization_code'],
      };

      const appConfig: AppConfig = {
        client: clientConfig,
        server: serverConfig,
        environment: 'production',
        logLevel: 'error',
        persistConfig: false,
      };

      expect(appConfig.environment).toBe('production');
      expect(appConfig.logLevel).toBe('error');
    });

    it('should support staging environment', () => {
      const clientConfig: ClientConfig = {
        clientId: 'staging-client',
        redirectUri: 'https://staging.example.com/callback',
        responseType: ResponseType.CODE,
        scope: ['openid'],
        grantType: GrantType.AUTHORIZATION_CODE,
        usePKCE: true,
        codeChallengeMethod: CodeChallengeMethod.S256,
      };

      const serverConfig: ServerConfig = {
        issuer: 'https://staging-auth.example.com',
        authorizationEndpoint: 'https://staging-auth.example.com/oauth/authorize',
        tokenEndpoint: 'https://staging-auth.example.com/oauth/token',
        jwksUri: 'https://staging-auth.example.com/.well-known/jwks.json',
        supportedScopes: ['openid'],
        supportedResponseTypes: ['code'],
        supportedGrantTypes: ['authorization_code'],
      };

      const appConfig: AppConfig = {
        client: clientConfig,
        server: serverConfig,
        environment: 'staging',
        logLevel: 'info',
        persistConfig: true,
      };

      expect(appConfig.environment).toBe('staging');
      expect(appConfig.logLevel).toBe('info');
    });
  });
});
