import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { restaurantAPI } from '@/services/api/restaurant.api';
import type { Payout, PayoutOrderRow } from '@/services/api/payout.types';
import {
  SettlementBreakdown,
  StatusBadge,
  formatPKR,
  formatPeriod,
  formatShortDate,
  maskAccountNumber,
} from '@/components/pages/payouts';
import { usePayoutsStyles } from './usePayoutsStyles';

interface PayoutDetailProps {
  payoutId: string;
  onClose: () => void;
}

export default function PayoutDetail({ payoutId, onClose }: PayoutDetailProps) {
  const { styles, colors } = usePayoutsStyles();
  const [payout, setPayout] = useState<Payout | null>(null);
  const [orders, setOrders] = useState<PayoutOrderRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    restaurantAPI
      .getPayout(payoutId)
      .then((data) => {
        if (cancelled) return;
        setPayout(data.payout);
        setOrders(data.orders);
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [payoutId]);

  const owes = (payout?.netAmount ?? 0) < 0;
  const account = payout?.accountSnapshot;

  const statusNote = () => {
    if (!payout) return null;
    if (payout.status === 'Paid') {
      return `${owes ? 'Received' : 'Sent'} ${payout.paidAt ? formatShortDate(payout.paidAt) : ''} · Ref ${payout.reference}${
        account ? ` · ${account.method} ${maskAccountNumber(account.iban ?? account.mobileNumber)}` : ''
      }`;
    }
    if (payout.status === 'Failed') return "This transfer didn't go through. Check that your payout account details are correct; Foodie will send it again.";
    return owes
      ? 'Foodie will contact you to collect this amount.'
      : 'Foodie is processing this payout to your account.';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Payout</Text>
        <View style={styles.headerSide} />
      </View>

      {error ? (
        <View style={styles.centered}>
          <Text style={[styles.body, styles.negative]}>{error}</Text>
        </View>
      ) : !payout ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowSub}>
                {formatPeriod(payout.periodStart, payout.periodEnd)} · {payout.orderCount} orders
              </Text>
              <StatusBadge status={payout.status} />
            </View>
            <Text style={[styles.amount, { fontSize: 28, marginTop: 8 }, owes && styles.negative]}>
              {formatPKR(Math.abs(payout.netAmount))}
            </Text>
            <Text style={styles.rowSub}>{owes ? 'You owe Foodie' : 'Foodie pays you'}</Text>
            <Text style={[styles.body, { marginTop: 10 }]}>{statusNote()}</Text>
          </View>

          <View style={[styles.card, { marginTop: 12 }]}>
            <SettlementBreakdown
              settlement={payout}
              commissionRate={payout.commissionRate}
              perspective="restaurant"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Orders in this payout</Text>
            <View style={[styles.card, { paddingVertical: 4 }]}>
              {orders.map((order, index) => (
                <View
                  key={order._id}
                  style={[
                    styles.row,
                    { paddingVertical: 12 },
                    index > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                  ]}
                >
                  <View style={{ flexShrink: 1 }}>
                    <Text style={styles.rowTitle}>#{order.orderNumber}</Text>
                    <Text style={styles.rowSub}>
                      {formatShortDate(order.deliveredAt)} · {order.method === 'Cash' ? 'Cash' : 'Online'}
                    </Text>
                  </View>
                  <Text style={styles.rowTitle}>{formatPKR(order.subtotal)}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
