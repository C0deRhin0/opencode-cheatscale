# Plans Directory

This is the **roadmap and planning root** - all project planning, specifications, and context files live here.

---

## Purpose

- **Roadmaps**: Feature-specific roadmaps with phases, days, tasks
- **Research**: Project briefs, tech stack analysis
- **Conventions**: Coding standards, project rules
- **Instructions**: Workspace boundaries, agent authority
- **Obsidian Integration**: Frontmatter-enabled files for graph view

---

## Structure

```
plans/
├── core/                    # Main project roadmap
│   ├── idea_research.md     # Project brief (frontmatter: [research, core])
│   ├── coding_convention.md # Tech-stack rules (frontmatter: [convention, core])
│   ├── INSTRUCTIONS.md      # Project instructions (frontmatter: [instructions, core])
│   └── roadmap.md           # Full roadmap (frontmatter: [roadmap, core])
├── billing/                 # Billing feature roadmap
├── auth/                    # Authentication feature roadmap
├── <feature>/                   # <feature> roadmap
└── [feature]/               # Any new feature roadmap
```

---

## File Types

| File | Purpose |
|------|---------|
| `idea_research.md` | Project brief, goals, constraints |
| `coding_convention.md` | Tech-stack specific patterns |
| `INSTRUCTIONS.md` | Workspace rules, 3-tier architecture |
| `roadmap.md` | Phases, days, tasks, implementation plan |

---

## Usage

### Creating a New Roadmap

```bash
/bootstrap my-feature
# Creates: plans/my-feature/
# - idea_research.md
# - coding_convention.md
# - INSTRUCTIONS.md
# - roadmap.md
```

### Adding to Existing Roadmap

```bash
/inject billing add payment processing
```

### Validating Roadmap

```bash
/validate-roadmap billing
```

### Viewing in Obsidian

Configure Obsidian vault to project root (`./`) or directly to `plans/` to see all feature roadmaps with graph connections.

---

## Frontmatter

Each file includes frontmatter for Obsidian integration:

```yaml
---
tags: [type, feature-name]
scope: feature-name
---
```

This enables:
- Tag-based search in Obsidian
- Graph view connections between files
- Cross-referencing across features

---

## Important Notes

- **NEVER** write implementation code here - use `../codebase/`
- All roadmaps should reference implementation files with `codebase/` prefix
- Example task: "Implement in `codebase/src/auth/`"

---

## Related

- See `../codebase/` for implementation files
- See `../.opencode/` for AI agent configuration