# Visualization Requirements - Implementation Guide
## Technical Implementation and Development Roadmap

> *"Code is poetry written in logic."*

---

## Document Information

| Property | Value |
|----------|-------|
| **Document Type** | Technical Implementation Guide |
| **Target Audience** | Frontend developers, architects |
| **Purpose** | Define technical implementation approach |
| **Related Docs** | All visualization documents |
| **Part** | 6 of 6 (Implementation Guide) |

---

## 1. Recommended Technical Stack

### 1.1 Core Framework

**React** (Recommended)

**Rationale**:
- Component-based architecture matches visualization needs
- Large ecosystem of libraries
- Excellent state management options
- Strong TypeScript support
- Good performance with proper optimization

**Alternative**: Vue.js or Svelte (both viable)

### 1.2 State Management

**Primary**: React Context + useReducer (for simple state)
**Complex**: Redux Toolkit or Zustand

**State Structure**:
```typescript
interface AppState {
  // Current flow
  currentFlow: {
    id: string;
    type: FlowType;
    status: 'idle' | 'running' | 'complete' | 'error';
    steps: FlowStep[];
    tokens: Tokens;
    security: SecurityAssessment;
  };
  
  // Configuration
  config: {
    clientConfig: ClientConfig;
    serverConfig: ServerConfig;
    vulnerabilityConfig: VulnerabilityConfig;
  };
  
  // UI state
  ui: {
    learningMode: boolean;
    darkMode: boolean;
    sidebarOpen: boolean;
    selectedStep: number | null;
  };
  
  // History
  flows: Flow[];
}
```

### 1.3 UI Component Library

**Recommended**: Radix UI + Tailwind CSS

**Rationale**:
- Radix UI: Unstyled, accessible components
- Tailwind CSS: Utility-first styling
- Full control over appearance
- Excellent accessibility built-in
- Good TypeScript support

**Alternative**: Material-UI, Ant Design, or Chakra UI

**Component Needs**:
- Button, Badge, Card
- Accordion, Tabs, Dialog
- Tooltip, Popover
- Progress Bar
- Code Block with syntax highlighting

### 1.4 Data Visualization

**Recommended**: D3.js (for custom visualizations)

**Use Cases**:
- Timeline visualization
- Flow sequence diagrams
- Performance charts
- Token lifetime progress bars

**Alternative**: Recharts (for simpler charts)

### 1.5 Code Highlighting

**Recommended**: Prism.js or Highlight.js

**Use Cases**:
- JSON syntax highlighting
- JWT token display
- cURL command display
- HTTP request/response display

**Configuration**:
```javascript
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-http';
import 'prismjs/components/prism-bash';

// Custom OAuth2 grammar
Prism.languages.oauth2 = {
  'parameter': /\b(client_id|redirect_uri|state|code_challenge|scope)\b/,
  'value': /(["'])(?:\\.|(?!\1)[^\\\r\n])*\1/,
  // ... more rules
};
```

### 1.6 Animation Library

**Recommended**: Framer Motion

**Rationale**:
- Declarative animations
- Spring physics
- Gesture support
- Good React integration

**Use Cases**:
- Flow step transitions
- Panel slide-in/out
- Loading states
- Hover effects

**Example**:
```jsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {content}
</motion.div>
```

### 1.7 HTTP Client

**Recommended**: Axios or native Fetch API

**OAuth2 Client Wrapper**:
```typescript
class OAuth2Client {
  private config: ClientConfig;
  private vulnerabilityConfig: VulnerabilityConfig;
  
  constructor(config: ClientConfig, vulnConfig?: VulnerabilityConfig) {
    this.config = config;
    this.vulnerabilityConfig = vulnConfig || SECURE_DEFAULTS;
  }
  
  async executeAuthorizationCodeFlow(): Promise<FlowResult> {
    const steps: FlowStep[] = [];
    
    // Step 1: Authorization request
    const authStep = await this.buildAuthorizationRequest();
    steps.push(authStep);
    
    // ... more steps
    
    return {
      id: generateId(),
      type: 'authorization_code',
      steps,
      tokens: this.tokens,
      security: this.assessSecurity(),
    };
  }
  
  private buildAuthorizationRequest(): FlowStep {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope,
    });
    
    // PKCE
    if (!this.vulnerabilityConfig.toggles.DISABLE_PKCE) {
      const { verifier, challenge } = this.generatePKCE();
      params.set('code_challenge', challenge);
      params.set('code_challenge_method', 'S256');
      this.storeCodeVerifier(verifier);
    }
    
    // State
    if (!this.vulnerabilityConfig.toggles.SKIP_STATE_VALIDATION) {
      const state = this.generateState();
      params.set('state', state);
      this.storeState(state);
    }
    
    const url = `${this.config.authorizationEndpoint}?${params}`;
    
    return {
      stepNumber: 1,
      name: 'Authorization Request',
      type: 'request',
      method: 'GET',
      url,
      parameters: Object.fromEntries(params),
      timestamp: new Date().toISOString(),
      securityChecks: this.performSecurityChecks(params),
    };
  }
  
  // ... more methods
}
```

