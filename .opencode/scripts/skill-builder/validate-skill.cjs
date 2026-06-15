#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const skillsRoot = path.join(root, 'skills');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'opencode.json'), 'utf8'));

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  return Object.fromEntries(
    match[1]
      .split('\n')
      .map((line) => line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/))
      .filter(Boolean)
      .map((item) => [item[1], item[2].trim().replace(/^['"]|['"]$/g, '')])
  );
}

function listTargets(requested) {
  if (requested) return [requested];
  return fs
    .readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

const args = process.argv.slice(2);
const action = args[0] === 'validate' ? args.shift() : 'validate';
const requested = args[0];

if (action !== 'validate') {
  console.error('Usage: validate-skill.cjs validate [skill-name]');
  process.exit(1);
}

const commands = new Set(Object.keys(cfg.command || {}));
const agents = new Set(Object.keys(cfg.agent || {}));
const errors = [];
const warnings = [];
let validatedCount = 0;
let skippedCount = 0;

for (const folder of listTargets(requested)) {
  const skillPath = path.join(skillsRoot, folder, 'SKILL.md');
  if (!fs.existsSync(skillPath)) {
    skippedCount += 1;
    continue;
  }
  validatedCount += 1;

  const fm = parseFrontmatter(fs.readFileSync(skillPath, 'utf8'));
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(folder)) errors.push(`${folder}: folder name must be kebab-case`);
  if (!fm.name) errors.push(`${folder}: missing frontmatter name`);
  if (!fm.description) errors.push(`${folder}: missing frontmatter description`);
  if (fm.name && fm.name !== folder) errors.push(`${folder}: frontmatter name does not match folder (${fm.name})`);
  if (fm.description && fm.description.length < 40) warnings.push(`${folder}: description is short; include trigger conditions`);
  if (commands.has(folder)) warnings.push(`${folder}: name also exists as a command; keep the command as deterministic fallback`);
  if (agents.has(folder)) warnings.push(`${folder}: name collides with an agent`);
}

for (const warning of warnings) console.log(`WARN: ${warning}`);
for (const error of errors) console.log(`ERROR: ${error}`);

console.log(`Validated ${validatedCount} skill file${validatedCount === 1 ? '' : 's'}.`);
if (skippedCount > 0) console.log(`Skipped ${skippedCount} non-skill director${skippedCount === 1 ? 'y' : 'ies'} without SKILL.md.`);
process.exit(errors.length > 0 ? 1 : 0);
