import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import StarRating from '@/components/atoms/Rating/StarRating';
import {
  createReviewCardStyles,
  type ReviewPalette,
} from '@/components/molecules/ReviewCard/ReviewCard.styles';
import {
  DEFAULT_REVIEW_LABELS,
  useReviewLabels,
  type ReviewLabels,
} from '@/components/molecules/ReviewCard/ReviewLabels';

export type { ReviewPalette };

interface ReviewCardProps {
  rating: number;
  comment?: string;
  customerFirstName: string;
  createdAt: string;
  /** Dish name for restaurants, order number for delivery persons. */
  title?: string;
  palette: ReviewPalette;
}

/** "Just now" / "5m ago" / "3h ago" / "2d ago" for the last week, then a date. */
export function formatReviewDate(iso: string, labels: ReviewLabels = DEFAULT_REVIEW_LABELS): string {
  const date = new Date(iso);
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return labels.justNow;
  if (mins < 60) return labels.minutesAgo(mins);
  const hours = Math.floor(mins / 60);
  if (hours < 24) return labels.hoursAgo(hours);
  const days = Math.floor(hours / 24);
  if (days < 7) return labels.daysAgo(days);
  return date.toLocaleDateString(labels.locale ?? [], {
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}),
  });
}

export default function ReviewCard({
  rating,
  comment,
  customerFirstName,
  createdAt,
  title,
  palette,
}: ReviewCardProps) {
  const styles = useMemo(() => createReviewCardStyles(palette), [palette]);
  const labels = useReviewLabels();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {title ? (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        ) : null}
        <StarRating rating={rating} size={14} />
      </View>
      {comment ? <Text style={styles.comment}>{comment}</Text> : null}
      <Text style={styles.meta}>
        {customerFirstName} · {formatReviewDate(createdAt, labels)}
      </Text>
    </View>
  );
}
