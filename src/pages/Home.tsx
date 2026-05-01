import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../components/product/ProductCard";
import HeroSlider from "../components/ui/HeroSlider";
import { useHomeProducts } from "../store/homeProduct.store";
import { cartStore } from "../store/cart.store";
import ProductSkeleton from "../components/product/ProductSkeleton";
import { useAuth } from "../store/auth.store";

export default function Home() {
  const {
    products,
    popularProducts,
    fetchPopular,
    loading,
    fetchInitial,
    fetchMore,
    nextCursor,
  } = useHomeProducts();

  const items = cartStore((s) => s.items);
  const addItem = cartStore((s) => s.addItem);
  const removeItem = cartStore((s) => s.removeItem);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showCartAlert, setShowCartAlert] = useState(false);

  useEffect(() => {
    fetchInitial();
    fetchPopular();
  }, []);

  useEffect(() => {
    const hasItems = Object.keys(items).length > 0;
    const alreadyShown = sessionStorage.getItem("cartAlertShown");

    if (isAuthenticated && hasItems && !alreadyShown) {
      setShowCartAlert(true);
      sessionStorage.setItem("cartAlertShown", "true");
    }
  }, [isAuthenticated, items]);

  const isSearching = search.length >= 1;

  const displayProducts = isSearching
    ? products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    )
    : products;

  return (
    <div className="space-y-6">

      {/* Popup */}
      {showCartAlert && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[90%] max-w-sm shadow-lg text-center space-y-4">
            <h3 className="text-lg font-semibold text-[var(--color-primary)]">
              🛒 Items in your cart
            </h3>
            <p className="text-sm text-gray-600">
              You already have items in your cart.
              Please proceed to checkout before they go out of stock.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowCartAlert(false)}
                className="px-4 py-2 text-sm rounded-md border"
              >
                Later
              </button>
              <button
                onClick={() => {
                  setShowCartAlert(false);
                  navigate("/cart");
                }}
                className="px-4 py-2 text-sm rounded-md bg-[var(--color-primary)] text-white"
              >
                Go to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pt-2">
        <HeroSlider />
      </div>

      <div className="px-4">
        <input
          type="text"
          placeholder="Search crackers"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>

      {popularProducts.length > 0 && !isSearching && (
        <div className="px-4 space-y-4">
          <h2 className="text-lg font-semibold">🔥 Popular Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 lg:gap-6">
            {popularProducts.map((product) => {
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
        </div>
      )}

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