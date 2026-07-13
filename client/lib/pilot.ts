/**
 * Pilot — API Client
 *
 * Thin wrapper around the AI chat endpoint.
 * Keeps networking logic out of the UI hook.
 */

import { getApiUrl } from "@/lib/query-client";

import { auth } from "@/lib/firebase";
import type { MentalLoad, EnergyMode } from "@shared/types";

/** Shape returned by POST /api/ai/chat */
interface PilotApiResponse {
  success: boolean;
  reply?: string;
  error?: string;
}

/**
 * Send a natural-language message to the Pilot AI backend.
 *
 * @param message - The user's message
 * @returns The AI's reply text
 * @throws Error if the request fails or the backend returns an error
 */
export async function sendPilotMessage(message: string): Promise<string> {
  const baseUrl = getApiUrl();
  const url = new URL("/api/ai/chat", baseUrl);

  const token = await auth.currentUser?.getIdToken();

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message }),
    credentials: "include",
  });

  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`Pilot request failed (${res.status}): ${text}`);
  }

  const data: PilotApiResponse = await res.json();

  if (!data.success || !data.reply) {
    throw new Error(data.error || "Pilot returned an empty response.");
  }

  return data.reply;
}

export interface MentalStateAnalysis {
  mentalLoad: MentalLoad;
  capacityTotal: number;
  energyMode: EnergyMode;
}

export async function analyzeMentalState(
  text: string,
): Promise<MentalStateAnalysis> {
  const baseUrl = getApiUrl();
  const url = new URL("/api/ai/analyze-state", baseUrl);

  const token = await auth.currentUser?.getIdToken();

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ text }),
      credentials: "include",
    });
  } catch (err: any) {
    throw new Error(
      `Network request failed to ${url.toString()}. Please ensure the backend server is running (npm run server:dev). Original error: ${err.message}`,
    );
  }

  if (!res.ok) {
    const errorText = (await res.text()) || res.statusText;
    throw new Error(
      `Analyze state request failed (${res.status}): ${errorText}`,
    );
  }

  const data = await res.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || "Analyze state returned an empty response.");
  }

  return data.data;
}
