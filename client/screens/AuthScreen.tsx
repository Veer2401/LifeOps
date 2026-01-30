import React, { useState } from "react";
import { View, StyleSheet, Platform, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { UserStorage } from "@/lib/storage";

WebBrowser.maybeCompleteAuthSession();

interface AuthScreenProps {
  onAuthComplete: (user: { name: string; email?: string }) => void;
  onBack: () => void;
}

export default function AuthScreen({ onAuthComplete, onBack }: AuthScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  React.useEffect(() => {
    if (googleResponse?.type === "success") {
      handleGoogleSuccess(googleResponse.authentication?.accessToken);
    }
  }, [googleResponse]);

  const handleGoogleSuccess = async (accessToken?: string) => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const response = await fetch(
        "https://www.googleapis.com/userinfo/v2/me",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const userInfo = await response.json();
      
      await UserStorage.saveUser({
        name: userInfo.name || "User",
        email: userInfo.email,
        provider: "google",
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onAuthComplete({ name: userInfo.name, email: userInfo.email });
    } catch (e) {
      setError("Could not complete sign in");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await promptGoogleAsync();
    } catch (e) {
      setError("Google sign in unavailable");
    }
  };

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
          Sign in
        </ThemedText>
        <ThemedText
          type="body"
          style={[styles.subtitle, { color: theme.textSecondary }]}
        >
          Continue with your account
        </ThemedText>

        <View style={styles.authButtons}>
          {Platform.OS === "ios" && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={BorderRadius.full}
              style={styles.appleButton}
              onPress={handleAppleSignIn}
            />
          )}

          <Pressable
            onPress={handleGoogleSignIn}
            disabled={loading}
            style={({ pressed }) => [
              styles.googleButton,
              {
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.border,
                opacity: pressed || loading ? 0.8 : 1,
                ...Shadows.small,
              },
            ]}
          >
            <View style={styles.googleIcon}>
              <ThemedText style={{ fontSize: 18 }}>G</ThemedText>
            </View>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              Continue with Google
            </ThemedText>
          </Pressable>
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
        <Pressable
          onPress={handleContinueAsGuest}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        >
          <ThemedText
            type="small"
            style={[styles.guestText, { color: theme.textSecondary }]}
          >
            Continue without signing in
          </ThemedText>
        </Pressable>
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
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    height: 52,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  googleIcon: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  guestText: {
    textAlign: "center",
  },
});
