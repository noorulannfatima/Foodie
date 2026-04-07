import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts } from '@/constants/theme';
import { useRestaurantStore, MenuItem } from '@/stores/restaurantStore';
import { Loader, Switch } from '@/components/atoms';

const SPICE_LEVELS = ['Mild', 'Medium', 'Hot', 'Extra Hot'] as const;
const DIETARY_TAGS = ['Vegetarian', 'Gluten-Free', 'Vegan', 'Spicy'] as const;

export default function RestaurantMenu() {
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState('All Items');
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

  const onRefresh = useCallback(() => {
    fetchMenu();
  }, []);

  const categories = menu?.categories ?? [];
  const allCategoryNames = ['All Items', ...categories.map((c) => c.name)];

  const filteredItems = (menu?.items ?? []).filter((item) => {
    if (activeCategory === 'All Items') return true;
    return item.category === activeCategory;
  });

  const handleDeleteItem = (itemId: string, itemName: string) => {
    Alert.alert('Delete Item', `Are you sure you want to delete "${itemName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
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
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add category');
    }
  };

  const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString()}`;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="restaurant" size={20} color={Colors.primary} />
          <Text style={styles.brand}>FOODIE</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="search" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={menuLoading} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Title */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.titleMain}>MENU <Text style={styles.titleAccent}>BUILDER</Text></Text>
            <Text style={styles.titleSub}>Manage your culinary offerings and pricing</Text>
          </View>
        </View>

        {/* Add Item Button */}
        <TouchableOpacity style={styles.addItemBtn} onPress={() => { setEditItem(null); setAddItemVisible(true); }}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addItemBtnText}>ADD NEW ITEM</Text>
        </TouchableOpacity>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryBar}
          contentContainerStyle={styles.categoryBarContent}
        >
          {allCategoryNames.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryPill, activeCategory === cat && styles.categoryPillActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.categoryPillText, activeCategory === cat && styles.categoryPillTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.addCategoryPill}
            onPress={() => setAddCategoryVisible(true)}
          >
            <Ionicons name="add" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </ScrollView>

        {/* Menu Items */}
        {menuLoading && !menu ? (
          <View style={styles.loadingWrap}><Loader /></View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={64} color={Colors.light} />
            <Text style={styles.emptyTitle}>No Menu Items</Text>
            <Text style={styles.emptySubtext}>Add your first menu item to get started.</Text>
          </View>
        ) : (
          filteredItems.map((item) => (
            <View key={item._id} style={styles.menuCard}>
              {/* Item Image */}
              {item.image && item.image.length > 0 && (
                <Image source={{ uri: item.image[0] }} style={styles.menuCardImage} />
              )}

              {/* Tags */}
              <View style={styles.menuCardBody}>
                <View style={styles.menuCardTags}>
                  {item.isVegetarian && <View style={styles.tag}><Text style={styles.tagText}>VEG</Text></View>}
                  {item.isVegan && <View style={styles.tag}><Text style={styles.tagText}>VEGAN</Text></View>}
                  {item.isGlutenFree && <View style={styles.tag}><Text style={styles.tagText}>GF</Text></View>}
                  {!item.isAvailable && <View style={[styles.tag, { backgroundColor: '#FEE2E2' }]}><Text style={[styles.tagText, { color: '#EF4444' }]}>UNAVAILABLE</Text></View>}
                </View>

                <View style={styles.menuCardRow}>
                  <View style={styles.menuCardInfo}>
                    <Text style={styles.menuCardName}>{item.name}</Text>
                    <Text style={styles.menuCardPrice}>{formatCurrency(item.discountedPrice || item.price)}</Text>
                  </View>
                </View>

                <Text style={styles.menuCardDesc} numberOfLines={3}>{item.description}</Text>

                {/* Prep time & calories */}
                <View style={styles.menuCardMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color={Colors.muted} />
                    <Text style={styles.metaItemText}>{item.preparationTime}m</Text>
                  </View>
                  {item.calories && (
                    <View style={styles.metaItem}>
                      <Ionicons name="flame-outline" size={14} color={Colors.muted} />
                      <Text style={styles.metaItemText}>{item.calories} cal</Text>
                    </View>
                  )}
                  {item.spiceLevel && (
                    <View style={styles.metaItem}>
                      <Text style={styles.metaItemText}>{item.spiceLevel}</Text>
                    </View>
                  )}
                </View>

                {/* Actions */}
                <View style={styles.menuCardActions}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => { setEditItem(item); setAddItemVisible(true); }}
                  >
                    <Ionicons name="pencil" size={14} color={Colors.primary} />
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteItem(item._id, item.name)}
                  >
                    <Ionicons name="trash-outline" size={18} color={Colors.muted} />
                  </TouchableOpacity>
                  <View style={styles.availSwitch}>
                    <Switch
                      value={item.isAvailable}
                      onValueChange={(val) => toggleItemAvailability(item._id, val)}
                    />
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: 20 }]}
        onPress={() => { setEditItem(null); setAddItemVisible(true); }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add/Edit Item Modal */}
      <Modal visible={addItemVisible} animationType="slide" presentationStyle="pageSheet">
        <AddEditItemModal
          item={editItem}
          categories={categories.map((c) => c.name)}
          onClose={() => { setAddItemVisible(false); setEditItem(null); }}
          onSave={async (data) => {
            try {
              if (editItem) {
                await updateMenuItem(editItem._id, data);
              } else {
                await addMenuItem(data);
              }
              setAddItemVisible(false);
              setEditItem(null);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to save item');
            }
          }}
        />
      </Modal>

      {/* Add Category Modal */}
      <Modal visible={addCategoryVisible} transparent animationType="fade">
        <View style={styles.categoryModalOverlay}>
          <View style={styles.categoryModalContent}>
            <Text style={styles.categoryModalTitle}>Add Category</Text>
            <TextInput
              style={styles.categoryModalInput}
              placeholder="Category name"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              autoFocus
            />
            <View style={styles.categoryModalActions}>
              <TouchableOpacity onPress={() => { setAddCategoryVisible(false); setNewCategoryName(''); }}>
                <Text style={styles.categoryModalCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.categoryModalSaveBtn} onPress={handleAddCategory}>
                <Text style={styles.categoryModalSaveText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function AddEditItemModal({
  item,
  categories,
  onClose,
  onSave,
}: {
  item: MenuItem | null;
  categories: string[];
  onClose: () => void;
  onSave: (data: Record<string, any>) => Promise<void>;
}) {
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [price, setPrice] = useState(item?.price?.toString() ?? '');
  const [category, setCategory] = useState(item?.category ?? (categories[0] || ''));
  const [imageUrl, setImageUrl] = useState(item?.image?.[0] ?? '');
  const [prepTime, setPrepTime] = useState(item?.preparationTime?.toString() ?? '15');
  const [spiceLevel, setSpiceLevel] = useState<string>(item?.spiceLevel ?? '');
  const [isVegetarian, setIsVegetarian] = useState(item?.isVegetarian ?? false);
  const [isVegan, setIsVegan] = useState(item?.isVegan ?? false);
  const [isGlutenFree, setIsGlutenFree] = useState(item?.isGlutenFree ?? false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !description.trim() || !price || !category) {
      Alert.alert('Validation', 'Please fill in name, description, price, and category.');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category,
        image: imageUrl ? [imageUrl] : [],
        preparationTime: parseInt(prepTime) || 15,
        spiceLevel: spiceLevel || undefined,
        isVegetarian,
        isVegan,
        isGlutenFree,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={modalStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={modalStyles.header}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={modalStyles.headerTitle}>{item ? 'Edit Item' : 'Add Item'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={modalStyles.content}>
        {/* Image Upload Area */}
        <View style={modalStyles.imageArea}>
          <Ionicons name="camera-outline" size={32} color={Colors.muted} />
          <Text style={modalStyles.imageLabel}>Upload Dish Image</Text>
          <Text style={modalStyles.imageHint}>High-resolution JPG or PNG. Max 5MB.</Text>
        </View>

        <View style={modalStyles.proTip}>
          <Text style={modalStyles.proTipTitle}>Pro Tip</Text>
          <Text style={modalStyles.proTipText}>
            Items with high-quality, bright photography see a <Text style={{ color: Colors.primary, fontFamily: Fonts.brandBold }}>24% increase</Text> in orders.
          </Text>
        </View>

        {/* Form Fields */}
        <Text style={modalStyles.fieldLabel}>ITEM NAME</Text>
        <TextInput
          style={modalStyles.input}
          placeholder="e.g. Truffle Infused Tagliatelle"
          value={name}
          onChangeText={setName}
          placeholderTextColor={Colors.muted}
        />

        <View style={modalStyles.row}>
          <View style={modalStyles.halfField}>
            <Text style={modalStyles.fieldLabel}>PRICE</Text>
            <TextInput
              style={modalStyles.input}
              placeholder="Rs. 0.00"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              placeholderTextColor={Colors.muted}
            />
          </View>
          <View style={modalStyles.halfField}>
            <Text style={modalStyles.fieldLabel}>CATEGORY</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={modalStyles.categoryPicker}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    modalStyles.catOption,
                    category === cat && modalStyles.catOptionActive,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[
                    modalStyles.catOptionText,
                    category === cat && modalStyles.catOptionTextActive,
                  ]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <Text style={modalStyles.fieldLabel}>DESCRIPTION</Text>
        <TextInput
          style={[modalStyles.input, modalStyles.textarea]}
          placeholder="Describe the flavors, ingredients, and preparation method..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          placeholderTextColor={Colors.muted}
        />

        <Text style={modalStyles.fieldLabel}>PREPARATION TIME (minutes)</Text>
        <TextInput
          style={modalStyles.input}
          placeholder="15"
          value={prepTime}
          onChangeText={setPrepTime}
          keyboardType="numeric"
          placeholderTextColor={Colors.muted}
        />

        <Text style={modalStyles.fieldLabel}>IMAGE URL</Text>
        <TextInput
          style={modalStyles.input}
          placeholder="https://..."
          value={imageUrl}
          onChangeText={setImageUrl}
          placeholderTextColor={Colors.muted}
          autoCapitalize="none"
        />

        {/* Spice Level */}
        <Text style={modalStyles.fieldLabel}>SPICE LEVEL</Text>
        <View style={modalStyles.optionRow}>
          {SPICE_LEVELS.map((level) => (
            <TouchableOpacity
              key={level}
              style={[modalStyles.optionChip, spiceLevel === level && modalStyles.optionChipActive]}
              onPress={() => setSpiceLevel(spiceLevel === level ? '' : level)}
            >
              <Text style={[modalStyles.optionChipText, spiceLevel === level && modalStyles.optionChipTextActive]}>
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Dietary Tags */}
        <Text style={modalStyles.fieldLabel}>DIETARY TAGS</Text>
        <View style={modalStyles.optionRow}>
          <TouchableOpacity
            style={[modalStyles.dietChip, isVegetarian && modalStyles.dietChipActive]}
            onPress={() => setIsVegetarian(!isVegetarian)}
          >
            <Text style={[modalStyles.dietChipText, isVegetarian && modalStyles.dietChipTextActive]}>Vegetarian</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[modalStyles.dietChip, isGlutenFree && modalStyles.dietChipActive]}
            onPress={() => setIsGlutenFree(!isGlutenFree)}
          >
            <Text style={[modalStyles.dietChipText, isGlutenFree && modalStyles.dietChipTextActive]}>Gluten-Free</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[modalStyles.dietChip, isVegan && modalStyles.dietChipActive]}
            onPress={() => setIsVegan(!isVegan)}
          >
            <Text style={[modalStyles.dietChipText, isVegan && modalStyles.dietChipTextActive]}>Vegan</Text>
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[modalStyles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={modalStyles.saveBtnText}>{saving ? 'Saving...' : 'Save Item'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={modalStyles.cancelLink} onPress={onClose}>
          <Text style={modalStyles.cancelLinkText}>Cancel & Discard Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.dark,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brand: {
    fontFamily: Fonts.brandBlack,
    fontSize: 20,
    color: '#fff',
    letterSpacing: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 80,
  },
  titleRow: {
    marginBottom: 16,
  },
  titleMain: {
    fontFamily: Fonts.brandBlack,
    fontSize: 26,
    color: Colors.dark,
  },
  titleAccent: {
    color: Colors.primary,
  },
  titleSub: {
    fontFamily: Fonts.brand,
    fontSize: 14,
    color: Colors.muted,
    marginTop: 4,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 16,
  },
  addItemBtnText: {
    fontFamily: Fonts.brandBold,
    fontSize: 14,
    color: '#fff',
    letterSpacing: 0.5,
  },
  categoryBar: {
    marginBottom: 20,
    maxHeight: 40,
  },
  categoryBarContent: {
    gap: 8,
    alignItems: 'center',
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryPillActive: {
    backgroundColor: Colors.dark,
    borderColor: Colors.dark,
  },
  categoryPillText: {
    fontFamily: Fonts.brandBold,
    fontSize: 13,
    color: Colors.muted,
  },
  categoryPillTextActive: {
    color: '#fff',
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
  loadingWrap: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: Fonts.brandBold,
    fontSize: 18,
    color: Colors.dark,
    marginTop: 8,
  },
  emptySubtext: {
    fontFamily: Fonts.brand,
    fontSize: 14,
    color: Colors.muted,
  },
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
  tag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontFamily: Fonts.brandBold,
    fontSize: 10,
    color: '#16A34A',
    letterSpacing: 0.5,
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
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  // Category Modal
  categoryModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  categoryModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  categoryModalTitle: {
    fontFamily: Fonts.brandBlack,
    fontSize: 20,
    color: Colors.dark,
    marginBottom: 16,
  },
  categoryModalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: Fonts.brand,
    fontSize: 15,
    color: Colors.dark,
    marginBottom: 16,
  },
  categoryModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    alignItems: 'center',
  },
  categoryModalCancel: {
    fontFamily: Fonts.brandBold,
    fontSize: 14,
    color: Colors.muted,
  },
  categoryModalSaveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  categoryModalSaveText: {
    fontFamily: Fonts.brandBold,
    fontSize: 14,
    color: '#fff',
  },
});

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontFamily: Fonts.brandBlack,
    fontSize: 18,
    color: Colors.dark,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  imageArea: {
    backgroundColor: '#F0F4F8',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E8F0',
    borderStyle: 'dashed',
  },
  imageLabel: {
    fontFamily: Fonts.brandBold,
    fontSize: 15,
    color: Colors.dark,
  },
  imageHint: {
    fontFamily: Fonts.brand,
    fontSize: 12,
    color: Colors.muted,
  },
  proTip: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  proTipTitle: {
    fontFamily: Fonts.brandBold,
    fontSize: 14,
    color: Colors.dark,
    marginBottom: 4,
  },
  proTipText: {
    fontFamily: Fonts.brand,
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 18,
  },
  fieldLabel: {
    fontFamily: Fonts.brandBold,
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: Fonts.brand,
    fontSize: 15,
    color: Colors.dark,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  categoryPicker: {
    maxHeight: 40,
  },
  catOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  catOptionActive: {
    backgroundColor: Colors.dark,
  },
  catOptionText: {
    fontFamily: Fonts.brandBold,
    fontSize: 12,
    color: Colors.muted,
  },
  catOptionTextActive: {
    color: '#fff',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  optionChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionChipText: {
    fontFamily: Fonts.brandBold,
    fontSize: 12,
    color: Colors.muted,
  },
  optionChipTextActive: {
    color: '#fff',
  },
  dietChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dietChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  dietChipText: {
    fontFamily: Fonts.brandBold,
    fontSize: 12,
    color: Colors.muted,
  },
  dietChipTextActive: {
    color: '#16A34A',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginTop: 24,
  },
  saveBtnText: {
    fontFamily: Fonts.brandBold,
    fontSize: 16,
    color: '#fff',
  },
  cancelLink: {
    alignItems: 'center',
    marginTop: 12,
  },
  cancelLinkText: {
    fontFamily: Fonts.brandBold,
    fontSize: 14,
    color: Colors.primary,
  },
});
