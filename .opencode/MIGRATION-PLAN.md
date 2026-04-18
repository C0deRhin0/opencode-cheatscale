# CheatScale Roadmap Structure Migration Plan

## Executive Summary

**Current State**: Phase > Day > Task (time-based)
**Target State**: Feature > Task > Subtask (work-based)
**Rationale**: Enable 1:1 mapping with JIRA hierarchy (Epic > Task > Subtask)

---

## Old vs New Mapping

```
OLD (Time-Based)                    NEW (Work-Based)
─────────────────────────────────────────────────────────────────
Phase 1 — Implementation     →      Feature: user-auth
  Day 1                    →        Task: login-flow
    - [ ] Task 1           →          - [ ] Subtask: build-login-ui
    - [ ] Task 2           →          - [ ] Subtask: create-login-api
  Day 2                    →        Task: password-reset
    - [ ] Task 3           →          - [ ] Subtask: email-service

Phase 2 — Testing          →        Feature: user-auth (phase)
  Day 3                    →        Task: integration-tests
    - [ ] Task 4           →          - [ ] Subtask: auth-tests

─────────────────────────────────────────────────────────────────
JIRA SPACE (Reference)
─────────────────────────────────────────────────────────────────
Epic: User Authentication
  Task: Login Flow
    Subtask: Build Login UI
    Subtask: Create Login API
  Task: Password Reset
    Subtask: Email Service
  Task: Integration Tests
    Subtask: Auth Tests
```

---

## Command Syntax Changes

| Command | Old Syntax | New Syntax | Example |
|---------|-----------|-----------|---------|
| `/routine` | `scope P1D1` | `scope task-id` | `/routine auth login-flow` |
| `/commit` | `[scope:P1D1]` | `[scope#task-id]` | `[auth#login-flow]` |
| `/push` | `scope P1D1` | `scope task-id` | `/push auth login-flow` |
| `/inject` | `scope add feature in Phase1` | `scope add subtask to login-flow` | `/inject auth add forgot-password to login-flow` |
| `/sitrep` | P1D2 status | login-flow status | `login-flow: 2/5 subtasks` |

---

## Affected Components

### 1. Command Files (9 files)

