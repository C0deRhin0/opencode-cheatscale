const path = require('path');

const root = path.resolve(__dirname, '..', '..');

module.exports = Object.freeze({
  ROOT: root,
  LOCAL_ROOT: path.join(root, 'local'),
  MAX_TRACE_ENTRIES: 50,
  MAX_ITERATIONS: 3,
  TOKEN_BUDGET_PER_RUN: 50000,
  MAX_BENCHMARK_TIMEOUT_MS: 120000,
  MIN_BENCHMARKS: 1,
  ALLOWLIST: [
    'skills/',
    'commands/',
    'agents/',
    'instructions/',
    'README.md',
    'CHANGELOG.md',
  ],
  DENYLIST: [
    'scripts/meta-harness/CONSTANTS.cjs',
    'opencode.json',
    '.gitignore',
    'local/',
    'scripts/jira-sync/jira-config.env',
  ],
});
