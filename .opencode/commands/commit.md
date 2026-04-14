---
description: Stage the current work for the strategic contribution drip-feeder (Native Git)
agent: planner
---

# Stage for Drip-Feeder: $ARGUMENTS

Commit current uncommitted changes to local git history without pushing. Preserves work in the drip-feeder queue.
All git operations scoped to `codebase/`. No source code modifications.

---

## Core Protocols

- **Code Freeze**: You are strictly prohibited from modifying application source code during this command. This is a git-management-only task.
- **Scope Boundary**: All git operations MUST be scoped to `codebase/`. Do not run git commands from the project root.
- **Naming Convention**: You are strictly forbidden from using the `[$SCOPE:PnDm]` suffix in the commit message. This suffix is reserved for `/routine` ONLY.

## GLOBAL OUTPUT RULE: NO EMOJIS
You are STRICTLY FORBIDDEN from using emojis in any generated output. All text must be plain professional text.

## Boot Sequence (MANDATORY)

1. Read `plans/$SCOPE/roadmap.md` to identify the current active phase
2. Confirm project root with `ls -laF`

---

## Phase 1: Local Commitment

`[Mode: Stage]`

1. Run `git status` within `codebase/` to check for uncommitted changes.
   - **If no changes detected**: Report "No changes to stage" and stop. Do not proceed.
2. Run `git add .` for all changes within `codebase/`.
3. Generate a commit message following this format:
   ```
   <type>(<scope>): <concise description of changes>
   ```
   - Where `type` is one of: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`.
   - Reference the current active phase from `plans/$SCOPE/roadmap.md` in the scope when applicable.
   - The `<type>` AND/OR `<description>` MUST NOT contain any phase prefixes like `[Phase N Day M]` or `[PnDm]`. 
4. Run `git commit -m "<message>"`.
5. **Do NOT run `git push`**. The code must remain local for the drip-feeder queue.
6. **Do NOT run `git reset --hard`**. The code must remain in the filesystem.
7. Confirm the commit was successful and that the local branch is ahead of the remote.
8. Display the current drip-feeder queue: `git log origin/main..main --oneline`

---

## Usage
```bash
/commit core "refactor auth logic"
/commit billing "fix stripe callback"
```
