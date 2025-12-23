# OAuth2/OIDC Specification Reference Library

## Navigation Guide -- START HERE

> *"The story so far: In the beginning, authentication was created. This made a lot of people very confused and has been widely regarded as a bad move."*
> -- Loosely adapted from Douglas Adams

---

## Project Purpose

This documentation library supports an OAuth2/OIDC debugging and learning tool designed for security professionals who need to diagnose production issues with real identity providers (and occasionally their own sanity). The tool visualizes OAuth2/OIDC flows, parameters, and data exchanges in real-time, making the invisible visible and the incomprehensible merely confusing. Most notably, it includes **vulnerability mode toggles** that demonstrate how various attacks work and more importantly how the protocols defend against them, because nothing teaches security quite like watching an attack fail spectacularly.

A pre-configured KeyCloak deployment is included for demonstration purposes, ensuring you can break things safely before breaking things expensively.

---

## Document Organization

### Directory Structure

```
/specs
|-- 00-NAVIGATION-START-HERE.md          <- You are here. Don't panic.
|-- /flows
|   |-- authorization-code-flow-with-pkce.md
|   |-- client-credentials-flow.md
|   |-- device-authorization-flow.md
|   |-- refresh-token-flow.md
|   |-- deprecated-implicit-flow.md
|   `-- deprecated-resource-owner-password-flow.md
|-- /tokens
|   |-- access-tokens.md
|   |-- refresh-tokens.md
|   |-- id-tokens-oidc.md
|   |-- jwt-structure-and-validation.md
|   `-- token-introspection-and-revocation.md
|-- /security
|   |-- oauth2-oidc-threat-model.md
|   |-- oauth2-oidc-threat-model-INDEX.md
|   |-- oauth2-oidc-threat-model-part2.md
|   |-- oauth2-oidc-threat-model-part3.md
|   |-- pkce-implementation.md
|   |-- pkce-implementation-part2.md
|   |-- state-parameter-and-csrf.md
|   |-- state-parameter-and-csrf-part2.md
|   |-- redirect-uri-validation.md
|   |-- redirect-uri-validation-part2.md
|   |-- token-binding-dpop-mtls.md
|   |-- token-binding-dpop-mtls-part2.md
|   |-- token-binding-dpop-mtls-part3.md
|   |-- security-best-current-practice.md
|   |-- security-best-current-practice-part2.md
|   `-- security-best-current-practice-part3.md
|-- /discovery
|   |-- well-known-configuration.md
|   |-- jwks-and-key-rotation.md
|   `-- authorization-server-metadata.md
|-- /extensions
|   |-- pushed-authorization-requests.md
|   |-- rich-authorization-requests.md              [TODO: Not yet created]
|   |-- token-exchange.md                           [TODO: Not yet created]
|   `-- jwt-secured-authorization-requests.md       [TODO: Not yet created]
|-- /keycloak
|   |-- keycloak-deployment.md
|   |-- keycloak-realm-configuration.md
|   |-- keycloak-security-and-vulnerability-mode.md
|   |-- keycloak-integration-requirements.md
|   `-- keycloak-testing-and-troubleshooting.md
|-- /vulnerability-mode
|   |-- vulnerability-mode-overview.md
|   |-- vulnerability-mode-authorization.md
|   |-- vulnerability-mode-token.md
|   `-- vulnerability-mode-implementation.md
`-- /visualization
    |-- visualization-overview.md
    |-- visualization-flow-sequences.md
    |-- visualization-security-features.md
    |-- visualization-debugging-features.md
    |-- visualization-ui-ux-requirements.md
    `-- visualization-implementation-guide.md

