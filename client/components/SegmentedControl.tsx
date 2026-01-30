import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  runOnJS,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface SegmentedControlProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
}: SegmentedControlProps<T>) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const handlePress = (option: T) => {
    if (disabled || option === value) return;
    Haptics.selectionAsync();
    onChange(option);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: theme.backgroundSecondary },
        animatedStyle,
      ]}
    >
      {options.map((option) => {
        const isSelected = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => handlePress(option)}
            disabled={disabled}
            style={[
              styles.option,
              isSelected && [
                styles.selectedOption,
                { backgroundColor: theme.backgroundDefault },
              ],
            ]}
          >
            <ThemedText
              type="small"
              style={[
                styles.optionText,
                { color: isSelected ? theme.text : theme.textSecondary },
                isSelected && styles.selectedText,
              ]}
            >
              {option}
            </ThemedText>
          </Pressable>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: BorderRadius.sm,
    padding: Spacing.xs,
  },
  option: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.xs,
  },
  selectedOption: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  optionText: {
    textAlign: "center",
  },
  selectedText: {
    fontWeight: "600",
  },
});
