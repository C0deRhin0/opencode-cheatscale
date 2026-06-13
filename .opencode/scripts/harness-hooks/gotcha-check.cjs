#!/usr/bin/env node

const {
  extractCommand,
  findProjectRoot,
  getPlatform,
  hookEventName,
  matchGotchas,
  parseArgs,
  printHookOutput,
  readGotchas,
  readStdinJson,
} = require('./lib.cjs');

const args = parseArgs(process.argv.slice(2));
const input = readStdinJson();
const platform = getPlatform();
const eventName = hookEventName(input, 'PreToolUse');
const projectRoot = findProjectRoot(input.cwd || process.cwd());
const command = String(args.command || extractCommand(input) || args._.join(' ')).trim();
const matches = command ? matchGotchas(readGotchas(projectRoot), command) : [];

if (args.json) {
  process.stdout.write(`${JSON.stringify({ matches }, null, 2)}\n`);
  process.exit(0);
}

if (input.hook_event_name || input.hookEventName) {
  if (matches.length === 0) {
    printHookOutput(platform, eventName, { suppressOutput: true });
    process.exit(0);
  }

  const message = matches
    .slice(0, 5)
    .map((match) => `OCS gotcha: ${match.pattern} — ${match.avoidance || match.description}`)
    .join('\n');
  printHookOutput(platform, eventName, { systemMessage: message, additionalContext: message });
  process.exit(0);
}

if (matches.length === 0) {
  process.stdout.write('No matching gotchas.\n');
  process.exit(0);
}

for (const match of matches) {
  process.stdout.write(`${match.pattern}: ${match.avoidance || match.description}\n`);
}
