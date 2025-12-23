# Refresh Tokens

For comprehensive refresh token documentation, see:
- **[/flows/refresh-token-flow.md](../flows/refresh-token-flow.md)** - Complete specification

This document is in the flows category because refresh tokens are primarily 
understood through the refresh token grant flow (RFC 6749 §6).

## Quick Reference

- **Purpose**: Obtain new access tokens without user re-authentication
- **Lifetime**: Long-lived (days/weeks)
- **Security**: MUST be stored securely, rotation RECOMMENDED
- **Scope**: Bound to original authorization
- **Flows that issue them**: Authorization Code, Device Flow (NOT Client Credentials)

See the flows document for:
- Refresh token request/response specifications
- Rotation mechanisms and theft detection
- Security threat model
- Validation rules
