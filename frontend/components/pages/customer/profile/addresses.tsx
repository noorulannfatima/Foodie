import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { useCustomerT } from '@/stores/customerPreferencesStore';
import { useAddressStore, formatAddressLine } from '@/stores/addressStore';
import type { SavedAddress } from '@/services/api/customer.api';
import CustomerScreenHeader from '@/components/pages/customer/CustomerScreenHeader';
import { customerHeaderBg } from '@/components/pages/customer/CustomerHeader';
import { AddressFormModal, displayLabel, labelIcon } from '@/components/pages/customer/addresses';

/** Profile › Saved Addresses. `?add=1` opens the new-address form straight away. */
export default function SavedAddresses() {
  const c = useAppThemeColors();
  const t = useCustomerT();
  const styles = useMemo(() => createStyles(c), [c]);
  const { add } = useLocalSearchParams<{ add?: string }>();
  const addresses = useAddressStore((s) => s.addresses);
  const loaded = useAddressStore((s) => s.loaded);
  // undefined = form closed, null = adding, SavedAddress = editing
  const [editing, setEditing] = useState<SavedAddress | null | undefined>(add === '1' ? null : undefined);

  useEffect(() => {
    useAddressStore.getState().load().catch(() => {});
  }, []);

  const run = async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (err: unknown) {
      Alert.alert(t('error'), err instanceof Error ? err.message : '');
    }
  };

  const confirmDelete = (a: SavedAddress) =>
    Alert.alert(t('deleteAddressTitle'), t('deleteAddressConfirm', { label: displayLabel(a.label, t) }), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('deleteAction'),
        style: 'destructive',
        onPress: () => run(() => useAddressStore.getState().remove(a._id)),
      },
    ]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: customerHeaderBg(c) }]} edges={['top']}>
      <CustomerScreenHeader title={t('savedAddresses')} />

      <ScrollView style={styles.body} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loaded && addresses.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="location-outline" size={48} color={c.muted} />
            <Text style={styles.emptyTitle}>{t('noSavedAddresses')}</Text>
            <Text style={styles.emptyHint}>{t('noSavedAddressesHint')}</Text>
          </View>
        ) : null}

        {addresses.map((a) => (
          <View key={a._id} style={[styles.card, a.isDefault && styles.cardDefault]}>
            <View style={styles.cardTop}>
              <View style={styles.iconBox}>
                <Ionicons name={labelIcon(a.label)} size={20} color={c.primary} />
              </View>
              <View style={styles.cardText}>
                <View style={styles.titleRow}>
                  <Text style={styles.label} numberOfLines={1}>
                    {displayLabel(a.label, t)}
                  </Text>
                  {a.isDefault ? (
                    <View style={styles.badge}>
                      <Ionicons name="checkmark-circle" size={12} color={c.primary} />
                      <Text style={styles.badgeText}>{t('defaultBadge')}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.line}>{formatAddressLine(a)}</Text>
                {a.instructions ? <Text style={styles.instructions}>{a.instructions}</Text> : null}
              </View>
            </View>

            <View style={styles.actions}>
              {!a.isDefault ? (
                <Pressable
                  style={styles.action}
                  onPress={() => run(() => useAddressStore.getState().setDefault(a._id))}
                  hitSlop={6}
                >
                  <Ionicons name="star-outline" size={16} color={c.primary} />
                  <Text style={[styles.actionText, styles.actionPrimary]}>{t('makeDefault')}</Text>
                </Pressable>
              ) : null}
              <Pressable style={styles.action} onPress={() => setEditing(a)} hitSlop={6}>
                <Ionicons name="create-outline" size={16} color={c.customerTextSecondary} />
                <Text style={styles.actionText}>{t('editAction')}</Text>
              </Pressable>
              <Pressable style={styles.action} onPress={() => confirmDelete(a)} hitSlop={6}>
                <Ionicons name="trash-outline" size={16} color={c.customerTextSecondary} />
                <Text style={styles.actionText}>{t('deleteAction')}</Text>
              </Pressable>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addBtn} onPress={() => setEditing(null)} activeOpacity={0.8}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>{t('addNewAddress')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <AddressFormModal
        visible={editing !== undefined}
        address={editing}
        onClose={() => setEditing(undefined)}
      />
    </SafeAreaView>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
    },
    body: {
      flex: 1,
      backgroundColor: c.customerBodyBg,
    },
    content: {
      padding: 16,
      paddingBottom: 40,
      gap: 12,
    },
    empty: {
      alignItems: 'center',
      gap: 8,
      paddingVertical: 40,
      paddingHorizontal: 24,
    },
    emptyTitle: {
      fontFamily: Fonts.brandBlack,
      fontSize: 18,
      color: c.customerTextPrimary,
    },
    emptyHint: {
      fontFamily: Fonts.brand,
      fontSize: 14,
      color: c.customerTextSecondary,
      textAlign: 'center',
    },
    card: {
      backgroundColor: c.customerSurface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.customerBorder,
      padding: 14,
      gap: 12,
    },
    cardDefault: {
      borderColor: c.primary,
    },
    cardTop: {
      flexDirection: 'row',
      gap: 12,
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.customerBodyBg,
    },
    cardText: {
      flex: 1,
      gap: 3,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    label: {
      fontFamily: Fonts.brandBlack,
      fontSize: 15,
      color: c.customerTextPrimary,
      flexShrink: 1,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    badgeText: {
      fontFamily: Fonts.brandBold,
      fontSize: 11,
      color: c.primary,
    },
    line: {
      fontFamily: Fonts.brand,
      fontSize: 13,
      color: c.customerTextSecondary,
    },
    instructions: {
      fontFamily: Fonts.brand,
      fontSize: 12,
      color: c.customerTextMuted,
      fontStyle: 'italic',
    },
    actions: {
      flexDirection: 'row',
      gap: 18,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: c.customerBorder,
    },
    action: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    actionText: {
      fontFamily: Fonts.brandBold,
      fontSize: 13,
      color: c.customerTextSecondary,
    },
    actionPrimary: {
      color: c.primary,
    },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: c.brand,
      borderRadius: 12,
      paddingVertical: 14,
      marginTop: 4,
    },
    addBtnText: {
      fontFamily: Fonts.brandBold,
      fontSize: 15,
      color: '#fff',
    },
  });
}
