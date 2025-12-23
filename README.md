# AuthOptics

**Bringing OAuth2/OIDC flows into focus**

---

## Overview

AuthOptics is a local development tool designed to provide crystal-clear visibility into OAuth2 and OpenID Connect authentication flows. Like a precision optical instrument brings distant objects into sharp focus, AuthOptics illuminates the intricate mechanics of OAuth2/OIDCâ€”making complex authentication protocols visible, understandable, and debuggable.

Built for security professionals, developers, and educators, AuthOptics serves dual purposes:

1. **Debug OAuth2/OIDC Integrations** - Execute authentication flows against identity providers with complete visibility into every request, response, token, and security parameter exchanged during the flow.

2. **Learn OAuth2/OIDC Security** - Understand how security mechanisms protect against attacks through interactive vulnerability demonstrations that show both how protocols defend against threats and what happens when those defenses are disabled.

### Why "AuthOptics"?

The name reflects the tool's core mission: providing optical clarity into authentication systems. Just as optical instruments use lenses and precise measurements to reveal what's invisible to the naked eye, AuthOptics uses visualization, detailed inspection, and real-time analysis to reveal the inner workings of OAuth2/OIDC flows that are typically hidden behind redirects, tokens, and encoded payloads.

### Key Features

- **Flow Visualization** - Step-by-step timeline view of OAuth2/OIDC flows with detailed request/response inspection
- **Token Inspector** - JWT decoder with claim explanations and expiration tracking
- **Security Indicators** - Real-time visibility into PKCE, state parameters, HTTPS usage, and other security mechanisms
- **Vulnerability Mode** - Educational toggles that demonstrate common OAuth2/OIDC security vulnerabilities and their mitigations
- **KeyCloak Integration** - Pre-configured identity provider for immediate experimentation
- **Resource Server Testing** - Mock protected resource server for end-to-end flow validation

### Target Users

- **Security Professionals** debugging OAuth2/OIDC integrations in development environments
- **Developers** implementing OAuth2/OIDC clients and learning authentication best practices
- **Security Auditors** assessing OAuth2/OIDC implementations for vulnerabilities
- **Educators** teaching authentication security and protocol internals
- **Penetration Testers** studying OAuth2/OIDC attack vectors and defense mechanisms

---

## Architecture

AuthOptics is built as a TypeScript monorepo using pnpm workspaces, with a React frontend, Node.js backend, and pre-configured KeyCloak identity provider running in Docker containers.

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                  AuthOptics System                       â”‚
â”‚                                                          â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”         â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”             â”‚
â”‚  â”‚   Frontend   â”‚â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚   Backend    â”‚             â”‚
â”‚  â”‚  (React/TS)  â”‚  HTTP   â”‚  (Node/TS)   â”‚             â”‚
â”‚  â”‚  Port 3000   â”‚  SSE    â”‚  Port 3001   â”‚             â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜         â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜             â”‚
â”‚         â”‚                        â”‚                      â”‚
â”‚         â”‚    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚                      â”‚
â”‚         â””â”€â”€â”€â–ºâ”‚    Shared    â”‚â—„â”€â”€â”€â”˜                      â”‚
â”‚              â”‚    Types     â”‚                           â”‚
â”‚              â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                           â”‚
â”‚                                                          â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                     â”‚
â”‚  â”‚  Mock Resource Server          â”‚                     â”‚
â”‚  â”‚  (Node/TS) - Port 3002         â”‚                     â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                     â”‚
â”‚                                                          â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                        â”‚
                        â”‚ OAuth2/OIDC
                        â–¼
              â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
              â”‚    KeyCloak     â”‚
              â”‚   Port 8080     â”‚
              â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## Repository Structure

