import React from "react";
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import CommitmentsScreen from "@/screens/CommitmentsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTheme } from "@/hooks/useTheme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

export type CommitmentsStackParamList = {
  Commitments: undefined;
};

const Stack = createNativeStackNavigator<CommitmentsStackParamList>();

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function AddButton() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  return (
    <HeaderButton onPress={() => navigation.navigate("AddCommitment")}>
      <Feather name="plus" size={24} color={theme.primary} />
    </HeaderButton>
  );
}

export default function CommitmentsStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Commitments"
        component={CommitmentsScreen}
        options={{
          headerTitle: "Commitments",
          headerRight: () => <AddButton />,
        }}
      />
    </Stack.Navigator>
  );
}
