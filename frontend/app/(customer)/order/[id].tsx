import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { customerAPI } from '@/services/api/customer.api';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';

// Visual stepper collapses the 8-state backend lifecycle into 4 phases the
// customer cares about. Cancelled is rendered as a terminal alt state.
type Phase = 'placed' | 'preparing' | 'on_the_way' | 'delivered';

const PHASES: { key: Phase; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'placed', label: 'Order Placed', icon: 'receipt-outline' },
  { key: 'preparing', label: 'Preparing', icon: 'restaurant-outline' },
  { key: 'on_the_way', label: 'On the Way', icon: 'bicycle-outline' },
  { key: 'delivered', label: 'Delivered', icon: 'checkmark-done-outline' },
];

function phaseFor(status: string): Phase | 'cancelled' {
  switch (status) {
    case 'Pending':
    case 'Confirmed':
      return 'placed';
    case 'Preparing':
    case 'Ready':
      return 'preparing';
    case 'PickedUp':
    case 'OutForDelivery':
      return 'on_the_way';
    case 'Delivered':
      return 'delivered';
    case 'Cancelled':
      return 'cancelled';
    default:
      return 'placed';
  }
}

interface TrackPayload {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  timeline: Array<{ status: string; timestamp: string; note?: string }>;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
}

export default function OrderStatusScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const [data, setData] = useState<TrackPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pulse = useRef(new Animated.Value(1)).current;
  const lastStatus = useRef<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const load = async () => {
      try {
        const payload = (await customerAPI.trackOrder(id)) as TrackPayload;
        if (cancelled) return;
        setData(payload);
        setError(null);

        if (lastStatus.current && lastStatus.current !== payload.status) {
          Animated.sequence([
            Animated.timing(pulse, { toValue: 1.15, duration: 180, useNativeDriver: true }),
            Animated.timing(pulse, { toValue: 1, duration: 220, useNativeDriver: true }),
          ]).start();
        }
        lastStatus.current = payload.status;
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Could not load order status');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const handle = setInterval(load, 5000);

    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, [id]);

  const current = data ? phaseFor(data.status) : 'placed';
  const currentIndex = current === 'cancelled' ? -1 : PHASES.findIndex((p) => p.key === current);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={c.navBar} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Status</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading && !data ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={c.primary} />
            <Text style={styles.loadingText}>Loading your order...</Text>
          </View>
        ) : error && !data ? (
          <View style={styles.loadingWrap}>
            <Ionicons name="alert-circle-outline" size={32} color={c.muted} />
            <Text style={styles.loadingText}>{error}</Text>
          </View>
        ) : data ? (
          <>
            <View style={styles.card}>
              <Text style={styles.orderNumber}>#{data.orderNumber}</Text>
              <Animated.View style={[styles.statusBadge, { transform: [{ scale: pulse }] }]}>
                <Text style={styles.statusBadgeText}>{data.status.toUpperCase()}</Text>
              </Animated.View>
              {data.estimatedDeliveryTime && current !== 'cancelled' && current !== 'delivered' ? (
                <Text style={styles.eta}>
                  Est. arrival {new Date(data.estimatedDeliveryTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              ) : null}
            </View>

            {current === 'cancelled' ? (
              <View style={styles.cancelledCard}>
                <Ionicons name="close-circle-outline" size={40} color={c.primary} />
                <Text style={styles.cancelledTitle}>Order Cancelled</Text>
                <Text style={styles.cancelledSub}>
                  This order was cancelled. If this was unexpected, please contact support.
                </Text>
              </View>
            ) : (
              <View style={styles.stepperCard}>
                {PHASES.map((phase, idx) => {
                  const reached = idx <= currentIndex;
                  const isActive = idx === currentIndex;
                  return (
                    <View key={phase.key} style={styles.stepRow}>
                      <View style={styles.stepIconColumn}>
                        <View
                          style={[
                            styles.stepDot,
                            reached ? styles.stepDotReached : styles.stepDotPending,
                            isActive && styles.stepDotActive,
                          ]}
                        >
                          <Ionicons
                            name={phase.icon}
                            size={16}
                            color={reached ? '#fff' : c.muted}
                          />
                        </View>
                        {idx < PHASES.length - 1 ? (
                          <View
                            style={[
                              styles.stepLine,
                              idx < currentIndex
                                ? { backgroundColor: c.primary }
                                : { backgroundColor: c.border },
                            ]}
                          />
                        ) : null}
                      </View>
                      <View style={styles.stepTextColumn}>
                        <Text
                          style={[
                            styles.stepLabel,
                            reached && styles.stepLabelReached,
                            isActive && styles.stepLabelActive,
                          ]}
                        >
                          {phase.label}
                        </Text>
                        {isActive ? <Text style={styles.stepHint}>In progress…</Text> : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.replace('/(customer)/(tabs)/home')}
            >
              <Text style={styles.primaryBtnText}>Continue Shopping</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => router.push('/(customer)/orders')}
            >
              <Text style={styles.secondaryBtnText}>View All Orders</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.navBar },
    header: {
      backgroundColor: c.navBar,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    headerTitle: {
      fontFamily: Fonts.brandBold,
      fontSize: 16,
      color: '#fff',
      letterSpacing: 1,
    },
    content: {
      backgroundColor: c.customerBodyBg,
      flexGrow: 1,
      padding: 20,
      paddingBottom: 40,
    },
    loadingWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
      gap: 10,
    },
    loadingText: {
      fontFamily: Fonts.brand,
      fontSize: 13,
      color: c.muted,
    },
    card: {
      backgroundColor: c.customerSurface,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
      marginBottom: 20,
    },
    orderNumber: {
      fontFamily: Fonts.brandBold,
      fontSize: 18,
      color: c.text,
      marginBottom: 10,
    },
    statusBadge: {
      backgroundColor: c.primary,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
    },
    statusBadgeText: {
      fontFamily: Fonts.brandBold,
      fontSize: 12,
      color: '#fff',
      letterSpacing: 1.2,
    },
    eta: {
      fontFamily: Fonts.brand,
      fontSize: 13,
      color: c.muted,
      marginTop: 10,
    },
    stepperCard: {
      backgroundColor: c.customerSurface,
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
      marginBottom: 20,
    },
    stepRow: { flexDirection: 'row' },
    stepIconColumn: { width: 40, alignItems: 'center' },
    stepDot: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
    },
    stepDotPending: {
      backgroundColor: c.customerSurface,
      borderColor: c.border,
    },
    stepDotReached: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    stepDotActive: {
      shadowColor: c.primary,
      shadowOpacity: 0.4,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 0 },
      elevation: 4,
    },
    stepLine: {
      width: 2,
      flex: 1,
      minHeight: 24,
      marginVertical: 2,
    },
    stepTextColumn: {
      flex: 1,
      paddingLeft: 12,
      paddingBottom: 24,
    },
    stepLabel: {
      fontFamily: Fonts.brand,
      fontSize: 14,
      color: c.muted,
    },
    stepLabelReached: {
      color: c.text,
    },
    stepLabelActive: {
      fontFamily: Fonts.brandBold,
    },
    stepHint: {
      fontFamily: Fonts.brand,
      fontSize: 11,
      color: c.primary,
      marginTop: 2,
    },
    cancelledCard: {
      backgroundColor: c.customerSurface,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      gap: 8,
      marginBottom: 20,
    },
    cancelledTitle: {
      fontFamily: Fonts.brandBold,
      fontSize: 18,
      color: c.text,
    },
    cancelledSub: {
      fontFamily: Fonts.brand,
      fontSize: 13,
      color: c.muted,
      textAlign: 'center',
    },
    primaryBtn: {
      backgroundColor: c.secondary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 10,
    },
    primaryBtnText: {
      fontFamily: Fonts.brandBold,
      fontSize: 15,
      color: '#fff',
    },
    secondaryBtn: {
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    secondaryBtnText: {
      fontFamily: Fonts.brandBold,
      fontSize: 14,
      color: c.text,
    },
  });
}
