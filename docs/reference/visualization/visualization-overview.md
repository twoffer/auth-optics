# Visualization Requirements - Overview
## Design Philosophy and Core Components for OAuth2/OIDC Debugging Tool

> *"The best security tool is one that makes the invisible visible."*

---

## Document Information

| Property | Value |
|----------|-------|
| **Document Type** | UI/UX Requirements |
| **Target Audience** | Frontend developers, UI/UX designers |
| **Purpose** | Define visualization requirements for OAuth2/OIDC flows |
| **Related Docs** | All flow specifications, vulnerability mode docs |
| **Part** | 1 of 6 (Overview & Design System) |

---

## 1. Overview

### 1.1 Purpose

**Primary Goal**: Make OAuth2/OIDC protocol flows visible, understandable, and debuggable through comprehensive visualizations.

**Core Principle**: Show exactly what's happening according to specifications - every parameter, every validation, every security mechanism.

**Success Criteria**:
- User understands what happened at each protocol step
- User can identify security issues immediately
- User can debug real-world OAuth2/OIDC problems
- User learns OAuth2/OIDC concepts through interaction
- Developers can implement OAuth2/OIDC correctly after using tool

### 1.2 Target Audience

**Primary Users**:
- Security professionals debugging OAuth2/OIDC integrations
- Developers implementing OAuth2/OIDC clients
- Security auditors assessing OAuth2/OIDC implementations
- Educators teaching authentication protocols
- Penetration testers analyzing OAuth2/OIDC vulnerabilities

**User Needs**:
- See complete request/response details
- Understand security implications of configurations
- Compare secure vs vulnerable implementations
- Export findings for documentation
- Learn protocol specifications interactively

---

## 2. Visualization Philosophy

### 2.1 Core Principles

**Transparency**
- Show ALL parameters, headers, and data exchanged
- No hidden implementation details
- Complete request/response visibility
- Clear indication of what happens externally vs internally

**Accuracy**
- Represent spec-compliant behavior precisely
- Exact HTTP requests and responses
- Correct RFC terminology
- Proper state transitions

**Education**
- Help users learn OAuth2/OIDC concepts
- Contextual explanations for every element
- Spec references for all behaviors
- Progressive learning path (beginner to expert)

**Debugging**
- Enable troubleshooting of real-world issues
- Clear error messages with solutions
- Timing and performance metrics
- Comparison tools (before/after, secure/vulnerable)

**Comparison**
- Side-by-side secure vs vulnerable
- Highlight security differences
- Show attack impact
- Demonstrate why protections matter

### 2.2 Design Principles

**Progressive Disclosure**
```
Summary View (Default)
├── High-level status (✓ Success, ✗ Failed)
├── Key parameters visible
└── [View Details] button
    │
    └── Detailed View (On Demand)
        ├── Complete request/response
        ├── All headers and parameters
        ├── Validation steps
        └── Spec references
```

