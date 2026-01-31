import React from "react";
import { View, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface CapacityMeterProps {
  used: number;
  total: number;
  status: "available" | "moderate" | "limited" | "saturated";
}

export function CapacityMeter({ used, total, status }: CapacityMeterProps) {
  const { theme } = useTheme();

  const percentage = Math.min((used / total) * 100, 100);

  const getStatusColor = () => {
    switch (status) {
      case "available":
        return theme.success;
      case "moderate":
        return theme.warning;
      case "limited":
        return theme.warning;
      case "saturated":
        return theme.error;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case "available":
        return "Mental capacity available";
      case "moderate":
        return "Pace yourself thoughtfully";
      case "limited":
        return "Limited capacity remaining";
      case "saturated":
        return "Rest supports clarity";
    }
  };

  const statusColor = getStatusColor();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          Mental Load
        </ThemedText>
        <ThemedText type="small" style={{ color: statusColor, fontWeight: "600" }}>
          {Math.round(percentage)}%
        </ThemedText>
      </View>

      <View style={[styles.track, { backgroundColor: theme.backgroundSecondary }]}>
        <View
          style={[
            styles.fill,
            {
              backgroundColor: statusColor,
              width: `${percentage}%`,
            },
          ]}
        />
      </View>

      <ThemedText
        type="small"
        style={[styles.message, { color: statusColor }]}
      >
        {getStatusMessage()}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 3,
  },
  message: {
    textAlign: "center",
    marginTop: Spacing.sm,
  },
});
