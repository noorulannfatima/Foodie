import type { Ionicons } from '@expo/vector-icons';
import type { CustomerStringKey } from '@/constants/customerStrings';

// Customer-facing progress collapses the 8-state backend lifecycle into 4 phases.
// Cancelled is rendered as a terminal alt state.
export type OrderPhase = 'placed' | 'preparing' | 'on_the_way' | 'delivered';

/** `label` is a customer string key; render it with `t(phase.label)`. */
export const ORDER_PHASES: { key: OrderPhase; label: CustomerStringKey; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'placed', label: 'phasePlaced', icon: 'receipt-outline' },
  { key: 'preparing', label: 'statusPreparing', icon: 'restaurant-outline' },
  { key: 'on_the_way', label: 'phaseOnTheWay', icon: 'bicycle-outline' },
  { key: 'delivered', label: 'statusDelivered', icon: 'checkmark-done-outline' },
];

export function phaseFor(status: string): OrderPhase | 'cancelled' {
  switch (status) {
    case 'Pending':
    case 'Confirmed':
      return 'placed';
    case 'Preparing':
    case 'Ready':
      return 'preparing';
    case 'PickedUp':
    case 'OutForDelivery':
      return 'on_the_way';
    case 'Delivered':
      return 'delivered';
    case 'Cancelled':
      return 'cancelled';
    default:
      return 'placed';
  }
}

/** Index into ORDER_PHASES, or -1 for cancelled */
export function phaseIndexFor(status: string): number {
  const phase = phaseFor(status);
  return phase === 'cancelled' ? -1 : ORDER_PHASES.findIndex((p) => p.key === phase);
}

export function isFinishedStatus(status: string): boolean {
  return status === 'Delivered' || status === 'Cancelled';
}
