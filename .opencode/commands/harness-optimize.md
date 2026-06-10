---
description: Run a manual, gated meta-harness diagnosis using local gotchas and optional traces.
agent: build
---

# Harness Optimize Command

Run a read-only meta-harness diagnosis. This command proposes improvements but does not deploy them automatically.

## Usage

```bash
/harness-optimize diagnose
/harness-optimize evaluate
```

## Process

1. Run diagnosis:
   ```bash
   node .opencode/scripts/meta-harness/diagnose.cjs $ARGUMENTS
   ```
2. If evaluation is requested, run:
   ```bash
   node .opencode/scripts/meta-harness/evaluate.cjs $ARGUMENTS
   ```
3. Do not apply any proposal until the user explicitly approves it.
4. Do not modify safety constants, permission rules, local credential files, or this command's safety boundary.

## Loop Engineering Contract

Harness optimization is a **diagnosis/proposal loop**, not an autonomous self-edit loop.

- Read policy: `.opencode/skills/loop-engineering/SKILL.md`
- Use contract template: `.opencode/loop-contracts/loop-contract-template.yaml`
- Use verification record template: `.opencode/loop-contracts/verification-record-template.yaml`
- Use reviewer output template: `.opencode/loop-contracts/reviewer-output-template.md`

Required loop boundaries:

- Raw diagnosis, proposals, traces, and benchmark results stay under `.opencode/local/`.
- `.opencode/` changes must be proposed as reviewable diffs, not self-applied.
- MCP memory writes require explicit human promotion.
- Evaluation must use executable benchmarks under `.opencode/local/benchmarks/` or explicit manual approval.
- Deployment remains blocked by default and manual-only.

## Trace Capture

Execution trace capture is disabled by default. Enable it only for diagnosis sessions:

```bash
export OCS_TRACE_CAPTURE=1
```

Traces are redacted, capped, and stored under `.opencode/local/execution-traces/`.

## Verification Record

When reporting an optimization proposal, include:

```text
Verification Record: PASS | FAIL | PARTIAL | NOT_RUN
Benchmarks run:
Reviewer decision:
Unverified claims:
Risks:
Rollback instructions:
Human approval required: yes
```

$ARGUMENTS
