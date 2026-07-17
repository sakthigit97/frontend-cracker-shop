import { useEffect } from "react";
import {
    useNavigate,
    useParams,
} from "react-router-dom";

import ProductCard from "../components/product/ProductCard";
import EmptyState from "../components/ui/EmptyState";
import ProductSkeleton from "../components/product/ProductSkeleton";
import { usePackageStore } from "../store/package.store";
import { cartStore } from "../store/cart.store";

export default function ComboPackageDetails() {
    const navigate = useNavigate();

    const { packageId = "" } = useParams();


    const {
        packageProducts,
        loading,
        fetchPackageProducts,
    } = usePackageStore();

    const packageData = packageProducts[
        packageId
    ];

    const products = packageData?.products || [];
    const selectedPackage = packageData?.package;
    const items = cartStore(
        (s) => s.items
    );

    const addItem = cartStore(
        (s) => s.addItem
    );

    const removeItem = cartStore(
        (s) => s.removeItem
    );

    const handleAddEntirePackage = () => {
        if (packageAdded) return;
        const comboProductId = selectedPackage?.productId;
        if (!comboProductId) return;
        addItem(comboProductId, 1);
    };

    const comboQty = selectedPackage?.productId
        ? items[selectedPackage.productId] || 0
        : 0;
    const packageAdded = comboQty > 0;

    useEffect(() => {
        if (packageId) {
            fetchPackageProducts(packageId);
        }
    }, [packageId]);

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() =>
                        navigate(-1)
                    }
                    className="
                        flex
                        items-center
                        justify-center
                        w-9
                        h-9
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

                <div>
                    <h1
                        className="
                            text-xl
                            md:text-2xl
                            font-semibold
                            text-[var(--color-primary)]
                        "
                    >
                        {selectedPackage?.name ||
                            "Package"}
                    </h1>

                    <p className="text-sm text-gray-500">
                        {loading
                            ? "Loading products..."
                            : `${products.length} Products Included`}
                    </p>
                </div>
            </div>

            {/* TITLE */}

            <div className="mb-4">
                <h2
                    className="
                        text-lg
                        font-semibold
                        text-[var(--color-primary)]
                    "
                >
                    Included Products
                </h2>
            </div>


            {/* LOADING */}

            {loading &&
                products.length === 0 && (
                    <div
                        className="
                            grid
                            grid-cols-2
                            md:grid-cols-4
                            gap-4
                        "
                    >
                        {Array.from({
                            length: 6,
                        }).map((_, i) => (
                            <ProductSkeleton
                                key={i}
                            />
                        ))}
                    </div>
                )}

            {/* EMPTY */}

            {!loading &&
                products.length === 0 && (
                    <EmptyState
                        title="No products found"
                        description="This package currently has no products."
                    />
                )}

            {/* PRODUCTS */}

            <div
                className="
                    grid
                    grid-cols-2
                    sm:grid-cols-3
                    md:grid-cols-4
                    gap-6
                "
            >
                {products.map(
                    (product) => {
                        const qty =
                            items[
                            product.id
                            ] || 0;

                        return (
                            <ProductCard
                                key={
                                    product.id
                                }
                                product={
                                    product
                                }
                                quantityInCart={
                                    qty
                                }
                                onAddToCart={() =>
                                    addItem(
                                        product.id,
                                        1
                                    )
                                }
                                onIncrease={() =>
                                    addItem(
                                        product.id,
                                        1
                                    )
                                }
                                onDecrease={() => {
                                    if (
                                        qty ===
                                        1
                                    ) {
                                        removeItem(
                                            product.id
                                        );
                                    } else {
                                        addItem(
                                            product.id,
                                            -1
                                        );
                                    }
                                }}
                                hideCartControls={true}
                            />
                        );
                    }
                )}
            </div>
            <div
                className="
        fixed
        bottom-4
        left-1/2
        -translate-x-1/2
        z-40
        w-[calc(100%-2rem)]
        max-w-xl
    "
            >
                <div
                    className="
            bg-[var(--color-primary)]
            text-white
            rounded-2xl
            shadow-2xl
            px-5
            py-4
            flex
            items-center
            justify-between
        "
                >
                    <div>
                        <p className="font-semibold">
                            {products.length} Products
                        </p>

                        <p className="text-sm text-gray-200">
                            Add the complete combo package
                        </p>
                    </div>

                    <button
                        onClick={handleAddEntirePackage}
                        disabled={
                            !selectedPackage?.productId
                        }
                        className="
                        bg-white
                        text-[var(--color-primary)]
                        px-6
                        py-3
                        rounded-full
                        font-semibold
                        hover:scale-105
                        transition
                        disabled:opacity-50
                    "
                    >
                        {packageAdded ? "✓ Package Added" : "Add Package To Cart"}
                    </button>
                </div>
            </div>
        </div>
    );
}