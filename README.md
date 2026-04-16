# Opencode-CheatScale

Enterprise-grade AI development orchestration system with roadmap automation,Obsidian integration, and time-warp commit capabilities.

---

## Overview

CheatScale is a powerful OpenCode configuration that transforms how you buildprojects. It combines:

- **Wave-based enterprise orchestration** with 24 specialized AI agents
- **Feature-specific roadmaps** created with the same agent-routing logic Obsidian graph linking integration
- **Time-warp commit system** for appearing productive every day
- **3-tier architecture** for AI-era development

---

## Why 3-Tier Architecture Matters in the AI Era

The 3-tier architecture is the backbone of AI-assisted development:

```
┌─────────────────────────────────────┐
│     PRESENTATION TIER (AI View)     │
│  UI, Components, User Interfaces   │
├─────────────────────────────────────┤
│      LOGIC/DOMAIN TIER (AI Brain)   │
│  Business Logic, Algorithms, Rules  │
├─────────────────────────────────────┤
│        DATA TIER (AI Memory)        │
│   Configuration, State, Constants  │
└─────────────────────────────────────┘
```

### Why It Matters

1. **AI Testability**: Pure domain logic can be unit-tested without rendering - critical for 80%+ coverage requirements

2. **Separation of Concerns**: AI agents work in their layer - no cross-contamination

3. **Parallel Development**: Frontend and backend agents work simultaneously

4. **Maintainability**: Each tier evolves independently

---

## Feature Roadmap Commands

### /bootstrap - Project Bootstrapper

Creates complete project context with:
- Wave-based orchestration (research → analysis → quality → synthesis)
- Auto-generated frontmatter for Obsidian graph linking
- Tech-stack specific conventions
- Full roadmap with phases, days, tasks

**Usage**: `/bootstrap billing add VAT handling`

### /inject - Surgical Roadmap Injection

Adds new requirements to existing roadmap without rewriting:
- Phase 0: Scan & route with complexity classification
- Wave-based impact analysis
- Surgical updates - preserves completed phases

**Usage**: `/inject billing add VAT handling`

### /validate-roadmap - Adversarial Review

Validates roadmap with parallel quality gates:
- Wave 1: Structural + content validation (critic, qa-engineer)
- Wave 2: Feasibility + technical review (critic, architect)
- Generates detailed validation report

**Usage**: `/validate-roadmap billing`

---

## Why Roadmaps Are Useful

1. **Atomic Task Breakdown**: Each task = 15 min or less = 1 commit
2. **Phase Isolation**: Complete each phase before moving on
3. **Deliverable Focus**: Every phase ends with working code
4. **Audit Trail**: Full history of what was done and when
5. **Obsidian Integration**: Visual graph view of all features

---

## Orchestration Pattern

CheatScale uses **wave-based orchestration**:

```
User Task
    │
    ▼
Phase 0: Scan & Route (classify complexity, assign scopes)
    │
    ├─ Wave 1: Knowledge (if unknowns) ─ Researcher + Fact-Checker
    │
    ├─ Wave 2: Domain Writers (parallel) ─ Architect, Frontend, Database...
    │
    ├─ Wave 3: Quality (parallel) ─ Critic, QA, Security...
    │
    ▼
Phase: Synthesis (orchestrator writes to plans/)
```

### Complexity Gating

| Level | Criteria | Agents |
|-------|----------|--------|
| Simple | 1 domain | 1 writer + 1 reviewer |
| Medium | 2-3 domains | Relevant writers + reviewers |
| Complex | 3+ domains | Full wave roster |

---

## 24 Specialized Agents

### Domain Writers (Build Implementation)
| Agent | Specialty |
|-------|-----------|
| `architect` | Backend systems, API, architecture |
| `frontend-engineer` | UI/UX, components, layouts |
| `database-engineer` | Schema, migrations, SQL |
| `devops-engineer` | CI/CD, Docker, deployment |
| `integration-engineer` | External APIs, webhooks |
| `ml-engineer` | ML/AI, embeddings, prompts |

### Quality Agents (Review & Validate)
| Agent | Specialty |
|-------|-----------|
| `code-reviewer` | Code quality, patterns |
| `security-reviewer` | Vulnerabilities, auth |
| `performance-reviewer` | Bottlenecks, latency |
| `accessibility-reviewer` | WCAG compliance |
| `qa-engineer` | Test coverage, edge cases |
| `tdd-guide` | Test-driven development |
| `e2e-runner` | End-to-end testing |
| `build-error-resolver` | Build/type errors |

### Utility Agents
| Agent | Specialty |
|-------|-----------|
| `planner` | Task decomposition |
| `refactor-cleaner` | Dead code removal |
| `doc-updater` | Documentation |

