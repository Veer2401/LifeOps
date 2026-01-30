import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import MainTabNavigator from "@/navigation/MainTabNavigator";
import AddTaskScreen from "@/screens/AddTaskScreen";
import TaskDetailScreen from "@/screens/TaskDetailScreen";
import FocusSessionScreen from "@/screens/FocusSessionScreen";
import DailyReplayScreen from "@/screens/DailyReplayScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTheme } from "@/hooks/useTheme";

export type RootStackParamList = {
  Main: undefined;
  AddTask: undefined;
  TaskDetail: { taskId: string };
  FocusSession: { taskId: string };
  DailyReplay: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { theme } = useTheme();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddTask"
        component={AddTaskScreen}
        options={({ navigation }) => ({
          presentation: "modal",
          headerTitle: "New Task",
          headerLeft: () => (
            <HeaderButton onPress={() => navigation.goBack()}>
              <Feather name="x" size={24} color={theme.text} />
            </HeaderButton>
          ),
        })}
      />
      <Stack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{
          headerTitle: "Task Details",
        }}
      />
      <Stack.Screen
        name="FocusSession"
        component={FocusSessionScreen}
        options={({ navigation }) => ({
          presentation: "modal",
          headerTitle: "Focus Session",
          headerLeft: () => (
            <HeaderButton onPress={() => navigation.goBack()}>
              <Feather name="x" size={24} color={theme.text} />
            </HeaderButton>
          ),
          gestureEnabled: false,
        })}
      />
      <Stack.Screen
        name="DailyReplay"
        component={DailyReplayScreen}
        options={{
          headerTitle: "Daily Replay",
        }}
      />
    </Stack.Navigator>
  );
}
