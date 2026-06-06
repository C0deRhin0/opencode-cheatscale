#!/usr/bin/env python3
"""Git Contribution Backdating Helper.

Commits local changes (or mock changes) to a past date, populating
the GitHub contribution graph without rewriting existing history.

Supports natural language dates: 'yesterday', '3 days ago', 'last week', 
'last monday', as well as ISO 8601 dates and ranges.
"""
import os
import re
import sys
import argparse
import random
import subprocess
from datetime import datetime, timedelta, date


# ---------------------------------------------------------------------------
# Date parsing — supports ISO dates, natural language, and ranges
# ---------------------------------------------------------------------------

_WEEKDAY_NAMES = {
    "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
    "friday": 4, "saturday": 5, "sunday": 6,
}

def _parse_single_date(s: str) -> date:
    """Parse a single dateish string into a date object.

    Supported formats:
      - YYYY-MM-DD             (ISO 8601)
      - yesterday
      - today
      - N day(s) ago
      - N week(s) ago
      - N month(s) ago  (approx: 30 days each)
      - last <weekday>
      - last week              (7 days ago)
      - last month             (30 days ago)
    """
    s = s.strip().lower()
    today = date.today()

    if s in ("today",):
        return today

    if s in ("yesterday",):
        return today - timedelta(days=1)

    if s in ("last week",):
        return today - timedelta(weeks=1)

    if s in ("last month",):
        return today - timedelta(days=30)

    # "last <weekday>"
    m = re.match(r"last\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)", s)
    if m:
        target_wd = _WEEKDAY_NAMES[m.group(1)]
        days_back = (today.weekday() - target_wd) % 7
        days_back = days_back if days_back > 0 else 7
        return today - timedelta(days=days_back)

    # "N day(s) ago"
    m = re.match(r"(\d+)\s+days?\s+ago", s)
    if m:
        return today - timedelta(days=int(m.group(1)))

    # "N week(s) ago"
    m = re.match(r"(\d+)\s+weeks?\s+ago", s)
    if m:
        return today - timedelta(weeks=int(m.group(1)))

    # "N month(s) ago" (approx)
    m = re.match(r"(\d+)\s+months?\s+ago", s)
    if m:
        return today - timedelta(days=30 * int(m.group(1)))

    # ISO 8601: YYYY-MM-DD
    try:
        return datetime.strptime(s, "%Y-%m-%d").date()
    except ValueError:
        pass

    raise ValueError(
        f"Cannot parse date: '{s}'. "
        "Use YYYY-MM-DD, 'yesterday', 'N days ago', 'last week', 'last monday', etc."
    )


def parse_dates(date_str: str) -> list[str]:
    """Parse the --dates argument into a sorted list of YYYY-MM-DD strings.

    Supports:
      - Single date:             "2026-05-15" or "yesterday" or "3 days ago"
      - Range with 'to':         "2026-05-10 to 2026-05-14" or "last week to yesterday"
      - Range with '..':         "2026-05-10..2026-05-14"
      - Comma-separated list:    "2026-05-01, 2026-05-03, yesterday"
    """
    date_str = date_str.strip()
    dates: list[date] = []

    rolling = re.fullmatch(r"last\s+(\d+)\s+days", date_str.lower())
    if rolling:
        days = int(rolling.group(1))
        if days < 1:
            print("[!] Rolling date ranges must include at least one day.")
            sys.exit(1)
        end = date.today()
        start = end - timedelta(days=days - 1)
        current = start
        while current <= end:
            dates.append(current)
            current += timedelta(days=1)

    # Range with ".." (rixx-style)
    elif ".." in date_str and " to " not in date_str:
        parts = date_str.split("..", 1)
        try:
            start = _parse_single_date(parts[0])
            end = _parse_single_date(parts[1])
        except ValueError as e:
            print(f"[!] {e}")
            sys.exit(1)
        current = start
        while current <= end:
            dates.append(current)
            current += timedelta(days=1)

    # Range with " to "
    elif " to " in date_str:
        parts = date_str.split(" to ", 1)
        try:
            start = _parse_single_date(parts[0])
            end = _parse_single_date(parts[1])
        except ValueError as e:
            print(f"[!] {e}")
            sys.exit(1)
        current = start
        while current <= end:
            dates.append(current)
            current += timedelta(days=1)

    # Comma-separated list or single date
    else:
        for part in date_str.split(","):
            try:
                dates.append(_parse_single_date(part))
            except ValueError as e:
                print(f"[!] {e}")
                sys.exit(1)

    # Deduplicate, sort, filter future dates
    today = date.today()
    result = sorted(set(d.strftime("%Y-%m-%d") for d in dates if d <= today))

    if not result:
        print("[!] All specified dates are in the future. Nothing to backdate.")
        sys.exit(1)

    skipped = [d for d in dates if d > today]
    if skipped:
        print(f"[!] Warning: Skipped {len(skipped)} future date(s).")

    return result