```
### Document Categories with RFC/Spec References

#### Flows (`/flows`)

| Document | Description | Primary Specifications |
|----------|-------------|------------------------|
| `authorization-code-flow-with-pkce.md` | The One True Flow(TM) for most applications | RFC 6749 Section 4.1, RFC 7636, OAuth 2.1 Section 4.1 |
| `client-credentials-flow.md` | Machine-to-machine authentication | RFC 6749 Section 4.4, OAuth 2.1 Section 4.2 |
| `device-authorization-flow.md` | For devices with limited input (TVs, CLIs) | RFC 8628 |
| `refresh-token-flow.md` | Token renewal without user interaction | RFC 6749 Section 6, OAuth 2.1 Section 6 |
| `deprecated-implicit-flow.md` | Historical reference; DO NOT USE in new implementations | RFC 6749 Section 4.2 (deprecated by Security BCP) |
| `deprecated-resource-owner-password-flow.md` | Historical reference; DO NOT USE ever, really | RFC 6749 Section 4.3 (deprecated by Security BCP) |

#### Tokens (`/tokens`)

| Document | Description | Primary Specifications |
|----------|-------------|------------------------|
| `access-tokens.md` | Bearer tokens and their usage | RFC 6749 Section 1.4, RFC 6750, OAuth 2.1 Section 1.4 |
| `refresh-tokens.md` | Long-lived tokens for obtaining new access tokens | RFC 6749 Section 1.5, OAuth 2.1 Section 1.5 |
| `id-tokens-oidc.md` | OpenID Connect identity assertions | OIDC Core Section 2, Section 3.1.3.7 |
| `jwt-structure-and-validation.md` | JWT format, claims, and signature verification | RFC 7519, RFC 7515, RFC 7516 |
| `token-introspection-and-revocation.md` | Server-side token validation and invalidation | RFC 7662, RFC 7009 |

#### Security (`/security`)

| Document | Parts | Description | Primary Specifications |
|----------|-------|-------------|------------------------|
| `oauth2-oidc-threat-model.md` | Base + INDEX + part2 + part3 | Comprehensive threat analysis | RFC 6819, Security BCP Section 4 |
| `pkce-implementation.md` | Base + part2 | Proof Key for Code Exchange details | RFC 7636 |
| `state-parameter-and-csrf.md` | Base + part2 | CSRF protection mechanisms | RFC 6749 Section 10.12, Security BCP Section 4.7 |
| `redirect-uri-validation.md` | Base + part2 | URI matching and open redirect prevention | RFC 6749 Section 3.1.2, Security BCP Section 4.1 |
| `token-binding-dpop-mtls.md` | Base + part2 + part3 | Sender-constrained tokens | RFC 9449 (DPoP), RFC 8705 (mTLS) |
| `security-best-current-practice.md` | Base + part2 + part3 | Current security recommendations | draft-ietf-oauth-security-topics (Security BCP) |

**Note on Multi-Part Documents**: Several security documents are split across multiple files due to their comprehensive nature. The base file contains the primary content; subsequent parts continue the specification. The `oauth2-oidc-threat-model-INDEX.md` provides navigation within that document set.

#### Discovery (`/discovery`)

| Document | Description | Primary Specifications |
|----------|-------------|------------------------|
| `well-known-configuration.md` | OIDC Discovery endpoint | OIDC Discovery Section 4, RFC 8414 |
| `jwks-and-key-rotation.md` | JSON Web Key Sets and rotation strategies | RFC 7517, RFC 7518, OIDC Core Section 10 |
| `authorization-server-metadata.md` | OAuth 2.0 server capability advertisement | RFC 8414 |

#### Extensions (`/extensions`)

| Document | Status | Description | Primary Specifications |
|----------|--------|-------------|------------------------|
| `pushed-authorization-requests.md` | ✅ Complete | PAR for confidential request submission | RFC 9126 |
| `rich-authorization-requests.md` | 🚧 TODO | Fine-grained authorization | RFC 9396 |
| `token-exchange.md` | 🚧 TODO | Token transformation and delegation | RFC 8693 |
| `jwt-secured-authorization-requests.md` | 🚧 TODO | JAR for signed/encrypted requests | RFC 9101 |

#### KeyCloak Integration (`/keycloak`)

| Document | Description | Notes |
|----------|-------------|-------|
| `keycloak-deployment.md` | Container setup, networking, initial configuration | Docker/Podman deployment |
| `keycloak-realm-configuration.md` | Realm, client, and user setup | KeyCloak 22.x+ reference |
| `keycloak-security-and-vulnerability-mode.md` | Security settings and vuln mode integration | Maps vuln toggles to KeyCloak settings |
| `keycloak-integration-requirements.md` | API integration and programmatic configuration | REST API and admin CLI |
| `keycloak-testing-and-troubleshooting.md` | Verification procedures and common issues | Debug workflows |

#### Vulnerability Mode (`/vulnerability-mode`)

| Document | Description | Notes |
|----------|-------------|-------|
| `vulnerability-mode-overview.md` | Architecture, toggle categories, safety controls | Start here for vuln mode |
| `vulnerability-mode-authorization.md` | Authorization endpoint vulnerabilities | PKCE, state, redirect URI toggles |
| `vulnerability-mode-token.md` | Token endpoint and token handling vulnerabilities | Token validation, binding toggles |
| `vulnerability-mode-implementation.md` | Implementation guide for vuln mode system | Technical implementation details |

#### Visualization (`/visualization`)

| Document | Description | Notes |
|----------|-------------|-------|
| `visualization-overview.md` | Architecture, design principles, component overview | Start here for visualization |
| `visualization-flow-sequences.md` | Step-by-step flow visualization requirements | Per-flow display specifications |
| `visualization-security-features.md` | Security indicator and warning displays | Vuln mode visual feedback |
| `visualization-debugging-features.md` | Debug panel, request/response inspection | Developer-focused features |
| `visualization-ui-ux-requirements.md` | Layout, interaction patterns, accessibility | UI/UX specifications |
| `visualization-implementation-guide.md` | Technical implementation guidance | Component architecture |

---

## Quick Reference Tables

### OAuth2/OIDC Flows -> RFC Sections

| Flow | RFC 6749 | OAuth 2.1 | Other Specs | OIDC Core |
|------|----------|-----------|-------------|-----------|
| Authorization Code | Section 4.1 | Section 4.1 | RFC 7636 (PKCE) | Section 3.1 |
| Authorization Code + PKCE | Section 4.1 | Section 4.1 (PKCE required) | RFC 7636 | Section 3.1 |
| Client Credentials | Section 4.4 | Section 4.2 | -- | N/A |
| Device Authorization | -- | -- | RFC 8628 | -- |
| Refresh Token | Section 6 | Section 6 | -- | Section 12 |
| Implicit **WARNING** | Section 4.2 | REMOVED | -- | Section 3.2 |
| Resource Owner Password **WARNING** | Section 4.3 | REMOVED | -- | -- |

> **WARNING** = Deprecated. Documented for legacy system debugging only. Do not implement.

### Security Threats -> Documentation Coverage

| Threat | Primary Document | RFC/Spec Reference | Vuln Mode Toggle |
|--------|------------------|-------------------|------------------|
| Authorization Code Injection | `pkce-implementation.md` | RFC 7636 Section 1, Security BCP Section 4.5 | `DISABLE_PKCE` |
| CSRF Attacks | `state-parameter-and-csrf.md` | RFC 6749 Section 10.12, Security BCP Section 4.7 | `PREDICTABLE_STATE` |
| Open Redirect | `redirect-uri-validation.md` | RFC 6749 Section 10.6, Security BCP Section 4.1 | `LAX_REDIRECT_URI` |
| Token Theft (Bearer) | `token-binding-dpop-mtls.md` | RFC 9449, RFC 8705 | `DISABLE_DPOP` |
| Token Leakage via Referrer | `security-best-current-practice.md` | Security BCP Section 4.2.4 | `ALLOW_FRAGMENT_TOKENS` |
| Mix-Up Attacks | `oauth2-oidc-threat-model.md` | Security BCP Section 4.4, RFC 9207 | `DISABLE_ISS_CHECK` |
| Access Token Injection | `id-tokens-oidc.md` | OIDC Core Section 3.1.3.7 | `SKIP_AT_HASH` |
| Refresh Token Theft | `refresh-tokens.md` | Security BCP Section 4.13 | `REUSABLE_REFRESH` |
| Code Interception (Native Apps) | `authorization-code-flow-with-pkce.md` | RFC 8252 Section 8.1 | `DISABLE_PKCE` |
| Insufficient Redirect URI Validation | `redirect-uri-validation.md` | Security BCP Section 4.1.1 | `PATTERN_MATCHING_URI` |
| Clickjacking | `security-best-current-practice.md` | RFC 6749 Section 10.13 | `ALLOW_IFRAME` |
| ID Token Substitution | `id-tokens-oidc.md` | OIDC Core Section 3.1.3.7 | `SKIP_NONCE` |

### Tool Features -> Specification Requirements

| Tool Feature | Specification Requirement | Document Reference |
|--------------|--------------------------|-------------------|
| Flow Visualization | Display all parameters per RFC | `authorization-code-flow-with-pkce.md`, `visualization-flow-sequences.md` |
| Token Decoding | JWT parsing per RFC 7519 | `jwt-structure-and-validation.md` |
| Signature Verification | JWS validation per RFC 7515 | `jwt-structure-and-validation.md`, `jwks-and-key-rotation.md` |
| PKCE Generation | code_verifier/challenge per RFC 7636 Section 4 | `pkce-implementation.md` |
| Discovery Fetch | Well-known endpoint parsing | `well-known-configuration.md` |
| Token Introspection | RFC 7662 request/response format | `token-introspection-and-revocation.md` |
| DPoP Proof Generation | RFC 9449 Section 4 | `token-binding-dpop-mtls.md` |
| KeyCloak Integration | Realm/client configuration | `keycloak-deployment.md`, `keycloak-realm-configuration.md` |
| Vulnerability Simulation | Threat model mapping | `vulnerability-mode-overview.md`, `vulnerability-mode-authorization.md`, `vulnerability-mode-token.md` |
| UI/UX Implementation | Layout and interaction patterns | `visualization-ui-ux-requirements.md`, `visualization-implementation-guide.md` |

---

## How to Use This Documentation

### Guidance for Claude

When implementing features or answering questions, follow this decision tree:

```
START
  |
  |-> "How does [flow] work?"
  |     -> See /flows/[flow-name].md
  |     -> Cross-reference OIDC Core if ID tokens involved
  |
  |-> "What are the security requirements for [X]?"
  |     -> See /security/security-best-current-practice.md FIRST (all parts)
  |     -> Then see specific threat document
  |     -> Identify MUST/SHOULD/MAY per RFC 2119
  |
  |-> "How do I validate [token type]?"
  |     -> See /tokens/[token-type].md
  |     -> See /tokens/jwt-structure-and-validation.md
  |
  |-> "What should the tool display for [scenario]?"
  |     -> See /visualization/visualization-overview.md (start here)
  |     -> See /visualization/visualization-flow-sequences.md for flow-specific
  |     -> Cross-reference the relevant flow document
  |
  |-> "How does vulnerability mode [X] work?"
  |     -> See /vulnerability-mode/vulnerability-mode-overview.md (start here)
  |     -> See /vulnerability-mode/vulnerability-mode-authorization.md or
  |        /vulnerability-mode/vulnerability-mode-token.md for specifics
  |     -> See /security/oauth2-oidc-threat-model.md for threat context
  |
  |-> "How do I configure KeyCloak for [scenario]?"
  |     -> See /keycloak/keycloak-deployment.md for setup
  |     -> See /keycloak/keycloak-realm-configuration.md for config
  |     -> See /keycloak/keycloak-security-and-vulnerability-mode.md for vuln mode
  |
  `-> "What does the spec say about [specific thing]?"
        -> Search this document's tables first
        -> Go to primary RFC section number
        -> Document the specific Section X.X reference in response

```
### Pattern Reference

