# JIRA Sync Integration for CheatScale

This integration connects your CheatScale roadmap directly to Atlassian JIRA, allowing bidirectional sync between JIRA epics/tasks and your roadmap hierarchy.

## Quick Start

### 1. Configure Credentials

```bash
# Copy the example config
cp jira-config.env.example jira-config.env

# Edit with your JIRA details
# - JIRA_DOMAIN: your-company.atlassian.net
# - JIRA_EMAIL: your-email@company.com
# - JIRA_API_TOKEN: Generate from https://id.atlassian.com/manage-profile/security/api-tokens
# - JIRA_PROJECT_KEY: Your JIRA project key (e.g., PROJ, ENG)
```

### 2. Test Connection

```bash
cd .opencode/scripts/jira-sync
./jira-sync.sh ping
```

Expected output:
```
[INFO] Testing JIRA connection to your-company.atlassian.net...
✓ Connected as: Your Name
```

### 3. Pull an Epic to Roadmap

```bash
# Basic pull
./jira-sync.sh pull PROJ-123

# With custom scope name
./jira-sync.sh pull PROJ-123 my-feature
```

This creates:
```
plans/my-feature/
├── roadmap.md      # Main roadmap with JIRA metadata
└── days/
    ├── day-1.md
    └── day-2.md
```

## Usage

### Commands

| Command | Description |
|---------|-------------|
| `./jira-sync.sh pull <epic-key> [scope]` | Pull JIRA epic to roadmap |
| `./jira-sync.sh push [scope]` | Push roadmap progress to JIRA |
| `./jira-sync.sh sync [scope]` | Bidirectional sync |
| `./jira-sync.sh ping` | Test JIRA connection |
| `./jira-sync.sh list` | List available epics |
| `./jira-sync.sh interactive` | Interactive epic picker |

### Integration with Bootstrap

Update your `/bootstrap` command to accept JIRA epics:

```bash
# In your bootstrap command or alias
if [[ "$1" == "--jira" ]]; then
    epic="$2"
    scope="${3:-$(echo $epic | cut -d'-' -f2)}"
    .opencode/scripts/jira-sync/jira-sync.sh pull "$epic" "$scope"
fi
```

## JIRA Field Mapping

The scripts use placeholders for custom fields. Update these in `jira-config.env`:

| Field | Environment Variable | Description |
|-------|---------------------|-------------|
| Epic Name | `JIRA_EPIC_FIELD` | Custom field for Epic Name |
| Story Points | `JIRA_STORY_POINTS_FIELD` | Custom field for story points |
| Sprint | `JIRA_SPRINT_FIELD` | Custom field for Sprint assignment |

### Default Field Mappings

The scripts use these defaults if not overridden:

- **Epic Name**: `customfield_10001`
- **Story Points**: `customfield_10002`
- **Sprint**: `customfield_10003`

> **Note**: Check your JIRA instance for correct field IDs. Go to **JIRA Settings > Issues > Custom Fields** to find field IDs.

## Security

### Credential Storage

- Store credentials in `jira-config.env`
- Add `jira-config.env` to `.gitignore` (already done in this repo)
- Never commit credentials to version control

### Environment Variables Alternative

Instead of config file, use environment variables:

```bash
export JIRA_DOMAIN="your-company.atlassian.net"
export JIRA_EMAIL="your-email@company.com"
export JIRA_API_TOKEN="your-api-token"
export JIRA_PROJECT_KEY="PROJ"
```

Then run without config:
```bash
JIRA_CONFIG_ENABLED=0 ./jira-sync.sh pull PROJ-123
```

## Roadmap Format

When pulling from JIRA, the script generates:

```markdown
---
tags: [roadmap, my-feature, jira]
scope: my-feature
jira_epic: PROJ-123
jira_status: In Progress
---
# Roadmap: my-feature
## Project Brief

- **JIRA Epic**: PROJ-123
- **Status**: In Progress
- **Goal**: Implement feature X
- **Tasks**: 25

## Roadmap

### Phase 1 ��� Implementation

**Day 1**
- [ ] PROJ-124
- [ ] PROJ-125
...

## Progress Tracking

| Day | Tasks | Status |
|-----|-------|--------|
| Day 1 | 10 | Pending |
| Day 2 | 8 | Pending |
...
```

## Troubleshooting

### Connection Errors

| Error | Solution |
|-------|----------|
| `401 Unauthorized` | Check API token is valid |
| `403 Forbidden` | Check email has JIRA access |
| ` ETIMEDOUT` | Check JIRA_DOMAIN is correct |

### Sync Errors

| Error | Solution |
|-------|----------|
| `No JIRA epic found` | Add `jira_epic: PROJ-123` to frontmatter |
| `Epic not found` | Verify epic key exists in project |

## Roadmap Fields Placeholders

Update these placeholders in `jira-config.env` when ready:

```bash
# JIRA Custom Field IDs - Update from your JIRA instance
JIRA_EPIC_FIELD="customfield_10001"        # Epic Name field
JIRA_STORY_POINTS_FIELD="customfield_10002" # Story Points field
JIRA_SPRINT_FIELD="customfield_10003"    # Sprint field
JIRA_THEME_FIELD="customfield_10004"       # Theme/Rationale field
JIRA_BUSINESS_VALUE_FIELD="customfield_10005" # Business Value field
JIRA_DEPENDS_FIELD="customfield_10006"    # Dependencies field
JIRA_BLOCKED_BY_FIELD="customfield_10007"  # Blocked By field
```

## Future Enhancements

Planned features:

- [ ] Two-way task status sync
- [ ] Subtask hierarchy mapping
- [ ] Comment sync
- [ ] Attachment handling
- [ ] Webhook integration for real-time updates
- [ ] Multiple JIRA project support