import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import StarRating from '@/components/atoms/Rating/StarRating';
import { customerAPI } from '@/services/api/customer.api';
import type { SubmitReviewBody } from '@/services/api/review.types';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';

const COMMENT_MAX_LENGTH = 500;

/** The parts of an order the review form needs (works with list and detail payloads). */
export interface ReviewableOrder {
  _id: string;
  orderNumber: string;
  items: Array<{ menuItem: string; name: string }>;
  deliveryPerson?: { name?: string } | string | null;
}

interface ReviewModalProps {
  visible: boolean;
  order: ReviewableOrder | null;
  onClose: () => void;
  /** Called after a successful submit, or when the order turns out to be reviewed already. */
  onSubmitted: () => void;
}

type Entry = { rating: number; comment: string; showComment: boolean };
const EMPTY_ENTRY: Entry = { rating: 0, comment: '', showComment: false };
const DELIVERY_KEY = 'delivery';

/** Distinct dishes in order-of-appearance; the same dish ordered twice is rated once. */
function distinctDishes(items: ReviewableOrder['items']) {
  const seen = new Map<string, string>();
  for (const item of items) {
    if (!seen.has(item.menuItem)) seen.set(item.menuItem, item.name);
  }
  return [...seen].map(([menuItem, name]) => ({ menuItem, name }));
}

export default function ReviewModal({ visible, order, onClose, onSubmitted }: ReviewModalProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const insets = useSafeAreaInsets();

  const dishes = useMemo(() => (order ? distinctDishes(order.items) : []), [order]);
  const hasRider = !!order?.deliveryPerson;
  const riderName =
    order && typeof order.deliveryPerson === 'object' ? order.deliveryPerson?.name : undefined;

  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [submitting, setSubmitting] = useState(false);

  // Fresh form each time the sheet opens for an order
  useEffect(() => {
    if (visible) {
      setEntries({});
      setSubmitting(false);
    }
  }, [visible, order?._id]);

  const entryFor = (key: string) => entries[key] ?? EMPTY_ENTRY;
  const update = (key: string, patch: Partial<Entry>) =>
    setEntries((prev) => ({ ...prev, [key]: { ...(prev[key] ?? EMPTY_ENTRY), ...patch } }));

  const keys = [...dishes.map((d) => d.menuItem), ...(hasRider ? [DELIVERY_KEY] : [])];
  const unrated = keys.filter((key) => entryFor(key).rating === 0).length;
  const canSubmit = !!order && keys.length > 0 && unrated === 0 && !submitting;

  const close = () => {
    if (!submitting) onClose();
  };

  const submit = async () => {
    if (!order || !canSubmit) return;

    const comment = (key: string) => entryFor(key).comment.trim() || undefined;
    const body: SubmitReviewBody = {
      items: dishes.map((d) => ({
        menuItem: d.menuItem,
        rating: entryFor(d.menuItem).rating,
        comment: comment(d.menuItem),
      })),
      ...(hasRider
        ? { delivery: { rating: entryFor(DELIVERY_KEY).rating, comment: comment(DELIVERY_KEY) } }
        : {}),
    };

    setSubmitting(true);
    try {
      await customerAPI.submitReview(order._id, body);
      onSubmitted();
    } catch (err) {
      if ((err as { status?: number }).status === 409) {
        // Reviewed already (e.g. from another device) or no longer reviewable
        Alert.alert('Review not saved', err instanceof Error ? err.message : 'Please refresh.');
        onSubmitted();
        return;
      }
      Alert.alert(
        'Could not submit review',
        err instanceof Error ? err.message : 'Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderRow = (key: string, title: string, subtitle?: string) => {
    const entry = entryFor(key);
    return (
      <View key={key} style={styles.row}>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
        <Text style={styles.rowTitle}>{title}</Text>
        <StarRating
          rating={entry.rating}
          size={30}
          readonly={false}
          onRate={(rating) => update(key, { rating })}
          label={title}
        />
        {entry.showComment ? (
          <TextInput
            style={styles.input}
            value={entry.comment}
            onChangeText={(comment) => update(key, { comment })}
            placeholder="What did you think? (optional)"
            placeholderTextColor={c.customerTextMuted}
            multiline
            maxLength={COMMENT_MAX_LENGTH}
            autoFocus
            accessibilityLabel={`Comment for ${title}`}
          />
        ) : (
          <Pressable
            onPress={() => update(key, { showComment: true })}
            style={styles.addComment}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Ionicons name="chatbubble-outline" size={14} color={c.primary} />
            <Text style={styles.addCommentText}>Add a comment</Text>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Rate your order</Text>
              {order ? <Text style={styles.subtitle}>#{order.orderNumber}</Text> : null}
            </View>
            <Pressable
              onPress={close}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={24} color={c.text} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {dishes.map((dish) => renderRow(dish.menuItem, dish.name))}
            {hasRider
              ? renderRow(DELIVERY_KEY, riderName ? `Your rider, ${riderName}` : 'Your rider', 'DELIVERY')
              : null}
          </ScrollView>

          <Text style={styles.note}>Reviews can&apos;t be edited after submitting.</Text>
          <Pressable
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            onPress={submit}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSubmit, busy: submitting }}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>
                {unrated > 0 ? `Rate ${unrated} more to submit` : 'Submit review'}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
      maxHeight: '90%',
      backgroundColor: c.customerSurface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 20,
      paddingHorizontal: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    title: {
      fontFamily: Fonts.brandBlack,
      fontSize: 20,
      color: c.text,
    },
    subtitle: {
      fontFamily: Fonts.brand,
      fontSize: 13,
      color: c.muted,
      marginTop: 2,
    },
    scroll: {
      flexGrow: 0,
    },
    scrollContent: {
      paddingBottom: 8,
    },
    row: {
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
      gap: 6,
    },
    rowSubtitle: {
      fontFamily: Fonts.brandBold,
      fontSize: 11,
      letterSpacing: 0.8,
      color: c.muted,
    },
    rowTitle: {
      fontFamily: Fonts.brandBold,
      fontSize: 16,
      color: c.text,
    },
    addComment: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingVertical: 4,
    },
    addCommentText: {
      fontFamily: Fonts.brandBold,
      fontSize: 13,
      color: c.primary,
    },
    input: {
      minHeight: 72,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      padding: 10,
      fontFamily: Fonts.brand,
      fontSize: 14,
      color: c.text,
      textAlignVertical: 'top',
    },
    note: {
      fontFamily: Fonts.brand,
      fontSize: 12,
      color: c.muted,
      textAlign: 'center',
      marginTop: 12,
      marginBottom: 10,
    },
    submitBtn: {
      backgroundColor: c.brand,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 52,
    },
    submitBtnDisabled: {
      opacity: 0.5,
    },
    submitBtnText: {
      fontFamily: Fonts.brandBold,
      fontSize: 15,
      color: '#fff',
    },
  });
}
