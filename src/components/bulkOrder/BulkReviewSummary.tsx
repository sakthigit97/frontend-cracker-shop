import { memo, useMemo } from "react";
import { MapPin, Package } from "lucide-react";

import type {
    BulkOrderAddress,
    BulkOrderProduct,
} from "../../types/bulkOrder";

import { sortProductsBySequence } from "../../utils/sequncerUtil";
interface BulkReviewSummaryProps {
    address: BulkOrderAddress;
    items: BulkOrderProduct[];
}

function BulkReviewSummary({
    address,
    items,
}: BulkReviewSummaryProps) {
    const sortedItems = useMemo(() => {
        return sortProductsBySequence(items);
    }, [items]);

    return (
        <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white">
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
                        <div className="min-w-0">

                            <p className="font-semibold text-gray-900">
                                {address.fullName}
                            </p>

                            <p className="mt-1 text-sm leading-5 text-gray-600">
                                {address.addressLine1}

                                {address.addressLine2 && (
                                    <>
                                        ,{" "}
                                        {address.addressLine2}
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

            {/* =====================================================
                PRODUCTS
            ====================================================== */}
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
                                {sortedItems.length}{" "}
                                {sortedItems.length === 1
                                    ? "product"
                                    : "products"}
                            </p>

                        </div>

                    </div>

                </div>

                {/* =================================================
                    PRODUCT TABLE
                ================================================== */}
                {sortedItems.length > 0 ? (
                    <div className="w-full overflow-x-auto">

                        <table className="w-full min-w-[650px] border-collapse">

                            {/* Table Header */}
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">

                                    <th
                                        scope="col"
                                        className="
                                            px-4
                                            py-3
                                            text-left
                                            text-xs
                                            font-semibold
                                            uppercase
                                            tracking-wide
                                            text-gray-600
                                            sm:px-5
                                        "
                                    >
                                        Product Name
                                    </th>

                                    <th
                                        scope="col"
                                        className="
                                            px-3
                                            py-3
                                            text-center
                                            text-xs
                                            font-semibold
                                            uppercase
                                            tracking-wide
                                            text-gray-600
                                        "
                                    >
                                        Carton
                                    </th>

                                    <th
                                        scope="col"
                                        className="
                                            px-3
                                            py-3
                                            text-center
                                            text-xs
                                            font-semibold
                                            uppercase
                                            tracking-wide
                                            text-gray-600
                                        "
                                    >
                                        Carton Content
                                    </th>

                                    <th
                                        scope="col"
                                        className="
                                            px-3
                                            py-3
                                            text-right
                                            text-xs
                                            font-semibold
                                            uppercase
                                            tracking-wide
                                            text-gray-600
                                        "
                                    >
                                        Price
                                    </th>

                                    <th
                                        scope="col"
                                        className="
                                            px-4
                                            py-3
                                            text-right
                                            text-xs
                                            font-semibold
                                            uppercase
                                            tracking-wide
                                            text-gray-600
                                            sm:px-5
                                        "
                                    >
                                        Total
                                    </th>

                                </tr>
                            </thead>

                            {/* Table Body */}
                            <tbody className="divide-y divide-gray-100">

                                {sortedItems.map((item) => {
                                    const quantity =
                                        Number(
                                            item.quantity ?? 0
                                        );

                                    const cartonQty =
                                        Number(
                                            item.cartonQty ?? 0
                                        );

                                    const unitPrice =
                                        Number(
                                            item.unitPrice ?? 0
                                        );

                                    const total =
                                        Number(
                                            item.total ?? 0
                                        );

                                    return (
                                        <tr
                                            key={
                                                item.productId
                                            }
                                            className="
                                                transition-colors
                                                hover:bg-gray-50
                                            "
                                        >

                                            {/* Product Name */}
                                            <td
                                                className="
                                                    px-4
                                                    py-3.5
                                                    sm:px-5
                                                "
                                            >
                                                <p className="font-semibold text-gray-900">
                                                    {item.name}
                                                </p>
                                            </td>

                                            {/* Carton */}
                                            <td
                                                className="
                                                    px-3
                                                    py-3.5
                                                    text-center
                                                "
                                            >
                                                <span className="font-medium text-gray-900">
                                                    {quantity.toLocaleString(
                                                        "en-IN"
                                                    )}
                                                </span>
                                            </td>

                                            {/* Carton Content */}
                                            <td
                                                className="
                                                    px-3
                                                    py-3.5
                                                    text-center
                                                "
                                            >
                                                <span className="text-sm text-gray-600">
                                                    {cartonQty.toLocaleString(
                                                        "en-IN"
                                                    )}{" "}
                                                    {item.packUnit}
                                                </span>
                                            </td>

                                            {/* Price */}
                                            <td
                                                className="
                                                    px-3
                                                    py-3.5
                                                    text-right
                                                "
                                            >
                                                <span className="text-sm font-medium text-gray-700">
                                                    ₹
                                                    {unitPrice.toLocaleString(
                                                        "en-IN"
                                                    )}
                                                </span>
                                            </td>

                                            {/* Total */}
                                            <td
                                                className="
                                                    px-4
                                                    py-3.5
                                                    text-right
                                                    sm:px-5
                                                "
                                            >
                                                <span className="font-bold text-gray-900">
                                                    ₹
                                                    {total.toLocaleString(
                                                        "en-IN"
                                                    )}
                                                </span>
                                            </td>

                                        </tr>
                                    );
                                })}

                            </tbody>

                        </table>

                    </div>
                ) : (
                    <div className="px-4 py-8 text-center text-sm text-gray-500 sm:px-5">
                        No products selected.
                    </div>
                )}

            </section>

        </div>
    );
}

export default memo(
    BulkReviewSummary
);