import { memo } from "react";
import {
    Package,
    Box,
    ReceiptIndianRupee,
} from "lucide-react";
import type { BulkOrderPricing } from "../../types/bulkOrder";

interface BulkPricingCardProps {
    pricing: BulkOrderPricing;
}

function BulkPricingCard({
    pricing,
}: BulkPricingCardProps) {
    const hasPackaging =
        pricing.packagingCharge > 0 &&
        pricing.packagingPercent > 0;

    const hasGst =
        pricing.gstAmount > 0 &&
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
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="border-b bg-gray-50 px-6 py-5">
                <h3 className="text-lg font-semibold text-gray-900">
                    Pricing Summary
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                    Final calculation for your bulk order.
                </p>
            </div>

            <div className="space-y-5 p-6">
                <PriceRow
                    icon={<Package size={18} />}
                    label="Products Total"
                    value={pricing.productTotal}
                />

                {hasPackaging && (
                    <PriceRow
                        icon={<Box size={18} />}
                        label={`Packaging Charge (${pricing.packagingPercent}%)`}
                        value={
                            pricing.packagingCharge
                        }
                        muted
                    />
                )}

                {hasGst && (
                    <PriceRow
                        icon={
                            <ReceiptIndianRupee
                                size={18}
                            />
                        }
                        label={`GST (${pricing.gstPercent}%)`}
                        value={
                            pricing.gstAmount
                        }
                        muted
                    />
                )}

                <div className="border-t border-dashed pt-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-lg font-semibold text-gray-900">
                                Grand Total
                            </p>

                            <p className="text-xs text-gray-500">
                                {totalDescription}
                            </p>
                        </div>

                        <span className="text-3xl font-bold text-primary">
                            ₹
                            {pricing.grandTotal.toLocaleString(
                                "en-IN"
                            )}
                        </span>
                    </div>
                </div>

                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <p className="font-medium text-blue-900">
                        Estimated Delivery
                    </p>

                    <p className="mt-2 text-sm text-blue-700">
                        • Tamil Nadu : 3–5 Working Days
                    </p>

                    <p className="text-sm text-blue-700">
                        • Other States : 7–10 Working Days
                    </p>
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
        <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
                <div
                    className={[
                        "rounded-lg p-2",
                        muted
                            ? "bg-gray-100 text-gray-500"
                            : "bg-primary/10 text-primary",
                    ].join(" ")}
                >
                    {icon}
                </div>

                <span
                    className={[
                        "truncate",
                        muted
                            ? "text-gray-600"
                            : "text-gray-800",
                    ].join(" ")}
                >
                    {label}
                </span>
            </div>

            <span className="min-w-[90px] text-right font-semibold text-gray-900">
                ₹
                {value.toLocaleString(
                    "en-IN"
                )}
            </span>
        </div>
    );
}

export default memo(BulkPricingCard);