import { useMemo, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { DELIVERY_LANGUAGE_LABELS, deliveryProfileT } from '@/constants/deliveryProfileStrings';
import type { DeliveryLanguage } from '@/stores/deliveryPreferencesStore';

const ENGLISH_NAMES: Record<DeliveryLanguage, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  ur: 'Urdu',
};

export interface DeliveryLanguageSheetProps {
  language: DeliveryLanguage;
  /** Persists the choice; the sheet closes once it resolves. */
  onChoose: (code: DeliveryLanguage) => Promise<void>;
  onClose: () => void;
}

/** Page-sheet language picker, same shape as the customer app's. */
export default function DeliveryLanguageSheet({ language, onChoose, onClose }: DeliveryLanguageSheetProps) {
  const c = useAppThemeColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(c), [c]);
  const [saving, setSaving] = useState<DeliveryLanguage | null>(null);
  const t = (key: Parameters<typeof deliveryProfileT>[1]) => deliveryProfileT(language, key);

  const choose = async (code: DeliveryLanguage) => {
    if (code === language) {
      onClose();
      return;
    }
    setSaving(code);
    try {
      await onChoose(code);
      onClose();
    } finally {
      setSaving(null);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('close')}>
          <Ionicons name="close" size={24} color={c.text} />
        </Pressable>
        <Text style={styles.title}>{t('chooseLanguage')}</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.hint}>{t('languageSheetHint')}</Text>
        <View style={styles.card} accessibilityRole="radiogroup">
          {(Object.keys(DELIVERY_LANGUAGE_LABELS) as DeliveryLanguage[]).map((code, index) => {
            const selected = code === language;
            const native = DELIVERY_LANGUAGE_LABELS[code];
            return (
              <Pressable
                key={code}
                onPress={() => choose(code)}
                disabled={saving !== null}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                style={({ pressed }) => [styles.row, index > 0 && styles.rowDivider, pressed && styles.pressed]}
              >
                <View style={styles.rowText}>
                  <Text style={styles.native}>{native}</Text>
                  {native !== ENGLISH_NAMES[code] ? <Text style={styles.english}>{ENGLISH_NAMES[code]}</Text> : null}
                </View>
                {saving === code ? (
                  <ActivityIndicator size="small" color={c.primary} />
                ) : selected ? (
                  <Ionicons name="checkmark-circle" size={22} color={c.primary} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.screenBackground },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      backgroundColor: c.card,
    },
    title: { fontFamily: Fonts.brandBlack, fontSize: 18, color: c.text },
    spacer: { width: 24 },
    content: { padding: 20 },
    hint: { fontFamily: Fonts.brand, fontSize: 13, color: c.muted, lineHeight: 19, marginBottom: 16 },
    card: {
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 60,
      paddingVertical: 12,
      paddingHorizontal: 18,
    },
    rowDivider: { borderTopWidth: 1, borderTopColor: c.border },
    rowText: { flex: 1 },
    native: { fontFamily: Fonts.brandBold, fontSize: 16, color: c.text },
    english: { fontFamily: Fonts.brand, fontSize: 12, color: c.muted, marginTop: 2 },
    pressed: { opacity: 0.7 },
  });
}
