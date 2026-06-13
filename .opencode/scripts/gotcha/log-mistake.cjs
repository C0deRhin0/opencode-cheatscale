#!/usr/bin/env node

const { addGotcha, generateView, parseArgs, readState } = require('./lib.cjs');

const args = parseArgs(process.argv.slice(2));
const action = args._[0] || 'log';

if (action === 'list') {
  const state = readState();
  for (const entry of state.gotchas || []) {
    console.log(`${entry.pattern}: ${entry.avoidance || entry.description} (${entry.occurrenceCount || 1})`);
  }
  process.exit(0);
}

if (action !== 'log') {
  console.error('Usage: log-mistake.cjs log --pattern <pattern> --description <description> [--trigger <trigger>] [--avoidance <avoidance>]');
  process.exit(1);
}

if (!args.pattern && !args.description) {
  console.error('Missing --pattern or --description.');
  process.exit(1);
}

try {
  const entry = addGotcha({
    pattern: args.pattern,
    description: args.description,
    category: args.category,
    trigger: args.trigger,
    avoidance: args.avoidance,
    relatedConfig: args['related-config'],
  });
  if (args['generate-view']) generateView();
  console.log(`Logged gotcha: ${entry.pattern}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
