# Visualization Requirements - UI/UX Requirements
## User Experience Patterns and Interactive Features

> *"The best interface is the one you don't notice – until you need it."*

---

## Document Information

| Property | Value |
|----------|-------|
| **Document Type** | UI/UX Requirements |
| **Target Audience** | UX designers, frontend developers |
| **Purpose** | Define user experience patterns and interactive features |
| **Related Docs** | All visualization documents |
| **Part** | 5 of 6 (UI/UX Requirements) |

---

## 1. Educational Overlays and Contextual Help

### 1.1 Tooltip System

**Purpose**: Provide instant context for any element

**Implementation**:
```jsx
<Tooltip content="PKCE binds the authorization code to the client that requested it">
  <InfoIcon className="inline" />
</Tooltip>
```

**Tooltip Specifications**:
```
┌─────────────────────────────────────────────────────────────┐
│ Trigger: Hover (desktop) / Tap (mobile)                    │
│ Delay: 300ms (prevents accidental triggers)                │
│ Position: Auto (above/below based on space)                │
│ Max Width: 320px                                           │
│ Animation: Fade in/out (150ms)                             │
│ Dismissal: Move away / Tap outside                         │
└─────────────────────────────────────────────────────────────┘
```

**Content Guidelines**:
- Keep under 2 sentences
- Plain language (avoid jargon)
- Include spec reference if relevant
- Link to "Learn More" for complex topics

**Example Tooltips**:

| Element | Tooltip Text |
|---------|-------------|
| PKCE badge | "Proof Key for Code Exchange - Prevents authorization code interception attacks. RFC 7636" |
| State parameter | "Random value that protects against CSRF attacks by binding the authorization response to your session" |
| exp claim | "Expiration time - When this token becomes invalid. Tokens should have short lifetimes (≤15 min recommended)" |
| code_challenge | "SHA-256 hash of the code verifier. Server will verify this matches when exchanging the code" |

### 1.2 "What is this?" Icons

**Visual**: ℹ️ icon next to technical terms

**Behavior**:
- Click: Open detailed explanation panel
- Shift+Click: Open specification document
- Right-click: Copy term definition

