import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { useCustomerT } from '@/stores/customerPreferencesStore';
import { useAddressStore } from '@/stores/addressStore';
import type { SavedAddress } from '@/services/api/customer.api';
import AddressFields, { EMPTY_ADDRESS_DRAFT, isDraftComplete, type AddressDraft } from './AddressFields';

export interface AddressFormModalProps {
  visible: boolean;
  /** Edit this address; omit to add a new one. */
  address?: SavedAddress | null;
  onClose: () => void;
}

function toDraft(a?: SavedAddress | null): AddressDraft {
  if (!a) return EMPTY_ADDRESS_DRAFT;
  return {
    label: a.label,
    streetAddress: a.streetAddress,
    city: a.city,
    zipCode: a.zipCode,
    instructions: a.instructions ?? '',
  };
}

/** Page sheet for adding or editing a saved address. Saves through the address store. */
export default function AddressFormModal({ visible, address, onClose }: AddressFormModalProps) {
  const c = useAppThemeColors();
  const t = useCustomerT();
  const styles = useMemo(() => createStyles(c), [c]);
  const hasAddresses = useAddressStore((s) => s.addresses.length > 0);
  const [draft, setDraft] = useState<AddressDraft>(toDraft(address));
  const [makeDefault, setMakeDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const editing = !!address;

  // Start fresh each time the sheet opens.
  useEffect(() => {
    if (visible) {
      setDraft(toDraft(address));
      setMakeDefault(false);
    }
  }, [visible, address]);

  const handleSave = async () => {
    if (!isDraftComplete(draft)) {
      Alert.alert(t('validation'), t('fillDeliveryAddress'));
      return;
    }
    setSaving(true);
    try {
      const store = useAddressStore.getState();
      if (address) await store.update(address._id, draft);
      else await store.add({ ...draft, isDefault: makeDefault });
      onClose();
    } catch (err: unknown) {
      Alert.alert(t('addressSaveFailed'), err instanceof Error ? err.message : '');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel={t('close')} hitSlop={8}>
            <Ionicons name="close" size={24} color={c.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{editing ? t('editAddress') : t('addNewAddress')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AddressFields value={draft} onChange={setDraft} />

          {/* The first address becomes the default on its own. */}
          {!editing && hasAddresses ? (
            <Pressable
              style={styles.checkRow}
              onPress={() => setMakeDefault((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: makeDefault }}
            >
              <Ionicons
                name={makeDefault ? 'checkbox' : 'square-outline'}
                size={22}
                color={makeDefault ? c.primary : c.muted}
              />
              <Text style={styles.checkText}>{t('setAsDefault')}</Text>
            </Pressable>
          ) : null}

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnBusy]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{t('save')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.customerBodyBg,
    },
    header: {
      backgroundColor: c.customerSurface,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    headerSpacer: {
      width: 24,
    },
    headerTitle: {
      fontSize: 18,
      fontFamily: Fonts.brandBlack,
      color: c.text,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    checkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 6,
      marginBottom: 8,
    },
    checkText: {
      fontFamily: Fonts.brand,
      fontSize: 14,
      color: c.text,
    },
    saveBtn: {
      backgroundColor: c.brand,
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 12,
    },
    saveBtnBusy: {
      opacity: 0.6,
    },
    saveBtnText: {
      fontFamily: Fonts.brandBold,
      fontSize: 16,
      color: '#fff',
    },
  });
}
