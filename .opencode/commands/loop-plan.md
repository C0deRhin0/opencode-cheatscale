---
description: Draft a bounded Loop Engineering contract with scope, maker/checker roles, budgets, stop conditions, state rules, and approval gates before running loop-like work.
agent: build
---

# Loop Plan Command

Create a reviewable loop contract for: `$ARGUMENTS`

This command **does not run automation**. It designs the loop before any loop-like work begins.

## Usage

```bash
/loop-plan "diagnose repeated routing mistakes"
/loop-plan --type routine-task-loop "execute billing checkout task"
/loop-plan --write-local "harness diagnosis proposal loop"
```

## Process

1. Read the Loop Engineering policy:
   - `.opencode/skills/loop-engineering/SKILL.md`
   - `.opencode/loop-contracts/loop-contract-template.yaml`
2. Draft a contract with:
   - name
   - trigger
   - goal
   - scope include/exclude
   - maker role
   - checker role
   - allowed tools
   - state read/write paths
   - max iterations/tool calls/wall time/changed files
   - success stop conditions
   - failure stop conditions
   - escalation path
   - human approval requirement
   - rollback instructions
3. If `$ARGUMENTS` includes `--write-local`, run:
   ```bash
   node .opencode/scripts/loop-plan.cjs $ARGUMENTS
   ```
   The script writes only under `.opencode/local/loop-contracts/`.
4. Otherwise, produce the contract in the response and do not write files.

## Safety Rules

- Do not implement the loop.
- Do not edit `.opencode/` from this command.
- Do not write to MCP memory.
- Do not run connector side effects.
- Require explicit human approval before any proposed loop performs writes.

$ARGUMENTS
