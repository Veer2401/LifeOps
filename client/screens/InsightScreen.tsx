import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { InsightStorage } from "@/lib/storage";
import type { DailyInsight } from "@shared/types";

export default function InsightScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();

  const [insight, setInsight] = useState<DailyInsight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsight();
  }, []);

  const loadInsight = async () => {
    try {
      const todayInsight = await InsightStorage.generateToday();
      setInsight(todayInsight);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]} />
    );
  }

  const hasActivity =
    insight && (insight.completedCount > 0 || insight.capacityUsed > 0);

  if (!hasActivity) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
        contentContainerStyle={[
          styles.emptyContent,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <EmptyState
          image={require("../../assets/images/daily-replay-empty.png")}
          title="A fresh start"
          message="Complete your first commitment to see insights about your mental rhythm."
        />
      </ScrollView>
    );
  }

  const capacityPercentage = Math.round(
    (insight.capacityUsed / insight.capacityTotal) * 100
  );

  const patternLabel =
    insight.sessionPattern === "short"
      ? "Short sessions"
      : insight.sessionPattern === "deep"
      ? "Deep focus"
      : "Balanced";

  const peakLabel =
    insight.peakFocusTime === "morning"
      ? "Morning"
      : insight.peakFocusTime === "afternoon"
      ? "Afternoon"
      : "Evening";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
    >
      <View style={styles.dateHeader}>
        <ThemedText type="h3">Today</ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </ThemedText>
      </View>

      <View
        style={[
          styles.insightCard,
          { backgroundColor: theme.backgroundDefault, ...Shadows.small },
        ]}
      >
        <View style={styles.insightHeader}>
          <Feather name="sun" size={20} color={theme.primary} />
          <ThemedText type="h4">Daily Insight</ThemedText>
        </View>
        <ThemedText
          type="body"
          style={[styles.insightText, { color: theme.textSecondary }]}
        >
          {insight.insight}
        </ThemedText>
      </View>

      <View style={styles.metricsGrid}>
        <View
          style={[
            styles.metricCard,
            { backgroundColor: theme.primary + "15" },
          ]}
        >
          <ThemedText type="h2" style={{ color: theme.primary }}>
            {capacityPercentage}%
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.primary }}>
            Capacity used
          </ThemedText>
        </View>
        <View
          style={[
            styles.metricCard,
            { backgroundColor: theme.success + "15" },
          ]}
        >
          <ThemedText type="h2" style={{ color: theme.success }}>
            {insight.completedCount}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.success }}>
            Completed
          </ThemedText>
        </View>
      </View>

      <View
        style={[
          styles.patternCard,
          { backgroundColor: theme.backgroundDefault, ...Shadows.small },
        ]}
      >
        <ThemedText
          type="small"
          style={[styles.patternLabel, { color: theme.textSecondary }]}
        >
          Focus Pattern
        </ThemedText>

        <View style={styles.patternRow}>
          <View style={styles.patternItem}>
            <Feather name="clock" size={18} color={theme.textSecondary} />
            <View>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {patternLabel}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Session style
              </ThemedText>
            </View>
          </View>

          <View style={styles.patternItem}>
            <Feather name="sunrise" size={18} color={theme.textSecondary} />
            <View>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {peakLabel}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Peak clarity
              </ThemedText>
            </View>
          </View>
        </View>
      </View>

      {insight.deferredCount > 0 ? (
        <View
          style={[
            styles.deferredCard,
            { backgroundColor: theme.warning + "15" },
          ]}
        >
          <Feather name="clock" size={18} color={theme.warning} />
          <ThemedText type="body" style={{ color: theme.warning }}>
            {insight.deferredCount} commitment
            {insight.deferredCount > 1 ? "s" : ""} deferred
          </ThemedText>
        </View>
      ) : null}

      <View style={styles.disclaimer}>
        <ThemedText
          type="small"
          style={[styles.disclaimerText, { color: theme.textSecondary }]}
        >
          LifeOps supports mental well-being but does not replace professional
          care.
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContent: {
    flexGrow: 1,
  },
  dateHeader: {
    marginBottom: Spacing.xl,
  },
  insightCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  insightText: {
    lineHeight: 24,
  },
  metricsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  metricCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    gap: Spacing.xs,
  },
  patternCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  patternLabel: {
    marginBottom: Spacing.md,
    fontWeight: "500",
  },
  patternRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  patternItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  deferredCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  disclaimer: {
    marginTop: "auto",
    paddingTop: Spacing.xl,
  },
  disclaimerText: {
    textAlign: "center",
    fontStyle: "italic",
  },
});
