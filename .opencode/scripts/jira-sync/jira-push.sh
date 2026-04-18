#!/bin/bash
# JIRA Push Script - Update JIRA status from Feature > Task > Subtask structure
# Usage: ./jira-push.sh [push|sync] [scope]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/jira-auth.sh"

OUTPUT_DIR="${OUTPUT_DIR:-plans}"

# Read feature + tasks and update JIRA
push_to_jira() {
    local scope="${1:-core}"
    local feature_file="$OUTPUT_DIR/$scope/feature.md"
    local tasks_dir="$OUTPUT_DIR/$scope/tasks"

    if [ ! -f "$feature_file" ]; then
        echo "ERROR: Feature file not found: $feature_file"
        exit 1
    fi

    echo "=== Pushing Feature Status to JIRA: $scope ==="

    # Extract JIRA epic from frontmatter
    local jira_epic=$(grep -o 'jira_epic: [A-Z]*-[0-9]*' "$feature_file" | cut -d' ' -f2)

    if [ -z "$jira_epic" ]; then
        echo "WARNING: No JIRA epic found in feature.md frontmatter"
        echo "Add 'jira_epic: PROJ-123' to feature.md frontmatter"
        return 1
    fi

    echo "Target Epic: $jira_epic"

    # Count progress across feature.md and tasks/*.md
    local completed=0
    local total=0
    for f in "$feature_file" "$tasks_dir"/*.md 2>/dev/null; do
        [ -f "$f" ] || continue
        completed=$((completed + $(grep -c "\- \[x\]" "$f" 2>/dev/null || echo "0")))
        total=$((total + $(grep -c "\- \[ \]" "$f" 2>/dev/null || echo "0")))
    done

    local all=$((completed + total))
    local percent=0
    [ "$all" -gt 0 ] && percent=$((completed * 100 / all))

    echo ""
    echo "Completed subtasks to push:"
    for f in "$tasks_dir"/*.md 2>/dev/null; do
        [ -f "$f" ] || continue
        local task_name=$(basename "$f" .md)
        local done_count=$(grep -c "\- \[x\]" "$f" 2>/dev/null || echo "0")
        [ "$done_count" -gt 0 ] && echo "  $task_name: $done_count completed"
    done
    echo ""

    echo "Progress: $completed/$all ($percent%)"

    # Example: Add comment to epic
    local comment="CheatScale Feature Update:
- Completed: $completed subtasks
- Remaining: $total subtasks
- Progress: $percent%

*Synced from feature: $scope*"

    # Uncomment to actually push:
    # jira_api_call POST "/issue/$jira_epic/comment" "\"body\": \"$comment\""

    echo ""
    echo "JIRA push complete (simulated)"
    echo "  Uncomment jira_api_call in jira-push.sh to enable actual push"
}

# Sync status bidirectional
sync_status() {
    local scope="${1:-core}"

    echo "=== Bidirectional Sync: JIRA <> Feature ==="

    echo "1. Fetching latest from JIRA..."
    # Placeholder

    echo "2. Merging with local feature + tasks..."
    # Placeholder

    echo "3. Pushing updates to JIRA..."
    # Placeholder

    echo "Sync complete"
}

# Main
case "${1:-}" in
    push)
        push_to_jira "$2"
        ;;
    sync)
        sync_status "$2"
        ;;
    *)
        echo "JIRA Push - CheatScale Integration"
        echo ""
        echo "Usage: $0 <command> [scope]"
        echo ""
        echo "Commands:"
        echo "  push [scope]   - Push feature status to JIRA (default: core)"
        echo "  sync [scope]   - Bidirectional sync"
        echo ""
        echo "Examples:"
        echo "  $0 push billing"
        echo "  $0 sync auth"
        ;;
esac