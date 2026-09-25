import Restaurant from '../models/restaurant';
import type { CustomerLanguage } from '../models/user';
import { notifyCustomer, PushMessage } from './push.service';

/** Statuses a customer hears about. The customer's own actions (placing, cancelling) are silent. */
export type NotifiedOrderStatus =
  | 'Confirmed'
  | 'Preparing'
  | 'Ready'
  | 'PickedUp'
  | 'OutForDelivery'
  | 'Delivered'
  | 'Cancelled';

type Copy = Record<NotifiedOrderStatus, { title: string; body: (restaurant: string) => string }>;

const COPY: Record<CustomerLanguage, Copy> = {
  en: {
    Confirmed: { title: 'Order confirmed', body: (r) => `${r} has accepted your order.` },
    Preparing: { title: 'Being prepared', body: (r) => `${r} is preparing your food.` },
    Ready: { title: 'Ready for pickup', body: (r) => `Your order from ${r} is ready and waiting for a rider.` },
    PickedUp: { title: 'Picked up', body: (r) => `Your rider has collected your order from ${r}.` },
    OutForDelivery: { title: 'On the way', body: () => 'Your rider is heading to you now.' },
    Delivered: { title: 'Delivered', body: (r) => `Enjoy your meal from ${r}! Tap to rate your order.` },
    Cancelled: { title: 'Order cancelled', body: (r) => `${r} couldn't take your order this time.` },
  },
  ur: {
    Confirmed: { title: 'آرڈر کنفرم ہو گیا', body: (r) => `${r} نے آپ کا آرڈر قبول کر لیا ہے۔` },
    Preparing: { title: 'تیار ہو رہا ہے', body: (r) => `${r} آپ کا کھانا تیار کر رہا ہے۔` },
    Ready: { title: 'آرڈر تیار ہے', body: (r) => `${r} سے آپ کا آرڈر تیار ہے اور رائیڈر کا منتظر ہے۔` },
    PickedUp: { title: 'آرڈر اٹھا لیا گیا', body: (r) => `رائیڈر نے ${r} سے آپ کا آرڈر لے لیا ہے۔` },
    OutForDelivery: { title: 'راستے میں ہے', body: () => 'آپ کا رائیڈر آپ کی طرف آ رہا ہے۔' },
    Delivered: { title: 'ڈیلیور ہو گیا', body: (r) => `${r} کا کھانا مزے سے کھائیں! ریٹنگ دینے کے لیے ٹیپ کریں۔` },
    Cancelled: { title: 'آرڈر منسوخ', body: (r) => `${r} اس بار آپ کا آرڈر نہیں لے سکا۔` },
  },
  es: {
    Confirmed: { title: 'Pedido confirmado', body: (r) => `${r} ha aceptado tu pedido.` },
    Preparing: { title: 'En preparación', body: (r) => `${r} está preparando tu comida.` },
    Ready: { title: 'Listo para recoger', body: (r) => `Tu pedido de ${r} está listo y espera a un repartidor.` },
    PickedUp: { title: 'Recogido', body: (r) => `Tu repartidor ha recogido tu pedido en ${r}.` },
    OutForDelivery: { title: 'En camino', body: () => 'Tu repartidor va hacia ti.' },
    Delivered: { title: 'Entregado', body: (r) => `¡Disfruta tu comida de ${r}! Toca para valorar tu pedido.` },
    Cancelled: { title: 'Pedido cancelado', body: (r) => `${r} no pudo aceptar tu pedido esta vez.` },
  },
  fr: {
    Confirmed: { title: 'Commande confirmée', body: (r) => `${r} a accepté votre commande.` },
    Preparing: { title: 'En préparation', body: (r) => `${r} prépare votre repas.` },
    Ready: { title: 'Prête', body: (r) => `Votre commande de ${r} est prête et attend un livreur.` },
    PickedUp: { title: 'Récupérée', body: (r) => `Votre livreur a récupéré votre commande chez ${r}.` },
    OutForDelivery: { title: 'En route', body: () => 'Votre livreur arrive.' },
    Delivered: { title: 'Livrée', body: (r) => `Bon appétit avec ${r} ! Touchez pour noter votre commande.` },
    Cancelled: { title: 'Commande annulée', body: (r) => `${r} n'a pas pu accepter votre commande cette fois.` },
  },
};

export function buildOrderStatusMessage(
  language: CustomerLanguage,
  status: NotifiedOrderStatus,
  restaurantName: string,
  orderId: string
): PushMessage {
  const copy = COPY[language][status];
  return {
    title: copy.title,
    body: copy.body(restaurantName),
    data: { type: 'order_status', orderId, status },
  };
}

/**
 * Tells the customer their order moved to `status`. Never throws, so callers
 * can fire and forget after the status change is saved.
 */
export async function notifyOrderStatus(
  order: { _id: unknown; customer: unknown; restaurant: unknown },
  status: NotifiedOrderStatus
): Promise<void> {
  try {
    const restaurant = await Restaurant.findById(order.restaurant).select('name').lean();
    const restaurantName = restaurant?.name ?? 'The restaurant';
    await notifyCustomer(order.customer, 'orderUpdates', (language) =>
      buildOrderStatusMessage(language, status, restaurantName, String(order._id))
    );
  } catch (error) {
    console.error(`Order status push (${status}) failed:`, error);
  }
}
