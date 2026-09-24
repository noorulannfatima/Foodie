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
  return {
    label: status === 'Ready' ? 'Ready for pickup' : 'Being prepared',
    tint: status === 'Ready' ? ORDER_STATUS_COLORS.Ready : ORDER_STATUS_COLORS.Preparing,
    next: 'PickedUp',
    actionLabel: 'Mark picked up',
    headingToCustomer: false,
  };
}