**Explanation Panel Format**:
```
┌─────────────────────────────────────────────────────────────┐
│  What is: code_challenge?                          [Close]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Simple Explanation:                                        │
│  A hash of a secret value that proves you're the same       │
│  client who started the authorization.                      │
│                                                              │
│  Technical Details:                                         │
│  The code_challenge is the SHA-256 hash of a random         │
│  code_verifier, Base64URL encoded. It's sent during         │
│  authorization, and the verifier is sent during token       │
│  exchange. The server verifies they match.                  │
│                                                              │
│  Why it Matters:                                            │
│  Prevents attackers from stealing authorization codes       │
│  and exchanging them for tokens.                            │
│                                                              │
│  Specification:                                             │
│  RFC 7636 §4.2 - Client Creates the Code Challenge         │
│  [View RFC] [View Our Documentation]                       │
│                                                              │
│  Example:                                                   │
│  code_verifier: dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gF...    │
│  code_challenge: E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuG...    │
│                                                              │
│  [View Full Example] [Try Interactive Demo]                │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Guided Tours

**First-Time User Experience**:

```
┌─────────────────────────────────────────────────────────────┐
│  Welcome to OAuth2 Debug Tool!                              │
│                                                              │
│  Take a 2-minute tour? [Yes, show me around] [Skip]        │
└─────────────────────────────────────────────────────────────┘
```

**Tour Steps** (8 steps):

1. **Overview**: "This tool helps you understand OAuth2/OIDC flows"
2. **Flow Selection**: "Choose which OAuth2 flow to execute"
3. **Configuration**: "Configure client and server settings"
4. **Execute**: "Run the flow and watch what happens"
5. **Timeline**: "See each step of the flow"
6. **Security**: "Check security indicators"
7. **Tokens**: "Inspect tokens received"
8. **Learn More**: "Explore vulnerability mode and comparisons"

**Tour UI**:
```
┌─────────────────────────────────────────────────────────────┐
│  Step 3 of 8: Configuration                    [Skip Tour] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  👆 This is where you configure your OAuth2 client          │
│     settings. For now, we'll use secure defaults.           │
│                                                              │
│  [Previous] [Next] [Finish Tour]                           │
└─────────────────────────────────────────────────────────────┘
```

### 1.4 Learning Mode Toggle

**Purpose**: Show/hide educational content

```
┌──────────────────────────────────────────┐
│  Learning Mode: [ON ] OFF                │
│  ℹ️ Shows detailed explanations           │
└──────────────────────────────────────────┘
```

**When ON**:
- Show extended explanations
- Display spec references
- Include "Why?" notes
- Show security warnings
- Enable interactive quizzes

**When OFF**:
- Minimal, professional interface
- Assume user knowledge
- Show only essential info
- Faster, streamlined UI

**Example Difference**:

| With Learning Mode | Without Learning Mode |
|--------------------|----------------------|
| "State parameter (CSRF protection): af0ifjsldkj<br>ℹ️ Random value that binds authorization response to your session. Prevents attackers from tricking you into authorizing their requests. RFC 6749 §10.12" | "state: af0ifjsldkj ✓" |

### 1.5 Interactive Quizzes

**Trigger**: After completing a flow or reading documentation

```
┌─────────────────────────────────────────────────────────────┐
│  Quick Knowledge Check!                                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Question 1 of 3:                                           │
│                                                              │
│  Why is PKCE important for public clients?                  │
│                                                              │
│  ○ It encrypts the authorization code                       │
│  ○ It binds the code to the original client                 │
│  ○ It makes codes harder to guess                           │
│  ○ It's not important, just recommended                     │
│                                                              │
│  [Check Answer] [Skip Quiz]                                │
└─────────────────────────────────────────────────────────────┘
```

**After Answer**:
```
┌─────────────────────────────────────────────────────────────┐
│  ✓ Correct!                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PKCE binds the authorization code to the original client   │
│  through cryptographic proof. The client must present the   │
│  code_verifier that matches the code_challenge sent         │
│  earlier.                                                   │
│                                                              │
│  This prevents code interception attacks where an attacker  │
│  steals the code but can't exchange it without the verifier.│
│                                                              │
│  [Next Question] [Finish Quiz]                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Export and Sharing Features

### 2.1 Export Formats

**Export Menu**:
```
┌──────────────────────────────────────┐
│  Export Flow                         │
├──────────────────────────────────────┤
│  📄 JSON (Complete Data)             │
│  💻 cURL Commands                    │
│  📝 Markdown Report                  │
│  📊 PDF Report                       │
│  🖼️  Screenshot (PNG)                │
│  🔗 Share Link                       │
└──────────────────────────────────────┘
```

### 2.2 JSON Export

**Format**: Complete flow data with all requests, responses, and metadata

```json
{
  "export_version": "1.0.0",
  "export_date": "2024-12-10T12:45:00Z",
  "flow_type": "authorization_code",
  "flow_id": "flow_abc123",
  "status": "success",
  "duration_ms": 3240,
  "security_score": 95,
  "steps": [
    {
      "step_number": 1,
      "step_name": "Authorization Request",
      "timestamp": "2024-12-10T12:45:23.456Z",
      "duration_ms": 150,
      "request": {
        "method": "GET",
        "url": "https://localhost:8080/realms/oauth2-demo/protocol/openid-connect/auth",
        "parameters": {
          "response_type": "code",
          "client_id": "web-app",
          "redirect_uri": "https://localhost:3000/callback",
          "scope": "openid profile email",
          "state": "af0ifjsldkj",
          "code_challenge": "E9Melhoa2OwvFrEMTJguCHaoeK1t8U",
          "code_challenge_method": "S256"
        }
      },
      "security_checks": [
        {"name": "PKCE", "status": "pass"},
        {"name": "State", "status": "pass"},
        {"name": "HTTPS", "status": "pass"}
      ]
    }
    // ... more steps
  ],
  "tokens": {
    "access_token": {
      "type": "JWT",
      "header": {"alg": "RS256", "typ": "JWT", "kid": "2024-01-1"},
      "payload": {
        "iss": "https://auth.example.com",
        "sub": "user123",
        // ... claims
      },
      "validation": "passed"
    }
    // ... more tokens
  },
  "security_assessment": {
    "overall_score": 95,
    "grade": "A",
    "categories": {
      "pkce": {"score": 20, "max": 20},
      "csrf": {"score": 20, "max": 20},
      // ... more categories
    },
    "recommendations": [
      "Consider shorter access token lifetime"
    ]
  }
}
```

