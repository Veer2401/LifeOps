import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { DailyReplayStorage } from "@/lib/storage";
import { formatTimeEstimate } from "@/lib/nextBestAction";
import type { DailyReplay, Task, Category } from "@shared/types";

const categoryIcons: Record<Category, keyof typeof Feather.glyphMap> = {
  Study: "book",
  Work: "briefcase",
  Personal: "user",
};

export default function DailyReplayScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();

  const [replay, setReplay] = useState<DailyReplay | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReplay();
  }, []);

  const loadReplay = async () => {
    try {
      const todayReplay = await DailyReplayStorage.generateToday();
      setReplay(todayReplay);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return "Less than a minute";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins} minutes`;
  };

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.backgroundRoot },
        ]}
      />
    );
  }

  const hasContent =
    replay &&
    (replay.completedTasks.length > 0 ||
      replay.totalTimeSpent > 0 ||
      replay.postponedTasks.length > 0);

  if (!hasContent) {
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
          title="No activity yet"
          message="Complete your first task to see your daily progress and insights here."
        />
      </ScrollView>
    );
  }

  const renderCompletedTask = ({ item }: { item: Task }) => (
    <View
      style={[
        styles.taskItem,
        { backgroundColor: theme.backgroundDefault, ...Shadows.small },
      ]}
    >
      <View style={styles.taskIcon}>
        <Feather
          name={categoryIcons[item.category]}
          size={16}
          color={theme.textSecondary}
        />
      </View>
      <View style={styles.taskContent}>
        <ThemedText type="body" numberOfLines={1}>
          {item.title}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {formatTimeEstimate(item.estimatedMinutes)}
        </ThemedText>
      </View>
      <Feather name="check-circle" size={20} color={theme.success} />
    </View>
  );

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

      <View style={styles.summaryCards}>
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: theme.success + "15" },
          ]}
        >
          <Feather name="check-circle" size={24} color={theme.success} />
          <ThemedText type="h2" style={{ color: theme.success }}>
            {replay?.completedTasks.length || 0}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.success }}>
            Completed
          </ThemedText>
        </View>
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: theme.primary + "15" },
          ]}
        >
          <Feather name="clock" size={24} color={theme.primary} />
          <ThemedText type="h2" style={{ color: theme.primary }}>
            {formatDuration(replay?.totalTimeSpent || 0).split(" ")[0]}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.primary }}>
            Focus time
          </ThemedText>
        </View>
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: theme.warning + "15" },
          ]}
        >
          <Feather name="clock" size={24} color={theme.warning} />
          <ThemedText type="h2" style={{ color: theme.warning }}>
            {replay?.postponedTasks.length || 0}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.warning }}>
            Postponed
          </ThemedText>
        </View>
      </View>

      {replay?.reflection ? (
        <View
          style={[
            styles.reflectionCard,
            { backgroundColor: theme.backgroundDefault, ...Shadows.small },
          ]}
        >
          <View style={styles.reflectionHeader}>
            <Feather name="sun" size={20} color={theme.primary} />
            <ThemedText type="h4">Daily Insight</ThemedText>
          </View>
          <ThemedText
            type="body"
            style={[styles.reflectionText, { color: theme.textSecondary }]}
          >
            {replay.reflection}
          </ThemedText>
        </View>
      ) : null}

      {replay?.completedTasks && replay.completedTasks.length > 0 ? (
        <View style={styles.section}>
          <ThemedText
            type="small"
            style={[styles.sectionTitle, { color: theme.textSecondary }]}
          >
            Completed Tasks
          </ThemedText>
          <View style={styles.taskList}>
            {replay.completedTasks.map((task) => (
              <View key={task.id}>{renderCompletedTask({ item: task })}</View>
            ))}
          </View>
        </View>
      ) : null}

      {replay?.postponedTasks && replay.postponedTasks.length > 0 ? (
        <View style={styles.section}>
          <ThemedText
            type="small"
            style={[styles.sectionTitle, { color: theme.textSecondary }]}
          >
            Needs Attention
          </ThemedText>
          <View style={styles.taskList}>
            {replay.postponedTasks.map((task) => (
              <View
                key={task.id}
                style={[
                  styles.taskItem,
                  { backgroundColor: theme.backgroundDefault, ...Shadows.small },
                ]}
              >
                <View style={styles.taskIcon}>
                  <Feather
                    name={categoryIcons[task.category]}
                    size={16}
                    color={theme.textSecondary}
                  />
                </View>
                <View style={styles.taskContent}>
                  <ThemedText type="body" numberOfLines={1}>
                    {task.title}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.warning }}>
                    Past deadline
                  </ThemedText>
                </View>
                <Feather name="alert-circle" size={20} color={theme.warning} />
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
  },
  emptyContent: {
    flexGrow: 1,
  },
  dateHeader: {
    marginBottom: Spacing.xl,
  },
  summaryCards: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  summaryCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    gap: Spacing.xs,
  },
  reflectionCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  reflectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  reflectionText: {
    lineHeight: 24,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  taskList: {
    gap: Spacing.sm,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  taskIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  taskContent: {
    flex: 1,
  },
});