**Color Coding System**
- **Green (#10B981)**: Secure, successful, recommended
- **Yellow/Orange (#F59E0B)**: Warning, caution, needs attention
- **Red (#EF4444)**: Error, vulnerable, dangerous
- **Blue (#3B82F6)**: Informational, neutral
- **Gray (#6B7280)**: Disabled, optional, secondary

**Temporal Flow**
- Clear visual sequence (1 → 2 → 3 → 4)
- Timeline representation
- Expandable steps
- Animation option (can be toggled on/off)

**Data Inspection**
- Every parameter inspectable
- Click/hover for details
- Copy to clipboard everywhere
- Syntax highlighting for code/JSON

**Contextual Help**
- Hover tooltips for quick info
- "?" icons for deeper explanations
- Links to specification documents
- Examples for complex concepts

---

## 3. Core Visualization Components

### 3.1 Component: Flow Timeline

**Purpose**: Show sequence of OAuth2/OIDC flow steps

**Visual Structure**:
```
┌─────────────────────────────────────────────────────────┐
│  Authorization Code Flow Timeline                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1              2              3              4         │
│  ◉──────────────◉──────────────◉──────────────◉        │
│  │              │              │              │         │
│  Authorization  User           Authorization  Token     │
│  Request        Auth           Response       Exchange  │
│  ✓ 0.5s         External       ✓ 0.2s         ✓ 0.3s   │
│  [Details]      [Info]         [Details]      [Details] │
│                                                          │
│  Total Time: 1.2s               Status: ✓ Success      │
└─────────────────────────────────────────────────────────┘
```

**Elements**:

1. **Step Icons**
   - Circle (◉) for completed steps
   - Hollow circle (○) for pending steps
   - Check mark (✓) for successful steps
   - X mark (✗) for failed steps
   - Spinner (⟳) for in-progress steps

2. **Connecting Lines**
   - Solid line for completed transitions
   - Dashed line for pending transitions
   - Colored based on status (green/red)

3. **Step Labels**
   - Step number
   - Step name (e.g., "Authorization Request")
   - Duration (e.g., "0.5s")
   - Status indicator

4. **Expandable Details**
   - Click step to expand details panel below
   - Shows request/response for that step
   - Can expand multiple steps simultaneously

**Interaction**:
- Click step: Expand/collapse details
- Hover step: Show tooltip summary
- Click "View All": Expand all steps
- Click "Collapse All": Collapse all steps

**Responsive Behavior**:
- Desktop: Horizontal timeline
- Tablet: Horizontal timeline (smaller)
- Mobile: Vertical timeline (stacked)

---

### 3.2 Component: HTTP Request/Response Viewer

**Purpose**: Display complete HTTP request and response details

**Visual Structure**:
```
┌─────────────────────────────────────────────────────────┐
│  POST /realms/oauth2-demo/protocol/openid-connect/token│
│  https://localhost:8080                                 │
│                                                          │
│  ▼ Headers (3)                              [Copy All]  │
│    Content-Type: application/x-www-form-urlencoded      │
│    Authorization: Basic czZCaGRSa3F0M...    [Copy]      │
│    User-Agent: OAuth2-Debug-Tool/1.0        [Copy]      │
│                                                          │
│  ▼ Body Parameters (5)                      [Copy All]  │
│    ┌─────────────────┬──────────────────────────────┐  │
│    │ Parameter       │ Value                        │  │
│    ├─────────────────┼──────────────────────────────┤  │
│    │ grant_type      │ authorization_code           │  │
│    │ code            │ SplxlOBeZQQYbYS6WxSbIA      │  │
│    │ redirect_uri    │ https://localhost:3000/cb   │  │
│    │ client_id       │ web-app                      │  │
│    │ code_verifier   │ dBjftJeZ4CVP-mB92K27...     │  │
│    └─────────────────┴──────────────────────────────┘  │
│                                                          │
│  ▼ Response (200 OK)                        [Copy All]  │
│    {                                                     │
│      "access_token": "eyJhbGc...",                      │
│      "token_type": "Bearer",                            │
│      "expires_in": 3600,                                │
│      "refresh_token": "tGzv3J...",                      │
│      "scope": "openid profile email"                    │
│    }                                                     │
│                                                          │
│    [Inspect Access Token] [Inspect Refresh Token]      │
└─────────────────────────────────────────────────────────┘
```

**Features**:

1. **URL Display**
   - HTTP method (POST, GET, etc.)
   - Full URL
   - HTTPS indicator (🔒) or HTTP warning (⚠️)

2. **Headers Section**
   - Collapsible (show/hide)
   - Count indicator (e.g., "Headers (3)")
   - Each header on separate line
   - Copy button per header
   - Copy All button

3. **Body Parameters**
   - Table format for readability
   - Parameter name and value columns
   - Long values truncated with "..." (click to expand)
   - Copy button per parameter
   - Syntax highlighting for JSON bodies

4. **Response Section**
   - HTTP status code with color coding:
     - 2xx: Green
     - 4xx: Orange/Yellow
     - 5xx: Red
   - Response body pretty-printed (JSON)
   - Syntax highlighting
   - Token inspector buttons for token responses

5. **Copy Functionality**
   - Copy individual values
   - Copy entire request as cURL
   - Copy response body
   - "Copied!" feedback animation

**JSON Syntax Highlighting**:
```json
{
  "access_token": "eyJhbGc...",    // String (green)
  "token_type": "Bearer",          // String (green)
  "expires_in": 3600,              // Number (blue)
  "refresh_token": "tGzv3J..."     // String (green)
}
```

---

### 3.3 Component: Token Inspector

**Purpose**: Decode and display JWT tokens with validation status

**Visual Structure**:
```
┌─────────────────────────────────────────────────────────┐
│  Access Token Inspector                     [Copy JWT]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─ JWT Structure ────────────────────────────────────┐ │
│  │  Header . Payload . Signature                       │ │
│  │  [Blue]   [Green]   [Orange]                        │ │
│  │                                                      │ │
│  │  [Raw JWT] [Decoded]  ← Toggle                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                          │
│  ▼ Header                                               │
│    {                                                     │
│      "alg": "RS256",      ℹ️ RSA signature with SHA-256 │
│      "typ": "JWT",        ℹ️ JSON Web Token             │
│      "kid": "2024-01-1"   ℹ️ Key identifier             │
│    }                                                     │
│                                                          │
│  ▼ Payload                                              │
│    ┌────────┬─────────────────────┬─────────────────┐  │
│    │ Claim  │ Value               │ Status          │  │
│    ├────────┼─────────────────────┼─────────────────┤  │
│    │ iss    │ https://auth.ex.com │ ✓ Valid         │  │
│    │ sub    │ user123             │ -               │  │
│    │ aud    │ https://api.ex.com  │ ✓ Matches       │  │
│    │ exp    │ 1735776000          │ ✓ Not expired   │  │
│    │        │ (2024-12-31 12:00)  │   (23m left)    │  │
│    │ iat    │ 1735772400          │ ✓ Recent        │  │
│    │ scope  │ read write          │ -               │  │
│    └────────┴─────────────────────┴─────────────────┘  │
│                                                          │
│  ▼ Signature Verification                               │
│    Status: ✓ VALID                                      │
│    Algorithm: RS256                                      │
│    Key ID: 2024-01-1                                     │
│    Public Key: Retrieved from JWKS                       │
│                                                          │
│  ═══════════════════════════════════════════════════    │
│  Overall Validation: ✓ TOKEN IS VALID                   │
│  Expires in: 23 minutes 45 seconds                      │
│  ═══════════════════════════════════════════════════    │
│                                                          │
│  [View Full JWT] [View JWKS] [Explain Validation]      │
└─────────────────────────────────────────────────────────┘
```

**Features**:

1. **JWT Structure Visualization**
   - Three-part structure: Header . Payload . Signature
   - Color-coded sections
   - Toggle: Raw (Base64) vs Decoded (JSON)

2. **Header Section**
   - Decoded JSON
   - Explanation tooltip for each field
   - Algorithm explanation

3. **Payload Section (Claims)**
   - Table format for clarity
   - Claim name, value, and validation status
   - Human-readable timestamps
   - Expiration countdown timer
   - Status indicators: ✓ Valid, ✗ Invalid, - Not validated

4. **Signature Verification**
   - Clear validation status (large, prominent)
   - Algorithm used
   - Key information
   - Verification process explanation

5. **Overall Status**
   - Prominent validation result
   - Expiration countdown
   - Color coding: Green (valid), Red (invalid)

6. **Expiration Timer**
   - Live countdown: "23 minutes 45 seconds"
   - Progress bar showing time remaining
   - Color coding:
     - Green: >15 minutes remaining
     - Yellow: 5-15 minutes remaining
     - Orange: 1-5 minutes remaining
     - Red: <1 minute or expired

**Opaque Token Display** (non-JWT):
```
┌─────────────────────────────────────────────────────────┐
│  Access Token (Opaque)                                  │
├─────────────────────────────────────────────────────────┤
│  Token: tGzv3JOkF0XG5Qx2TlKWIA                         │
│  Type: Bearer                                           │
│  Format: Opaque (cannot be decoded locally)            │
│                                                          │
│  Use token introspection endpoint to validate.         │
│  [Introspect Token]                                     │
└─────────────────────────────────────────────────────────┘
```

---

### 3.4 Component: Security Indicators

**Purpose**: Visual status of security mechanisms

**Visual Structure**:
```
┌─────────────────────────────────────────────────────────┐
│  Security Status                                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ✓ PKCE Enabled (S256)              [Details]          │
│    Code verifier bound to authorization code            │
│                                                          │
│  ✓ State Parameter Validated        [Details]          │
│    CSRF protection active                               │
│                                                          │
│  🔒 HTTPS Throughout                [Details]          │
│    All endpoints use TLS encryption                     │
│                                                          │
│  ✓ Tokens Stored Securely           [Details]          │
│    Backend session storage (HttpOnly cookies)           │
│                                                          │
│  ⚠️ Long Token Lifetime             [Details]          │
│    Access token: 60 minutes (consider 15 minutes)       │
│                                                          │
│  Overall Security: GOOD (95/100)    [View Scorecard]   │
└─────────────────────────────────────────────────────────┘
```

**Security Badge Types**:

1. **PKCE Status**
   - ✓ "PKCE Enabled (S256)" - Green
   - ⚠️ "PKCE Optional" - Yellow
   - ✗ "PKCE Disabled" - Red

2. **State Validation**
   - ✓ "State Validated" - Green
   - ⚠️ "State Not Validated" - Red

3. **HTTPS Indicator**
   - 🔒 "HTTPS" - Green
   - ⚠️ "HTTP (Localhost Only)" - Yellow
   - ✗ "HTTP (Vulnerable)" - Red

4. **Token Storage**
   - ✓ "Secure Storage" - Green (backend, keychain)
   - ⚠️ "Memory Only" - Yellow (acceptable for SPAs)
   - ✗ "localStorage" - Red (XSS vulnerability)

5. **Token Lifetimes**
   - ✓ "Short-lived (≤15 min)" - Green
   - ⚠️ "Moderate (15-60 min)" - Yellow
   - ⚠️ "Long-lived (>60 min)" - Orange

**Vulnerability Mode Indicators**:
```
╔═══════════════════════════════════════════════════════════╗
║  ⚠️  VULNERABILITY MODE ACTIVE  ⚠️                        ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  Active Vulnerabilities:                                 ║
║  ✗ PKCE Disabled - Code interception possible            ║
║  ✗ State Validation Skipped - CSRF attacks possible      ║
║  ✗ HTTP Authorization Endpoint - Network interception    ║
║                                                           ║
║  Security Score: 25/100 (F)  [Reset to Secure Mode]     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

---

### 3.5 Component: Comparison View

**Purpose**: Side-by-side comparison of secure vs vulnerable configurations

**Visual Structure**:
```
┌──────────────────────────────┬──────────────────────────────┐
│  Secure Mode                 │  Vulnerable Mode             │
│  (RECOMMENDED)               │  (EDUCATIONAL ONLY)          │
├──────────────────────────────┼──────────────────────────────┤
│                              │                              │
│  Authorization Request       │  Authorization Request       │
│  ✓ code_challenge=E9Mel...   │  ✗ code_challenge MISSING   │
│  ✓ code_challenge_method=S256│  ✗ No PKCE protection       │
│  ✓ state=af0ifjsldkj         │  ✗ state MISSING            │
│                              │                              │
│  Token Request               │  Token Request               │
│  ✓ code_verifier=dBjftJ...   │  ✗ code_verifier MISSING   │
│                              │                              │
│  Result:                     │  Result:                     │
│  ✓ Tokens issued             │  ⚠️ Tokens issued            │
│  ✓ Code binding verified     │  ✗ No verification          │
│  ✓ Attack prevented          │  ✗ VULNERABLE               │
│                              │  ⚠️ Attacker could intercept │
│                              │     code and exchange it!    │
│                              │                              │
│  Security Score: 95/100      │  Security Score: 40/100      │
│                              │                              │
└──────────────────────────────┴──────────────────────────────┘
```

**Features**:
- Split-screen layout (50/50)
- Synchronized scrolling (optional)
- Difference highlighting:
  - Green: Present in secure, missing in vulnerable
  - Red: Missing in vulnerable, present in secure
  - Yellow: Different values
- Attack overlay on vulnerable side showing exploitation
- Toggle: Show differences only vs show everything

---

## 4. Design System

### 4.1 Color Palette

**Primary Colors**:
```
Success Green:    #10B981  ■
Warning Yellow:   #F59E0B  ■
Error Red:        #EF4444  ■
Info Blue:        #3B82F6  ■
Neutral Gray:     #6B7280  ■
```

**Background Colors**:
```
Background:       #F9FAFB  ■
Surface:          #FFFFFF  ■
Surface Elevated: #F3F4F6  ■
```

**Text Colors**:
```
Primary Text:     #111827  ■
Secondary Text:   #6B7280  ■
Muted Text:       #9CA3AF  ■
```

**Semantic Colors**:
```
HTTPS Secure:     #10B981  ■ (Green)
HTTP Warning:     #F59E0B  ■ (Orange)
Vulnerability:    #EF4444  ■ (Red)
Information:      #3B82F6  ■ (Blue)
```

### 4.2 Typography

**Font Stack**:
```
Primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
Monospace: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace
```

**Type Scale**:
```
Display:  36px / 2.25rem  (Page titles)
H1:       30px / 1.875rem (Section headers)
H2:       24px / 1.5rem   (Subsection headers)
H3:       20px / 1.25rem  (Component headers)
Body:     16px / 1rem     (Default text)
Small:    14px / 0.875rem (Secondary text)
Tiny:     12px / 0.75rem  (Captions, labels)
```

**Font Weights**:
```
Regular: 400
Medium:  500
Semibold: 600
Bold:    700
```

### 4.3 Spacing System

**Base Unit**: 4px

```
0:   0px
1:   4px   (0.25rem)
2:   8px   (0.5rem)
3:   12px  (0.75rem)
4:   16px  (1rem)
5:   20px  (1.25rem)
6:   24px  (1.5rem)
8:   32px  (2rem)
10:  40px  (2.5rem)
12:  48px  (3rem)
16:  64px  (4rem)
```

**Component Spacing**:
- Card padding: 24px (6 units)
- Section margin: 32px (8 units)
- Element spacing: 16px (4 units)
- Tight spacing: 8px (2 units)

### 4.4 Elevation (Shadows)

```
Level 0: none
Level 1: 0 1px 3px 0 rgba(0, 0, 0, 0.1)   (Subtle)
Level 2: 0 4px 6px -1px rgba(0, 0, 0, 0.1) (Cards)
Level 3: 0 10px 15px -3px rgba(0, 0, 0, 0.1) (Modals)
Level 4: 0 20px 25px -5px rgba(0, 0, 0, 0.1) (Overlays)
```

### 4.5 Border Radius

```
None:    0px
Small:   4px   (Buttons, inputs)
Medium:  8px   (Cards)
Large:   12px  (Modals)
Full:    9999px (Pills, avatars)
```

### 4.6 Breakpoints

```
Mobile:   320px - 767px
Tablet:   768px - 1023px
Desktop:  1024px - 1439px
Large:    1440px+
```

### 4.7 Icons

**Icon Library**: Heroicons, Lucide, or similar

**Icon Sizes**:
```
Small:   16px
Medium:  20px
Large:   24px
XLarge:  32px
```

**Common Icons**:
- ✓ Check mark (success)
- ✗ X mark (error)
- ⚠️ Warning triangle
- ℹ️ Info circle
- 🔒 Lock (HTTPS)
- ⟳ Spinner (loading)
- 📋 Clipboard (copy)
- 🔍 Magnifying glass (inspect)

---

## 5. Component Library

### 5.1 Button Component

**Types**:
```jsx
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="danger">Delete</Button>
<Button variant="ghost">Cancel</Button>
```

**Sizes**:
```jsx
<Button size="small">Small</Button>
<Button size="medium">Medium</Button>  // Default
<Button size="large">Large</Button>
```

**States**:
- Normal
- Hover
- Active (pressed)
- Disabled
- Loading (with spinner)

### 5.2 Badge Component

**Security Badges**:
```jsx
<Badge variant="success">✓ PKCE Enabled</Badge>
<Badge variant="warning">⚠️ HTTP Endpoint</Badge>
<Badge variant="error">✗ State Missing</Badge>
<Badge variant="info">ℹ️ Optional Parameter</Badge>
```

### 5.3 Card Component

**Basic Card**:
```jsx
<Card>
  <CardHeader>
    <CardTitle>Authorization Request</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content here */}
  </CardContent>
  <CardFooter>
    <Button>View Details</Button>
  </CardFooter>
</Card>
```

### 5.4 Accordion Component

**Collapsible Sections**:
```jsx
<Accordion>
  <AccordionItem value="headers">
    <AccordionTrigger>▼ Headers (3)</AccordionTrigger>
    <AccordionContent>
      {/* Headers content */}
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

### 5.5 Tabs Component

**View Switching**:
```jsx
<Tabs defaultValue="decoded">
  <TabsList>
    <TabsTrigger value="raw">Raw JWT</TabsTrigger>
    <TabsTrigger value="decoded">Decoded</TabsTrigger>
  </TabsList>
  <TabsContent value="raw">{/* Raw view */}</TabsContent>
  <TabsContent value="decoded">{/* Decoded view */}</TabsContent>
</Tabs>
```

### 5.6 Tooltip Component

**Contextual Help**:
```jsx
<Tooltip content="PKCE binds the authorization code to the client">
  <InfoIcon />
</Tooltip>
```

---

## 6. Responsive Design Strategy

### 6.1 Desktop (1024px+)

**Layout**: Full-width with sidebars
- Left sidebar: Navigation
- Main content: Flow visualization
- Right sidebar: Security status, context

**Features**: All features visible

### 6.2 Tablet (768px - 1023px)

**Layout**: Single column with collapsible sidebars
- Navigation: Top bar with hamburger menu
- Main content: Flow visualization (full width)
- Sidebars: Collapsible panels

**Features**: Most features available, some collapsed by default

### 6.3 Mobile (320px - 767px)

**Layout**: Single column, stacked
- Navigation: Bottom tab bar or top hamburger
- Main content: Vertical timeline
- Details: Modal overlays or accordion

**Features**: Progressive disclosure required
- Summary views by default
- Expand for details
- Simplified visualizations

---

## 7. Accessibility Requirements

### 7.1 WCAG 2.1 AA Compliance

**Color Contrast**:
- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum

**Keyboard Navigation**:
- All interactive elements focusable
- Tab order logical
- Keyboard shortcuts available
- Focus indicators visible (2px outline)

**Screen Reader Support**:
- Semantic HTML
- ARIA labels where needed
- Descriptive link text
- Status updates announced

**Visual Indicators**:
- Don't rely on color alone
- Use icons + text
- Patterns for differences
- Clear labels

### 7.2 Keyboard Shortcuts

```
Ctrl/Cmd + K: Command palette
Ctrl/Cmd + D: Toggle dark mode
Ctrl/Cmd + C: Copy current selection
Esc:          Close modal/overlay
Tab:          Next element
Shift + Tab:  Previous element
Space:        Expand/collapse
Enter:        Activate button/link
```

---

## 8. Performance Requirements

### 8.1 Loading Performance

**Targets**:
- Initial page load: <2 seconds
- Time to interactive: <3 seconds
- First contentful paint: <1 second

**Optimization Strategies**:
- Code splitting
- Lazy loading for components
- Image optimization
- Minimal external dependencies

### 8.2 Runtime Performance

**Targets**:
- Smooth animations: 60 FPS
- Token inspector: <50ms response
- Flow visualization: Real-time (<100ms latency)
- Syntax highlighting: <100ms

**Optimization Strategies**:
- Virtual scrolling for large datasets
- Debounced search/filter
- Memoization for expensive computations
- Web Workers for heavy processing

### 8.3 Memory Management

**Targets**:
- Base memory: <50MB
- With flow data: <100MB
- No memory leaks

---

## 9. Animation Guidelines

### 9.1 Animation Purposes

**Feedback**: Confirm user actions
- Button press
- Copy to clipboard
- Form submission

**Attention**: Draw focus to important changes
- New error message
- Security warning
- Token expiration

**Continuity**: Show relationships
- Flow step transitions
- Expand/collapse
- Modal open/close

### 9.2 Animation Timing

```
Fast:   100-200ms (Micro-interactions)
Medium: 200-400ms (Transitions)
Slow:   400-600ms (Complex animations)
```

**Easing Functions**:
- Ease-out: Start fast, end slow (most interactions)
- Ease-in: Start slow, end fast (dismissals)
- Ease-in-out: Smooth throughout (transitions)

### 9.3 Reduced Motion

**Respect User Preference**:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Document Metadata

| Property | Value |
|----------|-------|
| **Version** | 1.0.0 |
| **Part** | 1 of 6 (Overview & Design System) |
| **Target** | Frontend developers, UI/UX designers |
| **Related Docs** | All visualization documents |

---

**Next**: See `visualization-flow-sequences.md` for detailed flow-specific visualization requirements.
