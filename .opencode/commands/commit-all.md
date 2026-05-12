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
   - **Count Check**: If there are more than 18 tracked/changed files, create a commit plan, then execute the plan.


2. **Commit Each File SEPARATELY** (at most 18 commits):
   - For EVERY single changed file, create a separate commit
   - LIMIT to a maximum of 18 commits total per execution
   - NEVER group multiple files together
   - Run: `git add <file> && git commit -m "<type>: <description>"`
   
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

- **MAXIMIZE commits** - Commit EACH file separately, never bundle, but STOP at 18 commits.
- **Limit Handling**: If there are >18 changes, commit the first 18 individually and ignore the rest. DO NOT bundle the remaining changes into a single large commit.
- Use conventional commit format: `<type>: <description>`
- If a file has multiple logical changes, commit each change separately
- Do NOT group related files together - more commits is better (up to the 18 commit limit)

---

## Usage

```bash
/commit-all              # Commit all changes with auto-generated messages
/commit-all "minor"     # Optional context for commit messages
```