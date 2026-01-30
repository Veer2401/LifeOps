import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, RefreshControl, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { CommitmentStorage } from "@/lib/storage";
import { formatTimeEstimate } from "@/lib/cognitiveEngine";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { Commitment, CognitiveWeight, Category } from "@shared/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const weightColors: Record<CognitiveWeight, string> = {
  Heavy: "#B07D7D",
  Moderate: "#C4A77D",
  Light: "#6B9B7F",
};

const categoryIcons: Record<Category, keyof typeof Feather.glyphMap> = {
  Mind: "sunrise",
  Work: "briefcase",
  Life: "heart",
};

export default function CommitmentsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadCommitments = useCallback(async () => {
    try {
      const loaded = await CommitmentStorage.getActive();
      setCommitments(loaded);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCommitments();
  }, [loadCommitments]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadCommitments();
    });
    return unsubscribe;
  }, [navigation, loadCommitments]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCommitments();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]} />
    );
  }

  if (commitments.length === 0) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
        contentContainerStyle={[
          styles.emptyContent,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <EmptyState
          image={require("../../assets/images/empty-tasks.png")}
          title="No commitments yet"
          message="Add what matters to you. We will help you focus on one thing at a time."
          action={
            <Button onPress={() => navigation.navigate("AddCommitment")}>
              Add Commitment
            </Button>
          }
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <ThemedText type="body" style={[styles.intro, { color: theme.textSecondary }]}>
        Your active commitments
      </ThemedText>

      <View style={styles.list}>
        {commitments.map((commitment) => (
          <Pressable
            key={commitment.id}
            onPress={() => navigation.navigate("CommitmentDetail", { commitmentId: commitment.id })}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: theme.backgroundDefault,
                opacity: pressed ? 0.8 : 1,
                ...Shadows.small,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.categoryBadge}>
                <Feather
                  name={categoryIcons[commitment.category]}
                  size={14}
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
                  {commitment.cognitiveWeight}
                </ThemedText>
              </View>
            </View>

            <ThemedText type="body" style={styles.cardTitle} numberOfLines={2}>
              {commitment.title}
            </ThemedText>

            <View style={styles.cardFooter}>
              <View style={styles.timeContainer}>
                <Feather name="clock" size={14} color={theme.textSecondary} />
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {formatTimeEstimate(commitment.estimatedMinutes)}
                </ThemedText>
              </View>
              {commitment.pressurePoint ? (
                <View style={styles.pressureContainer}>
                  <Feather name="alert-circle" size={14} color={theme.warning} />
                  <ThemedText type="small" style={{ color: theme.warning }}>
                    {new Date(commitment.pressurePoint).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </ThemedText>
                </View>
              ) : null}
            </View>
          </Pressable>
        ))}
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
  intro: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  list: {
    gap: Spacing.md,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
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
  cardTitle: {
    fontWeight: "500",
    marginBottom: Spacing.md,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  pressureContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
});
