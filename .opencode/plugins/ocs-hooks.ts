/**
 * OpenCode CheatScale (OCS) Plugin Hooks for OpenCode.
 *
 * This file intentionally uses only hook names exposed by
 * `@opencode-ai/plugin`: event, tool.execute.before/after,
 * command.execute.before, permission.ask, shell.env, and supported
 * experimental hooks.
 */

import { lstat, mkdir, readFile, realpath, writeFile } from "node:fs/promises"
import path from "node:path"
import type { Plugin } from "@opencode-ai/plugin"

type HookProfile = "minimal" | "standard" | "strict"
type GotchaEntry = {
  id: string
  pattern: string
  description: string
  category?: string
  trigger?: string
  avoidance?: string
  occurrenceCount?: number
}

type TraceEntry = {
  sessionID: string
  callID: string
  tool: string
  timestamp: string
  args: unknown
  output: string
  title?: string
}

const MAX_TRACE_ENTRIES = 50
const MAX_TRACE_OUTPUT_BYTES = 2000

const normalizeProfile = (value: string | undefined): HookProfile => {
  if (value === "minimal" || value === "strict") return value
  return "standard"
}

const redact = (value: unknown): unknown => {
  if (typeof value === "string") {
    return value
      .replace(/sk-[A-Za-z0-9_-]{10,}/g, "[REDACTED_SECRET]")
      .replace(/gh[pousr]_[A-Za-z0-9_]{10,}/g, "[REDACTED_SECRET]")
      .replace(/AKIA[0-9A-Z]{16}/g, "[REDACTED_SECRET]")
      .replace(/Bearer\s+[A-Za-z0-9._~+/=-]{10,}/gi, "Bearer [REDACTED_SECRET]")
      .replace(/Basic\s+[A-Za-z0-9+/=-]{10,}/gi, "Basic [REDACTED_SECRET]")
      .replace(/xox[baprs]-[A-Za-z0-9-]{10,}/g, "[REDACTED_SECRET]")
      .replace(/glpat-[A-Za-z0-9_-]{10,}/g, "[REDACTED_SECRET]")
      .replace(/AIza[0-9A-Za-z_-]{20,}/g, "[REDACTED_SECRET]")
      .replace(/https?:\/\/([^\s:/?#]+):([^\s@]+)@/gi, "https://[REDACTED_SECRET]@")
      .replace(/curl\s+-u\s+[^\s:]+:[^\s]+/gi, "curl -u [REDACTED_SECRET]")
      .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, "[REDACTED_PRIVATE_KEY]")
      .replace(/(token|api[_-]?key|password|secret|client[_-]?secret|refresh[_-]?token|access[_-]?token|jira[_-]?api[_-]?token|atlassian[_-]?token)\s*[=:]\s*([^\s&]+)/gi, "$1=[REDACTED_SECRET]")
      .replace(/\/Users\/[^\s`'"]+/g, "[REDACTED_PATH]")
  }

  if (Array.isArray(value)) return value.map(redact)

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        /token|key|password|secret|authorization|client_secret|refresh_token|access_token|jira|atlassian/i.test(key)
          ? "[REDACTED_SECRET]"
          : redact(entry),
      ])
    )
  }

  return value
}

const truncateForTrace = (value: unknown): unknown => {
  let serialized: string
  try {
    const next = typeof value === "string" ? value : JSON.stringify(value)
    serialized = typeof next === "string" ? next : String(next)
  } catch {
    serialized = String(value)
  }

  if (Buffer.byteLength(serialized, "utf8") <= MAX_TRACE_OUTPUT_BYTES) return value
  return `${serialized.slice(0, MAX_TRACE_OUTPUT_BYTES)}...[TRUNCATED]`
}

const serializeTraceOutput = (value: unknown): string => {
  const truncated = truncateForTrace(value)
  if (typeof truncated === "string") return truncated
  try {
    const serialized = JSON.stringify(truncated)
    return typeof serialized === "string" ? serialized : String(truncated)
  } catch {
    return String(truncated)
  }
}

const extractCommand = (args: unknown): string => {
  if (!args) return ""
  if (typeof args === "string") return args
  if (typeof args === "object" && "command" in args) {
    return String((args as { command?: unknown }).command || "")
  }
  return ""
}

const extractFilePath = (tool: string, args: unknown): string | undefined => {
  if (!args || typeof args !== "object") return undefined
  const record = args as Record<string, unknown>
  const candidate = record.filePath || record.path || record.file || record.target
  if (typeof candidate === "string") return candidate
  if ((tool === "edit" || tool === "write") && typeof record["0"] === "string") {
    return String(record["0"])
  }
  return undefined
}

const extractPermissionCommand = (input: any): string => {
  return extractCommand(input?.args) ||
    extractCommand(input?.metadata) ||
    String(input?.pattern || input?.title || input?.description || "")
}

const collectStrings = (value: unknown, depth = 0): string[] => {
  if (depth > 4 || value == null) return []
  if (typeof value === "string") return [value]
  if (Array.isArray(value)) return value.flatMap((entry) => collectStrings(entry, depth + 1))
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, entry]) => [key, ...collectStrings(entry, depth + 1)])
  }
  return []
}

const permissionTargets = (input: any): string[] => {
  return [
    input?.args,
    input?.metadata,
    input?.pattern,
    input?.path,
    input?.filePath,
    input?.file,
    input?.target,
    input?.title,
    input?.description,
  ].flatMap((entry) => collectStrings(entry))
}

const isSensitivePathReference = (value: string): boolean => {
  const normalized = value.replace(/\\/g, "/")
  return [
    /(?:^|\/)\.env(?:[.\s)'"]|\/|$)/i,
    /(?:^|\/)jira-config\.env(?:\W|$)/i,
    /(?:^|\/)[^/]*config\.env(?:\W|$)/i,
    /(?:^|\/)\.opencode\/local(?:\/|$)/i,
    /(?:^|\/)\.agents\/local(?:\/|$)/i,
    /(?:^|\/)\.agents\/backups(?:\/|$)/i,
    /credential|secret/i,
  ].some((pattern) => pattern.test(normalized))
}

const hasSensitivePermissionTarget = (input: any): boolean => permissionTargets(input).some(isSensitivePathReference)

const hasExplicitPermissionTarget = (input: any): boolean => permissionTargets(input).some((target) => /[./*]/.test(target))

const mentionsSensitiveShellPath = (command: string): boolean => {
  const normalized = command.replace(/\\/g, "/")
  return [
    /(?:^|[\s"'`(=;|<>])(?:[^\s"'`;&|<>]*\/)?\.env(?:[.\w-]*)(?=$|[\s"'`);&|<>])/i,
    /(?:^|[\s"'`(=;|<>])[^\s"'`;&|<>]*jira-config\.env(?:\W|$)/i,
    /(?:^|[\s"'`(=;|<>])[^\s"'`;&|<>]*config\.env(?:\W|$)/i,
    /(?:^|[\s"'`(=;|<>])[^\s"'`;&|<>]*\.agents\/local(?:\/|\W|$)/i,
    /(?:^|[\s"'`(=;|<>])[^\s"'`;&|<>]*\.opencode\/local(?:\/|\W|$)/i,
  ].some((pattern) => pattern.test(normalized))
}

const isSensitiveShellReadCommand = (command: string): boolean => {
  if (!mentionsSensitiveShellPath(command)) return false
  return (
    /\b(?:cat|less|more|tail|head|grep|rg|sed|awk|python|python3|node|perl|ruby|cp|mv|tar|zip|gzip|curl|wget|scp|rsync|open|source|env|printenv|export|set|bash|sh|zsh|fish|dash)\b/i.test(command) ||
    /(?:^|[;&|]\s*)\.\s+/.test(command) ||
    /[<>]/.test(command)
  )
}

const hasShellMetacharacters = (command: string): boolean => /[;&|`$<>\n\r]/.test(command)

const tokenizeCommand = (command: string): string[] => command.match(/"[^"]*"|'[^']*'|\S+/g)?.map((token) => token.replace(/^["']|["']$/g, "")) || []

const isUnsafeFormatterTarget = (token: string): boolean => {
  if (!token || token === "--") return false
  const value = token.startsWith("-") && token.includes("=")
    ? token.slice(token.indexOf("=") + 1)
    : token
  if (!value || (value.startsWith("-") && !token.includes("="))) return false
  const normalized = value.replace(/\\/g, "/")
  const collapsed = path.posix.normalize(normalized)
  const segments = normalized.split("/").filter(Boolean)
  return (
    path.isAbsolute(value) ||
    collapsed === "." ||
    collapsed === ".." ||
    collapsed.startsWith("../") ||
    segments.includes("..") ||
    normalized === "~" ||
    normalized.startsWith("~/") ||
    normalized.includes("*") ||
    isSensitivePathReference(normalized)
  )
}

const isSafeFormatterCommand = (command: string): boolean => {
  if (hasShellMetacharacters(command)) return false
  if (!/^(?:npx\s+)?(?:prettier|biome|black|gofmt|rustfmt|swift-format)(?:\s+[A-Za-z0-9_./:=@%+,-]+)*$/.test(command)) return false
  const tokens = tokenizeCommand(command)
  const formatterIndex = tokens[0] === "npx" ? 1 : 0
  const formatter = tokens[formatterIndex]
  if (!/^(?:prettier|biome|black|gofmt|rustfmt|swift-format)$/.test(formatter || "")) return false
  return !tokens.slice(formatterIndex + 1).some(isUnsafeFormatterTarget)
}

const isSafeTestCommand = (command: string): boolean => {
  if (hasShellMetacharacters(command)) return false
  return /^(?:(?:npm|pnpm|yarn|bun)\s+test|npx\s+(?:vitest|jest)|pytest|go\s+test|cargo\s+test)(?:\s+[A-Za-z0-9_./:=@%+,-]+)*$/.test(command)
}

const isJavaScriptLike = (filePath: string) => /\.(ts|tsx|js|jsx)$/i.test(filePath)

const pathIsInside = (parent: string, child: string): boolean => {
  const relative = path.relative(parent, child)
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))
}

const assertNoSymlinkComponents = async (root: string, filePath: string): Promise<void> => {
  const realRoot = await realpath(root)
  const relative = path.relative(root, filePath)
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing local state path outside harness root: ${filePath}`)
  }

  let current = root
  for (const part of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, part)
    try {
      const stats = await lstat(current)
      if (stats.isSymbolicLink()) throw new Error(`Refusing local state symlink path: ${filePath}`)
      if (stats.isDirectory() && !pathIsInside(realRoot, await realpath(current))) {
        throw new Error(`Refusing local state path outside harness root: ${filePath}`)
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") break
      throw error
    }
  }

  let existingParent = path.dirname(filePath)
  while (true) {
    try {
      if (!pathIsInside(realRoot, await realpath(existingParent))) {
        throw new Error(`Refusing local state path outside harness root: ${filePath}`)
      }
      return
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
      const nextParent = path.dirname(existingParent)
      if (nextParent === existingParent) throw error
      existingParent = nextParent
    }
  }
}

const safeReadJson = async <T>(filePath: string, fallback: T): Promise<T> => {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as T
  } catch {
    return fallback
  }
}

const matchGotchas = (gotchas: GotchaEntry[], command: string): GotchaEntry[] => {
  const normalizedCommand = command.toLowerCase()
  return gotchas.filter((gotcha) => {
    const haystack = [gotcha.pattern, gotcha.trigger, gotcha.description]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
    if (!haystack) return false
    return haystack
      .split(/[,;|]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .some((item) => normalizedCommand.includes(item) || item.includes(normalizedCommand))
  })
}

export const OCSHooksPlugin: Plugin = async ({ client, $, directory, worktree }) => {
  const currentProfile = normalizeProfile(process.env.OCS_HOOK_PROFILE)
  const disabledHooks = new Set(
    (process.env.OCS_DISABLED_HOOKS || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  )

  const profileOrder: Record<HookProfile, number> = {
    minimal: 0,
    standard: 1,
    strict: 2,
  }

  const workspaceRoot = worktree || directory
  const harnessRoot = path.basename(workspaceRoot) === ".opencode"
    ? workspaceRoot
    : path.join(workspaceRoot, ".opencode")
  const localRoot = path.join(harnessRoot, "local")
  const gotchasPath = path.join(localRoot, "gotchas.json")
  const tracePath = path.join(localRoot, "execution-traces", "ring-buffer.json")
  const editedFiles = new Set<string>()
  let traceQueue = Promise.resolve()

  const log = async (level: "debug" | "info" | "warn" | "error", message: string) => {
    try {
      await client.app.log({ body: { service: "ocs", level, message } })
    } catch {
      // Logging is best-effort and must never break the tool flow.
    }
  }

  const hookEnabled = (
    hookId: string,
    requiredProfile: HookProfile | HookProfile[] = "standard"
  ): boolean => {
    if (disabledHooks.has(hookId)) return false
    const requirements = Array.isArray(requiredProfile) ? requiredProfile : [requiredProfile]
    return requirements.some((entry) => profileOrder[currentProfile] >= profileOrder[entry])
  }

  const loadGotchas = async (): Promise<GotchaEntry[]> => {
    try {
      await assertNoSymlinkComponents(harnessRoot, gotchasPath)
    } catch (error) {
      await log("warn", `[OCS] Gotcha state skipped: ${(error as Error).message}`)
      return []
    }
    const state = await safeReadJson<{ gotchas?: GotchaEntry[] }>(gotchasPath, { gotchas: [] })
    return Array.isArray(state.gotchas) ? state.gotchas : []
  }

  const appendTrace = async (entry: TraceEntry) => {
    if (process.env.OCS_TRACE_CAPTURE !== "1") return

    const writeTrace = async () => {
      await assertNoSymlinkComponents(harnessRoot, tracePath)
      const existing = await safeReadJson<TraceEntry[]>(tracePath, [])
      const safeExisting = Array.isArray(existing) ? existing : []
      const next = [...safeExisting, entry].slice(-MAX_TRACE_ENTRIES)
      await mkdir(path.dirname(tracePath), { recursive: true })
      await writeFile(tracePath, JSON.stringify(next, null, 2))
    }

    try {
      traceQueue = traceQueue.then(writeTrace, writeTrace)
      await traceQueue
    } catch (error) {
      await log("warn", `[OCS] Trace capture skipped: ${(error as Error).message}`)
    }
  }

  const auditConsoleLog = async (filePath: string) => {
    if (!hookEnabled("post:edit:console-warn", ["standard", "strict"])) return
    if (!isJavaScriptLike(filePath)) return

    try {
      const content = await readFile(filePath, "utf8")
      const count = (content.match(/console\.log/g) || []).length
      if (count > 0) {
        await log("warn", `[OCS] console.log found in ${filePath} (${count} occurrence${count > 1 ? "s" : ""})`)
      }
    } catch {
      // File may not exist yet or may not be readable from this context.
    }
  }

  return {
    event: async ({ event }) => {
      const eventType = String((event as { type?: unknown }).type || "")
      if (hookEnabled("event:session-start", ["minimal", "standard", "strict"]) && eventType.includes("session")) {
        await log("debug", `[OCS] Event observed: ${eventType}`)
      }
    },

    "command.execute.before": async (input) => {
      if (hookEnabled("pre:command:gotcha-reminder", ["standard", "strict"]) && input.command === "gotcha") {
        await log("info", "[OCS] Gotcha command uses local-only state under .opencode/local/.")
      }
    },

    "tool.execute.before": async (input, output) => {
      const args = output.args || {}
      const command = extractCommand(args)

      if (input.tool === "bash" && command) {
        if (hookEnabled("pre:bash:git-push-reminder", "strict") && /\bgit\s+push\b/.test(command)) {
          await log("info", "[OCS] Review changes before pushing and keep drip/* tags local.")
        }

        if (
          hookEnabled("pre:bash:gotcha-check", ["standard", "strict"]) &&
          /(git\s+(commit|push|reset\s+--hard)|(?:npm|pnpm|yarn|bun)\s+publish)/.test(command)
        ) {
          const matches = matchGotchas(await loadGotchas(), command)
          for (const match of matches.slice(0, 3)) {
            await log("warn", `[OCS Gotcha] ${match.pattern}: ${match.avoidance || match.description}`)
          }
        }

        if (hookEnabled("pre:bash:tmux-reminder", "strict")) {
          if (
            /^(npm|pnpm|yarn|bun)\s+(install|build|test|run)\b/.test(command) ||
            /^cargo\s+(build|test|run)\b/.test(command) ||
            /^go\s+(build|test|run)\b/.test(command)
          ) {
            await log("info", "[OCS] Long-running command detected - consider background execution.")
          }
        }
      }

      if (
        hookEnabled("pre:write:doc-file-warning", ["standard", "strict"]) &&
        (input.tool === "write" || input.tool === "edit")
      ) {
        const filePath = extractFilePath(input.tool, args)
        if (
          filePath &&
          /\.(md|txt)$/i.test(filePath) &&
          !/(README|CHANGELOG|LICENSE|CONTRIBUTING|SKILL\.md)/.test(filePath)
        ) {
          await log("warn", `[OCS] Creating or editing ${filePath} - confirm this documentation belongs in the project docs.`)
        }
      }
    },

    "tool.execute.after": async (input, output) => {
      const filePath = extractFilePath(input.tool, input.args)
      if (filePath && (input.tool === "edit" || input.tool === "write")) {
        editedFiles.add(filePath)
        await auditConsoleLog(filePath)

        if (hookEnabled("post:edit:format", "strict") && process.env.OCS_AUTO_FORMAT === "1" && isJavaScriptLike(filePath)) {
          try {
            await $`prettier --write -- ${filePath} 2>/dev/null`
            await log("info", `[OCS] Formatted: ${filePath}`)
          } catch {
            // Formatter may not be installed in the target project.
          }
        }

        if (hookEnabled("post:edit:typecheck", "strict") && /\.tsx?$/i.test(filePath)) {
          try {
            await $`npx tsc --noEmit 2>&1`
            await log("info", "[OCS] TypeScript check passed")
          } catch (error: unknown) {
            const err = error as { stdout?: string }
            const firstLines = String(err.stdout || "").split("\n").slice(0, 5).join("\n")
            await log("warn", `[OCS] TypeScript errors detected:\n${firstLines}`)
          }
        }
      }

      const command = extractCommand(input.args)
      if (input.tool === "bash" && hookEnabled("post:bash:pr-created", ["standard", "strict"]) && /\bgh\s+pr\s+create\b/.test(command)) {
        await log("info", "[OCS] PR created - check GitHub Actions status.")
      }

      await appendTrace({
        sessionID: input.sessionID,
        callID: input.callID,
        tool: input.tool,
        timestamp: new Date().toISOString(),
        args: truncateForTrace(redact(input.args)),
        title: output.title,
        output: serializeTraceOutput(redact(output.output)),
      })
    },

    "shell.env": async (_input, output) => {
      const env: Record<string, string> = {
        OCS_VERSION: "1.9.0",
        OCS_PLUGIN: "true",
        OCS_HOOK_PROFILE: currentProfile,
        OCS_DISABLED_HOOKS: process.env.OCS_DISABLED_HOOKS || "",
        OCS_LOCAL_ROOT: localRoot,
        PROJECT_ROOT: workspaceRoot,
      }

      const packageRoots = [path.join(workspaceRoot, "codebase"), workspaceRoot]
      const lockfiles: Record<string, string> = {
        "bun.lockb": "bun",
        "pnpm-lock.yaml": "pnpm",
        "yarn.lock": "yarn",
        "package-lock.json": "npm",
      }

      for (const packageRoot of packageRoots) {
        for (const [lockfile, packageManager] of Object.entries(lockfiles)) {
          try {
            await readFile(path.join(packageRoot, lockfile), "utf8")
            env.PACKAGE_MANAGER = packageManager
            break
          } catch {
            // Try the next detector.
          }
        }
        if (env.PACKAGE_MANAGER) break
      }

      Object.assign(output.env, env)
    },

    "permission.ask": async (input: any, output) => {
      const tool = String(input.tool || input.type || "").toLowerCase()
      const command = extractPermissionCommand(input)
      await log("info", `[OCS] Permission requested for: ${tool || "unknown"}`)

      if (["read", "glob", "grep", "list"].includes(tool)) {
        if (hasSensitivePermissionTarget(input)) {
          output.status = "deny"
          await log("warn", "[OCS] Denied read-like permission request for local-only or sensitive path.")
          return
        }

        if (!hasExplicitPermissionTarget(input)) {
          await log("info", "[OCS] Ambiguous read-like permission request left for default review.")
          return
        }

        output.status = "allow"
        return
      }

      if (tool === "bash" && isSensitiveShellReadCommand(command)) {
        output.status = "deny"
        await log("warn", "[OCS] Denied bash access to sensitive local data.")
        return
      }

      if (tool === "bash" && isSafeFormatterCommand(command)) {
        output.status = "allow"
        return
      }

      if (tool === "bash" && isSafeTestCommand(command)) {
        output.status = "allow"
      }
    },

    "experimental.session.compacting": async (_input, output) => {
      output.context.push(
        [
          "# OCS Context (preserve across compaction)",
          "",
          "## Active Plugin: OpenCode CheatScale v1.9.0",
          "- Supported hooks: event, command.execute.before, tool.execute.before/after, shell.env, permission.ask, experimental.session.compacting.",
          "- Agents: 25 registered specialists plus build/orchestrator primary modes.",
          "- Commands: 35 registered slash commands, including gotcha, skill-builder, harness-optimize, loop-plan, and loop-report.",
          "- Local state: .opencode/local/ is ignored and stores gotchas/traces only when explicitly used.",
          "",
          "## Key Principles",
          "- TDD: write tests first where applicable.",
          "- Security: validate inputs and never hardcode secrets.",
          "- Drip tags: keep drip/todo/* and drip/done/* local-only.",
          editedFiles.size > 0 ? "" : undefined,
          editedFiles.size > 0 ? "## Recently Edited Files" : undefined,
          ...Array.from(editedFiles).map((file) => `- ${file}`),
        ]
          .filter(Boolean)
          .join("\n")
      )

      output.prompt = "Preserve current task status, key decisions, files changed, remaining work, gotchas encountered, and security concerns. Discard verbose intermediate tool output and duplicate listings."
    },
  }
}

export default OCSHooksPlugin
