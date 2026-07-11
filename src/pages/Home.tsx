import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../components/product/ProductCard";
import HeroSlider from "../components/ui/HeroSlider";
import { useHomeProducts } from "../store/homeProduct.store";
import { cartStore } from "../store/cart.store";
import ProductSkeleton from "../components/product/ProductSkeleton";
import { useAuth } from "../store/auth.store";
import { useMemo } from "react";
import { usePackageStore } from "../store/package.store";

export default function Home() {
  const {
    products,
    popularProducts,
    fetchPopular,
    loading,
    fetchAll,
    fetchMore,
    nextCursor,
  } = useHomeProducts();

  const {
    bestSellingPackage,
    newArrivalPackage,
    packageProducts,
    fetchPackages,
    fetchPackageProducts,
  } = usePackageStore();

  const items = cartStore((s) => s.items);
  const addItem = cartStore((s) => s.addItem);
  const removeItem = cartStore((s) => s.removeItem);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showCartAlert, setShowCartAlert] = useState(false);
  const [prevAuth, setPrevAuth] = useState(false);
  type HomeTab =
    | "products"
    | "popular"
    | "bestSelling"
    | "newArrival";

  const [activeTab, setActiveTab] =
    useState<HomeTab>("products");

  useEffect(() => {
    fetchAll();
    fetchPopular();
    fetchPackages();
  }, []);

  useEffect(() => {
    if (bestSellingPackage) {
      fetchPackageProducts(bestSellingPackage.id);
    }

    if (newArrivalPackage) {
      fetchPackageProducts(newArrivalPackage.id);
    }
  }, [
    bestSellingPackage,
    newArrivalPackage,
    fetchPackageProducts,
  ]);

  useEffect(() => {
    const hasItems = Object.keys(items).length > 0;
    const alreadyShown = sessionStorage.getItem("cartAlertShown");

    if (!prevAuth && isAuthenticated && hasItems && !alreadyShown) {
      setShowCartAlert(true);
      sessionStorage.setItem("cartAlertShown", "true");
    }

    setPrevAuth(isAuthenticated);
  }, [isAuthenticated]);



  const bestSellingProducts =
    bestSellingPackage
      ? packageProducts[
        bestSellingPackage.id
      ]?.products ?? []
      : [];

  const newArrivalProducts =
    newArrivalPackage
      ? packageProducts[
        newArrivalPackage.id
      ]?.products ?? []
      : [];


  const isSearching = search.trim().length > 0;
  const currentProducts =
    activeTab === "products"
      ? products
      : activeTab === "popular"
        ? popularProducts
        : activeTab === "bestSelling"
          ? bestSellingProducts
          : newArrivalProducts;

  const query = search.trim().toLowerCase();
  const displayProducts = isSearching
    ? currentProducts.filter((p) =>
      (`${p.name} ${p.searchText ?? ""}`)
        .toLowerCase()
        .includes(query)
    )
    : currentProducts;

  const tabs = useMemo(() => {
    const items: {
      key: HomeTab;
      label: string;
    }[] = [];

    if (products.length > 0) {
      items.push({
        key: "products",
        label: "All Products",
      });
    }

    if (popularProducts.length > 0) {
      items.push({
        key: "popular",
        label: "🔥 Popular",
      });
    }

    if (bestSellingProducts && bestSellingProducts.length > 0) {
      items.push({
        key: "bestSelling",
        label: "⭐ Best Selling",
      });
    }

    if (newArrivalProducts && newArrivalProducts.length > 0) {
      items.push({
        key: "newArrival",
        label: "🆕 New Arrivals",
      });
    }

    return items;
  }, [
    products.length,
    popularProducts.length,
    bestSellingProducts,
    newArrivalProducts,
  ]);

  useEffect(() => {
    if (
      !tabs.some(
        (tab) => tab.key === activeTab
      ) &&
      tabs.length > 0
    ) {
      setActiveTab(tabs[0].key);
    }
  }, [tabs]);


  return (
    <div className="space-y-6">

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

      <div className="px-4">

        {tabs.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setSearch("");
                }}
                className={`
            whitespace-nowrap
            px-4
            py-2
            rounded-full
            text-sm
            font-medium
            transition-all
            border

            ${activeTab === tab.key
                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                    : "bg-white border-gray-200 hover:border-[var(--color-primary)]"
                  }
          `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <h2 className="text-lg font-semibold mb-4">
          {isSearching
            ? `Search Results (${displayProducts.length})`
            : tabs.find((t) => t.key === activeTab)?.label ??
            "All Products"}
        </h2>

        {loading &&
          activeTab === "products" &&
          products.length === 0 &&
          !isSearching && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          )}

        {(activeTab === "products" ||
          activeTab === "popular" ||
          activeTab === "bestSelling" ||
          activeTab === "newArrival") && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 lg:gap-6">
              {
                displayProducts.map((product) => {
                  const qty = items[product.id] || 0;
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      quantityInCart={qty}
                      onAddToCart={() =>
                        addItem(product.id, 1)
                      }
                      onIncrease={() =>
                        addItem(product.id, 1)
                      }
                      onDecrease={() => {
                        if (qty === 1)
                          removeItem(product.id);
                        else
                          addItem(product.id, -1);
                      }}
                    />
                  );
                })

              }
            </div>
          )}

        {!isSearching &&
          activeTab === "products" &&
          nextCursor && (
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
    </div>
  );
}