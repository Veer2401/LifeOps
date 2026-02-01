import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { CommitmentStorage, SessionStorage, FulfillmentStorage } from "@/lib/storage";
import type { Commitment } from "@shared/types";

interface TimerState {
  isActive: boolean;
  isPaused: boolean;
  remainingSeconds: number;
  totalSeconds: number;
  commitment: Commitment | null;
  sessionId: string | null;
  isCompleted: boolean;
}

interface TimerContextType {
  timerState: TimerState;
  startTimer: (commitmentId: string) => Promise<void>;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  fulfillCommitment: () => Promise<void>;
  dismissCompletion: () => void;
}

const initialState: TimerState = {
  isActive: false,
  isPaused: false,
  remainingSeconds: 0,
  totalSeconds: 0,
  commitment: null,
  sessionId: null,
  isCompleted: false,
};

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [timerState, setTimerState] = useState<TimerState>(initialState);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number>(0);
  const pausedRemainingRef = useRef<number>(0);

  const audioPlayer = useAudioPlayer(require("../../assets/sounds/complete.mp3"));

  const playCompletionSound = useCallback(() => {
    try {
      audioPlayer.seekTo(0);
      audioPlayer.play();
    } catch (error) {
      console.log("Could not play sound:", error);
    }
  }, [audioPlayer]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
    
    setTimerState((prev) => {
      if (remaining <= 0 && !prev.isCompleted) {
        clearTimer();
        playCompletionSound();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return {
          ...prev,
          remainingSeconds: 0,
          isCompleted: true,
          isPaused: true,
        };
      }
      return { ...prev, remainingSeconds: remaining };
    });
  }, [clearTimer, playCompletionSound]);

  const startTimer = useCallback(async (commitmentId: string) => {
    clearTimer();

    const commitments = await CommitmentStorage.getAll();
    const commitment = commitments.find((c) => c.id === commitmentId);
    if (!commitment) return;

    const session = await SessionStorage.create(commitmentId);
    const totalSeconds = commitment.estimatedMinutes * 60;
    
    endTimeRef.current = Date.now() + totalSeconds * 1000;
    pausedRemainingRef.current = totalSeconds;

    setTimerState({
      isActive: true,
      isPaused: false,
      remainingSeconds: totalSeconds,
      totalSeconds,
      commitment,
      sessionId: session.id,
      isCompleted: false,
    });

    intervalRef.current = setInterval(tick, 1000);
  }, [clearTimer, tick]);

  const pauseTimer = useCallback(() => {
    clearTimer();
    setTimerState((prev) => {
      pausedRemainingRef.current = prev.remainingSeconds;
      return { ...prev, isPaused: true };
    });
  }, [clearTimer]);

  const resumeTimer = useCallback(() => {
    endTimeRef.current = Date.now() + pausedRemainingRef.current * 1000;
    intervalRef.current = setInterval(tick, 1000);
    setTimerState((prev) => ({ ...prev, isPaused: false }));
  }, [tick]);

  const stopTimer = useCallback(async () => {
    clearTimer();
    
    if (timerState.sessionId) {
      const elapsedSeconds = timerState.totalSeconds - timerState.remainingSeconds;
      await SessionStorage.complete(timerState.sessionId, elapsedSeconds, "deferred");
    }
    
    setTimerState(initialState);
  }, [clearTimer, timerState.sessionId, timerState.totalSeconds, timerState.remainingSeconds]);

  const fulfillCommitment = useCallback(async () => {
    clearTimer();
    
    if (timerState.sessionId && timerState.commitment) {
      const elapsedSeconds = timerState.totalSeconds - timerState.remainingSeconds;
      await SessionStorage.complete(timerState.sessionId, elapsedSeconds, "completed");
      await FulfillmentStorage.fulfill(timerState.commitment);
    }
    
    setTimerState(initialState);
  }, [clearTimer, timerState.sessionId, timerState.commitment, timerState.totalSeconds, timerState.remainingSeconds]);

  const dismissCompletion = useCallback(() => {
    setTimerState(initialState);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (nextState === "active" && timerState.isActive && !timerState.isPaused) {
        tick();
      }
    });
    return () => subscription.remove();
  }, [timerState.isActive, timerState.isPaused, tick]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return (
    <TimerContext.Provider
      value={{
        timerState,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        fulfillCommitment,
        dismissCompletion,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error("useTimer must be used within TimerProvider");
  }
  return context;
}