**Use Cases**:
- Archive flow data
- Import into other tools
- Automated analysis
- Compliance documentation

### 2.3 cURL Export

**Format**: Shell script with cURL commands to reproduce flow

```bash
#!/bin/bash
# OAuth2 Authorization Code Flow
# Generated: 2024-12-10T12:45:00Z
# Flow ID: flow_abc123

# Step 1: Authorization Request
# Note: This opens in browser, cannot be reproduced with cURL
echo "Visit this URL in your browser:"
echo "https://localhost:8080/realms/oauth2-demo/protocol/openid-connect/auth?response_type=code&client_id=web-app&redirect_uri=https%3A%2F%2Flocalhost%3A3000%2Fcallback&scope=openid+profile+email&state=af0ifjsldkj&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8U&code_challenge_method=S256"

# Step 4: Token Request
# Replace CODE with the authorization code received
CODE="SplxlOBeZQQYbYS6WxSbIA"

curl -X POST "https://localhost:8080/realms/oauth2-demo/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Authorization: Basic d2ViLWFwcDp3ZWItYXBwLXNlY3JldC0xMjM0NQ==" \
  -d "grant_type=authorization_code" \
  -d "code=$CODE" \
  -d "redirect_uri=https://localhost:3000/callback" \
  -d "code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"

# Step 7: API Request
# Replace ACCESS_TOKEN with the access token received
ACCESS_TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET "https://api.example.com/user/profile" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Accept: application/json"
```

**Use Cases**:
- Manual testing
- Script automation
- Documentation
- Troubleshooting

### 2.4 Markdown Report

**Format**: Human-readable report with all details

```markdown
# OAuth2 Authorization Code Flow Report

**Flow ID**: flow_abc123  
**Date**: December 10, 2024 12:45:00 UTC  
**Status**: ✓ Success  
**Duration**: 3.24 seconds  
**Security Score**: 95/100 (Grade A)

---

## Flow Summary

Successfully completed OAuth2 Authorization Code flow with PKCE. All security checks passed. Tokens obtained and validated.

## Security Assessment

### Strengths
- ✓ PKCE enabled with S256 method
- ✓ State parameter validated (CSRF protection)
- ✓ HTTPS used throughout
- ✓ Tokens stored securely

### Recommendations
- Consider reducing access token lifetime to 15 minutes (currently 60)
- Implement DPoP for sender-constrained tokens

---

## Step-by-Step Details

### Step 1: Authorization Request (0.15s)

**Request**: GET `https://localhost:8080/realms/oauth2-demo/protocol/openid-connect/auth`

**Parameters**:
- `response_type`: code
- `client_id`: web-app
- `redirect_uri`: https://localhost:3000/callback
- `scope`: openid profile email
- `state`: af0ifjsldkj
- `code_challenge`: E9Melhoa2OwvFrEMTJguCHaoeK1t8U
- `code_challenge_method`: S256

**Security Checks**:
- ✓ PKCE included
- ✓ State parameter present
- ✓ HTTPS URL

[... more steps ...]

---

## Tokens Received

### Access Token
- **Type**: JWT (RS256)
- **Lifetime**: 60 minutes
- **Scopes**: openid, profile, email
- **Validation**: ✓ All checks passed

### Refresh Token
- **Type**: Opaque
- **Lifetime**: 30 days
- **Single-use**: Yes (rotation enabled)

### ID Token
- **Type**: JWT (RS256)
- **Subject**: user123
- **Email**: alice@example.com
- **Validation**: ✓ All 12 OIDC checks passed

---

## Conclusion

