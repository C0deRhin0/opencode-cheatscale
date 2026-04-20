---
description: Detect all changes, commit each separately, then push all
agent: orchestrator
---

# Commit All: $ARGUMENTS

Commit all unstaged changes separately using conventional commit format, then push.

---

## Execution

1. **Detect Changes**:
   ```bash
   cd codebase && git status
   ```

2. **For Each Changed File/Folder**:
   - Analyze the diff to determine change type:
     | Type | Trigger |
     |------|---------|
     | `feat` | New features, adding commands/agents |
     | `fix` | Bug fixes, improvements |
     | `refactor` | Restructuring, renaming, updates |
     | `docs` | Documentation, readmes |
     | `chore` | Config, dependencies, gitignore |
     | `style` | Formatting only |

   - Commit format: `<type>: <what changed>`
   - Example: `git add .opencode/commands/new-cmd.md && git commit -m "feat: add new-cmd command"`

3. **Push All**:
   ```bash
   cd codebase && git push
   ```

4. **Report**:
   ```
   ## Commits Pushed

   | # | Commit | Description |
   |---|--------|-------------|
   | 1 | xxx | description |
   | ... | ... | ... |

   All pushed to origin/main.
   ```

---

## Rules

- Commit each logical change separately
- Use conventional commit format: `<type>: <description>`
- Group related files in one commit if they represent one logical change
- If unsure about commit type, use `refactor` as default

---

## Usage

```bash
/commit-all              # Commit all changes with auto-generated messages
/commit-all "minor"     # Optional context for commit messages
```
