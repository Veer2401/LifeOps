import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, Pressable, AppState } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { TaskStorage, SessionStorage } from "@/lib/storage";
import { formatDuration } from "@/lib/nextBestAction";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { Task } from "@shared/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type FocusSessionRouteProp = RouteProp<RootStackParamList, "FocusSession">;

export default function FocusSessionScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<FocusSessionRouteProp>();

  const [task, setTask] = useState<Task | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const pausedTimeRef = useRef<number>(0);

  useEffect(() => {
    loadTask();
    startSession();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active" && !isPaused) {
        const now = Date.now();
        const elapsed = Math.floor((now - startTimeRef.current) / 1000) - pausedTimeRef.current;
        setElapsedSeconds(elapsed);
      }
    });
    return () => subscription.remove();
  }, [isPaused]);

  const loadTask = async () => {
    const tasks = await TaskStorage.getAll();
    const found = tasks.find((t) => t.id === route.params.taskId);
    setTask(found || null);
  };

  const startSession = async () => {
    const session = await SessionStorage.create(route.params.taskId);
    setSessionId(session.id);
    startTimer();
  };

  const startTimer = () => {
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTimeRef.current) / 1000) - pausedTimeRef.current;
      setElapsedSeconds(elapsed);
    }, 1000);
  };

  const handlePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPaused) {
      startTimeRef.current = Date.now() - (elapsedSeconds * 1000);
      pausedTimeRef.current = 0;
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTimeRef.current) / 1000);
        setElapsedSeconds(elapsed);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    setIsPaused(!isPaused);
  };

  const handleComplete = async () => {
    if (!sessionId || !task) return;
    setIsCompleting(true);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    await SessionStorage.complete(sessionId, elapsedSeconds, "completed");
    await TaskStorage.markComplete(task.id);
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  };

  const handleReschedule = async () => {
    if (!sessionId) return;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    await SessionStorage.complete(sessionId, elapsedSeconds, "rescheduled");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.goBack();
  };

  if (!task) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.backgroundRoot },
        ]}
      >
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          Loading...
        </ThemedText>
      </View>
    );
  }

  const targetSeconds = task.estimatedMinutes * 60;
  const progress = Math.min(elapsedSeconds / targetSeconds, 1);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundRoot,
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.taskInfo}>
          <ThemedText
            type="small"
            style={[styles.categoryText, { color: theme.textSecondary }]}
          >
            {task.category}
          </ThemedText>
          <ThemedText type="h3" style={styles.taskTitle} numberOfLines={2}>
            {task.title}
          </ThemedText>
        </View>

        <View style={styles.timerContainer}>
          <View
            style={[
              styles.timerCircle,
              {
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.primary + "30",
                ...Shadows.medium,
              },
            ]}
          >
            <ThemedText type="h1" style={styles.timerText}>
              {formatDuration(elapsedSeconds)}
            </ThemedText>
            <ThemedText
              type="small"
              style={[styles.targetText, { color: theme.textSecondary }]}
            >
              of {formatDuration(targetSeconds)}
            </ThemedText>
          </View>

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.primary,
                  width: `${progress * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        {isPaused ? (
          <View style={styles.pausedMessage}>
            <Feather name="pause-circle" size={20} color={theme.textSecondary} />
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              Session paused
            </ThemedText>
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={handlePause}
          style={({ pressed }) => [
            styles.pauseButton,
            {
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Feather
            name={isPaused ? "play" : "pause"}
            size={24}
            color={theme.text}
          />
          <ThemedText type="body" style={{ fontWeight: "600" }}>
            {isPaused ? "Resume" : "Pause"}
          </ThemedText>
        </Pressable>

        <Button onPress={handleComplete} disabled={isCompleting}>
          {isCompleting ? "Completing..." : "Complete Task"}
        </Button>

        <Pressable
          onPress={handleReschedule}
          style={({ pressed }) => [
            styles.rescheduleButton,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Feather name="clock" size={18} color={theme.textSecondary} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Reschedule for later
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  taskInfo: {
    alignItems: "center",
    marginBottom: Spacing["4xl"],
  },
  categoryText: {
    marginBottom: Spacing.sm,
    fontWeight: "500",
  },
  taskTitle: {
    textAlign: "center",
    maxWidth: 300,
  },
  timerContainer: {
    alignItems: "center",
    width: "100%",
  },
  timerCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["3xl"],
  },
  timerText: {
    fontSize: 48,
    fontWeight: "300",
    letterSpacing: 2,
  },
  targetText: {
    marginTop: Spacing.xs,
  },
  progressBar: {
    width: "80%",
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  pausedMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  actions: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  pauseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  rescheduleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
});
