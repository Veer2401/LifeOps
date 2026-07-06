/**
 * CommitmentFormScreen
 *
 * Shared screen for both creating and editing a commitment.
 * When `commitmentId` is provided in route params, it loads the
 * existing commitment and operates in "edit" mode.
 */
import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  Platform,
  TextInput,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
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
import {
  scheduleCommitmentReminder,
  cancelCommitmentReminder,
  formatReminderTime,
} from "@/lib/notifications";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type {
  Category,
  CognitiveWeight,
  RepeatPattern,
  CommitmentNature,
  Commitment,
} from "@shared/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type FormRouteProp = RouteProp<RootStackParamList, "CommitmentForm">;

// ─── Options ─────────────────────────────────────────────────────────────────

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

// ─── Helper ───────────────────────────────────────────────────────────────────

/** Convert a Date to "HH:MM" string */
function dateToTimeString(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/** Convert "HH:MM" string to a Date (today's date, at that time) */
function timeStringToDate(time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function CommitmentFormScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<FormRouteProp>();

  const editId = route.params?.commitmentId;
  const isEditMode = !!editId;

  // Form state
  const [mode, setMode] = useState<"select" | "custom">(isEditMode ? "custom" : "select");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("Life");
  const [cognitiveWeight, setCognitiveWeight] = useState<CognitiveWeight>("Moderate");
  const [repeatPattern, setRepeatPattern] = useState<RepeatPattern>("daily");
  const [nature, setNature] = useState<CommitmentNature>("neutral");
  const [duration, setDuration] = useState(15);
  const [customDuration, setCustomDuration] = useState("");
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditMode);

  // Reminder state
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState<Date>(() => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  });
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Load existing commitment in edit mode
  useEffect(() => {
    if (!isEditMode) return;
    (async () => {
      const commitments = await CommitmentStorage.getAll();
      const found = commitments.find((c) => c.id === editId);
      if (found) {
        setTitle(found.title);
        setCategory(found.category);
        setCognitiveWeight(found.cognitiveWeight);
        setRepeatPattern(found.repeatPattern);
        setNature(found.nature);
        setDuration(found.estimatedMinutes);
        // If the stored duration isn't a preset, switch to custom mode
        if (!DURATIONS.includes(found.estimatedMinutes)) {
          setIsCustomDuration(true);
          setCustomDuration(String(found.estimatedMinutes));
        }
        setReminderEnabled(found.reminderEnabled ?? false);
        if (found.reminderTime) {
          setReminderTime(timeStringToDate(found.reminderTime));
        }
      }
      setLoading(false);
    })();
  }, [editId]);

  const canSave = title.trim().length > 0;

  const handlePresetSelect = (preset: PresetCommitment) => {
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

    const timeStr = reminderEnabled ? dateToTimeString(reminderTime) : undefined;

    try {
      if (isEditMode && editId) {
        // Edit existing
        const updated = await CommitmentStorage.update(editId, {
          title: title.trim(),
          category,
          cognitiveWeight,
          repeatPattern,
          nature,
          estimatedMinutes: duration,
          reminderTime: timeStr,
          reminderEnabled,
        });

        // Update notification
        if (updated) {
          if (reminderEnabled && timeStr) {
            await scheduleCommitmentReminder({ ...updated, reminderTime: timeStr, reminderEnabled: true });
          } else {
            await cancelCommitmentReminder(editId);
          }
        }
      } else {
        // Create new
        const created = await CommitmentStorage.create({
          title: title.trim(),
          category,
          cognitiveWeight,
          repeatPattern,
          nature,
          estimatedMinutes: duration,
          startDate: new Date().toISOString(),
          reminderTime: timeStr,
          reminderEnabled,
        });

        if (reminderEnabled && timeStr) {
          await scheduleCommitmentReminder({ ...created, reminderTime: timeStr, reminderEnabled: true });
        }
      }

      navigation.goBack();
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  };

  const handleTimeChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowTimePicker(false);
    if (selectedDate) setReminderTime(selectedDate);
  };

  if (loading) {
    return <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]} />;
  }

  const groupedPresets = {
    Health: PRESET_COMMITMENTS.filter((p) => p.category === "Health"),
    Work: PRESET_COMMITMENTS.filter((p) => p.category === "Work"),
    Life: PRESET_COMMITMENTS.filter((p) => p.category === "Life"),
  };

  // ── Preset picker (create mode only) ─────────────────────────────────────
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

        <Button onPress={() => setMode("custom")} style={styles.customButton}>
          Create Custom Commitment
        </Button>
      </ScrollView>
    );
  }

  // ── Full form ─────────────────────────────────────────────────────────────
  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing["4xl"],
        paddingHorizontal: Spacing.lg,
      }}
    >
      {!isEditMode && (
        <Pressable onPress={() => setMode("select")} style={styles.backLink}>
          <Feather name="arrow-left" size={20} color={theme.textSecondary} />
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            Back to suggestions
          </ThemedText>
        </Pressable>
      )}

      <ThemedText type="h3" style={styles.sectionTitle}>
        {isEditMode ? "Edit commitment" : "Describe your commitment"}
      </ThemedText>
      <Input
        placeholder="e.g., Morning walk, Team standup"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />

      {/* ── How often ── */}
      <ThemedText type="h4" style={styles.label}>
        How often?
      </ThemedText>
      <View style={styles.optionGrid}>
        {PATTERNS.map((p) => {
          const isSelected = repeatPattern === p.value;
          return (
            <Pressable
              key={p.value}
              onPress={() => { Haptics.selectionAsync(); setRepeatPattern(p.value); }}
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

      {/* ── Nature ── */}
      <ThemedText type="h4" style={styles.label}>
        How does this feel?
      </ThemedText>
      <View style={styles.natureGrid}>
        {NATURES.map((n) => {
          const isSelected = nature === n.value;
          return (
            <Pressable
              key={n.value}
              onPress={() => { Haptics.selectionAsync(); setNature(n.value); }}
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
                style={{ color: isSelected ? theme.buttonText : theme.text, fontWeight: "600" }}
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

      {/* ── Cognitive weight ── */}
      <ThemedText type="h4" style={styles.label}>
        How hard is this?
      </ThemedText>
      <View style={styles.optionGrid}>
        {WEIGHTS.map((w) => {
          const isSelected = cognitiveWeight === w.value;
          return (
            <Pressable
              key={w.value}
              onPress={() => { Haptics.selectionAsync(); setCognitiveWeight(w.value); }}
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

      {/* ── Duration ── */}
      <ThemedText type="h4" style={styles.label}>
        How long?
      </ThemedText>
      <View style={styles.durationGrid}>
        {DURATIONS.map((d) => {
          const isSelected = !isCustomDuration && duration === d;
          return (
            <Pressable
              key={d}
              onPress={() => {
                Haptics.selectionAsync();
                setDuration(d);
                setIsCustomDuration(false);
                setCustomDuration("");
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

        {/* Custom chip */}
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            setIsCustomDuration(true);
          }}
          style={[
            styles.durationChip,
            {
              backgroundColor: isCustomDuration ? theme.primary + "20" : "transparent",
              borderColor: isCustomDuration ? theme.primary : theme.border,
            },
          ]}
        >
          <Feather
            name="edit-3"
            size={13}
            color={isCustomDuration ? theme.primary : theme.textSecondary}
          />
          <ThemedText
            type="small"
            style={{ color: isCustomDuration ? theme.primary : theme.textSecondary }}
          >
            Custom
          </ThemedText>
        </Pressable>
      </View>

      {/* Inline custom duration input */}
      {isCustomDuration && (
        <View
          style={[
            styles.customInputRow,
            {
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.primary + "50",
            },
          ]}
        >
          <Feather name="clock" size={16} color={theme.primary} />
          <TextInput
            value={customDuration}
            onChangeText={(text) => {
              // Allow only digits
              const digits = text.replace(/[^0-9]/g, "");
              setCustomDuration(digits);
              const parsed = parseInt(digits, 10);
              if (!isNaN(parsed) && parsed > 0) {
                setDuration(parsed);
              }
            }}
            placeholder="Enter minutes"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            maxLength={3}
            style={[styles.customInput, { color: theme.text }]}
            autoFocus
          />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            min
          </ThemedText>
        </View>
      )}

      {/* ── Reminder time ── */}
      <View
        style={[
          styles.reminderCard,
          { backgroundColor: theme.backgroundDefault, ...Shadows.small },
        ]}
      >
        <View style={styles.reminderHeader}>
          <View style={styles.reminderTitleRow}>
            <Feather name="bell" size={18} color={theme.primary} />
            <View>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                Daily Reminder
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Get notified at the same time every day
              </ThemedText>
            </View>
          </View>
          <Switch
            value={reminderEnabled}
            onValueChange={(val) => {
              Haptics.selectionAsync();
              setReminderEnabled(val);
              if (val && Platform.OS === "android") setShowTimePicker(true);
            }}
            trackColor={{ false: theme.border, true: theme.primary + "66" }}
            thumbColor={reminderEnabled ? theme.primary : theme.backgroundSecondary}
          />
        </View>

        {reminderEnabled && (
          <>
            {/* iOS: inline picker; Android: show on demand */}
            {Platform.OS === "ios" ? (
              <View style={styles.iOSPickerWrapper}>
                <DateTimePicker
                  value={reminderTime}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
                  style={styles.iOSPicker}
                  textColor={theme.text}
                />
              </View>
            ) : (
              <Pressable
                onPress={() => setShowTimePicker(true)}
                style={[
                  styles.androidTimeButton,
                  { backgroundColor: theme.primary + "15", borderColor: theme.primary + "40" },
                ]}
              >
                <Feather name="clock" size={16} color={theme.primary} />
                <ThemedText type="body" style={{ color: theme.primary, fontWeight: "600" }}>
                  {formatReminderTime(dateToTimeString(reminderTime))}
                </ThemedText>
                <Feather name="chevron-right" size={16} color={theme.primary} />
              </Pressable>
            )}

            {showTimePicker && Platform.OS === "android" && (
              <DateTimePicker
                value={reminderTime}
                mode="time"
                is24Hour={false}
                display="default"
                onChange={handleTimeChange}
              />
            )}
          </>
        )}
      </View>

      <Button
        onPress={handleSave}
        disabled={!canSave || saving}
        style={styles.saveButton}
      >
        {saving
          ? isEditMode ? "Saving..." : "Creating..."
          : isEditMode ? "Save Changes" : "Create Commitment"}
      </Button>
    </KeyboardAwareScrollViewCompat>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  sectionTitle: { marginBottom: Spacing.sm },
  subtitle: { marginBottom: Spacing.xl },

  categorySection: { marginBottom: Spacing.xl },
  categoryTitle: { marginBottom: Spacing.md },
  presetGrid: { gap: Spacing.sm },
  presetCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  customButton: { marginTop: Spacing.lg },

  backLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  input: { marginBottom: Spacing.xl },
  label: { marginBottom: Spacing.md, marginTop: Spacing.lg },

  optionGrid: { flexDirection: "row", gap: Spacing.sm },
  optionCard: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
  },

  natureGrid: { gap: Spacing.sm },
  natureCard: { padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1 },

  durationGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  durationChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  customInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  customInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    paddingVertical: Spacing.xs,
  },

  // Reminder card
  reminderCard: {
    marginTop: Spacing.xl,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  reminderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reminderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  iOSPickerWrapper: {
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  iOSPicker: {
    width: "100%",
    height: 160,
  },
  androidTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },

  saveButton: { marginTop: Spacing["3xl"] },
});
