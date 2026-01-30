import React, { useState, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";

import MainTabNavigator from "@/navigation/MainTabNavigator";
import WelcomeScreen from "@/screens/WelcomeScreen";
import AuthScreen from "@/screens/AuthScreen";
import OnboardingScreen from "@/screens/OnboardingScreen";
import AddCommitmentScreen from "@/screens/AddCommitmentScreen";
import CommitmentDetailScreen from "@/screens/CommitmentDetailScreen";
import FocusSessionScreen from "@/screens/FocusSessionScreen";
import InsightScreen from "@/screens/InsightScreen";
import RecalibrateScreen from "@/screens/RecalibrateScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTheme } from "@/hooks/useTheme";
import { UserStorage, UserStateStorage, MentalStateStorage } from "@/lib/storage";

export type RootStackParamList = {
  Welcome: undefined;
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
  AddCommitment: undefined;
  CommitmentDetail: { commitmentId: string };
  FocusSession: { commitmentId: string };
  Insight: undefined;
  Recalibrate: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

type AppState = "loading" | "welcome" | "auth" | "onboarding" | "main";

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { theme } = useTheme();
  const [appState, setAppState] = useState<AppState>("loading");

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    const [user, userState, mentalState] = await Promise.all([
      UserStorage.getUser(),
      UserStateStorage.get(),
      MentalStateStorage.get(),
    ]);

    if (!user) {
      setAppState("welcome");
    } else if (!userState.onboardingComplete || !mentalState) {
      setAppState("onboarding");
    } else {
      setAppState("main");
    }
  };

  const handleGetStarted = () => {
    setAppState("auth");
  };

  const handleAuthBack = () => {
    setAppState("welcome");
  };

  const handleAuthComplete = () => {
    setAppState("onboarding");
  };

  const handleOnboardingComplete = () => {
    setAppState("main");
  };

  if (appState === "loading") {
    return null;
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {appState === "welcome" && (
        <Stack.Screen name="Welcome" options={{ headerShown: false }}>
          {() => <WelcomeScreen onGetStarted={handleGetStarted} />}
        </Stack.Screen>
      )}

      {appState === "auth" && (
        <Stack.Screen name="Auth" options={{ headerShown: false }}>
          {() => (
            <AuthScreen
              onAuthComplete={handleAuthComplete}
              onBack={handleAuthBack}
            />
          )}
        </Stack.Screen>
      )}

      {appState === "onboarding" && (
        <Stack.Screen name="Onboarding" options={{ headerShown: false }}>
          {() => <OnboardingScreen onComplete={handleOnboardingComplete} />}
        </Stack.Screen>
      )}

      {appState === "main" && (
        <>
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
        </>
      )}
    </Stack.Navigator>
  );
}
