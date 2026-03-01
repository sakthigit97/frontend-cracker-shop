import { useEffect, useState } from "react";
import CategoryCard from "../components/product/CategoryCard";
import { useCatalog } from "../store/catalog.store";
import ProductSkeleton from "../components/product/ProductSkeleton";

type TabType = "category" | "brand";

export default function Products() {
  const [activeTab, setActiveTab] = useState<TabType>("category");

  const {
    categories,
    brands,
    loadingCategory,
    loadingBrand,
    fetchCategories,
    fetchBrands,
  } = useCatalog();

  useEffect(() => {
    if (activeTab === "category") {
      fetchCategories();
    } else {
      fetchBrands();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const items = activeTab === "category" ? categories : brands;
  const loading = activeTab === "category" ? loadingCategory : loadingBrand;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Title */}
      <h1 className="text-2xl font-bold mb-6">
        Shop by {activeTab === "category" ? "Category" : "Brand"}
      </h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab("category")}
          className={`pb-2 text-sm font-semibold ${activeTab === "category"
            ? "border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]"
            : "text-[var(--color-muted)]"
            }`}
        >
          Categories
        </button>

        <button
          onClick={() => setActiveTab("brand")}
          className={`pb-2 text-sm font-semibold ${activeTab === "brand"
            ? "border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]"
            : "text-[var(--color-muted)]"
            }`}
        >
          Brands
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && items.length === 0 && (
        <div className="text-center py-14 text-sm text-[var(--color-muted)]">
          No {activeTab}s available
        </div>
      )}

      {/* Grid */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {items.map((item) => (
            <CategoryCard
              key={item.id}
              id={item.id}
              name={item.name}
              image={item.image}
              type={activeTab}
            />
          ))}
        </div>
      )}
    </div>
  );
}