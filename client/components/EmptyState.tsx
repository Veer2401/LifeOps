import React from "react";
import { View, StyleSheet, Image, ImageSourcePropType } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

interface EmptyStateProps {
  image: ImageSourcePropType;
  title: string;
  message: string;
  action?: React.ReactNode;
}

export function EmptyState({ image, title, message, action }: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Image source={image} style={styles.image} resizeMode="contain" />
      <ThemedText type="h4" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText
        type="body"
        style={[styles.message, { color: theme.textSecondary }]}
      >
        {message}
      </ThemedText>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: Spacing.xl,
    opacity: 0.9,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  message: {
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 22,
  },
  action: {
    marginTop: Spacing.xl,
  },
});
