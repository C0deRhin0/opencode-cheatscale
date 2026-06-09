#!/usr/bin/env python3
"""Git History Redate Helper.

Rewrites the author and committer timestamps of commits that already exist
in git history — without creating any new commits.

Supports:
  - Single commit:   HEAD, abc123
  - Range:           HEAD~3..HEAD, abc123..HEAD
  - Special alias:   ROOT (all commits from the beginning)

The commits in the range are spread evenly across the specified date or 
date range.
"""
import os
import re
import sys
import argparse
import random
import subprocess
from datetime import datetime, timedelta, date


# ---------------------------------------------------------------------------
# Date parsing (same portable parser as backdate_helper.py)
# ---------------------------------------------------------------------------

_WEEKDAY_NAMES = {
    "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
    "friday": 4, "saturday": 5, "sunday": 6,
}

def _parse_single_date(s: str) -> date:
    """Parse a single dateish string into a date object."""
    s = s.strip().lower()
    today = date.today()

    if s == "today":
        return today
    if s == "yesterday":
        return today - timedelta(days=1)
    if s == "last week":
        return today - timedelta(weeks=1)
    if s == "last month":
        return today - timedelta(days=30)

    m = re.match(r"last\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)", s)
    if m:
        target_wd = _WEEKDAY_NAMES[m.group(1)]
        days_back = (today.weekday() - target_wd) % 7
        return today - timedelta(days=days_back if days_back > 0 else 7)

    m = re.match(r"(\d+)\s+days?\s+ago", s)
    if m:
        return today - timedelta(days=int(m.group(1)))

    m = re.match(r"(\d+)\s+weeks?\s+ago", s)
    if m:
        return today - timedelta(weeks=int(m.group(1)))

    m = re.match(r"(\d+)\s+months?\s+ago", s)
    if m:
        return today - timedelta(days=30 * int(m.group(1)))

    try:
        return datetime.strptime(s, "%Y-%m-%d").date()
    except ValueError:
        pass

    raise ValueError(
        f"Cannot parse date: '{s}'. "
        "Use YYYY-MM-DD, 'yesterday', 'N days ago', 'last week', 'last monday', etc."
    )


def parse_date_range(date_str: str) -> list[date]:
    """Parse date_str into an ordered list of dates.

    Supports single date or range with '..' or 'to'.
    Returns list of date objects (oldest to newest).
    """
    date_str = date_str.strip()

    if ".." in date_str and " to " not in date_str:
        parts = date_str.split("..", 1)
        start = _parse_single_date(parts[0])
        end = _parse_single_date(parts[1])
    elif " to " in date_str:
        parts = date_str.split(" to ", 1)
        start = _parse_single_date(parts[0])
        end = _parse_single_date(parts[1])
    else:
        d = _parse_single_date(date_str)
        return [d]

    if start > end:
        start, end = end, start

    result = []
    current = start
    while current <= end:
        result.append(current)
        current += timedelta(days=1)
    return result


# ---------------------------------------------------------------------------
# Git utilities
# ---------------------------------------------------------------------------

def run_git(args: list, env: dict = None, check_output: bool = False):
    """Run a git command. Returns (success, stdout, stderr)."""
    res = subprocess.run(["git"] + args, capture_output=True, text=True, env=env)
    return res.returncode == 0, res.stdout.strip(), res.stderr.strip()


def get_commits_in_range(commitish: str) -> list[str]:
    """Return a list of commit hashes in the given range (oldest first).

    Accepts: HEAD, abc123, HEAD~3..HEAD, abc123..HEAD, ROOT
    """
    if commitish == "ROOT":
        commitish = "HEAD"
        res = subprocess.run(
            ["git", "rev-list", commitish],
            capture_output=True, text=True
        )
    elif commitish.endswith(".."):
        commitish = f"{commitish}HEAD"
        res = subprocess.run(
            ["git", "rev-list", commitish],
            capture_output=True, text=True
        )
    elif ".." not in commitish:
        # Single commitish: HEAD or sha — treat as HEAD^..HEAD or sha^..HEAD
        if commitish in ("HEAD", "@"):
            commitish = f"{commitish}^..HEAD"
        else:
            commitish = f"{commitish}^..HEAD"
        res = subprocess.run(
            ["git", "rev-list", commitish],
            capture_output=True, text=True
        )
    else:
        res = subprocess.run(
            ["git", "rev-list", commitish],
            capture_output=True, text=True
        )

    if res.returncode != 0:
        print(f"[!] Could not resolve commits for '{commitish}'.")
        print(f"    {res.stderr.strip()}")
        sys.exit(1)

    commits = res.stdout.strip().splitlines()
    # git rev-list returns newest first — reverse for chronological order
    return commits[::-1]


def random_time(target_date: date, min_hour: int, max_hour: int) -> str:
    """Return a random ISO 8601 timestamp on the given date."""
    h = random.randint(min_hour, max_hour)
    m = random.randint(0, 59)
    s = random.randint(0, 59)
    return f"{target_date.strftime('%Y-%m-%d')}T{h:02d}:{m:02d}:{s:02d}"


