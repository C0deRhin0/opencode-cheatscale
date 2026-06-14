#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { LOCAL_ROOT, MAX_TRACE_ENTRIES, ROOT } = require('./CONSTANTS.cjs');

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

const gotchas = readJson(path.join(LOCAL_ROOT, 'gotchas.json'), { gotchas: [] }).gotchas || [];
const traces = readJson(path.join(LOCAL_ROOT, 'execution-traces', 'ring-buffer.json'), []).slice(-MAX_TRACE_ENTRIES);
const outputDir = path.join(LOCAL_ROOT, 'meta-harness');
ensureDir(outputDir);

const grouped = gotchas.reduce((acc, entry) => {
  const category = entry.category || 'workflow';
  acc[category] = acc[category] || [];
  acc[category].push(entry);
  return acc;
}, {});

const recommendations = [];
if (gotchas.some((entry) => /commit|push|drip|tag/i.test(`${entry.trigger} ${entry.pattern}`))) {
  recommendations.push('Review git/drip command guardrails and plugin gotcha checks.');
}
if (gotchas.some((entry) => /skill|frontmatter|description/i.test(`${entry.trigger} ${entry.pattern} ${entry.description}`))) {
  recommendations.push('Run skill-builder validation and improve skill descriptions before adding more skills.');
}
if (traces.length === 0) {
  recommendations.push('No trace window found. Enable OCS_TRACE_CAPTURE=1 only for a targeted diagnosis session if trace correlation is needed.');
}

const report = {
  generatedAt: new Date().toISOString(),
  root: ROOT,
  gotchaCount: gotchas.length,
  traceCount: traces.length,
  groupedGotchas: grouped,
  recommendations,
  deployment: {
    status: 'blocked',
    reason: 'Meta-harness deployment requires benchmark evidence and explicit user approval.',
  },
};

const outputPath = path.join(outputDir, `diagnosis-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(`Meta-harness diagnosis written to ${outputPath}`);
console.log(`Gotchas: ${gotchas.length}`);
console.log(`Trace entries: ${traces.length}`);
for (const recommendation of recommendations) console.log(`- ${recommendation}`);
