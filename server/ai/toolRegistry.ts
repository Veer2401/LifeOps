/**
 * LifeOps AI — Centralized Tool Registry
 *
 * Every tool self-registers here at import time.
 * The Gemini agent dynamically reads the registry — no hardcoded tool lists.
 *
 * To add a new tool:
 *   1. Create the tool handler in the appropriate tools/*.tools.ts file.
 *   2. Call registerTool() with the name, description, parameters schema, and handler.
 *   3. Done. No changes needed in the agent or Gemini service.
 */

import type { FunctionDeclaration, Schema } from "@google/genai";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Standard response shape returned by every tool handler. */
export interface ToolResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

/** A handler function that executes the tool's business logic. */
export type ToolHandler = (
  args: Record<string, unknown>,
  uid: string,
) => Promise<ToolResponse>;

/** Internal registry entry — links a Gemini function declaration to its handler. */
interface ToolEntry {
  declaration: FunctionDeclaration;
  handler: ToolHandler;
}

// ─── Registry ─────────────────────────────────────────────────────────────────

const registry = new Map<string, ToolEntry>();

/**
 * Register a tool so Gemini can discover and invoke it.
 *
 * @param name        - Unique function name (camelCase, e.g. "createCommitment")
 * @param description - Plain-English description of what the tool does
 * @param parameters  - JSON-Schema-style parameter object for Gemini
 * @param handler     - Async function that executes the tool logic
 */
export function registerTool(
  name: string,
  description: string,
  parameters: Schema,
  handler: ToolHandler,
): void {
  if (registry.has(name)) {
    console.warn(`[ToolRegistry] Overwriting existing tool: ${name}`);
  }

  registry.set(name, {
    declaration: { name, description, parameters },
    handler,
  });

  console.log(`[ToolRegistry] Registered tool: ${name}`);
}

/**
 * Get all tool declarations formatted for the Gemini API.
 * Used when constructing the `tools` array for a generateContent call.
 */
export function getAllDeclarations(): FunctionDeclaration[] {
  return Array.from(registry.values()).map((entry) => entry.declaration);
}

/**
 * Look up a tool handler by name.
 * Returns undefined if the tool is not registered.
 */
export function getToolHandler(name: string): ToolHandler | undefined {
  return registry.get(name)?.handler;
}

/**
 * Get the total number of registered tools (useful for logging).
 */
export function getRegisteredToolCount(): number {
  return registry.size;
}
