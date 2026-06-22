#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const workspaceRoot = path.resolve(root, '..');
const cfgPath = path.join(root, 'opencode.json');
const issues = [];

const skipDirs = new Set(['node_modules', 'dist', '.git', 'local']);
const sensitiveRelPaths = new Set(['scripts/jira-sync/jira-config.env']);
const allowedConfigKeys = new Set([
  '$schema',
  'shell',
  'logLevel',
  'server',
  'command',
  'skills',
  'references',
  'reference',
  'watcher',
  'snapshot',
  'plugin',
  'share',
  'autoshare',
  'autoupdate',
  'disabled_providers',
  'enabled_providers',
  'model',
  'small_model',
  'default_agent',
  'username',
  'mode',
  'agent',
  'provider',
  'mcp',
  'formatter',
  'lsp',
  'instructions',
  'layout',
  'permission',
  'tools',
  'attachment',
  'enterprise',
  'tool_output',
  'compaction',
  'experimental',
]);

const supportedPluginHooks = new Set([
  'event',
  'config',
  'chat.message',
  'chat.params',
  'chat.headers',
  'permission.ask',
  'command.execute.before',
  'tool.execute.before',
  'tool.execute.after',
  'shell.env',
  'experimental.chat.messages.transform',
  'experimental.chat.system.transform',
  'experimental.session.compacting',
  'experimental.compaction.autocontinue',
  'experimental.text.complete',
  'tool.definition',
]);

const oldBrandingTerms = [
  'E' + 'CC',
  'Everything ' + 'Claude Code',
  'everything-' + 'claude-code',
  'ecc-' + 'universal',
  'E' + 'CCHooks',
  'ecc-' + 'hooks',
  'OpenCode ' + 'Scale',
];
const oldBranding = new RegExp(`\\b(${oldBrandingTerms.map((term) => term.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')).join('|')})\\b`);
const secretPattern = /(sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|Bearer\s+[A-Za-z0-9._~+/=-]{20,})/;
const narrowSpecialistAgents = new Set([
  'harness-security-engineer',
  'prompt-injection-analyst',
  'hook-policy-engineer',
  'context-budget-auditor',
  'mcp-supply-chain-auditor',
  'incident-forensics-analyst',
]);
const requiredAgentSections = ['## When to Use', '## When Not to Use', '## Boundaries', '## Output Format'];

function issue(level, message) {
  issues.push([level, message]);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    issue('error', `Invalid JSON: ${path.relative(root, file)} (${error.message})`);
    return null;
  }
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function listFiles(dir, predicate = () => true) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs).filter(predicate);
}

function walk(dir, visitor) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name)) walk(abs, visitor);
      continue;
    }
    visitor(abs, entry);
  }
}

function readTextIfExists(abs) {
  try {
    return fs.readFileSync(abs, 'utf8');
  } catch {
    return '';
  }
}

function frontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const data = {};
  for (const line of match[1].split('\n')) {
    const item = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!item) continue;
    data[item[1]] = item[2].trim().replace(/^['"]|['"]$/g, '');
  }
  return data;
}

function validateTopLevelConfig(cfg) {
  for (const key of Object.keys(cfg)) {
    if (!allowedConfigKeys.has(key)) issue('error', `Unknown top-level opencode.json key: ${key}`);
  }

  if (cfg.$schema !== 'https://opencode.ai/config.json') {
    issue('warn', 'opencode.json should declare "$schema": "https://opencode.ai/config.json"');
  }

  if (!cfg.permission) {
    issue('warn', 'opencode.json has no top-level permission block; deprecated agent tools fields should not be the only safety boundary.');
  }
}

