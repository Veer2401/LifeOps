/**
 * LifeOps AI — Recommendation Tools
 *
 * Registers 1 AI recommendation tool with the central registry.
 *
 * TODO: Replace stub with actual recommendation logic that considers
 *       the user's current energy level, mental capacity, time of day,
 *       and unfulfilled commitments.
 */

import { Type } from "@google/genai";
import { registerTool, type ToolResponse } from "../toolRegistry";

// ─── 1. suggestNextCommitment ─────────────────────────────────────────────────

registerTool(
  "suggestNextCommitment",
  "Suggest what the user should work on next, based on their current energy level, mental capacity, available time, and unfulfilled commitments.",
  {
    type: Type.OBJECT,
    properties: {
      energyLevel: {
        type: Type.STRING,
        description:
          "Current energy level hint (optional — will be fetched from state if omitted)",
        enum: ["Low", "Moderate", "High"],
      },
      availableMinutes: {
        type: Type.NUMBER,
        description: "How many minutes the user has available (optional)",
      },
    },
    required: [],
  },
  async (args): Promise<ToolResponse> => {
    // TODO: Implement real recommendation engine that queries unfulfilled
    //       commitments, sorts by cognitive weight / energy match, and
    //       filters by available time.

    const energy = (args.energyLevel as string) ?? "Moderate";
    const available = (args.availableMinutes as number) ?? 30;

    // Stub: return different suggestions based on energy level
    const suggestions: Record<
      string,
      { title: string; reason: string; estimatedMinutes: number }
    > = {
      Low: {
        title: "Read for 20 minutes",
        reason: "Low cognitive weight — perfect for when your energy is low.",
        estimatedMinutes: 20,
      },
      Moderate: {
        title: "Code review session",
        reason: "Moderate effort — a good match for your current energy.",
        estimatedMinutes: 30,
      },
      High: {
        title: "Deep work: Project planning",
        reason: "High-focus task — take advantage of your peak energy!",
        estimatedMinutes: 60,
      },
    };

    const suggestion = suggestions[energy] ?? suggestions["Moderate"];

    // Respect available time
    if (suggestion.estimatedMinutes > available) {
      suggestion.title = "Quick journaling session";
      suggestion.reason = `You only have ${available} minutes — this fits perfectly.`;
      suggestion.estimatedMinutes = Math.min(10, available);
    }

    console.log(
      `[RecommendationTools] Suggested: "${suggestion.title}" (energy: ${energy}, available: ${available}min)`,
    );

    return {
      success: true,
      message: `I suggest: "${suggestion.title}" — ${suggestion.reason}`,
      data: {
        suggestion,
        basedOn: { energyLevel: energy, availableMinutes: available },
      },
    };
  },
);
