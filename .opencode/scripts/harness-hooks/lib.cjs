const fs = require('fs');
const path = require('path');

const MANAGED_MARKER = 'OCS-PORTABLE-MANAGED';
const MAX_TRACE_ENTRIES = 50;
const MAX_TRACE_OUTPUT_BYTES = 2000;

function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith('--')) {
      args._.push(item);
      continue;
    }
    const key = item.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    index += 1;
  }
  return args;
}

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function readStdinJson() {
  const raw = readStdin().trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tmp, filePath);
}

function pathIsInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function assertNoSymlinkComponents(projectRoot, filePath) {
  if (!fs.existsSync(projectRoot)) throw new Error(`Project root does not exist: ${projectRoot}`);
  const realProjectRoot = fs.realpathSync(projectRoot);
  const relative = path.relative(projectRoot, filePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing local state path outside project: ${filePath}`);
  }

  let current = projectRoot;
  for (const part of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    if (!fs.existsSync(current)) break;

    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink()) throw new Error(`Refusing local state symlink path: ${filePath}`);
    if (stat.isDirectory() && !pathIsInside(realProjectRoot, fs.realpathSync(current))) {
      throw new Error(`Refusing local state path outside project: ${filePath}`);
    }
  }

  let existingParent = path.dirname(filePath);
  while (!fs.existsSync(existingParent)) {
    const nextParent = path.dirname(existingParent);
    if (nextParent === existingParent) break;
    existingParent = nextParent;
  }
  if (!pathIsInside(realProjectRoot, fs.realpathSync(existingParent))) {
    throw new Error(`Refusing local state path outside project: ${filePath}`);
  }
}

function redact(value) {
  if (typeof value === 'string') {
    return value
      .replace(/sk-[A-Za-z0-9_-]{10,}/g, '[REDACTED_SECRET]')
      .replace(/gh[pousr]_[A-Za-z0-9_]{10,}/g, '[REDACTED_SECRET]')
      .replace(/AKIA[0-9A-Z]{16}/g, '[REDACTED_SECRET]')
      .replace(/Bearer\s+[A-Za-z0-9._~+/=-]{10,}/gi, 'Bearer [REDACTED_SECRET]')
      .replace(/Basic\s+[A-Za-z0-9+/=-]{10,}/gi, 'Basic [REDACTED_SECRET]')
      .replace(/xox[baprs]-[A-Za-z0-9-]{10,}/g, '[REDACTED_SECRET]')
      .replace(/glpat-[A-Za-z0-9_-]{10,}/g, '[REDACTED_SECRET]')
      .replace(/AIza[0-9A-Za-z_-]{20,}/g, '[REDACTED_SECRET]')
      .replace(/https?:\/\/([^\s:/?#]+):([^\s@]+)@/gi, 'https://[REDACTED_SECRET]@')
      .replace(/curl\s+-u\s+[^\s:]+:[^\s]+/gi, 'curl -u [REDACTED_SECRET]')
      .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, '[REDACTED_PRIVATE_KEY]')
      .replace(/(token|api[_-]?key|password|secret|client[_-]?secret|refresh[_-]?token|access[_-]?token|jira[_-]?api[_-]?token|atlassian[_-]?token)\s*[=:]\s*([^\s&]+)/gi, '$1=[REDACTED_SECRET]')
      .replace(/\/Users\/[^\s`'"]+/g, '[REDACTED_PATH]');
  }

  if (Array.isArray(value)) return value.map(redact);

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        /token|key|password|secret|authorization|client_secret|refresh_token|access_token|jira|atlassian/i.test(key) ? '[REDACTED_SECRET]' : redact(entry),
      ])
    );
  }

  return value;
}

function findProjectRoot(start = process.cwd()) {
  let current = path.resolve(start);
  let gitFallback = '';
  while (true) {
    if (
      fs.existsSync(path.join(current, '.agents', 'harness-hooks')) ||
      fs.existsSync(path.join(current, '.agents', 'harness-adapters.json')) ||
      fs.existsSync(path.join(current, '.opencode'))
    ) {
      return current;
    }

    if (!gitFallback && fs.existsSync(path.join(current, '.git'))) gitFallback = current;

    const parent = path.dirname(current);
    if (parent === current) return gitFallback || path.resolve(start);
    current = parent;
  }
}

