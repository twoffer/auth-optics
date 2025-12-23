# AuthOptics Frontend - Services Specification

> *"Good architecture is less about the code you write and more about the code you don't have to write." - Anonymous*

---

## Document Information

| Property | Value |
|----------|-------|
| **Component** | packages/frontend/src/services |
| **Purpose** | API communication, SSE streaming, token operations |
| **Status** | ✅ MVP Critical |
| **Parent Doc** | [auth-optics-frontend-specification.md](auth-optics-frontend-specification.md) |

---

## Table of Contents

1. [Overview](#1-overview)
2. [ApiService - HTTP Client](#2-apiservice---http-client)
3. [SSEService - Real-time Events](#3-sseservice---real-time-events)
4. [TokenService - JWT Operations](#4-tokenservice---jwt-operations)
5. [ConfigService - Settings Management](#5-configservice---settings-management)

---

## 1. Overview

### 1.1 Purpose

Services provide the interface layer between React components and external systems (backend API, KeyCloak, browser APIs).

**Service Responsibilities:**

| Service | Purpose | Lines of Code |
|---------|---------|---------------|
| **ApiService** | HTTP communication with backend | 150-200 |
| **SSEService** | Real-time event streaming via EventSource | 150-200 |
| **TokenService** | JWT decoding and validation | 100-150 |
| **ConfigService** | Client configuration persistence | 50-80 |

### 1.2 Service Architecture

```
Components
   |
   v
+----------------------------------------------------------+
|                    Custom Hooks Layer                    |
|  (useFlowExecution, useFlowEvents, useTokenValidation)  |
+----------------------------------------------------------+
   |
   v
+----------------------------------------------------------+
|                     Services Layer                       |
|                                                          |
|  +-----------------+  +-----------------+  +----------+  |
|  |  ApiService     |  |  SSEService     |  | Token    |  |
|  |  (Axios)        |  |  (EventSource)  |  | Service  |  |
|  +-----------------+  +-----------------+  +----------+  |
|         |                     |                   |      |
+---------|---------------------|-------------------|------+
          |                     |                   |
          v                     v                   v
    Backend API          Backend SSE           JWT Parsing
    (Port 3001)         (Port 3001)          (jose library)
```

---

## 2. ApiService - HTTP Client

### 2.1 Service Class

```typescript
/**
 * HTTP API client for backend communication
 * 
 * File: src/services/ApiService.ts
 * Lines: ~150-200
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  Flow,
  ClientConfig,
  VulnerabilityConfig,
  ServerConfig
} from '@authoptics/shared';

/**
 * Request/Response types
 */
export interface StartFlowRequest {
  flowType: 'authorization_code' | 'client_credentials' | 'device_authorization';
  config: ClientConfig;
  vulnerabilityMode: VulnerabilityConfig;
}

export interface StartFlowResponse {
  flowId: string;
  authorizationUrl: string;
}

export interface ErrorResponse {
  error: string;
  errorDescription: string;
  details?: any;
}

/**
 * API Service implementation
 */
class ApiService {
  private client: AxiosInstance;
  private baseURL: string;
  
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    this.setupInterceptors();
  }
  
  /**
   * Setup request/response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
      }
    );
    
    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[API] ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError<ErrorResponse>) => {
        console.error('[API] Response error:', error.response?.data || error.message);
        
        // Transform error for better handling
        const apiError = {
          message: error.response?.data?.errorDescription || error.message,
          status: error.response?.status,
          error: error.response?.data?.error,
          details: error.response?.data?.details
        };
        
        return Promise.reject(apiError);
      }
    );
  }
  
  /**
   * Start a new OAuth2 flow
   */
  async startFlow(request: StartFlowRequest): Promise<StartFlowResponse> {
    const response = await this.client.post<StartFlowResponse>('/api/flows/start', request);
    return response.data;
  }
  
  /**
   * Get flow status by ID
   */
  async getFlow(flowId: string): Promise<Flow> {
    const response = await this.client.get<Flow>(`/api/flows/${flowId}`);
    return response.data;
  }
  
  /**
   * Get default server configuration
   */
  async getConfig(): Promise<ServerConfig> {
    const response = await this.client.get<ServerConfig>('/api/config');
    return response.data;
  }
  
  /**
   * Validate JWT token
   */
  async validateToken(token: string): Promise<{
    valid: boolean;
    error?: string;
    claims?: any;
  }> {
    const response = await this.client.post('/api/tokens/validate', { token });
    return response.data;
  }
  
  /**
   * Test token against mock resource server
   */
  async testToken(token: string, endpoint: string): Promise<{
    success: boolean;
    response?: any;
    error?: string;
  }> {
    const response = await this.client.post('/api/tokens/test', {
      token,
      endpoint
    });
    return response.data;
  }
  
  /**
   * Health check
   */
  async health(): Promise<{ status: string; timestamp: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }
}

// Export singleton instance
export const apiService = new ApiService();
```

### 2.2 Error Handling

```typescript
/**
 * API error handling patterns
 */

// ✅ GOOD: Handle specific error types
try {
  const response = await apiService.startFlow(request);
} catch (error: any) {
  if (error.status === 400) {
    // Bad request - show validation errors
    showError('Invalid configuration: ' + error.message);
  } else if (error.status === 500) {
    // Server error
    showError('Server error. Please try again.');
  } else {
    // Network or unknown error
    showError('Connection failed. Check your network.');
  }
}

// ✅ GOOD: Retry on network errors
async function startFlowWithRetry(request: StartFlowRequest, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiService.startFlow(request);
    } catch (error: any) {
      if (i === maxRetries - 1 || error.status) {
        // Last retry or HTTP error (don't retry)
        throw error;
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}
```

---

## 3. SSEService - Real-time Events

### 3.1 Service Class

```typescript
/**
 * Server-Sent Events (SSE) client for real-time flow updates
 * 
 * File: src/services/SSEService.ts
 * Lines: ~150-200
 */

import type { Flow, FlowStep, SecurityAssessment } from '@authoptics/shared';

/**
 * SSE event handlers
 */
export interface SSEHandlers {
  onConnected?: () => void;
  onStepStarted?: (data: { flowId: string; step: FlowStep }) => void;
  onStepComplete?: (data: { flowId: string; step: FlowStep }) => void;
  onFlowComplete?: (data: Flow) => void;
  onError?: (data: { flowId: string; error: string }) => void;
  onSecurityAssessed?: (data: { flowId: string; assessment: SecurityAssessment }) => void;
}

/**
 * SSE Service implementation
 */
class SSEService {
  private eventSource: EventSource | null = null;
  private baseURL: string;
  private currentFlowId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  }
  
  /**
   * Connect to SSE stream for a flow
   */
  connect(flowId: string, handlers: SSEHandlers): void {
    // Close existing connection
    this.disconnect();
    
    this.currentFlowId = flowId;
    const url = `${this.baseURL}/api/events/${flowId}`;
    
    console.log('[SSE] Connecting to:', url);
    
    try {
      this.eventSource = new EventSource(url);
      
      // Connection opened
      this.eventSource.onopen = () => {
        console.log('[SSE] Connection opened');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
      };
      
      // Handle 'connected' event
      this.eventSource.addEventListener('connected', (event) => {
        console.log('[SSE] Connected event received');
        const data = JSON.parse(event.data);
        handlers.onConnected?.();
      });
      
      // Handle 'step:started' event
      this.eventSource.addEventListener('step:started', (event) => {
        const data = JSON.parse(event.data);
        console.log('[SSE] Step started:', data.step.name);
        handlers.onStepStarted?.(data);
      });
      
      // Handle 'step:complete' event
      this.eventSource.addEventListener('step:complete', (event) => {
        const data = JSON.parse(event.data);
        console.log('[SSE] Step complete:', data.step.name);
        handlers.onStepComplete?.(data);
      });
      
      // Handle 'flow:complete' event
      this.eventSource.addEventListener('flow:complete', (event) => {
        const data = JSON.parse(event.data);
        console.log('[SSE] Flow complete');
        handlers.onFlowComplete?.(data);
        
        // Close connection after flow completes
        setTimeout(() => this.disconnect(), 1000);
      });
      
      // Handle 'flow:error' event
      this.eventSource.addEventListener('flow:error', (event) => {
        const data = JSON.parse(event.data);
        console.error('[SSE] Flow error:', data.error);
        handlers.onError?.(data);
        
        // Close connection after error
        setTimeout(() => this.disconnect(), 1000);
      });
      
      // Handle 'security:assessed' event
      this.eventSource.addEventListener('security:assessed', (event) => {
        const data = JSON.parse(event.data);
        console.log('[SSE] Security assessed');
        handlers.onSecurityAssessed?.(data);
      });
      
      // Handle connection errors
      this.eventSource.onerror = (error) => {
        console.error('[SSE] Connection error:', error);
        
        // Check if connection is closed
        if (this.eventSource?.readyState === EventSource.CLOSED) {
          console.log('[SSE] Connection closed');
          
          // Attempt reconnection with exponential backoff
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`[SSE] Reconnecting (attempt ${this.reconnectAttempts})...`);
            
            setTimeout(() => {
              if (this.currentFlowId) {
                this.connect(this.currentFlowId, handlers);
              }
            }, this.reconnectDelay);
            
            // Exponential backoff
            this.reconnectDelay *= 2;
          } else {
            console.error('[SSE] Max reconnection attempts reached');
            handlers.onError?.({
              flowId: flowId,
              error: 'Connection lost. Please refresh the page.'
            });
          }
        }
      };
      
    } catch (error) {
      console.error('[SSE] Failed to create EventSource:', error);
      handlers.onError?.({
        flowId: flowId,
        error: 'Failed to establish SSE connection'
      });
    }
  }
  
  /**
   * Disconnect from SSE stream
   */
  disconnect(): void {
    if (this.eventSource) {
      console.log('[SSE] Disconnecting');
      this.eventSource.close();
      this.eventSource = null;
      this.currentFlowId = null;
      this.reconnectAttempts = 0;
    }
  }
  
  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
  
  /**
   * Get current connection state
   */
  getReadyState(): number | null {
    return this.eventSource?.readyState ?? null;
  }
}

// Export singleton instance
export const sseService = new SSEService();
```

### 3.2 Connection Lifecycle

```typescript
/**
 * SSE connection lifecycle example
 */

// Connect when flow starts
useEffect(() => {
  if (!flowId) return;
  
  sseService.connect(flowId, {
    onConnected: () => {
      console.log('SSE connected');
      setConnectionStatus('connected');
    },
    
    onStepComplete: (data) => {
      // Update UI with step data
      updateFlowStep(data.step);
    },
    
    onFlowComplete: (data) => {
      // Flow finished
      setFlowData(data);
      setConnectionStatus('disconnected');
    },
    
    onError: (data) => {
      // Handle error
      showError(data.error);
      setConnectionStatus('error');
    }
  });
  
  // Cleanup on unmount
  return () => {
    sseService.disconnect();
  };
}, [flowId]);
```

---

## 4. TokenService - JWT Operations

### 4.1 Service Class

```typescript
/**
 * JWT token operations (decode, validate, inspect)
 * 
 * File: src/services/TokenService.ts
 * Lines: ~100-150
 */

/**
 * Decoded JWT structure
 */
export interface JWT {
  header: {
    alg: string;
    typ: string;
    kid?: string;
  };
  payload: {
    iss?: string;
    sub?: string;
    aud?: string | string[];
    exp?: number;
    nbf?: number;
    iat?: number;
    jti?: string;
    scope?: string;
    [key: string]: any;
  };
  signature: string;
  raw: {
    header: string;
    payload: string;
    signature: string;
  };
}

/**
 * Token validation result
 */
export interface ValidationResult {
  valid: boolean;
  expired: boolean;
  errors: string[];
  warnings: string[];
  claims: Record<string, any>;
}

/**
 * Token Service implementation
 */
class TokenService {
  
  /**
   * Check if string is a JWT (has 3 parts separated by dots)
   */
  isJWT(token: string): boolean {
    const parts = token.split('.');
    return parts.length === 3;
  }
  
  /**
   * Decode JWT token (no validation)
   */
  decodeJWT(token: string): JWT {
    if (!this.isJWT(token)) {
      throw new Error('Invalid JWT format');
    }
    
    const parts = token.split('.');
    const [headerB64, payloadB64, signature] = parts;
    
    try {
      // Decode base64url
      const header = JSON.parse(this.base64UrlDecode(headerB64));
      const payload = JSON.parse(this.base64UrlDecode(payloadB64));
      
      return {
        header,
        payload,
        signature,
        raw: {
          header: headerB64,
          payload: payloadB64,
          signature: signature
        }
      };
    } catch (error) {
      throw new Error('Failed to decode JWT: ' + (error as Error).message);
    }
  }
  
  /**
   * Validate JWT token (client-side checks only)
   */
  validateToken(token: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      const jwt = this.decodeJWT(token);
      const now = Math.floor(Date.now() / 1000);
      
      // Check expiration
      const expired = jwt.payload.exp ? jwt.payload.exp < now : false;
      if (expired) {
        errors.push('Token is expired');
      }
      
      // Check not before
      if (jwt.payload.nbf && jwt.payload.nbf > now) {
        errors.push('Token not yet valid (nbf claim)');
      }
      
      // Check required claims
      if (!jwt.payload.iss) {
        warnings.push('Missing issuer (iss) claim');
      }
      
      if (!jwt.payload.sub) {
        warnings.push('Missing subject (sub) claim');
      }
      
      if (!jwt.payload.aud) {
        warnings.push('Missing audience (aud) claim');
      }
      
      // Check algorithm
      if (jwt.header.alg === 'none') {
        errors.push('Unsafe algorithm: none');
      }
      
      return {
        valid: errors.length === 0 && !expired,
        expired,
        errors,
        warnings,
        claims: jwt.payload
      };
      
    } catch (error) {
      return {
        valid: false,
        expired: false,
        errors: ['Invalid JWT: ' + (error as Error).message],
        warnings: [],
        claims: {}
      };
    }
  }
  
  /**
   * Check if token is expired
   */
  isExpired(token: string): boolean {
    try {
      const jwt = this.decodeJWT(token);
      if (!jwt.payload.exp) return false;
      
      const now = Math.floor(Date.now() / 1000);
      return jwt.payload.exp < now;
    } catch {
      return true;
    }
  }
  
  /**
   * Get time until expiration (in seconds)
   */
  getTimeToExpiration(token: string): number | null {
    try {
      const jwt = this.decodeJWT(token);
      if (!jwt.payload.exp) return null;
      
      const now = Math.floor(Date.now() / 1000);
      return Math.max(0, jwt.payload.exp - now);
    } catch {
      return null;
    }
  }
  
  /**
   * Format token for display (with line breaks)
   */
  formatToken(token: string): string {
    if (!this.isJWT(token)) return token;
    
    const parts = token.split('.');
    return parts.join('.\n');
  }
  
  /**
   * Get human-readable claim name
   */
  getClaimDescription(claim: string): string {
    const descriptions: Record<string, string> = {
      iss: 'Issuer - Who created the token',
      sub: 'Subject - Who the token is about',
      aud: 'Audience - Who the token is for',
      exp: 'Expiration - When the token expires',
      nbf: 'Not Before - When the token becomes valid',
      iat: 'Issued At - When the token was created',
      jti: 'JWT ID - Unique token identifier',
      scope: 'Scope - Permissions granted',
      azp: 'Authorized Party - Client that requested the token',
      nonce: 'Nonce - OIDC replay protection',
      at_hash: 'Access Token Hash - OIDC token binding'
    };
    
    return descriptions[claim] || claim;
  }
  
  /**
   * Base64URL decode
   */
  private base64UrlDecode(str: string): string {
    // Replace URL-safe characters
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    
    // Pad if necessary
    while (str.length % 4) {
      str += '=';
    }
    
    // Decode
    return atob(str);
  }
}

// Export singleton instance
export const tokenService = new TokenService();
```

### 4.2 Usage Examples

```typescript
/**
 * Token service usage examples
 */

// Decode token
const jwt = tokenService.decodeJWT(accessToken);
console.log('Header:', jwt.header);
console.log('Payload:', jwt.payload);
console.log('Expires:', new Date(jwt.payload.exp * 1000));

// Validate token
const validation = tokenService.validateToken(accessToken);
if (!validation.valid) {
  console.error('Token invalid:', validation.errors);
}

// Check expiration
if (tokenService.isExpired(accessToken)) {
  console.log('Token is expired');
}

// Get time to expiration
const ttl = tokenService.getTimeToExpiration(accessToken);
console.log(`Token expires in ${ttl} seconds`);
```

---

## 5. ConfigService - Settings Management

### 5.1 Service Class

```typescript
/**
 * Client configuration persistence (localStorage)
 * 
 * File: src/services/ConfigService.ts
 * Lines: ~50-80
 */

import type { ClientConfig, VulnerabilityConfig } from '@authoptics/shared';

const STORAGE_KEYS = {
  CLIENT_CONFIG: 'authoptics:clientConfig',
  VULNERABILITY_MODE: 'authoptics:vulnerabilityMode',
  UI_PREFERENCES: 'authoptics:uiPreferences'
};

/**
 * Config Service implementation
 */
class ConfigService {
  
  /**
   * Load client configuration from localStorage
   */
  loadClientConfig(): ClientConfig | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CLIENT_CONFIG);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load client config:', error);
      return null;
    }
  }
  
  /**
   * Save client configuration to localStorage
   */
  saveClientConfig(config: ClientConfig): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CLIENT_CONFIG, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save client config:', error);
    }
  }
  
  /**
   * Load vulnerability mode settings
   */
  loadVulnerabilityMode(): VulnerabilityConfig | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.VULNERABILITY_MODE);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load vulnerability mode:', error);
      return null;
    }
  }
  
  /**
   * Save vulnerability mode settings
   */
  saveVulnerabilityMode(config: VulnerabilityConfig): void {
    try {
      localStorage.setItem(STORAGE_KEYS.VULNERABILITY_MODE, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save vulnerability mode:', error);
    }
  }
  
  /**
   * Load UI preferences
   */
  loadUIPreferences(): { darkMode: boolean } | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.UI_PREFERENCES);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load UI preferences:', error);
      return null;
    }
  }
  
  /**
   * Save UI preferences
   */
  saveUIPreferences(prefs: { darkMode: boolean }): void {
    try {
      localStorage.setItem(STORAGE_KEYS.UI_PREFERENCES, JSON.stringify(prefs));
    } catch (error) {
      console.error('Failed to save UI preferences:', error);
    }
  }
  
  /**
   * Clear all stored configuration
   */
  clearAll(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Failed to clear configuration:', error);
    }
  }
}

// Export singleton instance
export const configService = new ConfigService();
```

---

## 6. Testing Services

### 6.1 ApiService Tests

```typescript
/**
 * File: src/services/__tests__/ApiService.test.ts
 */

import { apiService } from '../ApiService';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ApiService', () => {
  it('should start flow successfully', async () => {
    const mockResponse = {
      data: { flowId: 'flow-123', authorizationUrl: 'https://...' }
    };
    
    mockedAxios.create().post.mockResolvedValue(mockResponse);
    
    const result = await apiService.startFlow({
      flowType: 'authorization_code',
      config: { /* ... */ },
      vulnerabilityMode: { /* ... */ }
    });
    
    expect(result.flowId).toBe('flow-123');
  });
});
```

### 6.2 TokenService Tests

```typescript
/**
 * File: src/services/__tests__/TokenService.test.ts
 */

import { tokenService } from '../TokenService';

describe('TokenService', () => {
  const validJWT = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZXhwIjo5OTk5OTk5OTk5fQ.signature';
  
  it('should decode valid JWT', () => {
    const jwt = tokenService.decodeJWT(validJWT);
    
    expect(jwt.header.alg).toBe('RS256');
    expect(jwt.payload.sub).toBe('1234567890');
  });
  
  it('should detect expired token', () => {
    const expiredJWT = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjF9.sig';
    expect(tokenService.isExpired(expiredJWT)).toBe(true);
  });
});
```

---

## Document Metadata

| Property | Value |
|----------|-------|
| **Version** | 1.0.0 |
| **Status** | ✅ Complete for MVP |
| **Parent** | [auth-optics-frontend-specification.md](auth-optics-frontend-specification.md) |

---

**Next Steps:**
1. Implement ApiService with axios interceptors
2. Implement SSEService with EventSource
3. Implement TokenService with JWT decoding
4. Implement ConfigService with localStorage
5. Test all services with unit tests
6. See [frontend-implementation-guide.md](frontend-implementation-guide.md) for complete roadmap
