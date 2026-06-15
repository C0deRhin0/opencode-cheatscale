---
name: context-budget
description: Context budget analysis for OpenCode CheatScale. Use when the user invokes `/context-budget` or asks to reduce token overhead, inspect eager instructions, tune agent/skill loading, or keep loop runs within context limits.
origin: OCS
---

# Context Budget

Analyze context usage across instructions, agents, commands, skills, MCPs, plans, and local loop state. The goal is to reduce token overhead without losing the minimum context required for correct work.

## Principles

- Prefer progressive disclosure through skills over eager instructions.
- Read only the files required for the current loop or command.
- Summarize durable state into compact records instead of replaying traces.
- Keep large local-only artifacts out of prompts unless specifically diagnosing them.
- Treat context as a budgeted resource, not a free cache.

## Four-Phase Analysis

### 1. Inventory

List likely context sources:

- `opencode.json` instructions
- active command prompt
- selected agent prompt
- loaded skills
- roadmap files under `plans/`
- recent diffs or verification records
- MCP/tool outputs
- local gotchas or traces when explicitly relevant

### 2. Classify

Mark each source:

- **Required** — needed to safely complete the task.
- **Useful** — helpful but can be summarized.
- **Deferred** — retrieve only if a condition is met.
- **Avoid** — noisy, stale, secret-bearing, or unrelated.

### 3. Detect Issues

Look for:

- full-roster agent spawning when a smaller loop would work
- broad `plans/` traversal for a narrow task
- repeated skill bodies pasted into prompts
- large command outputs without summaries
- traces used when a verification record would suffice
- context above 80% before a multi-step loop

### 4. Report

Use this output format:

```text
Context Budget Report

Estimated window: [tokens or assumption]
Risk: LOW | MEDIUM | HIGH

Required context:
- ...

Deferred context:
- ...

Avoided/noisy context:
- ...

Recommendations:
1. ...
2. ...

Loop impact:
- Max recommended agents:
- Max recommended iterations:
- Suggested stop point:
```

## Loop-Specific Guidance

- For `/loop-plan`, keep context to the goal, relevant templates, and policy.
- For `/loop-report`, summarize counts and paths, not raw trace bodies.
- For `/routine`, load only the scope hub, specific task file, conventions, and relevant source files.
- For `/harness-optimize`, prefer gotcha summaries and verification records before raw traces.
