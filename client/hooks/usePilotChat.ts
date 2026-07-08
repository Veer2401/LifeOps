/**
 * usePilotChat — Custom hook for Pilot conversation state
 *
 * Manages messages, API calls, persistence (AsyncStorage),
 * and the 100-message cap. Keeps all business logic out of
 * the PilotScreen component.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { sendPilotMessage } from "@/lib/pilot";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PilotMessage {
  id: string;
  role: "user" | "pilot";
  content: string;
  timestamp: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "@lifeops/pilotMessages";
const MAX_MESSAGES = 100;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePilotChat() {
  const [messages, setMessages] = useState<PilotMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasLoadedRef = useRef(false);

  // Load messages from storage on mount
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: PilotMessage[] = JSON.parse(stored);
          setMessages(parsed);
        }
      } catch (error) {
        console.warn("[usePilotChat] Failed to load messages:", error);
      }
    })();
  }, []);

  // Persist messages whenever they change (after initial load)
  const persistMessages = useCallback(async (msgs: PilotMessage[]) => {
    try {
      // Keep only the latest MAX_MESSAGES
      const trimmed = msgs.slice(-MAX_MESSAGES);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.warn("[usePilotChat] Failed to persist messages:", error);
    }
  }, []);

  // Send a message to the Pilot AI
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      // 1. Add the user message
      const userMessage: PilotMessage = {
        id: generateId(),
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };

      const withUserMsg = [...messages, userMessage];
      setMessages(withUserMsg);
      setIsLoading(true);

      try {
        // 2. Call the API
        const reply = await sendPilotMessage(trimmed);

        // 3. Add the Pilot response
        const pilotMessage: PilotMessage = {
          id: generateId(),
          role: "pilot",
          content: reply,
          timestamp: Date.now(),
        };

        const withBoth = [...withUserMsg, pilotMessage];
        setMessages(withBoth);
        await persistMessages(withBoth);
      } catch (error) {
        // Add an error message from Pilot
        const errorMessage: PilotMessage = {
          id: generateId(),
          role: "pilot",
          content:
            "I couldn't process that request right now. Please check your connection and try again.",
          timestamp: Date.now(),
        };

        const withError = [...withUserMsg, errorMessage];
        setMessages(withError);
        await persistMessages(withError);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, persistMessages],
  );

  // Clear conversation
  const clearConversation = useCallback(async () => {
    setMessages([]);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn("[usePilotChat] Failed to clear messages:", error);
    }
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearConversation,
  };
}
