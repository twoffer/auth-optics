# AuthOptics Backend - Server-Sent Events (SSE)

## Document Information

| Property | Value |
|----------|-------|
| **Component** | packages/backend/src/routes/events.routes.ts |
| **Purpose** | Real-time flow updates via Server-Sent Events |
| **Status** | ✅ MVP Critical |
| **Parent Doc** | [backend-specification.md](auth-optics-backend-specification.md) |

---

## Table of Contents

1. [Overview](#1-overview)
2. [SSE Implementation](#2-sse-implementation)
3. [Event Types](#3-event-types)
4. [Connection Management](#4-connection-management)
5. [Client Integration](#5-client-integration)

---

## 1. Overview

### 1.1 Purpose

Server-Sent Events (SSE) provide real-time updates from backend to frontend as OAuth2 flows progress through their steps.

**Why SSE?**
- ✅ Simple HTTP-based protocol
- ✅ Automatic reconnection
- ✅ One-way server-to-client streaming
- ✅ Better than polling (real-time, efficient)
- ✅ Built-in browser support (EventSource API)

**vs WebSockets:**
- SSE is simpler for one-way communication
- SSE auto-reconnects on disconnect
- SSE works through HTTP/HTTPS (no protocol upgrade)
- WebSockets for bidirectional communication (not needed here)

### 1.2 Event Flow

```
Backend                    Frontend
   │                          │
   │   GET /api/events/:id    │
   │<─────────────────────────│
   │                          │
   │   event: connected       │
   │─────────────────────────>│
   │   data: {flowId, ...}    │
   │                          │
   │   event: step:started    │
   │─────────────────────────>│
   │   data: {step: {...}}    │
   │                          │
   │   event: step:complete   │
   │─────────────────────────>│
   │   data: {step: {...}}    │
   │                          │
   │   ... more events ...    │
   │                          │
   │   event: flow:complete   │
   │─────────────────────────>│
   │   data: {flow: {...}}    │
   │                          │
   │   [connection closes]    │
   │                          │
```

---

## 2. SSE Implementation

### 2.1 Route Handler

**File: `src/routes/events.routes.ts`**

```typescript
import { Router, Request, Response } from 'express';
import { FlowOrchestrator } from '../services/FlowOrchestrator';
import { FlowStateManager } from '../services/FlowStateManager';

const router = Router();
const stateManager = new FlowStateManager();
const orchestrator = new FlowOrchestrator(stateManager);

/**
 * GET /api/events/:flowId
 * 
 * Server-Sent Events stream for flow updates
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
  
  // CORS headers (if needed)
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Send initial connection message
  sendEvent(res, 'connected', {
    flowId,
    timestamp: new Date().toISOString(),
    message: 'SSE connection established'
  });
  
  // If flow already complete, send existing steps
  if (flow.status === 'complete' || flow.status === 'error') {
    // Send all steps
    flow.steps.forEach(step => {
      sendEvent(res, 'step:complete', { flowId, step });
    });
    
    // Send final event
    if (flow.status === 'complete') {
      sendEvent(res, 'flow:complete', flow);
    } else {
      sendEvent(res, 'flow:error', { flowId, error: flow.error });
    }
    
    // Close connection
    res.end();
    return;
  }
  
  // Event handlers
  const handlers = {
    'step:started': (data: any) => {
      if (data.flowId === flowId) {
        sendEvent(res, 'step:started', data);
      }
    },
    
    'step:complete': (data: any) => {
      if (data.flowId === flowId) {
        sendEvent(res, 'step:complete', data);
      }
    },
    
    'flow:complete': (data: any) => {
      if (data.id === flowId) {
        sendEvent(res, 'flow:complete', data);
        // Close connection after short delay
        setTimeout(() => res.end(), 1000);
      }
    },
    
    'flow:error': (data: any) => {
      if (data.flowId === flowId) {
        sendEvent(res, 'flow:error', data);
        // Close connection after short delay
        setTimeout(() => res.end(), 1000);
      }
    },
    
    'security:assessed': (data: any) => {
      if (data.flowId === flowId) {
        sendEvent(res, 'security:assessed', data);
      }
    }
  };
  
  // Register event handlers
  Object.entries(handlers).forEach(([event, handler]) => {
    orchestrator.on(event, handler);
  });
  
  // Keep-alive ping every 15 seconds
  const keepAliveInterval = setInterval(() => {
    sendComment(res, 'keep-alive ping');
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

/**
 * Send SSE event
 */
function sendEvent(res: Response, event: string, data: any): void {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * Send SSE comment (for keep-alive)
 */
function sendComment(res: Response, comment: string): void {
  res.write(`: ${comment}\n\n`);
}

export default router;
```

### 2.2 Key Implementation Details

**SSE Headers:**
```typescript
'Content-Type': 'text/event-stream'    // Required
'Cache-Control': 'no-cache'            // Prevent caching
'Connection': 'keep-alive'             // Keep connection open
'X-Accel-Buffering': 'no'              // Disable nginx buffering
```

**Event Format:**
```
event: step:complete
data: {"flowId":"123","step":{...}}

```
(Note: Two newlines at end)

**Keep-Alive:**
- Send comment every 15 seconds
- Prevents connection timeout
- Format: `: comment text\n\n`

---

## 3. Event Types

### 3.1 connected

**Purpose:** Confirm SSE connection established

```typescript
event: connected
data: {
  "flowId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-12-17T10:30:00Z",
  "message": "SSE connection established"
}
```

### 3.2 step:started

**Purpose:** Flow step has begun

```typescript
event: step:started
data: {
  "flowId": "550e8400-e29b-41d4-a716-446655440000",
  "step": {
    "stepNumber": 1,
    "name": "Authorization Request",
    "description": "Generate authorization URL",
    "status": "running",
    "startedAt": "2024-12-17T10:30:01Z"
  }
}
```

### 3.3 step:complete

**Purpose:** Flow step has completed

```typescript
event: step:complete
data: {
  "flowId": "550e8400-e29b-41d4-a716-446655440000",
  "step": {
    "stepNumber": 1,
    "name": "Authorization Request",
    "status": "complete",
    "completedAt": "2024-12-17T10:30:02Z",
    "duration": 1000,
    "request": { /* HTTP request details */ },
    "securityIndicators": [ /* indicators */ ]
  }
}
```

### 3.4 security:assessed

**Purpose:** Security assessment complete

```typescript
event: security:assessed
data: {
  "flowId": "550e8400-e29b-41d4-a716-446655440000",
  "assessment": {
    "score": 90,
    "level": "excellent",
    "checks": [ /* security checks */ ]
  }
}
```

### 3.5 flow:complete

**Purpose:** Entire flow completed successfully

```typescript
event: flow:complete
data: {
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "complete",
  "completedAt": "2024-12-17T10:35:00Z",
  "duration": 300000,
  "steps": [ /* all steps */ ],
  "tokens": { /* tokens */ },
  "securityAssessment": { /* assessment */ }
}
```

### 3.6 flow:error

**Purpose:** Flow encountered error

```typescript
event: flow:error
data: {
  "flowId": "550e8400-e29b-41d4-a716-446655440000",
  "error": {
    "error": "flow_error",
    "errorDescription": "Token exchange failed",
    "step": 3
  }
}
```

---

## 4. Connection Management

### 4.1 Connection Lifecycle

```typescript
/**
 * Connection lifecycle management
 */
class SSEConnectionManager {
  private connections: Map<string, Set<Response>> = new Map();
  
  /**
   * Add connection for flow
   */
  addConnection(flowId: string, res: Response): void {
    if (!this.connections.has(flowId)) {
      this.connections.set(flowId, new Set());
    }
    this.connections.get(flowId)!.add(res);
    
    console.log(`[SSE] Client connected to flow ${flowId}`);
  }
  
  /**
   * Remove connection
   */
  removeConnection(flowId: string, res: Response): void {
    const connections = this.connections.get(flowId);
    if (connections) {
      connections.delete(res);
      
      if (connections.size === 0) {
        this.connections.delete(flowId);
      }
    }
    
    console.log(`[SSE] Client disconnected from flow ${flowId}`);
  }
  
  /**
   * Broadcast event to all connections for flow
   */
  broadcast(flowId: string, event: string, data: any): void {
    const connections = this.connections.get(flowId);
    if (!connections) return;
    
    connections.forEach(res => {
      try {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (error) {
        console.error(`[SSE] Failed to send to client:`, error);
        this.removeConnection(flowId, res);
      }
    });
  }
  
  /**
   * Get connection count
   */
  getConnectionCount(flowId: string): number {
    return this.connections.get(flowId)?.size || 0;
  }
}
```

### 4.2 Error Handling

```typescript
/**
 * SSE error handling
 */

// Handle write errors
try {
  sendEvent(res, 'step:complete', data);
} catch (error) {
  console.error('SSE write error:', error);
  // Connection likely closed - cleanup
  cleanupConnection(flowId, res);
}

// Handle client disconnect
req.on('close', () => {
  console.log(`Client disconnected from flow ${flowId}`);
  cleanupConnection(flowId, res);
});

// Handle server errors
req.on('error', (error) => {
  console.error('SSE connection error:', error);
  cleanupConnection(flowId, res);
});
```

### 4.3 Reconnection Strategy

Backend automatically accepts reconnections - frontend handles:

```typescript
// Frontend (example)
const eventSource = new EventSource(`/api/events/${flowId}`);

eventSource.addEventListener('connected', () => {
  console.log('SSE connected');
});

// Automatic reconnection on disconnect
eventSource.onerror = (error) => {
  console.error('SSE error:', error);
  // EventSource will auto-reconnect
};
```

---

## 5. Client Integration

### 5.1 Frontend EventSource Usage

```typescript
// src/services/FlowEventService.ts (Frontend)

class FlowEventService {
  private eventSource: EventSource | null = null;
  
  /**
   * Connect to flow event stream
   */
  connect(flowId: string, handlers: {
    onConnected?: () => void;
    onStepStarted?: (data: any) => void;
    onStepComplete?: (data: any) => void;
    onFlowComplete?: (data: any) => void;
    onError?: (data: any) => void;
  }): void {
    // Close existing connection
    this.disconnect();
    
    // Create new EventSource
    const url = `${API_BASE_URL}/api/events/${flowId}`;
    this.eventSource = new EventSource(url);
    
    // Register handlers
    this.eventSource.addEventListener('connected', () => {
      console.log('[SSE] Connected to flow:', flowId);
      handlers.onConnected?.();
    });
    
    this.eventSource.addEventListener('step:started', (event) => {
      const data = JSON.parse(event.data);
      handlers.onStepStarted?.(data);
    });
    
    this.eventSource.addEventListener('step:complete', (event) => {
      const data = JSON.parse(event.data);
      handlers.onStepComplete?.(data);
    });
    
    this.eventSource.addEventListener('flow:complete', (event) => {
      const data = JSON.parse(event.data);
      handlers.onFlowComplete?.(data);
      this.disconnect(); // Close after flow complete
    });
    
    this.eventSource.addEventListener('flow:error', (event) => {
      const data = JSON.parse(event.data);
      handlers.onError?.(data);
      this.disconnect(); // Close after error
    });
    
    // Handle connection errors
    this.eventSource.onerror = (error) => {
      console.error('[SSE] Connection error:', error);
      
      // Check if connection is closed
      if (this.eventSource?.readyState === EventSource.CLOSED) {
        console.log('[SSE] Connection closed');
      }
    };
  }
  
  /**
   * Disconnect from event stream
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log('[SSE] Disconnected');
    }
  }
}

export default new FlowEventService();
```

### 5.2 React Hook Example

```typescript
// useFlowEvents.ts (Frontend React Hook)

import { useEffect, useRef } from 'react';
import FlowEventService from '../services/FlowEventService';

export function useFlowEvents(
  flowId: string,
  onStepComplete: (step: FlowStep) => void,
  onFlowComplete: (flow: FlowExecution) => void
) {
  const isConnected = useRef(false);
  
  useEffect(() => {
    if (!flowId || isConnected.current) return;
    
    isConnected.current = true;
    
    FlowEventService.connect(flowId, {
      onConnected: () => {
        console.log('Connected to flow events');
      },
      
      onStepComplete: (data) => {
        console.log('Step complete:', data.step.name);
        onStepComplete(data.step);
      },
      
      onFlowComplete: (data) => {
        console.log('Flow complete');
        onFlowComplete(data);
      },
      
      onError: (data) => {
        console.error('Flow error:', data.error);
      }
    });
    
    return () => {
      FlowEventService.disconnect();
      isConnected.current = false;
    };
  }, [flowId, onStepComplete, onFlowComplete]);
}
```

---

## Document Metadata

| Property | Value |
|----------|-------|
| **Version** | 1.0.0 |
| **Status** | ✅ Complete for MVP SSE |
| **Parent** | [backend-specification.md](auth-optics-backend-specification.md) |

---

**Next Steps:**
1. Implement SSE route with keep-alive
2. Test connection lifecycle
3. Test automatic reconnection
4. Implement frontend EventSource integration
5. See [backend-middleware.md](backend-middleware.md) for error handling
