# AuthOptics Frontend - State Management Specification

> *"State is the root of all headache." - Frontend Developer Proverb*

---

## Document Information

| Property | Value |
|----------|-------|
| **Component** | packages/frontend/src/context and hooks |
| **Purpose** | Global state management and custom React hooks |
| **Status** | ✅ MVP Critical |
| **Parent Doc** | [auth-optics-frontend-specification.md](auth-optics-frontend-specification.md) |

---

## Table of Contents

1. [Overview](#1-overview)
2. [State Architecture](#2-state-architecture)
3. [FlowContext Implementation](#3-flowcontext-implementation)
4. [Custom Hooks](#4-custom-hooks)
5. [State Management Patterns](#5-state-management-patterns)

---

## 1. Overview

### 1.1 Purpose

State management handles the global application state for OAuth2 flow execution, configuration, and UI state using React Context API with useReducer.

**Why Context + useReducer?**
- ✅ Simple mental model for MVP scope
- ✅ No external dependencies (built into React)
- ✅ Type-safe with TypeScript
- ✅ Sufficient for single-flow state
- ✅ Easy testing with reducers
- ✅ Can migrate to Zustand/Redux in Phase 2 if needed

### 1.2 State Structure Overview

```typescript
interface AppState {
  // Current flow execution
  currentFlow: {
    id: string | null;
    type: FlowType;
    status: 'idle' | 'starting' | 'running' | 'complete' | 'error';
    steps: FlowStep[];
    tokens: Tokens | null;
    security: SecurityAssessment | null;
    error: string | null;
    startedAt: string | null;
    completedAt: string | null;
  };
  
  // OAuth2 client configuration
  config: ClientConfig;
  
  // Vulnerability mode settings
  vulnerabilityMode: VulnerabilityConfig;
  
  // UI state
  ui: {
    darkMode: boolean;
    sidebarOpen: boolean;
    selectedStep: number | null;
    showTokenDetails: boolean;
  };
}
```

---

## 2. State Architecture

### 2.1 Context Provider Structure

```typescript
/**
 * Context structure
 * 
 * File: src/context/FlowContext.tsx
 */

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { AppState, AppAction } from './types';
import { flowReducer, initialState } from './reducer';

interface FlowContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const FlowContext = createContext<FlowContextValue | undefined>(undefined);

export const FlowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(flowReducer, initialState);
  
  return (
    <FlowContext.Provider value={{ state, dispatch }}>
      {children}
    </FlowContext.Provider>
  );
};

export const useFlowContext = () => {
  const context = useContext(FlowContext);
  if (!context) {
    throw new Error('useFlowContext must be used within FlowProvider');
  }
  return context;
};
```

### 2.2 Initial State

```typescript
/**
 * Initial application state
 * 
 * File: src/context/reducer.ts
 */

export const initialState: AppState = {
  currentFlow: {
    id: null,
    type: 'authorization_code',
    status: 'idle',
    steps: [],
    tokens: null,
    security: null,
    error: null,
    startedAt: null,
    completedAt: null
  },
  
  config: {
    clientId: import.meta.env.VITE_DEFAULT_CLIENT_ID || 'spa-client',
    redirectUri: import.meta.env.VITE_DEFAULT_REDIRECT_URI || 'http://localhost:3000/callback',
    scopes: ['openid', 'profile', 'email'],
    responseType: 'code',
    usePKCE: true,
    useState: true
  },
  
  vulnerabilityMode: {
    enabled: false,
    toggles: {
      DISABLE_PKCE: false
    }
  },
  
  ui: {
    darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
    sidebarOpen: true,
    selectedStep: null,
    showTokenDetails: false
  }
};
```

---

## 3. FlowContext Implementation

### 3.1 Action Types

```typescript
/**
 * All possible actions for the flow reducer
 * 
 * File: src/context/types.ts
 */

export type AppAction =
  // Flow actions
  | { type: 'FLOW_START'; payload: { flowId: string; flowType: FlowType } }
  | { type: 'FLOW_STEP_STARTED'; payload: { step: FlowStep } }
  | { type: 'FLOW_STEP_COMPLETE'; payload: { step: FlowStep } }
  | { type: 'FLOW_COMPLETE'; payload: { flow: Flow } }
  | { type: 'FLOW_ERROR'; payload: { error: string } }
  | { type: 'FLOW_RESET' }
  
  // Config actions
  | { type: 'CONFIG_UPDATE'; payload: Partial<ClientConfig> }
  | { type: 'CONFIG_RESET' }
  
  // Vulnerability mode actions
  | { type: 'VULNERABILITY_TOGGLE'; payload: { toggle: string; enabled: boolean } }
  | { type: 'VULNERABILITY_MODE_ENABLE' }
  | { type: 'VULNERABILITY_MODE_DISABLE' }
  
  // Token actions
  | { type: 'TOKENS_RECEIVED'; payload: { tokens: Tokens } }
  | { type: 'SECURITY_ASSESSED'; payload: { assessment: SecurityAssessment } }
  
  // UI actions
  | { type: 'UI_TOGGLE_DARK_MODE' }
  | { type: 'UI_TOGGLE_SIDEBAR' }
  | { type: 'UI_SELECT_STEP'; payload: { stepNumber: number | null } }
  | { type: 'UI_TOGGLE_TOKEN_DETAILS' };
```

### 3.2 Reducer Implementation

```typescript
/**
 * Main flow reducer
 * 
 * File: src/context/reducer.ts
 * Lines: ~200
 */

export function flowReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // --- Flow Actions ---
    
    case 'FLOW_START':
      return {
        ...state,
        currentFlow: {
          ...state.currentFlow,
          id: action.payload.flowId,
          type: action.payload.flowType,
          status: 'starting',
          steps: [],
          tokens: null,
          security: null,
          error: null,
          startedAt: new Date().toISOString(),
          completedAt: null
        }
      };
    
    case 'FLOW_STEP_STARTED':
      return {
        ...state,
        currentFlow: {
          ...state.currentFlow,
          status: 'running',
          steps: updateSteps(state.currentFlow.steps, action.payload.step)
        }
      };
    
    case 'FLOW_STEP_COMPLETE':
      return {
        ...state,
        currentFlow: {
          ...state.currentFlow,
          steps: updateSteps(state.currentFlow.steps, action.payload.step)
        }
      };
    
    case 'FLOW_COMPLETE':
      return {
        ...state,
        currentFlow: {
          ...state.currentFlow,
          status: 'complete',
          steps: action.payload.flow.steps,
          tokens: action.payload.flow.tokens,
          security: action.payload.flow.security,
          completedAt: new Date().toISOString()
        }
      };
    
    case 'FLOW_ERROR':
      return {
        ...state,
        currentFlow: {
          ...state.currentFlow,
          status: 'error',
          error: action.payload.error,
          completedAt: new Date().toISOString()
        }
      };
    
    case 'FLOW_RESET':
      return {
        ...state,
        currentFlow: initialState.currentFlow
      };
    
    // --- Config Actions ---
    
    case 'CONFIG_UPDATE':
      return {
        ...state,
        config: {
          ...state.config,
          ...action.payload
        }
      };
    
    case 'CONFIG_RESET':
      return {
        ...state,
        config: initialState.config
      };
    
    // --- Vulnerability Mode Actions ---
    
    case 'VULNERABILITY_TOGGLE':
      return {
        ...state,
        vulnerabilityMode: {
          ...state.vulnerabilityMode,
          toggles: {
            ...state.vulnerabilityMode.toggles,
            [action.payload.toggle]: action.payload.enabled
          }
        }
      };
    
    case 'VULNERABILITY_MODE_ENABLE':
      return {
        ...state,
        vulnerabilityMode: {
          ...state.vulnerabilityMode,
          enabled: true
        }
      };
    
    case 'VULNERABILITY_MODE_DISABLE':
      return {
        ...state,
        vulnerabilityMode: {
          ...state.vulnerabilityMode,
          enabled: false,
          toggles: {
            DISABLE_PKCE: false
          }
        }
      };
    
    // --- Token Actions ---
    
    case 'TOKENS_RECEIVED':
      return {
        ...state,
        currentFlow: {
          ...state.currentFlow,
          tokens: action.payload.tokens
        }
      };
    
    case 'SECURITY_ASSESSED':
      return {
        ...state,
        currentFlow: {
          ...state.currentFlow,
          security: action.payload.assessment
        }
      };
    
    // --- UI Actions ---
    
    case 'UI_TOGGLE_DARK_MODE':
      return {
        ...state,
        ui: {
          ...state.ui,
          darkMode: !state.ui.darkMode
        }
      };
    
    case 'UI_TOGGLE_SIDEBAR':
      return {
        ...state,
        ui: {
          ...state.ui,
          sidebarOpen: !state.ui.sidebarOpen
        }
      };
    
    case 'UI_SELECT_STEP':
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedStep: action.payload.stepNumber
        }
      };
    
    case 'UI_TOGGLE_TOKEN_DETAILS':
      return {
        ...state,
        ui: {
          ...state.ui,
          showTokenDetails: !state.ui.showTokenDetails
        }
      };
    
    default:
      return state;
  }
}

/**
 * Helper: Update steps array with new or updated step
 */
function updateSteps(steps: FlowStep[], newStep: FlowStep): FlowStep[] {
  const existingIndex = steps.findIndex(s => s.stepNumber === newStep.stepNumber);
  
  if (existingIndex >= 0) {
    // Update existing step
    const updated = [...steps];
    updated[existingIndex] = newStep;
    return updated;
  }
  
  // Add new step
  return [...steps, newStep].sort((a, b) => a.stepNumber - b.stepNumber);
}
```

---

## 4. Custom Hooks

### 4.1 useFlowEvents Hook

```typescript
/**
 * Hook for handling SSE flow events
 * 
 * File: src/hooks/useFlowEvents.ts
 * Lines: ~80-100
 */

import { useEffect, useRef } from 'react';
import { useFlowContext } from '../context/FlowContext';
import { sseService } from '../services/SSEService';

export function useFlowEvents(flowId: string | null) {
  const { dispatch } = useFlowContext();
  const isConnected = useRef(false);
  
  useEffect(() => {
    if (!flowId || isConnected.current) return;
    
    isConnected.current = true;
    
    sseService.connect(flowId, {
      onConnected: () => {
        console.log('[useFlowEvents] Connected to flow:', flowId);
      },
      
      onStepStarted: (data) => {
        console.log('[useFlowEvents] Step started:', data.step.name);
        dispatch({
          type: 'FLOW_STEP_STARTED',
          payload: { step: data.step }
        });
      },
      
      onStepComplete: (data) => {
        console.log('[useFlowEvents] Step complete:', data.step.name);
        dispatch({
          type: 'FLOW_STEP_COMPLETE',
          payload: { step: data.step }
        });
      },
      
      onFlowComplete: (data) => {
        console.log('[useFlowEvents] Flow complete');
        dispatch({
          type: 'FLOW_COMPLETE',
          payload: { flow: data }
        });
      },
      
      onError: (data) => {
        console.error('[useFlowEvents] Flow error:', data.error);
        dispatch({
          type: 'FLOW_ERROR',
          payload: { error: data.error }
        });
      },
      
      onSecurityAssessed: (data) => {
        console.log('[useFlowEvents] Security assessed');
        dispatch({
          type: 'SECURITY_ASSESSED',
          payload: { assessment: data.assessment }
        });
      }
    });
    
    return () => {
      sseService.disconnect();
      isConnected.current = false;
    };
  }, [flowId, dispatch]);
}
```

### 4.2 useFlowExecution Hook

```typescript
/**
 * Hook for executing OAuth2 flows
 * 
 * File: src/hooks/useFlowExecution.ts
 * Lines: ~100-120
 */

import { useState, useCallback } from 'react';
import { useFlowContext } from '../context/FlowContext';
import { apiService } from '../services/ApiService';
import type { StartFlowRequest } from '../services/ApiService';

export function useFlowExecution() {
  const { state, dispatch } = useFlowContext();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Start a new OAuth2 flow
   */
  const startFlow = useCallback(async () => {
    try {
      setIsStarting(true);
      setError(null);
      
      // Prepare request
      const request: StartFlowRequest = {
        flowType: state.currentFlow.type,
        config: state.config,
        vulnerabilityMode: state.vulnerabilityMode
      };
      
      // Start flow via API
      const response = await apiService.startFlow(request);
      
      // Update state with flow ID
      dispatch({
        type: 'FLOW_START',
        payload: {
          flowId: response.flowId,
          flowType: state.currentFlow.type
        }
      });
      
      return response.flowId;
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start flow';
      setError(message);
      
      dispatch({
        type: 'FLOW_ERROR',
        payload: { error: message }
      });
      
      throw err;
      
    } finally {
      setIsStarting(false);
    }
  }, [state.currentFlow.type, state.config, state.vulnerabilityMode, dispatch]);
  
  /**
   * Reset flow to initial state
   */
  const resetFlow = useCallback(() => {
    dispatch({ type: 'FLOW_RESET' });
    setError(null);
  }, [dispatch]);
  
  /**
   * Get flow status
   */
  const getFlowStatus = useCallback(async (flowId: string) => {
    try {
      return await apiService.getFlow(flowId);
    } catch (err) {
      console.error('Failed to get flow status:', err);
      throw err;
    }
  }, []);
  
  return {
    startFlow,
    resetFlow,
    getFlowStatus,
    isStarting,
    error,
    flowStatus: state.currentFlow.status
  };
}
```

### 4.3 useTokenValidation Hook

```typescript
/**
 * Hook for JWT token validation
 * 
 * File: src/hooks/useTokenValidation.ts
 * Lines: ~60-80
 */

import { useState, useCallback } from 'react';
import { tokenService } from '../services/TokenService';
import type { JWT, ValidationResult } from '../services/TokenService';

export function useTokenValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  
  /**
   * Decode JWT token
   */
  const decodeToken = useCallback((token: string): JWT | null => {
    try {
      return tokenService.decodeJWT(token);
    } catch (err) {
      console.error('Failed to decode token:', err);
      return null;
    }
  }, []);
  
  /**
   * Validate JWT token
   */
  const validateToken = useCallback(async (token: string) => {
    try {
      setIsValidating(true);
      const result = await tokenService.validateToken(token);
      setValidationResult(result);
      return result;
    } catch (err) {
      console.error('Failed to validate token:', err);
      throw err;
    } finally {
      setIsValidating(false);
    }
  }, []);
  
  /**
   * Check if token is expired
   */
  const isTokenExpired = useCallback((token: string): boolean => {
    return tokenService.isExpired(token);
  }, []);
  
  /**
   * Get token expiration time
   */
  const getExpirationTime = useCallback((token: string): number | null => {
    const jwt = tokenService.decodeJWT(token);
    return jwt?.payload.exp || null;
  }, []);
  
  return {
    decodeToken,
    validateToken,
    isTokenExpired,
    getExpirationTime,
    isValidating,
    validationResult
  };
}
```

### 4.4 useConfig Hook

```typescript
/**
 * Hook for managing OAuth2 client configuration
 * 
 * File: src/hooks/useConfig.ts
 * Lines: ~40-50
 */

import { useCallback } from 'react';
import { useFlowContext } from '../context/FlowContext';
import type { ClientConfig } from '@authoptics/shared';

export function useConfig() {
  const { state, dispatch } = useFlowContext();
  
  /**
   * Update configuration
   */
  const updateConfig = useCallback((updates: Partial<ClientConfig>) => {
    dispatch({
      type: 'CONFIG_UPDATE',
      payload: updates
    });
  }, [dispatch]);
  
  /**
   * Reset configuration to defaults
   */
  const resetConfig = useCallback(() => {
    dispatch({ type: 'CONFIG_RESET' });
  }, [dispatch]);
  
  /**
   * Toggle scope
   */
  const toggleScope = useCallback((scope: string) => {
    const currentScopes = state.config.scopes;
    const newScopes = currentScopes.includes(scope)
      ? currentScopes.filter(s => s !== scope)
      : [...currentScopes, scope];
    
    updateConfig({ scopes: newScopes });
  }, [state.config.scopes, updateConfig]);
  
  return {
    config: state.config,
    updateConfig,
    resetConfig,
    toggleScope
  };
}
```

### 4.5 useVulnerabilityMode Hook

```typescript
/**
 * Hook for managing vulnerability mode
 * 
 * File: src/hooks/useVulnerabilityMode.ts
 * Lines: ~50-60
 */

import { useCallback } from 'react';
import { useFlowContext } from '../context/FlowContext';

export function useVulnerabilityMode() {
  const { state, dispatch } = useFlowContext();
  
  /**
   * Enable vulnerability mode
   */
  const enableVulnerabilityMode = useCallback(() => {
    dispatch({ type: 'VULNERABILITY_MODE_ENABLE' });
  }, [dispatch]);
  
  /**
   * Disable vulnerability mode
   */
  const disableVulnerabilityMode = useCallback(() => {
    dispatch({ type: 'VULNERABILITY_MODE_DISABLE' });
  }, [dispatch]);
  
  /**
   * Toggle specific vulnerability
   */
  const toggleVulnerability = useCallback((toggle: string, enabled: boolean) => {
    dispatch({
      type: 'VULNERABILITY_TOGGLE',
      payload: { toggle, enabled }
    });
  }, [dispatch]);
  
  /**
   * Check if any vulnerabilities are enabled
   */
  const hasActiveVulnerabilities = useCallback(() => {
    return Object.values(state.vulnerabilityMode.toggles).some(v => v === true);
  }, [state.vulnerabilityMode.toggles]);
  
  return {
    vulnerabilityMode: state.vulnerabilityMode,
    enableVulnerabilityMode,
    disableVulnerabilityMode,
    toggleVulnerability,
    hasActiveVulnerabilities
  };
}
```

---

## 5. State Management Patterns

### 5.1 State Update Pattern

```typescript
/**
 * Pattern for dispatching actions
 */

// ✅ GOOD: Use dispatch with typed action
dispatch({
  type: 'FLOW_STEP_COMPLETE',
  payload: { step: completedStep }
});

// ❌ BAD: Don't mutate state directly
state.currentFlow.steps.push(newStep); // WRONG!
```

### 5.2 Async Action Pattern

```typescript
/**
 * Pattern for async operations
 */

// ✅ GOOD: Handle async in custom hooks
const startFlow = useCallback(async () => {
  try {
    setIsLoading(true);
    const response = await apiService.startFlow(request);
    dispatch({ type: 'FLOW_START', payload: response });
  } catch (error) {
    dispatch({ type: 'FLOW_ERROR', payload: { error } });
  } finally {
    setIsLoading(false);
  }
}, [dispatch]);

// ❌ BAD: Don't dispatch async operations
dispatch(async () => {  // WRONG!
  const data = await fetch('...');
});
```

### 5.3 Derived State Pattern

```typescript
/**
 * Pattern for computed values
 */

// ✅ GOOD: Use selectors/computed values
const isFlowActive = state.currentFlow.status === 'running';
const hasTokens = state.currentFlow.tokens !== null;
const currentStep = state.currentFlow.steps.find(
  s => s.stepNumber === state.ui.selectedStep
);

// ❌ BAD: Don't store derived state
// Don't add isFlowActive to state - compute it!
```

### 5.4 Context Composition Pattern

```typescript
/**
 * Pattern for providing context
 */

// ✅ GOOD: Single provider in App.tsx
function App() {
  return (
    <FlowProvider>
      <Router>
        <Routes />
      </Router>
    </FlowProvider>
  );
}

// Access in components
function MyComponent() {
  const { state, dispatch } = useFlowContext();
  const { startFlow } = useFlowExecution();
  // ...
}
```

### 5.5 Performance Optimization

```typescript
/**
 * Pattern for performance
 */

// ✅ GOOD: Memoize expensive computations
const decodedToken = useMemo(() => {
  if (!state.currentFlow.tokens?.access) return null;
  return tokenService.decodeJWT(state.currentFlow.tokens.access);
}, [state.currentFlow.tokens?.access]);

// ✅ GOOD: Use callback for stable references
const handleStepClick = useCallback((stepNumber: number) => {
  dispatch({ type: 'UI_SELECT_STEP', payload: { stepNumber } });
}, [dispatch]);

// ❌ BAD: Don't create new functions on every render
const handleClick = () => {  // WRONG - recreated every render!
  dispatch({ type: 'SOME_ACTION' });
};
```

---

## 6. Testing State Management

### 6.1 Reducer Tests

```typescript
/**
 * Test reducer functions
 * 
 * File: src/context/__tests__/reducer.test.ts
 */

import { flowReducer, initialState } from '../reducer';

describe('flowReducer', () => {
  it('should start flow', () => {
    const action = {
      type: 'FLOW_START' as const,
      payload: { flowId: 'flow-123', flowType: 'authorization_code' as const }
    };
    
    const newState = flowReducer(initialState, action);
    
    expect(newState.currentFlow.id).toBe('flow-123');
    expect(newState.currentFlow.status).toBe('starting');
    expect(newState.currentFlow.startedAt).toBeTruthy();
  });
  
  it('should add flow step', () => {
    const step: FlowStep = {
      stepNumber: 1,
      name: 'Authorization Request',
      status: 'complete',
      request: { /* ... */ },
      response: { /* ... */ },
      timestamp: new Date().toISOString()
    };
    
    const action = {
      type: 'FLOW_STEP_COMPLETE' as const,
      payload: { step }
    };
    
    const newState = flowReducer(initialState, action);
    
    expect(newState.currentFlow.steps).toHaveLength(1);
    expect(newState.currentFlow.steps[0]).toEqual(step);
  });
  
  it('should handle flow error', () => {
    const action = {
      type: 'FLOW_ERROR' as const,
      payload: { error: 'Connection failed' }
    };
    
    const newState = flowReducer(initialState, action);
    
    expect(newState.currentFlow.status).toBe('error');
    expect(newState.currentFlow.error).toBe('Connection failed');
  });
});
```

### 6.2 Hook Tests

```typescript
/**
 * Test custom hooks
 * 
 * File: src/hooks/__tests__/useFlowExecution.test.ts
 */

import { renderHook, act } from '@testing-library/react';
import { FlowProvider } from '../../context/FlowContext';
import { useFlowExecution } from '../useFlowExecution';
import { apiService } from '../../services/ApiService';

jest.mock('../../services/ApiService');

describe('useFlowExecution', () => {
  it('should start flow successfully', async () => {
    const mockResponse = { flowId: 'flow-123' };
    (apiService.startFlow as jest.Mock).mockResolvedValue(mockResponse);
    
    const wrapper = ({ children }: any) => (
      <FlowProvider>{children}</FlowProvider>
    );
    
    const { result } = renderHook(() => useFlowExecution(), { wrapper });
    
    await act(async () => {
      const flowId = await result.current.startFlow();
      expect(flowId).toBe('flow-123');
    });
    
    expect(result.current.isStarting).toBe(false);
    expect(result.current.error).toBeNull();
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
1. Implement FlowContext with reducer
2. Create custom hooks (useFlowEvents, useFlowExecution, useTokenValidation)
3. Test reducer and hooks
4. See [frontend-services.md](frontend-services.md) for service implementations
