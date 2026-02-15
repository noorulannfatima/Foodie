import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '@/components/molecules/DeliveryStatus/DeliveryStatus.styles';

interface DeliveryStatusProps {
  status: 'pending' | 'preparing' | 'on_the_way' | 'delivered';
  estimatedTime?: string;
}

const statusConfig = {
  pending: { label: 'Order Placed', color: '#868E96' },
  preparing: { label: 'Preparing', color: '#FFA94D' },
  on_the_way: { label: 'On the Way', color: '#4DABF7' },
  delivered: { label: 'Delivered', color: '#51CF66' },
};

export default function DeliveryStatus({ status, estimatedTime }: DeliveryStatusProps) {
  const config = statusConfig[status];

  return (
    <View style={styles.container}>
      <View style={[styles.indicator, { backgroundColor: config.color }]} />
      <View style={styles.content}>
        <Text style={styles.label}>{config.label}</Text>
        {estimatedTime && <Text style={styles.time}>{estimatedTime}</Text>}
      </View>
    </View>
  );
}
