import React, { useState } from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import DateTimePicker from "@react-native-community/datetimepicker";

import { ThemedText } from "@/components/ThemedText";
import { Input } from "@/components/Input";
import { SegmentedControl } from "@/components/SegmentedControl";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { CommitmentStorage } from "@/lib/storage";
import type { Category, CognitiveWeight } from "@shared/types";

const CATEGORIES: Category[] = ["Mind", "Work", "Life"];
const WEIGHTS: CognitiveWeight[] = ["Light", "Moderate", "Heavy"];
const TIME_PRESETS = [5, 10, 15, 30, 45, 60, 90];

export default function AddCommitmentScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("Work");
  const [cognitiveWeight, setCognitiveWeight] = useState<CognitiveWeight>("Moderate");
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [pressurePoint, setPressurePoint] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Please describe your commitment");
      return;
    }

    setSaving(true);
    try {
      await CommitmentStorage.create({
        title: title.trim(),
        category,
        cognitiveWeight,
        estimatedMinutes,
        pressurePoint: pressurePoint?.toISOString(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (e) {
      setError("Could not save commitment");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setPressurePoint(selectedDate);
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
      <View style={styles.section}>
        <Input
          label="What needs your attention?"
          placeholder="Describe your commitment..."
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            setError("");
          }}
          error={error}
          autoFocus
          multiline
          numberOfLines={2}
          style={styles.titleInput}
        />
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          Category
        </ThemedText>
        <SegmentedControl
          options={CATEGORIES}
          value={category}
          onChange={setCategory}
        />
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          Cognitive weight
        </ThemedText>
        <ThemedText type="small" style={[styles.hint, { color: theme.textSecondary }]}>
          How much mental energy will this require?
        </ThemedText>
        <SegmentedControl
          options={WEIGHTS}
          value={cognitiveWeight}
          onChange={setCognitiveWeight}
        />
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          Estimated time
        </ThemedText>
        <View style={styles.timeGrid}>
          {TIME_PRESETS.map((time) => {
            const isSelected = time === estimatedMinutes;
            return (
              <Pressable
                key={time}
                onPress={() => {
                  setEstimatedMinutes(time);
                  Haptics.selectionAsync();
                }}
                style={[
                  styles.timeChip,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.backgroundDefault,
                    borderColor: isSelected ? theme.primary : theme.border,
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
                  {time >= 60 ? `${time / 60}h` : `${time}m`}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          Pressure point (optional)
        </ThemedText>
        <ThemedText type="small" style={[styles.hint, { color: theme.textSecondary }]}>
          When does this need attention by?
        </ThemedText>
        <Pressable
          onPress={() => setShowDatePicker(true)}
          style={[
            styles.dateButton,
            {
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.border,
            },
          ]}
        >
          <Feather name="calendar" size={18} color={theme.textSecondary} />
          <ThemedText
            type="body"
            style={{ color: pressurePoint ? theme.text : theme.textSecondary }}
          >
            {pressurePoint
              ? pressurePoint.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })
              : "Set a pressure point"}
          </ThemedText>
          {pressurePoint ? (
            <Pressable
              onPress={() => setPressurePoint(null)}
              hitSlop={8}
              style={styles.clearDate}
            >
              <Feather name="x" size={18} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </Pressable>
        {showDatePicker ? (
          <View style={styles.datePickerContainer}>
            <DateTimePicker
              value={pressurePoint || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
            {Platform.OS === "ios" ? (
              <Button
                onPress={() => setShowDatePicker(false)}
                style={styles.datePickerDone}
              >
                Done
              </Button>
            ) : null}
          </View>
        ) : null}
      </View>

      <Button onPress={handleSave} disabled={saving} style={styles.saveButton}>
        {saving ? "Saving..." : "Add Commitment"}
      </Button>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  label: {
    marginBottom: Spacing.sm,
    fontWeight: "500",
  },
  hint: {
    marginBottom: Spacing.md,
    fontSize: 13,
  },
  titleInput: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: Spacing.md,
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  timeChip: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minWidth: 60,
    alignItems: "center",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  clearDate: {
    marginLeft: "auto",
  },
  datePickerContainer: {
    marginTop: Spacing.md,
  },
  datePickerDone: {
    marginTop: Spacing.md,
  },
  saveButton: {
    marginTop: Spacing.lg,
  },
});