### 1.8 Testing Libraries

**Unit Tests**: Jest + React Testing Library
**E2E Tests**: Playwright or Cypress
**Visual Regression**: Percy or Chromatic
**Accessibility**: jest-axe + manual testing

---

## 2. Component Architecture

### 2.1 Component Hierarchy

```
App
├── Header
│   ├── Logo
│   ├── Navigation
│   └── UserMenu
├── Sidebar
│   ├── FlowSelector
│   ├── ConfigPanel
│   └── VulnerabilityModePanel
├── MainContent
│   ├── FlowTimeline
│   │   ├── TimelineStep
│   │   └── StepDetails
│   ├── FlowVisualization
│   │   ├── RequestViewer
│   │   ├── ResponseViewer
│   │   └── TokenInspector
│   └── SecurityPanel
│       ├── SecurityIndicators
│       ├── SecurityScorecard
│       └── VulnerabilityWarnings
├── ContextPanel
│   ├── StepDetails
│   ├── ParameterExplainer
│   └── SpecReferences
└── Modal System
    ├── EducationalModal
    ├── ComparisonModal
    └── ExportModal
```

### 2.2 Key Component Specifications

#### FlowTimeline Component

```typescript
interface FlowTimelineProps {
  flow: Flow;
  currentStep?: number;
  onStepClick: (stepNumber: number) => void;
  orientation?: 'horizontal' | 'vertical';
}

const FlowTimeline: React.FC<FlowTimelineProps> = ({
  flow,
  currentStep,
  onStepClick,
  orientation = 'horizontal'
}) => {
  return (
    <div className={`flow-timeline ${orientation}`}>
      {flow.steps.map((step, index) => (
        <TimelineStep
          key={step.stepNumber}
          step={step}
          isActive={step.stepNumber === currentStep}
          isCurrent={step.status === 'running'}
          isComplete={step.status === 'complete'}
          onClick={() => onStepClick(step.stepNumber)}
        />
      ))}
    </div>
  );
};
```

#### TokenInspector Component

```typescript
interface TokenInspectorProps {
  token: string;
  tokenType: 'access' | 'refresh' | 'id';
  onValidate?: (result: ValidationResult) => void;
}

const TokenInspector: React.FC<TokenInspectorProps> = ({
  token,
  tokenType,
  onValidate
}) => {
  const [view, setView] = useState<'decoded' | 'raw'>('decoded');
  const [jwt, setJwt] = useState<JWT | null>(null);
  
  useEffect(() => {
    if (isJWT(token)) {
      setJwt(decodeJWT(token));
    }
  }, [token]);
  
  if (!jwt) {
    return <OpaqueTokenView token={token} />;
  }
  
  return (
    <div className="token-inspector">
      <div className="token-inspector-header">
        <h3>{tokenType} Token</h3>
        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            <TabsTrigger value="decoded">Decoded</TabsTrigger>
            <TabsTrigger value="raw">Raw JWT</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {view === 'decoded' ? (
        <>
          <JWTHeader header={jwt.header} />
          <JWTPayload payload={jwt.payload} />
          <JWTSignature 
            signature={jwt.signature}
            onVerify={handleVerify}
          />
        </>
      ) : (
        <CodeBlock language="jwt" code={token} />
      )}
      
      <ValidationChecklist
        checks={validateToken(jwt)}
        onComplete={onValidate}
      />
    </div>
  );
};
```

