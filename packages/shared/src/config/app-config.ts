/**
 * Application Configuration Types
 *
 * Type definitions for application-level configuration combining client and server
 * configuration with environment and logging settings.
 *
 * @module config/app-config
 */

import type { ClientConfig } from './client-config';
import type { ServerConfig } from './server-config';

/**
 * Application environment
 *
 * Defines the environment in which the application is running.
 */
export enum Environment {
  /**
   * Development environment
   *
   * Used for local development. May include additional debugging features,
   * relaxed security constraints (e.g., HTTP allowed), and verbose logging.
   */
  DEVELOPMENT = 'development',

  /**
   * Staging environment
   *
   * Pre-production environment for testing. Should closely mirror production
   * configuration but may use test credentials and data.
   */
  STAGING = 'staging',

  /**
   * Production environment
   *
   * Live production environment. Should have strict security settings,
   * HTTPS required, and minimal logging.
   */
  PRODUCTION = 'production',
}

/**
 * Log level
 *
 * Defines the verbosity of application logging.
 */
export enum LogLevel {
  /**
   * Debug level - most verbose
   *
   * Includes all logs: debug, info, warn, error.
   * Useful for development and troubleshooting.
   */
  DEBUG = 'debug',

  /**
   * Info level - general information
   *
   * Includes: info, warn, error.
   * Standard level for development environments.
   */
  INFO = 'info',

  /**
   * Warn level - warnings and errors
   *
   * Includes: warn, error.
   * Recommended for staging environments.
   */
  WARN = 'warn',

  /**
   * Error level - errors only
   *
   * Only error logs are emitted.
   * Recommended for production environments.
   */
  ERROR = 'error',

  /**
   * Silent - no logs
   *
   * Suppresses all logging.
   * Not recommended except for testing.
   */
  SILENT = 'silent',
}

/**
 * Application Configuration
 *
 * Complete configuration for the AuthOptics application combining client and
 * server configuration with application-level settings.
 *
 * @example
 * ```typescript
 * const appConfig: AppConfig = {
 *   client: {
 *     clientId: 'web-app',
 *     redirectUri: 'http://localhost:3000/callback',
 *     responseType: ResponseType.CODE,
 *     scope: ['openid', 'profile', 'email'],
 *     grantType: GrantType.AUTHORIZATION_CODE,
 *     usePKCE: true,
 *     useState: true,
 *     codeChallengeMethod: CodeChallengeMethod.S256,
 *   },
 *   server: {
 *     issuer: 'http://localhost:8080/realms/oauth2-demo',
 *     authorizationEndpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/auth',
 *     tokenEndpoint: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/token',
 *     jwksUri: 'http://localhost:8080/realms/oauth2-demo/protocol/openid-connect/certs',
 *     supportedScopes: ['openid', 'profile', 'email'],
 *     supportedResponseTypes: ['code'],
 *     supportedGrantTypes: ['authorization_code', 'refresh_token'],
 *   },
 *   environment: Environment.DEVELOPMENT,
 *   logLevel: LogLevel.DEBUG,
 *   persistConfig: true,
 * };
 * ```
 */
export interface AppConfig {
  /**
   * OAuth2/OIDC client configuration
   *
   * Configuration for the OAuth2 client (application).
   *
   * @see ClientConfig
   */
  client: ClientConfig;

  /**
   * OAuth2/OIDC server configuration
   *
   * Configuration for the authorization server (identity provider).
   *
   * @see ServerConfig
   */
  server: ServerConfig;

  /**
   * Application environment
   *
   * The environment in which the application is running.
   * Affects security settings, logging, and feature availability.
   *
   * @default Environment.DEVELOPMENT
   */
  environment: Environment;

  /**
   * Log level
   *
   * Controls the verbosity of application logging.
   *
   * @default LogLevel.INFO
   */
  logLevel: LogLevel;

  /**
   * Persist configuration to localStorage
   *
   * When true, configuration changes are saved to browser localStorage
   * and restored on application reload.
   *
   * WARNING: Client secrets should never be persisted in localStorage.
   *
   * @default false
   */
  persistConfig: boolean;

  /**
   * API base URL (optional)
   *
   * Base URL for the AuthOptics backend API.
   * If not specified, uses relative URLs.
   *
   * @example 'http://localhost:3001'
   */
  apiBaseUrl?: string;

  /**
   * Mock resource server URL (optional)
   *
   * URL of the mock OAuth2 resource server for testing tokens.
   *
   * @example 'http://localhost:3002'
   */
  resourceServerUrl?: string;
}

/**
 * Default application configuration
 *
 * Provides sensible defaults for local development.
 */
export const DEFAULT_APP_CONFIG: Partial<AppConfig> = {
  environment: Environment.DEVELOPMENT,
  logLevel: LogLevel.INFO,
  persistConfig: false,
};

/**
 * Validate application configuration
 *
 * Checks that the application configuration is valid and secure.
 *
 * @param config - Application configuration to validate
 * @returns Array of validation error messages (empty if valid)
 */
export function validateAppConfig(config: AppConfig): string[] {
  const errors: string[] = [];

  // Validate client config
  if (!config.client) {
    errors.push('Client configuration is required');
  }

  // Validate server config
  if (!config.server) {
    errors.push('Server configuration is required');
  }

  // Environment-specific validations
  if (config.environment === Environment.PRODUCTION) {
    // In production, HTTPS should be required
    if (config.client?.redirectUri && !config.client.redirectUri.startsWith('https://')) {
      errors.push('HTTPS is required for redirect URI in production');
    }

    if (config.server?.issuer && !config.server.issuer.startsWith('https://')) {
      errors.push('HTTPS is required for issuer in production');
    }

    // Client secrets should not be persisted
    if (config.persistConfig && config.client?.clientSecret) {
      errors.push('Client secret should not be persisted in localStorage (security risk)');
    }

    // Log level should be warn or error in production
    if (config.logLevel === LogLevel.DEBUG || config.logLevel === LogLevel.INFO) {
      errors.push('Log level should be WARN or ERROR in production');
    }
  }

  return errors;
}

/**
 * Check if configuration is for development environment
 *
 * @param config - Application configuration to check
 * @returns True if environment is development
 */
export function isDevelopment(config: AppConfig): boolean {
  return config.environment === Environment.DEVELOPMENT;
}

/**
 * Check if configuration is for production environment
 *
 * @param config - Application configuration to check
 * @returns True if environment is production
 */
export function isProduction(config: AppConfig): boolean {
  return config.environment === Environment.PRODUCTION;
}

/**
 * Check if configuration should persist
 *
 * @param config - Application configuration to check
 * @returns True if configuration persistence is enabled
 */
export function shouldPersist(config: AppConfig): boolean {
  return config.persistConfig === true;
}
