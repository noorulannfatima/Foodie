import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import type { RestaurantProfile } from '@/stores/restaurantStore';

export interface RestaurantProfileTitleProps {
  profile: RestaurantProfile;
}

export default function RestaurantProfileTitle({ profile }: RestaurantProfileTitleProps) {
  return (
    <View style={styles.profileHeader}>
      <View style={styles.profileInfo}>
        <Text style={styles.restaurantName}>{profile.name}</Text>
        <View style={styles.addressRow}>
          <Ionicons name="location" size={14} color={Colors.primary} />
          <Text style={styles.addressText}>
            {profile.address.street}, {profile.address.city}
          </Text>
        </View>
      </View>
      {profile.isVerified ? (
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={14} color="#10B981" />
          <Text style={styles.verifiedText}>Verified</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  profileInfo: {
    flex: 1,
  },
  restaurantName: {
    fontFamily: Fonts.brandBlack,
    fontSize: 28,
    color: Colors.dark,
    marginBottom: 6,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addressText: {
    fontFamily: Fonts.brand,
    fontSize: 13,
    color: Colors.muted,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  verifiedText: {
    fontFamily: Fonts.brandBold,
    fontSize: 11,
    color: '#10B981',
  },
});
