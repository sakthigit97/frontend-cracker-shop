import { memo } from "react";
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
        <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white">
                <div className="border-b border-gray-200 px-6 py-5">
                    <h3 className="text-lg font-semibold">
                        Delivery Address
                    </h3>
                </div>

                <div className="space-y-2 p-6">
                    <h4 className="font-semibold">
                        {address.fullName}
                    </h4>

                    <p>{address.addressLine1}</p>

                    {address.addressLine2 && (
                        <p>
                            {address.addressLine2}
                        </p>
                    )}

                    <p>
                        {address.city},{" "}
                        {address.state}
                    </p>

                    <p>{address.pincode}</p>

                    <p className="font-medium">
                        Mobile : {address.mobile}
                    </p>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white">
                <div className="border-b border-gray-200 px-6 py-5">
                    <h3 className="text-lg font-semibold">
                        Selected Products
                    </h3>
                </div>

                <div className="max-h-[420px] divide-y overflow-y-auto">
                    {items.map((item) => {
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
                            <div
                                key={
                                    item.productId
                                }
                                className="flex items-center justify-between gap-5 p-5"
                            >
                                <div className="min-w-0">
                                    <div className="font-semibold">
                                        {item.name}
                                    </div>

                                    <div className="mt-1 text-sm text-gray-500">
                                        Carton Qty :{" "}
                                        {cartonQty.toLocaleString(
                                            "en-IN"
                                        )}{" "}
                                        Pieces
                                    </div>

                                    <div className="mt-1 text-sm text-gray-500">
                                        Quantity :{" "}
                                        {quantity.toLocaleString(
                                            "en-IN"
                                        )}{" "}
                                        Boxes
                                    </div>
                                </div>

                                <div className="shrink-0 text-right">
                                    <div className="text-sm text-gray-500">
                                        Net Price
                                    </div>

                                    <div className="font-medium">
                                        ₹
                                        {unitPrice.toLocaleString(
                                            "en-IN"
                                        )}{" "}
                                        / Piece
                                    </div>

                                    <div className="mt-1 text-xs text-gray-500">
                                        {quantity.toLocaleString(
                                            "en-IN"
                                        )}{" "}
                                        ×{" "}
                                        {cartonQty.toLocaleString(
                                            "en-IN"
                                        )}{" "}
                                        Pieces × ₹
                                        {unitPrice.toLocaleString(
                                            "en-IN"
                                        )}
                                    </div>

                                    <div className="mt-2 text-lg font-bold text-primary">
                                        ₹
                                        {total.toLocaleString(
                                            "en-IN"
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default memo(
    BulkReviewSummary
);