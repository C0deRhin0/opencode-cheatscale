---
description: Run an adversarial research loop for high-confidence answers using MCP web search
agent: orchestrator
subtask: true
---

# Adversarial Research: $ARGUMENTS

Deep-dive research session using MCP-powered web search and adversarial verification.
Three-phase loop: Research → Verify → Synthesize.

---

## Core Protocols

- **OpenCode Native**: Uses built-in agent subtasks — no external binaries required
- **Code Sovereignty**: Only the orchestrating agent writes files; research agents are read-only
- **Stop-Loss**: Do not advance to the next phase until the current phase output is validated
- **Source-First**: Every claim must have a cited source. No unsourced assertions.

## Boot Sequence (MANDATORY)

1. Read `plans/$SCOPE/idea_research.md` for existing project context
2. Confirm project root with `ls -laF`

---

## MCP Requirement

This command requires active MCP web search tools. Available tools:

| MCP Server | Tool | Use For |
|------------|------|---------|
| `exa-web-search` | `web_search_exa` | General web search |
| `exa-web-search` | `web_search_advanced_exa` | Filtered search with domain/date constraints |
| `exa-web-search` | `get_code_context_exa` | Code examples and documentation |
| `exa-web-search` | `crawling_exa` | Full page content extraction |
| `exa-web-search` | `deep_researcher_start` / `deep_researcher_check` | Async deep research |
| `firecrawl` | `firecrawl_search` | Alternative web search |
| `firecrawl` | `firecrawl_scrape` | Alternative page scraping |

**If no MCP tools are available**: Stop and inform the user. Do NOT fall back to training data without disclosure. State: "MCP web search is not configured. Results will be based on training data only (cutoff: [date]). Run with MCP enabled for live web results."

**Reference skills**: `skills/exa-search/SKILL.md`, `skills/deep-research/SKILL.md`

---

## Phase 1: Deep Discovery

`[Mode: Research]`

**Instruction**: Use the `task` tool to invoke `@researcher`. Pass this prompt:
"1. Research: $ARGUMENTS
2. Method: Use web_search_exa or firecrawl_search for each sub-question. Use crawling_exa for full content on key URLs.
3. Scope: Break the topic into 3-5 sub-questions. Search 2-3 keyword variations per sub-question.
4. Output: Return findings with inline source citations. Minimum 5 unique sources."

Wait for `@researcher` to finish.

---

## Phase 2: Adversarial Verification

`[Mode: Verify]`

**Instruction**: Use the `task` tool to invoke `@fact-checker`. Pass the findings and this prompt:
"1. Verify: The findings from Phase 1
2. Method: Use web_search_exa to cross-reference specific claims. Use crawling_exa to verify key sources.
3. Focus: Identify hallucinations, outdated information, logical inconsistencies, single-source claims
4. Output: Return a verification log with status per claim (Verified/Refuted/Unverified)."

Wait for `@fact-checker` to finish.

---

## Phase 3: Synthesis (MANDATORY STOP)

`[Mode: Synthesis]`

**Instruction**: Use the `task` tool to invoke `@reducer`. Pass the findings, verification log, and this prompt:
"1. Synthesize: Research findings + verification results into a definitive answer
2. Focus: Deliver actionable conclusions. Flag any remaining uncertainties.
3. Output: Final report using the provided markdown structure."

Present to user using this structure:

```markdown
## Research Report: <Topic>
*Sources: N | Confidence: 0-100%*

### Executive Summary
<3-5 sentence overview>

### Findings
<Key findings with inline citations ([Source Name](url))>

### Verification Log
| Claim | Status | Source |
|-------|--------|--------|
| ... | Verified/Refuted/Unverified | [link] |

### Core Learnings
- Point 1
- Point 2

### Confidence Score
<0-100%> — <justification>

### Sources
1. [Title](url) — one-line summary
2. ...
```

WAIT for user review.
