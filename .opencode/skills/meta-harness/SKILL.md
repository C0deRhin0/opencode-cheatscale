---
name: meta-harness
description: Manual, benchmark-gated OpenCode harness diagnosis. Use when optimizing `.opencode/` after repeated gotchas, plugin failures, routing mistakes, or stale harness documentation.
origin: OCS
---

# Meta-Harness

Meta-harnessing treats the harness itself as an optimization target. This implementation is intentionally manual-first and read-only by default.

## When to Use

- Multiple gotchas point to the same root cause.
- Plugin hooks, agent prompts, commands, or skills behave differently from their documentation.
- Harness health passes but runtime behavior still fails.
- The user explicitly asks to optimize or diagnose `.opencode/`.

## Safety Boundaries

- Diagnosis can read gotchas and optional redacted traces.
- Proposal generation can write only to `.opencode/local/meta-harness/`.
- Evaluation requires at least one benchmark or explicit user approval.
- Deployment is blocked by default and requires human approval.
- Never modify `scripts/meta-harness/CONSTANTS.cjs`, permission policies, credential files, or this skill's safety rules as part of an optimization loop.
- Follow `.opencode/skills/loop-engineering/SKILL.md` and `.opencode/loop-contracts/loop-contract-template.yaml` for loop contracts, stop conditions, maker/checker separation, state ownership, and approval gates.
- Raw loop state stays in `.opencode/local/`; only reviewed durable knowledge may be promoted to committed docs, commands, or skills.
- Do not write loop-generated conclusions to MCP memory without explicit human promotion.

## Commands

```bash
node .opencode/scripts/meta-harness/diagnose.cjs diagnose
node .opencode/scripts/meta-harness/evaluate.cjs evaluate
node .opencode/scripts/meta-harness/deploy.cjs deploy --proposal <file> --approved-by-user
```

Executable benchmark specs live under `.opencode/local/benchmarks/`. Use `.opencode/loop-contracts/benchmark-spec-template.json` as the committed template. Prefer `command` plus an `args` array with `shell: false`. Without `--approved-by-user`, benchmarks are restricted to a safe Node script allowlist and run through the current Node runtime; shell-based, destructive, or arbitrary commands require explicit `--approved-by-user`.

Trace capture is opt-in:

```bash
export OCS_TRACE_CAPTURE=1
```

## Output

The diagnosis writes local reports under `.opencode/local/meta-harness/`. Reports are not committed and should be reviewed before any harness edit.
