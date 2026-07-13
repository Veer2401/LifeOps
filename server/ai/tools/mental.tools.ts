/**
 * LifeOps AI — Mental State Tools
 *
 * Registers 3 mental-state-related tools with the central registry.
 *
 * TODO: Replace stub implementations with actual database calls
 *       once the mental state storage layer is built.
 */

import { Type } from "@google/genai";
import { registerTool, type ToolResponse } from "../toolRegistry";
import type { MentalState, EnergyLevel, MentalLoad } from "@shared/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stubMentalState(overrides: Partial<MentalState> = {}): MentalState {
  return {
    date: overrides.date ?? new Date().toISOString().split("T")[0],
    mentalLoad: overrides.mentalLoad ?? "Moderate",
    availableTime: overrides.availableTime ?? 60,
    energyMode: overrides.energyMode ?? "Push",
    capacityUsed: overrides.capacityUsed ?? 30,
    capacityTotal: overrides.capacityTotal ?? 75,
    ...overrides,
  };
}

// ─── 1. updateEnergyLevel ─────────────────────────────────────────────────────

registerTool(
  "updateEnergyLevel",
  "Update the user's current energy level. This affects which commitments are recommended.",
  {
    type: Type.OBJECT,
    properties: {
      level: {
        type: Type.STRING,
        description: "Energy level: Low, Moderate, or High",
        enum: ["Low", "Moderate", "High"],
      },
    },
    required: ["level"],
  },
  async (args): Promise<ToolResponse> => {
    // TODO: Persist the energy level update to the database
    const level = args.level as EnergyLevel;

    // Map energy level to a corresponding mental load for the stub
    const mentalLoadMap: Record<EnergyLevel, MentalLoad> = {
      Low: "Heavy",
      Moderate: "Moderate",
      High: "Light",
    };

    const state = stubMentalState({
      mentalLoad: mentalLoadMap[level],
      energyMode: level === "Low" ? "Protect" : "Push",
    });

    console.log(`[MentalTools] Energy level updated to: ${level}`);

    return {
      success: true,
      message: `Energy level updated to "${level}". ${level === "Low" ? "Switching to Protect mode — I'll suggest lighter tasks. 🛡️" : "You're in Push mode — let's get things done! 💪"}`,
      data: state,
    };
  },
);

// ─── 2. updateStressLevel ─────────────────────────────────────────────────────

registerTool(
  "updateStressLevel",
  "Update the user's current stress/mental load level. Affects capacity calculations.",
  {
    type: Type.OBJECT,
    properties: {
      level: {
        type: Type.STRING,
        description:
          "Mental load level: Very Light, Light, Moderate, Heavy, or Very Heavy",
        enum: ["Very Light", "Light", "Moderate", "Heavy", "Very Heavy"],
      },
    },
    required: ["level"],
  },
  async (args): Promise<ToolResponse> => {
    // TODO: Persist the stress level update to the database
    const level = args.level as MentalLoad;
    const state = stubMentalState({ mentalLoad: level });

    console.log(`[MentalTools] Stress/mental load updated to: ${level}`);

    return {
      success: true,
      message: `Mental load updated to "${level}". Capacity has been recalculated.`,
      data: state,
    };
  },
);

// ─── 3. getMentalCapacity ─────────────────────────────────────────────────────

registerTool(
  "getMentalCapacity",
  "Get the user's current mental capacity summary: load, energy mode, capacity used vs total.",
  {
    type: Type.OBJECT,
    properties: {},
    required: [],
  },
  async (): Promise<ToolResponse> => {
    // TODO: Compute real capacity from fulfillments + mental state in the database
    const state = stubMentalState({
      capacityUsed: 35,
      capacityTotal: 75,
    });

    const remaining = state.capacityTotal - state.capacityUsed;

    console.log(
      `[MentalTools] Mental capacity: ${state.capacityUsed}/${state.capacityTotal} used`,
    );

    return {
      success: true,
      message: `Mental capacity: ${state.capacityUsed}/${state.capacityTotal} used (${remaining} remaining). Mode: ${state.energyMode}.`,
      data: state,
    };
  },
);