def rewrite_commit_date(commit_hash: str, timestamp: str) -> bool:
    """Amend a single commit's author/committer date using git filter-branch style.

    Uses a temporary branch + cherry-pick + amend approach to avoid
    requiring git-filter-repo.
    """
    git_env = os.environ.copy()
    git_env["GIT_AUTHOR_DATE"] = timestamp
    git_env["GIT_COMMITTER_DATE"] = timestamp

    # Amend the commit in place (only works when it's the current HEAD)
    success, _, stderr = run_git(
        ["commit", "--amend", "--no-edit", "--date", timestamp],
        env=git_env
    )
    if not success:
        print(f"[!] Failed to amend commit {commit_hash[:8]}: {stderr}")
        return False
    return True


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description=(
            "Git History Redate — rewrite timestamps of commits already in history. "
            "Does NOT create new commits."
        )
    )
    parser.add_argument(
        "--commits", required=True,
        help=(
            "Commit or range to redate. Examples: HEAD, abc123, HEAD~3..HEAD, "
            "abc1..HEAD, ROOT (all commits)."
        )
    )
    parser.add_argument(
        "--dates", required=True,
        help=(
            "Target date or range. Accepts: YYYY-MM-DD, 'yesterday', 'N days ago', "
            "'last week', 'last monday', ranges with 'to' or '..'."
        )
    )
    parser.add_argument("--min-hour", type=int, default=9, help="Earliest hour (default: 9)")
    parser.add_argument("--max-hour", type=int, default=21, help="Latest hour (default: 21)")
    parser.add_argument(
        "--force-push", action="store_true",
        help="Print force-push command instead of regular push (use when rewriting shared history)"
    )
    args = parser.parse_args()

    # Verify inside git repo
    success, _, _ = run_git(["rev-parse", "--is-inside-work-tree"])
    if not success:
        print("[!] Error: Not inside a git repository.")
        sys.exit(1)

    # Get commits to redate
    print(f"[*] Resolving commits: {args.commits}")
    commits = get_commits_in_range(args.commits)
    if not commits:
        print("[!] No commits found in the specified range.")
        sys.exit(1)
    print(f"[*] Found {len(commits)} commit(s) to redate.")

    # Parse target dates
    try:
        target_dates = parse_date_range(args.dates)
    except ValueError as e:
        print(f"[!] {e}")
        sys.exit(1)

    print(f"[*] Spreading commits across {len(target_dates)} date(s): "
          f"{target_dates[0]} to {target_dates[-1]}")

    # Distribute commits evenly across the date range
    # Each date gets at least one commit if possible
    date_assignments = []
    if len(target_dates) >= len(commits):
        # More dates than commits: one commit per date (pick evenly spaced dates)
        step = len(target_dates) / len(commits)
        for i, commit in enumerate(commits):
            date_idx = min(int(i * step), len(target_dates) - 1)
            date_assignments.append((commit, target_dates[date_idx]))
    else:
        # More commits than dates: distribute round-robin
        for i, commit in enumerate(commits):
            date_assignments.append((commit, target_dates[i % len(target_dates)]))

    # Use interactive rebase approach: rebase each commit onto the previous
    # by building a sequence of amends on a detached rebase
    print("[*] Redating commits via interactive rebase...")

    # Get the base (parent of oldest commit)
    oldest_commit = commits[0]
    success, parent_hash, _ = run_git(["rev-parse", f"{oldest_commit}^"])
    has_parent = success and parent_hash

    # Start an interactive rebase targeting the oldest commit's parent
    # We do this by replaying commits manually using cherry-pick + amend
    # on a temp branch based on the parent
    temp_branch = f"redate-temp-{random.randint(10000, 99999)}"
    current_branch_success, current_branch, _ = run_git(
        ["rev-parse", "--abbrev-ref", "HEAD"]
    )
    if not current_branch_success or current_branch == "HEAD":
        print("[!] Cannot redate: repository is in detached HEAD state.")
        sys.exit(1)

    print(f"[*] Current branch: {current_branch}")

    # Checkout to parent commit (or --orphan if no parent)
    if has_parent:
        run_git(["checkout", parent_hash, "-b", temp_branch])
    else:
        run_git(["checkout", "--orphan", temp_branch])
        run_git(["rm", "-rf", "."])  # clean orphan branch

    redate_count = 0
    for commit_hash, target_date in date_assignments:
        timestamp = random_time(target_date, args.min_hour, args.max_hour)
        git_env = os.environ.copy()
        git_env["GIT_AUTHOR_DATE"] = timestamp
        git_env["GIT_COMMITTER_DATE"] = timestamp

        success, _, stderr = run_git(["cherry-pick", "--allow-empty", commit_hash])
        if not success:
            print(f"[!] Cherry-pick failed for {commit_hash[:8]}: {stderr}")
            # Abort cherry-pick, restore original branch
            run_git(["cherry-pick", "--abort"])
            run_git(["checkout", current_branch])
            run_git(["branch", "-D", temp_branch])
            sys.exit(1)

        # Amend with backdated timestamp
        success, _, stderr = run_git(
            ["commit", "--amend", "--no-edit", "--date", timestamp],
            env=git_env
        )
        if not success:
            print(f"[!] Amend failed for {commit_hash[:8]}: {stderr}")
            run_git(["checkout", current_branch])
            run_git(["branch", "-D", temp_branch])
            sys.exit(1)

        redate_count += 1
        print(f"[+] Redated {commit_hash[:8]} -> {timestamp}")

    # Point original branch to new temp branch tip
    success, new_tip, _ = run_git(["rev-parse", "HEAD"])
    run_git(["checkout", current_branch])
    run_git(["reset", "--hard", new_tip])
    run_git(["branch", "-D", temp_branch])

    print(f"\n[+] Done! Redated {redate_count} commit(s).")

    if args.force_push:
        print("[!] History has been rewritten. Push with force:")
        print(f"    git push origin {current_branch} --force")
    else:
        print("[*] Push to GitHub with:")
        print(f"    git push origin {current_branch} --force")
        print("    (Note: --force is required because history was rewritten)")


if __name__ == "__main__":
    main()
