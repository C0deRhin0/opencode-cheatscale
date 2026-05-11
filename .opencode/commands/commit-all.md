---
description: Detect all changes, commit each separately, then push all
agent: orchestrator
---

# Commit All: $ARGUMENTS

Commit all unstaged changes separately using conventional commit format, then push.

---

## Execution

**All git operations operate at codebase/ directory**

1. **Detect All Changes**:
   ```bash
   cd codebase && git status
   ```

2. **Commit Each File SEPARATELY** (maximize commits):
   - For EVERY single changed file, create a separate commit
   - NEVER group multiple files together
   - Run: `git add  && git commit -m "<type>: <description>"`
   
   Change type determination:
   | Type | Trigger |
   |------|---------|
   | `feat` | New features, adding commands/agents |
   | `fix` | Bug fixes, improvements |
   | `refactor` | Restructuring, renaming, updates |
   | `docs` | Documentation, readmes |
   | `chore` | Config, dependencies, gitignore |
   | `style` | Formatting only |

3. **Push All Commits**:
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

- **MAXIMIZE commits** - Commit EACH file separately, never bundle
- Use conventional commit format: `<type>: <description>`
- If a file has multiple logical changes, commit each change separately
- Do NOT group related files together - more commits is better

---

## Usage

```bash
/commit-all              # Commit all changes with auto-generated messages
/commit-all "minor"     # Optional context for commit messages
```