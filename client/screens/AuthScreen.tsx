import React, { useState } from "react";
import { View, StyleSheet, Platform, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as AppleAuthentication from "expo-apple-authentication";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { UserStorage } from "@/lib/storage";

interface AuthScreenProps {
  onAuthComplete: (user: { name: string; email?: string }) => void;
  onBack: () => void;
}

export default function AuthScreen({ onAuthComplete, onBack }: AuthScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAppleSignIn = async () => {
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      setLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const name = credential.fullName
        ? `${credential.fullName.givenName || ""} ${credential.fullName.familyName || ""}`.trim()
        : "User";

      await UserStorage.saveUser({
        name: name || "User",
        email: credential.email || undefined,
        provider: "apple",
        appleUserId: credential.user,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onAuthComplete({ name, email: credential.email || undefined });
    } catch (e: any) {
      if (e.code !== "ERR_REQUEST_CANCELED") {
        setError("Could not complete sign in");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsGuest = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    
    await UserStorage.saveUser({
      name: "Guest",
      provider: "guest",
    });

    onAuthComplete({ name: "Guest" });
  };

  return (
    <ThemedView
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Feather name="arrow-left" size={24} color={theme.text} />
      </Pressable>

      <View style={styles.content}>
        <ThemedText type="h2" style={styles.title}>
          Welcome
        </ThemedText>
        <ThemedText
          type="body"
          style={[styles.subtitle, { color: theme.textSecondary }]}
        >
          Choose how you would like to continue
        </ThemedText>

        <View style={styles.authButtons}>
          <Button onPress={handleContinueAsGuest} disabled={loading}>
            Continue as Guest
          </Button>

          {Platform.OS === "ios" ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={BorderRadius.full}
              style={styles.appleButton}
              onPress={handleAppleSignIn}
            />
          ) : null}
        </View>

        {error ? (
          <ThemedText
            type="small"
            style={[styles.errorText, { color: theme.error }]}
          >
            {error}
          </ThemedText>
        ) : null}
      </View>

      <View style={styles.footer}>
        <ThemedText
          type="small"
          style={[styles.footerText, { color: theme.textSecondary }]}
        >
          Your data stays on your device
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
    alignSelf: "flex-start",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    marginBottom: Spacing["3xl"],
    textAlign: "center",
  },
  authButtons: {
    width: "100%",
    gap: Spacing.md,
  },
  appleButton: {
    height: 52,
    width: "100%",
  },
  errorText: {
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  footerText: {
    textAlign: "center",
  },
});
