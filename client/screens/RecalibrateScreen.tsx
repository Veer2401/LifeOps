import React, { useState, useEffect } from "react";
import { StyleSheet, View, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { MentalStateStorage } from "@/lib/storage";
import { analyzeMentalState } from "@/lib/pilot";

const DAY_OPTIONS = [
  "I'm full of energy and want to push hard today.",
  "I feel good, let's have a productive but balanced day.",
  "I'm a bit tired, just want to do the essentials.",
  "I'm exhausted and need to protect my energy today.",
];

export default function RecalibrateScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation();

  const [selectedText, setSelectedText] = useState("");
  const [currentCapacityUsed, setCurrentCapacityUsed] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCurrentState();
  }, []);

  const loadCurrentState = async () => {
    const state = await MentalStateStorage.get();
    if (state) {
      if (state.goalText) setSelectedText(state.goalText);
      setCurrentCapacityUsed(state.capacityUsed);
    }
  };

  const handleSave = async () => {
    if (!selectedText) return;

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const analysis = await analyzeMentalState(selectedText);

      await MentalStateStorage.save({
        date: new Date().toDateString(),
        mentalLoad: analysis.mentalLoad,
        availableTime: 30, // Default available time
        energyMode: analysis.energyMode,
        capacityUsed: currentCapacityUsed,
        capacityTotal: analysis.capacityTotal,
        goalText: selectedText,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (e) {
      console.error("Failed to analyze mental state", e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // Fallback
      await MentalStateStorage.save({
        date: new Date().toDateString(),
        mentalLoad: "Moderate",
        availableTime: 30,
        energyMode: "Protect",
        capacityUsed: currentCapacityUsed,
        capacityTotal: 75,
        goalText: selectedText,
      });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundRoot,
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        },
      ]}
    >
      <View style={styles.content}>
        <ThemedText type="h2" style={styles.question}>
          Adjust your day
        </ThemedText>

        <ThemedText
          type="body"
          style={[styles.subtitle, { color: theme.textSecondary }]}
        >
          Did something change? Let Pilot know how you are feeling or if your
          goals have shifted.
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
          onPress={handleSave}
          disabled={!selectedText || saving}
          style={styles.continueButton}
        >
          {saving ? "Updating..." : "Update State"}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
