import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import HomeScreen from "@/screens/HomeScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTheme } from "@/hooks/useTheme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

export type HomeStackParamList = {
  Home: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

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

export default function HomeStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle: () => <HeaderTitle title="LifeOps" />,
          headerRight: () => <AddButton />,
        }}
      />
    </Stack.Navigator>
  );
}
