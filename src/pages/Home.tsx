import { useEffect, useState } from "react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowUp, FaWhatsapp } from "react-icons/fa";

import ProductCard from "../components/product/ProductCard";
import HeroSlider from "../components/ui/HeroSlider";
import EmptyState from "../components/ui/EmptyState";
import { useHomeProducts } from "../store/homeProduct.store";
import { cartStore } from "../store/cart.store";
import ProductSkeleton from "../components/product/ProductSkeleton";
import { useAuth } from "../store/auth.store";
import { usePackageStore } from "../store/package.store";
import { sortProductsByCategoryAndSequence } from "../utils/sequncerUtil";
import { useCategoryProducts } from "../store/categoryProduct.store";
import { useBrandProducts } from "../store/brandProduct.store";
import { useCatalog } from "../store/catalog.store";
import WhatsAppSupport from "../components/whatsapp/WhatsAppSupport";

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
    partyPackage,
    packageProducts,
    fetchPackages,
    fetchPackageProducts,
  } = usePackageStore();

  const {
    categories,
    brands,
    fetchCategories,
    fetchBrands,
  } = useCatalog();

  const items = cartStore((s) => s.items);
  const addItem = cartStore((s) => s.addItem);
  const removeItem = cartStore((s) => s.removeItem);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showCartAlert, setShowCartAlert] = useState(false);
  const [prevAuth, setPrevAuth] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);


  type HomeTab =
    | "products"
    | "popular"
    | "bestSelling"
    | "newArrival"
    | "Party/Functions"
    | "categories"
    | "brands";

  const [activeTab, setActiveTab] = useState<HomeTab>("products");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const categoryProducts = useCategoryProducts(selectedCategoryId);
  const brandProducts = useBrandProducts(selectedBrandId);

  useEffect(() => {
    fetchAll();
    fetchPopular();
    fetchPackages();
    fetchCategories();
    fetchBrands();
  }, []);

  useEffect(() => {
    if (
      activeTab === "categories" &&
      selectedCategoryId
    ) {
      categoryProducts.fetchInitial();
    }
  }, [
    activeTab,
    selectedCategoryId,
  ]);

  useEffect(() => {
    if (
      activeTab === "brands" &&
      selectedBrandId
    ) {
      brandProducts.fetchInitial();
    }
  }, [
    activeTab,
    selectedBrandId,
  ]);

  useEffect(() => {
    if (bestSellingPackage) {
      fetchPackageProducts(bestSellingPackage.id);
    }

    if (newArrivalPackage) {
      fetchPackageProducts(newArrivalPackage.id);
    }

    if (partyPackage) {
      fetchPackageProducts(partyPackage.id);
    }


  }, [
    bestSellingPackage,
    newArrivalPackage,
    partyPackage,
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

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 350);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);


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

  const partyProducts =
    partyPackage
      ? packageProducts[
        partyPackage.id
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
          : activeTab === "newArrival"
            ? newArrivalProducts
            : activeTab === "Party/Functions"
              ? partyProducts
              : activeTab === "categories"
                ? selectedCategoryId
                  ? categoryProducts.items
                  : products
                : activeTab === "brands"
                  ? selectedBrandId
                    ? brandProducts.items
                    : products
                  : [];

  const query = search.trim().toLowerCase();
  let displayProducts = isSearching
    ? currentProducts.filter((p) =>
      (`${p.name}`)
        .toLowerCase()
        .includes(query)
    )
    : currentProducts;

  displayProducts = sortProductsByCategoryAndSequence(
    displayProducts,
    categories
  );

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

    if (partyProducts && partyProducts.length > 0) {
      items.push({
        key: "Party/Functions",
        label: "🎉 Party / Functions",
      });
    }

    items.push({
      key: "categories",
      label: "📂 Categories By Product",
    });

    items.push({
      key: "brands",
      label: "🏷 Brands By Product",
    });

    return items;
  }, [
    products.length,
    popularProducts.length,
    bestSellingProducts,
    newArrivalProducts,
    partyProducts,
  ]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const currentLoading =
    activeTab === "products"
      ? loading
      : activeTab === "categories"
        ? categoryProducts.loading
        : activeTab === "brands"
          ? brandProducts.loading
          : loading;

  const currentItems =
    activeTab === "products"
      ? products
      : activeTab === "categories"
        ? categoryProducts.items
        : activeTab === "brands"
          ? brandProducts.items
          : currentProducts;

  const currentNextCursor =
    activeTab === "products"
      ? nextCursor
      : activeTab === "categories"
        ? categoryProducts.nextCursor
        : activeTab === "brands"
          ? brandProducts.nextCursor
          : null;

  const loadMoreCurrent =
    activeTab === "products"
      ? fetchMore
      : activeTab === "categories"
        ? categoryProducts.fetchMore
        : activeTab === "brands"
          ? brandProducts.fetchMore
          : undefined;

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
                data-enter-submit="true"
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
        <div
          className="
            mt-4
            mb-2
            flex
            flex-col
            gap-3
            rounded-2xl
            border
            border-green-200
            bg-green-50
            p-4
            shadow-sm

            sm:flex-row
            sm:items-center
            sm:justify-between
        "
        >
          <div>
            <h3 className="flex items-center gap-2 text-xl font-semibold text-green-800">
              <FaWhatsapp className="text-[#25D366] text-2xl flex-shrink-0" />
              <span>Join Our WhatsApp Community</span>
            </h3>

            <p className="mt-1 text-sm text-green-700">
              Get festival offers, new arrivals, stock updates and exclusive deals.
            </p>

            <p className="mt-1 text-sm text-green-700">
              🔒 Your personal details are kept private — other community members won't see your information.
            </p>
          </div>

          <a
            href="https://chat.whatsapp.com/DLIqbz48mGNGKasf9XycgU"
            target="_blank"
            rel="noopener noreferrer"
            className="
                inline-flex
                items-center
                justify-center
                rounded-xl
                bg-[#25D366]
                px-5
                py-2.5
                text-sm
                font-semibold
                text-white
                transition
                hover:scale-105
                active:scale-95
            "
          >
            Join Now →
          </a>
        </div>
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

        {activeTab === "categories" && (
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {categories.map((category: any) => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategoryId(category.id);
                  setSearch("");
                }}
                className={`px-3 py-1.5 text-sm gap-1.5 rounded-full border whitespace-nowrap transition
          ${selectedCategoryId === category.id
                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                    : "bg-white border-gray-300"
                  }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        {activeTab === "brands" && (
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {brands.map((brand: any) => (
              <button
                key={brand.id}
                onClick={() => {
                  setSelectedBrandId(brand.id);
                  setSearch("");
                }}
                className={`px-3 py-1.5 text-sm gap-1.5 rounded-full border whitespace-nowrap transition
          ${selectedBrandId === brand.id
                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                    : "bg-white border-gray-300"
                  }`}
              >
                {brand.name}
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

        {currentLoading &&
          currentItems.length === 0 &&
          !isSearching && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          )}

        {!currentLoading &&
          displayProducts.length === 0 && (
            <EmptyState
              title="No products found"
              description="Try another category or brand."
            />
          )}

        {(activeTab === "products" ||
          activeTab === "popular" ||
          activeTab === "bestSelling" ||
          activeTab === "newArrival" ||
          activeTab === "Party/Functions" ||
          activeTab === "categories" ||
          activeTab === "brands") && (
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
          currentNextCursor && (
            <div className="flex justify-center py-6">
              <button
                onClick={() => loadMoreCurrent?.()}
                disabled={currentLoading}
                className="px-6 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm disabled:opacity-60"
              >
                {currentLoading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
      </div>
      <WhatsAppSupport />

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="
            fixed
            bottom-6
            right-6
            z-50
            flex
            h-11 
            w-11 
            md:h-12
            md:w-12
            items-center
            justify-center
            rounded-full
            bg-[var(--color-primary)]
            text-white
            shadow-lg
            transition-all
            duration-300
            hover:-translate-y-1
            hover:scale-110
            hover:shadow-2xl
            active:scale-95
          "
          aria-label="Back to Top"
        >
          <FaArrowUp size={16} />
        </button>
      )}
    </div>
  );
}