#!/bin/bash
# CheatScale Common Functions - Dual Format Parser
# Supports both old (PnDm) and new (task-id) formats

# =============================================================================
# Parse Task ID - Supports Both Formats
# =============================================================================
# OLD FORMAT: P1D1, P2D3, Phase1Day1
# NEW FORMAT: login-flow, user-auth, task-name
#
# Usage: parse_task_id "auth P1D1" or "auth login-flow"
# Output: SCOPE="auth" TASK_ID="P1D1" FORMAT="OLD"
# =============================================================================

parse_task_id() {
    local input="$1"

    # No input
    if [ -z "$input" ]; then
        echo "ERROR: No task input provided"
        return 1
    fi

    # Extract scope and task from space-separated input
    local scope task_id

    if [[ "$input" =~ ^([a-zA-Z0-9-]+)\ +(.+)$ ]]; then
        scope="${BASH_REMATCH[1]}"
        task_id="${BASH_REMATCH[2]}"
    else
        # No scope prefix, use default
        scope=""
        task_id="$input"
    fi

    # Detect format
    local format="NEW"

    # OLD FORMAT: P1D1, P2D3, P10D5 (Phase Day pattern)
    if [[ "$task_id" =~ ^P[0-9]+D[0-9]+$ ]]; then
        format="OLD"
        # P1D1 -> Extract phase and day
        local phase="${task_id#P}"
        phase="${phase%D*}"
        local day="${task_id#*D}"

        echo "scope=$scope"
        echo "task_id=$task_id"
        echo "phase=$phase"
        echo "day=$day"
        echo "format=$format"
        return 0
    fi

    # NEW FORMAT: login-flow, user-auth, task-name
    if [[ "$task_id" =~ ^[a-z][a-z0-9-]+$ ]]; then
        format="NEW"

        echo "scope=$scope"
        echo "task_id=$task_id"
        echo "phase="
        echo "day="
        echo "format=$format"
        return 0
    fi

    # Unknown format
    echo "ERROR: Unknown task format: $task_id"
    echo "Supported: P1D1 (OLD) or login-flow (NEW)"
    return 1
}

# =============================================================================
# Parse Commit Tag - Supports Both Formats
# =============================================================================
# OLD: [scope:P1D1]
# NEW: [scope#task-id]
#
# Usage: parse_commit_tag "auth#login-flow"
# Output: SCOPE=auth TASK=login-flow FORMAT=NEW
# =============================================================================

parse_commit_tag() {
    local input="$1"

    if [ -z "$input" ]; then
        echo "ERROR: No commit tag provided"
        return 1
    fi

    local scope task format

    if [[ "$input" =~ ^(.+)#(.+)$ ]]; then
        scope="${BASH_REMATCH[1]}"
        task="${BASH_REMATCH[2]}"
        format="NEW"
    elif [[ "$input" =~ ^(.+):P[0-9]+D[0-9]+$ ]]; then
        scope="${BASH_REMATCH[1]}"
        task="${input#${scope}:}"
        format="OLD"
    else
        # Default: treat entire input as task
        scope=""
        task="$input"
        format="NEW"
    fi

    echo "scope=$scope"
    echo "task=$task"
    echo "format=$format"
}

# =============================================================================
# Get Roadmap Path - Supports Both Formats
# =============================================================================
# OLD: plans/auth/P1D1.md
# NEW: plans/auth/tasks/login-flow.md
# =============================================================================

get_roadmap_path() {
    local scope="$1"
    local task_id="$2"
    local base_dir="${BASE_DIR:-plans}"

    # Detect format
    if [[ "$task_id" =~ ^P[0-9]+D[0-9]+$ ]]; then
        # OLD FORMAT: P1D1 -> plans/auth/days/P1D1.md
        echo "$base_dir/$scope/days/$task_id.md"
    else
        # NEW FORMAT: login-flow -> plans/auth/tasks/login-flow.md
        mkdir -p "$base_dir/$scope/tasks"
        echo "$base_dir/$scope/tasks/$task_id.md"
    fi
}

# =============================================================================
# Get Feature Path
# =============================================================================

get_feature_path() {
    local scope="$1"
    local base_dir="${BASE_DIR:-plans}"

    echo "$base_dir/$scope/feature.md"
}

# =============================================================================
# Check Task Status
# =============================================================================

get_task_status() {
    local task_file="$1"

    if [ ! -f "$task_file" ]; then
        echo "not_found"
        return 1
    fi

    # Count completed vs total subtasks
    local total=$(grep -c "^\- \[ \]" "$task_file" 2>/dev/null || echo "0")
    local done=$(grep -c "^\- \[x\]" "$task_file" 2>/dev/null || echo "0")
    local pending=$(grep -c "^\- \[ \]" "$task_file" 2>/dev/null || echo "0")

    if [ "$total" -eq 0 ]; then
        echo "empty"
    elif [ "$done" -eq "$total" ]; then
        echo "done"
    elif [ "$done" -gt 0 ]; then
        echo "in_progress"
    else
        echo "todo"
    fi
}

# =============================================================================
# Get Progress Summary
# =============================================================================

get_progress() {
    local feature_dir="$1"
    local scope="$(basename "$feature_dir")"

    local total_tasks=0
    local done_tasks=0
    local total_subtasks=0
    local done_subtasks=0

    # Count from task files
    if [ -d "$feature_dir/tasks" ]; then
        for task_file in "$feature_dir/tasks"/*.md; do
            [ -f "$task_file" ] || continue
            ((total_tasks++))

            local status=$(get_task_status "$task_file")
            if [ "$status" == "done" ]; then
                ((done_tasks++))
            fi

            local todo=$(grep -c "^\- \[ \]" "$task_file" 2>/dev/null || echo "0")
            local done=$(grep -c "^\- \[x\]" "$task_file" 2>/dev/null || echo "0")

            total_subtasks=$((total_subtasks + todo + done))
            done_subtasks=$((done_subtasks + done))
        done
    fi

    echo "scope=$scope"
    echo "tasks=$total_tasks/$done_tasks"
    echo "subtasks=$done_subtasks/$total_subtasks"

    if [ "$total_subtasks" -eq 0 ]; then
        echo "percent=0"
    else
        echo "percent=$((done_subtasks * 100 / total_subtasks))"
    fi
}

# Export functions
export -f parse_task_id
export -f parse_commit_tag
export -f get_roadmap_path
export -f get_feature_path
export -f get_task_status
export -f get_progress