#### SecurityScorecard Component

```typescript
interface SecurityScorecardProps {
  assessment: SecurityAssessment;
  onViewDetails?: () => void;
}

const SecurityScorecard: React.FC<SecurityScorecardProps> = ({
  assessment,
  onViewDetails
}) => {
  const { score, grade, categories, recommendations } = assessment;
  
  return (
    <Card className="security-scorecard">
      <CardHeader>
        <CardTitle>Security Assessment</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="score-display">
          <div className="score-circle">
            <CircularProgress value={score} max={100} />
            <span className="score-text">{score}/100</span>
          </div>
          <Badge variant={getGradeVariant(grade)}>
            Grade {grade}
          </Badge>
        </div>
        
        <div className="categories">
          {categories.map(category => (
            <CategoryScore key={category.name} category={category} />
          ))}
        </div>
        
        {recommendations.length > 0 && (
          <div className="recommendations">
            <h4>Recommendations</h4>
            <ul>
              {recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button onClick={onViewDetails}>View Detailed Report</Button>
      </CardFooter>
    </Card>
  );
};
```

---

## 3. Implementation Priorities

### 3.1 Phase 1: MVP (4-6 weeks)

**Goal**: Basic functioning tool with core flow

**Features**:
- ✓ Authorization Code Flow (with PKCE)
- ✓ Basic timeline visualization
- ✓ Request/response viewer
- ✓ JWT token inspector
- ✓ Basic security indicators (PKCE, state, HTTPS)
- ✓ Token validation

**Components**:
- FlowTimeline (horizontal)
- RequestViewer
- ResponseViewer
- TokenInspector (basic)
- SecurityIndicators

**Deliverables**:
- Working Authorization Code Flow
- Token decoding and validation
- Basic UI with essential features

### 3.2 Phase 2: Core Features (6-8 weeks)

**Goal**: All major flows + enhanced visualization

**Features**:
- ✓ Client Credentials Flow
- ✓ Device Authorization Flow
- ✓ Refresh Token Flow
- ✓ Complete security scorecard
- ✓ Vulnerability mode (basic toggles)
- ✓ Comparison view
- ✓ Export (JSON, cURL, Markdown)

**Components**:
- All flow implementations
- SecurityScorecard
- ComparisonView
- VulnerabilityModePanel
- ExportModal

**Deliverables**:
- All major OAuth2/OIDC flows
- Security assessment system
- Basic vulnerability demonstrations
- Export functionality

### 3.3 Phase 3: Polish & Advanced Features (4-6 weeks)

**Goal**: Production-ready with advanced features

**Features**:
- ✓ All vulnerability toggles (39 total)
- ✓ Advanced visualizations (sequence diagrams, animations)
- ✓ Educational content system
- ✓ Guided tours
- ✓ Learning mode
- ✓ Interactive quizzes
- ✓ Performance optimization
- ✓ Accessibility audit
- ✓ Mobile responsiveness

**Components**:
- Complete VulnerabilityMode system
- EducationalOverlay
- GuidedTour
- InteractiveQuiz
- SequenceDiagram
- Animations

**Deliverables**:
- Complete vulnerability mode
- Full educational features
- Polished, accessible UI
- Mobile-optimized experience
- Comprehensive testing

---

## 4. Performance Optimization

### 4.1 Code Splitting

**Strategy**: Route-based and component-based splitting

```typescript
// Route-based splitting
const FlowViewer = React.lazy(() => import('./pages/FlowViewer'));
const Comparison = React.lazy(() => import('./pages/Comparison'));
const Settings = React.lazy(() => import('./pages/Settings'));

// Component-based splitting
const TokenInspector = React.lazy(() => import('./components/TokenInspector'));
const SequenceDiagram = React.lazy(() => import('./components/SequenceDiagram'));
```

### 4.2 Memoization

**Strategy**: Memoize expensive calculations

```typescript
// Memoize JWT decoding
const decodedJWT = useMemo(() => {
  if (!token || !isJWT(token)) return null;
  return decodeJWT(token);
}, [token]);

// Memoize security assessment
const securityAssessment = useMemo(() => {
  return calculateSecurityScore(flow, vulnerabilityConfig);
}, [flow, vulnerabilityConfig]);

// Memoize filtered flows
const filteredFlows = useMemo(() => {
  return flows.filter(flow => 
    flow.type === filterType &&
    flow.status === filterStatus &&
    flow.securityScore >= minScore
  );
}, [flows, filterType, filterStatus, minScore]);
```

