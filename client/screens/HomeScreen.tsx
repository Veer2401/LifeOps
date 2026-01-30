import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Pressable, RefreshControl, ScrollView } from "react-native";
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
import { CommitmentStorage, MentalStateStorage } from "@/lib/storage";
import { selectNextAction, getCapacityStatus, type SuggestedAction } from "@/lib/cognitiveEngine";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { Commitment, MentalState, EnergyLevel } from "@shared/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ENERGY_OPTIONS: EnergyLevel[] = ["Low", "Moderate", "High"];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [mentalState, setMentalState] = useState<MentalState | null>(null);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>("Moderate");
  const [suggestedAction, setSuggestedAction] = useState<SuggestedAction | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [loadedCommitments, loadedState] = await Promise.all([
        CommitmentStorage.getActive(),
        MentalStateStorage.get(),
      ]);
      setCommitments(loadedCommitments);
      setMentalState(loadedState);
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
    if (mentalState && commitments) {
      const action = selectNextAction(commitments, mentalState, energyLevel);
      setSuggestedAction(action);
    }
  }, [mentalState, commitments, energyLevel]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleEnergySelect = (energy: EnergyLevel) => {
    Haptics.selectionAsync();
    setEnergyLevel(energy);
  };

  const handleStartFocus = () => {
    if (suggestedAction?.commitment) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      navigation.navigate("FocusSession", { commitmentId: suggestedAction.commitment.id });
    }
  };

  const handleRecalibrate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("Recalibrate");
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]} />
    );
  }

  const capacityStatus = mentalState
    ? getCapacityStatus(mentalState.capacityUsed, mentalState.capacityTotal)
    : null;

  const stateDescription = mentalState
    ? `You have ${energyLevel.toLowerCase()} energy and ${mentalState.availableTime} minutes available.`
    : "Set your mental state to begin.";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
        flexGrow: 1,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {mentalState && capacityStatus ? (
        <CapacityMeter
          used={mentalState.capacityUsed}
          total={mentalState.capacityTotal}
          status={capacityStatus.status}
        />
      ) : null}

      <View style={styles.stateSection}>
        <ThemedText type="body" style={[styles.stateText, { color: theme.textSecondary }]}>
          {stateDescription}
        </ThemedText>

        <View style={styles.energySelector}>
          {ENERGY_OPTIONS.map((energy) => {
            const isSelected = energy === energyLevel;
            return (
              <Pressable
                key={energy}
                onPress={() => handleEnergySelect(energy)}
                style={({ pressed }) => [
                  styles.energyOption,
                  {
                    backgroundColor: isSelected ? theme.primary + "20" : "transparent",
                    borderColor: isSelected ? theme.primary : theme.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <ThemedText
                  type="small"
                  style={{
                    color: isSelected ? theme.primary : theme.textSecondary,
                    fontWeight: isSelected ? "600" : "400",
                  }}
                >
                  {energy}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.actionSection}>
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
                <Button onPress={handleStartFocus} style={styles.actionButton}>
                  Begin Focus
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
                          suggestedAction.type === "recovery"
                            ? theme.success + "15"
                            : theme.backgroundSecondary,
                      },
                    ]}
                  >
                    <Feather
                      name={suggestedAction.type === "recovery" ? "coffee" : "sun"}
                      size={20}
                      color={suggestedAction.type === "recovery" ? theme.success : theme.textSecondary}
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
      </View>

      <Pressable
        onPress={handleRecalibrate}
        style={({ pressed }) => [
          styles.recalibrateButton,
          { opacity: pressed ? 0.6 : 1 },
        ]}
      >
        <Feather name="refresh-cw" size={16} color={theme.textSecondary} />
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          Recalibrate mental state
        </ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stateSection: {
    alignItems: "center",
    marginVertical: Spacing.xl,
  },
  stateText: {
    textAlign: "center",
    marginBottom: Spacing.lg,
    lineHeight: 24,
  },
  energySelector: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  energyOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  actionSection: {
    flex: 1,
    justifyContent: "center",
    marginVertical: Spacing.xl,
  },
  actionCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
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
  recalibrateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginTop: "auto",
  },
});
