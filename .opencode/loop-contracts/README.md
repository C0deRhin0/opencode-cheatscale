# Loop Contracts

Loop contracts make CheatScale loops explicit, bounded, inspectable, and evidence-producing.

Use this directory for committed templates and policy references. Runtime loop state and generated proposals belong under `.opencode/local/` and must remain uncommitted.

## Files

| File | Purpose |
|---|---|
| `loop-contract-template.yaml` | Canonical contract schema for proposed loops. |
| `verification-record-template.yaml` | Standard evidence record for commands, tests, reviewers, and risks. |
| `reviewer-output-template.md` | Maker/checker review output schema. |
| `worktree-protocol.md` | Documentation-first worktree isolation protocol. |
| `benchmark-spec-template.json` | Executable meta-harness benchmark example using `command` + `args`, `shell: false`, expected output, and fail-closed evaluation. |

## Policy

- Loops may diagnose and propose `.opencode/` changes.
- Loops may not apply `.opencode/` changes without explicit human approval.
- Raw loop state stays under `.opencode/local/`.
- MCP memory writes require explicit human promotion.
- Worktree isolation is required for risky or parallel proposal work.
- Autonomous heartbeat/self-modifying loops remain disabled until budgets, benchmarks, rollback, and approval gates are enforced outside model prose.
- Unapproved benchmarks are restricted to safe allowlisted Node scripts; shell, destructive, or arbitrary commands require explicit human approval.

## Recommended Commands

```bash
/loop-plan "goal"
/loop-report
/harness-optimize diagnose
/harness-optimize evaluate
```

`/loop-plan` creates a reviewable contract. `/loop-report` is read-only. `/harness-optimize` remains proposal-only.
