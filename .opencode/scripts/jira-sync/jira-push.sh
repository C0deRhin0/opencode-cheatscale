#!/bin/bash
# JIRA Push Script - Create Epic > Task > Subtask hierarchy from bootstrap roadmap
# Usage: ./jira-push.sh create [scope]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/jira-auth.sh"

OUTPUT_DIR="$(jira_resolve_output_dir "${OUTPUT_DIR:-plans}")" || exit 1

# Helper: Create ADF description
create_adf_desc() {
    local text="$1"
    local text_json
    text_json=$(printf '%s' "$text" | jira_json_string)
    echo "{\"type\": \"doc\", \"version\": 1, \"content\": [{\"type\": \"paragraph\", \"content\": [{\"type\": \"text\", \"text\": $text_json}]}]}"
}

# Extract checkbox name (everything after "- [ ] ")
extract_checkbox_name() {
    echo "$1" | sed 's/^- \[ \] //'
}

# Create Epic > Task > Subtask hierarchy
create_jira_hierarchy() {
    local scope="${1:-}"

    if [ -z "$scope" ]; then
        echo "ERROR: Scope required. Usage: $0 create <scope>"
        exit 1
    fi

    if ! jira_validate_scope "$scope"; then
        echo "ERROR: Invalid scope. Use lowercase letters, numbers, underscore, or hyphen only."
        exit 1
    fi

    local feature_file="$OUTPUT_DIR/$scope/$scope.md"
    local tasks_dir="$OUTPUT_DIR/$scope/tasks"

    if [ ! -f "$feature_file" ]; then
        echo "ERROR: Feature file not found: $feature_file"
        exit 1
    fi

    # Determine JIRA project
    local jira_project=$(grep '^jira_project:' "$feature_file" | head -1 | awk '{print $2}' | tr -d '"'"'"' ')
    jira_project="${jira_project:-$JIRA_PROJECT_KEY}"

    if [ -z "$jira_project" ]; then
        echo "ERROR: No jira_project found in $scope.md frontmatter"
        exit 1
    fi

    if ! jira_validate_project_key "$jira_project"; then
        echo "ERROR: Invalid JIRA project key: $jira_project"
        exit 1
    fi

    echo "=== Creating JIRA Hierarchy: $scope ==="
    echo "Project: $jira_project"

    # Extract feature name from title line (strip prefixes like "Scope: " or "Feature: ")
    local feature_name=$(grep -m1 "^# " "$feature_file" | sed 's/^# //' | sed 's/^Scope: //' | sed 's/^Feature: //' | head -c 100)
    if [ -z "$feature_name" ]; then
        feature_name="$scope"
    fi
    local feature_name_json
    local jira_project_json
    local epic_type_json
    local task_type_json
    local subtask_type_json
    feature_name_json=$(printf '%s' "$feature_name" | jira_json_string)
    jira_project_json=$(printf '%s' "$jira_project" | jira_json_string)
    epic_type_json=$(printf '%s' "${JIRA_EPIC_ISSUE_TYPE:-Epic}" | jira_json_string)
    task_type_json=$(printf '%s' "${JIRA_TASK_ISSUE_TYPE:-Task}" | jira_json_string)
    subtask_type_json=$(printf '%s' "${JIRA_SUBTASK_ISSUE_TYPE:-Subtask}" | jira_json_string)

    # Check if Epic already exists
    local existing_epic=$(grep '^jira_epic:' "$feature_file" | head -1 | awk '{print $2}' | tr -d '"'"'"' ')

    # If frontmatter is missing epic, query JIRA explicitly
    if [ -z "$existing_epic" ]; then
        echo "  [Check] Verifying if Epic '$feature_name' already exists in JIRA..."
        local epic_jql
        local epic_jql_json
        epic_jql="project = \"$jira_project\" AND issuetype = Epic AND summary ~ \"$feature_name\""
        epic_jql_json=$(printf '%s' "$epic_jql" | jira_json_string)
        local jql_payload="{\"jql\":$epic_jql_json,\"maxResults\":1,\"fields\":[\"key\"]}"
        local search_response=$(jira_api_call POST "/search/jql" "$jql_payload")
        local found_key=$(echo "$search_response" | grep -o '"key":"[^"]*"' | head -1 | cut -d'"' -f4)
        
        if [ -n "$found_key" ]; then
            echo "  [Found] Discovered existing Epic in JIRA: $found_key"
            existing_epic="$found_key"
        fi
    fi

    if [ -n "$existing_epic" ]; then
        if ! jira_validate_issue_key "$existing_epic"; then
            echo "ERROR: Invalid existing Epic key: $existing_epic"
            exit 1
        fi
        echo "Using existing Epic: $existing_epic"
        local epic_key="$existing_epic"
        
        # Update frontmatter fields in-place
        sed -i '' "s/^jira_epic:.*/jira_epic: $epic_key/" "$feature_file" 2>/dev/null || \
        sed -i "s/^jira_epic:.*/jira_epic: $epic_key/" "$feature_file"
        sed -i '' "s/^jira_project:.*/jira_project: $jira_project/" "$feature_file" 2>/dev/null || \
        sed -i "s/^jira_project:.*/jira_project: $jira_project/" "$feature_file"
    else
        echo "Creating Epic: $feature_name..."
        local epic_desc=$(create_adf_desc "Created from bootstrap roadmap. See: plans/$scope/")
        local epic_response=$(jira_api_call POST '/issue' "{
            \"fields\": {
                \"project\": { \"key\": $jira_project_json },
                \"summary\": $feature_name_json,
                \"description\": $epic_desc,
                \"issuetype\": { \"name\": $epic_type_json }
            }
        }")

        if echo "$epic_response" | grep -q '"key"'; then
            local epic_key=$(echo "$epic_response" | grep -o '"key":"[^"]*"' | cut -d'"' -f4)
            echo "Created Epic: $epic_key"

            # Update feature file frontmatter fields in-place
            sed -i '' "s/^jira_epic:.*/jira_epic: $epic_key/" "$feature_file" 2>/dev/null || \
            sed -i "s/^jira_epic:.*/jira_epic: $epic_key/" "$feature_file"
            sed -i '' "s/^jira_project:.*/jira_project: $jira_project/" "$feature_file" 2>/dev/null || \
            sed -i "s/^jira_project:.*/jira_project: $jira_project/" "$feature_file"
        else
            echo "ERROR: Failed to create Epic"
            echo "$epic_response"
            exit 1
        fi
    fi

    echo ""
    echo "Creating Tasks under $epic_key..."

    # Process each task file
    local task_count=0
    for task_file in "$tasks_dir"/*.md; do
        [ -f "$task_file" ] || continue

        # Extract task summary (title after # Task:)
        local task_summary=$(grep -m1 "^# Task:" "$task_file" | sed 's/^# Task: //' | head -c 100)
        if [ -z "$task_summary" ]; then
            local task_summary=$(basename "$task_file" .md)
        fi
        local task_summary_json
        task_summary_json=$(printf '%s' "$task_summary" | jira_json_string)

        # Check if task already exists
        local existing_task=$(grep '^jira_key:' "$task_file" | head -1 | awk '{print $2}' | tr -d '"'"'"' ')

        # If frontmatter misses task, query JIRA explicitly
        if [ -z "$existing_task" ]; then
            local task_query
            local task_query_json
            task_query="project = \"$jira_project\" AND parent = \"$epic_key\" AND summary ~ \"$task_summary\""
            task_query_json=$(printf '%s' "$task_query" | jira_json_string)
            local task_jql="{\"jql\":$task_query_json,\"maxResults\":1,\"fields\":[\"key\"]}"
            local task_search=$(jira_api_call POST "/search/jql" "$task_jql")
            local found_task=$(echo "$task_search" | grep -o '"key":"[^"]*"' | head -1 | cut -d'"' -f4)
            if [ -n "$found_task" ]; then
                existing_task="$found_task"
            fi
        fi

        if [ -n "$existing_task" ]; then
            if ! jira_validate_issue_key "$existing_task"; then
                echo "  Skipping invalid existing Task key: $existing_task"
                continue
            fi
            echo "  Using existing Task: $existing_task - $task_summary"
            local task_key="$existing_task"
        else
            echo "  Creating Task: $task_summary..."
            local task_desc=$(create_adf_desc "See: plans/$scope/tasks/$(basename "$task_file")")
            local task_response=$(jira_api_call POST '/issue' "{
                \"fields\": {
                    \"project\": { \"key\": $jira_project_json },
                    \"summary\": $task_summary_json,
                    \"description\": $task_desc,
                    \"issuetype\": { \"name\": $task_type_json },
                    \"parent\": { \"key\": \"$epic_key\" }
                }
            }")

            if echo "$task_response" | grep -q '"key"'; then
                local task_key=$(echo "$task_response" | grep -o '"key":"[^"]*"' | cut -d'"' -f4)
                echo "    Created: $task_key"

                # Update task file frontmatter fields in-place
                local jira_url="https://$JIRA_DOMAIN/browse/$task_key"
                sed -i '' "s|^jira_key:.*|jira_key: $task_key|" "$task_file" 2>/dev/null || \
                sed -i "s|^jira_key:.*|jira_key: $task_key|" "$task_file"
                sed -i '' "s|^jira_url:.*|jira_url: $jira_url|" "$task_file" 2>/dev/null || \
                sed -i "s|^jira_url:.*|jira_url: $jira_url|" "$task_file"
            else
                echo "    ERROR: Failed to create Task"
                continue
            fi
        fi

        # Create subtasks from checkboxes
        local subtask_count=0
        local in_checklist=0

        # Read file line by line
        while IFS= read -r line || [ -n "$line" ]; do
            # Track when we enter/exit Validation Checklist section
            case "$line" in
                "## Validation Checklist")
                    in_checklist=1
                    continue
                    ;;
                "##"*)
                    # Any ## header ends the checklist section
                    in_checklist=0
                    continue
                    ;;
            esac

            # Only process lines inside Validation Checklist
            if [ $in_checklist -eq 1 ]; then
                # Check if line STARTs with "- [ ] " (checkbox, not code block or comment)
                # Must be exact match for checkbox unchecked, not "- [x]" completed
                if [[ "$line" == "- [ ]"* ]] && [[ "$line" != "- [ ]"*"\`\`\`"* ]]; then
                    local subtask_name=$(extract_checkbox_name "$line")

                    # Skip empty or too-short checkboxes (need actual content)
                    if [ -n "$subtask_name" ] && [ ${#subtask_name} -gt 2 ]; then
                        echo "    Creating Subtask: $subtask_name..."
                        local subtask_name_json
                        subtask_name_json=$(printf '%s' "$subtask_name" | jira_json_string)
                        local sub_desc=$(create_adf_desc "Subtask from checklist")
                        local sub_response=$(jira_api_call POST '/issue' "{
                            \"fields\": {
                                \"project\": { \"key\": $jira_project_json },
                                \"summary\": $subtask_name_json,
                                \"description\": $sub_desc,
                                \"issuetype\": { \"name\": $subtask_type_json },
                                \"parent\": { \"key\": \"$task_key\" }
                            }
                        }")

                        if echo "$sub_response" | grep -q '"key"'; then
                            local sub_key=$(echo "$sub_response" | grep -o '"key":"[^"]*"' | cut -d'"' -f4)
                            echo "      Created: $sub_key"
                            subtask_count=$((subtask_count + 1))
                        fi
                    fi
                fi
            fi
        done < "$task_file"

        if [ $subtask_count -gt 0 ]; then
            echo "      Subtasks created: $subtask_count"
        fi

        task_count=$((task_count + 1))
        echo ""
    done

    echo "=== JIRA Push Complete ==="
    echo "Epic: $epic_key"
    echo "Tasks created: $task_count"
    echo ""
    echo "JIRA Links:"
    echo "  https://$JIRA_DOMAIN/browse/$epic_key"
}

# Sync checkbox status (Phase 3)
sync_status() {
    local scope="${1:-}"

    echo "=== Syncing Status: $scope ==="
    echo "Feature: Placeholder for bidirectional sync"
}

# Main
case "${1:-}" in
    create)
        create_jira_hierarchy "$2"
        ;;
    sync)
        sync_status "$2"
        ;;
    *)
        echo "JIRA Push Script"
        echo ""
        echo "Usage: $0 <command> [scope]"
        echo ""
        echo "Commands:"
        echo "  create <scope>  - Create Epic > Task > Subtask hierarchy"
        echo "  sync <scope>   - Sync checkbox status"
        echo ""
        echo "Examples:"
        echo "  $0 create test_portofoll"
        echo "  $0 sync billing"
        ;;
esac
