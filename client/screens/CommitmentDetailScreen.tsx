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
import { CommitmentStorage, FulfillmentStorage } from "@/lib/storage";
import {
  cancelCommitmentReminder,
  formatReminderTime,
} from "@/lib/notifications";
import { formatTimeEstimate, getRepeatLabel } from "@/lib/cognitiveEngine";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { Commitment, CognitiveWeight, Category } from "@shared/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type DetailRouteProp = RouteProp<RootStackParamList, "CommitmentDetail">;

const weightColors: Record<CognitiveWeight, string> = {
  High: "#B07D7D",
  Moderate: "#C4A77D",
  Low: "#6B9B7F",
};

const categoryIcons: Record<Category, keyof typeof Feather.glyphMap> = {
  Health: "heart",
  Work: "briefcase",
  Life: "sun",
};

const natureLabels: Record<
  string,
  { label: string; icon: keyof typeof Feather.glyphMap }
> = {
  tiring: { label: "Tiring", icon: "zap-off" },
  neutral: { label: "Neutral", icon: "minus-circle" },
  energizing: { label: "Energizing", icon: "zap" },
};

export default function CommitmentDetailScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DetailRouteProp>();

  const [commitment, setCommitment] = useState<Commitment | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadCommitment();
  }, [route.params.commitmentId]);

  // Reload when screen comes back into focus (e.g. after editing)
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadCommitment();
    });
    return unsubscribe;
  }, [navigation]);

  const loadCommitment = async () => {
    const commitments = await CommitmentStorage.getAll();
    const found = commitments.find((c) => c.id === route.params.commitmentId);
    setCommitment(found || null);
  };

  const handleEdit = () => {
    if (!commitment) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("CommitmentForm", { commitmentId: commitment.id });
  };

  const handleFulfill = async () => {
    if (!commitment) return;
    await FulfillmentStorage.fulfill(commitment);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  };

  const handleDelete = async () => {
    if (!commitment) return;
    setDeleting(true);

    // Cancel any reminder
    await cancelCommitmentReminder(commitment.id);

    await CommitmentStorage.archive(commitment.id);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    navigation.goBack();
  };

  const handleStartFocus = () => {
    if (!commitment) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("FocusSession", { commitmentId: commitment.id });
  };

  if (!commitment) {
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

  const nature = natureLabels[commitment.nature] ?? {
    label: commitment.nature,
    icon: "circle",
  };
  const weightColor = weightColors[commitment.cognitiveWeight];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
    >
      {/* ── Main info card ── */}
      <View
        style={[
          styles.card,
          { backgroundColor: theme.backgroundDefault, ...Shadows.small },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.categoryBadge}>
            <Feather
              name={categoryIcons[commitment.category]}
              size={16}
              color={theme.textSecondary}
            />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {commitment.category}
            </ThemedText>
          </View>

          <View style={styles.headerRight}>
            {/* Edit button */}
            <Pressable
              onPress={handleEdit}
              style={({ pressed }) => [
                styles.editChip,
                {
                  backgroundColor: theme.primary + "15",
                  borderColor: theme.primary + "40",
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Feather name="edit-2" size={13} color={theme.primary} />
              <ThemedText
                type="caption"
                style={{ color: theme.primary, fontWeight: "600" }}
              >
                Edit
              </ThemedText>
            </Pressable>

            <View
              style={[
                styles.weightBadge,
                { backgroundColor: weightColor + "20" },
              ]}
            >
              <ThemedText
                type="small"
                style={{ color: weightColor, fontWeight: "600" }}
              >
                {commitment.cognitiveWeight === "Low"
                  ? "Easy"
                  : commitment.cognitiveWeight === "High"
                    ? "Hard"
                    : "Medium"}
              </ThemedText>
            </View>
          </View>
        </View>

        <ThemedText type="h3" style={styles.title}>
          {commitment.title}
        </ThemedText>

        {/* Meta row */}
        <View style={styles.metaContainer}>
          <View style={styles.metaItem}>
            <Feather name="clock" size={16} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {formatTimeEstimate(commitment.estimatedMinutes)}
            </ThemedText>
          </View>
          <View style={styles.metaItem}>
            <Feather name="repeat" size={16} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {getRepeatLabel(commitment.repeatPattern)}
            </ThemedText>
          </View>
          <View style={styles.metaItem}>
            <Feather name={nature.icon} size={16} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {nature.label}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* ── Reminder card ── */}
      {commitment.reminderEnabled && commitment.reminderTime ? (
        <View
          style={[
            styles.reminderCard,
            {
              backgroundColor: theme.primary + "12",
              borderColor: theme.primary + "30",
            },
          ]}
        >
          <Feather name="bell" size={16} color={theme.primary} />
          <View style={{ flex: 1 }}>
            <ThemedText
              type="small"
              style={{ color: theme.primary, fontWeight: "600" }}
            >
              Daily reminder set
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.primary }}>
              You'll be reminded at{" "}
              {formatReminderTime(commitment.reminderTime)} every day
            </ThemedText>
          </View>
          <Pressable
            onPress={handleEdit}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Feather name="edit-2" size={14} color={theme.primary} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={handleEdit}
          style={({ pressed }) => [
            styles.addReminderRow,
            {
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Feather name="bell-off" size={16} color={theme.textSecondary} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            No reminder — tap Edit to add one
          </ThemedText>
          <Feather name="chevron-right" size={14} color={theme.textSecondary} />
        </Pressable>
      )}

      {/* ── Actions ── */}
      <View style={styles.actions}>
        <Button onPress={handleStartFocus}>Begin Focus</Button>

        <Pressable
          onPress={handleFulfill}
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
          <ThemedText
            type="body"
            style={{ color: theme.success, fontWeight: "600" }}
          >
            Mark Fulfilled
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={handleDelete}
          disabled={deleting}
          style={({ pressed }) => [
            styles.deleteButton,
            { opacity: pressed || deleting ? 0.6 : 1 },
          ]}
        >
          <Feather name="trash-2" size={18} color={theme.error} />
          <ThemedText type="small" style={{ color: theme.error }}>
            {deleting ? "Removing..." : "Remove Commitment"}
          </ThemedText>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },

  card: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  editChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  weightBadge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  title: { marginBottom: Spacing.lg, lineHeight: 28 },
  metaContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.lg,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },

  // Reminder
  reminderCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  addReminderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },

  actions: { gap: Spacing.md },
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
