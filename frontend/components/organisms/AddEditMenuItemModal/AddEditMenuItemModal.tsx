import { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
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
        preparationTime: parseInt(prepTime, 10) || 15,
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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{item ? 'Edit Item' : 'Add Item'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imageArea}>
          <Ionicons name="camera-outline" size={32} color={Colors.muted} />
          <Text style={styles.imageLabel}>Upload Dish Image</Text>
          <Text style={styles.imageHint}>High-resolution JPG or PNG. Max 5MB.</Text>
        </View>

        <View style={styles.proTip}>
          <Text style={styles.proTipTitle}>Pro Tip</Text>
          <Text style={styles.proTipText}>
            Items with high-quality, bright photography see a{' '}
            <Text style={styles.proTipHighlight}>24% increase</Text> in orders.
          </Text>
        </View>

        <Text style={styles.fieldLabel}>ITEM NAME</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Truffle Infused Tagliatelle"
          value={name}
          onChangeText={setName}
          placeholderTextColor={Colors.muted}
        />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.fieldLabel}>PRICE</Text>
            <TextInput
              style={styles.input}
              placeholder="Rs. 0.00"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              placeholderTextColor={Colors.muted}
            />
          </View>
          <View style={styles.halfField}>
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
                >
                  <Text
                    style={[styles.catOptionText, category === cat && styles.catOptionTextActive]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <Text style={styles.fieldLabel}>DESCRIPTION</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Describe the flavors, ingredients, and preparation method..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          placeholderTextColor={Colors.muted}
        />

        <Text style={styles.fieldLabel}>PREPARATION TIME (minutes)</Text>
        <TextInput
          style={styles.input}
          placeholder="15"
          value={prepTime}
          onChangeText={setPrepTime}
          keyboardType="numeric"
          placeholderTextColor={Colors.muted}
        />

        <Text style={styles.fieldLabel}>IMAGE URL</Text>
        <TextInput
          style={styles.input}
          placeholder="https://..."
          value={imageUrl}
          onChangeText={setImageUrl}
          placeholderTextColor={Colors.muted}
          autoCapitalize="none"
        />

        <Text style={styles.fieldLabel}>SPICE LEVEL</Text>
        <View style={styles.optionRow}>
          {SPICE_LEVELS.map((level) => (
            <TouchableOpacity
              key={level}
              style={[styles.optionChip, spiceLevel === level && styles.optionChipActive]}
              onPress={() => setSpiceLevel(spiceLevel === level ? '' : level)}
            >
              <Text
                style={[styles.optionChipText, spiceLevel === level && styles.optionChipTextActive]}
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
          >
            <Text style={[styles.dietChipText, isVegetarian && styles.dietChipTextActive]}>
              Vegetarian
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dietChip, isGlutenFree && styles.dietChipActive]}
            onPress={() => setIsGlutenFree(!isGlutenFree)}
          >
            <Text style={[styles.dietChipText, isGlutenFree && styles.dietChipTextActive]}>
              Gluten-Free
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dietChip, isVegan && styles.dietChipActive]}
            onPress={() => setIsVegan(!isVegan)}
          >
            <Text style={[styles.dietChipText, isVegan && styles.dietChipTextActive]}>Vegan</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Item'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelLink} onPress={onClose}>
          <Text style={styles.cancelLinkText}>Cancel & Discard Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
  headerSpacer: {
    width: 24,
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
  proTipHighlight: {
    color: Colors.primary,
    fontFamily: Fonts.brandBold,
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
