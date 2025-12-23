# Device Authorization Flow (Device Code Grant)

## Specification Reference for OAuth2/OIDC Debugging Tool

> *"The story thus far: In the beginning, humans wanted to authenticate from their televisions. This has made a lot of keyboard manufacturers very confused and been widely regarded as a difficult problem to solve. Then came RFC 8628."*

---

## 1. Overview

The Device Authorization Flow (also known as the Device Code Grant or Device Flow) is OAuth 2.0's solution for authentication on devices that lack a web browser or have severely limited input capabilities. Instead of expecting users to type complex URLs and credentials using a TV remote control or game controller, this flow lets users complete authentication on a separate device (like their smartphone or laptop) while the constrained device polls for the authorization result.

**The Core Insight:** If your device can't easily accept user input, don't force it to. Let users authenticate on a device that *can*.

This flow is particularly elegant in its simplicity: the constrained device displays a short code, the user enters that code on a capable device, and the constrained device polls to learn when authorization is complete. No embedded browsers, no complex redirects, no typing passwords with a TV remote.

### When to Use This Flow

| Scenario | Use Device Flow? | Why |
|----------|-----------------|-----|
| Smart TV application | ✅ Yes | Limited keyboard input via remote control |
| Streaming device (Roku, Chromecast) | ✅ Yes | No keyboard, limited input capabilities |
| CLI tool on headless server | ✅ Yes | No browser available, SSH terminal only |
| IoT device (printer, camera) | ✅ Yes | No screen or keyboard for input |
| Game console login | ✅ Yes | Game controller not suitable for typing |
| Command-line developer tool | ✅ Yes | Better UX than copying URLs |
| Apple TV app | ✅ Yes | Siri remote not ideal for passwords |
| **Web application** | ❌ No | Use Authorization Code Flow |
| **Mobile native app** | ❌ No | Use Authorization Code Flow + PKCE |
| **Desktop app with browser** | ❌ No | Use Authorization Code Flow + PKCE |
| **Backend service** | ❌ No | Use Client Credentials Flow |

### Why This Flow Exists

**The Problem:** OAuth 2.0's Authorization Code Flow was designed for web and mobile applications with full browsers and keyboards. But many modern devices don't fit this model:

- **Smart TVs:** Users sitting on couch, using remote with D-pad
- **CLI tools:** Running in SSH sessions or headless environments
- **IoT devices:** Often lack screens or have minimal displays
- **Game consoles:** Game controllers are terrible for typing

**Previous "Solutions" (that were terrible):**
1. **Embedded keyboards on TV UI:** Painful UX, high abandonment
2. **Bluetooth keyboard pairing:** Most users don't have one
3. **Voice input:** Error-prone, privacy concerns
4. **Resource Owner Password Flow:** Deprecated, terrible security

**The Device Flow Solution:**
1. Device displays a short, memorable code (e.g., "WDJB-MJHT")
2. User visits a URL on their phone/computer (a device they already use for authentication)
3. User enters the code and completes normal authentication flow
4. Device receives authorization without needing user input

### Primary Specifications

| Specification | Sections | Purpose |
|---------------|----------|---------|
| RFC 8628 | Complete (§1-7) | Device Authorization Grant specification |
| RFC 6749 | §3.2 (token endpoint), §5.1, §5.2 | OAuth 2.0 core - token responses, errors |
| OAuth 2.0 Security BCP | draft-ietf-oauth-security-topics-27 §5.3 | Device flow security considerations |
| RFC 8414 | §2 | Authorization Server Metadata (discovery) |

---

## 2. Flow Diagram

### Complete Sequence (6 Steps)

```
┌──────────────────┐                    ┌──────────────────┐                    ┌──────────────────┐
│                  │                    │                  │                    │                  │
│  Device          │                    │  Authorization   │                    │  User's          │
│  (Smart TV,      │                    │  Server          │                    │  Secondary       │
│   CLI, etc.)     │                    │                  │                    │  Device          │
│                  │                    │                  │                    │  (Phone/Laptop)  │
└────────┬─────────┘                    └────────┬─────────┘                    └────────┬─────────┘
         │                                       │                                       │
         │  ╔═════════════════════════════════════════════════════════════════════╗      │
         │          STEP 1: Device Authorization Request                          │      │
         │  ╚═════════════════════════════════════════════════════════════════════╝      │
         │                                       │                                       │
         │  (1) POST /device_authorization       │                                       │
         │      client_id=...                    │                                       │
         │      &scope=...                       │                                       │
         │  ─────────────────────────────────►   │                                       │
         │                                       │                                       │
         │  ╔═════════════════════════════════════════════════════════════════════╗      │
         │          STEP 2: Device Authorization Response                         │      │
         │  ╚═════════════════════════════════════════════════════════════════════╝      │
         │                                       │                                       │
         │  (2) Response with:                   │                                       │
         │      {                                │                                       │
         │        "device_code": "GmRh...w",     │                                       │
         │        "user_code": "WDJB-MJHT",      │                                       │
         │        "verification_uri":            │                                       │
         │          "https://example.com/device",│                                       │
         │        "verification_uri_complete":   │                                       │
         │          "https://example.com/device?│                                       │
         │           user_code=WDJB-MJHT",       │                                       │
         │        "expires_in": 900,             │                                       │
         │        "interval": 5                  │                                       │
         │      }                                │                                       │
         │  ◄─────────────────────────────────   │                                       │
         │                                       │                                       │
         │  ╔═════════════════════════════════════════════════════════════════════╗      │
         │          STEP 3: User Instruction Display                              │      │
         │  ╚═════════════════════════════════════════════════════════════════════╝      │
         │                                       │                                       │
         │  (3) Device displays:                 │                                       │
         │      ┌─────────────────────────────┐  │                                       │
         │      │ Visit: example.com/device   │  │                                       │
         │      │ Enter code: WDJB-MJHT       │  │                                       │
         │      │ [QR Code]                   │  │                                       │
         │      └─────────────────────────────┘  │                                       │
         │                                       │                                       │
         │  ╔═════════════════════════════════════════════════════════════════════╗      │
         │          STEP 4: User Authorization (on secondary device)              │      │
         │  ╚═════════════════════════════════════════════════════════════════════╝      │
         │                                       │                                       │
         │                                       │  (4a) User navigates to              │
         │                                       │       verification_uri               │
         │                                       │  ◄─────────────────────────────────  │
         │                                       │       GET /device                     │
         │                                       │                                       │
         │                                       │  (4b) User enters user_code           │
         │                                       │       or uses verification_uri_       │
         │                                       │       complete (auto-filled)          │
         │                                       │  ◄─────────────────────────────────  │
         │                                       │       POST /device (code=WDJB-MJHT)   │
         │                                       │                                       │
         │                                       │  (4c) User authenticates              │
         │                                       │       (if not already logged in)      │
         │                                       │  ◄───────────────────────────────►   │
         │                                       │                                       │
         │                                       │  (4d) User authorizes device          │
         │                                       │       (consent screen)                │
         │                                       │  ◄───────────────────────────────►   │
         │                                       │                                       │
         │  ╔═════════════════════════════════════════════════════════════════════╗      │
         │          STEP 5: Device Token Request (Polling)                        │      │
         │  ╚═════════════════════════════════════════════════════════════════════╝      │
         │                                       │                                       │
         │  (5a) POST /token [every 5 seconds]   │                                       │
         │       grant_type=urn:ietf:params:     │                                       │
         │         oauth:grant-type:device_code  │                                       │
         │       &device_code=GmRh...w           │                                       │
         │       &client_id=...                  │                                       │
         │  ─────────────────────────────────►   │                                       │
         │                                       │                                       │
         │  (5b) Response while pending:         │                                       │
         │       HTTP 400                        │                                       │
         │       {                               │                                       │
         │         "error": "authorization_      │                                       │
         │                   pending"            │                                       │
         │       }                               │                                       │
         │  ◄─────────────────────────────────   │                                       │
         │                                       │                                       │
         │  [Device continues polling...]        │                                       │
         │                                       │                                       │
         │  (5c) If polling too fast:            │                                       │
         │       HTTP 400                        │                                       │
         │       {                               │                                       │
         │         "error": "slow_down"          │                                       │
         │       }                               │                                       │
         │  ◄─────────────────────────────────   │                                       │
         │                                       │                                       │
         │  [Device increases interval by 5s]    │                                       │
         │                                       │                                       │
         │  ╔═════════════════════════════════════════════════════════════════════╗      │
         │          STEP 6: Token Response (Success)                              │      │
         │  ╚═════════════════════════════════════════════════════════════════════╝      │
         │                                       │                                       │
         │  (6) After user completes authz:      │                                       │
         │      HTTP 200                         │                                       │
         │      {                                │                                       │
         │        "access_token": "eyJhb...",    │                                       │
         │        "token_type": "Bearer",        │                                       │
         │        "expires_in": 3600,            │                                       │
         │        "refresh_token": "tGzv...",    │                                       │
         │        "scope": "..."                 │                                       │
         │      }                                │                                       │
         │  ◄─────────────────────────────────   │                                       │
         │                                       │                                       │
         │  [Device now has access token]        │                                       │
         │                                       │                                       │
         ▼                                       ▼                                       ▼
```

### Flow Summary Table

