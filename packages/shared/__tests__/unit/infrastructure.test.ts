/**
 * Infrastructure Test Suite for Shared Types Package (Vitest)
 *
 * Tests the foundational setup of the AuthOptics monorepo and shared types package.
 * This validates Sections 1-3 of the implementation plan:
 * - Section 1: Project Initialization (monorepo workspace)
 * - Section 2: Directory Structure Setup (all type category directories)
 * - Section 3: TypeScript Configuration (package.json, tsconfig.json, dependencies)
 *
 * Migrated from: infrastructure.test.js
 * Framework: Vitest
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const rootDir = path.resolve(__dirname, '../../../../');
const sharedDir = path.resolve(__dirname, '../../');

describe('Infrastructure Tests - Shared Types Package', () => {
  describe('Section 1: Project Initialization', () => {
    it('should have root package.json', () => {
      const packagePath = path.join(rootDir, 'package.json');
      expect(fs.existsSync(packagePath)).toBe(true);
    });

    it('should have correct root package.json configuration', () => {
      const packagePath = path.join(rootDir, 'package.json');
      const content = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

      expect(content.name).toBe('auth-optics');
      expect(content.private).toBe(true);
    });

    it('should have required scripts in root package.json', () => {
      const packagePath = path.join(rootDir, 'package.json');
      const content = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

      expect(content.scripts).toBeDefined();
      expect(content.scripts.dev).toBe('pnpm -r --parallel dev');
      expect(content.scripts.build).toBe('pnpm -r build');
      expect(content.scripts['build:shared']).toBe('pnpm --filter @auth-optics/shared build');
    });

    it('should have pnpm-workspace.yaml', () => {
      const workspacePath = path.join(rootDir, 'pnpm-workspace.yaml');
      expect(fs.existsSync(workspacePath)).toBe(true);
    });

    it('should have packages/ directory', () => {
      const packagesPath = path.join(rootDir, 'packages');
      expect(fs.existsSync(packagesPath)).toBe(true);
      expect(fs.statSync(packagesPath).isDirectory()).toBe(true);
    });

    it('should have root node_modules', () => {
      const nodeModulesPath = path.join(rootDir, 'node_modules');
      expect(fs.existsSync(nodeModulesPath)).toBe(true);
      expect(fs.statSync(nodeModulesPath).isDirectory()).toBe(true);
    });

    it('should have pnpm-lock.yaml', () => {
      const lockPath = path.join(rootDir, 'pnpm-lock.yaml');
      expect(fs.existsSync(lockPath)).toBe(true);
    });

    it('should have TypeScript installed and accessible', () => {
      expect(() => {
        execSync('npx tsc --version', { stdio: 'pipe' });
      }).not.toThrow();
    });
  });

  describe('Section 2: Directory Structure', () => {
    it('should have packages/shared directory', () => {
      const sharedPath = path.join(rootDir, 'packages/shared');
      expect(fs.existsSync(sharedPath)).toBe(true);
      expect(fs.statSync(sharedPath).isDirectory()).toBe(true);
    });

    it('should have src directory', () => {
      const srcPath = path.join(sharedDir, 'src');
      expect(fs.existsSync(srcPath)).toBe(true);
      expect(fs.statSync(srcPath).isDirectory()).toBe(true);
    });

    const typeCategories = [
      'flows',
      'tokens',
      'http',
      'security',
      'vulnerability',
      'config',
      'discovery',
      'validation',
      'ui',
      'events',
      'utils'
    ];

    typeCategories.forEach(category => {
      it(`should have src/${category} directory`, () => {
        const categoryPath = path.join(sharedDir, 'src', category);
        expect(fs.existsSync(categoryPath)).toBe(true);
        expect(fs.statSync(categoryPath).isDirectory()).toBe(true);
      });
    });

    it('should have exactly the expected type category directories', () => {
      const srcPath = path.join(sharedDir, 'src');
      const srcDirs = fs.readdirSync(srcPath)
        .filter(item => fs.statSync(path.join(srcPath, item)).isDirectory());

      expect(srcDirs.length).toBe(typeCategories.length);
      expect(srcDirs.sort()).toEqual(typeCategories.sort());
    });
  });

  describe('Section 3: TypeScript Configuration', () => {
    it('should have shared package.json', () => {
      const packagePath = path.join(sharedDir, 'package.json');
      expect(fs.existsSync(packagePath)).toBe(true);
    });

    it('should have correct package name', () => {
      const packagePath = path.join(sharedDir, 'package.json');
      const content = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

      expect(content.name).toBe('@auth-optics/shared');
    });

    it('should have correct main and types fields', () => {
      const packagePath = path.join(sharedDir, 'package.json');
      const content = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

      expect(content.main).toBe('dist/index.js');
      expect(content.types).toBe('dist/index.d.ts');
    });

    it('should have required scripts', () => {
      const packagePath = path.join(sharedDir, 'package.json');
      const content = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

      expect(content.scripts).toBeDefined();
      expect(content.scripts.build).toBe('tsc');
      expect(content.scripts['type-check']).toBe('tsc --noEmit');
      expect(content.scripts.clean).toBe('rm -rf dist');
      expect(content.scripts.watch).toBe('tsc --watch');
    });

    it('should have tsconfig.json', () => {
      const tsconfigPath = path.join(sharedDir, 'tsconfig.json');
      expect(fs.existsSync(tsconfigPath)).toBe(true);
    });

    it('should have TypeScript strict mode properly configured', () => {
      const tsconfigPath = path.join(sharedDir, 'tsconfig.json');
      const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      const compilerOptions = content.compilerOptions || {};

      // Check strict mode settings
      expect(compilerOptions.strict).toBe(true);
      expect(compilerOptions.noImplicitAny).toBe(true);
      expect(compilerOptions.strictNullChecks).toBe(true);
      expect(compilerOptions.strictFunctionTypes).toBe(true);
      expect(compilerOptions.strictBindCallApply).toBe(true);
      expect(compilerOptions.strictPropertyInitialization).toBe(true);
      expect(compilerOptions.noImplicitThis).toBe(true);
      expect(compilerOptions.alwaysStrict).toBe(true);

      // Check output directories
      expect(compilerOptions.outDir).toBe('./dist');
      expect(compilerOptions.rootDir).toBe('./src');
    });

    it('should have node_modules in shared package', () => {
      const nodeModulesPath = path.join(sharedDir, 'node_modules');
      expect(fs.existsSync(nodeModulesPath)).toBe(true);
      expect(fs.statSync(nodeModulesPath).isDirectory()).toBe(true);
    });

    it('should have TypeScript available in shared package workspace', () => {
      expect(() => {
        execSync(`cd ${sharedDir} && pnpm list typescript`, { stdio: 'pipe' });
      }).not.toThrow();
    });
  });
});