| When asked about... | Reference these documents... |
|--------------------|------------------------------|
| Authorization Code Flow implementation | `authorization-code-flow-with-pkce.md` + `pkce-implementation.md` (both parts) |
| Token validation | `jwt-structure-and-validation.md` + relevant token doc |
| "Is this secure?" questions | `security-best-current-practice.md` (all parts) + `oauth2-oidc-threat-model.md` (all parts) |
| KeyCloak configuration | `keycloak-deployment.md` + `keycloak-realm-configuration.md` + relevant flow doc |
| What to display in the tool | `visualization-overview.md` + `visualization-flow-sequences.md` + relevant flow doc |
| Why something is deprecated | `[DEPRECATED]` flow docs + `security-best-current-practice.md` |
| Vulnerability mode features | `vulnerability-mode-overview.md` + specific vuln mode doc + threat model |

### Multi-Part Document Navigation

Several documents are split across multiple files. Here's how to navigate them:

| Document Set | Files | Navigation |
|--------------|-------|------------|
| OAuth2/OIDC Threat Model | `oauth2-oidc-threat-model.md`, `-INDEX.md`, `-part2.md`, `-part3.md` | Start with INDEX for overview |
| PKCE Implementation | `pkce-implementation.md`, `-part2.md` | Base file first, then part2 |
| State Parameter & CSRF | `state-parameter-and-csrf.md`, `-part2.md` | Base file first, then part2 |
| Redirect URI Validation | `redirect-uri-validation.md`, `-part2.md` | Base file first, then part2 |
| Token Binding (DPoP/mTLS) | `token-binding-dpop-mtls.md`, `-part2.md`, `-part3.md` | Base file first, then sequentially |
| Security BCP | `security-best-current-practice.md`, `-part2.md`, `-part3.md` | Base file first, then sequentially |

