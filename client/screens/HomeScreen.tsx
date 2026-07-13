import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { CapacityMeter } from "@/components/CapacityMeter";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import {
  CommitmentStorage,
  MentalStateStorage,
  TodayStorage,
} from "@/lib/storage";
import {
  selectNextAction,
  getCapacityStatus,
  type SuggestedAction,
} from "@/lib/cognitiveEngine";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type {
  MentalState,
  EnergyLevel,
  TodayCommitment,
  Commitment,
  Category,
} from "@shared/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const categoryIcons: Record<Category, keyof typeof Feather.glyphMap> = {
  Health: "heart",
  Work: "briefcase",
  Life: "sun",
};

function getCapacityMessage(
  status: ReturnType<typeof getCapacityStatus>,
): string {
  const remaining = Math.round(100 - status.percentage);

  if (status.status === "available") {
    return `You have ${remaining}% mental capacity available today.`;
  }
  if (status.status === "moderate") {
    return `You have ${remaining}% mental capacity remaining. Pace thoughtfully.`;
  }
  if (status.status === "limited") {
    return `Limited capacity remaining today (${remaining}%). Consider rest.`;
  }
  return "Your mental capacity has reached its limit for today.";
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const [allCommitments, setAllCommitments] = useState<Commitment[]>([]);
  const [todayCommitments, setTodayCommitments] = useState<TodayCommitment[]>(
    [],
  );
  const [mentalState, setMentalState] = useState<MentalState | null>(null);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>("Moderate");
  const [suggestedAction, setSuggestedAction] =
    useState<SuggestedAction | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [loadedState, today, all] = await Promise.all([
        MentalStateStorage.refreshCapacity(),
        TodayStorage.getTodayCommitments(),
        CommitmentStorage.getActive(),
      ]);
      setMentalState(loadedState);
      setTodayCommitments(today);
      setAllCommitments(all);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

  useEffect(() => {
    if (mentalState && todayCommitments) {
      const action = selectNextAction(
        todayCommitments,
        mentalState,
        energyLevel,
      );
      setSuggestedAction(action);
    }
  }, [mentalState, todayCommitments, energyLevel]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleFulfill = () => {
    if (suggestedAction?.commitment) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      navigation.navigate("FocusSession", {
        commitmentId: suggestedAction.commitment.id,
      });
    }
  };

  const handleRecalibrate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("Recalibrate");
  };

  const handleCommitmentPress = (commitment: Commitment) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("CommitmentDetail", { commitmentId: commitment.id });
  };

  const isFulfilledToday = (commitmentId: string) => {
    return todayCommitments.some(
      (tc) => tc.commitment.id === commitmentId && tc.fulfilled,
    );
  };

  if (loading) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      />
    );
  }

  const capacityStatus = mentalState
    ? getCapacityStatus(mentalState.capacityUsed, mentalState.capacityTotal)
    : null;

  const fulfilledCount = todayCommitments.filter((tc) => tc.fulfilled).length;
  const totalCount = todayCommitments.length;

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
      {mentalState && capacityStatus ? (
        <View style={styles.capacitySection}>
          <CapacityMeter
            used={mentalState.capacityUsed}
            total={mentalState.capacityTotal}
            status={capacityStatus.status}
          />
          <ThemedText
            type="body"
            style={[styles.capacityMessage, { color: theme.textSecondary }]}
          >
            {getCapacityMessage(capacityStatus)}
          </ThemedText>
        </View>
      ) : null}

      {totalCount > 0 ? (
        <View style={styles.statusRow}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {fulfilledCount} of {totalCount} commitments fulfilled today
          </ThemedText>
        </View>
      ) : null}

      {suggestedAction ? (
        <View
          style={[
            styles.actionCard,
            { backgroundColor: theme.backgroundDefault, ...Shadows.medium },
          ]}
        >
          {suggestedAction.type === "commitment" ? (
            <>
              <View style={styles.actionHeader}>
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: theme.primary + "15" },
                  ]}
                >
                  <Feather name="target" size={20} color={theme.primary} />
                </View>
              </View>
              <ThemedText type="h3" style={styles.actionTitle}>
                {suggestedAction.message}
              </ThemedText>
              <ThemedText
                type="body"
                style={[styles.actionSubtext, { color: theme.textSecondary }]}
              >
                {suggestedAction.submessage}
              </ThemedText>
              <Button onPress={handleFulfill} style={styles.actionButton}>
                Start Now
              </Button>
            </>
          ) : (
            <>
              <View style={styles.actionHeader}>
                <View
                  style={[
                    styles.actionIcon,
                    {
                      backgroundColor:
                        suggestedAction.type === "rest"
                          ? theme.success + "15"
                          : theme.warning + "15",
                    },
                  ]}
                >
                  <Feather
                    name={suggestedAction.type === "rest" ? "moon" : "coffee"}
                    size={20}
                    color={
                      suggestedAction.type === "rest"
                        ? theme.success
                        : theme.warning
                    }
                  />
                </View>
              </View>
              <ThemedText type="h3" style={styles.actionTitle}>
                {suggestedAction.message}
              </ThemedText>
              <ThemedText
                type="body"
                style={[styles.actionSubtext, { color: theme.textSecondary }]}
              >
                {suggestedAction.submessage}
              </ThemedText>
            </>
          )}
        </View>
      ) : null}

      {allCommitments.length > 0 ? (
        <View style={styles.commitmentsSection}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Your Commitments
          </ThemedText>
          <View style={styles.commitmentsList}>
            {allCommitments.map((commitment) => {
              const fulfilled = isFulfilledToday(commitment.id);
              return (
                <Pressable
                  key={commitment.id}
                  onPress={() => handleCommitmentPress(commitment)}
                  style={({ pressed }) => [
                    styles.commitmentCard,
                    {
                      backgroundColor: theme.backgroundDefault,
                      opacity: pressed ? 0.8 : fulfilled ? 0.7 : 1,
                      ...Shadows.small,
                    },
                  ]}
                >
                  <View style={styles.commitmentRow}>
                    <Feather
                      name={categoryIcons[commitment.category]}
                      size={18}
                      color={fulfilled ? theme.success : theme.textSecondary}
                    />
                    <ThemedText
                      type="body"
                      style={[
                        styles.commitmentTitle,
                        fulfilled && {
                          textDecorationLine: "line-through",
                          opacity: 0.6,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {commitment.title}
                    </ThemedText>
                    {fulfilled ? (
                      <Feather
                        name="check-circle"
                        size={18}
                        color={theme.success}
                      />
                    ) : (
                      <Feather
                        name="chevron-right"
                        size={18}
                        color={theme.textSecondary}
                      />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : (
        <View style={styles.emptySection}>
          <ThemedText
            type="body"
            style={{ color: theme.textSecondary, textAlign: "center" }}
          >
            No commitments yet. Add your first one to get started.
          </ThemedText>
          <Button
            onPress={() => navigation.navigate("AddCommitment")}
            style={styles.addButton}
          >
            Add Commitment
          </Button>
        </View>
      )}

      <Pressable
        onPress={handleRecalibrate}
        style={({ pressed }) => [
          styles.recalibrateButton,
          { opacity: pressed ? 0.6 : 1 },
        ]}
      >
        <Feather name="sliders" size={16} color={theme.textSecondary} />
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          Adjust mental state
        </ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  capacitySection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  capacityMessage: {
    textAlign: "center",
    marginTop: Spacing.md,
    lineHeight: 22,
  },
  statusRow: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  actionCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  actionHeader: {
    marginBottom: Spacing.lg,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  actionSubtext: {
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    width: "100%",
  },
  commitmentsSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  commitmentsList: {
    gap: Spacing.sm,
  },
  commitmentCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  commitmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  commitmentTitle: {
    flex: 1,
    fontWeight: "500",
  },
  emptySection: {
    paddingVertical: Spacing["3xl"],
    alignItems: "center",
  },
  addButton: {
    marginTop: Spacing.lg,
    minWidth: 200,
  },
  recalibrateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
  },
});
