---
description: Commit current work into the local drip queue using clean messages and local git tags
agent: orchestrator
---

# Stage for Drip-Feeder: $ARGUMENTS

Commit current uncommitted changes to local git history without pushing. Preserve drip grouping with local-only git tags, not visible commit-message suffixes.
All git operations scoped to `codebase/`. No source code modifications.

---

## Core Protocols

- **Code Freeze**: You are strictly prohibited from modifying application source code during this command. This is a git-management-only task.
- **Scope Boundary**: All git operations MUST be scoped to `codebase/`. Do not run git commands from the project root.
- **Clean History**: Commit subjects and bodies MUST NOT contain drip metadata such as `[scope#task-id]`, `[scope:PnDm]`, `drip-group`, or day markers.
- **Local Tag Queue**: Use local annotated tags under `drip/todo/<scope>/<task-id>` as the drip-feeder queue. NEVER push tags.
- **Tag Safety**: Do not use leading-dot tag names such as `.drip/day-1`; use `drip/...` because leading-dot ref path components are invalid/fragile.

## GLOBAL OUTPUT RULE: NO EMOJIS
You are STRICTLY FORBIDDEN from using emojis in any generated output. All text must be plain professional text.

## Boot Sequence (MANDATORY)

1. Parse `$ARGUMENTS` as `<scope> [task-id or description]`.
2. Read `plans/$SCOPE/$SCOPE.md` and relevant task file in `plans/$SCOPE/tasks/` when a task id is provided.
3. Confirm project root with `ls -laF`.
4. Confirm `codebase/` is a git repository before running git commands.

---

## Phase 1: Local Commitment

`[Mode: Stage]`

1. Run `git status` within `codebase/` to check for uncommitted changes.
    - **If no changes detected**: Report "No changes to stage" and stop. Do not proceed.
2. Determine `$TASK_ID`:
   - If the second argument matches a task file under `plans/$SCOPE/tasks/`, use that filename slug without `.md`.
   - If the second argument is descriptive text, derive a lowercase kebab-case slug from it.
   - If no task is provided, use `manual-$(date +%Y%m%d-%H%M%S)`.
3. Sanitize `$TASK_ID` for tag usage: lowercase, replace spaces with `-`, remove characters outside `[a-z0-9._/-]`, and collapse repeated separators.
4. Set `$TODO_TAG="drip/todo/$SCOPE/$TASK_ID"`.
5. Set `$DONE_TAG` by replacing `drip/todo/` with `drip/done/`.
6. Check for existing todo or done tags:
   ```bash
   git -C codebase rev-parse -q --verify "refs/tags/$TODO_TAG"
   git -C codebase rev-parse -q --verify "refs/tags/$DONE_TAG"
   ```
   - If either tag exists, stop and report that this drip unit id is already used. Do not overwrite tags. Choose a new task id if this is additional work.
7. Run `git add .` for all changes within `codebase/`.
8. Generate a clean commit message following this format:
    ```
    <type>(<scope>): <concise description of changes>
    ```
    - Where `type` is one of: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`.
    - Do NOT include `[scope#task-id]`, `[scope:PnDm]`, `drip-group`, or any artificial day marker.
9. Run `git commit -m "<message>"`.
10. Create the local annotated drip tag at the new HEAD:
   ```bash
   git -C codebase tag -a "$TODO_TAG" -m "drip-unit scope=$SCOPE task=$TASK_ID created=$(date -Iseconds)"
   ```
11. **Do NOT run `git push`** and **do NOT push tags**. The code and tag must remain local for the drip-feeder queue.
12. **Do NOT run `git reset --hard`**. The code must remain in the filesystem.
13. Confirm the commit and tag were created successfully.
14. Display the current drip-feeder queue:
   ```bash
   git -C codebase tag --list 'drip/todo/*' --sort=creatordate
   ```

---

## Phase 2: Queue Integrity Check

`[Mode: Verify]`

1. Show the clean commit subject: `git -C codebase log -1 --pretty=%s`.
2. Verify the clean subject does not contain drip metadata.
3. Show the tag target: `git -C codebase rev-parse "$TODO_TAG^{}"`.
4. Show remaining local-only queue tags and completed tags:
   ```bash
   git -C codebase tag --list 'drip/todo/*' --sort=creatordate
   git -C codebase tag --list 'drip/done/*' --sort=creatordate
   ```

---

## Usage
```bash
/commit auth login-flow              # Commit current changes and tag drip/todo/auth/login-flow
/commit billing stripe-callback      # Commit current changes and tag drip/todo/billing/stripe-callback
/commit core "refactor auth logic"   # Derive a task slug from descriptive text
```

---

## Related Commands

- `/routine <scope> <task-id>` - Execute a roadmapped task and create an atomic drip tag automatically.
- `/push [scope] [task-id]` - Push the oldest pending local drip tag without pushing tag metadata.
- `/sitrep [scope]` - Inspect pending tags, completed tags, local state, and next roadmap work.
