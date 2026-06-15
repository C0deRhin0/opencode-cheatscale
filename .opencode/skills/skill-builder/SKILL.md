---
name: skill-builder
description: Creates and validates OpenCode skills. Use when adding `.opencode/skills/<name>/SKILL.md`, converting reusable guidance into a skill, or checking skill frontmatter and naming collisions.
origin: OCS
---

# Skill Builder

Skill Builder is the safe path for adding reusable OpenCode skills without breaking discovery.

## When to Use

- The user asks to create a new skill.
- A repeated workflow should become reusable guidance.
- A command needs a companion discovery skill while keeping the command intact.
- Skill metadata, folder names, or descriptions need validation.

## Required OpenCode Skill Shape

```markdown
---
name: my-skill
description: Use when the user says concrete trigger words and needs a specific workflow.
origin: OCS
---

# My Skill
```

Rules:

- Folder and `name` must match.
- Name must be lowercase kebab-case.
- Description should say what the skill does and when to use it.
- Prefer skills as progressive disclosure. Do not add full skill files to `opencode.json` `instructions` unless they must be loaded every session.
- Never delete a deterministic slash command just because a companion skill exists.

## Commands

Validate all skills:

```bash
node .opencode/scripts/skill-builder/validate-skill.cjs validate
```

Create a skill:

```bash
node .opencode/scripts/skill-builder/create-skill.cjs create my-skill "Use when..."
```

## Collision Policy

The builder blocks duplicate skill folders and warns when a new skill name collides with an agent or command. Command and skill name overlap is allowed only when the skill is a companion discovery layer and the command remains the deterministic execution path.
