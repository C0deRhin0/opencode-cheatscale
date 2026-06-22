#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const HARNESS_ROOT = path.resolve(__dirname, '..');
const WORKSPACE_ROOT = path.resolve(HARNESS_ROOT, '..');
const SOURCE_AGENTS_ROOT = path.join(HARNESS_ROOT, 'agents');
const SOURCE_SKILLS_ROOT = path.join(HARNESS_ROOT, 'skills');
const SOURCE_HOOKS_ROOT = path.join(HARNESS_ROOT, 'scripts', 'harness-hooks');
const SOURCE_LOOP_CONTRACTS_ROOT = path.join(HARNESS_ROOT, 'loop-contracts');
const MANAGED_MARKER = 'OCS-PORTABLE-MANAGED';
const EXPORTER_VERSION = '1.0.0';
const TARGETS = ['portable', 'claude', 'codex', 'gemini'];
const CLAUDE_PAIRED_READ_DENY_PATHS = [
  '.env', '.env.*', '.npmrc', '.pypirc', '.netrc', '.aws/credentials', '.kube/config',
  '.config/gh/hosts.yml', '.config/gh/config.yml', '.docker/config.json', '.git-credentials', '.config/gcloud/application_default_credentials.json', '.azure/accessTokens.json', '.terraform.d/credentials.tfrc.json',
];
const readDenyPair = (relPath) => [`Read(./${relPath})`, `Read(./**/${relPath})`];

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function pathIsInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function readText(filePath, fallback = '') {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return fallback;
  }
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function parseArgs(argv) {
  const options = {
    projectRoot: WORKSPACE_ROOT,
    targets: [],
    dryRun: false,
    force: false,
    backup: true,
    listTargets: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    const next = argv[index + 1];
    if (item === '--help' || item === '-h') {
      options.help = true;
    } else if (item === '--list-targets') {
      options.listTargets = true;
    } else if (item === '--dry-run') {
      options.dryRun = true;
    } else if (item === '--force') {
      options.force = true;
    } else if (item === '--no-backup') {
      options.backup = false;
    } else if (item === '--backup') {
      options.backup = true;
    } else if (item === '--project' || item === '-p') {
      if (!next) throw new Error(`${item} requires a path`);
      options.projectRoot = path.resolve(next);
      index += 1;
    } else if (item === '--target' || item === '-t') {
      if (!next) throw new Error(`${item} requires a target`);
      options.targets.push(...next.split(',').map((target) => target.trim()).filter(Boolean));
      index += 1;
    } else {
      throw new Error(`Unknown option: ${item}`);
    }
  }

  if (options.targets.length === 0) options.targets = ['all'];
  return options;
}

function normalizeTargets(rawTargets) {
  const normalized = new Set();
  for (const raw of rawTargets) {
    const target = String(raw).toLowerCase();
    if (target === 'all') {
      TARGETS.forEach((entry) => normalized.add(entry));
      continue;
    }
    if (target === 'opencode') {
      normalized.add('portable');
      continue;
    }
    if (!TARGETS.includes(target)) throw new Error(`Unsupported target: ${raw}`);
    normalized.add(target);
  }

  if ([...normalized].some((target) => target !== 'portable')) normalized.add('portable');
  return TARGETS.filter((target) => normalized.has(target));
}

function usage() {
  return `OpenCode CheatScale portable harness exporter\n\nUsage:\n  node .opencode/scripts/portable-harness.cjs --target claude --project /path/to/project\n  .opencode/install.sh --target all --dry-run\n\nTargets:\n  portable   AGENTS.md, .agents/agents, .agents/skills, shared hook scripts, loop contracts, adapter registry\n  claude     Claude Code bridge: CLAUDE.md, .claude/settings.json, .claude/skills\n  codex      Codex bridge: .codex/config.toml, .codex/hooks.json\n  gemini     Gemini/Antigravity bridge: GEMINI.md, .gemini/settings.json\n  all        portable + claude + codex + gemini\n\nOptions:\n  --project, -p PATH   Target project root (default: parent of .opencode)\n  --target, -t NAME    Target adapter; comma-separated values are allowed\n  --dry-run           Print planned writes without touching files\n  --force             Overwrite unmanaged existing files after backing them up\n  --no-backup         Disable backups when overwriting\n  --list-targets      Show target capability registry\n`;
}