### RFC 2119 Keyword Usage

All documents in this library use RFC 2119 keywords with specific meanings:

| Keyword | Meaning | Implication for Tool |
|---------|---------|---------------------|
| **MUST** | Absolute requirement | Tool MUST enforce/implement |
| **MUST NOT** | Absolute prohibition | Tool MUST prevent/block |
| **SHOULD** | Recommended unless good reason to deviate | Tool SHOULD implement; vuln mode MAY disable |
| **SHOULD NOT** | Discouraged unless good reason to use | Tool SHOULD warn; vuln mode MAY allow |
| **MAY** | Truly optional | Tool MAY implement; document if not |

---

## Specification Version Information

### Active Specifications

| Specification | Version | Status | Notes |
|---------------|---------|--------|-------|
| OAuth 2.0 | RFC 6749 | Standard | Foundation document |
| OAuth 2.1 | draft-ietf-oauth-v2-1-10 | Draft | Consolidates 2.0 + extensions; removes deprecated flows |
| OAuth 2.0 Security BCP | draft-ietf-oauth-security-topics-27 | Draft (widely adopted) | **PRIMARY security reference** |
| OpenID Connect Core | 1.0 | Final | Foundation for ID tokens |
| OpenID Connect Discovery | 1.0 | Final | Well-known endpoint |
| PKCE | RFC 7636 | Standard | Required for all authorization code flows |
| DPoP | RFC 9449 | Standard | Sender-constrained access tokens |
| PAR | RFC 9126 | Standard | Pushed Authorization Requests |

