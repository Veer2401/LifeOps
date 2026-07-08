/**
 * LifeOps AI — Routes
 *
 * Mounts the AI chat endpoint under /api/ai.
 */

import { Router } from "express";
import { handleChat } from "./ai.controller";

const aiRouter = Router();

/**
 * POST /api/ai/chat
 * Body: { "message": "Show me my commitments for today" }
 */
aiRouter.post("/chat", handleChat);

export { aiRouter };
