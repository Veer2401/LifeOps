/**
 * LifeOps AI — Gemini Service
 *
 * Initialises the Google Gen AI client and exposes a function to send
 * messages to Gemini with tool declarations attached.
 *
 * This module handles the raw SDK interaction only — the tool-call
 * execution loop lives in agent.service.ts.
 */

import {
  GoogleGenAI,
  type Content,
  type Part,
  Type,
  Schema,
} from "@google/genai";
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

export interface MentalStateAnalysis {
  mentalLoad: "Very Light" | "Light" | "Moderate" | "Heavy" | "Very Heavy";
  capacityTotal: 120 | 100 | 75 | 50 | 30;
  energyMode: "Push" | "Protect";
}

/**
 * Analyze a user's free-text input about their day to determine their mental capacity, load, and mode.
 * @param text The user's input string
 * @returns The structured analysis
 */
export async function analyzeMentalState(
  text: string,
): Promise<MentalStateAnalysis> {
  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      mentalLoad: {
        type: Type.STRING,
        description: "The user's mental load based on their input.",
        enum: ["Very Light", "Light", "Moderate", "Heavy", "Very Heavy"],
      },
      capacityTotal: {
        type: Type.INTEGER,
        description:
          "The user's total mental capacity for the day. High energy = 120, Good = 100, Okay = 75, Low = 50, Very Low = 30.",
      },
      energyMode: {
        type: Type.STRING,
        description:
          "Whether the user wants to get things done ('Push') or take it easy ('Protect').",
        enum: ["Push", "Protect"],
      },
    },
    required: ["mentalLoad", "capacityTotal", "energyMode"],
  };

  const response = await genAI.models.generateContent({
    model: MODEL_ID,
    contents: `Analyze the following input and determine the user's mental capacity, stress level (mental load), and goal (energy mode). Input: "${text}"`,
    config: {
      systemInstruction:
        "You are an assistant that analyzes user text to determine their daily mental capacity and goals. Map their input strictly to the provided schema.",
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    },
  });

  const textResponse = response.text;
  if (!textResponse) {
    throw new Error("[GeminiService] Failed to analyze mental state.");
  }

  return JSON.parse(textResponse) as MentalStateAnalysis;
}
