const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..', '..');
const localRoot = path.join(root, 'local');
const statePath = path.join(localRoot, 'gotchas.json');
const archivePath = path.join(localRoot, 'gotchas-archive.json');
const viewPath = path.join(root, 'skills', 'gotcha', 'gotchas.md');
const lockPath = path.join(localRoot, 'gotchas.lock');
const maxGotchas = 50;

function ensureLocalRoot() {
  fs.mkdirSync(localRoot, { recursive: true });
}

function redact(value) {
  return String(value || '')
    .replace(/sk-[A-Za-z0-9_-]{10,}/g, '[REDACTED_SECRET]')
    .replace(/gh[pousr]_[A-Za-z0-9_]{10,}/g, '[REDACTED_SECRET]')
    .replace(/AKIA[0-9A-Z]{16}/g, '[REDACTED_SECRET]')
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]{10,}/gi, 'Bearer [REDACTED_SECRET]')
    .replace(/Basic\s+[A-Za-z0-9+/=-]{10,}/gi, 'Basic [REDACTED_SECRET]')
    .replace(/https?:\/\/([^\s:/?#]+):([^\s@]+)@/gi, 'https://[REDACTED_SECRET]@')
    .replace(/curl\s+-u\s+[^\s:]+:[^\s]+/gi, 'curl -u [REDACTED_SECRET]')
    .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, '[REDACTED_PRIVATE_KEY]')
    .replace(/(token|api[_-]?key|password|secret)=([^\s&]+)/gi, '$1=[REDACTED_SECRET]')
    .replace(/\/Users\/[^\s`'"]+/g, '[REDACTED_PATH]');
}

function slugify(value) {
  return redact(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'gotcha';
}

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

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJsonAtomic(filePath, value) {
  ensureLocalRoot();
  const tmp = `${filePath}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tmp, filePath);
}

function withLock(fn) {
  ensureLocalRoot();
  let lock;
  try {
    lock = fs.openSync(lockPath, 'wx');
  } catch {
    try {
      const ageMs = Date.now() - fs.statSync(lockPath).mtimeMs;
      if (ageMs > 5 * 60 * 1000) {
        fs.rmSync(lockPath, { force: true });
        lock = fs.openSync(lockPath, 'wx');
      }
    } catch {
      // Fall through to the lock error below.
    }
  }

  if (!lock) {
    throw new Error('Gotcha state is locked by another process. Retry in a moment.');
  }

  try {
    return fn();
  } finally {
    if (lock) fs.closeSync(lock);
    fs.rmSync(lockPath, { force: true });
  }
}

function readState() {
  return readJson(statePath, {
    version: '1.0.0',
    updated: new Date(0).toISOString(),
    gotchas: [],
  });
}

function addGotcha(input) {
  return withLock(() => {
    const state = readState();
    const now = new Date().toISOString();
    const pattern = slugify(input.pattern || input.description || input.trigger || 'gotcha');
    const existing = state.gotchas.find((entry) => entry.pattern === pattern);

    if (existing) {
      existing.occurrenceCount = Number(existing.occurrenceCount || 1) + 1;
      existing.lastSeen = now;
      existing.description = redact(input.description || existing.description);
      existing.trigger = redact(input.trigger || existing.trigger || '');
      existing.avoidance = redact(input.avoidance || existing.avoidance || '');
      state.updated = now;
      writeJsonAtomic(statePath, state);
      return existing;
    }

    const entry = {
      id: crypto.randomUUID(),
      pattern,
      description: redact(input.description || pattern),
      category: redact(input.category || 'workflow'),
      trigger: redact(input.trigger || ''),
      avoidance: redact(input.avoidance || ''),
      occurrenceCount: 1,
      firstOccurred: now,
      lastSeen: now,
      relatedConfig: redact(input.relatedConfig || ''),
    };

    const active = Array.isArray(state.gotchas) ? state.gotchas : [];
    const next = [...active, entry];
    if (next.length > maxGotchas) {
      const pruned = next.splice(0, next.length - maxGotchas);
      const archive = readJson(archivePath, { version: '1.0.0', archived: [] });
      archive.archived = [...(archive.archived || []), ...pruned];
      writeJsonAtomic(archivePath, archive);
    }

    state.gotchas = next;
    state.updated = now;
    writeJsonAtomic(statePath, state);
    return entry;
  });
}

function findMatches(command) {
  const normalized = redact(command).toLowerCase();
  const state = readState();
  return (state.gotchas || []).filter((entry) => {
    const fields = [entry.pattern, entry.trigger, entry.description].filter(Boolean).join(' ').toLowerCase();
    return fields
      .split(/[,;|]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .some((item) => normalized.includes(item) || item.includes(normalized));
  });
}

function generateView() {
  const state = readState();
  const lines = [
    '# Gotcha View',
    '',
    '> Generated from local-only gotcha state. Do not commit user-specific entries.',
    '',
    `Updated: ${state.updated || new Date().toISOString()}`,
    '',
  ];

  for (const entry of state.gotchas || []) {
    lines.push(`## ${entry.pattern}`);
    lines.push('');
    lines.push(`- Category: ${entry.category || 'workflow'}`);
    lines.push(`- Trigger: ${entry.trigger || 'n/a'}`);
    lines.push(`- Avoidance: ${entry.avoidance || entry.description}`);
    lines.push(`- Occurrences: ${entry.occurrenceCount || 1}`);
    lines.push(`- Last seen: ${entry.lastSeen || 'unknown'}`);
    lines.push('');
  }

  fs.mkdirSync(path.dirname(viewPath), { recursive: true });
  fs.writeFileSync(viewPath, `${lines.join('\n')}\n`);
  return viewPath;
}

module.exports = {
  addGotcha,
  findMatches,
  generateView,
  parseArgs,
  readState,
  redact,
  statePath,
};
