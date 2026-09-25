import { useMemo, useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { useCustomerT } from '@/stores/customerPreferencesStore';
import { useAddressStore } from '@/stores/addressStore';
import AddressOption from './AddressOption';

export interface AddressPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Leave the sheet for Saved Addresses; `add` opens the new-address form there. */
  onManage: (opts: { add: boolean }) => void;
}

/** Bottom sheet behind the home "Deliver to" row: picking an address makes it the default. */
export default function AddressPickerSheet({ visible, onClose, onManage }: AddressPickerSheetProps) {
  const c = useAppThemeColors();
  const t = useCustomerT();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(c), [c]);
  const addresses = useAddressStore((s) => s.addresses);
  const [busyId, setBusyId] = useState<string | null>(null);

  const pick = async (id: string) => {
    if (busyId) return;
    setBusyId(id);
    try {
      await useAddressStore.getState().setDefault(id);
      onClose();
    } catch (err: unknown) {
      Alert.alert(t('error'), err instanceof Error ? err.message : '');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('close')} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.grabber} />
        <Text style={styles.title}>{t('chooseDeliveryAddress')}</Text>

        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {addresses.map((a) => (
            <AddressOption
              key={a._id}
              address={a}
              selected={busyId ? busyId === a._id : a.isDefault}
              onPress={() => pick(a._id)}
            />
          ))}
        </ScrollView>

        <Pressable style={styles.action} onPress={() => onManage({ add: true })}>
          <Ionicons name="add-circle-outline" size={20} color={c.primary} />
          <Text style={styles.actionText}>{t('addNewAddress')}</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={() => onManage({ add: false })}>
          <Ionicons name="settings-outline" size={20} color={c.customerTextSecondary} />
          <Text style={[styles.actionText, styles.actionTextMuted]}>{t('manageAddresses')}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheet: {
      backgroundColor: c.customerBodyBg,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 20,
      paddingTop: 10,
      maxHeight: '75%',
    },
    grabber: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border,
      marginBottom: 14,
    },
    title: {
      fontFamily: Fonts.brandBlack,
      fontSize: 18,
      color: c.text,
      marginBottom: 14,
    },
    list: {
      flexGrow: 0,
    },
    action: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 12,
    },
    actionText: {
      fontFamily: Fonts.brandBold,
      fontSize: 15,
      color: c.primary,
    },
    actionTextMuted: {
      color: c.customerTextSecondary,
    },
  });
}
