import React, { useState, useEffect, useCallback } from "react";
import { View, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { TaskCard } from "@/components/TaskCard";
import { TimeSelector } from "@/components/TimeSelector";
import { EnergySelector } from "@/components/EnergySelector";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { TaskStorage, PreferencesStorage } from "@/lib/storage";
import { selectNextBestTask } from "@/lib/nextBestAction";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { Task, AvailableTime, EnergyLevel } from "@shared/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [availableTime, setAvailableTime] = useState<AvailableTime | null>(null);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [loadedTasks, prefs] = await Promise.all([
        TaskStorage.getIncomplete(),
        PreferencesStorage.get(),
      ]);
      setTasks(loadedTasks);
      if (prefs.lastAvailableTime) setAvailableTime(prefs.lastAvailableTime);
      if (prefs.lastEnergyLevel) setEnergyLevel(prefs.lastEnergyLevel);
    } finally {
      setLoading(false);
    }
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

  useEffect(() => {
    if (availableTime && energyLevel && tasks.length > 0) {
      const task = selectNextBestTask(tasks, availableTime, energyLevel);
      setSelectedTask(task);
      
      PreferencesStorage.save({
        lastAvailableTime: availableTime,
        lastEnergyLevel: energyLevel,
        notificationsEnabled: true,
      });
    } else {
      setSelectedTask(null);
    }
  }, [availableTime, energyLevel, tasks]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleStartFocus = () => {
    if (selectedTask) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      navigation.navigate("FocusSession", { taskId: selectedTask.id });
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.backgroundRoot },
        ]}
      />
    );
  }

  if (tasks.length === 0) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
        contentContainerStyle={[
          styles.emptyContent,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <EmptyState
          image={require("../../assets/images/empty-home.png")}
          title="Ready to focus"
          message="Add your first task to get started. We will help you decide what to work on next."
          action={
            <Button onPress={() => navigation.navigate("AddTask")}>
              Add Your First Task
            </Button>
          }
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.section}>
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          How much time do you have?
        </ThemedText>
        <TimeSelector value={availableTime} onChange={setAvailableTime} />
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          Current energy level
        </ThemedText>
        <EnergySelector value={energyLevel} onChange={setEnergyLevel} />
      </View>

      {selectedTask ? (
        <View style={styles.resultSection}>
          <ThemedText type="small" style={[styles.resultLabel, { color: theme.textSecondary }]}>
            Your next best action
          </ThemedText>
          <TaskCard
            task={selectedTask}
            variant="featured"
            onPress={() => navigation.navigate("TaskDetail", { taskId: selectedTask.id })}
          />
          <Button onPress={handleStartFocus} style={styles.startButton}>
            Start Focus Session
          </Button>
        </View>
      ) : availableTime && energyLevel ? (
        <View style={styles.noMatchContainer}>
          <ThemedText
            type="body"
            style={[styles.noMatchText, { color: theme.textSecondary }]}
          >
            No tasks match your current availability. Try adjusting your time or
            add more tasks.
          </ThemedText>
        </View>
      ) : (
        <View style={styles.promptContainer}>
          <ThemedText
            type="body"
            style={[styles.promptText, { color: theme.textSecondary }]}
          >
            Select your available time and energy level to find your next best
            action.
          </ThemedText>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
  },
  emptyContent: {
    flexGrow: 1,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  label: {
    marginBottom: Spacing.md,
    fontWeight: "500",
  },
  resultSection: {
    marginTop: Spacing.lg,
  },
  resultLabel: {
    marginBottom: Spacing.md,
    fontWeight: "500",
  },
  startButton: {
    marginTop: Spacing.xl,
  },
  noMatchContainer: {
    marginTop: Spacing["2xl"],
    padding: Spacing.xl,
    alignItems: "center",
  },
  noMatchText: {
    textAlign: "center",
    lineHeight: 22,
  },
  promptContainer: {
    marginTop: Spacing["3xl"],
    padding: Spacing.xl,
    alignItems: "center",
  },
  promptText: {
    textAlign: "center",
    lineHeight: 22,
  },
});
