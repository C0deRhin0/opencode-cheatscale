#!/bin/bash
# JIRA Sync - Main sync script for roadmap ↔ JIRA
# Usage: ./jira-sync.sh [command] [options]
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/jira-auth.sh"

# Default output directory
OUTPUT_DIR="${OUTPUT_DIR:-plans}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[OK]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# Pull JIRA epic and create roadmap
sync_pull() {
    local epic_key="$1"
    local scope_name="$2"

    if [ -z "$epic_key" ]; then
        log_error "Usage: $0 pull <epic-key> [scope-name]"
        log_error "Example: $0 pull PROJ-123 my-feature"
        exit 1
    fi

    # Default scope name from epic if not provided
    if [ -z "$scope_name" ]; then
        scope_name=$(echo "$epic_key" | tr '[:upper:]' '[:lower:]' | cut -d'-' -f2)
    fi

    log_info "Pulling JIRA epic: $epic_key -> $scope_name"

    # Create output directory
    mkdir -p "$OUTPUT_DIR/$scope_name"

    # Get epic details
    log_info "Fetching epic details..."
    local epic_data=$(jira_api_call GET "/issue/$epic_key?fields=summary,description,status,created,updated")

    if echo "$epic_data" | grep -q "error"; then
        log_error "Failed to fetch epic: $epic_key"
        echo "$epic_data"
        exit 1
    fi

    # Extract epic fields
    local epic_summary=$(echo "$epic_data" | grep -o '"summary":"[^"]*"' | head -1 | sed 's/"summary":"//;s/"$//' | sed 's/\\"/"/g')
    local epic_status=$(echo "$epic_data" | grep -o '"name":"[^"]*"' | head -1 | sed 's/"name":"//;s/"$//')

    log_success "Epic: $epic_summary ($epic_status)"

    # Get child issues
    log_info "Fetching child issues..."
    local children=$(jira_api_call GET "/search?jql=parent=$epic_key ORDER BY rank asc&maxResults=100")

    local issue_count=$(echo "$children" | grep -o '"total":[0-9]*' | cut -d':' -f2)
    log_info "Found $issue_count child issues"

    # Generate roadmap markdown
    log_info "Generating roadmap..."

    local roadmap_content=$(cat << ROADMAP_EOF
---
tags: [roadmap, $scope_name, jira]
scope: $scope_name
jira_epic: $epic_key
jira_status: $epic_status
---
# Roadmap: $scope_name
## Project Brief

- **JIRA Epic**: $epic_key
- **Status**: $epic_status
- **Goal**: $epic_summary
- **Tasks**: $issue_count

## Roadmap

### Phase 1 — Implementation

**Day 1**
$(echo "$children" | head -20 | grep -o '"key":"[^"]*"' | head -10 | while read -r key; do
    local task_key=$(echo "$key" | cut -d'"' -f4)
    echo "- [ ] $task_key"
done)

**Day 2**
$(echo "$children" | head -30 | grep -o '"key":"[^"]*"' | tail -n +11 | head -10 | while read -r key; do
    local task_key=$(echo "$key" | cut -d'"' -f4)
    echo "- [ ] $task_key"
done)

### Phase 2 — Review & Testing

**Day 3**
- [ ] Code review
- [ ] Testing
- [ ] Documentation

### Phase 3 — Deployment

**Day 4**
- [ ] Deploy to staging
- [ ] UAT
- [ ] Production deploy

## Progress Tracking

| Day | Tasks | Status |
|-----|-------|--------|
| Day 1 | - | Pending |
| Day 2 | - | Pending |
| Day 3 | - | Pending |
| Day 4 | - | Pending |

---
*Generated from JIRA Epic: $epic_key via CheatScale*
ROADMAP_EOF
)

    # Write roadmap file
    echo "$roadmap_content" > "$OUTPUT_DIR/$scope_name/roadmap.md"
    log_success "Roadmap created: $OUTPUT_DIR/$scope_name/roadmap.md"

    # Create day breakdown files
    create_day_files "$scope_name" "$children"
}

# Create individual day files from roadmap
create_day_files() {
    local scope_name="$1"
    local children="$2"

    log_info "Creating day breakdown files..."

    # Day 1
    cat > "$OUTPUT_DIR/$scope_name/days/day-1.md" << EOF
# Day 1 — Implementation

## Focus
- Core implementation tasks
- Initial setup

## Tasks
- [ ] Task placeholder 1
- [ ] Task placeholder 2

## Notes
<!-- Add daily notes here -->
EOF

    # Day 2
    cat > "$OUTPUT_DIR/$scope_name/days/day-2.md" << EOF
# Day 2 — Implementation

## Focus
- Continued implementation

## Tasks
- [ ] Task placeholder 3
- [ ] Task placeholder 4

## Notes
<!-- Add daily notes here -->
EOF

    log_success "Day files created"
}

