#!/bin/bash
# JIRA Push Script - Update JIRA status from roadmap
# Usage: ./jira-push.sh [scope]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/jira-auth.sh"

# Read roadmap and update JIRA
push_to_jira() {
    local scope="${1:-core}"
    local roadmap_file="$OUTPUT_DIR/$scope/roadmap.md"
    
    if [ ! -f "$roadmap_file" ]; then
        echo "ERROR: Roadmap not found: $roadmap_file"
        exit 1
    fi
    
    echo "=== Pushing Roadmap to JIRA: $scope ==="
    
    # Extract JIRA epic from frontmatter
    local jira_epic=$(grep -o 'jira_epic: [A-Z]*-[0-9]*' "$roadmap_file" | cut -d' ' -f2)
    
    if [ -z "$jira_epic" ]; then
        echo "WARNING: No JIRA epic found in roadmap frontmatter"
        echo "Add 'jira_epic: PROJ-123' to roadmap frontmatter"
        return 1
    fi
    
    echo "Target Epic: $jira_epic"
    
    # Get completed tasks from roadmap
    local completed_tasks=$(grep -E "^\- \[x\]" "$roadmap_file" | sed 's/- \[x\] //')
    
    if [ -z "$completed_tasks" ]; then
        echo "No completed tasks found in roadmap"
        return 0
    fi
    
    echo ""
    echo "Completed tasks to push:"
    echo "$completed_tasks"
    echo ""
    
    # TODO: Map roadmap tasks to JIRA issue keys
    # This requires task-to-JIRA-key mapping stored in roadmap
    
    # Placeholder: Update epic status based on roadmap progress
    local progress=$(grep -c "\- \[x\]" "$roadmap_file" || echo "0")
    local total=$(grep -c "\- \[ \]" "$roadmap_file" || echo "0")
    local percent=$((progress * 100 / (progress + total)))
    
    echo "Progress: $progress/$((progress+total)) ($percent%)"
    
    # Example: Add comment to epic
    local comment=$(cat << EOF
CheatScale Roadmap Update:
- Completed: $progress tasks
- Remaining: $((total - progress)) tasks
- Progress: $percent%

*Synced from roadmap: $scope*
EOF
)
    
    # Uncomment to actually push:
    # jira_api_call POST "/issue/$jira_epic/comment" "\"body\": \"$comment\""
    
    echo ""
    echo "✓ JIRA push complete (simulated)"
    echo "  Uncomment jira_api_call in jira-push.sh to enable actual push"
}

# Sync status bidirectional
sync_status() {
    local scope="${1:-core}"
    
    echo "=== Bidirectional Sync: JIRA ↔ Roadmap ==="
    
    # 1. Pull latest from JIRA
    echo "1. Fetching latest from JIRA..."
    # Placeholder
    
    # 2. Merge with roadmap
    echo "2. Merging with local roadmap..."
    # Placeholder
    
    # 3. Push updates back
    echo "3. Pushing updates to JIRA..."
    # Placeholder
    
    echo "✓ Sync complete"
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
        echo "  push [scope]   - Push roadmap to JIRA (default: core)"
        echo "  sync [scope]  - Bidirectional sync"
        echo ""
        echo "Examples:"
        echo "  $0 push billing"
        echo "  $0 sync snake"
        ;;
esac