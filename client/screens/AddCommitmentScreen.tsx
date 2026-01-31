import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { SegmentedControl } from "@/components/SegmentedControl";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { CommitmentStorage } from "@/lib/storage";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type {
  Category,
  CognitiveWeight,
  RepeatPattern,
  CommitmentNature,
} from "@shared/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CATEGORIES: Category[] = ["Life", "Work", "Health"];
const WEIGHTS: { value: CognitiveWeight; label: string }[] = [
  { value: "Low", label: "Low" },
  { value: "Moderate", label: "Moderate" },
  { value: "High", label: "High" },
];
const PATTERNS: { value: RepeatPattern; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];
const NATURES: { value: CommitmentNature; label: string; description: string }[] = [
  { value: "draining", label: "Draining", description: "Takes energy from you" },
  { value: "neutral", label: "Neutral", description: "Neither drains nor restores" },
  { value: "restorative", label: "Restorative", description: "Gives energy back" },
];
const DURATIONS = [5, 10, 15, 30, 45, 60];

export default function AddCommitmentScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("Life");
  const [cognitiveWeight, setCognitiveWeight] = useState<CognitiveWeight>("Moderate");
  const [repeatPattern, setRepeatPattern] = useState<RepeatPattern>("daily");
  const [nature, setNature] = useState<CommitmentNature>("neutral");
  const [duration, setDuration] = useState(15);
  const [saving, setSaving] = useState(false);

  const canSave = title.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(true);

    try {
      await CommitmentStorage.create({
        title: title.trim(),
        category,
        cognitiveWeight,
        repeatPattern,
        nature,
        estimatedMinutes: duration,
        startDate: new Date().toISOString(),
      });

      navigation.goBack();
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
      <ThemedText type="h3" style={styles.sectionTitle}>
        What is this mental contract?
      </ThemedText>
      <Input
        placeholder="e.g., Morning exercise, Team check-in"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />

      <ThemedText type="h4" style={styles.label}>
        Category
      </ThemedText>
      <SegmentedControl
        options={CATEGORIES}
        value={category}
        onChange={(val) => setCategory(val)}
      />

      <ThemedText type="h4" style={styles.label}>
        How mentally demanding is this for you?
      </ThemedText>
      <View style={styles.optionGrid}>
        {WEIGHTS.map((w) => {
          const isSelected = cognitiveWeight === w.value;
          return (
            <Pressable
              key={w.value}
              onPress={() => {
                Haptics.selectionAsync();
                setCognitiveWeight(w.value);
              }}
              style={[
                styles.optionCard,
                {
                  backgroundColor: isSelected ? theme.primary : theme.backgroundDefault,
                  borderColor: isSelected ? theme.primary : theme.border,
                },
              ]}
            >
              <ThemedText
                type="body"
                style={{ color: isSelected ? theme.buttonText : theme.text }}
              >
                {w.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <ThemedText type="h4" style={styles.label}>
        How often does this return?
      </ThemedText>
      <View style={styles.optionGrid}>
        {PATTERNS.map((p) => {
          const isSelected = repeatPattern === p.value;
          return (
            <Pressable
              key={p.value}
              onPress={() => {
                Haptics.selectionAsync();
                setRepeatPattern(p.value);
              }}
              style={[
                styles.optionCard,
                {
                  backgroundColor: isSelected ? theme.primary : theme.backgroundDefault,
                  borderColor: isSelected ? theme.primary : theme.border,
                },
              ]}
            >
              <ThemedText
                type="body"
                style={{ color: isSelected ? theme.buttonText : theme.text }}
              >
                {p.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <ThemedText type="h4" style={styles.label}>
        Is this restorative or draining?
      </ThemedText>
      <View style={styles.natureGrid}>
        {NATURES.map((n) => {
          const isSelected = nature === n.value;
          return (
            <Pressable
              key={n.value}
              onPress={() => {
                Haptics.selectionAsync();
                setNature(n.value);
              }}
              style={[
                styles.natureCard,
                {
                  backgroundColor: isSelected ? theme.primary : theme.backgroundDefault,
                  borderColor: isSelected ? theme.primary : theme.border,
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
                {n.label}
              </ThemedText>
              <ThemedText
                type="small"
                style={{
                  color: isSelected ? theme.buttonText : theme.textSecondary,
                  marginTop: Spacing.xs,
                }}
              >
                {n.description}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <ThemedText type="h4" style={styles.label}>
        Estimated duration
      </ThemedText>
      <View style={styles.durationGrid}>
        {DURATIONS.map((d) => {
          const isSelected = duration === d;
          return (
            <Pressable
              key={d}
              onPress={() => {
                Haptics.selectionAsync();
                setDuration(d);
              }}
              style={[
                styles.durationChip,
                {
                  backgroundColor: isSelected ? theme.primary + "20" : "transparent",
                  borderColor: isSelected ? theme.primary : theme.border,
                },
              ]}
            >
              <ThemedText
                type="small"
                style={{ color: isSelected ? theme.primary : theme.textSecondary }}
              >
                {d} min
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <Button onPress={handleSave} disabled={!canSave || saving} style={styles.saveButton}>
        {saving ? "Creating..." : "Create Mental Contract"}
      </Button>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  input: {
    marginBottom: Spacing.xl,
  },
  label: {
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  optionGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  optionCard: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  natureGrid: {
    gap: Spacing.sm,
  },
  natureCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  durationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  durationChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  saveButton: {
    marginTop: Spacing["3xl"],
  },
});
