---
description: Push one local drip unit with clean rewritten dates and tag-based bookkeeping
agent: orchestrator
---

# Daily Sync & DevOps: $ARGUMENTS

Drip-feed exactly one local tag-defined work unit to the remote, then generate and append a progress report.
All git operations scoped to `codebase/`. No source code modifications.

---

## Core Protocols

- **Code Freeze**: You are strictly prohibited from modifying application source code during this command. This is a git-management-only task.
- **Scope Boundary**: All git operations MUST be scoped to `codebase/`. Do not run git commands from the project root.
- **Stop-Loss**: Do not advance to the next phase until the current phase output is validated.
- **Local Tags Only**: Read local tags under `drip/todo/*`; NEVER push tags to the remote.
- **Clean Remote History**: Final pushed commit messages MUST NOT contain drip metadata.
- **Patch-ID Bookkeeping**: Use `git cherry`/empty cherry-pick handling so rewritten pushed commits are not repeatedly treated as unpushed just because their hashes changed.

## GLOBAL OUTPUT RULE: NO EMOJIS
You are STRICTLY FORBIDDEN from using emojis in any generated output. All text must be plain professional text.

## Boot Sequence (MANDATORY)

1. Parse `$ARGUMENTS` as optional `<scope> [task-id]`.
2. Read `plans/$SCOPE/INSTRUCTIONS.md` and `plans/$SCOPE/$SCOPE.md` when a scope is supplied.
3. Confirm project root with `ls -laF`.
4. Confirm `codebase/` is a git repository and `origin/main` exists.

---

## Phase 1: Select Pending Drip Tag

`[Mode: Drip-Feed]`

1. Fetch remote state without modifying working files:
   ```bash
   git -C codebase fetch origin main
   ```
2. Determine the target tag pattern:
   - **No arguments**: `drip/todo/*` and select the oldest tag by `creatordate`.
   - **Scope only**: `drip/todo/$SCOPE/*` and select the oldest tag by `creatordate`.
   - **Scope + task**: `drip/todo/$SCOPE/$TASK_ID` exactly after sanitizing the task id.
3. Select `$TODO_TAG`:
   ```bash
   git -C codebase tag --list "$PATTERN" --sort=creatordate
   ```
   - If no matching tag exists, report "No pending drip tags" and stop.
   - If multiple tags match, select the first one only. Push exactly one drip unit per command run.
4. Enforce global creation order before pushing:
   - Determine `$OLDEST_GLOBAL_TAG` with `git -C codebase tag --list 'drip/todo/*' --sort=creatordate` and select the first result.
   - If `$TODO_TAG` is not `$OLDEST_GLOBAL_TAG`, stop and report:
     > "Out-of-order drip push blocked. Push `$OLDEST_GLOBAL_TAG` first or redesign the tag boundaries."
   - Rationale: drip tags are cumulative HEAD boundaries. Pushing a later scoped/exact tag before older tags would include earlier unpushed work.
5. Resolve `$TAG_COMMIT`:
   ```bash
   git -C codebase rev-parse "$TODO_TAG^{}"
   ```
6. Derive `$DONE_TAG` by replacing the prefix `drip/todo/` with `drip/done/`.
7. If `$DONE_TAG` already exists, delete `$TODO_TAG`, report that the unit is already marked done, and stop.

---

## Phase 2: Patch-Equivalent Commit Selection

`[Mode: Verify]`

1. Identify commits in the selected tag that are not already patch-equivalent to `origin/main`:
   ```bash
   git -C codebase cherry -v origin/main "$TAG_COMMIT"
   ```
2. Treat lines beginning with `+` as commits to push and lines beginning with `-` as already applied equivalents.
3. Build `$COMMITS` in chronological order:
   - Compute the merge base: `BASE=$(git -C codebase merge-base origin/main "$TAG_COMMIT")`.
   - Generate candidates oldest-first: `git -C codebase rev-list --reverse "$TAG_COMMIT" --not "$BASE"`.
   - Keep only candidates that appear as `+` lines in the `git cherry -v origin/main "$TAG_COMMIT"` output.
