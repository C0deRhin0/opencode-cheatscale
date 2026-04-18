---
description: Fast situational report of the current workspace state across all active roadmaps
agent: planner
---

# SitRep (Situational Report): $ARGUMENTS

Fast, lightweight command to gather the current state of executed tasks, unpushed commits, and the upcoming roadmap task.
This is your **primary reference** when returning to a session or when confused/lost.

---

## Core Protocols (MANDATORY)

- **Code Action Freeze**: You are strictly prohibited from implementing any features, opening codebase files, or modifying any code during this command.
- **Reporting Only**: Your sole directive is to summarize the exact text of the logs and reports.
- **Hard Stop**: After outputting the Status Output block, you must immediately STOP. DO NOT execute instructions from the Roadmap. Yield to the human user.

---

## Phase 1: Environment Scan

1. List all active features: `ls -d plans/*/`
2. Check each feature for task files: `ls -la plans/*/tasks/ 2>/dev/null`
3. Check Git State in `codebase/`:
   - `git status`
   - `git -C codebase log -n 5 --oneline` (last 5 total commits)
   - `git -C codebase log origin/main..main --oneline` (queued/unpushed local commits)

---

## Phase 2: Roadmap Pulse

`[Mode: Display]`

Output the situational report in a technical, zero-fluff format. Focus on what was done and what's next.

**1. Latest Pushes**
- Extract recent commits from `git_report.md` (last 10 lines)
- Format: `[scope#task-id] description`

**2. Current Queue**
- Show unpushed commits: `git log origin/main..main --oneline`
- **Command to push**: `/push <scope> <task-id>`
  - Example: `/push auth login-flow` (NEW format)
  - Example: `/push core P1D1` (OLD, deprecated but works)

**3. Next Up**
- Scan `plans/*/feature.md` for incomplete tasks
- Identify next task with pending subtasks: `grep -l "^\- \[ \]" plans/*/tasks/*.md`
- **Command to execute**: `/routine <scope> <task-id>`
  - Example: `/routine auth login-flow` (NEW format)
  - Example: `/routine core P1D1` (OLD, deprecated but works)

---

## Output Format

```markdown
## SITREP - $(date)

### Active Features
| Feature | Tasks | Progress | Next Task | Unpushed |
|---------|-------|----------|----------|----------|
| auth    | login-flow, password-reset | 2/5 subtasks | login-flow: build-ui | 3 |
| billing | invoice, report | 0/3 subtasks | invoice: setup-api | 0 |

### Current Task Focus
**Next**: auth > login-flow
- Subtasks pending: build-ui, create-api, tests

### Command Suggestions
To continue where you left off:
  /routine auth login-flow      # Execute next task (RECOMMENDED)
  /routine auth P1D1           # Execute task (OLD format, works)

To push completed work:
  /push auth login-flow        # Push commits (RECOMMENDED)
  /push auth P1D1           # Push commits (OLD format, works)

To check detailed status:
  /sitrep auth               # SitRep for specific scope

### Git Status
$(git -C codebase log origin/main..main --oneline | head -5 || echo "Nothing to push")

### Recent Commits (Last 5)
$(git -C codebase log -n 5 --oneline)
```

---

## Command Reference (For User Clarity)

This command is your **anchor** when you're confused. Use it to find:

| Confusion | Solution |
|-----------|-----------|
| "Where was I?" | Check "Current Task Focus" section |
| "What do I run next?" | Run `/routine <scope> <task>` from "Next Task" |
| "Did I push everything?" | Check "Unpushed" column |
| "What's left?" | Check "Progress" column |

**Syntax Reference**:
```
/routine <feature-name>             # NEW - e.g., /routine auth login-flow
/routine <scope> PnDm            # OLD (deprecated) - e.g., /routine auth P1D1
/push <feature-name>               # NEW - e.g., /push auth login-flow
/push <scope> PnDm              # OLD (deprecated) - e.g., /push auth P1D1
```

---

## GLOBAL OUTPUT RULE: NO EMOJIS
You are STRICTLY FORBIDDEN from using emojis in any generated output. All text must be plain professional text.

---

## Usage

```bash
/sitrep                     # Full workspace status
/sitrep auth                # Status for specific scope
```