### Implementation Stance

This documentation library follows **OAuth 2.1 recommendations** as the baseline:

1. **PKCE is REQUIRED** for all authorization code flows (not optional)
2. **Implicit flow is NOT RECOMMENDED** (documented for legacy debugging only)
3. **Resource Owner Password flow is NOT RECOMMENDED** (documented for legacy debugging only)
4. **Refresh token rotation is RECOMMENDED**
5. **Exact redirect URI matching is REQUIRED**

### Deprecated Flows: Why We Document Them

| Deprecated Flow | Why Deprecated | Why Documented |
|-----------------|----------------|----------------|
| Implicit Grant | Tokens in URL fragment; no client authentication; vulnerable to token leakage | Legacy SPAs still use this; need to debug and migrate |
| Resource Owner Password | Exposes credentials to client; violates OAuth's core principle | Legacy systems; some internal tools unfortunately use this |

> **Tool Behavior**: When these flows are detected, the tool SHOULD display a prominent deprecation warning and link to migration guidance.

---

## Planned Documentation (TODO)

The following extension specifications are planned but not yet created:

| Document | RFC | Priority | Description |
|----------|-----|----------|-------------|
| `rich-authorization-requests.md` | RFC 9396 | Medium | Fine-grained authorization beyond scope strings |
| `token-exchange.md` | RFC 8693 | Medium | Token transformation, delegation, and impersonation |
| `jwt-secured-authorization-requests.md` | RFC 9101 | Low | JAR for signed/encrypted authorization requests |

