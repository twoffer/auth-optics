# AuthOptics Frontend - Implementation Guide

> *"A journey of a thousand lines begins with a single commit." - Ancient Developer Proverb*

---

## Document Information

| Property | Value |
|----------|-------|
| **Component** | packages/frontend (complete implementation workflow) |
| **Purpose** | Step-by-step guide for project setup, routing, testing, deployment, and orchestrating implementation |
| **Status** | ✅ MVP Complete |
| **Parent Doc** | [auth-optics-frontend-specification.md](auth-optics-frontend-specification.md) |
| **Related Docs** | [Components](frontend-components.md), [State Management](frontend-state-management.md), [Services](frontend-services.md) |

---

## Table of Contents

1. [Project Setup](#1-project-setup)
2. [Routing & Navigation](#2-routing--navigation)
3. [Styling & Theme](#3-styling--theme)
4. [Testing Strategy](#4-testing-strategy)
5. [Build & Deployment](#5-build--deployment)
6. [Implementation Roadmap](#6-implementation-roadmap)

---

## Document Purpose

This guide focuses on:
- ✅ **Project initialization** - Vite, TypeScript, dependencies
- ✅ **Routing setup** - React Router 6 configuration (Phase 2)
- ✅ **Styling configuration** - Tailwind CSS, design tokens
- ✅ **Testing infrastructure** - Vitest, React Testing Library, Playwright
- ✅ **Build & deployment** - Production builds, Docker
- ✅ **Implementation roadmap** - 6-phase plan (16-23 hours)

**For implementation details, see:**
- **Components**: [frontend-components.md](frontend-components.md) - All React component implementations
- **State Management**: [frontend-state-management.md](frontend-state-management.md) - FlowContext, reducers, custom hooks
- **Services**: [frontend-services.md](frontend-services.md) - ApiService, SSEService, TokenService

---

# 1. Project Setup

## 1.1 Initialize Vite Project

```bash
# Create new Vite project
pnpm create vite@latest frontend -- --template react-ts

# Navigate to project
cd frontend

# Install dependencies
pnpm install
```

## 1.2 Install Dependencies

```bash
# Core dependencies
pnpm add react-router-dom @radix-ui/react-tabs @radix-ui/react-accordion \
  @radix-ui/react-switch @radix-ui/react-dialog @radix-ui/react-tooltip \
  @radix-ui/react-select lucide-react axios prismjs clsx tailwind-merge

# Dev dependencies
pnpm add -D @types/prismjs autoprefixer postcss tailwindcss \
  @vitejs/plugin-react typescript @types/node
```

## 1.3 Configure TypeScript

**File: `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    
    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    
    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    
    /* Path aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@authoptics/shared": ["../shared/src/index.ts"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## 1.4 Directory Structure

```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/          # React components
│   │   ├── FlowTimeline.tsx
│   │   ├── TokenInspector.tsx
│   │   ├── RequestResponseViewer.tsx
│   │   ├── SecurityIndicators.tsx
│   │   ├── ConfigPanel.tsx
│   │   ├── VulnerabilityModePanel.tsx
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── ui/              # Shared UI components
│   │       ├── Button.tsx
│   │       ├── Badge.tsx
│   │       └── Card.tsx
│   ├── context/             # React Context providers
│   │   ├── FlowContext.tsx
│   │   ├── types.ts
│   │   └── reducer.ts
│   ├── hooks/               # Custom React hooks
│   │   ├── useFlowEvents.ts
│   │   ├── useFlowExecution.ts
│   │   ├── useTokenValidation.ts
│   │   ├── useConfig.ts
│   │   └── useVulnerabilityMode.ts
│   ├── services/            # External service clients
│   │   ├── ApiService.ts
│   │   ├── SSEService.ts
│   │   ├── TokenService.ts
│   │   └── ConfigService.ts
│   ├── utils/               # Utility functions
│   │   ├── cn.ts            # Tailwind className merger
│   │   └── format.ts        # Formatters
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Entry point
│   ├── index.css            # Global styles
│   └── vite-env.d.ts        # Vite types
├── .env.example             # Environment template
├── .env                     # Local environment (gitignored)
├── index.html               # HTML template
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

## 1.5 Environment Variables

**File: `.env.example`**

```bash
# Backend API
VITE_API_BASE_URL=http://localhost:3001

# KeyCloak
VITE_KEYCLOAK_URL=http://localhost:8080

# OAuth2 defaults
VITE_DEFAULT_CLIENT_ID=spa-client
VITE_DEFAULT_REDIRECT_URI=http://localhost:3000/callback
```

**File: `.env`** (copy from .env.example and customize)

## 1.6 Component Implementation Order

**Refer to these documents for implementation:**

1. **State Management** → [frontend-state-management.md](frontend-state-management.md)
   - Implement FlowContext with reducer
   - Create all custom hooks (useFlowEvents, useFlowExecution, etc.)

2. **Services Layer** → [frontend-services.md](frontend-services.md)
   - Implement ApiService (HTTP client)
   - Implement SSEService (EventSource)
   - Implement TokenService (JWT operations)
   - Implement ConfigService (localStorage)

3. **UI Components** → [frontend-components.md](frontend-components.md)
   - Implement FlowTimeline
   - Implement TokenInspector
   - Implement RequestResponseViewer
   - Implement SecurityIndicators
   - Implement ConfigPanel
   - Implement VulnerabilityModePanel

---

# 2. Routing & Navigation

## 2.1 Route Structure (MVP - Single Page)

For MVP, we use a simple single-page layout **without React Router**. Routing will be added in Phase 2.

```
/ (root)
├── Header
├── Sidebar
│   ├── ConfigPanel
│   └── VulnerabilityModePanel
└── MainContent
    ├── FlowTimeline
    ├── RequestResponseViewer
    ├── TokenInspector
    └── SecurityIndicators
```

## 2.2 App Layout (MVP)

**File: `src/App.tsx`**

```typescript
import React from 'react';
import { FlowProvider } from './context/FlowContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { FlowViewer } from './components/FlowViewer';
import { useFlowEvents } from './hooks/useFlowEvents';
import { useFlowContext } from './context/FlowContext';

// Main app content (inside providers)
const AppContent: React.FC = () => {
  const { state } = useFlowContext();
  
  // Connect to SSE when flow starts
  useFlowEvents(state.currentFlow.id);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="flex">
        <Sidebar className="w-96 min-h-screen border-r bg-white dark:bg-gray-800" />
        
        <main className="flex-1 p-6">
          <FlowViewer />
        </main>
      </div>
    </div>
  );
};

// App with providers
function App() {
  return (
    <FlowProvider>
      <AppContent />
    </FlowProvider>
  );
}

export default App;
```

## 2.3 React Router Setup (Phase 2)

For Phase 2, add React Router for multiple views:

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <FlowProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/flow/:flowId" element={<FlowViewerPage />} />
          <Route path="/history" element={<FlowHistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/callback" element={<CallbackHandler />} />
        </Routes>
      </BrowserRouter>
    </FlowProvider>
  );
}
```

---

# 3. Styling & Theme

## 3.1 Tailwind CSS Configuration

**File: `tailwind.config.js`**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Flow status colors
        'flow-idle': '#6b7280',
        'flow-running': '#3b82f6',
        'flow-complete': '#10b981',
        'flow-error': '#ef4444',
        
        // Security levels
        'security-high': '#10b981',
        'security-medium': '#f59e0b',
        'security-low': '#ef4444',
        
        // Component colors
        'primary': '#3b82f6',
        'secondary': '#6366f1',
        'accent': '#8b5cf6',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
```

**File: `postcss.config.js`**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

## 3.2 Global Styles

**File: `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
  }
  
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
  }
  
  * {
    @apply border-gray-200 dark:border-gray-700;
  }
  
  body {
    @apply bg-background text-foreground;
  }
}

@layer components {
  .step-icon {
    @apply w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium;
  }
  
  .step-icon-complete {
    @apply bg-green-500 text-white;
  }
  
  .step-icon-running {
    @apply bg-blue-500 text-white animate-pulse;
  }
  
  .step-icon-pending {
    @apply bg-gray-300 text-gray-600;
  }
  
  .code-block {
    @apply bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto;
  }
}
```

## 3.3 Dark Mode Implementation

**File: `src/hooks/useDarkMode.ts`**

```typescript
import { useEffect } from 'react';
import { useFlowContext } from '../context/FlowContext';

export function useDarkMode() {
  const { state, dispatch } = useFlowContext();
  
  useEffect(() => {
    const root = window.document.documentElement;
    
    if (state.ui.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.ui.darkMode]);
  
  const toggleDarkMode = () => {
    dispatch({ type: 'UI_TOGGLE_DARK_MODE' });
  };
  
  return {
    darkMode: state.ui.darkMode,
    toggleDarkMode
  };
}
```

## 3.4 Utility Function for Class Names

**File: `src/utils/cn.ts`**

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

# 4. Testing Strategy

## 4.1 Test Setup

**Install Testing Dependencies:**

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event jsdom @playwright/test
```

**File: `vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@authoptics/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

**File: `src/test/setup.ts`**

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock EventSource for SSE tests
global.EventSource = class EventSource {
  constructor(url: string) {
    console.log('Mock EventSource created:', url);
  }
  addEventListener() {}
  removeEventListener() {}
  close() {}
} as any;
```

## 4.2 Component Tests

**Example: FlowTimeline.test.tsx**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FlowTimeline } from '../components/FlowTimeline';
import type { FlowStep } from '@authoptics/shared';

describe('FlowTimeline', () => {
  const mockSteps: FlowStep[] = [
    {
      stepNumber: 1,
      name: 'Authorization Request',
      status: 'complete',
      timestamp: new Date().toISOString(),
      request: { method: 'GET', url: 'http://example.com' },
      response: { status: 302, headers: {}, body: null }
    },
    {
      stepNumber: 2,
      name: 'User Authentication',
      status: 'running',
      timestamp: new Date().toISOString(),
      request: null,
      response: null
    },
  ];
  
  it('renders all steps', () => {
    render(
      <FlowTimeline 
        steps={mockSteps}
        selectedStep={null}
        onStepSelect={() => {}}
      />
    );
    
    expect(screen.getByText('Authorization Request')).toBeInTheDocument();
    expect(screen.getByText('User Authentication')).toBeInTheDocument();
  });
  
  it('calls onStepSelect when step clicked', () => {
    const onSelect = vi.fn();
    
    render(
      <FlowTimeline 
        steps={mockSteps}
        selectedStep={null}
        onStepSelect={onSelect}
      />
    );
    
    fireEvent.click(screen.getByText('Authorization Request'));
    expect(onSelect).toHaveBeenCalledWith(1);
  });
});
```

## 4.3 Hook Tests

**Example: useFlowExecution.test.ts**

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FlowProvider } from '../context/FlowContext';
import { useFlowExecution } from '../hooks/useFlowExecution';
import { apiService } from '../services/ApiService';

vi.mock('../services/ApiService');

describe('useFlowExecution', () => {
  it('starts flow successfully', async () => {
    const mockResponse = { flowId: 'flow-123', authorizationUrl: 'https://...' };
    vi.mocked(apiService.startFlow).mockResolvedValue(mockResponse);
    
    const wrapper = ({ children }: any) => (
      <FlowProvider>{children}</FlowProvider>
    );
    
    const { result } = renderHook(() => useFlowExecution(), { wrapper });
    
    let flowId: string = '';
    await act(async () => {
      flowId = await result.current.startFlow();
    });
    
    expect(flowId).toBe('flow-123');
    expect(result.current.isStarting).toBe(false);
  });
});
```

## 4.4 Integration Tests

**Example: FlowExecution.integration.test.tsx**

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

describe('Flow Execution Integration', () => {
  it('completes full authorization code flow', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Configure OAuth2 client
    await user.type(screen.getByLabelText(/Client ID/i), 'test-client');
    await user.type(screen.getByLabelText(/Redirect URI/i), 'http://localhost:3000/callback');
    
    // Start flow
    await user.click(screen.getByText(/Start Flow/i));
    
    // Wait for flow to complete
    await waitFor(() => {
      expect(screen.getByText(/Flow Complete/i)).toBeInTheDocument();
    }, { timeout: 10000 });
  });
});
```

## 4.5 E2E Tests with Playwright

**File: `e2e/flow-execution.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('OAuth2 Flow Execution', () => {
  test('should complete authorization code flow', async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:3000');
    
    // Configure client
    await page.fill('input[name="clientId"]', 'spa-client');
    await page.fill('input[name="redirectUri"]', 'http://localhost:3000/callback');
    await page.check('input[value="openid"]');
    
    // Start flow
    await page.click('button:has-text("Start Flow")');
    
    // Wait for flow timeline to appear
    await expect(page.locator('[data-testid="flow-timeline"]')).toBeVisible();
    
    // Verify steps appear
    await expect(page.locator('text=Authorization Request')).toBeVisible();
    await expect(page.locator('text=Token Exchange')).toBeVisible();
    
    // Wait for completion
    await expect(page.locator('text=Flow Complete')).toBeVisible({ timeout: 10000 });
  });
});
```

---

# 5. Build & Deployment

## 5.1 Vite Build Configuration

**File: `vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@authoptics/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-tabs', '@radix-ui/react-accordion'],
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

## 5.2 Production Build

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview

# Check bundle size
pnpm build --mode production
```

## 5.3 Docker Deployment

**File: `Dockerfile`**

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/frontend/package.json ./packages/frontend/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared ./packages/shared
COPY packages/frontend ./packages/frontend

# Build shared types
WORKDIR /app/packages/shared
RUN pnpm build

# Build frontend
WORKDIR /app/packages/frontend
RUN pnpm build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html

# Copy nginx config
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**File: `nginx.conf`**

```nginx
server {
    listen 80;
    server_name localhost;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 5.4 Environment Variables for Production

```bash
# .env.production
VITE_API_BASE_URL=https://api.authoptics.com
VITE_KEYCLOAK_URL=https://keycloak.authoptics.com
VITE_DEFAULT_CLIENT_ID=authoptics-spa
VITE_DEFAULT_REDIRECT_URI=https://app.authoptics.com/callback
```

---

# 6. Implementation Roadmap

## 6.1 Phase-by-Phase Implementation (16-23 hours total)

### Phase 1: Project Setup (2-3 hours)

**Tasks:**
- [ ] Initialize Vite + React + TypeScript project
- [ ] Install all dependencies (Tailwind, Radix UI, axios, etc.)
- [ ] Configure Tailwind CSS
- [ ] Create directory structure
- [ ] Set up environment variables (.env, .env.example)
- [ ] Configure TypeScript (tsconfig.json, path aliases)
- [ ] Set up ESLint and Prettier
- [ ] Verify hot reload works

**Deliverables:**
- ✅ Working dev server on port 3000
- ✅ TypeScript strict mode enabled
- ✅ Tailwind CSS functional
- ✅ Directory structure complete

**Verification:**
```bash
pnpm dev  # Should start without errors
```

---

### Phase 2: Core Components (6-8 hours)

**Reference: [frontend-components.md](frontend-components.md)**

**Tasks:**
1. **FlowTimeline Component** (2-3 hours)
   - [ ] Create component structure
   - [ ] Implement step rendering with icons
   - [ ] Add status colors (idle, running, complete, error)
   - [ ] Add click handlers for step selection
   - [ ] Write unit tests

2. **RequestResponseViewer Component** (2 hours)
   - [ ] Create tabbed interface (Radix Tabs)
   - [ ] Implement request display
   - [ ] Implement response display
   - [ ] Add JSON syntax highlighting (Prism.js)
   - [ ] Add copy to clipboard buttons
   - [ ] Write unit tests

3. **TokenInspector Component** (3 hours)
   - [ ] Implement JWT decoding (use TokenService)
   - [ ] Create decoded view (header, payload, signature)
   - [ ] Create raw view (formatted JWT)
   - [ ] Add claim explanations with tooltips
   - [ ] Add token validation display
   - [ ] Add expiration countdown
   - [ ] Write unit tests

4. **SecurityIndicators Component** (1 hour)
   - [ ] Create badge components
   - [ ] Add PKCE indicator
   - [ ] Add state parameter indicator
   - [ ] Add HTTPS indicator
   - [ ] Add tooltips with explanations
   - [ ] Write unit tests

5. **ConfigPanel Component** (2 hours)
   - [ ] Create form layout
   - [ ] Add input validation
   - [ ] Implement scope selector (checkboxes)
   - [ ] Add "Start Flow" button
   - [ ] Add reset functionality
   - [ ] Wire to useConfig hook
   - [ ] Write unit tests

6. **VulnerabilityModePanel Component** (1 hour)
   - [ ] Create toggle layout
   - [ ] Implement DISABLE_PKCE toggle
   - [ ] Add warning messages
   - [ ] Add RFC reference links
   - [ ] Wire to useVulnerabilityMode hook
   - [ ] Write unit tests

**Deliverables:**
- ✅ All 6 components fully functional
- ✅ Unit tests passing (>80% coverage)
- ✅ Components properly typed with TypeScript
- ✅ Storybook stories (optional, Phase 2)

---

### Phase 3: State Management (2-3 hours)

**Reference: [frontend-state-management.md](frontend-state-management.md)**

**Tasks:**
1. **FlowContext Implementation** (1 hour)
   - [ ] Create FlowContext.tsx with useReducer
   - [ ] Define AppState interface
   - [ ] Define AppAction types (20+ actions)
   - [ ] Implement flowReducer with all cases
   - [ ] Create FlowProvider component
   - [ ] Create useFlowContext hook
   - [ ] Test reducer with unit tests

2. **Custom Hooks** (1.5-2 hours)
   - [ ] Implement useFlowEvents hook (SSE integration)
   - [ ] Implement useFlowExecution hook (API calls)
   - [ ] Implement useTokenValidation hook (JWT operations)
   - [ ] Implement useConfig hook (configuration management)
   - [ ] Implement useVulnerabilityMode hook (security toggles)
   - [ ] Test all hooks

**Deliverables:**
- ✅ FlowContext provider working
- ✅ All custom hooks functional
- ✅ State updates working correctly
- ✅ Hook tests passing

---

### Phase 4: Services Layer (2-3 hours)

**Reference: [frontend-services.md](frontend-services.md)**

**Tasks:**
1. **ApiService** (1 hour)
   - [ ] Create axios client with base URL
   - [ ] Implement request/response interceptors
   - [ ] Implement startFlow() method
   - [ ] Implement getFlow() method
   - [ ] Implement validateToken() method
   - [ ] Add error handling
   - [ ] Write service tests

2. **SSEService** (1 hour)
   - [ ] Create EventSource wrapper class
   - [ ] Implement connect() method
   - [ ] Implement event handlers (step:started, step:complete, flow:complete, flow:error)
   - [ ] Implement disconnect() method
   - [ ] Add reconnection logic with exponential backoff
   - [ ] Write service tests

3. **TokenService** (30 min)
   - [ ] Implement isJWT() check
   - [ ] Implement decodeJWT() method
   - [ ] Implement validateToken() method (client-side)
   - [ ] Implement isExpired() check
   - [ ] Implement getTimeToExpiration()
   - [ ] Add base64url decoder
   - [ ] Write service tests

4. **ConfigService** (30 min)
   - [ ] Implement loadClientConfig() from localStorage
   - [ ] Implement saveClientConfig() to localStorage
   - [ ] Implement loadVulnerabilityMode()
   - [ ] Implement saveVulnerabilityMode()
   - [ ] Implement loadUIPreferences() (dark mode)
   - [ ] Add clearAll() method

**Deliverables:**
- ✅ All services implemented
- ✅ Service tests passing
- ✅ Error handling working
- ✅ SSE reconnection logic working

---

### Phase 5: Integration (2-3 hours)

**Tasks:**
1. **Wire Components to State** (1 hour)
   - [ ] Connect FlowTimeline to FlowContext
   - [ ] Connect TokenInspector to useTokenValidation
   - [ ] Connect RequestResponseViewer to FlowContext
   - [ ] Connect SecurityIndicators to FlowContext
   - [ ] Connect ConfigPanel to useConfig
   - [ ] Connect VulnerabilityModePanel to useVulnerabilityMode

2. **Wire State to Services** (1 hour)
   - [ ] Connect useFlowExecution to ApiService
   - [ ] Connect useFlowEvents to SSEService
   - [ ] Connect useTokenValidation to TokenService
   - [ ] Connect useConfig to ConfigService

3. **App Layout** (30 min)
   - [ ] Create App.tsx with providers
   - [ ] Create Header component
   - [ ] Create Sidebar component
   - [ ] Create FlowViewer wrapper component
   - [ ] Test full application layout

4. **End-to-End Testing** (30 min)
   - [ ] Test complete flow execution
   - [ ] Test SSE real-time updates
   - [ ] Test token inspection
   - [ ] Test vulnerability toggle
   - [ ] Fix any integration issues

**Deliverables:**
- ✅ All components wired to state and services
- ✅ Complete flow execution working
- ✅ Real-time updates via SSE functional
- ✅ All interactions working correctly

---

### Phase 6: Testing & Polish (2-3 hours)

**Tasks:**
1. **Component Tests** (1 hour)
   - [ ] Write tests for all components
   - [ ] Achieve >80% test coverage
   - [ ] Test error states
   - [ ] Test loading states

2. **Integration Tests** (30 min)
   - [ ] Write flow execution integration test
   - [ ] Test complete user workflows
   - [ ] Test error scenarios

3. **E2E Tests** (30 min)
   - [ ] Set up Playwright
   - [ ] Write E2E test for authorization code flow
   - [ ] Test across different browsers

4. **Accessibility Audit** (30 min)
   - [ ] Test keyboard navigation
   - [ ] Add ARIA labels where missing
   - [ ] Test with screen reader
   - [ ] Fix focus styles

5. **UI Polish** (30 min)
   - [ ] Refine spacing and alignment
   - [ ] Add loading states
   - [ ] Add error states
   - [ ] Test dark mode
   - [ ] Optimize performance

**Deliverables:**
- ✅ Test coverage >80%
- ✅ E2E tests passing
- ✅ Accessibility compliant (WCAG 2.1 AA)
- ✅ Polished UI
- ✅ Production-ready frontend

---

## 6.2 Implementation Checklist

```
MVP Implementation Checklist:

Phase 1: Project Setup (2-3h)
[ ] Project initialized with Vite + React + TypeScript
[ ] Dependencies installed (Tailwind, Radix UI, axios)
[ ] Directory structure created
[ ] Environment variables configured
[ ] Dev server running on port 3000

Phase 2: Core Components (6-8h)
[ ] FlowTimeline component complete
[ ] TokenInspector component complete
[ ] RequestResponseViewer component complete
[ ] SecurityIndicators component complete
[ ] ConfigPanel component complete
[ ] VulnerabilityModePanel component complete

Phase 3: State Management (2-3h)
[ ] FlowContext with reducer implemented
[ ] useFlowEvents hook implemented
[ ] useFlowExecution hook implemented
[ ] useTokenValidation hook implemented
[ ] useConfig hook implemented
[ ] useVulnerabilityMode hook implemented

Phase 4: Services Layer (2-3h)
[ ] ApiService implemented (HTTP client)
[ ] SSEService implemented (EventSource)
[ ] TokenService implemented (JWT operations)
[ ] ConfigService implemented (localStorage)

Phase 5: Integration (2-3h)
[ ] Components wired to state
[ ] State wired to services
[ ] App layout complete
[ ] End-to-end flow working

Phase 6: Testing & Polish (2-3h)
[ ] Component tests written (>80% coverage)
[ ] Integration tests written
[ ] E2E tests written
[ ] Accessibility audit complete
[ ] UI polish complete

Total Estimated Time: 16-23 hours
```

---

## 6.3 Success Criteria

Frontend MVP is complete when:

1. ✅ User can configure OAuth2 client (client ID, redirect URI, scopes)
2. ✅ User can start Authorization Code Flow with PKCE
3. ✅ Flow timeline displays all steps in real-time
4. ✅ Request/response viewer shows complete HTTP details
5. ✅ Token inspector displays decoded JWT with all claims
6. ✅ Security indicators show PKCE, state, HTTPS status
7. ✅ Vulnerability mode toggle works (DISABLE_PKCE)
8. ✅ SSE connection provides real-time flow updates
9. ✅ Copy to clipboard works for tokens and cURL commands
10. ✅ Error states display clear messages
11. ✅ UI is keyboard accessible
12. ✅ Dark mode toggle functions correctly
13. ✅ All TypeScript strict mode passes
14. ✅ Test coverage >80%

---

## Document Metadata

| Property | Value |
|----------|-------|
| **Version** | 2.0.0 (Refactored) |
| **Status** | ✅ Complete for MVP (no duplication) |
| **Total Lines** | ~1,100 |
| **Parent** | [auth-optics-frontend-specification.md](auth-optics-frontend-specification.md) |

---

## Implementation Ready!

This guide provides the complete workflow for building the AuthOptics frontend. Follow the 6-phase roadmap (16-23 hours total) and refer to these documents for detailed implementations:

1. **[auth-optics-frontend-specification.md](auth-optics-frontend-specification.md)** - Architecture overview
2. **[frontend-components.md](frontend-components.md)** - UI component specifications (complete TypeScript implementations)
3. **[frontend-state-management.md](frontend-state-management.md)** - Context API, reducers, and custom hooks
4. **[frontend-services.md](frontend-services.md)** - API client, SSE, token operations
5. **[frontend-implementation-guide.md](frontend-implementation-guide.md)** - This document (workflow orchestration)

**Start with Phase 1 (Project Setup) and work through each phase sequentially for best results!**
