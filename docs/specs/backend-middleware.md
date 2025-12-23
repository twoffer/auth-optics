# AuthOptics Backend - Middleware

## Document Information

| Property | Value |
|----------|-------|
| **Component** | packages/backend/src/middleware |
| **Purpose** | Express middleware for error handling, logging, CORS, validation |
| **Status** | ✅ MVP Required |
| **Parent Doc** | [backend-specification.md](auth-optics-backend-specification.md) |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Error Handler Middleware](#2-error-handler-middleware)
3. [Request Logger Middleware](#3-request-logger-middleware)
4. [CORS Middleware](#4-cors-middleware)
5. [Validation Middleware](#5-validation-middleware)

---

## 1. Overview

### 1.1 Middleware Stack

```
Request
   │
   ▼
[Request Logger]       # Log all incoming requests
   │
   ▼
[CORS]                 # Handle cross-origin requests
   │
   ▼
[Body Parser]          # Parse JSON bodies (express.json())
   │
   ▼
[Helmet]               # Security headers
   │
   ▼
[Route Handlers]       # Application routes
   │
   ▼
[Error Handler]        # Catch and format errors
   │
   ▼
Response
```

### 1.2 Directory Structure

```
src/middleware/
├── index.ts               # ✅ MVP - Middleware aggregation
├── error-handler.ts       # ✅ MVP - Global error handling
├── request-logger.ts      # ✅ MVP - HTTP request logging
├── cors.ts                # ✅ MVP - CORS configuration
└── validation.ts          # ✅ MVP - Request validation
```

---

## 2. Error Handler Middleware

**File: `src/middleware/error-handler.ts`**

### 2.1 Purpose

Catch all errors and format consistent error responses.

### 2.2 Implementation

```typescript
import { Request, Response, NextFunction } from 'express';

/**
 * Global error handling middleware
 * 
 * Catches all errors and formats consistent responses.
 * Should be registered LAST in middleware chain.
 */
export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error
  console.error('[ERROR]', {
    path: req.path,
    method: req.method,
    error: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
  
  // Determine status code
  const statusCode = error.statusCode || error.status || 500;
  
  // OAuth2 error format (RFC 6749 §5.2)
  if (error.oauth2) {
    return res.status(statusCode).json({
      error: error.oauth2Error || 'server_error',
      error_description: error.message || 'An error occurred'
    });
  }
  
  // Standard error format
  res.status(statusCode).json({
    error: error.code || 'internal_error',
    errorDescription: error.message || 'An unexpected error occurred',
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack
    })
  });
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(
  req: Request,
  res: Response
): void {
  res.status(404).json({
    error: 'not_found',
    errorDescription: `Route not found: ${req.method} ${req.path}`
  });
}

/**
 * Async route handler wrapper
 * Catches promise rejections and passes to error handler
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

### 2.3 Usage

```typescript
// src/server.ts
import express from 'express';
import { errorHandler, notFoundHandler } from './middleware/error-handler';

const app = express();

// ... routes ...

// 404 handler (before error handler)
app.use(notFoundHandler);

// Error handler (LAST middleware)
app.use(errorHandler);
```

---

## 3. Request Logger Middleware

**File: `src/middleware/request-logger.ts`**

### 3.1 Purpose

Log all HTTP requests for debugging and monitoring.

### 3.2 Implementation

```typescript
import { Request, Response, NextFunction } from 'express';

/**
 * Request logging middleware
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  
  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusColor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    const reset = '\x1b[0m';
    
    console.log(
      `[${new Date().toISOString()}] ` +
      `${req.method} ${req.path} ` +
      `${statusColor}${res.statusCode}${reset} ` +
      `${duration}ms`
    );
  });
  
  next();
}
```

### 3.3 Usage

```typescript
import { requestLogger } from './middleware/request-logger';

app.use(requestLogger);
```

---

## 4. CORS Middleware

**File: `src/middleware/cors.ts`**

### 4.1 Purpose

Configure Cross-Origin Resource Sharing for frontend access.

### 4.2 Implementation

```typescript
import cors, { CorsOptions } from 'cors';

/**
 * CORS configuration
 */
export function configureCors(): cors.CorsOptionsDelegate {
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000', // Development
    'http://localhost:5173'  // Vite dev server
  ];
  
  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600 // 10 minutes
  };
  
  return corsOptions;
}
```

### 4.3 Usage

```typescript
import cors from 'cors';
import { configureCors } from './middleware/cors';

app.use(cors(configureCors()));
```

---

## 5. Validation Middleware

**File: `src/middleware/validation.ts`**

### 5.1 Purpose

Validate request bodies, query parameters, and path parameters.

### 5.2 Implementation

```typescript
import { Request, Response, NextFunction } from 'express';

interface ValidationRules {
  body?: Record<string, 'required' | 'optional'>;
  query?: Record<string, 'required' | 'optional'>;
  params?: Record<string, 'required' | 'optional'>;
}

/**
 * Request validation middleware factory
 */
export function validateRequest(rules: ValidationRules) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];
    
    // Validate body
    if (rules.body) {
      for (const [field, requirement] of Object.entries(rules.body)) {
        if (requirement === 'required' && !req.body?.[field]) {
          errors.push(`Missing required field: body.${field}`);
        }
      }
    }
    
    // Validate query
    if (rules.query) {
      for (const [field, requirement] of Object.entries(rules.query)) {
        if (requirement === 'required' && !req.query?.[field]) {
          errors.push(`Missing required parameter: ${field}`);
        }
      }
    }
    
    // Validate params
    if (rules.params) {
      for (const [field, requirement] of Object.entries(rules.params)) {
        if (requirement === 'required' && !req.params?.[field]) {
          errors.push(`Missing required parameter: ${field}`);
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'invalid_request',
        errorDescription: errors.join(', '),
        details: errors
      });
    }
    
    next();
  };
}
```

### 5.3 Usage

```typescript
import { validateRequest } from './middleware/validation';

router.post(
  '/flows/start',
  validateRequest({
    body: {
      clientConfig: 'required',
      serverConfig: 'required',
      vulnerabilityConfig: 'optional'
    }
  }),
  asyncHandler(async (req, res) => {
    // Handler code
  })
);
```

---

## Document Metadata

| Property | Value |
|----------|-------|
| **Version** | 1.0.0 |
| **Status** | ✅ Complete for MVP Middleware |
| **Parent** | [backend-specification.md](auth-optics-backend-specification.md) |
