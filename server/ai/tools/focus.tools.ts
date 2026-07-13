/**
 * LifeOps AI — Focus Session Tools
 *
 * Registers 2 focus-session-related tools with the central registry.
 *
 * TODO: Replace stub implementations with actual database calls
 *       once the focus session storage layer is built.
 */

import { Type } from "@google/genai";
import { registerTool, type ToolResponse } from "../toolRegistry";
import type { FocusSession } from "@shared/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stubFocusSession(overrides: Partial<FocusSession> = {}): FocusSession {
  return {
    id: overrides.id ?? `fs_${Date.now()}`,
    commitmentId: overrides.commitmentId ?? "cmt_unknown",
    startedAt: overrides.startedAt ?? new Date().toISOString(),
    endedAt: overrides.endedAt,
    duration: overrides.duration ?? 0,
    status: overrides.status ?? "completed",
    ...overrides,
  };
}

// ─── 1. startFocusSession ─────────────────────────────────────────────────────

registerTool(
  "startFocusSession",
  "Start a new focus session for a specific commitment. Returns the session details.",
  {
    type: Type.OBJECT,
    properties: {
      commitmentId: {
        type: Type.STRING,
        description: "ID of the commitment to focus on",
      },
      commitmentTitle: {
        type: Type.STRING,
        description: "Title of the commitment (used if no ID provided)",
      },
      durationMinutes: {
        type: Type.NUMBER,
        description: "Planned focus duration in minutes (optional)",
      },
    },
    required: [],
  },
  async (args): Promise<ToolResponse> => {
    // TODO: Create a focus session record in the database
    const identifier =
      (args.commitmentId as string) ||
      (args.commitmentTitle as string) ||
      "unknown";
    const duration = (args.durationMinutes as number) ?? 25;

    const session = stubFocusSession({
      commitmentId: identifier,
      duration,
      status: "completed",
      endedAt: undefined,
    });

    console.log(
      `[FocusTools] Started focus session for "${identifier}" (${duration} min)`,
    );

    return {
      success: true,
      message: `Focus session started for "${identifier}" — ${duration} minutes. 🎯`,
      data: session,
    };
  },
);

// ─── 2. endFocusSession ───────────────────────────────────────────────────────

registerTool(
  "endFocusSession",
  "End the current or most recent focus session. Optionally mark it as completed, paused, or deferred.",
  {
    type: Type.OBJECT,
    properties: {
      sessionId: {
        type: Type.STRING,
        description:
          "ID of the session to end (optional — ends the latest if omitted)",
      },
      status: {
        type: Type.STRING,
        description: "Final status: completed, paused, or deferred",
        enum: ["completed", "paused", "deferred"],
      },
    },
    required: [],
  },
  async (args): Promise<ToolResponse> => {
    // TODO: Update the session record in the database
    const sessionId = (args.sessionId as string) ?? `fs_latest`;
    const status = (args.status as FocusSession["status"]) ?? "completed";

    const session = stubFocusSession({
      id: sessionId,
      endedAt: new Date().toISOString(),
      duration: 25,
      status,
    });

    console.log(
      `[FocusTools] Ended focus session ${sessionId} with status: ${status}`,
    );

    return {
      success: true,
      message: `Focus session ended — marked as "${status}". ✅`,
      data: session,
    };
  },
);
