/**
 * OpenCode CheatScale (OCS) Plugin for OpenCode
 *
 * This package provides the OCS OpenCode plugin module:
 * - Plugin hooks (auto-format, TypeScript check, console.log warning, env injection, etc.)
 * - Bundled reference config/assets for the wider OCS OpenCode setup
 *
 * Usage:
 *
 * Option 1: Install via npm
 * ```bash
 * npm install ocs-universal
 * ```
 *
 * Then add to your opencode.json:
 * ```json
 * {
 *   "plugin": ["ocs-universal"]
 * }
 * ```
 *
 * That enables the published plugin module only. For OCS commands, agents,
 * prompts, and instructions, use this repository's `.opencode/opencode.json`
 * as a base or copy the bundled `.opencode/` assets into your project.
 *
 * Option 2: Clone and use directly
 * ```bash
 * git clone <your-ocs-repository-url>
 * cd <your-ocs-repository>
 * opencode
 * ```
 *
 * @packageDocumentation
 */

// Export the main plugin
export { OCSHooksPlugin, default } from "./plugins/index.js"

// Export individual components for selective use
export * from "./plugins/index.js"

// Version export
export const VERSION = "1.9.0"

// Plugin metadata
export const metadata = {
  name: "ocs-universal",
  version: VERSION,
  description: "OpenCode CheatScale plugin for OpenCode",
  author: "C0deRhin0",
    features: {
      agents: 31,
    commands: 35,
    skills: 39,
    configAssets: true,
    portableExport: true,
    loopEngineering: true,
    hookEvents: [
      "event",
      "command.execute.before",
      "tool.execute.before",
      "tool.execute.after",
      "permission.ask",
      "tool.definition",
      "shell.env",
      "experimental.session.compacting",
    ],
    customTools: [],
  },
}
