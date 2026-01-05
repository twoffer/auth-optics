/**
 * Configuration validation utilities
 */

import Ajv, { type ValidateFunction, type ErrorObject } from 'ajv';
import type { Config } from '../types/config.js';

export interface ValidationError {
  path: string;
  message: string;
  value?: any;
  constraint?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

/**
 * Validate configuration against JSON Schema
 */
export function validateSchema(config: any, schema: any): ValidationResult {
  const ajv = new Ajv({
    strict: true,
    allErrors: true,
    verbose: true,
  });

  let validate: ValidateFunction;
  try {
    validate = ajv.compile(schema);
  } catch (error) {
    return {
      valid: false,
      errors: [
        {
          path: 'schema',
          message: 'Invalid schema definition',
          value: error instanceof Error ? error.message : String(error),
        },
      ],
      warnings: [],
    };
  }

  const isValid = validate(config);

  if (isValid) {
    return {
      valid: true,
      errors: [],
      warnings: [],
    };
  }

  const errors: ValidationError[] = (validate.errors || []).map((err: ErrorObject) => {
    const path = err.instancePath || 'root';
    const message = err.message || 'Validation failed';

    const error: ValidationError = {
      path,
      message,
    };

    // Add value if present
    if (err.data !== undefined) {
      const dataStr = JSON.stringify(err.data);
      error.value = dataStr.length > 100 ? `${dataStr.substring(0, 100)}...` : dataStr;
    }

    // Add constraint type
    if (err.keyword) {
      error.constraint = err.keyword;
    }

    return error;
  });

  return {
    valid: false,
    errors,
    warnings: [],
  };
}

/**
 * Additional validation logic beyond JSON Schema
 */
export function validateSessionLogic(config: Config): string[] {
  const warnings: string[] = [];
  const session = config.session;

  if (!session?.enabled) {
    return warnings;
  }

  const { current, total } = session;

  // Check current <= total
  if (current > total) {
    warnings.push(
      `session.current (${current}) must be <= session.total (${total})`
    );
  }

  // Check that session_N keys exist for 1..total
  for (let i = 1; i <= total; i++) {
    const key = `session_${i}` as `session_${number}`;
    if (!session[key]) {
      warnings.push(`session.${key} is missing (expected for total=${total})`);
    }
  }

  // Warn about extra session keys
  Object.keys(session).forEach((key) => {
    if (key.startsWith('session_')) {
      const parts = key.split('_');
      const sessionNum = parts[1];
      if (sessionNum) {
        const n = parseInt(sessionNum);
        if (!isNaN(n) && n > total) {
          warnings.push(`session.${key} found but total sessions is ${total}`);
        }
      }
    }
  });

  return warnings;
}
