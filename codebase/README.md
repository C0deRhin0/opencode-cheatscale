# Codebase Directory

This is the **implementation root** - all project source code, configurations, and assets live here.

---

## Purpose

- **Implementation**: All code written by AI agents goes here
- **Git Operations**: All commits, branches, and git workflows operate within this directory
- **Build Output**: Compiled binaries, build artifacts stay here
- **Workspace**: The primary working directory for development

---

## Structure

```
codebase/
├── src/              # Source code implementation
├── tests/            # Test files (unit, integration, e2e)
├── config/           # Configuration files
├── scripts/          # Build and utility scripts
├── docs/             # Project documentation
├── assets/           # Images, fonts, static assets
├── dist/             # Build output (generated)
└── node_modules/     # Dependencies (generated)
```

---

## Usage

### Git Workflow

All git operations should be scoped to `codebase/`:
```bash
cd codebase
git add .
git commit -m "feat: add feature [scope:P1D1]"
git push
```

### AI Agent Operations

- **Architect**: Writes backend logic to `src/`
- **Frontend Engineer**: Writes UI to `src/` or `components/`
- **Database Engineer**: Writes migrations to `src/db/`
- **DevOps Engineer**: Writes configs to `config/`

### File Scope Rules

| Agent | Authorized Directory |
|-------|---------------------|
| architect | `src/`, `src/api/`, `src/services/` |
| frontend-engineer | `src/components/`, `src/pages/` |
| database-engineer | `src/db/`, `migrations/` |
| devops-engineer | `config/`, `.github/`, `docker/` |
| integration-engineer | `src/integrations/` |

---

## Important Notes

- **NEVER** create source files in `plans/` - they belong here
- All file paths in roadmaps should reference `codebase/` prefix
- Example task: "Implement auth in `codebase/src/auth/`"

---

## Related

- See `../plans/` for roadmap and planning files
- See `../.opencode/` for AI agent configuration