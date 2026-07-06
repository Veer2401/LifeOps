import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { Commitment } from "@shared/types";

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Schedule a daily repeating notification for a commitment at its reminderTime.
 * Returns the notification identifier (stored on the commitment) or null if failed.
 */
export async function scheduleCommitmentReminder(
  commitment: Commitment
): Promise<string | null> {
  if (!commitment.reminderEnabled || !commitment.reminderTime) return null;

  const [hourStr, minuteStr] = commitment.reminderTime.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  if (isNaN(hour) || isNaN(minute)) return null;

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return null;

  // Cancel any existing notification for this commitment first
  await cancelCommitmentReminder(commitment.id);

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: commitment.title,
        body: `Time for your ${commitment.estimatedMinutes}-minute commitment. Tap to start your focus session.`,
        data: { commitmentId: commitment.id },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
    return id;
  } catch (e) {
    console.warn("Could not schedule notification:", e);
    return null;
  }
}

/**
 * Cancel all scheduled notifications whose data contains this commitment id.
 * We use the commitment id as the notification identifier prefix.
 */
export async function cancelCommitmentReminder(commitmentId: string): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const toCancel = scheduled.filter(
      (n) => n.content.data?.commitmentId === commitmentId
    );
    await Promise.all(toCancel.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
  } catch (e) {
    console.warn("Could not cancel notification:", e);
  }
}

/** Format a "HH:MM" string to a readable "8:30 AM" label */
export function formatReminderTime(time: string): string {
  const [hourStr, minuteStr] = time.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMinute = String(minute).padStart(2, "0");
  return `${displayHour}:${displayMinute} ${ampm}`;
}
