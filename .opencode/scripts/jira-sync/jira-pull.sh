#!/bin/bash
# JIRA Pull Script - Extract epics/tasks to roadmap format
# Usage: ./jira-pull.sh [epic-key]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/jira-auth.sh"

# Output directory
OUTPUT_DIR="${OUTPUT_DIR:-plans}"

# Default JQL if no epic provided
DEFAULT_JQL='project = "'"${JIRA_PROJECT_KEY}"'" AND type = Epic ORDER BY created DESC'

# Pull epic and its children
pull_epic() {
    local epic_key="$1"
    local epic_key="${epic_key:-$DEFAULT_EPIC_KEY}"
    
    if [ -z "$epic_key" ]; then
        echo "Usage: $0 <epic-key>"
        echo "Example: $0 PROJ-123"
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
    
    # Convert to roadmap format
    echo ""
    echo "=== Generating Roadmap Format ==="
    
    # Create scope name from epic key (e.g., PROJ-123 → proj)
    local scope_name=$(echo "$epic_key" | tr '[:upper:]' '[:lower:]' | cut -d'-' -f2)
    local scope_name="${scope_name:-roadmap}"
    
    # Generate markdown
    generate_roadmap "$epic_key" "$epic_summary" "$epic_status" "$task_count"
}

# Generate roadmap markdown
generate_roadmap() {
    local epic_key="$1"
    local epic_summary="$2"
    local epic_status="$3"
    local task_count="$4"
    
    local scope_name=$(echo "$epic_key" | tr '[:upper:]' '[:lower:]' | cut -d'-' -f2)
    
    cat << EOF
---
tags: [roadmap, $scope_name, jira]
scope: $scope_name
jira_epic: $epic_key
---

# Roadmap: $scope_name

## Project Brief

- **JIRA Epic**: $epic_key
- **Status**: $epic_status
- **Goal**: $epic_summary
- **Tasks**: $task_count

## Roadmap

### Phase 1 — Implementation

**Day 1**
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

**Day 2**
- [ ] Task 4
- [ ] Task 5

**Deliverable:** All JIRA tasks synced to roadmap

---

*Generated from JIRA Epic: $epic_key*
EOF
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
        echo "JIRA Sync - CheatScale Integration"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  ping              - Test JIRA connection"
        echo "  list              - List available epics"
        echo "  pull [epic-key]  - Pull epic to roadmap"
        echo ""
        echo "Examples:"
        echo "  $0 ping"
        echo "  $0 list"
        echo "  $0 pull PROJ-123"
        ;;
esac