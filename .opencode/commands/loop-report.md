---
description: Produce a read-only Loop Engineering heartbeat report over local gotchas, traces, verification records, benchmarks, diagnoses, and drip queue state.
agent: build
---

# Loop Report Command

Produce a read-only loop heartbeat report.

## Usage

```bash
/loop-report
```

## Process

1. Run:
   ```bash
   node .opencode/scripts/loop-report.cjs
   ```
2. Summarize the output for the user.
3. Distinguish informational findings from blockers.
4. Recommend next manual actions only.

## Safety Rules

- Read-only only.
- Do not edit files.
- Do not push, publish, delete JIRA issues, activate connectors, or write memory.
- Do not include raw trace bodies in the response.
- If the report reveals missing benchmarks or verification records, recommend `/loop-plan` or `/harness-optimize evaluate`; do not auto-fix.

$ARGUMENTS