### 4.3 Virtual Scrolling

**Use Case**: Long lists (flows, logs, parameters)

```typescript
import { FixedSizeList } from 'react-window';

const FlowList: React.FC<{ flows: Flow[] }> = ({ flows }) => {
  return (
    <FixedSizeList
      height={600}
      itemCount={flows.length}
      itemSize={80}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <FlowListItem flow={flows[index]} />
        </div>
      )}
    </FixedSizeList>
  );
};
```

### 4.4 Debouncing

**Use Case**: Search, filter, auto-refresh

```typescript
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const SearchFlows: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 300);
  
  const results = useMemo(() => {
    return searchFlows(debouncedSearch);
  }, [debouncedSearch]);
  
  return (
    <div>
      <input 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search flows..."
      />
      <SearchResults results={results} />
    </div>
  );
};
```

### 4.5 Web Workers

**Use Case**: Heavy computations (JWT validation, large dataset processing)

```typescript
// worker.ts
self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;
  
  if (type === 'VALIDATE_JWT') {
    const result = validateJWT(payload.token, payload.publicKey);
    self.postMessage({ type: 'VALIDATION_RESULT', result });
  }
};

// Component
const useJWTValidation = () => {
  const worker = useRef<Worker>();
  
  useEffect(() => {
    worker.current = new Worker('/jwt-worker.js');
    return () => worker.current?.terminate();
  }, []);
  
  const validateToken = (token: string, publicKey: string) => {
    return new Promise((resolve) => {
      worker.current!.postMessage({
        type: 'VALIDATE_JWT',
        payload: { token, publicKey }
      });
      
      worker.current!.onmessage = (e) => {
        if (e.data.type === 'VALIDATION_RESULT') {
          resolve(e.data.result);
        }
      };
    });
  };
  
  return { validateToken };
};
```

---

## 5. Accessibility Implementation

### 5.1 Semantic HTML

**Guidelines**:
- Use semantic elements (`<header>`, `<nav>`, `<main>`, `<article>`, `<aside>`, `<footer>`)
- Use `<button>` for actions, `<a>` for navigation
- Use headings hierarchy (`<h1>` → `<h2>` → `<h3>`)
- Use `<label>` for form inputs

### 5.2 ARIA Labels

**Examples**:

```jsx
// Button with icon only
<button aria-label="Copy to clipboard">
  <ClipboardIcon />
</button>

// Expandable section
<button
  aria-expanded={isExpanded}
  aria-controls="step-details"
  onClick={() => setExpanded(!isExpanded)}
>
  Step 1: Authorization Request
</button>
<div id="step-details" aria-hidden={!isExpanded}>
  {/* Details */}
</div>

// Loading state
<div role="status" aria-live="polite">
  {isLoading ? 'Loading flow...' : 'Flow loaded'}
</div>

// Progress
<div
  role="progressbar"
  aria-valuenow={progress}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Token lifetime remaining"
>
  {progress}%
</div>
```

### 5.3 Keyboard Navigation

**Requirements**:
- All interactive elements focusable
- Logical tab order
- Focus visible (2px outline)
- Keyboard shortcuts documented

**Implementation**:

```jsx
// Focus management
const FocusManager: React.FC = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        // Handle tab navigation
      }
      if (e.key === 'Escape') {
        // Close modals, reset focus
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return <div ref={containerRef}>{children}</div>;
};
```

### 5.4 Screen Reader Support

**Announcements**:

```jsx
// Live region for status updates
const StatusAnnouncer: React.FC = () => {
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    // When flow completes
    if (flow.status === 'complete') {
      setMessage('Flow completed successfully');
    }
  }, [flow.status]);
  
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
};
```

---

## 6. Testing Strategy

### 6.1 Unit Tests (Jest + RTL)

**Component Testing**:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { TokenInspector } from './TokenInspector';

