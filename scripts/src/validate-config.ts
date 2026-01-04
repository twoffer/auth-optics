#!/usr/bin/env tsx
/**
 * Validate agent prompt configuration YAML against JSON Schema
 *
 * Usage:
 *   tsx scripts/src/validate-config.ts [config-file]
 *   pnpm validate [config-file]
 *
 * Examples:
 *   tsx scripts/src/validate-config.ts docs/prompts/config.yaml
 *   tsx scripts/src/validate-config.ts  # validates default config.yaml
 *   pnpm validate                        # validates default config.yaml
 */

import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadYaml, loadJsonSchema } from './lib/config-loader.js';
import { validateSchema, validateSessionLogic } from './lib/validator.js';
import { success, error, warning } from './lib/colors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Main validation entry point
 */
async function main() {
  // Determine config file path
  const configArg = process.argv[2];
  let configFile: string;

  if (configArg) {
    configFile = resolve(configArg);
  } else {
    // Default to docs/prompts/config.yaml
    // __dirname is scripts/src, so go up 2 levels to project root
    const projectRoot = resolve(__dirname, '../..');
    configFile = join(projectRoot, 'docs', 'prompts', 'config.yaml');
  }

  // Determine schema file path
  const schemaFile = join(dirname(configFile), 'config.schema.json');

  console.log('Validating configuration...');
  console.log(`  Config: ${configFile}`);
  console.log(`  Schema: ${schemaFile}`);
  console.log();

  // Load configuration file
  const configResult = loadYaml(configFile);
  if (!configResult.success) {
    console.error(error(`Error: ${configResult.error!.message}`));
    if (configResult.error!.details) {
      console.error(error(`Details: ${configResult.error!.details}`));
    }
    process.exit(1);
  }

  // Load schema file
  const schemaResult = loadJsonSchema(schemaFile);
  if (!schemaResult.success) {
    console.error(error(`Error: ${schemaResult.error!.message}`));
    if (schemaResult.error!.details) {
      console.error(error(`Details: ${schemaResult.error!.details}`));
    }
    process.exit(1);
  }

  // Validate against schema
  const validationResult = validateSchema(configResult.config!, schemaResult.config!);

  if (!validationResult.valid) {
    console.log(error(`❌ Validation failed for: ${configFile}`));
    console.log(error(`Found ${validationResult.errors.length} error(s):\n`));

    validationResult.errors.forEach((err, i) => {
      console.log(`Error ${i + 1}:`);
      console.log(`  Location: ${err.path}`);
      console.log(`  Problem: ${err.message}`);

      if (err.value !== undefined) {
        console.log(`  Value: ${err.value}`);
      }

      if (err.constraint) {
        console.log(`  Constraint: ${err.constraint}`);
      }

      console.log();
    });

    process.exit(1);
  }

  console.log(success(`✅ Configuration is valid: ${configFile}`));

  // Additional validation logic
  const warnings = validateSessionLogic(configResult.config!);
  if (warnings.length > 0) {
    console.log('\nAdditional checks:');
    warnings.forEach((w) => {
      console.log(warning(`  ⚠️  ${w}`));
    });
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(error('\nUnexpected error:'));
  console.error(error(err instanceof Error ? err.message : String(err)));
  if (err instanceof Error && err.stack) {
    console.error(error('\nStack trace:'));
    console.error(err.stack);
  }
  process.exit(2);
});
