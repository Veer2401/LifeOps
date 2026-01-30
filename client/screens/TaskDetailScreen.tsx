import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { TaskStorage } from "@/lib/storage";
import { formatTimeEstimate } from "@/lib/nextBestAction";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { Task, Priority, Category } from "@shared/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type TaskDetailRouteProp = RouteProp<RootStackParamList, "TaskDetail">;

const priorityColors: Record<Priority, string> = {
  High: "#B07D7D",
  Medium: "#C4A77D",
  Low: "#6B9B7F",
};

const categoryIcons: Record<Category, keyof typeof Feather.glyphMap> = {
  Study: "book",
  Work: "briefcase",
  Personal: "user",
};

export default function TaskDetailScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<TaskDetailRouteProp>();

  const [task, setTask] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadTask();
  }, [route.params.taskId]);

  const loadTask = async () => {
    const tasks = await TaskStorage.getAll();
    const found = tasks.find((t) => t.id === route.params.taskId);
    setTask(found || null);
  };

  const handleComplete = async () => {
    if (!task) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await TaskStorage.markComplete(task.id);
    navigation.goBack();
  };

  const handleDelete = async () => {
    if (!task) return;
    setDeleting(true);
    await TaskStorage.delete(task.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    navigation.goBack();
  };

  const handleStartFocus = () => {
    if (!task) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("FocusSession", { taskId: task.id });
  };

  if (!task) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.backgroundRoot },
        ]}
      >
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          Loading...
        </ThemedText>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
    >
      <View
        style={[
          styles.card,
          { backgroundColor: theme.backgroundDefault, ...Shadows.small },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.categoryBadge}>
            <Feather
              name={categoryIcons[task.category]}
              size={16}
              color={theme.textSecondary}
            />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {task.category}
            </ThemedText>
          </View>
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: priorityColors[task.priority] + "20" },
            ]}
          >
            <View
              style={[
                styles.priorityDot,
                { backgroundColor: priorityColors[task.priority] },
              ]}
            />
            <ThemedText
              type="small"
              style={{ color: priorityColors[task.priority], fontWeight: "600" }}
            >
              {task.priority}
            </ThemedText>
          </View>
        </View>

        <ThemedText type="h2" style={styles.title}>
          {task.title}
        </ThemedText>

        <View style={styles.metaContainer}>
          <View style={styles.metaItem}>
            <Feather name="clock" size={18} color={theme.textSecondary} />
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              {formatTimeEstimate(task.estimatedMinutes)}
            </ThemedText>
          </View>
          {task.deadline ? (
            <View style={styles.metaItem}>
              <Feather name="calendar" size={18} color={theme.textSecondary} />
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                {new Date(task.deadline).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </ThemedText>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.actions}>
        <Button onPress={handleStartFocus}>Start Focus Session</Button>

        <Pressable
          onPress={handleComplete}
          style={({ pressed }) => [
            styles.secondaryButton,
            {
              backgroundColor: theme.success + "15",
              borderColor: theme.success,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Feather name="check-circle" size={20} color={theme.success} />
          <ThemedText type="body" style={{ color: theme.success, fontWeight: "600" }}>
            Mark as Complete
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={handleDelete}
          disabled={deleting}
          style={({ pressed }) => [
            styles.deleteButton,
            {
              opacity: pressed || deleting ? 0.6 : 1,
            },
          ]}
        >
          <Feather name="trash-2" size={18} color={theme.error} />
          <ThemedText type="small" style={{ color: theme.error }}>
            {deleting ? "Deleting..." : "Delete Task"}
          </ThemedText>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    marginBottom: Spacing.lg,
  },
  metaContainer: {
    flexDirection: "row",
    gap: Spacing.xl,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  actions: {
    gap: Spacing.md,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
});
