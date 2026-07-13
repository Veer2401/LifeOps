import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { formatTimeEstimate } from "@/lib/nextBestAction";
import type { Task, Priority, Category } from "@shared/types";

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
  variant?: "default" | "featured";
}

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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function TaskCard({
  task,
  onPress,
  variant = "default",
}: TaskCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const isFeatured = variant === "featured";

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        {
          backgroundColor: theme.backgroundDefault,
          ...Shadows.small,
        },
        isFeatured && styles.featuredCard,
        animatedStyle,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.categoryBadge}>
          <Feather
            name={categoryIcons[task.category]}
            size={14}
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

      <ThemedText
        type={isFeatured ? "h3" : "h4"}
        style={styles.title}
        numberOfLines={2}
      >
        {task.title}
      </ThemedText>

      <View style={styles.footer}>
        <View style={styles.timeContainer}>
          <Feather name="clock" size={14} color={theme.textSecondary} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {formatTimeEstimate(task.estimatedMinutes)}
          </ThemedText>
        </View>
        {task.deadline ? (
          <View style={styles.deadlineContainer}>
            <Feather name="calendar" size={14} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {new Date(task.deadline).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </ThemedText>
          </View>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  featuredCard: {
    padding: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
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
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  title: {
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  deadlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
});
