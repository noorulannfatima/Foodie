import { useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { MenuItem } from '@/stores/restaurantStore';
import { MenuItemTag, Switch } from '@/components/atoms';
import { useRestaurantT } from '@/constants/restaurantStrings';
import { spiceLevelLabel } from '../AddEditMenuItemModal/constants';

export interface RestaurantMenuItemCardProps {
  item: MenuItem;
  formatPrice: (amount: number) => string;
  onEdit: () => void;
  onDelete: () => void;
  onToggleAvailable: (value: boolean) => void;
}

export default function RestaurantMenuItemCard({
  item,
  formatPrice,
  onEdit,
  onDelete,
  onToggleAvailable,
}: RestaurantMenuItemCardProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const t = useRestaurantT();
  return (
    <View style={styles.menuCard}>
      {item.image && item.image.length > 0 && (
        <Image source={{ uri: item.image[0] }} style={styles.menuCardImage} />
      )}

      <View style={styles.menuCardBody}>
        <View style={styles.menuCardTags}>
          {item.isVegetarian && <MenuItemTag label={t('menuTagVeg')} />}
          {item.isVegan && <MenuItemTag label={t('menuTagVegan')} />}
          {item.isGlutenFree && <MenuItemTag label={t('menuTagGlutenFree')} />}
          {!item.isAvailable && <MenuItemTag label={t('menuTagUnavailable')} variant="danger" />}
        </View>

        <View style={styles.menuCardRow}>
          <View style={styles.menuCardInfo}>
            <Text style={styles.menuCardName}>{item.name}</Text>
            <Text style={styles.menuCardPrice}>{formatPrice(item.discountedPrice || item.price)}</Text>
          </View>
        </View>

        <Text style={styles.menuCardDesc} numberOfLines={3}>
          {item.description}
        </Text>

        <View style={styles.menuCardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={c.muted} />
            <Text style={styles.metaItemText}>{t('menuPrepMinutes', { count: item.preparationTime })}</Text>
          </View>
          {item.calories ? (
            <View style={styles.metaItem}>
              <Ionicons name="flame-outline" size={14} color={c.muted} />
              <Text style={styles.metaItemText}>{t('menuCalories', { count: item.calories })}</Text>
            </View>
          ) : null}
          {item.spiceLevel ? (
            <View style={styles.metaItem}>
              <Text style={styles.metaItemText}>{spiceLevelLabel(item.spiceLevel, t)}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.menuCardActions}>
          <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
            <Ionicons name="pencil" size={14} color={c.primary} />
            <Text style={styles.editBtnText}>{t('menuEdit')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel={t('menuDeleteA11y')}
          >
            <Ionicons name="trash-outline" size={18} color={c.muted} />
          </TouchableOpacity>
          <View style={styles.availSwitch}>
            <Switch value={item.isAvailable} onValueChange={onToggleAvailable} />
          </View>
        </View>
      </View>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    menuCard: {
      backgroundColor: c.card,
      borderRadius: 16,
      marginBottom: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.border,
    },
    menuCardImage: {
      width: '100%',
      // Same ratio menu photos are cropped to on upload, so nothing is cut off
      aspectRatio: 16 / 9,
      resizeMode: 'cover',
    },
    menuCardBody: {
      padding: 16,
    },
    menuCardTags: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 8,
      flexWrap: 'wrap',
    },
    menuCardRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    menuCardInfo: {
      flex: 1,
    },
    menuCardName: {
      fontFamily: Fonts.brandBlack,
      fontSize: 20,
      color: c.text,
      marginBottom: 4,
    },
    menuCardPrice: {
      fontFamily: Fonts.brandBold,
      fontSize: 18,
      color: c.primary,
      marginBottom: 8,
    },
    menuCardDesc: {
      fontFamily: Fonts.brand,
      fontSize: 13,
      color: c.muted,
      lineHeight: 18,
      marginBottom: 10,
    },
    menuCardMeta: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 12,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaItemText: {
      fontFamily: Fonts.brand,
      fontSize: 12,
      color: c.muted,
    },
    menuCardActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    editBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: c.primaryLight,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    editBtnText: {
      fontFamily: Fonts.brandBold,
      fontSize: 13,
      color: c.primary,
    },
    deleteBtn: {
      padding: 8,
      backgroundColor: c.isDark ? c.screenBackground : '#F5F5F5',
      borderRadius: 8,
    },
    availSwitch: {
      marginLeft: 'auto',
    },
  });
}
