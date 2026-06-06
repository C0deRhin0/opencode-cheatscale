/**
 * OpenCode CheatScale (OCS) Plugins for OpenCode
 *
 * This module exports all OCS plugins for OpenCode integration.
 * Plugins provide hook-based automation using OpenCode's event system.
 */

export { OCSHooksPlugin, default } from "./ocs-hooks.js"

// Re-export for named imports
export * from "./ocs-hooks.js"
