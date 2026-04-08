import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import { MenuItem } from '@/stores/restaurantStore';
import { MenuItemTag, Switch } from '@/components/atoms';

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
  return (
    <View style={styles.menuCard}>
      {item.image && item.image.length > 0 && (
        <Image source={{ uri: item.image[0] }} style={styles.menuCardImage} />
      )}

      <View style={styles.menuCardBody}>
        <View style={styles.menuCardTags}>
          {item.isVegetarian && <MenuItemTag label="VEG" />}
          {item.isVegan && <MenuItemTag label="VEGAN" />}
          {item.isGlutenFree && <MenuItemTag label="GF" />}
          {!item.isAvailable && <MenuItemTag label="UNAVAILABLE" variant="danger" />}
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
            <Ionicons name="time-outline" size={14} color={Colors.muted} />
            <Text style={styles.metaItemText}>{item.preparationTime}m</Text>
          </View>
          {item.calories ? (
            <View style={styles.metaItem}>
              <Ionicons name="flame-outline" size={14} color={Colors.muted} />
              <Text style={styles.metaItemText}>{item.calories} cal</Text>
            </View>
          ) : null}
          {item.spiceLevel ? (
            <View style={styles.metaItem}>
              <Text style={styles.metaItemText}>{item.spiceLevel}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.menuCardActions}>
          <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
            <Ionicons name="pencil" size={14} color={Colors.primary} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
            <Ionicons name="trash-outline" size={18} color={Colors.muted} />
          </TouchableOpacity>
          <View style={styles.availSwitch}>
            <Switch value={item.isAvailable} onValueChange={onToggleAvailable} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  menuCardImage: {
    width: '100%',
    height: 180,
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
    color: Colors.dark,
    marginBottom: 4,
  },
  menuCardPrice: {
    fontFamily: Fonts.brandBold,
    fontSize: 18,
    color: Colors.primary,
    marginBottom: 8,
  },
  menuCardDesc: {
    fontFamily: Fonts.brand,
    fontSize: 13,
    color: Colors.muted,
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
    color: Colors.muted,
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
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editBtnText: {
    fontFamily: Fonts.brandBold,
    fontSize: 13,
    color: Colors.primary,
  },
  deleteBtn: {
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  availSwitch: {
    marginLeft: 'auto',
  },
});
