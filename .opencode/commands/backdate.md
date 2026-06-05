---
description: Populate empty contribution days in a GitHub profile graph with backdated commits, with optional per-day commit limits
agent: orchestrator
---

# Git Contribution Backdating: $ARGUMENTS

Interactively backdate local changes or generate mock commits to populate past dates in the git contribution graph. Supports user-defined minimum and maximum commits per day so contribution counts stay within a requested range.

---

## Core Protocols

- **Interactive Date Gathering**: If no target date or date range is provided in `$ARGUMENTS`, you MUST immediately call the `question` tool to prompt the user for a specific date (e.g., `2026-05-15`) or a range of dates (e.g., `2026-05-10 to 2026-05-14`).
- **Local Changes Precedence**: Check the repository status with `git status` first. If there are unstaged changes, prioritize staging and committing them. If there are no changes, notify the user and default to generating mock activity commits.
- **Grouped Real Commits**: When local changes exist and the user confirms, group changed files into file-level batches and spread those batches across the planned backdated commit slots. Do not collapse all local changes into one commit unless the user explicitly asks for a single commit.
- **Strict Format Verification**: Ensure the parsed date or range format is supported by the helper before calling it. Supported forms include `YYYY-MM-DD`, `YYYY-MM-DD to YYYY-MM-DD`, `YYYY-MM-DD..YYYY-MM-DD`, `last N days`, `N days ago`, `last week`, `last monday`, and comma-separated date lists.
- **Daily Commit Bounds**: If the user provides a minimum or maximum commits-per-day constraint, preserve it exactly when invoking the helper script. If omitted, use the helper defaults. If the user asks for a healthy contribution graph but gives no counts, recommend a realistic bounded range and ask for confirmation.
- **Safety Limit**: Do not exceed 20 commits for any single target day. If the user requests more than 20 commits/day, decline and suggest a wider date range instead.

**Reference skill**: `skills/git-backdating/SKILL.md` — consult for accepted date formats, git date override mechanics, mock commit behavior, and commit distribution logic.

## GLOBAL OUTPUT RULE: NO EMOJIS
You are STRICTLY FORBIDDEN from using emojis in any generated output. All text must be plain professional text.

---

## Phase 1: Context Scan & Question Flow

1. Check repository status:
   - Run: `git status --porcelain`
2. Determine target dates:
   - If `$ARGUMENTS` is empty:
     - Call the `question` tool to ask the user:
       * **Question:** "Which date or range of dates would you like to backdate your commits to?"
       * **Options:** ["Yesterday", "Last 7 Days (Range)", "Last 30 Days (Range)", "Custom Date/Range"]
     - If the user selects a range option or custom date, prompt them for the specific date or date range input.
       - Full format reference: see `skills/git-backdating/SKILL.md` § Natural Language Date Input
    - If `$ARGUMENTS` is not empty:
      - Parse the input arguments directly as the date/range plus any optional flags.
3. Determine daily commit bounds:
   - Accept any of these equivalent forms in `$ARGUMENTS`:
     - `--min-commits N --max-commits N`
     - `--min-per-day N --max-per-day N`
     - `--commits-per-day MIN..MAX`
   - Validate that `min <= max`, both are positive integers, and `max <= 20`.
   - When the user gives a requirement like "not greater than 20 or lesser than 8", invoke the helper with `--min-per-day 8 --max-per-day 20`.

---

## Phase 2: Execute Helper Script

1. Construct the arguments for the backdate script:
    - Set `--dates` to the target date or date range.
    - Set daily bounds using `--min-per-day [MIN] --max-per-day [MAX]` when requested.
    - If there are staged changes, ask the user to unstage them with `git reset` before grouped mode so each batch can be isolated safely.
    - If there are local unstaged changes, show the user the changed file summary and ask for confirmation before committing real changes. Only pass `--yes` after the user confirms.
    - If there are local unstaged changes, use grouped real-change mode by default so file batches are spread across the date range.
    - If there are local unstaged changes, set `--message` to a meaningful description of the changes (or ask the user for a commit message).
    - If the repository is clean, use the `--mock` flag to record mock activity entries in `activity_log.txt`.
2. Run the helper script:
    - Run: `python3 .opencode/scripts/backdate_helper.py --dates "[DATES]" --min-per-day [MIN] --max-per-day [MAX] [FLAGS]`
3. Display the console output of the helper script execution.

---

## Phase 3: Completion & Next Steps

1. Show the count of backdated commits generated using this output format:
   ```
   ## Backdate Complete

    Commits Created: [n]
    Target Date/Range: [dates applied]
    Daily Commit Bounds: [min]-[max]
    Mode: [real changes | mock activity]
   ```
2. Outline the exact commands the user should run to push the commits to GitHub:
   ```bash
   git push origin main
   ```

---

## Usage

```bash
/backdate                                         # Interactive mode. Use when you want the command to ask for date/range and options.
/backdate "2026-06-01"                            # One target day. Commits local unstaged changes to that date, or creates mock activity if clean.
/backdate "2026-05-10 to 2026-05-14"              # Inclusive date range. Spreads planned commit slots across every date in the range.
/backdate "2026-06-05..2026-06-09"                # Same as "to" range syntax. Useful shorthand for inclusive ranges.
/backdate "last 7 days"                           # Rolling range ending today. Good for quickly filling the most recent blank week.
/backdate "2026-06-05 to 2026-06-09" --min-per-day 8 --max-per-day 20
                                                  # Enforces daily bounds. Each target day gets at least 8 and at most 20 local commits.
/backdate "2026-06-05..2026-06-09" --commits-per-day 8..20
                                                  # Compact form of --min-per-day 8 --max-per-day 20.
/backdate "2026-06-05 to 2026-06-09" --commits-per-day 8..20 --yes
                                                  # Confirm real-change mode. Required before grouping and committing local unstaged files.
```

**Notes**:
- If the repository is clean (no uncommitted changes), mock activity commits are created automatically.
- If local changes exist, keep them unstaged. If files are staged, run `git reset` first so grouped batching can isolate each commit.
- Use `--yes` only after reviewing `git status --porcelain`; it permits the helper to stage and commit grouped local file batches.
- The helper creates local commits only. Push manually after reviewing the result with `git log`.
