import { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts } from '@/constants/theme';
import { useRestaurantStore, OrderItem } from '@/stores/restaurantStore';
import { Loader, Switch } from '@/components/atoms';

const STATUS_COLORS: Record<string, string> = {
  Pending: '#F59E0B',
  Confirmed: '#3B82F6',
  Preparing: '#8B5CF6',
  Ready: '#10B981',
  PickedUp: '#06B6D4',
  Delivered: '#22C55E',
  Cancelled: '#EF4444',
};

export default function RestaurantDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { dashboard, dashboardLoading, fetchDashboard, toggleActive } = useRestaurantStore();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onRefresh = useCallback(() => {
    fetchDashboard();
  }, []);

  const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString()}`;

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (dashboardLoading && !dashboard) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <Loader />
      </View>
    );
  }

  const today = dashboard?.today;
  const restaurant = dashboard?.restaurant;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="restaurant" size={20} color={Colors.primary} />
          <Text style={styles.brand}>FOODIE</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.statusDot, { backgroundColor: restaurant?.isActive ? '#10B981' : '#EF4444' }]} />
          <Text style={styles.statusText}>{restaurant?.isActive ? 'Open' : 'Closed'}</Text>
          <Switch
            value={restaurant?.isActive ?? false}
            onValueChange={(val) => toggleActive(val)}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={dashboardLoading} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Greeting */}
        <Text style={styles.greeting}>{getGreeting()}, Chef</Text>
        <Text style={styles.title}>Kitchen Overview</Text>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={16} color={Colors.muted} />
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>

        {/* Revenue Card */}
        <View style={styles.revenueCard}>
          <Text style={styles.revenueLabel}>TODAY'S REVENUE</Text>
          <Text style={styles.revenueAmount}>{formatCurrency(today?.totalRevenue ?? 0)}</Text>
          <View style={styles.revenueSubRow}>
            <Ionicons name="trending-up" size={18} color="#fff" />
            <Text style={styles.revenueSubText}>
              {today?.totalOrders ?? 0} orders today
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatBox
            label="ACTIVE ORDERS"
            value={String((today?.pendingCount ?? 0) + (today?.preparingCount ?? 0) + (today?.readyCount ?? 0))}
            icon="receipt-outline"
            sublabel={`${today?.preparingCount ?? 0} preparing`}
          />
          <StatBox
            label="READY FOR PICKUP"
            value={String(today?.readyCount ?? 0)}
            icon="bag-check-outline"
            sublabel="Awaiting pickup"
          />
        </View>

        <View style={styles.statsGrid}>
          <StatBox
            label="RATING"
            value={String(restaurant?.averageRating?.toFixed(1) ?? '0.0')}
            icon="star"
            sublabel={`${restaurant?.totalReviews ?? 0} reviews`}
            iconColor="#F59E0B"
          />
          <StatBox
            label="PENDING"
            value={String(today?.pendingCount ?? 0)}
            icon="time-outline"
            sublabel="Need attention"
            iconColor={Colors.primary}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(restaurant)/(tabs)/orders')}
          >
            <Ionicons name="receipt-outline" size={20} color={Colors.primary} />
            <Text style={styles.quickActionText}>View All Orders</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(restaurant)/(tabs)/menu')}
          >
            <Ionicons name="restaurant-outline" size={20} color={Colors.primary} />
            <Text style={styles.quickActionText}>Manage Menu</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Recent Orders */}
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        {dashboard?.recentOrders && dashboard.recentOrders.length > 0 ? (
          dashboard.recentOrders.map((order: OrderItem) => (
            <TouchableOpacity
              key={order._id}
              style={styles.orderCard}
              onPress={() => router.push('/(restaurant)/(tabs)/orders')}
            >
              <View style={styles.orderCardHeader}>
                <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
                <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[order.status] || Colors.muted) + '20' }]}>
                  <Text style={[styles.statusBadgeText, { color: STATUS_COLORS[order.status] || Colors.muted }]}>
                    {order.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.orderCustomer}>
                {order.customer?.name ?? 'Customer'}
              </Text>
              <View style={styles.orderCardFooter}>
                <Text style={styles.orderItems}>{order.items.length} items</Text>
                <Text style={styles.orderDot}>•</Text>
                <Text style={styles.orderTotal}>{formatCurrency(order.pricing.total)}</Text>
                <Text style={styles.orderDot}>•</Text>
                <Text style={styles.orderTime}>{getTimeAgo(order.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={Colors.light} />
            <Text style={styles.emptyText}>No recent orders</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function StatBox({
  label,
  value,
  icon,
  sublabel,
  iconColor,
}: {
  label: string;
  value: string;
  icon: string;
  sublabel: string;
  iconColor?: string;
}) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statValueRow}>
        <Text style={styles.statValue}>{value}</Text>
        <Ionicons name={icon as any} size={24} color={iconColor || Colors.secondary} />
      </View>
      <Text style={styles.statSublabel}>{sublabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.dark,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brand: {
    fontFamily: Fonts.brandBlack,
    fontSize: 20,
    color: '#fff',
    letterSpacing: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: Fonts.brand,
    fontSize: 13,
    color: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  greeting: {
    fontFamily: Fonts.brandBold,
    fontSize: 14,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontFamily: Fonts.brandBlack,
    fontSize: 28,
    color: Colors.dark,
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  dateText: {
    fontFamily: Fonts.brand,
    fontSize: 14,
    color: Colors.muted,
  },
  revenueCard: {
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  revenueLabel: {
    fontFamily: Fonts.brandBold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    marginBottom: 8,
  },
  revenueAmount: {
    fontFamily: Fonts.brandBlack,
    fontSize: 36,
    color: '#fff',
    marginBottom: 12,
  },
  revenueSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  revenueSubText: {
    fontFamily: Fonts.brand,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statLabel: {
    fontFamily: Fonts.brandBold,
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  statValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statValue: {
    fontFamily: Fonts.brandBlack,
    fontSize: 28,
    color: Colors.dark,
  },
  statSublabel: {
    fontFamily: Fonts.brand,
    fontSize: 12,
    color: Colors.muted,
    marginTop: 4,
  },
  quickActions: {
    marginTop: 8,
    marginBottom: 24,
    gap: 8,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    gap: 12,
  },
  quickActionText: {
    flex: 1,
    fontFamily: Fonts.brandBold,
    fontSize: 15,
    color: Colors.dark,
  },
  sectionTitle: {
    fontFamily: Fonts.brandBlack,
    fontSize: 20,
    color: Colors.dark,
    marginBottom: 12,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderNumber: {
    fontFamily: Fonts.brandBold,
    fontSize: 15,
    color: Colors.dark,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontFamily: Fonts.brandBold,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  orderCustomer: {
    fontFamily: Fonts.brand,
    fontSize: 14,
    color: Colors.text,
    marginBottom: 6,
  },
  orderCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderItems: {
    fontFamily: Fonts.brand,
    fontSize: 13,
    color: Colors.muted,
  },
  orderDot: {
    color: Colors.muted,
    fontSize: 13,
  },
  orderTotal: {
    fontFamily: Fonts.brandBold,
    fontSize: 13,
    color: Colors.dark,
  },
  orderTime: {
    fontFamily: Fonts.brand,
    fontSize: 13,
    color: Colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontFamily: Fonts.brand,
    fontSize: 15,
    color: Colors.muted,
  },
});