4. If `$COMMITS` is empty:
   - Create `$DONE_TAG` at `origin/main` as an annotated local tag:
     ```bash
     git -C codebase tag -a "$DONE_TAG" origin/main -m "drip-done source=$TODO_TAG pushed=$(date -Iseconds) original=$TAG_COMMIT"
     ```
   - Delete `$TODO_TAG`.
   - Report that all patches were already present and the tag was reconciled.
   - Stop.

---

## Phase 3: Isolated Selective Contribution

`[Mode: Execute]`

1. Save the current branch name so it can be restored after each cherry-pick.
2. For each commit `[HASH]` in `$COMMITS`:
   - Create temp branch from remote:
     ```bash
     git -C codebase checkout -B temp-drip-sync origin/main
     ```
   - Cherry-pick the commit:
     ```bash
     git -C codebase cherry-pick [HASH]
     ```
   - If cherry-pick reports an empty change because the patch is already present, run `git -C codebase cherry-pick --skip`, restore the original branch, and continue to the next commit.
   - Rewrite date to current time with sequential offset:
     ```bash
     GIT_COMMITTER_DATE="$(date -v+${INDEX}S)" git -C codebase commit --amend --no-edit --date="$(date -v+${INDEX}S)"
     ```
   - Verify the rewritten commit subject is clean:
     ```bash
     git -C codebase log -1 --pretty=%s
     ```
   - Push only the temp branch to main; explicitly disable tag following:
     ```bash
     git -C codebase push --no-follow-tags origin temp-drip-sync:main
     ```
   - Fetch `origin/main`, restore the original branch, and delete temp branch.
3. After all commits are processed, create the local done tag at `origin/main`:
   ```bash
   git -C codebase tag -a "$DONE_TAG" origin/main -m "drip-done source=$TODO_TAG pushed=$(date -Iseconds) original=$TAG_COMMIT commits=$COUNT"
   ```
4. Delete the consumed todo tag:
   ```bash
   git -C codebase tag -d "$TODO_TAG"
   ```
5. Display remaining pending queue:
   ```bash
   git -C codebase tag --list 'drip/todo/*' --sort=creatordate
   ```
6. Verify remote drip tags were not published:
   ```bash
   git -C codebase ls-remote --tags origin 'refs/tags/drip/*'
   ```
   - If any remote `drip/*` tag is listed, stop and warn the user to delete the remote tag immediately.

---

## Phase 4: DevOps Summary

`[Mode: Documentation]`

**Instruction**: Use the `task` tool to invoke `@doc-updater`. Pass this prompt:
"1. Read the last 24h of git logs and the current roadmap state.
2. Generate a progress report for the local drip tag being processed (`$TODO_TAG` and `$DONE_TAG`).
3. APPEND the report to git_report.md in the project root (the folder containing .opencode/, codebase/, and plans/).
4. Do NOT read the entire file. Append only.
5. Format:

## [$TODO_TAG] - $(date +%Y-%m-%d)

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
/push                       # Push oldest pending drip/todo tag across all scopes
/push auth                  # Push oldest pending auth drip/todo tag
/push auth login-flow       # Push exact drip/todo/auth/login-flow tag
```

---

## Edge Cases

**Hash mismatch after date rewrite:** Use `git cherry` and empty cherry-pick skipping. A pushed amended commit has a different hash from the original local commit, but the same patch-id, so it must not remain actionable.

**Out-of-order scoped/exact push:** Block it. Because tags are cumulative HEAD boundaries, a later tag can include older unpushed work. The safe default is global oldest-first processing.

**Crash after some commits pushed:** The todo tag remains. The next `/push` rerun re-evaluates patch-equivalent commits and continues only with remaining unapplied patches.

**Crash after done tag creation but before todo deletion:** If `$DONE_TAG` exists on the next run, delete the stale todo tag and report reconciliation.

**Tag names:** Use `drip/todo/<scope>/<task-id>` and `drip/done/<scope>/<task-id>`. Never use leading-dot tag names.

**Tag leakage prevention:** Always push with `--no-follow-tags`. Annotated local drip tags must never be published, even if the user's git config has `push.followTags=true`.

---

## Related Commands

- `/commit <scope> <task-id>` - Add manual work to the local drip queue.
- `/routine <scope> <task-id>` - Execute a planned task and create a local drip tag.
- `/sitrep [scope]` - Show pending tags, completed tags, and next recommended action.