| Step | Actor | Action | Spec Reference |
|------|-------|--------|----------------|
| 1. Device Authorization Request | Device → AuthZ Server | Request device_code and user_code | RFC 8628 §3.1 |
| 2. Device Authorization Response | AuthZ Server → Device | Return codes and verification URI | RFC 8628 §3.2 |
| 3. User Instruction Display | Device → User | Display user_code and URI | RFC 8628 §3.3 |
| 4. User Authorization | User → AuthZ Server (via secondary device) | Enter code, authenticate, authorize | Implementation-specific |
| 5. Device Token Request (Polling) | Device → AuthZ Server | Poll for token until ready | RFC 8628 §3.4 |
| 6. Token Response | AuthZ Server → Device | Return access token (and optionally refresh token) | RFC 8628 §3.5 |

### Key Characteristics

| Aspect | Device Flow | Authorization Code Flow |
|--------|-------------|------------------------|
| **User input on device** | Not required | Required (redirect, authentication) |
| **Secondary device required** | Yes (phone, laptop) | No (same device) |
| **Browser required** | Not on primary device | Yes |
| **Polling** | Yes (device polls for token) | No (redirect delivers code) |
| **User code** | Yes (short code displayed) | No |
| **Suitable for** | Input-constrained devices | Devices with browsers |

---

## 3. Device Authorization Request (RFC 8628 §3.1)

The device initiates the flow by requesting a device code from the authorization server's device authorization endpoint.

### HTTP Method and Endpoint

```http
POST /device_authorization HTTP/1.1
Host: authorization-server.example.com
Content-Type: application/x-www-form-urlencoded
```

**Endpoint discovery:** The `device_authorization_endpoint` is advertised in the authorization server's metadata (RFC 8414 §2, RFC 8628 §4).

### Parameters

| Parameter | RFC 2119 | Description | Spec Reference |
|-----------|----------|-------------|----------------|
| `client_id` | **REQUIRED** | The client identifier issued to the device | RFC 8628 §3.1 |
| `scope` | OPTIONAL | Space-delimited list of requested scopes | RFC 8628 §3.1, RFC 6749 §3.3 |

### Client Authentication

**Per RFC 8628 §3.1:** Confidential clients SHOULD authenticate, but public clients MUST NOT authenticate.

| Client Type | Authentication | Rationale |
|-------------|---------------|-----------|
| Public client (most device flow clients) | MUST NOT authenticate | Cannot securely store credentials |
| Confidential client | SHOULD authenticate | Has secure credential storage |

**Authentication methods (if applicable):**
- `client_secret_basic` (HTTP Basic Auth)
- `client_secret_post` (POST body)
- `private_key_jwt` (JWT assertion)

### Example Device Authorization Request

#### Public Client (Typical)

```http
POST /device_authorization HTTP/1.1
Host: authorization-server.example.com
Content-Type: application/x-www-form-urlencoded

client_id=a17c21ed
&scope=profile%20email
```

#### Confidential Client (Less Common)

```http
POST /device_authorization HTTP/1.1
Host: authorization-server.example.com
Authorization: Basic YTE3YzIxZWQ6c2VjcmV0
Content-Type: application/x-www-form-urlencoded

scope=profile%20email
```

### Parameter Validation Rules

| Rule | Validation | Spec Reference |
|------|------------|----------------|
| client_id | MUST be valid registered client | RFC 8628 §3.1 |
| scope | If present, MUST be valid space-delimited list | RFC 6749 §3.3 |
| Client type | Public clients MUST NOT include client authentication | RFC 8628 §3.1 |
| HTTPS | Endpoint MUST use TLS | RFC 8628 §5.4 |

---

## 4. Device Authorization Response (RFC 8628 §3.2)

Upon receiving a valid device authorization request, the authorization server generates a device code, user code, and verification URI.

### Success Response Parameters

| Parameter | RFC 2119 | Description | Spec Reference |
|-----------|----------|-------------|----------------|
| `device_code` | **REQUIRED** | Device verification code - opaque string that identifies authorization request | RFC 8628 §3.2 |
| `user_code` | **REQUIRED** | End-user verification code - displayed to user for manual entry | RFC 8628 §3.2 |
| `verification_uri` | **REQUIRED** | End-user verification URI - user navigates here on secondary device | RFC 8628 §3.2 |
| `verification_uri_complete` | OPTIONAL | Verification URI with user_code embedded - enables one-click/QR code | RFC 8628 §3.2 |
| `expires_in` | **REQUIRED** | Lifetime in seconds of device_code and user_code | RFC 8628 §3.2 |
| `interval` | OPTIONAL | Minimum interval in seconds between polling requests (default: 5) | RFC 8628 §3.2 |

### user_code Format Requirements (RFC 8628 §6.1)

The `user_code` is designed to be manually entered by users, so it has special requirements:

| Requirement | Recommendation | Rationale | Spec Reference |
|-------------|---------------|-----------|----------------|
| **Length** | SHOULD be short (8 characters) | Easier for users to type | RFC 8628 §6.1 |
| **Case sensitivity** | SHOULD be case-insensitive | Reduces user errors | RFC 8628 §6.1 |
| **Character set** | SHOULD use distinguishable characters | Prevents confusion (no O/0, I/1/l) | RFC 8628 §6.1 |
| **Entropy** | MUST have sufficient entropy | Prevent brute force (min 20 bits) | RFC 8628 §5.2 |
| **Format** | MAY include separators for readability | "WDJB-MJHT" easier than "WDJBMJHT" | RFC 8628 §6.1 |

**Recommended character set:** A-Z excluding I, O, Q, Z (to avoid confusion with 1, 0, 0, 2)
**Example good user_codes:** 
- `WDJB-MJHT` (with separator)
- `BDWP-HQKM`
- `PCKS-MTJX`

**Example bad user_codes:**
- `0O1Il` (confusing characters)
- `a7Bx` (too short, only 4 chars)
- `VERYLONGCODEHERE` (too long)

### device_code Requirements

| Requirement | Value | Spec Reference |
|-------------|-------|----------------|
| Uniqueness | MUST be unique per request | RFC 8628 §3.2 |
| Opacity | SHOULD be opaque (unpredictable) | Security best practice |
| Entropy | MUST have sufficient entropy to prevent guessing | RFC 8628 §5.6 |
| Binding | MUST be bound to client_id and requested scope | RFC 8628 §3.4 |

### verification_uri Requirements

| Requirement | Description | Spec Reference |
|-------------|-------------|----------------|
| HTTPS | MUST use HTTPS | RFC 8628 §5.4 |
| Short and memorable | SHOULD be short enough to display clearly | RFC 8628 §6.1 |
| Stable | SHOULD be stable (not change frequently) | RFC 8628 §6.1 |
| Human-friendly | SHOULD be easy to type (e.g., example.com/device, not example.com/oauth2/device-authorization-verification-endpoint) | RFC 8628 §6.1 |

### Example Success Response

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "device_code": "GmRhmhcxhwAzkoEqiMEg_DnyEysNkuNhszIySk9eS",
  "user_code": "WDJB-MJHT",
  "verification_uri": "https://example.com/device",
  "verification_uri_complete": "https://example.com/device?user_code=WDJB-MJHT",
  "expires_in": 900,
  "interval": 5
}
```

### Error Response Parameters (RFC 8628 §3.3)

Device authorization endpoint errors use standard OAuth 2.0 error responses (RFC 6749 §5.2).

| Parameter | RFC 2119 | Description |
|-----------|----------|-------------|
| `error` | **REQUIRED** | Error code from table below |
| `error_description` | OPTIONAL | Human-readable error description |
| `error_uri` | OPTIONAL | URI to error documentation |

### Error Codes

| Error Code | Description | Common Causes |
|------------|-------------|---------------|
| `invalid_request` | Request is malformed or missing required parameters | Missing client_id |
| `invalid_client` | Client authentication failed (for confidential clients) | Wrong client credentials |
| `invalid_scope` | Requested scope is invalid, unknown, or malformed | Typo in scope, unregistered scope |
| `unauthorized_client` | Client not authorized to use device authorization grant | Client not registered for device flow |
| `access_denied` | Authorization server denied the request | Policy violation, client disabled |

### Example Error Response

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json
Cache-Control: no-store

{
  "error": "invalid_scope",
  "error_description": "The requested scope 'admin' is not authorized for this client"
}
```

---

## 5. User Interaction Flow

After receiving the device authorization response, the device must display information to the user and wait for them to complete authorization on a secondary device.

### 5.1 Device Display Requirements (RFC 8628 §3.3)

The device MUST display the following information clearly to the user:

| Information | Display Requirement | Spec Reference |
|-------------|-------------------|----------------|
| `verification_uri` | MUST be prominently displayed, easy to read | RFC 8628 §3.3 |
| `user_code` | MUST be prominently displayed, easy to read and enter | RFC 8628 §3.3 |
| Instructions | SHOULD provide clear instructions | RFC 8628 §6.1 |
| `expires_in` | SHOULD display time remaining (countdown) | RFC 8628 §6.1 |

#### Minimal Display Example

```
┌──────────────────────────────────────┐
│  To activate this device:            │
│                                      │
│  1. Visit: example.com/device        │
│  2. Enter code: WDJB-MJHT            │
│                                      │
│  Expires in: 14:23                   │
└──────────────────────────────────────┘
```

