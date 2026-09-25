import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TextInput, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { customerAPI } from '@/services/api/customer.api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppThemeColors } from '@/constants/theme';
import CustomerHeader from '@/components/pages/customer/CustomerHeader';
import {
  STORAGE_KEY,
  SearchInputHeader,
  SearchLoadingRow,
  SearchResultsSection,
  SearchNoResults,
  SearchPopularCuisines,
  SearchRecentSection,
  SearchPopularChips,
  type SearchRestaurantResult,
} from '@/components/pages/customer/search';
import { formatCurrency } from '@/utils/currency';

function formatSearchCurrency(amount: number) {
  return formatCurrency(amount);
}

export default function CustomerSearch() {
  const router = useRouter();
  const c = useAppThemeColors();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchRestaurantResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {
      /* ignore */
    }
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

  const performSearch = useCallback(
    async (searchQuery: string) => {
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
    },
    [recentSearches],
  );

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

  const clearQuery = () => {
    setQuery('');
    setHasSearched(false);
    setResults([]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.customerBodyBg }]} edges={['top']}>
      <CustomerHeader />
      <View style={[styles.page, { backgroundColor: c.customerBodyBg }]}>
        <SearchInputHeader
          inputRef={inputRef}
          query={query}
          onChangeText={handleQueryChange}
          onSubmit={() => performSearch(query)}
          onClear={clearQuery}
        />

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {searching ? <SearchLoadingRow /> : null}

          {hasSearched && !searching ? (
            results.length > 0 ? (
              <SearchResultsSection
                results={results}
                formatCurrency={formatSearchCurrency}
                onSelectRestaurant={(id) => router.push(`/(customer)/restaurant/${id}`)}
              />
            ) : (
              <SearchNoResults />
            )
          ) : null}

          {!hasSearched ? (
            <>
              <SearchPopularCuisines onSelectCuisine={handleQuickSearch} />
              <SearchRecentSection
                terms={recentSearches}
                onSelectTerm={handleQuickSearch}
                onRemoveTerm={removeRecentSearch}
              />
              <SearchPopularChips onSelectTerm={handleQuickSearch} />
            </>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 40,
  },
});
