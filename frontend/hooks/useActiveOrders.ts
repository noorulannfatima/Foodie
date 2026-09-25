import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { customerAPI, type ActiveOrder } from '@/services/api/customer.api';
import { isFinishedStatus } from '@/components/pages/customer/shared/orderPhases';

const POLL_MS = 15000;

/**
 * Orders for the home status card. Refetches on focus and polls while an order is
 * still in progress, but only while the screen is focused and the app is foregrounded.
 */
export function useActiveOrders() {
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [focused, setFocused] = useState(false);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const { orders: next } = await customerAPI.getActiveOrders();
      if (mounted.current) setOrders(next ?? []);
    } catch {
      // Keep the last known orders; the card must never block the home screen
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      refresh();
      return () => setFocused(false);
    }, [refresh]),
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      const active = state === 'active';
      setForeground(active);
      if (active) refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const hasInProgress = orders.some((o) => !isFinishedStatus(o.status));

  useEffect(() => {
    if (!focused || !foreground || !hasInProgress) return;
    const handle = setInterval(refresh, POLL_MS);
    return () => clearInterval(handle);
  }, [focused, foreground, hasInProgress, refresh]);

  return { orders, refresh };
}
