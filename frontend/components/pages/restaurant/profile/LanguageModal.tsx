import { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { useAppLanguageStore, type AppLanguage } from '@/stores/appLanguageStore';
import { DELIVERY_LANGUAGE_LABELS } from '@/constants/deliveryProfileStrings';
import { useRestaurantT } from '@/constants/restaurantStrings';

export interface LanguageModalProps {
  onClose: () => void;
}

const LANGUAGE_CODES = Object.keys(DELIVERY_LANGUAGE_LABELS) as AppLanguage[];

export default function LanguageModal({ onClose }: LanguageModalProps) {
  const c = useAppThemeColors();
  const t = useRestaurantT();
  const styles = useMemo(() => createStyles(c), [c]);

  const language = useAppLanguageStore((s) => s.language);
  const setLanguage = useAppLanguageStore((s) => s.setLanguage);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('close')}
          hitSlop={8}
        >
          <Ionicons name="close" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('language')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionDescription}>{t('languageHint')}</Text>

        <View style={styles.card} accessibilityRole="radiogroup">
          {LANGUAGE_CODES.map((code, index) => {
            const on = language === code;
            return (
              <Pressable
                key={code}
                onPress={() => setLanguage(code)}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                style={({ pressed }) => [
                  styles.row,
                  index < LANGUAGE_CODES.length - 1 && styles.rowDivider,
                  pressed && styles.rowPressed,
                ]}
              >
                <Text style={[styles.rowLabel, on && styles.rowLabelOn]}>
                  {DELIVERY_LANGUAGE_LABELS[code]}
                </Text>
                {on ? <Ionicons name="checkmark" size={20} color={c.brand} /> : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    headerSpacer: {
      width: 24,
    },
    title: {
      fontFamily: Fonts.brandBlack,
      fontSize: 18,
      color: c.text,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    sectionDescription: {
      fontFamily: Fonts.brand,
      fontSize: 12,
      color: c.muted,
      marginBottom: 10,
    },
    card: {
      backgroundColor: c.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    // Fixed height so the Urdu fallback font doesn't make its row taller than the rest
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 52,
      paddingHorizontal: 16,
    },
    rowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    rowPressed: {
      backgroundColor: c.screenBackground,
    },
    rowLabel: {
      fontFamily: Fonts.brand,
      fontSize: 15,
      color: c.text,
    },
    rowLabelOn: {
      fontFamily: Fonts.brandBold,
    },
  });
}
