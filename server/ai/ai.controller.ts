/**
 * LifeOps AI — Controller
 *
 * Validates the incoming request, calls the agent pipeline,
 * and formats the response. Keeps Express concerns out of the
 * agent and Gemini layers.
 */

import type { Request, Response } from "express";
import { processMessage } from "./agent.service";
import { analyzeMentalState } from "./gemini.service";
import { auth } from "../lib/firebase-admin";

/**
 * POST /api/ai/chat
 *
 * Request body:  { "message": "string" }
 * Response body: { "success": true, "reply": "string" }
 *           or   { "success": false, "error": "string" }
 */
export async function handleChat(req: Request, res: Response): Promise<void> {
  try {
    // ── Verify Auth Token ──
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "Unauthorized: Missing or invalid Authorization header.",
      });
      return;
    }

    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (e) {
      res.status(401).json({
        success: false,
        error: "Unauthorized: Invalid token.",
      });
      return;
    }

    const uid = decodedToken.uid;

    // ── Validate input ──
    const { message } = req.body as { message?: string };

    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      res.status(400).json({
        success: false,
        error: "A non-empty 'message' string is required in the request body.",
      });
      return;
    }

    console.log(
      `[AIController] Received chat message: "${message}" from user ${uid}`,
    );

    // ── Run the agent pipeline ──
    const reply = await processMessage(message.trim(), uid);

    // ── Return the final response ──
    res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[AIController] Error processing chat: ${errMsg}`);

    res.status(500).json({
      success: false,
      error: "An internal error occurred while processing your message.",
    });
  }
}

export async function handleAnalyzeState(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "Unauthorized: Missing or invalid Authorization header.",
      });
      return;
    }

    const token = authHeader.split("Bearer ")[1];
    try {
      await auth.verifyIdToken(token);
    } catch (e) {
      res.status(401).json({
        success: false,
        error: "Unauthorized: Invalid token.",
      });
      return;
    }

    const { text } = req.body as { text?: string };

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: "A non-empty 'text' string is required.",
      });
      return;
    }

    const analysis = await analyzeMentalState(text.trim());

    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[AIController] Error analyzing state: ${errMsg}`);

    res.status(500).json({
      success: false,
      error: "An internal error occurred while analyzing the text.",
    });
  }
}
