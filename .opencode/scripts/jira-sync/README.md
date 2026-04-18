# JIRA Sync Integration for CheatScale

Bidirectional sync between JIRA epics/tasks and the CheatScale Feature > Task > Subtask structure.

## Quick Start

### 1. Configure Credentials

```bash
cp jira-config.env.example jira-config.env
# Edit with your JIRA details:
# - JIRA_DOMAIN: your-company.atlassian.net
# - JIRA_EMAIL: your-email@company.com
# - JIRA_API_TOKEN: Generate from https://id.atlassian.com/manage-profile/security/api-tokens
# - JIRA_PROJECT_KEY: Your JIRA project key (e.g., PROJ)
```

### 2. Test Connection

```bash
cd .opencode/scripts/jira-sync
./jira-sync.sh ping
```

### 3. Pull an Epic to Feature Structure

```bash
./jira-sync.sh pull PROJ-123 my-feature
```

Creates:
```
plans/my-feature/
├── feature.md          # Feature overview (JIRA Epic = Feature)
└── tasks/
    ├── proj-124.md     # Task file (JIRA Task = Task)
    └── proj-125.md     # Each contains subtask checkboxes
```

## JIRA Mapping (1:1)

| CheatScale | JIRA |
|-----------|------|
| Feature   | Epic |
| Task      | Task / Story / Bug |
| Subtask   | Subtask |

## Commands

| Command | Description |
|---------|-------------|
| `./jira-sync.sh pull <epic-key> [scope]` | Pull JIRA epic to Feature > Task > Subtask |
| `./jira-sync.sh push [scope]` | Push feature progress to JIRA |
| `./jira-sync.sh ping` | Test JIRA connection |
| `./jira-sync.sh list` | List available epics |
| `./jira-sync.sh issues` | List all issues |
| `./jira-sync.sh issues-detailed` | List issues with summary |

## Feature File Structure

When pulling from JIRA, the script generates:

```markdown
---
scope: my-feature
feature: my-feature
jira_epic: PROJ-123
jira_status: In Progress
created: 2026-04-18
tags: [feature, my-feature]
---
# Feature: my-feature

## Tasks

### Task: PROJ-124
- [Link to tasks/proj-124.md]
- Type: task
```

### Task File Structure

```markdown
---
tags: [task, my-feature]
scope: my-feature
parent: "[[feature]]"
jira_key: PROJ-124
---
# Task: PROJ-124

## Subtasks
- [ ] Subtask 1
- [ ] Subtask 2
```

## Obsidian Integration

All generated files include frontmatter for Obsidian graph linking:
- `feature.md` has `tags: [feature, $SCOPE]`
- `tasks/*.md` has `tags: [task, $SCOPE]` and `parent: "[[feature]]"`

Configure Obsidian vault to project root or `plans/` to see all files in graph view.

## Security

- Store credentials in `jira-config.env`
- Add `jira-config.env` to `.gitignore`
- Never commit credentials to version control

### Environment Variables Alternative

```bash
export JIRA_DOMAIN="your-company.atlassian.net"
export JIRA_EMAIL="your-email@company.com"
export JIRA_API_TOKEN="your-api-token"
export JIRA_PROJECT_KEY="PROJ"
```

## JIRA Field Mapping

Update custom field IDs in `jira-config.env`:

```bash
JIRA_EPIC_FIELD="customfield_10001"
JIRA_STORY_POINTS_FIELD="customfield_10002"
JIRA_SPRINT_FIELD="customfield_10003"
```

## Troubleshooting

| Error | Solution |
|-------|----------|
| `401 Unauthorized` | Check API token is valid |
| `403 Forbidden` | Check email has JIRA access |
| `ETIMEDOUT` | Check JIRA_DOMAIN is correct |
| `No JIRA epic found` | Add `jira_epic: PROJ-123` to feature.md frontmatter |
| `Feature file not found` | Run `/bootstrap` or `./jira-sync.sh pull` first |