```
auth-optics/
â”œâ”€â”€ docker/                         # Docker Compose configuration
â”‚   â”œâ”€â”€ docker-compose.yml          # Multi-container orchestration
â”‚   â””â”€â”€ keycloak/                   # KeyCloak configuration
â”‚       â”œâ”€â”€ realm-export.json       # Pre-configured OAuth2 demo realm
â”‚       â””â”€â”€ init/                   # KeyCloak initialization scripts
â”‚
â”œâ”€â”€ packages/                       # Monorepo packages
â”‚   â”œâ”€â”€ frontend/                   # React application
â”‚   â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”‚   â”œâ”€â”€ components/         # React components
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ FlowTimeline.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ TokenInspector.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ RequestResponseViewer.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ SecurityIndicators.tsx
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ VulnerabilityModeToggle.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ hooks/              # Custom React hooks
â”‚   â”‚   â”‚   â”œâ”€â”€ services/           # API client services
â”‚   â”‚   â”‚   â”œâ”€â”€ types/              # Frontend-specific types
â”‚   â”‚   â”‚   â”œâ”€â”€ App.tsx             # Root component
â”‚   â”‚   â”‚   â””â”€â”€ main.tsx            # Application entry point
â”‚   â”‚   â”œâ”€â”€ public/                 # Static assets
â”‚   â”‚   â”œâ”€â”€ index.html
â”‚   â”‚   â”œâ”€â”€ package.json
â”‚   â”‚   â”œâ”€â”€ tsconfig.json
â”‚   â”‚   â”œâ”€â”€ vite.config.ts          # Vite build configuration
â”‚   â”‚   â””â”€â”€ tailwind.config.js      # Tailwind CSS configuration
â”‚   â”‚
â”‚   â”œâ”€â”€ backend/                    # Node.js backend
â”‚   â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”‚   â”œâ”€â”€ services/           # Core business logic
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ OAuth2Client.ts
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ KeyCloakDiscoveryClient.ts
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ FlowOrchestrator.ts
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ VulnerabilityModeManager.ts
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ TokenValidator.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ routes/             # Express routes
â”‚   â”‚   â”‚   â”œâ”€â”€ middleware/         # Express middleware
â”‚   â”‚   â”‚   â”œâ”€â”€ types/              # Backend-specific types
â”‚   â”‚   â”‚   â””â”€â”€ server.ts           # Application entry point
â”‚   â”‚   â”œâ”€â”€ package.json
â”‚   â”‚   â”œâ”€â”€ tsconfig.json
â”‚   â”‚   â””â”€â”€ nodemon.json            # Development auto-reload config
â”‚   â”‚
â”‚   â”œâ”€â”€ mock-resource-server/       # Protected resource simulation
â”‚   â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”‚   â”œâ”€â”€ middleware/         # JWT verification middleware
â”‚   â”‚   â”‚   â”œâ”€â”€ routes/             # Protected endpoints
â”‚   â”‚   â”‚   â””â”€â”€ server.ts           # Server entry point
â”‚   â”‚   â”œâ”€â”€ package.json
â”‚   â”‚   â””â”€â”€ tsconfig.json
â”‚   â”‚
â”‚   â””â”€â”€ shared/                     # Shared TypeScript types
â”‚       â”œâ”€â”€ src/
â”‚       â”‚   â”œâ”€â”€ types/              # Common type definitions
â”‚       â”‚   â”‚   â”œâ”€â”€ flow.ts         # Flow execution types
â”‚       â”‚   â”‚   â”œâ”€â”€ token.ts        # Token data types
â”‚       â”‚   â”‚   â”œâ”€â”€ config.ts       # Configuration types
â”‚       â”‚   â”‚   â””â”€â”€ vulnerability.ts # Vulnerability toggle types
â”‚       â”‚   â””â”€â”€ index.ts            # Package exports
â”‚       â”œâ”€â”€ package.json
â”‚       â””â”€â”€ tsconfig.json
â”‚
â”œâ”€â”€ scripts/                        # Utility scripts
â”‚   â”œâ”€â”€ init-keycloak.sh            # KeyCloak setup automation
â”‚   â””â”€â”€ test-keycloak.sh            # KeyCloak connectivity test
â”‚
â”œâ”€â”€ .env.example                    # Environment variables template
â”œâ”€â”€ pnpm-workspace.yaml             # pnpm monorepo configuration
â”œâ”€â”€ package.json                    # Root package.json with workspace scripts
â”œâ”€â”€ tsconfig.json                   # Root TypeScript configuration
â””â”€â”€ README.md                       # This file
```

---

## Components

### Frontend (`packages/frontend`)

The React-based user interface provides real-time visualization of OAuth2/OIDC flows. Built with TypeScript, Vite, and Tailwind CSS, the frontend offers:

- **Flow Timeline** - Step-by-step visualization showing authorization requests, redirects, token exchanges, and validation
- **Request/Response Viewer** - Detailed inspection of HTTP requests and responses with JSON syntax highlighting
- **Token Inspector** - JWT decoder displaying headers, payloads, and claims with explanations
- **Security Indicators** - Visual badges showing PKCE status, state parameter usage, HTTPS enforcement, and signature validation
- **Configuration Panel** - OAuth2 client settings including client ID, scopes, redirect URIs, and response types
- **Vulnerability Mode Controls** - Educational toggles for demonstrating security vulnerabilities

