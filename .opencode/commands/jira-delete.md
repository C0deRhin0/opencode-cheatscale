---
description: Delete JIRA epic, tasks, and subtasks from a roadmap feature. Use when removing a feature from the roadmap.
agent: orchestrator
---

# JIRA Delete: Remove Feature from JIRA

Delete JIRA epic and all its child issues (tasks + subtasks) from a roadmap feature.

---

## Core Protocol

- **Destructive**: This deletes issues permanently from JIRA
- **Cascade**: Deleting the epic deletes all children (tasks, subtasks)
- **Validation**: Confirm before deleting

---

## Phase 0: Validation

`[Mode: Check]`

1. Identify scope from argument: `$SCOPE` (e.g., `portfolio`, `billing`)
2. Verify roadmap exists:
   - `plans/$SCOPE/$SCOPE.md` must exist
3. Read frontmatter:
   - Extract `jira_epic` key
   - Extract `jira_project` (for flexible project support)

---

## Phase 1: Confirm Deletion

`[Mode: Confirm]`

Show user what will be deleted and confirm:
- Epic: `{EPIC_KEY}` - {feature name}
- Project: `{JIRA_PROJECT}` (from $SCOPE.md, fallback to env)
- All child issues will be deleted

Use `question` tool:
> "Delete JIRA epic `{EPIC_KEY}` and all its tasks/subtasks? This cannot be undone. (yes/no)"

If NO → Stop and exit.

---

## Phase 2: Find All Child Issues

`[Mode: Query]`

Query JIRA for all issues under the epic:
```
GET /search?jql=parent={EPIC_KEY}+OR+parentEpics={EPIC_KEY}&maxResults=100
```

Collect all issue keys (epic + tasks + subtasks).

---

## Phase 3: Delete Issues

`[Mode: Delete]`

For each issue (reverse order - subtasks first, then tasks, then epic):
```
DELETE /issue/{ISSUE_KEY}
```

Track:
- Deleted count
- Any errors (e.g., permission denied)

---

## Phase 4: Update Local Files

`[Mode: Cleanup]`

After successful deletion:
1. Remove `jira_epic` from `plans/$SCOPE/$SCOPE.md` frontmatter
2. Remove `jira_key` and `jira_url` from all `plans/$SCOPE/tasks/*.md` files

---

## Phase 5: Report

`[Mode: Report]`

```
## JIRA Delete Complete: $SCOPE

### Deleted
- Epic: {EPIC_KEY}
- Tasks: {n} tasks deleted
- Subtasks: {n} subtasks deleted
- Total: {total} issues

### Updated Files
- plans/$SCOPE/$SCOPE.md (removed jira_epic)
- plans/$SCOPE/tasks/*.md (removed jira keys)

### JIRA Status
{All deleted successfully OR Some errors occurred}
```

---

## Usage

```bash
/jira-delete portfolio     # Delete portfolio epic from JIRA
/jira-delete billing      # Delete billing epic from JIRA
```

**Prerequisites**:
1. JIRA credentials in `.opencode/scripts/jira-sync/jira-config.env`
2. Roadmap already created via `/bootstrap`
3. Epic exists in JIRA

---

## Flexible Project Support

This command reads `jira_project` from `$SCOPE.md` frontmatter:
- If `jira_project: BILL` exists → deletes from BILL project
- If not found → uses `JIRA_PROJECT_KEY` from env as fallback

---

## Related Commands

- `/bootstrap "project vision"` - Generate roadmap first
- `/jira-push $SCOPE` - Create JIRA issues from roadmap
- `/routine $SCOPE task-name` - Execute tasks