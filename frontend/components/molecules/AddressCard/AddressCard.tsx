import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '@/components/molecules/AddressCard/AddressCard.styles';

interface AddressCardProps {
  title: string;
  address: string;
  selected?: boolean;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function AddressCard({ title, address, selected, onPress, onEdit, onDelete }: AddressCardProps) {
  return (
    <Pressable onPress={onPress} style={[styles.card, selected && styles.selected]}>
      <View style={styles.content}>
        <Ionicons name="location" size={24} color="#FF6B6B" />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.address}>{address}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        {onEdit && (
          <Pressable onPress={onEdit} style={styles.actionButton}>
            <Ionicons name="pencil" size={18} color="#868E96" />
          </Pressable>
        )}
        {onDelete && (
          <Pressable onPress={onDelete} style={styles.actionButton}>
            <Ionicons name="trash" size={18} color="#FF6B6B" />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}
