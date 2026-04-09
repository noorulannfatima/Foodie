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
import { Switch } from '@/components/atoms';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export type OperatingHoursState = Record<string, { open: string; close: string; isClosed: boolean }>;

export interface OperatingHoursModalProps {
  hours: OperatingHoursState;
  onClose: () => void;
  onSave: (hours: OperatingHoursState) => Promise<void>;
}

export default function OperatingHoursModal({ hours, onClose, onSave }: OperatingHoursModalProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const [editHours, setEditHours] = useState({ ...hours });
  const [saving, setSaving] = useState(false);

  const updateDay = (day: string, field: string, value: string | boolean) => {
    setEditHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(editHours);
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
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Operating Hours</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[styles.saveText, saving && { opacity: 0.5 }]}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {DAYS.map((day) => (
          <View key={day} style={styles.dayRow}>
            <View style={styles.dayInfo}>
              <Text style={styles.dayName}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
              <View style={styles.closedRow}>
                <Text style={styles.closedLabel}>Closed</Text>
                <Switch
                  value={editHours[day]?.isClosed ?? false}
                  onValueChange={(val) => updateDay(day, 'isClosed', val)}
                />
              </View>
            </View>
            {!editHours[day]?.isClosed ? (
              <View style={styles.timeRow}>
                <TextInput
                  style={styles.timeInput}
                  value={editHours[day]?.open ?? '09:00'}
                  onChangeText={(val) => updateDay(day, 'open', val)}
                  placeholder="09:00"
                  placeholderTextColor={c.muted}
                />
                <Text style={styles.timeSep}>to</Text>
                <TextInput
                  style={styles.timeInput}
                  value={editHours[day]?.close ?? '22:00'}
                  onChangeText={(val) => updateDay(day, 'close', val)}
                  placeholder="22:00"
                  placeholderTextColor={c.muted}
                />
              </View>
            ) : null}
          </View>
        ))}
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
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    dayRow: {
      marginBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      paddingBottom: 16,
    },
    dayInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    dayName: {
      fontFamily: Fonts.brandBold,
      fontSize: 16,
      color: c.text,
    },
    closedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    closedLabel: {
      fontFamily: Fonts.brand,
      fontSize: 13,
      color: c.muted,
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    timeInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontFamily: Fonts.brand,
      fontSize: 15,
      color: c.text,
      textAlign: 'center',
      backgroundColor: c.card,
    },
    timeSep: {
      fontFamily: Fonts.brand,
      fontSize: 14,
      color: c.muted,
    },
  });
}