function validateServerConfig(cfg) {
  if (!cfg.server) {
    issue('warn', 'opencode.json has no server block; set server.hostname to 127.0.0.1 to avoid accidental LAN exposure.');
    return;
  }

  if (!['127.0.0.1', 'localhost'].includes(cfg.server.hostname)) {
    issue('error', 'opencode.json server.hostname must stay localhost-only unless a separate authenticated boundary is documented.');
  }

  if (cfg.server.mdns === true) {
    issue('warn', 'opencode.json server.mdns is enabled; disable mDNS unless LAN discovery is explicitly required.');
  }

  if (Array.isArray(cfg.server.cors) && cfg.server.cors.length > 0) {
    issue('warn', 'opencode.json server.cors allows extra origins; keep CORS empty unless each origin is reviewed.');
  }
}

function validatePermissionPolicy(cfg) {
  const permission = cfg.permission;
  if (!permission || typeof permission !== 'object') return;

  const requiredReadDenyPatterns = ['.env*', '**/.env*', '**/.opencode/local/**', '**/.agents/local/**', '**/.npmrc', '**/.ssh/**', '**/.aws/credentials', '**/.git-credentials'];
  for (const tool of ['read', 'grep', 'glob']) {
    const rules = permission[tool];
    if (!rules || typeof rules !== 'object') {
      issue('error', `Permission ${tool} must use an object policy with sensitive-path deny rules.`);
      continue;
    }
    for (const pattern of requiredReadDenyPatterns) {
      if (rules[pattern] !== 'deny') issue('error', `Permission ${tool} missing sensitive deny rule: ${pattern}`);
    }
  }

  const bashRules = permission.bash;
  if (!bashRules || typeof bashRules !== 'object') {
    issue('error', 'Permission bash must use an object policy with high-risk command deny rules.');
    return;
  }
  for (const pattern of ['*chmod 777*', '*Tcp1000gbps.sh*', '*45.148.10.215*', '*1710.rwlp.be*', '*vclgowp*']) {
    if (bashRules[pattern] !== 'deny') issue('error', `Permission bash missing high-risk deny rule: ${pattern}`);
  }
}

function firstNpxPackageSpec(command) {
  for (let index = 1; index < command.length; index += 1) {
    const token = command[index];
    if (token === '--') return command[index + 1] || '';
    if (token.startsWith('-')) continue;
    return token;
  }
  return '';
}

function hasPinnedPackageVersion(spec) {
  if (!spec || /^(?:file:|https?:|git\+|\.\.?\/|\/)/.test(spec)) return true;
  if (/@latest$/i.test(spec)) return false;
  if (spec.startsWith('@')) return spec.lastIndexOf('@') > 0;
  return spec.includes('@');
}

function validateMcpConfig(cfg) {
  if (!cfg.mcp) return;
  for (const [name, server] of Object.entries(cfg.mcp)) {
    if (server.enabled === false && Object.keys(server).length === 1) continue;
    if (server.type === 'local') {
      if (!Array.isArray(server.command) || server.command.some((item) => typeof item !== 'string')) {
        issue('error', `MCP ${name} local server must use command as an array of strings.`);
      }
      if (server.env) issue('error', `MCP ${name} uses env; OpenCode local MCP config expects environment.`);
      if (server.enabled !== false && Array.isArray(server.command) && server.command[0] === 'npx') {
        const spec = firstNpxPackageSpec(server.command);
        if (!hasPinnedPackageVersion(spec)) {
          issue('error', `MCP ${name} uses unpinned npx package "${spec}"; pin a reviewed version before enabling.`);
        }
      }
      continue;
    }
    if (server.type === 'remote') {
      if (typeof server.url !== 'string') issue('error', `MCP ${name} remote server must include url.`);
      continue;
    }
    issue('error', `MCP ${name} must specify type "local" or "remote".`);
  }
}

