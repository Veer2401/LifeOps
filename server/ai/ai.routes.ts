/**
 * LifeOps AI — Routes
 *
 * Mounts the AI chat endpoint under /api/ai.
 */

import { Router } from "express";
import { handleChat, handleAnalyzeState } from "./ai.controller";

const aiRouter = Router();

/**
 * POST /api/ai/chat
 * Body: { "message": "Show me my commitments for today" }
 */
aiRouter.post("/chat", handleChat);

/**
 * POST /api/ai/analyze-state
 * Body: { "text": "I want to get a lot done today" }
 */
aiRouter.post("/analyze-state", handleAnalyzeState);

export { aiRouter };
