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
        <div className="space-y-8">

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
                        <p>{address.addressLine2}</p>
                    )}

                    <p>
                        {address.city}, {address.state}
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

                <div className="divide-y">

                    {items.map((item) => (

                        <div
                            key={item.productId}
                            className="flex items-center justify-between p-5"
                        >

                            <div>

                                <div className="font-semibold">
                                    {item.name}
                                </div>

                                <div className="mt-1 text-sm text-gray-500">
                                    Box Qty : {item.bulkQty}
                                </div>

                                <div className="mt-1 text-sm text-gray-500">
                                    {item.quantity} Boxes
                                </div>

                            </div>

                            <div className="text-right">

                                <div className="text-sm text-gray-500">
                                    Net Price
                                </div>

                                <div>
                                    ₹{item.unitPrice.toLocaleString("en-IN")} / Box
                                </div>

                                <div className="mt-2 text-lg font-bold text-primary">
                                    ₹{item.total.toLocaleString("en-IN")}
                                </div>

                            </div>

                        </div>

                    ))}

                </div>

            </div>

        </div>
    );
}

export default memo(BulkReviewSummary);