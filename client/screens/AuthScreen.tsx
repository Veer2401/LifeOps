import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Platform,
  Pressable,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as AppleAuthentication from "expo-apple-authentication";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { UserStorage } from "@/lib/storage";
import { auth } from "@/lib/firebase";

WebBrowser.maybeCompleteAuthSession();

interface AuthScreenProps {
  onAuthComplete: (user: { name: string; email?: string }) => void;
  onBack: () => void;
}

export default function AuthScreen({
  onAuthComplete,
  onBack,
}: AuthScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId:
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
      "PROVIDE_WEB_CLIENT_ID_IN_ENV",
  });

  React.useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);

      setLoading(true);
      signInWithCredential(auth, credential)
        .then(async (userCred) => {
          const name =
            userCred.user.displayName ||
            userCred.user.email?.split("@")[0] ||
            "User";
          await UserStorage.saveUser({
            name,
            email: userCred.user.email || undefined,
            provider: "google",
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onAuthComplete({ name, email: userCred.user.email || undefined });
        })
        .catch((e: any) => {
          setError(e.message || "Google Sign-in failed");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setLoading(false);
        });
    }
  }, [response]);

  const handleEmailAuth = async () => {
    const safeEmail = email.trim();
    if (!safeEmail || !password) {
      setError("Please enter both email and password");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setError("");
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      if (isLoginMode) {
        const userCred = await signInWithEmailAndPassword(
          auth,
          safeEmail,
          password,
        );
        await UserStorage.saveUser({
          name: userCred.user.email?.split("@")[0] || "User",
          email: userCred.user.email || undefined,
          provider: "google", // mapping email to generic provider for now
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onAuthComplete({
          name: userCred.user.email?.split("@")[0] || "User",
          email: userCred.user.email || undefined,
        });
      } else {
        const userCred = await createUserWithEmailAndPassword(
          auth,
          safeEmail,
          password,
        );
        await UserStorage.saveUser({
          name: userCred.user.email?.split("@")[0] || "User",
          email: userCred.user.email || undefined,
          provider: "google",
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onAuthComplete({
          name: userCred.user.email?.split("@")[0] || "User",
          email: userCred.user.email || undefined,
        });
      }
    } catch (e: any) {
      setError(e.message || "Authentication failed");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
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
    setLoading(true);

    await UserStorage.saveUser({
      name: "Guest",
      provider: "guest",
    });

    onAuthComplete({ name: "Guest" });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
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
          style={({ pressed }) => [
            styles.backButton,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>

        <View style={styles.content}>
          <ThemedText type="h2" style={styles.title}>
            {isLoginMode ? "Welcome Back" : "Create Account"}
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            {isLoginMode
              ? "Sign in to continue"
              : "Sign up to start organizing"}
          </ThemedText>

          <View style={styles.formContainer}>
            <Input
              placeholder="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              editable={!loading}
              style={styles.input}
            />
            <Input
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!loading}
              style={styles.input}
            />

            <Button
              onPress={handleEmailAuth}
              disabled={loading}
              style={styles.mainButton}
            >
              {isLoginMode ? "Sign In" : "Register"}
            </Button>

            <Pressable
              onPress={() => setIsLoginMode(!isLoginMode)}
              style={styles.switchModeButton}
            >
              <ThemedText type="small" style={{ color: theme.primary }}>
                {isLoginMode
                  ? "Don't have an account? Register"
                  : "Already have an account? Sign in"}
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.dividerContainer}>
            <View
              style={[styles.dividerLine, { backgroundColor: theme.border }]}
            />
            <ThemedText
              type="small"
              style={[styles.dividerText, { color: theme.textSecondary }]}
            >
              OR
            </ThemedText>
            <View
              style={[styles.dividerLine, { backgroundColor: theme.border }]}
            />
          </View>

          <View style={styles.authButtons}>
            <Button
              variant="secondary"
              onPress={handleContinueAsGuest}
              disabled={loading}
            >
              Continue as Guest
            </Button>

            <Button
              variant="secondary"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                promptAsync();
              }}
              disabled={!request || loading}
              style={{ borderColor: theme.border }}
            >
              Sign in with Google
            </Button>

            {Platform.OS === "ios" ? (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={
                  AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
                }
                buttonStyle={
                  AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                }
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
      </ThemedView>
    </KeyboardAvoidingView>
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
    marginBottom: Spacing.xl,
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  input: {
    marginBottom: Spacing.sm,
  },
  mainButton: {
    marginTop: Spacing.sm,
  },
  switchModeButton: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: Spacing.md,
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
});
