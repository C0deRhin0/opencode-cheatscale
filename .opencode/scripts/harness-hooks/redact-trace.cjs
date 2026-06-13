#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const {
  MAX_TRACE_ENTRIES,
  MAX_TRACE_OUTPUT_BYTES,
  findProjectRoot,
  getPlatform,
  hookEventName,
  localTracePath,
  printHookOutput,
  readJson,
  readStdinJson,
  redact,
  writeJsonAtomic,
} = require('./lib.cjs');

const input = readStdinJson();
const platform = getPlatform();
const eventName = hookEventName(input, 'PostToolUse');

function truncateTraceValue(value) {
  let serialized;
  try {
    serialized = typeof value === 'string' ? value : JSON.stringify(value);
  } catch {
    serialized = String(value);
  }
  if (typeof serialized !== 'string') serialized = String(serialized);
  if (Buffer.byteLength(serialized, 'utf8') <= MAX_TRACE_OUTPUT_BYTES) return value;
  return `${serialized.slice(0, MAX_TRACE_OUTPUT_BYTES)}...[TRUNCATED]`;
}

function sleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function withTraceLock(tracePath, callback) {
  const lockPath = `${tracePath}.lock`;
  fs.mkdirSync(path.dirname(tracePath), { recursive: true });
  for (let attempt = 0; attempt < 40; attempt += 1) {
    let handle;
    try {
      handle = fs.openSync(lockPath, 'wx');
      try {
        return callback();
      } finally {
        fs.closeSync(handle);
        fs.rmSync(lockPath, { force: true });
      }
    } catch (error) {
      if (handle) fs.closeSync(handle);
      if (error && error.code !== 'EEXIST') throw error;
      try {
        const ageMs = Date.now() - fs.statSync(lockPath).mtimeMs;
        if (ageMs > 30000) fs.rmSync(lockPath, { force: true });
      } catch {
        // Lock disappeared between attempts.
      }
      sleep(25);
    }
  }
  throw new Error('Timed out waiting for trace lock');
}

if (process.env.OCS_TRACE_CAPTURE !== '1') {
  printHookOutput(platform, eventName, { suppressOutput: true });
  process.exit(0);
}

try {
  const projectRoot = findProjectRoot(input.cwd || process.cwd());
  const tracePath = localTracePath(projectRoot);
  withTraceLock(tracePath, () => {
    const existing = readJson(tracePath, []);
    const next = [
      ...(Array.isArray(existing) ? existing : []),
      {
        timestamp: new Date().toISOString(),
        sessionId: input.session_id || input.sessionID || '',
        event: input.hook_event_name || input.hookEventName || '',
        tool: input.tool_name || input.tool || '',
        input: truncateTraceValue(redact(input.tool_input || input.args || {})),
        response: truncateTraceValue(redact(input.tool_response || input.output || {})),
      },
    ].slice(-MAX_TRACE_ENTRIES);

    writeJsonAtomic(tracePath, next);
  });
} catch {
  // Trace capture is best-effort and must never interrupt the host tool flow.
}
printHookOutput(platform, eventName, { suppressOutput: true });
