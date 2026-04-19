Everything Claude Code (ECC)  Agent Instructions

This is a **production-ready AI coding plugin** providing 20 specialized agents, 25+ commands, and automated hook workflows for software development.

**Version:** 1.9.0

## Core Principles

1. **Agent-First**  Delegate to specialized agents for domain tasks
2. **Test-Driven**  Write tests before implementation, 80%+ coverage required
3. **Security-First**  Never compromise on security; validate all inputs
4. **Immutability**  Always create new objects, never mutate existing ones
5. **Plan Before Execute**  Plan complex features before writing code
6. **User Ownership** All generated works belong to the USER; avoid AI signature or "Agent" mentions in code/commits
7. **Scoped Domain Authority** Specialists (Architect/Planner) have direct write authority within their domains; Orchestrator coordinates boundaries.

## Available Agents

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| build | Primary coding agent | Development work |
| planner | Implementation planning | Complex features, refactoring |
| architect | System design and scalability | Architectural decisions |
| tdd-guide | Test-driven development | New features, bug fixes |
| code-reviewer | Code quality and maintainability | After writing/modifying code |
| security-reviewer | Vulnerability detection | Before commits, sensitive code |
| build-error-resolver | Fix build/type errors | When build fails |
| e2e-runner | End-to-end Playwright testing | Critical user flows |
| refactor-cleaner | Dead code cleanup | Code maintenance |
| doc-updater | Documentation and codemaps | Updating docs |
| database-reviewer | PostgreSQL/Supabase specialist | Schema design, query optimization |
| critic | Adversarial review | Stress test plans and proposals |
| researcher | Research support | Investigations and synthesis |
| fact-checker | Verification and accuracy checks | Validate claims and assumptions |
| frontend-engineer | Frontend implementation | UI components, pages |
| database-engineer | Database schema design | Schema, migrations |
| devops-engineer | CI/CD and infrastructure | Pipelines, deployments |
| integration-engineer | Third-party integrations | API connections |
| ml-engineer | ML/AI features | Model integration |
| performance-reviewer | Performance analysis | Bottleneck identification |
| accessibility-reviewer | WCAG compliance | Accessibility audits |
| qa-engineer | Quality assurance | Test coverage, edge cases |
| synthesis-writer | Bootstrap roadmap generation | Writing plans/ files in parallel |

## Agent Orchestration

Use agents proactively without user prompt:
- Complex feature requests  **planner**
- Code just written/modified  **code-reviewer**
- Bug fix or new feature  **tdd-guide**
- Architectural decision  **architect**
- Security-sensitive code  **security-reviewer**
- Adversarial review of proposals  **critic**
- Research or synthesis needs  **researcher**
- Verification of claims  **fact-checker**

Use parallel execution for independent operations  launch multiple agents simultaneously.

## Security Guidelines

**Before ANY commit:**
- No hardcoded secrets (API keys, passwords, tokens)
- All user inputs validated
- SQL injection prevention (parameterized queries)
- XSS prevention (sanitized HTML)
- CSRF protection enabled
- Authentication/authorization verified
- Rate limiting on all endpoints
- Error messages don't leak sensitive data

**Secret management:** NEVER hardcode secrets. Use environment variables or a secret manager. Validate required secrets at startup. Rotate any exposed secrets immediately.

**If security issue found:** STOP  use security-reviewer agent  fix CRITICAL issues  rotate exposed secrets  review codebase for similar issues.

## Coding Style

**Immutability (CRITICAL):** Always create new objects, never mutate. Return new copies with changes applied.

**File organization:** Many small files over few large ones. 200-400 lines typical, 800 max. Organize by feature/domain, not by type. High cohesion, low coupling.

**Error handling:** Handle errors at every level. Provide user-friendly messages in UI code. Log detailed context server-side. Never silently swallow errors.

**Input validation:** Validate all user input at system boundaries. Use schema-based validation. Fail fast with clear messages. Never trust external data.

**Code quality checklist:**
- Functions small (<50 lines), files focused (<800 lines)
- No deep nesting (>4 levels)
- Proper error handling, no hardcoded values
- Readable, well-named identifiers

## Testing Requirements

**Minimum coverage: 80%**

Test types (all required):
1. **Unit tests**  Individual functions, utilities, components
2. **Integration tests**  API endpoints, database operations
3. **E2E tests**  Critical user flows

**TDD workflow (mandatory):**
1. Write test first (RED)  test should FAIL
2. Write minimal implementation (GREEN)  test should PASS
3. Refactor (IMPROVE)  verify coverage 80%+

Troubleshoot failures: check test isolation  verify mocks  fix implementation (not tests, unless tests are wrong).

## Development Workflow

1. **Plan**  Use planner agent, identify dependencies and risks, break into phases
2. **TDD**  Use tdd-guide agent, write tests first, implement, refactor
3. **Review**  Use code-reviewer agent immediately, address CRITICAL/HIGH issues
4. **Capture knowledge in the right place**
   - Personal debugging notes, preferences, and temporary context  auto memory
   - Team/project knowledge (architecture decisions, API changes, runbooks)  the project's existing docs structure
   - If the current task already produces the relevant docs or code comments, do not duplicate the same information elsewhere
   - If there is no obvious project doc location, ask before creating a new top-level file
5. **Commit**  Conventional commits format, comprehensive PR summaries

## Git Workflow

**Commit format:** `<type>: <description>`  Types: feat, fix, refactor, docs, test, chore, perf, ci

**No Self-Attribution:** NEVER mention the "Agent" or "AI" in commit messages or source code signatures. All work is attributed to the USER.

**PR workflow:** Analyze full commit history  draft comprehensive summary  include test plan  push with `-u` flag.

## Architecture Patterns

**API response format:** Consistent envelope with success indicator, data payload, error message, and pagination metadata.

**Repository pattern:** Encapsulate data access behind standard interface (findAll, findById, create, update, delete). Business logic depends on abstract interface, not storage mechanism.

**Skeleton projects:** Search for battle-tested templates, evaluate with parallel agents (security, extensibility, relevance), clone best match, iterate within proven structure.

## Performance

**Context management:** Avoid last 20% of context window for large refactoring and multi-file features. Lower-sensitivity tasks (single edits, docs, simple fixes) tolerate higher utilization.

**Build troubleshooting:** Use build-error-resolver agent  analyze errors  fix incrementally  verify after each fix.

## Project Structure

```
agents/           16 agent definition files (20 registered in opencode.json including _stick variants)
skills/           Skill catalog (subset loaded in config)
commands/         Command catalog (25+ registered in config)
hooks/            Trigger-based automations
rules/            Always-follow guidelines (common + per-language)
scripts/          Cross-platform Node.js utilities
mcp-configs/      MCP server configurations
tests/            Test suite
```

## Success Metrics

- All tests pass with 80%+ coverage
- No security vulnerabilities
- Code is readable and maintainable
- Performance is acceptable
- User requirements are met
