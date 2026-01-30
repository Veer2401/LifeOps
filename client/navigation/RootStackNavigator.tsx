import React, { useState, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";

import MainTabNavigator from "@/navigation/MainTabNavigator";
import OnboardingScreen from "@/screens/OnboardingScreen";
import AddCommitmentScreen from "@/screens/AddCommitmentScreen";
import CommitmentDetailScreen from "@/screens/CommitmentDetailScreen";
import FocusSessionScreen from "@/screens/FocusSessionScreen";
import InsightScreen from "@/screens/InsightScreen";
import RecalibrateScreen from "@/screens/RecalibrateScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTheme } from "@/hooks/useTheme";
import { UserStateStorage, MentalStateStorage } from "@/lib/storage";

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  AddCommitment: undefined;
  CommitmentDetail: { commitmentId: string };
  FocusSession: { commitmentId: string };
  Insight: undefined;
  Recalibrate: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { theme } = useTheme();
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    const [userState, mentalState] = await Promise.all([
      UserStateStorage.get(),
      MentalStateStorage.get(),
    ]);
    
    if (userState.onboardingComplete && mentalState) {
      setInitialRoute("Main");
    } else {
      setInitialRoute("Onboarding");
    }
  };

  const handleOnboardingComplete = () => {
    setInitialRoute("Main");
  };

  if (!initialRoute) {
    return null;
  }

  return (
    <Stack.Navigator screenOptions={screenOptions} initialRouteName={initialRoute}>
      <Stack.Screen
        name="Onboarding"
        options={{ headerShown: false }}
      >
        {() => <OnboardingScreen onComplete={handleOnboardingComplete} />}
      </Stack.Screen>
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddCommitment"
        component={AddCommitmentScreen}
        options={({ navigation }) => ({
          presentation: "modal",
          headerTitle: "New Commitment",
          headerLeft: () => (
            <HeaderButton onPress={() => navigation.goBack()}>
              <Feather name="x" size={24} color={theme.text} />
            </HeaderButton>
          ),
        })}
      />
      <Stack.Screen
        name="CommitmentDetail"
        component={CommitmentDetailScreen}
        options={{
          headerTitle: "Details",
        }}
      />
      <Stack.Screen
        name="FocusSession"
        component={FocusSessionScreen}
        options={({ navigation }) => ({
          presentation: "modal",
          headerTitle: "Focus",
          headerLeft: () => (
            <HeaderButton onPress={() => navigation.goBack()}>
              <Feather name="x" size={24} color={theme.text} />
            </HeaderButton>
          ),
          gestureEnabled: false,
        })}
      />
      <Stack.Screen
        name="Insight"
        component={InsightScreen}
        options={{
          headerTitle: "Daily Insight",
        }}
      />
      <Stack.Screen
        name="Recalibrate"
        component={RecalibrateScreen}
        options={({ navigation }) => ({
          presentation: "modal",
          headerTitle: "Recalibrate",
          headerLeft: () => (
            <HeaderButton onPress={() => navigation.goBack()}>
              <Feather name="x" size={24} color={theme.text} />
            </HeaderButton>
          ),
        })}
      />
    </Stack.Navigator>
  );
}
