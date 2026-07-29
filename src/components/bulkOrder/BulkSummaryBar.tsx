import { memo } from "react";
import { ShoppingCart } from "lucide-react";

import type { BulkOrderPricing } from "../../types/bulkOrder";

interface BulkSummaryBarProps {
    selectedProducts: number;
    totalBoxes: number;
    pricing: BulkOrderPricing;

    disabled?: boolean;

    onContinue: () => void;
}

function BulkSummaryBar({
    selectedProducts,
    totalBoxes,
    pricing,
    disabled = false,
    onContinue,
}: BulkSummaryBarProps) {
    return (
        <div className="sticky bottom-0 z-30 mt-8 rounded-2xl border border-gray-200 bg-white shadow-2xl">

            <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto]">

                <div>

                    <div className="flex items-center gap-3">

                        <div className="rounded-full bg-primary/10 p-3">
                            <ShoppingCart
                                size={22}
                                className="text-primary"
                            />
                        </div>

                        <div>

                            <h3 className="text-lg font-semibold">
                                Order Summary
                            </h3>

                            <p className="text-sm text-gray-500">
                                Review your bulk order before
                                continuing.
                            </p>

                        </div>

                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                        <SummaryItem
                            label="Selected Products"
                            value={selectedProducts.toString()}
                        />

                        <SummaryItem
                            label="Total Boxes"
                            value={totalBoxes.toString()}
                        />

                        <SummaryItem
                            label="Products Total"
                            value={`₹${pricing.productTotal.toLocaleString(
                                "en-IN"
                            )}`}
                        />

                        <SummaryItem
                            label="Packaging (3%)"
                            value={`₹${pricing.packagingCharge.toLocaleString(
                                "en-IN"
                            )}`}
                        />

                        <SummaryItem
                            label="GST (18%)"
                            value={`₹${pricing.gstAmount.toLocaleString(
                                "en-IN"
                            )}`}
                        />

                        <SummaryItem
                            label="Grand Total"
                            highlight
                            value={`₹${pricing.grandTotal.toLocaleString(
                                "en-IN"
                            )}`}
                        />

                    </div>

                </div>

                <div className="flex items-center justify-end">

                    <button
                        type="button"
                        disabled={disabled}
                        onClick={onContinue}
                        className={[
                            "w-full rounded-xl px-8 py-4 text-lg font-semibold transition lg:w-auto",

                            disabled
                                ? "cursor-not-allowed bg-gray-300 text-gray-500"
                                : "bg-primary text-white hover:opacity-90",
                        ].join(" ")}
                    >
                        Continue
                    </button>

                </div>

            </div>

        </div>
    );
}

interface SummaryItemProps {
    label: string;
    value: string;
    highlight?: boolean;
}

const SummaryItem = memo(function SummaryItem({
    label,
    value,
    highlight = false,
}: SummaryItemProps) {
    return (
        <div
            className={[
                "rounded-xl border p-4",

                highlight
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 bg-gray-50",
            ].join(" ")}
        >
            <div className="text-sm text-gray-500">
                {label}
            </div>

            <div
                className={[
                    "mt-2 text-xl font-bold",

                    highlight
                        ? "text-primary"
                        : "text-gray-900",
                ].join(" ")}
            >
                {value}
            </div>
        </div>
    );
});

export default memo(BulkSummaryBar);