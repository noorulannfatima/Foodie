import { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, Modal, Alert, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRestaurantStore, MenuItem } from '@/stores/restaurantStore';
import { Loader } from '@/components/atoms';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useAppThemeColors } from '@/constants/theme';
import { useRestaurantT } from '@/constants/restaurantStrings';
import {
  RestaurantMenuItemCard,
  AddEditMenuItemModal,
  AddCategoryModal,
} from '@/components/organisms';
import {
  MenuBuilderTitle,
  AddMenuItemCta,
  RestaurantCategoryFilterRow,
  RestaurantMenuEmptyState,
  RestaurantMenuFab,
  formatMenuCurrency,
  ALL_CATEGORIES,
} from '@/components/pages/restaurant/menu';

export default function RestaurantMenu() {
  const insets = useSafeAreaInsets();
  const c = useAppThemeColors();
  const t = useRestaurantT();
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES);
  const [addItemVisible, setAddItemVisible] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [addCategoryVisible, setAddCategoryVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const {
    menu,
    menuLoading,
    fetchMenu,
    addCategory,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleItemAvailability,
  } = useRestaurantStore();

  useEffect(() => {
    fetchMenu();
  }, []);

  const { refreshing, onRefresh } = usePullToRefresh(fetchMenu);

  const categories = menu?.categories ?? [];
  const allCategoryNames = [ALL_CATEGORIES, ...categories.map((c) => c.name)];

  const filteredItems = (menu?.items ?? []).filter((item) => {
    if (activeCategory === ALL_CATEGORIES) return true;
    return item.category === activeCategory;
  });

  const openAddItem = () => {
    setEditItem(null);
    setAddItemVisible(true);
  };

  const handleDeleteItem = (itemId: string, itemName: string) => {
    Alert.alert(t('menuDeleteTitle'), t('menuDeleteConfirm', { name: itemName }), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('menuDelete'),
        style: 'destructive',
        onPress: () => deleteMenuItem(itemId),
      },
    ]);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await addCategory({ name: newCategoryName.trim() });
      setNewCategoryName('');
      setAddCategoryVisible(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('menuAddCategoryFailed');
      Alert.alert(t('error'), message);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 8, backgroundColor: c.screenBackground },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} colors={[c.brand]} />}
        contentContainerStyle={styles.scrollContent}
      >
        <MenuBuilderTitle />

        <AddMenuItemCta onPress={openAddItem} />

        <RestaurantCategoryFilterRow
          categoryLabels={allCategoryNames}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          onPressAddCategory={() => setAddCategoryVisible(true)}
        />

        {menuLoading && !menu ? (
          <View style={styles.loadingWrap}>
            <Loader />
          </View>
        ) : filteredItems.length === 0 ? (
          <RestaurantMenuEmptyState />
        ) : (
          filteredItems.map((item) => (
            <RestaurantMenuItemCard
              key={item._id}
              item={item}
              formatPrice={formatMenuCurrency}
              onEdit={() => {
                setEditItem(item);
                setAddItemVisible(true);
              }}
              onDelete={() => handleDeleteItem(item._id, item.name)}
              onToggleAvailable={(val) => toggleItemAvailability(item._id, val)}
            />
          ))
        )}
      </ScrollView>

      <RestaurantMenuFab onPress={openAddItem} />

      <Modal visible={addItemVisible} animationType="slide" presentationStyle="pageSheet">
        <AddEditMenuItemModal
          key={editItem?._id ?? 'new-item'}
          item={editItem}
          categories={categories.map((c) => c.name)}
          onClose={() => {
            setAddItemVisible(false);
            setEditItem(null);
          }}
          onSave={async (data) => {
            try {
              if (editItem) {
                await updateMenuItem(editItem._id, data);
              } else {
                await addMenuItem(data);
              }
              setAddItemVisible(false);
              setEditItem(null);
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : t('menuSaveItemFailed');
              Alert.alert(t('error'), message);
            }
          }}
        />
      </Modal>

      <Modal visible={addCategoryVisible} transparent animationType="fade">
        <AddCategoryModal
          categoryName={newCategoryName}
          onChangeCategoryName={setNewCategoryName}
          onCancel={() => {
            setAddCategoryVisible(false);
            setNewCategoryName('');
          }}
          onAdd={handleAddCategory}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 80,
  },
  loadingWrap: {
    paddingVertical: 60,
    alignItems: 'center',
  },
});
