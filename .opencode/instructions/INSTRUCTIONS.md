# Everything Claude Code - OpenCode Instructions

This document consolidates the core rules and guidelines from the Claude Code configuration for use with OpenCode.

## Instruction Architecture: The Three-Tier Model (Smart Loader)

This environment is structured into three distinct layers to ensure maximum portability, standardisation, and project-specific intelligence.

1.  **The Intelligence Layer (`.opencode/`)**:
    - **Purpose**: Global "Standard Library" for AI behavior.
    - **Content**: Standard coding patterns, security rules, specialized agent definitions, and global commands.
    - **Portability**: This folder should be copied as-is to any new project.

2.  **The Context Layer (`plan/`)**:
    - **Purpose**: Project-specific domain knowledge.
    - **Content**: The `INSTRUCTIONS.md`, `roadmap.md`, `coding_convention.md`, and `idea_research.md`
    - **Portability**: This folder is unique to every project and provides the AI with its "Mission."

3.  **The Implementation Layer (`codebase/`)**:
    - **Purpose**: The actual application codebase.
    - **Content**: All source code, assets, and configuration for the software being built.
    - **CRITICAL RULE**: All code generation, file creation, and modifications related to the application MUST occur within this directory. This is the effective **Application Root**. This folder is the exclusive **Git Repository Root**. All `git` commands (add, commit, push, stage, etc.) MUST be executed within this directory. 
    - **Isolation**: Modifications to `.opencode/` or `plan/` should NOT be tracked in the primary application Git repository.

###  The Universal Grounding & Boot Sequence (MANDATORY)
To prevent situational amnesia and directory navigation errors, all agents MUST follow this sequence for **every conversation and sub-task**:
1.  **Universal Grounding**: Confirm you are in the workspace root (`ls -F`).
2.  **Git Scoping**: Verify you are NOT running Git commands in the workspace root. All Git operations MUST change directory to `codebase/` first.
3.  **Intelligence Sync**: Read `codebase/.opencode/instructions/INSTRUCTIONS.md` and the Constitution files (`plan/.opencode/AGENTS.md` and `plan/.opencode/RULES.md`) to load global behaviors.
4.  **Context Sync**: Traverse all files in `plan/` (especially `roadmap.md` and `INSTRUCTIONS.md`). If `coding_convention.md` and `idea_research.md` are missing, proceed regardlessly
5.  **Strategic Verification**: Confirm that the current task aligns with the project's active Phase.
6.  **Progress Check**: Run `git log origin/main..main --oneline` inside `codebase/` to see the current unpushed "Drip" queue.

### Priority & Adaptability
- **Hierarchy**: If a command or project requirement in `plan/` conflicts with a general guideline, the **user-specific instruction takes precedence**.
- **Self-Detection**: Your first task in any new project is to verify if `./plan/` exists. If it does, automatically incorporate its context into your reasoning via the Boot Sequence.

---

## Agent Reality Check & Tool Usage (CRITICAL)

To prevent hallucinations in multi-agent workflows, all agents must adhere to these "Grounding Rules":

### 1. Robust Path Resolution (Fuzzy Matching)
- **Verify Before Assuming**: If a file or directory path is provided (e.g., `design/`), you MUST run `ls -F` on the parent directory first to confirm the exact casing and pluralization (e.g., `Design/` or `designs/`).
- **Case-Insensitive Search**: Always use case-insensitive flags for search tools (e.g., `grep -i`, `ripgrep -i`) by default to prevent missing relevant data due to casing mismatches.
- **Pluralization Handling**: When resolving paths, account for common variations (e.g., `components` vs `component`, `utils` vs `util`).

### 2. 3-Attempt Self-Healing Protocol
- If a build fails or a test suite errors out, you are authorized to self-correct.
- **Retry Cap**: You may attempt an autonomous repair loop up to **3 times**. After the 3rd failed attempt, you must stop and seek user guidance with a detailed report of the failures.

### 3. Search-First Mandate and Tool Reality Rule
- **Search Before Fetch**: Do NOT guess URLs (e.g., `2026.survey.stackoverflow.co`). Always perform a `browser.search` first to find the correct, live URL.
- **Tool Reality Rule**: Before using any tool, verify it exists and is available. Never assume a tool's name or capabilities.
- **URL Validation**: Before fetching a direct URL, ensure it looks credible. If a fetch fails, do NOT abort.

### 4. Fallback Strategy (Robustness over Precision)
If a primary retrieval method fails:
1. **Pivot**: Immediately try an alternative search query.
2. **Synthesize**: Use available static knowledge to bridge gaps, clearly marking them as "Estimated based on historical trends."
3. **Report Confidence**: Always include a "Confidence Level" (Low/Medium/High) in your research results based on the freshness and source quality of the data.