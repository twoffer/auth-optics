/**
 * AuthOptics Shared Types
 *
 * Centralized TypeScript type definitions for the AuthOptics monorepo
 *
 * @packageDocumentation
 */

// Utilities
export * from './utils';

// Flows
export * from './flows';

// Tokens
export * from './tokens';

// HTTP
export * from './http';

// Note: The following categories will be implemented in future sessions:
// - Security (PKCE, state, nonce, security assessment, indicators)
// - Vulnerability (vulnerability configuration and toggles)
// - Configuration (client, server, app configuration)
// - Discovery (OIDC discovery, OAuth metadata, JWKS)
// - Validation (validation results and errors)
// - UI (UI state, theme, view modes)
// - Events (SSE events for flow updates)
