#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { assertNoSymlinkComponents, redact } = require('../harness-hooks/lib.cjs');
const {
  LOCAL_ROOT,
  MAX_BENCHMARK_TIMEOUT_MS,
  MIN_BENCHMARKS,
  ROOT,
} = require('./CONSTANTS.cjs');

const WORKSPACE_ROOT = path.resolve(ROOT, '..');
const benchmarkDir = path.join(LOCAL_ROOT, 'benchmarks');
const evaluationDir = path.join(LOCAL_ROOT, 'meta-harness', 'evaluations');
const SAFE_NODE_BENCHMARK_SCRIPTS = new Set([
  'scripts/harness-health.cjs',
  'scripts/loop-plan.cjs',
  'scripts/loop-report.cjs',
  'scripts/portable-harness.cjs',
  'scripts/skill-builder/validate-skill.cjs',
]);

function parseArgs(argv) {
  return {
    approvedByUser: argv.includes('--approved-by-user'),
  };
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function parseScalar(value) {
  const trimmed = String(value || '').trim().replace(/^['"]|['"]$/g, '');
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (/^-?\d+$/.test(trimmed)) return Number(trimmed);
  return trimmed;
}

function parseSimpleYaml(content) {
  const out = {};
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    out[match[1]] = parseScalar(match[2]);
  }
  return out;
}

function loadBenchmark(filePath) {
  assertBenchmarkSpecPath(filePath);
  const content = readText(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const spec = ext === '.json' ? JSON.parse(content) : parseSimpleYaml(content);
  return {
    name: spec.name || path.basename(filePath, ext),
    description: spec.description || '',
    category: spec.category || 'general',
    cwd: spec.cwd || '.',
    command: spec.command,
    args: Array.isArray(spec.args) ? spec.args.map(String) : [],
    shell: spec.shell === true,
    expectedExitCode: Number.isInteger(spec.expectedExitCode) ? spec.expectedExitCode : 0,
    expectedStdoutIncludes: spec.expectedStdoutIncludes || '',
    expectedStderrIncludes: spec.expectedStderrIncludes || '',
    timeoutMs: Math.min(Number(spec.timeoutMs || 30000), MAX_BENCHMARK_TIMEOUT_MS),
    allowDestructive: spec.allowDestructive === true,
    source: path.relative(ROOT, filePath),
  };
}

function pathIsInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function assertBenchmarkSpecPath(filePath) {
  assertNoSymlinkComponents(ROOT, filePath);
  const stat = fs.lstatSync(filePath);
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new Error('Benchmark spec must be a regular non-symlink file.');
  }
  const realBenchmarkDir = fs.realpathSync(benchmarkDir);
  const realFilePath = fs.realpathSync(filePath);
  if (!pathIsInside(realBenchmarkDir, realFilePath)) {
    throw new Error('Benchmark spec real path escapes the benchmark directory.');
  }
}

function resolveCwd(spec) {
  const candidate = path.resolve(ROOT, spec.cwd || '.');
  if (!pathIsInside(WORKSPACE_ROOT, candidate)) {
    throw new Error(`Benchmark cwd escapes workspace: ${spec.cwd}`);
  }
  if (!fs.existsSync(candidate) || !fs.statSync(candidate).isDirectory()) {
    throw new Error(`Benchmark cwd is not a directory: ${spec.cwd}`);
  }
  assertNoSymlinkComponents(WORKSPACE_ROOT, candidate);
  const realWorkspaceRoot = fs.realpathSync(WORKSPACE_ROOT);
  const realCandidate = fs.realpathSync(candidate);
  if (!pathIsInside(realWorkspaceRoot, realCandidate)) {
    throw new Error(`Benchmark cwd escapes workspace through a symlink: ${spec.cwd}`);
  }
  return candidate;
}

function tokenizeCommand(command) {
  return String(command || '').match(/"[^"]*"|'[^']*'|\S+/g) || [];
}

function stripTokenQuotes(token) {
  return String(token || '').replace(/^["']|["']$/g, '');
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

function isBroadRmTokens(rawTokens) {
  const tokens = rawTokens.map(stripTokenQuotes);
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

function isDangerousCommand(command, tokens = tokenizeCommand(command)) {
  if (isBroadRmTokens(tokens)) return true;
  return [
    /\bgit\s+push\b/,
    /\b(?:npm|pnpm|yarn|bun)\s+publish\b/,
    /\bjira-delete\b/,
    /\b(?:curl|wget|nc|netcat|ssh|scp|rsync)\b/,
    /(?:^|[\s"'`(=;|<>])(?:[^\s"'`;&|<>]*\/)?\.env(?:[.\w-]*)(?=$|[\s"'`);&|<>])/i,
    /(?:^|[\s"'`(=;|<>])[^\s"'`;&|<>]*(?:jira-config\.env|config\.env)(?:\W|$)/i,
    /(?:^|[\s"'`(=;|<>])[^\s"'`;&|<>]*\.(?:agents|opencode)\/local(?:\/|\W|$)/i,
    /credential|secret|password|access[_-]?token|refresh[_-]?token/i,
  ].some((pattern) => pattern.test(command));
}

function toPosix(value) {
  return String(value || '').split(path.sep).join('/');
}

function isNodeCommand(command) {
  const base = path.basename(String(command || '')).toLowerCase();
  return base === 'node' || path.resolve(command) === process.execPath;
}

function normalizeScriptArg(value) {
  const normalized = toPosix(path.normalize(String(value || '')));
  if (!normalized || normalized.startsWith('../') || normalized === '..' || path.isAbsolute(value)) return '';
  return normalized;
}

function isAllowlistedScript(script) {
  if (!SAFE_NODE_BENCHMARK_SCRIPTS.has(script)) return false;
  const expectedPath = path.join(ROOT, ...script.split('/'));
  try {
    assertNoSymlinkComponents(ROOT, expectedPath);
    if (!fs.existsSync(expectedPath) || !fs.statSync(expectedPath).isFile()) return false;
    const realRoot = fs.realpathSync(ROOT);
    const realScript = fs.realpathSync(expectedPath);
    return pathIsInside(realRoot, realScript) && toPosix(path.relative(realRoot, realScript)) === script;
  } catch {
    return false;
  }
}

function isAllowedTargetValue(value) {
  return /^(portable|claude|codex|gemini|all)(,(portable|claude|codex|gemini|all))*$/.test(value);
}

function isAllowedPortableHarnessArgs(args) {
  if (!args.includes('--dry-run')) return false;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--dry-run') continue;
    if (arg === '--target' || arg === '-t') {
      const value = args[index + 1];
      if (!value || !isAllowedTargetValue(value)) return false;
      index += 1;
      continue;
    }
    if (arg.startsWith('--target=')) {
      if (!isAllowedTargetValue(arg.slice('--target='.length))) return false;
      continue;
    }
    return false;
  }
  return true;
}

function isAllowedNodeScriptBenchmark(args) {
  if (args[0] === '--check') {
    const script = normalizeScriptArg(args[1]);
    return args.length === 2 && isAllowlistedScript(script);
  }

  const script = normalizeScriptArg(args[0]);
  if (!isAllowlistedScript(script)) return false;
  if (script === 'scripts/harness-health.cjs') return args.length === 1;
  if (script === 'scripts/loop-report.cjs') return args.length === 1;
  if (script === 'scripts/loop-plan.cjs') return !args.includes('--write-local');
  if (script === 'scripts/skill-builder/validate-skill.cjs') return args.length === 2 && args[1] === 'validate';
  if (script === 'scripts/portable-harness.cjs') return isAllowedPortableHarnessArgs(args.slice(1));
  return false;
}

function isAllowedUnapprovedBenchmark(spec, cwd) {
  if (spec.shell || !isNodeCommand(spec.command)) return false;
  if (fs.realpathSync(cwd) !== fs.realpathSync(ROOT)) return false;
  return isAllowedNodeScriptBenchmark(spec.args);
}

function benchmarkEnv() {
  const allowedKeys = [
    'PATH',
    'HOME',
    'TMPDIR',
    'TEMP',
    'TMP',
    'SHELL',
    'USER',
    'LOGNAME',
    'LANG',
    'LC_ALL',
    'NODE_ENV',
    'CI',
  ];
  const env = {};
  for (const key of allowedKeys) {
    if (typeof process.env[key] === 'string') env[key] = process.env[key];
  }
  env.OCS_TRACE_CAPTURE = '0';
  return env;
}

function summarizeOutput(value) {
  const text = String(value || '');
  return text.length > 2000 ? `${text.slice(0, 2000)}...[TRUNCATED]` : text;
}

function runBenchmark(spec, options) {
  if (!spec.command || typeof spec.command !== 'string') {
    return {
      name: spec.name,
      category: spec.category,
      source: spec.source,
      status: 'FAIL',
      reason: 'Benchmark is missing a command string.',
    };
  }

  const commandTokens = spec.shell ? tokenizeCommand(spec.command) : [spec.command, ...spec.args];
  const commandText = commandTokens.join(' ');
  if (spec.shell && !options.approvedByUser) {
    return {
      name: spec.name,
      category: spec.category,
      source: spec.source,
      status: 'FAIL',
      reason: 'Shell benchmarks require --approved-by-user.',
    };
  }

  if (spec.allowDestructive && !options.approvedByUser) {
    return {
      name: spec.name,
      category: spec.category,
      source: spec.source,
      status: 'FAIL',
      reason: 'Destructive benchmarks require --approved-by-user.',
    };
  }

  if (!spec.shell && spec.args.length === 0 && /\s/.test(spec.command.trim())) {
    return {
      name: spec.name,
      category: spec.category,
      source: spec.source,
      status: 'FAIL',
      reason: 'Benchmark command must use an args array or shell:true with approval.',
    };
  }

  if (!spec.allowDestructive && isDangerousCommand(commandText, commandTokens)) {
    return {
      name: spec.name,
      category: spec.category,
      source: spec.source,
      status: 'FAIL',
      reason: 'Benchmark command was blocked by destructive-command policy.',
    };
  }

  let cwd;
  try {
    cwd = resolveCwd(spec);
  } catch (error) {
    return {
      name: spec.name,
      category: spec.category,
      source: spec.source,
      status: 'FAIL',
      reason: error.message,
    };
  }

  const useSafeNodeRuntime = !options.approvedByUser && isAllowedUnapprovedBenchmark(spec, cwd);
  if (!options.approvedByUser && !useSafeNodeRuntime) {
    return {
      name: spec.name,
      category: spec.category,
      source: spec.source,
      status: 'FAIL',
      reason: 'Benchmark command is not in the unapproved safe-command allowlist.',
    };
  }

  const commandToRun = useSafeNodeRuntime ? process.execPath : spec.command;
  const result = spec.shell ? spawnSync(spec.command, {
    cwd,
    encoding: 'utf8',
    shell: true,
    timeout: spec.timeoutMs,
    env: benchmarkEnv(),
  }) : spawnSync(commandToRun, spec.args, {
    cwd,
    encoding: 'utf8',
    shell: false,
    timeout: spec.timeoutMs,
    env: benchmarkEnv(),
  });

  const rawStdout = summarizeOutput(result.stdout);
  const rawStderr = summarizeOutput(result.stderr);
  const stdout = summarizeOutput(redact(rawStdout));
  const stderr = summarizeOutput(redact(rawStderr));
  const exitCode = result.status == null ? 124 : result.status;
  const checks = [];

  checks.push({
    check: 'exit-code',
    expected: spec.expectedExitCode,
    actual: exitCode,
    pass: exitCode === spec.expectedExitCode,
  });

  if (spec.expectedStdoutIncludes) {
    const expected = String(redact(spec.expectedStdoutIncludes));
    checks.push({
      check: 'stdout-includes',
      expected,
      pass: rawStdout.includes(spec.expectedStdoutIncludes),
    });
  }

  if (spec.expectedStderrIncludes) {
    const expected = String(redact(spec.expectedStderrIncludes));
    checks.push({
      check: 'stderr-includes',
      expected,
      pass: rawStderr.includes(spec.expectedStderrIncludes),
    });
  }

  const pass = checks.every((item) => item.pass);
  return {
    name: spec.name,
    description: spec.description,
    category: spec.category,
    source: spec.source,
    command: redact(spec.command),
    args: redact(spec.args),
    shell: spec.shell,
    cwd: path.relative(ROOT, cwd) || '.',
    timeoutMs: spec.timeoutMs,
    status: pass ? 'PASS' : 'FAIL',
    checks,
    stdout,
    stderr,
    timedOut: Boolean(result.error && result.error.code === 'ETIMEDOUT'),
  };
}

function listBenchmarks() {
  if (!fs.existsSync(benchmarkDir)) return [];
  return fs
    .readdirSync(benchmarkDir)
    .filter((name) => /\.(yaml|yml|json)$/.test(name))
    .sort()
    .map((name) => path.join(benchmarkDir, name));
}

const options = parseArgs(process.argv.slice(2));
const benchmarkFiles = listBenchmarks();
if (benchmarkFiles.length < MIN_BENCHMARKS) {
  console.log('Evaluation blocked: no executable local benchmarks found.');
  console.log('Create at least one benchmark under .opencode/local/benchmarks/ or request explicit manual approval.');
  console.log('Use .opencode/loop-contracts/benchmark-spec-template.json as a starting point.');
  process.exit(1);
}

const results = [];
for (const filePath of benchmarkFiles) {
  try {
    results.push(runBenchmark(loadBenchmark(filePath), options));
  } catch (error) {
    results.push({
      name: path.basename(filePath),
      source: path.relative(ROOT, filePath),
      status: 'FAIL',
      reason: error.message,
    });
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  benchmarkDir: path.relative(ROOT, benchmarkDir),
  total: results.length,
  passed: results.filter((item) => item.status === 'PASS').length,
  failed: results.filter((item) => item.status !== 'PASS').length,
  results,
};

const outputPath = path.join(evaluationDir, `evaluation-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
assertNoSymlinkComponents(ROOT, outputPath);
fs.mkdirSync(evaluationDir, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);

console.log(`Meta-harness evaluation written to ${outputPath}`);
console.log(`Benchmarks: ${summary.total}`);
console.log(`Passed: ${summary.passed}`);
console.log(`Failed: ${summary.failed}`);
for (const result of results) {
  console.log(`- ${result.status}: ${result.name}${result.reason ? ` (${result.reason})` : ''}`);
}

if (summary.failed > 0) process.exit(1);
