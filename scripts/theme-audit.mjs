#!/usr/bin/env node
/**
 * Theme Audit Script
 * Scans codebase for hardcoded color classes that may break dark mode
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Patterns to detect hardcoded colors
const colorPatterns = [
  { pattern: /text-gray-900/g, name: 'text-gray-900' },
  { pattern: /text-gray-700/g, name: 'text-gray-700' },
  { pattern: /text-slate-900/g, name: 'text-slate-900' },
  { pattern: /text-black(?![/-])/g, name: 'text-black' },
  { pattern: /bg-white(?![/-])/g, name: 'bg-white' },
  { pattern: /border-gray-300/g, name: 'border-gray-300' },
  { pattern: /border-gray-200/g, name: 'border-gray-200' },
];

// Directories to exclude
const excludeDirs = ['node_modules', '.git', '.next', 'dist', 'build', 'out', 'coverage'];

// File extensions to scan
const validExtensions = ['.tsx', '.ts', '.jsx', '.js'];

// Files that are exceptions (PDF, email, etc.)
const exceptionPaths = [
  'components/pdf/',
  'components/emails/',
  'components/landing/landing-content.tsx',
  'components/dashboard/',
];

function shouldSkipPath(path) {
  return exceptionPaths.some(exception => path.includes(exception));
}

function scanDirectory(dir, results = []) {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (!excludeDirs.includes(entry)) {
        scanDirectory(fullPath, results);
      }
    } else {
      const ext = entry.substring(entry.lastIndexOf('.'));
      if (validExtensions.includes(ext)) {
        scanFile(fullPath, results);
      }
    }
  }

  return results;
}

function scanFile(filePath, results) {
  const relativePath = relative(rootDir, filePath);
  
  // Skip exception files
  if (shouldSkipPath(relativePath)) {
    return;
  }

  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (const { pattern, name } of colorPatterns) {
    let match;
    pattern.lastIndex = 0; // Reset regex state
    
    while ((match = pattern.exec(content)) !== null) {
      const lineIndex = content.substring(0, match.index).split('\n').length;
      const line = lines[lineIndex - 1]?.trim() || '';
      
      results.push({
        file: relativePath,
        line: lineIndex,
        pattern: name,
        context: line.substring(0, 100),
      });
    }
  }
}

function generateMarkdownReport(findings) {
  const groupedByFile = findings.reduce((acc, finding) => {
    if (!acc[finding.file]) {
      acc[finding.file] = [];
    }
    acc[finding.file].push(finding);
    return acc;
  }, {});

  let report = `# Theme Audit Report
Generated: ${new Date().toISOString()}

## Summary

Found **${findings.length}** potential hardcoded color issues in **${Object.keys(groupedByFile).length}** files.

## Recommendations

1. Replace \`text-gray-900\`, \`text-black\` with \`text-foreground\`
2. Replace \`bg-white\` with \`bg-background\` or \`bg-card\`
3. Replace \`border-gray-300\`, \`border-gray-200\` with \`border-border\`
4. Use semantic color tokens from \`globals.css\`

## Issues by File

`;

  for (const [file, issues] of Object.entries(groupedByFile)) {
    report += `\n### \`${file}\`\n\n`;
    report += `Found ${issues.length} issue(s):\n\n`;
    
    for (const issue of issues) {
      report += `- **Line ${issue.line}**: \`${issue.pattern}\`\n`;
      report += `  \`\`\`\n  ${issue.context}\n  \`\`\`\n`;
    }
  }

  report += `\n## Next Steps

1. Review each file and replace hardcoded colors with theme tokens
2. Test both light and dark modes after changes
3. Re-run this script to verify fixes: \`npm run theme:audit\`

## Exceptions

The following paths are excluded from this audit as they intentionally use hardcoded colors:
${exceptionPaths.map(p => `- \`${p}\``).join('\n')}
`;

  return report;
}

// Main execution
console.log('🎨 Scanning codebase for hardcoded colors...\n');

const findings = scanDirectory(join(rootDir, 'app'));
scanDirectory(join(rootDir, 'components'), findings);

console.log(`Found ${findings.length} potential issues in ${new Set(findings.map(f => f.file)).size} files\n`);

const report = generateMarkdownReport(findings);
const outputPath = join(rootDir, 'docs', 'THEME_AUDIT.md');

writeFileSync(outputPath, report, 'utf-8');

console.log(`✅ Report written to: ${relative(rootDir, outputPath)}`);

if (findings.length > 0) {
  console.log('\n⚠️  Issues found. Review the report for details.');
  process.exit(1);
} else {
  console.log('\n✨ No issues found!');
  process.exit(0);
}