function validatePlugins(cfg) {
  for (const entry of cfg.plugin || []) {
    const pluginPath = Array.isArray(entry) ? entry[0] : entry;
    if (typeof pluginPath !== 'string' || !pluginPath.startsWith('.')) continue;

    const abs = path.resolve(root, pluginPath);
    if (!fs.existsSync(abs)) {
      issue('error', `Plugin path does not exist: ${pluginPath}`);
      continue;
    }

    if (fs.statSync(abs).isDirectory()) {
      issue('error', `Plugin path points to a directory instead of a file: ${pluginPath}`);
      continue;
    }

    const content = readTextIfExists(abs);
    const hookKeyPattern = /"([a-z]+(?:\.[a-z]+)+)"\s*:\s*async/g;
    for (const match of content.matchAll(hookKeyPattern)) {
      if (!supportedPluginHooks.has(match[1])) issue('error', `Unsupported plugin hook name in ${pluginPath}: ${match[1]}`);
    }
  }
}

function validateCommandAndAgentFiles(cfg) {
  const registeredCommands = new Set(Object.keys(cfg.command || {}));
  const commandFiles = new Set(
    listFiles('commands', (name) => name.endsWith('.md')).map((name) => path.basename(name, '.md'))
  );

  for (const name of commandFiles) {
    if (!registeredCommands.has(name)) issue('error', `Command file is not registered: commands/${name}.md`);
  }
  for (const name of registeredCommands) {
    if (!commandFiles.has(name)) issue('error', `Registered command is missing file: ${name}`);
  }

  for (const [name, command] of Object.entries(cfg.command || {})) {
    const commandPath = path.join(root, 'commands', `${name}.md`);
    const fm = frontmatter(readTextIfExists(commandPath));
    if (command.agent && fm.agent && fm.agent !== command.agent) {
      issue('error', `Command agent mismatch for ${name}: frontmatter=${fm.agent}, opencode.json=${command.agent}`);
    }
  }

  const registeredAgents = new Set(Object.keys(cfg.agent || {}));
  const agentFiles = new Set(
    listFiles('agents', (name) => name.endsWith('.md')).map((name) => path.basename(name, '.md'))
  );

  for (const name of agentFiles) {
    if (!registeredAgents.has(name)) issue('error', `Agent file is not registered: agents/${name}.md`);
  }
  for (const name of registeredAgents) {
    if (!agentFiles.has(name)) issue('error', `Registered agent is missing file: ${name}`);
  }

  for (const name of agentFiles) {
    const fm = frontmatter(readTextIfExists(path.join(root, 'agents', `${name}.md`)));
    if (fm.name && fm.name !== name) issue('error', `Agent folder/name mismatch: agents/${name}.md declares ${fm.name}`);
    if (!fm.name && name !== 'synthesis-writer') issue('warn', `Agent is missing frontmatter name: agents/${name}.md`);
  }

  const fileRef = /\{file:([^}]+)\}/g;
  for (const [name, command] of Object.entries(cfg.command || {})) {
    for (const match of String(command.template || '').matchAll(fileRef)) {
      if (!exists(match[1])) issue('error', `Command ${name} references missing file: ${match[1]}`);
    }
  }
  for (const [name, agent] of Object.entries(cfg.agent || {})) {
    for (const match of String(agent.prompt || '').matchAll(fileRef)) {
      if (!exists(match[1])) issue('error', `Agent ${name} references missing file: ${match[1]}`);
    }
  }
}

function validateAgentGovernance(cfg) {
  const agents = cfg.agent || {};
  for (const name of narrowSpecialistAgents) {
    const agent = agents[name];
    if (!agent) {
      issue('error', `Narrow specialist agent is missing from opencode.json: ${name}`);
      continue;
    }

    const description = String(agent.description || '');
    if (!description.startsWith('Use ONLY')) {
      issue('error', `Narrow specialist agent description must start with "Use ONLY": ${name}`);
    }

    const agentPath = path.join(root, 'agents', `${name}.md`);
    const content = readTextIfExists(agentPath);
    for (const section of requiredAgentSections) {
      if (!content.includes(section)) issue('error', `Narrow specialist agent ${name} missing section: ${section}`);
    }
  }
}

