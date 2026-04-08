import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, StatusBar, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCartStore, CartItem } from '@/stores/cartStore';
import { customerAPI } from '@/services/api/customer.api';
import { Loader } from '@/components/atoms';
import {
  NAV_COLOR,
  CartHeader,
  CartScreenHeading,
  CartEmptyState,
  CartLineItem,
  CartTotalsBreakdown,
  CartCheckoutBar,
  CheckoutModal,
  formatCartCurrency,
} from '@/components/pages/customer/cart';

export default function CustomerCart() {
  const router = useRouter();
  const { cart, loading, fetchCart, updateQuantity, removeItem, clearCart, deliveryFee, tax, total } =
    useCartStore();
  const [checkoutVisible, setCheckoutVisible] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

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
        <View style={styles.loadingContainer}>
          <Loader />
        </View>
      </SafeAreaView>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={NAV_COLOR} />
        <CartHeader />
        <CartEmptyState onBrowseRestaurants={() => router.push('/(customer)/(tabs)/home')} />
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

      <CartHeader
        showClearAction
        onClearCart={() =>
          Alert.alert('Clear Cart', 'Remove all items?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Clear', style: 'destructive', onPress: clearCart },
          ])
        }
      />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <CartScreenHeading restaurantName={cart.restaurant?.name} />

        {cart.items.map((item) => (
          <CartLineItem
            key={item._id}
            item={item}
            formatPrice={formatCartCurrency}
            onRemove={() => removeItem(item._id)}
            onDecrement={() => handleQuantityChange(item, -1)}
            onIncrement={() => handleQuantityChange(item, 1)}
          />
        ))}

        <CartTotalsBreakdown
          subtotal={subtotal}
          deliveryFee={deliveryFeeAmt}
          tax={taxAmt}
          total={totalAmt}
          formatCurrency={formatCartCurrency}
        />
      </ScrollView>

      <CartCheckoutBar onCheckout={() => setCheckoutVisible(true)} />

      <Modal visible={checkoutVisible} animationType="slide" presentationStyle="pageSheet">
        <CheckoutModal
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
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : 'Failed to place order';
              Alert.alert('Error', message);
            }
          }}
        />
      </Modal>
    </SafeAreaView>
  );
}

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
  body: {
    flex: 1,
    backgroundColor: '#fff',
  },
  bodyContent: {
    padding: 20,
    paddingBottom: 100,
  },
});
