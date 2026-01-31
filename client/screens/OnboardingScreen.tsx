import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { MentalStateStorage, UserStateStorage } from "@/lib/storage";
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

interface OnboardingScreenProps {
  onComplete: () => void;
}

type Step = "energy" | "stress" | "goal";

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [step, setStep] = useState<Step>("energy");
  const [capacity, setCapacity] = useState<number | null>(null);
  const [stress, setStress] = useState<string | null>(null);
  const [goal, setGoal] = useState<EnergyMode | null>(null);

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
    if (step === "energy" && capacity !== null) {
      setStep("stress");
    } else if (step === "stress" && stress) {
      setStep("goal");
    }
  };

  const handleComplete = async () => {
    if (capacity === null || !goal) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    await MentalStateStorage.save({
      date: new Date().toDateString(),
      mentalLoad: "Moderate",
      availableTime: 30,
      energyMode: goal,
      capacityUsed: 0,
      capacityTotal: capacity,
    });

    await UserStateStorage.completeOnboarding();
    onComplete();
  };

  const renderEnergyStep = () => (
    <View style={styles.stepContent}>
      <ThemedText type="h2" style={styles.question}>
        How is your energy today?
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

      <Button onPress={handleNext} disabled={capacity === null} style={styles.continueButton}>
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

      <Button onPress={handleNext} disabled={!stress} style={styles.continueButton}>
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
        What do you want today?
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

      <Button onPress={handleComplete} disabled={!goal} style={styles.continueButton}>
        Begin
      </Button>
    </View>
  );

  return (
    <ThemedView
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing["4xl"],
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      {step === "energy" ? renderEnergyStep() : null}
      {step === "stress" ? renderStressStep() : null}
      {step === "goal" ? renderGoalStep() : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
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
