---
description: Rewrite the timestamps of commits that already exist in git history, spreading them across a target date or date range
agent: orchestrator
---

# Git History Redate: $ARGUMENTS

Interactively rewrite the author and committer timestamps of commits already in the current repository's git history. No new commits are created.

---

## Core Protocols

- **Interactive Inputs**: If `$ARGUMENTS` is empty or incomplete, use the `question` tool to gather the two required parameters: (1) which commits to redate, and (2) which date or range to spread them across.
- **Rewrite Warning**: This command rewrites git history. Always inform the user that a `--force` push will be required after redating.
- **No Source Code Modification**: You MUST NOT touch any application source files. This is a git-management-only command.

**Reference skill**: `skills/git-backdating/SKILL.md` — consult for accepted date formats, git date override mechanics, and commit distribution behavior.

## GLOBAL OUTPUT RULE: NO EMOJIS
You are STRICTLY FORBIDDEN from using emojis in any generated output. All text must be plain professional text.

---

## Phase 1: Gather Inputs

1. Run `git log --oneline -10` to show the user recent commits.
2. Use the `question` tool to prompt the user for:

   **Question 1 — Which commits to redate?**
   - Options: ["Last commit (HEAD)", "Last 3 commits (HEAD~3..HEAD)", "Last 7 commits (HEAD~7..HEAD)", "All commits (ROOT)", "Custom range"]
   - If "Custom range": ask the user to type the range (e.g., `abc123..HEAD`).

   **Question 2 — Which date or date range to spread them to?**
   - Options: ["Yesterday", "Last 7 Days (yesterday..7 days ago)", "Last 30 Days", "Custom Date/Range"]
   - If "Custom": ask the user to type the date or range.
     - Accepted formats: `YYYY-MM-DD`, `yesterday`, `N days ago`, `last monday`, `YYYY-MM-DD to YYYY-MM-DD`, `YYYY-MM-DD..YYYY-MM-DD`
     - Full format reference: see `skills/git-backdating/SKILL.md` § Natural Language Date Input

---

## Phase 2: Execute Redate Script

1. Construct arguments:
   - `--commits` from the user's answer to Question 1.
   - `--dates` from the user's answer to Question 2.
2. Run the helper script from the repository root:
   ```bash
   python3 .opencode/scripts/redate_helper.py --commits "[COMMITS]" --dates "[DATES]"
   ```
3. Display the full console output.

---

## Phase 3: Completion

1. Confirm how many commits were redated using this output format:
   ```
   ## Redate Complete

   Commits Redated: [n]
   Target Date/Range: [dates applied]
   History Rewritten: yes

   Next step — force-push required:
   git push origin main --force
   ```
2. Clearly inform the user that because history was rewritten, a force-push is required:
   ```bash
   git push origin main --force
   ```
3. Warn: If this is a shared/public repository, a force-push will affect collaborators.

---

## Usage

```bash
/redate                                          # Interactive — prompts for commit range and target dates
/redate "HEAD~3..HEAD" "yesterday"               # Redate last 3 commits to yesterday
/redate "all" "2026-05-01 to 2026-05-31"         # Spread all commits evenly across May
/redate "abc123..HEAD" "2026-06-01"              # Redate a custom range to a specific date
```

**Note**: This command rewrites git history. A `--force` push will always be required after redating.
