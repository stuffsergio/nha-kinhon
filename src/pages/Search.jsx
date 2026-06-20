import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import SearchResults from "../components/SearchResults";
import CategorySuggestion from "../components/CategorySuggestion";
import SearchHistory from "../components/SearchHistory";
import { useCategories } from "../hooks/useCategories";
import { useSearch } from "../hooks/useSearch";

export default function Search() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHistory, setSearchHistory] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const { data: categoriesRes } = useCategories();
  const categories = categoriesRes?.data || [];

  const [debouncedQuery, setDebouncedQuery] = useState("");
  const { data: searchRes, isFetching } = useSearch(debouncedQuery);

  useEffect(() => {
    const savedHistory = localStorage.getItem("searchHistory");
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    if (location.state?.category) {
      const category = categories.find((c) => c.id === location.state.category);
      if (category) {
        setSearchQuery(category.name);
        setDebouncedQuery(category.name);
        saveToHistory(category.name);
      }
    }
  }, [location.state, categories]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setHasSearched(false);
    }
  }, [debouncedQuery]);

  const buildResults = useCallback(() => {
    if (!searchRes) return [];
    const results = [
      ...(searchRes.products || []).map((p) => ({ ...p, type: "product" })),
      ...(searchRes.markets || []).map((m) => ({ ...m, type: "market" })),
      ...(searchRes.categories || []).map((c) => ({
        ...c,
        type: "category",
        products: c._count?.products ? Array(c._count.products).fill(0) : [],
      })),
    ];
    return results;
  }, [searchRes]);

  const saveToHistory = (query) => {
    if (query.trim() && !searchHistory.includes(query)) {
      const newHistory = [query, ...searchHistory].slice(0, 5);
      setSearchHistory(newHistory);
      localStorage.setItem("searchHistory", JSON.stringify(newHistory));
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setDebouncedQuery(query);
    if (query.trim()) {
      setHasSearched(true);
      saveToHistory(query);
    }
  };

  const handleSearchSubmit = () => {
    handleSearch(searchQuery);
  };

  const handleHistoryClick = (query) => {
    setSearchQuery(query);
    setDebouncedQuery(query);
    setHasSearched(true);
    saveToHistory(query);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("searchHistory");
  };

  const results = buildResults();
  const showResults = hasSearched && debouncedQuery.trim().length > 0;

  return (
    <div className="w-full max-w-[980px] mx-auto py-[80px] px-6 space-y-6">
      <h1 className="font-apple-display text-[56px] font-semibold leading-[1.07] tracking-[-0.28px] text-[#1d1d1f] mb-6">
        Buscar
      </h1>

      <SearchBar
        searchQuery={searchQuery}
        onSearch={handleSearch}
        onSearchSubmit={handleSearchSubmit}
        placeholder="Buscar productos, categorías o tiendas..."
      />

      {isFetching && showResults && (
        <p className="text-[#7a7a7a] font-apple-body">Buscando...</p>
      )}

      {!showResults ? (
        <>
          {searchHistory.length > 0 && (
            <SearchHistory
              history={searchHistory}
              onHistoryClick={handleHistoryClick}
              onClearHistory={clearHistory}
            />
          )}
          <CategorySuggestion categories={categories} onCategoryClick={handleSearch} />
        </>
      ) : (
        !isFetching && <SearchResults results={results} searchQuery={searchQuery} />
      )}
    </div>
  );
}