#### Enhanced Display Example (with QR code)

```
┌──────────────────────────────────────┐
│  To activate this device:            │
│                                      │
│  Visit: example.com/device           │
│  Enter code: WDJB-MJHT               │
│                                      │
│  Or scan this QR code:               │
│  ┌─────────────────┐                 │
│  │  █▀▀▀▀▀█ ██ █   │                 │
│  │  █ ███ █ ▀█▀█   │                 │
│  │  █ ▀▀▀ █ █ ▀█   │                 │
│  │  ▀▀▀▀▀▀▀ ▀ ▀ ▀   │                 │
│  └─────────────────┘                 │
│                                      │
│  Expires in: 14:23                   │
└──────────────────────────────────────┘
```

### 5.2 User Experience on Secondary Device

The user navigates to the verification URI on a device with a web browser (phone, laptop, tablet).

#### User Journey

```
1. User visits verification_uri
   → Presented with user_code entry form
   
2. User enters user_code (or arrives via verification_uri_complete)
   → Server validates user_code
   
3. If not authenticated: User authenticates
   → Standard login flow (username/password, SSO, etc.)
   
4. Server displays authorization request
   → Device information (if available)
   → Requested scopes
   → "Authorize" / "Deny" buttons
   
5. User makes authorization decision
   → Server records decision
   → Device's polling requests now succeed/fail accordingly
```

#### User Code Entry Page

```html
<!-- Example verification page -->
<!DOCTYPE html>
<html>
<head>
  <title>Device Activation</title>
</head>
<body>
  <h1>Activate Your Device</h1>
  <form method="POST" action="/device/verify">
    <label for="user_code">Enter the code displayed on your device:</label>
    <input 
      type="text" 
      id="user_code" 
      name="user_code" 
      placeholder="XXXX-XXXX"
      autocomplete="off"
      autocapitalize="characters"
      pattern="[A-Z0-9-]+"
      required
    />
    <button type="submit">Continue</button>
  </form>
</body>
</html>
```

#### Authorization Consent Screen

```html
<!-- Example authorization page (after user_code validated and user authenticated) -->
<!DOCTYPE html>
<html>
<head>
  <title>Authorize Device</title>
</head>
<body>
  <h1>Authorize Device Access</h1>
  
  <div class="device-info">
    <p><strong>Device:</strong> Smart TV</p>
    <p><strong>Application:</strong> YouTube TV</p>
  </div>
  
  <div class="scope-info">
    <p>This application is requesting access to:</p>
    <ul>
      <li>View your profile information</li>
      <li>View your email address</li>
    </ul>
  </div>
  
  <form method="POST" action="/device/authorize">
    <input type="hidden" name="user_code" value="WDJB-MJHT" />
    <button type="submit" name="action" value="allow">Authorize</button>
    <button type="submit" name="action" value="deny">Deny</button>
  </form>
</body>
</html>
```

### 5.3 UX Best Practices (RFC 8628 §6.1)

| Practice | Recommendation | Benefit |
|----------|---------------|---------|
| **QR Code** | Display QR code for verification_uri_complete | One-scan activation, no typing |
| **Large text** | Use large, readable fonts for user_code | Visible from distance (TV on wall) |
| **Copy support** | Make user_code selectable/copyable on device (if possible) | Easier input on secondary device |
| **Countdown timer** | Show time remaining for expires_in | User knows urgency |
| **Auto-formatting** | Accept user_code with or without separators | "WDJBMJHT" and "WDJB-MJHT" both work |
| **Progress indication** | Show device is polling/waiting | User knows device is active |
| **Success notification** | Display when authorization complete | Clear feedback |
| **Error handling** | Show clear errors if code expires or is denied | Actionable information |

### 5.4 verification_uri_complete Usage

When provided, `verification_uri_complete` embeds the `user_code` in the URL:

```
verification_uri_complete: https://example.com/device?user_code=WDJB-MJHT
```

**Benefits:**
- One-click activation (user doesn't need to type code)
- Perfect for QR codes
- Better mobile UX

**Implementation:**
- Server SHOULD pre-populate user_code field when this URL is accessed
- User still needs to authenticate and authorize
- Reduces one step in the flow

---

## 6. Device Access Token Request (RFC 8628 §3.4)

After displaying the user_code and verification_uri to the user, the device begins polling the token endpoint to determine when the user has completed authorization.

### Polling Mechanism

**Core principle:** The device MUST poll at the interval specified in the device authorization response (or 5 seconds if not specified).

```
Time 0s:  POST /token → {"error": "authorization_pending"}
Time 5s:  POST /token → {"error": "authorization_pending"}
Time 10s: POST /token → {"error": "authorization_pending"}
Time 15s: POST /token → {"error": "authorization_pending"}
Time 20s: POST /token → {"access_token": "...", ...}  ← Success!
```

### Polling Requirements (RFC 8628 §3.5)

| Requirement | Description | Spec Reference |
|-------------|-------------|----------------|
| **Minimum interval** | Device MUST wait at least `interval` seconds between requests | RFC 8628 §3.5 |
| **Respect slow_down** | If server returns `slow_down`, device MUST add 5 seconds to interval | RFC 8628 §3.5 |
| **Continue on pending** | Device MUST continue polling on `authorization_pending` | RFC 8628 §3.5 |
| **Stop on error** | Device MUST stop polling on non-pending errors | RFC 8628 §3.5 |
| **Expiration** | Device SHOULD display timeout when device_code expires | RFC 8628 §6.1 |

### HTTP Method and Endpoint

```http
POST /token HTTP/1.1
Host: authorization-server.example.com
Content-Type: application/x-www-form-urlencoded
```

### Parameters

| Parameter | RFC 2119 | Description | Spec Reference |
|-----------|----------|-------------|----------------|
| `grant_type` | **REQUIRED** | MUST be `urn:ietf:params:oauth:grant-type:device_code` | RFC 8628 §3.4 |
| `device_code` | **REQUIRED** | Device verification code from authorization response | RFC 8628 §3.4 |
| `client_id` | **REQUIRED** | Client identifier (for public clients) | RFC 8628 §3.4 |

### Client Authentication

| Client Type | Authentication | Spec Reference |
|-------------|---------------|----------------|
| Public client | Include `client_id` in POST body | RFC 8628 §3.4 |
| Confidential client | Authenticate via HTTP Basic, JWT, etc. | RFC 8628 §3.4 |

### Example Token Request (Public Client)

```http
POST /token HTTP/1.1
Host: authorization-server.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Adevice_code
&device_code=GmRhmhcxhwAzkoEqiMEg_DnyEysNkuNhszIySk9eS
&client_id=a17c21ed
```

### Example Token Request (Confidential Client)

```http
POST /token HTTP/1.1
Host: authorization-server.example.com
Authorization: Basic YTE3YzIxZWQ6c2VjcmV0
Content-Type: application/x-www-form-urlencoded

grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Adevice_code
&device_code=GmRhmhcxhwAzkoEqiMEg_DnyEysNkuNhszIySk9eS
```

---

## 7. Device Access Token Response (RFC 8628 §3.5)

The authorization server responds to token requests with one of several possible outcomes depending on the authorization state.

### 7.1 Success Response (RFC 8628 §3.5)

When the user has successfully completed authorization, the server returns an access token.

#### Success Response Parameters

| Parameter | RFC 2119 | Description | Spec Reference |
|-----------|----------|-------------|----------------|
| `access_token` | **REQUIRED** | The access token issued by the authorization server | RFC 6749 §5.1 |
| `token_type` | **REQUIRED** | Token type (typically `Bearer`) | RFC 6749 §5.1 |
| `expires_in` | RECOMMENDED | Access token lifetime in seconds | RFC 6749 §5.1 |
| `refresh_token` | OPTIONAL | Refresh token for obtaining new access tokens | RFC 6749 §5.1 |
| `scope` | OPTIONAL* | Scope of the access token | RFC 6749 §5.1 |

> \* `scope` is OPTIONAL if identical to requested scope, REQUIRED if different.

#### Example Success Response

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "tGzv3JOkF0XG5Qx2TlKWIA",
  "scope": "profile email"
}
```

### 7.2 Pending Response (RFC 8628 §3.5)

While the user has not yet completed (or declined) authorization, the server returns `authorization_pending`.

#### Pending Response

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json
Cache-Control: no-store

{
  "error": "authorization_pending"
}
```

**Meaning:** The authorization request is still pending - the user hasn't completed the flow yet.

**Device action:** Continue polling at the specified interval.

### 7.3 Slow Down Response (RFC 8628 §3.5)

If the device is polling too frequently, the server returns `slow_down`.

#### Slow Down Response

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json
Cache-Control: no-store

