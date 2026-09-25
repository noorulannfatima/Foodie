import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCartStore, CartItem } from '@/stores/cartStore';
import { customerAPI, type CartSuggestions } from '@/services/api/customer.api';
import { paymentAPI } from '@/services/api/payment.api';
import { payWithSafepay } from '@/services/safepay';
import { Loader } from '@/components/atoms';
import { useAppThemeColors } from '@/constants/theme';
import { useCustomerT } from '@/stores/customerPreferencesStore';
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
  const t = useCustomerT();
  // Header has no bar of its own; the safe area and body share the page color
  // so the screen reads as one surface in both light and dark mode.
  const safe = [styles.safe, { backgroundColor: customerHeaderBg(c, 'page') }];

  useEffect(() => {
    fetchCart();
  }, []);

  // Empty-cart ideas: last order + what others order. Refetched on each visit
  // while the cart is empty, and right after checkout empties it.
  const isEmpty = !cart || cart.items.length === 0;
  const [suggestions, setSuggestions] = useState<CartSuggestions | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [reordering, setReordering] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!isEmpty) return;
      let active = true;
      setSuggestionsLoading(true);
      customerAPI
        .getCartSuggestions()
        .then((data) => active && setSuggestions(data))
        .catch(() => {
          // Suggestions are optional; the plain empty state still works.
        })
        .finally(() => active && setSuggestionsLoading(false));
      return () => {
        active = false;
      };
    }, [isEmpty])
  );

  const handleReorder = async (orderId: string) => {
    setReordering(true);
    try {
      const result = await customerAPI.reorder(orderId);
      useCartStore.setState({ cart: result.cart });
      if (result.skipped?.length) {
        Alert.alert(t('someItemsUnavailable'), t('notAdded', { items: result.skipped.join(', ') }));
      }
    } catch (err: unknown) {
      Alert.alert(t('reorderFailed'), err instanceof Error ? err.message : t('pleaseTryAgain'));
    } finally {
      setReordering(false);
    }
  };

  const handleQuantityChange = (item: CartItem, delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      Alert.alert(t('removeItem'), t('removeItemConfirm', { name: item.name }), [
        { text: t('cancel'), style: 'cancel' },
        { text: t('remove'), style: 'destructive', onPress: () => removeItem(item._id) },
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
        <CartEmptyState
          onBrowseRestaurants={() => router.push('/(customer)/(tabs)/home')}
          suggestions={suggestions}
          suggestionsLoading={suggestionsLoading}
          reordering={reordering}
          onReorder={handleReorder}
          onOpenOrder={(id) => router.push({ pathname: '/(customer)/order/[id]', params: { id } })}
          onPopularItemPress={(item) =>
            router.push({
              pathname: '/(customer)/dish/[itemId]',
              params: { itemId: item.menuItem, restaurantId: item.restaurant._id },
            })
          }
        />
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
          Alert.alert(t('clearCart'), t('clearCartConfirm'), [
            { text: t('cancel'), style: 'cancel' },
            { text: t('clear'), style: 'destructive', onPress: clearCart },
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
                Alert.alert(title, `${message}\n\n${t('orderNotPlacedCartRestored')}`);
              } else {
                Alert.alert(title, `${message}\n\n${t('orderNotUndone', { number: placedOrder.orderNumber })}`, [
                  {
                    text: t('viewOrder'),
                    onPress: () =>
                      router.push({
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
                    t('paymentSuccessful'),
                    t('paymentSuccessfulMessage', { number: order.orderNumber }),
                    [
                      {
                        text: t('ok'),
                        onPress: () =>
                          router.push({
                            pathname: '/(customer)/order/[id]',
                            params: { id: order._id },
                          }),
                      },
                    ]
                  );
                } else if (outcome.kind === 'pending') {
                  Alert.alert(
                    t('paymentPending'),
                    t('paymentPendingMessage', { number: order.orderNumber }),
                    [
                      {
                        text: t('ok'),
                        onPress: () =>
                          router.push({
                            pathname: '/(customer)/order/[id]',
                            params: { id: order._id },
                          }),
                      },
                    ]
                  );
                } else if (outcome.kind === 'cancelled') {
                  await undoCheckout(t('paymentCancelled'), t('paymentCancelledMessage'));
                } else {
                  await undoCheckout(
                    t('paymentFailed'),
                    outcome.reason
                      ? t('paymentFailedReason', { reason: outcome.reason })
                      : t('paymentFailedMessage')
                  );
                }
                return;
              }

              // Cash on Delivery — confirm with the backend, no provider involved.
              await paymentAPI.confirmCashOnDelivery(order._id);
              setCheckoutVisible(false);
              await useCartStore.getState().fetchCart();
              Alert.alert(
                t('orderPlaced'),
                t('orderPlacedCashMessage', { number: order.orderNumber }),
                [
                  {
                    text: t('ok'),
                    onPress: () =>
                      router.push({
                        pathname: '/(customer)/order/[id]',
                        params: { id: order._id },
                      }),
                  },
                ]
              );
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : t('placeOrderFailed');
              if (!order) {
                Alert.alert(t('error'), message);
                return;
              }
              await undoCheckout(t('checkoutFailed'), message);
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
