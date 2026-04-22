---
description: Adversarial review and validation of roadmap using wave-based quality gates.
agent: orchestrator
---

# Validate Roadmap: Quality Assurance Pipeline

Verify, validate, and review roadmap using parallel quality agents. Uses wave-based orchestration for comprehensive validation.

---

## Core Principles

- **Adversarial Review**: Challenge assumptions, find gaps, stress-test plans
- **Wave-Based Quality**: Parallel review from multiple perspectives
- **No Silent Edits**: Report findings; user decides on fixes
- **Single Source**: Read from `plans/$SCOPE/` - Obsidian sees via project root

---

## Input

**Scope to Validate:** $ARGUMENTS

Format: `/validate-roadmap $SCOPE`

---

## Phase 0: Scan & Route (MANDATORY FIRST)

`[Mode: Scan]`

1. **Parse Scope**: Extract `$SCOPE` from `$ARGUMENTS`
2. **Verify Files Exist**:
   - `plans/$SCOPE/$SCOPE.md` (Feature overview, new structure)
   - `plans/$SCOPE/tasks/*.md` (Task files, new structure)
   - `plans/$SCOPE/coding_convention.md`
   - `plans/$SCOPE/INSTRUCTIONS.md`

   **Note**: Legacy `roadmap.md` and `days/` are still supported for backward compatibility.

3. **Classify Validation Type**:
   | Type | Criteria |
   |------|----------|
   | **Quick** | Single phase, known scope |
   | **Standard** | Full roadmap, standard review |
   | **Deep** | Complex project, multiple domains |

4. **User Constraints** (via `question` tool):
   - Timeline: ASAP / Standard / Relaxed
   - Team Size: Solo / Small / Large
   - Focus: Speed / Scalability / Balanced
   - Tech Confidence: Confident / Unsure / Need Validation

5. **MANDATORY STOP**: Wait for answers before Wave 1

---

## Wave 1: Structural Validation (Parallel)

`[Mode: Verify]`

**Parallel Execution**:

### Format Validation — `@critic`
```
Read: plans/$SCOPE/$SCOPE.md, plans/$SCOPE/tasks/*.md

Verify (Feature structure):
1. $SCOPE.md has required frontmatter (scope, feature, jira_epic)
2. $SCOPE.md has Tasks section with at least 1 task
3. Each task file has Subtasks section with checkboxes
4. All subtasks are future tense, atomic (15 min or less)
5. No past-tense language ("already implemented", "was configured")

Verify Implementation Plan:
5. ## Implementation Plan section exists
6. ### Key Files table populated with valid paths
7. ### Risks and Mitigations table populated
8. ### Security Checklist complete
9. ### Accessibility Checklist complete
10. ### Implementation Steps have risk ratings

Verify JIRA Mapping (optional):
6. jira_epic field present for JIRA integration
7. Task names map to JIRA issue keys

Output: Formatting violations list with severity
```

### Content Validation — `@code-reviewer`
```
Read: plans/$SCOPE/$SCOPE.md, plans/$SCOPE/tasks/*.md

IMPORTANT: You are validating ROADMAP STRUCTURE, not code. Do NOT useqa-engineer checklist.

Verify:
1. Tasks in $SCOPE.md map to the scope overview goals
2. Task files exist in plans/$SCOPE/tasks/ directory
3. Each task file has ## Validation Checklist section with checkboxes (- [ ])
4. Subtasks are atomic (15 min or less)
5. No orphaned checkboxes (all should have parent task)

Output: Content gaps found with specific file paths
```

**Wait for BOTH responses**

---

## Wave 2: Adversarial Review (Parallel)

`[Mode: Review]`

**Parallel Execution**:

### Feasibility Review — `@critic`
```
Analyze: plans/$SCOPE/$SCOPE.md against user constraints
Context: Timeline, Team Size, Focus from Phase 0

Challenge:
- Is scope realistic?
- Are subtasks ordered correctly?
- What happens if key developer is unavailable?

Output: Critical risk items with severity ratings
```

### Technical Review — `@architect`
```
Analyze: plans/$SCOPE/$SCOPE.md, plans/$SCOPE/tasks/*.md against plans/$SCOPE/coding_convention.md

Challenge:
- Does implementation approach match tech stack?
- Are there architectural anti-patterns?
- Is 3-tier architecture respected?
- Are there performance risks?

Output: Technical concerns list
```

**Wait for BOTH responses**

---

## Phase: Synthesis & Report

`[Mode: Report]`

**Orchestrator Tasks**:

1. **Aggregate Findings** from all waves:
   - Structural violations (Wave 1)
   - Content gaps (Wave 1)
   - Feasibility risks (Wave 2)
   - Technical concerns (Wave 2)

2. **Generate Validation Report**:
   ```markdown
   ---
   tags: [validation, $SCOPE]
   scope: $SCOPE
   type: validation
   ---

   # Validate Roadmap: $SCOPE

   ## Executive Summary
   Validation performed on: **$SCOPE**
   - Validation Type: **$TYPE**
   - Files Verified: **$COUNT** files

   ---

   ## Issues Found

   ### Critical Issues (Must Fix)
   $ISSUES_TABLE

   ### High Priority Issues
   $ISSUES_TABLE

   ### Medium/Low Issues
   $ISSUES_TABLE

   ---

   ## Risk Assessment
   | Risk | Severity | Mitigation |
   |------|----------|------------|
   | $RISK | $SEVERITY | $MITIGATION |

   ---

   ## Verdict
   - [ ] **APPROVE** - Roadmap ready for execution
   - [ ] **CONDITIONAL** - Fix critical issues before execution
   - [ ] **REJECT** - Requires significant rework
   ```

3. **Present to User** - Format output using markdown tables and emojis for readability:
   - Run `/inject` to fix specific issues
   - Run `/bootstrap` for complete rebuild
   - Manual edits

---

## Completion Checklist

- [ ] Structural validation complete
- [ ] Content validation complete  
- [ ] Adversarial review complete
- [ ] Report presented to user

**Output**:
```
## Validate Complete [$SCOPE]

Validation Type: [Quick/Standard/Deep]
Issues Found: [count by severity]
Verdict: [APPROVE/CONDITIONAL/REJECT]
```

---

## Usage

```bash
/validate-roadmap core        # Validate core roadmap
/validate-roadmap billing    # Validate billing roadmap
/validate-roadmap auth       # Validate auth roadmap
```