{
  "error": "slow_down"
}
```

**Meaning:** The device is polling too fast.

**Device action:** 
1. Add 5 seconds to the current polling interval
2. Continue polling with the new, slower interval
3. Do NOT reset to original interval

**Example:**
```
Original interval: 5 seconds
Device receives slow_down at 10s
New interval: 5 + 5 = 10 seconds
Device continues polling every 10 seconds
```

### 7.4 Error Responses (RFC 8628 §3.5)

Other errors indicate the authorization flow has failed and the device MUST stop polling.

#### Error Response Parameters

| Parameter | RFC 2119 | Description |
|-----------|----------|-------------|
| `error` | **REQUIRED** | Error code from table below |
| `error_description` | OPTIONAL | Human-readable error description |
| `error_uri` | OPTIONAL | URI to error documentation |

#### Error Codes

| Error Code | Description | Device Action | Spec Reference |
|------------|-------------|---------------|----------------|
| `authorization_pending` | Authorization is pending (user hasn't completed) | Continue polling | RFC 8628 §3.5 |
| `slow_down` | Device polling too frequently | Increase interval by 5s, continue polling | RFC 8628 §3.5 |
| `access_denied` | User denied the authorization request | Stop polling, notify user | RFC 8628 §3.5 |
| `expired_token` | The device_code has expired | Stop polling, restart flow | RFC 8628 §3.5 |
| `invalid_grant` | device_code is invalid, already used, or revoked | Stop polling | RFC 6749 §5.2 |
| `invalid_client` | Client authentication failed | Stop polling, check credentials | RFC 6749 §5.2 |
| `invalid_request` | Request malformed or missing parameters | Stop polling, fix request | RFC 6749 §5.2 |
| `unsupported_grant_type` | Server doesn't support device flow | Stop polling | RFC 6749 §5.2 |

#### Example Error: access_denied

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json
Cache-Control: no-store

{
  "error": "access_denied",
  "error_description": "The user denied the authorization request"
}
```

#### Example Error: expired_token

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json
Cache-Control: no-store

{
  "error": "expired_token",
  "error_description": "The device code has expired. Please restart the authorization process."
}
```

### 7.5 Response Handling Decision Tree

```
Device receives token response
         │
         ├─── HTTP 200 OK?
         │    ├─── YES → Success! Extract access_token, stop polling
         │    └─── NO → Check error code
         │
         └─── error = "authorization_pending"?
              ├─── YES → Continue polling at current interval
              │
              └─── error = "slow_down"?
                   ├─── YES → Increase interval by 5s, continue polling
                   │
                   └─── error = "access_denied"?
                        ├─── YES → Stop polling, user denied authorization
                        │
                        └─── error = "expired_token"?
                             ├─── YES → Stop polling, device_code expired
                             │
                             └─── Other error → Stop polling, handle error
```

### 7.6 Polling Implementation Example

```javascript
class DeviceFlowClient {
  constructor(tokenEndpoint, deviceCode, clientId, interval = 5) {
    this.tokenEndpoint = tokenEndpoint;
    this.deviceCode = deviceCode;
    this.clientId = clientId;
    this.interval = interval;
    this.polling = false;
  }
  
  async poll() {
    this.polling = true;
    
    while (this.polling) {
      // Wait for interval
      await this.sleep(this.interval * 1000);
      
      try {
        const response = await fetch(this.tokenEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
            device_code: this.deviceCode,
            client_id: this.clientId
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          // Success - we have tokens!
          this.polling = false;
          return {
            success: true,
            tokens: data
          };
        }
        
        // Handle errors
        switch (data.error) {
          case 'authorization_pending':
            // Continue polling
            console.log('Authorization pending, continuing to poll...');
            break;
            
          case 'slow_down':
            // Increase interval by 5 seconds
            this.interval += 5;
            console.log(`Polling too fast. New interval: ${this.interval}s`);
            break;
            
          case 'access_denied':
            // User denied - stop polling
            this.polling = false;
            return {
              success: false,
              error: 'access_denied',
              message: 'User denied authorization'
            };
            
          case 'expired_token':
            // Device code expired - stop polling
            this.polling = false;
            return {
              success: false,
              error: 'expired_token',
              message: 'Device code expired. Please restart.'
            };
            
          default:
            // Other error - stop polling
            this.polling = false;
            return {
              success: false,
              error: data.error,
              message: data.error_description || 'Authorization failed'
            };
        }
      } catch (error) {
        console.error('Polling error:', error);
        // Network error - continue polling
      }
    }
  }
  