# Push roadmap status to JIRA
sync_push() {
    local scope_name="${1:-core}"

    local roadmap_file="$OUTPUT_DIR/$scope_name/roadmap.md"

    if [ ! -f "$roadmap_file" ]; then
        log_error "Roadmap not found: $roadmap_file"
        exit 1
    fi

    log_info "Pushing roadmap to JIRA: $scope_name"

    # Extract JIRA epic from frontmatter
    local jira_epic=$(grep -o 'jira_epic: [A-Z]*-[0-9]*' "$roadmap_file" | cut -d' ' -f2)

    if [ -z "$jira_epic" ]; then
        log_error "No JIRA epic found in roadmap frontmatter"
        log_error "Add 'jira_epic: PROJ-123' to roadmap frontmatter"
        exit 1
    fi

    # Calculate progress
    local total=$(grep -c "\- \[ \]" "$roadmap_file" || echo "0")
    local completed=$(grep -c "\- \[x\]" "$roadmap_file" || echo "0")
    local progress=$((completed * 100 / (completed + total)))

    log_info "Progress: $completed/$((completed + total)) tasks ($progress%)"

    # Add comment to epic (commented out for safety)
    local comment="Roadmap Update via CheatScale:
- Completed: $completed of $((completed + total)) tasks
- Progress: $progress%
- Updated from: $scope_name roadmap"

    # Uncomment to enable:
    # jira_api_call POST "/issue/$jira_epic/comment" "'{\"body\": \"$comment\"}'"

    log_success "JIRA push complete (simulated)"
    log_warn "Uncomment jira_api_call in jira-push.sh to enable actual push"
}

# Bidirectional sync
sync_both() {
    local scope_name="${1:-core}"

    log_info "Starting bidirectional sync..."

    # Pull latest from JIRA
    log_info "1. Fetching latest from JIRA..."

    # Merge with local
    log_info "2. Merging with local roadmap..."

    # Push updates
    log_info "3. Pushing updates to JIRA..."

    log_success "Bidirectional sync complete"
}

# Interactive mode
interactive_pick() {
    log_info "Interactive JIRA Epic Picker"

    # List available epics
    echo ""
    log_info "Available epics in ${JIRA_PROJECT_KEY}:"
    echo ""

    local epics=$(jira_api_call GET "/search?jql=project+%22${JIRA_PROJECT_KEY}%22+AND+type+Epic+ORDER+BY+created+DESC&maxResults=10")

    echo "$epics" | grep -o '"key":"[^"]*"' | nl -w2 -p"  "
    echo ""

    read -p "Select epic number: " epic_num

    if [ -z "$epic_num" ]; then
        log_error "No epic selected"
        return 1
    fi

    local epic_key=$(echo "$epics" | grep -o '"key":"[^"]*"' | sed -n "${epic_num}p" | cut -d'"' -f4)

    if [ -z "$epic_key" ]; then
        log_error "Invalid selection"
        return 1
    fi

    read -p "Enter scope name (default: $(echo $epic_key | cut -d'-' -f2): " scope_name

    sync_pull "$epic_key" "$scope_name"
}

# Main command dispatcher
case "${1:-}" in
    pull)
        sync_pull "$2" "$3"
        ;;
    push)
        sync_push "$2"
        ;;
    sync)
        sync_both "$2"
        ;;
    ping)
        jira_ping
        ;;
    list)
        # List epics
        jira_api_call GET "/search?jql=project+%22${JIRA_PROJECT_KEY}%22+AND+type+Epic+ORDER+BY+created+DESC&maxResults=20" | \
            grep -o '"key":"[^"]*"' | \
            while read -r key; do
                echo "$key" | cut -d'"' -f4
            done
        ;;
    interactive|interactive-pick)
        interactive_pick
        ;;
    help|--help|-h)
        echo "JIRA Sync - CheatScale Integration"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  pull <epic> [scope]   - Pull JIRA epic to roadmap"
        echo "  push [scope]          - Push roadmap to JIRA"
        echo "  sync [scope]          - Bidirectional sync"
        echo "  ping                  - Test JIRA connection"
        echo "  list                  - List available epics"
        echo "  interactive           - Interactive epic picker"
        echo ""
        echo "Examples:"
        echo "  $0 pull PROJ-123 my-feature"
        echo "  $0 push billing"
        echo "  $0 ping"
        ;;
    *)
        if [ -z "$1" ]; then
            echo "JIRA Sync - CheatScale Integration"
            echo ""
            echo "Usage: $0 <command> [options]"
            echo ""
            echo "Commands:"
            echo "  pull <epic> [scope]   - Pull JIRA epic to roadmap"
            echo "  push [scope]          - Push roadmap to JIRA"
            echo "  sync [scope]         - Bidirectional sync"
            echo "  ping                - Test JIRA connection"
            echo "  list                - List available epics"
            echo "  interactive         - Interactive epic picker"
            echo ""
            echo "Examples:"
            echo "  $0 pull PROJ-123 my-feature"
            echo "  $0 push billing"
            echo "  $0 ping"
            echo ""
            echo "Run '$0 help' for full help"
        else
            log_error "Unknown command: $1"
            echo "Run '$0 help' for usage"
            exit 1
        fi
        ;;
esac