import { memo, useMemo } from "react";
import { Minus, Plus } from "lucide-react";

import defaultImage from "../../assets/default-image.png";

import type { Product } from "../../types/product";
import type { BulkSchemeId } from "../../types/bulkOrder";

import { getSchemePrice } from "../../utils/bulkPricing";

interface BulkProductRowProps {
    product: Product;
    schemeId: BulkSchemeId;
    quantity: number;
    onQuantityChange: (
        productId: string,
        quantity: number
    ) => void;
}

function BulkProductRow({
    product,
    schemeId,
    quantity,
    onQuantityChange,
}: BulkProductRowProps) {

    const unitPrice = useMemo(
        () => getSchemePrice(product, schemeId),
        [product, schemeId]
    );

    const total = useMemo(
        () => quantity * unitPrice,
        [quantity, unitPrice]
    );

    const increase = () =>
        onQuantityChange(
            product.id,
            quantity + 1
        );

    const decrease = () =>
        onQuantityChange(
            product.id,
            Math.max(0, quantity - 1)
        );

    return (
        <>

            {/* ============================
                Desktop Layout
            ============================= */}

            <div className="hidden lg:flex items-center gap-5 border-b border-gray-100 p-5 transition hover:bg-gray-50">

                <div className="flex flex-1 items-center gap-4">

                    <img
                        src={product.images?.[0] || defaultImage}
                        alt={product.name}
                        className="h-20 w-20 rounded-xl border bg-white object-contain p-1"
                        loading="lazy"
                    />

                    <div className="min-w-0 flex-1">

                        <h3 className="truncate text-lg font-semibold text-blue-600">
                            {product.name}
                        </h3>

                        <div className="mt-3 flex flex-wrap gap-2">

                            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                                BULK PRICE
                            </span>

                            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                                ₹{unitPrice.toLocaleString("en-IN")} / Box
                            </span>

                            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                                📦 {product.qty} / Box
                            </span>

                        </div>

                    </div>

                </div>

                <div className="flex items-center gap-6">

                    <div className="flex overflow-hidden rounded-lg border">

                        <button
                            type="button"
                            onClick={decrease}
                            disabled={quantity === 0}
                            className="flex h-10 w-10 items-center justify-center border-r bg-gray-100 transition hover:bg-gray-200 disabled:opacity-40"
                        >
                            <Minus size={18} />
                        </button>

                        <div className="flex w-12 items-center justify-center font-semibold">
                            {quantity}
                        </div>

                        <button
                            type="button"
                            onClick={increase}
                            className="flex h-10 w-10 items-center justify-center border-l bg-[var(--color-primary)] text-white transition hover:opacity-90"
                        >
                            <Plus size={18} />
                        </button>

                    </div>

                    <div className="min-w-[120px] text-right">

                        <div className="text-xs uppercase tracking-wide text-gray-500">
                            Total
                        </div>

                        <div className="mt-1 text-xl font-bold text-primary">
                            ₹{total.toLocaleString("en-IN")}
                        </div>

                    </div>

                </div>

            </div>

            <div className="block border-b border-gray-100 bg-white p-4 lg:hidden">

                <div className="flex gap-3">

                    <img
                        src={product.images?.[0] || defaultImage}
                        alt={product.name}
                        className="h-14 w-14 flex-shrink-0 rounded-lg border bg-white object-contain p-1"
                        loading="lazy"
                    />

                    <div className="min-w-0 flex-1">

                        <h3 className="truncate text-[17px] font-semibold text-blue-600">
                            {product.name}
                        </h3>

                        <div className="mt-2 flex flex-wrap items-center gap-2">

                            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                                BULK PRICE
                            </span>

                        </div>

                        <div className="mt-2">

                            <div className="text-xl font-bold text-[var(--color-primary)]">
                                ₹{unitPrice.toLocaleString("en-IN")} / Box
                            </div>

                            <div className="mt-1 text-xs text-gray-500">
                                📦 Box Qty : {product.qty}
                            </div>

                        </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="mt-4 flex items-center justify-between gap-3">

                        {/* Quantity */}
                        <div className="flex overflow-hidden rounded-lg border shadow-sm">

                            <button
                                type="button"
                                onClick={decrease}
                                disabled={quantity === 0}
                                className="flex h-9 w-9 items-center justify-center border-r bg-gray-100 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <Minus size={16} />
                            </button>

                            <div className="flex w-10 items-center justify-center font-semibold">
                                {quantity}
                            </div>

                            <button
                                type="button"
                                onClick={increase}
                                className="flex h-9 w-9 items-center justify-center border-l bg-[var(--color-primary)] text-white transition hover:opacity-90"
                            >
                                <Plus size={16} />
                            </button>

                        </div>

                        {/* Total */}
                        <div className="text-right">

                            <div className="text-[11px] uppercase tracking-wide text-gray-500">
                                Total
                            </div>

                            <div className="text-lg font-bold text-primary">
                                ₹{total.toLocaleString("en-IN")}
                            </div>

                        </div>

                    </div>

                </div>

            </div>
        </>
    );
}

export default memo(BulkProductRow);