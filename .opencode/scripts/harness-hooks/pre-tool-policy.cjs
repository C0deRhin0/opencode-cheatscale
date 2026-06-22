#!/usr/bin/env node

const path = require('path');

const {
  extractCommand,
  extractToolName,
  findProjectRoot,
  getPlatform,
  hookEventName,
  matchGotchas,
  printHookOutput,
  readJson,
  readGotchas,
  readStdinJson,
  redact,
  writeJsonAtomic,
  assertNoSymlinkComponents,
} = require('./lib.cjs');

const MAX_SECURITY_EVENT_ENTRIES = 100;

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
    /(?:^|[\s"'`(=;|<>])[^\s"'`;&|<>]*\.npmrc(?:\W|$)/i,
    /(?:^|[\s"'`(=;|<>])[^\s"'`;&|<>]*\.pypirc(?:\W|$)/i,
    /(?:^|[\s"'`(=;|<>])[^\s"'`;&|<>]*\.netrc(?:\W|$)/i,
    /(?:^|[\s"'`(=;|<>])[^\s"'`;&|<>]*\.ssh(?:\/|\W|$)/i,
    /(?:^|[\s"'`(=;|<>])[^\s"'`;&|<>]*id_(?:rsa|dsa|ecdsa|ed25519)(?:\W|$)/i,
    /(?:^|[\s"'`(=;|<>])[^\s"'`;&|<>]*\.aws\/credentials(?:\W|$)/i,
    /(?:^|[\s"'`(=;|<>])[^\s"'`;&|<>]*\.kube\/config(?:\W|$)/i,
    /(?:^|[\s"'`(=;|<>])[^\s"'`;&|<>]*\.config\/gh\/(?:hosts\.yml|config\.yml)(?:\W|$)/i,
    /(?:^|[\s"'`(=;|<>])[^\s"'`;&|<>]*\.docker\/config\.json(?:\W|$)/i,
    /(?:^|[\s"'`(=;|<>])[^\s"'`;&|<>]*\.git-credentials(?:\W|$)/i,
    /(?:^|[\s"'`(=;|<>])[^\s"'`;&|<>]*\.config\/gcloud\/application_default_credentials\.json(?:\W|$)/i,
    /(?:^|[\s"'`(=;|<>])[^\s"'`;&|<>]*\.azure\/accessTokens\.json(?:\W|$)/i,
    /(?:^|[\s"'`(=;|<>])[^\s"'`;&|<>]*\.terraform\.d\/credentials\.tfrc\.json(?:\W|$)/i,
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

function appendSecurityEvent(projectRoot, entry) {
  try {
    const eventPath = path.join(projectRoot, '.agents', 'local', 'security-events', 'blocked-tools.json');
    assertNoSymlinkComponents(projectRoot, eventPath);
    const existing = readJson(eventPath, []);
    const safeExisting = Array.isArray(existing) ? existing : [];
    writeJsonAtomic(eventPath, [...safeExisting, entry].slice(-MAX_SECURITY_EVENT_ENTRIES));
  } catch {
    // Portable policy must never fail open because audit logging failed.
  }
}

const REMOTE_EXEC_ALLOW_ENV = 'OCS_ALLOW_REMOTE_EXEC';
const CHMOD_777_ALLOW_ENV = 'OCS_ALLOW_CHMOD_777';

const knownMalwareIndicators = [
  /45\.148\.10\.215/i,
  /Tcp1000gbps\.sh/i,
  /1710\.rwlp\.be/i,
  /vclgowp/i,
];

function normalizeCommandForSecurity(command) {
  return command.replace(/\s+/g, ' ').trim();
}

function stripShellToken(token) {
  return stripTokenQuotes(token).replace(/[;,)]*$/g, '');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function basenameFromUrl(value) {
  try {
    const url = new URL(value);
    const base = path.posix.basename(url.pathname);
    return base && base !== '/' ? base : '';
  } catch {
    return '';
  }
}

function collectDownloadTargets(command) {
  const targets = new Set();
  const tokens = tokenizeCommand(command).map(stripShellToken).filter(Boolean);

  for (let index = 0; index < tokens.length; index += 1) {
    const commandToken = tokens[index];
    if (!/(?:^|\/)(?:curl|wget)$/.test(commandToken)) continue;

    const downloader = commandToken.endsWith('wget') ? 'wget' : 'curl';
    const segment = [];
    for (let cursor = index + 1; cursor < tokens.length; cursor += 1) {
      const token = tokens[cursor];
      if (['&&', '||', '|', ';'].includes(token)) break;
      segment.push(token);
    }

    for (let cursor = 0; cursor < segment.length; cursor += 1) {
      const token = segment[cursor];
      const next = segment[cursor + 1];

      if (['-o', '--output', '-O', '--output-document'].includes(token) && next && !next.startsWith('-')) {
        targets.add(next);
        cursor += 1;
        continue;
      }

      const outputMatch = token.match(/^(?:--output|--output-document)=([^\s]+)$/);
      if (outputMatch) {
        targets.add(outputMatch[1]);
        continue;
      }

      if (downloader === 'curl' && token === '-O') {
        const urlTarget = segment.slice(cursor + 1).map(basenameFromUrl).find(Boolean);
        if (urlTarget) targets.add(urlTarget);
        continue;
      }

      if (downloader === 'wget' && /^https?:\/\//i.test(token)) {
        const urlTarget = basenameFromUrl(token);
        if (urlTarget) targets.add(urlTarget);
      }
    }
  }

  return Array.from(targets)
    .map(stripShellToken)
    .map((target) => target.replace(/^\.\//, ''))
    .filter((target) => target.length > 0);
}

function isKnownMalwareCommand(command) {
  return knownMalwareIndicators.some((pattern) => pattern.test(command));
}

function hasRemoteFetch(command) {
  return /\b(?:curl|wget)\b/i.test(command) && /https?:\/\//i.test(command);
}

function pipesRemoteContentToShell(command) {
  return /\|\s*(?:sudo\s+)?(?:(?:\/usr\/bin\/env\s+)?(?:sh|bash|zsh|fish|dash)|(?:\/(?:usr\/)?bin\/)(?:sh|bash|zsh|fish|dash))\b/i.test(command);
}

function usesProcessSubstitutionToShell(command) {
  return /(?:\b(?:source|\.|sh|bash|zsh|fish|dash)|(?:\/(?:usr\/)?bin\/)(?:sh|bash|zsh|fish|dash))\s+<\([\s\S]*\b(?:curl|wget)\b[\s\S]*https?:\/\//i.test(command);
}

function executesNamedDownloadTarget(command, targets) {
  return targets.some((target) => {
    const candidates = Array.from(new Set([target, path.posix.basename(target)].filter(Boolean)));
    return candidates.some((candidate) => {
      const escaped = escapeRegExp(candidate);
      const targetPattern = `(?:\\./)?${escaped}`;
      return [
        new RegExp(`\\b(?:sh|bash|zsh|fish|dash|source)\\s+(?:--\\s+)?${targetPattern}(?=$|[\\s;&|])`, 'i'),
        new RegExp(`\\b(?:python3?|node|perl|ruby|php)\\s+(?:--\\s+)?${targetPattern}(?=$|[\\s;&|])`, 'i'),
        new RegExp(`(?:^|[\\s;&|])\\.\\s+${targetPattern}(?=$|[\\s;&|])`, 'i'),
        new RegExp(`\\bchmod\\s+(?:777|[0-7]*7[0-7]*|\\+x)\\b[\\s\\S]*${targetPattern}[\\s\\S]*(?:\\b(?:sh|bash|zsh|fish|dash|nohup|setsid|source)\\b|(?:^|[\\s;&|])\\./${escaped})`, 'i'),
        new RegExp(`\\b(?:nohup|setsid)\\b[\\s\\S]*${targetPattern}(?=$|[\\s>&|])`, 'i'),
        new RegExp(`(?:^|[\\s;&|])\\./${escaped}(?=$|[\\s;&|])`, 'i'),
      ].some((pattern) => pattern.test(command));
    });
  });
}

function usesInlineNetworkExec(command) {
  return /\b(?:python3?|node|perl|ruby)\b[\s\S]*(?:https?:\/\/|urllib\.request|requests\.get|fetch\(|http\.get|https\.get|Net::HTTP|open-uri)[\s\S]*(?:os\.system|subprocess|exec\(|eval\(|child_process|spawn\(|system\()/i.test(command);
}

function decodesPayloadToShell(command) {
  return /\b(?:base64|xxd)\b[\s\S]*(?:--decode|-d|-r)[\s\S]*\|\s*(?:sh|bash|zsh|fish|dash)\b/i.test(command);
}

function opensShellOverNetwork(command) {
  return /\/dev\/tcp\//i.test(command) || /\b(?:nc|netcat|ncat|socat)\b[\s\S]*(?:\s-e\s|exec:|system:|\/bin\/(?:sh|bash)|\|\s*(?:sh|bash|zsh|fish|dash)\b)/i.test(command);
}

function executesDownloadedPayload(command) {
  const downloadTargets = collectDownloadTargets(command);
  const shellExecutesPayload = executesNamedDownloadTarget(command, downloadTargets);
  const makesExecutable = /\bchmod\s+(?:777|[0-7]*7[0-7]*|\+x)\b/i.test(command);
  const executesAfterChmod = makesExecutable && executesNamedDownloadTarget(command, downloadTargets);
  const backgroundsTempPayload = /\b(?:nohup|setsid)\b[\s\S]*(?:\/tmp\/|\$[A-Za-z_][A-Za-z0-9_]*)/i.test(command);
  const tmpOrScriptExecution = /\/tmp\/[\s\S]*\b(?:chmod|sh|bash|zsh|fish|dash|nohup|setsid|source)\b/i.test(command);

  return shellExecutesPayload || executesAfterChmod || backgroundsTempPayload || tmpOrScriptExecution;
}

function isRemoteCodeExecutionCommand(command) {
  return (
    (hasRemoteFetch(command) && (
      pipesRemoteContentToShell(command) ||
      usesProcessSubstitutionToShell(command) ||
      executesDownloadedPayload(command)
    )) ||
    usesInlineNetworkExec(command) ||
    decodesPayloadToShell(command) ||
    opensShellOverNetwork(command)
  );
}

function classifyShellSecurityRisk(command) {
  const normalized = normalizeCommandForSecurity(command);
  if (!normalized) return { block: false, reason: '' };

  if (isKnownMalwareCommand(normalized)) {
    return {
      block: true,
      reason: 'Blocked known malware or botnet payload indicator in shell command.',
    };
  }

  if (isRemoteCodeExecutionCommand(normalized)) {
    return {
      block: true,
      reason: `Blocked remote or encoded payload execution pattern. Set ${REMOTE_EXEC_ALLOW_ENV}=1 only after manual verification.`,
      allowEnv: REMOTE_EXEC_ALLOW_ENV,
    };
  }

  if (/\bchmod\s+777\b/i.test(normalized)) {
    return {
      block: true,
      reason: `Blocked chmod 777. Use least-privilege permissions such as chmod 700 or chmod +x, or set ${CHMOD_777_ALLOW_ENV}=1 after explicit review.`,
      allowEnv: CHMOD_777_ALLOW_ENV,
    };
  }

  return { block: false, reason: '' };
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
    {
      test: (value) => {
        const risk = classifyShellSecurityRisk(value);
        return risk.block && (!risk.allowEnv || process.env[risk.allowEnv] !== '1');
      },
      reason: classifyShellSecurityRisk(normalized).reason,
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
  appendSecurityEvent(projectRoot, {
    timestamp: new Date().toISOString(),
    tool: toolName || 'unknown',
    source: 'portable-pre-tool-policy',
    reason: 'sensitive local or credential path in file-tool target',
    input: redact(input.tool_input || input.args || input),
  });
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
  appendSecurityEvent(projectRoot, {
    timestamp: new Date().toISOString(),
    tool: toolName || 'unknown',
    source: 'portable-pre-tool-policy',
    reason: classification.reason,
    command: redact(command),
  });
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
