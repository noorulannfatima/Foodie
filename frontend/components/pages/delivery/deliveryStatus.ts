import { ORDER_STATUS_COLORS } from '@/components/pages/restaurant/shared/orderStatus';

export type NextDeliveryStatus = 'PickedUp' | 'OutForDelivery' | 'Delivered';

/** Where the courier is in the run, the next status to send, and the button that sends it. */
export function getDeliveryStep(status: string): {
  label: string;
  tint: string;
  next: NextDeliveryStatus | null;
  actionLabel: string;
  headingToCustomer: boolean;
} {
  if (status === 'PickedUp') {
    return {
      label: 'Picked up',
      tint: ORDER_STATUS_COLORS.PickedUp,
      next: 'OutForDelivery',
      actionLabel: 'Start delivery',
      headingToCustomer: true,
    };
  }
  if (status === 'OutForDelivery') {
    return {
      label: 'On the way',
      tint: ORDER_STATUS_COLORS.Confirmed,
      next: 'Delivered',
      actionLabel: 'Mark delivered',
      headingToCustomer: true,
    };
  }
  if (status === 'Ready') {
    return {
      label: 'Ready for pickup',
      tint: ORDER_STATUS_COLORS.Ready,
      next: 'PickedUp',
      actionLabel: 'Mark picked up',
      headingToCustomer: false,
    };
  }
  // Confirmed / Preparing: pickup unlocks once the restaurant marks it ready
  return {
    label: 'Being prepared',
    tint: ORDER_STATUS_COLORS.Preparing,
    next: null,
    actionLabel: 'Waiting for restaurant',
    headingToCustomer: false,
  };
}

/** The rider is assigned but the food isn't ready to collect yet. */
export function isAwaitingPickup(status: string): boolean {
  return status === 'Confirmed' || status === 'Preparing';
}