function createState(projectRoot, options) {
  const manifestPath = path.join(projectRoot, '.agents', 'harness-manifest.json');
  const previousManifest = readJson(manifestPath, { files: [] }) || { files: [] };
  const previousEntries = new Map();
  if (previousManifest.managedMarker === MANAGED_MARKER && Array.isArray(previousManifest.files)) {
    for (const entry of previousManifest.files) {
      if (entry && typeof entry.path === 'string' && typeof entry.sha256 === 'string') {
        previousEntries.set(entry.path, {
          path: entry.path,
          sha256: entry.sha256,
          kind: typeof entry.kind === 'string' ? entry.kind : 'file',
        });
      }
    }
  }
  return {
    projectRoot,
    options,
    planned: [],
    written: [],
    unchanged: [],
    skipped: [],
    backups: [],
    errors: [],
    managedEntries: [],
    previousEntries,
    timestamp: new Date().toISOString().replace(/[:.]/g, '-'),
  };
}

function assertNoSymlinkComponents(projectRoot, abs, relPath) {
  if (!fs.existsSync(projectRoot)) {
    throw new Error(`Target project root does not exist: ${projectRoot}`);
  }

  const realProjectRoot = fs.realpathSync(projectRoot);
  const parts = toPosix(path.normalize(relPath)).split('/').filter(Boolean);
  let current = projectRoot;

  for (const part of parts) {
    current = path.join(current, part);
    if (!fs.existsSync(current)) break;

    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink()) {
      throw new Error(`Refusing to write through symlink path component: ${relPath}`);
    }

    if (stat.isDirectory()) {
      const realCurrent = fs.realpathSync(current);
      if (!pathIsInside(realProjectRoot, realCurrent)) {
        throw new Error(`Refusing to write outside target project: ${relPath}`);
      }
    }
  }

  let existingParent = path.dirname(abs);
  while (!fs.existsSync(existingParent)) {
    const nextParent = path.dirname(existingParent);
    if (nextParent === existingParent) break;
    existingParent = nextParent;
  }

  const realParent = fs.realpathSync(existingParent);
  if (!pathIsInside(realProjectRoot, realParent)) {
    throw new Error(`Refusing to write outside target project: ${relPath}`);
  }
}

function safeTargetPath(projectRoot, relPath) {
  const normalized = toPosix(path.normalize(relPath));
  if (normalized.startsWith('../') || normalized === '..' || path.isAbsolute(relPath)) {
    throw new Error(`Unsafe relative path: ${relPath}`);
  }
  const abs = path.resolve(projectRoot, relPath);
  if (!abs.startsWith(projectRoot + path.sep) && abs !== projectRoot) {
    throw new Error(`Refusing to write outside target project: ${relPath}`);
  }
  assertNoSymlinkComponents(projectRoot, abs, normalized);
  return abs;
}

function backupExisting(abs, relPath, state) {
  if (!state.options.backup || !fs.existsSync(abs)) return;
  const backupPath = safeTargetPath(
    state.projectRoot,
    path.join('.agents', 'local', 'backups', `ocs-portable-${state.timestamp}`, relPath)
  );
  state.backups.push(toPosix(path.relative(state.projectRoot, backupPath)));
  if (state.options.dryRun) return;
  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  fs.copyFileSync(abs, backupPath);
}

