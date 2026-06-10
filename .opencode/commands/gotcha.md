---
description: Log, list, and check recurring harness mistakes using local-only gotcha state.
agent: build
---

# Gotcha Command

Manage local-only mistake memory for the harness. State is stored under `.opencode/local/` and must never be committed.

## Usage

```bash
/gotcha log --pattern "forget-tests" --description "Committed before tests" --trigger "git commit" --avoidance "Run the relevant test suite before committing"
/gotcha check --command "git commit -m 'fix: auth'"
/gotcha list
/gotcha generate-view
```

## Process

1. For `log`, run:
   ```bash
   node .opencode/scripts/gotcha/log-mistake.cjs $ARGUMENTS
   ```
2. For `check`, run:
   ```bash
   node .opencode/scripts/gotcha/check-gotcha.cjs $ARGUMENTS
   ```
3. For `list`, run:
   ```bash
   node .opencode/scripts/gotcha/log-mistake.cjs list
   ```
4. For `generate-view`, run:
   ```bash
   node .opencode/scripts/gotcha/generate-view.cjs
   ```

## Safety Rules

- Do not store secrets, raw tokens, private paths, or long transcripts.
- Store the pattern and prevention rule, not sensitive mistake content.
- If a credential exposure gotcha is logged, tell the user to rotate the credential.

$ARGUMENTS
