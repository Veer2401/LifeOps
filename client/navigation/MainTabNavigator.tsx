import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import { GlassView } from "expo-glass-effect";

import HomeStackNavigator from "@/navigation/HomeStackNavigator";
import CommitmentsStackNavigator from "@/navigation/CommitmentsStackNavigator";
import PilotStackNavigator from "@/navigation/PilotStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import { FloatingTimerBar } from "@/components/FloatingTimerBar";
import { useTheme } from "@/hooks/useTheme";

export type MainTabParamList = {
  HomeTab: undefined;
  CommitmentsTab: undefined;
  PilotTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function GlassTabBarBackground() {
  const { theme, isDark } = useTheme();

  const iosVersion =
    Platform.OS === "ios" ? parseInt(String(Platform.Version), 10) : 0;

  if (Platform.OS === "ios" && iosVersion >= 26) {
    return (
      <GlassView glassEffectStyle="regular" style={StyleSheet.absoluteFill} />
    );
  }

  if (Platform.OS === "ios") {
    return (
      <BlurView
        intensity={100}
        tint={isDark ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />
    );
  }

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: theme.backgroundRoot },
      ]}
    />
  );
}

export default function MainTabNavigator() {
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        initialRouteName="HomeTab"
        screenOptions={{
          tabBarActiveTintColor: theme.tabIconSelected,
          tabBarInactiveTintColor: theme.tabIconDefault,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: "transparent",
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarBackground: () => <GlassTabBarBackground />,
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeStackNavigator}
          options={{
            title: "Focus",
            tabBarIcon: ({ color, size }) => (
              <Feather name="target" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="CommitmentsTab"
          component={CommitmentsStackNavigator}
          options={{
            title: "Commitments",
            tabBarIcon: ({ color, size }) => (
              <Feather name="layers" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="PilotTab"
          component={PilotStackNavigator}
          options={{
            title: "Pilot",
            tabBarIcon: ({ color, size }) => (
              <Feather name="navigation" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileStackNavigator}
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Feather name="user" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
      <FloatingTimerBar />
    </View>
  );
}
