import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useTimer } from "@/contexts/TimerContext";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { formatDuration } from "@/lib/cognitiveEngine";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function FloatingTimerBar() {
  const { theme } = useTheme();
  const { timerState, pauseTimer, resumeTimer } = useTimer();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  if (!timerState.isActive || !timerState.commitment) {
    return null;
  }

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("FocusSession", {
      commitmentId: timerState.commitment!.id,
    });
  };

  const handlePauseResume = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (timerState.isPaused) {
      resumeTimer();
    } else {
      pauseTimer();
    }
  };

  const progress =
    timerState.totalSeconds > 0
      ? (timerState.totalSeconds - timerState.remainingSeconds) /
        timerState.totalSeconds
      : 0;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.primary,
          bottom: insets.bottom + 80,
          opacity: pressed ? 0.9 : 1,
          ...Shadows.medium,
        },
      ]}
    >
      <View style={styles.progressBackground}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progress * 100}%`,
              backgroundColor: "rgba(255,255,255,0.2)",
            },
          ]}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.info}>
          <ThemedText
            type="small"
            style={{ color: "#fff", fontWeight: "600" }}
            numberOfLines={1}
          >
            {timerState.commitment.title}
          </ThemedText>
          <View style={styles.timeRow}>
            <ThemedText
              type="body"
              style={{ color: "#fff", fontWeight: "700" }}
            >
              {formatDuration(timerState.remainingSeconds)}
            </ThemedText>
            {timerState.isPaused ? (
              <View style={styles.pausedBadge}>
                <ThemedText
                  type="small"
                  style={{ color: "#fff", opacity: 0.8 }}
                >
                  Paused
                </ThemedText>
              </View>
            ) : null}
          </View>
        </View>

        <Pressable
          onPress={handlePauseResume}
          hitSlop={12}
          style={({ pressed }) => [
            styles.pauseButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather
            name={timerState.isPaused ? "play" : "pause"}
            size={20}
            color="#fff"
          />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  progressBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  progressFill: {
    height: "100%",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  info: {
    flex: 1,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: 2,
  },
  pausedBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: BorderRadius.sm,
  },
  pauseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
});
