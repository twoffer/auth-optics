/**
 * Common Utility Types
 *
 * Foundation types used throughout the AuthOptics type system.
 * These provide type-safe primitives for common data formats.
 */

/**
 * ISO 8601 timestamp string
 *
 * @example "2025-12-30T10:30:00.000Z"
 */
export type Timestamp = string;

/**
 * URL string
 *
 * @example "https://example.com/path"
 */
export type URL = string;

/**
 * Base64-encoded string
 *
 * Standard Base64 encoding (RFC 4648) with padding
 *
 * @example "SGVsbG8gV29ybGQ="
 */
export type Base64String = string;

/**
 * Base64URL-encoded string
 *
 * URL-safe Base64 encoding (RFC 4648 §5) without padding
 * Used in OAuth2/OIDC for PKCE code challenges and JWT tokens
 *
 * @remarks
 * Base64URL replaces:
 * - `+` with `-`
 * - `/` with `_`
 * - Omits padding `=` characters
 *
 * @example "SGVsbG8gV29ybGQ"
 */
export type Base64URLString = string;

/**
 * JWT token string
 *
 * JSON Web Token (RFC 7519) format: header.payload.signature
 * All three parts are Base64URL-encoded
 *
 * @example "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ"
 */
export type JWTString = string;

/**
 * UUID v4 string
 *
 * Universally Unique Identifier version 4 (RFC 4122)
 *
 * @example "550e8400-e29b-41d4-a716-446655440000"
 */
export type UUID = string;

/**
 * Unix timestamp (seconds since epoch)
 *
 * Used in JWT claims (exp, iat, nbf) per RFC 7519
 *
 * @example 1704009600
 */
export type UnixTimestamp = number;

/**
 * Deep partial type helper
 *
 * Recursively makes all properties optional
 * Useful for partial updates and patches
 *
 * @example
 * ```typescript
 * interface User {
 *   name: string;
 *   address: {
 *     street: string;
 *     city: string;
 *   };
 * }
 *
 * // All properties optional, including nested ones
 * type PartialUser = DeepPartial<User>;
 * ```
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Deep readonly type helper
 *
 * Recursively makes all properties readonly
 * Ensures immutability throughout nested structures
 *
 * @example
 * ```typescript
 * interface Config {
 *   server: {
 *     port: number;
 *   };
 * }
 *
 * // All properties readonly, including nested ones
 * type ImmutableConfig = DeepReadonly<Config>;
 * ```
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Require specific properties helper
 *
 * Makes specified properties required while keeping others as-is
 *
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   name?: string;
 *   email?: string;
 * }
 *
 * // Require name and email
 * type UserWithContact = RequireProps<User, 'name' | 'email'>;
 * ```
 */
export type RequireProps<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Make specific properties optional helper
 *
 * Makes specified properties optional while keeping others as-is
 *
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   name: string;
 *   email: string;
 * }
 *
 * // Make email optional
 * type UserWithOptionalEmail = PartialProps<User, 'email'>;
 * ```
 */
export type PartialProps<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Discriminated union helper
 *
 * Creates a type-safe discriminated union with a discriminator property
 *
 * @example
 * ```typescript
 * type Success = { status: 'success'; data: string };
 * type Error = { status: 'error'; message: string };
 * type Result = DiscriminatedUnion<'status', Success | Error>;
 * ```
 */
export type DiscriminatedUnion<K extends string, T extends Record<K, string>> = T;
