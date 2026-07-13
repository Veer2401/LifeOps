/**
 * SuggestedActionChip — Quick action pill for Pilot
 *
 * Tapping a chip sends the associated message to Pilot immediately.
 * Uses the same spring press animation as the existing Button component.
 */

import React from "react";
import { StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface SuggestedActionChipProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SuggestedActionChip({
  label,
  onPress,
  disabled = false,
}: SuggestedActionChipProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.95, springConfig);
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      scale.value = withSpring(1, springConfig);
    }
  };

  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.chip,
        {
          borderColor: theme.border,
          backgroundColor: theme.backgroundDefault,
          opacity: disabled ? 0.5 : 1,
        },
        animatedStyle,
      ]}
    >
      <ThemedText type="small" style={[styles.label, { color: theme.primary }]}>
        {label}
      </ThemedText>
    </AnimatedPressable>
  );
}

// ─── Suggested Actions Data ───────────────────────────────────────────────────

export interface SuggestedAction {
  label: string;
  message: string;
}

/** The predefined quick actions shown above the input. */
export const SUGGESTED_ACTIONS: SuggestedAction[] = [
  {
    label: "Today's Commitments",
    message: "Show me my commitments for today.",
  },
  { label: "Suggest Next", message: "Suggest what I should work on next." },
  {
    label: "Remaining Capacity",
    message: "How much mental capacity do I have left?",
  },
  { label: "Start Focus", message: "Start a focus session." },
  { label: "Create Commitment", message: "Help me create a new commitment." },
  { label: "Update Energy", message: "Update my energy level." },
];

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  label: {
    fontWeight: "500",
  },
});
