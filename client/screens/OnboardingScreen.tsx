import React, { useState } from "react";
import { StyleSheet, View, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { MentalStateStorage, UserStateStorage } from "@/lib/storage";
import { analyzeMentalState } from "@/lib/pilot";

const DAY_OPTIONS = [
  "I'm full of energy and want to push hard today.",
  "I feel good, let's have a productive but balanced day.",
  "I'm a bit tired, just want to do the essentials.",
  "I'm exhausted and need to protect my energy today.",
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({
  onComplete,
}: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [selectedText, setSelectedText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!selectedText) return;

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const analysis = await analyzeMentalState(selectedText);

      await MentalStateStorage.save({
        date: new Date().toDateString(),
        mentalLoad: analysis.mentalLoad,
        availableTime: 30, // Default available time
        energyMode: analysis.energyMode,
        capacityUsed: 0,
        capacityTotal: analysis.capacityTotal,
        goalText: selectedText,
      });

      await UserStateStorage.completeOnboarding();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete();
    } catch (e) {
      console.error("Failed to analyze mental state", e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Fallback in case of error
      await MentalStateStorage.save({
        date: new Date().toDateString(),
        mentalLoad: "Moderate",
        availableTime: 30,
        energyMode: "Protect",
        capacityUsed: 0,
        capacityTotal: 75,
        goalText: selectedText,
      });
      await UserStateStorage.completeOnboarding();
      onComplete();
    } finally {
      setLoading(false);
    }
  };

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
      <View style={styles.content}>
        <ThemedText type="h2" style={styles.question}>
          How do you want to get things done today?
        </ThemedText>

        <ThemedText
          type="body"
          style={[styles.subtitle, { color: theme.textSecondary }]}
        >
          Select how you are feeling and what you want to achieve. Pilot will
          set up your day based on your input.
        </ThemedText>

        <ScrollView
          style={styles.optionsContainer}
          contentContainerStyle={styles.optionsList}
        >
          {DAY_OPTIONS.map((option, index) => {
            const isSelected = selectedText === option;
            return (
              <Pressable
                key={index}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedText(option);
                }}
                style={({ pressed }) => [
                  styles.optionCard,
                  {
                    backgroundColor: isSelected
                      ? theme.primary
                      : theme.backgroundDefault,
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
                  {option}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>

        <Button
          onPress={handleComplete}
          disabled={!selectedText || loading}
          style={styles.continueButton}
        >
          {loading ? "Setting up..." : "Begin"}
        </Button>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  content: {
    flex: 1,
  },
  question: {
    textAlign: "center",
    marginBottom: Spacing.md,
    lineHeight: 32,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  optionsContainer: {
    flex: 1,
  },
  optionsList: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  optionCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  continueButton: {
    marginTop: Spacing.xl,
  },
});
