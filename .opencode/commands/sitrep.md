---
description: Report roadmap, git, and local drip-tag state so the next action is obvious
agent: orchestrator
---

# SitRep (Situational Report): $ARGUMENTS

Fast, lightweight command to gather the current state of executed tasks, local drip tags, recent pushes, and upcoming roadmap tasks.
This is your **primary reference** when returning to a session or when confused/lost.

---

## Core Protocols (MANDATORY)

- **Code Action Freeze**: You are strictly prohibited from implementing any features, opening codebase files, or modifying any code during this command.
- **Reporting Only**: Your sole directive is to summarize roadmap state, git state, and local drip-tag bookkeeping.
- **Tag-Aware Bookkeeping**: Treat `drip/todo/*` tags as the source of truth for pending pushes and `drip/done/*` tags as local completion records.
- **No Tag Mutation**: Do NOT create, delete, rename, or push tags during SitRep.
- **Hard Stop**: After outputting the Status Output block, you must immediately STOP. DO NOT execute instructions from the Roadmap. Yield to the human user.

## GLOBAL OUTPUT RULE: NO EMOJIS
You are STRICTLY FORBIDDEN from using emojis in any generated output. All text must be plain professional text.

---

## Phase 1: Environment Scan

1. List all active features: `ls -d plans/*/`
2. Check each feature for task files: `ls -la plans/*/tasks/ 2>/dev/null`
3. Check Git State in `codebase/`:
    - `git -C codebase status`
    - `git -C codebase log -n 5 --oneline` (last 5 total commits)
    - `git -C codebase tag --list 'drip/todo/*' --sort=creatordate` (pending local drip units)
    - `git -C codebase tag --list 'drip/done/*' --sort=creatordate` (completed local drip units)
    - `git -C codebase cherry -v origin/main HEAD` (patch-equivalent local branch status; diagnostic only, not source of truth)

---

## Phase 2: Roadmap Pulse

`[Mode: Display]`

Output the situational report in a technical, zero-fluff format. Focus on what was done and what's next.

**1. Latest Pushes**
- Extract recent commits from `git_report.md` (last 10 lines)
- Format: `[drip/done/<scope>/<task-id>] description` or `[drip/todo/<scope>/<task-id>] description` depending on report contents.

**2. Current Drip Queue**
- Show pending local tags: `git -C codebase tag --list 'drip/todo/*' --sort=creatordate`
- For each pending tag, show approximate pending patch count with `git -C codebase cherry -v origin/main <tag^{}>` and count only `+` lines.
- **Command to push**: `/push [scope] [task-id]`
  - Example: `/push` (push oldest pending tag)
  - Example: `/push auth login-flow` (push exact tag)
- Do NOT use `git log origin/main..main` as the authoritative queue because pushed rewritten commits have different hashes.

**3. Completed Drip Units**
- Show recent done tags: `git -C codebase tag --list 'drip/done/*' --sort=-creatordate`.
- If a matching `drip/todo/*` and `drip/done/*` both exist for the same scope/task, flag it as stale todo reconciliation needed and suggest `/push <scope> <task-id>`.

**4. Untagged Local Work Diagnostics**
- Show dirty working tree status from `git -C codebase status --short`.
- Show `git -C codebase cherry -v origin/main HEAD` as diagnostic only.
- If there are local commits but no `drip/todo/*` tags, warn: "Local commits exist but no pending drip tags. Use `/commit <scope> <task-id>` or inspect whether these are already covered by tags."

**5. Next Up**
- Scan `plans/*/$SCOPE.md` for incomplete tasks
- Identify next task with pending subtasks: `grep -l "^\- \[ \]" plans/*/tasks/*.md`
- **Command to execute**: `/routine <scope> <task-id>`
  - Example: `/routine auth login-flow` (NEW format)
  - Example: `/routine core P1D1` (OLD, deprecated but works)

---

## Output Format

```markdown
## SITREP - $(date)

### Active Features
| Feature | Tasks | Progress | Next Task | Pending Drip Tags | Done Tags |
|---------|-------|----------|-----------|-------------------|-----------|
| auth    | login-flow, password-reset | 2/5 subtasks | login-flow: build-ui | 2 | 1 |
| billing | invoice, report | 0/3 subtasks | invoice: setup-api | 0 | 0 |

### Drip Queue
| Order | Tag | Pending Patches | Suggested Command |
|-------|-----|-----------------|-------------------|
| 1 | drip/todo/auth/login-flow | 3 | /push auth login-flow |
| 2 | drip/todo/auth/password-reset | 2 | /push auth password-reset |

### Completed Drips
| Tag | Local Marker |
|-----|--------------|
| drip/done/auth/project-setup | local only |

### Current Task Focus
**Next**: auth > login-flow
- Subtasks pending: build-ui, create-api, tests

### Command Suggestions
To continue where you left off:
  /routine auth login-flow      # Execute next task (RECOMMENDED)
  /routine auth P1D1           # Execute task (OLD format, works)

To push completed work:
  /push                       # Push oldest pending tag (RECOMMENDED)
  /push auth login-flow       # Push exact pending tag

To check detailed status:
  /sitrep auth               # SitRep for specific scope

### Git Status
Pending tags: $(git -C codebase tag --list 'drip/todo/*' --sort=creatordate || echo "Nothing to push")
Diagnostic cherry status: $(git -C codebase cherry -v origin/main HEAD || echo "No cherry diagnostics")

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
| "Did I push everything?" | Check "Drip Queue" and "Completed Drips" |
| "What tag should I push?" | Check "Drip Queue" and run the suggested `/push` command |
| "Why does `origin/main..main` look wrong?" | Ignore it as queue truth; rewritten pushed commits have different hashes. Use local drip tags and `git cherry` diagnostics. |
| "What's left?" | Check "Progress" column |

**Syntax Reference**:
```
/routine <scope> <task-id>          # NEW - e.g., /routine auth login-flow
/routine <scope> PnDm               # OLD (deprecated) - e.g., /routine auth P1D1
/push                            # NEW - push oldest pending local tag
/push <scope> <task-id>          # NEW - e.g., /push auth login-flow
```

## Usage

```bash
/sitrep                     # Full workspace status
/sitrep auth                # Status for specific scope
```

---

## Edge Cases

**Pending todo tag has zero pending patches:** Report it as likely already pushed/reconciled and suggest `/push <scope> <task-id>` to let the push command move it to `drip/done/*` safely.

**No pending tags but dirty working tree exists:** Recommend `/commit <scope> <task-id>` if the work is complete, or `/routine <scope> <task-id>` if the user wants to continue implementation.

**Both todo and done tags exist for the same unit:** Report stale bookkeeping and recommend `/push <scope> <task-id>` for reconciliation.

---

## Related Commands

- `/bootstrap "project vision"` - Generate roadmap and task files.
- `/routine <scope> <task-id>` - Execute next roadmapped task and create a pending drip tag.
- `/commit <scope> <task-id>` - Manually commit current work into a pending drip tag.
- `/push [scope] [task-id]` - Push and reconcile one pending drip tag.
