import React, { useState, useEffect, useCallback } from "react";
import { View, FlatList, StyleSheet, RefreshControl, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { TaskCard } from "@/components/TaskCard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { TaskStorage } from "@/lib/storage";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { Task, Category } from "@shared/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CATEGORIES: Category[] = ["Study", "Work", "Personal"];

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | "All">("All");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    try {
      const loadedTasks = await TaskStorage.getAll();
      setTasks(loadedTasks.filter((t) => !t.completed));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadTasks();
    });
    return unsubscribe;
  }, [navigation, loadTasks]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const filteredTasks =
    selectedCategory === "All"
      ? tasks
      : tasks.filter((t) => t.category === selectedCategory);

  const renderItem = ({ item }: { item: Task }) => (
    <View style={styles.taskItem}>
      <TaskCard
        task={item}
        onPress={() => navigation.navigate("TaskDetail", { taskId: item.id })}
      />
    </View>
  );

  const renderEmpty = () => (
    <EmptyState
      image={require("../../assets/images/empty-tasks.png")}
      title="No tasks yet"
      message="Ready to organize your life. Create your first task and let us help you focus."
      action={
        <Button onPress={() => navigation.navigate("AddTask")}>
          Create Task
        </Button>
      }
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View
        style={[
          styles.filterContainer,
          {
            paddingTop: headerHeight + Spacing.md,
            backgroundColor: theme.backgroundRoot,
          },
        ]}
      >
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={["All", ...CATEGORIES] as const}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const isSelected = item === selectedCategory;
            return (
              <Pressable
                onPress={() => setSelectedCategory(item)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected
                      ? theme.primary
                      : theme.backgroundDefault,
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
                  {item}
                </ThemedText>
              </Pressable>
            );
          }}
        />
      </View>

      <FlatList
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom: tabBarHeight + Spacing.xl,
          },
          filteredTasks.length === 0 && styles.emptyList,
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={loading ? null : renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    paddingBottom: Spacing.md,
  },
  filterList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  emptyList: {
    flexGrow: 1,
  },
  taskItem: {
    marginBottom: Spacing.md,
  },
});
