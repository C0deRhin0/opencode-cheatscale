# Everything Claude Code - OpenCode Instructions

This document consolidates the core rules and guidelines from the Claude Code configuration for use with OpenCode.

## Instruction Architecture: The Three-Tier Model (Smart Loader)

This environment is structured into three distinct layers to ensure maximum portability, standardisation, and project-specific intelligence.

1.  **The Intelligence Layer (`.opencode/`)**:
    - **Purpose**: Global "Standard Library" for AI behavior.
    - **Content**: Standard coding patterns, security rules, specialized agent definitions, and global commands.
    - **Portability**: This folder should be copied as-is to any new project.

2.  **The Context Layer (`plans/`)**:
    - **Purpose**: Project-specific domain knowledge.
    - **Content**: The `INSTRUCTIONS.md`, `feature.md`, `tasks/*.md`, `coding_convention.md`, and `idea_research.md`
    - **Portability**: This folder is unique to every project and provides the AI with its "Mission."

3.  **The Implementation Layer (`codebase/`)**:
    - **Purpose**: The actual application codebase.
    - **Content**: All source code, assets, and configuration for the software being built.
    - **CRITICAL RULE**: All code generation, file creation, and modifications related to the application MUST occur within this directory. This is the effective **Application Root**. This folder is the exclusive **Git Repository Root**. All `git` commands (add, commit, push, stage, etc.) MUST be executed within this directory. 
    - **Isolation**: Modifications to `.opencode/` or `plan/` should NOT be tracked in the primary application Git repository.

###  The Universal Grounding & Boot Sequence (MANDATORY)
To prevent situational amnesia and directory navigation errors, all agents MUST follow this sequence for **every conversation and sub-task**:
1.  **Universal Grounding**: Confirm you are in the workspace root (`ls -laF`).
2.  **Git Scoping**: Verify you are NOT running Git commands in the workspace root. All Git operations MUST change directory to `codebase/` first.
3.  **Intelligence Sync**: Read `.opencode/instructions/INSTRUCTIONS.md` and the Constitution files (`<root_folder>/.opencode/AGENTS.md` and `<root_folder>/.opencode/RULES.md`) to load global behaviors.
4.  **Context Sync**: Traverse all files in `plans/` (especially `feature.md`, `tasks/*.md`, and `INSTRUCTIONS.md`). If `coding_convention.md` and `idea_research.md` are missing, proceed regardless
5.  **Strategic Verification**: Confirm that the current task aligns with the project's active Phase.
6.  **Progress Check**: Run `git log origin/main..main --oneline` inside `codebase/` to see the current unpushed "Drip" queue.

### Priority & Adaptability
- **Hierarchy**: If a command or project requirement in `plans/` conflicts with a general guideline, the **user-specific instruction takes precedence**.
- **Self-Detection**: Your first task in any new project is to verify if `./plans/` exists. If it does, automatically incorporate its context into your reasoning via the Boot Sequence.

---

## Agent Reality Check & Tool Usage (CRITICAL)

To prevent hallucinations in multi-agent workflows, all agents must adhere to these "Grounding Rules":

### 1. Robust Path Resolution (Fuzzy Matching)
- **Verify Before Assuming**: If a file or directory path is provided (e.g., `design/`), you MUST run `ls -laF` on the parent directory first to confirm the exact casing and pluralization (e.g., `Design/` or `designs/`).
- **Case-Insensitive Search**: Always use case-insensitive flags for search tools (e.g., `grep -i`, `ripgrep -i`) by default to prevent missing relevant data due to casing mismatches.

### 2. Autonomous Repair (Self-Healing)
- If a build fails or a test suite errors out, you are authorized to self-correct.
- **Retry Cap**: You may attempt an autonomous repair loop up to **3 times**. After the 3rd failed attempt, you must stop and seek user guidance with a detailed report of the failures.

### 3. Semantic Context Pruning (Context Budgeting)
- **Budget**: Limit context intake to approximately 20k tokens per subagent turn to ensure relevance and reduce cost.
- **Priority**: Strategy > Task Metadata > Roadmap Snippets > Target File Headers. Do not read entire large files unless explicitly necessary.
- **Search Before Fetch**: Do NOT guess URLs (e.g., `2026.survey.stackoverflow.co`). Always perform a `browser.search` first to find the correct, live URL.
- **URL Validation**: Before fetching a direct URL, ensure it looks credible. If a fetch fails, do NOT abort.