function writeManagedFile(state, relPath, content, kind = 'file', track = true) {
  const abs = safeTargetPath(state.projectRoot, relPath);
  const posixRel = toPosix(relPath);
  const plannedEntry = `${posixRel} (${kind})`;
  state.planned.push(plannedEntry);

  const exists = fs.existsSync(abs);
  if (exists && fs.statSync(abs).isDirectory()) {
    state.errors.push(`Cannot write file over directory: ${posixRel}`);
    return false;
  }

  const existing = exists ? readText(abs) : '';
  if (exists && existing === content) {
    state.unchanged.push(posixRel);
    if (track) state.managedEntries.push({ path: posixRel, sha256: sha256(content), kind });
    return true;
  }

  const previousEntry = state.previousEntries.get(posixRel);
  const wasManaged = exists && (existing.includes(MANAGED_MARKER) || (previousEntry && sha256(existing) === previousEntry.sha256));
  if (exists && !wasManaged && !state.options.force) {
    state.skipped.push(`${posixRel} (existing unmanaged file; rerun with --force to replace)`);
    return false;
  }

  if (exists) backupExisting(abs, relPath, state);
  state.written.push(posixRel);
  if (track) state.managedEntries.push({ path: posixRel, sha256: sha256(content), kind });
  if (state.options.dryRun) return true;

  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
  return true;
}