  stopPolling() {
    this.polling = false;
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage
const client = new DeviceFlowClient(
  'https://auth.example.com/token',
  deviceCode,
  'a17c21ed',
  5  // Initial interval
);

const result = await client.poll();
if (result.success) {
  console.log('Access token:', result.tokens.access_token);
} else {
  console.error('Authorization failed:', result.message);
}
```

---

## 8. Security Threat Model for Device Flow

### 8.1 Device Code Phishing (RFC 8628 §5.1)

#### Attack Description

An attacker tricks users into entering their credentials or authorizing the attacker's device by displaying a fake verification_uri or user_code.

**Attack variants:**
- **Fake verification URI:** Attacker's device displays attacker-controlled URI
- **Man-in-the-middle display:** Attacker intercepts display to show fake codes
- **Social engineering:** Attacker convinces user to visit malicious site with similar user_code

#### Attack Sequence

```
1. Victim initiates device flow on legitimate device
   Device displays: example.com/device, code: WDJB-MJHT

2. Attacker's malicious device displays:
   "Visit: attacker.com/device"  (looks similar to example.com)
   "Enter code: PXKM-NGHT"       (attacker's code)

3. Victim visits attacker.com and enters their credentials

4. Attacker captures victim's credentials

OR

3. Victim authorizes attacker's device code
4. Attacker's device receives access token for victim's account
```

#### Exploit Demonstration (Vulnerable Mode: `DISPLAY_FAKE_VERIFICATION_URI`)

```javascript
// Tool demonstrates: Malicious device showing fake URI

// Legitimate device should display:
const legitimateDisplay = {
  verification_uri: 'https://auth.example.com/device',
  user_code: 'WDJB-MJHT'
};

// Attacker's device displays:
const maliciousDisplay = {
  verification_uri: 'https://auth-examp1e.com/device',  // Typosquatting
  user_code: 'PXKM-NGHT'  // Attacker's actual code
};

// Or more subtle: display correct URI but incorrect code
const subtleAttack = {
  verification_uri: 'https://auth.example.com/device',  // Correct
  user_code: 'PXKM-NGHT'  // Attacker's code - victim authorizes wrong device
};
```

#### Mitigation

| Mitigation | Description | Spec Reference |
|------------|-------------|----------------|
| HTTPS for verification_uri | MUST use HTTPS for verification URIs | RFC 8628 §5.4 |
| TLS certificate validation | Devices SHOULD validate TLS certificates | Security best practice |
| User education | Inform users to verify verification_uri domain | RFC 8628 §6.1 |
| Trusted display | Ensure device display cannot be tampered with | Security best practice |
| Brand indicators | Use organization branding on verification page | Security best practice |
| Domain highlighting | Highlight domain in verification_uri display | Security best practice |

#### Validation Requirements

| Check | Implementation | Spec Reference |
|-------|----------------|----------------|
| HTTPS enforcement | Reject HTTP verification_uri | RFC 8628 §5.4 |
| Domain validation | Verify verification_uri domain matches expected | Security best practice |
| TLS validation | Validate certificate chain | Security best practice |

---

### 8.2 User Code Brute Force (RFC 8628 §5.2)

#### Attack Description

Attacker attempts to guess valid user_codes by trying multiple combinations at the verification endpoint.

**Attack vectors:**
- **Sequential guessing:** Try all possible codes in order
- **Dictionary attack:** Try common patterns first
- **Distributed attack:** Use multiple IPs to bypass rate limiting

#### Attack Sequence

```
1. Attacker observes that user_codes are 8 characters from set A-Z (26^8 = ~200 billion combinations)

2. BUT server uses short code like 4 chars: 26^4 = 456,976 combinations
   Or weak entropy: sequential codes, common patterns

3. Attacker automates guessing:
   POST /device → user_code=AAAA → Invalid
   POST /device → user_code=AAAB → Invalid
   POST /device → user_code=AAAC → Invalid
   ...
   POST /device → user_code=WDJB → Valid! (match found)

4. Attacker quickly completes authorization before legitimate user

5. Attacker's authorization completes, device receives attacker's token
```

#### Exploit Demonstration (Vulnerable Mode: `SHORT_USER_CODE`)

```javascript
// Tool demonstrates: Insufficient user_code entropy

// Vulnerable: Only 4 characters, 26^4 = ~457k combinations
const weakUserCode = 'ABCD';  // ❌ WRONG - easily brute forced

// Vulnerable: Only digits, 10^6 = 1 million combinations
const weakNumericCode = '123456';  // ❌ WRONG

// Vulnerable: Sequential or predictable
const predictableCode = 'AAAA';  // ❌ WRONG

// Attack simulation:
async function bruteForceUserCode(verificationEndpoint) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  // Generate all 4-character combinations
  for (let a = 0; a < charset.length; a++) {
    for (let b = 0; b < charset.length; b++) {
      for (let c = 0; c < charset.length; c++) {
        for (let d = 0; d < charset.length; d++) {
          const code = charset[a] + charset[b] + charset[c] + charset[d];
          
          const response = await fetch(verificationEndpoint, {
            method: 'POST',
            body: new URLSearchParams({ user_code: code })
          });
          
          if (response.ok) {
            console.log(`Valid code found: ${code}`);
            return code;
          }
        }
      }
    }
  }
}
```

#### Mitigation

| Mitigation | Description | Spec Reference |
|------------|-------------|----------------|
| Sufficient entropy | user_code SHOULD have minimum 20 bits entropy (~1 million combinations) | RFC 8628 §5.2 |
| Length requirement | Use at least 8 characters | RFC 8628 §6.1 |
| Character set | Use full character set (not just digits) | RFC 8628 §6.1 |
| Rate limiting | Limit verification attempts per IP/session | RFC 8628 §5.2 |
| Short expiration | device_code and user_code SHOULD expire quickly (10-15 min) | RFC 8628 §5.6 |
| Attempt throttling | Exponential backoff after failed attempts | Security best practice |

#### Validation Requirements

| Check | Implementation | Spec Reference |
|-------|----------------|----------------|
| Minimum entropy | Enforce minimum 20 bits entropy | RFC 8628 §5.2 |
| Length validation | user_code length ≥ 8 characters | RFC 8628 §6.1 |
| Rate limit | Max 10 invalid attempts per IP per minute | RFC 8628 §5.2 |
| Expiration | user_code expires within 10-15 minutes | RFC 8628 §5.6 |

---

### 8.3 Polling Abuse / Denial of Service (RFC 8628 §5.3)

#### Attack Description

Malicious or buggy devices poll the token endpoint too frequently, causing excessive load on the authorization server.

**Attack variants:**
- **Ignoring interval:** Device polls as fast as possible (DoS)
- **Distributed polling:** Multiple devices poll simultaneously
- **Never stopping:** Device continues polling after errors
- **Retry storms:** Multiple devices retry synchronously after outage

#### Attack Sequence

```
1. Device receives authorization response with interval=5

2. Malicious device ignores interval:
   Time 0s:   POST /token → {"error": "authorization_pending"}
   Time 0.1s: POST /token → {"error": "authorization_pending"}
   Time 0.2s: POST /token → {"error": "authorization_pending"}
   Time 0.3s: POST /token → {"error": "authorization_pending"}
   ... (100 requests per second)

3. Authorization server becomes overloaded

4. Legitimate devices experience slow responses or failures
```

#### Exploit Demonstration (Vulnerable Mode: `IGNORE_POLLING_INTERVAL`)

```javascript
// Tool demonstrates: Ignoring polling interval

// Correct implementation (respects interval):
async function pollCorrectly(interval) {
  while (polling) {
    await sleep(interval * 1000);  // Wait for interval
    const response = await requestToken();
    if (response.error === 'slow_down') {
      interval += 5;
    }
  }
}

// Vulnerable implementation (ignores interval):
async function pollIncorrectly() {
  while (polling) {
    // No delay! Poll as fast as possible
    const response = await requestToken();
    // Ignore slow_down errors
    if (response.error === 'slow_down') {
      // Should increase interval, but doesn't
      console.log('Slow down received, but ignoring...');
    }
  }
}

// Attack scenario:
const attackDevices = [];
for (let i = 0; i < 1000; i++) {
  attackDevices.push(pollIncorrectly());
}
// 1000 devices polling continuously = DoS
```

#### Mitigation

| Mitigation | Description | Spec Reference |
|------------|-------------|----------------|
| **slow_down errors** | Server MUST enforce polling rate, return slow_down | RFC 8628 §3.5 |
| Rate limiting | Limit requests per device_code | RFC 8628 §5.3 |
| Interval enforcement | Reject requests that arrive too quickly | RFC 8628 §3.5 |
| Per-client limits | Limit active device_codes per client | Security best practice |
| Exponential backoff | Implement server-side exponential backoff | Security best practice |
| Monitoring & alerting | Alert on polling abuse patterns | Security best practice |

#### Validation Requirements

| Check | Implementation | Spec Reference |
|-------|----------------|----------------|
| Minimum interval | Enforce minimum interval between requests | RFC 8628 §3.5 |
| slow_down response | Return slow_down for too-frequent requests | RFC 8628 §3.5 |
| Rate limits | Max 1 request per interval per device_code | RFC 8628 §3.5 |
| Total request limit | Max 200 requests per device_code lifetime | Security best practice |

---

### 8.4 Device Code Interception (RFC 8628 §5.4)

#### Attack Description

Network attacker intercepts the device_code during transmission and uses it to obtain access tokens.

**Attack vectors:**
- **HTTP interception:** Device authorization endpoint uses HTTP instead of HTTPS
- **Man-in-the-middle:** Active attacker intercepts HTTPS (cert pinning bypass)
- **Network logging:** device_code logged in proxy/firewall logs

#### Attack Sequence

```
1. Device sends authorization request over HTTP:
   POST http://auth.example.com/device_authorization

2. Network attacker intercepts request/response:
   Response: {"device_code": "GmRhmhcxhwAz...", "user_code": "WDJB-MJHT"}

3. Attacker captures device_code

4. User completes authorization (legitimate flow)

5. Attacker polls token endpoint with stolen device_code:
   POST /token
   device_code=GmRhmhcxhwAz...

6. Attacker receives access token meant for legitimate device
```

#### Exploit Demonstration (Vulnerable Mode: `HTTP_DEVICE_ENDPOINT`)

```javascript
// Tool demonstrates: HTTP endpoint vulnerability

// Vulnerable: HTTP endpoint
const httpEndpoint = 'http://auth.example.com/device_authorization';

// Attacker intercepts:
function interceptDeviceCode(networkTraffic) {
  const match = networkTraffic.match(/"device_code":"([^"]+)"/);
  if (match) {
    const stolenDeviceCode = match[1];
    console.log('Intercepted device_code:', stolenDeviceCode);
    return stolenDeviceCode;
  }
}

// Attacker uses stolen device_code:
async function stealTokens(stolenDeviceCode, clientId) {
  // Wait for user to complete authorization
  await waitForAuthorization();
  
  // Request tokens with stolen device_code
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      device_code: stolenDeviceCode,
      client_id: clientId
    })
  });
  
  const tokens = await response.json();
  // Attacker now has victim's access token
  return tokens.access_token;
}
```

#### Mitigation

| Mitigation | Description | Spec Reference |
|------------|-------------|----------------|
| **HTTPS REQUIRED** | ALL endpoints MUST use HTTPS | RFC 8628 §5.4 |
| TLS 1.2+ | Use TLS 1.2 or later | Security best practice |
| Certificate validation | Devices MUST validate server certificates | Security best practice |
| HSTS | Use HTTP Strict Transport Security | Security best practice |
| No logging of device_code | Do not log device_code in plain text | Security best practice |

#### Validation Requirements

| Check | Implementation | Spec Reference |
|-------|----------------|----------------|
| HTTPS enforcement | Reject HTTP connections to device endpoint | RFC 8628 §5.4 |
| TLS version | Minimum TLS 1.2 | Security best practice |
| Certificate validity | Valid, trusted certificate | Security best practice |

---

### 8.5 Scope Escalation via Hidden Scope (Security BCP §5.3)

#### Attack Description

Device requests sensitive scopes but doesn't display them to user during authorization, tricking user into granting excessive permissions.

**Attack variants:**
- **Hidden scope request:** Request sensitive scopes but don't display to user
- **Misleading descriptions:** Display vague descriptions instead of actual scopes
- **Post-authorization scope expansion:** Change scopes after user authorizes

#### Attack Sequence

```
1. Malicious device requests broad scopes:
   POST /device_authorization
   scope=profile email contacts photos admin

2. Device displays to user:
   "Authorize YouTube TV"
   (No mention of admin scope!)

3. User navigates to verification URI and sees:
   "This app requests access to:"
   - Profile
   - Email  
   - Contacts
   - Photos
   - **Full administrative access**  ← User sees this

4a. Secure server: Displays ALL scopes clearly
    User sees "admin" scope and denies

4b. Vulnerable server: Doesn't display scopes or displays misleadingly
    User doesn't realize extent of access and approves

5. Device receives token with excessive privileges
```

#### Exploit Demonstration (Vulnerable Mode: `HIDE_SCOPE_FROM_USER`)

```javascript
// Tool demonstrates: Not displaying requested scope to user

// Device requests:
const requestedScopes = 'profile email contacts photos admin';

// Device displays to user:
const displayedInfo = `
  To activate YouTube TV:
  Visit: example.com/device
  Code: WDJB-MJHT
  
  This will allow access to your account.
  (No specific scope information displayed)
`;

