---
description: Create implementation plan with adversarial risk assessment
agent: orchestrator
subtask: true
---

#  MANDATORY BOOT SEQUENCE
**Before proceeding, you MUST synchronize context from `.opencode/instructions/INSTRUCTIONS.md` and `plans/$SCOPE/` (especially `roadmap.md` and `INSTRUCTIONS.md`).**

---

# Plan Command: $ARGUMENTS

## Phase 1: Context & Scope

1. Identify **Scope** from user input (default: `core`).
2. Synchronize context from `plans/$SCOPE/`.

## Phase 2: Requirement Synthesis
**Instruction**: Use the `task` tool to invoke `@planner`. Pass this prompt:
"1. Restate the requirements based on the user's `$ARGUMENTS`.
2. Identify the core components and dependencies.
3. Draft an initial implementation phase structure."

## Phase 3: Adversarial Risk Assessment
**Instruction**: Use the `task` tool to invoke `@critic`. Pass the draft from Phase 2 and this prompt:
"1. Review the requirements and initial draft.
2. **Adversarial Audit**: Look for edge cases, security flaws, architectural debt, and reasons the plan might fail. 
3. Categorize risks into HIGH, MEDIUM, and LOW.
4. Provide specific mitigation advice for HIGH risks."

## Phase 4: Final Optimized Plan
**Instruction**: Use the `task` tool to invoke `@planner`. Pass the explicit risk assessment and this prompt:
"1. Incorporate the Critic's risk assessment into the final plan.
2. **Create Step Plan**: Break down implementation into atomic tasks.
3. **Output Format**:
    - **Requirements Restatement**
    - **Implementation Phases**
    - **Dependencies**
    - **Critical Risks & Mitigations** (Synthesized)
    - **Estimated Complexity**"

---

**WAITING FOR CONFIRMATION**: Proceed with this plan? (yes/no/modify)

**CRITICAL**: Do NOT write any code until the user explicitly confirms with "yes", "proceed", or similar affirmative response.

## Usage
```bash
/plan core "database migration for v2"
/plan auth "move to jwt sessions"
```