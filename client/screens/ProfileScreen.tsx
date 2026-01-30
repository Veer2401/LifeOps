import React, { useState, useEffect } from "react";
import { View, StyleSheet, Image, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { ListItem } from "@/components/ListItem";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { TaskStorage, SessionStorage } from "@/lib/storage";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const [stats, setStats] = useState({
    completedToday: 0,
    totalCompleted: 0,
    totalFocusTime: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadStats();
    });
    return unsubscribe;
  }, [navigation]);

  const loadStats = async () => {
    const [completedToday, allTasks, focusTime] = await Promise.all([
      TaskStorage.getCompletedToday(),
      TaskStorage.getAll(),
      SessionStorage.getTodaysTotalTime(),
    ]);

    setStats({
      completedToday: completedToday.length,
      totalCompleted: allTasks.filter((t) => t.completed).length,
      totalFocusTime: focusTime,
    });
  };

  const formatFocusTime = (seconds: number) => {
    if (seconds < 60) return "0 min";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins} min`;
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={styles.profileHeader}>
        <Image
          source={require("../../assets/images/avatar-default.png")}
          style={styles.avatar}
        />
        <ThemedText type="h3" style={styles.greeting}>
          Welcome back
        </ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          Stay focused, stay productive
        </ThemedText>
      </View>

      <View style={styles.statsContainer}>
        <View
          style={[
            styles.statCard,
            { backgroundColor: theme.backgroundDefault, ...Shadows.small },
          ]}
        >
          <ThemedText type="h2" style={{ color: theme.primary }}>
            {stats.completedToday}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Completed today
          </ThemedText>
        </View>
        <View
          style={[
            styles.statCard,
            { backgroundColor: theme.backgroundDefault, ...Shadows.small },
          ]}
        >
          <ThemedText type="h2" style={{ color: theme.primary }}>
            {formatFocusTime(stats.totalFocusTime)}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Focus time today
          </ThemedText>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText
          type="small"
          style={[styles.sectionTitle, { color: theme.textSecondary }]}
        >
          Insights
        </ThemedText>
        <View style={styles.menuList}>
          <ListItem
            icon="bar-chart-2"
            title="Daily Replay"
            subtitle="Review your progress"
            onPress={() => navigation.navigate("DailyReplay")}
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText
          type="small"
          style={[styles.sectionTitle, { color: theme.textSecondary }]}
        >
          Stats
        </ThemedText>
        <View
          style={[
            styles.statsDetail,
            { backgroundColor: theme.backgroundDefault, ...Shadows.small },
          ]}
        >
          <View style={styles.statsRow}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              Total tasks completed
            </ThemedText>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              {stats.totalCompleted}
            </ThemedText>
          </View>
        </View>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: Spacing.lg,
  },
  greeting: {
    marginBottom: Spacing.xs,
  },
  statsContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing["3xl"],
  },
  statCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  menuList: {
    gap: Spacing.sm,
  },
  statsDetail: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