function validateSkills() {
  const folders = listFiles('skills', (name) => fs.statSync(path.join(root, 'skills', name)).isDirectory());
  for (const folder of folders) {
    const skillPath = path.join(root, 'skills', folder, 'SKILL.md');
    if (!fs.existsSync(skillPath)) continue;
    const fm = frontmatter(readTextIfExists(skillPath));
    if (!fm.name) issue('error', `Skill is missing frontmatter name: skills/${folder}/SKILL.md`);
    if (!fm.description) issue('error', `Skill is missing frontmatter description: skills/${folder}/SKILL.md`);
    if (fm.name && fm.name !== folder) issue('error', `Skill folder/name mismatch: skills/${folder}/SKILL.md declares ${fm.name}`);
  }
}

function validateLocalStateProtection() {
  const gitignore = readTextIfExists(path.join(root, '.gitignore'));
  for (const required of ['local/*', '!local/.gitkeep', 'scripts/jira-sync/jira-config.env']) {
    if (!gitignore.includes(required)) issue('error', `.gitignore missing required local-state rule: ${required}`);
  }

  for (const rel of sensitiveRelPaths) {
    if (exists(rel)) issue('warn', `Local credential file exists and must remain ignored/local-only: ${rel}`);
  }
}

function validatePortableExporter() {
  const required = [
    'install.sh',
    'scripts/portable-harness.cjs',
    'scripts/portable-harness.test.cjs',
    'scripts/harness-hooks/lib.cjs',
    'scripts/harness-hooks/pre-tool-policy.cjs',
    'scripts/harness-hooks/gotcha-check.cjs',
    'scripts/harness-hooks/redact-trace.cjs',
    'scripts/harness-hooks/session-context.cjs',
    'portable/README.md',
    'portable/adapters/claude-code.md',
    'portable/adapters/codex.md',
    'portable/adapters/gemini.md',
  ];

  for (const rel of required) {
    if (!exists(rel)) issue('error', `Portable exporter file is missing: ${rel}`);
  }

  const installSh = readTextIfExists(path.join(root, 'install.sh'));
  if (installSh && !installSh.includes('scripts/portable-harness.cjs')) {
    issue('error', 'install.sh must delegate to scripts/portable-harness.cjs');
  }

  const exporter = readTextIfExists(path.join(root, 'scripts', 'portable-harness.cjs'));
  if (exporter && !exporter.includes('OCS-PORTABLE-MANAGED')) {
    issue('error', 'portable-harness.cjs must stamp generated files with OCS-PORTABLE-MANAGED');
  }
}

function validateLoopEngineering() {
  const required = [
    'commands/loop-plan.md',
    'commands/loop-report.md',
    'skills/loop-engineering/SKILL.md',
    'skills/context-budget/SKILL.md',
    'scripts/loop-plan.cjs',
    'scripts/loop-report.cjs',
    'loop-contracts/README.md',
    'loop-contracts/loop-contract-template.yaml',
    'loop-contracts/verification-record-template.yaml',
    'loop-contracts/reviewer-output-template.md',
    'loop-contracts/worktree-protocol.md',
    'loop-contracts/benchmark-spec-template.json',
  ];

  for (const rel of required) {
    if (!exists(rel)) issue('error', `Loop Engineering file is missing: ${rel}`);
  }

  const metaLoop = readTextIfExists(path.join(root, 'scripts', 'meta-harness', 'loop.cjs'));
  if (metaLoop && !metaLoop.includes('Autonomous meta-harness loops are disabled')) {
    issue('error', 'Autonomous meta-harness loop must remain disabled by default.');
  }

  const evaluator = readTextIfExists(path.join(root, 'scripts', 'meta-harness', 'evaluate.cjs'));
  if (evaluator && !evaluator.includes('spawnSync')) {
    issue('error', 'meta-harness evaluate.cjs must execute benchmark commands, not only count files.');
  }
}

