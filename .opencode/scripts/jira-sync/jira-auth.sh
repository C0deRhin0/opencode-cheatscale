#!/bin/bash
# JIRA Authentication Handler
# Source this file to set up JIRA credentials

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/jira-config.env"

# Load configuration
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
else
    echo "ERROR: JIRA config file not found: $CONFIG_FILE"
    echo "Copy jira-config.env.example to jira-config.env and fill in values"
    exit 1
fi

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

    curl -s -X "$method" \
        -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
        -H "Content-Type: application/json" \
        --max-time "${JIRA_TIMEOUT:-30}" \
        ${JIRA_VERIFY_SSL:+-k} \
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

# Export functions for use in other scripts
export -f jira_api_call
export -f jira_ping
export JIRA_BASE_URL