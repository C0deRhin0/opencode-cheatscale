# CheatScale OpenCode Configuration

> **Foundation**: Built upon [everything-claude-code](https://github.com/affaan-m/everything-claude-code) by affaan
> 
> This project exists because of the excellent foundation provided by affaan. ~10% of patterns derived, 90% CheatScale additions.

---

## What is CheatScale?

Enterprise-grade AI development orchestration with wave-based dispatch, roadmap automation, Obsidian integration, and time-warp commit capabilities.

---

## Installation

### Quick Setup

1. **Copy `.opencode` folder** to your project root:
   ```bash
   cp -r .opencode /path/to/your/project/
   ```

2. **Start using**:
   ```bash
   opencode
   /bootstrap my-feature
   ```

That's it. No npm install needed.

---

## What's New in CheatScale

This configuration extends the foundation with:

| Feature | Description |
|---------|-------------|
| **Wave-Based Orchestration** | 6-wave execution pattern with complexity gating |
| **24 Specialized Agents** | Full enterprise roster (vs foundation's 14) |
| **Roadmap Commands** | /bootstrap, /inject, /validate-roadmap |
| **Obsidian Integration** | Auto-frontmatter for graph linking |
| **Time-Warp Commits** | /push rewrites dates for daily contribution appearance |
| **3-Tier Architecture** | Strict separation for AI testability |
| **Phase Isolation** | MANDATORY STOP after each phase |

---

## Agents (24)

### Domain Writers
| Agent | Specialty | Use For |
|-------|-----------|---------|
| architect | Backend systems | API, services, architecture |
| frontend-engineer | UI/UX | Components, pages, layouts |
| database-engineer | Schema/migrations | DB design, SQL |
| devops-engineer | CI/CD, Docker | Pipelines, deployment |
| integration-engineer | External APIs | Third-party integrations |
| ml-engineer | ML/AI | Model integration |

### Quality Agents
| Agent | Specialty | Use For |
|-------|-----------|---------|
| code-reviewer | Code quality | All implementations |
| security-reviewer | Vulnerabilities | Auth, sensitive code |
| performance-reviewer | Latency | Performance-critical |
| accessibility-reviewer | WCAG | UI components |
| qa-engineer | Test coverage | Edge cases |
| tdd-guide | Test-driven dev | Feature implementation |
| e2e-runner | E2E testing | User flows |
| build-error-resolver | Build errors | When build fails |

### Utility Agents
| Agent | Specialty |
|-------|-----------|
| planner | Task decomposition |
| refactor-cleaner | Dead code |
| doc-updater | Documentation |
| database-reviewer | PostgreSQL/Supabase |

### Wave Agents
| Agent | Specialty |
|-------|-----------|
| researcher | Investigation |
| fact-checker | Verification |
| critic | Adversarial review |
| reducer | Output synthesis |

---

## Commands (24+)

### Roadmap Management
| Command | Description |
|---------|-------------|
| `/bootstrap` | End-to-end project bootstrap |
| `/inject` | Add to existing roadmap |
| `/validate-roadmap` | Adversarial roadmap review |
| `/routine` | Execute with atomic checkpointing |
| `/plan` | Implementation plan |

### Execution
| Command | Description |
|---------|-------------|
| `/execute` | Ad-hoc task execution |
| `/tdd` | TDD workflow 80%+ |
| `/test-coverage` | Coverage analysis |
| `/code-review` | Quality review |
| `/refactor-clean` | Remove dead code |

### Git & Commits
| Command | Description |
|---------|-------------|
| `/commit` | Stage work to queue |
| `/push` | Time-warp push (dates appear daily) |
| `/checkpoint` | Save progress |

### Security & Quality
| Command | Description |
|---------|-------------|
| `/security` | Comprehensive security |
| `/debate` | Agent debate |
| `/eval` | Evaluation |

### Research & Analysis
| Command | Description |
|---------|-------------|
| `/research` | Web search research |
| `/sitrep` | Workspace status |
| `/context-budget` | Token optimization |

### Documentation
| Command | Description |
|---------|-------------|
| `/update-docs` | Sync documentation |

### Sessions
| Command | Description |
|---------|-------------|
| `/sessions` | Manage history |
| `/save-session` | Save state |
| `/resume-session` | Resume work |

### Utilities
| Command | Description |
|---------|-------------|
| `/aside` | Quick side answer |

---

## Wave-Based Orchestration

```
Phase 0: Scan & Route
    → Classify complexity (Simple/Medium/Complex)
    → Assign file scopes

Wave 1: Knowledge (if unknowns)
    → @researcher + @fact-checker

Wave 2: Domain Writers (parallel)
    → @architect, @frontend-engineer, @database-engineer...

Wave 3: Quality (parallel)
    → @critic, @qa-engineer, @security-reviewer...

Phase: Synthesis
    → Orchestrator writes to plans/
```

### Complexity Gating

| Level | Criteria | Agents |
|-------|----------|--------|
| Simple | 1 domain | 1 writer + 1 reviewer |
| Medium | 2-3 domains | Relevant + reviewers |
| Complex | 3+ domains | Full roster |

---

## MCP Servers (Pre-configured)

| Server | Purpose |
|--------|---------|
| github | PRs, issues, repos |
| obsidian | Vault integration |
| context7 | Live docs lookup |
| exa | Neural search |
| memory | Persistent memory |
| playwright | Browser automation |
| firecrawl | Web scraping |
| supabase | Database |
| vercel | Deployments |
| cloudflare | Workers |

---

## Skills (25+)

Loaded by default:
- api-design
- backend-patterns
- coding-standards
- e2e-testing
- eval-harness
- frontend-patterns
- frontend-slides
- security-review
- strategic-compact
- tdd-workflow
- verification-loop

Additional available:
- article-writing
- bun-runtime
- claude-api
- content-engine
- crosspost
- deep-research
- dmux-workflows
- exa-search
- fal-ai-media
- investor-materials
- investor-outreach
- market-research
- mcp-server-patterns
- nextjs-turbopack

---

## Project Structure

```
.opencode/
├── agents/           # 24 AI agents
├── commands/         # 24+ commands
├── skills/           # 25+ skills
├── hooks/            # Trigger automations
├── contexts/         # Context presets
├── mcp-configs/     # MCP server configs
├── plugins/           # OpenCode plugins
├── rules/             # Language rules
├── scripts/           # Utilities
├── schemas/          # JSON schemas
├── opencode.json      # Main config
├── RULES.md           # Wave protocols
├── SOUL.md            # Core principles
└── .mcp.json          # Active MCPs
```

---

## Time-Warp Commits (The Cheat)

After completing multiple tasks in one session:

```bash
/routine myfeature setup-api
/routine myfeature build-ui
/routine myfeature write-tests
```

All tasks completed in one day. Now push with time-warp:

```bash
/push
```

GitHub sees:
- Jan 1: Task 1
- Jan 2: Task 2
- Jan 3: Task 3

**Appears as 3 days of work** - hence "CheatScale"

---

## License

MIT

---

## Acknowledgments

**Primary Foundation**: [everything-claude-code](https://github.com/affaan-m/everything-claude-code) by [affaan](https://github.com/affaan)

This project was motivated and made possible by affaan's excellent open-source work. The foundation provided the inspiration and base patterns that CheatScale builds upon.

Thank you, affaan!