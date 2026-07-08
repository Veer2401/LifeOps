/**
 * PilotInfoModal — Onboarding / Help modal for Pilot
 *
 * Explains what Pilot is, what it can do, and shows example prompts.
 * Auto-shows on first visit (stores a flag in AsyncStorage).
 * Can also be triggered manually via the info button.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Modal,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";

const INFO_SEEN_KEY = "@lifeops/pilotInfoSeen";

interface PilotInfoModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export function PilotInfoModal({ visible, onDismiss }: PilotInfoModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const handleDismiss = useCallback(async () => {
    try {
      await AsyncStorage.setItem(INFO_SEEN_KEY, "true");
    } catch {
      // ignore
    }
    onDismiss();
  }, [onDismiss]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleDismiss}
    >
      <View
        style={[
          styles.modalContainer,
          { backgroundColor: theme.backgroundRoot },
        ]}
      >
        {/* Handle bar */}
        <View style={styles.handleBar}>
          <View
            style={[styles.handle, { backgroundColor: theme.border }]}
          />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + Spacing["2xl"] },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.headerIcon,
                { backgroundColor: theme.primary + "15" },
              ]}
            >
              <Feather name="navigation" size={28} color={theme.primary} />
            </View>
            <ThemedText type="h2" style={styles.title}>
              What is Pilot?
            </ThemedText>
            <ThemedText
              type="body"
              style={[styles.subtitle, { color: theme.textSecondary }]}
            >
              Pilot is your AI co-pilot inside LifeOps.
            </ThemedText>
          </View>

          {/* Description */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.backgroundDefault,
                ...Shadows.small,
              },
            ]}
          >
            <ThemedText type="body" style={styles.description}>
              Instead of manually navigating through different screens, you can
              simply ask Pilot to perform actions or answer questions about your
              commitments, focus sessions, and mental capacity.
            </ThemedText>
            <ThemedText
              type="body"
              style={[styles.description, { marginTop: Spacing.md }]}
            >
              Pilot understands natural language and automates tasks for you.
            </ThemedText>
          </View>

          {/* Capabilities */}
          <ThemedText type="h4" style={styles.sectionTitle}>
            Things you can ask
          </ThemedText>
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.backgroundDefault,
                ...Shadows.small,
              },
            ]}
          >
            {[
              "Show today's commitments",
              "Create a commitment",
              "Move a commitment to another day",
              "Delete or edit commitments",
              "Mark commitments as completed",
              "Start a focus session",
              "Update your energy or stress level",
              "Check remaining mental capacity",
              "Suggest the best next commitment",
              "Answer questions about your schedule",
            ].map((item, index) => (
              <View key={index} style={styles.capabilityRow}>
                <Feather
                  name="check"
                  size={14}
                  color={theme.success}
                  style={styles.capabilityIcon}
                />
                <ThemedText type="small" style={styles.capabilityText}>
                  {item}
                </ThemedText>
              </View>
            ))}
          </View>

          {/* Example Prompts */}
          <ThemedText type="h4" style={styles.sectionTitle}>
            Example prompts
          </ThemedText>
          <View style={styles.examplesContainer}>
            {[
              "Create a cycling commitment for 10 minutes every day.",
              "Move my workout to tomorrow.",
              "What should I do next?",
              "Show my commitments for today.",
              "I'm feeling exhausted.",
              "Start my focus session.",
            ].map((prompt, index) => (
              <View
                key={index}
                style={[
                  styles.exampleChip,
                  {
                    backgroundColor: theme.primary + "10",
                    borderColor: theme.primary + "25",
                  },
                ]}
              >
                <ThemedText
                  type="small"
                  style={[styles.exampleText, { color: theme.primary }]}
                >
                  "{prompt}"
                </ThemedText>
              </View>
            ))}
          </View>

          {/* Dismiss button */}
          <Button onPress={handleDismiss} style={styles.dismissButton}>
            Got it
          </Button>
        </ScrollView>
      </View>
    </Modal>
  );
}

/**
 * Hook that checks whether the user has already seen the Pilot info modal.
 * Returns [hasSeenInfo, setHasSeenInfo].
 */
export function usePilotInfoSeen(): [boolean | null, () => void] {
  const [hasSeen, setHasSeen] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const value = await AsyncStorage.getItem(INFO_SEEN_KEY);
        setHasSeen(value === "true");
      } catch {
        setHasSeen(false);
      }
    })();
  }, []);

  const markSeen = useCallback(() => {
    setHasSeen(true);
  }, []);

  return [hasSeen, markSeen];
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  handleBar: {
    alignItems: "center",
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
    marginTop: Spacing.lg,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: "center",
    lineHeight: 22,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  description: {
    lineHeight: 22,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  capabilityRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  capabilityIcon: {
    marginTop: 2,
    marginRight: Spacing.sm,
  },
  capabilityText: {
    flex: 1,
    lineHeight: 20,
  },
  examplesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing["2xl"],
  },
  exampleChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  exampleText: {
    fontWeight: "500",
  },
  dismissButton: {
    marginTop: Spacing.md,
  },
});