Flow completed successfully with excellent security posture. Recommend minor improvements to token lifetimes.
```

**Use Cases**:
- Documentation
- Sharing with team
- Learning reference
- Compliance reports

### 2.5 Share Link

**Purpose**: Generate shareable URL (no sensitive data)

```
┌─────────────────────────────────────────────────────────────┐
│  Share Flow                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Share this flow with your team:                            │
│                                                              │
│  🔗 https://oauth2-tool.example.com/flows/abc123            │
│     [Copy Link] [QR Code]                                   │
│                                                              │
│  ⚠️ Privacy Note:                                            │
│  • Tokens are NOT included in shared link                   │
│  • Only flow configuration and structure shared             │
│  • No sensitive credentials exposed                         │
│                                                              │
│  Expiration: [7 days ▼] [Never ▼] [Custom ▼]               │
│                                                              │
│  [Generate Link] [Cancel]                                   │
└─────────────────────────────────────────────────────────────┘
```

**Shared View**:
- Read-only flow visualization
- Configuration details
- Security assessment
- No actual tokens
- Option to "Clone Configuration"

---

## 3. Developer Tools Integration

### 3.1 Network Inspector

**Purpose**: Browser DevTools-like network view

```
┌─────────────────────────────────────────────────────────────┐
│  Network                            [Clear] [Filter] [⚙️]    │
├────┬──────────┬──────┬────────┬──────────┬─────────┬───────┤
│ #  │ Method   │ URL  │ Status │ Type     │ Size    │ Time  │
├────┼──────────┼──────┼────────┼──────────┼─────────┼───────┤
│ 1  │ GET      │ /auth│ 302    │ document │ 1.2 KB  │ 150ms │
│ 2  │ GET      │ /cb  │ 200    │ document │ 0.8 KB  │ 80ms  │
│ 3  │ POST     │ /token│ 200   │ xhr      │ 2.4 KB  │ 210ms │
│ 4  │ GET      │ /api │ 200    │ xhr      │ 3.1 KB  │ 110ms │
└────┴──────────┴──────┴────────┴──────────┴─────────┴───────┘

Click any row to view details ▼
```

**Request Details Panel**:
```
┌─────────────────────────────────────────────────────────────┐
│  POST /token                                       200 OK   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  General:                                                   │
│  Request URL: https://localhost:8080/.../token             │
│  Request Method: POST                                       │
│  Status Code: 200 OK                                        │
│  Remote Address: 127.0.0.1:8080                            │
│                                                              │
│  Timing:                                                    │
│  Queued: 0.5ms                                             │
│  Stalled: 2.3ms                                            │
│  DNS Lookup: 0ms (cached)                                  │
│  Initial Connection: 0ms (reused)                          │
│  SSL: 0ms (reused)                                         │
│  Request sent: 0.8ms                                       │
│  Waiting (TTFB): 205.2ms                                   │
│  Content Download: 1.2ms                                   │
│  Total: 210ms                                              │
│                                                              │
│  [Headers] [Payload] [Response] [Timing]                  │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Console

**Purpose**: Log messages for debugging

```
┌─────────────────────────────────────────────────────────────┐
│  Console                [Clear] [Filter ▼] [Settings ⚙️]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [12:45:23.456] ℹ️ Starting Authorization Code Flow         │
│  [12:45:23.612] ℹ️ Generated code_verifier (43 chars)       │
│  [12:45:23.634] ℹ️ Calculated code_challenge (S256)         │
│  [12:45:23.656] → Authorization request sent                │
│  [12:45:26.123] ← Authorization response received           │
│  [12:45:26.145] ✓ State validation passed                   │
│  [12:45:26.189] → Token request sent                        │
│  [12:45:26.402] ← Token response received                   │
│  [12:45:26.531] ✓ Access token validated                    │
│  [12:45:26.555] ✓ ID token validated (12 checks)            │
│  [12:45:26.567] ✓ Tokens stored securely                    │
│  [12:45:26.578] ✓ Flow completed successfully               │
│                                                              │
│  Warnings: 0  Errors: 0  Info: 12                          │
└─────────────────────────────────────────────────────────────┘
```

**Log Levels**:
- **Info** (ℹ️): General information
- **Success** (✓): Successful operation
- **Warning** (⚠️): Potential issue
- **Error** (✗): Failed operation
- **Debug** (🐛): Detailed debug info

