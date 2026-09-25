import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ReviewPalette } from '@/components/molecules/ReviewCard/ReviewCard';
import { createReviewsListStyles } from '@/components/organisms/ReviewsList/ReviewsList.styles';
import { useReviewLabels } from '@/components/molecules/ReviewCard/ReviewLabels';
import type { Pagination } from '@/services/api/review.types';

interface ReviewsListProps<T extends { id: string }> {
  /** Loads one page (1-based). The screen can also read the summary from the response. */
  fetchPage: (page: number) => Promise<{ reviews: T[]; pagination: Pagination }>;
  renderReview: (review: T) => ReactElement;
  palette: ReviewPalette;
  ListHeaderComponent?: ReactElement | null;
  contentContainerStyle?: StyleProp<ViewStyle>;
  emptyMessage?: string;
}

/** Paginated, pull-to-refresh list of reviews with loading, empty and error states. */
export default function ReviewsList<T extends { id: string }>({
  fetchPage,
  renderReview,
  palette,
  ListHeaderComponent,
  contentContainerStyle,
  emptyMessage,
}: ReviewsListProps<T>) {
  const styles = useMemo(() => createReviewsListStyles(palette), [palette]);
  const labels = useReviewLabels();

  const [reviews, setReviews] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ignores responses from requests that a newer refresh has superseded
  const requestId = useRef(0);

  const loadFirstPage = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const res = await fetchPage(1);
      if (id !== requestId.current) return;
      setReviews(res.reviews);
      setPage(1);
      setPages(res.pagination.pages);
      setError(null);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err instanceof Error ? err.message : '');
    } finally {
      if (id === requestId.current) {
        setInitialLoading(false);
        setRefreshing(false);
      }
    }
  }, [fetchPage]);

  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFirstPage();
  };

  const onRetry = () => {
    setInitialLoading(true);
    setError(null);
    loadFirstPage();
  };

  const loadMore = async () => {
    if (loadingMore || refreshing || initialLoading || page >= pages) return;
    const id = requestId.current;
    setLoadingMore(true);
    try {
      const res = await fetchPage(page + 1);
      if (id !== requestId.current) return;
      setReviews((prev) => {
        // Skip rows already shown in case new reviews shifted the pages
        const seen = new Set(prev.map((r) => r.id));
        return [...prev, ...res.reviews.filter((r) => !seen.has(r.id))];
      });
      setPage(page + 1);
      setPages(res.pagination.pages);
    } catch {
      // Keep what is on screen; scrolling to the end again retries
    } finally {
      setLoadingMore(false);
    }
  };

  const renderEmpty = () => {
    if (initialLoading) {
      return (
        <View style={styles.state}>
          <ActivityIndicator color={palette.accent} />
        </View>
      );
    }
    if (error !== null) {
      return (
        <View style={styles.state}>
          <Ionicons name="alert-circle-outline" size={32} color={palette.muted} />
          <Text style={styles.stateText}>{error || labels.loadFailed}</Text>
          <Pressable style={styles.retryBtn} onPress={onRetry} accessibilityRole="button">
            <Text style={styles.retryBtnText}>{labels.retry}</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View style={styles.state}>
        <Ionicons name="star-outline" size={32} color={palette.muted} />
        <Text style={styles.stateText}>{emptyMessage ?? labels.noReviews}</Text>
      </View>
    );
  };

  return (
    <FlatList
      data={reviews}
      keyExtractor={(review) => review.id}
      renderItem={({ item }) => renderReview(item)}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={
        loadingMore ? <ActivityIndicator style={styles.footer} color={palette.accent} /> : null
      }
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.accent} />
      }
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
    />
  );
}
