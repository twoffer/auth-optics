/**
 * Configuration file loading utilities
 */

import { readFileSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import type { Config } from '../types/config.js';

export interface ConfigLoadError {
  type: 'not_found' | 'invalid_yaml' | 'invalid_json';
  message: string;
  details?: string;
}

export interface ConfigLoadResult {
  success: boolean;
  config?: Config;
  error?: ConfigLoadError;
}

/**
 * Load and parse YAML configuration file
 */
export function loadYaml(filePath: string): ConfigLoadResult {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const config = parseYaml(content) as Config;
    return { success: true, config };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {
        success: false,
        error: {
          type: 'not_found',
          message: `Configuration file not found: ${filePath}`,
        },
      };
    }

    return {
      success: false,
      error: {
        type: 'invalid_yaml',
        message: `Invalid YAML syntax in ${filePath}`,
        details: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

/**
 * Load JSON schema file
 */
export function loadJsonSchema(filePath: string): ConfigLoadResult {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const schema = JSON.parse(content);
    return { success: true, config: schema };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {
        success: false,
        error: {
          type: 'not_found',
          message: `Schema file not found: ${filePath}`,
        },
      };
    }

    return {
      success: false,
      error: {
        type: 'invalid_json',
        message: `Invalid JSON in schema file: ${filePath}`,
        details: error instanceof Error ? error.message : String(error),
      },
    };
  }
}