**Filters**:
- By log level
- By step
- By keyword
- By time range

### 3.3 Raw View

**Purpose**: See exact HTTP traffic

```
┌─────────────────────────────────────────────────────────────┐
│  Raw HTTP View                              [Copy] [Save]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ▼ Request:                                                 │
│  POST /realms/oauth2-demo/protocol/openid-connect/token    │
│  HTTP/1.1                                                   │
│  Host: localhost:8080                                       │
│  Content-Type: application/x-www-form-urlencoded           │
│  Authorization: Basic d2ViLWFwcDp3ZWItYXBwLXNlY3JldC0xMjM0NQ==│
│  Content-Length: 189                                        │
│                                                              │
│  grant_type=authorization_code&code=SplxlOBeZQQYbYS6WxSbIA&redirect_uri=https%3A%2F%2Flocalhost%3A3000%2Fcallback&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
│                                                              │
│  ▼ Response:                                                │
│  HTTP/1.1 200 OK                                           │
│  Content-Type: application/json                             │
│  Cache-Control: no-store                                    │
│  Pragma: no-cache                                           │
│  Content-Length: 1247                                       │
│                                                              │
│  {"access_token":"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."}│
│                                                              │
│  [Hex View] [Decode Base64] [Format JSON]                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Search and Filter

### 4.1 Global Search

```
┌──────────────────────────────────────────┐
│  🔍 Search flows, parameters, tokens...  │
└──────────────────────────────────────────┘
```

**Search Capabilities**:
- Flow names
- Parameter values
- Error messages
- Token claims
- Timestamps
- Client IDs
- User identifiers

**Search Results**:
```
┌─────────────────────────────────────────────────────────────┐
│  Search: "alice"                              3 results     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Authorization Code Flow - 2024-12-10 12:45             │
│     username: alice@example.com                             │
│     [View Flow]                                             │
│                                                              │
│  2. Refresh Token Flow - 2024-12-10 13:15                  │
│     ID token claim: name = "Alice Anderson"                │
│     [View Flow]                                             │
│                                                              │
│  3. Client Credentials Flow - 2024-12-10 13:30             │
│     client_id: alice-service-account                        │
│     [View Flow]                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Advanced Filters

```
┌─────────────────────────────────────────────────────────────┐
│  Filter Flows                                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Flow Type:                                                 │
│  ☑ Authorization Code  ☑ Client Credentials                │
│  ☑ Device Flow         ☑ Refresh Token                     │
│  ☐ Implicit (deprecated)                                    │
│                                                              │
│  Status:                                                    │
│  ☑ Success  ☐ Failed  ☐ In Progress                        │
│                                                              │
│  Security Score:                                            │
│  [========•==========] 50 - 100                            │
│                                                              │
│  Date Range:                                                │
│  From: [2024-12-01] To: [2024-12-10]                       │
│                                                              │
│  Client:                                                    │
│  [All Clients ▼]                                           │
│                                                              │
│  Vulnerability Mode:                                        │
│  ☐ Only vulnerable flows  ☐ Only secure flows              │
│                                                              │
│  [Apply Filters] [Reset] [Save Filter]                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Keyboard Shortcuts

### 5.1 Global Shortcuts

```
┌─────────────────────────────────────────────────────────────┐
│  Keyboard Shortcuts                          Press ? to show│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Navigation:                                                │
│  Ctrl/Cmd + K       Open command palette                    │
│  Ctrl/Cmd + /       Toggle sidebar                          │
│  Ctrl/Cmd + B       Go back                                 │
│  Ctrl/Cmd + F       Search                                  │
│                                                              │
│  Actions:                                                   │
│  Ctrl/Cmd + N       New flow                                │
│  Ctrl/Cmd + E       Execute current flow                    │
│  Ctrl/Cmd + R       Refresh                                 │
│  Ctrl/Cmd + S       Save/Export                             │
│                                                              │
│  Viewing:                                                   │
│  Ctrl/Cmd + +       Zoom in                                 │
│  Ctrl/Cmd + -       Zoom out                                │
│  Ctrl/Cmd + 0       Reset zoom                              │
│  Ctrl/Cmd + D       Toggle dark mode                        │
│                                                              │
│  Panels:                                                    │
│  Ctrl/Cmd + 1       Timeline view                           │
│  Ctrl/Cmd + 2       Network view                            │
│  Ctrl/Cmd + 3       Console view                            │
│  Ctrl/Cmd + 4       Security view                           │
│                                                              │
│  Clipboard:                                                 │
│  Ctrl/Cmd + C       Copy (context-aware)                    │
│  Ctrl/Cmd + Shift+C Copy as cURL                            │
│                                                              │
│  Help:                                                      │
│  ?                  Show keyboard shortcuts                 │
│  Esc                Close dialog/modal                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Command Palette

