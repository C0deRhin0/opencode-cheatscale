#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const cfgPath = path.join(root, 'opencode.json');
const issues = [];

const skipDirs = new Set(['node_modules', 'dist', '.git']);
const oldBrandingTerms = [
  'E' + 'CC',
  'Everything ' + 'Claude Code',
  'everything-' + 'claude-code',
  'ecc-' + 'universal',
  'E' + 'CCHooks',
  'ecc-' + 'hooks',
  'OpenCode ' + 'Scale'
];
const oldBranding = new RegExp(`\\b(${oldBrandingTerms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`);

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    issues.push(['error', `Invalid JSON: ${path.relative(root, file)} (${error.message})`]);
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

function issue(level, message) {
  issues.push([level, message]);
}

const cfg = readJson(cfgPath);
readJson(path.join(root, 'package.json'));
readJson(path.join(root, 'package-lock.json'));
readJson(path.join(root, 'tsconfig.json'));

if (cfg) {
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

  for (const instruction of cfg.instructions || []) {
    if (!exists(instruction)) issue('error', `Instruction path is missing: ${instruction}`);
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

for (const folder of listFiles('skills', (name) => fs.statSync(path.join(root, 'skills', name)).isDirectory())) {
  const skillPath = path.join(root, 'skills', folder, 'SKILL.md');
  if (!fs.existsSync(skillPath)) continue;
  const body = fs.readFileSync(skillPath, 'utf8');
  const match = body.match(/^name:\s*([^\n]+)/m);
  if (!match) issue('error', `Skill is missing frontmatter name: skills/${folder}/SKILL.md`);
  if (match && match[1].trim() !== folder) {
    issue('error', `Skill folder/name mismatch: skills/${folder}/SKILL.md declares ${match[1].trim()}`);
  }
}

const junkPaths = ['node_modules', 'dist', '.DS_Store', 'opencode.json.bak'];
for (const rel of junkPaths) {
  if (exists(rel)) issue('warn', `Cleanup candidate exists: ${rel}`);
}

walk(root, (abs) => {
  const rel = path.relative(root, abs);
  if (path.basename(abs) === '.DS_Store') issue('warn', `macOS metadata file exists: ${rel}`);
  if (!/\.(md|json|ts|js|cjs|sh|py|yaml|yml)$/.test(abs)) return;
  const content = fs.readFileSync(abs, 'utf8');
  if (oldBranding.test(content)) issue('warn', `Old branding found in: ${rel}`);
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
