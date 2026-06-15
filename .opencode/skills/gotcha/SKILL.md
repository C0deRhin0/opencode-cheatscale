---
name: gotcha
description: Mistake tracking and avoidance for OpenCode CheatScale. Use when the user says "log this mistake", "gotcha", "avoid repeating this", or before risky git, publish, deploy, or harness-edit operations.
origin: OCS
---

# Gotcha

The gotcha system records recurring mistakes as local-only patterns and surfaces short prevention reminders when relevant.

## When to Use

- The user says they made a mistake and wants it remembered.
- A workflow failure repeats, such as committing before tests or pushing drip tags.
- Before risky commands: `git commit`, `git push`, `git reset --hard`, `npm publish`, `pnpm publish`, `yarn publish`, or `bun publish`.
- During harness maintenance when a discovered failure should become a reusable guardrail.

## Storage Model

- Source of truth: `.opencode/local/gotchas.json`
- Archive: `.opencode/local/gotchas-archive.json`
- Optional generated view: `.opencode/skills/gotcha/gotchas.md`

The `local/` folder and generated view are ignored. Never commit user-specific gotchas or traces.

## Procedures

### Log a mistake

```bash
node .opencode/scripts/gotcha/log-mistake.cjs log \
  --pattern "forget-tests" \
  --description "Committed before running tests" \
  --category "workflow" \
  --trigger "git commit" \
  --avoidance "Run the relevant test suite before committing"
```

### Check a risky command

```bash
node .opencode/scripts/gotcha/check-gotcha.cjs check --command "git commit -m 'fix: auth'"
```

### Generate a local human-readable view

```bash
node .opencode/scripts/gotcha/generate-view.cjs
```

## Rules

- Log patterns, not private content.
- Redact secrets before writing state.
- Aggregate repeated mistakes by `pattern`.
- Keep at most 50 active entries; archive pruned entries locally.
- Use gotchas as reminders, not hard blockers, unless the user explicitly requests strict mode.
