# AuthOptics Frontend - React Component Specifications

## Document Information

| Property | Value |
|----------|-------|
| **Component** | packages/frontend/src/components |
| **Purpose** | Complete React component specifications with TypeScript implementations |
| **Status** | ✅ MVP Critical |
| **Parent Doc** | [auth-optics-frontend-specification.md](auth-optics-frontend-specification.md) |
| **Related Docs** | [State Management](frontend-state-management.md), [Services](frontend-services.md), [Implementation Guide](frontend-implementation-guide.md) |

---

## Table of Contents

1. [Component Overview](#1-component-overview)
2. [FlowTimeline Component](#2-flowtimeline-component)
3. [TokenInspector Component](#3-tokeninspector-component)
4. [RequestResponseViewer Component](#4-requestresponseviewer-component)
5. [SecurityIndicators Component](#5-securityindicators-component)
6. [ConfigPanel Component](#6-configpanel-component)
7. [VulnerabilityToggle Component](#7-vulnerabilitytoggle-component)
8. [Shared UI Components](#8-shared-ui-components)

---

# 1. Component Overview

## 1.1 MVP Component List

This document covers **6 critical MVP components** plus shared UI primitives:

| Component | Lines of Code | Priority | Status |
|-----------|---------------|----------|--------|
| **FlowTimeline** | 200-250 | ✅ MVP Critical | Detailed spec below |
| **TokenInspector** | 250-300 | ✅ MVP Critical | Detailed spec below |
| **RequestResponseViewer** | 150-200 | ✅ MVP Critical | Detailed spec below |
| **SecurityIndicators** | 100-150 | ✅ MVP Critical | Detailed spec below |
| **ConfigPanel** | 200-250 | ✅ MVP Critical | Detailed spec below |
| **VulnerabilityToggle** | 100-120 | ✅ MVP Critical | Detailed spec below |
| **UI Primitives** | 50-80 each | ✅ MVP Required | Button, Badge, Card, Tabs, etc. |

## 1.2 Component Dependency Graph

```
App
├── Layout
│   ├── Header
│   └── Sidebar
│       ├── ConfigPanel ⭐
│       └── VulnerabilityToggle ⭐
├── MainContent
│   ├── FlowTimeline ⭐
│   ├── RequestResponseViewer ⭐
│   ├── TokenInspector ⭐
│   └── SecurityIndicators ⭐
└── Context Providers
    ├── OAuth2Context
    └── ConfigContext

⭐ = Detailed specification in this document
```

---

# 2. FlowTimeline Component

## 2.1 Purpose

Displays OAuth2 flow execution as a horizontal timeline showing step-by-step progress with visual status indicators and click-to-expand details.

## 2.2 Props Interface

```typescript
interface FlowTimelineProps {
  /** Current flow execution */
  flow: FlowExecution;
  
  /** Currently selected step number */
  selectedStep?: number;
  
  /** Callback when user selects a step */
  onStepSelect: (stepNumber: number) => void;
  
  /** Additional CSS classes */
  className?: string;
}
```

## 2.3 State Requirements

```typescript
// No local state needed - fully controlled component
// All state comes from props (flow, selectedStep)
```

## 2.4 Complete Implementation

**File: `src/components/FlowTimeline.tsx`**

```typescript
import React from 'react';
import { FlowExecution, FlowStep, StepStatus } from '@auth-optics/shared';
import { Check, Clock, X, Circle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const FlowTimeline: React.FC<FlowTimelineProps> = ({
  flow,
  selectedStep,
  onStepSelect,
  className = ''
}) => {
  /**
   * Get icon for step status
   */
  const getStepIcon = (status: StepStatus) => {
    const iconClass = 'w-5 h-5';
    
    switch (status) {
      case 'completed':
        return <Check className={`${iconClass} text-green-600`} />;
      case 'running':
        return <Clock className={`${iconClass} text-blue-600 animate-pulse`} />;
      case 'failed':
        return <X className={`${iconClass} text-red-600`} />;
      case 'pending':
        return <Circle className={`${iconClass} text-gray-400`} />;
      case 'skipped':
        return <AlertCircle className={`${iconClass} text-yellow-600`} />;
      default:
        return <Circle className={`${iconClass} text-gray-400`} />;
    }
  };

  /**
   * Get CSS classes for step based on status
   */
  const getStepClasses = (step: FlowStep, isSelected: boolean) => {
    const baseClasses = `
      flex flex-col items-center p-4 rounded-lg border-2
      transition-all duration-200 cursor-pointer hover:shadow-lg
      min-w-[140px] relative
    `;
    
    let statusClasses = '';
    switch (step.status) {
      case 'completed':
        statusClasses = 'border-green-500 bg-green-50 hover:bg-green-100';
        break;
      case 'running':
        statusClasses = 'border-blue-500 bg-blue-50 hover:bg-blue-100 ring-2 ring-blue-300';
        break;
      case 'failed':
        statusClasses = 'border-red-500 bg-red-50 hover:bg-red-100';
        break;
      case 'skipped':
        statusClasses = 'border-yellow-500 bg-yellow-50 hover:bg-yellow-100';
        break;
      default:
        statusClasses = 'border-gray-300 bg-gray-50 hover:bg-gray-100';
    }
    
    const selectedClass = isSelected ? 'ring-4 ring-blue-400 ring-offset-2' : '';
    
    return cn(baseClasses, statusClasses, selectedClass);
  };

  /**
   * Get connector line color based on previous step status
   */
  const getConnectorColor = (prevStep: FlowStep) => {
    switch (prevStep.status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  /**
   * Format duration for display
   */
  const formatDuration = (duration?: number): string => {
    if (!duration) return '';
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  return (
    <div 
      className={cn('flex items-center space-x-4 overflow-x-auto p-6', className)}
      role="navigation"
      aria-label="OAuth2 flow timeline"
    >
      {flow.steps.map((step, index) => {
        const isSelected = selectedStep === step.stepNumber;
        
        return (
          <React.Fragment key={step.stepNumber}>
            {/* Step Card */}
            <button
              onClick={() => onStepSelect(step.stepNumber)}
              className={getStepClasses(step, isSelected)}
              aria-label={`Step ${step.stepNumber}: ${step.name}`}
              aria-current={isSelected ? 'step' : undefined}
              role="tab"
            >
              {/* Step Icon */}
              <div className="mb-2" aria-hidden="true">
                {getStepIcon(step.status)}
              </div>
              
              {/* Step Number Badge */}
              <div className="
                text-xs font-bold px-2 py-0.5 rounded-full mb-1
                bg-gray-200 text-gray-700
              ">
                Step {step.stepNumber}
              </div>
              
              {/* Step Name */}
              <div className="text-sm font-semibold text-gray-900 text-center max-w-[120px]">
                {step.name}
              </div>
              
              {/* Duration (if available) */}
              {step.duration && (
                <div className="text-xs text-gray-600 mt-1">
                  {formatDuration(step.duration)}
                </div>
              )}
              
              {/* Status Badge (for failed/skipped) */}
              {(step.status === 'failed' || step.status === 'skipped') && (
                <div className={`
                  text-xs px-2 py-0.5 rounded mt-1
                  ${step.status === 'failed' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'}
                `}>
                  {step.status === 'failed' ? 'Failed' : 'Skipped'}
                </div>
              )}
            </button>

            {/* Connector Line */}
            {index < flow.steps.length - 1 && (
              <div 
                className={cn(
                  'h-1 w-12 transition-colors duration-300',
                  getConnectorColor(step)
                )}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
```

## 2.5 Usage Example

```typescript
import { FlowTimeline } from '@/components/FlowTimeline';
import { useFlowState } from '@/hooks/useFlowState';

const FlowViewer = () => {
  const { currentFlow } = useFlowState();
  const [selectedStep, setSelectedStep] = useState<number>(1);

  if (!currentFlow) {
    return <div>No active flow</div>;
  }

  return (
    <div className="space-y-4">
      <FlowTimeline
        flow={currentFlow}
        selectedStep={selectedStep}
        onStepSelect={setSelectedStep}
      />
      
      {/* Display selected step details below */}
      <StepDetails step={currentFlow.steps.find(s => s.stepNumber === selectedStep)} />
    </div>
  );
};
```

## 2.6 Accessibility Considerations

- **Keyboard Navigation**: All steps are focusable buttons
- **ARIA Labels**: Each step has descriptive `aria-label`
- **Current Step**: Uses `aria-current="step"` for selected step
- **Role**: Timeline uses `role="navigation"` and steps use `role="tab"`
- **Focus Visible**: 2px outline on keyboard focus

## 2.7 Testing Requirements

```typescript
describe('FlowTimeline', () => {
  it('renders all flow steps', () => {
    const flow = createMockFlow();
    render(<FlowTimeline flow={flow} onStepSelect={jest.fn()} />);
    
    expect(screen.getAllByRole('tab')).toHaveLength(flow.steps.length);
  });
  
  it('highlights selected step', () => {
    const flow = createMockFlow();
    render(<FlowTimeline flow={flow} selectedStep={2} onStepSelect={jest.fn()} />);
    
    const step2 = screen.getByLabelText(/Step 2:/);
    expect(step2).toHaveAttribute('aria-current', 'step');
  });
  
  it('calls onStepSelect when step clicked', () => {
    const onSelect = jest.fn();
    const flow = createMockFlow();
    render(<FlowTimeline flow={flow} onStepSelect={onSelect} />);
    
    fireEvent.click(screen.getByLabelText(/Step 3:/));
    expect(onSelect).toHaveBeenCalledWith(3);
  });
  
  it('shows duration when available', () => {
    const flow = createMockFlow({ steps: [{ ...step1, duration: 1234 }] });
    render(<FlowTimeline flow={flow} onStepSelect={jest.fn()} />);
    
    expect(screen.getByText('1.23s')).toBeInTheDocument();
  });
});
```

---

# 3. TokenInspector Component

## 3.1 Purpose

Decodes and displays JWT tokens with header, payload, and signature sections. Provides claim explanations, validation status, and copy functionality.

## 3.2 Props Interface

```typescript
interface TokenInspectorProps {
  /** JWT token string (or null if not yet available) */
  token: string | null;
  
  /** Type of token being displayed */
  tokenType: 'access' | 'id' | 'refresh';
  
  /** Callback when validation completes (optional) */
  onValidate?: (result: TokenValidationResult) => void;
  
  /** Additional CSS classes */
  className?: string;
}
```

## 3.3 State Requirements

```typescript
interface TokenInspectorState {
  /** Current view mode */
  view: 'decoded' | 'raw';
  
  /** Copy button state */
  copied: boolean;
  
  /** Validation result (if onValidate provided) */
  validationResult?: TokenValidationResult;
}
```

## 3.4 Complete Implementation

**File: `src/components/TokenInspector.tsx`**

```typescript
import React, { useMemo, useState, useEffect } from 'react';
import { decodeJWT, JWT, TokenValidationResult } from '@auth-optics/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Copy, Check, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export const TokenInspector: React.FC<TokenInspectorProps> = ({
  token,
  tokenType,
  onValidate,
  className = ''
}) => {
  const [view, setView] = useState<'decoded' | 'raw'>('decoded');
  const [copied, setCopied] = useState(false);
  const [validationResult, setValidationResult] = useState<TokenValidationResult>();

  // Decode JWT
  const jwt = useMemo(() => {
    if (!token) return null;
    
    try {
      return decodeJWT(token);
    } catch (error) {
      console.error('Failed to decode JWT:', error);
      return null;
    }
  }, [token]);

  // Check if token is expired
  const isExpired = useMemo(() => {
    if (!jwt?.payload.exp) return false;
    return jwt.payload.exp * 1000 < Date.now();
  }, [jwt]);

  // Calculate time until expiration
  const timeUntilExpiry = useMemo(() => {
    if (!jwt?.payload.exp) return null;
    const expiryMs = jwt.payload.exp * 1000;
    const nowMs = Date.now();
    const diffMs = expiryMs - nowMs;
    
    if (diffMs < 0) return 'Expired';
    if (diffMs < 60000) return `${Math.floor(diffMs / 1000)}s`;
    if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m`;
    return `${Math.floor(diffMs / 3600000)}h`;
  }, [jwt]);

  /**
   * Handle copy to clipboard
   */
  const handleCopy = async () => {
    if (!token) return;
    
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  /**
   * Trigger validation if callback provided
   */
  useEffect(() => {
    if (jwt && onValidate) {
      // In a real app, this would call the backend validation endpoint
      // For now, we'll do basic client-side validation
      const result: TokenValidationResult = {
        valid: !isExpired,
        errors: isExpired ? ['Token has expired'] : [],
        claims: jwt.payload
      };
      
      setValidationResult(result);
      onValidate(result);
    }
  }, [jwt, isExpired, onValidate]);

  /**
   * Render loading state
   */
  if (token === null) {
    return (
      <div className={cn('p-8 text-center border rounded-lg bg-gray-50', className)}>
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <div className="text-gray-600">
          Waiting for {tokenType} token...
        </div>
      </div>
    );
  }

  /**
   * Render invalid JWT error
   */
  if (!jwt) {
    return (
      <div className={cn('p-6 border-2 border-red-300 rounded-lg bg-red-50', className)}>
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-red-900 font-semibold text-lg mb-1">
              Invalid JWT Token
            </div>
            <div className="text-red-700 text-sm">
              The token could not be decoded. It may be malformed or not a valid JWT.
            </div>
            <div className="mt-3 p-3 bg-red-100 rounded font-mono text-xs break-all">
              {token.substring(0, 100)}...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('border rounded-lg overflow-hidden bg-white', className)}>
      {/* Header */}
      <div className="bg-gray-50 border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="font-semibold text-gray-900 text-lg">
              {tokenType.charAt(0).toUpperCase() + tokenType.slice(1)} Token
            </h3>
            <Badge variant="outline" className="font-mono">
              {jwt.header.alg}
            </Badge>
            <Badge variant="outline" className="font-mono">
              {jwt.header.typ}
            </Badge>
            
            {/* Expiration status */}
            {isExpired ? (
              <Badge variant="destructive" className="flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Expired</span>
              </Badge>
            ) : timeUntilExpiry && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Expires in {timeUntilExpiry}</span>
              </Badge>
            )}
          </div>
          
          {/* Copy button */}
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Token</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={view} onValueChange={(v) => setView(v as any)}>
        <TabsList className="w-full justify-start border-b rounded-none bg-gray-50">
          <TabsTrigger value="decoded">Decoded</TabsTrigger>
          <TabsTrigger value="raw">Raw JWT</TabsTrigger>
        </TabsList>

        {/* Decoded View */}
        <TabsContent value="decoded" className="p-6 space-y-6">
          {/* Header Section */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
              Header
              <Badge variant="outline" className="ml-2">JOSE</Badge>
            </h4>
            <div className="bg-gray-50 p-4 rounded-lg border space-y-2">
              {Object.entries(jwt.header).map(([key, value]) => (
                <div key={key} className="flex items-start">
                  <span className="font-mono text-blue-600 font-semibold w-32 flex-shrink-0">
                    {key}:
                  </span>
                  <span className="font-mono text-gray-900 break-all">
                    {JSON.stringify(value)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-600 pl-4 border-l-2 border-gray-300">
              The header identifies which algorithm was used to generate the signature.
            </div>
          </div>

          {/* Payload Section */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
              Payload
              <Badge variant="outline" className="ml-2">Claims</Badge>
            </h4>
            <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
              {Object.entries(jwt.payload).map(([key, value]) => {
                const explanation = getClaimExplanation(key, value);
                
                return (
                  <div key={key} className="border-b border-gray-200 last:border-0 pb-3 last:pb-0">
                    <div className="flex items-start">
                      <span className="font-mono text-blue-600 font-semibold w-40 flex-shrink-0">
                        {key}:
                      </span>
                      <div className="flex-1">
                        <div className="font-mono text-gray-900 break-all">
                          {JSON.stringify(value)}
                        </div>
                        {explanation && (
                          <div className="text-xs text-gray-600 mt-1 italic">
                            {explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 text-xs text-gray-600 pl-4 border-l-2 border-gray-300">
              The payload contains the claims - statements about the user and additional data.
            </div>
          </div>

          {/* Signature Section */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
              Signature
              <Badge variant="outline" className="ml-2">Verification Required</Badge>
            </h4>
            <div className="bg-gray-900 p-4 rounded-lg">
              <code className="text-xs text-green-400 break-all block">
                {jwt.signature}
              </code>
            </div>
            <div className="mt-2 text-xs text-gray-600 pl-4 border-l-2 border-gray-300">
              The signature must be verified using the public key from the issuer's JWKS endpoint.
              This ensures the token has not been tampered with.
            </div>
          </div>
          
          {/* Validation Result */}
          {validationResult && (
            <div className={cn(
              'p-4 rounded-lg border-2',
              validationResult.valid
                ? 'bg-green-50 border-green-300'
                : 'bg-red-50 border-red-300'
            )}>
              <div className="flex items-center space-x-2">
                {validationResult.valid ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                )}
                <span className={cn(
                  'font-semibold',
                  validationResult.valid ? 'text-green-900' : 'text-red-900'
                )}>
                  {validationResult.valid ? 'Token Valid' : 'Token Invalid'}
                </span>
              </div>
              {validationResult.errors.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm text-red-800">
                  {validationResult.errors.map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </TabsContent>

        {/* Raw JWT View */}
        <TabsContent value="raw" className="p-6">
          <div className="bg-gray-900 p-6 rounded-lg">
            <div className="mb-2 text-xs text-gray-400 font-semibold">
              COMPLETE JWT TOKEN
            </div>
            <code className="text-sm text-green-400 break-all block leading-relaxed">
              {token}
            </code>
          </div>
          <div className="mt-4 text-sm text-gray-600 space-y-2">
            <div className="flex items-start space-x-2">
              <Badge variant="outline" className="mt-0.5">1</Badge>
              <div>
                <span className="font-semibold">Header:</span> Base64URL-encoded JSON
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Badge variant="outline" className="mt-0.5">2</Badge>
              <div>
                <span className="font-semibold">Payload:</span> Base64URL-encoded JSON
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Badge variant="outline" className="mt-0.5">3</Badge>
              <div>
                <span className="font-semibold">Signature:</span> Base64URL-encoded signature
              </div>
            </div>
            <div className="text-xs italic text-gray-500 mt-2">
              Format: [Header].[Payload].[Signature]
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

/**
 * Get human-readable explanation for JWT claims
 */
function getClaimExplanation(key: string, value: any): string | null {
  const explanations: Record<string, string | ((v: any) => string)> = {
    exp: (v) => `Expiration time: ${new Date(v * 1000).toLocaleString()}`,
    iat: (v) => `Issued at: ${new Date(v * 1000).toLocaleString()}`,
    nbf: (v) => `Not before: ${new Date(v * 1000).toLocaleString()}`,
    iss: 'Issuer: The party that created and signed this token',
    aud: 'Audience: The intended recipient(s) of this token',
    sub: 'Subject: The principal (user) this token represents',
    jti: 'JWT ID: Unique identifier for this specific token',
    azp: 'Authorized party: Client ID that requested this token',
    scope: 'Scopes: Space-separated list of permissions granted',
    scp: 'Scopes: Array of permissions granted by this token',
    email: 'Email address of the authenticated user',
    email_verified: 'Whether the email address has been verified',
    name: 'Full name of the authenticated user',
    preferred_username: 'Preferred username for display',
    given_name: 'First/given name of the user',
    family_name: 'Last/family name of the user'
  };
  
  const explanation = explanations[key];
  if (!explanation) return null;
  
  return typeof explanation === 'function' ? explanation(value) : explanation;
}
```

## 3.5 Usage Example

```typescript
import { TokenInspector } from '@/components/TokenInspector';
import { useFlowState } from '@/hooks/useFlowState';

const TokensView = () => {
  const { currentFlow } = useFlowState();
  
  const handleValidation = (result: TokenValidationResult) => {
    console.log('Token validation result:', result);
  };

  return (
    <div className="space-y-6">
      {currentFlow?.tokens?.accessToken && (
        <TokenInspector
          token={currentFlow.tokens.accessToken}
          tokenType="access"
          onValidate={handleValidation}
        />
      )}
      
      {currentFlow?.tokens?.idToken && (
        <TokenInspector
          token={currentFlow.tokens.idToken}
          tokenType="id"
        />
      )}
      
      {currentFlow?.tokens?.refreshToken && (
        <TokenInspector
          token={currentFlow.tokens.refreshToken}
          tokenType="refresh"
        />
      )}
    </div>
  );
};
```

## 3.6 Testing Requirements

```typescript
describe('TokenInspector', () => {
  const mockToken = createMockJWT({
    header: { alg: 'RS256', typ: 'JWT' },
    payload: { sub: 'user-123', exp: Date.now() / 1000 + 3600 }
  });

  it('decodes and displays JWT correctly', () => {
    render(<TokenInspector token={mockToken} tokenType="access" />);
    
    expect(screen.getByText('RS256')).toBeInTheDocument();
    expect(screen.getByText('JWT')).toBeInTheDocument();
    expect(screen.getByText(/user-123/)).toBeInTheDocument();
  });
  
  it('shows expiration warning for expired tokens', () => {
    const expiredToken = createMockJWT({
      payload: { exp: Date.now() / 1000 - 3600 } // 1 hour ago
    });
    
    render(<TokenInspector token={expiredToken} tokenType="access" />);
    expect(screen.getByText('Expired')).toBeInTheDocument();
  });
  
  it('copies token to clipboard', async () => {
    const clipboardSpy = jest.spyOn(navigator.clipboard, 'writeText');
    render(<TokenInspector token={mockToken} tokenType="access" />);
    
    fireEvent.click(screen.getByText('Copy Token'));
    expect(clipboardSpy).toHaveBeenCalledWith(mockToken);
    expect(await screen.findByText('Copied!')).toBeInTheDocument();
  });
  
  it('switches between decoded and raw views', () => {
    render(<TokenInspector token={mockToken} tokenType="access" />);
    
    fireEvent.click(screen.getByText('Raw JWT'));
    expect(screen.getByText(mockToken)).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Decoded'));
    expect(screen.getByText('Header')).toBeInTheDocument();
  });
});
```

---

# 4. RequestResponseViewer Component

## 4.1 Purpose

Displays HTTP request and response details in a tabbed interface with syntax highlighting for JSON payloads.

## 4.2 Props Interface

```typescript
interface RequestResponseViewerProps {
  /** HTTP request details (null if not available) */
  request: HttpRequest | null;
  
  /** HTTP response details (null if not available) */
  response: HttpResponse | null;
  
  /** Loading state */
  loading?: boolean;
  
  /** Additional CSS classes */
  className?: string;
}
```

## 4.3 Complete Implementation

**File: `src/components/RequestResponseViewer.tsx`**

```typescript
import React, { useState } from 'react';
import { HttpRequest, HttpResponse } from '@auth-optics/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const RequestResponseViewer: React.FC<RequestResponseViewerProps> = ({
  request,
  response,
  loading = false,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'request' | 'response'>('request');

  // Render loading state
  if (loading) {
    return (
      <Card className={cn('p-12 text-center', className)}>
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
        <div className="text-gray-600">Loading request/response data...</div>
      </Card>
    );
  }

  // Render empty state
  if (!request && !response) {
    return (
      <Card className={cn('p-12 text-center', className)}>
        <div className="text-gray-500 text-lg mb-2">No Data Available</div>
        <div className="text-gray-400 text-sm">
          Select a flow step to view HTTP request and response details
        </div>
      </Card>
    );
  }

  return (
    <div className={cn('border rounded-lg overflow-hidden bg-white', className)}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="w-full justify-start bg-gray-50 border-b rounded-none">
          <TabsTrigger value="request" className="flex-1">
            Request
            {request && <Badge variant="outline" className="ml-2">{request.method}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="response" className="flex-1">
            Response
            {response && (
              <Badge 
                variant={response.statusCode < 400 ? 'default' : 'destructive'}
                className="ml-2"
              >
                {response.statusCode}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Request Tab */}
        <TabsContent value="request" className="p-6 space-y-4">
          {request ? (
            <>
              {/* Method and URL */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Request Line
                </h4>
                <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded border">
                  <Badge variant="outline" className="font-mono font-bold">
                    {request.method}
                  </Badge>
                  <code className="text-sm text-blue-600 break-all flex-1">
                    {request.url}
                  </code>
                </div>
              </div>

              {/* Headers */}
              {request.headers && Object.keys(request.headers).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Headers ({Object.keys(request.headers).length})
                  </h4>
                  <div className="bg-gray-50 p-4 rounded border space-y-1.5 max-h-64 overflow-y-auto">
                    {Object.entries(request.headers).map(([key, value]) => (
                      <div key={key} className="flex items-start text-sm">
                        <span className="font-mono text-blue-600 font-semibold w-48 flex-shrink-0">
                          {key}:
                        </span>
                        <span className="font-mono text-gray-900 break-all flex-1">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Query Parameters */}
              {request.queryParams && Object.keys(request.queryParams).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Query Parameters ({Object.keys(request.queryParams).length})
                  </h4>
                  <div className="bg-gray-50 p-4 rounded border space-y-1.5">
                    {Object.entries(request.queryParams).map(([key, value]) => (
                      <div key={key} className="flex items-start text-sm">
                        <span className="font-mono text-blue-600 font-semibold w-48 flex-shrink-0">
                          {key}:
                        </span>
                        <span className="font-mono text-gray-900 break-all flex-1">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Body */}
              {request.body && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Body
                  </h4>
                  <pre className="bg-gray-900 p-4 rounded overflow-x-auto max-h-96">
                    <code className="text-sm text-green-400">
                      {typeof request.body === 'string'
                        ? request.body
                        : JSON.stringify(request.body, null, 2)}
                    </code>
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-gray-500">
              No request data available for this step
            </div>
          )}
        </TabsContent>

        {/* Response Tab */}
        <TabsContent value="response" className="p-6 space-y-4">
          {response ? (
            <>
              {/* Status Line */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Status
                </h4>
                <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded border">
                  <Badge 
                    variant={response.statusCode < 400 ? 'default' : 'destructive'}
                    className="font-mono text-base px-3 py-1"
                  >
                    {response.statusCode}
                  </Badge>
                  <span className="text-gray-900 font-medium">
                    {response.statusText}
                  </span>
                </div>
              </div>

              {/* Headers */}
              {response.headers && Object.keys(response.headers).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Headers ({Object.keys(response.headers).length})
                  </h4>
                  <div className="bg-gray-50 p-4 rounded border space-y-1.5 max-h-64 overflow-y-auto">
                    {Object.entries(response.headers).map(([key, value]) => (
                      <div key={key} className="flex items-start text-sm">
                        <span className="font-mono text-blue-600 font-semibold w-48 flex-shrink-0">
                          {key}:
                        </span>
                        <span className="font-mono text-gray-900 break-all flex-1">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Body */}
              {response.body && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Body
                  </h4>
                  <pre className="bg-gray-900 p-4 rounded overflow-x-auto max-h-96">
                    <code className="text-sm text-green-400">
                      {typeof response.body === 'string'
                        ? response.body
                        : JSON.stringify(response.body, null, 2)}
                    </code>
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-gray-500">
              No response data available for this step
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

## 4.4 Usage Example & Testing

```typescript
// Usage
const StepDetailsView = () => {
  const { currentFlow, selectedStep } = useFlowState();
  const step = currentFlow?.steps.find(s => s.stepNumber === selectedStep);

  return (
    <RequestResponseViewer
      request={step?.request || null}
      response={step?.response || null}
      loading={step?.status === 'running'}
    />
  );
};

// Testing
describe('RequestResponseViewer', () => {
  it('displays request method and URL', () => {
    const request = { method: 'POST', url: 'https://auth.example.com/token', headers: {} };
    render(<RequestResponseViewer request={request} response={null} />);
    
    expect(screen.getByText('POST')).toBeInTheDocument();
    expect(screen.getByText(/https:\/\/auth.example.com\/token/)).toBeInTheDocument();
  });
  
  it('displays response status with correct badge variant', () => {
    const response = { statusCode: 200, statusText: 'OK', headers: {}, body: null };
    render(<RequestResponseViewer request={null} response={response} />);
    
    const badge = screen.getByText('200');
    expect(badge).toHaveClass('bg-'); // default variant for success
  });
});
```

---

# 5. SecurityIndicators Component

## 5.1 Purpose

Displays visual badges showing the security status of the current flow (PKCE, state parameter, HTTPS usage, etc.).

## 5.2 Props Interface

```typescript
interface SecurityIndicatorsProps {
  /** Security assessment for current flow */
  assessment: SecurityAssessment;
  
  /** Show detailed explanations */
  showDetails?: boolean;
  
  /** Additional CSS classes */
  className?: string;
}
```

## 5.3 Complete Implementation

**File: `src/components/SecurityIndicators.tsx`**

```typescript
import React from 'react';
import { SecurityAssessment, SecurityIndicator, SecurityIndicatorStatus } from '@auth-optics/shared';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Shield, ShieldAlert, ShieldCheck, ShieldX, Lock, Unlock, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SecurityIndicators: React.FC<SecurityIndicatorsProps> = ({
  assessment,
  showDetails = false,
  className = ''
}) => {
  /**
   * Get icon for security indicator
   */
  const getIndicatorIcon = (indicator: SecurityIndicator) => {
    const iconClass = 'w-4 h-4';
    
    switch (indicator.status) {
      case SecurityIndicatorStatus.ENABLED:
        return <ShieldCheck className={`${iconClass} text-green-600`} />;
      case SecurityIndicatorStatus.DISABLED:
        return <ShieldAlert className={`${iconClass} text-red-600`} />;
      case SecurityIndicatorStatus.PARTIAL:
        return <Shield className={`${iconClass} text-yellow-600`} />;
      case SecurityIndicatorStatus.NOT_APPLICABLE:
        return <ShieldX className={`${iconClass} text-gray-400`} />;
      default:
        return <Shield className={`${iconClass} text-gray-400`} />;
    }
  };

  /**
   * Get badge variant for security indicator
   */
  const getBadgeVariant = (indicator: SecurityIndicator): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (indicator.status) {
      case SecurityIndicatorStatus.ENABLED:
        return 'default'; // green
      case SecurityIndicatorStatus.DISABLED:
        return 'destructive'; // red
      case SecurityIndicatorStatus.PARTIAL:
        return 'secondary'; // yellow
      default:
        return 'outline'; // gray
    }
  };

  /**
   * Get overall security score color
   */
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  /**
   * Get score rating text
   */
  const getScoreRating = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Overall Score */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1">
              Security Score
            </h3>
            <div className="flex items-baseline space-x-2">
              <span className={cn('text-4xl font-bold', getScoreColor(assessment.score))}>
                {assessment.score}
              </span>
              <span className="text-gray-500 text-lg">/ 100</span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {getScoreRating(assessment.score)} Security Posture
            </div>
          </div>
          
          {/* Visual score indicator */}
          <div className="relative w-24 h-24">
            <svg className="transform -rotate-90 w-24 h-24">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-200"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - assessment.score / 100)}`}
                className={cn(
                  'transition-all duration-1000',
                  getScoreColor(assessment.score)
                )}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Security Indicators */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Security Features
        </h3>
        
        <div className="space-y-2">
          {assessment.indicators.map((indicator, index) => (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 transition-colors">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      {getIndicatorIcon(indicator)}
                    </div>
                    
                    {/* Label */}
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">
                        {indicator.label}
                      </span>
                    </div>
                    
                    {/* Badge */}
                    <Badge variant={getBadgeVariant(indicator)} className="text-xs">
                      {indicator.status === SecurityIndicatorStatus.ENABLED && 'Enabled'}
                      {indicator.status === SecurityIndicatorStatus.DISABLED && 'Disabled'}
                      {indicator.status === SecurityIndicatorStatus.PARTIAL && 'Partial'}
                      {indicator.status === SecurityIndicatorStatus.NOT_APPLICABLE && 'N/A'}
                    </Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="text-sm">{indicator.tooltip}</p>
                  {indicator.relatedToggle && (
                    <p className="text-xs text-gray-400 mt-1">
                      Related toggle: {indicator.relatedToggle}
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>

      {/* Vulnerabilities & Risks */}
      {assessment.vulnerabilities && assessment.vulnerabilities.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-2 mb-3">
            <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-900 uppercase tracking-wide">
                Security Vulnerabilities Detected
              </h3>
              <p className="text-xs text-red-700 mt-1">
                {assessment.vulnerabilities.length} vulnerability{assessment.vulnerabilities.length > 1 ? 'ies' : ''} found
              </p>
            </div>
          </div>
          
          <ul className="space-y-2">
            {assessment.vulnerabilities.map((vuln, index) => (
              <li key={index} className="flex items-start space-x-2 text-sm">
                <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-red-900 font-medium">{vuln.name}:</span>
                  <span className="text-red-800 ml-1">{vuln.description}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detailed Breakdown (optional) */}
      {showDetails && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Score Breakdown
          </h3>
          <div className="space-y-2 text-sm">
            {assessment.details?.map((detail, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-700">{detail.category}</span>
                <div className="flex items-center space-x-2">
                  <span className={cn('font-semibold', getScoreColor(detail.score))}>
                    {detail.score}/100
                  </span>
                  {detail.score >= 80 && <CheckCircle className="w-4 h-4 text-green-600" />}
                  {detail.score < 80 && <XCircle className="w-4 h-4 text-red-600" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

## 5.4 Usage Example

```typescript
const FlowView = () => {
  const { currentFlow } = useFlowState();

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2">
        {/* Main flow visualization */}
        <FlowTimeline flow={currentFlow} />
      </div>
      <div>
        {/* Security indicators sidebar */}
        <SecurityIndicators
          assessment={currentFlow.securityAssessment}
          showDetails={true}
        />
      </div>
    </div>
  );
};
```

---

# 6. ConfigPanel Component

## 6.1 Purpose

OAuth2 client configuration panel for setting client ID, redirect URI, scopes, and other parameters before starting a flow.

## 6.2 Props Interface

```typescript
interface ConfigPanelProps {
  /** Current client configuration */
  config: ClientConfig;
  
  /** Callback when configuration changes */
  onChange: (config: ClientConfig) => void;
  
  /** Callback to start flow */
  onStartFlow: () => void;
  
  /** Disable controls during active flow */
  disabled?: boolean;
  
  /** Additional CSS classes */
  className?: string;
}
```

## 6.3 Complete Implementation

**File: `src/components/ConfigPanel.tsx`**

```typescript
import React, { useState } from 'react';
import { ClientConfig, FlowType } from '@auth-optics/shared';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Card } from './ui/card';
import { Play, RotateCcw, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// Available scopes for OAuth2/OIDC
const AVAILABLE_SCOPES = [
  { value: 'openid', label: 'openid', description: 'OIDC - Required for ID token' },
  { value: 'profile', label: 'profile', description: 'Access to user profile' },
  { value: 'email', label: 'email', description: 'Access to email address' },
  { value: 'address', label: 'address', description: 'Access to postal address' },
  { value: 'phone', label: 'phone', description: 'Access to phone number' },
  { value: 'offline_access', label: 'offline_access', description: 'Request refresh token' },
];

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  onChange,
  onStartFlow,
  disabled = false,
  className = ''
}) => {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  /**
   * Handle input field changes
   */
  const handleInputChange = (field: keyof ClientConfig, value: string) => {
    onChange({ ...config, [field]: value });
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: '' });
    }
  };

  /**
   * Handle scope selection
   */
  const handleScopeToggle = (scope: string) => {
    const currentScopes = config.scope.split(' ').filter(Boolean);
    let newScopes: string[];
    
    if (currentScopes.includes(scope)) {
      newScopes = currentScopes.filter(s => s !== scope);
    } else {
      newScopes = [...currentScopes, scope];
    }
    
    onChange({ ...config, scope: newScopes.join(' ') });
  };

  /**
   * Validate configuration
   */
  const validateConfig = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!config.clientId.trim()) {
      errors.clientId = 'Client ID is required';
    }
    
    if (!config.redirectUri.trim()) {
      errors.redirectUri = 'Redirect URI is required';
    } else {
      try {
        new URL(config.redirectUri);
      } catch {
        errors.redirectUri = 'Must be a valid URL';
      }
    }
    
    if (!config.scope.trim()) {
      errors.scope = 'At least one scope is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle start flow
   */
  const handleStartFlow = () => {
    if (validateConfig()) {
      onStartFlow();
    }
  };

  /**
   * Reset to defaults
   */
  const handleReset = () => {
    const defaultConfig: ClientConfig = {
      clientId: 'spa-client',
      redirectUri: 'http://localhost:3000/callback',
      scope: 'openid profile email',
      responseType: 'code',
      authorizationEndpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/auth',
      tokenEndpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/token',
      userinfoEndpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/userinfo',
    };
    onChange(defaultConfig);
    setValidationErrors({});
  };

  const selectedScopes = config.scope.split(' ').filter(Boolean);

  return (
    <Card className={cn('p-6 space-y-6', className)}>
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          OAuth2 Client Configuration
        </h2>
        <p className="text-sm text-gray-600">
          Configure your OAuth2 client settings before starting a flow
        </p>
      </div>

      {/* Flow Type Selector */}
      <div className="space-y-2">
        <Label htmlFor="flow-type" className="text-sm font-medium">
          Flow Type
        </Label>
        <Select 
          value={config.flowType || FlowType.AUTHORIZATION_CODE}
          onValueChange={(value) => onChange({ ...config, flowType: value as FlowType })}
          disabled={disabled}
        >
          <SelectTrigger id="flow-type" className="w-full">
            <SelectValue placeholder="Select flow type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FlowType.AUTHORIZATION_CODE}>
              Authorization Code (with PKCE)
            </SelectItem>
            <SelectItem value={FlowType.CLIENT_CREDENTIALS} disabled>
              Client Credentials (Phase 2)
            </SelectItem>
            <SelectItem value={FlowType.DEVICE_AUTHORIZATION} disabled>
              Device Authorization (Phase 2)
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">
          MVP supports Authorization Code Flow with PKCE
        </p>
      </div>

      {/* Client ID */}
      <div className="space-y-2">
        <Label htmlFor="client-id" className="text-sm font-medium">
          Client ID <span className="text-red-500">*</span>
        </Label>
        <Input
          id="client-id"
          value={config.clientId}
          onChange={(e) => handleInputChange('clientId', e.target.value)}
          disabled={disabled}
          className={validationErrors.clientId ? 'border-red-500' : ''}
          placeholder="spa-client"
        />
        {validationErrors.clientId && (
          <p className="text-xs text-red-600">{validationErrors.clientId}</p>
        )}
        <p className="text-xs text-gray-500">
          Your OAuth2 client identifier (public client)
        </p>
      </div>

      {/* Redirect URI */}
      <div className="space-y-2">
        <Label htmlFor="redirect-uri" className="text-sm font-medium">
          Redirect URI <span className="text-red-500">*</span>
        </Label>
        <Input
          id="redirect-uri"
          value={config.redirectUri}
          onChange={(e) => handleInputChange('redirectUri', e.target.value)}
          disabled={disabled}
          className={validationErrors.redirectUri ? 'border-red-500' : ''}
          placeholder="http://localhost:3000/callback"
        />
        {validationErrors.redirectUri && (
          <p className="text-xs text-red-600">{validationErrors.redirectUri}</p>
        )}
        <p className="text-xs text-gray-500">
          Where the authorization server will redirect after authentication
        </p>
      </div>

      {/* Scopes */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Scopes <span className="text-red-500">*</span>
        </Label>
        <div className="space-y-2 bg-gray-50 p-3 rounded-lg border">
          {AVAILABLE_SCOPES.map((scope) => {
            const isSelected = selectedScopes.includes(scope.value);
            const isOpenId = scope.value === 'openid';
            
            return (
              <div key={scope.value} className="flex items-start space-x-3">
                <Checkbox
                  id={`scope-${scope.value}`}
                  checked={isSelected}
                  onCheckedChange={() => handleScopeToggle(scope.value)}
                  disabled={disabled || isOpenId}
                />
                <div className="flex-1">
                  <label
                    htmlFor={`scope-${scope.value}`}
                    className="text-sm font-medium text-gray-900 cursor-pointer"
                  >
                    {scope.label}
                    {isOpenId && <span className="text-xs text-gray-500 ml-1">(required)</span>}
                  </label>
                  <p className="text-xs text-gray-600">{scope.description}</p>
                </div>
              </div>
            );
          })}
        </div>
        {validationErrors.scope && (
          <p className="text-xs text-red-600">{validationErrors.scope}</p>
        )}
        <p className="text-xs text-gray-500">
          Selected: {config.scope || 'none'}
        </p>
      </div>

      {/* Endpoints (read-only, informational) */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center space-x-1">
          <span>Authorization Server</span>
          <Info className="w-4 h-4 text-gray-400" />
        </Label>
        <div className="bg-gray-50 p-3 rounded border space-y-1.5 text-xs">
          <div>
            <span className="font-semibold text-gray-700">Auth:</span>
            <code className="text-blue-600 ml-1">{config.authorizationEndpoint}</code>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Token:</span>
            <code className="text-blue-600 ml-1">{config.tokenEndpoint}</code>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-4 border-t">
        <Button
          onClick={handleStartFlow}
          disabled={disabled}
          className="flex-1 flex items-center justify-center space-x-2"
          size="lg"
        >
          <Play className="w-5 h-5" />
          <span>Start OAuth2 Flow</span>
        </Button>
        
        <Button
          onClick={handleReset}
          disabled={disabled}
          variant="outline"
          size="lg"
          className="flex items-center space-x-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset</span>
        </Button>
      </div>
    </Card>
  );
};
```

## 6.4 Usage Example

```typescript
const FlowSetup = () => {
  const { config, updateConfig, startFlow, flowActive } = useOAuth2Context();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <ConfigPanel
        config={config}
        onChange={updateConfig}
        onStartFlow={startFlow}
        disabled={flowActive}
      />
    </div>
  );
};
```

---

# 7. VulnerabilityToggle Component

## 7.1 Purpose

Educational toggle panel for enabling/disabling security features to demonstrate vulnerabilities.

## 7.2 Props Interface

```typescript
interface VulnerabilityToggleProps {
  /** Current vulnerability configuration */
  config: VulnerabilityConfig;
  
  /** Callback when configuration changes */
  onChange: (config: VulnerabilityConfig) => void;
  
  /** Available toggles for current flow */
  availableToggles: VulnerabilityToggleMetadata[];
  
  /** Disable controls during active flow */
  disabled?: boolean;
  
  /** Additional CSS classes */
  className?: string;
}
```

## 7.3 Complete Implementation

**File: `src/components/VulnerabilityToggle.tsx`**

```typescript
import React from 'react';
import { VulnerabilityConfig, VulnerabilityToggleMetadata } from '@auth-optics/shared';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { AlertTriangle, BookOpen, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export const VulnerabilityToggle: React.FC<VulnerabilityToggleProps> = ({
  config,
  onChange,
  availableToggles,
  disabled = false,
  className = ''
}) => {
  /**
   * Handle toggle change
   */
  const handleToggleChange = (toggleKey: string, enabled: boolean) => {
    onChange({
      ...config,
      toggles: {
        ...config.toggles,
        [toggleKey]: enabled
      }
    });
  };

  /**
   * Get severity badge
   */
  const getSeverityBadge = (severity: 'high' | 'medium' | 'low') => {
    const variants = {
      high: 'destructive',
      medium: 'secondary',
      low: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[severity]} className="text-xs">
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const enabledCount = Object.values(config.toggles).filter(Boolean).length;

  return (
    <Card className={cn('p-6', className)}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900">
            Vulnerability Mode
          </h2>
          {enabledCount > 0 && (
            <Badge variant="destructive" className="flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3" />
              <span>{enabledCount} active</span>
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-600">
          Enable vulnerabilities for educational purposes
        </p>
      </div>

      {/* Warning Banner */}
      {enabledCount > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-red-900 font-semibold text-sm">
                Security Vulnerabilities Enabled
              </div>
              <div className="text-red-800 text-xs mt-1">
                These settings demonstrate security weaknesses. Never use in production!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toggles */}
      <Accordion type="single" collapsible className="space-y-2">
        {availableToggles.map((toggle) => {
          const isEnabled = config.toggles[toggle.key] || false;
          
          return (
            <AccordionItem 
              key={toggle.key} 
              value={toggle.key}
              className="border rounded-lg"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleToggleChange(toggle.key, checked)}
                      disabled={disabled}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="text-left">
                      <div className="font-medium text-gray-900 text-sm">
                        {toggle.name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {toggle.shortDescription}
                      </div>
                    </div>
                  </div>
                  {getSeverityBadge(toggle.severity)}
                </div>
              </AccordionTrigger>
              
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3 pt-2">
                  {/* Full Description */}
                  <div className="text-sm text-gray-700">
                    {toggle.description}
                  </div>

                  {/* Impact */}
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <div className="text-xs font-semibold text-red-900 uppercase tracking-wide mb-1">
                      Security Impact
                    </div>
                    <div className="text-sm text-red-800">
                      {toggle.impact}
                    </div>
                  </div>

                  {/* RFC Reference */}
                  {toggle.rfcReference && (
                    <div className="flex items-start space-x-2 text-xs text-gray-600">
                      <BookOpen className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">RFC Reference:</span>{' '}
                        <a 
                          href={toggle.rfcReference.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 inline-flex items-center space-x-1"
                        >
                          <span>{toggle.rfcReference.section}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Educational Note */}
      <div className="mt-6 pt-6 border-t text-xs text-gray-600 space-y-2">
        <p className="flex items-start space-x-2">
          <BookOpen className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            These toggles are for educational purposes only. They demonstrate common OAuth2/OIDC 
            vulnerabilities and their mitigations as specified in the OAuth 2.0 Security Best 
            Current Practice.
          </span>
        </p>
        <p className="italic">
          Enabling vulnerabilities helps you understand why certain security measures are 
          critical in production deployments.
        </p>
      </div>
    </Card>
  );
};
```

## 7.4 Usage Example

```typescript
const VulnerabilityControls = () => {
  const { vulnerabilityConfig, updateVulnerabilityConfig, flowActive } = useOAuth2Context();

  // MVP only has DISABLE_PKCE toggle
  const mvpToggles: VulnerabilityToggleMetadata[] = [
    {
      key: 'DISABLE_PKCE',
      name: 'Disable PKCE',
      shortDescription: 'Remove PKCE protection from authorization code flow',
      description: 'Proof Key for Code Exchange (PKCE) protects authorization codes from interception attacks. Disabling it makes the flow vulnerable to authorization code interception by malicious applications.',
      impact: 'Authorization codes can be stolen and exchanged for tokens by attackers',
      severity: 'high',
      rfcReference: {
        rfc: 'RFC 7636',
        section: 'Section 1 (Introduction)',
        url: 'https://tools.ietf.org/html/rfc7636#section-1'
      }
    }
  ];

  return (
    <VulnerabilityToggle
      config={vulnerabilityConfig}
      onChange={updateVulnerabilityConfig}
      availableToggles={mvpToggles}
      disabled={flowActive}
    />
  );
};
```

---

# 8. Shared UI Components

## 8.1 Overview

Shared UI components are wrappers around Radix UI primitives with consistent styling using Tailwind CSS.

## 8.2 Component List

- Button
- Badge
- Card
- Input
- Label
- Select
- Checkbox
- Switch
- Tabs
- Tooltip
- Accordion

## 8.3 Example Implementation (Button)

**File: `src/components/ui/button.tsx`**

```typescript
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600',
        destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
        outline: 'border border-gray-300 bg-white hover:bg-gray-50 focus-visible:ring-gray-400',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-400',
        ghost: 'hover:bg-gray-100 focus-visible:ring-gray-400',
        link: 'underline-offset-4 hover:underline text-blue-600',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-8 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

---

## Document Metadata

| Property | Value |
|----------|-------|
| **Version** | 1.0.0 |
| **Status** | ✅ Complete for MVP |
| **Total Lines** | ~2,000 |
| **Parent** | [auth-optics-frontend-specification.md](auth-optics-frontend-specification.md) |

---

**Next Steps**: 
1. Review [frontend-state-management.md](frontend-state-management.md) for Context API and hooks
2. Review [frontend-services.md](frontend-services.md) for API client and SSE integration  
3. Follow [frontend-implementation-guide.md](frontend-implementation-guide.md) for complete implementation roadmap
