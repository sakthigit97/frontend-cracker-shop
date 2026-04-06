import { useEffect, useState, useRef } from "react";
import ProductCard from "../components/product/ProductCard";
import HeroSlider from "../components/ui/HeroSlider";
import { useHomeProducts } from "../store/homeProduct.store";
import { cartStore } from "../store/cart.store";
import ProductSkeleton from "../components/product/ProductSkeleton";
import { apiFetch } from "../services/api";
import type { Product } from "../types/product";

export default function Home() {
  const { products, loading, fetchInitial, fetchMore, nextCursor } = useHomeProducts();
  const items = cartStore((s) => s.items);
  const addItem = cartStore((s) => s.addItem);
  const removeItem = cartStore((s) => s.removeItem);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchCache = useRef<Record<string, Product[]>>({});

  useEffect(() => {
    fetchInitial();
  }, []);

  useEffect(() => {
    if (search.length < 3) {
      setSearchResults([]);
      return;
    }

    if (searchCache.current[search]) {
      setSearchResults(searchCache.current[search]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);

        const res = await apiFetch(
          `/products?search=${encodeURIComponent(search)}&limit=50`
        );

        const items = res.data.items || [];
        searchCache.current[search] = items;
        setSearchResults(items);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const isSearching = search.length >= 3;
  const displayProducts = isSearching ? searchResults : products;

  return (
    <div className="space-y-6">
      <div className="px-4 pt-2">
        <HeroSlider />
      </div>

      <div className="px-4">
        <input
          type="text"
          placeholder="Search crackers (min 3 letters)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>

      <div className="px-4">
        <h2 className="text-lg font-semibold">All Products</h2>
      </div>

      {loading && products.length === 0 && !isSearching && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      )}

      {isSearching && searchLoading && (
        <p className="text-sm text-gray-500 text-center">Searching...</p>
      )}

      <div className="px-4 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 lg:gap-6">
        {displayProducts.map((product) => {
          const qty = items[product.id] || 0;

          return (
            <ProductCard
              key={product.id}
              product={product}
              quantityInCart={qty}
              onAddToCart={() => addItem(product.id, 1)}
              onIncrease={() => addItem(product.id, 1)}
              onDecrease={() => {
                if (qty === 1) removeItem(product.id);
                else addItem(product.id, -1);
              }}
            />
          );
        })}
      </div>

      {!isSearching && nextCursor && (
        <div className="flex justify-center py-6">
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