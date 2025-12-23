# OAuth2/OIDC Comprehensive Threat Model - Complete Index

## Master Security Reference Guide

> *"The OAuth2 threat model exists in three parts, which is appropriate since most OAuth attacks also come in three parts: the setup, the exploitation, and the 'I told you PKCE was important.'"*

---

## Document Overview

This comprehensive threat model is split across three interconnected documents due to its extensive coverage of OAuth2 and OpenID Connect security. Together, they provide authoritative guidance for security professionals conducting threat assessments, penetration testing, or designing secure OAuth2/OIDC implementations.

**Total Coverage:**
- **35+ detailed attack scenarios** with complete attack steps
- **50+ vulnerability mode toggles** for educational demonstration
- **15+ RFC/specification references** with exact section citations
- **Hundreds of code examples** showing both vulnerable and secure patterns
- **Complete validation test suites** for each attack type
- **Real-world CVE examples** and incident analysis

---

## Document Structure

### 📄 [Part 1: Core Threat Model](oauth2-oidc-threat-model.md)
**Sections 1-3.6**

**Contents:**
1. **Threat Model Overview**
   - Scope and attack surface areas
   - Attacker capabilities taxonomy
   - Threat severity classification
   - Primary security references

2. **Attack Taxonomy by Endpoint**
   - Authorization endpoint attacks
   - Token endpoint attacks
   - Refresh token attacks
   - Resource server attacks
   - OIDC-specific attacks
   - Network/transport attacks
   - Client-side attacks

3. **Authorization Endpoint Attacks (3.1-3.6)**
   - ✅ **3.1 CSRF Attacks** - Missing/weak state parameter
   - ✅ **3.2 Authorization Code Interception** - The case for PKCE
   - ✅ **3.3 Open Redirect** - redirect_uri validation bypasses
   - ✅ **3.4 Clickjacking** - UI redressing attacks
   - ✅ **3.5 PKCE Downgrade** - Making PKCE optional (critical error)
   - ✅ **3.6 Mix-Up Attacks** - Multiple authorization server confusion

**Key Features:**
- Complete threat model methodology
- Attack surface visualization
- Detailed first 6 authorization endpoint attacks
- Full code examples (Python, JavaScript, Swift)
- Specification-based mitigations with exact RFC sections
- Validation test suites

---

### 📄 [Part 2: Token & OIDC Attacks](oauth2-oidc-threat-model-part2.md)
**Sections 3.7, 4, 5, 6, 7**

**Contents:**

**3. Authorization Endpoint Attacks (continued)**
- ✅ **3.7 Covert Redirect** - Path-based redirect URI exploitation

**4. Token Endpoint Attacks (4.1-4.5)**
- ✅ **4.1 Authorization Code Injection** - Session fixation via code
- ✅ **4.2 PKCE Brute Force** - Weak verifier attacks
- ✅ **4.3 Client Credential Theft** - Secret exposure vectors
- ✅ **4.4 Code Replay** - Authorization code reuse
- ✅ **4.5 Token Substitution** - Response manipulation

**5. Refresh Token Attacks (5.1-5.3)**
- ✅ **5.1 Refresh Token Theft** - Storage vulnerabilities
- ✅ **5.2 Refresh Token Replay After Rotation** - Theft detection
- ✅ **5.3 Refresh Token Scope Escalation** - Unauthorized scope expansion

**6. Resource Server / Access Token Attacks (6.1-6.5)**
- ✅ **6.1 Token Theft via Insecure Storage** - localStorage/XSS
- ✅ **6.2 Token Leakage via Referrer** - URL-based token exposure
- ✅ **6.3 Insufficient Scope Validation** - Authorization bypass
- ✅ **6.4 Bearer Token Replay** - Token interception and reuse
- ✅ **6.5 Audience Validation Bypass** - Wrong resource server usage

