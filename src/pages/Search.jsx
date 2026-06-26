import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Apple } from "lucide-react";
import SearchBar from "../components/SearchBar";
import SearchResults from "../components/SearchResults";
import CategorySuggestion from "../components/CategorySuggestion";
import SearchHistory from "../components/SearchHistory";
import { useCategories } from "../hooks/useCategories";
import { useProducts } from "../hooks/useProducts";
import { useSearch } from "../hooks/useSearch";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import ButtonPrimary from "../components/ButtonPrimary";

export default function Search() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHistory, setSearchHistory] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const { data: categoriesRes } = useCategories();
  const categories = categoriesRes?.data || [];

  const [debouncedQuery, setDebouncedQuery] = useState("");
  const { data: searchRes, isFetching } = useSearch(debouncedQuery);

  const { data: categoryProductsRes, isFetching: catLoading } = useProducts(
    selectedCategory ? { categoryId: selectedCategory.id } : {}
  );

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
        handleCategoryClick(category);
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
    setSelectedCategory(null);
    setSearchQuery(query);
    setDebouncedQuery(query);
    if (query.trim()) {
      setHasSearched(true);
      saveToHistory(query);
    }
  };

  const handleCategoryClick = (category) => {
    setSearchQuery("");
    setDebouncedQuery("");
    setHasSearched(false);
    setSelectedCategory(category);
  };

  const handleSearchSubmit = () => {
    handleSearch(searchQuery);
  };

  const handleHistoryClick = (query) => {
    setSelectedCategory(null);
    setSearchQuery(query);
    setDebouncedQuery(query);
    setHasSearched(true);
    saveToHistory(query);
  };

  const handleAddToCart = async (product) => {
    if (!user) {
      navigate("/login");
      return;
    }
    setAddingId(product.id);
    try {
      await addToCart(product);
      setAddingId(null);
    } catch {
      setAddingId(null);
    }
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("searchHistory");
  };

  const results = buildResults();
  const showResults = hasSearched && debouncedQuery.trim().length > 0;
  const categoryProducts = categoryProductsRes?.data || [];

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

      {selectedCategory && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedCategory(null)}
              className="font-apple-body text-[15px] text-[#0066cc] hover:underline"
            >
              &larr; Todas las categorías
            </button>
          </div>

          <h2 className="font-apple-display text-[34px] font-semibold leading-[1.47] tracking-[-0.374px] text-[#1d1d1f]">
            {selectedCategory.name}
          </h2>

          {catLoading ? (
            <p className="font-apple-body text-[15px] text-[#7a7a7a]" role="status" aria-live="polite">Cargando productos&hellip;</p>
          ) : categoryProducts.length === 0 ? (
            <p className="font-apple-body text-[15px] text-[#7a7a7a]">No hay productos en esta categor&iacute;a</p>
          ) : (
            <div className="space-y-3">
              {categoryProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white border border-[#e0e0e0] p-[20px] rounded-[18px] flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#f5f5f7] rounded-full flex items-center justify-center">
                      <Apple size={24} className="text-[#1d1d1f]" />
                    </div>
                    <div>
                      <h3 className="font-apple-display text-[22px] font-semibold leading-[1.14] tracking-[0.154px] text-[#1d1d1f]">
                        {product.name}
                      </h3>
                      <p className="font-apple-body text-[15px] text-[#7a7a7a]">
                        {product.price.toLocaleString()} FCFA/{product.unit}
                        {product.market && <span> &middot; {product.market.name}</span>}
                      </p>
                    </div>
                  </div>
                  <ButtonPrimary onClick={() => handleAddToCart(product)} disabled={addingId === product.id}>
                    {addingId === product.id ? "\u2026" : "Agregar"}
                  </ButtonPrimary>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!selectedCategory && (
        <>
          {isFetching && showResults && (
            <p className="text-[#7a7a7a] font-apple-body" role="status" aria-live="polite">Buscando&hellip;</p>
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
              <CategorySuggestion
                categories={categories}
                onCategoryClick={handleCategoryClick}
                onSearchClick={handleSearch}
              />
            </>
          ) : (
            !isFetching && <SearchResults results={results} searchQuery={searchQuery} />
          )}
        </>
      )}
    </div>
  );
}
