import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tintBg } from '@/constants/theme';
import { restaurantAPI } from '@/services/api/restaurant.api';
import type { Payout, PayoutAccount, RestaurantPayoutSummary } from '@/services/api/payout.types';
import {
  SettlementBreakdown,
  StatusBadge,
  formatPKR,
  formatPercent,
  formatPeriod,
  formatShortDate,
  maskAccountNumber,
} from '@/components/pages/payouts';
import PayoutAccountForm from './PayoutAccountForm';
import PayoutDetail from './PayoutDetail';
import { usePayoutsStyles } from './usePayoutsStyles';

export interface PayoutsBillingModalProps {
  onClose: () => void;
}

/** One sheet with three views, so the account form and payout detail don't stack modals. */
type View_ = { name: 'home' } | { name: 'account' } | { name: 'payout'; id: string };

export default function PayoutsBillingModal({ onClose }: PayoutsBillingModalProps) {
  const { styles, colors } = usePayoutsStyles();
  const [view, setView] = useState<View_>({ name: 'home' });
  const [summary, setSummary] = useState<RestaurantPayoutSummary | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [nextSummary, history] = await Promise.all([
        restaurantAPI.getPayoutSummary(),
        restaurantAPI.getPayouts(1),
      ]);
      setSummary(nextSummary);
      setPayouts(history.payouts);
      setPage(1);
      setHasMore(history.hasMore);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = await restaurantAPI.getPayouts(page + 1);
      setPayouts((list) => [...list, ...next.payouts]);
      setPage(next.page);
      setHasMore(next.hasMore);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const onAccountSaved = (payoutAccount: PayoutAccount) => {
    setSummary((s) => (s ? { ...s, payoutAccount } : s));
    setView({ name: 'home' });
  };

  if (view.name === 'account') {
    return (
      <PayoutAccountForm
        current={summary?.payoutAccount ?? null}
        onClose={() => setView({ name: 'home' })}
        onSaved={onAccountSaved}
      />
    );
  }
  if (view.name === 'payout') {
    return <PayoutDetail payoutId={view.id} onClose={() => setView({ name: 'home' })} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Payouts & Billing</Text>
        <View style={styles.headerSide} />
      </View>

      {!summary && !error ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {error ? (
            <View style={[styles.banner, { marginBottom: 16 }]}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.bannerText}>{error}</Text>
            </View>
          ) : null}

          {summary ? (
            <>
              <BalanceCard
                summary={summary}
                showBreakdown={showBreakdown}
                onToggleBreakdown={() => setShowBreakdown((v) => !v)}
              />

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payout account</Text>
                <AccountCard
                  account={summary.payoutAccount}
                  onEdit={() => setView({ name: 'account' })}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>How payouts work</Text>
                <View style={[styles.card, { gap: 10 }]}>
                  <InfoLine icon="pricetag-outline" text={`Foodie's commission is ${formatPercent(summary.commissionRate)} of each order's food subtotal.`} />
                  <InfoLine icon="card-outline" text={`Online orders have a ${formatPercent(summary.paymentFeeRate)} payment processing fee.`} />
                  <InfoLine icon="cash-outline" text="For cash orders you keep the cash, so their commission is taken from your online earnings." />
                  <InfoLine icon="bicycle-outline" text="Delivery fees and rider tips aren't part of your payout." />
                </View>
              </View>
            </>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payout history</Text>
            {payouts.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.body}>
                  No payouts yet. Delivered orders are settled into a payout periodically, and each one
                  will appear here.
                </Text>
              </View>
            ) : (
              <View style={[styles.card, { paddingVertical: 4 }]}>
                {payouts.map((p, index) => (
                  <TouchableOpacity
                    key={p._id}
                    activeOpacity={0.7}
                    onPress={() => setView({ name: 'payout', id: p._id })}
                    style={[
                      styles.row,
                      { paddingVertical: 12 },
                      index > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                    ]}
                  >
                    <View style={{ flexShrink: 1, gap: 4 }}>
                      <Text style={styles.rowTitle}>{formatPeriod(p.periodStart, p.periodEnd)}</Text>
                      <Text style={styles.rowSub}>{p.orderCount} orders</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text style={[styles.amount, p.netAmount < 0 && styles.negative]}>
                        {formatPKR(p.netAmount)}
                      </Text>
                      <StatusBadge status={p.status} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {hasMore ? (
              <TouchableOpacity
                style={[styles.linkBtn, { alignSelf: 'center', marginTop: 12 }]}
                onPress={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <Text style={styles.linkBtnText}>Show older payouts</Text>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function BalanceCard({
  summary,
  showBreakdown,
  onToggleBreakdown,
}: {
  summary: RestaurantPayoutSummary;
  showBreakdown: boolean;
  onToggleBreakdown: () => void;
}) {
  const { styles, colors } = usePayoutsStyles();
  const { unsettled, processing, lastPaid } = summary;
  const owes = unsettled.netAmount < 0;

  return (
    <View style={styles.card}>
      <Text style={styles.rowSub}>{owes ? 'You owe Foodie' : 'Upcoming earnings'}</Text>
      <Text style={[styles.amount, { fontSize: 30, marginTop: 4 }, owes && styles.negative]}>
        {formatPKR(Math.abs(unsettled.netAmount))}
      </Text>
      <Text style={styles.rowSub}>
        {unsettled.orderCount === 0
          ? 'No delivered orders waiting to be settled'
          : `From ${unsettled.orderCount} delivered order${unsettled.orderCount === 1 ? '' : 's'} not yet in a payout`}
      </Text>

      {unsettled.orderCount > 0 ? (
        <>
          <TouchableOpacity
            style={[styles.linkBtn, { marginTop: 10 }]}
            onPress={onToggleBreakdown}
            accessibilityState={{ expanded: showBreakdown }}
          >
            <Text style={styles.linkBtnText}>{showBreakdown ? 'Hide breakdown' : 'See breakdown'}</Text>
            <Ionicons name={showBreakdown ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary} />
          </TouchableOpacity>
          {showBreakdown ? (
            <View style={{ marginTop: 8 }}>
              <SettlementBreakdown
                settlement={unsettled}
                commissionRate={summary.commissionRate}
                perspective="restaurant"
              />
            </View>
          ) : null}
        </>
      ) : null}

      {processing.count > 0 || lastPaid ? <View style={styles.divider} /> : null}
      {processing.count > 0 ? (
        <View style={[styles.row, { paddingVertical: 4 }]}>
          <Text style={styles.body}>
            Processing ({processing.count} payout{processing.count === 1 ? '' : 's'})
          </Text>
          <Text style={[styles.rowTitle, processing.amount < 0 && styles.negative]}>
            {formatPKR(processing.amount)}
          </Text>
        </View>
      ) : null}
      {lastPaid ? (
        <View style={[styles.row, { paddingVertical: 4 }]}>
          <Text style={styles.body}>
            Last payout{lastPaid.paidAt ? ` · ${formatShortDate(lastPaid.paidAt)}` : ''}
          </Text>
          <Text style={styles.rowTitle}>{formatPKR(lastPaid.netAmount)}</Text>
        </View>
      ) : null}
    </View>
  );
}

function AccountCard({ account, onEdit }: { account: PayoutAccount | null; onEdit: () => void }) {
  const { styles, colors } = usePayoutsStyles();

  if (!account) {
    return (
      <View style={[styles.card, { gap: 12 }]}>
        <View style={[styles.row, { justifyContent: 'flex-start', alignItems: 'flex-start' }]}>
          <Ionicons name="wallet-outline" size={22} color="#F59E0B" />
          <Text style={[styles.body, { flex: 1 }]}>
            Add a bank account or mobile wallet so Foodie can send your earnings. Payouts can't be sent
            until one is added and verified.
          </Text>
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={onEdit}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>Add payout account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isBank = account.method === 'Bank';
  const note =
    account.status === 'Pending'
      ? 'Foodie is verifying these details. Payouts are sent once they are verified.'
      : account.status === 'Rejected'
        ? `Foodie couldn't verify this account${account.rejectionReason ? `: ${account.rejectionReason}` : '.'} Update the details to try again.`
        : null;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: tintBg('#F59E0B', '#FEF3C7', colors.isDark),
          }}
        >
          <Ionicons name={isBank ? 'business-outline' : 'phone-portrait-outline'} size={18} color="#F59E0B" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {isBank ? account.bankName : account.method}
          </Text>
          <Text style={styles.rowSub} numberOfLines={1}>
            {account.accountTitle} · {maskAccountNumber(isBank ? account.iban : account.mobileNumber)}
          </Text>
        </View>
        <StatusBadge status={account.status} />
      </View>
      {note ? (
        <Text
          style={[
            styles.body,
            { marginTop: 12 },
            account.status === 'Rejected' && styles.negative,
          ]}
        >
          {note}
        </Text>
      ) : null}
      <View style={styles.divider} />
      <TouchableOpacity style={styles.linkBtn} onPress={onEdit}>
        <Ionicons name="create-outline" size={16} color={colors.primary} />
        <Text style={styles.linkBtnText}>Change payout account</Text>
      </TouchableOpacity>
    </View>
  );
}

function InfoLine({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const { styles, colors } = usePayoutsStyles();
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
      <Ionicons name={icon} size={16} color={colors.muted} style={{ marginTop: 2 }} />
      <Text style={[styles.body, { flex: 1 }]}>{text}</Text>
    </View>
  );
}
