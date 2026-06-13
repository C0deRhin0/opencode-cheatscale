#!/usr/bin/env node

const {
  extractCommand,
  extractToolName,
  findProjectRoot,
  getPlatform,
  hookEventName,
  matchGotchas,
  printHookOutput,
  readGotchas,
  readStdinJson,
} = require('./lib.cjs');

function profileAllowsWarnings() {
  return process.env.OCS_HOOK_PROFILE !== 'minimal';
}

function tokenizeCommand(command) {
  return command.match(/"[^"]*"|'[^']*'|\S+/g) || [];
}

function stripTokenQuotes(token) {
  return token.replace(/^["']|["']$/g, '');
}

function isRecursiveOption(option) {
  const normalized = option.replace(/^-+/, '');
  return /recursive/i.test(normalized) || /[rR]/.test(normalized);
}

function isForceOption(option) {
  const normalized = option.replace(/^-+/, '');
  return /force/i.test(normalized) || /f/.test(normalized);
}

function isShellVarRoot(target, name) {
  return (
    target === `$${name}` ||
    target.startsWith(`$${name}/`) ||
    new RegExp(`^\\$\\{${name}(?:[^A-Za-z0-9_]|$)`).test(target)
  );
}

function isBroadRmTarget(token) {
  const target = stripTokenQuotes(token);
  return (
    target === '/' ||
    target === '.' ||
    target === './' ||
    target.startsWith('./*') ||
    target.startsWith('/*') ||
    target === '~' ||
    target.startsWith('~/') ||
    isShellVarRoot(target, 'HOME') ||
    isShellVarRoot(target, 'PWD') ||
    target === '$(pwd)' ||
    target.startsWith('$(pwd)/') ||
    target === '`pwd`' ||
    target.startsWith('`pwd`/') ||
    target.includes('$(') ||
    target.includes('`') ||
    target === '..' ||
    target.startsWith('../') ||
    target === '*' ||
    target.startsWith('*')
  );
}

function isBroadRmCommand(command) {
  const tokens = tokenizeCommand(command).map(stripTokenQuotes);
  for (let index = 0; index < tokens.length; index += 1) {
    if (tokens[index] !== 'rm' && !tokens[index].endsWith('/rm')) continue;

    let recursive = false;
    let force = false;
    const targets = [];
    const remaining = tokens.slice(index + 1);
    for (let targetIndex = 0; targetIndex < remaining.length; targetIndex += 1) {
      const token = remaining[targetIndex];
      if (token === '--') {
        targets.push(...remaining.slice(targetIndex + 1));
        break;
      }
      if (token.startsWith('-') && token !== '-') {
        if (isRecursiveOption(token)) recursive = true;
        if (isForceOption(token)) force = true;
        continue;
      }

      targets.push(token);
    }

    if (recursive && force && targets.some(isBroadRmTarget)) return true;
  }
  return false;
}

function mentionsSensitivePath(command) {
  const normalized = command.replace(/\\/g, '/');
  return [
    /(?:^|[\s"'`(=;|<>])(?:[^\s"'`;&|<>]*\/)?\.env(?:[.\w-]*)(?=$|[\s"'`);&|<>])/i,
    /(?:^|[\s"'`(=;|<>])[^\s"'`;&|<>]*jira-config\.env(?:\W|$)/i,
    /(?:^|[\s"'`(=;|<>])[^\s"'`;&|<>]*config\.env(?:\W|$)/i,
    /(?:^|[\s"'`(=;|<>])[^\s"'`;&|<>]*\.agents\/local(?:\/|\W|$)/i,
    /(?:^|[\s"'`(=;|<>])[^\s"'`;&|<>]*\.opencode\/local(?:\/|\W|$)/i,
  ].some((pattern) => pattern.test(normalized));
}

function collectStrings(value, depth = 0) {
  if (depth > 4 || value == null) return [];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap((entry) => collectStrings(entry, depth + 1));
  if (typeof value === 'object') {
    return Object.entries(value).flatMap(([key, entry]) => [key, ...collectStrings(entry, depth + 1)]);
  }
  return [];
}

function hasSensitiveToolTarget(input) {
  return collectStrings(input.tool_input || input.args || input).some(mentionsSensitivePath);
}

function isFileAccessTool(toolName) {
  return /^(read|grep|glob|edit|write|replace|read_file|write_file|str_replace|view|apply_patch)$/i.test(toolName);
}

function isSensitiveReadCommand(command) {
  if (!mentionsSensitivePath(command)) return false;
  return (
    /\b(?:cat|less|more|tail|head|grep|rg|sed|awk|python|python3|node|perl|ruby|cp|mv|tar|zip|gzip|curl|wget|scp|rsync|open|source|env|printenv|export|set|bash|sh|zsh|fish|dash)\b/i.test(command) ||
    /(?:^|[;&|]\s*)\.\s+/.test(command) ||
    /[<>]/.test(command)
  );
}

function classifyCommand(command) {
  const normalized = command.replace(/\s+/g, ' ').trim();
  const checks = [
    {
      test: isBroadRmCommand,
      reason: 'Blocked destructive rm -rf command targeting a broad or parent path.',
    },
    {
      test: /\bgit\s+push\b[\s\S]*(?:--tags|--follow-tags|--mirror)\b/,
      reason: 'Blocked git push that may publish tags. Keep drip/* and local harness tags private.',
    },
    {
      test: /\bgit\s+push\b[\s\S]*(?:--force|--force-with-lease)\b/,
      reason: 'Blocked force push. Set OCS_ALLOW_FORCE_PUSH=1 only after explicit human approval.',
      allowEnv: 'OCS_ALLOW_FORCE_PUSH',
    },
    {
      test: /\b(?:npm|pnpm|yarn|bun)\s+publish\b/,
      reason: 'Blocked package publish. Set OCS_ALLOW_PUBLISH=1 only after release approval.',
      allowEnv: 'OCS_ALLOW_PUBLISH',
    },
    {
      test: isSensitiveReadCommand,
      reason: 'Blocked shell access to sensitive local data. Use redacted examples or explicit secret-management tooling.',
    },
  ];

  for (const check of checks) {
    const matched = typeof check.test === 'function' ? check.test(normalized) : check.test.test(normalized);
    if (matched && (!check.allowEnv || process.env[check.allowEnv] !== '1')) {
      return { block: true, reason: check.reason };
    }
  }

  return { block: false, reason: '' };
}

const input = readStdinJson();
const platform = getPlatform();
const eventName = hookEventName(input, 'PreToolUse');
const projectRoot = findProjectRoot(input.cwd || process.cwd());
const command = extractCommand(input);
const toolName = extractToolName(input);

if (isFileAccessTool(toolName) && hasSensitiveToolTarget(input)) {
  printHookOutput(platform, eventName, {
    block: true,
    reason: 'Blocked file-tool access to sensitive local data. Use redacted examples or explicit secret-management tooling.',
    systemMessage: 'Blocked file-tool access to sensitive local data. Use redacted examples or explicit secret-management tooling.',
  });
  process.exit(0);
}

if (!command) {
  printHookOutput(platform, eventName, { suppressOutput: true });
  process.exit(0);
}

const classification = classifyCommand(command);
if (classification.block) {
  printHookOutput(platform, eventName, {
    block: true,
    reason: classification.reason,
    systemMessage: classification.reason,
  });
  process.exit(0);
}

const messages = [];
if (profileAllowsWarnings()) {
  if (/\bgit\s+(commit|push|reset\s+--hard)\b/.test(command)) {
    messages.push('OCS reminder: inspect status/diff before risky git commands and keep drip/* tags local.');
  }

  if (/\bchmod\s+777\b/.test(command)) {
    messages.push('OCS reminder: avoid chmod 777; prefer least-privilege permissions.');
  }

  const matches = matchGotchas(readGotchas(projectRoot), command);
  for (const match of matches.slice(0, 3)) {
    messages.push(`OCS gotcha: ${match.pattern} — ${match.avoidance || match.description}`);
  }
}

if (messages.length > 0) {
  printHookOutput(platform, eventName, {
    systemMessage: messages.join('\n'),
    additionalContext: messages.join('\n'),
  });
  process.exit(0);
}

printHookOutput(platform, eventName, { suppressOutput: true });
