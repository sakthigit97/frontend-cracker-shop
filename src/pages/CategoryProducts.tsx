import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProductCard from "../components/product/ProductCard";
import { useCategoryProducts } from "../store/categoryProduct.store";
import { cartStore } from "../store/cart.store";
import ProductSkeleton from "../components/product/ProductSkeleton";
import EmptyState from "../components/ui/EmptyState";
import { apiFetch } from "../services/api";
import type { Product } from "../types/product";

export default function CategoryProducts() {
  const { categoryId = "" } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchCache = useRef<Record<string, Product[]>>({});

  const {
    items,
    loading,
    nextCursor,
    fetchInitial,
    fetchMore,
  } = useCategoryProducts(categoryId);

  const addItem = cartStore((s) => s.addItem);
  const cartItems = cartStore((s) => s.items);

  useEffect(() => {
    fetchInitial();
  }, [categoryId]);

  useEffect(() => {
    if (search.length < 3) {
      setSearchResults([]);
      return;
    }

    const key = search.toLowerCase().trim();
    if (searchCache.current[key]) {
      setSearchResults(searchCache.current[key]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const res = await apiFetch(
          `/products?search=${encodeURIComponent(key)}&limit=50`
        );

        const items = (res.data.items || []).filter(
          (p: Product) => p.categoryId === categoryId
        );

        searchCache.current[key] = items;

        setSearchResults(items);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, categoryId]);

  const isSearching = search.length >= 3;
  const displayProducts = isSearching ? searchResults : items;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="
          flex items-center justify-center
          w-9 h-9
          rounded-full
          bg-[var(--color-primary)]
          text-white
          shadow-sm

          hover:scale-105
          active:scale-95
          transition-all
        "
        >
          ←
        </button>

        <h1 className="text-xl md:text-2xl font-semibold text-[var(--color-primary)]">
          Category Products
        </h1>
      </div>

      <input
        type="text"
        placeholder="Search crackers..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="
          w-full mb-4
          px-5 py-3
          rounded-full
          border border-gray-300
          bg-white
          shadow-sm
          focus:ring-2 focus:ring-[var(--color-primary)]
        "
      />

      {/* NORMAL LOADING */}
      {loading && items.length === 0 && !isSearching && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      )}

      {/* SEARCH LOADING */}
      {isSearching && searchLoading && (
        <p className="text-center text-sm text-gray-500">Searching...</p>
      )}

      {/* EMPTY */}
      {!loading && displayProducts.length === 0 && (
        <EmptyState
          title="No products found"
          description="Try explore other categories."
        />
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {displayProducts.map((p) => {
          const quantityInCart = cartItems[p.id] ?? 0;

          return (
            <ProductCard
              key={p.id}
              product={p}
              quantityInCart={quantityInCart}
              onAddToCart={() => addItem(p.id, 1)}
              onIncrease={() => addItem(p.id, 1)}
              onDecrease={() => addItem(p.id, -1)}
            />
          );
        })}
      </div>

      {/* LOAD MORE ONLY WHEN NOT SEARCHING */}
      {!isSearching && nextCursor && (
        <div className="flex justify-center py-8">
          <button
            onClick={fetchMore}
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm disabled:opacity-60"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}