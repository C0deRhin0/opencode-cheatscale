#!/usr/bin/env node

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const scriptPath = path.join(__dirname, 'portable-harness.cjs');

function makeTempProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ocs-portable-'));
}

function runExporter(projectRoot, args = []) {
  return spawnSync(process.execPath, [scriptPath, '--project', projectRoot, ...args], {
    encoding: 'utf8',
    cwd: path.resolve(__dirname, '..'),
  });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function runExportedPreToolHookInput(projectRoot, input, platform = 'codex', cwd = projectRoot) {
  const hookPath = path.join(projectRoot, '.agents', 'harness-hooks', 'pre-tool-policy.cjs');
  return spawnSync(process.execPath, [hookPath, '--platform', platform], {
    cwd,
    input: JSON.stringify(input),
    encoding: 'utf8',
  });
}

function runExportedPreToolHook(projectRoot, command, platform = 'codex') {
  return runExportedPreToolHookInput(projectRoot, {
    hook_event_name: 'PreToolUse',
    tool_name: 'Bash',
    tool_input: { command },
  }, platform);
}

test('dry run plans portable files without writing', () => {
  const projectRoot = makeTempProject();
  const result = runExporter(projectRoot, ['--target', 'codex', '--dry-run']);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /DRY RUN/i);
  assert.match(result.stdout, /AGENTS\.md/);
  assert.equal(fs.existsSync(path.join(projectRoot, 'AGENTS.md')), false);
  assert.equal(fs.existsSync(path.join(projectRoot, '.agents')), false);
});

test('codex export writes portable layer, adapter, hooks, and skills', () => {
  const projectRoot = makeTempProject();
  const result = runExporter(projectRoot, ['--target', 'codex']);

  assert.equal(result.status, 0, result.stderr || result.stdout);

  assert.equal(fs.existsSync(path.join(projectRoot, 'AGENTS.md')), true);
  assert.equal(fs.existsSync(path.join(projectRoot, '.agents', 'skills', 'gotcha', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(projectRoot, '.agents', 'skills', 'gotcha', 'gotchas.md')), false);
  assert.equal(fs.existsSync(path.join(projectRoot, '.agents', 'harness-hooks', 'pre-tool-policy.cjs')), true);
  assert.equal(fs.existsSync(path.join(projectRoot, '.agents', 'loop-contracts', 'loop-contract-template.yaml')), true);
  assert.equal(fs.existsSync(path.join(projectRoot, '.agents', '.gitignore')), true);
  assert.equal(fs.existsSync(path.join(projectRoot, '.codex', 'config.toml')), true);
  assert.equal(fs.existsSync(path.join(projectRoot, '.codex', 'hooks.json')), true);

  const manifest = readJson(path.join(projectRoot, '.agents', 'harness-manifest.json'));
  assert.equal(manifest.managedMarker, 'OCS-PORTABLE-MANAGED');
  assert.equal(manifest.sourceHarness, '.opencode');
  assert.ok(manifest.files.some((entry) => entry.path === 'AGENTS.md'));
  assert.ok(manifest.files.some((entry) => entry.path === '.agents/loop-contracts/loop-contract-template.yaml'));

  const adapters = readJson(path.join(projectRoot, '.agents', 'harness-adapters.json'));
  assert.equal(adapters.portableBase.loopContracts, '.agents/loop-contracts');
  assert.equal(adapters.targets.codex.skills, true);
  assert.equal(adapters.targets.codex.hooks, true);
  assert.match(adapters.targets.codex.readDeny, /sensitive file-tool/i);
});

test('existing unmanaged files are not overwritten without force', () => {
  const projectRoot = makeTempProject();
  const agentsPath = path.join(projectRoot, 'AGENTS.md');
  fs.writeFileSync(agentsPath, '# Existing instructions\n');

  const result = runExporter(projectRoot, ['--target', 'portable']);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Skipped/i);
  assert.equal(fs.readFileSync(agentsPath, 'utf8'), '# Existing instructions\n');
});

