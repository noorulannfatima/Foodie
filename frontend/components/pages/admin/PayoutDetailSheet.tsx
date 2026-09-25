import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI } from '@/services/api/admin.api';
import type { AdminPayout, PayoutOrderRow } from '@/services/api/admin.types';
import { StatusBadge, SettlementBreakdown } from '../payouts';
import PromptSheet from './PromptSheet';
import { formatPKR, formatPeriod, formatShortDate, maskAccountNumber } from '../payouts/format';
import { useAdminStyles } from './useAdminStyles';

interface PayoutDetailSheetProps {
  payoutId: string | null;
  onClose: () => void;
  /** Called after the payout's status changes so the list can refresh. */
  onChanged: () => void;
}

type Prompt = 'paid' | 'failed' | null;

export default function PayoutDetailSheet({ payoutId, onClose, onChanged }: PayoutDetailSheetProps) {
  const { styles, colors } = useAdminStyles();
  const [payout, setPayout] = useState<AdminPayout | null>(null);
  const [orders, setOrders] = useState<PayoutOrderRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<Prompt>(null);

  const load = useCallback(async (id: string) => {
    setError(null);
    try {
      const data = await adminAPI.getPayout(id);
      setPayout(data.payout);
      setOrders(data.orders);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    setPayout(null);
    setOrders([]);
    if (payoutId) load(payoutId);
  }, [payoutId, load]);

  const handleSubmit = async (value: string) => {
    if (!payout) return;
    try {
      const updated =
        prompt === 'paid'
          ? await adminAPI.markPaid(payout._id, value)
          : await adminAPI.markFailed(payout._id, value);
      setPayout({ ...payout, ...updated, restaurant: payout.restaurant });
      setPrompt(null);
      onChanged();
    } catch (e: any) {
      Alert.alert('Could not update payout', e.message);
    }
  };

  const owes = (payout?.netAmount ?? 0) < 0;
  const account = payout?.accountSnapshot;

  return (
    <Modal
      visible={!!payoutId}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.screen}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle} numberOfLines={1}>
            {payout?.restaurant.name ?? 'Payout'}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={12} accessibilityLabel="Close">
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.center}>
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : !payout ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            <View style={[styles.card, { gap: 8 }]}>
              <View style={styles.row}>
                <Text style={styles.rowSub}>
                  {formatPeriod(payout.periodStart, payout.periodEnd)} · {payout.orderCount} orders
                </Text>
                <StatusBadge status={payout.status} />
              </View>
              <Text style={[styles.title, owes && styles.negative]}>
                {formatPKR(payout.netAmount)}
              </Text>
              {payout.status === 'Failed' && payout.failureReason ? (
                <Text style={styles.error}>Failed: {payout.failureReason}</Text>
              ) : null}
              {payout.status === 'Paid' ? (
                <Text style={styles.rowSub}>
                  Paid {payout.paidAt ? formatShortDate(payout.paidAt) : ''} · Ref {payout.reference}
                  {account
                    ? ` · ${account.method} ${maskAccountNumber(account.iban ?? account.mobileNumber)}`
                    : ''}
                </Text>
              ) : null}
            </View>

            <View style={styles.card}>
              <SettlementBreakdown settlement={payout} commissionRate={payout.commissionRate} perspective="admin" />
            </View>

            {payout.status !== 'Paid' ? (
              <View style={{ gap: 10 }}>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setPrompt('paid')}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryBtnText}>
                    {owes ? 'Mark payment received' : 'Mark paid'}
                  </Text>
                </TouchableOpacity>
                {payout.status === 'Processing' ? (
                  <TouchableOpacity
                    style={[styles.outlineBtn, styles.dangerBtn]}
                    onPress={() => setPrompt('failed')}
                  >
                    <Text style={[styles.outlineBtnText, styles.dangerBtnText]}>Mark failed</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}

            <Text style={styles.sectionTitle}>Orders</Text>
            <View style={[styles.card, { paddingVertical: 4 }]}>
              {orders.map((order, index) => (
                <View key={order._id}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <View style={[styles.row, { paddingVertical: 8 }]}>
                    <View style={{ flexShrink: 1 }}>
                      <Text style={styles.rowTitle}>#{order.orderNumber}</Text>
                      <Text style={styles.rowSub}>
                        {formatShortDate(order.deliveredAt)} · {order.method}
                      </Text>
                    </View>
                    <Text style={styles.breakdownValue}>{formatPKR(order.subtotal)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      <PromptSheet
        visible={prompt !== null}
        title={prompt === 'paid' ? 'Transaction reference' : 'Why did it fail?'}
        message={
          prompt === 'paid'
            ? 'Enter the bank or wallet reference so the restaurant can match it.'
            : 'The restaurant will not be notified. You can mark it paid later.'
        }
        placeholder={prompt === 'paid' ? 'e.g. FT2609241234' : 'e.g. Account title mismatch'}
        confirmLabel={prompt === 'paid' ? 'Mark paid' : 'Mark failed'}
        destructive={prompt === 'failed'}
        onSubmit={handleSubmit}
        onClose={() => setPrompt(null)}
      />
    </Modal>
  );
}
