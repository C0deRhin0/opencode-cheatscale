---
description: Validate the OpenCode CheatScale harness wiring, file references, skill metadata, and cleanup state.
agent: build
---

# Harness Health Command

Run the local harness health validator and report the results.

## Usage

```bash
/harness-health
```

## Process

1. Run:
   ```bash
   node .opencode/scripts/harness-health.cjs
   ```
2. If the script reports errors, explain exactly what must be fixed.
3. If the script reports warnings only, distinguish cleanup suggestions from functional blockers.
4. If the script passes, report that the harness wiring is healthy.

$ARGUMENTS
