#!/bin/bash
# JIRA Authentication Handler
# Source this file to set up JIRA credentials

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/jira-config.env"
JIRA_WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
JIRA_PLANS_ROOT="$JIRA_WORKSPACE_ROOT/plans"

# Load configuration as data, not executable shell code.
load_jira_config() {
    local file="$1"
    while IFS='=' read -r raw_key raw_value || [ -n "$raw_key" ]; do
        raw_key="$(echo "$raw_key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
        case "$raw_key" in
            ''|\#*) continue ;;
            JIRA_DOMAIN|JIRA_EMAIL|JIRA_API_TOKEN|JIRA_PROJECT_KEY|JIRA_CLIENT_ID|JIRA_CLIENT_SECRET|JIRA_EPIC_FIELD|JIRA_STORY_POINTS_FIELD|JIRA_SPRINT_FIELD|JIRA_EPIC_ISSUE_TYPE|JIRA_TASK_ISSUE_TYPE|JIRA_SUBTASK_ISSUE_TYPE|JIRA_HTTP_PROXY|JIRA_HTTPS_PROXY|JIRA_VERIFY_SSL|JIRA_TIMEOUT|DEFAULT_EPIC_KEY)
                raw_value="$(echo "${raw_value:-}" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//;s/^"//;s/"$//;s/^'\''//;s/'\''$//')"
                printf -v "$raw_key" '%s' "$raw_value"
                export "$raw_key"
                ;;
            *)
                echo "WARN: Ignoring unsupported JIRA config key: $raw_key" >&2
                ;;
        esac
    done < "$file"
}

if [ -f "$CONFIG_FILE" ]; then
    load_jira_config "$CONFIG_FILE"
else
    echo "ERROR: JIRA config file not found: $CONFIG_FILE"
    echo "Copy jira-config.env.example to jira-config.env and fill in values"
    exit 1
fi

jira_json_string() {
    python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))'
}

jira_validate_scope() {
    local scope="$1"
    [[ "$scope" =~ ^[a-z0-9][a-z0-9_-]{0,80}$ ]]
}

jira_validate_project_key() {
    local key="$1"
    [[ "$key" =~ ^[A-Z][A-Z0-9_]{1,30}$ ]]
}

jira_validate_issue_key() {
    local key="$1"
    [[ "$key" =~ ^[A-Z][A-Z0-9_]*-[0-9]+$ ]]
}

jira_resolve_output_dir() {
    local requested="${1:-plans}"
    python3 - "$JIRA_PLANS_ROOT" "$JIRA_WORKSPACE_ROOT" "$requested" <<'PY'
import os
import sys

plans_root = os.path.abspath(sys.argv[1])
workspace_root = os.path.abspath(sys.argv[2])
requested = sys.argv[3]

candidate = requested if os.path.isabs(requested) else os.path.join(workspace_root, requested)
candidate = os.path.abspath(candidate)

try:
    common = os.path.commonpath([plans_root, candidate])
except ValueError:
    common = ""

if common != plans_root:
    print(f"ERROR: OUTPUT_DIR must resolve inside {plans_root}", file=sys.stderr)
    sys.exit(1)

print(candidate)
PY
}

# Validate required fields
if [ -z "$JIRA_DOMAIN" ] || [ -z "$JIRA_EMAIL" ] || [ -z "$JIRA_API_TOKEN" ]; then
    echo "ERROR: Missing required JIRA credentials"
    echo "Please set JIRA_DOMAIN, JIRA_EMAIL, and JIRA_API_TOKEN in $CONFIG_FILE"
    exit 1
fi

# Base URL
JIRA_BASE_URL="https://$JIRA_DOMAIN/rest/api/3"

# Function to make authenticated JIRA API calls
jira_api_call() {
    local method="$1"
    local endpoint="$2"
    local data="$3"

    local curl_opts=()
    if [ "${JIRA_VERIFY_SSL:-true}" = "false" ]; then
        curl_opts+=("-k")
    fi

    curl -s -X "$method" \
        -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
        -H "Content-Type: application/json" \
        --max-time "${JIRA_TIMEOUT:-30}" \
        "${curl_opts[@]}" \
        ${data:+-d "$data"} \
        "$JIRA_BASE_URL$endpoint"
}

# Test connection
jira_ping() {
    echo "Testing JIRA connection to $JIRA_DOMAIN..."
    local response=$(jira_api_call GET "/myself")
    
    if echo "$response" | grep -q '"accountId"'; then
        local account_name=$(echo "$response" | grep -o '"displayName":"[^"]*"' | cut -d'"' -f4)
        echo "✓ Connected as: $account_name"
        return 0
    else
        echo "✗ Connection failed"
        echo "$response"
        return 1
    fi
}

# Create JIRA project (space)
jira_create_project() {
    local project_name="$1"
    local project_key="$2"

    if ! jira_validate_project_key "$project_key"; then
        echo "ERROR: Invalid JIRA project key: $project_key"
        return 1
    fi

    local project_name_json
    local project_key_json
    project_name_json=$(printf '%s' "$project_name" | jira_json_string)
    project_key_json=$(printf '%s' "$project_key" | jira_json_string)
    
    echo "Creating JIRA project: $project_name ($project_key)..."
    
    # Try minimal - just key, name, and projectTypeKey (Jira will use default template)
    local response=$(jira_api_call POST "/project" "{
        \"key\": $project_key_json,
        \"name\": $project_name_json,
        \"projectTypeKey\": \"software\"
    }")
    
    if echo "$response" | grep -q '"id"'; then
        local created_key=$(echo "$response" | grep -o '"key":"[^"]*"' | cut -d'"' -f4)
        echo "✓ Created project: $created_key"
        echo "$response"
        return 0
    else
        echo "✗ Failed to create project"
        echo "$response"
        return 1
    fi
}

# Check if project exists
jira_project_exists() {
    local project_key="$1"
    
    local response=$(jira_api_call GET "/project/$project_key")
    
    if echo "$response" | grep -q '"id"'; then
        return 0  # Exists
    else
        return 1  # Does not exist
    fi
}

# Export functions for use in other scripts
export -f jira_api_call
export -f jira_ping
export -f jira_create_project
export -f jira_project_exists
export -f jira_json_string
export -f jira_validate_scope
export -f jira_validate_project_key
export -f jira_validate_issue_key
export -f jira_resolve_output_dir
export JIRA_BASE_URL
export JIRA_WORKSPACE_ROOT
export JIRA_PLANS_ROOT