// Vulnerability: User doesn't know about "admin" scope
// User authorizes thinking it's just basic profile access
```

#### Mitigation

| Mitigation | Description | Spec Reference |
|------------|-------------|----------------|
| **Display all scopes** | Authorization page MUST display ALL requested scopes | Security BCP §5.3 |
| Clear descriptions | Use clear, non-technical scope descriptions | Security BCP §5.3 |
| Scope grouping | Group related scopes for clarity | Security best practice |
| Highlight sensitive scopes | Emphasize privileged/sensitive scopes | Security best practice |
| Scope approval | Allow users to approve/deny individual scopes | Security best practice |

#### Validation Requirements

| Check | Implementation | Spec Reference |
|-------|----------------|----------------|
| Scope display | Verification page MUST display all requested scopes | Security BCP §5.3 |
| Scope binding | Token scopes MUST match authorized scopes exactly | RFC 6749 §5.1 |
| Scope downgrade only | Authorization server MAY grant fewer scopes, never more | RFC 6749 §5.1 |

---

## 9. Implementation Requirements Checklist

### 9.1 Authorization Server MUST Implement

| # | Requirement | Spec Reference | Vuln Mode |
|---|-------------|----------------|-----------|
| AS1 | Provide device_authorization_endpoint | RFC 8628 §4 | - |
| AS2 | Generate user_code with minimum 20 bits entropy | RFC 8628 §5.2 | `SHORT_USER_CODE` |
| AS3 | Generate unique, unpredictable device_code | RFC 8628 §3.2 | - |
| AS4 | Include interval in device authorization response (default 5) | RFC 8628 §3.2 | - |
| AS5 | Return slow_down error for too-frequent polling | RFC 8628 §3.5 | `IGNORE_POLLING_INTERVAL` |
| AS6 | Enforce device_code and user_code expiration (RECOMMENDED 10-15 min) | RFC 8628 §5.6 | - |
| AS7 | Return authorization_pending while user hasn't completed | RFC 8628 §3.5 | - |
| AS8 | Support verification_uri_complete (RECOMMENDED) | RFC 8628 §3.2 | - |
| AS9 | Display all requested scopes on authorization page | Security BCP §5.3 | `HIDE_SCOPE_FROM_USER` |
| AS10 | Use HTTPS for all endpoints | RFC 8628 §5.4 | `HTTP_DEVICE_ENDPOINT` |
| AS11 | Implement rate limiting on user_code verification | RFC 8628 §5.2 | - |
| AS12 | Bind device_code to client_id and scope | RFC 8628 §3.4 | - |
| AS13 | Accept case-insensitive user_code (SHOULD) | RFC 8628 §6.1 | - |
| AS14 | Make user_code short (RECOMMENDED 8 chars) | RFC 8628 §6.1 | - |

### 9.2 Device MUST Implement

| # | Requirement | Spec Reference | Vuln Mode |
|---|-------------|----------------|-----------|
| D1 | Display verification_uri prominently | RFC 8628 §3.3 | - |
| D2 | Display user_code prominently | RFC 8628 §3.3 | - |
| D3 | Poll at interval specified in authorization response | RFC 8628 §3.5 | `IGNORE_POLLING_INTERVAL` |
| D4 | Increase interval by 5s when receiving slow_down | RFC 8628 §3.5 | `IGNORE_POLLING_INTERVAL` |
| D5 | Continue polling on authorization_pending | RFC 8628 §3.5 | - |
| D6 | Stop polling on terminal errors (access_denied, expired_token) | RFC 8628 §3.5 | - |
| D7 | Handle token response (store access_token, refresh_token) | RFC 6749 §5.1 | - |
| D8 | Display time remaining for device_code expiration (SHOULD) | RFC 8628 §6.1 | - |
| D9 | Display QR code for verification_uri_complete (RECOMMENDED) | RFC 8628 §6.1 | - |
| D10 | Validate TLS certificate of authorization server | RFC 8628 §5.4 | - |

### 9.3 User Verification Page MUST Implement

| # | Requirement | Spec Reference | Vuln Mode |
|---|-------------|----------------|-----------|
| V1 | Accept user_code input | RFC 8628 §3.3 | - |
| V2 | Validate user_code format and existence | RFC 8628 §3.3 | - |
| V3 | Display all requested scopes | Security BCP §5.3 | `HIDE_SCOPE_FROM_USER` |
| V4 | Handle verification_uri_complete (auto-fill user_code) | RFC 8628 §3.2 | - |
| V5 | Require authentication if user not logged in | RFC 8628 §3.3 | - |
| V6 | Implement rate limiting on user_code attempts | RFC 8628 §5.2 | - |
| V7 | Display device information (if available) | Security best practice | - |

### 9.4 SHOULD Implement (Recommended)

| # | Requirement | Spec Reference |
|---|-------------|----------------|
| R1 | Provide verification_uri_complete in authorization response | RFC 8628 §3.2 |
| R2 | Device displays QR code for verification_uri_complete | RFC 8628 §6.1 |
| R3 | Use distinguishable characters in user_code (avoid O/0, I/1) | RFC 8628 §6.1 |
| R4 | Implement jitter in polling to avoid thundering herd | Security best practice |
| R5 | Monitor and alert on polling abuse patterns | Security best practice |
| R6 | Show countdown timer for device_code expiration | RFC 8628 §6.1 |
| R7 | Make user_code copy-pasteable (where possible) | RFC 8628 §6.1 |
| R8 | Use short, memorable verification_uri domain | RFC 8628 §6.1 |

### 9.5 Common Implementation Pitfalls

| Pitfall | Problem | Consequence | Spec Reference |
|---------|---------|-------------|----------------|
| Short user_code | Only 4-6 characters | Easy to brute force | RFC 8628 §5.2 |
| Weak entropy | Sequential or predictable codes | Security vulnerability | RFC 8628 §5.2 |
| No rate limiting | Unlimited verification attempts | Brute force attacks succeed | RFC 8628 §5.2 |
| Ignoring slow_down | Device doesn't respect slow_down error | DoS attack on authorization server | RFC 8628 §3.5 |
| Long expiration | device_code valid for hours | Extended attack window | RFC 8628 §5.6 |
| HTTP endpoints | Not using HTTPS | Device_code interception | RFC 8628 §5.4 |
| Not displaying scopes | User doesn't see requested permissions | Unauthorized scope grants | Security BCP §5.3 |
| Polling after error | Continuing to poll after terminal errors | Resource waste | RFC 8628 §3.5 |
| No interval respect | Polling faster than interval | Server overload | RFC 8628 §3.5 |
| Confusing user_code | Using similar characters (O/0, I/l) | User input errors | RFC 8628 §6.1 |

---

## 10. Validation Rules (Exact Spec Requirements)

### 10.1 device_code Validation (RFC 8628 §5.6)

```
FUNCTION validateDeviceCode(deviceCode, request):
    storedRequest = deviceCodeStore.get(deviceCode)
    
    # device_code exists
    IF storedRequest IS null:
        RETURN error("invalid_grant", "Invalid or expired device code")
    
    # device_code not expired
    IF storedRequest.expiresAt < currentTime():
        deviceCodeStore.delete(deviceCode)
        RETURN error("expired_token", "Device code has expired")
    
    # device_code bound to client
    IF storedRequest.clientId != request.clientId:
        RETURN error("invalid_grant", "Device code not issued to this client")
    
    # Check authorization status
    IF storedRequest.status == "pending":
        RETURN error("authorization_pending")
    
    IF storedRequest.status == "denied":
        deviceCodeStore.delete(deviceCode)
        RETURN error("access_denied", "User denied the authorization request")
    
    IF storedRequest.status == "authorized":
        # Authorization complete - issue token
        RETURN issueToken(storedRequest)
    
    RETURN error("invalid_grant")
```

**device_code requirements:**

| Requirement | Value | Spec Reference |
|-------------|-------|----------------|
| Expiration | MUST expire (RECOMMENDED 10-15 minutes) | RFC 8628 §5.6 |
| Uniqueness | MUST be unique per authorization request | RFC 8628 §3.2 |
| Entropy | MUST have sufficient entropy to prevent guessing | RFC 8628 §5.6 |
| Client binding | MUST be bound to client_id | RFC 8628 §3.4 |
| Scope binding | MUST be bound to requested scope | RFC 8628 §3.4 |

### 10.2 user_code Validation (RFC 8628 §6.1)

```
FUNCTION validateUserCode(userCode):
    # Normalize (case-insensitive)
    normalizedCode = userCode.toUpperCase().replace("-", "")
    
    # Check length
    IF length(normalizedCode) < 8:
        RETURN error("invalid_request", "User code too short")
    
    # Check character set (if enforced)
    IF NOT matches(normalizedCode, /^[A-Z0-9]+$/):
        RETURN error("invalid_request", "User code contains invalid characters")
    
    # Look up device authorization request
    request = userCodeStore.get(normalizedCode)
    
    IF request IS null:
        logFailedAttempt(userCode)
        checkRateLimit()
        RETURN error("invalid_request", "Invalid user code")
    
    # Check expiration
    IF request.expiresAt < currentTime():
        userCodeStore.delete(normalizedCode)
        RETURN error("expired_token", "User code has expired")
    
    RETURN request
```

**user_code requirements:**

| Requirement | Value | Spec Reference |
|-------------|-------|----------------|
| Length | SHOULD be short (8 characters recommended) | RFC 8628 §6.1 |
| Case sensitivity | SHOULD be case-insensitive | RFC 8628 §6.1 |
| Character set | SHOULD use distinguishable characters | RFC 8628 §6.1 |
| Entropy | MUST have minimum 20 bits entropy (~1 million combinations) | RFC 8628 §5.2 |
| Expiration | MUST expire (same as device_code, 10-15 min) | RFC 8628 §5.6 |

### 10.3 Polling Interval Validation (RFC 8628 §3.5)

```
FUNCTION validatePollingInterval(deviceCode, lastRequestTime, interval):
    timeSinceLastRequest = currentTime() - lastRequestTime
    
    # Check if device is polling too fast
    IF timeSinceLastRequest < interval:
        # Return slow_down error
        # Server SHOULD increase required interval
        newInterval = interval + 5
        updateDeviceCodeInterval(deviceCode, newInterval)
        RETURN error("slow_down")
    
    RETURN valid

