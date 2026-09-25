import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCustomerProfileStyles } from '@/hooks/useCustomerProfileStyles';
import { useCustomerT } from '@/stores/customerPreferencesStore';

export default function BusinessTab() {
  const { Colors, sharedStyles, app } = useCustomerProfileStyles();
  const t = useCustomerT();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        businessTitle: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
        businessSubtitle: {
          fontSize: 14,
          color: Colors.textSecondary,
          marginBottom: 20,
          lineHeight: 20,
        },
        businessCard: {
          backgroundColor: Colors.surface,
          borderRadius: 20,
          overflow: 'hidden',
          marginBottom: 16,
          shadowColor: '#000',
          shadowOpacity: app.isDark ? 0.2 : 0.07,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
          elevation: 3,
        },
        businessCardDark: { backgroundColor: Colors.neutral },
        businessImagePlaceholder: { height: 160, alignItems: 'center', justifyContent: 'center' },
        businessCardBody: { padding: 18, gap: 8 },
        tierRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
        tierLabel: { fontSize: 11, fontWeight: '700', color: Colors.primary, letterSpacing: 1.2 },
        businessCardTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
        businessCardDesc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 21 },
        businessBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: Colors.brand,
          borderRadius: 12,
          paddingVertical: 14,
          gap: 8,
          marginTop: 4,
        },
        businessBtnText: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
        alreadyLink: { alignItems: 'center', paddingVertical: 4 },
        alreadyLinkText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
        perksRow: { flexDirection: 'row', gap: 12 },
        perkItem: {
          flex: 1,
          backgroundColor: Colors.surface,
          borderRadius: 16,
          padding: 16,
          gap: 6,
          shadowColor: '#000',
          shadowOpacity: app.isDark ? 0.15 : 0.05,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        },
        perkIcon: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: Colors.background,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 4,
        },
        perkTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
        perkDesc: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
      }),
    [Colors, app.isDark],
  );

  return (
    <ScrollView
      style={sharedStyles.tabContent}
      contentContainerStyle={sharedStyles.tabContentInner}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.businessTitle}>{t('yourPath')}</Text>
      <Text style={styles.businessSubtitle}>
        {t('yourPathHint')}
      </Text>

      <View style={styles.businessCard}>
        <View style={[styles.businessImagePlaceholder, { backgroundColor: '#92400E' }]}>
          <MaterialIcons name="restaurant" size={52} color="rgba(255,255,255,0.25)" />
        </View>
        <View style={styles.businessCardBody}>
          <View style={styles.tierRow}>
            <MaterialIcons name="restaurant-menu" size={13} color={Colors.primary} />
            <Text style={styles.tierLabel}>{t('partnerTier')}</Text>
          </View>
          <Text style={styles.businessCardTitle}>{t('restaurantOwner')}</Text>
          <Text style={styles.businessCardDesc}>
            {t('restaurantOwnerHint')}
          </Text>
          <TouchableOpacity
            style={styles.businessBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/(auth)/restaurant/signup')}
          >
            <Text style={styles.businessBtnText}>{t('registerStore')}</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(auth)/restaurant/login')} style={styles.alreadyLink}>
            <Text style={styles.alreadyLinkText}>{t('alreadyRegistered')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.businessCard, styles.businessCardDark]}>
        <View style={[styles.businessImagePlaceholder, { backgroundColor: '#1F2937' }]}>
          <MaterialCommunityIcons name="motorbike" size={52} color="rgba(255,255,255,0.2)" />
        </View>
        <View style={styles.businessCardBody}>
          <View style={styles.tierRow}>
            <MaterialCommunityIcons name="motorbike" size={13} color={Colors.secondary} />
            <Text style={[styles.tierLabel, { color: Colors.secondary }]}>{t('flexibleWork')}</Text>
          </View>
          <Text style={[styles.businessCardTitle, { color: '#fff' }]}>{t('deliveryDriver')}</Text>
          <Text style={[styles.businessCardDesc, { color: 'rgba(255,255,255,0.65)' }]}>
            {t('deliveryDriverHint')}
          </Text>
          <TouchableOpacity
            style={styles.businessBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/(auth)/delivery/signup')}
          >
            <Text style={styles.businessBtnText}>{t('becomeRider')}</Text>
            <MaterialCommunityIcons name="bike-fast" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(auth)/delivery/login')} style={styles.alreadyLink}>
            <Text style={[styles.alreadyLinkText, { color: 'rgba(255,255,255,0.5)' }]}>
              {t('alreadyRider')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.perksRow}>
        <View style={styles.perkItem}>
          <View style={styles.perkIcon}>
            <MaterialIcons name="payment" size={22} color={Colors.neutral} />
          </View>
          <Text style={styles.perkTitle}>{t('weeklyPayouts')}</Text>
          <Text style={styles.perkDesc}>{t('weeklyPayoutsHint')}</Text>
        </View>
        <View style={styles.perkItem}>
          <View style={styles.perkIcon}>
            <MaterialIcons name="support-agent" size={22} color={Colors.neutral} />
          </View>
          <Text style={styles.perkTitle}>{t('support247')}</Text>
          <Text style={styles.perkDesc}>{t('support247Hint')}</Text>
        </View>
      </View>
    </ScrollView>
  );
}