function extractToolName(input) {
  return String(input.tool_name || input.tool || input.toolName || input.name || '');
}

function extractCommand(input) {
  const candidates = [
    input.command,
    input.tool_input && input.tool_input.command,
    input.tool_input && input.tool_input.cmd,
    input.tool_input && input.tool_input.shell_command,
    input.tool_input && input.tool_input.query,
    input.tool_input && input.tool_input.description,
    input.tool_input && input.tool_input.args,
    input.tool_input && input.tool_input.command_line,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
    if (Array.isArray(candidate) && candidate.length > 0) return candidate.map(String).join(' ').trim();
  }

  return '';
}

function getPlatform(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const platform = String(args.platform || 'generic').toLowerCase();
  if (['claude', 'codex', 'gemini', 'generic'].includes(platform)) return platform;
  return 'generic';
}

function hookEventName(input, fallback = 'PreToolUse') {
  return String(input.hook_event_name || input.hookEventName || fallback);
}

function formatHookOutput(platform, eventName, result = {}) {
  const payload = {};
  const additionalContext = result.additionalContext || result.systemMessage || '';

  if (result.block) {
    payload.decision = platform === 'gemini' ? 'deny' : 'block';
    payload.reason = result.reason || 'Blocked by portable harness policy.';
  }

  if (result.systemMessage) payload.systemMessage = result.systemMessage;
  if (result.continue === false) payload.continue = false;
  if (result.stopReason) payload.stopReason = result.stopReason;
  if (result.suppressOutput) payload.suppressOutput = true;

  if (platform === 'claude' || platform === 'codex' || platform === 'generic') {
    if (result.block || additionalContext || result.updatedInput) {
      payload.hookSpecificOutput = {
        hookEventName: eventName,
      };
      if (result.block) {
        payload.hookSpecificOutput.permissionDecision = 'deny';
        payload.hookSpecificOutput.permissionDecisionReason = payload.reason;
      }
      if (additionalContext) payload.hookSpecificOutput.additionalContext = additionalContext;
      if (result.updatedInput) {
        payload.hookSpecificOutput.permissionDecision = 'allow';
        payload.hookSpecificOutput.updatedInput = result.updatedInput;
      }
    }
  } else if (platform === 'gemini' && (additionalContext || result.updatedInput)) {
    payload.hookSpecificOutput = {};
    if (additionalContext) payload.hookSpecificOutput.additionalContext = additionalContext;
    if (result.updatedInput) payload.hookSpecificOutput.tool_input = result.updatedInput;
  }

  return payload;
}

function printHookOutput(platform, eventName, result = {}) {
  process.stdout.write(`${JSON.stringify(formatHookOutput(platform, eventName, result))}\n`);
}

function gotchaPaths(projectRoot) {
  return [
    process.env.OCS_GOTCHAS_PATH,
    path.join(projectRoot, '.opencode', 'local', 'gotchas.json'),
    path.join(projectRoot, '.agents', 'local', 'gotchas.json'),
  ].filter(Boolean);
}

function readGotchas(projectRoot) {
  for (const candidate of gotchaPaths(projectRoot)) {
    const state = readJson(candidate, null);
    if (state && Array.isArray(state.gotchas)) return state.gotchas;
  }
  return [];
}

function matchGotchas(gotchas, command) {
  const normalized = redact(command).toLowerCase();
  return gotchas.filter((entry) => {
    const haystack = [entry.pattern, entry.trigger, entry.description]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (!haystack) return false;
    return haystack
      .split(/[,;|]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .some((item) => normalized.includes(item) || item.includes(normalized));
  });
}

function localTracePath(projectRoot) {
  const tracePath = path.join(projectRoot, '.agents', 'local', 'execution-traces', 'ring-buffer.json');
  assertNoSymlinkComponents(projectRoot, tracePath);
  return tracePath;
}

module.exports = {
  MANAGED_MARKER,
  MAX_TRACE_ENTRIES,
  MAX_TRACE_OUTPUT_BYTES,
  assertNoSymlinkComponents,
  extractCommand,
  extractToolName,
  findProjectRoot,
  formatHookOutput,
  getPlatform,
  hookEventName,
  localTracePath,
  matchGotchas,
  parseArgs,
  printHookOutput,
  readGotchas,
  readJson,
  readStdinJson,
  redact,
  writeJsonAtomic,
};
