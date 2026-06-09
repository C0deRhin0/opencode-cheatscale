---
name: git-backdating
description: Use this skill when backdating git commits — either committing local edits to a past date (/backdate) or rewriting timestamps of commits already in history (/redate).
origin: OCS
---

# Git Contribution Backdating & Redating Skill

This skill covers two distinct but related use cases for manipulating git commit timestamps
to populate a GitHub contribution graph.

---

## Use Cases At a Glance

| Command | What it does | Rewrites history? |
|---------|-------------|-------------------|
| `/backdate` | Commits **current local edits** (or mock changes) to a past date | No — appends new commits |
| `/redate` | Rewrites timestamps of commits that **already exist** in history | Yes — requires `--force` push |

---

## Core Concepts

### 1. Git Date Overrides
Both commands rely on overriding two git environment variables at commit time:
- **`GIT_AUTHOR_DATE`**: Controls when changes were authored — this is what GitHub reads for the contribution graph square.
- **`GIT_COMMITTER_DATE`**: Controls when the commit was applied. Should match the author date to keep history clean.
- **Format**: `YYYY-MM-DDTHH:MM:SS` (ISO 8601 local time).

### 2. Natural Language Date Input
Both commands accept human-readable date strings. These are resolved to exact dates at runtime:
- `yesterday` → 1 day ago
- `3 days ago` → 3 days ago
- `last week` → 7 days ago
- `last monday` → most recent Monday
- `last month` → 30 days ago
- `YYYY-MM-DD` → exact ISO date
- `YYYY-MM-DD to YYYY-MM-DD` → inclusive date range
- `YYYY-MM-DD..YYYY-MM-DD` → rixx-style range (same result)

### 3. Commit Distribution
When multiple dates are provided (a range), commits are spread evenly across those dates with randomized times between `--min-hour` (default 9) and `--max-hour` (default 21) to simulate realistic work patterns.

---

## /backdate — Commit Local Edits to Past Date

### When to Use
- You have made local edits to a project today.
- You want them to appear as committed on a specific past date on GitHub.
- You are NOT rewriting existing commits.

### Execution Flow
1. Run `git status --porcelain` to detect local edits.
2. Ask the user for a target date or range using the `ask_question` tool.
3. Stage all changes: `git add -A`
4. Commit with date override:
   ```bash
   GIT_AUTHOR_DATE=YYYY-MM-DDTHH:MM:SS
   GIT_COMMITTER_DATE=YYYY-MM-DDTHH:MM:SS
   git commit -m "chore: update activity log"
   ```
5. If the repo is clean, mock commits are generated via `activity_log.txt`.
6. Invoke helper script:
   ```bash
   python3 .opencode/scripts/backdate_helper.py --dates "<date-or-range>"
   ```

---

## /redate — Rewrite Existing Commit Timestamps

### When to Use
- You already made commits today (or any past date).
- You want to move them to a different past date on the contribution graph.
- You accept that a `git push --force` will be required.

### Execution Flow
1. Run `git log --oneline -10` to show recent commits.
2. Ask the user which commits to redate (HEAD, range, ROOT).
3. Ask the user for the target date or range.
4. The script uses cherry-pick + amend on a temp branch to rewrite timestamps:
   ```bash
   GIT_AUTHOR_DATE=YYYY-MM-DDTHH:MM:SS
   GIT_COMMITTER_DATE=YYYY-MM-DDTHH:MM:SS
   git commit --amend --no-edit --date YYYY-MM-DDTHH:MM:SS
   ```
5. Invoke helper script:
   ```bash
   python3 .opencode/scripts/redate_helper.py --commits "HEAD~3..HEAD" --dates "last week to yesterday"
   ```
6. Inform user to force-push:
   ```bash
   git push origin main --force
   ```

### Warning
Rewriting history rewrites all subsequent commit hashes. On shared repositories, this will disrupt collaborators who have pulled those commits.
