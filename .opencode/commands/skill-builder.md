---
description: Create and validate OpenCode-compatible skills with collision checks.
agent: build
---

# Skill Builder Command

Create or validate skills without bypassing OpenCode's skill loading rules.

## Usage

```bash
/skill-builder validate
/skill-builder validate gotcha
/skill-builder create my-skill "Use when..."
```

## Process

1. For validation, run:
   ```bash
   node .opencode/scripts/skill-builder/validate-skill.cjs $ARGUMENTS
   ```
2. For creation, run:
   ```bash
   node .opencode/scripts/skill-builder/create-skill.cjs $ARGUMENTS
   ```
3. After creating or editing skills, run `/harness-health`.
4. Restart OpenCode before expecting new skills to be discoverable.

## Constraints

- Skills live at `.opencode/skills/<name>/SKILL.md`.
- Skill names must be lowercase kebab-case and match the folder.
- Every skill needs `name` and a trigger-rich `description`.
- Do not inline large skill bodies into `opencode.json`; rely on `skills.paths` discovery.

$ARGUMENTS
