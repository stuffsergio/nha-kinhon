import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import SearchResults from "../components/SearchResults";
import CategorySuggestion from "../components/CategorySuggestion";
import SearchHistory from "../components/SearchHistory";
import { categories } from "../data/categories";
import { products } from "../data/products";
import { markets } from "../data/markets";

export default function Search() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Load search history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("searchHistory");
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Check if category is passed from navigation
  useEffect(() => {
    if (location.state?.category) {
      const category = categories.find((c) => c.id === location.state.category);
      if (category) {
        setSearchQuery(category.name);
        performSearch(category.name);
        saveToHistory(category.name);
      }
    }
  }, [location.state]);

  const performSearch = (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const lowerQuery = query.toLowerCase();

    // Search in products
    const productResults = products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery)
    );

    // Search in markets
    const marketResults = markets.filter(
      (m) =>
        m.name.toLowerCase().includes(lowerQuery) ||
        m.location.toLowerCase().includes(lowerQuery) ||
        m.type.toLowerCase().includes(lowerQuery)
    );

    // Search in categories
    const categoryResults = categories.filter((c) =>
      c.name.toLowerCase().includes(lowerQuery)
    );

    const results = [
      ...productResults.map((p) => ({ ...p, type: "product" })),
      ...marketResults.map((m) => ({ ...m, type: "market" })),
      ...categoryResults.map((c) => ({ ...c, type: "category" })),
    ];

    setSearchResults(results);
    setHasSearched(true);
  };

  const saveToHistory = (query) => {
    if (query.trim() && !searchHistory.includes(query)) {
      const newHistory = [query, ...searchHistory].slice(0, 5);
      setSearchHistory(newHistory);
      localStorage.setItem("searchHistory", JSON.stringify(newHistory));
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    performSearch(query);
  };

  const handleSearchSubmit = () => {
    performSearch(searchQuery);
    saveToHistory(searchQuery);
  };

  const handleHistoryClick = (query) => {
    setSearchQuery(query);
    performSearch(query);
    saveToHistory(query);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("searchHistory");
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Buscar</h1>

      <SearchBar
        searchQuery={searchQuery}
        onSearch={handleSearch}
        onSearchSubmit={handleSearchSubmit}
        placeholder="Buscar productos, categorías o tiendas..."
      />

      {!hasSearched ? (
        <>
          {/* Search History */}
          {searchHistory.length > 0 && (
            <SearchHistory
              history={searchHistory}
              onHistoryClick={handleHistoryClick}
              onClearHistory={clearHistory}
            />
          )}

          {/* Category Suggestions */}
          <CategorySuggestion categories={categories} onCategoryClick={handleSearch} />
        </>
      ) : (
        <SearchResults results={searchResults} searchQuery={searchQuery} />
      )}
    </div>
  );
}
