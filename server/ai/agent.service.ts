/**
 * LifeOps AI — Agent Service
 *
 * The core agent pipeline:
 *   1. User sends a message.
 *   2. Gemini analyses and selects tool(s).
 *   3. We execute the selected tool(s) via the registry.
 *   4. We send the results back to Gemini.
 *   5. Repeat until Gemini returns a final text response.
 *
 * This module is framework-agnostic — it doesn't know about Express.
 */

import type { Content, Part } from "@google/genai";
import { sendToGemini } from "./gemini.service";
import { getToolHandler, getRegisteredToolCount } from "./toolRegistry";

// Import all tool files so they self-register with the registry.
// Order does not matter — each file calls registerTool() at the top level.
import "./tools/commitment.tools";
import "./tools/focus.tools";
import "./tools/mental.tools";
import "./tools/recommendation.tools";

/** Maximum number of tool-call round-trips before we bail out. */
const MAX_ITERATIONS = 10;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Process a user's natural-language message through the full agent pipeline.
 *
 * @param userMessage - The raw message from the user
 * @returns The final natural-language reply from Gemini
 */
export async function processMessage(userMessage: string, uid: string): Promise<string> {
  console.log(`[AgentService] Processing message: "${userMessage}" for user ${uid}`);
  console.log(`[AgentService] ${getRegisteredToolCount()} tools registered`);

  // Build the initial conversation with a single user turn.
  // We also inject today's date so Gemini can resolve "today" / "tomorrow".
  const today = new Date().toISOString().split("T")[0];
  const enrichedMessage = `[Context: Today is ${today}]\n\n${userMessage}`;

  const contents: Content[] = [
    { role: "user", parts: [{ text: enrichedMessage }] },
  ];

  // ── Agent loop: keep going until we get a text response ──
  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const responseParts = await sendToGemini(contents);

    // Separate text parts from function-call parts
    const functionCalls = responseParts.filter((p) => p.functionCall);
    const textParts = responseParts.filter((p) => p.text);

    // If there are no function calls, we have the final answer
    if (functionCalls.length === 0) {
      const reply = textParts.map((p) => p.text).join("\n") || "I'm not sure how to help with that.";
      console.log(`[AgentService] Final reply after ${iteration + 1} iteration(s)`);
      return reply;
    }

    // ── Execute all function calls in parallel ──
    console.log(
      `[AgentService] Iteration ${iteration + 1}: ${functionCalls.length} tool call(s)`,
    );

    // First, add the model's response (with function calls) to the history
    contents.push({ role: "model", parts: responseParts });

    // Execute each function call and collect results
    const functionResponseParts: Part[] = await Promise.all(
      functionCalls.map(async (part) => {
        const name = part.functionCall!.name ?? "unknown";
        const args = part.functionCall!.args;

        console.log(
          `[AgentService] Calling tool: ${name}(${JSON.stringify(args)})`,
        );

        const handler = getToolHandler(name);

        let result: { success: boolean; message: string; data?: unknown };

        if (!handler) {
          console.error(`[AgentService] Unknown tool requested: ${name}`);
          result = {
            success: false,
            message: `Tool "${name}" is not available.`,
          };
        } else {
          try {
            result = await handler(args as Record<string, unknown>, uid);
          } catch (error) {
            const errMsg =
              error instanceof Error ? error.message : String(error);
            console.error(`[AgentService] Tool "${name}" failed: ${errMsg}`);
            result = {
              success: false,
              message: `Tool "${name}" encountered an error: ${errMsg}`,
            };
          }
        }

        return {
          functionResponse: {
            name,
            response: result,
          },
        } as Part;
      }),
    );

    // Add all function results as a single user turn
    contents.push({ role: "user", parts: functionResponseParts });
  }

  // Safety net — should rarely hit this
  console.warn(
    `[AgentService] Reached max iterations (${MAX_ITERATIONS}) without a final response`,
  );
  return "I ran into a loop while processing your request. Please try rephrasing.";
}
