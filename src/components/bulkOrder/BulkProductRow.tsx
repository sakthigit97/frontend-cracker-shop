import { memo, useMemo } from "react";
import { Minus, Plus, Package } from "lucide-react";
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

    const cartonQty = Number(product.cartonQty || 0);
    const total = useMemo(
        () => quantity * cartonQty * unitPrice,
        [quantity, cartonQty, unitPrice]
    );

    const increase = () =>
        onQuantityChange(product.id, quantity + 1);

    const decrease = () =>
        onQuantityChange(
            product.id,
            Math.max(0, quantity - 1)
        );

    return (
        <>

            <div className="hidden lg:grid grid-cols-[120px_1fr_240px_230px] items-center gap-6 border-b border-gray-100 px-4 py-3 hover:bg-gray-50 transition">

                <img
                    src={product.images?.[0] || defaultImage}
                    alt={product.name}
                    className="h-16 w-16 rounded-lg border bg-white object-contain p-1"
                    loading="lazy"
                />

                {/* Product */}

                <div className="min-w-0">

                    <h3 className="truncate text-base font-semibold text-blue-600">
                        {product.name}
                    </h3>

                    <div className="mt-2 flex flex-wrap gap-3">

                        <span className="rounded-full bg-gray-100 px-3 py-1  font-semibold">
                            ₹{unitPrice.toLocaleString("en-IN")} / Piece
                        </span>

                        <span className="rounded-full bg-amber-50 px-3 py-1  text-gray-700 flex items-center gap-2">

                            <Package
                                size={15}
                                className="text-amber-600"
                            />

                            Carton Qty :
                            <strong>
                                {cartonQty.toLocaleString("en-IN")}
                            </strong>

                        </span>

                    </div>

                </div>

                {/* Quantity */}

                <div className="flex flex-col items-center">

                    <div className="mb-2 text-[10px] tracking-wider text-gray-500">
                        Quantity
                    </div>

                    <div className="flex overflow-hidden rounded-lg border">

                        <button
                            type="button"
                            onClick={decrease}
                            disabled={quantity === 0}
                            className="flex h-9 w-9 items-center justify-center border-r bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
                        >
                            <Minus size={18} />
                        </button>

                        <div className="flex w-12 items-center justify-center text-base font-semibold">
                            {quantity}
                        </div>

                        <button
                            type="button"
                            onClick={increase}
                            className="flex h-9 w-9 items-center justify-center border-l bg-primary text-white hover:opacity-90"
                        >
                            <Plus size={18} />
                        </button>

                    </div>

                </div>

                {/* Total */}

                <div className="text-right">

                    {quantity > 0 ? (
                        <>

                            <div className="text-xs text-gray-500">

                                {quantity} × {cartonQty.toLocaleString("en-IN")} Pieces × ₹
                                {unitPrice.toLocaleString("en-IN")}

                            </div>

                            <div className="mt-2 text-[10px] tracking-wide text-gray-500">
                                Total
                            </div>

                            <div className="mt-1 text-3xl font-bold text-primary">
                                ₹{total.toLocaleString("en-IN")}
                            </div>

                        </>
                    ) : (

                        <div className="text-gray-400">
                            Select quantity
                        </div>

                    )}

                </div>

            </div>

            {/* ===========================
        MOBILE
=========================== */}

            <div className="block lg:hidden">

                <div className="mx-3 my-3 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

                    {/* Product */}
                    <div className="flex items-center gap-3 p-3">

                        <img
                            src={product.images?.[0] || defaultImage}
                            alt={product.name}
                            className="h-14 w-14 rounded-lg border bg-white object-contain p-1 flex-shrink-0"
                            loading="lazy"
                        />

                        <div className="min-w-0 flex-1">

                            <h3 className="truncate text-[18px] font-semibold text-blue-600">
                                {product.name}
                            </h3>

                            <div className="mt-2 flex flex-wrap gap-2">

                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">
                                    ₹{unitPrice.toLocaleString("en-IN")} / Piece
                                </span>

                                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs text-gray-700">
                                    📦 {cartonQty.toLocaleString("en-IN")} Pieces / Carton
                                </span>

                            </div>

                        </div>

                    </div>
                    {/* Bottom Section */}
                    <div className="border-t bg-gray-50 px-4 py-3">

                        <div>

                            <div className="flex justify-left">

                                <div className="flex overflow-hidden rounded-lg border bg-white shadow-sm">

                                    <button
                                        type="button"
                                        onClick={decrease}
                                        disabled={quantity === 0}
                                        className="flex h-9 w-9 items-center justify-center border-r bg-gray-100 disabled:opacity-40"
                                    >
                                        <Minus size={16} />
                                    </button>

                                    <div className="flex h-9 w-10 items-center justify-center font-semibold">
                                        {quantity}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={increase}
                                        className="flex h-9 w-9 items-center justify-center border-l bg-primary text-white"
                                    >
                                        <Plus size={16} />
                                    </button>

                                </div>

                            </div>
                        </div>

                        {/* Total Row */}
                        {quantity > 0 && (

                            <div className="mt-4 rounded-lg bg-blue-50 p-3">
                                <div className="space-y-3">
                                    <div>
                                        <div className="mt-1 text-sm leading-5 text-gray-700">
                                            {quantity} × {cartonQty.toLocaleString("en-IN")} Pieces × ₹
                                            {unitPrice.toLocaleString("en-IN")}
                                        </div>

                                    </div>

                                    <div className="border-t border-blue-100 pt-3">
                                        <div className="mt-1 text-2xl font-bold text-primary">
                                            ₹{total.toLocaleString("en-IN")}
                                        </div>

                                    </div>

                                </div>
                            </div>

                        )}

                    </div>
                </div>

            </div>



        </>
    );
}

export default memo(BulkProductRow);