#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const skillsRoot = path.join(root, 'skills');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'opencode.json'), 'utf8'));

function titleize(name) {
  return name.split('-').map((part) => `${part[0].toUpperCase()}${part.slice(1)}`).join(' ');
}

function render(template, replacements) {
  return Object.entries(replacements).reduce(
    (content, [key, value]) => content.replaceAll(`{{${key}}}`, value),
    template
  );
}

const args = process.argv.slice(2);
const action = args[0] === 'create' ? args.shift() : 'create';
const name = args.shift();
const description = args.join(' ').trim();

if (action !== 'create' || !name || !description) {
  console.error('Usage: create-skill.cjs create <skill-name> "Use when..."');
  process.exit(1);
}

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
  console.error('Skill name must be lowercase kebab-case.');
  process.exit(1);
}

const skillDir = path.join(skillsRoot, name);
if (fs.existsSync(skillDir)) {
  console.error(`Skill already exists: ${name}`);
  process.exit(1);
}

if (cfg.command?.[name]) console.log(`WARN: ${name} also exists as a command; create only a companion skill.`);
if (cfg.agent?.[name]) console.log(`WARN: ${name} collides with an agent name.`);

const templatePath = path.join(skillsRoot, 'skill-builder', 'templates', 'basic-skill.md');
const template = fs.readFileSync(templatePath, 'utf8');
const output = render(template, {
  name,
  description,
  title: titleize(name),
});

fs.mkdirSync(skillDir, { recursive: true });
fs.writeFileSync(path.join(skillDir, 'SKILL.md'), output);
console.log(`Created skill: skills/${name}/SKILL.md`);
