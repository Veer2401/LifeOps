/**
 * ChatBubble — Message bubble for Pilot conversations
 *
 * User messages: right-aligned, primary-tinted background.
 * Pilot messages: left-aligned, card-style.
 * Subtle fade-in animation on mount.
 */

import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import type { PilotMessage } from "@/hooks/usePilotChat";

interface ChatBubbleProps {
  message: PilotMessage;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const { theme } = useTheme();
  const isUser = message.role === "user";

  // Subtle fade-in animation
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 });
    translateY.value = withTiming(0, { duration: 300 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.pilotContainer,
        animatedStyle,
      ]}
    >
      {/* Pilot label */}
      {!isUser && (
        <View style={styles.pilotLabel}>
          <View
            style={[
              styles.pilotIcon,
              { backgroundColor: theme.primary + "20" },
            ]}
          >
            <Feather name="navigation" size={10} color={theme.primary} />
          </View>
          <ThemedText
            type="caption"
            style={[styles.pilotLabelText, { color: theme.primary }]}
          >
            Pilot
          </ThemedText>
        </View>
      )}

      {/* Message bubble */}
      <View
        style={[
          styles.bubble,
          isUser
            ? [
                styles.userBubble,
                { backgroundColor: theme.primary + "12" },
              ]
            : [
                styles.pilotBubble,
                {
                  backgroundColor: theme.backgroundDefault,
                  ...Shadows.small,
                },
              ],
        ]}
      >
        <ThemedText
          type="body"
          style={[
            styles.messageText,
            { color: theme.text },
          ]}
        >
          {message.content}
        </ThemedText>
      </View>

      {/* Timestamp */}
      <ThemedText
        type="caption"
        style={[
          styles.timestamp,
          {
            color: theme.textSecondary,
            textAlign: isUser ? "right" : "left",
          },
        ]}
      >
        {formatTime(message.timestamp)}
      </ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    maxWidth: "85%",
  },
  userContainer: {
    alignSelf: "flex-end",
  },
  pilotContainer: {
    alignSelf: "flex-start",
  },
  pilotLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
    gap: 4,
  },
  pilotIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  pilotLabelText: {
    fontWeight: "600",
    fontSize: 11,
  },
  bubble: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  userBubble: {
    borderBottomRightRadius: BorderRadius.xs,
  },
  pilotBubble: {
    borderBottomLeftRadius: BorderRadius.xs,
  },
  messageText: {
    lineHeight: 22,
  },
  timestamp: {
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
});
