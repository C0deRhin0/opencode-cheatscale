#!/bin/bash
# JIRA Pull Script - Extract epics/tasks to Feature > Task > Subtask format
# Usage: ./jira-pull.sh [ping|list|pull] [epic-key]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/jira-auth.sh"

OUTPUT_DIR="${OUTPUT_DIR:-plans}"

# Default JQL if no epic provided
DEFAULT_JQL='project = "'"${JIRA_PROJECT_KEY}"'" AND type = Epic ORDER BY created DESC'

# Pull epic and its children into Feature > Task > Subtask structure
pull_epic() {
    local epic_key="$1"
    local epic_key="${epic_key:-$DEFAULT_EPIC_KEY}"

    if [ -z "$epic_key" ]; then
        echo "Usage: $0 pull <epic-key>"
        echo "Example: $0 pull PROJ-123"
        echo ""
        echo "Or set DEFAULT_EPIC_KEY in jira-config.env"
        exit 1
    fi

    echo "=== Pulling Epic: $epic_key ==="

    # Get Epic details
    local epic_data=$(jira_api_call GET "/issue/$epic_key?fields=summary,description,status,created,updated")

    # Extract fields
    local epic_summary=$(echo "$epic_data" | grep -o '"summary":"[^"]*"' | head -1 | sed 's/"summary":"//;s/"$//')
    local epic_status=$(echo "$epic_data" | grep -o '"name":"[^"]*"' | head -1 | sed 's/"name":"//;s/"$//')

    echo "Epic: $epic_summary"
    echo "Status: $epic_status"

    # Get child issues (tasks/subtasks)
    local children=$(jira_api_call GET "/search?jql=parent=$epic_key ORDER BY rank asc&maxResults=100")

    # Extract issue keys and summaries
    local task_count=0
    echo "$children" | grep -o '"key":"[^"]*"' | while read -r key; do
        local task_key=$(echo "$key" | cut -d'"' -f4)
        ((task_count++))

        local task_summary=$(echo "$children" | grep -A5 "$task_key" | grep -o '"summary":"[^"]*"' | head -1 | sed 's/"summary":"//;s/"$//')
        local task_type=$(echo "$children" | grep -A10 "$task_key" | grep -o '"issuetype":{"name":"[^"]*"' | sed 's/"issuetype":{"name":"//;s/"$//')

        echo "  - [$task_key] $task_type: $task_summary"
    done

    echo ""
    echo "Total tasks: $task_count"

    # Convert to Feature > Task > Subtask format
    echo ""
    echo "=== Generating Feature Structure ==="

    local scope_name=$(echo "$epic_key" | tr '[:upper:]' '[:lower:]' | cut -d'-' -f2)
    local scope_name="${scope_name:-feature}"

    generate_feature "$epic_key" "$epic_summary" "$epic_status" "$task_count" "$scope_name" "$children"
}

# Generate Feature > Task > Subtask structure
generate_feature() {
    local epic_key="$1"
    local epic_summary="$2"
    local epic_status="$3"
    local task_count="$4"
    local scope_name="$5"
    local children="$6"

    mkdir -p "$OUTPUT_DIR/$scope_name/tasks"

    # Generate scope hub node (Obsidian graph root)
    cat > "$OUTPUT_DIR/$scope_name/$scope_name.md" << EOF
---
tags: [scope, $scope_name]
type: scope
---
# Scope: $scope_name

## Overview
$epic_summary

## Features
- [[feature]]

## Context
- [[coding_convention]]
- [[INSTRUCTIONS]]
EOF
    echo "Scope hub created: $OUTPUT_DIR/$scope_name/$scope_name.md"

    # Generate $SCOPE.md
    cat > "$OUTPUT_DIR/$scope_name/$SCOPE.md" << EOF
---
scope: $scope_name
feature: $scope_name
jira_epic: $epic_key
jira_status: $epic_status
created: $(date +%Y-%m-%d)
tags: [feature, $scope_name]
---
# Feature: $scope_name

## Overview

| Field | Value |
|-------|-------|
| **JIRA Epic** | $epic_key |
| **Status** | $epic_status |
| **Goal** | $epic_summary |
| **Tasks** | $task_count |

## Tasks

$(echo "$children" | grep -o '"key":"[A-Z]*-[0-9]*"' | sed 's/"key":"//;s/"$//' | while read task_key; do
    echo "### Task: $task_key"
    echo "- [Link to tasks/${task_key,,}.md]"
    echo "- Type: task"
    echo "- JIRA Link: $task_key"
    echo ""
done)

## Progress

| Task | Status |
|------|--------|
$(echo "$children" | grep -o '"key":"[A-Z]*-[0-9]*"' | sed 's/"key":"//;s/"$//' | while read task_key; do
    echo "| $task_key | Todo |"
done)

---
*Generated from JIRA Epic: $epic_key via CheatScale*
*Feature > Task > Subtask structure (1:1 JIRA mapping)*
EOF

    echo "Feature created: $OUTPUT_DIR/$scope_name/$SCOPE.md"

    # Generate individual task files with frontmatter
    echo "$children" | grep -o '"key":"[A-Z]*-[0-9]*"' | sed 's/"key":"//;s/"$//' | while read task_key; do
        local task_file="$OUTPUT_DIR/$scope_name/tasks/${task_key,,}.md"
        cat > "$task_file" << EOF
---
tags: [task, $scope_name]
scope: $scope_name
parent: "[[feature]]"
jira_key: $task_key
---
# Task: $task_key

## Description
<!-- Add task description -->

## Subtasks
- [ ] Subtask placeholder 1
- [ ] Subtask placeholder 2

## Notes
<!-- Implementation notes -->
EOF
        echo "  Created: $task_file"
    done
}

# List available epics
list_epics() {
    echo "=== Available Epics in ${JIRA_PROJECT_KEY} ==="

    local epics=$(jira_api_call GET "/search?jql=project+\"${JIRA_PROJECT_KEY}\"+AND+type+Epic+ORDER+BY+created+DESC&maxResults=20")

    echo "$epics" | grep -o '"key":"[^"]*"' | while read -r key; do
        local epic=$(echo "$key" | cut -d'"' -f4)
        local summary=$(echo "$epics" | grep -A3 "$epic" | grep -o '"summary":"[^"]*"' | head -1 | sed 's/"summary":"//;s/"$//')
        local status=$(echo "$epics" | grep -A5 "$epic" | grep -o '"name":"[^"]*"' | head -1 | sed 's/"name":"//;s/"$//')

        echo "  [$epic] $status - $summary"
    done
}

# Main
case "${1:-}" in
    ping)
        jira_ping
        ;;
    list)
        list_epics
        ;;
    pull)
        pull_epic "$2"
        ;;
    *)
        echo "JIRA Pull - CheatScale Integration"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  ping              - Test JIRA connection"
        echo "  list              - List available epics"
        echo "  pull [epic-key]   - Pull epic to Feature > Task > Subtask"
        echo ""
        echo "Examples:"
        echo "  $0 ping"
        echo "  $0 list"
        echo "  $0 pull PROJ-123"
        ;;
esac