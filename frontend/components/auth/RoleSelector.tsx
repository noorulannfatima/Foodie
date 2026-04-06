import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';

type Role = 'restaurant' | 'delivery';

interface RoleSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectRole: (role: Role) => void;
}

const ROLES: { id: Role; label: string; emoji: string; description: string }[] = [
  {
    id: 'restaurant',
    label: 'Restaurant Owner',
    emoji: '🏪',
    description: 'Manage your menu, orders & earnings',
  },
  {
    id: 'delivery',
    label: 'Delivery Driver',
    emoji: '🚴',
    description: 'Pick up & deliver orders near you',
  },
];

export default function RoleSelector({ visible, onClose, onSelectRole }: RoleSelectorProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.handle} />
              <Text style={styles.title}>Continue as</Text>
              <Text style={styles.subtitle}>Choose how you want to use Foodie</Text>

              <View style={styles.options}>
                {ROLES.map((role) => (
                  <Pressable
                    key={role.id}
                    onPress={() => onSelectRole(role.id)}
                    style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                  >
                    <Text style={styles.optionEmoji}>{role.emoji}</Text>
                    <View style={styles.optionText}>
                      <Text style={styles.optionLabel}>{role.label}</Text>
                      <Text style={styles.optionDesc}>{role.description}</Text>
                    </View>
                    <Text style={styles.arrow}>›</Text>
                  </Pressable>
                ))}
              </View>

              <Pressable onPress={onClose} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#030303',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#868E96',
    marginBottom: 24,
  },
  options: {
    gap: 12,
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    padding: 16,
    gap: 14,
  },
  optionPressed: {
    backgroundColor: '#FFF0F0',
  },
  optionEmoji: {
    fontSize: 32,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  optionDesc: {
    fontSize: 13,
    color: '#868E96',
    marginTop: 2,
  },
  arrow: {
    fontSize: 22,
    color: '#ADB5BD',
    fontWeight: '300',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: 16,
    color: '#868E96',
    fontWeight: '500',
  },
});
