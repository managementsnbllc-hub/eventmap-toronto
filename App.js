import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { EventStateProvider } from './src/state/EventStateContext';
import { AuthProvider } from './src/state/AuthContext';
import { NotifPrefsProvider } from './src/state/NotifPrefsContext';
import { SavedFiltersProvider } from './src/state/SavedFiltersContext';
import { setupNotificationChannels, setForegroundBehavior } from './src/services/pushService';
import ErrorBoundary from './src/components/ErrorBoundary';
import { ToastProvider } from './src/components/Toast';
import OnboardingScreen, { hasCompletedOnboarding } from './src/screens/OnboardingScreen';
import { COLORS } from './src/constants/theme';

export default function App() {
  const [ready, setReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    (async () => {
      setupNotificationChannels();
      setForegroundBehavior();
      const done = await hasCompletedOnboarding();
      setShowOnboarding(!done);
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (showOnboarding) {
    return (
      <SafeAreaProvider>
        <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
      </SafeAreaProvider>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <AuthProvider>
            <EventStateProvider>
              <NotifPrefsProvider>
                <SavedFiltersProvider>
                  <ToastProvider>
                    <NavigationContainer>
                      <AppNavigator />
                    </NavigationContainer>
                  </ToastProvider>
                </SavedFiltersProvider>
              </NotifPrefsProvider>
            </EventStateProvider>
          </AuthProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
