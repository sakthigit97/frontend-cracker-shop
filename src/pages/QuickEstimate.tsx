import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
import ProductCard from "../components/product/ProductCard";
import { useHomeProducts } from "../store/homeProduct.store";
import ProductSkeleton from "../components/product/ProductSkeleton";
import { quickEstimateStore } from "../store/quickEstimate.store";
import QuickEstimateModal from "../components/estimate/QuickEstimateModal";

export default function QuickEstimate() {
    const {
        products,
        loading,
        fetchInitial,
        fetchMore,
        nextCursor,
    } = useHomeProducts();

    const [showEstimate, setShowEstimate] =
        useState(false);
    // const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const items = quickEstimateStore((s) => s.items);
    const addItem = quickEstimateStore((s) => s.addItem);
    const removeItem = quickEstimateStore((s) => s.removeItem);

    useEffect(() => {
        fetchInitial();
    }, []);

    const isSearching = search.length >= 1;
    const displayProducts = isSearching
        ? products.filter((p) =>
            p.name.toLowerCase().includes(search.toLowerCase())
        )
        : products;

    return (
        <div className="space-y-6">
            <QuickEstimateModal
                open={showEstimate}
                onClose={() =>
                    setShowEstimate(
                        false
                    )
                }
            />
            <div className="px-4 pt-2">
                <button
                    onClick={() =>
                        setShowEstimate(
                            true
                        )
                    }
                    className="
                        fixed
                        bottom-4
                        right-4
                        z-40
                        bg-[var(--color-primary)]
                        text-white
                        px-5
                        py-3
                        rounded-full
                        shadow-lg
                    "
                >
                    View Estimate
                </button>
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
                            buttonLabel="Add To Estimate"
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