import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import { customerAPI } from '@/services/api/customer.api';
import { Spinner } from '@/components/atoms';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@foodie_recent_searches';

const POPULAR_CUISINES = [
  { label: 'Pizza', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=120&fit=crop' },
  { label: 'Fast Food', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&fit=crop' },
  { label: 'Burgers', image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=120&fit=crop' },
  { label: 'Desserts', image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=120&fit=crop' },
];

const POPULAR_SEARCHES = ['kfc', 'pizza', 'ice cream', 'pizza hut', '7up', 'burger', 'mcdonalds', 'dominos', 'burger king'];

interface RestaurantResult {
  _id: string;
  name: string;
  cuisineTypes: string[];
  image: string[];
  averageRating: number;
  deliveryFee: number;
  estimatedDeliveryTime: number;
}

export default function CustomerSearch() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RestaurantResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load recent searches on mount
  React.useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {}
  };

  const saveRecentSearch = async (term: string) => {
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const removeRecentSearch = async (term: string) => {
    const updated = recentSearches.filter((s) => s !== term);
    setRecentSearches(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setSearching(true);
    setHasSearched(true);
    try {
      const data = await customerAPI.search(searchQuery.trim());
      setResults(data.restaurants || []);
      saveRecentSearch(searchQuery.trim().toLowerCase());
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [recentSearches]);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(text), 400);
  };

  const handleQuickSearch = (term: string) => {
    setQuery(term);
    performSearch(term);
    Keyboard.dismiss();
  };

  const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString()}`;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Search Input */}
      <View style={styles.searchHeader}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={18} color={Colors.muted} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search for restaurants and groceries"
            placeholderTextColor={Colors.muted}
            value={query}
            onChangeText={handleQueryChange}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={() => performSearch(query)}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setHasSearched(false); setResults([]); }}>
              <Ionicons name="close-circle" size={18} color={Colors.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Loading */}
        {searching && (
          <View style={styles.loadingRow}>
            <Spinner size="small" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}

        {/* Results */}
        {hasSearched && !searching && (
          results.length > 0 ? (
            <View>
              <Text style={styles.sectionTitle}>Results ({results.length})</Text>
              {results.map((r) => (
                <TouchableOpacity
                  key={r._id}
                  style={styles.resultCard}
                  onPress={() => router.push(`/(customer)/restaurant/${r._id}`)}
                >
                  {r.image?.[0] ? (
                    <Image source={{ uri: r.image[0] }} style={styles.resultImage} />
                  ) : (
                    <View style={[styles.resultImage, styles.resultImagePlaceholder]}>
                      <Ionicons name="restaurant" size={24} color="#ccc" />
                    </View>
                  )}
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName}>{r.name}</Text>
                    <Text style={styles.resultCuisine}>{r.cuisineTypes.join(' • ')}</Text>
                    <View style={styles.resultMeta}>
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <Text style={styles.resultRating}>{r.averageRating.toFixed(1)}</Text>
                      <Text style={styles.resultDot}>•</Text>
                      <Text style={styles.resultDelivery}>
                        {r.deliveryFee === 0 ? 'Free Delivery' : formatCurrency(r.deliveryFee)}
                      </Text>
                      <Text style={styles.resultDot}>•</Text>
                      <Text style={styles.resultTime}>{r.estimatedDeliveryTime} min</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.noResults}>
              <Ionicons name="search-outline" size={48} color="#ccc" />
              <Text style={styles.noResultsTitle}>No results found</Text>
              <Text style={styles.noResultsText}>Try a different search term</Text>
            </View>
          )
        )}

        {/* Default content (when not searching) */}
        {!hasSearched && (
          <>
            {/* Popular Cuisines */}
            <Text style={styles.sectionTitle}>Popular cuisines</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cuisineRow}>
              {POPULAR_CUISINES.map((c) => (
                <TouchableOpacity key={c.label} style={styles.cuisineItem} onPress={() => handleQuickSearch(c.label)}>
                  <Image source={{ uri: c.image }} style={styles.cuisineImage} />
                  <Text style={styles.cuisineLabel}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Recent searches</Text>
                {recentSearches.map((s) => (
                  <TouchableOpacity key={s} style={styles.recentRow} onPress={() => handleQuickSearch(s)}>
                    <Ionicons name="time-outline" size={18} color={Colors.muted} />
                    <Text style={styles.recentText}>{s}</Text>
                    <TouchableOpacity onPress={() => removeRecentSearch(s)}>
                      <Ionicons name="close" size={16} color={Colors.muted} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Popular Searches */}
            <Text style={styles.sectionTitle}>Popular searches in restaurants</Text>
            <View style={styles.popularGrid}>
              {POPULAR_SEARCHES.map((s) => (
                <TouchableOpacity key={s} style={styles.popularChip} onPress={() => handleQuickSearch(s)}>
                  <Text style={styles.popularChipText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.brand,
    fontSize: 15,
    color: Colors.dark,
    padding: 0,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  loadingText: {
    fontFamily: Fonts.brand,
    fontSize: 14,
    color: Colors.muted,
  },
  sectionTitle: {
    fontFamily: Fonts.brandBold,
    fontSize: 16,
    color: Colors.dark,
    marginBottom: 12,
    marginTop: 16,
  },
  cuisineRow: {
    marginBottom: 8,
  },
  cuisineItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  cuisineImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F5F5F5',
    marginBottom: 6,
  },
  cuisineLabel: {
    fontFamily: Fonts.brand,
    fontSize: 12,
    color: Colors.dark,
    textAlign: 'center',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    gap: 12,
  },
  recentText: {
    flex: 1,
    fontFamily: Fonts.brand,
    fontSize: 15,
    color: Colors.dark,
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  popularChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  popularChipText: {
    fontFamily: Fonts.brand,
    fontSize: 13,
    color: Colors.dark,
  },
  resultCard: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    gap: 12,
  },
  resultImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  resultImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
  },
  resultName: {
    fontFamily: Fonts.brandBold,
    fontSize: 15,
    color: Colors.dark,
  },
  resultCuisine: {
    fontFamily: Fonts.brand,
    fontSize: 12,
    color: Colors.muted,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resultRating: {
    fontFamily: Fonts.brandBold,
    fontSize: 12,
    color: Colors.dark,
  },
  resultDot: {
    color: Colors.muted,
    fontSize: 10,
  },
  resultDelivery: {
    fontFamily: Fonts.brand,
    fontSize: 12,
    color: Colors.muted,
  },
  resultTime: {
    fontFamily: Fonts.brand,
    fontSize: 12,
    color: Colors.muted,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  noResultsTitle: {
    fontFamily: Fonts.brandBold,
    fontSize: 18,
    color: Colors.dark,
  },
  noResultsText: {
    fontFamily: Fonts.brand,
    fontSize: 14,
    color: Colors.muted,
  },
});
