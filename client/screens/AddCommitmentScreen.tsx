import React, { useState } from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { CommitmentStorage } from "@/lib/storage";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type {
  Category,
  CognitiveWeight,
  RepeatPattern,
  CommitmentNature,
} from "@shared/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface PresetCommitment {
  title: string;
  category: Category;
  cognitiveWeight: CognitiveWeight;
  nature: CommitmentNature;
  estimatedMinutes: number;
}

const PRESET_COMMITMENTS: PresetCommitment[] = [
  { title: "Morning exercise", category: "Health", cognitiveWeight: "Moderate", nature: "energizing", estimatedMinutes: 30 },
  { title: "Take medications", category: "Health", cognitiveWeight: "Low", nature: "neutral", estimatedMinutes: 5 },
  { title: "Drink water", category: "Health", cognitiveWeight: "Low", nature: "neutral", estimatedMinutes: 5 },
  { title: "Check emails", category: "Work", cognitiveWeight: "Moderate", nature: "tiring", estimatedMinutes: 15 },
  { title: "Team meeting", category: "Work", cognitiveWeight: "Moderate", nature: "neutral", estimatedMinutes: 30 },
  { title: "Focus work time", category: "Work", cognitiveWeight: "High", nature: "tiring", estimatedMinutes: 60 },
  { title: "Call family", category: "Life", cognitiveWeight: "Low", nature: "energizing", estimatedMinutes: 15 },
  { title: "Tidy up space", category: "Life", cognitiveWeight: "Low", nature: "neutral", estimatedMinutes: 15 },
  { title: "Relax time", category: "Life", cognitiveWeight: "Low", nature: "energizing", estimatedMinutes: 30 },
];

const PATTERNS: { value: RepeatPattern; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const NATURES: { value: CommitmentNature; label: string; description: string }[] = [
  { value: "tiring", label: "Tiring", description: "Takes energy from me" },
  { value: "neutral", label: "Neutral", description: "Neither tiring nor energizing" },
  { value: "energizing", label: "Energizing", description: "Gives me energy" },
];

const WEIGHTS: { value: CognitiveWeight; label: string }[] = [
  { value: "Low", label: "Easy" },
  { value: "Moderate", label: "Medium" },
  { value: "High", label: "Hard" },
];

const DURATIONS = [5, 15, 30, 45, 60];

export default function AddCommitmentScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const [mode, setMode] = useState<"select" | "custom">("select");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("Life");
  const [cognitiveWeight, setCognitiveWeight] = useState<CognitiveWeight>("Moderate");
  const [repeatPattern, setRepeatPattern] = useState<RepeatPattern>("daily");
  const [nature, setNature] = useState<CommitmentNature>("neutral");
  const [duration, setDuration] = useState(15);
  const [saving, setSaving] = useState(false);

  const canSave = title.trim().length > 0;

  const handlePresetSelect = async (preset: PresetCommitment) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTitle(preset.title);
    setCategory(preset.category);
    setCognitiveWeight(preset.cognitiveWeight);
    setNature(preset.nature);
    setDuration(preset.estimatedMinutes);
    setMode("custom");
  };

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

  const groupedPresets = {
    Health: PRESET_COMMITMENTS.filter((p) => p.category === "Health"),
    Work: PRESET_COMMITMENTS.filter((p) => p.category === "Work"),
    Life: PRESET_COMMITMENTS.filter((p) => p.category === "Life"),
  };

  if (mode === "select") {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
      >
        <ThemedText type="h3" style={styles.sectionTitle}>
          Quick add
        </ThemedText>
        <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
          Choose a common commitment or create your own
        </ThemedText>

        {(["Health", "Work", "Life"] as Category[]).map((cat) => (
          <View key={cat} style={styles.categorySection}>
            <ThemedText type="h4" style={styles.categoryTitle}>
              {cat}
            </ThemedText>
            <View style={styles.presetGrid}>
              {groupedPresets[cat].map((preset) => (
                <Pressable
                  key={preset.title}
                  onPress={() => handlePresetSelect(preset)}
                  style={({ pressed }) => [
                    styles.presetCard,
                    {
                      backgroundColor: theme.backgroundDefault,
                      borderColor: theme.border,
                      opacity: pressed ? 0.8 : 1,
                      ...Shadows.small,
                    },
                  ]}
                >
                  <ThemedText type="body" style={{ fontWeight: "500" }}>
                    {preset.title}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {preset.estimatedMinutes} min
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <Button
          onPress={() => setMode("custom")}
          style={styles.customButton}
        >
          Create Custom Commitment
        </Button>
      </ScrollView>
    );
  }

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
    >
      <Pressable onPress={() => setMode("select")} style={styles.backLink}>
        <Feather name="arrow-left" size={20} color={theme.textSecondary} />
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          Back to suggestions
        </ThemedText>
      </Pressable>

      <ThemedText type="h3" style={styles.sectionTitle}>
        Describe your commitment
      </ThemedText>
      <Input
        placeholder="e.g., Morning walk, Team standup"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />

      <ThemedText type="h4" style={styles.label}>
        How often?
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
        How does this feel?
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
        How hard is this?
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
        How long?
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
        {saving ? "Creating..." : "Create Commitment"}
      </Button>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    marginBottom: Spacing.xl,
  },
  categorySection: {
    marginBottom: Spacing.xl,
  },
  categoryTitle: {
    marginBottom: Spacing.md,
  },
  presetGrid: {
    gap: Spacing.sm,
  },
  presetCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  customButton: {
    marginTop: Spacing.lg,
  },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
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
