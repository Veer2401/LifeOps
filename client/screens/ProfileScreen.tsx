import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Image, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { reloadAppAsync } from "expo";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { ListItem } from "@/components/ListItem";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import {
  CommitmentStorage,
  UserStorage,
  AppStorage,
  FulfillmentStorage,
  type UserProfile,
} from "@/lib/storage";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({
    fulfilledToday: 0,
    totalFulfilled: 0,
    activeCommitments: 0,
  });
  const [signingOut, setSigningOut] = useState(false);

  const loadData = useCallback(async () => {
    const [loadedUser, todayFulfillments, allFulfillments, activeCommitments] = await Promise.all([
      UserStorage.getUser(),
      FulfillmentStorage.getTodayFulfillments(),
      FulfillmentStorage.getAll(),
      CommitmentStorage.getActive(),
    ]);

    setUser(loadedUser);
    setStats({
      fulfilledToday: todayFulfillments.length,
      totalFulfilled: allFulfillments.length,
      activeCommitments: activeCommitments.length,
    });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

  const handleSignOut = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSigningOut(true);

    try {
      await AppStorage.signOut();
      await reloadAppAsync();
    } catch (e) {
      setSigningOut(false);
    }
  };

  const getProviderLabel = (provider?: string) => {
    if (provider === "google") return "Signed in with Google";
    if (provider === "apple") return "Signed in with Apple";
    return "Guest account";
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
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/avatar-default.png")}
          style={styles.avatar}
        />
        <ThemedText type="h3" style={styles.name}>
          {user?.name || "Guest"}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {getProviderLabel(user?.provider)}
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
            {stats.fulfilledToday}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Today
          </ThemedText>
        </View>
        <View
          style={[
            styles.statCard,
            { backgroundColor: theme.backgroundDefault, ...Shadows.small },
          ]}
        >
          <ThemedText type="h2" style={{ color: theme.primary }}>
            {stats.activeCommitments}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Active
          </ThemedText>
        </View>
        <View
          style={[
            styles.statCard,
            { backgroundColor: theme.backgroundDefault, ...Shadows.small },
          ]}
        >
          <ThemedText type="h2" style={{ color: theme.primary }}>
            {stats.totalFulfilled}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Total
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
            icon="sun"
            title="Daily Insight"
            subtitle="Understand your mental rhythm"
            onPress={() => navigation.navigate("Insight")}
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText
          type="small"
          style={[styles.sectionTitle, { color: theme.textSecondary }]}
        >
          Calibration
        </ThemedText>
        <View style={styles.menuList}>
          <ListItem
            icon="sliders"
            title="Adjust Mental State"
            subtitle="Update how you are feeling"
            onPress={() => navigation.navigate("Recalibrate")}
          />
        </View>
      </View>

      <Pressable
        onPress={handleSignOut}
        disabled={signingOut}
        style={({ pressed }) => [
          styles.signOutButton,
          {
            backgroundColor: theme.error + "10",
            opacity: pressed || signingOut ? 0.6 : 1,
          },
        ]}
      >
        <Feather name="log-out" size={18} color={theme.error} />
        <ThemedText type="body" style={{ color: theme.error }}>
          {signingOut ? "Signing out..." : "Sign out"}
        </ThemedText>
      </Pressable>

      <View style={styles.disclaimer}>
        <ThemedText
          type="small"
          style={[styles.disclaimerText, { color: theme.textSecondary }]}
        >
          LifeOps supports mental well-being but does not replace professional
          care.
        </ThemedText>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: Spacing.lg,
  },
  name: {
    marginBottom: Spacing.xs,
  },
  statsContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing["3xl"],
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
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
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    height: 52,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xl,
  },
  disclaimer: {
    marginTop: Spacing["3xl"],
  },
  disclaimerText: {
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 20,
  },
});
