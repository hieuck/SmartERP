#!/usr/bin/env node

/**
 * Test Changed Files Script
 * Detects changed files and runs relevant tests
 */

const { execSync } = require('child_process');
const path = require('path');

// Get changed files from git
function getChangedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACMR', {
      encoding: 'utf-8',
    });
    return output.split('\n').filter(Boolean);
  } catch (error) {
    console.log('No staged files found');
    return [];
  }
}

// Detect which services changed
function getChangedServices(files) {
  const services = new Set();
  
  files.forEach(file => {
    const match = file.match(/backend\/([^\/]+)\//);
    if (match) {
      services.add(match[1]);
    }
  });
  
  return Array.from(services);
}

// Run tests for changed services
function runTests(services) {
  if (services.length === 0) {
    console.log('✅ No backend services changed, skipping tests');
    return true;
  }
  
  console.log(`🧪 Running tests for changed services: ${services.join(', ')}`);
  
  for (const service of services) {
    const servicePath = path.join('backend', service);
    
    try {
      console.log(`\n📦 Testing ${service}...`);
      execSync(`cd ${servicePath} && npm test`, {
        stdio: 'inherit',
      });
      console.log(`✅ ${service} tests passed`);
    } catch (error) {
      console.error(`❌ ${service} tests failed`);
      return false;
    }
  }
  
  return true;
}

// Main execution
const changedFiles = getChangedFiles();
const changedServices = getChangedServices(changedFiles);

if (!runTests(changedServices)) {
  process.exit(1);
}

console.log('\n✅ All tests passed!');
process.exit(0);