# ---------------------------------------------------------------------------
# Git utilities
# ---------------------------------------------------------------------------

def run_git(args: list, env: dict = None):
    """Execute a git command. Returns (success, stdout, stderr)."""
    res = subprocess.run(["git"] + args, capture_output=True, text=True, env=env)
    return res.returncode == 0, res.stdout.strip(), res.stderr.strip()


def has_unstaged_changes() -> bool:
    """Return True if there are any staged, unstaged, or untracked changes."""
    success, stdout, _ = run_git(["status", "--porcelain"])
    return success and len(stdout.strip()) > 0


def has_staged_changes() -> bool:
    """Return True if the index already has staged changes."""
    success, stdout, _ = run_git(["diff", "--cached", "--name-only"])
    return success and bool(stdout.strip())


def get_status_summary() -> str:
    """Return porcelain status output for user review."""
    success, stdout, stderr = run_git(["status", "--porcelain"])
    if not success:
        return stderr
    return stdout


def count_existing_commits_on_date(date_str: str) -> int:
    """Count existing local commits authored on a target date."""
    success, stdout, _ = run_git([
        "log",
        "--all",
        "--since", f"{date_str}T00:00:00",
        "--until", f"{date_str}T23:59:59",
        "--format=%H",
    ])
    if not success or not stdout:
        return 0
    return len(stdout.splitlines())


def get_changed_paths() -> list[str]:
    """Return tracked and untracked changed paths for file-level batching."""
    paths: set[str] = set()
    commands = [
        ["diff", "--name-only"],
        ["diff", "--cached", "--name-only"],
        ["ls-files", "--others", "--exclude-standard"],
    ]
    for command in commands:
        success, stdout, stderr = run_git(command)
        if not success:
            print(f"[!] Failed to inspect changed files: {stderr}")
            sys.exit(1)
        for path in stdout.splitlines():
            if path.strip():
                paths.add(path.strip())
    return sorted(paths)


def split_paths_into_batches(paths: list[str], target_batches: int) -> list[list[str]]:
    """Split paths into near-even batches without exceeding target batch count."""
    if target_batches <= 0 or not paths:
        return []

    batch_count = min(target_batches, len(paths))
    base_size, extra = divmod(len(paths), batch_count)
    batches: list[list[str]] = []
    start = 0

    for index in range(batch_count):
        size = base_size + (1 if index < extra else 0)
        end = start + size
        batches.append(paths[start:end])
        start = end

    return batches


def build_commit_message(base_message: str, index: int, total: int) -> str:
    """Create a non-identical commit message for grouped local changes."""
    if total <= 1:
        return base_message
    return f"{base_message} batch {index}"


def build_even_batch_slot_map(slot_count: int, batches: list[list[str]]) -> dict[int, list[str]]:
    """Map real batches onto evenly spaced slots across the full date range."""
    if not batches:
        return {}

    if len(batches) == 1:
        return {0: batches[0]}

    last_slot = slot_count - 1
    slot_map: dict[int, list[str]] = {}
    used_indexes: set[int] = set()

    for batch_index, batch in enumerate(batches):
        preferred = round(batch_index * last_slot / (len(batches) - 1))
        slot_index = preferred
        while slot_index in used_indexes and slot_index < slot_count:
            slot_index += 1
        if slot_index >= slot_count:
            slot_index = preferred
            while slot_index in used_indexes and slot_index >= 0:
                slot_index -= 1
        if slot_index < 0:
            print("[!] Unable to distribute real commit batches across slots.")
            sys.exit(1)
        used_indexes.add(slot_index)
        slot_map[slot_index] = batch

    return slot_map


