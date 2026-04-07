import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import { useCartStore, CartItem } from '@/stores/cartStore';
import { customerAPI } from '@/services/api/customer.api';
import { Loader } from '@/components/atoms';

const NAV_COLOR = '#003049';

export default function CustomerCart() {
  const router = useRouter();
  const { cart, loading, fetchCart, updateQuantity, removeItem, clearCart, deliveryFee, tax, total } = useCartStore();
  const [checkoutVisible, setCheckoutVisible] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString()}`;

  const handleQuantityChange = (item: CartItem, delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      Alert.alert('Remove Item', `Remove ${item.name} from cart?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeItem(item._id) },
      ]);
    } else {
      updateQuantity(item._id, newQty);
    }
  };

  if (loading && !cart) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingContainer}><Loader /></View>
      </SafeAreaView>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={NAV_COLOR} />
        <View style={styles.header}>
          <Ionicons name="menu" size={22} color="#fff" />
          <Text style={styles.headerLogo}>FOODIE</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="bag-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptySubtext}>Add items from a restaurant to get started</Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => router.push('/(customer)/(tabs)/home')}
          >
            <Text style={styles.browseBtnText}>Browse Restaurants</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const subtotal = cart.subtotal;
  const deliveryFeeAmt = deliveryFee();
  const taxAmt = tax();
  const totalAmt = total();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={NAV_COLOR} />

      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="menu" size={22} color="#fff" />
        <Text style={styles.headerLogo}>FOODIE</Text>
        <TouchableOpacity
          onPress={() =>
            Alert.alert('Clear Cart', 'Remove all items?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: clearCart },
            ])
          }
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Your Cart</Text>
        <Text style={styles.restaurantLabel}>from {cart.restaurant?.name}</Text>

        {/* Cart Items */}
        {cart.items.map((item) => (
          <View key={item._id} style={styles.cartItem}>
            <View style={styles.cartItemInfo}>
              <Text style={styles.cartItemName}>{item.name}</Text>
              {item.specialInstructions && (
                <Text style={styles.cartItemSub}>{item.specialInstructions}</Text>
              )}
              <Text style={styles.cartItemPrice}>{formatCurrency(item.price)}</Text>
            </View>

            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => removeItem(item._id)}
            >
              <Ionicons name="close" size={16} color={Colors.muted} />
            </TouchableOpacity>

            <View style={styles.quantityControl}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => handleQuantityChange(item, -1)}
              >
                <Ionicons name="remove" size={16} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={styles.qtyText}>
                {String(item.quantity).padStart(2, '0')}
              </Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => handleQuantityChange(item, 1)}
              >
                <Ionicons name="add" size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Price Breakdown */}
        <View style={styles.priceCard}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery Fee</Text>
            <Text style={styles.priceValue}>{formatCurrency(deliveryFeeAmt)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Taxes & Fees</Text>
            <Text style={styles.priceValue}>{formatCurrency(taxAmt)}</Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalAmt)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.checkoutBar}>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => setCheckoutVisible(true)}
        >
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Checkout Modal */}
      <Modal visible={checkoutVisible} animationType="slide" presentationStyle="pageSheet">
        <CheckoutModal
          total={totalAmt}
          onClose={() => setCheckoutVisible(false)}
          onPlaceOrder={async (data) => {
            try {
              const result = await customerAPI.createOrder(data);
              setCheckoutVisible(false);
              await useCartStore.getState().fetchCart();
              Alert.alert(
                'Order Placed!',
                `Your order #${result.order.orderNumber} has been placed successfully.`,
                [{ text: 'OK', onPress: () => router.push('/(customer)/(tabs)/home') }]
              );
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to place order');
            }
          }}
        />
      </Modal>
    </SafeAreaView>
  );
}

// ─── Checkout Modal ───────────────────────────────────────────────────────────

