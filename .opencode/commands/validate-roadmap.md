---
description: VERIFY, VALIDATE, REVIEW, and SCOPE a specific roadmap.md
agent: orchestrator
---

# Validate Roadmap: Adversarial Review Pipeline

Your sole purpose is to act as the MoE Router and orchestrate an adversarial project manager review. You will delegate the review of `plans/$SCOPE/roadmap.md` to the `@critic`.
You must use your tool capabilities to execute this review sequentially.

---

## GLOBAL OUTPUT RULE: NO EMOJIS
You are STRICTLY FORBIDDEN from using emojis in any generated updates or messages. All output must be plain professional text.

---

## Phase 1: Pre-Flight Scoping (MANDATORY STOP)

 `[Mode: Scoping]`

1. Parse `$ARGUMENTS` to identify the **Scope**.
   - If missing, default to `core`.
   - Targeted path: `plans/$SCOPE/roadmap.md`.

2. Use the `question` tool to gather user constraints. Present these questions in a single call:
   - **Timeline**: "What's your target timeline?"
     - Options: ["ASAP (aggressive)", "Standard (2-4 weeks)", "Relaxed (1+ months)"]
   - **Team Size**: "How many developers are working on this?"
     - Options: ["Solo (1 developer)", "Small team (2-5)", "Large team (6+)"]
   - **Priority**: "What's the primary focus?"
     - Options: ["Speed to Market (MVP first)", "Scalability (enterprise grade)", "Balanced"]
   - **Tech Confidence**: "How confident are you in the current tech stack?"
     - Options: ["Very confident (stick with it)", "Somewhat unsure (open to changes)", "Need validation (review the stack)"]

3. **MANDATORY STOP**: You MUST invoke the `question` tool NOW and WAIT for user selection before proceeding to Phase 2. DO NOT BEGIN PHASE 2 until you have the user's answers.

---

## Phase 2: Structural Verification

`[Mode: Verify]`

**Instruction**: Use the `task` tool to invoke `@critic`. Pass this prompt:
"Read `plans/$SCOPE/roadmap.md` and verify **both sections**:

### Section 1 — Roadmap (Phase/Day/Task timeline)

1. VERIFY that the roadmap starts at `Phase 0`.
2. VALIDATE that every Phase has at least two `**Day` entries (e.g., `**Day 1`, `**Day 2`). A single-Day Phase is unacceptable.
3. VALIDATE that all tasks are written in **future tense** and represent atomic steps (15 minutes or less).
4. VERIFY that no completed or past-tense language exists (e.g., 'already implemented', 'was configured').

### Section 2 — Implementation Plan

5. VERIFY that `## Implementation Plan` section exists.
6. VALIDATE that `### Key Files` table is populated and references actual project paths.
7. VALIDATE that `### Risks and Mitigations` table is populated.
8. VALIDATE that `### Security Checklist` has all items present.
9. VALIDATE that `### Accessibility Checklist` has all items present.
10. VERIFY that `### Implementation Steps` include per-step risk ratings (Low/Medium/High)."

Wait for `@critic` to finish.

---

## Phase 3: Scope Review & Report

`[Mode: Review]`

**Instruction**: Use the `task` tool to invoke `@critic` again. Pass this prompt:
"1. Cross-reference the Roadmap against `plans/$SCOPE/idea_research.md` (and `plans/$SCOPE/coding_convention.md` if necessary) along with the user's constraints gathered in Phase 1.
2. Analyze the scope: Does the roadmap realistically match the constraints? Are we over-engineering? Are dependencies ordered correctly?
3. Return a final Review Report highlighting:
   - INVALID formatting violations
   - Overly vague tasks
   - Missing Implementation Plan sections
   - Out-of-scope items
   - Unrealistic timeline estimates"

Present the returned report to the user in the chat. DO NOT silently edit `plans/$SCOPE/roadmap.md`. Let the user decide if they want to run `/inject` or `/bootstrap` again, or if they want you to fix it manually.

---

## Usage
```bash
/validate-roadmap core
/validate-roadmap billing
```
