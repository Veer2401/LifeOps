import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { aiRouter } from "./ai/ai.routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Mount the AI agent endpoint
  app.use("/api/ai", aiRouter);

  const httpServer = createServer(app);

  return httpServer;
}
