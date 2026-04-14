---
description: Fast situational report of the current workspace state across all active roadmaps
agent: planner
---

# SitRep (Situational Report): $ARGUMENTS

Fast, lightweight command to gather the current state of executed tasks, unpushed commits, and the upcoming roadmap phase.

---

## Core Protocols (MANDATORY)

- **Code Action Freeze**: You are strictly prohibited from implementing any features, opening codebase files, or modifying any code during this command.
- **Reporting Only**: Your sole directive is to summarize the exact text of the logs and reports.
- **Hard Stop**: After outputting the Status Output block, you must immediately STOP. DO NOT execute instructions from the Roadmap. Yield to the human user.

---

## Phase 1: Environment Scan

1. List all active roadmaps: `ls -d plans/*/`
3. Check Git State in `codebase/`:
   - `git status`
   - `git -C codebase log -n 5 --oneline` (last 5 total commits)
   - `git -C codebase log origin/main..main --oneline` (queued/unpushed local commits)

---

## Phase 2: Roadmap Pulse

`[Mode: Display]`

Strictly output the situational report in a technical, zero-fluff format. Do NOT generate long prose. Use bullet points and focus solely on exact status, matching Phase/Day numbers.
Include the following sections exactly:

**1. Latest Pushes** 
- Extract 1-2 bullet points from `git_report.md` summarizing what was just done.

**2. Current Queue**
- Show the exact output of unpushed local commits. Advise the user to run `/push [$SCOPE:PnDm]` if the queue is not empty.

**3. Next Up: [Phase N Day M]**
- The exact Phase N Day M and the list of its tasks extracted from `plans/$SCOPE/roadmap.md`. Advise the user to run `/routine [$SCOPE:PnDm]` to execute.

---

## Output Format

```markdown
## SITREP - $(date)

### Active Roadmaps
| Scope | Phase | Status | Unpushed |
|-------|-------|--------|----------|
| core  | P1D2  | [==---] | 3 commits |
| auth  | P0D1  | [-----] | 0 commits |

### Codebase Health
- Branch: main (origin/main)
- Local status: <N> commits ahead
- Uncommitted changes: <Yes/No>

### Recent Activity
- <Last 5 commits across all scopes>
```

## GLOBAL OUTPUT RULE: NO EMOJIS
You are STRICTLY FORBIDDEN from using emojis in any generated output. All text must be plain professional text.
