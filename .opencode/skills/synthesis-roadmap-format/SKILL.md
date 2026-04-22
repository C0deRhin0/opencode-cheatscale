---
name: synthesis-roadmap-format
description: Canonical file templates, frontmatter specs, and validation rules for bootstrap roadmap generation. Used by synthesis-writer agents and the /bootstrap command.
origin: bootstrap-audit
---

# Synthesis Roadmap Format

Canonical formatting rules for all planning artifacts generated during `/bootstrap`. This is the **single source of truth** — both `bootstrap.md` and `synthesis-writer` agents reference this skill instead of inlining templates.

## When to Activate

- Writing planning files during `/bootstrap` Synthesis phase
- Validating roadmap file structure after generation
- Creating or modifying files in `plans/$SCOPE/`
- Running `/inject` to add features to an existing roadmap

---

## Frontmatter Requirements

Every file MUST include YAML frontmatter for Obsidian graph linking.

### Frontmatter Mapping

| File | Tags | Extra Fields | Graph Role |
|------|------|--------------|------------|
| `$SCOPE.md` | `tags: [scope, $SCOPE]` | `jira_project`, `jira_epic`, `type: scope` | **Central Hub** |

| `coding_convention.md` | `tags: [convention, $SCOPE]` | `scope` | Leaf → $SCOPE |
| `INSTRUCTIONS.md` | `tags: [instructions, $SCOPE]` | `scope` | Leaf → $SCOPE |
| `tasks/*.md` | `tags: [task, $SCOPE]` | `scope`, `parent: "[[$SCOPE]]"`, `jira_key`, `jira_url` | Leaf → $SCOPE |

---

## File Templates

### `$SCOPE.md` — Central Hub

```markdown
---
tags: [scope, $SCOPE]
scope: $SCOPE
jira_project: "{$Q8 or 'none'}"
jira_epic: ""
type: scope
---

# Scope: $SCOPE

## Overview
<!-- One-sentence description -->

## Technical Approach
- **Architecture**: {description from Wave 2}
- **Dependencies**: {list of packages}
- **Key Files**:
  - `{file-path}` - {description}

## Tasks
### Task: {TASK_NAME_1}
- [[tasks/{task-name-1}.md]]
- Type: story | task | bug
- Estimate: {N} SP

### Task: {TASK_NAME_2}
- [[tasks/{task-name-2}.md]]
- Type: story | task

## Context
- [[coding_convention]]
- [[INSTRUCTIONS]]
```

---

### `coding_convention.md` — Tech Conventions

```markdown
---
tags: [convention, $SCOPE]
scope: $SCOPE
---

# Coding Conventions: $SCOPE

## Tech Stack
- **Framework**: ...
- **Language**: ...

## File Structure
```
codebase/
├── src/
...
```

## Naming Conventions
- **Components**: PascalCase
- **Pages**: kebab-case
```

---

### `INSTRUCTIONS.md` — Project Rules

```markdown
---
tags: [instructions, $SCOPE]
scope: $SCOPE
---

# Project Instructions: $SCOPE

## Workspace Boundaries
- **Implementation Root**: `codebase/`
- **Plans Directory**: `plans/$SCOPE/`

## Core Principles
1. ...
```

---

### `tasks/{TASK_NAME}.md` — Task File

```markdown
---
tags: [task, $SCOPE]
scope: $SCOPE
parent: "[[$SCOPE]]"
jira_key: ""
jira_url: ""
---

# Task: {TASK_NAME}

**JIRA**: TBD

## Overview
{Brief description}

## Command Sequence

### 1. {SUBTASK_NAME}
```bash
# Exact command
```

- **Working Directory**: `{directory}`
- **Expected Output**: {description}
- **Files Changed**: `{file-path}`
- **Verify**: {validation}

## Validation Checklist
- [ ] ...
- [ ] ...

## Notes
{Implementation notes}
```

---

## Validation Rules (MANDATORY)

Before writing ANY file, verify these rules are followed.

### 1. Checkbox Syntax (CRITICAL)

- ALL validation checkboxes MUST be in **FUTURE TENSE** starting with action verbs
- **CORRECT**: `- [ ] Verify that package.json exists with eleventy in devDependencies`
- **CORRECT**: `- [ ] Ensure npm run build produces output in _site/ directory`
- **WRONG**: `- [ ] package.json exists with eleventy in devDependencies` (present tense)
- **WRONG**: `- [ ] .eleventy.js configuration file is present` (passive voice)

### 2. Task File Structure (CRITICAL)

- Task files MUST exist in `plans/$SCOPE/tasks/` directory (NOT a single `tasks.md`)
- Each task file MUST have:
  - Frontmatter with `tags: [task, $SCOPE]`, `scope: $SCOPE`, `parent: "[[$SCOPE]]"`
  - `## Validation Checklist` section with checkboxes
  - Checkboxes using `- [ ]` format

### 3. Technical Completeness (CRITICAL)

- If using Tailwind CSS: Must include PostCSS/build step in commands
- If using Eleventy: Must have proper PassthroughCopy configuration
- If CSS framework specified: Must document HOW it's included in HTML
- Must include git initialization for data durability

### 4. Frontmatter Required

- Every file must have `tags:` and `scope:` in frontmatter
- Wiki-links connect files: `[[$SCOPE]]`, `[[coding_convention]]`, `[[INSTRUCTIONS]]`, etc.

### 5. No Code Sovereignty

- Never write to `codebase/` during bootstrap; only `plans/`

### 6. No Emojis (CRITICAL)

- **NEVER** use emojis in any planning artifact.
- Use plain text, markdown formatting, or standard ASCII characters only
- Use `> ⚠️` blockquotes sparingly if needed — prefer `**WARNING**:` text instead

---

## Wiki-Link Patterns

Files connect via Obsidian-style wiki-links:

| From | Links To |
|------|----------|
| `$SCOPE.md` | `[[coding_convention]]`, `[[INSTRUCTIONS]]`, `[[tasks/{name}]]` |
| `tasks/*.md` | `[[$SCOPE]]` (via `parent` frontmatter) |
| All files | `[[$SCOPE]]` (via `scope` frontmatter for graph grouping) |
