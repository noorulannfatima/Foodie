import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, StatusBar, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCartStore, CartItem } from '@/stores/cartStore';
import { customerAPI } from '@/services/api/customer.api';
import { paymentAPI } from '@/services/api/payment.api';
import { payWithSafepay } from '@/services/safepay';
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
              // 1. Create the order on the backend in "Pending" payment state.
              const result = await customerAPI.createOrder(data);
              const order = result.order;

              // 2. Branch on payment method. Both branches refresh the cart and
              //    bounce the user back to the home screen on success.
              if (data.paymentMethod === 'Safepay') {
                // Online payment via Safepay's hosted checkout. Closes the
                // checkout sheet first so the in-app browser can take over.
                setCheckoutVisible(false);
                const outcome = await payWithSafepay(order._id);
                await useCartStore.getState().fetchCart();

                if (outcome.kind === 'success') {
                  Alert.alert(
                    'Payment Successful',
                    `Order #${order.orderNumber} confirmed and paid via Safepay.`,
                    [{ text: 'OK', onPress: () => router.push('/(customer)/(tabs)/home') }]
                  );
                } else if (outcome.kind === 'pending') {
                  Alert.alert(
                    'Payment Pending',
                    `Order #${order.orderNumber} was placed. We'll confirm payment shortly.`,
                    [{ text: 'OK', onPress: () => router.push('/(customer)/(tabs)/home') }]
                  );
                } else if (outcome.kind === 'cancelled') {
                  Alert.alert(
                    'Payment Cancelled',
                    `Order #${order.orderNumber} is awaiting payment. You can retry from your orders.`
                  );
                } else {
                  Alert.alert(
                    'Payment Failed',
                    outcome.reason
                      ? `Safepay reported: ${outcome.reason}.`
                      : 'Your payment did not go through.'
                  );
                }
                return;
              }

              // Cash on Delivery — confirm with the backend, no provider involved.
              await paymentAPI.confirmCashOnDelivery(order._id);
              setCheckoutVisible(false);
              await useCartStore.getState().fetchCart();
              Alert.alert(
                'Order Placed!',
                `Your order #${order.orderNumber} has been placed. Pay the rider on delivery.`,
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
