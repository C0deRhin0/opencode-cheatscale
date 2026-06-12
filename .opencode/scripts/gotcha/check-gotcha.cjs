#!/usr/bin/env node

const { findMatches, parseArgs, redact } = require('./lib.cjs');

const args = parseArgs(process.argv.slice(2));
const command = args.command || args._.slice(1).join(' ') || args._.join(' ');

if (!command) {
  console.error('Usage: check-gotcha.cjs check --command "git commit"');
  process.exit(1);
}

const matches = findMatches(command);

if (matches.length === 0) {
  console.log(`No gotcha match for: ${redact(command)}`);
  process.exit(0);
}

console.log(`Gotcha matches for: ${redact(command)}`);
for (const match of matches.slice(0, 5)) {
  console.log(`- ${match.pattern}: ${match.avoidance || match.description}`);
}