function listFilesRecursive(baseDir, subdir = '') {
  const absDir = path.join(baseDir, subdir);
  if (!fs.existsSync(absDir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
    if (entry.name === '.DS_Store') continue;
    if (entry.isSymbolicLink()) continue;
    if (['node_modules', 'dist', 'local', '.git'].includes(entry.name)) continue;
    const rel = path.join(subdir, entry.name);
    if (entry.isDirectory()) out.push(...listFilesRecursive(baseDir, rel));
    else out.push(rel);
  }
  return out;
}

function listSkillNames() {
  if (!fs.existsSync(SOURCE_SKILLS_ROOT)) return [];
  return fs
    .readdirSync(SOURCE_SKILLS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => fs.existsSync(path.join(SOURCE_SKILLS_ROOT, name, 'SKILL.md')))
    .sort();
}

function shouldCopySkillFile(skillName, relFile) {
  const rel = toPosix(relFile);
  if (rel === 'gotchas.md' || rel.endsWith('/gotchas.md')) return false;
  if (/\.env(?:\.|$)/.test(rel)) return false;
  if (/secret|token|credential/i.test(rel) && !rel.endsWith('SKILL.md')) return false;
  return Boolean(skillName);
}

function shouldCopyAgentPromptFile(relFile) {
  const rel = toPosix(relFile);
  if (!rel.endsWith('.md')) return false;
  if (/\.env(?:\.|$)/.test(rel)) return false;
  if (/secret|token|credential/i.test(rel)) return false;
  return true;
}

function copyAgentPrompts(state, targetRootRel, kind) {
  for (const relFile of listFilesRecursive(SOURCE_AGENTS_ROOT)) {
    if (!shouldCopyAgentPromptFile(relFile)) continue;
    const content = readText(path.join(SOURCE_AGENTS_ROOT, relFile));
    writeManagedFile(state, path.join(targetRootRel, relFile), content, kind);
  }
}

function copySkills(state, targetRootRel, kind) {
  for (const skillName of listSkillNames()) {
    const sourceRoot = path.join(SOURCE_SKILLS_ROOT, skillName);
    for (const relFile of listFilesRecursive(sourceRoot)) {
      if (!shouldCopySkillFile(skillName, relFile)) continue;
      const content = readText(path.join(sourceRoot, relFile));
      writeManagedFile(state, path.join(targetRootRel, skillName, relFile), content, kind);
    }
  }
}

function copySharedHooks(state) {
  for (const relFile of listFilesRecursive(SOURCE_HOOKS_ROOT)) {
    if (!relFile.endsWith('.cjs')) continue;
    const content = readText(path.join(SOURCE_HOOKS_ROOT, relFile));
    writeManagedFile(state, path.join('.agents', 'harness-hooks', relFile), content, 'shared-hook');
  }
}

function copyLoopContracts(state) {
  for (const relFile of listFilesRecursive(SOURCE_LOOP_CONTRACTS_ROOT)) {
    if (!/\.(md|json|ya?ml)$/.test(relFile)) continue;
    const content = readText(path.join(SOURCE_LOOP_CONTRACTS_ROOT, relFile));
    writeManagedFile(state, path.join('.agents', 'loop-contracts', relFile), content, 'loop-contract');
  }
}

function renderPortableAgents() {
  const sourceAgents = readText(path.join(HARNESS_ROOT, 'AGENTS.md')).trim();
  return `<!-- ${MANAGED_MARKER}: generated from .opencode by portable-harness.cjs -->\n# CheatScale Portable Agent Instructions\n\nThis file is the vendor-neutral instruction bridge for the OpenCode CheatScale harness. It is generated from the active .opencode harness so Codex, Gemini/Antigravity, Claude Code, OpenCode, and other AGENTS.md-aware tools can share the same operating model.\n\n## Portable layout\n\n- Shared instructions: AGENTS.md\n- Shared agent prompts: .agents/agents/*.md\n- Shared skills: .agents/skills/<name>/SKILL.md\n- Shared hook scripts: .agents/harness-hooks/*.cjs\n- Shared loop contracts: .agents/loop-contracts/*\n- Adapter registry: .agents/harness-adapters.json\n- Local-only state: .agents/local/ or .opencode/local/; do not commit it\n\n## Portability rules\n\n- Treat .agents/agents as the portable source for full specialist agent prompt files. Platform-specific native subagent mirrors may be generated from it.\n- Treat .agents/skills as the portable skill source. Platform-specific skill mirrors may be generated from it.\n- Treat .agents/loop-contracts as the portable source for loop templates, reviewer schemas, worktree protocol, and benchmark specs.\n- Do not copy secrets, traces, gotcha state, local JIRA config, or generated diagnostics into source control.\n- Portable hooks block sensitive shell/file-tool targets when adapters pass path payloads; where native read-deny rules are unavailable, this policy remains mandatory.\n- Platform adapters are thin wrappers. If an adapter and this file conflict, prefer this file for behavior and the adapter for platform mechanics.\n- Keep deterministic slash-command behavior in native harnesses; use skills for progressive disclosure and cross-platform reuse.\n\n---\n\n${sourceAgents}\n`;
}

function renderPortabilityReadme(targets) {
  return `# CheatScale Portable Harness\n\n${MANAGED_MARKER}\n\nGenerated adapters: ${targets.join(', ')}\n\n## Source of truth\n\nOpenCode remains the authoring harness in .opencode/. The portable layer exposes the reusable parts through:\n\n- AGENTS.md for shared instructions\n- .agents/agents/ for full specialist agent prompt files\n- .agents/skills/ for cross-platform Agent Skills\n- .agents/harness-hooks/ for deterministic hook scripts\n- .agents/loop-contracts/ for loop contracts, verification records, reviewer schemas, worktree protocols, and benchmark templates\n- .agents/harness-adapters.json for target capability mapping\n\n## Re-run\n\nFrom the source harness:\n\n\`\`\`bash\n.opencode/install.sh --target all --project /path/to/project --dry-run\n.opencode/install.sh --target all --project /path/to/project\n\`\`\`\n\nExisting unmanaged files are not overwritten unless you pass --force. Overwritten files are backed up under .agents/local/backups/, which should remain local-only.\n`;
}

function adapterRegistry() {
  return {
    managedMarker: MANAGED_MARKER,
    exporterVersion: EXPORTER_VERSION,
    portableBase: {
      instructions: 'AGENTS.md',
      agents: '.agents/agents',
      skills: '.agents/skills',
      hooks: '.agents/harness-hooks',
      loopContracts: '.agents/loop-contracts',
      localState: '.agents/local',
    },
    targets: {
      opencode: {
        nativeDirectory: '.opencode',
        instructions: true,
        agents: true,
        skills: true,
        hooks: 'native TypeScript plugin plus optional shared scripts',
        commands: true,
        mcp: 'native opencode.json mcp object',
      },
      claude: {
        instructions: 'CLAUDE.md imports AGENTS.md',
        agents: true,
        skills: true,
        hooks: true,
        commands: 'skills and natural-language invocation; deterministic slash commands are not copied 1:1',
        mcp: 'manual or .mcp.json, not auto-enabled by exporter',
      },
      codex: {
        instructions: 'AGENTS.md',
        agents: true,
        skills: true,
        hooks: true,
        readDeny: 'portable hooks block sensitive file-tool targets when hook payloads include paths; AGENTS.md policy remains the fallback where adapters do not enforce read-deny rules natively',
        commands: 'partial; prefer skills or Codex workflows',
        mcp: 'manual mcp_servers config, not auto-enabled by exporter',
      },
      gemini: {
        instructions: 'GEMINI.md imports AGENTS.md and settings prefer AGENTS.md',
        agents: true,
        skills: true,
        hooks: true,
        readDeny: 'portable hooks block sensitive file-tool targets when hook payloads include paths; AGENTS.md policy remains the fallback where adapters do not enforce read-deny rules natively',
        commands: 'partial; prefer skills and Gemini custom commands',
        mcp: 'manual MCP setup, not auto-enabled by exporter',
      },
    },
    nonPortableByDefault: [
      '.opencode/local/**',
      '.opencode/scripts/jira-sync/jira-config.env',
      '.opencode/skills/gotcha/gotchas.md',
      'trace buffers',
      'provider credentials',
    ],
  };
}

function renderClaudeSettings() {
  return `${JSON.stringify({
    '$schema': 'https://json.schemastore.org/claude-code-settings.json',
    'x-ocs-managed': MANAGED_MARKER,
    permissions: {
      allow: [
        'Read(./AGENTS.md)',
        'Read(./CLAUDE.md)',
        'Read(./.agents/PORTABILITY.md)',
        'Read(./.agents/harness-adapters.json)',
        'Read(./.agents/agents/**)',
        'Read(./.agents/harness-hooks/**)',
        'Read(./.agents/loop-contracts/**)',
        'Read(./.agents/skills/**)',
        'Bash(node ./.agents/harness-hooks/*.cjs *)',
      ],
      deny: [
        ...CLAUDE_PAIRED_READ_DENY_PATHS.flatMap(readDenyPair),
        'Read(./**/*config.env)',
        'Read(./**/jira-config.env)',
        'Read(./.ssh/**)',
        'Read(./**/.ssh/**)',
        'Read(./**/id_rsa)',
        'Read(./**/id_dsa)',
        'Read(./**/id_ecdsa)',
        'Read(./**/id_ed25519)',
        'Read(./*credential*)',
        'Read(./**/*credential*)',
        'Read(./*secret*)',
        'Read(./**/*secret*)',
        'Read(./*token*)',
        'Read(./**/*token*)',
        'Read(./.agents/local/**)',
        'Read(./.agents/backups/**)',
        'Read(./.opencode/local/**)',
        'Read(./.opencode/scripts/jira-sync/jira-config.env)',
      ],
    },
    hooks: {
      SessionStart: [
        {
          matcher: 'startup|resume|clear',
          hooks: [
            {
              type: 'command',
              command: 'node',
              args: ['${CLAUDE_PROJECT_DIR}/.agents/harness-hooks/session-context.cjs', '--platform', 'claude'],
              timeout: 30,
              statusMessage: 'Loading OCS portable context',
            },
          ],
        },
      ],
      PreToolUse: [
        {
          matcher: 'Bash',
          hooks: [
            {
              type: 'command',
              command: 'node',
              args: ['${CLAUDE_PROJECT_DIR}/.agents/harness-hooks/pre-tool-policy.cjs', '--platform', 'claude'],
              timeout: 30,
              statusMessage: 'Checking OCS command policy',
            },
          ],
        },
      ],
      PermissionRequest: [
        {
          matcher: 'Bash',
          hooks: [
            {
              type: 'command',
              command: 'node',
              args: ['${CLAUDE_PROJECT_DIR}/.agents/harness-hooks/pre-tool-policy.cjs', '--platform', 'claude'],
              timeout: 30,
              statusMessage: 'Reviewing OCS permission request',
            },
          ],
        },
      ],
      PostToolUse: [
        {
          matcher: 'Bash|Edit|Write',
          hooks: [
            {
              type: 'command',
              command: 'node',
              args: ['${CLAUDE_PROJECT_DIR}/.agents/harness-hooks/redact-trace.cjs', '--platform', 'claude'],
              timeout: 30,
              statusMessage: 'Recording redacted OCS trace when enabled',
            },
          ],
        },
      ],
    },
  }, null, 2)}\n`;
}

function renderClaudeMd() {
  return `<!-- ${MANAGED_MARKER}: generated from .opencode by portable-harness.cjs -->\n@AGENTS.md\n\n## Claude Code Adapter\n\n- Full specialist agent prompts are available in .agents/agents for reference or platform-native conversion.\n- Project skills are mirrored into .claude/skills from .agents/skills for Claude Code discovery.\n- Hooks in .claude/settings.json call shared scripts in .agents/harness-hooks.\n- Keep CLAUDE.local.md for private local preferences only.\n`;
}

function renderAgentsGitignore() {
  return `# ${MANAGED_MARKER}: local-only portable harness state
local/
backups/
*.env
*.env.*
*credential*
*secret*
*token*
*.tmp
`;
}

function rootCommandExpression(scriptName, platform) {
  return `PROJECT_ROOT=\"$PWD\"; while [ \"$PROJECT_ROOT\" != \"$(dirname \"$PROJECT_ROOT\")\" ] && [ ! -d \"$PROJECT_ROOT/.agents/harness-hooks\" ]; do PROJECT_ROOT=\"$(dirname \"$PROJECT_ROOT\")\"; done; if [ ! -d \"$PROJECT_ROOT/.agents/harness-hooks\" ]; then PROJECT_ROOT=\"$(git rev-parse --show-toplevel 2>/dev/null || pwd)\"; fi; node \"$PROJECT_ROOT/.agents/harness-hooks/${scriptName}\" --platform ${platform}`;
}

function renderCodexConfig() {
  return `# ${MANAGED_MARKER}: generated from .opencode by portable-harness.cjs\napproval_policy = \"on-request\"\nsandbox_mode = \"workspace-write\"\nweb_search = \"cached\"\nproject_doc_fallback_filenames = [\"CLAUDE.md\", \"GEMINI.md\"]\nproject_doc_max_bytes = 65536\n\n[features]\nhooks = true\nmulti_agent = true\nshell_tool = true\n\n[analytics]\nenabled = false\n`;
}

function renderCodexHooks() {
  return `${JSON.stringify({
    'x-ocs-managed': MANAGED_MARKER,
    hooks: {
      SessionStart: [
        {
          matcher: 'startup|resume|clear|compact',
          hooks: [
            {
              type: 'command',
              command: rootCommandExpression('session-context.cjs', 'codex'),
              timeout: 30,
              statusMessage: 'Loading OCS portable context',
            },
          ],
        },
      ],
      PreToolUse: [
        {
          matcher: 'Bash|Read|Glob|Grep|Edit|Write|apply_patch',
          hooks: [
            {
              type: 'command',
              command: rootCommandExpression('pre-tool-policy.cjs', 'codex'),
              timeout: 30,
              statusMessage: 'Checking OCS command policy',
            },
          ],
        },
      ],
      PermissionRequest: [
        {
          matcher: 'Bash|Read|Glob|Grep|Edit|Write|apply_patch',
          hooks: [
            {
              type: 'command',
              command: rootCommandExpression('pre-tool-policy.cjs', 'codex'),
              timeout: 30,
              statusMessage: 'Reviewing OCS permission request',
            },
          ],
        },
      ],
      PostToolUse: [
        {
          matcher: 'Bash|Edit|Write|apply_patch',
          hooks: [
            {
              type: 'command',
              command: rootCommandExpression('redact-trace.cjs', 'codex'),
              timeout: 30,
              statusMessage: 'Recording redacted OCS trace when enabled',
            },
          ],
        },
      ],
    },
  }, null, 2)}\n`;
}

function renderGeminiMd() {
  return `<!-- ${MANAGED_MARKER}: generated from .opencode by portable-harness.cjs -->\n# Gemini Adapter\n\n@AGENTS.md\n\nGemini/Antigravity should treat AGENTS.md as the shared source of truth, .agents/agents as the specialist prompt library, and .agents/skills as the portable skill library.\n`;
}

function renderGeminiSettings() {
  return `${JSON.stringify({
    'x-ocs-managed': MANAGED_MARKER,
    context: {
      fileName: ['AGENTS.md', 'GEMINI.md'],
    },
    skills: {
      enabled: true,
    },
    hooksConfig: {
      enabled: true,
      notifications: true,
    },
    general: {
      defaultApprovalMode: 'default',
      plan: {
        enabled: true,
      },
    },
    security: {
      disableYoloMode: true,
      enablePermanentToolApproval: false,
      folderTrust: {
        enabled: true,
      },
    },
    hooks: {
      SessionStart: [
        {
          matcher: 'startup',
          sequential: true,
          hooks: [
            {
              type: 'command',
              name: 'ocs-session-context',
              command: rootCommandExpression('session-context.cjs', 'gemini'),
              timeout: 30000,
              description: 'Inject portable OCS session context',
            },
          ],
        },
      ],
      BeforeTool: [
        {
          matcher: 'run_shell_command|shell|read_file|write_file|replace|glob|grep|.*bash.*',
          sequential: true,
          hooks: [
            {
              type: 'command',
              name: 'ocs-pre-tool-policy',
              command: rootCommandExpression('pre-tool-policy.cjs', 'gemini'),
              timeout: 30000,
              description: 'Block destructive shell commands, remote payload execution, chmod 777, and sensitive file-tool targets, then surface gotchas',
            },
          ],
        },
      ],
      AfterTool: [
        {
          matcher: 'run_shell_command|shell|write_file|replace|.*bash.*',
          sequential: true,
          hooks: [
            {
              type: 'command',
              name: 'ocs-redact-trace',
              command: rootCommandExpression('redact-trace.cjs', 'gemini'),
              timeout: 30000,
              description: 'Write redacted local trace only when OCS_TRACE_CAPTURE=1',
            },
          ],
        },
      ],
    },
  }, null, 2)}\n`;
}

function installPortable(state, targets) {
  writeManagedFile(state, 'AGENTS.md', renderPortableAgents(), 'portable-instructions');
  writeManagedFile(state, path.join('.agents', '.gitignore'), renderAgentsGitignore(), 'local-state-gitignore');
  writeManagedFile(state, path.join('.agents', 'PORTABILITY.md'), renderPortabilityReadme(targets), 'portable-doc');
  writeManagedFile(
    state,
    path.join('.agents', 'harness-adapters.json'),
    `${JSON.stringify(adapterRegistry(), null, 2)}\n`,
    'adapter-registry'
  );
  copySharedHooks(state);
  copyLoopContracts(state);
  copyAgentPrompts(state, path.join('.agents', 'agents'), 'portable-agent');
  copySkills(state, path.join('.agents', 'skills'), 'portable-skill');
}

function installClaude(state) {
  writeManagedFile(state, 'CLAUDE.md', renderClaudeMd(), 'claude-instructions');
  writeManagedFile(state, path.join('.claude', 'settings.json'), renderClaudeSettings(), 'claude-settings');
  copySkills(state, path.join('.claude', 'skills'), 'claude-skill-mirror');
}

function installCodex(state) {
  writeManagedFile(state, path.join('.codex', 'config.toml'), renderCodexConfig(), 'codex-config');
  writeManagedFile(state, path.join('.codex', 'hooks.json'), renderCodexHooks(), 'codex-hooks');
}

function installGemini(state) {
  writeManagedFile(state, 'GEMINI.md', renderGeminiMd(), 'gemini-instructions');
  writeManagedFile(state, path.join('.gemini', 'settings.json'), renderGeminiSettings(), 'gemini-settings');
}

function collectManifestEntries(state) {
  const entries = new Map();
  for (const entry of state.managedEntries) entries.set(entry.path, entry);

  for (const previousEntry of state.previousEntries.values()) {
    if (entries.has(previousEntry.path)) continue;

    let abs;
    try {
      abs = safeTargetPath(state.projectRoot, previousEntry.path);
    } catch {
      continue;
    }
    if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) continue;

    const existing = readText(abs);
    const existingSha = sha256(existing);
    if (existingSha === previousEntry.sha256 || existing.includes(MANAGED_MARKER)) {
      entries.set(previousEntry.path, {
        path: previousEntry.path,
        sha256: existingSha,
        kind: previousEntry.kind,
      });
    }
  }

  return [...entries.values()].sort((left, right) => left.path.localeCompare(right.path));
}

