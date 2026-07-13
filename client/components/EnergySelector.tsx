import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { EnergyLevel } from "@shared/types";

interface EnergySelectorProps {
  value: EnergyLevel | null;
  onChange: (value: EnergyLevel) => void;
  disabled?: boolean;
}

const ENERGY_OPTIONS: {
  value: EnergyLevel;
  label: string;
  icon: keyof typeof Feather.glyphMap;
}[] = [
  { value: "Low", label: "Low", icon: "battery" },
  { value: "Medium", label: "Medium", icon: "battery-charging" },
  { value: "High", label: "High", icon: "zap" },
];

export function EnergySelector({
  value,
  onChange,
  disabled = false,
}: EnergySelectorProps) {
  const { theme } = useTheme();

  const handlePress = (energy: EnergyLevel) => {
    if (disabled) return;
    Haptics.selectionAsync();
    onChange(energy);
  };

  return (
    <View style={styles.container}>
      {ENERGY_OPTIONS.map((option) => {
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
            <Feather
              name={option.icon}
              size={18}
              color={isSelected ? theme.buttonText : theme.textSecondary}
            />
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
    gap: Spacing.sm,
  },
  option: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  optionText: {
    fontWeight: "600",
  },
});