FUNCTION handleTokenRequest(deviceCode, clientId):
    request = deviceCodeStore.get(deviceCode)
    
    # Validate device_code (expiration, binding, etc.)
    validation = validateDeviceCode(deviceCode, clientId)
    IF NOT validation.valid:
        RETURN validation.error
    
    # Check polling interval
    intervalCheck = validatePollingInterval(
        deviceCode, 
        request.lastPolledAt,
        request.interval
    )
    
    IF intervalCheck == error("slow_down"):
        RETURN slow_down_response
    
    # Update last polled time
    request.lastPolledAt = currentTime()
    deviceCodeStore.update(request)
    
    # Check authorization status
    IF request.status == "pending":
        RETURN authorization_pending_response
    
    # ... continue with token issuance
```

**Polling requirements:**

| Requirement | Value | Spec Reference |
|-------------|-------|----------------|
| Minimum interval | MUST wait at least `interval` seconds between requests | RFC 8628 §3.5 |
| Default interval | 5 seconds if not specified | RFC 8628 §3.2 |
| slow_down handling | Device MUST increase interval by 5s on slow_down | RFC 8628 §3.5 |
| Rate limiting | Server MAY enforce rate limits beyond interval | RFC 8628 §5.3 |

### 10.4 HTTPS Enforcement (RFC 8628 §5.4)

```
FUNCTION enforceHTTPS(request):
    # Device authorization endpoint
    IF request.url.scheme != "https":
        IF NOT (request.url.hostname == "localhost" OR 
                request.url.hostname == "127.0.0.1"):
            RETURN error("invalid_request", "HTTPS required")
    
    # Token endpoint
    IF request.url.scheme != "https":
        IF NOT (request.url.hostname == "localhost" OR 
                request.url.hostname == "127.0.0.1"):
            RETURN error("invalid_request", "HTTPS required")
    
    # Verification URI
    IF verification_uri.scheme != "https":
        RETURN error("invalid_request", "verification_uri must use HTTPS")
    
    RETURN valid
```

**HTTPS requirements:**

| Requirement | Value | Spec Reference |
|-------------|-------|----------------|
| Device authorization endpoint | MUST use HTTPS | RFC 8628 §5.4 |
| Token endpoint | MUST use HTTPS | RFC 8628 §5.4 |
| verification_uri | MUST use HTTPS | RFC 8628 §5.4 |
| Exception | MAY use HTTP for localhost development | RFC 8628 §5.4 |
| TLS version | SHOULD use TLS 1.2 or higher | Security best practice |

---

## 11. Discovery Integration (RFC 8628 §4)

The device authorization endpoint is advertised in the authorization server's metadata, allowing clients to discover it dynamically.

### Authorization Server Metadata

**Per RFC 8628 §4:** Authorization servers supporting device flow MUST include the `device_authorization_endpoint` in their metadata.

### Metadata Parameter

| Parameter | RFC 2119 | Description | Spec Reference |
|-----------|----------|-------------|----------------|
| `device_authorization_endpoint` | **REQUIRED** | URL of the device authorization endpoint | RFC 8628 §4 |

### Discovery Document Location

**Well-Known URI (RFC 8414 §3):**
```
https://authorization-server.example.com/.well-known/oauth-authorization-server
```

### Example Discovery Document

```json
{
  "issuer": "https://authorization-server.example.com",
  "authorization_endpoint": "https://authorization-server.example.com/authorize",
  "token_endpoint": "https://authorization-server.example.com/token",
  "device_authorization_endpoint": "https://authorization-server.example.com/device_authorization",
  "jwks_uri": "https://authorization-server.example.com/jwks",
  "response_types_supported": ["code", "token"],
  "grant_types_supported": [
    "authorization_code",
    "client_credentials",
    "refresh_token",
    "urn:ietf:params:oauth:grant-type:device_code"
  ],
  "token_endpoint_auth_methods_supported": [
    "client_secret_basic",
    "client_secret_post",
    "private_key_jwt"
  ],
  "scopes_supported": ["profile", "email", "openid"],
  "code_challenge_methods_supported": ["S256", "plain"]
}
```

### Client Discovery Implementation

```javascript
class DeviceFlowClient {
  async discoverEndpoints(issuer) {
    const metadataUrl = `${issuer}/.well-known/oauth-authorization-server`;
    
    const response = await fetch(metadataUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch authorization server metadata');
    }
    
    const metadata = await response.json();
    
    // Validate required endpoints
    if (!metadata.device_authorization_endpoint) {
      throw new Error('Server does not support device authorization grant');
    }
    
    if (!metadata.token_endpoint) {
      throw new Error('Server metadata missing token_endpoint');
    }
    
    return {
      deviceAuthorizationEndpoint: metadata.device_authorization_endpoint,
      tokenEndpoint: metadata.token_endpoint,
      grantTypesSupported: metadata.grant_types_supported || []
    };
  }
  
  async initiateDeviceFlow(issuer, clientId, scope) {
    // Discover endpoints
    const endpoints = await this.discoverEndpoints(issuer);
    
    // Check device flow support
    if (!endpoints.grantTypesSupported.includes('urn:ietf:params:oauth:grant-type:device_code')) {
      throw new Error('Device authorization grant not supported');
    }
    
    // Start device authorization
    const response = await fetch(endpoints.deviceAuthorizationEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: clientId,
        scope: scope
      })
    });
    
    return await response.json();
  }
}
```

---

## 12. Example Scenarios

### 12.1 Happy Path: Smart TV Authentication

**Scenario:** User wants to activate YouTube TV on their smart TV.

#### Step-by-Step Flow

**Step 1: TV requests device authorization**

```http
POST /device_authorization HTTP/1.1
Host: accounts.google.com
Content-Type: application/x-www-form-urlencoded

client_id=youtube-tv-client
&scope=https://www.googleapis.com/auth/youtube
```

**Response:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "device_code": "4/4-GMMhmHCXhWEzkobqIHGG_EnNYYsAkukHspeYUk9E8",
  "user_code": "GMMQ-DGKC",
  "verification_uri": "https://google.com/device",
  "verification_uri_complete": "https://google.com/device?user_code=GMMQ-DGKC",
  "expires_in": 900,
  "interval": 5
}
```

**Step 2: TV displays code to user**

```
┌───────────────────────────────────────┐
│  YouTube TV                           │
│                                       │
│  To activate this device:             │
│                                       │
│  1. On your phone or computer,        │
│     visit: google.com/device          │
│                                       │
│  2. Enter this code:                  │
│     ┌─────────────┐                   │
│     │  GMMQ-DGKC  │                   │
│     └─────────────┘                   │
│                                       │
│  Or scan this QR code:                │
│  [QR code here]                       │
│                                       │
│  Expires in: 14:52                    │
└───────────────────────────────────────┘
```

**Step 3: TV starts polling**

```javascript
// TV implementation
async function pollForToken() {
  const pollInterval = 5; // seconds
  let currentInterval = pollInterval;
  
  while (true) {
    await sleep(currentInterval * 1000);
    
    const response = await fetch('https://accounts.google.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        device_code: '4/4-GMMhmHCXhWEzkobqIHGG_EnNYYsAkukHspeYUk9E8',
        client_id: 'youtube-tv-client'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Success!
      displaySuccess();
      storeTokens(data.access_token, data.refresh_token);
      return data;
    }
    
    if (data.error === 'authorization_pending') {
      // User hasn't completed yet, continue polling
      continue;
    }
    
    if (data.error === 'slow_down') {
      // Polling too fast, slow down
      currentInterval += 5;
      continue;
    }
    
    // Other error - stop
    displayError(data.error_description);
    return null;
  }
}
```

**Step 4: User completes authorization on phone**

1. User opens phone, navigates to google.com/device
2. User enters code "GMMQ-DGKC"
3. Google prompts for authentication (if not logged in)
4. Google displays consent screen:
   ```
   YouTube TV wants to access your Google Account
   
   This will allow YouTube TV to:
   • View your YouTube subscriptions
   • Create and manage YouTube playlists
   
   [Deny] [Allow]
   ```
5. User clicks "Allow"

**Step 5: TV receives token**

Next polling request succeeds:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "access_token": "ya29.a0AfH6SMBx...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "1//0gJn1VB...",
  "scope": "https://www.googleapis.com/auth/youtube"
}
```

**Step 6: TV displays success**

```
┌───────────────────────────────────────┐
│  YouTube TV                           │
│                                       │
│  ✓ Successfully activated!            │
│                                       │
│  Welcome, John Smith                  │
│                                       │
│  [Continue to YouTube TV]             │
└───────────────────────────────────────┘
```

---

### 12.2 Slow Down Scenario: Device Polling Too Fast

**Scenario:** Device has a bug and polls every 2 seconds instead of respecting the 5-second interval.

#### Sequence

**Time 0s:** Device authorization response
```json
{
  "device_code": "abc123",
  "user_code": "WDJB-MJHT",
  "interval": 5
}
```

**Time 2s:** Device polls (too early!)
```http
POST /token
device_code=abc123
```

```http
HTTP/1.1 400 Bad Request

{
  "error": "slow_down"
}
```

**Server action:** Increase required interval to 10 seconds for this device_code.

**Time 4s:** Device polls again (still too fast!)
```http
POST /token
device_code=abc123
```

```http
HTTP/1.1 400 Bad Request

