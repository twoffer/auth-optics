/**
 * JSON Web Key Set (JWKS) Types
 *
 * Type definitions for JSON Web Keys (JWK) and JSON Web Key Sets (JWKS) as defined
 * in RFC 7517. These keys are used for cryptographic operations including JWT
 * signature verification and encryption.
 *
 * @see RFC 7517 - JSON Web Key (JWK)
 * @see RFC 7518 - JSON Web Algorithms (JWA)
 *
 * @module discovery/jwks
 */

/**
 * Key type values
 *
 * Identifies the cryptographic algorithm family used with the key.
 *
 * @see RFC 7517 Section 4.1 - "kty" (Key Type) Parameter
 */
export enum KeyType {
  /**
   * RSA key
   *
   * Used with RSA cryptographic algorithms.
   */
  RSA = 'RSA',

  /**
   * Elliptic Curve key
   *
   * Used with Elliptic Curve cryptographic algorithms.
   */
  EC = 'EC',

  /**
   * Octet sequence key (symmetric)
   *
   * Used with symmetric cryptographic algorithms.
   */
  OCT = 'oct',
}

/**
 * Public key use values
 *
 * Identifies the intended use of the public key.
 *
 * @see RFC 7517 Section 4.2 - "use" (Public Key Use) Parameter
 */
export enum PublicKeyUse {
  /**
   * Signature
   *
   * The key is intended for signature operations (signing and verification).
   */
  SIGNATURE = 'sig',

  /**
   * Encryption
   *
   * The key is intended for encryption operations.
   */
  ENCRYPTION = 'enc',
}

/**
 * Key operations
 *
 * Identifies the operation(s) for which the key is intended to be used.
 *
 * @see RFC 7517 Section 4.3 - "key_ops" (Key Operations) Parameter
 */
export enum KeyOperation {
  /**
   * Compute digital signature or MAC
   */
  SIGN = 'sign',

  /**
   * Verify digital signature or MAC
   */
  VERIFY = 'verify',

  /**
   * Encrypt content
   */
  ENCRYPT = 'encrypt',

  /**
   * Decrypt content and validate decryption
   */
  DECRYPT = 'decrypt',

  /**
   * Encrypt key
   */
  WRAP_KEY = 'wrapKey',

  /**
   * Decrypt key and validate decryption
   */
  UNWRAP_KEY = 'unwrapKey',

  /**
   * Derive key
   */
  DERIVE_KEY = 'deriveKey',

  /**
   * Derive bits not to be used as a key
   */
  DERIVE_BITS = 'deriveBits',
}

/**
 * JSON Web Key (JWK)
 *
 * Represents a cryptographic key in JSON format.
 * The structure varies based on the key type (RSA, EC, oct).
 *
 * @see RFC 7517 Section 4 - JSON Web Key (JWK) Format
 *
 * @example
 * ```typescript
 * // RSA public key for signature verification
 * const rsaKey: JWK = {
 *   kty: KeyType.RSA,
 *   use: PublicKeyUse.SIGNATURE,
 *   kid: 'rsa-2048-key-1',
 *   alg: 'RS256',
 *   n: 'base64url-encoded-modulus...',
 *   e: 'AQAB',
 * };
 * ```
 */
export interface JWK {
  /**
   * Key type
   *
   * Identifies the cryptographic algorithm family used with the key.
   *
   * @see RFC 7517 Section 4.1 - "kty" (Key Type) Parameter
   */
  kty: string;

  /**
   * Public key use (optional)
   *
   * Identifies the intended use of the public key.
   * The "use" and "key_ops" parameters SHOULD NOT be used together.
   *
   * @see RFC 7517 Section 4.2 - "use" (Public Key Use) Parameter
   */
  use?: string;

  /**
   * Key operations (optional)
   *
   * Identifies the operation(s) for which the key is intended to be used.
   * The "use" and "key_ops" parameters SHOULD NOT be used together.
   *
   * @see RFC 7517 Section 4.3 - "key_ops" (Key Operations) Parameter
   */
  key_ops?: string[];

  /**
   * Algorithm (optional)
   *
   * Identifies the algorithm intended for use with the key.
   * Examples: 'RS256', 'ES256', 'HS256'
   *
   * @see RFC 7517 Section 4.4 - "alg" (Algorithm) Parameter
   * @see RFC 7518 - JSON Web Algorithms (JWA)
   */
  alg?: string;

  /**
   * Key ID (optional)
   *
   * A hint indicating which key was used.
   * Used to match a specific key in a JWKS.
   *
   * @see RFC 7517 Section 4.5 - "kid" (Key ID) Parameter
   */
  kid?: string;

  /**
   * X.509 URL (optional)
   *
   * A URI that refers to a resource for an X.509 public key certificate or
   * certificate chain.
   *
   * @see RFC 7517 Section 4.6 - "x5u" (X.509 URL) Parameter
   */
  x5u?: string;

