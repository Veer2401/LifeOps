/**
 * PilotStackNavigator — Stack navigator wrapping the Pilot screen
 *
 * Provides a header with the "Pilot" title and an info (ⓘ) button.
 * Manages the info modal visibility at this level so the header button
 * can toggle it directly.
 */

import React, { useState, useCallback, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";

import PilotScreen from "@/screens/PilotScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import {
  PilotInfoModal,
  usePilotInfoSeen,
} from "@/components/pilot/PilotInfoModal";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTheme } from "@/hooks/useTheme";

export type PilotStackParamList = {
  Pilot: undefined;
};

const Stack = createNativeStackNavigator<PilotStackParamList>();

export default function PilotStackNavigator() {
  const screenOptions = useScreenOptions();
  const { theme } = useTheme();
  const [infoVisible, setInfoVisible] = useState(false);
  const [hasSeenInfo, markSeen] = usePilotInfoSeen();

  // Auto-show on first visit
  useEffect(() => {
    if (hasSeenInfo === false) {
      setInfoVisible(true);
    }
  }, [hasSeenInfo]);

  const handleDismissInfo = useCallback(() => {
    setInfoVisible(false);
    markSeen();
  }, [markSeen]);

  return (
    <>
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen
          name="Pilot"
          component={PilotScreen}
          options={{
            headerTitle: () => <HeaderTitle title="Pilot" />,
            headerRight: () => (
              <HeaderButton onPress={() => setInfoVisible(true)}>
                <Feather name="info" size={20} color={theme.textSecondary} />
              </HeaderButton>
            ),
          }}
        />
      </Stack.Navigator>

      <PilotInfoModal visible={infoVisible} onDismiss={handleDismissInfo} />
    </>
  );
}
