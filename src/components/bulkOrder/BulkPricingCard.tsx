import { memo } from "react";
import {
    Package,
    Box,
    ReceiptIndianRupee,
} from "lucide-react";

import type { BulkOrderPricing } from "../../types/bulkOrder";
import { useConfigStore } from "../../store/config.store";

interface BulkPricingCardProps {
    pricing: BulkOrderPricing;
}

function BulkPricingCard({
    pricing,
}: BulkPricingCardProps) {

    const config = useConfigStore((s) => s.config);
    const gstPercent = config?.gstPercent;
    const packagingPercent = config?.packagingPercent;

    const hasPackaging = pricing.packagingCharge > 0 &&
        pricing.packagingPercent > 0;

    const hasGst = pricing.gstAmount > 0 &&
        pricing.gstPercent > 0;

    const includedCharges: string[] = [];
    if (hasGst) {
        includedCharges.push("GST");
    }

    if (hasPackaging) {
        includedCharges.push(
            "Packaging Charges"
        );
    }

    const totalDescription =
        includedCharges.length === 0
            ? "Final payable amount"
            : includedCharges.length === 1
                ? `Inclusive of ${includedCharges[0]}`
                : `Inclusive of ${includedCharges.join(
                    " & "
                )}`;

    return (
        <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

            {/* Header */}
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-4 sm:px-6 sm:py-5">
                <h3 className="text-lg font-semibold text-gray-900">
                    Pricing Summary
                </h3>

                <p className="mt-1 text-sm leading-5 text-gray-500">
                    Final calculation for your bulk order.
                </p>
            </div>

            {/* Content */}
            <div className="space-y-4 p-4 sm:space-y-5 sm:p-6">

                {/* Product total */}
                <PriceRow
                    icon={
                        <Package size={18} />
                    }
                    label="Products Total"
                    value={pricing.productTotal}
                />

                {/* Packaging */}
                {hasPackaging && (
                    <PriceRow
                        icon={
                            <Box size={18} />
                        }
                        label={`Packaging Charge (${packagingPercent}%)`}
                        value={
                            pricing.packagingCharge
                        }
                        muted
                    />
                )}

                {/* GST */}
                {hasGst && (
                    <PriceRow
                        icon={
                            <ReceiptIndianRupee
                                size={18}
                            />
                        }
                        label={`GST (${gstPercent}%)`}
                        value={
                            pricing.gstAmount
                        }
                        muted
                    />
                )}

                {/* Grand total */}
                <div className="border-t border-dashed border-gray-300 pt-4 sm:pt-5">
                    <div className="flex items-end justify-between gap-3">

                        <div className="min-w-0 flex-1">
                            <p className="text-base font-semibold leading-5 text-gray-900 sm:text-lg">
                                Grand Total
                            </p>

                            <p className="mt-1 text-xs leading-4 text-gray-500 sm:text-sm sm:leading-5">
                                {totalDescription}
                            </p>
                        </div>

                        <span className="shrink-0 whitespace-nowrap text-2xl font-bold leading-none text-primary sm:text-3xl">
                            ₹
                            {pricing.grandTotal.toLocaleString(
                                "en-IN"
                            )}
                        </span>
                    </div>
                </div>

                {/* Estimated delivery */}
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <p className="font-medium leading-5 text-blue-900">
                        Estimated Delivery
                    </p>

                    <div className="mt-2 space-y-1 text-sm leading-5 text-blue-700">
                        <p>
                            • Tamil Nadu: 3–5 Working Days
                        </p>

                        <p>
                            • Other States: 7–10 Working Days
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface PriceRowProps {
    icon: React.ReactNode;
    label: string;
    value: number;
    muted?: boolean;
}

function PriceRow({
    icon,
    label,
    value,
    muted = false,
}: PriceRowProps) {
    return (
        <div className="flex min-w-0 items-center justify-between gap-3">

            <div className="flex min-w-0 flex-1 items-center gap-3">

                <div
                    className={[
                        "shrink-0 rounded-lg p-2",
                        muted
                            ? "bg-gray-100 text-gray-500"
                            : "bg-primary/10 text-primary",
                    ].join(" ")}
                >
                    {icon}
                </div>

                <span
                    className={[
                        "min-w-0 text-sm leading-5 sm:text-base",
                        muted
                            ? "text-gray-600"
                            : "text-gray-800",
                    ].join(" ")}
                >
                    {label}
                </span>
            </div>

            <span className="shrink-0 whitespace-nowrap text-right text-sm font-semibold text-gray-900 sm:text-base">
                ₹
                {value.toLocaleString(
                    "en-IN"
                )}
            </span>
        </div>
    );
}

export default memo(
    BulkPricingCard
);