test('force export backs up and overwrites existing unmanaged files', () => {
  const projectRoot = makeTempProject();
  const agentsPath = path.join(projectRoot, 'AGENTS.md');
  fs.writeFileSync(agentsPath, '# Existing instructions\n');

  const result = runExporter(projectRoot, ['--target', 'portable', '--force']);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(fs.readFileSync(agentsPath, 'utf8'), /OCS-PORTABLE-MANAGED/);
  assert.equal(fs.existsSync(path.join(projectRoot, '.agents', 'local', 'backups')), true);
  assert.match(fs.readFileSync(path.join(projectRoot, '.agents', '.gitignore'), 'utf8'), /local\//);
});

test('export refuses to write through symlinked managed directories', () => {
  const projectRoot = makeTempProject();
  const outsideRoot = makeTempProject();
  fs.symlinkSync(outsideRoot, path.join(projectRoot, '.agents'), 'dir');

  const result = runExporter(projectRoot, ['--target', 'portable']);

  assert.notEqual(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stderr, /symlink/i);
});

test('claude adapter denies local state and credential reads', () => {
  const projectRoot = makeTempProject();
  const result = runExporter(projectRoot, ['--target', 'claude']);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const settings = readJson(path.join(projectRoot, '.claude', 'settings.json'));
  assert.equal(settings.permissions.allow.includes('Read(./.agents/**)'), false);
  assert.ok(settings.permissions.allow.includes('Read(./.agents/skills/**)'));
  assert.ok(settings.permissions.allow.includes('Read(./.agents/loop-contracts/**)'));
  assert.ok(settings.permissions.deny.includes('Read(./.agents/local/**)'));
  assert.ok(settings.permissions.deny.includes('Read(./**/jira-config.env)'));
});

test('generated codex hook command resolves workspace root above nested git', () => {
  const projectRoot = makeTempProject();
  const result = runExporter(projectRoot, ['--target', 'codex']);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const nestedRoot = path.join(projectRoot, 'codebase');
  fs.mkdirSync(path.join(nestedRoot, '.git'), { recursive: true });
  const hooks = readJson(path.join(projectRoot, '.codex', 'hooks.json'));
  const command = hooks.hooks.PreToolUse[0].hooks[0].command;
  const hookInput = JSON.stringify({
    hook_event_name: 'PreToolUse',
    tool_name: 'Bash',
    tool_input: { command: 'git push origin --tags' },
  });

  const hook = spawnSync(command, {
    cwd: nestedRoot,
    shell: true,
    input: hookInput,
    encoding: 'utf8',
  });

  assert.equal(hook.status, 0, hook.stderr || hook.stdout);
  const output = JSON.parse(hook.stdout);
  assert.equal(output.decision, 'block');
  assert.match(output.reason, /tags/i);
});

test('exported pre-tool hook blocks sensitive file-tool targets', () => {
  const projectRoot = makeTempProject();
  const result = runExporter(projectRoot, ['--target', 'codex']);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  for (const input of [
    { hook_event_name: 'PreToolUse', tool_name: 'Read', tool_input: { file_path: '.env' } },
    { hook_event_name: 'PreToolUse', tool_name: 'Grep', tool_input: { path: '.opencode/local' } },
    { hook_event_name: 'PreToolUse', tool_name: 'apply_patch', tool_input: { patchText: '*** Begin Patch\n*** Update File: .env\n@@\n-OLD=1\n+OLD=2\n*** End Patch' } },
  ]) {
    const hook = runExportedPreToolHookInput(projectRoot, input);
    assert.equal(hook.status, 0, hook.stderr || hook.stdout);
    const output = JSON.parse(hook.stdout);
    assert.equal(output.decision, 'block');
    assert.match(output.reason, /sensitive local data/i);
  }
});

test('partial export preserves manifest entries for other targets', () => {
  const projectRoot = makeTempProject();
  const allResult = runExporter(projectRoot, ['--target', 'all']);
  assert.equal(allResult.status, 0, allResult.stderr || allResult.stdout);

  const claudeSkillPath = '.claude/skills/gotcha/SKILL.md';
  const allManifest = readJson(path.join(projectRoot, '.agents', 'harness-manifest.json'));
  assert.ok(allManifest.files.some((entry) => entry.path === claudeSkillPath));

  const codexResult = runExporter(projectRoot, ['--target', 'codex']);
  assert.equal(codexResult.status, 0, codexResult.stderr || codexResult.stdout);

  const codexManifest = readJson(path.join(projectRoot, '.agents', 'harness-manifest.json'));
  assert.ok(codexManifest.files.some((entry) => entry.path === claudeSkillPath));
});

test('exported pre-tool hook blocks tag-pushing commands', () => {
  const projectRoot = makeTempProject();
  const result = runExporter(projectRoot, ['--target', 'codex']);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const hook = runExportedPreToolHook(projectRoot, 'git push origin --tags');

  assert.equal(hook.status, 0, hook.stderr || hook.stdout);
  const output = JSON.parse(hook.stdout);
  assert.equal(output.decision, 'block');
  assert.match(output.reason, /tags/i);
});

test('exported pre-tool hook blocks broad rm -rf commands', () => {
  const projectRoot = makeTempProject();
  const result = runExporter(projectRoot, ['--target', 'codex']);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const hook = runExportedPreToolHook(projectRoot, 'rm -rf /');

  assert.equal(hook.status, 0, hook.stderr || hook.stdout);
  const output = JSON.parse(hook.stdout);
  assert.equal(output.decision, 'block');
  assert.match(output.reason, /destructive rm -rf/i);
});

test('exported pre-tool hook blocks rm variants and sensitive local reads', () => {
  const projectRoot = makeTempProject();
  const result = runExporter(projectRoot, ['--target', 'codex']);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  for (const command of [
    'rm -fr /',
    'rm -r -f ..',
    'rm -rf .',
    'rm -rf ./*',
    'rm -rf $PWD',
    'rm -rf ${PWD}',
    'rm -rf ${PWD}/*',
    'rm -rf ${PWD:?}',
    'rm -r ${PWD} -f',
    'rm --recursive . --force',
    'rm --recursive --force .',
    'rm -rf $(pwd)',
    'rm -rf `pwd`',
    'sudo rm --recursive --force $HOME',
    'grep TOKEN .env',
    'source .env',
    '. .env',
    'set -a; . .env; env',
    'cat app/.env',
    'source ../.env',
    '. config/.env',
    'grep TOKEN services/api/.env.local',
    'cat <.env',
    'node <.env',
    'cat <app/.env',
  ]) {
    const hook = runExportedPreToolHook(projectRoot, command);
    assert.equal(hook.status, 0, hook.stderr || hook.stdout);
    const output = JSON.parse(hook.stdout);
    assert.equal(output.decision, 'block', command);
  }
});

test('exported trace hook truncates large object responses', () => {
  const projectRoot = makeTempProject();
  const result = runExporter(projectRoot, ['--target', 'codex']);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const hookPath = path.join(projectRoot, '.agents', 'harness-hooks', 'redact-trace.cjs');
  const hookInput = JSON.stringify({
    hook_event_name: 'PostToolUse',
    tool_name: 'Bash',
    tool_input: { command: 'npm test' },
    tool_response: { output: 'x'.repeat(5000) },
  });
  const hook = spawnSync(process.execPath, [hookPath, '--platform', 'codex'], {
    cwd: projectRoot,
    input: hookInput,
    encoding: 'utf8',
    env: { ...process.env, OCS_TRACE_CAPTURE: '1' },
  });

  assert.equal(hook.status, 0, hook.stderr || hook.stdout);
  const traces = readJson(path.join(projectRoot, '.agents', 'local', 'execution-traces', 'ring-buffer.json'));
  assert.equal(typeof traces[0].response, 'string');
  assert.match(traces[0].response, /TRUNCATED/);
});