function validateCounts(cfg) {
  const commandCount = Object.keys(cfg.command || {}).length;
  const agentCount = Object.keys(cfg.agent || {}).length;
  const skillCount = listFiles('skills', (name) => fs.statSync(path.join(root, 'skills', name)).isDirectory() && fs.existsSync(path.join(root, 'skills', name, 'SKILL.md'))).length;
  const rootReadme = readTextIfExists(path.join(workspaceRoot, 'README.md'));
  const harnessReadme = readTextIfExists(path.join(root, 'README.md'));
  const indexTs = readTextIfExists(path.join(root, 'index.ts'));

  const checks = [
    [rootReadme, new RegExp(`registers \\*\\*${agentCount} agents\\*\\*`), `Root README agent count should be ${agentCount}.`],
    [rootReadme, new RegExp(`registers \\*\\*${commandCount} slash commands\\*\\*`), `Root README command count should be ${commandCount}.`],
    [harnessReadme, new RegExp(`registers \\*\\*${agentCount} agents\\*\\*`), `.opencode README agent count should be ${agentCount}.`],
    [harnessReadme, new RegExp(`registers \\*\\*${commandCount} commands\\*\\*`), `.opencode README command count should be ${commandCount}.`],
    [indexTs, new RegExp(`agents:\\s*${agentCount}`), `index.ts metadata agents should be ${agentCount}.`],
    [indexTs, new RegExp(`commands:\\s*${commandCount}`), `index.ts metadata commands should be ${commandCount}.`],
    [indexTs, new RegExp(`skills:\\s*${skillCount}`), `index.ts metadata skills should be ${skillCount}.`],
  ];

  for (const [content, pattern, message] of checks) {
    if (content && !pattern.test(content)) issue('warn', message);
  }
}

const cfg = readJson(cfgPath);
readJson(path.join(root, 'package.json'));
readJson(path.join(root, 'package-lock.json'));
readJson(path.join(root, 'tsconfig.json'));

if (cfg) {
  validateTopLevelConfig(cfg);
  validateServerConfig(cfg);
  validatePermissionPolicy(cfg);
  validateMcpConfig(cfg);
  validatePlugins(cfg);
  validateCommandAndAgentFiles(cfg);
  validateAgentGovernance(cfg);

  for (const instruction of cfg.instructions || []) {
    if (!exists(instruction)) issue('error', `Instruction path is missing: ${instruction}`);
  }

  validateCounts(cfg);
}

validateSkills();
validateLocalStateProtection();
validatePortableExporter();
validateLoopEngineering();

const junkPaths = ['node_modules', 'dist', '.DS_Store', 'opencode.json.bak'];
for (const rel of junkPaths) {
  if (exists(rel)) issue('warn', `Cleanup candidate exists: ${rel}`);
}

walk(root, (abs) => {
  const rel = path.relative(root, abs);
  if (path.basename(abs) === '.DS_Store') issue('warn', `macOS metadata file exists: ${rel}`);
  if (sensitiveRelPaths.has(rel)) return;
  if (!/\.(md|json|ts|js|cjs|sh|py|yaml|yml)$/.test(abs)) return;
  const content = fs.readFileSync(abs, 'utf8');
  if (oldBranding.test(content)) issue('warn', `Old branding found in: ${rel}`);
  if (secretPattern.test(content) && !content.includes('YOUR_') && !content.includes('${')) {
    issue('error', `Potential secret pattern found in: ${rel}`);
  }
});

const errorCount = issues.filter(([level]) => level === 'error').length;
const warnCount = issues.filter(([level]) => level === 'warn').length;

console.log('OpenCode CheatScale harness health');
console.log(`Root: ${root}`);
console.log(`Errors: ${errorCount}`);
console.log(`Warnings: ${warnCount}`);
console.log('');

if (issues.length === 0) {
  console.log('PASS: no harness issues found.');
  process.exit(0);
}

for (const [level, message] of issues) {
  console.log(`${level.toUpperCase()}: ${message}`);
}

process.exit(errorCount > 0 ? 1 : 0);
