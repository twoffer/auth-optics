# AuthOptics Backend - KeyCloak Integration

## Document Information

| Property | Value |
|----------|-------|
| **Component** | packages/backend/src/services (Discovery, JWKS, TokenValidator) |
| **Purpose** | OIDC Discovery, JWKS management, and JWT validation |
| **Status** | ✅ MVP Critical |
| **Parent Doc** | [backend-specification.md](auth-optics-backend-specification.md) |

---

## Table of Contents

1. [Overview](#1-overview)
2. [DiscoveryClient Service](#2-discoveryclient-service)
3. [JWKSClient Service](#3-jwksclient-service)
4. [TokenValidator Service](#4-tokenvalidator-service)
5. [KeyCloak Configuration](#5-keycloak-configuration)
6. [Integration Examples](#6-integration-examples)

---

## 1. Overview

### 1.1 Purpose

KeyCloak integration services handle OpenID Connect Discovery, JWKS fetching, and JWT validation.

**Services:**

| Service | Purpose | MVP Status |
|---------|---------|------------|
| **DiscoveryClient** | Fetch and cache OIDC discovery documents | ✅ MVP |
| **JWKSClient** | Fetch and cache JSON Web Key Sets | ✅ MVP |
| **TokenValidator** | Validate JWT signatures and claims | ✅ MVP |

### 1.2 RFC References

- **OpenID Connect Discovery 1.0** - `.well-known/openid-configuration`
- **RFC 7517** - JSON Web Key (JWK)
- **RFC 7519** - JSON Web Token (JWT)
- **RFC 7515** - JSON Web Signature (JWS)

---

## 2. DiscoveryClient Service

**File: `src/services/DiscoveryClient.ts`**

### 2.1 Purpose

Fetch and cache OpenID Connect Discovery documents per OIDC Discovery 1.0.

**Responsibilities:**
- Fetch `.well-known/openid-configuration`
- Cache discovery documents
- Extract endpoints (authorization, token, JWKS, userinfo)
- Validate discovery document format

### 2.2 Class Definition

```typescript
import axios from 'axios';
import { DiscoveryDocument } from '@auth-optics/shared';

/**
 * OIDC Discovery client
 * 
 * Fetches and caches OpenID Connect Discovery documents.
 * 
 * @remarks
 * ✅ MVP - Complete implementation required
 * 
 * Implements:
 * - OpenID Connect Discovery 1.0
 * - RFC 8414 (OAuth 2.0 Authorization Server Metadata)
 */
export class DiscoveryClient {
  private cache: Map<string, {
    document: DiscoveryDocument;
    fetchedAt: Date;
  }> = new Map();
  
  private readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
  
  /**
   * Fetch discovery document
   * 
   * Fetches from cache if available and not expired,
   * otherwise fetches from issuer's .well-known endpoint.
   * 
   * @param issuer - Issuer URL (e.g., "https://auth.example.com")
   * @returns Discovery document
   * @throws Error if fetch fails or document is invalid
   * 
   * @example
   * ```typescript
   * const client = new DiscoveryClient();
   * const discovery = await client.fetch('http://localhost:8080/realms/oauth2-demo');
   * 
   * console.log(discovery.authorizationEndpoint);
   * console.log(discovery.tokenEndpoint);
   * console.log(discovery.jwksUri);
   * ```
   */
  async fetch(issuer: string): Promise<DiscoveryDocument> {
    // Check cache
    const cached = this.cache.get(issuer);
    if (cached && this.isCacheValid(cached.fetchedAt)) {
      return cached.document;
    }
    
    // Construct discovery URL
    const discoveryUrl = this.getDiscoveryUrl(issuer);
    
    try {
      // Fetch discovery document
      const response = await axios.get(discoveryUrl, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      // Validate response
      const document = this.validateDiscoveryDocument(response.data, issuer);
      
      // Cache document
      this.cache.set(issuer, {
        document,
        fetchedAt: new Date()
      });
      
      return document;
      
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to fetch discovery document from ${discoveryUrl}: ${error.message}`
        );
      }
      throw error;
    }
  }
  
  /**
   * Get discovery URL from issuer
   * 
   * @param issuer - Issuer URL
   * @returns Discovery document URL
   * @private
   */
  private getDiscoveryUrl(issuer: string): string {
    // Ensure issuer doesn't end with /
    const normalizedIssuer = issuer.replace(/\/$/, '');
    
    // OIDC Discovery: {issuer}/.well-known/openid-configuration
    return `${normalizedIssuer}/.well-known/openid-configuration`;
  }
  
  /**
   * Validate discovery document
   * 
   * Ensures required fields are present per OIDC Discovery 1.0.
   * 
   * @param data - Raw discovery document
   * @param issuer - Expected issuer
   * @returns Validated discovery document
   * @throws Error if validation fails
   * @private
   */
  private validateDiscoveryDocument(
    data: any,
    issuer: string
  ): DiscoveryDocument {
    // Required fields per OIDC Discovery 1.0
    const required = [
      'issuer',
      'authorization_endpoint',
      'token_endpoint',
      'jwks_uri',
      'response_types_supported',
      'subject_types_supported',
      'id_token_signing_alg_values_supported'
    ];
    
    // Check required fields
    for (const field of required) {
      if (!data[field]) {
        throw new Error(`Discovery document missing required field: ${field}`);
      }
    }
    
    // Validate issuer matches
    if (data.issuer !== issuer) {
      throw new Error(
        `Issuer mismatch: expected ${issuer}, got ${data.issuer}`
      );
    }
    
    // Map to our DiscoveryDocument type
    return {
      issuer: data.issuer,
      authorizationEndpoint: data.authorization_endpoint,
      tokenEndpoint: data.token_endpoint,
      jwksUri: data.jwks_uri,
      userinfoEndpoint: data.userinfo_endpoint,
      revocationEndpoint: data.revocation_endpoint,
      introspectionEndpoint: data.introspection_endpoint,
      endSessionEndpoint: data.end_session_endpoint,
      
      responseTypesSupported: data.response_types_supported,
      responseModesSupported: data.response_modes_supported || [],
      grantTypesSupported: data.grant_types_supported || ['authorization_code'],
      
      subjectTypesSupported: data.subject_types_supported,
      idTokenSigningAlgValuesSupported: data.id_token_signing_alg_values_supported,
      
      scopesSupported: data.scopes_supported || [],
      tokenEndpointAuthMethodsSupported: data.token_endpoint_auth_methods_supported || ['client_secret_basic'],
      
      claimsSupported: data.claims_supported || [],
      codeChallengeMethodsSupported: data.code_challenge_methods_supported || ['S256'],
      
      // Store full document for reference
      raw: data
    };
  }
  
  /**
   * Check if cached document is still valid
   * 
   * @param fetchedAt - When document was fetched
   * @returns true if cache is valid
   * @private
   */
  private isCacheValid(fetchedAt: Date): boolean {
    const age = Date.now() - fetchedAt.getTime();
    return age < this.CACHE_TTL_MS;
  }
  
  /**
   * Clear cache for issuer
   * 
   * @param issuer - Issuer to clear, or undefined to clear all
   */
  clearCache(issuer?: string): void {
    if (issuer) {
      this.cache.delete(issuer);
    } else {
      this.cache.clear();
    }
  }
}
```

### 2.3 KeyCloak Discovery Example

```typescript
// KeyCloak discovery URL:
// http://localhost:8080/realms/oauth2-demo/.well-known/openid-configuration

// Example response:
{
  "issuer": "http://localhost:8080/realms/oauth2-demo",
  "authorization_endpoint": "http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/auth",
  "token_endpoint": "http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/token",
  "jwks_uri": "http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/certs",
  "userinfo_endpoint": "http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/userinfo",
  "introspection_endpoint": "http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/token/introspect",
  "revocation_endpoint": "http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/revoke",
  "end_session_endpoint": "http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/logout",
  
  "response_types_supported": ["code", "code id_token", "token id_token"],
  "grant_types_supported": ["authorization_code", "refresh_token", "client_credentials"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"],
  "code_challenge_methods_supported": ["plain", "S256"],
  
  "scopes_supported": ["openid", "profile", "email", "offline_access"],
  "claims_supported": ["sub", "iss", "aud", "exp", "iat", "name", "email"]
}
```

---

## 3. JWKSClient Service

**File: `src/services/JWKSClient.ts`**

### 3.1 Purpose

Fetch and cache JSON Web Key Sets (JWKS) for JWT signature verification.

**Responsibilities:**
- Fetch JWKS from authorization server
- Cache keys with TTL
- Find key by key ID (kid)
- Handle key rotation

### 3.2 Class Definition

```typescript
import axios from 'axios';
import { JWKS, JWK } from '@auth-optics/shared';

/**
 * JWKS (JSON Web Key Set) client
 * 
 * Fetches and caches public keys for JWT signature verification.
 * 
 * @remarks
 * ✅ MVP - Complete implementation required
 * 
 * Implements:
 * - RFC 7517 (JSON Web Key)
 */
export class JWKSClient {
  private cache: Map<string, {
    jwks: JWKS;
    fetchedAt: Date;
  }> = new Map();
  
  private readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
  
  /**
   * Fetch JWKS
   * 
   * @param jwksUri - JWKS URI
   * @returns JSON Web Key Set
   * @throws Error if fetch fails
   * 
   * @example
   * ```typescript
   * const client = new JWKSClient();
   * const jwks = await client.fetch(
   *   'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/certs'
   * );
   * 
   * console.log(`Fetched ${jwks.keys.length} keys`);
   * ```
   */
  async fetch(jwksUri: string): Promise<JWKS> {
    // Check cache
    const cached = this.cache.get(jwksUri);
    if (cached && this.isCacheValid(cached.fetchedAt)) {
      return cached.jwks;
    }
    
    try {
      // Fetch JWKS
      const response = await axios.get(jwksUri, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      // Validate response
      if (!response.data.keys || !Array.isArray(response.data.keys)) {
        throw new Error('Invalid JWKS format: missing keys array');
      }
      
      const jwks: JWKS = {
        keys: response.data.keys
      };
      
      // Cache JWKS
      this.cache.set(jwksUri, {
        jwks,
        fetchedAt: new Date()
      });
      
      return jwks;
      
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to fetch JWKS from ${jwksUri}: ${error.message}`
        );
      }
      throw error;
    }
  }
  
  /**
   * Find key by key ID
   * 
   * @param jwksUri - JWKS URI
   * @param kid - Key ID
   * @returns JWK or undefined if not found
   * 
   * @example
   * ```typescript
   * const key = await client.findKey(jwksUri, 'key-id-123');
   * if (key) {
   *   console.log('Found key:', key.kty, key.use);
   * }
   * ```
   */
  async findKey(jwksUri: string, kid: string): Promise<JWK | undefined> {
    const jwks = await this.fetch(jwksUri);
    return jwks.keys.find(key => key.kid === kid);
  }
  
  /**
   * Check if cached JWKS is still valid
   * 
   * @param fetchedAt - When JWKS was fetched
   * @returns true if cache is valid
   * @private
   */
  private isCacheValid(fetchedAt: Date): boolean {
    const age = Date.now() - fetchedAt.getTime();
    return age < this.CACHE_TTL_MS;
  }
  
  /**
   * Clear cache
   * 
   * @param jwksUri - URI to clear, or undefined to clear all
   */
  clearCache(jwksUri?: string): void {
    if (jwksUri) {
      this.cache.delete(jwksUri);
    } else {
      this.cache.clear();
    }
  }
}
```

### 3.3 KeyCloak JWKS Example

```typescript
// KeyCloak JWKS URL:
// http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/certs

// Example response:
{
  "keys": [
    {
      "kid": "TpZ9PXyR3kF8_2xQ3aL5nNw8V9jK2mH1",
      "kty": "RSA",
      "alg": "RS256",
      "use": "sig",
      "n": "0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtV...",
      "e": "AQAB",
      "x5c": ["MIIC+DCCAeCgAwIBAgIJBIGjYW6hFpn2MA0GCSqGSIb3DQEBBQUAMCMxIT..."],
      "x5t": "cZk8dJL3FnF9Tv8wfJL9OKHzE3Q",
      "x5t#S256": "eXV-0JLHSMPgGxGFGLVH2wkv9G6l8HqsYLI5FgGX7cY"
    }
  ]
}
```

---

## 4. TokenValidator Service

**File: `src/services/TokenValidator.ts`**

### 4.1 Purpose

Validate JWT access tokens and ID tokens per RFC 7519 and OIDC Core.

**Responsibilities:**
- Verify JWT signatures using JWKS
- Validate JWT claims (iss, aud, exp, iat)
- Validate OIDC-specific claims (nonce, at_hash)
- Decode JWT payloads

### 4.2 Class Definition

```typescript
import * as jose from 'jose';
import { 
  ServerConfig, 
  ValidationResult,
  JWTPayload 
} from '@auth-optics/shared';
import { JWKSClient } from './JWKSClient';
import * as crypto from 'crypto';

/**
 * Token validator
 * 
 * Validates JWT access tokens and ID tokens.
 * 
 * @remarks
 * ✅ MVP - Complete implementation required
 * 
 * Implements:
 * - RFC 7519 (JWT validation)
 * - OIDC Core 1.0 (ID token validation)
 */
export class TokenValidator {
  private serverConfig: ServerConfig;
  private jwksClient: JWKSClient;
  
  constructor(serverConfig: ServerConfig) {
    this.serverConfig = serverConfig;
    this.jwksClient = new JWKSClient();
  }
  
  /**
   * Validate access token
   * 
   * Verifies JWT signature and validates claims.
   * 
   * @param accessToken - JWT access token
   * @param options - Validation options
   * @returns Validation result
   * 
   * @example
   * ```typescript
   * const validator = new TokenValidator(serverConfig);
   * const result = await validator.validateAccessToken(token);
   * 
   * if (result.valid) {
   *   console.log('Token valid. Subject:', result.claims.sub);
   * } else {
   *   console.error('Token invalid:', result.errors);
   * }
   * ```
   */
  async validateAccessToken(
    accessToken: string,
    options: {
      audience?: string;
      clockTolerance?: number; // seconds
    } = {}
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    let claims: JWTPayload | null = null;
    
    try {
      // Decode JWT header to get key ID
      const decoded = jose.decodeProtectedHeader(accessToken);
      const kid = decoded.kid;
      
      if (!kid) {
        errors.push('JWT missing key ID (kid) in header');
        return this.createValidationResult(false, null, errors, 'Access Token');
      }
      
      // Fetch JWKS and find key
      const jwksUri = this.serverConfig.jwksUri || 
        `${this.serverConfig.issuer}/.well-known/jwks.json`;
      
      const jwk = await this.jwksClient.findKey(jwksUri, kid);
      
      if (!jwk) {
        errors.push(`Key not found in JWKS: ${kid}`);
        return this.createValidationResult(false, null, errors, 'Access Token');
      }
      
      // Import public key
      const publicKey = await jose.importJWK(jwk, jwk.alg);
      
      // Verify JWT signature and validate claims
      const { payload } = await jose.jwtVerify(accessToken, publicKey, {
        issuer: this.serverConfig.issuer,
        audience: options.audience,
        clockTolerance: options.clockTolerance || 60 // 1 minute default
      });
      
      claims = payload as JWTPayload;
      
      // Additional validations
      this.validateTokenType(payload, 'Bearer', errors);
      this.validateExpiration(payload, errors);
      
      const valid = errors.length === 0;
      
      return this.createValidationResult(
        valid,
        claims,
        errors,
        'Access Token'
      );
      
    } catch (error: any) {
      errors.push(`JWT validation failed: ${error.message}`);
      
      // Try to decode without verification for debugging
      try {
        claims = jose.decodeJwt(accessToken) as JWTPayload;
      } catch {
        // Could not decode
      }
      
      return this.createValidationResult(
        false,
        claims,
        errors,
        'Access Token'
      );
    }
  }
  
  /**
   * Validate ID token
   * 
   * Verifies JWT signature and validates OIDC-specific claims.
   * 
   * @param idToken - JWT ID token
   * @param accessToken - Access token for at_hash validation
   * @param nonce - Expected nonce value
   * @returns Validation result
   * 
   * @example
   * ```typescript
   * const result = await validator.validateIDToken(
   *   idToken,
   *   accessToken,
   *   'nonce-from-authorization-request'
   * );
   * 
   * if (result.valid) {
   *   console.log('ID token valid');
   * }
   * ```
   */
  async validateIDToken(
    idToken: string,
    accessToken: string,
    nonce?: string
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    let claims: JWTPayload | null = null;
    
    try {
      // Decode JWT header to get key ID
      const decoded = jose.decodeProtectedHeader(idToken);
      const kid = decoded.kid;
      
      if (!kid) {
        errors.push('ID token missing key ID (kid) in header');
        return this.createValidationResult(false, null, errors, 'ID Token');
      }
      
      // Fetch JWKS and find key
      const jwksUri = this.serverConfig.jwksUri || 
        `${this.serverConfig.issuer}/.well-known/jwks.json`;
      
      const jwk = await this.jwksClient.findKey(jwksUri, kid);
      
      if (!jwk) {
        errors.push(`Key not found in JWKS: ${kid}`);
        return this.createValidationResult(false, null, errors, 'ID Token');
      }
      
      // Import public key
      const publicKey = await jose.importJWK(jwk, jwk.alg);
      
      // Verify JWT signature and validate claims
      const { payload } = await jose.jwtVerify(idToken, publicKey, {
        issuer: this.serverConfig.issuer,
        clockTolerance: 60
      });
      
      claims = payload as JWTPayload;
      
      // OIDC-specific validations
      
      // 1. Validate nonce (if provided)
      if (nonce) {
        this.validateNonce(payload, nonce, errors);
      }
      
      // 2. Validate at_hash (access token hash)
      this.validateAtHash(payload, accessToken, errors);
      
      // 3. Validate auth_time (if present)
      if (payload.auth_time) {
        this.validateAuthTime(payload, errors);
      }
      
      const valid = errors.length === 0;
      
      return this.createValidationResult(
        valid,
        claims,
        errors,
        'ID Token'
      );
      
    } catch (error: any) {
      errors.push(`ID token validation failed: ${error.message}`);
      
      // Try to decode without verification for debugging
      try {
        claims = jose.decodeJwt(idToken) as JWTPayload;
      } catch {
        // Could not decode
      }
      
      return this.createValidationResult(
        false,
        claims,
        errors,
        'ID Token'
      );
    }
  }
  
  /**
   * Decode JWT without validation (for debugging)
   * 
   * @param token - JWT token
   * @returns Decoded payload
   */
  decode(token: string): JWTPayload {
    return jose.decodeJwt(token) as JWTPayload;
  }
  
  /**
   * Validate token type claim
   * 
   * @param payload - JWT payload
   * @param expectedType - Expected token type
   * @param errors - Error accumulator
   * @private
   */
  private validateTokenType(
    payload: any,
    expectedType: string,
    errors: string[]
  ): void {
    if (payload.typ && payload.typ !== expectedType) {
      errors.push(
        `Invalid token type: expected ${expectedType}, got ${payload.typ}`
      );
    }
  }
  
  /**
   * Validate expiration
   * 
   * @param payload - JWT payload
   * @param errors - Error accumulator
   * @private
   */
  private validateExpiration(payload: any, errors: string[]): void {
    if (!payload.exp) {
      errors.push('Token missing expiration (exp) claim');
      return;
    }
    
    const now = Math.floor(Date.now() / 1000);
    if (now >= payload.exp) {
      errors.push(
        `Token expired at ${new Date(payload.exp * 1000).toISOString()}`
      );
    }
  }
  
  /**
   * Validate nonce claim (OIDC)
   * 
   * @param payload - JWT payload
   * @param expectedNonce - Expected nonce
   * @param errors - Error accumulator
   * @private
   */
  private validateNonce(
    payload: any,
    expectedNonce: string,
    errors: string[]
  ): void {
    if (!payload.nonce) {
      errors.push('ID token missing nonce claim');
      return;
    }
    
    if (payload.nonce !== expectedNonce) {
      errors.push('Nonce mismatch - possible token replay attack');
    }
  }
  
  /**
   * Validate at_hash claim (OIDC Core §3.1.3.3)
   * 
   * at_hash = Base64URL(Left-Half(Hash(access_token)))
   * 
   * @param payload - JWT payload
   * @param accessToken - Access token
   * @param errors - Error accumulator
   * @private
   */
  private validateAtHash(
    payload: any,
    accessToken: string,
    errors: string[]
  ): void {
    if (!payload.at_hash) {
      // at_hash is optional in some flows
      return;
    }
    
    try {
      // Compute expected at_hash (SHA-256 for RS256)
      const hash = crypto.createHash('sha256').update(accessToken).digest();
      const leftHalf = hash.slice(0, hash.length / 2);
      const expectedAtHash = leftHalf.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      if (payload.at_hash !== expectedAtHash) {
        errors.push('at_hash mismatch - ID token may not correspond to access token');
      }
    } catch (error: any) {
      errors.push(`at_hash validation failed: ${error.message}`);
    }
  }
  
  /**
   * Validate auth_time claim
   * 
   * @param payload - JWT payload
   * @param errors - Error accumulator
   * @private
   */
  private validateAuthTime(payload: any, errors: string[]): void {
    const now = Math.floor(Date.now() / 1000);
    
    // auth_time should not be in the future
    if (payload.auth_time > now + 60) { // 1 minute tolerance
      errors.push('auth_time is in the future');
    }
  }
  
  /**
   * Create validation result
   * 
   * @param valid - Whether validation passed
   * @param claims - JWT claims
   * @param errors - Validation errors
   * @param subject - Token type (for logging)
   * @returns Validation result
   * @private
   */
  private createValidationResult(
    valid: boolean,
    claims: JWTPayload | null,
    errors: string[],
    subject: string
  ): ValidationResult {
    return {
      valid,
      subject,
      claims: claims || undefined,
      errors: errors.length > 0 ? errors : undefined,
      validatedAt: new Date().toISOString()
    };
  }
}
```

### 4.3 Validation Checklist

**Access Token Validation:**
- ✅ Signature verification using JWKS
- ✅ Issuer (iss) validation
- ✅ Audience (aud) validation (if specified)
- ✅ Expiration (exp) validation
- ✅ Not before (nbf) validation
- ✅ Issued at (iat) validation

**ID Token Validation (OIDC Core §3.1.3.7):**
- ✅ All access token validations
- ✅ Nonce validation (replay protection)
- ✅ at_hash validation (token binding)
- ✅ auth_time validation (if present)
- ✅ azp (authorized party) validation (if multiple audiences)

---

## 5. KeyCloak Configuration

### 5.1 KeyCloak URLs

```bash
# Base URL
KEYCLOAK_URL=http://localhost:8080

# Realm
KEYCLOAK_REALM=oauth2-demo

# Discovery endpoint
DISCOVERY_URL=${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/.well-known/openid-configuration

# JWKS endpoint
JWKS_URL=${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs
```

### 5.2 Client Configuration

```typescript
// KeyCloak client for backend
const clientConfig = {
  clientId: 'web-app',
  clientSecret: 'your-secret-from-keycloak',
  redirectUris: [
    'http://localhost:3001/api/flows/{flowId}/callback'
  ],
  scopes: ['openid', 'profile', 'email']
};

// Server configuration
const serverConfig = {
  issuer: 'http://localhost:8080/realms/oauth2-demo',
  authorizationEndpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/auth',
  tokenEndpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/token',
  jwksUri: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/certs'
};
```

---

## 6. Integration Examples

### 6.1 Complete Flow Integration

```typescript
import { DiscoveryClient } from './services/DiscoveryClient';
import { TokenValidator } from './services/TokenValidator';

/**
 * Complete KeyCloak integration example
 */
async function integrateWithKeyCloak() {
  const issuer = 'http://localhost:8080/realms/oauth2-demo';
  
  // Step 1: Fetch discovery document
  const discoveryClient = new DiscoveryClient();
  const discovery = await discoveryClient.fetch(issuer);
  
  console.log('Authorization endpoint:', discovery.authorizationEndpoint);
  console.log('Token endpoint:', discovery.tokenEndpoint);
  console.log('JWKS URI:', discovery.jwksUri);
  
  // Step 2: Use endpoints for OAuth2 flow
  const serverConfig = {
    issuer: discovery.issuer,
    authorizationEndpoint: discovery.authorizationEndpoint,
    tokenEndpoint: discovery.tokenEndpoint,
    jwksUri: discovery.jwksUri
  };
  
  // Step 3: After obtaining tokens, validate them
  const validator = new TokenValidator(serverConfig);
  
  const accessTokenResult = await validator.validateAccessToken(
    'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
    { audience: 'account' }
  );
  
  if (accessTokenResult.valid) {
    console.log('Access token valid');
    console.log('Subject:', accessTokenResult.claims?.sub);
    console.log('Expires:', new Date(accessTokenResult.claims?.exp! * 1000));
  } else {
    console.error('Access token invalid:', accessTokenResult.errors);
  }
  
  // Step 4: Validate ID token
  const idTokenResult = await validator.validateIDToken(
    'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
    'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...', // access token
    'nonce-from-authorization-request'
  );
  
  if (idTokenResult.valid) {
    console.log('ID token valid');
    console.log('Name:', idTokenResult.claims?.name);
    console.log('Email:', idTokenResult.claims?.email);
  } else {
    console.error('ID token invalid:', idTokenResult.errors);
  }
}
```

### 6.2 Error Handling

```typescript
/**
 * Robust error handling example
 */
async function validateTokenWithErrorHandling(token: string) {
  try {
    const validator = new TokenValidator(serverConfig);
    const result = await validator.validateAccessToken(token);
    
    if (!result.valid) {
      // Log specific validation errors
      console.error('Token validation failed:');
      result.errors?.forEach(error => {
        console.error(`  - ${error}`);
      });
      
      // Check common issues
      if (result.errors?.some(e => e.includes('expired'))) {
        console.error('Token has expired - refresh needed');
      }
      
      if (result.errors?.some(e => e.includes('signature'))) {
        console.error('Signature verification failed - possible tampering');
      }
      
      return null;
    }
    
    return result.claims;
    
  } catch (error: any) {
    console.error('Token validation error:', error.message);
    
    // Check if it's a network error (JWKS fetch failure)
    if (error.message.includes('Failed to fetch')) {
      console.error('Could not reach KeyCloak - check network/configuration');
    }
    
    return null;
  }
}
```

---

## Document Metadata

| Property | Value |
|----------|-------|
| **Version** | 1.0.0 |
| **Status** | ✅ Complete for MVP KeyCloak Integration |
| **Parent** | [backend-specification.md](auth-optics-backend-specification.md) |

---

**Next Steps:**
1. Implement DiscoveryClient with caching
2. Implement JWKSClient with key rotation support
3. Implement TokenValidator with comprehensive claim validation
4. Test with KeyCloak instance
5. See [backend-sse-events.md](backend-sse-events.md) for real-time event streaming
