import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCustomerProfileStyles } from '@/hooks/useCustomerProfileStyles';
import { CUSTOMER_LANGUAGES, type CustomerLanguage } from '@/constants/customerStrings';
import { useCustomerPreferencesStore, useCustomerT } from '@/stores/customerPreferencesStore';

interface LanguageSheetProps {
  onClose: () => void;
}

export default function LanguageSheet({ onClose }: LanguageSheetProps) {
  const { Colors } = useCustomerProfileStyles();
  const t = useCustomerT();
  const language = useCustomerPreferencesStore((s) => s.language);
  const setLanguage = useCustomerPreferencesStore((s) => s.setLanguage);
  const [saving, setSaving] = useState<CustomerLanguage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: Colors.background },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
          backgroundColor: Colors.surface,
        },
        title: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
        spacer: { width: 24 },
        content: { padding: 20 },
        hint: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginBottom: 16 },
        card: {
          backgroundColor: Colors.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: Colors.border,
          overflow: 'hidden',
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 16,
          paddingHorizontal: 18,
          gap: 12,
        },
        rowDivider: { borderTopWidth: 1, borderTopColor: Colors.border },
        rowText: { flex: 1 },
        nativeLabel: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
        label: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
        error: { fontSize: 13, color: Colors.primary, marginTop: 16, lineHeight: 18 },
      }),
    [Colors],
  );

  const choose = async (code: CustomerLanguage) => {
    if (code === language) {
      onClose();
      return;
    }
    setError(null);
    setSaving(code);
    try {
      await setLanguage(code);
      onClose();
    } catch {
      // The switch already applied locally; only the server sync failed
      setError(t('languageSaveFailed'));
    } finally {
      setSaving(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel={t('close')} hitSlop={8}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('chooseLanguage')}</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.hint}>{t('languageSheetHint')}</Text>
        <View style={styles.card}>
          {CUSTOMER_LANGUAGES.map((option, index) => {
            const selected = option.code === language;
            return (
              <TouchableOpacity
                key={option.code}
                style={[styles.row, index > 0 && styles.rowDivider]}
                onPress={() => choose(option.code)}
                disabled={saving !== null}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
              >
                <View style={styles.rowText}>
                  <Text style={styles.nativeLabel}>{option.nativeLabel}</Text>
                  {option.nativeLabel !== option.label ? (
                    <Text style={styles.label}>{option.label}</Text>
                  ) : null}
                </View>
                {saving === option.code ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : selected ? (
                  <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </View>
  );
}