The frontend communicates with the backend via REST API for flow control and Server-Sent Events (SSE) for real-time flow updates.

### Backend (`packages/backend`)

The Node.js backend orchestrates OAuth2/OIDC flows and manages communication with the identity provider. Key responsibilities include:

- **OAuth2 Client Logic** - Implementation of OAuth2 authorization code flow with PKCE, including code verifier/challenge generation, state parameter handling, and authorization code exchange
- **Flow Orchestration** - Coordination of multi-step OAuth2 flows with state management and event emission
- **KeyCloak Integration** - OIDC discovery client for fetching provider metadata and JWKS keys
- **Vulnerability Mode** - Application of educational security toggles (e.g., disabling PKCE to demonstrate why it's required)
- **Token Validation** - JWT signature verification, expiration checking, and claims validation
- **SSE Event Stream** - Real-time flow updates pushed to the frontend as each step completes

The backend exposes RESTful endpoints for flow management, configuration, and token validation.

### Mock Resource Server (`packages/mock-resource-server`)

A simulated protected resource server that demonstrates token-based API authentication. Features include:

- **Protected Endpoints** - API routes requiring valid OAuth2 access tokens
- **JWT Verification** - Middleware for validating JWT signatures against KeyCloak's JWKS
- **Scope Enforcement** - Access control based on token scopes (e.g., `profile`, `email`)
- **Token Introspection** - Detailed validation responses showing why tokens succeed or fail

This component allows users to test end-to-end flows by making authenticated API requests with obtained access tokens.

### Shared Types (`packages/shared`)

A TypeScript package containing type definitions used across all components:

- **Flow Types** - `FlowStep`, `FlowExecution`, `HttpRequest`, `HttpResponse`
- **Token Types** - `TokenData`, `JWTPayload`, `TokenResponse`
- **Configuration Types** - `ClientConfig`, `OAuth2Config`, `DiscoveryDocument`
- **Vulnerability Types** - `VulnConfig`, `VulnerabilityToggle`
- **API Contracts** - Request/response interfaces for backend endpoints

Shared types ensure type safety across the monorepo and prevent interface mismatches.

### KeyCloak Identity Provider (`docker/keycloak`)

Pre-configured KeyCloak instance providing OIDC/OAuth2 endpoints:

- **Realm**: `oauth2-demo` - Complete authentication realm with clients, users, and scopes
- **Clients**: 
  - `spa-client` - Public client with PKCE enabled (for frontend testing)
  - `web-app` - Confidential client with client secret (for backend flows)
- **Users**: Demo users (`alice`, `bob`) with pre-set credentials
- **Endpoints**: Authorization, token, JWKS, userinfo, and discovery endpoints
- **Configuration**: Short-lived tokens, refresh token rotation, and configurable security settings

KeyCloak runs in a Docker container and can be configured for both secure and intentionally vulnerable modes for educational purposes.

---

## Getting Started

<!-- Build and development instructions will be added here -->

---

## Development

<!-- Development workflow and contribution guidelines will be added here -->

---

## Documentation

For detailed technical specifications, see:

- [Architecture Documentation](./docs/auth-optics-architecture.md) - Complete system architecture and design decisions
- [OAuth2/OIDC Flow Specifications](./docs/flows/) - RFC-based flow documentation
- [Security Specifications](./docs/security/) - Threat models and security best practices
- [KeyCloak Configuration Guide](./docs/keycloak/) - Identity provider setup and configuration
- [Vulnerability Mode Documentation](./docs/vulnerability/) - Educational security demonstrations

---

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Radix UI
- **Backend**: Node.js 20 LTS, Express, TypeScript
- **Identity Provider**: KeyCloak 22.x
- **Token Handling**: jose (JWT library)
- **Package Management**: pnpm (monorepo workspaces)
- **Containerization**: Docker Compose

---

## License

<!-- License information will be added here -->

---

## Contributing

<!-- Contribution guidelines will be added here -->

---

## Support

For questions, issues, or feature requests, please [open an issue](https://github.com/your-org/auth-optics/issues) on GitHub.

---

## Acknowledgments

AuthOptics is built on the shoulders of giants, implementing specifications from:

- [RFC 6749 - OAuth 2.0 Authorization Framework](https://datatracker.ietf.org/doc/html/rfc6749)
- [RFC 7636 - Proof Key for Code Exchange (PKCE)](https://datatracker.ietf.org/doc/html/rfc7636)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [OAuth 2.0 Security Best Current Practice](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
