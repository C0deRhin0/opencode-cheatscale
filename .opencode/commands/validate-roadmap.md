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
   - `plans/$SCOPE/roadmap.md`
   - `plans/$SCOPE/idea_research.md`
   - `plans/$SCOPE/coding_convention.md`
   - `plans/$SCOPE/INSTRUCTIONS.md`

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
Read: plans/$SCOPE/roadmap.md

Verify:
1. Roadmap starts at Phase 0 or Phase 1
2. Each Phase has at least 2 Day entries (no single-Day phases)
3. All tasks are future tense, atomic (15 min or less)
4. No past-tense language ("already implemented", "was configured")

Verify Implementation Plan:
5. ## Implementation Plan section exists
6. ### Key Files table populated with valid paths
7. ### Risks and Mitigations table populated
8. ### Security Checklist complete
9. ### Accessibility Checklist complete
10. ### Implementation Steps have risk ratings

Output: Formatting violations list with severity
```

### Content Validation — `@qa-engineer`
```
Read: plans/$SCOPE/roadmap.md, plans/$SCOPE/idea_research.md

Verify:
1. Tasks map to goal in idea_research.md
2. Dependencies are logically ordered
3. No orphaned tasks (tasks with no predecessor in later phases)
4. Phase deliverables are verifiable
5. Implementation steps have clear ownership

Output: Content gaps list
```

**Wait for BOTH responses**

---

## Wave 2: Adversarial Review (Parallel)

`[Mode: Review]`

**Parallel Execution**:

### Feasibility Review — `@critic`
```
Analyze: plans/$SCOPE/roadmap.md against user constraints
Context: Timeline, Team Size, Focus from Phase 0

Challenge:
- Are timeline estimates realistic?
- Is scope creep happening?
- Are dependencies ordered correctly?
- Are there single points of failure?
- What happens if key developer is unavailable?

Output: Critical risk items with severity ratings
```

### Technical Review — `@architect`
```
Analyze: plans/$SCOPE/roadmap.md against plans/$SCOPE/coding_convention.md

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
   ## Validate Roadmap: [$SCOPE]
   
   ### Summary
   - Validation Type: [Quick/Standard/Deep]
   - Files Verified: [list]
   
   ### Structural Issues [CRITICAL/HIGH/MEDIUM]
   | Issue | Location | Severity |
   |-------|----------|----------|
   
   ### Content Gaps
   | Gap | Impact | Recommendation |
   |-----|--------|----------------|
   
   ### Risk Assessment
   | Risk | Severity | Mitigation |
   |------|----------|------------|
   
   ### Technical Concerns
   | Concern | Resolution |
   |----------|------------|
   
   ### Verdict
   - [ ] APPROVE - Roadmap ready for execution
   - [ ] CONDITIONAL - Fix critical issues before execution
   - [ ] REJECT - Requires significant rework
   ```

3. **Present to User** - Do NOT silently edit. Let user decide:
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