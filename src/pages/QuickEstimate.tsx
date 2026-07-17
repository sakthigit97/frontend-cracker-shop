import { useEffect, useState, useMemo } from "react";
import { useHomeProducts } from "../store/homeProduct.store";
import ProductSkeleton from "../components/product/ProductSkeleton";
import { quickEstimateStore } from "../store/quickEstimate.store";
import QuickEstimateModal from "../components/estimate/QuickEstimateModal";
import QuickEstimateTable from "../components/estimate/QuickEstimateTable";
import { useNavigate } from "react-router-dom";
import { useConfigStore } from "../store/config.store";
import { calculateOrderPricingBreakdown } from "../utils/orderPricing";
import { calculateOrderAmounts } from "../utils/pricing";
import { sortProductsBySequence } from "../utils/sequncerUtil";


export default function QuickEstimate() {

    const {
        products,
        loading,
        fetchAll,
    } = useHomeProducts();

    const navigate = useNavigate();
    const [showEstimate, setShowEstimate] = useState(false);
    const [search, setSearch] = useState("");
    const items = quickEstimateStore((s) => s.items);

    useEffect(() => {
        fetchAll();
    }, []);
    const query = search.trim().toLowerCase();

    let displayProducts: any =
        query.length > 0
            ? products.filter((p) =>
                (`${p.name}`)
                    .toLowerCase()
                    .includes(query)
            )
            : products;
    displayProducts = sortProductsBySequence(displayProducts);

    const selectedProducts = Object.values(items).reduce(
        (sum, qty) => sum + Math.max(0, Number(qty) || 0),
        0
    );

    const estimateProducts = useMemo(
        () =>
            products
                .filter((p) => (items[p.id] || 0) > 0)
                .map((p) => ({
                    ...p,
                    quantity: items[p.id],
                })),
        [products, items]
    );

    const { config } = useConfigStore();
    const packagingPercent = Number(config?.packagingPercent || 0);
    const gstPercent = Number(config?.gstPercent || 0);

    const pricingBreakdown = useMemo(
        () => calculateOrderPricingBreakdown(estimateProducts),
        [estimateProducts]
    );

    const {
        grandTotal,
    } = useMemo(
        () =>
            calculateOrderAmounts({
                totalAmount: pricingBreakdown.subtotal,
                chargeableAmount: pricingBreakdown.eligibleChargeAmount,
                packagingPercent,
                gstPercent,
                config,
            }),
        [
            pricingBreakdown.subtotal,
            pricingBreakdown.eligibleChargeAmount,
            packagingPercent,
            gstPercent,
            config,
        ]
    );

    return (

        <div className="space-y-4">

            <QuickEstimateModal
                open={showEstimate}
                onClose={() =>
                    setShowEstimate(false)
                }
            />

            <div className="flex items-center gap-4 mb-3">
                <button
                    onClick={() => navigate(-1)}
                    className="
                        flex items-center justify-center
                        w-8 h-8
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
                            text-lg
                            md:text-xl
                            font-semibold
                            text-[var(--color-primary)]
                        "
                    >
                        Quick Estimate
                    </h1>

                    <p className="text-xs text-gray-500">
                        Select quantities and generate an estimate.
                    </p>
                </div>
            </div>

            <div className="px-3">

                <input
                    value={search}
                    onChange={(e) =>
                        setSearch(e.target.value)
                    }
                    placeholder="Search crackers..."
                    className="
                        w-full
                        rounded-lg
                        border
                        px-3
                        py-1.5
                        text-base
                        focus:ring-2
                        focus:ring-[var(--color-primary)]
                    "
                />

            </div>

            <div className="px-3 min-h-[65vh]">

                {loading && products.length === 0 ? (

                    <div className="space-y-4">

                        {Array.from({ length: 8 }).map((_, i) => (
                            <ProductSkeleton key={i} />
                        ))}

                    </div>

                ) : displayProducts.length === 0 ? (

                    <div
                        className="
                        flex
                        flex-col
                        items-center
                        justify-center
                        py-24
                        text-center
                    "
                    >

                        <div className="text-6xl mb-4">
                            🔍
                        </div>

                        <h3 className="text-xl font-semibold text-[var(--color-primary)]">
                            No products found
                        </h3>

                        <p className="mt-2 text-gray-500">
                            Try searching with another product name.
                        </p>

                    </div>

                ) : (

                    <QuickEstimateTable
                        products={displayProducts}
                    />

                )}

            </div>

            {selectedProducts > 0 && !showEstimate && (

                <div
                    className="
                        fixed
                        bottom-4
                        left-1/2
                        -translate-x-1/2
                        z-40
                        bg-slate-900
                        text-white
                        rounded-2xl
                        shadow-2xl
                        w-[92%]
                        max-w-xl
                        px-5
                        py-3
                    "
                >

                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-semibold text-base">
                                {selectedProducts} Item{selectedProducts > 1 ? "s" : ""}

                            </div>
                            <div className="text-xs text-gray-300">
                                Estimate ₹{grandTotal.toLocaleString("en-IN")}
                            </div>
                        </div>

                        <button
                            onClick={() =>
                                setShowEstimate(true)
                            }
                            className="
                                bg-white
                                text-slate-900
                                px-5
                                py-2
                                rounded-full
                                font-semibold
                                hover:shadow-lg
                                transition
                            "
                        >

                            Review ({selectedProducts}) →
                        </button>
                    </div>

                </div>

            )}

        </div>

    );

}