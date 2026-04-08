import { View, StyleSheet } from 'react-native';
import SkeletonBox from '@/components/atoms/SkeletonBox/SkeletonBox';

export default function HomeFeaturedSkeleton() {
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

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  body: { padding: 14, gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
});