describe('TokenInspector', () => {
  it('decodes JWT token', () => {
    const token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...';
    render(<TokenInspector token={token} tokenType="access" />);
    
    expect(screen.getByText('RS256')).toBeInTheDocument();
    expect(screen.getByText('JWT')).toBeInTheDocument();
  });
  
  it('validates token expiration', async () => {
    const expiredToken = createExpiredToken();
    render(<TokenInspector token={expiredToken} tokenType="access" />);
    
    expect(await screen.findByText(/expired/i)).toBeInTheDocument();
  });
  
  it('switches between decoded and raw view', () => {
    const token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...';
    render(<TokenInspector token={token} tokenType="access" />);
    
    fireEvent.click(screen.getByText('Raw JWT'));
    expect(screen.getByText(token)).toBeInTheDocument();
  });
});
```

**OAuth2Client Testing**:

```typescript
import { OAuth2Client } from './OAuth2Client';
import { SECURE_DEFAULTS } from './constants';

describe('OAuth2Client', () => {
  describe('PKCE', () => {
    it('includes PKCE parameters when enabled', () => {
      const client = new OAuth2Client(config, SECURE_DEFAULTS);
      const authUrl = client.buildAuthorizationRequest();
      
      expect(authUrl).toContain('code_challenge=');
      expect(authUrl).toContain('code_challenge_method=S256');
    });
    
    it('omits PKCE when disabled', () => {
      const vulnConfig = {
        enabled: true,
        toggles: { DISABLE_PKCE: true }
      };
      const client = new OAuth2Client(config, vulnConfig);
      const authUrl = client.buildAuthorizationRequest();
      
      expect(authUrl).not.toContain('code_challenge');
    });
  });
  
  describe('State validation', () => {
    it('validates matching state', () => {
      const client = new OAuth2Client(config, SECURE_DEFAULTS);
      client.storeState('test-state');
      
      expect(() => {
        client.handleAuthorizationResponse(
          'http://localhost/callback?code=123&state=test-state'
        );
      }).not.toThrow();
    });
    
    it('rejects mismatched state', () => {
      const client = new OAuth2Client(config, SECURE_DEFAULTS);
      client.storeState('expected-state');
      
      expect(() => {
        client.handleAuthorizationResponse(
          'http://localhost/callback?code=123&state=wrong-state'
        );
      }).toThrow('State mismatch');
    });
  });
});
```

### 6.2 Integration Tests (Playwright)

**Flow Execution Tests**:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authorization Code Flow', () => {
  test('completes successfully with PKCE', async ({ page }) => {
    await page.goto('/');
    
    // Select flow
    await page.click('text=Authorization Code Flow');
    await page.click('text=Execute Flow');
    
    // Wait for completion
    await page.waitForSelector('text=Flow completed successfully');
    
    // Verify PKCE used
    await expect(page.locator('text=PKCE Enabled')).toBeVisible();
    
    // Verify tokens received
    await expect(page.locator('text=Access Token')).toBeVisible();
    await expect(page.locator('text=Refresh Token')).toBeVisible();
    
    // Check security score
    const score = await page.locator('.security-score').textContent();
    expect(parseInt(score!)).toBeGreaterThan(90);
  });
  
  test('shows vulnerability warning when PKCE disabled', async ({ page }) => {
    await page.goto('/');
    
    // Enable vulnerability mode
    await page.click('text=Vulnerability Mode');
    await page.check('text=DISABLE_PKCE');
    
    // Execute flow
    await page.click('text=Execute Flow');
    await page.waitForSelector('text=VULNERABILITY MODE ACTIVE');
    
    // Verify warning
    await expect(page.locator('text=PKCE disabled')).toBeVisible();
    await expect(page.locator('text=Critical')).toBeVisible();
  });
});
```

### 6.3 Visual Regression Tests (Percy)

```typescript
import percySnapshot from '@percy/playwright';

test('flow timeline renders correctly', async ({ page }) => {
  await page.goto('/flows/abc123');
  await page.waitForSelector('.flow-timeline');
  
  await percySnapshot(page, 'Flow Timeline - Authorization Code');
});

test('token inspector displays JWT', async ({ page }) => {
  await page.goto('/flows/abc123');
  await page.click('text=Inspect Access Token');
  await page.waitForSelector('.token-inspector');
  
  await percySnapshot(page, 'Token Inspector - JWT Decoded');
});
```

