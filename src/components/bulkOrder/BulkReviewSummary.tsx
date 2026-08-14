import { memo } from "react";
import { MapPin, Package } from "lucide-react";
import type {
    BulkOrderAddress,
    BulkOrderProduct,
} from "../../types/bulkOrder";

interface BulkReviewSummaryProps {
    address: BulkOrderAddress;
    items: BulkOrderProduct[];
}

function BulkReviewSummary({
    address,
    items,
}: BulkReviewSummaryProps) {
    return (
        <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white">

            {/* Delivery Address */}
            <section>
                <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3.5 sm:px-5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <MapPin
                            size={18}
                            className="text-primary"
                        />
                    </div>

                    <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900">
                            Delivery Address
                        </h3>

                        <p className="text-xs text-gray-500">
                            Order delivery location
                        </p>
                    </div>
                </div>

                <div className="px-4 py-4 sm:px-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                        {/* Address */}
                        <div className="min-w-0">
                            <p className="font-semibold text-gray-900">
                                {address.fullName}
                            </p>

                            <p className="mt-1 text-sm leading-5 text-gray-600">
                                {address.addressLine1}

                                {address.addressLine2 && (
                                    <>
                                        , {address.addressLine2}
                                    </>
                                )}
                            </p>

                            <p className="text-sm leading-5 text-gray-600">
                                {address.city},{" "}
                                {address.state} -{" "}
                                {address.pincode}
                            </p>
                        </div>

                        {/* Mobile */}
                        <div className="w-fit shrink-0 rounded-lg bg-gray-50 px-3 py-2">
                            <p className="text-xs text-gray-500">
                                Mobile
                            </p>

                            <p className="mt-0.5 text-sm font-medium text-gray-900">
                                {address.mobile}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Products */}
            <section className="border-t border-gray-200">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3.5 sm:px-5">

                    <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <Package
                                size={18}
                                className="text-primary"
                            />
                        </div>

                        <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900">
                                Selected Products
                            </h3>

                            <p className="text-xs text-gray-500">
                                {items.length}{" "}
                                {items.length === 1
                                    ? "product"
                                    : "products"}
                            </p>
                        </div>

                    </div>
                </div>

                {/* Product List */}
                <div className="divide-y divide-gray-100">

                    {items.map((item) => {
                        const quantity =
                            Number(item.quantity ?? 0);

                        const cartonQty =
                            Number(item.cartonQty ?? 0);

                        const unitPrice =
                            Number(item.unitPrice ?? 0);

                        const total =
                            Number(item.total ?? 0);

                        return (
                            <div
                                key={item.productId}
                                className="px-4 py-3.5 sm:px-5"
                            >
                                <div className="grid min-w-0 gap-2.5 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-5">

                                    {/* Product Details */}
                                    <div className="min-w-0">

                                        <p className="truncate font-semibold text-gray-900">
                                            {item.name}
                                        </p>

                                        <div className="mt-1 flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">

                                            <span className="whitespace-nowrap">
                                                ₹
                                                {unitPrice.toLocaleString(
                                                    "en-IN"
                                                )}{" "}
                                                / Piece
                                            </span>

                                            <span className="whitespace-nowrap">
                                                {cartonQty.toLocaleString(
                                                    "en-IN"
                                                )}{" "}
                                                Pieces / Carton
                                            </span>

                                        </div>
                                    </div>

                                    {/* Quantity */}
                                    <div className="flex items-center gap-2 text-sm sm:justify-end">

                                        <span className="text-gray-500">
                                            Cartons
                                        </span>

                                        <span className="font-semibold text-gray-900">
                                            {quantity.toLocaleString(
                                                "en-IN"
                                            )}
                                        </span>

                                    </div>

                                    {/* Total */}
                                    <div className="flex items-end justify-between gap-3 sm:block sm:min-w-[130px] sm:text-right">

                                        <p className="text-xs text-gray-500">
                                            {quantity.toLocaleString(
                                                "en-IN"
                                            )}{" "}
                                            ×{" "}
                                            {cartonQty.toLocaleString(
                                                "en-IN"
                                            )}{" "}
                                            Pieces
                                        </p>

                                        <p className="text-lg font-bold text-primary">
                                            ₹
                                            {total.toLocaleString(
                                                "en-IN"
                                            )}
                                        </p>

                                    </div>

                                </div>
                            </div>
                        );
                    })}

                    {items.length === 0 && (
                        <div className="px-4 py-8 text-center text-sm text-gray-500 sm:px-5">
                            No products selected.
                        </div>
                    )}

                </div>
            </section>

        </div>
    );
}

export default memo(BulkReviewSummary);