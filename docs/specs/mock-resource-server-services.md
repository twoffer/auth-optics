# AuthOptics Mock Resource Server - Core Services

## Document Information

| Property | Value |
|----------|-------|
| **Component** | packages/mock-resource-server/src/services |
| **Purpose** | Core business logic services for token validation and scope checking |
| **Status** | ✅ MVP Critical |
| **Parent Doc** | [mock-resource-server-specification.md](auth-optics-mock-resource-server-specification.md) |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Service Architecture](#2-service-architecture)
3. [JWKSClient Service](#3-jwksclient-service)
4. [TokenValidator Service](#4-tokenvalidator-service)
5. [ScopeChecker Service](#5-scopechecker-service)
6. [ResponseFormatter Service](#6-responseformatter-service)

---

## 1. Overview

### 1.1 Purpose

Core services implement the business logic for OAuth2 bearer token validation in accordance with RFC 6750, RFC 7519 (JWT), and RFC 9068 (JWT Profile for OAuth 2.0 Access Tokens).

| Service | Responsibility | MVP Status |
|---------|---------------|------------|
| **JWKSClient** | Fetch and cache KeyCloak's public keys | ✅ MVP |
| **TokenValidator** | JWT signature verification and claims validation | ✅ MVP |
| **ScopeChecker** | Scope-based access control enforcement | ✅ MVP |
| **ResponseFormatter** | Standardized API responses | ✅ MVP |

### 1.2 Service Dependencies

```
Express Request
    |
    v
JWT Verification Middleware
    |
    +--> JWKSClient
    |   +--> Fetch/Cache JWKS
    |
    +--> TokenValidator
    |   +--> Extract JWT
    |   +--> Verify Signature (using JWKS)
    |   +--> Validate Claims
    |
    +--> ScopeChecker
    |   +--> Check Required Scope
    |
    +--> ResponseFormatter
        +--> Format Success/Error Response
```

---

## 2. Service Architecture

### 2.1 Directory Structure

```
src/services/
+-- index.ts                    # Barrel export
+-- JWKSClient.ts               # ✅ MVP - 100-120 lines
+-- TokenValidator.ts           # ✅ MVP - 200-250 lines
+-- ScopeChecker.ts             # ✅ MVP - 80-100 lines
+-- ResponseFormatter.ts        # ✅ MVP - 60-80 lines
```

### 2.2 Service Patterns

All services follow these patterns:

1. **Constructor Injection** - Dependencies injected via constructor
2. **TypeScript Strict Mode** - No `any` types
3. **Error Handling** - Throw specific error types for different validation failures
4. **Immutability** - Return new objects, don't mutate inputs
5. **Logging** - Log validation steps for debugging

---

## 3. JWKSClient Service

**File: `src/services/JWKSClient.ts`**

### 3.1 Purpose

Fetch and cache KeyCloak's JSON Web Key Set (JWKS) for JWT signature verification.

**Responsibilities:**
- Fetch JWKS from KeyCloak's OIDC discovery endpoint
- Cache keys to avoid repeated network calls
- Handle key rotation gracefully
- Provide public keys for JWT verification

### 3.2 Class Definition

```typescript
import axios from 'axios';
import * as jose from 'jose';

/**
 * JWKS client for fetching and caching KeyCloak's public keys
 * 
 * Implements:
 * - RFC 7517: JSON Web Key (JWK)
 * - RFC 7518: JSON Web Algorithms (JWA)
 * 
 * @remarks
 * ✅ MVP - Complete implementation required
 */
export class JWKSClient {
  private jwksUri: string;
  private cachedJWKS: jose.JSONWebKeySet | null = null;
  private cacheExpiry: number = 0;
  private cacheDuration: number; // milliseconds
  
  constructor(jwksUri: string, cacheDuration: number = 3600000) {
    this.jwksUri = jwksUri;
    this.cacheDuration = cacheDuration; // Default: 1 hour
  }
  
  /**
   * Get JWKS (from cache or fetch fresh)
   * 
   * @returns JWKS containing public keys
   * @throws Error if JWKS fetch fails
   * 
   * @example
   * ```typescript
   * const jwksClient = new JWKSClient('http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/certs');
   * const jwks = await jwksClient.getJWKS();
   * // { keys: [{ kid: "abc123", kty: "RSA", ... }] }
   * ```
   */
  async getJWKS(): Promise<jose.JSONWebKeySet> {
    const now = Date.now();
    
    // Return cached if still valid
    if (this.cachedJWKS && now < this.cacheExpiry) {
      console.log('[JWKSClient] Using cached JWKS');
      return this.cachedJWKS;
    }
    
    // Fetch fresh JWKS
    console.log('[JWKSClient] Fetching fresh JWKS from:', this.jwksUri);
    
    try {
      const response = await axios.get(this.jwksUri, {
        timeout: 5000,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      this.cachedJWKS = response.data;
      this.cacheExpiry = now + this.cacheDuration;
      
      console.log('[JWKSClient] JWKS cached successfully');
      console.log('[JWKSClient] Keys count:', this.cachedJWKS.keys?.length || 0);
      
      return this.cachedJWKS;
      
    } catch (error: any) {
      console.error('[JWKSClient] Failed to fetch JWKS:', error.message);
      throw new Error(`JWKS fetch failed: ${error.message}`);
    }
  }
  
  /**
   * Get a specific public key by key ID (kid)
   * 
   * @param kid - Key ID from JWT header
   * @returns JWK for the specified kid
   * @throws Error if key not found
   * 
   * @example
   * ```typescript
   * const key = await jwksClient.getKey('abc123');
   * // { kid: "abc123", kty: "RSA", n: "...", e: "AQAB" }
   * ```
   */
  async getKey(kid: string): Promise<jose.JWK> {
    const jwks = await this.getJWKS();
    
    if (!jwks.keys || jwks.keys.length === 0) {
      throw new Error('JWKS contains no keys');
    }
    
    const key = jwks.keys.find(k => k.kid === kid);
    
    if (!key) {
      console.error(`[JWKSClient] Key not found: ${kid}`);
      console.error(`[JWKSClient] Available keys:`, jwks.keys.map(k => k.kid));
      throw new Error(`Key with kid "${kid}" not found in JWKS`);
    }
    
    return key;
  }
  
  /**
   * Create a jose KeyLike object for signature verification
   * 
   * @param kid - Key ID from JWT header
   * @returns KeyLike object for jose.jwtVerify()
   * 
   * @example
   * ```typescript
   * const publicKey = await jwksClient.getPublicKey('abc123');
   * const { payload } = await jose.jwtVerify(token, publicKey);
   * ```
   */
  async getPublicKey(kid: string): Promise<jose.KeyLike> {
    const jwk = await this.getKey(kid);
    return await jose.importJWK(jwk, 'RS256');
  }
  
  /**
   * Clear the cached JWKS (useful for testing or key rotation)
   */
  clearCache(): void {
    console.log('[JWKSClient] Clearing JWKS cache');
    this.cachedJWKS = null;
    this.cacheExpiry = 0;
  }
  
  /**
   * Get cache status (for debugging)
   */
  getCacheStatus(): {
    isCached: boolean;
    expiresIn: number; // milliseconds
  } {
    const now = Date.now();
    const expiresIn = this.cacheExpiry - now;
    
    return {
      isCached: this.cachedJWKS !== null && expiresIn > 0,
      expiresIn: Math.max(0, expiresIn)
    };
  }
}
```

### 3.3 Usage Example

```typescript
// Initialize JWKS client
const jwksClient = new JWKSClient(
  'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/certs',
  3600000 // 1 hour cache
);

// In token verification middleware
const token = extractBearerToken(req);
const decoded = jose.decodeProtectedHeader(token);
const publicKey = await jwksClient.getPublicKey(decoded.kid!);

const { payload } = await jose.jwtVerify(token, publicKey, {
  issuer: 'http://localhost:8080/realms/oauth2-demo',
  audience: ['account', 'resource-server']
});
```

---

## 4. TokenValidator Service

**File: `src/services/TokenValidator.ts`**

### 4.1 Purpose

Complete JWT token validation including signature verification and claims validation per RFC 7519 and RFC 9068.

**Responsibilities:**
- Verify JWT signature using JWKS
- Validate all required claims (exp, nbf, iss, aud)
- Handle JWT errors with specific error types
- Provide detailed validation results for debugging

### 4.2 Class Definition

```typescript
import * as jose from 'jose';
import { JWKSClient } from './JWKSClient';

/**
 * Token validation errors with specific types
 */
export class TokenValidationError extends Error {
  constructor(
    message: string,
    public readonly errorType: 'invalid_token' | 'token_expired' | 'invalid_signature' | 'invalid_issuer' | 'invalid_audience',
    public readonly wwwAuthenticateChallenge?: string
  ) {
    super(message);
    this.name = 'TokenValidationError';
  }
}

/**
 * Configuration for token validation
 */
export interface TokenValidationConfig {
  expectedIssuer: string;
  expectedAudience: string | string[];
  clockTolerance?: number; // seconds (default: 0)
}

/**
 * Result of token validation
 */
export interface TokenValidationResult {
  valid: boolean;
  payload?: jose.JWTPayload;
  error?: {
    type: string;
    message: string;
    wwwAuthenticate?: string;
  };
}

/**
 * JWT token validator with comprehensive claims validation
 * 
 * Implements:
 * - RFC 7519: JSON Web Token (JWT)
 * - RFC 9068: JWT Profile for OAuth 2.0 Access Tokens
 * - RFC 6750 3: Error responses
 * 
 * @remarks
 * ✅ MVP - Complete implementation required
 */
export class TokenValidator {
  private jwksClient: JWKSClient;
  private config: TokenValidationConfig;
  
  constructor(jwksClient: JWKSClient, config: TokenValidationConfig) {
    this.jwksClient = jwksClient;
    this.config = config;
  }
  
  /**
   * Validate JWT access token (full validation pipeline)
   * 
   * Steps:
   * 1. Decode JWT header (get kid)
   * 2. Fetch public key from JWKS
   * 3. Verify JWT signature
   * 4. Validate claims (exp, nbf, iss, aud)
   * 
   * @param token - JWT access token (without "Bearer " prefix)
   * @returns Validation result with payload or error
   * 
   * @example
   * ```typescript
   * const result = await validator.validate('eyJhbGciOiJSUzI1NiI...');
   * if (result.valid) {
   *   console.log('User:', result.payload.sub);
   * } else {
   *   console.error('Validation failed:', result.error.message);
   * }
   * ```
   */
  async validate(token: string): Promise<TokenValidationResult> {
    try {
      // Step 1: Decode header to get kid
      let header: jose.ProtectedHeaderParameters;
      
      try {
        header = jose.decodeProtectedHeader(token);
      } catch (error) {
        throw new TokenValidationError(
          'Malformed JWT token',
          'invalid_token',
          'Bearer error="invalid_token", error_description="Malformed JWT"'
        );
      }
      
      if (!header.kid) {
        throw new TokenValidationError(
          'JWT header missing kid claim',
          'invalid_token',
          'Bearer error="invalid_token", error_description="Missing kid in JWT header"'
        );
      }
      
      console.log('[TokenValidator] Validating token with kid:', header.kid);
      
      // Step 2: Fetch public key
      const publicKey = await this.jwksClient.getPublicKey(header.kid);
      
      // Step 3: Verify signature and validate claims
      const { payload } = await jose.jwtVerify(token, publicKey, {
        issuer: this.config.expectedIssuer,
        audience: this.config.expectedAudience,
        clockTolerance: this.config.clockTolerance || 0
      });
      
      console.log('[TokenValidator] Token validation successful');
      console.log('[TokenValidator] Subject:', payload.sub);
      console.log('[TokenValidator] Scopes:', payload.scope);
      
      return {
        valid: true,
        payload
      };
      
    } catch (error: any) {
      return this.handleValidationError(error);
    }
  }
  
  /**
   * Handle validation errors and convert to standardized format
   * 
   * Maps jose errors to RFC 6750 error types
   */
  private handleValidationError(error: any): TokenValidationResult {
    console.error('[TokenValidator] Validation error:', error.message);
    
    // TokenValidationError (our custom errors)
    if (error instanceof TokenValidationError) {
      return {
        valid: false,
        error: {
          type: error.errorType,
          message: error.message,
          wwwAuthenticate: error.wwwAuthenticateChallenge
        }
      };
    }
    
    // jose.JWTExpired
    if (error.code === 'ERR_JWT_EXPIRED') {
      return {
        valid: false,
        error: {
          type: 'token_expired',
          message: 'Access token has expired',
          wwwAuthenticate: 'Bearer error="invalid_token", error_description="Token expired"'
        }
      };
    }
    
    // jose.JWTClaimValidationFailed
    if (error.code === 'ERR_JWT_CLAIM_VALIDATION_FAILED') {
      const claimName = error.claim;
      
      if (claimName === 'iss') {
        return {
          valid: false,
          error: {
            type: 'invalid_issuer',
            message: `Invalid issuer: expected ${this.config.expectedIssuer}`,
            wwwAuthenticate: 'Bearer error="invalid_token", error_description="Invalid issuer"'
          }
        };
      }
      
      if (claimName === 'aud') {
        return {
          valid: false,
          error: {
            type: 'invalid_audience',
            message: `Invalid audience: expected ${this.config.expectedAudience}`,
            wwwAuthenticate: 'Bearer error="invalid_token", error_description="Invalid audience"'
          }
        };
      }
      
      return {
        valid: false,
        error: {
          type: 'invalid_token',
          message: `JWT claim validation failed: ${claimName}`,
          wwwAuthenticate: `Bearer error="invalid_token", error_description="Invalid ${claimName} claim"`
        }
      };
    }
    
    // jose.JWSSignatureVerificationFailed
    if (error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
      return {
        valid: false,
        error: {
          type: 'invalid_signature',
          message: 'JWT signature verification failed',
          wwwAuthenticate: 'Bearer error="invalid_token", error_description="Invalid signature"'
        }
      };
    }
    
    // Generic error
    return {
      valid: false,
      error: {
        type: 'invalid_token',
        message: error.message || 'Token validation failed',
        wwwAuthenticate: 'Bearer error="invalid_token"'
      }
    };
  }
  
  /**
   * Quick validation (boolean result only)
   * 
   * Useful when you only need to know if token is valid
   * 
   * @param token - JWT access token
   * @returns true if valid, false otherwise
   */
  async isValid(token: string): Promise<boolean> {
    const result = await this.validate(token);
    return result.valid;
  }
  
  /**
   * Extract payload without full validation
   * 
   * WARNING: This does NOT verify the signature!
   * Only use for debugging or when signature is verified elsewhere.
   * 
   * @param token - JWT access token
   * @returns Decoded payload (unverified)
   */
  decodePayload(token: string): jose.JWTPayload {
    try {
      return jose.decodeJwt(token);
    } catch (error) {
      throw new TokenValidationError(
        'Failed to decode JWT payload',
        'invalid_token'
      );
    }
  }
}
```

### 4.3 Usage Example

```typescript
// Initialize validator
const jwksClient = new JWKSClient(/*...*/);
const validator = new TokenValidator(jwksClient, {
  expectedIssuer: 'http://localhost:8080/realms/oauth2-demo',
  expectedAudience: ['account', 'resource-server'],
  clockTolerance: 5 // 5 seconds tolerance for clock skew
});

// In middleware
const result = await validator.validate(token);

if (result.valid) {
  req.user = result.payload; // Attach to request
  next();
} else {
  res.status(401)
    .header('WWW-Authenticate', result.error.wwwAuthenticate)
    .json({
      error: result.error.type,
      error_description: result.error.message
    });
}
```

---

## 5. ScopeChecker Service

**File: `src/services/ScopeChecker.ts`**

### 5.1 Purpose

Enforce scope-based access control for protected endpoints per RFC 6750.

**Responsibilities:**
- Extract scopes from JWT payload
- Check if token contains required scope(s)
- Support AND/OR scope logic
- Provide detailed scope validation results

### 5.2 Class Definition

```typescript
import * as jose from 'jose';

/**
 * Scope validation error
 */
export class InsufficientScopeError extends Error {
  constructor(
    public readonly requiredScope: string | string[],
    public readonly providedScopes: string[]
  ) {
    super(`Insufficient scope: required ${JSON.stringify(requiredScope)}, provided ${JSON.stringify(providedScopes)}`);
    this.name = 'InsufficientScopeError';
  }
}

/**
 * Scope checker for fine-grained access control
 * 
 * Implements:
 * - RFC 6750 3.1: Error responses for insufficient scope
 * - OAuth 2.0 scope-based authorization
 * 
 * @remarks
 * ✅ MVP - Complete implementation required
 */
export class ScopeChecker {
  /**
   * Extract scopes from JWT payload
   * 
   * @param payload - JWT payload from validated token
   * @returns Array of scopes
   * 
   * @example
   * ```typescript
   * const scopes = ScopeChecker.extractScopes(payload);
   * // ["profile", "email", "openid"]
   * ```
   */
  static extractScopes(payload: jose.JWTPayload): string[] {
    // Scopes can be in 'scope' (space-separated string) or 'scp' (array)
    if (typeof payload.scope === 'string') {
      return payload.scope.split(' ').filter(Boolean);
    }
    
    if (Array.isArray(payload.scp)) {
      return payload.scp;
    }
    
    return [];
  }
  
  /**
   * Check if token has required scope (single scope)
   * 
   * @param payload - JWT payload
   * @param requiredScope - Required scope (e.g., "profile")
   * @returns true if scope present
   * 
   * @example
   * ```typescript
   * if (!ScopeChecker.hasScope(payload, 'profile')) {
   *   throw new InsufficientScopeError('profile', ScopeChecker.extractScopes(payload));
   * }
   * ```
   */
  static hasScope(payload: jose.JWTPayload, requiredScope: string): boolean {
    const scopes = this.extractScopes(payload);
    return scopes.includes(requiredScope);
  }
  
  /**
   * Check if token has ANY of the required scopes (OR logic)
   * 
   * @param payload - JWT payload
   * @param requiredScopes - Array of acceptable scopes
   * @returns true if token has at least one required scope
   * 
   * @example
   * ```typescript
   * // Token needs 'profile' OR 'email'
   * if (!ScopeChecker.hasAnyScope(payload, ['profile', 'email'])) {
   *   throw new InsufficientScopeError(['profile', 'email'], ScopeChecker.extractScopes(payload));
   * }
   * ```
   */
  static hasAnyScope(payload: jose.JWTPayload, requiredScopes: string[]): boolean {
    const tokenScopes = this.extractScopes(payload);
    return requiredScopes.some(required => tokenScopes.includes(required));
  }
  
  /**
   * Check if token has ALL required scopes (AND logic)
   * 
   * @param payload - JWT payload
   * @param requiredScopes - Array of required scopes (all must be present)
   * @returns true if token has all required scopes
   * 
   * @example
   * ```typescript
   * // Token needs 'profile' AND 'email'
   * if (!ScopeChecker.hasAllScopes(payload, ['profile', 'email'])) {
   *   throw new InsufficientScopeError(['profile', 'email'], ScopeChecker.extractScopes(payload));
   * }
   * ```
   */
  static hasAllScopes(payload: jose.JWTPayload, requiredScopes: string[]): boolean {
    const tokenScopes = this.extractScopes(payload);
    return requiredScopes.every(required => tokenScopes.includes(required));
  }
  
  /**
   * Require specific scope (throws if missing)
   * 
   * @param payload - JWT payload
   * @param requiredScope - Required scope
   * @throws InsufficientScopeError if scope missing
   * 
   * @example
   * ```typescript
   * try {
   *   ScopeChecker.requireScope(payload, 'profile');
   *   // Scope present, continue
   * } catch (error) {
   *   // Handle insufficient scope
   * }
   * ```
   */
  static requireScope(payload: jose.JWTPayload, requiredScope: string): void {
    if (!this.hasScope(payload, requiredScope)) {
      throw new InsufficientScopeError(requiredScope, this.extractScopes(payload));
    }
  }
  
  /**
   * Require any of the specified scopes (throws if none present)
   * 
   * @param payload - JWT payload
   * @param requiredScopes - Array of acceptable scopes
   * @throws InsufficientScopeError if no required scope present
   */
  static requireAnyScope(payload: jose.JWTPayload, requiredScopes: string[]): void {
    if (!this.hasAnyScope(payload, requiredScopes)) {
      throw new InsufficientScopeError(requiredScopes, this.extractScopes(payload));
    }
  }
  
  /**
   * Require all specified scopes (throws if any missing)
   * 
   * @param payload - JWT payload
   * @param requiredScopes - Array of required scopes
   * @throws InsufficientScopeError if any required scope missing
   */
  static requireAllScopes(payload: jose.JWTPayload, requiredScopes: string[]): void {
    if (!this.hasAllScopes(payload, requiredScopes)) {
      throw new InsufficientScopeError(requiredScopes, this.extractScopes(payload));
    }
  }
}
```

### 5.3 Usage Example

```typescript
// In route handler
app.get('/api/protected/profile', verifyToken, (req, res) => {
  try {
    // Require 'profile' scope
    ScopeChecker.requireScope(req.user, 'profile');
    
    // Scope validated, return data
    res.json({
      user_id: req.user.sub,
      profile: { /* ... */ }
    });
    
  } catch (error) {
    if (error instanceof InsufficientScopeError) {
      res.status(403)
        .header('WWW-Authenticate', `Bearer error="insufficient_scope", scope="${error.requiredScope}"`)
        .json({
          error: 'insufficient_scope',
          error_description: error.message,
          required_scope: error.requiredScope,
          provided_scopes: error.providedScopes
        });
    } else {
      throw error;
    }
  }
});
```

---

## 6. ResponseFormatter Service

**File: `src/services/ResponseFormatter.ts`**

### 6.1 Purpose

Standardize API responses for consistency across all endpoints.

### 6.2 Class Definition

```typescript
import { Response } from 'express';

/**
 * Standardized API response formats
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  error_description: string;
  timestamp: string;
  details?: any;
}

/**
 * Response formatter for consistent API responses
 * 
 * @remarks
 * ✅ MVP - Complete implementation required
 */
export class ResponseFormatter {
  /**
   * Format success response
   * 
   * @param res - Express response object
   * @param data - Response data
   * @param statusCode - HTTP status code (default: 200)
   * 
   * @example
   * ```typescript
   * ResponseFormatter.success(res, {
   *   user_id: "user-123",
   *   message: "Access granted"
   * });
   * ```
   */
  static success<T>(res: Response, data: T, statusCode: number = 200): void {
    const response: SuccessResponse<T> = {
      success: true,
      data,
      timestamp: new Date().toISOString()
    };
    
    res.status(statusCode).json(response);
  }
  
  /**
   * Format error response (401 Unauthorized)
   * 
   * @param res - Express response object
   * @param error - Error type (e.g., "invalid_token")
   * @param description - Human-readable description
   * @param wwwAuthenticate - WWW-Authenticate header value
   * 
   * @example
   * ```typescript
   * ResponseFormatter.unauthorized(res, 'invalid_token', 'Token expired');
   * ```
   */
  static unauthorized(
    res: Response,
    error: string,
    description: string,
    wwwAuthenticate?: string
  ): void {
    const response: ErrorResponse = {
      success: false,
      error,
      error_description: description,
      timestamp: new Date().toISOString()
    };
    
    if (wwwAuthenticate) {
      res.header('WWW-Authenticate', wwwAuthenticate);
    }
    
    res.status(401).json(response);
  }
  
  /**
   * Format error response (403 Forbidden - Insufficient Scope)
   * 
   * @param res - Express response object
   * @param requiredScope - Required scope(s)
   * @param providedScopes - Scopes in the token
   * 
   * @example
   * ```typescript
   * ResponseFormatter.insufficientScope(res, 'profile', ['email', 'openid']);
   * ```
   */
  static insufficientScope(
    res: Response,
    requiredScope: string | string[],
    providedScopes: string[]
  ): void {
    const scopeStr = Array.isArray(requiredScope) ? requiredScope.join(' ') : requiredScope;
    
    const response: ErrorResponse = {
      success: false,
      error: 'insufficient_scope',
      error_description: `This endpoint requires scope: ${scopeStr}`,
      timestamp: new Date().toISOString(),
      details: {
        required_scope: requiredScope,
        provided_scopes: providedScopes
      }
    };
    
    res.status(403)
      .header('WWW-Authenticate', `Bearer error="insufficient_scope", scope="${scopeStr}"`)
      .json(response);
  }
  
  /**
   * Format error response (500 Internal Server Error)
   * 
   * @param res - Express response object
   * @param error - Error message
   * 
   * @example
   * ```typescript
   * ResponseFormatter.internalError(res, 'JWKS fetch failed');
   * ```
   */
  static internalError(res: Response, error: string): void {
    const response: ErrorResponse = {
      success: false,
      error: 'server_error',
      error_description: 'An internal server error occurred',
      timestamp: new Date().toISOString()
    };
    
    // Log the actual error but don't expose details to client
    console.error('[ResponseFormatter] Internal error:', error);
    
    res.status(500).json(response);
  }
}
```

### 6.3 Usage Example

```typescript
// Success response
ResponseFormatter.success(res, {
  user_id: 'user-123',
  email: 'alice@example.com',
  message: 'Access granted'
});

// Unauthorized (token expired)
ResponseFormatter.unauthorized(
  res,
  'invalid_token',
  'Access token has expired',
  'Bearer error="invalid_token", error_description="Token expired"'
);

// Insufficient scope
ResponseFormatter.insufficientScope(
  res,
  'profile',
  ['email', 'openid']
);

// Internal error
ResponseFormatter.internalError(res, 'JWKS fetch failed');
```

---

## 7. Implementation Checklist

```
✅ = MVP Required
⚠️ = Nice to Have
❌ = Phase 2+

Service Implementation:

[ ] JWKSClient
    [ ] Constructor with JWKS URI and cache duration
    [ ] getJWKS() - Fetch with caching
    [ ] getKey(kid) - Find key by ID
    [ ] getPublicKey(kid) - Convert to jose KeyLike
    [ ] clearCache() - Manual cache clear
    [ ] getCacheStatus() - Debug helper
    [ ] Error handling for network failures
    [ ] Logging for cache hits/misses

[ ] TokenValidator
    [ ] Constructor with JWKS client and config
    [ ] validate(token) - Full validation pipeline
    [ ] isValid(token) - Boolean result
    [ ] decodePayload(token) - Unverified decode
    [ ] handleValidationError() - Error mapping
    [ ] Support for exp, nbf, iss, aud claims
    [ ] WWW-Authenticate header generation
    [ ] Logging for validation steps

[ ] ScopeChecker
    [ ] extractScopes(payload) - Get scopes array
    [ ] hasScope(payload, scope) - Single scope check
    [ ] hasAnyScope(payload, scopes) - OR logic
    [ ] hasAllScopes(payload, scopes) - AND logic
    [ ] requireScope(payload, scope) - Throw if missing
    [ ] requireAnyScope(payload, scopes)
    [ ] requireAllScopes(payload, scopes)
    [ ] InsufficientScopeError class

[ ] ResponseFormatter
    [ ] success(res, data) - 200 OK
    [ ] unauthorized(res, error, desc) - 401
    [ ] insufficientScope(res, required, provided) - 403
    [ ] internalError(res, error) - 500
    [ ] Consistent timestamp inclusion
    [ ] WWW-Authenticate header support

[ ] Testing
    [ ] Unit tests for each service
    [ ] Mock JWKS responses
    [ ] Token validation edge cases
    [ ] Scope checking logic
    [ ] Response format validation
```

---

**Next Steps:** Continue to [mock-resource-server-implementation-guide.md](mock-resource-server-implementation-guide.md#1-middleware-implementation) to implement the Express middleware that uses these services.