### 6.4 Accessibility Tests

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('flow timeline is accessible', async () => {
  const { container } = render(<FlowTimeline flow={mockFlow} />);
  const results = await axe(container);
  
  expect(results).toHaveNoViolations();
});

test('token inspector is accessible', async () => {
  const { container } = render(
    <TokenInspector token={mockToken} tokenType="access" />
  );
  const results = await axe(container);
  
  expect(results).toHaveNoViolations();
});
```

---

## 7. Deployment and CI/CD

### 7.1 Build Configuration

**Vite Configuration**:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-*'],
          'd3-vendor': ['d3'],
        },
      },
    },
  },
});
```

### 7.2 CI/CD Pipeline

**GitHub Actions Workflow**:

```yaml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run unit tests
        run: npm run test
      
      - name: Run integration tests
        run: npm run test:e2e
      
      - name: Check accessibility
        run: npm run test:a11y
  
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v3
        with:
          name: dist
      
      - name: Deploy to production
        run: |
          # Deploy commands here
```

---

## 8. Documentation Requirements

### 8.1 Code Documentation

**JSDoc for Components**:

```typescript
/**
 * Displays a decoded JWT token with validation status
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.token - JWT token string
 * @param {'access' | 'refresh' | 'id'} props.tokenType - Type of token
 * @param {Function} [props.onValidate] - Callback when validation completes
 * 
 * @example
 * ```tsx
 * <TokenInspector
 *   token="eyJhbGc..."
 *   tokenType="access"
 *   onValidate={(result) => console.log(result)}
 * />
 * ```
 */
export const TokenInspector: React.FC<TokenInspectorProps> = ({ ... }) => {
  // ...
};
```

### 8.2 README.md

**Structure**:
1. Project Overview
2. Features
3. Installation
4. Quick Start
5. Configuration
6. Development
7. Testing
8. Deployment
9. Contributing
10. License

### 8.3 Storybook

**Component Stories**:

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { TokenInspector } from './TokenInspector';

const meta: Meta<typeof TokenInspector> = {
  title: 'Components/TokenInspector',
  component: TokenInspector,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TokenInspector>;

export const AccessToken: Story = {
  args: {
    token: mockAccessToken,
    tokenType: 'access',
  },
};

export const ExpiredToken: Story = {
  args: {
    token: mockExpiredToken,
    tokenType: 'access',
  },
};

export const IDToken: Story = {
  args: {
    token: mockIDToken,
    tokenType: 'id',
  },
};
```

---

## 9. Security Considerations

### 9.1 Input Validation

**All User Inputs**:
- Sanitize URLs
- Validate JSON
- Escape HTML
- Validate token format

**Example**:

```typescript
const sanitizeURL = (url: string): string => {
  try {
    const parsed = new URL(url);
    // Only allow http(s)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol');
    }
    return parsed.toString();
  } catch {
    throw new Error('Invalid URL');
  }
};
```

### 9.2 No Actual Secrets

**Important**: This is a debugging/educational tool

- Never store real client secrets
- Never use production credentials
- Always use demo/test data
- Clear warnings about demo nature

### 9.3 Content Security Policy

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' http://localhost:8080 https://localhost:8080;
  frame-ancestors 'none';
">
```

---

## Document Metadata

| Property | Value |
|----------|-------|
| **Version** | 1.0.0 |
| **Part** | 6 of 6 (Implementation Guide) |
| **Related Docs** | All visualization documents |
| **Completeness** | Complete implementation guide |
| **Series Status** | ✓ COMPLETE |

---

## Series Summary

**Complete Visualization Requirements Documentation** (6 parts):

1. ✅ **Overview & Design System** - Philosophy, components, design tokens
2. ✅ **Flow Sequences** - Step-by-step flow visualizations  
3. ✅ **Security Features** - PKCE, state, JWT, redirect URI
4. ✅ **Debugging Features** - Introspection, errors, performance, scorecards
5. ✅ **UI/UX Requirements** - Educational features, export, responsive design
6. ✅ **Implementation Guide** - Technical stack, architecture, testing

**Ready for**: Frontend development with Claude.ai or Claude Code

**Total Documentation**: ~200KB of comprehensive specifications
