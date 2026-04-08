export const STATUS_FILTERS = ['All', 'Pending', 'Confirmed', 'Preparing', 'Ready', 'Completed'] as const;

export const NEXT_STATUS: Record<string, { label: string; status: string }> = {
  Pending: { label: 'Accept Order', status: 'Confirmed' },
  Confirmed: { label: 'Start Preparing', status: 'Preparing' },
  Preparing: { label: 'Mark Ready', status: 'Ready' },
};