---

## In Case of Emergency

If Claude starts hallucinating OAuth2 requirements that don't exist in the specs, the most important documents to reference are:

1. The actual flow document (`authorization-code-flow-with-pkce.md`, etc.)
2. The threat model (`oauth2-oidc-threat-model.md` and its parts)
3. This navigation document (you are here)

**The answer to "Does OAuth2 require X?" is ALWAYS in RFC 6749 or RFC 7636.**
**If it's not there, the answer is "no, but Security BCP recommends it."**

### Verification Checklist

Before stating any OAuth2/OIDC requirement as fact:

- [ ] Can you cite a specific RFC section number (e.g., RFC 6749 Section 4.1.2)?
- [ ] Is it a MUST, SHOULD, or MAY per the spec?
- [ ] Is it in the base spec or the Security BCP?
- [ ] Does OIDC add additional requirements beyond OAuth2?

### Common Hallucination Traps

| Often Hallucinated As... | Reality |
|-------------------------|---------|
| "PKCE is required by OAuth 2.0" | OAuth 2.0 (RFC 6749) does not require PKCE; OAuth 2.1 and Security BCP do |
| "Refresh tokens must be rotated" | SHOULD per Security BCP, not MUST |
| "Access tokens must be JWTs" | No format specified in RFC 6749; can be opaque |
| "State parameter is required" | SHOULD in RFC 6749 Section 10.12; effectively MUST for CSRF protection |
| "ID tokens can be used as access tokens" | NO. Different purposes. OIDC Core Section 2 is clear on this. |

---

## Specification Quick Links

For direct access to source specifications:

| Specification | URL |
|---------------|-----|
| RFC 6749 (OAuth 2.0) | https://datatracker.ietf.org/doc/html/rfc6749 |
| RFC 7636 (PKCE) | https://datatracker.ietf.org/doc/html/rfc7636 |
| RFC 6819 (Threat Model) | https://datatracker.ietf.org/doc/html/rfc6819 |
| OAuth 2.1 (Draft) | https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1 |
| Security BCP (Draft) | https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics |
| OpenID Connect Core | https://openid.net/specs/openid-connect-core-1_0.html |
| RFC 9449 (DPoP) | https://datatracker.ietf.org/doc/html/rfc9449 |
| RFC 8628 (Device Flow) | https://datatracker.ietf.org/doc/html/rfc8628 |
| RFC 9126 (PAR) | https://datatracker.ietf.org/doc/html/rfc9126 |
| RFC 9396 (RAR) | https://datatracker.ietf.org/doc/html/rfc9396 |
| RFC 8693 (Token Exchange) | https://datatracker.ietf.org/doc/html/rfc8693 |
| RFC 9101 (JAR) | https://datatracker.ietf.org/doc/html/rfc9101 |

---

*Last Updated: [Generation Date]*
*Library Version: 1.1.0*
*Maintained for: OAuth2/OIDC Debugging & Learning Tool*
