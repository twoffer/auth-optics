#!/usr/bin/env tsx
/**
 * Automated Jinja2 to Handlebars Template Conversion Script
 *
 * Converts Jinja2 template syntax to Handlebars syntax for all .template files
 * in docs/prompts/templates/
 *
 * Usage:
 *   tsx scripts/convert-templates.ts [--dry-run]
 *
 * Options:
 *   --dry-run    Show what would be converted without modifying files
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';

interface ConversionReport {
  file: string;
  changes: string[];
  originalSize: number;
  newSize: number;
}

/**
 * Convert Jinja2 template syntax to Handlebars
 */
function convertJinja2ToHandlebars(content: string): { converted: string; changes: string[] } {
  let converted = content;
  const changes: string[] = [];

  // Track original content to detect changes
  const original = content;

  // 1. Comments: {# comment #} → {{! comment }}
  const commentMatches = content.match(/\{#\s*(.*?)\s*#\}/g);
  if (commentMatches) {
    converted = converted.replace(/\{#\s*(.*?)\s*#\}/g, '{{! $1 }}');
    changes.push(`Converted ${commentMatches.length} comment(s)`);
  }

  // 2. If statements: {% if condition %} → {{#if condition}}
  const ifMatches = content.match(/\{%\s*if\s+(.+?)\s*%\}/g);
  if (ifMatches) {
    converted = converted.replace(/\{%\s*if\s+(.+?)\s*%\}/g, '{{#if $1}}');
    changes.push(`Converted ${ifMatches.length} if statement(s)`);
  }

  // 3. Else: {% else %} → {{else}}
  const elseMatches = content.match(/\{%\s*else\s*%\}/g);
  if (elseMatches) {
    converted = converted.replace(/\{%\s*else\s*%\}/g, '{{else}}');
    changes.push(`Converted ${elseMatches.length} else statement(s)`);
  }

  // 4. End if: {% endif %} → {{/if}}
  const endifMatches = content.match(/\{%\s*endif\s*%\}/g);
  if (endifMatches) {
    converted = converted.replace(/\{%\s*endif\s*%\}/g, '{{/if}}');
    changes.push(`Converted ${endifMatches.length} endif statement(s)`);
  }

  // 5. Variables: normalize spacing {{ var }} → {{var}}
  // Keep the content but normalize spacing
  converted = converted.replace(/\{\{\s*(\w+)\s*\}\}/g, '{{$1}}');

  // Count variable normalizations by comparing with original
  const originalVarCount = (original.match(/\{\{\s+\w+\s+\}\}/g) || []).length;
  if (originalVarCount > 0) {
    changes.push(`Normalized ${originalVarCount} variable spacing(s)`);
  }

  return { converted, changes };
}

/**
 * Process a single template file
 */
function processTemplate(filePath: string, dryRun: boolean): ConversionReport {
  const content = readFileSync(filePath, 'utf-8');
  const { converted, changes } = convertJinja2ToHandlebars(content);

  const report: ConversionReport = {
    file: basename(filePath),
    changes,
    originalSize: content.length,
    newSize: converted.length,
  };

  if (!dryRun && changes.length > 0) {
    // Create backup
    writeFileSync(`${filePath}.backup`, content, 'utf-8');
    // Write converted file
    writeFileSync(filePath, converted, 'utf-8');
  }

  return report;
}

/**
 * Main conversion function
 */
function convertTemplates(dryRun: boolean = false) {
  const templatesDir = join(process.cwd(), 'docs', 'prompts', 'templates');

  console.log(`\n${'='.repeat(80)}`);
  console.log('Jinja2 → Handlebars Template Conversion');
  console.log(`${'='.repeat(80)}\n`);

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  }

  console.log(`📂 Template directory: ${templatesDir}\n`);

  // Find all .template files
  const files = readdirSync(templatesDir)
    .filter(f => f.endsWith('.template'))
    .map(f => join(templatesDir, f));

  if (files.length === 0) {
    console.log('❌ No .template files found!\n');
    return;
  }

  console.log(`📄 Found ${files.length} template file(s):\n`);
  files.forEach((f, i) => {
    console.log(`   ${i + 1}. ${basename(f)}`);
  });
  console.log();

  // Process each file
  const reports: ConversionReport[] = [];

  console.log(`${'─'.repeat(80)}\n`);
  console.log('Converting templates...\n');

  for (const file of files) {
    const report = processTemplate(file, dryRun);
    reports.push(report);

    // Print report for this file
    console.log(`📝 ${report.file}`);

    if (report.changes.length === 0) {
      console.log('   ✓ No changes needed (already in Handlebars syntax)');
    } else {
      report.changes.forEach(change => {
        console.log(`   • ${change}`);
      });
      console.log(`   📊 Size: ${report.originalSize} → ${report.newSize} bytes`);

      if (!dryRun) {
        console.log(`   💾 Backup created: ${basename(file)}.backup`);
      }
    }

    console.log();
  }

  // Summary
  console.log(`${'─'.repeat(80)}\n`);
  console.log('📊 CONVERSION SUMMARY\n');

  const totalChanges = reports.reduce((sum, r) => sum + r.changes.length, 0);
  const filesChanged = reports.filter(r => r.changes.length > 0).length;
  const filesUnchanged = reports.filter(r => r.changes.length === 0).length;

  console.log(`✅ Files processed: ${reports.length}`);
  console.log(`   • Changed: ${filesChanged}`);
  console.log(`   • Unchanged: ${filesUnchanged}`);
  console.log(`   • Total conversions: ${totalChanges}`);

  if (!dryRun && filesChanged > 0) {
    console.log(`\n💾 Backups created with .backup extension`);
    console.log(`   To restore: mv file.template.backup file.template`);
  }

  console.log(`\n${'='.repeat(80)}\n`);

  if (dryRun) {
    console.log('🔍 This was a dry run. Use without --dry-run to apply changes.\n');
  } else if (filesChanged > 0) {
    console.log('✅ Conversion complete! Template files are now in Handlebars syntax.\n');
    console.log('📝 Next steps:');
    console.log('   1. Review the converted files');
    console.log('   2. Run: tsx scripts/test-template-rendering.ts');
    console.log('   3. Verify output matches expected format\n');
  } else {
    console.log('ℹ️  All templates are already in Handlebars syntax.\n');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Run conversion
convertTemplates(dryRun);
