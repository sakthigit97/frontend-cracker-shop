import { memo, useMemo } from "react";
import {
    Minus,
    Plus,
    Package,
} from "lucide-react";

import defaultImage from "../../assets/default-image.png";

import type { Product } from "../../types/product";
import type { BulkScheme } from "../../types/bulkOrder";

import { calculateBulkUnitPrice } from "../../utils/bulkPricing";

interface BulkProductRowProps {
    product: Product;
    scheme: BulkScheme;
    quantity: number;
    onQuantityChange: (
        productId: string,
        quantity: number
    ) => void;
}

function BulkProductRow({
    product,
    scheme,
    quantity,
    onQuantityChange,
}: BulkProductRowProps) {
    const unitPrice = useMemo(
        () =>
            calculateBulkUnitPrice(
                product,
                scheme
            ),
        [product, scheme]
    );

    const cartonQty = Number(
        product.cartonQty || 0
    );

    const total = useMemo(
        () =>
            quantity *
            cartonQty *
            unitPrice,
        [
            quantity,
            cartonQty,
            unitPrice,
        ]
    );

    const increase = () => {
        onQuantityChange(
            product.id,
            quantity + 1
        );
    };

    const decrease = () => {
        onQuantityChange(
            product.id,
            Math.max(0, quantity - 1)
        );
    };

    const formattedUnitPrice =
        unitPrice.toLocaleString("en-IN");

    const formattedCartonQty =
        cartonQty.toLocaleString("en-IN");

    const formattedTotal =
        total.toLocaleString("en-IN");

    return (
        <>
            {/* =====================================================
                DESKTOP
            ===================================================== */}

            <div className="hidden lg:grid grid-cols-[56px_minmax(0,1fr)_130px_150px] items-center gap-4 border-b border-gray-100 px-3 py-2.5 transition hover:bg-gray-50">

                {/* Product Image */}
                <img
                    src={
                        product.images?.[0]?.trim() ||
                        defaultImage
                    }
                    alt={product.name}
                    className="h-14 w-14 rounded-lg border bg-white object-contain p-1"
                    loading="lazy"
                    onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                            defaultImage;
                    }}
                />

                {/* Product Information */}
                <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-semibold text-blue-600">
                        {product.name}
                    </h3>

                    <div className="mt-1.5 flex items-center gap-2">
                        {/* Bulk Price */}
                        <span className="whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold">
                            ₹{formattedUnitPrice} / Piece
                        </span>

                        {/* Carton Quantity */}
                        <span className="flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-50 px-2.5 py-0.5 text-xs text-gray-700">
                            <Package
                                size={13}
                                className="text-amber-600"
                            />

                            <strong>
                                {formattedCartonQty} Pieces / Carton
                            </strong>
                        </span>
                    </div>
                </div>

                {/* Carton Quantity */}
                <div className="flex flex-col items-center justify-center">
                    <span className="mb-1 text-[10px] text-gray-500">
                        Cartons
                    </span>

                    <div className="flex overflow-hidden rounded-md border bg-white">
                        <button
                            type="button"
                            onClick={decrease}
                            disabled={quantity === 0}
                            aria-label={`Decrease cartons for ${product.name}`}
                            className="flex h-8 w-8 items-center justify-center border-r bg-gray-100 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <Minus size={15} />
                        </button>

                        <div className="flex h-8 w-10 items-center justify-center text-sm font-semibold">
                            {quantity}
                        </div>

                        <button
                            type="button"
                            onClick={increase}
                            aria-label={`Increase cartons for ${product.name}`}
                            className="flex h-8 w-8 items-center justify-center border-l bg-primary text-white transition hover:opacity-90"
                        >
                            <Plus size={15} />
                        </button>
                    </div>
                </div>

                {/* Total */}
                <div className="min-w-0 text-right">
                    {quantity > 0 ? (
                        <>
                            <div className="text-[11px] text-gray-500">
                                {quantity}{" "}
                                {quantity === 1
                                    ? "Carton"
                                    : "Cartons"}{" "}
                                × ₹{formattedTotal}
                            </div>

                            <div className="mt-0.5 text-xl font-bold text-primary">
                                ₹{formattedTotal}
                            </div>
                        </>
                    ) : (
                        <div className="text-xs text-gray-400">
                            Select quantity
                        </div>
                    )}
                </div>
            </div>

            {/* =====================================================
                MOBILE / TABLET
            ===================================================== */}

            <div className="lg:hidden border-b border-gray-100 px-3 py-3 transition hover:bg-gray-50">

                {/* Product Information */}
                <div className="flex min-w-0 items-start gap-3">

                    {/* Image */}
                    <img
                        src={
                            product.images?.[0]?.trim() ||
                            defaultImage
                        }
                        alt={product.name}
                        className="h-12 w-12 shrink-0 rounded-lg border bg-white object-contain p-1 sm:h-14 sm:w-14"
                        loading="lazy"
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src =
                                defaultImage;
                        }}
                    />

                    {/* Product Details */}
                    <div className="min-w-0 flex-1">

                        <h3 className="truncate text-[15px] font-semibold text-blue-600 sm:text-base">
                            {product.name}
                        </h3>

                        <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-1.5">

                            {/* Bulk Price */}
                            <span className="whitespace-nowrap rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold sm:text-xs">
                                ₹{formattedUnitPrice} / Piece
                            </span>

                            {/* Carton Quantity */}
                            <span className="flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-gray-700 sm:text-xs">
                                <Package
                                    size={11}
                                    className="shrink-0 text-amber-600"
                                />

                                <strong>
                                    {formattedCartonQty} Pieces / Carton
                                </strong>
                            </span>

                        </div>
                    </div>
                </div>

                {/* Quantity + Total */}
                <div className="mt-2.5 flex items-end justify-between gap-3 border-t border-gray-100 pt-2.5">

                    {/* Quantity */}
                    <div className="flex shrink-0 flex-col items-start">
                        <span className="mb-1 text-[10px] text-gray-500">
                            Cartons
                        </span>

                        <div className="flex overflow-hidden rounded-md border bg-white">

                            <button
                                type="button"
                                onClick={decrease}
                                disabled={quantity === 0}
                                aria-label={`Decrease cartons for ${product.name}`}
                                className="flex h-8 w-9 items-center justify-center border-r bg-gray-100 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <Minus size={14} />
                            </button>

                            <div className="flex h-8 w-10 items-center justify-center text-sm font-semibold">
                                {quantity}
                            </div>

                            <button
                                type="button"
                                onClick={increase}
                                aria-label={`Increase cartons for ${product.name}`}
                                className="flex h-8 w-9 items-center justify-center border-l bg-primary text-white transition hover:opacity-90"
                            >
                                <Plus size={14} />
                            </button>

                        </div>
                    </div>

                    {/* Total */}
                    <div className="min-w-0 flex-1 text-right">
                        {quantity > 0 ? (
                            <>
                                <div className="truncate text-[11px] text-gray-500 sm:text-xs">
                                    {quantity}{" "}
                                    {quantity === 1
                                        ? "Carton"
                                        : "Cartons"}{" "}
                                    × ₹{formattedTotal}
                                </div>

                                <div className="mt-0.5 text-lg font-bold text-primary sm:text-xl">
                                    ₹{formattedTotal}
                                </div>
                            </>
                        ) : (
                            <div className="text-xs text-gray-400">
                                Select quantity
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </>
    );
}

export default memo(BulkProductRow);