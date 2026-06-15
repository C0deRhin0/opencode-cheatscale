---
name: loop-engineering
description: Loop Engineering for OpenCode CheatScale. Use when designing bounded, manual-approved agent loops, loop contracts, stop conditions, maker/checker workflows, worktree isolation, verification records, and report-only automation.
origin: OCS
---

# Loop Engineering

Loop Engineering designs systems that prompt, route, verify, and remember for agents without surrendering engineering judgment. In CheatScale, loops are **manual-first**, **bounded**, **evidence-producing**, and **human-approved**.

## Core Policy

- Loops may diagnose and propose `.opencode/` changes.
- Loops may not directly apply `.opencode/` changes without explicit human approval.
- Raw loop state stays in `.opencode/local/`.
- Reviewed, stable knowledge may be promoted into committed docs, skills, commands, or benchmark specs.
- MCP memory writes require explicit human promotion.
- Worktree isolation starts as a documented protocol and can later become helper tooling.
- The first loop command is `/loop-plan`; report-only heartbeat behavior belongs in `/loop-report`.
- Autonomous heartbeat loops remain disabled until benchmarks, budgets, rollback, and approval gates are real.

## Building Blocks

1. **Automations / heartbeat** — recurring discovery and triage, report-only by default.
2. **Worktrees** — isolate risky or parallel loop attempts.
3. **Skills** — durable project intent that prevents repeated prompting and guessing.
4. **Plugins / connectors** — MCP and hook access to real tools, gated by least privilege.
5. **Sub-agents** — maker/checker separation so writers do not grade their own work.
6. **External memory/state** — files, plans, gotchas, verification records, and reviewed docs outside a single conversation.

## Loop Contract Required Fields

Every loop proposal should define:

```yaml
name:
trigger:
scope:
maker:
checker:
allowed_tools:
state_read:
state_write:
max_iterations:
max_tool_calls:
max_wall_time:
stop_success:
stop_failure:
escalation:
human_approval_required:
rollback:
```

Use `.opencode/loop-contracts/loop-contract-template.yaml` as the canonical source-harness template. In portable exports, use `.agents/loop-contracts/loop-contract-template.yaml`.

## Stop Conditions

Prefer verifiable stop conditions over prose claims:

- command exits with expected status
- expected output pattern appears
- tests pass
- reviewer returns `PASS` or `PASS_WITH_NOTES` with no Critical/High findings
- changed-file count stays within scope
- iteration/tool/time budget remains under cap
- no denied paths or forbidden connectors are touched

Stop and escalate when:

- the same failure repeats
- a checker reports Critical/High findings
- budget is exhausted
- scope expands beyond contract
- a command would modify forbidden state
- evidence is missing or ambiguous

## Maker / Checker Separation

- Makers may write/edit only within the loop scope.
- Checkers should be read-only in loop contexts.
- Critics/adversarial reviewers should be read-only.
- Reducers synthesize; they do not silently apply changes.
- The agent that writes code or harness changes must not be the only verifier.

Reviewer output should follow `.opencode/loop-contracts/reviewer-output-template.md` or the portable `.agents/loop-contracts/reviewer-output-template.md` mirror.

## State Ownership

| State | Location |
|---|---|
| Raw gotchas, traces, diagnoses, temporary plans | `.opencode/local/` |
| Loop contracts in progress | `.opencode/local/loop-contracts/` |
| Verification run records | `.opencode/local/verification/` |
| Benchmark run results | `.opencode/local/meta-harness/evaluations/` |
| Stable templates and policies | `.opencode/loop-contracts/` |
| Reviewed project/harness knowledge | committed docs, commands, skills, or benchmarks |
| Private user preferences | local/memory only, never automatic from loops |

## Forbidden Automation Surfaces

Do not let an autonomous loop modify:

- `.opencode/opencode.json`
- permission policies
- plugin hooks
- MCP credentials or connector activation
- `.opencode/local/**`
- safety constants
- JIRA credential files
- git push, force push, package publish, JIRA delete, or memory writes

Changes to these surfaces require explicit human approval and a reviewed diff.

## Commands

- `/loop-plan <goal>` — produce a reviewable loop contract. No automation runs.
- `/loop-report` — read-only heartbeat report over local state and known queues.
- `/harness-optimize` — remains diagnosis/proposal only; deployment is blocked by default.

## When Not To Use

- Do not use loop engineering to avoid understanding a change.
- Do not use it to justify self-modifying harness automation.
- Do not promote loop-generated conclusions into memory or committed docs without review.
- Do not run connector side effects as part of report-only loops.