function CheckoutModal({
  total,
  onClose,
  onPlaceOrder,
}: {
  total: number;
  onClose: () => void;
  onPlaceOrder: (data: any) => Promise<void>;
}) {
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [instructions, setInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [placing, setPlacing] = useState(false);

  const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString()}`;

  const handlePlace = async () => {
    if (!street.trim() || !city.trim() || !zipCode.trim()) {
      Alert.alert('Validation', 'Please fill in delivery address');
      return;
    }
    setPlacing(true);
    try {
      await onPlaceOrder({
        deliveryAddress: { street, city, zipCode, instructions },
        paymentMethod,
      });
    } finally {
      setPlacing(false);
    }
  };

  const PAYMENTS = [
    { key: 'Card', icon: 'card-outline', label: 'Credit Card' },
    { key: 'Wallet', icon: 'wallet-outline', label: 'Digital Wallet' },
    { key: 'Cash', icon: 'cash-outline', label: 'Cash' },
  ];

  return (
    <KeyboardAvoidingView
      style={checkoutStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={checkoutStyles.header}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={checkoutStyles.headerLogo}>FOODIE</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={checkoutStyles.content}>
        <Text style={checkoutStyles.title}>Checkout</Text>
        <Text style={checkoutStyles.subtitle}>Finalize your gourmet selection</Text>

        {/* Delivery Address */}
        <View style={checkoutStyles.section}>
          <View style={checkoutStyles.sectionHeader}>
            <Ionicons name="location" size={18} color={Colors.primary} />
            <Text style={checkoutStyles.sectionTitle}>Delivery Address</Text>
          </View>
          <TextInput style={checkoutStyles.input} placeholder="Street address" value={street} onChangeText={setStreet} placeholderTextColor={Colors.muted} />
          <View style={checkoutStyles.inputRow}>
            <TextInput style={[checkoutStyles.input, { flex: 1 }]} placeholder="City" value={city} onChangeText={setCity} placeholderTextColor={Colors.muted} />
            <TextInput style={[checkoutStyles.input, { flex: 1 }]} placeholder="Zip Code" value={zipCode} onChangeText={setZipCode} placeholderTextColor={Colors.muted} />
          </View>
        </View>

        {/* Payment Method */}
        <View style={checkoutStyles.section}>
          <View style={checkoutStyles.sectionHeader}>
            <Ionicons name="card" size={18} color={Colors.primary} />
            <Text style={checkoutStyles.sectionTitle}>Payment Method</Text>
          </View>
          {PAYMENTS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[checkoutStyles.paymentOption, paymentMethod === p.key && checkoutStyles.paymentOptionActive]}
              onPress={() => setPaymentMethod(p.key)}
            >
              <Ionicons name={p.icon as any} size={20} color={paymentMethod === p.key ? Colors.dark : Colors.muted} />
              <Text style={[checkoutStyles.paymentLabel, paymentMethod === p.key && checkoutStyles.paymentLabelActive]}>
                {p.label}
              </Text>
              {paymentMethod === p.key && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.primary} style={{ marginLeft: 'auto' }} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Delivery Notes */}
        <View style={checkoutStyles.section}>
          <View style={checkoutStyles.sectionHeader}>
            <Ionicons name="chatbox-outline" size={18} color={Colors.primary} />
            <Text style={checkoutStyles.sectionTitle}>Delivery Notes</Text>
          </View>
          <TextInput
            style={[checkoutStyles.input, { minHeight: 60, textAlignVertical: 'top' }]}
            placeholder="Add instructions for the rider (e.g., Gate code, floor number...)"
            value={instructions}
            onChangeText={setInstructions}
            multiline
            placeholderTextColor={Colors.muted}
          />
        </View>

        {/* Place Order */}
        <TouchableOpacity
          style={[checkoutStyles.placeBtn, placing && { opacity: 0.6 }]}
          onPress={handlePlace}
          disabled={placing}
        >
          <Text style={checkoutStyles.placeBtnText}>
            {placing ? 'Placing Order...' : 'Place Order'}
          </Text>
        </TouchableOpacity>

        <Text style={checkoutStyles.secureText}>SECURE PAYMENT POWERED BY FOODIEPAY</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: NAV_COLOR,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: NAV_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    paddingTop: 4,
  },
  headerLogo: {
    fontSize: 18,
    fontFamily: Fonts.brandBlack,
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 20,
  },
  emptyTitle: {
    fontFamily: Fonts.brandBlack,
    fontSize: 22,
    color: Colors.dark,
  },
  emptySubtext: {
    fontFamily: Fonts.brand,
    fontSize: 14,
    color: Colors.muted,
  },
  browseBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  browseBtnText: {
    fontFamily: Fonts.brandBold,
    fontSize: 14,
    color: '#fff',
  },
  body: {
    flex: 1,
    backgroundColor: '#fff',
  },
  bodyContent: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontFamily: Fonts.brandBlack,
    fontSize: 28,
    color: Colors.dark,
    marginBottom: 4,
  },
  restaurantLabel: {
    fontFamily: Fonts.brand,
    fontSize: 13,
    color: Colors.muted,
    marginBottom: 20,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontFamily: Fonts.brandBold,
    fontSize: 15,
    color: Colors.dark,
  },
  cartItemSub: {
    fontFamily: Fonts.brand,
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  cartItemPrice: {
    fontFamily: Fonts.brandBold,
    fontSize: 14,
    color: Colors.primary,
    marginTop: 4,
  },
  removeBtn: {
    padding: 8,
    marginRight: 8,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  qtyBtn: {
    padding: 6,
  },
  qtyText: {
    fontFamily: Fonts.brandBold,
    fontSize: 14,
    color: Colors.dark,
    minWidth: 24,
    textAlign: 'center',
  },
  priceCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priceLabel: {
    fontFamily: Fonts.brand,
    fontSize: 14,
    color: Colors.muted,
  },
  priceValue: {
    fontFamily: Fonts.brandBold,
    fontSize: 14,
    color: Colors.dark,
  },
  priceDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginVertical: 10,
  },
  totalLabel: {
    fontFamily: Fonts.brandBold,
    fontSize: 16,
    color: Colors.dark,
  },
  totalValue: {
    fontFamily: Fonts.brandBlack,
    fontSize: 20,
    color: Colors.primary,
  },
  checkoutBar: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  checkoutBtnText: {
    fontFamily: Fonts.brandBold,
    fontSize: 16,
    color: '#fff',
  },
});

const checkoutStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: NAV_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingTop: 50,
  },
  headerLogo: {
    fontSize: 18,
    fontFamily: Fonts.brandBlack,
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontFamily: Fonts.brandBlack,
    fontSize: 28,
    color: Colors.dark,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: Fonts.brand,
    fontSize: 14,
    color: Colors.muted,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: Fonts.brandBold,
    fontSize: 16,
    color: Colors.dark,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: Fonts.brand,
    fontSize: 14,
    color: Colors.dark,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 8,
  },
  paymentOptionActive: {
    borderColor: Colors.dark,
    borderWidth: 2,
  },
  paymentLabel: {
    fontFamily: Fonts.brand,
    fontSize: 14,
    color: Colors.muted,
  },
  paymentLabelActive: {
    fontFamily: Fonts.brandBold,
    color: Colors.dark,
  },
  placeBtn: {
    backgroundColor: Colors.secondary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  placeBtnText: {
    fontFamily: Fonts.brandBold,
    fontSize: 16,
    color: '#fff',
  },
  secureText: {
    fontFamily: Fonts.brand,
    fontSize: 10,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: 12,
    letterSpacing: 1,
  },
});
