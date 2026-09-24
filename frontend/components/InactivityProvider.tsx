import { useEffect, useRef } from 'react';
import { View, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

/**
 * Auto-logout after a period of user inactivity.
 *
 * "Inactivity" = no touches and the app not being interacted with. Any touch
 * resets the timer. We also persist the last-activity timestamp so that idle
 * time spent in the background (or across an app relaunch) still counts.
 */
export const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutes
export const LAST_ACTIVITY_KEY = 'lastActivityAt';

// Throttle AsyncStorage writes — we don't need to persist on every single touch.
const PERSIST_THROTTLE_MS = 5000;

export default function InactivityProvider({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPersist = useRef(0);

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const forceLogout = async () => {
    clearTimer();
    await AsyncStorage.removeItem(LAST_ACTIVITY_KEY);
    await logout();
    router.replace('/(auth)');
  };

  const armTimer = () => {
    clearTimer();
    if (useAuthStore.getState().isAuthenticated) {
      timer.current = setTimeout(forceLogout, INACTIVITY_LIMIT_MS);
    }
  };

  // Call on any user activity: reset the countdown and (throttled) persist the time.
  const recordActivity = () => {
    if (!useAuthStore.getState().isAuthenticated) return;
    const now = Date.now();
    if (now - lastPersist.current > PERSIST_THROTTLE_MS) {
      lastPersist.current = now;
      AsyncStorage.setItem(LAST_ACTIVITY_KEY, String(now)).catch(() => {});
    }
    armTimer();
  };

  // Arm the timer when the user logs in; clear it when they log out.
  useEffect(() => {
    if (isAuthenticated) {
      lastPersist.current = 0;
      recordActivity();
    } else {
      clearTimer();
    }
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // When the app returns to the foreground, log out if it was idle too long.
  useEffect(() => {
    const onChange = async (state: AppStateStatus) => {
      if (!useAuthStore.getState().isAuthenticated) return;

      if (state === 'active') {
        const raw = await AsyncStorage.getItem(LAST_ACTIVITY_KEY);
        const last = raw ? parseInt(raw, 10) : 0;
        if (last && Date.now() - last >= INACTIVITY_LIMIT_MS) {
          await forceLogout();
        } else {
          recordActivity();
        }
      } else {
        // Heading into the background — stamp the time we left and stop the timer.
        await AsyncStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now())).catch(() => {});
        clearTimer();
      }
    };

    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View
      style={{ flex: 1 }}
      onStartShouldSetResponderCapture={() => {
        // Register the touch as activity, but return false so we don't actually
        // capture the gesture — child components still receive it normally.
        recordActivity();
        return false;
      }}
    >
      {children}
    </View>
  );
}