### 4. Fallback Strategy (MANDATORY)
If a primary retrieval method fails:
1. **Pivot**: Immediately try an alternative search query.
2. **Synthesize**: Use available static knowledge to bridge gaps, clearly marking them as "Estimated based on historical trends."
3. **Report Confidence**: Always include a "Confidence Level" (Low/Medium/High) in your research results based on the freshness and source quality of the data.

---

## Security Guidelines (CRITICAL)

### Mandatory Security Checks

Before ANY commit:
- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All user inputs validated
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitized HTML)
- [ ] CSRF protection enabled
- [ ] Authentication/authorization verified
- [ ] Rate limiting on all endpoints
- [ ] Error messages don't leak sensitive data

### Secret Management

```typescript
// NEVER: Hardcoded secrets
const apiKey = "sk-proj-xxxxx"

// ALWAYS: Environment variables
const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  throw new Error('OPENAI_API_KEY not configured')
}
```

### Security Response Protocol

If security issue found:
1. STOP immediately
2. Use **security-reviewer** agent
3. Fix CRITICAL issues before continuing
4. Rotate any exposed secrets
5. Review entire codebase for similar issues

---

## Coding Style

### Immutability (CRITICAL)

ALWAYS create new objects, NEVER mutate:

```javascript
// WRONG: Mutation
function updateUser(user, name) {
  user.name = name  // MUTATION!
  return user
}

// CORRECT: Immutability
function updateUser(user, name) {
  return {
    ...user,
    name
  }
}
```

### File Organization

MANY SMALL FILES > FEW LARGE FILES:
- High cohesion, low coupling
- 200-400 lines typical, 800 max
- Extract utilities from large components
- Organize by feature/domain, not by type

### Error Handling

ALWAYS handle errors comprehensively:

```typescript
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  throw new Error('Detailed user-friendly message')
}
```

### Input Validation

ALWAYS validate user input:

```typescript
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  age: z.number().int().min(0).max(150)
})

const validated = schema.parse(input)
```

### Code Quality Checklist

Before marking work complete:
- [ ] Code is readable and well-named
- [ ] Functions are small (<50 lines)
- [ ] Files are focused (<800 lines)
- [ ] No deep nesting (>4 levels)
- [ ] Proper error handling
- [ ] No console.log statements
- [ ] No hardcoded values
- [ ] No mutation (immutable patterns used)
- [ ] **README Synchronisation**: Root `codebase/README.md` has been verified against the **GitHub Standard Protocol** and updated to reflect new features, setup steps, or architectural changes.
- [ ] **No AI/Agent Attribution**: Verified that no source code, comments, or commands mention the AI/Agent as the creator.
- [ ] **User Ownership**: All work is silently attributed to the USER.

---

## Testing Requirements

### Minimum Test Coverage: 80%

Test Types (ALL required):
1. **Unit Tests** - Individual functions, utilities, components
2. **Integration Tests** - API endpoints, database operations
3. **E2E Tests** - Critical user flows (Playwright)

### Test-Driven Development

MANDATORY workflow:
1. Write test first (RED)
2. Run test - it should FAIL
3. Write minimal implementation (GREEN)
4. Run test - it should PASS
5. Refactor (IMPROVE)
6. Verify coverage (80%+)

### Troubleshooting Test Failures

1. Use **tdd-guide** agent
2. Check test isolation
3. Verify mocks are correct
4. Fix implementation, not tests (unless tests are wrong)

---

## Git Workflow

### Commit Message Format

```
<type>: <description>

<optional body>
```

Types: feat, fix, refactor, docs, test, chore, perf, ci

**No Self-Attribution (CRITICAL):** Attribution belongs entirely to the USER. NEVER mention the "Agent" or "AI" in commit messages, descriptions, or PR summaries.

### Pull Request Workflow