{
  "error": "slow_down"
}
```

**Server action:** Increase required interval to 15 seconds.

**Time 19s:** Device finally waits long enough
```http
POST /token
device_code=abc123
```

```http
HTTP/1.1 400 Bad Request

{
  "error": "authorization_pending"
}
```

**Correct client behavior:**

```javascript
let interval = initialInterval; // 5 seconds

while (polling) {
  await sleep(interval * 1000);
  
  const response = await pollToken();
  
  if (response.error === 'slow_down') {
    interval += 5; // Increase by 5 seconds
    console.log(`Received slow_down. New interval: ${interval}s`);
  }
}
```

---

### 12.3 Expiration Scenario: User Takes Too Long

**Scenario:** User gets distracted and doesn't complete authorization within the expiration window.

#### Sequence

**Time 0:00:** Device receives authorization response
```json
{
  "device_code": "xyz789",
  "user_code": "BDWP-HQKM",
  "expires_in": 900  // 15 minutes
}
```

**Time 0:00 - 14:50:** Device polls every 5 seconds, receives `authorization_pending`

**Time 14:55:** User finally visits verification URI and enters code

**Time 15:05:** User completes authorization (16 minutes elapsed - past expiration!)

**Time 15:05:** Device's next poll:
```http
HTTP/1.1 400 Bad Request

{
  "error": "expired_token",
  "error_description": "The device code has expired"
}
```

**Device displays:**
```
┌───────────────────────────────────────┐
│  ⚠️  Activation Code Expired          │
│                                       │
│  The activation code has expired.     │
│  Please try again.                    │
│                                       │
│  [Restart]                            │
└───────────────────────────────────────┘
```

**Best practice:** Device should display countdown to show user urgency:

```
┌───────────────────────────────────────┐
│  To activate this device:             │
│                                       │
│  Visit: google.com/device             │
│  Code: BDWP-HQKM                      │
│                                       │
│  ⏱️ Time remaining: 5:42              │
└───────────────────────────────────────┘
```

---

### 12.4 Denial Scenario: User Rejects Authorization

**Scenario:** User explicitly denies authorization request.

#### Sequence

**Step 1:** Device displays activation code

**Step 2:** User visits verification URI, authenticates

**Step 3:** Authorization consent screen:
```
Spotify wants to access your account

This will allow Spotify to:
• View your profile
• Access your playlists
• Stream music

[Deny] [Allow]
```

**Step 4:** User clicks "Deny"

**Step 5:** Device's next poll:
```http
HTTP/1.1 400 Bad Request

{
  "error": "access_denied",
  "error_description": "The user denied the authorization request"
}
```

**Device stops polling and displays:**
```
┌───────────────────────────────────────┐
│  ❌ Activation Declined                │
│                                       │
│  You declined to authorize this       │
│  device. To use Spotify, you must     │
│  authorize device access.             │
│                                       │
│  [Try Again] [Exit]                   │
└───────────────────────────────────────┘
```

---

### 12.5 Real-World Implementation: GitHub CLI Authentication

**Scenario:** Developer authenticates GitHub CLI using device flow.

#### Command Line Experience

```bash
$ gh auth login

? What account do you want to log into? GitHub.com
? What is your preferred protocol for Git operations? HTTPS
? Authenticate Git with your GitHub credentials? Yes
? How would you like to authenticate GitHub CLI? Login with a web browser

! First copy your one-time code: BDWP-HQKM
Press Enter to open github.com in your browser...
```

**After user presses Enter:**

```bash
✓ Authentication complete.
- gh config set -h github.com git_protocol https
✓ Configured git protocol
✓ Logged in as octocat
```

#### Behind the Scenes

**1. CLI requests device code:**
```http
POST /login/device/code HTTP/1.1
Host: github.com
Content-Type: application/x-www-form-urlencoded

client_id=1234567890abcdef
```

**2. GitHub responds:**
```json
{
  "device_code": "3584d83297...",
  "user_code": "BDWP-HQKM",
  "verification_uri": "https://github.com/login/device",
  "expires_in": 899,
  "interval": 5
}
```

**3. CLI displays code and opens browser**

**4. CLI polls:**
```http
POST /login/oauth/access_token HTTP/1.1
Host: github.com

client_id=1234567890abcdef
&device_code=3584d83297...
&grant_type=urn:ietf:params:oauth:grant-type:device_code
```

**5. User authorizes in browser**

**6. Next poll succeeds:**
```json
{
  "access_token": "gho_16C7e42F292c6912E7710c838347Ae178B4a",
  "token_type": "bearer",
  "scope": "repo,gist"
}
```

**CLI benefits from device flow:**
- No need to paste tokens manually
- Works in SSH sessions
- No embedded browser required
- Clean UX with automatic browser opening

---

### 12.6 Real-World Implementation: Roku Streaming Device

**Scenario:** User activates HBO Max on Roku device.

#### On-Screen Experience

**Initial screen:**
```
┌────────────────────────────────────┐
│  HBO Max                           │
│                                    │
│  To activate HBO Max on this       │
│  Roku device:                      │
│                                    │
│  1. Go to: hbomax.com/tvsignin     │
│                                    │
│  2. Enter this code:               │
│     ╔═══════════╗                  │
│     ║  JB3-HN8  ║                  │
│     ╚═══════════╝                  │
│                                    │
│  Code expires in: 15:00            │
│                                    │
│  [Refresh Code]                    │
└────────────────────────────────────┘
```

**After 30 seconds (still pending):**
```
┌────────────────────────────────────┐
│  HBO Max                           │
│                                    │
│  Waiting for activation...         │
│                                    │
│  Code: JB3-HN8                     │
│  Link: hbomax.com/tvsignin         │
│                                    │
│  [◐ Checking...]                   │
│                                    │
│  Code expires in: 14:30            │
└────────────────────────────────────┘
```

**After user completes authorization:**
```
┌────────────────────────────────────┐
│  HBO Max                           │
│                                    │
│  ✓ Activation Successful!          │
│                                    │
│  Welcome back!                     │
│                                    │
│  Loading your profile...           │
│                                    │
└────────────────────────────────────┘
```

**Mobile web experience (hbomax.com/tvsignin):**

1. **Code entry:**
   ```
   Activate Your Device
   
   Enter the code shown on your TV:
   [____-____]
   
   [Activate]
   ```

2. **Login (if needed):**
   ```
   Sign In to HBO Max
   
   Email: [________________]
   Password: [________________]
   
   [Sign In]
   ```

3. **Confirmation:**
   ```
   Success!
   
   Your Roku device has been activated.
   You can now start streaming on your TV.
   
   [Start Watching]
   ```

---

## Appendix A: RFC Cross-Reference Index

| Topic | RFC 8628 | RFC 6749 | Security BCP |
|-------|----------|----------|--------------|
| Device authorization request | §3.1 | — | — |
| Device authorization response | §3.2 | — | — |
| User interaction | §3.3 | — | — |
| Token request (polling) | §3.4 | §3.2 | — |
| Token response | §3.5 | §5.1, §5.2 | — |
| Discovery | §4 | — | — |
| Security considerations | §5 | — | §5.3 |
| User code format | §6.1 | — | — |
| Device code phishing | §5.1 | — | — |
| User code brute force | §5.2 | — | — |
| Polling abuse | §5.3 | — | — |
| HTTPS requirement | §5.4 | — | — |
| Device code expiration | §5.6 | — | — |

---

## Appendix B: Vulnerability Mode Quick Reference

| Toggle | Attack Demonstrated | Spec Violation | Document Section |
|--------|-------------------|----------------|------------------|
| `DISPLAY_FAKE_VERIFICATION_URI` | Phishing via fake verification URI | RFC 8628 §5.1 | §8.1 |
| `SHORT_USER_CODE` | User code brute force | RFC 8628 §5.2, §6.1 | §8.2 |
| `IGNORE_POLLING_INTERVAL` | Polling abuse / DoS | RFC 8628 §3.5, §5.3 | §8.3 |
| `HTTP_DEVICE_ENDPOINT` | Device code interception | RFC 8628 §5.4 | §8.4 |
| `HIDE_SCOPE_FROM_USER` | Scope escalation | Security BCP §5.3 | §8.5 |

---

## Appendix C: Flow Comparison Matrix

| Aspect | Device Flow | Authorization Code | Client Credentials |
|--------|-------------|-------------------|-------------------|
| **Use case** | Input-constrained devices | Web/mobile apps | Service-to-service |
| **User involved** | Yes (on separate device) | Yes (on same device) | No |
| **Browser required** | Not on primary device | Yes | No |
| **Client secret** | Optional (typically public) | Optional (PKCE replaces) | Required |
| **User code** | Yes | No | No |
| **Polling** | Yes | No | No |
| **Redirect** | No | Yes | No |
| **Complexity** | Medium | High | Low |
| **Security** | Good (with HTTPS + entropy) | Best (with PKCE) | Good (for M2M) |

---

*Document Version: 1.0.0*
*Last Updated: December 4, 2025*
*Specification References: RFC 8628 (complete), RFC 6749 §3.2, §5.1, §5.2, RFC 8414 §2, Security BCP draft-ietf-oauth-security-topics-27 §5.3*

---

> *"The device flow is a bit like asking someone to order pizza for you because your hands are full. It works surprisingly well, as long as you trust the person and they don't order pineapple."*
