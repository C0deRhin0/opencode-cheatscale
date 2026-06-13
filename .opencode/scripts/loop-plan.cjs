#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LOCAL_ROOT = path.join(ROOT, 'local');

function parseArgs(argv) {
  const options = {
    type: 'manual-loop',
    writeLocal: false,
    goalParts: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    const next = argv[index + 1];
    if (item === '--type') {
      if (!next) throw new Error('--type requires a value');
      options.type = next;
      index += 1;
    } else if (item === '--write-local') {
      options.writeLocal = true;
    } else if (item === '--help' || item === '-h') {
      options.help = true;
    } else {
      options.goalParts.push(item);
    }
  }

  options.goal = options.goalParts.join(' ').trim();
  return options;
}

function slugify(value) {
  return String(value || 'loop')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'loop';
}

function pathIsInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function assertNoSymlinkComponents(root, filePath) {
  if (!fs.existsSync(root)) throw new Error(`Root does not exist: ${root}`);
  const realRoot = fs.realpathSync(root);
  const relative = path.relative(root, filePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing to write outside harness root: ${filePath}`);
  }

  let current = root;
  for (const part of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    if (!fs.existsSync(current)) break;

    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink()) throw new Error(`Refusing to write through symlink path: ${filePath}`);
    if (stat.isDirectory() && !pathIsInside(realRoot, fs.realpathSync(current))) {
      throw new Error(`Refusing to write outside harness root: ${filePath}`);
    }
  }

  let existingParent = path.dirname(filePath);
  while (!fs.existsSync(existingParent)) {
    const nextParent = path.dirname(existingParent);
    if (nextParent === existingParent) break;
    existingParent = nextParent;
  }
  if (!pathIsInside(realRoot, fs.realpathSync(existingParent))) {
    throw new Error(`Refusing to write outside harness root: ${filePath}`);
  }
}

function yamlScalar(value) {
  return JSON.stringify(String(value));
}

function yamlList(items, indent = 2) {
  const prefix = ' '.repeat(indent);
  return items.map((item) => `${prefix}- ${yamlScalar(item)}`).join('\n');
}

function renderContract(options) {
  const goal = options.goal || 'Describe the loop goal before running any work.';
  const slug = slugify(goal);
  const type = slugify(options.type);
  return `name: ${yamlScalar(`${type}-${slug}`)}
trigger: ${yamlScalar(`/loop-plan ${goal}`)}
goal: ${yamlScalar(goal)}
scope:
  include:
${yamlList(['TBD by human-reviewed loop contract'], 4)}
  exclude:
${yamlList(['.opencode/local/**', '.env', '.env.*', 'credential files', 'secret files'], 4)}
maker:
  agent: TBD
  write_scope:
${yamlList(['TBD'], 4)}
checker:
  agents:
${yamlList(['code-reviewer'], 4)}
  mode: read-only
allowed_tools:
  read: true
  edit: ask
  write: ask
  bash: ask
state_read:
${yamlList(['.opencode/loop-contracts/**', 'plans/<scope>/** when applicable'], 2)}
state_write:
${yamlList(['.opencode/local/loop-contracts/**', '.opencode/local/verification/**'], 2)}
budget:
  max_iterations: 3
  max_tool_calls: 30
  max_wall_time_minutes: 30
  max_changed_files: 8
stop_success:
${yamlList(['acceptance criteria satisfied with evidence', 'required commands exit with expected status', 'checker reports no Critical or High findings'], 2)}
stop_failure:
${yamlList(['same failure repeats twice', 'budget exhausted', 'scope boundary violated', 'checker reports unresolved Critical or High findings'], 2)}
escalation:
${yamlList(['stop and ask for human guidance', 'provide verification record and unresolved risks'], 2)}
human_approval_required: true
rollback:
  required: true
  instructions: ${yamlScalar('TBD before implementation begins')}
`;
}

function usage() {
  return `Usage:
  node .opencode/scripts/loop-plan.cjs [--type TYPE] [--write-local] "goal"

Creates a reviewable Loop Engineering contract draft. No automation runs.
`;
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    process.exit(0);
  }

  const contract = renderContract(options);
  console.log(contract.trimEnd());

  if (options.writeLocal) {
    const outputDir = path.join(LOCAL_ROOT, 'loop-contracts');
    const fileName = `${new Date().toISOString().replace(/[:.]/g, '-')}-${slugify(options.goal)}.yaml`;
    const outputPath = path.join(outputDir, fileName);
    assertNoSymlinkComponents(ROOT, outputPath);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputPath, `${contract}\n`);
    console.log(`\nLoop contract draft written to ${outputPath}`);
  }
} catch (error) {
  console.error(`loop-plan error: ${error.message}`);
  process.exit(1);
}
