#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { ALLOWLIST, DENYLIST, ROOT } = require('./CONSTANTS.cjs');

const args = process.argv.slice(2);
const approved = args.includes('--approved-by-user');
const proposalIndex = args.indexOf('--proposal');
const proposal = proposalIndex >= 0 ? args[proposalIndex + 1] : '';

function pathIsInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

if (!approved) {
  console.log('Deployment blocked: pass --approved-by-user only after explicit human approval.');
  process.exit(1);
}

if (!proposal) {
  console.log('Deployment blocked: pass --proposal <file> so the approved proposal is explicit.');
  process.exit(1);
}

const proposalPath = path.resolve(process.cwd(), proposal);
if (!pathIsInside(ROOT, proposalPath)) {
  console.log('Deployment blocked: proposal must live inside the harness tree.');
  process.exit(1);
}

if (!fs.existsSync(proposalPath)) {
  console.log('Deployment blocked: proposal file does not exist.');
  process.exit(1);
}

if (fs.lstatSync(proposalPath).isSymbolicLink() || !fs.statSync(proposalPath).isFile()) {
  console.log('Deployment blocked: proposal must be a regular non-symlink file.');
  process.exit(1);
}

const realRoot = fs.realpathSync(ROOT);
const realProposalPath = fs.realpathSync(proposalPath);
if (!pathIsInside(realRoot, realProposalPath)) {
  console.log('Deployment blocked: proposal real path must stay inside the harness tree.');
  process.exit(1);
}

console.log('Deployment is intentionally manual in this harness version.');
console.log(`Approved proposal: ${path.relative(ROOT, realProposalPath)}`);
console.log(`Allowed path prefixes: ${ALLOWLIST.join(', ')}`);
console.log(`Denied path prefixes: ${DENYLIST.join(', ')}`);
console.log('Apply approved patches manually, run /harness-health, run executable benchmarks, review the diff, then restart OpenCode.');
