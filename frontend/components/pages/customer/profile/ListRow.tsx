import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sharedStyles, Colors } from './profile.styles';

export interface ListRowProps {
  icon?: React.ReactNode;
  label: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

export default function ListRow({ icon, label, onPress, rightElement }: ListRowProps) {
  return (
    <TouchableOpacity style={sharedStyles.listRow} onPress={onPress} activeOpacity={0.7}>
      <View style={sharedStyles.listRowLeft}>
        {icon}
        <Text style={sharedStyles.listRowLabel}>{label}</Text>
      </View>
      {rightElement ?? <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />}
    </TouchableOpacity>
  );
}
