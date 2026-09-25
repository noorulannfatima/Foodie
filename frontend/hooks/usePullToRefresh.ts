import { useCallback, useState } from 'react';

/**
 * Spinner state for a RefreshControl that only shows while the user's own
 * pull-to-refresh is running. Background refetches (focus, filter changes)
 * should not drive it, or a second spinner appears next to the page loader.
 */
export function usePullToRefresh(refresh: () => Promise<unknown> | unknown) {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);
  return { refreshing, onRefresh };
}
