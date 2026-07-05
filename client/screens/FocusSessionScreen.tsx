import React, { useEffect } from "react";
import { View, StyleSheet, Pressable, useWindowDimensions, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useTimer } from "@/contexts/TimerContext";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { formatDuration, calculateCapacityCost, getNextOccurrenceLabel } from "@/lib/cognitiveEngine";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type FocusSessionRouteProp = RouteProp<RootStackParamList, "FocusSession">;

export default function FocusSessionScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<FocusSessionRouteProp>();

  const {
    timerState,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    fulfillCommitment,
    dismissCompletion,
  } = useTimer();

  useEffect(() => {
    if (!timerState.isActive || timerState.commitment?.id !== route.params.commitmentId) {
      startTimer(route.params.commitmentId);
    }
  }, [route.params.commitmentId]);

  const handlePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (timerState.isPaused) {
      resumeTimer();
    } else {
      pauseTimer();
    }
  };

  const handleFulfill = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await fulfillCommitment();
    navigation.goBack();
  };

  const handleDefer = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await stopTimer();
    navigation.goBack();
  };

  const handleCompletionConfirm = async () => {
    await fulfillCommitment();
    navigation.goBack();
  };

  const handleCompletionDismiss = () => {
    dismissCompletion();
    navigation.goBack();
  };

  if (!timerState.commitment) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          Loading...
        </ThemedText>
      </View>
    );
  }

  const commitment = timerState.commitment;
  const targetSeconds = commitment.estimatedMinutes * 60;
  const progress = targetSeconds > 0 
    ? (targetSeconds - timerState.remainingSeconds) / targetSeconds 
    : 0;
  const capacityCost = calculateCapacityCost(commitment);
  const nextOccurrence = getNextOccurrenceLabel(commitment);

  const circleSize = Math.min(width - Spacing.lg * 4, 280);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundRoot,
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <Modal
        visible={timerState.isCompleted}
        transparent
        animationType="fade"
        onRequestClose={handleCompletionDismiss}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.backgroundDefault, ...Shadows.large },
            ]}
          >
            <View style={[styles.successIcon, { backgroundColor: theme.success + "20" }]}>
              <Feather name="check-circle" size={48} color={theme.success} />
            </View>
            <ThemedText type="h2" style={styles.modalTitle}>
              Time Complete!
            </ThemedText>
            <ThemedText
              type="body"
              style={[styles.modalSubtitle, { color: theme.textSecondary }]}
            >
              You focused on "{commitment.title}" for {formatDuration(targetSeconds)}.
            </ThemedText>
            <Button onPress={handleCompletionConfirm} style={styles.modalButton}>
              Mark as Fulfilled
            </Button>
            <Pressable
              onPress={handleCompletionDismiss}
              style={({ pressed }) => [styles.dismissButton, { opacity: pressed ? 0.6 : 1 }]}
            >
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Not yet, continue later
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      <View style={styles.content}>
        <View style={styles.commitmentInfo}>
          <ThemedText type="small" style={[styles.categoryText, { color: theme.textSecondary }]}>
            {commitment.category}
          </ThemedText>
          <ThemedText type="h3" style={styles.commitmentTitle} numberOfLines={2}>
            {commitment.title}
          </ThemedText>
        </View>

        <View style={styles.timerContainer}>
          <View
            style={[
              styles.timerCircle,
              {
                width: circleSize,
                height: circleSize,
                borderRadius: circleSize / 2,
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.primary + "30",
                ...Shadows.medium,
              },
            ]}
          >
            <ThemedText
              type="h1"
              style={[
                styles.timerText,
                {
                  fontSize: circleSize * 0.2,
                  lineHeight: circleSize * 0.2 * 1.15,
                },
              ]}
            >
              {formatDuration(timerState.remainingSeconds)}
            </ThemedText>
            <ThemedText type="small" style={[styles.targetText, { color: theme.textSecondary }]}>
              remaining
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

        <View style={styles.infoRow}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Fulfilling this will use {capacityCost} capacity units
          </ThemedText>
        </View>

        {timerState.isPaused && !timerState.isCompleted ? (
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
          <Feather name={timerState.isPaused ? "play" : "pause"} size={24} color={theme.text} />
          <ThemedText type="body" style={{ fontWeight: "600" }}>
            {timerState.isPaused ? "Resume" : "Pause"}
          </ThemedText>
        </Pressable>

        <Button onPress={handleFulfill}>
          Fulfill Now
        </Button>

        <View style={styles.nextInfo}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Next occurrence: {nextOccurrence}
          </ThemedText>
        </View>

        <Pressable
          onPress={handleDefer}
          style={({ pressed }) => [styles.deferButton, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Feather name="clock" size={18} color={theme.textSecondary} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Defer for later
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
  commitmentInfo: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  categoryText: {
    marginBottom: Spacing.sm,
    fontWeight: "500",
  },
  commitmentTitle: {
    textAlign: "center",
    maxWidth: 300,
    lineHeight: 28,
  },
  timerContainer: {
    alignItems: "center",
    width: "100%",
  },
  timerCircle: {
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["3xl"],
  },
  timerText: {
    fontWeight: "300",
    letterSpacing: 2,
    textAlign: "center",
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
  infoRow: {
    marginTop: Spacing.xl,
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
  nextInfo: {
    alignItems: "center",
  },
  deferButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    padding: Spacing["3xl"],
    borderRadius: BorderRadius.xl,
    alignItems: "center",
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  modalSubtitle: {
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  modalButton: {
    width: "100%",
    marginBottom: Spacing.md,
  },
  dismissButton: {
    paddingVertical: Spacing.md,
  },
});