**7. OIDC-Specific Attacks (7.1-7.6)**
- ✅ **7.1 ID Token Substitution** - at_hash validation bypass
- ✅ **7.2 ID Token Replay** - nonce validation bypass
- ✅ **7.3 JWT Algorithm Confusion** - RS256→HS256 attacks (CVE-2015-2951)
- ✅ **7.4 JWT alg=none Acceptance** - Unsigned token attacks (CVE-2015-9235)
- ✅ **7.5 ID Token Signature Bypass** - Missing validation
- ✅ **7.6 Hash Validation Bypass** - at_hash/c_hash/nonce bypass

**Key Features:**
- Complete token endpoint attack coverage
- Comprehensive refresh token security
- Resource server protection patterns
- Deep OIDC JWT security analysis
- Token rotation and family tracking
- Sender-constrained token patterns

---

### 📄 [Part 3: Flow, Network & Client Attacks](oauth2-oidc-threat-model-part3.md)
**Sections 8, 9, 10**

**Contents:**

**8. Cross-Flow Attacks (8.1-8.3)**
- ✅ **8.1 Implicit Flow Token Leakage** - Why implicit flow is deprecated
- ✅ **8.2 Resource Owner Password Credentials** - Why ROPC is dangerous
- ✅ **8.3 Flow Downgrade** - Forcing less secure flows

**9. Network and Transport Attacks (9.1-9.3)**
- ✅ **9.1 TLS Stripping/Downgrade** - HTTPS enforcement
- ✅ **9.2 Certificate Validation Bypass** - MITM via invalid certs
- ✅ **9.3 MITM Token Injection** - Response manipulation

**10. Client-Side Attacks (10.1-10.3)**
- ✅ **10.1 XSS-Based Token Theft** - JavaScript token access
- ✅ **10.2 Client Impersonation** - Public client vulnerabilities
- ✅ **10.3 Phishing via Fake Auth Page** - Social engineering

**Key Features:**
- Complete deprecated flow analysis
- Network security requirements
- Client-side security patterns
- XSS mitigation strategies
- Phishing-resistant authentication
- Migration guidance from insecure flows

---

## Quick Reference Tables

### Attacks by Severity

| Severity | Attacks | Count |
|----------|---------|-------|
| **CRITICAL** | Authorization Code Interception (without PKCE), Client Credential Theft, Refresh Token Theft, JWT Algorithm Confusion, alg=none Acceptance, Signature Bypass, XSS Token Theft, ROPC Credential Exposure | 8 |
| **HIGH** | CSRF, Open Redirect, PKCE Downgrade, Mix-Up, Code Injection, Code Replay, Token Substitution, Refresh Replay, Scope Escalation, Bearer Replay, Audience Bypass, ID Token Substitution, ID Token Replay, Implicit Flow, TLS Attacks, Cert Bypass, Client Impersonation | 17 |
| **MEDIUM** | Covert Redirect, PKCE Brute Force, Insufficient Scope, Token Leakage, Hash Bypass, Flow Downgrade, Phishing | 7 |
| **LOW** | Clickjacking (requires user interaction) | 1 |

### Attacks by Endpoint

| Endpoint | Attack Count | Primary Mitigations |
|----------|--------------|---------------------|
| **Authorization** | 7 | PKCE, State parameter, Exact redirect_uri matching, Issuer validation |
| **Token** | 5 | PKCE validation, Code single-use, Client authentication, Scope validation |
| **Refresh** | 3 | Token rotation, Family revocation, Scope limits |
| **Resource Server** | 5 | Scope validation, Audience checks, Short lifetimes, Sender-constraint |
| **ID Token (OIDC)** | 6 | Signature verification, Nonce validation, Hash validation, Algorithm enforcement |
| **Cross-Flow** | 3 | Disable implicit/ROPC, Flow restrictions |
| **Network** | 3 | HTTPS enforcement, Certificate validation, HSTS |
| **Client-Side** | 3 | HttpOnly cookies, CSP, Input sanitization |

### Vulnerability Mode Reference

Quick lookup for educational demonstration toggles:

