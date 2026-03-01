import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ProductCard from "../components/product/ProductCard";
import { useBrandProducts } from "../store/brandProduct.store";
import { cartStore } from "../store/cart.store";
import ProductSkeleton from "../components/product/ProductSkeleton";

export default function BrandProducts() {
    const { brandId = "" } = useParams();
    const [search, setSearch] = useState("");

    const {
        items,
        loading,
        nextCursor,
        fetchInitial,
        fetchMore,
    } = useBrandProducts(brandId);
    const addItem = cartStore((s) => s.addItem);
    const cartItems = cartStore((s) => s.items);

    useEffect(() => {
        fetchInitial();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [brandId]);

    const filtered = items.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <input
                type="text"
                placeholder="Search crackers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full mb-6 px-5 py-3 rounded-full border focus:ring-2 focus:ring-[var(--color-primary)]"
            />

            {loading && items.length === 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <ProductSkeleton key={i} />
                    ))}
                </div>
            )}

            {!loading && filtered.length === 0 && (
                <div className="text-center py-16 text-sm text-gray-500">
                    No products found
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {filtered.map((p) => {
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

            {nextCursor && (
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