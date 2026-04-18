---
scope: {SCOPE}
feature: {FEATURE_NAME}
jira_epic: {EPIC_KEY}
jira_status: {status}
created: {DATE}
tags: [feature, {SCOPE}]
---
# Feature: {FEATURE_NAME}

## Overview

| Field | Value |
|-------|-------|
| **Scope** | {SCOPE} |
| **JIRA Epic** | {EPIC_KEY} |
| **Status** | {status} |
| **Created** | {DATE} |

## Problem Statement

<!-- What problem does this feature solve? -->

## Success Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Tasks

### Task: {TASK_NAME}

**Type**: story
**Priority**: high
**Estimate**: {points} SP

**Description**:
<!-- What this task delivers -->

**Acceptance Criteria**:
- [ ] AC 1
- [ ] AC 2

- [ ] Subtask: {SUBTASK_NAME}
- [ ] Subtask: {SUBTASK_NAME}
- [ ] Subtask: {SUBTASK_NAME}

---

### Task: {TASK_NAME_2}

**Type**: task
**Priority**: medium
**Estimate**: {points} SP

**Description**:

- [ ] Subtask: {SUBTASK_NAME}
- [ ] Subtask: {SUBTASK_NAME}

## Progress

| Task | Subtasks | Status |
|------|---------|--------|
| {TASK_1} | 3/3 | Done |
| {TASK_2} | 1/2 | In Progress |
| {TASK_3} | 0/2 | Todo |

---

*Generated via CheatScale Bootstrap*
*Feature > Task > Subtask structure*
*JIRA Mapped: {EPIC_KEY}*