| Category | Vulnerability Modes | Attack Enabled |
|----------|---------------------|----------------|
| **PKCE** | `DISABLE_PKCE`, `PKCE_OPTIONAL`, `SHORT_CODE_VERIFIER`, `ALLOW_PLAIN_PKCE` | Code interception, Injection, Brute force |
| **State/CSRF** | `SKIP_STATE_VALIDATION`, `PREDICTABLE_STATE`, `MISSING_STATE_PARAMETER` | CSRF attacks |
| **Redirect URI** | `LAX_REDIRECT_URI`, `PATTERN_MATCHING_URI`, `SUBDOMAIN_WILDCARD_URI`, `PATH_BASED_REDIRECT` | Open redirect, Covert redirect |
| **Code** | `REUSABLE_AUTH_CODE`, `NO_CODE_INVALIDATION` | Code replay |
| **Refresh Tokens** | `INSECURE_REFRESH_STORAGE`, `REUSABLE_REFRESH_TOKENS`, `NO_FAMILY_REVOCATION`, `ALLOW_SCOPE_ESCALATION` | Token theft, Replay, Escalation |
| **JWT** | `FLEXIBLE_JWT_ALGORITHM`, `ACCEPT_NONE_ALGORITHM`, `SKIP_JWT_VERIFICATION`, `SKIP_HASH_VALIDATION` | Algorithm confusion, Signature bypass |
| **Storage** | `LOCALSTORAGE_TOKENS`, `LOCALSTORAGE_REFRESH_TOKEN` | XSS theft |
| **Network** | `HTTP_ENDPOINTS`, `SKIP_CERT_VALIDATION`, `ALLOW_HTTP_REDIRECT` | MITM, Interception |
| **Flows** | `IMPLICIT_FLOW`, `PASSWORD_GRANT`, `ALLOW_FLOW_DOWNGRADE` | Deprecated flow attacks |
| **Validation** | `SKIP_SCOPE_CHECK`, `SKIP_AUDIENCE_CHECK`, `SKIP_NONCE`, `SKIP_AT_HASH`, `NO_ISSUER_BINDING` | Various bypasses |

---

## Specification Reference Map

### Core OAuth2 Specifications

| Specification | Key Sections | Attacks Addressed |
|---------------|--------------|-------------------|
| **RFC 6749** | §3.1.2 (redirect_uri), §4.1 (code flow), §10.12 (CSRF) | Open redirect, CSRF, Code flow |
| **RFC 6819** | §4 (threats), §5 (mitigations) | All threat categories |
| **RFC 7636 (PKCE)** | §1 (rationale), §4 (generation), §7 (security) | Code interception, Injection |
| **Security BCP** | §2.1 (recommendations), §4 (attacks) | All modern best practices |
| **OAuth 2.1** | Consolidates above | Mandatory PKCE, No implicit |

### OpenID Connect Specifications

| Specification | Key Sections | Attacks Addressed |
|---------------|--------------|-------------------|
| **OIDC Core** | §3.1.3 (validation), §16 (security) | ID token attacks, Nonce |
| **RFC 7519 (JWT)** | §4.1 (claims), §5 (validation) | JWT structure, Claims |
| **RFC 7515 (JWS)** | §3 (structure), §5 (validation) | Signature validation |
| **RFC 9207** | Authorization Server Issuer ID | Mix-up attacks |

### Additional Security Specs

| Specification | Purpose | Attacks Addressed |
|---------------|---------|-------------------|
| **RFC 9449 (DPoP)** | Sender-constrained tokens | Token theft, Replay |
| **RFC 8705 (mTLS)** | Certificate-bound tokens | Token theft, MITM |
| **RFC 7662** | Token introspection | Token validation |
| **RFC 7009** | Token revocation | Theft response |

---

## Implementation Checklist

Use this checklist to verify security posture against documented threats:

### ✅ Authorization Endpoint Security
- [ ] PKCE required for all clients
- [ ] State parameter required and validated
- [ ] Exact redirect_uri matching (no patterns/wildcards)
- [ ] Frame protection headers (X-Frame-Options, CSP)
- [ ] Issuer identification in responses
- [ ] HTTPS enforcement
- [ ] Short authorization code lifetime (<10 minutes)

