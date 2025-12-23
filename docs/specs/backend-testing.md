# AuthOptics Backend - Testing Strategy

## Document Information

| Property | Value |
|----------|-------|
| **Component** | packages/backend/tests |
| **Purpose** | Unit, integration, and E2E testing strategy |
| **Status** | ⚠️ MVP Basic, Phase 2 Comprehensive |
| **Parent Doc** | [backend-specification.md](auth-optics-backend-specification.md) |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Unit Testing](#2-unit-testing)
3. [Integration Testing](#3-integration-testing)
4. [Testing Tools](#4-testing-tools)

---

## 1. Overview

### 1.1 Testing Pyramid

```
        /\
       /  \
      / E2E \          Few (Phase 3)
     /______\
    /        \
   /Integration\       Some (Phase 2)
  /____________\
 /              \
/  Unit Tests    \    Many (MVP)
/________________\
```

### 1.2 Test Coverage Goals

| Test Type | MVP Target | Phase 2 Target |
|-----------|------------|----------------|
| **Unit** | 60% | 80% |
| **Integration** | 40% | 70% |
| **E2E** | 0% | 50% |

---

## 2. Unit Testing

### 2.1 PKCEGenerator Tests

**File: `tests/unit/PKCEGenerator.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { PKCEGenerator } from '../../src/services/PKCEGenerator';

describe('PKCEGenerator', () => {
  const generator = new PKCEGenerator();
  
  describe('generate()', () => {
    it('should generate PKCE parameters', async () => {
      const result = await generator.generate();
      
      expect(result.codeVerifier).toBeDefined();
      expect(result.codeChallenge).toBeDefined();
      expect(result.codeChallengeMethod).toBe('S256');
    });
    
    it('should generate 43-character code verifier', async () => {
      const result = await generator.generate();
      
      expect(result.codeVerifier.length).toBe(43);
    });
    
    it('should use only valid characters', async () => {
      const result = await generator.generate();
      const validChars = /^[A-Za-z0-9\-._~]+$/;
      
      expect(validChars.test(result.codeVerifier)).toBe(true);
    });
  });
  
  describe('validate()', () => {
    it('should validate matching verifier and challenge', async () => {
      const { codeVerifier, codeChallenge } = await generator.generate();
      
      const result = await generator.validate(
        codeVerifier,
        codeChallenge,
        'S256'
      );
      
      expect(result.valid).toBe(true);
    });
    
    it('should reject mismatched verifier and challenge', async () => {
      const { codeChallenge } = await generator.generate();
      
      const result = await generator.validate(
        'wrong-verifier',
        codeChallenge,
        'S256'
      );
      
      expect(result.valid).toBe(false);
    });
  });
});
```

### 2.2 StateManager Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { StateManager } from '../../src/services/StateManager';

describe('StateManager', () => {
  let manager: StateManager;
  
  beforeEach(() => {
    manager = new StateManager();
  });
  
  describe('generate()', () => {
    it('should generate state parameter', () => {
      const state = manager.generate('flow-123');
      
      expect(state.value).toBeDefined();
      expect(state.flowId).toBe('flow-123');
      expect(state.used).toBe(false);
    });
    
    it('should generate unique state values', () => {
      const state1 = manager.generate('flow-1');
      const state2 = manager.generate('flow-2');
      
      expect(state1.value).not.toBe(state2.value);
    });
  });
  
  describe('validate()', () => {
    it('should validate correct state', () => {
      const state = manager.generate('flow-123');
      
      const result = manager.validate(state.value, 'flow-123');
      
      expect(result.valid).toBe(true);
    });
    
    it('should reject unknown state', () => {
      const result = manager.validate('unknown-state', 'flow-123');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not found');
    });
    
    it('should reject already-used state', () => {
      const state = manager.generate('flow-123');
      
      // Use state once
      manager.validate(state.value, 'flow-123');
      
      // Try to use again
      const result = manager.validate(state.value, 'flow-123');
      
      expect(result.valid).toBe(false);
      expect(result.wasAlreadyUsed).toBe(true);
    });
  });
});
```

---

## 3. Integration Testing

### 3.1 Flow Orchestration Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { FlowOrchestrator } from '../../src/services/FlowOrchestrator';
import { FlowStateManager } from '../../src/services/FlowStateManager';

describe('FlowOrchestrator Integration', () => {
  let orchestrator: FlowOrchestrator;
  let stateManager: FlowStateManager;
  
  beforeEach(() => {
    stateManager = new FlowStateManager();
    orchestrator = new FlowOrchestrator(stateManager);
  });
  
  it('should complete full authorization code flow', async () => {
    // Start flow
    const flow = await orchestrator.startAuthorizationCodeFlow(
      mockClientConfig,
      mockServerConfig,
      mockVulnConfig
    );
    
    expect(flow.id).toBeDefined();
    expect(flow.steps.length).toBeGreaterThan(0);
    
    // Simulate callback
    const code = 'mock-authorization-code';
    const state = flow.steps[0].request?.url?.match(/state=([^&]+)/)?.[1];
    
    const completedFlow = await orchestrator.handleCallback(
      flow.id,
      code,
      state!
    );
    
    expect(completedFlow.status).toBe('complete');
  });
});
```

---

## 4. Testing Tools

### 4.1 Test Configuration

**File: `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts'
      ]
    }
  }
});
```

### 4.2 Test Commands

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --dir tests/unit",
    "test:integration": "vitest run --dir tests/integration",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch"
  }
}
```

---

## Document Metadata

| Property | Value |
|----------|-------|
| **Version** | 1.0.0 |
| **Status** | ⚠️ MVP Basic Testing |
| **Parent** | [backend-specification.md](auth-optics-backend-specification.md) |