### Wave Agents
| Agent | Specialty |
|-------|-----------|
| `researcher` | Investigation, synthesis |
| `fact-checker` | Verification, accuracy |
| `critic` | Adversarial review |
| `reducer` | Output synthesis |

---

## Cheater-Dev Commands

### /routine - Checkpoint Execution

Execute roadmap tasks with **atomic checkpointing**:
- Each task = 1 implementation = 1 commit
- MANDATORY STOP after each phase
- Auto-spawns relevant reviewers

**Usage**: `/routine billing P1D1`

### /commit - Atomic Commits

Every task gets its own commit:
- Format: `<type>: <description> [scope:PnDm]`
- No combining tasks
- Self-healing if accidentally batched

### /push - Time-Warp Push

**The Cheat**: Rewrites commit dates to appear daily:

```
Day 1: Implement auth → commit dated Jan 1
Day 2: Add payments → commit dated Jan 2
...
Day 7: Push ALL → GitHub sees 7 days of contributions!
```

**Usage**: After completing Phase 1 tasks, run `/push` to date-shift commits.

---

## Obsidian Integration

All roadmap files include frontmatter for Obsidian graph view:

```yaml
---
tags: [roadmap, billing]
scope: billing
---
```

Wiki-links connect files: `[[roadmap]], [[idea_research]]`

Configure Obsidian to open project root - all feature roadmaps visible in graph.

---

## Installation

1. **Clone the repository**:
   ```bash
   git clone <this-repo>
   ```

2. **Copy `.opencode` folder** to your project root:
   ```bash
   cp -r .opencode /path/to/your/project/
   ```

3. **Start using**:
   ```bash
   /bootstrap my-feature
   /routine my-feature P1D1
   /validate-roadmap my-feature
   ```

---

## What Makes CheatScale Different

### Wave-Based Orchestration

Unlike basic OpenCode configs, CheatScale uses **enterprise wave-based orchestration**:

- **Phase 0**: Scan & Route - classify complexity, assign scopes
- **Wave 1**: Knowledge - researcher + fact-checker (if unknowns)
- **Wave 2**: Domain Writers - parallel execution of specialists
- **Wave 3**: Quality - parallel review by multiple agents

### Complexity Gating

| Level | Criteria | Agents Spawned |
|-------|----------|----------------|
| Simple | 1 domain | 1 writer + 1 reviewer |
| Medium | 2-3 domains | Relevant writers + reviewers |
| Complex | 3+ domains | Full wave roster |

### File Scope Protocols

- **Orchestrator** owns: `plans/`, `docs/`
- **Domain agents** own: specific `codebase/` subdirectories
- **No overlap** - boundaries enforced

### Phase Isolation with MANDATORY STOP

Every phase requires user confirmation before proceeding - prevents runaway execution.

---

## Foundation Credit