### ✅ Token Endpoint Security
- [ ] PKCE validation enforced
- [ ] Authorization codes single-use only
- [ ] Code replay detection and family revocation
- [ ] Client authentication required (confidential clients)
- [ ] Client credentials stored securely (not hardcoded)
- [ ] Scope validation on refresh
- [ ] Refresh token rotation implemented
- [ ] Token family tracking for theft detection

### ✅ Resource Server Security
- [ ] Bearer token in Authorization header (not URL)
- [ ] Signature verification for JWT tokens
- [ ] Scope validation on every request
- [ ] Audience claim validation
- [ ] Short access token lifetime (<15-60 minutes)
- [ ] Token introspection for opaque tokens
- [ ] Rate limiting and anomaly detection

### ✅ OIDC Security (if applicable)
- [ ] ID token signature always verified
- [ ] Expected algorithm enforced (no alg from header)
- [ ] alg=none tokens rejected
- [ ] Nonce validated and single-use
- [ ] at_hash validated (binds ID token to access token)
- [ ] c_hash validated (hybrid flow)
- [ ] Issuer (iss) claim validated
- [ ] Audience (aud) claim validated

### ✅ Client Security
- [ ] Tokens never in localStorage (use HttpOnly cookies)
- [ ] Tokens never in URL parameters
- [ ] No token logging
- [ ] XSS prevention (CSP, input sanitization)
- [ ] Certificate validation enabled
- [ ] Only secure flows enabled (code+PKCE)
- [ ] Implicit flow disabled
- [ ] Password grant disabled
- [ ] Secure token storage (Keychain/EncryptedSharedPreferences)

### ✅ Network Security
- [ ] HTTPS enforcement everywhere
- [ ] HSTS headers set
- [ ] Certificate pinning (mobile apps)
- [ ] TLS 1.2+ minimum
- [ ] Strong cipher suites only

---

## Using This Threat Model

### For Security Professionals

**Threat Assessment:**
1. Review attack taxonomy (Section 2 in Part 1)
2. Identify applicable attacks for your architecture
3. Map attacks to your endpoints
4. Prioritize by severity and feasibility
5. Review specification requirements
6. Implement mitigations
7. Validate with test suites

**Penetration Testing:**
1. Enable vulnerability modes in test environment
2. Follow demonstration scenarios for each attack
3. Verify attacks work in vulnerable mode
4. Disable vulnerability modes
5. Verify attacks are blocked
6. Document findings
7. Retest after remediation

**Security Architecture:**
1. Use threat model as design input
2. Review attack prerequisites
3. Select mitigations during design
4. Document security decisions
5. Create threat-specific tests
6. Plan for incident response

### For Developers

**Secure Implementation:**
1. Review relevant attack sections
2. Study vulnerable code patterns (what NOT to do)
3. Implement secure code patterns
4. Use validation tests
5. Enable security headers/features
6. Test against vulnerability scenarios

**Code Review:**
1. Check for vulnerable patterns
2. Verify mitigations implemented
3. Validate test coverage
4. Review token storage
5. Check flow configuration
6. Verify TLS usage

### For Debugging Tool Integration

**Educational Mode:**
1. Implement vulnerability mode toggles
2. Create visual demonstrations
3. Show attack flow diagrams
4. Highlight security violations
5. Provide real-time feedback
6. Link to specification sections

**Production Mode:**
1. All vulnerability modes disabled by default
2. Security warnings prominent
3. Mitigation guidance shown
4. Links to threat model sections
5. Test validation results displayed

---

## Document Maintenance

**Current Version:** 1.0.0  
**Last Updated:** December 8, 2025  
**Next Review:** Quarterly or upon significant spec updates

**Change Log:**
- **v1.0.0** (2025-12-08): Initial comprehensive threat model
  - 35+ attacks documented
  - 50+ vulnerability modes defined
  - Complete code examples
  - Validation test suites
  - Real-world CVE references

**Feedback:**
Security vulnerabilities or attack techniques not covered? Please update the threat model and increment version number.

