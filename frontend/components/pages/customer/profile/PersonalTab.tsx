import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import ListRow from './ListRow';
import { useCustomerProfileStyles } from '@/hooks/useCustomerProfileStyles';

interface PersonalTabProps {
  user: { name: string; email: string } | null;
}

export default function PersonalTab({ user }: PersonalTabProps) {
  const { Colors, sharedStyles, app } = useCustomerProfileStyles();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        profileCard: {
          backgroundColor: Colors.surface,
          borderRadius: 16,
          padding: 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          shadowColor: '#000',
          shadowOpacity: app.isDark ? 0.2 : 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 3,
          marginBottom: 14,
        },
        avatarWrapper: { position: 'relative' },
        avatarPlaceholder: {
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: Colors.neutral,
          alignItems: 'center',
          justifyContent: 'center',
        },
        avatarInitials: { fontSize: 24, fontWeight: '700', color: '#fff' },
        editBadge: {
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: Colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: Colors.surface,
        },
        profileInfo: { flex: 1, gap: 4 },
        profileName: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
        profileEmail: { fontSize: 13, color: Colors.textSecondary },
        premiumBadge: {
          alignSelf: 'flex-start',
          backgroundColor: '#FEF3C7',
          borderColor: '#FBBF24',
          borderWidth: 1,
          borderRadius: 20,
          paddingHorizontal: 10,
          paddingVertical: 3,
          marginTop: 4,
        },
        premiumText: { fontSize: 10, fontWeight: '700', color: '#92400E', letterSpacing: 0.8 },
        loyaltyCard: {
          backgroundColor: Colors.neutral,
          borderRadius: 16,
          padding: 20,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 4,
        },
        loyaltyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
        loyaltyTitle: {
          fontSize: 14,
          fontWeight: '600',
          color: 'rgba(255,255,255,0.75)',
          letterSpacing: 0.5,
        },
        loyaltyPoints: { fontSize: 32, fontWeight: '800', color: Colors.tertiary, marginBottom: 2 },
        loyaltySub: { fontSize: 13, color: 'rgba(255,255,255,0.45)' },
      }),
    [Colors, app.isDark],
  );

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <ScrollView
      style={sharedStyles.tabContent}
      contentContainerStyle={sharedStyles.tabContentInner}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.profileCard}>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <TouchableOpacity
            style={styles.editBadge}
            activeOpacity={0.8}
            onPress={() => router.push('/(customer)/personal-information')}
          >
            <Ionicons name="pencil" size={12} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name ?? 'Guest User'}</Text>
          <Text style={styles.profileEmail}>{user?.email ?? 'user@example.com'}</Text>
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>PREMIUM MEMBER</Text>
          </View>
        </View>
      </View>

      <View style={sharedStyles.listCard}>
        <ListRow
          icon={
            <Ionicons
              name="person-circle-outline"
              size={22}
              color={Colors.neutral}
              style={sharedStyles.rowIcon}
            />
          }
          label="Personal Information"
          onPress={() => router.push('/(customer)/personal-information')}
        />
        <View style={sharedStyles.divider} />
        <ListRow
          icon={
            <MaterialIcons name="payment" size={22} color={Colors.neutral} style={sharedStyles.rowIcon} />
          }
          label="Payment Methods"
          onPress={() => router.push('/(customer)/payment-methods')}
        />
      </View>

      <View style={styles.loyaltyCard}>
        <View style={styles.loyaltyHeader}>
          <MaterialCommunityIcons name="crown-outline" size={20} color={Colors.tertiary} />
          <Text style={styles.loyaltyTitle}>Loyalty Points</Text>
        </View>
        <Text style={styles.loyaltyPoints}>0 pts</Text>
        <Text style={styles.loyaltySub}>Earn points on every order</Text>
      </View>
    </ScrollView>
  );
}
