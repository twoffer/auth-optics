# AuthOptics Backend - API Routes

## Document Information

| Property | Value |
|----------|-------|
| **Component** | packages/backend/src/routes |
| **Purpose** | REST API endpoint definitions and handlers |
| **Status** | ✅ MVP Critical |
| **Parent Doc** | [backend-specification.md](auth-optics-backend-specification.md) |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Route Architecture](#2-route-architecture)
3. [Flow Management Routes](#3-flow-management-routes)
4. [Configuration Routes](#4-configuration-routes)
5. [Token Routes](#5-token-routes)
6. [Vulnerability Routes](#6-vulnerability-routes)
7. [Event Stream Routes](#7-event-stream-routes)
8. [Error Responses](#8-error-responses)
9. [API Documentation](#9-api-documentation)

---

## 1. Overview

### 1.1 Purpose

API routes expose the backend's OAuth2/OIDC functionality to the frontend via RESTful HTTP endpoints.

**Route Categories:**

| Category | Purpose | MVP Status |
|----------|---------|------------|
| **Flow Management** | Start, monitor, and manage OAuth2 flows | ✅ MVP |
| **Configuration** | Fetch discovery documents and JWKS | ✅ MVP |
| **Token Operations** | Validate and inspect tokens | ✅ MVP |
| **Vulnerability Mode** | Toggle educational security features | ⚠️ MVP (basic) |
| **Event Streaming** | Server-Sent Events for real-time updates | ✅ MVP |

### 1.2 Base URL

```
Development: http://localhost:3001/api
Production: https://api.authoptics.example.com/api
```

### 1.3 Common Headers

```http
Content-Type: application/json
Accept: application/json
```

---

## 2. Route Architecture

### 2.1 Directory Structure

```
src/routes/
├── index.ts                    # ✅ MVP - Route aggregation
├── flows.routes.ts             # ✅ MVP - Flow management
├── config.routes.ts            # ✅ MVP - Configuration
├── tokens.routes.ts            # ✅ MVP - Token operations
├── vulnerability.routes.ts     # ⚠️ MVP - Vulnerability mode
└── events.routes.ts            # ✅ MVP - SSE streaming
```

### 2.2 Route Registration Pattern

```typescript
// src/routes/index.ts
import { Router } from 'express';
import flowsRoutes from './flows.routes';
import configRoutes from './config.routes';
import tokensRoutes from './tokens.routes';
import vulnerabilityRoutes from './vulnerability.routes';
import eventsRoutes from './events.routes';

const router = Router();

// Mount routes
router.use('/flows', flowsRoutes);
router.use('/config', configRoutes);
router.use('/tokens', tokensRoutes);
router.use('/vuln', vulnerabilityRoutes);
router.use('/events', eventsRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
```

---

## 3. Flow Management Routes

**File: `src/routes/flows.routes.ts`**

### 3.1 POST /api/flows/start

**Purpose:** Start a new OAuth2 authorization code flow

**Request Body:**
```typescript
{
  clientConfig: {
    clientId: string;
    clientSecret?: string;
    redirectUris: string[];
    defaultRedirectUri?: string;
    scopes: string[];
  };
  serverConfig: {
    issuer: string;
    authorizationEndpoint: string;
    tokenEndpoint: string;
    jwksUri?: string;
  };
  vulnerabilityConfig?: {
    enabled: boolean;
    toggles: {
      DISABLE_PKCE?: boolean;
    };
    acceptedDisclaimer: boolean;
  };
}
```

**Success Response (201):**
```typescript
{
  flowId: string;              // "550e8400-e29b-41d4-a716-446655440000"
  authorizationUrl: string;    // Full authorization URL to redirect user
  status: "running";
  flow: FlowExecution;         // Complete flow object
}
```

**Implementation:**
```typescript
import { Router } from 'express';
import { FlowOrchestrator } from '../services/FlowOrchestrator';
import { FlowStateManager } from '../services/FlowStateManager';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../utils/async-handler';

const router = Router();
const stateManager = new FlowStateManager();
const orchestrator = new FlowOrchestrator(stateManager);

/**
 * POST /api/flows/start
 * Start a new OAuth2 flow
 */
router.post(
  '/start',
  validateRequest({
    body: {
      clientConfig: 'required',
      serverConfig: 'required'
    }
  }),
  asyncHandler(async (req, res) => {
    const { clientConfig, serverConfig, vulnerabilityConfig } = req.body;
    
    // Default vulnerability config if not provided
    const vulnConfig = vulnerabilityConfig || {
      enabled: false,
      toggles: {},
      acceptedDisclaimer: false,
      lastModified: new Date().toISOString()
    };
    
    // Start flow
    const flow = await orchestrator.startAuthorizationCodeFlow(
      clientConfig,
      serverConfig,
      vulnConfig
    );
    
    // Extract authorization URL from first step
    const authUrl = flow.steps[0]?.request?.url;
    
    if (!authUrl) {
      return res.status(500).json({
        error: 'internal_error',
        errorDescription: 'Failed to generate authorization URL'
      });
    }
    
    res.status(201).json({
      flowId: flow.id,
      authorizationUrl: authUrl,
      status: flow.status,
      flow
    });
  })
);

export default router;
```

**Error Responses:**
```typescript
// 400 Bad Request - Invalid input
{
  error: "invalid_request";
  errorDescription: "Missing required field: clientConfig.clientId";
}

// 500 Internal Server Error - Server error
{
  error: "internal_error";
  errorDescription: "Failed to start flow";
}
```

---

### 3.2 GET /api/flows/:flowId

**Purpose:** Get current status of a flow

**Path Parameters:**
- `flowId` (string, required) - Flow identifier

**Success Response (200):**
```typescript
{
  flow: FlowExecution;  // Complete flow object with all steps
}
```

**Implementation:**
```typescript
/**
 * GET /api/flows/:flowId
 * Get flow status
 */
router.get(
  '/:flowId',
  asyncHandler(async (req, res) => {
    const { flowId } = req.params;
    
    const flow = stateManager.getFlow(flowId);
    
    if (!flow) {
      return res.status(404).json({
        error: 'flow_not_found',
        errorDescription: `Flow not found: ${flowId}`
      });
    }
    
    res.json({ flow });
  })
);
```

**Error Responses:**
```typescript
// 404 Not Found - Flow doesn't exist
{
  error: "flow_not_found";
  errorDescription: "Flow not found: 550e8400-e29b-41d4-a716-446655440000";
}
```

---

### 3.3 GET /api/flows/:flowId/callback

**Purpose:** Handle OAuth2 callback redirect from authorization server

**Path Parameters:**
- `flowId` (string, required) - Flow identifier

**Query Parameters:**
- `code` (string, required) - Authorization code
- `state` (string, required) - State parameter
- `error` (string, optional) - OAuth2 error code
- `error_description` (string, optional) - Error description

**Success Response (302):**
```
Redirect to: http://localhost:3000/flow/{flowId}?success=true
```

**Implementation:**
```typescript
/**
 * GET /api/flows/:flowId/callback
 * Handle OAuth2 callback redirect
 */
router.get(
  '/:flowId/callback',
  asyncHandler(async (req, res) => {
    const { flowId } = req.params;
    const { code, state, error, error_description } = req.query;
    
    // Handle OAuth2 error response
    if (error) {
      stateManager.setFlowError(flowId, {
        error: error as string,
        errorDescription: error_description as string || 'Authorization failed'
      });
      
      return res.redirect(
        `${process.env.FRONTEND_URL}/flow/${flowId}?error=${error}`
      );
    }
    
    // Validate required parameters
    if (!code || !state) {
      return res.status(400).json({
        error: 'invalid_request',
        errorDescription: 'Missing code or state parameter'
      });
    }
    
    try {
      // Process callback
      await orchestrator.handleCallback(
        flowId,
        code as string,
        state as string
      );
      
      // Redirect to frontend with success
      res.redirect(
        `${process.env.FRONTEND_URL}/flow/${flowId}?success=true`
      );
      
    } catch (error: any) {
      // Log error
      console.error('Callback error:', error);
      
      // Redirect to frontend with error
      res.redirect(
        `${process.env.FRONTEND_URL}/flow/${flowId}?error=callback_failed`
      );
    }
  })
);
```

**Error Responses:**
```typescript
// 400 Bad Request - Missing parameters
{
  error: "invalid_request";
  errorDescription: "Missing code or state parameter";
}

// OAuth2 Error - From authorization server
// Redirects to: http://localhost:3000/flow/{flowId}?error={error_code}
```

---

### 3.4 DELETE /api/flows/:flowId

**Purpose:** Cancel and delete a flow

**Path Parameters:**
- `flowId` (string, required) - Flow identifier

**Success Response (200):**
```typescript
{
  success: true;
  flowId: string;
}
```

**Implementation:**
```typescript
/**
 * DELETE /api/flows/:flowId
 * Cancel/delete a flow
 */
router.delete(
  '/:flowId',
  asyncHandler(async (req, res) => {
    const { flowId } = req.params;
    
    const flow = stateManager.getFlow(flowId);
    
    if (!flow) {
      return res.status(404).json({
        error: 'flow_not_found',
        errorDescription: `Flow not found: ${flowId}`
      });
    }
    
    stateManager.deleteFlow(flowId);
    
    res.json({ 
      success: true,
      flowId 
    });
  })
);
```

---

## 4. Configuration Routes

**File: `src/routes/config.routes.ts`**

### 4.1 GET /api/config/discovery

**Purpose:** Get cached OIDC discovery document

**Query Parameters:**
- `issuer` (string, required) - Issuer URL

**Success Response (200):**
```typescript
{
  issuer: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  jwksUri: string;
  responseTypesSupported: string[];
  grantTypesSupported: string[];
  scopesSupported: string[];
  // ... other discovery fields
}
```

**Implementation:**
```typescript
import { Router } from 'express';
import { DiscoveryClient } from '../services/DiscoveryClient';
import { asyncHandler } from '../utils/async-handler';

const router = Router();
const discoveryClient = new DiscoveryClient();

/**
 * GET /api/config/discovery
 * Get OIDC discovery document
 */
router.get(
  '/discovery',
  asyncHandler(async (req, res) => {
    const { issuer } = req.query;
    
    if (!issuer || typeof issuer !== 'string') {
      return res.status(400).json({
        error: 'invalid_request',
        errorDescription: 'Missing or invalid issuer parameter'
      });
    }
    
    try {
      const discovery = await discoveryClient.fetch(issuer);
      res.json(discovery);
      
    } catch (error: any) {
      res.status(502).json({
        error: 'discovery_failed',
        errorDescription: `Failed to fetch discovery document: ${error.message}`
      });
    }
  })
);

export default router;
```

---

### 4.2 GET /api/config/jwks

**Purpose:** Get cached JWKS (JSON Web Key Set)

**Query Parameters:**
- `jwksUri` (string, required) - JWKS URI

**Success Response (200):**
```typescript
{
  keys: [
    {
      kty: "RSA";
      use: "sig";
      kid: "key-id-123";
      n: "modulus...";
      e: "AQAB";
    }
  ];
}
```

**Implementation:**
```typescript
/**
 * GET /api/config/jwks
 * Get JWKS keys
 */
router.get(
  '/jwks',
  asyncHandler(async (req, res) => {
    const { jwksUri } = req.query;
    
    if (!jwksUri || typeof jwksUri !== 'string') {
      return res.status(400).json({
        error: 'invalid_request',
        errorDescription: 'Missing or invalid jwksUri parameter'
      });
    }
    
    try {
      const jwksClient = new JWKSClient();
      const jwks = await jwksClient.fetch(jwksUri);
      res.json(jwks);
      
    } catch (error: any) {
      res.status(502).json({
        error: 'jwks_fetch_failed',
        errorDescription: `Failed to fetch JWKS: ${error.message}`
      });
    }
  })
);
```

---

## 5. Token Routes

**File: `src/routes/tokens.routes.ts`**

### 5.1 POST /api/tokens/validate

**Purpose:** Validate a JWT token locally

**Request Body:**
```typescript
{
  token: string;          // JWT to validate
  issuer: string;         // Expected issuer
  audience?: string;      // Expected audience
  jwksUri?: string;       // JWKS URI for signature verification
}
```

**Success Response (200):**
```typescript
{
  valid: boolean;
  claims: {
    iss: string;
    sub: string;
    aud: string | string[];
    exp: number;
    iat: number;
    // ... other claims
  };
  validation: {
    signatureValid: boolean;
    expirationValid: boolean;
    issuerValid: boolean;
    audienceValid: boolean;
  };
}
```

**Implementation:**
```typescript
import { Router } from 'express';
import { TokenValidator } from '../services/TokenValidator';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

/**
 * POST /api/tokens/validate
 * Validate JWT token
 */
router.post(
  '/validate',
  asyncHandler(async (req, res) => {
    const { token, issuer, audience, jwksUri } = req.body;
    
    if (!token || !issuer) {
      return res.status(400).json({
        error: 'invalid_request',
        errorDescription: 'Missing token or issuer'
      });
    }
    
    try {
      const validator = new TokenValidator({
        issuer,
        jwksUri: jwksUri || `${issuer}/.well-known/jwks.json`
      });
      
      const result = await validator.validateAccessToken(token, {
        audience
      });
      
      res.json(result);
      
    } catch (error: any) {
      res.status(400).json({
        valid: false,
        error: 'validation_failed',
        errorDescription: error.message
      });
    }
  })
);

export default router;
```

---

### 5.2 POST /api/tokens/test-resource

**Purpose:** Test a token against the mock resource server

**Request Body:**
```typescript
{
  accessToken: string;
  resourceUrl?: string;  // Default: http://localhost:3002/api/protected
}
```

**Success Response (200):**
```typescript
{
  success: boolean;
  statusCode: number;
  data?: any;           // Response from resource server
  error?: string;
}
```

**Implementation:**
```typescript
/**
 * POST /api/tokens/test-resource
 * Test token against mock resource server
 */
router.post(
  '/test-resource',
  asyncHandler(async (req, res) => {
    const { accessToken, resourceUrl } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({
        error: 'invalid_request',
        errorDescription: 'Missing accessToken'
      });
    }
    
    const url = resourceUrl || 'http://localhost:3002/api/protected';
    
    try {
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      res.json({
        success: true,
        statusCode: response.status,
        data: response.data
      });
      
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        res.json({
          success: false,
          statusCode: error.response.status,
          error: error.response.data?.error || 'request_failed'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'internal_error',
          errorDescription: error.message
        });
      }
    }
  })
);
```

---

## 6. Vulnerability Routes

**File: `src/routes/vulnerability.routes.ts`**

### 6.1 GET /api/vuln/toggles

**Purpose:** Get available vulnerability toggles

**Success Response (200):**
```typescript
{
  available: [
    {
      id: "DISABLE_PKCE";
      name: "Disable PKCE";
      description: "Removes PKCE from authorization request";
      severity: "high";
      mvpStatus: "available";
      securityImplication: "Authorization codes vulnerable to interception";
    }
    // Phase 2: 38 additional toggles
  ];
  current: {
    enabled: boolean;
    toggles: {
      DISABLE_PKCE: boolean;
    };
  };
}
```

**Implementation:**
```typescript
import { Router } from 'express';
import { VulnerabilityManager } from '../services/VulnerabilityManager';
import { asyncHandler } from '../utils/async-handler';

const router = Router();
const vulnManager = new VulnerabilityManager();

/**
 * GET /api/vuln/toggles
 * List available vulnerability toggles
 */
router.get(
  '/toggles',
  asyncHandler(async (req, res) => {
    res.json({
      available: [
        {
          id: 'DISABLE_PKCE',
          name: 'Disable PKCE',
          description: 'Removes PKCE (code_challenge) from authorization request',
          severity: 'high',
          mvpStatus: 'available',
          securityImplication: vulnManager.getSecurityImplications('DISABLE_PKCE'),
          rfcReference: {
            rfc: '7636',
            section: '1',
            title: 'PKCE Overview'
          }
        }
        // MVP: Only DISABLE_PKCE
        // Phase 2: Add more toggles
      ],
      current: {
        enabled: false,
        toggles: {}
      }
    });
  })
);

export default router;
```

---

### 6.2 PUT /api/vuln/toggles

**Purpose:** Update vulnerability toggle configuration

**Request Body:**
```typescript
{
  enabled: boolean;
  toggles: {
    DISABLE_PKCE?: boolean;
  };
  acceptedDisclaimer: boolean;
}
```

**Success Response (200):**
```typescript
{
  success: boolean;
  config: VulnerabilityConfig;
  warnings: string[];
}
```

**Implementation:**
```typescript
/**
 * PUT /api/vuln/toggles
 * Update vulnerability toggles
 */
router.put(
  '/toggles',
  asyncHandler(async (req, res) => {
    const config = req.body;
    
    // Validate configuration
    const validation = vulnManager.validateConfig(config);
    
    if (!validation.valid) {
      return res.status(400).json({
        error: 'invalid_configuration',
        errorDescription: validation.warnings.join(', ')
      });
    }
    
    // In MVP, we don't persist this - it's per-flow
    // Just validate and return
    
    res.json({
      success: true,
      config: {
        ...config,
        lastModified: new Date().toISOString()
      },
      warnings: validation.warnings
    });
  })
);
```

---

## 7. Event Stream Routes

**File: `src/routes/events.routes.ts`**

### 7.1 GET /api/events/:flowId

**Purpose:** Server-Sent Events stream for real-time flow updates

**Path Parameters:**
- `flowId` (string, required) - Flow identifier

**Response:** SSE stream with `text/event-stream` content type

**Event Types:**
```typescript
// step:started
data: {"flowId":"...","step":{...}}

// step:complete
data: {"flowId":"...","step":{...}}

// flow:complete
data: {"flowId":"...","flow":{...}}

// flow:error
data: {"flowId":"...","error":{...}}

// security:assessed
data: {"flowId":"...","assessment":{...}}
```

**Implementation:**
```typescript
import { Router, Request, Response } from 'express';
import { FlowOrchestrator } from '../services/FlowOrchestrator';
import { FlowStateManager } from '../services/FlowStateManager';

const router = Router();
const stateManager = new FlowStateManager();
const orchestrator = new FlowOrchestrator(stateManager);

/**
 * GET /api/events/:flowId
 * SSE stream for flow updates
 */
router.get('/:flowId', (req: Request, res: Response) => {
  const { flowId } = req.params;
  
  // Validate flow exists
  const flow = stateManager.getFlow(flowId);
  if (!flow) {
    return res.status(404).json({
      error: 'flow_not_found',
      errorDescription: `Flow not found: ${flowId}`
    });
  }
  
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  
  // Send initial connection message
  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify({ flowId, timestamp: new Date().toISOString() })}\n\n`);
  
  // Event handlers
  const handlers = {
    'step:started': (data: any) => {
      if (data.flowId === flowId) {
        res.write(`event: step:started\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      }
    },
    
    'step:complete': (data: any) => {
      if (data.flowId === flowId) {
        res.write(`event: step:complete\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      }
    },
    
    'flow:complete': (data: any) => {
      if (data.id === flowId) {
        res.write(`event: flow:complete\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
        // Close connection after flow completes
        setTimeout(() => res.end(), 1000);
      }
    },
    
    'flow:error': (data: any) => {
      if (data.flowId === flowId) {
        res.write(`event: flow:error\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
        // Close connection after error
        setTimeout(() => res.end(), 1000);
      }
    },
    
    'security:assessed': (data: any) => {
      if (data.flowId === flowId) {
        res.write(`event: security:assessed\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      }
    }
  };
  
  // Register event handlers
  Object.entries(handlers).forEach(([event, handler]) => {
    orchestrator.on(event, handler);
  });
  
  // Keep-alive ping every 15 seconds
  const keepAliveInterval = setInterval(() => {
    res.write(`:ping\n\n`);
  }, 15000);
  
  // Cleanup on client disconnect
  req.on('close', () => {
    clearInterval(keepAliveInterval);
    
    // Unregister event handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      orchestrator.off(event, handler);
    });
    
    res.end();
  });
});

export default router;
```

---

## 8. Error Responses

### 8.1 Standard Error Format

All error responses follow this format:

```typescript
{
  error: string;              // Machine-readable error code
  errorDescription: string;   // Human-readable description
  details?: any;              // Additional context (optional)
}
```

### 8.2 Common Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `invalid_request` | Malformed or missing required parameters |
| 401 | `unauthorized` | Authentication required |
| 404 | `flow_not_found` | Flow ID doesn't exist |
| 404 | `not_found` | Resource not found |
| 500 | `internal_error` | Server error |
| 502 | `discovery_failed` | Failed to fetch discovery document |
| 502 | `jwks_fetch_failed` | Failed to fetch JWKS |

### 8.3 OAuth2 Error Codes

OAuth2-specific errors (RFC 6749 §5.2):

| Error Code | Description |
|------------|-------------|
| `invalid_request` | Request is missing parameter or malformed |
| `invalid_client` | Client authentication failed |
| `invalid_grant` | Authorization code invalid or expired |
| `unauthorized_client` | Client not authorized for grant type |
| `unsupported_grant_type` | Grant type not supported |
| `invalid_scope` | Requested scope invalid or exceeds granted |

---

## 9. API Documentation

### 9.1 OpenAPI/Swagger Specification

Create OpenAPI 3.0 specification:

```yaml
# openapi.yaml
openapi: 3.0.0
info:
  title: AuthOptics Backend API
  version: 1.0.0
  description: OAuth2/OIDC flow orchestration and visualization

servers:
  - url: http://localhost:3001/api
    description: Development server

paths:
  /flows/start:
    post:
      summary: Start OAuth2 flow
      tags: [Flows]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/StartFlowRequest'
      responses:
        '201':
          description: Flow started
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StartFlowResponse'

components:
  schemas:
    StartFlowRequest:
      type: object
      required:
        - clientConfig
        - serverConfig
      properties:
        clientConfig:
          $ref: '#/components/schemas/ClientConfig'
        serverConfig:
          $ref: '#/components/schemas/ServerConfig'
    # ... more schemas
```

### 9.2 Postman Collection

Create Postman collection for testing:

```json
{
  "info": {
    "name": "AuthOptics Backend",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Flows",
      "item": [
        {
          "name": "Start Flow",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"clientConfig\": {\n    \"clientId\": \"web-app\",\n    \"scopes\": [\"openid\", \"profile\"]\n  }\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "http://localhost:3001/api/flows/start",
              "protocol": "http",
              "host": ["localhost"],
              "port": "3001",
              "path": ["api", "flows", "start"]
            }
          }
        }
      ]
    }
  ]
}
```

---

## Document Metadata

| Property | Value |
|----------|-------|
| **Version** | 1.0.0 |
| **Status** | ✅ Complete for MVP API Routes |
| **Parent** | [backend-specification.md](auth-optics-backend-specification.md) |

---

**Next Steps:**
1. Implement route handlers using patterns above
2. Add request validation middleware
3. Add error handling middleware
4. Test with Postman or curl
5. See [backend-middleware.md](backend-middleware.md) for middleware implementation