  /**
   * X.509 certificate chain (optional)
   *
   * Contains a chain of one or more PKIX certificates.
   * Each string in the array is a base64-encoded DER PKIX certificate.
   *
   * @see RFC 7517 Section 4.7 - "x5c" (X.509 Certificate Chain) Parameter
   */
  x5c?: string[];

  /**
   * X.509 certificate SHA-1 thumbprint (optional)
   *
   * A base64url-encoded SHA-1 thumbprint of the DER encoding of an X.509 certificate.
   *
   * @see RFC 7517 Section 4.8 - "x5t" (X.509 Certificate SHA-1 Thumbprint) Parameter
   */
  x5t?: string;

  /**
   * X.509 certificate SHA-256 thumbprint (optional)
   *
   * A base64url-encoded SHA-256 thumbprint of the DER encoding of an X.509 certificate.
   *
   * @see RFC 7517 Section 4.9 - "x5t#S256" (X.509 Certificate SHA-256 Thumbprint) Parameter
   */
  'x5t#S256'?: string;

  // RSA-specific parameters

  /**
   * RSA modulus (RSA keys only)
   *
   * The modulus value for the RSA public key.
   * Represented as a Base64urlUInt-encoded value.
   *
   * @see RFC 7518 Section 6.3.1.1 - "n" (Modulus) Parameter
   */
  n?: string;

  /**
   * RSA public exponent (RSA keys only)
   *
   * The exponent value for the RSA public key.
   * Represented as a Base64urlUInt-encoded value.
   *
   * @see RFC 7518 Section 6.3.1.2 - "e" (Exponent) Parameter
   */
  e?: string;

  /**
   * RSA private exponent (RSA private keys only)
   *
   * The private exponent value for the RSA private key.
   * Represented as a Base64urlUInt-encoded value.
   *
   * @see RFC 7518 Section 6.3.2.1 - "d" (Private Exponent) Parameter
   */
  d?: string;

  /**
   * RSA first prime factor (RSA private keys only)
   *
   * The first prime factor.
   * Represented as a Base64urlUInt-encoded value.
   *
   * @see RFC 7518 Section 6.3.2.2 - "p" (First Prime Factor) Parameter
   */
  p?: string;

  /**
   * RSA second prime factor (RSA private keys only)
   *
   * The second prime factor.
   * Represented as a Base64urlUInt-encoded value.
   *
   * @see RFC 7518 Section 6.3.2.3 - "q" (Second Prime Factor) Parameter
   */
  q?: string;

  /**
   * RSA first factor CRT exponent (RSA private keys only)
   *
   * The first factor Chinese Remainder Theorem exponent.
   * Represented as a Base64urlUInt-encoded value.
   *
   * @see RFC 7518 Section 6.3.2.4 - "dp" (First Factor CRT Exponent) Parameter
   */
  dp?: string;

  /**
   * RSA second factor CRT exponent (RSA private keys only)
   *
   * The second factor Chinese Remainder Theorem exponent.
   * Represented as a Base64urlUInt-encoded value.
   *
   * @see RFC 7518 Section 6.3.2.5 - "dq" (Second Factor CRT Exponent) Parameter
   */
  dq?: string;

  /**
   * RSA first CRT coefficient (RSA private keys only)
   *
   * The first Chinese Remainder Theorem coefficient.
   * Represented as a Base64urlUInt-encoded value.
   *
   * @see RFC 7518 Section 6.3.2.6 - "qi" (First CRT Coefficient) Parameter
   */
  qi?: string;

  /**
   * RSA other primes info (RSA private keys only)
   *
   * An array of information about any third and subsequent primes.
   *
   * @see RFC 7518 Section 6.3.2.7 - "oth" (Other Primes Info) Parameter
   */
  oth?: Array<{
    r: string; // Prime factor
    d: string; // Factor CRT exponent
    t: string; // Factor CRT coefficient
  }>;

  // Elliptic Curve-specific parameters

  /**
   * EC curve (EC keys only)
   *
   * The cryptographic curve used with the key.
   * Examples: 'P-256', 'P-384', 'P-521'
   *
   * @see RFC 7518 Section 6.2.1.1 - "crv" (Curve) Parameter
   */
  crv?: string;

  /**
   * EC x coordinate (EC keys only)
   *
   * The x coordinate for the Elliptic Curve point.
   * Represented as a Base64urlUInt-encoded value.
   *
   * @see RFC 7518 Section 6.2.1.2 - "x" (X Coordinate) Parameter
   */
  x?: string;

  /**
   * EC y coordinate (EC keys only)
   *
   * The y coordinate for the Elliptic Curve point.
   * Represented as a Base64urlUInt-encoded value.
   *
   * @see RFC 7518 Section 6.2.1.3 - "y" (Y Coordinate) Parameter
   */
  y?: string;

  // Symmetric key-specific parameters

  /**
   * Key value (symmetric keys only)
   *
   * The value of the symmetric key.
   * Represented as a Base64url-encoded value.
   *
   * @see RFC 7518 Section 6.4.1 - "k" (Key Value) Parameter
   */
  k?: string;
}

