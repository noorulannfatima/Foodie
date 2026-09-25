/**
 * The shape of an order as a rider sees it. This is the one place that decides
 * how much customer data a rider gets: none while browsing requests, contact
 * details only while the order is theirs and active, and just a name afterwards.
 */
import { roundPKR } from '../utils/currency';

export type DeliveryViewLevel = 'request' | 'active' | 'history';

export function estDriverPayout(pricing: { deliveryFee: number; tip: number }): number {
  return roundPKR(pricing.deliveryFee * 0.6 + pricing.tip * 0.85);
}

/** Cash the rider must take at the door: the full total of an unpaid cash order, else nothing. */
export function cashToCollect(order: {
  payment?: { method?: string; status?: string };
  pricing: { total: number };
}): number {
  return order.payment?.method === 'Cash' && order.payment?.status === 'Pending' ? order.pricing.total : 0;
}

/** Restaurant coordinates as lat/lng; the schema's [0,0] default means "unknown". */
function restaurantLocation(restaurant: any): { latitude: number; longitude: number } | undefined {
  const coords = restaurant?.coordinates?.coordinates;
  if (!Array.isArray(coords) || coords.length !== 2) return undefined;
  const [longitude, latitude] = coords;
  if (!longitude && !latitude) return undefined;
  return { latitude, longitude };
}

/** A populated customer document, or null when only the id was loaded. */
function populatedCustomer(customer: any): { name: string; phone?: string } | null {
  return customer && typeof customer === 'object' && typeof customer.name === 'string' ? customer : null;
}

export function toDeliveryOrderView(o: any, level: DeliveryViewLevel) {
  const restaurant = o.restaurant;
  const addressLine =
    [restaurant?.address?.street, restaurant?.address?.city].filter(Boolean).join(', ') || 'Address on file';
  const itemsSummary = o.items
    .map((it: { name: string; quantity: number }) => `${it.quantity}x ${it.name}`)
    .join(', ');
  const { street, city, zipCode, latitude, longitude, instructions } = o.deliveryAddress ?? {};

  const base = {
    id: String(o._id),
    orderNumber: o.orderNumber,
    status: o.status,
    itemsSummary,
    items: o.items,
    estimatedPreparationTime: o.estimatedPreparationTime,
    pricing: o.pricing,
    estPayout: estDriverPayout(o.pricing),
    payment: { method: o.payment?.method, status: o.payment?.status },
    cashToCollect: cashToCollect(o),
    restaurant: restaurant
      ? {
          id: String(restaurant._id),
          name: restaurant.name,
          image: Array.isArray(restaurant.image) ? restaurant.image[0] : restaurant.logo,
          addressLine,
          location: restaurantLocation(restaurant),
        }
      : null,
    deliveryAddress: { street, city, zipCode },
  };

  if (level === 'request') return base;

  const customer = populatedCustomer(o.customer);
  if (level === 'history') {
    return { ...base, customer: customer ? { name: customer.name } : null };
  }

  return {
    ...base,
    customer: customer ? { name: customer.name, phone: customer.phone || undefined } : null,
    specialInstructions: o.specialInstructions || undefined,
    deliveryAddress: { street, city, zipCode, latitude, longitude, instructions },
  };
}
