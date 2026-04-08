import { ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { RestaurantFilterPill } from '@/components/molecules';

export interface RestaurantCategoryFilterRowProps {
  categoryLabels: string[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  onPressAddCategory: () => void;
}

export default function RestaurantCategoryFilterRow({
  categoryLabels,
  activeCategory,
  onSelectCategory,
  onPressAddCategory,
}: RestaurantCategoryFilterRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryBar}
      contentContainerStyle={styles.categoryBarContent}
    >
      {categoryLabels.map((cat) => (
        <RestaurantFilterPill
          key={cat}
          label={cat}
          active={activeCategory === cat}
          onPress={() => onSelectCategory(cat)}
        />
      ))}
      <TouchableOpacity style={styles.addCategoryPill} onPress={onPressAddCategory}>
        <Ionicons name="add" size={16} color={Colors.primary} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  categoryBar: {
    marginBottom: 20,
    maxHeight: 40,
  },
  categoryBarContent: {
    gap: 8,
    alignItems: 'center',
  },
  addCategoryPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
