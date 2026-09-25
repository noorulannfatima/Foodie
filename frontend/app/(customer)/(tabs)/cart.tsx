import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCartStore, CartItem } from '@/stores/cartStore';
import { customerAPI } from '@/services/api/customer.api';
import { paymentAPI } from '@/services/api/payment.api';
import { payWithSafepay } from '@/services/safepay';
import { Loader } from '@/components/atoms';
import { useAppThemeColors } from '@/constants/theme';
import { customerHeaderBg } from '@/components/pages/customer/CustomerHeader';
import {
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
  const c = useAppThemeColors();
  // Header has no bar of its own; the safe area and body share the page color
  // so the screen reads as one surface in both light and dark mode.
  const safe = [styles.safe, { backgroundColor: customerHeaderBg(c, 'page') }];

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
      <SafeAreaView style={safe} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Loader />
        </View>
      </SafeAreaView>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <SafeAreaView style={safe} edges={['top']}>
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
    <SafeAreaView style={safe} edges={['top']}>

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
        <CartScreenHeading
          restaurantName={cart.restaurant?.name}
          itemCount={cart.items.reduce((n, i) => n + i.quantity, 0)}
        />

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

      <CartCheckoutBar
        total={formatCartCurrency(totalAmt)}
        onCheckout={() => setCheckoutVisible(true)}
      />

      <Modal visible={checkoutVisible} animationType="slide" presentationStyle="pageSheet">
        <CheckoutModal
          onClose={() => setCheckoutVisible(false)}
          onPlaceOrder={async (data) => {
            // Set once the backend has created the order. From that point the
            // server cart is closed, so if any later step fails we undo the
            // whole checkout: cancel the order and restore the cart.
            let order: any = null;

            const undoCheckout = async (title: string, message: string) => {
              const placedOrder = order;
              setCheckoutVisible(false);
              try {
                await customerAPI.rollbackOrder(placedOrder._id, message);
              } catch {
                // Already rolled back server-side, or no longer undoable —
                // the cart refresh below tells us which.
              }
              await useCartStore.getState().fetchCart();
              const restored = (useCartStore.getState().cart?.items.length ?? 0) > 0;
              if (restored) {
                Alert.alert(title, `${message}\n\nYour order was not placed and your cart has been restored.`);
              } else {
                Alert.alert(title, `${message}\n\nOrder #${placedOrder.orderNumber} could not be undone.`, [
                  {
                    text: 'View Order',
                    onPress: () =>
                      router.replace({
                        pathname: '/(customer)/order/[id]',
                        params: { id: placedOrder._id },
                      }),
                  },
                ]);
              }
            };
            try {
              // 1. Create the order on the backend in "Pending" payment state.
              const result = await customerAPI.createOrder(data);
              order = result.order;

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
                    [
                      {
                        text: 'OK',
                        onPress: () =>
                          router.replace({
                            pathname: '/(customer)/order/[id]',
                            params: { id: order._id },
                          }),
                      },
                    ]
                  );
                } else if (outcome.kind === 'pending') {
                  Alert.alert(
                    'Payment Pending',
                    `Order #${order.orderNumber} was placed. We'll confirm payment shortly.`,
                    [
                      {
                        text: 'OK',
                        onPress: () =>
                          router.replace({
                            pathname: '/(customer)/order/[id]',
                            params: { id: order._id },
                          }),
                      },
                    ]
                  );
                } else if (outcome.kind === 'cancelled') {
                  await undoCheckout('Payment Cancelled', 'You cancelled the payment.');
                } else {
                  await undoCheckout(
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
                [
                  {
                    text: 'OK',
                    onPress: () =>
                      router.replace({
                        pathname: '/(customer)/order/[id]',
                        params: { id: order._id },
                      }),
                  },
                ]
              );
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : 'Failed to place order';
              if (!order) {
                Alert.alert('Error', message);
                return;
              }
              await undoCheckout('Checkout Failed', message);
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 32,
  },
});