**Trigger**: Ctrl/Cmd + K

```
┌─────────────────────────────────────────────────────────────┐
│  🔍 Type a command or search...                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Quick Actions:                                             │
│  → Execute Authorization Code Flow                          │
│  → Execute Client Credentials Flow                          │
│  → View Recent Flows                                        │
│  → Compare Flows                                            │
│  → Toggle Vulnerability Mode                                │
│  → Export Current Flow                                      │
│                                                              │
│  View:                                                      │
│  → Toggle Dark Mode                                         │
│  → Toggle Learning Mode                                     │
│  → Show Timeline                                            │
│  → Show Security Scorecard                                  │
│                                                              │
│  Help:                                                      │
│  → View Documentation                                       │
│  → View Keyboard Shortcuts                                  │
│  → Report Issue                                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Responsive Design Adaptations

### 6.1 Desktop (1024px+)

**Layout**:
```
┌──────────────────────────────────────────────────────────┐
│  Header + Navigation                                     │
├────────────┬──────────────────────────┬─────────────────┤
│            │                          │                 │
│  Sidebar   │   Main Content Area      │  Context Panel  │
│  (Nav)     │   (Flow Visualization)   │  (Details)      │
│  20%       │   60%                    │  20%            │
│            │                          │                 │
│            │                          │                 │
│            │                          │                 │
└────────────┴──────────────────────────┴─────────────────┘
```

### 6.2 Tablet (768px - 1023px)

**Layout**:
```
┌──────────────────────────────────────────────────────────┐
│  Header + Navigation (Collapsible)                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Main Content Area (Full Width)                         │
│                                                          │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  Context Panel (Below, Collapsible)                     │
└──────────────────────────────────────────────────────────┘
```

**Interactions**:
- Tap hamburger to show/hide navigation
- Swipe up to reveal context panel
- Tabs for switching between views

### 6.3 Mobile (320px - 767px)

**Layout**:
```
┌────────────────────────┐
│  Header + Menu Button  │
├────────────────────────┤
│                        │
│  Main Content          │
│  (Stacked Vertically)  │
│                        │
│  • Step 1              │
│    [Details ▼]         │
│                        │
│  • Step 2              │
│    [Details ▼]         │
│                        │
│  • Step 3              │
│    [Details ▼]         │
│                        │
├────────────────────────┤
│  Bottom Navigation     │
└────────────────────────┘
```

**Mobile Optimizations**:
- Vertical timeline (stacked)
- Accordion for details
- Bottom sheet for panels
- Large touch targets (44px min)
- Simplified views

---

## 7. Dark Mode

### 7.1 Color Adjustments

**Light Mode** → **Dark Mode**:
- Background `#F9FAFB` → `#111827`
- Surface `#FFFFFF` → `#1F2937`
- Text `#111827` → `#F9FAFB`
- Borders `#E5E7EB` → `#374151`

**Semantic Colors Remain**:
- Success green: Same
- Error red: Same
- Warning yellow: Slightly desaturated
- Info blue: Slightly desaturated

### 7.2 Toggle

```
┌──────────────────────────┐
│  Theme: ☀️ [  ] 🌙       │
└──────────────────────────┘
```

**Persistence**: Save preference to localStorage

---

## Document Metadata

| Property | Value |
|----------|-------|
| **Version** | 1.0.0 |
| **Part** | 5 of 6 (UI/UX Requirements) |
| **Related Docs** | All visualization documents |
| **Completeness** | All UX patterns covered |

---

**Next**: See `visualization-implementation-guide.md` for technical implementation.
