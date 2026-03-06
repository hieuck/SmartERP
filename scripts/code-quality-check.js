#!/usr/bin/env node

/**
 * Code Quality Check Script
 * Runs comprehensive quality checks before deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n🔍 ${description}...`, colors.blue);
  try {
    execSync(command, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    log(`✅ ${description} passed`, colors.green);
    return true;
  } catch (error) {
    log(`❌ ${description} failed`, colors.red);
    return false;
  }
}

async function main() {
  log('\n🚀 Starting Code Quality Check...', colors.blue);
  log('='.repeat(50), colors.blue);

  const checks = [
    { cmd: 'npm run lint', desc: 'ESLint Check' },
    { cmd: 'npm run format:check', desc: 'Prettier Format Check' },
    { cmd: 'npm run type-check', desc: 'TypeScript Type Check' },
  ];

  const results = [];

  for (const check of checks) {
    const passed = runCommand(check.cmd, check.desc);
    results.push({ name: check.desc, passed });
  }

  log('\n' + '='.repeat(50), colors.blue);
  log('📊 Quality Check Summary:', colors.blue);
  log('='.repeat(50), colors.blue);

  let allPassed = true;
  results.forEach((result) => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    const color = result.passed ? colors.green : colors.red;
    log(`${status} - ${result.name}`, color);
    if (!result.passed) allPassed = false;
  });

  log('='.repeat(50), colors.blue);

  if (allPassed) {
    log('\n✅ All quality checks passed!', colors.green);
    process.exit(0);
  } else {
    log('\n❌ Some quality checks failed. Please fix the issues.', colors.red);
    process.exit(1);
  }
}

main().catch((error) => {
  log(`\n❌ Error: ${error.message}`, colors.red);
  process.exit(1);
});
