import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { MentalStateStorage } from "@/lib/storage";
import type { MentalLoad, AvailableTime, EnergyMode } from "@shared/types";

const MENTAL_LOAD_CAPACITY: Record<MentalLoad, number> = {
  "Very Light": 120,
  "Light": 100,
  "Moderate": 75,
  "Heavy": 50,
  "Very Heavy": 30,
};

const MENTAL_LOADS: MentalLoad[] = ["Very Light", "Light", "Moderate", "Heavy", "Very Heavy"];
const TIME_OPTIONS: { value: AvailableTime; label: string }[] = [
  { value: 5, label: "5 min" },
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 60, label: "60+ min" },
];

export default function RecalibrateScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation();

  const [mentalLoad, setMentalLoad] = useState<MentalLoad>("Moderate");
  const [availableTime, setAvailableTime] = useState<AvailableTime>(30);
  const [energyMode, setEnergyMode] = useState<EnergyMode>("Protect");
  const [currentCapacityUsed, setCurrentCapacityUsed] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCurrentState();
  }, []);

  const loadCurrentState = async () => {
    const state = await MentalStateStorage.get();
    if (state) {
      setMentalLoad(state.mentalLoad);
      setAvailableTime(state.availableTime);
      setEnergyMode(state.energyMode);
      setCurrentCapacityUsed(state.capacityUsed);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await MentalStateStorage.save({
        date: new Date().toDateString(),
        mentalLoad,
        availableTime,
        energyMode,
        capacityUsed: currentCapacityUsed,
        capacityTotal: MENTAL_LOAD_CAPACITY[mentalLoad],
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
    >
      <ThemedText type="body" style={[styles.intro, { color: theme.textSecondary }]}>
        Adjust your mental state to reflect how you feel right now
      </ThemedText>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          Mental heaviness
        </ThemedText>
        <View style={styles.optionsGrid}>
          {MENTAL_LOADS.map((load) => {
            const isSelected = load === mentalLoad;
            return (
              <Pressable
                key={load}
                onPress={() => {
                  setMentalLoad(load);
                  Haptics.selectionAsync();
                }}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.backgroundDefault,
                    borderColor: isSelected ? theme.primary : theme.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <ThemedText
                  type="small"
                  style={{
                    color: isSelected ? theme.buttonText : theme.text,
                    fontWeight: isSelected ? "600" : "400",
                  }}
                >
                  {load}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          Available time
        </ThemedText>
        <View style={styles.timeGrid}>
          {TIME_OPTIONS.map((option) => {
            const isSelected = option.value === availableTime;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  setAvailableTime(option.value);
                  Haptics.selectionAsync();
                }}
                style={({ pressed }) => [
                  styles.timeOption,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.backgroundDefault,
                    borderColor: isSelected ? theme.primary : theme.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <ThemedText
                  type="small"
                  style={{
                    color: isSelected ? theme.buttonText : theme.text,
                    fontWeight: isSelected ? "600" : "400",
                  }}
                >
                  {option.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          Energy mode
        </ThemedText>
        <View style={styles.modeGrid}>
          <Pressable
            onPress={() => {
              setEnergyMode("Push");
              Haptics.selectionAsync();
            }}
            style={({ pressed }) => [
              styles.modeOption,
              {
                backgroundColor: energyMode === "Push" ? theme.primary : theme.backgroundDefault,
                borderColor: energyMode === "Push" ? theme.primary : theme.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <ThemedText
              type="body"
              style={{
                color: energyMode === "Push" ? theme.buttonText : theme.text,
                fontWeight: energyMode === "Push" ? "600" : "400",
              }}
            >
              Push
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => {
              setEnergyMode("Protect");
              Haptics.selectionAsync();
            }}
            style={({ pressed }) => [
              styles.modeOption,
              {
                backgroundColor: energyMode === "Protect" ? theme.primary : theme.backgroundDefault,
                borderColor: energyMode === "Protect" ? theme.primary : theme.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <ThemedText
              type="body"
              style={{
                color: energyMode === "Protect" ? theme.buttonText : theme.text,
                fontWeight: energyMode === "Protect" ? "600" : "400",
              }}
            >
              Protect
            </ThemedText>
          </Pressable>
        </View>
      </View>

      <Button onPress={handleSave} disabled={saving} style={styles.saveButton}>
        {saving ? "Saving..." : "Update State"}
      </Button>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  intro: {
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  label: {
    marginBottom: Spacing.md,
    fontWeight: "500",
  },
  optionsGrid: {
    gap: Spacing.sm,
  },
  option: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  timeOption: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  modeGrid: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  modeOption: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  saveButton: {
    marginTop: Spacing.lg,
  },
});
