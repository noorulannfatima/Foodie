import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import {
  DELIVERY_SETTINGS_FIELDS,
  DELIVERY_SETTINGS_LIMITS,
  sanitizeNumericInput,
  toDeliverySettingsForm,
  validateDeliverySettings,
  type DeliverySettings,
  type DeliverySettingsForm,
  type DeliverySettingsKey,
} from './deliverySettings';

export interface DeliverySettingsModalProps {
  settings: DeliverySettings;
  onClose: () => void;
  onSave: (settings: DeliverySettings) => Promise<void>;
}

export default function DeliverySettingsModal({ settings, onClose, onSave }: DeliverySettingsModalProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const initialForm = useMemo(() => toDeliverySettingsForm(settings), [settings]);
  const [form, setForm] = useState<DeliverySettingsForm>(initialForm);
  const [touched, setTouched] = useState<Partial<Record<DeliverySettingsKey, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { values, errors } = useMemo(() => validateDeliverySettings(form), [form]);
  const isDirty = DELIVERY_SETTINGS_FIELDS.some(
    ({ key }) => Number(form[key]) !== settings[key] || form[key].trim() === '',
  );
  const canSave = isDirty && !saving;

  const updateField = (key: DeliverySettingsKey, text: string, allowDecimal: boolean) => {
    setSaveError(null);
    setForm((prev) => ({ ...prev, [key]: sanitizeNumericInput(text, allowDecimal) }));
  };

  const handleSave = async () => {
    setSubmitted(true);
    if (!values) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(values);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update delivery settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onClose}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={8}
        >
          <Ionicons name="close" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Delivery Settings</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSave }}
          hitSlop={8}
        >
          <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {saveError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={18} color={c.primary} />
            <Text style={styles.errorBannerText}>{saveError}</Text>
          </View>
        ) : null}

        {DELIVERY_SETTINGS_FIELDS.map((field) => {
          const { min, max } = DELIVERY_SETTINGS_LIMITS[field.key];
          const error = (touched[field.key] || submitted) ? errors[field.key] : undefined;
          return (
            <View key={field.key} style={styles.field}>
              <Text style={styles.label}>{field.label}</Text>
              <View style={[styles.inputWrap, error && styles.inputWrapError]}>
                {field.prefix ? <Text style={styles.affix}>{field.prefix}</Text> : null}
                <TextInput
                  style={styles.input}
                  value={form[field.key]}
                  onChangeText={(text) => updateField(field.key, text, field.allowDecimal)}
                  onBlur={() => setTouched((prev) => ({ ...prev, [field.key]: true }))}
                  keyboardType={field.allowDecimal ? 'decimal-pad' : 'number-pad'}
                  placeholder={String(settings[field.key])}
                  placeholderTextColor={c.muted}
                  editable={!saving}
                  maxLength={7}
                  accessibilityLabel={field.label}
                />
                {field.suffix ? <Text style={styles.affix}>{field.suffix}</Text> : null}
              </View>
              <Text style={[styles.hint, error && styles.hintError]}>
                {error ?? `${field.hint} (${min}–${max.toLocaleString()})`}
              </Text>
            </View>
          );
        })}

        <Text style={styles.footnote}>
          Changes apply to new orders only. Orders already placed keep their original fee.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
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
    title: {
      fontFamily: Fonts.brandBlack,
      fontSize: 18,
      color: c.text,
    },
    saveText: {
      fontFamily: Fonts.brandBold,
      fontSize: 16,
      color: c.primary,
    },
    saveTextDisabled: {
      opacity: 0.4,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      marginBottom: 20,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.primary,
      backgroundColor: c.card,
    },
    errorBannerText: {
      flex: 1,
      fontFamily: Fonts.brand,
      fontSize: 13,
      color: c.text,
    },
    field: {
      marginBottom: 20,
    },
    label: {
      fontFamily: Fonts.brandBold,
      fontSize: 14,
      color: c.text,
      marginBottom: 8,
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      backgroundColor: c.card,
    },
    inputWrapError: {
      borderColor: c.primary,
    },
    affix: {
      fontFamily: Fonts.brandBold,
      fontSize: 15,
      color: c.muted,
    },
    input: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 8,
      fontFamily: Fonts.brand,
      fontSize: 16,
      color: c.text,
    },
    hint: {
      fontFamily: Fonts.brand,
      fontSize: 12,
      color: c.muted,
      marginTop: 6,
    },
    hintError: {
      color: c.primary,
    },
    footnote: {
      fontFamily: Fonts.brand,
      fontSize: 12,
      color: c.muted,
      textAlign: 'center',
      marginTop: 4,
    },
  });
}
