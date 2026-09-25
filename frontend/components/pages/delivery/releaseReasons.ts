import type { DeliveryReleaseReason } from '@/services/api/delivery.api';

/** Must match RELEASE_REASONS in backend/src/controllers/delivery.controller.ts. */
export const RELEASE_REASON_OPTIONS: Array<{ value: DeliveryReleaseReason; label: string }> = [
  { value: 'vehicle_issue', label: 'Vehicle issue' },
  { value: 'too_far', label: 'Too far away' },
  { value: 'restaurant_delay', label: 'Restaurant is taking too long' },
  { value: 'personal', label: 'Personal reason' },
  { value: 'other', label: 'Something else' },
];
