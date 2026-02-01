import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { MentalStateStorage } from "@/lib/storage";
import type { EnergyMode } from "@shared/types";

const CAPACITY_OPTIONS: { value: number; label: string; description: string }[] = [
  { value: 120, label: "Full energy", description: "Ready to take on anything" },
  { value: 100, label: "Good energy", description: "Feeling capable today" },
  { value: 75, label: "Okay energy", description: "Managing, but pacing myself" },
  { value: 50, label: "Low energy", description: "Need to take it easy" },
  { value: 30, label: "Very low", description: "Rest is priority today" },
];

const STRESS_OPTIONS: { value: string; label: string; description: string }[] = [
  { value: "calm", label: "Calm", description: "Feeling peaceful and relaxed" },
  { value: "normal", label: "Normal", description: "Typical day, nothing unusual" },
  { value: "busy", label: "Busy", description: "Have a lot on my plate" },
  { value: "stressed", label: "Stressed", description: "Feeling overwhelmed" },
];

const GOAL_OPTIONS: { value: EnergyMode; label: string; description: string }[] = [
  { value: "Push", label: "Get things done", description: "I want to make progress today" },
  { value: "Protect", label: "Take it easy", description: "I need to rest and recover" },
];

type Step = "energy" | "stress" | "goal";

export default function RecalibrateScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation();

  const [step, setStep] = useState<Step>("energy");
  const [capacity, setCapacity] = useState<number>(75);
  const [stress, setStress] = useState<string>("normal");
  const [goal, setGoal] = useState<EnergyMode>("Protect");
  const [currentCapacityUsed, setCurrentCapacityUsed] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCurrentState();
  }, []);

  const loadCurrentState = async () => {
    const state = await MentalStateStorage.get();
    if (state) {
      setCapacity(state.capacityTotal);
      setGoal(state.energyMode);
      setCurrentCapacityUsed(state.capacityUsed);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === "stress") {
      setStep("energy");
    } else if (step === "goal") {
      setStep("stress");
    }
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === "energy") {
      setStep("stress");
    } else if (step === "stress") {
      setStep("goal");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await MentalStateStorage.save({
        date: new Date().toDateString(),
        mentalLoad: "Moderate",
        availableTime: 30,
        energyMode: goal,
        capacityUsed: currentCapacityUsed,
        capacityTotal: capacity,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  const renderEnergyStep = () => (
    <View style={styles.stepContent}>
      <ThemedText type="h2" style={styles.question}>
        How is your energy right now?
      </ThemedText>

      <View style={styles.options}>
        {CAPACITY_OPTIONS.map((item) => {
          const isSelected = capacity === item.value;
          return (
            <Pressable
              key={item.value}
              onPress={() => {
                Haptics.selectionAsync();
                setCapacity(item.value);
              }}
              style={({ pressed }) => [
                styles.optionCard,
                {
                  backgroundColor: isSelected ? theme.primary : theme.backgroundDefault,
                  borderColor: isSelected ? theme.primary : theme.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <ThemedText
                type="body"
                style={{
                  color: isSelected ? theme.buttonText : theme.text,
                  fontWeight: "600",
                }}
              >
                {item.label}
              </ThemedText>
              <ThemedText
                type="small"
                style={{
                  color: isSelected ? theme.buttonText : theme.textSecondary,
                  marginTop: Spacing.xs,
                }}
              >
                {item.description}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <Button onPress={handleNext} style={styles.continueButton}>
        Continue
      </Button>
    </View>
  );

  const renderStressStep = () => (
    <View style={styles.stepContent}>
      <Pressable onPress={handleBack} style={styles.backButton}>
        <Feather name="arrow-left" size={24} color={theme.text} />
      </Pressable>

      <ThemedText type="h2" style={styles.question}>
        How are you feeling?
      </ThemedText>

      <View style={styles.options}>
        {STRESS_OPTIONS.map((item) => {
          const isSelected = stress === item.value;
          return (
            <Pressable
              key={item.value}
              onPress={() => {
                Haptics.selectionAsync();
                setStress(item.value);
              }}
              style={({ pressed }) => [
                styles.optionCard,
                {
                  backgroundColor: isSelected ? theme.primary : theme.backgroundDefault,
                  borderColor: isSelected ? theme.primary : theme.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <ThemedText
                type="body"
                style={{
                  color: isSelected ? theme.buttonText : theme.text,
                  fontWeight: "600",
                }}
              >
                {item.label}
              </ThemedText>
              <ThemedText
                type="small"
                style={{
                  color: isSelected ? theme.buttonText : theme.textSecondary,
                  marginTop: Spacing.xs,
                }}
              >
                {item.description}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <Button onPress={handleNext} style={styles.continueButton}>
        Continue
      </Button>
    </View>
  );

  const renderGoalStep = () => (
    <View style={styles.stepContent}>
      <Pressable onPress={handleBack} style={styles.backButton}>
        <Feather name="arrow-left" size={24} color={theme.text} />
      </Pressable>

      <ThemedText type="h2" style={styles.question}>
        What do you want right now?
      </ThemedText>

      <View style={styles.goalOptions}>
        {GOAL_OPTIONS.map((item) => {
          const isSelected = goal === item.value;
          return (
            <Pressable
              key={item.value}
              onPress={() => {
                Haptics.selectionAsync();
                setGoal(item.value);
              }}
              style={({ pressed }) => [
                styles.goalCard,
                {
                  backgroundColor: isSelected ? theme.primary : theme.backgroundDefault,
                  borderColor: isSelected ? theme.primary : theme.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <ThemedText
                type="h4"
                style={{
                  color: isSelected ? theme.buttonText : theme.text,
                  marginBottom: Spacing.xs,
                }}
              >
                {item.label}
              </ThemedText>
              <ThemedText
                type="small"
                style={{
                  color: isSelected ? theme.buttonText : theme.textSecondary,
                  textAlign: "center",
                }}
              >
                {item.description}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <Button onPress={handleSave} disabled={saving} style={styles.continueButton}>
        {saving ? "Saving..." : "Update State"}
      </Button>
    </View>
  );

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
        flexGrow: 1,
      }}
    >
      {step === "energy" ? renderEnergyStep() : null}
      {step === "stress" ? renderStressStep() : null}
      {step === "goal" ? renderGoalStep() : null}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
  },
  backButton: {
    marginBottom: Spacing.lg,
    alignSelf: "flex-start",
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  question: {
    textAlign: "center",
    marginBottom: Spacing["3xl"],
    lineHeight: 32,
  },
  options: {
    gap: Spacing.md,
  },
  optionCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  goalOptions: {
    gap: Spacing.lg,
  },
  goalCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: "center",
  },
  continueButton: {
    marginTop: "auto",
    marginBottom: Spacing.xl,
  },
});