function writeManifest(state, targets) {
  const manifest = {
    managedMarker: MANAGED_MARKER,
    exporterVersion: EXPORTER_VERSION,
    generatedAt: new Date().toISOString(),
    sourceHarness: '.opencode',
    targets,
    files: collectManifestEntries(state),
    excluded: adapterRegistry().nonPortableByDefault,
  };
  writeManagedFile(
    state,
    path.join('.agents', 'harness-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'manifest',
    false
  );
}

function printSummary(state, targets) {
  const mode = state.options.dryRun ? 'DRY RUN' : 'COMPLETE';
  console.log(`OCS portable harness export: ${mode}`);
  console.log(`Project: ${state.projectRoot}`);
  console.log(`Targets: ${targets.join(', ')}`);
  console.log(`Planned: ${state.planned.length}`);
  console.log(`Written: ${state.options.dryRun ? 0 : state.written.length}`);
  console.log(`Unchanged: ${state.unchanged.length}`);
  console.log(`Skipped: ${state.skipped.length}`);
  console.log(`Backups: ${state.backups.length}`);
  if (state.planned.length > 0) {
    console.log('\nPlanned files:');
    for (const entry of state.planned.slice(0, 40)) console.log(`- ${entry}`);
    if (state.planned.length > 40) console.log(`- ... ${state.planned.length - 40} more`);
  }
  if (state.skipped.length > 0) {
    console.log('\nSkipped files:');
    for (const entry of state.skipped) console.log(`- ${entry}`);
  }
  if (state.backups.length > 0) {
    console.log('\nBackups:');
    for (const entry of state.backups) console.log(`- ${entry}`);
  }
  if (state.errors.length > 0) {
    console.log('\nErrors:');
    for (const entry of state.errors) console.log(`- ${entry}`);
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  if (options.listTargets) {
    console.log(JSON.stringify(adapterRegistry().targets, null, 2));
    return;
  }

  const targets = normalizeTargets(options.targets);
  const state = createState(options.projectRoot, options);

  if (targets.includes('portable')) installPortable(state, targets);
  if (targets.includes('claude')) installClaude(state);
  if (targets.includes('codex')) installCodex(state);
  if (targets.includes('gemini')) installGemini(state);
  writeManifest(state, targets);

  printSummary(state, targets);
  if (state.errors.length > 0) process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(`portable-harness error: ${error.message}`);
  process.exit(1);
}
