/**
 * PilotScreen — AI Co-pilot Interface
 *
 * The primary screen where users interact with Pilot using natural language.
 * Composed of: empty state / message list, suggested action chips, and input bar.
 *
 * The info modal is managed by PilotStackNavigator (triggered via header button).
 */

import React, { useRef, useCallback, useEffect } from "react";
import {
  View,
  FlatList,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ChatBubble } from "@/components/pilot/ChatBubble";
import {
  SuggestedActionChip,
  SUGGESTED_ACTIONS,
} from "@/components/pilot/SuggestedActionChip";
import { MessageInput } from "@/components/pilot/MessageInput";
import { usePilotChat, type PilotMessage } from "@/hooks/usePilotChat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

export default function PilotScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const flatListRef = useRef<FlatList<PilotMessage>>(null);
  const { messages, isLoading, sendMessage } = usePilotChat();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  const handleSend = useCallback(
    (text: string) => {
      sendMessage(text);
    },
    [sendMessage],
  );

  const handleChipPress = useCallback(
    (message: string) => {
      sendMessage(message);
    },
    [sendMessage],
  );

  const renderMessage = useCallback(
    ({ item }: { item: PilotMessage }) => <ChatBubble message={item} />,
    [],
  );

  const keyExtractor = useCallback((item: PilotMessage) => item.id, []);

  const hasMessages = messages.length > 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      {/* Message list or empty state */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        style={styles.messageList}
        contentContainerStyle={[
          styles.messageListContent,
          !hasMessages && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        ListHeaderComponent={
          hasMessages ? null : (
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.emptyIcon,
                  { backgroundColor: theme.primary + "12" },
                ]}
              >
                <Feather name="navigation" size={32} color={theme.primary} />
              </View>
              <ThemedText type="h3" style={styles.emptyTitle}>
                Your AI co-pilot
              </ThemedText>
              <ThemedText
                type="body"
                style={[styles.emptySubtitle, { color: theme.textSecondary }]}
              >
                Ask Pilot to manage commitments, check your mental capacity,
                start focus sessions, or plan your day.
              </ThemedText>
            </View>
          )
        }
      />

      {/* Suggested action chips */}
      <View style={[styles.chipsContainer, { borderTopColor: theme.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContent}
          keyboardShouldPersistTaps="handled"
        >
          {SUGGESTED_ACTIONS.map((action) => (
            <SuggestedActionChip
              key={action.label}
              label={action.label}
              onPress={() => handleChipPress(action.message)}
              disabled={isLoading}
            />
          ))}
        </ScrollView>
      </View>

      {/* Input bar */}
      <View style={{ paddingBottom: tabBarHeight }}>
        <MessageInput onSend={handleSend} isLoading={isLoading} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: Spacing["3xl"],
    paddingBottom: Spacing["4xl"],
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    textAlign: "center",
    lineHeight: 22,
  },
  chipsContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.sm,
  },
  chipsContent: {
    paddingHorizontal: Spacing.lg,
  },
});
