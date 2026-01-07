/**
 * Discovery and Metadata Types Test Suite
 *
 * Tests for OIDC Discovery, OAuth2 metadata, and JWKS types.
 * Covers RFC 8414 and OIDC Core compliance.
 */

import { describe, it, expect } from 'vitest';
import {
  OIDCDiscoveryDocument,
  OAuth2Metadata,
  JWKS,
  JWK,
} from '../../src/discovery';

describe('Discovery & Metadata Types - Day 2', () => {
  describe('OIDC Discovery Document', () => {
    it('should accept minimal valid OIDC discovery document', () => {
      const discovery: OIDCDiscoveryDocument = {
        issuer: 'http://localhost:8080/realms/oauth2-demo',
        authorization_endpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/auth',
        token_endpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/token',
        jwks_uri: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/certs',
        scopes_supported: ['openid', 'profile', 'email'],
        response_types_supported: ['code', 'id_token'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256'],
        claims_supported: ['sub', 'iss', 'aud', 'exp', 'iat'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
      };

      expect(discovery.issuer).toBe('http://localhost:8080/realms/oauth2-demo');
      expect(discovery.authorization_endpoint).toBeDefined();
      expect(discovery.token_endpoint).toBeDefined();
      expect(discovery.jwks_uri).toBeDefined();
      expect(discovery.scopes_supported).toContain('openid');
      expect(discovery.response_types_supported).toContain('code');
    });

    it('should allow optional userinfo endpoint', () => {
      const discovery: OIDCDiscoveryDocument = {
        issuer: 'https://auth.example.com',
        authorization_endpoint: 'https://auth.example.com/oauth/authorize',
        token_endpoint: 'https://auth.example.com/oauth/token',
        userinfo_endpoint: 'https://auth.example.com/oauth/userinfo',
        jwks_uri: 'https://auth.example.com/.well-known/jwks.json',
        scopes_supported: ['openid', 'profile'],
        response_types_supported: ['code'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256'],
        claims_supported: ['sub', 'iss'],
        grant_types_supported: ['authorization_code'],
        token_endpoint_auth_methods_supported: ['client_secret_basic'],
      };

      expect(discovery.userinfo_endpoint).toBe('https://auth.example.com/oauth/userinfo');
    });

    it('should allow optional revocation endpoint', () => {
      const discovery: OIDCDiscoveryDocument = {
        issuer: 'https://auth.example.com',
        authorization_endpoint: 'https://auth.example.com/oauth/authorize',
        token_endpoint: 'https://auth.example.com/oauth/token',
        revocation_endpoint: 'https://auth.example.com/oauth/revoke',
        jwks_uri: 'https://auth.example.com/.well-known/jwks.json',
        scopes_supported: ['openid'],
        response_types_supported: ['code'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256'],
        claims_supported: ['sub'],
        grant_types_supported: ['authorization_code'],
        token_endpoint_auth_methods_supported: ['client_secret_basic'],
      };

      expect(discovery.revocation_endpoint).toBe('https://auth.example.com/oauth/revoke');
    });

    it('should allow optional introspection endpoint', () => {
      const discovery: OIDCDiscoveryDocument = {
        issuer: 'https://auth.example.com',
        authorization_endpoint: 'https://auth.example.com/oauth/authorize',
        token_endpoint: 'https://auth.example.com/oauth/token',
        introspection_endpoint: 'https://auth.example.com/oauth/introspect',
        jwks_uri: 'https://auth.example.com/.well-known/jwks.json',
        scopes_supported: ['openid'],
        response_types_supported: ['code'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256'],
        claims_supported: ['sub'],
        grant_types_supported: ['authorization_code'],
        token_endpoint_auth_methods_supported: ['client_secret_basic'],
      };

      expect(discovery.introspection_endpoint).toBe('https://auth.example.com/oauth/introspect');
    });

    it('should allow optional end session endpoint', () => {
      const discovery: OIDCDiscoveryDocument = {
        issuer: 'https://auth.example.com',
        authorization_endpoint: 'https://auth.example.com/oauth/authorize',
        token_endpoint: 'https://auth.example.com/oauth/token',
        end_session_endpoint: 'https://auth.example.com/oauth/logout',
        jwks_uri: 'https://auth.example.com/.well-known/jwks.json',
        scopes_supported: ['openid'],
        response_types_supported: ['code'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256'],
        claims_supported: ['sub'],
        grant_types_supported: ['authorization_code'],
        token_endpoint_auth_methods_supported: ['client_secret_basic'],
      };

      expect(discovery.end_session_endpoint).toBe('https://auth.example.com/oauth/logout');
    });

    it('should allow optional response modes', () => {
      const discovery: OIDCDiscoveryDocument = {
        issuer: 'https://auth.example.com',
        authorization_endpoint: 'https://auth.example.com/oauth/authorize',
        token_endpoint: 'https://auth.example.com/oauth/token',
        jwks_uri: 'https://auth.example.com/.well-known/jwks.json',
        response_modes_supported: ['query', 'fragment'],
        scopes_supported: ['openid'],
        response_types_supported: ['code'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256'],
        claims_supported: ['sub'],
        grant_types_supported: ['authorization_code'],
        token_endpoint_auth_methods_supported: ['client_secret_basic'],
      };

      expect(discovery.response_modes_supported).toContain('query');
      expect(discovery.response_modes_supported).toContain('fragment');
    });

    it('should support KeyCloak discovery response', () => {
      const discovery: OIDCDiscoveryDocument = {
        issuer: 'http://localhost:8080/realms/oauth2-demo',
        authorization_endpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/auth',
        token_endpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/token',
        token_introspection_endpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/token/introspect',
        userinfo_endpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/userinfo',
        end_session_endpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/logout',
        jwks_uri: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/certs',
        check_session_iframe: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/login-status-iframe.html',
        grant_types_supported: ['authorization_code', 'implicit', 'refresh_token', 'password', 'client_credentials'],
        acr_values_supported: ['0'],
        subject_types_supported: ['public', 'pairwise'],
        id_token_signing_alg_values_supported: ['PS384', 'ES384', 'RS384', 'HS256', 'HS512', 'ES256', 'RS256', 'HS384', 'ES512', 'PS256', 'PS512', 'RS512'],
        id_token_encryption_alg_values_supported: ['RSA-OAEP', 'RSA1_5'],
        id_token_encryption_enc_values_supported: ['A256GCM', 'A192GCM', 'A128GCM', 'A128CBC-HS256', 'A192CBC-HS384', 'A256CBC-HS512'],
        response_types_supported: ['code', 'none', 'id_token', 'token', 'id_token token', 'code id_token', 'code token', 'code id_token token'],
        response_modes_supported: ['query', 'fragment', 'form_post'],
        token_endpoint_auth_methods_supported: ['private_key_jwt', 'client_secret_basic', 'client_secret_post', 'client_secret_jwt'],
        token_endpoint_auth_signing_alg_values_supported: ['PS384', 'ES384', 'RS384', 'HS256', 'HS512', 'ES256', 'RS256', 'HS384', 'ES512', 'PS256', 'PS512', 'RS512'],
        claims_supported: ['sub', 'iss', 'aud', 'exp', 'iat', 'auth_time', 'nonce', 'acr', 'name', 'given_name', 'family_name', 'preferred_username', 'email', 'email_verified'],
        claim_types_supported: ['normal'],
        claims_parameter_supported: true,
        scopes_supported: ['openid', 'offline_access', 'profile', 'email', 'address', 'phone', 'roles'],
        request_parameter_supported: true,
        request_uri_parameter_supported: true,
        require_request_uri_registration: false,
        tls_client_certificate_bound_access_tokens: true,
        revocation_endpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/revoke',
        revocation_endpoint_auth_methods_supported: ['private_key_jwt', 'client_secret_basic', 'client_secret_post', 'client_secret_jwt'],
        revocation_endpoint_auth_signing_alg_values_supported: ['PS384', 'ES384', 'RS384', 'HS256', 'HS512', 'ES256', 'RS256', 'HS384', 'ES512', 'PS256', 'PS512', 'RS512'],
        introspection_endpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/token/introspect',
        introspection_endpoint_auth_methods_supported: ['private_key_jwt', 'client_secret_basic', 'client_secret_post', 'client_secret_jwt'],
        introspection_endpoint_auth_signing_alg_values_supported: ['PS384', 'ES384', 'RS384', 'HS256', 'HS512', 'ES256', 'RS256', 'HS384', 'ES512', 'PS256', 'PS512', 'RS512'],
        code_challenge_methods_supported: ['plain', 'S256'],
      };

      expect(discovery.issuer).toBeDefined();
      expect(discovery.code_challenge_methods_supported).toContain('S256');
    });
  });

  describe('OAuth2Metadata', () => {
    it('should accept valid OAuth 2.0 metadata', () => {
      const metadata: OAuth2Metadata = {
        issuer: 'https://auth.example.com',
        authorization_endpoint: 'https://auth.example.com/oauth/authorize',
        token_endpoint: 'https://auth.example.com/oauth/token',
        jwks_uri: 'https://auth.example.com/.well-known/jwks.json',
        scopes_supported: ['read', 'write'],
        response_types_supported: ['code', 'token'],
        response_modes_supported: ['query', 'fragment'],
        grant_types_supported: ['authorization_code', 'implicit', 'refresh_token'],
        token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
      };

      expect(metadata.issuer).toBe('https://auth.example.com');
      expect(metadata.token_endpoint).toBeDefined();
      expect(metadata.grant_types_supported).toContain('authorization_code');
    });

    it('should support minimal OAuth 2.0 metadata', () => {
      const metadata: OAuth2Metadata = {
        issuer: 'https://api.example.com',
        authorization_endpoint: 'https://api.example.com/authorize',
        token_endpoint: 'https://api.example.com/token',
        jwks_uri: 'https://api.example.com/jwks',
        scopes_supported: ['api'],
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code'],
        token_endpoint_auth_methods_supported: ['client_secret_basic'],
      };

      expect(metadata.issuer).toBeDefined();
      expect(metadata.response_types_supported).toHaveLength(1);
    });
  });

  describe('JWK - JSON Web Key', () => {
    it('should accept RSA JWK', () => {
      const jwk: JWK = {
        kty: 'RSA',
        use: 'sig',
        kid: 'rsa-key-1',
        n: 'modulus-value',
        e: 'AQAB',
        alg: 'RS256',
      };

      expect(jwk.kty).toBe('RSA');
      expect(jwk.use).toBe('sig');
      expect(jwk.e).toBe('AQAB');
    });

    it('should accept RSA JWK with certificate chain', () => {
      const jwk: JWK = {
        kty: 'RSA',
        use: 'sig',
        kid: 'rsa-key-1',
        n: 'modulus-value',
        e: 'AQAB',
        alg: 'RS256',
        x5c: [
          'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...',
          'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...',
        ],
      };

      expect(jwk.x5c).toBeDefined();
      expect(jwk.x5c).toHaveLength(2);
    });

    it('should accept Elliptic Curve JWK', () => {
      const jwk: JWK = {
        kty: 'EC',
        use: 'sig',
        kid: 'ec-key-1',
        crv: 'P-256',
        x: 'x-coordinate',
        y: 'y-coordinate',
        alg: 'ES256',
      };

      expect(jwk.kty).toBe('EC');
      expect(jwk.crv).toBe('P-256');
    });

    it('should accept symmetric JWK', () => {
      const jwk: JWK = {
        kty: 'oct',
        use: 'sig',
        kid: 'hmac-key-1',
        k: 'key-material',
        alg: 'HS256',
      };

      expect(jwk.kty).toBe('oct');
      expect(jwk.k).toBe('key-material');
    });

    it('should allow multiple key operations', () => {
      const jwk: JWK = {
        kty: 'RSA',
        use: 'sig',
        kid: 'multi-op-key',
        key_ops: ['sign', 'verify'],
        n: 'modulus',
        e: 'AQAB',
      };

      expect(jwk.key_ops).toContain('sign');
      expect(jwk.key_ops).toContain('verify');
    });

    it('should support RSA private key in JWK', () => {
      const jwk: JWK = {
        kty: 'RSA',
        use: 'sig',
        kid: 'private-key',
        n: 'modulus',
        e: 'AQAB',
        d: 'private-exponent',
        p: 'first-prime',
        q: 'second-prime',
        dp: 'first-factor-crt',
        dq: 'second-factor-crt',
        qi: 'coefficient',
      };

      expect(jwk.d).toBe('private-exponent');
      expect(jwk.p).toBe('first-prime');
    });

    it('should support EC private key in JWK', () => {
      const jwk: JWK = {
        kty: 'EC',
        use: 'sig',
        kid: 'ec-private-key',
        crv: 'P-256',
        x: 'x-coordinate',
        y: 'y-coordinate',
        d: 'private-value',
      };

      expect(jwk.d).toBe('private-value');
    });
  });

  describe('JWKS - JSON Web Key Set', () => {
    it('should accept valid JWKS with multiple keys', () => {
      const jwks: JWKS = {
        keys: [
          {
            kty: 'RSA',
            use: 'sig',
            kid: 'key-1',
            n: 'modulus-1',
            e: 'AQAB',
            alg: 'RS256',
          },
          {
            kty: 'RSA',
            use: 'sig',
            kid: 'key-2',
            n: 'modulus-2',
            e: 'AQAB',
            alg: 'RS256',
          },
        ],
      };

      expect(jwks.keys).toHaveLength(2);
      expect(jwks.keys[0].kid).toBe('key-1');
      expect(jwks.keys[1].kid).toBe('key-2');
    });

    it('should accept JWKS with single key', () => {
      const jwks: JWKS = {
        keys: [
          {
            kty: 'RSA',
            use: 'sig',
            kid: 'single-key',
            n: 'modulus',
            e: 'AQAB',
          },
        ],
      };

      expect(jwks.keys).toHaveLength(1);
    });

    it('should accept empty JWKS', () => {
      const jwks: JWKS = {
        keys: [],
      };

      expect(jwks.keys).toHaveLength(0);
    });

    it('should accept mixed key types in JWKS', () => {
      const jwks: JWKS = {
        keys: [
          {
            kty: 'RSA',
            use: 'sig',
            kid: 'rsa-key',
            n: 'rsa-modulus',
            e: 'AQAB',
          },
          {
            kty: 'EC',
            use: 'sig',
            kid: 'ec-key',
            crv: 'P-256',
            x: 'ec-x',
            y: 'ec-y',
          },
        ],
      };

      expect(jwks.keys).toHaveLength(2);
      expect(jwks.keys[0].kty).toBe('RSA');
      expect(jwks.keys[1].kty).toBe('EC');
    });

    it('should parse KeyCloak JWKS response', () => {
      const jwks: JWKS = {
        keys: [
          {
            kid: '2024-01-06',
            kty: 'RSA',
            alg: 'RS256',
            use: 'sig',
            n: 'very-long-modulus-string',
            e: 'AQAB',
            x5c: ['cert-chain-1', 'cert-chain-2'],
            x5t: 'thumbprint',
            'x5t#S256': 'thumbprint-sha256',
          },
        ],
      };

      expect(jwks.keys).toHaveLength(1);
      expect(jwks.keys[0].kid).toBe('2024-01-06');
      expect(jwks.keys[0]['x5t#S256']).toBe('thumbprint-sha256');
    });
  });
});