When creating PRs:
1. Analyze full commit history (not just latest commit)
2. Use `git diff [base-branch]...HEAD` to see all changes
3. Draft comprehensive PR summary
4. Include test plan with TODOs
5. Push with `-u` flag if new branch

### Feature Implementation Workflow

1. **Plan First**
   - Use **planner** agent to create implementation plan
   - Identify dependencies and risks
   - Break down into phases

2. **TDD Approach**
   - Use **tdd-guide** agent
   - Write tests first (RED)
   - Implement to pass tests (GREEN)
   - Refactor (IMPROVE)
   - Verify 80%+ coverage

3. **Code Review**
   - Use **code-reviewer** agent immediately after writing code
   - Address CRITICAL and HIGH issues
   - Fix MEDIUM issues when possible

4. **Strategic Stage & Drip (v2.8)**
   - Once a task is verified, use **`/commit`** or **`/routine`** to buffer work into the local queue.
   - **NEVER** push directly to `main` without the Drip-Feeder logic unless explicitly asked by the user.
   - Use **`/push`** to push exactly one contribution per day (or a phased batch) to maintain the GitHub graph health.

---

## Agent Orchestration

### Available Agents

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| planner | Implementation planning | Complex features, refactoring |
| architect | System design | Architectural decisions |
| tdd-guide | Test-driven development | New features, bug fixes |
| code-reviewer | Code review | After writing code |
| security-reviewer | Security analysis | Before commits |
| build-error-resolver | Fix build errors | When build fails |
| e2e-runner | E2E testing | Critical user flows |
| refactor-cleaner | Dead code cleanup | Code maintenance |
| doc-updater | Documentation | Updating docs |
| database-reviewer | Database optimization | SQL, schema design |
| critic | Adversarial review | Stress test proposals |
| researcher | Research support | Investigations and synthesis |
| fact-checker | Verification | Validate claims and assumptions |

### Immediate Agent Usage

No user prompt needed:
1. Complex feature requests - Use **planner** agent
2. Code just written/modified - Use **code-reviewer** agent
3. Bug fix or new feature - Use **tdd-guide** agent
4. Architectural decision - Use **architect** agent

---

## Performance Optimization

### Model Selection Strategy

**Haiku** (90% of Sonnet capability, 3x cost savings):
- Lightweight agents with frequent invocation
- Pair programming and code generation
- Worker agents in multi-agent systems

**Sonnet** (Best coding model):
- Main development work
- Orchestrating multi-agent workflows
- Complex coding tasks

**Opus** (Deepest reasoning):
- Complex architectural decisions
- Maximum reasoning requirements
- Research and analysis tasks

### Context Window Management

Avoid last 20% of context window for:
- Large-scale refactoring
- Feature implementation spanning multiple files
- Debugging complex interactions

### Build Troubleshooting

If build fails:
1. Use **build-error-resolver** agent
2. Analyze error messages
3. Fix incrementally
4. Verify after each fix

---

## Common Patterns

