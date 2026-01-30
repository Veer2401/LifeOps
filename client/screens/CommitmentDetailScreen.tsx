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
import { CommitmentStorage, MentalStateStorage } from "@/lib/storage";
import { formatTimeEstimate } from "@/lib/cognitiveEngine";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { Commitment, CognitiveWeight, Category } from "@shared/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type DetailRouteProp = RouteProp<RootStackParamList, "CommitmentDetail">;

const weightColors: Record<CognitiveWeight, string> = {
  Heavy: "#B07D7D",
  Moderate: "#C4A77D",
  Light: "#6B9B7F",
};

const WEIGHT_COST: Record<CognitiveWeight, number> = {
  Light: 10,
  Moderate: 25,
  Heavy: 45,
};

const categoryIcons: Record<Category, keyof typeof Feather.glyphMap> = {
  Mind: "sunrise",
  Work: "briefcase",
  Life: "heart",
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

  const loadCommitment = async () => {
    const commitments = await CommitmentStorage.getAll();
    const found = commitments.find((c) => c.id === route.params.commitmentId);
    setCommitment(found || null);
  };

  const handleComplete = async () => {
    if (!commitment) return;

    const state = await MentalStateStorage.get();
    if (state) {
      const newUsed = state.capacityUsed + WEIGHT_COST[commitment.cognitiveWeight];
      await MentalStateStorage.updateCapacity(newUsed);
    }

    await CommitmentStorage.markComplete(commitment.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  };

  const handleDelete = async () => {
    if (!commitment) return;
    setDeleting(true);
    await CommitmentStorage.delete(commitment.id);
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
        style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}
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
              name={categoryIcons[commitment.category]}
              size={16}
              color={theme.textSecondary}
            />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {commitment.category}
            </ThemedText>
          </View>
          <View
            style={[
              styles.weightBadge,
              { backgroundColor: weightColors[commitment.cognitiveWeight] + "20" },
            ]}
          >
            <ThemedText
              type="small"
              style={{ color: weightColors[commitment.cognitiveWeight], fontWeight: "600" }}
            >
              {commitment.cognitiveWeight} weight
            </ThemedText>
          </View>
        </View>

        <ThemedText type="h3" style={styles.title}>
          {commitment.title}
        </ThemedText>

        <View style={styles.metaContainer}>
          <View style={styles.metaItem}>
            <Feather name="clock" size={18} color={theme.textSecondary} />
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              {formatTimeEstimate(commitment.estimatedMinutes)}
            </ThemedText>
          </View>
          {commitment.pressurePoint ? (
            <View style={styles.metaItem}>
              <Feather name="alert-circle" size={18} color={theme.warning} />
              <ThemedText type="body" style={{ color: theme.warning }}>
                {new Date(commitment.pressurePoint).toLocaleDateString(undefined, {
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
        <Button onPress={handleStartFocus}>Begin Focus</Button>

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
            Mark Complete
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
  weightBadge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  title: {
    marginBottom: Spacing.lg,
    lineHeight: 28,
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
