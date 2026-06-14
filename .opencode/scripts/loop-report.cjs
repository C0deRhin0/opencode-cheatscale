#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const WORKSPACE_ROOT = path.resolve(ROOT, '..');
const LOCAL_ROOT = path.join(ROOT, 'local');

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function countFiles(dir, predicate = () => true) {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) count += countFiles(abs, predicate);
    else if (predicate(abs)) count += 1;
  }
  return count;
}

function gitTags(pattern) {
  const codebase = path.join(WORKSPACE_ROOT, 'codebase');
  if (!fs.existsSync(path.join(codebase, '.git'))) return [];
  const result = spawnSync('git', ['-C', codebase, 'tag', '--list', pattern], { encoding: 'utf8' });
  if (result.status !== 0) return [];
  return result.stdout.split('\n').map((item) => item.trim()).filter(Boolean);
}

const gotchaState = readJson(path.join(LOCAL_ROOT, 'gotchas.json'), { gotchas: [] });
const traceState = readJson(path.join(LOCAL_ROOT, 'execution-traces', 'ring-buffer.json'), []);
const pendingDrip = gitTags('drip/todo/*');
const doneDrip = gitTags('drip/done/*');

const verificationCount = countFiles(path.join(LOCAL_ROOT, 'verification'), (file) => /\.(json|ya?ml|md)$/.test(file));
const benchmarkCount = countFiles(path.join(LOCAL_ROOT, 'benchmarks'), (file) => /\.(json|ya?ml)$/.test(file));
const diagnosisCount = countFiles(path.join(LOCAL_ROOT, 'meta-harness'), (file) => /diagnosis-.*\.json$/.test(path.basename(file)));
const loopContractCount = countFiles(path.join(LOCAL_ROOT, 'loop-contracts'), (file) => /\.(ya?ml|json)$/.test(file));

console.log('# OCS Loop Report');
console.log('');
console.log(`Generated: ${new Date().toISOString()}`);
console.log(`Workspace: ${WORKSPACE_ROOT}`);
console.log('');
console.log('## Local State Summary');
console.log(`- Gotchas: ${Array.isArray(gotchaState.gotchas) ? gotchaState.gotchas.length : 0}`);
console.log(`- Trace entries: ${Array.isArray(traceState) ? traceState.length : 0}`);
console.log(`- Local loop contract drafts: ${loopContractCount}`);
console.log(`- Verification records: ${verificationCount}`);
console.log(`- Local benchmarks: ${benchmarkCount}`);
console.log(`- Meta-harness diagnoses: ${diagnosisCount}`);
console.log(`- Pending drip tags: ${pendingDrip.length}`);
console.log(`- Completed drip tags: ${doneDrip.length}`);
console.log('');
console.log('## Recommendations');
if (benchmarkCount === 0) console.log('- Add executable local benchmarks before approving harness optimization proposals.');
if (verificationCount === 0) console.log('- Add verification records for loop-like work before increasing automation.');
if (pendingDrip.length > 0) console.log('- Review pending drip tags before starting large loop work.');
if (Array.isArray(traceState) && traceState.length > 0) console.log('- Trace data exists locally; keep it out of prompts unless diagnosing a specific issue.');
if (loopContractCount === 0) console.log('- Use /loop-plan to draft an explicit loop contract before running loop-like work.');
console.log('- Keep this report read-only: do not edit, push, publish, activate connectors, or write memory from /loop-report.');
