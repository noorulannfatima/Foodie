import { useMemo } from 'react';
import { ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppThemeColors, type AppColors } from '@/constants/theme';
import { RestaurantFilterPill } from '@/components/molecules';
import { useRestaurantT } from '@/constants/restaurantStrings';

/** Filter value meaning "no category filter"; shown as the translated "All Items". */
export const ALL_CATEGORIES = '__all__';

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
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const t = useRestaurantT();
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
          label={cat === ALL_CATEGORIES ? t('menuAllItems') : cat}
          active={activeCategory === cat}
          onPress={() => onSelectCategory(cat)}
        />
      ))}
      <TouchableOpacity
        style={styles.addCategoryPill}
        onPress={onPressAddCategory}
        accessibilityRole="button"
        accessibilityLabel={t('menuAddCategoryA11y')}
      >
        <Ionicons name="add" size={16} color={c.primary} />
      </TouchableOpacity>
    </ScrollView>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
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
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
}