CheatScale is built upon **everything-claude-code** by [affaan](https://github.com/affaan-m/everything-claude-code).

Approximately 10% of the foundational patterns, agent configurations, and command structures are derived from this excellent resource. The remaining 90% represents new enterprise patterns, wave-based orchestration, and custom commands.

---

## License

MIT License

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `/bootstrap <feature>` | Create project roadmap |
| `/inject <scope> <change>` | Add to roadmap |
| `/validate-roadmap <scope>` | Review roadmap |
| `/routine <scope> PnDm` | Execute tasks |
| `/push` | Time-warp push |
| `/execute <task>` | Ad-hoc implementation |

## All Available Commands

### Skills (Specialized Workflows)

CheatScale includes 25+ specialized skills for specific tasks:

| Skill | Purpose |
|-------|---------|
| `api-design` | REST API design patterns, status codes, pagination |
| `article-writing` | Long-form content, guides, blog posts |
| `backend-patterns` | Node.js, Express, Next.js API patterns |
| `bun-runtime` | Bun as runtime, package manager, bundler |
| `claude-api` | Anthropic Claude API integration |
| `coding-standards` | TypeScript, JavaScript, React best practices |
| `content-engine` | Multi-platform content creation |
| `crosspost` | Distribute content across X, LinkedIn, Threads |
| `deep-research` | Multi-source research with citations |
| `dmux-workflows` | Multi-agent orchestration |
| `documentation-lookup` | Live docs via Context7 MCP |
| `e2e-testing` | Playwright E2E testing patterns |
| `eval-harness` | Evaluation framework |
| `exa-search` | Neural web search |
| `fal-ai-media` | AI image/video/audio generation |
| `frontend-patterns` | React, Next.js, state management |
| `frontend-slides` | HTML presentation creation |
| `investor-materials` | Pitch decks, financial models |
| `investor-outreach` | Investor emails, outreach |
| `market-research` | Competitive analysis |
| `mcp-server-patterns` | MCP server building |
| `nextjs-turbopack` | Next.js 16+ with Turbopack |
| `security-review` | Security checklist |
| `strategic-compact` | Context compaction |
| `tdd-workflow` | Test-driven development |
| `everything-claude-code-conventions` | Project conventions |

### Roadmap Management
| Command | Description |
|---------|-------------|
| `/bootstrap` | End-to-end project bootstrap with wave-based orchestration |
| `/inject` | Incrementally inject new requirements into roadmap |
| `/validate-roadmap` | Adversarial review and validation of roadmap |
| `/routine` | Execute roadmap Phase/Day with atomic checkpointing |
| `/plan` | Create implementation plan with risk assessment |

### Execution & Development
| Command | Description |
|---------|-------------|
| `/execute` | Execute approved plan or ad-hoc task |
| `/tdd` | Enforce TDD workflow with 80%+ coverage |
| `/test-coverage` | Analyze and improve test coverage |
| `/code-review` | Review code for quality, security |
| `/refactor-clean` | Remove dead code and consolidate |

### Git & Commits
| Command | Description |
|---------|-------------|
| `/commit` | Stage work for strategic contribution drip-feeder |
| `/push` | Daily sync loop - time-warp commits for contribution graph |
| `/checkpoint` | Save verification state and progress checkpoint |

### Security & Quality
| Command | Description |
|---------|-------------|
| `/security` | Run comprehensive security review |
| `/debate` | Adversarial debate between agents for hardened solution |
| `/eval` | Run evaluation against acceptance criteria |

### Research & Analysis
| Command | Description |
|---------|-------------|
| `/research` | Adversarial research loop using MCP web search |
| `/sitrep` | Fast situational report of workspace state |
| `/context-budget` | Analyze context window usage, find optimization |

### Documentation
| Command | Description |
|---------|-------------|
| `/update-docs` | Update documentation for recent changes |

### Sessions
| Command | Description |
|---------|-------------|
| `/sessions` | Manage session history, aliases, metadata |
| `/save-session` | Save current session state |
| `/resume-session` | Load and resume from saved session |

### Utilities
| Command | Description |
|---------|-------------|
| `/aside` | Answer quick side question without losing context |

---

## MCP Servers (Pre-configured)

CheatScale includes pre-configured MCP server integrations:

| Server | Purpose |
|--------|---------|
| `github` | PRs, issues, repo operations |
| `context7` | Live documentation lookup |
| `exa` | Neural web search |
| `memory` | Persistent memory across sessions |
| `playwright` | Browser automation & testing |
| `sequential-thinking` | Chain-of-thought reasoning |
| `obsidian` | Vault integration for roadmap linking |
| `firecrawl` | Web scraping |
| `supabase` | Database operations |
| `omega-memory` | Semantic search memory |
| `vercel` | Deployment management |
| `railway` | Railway deployments |
| `cloudflare` | Workers, builds, bindings |
| `clickhouse` | Analytics queries |
| `exa-web-search` | Research search |
| `magic` | Magic UI components |
| `filesystem` | File system operations |
| `insaits` | AI security monitoring |
| `fal-ai` | AI image/video/audio |
| `browserbase` | Cloud browser sessions |
| `browser-use` | AI browser agent |
| `devfleet` | Multi-agent orchestration |
| `token-optimizer` | Context compression |
| `laraplugins` | Laravel package discovery |
| `confluence` | Confluence integration |

---

## Project Structure

```
.opencode/
├── agents/           # 24 specialized AI agents
├── commands/        # 24+ commands
├── skills/          # 25+ specialized skills
├── hooks/           # Trigger-based automations
├── contexts/        # Context presets (dev, research, review)
├── mcp-configs/    # MCP server configurations
├── plugins/         # OpenCode plugins
├── rules/           # Language-specific rules
├── scripts/         # Utility scripts
├── schemas/         # JSON schemas
├── opencode.json    # Main configuration
├── RULES.md         # Core rules & wave protocols
├── SOUL.md          # Core principles
└── .mcp.json        # Active MCP servers
```

### Core Configuration Files

| File | Purpose |
|------|---------|
| `opencode.json` | Agent registry, tool permissions, default agent |
| `RULES.md` | Wave-based dispatch protocol, file scope rules |
| `SOUL.md` | Core principles and philosophy |
| `.mcp.json` | Active MCP server configurations |

### Context Presets

| Context | Use For |
|---------|---------|
| `dev.md` | Development workflow context |
| `research.md` | Research task context |
| `review.md` | Code review context |

---

**CheatScale** - Enterprise velocity, apparent productivity, maximum efficiency.