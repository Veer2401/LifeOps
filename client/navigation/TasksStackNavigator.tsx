import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import TasksScreen from "@/screens/TasksScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTheme } from "@/hooks/useTheme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

export type TasksStackParamList = {
  Tasks: undefined;
};

const Stack = createNativeStackNavigator<TasksStackParamList>();

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function AddTaskButton() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  
  return (
    <HeaderButton onPress={() => navigation.navigate("AddTask")}>
      <Feather name="plus" size={24} color={theme.primary} />
    </HeaderButton>
  );
}

export default function TasksStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          headerTitle: "Tasks",
          headerRight: () => <AddTaskButton />,
        }}
      />
    </Stack.Navigator>
  );
}