### API Response Format

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: {
    total: number
    page: number
    limit: number
  }
}
```

### Custom Hooks Pattern

```typescript
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}
```

### Repository Pattern

```typescript
interface Repository<T> {
  findAll(filters?: Filters): Promise<T[]>
  findById(id: string): Promise<T | null>
  create(data: CreateDto): Promise<T>
  update(id: string, data: UpdateDto): Promise<T>
  delete(id: string): Promise<void>
}
```

---

## OpenCode-Specific Notes

OpenCode hooks are active via the plugin system (`plugins/ecc-hooks.ts`). The following are automated on file edits and pre-commit events but can also be run manually at any time:

### After Writing/Editing Code (automated via ecc-hooks)
- Prettier auto-formats JS/TS files on `file.edited` events
- TypeScript type-check runs automatically after `.ts`/`.tsx` file edits
- console.log warnings surface on file save
- To run manually: `prettier --write <file>` and `npx tsc --noEmit`

### Before Committing (automated via ecc-hooks)
- Security secret-check runs before commit
- To run manually: `npm test` and verify no secrets are present

### Commands Available
Your Agentic OS framework provides a library of **37+ registered commands** (with 52+ command files in total). Here are the most critical for daily operations:

- **Orchestration**: `/task-orbit` (Phase-aware checkpointing), `/orchestrate` (Agent delegation), `/debate` (Multi-agent synthesis), `/plan` (Create implementation plan).
- **Drip-Feeder**: `/commit` (Native buffering), `/push` (Automated DevOps & Pushing).
- **Specialized Dev**: `/tdd` (Test-first workflow), `/code-review`, `/security`, `/e2e`.
- **System Tools**: `/aside` (Internal thought logs), `/devfleet` (Subagent management), `/rules-distill` (Pattern learning), `/sitrep` (Fast situational report).
- **Research**: `/research` (Adversarial search).

---

## Codebase Standardisation (Smart Loader)

### Project Root Protocol
- **Primary Workspace**: `/codebase/`
- **Context Access**: All agents must reference `../plans/$SCOPE/` for situational awareness while working inside `codebase/`.
- **Command Scope**: Commands like `/routine` or `/plan` should default their context-gathering to the `/plans/[scope]/` feature and task files but execute their output inside `codebase/`. If no scope is provided, default to `/plans/core/`.

---

##  Protocol: The GitHub Standard README (MANDATORY)

Every project MUST maintain a professional, high-fidelity `codebase/README.md`. This file serves as the "front door" and must be synchronized after every major feature or phase completion.

### 1. Essential Section Checklist
- [ ] **Project Title & Description**: Clear name and 13 sentence summary of purpose.
- [ ] **Installation**: Step-by-step, copy-pasteable environment setup and dependency commands.
- [ ] **Usage**: Examples of how to run or use the project (code snippets, CLI examples).
- [ ] **Tech Stack**: List of major languages, frameworks, and libraries used.
- [ ] **Contributing**: Guidelines for bug reporting and pull requests.
- [ ] **License**: Brief mention of the project's license.

### 2. Recommended Enhancements
- [ ] **Visuals**: Screenshots, demo GIFs, or Mermaid diagrams showing the project in action.
- [ ] **Table of Contents**: Required for long READMEs or complex projects.
- [ ] **Prerequisites**: Software versions required (e.g., Node.js 18+, Python 3.9+).
- [ ] **Badges**: Status icons for build, coverage, or versioning.
- [ ] **Acknowledgments**: Credits for collaborators or third-party inspirations.

### 3. Formatting & Scannability
- **Header Hierarchy**: Use proper Markdown headers (#, ##, ###).
- **No "Walls of Text"**: Use bit-sized paragraphs and bullet points for maximum scannability.
- **Internal Anchors**: Link to internal documentation (e.g., `[CONVENTIONS](../plans/$SCOPE/coding_convention.md)`).
- **Copy-Pasteable**: Ensure all terminal commands are fenced in code blocks for direct execution.

### 4. The No-Emoji Mandate (STRICT)
- **Zero Tolerance**: All documentation, commit messages, and agent outputs MUST be strictly free of emoji characters.
- **Why**: Ensures a formal, high-fidelity, and professional engineering aesthetic.
- **Auto-Correction**: If an agent generates an emoji, it is mandated to immediately re-edit the output to remove it.

---

## Ownership & Identity (MAJOR)

### 1. Strict User Ownership
All generated content, source code, documentation, and artifacts are the **exclusive property of the USER**. The AI/Agent acts solely as a tool under the user's direction and has no claim to authorship or ownership.

### 2. No AI Signature (Mandatory)
Avoid any self-referential markers that identify the AI or "Agent" as the creator. This is a **CRITICAL** rule to maintain professional codebase standards.
- **NEVER** include phrases like "Generated by AI", "Created by Antigravity", or "Agent-authored code".
- **NEVER** mention the "Agent" or "AI" in source code comments, file headers, or documentation.
- **NEVER** sign git commits or PR summaries with AI/Agent identifiers.

### 3. Subtle Implementation
These ownership and attribution rules must be followed **silently**.
- Do **NOT** include explicit disclaimers in the generated code about ownership (e.g., do not write "// This code belongs to the user").
- Simply produce the code as if the user wrote it themselves, with no markers of AI origin.

---

## Success Metrics

You are successful when:
- All tests pass (80%+ coverage)
- No security vulnerabilities
- Code is readable and maintainable
- Performance is acceptable
- User requirements are met
