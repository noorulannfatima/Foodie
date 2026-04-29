import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { MenuItem } from '@/stores/restaurantStore';
import { SPICE_LEVELS } from './constants';

export interface AddEditMenuItemModalProps {
  item: MenuItem | null;
  categories: string[];
  onClose: () => void;
  onSave: (data: Record<string, any>) => Promise<void>;
}

export default function AddEditMenuItemModal({
  item,
  categories,
  onClose,
  onSave,
}: AddEditMenuItemModalProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [price, setPrice] = useState(item?.price?.toString() ?? '');
  const [category, setCategory] = useState(item?.category ?? (categories[0] || ''));
  const [images, setImages] = useState<string[]>(item?.image ?? []);
  const [prepTime, setPrepTime] = useState(item?.preparationTime?.toString() ?? '15');
  const [spiceLevel, setSpiceLevel] = useState<string>(item?.spiceLevel ?? '');
  const [isVegetarian, setIsVegetarian] = useState(item?.isVegetarian ?? false);
  const [isVegan, setIsVegan] = useState(item?.isVegan ?? false);
  const [isGlutenFree, setIsGlutenFree] = useState(item?.isGlutenFree ?? false);
  const [saving, setSaving] = useState(false);
  const [pickingImage, setPickingImage] = useState(false);

  const pickImage = async () => {
    try {
      setPickingImage(true);

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        console.log('📸 Menu image selected:', asset.uri);

        // Check if max images reached
        if (images.length >= 3) {
          Alert.alert('Limit Reached', 'You can only add up to 3 images per item');
          return;
        }

        // Use the URI directly - Expo will handle it
        const imageUri = asset.uri;
        setImages([...images, imageUri]);
        console.log('🖼️ Image added. Total images:', images.length + 1);
      }
    } catch (error: any) {
      console.error('❌ Image pick error:', error);
      Alert.alert('Error', error.message || 'Failed to pick image');
    } finally {
      setPickingImage(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim() || !description.trim() || !price || !category) {
      Alert.alert('Validation', 'Please fill in name, description, price, and category.');
      return;
    }

    if (images.length === 0) {
      Alert.alert('Validation', 'Please add at least one image for the menu item.');
      return;
    }

    setSaving(true);
    try {
      console.log('📤 Saving menu item with:', {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category,
        images: images.length,
      });

      await onSave({
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category,
        image: images,
        preparationTime: parseInt(prepTime, 10) || 15,
        spiceLevel: spiceLevel || undefined,
        isVegetarian,
        isVegan,
        isGlutenFree,
      });

      console.log('✅ Menu item saved successfully');
    } catch (error: any) {
      console.error('❌ Save error:', error);
      Alert.alert('Error', error.message || 'Failed to save menu item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} disabled={saving || pickingImage}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{item ? 'Edit Item' : 'Add Item'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Images Section */}
        <View style={styles.imagesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>DISH IMAGES</Text>
            <Text style={styles.imageCount}>
              {images.length}/3
            </Text>
          </View>

          {images.length > 0 ? (
            <View style={styles.imageGrid}>
              {images.map((image, index) => (
                <View key={index} style={styles.imageCard}>
                  <Image
                    source={{ uri: image }}
                    style={styles.imagePreview}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                    disabled={saving || pickingImage}
                  >
                    <Ionicons name="trash" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}

              {images.length < 3 && (
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={pickImage}
                  disabled={saving || pickingImage}
                >
                  {pickingImage ? (
                    <ActivityIndicator color={c.primary} size="large" />
                  ) : (
                    <View style={styles.addImageContent}>
                      <Ionicons name="add" size={32} color={c.primary} />
                      <Text style={styles.addImageText}>Add Image</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={styles.imageArea}
              onPress={pickImage}
              disabled={saving || pickingImage}
            >
              {pickingImage ? (
                <ActivityIndicator color={c.primary} size="large" />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={40} color={c.primary} />
                  <Text style={styles.imageLabel}>Tap to Upload Dish Image</Text>
                  <Text style={styles.imageHint}>High-resolution JPG or PNG. Max 5MB.</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <View style={styles.proTip}>
            <View style={styles.proTipHeader}>
              <Ionicons name="bulb" size={16} color={c.primary} />
              <Text style={styles.proTipTitle}>Pro Tip</Text>
            </View>
            <Text style={styles.proTipText}>
              Items with high-quality, bright photography see a{' '}
              <Text style={styles.proTipHighlight}>24% increase</Text> in orders.
            </Text>
          </View>
        </View>

        {/* Item Details Section */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>ITEM DETAILS</Text>

          <Text style={styles.fieldLabel}>ITEM NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Truffle Infused Tagliatelle"
            value={name}
            onChangeText={setName}
            placeholderTextColor={c.muted}
            editable={!saving}
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>PRICE (RS.)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholderTextColor={c.muted}
                editable={!saving}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>PREP TIME (min)</Text>
              <TextInput
                style={styles.input}
                placeholder="15"
                value={prepTime}
                onChangeText={setPrepTime}
                keyboardType="numeric"
                placeholderTextColor={c.muted}
                editable={!saving}
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>CATEGORY</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryPicker}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.catOption, category === cat && styles.catOptionActive]}
                onPress={() => setCategory(cat)}
                disabled={saving}
              >
                <Text
                  style={[
                    styles.catOptionText,
                    category === cat && styles.catOptionTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.fieldLabel}>DESCRIPTION</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Describe the flavors, ingredients, and preparation method..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            placeholderTextColor={c.muted}
            editable={!saving}
          />

          <Text style={styles.fieldLabel}>SPICE LEVEL</Text>
          <View style={styles.optionRow}>
            {SPICE_LEVELS.map((level) => (
              <TouchableOpacity
                key={level}
                style={[styles.optionChip, spiceLevel === level && styles.optionChipActive]}
                onPress={() => setSpiceLevel(spiceLevel === level ? '' : level)}
                disabled={saving}
              >
                <Text
                  style={[
                    styles.optionChipText,
                    spiceLevel === level && styles.optionChipTextActive,
                  ]}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>DIETARY TAGS</Text>
          <View style={styles.optionRow}>
            <TouchableOpacity
              style={[styles.dietChip, isVegetarian && styles.dietChipActive]}
              onPress={() => setIsVegetarian(!isVegetarian)}
              disabled={saving}
            >
              <Text style={[styles.dietChipText, isVegetarian && styles.dietChipTextActive]}>
                Vegetarian
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dietChip, isGlutenFree && styles.dietChipActive]}
              onPress={() => setIsGlutenFree(!isGlutenFree)}
              disabled={saving}
            >
              <Text style={[styles.dietChipText, isGlutenFree && styles.dietChipTextActive]}>
                Gluten-Free
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dietChip, isVegan && styles.dietChipActive]}
              onPress={() => setIsVegan(!isVegan)}
              disabled={saving}
            >
              <Text style={[styles.dietChipText, isVegan && styles.dietChipTextActive]}>
                Vegan
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.saveBtn, (saving || pickingImage) && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving || pickingImage}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Save Item</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelLink}
          onPress={onClose}
          disabled={saving || pickingImage}
        >
          <Text style={styles.cancelLinkText}>Cancel & Discard Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(c: AppColors) {
  const catActiveBg = c.chromeDark;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    headerSpacer: {
      width: 24,
    },
    headerTitle: {
      fontFamily: Fonts.brandBlack,
      fontSize: 18,
      color: c.text,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },

    // Images Section
    imagesSection: {
      marginBottom: 28,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontFamily: Fonts.brandBlack,
      fontSize: 14,
      color: c.text,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    imageCount: {
      fontFamily: Fonts.brandBold,
      fontSize: 12,
      color: c.muted,
      backgroundColor: c.card,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },

    // Image Grid
    imageGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 16,
    },
    imageCard: {
      width: '48%',
      aspectRatio: 16 / 9,
      borderRadius: 12,
      backgroundColor: c.card,
      overflow: 'hidden',
      position: 'relative',
    },
    imagePreview: {
      width: '100%',
      height: '100%',
      borderRadius: 12,
    },
    removeImageButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: '#EF4444',
      justifyContent: 'center',
      alignItems: 'center',
    },
    addImageButton: {
      width: '48%',
      aspectRatio: 16 / 9,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.primary,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: c.isDark ? c.screenBackground : '#F0F4F8',
    },
    addImageContent: {
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
    },
    addImageText: {
      fontFamily: Fonts.brandBold,
      fontSize: 12,
      color: c.primary,
    },

    // Image Area (empty state)
    imageArea: {
      backgroundColor: c.isDark ? c.card : '#F0F4F8',
      borderRadius: 16,
      padding: 32,
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
      borderWidth: 2,
      borderColor: c.primary,
      borderStyle: 'dashed',
    },
    imageLabel: {
      fontFamily: Fonts.brandBold,
      fontSize: 15,
      color: c.text,
    },
    imageHint: {
      fontFamily: Fonts.brand,
      fontSize: 12,
      color: c.muted,
    },

    // Pro Tip
    proTip: {
      backgroundColor: c.isDark ? '#3D2E18' : '#FFF7ED',
      borderRadius: 12,
      padding: 14,
      borderLeftWidth: 4,
      borderLeftColor: c.primary,
    },
    proTipHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 6,
    },
    proTipTitle: {
      fontFamily: Fonts.brandBold,
      fontSize: 13,
      color: c.text,
    },
    proTipText: {
      fontFamily: Fonts.brand,
      fontSize: 12,
      color: c.muted,
      lineHeight: 18,
    },
    proTipHighlight: {
      color: c.primary,
      fontFamily: Fonts.brandBold,
    },

    // Details Section
    detailsSection: {
      marginBottom: 20,
    },

    fieldLabel: {
      fontFamily: Fonts.brandBold,
      fontSize: 11,
      color: c.muted,
      letterSpacing: 1,
      marginBottom: 6,
      marginTop: 12,
    },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontFamily: Fonts.brand,
      fontSize: 15,
      color: c.text,
      backgroundColor: c.card,
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
      backgroundColor: c.isDark ? c.screenBackground : '#F5F5F5',
      marginRight: 8,
    },
    catOptionActive: {
      backgroundColor: catActiveBg,
    },
    catOptionText: {
      fontFamily: Fonts.brandBold,
      fontSize: 12,
      color: c.muted,
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
      backgroundColor: c.isDark ? c.screenBackground : '#F5F5F5',
      borderWidth: 1,
      borderColor: c.border,
    },
    optionChipActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    optionChipText: {
      fontFamily: Fonts.brandBold,
      fontSize: 12,
      color: c.muted,
    },
    optionChipTextActive: {
      color: '#fff',
    },
    dietChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: c.isDark ? c.screenBackground : '#F5F5F5',
      borderWidth: 1,
      borderColor: c.border,
    },
    dietChipActive: {
      backgroundColor: '#DCFCE7',
      borderColor: '#16A34A',
    },
    dietChipText: {
      fontFamily: Fonts.brandBold,
      fontSize: 12,
      color: c.muted,
    },
    dietChipTextActive: {
      color: '#16A34A',
    },

    // Action Buttons
    saveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primary,
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
      color: c.primary,
    },
  });
}