/**
 * Comprehensive Type Verification Suite - Shared Types Day 1 Implementation (Vitest)
 *
 * This test suite validates the implementation of all Day 1 types using vitest.
 *
 * Test Coverage:
 * - Utility Types (common.ts, branded-types.ts)
 * - Flow Types (flow-types.ts, flow-steps.ts, authorization-code.ts)
 * - Token Types (jwt.ts, access-token.ts, id-token.ts, refresh-token.ts, token-response.ts)
 * - HTTP Types (request.ts, response.ts, headers.ts)
 * - Export coverage and accessibility
 *
 * Migrated from: types-verification.test.js
 * Framework: Vitest
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const sharedDir = path.resolve(__dirname, '../../');

/**
 * Helper: Check if a file exists
 */
function fileExists(relativePath: string): boolean {
  const fullPath = path.join(sharedDir, relativePath);
  return fs.existsSync(fullPath);
}

/**
 * Helper: Check if file contains exported types
 */
function fileHasExports(relativePath: string, expectedExports: string[]): { success: boolean; missing: string[] } {
  const fullPath = path.join(sharedDir, relativePath);

  if (!fs.existsSync(fullPath)) {
    return { success: false, missing: expectedExports };
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const missing = expectedExports.filter(exp => !content.includes(`export ${exp}`));

  return { success: missing.length === 0, missing };
}

/**
 * Helper: Count barrel exports
 */
function countBarrelExports(relativePath: string): number {
  const fullPath = path.join(sharedDir, relativePath);

  if (!fs.existsSync(fullPath)) {
    return 0;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const exports = (content.match(/export \* from/g) || []).length;
  const namedExports = (content.match(/export \{/g) || []).length;

  return exports + namedExports;
}

/**
 * Helper: Count type definitions in a file
 */
function countTypesInFile(relativePath: string): number {
  const fullPath = path.join(sharedDir, relativePath);

  if (!fs.existsSync(fullPath)) {
    return 0;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const interfaceMatches = content.match(/export interface/g) || [];
  const typeMatches = content.match(/export type/g) || [];
  const enumMatches = content.match(/export enum/g) || [];

  return interfaceMatches.length + typeMatches.length + enumMatches.length;
}

describe('Type Verification Tests - Day 1 Foundation', () => {
  describe('Section 1: Utility Types', () => {
    it('should have common.ts file', () => {
      expect(fileExists('src/utils/common.ts')).toBe(true);
    });

    it('should export common utility types', () => {
      const result = fileHasExports('src/utils/common.ts', [
        'type Timestamp',
        'type URL',
        'type UUID',
        'type UnixTimestamp'
      ]);
      expect(result.success).toBe(true);
      if (!result.success) {
        expect(result.missing).toEqual([]);
      }
    });

    it('should have branded-types.ts file', () => {
      expect(fileExists('src/utils/branded-types.ts')).toBe(true);
    });

    it('should export branded types', () => {
      const result = fileHasExports('src/utils/branded-types.ts', [
        'type ClientId',
        'type UserId',
        'type FlowId'
      ]);
      expect(result.success).toBe(true);
      if (!result.success) {
        expect(result.missing).toEqual([]);
      }
    });

    it('should have utils barrel export configured', () => {
      expect(fileExists('src/utils/index.ts')).toBe(true);
      const exportCount = countBarrelExports('src/utils/index.ts');
      expect(exportCount).toBeGreaterThan(0);
    });

    it('should have expected number of common types', () => {
      const count = countTypesInFile('src/utils/common.ts');
      expect(count).toBeGreaterThanOrEqual(10); // At least 10 utility types
    });

    it('should have expected number of branded types', () => {
      const count = countTypesInFile('src/utils/branded-types.ts');
      expect(count).toBeGreaterThanOrEqual(10); // At least 10 branded types
    });
  });

  describe('Section 2: Flow Types', () => {
    it('should have flow-types.ts file', () => {
      expect(fileExists('src/flows/flow-types.ts')).toBe(true);
    });

    it('should export flow types', () => {
      const result = fileHasExports('src/flows/flow-types.ts', [
        'enum FlowType',
        'enum FlowStatus',
        'interface FlowExecution'
      ]);
      expect(result.success).toBe(true);
      if (!result.success) {
        expect(result.missing).toEqual([]);
      }
    });

    it('should have flow-steps.ts file', () => {
      expect(fileExists('src/flows/flow-steps.ts')).toBe(true);
    });

    it('should export flow step types', () => {
      const result = fileHasExports('src/flows/flow-steps.ts', [
        'interface FlowStep',
        'enum StepStatus'
      ]);
      expect(result.success).toBe(true);
      if (!result.success) {
        expect(result.missing).toEqual([]);
      }
    });

    it('should have authorization-code.ts file', () => {
      expect(fileExists('src/flows/authorization-code.ts')).toBe(true);
    });

    it('should export authorization code types', () => {
      const result = fileHasExports('src/flows/authorization-code.ts', [
        'interface AuthorizationRequest',
        'interface TokenRequest'
      ]);
      expect(result.success).toBe(true);
      if (!result.success) {
        expect(result.missing).toEqual([]);
      }
    });

    it('should have flows barrel export configured', () => {
      expect(fileExists('src/flows/index.ts')).toBe(true);
      const exportCount = countBarrelExports('src/flows/index.ts');
      expect(exportCount).toBeGreaterThan(0);
    });

    it('should have expected number of flow types', () => {
      const count = countTypesInFile('src/flows/flow-types.ts');
      expect(count).toBeGreaterThanOrEqual(5); // At least 5 flow types
    });

    it('should have expected number of flow step types', () => {
      const count = countTypesInFile('src/flows/flow-steps.ts');
      expect(count).toBeGreaterThanOrEqual(3); // At least 3 step types
    });

    it('should have expected number of authorization code types', () => {
      const count = countTypesInFile('src/flows/authorization-code.ts');
      expect(count).toBeGreaterThanOrEqual(4); // At least 4 auth code types
    });
  });

  describe('Section 3: Token Types', () => {
    it('should have jwt.ts file', () => {
      expect(fileExists('src/tokens/jwt.ts')).toBe(true);
    });

    it('should export JWT types', () => {
      const result = fileHasExports('src/tokens/jwt.ts', [
        'interface JWT',
        'interface JWTHeader',
        'interface JWTPayload'
      ]);
      expect(result.success).toBe(true);
      if (!result.success) {
        expect(result.missing).toEqual([]);
      }
    });

    it('should have access-token.ts file', () => {
      expect(fileExists('src/tokens/access-token.ts')).toBe(true);
    });

    it('should export access token types', () => {
      const result = fileHasExports('src/tokens/access-token.ts', [
        'interface AccessToken',
        'interface AccessTokenPayload'
      ]);
      expect(result.success).toBe(true);
      if (!result.success) {
        expect(result.missing).toEqual([]);
      }
    });

    it('should have id-token.ts file', () => {
      expect(fileExists('src/tokens/id-token.ts')).toBe(true);
    });

    it('should export ID token types', () => {
      const result = fileHasExports('src/tokens/id-token.ts', [
        'interface IDToken',
        'interface IDTokenPayload'
      ]);
      expect(result.success).toBe(true);
      if (!result.success) {
        expect(result.missing).toEqual([]);
      }
    });

    it('should have refresh-token.ts file', () => {
      expect(fileExists('src/tokens/refresh-token.ts')).toBe(true);
    });

    it('should export refresh token types', () => {
      const result = fileHasExports('src/tokens/refresh-token.ts', [
        'interface RefreshToken'
      ]);
      expect(result.success).toBe(true);
      if (!result.success) {
        expect(result.missing).toEqual([]);
      }
    });

    it('should have token-response.ts file', () => {
      expect(fileExists('src/tokens/token-response.ts')).toBe(true);
    });

    it('should export token response types', () => {
      const result = fileHasExports('src/tokens/token-response.ts', [
        'interface TokenResponse'
      ]);
      expect(result.success).toBe(true);
      if (!result.success) {
        expect(result.missing).toEqual([]);
      }
    });

    it('should have tokens barrel export configured', () => {
      expect(fileExists('src/tokens/index.ts')).toBe(true);
      const exportCount = countBarrelExports('src/tokens/index.ts');
      expect(exportCount).toBeGreaterThan(0);
    });

    it('should have expected number of JWT types', () => {
      const count = countTypesInFile('src/tokens/jwt.ts');
      expect(count).toBeGreaterThanOrEqual(3); // At least 3 JWT types
    });

    it('should have expected number of access token types', () => {
      const count = countTypesInFile('src/tokens/access-token.ts');
      expect(count).toBeGreaterThanOrEqual(2); // At least 2 access token types
    });

    it('should have expected number of ID token types', () => {
      const count = countTypesInFile('src/tokens/id-token.ts');
      expect(count).toBeGreaterThanOrEqual(2); // At least 2 ID token types
    });

    it('should have expected number of token response types', () => {
      const count = countTypesInFile('src/tokens/token-response.ts');
      expect(count).toBeGreaterThanOrEqual(3); // At least 3 token response types
    });
  });

  describe('Section 4: HTTP Types', () => {
    it('should have request.ts file', () => {
      expect(fileExists('src/http/request.ts')).toBe(true);
    });

    it('should export HTTP request types', () => {
      const result = fileHasExports('src/http/request.ts', [
        'interface HttpRequest',
        'enum HttpMethod'
      ]);
      expect(result.success).toBe(true);
      if (!result.success) {
        expect(result.missing).toEqual([]);
      }
    });

    it('should have response.ts file', () => {
      expect(fileExists('src/http/response.ts')).toBe(true);
    });

    it('should export HTTP response types', () => {
      const result = fileHasExports('src/http/response.ts', [
        'interface HttpResponse'
      ]);
      expect(result.success).toBe(true);
      if (!result.success) {
        expect(result.missing).toEqual([]);
      }
    });

    it('should have headers.ts file', () => {
      expect(fileExists('src/http/headers.ts')).toBe(true);
    });

    it('should export HTTP headers types', () => {
      const result = fileHasExports('src/http/headers.ts', [
        'type HttpHeaders'
      ]);
      expect(result.success).toBe(true);
      if (!result.success) {
        expect(result.missing).toEqual([]);
      }
    });

    it('should have HTTP barrel export configured', () => {
      expect(fileExists('src/http/index.ts')).toBe(true);
      const exportCount = countBarrelExports('src/http/index.ts');
      expect(exportCount).toBeGreaterThan(0);
    });

    it('should have expected number of HTTP request types', () => {
      const count = countTypesInFile('src/http/request.ts');
      expect(count).toBeGreaterThanOrEqual(3); // At least 3 request types
    });

    it('should have expected number of HTTP response types', () => {
      const count = countTypesInFile('src/http/response.ts');
      expect(count).toBeGreaterThanOrEqual(3); // At least 3 response types
    });
  });

  describe('Section 5: Package Configuration & Build', () => {
    it('should have main index.ts export file', () => {
      expect(fileExists('src/index.ts')).toBe(true);
    });

    it('should have main index.ts barrel configured', () => {
      const exportCount = countBarrelExports('src/index.ts');
      expect(exportCount).toBeGreaterThan(0);
    });

    it('should build successfully', () => {
      expect(() => {
        execSync(`cd ${sharedDir} && pnpm build`, { stdio: 'pipe' });
      }).not.toThrow();
    });

    it('should pass TypeScript type checking', () => {
      expect(() => {
        execSync(`cd ${sharedDir} && pnpm type-check`, { stdio: 'pipe' });
      }).not.toThrow();
    });

    it('should have dist directory after build', () => {
      const distPath = path.join(sharedDir, 'dist');
      expect(fs.existsSync(distPath)).toBe(true);
      expect(fs.statSync(distPath).isDirectory()).toBe(true);
    });

    it('should have main index files in dist', () => {
      expect(fileExists('dist/index.js')).toBe(true);
      expect(fileExists('dist/index.d.ts')).toBe(true);
    });
  });

  describe('Section 6: Implementation Summary', () => {
    const expectedFiles = [
      'src/utils/common.ts',
      'src/utils/branded-types.ts',
      'src/utils/index.ts',
      'src/flows/flow-types.ts',
      'src/flows/flow-steps.ts',
      'src/flows/authorization-code.ts',
      'src/flows/index.ts',
      'src/tokens/jwt.ts',
      'src/tokens/access-token.ts',
      'src/tokens/id-token.ts',
      'src/tokens/refresh-token.ts',
      'src/tokens/token-response.ts',
      'src/tokens/index.ts',
      'src/http/request.ts',
      'src/http/response.ts',
      'src/http/headers.ts',
      'src/http/index.ts',
      'src/index.ts',
    ];

    it('should have all Day 1 files created', () => {
      const filesExist = expectedFiles.filter(f => fileExists(f));
      expect(filesExist.length).toBe(expectedFiles.length);
    });

    it('should have expected total type count', () => {
      const typeCountsByCategory = {
        'Utils/Common': countTypesInFile('src/utils/common.ts'),
        'Utils/Branded': countTypesInFile('src/utils/branded-types.ts'),
        'Flows':
          countTypesInFile('src/flows/flow-types.ts') +
          countTypesInFile('src/flows/flow-steps.ts') +
          countTypesInFile('src/flows/authorization-code.ts'),
        'Tokens':
          countTypesInFile('src/tokens/jwt.ts') +
          countTypesInFile('src/tokens/access-token.ts') +
          countTypesInFile('src/tokens/id-token.ts') +
          countTypesInFile('src/tokens/refresh-token.ts') +
          countTypesInFile('src/tokens/token-response.ts'),
        'HTTP':
          countTypesInFile('src/http/request.ts') +
          countTypesInFile('src/http/response.ts') +
          countTypesInFile('src/http/headers.ts'),
      };

      const totalTypes = Object.values(typeCountsByCategory).reduce((a, b) => a + b, 0);

      // Should have at least 60 types total (conservative estimate)
      expect(totalTypes).toBeGreaterThanOrEqual(60);

      // Log type counts for reference
      console.log('\nType Definition Coverage:');
      Object.entries(typeCountsByCategory).forEach(([category, count]) => {
        console.log(`  ${category}: ${count} types`);
      });
      console.log(`  Total: ${totalTypes} types`);
    });
  });
});