---

## Quick Links

### Direct Access to Sections

**Part 1 - Core & Authorization:**
- [Threat Model Overview](oauth2-oidc-threat-model.md#1-threat-model-overview)
- [CSRF Attacks](oauth2-oidc-threat-model.md#31-csrf-attacks)
- [Code Interception](oauth2-oidc-threat-model.md#32-authorization-code-interception)
- [Open Redirect](oauth2-oidc-threat-model.md#33-open-redirect)
- [Clickjacking](oauth2-oidc-threat-model.md#34-clickjacking)
- [PKCE Downgrade](oauth2-oidc-threat-model.md#35-pkce-downgrade-attack)
- [Mix-Up Attacks](oauth2-oidc-threat-model.md#36-mix-up-attacks)

**Part 2 - Token & OIDC:**
- [Covert Redirect](oauth2-oidc-threat-model-part2.md#37-covert-redirect)
- [Code Injection](oauth2-oidc-threat-model-part2.md#41-authorization-code-injection)
- [Client Credential Theft](oauth2-oidc-threat-model-part2.md#43-client-credential-theft)
- [Refresh Token Theft](oauth2-oidc-threat-model-part2.md#51-refresh-token-theft)
- [JWT Algorithm Confusion](oauth2-oidc-threat-model-part2.md#73-jwt-algorithm-confusion)
- [alg=none Attack](oauth2-oidc-threat-model-part2.md#74-jwt-algnone-acceptance)

**Part 3 - Flow, Network, Client:**
- [Implicit Flow Leakage](oauth2-oidc-threat-model-part3.md#81-implicit-flow-token-leakage)
- [ROPC Dangers](oauth2-oidc-threat-model-part3.md#82-resource-owner-password-credentials-ropc-flow)
- [TLS Attacks](oauth2-oidc-threat-model-part3.md#91-tls-stripping--downgrade)
- [XSS Token Theft](oauth2-oidc-threat-model-part3.md#101-xss-based-token-theft)

---

## Critical Security Principles

### Defense in Depth

No single mitigation is sufficient. Implement multiple layers:

1. **Protocol Level:** PKCE, state, nonce, issuer validation
2. **Transport Level:** HTTPS, certificate validation, HSTS
3. **Token Level:** Short lifetimes, rotation, sender-constraint
4. **Client Level:** Secure storage, XSS prevention, CSP
5. **Server Level:** Scope validation, audit logging, rate limiting

### Fail Secure

When in doubt, reject the request:
- Unknown parameters → reject
- Missing required parameters → reject
- Validation failures → reject
- Suspicious patterns → reject and log

### Principle of Least Privilege

Grant minimum necessary access:
- Minimum scope required
- Shortest token lifetime feasible
- Most restrictive flow available
- Narrowest audience claims

### Assume Breach

Design assuming components will be compromised:
- Token theft → rotation and revocation limits damage
- Client compromise → PKCE and sender-constraint help
- Network compromise → TLS and certificate validation prevent MITM

---

## Compliance and Standards

This threat model aligns with:

- **OWASP Top 10** - A01:2021 Broken Access Control, A07:2021 Identification and Authentication Failures
- **NIST SP 800-63B** - Digital Identity Guidelines (Authentication)
- **PCI DSS 4.0** - Requirements for authentication and access control
- **SOC 2** - Security controls for access management
- **ISO 27001** - Access control (A.9), Cryptography (A.10)
- **GDPR** - Security of processing (Article 32)

---

*"In the end, OAuth2 security comes down to three things: PKCE, HTTPS, and not storing tokens in localStorage. Everything else is commentary."*

---

**End of Master Index**

**Total Documentation:**
- **Part 1:** ~35,000 characters - Core threat model and authorization attacks
- **Part 2:** ~50,000 characters - Token, refresh, and OIDC attacks  
- **Part 3:** ~30,000 characters - Flow, network, and client attacks
- **Index:** This document - Navigation and quick reference

**Total: 115,000+ characters of comprehensive OAuth2/OIDC security guidance**
