import React, { forwardRef } from "react";
import { View, TextInput, TextInputProps, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, style, ...props }, ref) => {
    const { theme } = useTheme();

    return (
      <View style={styles.container}>
        {label ? (
          <ThemedText type="small" style={styles.label}>
            {label}
          </ThemedText>
        ) : null}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundDefault,
              borderColor: error ? theme.error : theme.border,
              color: theme.text,
            },
            style,
          ]}
          placeholderTextColor={theme.textSecondary}
          {...props}
        />
        {error ? (
          <ThemedText
            type="small"
            style={[styles.error, { color: theme.error }]}
          >
            {error}
          </ThemedText>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    marginBottom: Spacing.sm,
    fontWeight: "500",
  },
  input: {
    height: Spacing.inputHeight,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    ...Typography.body,
  },
  error: {
    marginTop: Spacing.xs,
  },
});
