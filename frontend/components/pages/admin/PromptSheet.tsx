import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Fonts, useAppThemeColors } from '@/constants/theme';

interface PromptSheetProps {
  visible: boolean;
  title: string;
  message?: string;
  placeholder: string;
  confirmLabel: string;
  destructive?: boolean;
  onSubmit: (value: string) => Promise<void>;
  onClose: () => void;
}

/** Text-input confirmation dialog (Alert.prompt is iOS-only). */
export default function PromptSheet({
  visible,
  title,
  message,
  placeholder,
  confirmLabel,
  destructive,
  onSubmit,
  onClose,
}: PromptSheetProps) {
  const c = useAppThemeColors();
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) setValue('');
  }, [visible]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          padding: 24,
        },
        card: { backgroundColor: c.card, borderRadius: 16, padding: 20, gap: 12 },
        title: { fontFamily: Fonts.brandBlack, fontSize: 18, color: c.text },
        message: { fontFamily: Fonts.brand, fontSize: 13, color: c.muted },
        input: {
          fontFamily: Fonts.brand,
          fontSize: 15,
          color: c.text,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
        },
        actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
        cancel: { paddingHorizontal: 16, paddingVertical: 10 },
        cancelText: { fontFamily: Fonts.brandBold, fontSize: 14, color: c.muted },
        confirm: {
          backgroundColor: destructive ? '#DC2626' : c.brand,
          borderRadius: 10,
          paddingHorizontal: 16,
          paddingVertical: 10,
          minWidth: 96,
          alignItems: 'center',
        },
        confirmText: { fontFamily: Fonts.brandBold, fontSize: 14, color: '#FFFFFF' },
      }),
    [c, destructive],
  );

  const canSubmit = value.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit(value.trim());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor={c.muted}
            autoFocus
            onSubmitEditing={handleSubmit}
          />
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancel} onPress={onClose} disabled={submitting}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirm, !canSubmit && { opacity: 0.5 }]}
              onPress={handleSubmit}
              disabled={!canSubmit}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.confirmText}>{confirmLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
