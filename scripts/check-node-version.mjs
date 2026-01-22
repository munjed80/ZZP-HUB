#!/usr/bin/env node

/**
 * Node version guard script
 * Fails fast if Node.js major version is not 20
 * This prevents silent breakage when the build environment uses wrong Node version
 */

const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);

console.log(`Node.js version: ${nodeVersion}`);

if (majorVersion !== 20) {
  console.error(`ERROR: Node.js major version ${majorVersion} detected, but version 20.x is required.`);
  console.error('Please ensure your build environment uses Node.js 20.');
  console.error('Check nixpacks.toml, .nvmrc, or package.json engines configuration.');
  process.exit(1);
}

console.log('✓ Node.js version 20.x verified');
