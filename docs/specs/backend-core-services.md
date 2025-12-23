# AuthOptics Backend - Core Services

## Document Information

| Property | Value |
|----------|-------|
| **Component** | packages/backend/src/services |
| **Purpose** | Core business logic services for OAuth2/OIDC flows |
| **Status** | ✅ MVP Critical |
| **Parent Doc** | [backend-specification.md](auth-optics-backend-specification.md) |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Service Architecture](#2-service-architecture)
3. [OAuth2Client Service](#3-oauth2client-service)
4. [PKCEGenerator Service](#4-pkcegenerator-service)
5. [StateManager Service](#5-statemanager-service)
6. [FlowOrchestrator Service](#6-floworchestrator-service)
7. [FlowStateManager Service](#7-flowstatemanager-service)
8. [HttpCaptureService](#8-httpcaptureservice)
9. [SecurityAssessor Service](#9-securityassessor-service)
10. [VulnerabilityManager Service](#10-vulnerabilitymanager-service)

---

## 1. Overview

### 1.1 Purpose

Core services implement the business logic for OAuth2/OIDC flows. Each service has a focused responsibility:

| Service | Responsibility | MVP Status |
|---------|---------------|------------|
| **OAuth2Client** | Protocol implementation (RFC 6749, 7636) | ✅ MVP |
| **PKCEGenerator** | PKCE code verifier/challenge generation | ✅ MVP |
| **StateManager** | CSRF protection with state parameters | ✅ MVP |
| **FlowOrchestrator** | Multi-step flow coordination | ✅ MVP |
| **FlowStateManager** | In-memory flow state storage | ✅ MVP |
| **HttpCaptureService** | Request/response capture | ✅ MVP |
| **SecurityAssessor** | Security scoring and assessment | ✅ MVP |
| **VulnerabilityManager** | Educational vulnerability modes | ⚠️ MVP (DISABLE_PKCE only) |

### 1.2 Service Dependencies

```
FlowOrchestrator
    ├── FlowStateManager
    ├── OAuth2Client
    │   ├── PKCEGenerator
    │   ├── StateManager
    │   └── HttpCaptureService
    ├── SecurityAssessor
    └── VulnerabilityManager
```

---

## 2. Service Architecture

### 2.1 Directory Structure

```
src/services/
├── index.ts                    # Barrel export
├── OAuth2Client.ts             # ✅ MVP - 200-250 lines
├── PKCEGenerator.ts            # ✅ MVP - 100-150 lines
├── StateManager.ts             # ✅ MVP - 100-150 lines
├── FlowOrchestrator.ts         # ✅ MVP - 300-400 lines
├── FlowStateManager.ts         # ✅ MVP - 150-200 lines
├── HttpCaptureService.ts       # ✅ MVP - 100-150 lines
├── SecurityAssessor.ts         # ✅ MVP - 150-200 lines
└── VulnerabilityManager.ts     # ⚠️ MVP - 50-100 lines (basic)
```

### 2.2 Service Patterns

All services follow these patterns:

1. **Constructor Injection** - Dependencies injected via constructor
2. **TypeScript Strict Mode** - No `any` types
3. **Error Handling** - Throw errors with descriptive messages
4. **Immutability** - Return new objects, don't mutate inputs
5. **Single Responsibility** - Each service has one clear purpose

---

## 3. OAuth2Client Service

**File: `src/services/OAuth2Client.ts`**

### 3.1 Purpose

Core OAuth2 protocol implementation following RFC 6749 (OAuth 2.0) and RFC 7636 (PKCE).

**Responsibilities:**
- Generate authorization URLs with PKCE and state
- Exchange authorization codes for tokens
- Validate state parameters
- Handle client authentication
- Capture all HTTP interactions

### 3.2 Class Definition

```typescript
import { 
  ClientConfig, 
  ServerConfig, 
  VulnerabilityConfig,
  AuthorizationRequest,
  TokenResponse,
  PKCEParams,
  StateParam,
  HttpRequest,
  HttpResponse
} from '@auth-optics/shared';
import axios from 'axios';
import { PKCEGenerator } from './PKCEGenerator';
import { StateManager } from './StateManager';
import { HttpCaptureService } from './HttpCaptureService';

/**
 * OAuth2 client implementation with PKCE support
 * 
 * Implements:
 * - RFC 6749 §4.1: Authorization Code Grant
 * - RFC 7636: Proof Key for Code Exchange
 * 
 * @remarks
 * ✅ MVP - Complete implementation required
 */
export class OAuth2Client {
  private clientConfig: ClientConfig;
  private serverConfig: ServerConfig;
  private vulnerabilityConfig: VulnerabilityConfig;
  private pkceGenerator: PKCEGenerator;
  private stateManager: StateManager;
  private httpCapture: HttpCaptureService;
  
  constructor(
    clientConfig: ClientConfig,
    serverConfig: ServerConfig,
    vulnerabilityConfig: VulnerabilityConfig
  ) {
    this.clientConfig = clientConfig;
    this.serverConfig = serverConfig;
    this.vulnerabilityConfig = vulnerabilityConfig;
    this.pkceGenerator = new PKCEGenerator();
    this.stateManager = new StateManager();
    this.httpCapture = new HttpCaptureService();
  }
  
  /**
   * Generate authorization URL for Authorization Code Flow
   * 
   * Implements RFC 6749 §4.1.1 (Authorization Request) and
   * RFC 7636 §4.3 (Code Challenge Creation).
   * 
   * @param flowId - Unique flow identifier
   * @param additionalParams - Additional parameters (e.g., nonce for OIDC)
   * @returns Authorization URL and flow metadata
   * 
   * @example
   * ```typescript
   * const { url, pkceParams, stateParam } = 
   *   await client.generateAuthorizationUrl('flow-123', { nonce: 'abc123' });
   * 
   * // url: "https://auth.example.com/authorize?response_type=code&client_id=..."
   * // pkceParams: { codeVerifier: "...", codeChallenge: "...", ... }
   * // stateParam: { value: "...", flowId: "flow-123", ... }
   * ```
   */
  async generateAuthorizationUrl(
    flowId: string,
    additionalParams?: Record<string, string>
  ): Promise<{
    url: string;
    pkceParams?: PKCEParams;
    stateParam: StateParam;
  }> {
    // Generate PKCE parameters (unless disabled by vulnerability mode)
    const pkceParams = this.shouldUsePKCE() 
      ? await this.pkceGenerator.generate()
      : undefined;
    
    // Generate state parameter (always required for CSRF protection)
    const stateParam = this.stateManager.generate(flowId);
    
    // Build authorization request parameters (RFC 6749 §4.1.1)
    const authRequest: AuthorizationRequest = {
      response_type: 'code',
      client_id: this.clientConfig.clientId,
      redirect_uri: this.clientConfig.defaultRedirectUri!,
      scope: this.clientConfig.scopes.join(' '),
      state: stateParam.value,
      ...additionalParams
    };
    
    // Add PKCE parameters if enabled (RFC 7636 §4.3)
    if (pkceParams) {
      authRequest.code_challenge = pkceParams.codeChallenge;
      authRequest.code_challenge_method = pkceParams.codeChallengeMethod;
    }
    
    // Build authorization URL
    const url = new URL(this.serverConfig.authorizationEndpoint);
    Object.entries(authRequest).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
    
    return {
      url: url.toString(),
      pkceParams,
      stateParam
    };
  }
  
  /**
   * Exchange authorization code for tokens
   * 
   * Implements RFC 6749 §4.1.3 (Access Token Request) and
   * RFC 7636 §4.5 (Code Verifier).
   * 
   * @param code - Authorization code from callback
   * @param codeVerifier - PKCE code verifier (if PKCE was used)
   * @returns Token response with access_token, refresh_token, id_token, etc.
   * @throws Error if token exchange fails
   * 
   * @example
   * ```typescript
   * try {
   *   const tokens = await client.exchangeCodeForTokens(
   *     'authorization_code_here',
   *     'pkce_verifier_here'
   *   );
   *   
   *   console.log(tokens.access_token);
   *   console.log(tokens.token_type);  // "Bearer"
   * } catch (error) {
   *   console.error('Token exchange failed:', error);
   * }
   * ```
   */
  async exchangeCodeForTokens(
    code: string,
    codeVerifier?: string
  ): Promise<TokenResponse> {
    // Build token request (RFC 6749 §4.1.3)
    const tokenRequest = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.clientConfig.defaultRedirectUri!,
      client_id: this.clientConfig.clientId,
      ...(codeVerifier && { code_verifier: codeVerifier })
    };
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };
    
    // Add client authentication if client secret exists (RFC 6749 §2.3.1)
    if (this.clientConfig.clientSecret) {
      // Use HTTP Basic authentication for confidential clients
      const credentials = Buffer.from(
        `${this.clientConfig.clientId}:${this.clientConfig.clientSecret}`
      ).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    }
    
    // Capture HTTP request for visualization
    const capturedRequest = this.httpCapture.prepareRequest({
      method: 'POST',
      url: this.serverConfig.tokenEndpoint,
      headers,
      body: tokenRequest
    });
    
    try {
      // Make token request
      const response = await axios.post(
        this.serverConfig.tokenEndpoint,
        new URLSearchParams(tokenRequest).toString(),
        { headers }
      );
      
      // Capture successful response
      this.httpCapture.captureResponse(capturedRequest.id, response);
      
      return response.data as TokenResponse;
      
    } catch (error) {
      // Capture error response for debugging
      if (axios.isAxiosError(error) && error.response) {
        this.httpCapture.captureResponse(capturedRequest.id, error.response);
      }
      throw error;
    }
  }
  
  /**
   * Validate state parameter from callback
   * 
   * Implements RFC 6749 §10.12 (CSRF protection).
   * 
   * @param receivedState - State parameter from callback
   * @param flowId - Flow identifier to validate against
   * @throws Error if state validation fails
   * 
   * @example
   * ```typescript
   * try {
   *   client.validateState('received_state_123', 'flow-123');
   *   console.log('State is valid');
   * } catch (error) {
   *   console.error('State validation failed - possible CSRF attack');
   * }
   * ```
   */
  validateState(receivedState: string, flowId: string): void {
    const result = this.stateManager.validate(receivedState, flowId);
    
    if (!result.valid) {
      throw new Error(`State validation failed: ${result.error}`);
    }
  }
  
  /**
   * Check if PKCE should be used
   * 
   * @returns true if PKCE should be used, false if disabled by vulnerability mode
   * @private
   */
  private shouldUsePKCE(): boolean {
    return !this.vulnerabilityConfig.toggles.DISABLE_PKCE;
  }
}
```

### 3.3 Implementation Notes

**PKCE Decision Logic:**
```typescript
// PKCE is used unless explicitly disabled
const usePKCE = !vulnerabilityConfig.toggles.DISABLE_PKCE;
```

**Client Authentication Methods:**
- **Confidential clients** (with secret): HTTP Basic Auth
- **Public clients** (no secret): client_id in body only

**Error Handling:**
- All axios errors are captured for visualization
- Errors are re-thrown after capture
- OAuth2 error responses are preserved

---

## 4. PKCEGenerator Service

**File: `src/services/PKCEGenerator.ts`**

### 4.1 Purpose

Generate and validate PKCE (Proof Key for Code Exchange) parameters per RFC 7636.

**Responsibilities:**
- Generate cryptographically random code verifiers
- Compute SHA-256 code challenges
- Base64URL encoding
- Validate PKCE parameters

### 4.2 Class Definition

```typescript
import { PKCEParams, PKCEValidationResult } from '@auth-optics/shared';
import * as crypto from 'crypto';

/**
 * PKCE (Proof Key for Code Exchange) parameter generator
 * 
 * Implements RFC 7636 for securing authorization code flow.
 * 
 * @remarks
 * ✅ MVP - Complete implementation required
 * 
 * PKCE prevents authorization code interception attacks by binding the
 * authorization code to the client that requested it.
 */
export class PKCEGenerator {
  /**
   * Generate PKCE parameters
   * 
   * Creates a random code verifier and computes its SHA-256 challenge.
   * 
   * @returns PKCE code verifier and challenge
   * 
   * @example
   * ```typescript
   * const generator = new PKCEGenerator();
   * const pkce = await generator.generate();
   * 
   * console.log(pkce.codeVerifier);  // 43 character random string
   * console.log(pkce.codeChallenge);  // Base64URL-encoded SHA-256 hash
   * console.log(pkce.codeChallengeMethod);  // "S256"
   * ```
   */
  async generate(): Promise<PKCEParams> {
    // Generate code verifier (43-128 characters, RFC 7636 §4.1)
    const codeVerifier = this.generateCodeVerifier();
    
    // Generate code challenge using S256 method (RFC 7636 §4.2)
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    
    return {
      codeVerifier,
      codeChallenge,
      codeChallengeMethod: 'S256',
      generatedAt: new Date().toISOString()
    };
  }
  
  /**
   * Validate PKCE code verifier against challenge
   * 
   * Used by authorization servers to validate that the code verifier
   * matches the challenge sent in the authorization request.
   * 
   * @param codeVerifier - Code verifier from token request
   * @param codeChallenge - Code challenge from authorization request
   * @param method - Challenge method ('S256' or 'plain')
   * @returns Validation result with success/failure details
   * 
   * @example
   * ```typescript
   * const result = await generator.validate(
   *   'verifier_from_client',
   *   'challenge_from_authz_request',
   *   'S256'
   * );
   * 
   * if (result.valid) {
   *   console.log('PKCE validation successful');
   * } else {
   *   console.error('PKCE validation failed:', result.error);
   * }
   * ```
   */
  async validate(
    codeVerifier: string,
    codeChallenge: string,
    method: 'S256' | 'plain'
  ): Promise<PKCEValidationResult> {
    // Validate code verifier format (RFC 7636 §4.1)
    if (!this.isValidCodeVerifier(codeVerifier)) {
      return {
        valid: false,
        error: 'Invalid code verifier format (must be 43-128 chars, [A-Za-z0-9-._~])'
      };
    }
    
    // Compute expected challenge
    const expectedChallenge = method === 'S256'
      ? await this.generateCodeChallenge(codeVerifier)
      : codeVerifier;
    
    // Constant-time comparison to prevent timing attacks
    const valid = crypto.timingSafeEqual(
      Buffer.from(expectedChallenge),
      Buffer.from(codeChallenge)
    );
    
    return {
      valid,
      codeVerifier,
      expectedChallenge,
      receivedChallenge: codeChallenge,
      method,
      ...(valid ? {} : { error: 'Code challenge mismatch' })
    };
  }
  
  /**
   * Generate cryptographically random code verifier
   * 
   * RFC 7636 §4.1: code verifier is a random string of 43-128 characters
   * using unreserved characters [A-Z, a-z, 0-9, -, ., _, ~]
   * 
   * @returns Base64URL-encoded random string (43 characters)
   * @private
   */
  private generateCodeVerifier(): string {
    // Generate 32 random bytes (256 bits of entropy)
    const buffer = crypto.randomBytes(32);
    
    // Base64URL encode (results in 43 characters)
    return this.base64UrlEncode(buffer);
  }
  
  /**
   * Generate code challenge from verifier using S256 method
   * 
   * RFC 7636 §4.2: code challenge = BASE64URL(SHA256(code verifier))
   * 
   * @param codeVerifier - Code verifier
   * @returns Base64URL-encoded SHA-256 hash
   * @private
   */
  private async generateCodeChallenge(codeVerifier: string): Promise<string> {
    // SHA-256 hash
    const hash = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest();
    
    // Base64URL encode
    return this.base64UrlEncode(hash);
  }
  
  /**
   * Validate code verifier format
   * 
   * @param verifier - Code verifier to validate
   * @returns true if valid format
   * @private
   */
  private isValidCodeVerifier(verifier: string): boolean {
    // RFC 7636 §4.1: 43-128 characters, [A-Z, a-z, 0-9, -, ., _, ~]
    const validChars = /^[A-Za-z0-9\-._~]{43,128}$/;
    return validChars.test(verifier);
  }
  
  /**
   * Base64URL encode (RFC 4648 §5)
   * 
   * Standard Base64 encoding with:
   * - '+' replaced by '-'
   * - '/' replaced by '_'
   * - Padding '=' characters removed
   * 
   * @param buffer - Buffer to encode
   * @returns Base64URL-encoded string
   * @private
   */
  private base64UrlEncode(buffer: Buffer): string {
    return buffer
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
}
```

### 4.3 Implementation Notes

**Why S256 Only?**
- `plain` method offers no protection (code challenge == code verifier)
- `S256` is now required by OAuth Security BCP (draft-ietf-oauth-security-topics)
- All modern implementations should use `S256`

**Code Verifier Length:**
- RFC 7636 allows 43-128 characters
- We use 43 (from 32 random bytes) for consistency
- Longer provides no additional security (256 bits is sufficient)

**Security Considerations:**
- Use `crypto.randomBytes()` for cryptographic randomness
- Use `crypto.timingSafeEqual()` for constant-time comparison
- Never log code verifiers (they're secrets!)

---

## 5. StateManager Service

**File: `src/services/StateManager.ts`**

### 5.1 Purpose

Manage state parameters for CSRF (Cross-Site Request Forgery) protection per RFC 6749 §10.12.

**Responsibilities:**
- Generate cryptographically random state values
- Store state parameters with expiration
- Validate state parameters in callbacks
- Enforce single-use (replay protection)
- Bind state to specific flows

### 5.2 Class Definition

```typescript
import { StateParam, StateValidationResult } from '@auth-optics/shared';
import * as crypto from 'crypto';

/**
 * State parameter manager for CSRF protection
 * 
 * Implements RFC 6749 §10.12 state parameter requirements.
 * 
 * @remarks
 * ✅ MVP - Complete implementation required
 * 
 * The state parameter protects against CSRF attacks by ensuring that
 * the authorization callback came from a request initiated by this client.
 */
export class StateManager {
  private states: Map<string, StateParam> = new Map();
  private readonly STATE_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutes
  
  /**
   * Generate state parameter
   * 
   * Creates a cryptographically random state value and stores it
   * with an expiration time and flow binding.
   * 
   * @param flowId - Associated flow ID for binding
   * @returns State parameter with value and metadata
   * 
   * @example
   * ```typescript
   * const manager = new StateManager();
   * const state = manager.generate('flow-123');
   * 
   * console.log(state.value);  // Random 43-char string
   * console.log(state.flowId);  // "flow-123"
   * console.log(state.expiresAt);  // ISO timestamp
   * ```
   */
  generate(flowId: string): StateParam {
    // Generate cryptographically random state value (256 bits)
    const value = crypto.randomBytes(32).toString('base64url');
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.STATE_EXPIRATION_MS);
    
    const stateParam: StateParam = {
      value,
      generatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      flowId,
      used: false
    };
    
    // Store state for validation
    this.states.set(value, stateParam);
    
    // Schedule automatic cleanup
    setTimeout(() => this.states.delete(value), this.STATE_EXPIRATION_MS);
    
    return stateParam;
  }
  
  /**
   * Validate state parameter
   * 
   * Validates state from OAuth callback against stored state.
   * Checks for:
   * - Existence (not expired/unknown)
   * - Single-use (not already used)
   * - Flow binding (matches expected flow)
   * - Expiration (not too old)
   * 
   * @param receivedState - State from callback
   * @param flowId - Expected flow ID
   * @returns Validation result with success/failure details
   * 
   * @example
   * ```typescript
   * const result = manager.validate('state_from_callback', 'flow-123');
   * 
   * if (result.valid) {
   *   console.log('State validated successfully');
   * } else {
   *   console.error('State validation failed:', result.error);
   *   // Possible CSRF attack!
   * }
   * ```
   */
  validate(receivedState: string, flowId: string): StateValidationResult {
    // Check 1: Does state exist?
    const storedState = this.states.get(receivedState);
    
    if (!storedState) {
      return {
        valid: false,
        received: receivedState,
        error: 'State not found - possible CSRF attack or expired state'
      };
    }
    
    // Check 2: Already used? (replay protection)
    if (storedState.used) {
      return {
        valid: false,
        expected: storedState.value,
        received: receivedState,
        wasAlreadyUsed: true,
        error: 'State already used - possible replay attack'
      };
    }
    
    // Check 3: Expired?
    const now = new Date();
    const expiresAt = new Date(storedState.expiresAt!);
    
    if (now > expiresAt) {
      this.states.delete(receivedState);
      return {
        valid: false,
        expected: storedState.value,
        received: receivedState,
        isExpired: true,
        error: 'State expired'
      };
    }
    
    // Check 4: Flow binding correct?
    if (storedState.flowId !== flowId) {
      return {
        valid: false,
        expected: storedState.value,
        received: receivedState,
        error: 'State bound to different flow'
      };
    }
    
    // All checks passed - mark as used
    storedState.used = true;
    
    // Cleanup after short delay (allows for error handling)
    setTimeout(() => this.states.delete(receivedState), 5000);
    
    return {
      valid: true,
      expected: storedState.value,
      received: receivedState
    };
  }
  
  /**
   * Clean up expired states
   * 
   * Should be called periodically to prevent memory leaks.
   * 
   * @example
   * ```typescript
   * // Run cleanup every 5 minutes
   * setInterval(() => manager.cleanupExpired(), 5 * 60 * 1000);
   * ```
   */
  cleanupExpired(): void {
    const now = new Date();
    
    for (const [value, state] of this.states.entries()) {
      const expiresAt = new Date(state.expiresAt!);
      if (now > expiresAt) {
        this.states.delete(value);
      }
    }
  }
  
  /**
   * Get number of active states (for monitoring)
   */
  getActiveCount(): number {
    return this.states.size;
  }
}
```

### 5.3 Implementation Notes

**State Expiration:**
- Default: 10 minutes (configurable)
- Balances security (short) vs UX (long enough for login)
- OAuth Security BCP recommends 10 minutes

**Single-Use Enforcement:**
- State marked as `used` immediately after successful validation
- Prevents replay attacks
- Deleted after 5-second grace period

**Flow Binding:**
- State is bound to specific `flowId`
- Prevents state from being used for different flow
- Additional layer of security

**Memory Management:**
- States stored in Map (fast O(1) lookup)
- Automatic cleanup via `setTimeout`
- Periodic `cleanupExpired()` for safety

---

## 6. FlowOrchestrator Service

**File: `src/services/FlowOrchestrator.ts`**

### 6.1 Purpose

Coordinate multi-step OAuth2 flows and emit real-time events via Server-Sent Events (SSE).

**Responsibilities:**
- Orchestrate Authorization Code Flow steps
- Manage flow lifecycle (start, callback, complete, error)
- Emit SSE events for frontend updates
- Integrate all other services
- Handle errors gracefully

### 6.2 Flow Steps

The Flow Orchestrator coordinates these steps:

1. **Authorization Request** - Generate authorization URL
2. **Authorization Response** - Record callback from IdP
3. **Token Request** - Exchange code for tokens
4. **Token Validation** - Validate JWT signatures/claims
5. **Security Assessment** - Score flow security

### 6.3 Class Definition

```typescript
import {
  FlowExecution,
  FlowType,
  FlowStatus,
  FlowStep,
  StepStatus,
  ClientConfig,
  ServerConfig,
  VulnerabilityConfig,
  SecurityIndicator,
  SecurityIndicatorType,
  SecurityIndicatorStatus,
  SecurityIndicatorVariant,
  HttpRequest,
  HttpResponse,
  HttpMethod
} from '@auth-optics/shared';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { OAuth2Client } from './OAuth2Client';
import { FlowStateManager } from './FlowStateManager';
import { TokenValidator } from './TokenValidator';
import { SecurityAssessor } from './SecurityAssessor';

/**
 * OAuth2 flow orchestrator
 * 
 * Coordinates multi-step authentication flows and emits real-time events.
 * 
 * @remarks
 * ✅ MVP - Complete implementation required
 * 
 * Events emitted:
 * - 'flow:started' - When flow begins
 * - 'step:started' - When step begins
 * - 'step:complete' - When step completes
 * - 'flow:complete' - When flow completes
 * - 'flow:error' - When flow errors
 * - 'security:assessed' - When security assessed
 */
export class FlowOrchestrator extends EventEmitter {
  private stateManager: FlowStateManager;
  private securityAssessor: SecurityAssessor;
  
  constructor(stateManager: FlowStateManager) {
    super();
    this.stateManager = stateManager;
    this.securityAssessor = new SecurityAssessor();
  }
  
  /**
   * Start Authorization Code Flow with PKCE
   * 
   * Initiates a new OAuth2 authorization code flow.
   * Generates authorization URL and emits events.
   * 
   * @param clientConfig - OAuth2 client configuration
   * @param serverConfig - Authorization server configuration
   * @param vulnerabilityConfig - Vulnerability mode settings
   * @returns Flow execution instance
   * 
   * @example
   * ```typescript
   * orchestrator.on('step:complete', ({ flowId, step }) => {
   *   console.log(`Step ${step.stepNumber} complete:`, step.name);
   * });
   * 
   * const flow = await orchestrator.startAuthorizationCodeFlow(
   *   clientConfig,
   *   serverConfig,
   *   vulnerabilityConfig
   * );
   * 
   * console.log('Authorization URL:', flow.steps[0].request.url);
   * ```
   */
  async startAuthorizationCodeFlow(
    clientConfig: ClientConfig,
    serverConfig: ServerConfig,
    vulnerabilityConfig: VulnerabilityConfig
  ): Promise<FlowExecution> {
    const flowId = uuidv4();
    const startedAt = new Date().toISOString();
    
    // Create flow execution
    const flow: FlowExecution = {
      id: flowId,
      flowType: FlowType.AUTHORIZATION_CODE_PKCE,
      status: FlowStatus.RUNNING,
      startedAt,
      steps: [],
      config: {
        client: clientConfig,
        server: serverConfig,
        vulnerability: vulnerabilityConfig
      }
    };
    
    // Store flow
    this.stateManager.createFlow(flow);
    
    // Emit flow started event
    this.emit('flow:started', flow);
    
    try {
      // Step 1: Generate authorization URL
      await this.executeAuthorizationRequest(flow);
      
      // Flow is now waiting for user authorization
      // (callback will be handled separately via handleCallback)
      
      return this.stateManager.getFlow(flowId)!;
      
    } catch (error) {
      return this.handleFlowError(flowId, error, 1);
    }
  }
  
  /**
   * Execute authorization request step
   * 
   * Generates authorization URL with PKCE and state parameters.
   * 
   * @param flow - Flow execution
   * @private
   */
  private async executeAuthorizationRequest(
    flow: FlowExecution
  ): Promise<void> {
    const stepNumber = 1;
    const stepStartTime = new Date();
    
    // Create step
    const step: FlowStep = {
      stepNumber,
      name: 'Authorization Request',
      description: 'Generate authorization URL with PKCE parameters',
      status: StepStatus.RUNNING,
      startedAt: stepStartTime.toISOString(),
      metadata: {
        isUserInteractive: true,
        isExternalRedirect: true,
        rfcReferences: [
          {
            rfcNumber: '6749',
            section: '4.1.1',
            description: 'Authorization Request',
            url: 'https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.1'
          },
          {
            rfcNumber: '7636',
            section: '4.3',
            description: 'Client Creates the Code Challenge',
            url: 'https://datatracker.ietf.org/doc/html/rfc7636#section-4.3'
          }
        ]
      }
    };
    
    // Add step to flow
    this.stateManager.addStep(flow.id, step);
    this.emit('step:started', { flowId: flow.id, step });
    
    // Create OAuth2 client
    const oauth2Client = new OAuth2Client(
      flow.config.client,
      flow.config.server,
      flow.config.vulnerability!
    );
    
    // Generate authorization URL
    const { url, pkceParams, stateParam } = 
      await oauth2Client.generateAuthorizationUrl(flow.id, {
        nonce: uuidv4() // OIDC nonce for ID token replay protection
      });
    
    // Store PKCE and state for later validation
    this.stateManager.storePKCE(flow.id, pkceParams);
    this.stateManager.storeState(flow.id, stateParam);
    
    // Capture request (authorization URL as GET request)
    const request: HttpRequest = {
      id: uuidv4(),
      method: HttpMethod.GET,
      url,
      headers: {},
      sentAt: new Date().toISOString()
    };
    
    // Complete step
    const stepEndTime = new Date();
    step.status = StepStatus.COMPLETE;
    step.completedAt = stepEndTime.toISOString();
    step.duration = stepEndTime.getTime() - stepStartTime.getTime();
    step.request = request;
    
    // Generate security indicators
    step.securityIndicators = this.generateStepSecurityIndicators(
      step,
      flow.config.vulnerability!
    );
    
    // Update flow
    this.stateManager.updateStep(flow.id, stepNumber, step);
    this.emit('step:complete', { flowId: flow.id, step });
  }
  
  /**
   * Handle OAuth2 callback
   * 
   * Called when user completes authentication and IdP redirects back.
   * Executes remaining flow steps (token exchange, validation, assessment).
   * 
   * @param flowId - Flow identifier
   * @param code - Authorization code
   * @param state - State parameter
   * @returns Updated flow execution
   * 
   * @example
   * ```typescript
   * // In callback route handler:
   * const flow = await orchestrator.handleCallback(
   *   flowId,
   *   req.query.code,
   *   req.query.state
   * );
   * 
   * if (flow.status === FlowStatus.COMPLETE) {
   *   console.log('Flow completed successfully');
   *   console.log('Access token:', flow.tokens?.access_token);
   * }
   * ```
   */
  async handleCallback(
    flowId: string,
    code: string,
    state: string
  ): Promise<FlowExecution> {
    const flow = this.stateManager.getFlow(flowId);
    
    if (!flow) {
      throw new Error(`Flow not found: ${flowId}`);
    }
    
    try {
      // Step 2: Authorization Response (record callback)
      await this.recordAuthorizationResponse(flow, code, state);
      
      // Step 3: Token Request (exchange code for tokens)
      await this.executeTokenRequest(flow, code);
      
      // Step 4: Token Validation (validate JWT signatures/claims)
      await this.executeTokenValidation(flow);
      
      // Step 5: Security Assessment (score flow security)
      await this.executeSecurityAssessment(flow);
      
      // Mark flow as complete
      this.completeFlow(flow);
      
      return flow;
      
    } catch (error) {
      return this.handleFlowError(flowId, error, flow.steps.length + 1);
    }
  }
  
  /**
   * Record authorization response step
   * 
   * Validates state parameter and records the authorization code receipt.
   * 
   * @param flow - Flow execution
   * @param code - Authorization code
   * @param state - State parameter
   * @private
   */
  private async recordAuthorizationResponse(
    flow: FlowExecution,
    code: string,
    state: string
  ): Promise<void> {
    const stepNumber = 2;
    const stepStartTime = new Date();
    
    const step: FlowStep = {
      stepNumber,
      name: 'Authorization Response',
      description: 'Received authorization code from authorization server',
      status: StepStatus.RUNNING,
      startedAt: stepStartTime.toISOString(),
      metadata: {
        rfcReferences: [
          {
            rfcNumber: '6749',
            section: '4.1.2',
            description: 'Authorization Response',
            url: 'https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2'
          }
        ]
      }
    };
    
    this.stateManager.addStep(flow.id, step);
    this.emit('step:started', { flowId: flow.id, step });
    
    // Validate state parameter (CRITICAL - CSRF protection)
    const oauth2Client = new OAuth2Client(
      flow.config.client,
      flow.config.server,
      flow.config.vulnerability!
    );
    
    oauth2Client.validateState(state, flow.id);
    
    // Create response object (302 redirect from IdP)
    const response: HttpResponse = {
      id: uuidv4(),
      requestId: flow.steps[0].request!.id,
      statusCode: 302,
      statusText: 'Found',
      headers: {
        'Location': `${flow.config.client.defaultRedirectUri}?code=${code}&state=${state}`
      },
      receivedAt: new Date().toISOString()
    };
    
    // Complete step
    const stepEndTime = new Date();
    step.status = StepStatus.COMPLETE;
    step.completedAt = stepEndTime.toISOString();
    step.duration = stepEndTime.getTime() - stepStartTime.getTime();
    step.response = response;
    
    this.stateManager.updateStep(flow.id, stepNumber, step);
    this.emit('step:complete', { flowId: flow.id, step });
  }
  
  /**
   * Execute token request step
   * 
   * Exchanges authorization code for access token, refresh token, and ID token.
   * 
   * @param flow - Flow execution
   * @param code - Authorization code
   * @private
   */
  private async executeTokenRequest(
    flow: FlowExecution,
    code: string
  ): Promise<void> {
    const stepNumber = 3;
    const stepStartTime = new Date();
    
    const step: FlowStep = {
      stepNumber,
      name: 'Token Request',
      description: 'Exchange authorization code for tokens',
      status: StepStatus.RUNNING,
      startedAt: stepStartTime.toISOString(),
      metadata: {
        rfcReferences: [
          {
            rfcNumber: '6749',
            section: '4.1.3',
            description: 'Access Token Request',
            url: 'https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.3'
          },
          {
            rfcNumber: '7636',
            section: '4.5',
            description: 'Client Sends the Authorization Code and the Code Verifier',
            url: 'https://datatracker.ietf.org/doc/html/rfc7636#section-4.5'
          }
        ]
      }
    };
    
    this.stateManager.addStep(flow.id, step);
    this.emit('step:started', { flowId: flow.id, step });
    
    // Create OAuth2 client
    const oauth2Client = new OAuth2Client(
      flow.config.client,
      flow.config.server,
      flow.config.vulnerability!
    );
    
    // Retrieve PKCE code verifier
    const pkceParams = this.stateManager.getPKCE(flow.id);
    
    // Exchange code for tokens
    const tokenResponse = await oauth2Client.exchangeCodeForTokens(
      code,
      pkceParams?.codeVerifier
    );
    
    // Store tokens in flow state
    this.stateManager.storeTokens(flow.id, tokenResponse);
    
    // Complete step (request/response captured by HttpCaptureService in OAuth2Client)
    const stepEndTime = new Date();
    step.status = StepStatus.COMPLETE;
    step.completedAt = stepEndTime.toISOString();
    step.duration = stepEndTime.getTime() - stepStartTime.getTime();
    
    this.stateManager.updateStep(flow.id, stepNumber, step);
    this.emit('step:complete', { flowId: flow.id, step });
  }
  
  /**
   * Execute token validation step
   * 
   * Validates JWT signatures and claims for access token and ID token.
   * 
   * @param flow - Flow execution
   * @private
   */
  private async executeTokenValidation(
    flow: FlowExecution
  ): Promise<void> {
    const stepNumber = 4;
    const stepStartTime = new Date();
    
    const step: FlowStep = {
      stepNumber,
      name: 'Token Validation',
      description: 'Validate JWT signatures and claims',
      status: StepStatus.RUNNING,
      startedAt: stepStartTime.toISOString(),
      metadata: {
        rfcReferences: [
          {
            rfcNumber: '7519',
            section: '7.2',
            description: 'Validating a JWT',
            url: 'https://datatracker.ietf.org/doc/html/rfc7519#section-7.2'
          }
        ]
      }
    };
    
    this.stateManager.addStep(flow.id, step);
    this.emit('step:started', { flowId: flow.id, step });
    
    const tokenValidator = new TokenValidator(flow.config.server);
    const tokens = this.stateManager.getTokens(flow.id);
    
    // Validate access token
    const accessTokenValidation = await tokenValidator.validateAccessToken(
      tokens!.access_token
    );
    
    // Validate ID token (if present - OIDC)
    let idTokenValidation;
    if (tokens!.id_token) {
      const nonce = this.stateManager.getNonce(flow.id);
      idTokenValidation = await tokenValidator.validateIDToken(
        tokens!.id_token,
        tokens!.access_token,
        nonce
      );
    }
    
    // Store validation results
    step.validationResults = [
      accessTokenValidation,
      ...(idTokenValidation ? [idTokenValidation] : [])
    ];
    
    // Complete step
    const stepEndTime = new Date();
    step.status = StepStatus.COMPLETE;
    step.completedAt = stepEndTime.toISOString();
    step.duration = stepEndTime.getTime() - stepStartTime.getTime();
    
    this.stateManager.updateStep(flow.id, stepNumber, step);
    this.emit('step:complete', { flowId: flow.id, step });
  }
  
  /**
   * Execute security assessment step
   * 
   * Analyzes flow for security best practices and generates score.
   * 
   * @param flow - Flow execution
   * @private
   */
  private async executeSecurityAssessment(
    flow: FlowExecution
  ): Promise<void> {
    const assessment = await this.securityAssessor.assess(flow);
    this.stateManager.setSecurityAssessment(flow.id, assessment);
    
    this.emit('security:assessed', { flowId: flow.id, assessment });
  }
  
  /**
   * Complete flow
   * 
   * Marks flow as complete and calculates total duration.
   * 
   * @param flow - Flow execution
   * @private
   */
  private completeFlow(flow: FlowExecution): void {
    const completedAt = new Date().toISOString();
    const startedAt = new Date(flow.startedAt);
    const duration = Date.now() - startedAt.getTime();
    
    this.stateManager.completeFlow(flow.id, completedAt, duration);
    this.emit('flow:complete', flow);
  }
  
  /**
   * Handle flow error
   * 
   * Records error and emits flow:error event.
   * 
   * @param flowId - Flow ID
   * @param error - Error that occurred
   * @param stepNumber - Step where error occurred
   * @returns Updated flow with error
   * @private
   */
  private handleFlowError(
    flowId: string,
    error: any,
    stepNumber: number
  ): FlowExecution {
    const flowError = {
      error: 'flow_error',
      errorDescription: error.message,
      step: stepNumber,
      technicalError: error.toString(),
      stackTrace: error.stack
    };
    
    this.stateManager.setFlowError(flowId, flowError);
    this.emit('flow:error', { flowId, error: flowError });
    
    return this.stateManager.getFlow(flowId)!;
  }
  
  /**
   * Generate security indicators for a step
   * 
   * Creates visual indicators showing security features used/missing.
   * 
   * @param step - Flow step
   * @param vulnerabilityConfig - Vulnerability configuration
   * @returns Array of security indicators
   * @private
   */
  private generateStepSecurityIndicators(
    step: FlowStep,
    vulnerabilityConfig: VulnerabilityConfig
  ): SecurityIndicator[] {
    const indicators: SecurityIndicator[] = [];
    
    if (step.stepNumber === 1) {
      // Authorization request - check PKCE
      indicators.push({
        type: SecurityIndicatorType.PKCE,
        label: 'PKCE',
        status: vulnerabilityConfig.toggles.DISABLE_PKCE
          ? SecurityIndicatorStatus.DISABLED
          : SecurityIndicatorStatus.ENABLED,
        tooltip: vulnerabilityConfig.toggles.DISABLE_PKCE
          ? 'PKCE disabled - authorization codes vulnerable to interception'
          : 'PKCE enabled - authorization codes protected from interception',
        variant: vulnerabilityConfig.toggles.DISABLE_PKCE
          ? SecurityIndicatorVariant.DANGER
          : SecurityIndicatorVariant.SUCCESS,
        relatedToggle: 'DISABLE_PKCE'
      });
      
      // Check state parameter
      indicators.push({
        type: SecurityIndicatorType.STATE,
        label: 'State Parameter',
        status: SecurityIndicatorStatus.ENABLED,
        tooltip: 'State parameter present - CSRF protection active',
        variant: SecurityIndicatorVariant.SUCCESS
      });
      
      // Check HTTPS (if authorization endpoint URL available)
      if (step.request?.url) {
        const isHttps = step.request.url.startsWith('https://');
        indicators.push({
          type: SecurityIndicatorType.HTTPS,
          label: 'HTTPS',
          status: isHttps 
            ? SecurityIndicatorStatus.ENABLED 
            : SecurityIndicatorStatus.DISABLED,
          tooltip: isHttps
            ? 'HTTPS used - requests protected in transit'
            : 'HTTP used - requests vulnerable to interception',
          variant: isHttps
            ? SecurityIndicatorVariant.SUCCESS
            : SecurityIndicatorVariant.DANGER
        });
      }
    }
    
    return indicators;
  }
}
```

### 6.4 Event Flow

```
startAuthorizationCodeFlow()
  │
  ├─> emit('flow:started', flow)
  │
  ├─> executeAuthorizationRequest()
  │   ├─> emit('step:started', step1)
  │   └─> emit('step:complete', step1)
  │
  └─> return flow (awaiting user authorization)

handleCallback(flowId, code, state)
  │
  ├─> recordAuthorizationResponse()
  │   ├─> emit('step:started', step2)
  │   └─> emit('step:complete', step2)
  │
  ├─> executeTokenRequest()
  │   ├─> emit('step:started', step3)
  │   └─> emit('step:complete', step3)
  │
  ├─> executeTokenValidation()
  │   ├─> emit('step:started', step4)
  │   └─> emit('step:complete', step4)
  │
  ├─> executeSecurityAssessment()
  │   └─> emit('security:assessed', assessment)
  │
  └─> emit('flow:complete', flow)
```

---

## 7. FlowStateManager Service

**File: `src/services/FlowStateManager.ts`**

### 7.1 Purpose

Manage in-memory storage of active flows and associated data.

**Responsibilities:**
- Store active flow executions
- Store PKCE parameters
- Store state parameters
- Store tokens
- Store nonces
- Provide CRUD operations
- Clean up completed flows

### 7.2 Class Definition

```typescript
import {
  FlowExecution,
  FlowStep,
  PKCEParams,
  StateParam,
  TokenResponse,
  SecurityAssessment
} from '@auth-optics/shared';

/**
 * Flow state manager
 * 
 * In-memory storage for active flows and associated data.
 * 
 * @remarks
 * ✅ MVP - In-memory only
 * ❌ Phase 3 - Database persistence
 */
export class FlowStateManager {
  private flows: Map<string, FlowExecution> = new Map();
  private pkceParams: Map<string, PKCEParams> = new Map();
  private stateParams: Map<string, StateParam> = new Map();
  private tokens: Map<string, TokenResponse> = new Map();
  private nonces: Map<string, string> = new Map();
  
  /**
   * Create new flow
   */
  createFlow(flow: FlowExecution): void {
    this.flows.set(flow.id, flow);
  }
  
  /**
   * Get flow by ID
   */
  getFlow(flowId: string): FlowExecution | undefined {
    return this.flows.get(flowId);
  }
  
  /**
   * Update flow
   */
  updateFlow(flowId: string, updates: Partial<FlowExecution>): void {
    const flow = this.flows.get(flowId);
    if (flow) {
      Object.assign(flow, updates);
    }
  }
  
  /**
   * Delete flow
   */
  deleteFlow(flowId: string): void {
    this.flows.delete(flowId);
    this.pkceParams.delete(flowId);
    this.stateParams.delete(flowId);
    this.tokens.delete(flowId);
    this.nonces.delete(flowId);
  }
  
  /**
   * Add step to flow
   */
  addStep(flowId: string, step: FlowStep): void {
    const flow = this.flows.get(flowId);
    if (flow) {
      flow.steps.push(step);
    }
  }
  
  /**
   * Update step
   */
  updateStep(flowId: string, stepNumber: number, updates: Partial<FlowStep>): void {
    const flow = this.flows.get(flowId);
    if (flow) {
      const step = flow.steps.find(s => s.stepNumber === stepNumber);
      if (step) {
        Object.assign(step, updates);
      }
    }
  }
  
  /**
   * Store PKCE parameters
   */
  storePKCE(flowId: string, pkce?: PKCEParams): void {
    if (pkce) {
      this.pkceParams.set(flowId, pkce);
    }
  }
  
  /**
   * Get PKCE parameters
   */
  getPKCE(flowId: string): PKCEParams | undefined {
    return this.pkceParams.get(flowId);
  }
  
  /**
   * Store state parameter
   */
  storeState(flowId: string, state: StateParam): void {
    this.stateParams.set(flowId, state);
  }
  
  /**
   * Get state parameter
   */
  getState(flowId: string): StateParam | undefined {
    return this.stateParams.get(flowId);
  }
  
  /**
   * Store tokens
   */
  storeTokens(flowId: string, tokens: TokenResponse): void {
    this.tokens.set(flowId, tokens);
    
    // Also store in flow
    const flow = this.flows.get(flowId);
    if (flow) {
      flow.tokens = tokens;
    }
  }
  
  /**
   * Get tokens
   */
  getTokens(flowId: string): TokenResponse | undefined {
    return this.tokens.get(flowId);
  }
  
  /**
   * Store nonce (OIDC)
   */
  storeNonce(flowId: string, nonce: string): void {
    this.nonces.set(flowId, nonce);
  }
  
  /**
   * Get nonce
   */
  getNonce(flowId: string): string | undefined {
    return this.nonces.get(flowId);
  }
  
  /**
   * Set security assessment
   */
  setSecurityAssessment(flowId: string, assessment: SecurityAssessment): void {
    const flow = this.flows.get(flowId);
    if (flow) {
      flow.securityAssessment = assessment;
    }
  }
  
  /**
   * Set flow error
   */
  setFlowError(flowId: string, error: any): void {
    const flow = this.flows.get(flowId);
    if (flow) {
      flow.error = error;
      flow.status = FlowStatus.ERROR;
    }
  }
  
  /**
   * Complete flow
   */
  completeFlow(flowId: string, completedAt: string, duration: number): void {
    const flow = this.flows.get(flowId);
    if (flow) {
      flow.status = FlowStatus.COMPLETE;
      flow.completedAt = completedAt;
      flow.duration = duration;
    }
  }
  
  /**
   * Get all flows (for future history feature)
   */
  getAllFlows(): FlowExecution[] {
    return Array.from(this.flows.values());
  }
  
  /**
   * Clean up old flows (for memory management)
   */
  cleanupOldFlows(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    
    for (const [flowId, flow] of this.flows.entries()) {
      const flowAge = now - new Date(flow.startedAt).getTime();
      if (flowAge > maxAgeMs) {
        this.deleteFlow(flowId);
      }
    }
  }
}
```

### 7.3 Implementation Notes

**MVP Storage:**
- In-memory Maps for fast access
- O(1) lookup performance
- Data lost on server restart (acceptable for MVP)

**Future Enhancement (Phase 3):**
- Redis for persistence
- Database for long-term storage
- Cross-instance state sharing

**Memory Management:**
- Flows deleted after completion (configurable TTL)
- Periodic cleanup of old flows
- Consider implementing LRU cache for production

---

## 8. HttpCaptureService

**File: `src/services/HttpCaptureService.ts`**

### 8.1 Purpose

Capture complete HTTP requests and responses for frontend visualization.

**Responsibilities:**
- Capture request details (method, URL, headers, body)
- Capture response details (status, headers, body)
- Generate cURL commands for reproduction
- Support axios interceptors

### 8.2 Class Definition

```typescript
import {
  HttpRequest,
  HttpResponse,
  HttpMethod,
  HttpHeaders
} from '@auth-optics/shared';
import { v4 as uuidv4 } from 'uuid';
import { AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * HTTP request/response capture service
 * 
 * Captures complete HTTP interactions for visualization.
 * 
 * @remarks
 * ✅ MVP - Complete implementation required
 */
export class HttpCaptureService {
  /**
   * Prepare request for capture
   * 
   * Called before making HTTP request.
   * 
   * @param config - Request configuration
   * @returns Captured request object
   */
  prepareRequest(config: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
  }): HttpRequest {
    const request: HttpRequest = {
      id: uuidv4(),
      method: config.method.toUpperCase() as HttpMethod,
      url: config.url,
      headers: config.headers as HttpHeaders,
      sentAt: new Date().toISOString()
    };
    
    // Add body if present
    if (config.body) {
      if (typeof config.body === 'string') {
        request.body = {
          type: 'text',
          content: config.body
        };
      } else {
        request.body = {
          type: 'json',
          content: config.body
        };
      }
    }
    
    // Generate cURL command
    request.curlCommand = this.generateCurlCommand(request);
    
    return request;
  }
  
  /**
   * Capture response
   * 
   * Called after receiving HTTP response.
   * 
   * @param requestId - Associated request ID
   * @param axiosResponse - Axios response object
   * @returns Captured response object
   */
  captureResponse(
    requestId: string,
    axiosResponse: AxiosResponse
  ): HttpResponse {
    const response: HttpResponse = {
      id: uuidv4(),
      requestId,
      statusCode: axiosResponse.status,
      statusText: axiosResponse.statusText,
      headers: axiosResponse.headers as HttpHeaders,
      receivedAt: new Date().toISOString()
    };
    
    // Add body
    if (axiosResponse.data) {
      if (typeof axiosResponse.data === 'string') {
        response.body = {
          type: 'text',
          content: axiosResponse.data
        };
      } else {
        response.body = {
          type: 'json',
          content: axiosResponse.data
        };
      }
    }
    
    // Calculate size
    const bodySize = JSON.stringify(axiosResponse.data || '').length;
    response.size = bodySize;
    
    return response;
  }
  
  /**
   * Generate cURL command for request
   * 
   * @param request - HTTP request
   * @returns cURL command string
   * @private
   */
  private generateCurlCommand(request: HttpRequest): string {
    let curl = `curl -X ${request.method} '${request.url}'`;
    
    // Add headers
    Object.entries(request.headers).forEach(([key, value]) => {
      curl += ` \\\n  -H '${key}: ${value}'`;
    });
    
    // Add body
    if (request.body) {
      if (request.body.type === 'json') {
        curl += ` \\\n  -d '${JSON.stringify(request.body.content)}'`;
      } else {
        curl += ` \\\n  -d '${request.body.content}'`;
      }
    }
    
    return curl;
  }
}
```

---

## 9. SecurityAssessor Service

**File: `src/services/SecurityAssessor.ts`**

### 9.1 Purpose

Assess OAuth2 flow security and generate scores/recommendations.

**Responsibilities:**
- Calculate security score (0-100)
- Perform security checks
- Generate security indicators
- Provide recommendations

### 9.2 Class Definition

```typescript
import {
  FlowExecution,
  SecurityAssessment,
  SecurityLevel,
  SecurityCheck,
  SecurityIndicator
} from '@auth-optics/shared';

/**
 * Security assessor
 * 
 * Analyzes OAuth2 flows for security best practices.
 * 
 * @remarks
 * ✅ MVP - Basic scoring only
 * ❌ Phase 2 - Comprehensive assessment
 */
export class SecurityAssessor {
  /**
   * Assess flow security
   * 
   * @param flow - Flow execution to assess
   * @returns Security assessment
   */
  async assess(flow: FlowExecution): Promise<SecurityAssessment> {
    const checks: SecurityCheck[] = [];
    let score = 100;
    
    // Check 1: PKCE enabled?
    const pkceCheck = this.checkPKCE(flow);
    checks.push(pkceCheck);
    if (!pkceCheck.passed) score -= 40;  // PKCE is critical
    
    // Check 2: State parameter used?
    const stateCheck = this.checkState(flow);
    checks.push(stateCheck);
    if (!stateCheck.passed) score -= 30;  // State is critical
    
    // Check 3: HTTPS used?
    const httpsCheck = this.checkHTTPS(flow);
    checks.push(httpsCheck);
    if (!httpsCheck.passed) score -= 20;  // HTTPS is important
    
    // Check 4: ID token validated? (OIDC)
    if (flow.tokens?.id_token) {
      const idTokenCheck = this.checkIDToken(flow);
      checks.push(idTokenCheck);
      if (!idTokenCheck.passed) score -= 10;
    }
    
    // Determine security level
    const level = this.determineSecurityLevel(score);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(checks);
    
    return {
      score: Math.max(0, score),
      level,
      checks,
      indicators: [], // Populated by FlowOrchestrator
      warnings: checks.filter(c => !c.passed).map(c => ({
        severity: 'high',
        message: c.recommendation!,
        relatedCheck: c.type
      })),
      recommendations,
      assessedAt: new Date().toISOString()
    };
  }
  
  /**
   * Check if PKCE was used
   */
  private checkPKCE(flow: FlowExecution): SecurityCheck {
    const pkceUsed = !flow.config.vulnerability?.toggles.DISABLE_PKCE;
    
    return {
      type: 'pkce',
      name: 'PKCE Protection',
      passed: pkceUsed,
      description: 'Proof Key for Code Exchange protects authorization codes',
      recommendation: pkceUsed 
        ? undefined 
        : 'Enable PKCE to protect against authorization code interception attacks'
    };
  }
  
  /**
   * Check if state parameter was used
   */
  private checkState(flow: FlowExecution): SecurityCheck {
    const stateUsed = flow.steps[0]?.request?.url?.includes('state=');
    
    return {
      type: 'state',
      name: 'State Parameter',
      passed: stateUsed ?? false,
      description: 'State parameter protects against CSRF attacks',
      recommendation: stateUsed 
        ? undefined 
        : 'Use state parameter for CSRF protection'
    };
  }
  
  /**
   * Check if HTTPS was used
   */
  private checkHTTPS(flow: FlowExecution): SecurityCheck {
    const httpsUsed = flow.steps[0]?.request?.url?.startsWith('https://');
    
    return {
      type: 'https',
      name: 'HTTPS Transport',
      passed: httpsUsed ?? false,
      description: 'HTTPS protects requests in transit',
      recommendation: httpsUsed 
        ? undefined 
        : 'Use HTTPS for all OAuth2 endpoints'
    };
  }
  
  /**
   * Check if ID token was properly validated
   */
  private checkIDToken(flow: FlowExecution): SecurityCheck {
    const validationResults = flow.steps
      .flatMap(s => s.validationResults || []);
    
    const idTokenValidation = validationResults.find(v => 
      v.subject === 'ID Token'
    );
    
    return {
      type: 'id_token_validation',
      name: 'ID Token Validation',
      passed: idTokenValidation?.valid ?? false,
      description: 'ID token signature and claims were validated',
      recommendation: idTokenValidation?.valid 
        ? undefined 
        : 'Validate ID token signature and claims'
    };
  }
  
  /**
   * Determine security level from score
   */
  private determineSecurityLevel(score: number): SecurityLevel {
    if (score >= 90) return SecurityLevel.EXCELLENT;
    if (score >= 70) return SecurityLevel.GOOD;
    if (score >= 50) return SecurityLevel.FAIR;
    if (score >= 30) return SecurityLevel.POOR;
    return SecurityLevel.CRITICAL;
  }
  
  /**
   * Generate recommendations
   */
  private generateRecommendations(checks: SecurityCheck[]): string[] {
    return checks
      .filter(c => !c.passed && c.recommendation)
      .map(c => c.recommendation!);
  }
}
```

---

## 10. VulnerabilityManager Service

**File: `src/services/VulnerabilityManager.ts`**

### 10.1 Purpose

Manage vulnerability mode configuration for educational demonstrations.

**Responsibilities:**
- Track enabled vulnerability toggles
- Validate toggle compatibility
- Provide warnings about security implications

### 10.2 Class Definition

```typescript
import { VulnerabilityConfig } from '@auth-optics/shared';

/**
 * Vulnerability mode manager
 * 
 * Manages educational vulnerability demonstrations.
 * 
 * @remarks
 * ⚠️ MVP - DISABLE_PKCE toggle only
 * ❌ Phase 2-3 - Additional 38 toggles
 */
export class VulnerabilityManager {
  /**
   * Validate vulnerability configuration
   * 
   * Ensures configuration is safe and warns about implications.
   * 
   * @param config - Vulnerability configuration
   * @returns Validation result
   */
  validateConfig(config: VulnerabilityConfig): {
    valid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    
    // Check if enabled
    if (!config.enabled) {
      return { valid: true, warnings: [] };
    }
    
    // Check if disclaimer accepted
    if (!config.acceptedDisclaimer) {
      return {
        valid: false,
        warnings: ['Must accept educational disclaimer before enabling vulnerability mode']
      };
    }
    
    // MVP: Only DISABLE_PKCE is supported
    if (config.toggles.DISABLE_PKCE) {
      warnings.push(
        'PKCE disabled: Authorization codes are vulnerable to interception attacks. ' +
        'This should NEVER be used in production.'
      );
    }
    
    // Check for unsupported toggles in MVP
    const unsupportedToggles = Object.entries(config.toggles)
      .filter(([key, value]) => key !== 'DISABLE_PKCE' && value === true);
    
    if (unsupportedToggles.length > 0) {
      warnings.push(
        `Unsupported toggles in MVP: ${unsupportedToggles.map(([k]) => k).join(', ')}. ` +
        'These will be implemented in Phase 2.'
      );
    }
    
    return { valid: true, warnings };
  }
  
  /**
   * Get security implications for a toggle
   * 
   * @param toggleName - Name of vulnerability toggle
   * @returns Description of security implications
   */
  getSecurityImplications(toggleName: string): string {
    const implications: Record<string, string> = {
      DISABLE_PKCE: 
        'Without PKCE, an attacker who can intercept the authorization code ' +
        '(e.g., via a malicious app on the device) can exchange it for tokens. ' +
        'PKCE binds the code to the client that requested it.',
      
      // Phase 2 toggles...
      SKIP_STATE_VALIDATION:
        'Without state validation, an attacker can trigger CSRF attacks by ' +
        'tricking the user into completing an OAuth flow initiated by the attacker.',
        
      // ... more implications for Phase 2
    };
    
    return implications[toggleName] || 'Security implications not documented yet.';
  }
}
```

---

## Document Metadata

| Property | Value |
|----------|-------|
| **Version** | 1.0.0 |
| **Status** | ✅ Complete for MVP Core Services |
| **Target** | AI-assisted implementation |
| **Parent** | [backend-specification.md](auth-optics-backend-specification.md) |

---

**Next Steps:**
1. Implement services in order: PKCE → State → OAuth2Client → FlowStateManager → FlowOrchestrator
2. Write unit tests for each service
3. See [backend-api-routes.md](backend-api-routes.md) for API endpoint implementation
