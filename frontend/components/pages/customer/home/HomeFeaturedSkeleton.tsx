import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonBox from '@/components/atoms/SkeletonBox/SkeletonBox';
import { useAppThemeColors, type AppColors } from '@/constants/theme';

export default function HomeFeaturedSkeleton() {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <View style={styles.wrap}>
      {[1, 2].map((i) => (
        <View key={i} style={styles.card}>
          <SkeletonBox width="100%" height={190} borderRadius={0} />
          <View style={styles.body}>
            <View style={styles.row}>
              <SkeletonBox width={140} height={16} borderRadius={6} />
              <SkeletonBox width={70} height={16} borderRadius={6} />
            </View>
            <SkeletonBox width={110} height={12} borderRadius={6} />
            <View style={styles.row}>
              <SkeletonBox width={60} height={24} borderRadius={6} />
              <SkeletonBox width={80} height={24} borderRadius={6} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: 16,
      gap: 16,
    },
    card: {
      backgroundColor: c.customerSurface,
      borderRadius: 20,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: c.isDark ? 0.35 : 0.08,
      shadowRadius: 12,
      elevation: 4,
      borderWidth: c.isDark ? 1 : 0,
      borderColor: c.customerBorder,
    },
    body: {
      padding: 14,
      gap: 10,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
  });
}
