/**
 * LifeOps AI — Gemini Service
 *
 * Initialises the Google Gen AI client and exposes a function to send
 * messages to Gemini with tool declarations attached.
 *
 * This module handles the raw SDK interaction only — the tool-call
 * execution loop lives in agent.service.ts.
 */

import { GoogleGenAI, type Content, type Part } from "@google/genai";
import { SYSTEM_PROMPT } from "./systemPrompt";
import { getAllDeclarations } from "./toolRegistry";

// ─── Initialisation ───────────────────────────────────────────────────────────

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error(
    "[GeminiService] GEMINI_API_KEY is not set. Add it to your .env file.",
  );
}

const genAI = new GoogleGenAI({ apiKey });

const MODEL_ID = "gemini-2.5-flash";

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Send a conversation history to Gemini and get back a response.
 *
 * The response may contain text parts, function-call parts, or both.
 * The caller (agent.service) is responsible for handling function calls
 * and looping until Gemini returns a final text response.
 *
 * @param contents - Full conversation history (user messages + function results)
 * @returns The model's response parts
 */
export async function sendToGemini(contents: Content[]): Promise<Part[]> {
  const declarations = getAllDeclarations();

  console.log(
    `[GeminiService] Sending request with ${contents.length} content block(s) and ${declarations.length} tool(s)`,
  );

  const response = await genAI.models.generateContent({
    model: MODEL_ID,
    contents,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      tools: [{ functionDeclarations: declarations }],
    },
  });

  const parts = response.candidates?.[0]?.content?.parts;

  if (!parts || parts.length === 0) {
    throw new Error("[GeminiService] Gemini returned an empty response.");
  }

  return parts;
}
