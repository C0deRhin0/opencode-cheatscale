---
description: Run the daily synchronization loop for DevOps overhead and contribution smoothing (Native Git)
agent: orchestrator
---

# Daily Sync & DevOps: $ARGUMENTS

Drip-feed exactly one commit (or a tagged batch) to the remote, then generate and append a progress report.
All git operations scoped to `codebase/`. No source code modifications.

---

## Core Protocols

- **Code Freeze**: You are strictly prohibited from modifying application source code during this command. This is a git-management-only task.
- **Scope Boundary**: All git operations MUST be scoped to `codebase/`. Do not run git commands from the project root.
- **Stop-Loss**: Do not advance to the next phase until the current phase output is validated.

## GLOBAL OUTPUT RULE: NO EMOJIS
You are STRICTLY FORBIDDEN from using emojis in any generated output. All text must be plain professional text.

## Boot Sequence (MANDATORY)

1. Read `plans/$SCOPE/INSTRUCTIONS.md` and `plans/$SCOPE/feature.md`
2. Confirm project root with `ls -laF`

---

## Phase 1: Isolated Selective Contribution

`[Mode: Drip-Feed]`

1. Identify target commits from `codebase/`:
    - **No argument**: Identify the oldest single unpushed commit: `git log origin/main..main --oneline --reverse -1`. Push exactly ONE.
    - **Task argument** (e.g., `auth login-flow`): Translate to namespaced grep: `grep="\[$SCOPE#task-id\]$"`. Identify ALL unpushed commits matching that tag: `git log origin/main..main --oneline --reverse --grep="\[$SCOPE#task-id\]$"`.
    - **Legacy PnDm** (e.g., `core P1D1`): Use grep pattern `grep="\[$SCOPE:PnDm\]$"` (deprecated, backward compatible).
2. For each identified commit `[HASH]`:
   - Create temp branch from remote: `git checkout -b temp-drip-sync origin/main`
   - Cherry-pick: `git cherry-pick [HASH]`
   - Rewrite date to current time with sequential offset: `GIT_COMMITTER_DATE="$(date -v+${INDEX}S)" git commit --amend --no-edit --date="$(date -v+${INDEX}S)"`
   - Push: `git push origin temp-drip-sync:main`
   - Clean up: return to working branch, delete temp branch
3. Display remaining queue: `git log origin/main..main --oneline`

---

## Phase 2: DevOps Summary

`[Mode: Documentation]`

**Instruction**: Use the `task` tool to invoke `@doc-updater`. Pass this prompt:
"1. Read the last 24h of git logs and the current roadmap state.
2. Generate a progress report for the task being processed.
3. APPEND the report to git_report.md in the project root (the folder containing .opencode/, codebase/, and plans/).
4. Do NOT read the entire file. Append only.
5. Format:

## [$SCOPE#task-id] - $(date +%Y-%m-%d)

### Accomplishments
- [List each commit as a bullet point]

### Architectural Changes
- [Briefly list impacts to system architecture or state management]"

Wait for `@doc-updater` to finish.

---

## Completion

Report the drip-feed result and the remaining unpushed queue to the user.

---

## Usage
```bash
/push auth login-flow         # Push commits for task: login-flow (NEW)
/push core P1D1           # Push commits for Phase 1 Day 1 (OLD, deprecated)
/push billing             # Push oldest commit
```

**Note**: Uses `[scope#task-id]` tag format (1:1 JIRA mapping)