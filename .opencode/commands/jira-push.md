---
description: Create JIRA epic and tasks from bootstrap roadmap. Creates Epic > Task > Subtask hierarchy with proper JIRA API structure
agent: orchestrator
---

# JIRA Push: Create Epic from Roadmap

Push the bootstrap-generated roadmap to JIRA and build out a strict drop-down hierarchy on your space. Specifically, this will create:
1. **1 EPIC** (for the overall feature scope).
2. **Multiple TASKS** nested inside that Epic (one for each local task file).
3. **Multiple SUBTASKS** nested inside each Task (parsed directly from the `- [ ]` Validation Checklist items).

---

## Core Protocols

- **Source of Truth**: JIRA is the target; local roadmap is the template
- **Bidirectional**: After creation, $SCOPE.md updates with real JIRA keys
- **Automation First**: The Orchestrator MUST defer the actual JIRA API loop logic to the dedicated `jira-push.sh` script. Do NOT manually try to build REST JSON payloads or parse checkboxes yourself—the script is hardcoded to do this natively with the correct POST searches.

---

## Execution Instructions

**You are the Orchestrator.** When the user invokes `/jira-push $ARGUMENTS`, you must perform the following explicit steps:

### Step 1: Pre-Flight Check & Scope Extraction
Extract the target scope directly from `$ARGUMENTS` (which acts as the feature scope name). Strip out quotes for consistency:
```bash
SCOPE=$(echo "$ARGUMENTS" | tr -d '"'\' | tr -d ' ')

# Check if JIRA config exists
ls -la .opencode/scripts/jira-sync/jira-config.env

# Check if roadmap exists natively
ls -la "plans/$SCOPE/"
ls -la "plans/$SCOPE/tasks/"
```

### Step 2: Execute Automation Script
Do not attempt to curl JIRA directly. Call the internal sub-script which is specifically programmed to build the Drop-down Epic hierarchies securely (including pre-checking for existing Epics via JQL):
```bash
# Make sure scripts are executable
chmod +x .opencode/scripts/jira-sync/*.sh

# Run the push script
cd .opencode/scripts/jira-sync/
./jira-push.sh create "$SCOPE"
```

### Step 3: Output to User
The bash script will print out the final structure created containing the `EPIC KEY`, `TASK KEYS`, and `SUBTASK KEYS`. Read the output of the script and gracefully report the final JIRA keys back to the user.

---

## Usage

```bash
/jira-push $SCOPE        # Push $SCOPE roadmap to JIRA
/jira-push portfolio       # Push portfolio roadmap to JIRA
/jira-push billing        # Push billing roadmap to JIRA
```

**Prerequisites**:
1. JIRA credentials in `.opencode/scripts/jira-sync/jira-config.env`
2. Project key configured (default: `PROJ`)
3. Roadmap already generated via `/bootstrap`

---

## Related Commands

- `/bootstrap "project vision"` - Generate roadmap first
- `/routine $SCOPE task-name` - Execute tasks
- `/push $SCOPE task-name` - Push commits to remote