/**
 * JSON Web Key Set (JWKS)
 *
 * A set of JSON Web Keys.
 * The JWKS is retrieved from the authorization server's jwks_uri endpoint.
 *
 * @see RFC 7517 Section 5 - JWK Set Format
 *
 * @example
 * ```typescript
 * // Fetching JWKS from authorization server
 * const response = await fetch('http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/certs');
 * const jwks: JWKS = await response.json();
 *
 * // Find key by kid
 * const key = jwks.keys.find(k => k.kid === 'rsa-key-1');
 * ```
 */
export interface JWKS {
  /**
   * Array of JSON Web Keys
   *
   * The value of the "keys" parameter is an array of JWK values.
   *
   * @see RFC 7517 Section 5.1 - "keys" Parameter
   */
  keys: JWK[];
}

/**
 * Type guard to check if a JWK is an RSA key
 *
 * @param jwk - JSON Web Key
 * @returns True if the key is an RSA key
 */
export function isRSAKey(jwk: JWK): boolean {
  return jwk.kty === KeyType.RSA;
}

/**
 * Type guard to check if a JWK is an Elliptic Curve key
 *
 * @param jwk - JSON Web Key
 * @returns True if the key is an EC key
 */
export function isECKey(jwk: JWK): boolean {
  return jwk.kty === KeyType.EC;
}

/**
 * Type guard to check if a JWK is a symmetric key
 *
 * @param jwk - JSON Web Key
 * @returns True if the key is a symmetric key
 */
export function isSymmetricKey(jwk: JWK): boolean {
  return jwk.kty === KeyType.OCT;
}

/**
 * Type guard to check if a JWK is for signature operations
 *
 * @param jwk - JSON Web Key
 * @returns True if the key is for signature use
 */
export function isSignatureKey(jwk: JWK): boolean {
  // Check use parameter
  if (jwk.use === PublicKeyUse.SIGNATURE) {
    return true;
  }

  // Check key_ops parameter
  if (
    jwk.key_ops &&
    (jwk.key_ops.includes(KeyOperation.SIGN) ||
      jwk.key_ops.includes(KeyOperation.VERIFY))
  ) {
    return true;
  }

  // Check algorithm (signature algorithms)
  if (jwk.alg) {
    const signatureAlgorithms = [
      'RS256',
      'RS384',
      'RS512',
      'ES256',
      'ES384',
      'ES512',
      'PS256',
      'PS384',
      'PS512',
      'HS256',
      'HS384',
      'HS512',
    ];
    return signatureAlgorithms.includes(jwk.alg);
  }

  return false;
}

/**
 * Find a key in JWKS by key ID
 *
 * @param jwks - JSON Web Key Set
 * @param kid - Key ID to search for
 * @returns The matching JWK, or undefined if not found
 */
export function findKeyById(jwks: JWKS, kid: string): JWK | undefined {
  return jwks.keys.find((key) => key.kid === kid);
}

/**
 * Find signature keys in JWKS
 *
 * Returns all keys in the JWKS that can be used for signature verification.
 *
 * @param jwks - JSON Web Key Set
 * @returns Array of JWKs suitable for signature verification
 */
export function findSignatureKeys(jwks: JWKS): JWK[] {
  return jwks.keys.filter(isSignatureKey);
}

/**
 * Validate JWKS structure
 *
 * Checks that the JWKS has a valid structure with at least one key.
 *
 * @param jwks - JSON Web Key Set to validate
 * @returns Array of validation error messages (empty if valid)
 */
export function validateJWKS(jwks: JWKS): string[] {
  const errors: string[] = [];

  if (!jwks.keys) {
    errors.push('JWKS must have a "keys" property');
    return errors;
  }

  if (!Array.isArray(jwks.keys)) {
    errors.push('JWKS "keys" must be an array');
    return errors;
  }

  if (jwks.keys.length === 0) {
    errors.push('JWKS must contain at least one key');
  }

  // Validate each key
  jwks.keys.forEach((key, index) => {
    if (!key.kty) {
      errors.push(`Key at index ${index} is missing required "kty" parameter`);
    }

    // Validate RSA keys
    if (isRSAKey(key)) {
      if (!key.n) {
        errors.push(`RSA key at index ${index} is missing required "n" parameter`);
      }
      if (!key.e) {
        errors.push(`RSA key at index ${index} is missing required "e" parameter`);
      }
    }

    // Validate EC keys
    if (isECKey(key)) {
      if (!key.crv) {
        errors.push(`EC key at index ${index} is missing required "crv" parameter`);
      }
      if (!key.x) {
        errors.push(`EC key at index ${index} is missing required "x" parameter`);
      }
      if (!key.y) {
        errors.push(`EC key at index ${index} is missing required "y" parameter`);
      }
    }

    // Validate symmetric keys
    if (isSymmetricKey(key)) {
      if (!key.k) {
        errors.push(
          `Symmetric key at index ${index} is missing required "k" parameter`
        );
      }
    }
  });

  return errors;
}
