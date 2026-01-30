import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { MentalStateStorage, UserStateStorage } from "@/lib/storage";
import type { MentalLoad, AvailableTime, EnergyMode } from "@shared/types";

const MENTAL_LOAD_CAPACITY: Record<MentalLoad, number> = {
  "Very Light": 120,
  "Light": 100,
  "Moderate": 75,
  "Heavy": 50,
  "Very Heavy": 30,
};

interface OnboardingScreenProps {
  onComplete: () => void;
}

type Step = "mental" | "time" | "mode";

const MENTAL_LOADS: { value: MentalLoad; label: string }[] = [
  { value: "Very Light", label: "Very Light" },
  { value: "Light", label: "Light" },
  { value: "Moderate", label: "Moderate" },
  { value: "Heavy", label: "Heavy" },
  { value: "Very Heavy", label: "Very Heavy" },
];

const TIME_OPTIONS: { value: AvailableTime; label: string }[] = [
  { value: 5, label: "5 minutes" },
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "60+ minutes" },
];

const ENERGY_MODES: { value: EnergyMode; label: string; description: string }[] = [
  { value: "Push", label: "Push gently", description: "Take on more when energy allows" },
  { value: "Protect", label: "Protect and recover", description: "Preserve energy for sustainability" },
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [step, setStep] = useState<Step>("mental");
  const [mentalLoad, setMentalLoad] = useState<MentalLoad | null>(null);
  const [availableTime, setAvailableTime] = useState<AvailableTime | null>(null);
  const [energyMode, setEnergyMode] = useState<EnergyMode | null>(null);

  const handleMentalSelect = (load: MentalLoad) => {
    Haptics.selectionAsync();
    setMentalLoad(load);
  };

  const handleTimeSelect = (time: AvailableTime) => {
    Haptics.selectionAsync();
    setAvailableTime(time);
  };

  const handleModeSelect = (mode: EnergyMode) => {
    Haptics.selectionAsync();
    setEnergyMode(mode);
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === "mental" && mentalLoad) {
      setStep("time");
    } else if (step === "time" && availableTime) {
      setStep("mode");
    }
  };

  const handleComplete = async () => {
    if (!mentalLoad || !availableTime || !energyMode) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    await MentalStateStorage.save({
      date: new Date().toDateString(),
      mentalLoad,
      availableTime,
      energyMode,
      capacityUsed: 0,
      capacityTotal: MENTAL_LOAD_CAPACITY[mentalLoad],
    });

    await UserStateStorage.completeOnboarding();
    onComplete();
  };

  const renderMentalStep = () => (
    <View style={styles.stepContent}>
      <ThemedText type="h2" style={styles.question}>
        How mentally heavy does today feel?
      </ThemedText>

      <View style={styles.options}>
        {MENTAL_LOADS.map((item) => {
          const isSelected = mentalLoad === item.value;
          return (
            <Pressable
              key={item.value}
              onPress={() => handleMentalSelect(item.value)}
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
                  fontWeight: isSelected ? "600" : "400",
                }}
              >
                {item.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <Button onPress={handleNext} disabled={!mentalLoad} style={styles.continueButton}>
        Continue
      </Button>
    </View>
  );

  const renderTimeStep = () => (
    <View style={styles.stepContent}>
      <ThemedText type="h2" style={styles.question}>
        How much time do you realistically have right now?
      </ThemedText>

      <View style={styles.options}>
        {TIME_OPTIONS.map((option) => {
          const isSelected = availableTime === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => handleTimeSelect(option.value)}
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
                  fontWeight: isSelected ? "600" : "400",
                }}
              >
                {option.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <Button onPress={handleNext} disabled={!availableTime} style={styles.continueButton}>
        Continue
      </Button>
    </View>
  );

  const renderModeStep = () => (
    <View style={styles.stepContent}>
      <ThemedText type="h2" style={styles.question}>
        How do you want to treat your energy today?
      </ThemedText>

      <View style={styles.modeOptions}>
        {ENERGY_MODES.map((mode) => {
          const isSelected = energyMode === mode.value;
          return (
            <Pressable
              key={mode.value}
              onPress={() => handleModeSelect(mode.value)}
              style={({ pressed }) => [
                styles.modeCard,
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
                {mode.label}
              </ThemedText>
              <ThemedText
                type="small"
                style={{
                  color: isSelected ? theme.buttonText : theme.textSecondary,
                  textAlign: "center",
                }}
              >
                {mode.description}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <Button onPress={handleComplete} disabled={!energyMode} style={styles.continueButton}>
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
      {step === "mental" && renderMentalStep()}
      {step === "time" && renderTimeStep()}
      {step === "mode" && renderModeStep()}
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
    alignItems: "center",
  },
  modeOptions: {
    gap: Spacing.lg,
  },
  modeCard: {
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
