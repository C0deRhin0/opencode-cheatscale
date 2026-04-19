---
description: Create JIRA epic and tasks from bootstrap roadmap. Creates Epic > Task > Subtask hierarchy with proper JIRA API structure
agent: orchestrator
---

# JIRA Push: Create Epic from Roadmap

Push the bootstrap-generated roadmap to JIRA with proper hierarchy: **Epic > Tasks > Subtasks**.

---

## Core Protocols

- **Source of Truth**: JIRA is the target; local roadmap is the template
- **Bidirectional**: After creation, $SCOPE.md updates with real JIRA keys
- **Idempotent**: Safe to run multiple times (skips existing issues)
- **Hierarchy**: Epic → Task → Subtask (1→N→N)

---

## Phase 0: Validation

`[Mode: Check]`

1. Verify JIRA credentials exist in `.opencode/scripts/jira-sync/jira-config.env`
2. Test JIRA connection: `source jira-auth.sh && jira_ping`
3. Identify scope from argument: `$SCOPE` (e.g., `portfolio`, `billing`)
4. Validate roadmap exists:
   - `plans/$SCOPE/$SCOPE.md` must exist
   - `plans/$SCOPE/tasks/` directory must exist
5. **Determine JIRA Project** (flexible support):
   - Read `plans/$SCOPE/$SCOPE.md` frontmatter for `jira_project` field
   - If `jira_project: none` or empty → Show error "JIRA not configured for this roadmap"
   - If valid key → Use for all JIRA operations
   - If not found → Fallback to `JIRA_PROJECT_KEY` from env

---

## Phase 1: Epic Creation

`[Mode: CreateEpic]`

1. **Read** `plans/$SCOPE/$SCOPE.md` frontmatter:
   - Extract feature name (from title or content)
   - Extract existing `jira_epic` (if any)
   - Extract `jira_project` (or use fallback)

2. **Check if epic exists**:
   ```
   GET /search?jql=project=${JIRA_PROJECT}+AND+summary~"${FEATURE_NAME}"+AND+issuetype=Epic
   ```
   - If exists: Use existing epic key
   - If not: Create new epic

3. **Create epic** (issue type ID: `10005`):
   ```bash
   jira_api_call POST '/issue' '{
     "fields": {
       "project": { "key": "${JIRA_PROJECT}" },
       "summary": "${FEATURE_NAME}",
       "description": {
         "type": "doc",
         "version": 1,
         "content": [{
           "type": "paragraph",
           "content": [{
             "type": "text",
             "text": "Created from bootstrap roadmap. See: plans/${SCOPE}/"
           }]
         }]
       },
       "issuetype": { "id": "10005" }
     }
   }'
   ```

4. **Update** `plans/$SCOPE/$SCOPE.md`:
   - Set `jira_epic: {NEW_EPIC_KEY}` in frontmatter
   - Ensure `jira_project: {JIRA_PROJECT}` is set

---

## Phase 2: Task + Subtask Creation

`[Mode: CreateTasks]`

For each task file in `plans/$SCOPE/tasks/*.md`:

1. **Read** task file:
   - Extract summary from title line (after `# Task:`)
   - Extract `jira_key` from frontmatter (if already exists)
   - Extract checkboxes for subtasks (`- [ ]` items in Validation Checklist)

2. **Check if task exists**:
   ```
   GET /search?jql=project=${JIRA_PROJECT}+AND+summary~"${TASK_SUMMARY}"+AND+parent.key=${EPIC_KEY}
   ```
   - If exists: Use existing task key
   - If not: Create new task linked to Epic

3. **Create task** (issue type ID: `10007`, parent: Epic):
   ```bash
   jira_api_call POST '/issue' '{
     "fields": {
       "project": { "key": "${JIRA_PROJECT}" },
       "summary": "${TASK_SUMMARY}",
       "description": {
         "type": "doc",
         "version": 1,
         "content": [{
           "type": "paragraph",
           "content": [{
             "type": "text",
             "text": "See: plans/${SCOPE}/tasks/${TASK_FILE}"
           }]
         }]
       },
       "issuetype": { "id": "10007" },
       "parent": { "key": "${EPIC_KEY}" }
     }
   }'
   ```

4. **Create Subtasks** (from checkbox list):
   For each `- [ ]` subtask in the task file:

   ```bash
   jira_api_call POST '/issue' '{
     "fields": {
       "project": { "key": "${JIRA_PROJECT}" },
       "summary": "${SUBTASK_NAME}",
       "description": {
         "type": "doc",
         "version": 1,
         "content": [{
           "type": "paragraph",
           "content": [{
             "type": "text",
             "text": "Subtask from checklist"
           }]
         }]
       },
       "issuetype": { "id": "10006" },
       "parent": { "key": "${TASK_KEY}" }
     }
   }'
   ```

5. **Update** task file frontmatter:
   - Set `jira_key: {TASK_KEY}` and `jira_url: https://{JIRA_DOMAIN}/browse/{TASK_KEY}`

---

## Phase 3: Sync Checkboxes

`[Mode: SyncStatus]`

1. **Read** `plans/$SCOPE/tasks/*.md` for checkbox states
2. **Update** corresponding JIRA issues:
   - If `- [x]` found → Skip (completed locally)
   - If `- [ ]` found → Already created as subtask in Phase 2

3. Report sync status

---

## Phase 4: Output

`[Mode: Report]`

```
## JIRA Push Complete: $SCOPE

### Structure Created
{EPIC_KEY} (Epic)
├── {TASK_1_KEY} (Task)
│   ├── {SUBTASK_1_KEY} Subtask: {subtask_name}
│   ├── {SUBTASK_2_KEY} Subtask: {subtask_name}
├── {TASK_2_KEY} (Task)
└── ...

### JIRA Links
- Epic: https://{JIRA_DOMAIN}/browse/{EPIC_KEY}
- Task 1: https://{JIRA_DOMAIN}/browse/{TASK_1_KEY}
- Task 2: https://{JIRA_DOMAIN}/browse/{TASK_2_KEY}

### Updated Files
- plans/$SCOPE/$SCOPE.md (jira_epic: {EPIC_KEY})
- plans/$SCOPE/tasks/*.md (jira_key, jira_url)
```

---

## Usage

```bash
/jira-push test_portofoll     # Push test_portofoll roadmap to JIRA
/jira-push portfolio       # Push portfolio roadmap to JIRA
/jira-push billing        # Push billing roadmap to JIRA
```

**Prerequisites**:
1. JIRA credentials in `.opencode/scripts/jira-sync/jira-config.env`
2. Project key configured (default: `PROJ`)
3. Roadmap already generated via `/bootstrap`

---

## JIRA Issue Type IDs

| Issue Type | ID | Description |
|-----------|-----|------------|
| Epic | `10005` | Parent container for features |
| Task | `10007` | Work item under Epic |
| Subtask | `10006` | Child of Task |
| Story | `10008` | Agile story (not used) |
| Feature | `10009` | Feature item (not used) |

---

## Related Commands

- `/bootstrap "project vision"` - Generate roadmap first
- `/routine $SCOPE task-name` - Execute tasks
- `/push $SCOPE task-name` - Push commits to remote