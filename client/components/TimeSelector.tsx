import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { AvailableTime } from "@shared/types";

interface TimeSelectorProps {
  value: AvailableTime | null;
  onChange: (value: AvailableTime) => void;
  disabled?: boolean;
}

const TIME_OPTIONS: { value: AvailableTime; label: string }[] = [
  { value: 5, label: "5 min" },
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 60, label: "60+ min" },
];

export function TimeSelector({ value, onChange, disabled = false }: TimeSelectorProps) {
  const { theme } = useTheme();

  const handlePress = (time: AvailableTime) => {
    if (disabled) return;
    Haptics.selectionAsync();
    onChange(time);
  };

  return (
    <View style={styles.container}>
      {TIME_OPTIONS.map((option) => {
        const isSelected = value === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => handlePress(option.value)}
            disabled={disabled}
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor: isSelected
                  ? theme.primary
                  : theme.backgroundDefault,
                borderColor: isSelected ? theme.primary : theme.border,
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              },
            ]}
          >
            <ThemedText
              type="small"
              style={[
                styles.optionText,
                { color: isSelected ? theme.buttonText : theme.text },
              ]}
            >
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  option: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minWidth: 80,
    alignItems: "center",
  },
  optionText: {
    fontWeight: "600",
  },
});
