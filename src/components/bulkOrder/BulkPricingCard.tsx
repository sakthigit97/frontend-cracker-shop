import { memo } from "react";
import type { BulkOrderPricing } from "../../types/bulkOrder";

interface BulkPricingCardProps {
    pricing: BulkOrderPricing;
}

function BulkPricingCard({
    pricing,
}: BulkPricingCardProps) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

            <div className="border-b border-gray-200 px-6 py-5">

                <h3 className="text-lg font-semibold">
                    Pricing Summary
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                    Final calculation for your bulk order.
                </p>

            </div>

            <div className="space-y-4 p-6">

                <PriceRow
                    label="Products Total"
                    value={pricing.productTotal}
                />

                <PriceRow
                    label="Packaging Charge (3%)"
                    value={pricing.packagingCharge}
                />

                <PriceRow
                    label="GST (18%)"
                    value={pricing.gstAmount}
                />

                <div className="border-t pt-4">

                    <PriceRow
                        label="Grand Total"
                        value={pricing.grandTotal}
                        highlight
                    />

                </div>

            </div>

        </div>
    );
}

interface PriceRowProps {
    label: string;
    value: number;
    highlight?: boolean;
}

function PriceRow({
    label,
    value,
    highlight = false,
}: PriceRowProps) {
    return (
        <div className="flex items-center justify-between">

            <span
                className={[
                    "text-sm",

                    highlight
                        ? "font-semibold text-gray-900"
                        : "text-gray-600",
                ].join(" ")}
            >
                {label}
            </span>

            <span
                className={[
                    "font-semibold",

                    highlight
                        ? "text-2xl text-primary"
                        : "text-gray-900",
                ].join(" ")}
            >
                ₹{value.toLocaleString("en-IN")}
            </span>

        </div>
    );
}

export default memo(BulkPricingCard);