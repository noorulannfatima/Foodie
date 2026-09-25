import { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI } from '@/services/api/admin.api';
import type { AdminRestaurant } from '@/services/api/admin.types';
import { StatusBadge, SettlementBreakdown, formatPercent } from '../payouts';
import PromptSheet from './PromptSheet';
import { useAdminStyles } from './useAdminStyles';

interface RestaurantPayoutSheetProps {
  restaurant: AdminRestaurant | null;
  onClose: () => void;
  /** Called with the updated restaurant after any change. */
  onChanged: (restaurant: AdminRestaurant) => void;
}

const toPercentText = (rate: number) => String(Math.round(rate * 1000) / 10);

export default function RestaurantPayoutSheet({ restaurant, onClose, onChanged }: RestaurantPayoutSheetProps) {
  const { styles, colors } = useAdminStyles();
  const [percent, setPercent] = useState('');
  const [savingRate, setSavingRate] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    if (restaurant) setPercent(toPercentText(restaurant.commissionRate));
  }, [restaurant]);

  if (!restaurant) return null;
  const account = restaurant.payoutAccount;

  const saveRate = async () => {
    const value = Number(percent);
    if (!Number.isFinite(value) || value < 0 || value > 50) {
      Alert.alert('Invalid rate', 'Enter a percentage between 0 and 50.');
      return;
    }
    setSavingRate(true);
    try {
      const commissionRate = await adminAPI.setCommission(restaurant._id, value / 100);
      onChanged({ ...restaurant, commissionRate });
      Alert.alert('Saved', `Commission is now ${formatPercent(commissionRate)}. It applies to the next payout run.`);
    } catch (e: any) {
      Alert.alert('Could not save', e.message);
    } finally {
      setSavingRate(false);
    }
  };

  const verify = async () => {
    setVerifying(true);
    try {
      const payoutAccount = await adminAPI.reviewPayoutAccount(restaurant._id, 'Verified');
      onChanged({ ...restaurant, payoutAccount });
    } catch (e: any) {
      Alert.alert('Could not verify', e.message);
    } finally {
      setVerifying(false);
    }
  };

  const reject = async (reason: string) => {
    try {
      const payoutAccount = await adminAPI.reviewPayoutAccount(restaurant._id, 'Rejected', reason);
      onChanged({ ...restaurant, payoutAccount });
      setRejecting(false);
    } catch (e: any) {
      Alert.alert('Could not reject', e.message);
    }
  };

  const details: [string, string | undefined][] = account
    ? [
        ['Method', account.method],
        ['Account title', account.accountTitle],
        ['Bank', account.bankName],
        ['IBAN', account.iban],
        ['Mobile number', account.mobileNumber],
      ]
    : [];

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={12} accessibilityLabel="Close">
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionTitle}>Payout account</Text>
          <View style={[styles.card, { gap: 10 }]}>
            {account ? (
              <>
                <StatusBadge status={account.status} />
                {details
                  .filter(([, value]) => value)
                  .map(([label, value]) => (
                    <View key={label}>
                      <Text style={styles.rowSub}>{label}</Text>
                      <Text style={styles.rowTitle} selectable>
                        {value}
                      </Text>
                    </View>
                  ))}
                {account.status === 'Rejected' && account.rejectionReason ? (
                  <Text style={styles.error}>Rejected: {account.rejectionReason}</Text>
                ) : null}
                {account.status !== 'Verified' ? (
                  <TouchableOpacity style={styles.primaryBtn} onPress={verify} disabled={verifying}>
                    {verifying ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="shield-checkmark-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.primaryBtnText}>Verify account</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : null}
                {account.status !== 'Rejected' ? (
                  <TouchableOpacity
                    style={[styles.outlineBtn, styles.dangerBtn]}
                    onPress={() => setRejecting(true)}
                  >
                    <Text style={[styles.outlineBtnText, styles.dangerBtnText]}>Reject account</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            ) : (
              <Text style={styles.rowSub}>
                This restaurant hasn't added a payout account yet. Payouts can't be marked paid until
                one is added and verified.
              </Text>
            )}
          </View>

          <Text style={styles.sectionTitle}>Commission</Text>
          <View style={[styles.card, { gap: 10 }]}>
            <View style={[styles.row, { justifyContent: 'flex-start', gap: 8 }]}>
              <TextInput
                style={[
                  styles.rowTitle,
                  {
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    minWidth: 80,
                  },
                ]}
                value={percent}
                onChangeText={setPercent}
                keyboardType="decimal-pad"
                accessibilityLabel="Commission percentage"
              />
              <Text style={styles.rowTitle}>% of each order subtotal</Text>
            </View>
            <TouchableOpacity style={styles.outlineBtn} onPress={saveRate} disabled={savingRate}>
              {savingRate ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={styles.outlineBtnText}>Save commission</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>
            Unsettled · {restaurant.unsettled.orderCount} orders
          </Text>
          <View style={styles.card}>
            <SettlementBreakdown
              settlement={restaurant.unsettled}
              commissionRate={restaurant.commissionRate}
              perspective="admin"
            />
          </View>
        </ScrollView>
      </View>

      <PromptSheet
        visible={rejecting}
        title="Reject payout account"
        message="The restaurant will see this reason and can update their details."
        placeholder="e.g. Account title doesn't match restaurant name"
        confirmLabel="Reject"
        destructive
        onSubmit={reject}
        onClose={() => setRejecting(false)}
      />
    </Modal>
  );
}