| File | Change Type | Priority |
|------|------------|----------|
| `commands/routine.md` | Parse new task-id format | P0-Critical |
| `commands/commit.md` | Tag format [scope#task-id] | P0-Critical |
| `commands/push.md` | Parse task-id, not PnDm | P0-Critical |
| `commands/sitrep.md` | Show Feature > Task status | P1-High |
| `commands/inject.md` | Add to Feature path | P1-High |
| `commands/validate-roadmap.md` | Validate Feature > Task | P1-High |
| `commands/bootstrap.md` | Generate Feature > Task template | P0-Critical |
| `commands/plan.md` | Plan Feature breakdown | P2-Medium |
| `commands/execute.md` | Phase → Feature mapping | P2-Medium |

### 2. Template Files

| File | Change Type | Priority |
|------|------------|----------|
| `templates/roadmap.md` | Feature > Task > Subtask | P0-Critical |
| `templates/phase.md` | Delete (obsolete) | P3-Low |
| `templates/day.md` | Delete (obsolete) | P3-Low |

### 3. JIRA Sync Scripts

| File | Change Type | Priority |
|------|------------|----------|
| `jira-sync/jira-sync.sh` | Map Feature=Epic, Task=Task | P0-Critical |
| `jira-sync/jira-push.sh` | Push to JIRA hierarchy | P1-High |

### 4. Documentation Files

| File | Change Type | Priority |
|------|------------|----------|
| `README.md` | Update command examples | P1-High |
| `ROADMAP.md` | New roadmap structure | P1-High |
| `MIGRATION.md` | Migration guide | P1-High |

---

## Detailed Implementation Plan

### Phase 1: Core Template Changes

#### 1.1 Update Bootstrap Template
```
Location: commands/bootstrap.md

OLD:
```
### Phase N — [Name]
**Day M**
- [ ] Subtask description
```

NEW:
```
### Feature: [name]
#### Task: [name]
- [ ] Subtask description
```

#### 1.2 Create New Roadmap Template
```
File: templates/roadmap.md (new structure)
```
---
scope: {scope}
feature: {feature-name}
parent_epic: {jira-epic}
---
# Feature: {feature-name}

## Overview
- **JIRA Epic**: {EPIC-XXX}
- **Status**: {status}
- **Deliverable**: {description}

## Tasks

### Task: {task-name}
**Type**: {story/bug/task}
**Assignee**: {assignee}

- [ ] {subtask-name}
- [ ] {subtask-name}

### Task: {task-name-2}
...
```

---

### Phase 2: Command Logic Changes

#### 2.1 /routine Command

**Current Parse Logic:**
```
$ARGUMENTS = "auth P1D1"
- SCOPE = "auth"
- PHASE = "1"
- DAY = "1"
- Full ID = "P1D1"
```

**New Parse Logic:**
```
$ARGUMENTS = "auth login-flow"
- SCOPE = "auth"
- TASK = "login-flow"
- Full ID = "login-flow"
```

**Files to Update:**
- `commands/routine.md` lines 107-201
- Parser function needs to accept both formats for backward compatibility

#### 2.2 /commit Command

**Current Tag Format:**
```
[auth:P1D1] Implement login UI
```

**New Tag Format:**
```
[auth#login-flow] Implement login UI
```

**Parse Changes:**
- Old: `\[$SCOPE:PnDm\]`
- New: `\[$SCOPE#$task-id\]`

#### 2.3 /push Command

**Current Logic:**
```
# Find commits for phase/day
git log --grep="\[$SCOPE:PnDm\]"
```

**New Logic:**
```
# Find commits for feature/task
git log --grep="\[$SCOPE#$task-id\]"
```

---

### Phase 3: JIRA Integration

#### 3.1 Pull Mapping (JIRA → CheatScale)

| JIRA | CheatScale | Script Field |
|------|-----------|-------------|
| Epic | Feature | `feature: {epic-name}` |
| Task | Task | `### Task: {task-name}` |
| Subtask | Task checkbox | `- [ ] {subtask-name}` |

#### 3.2 Push Mapping (CheatScale → JIRA)

| CheatScale | JIRA | Action |
|----------|------|--------|
| Feature: {name} | Epic | Create/Update Epic |
| Task: {name} | Task | Link to Epic |
| - [x] {subtask} | Subtask | Mark Done |

---

### Phase 4: Documentation Updates

#### 4.1 Update README.md
- Command reference table
- New syntax examples
- JIRA mapping section

#### 4.2 Create ROADMAP.md
- New structure explanation
- Work-based vs Time-based rationale

---

## Backward Compatibility Strategy

### Dual Parser Implementation

To avoid breaking existing roadmaps, implement dual parsing:

```
parse_task_id() {
    local input="$1"

    # OLD FORMAT: P1D1, P2D3
    if [[ "$input" =~ ^P[0-9]+D[0-9]+$ ]]; then
        echo "OLD:$input"
        return 0
    fi

    # NEW FORMAT: login-flow, user-auth
    if [[ "$input" =~ ^[a-z][a-z0-9-]+$ ]]; then
        echo "NEW:$input"
        return 0
    fi

    return 1
}
```

This allows:
- `/routine auth P1D1` → Still works (deprecated warning)
- `/routine auth login-flow` → New format

---

## Migration Steps

### Step 1: Update Templates (Immediate)
- [ ] Create `templates/roadmap.md` (new structure)
- [ ] Update `commands/bootstrap.md` output

### Step 2: Update Parser Functions (Immediate)
- [ ] Add dual parser to common functions
- [ ] Support both PnDm and task-id formats

### Phase 3: Update Commands (Week 1)
- [ ] `/routine` - Full update
- [ ] `/commit` - Tag format update
- [ ] `/push` - Search pattern update

### Phase 4: Update Commands (Week 2)
- [ ] `/sitrep` - Status display
- [ ] `/inject` - New feature path
- [ ] `/validate-roadmap` - Validation rules

### Phase 5: JIRA Integration (Week 3)
- [ ] Update `jira-sync.sh` mapping
- [ ] Test bidirectional sync

### Phase 6: Documentation (Week 4)
- [ ] Update README
- [ ] Create migration guide
- [ ] Archive old templates

---

## Files Summary

### Files Requiring Changes (Total: 18)

#### Critical (P0) - 5 files
1. `commands/bootstrap.md`
2. `commands/routine.md`
3. `commands/commit.md`
4. `commands/push.md`
5. `templates/roadmap.md` (create)

#### High (P1) - 6 files
6. `commands/sitrep.md`
7. `commands/inject.md`
8. `commands/validate-roadmap.md`
9. `jira-sync/jira-sync.sh`
10. `README.md`
11. `ROADMAP.md` (create)

#### Medium (P2) - 4 files
12. `commands/plan.md`
13. `commands/execute.md`
14. `templates/phase.md` (delete)
15. `templates/day.md` (delete)

#### Documentation (P3) - 3 files
16. `MIGRATION.md`
17. `CHEATSHEET.md` (update)
18. `opencode.json` (if needed)

---

## Key Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing roadmaps | High | Dual parser for backward compatibility |
| Command ambiguity | Medium | Clear error messages suggesting fix |
| JIRA sync breakage | Medium | Test with both formats |
| Context loss | Low | Document both structures |

---

## Success Criteria

- [ ] `/routine` accepts both `P1D1` and `login-flow` formats
- [ ] `/commit` creates `[scope#task]` tags
- [ ] Roadmap template generates Feature > Task > Subtask
- [ ] JIRA sync maps 1:1 with Epic > Task > Subtask
- [ ] No existing roadmaps broken (backward compatible)
- [ ] Documentation updated with new syntax