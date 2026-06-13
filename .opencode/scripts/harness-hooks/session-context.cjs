#!/usr/bin/env node

const { findProjectRoot, getPlatform, hookEventName, printHookOutput, readStdinJson } = require('./lib.cjs');

const input = readStdinJson();
const platform = getPlatform();
const eventName = hookEventName(input, 'SessionStart');
const projectRoot = findProjectRoot(input.cwd || process.cwd());

const context = [
  'OpenCode CheatScale portable harness is installed for this workspace.',
  `Project root: ${projectRoot}`,
  'Use AGENTS.md for shared instructions and .agents/skills for portable skills.',
  'Generated platform adapters are thin wrappers; do not copy secrets, traces, or local gotcha state into source control.',
].join('\n');

printHookOutput(platform, eventName, {
  systemMessage: 'OCS portable harness loaded.',
  additionalContext: context,
});
