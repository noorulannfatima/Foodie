import { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { formatDeliveryCurrency } from './formatDeliveryCurrency';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PLOT_HEIGHT = 112;
const MIN_BAR = 4;

export interface WeeklyEarningsChartProps {
  /** Seven totals, Monday first. */
  days: number[];
  todayIndex: number;
}

/**
 * One-series bar chart of this week's delivered earnings. Today is brand red, other
 * days neutral. Only the selected day is labelled; tap a bar to select it.
 */
export default function WeeklyEarningsChart({ days, todayIndex }: WeeklyEarningsChartProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const [selected, setSelected] = useState(todayIndex);
  const max = Math.max(...days, 0);

  return (
    <View style={styles.card}>
      <View style={styles.readout}>
        <Text style={styles.readoutDay}>
          {selected === todayIndex ? 'Today' : DAY_LABELS[selected]}
        </Text>
        <Text style={styles.readoutValue}>{formatDeliveryCurrency(days[selected] ?? 0)}</Text>
      </View>

      <View style={styles.plot}>
        {max === 0 ? (
          <Text style={styles.emptyNote} pointerEvents="none">
            No delivered orders yet this week
          </Text>
        ) : null}
        {days.map((value, i) => {
          const future = i > todayIndex;
          const h = max > 0 && value > 0 ? Math.max(MIN_BAR, (value / max) * PLOT_HEIGHT) : MIN_BAR;
          const isToday = i === todayIndex;
          const isSelected = i === selected;
          return (
            <Pressable
              key={DAY_LABELS[i]}
              style={styles.col}
              onPress={() => setSelected(i)}
              disabled={future}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled: future }}
              accessibilityLabel={`${DAY_LABELS[i]}: ${future ? 'upcoming' : formatDeliveryCurrency(value)}`}
            >
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    { height: h },
                    isToday ? styles.barToday : future ? styles.barFuture : styles.barPast,
                    isSelected && !isToday && styles.barSelected,
                  ]}
                />
              </View>
              <Text
                style={[styles.dayLabel, isToday && styles.dayLabelToday, isSelected && styles.dayLabelSelected]}
              >
                {DAY_LABELS[i]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
    },
    readout: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    readoutDay: {
      fontFamily: Fonts.brandBold,
      fontSize: 13,
      color: c.muted,
    },
    readoutValue: {
      fontFamily: Fonts.brandBlack,
      fontSize: 20,
      color: c.text,
      fontVariant: ['tabular-nums'],
    },
    plot: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    emptyNote: {
      position: 'absolute',
      top: PLOT_HEIGHT / 2 - 10,
      left: 0,
      right: 0,
      textAlign: 'center',
      fontFamily: Fonts.brand,
      fontSize: 13,
      color: c.muted,
    },
    col: {
      flex: 1,
      alignItems: 'center',
      paddingTop: 8,
    },
    barTrack: {
      height: PLOT_HEIGHT,
      justifyContent: 'flex-end',
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      alignSelf: 'stretch',
      alignItems: 'center',
    },
    bar: {
      width: 18,
      borderTopLeftRadius: 4,
      borderTopRightRadius: 4,
    },
    barPast: {
      backgroundColor: c.isDark ? '#3A4558' : '#D5DBE3',
    },
    barFuture: {
      backgroundColor: c.border,
      opacity: 0.6,
    },
    barToday: {
      backgroundColor: c.brand,
    },
    barSelected: {
      backgroundColor: c.muted,
    },
    dayLabel: {
      marginTop: 8,
      fontFamily: Fonts.brand,
      fontSize: 11,
      color: c.muted,
    },
    dayLabelToday: {
      fontFamily: Fonts.brandBold,
      color: c.primary,
    },
    dayLabelSelected: {
      fontFamily: Fonts.brandBold,
    },
  });
}