def parse_commit_bounds(
    min_commits: int | None,
    max_commits: int | None,
    commits_per_day: str | None,
) -> tuple[int, int]:
    """Resolve and validate daily commit bounds.

    Supports explicit min/max flags and compact MIN..MAX syntax. The helper
    intentionally caps normal usage at 20 commits/day because higher counts can
    make contribution graphs look unnatural.
    """
    resolved_min = min_commits if min_commits is not None else 2
    resolved_max = max_commits if max_commits is not None else 3

    if commits_per_day:
        match = re.fullmatch(r"\s*(\d+)\s*(?:\.\.|-|:)\s*(\d+)\s*", commits_per_day)
        if not match:
            print("[!] Invalid --commits-per-day value. Use MIN..MAX, for example: 8..20")
            sys.exit(1)
        resolved_min = int(match.group(1))
        resolved_max = int(match.group(2))

    if resolved_min < 1 or resolved_max < 1:
        print("[!] Commit bounds must be positive integers.")
        sys.exit(1)

    if resolved_min > resolved_max:
        print("[!] Minimum commits per day cannot be greater than maximum commits per day.")
        sys.exit(1)

    if resolved_max > 20:
        print("[!] Maximum commits per day cannot exceed 20 for normal backdating runs.")
        print("    Use multiple date ranges or lower --max-per-day to keep activity realistic.")
        sys.exit(1)

    return resolved_min, resolved_max


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Git Contribution Backdating Helper — commit local edits to a past date."
    )
    parser.add_argument(
        "--dates", required=True,
        help=(
            "Target date(s). Accepts: YYYY-MM-DD, 'yesterday', 'N days ago', "
            "'last week', 'last monday', ranges with 'to' or '..', and comma-separated lists."
        )
    )
    parser.add_argument(
        "--message", default="chore: update activity log",
        help="Commit message for local changes (default: 'chore: update activity log')"
    )
    parser.add_argument(
        "--mock", action="store_true",
        help="Force mock commits even if local changes are present"
    )
    parser.add_argument(
        "--min-commits", "--min-per-day",
        dest="min_commits",
        type=int,
        default=None,
        help="Min commits per day (default: 2)"
    )
    parser.add_argument(
        "--max-commits", "--max-per-day",
        dest="max_commits",
        type=int,
        default=None,
        help="Max commits per day (default: 3, hard capped at 20)"
    )
    parser.add_argument(
        "--commits-per-day",
        help="Daily commit range in MIN..MAX form, for example: 8..20"
    )
    parser.add_argument("--min-hour", type=int, default=9, help="Earliest hour for commits (default: 9)")
    parser.add_argument("--max-hour", type=int, default=21, help="Latest hour for commits (default: 21)")
    parser.add_argument("--git-name", help="Set git user.name locally for this repo")
    parser.add_argument("--git-email", help="Set git user.email locally for this repo")
    parser.add_argument(
        "--yes",
        action="store_true",
        help="Confirm staging and committing all current local changes in real-change mode"
    )
    args = parser.parse_args()
    min_commits, max_commits = parse_commit_bounds(
        args.min_commits,
        args.max_commits,
        args.commits_per_day,
    )

    # Verify we are inside a git repo
    success, _, _ = run_git(["rev-parse", "--is-inside-work-tree"])
    if not success:
        print("[!] Error: Current directory is not a git repository.")
        sys.exit(1)

    # Set local git identity if supplied
    if args.git_name:
        run_git(["config", "user.name", args.git_name])
    if args.git_email:
        run_git(["config", "user.email", args.git_email])

    # Parse dates
    target_dates = parse_dates(args.dates)
    print(f"[*] Target dates ({len(target_dates)}): {', '.join(target_dates)}")
    print(f"[*] Daily commit bounds: {min_commits}-{max_commits}")

    # Detect local changes
    local_changes_exist = has_unstaged_changes()
    use_local_changes = local_changes_exist and not args.mock

    changed_paths: list[str] = []
    if use_local_changes:
        if has_staged_changes():
            print("[!] Refusing grouped mode while files are already staged.")
            print("[*] Unstage files first so batches can be isolated safely:")
            print("    git reset")
            sys.exit(1)
        changed_paths = get_changed_paths()
        print(
            f"[*] Local changes detected ({len(changed_paths)} file path(s)). "
            "They will be grouped across the planned date slots."
        )
        if not args.yes:
            print("[!] Refusing to stage local changes without explicit confirmation.")
            print("[*] Changed files:")
            status_summary = get_status_summary()
            print(status_summary if status_summary else "    (status unavailable)")
            print("[*] Re-run with --yes after reviewing the file list, or use --mock to generate mock commits only.")
            sys.exit(1)
    else:
        print("[*] No local changes (or --mock set). Generating mock activity commits.")

    planned_slots: list[tuple[str, str]] = []
    for date_str in target_dates:
        existing_commits = count_existing_commits_on_date(date_str)
        min_new_commits = max(min_commits - existing_commits, 0)
        max_new_commits = max(max_commits - existing_commits, 0)

        if max_new_commits == 0:
            print(
                f"[*] Skipping {date_str}: existing local commits ({existing_commits}) "
                f"already meet or exceed the max/day limit ({max_commits})."
            )
            continue

        n_commits = random.randint(min_new_commits, max_new_commits)
        print(
            f"[*] {date_str}: existing local commits={existing_commits}, "
            f"new commits planned={n_commits}, final local total={existing_commits + n_commits}"
        )

        # Random timestamps spread through the workday
        times = sorted([
            (
                random.randint(args.min_hour, args.max_hour),
                random.randint(0, 59),
                random.randint(0, 59),
            )
            for _ in range(n_commits)
        ])

        for hour, minute, second in times:
            timestamp = f"{date_str}T{hour:02d}:{minute:02d}:{second:02d}"
            planned_slots.append((date_str, timestamp))

    if not planned_slots:
        print("[!] No commit slots available for the requested date range and bounds.")
        sys.exit(1)

    real_batches = split_paths_into_batches(changed_paths, len(planned_slots)) if use_local_changes else []
    real_batch_by_slot = build_even_batch_slot_map(len(planned_slots), real_batches)
    if real_batches:
        print(
            f"[*] Grouped {len(changed_paths)} changed path(s) into "
            f"{len(real_batches)} real commit batch(es)."
        )

    commit_count = 0
    real_commit_count = 0
    total_real_batches = len(real_batches)

    for slot_index, (_, timestamp) in enumerate(planned_slots):
        commit_count += 1

        git_env = os.environ.copy()
        git_env["GIT_AUTHOR_DATE"] = timestamp
        git_env["GIT_COMMITTER_DATE"] = timestamp

        if slot_index in real_batch_by_slot:
            batch = real_batch_by_slot[slot_index]
            real_commit_count += 1
            print(
                f"[*] Committing real batch {real_commit_count} "
                f"({len(batch)} path(s)) -> {timestamp} ..."
            )
            success, _, stderr = run_git(["add", "--", *batch])
            if not success:
                print(f"[!] Staging failed: {stderr}")
                sys.exit(1)
            success, _, stderr = run_git(
                [
                    "commit",
                    "-m",
                    build_commit_message(args.message, real_commit_count, total_real_batches),
                ],
                env=git_env,
            )
            if not success:
                print(f"[!] Commit failed: {stderr}")
                sys.exit(1)
        else:
            # Generate a mock activity entry when there are more slots than real batches.
            with open("activity_log.txt", "a") as f:
                f.write(f"[{timestamp}] Activity entry #{commit_count}\n")
            success, _, stderr = run_git(["add", "activity_log.txt"])
            if not success:
                print(f"[!] Staging mock activity failed: {stderr}")
                sys.exit(1)
            success, _, stderr = run_git(
                ["commit", "-m", f"chore: record activity sequence #{commit_count}"],
                env=git_env,
            )
            if not success:
                print(f"[!] Mock commit failed: {stderr}")
                sys.exit(1)

    print(f"\n[+] Done! Created {commit_count} backdated commits across {len(target_dates)} day(s).")
    print("[*] Push to GitHub with:")
    print("    git push origin main")


if __name__ == "__main__":
    main()
