import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { PlannerStorage } from "@/lib/storage";
import { formatTimeEstimate } from "@/lib/cognitiveEngine";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type {
  AdaptivePlan,
  PlannedCommitment,
  Category,
  CognitiveWeight,
} from "@shared/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// ─── Colour helpers ───────────────────────────────────────────────────────────

const LEVEL_COLORS = {
  high: { bg: "#6B9B7F", text: "#FFFFFF" },
  moderate: { bg: "#C4A77D", text: "#FFFFFF" },
  low: { bg: "#B07D7D", text: "#FFFFFF" },
  critical: { bg: "#8B4A4A", text: "#FFFFFF" },
};

const WEIGHT_COLORS: Record<CognitiveWeight, string> = {
  Low: "#6B9B7F",
  Moderate: "#C4A77D",
  High: "#B07D7D",
};

const CATEGORY_ICONS: Record<Category, keyof typeof Feather.glyphMap> = {
  Health: "heart",
  Work: "briefcase",
  Life: "sun",
};

const NATURE_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  tiring: "zap-off",
  neutral: "minus-circle",
  energizing: "zap",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function CapacityBar({
  used,
  total,
  level,
}: {
  used: number;
  total: number;
  level: "high" | "moderate" | "low" | "critical";
}) {
  const { theme } = useTheme();
  const pct = Math.min((used / total) * 100, 100);
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: pct,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const barColor =
    level === "high"
      ? theme.success
      : level === "moderate"
      ? theme.warning
      : theme.error;

  return (
    <View
      style={[
        styles.capacityCard,
        { backgroundColor: theme.backgroundDefault, ...Shadows.small },
      ]}
    >
      <View style={styles.capacityRow}>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          Mental Capacity
        </ThemedText>
        <ThemedText type="small" style={{ color: barColor, fontWeight: "600" }}>
          {Math.round(pct)}% used
        </ThemedText>
      </View>
      <View style={[styles.barTrack, { backgroundColor: theme.backgroundSecondary }]}>
        <Animated.View
          style={[
            styles.barFill,
            {
              backgroundColor: barColor,
              width: widthAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>
      <View style={styles.capacityRow}>
        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
          {Math.round(used)} pts used
        </ThemedText>
        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
          {Math.max(0, Math.round(total - used))} pts remaining
        </ThemedText>
      </View>
    </View>
  );
}

function RecommendationCard({
  text,
  level,
}: {
  text: string;
  level: "high" | "moderate" | "low" | "critical";
}) {
  const { theme } = useTheme();
  const colors = LEVEL_COLORS[level];
  const icon: keyof typeof Feather.glyphMap =
    level === "high"
      ? "trending-up"
      : level === "moderate"
      ? "info"
      : level === "low"
      ? "alert-triangle"
      : "alert-circle";

  return (
    <View style={[styles.recommendationCard, { backgroundColor: colors.bg }]}>
      <Feather name={icon} size={18} color={colors.text} style={{ marginTop: 2 }} />
      <ThemedText
        type="body"
        style={[styles.recommendationText, { color: colors.text }]}
      >
        {text}
      </ThemedText>
    </View>
  );
}

function PulseRing({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.15,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.pulseRing,
        {
          borderColor: color,
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
}

function PendingCard({
  item,
  isNext,
  onStart,
  onDefer,
}: {
  item: PlannedCommitment;
  isNext: boolean;
  onStart: () => void;
  onDefer: () => void;
}) {
  const { theme } = useTheme();
  const weightColor = WEIGHT_COLORS[item.commitment.cognitiveWeight];

  return (
    <View style={styles.cardWrapper}>
      {isNext && <PulseRing color={theme.primary} />}
      <View
        style={[
          styles.commitmentCard,
          {
            backgroundColor: theme.backgroundDefault,
            borderColor: isNext ? theme.primary : "transparent",
            borderWidth: isNext ? 1.5 : 0,
            ...Shadows.medium,
          },
        ]}
      >
        {/* Rank badge */}
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.rankBadge,
              {
                backgroundColor: isNext
                  ? theme.primary + "22"
                  : theme.backgroundSecondary,
              },
            ]}
          >
            {isNext ? (
              <ThemedText
                type="caption"
                style={{ color: theme.primary, fontWeight: "700" }}
              >
                NEXT
              </ThemedText>
            ) : (
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                #{item.rank}
              </ThemedText>
            )}
          </View>

          {/* Category & nature */}
          <View style={styles.badgeRow}>
            <View style={styles.miniChip}>
              <Feather
                name={CATEGORY_ICONS[item.commitment.category]}
                size={12}
                color={theme.textSecondary}
              />
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                {item.commitment.category}
              </ThemedText>
            </View>
            <View
              style={[
                styles.miniChip,
                { backgroundColor: weightColor + "18" },
              ]}
            >
              <Feather
                name={NATURE_ICONS[item.commitment.nature] ?? "circle"}
                size={12}
                color={weightColor}
              />
              <ThemedText type="caption" style={{ color: weightColor, fontWeight: "600" }}>
                {item.commitment.cognitiveWeight === "Low"
                  ? "Easy"
                  : item.commitment.cognitiveWeight === "High"
                  ? "Hard"
                  : "Medium"}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Title */}
        <ThemedText
          type="body"
          style={{ fontWeight: "600", marginBottom: Spacing.xs }}
        >
          {item.commitment.title}
        </ThemedText>

        {/* Reason */}
        <ThemedText
          type="small"
          style={{ color: theme.textSecondary, marginBottom: Spacing.md }}
        >
          {item.reason}
        </ThemedText>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.metaChip}>
            <Feather name="clock" size={13} color={theme.textSecondary} />
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {formatTimeEstimate(item.commitment.estimatedMinutes)}
            </ThemedText>
          </View>
          <View style={styles.metaChip}>
            <Feather name="cpu" size={13} color={theme.textSecondary} />
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              ~{item.capacityCost} pts
            </ThemedText>
          </View>
        </View>

        {isNext && (
          <View style={styles.actionRow}>
            <Button
              onPress={onStart}
              style={styles.startButton}
            >
              Start Now
            </Button>
            <Pressable
              onPress={onDefer}
              style={({ pressed }) => [
                styles.deferButton,
                {
                  backgroundColor: theme.backgroundSecondary,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Feather name="skip-forward" size={14} color={theme.textSecondary} />
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Defer
              </ThemedText>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

function AutoRescheduledCard({ item }: { item: PlannedCommitment }) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.commitmentCard,
        styles.deferredCard,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: theme.warning + "40",
          borderWidth: 1,
          opacity: 0.8,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.rankBadge, { backgroundColor: theme.warning + "18" }]}>
          <Feather name="calendar" size={12} color={theme.warning} />
          <ThemedText type="caption" style={{ color: theme.warning, fontWeight: "600" }}>
            Tomorrow
          </ThemedText>
        </View>
        <View style={styles.miniChip}>
          <Feather
            name={CATEGORY_ICONS[item.commitment.category]}
            size={12}
            color={theme.textSecondary}
          />
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {item.commitment.category}
          </ThemedText>
        </View>
      </View>
      <ThemedText
        type="body"
        style={{ fontWeight: "500", color: theme.textSecondary, marginBottom: Spacing.xs }}
      >
        {item.commitment.title}
      </ThemedText>
      <ThemedText type="small" style={{ color: theme.warning }}>
        {item.reason}
      </ThemedText>
    </View>
  );
}

function CompletedCard({ item }: { item: PlannedCommitment }) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.commitmentCard,
        {
          backgroundColor: theme.backgroundDefault,
          opacity: 0.65,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.rankBadge, { backgroundColor: theme.success + "18" }]}>
          <Feather name="check" size={12} color={theme.success} />
          <ThemedText type="caption" style={{ color: theme.success, fontWeight: "600" }}>
            Done
          </ThemedText>
        </View>
      </View>
      <ThemedText
        type="body"
        style={{
          fontWeight: "500",
          textDecorationLine: "line-through",
          color: theme.textSecondary,
        }}
      >
        {item.commitment.title}
      </ThemedText>
    </View>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  label,
  color,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  color: string;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionLine, { backgroundColor: color + "40" }]} />
      <Feather name={icon} size={13} color={color} />
      <ThemedText type="caption" style={[styles.sectionLabel, { color }]}>
        {label}
      </ThemedText>
      <View style={[styles.sectionLine, { backgroundColor: color + "40" }]} />
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function InsightScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const [plan, setPlan] = useState<AdaptivePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deferring, setDeferring] = useState<string | null>(null);

  const listFadeAnim = useRef(new Animated.Value(0)).current;

  const loadPlan = useCallback(async () => {
    try {
      const result = await PlannerStorage.generateAdaptivePlan();
      setPlan(result);
      Animated.timing(listFadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    } finally {
      setLoading(false);
    }
  }, []);

  const animateAndReload = useCallback(async () => {
    listFadeAnim.setValue(0);
    await loadPlan();
  }, [loadPlan]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  // Re-generate the plan whenever this screen gains focus
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      animateAndReload();
    });
    return unsubscribe;
  }, [navigation, animateAndReload]);

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await animateAndReload();
    setRefreshing(false);
  };

  const handleStart = (commitmentId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("FocusSession", { commitmentId });
  };

  const handleDefer = async (commitmentId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDeferring(commitmentId);
    // Animate out → reload
    Animated.timing(listFadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(async () => {
      await animateAndReload();
      setDeferring(null);
    });
  };

  if (loading) {
    return <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]} />;
  }

  if (!plan) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
        contentContainerStyle={[
          styles.emptyContent,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <EmptyState
          image={require("../../assets/images/daily-replay-empty.png")}
          title="Set your mental state first"
          message="Recalibrate your energy and stress levels so the planner can build your optimal day."
        />
        <Button
          onPress={() => navigation.navigate("Recalibrate")}
          style={styles.recalibrateButton}
        >
          Recalibrate
        </Button>
      </ScrollView>
    );
  }

  const pending = plan.items.filter((i) => i.plannedStatus === "pending");
  const autoRescheduled = plan.items.filter(
    (i) => i.plannedStatus === "auto-rescheduled"
  );
  const completed = plan.items.filter((i) => i.plannedStatus === "completed");

  const topItem = pending[0] ?? null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.pageHeader}>
        <View>
          <ThemedText type="h3">Your Plan</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </ThemedText>
        </View>
        <Pressable
          onPress={() => navigation.navigate("Recalibrate")}
          style={({ pressed }) => [
            styles.recalibrateChip,
            {
              backgroundColor: theme.backgroundDefault,
              opacity: pressed ? 0.7 : 1,
              ...Shadows.small,
            },
          ]}
        >
          <Feather name="refresh-cw" size={13} color={theme.primary} />
          <ThemedText type="caption" style={{ color: theme.primary, fontWeight: "600" }}>
            Recalibrate
          </ThemedText>
        </Pressable>
      </View>

      {/* Capacity bar */}
      <CapacityBar
        used={plan.capacityUsed}
        total={plan.capacityTotal}
        level={plan.recommendationLevel}
      />

      {/* Recommendation */}
      <RecommendationCard
        text={plan.recommendation}
        level={plan.recommendationLevel}
      />

      {/* Plan list */}
      <Animated.View style={{ opacity: listFadeAnim }}>
        {/* ── Pending section ─────────────────────────────────────── */}
        {pending.length > 0 && (
          <>
            <SectionHeader
              icon="list"
              label="ADAPTIVE PLAN"
              color={theme.primary}
            />
            {pending.map((item) => (
              <PendingCard
                key={item.commitment.id}
                item={item}
                isNext={item.commitment.id === topItem?.commitment.id && deferring !== item.commitment.id}
                onStart={() => handleStart(item.commitment.id)}
                onDefer={() => handleDefer(item.commitment.id)}
              />
            ))}
          </>
        )}

        {pending.length === 0 && completed.length === 0 && autoRescheduled.length === 0 && (
          <View style={styles.emptyPlan}>
            <Feather name="sun" size={32} color={theme.textSecondary} />
            <ThemedText
              type="body"
              style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.md }}
            >
              No commitments due today yet.{"\n"}Add a commitment to get started.
            </ThemedText>
            <Button
              onPress={() => navigation.navigate("AddCommitment")}
              style={{ marginTop: Spacing.xl }}
            >
              Add Commitment
            </Button>
          </View>
        )}

        {/* ── Auto-rescheduled section ─────────────────────────────── */}
        {autoRescheduled.length > 0 && (
          <>
            <SectionHeader
              icon="calendar"
              label="MOVED TO TOMORROW"
              color={theme.warning}
            />
            {autoRescheduled.map((item) => (
              <AutoRescheduledCard key={item.commitment.id} item={item} />
            ))}
          </>
        )}

        {/* ── Completed section ─────────────────────────────────────── */}
        {completed.length > 0 && (
          <>
            <SectionHeader
              icon="check-circle"
              label="COMPLETED"
              color={theme.success}
            />
            {completed.map((item) => (
              <CompletedCard key={item.commitment.id} item={item} />
            ))}
          </>
        )}
      </Animated.View>

      {/* Footer note */}
      <ThemedText
        type="caption"
        style={[styles.footerNote, { color: theme.textSecondary }]}
      >
        Plan updates automatically as you complete or defer commitments.
      </ThemedText>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyContent: { flexGrow: 1 },

  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },

  recalibrateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },

  // Capacity bar
  capacityCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  capacityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  barTrack: {
    height: 8,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: BorderRadius.full,
  },

  // Recommendation card
  recommendationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing["2xl"],
  },
  recommendationText: {
    flex: 1,
    fontWeight: "500",
    lineHeight: 22,
  },

  // Section headers
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  sectionLine: {
    flex: 1,
    height: 1,
  },
  sectionLabel: {
    fontWeight: "700",
    letterSpacing: 0.8,
  },

  // Cards
  cardWrapper: {
    position: "relative",
    marginBottom: Spacing.md,
  },
  pulseRing: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: BorderRadius.lg + 4,
    borderWidth: 2,
    zIndex: -1,
  },
  commitmentCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  deferredCard: {
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  rankBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  badgeRow: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  miniChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 3,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  cardFooter: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  startButton: {
    flex: 1,
  },
  deferButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    height: 44,
  },

  // Empty state within plan
  emptyPlan: {
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
  },
  recalibrateButton: {
    marginTop: Spacing.xl,
    alignSelf: "center",
    minWidth: 180,
  },

  footerNote: {
    textAlign: "center",
    fontStyle: "italic",
    marginTop: Spacing["2xl"],
  },
});
