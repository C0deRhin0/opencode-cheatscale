#!/bin/bash
# JIRA Sync - Main sync script for roadmap ↔ JIRA
# Usage: ./jira-sync.sh [command] [options]
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/jira-auth.sh"

# Default output directory
OUTPUT_DIR="${OUTPUT_DIR:-/Users/wpperez/Documents/Dev/try/plans}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[OK]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# Helper to build JQL JSON payload
build_jql() {
    local jql="$1"
    local max="${2:-50}"
    local fields="${3:-key,summary,issuetype,status}"
    echo "{\"jql\":\"$jql\",\"maxResults\":$max,\"fields\":[\"$fields\"]}"
}

# Parse issue keys from JIRA response
parse_keys() {
    grep -o '"key":"[A-Z]*-[0-9]*"' | sed 's/"key":"//;s/"$//'
}

# Pull JIRA epic and create roadmap
sync_pull() {
    local epic_key="$1"
    local scope_name="$2"

    if [ -z "$epic_key" ]; then
        log_error "Usage: $0 pull <epic-key> [scope-name]"
        log_error "Example: $0 pull PROJ-123 my-feature"
        exit 1
    fi

    [ -z "$scope_name" ] && scope_name=$(echo "$epic_key" | tr '[:upper:]' '[:lower:]' | cut -d'-' -f2)

    log_info "Pulling JIRA Epic: $epic_key -> $scope_name (Feature > Task > Subtask)"

    mkdir -p "$OUTPUT_DIR/$scope_name/tasks"

    # Get epic details using issue endpoint
    log_info "Fetching Epic details..."
    local epic_data=$(jira_api_call GET "/issue/$epic_key?fields=summary,description,status")

    if echo "$epic_data" | grep -q "errorMessages"; then
        log_error "Failed to fetch Epic: $epic_key"
        echo "$epic_data" | grep -o '"errorMessages":\[[^]]*\]'
        exit 1
    fi

    # Extract fields - GET /issue returns different format
    epic_data=$(echo "$epic_data" | tr '\n' ' ')
    epic_summary=$(echo "$epic_data" | grep -o '"summary":"[^"]*"' | head -1 | sed 's/"summary":"//;s/"$//')
    epic_status=$(echo "$epic_data" | grep -o '"status":{[^}]*"name":"[^"]*"' | head -1 | grep -o '"name":"[^"]*"' | head -1 | sed 's/"name":"//;s/"$//')

    [ -z "$epic_summary" ] && epic_summary="(No summary)"
    [ -z "$epic_status" ] && epic_status="(No status)"

    log_success "Epic: $epic_summary ($epic_status)"

    # Get child issues (Tasks linked to Epic)
    log_info "Fetching Tasks..."
    json=$(build_jql "parent = $epic_key ORDER BY rank ASC" 100)
    local children=$(jira_api_call POST "/search/jql" "$json")

    # Count issues
    local issue_count=$(echo "$children" | grep -o '"key":"PROJ' | wc -l | tr -d ' ')
    [ -z "$issue_count" ] && issue_count=0
    log_info "Found $issue_count child issues"

    log_info "Generating feature structure..."

    # Generate scope hub node (Obsidian graph root)
    cat > "$OUTPUT_DIR/$scope_name/$scope_name.md" << SCOPE_EOF
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
- [[idea_research]]
- [[coding_convention]]
- [[INSTRUCTIONS]]
SCOPE_EOF

    log_success "Scope hub created: $OUTPUT_DIR/$scope_name/$scope_name.md"

    # Generate feature.md
    cat > "$OUTPUT_DIR/$scope_name/feature.md" << ROADMAP_EOF
---
scope: $scope_name
feature: $scope_name
jira_epic: $epic_key
jira_status: $epic_status
created: $(date +%Y-%m-%d)
---
# Feature: $scope_name

## Overview

| Field | Value |
|-------|-------|
| **JIRA Epic** | $epic_key |
| **Status** | $epic_status |
| **Goal** | $epic_summary |
| **Tasks** | $issue_count |

## Tasks

$(echo "$children" | grep -o '"key":"[A-Z]*-[0-9]*"' | sed 's/"key":"//;s/"$//' | while read task_key; do
    echo "### Task: $task_key"
    echo "**Type**: task"
    echo "**JIRA Link**: $task_key"
    echo ""
    echo "- [ ] $task_key"
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
ROADMAP_EOF

    log_success "Feature created: $OUTPUT_DIR/$scope_name/feature.md"

    # Create tasks directory
    mkdir -p "$OUTPUT_DIR/$scope_name/tasks"

    # Create individual task files from JIRA
    echo "$children" | grep -o '"key":"[A-Z]*-[0-9]*"' | sed 's/"key":"//;s/"$//' | while read task_key; do
        task_file="$OUTPUT_DIR/$scope_name/tasks/${task_key,,}.md"
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
        log_info "Created: $task_file"
    done

    log_success "Task files created"
}

# List epics
do_list() {
    log_info "Epics in ${JIRA_PROJECT_KEY}:"
    local json=$(build_jql "project = ${JIRA_PROJECT_KEY} AND type = Epic ORDER BY created DESC" 20)
    jira_api_call POST "/search/jql" "$json" | grep -o '"key":"[A-Z]*-[0-9]*"' | cut -d'"' -f4 | cat -n | sed 's/^/  /'
}

# List all issues
do_issues() {
    log_info "All issues in ${JIRA_PROJECT_KEY}:"
    local json=$(build_jql "project = ${JIRA_PROJECT_KEY} ORDER BY created DESC" 50)
    jira_api_call POST "/search/jql" "$json" | grep -o '"key":"[A-Z]*-[0-9]*"' | cut -d'"' -f4 | cat -n | sed 's/^/  /'
}

# List all issues with summary
do_issues_detailed() {
    log_info "All issues in ${JIRA_PROJECT_KEY}:"
    local json=$(build_jql "project = ${JIRA_PROJECT_KEY} ORDER BY created DESC" 50 "key,summary,issuetype")
    local response=$(jira_api_call POST "/search/jql" "$json")

    echo "$response" | grep -oE '"key":"[A-Z]+-[0-9]+"|"summary":"[^"]+"|"name":"[^"]+"' | \
        sed 's/"key":"/[/;s/"/] /;s/"summary":"/[/;s/"/] /;s/"name":"/[/;s/"/]/' | \
        paste - - - | \
        while read -r key type summary; do
            [ -n "$key" ] && echo "$key $type - $summary" | sed 's/  / /g'
        done
}

# Push feature status to JIRA
sync_push() {
    local scope_name="${1:-core}"
    local feature_file="$OUTPUT_DIR/$scope_name/feature.md"
    local tasks_dir="$OUTPUT_DIR/$scope_name/tasks"

    if [ ! -f "$feature_file" ]; then
        log_error "Feature file not found: $feature_file"
        exit 1
    fi

    log_info "Pushing feature status to JIRA: $scope_name"

    local jira_epic=$(grep -o 'jira_epic: [A-Z]*-[0-9]*' "$feature_file" | cut -d' ' -f2)

    if [ -z "$jira_epic" ]; then
        log_error "No JIRA epic found in feature.md frontmatter"
        exit 1
    fi

    # Count progress across feature.md and tasks/*.md
    local completed=0
    local total=0
    for f in "$feature_file" "$tasks_dir"/*.md 2>/dev/null; do
        [ -f "$f" ] || continue
        completed=$((completed + $(grep -c "\- \[x\]" "$f" 2>/dev/null || echo "0")))
        total=$((total + $(grep -c "\- \[ \]" "$f" 2>/dev/null || echo "0")))
    done

    log_info "Progress: $completed completed, $total remaining"

    log_success "JIRA push complete (simulated)"
    log_warn "Uncomment jira_api_call in this script to enable actual push"
}

# Main command dispatcher
case "${1:-}" in
    pull)
        sync_pull "$2" "$3"
        ;;
    push)
        sync_push "$2"
        ;;
    ping)
        jira_ping
        ;;
    list)
        do_list
        ;;
    issues)
        do_issues
        ;;
    issues-detailed)
        do_issues_detailed
        ;;
    help|--help|-h)
        echo "JIRA Sync - CheatScale Integration"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  pull <epic> [scope]     - Pull JIRA epic to roadmap"
        echo "  push [scope]          - Push roadmap to JIRA"
        echo "  ping                  - Test JIRA connection"
        echo "  list                  - List epics"
        echo "  issues                - List all issues"
        echo "  issues-detailed        - List all issues with summary"
        echo ""
        echo "Examples:"
        echo "  $0 pull PROJ-123 my-feature"
        echo "  $0 list"
        echo "  $0 issues"
        ;;
    *)
        echo "JIRA Sync - CheatScale Integration"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  pull <epic> [scope]   - Pull JIRA epic to roadmap"
        echo "  push [scope]        - Push roadmap to JIRA"
        echo "  ping              - Test JIRA connection"
        echo "  list              - List epics"
        echo "  issues            - List all issues"
        echo ""
        echo "Examples:"
        echo "  $0 pull PROJ-123 my-feature"
        echo "  $0 ping"
        echo "  $0 list"
        echo "Run '$0 help' for full help"
        ;;
esac