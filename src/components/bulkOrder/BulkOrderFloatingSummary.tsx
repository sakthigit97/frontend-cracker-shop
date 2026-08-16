import { memo, useEffect, useState } from "react";
import {
    ShoppingCart,
    X,
    Package,
    ReceiptIndianRupee,
    ChevronRight,
} from "lucide-react";

import type { BulkOrderProduct } from "../../types/bulkOrder";
import { useConfigStore } from "../../store/config.store";

interface BulkOrderPricing {
    cartonBoxCount: number;
    productsTotal: number;
    packagingCharge: number;
    gstAmount: number;
    grandTotal: number;
    packagingPercent?: number;
    gstPercent?: number;
}

interface BulkOrderFloatingSummaryProps {
    items: BulkOrderProduct[];
    pricing: BulkOrderPricing;
    onReview?: () => void;
}

function BulkOrderFloatingSummary({
    items,
    pricing,
    onReview,
}: BulkOrderFloatingSummaryProps) {
    const [open, setOpen] = useState(false);
    const selectedItems = items.filter(
        (item) => Number(item.quantity ?? 0) > 0
    );

    const config = useConfigStore((s) => s.config);
    const gstPercent = config?.gstPercent;
    const productCount = selectedItems.length;
    const totalCartons = selectedItems.reduce(
        (sum, item) =>
            sum + Number(item.quantity ?? 0),
        0
    );

    useEffect(() => {
        if (!open) {
            return;
        }

        const handleKeyDown = (
            event: KeyboardEvent
        ) => {
            if (event.key === "Escape") {
                setOpen(false);
            }
        };

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [open]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const originalOverflow =
            document.body.style.overflow;

        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow =
                originalOverflow;
        };
    }, [open]);

    if (productCount === 0) {
        return null;
    }

    const formatAmount = (
        value: number
    ) =>
        Number(value ?? 0).toLocaleString(
            "en-IN"
        );

    const hasPackaging =
        Number(
            pricing.packagingCharge ?? 0
        ) > 0 &&
        Number(
            pricing.packagingPercent ?? 0
        ) > 0;

    const hasGst =
        Number(pricing.gstAmount ?? 0) > 0 &&
        Number(
            pricing.gstPercent ?? 0
        ) > 0;

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
                : `Inclusive of ${includedCharges[0]} & ${includedCharges[1]}`;

    return (
        <>
            {/* =====================================================
                FLOATING SUMMARY BUTTON
            ====================================================== */}
            <div
                className="
                    fixed
                    right-3
                    bottom-20
                    z-[70]
                    sm:right-4
                    sm:bottom-24
                "
            >
                <button
                    type="button"
                    onClick={() =>
                        setOpen(
                            (value) => !value
                        )
                    }
                    aria-label="View order summary"
                    aria-expanded={open}
                    className="
                        group
                        flex
                        w-[76px]
                        flex-col
                        items-center
                        justify-center
                        rounded-2xl
                        border
                        border-gray-200
                        bg-white
                        px-2
                        py-3
                        shadow-lg
                        transition-all
                        duration-200
                        hover:scale-105
                        hover:shadow-xl
                        active:scale-95
                        sm:w-[82px]
                    "
                >
                    {/* Cart Icon */}
                    <div
                        className="
                            relative
                            flex
                            h-10
                            w-10
                            items-center
                            justify-center
                            rounded-full
                            bg-[var(--color-primary)]
                            text-white
                        "
                    >
                        <ShoppingCart
                            size={20}
                        />

                        {/* Product Count */}
                        <span
                            className="
                                absolute
                                -right-1
                                -top-1
                                flex
                                h-5
                                min-w-5
                                items-center
                                justify-center
                                rounded-full
                                bg-red-500
                                px-1
                                text-[10px]
                                font-bold
                                text-white
                            "
                        >
                            {productCount}
                        </span>
                    </div>

                    {/* Grand Total */}
                    <span
                        className="
                            mt-1
                            max-w-full
                            truncate
                            whitespace-nowrap
                            text-xs
                            font-bold
                            text-gray-900
                        "
                    >
                        ₹
                        {formatAmount(
                            pricing.grandTotal
                        )}
                    </span>

                    <span
                        className="
                            mt-0.5
                            text-[10px]
                            text-gray-500
                        "
                    >
                        Summary
                    </span>
                </button>
            </div>

            {/* =====================================================
                BACKDROP
            ====================================================== */}
            {open && (
                <div
                    className="
                        fixed
                        inset-0
                        z-[80]
                        bg-black/40
                        backdrop-blur-[1px]
                    "
                    onClick={() =>
                        setOpen(false)
                    }
                    aria-hidden="true"
                />
            )}

            {/* =====================================================
                SUMMARY MODAL
            ====================================================== */}
            {open && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="bulk-order-summary-title"
                    className="
                        fixed
                        inset-x-3
                        bottom-3
                        z-[90]

                        flex
                        max-h-[calc(100dvh-1.5rem)]
                        flex-col
                        overflow-hidden

                        rounded-2xl
                        border
                        border-gray-200
                        bg-white
                        shadow-2xl

                        sm:inset-x-auto
                        sm:right-4
                        sm:bottom-auto
                        sm:top-1/2
                        sm:w-[380px]
                        sm:max-w-[calc(100vw-2rem)]
                        sm:-translate-y-1/2
                    "
                    onClick={(event) =>
                        event.stopPropagation()
                    }
                >
                    {/* =================================================
                        HEADER
                    ================================================== */}
                    <div
                        className="
                            flex
                            shrink-0
                            items-center
                            justify-between
                            border-b
                            border-gray-200
                            bg-white
                            px-4
                            py-3
                            sm:px-5
                        "
                    >
                        <div className="min-w-0">
                            <h3
                                id="bulk-order-summary-title"
                                className="
                                    truncate
                                    text-base
                                    font-bold
                                    text-gray-900
                                    sm:text-lg
                                "
                            >
                                Order Summary
                            </h3>

                            <p
                                className="
                                    mt-0.5
                                    text-xs
                                    text-gray-500
                                    sm:text-sm
                                "
                            >
                                Your current bulk
                                order
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setOpen(false)
                            }
                            aria-label="Close summary"
                            className="
                                ml-3
                                flex
                                h-8
                                w-8
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                text-gray-500
                                transition
                                hover:bg-gray-100
                                hover:text-gray-800
                                active:scale-95
                            "
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* =================================================
                        SCROLLABLE CONTENT
                    ================================================== */}
                    <div
                        className="
                            min-h-0
                            flex-1
                            overflow-y-auto
                            overscroll-contain
                            [-webkit-overflow-scrolling:touch]
                        "
                    >
                        {/* =================================================
                            QUICK STATS
                        ================================================== */}
                        <div
                            className="
                                grid
                                grid-cols-2
                                gap-3
                                border-b
                                border-gray-100
                                px-4
                                py-3
                                sm:px-5
                            "
                        >
                            {/* Products */}
                            <div
                                className="
                                    min-w-0
                                    rounded-xl
                                    bg-gray-50
                                    px-3
                                    py-2.5
                                "
                            >
                                <div
                                    className="
                                        flex
                                        items-center
                                        gap-2
                                    "
                                >
                                    <Package
                                        size={16}
                                        className="text-primary"
                                    />

                                    <span
                                        className="
                                            text-xs
                                            text-gray-500
                                        "
                                    >
                                        Products
                                    </span>
                                </div>

                                <p
                                    className="
                                        mt-1
                                        text-lg
                                        font-bold
                                        text-gray-900
                                    "
                                >
                                    {productCount}
                                </p>
                            </div>

                            {/* Cartons */}
                            <div
                                className="
                                    min-w-0
                                    rounded-xl
                                    bg-gray-50
                                    px-3
                                    py-2.5
                                "
                            >
                                <div
                                    className="
                                        flex
                                        items-center
                                        gap-2
                                    "
                                >
                                    <ShoppingCart
                                        size={16}
                                        className="text-primary"
                                    />

                                    <span
                                        className="
                                            text-xs
                                            text-gray-500
                                        "
                                    >
                                        Cartons
                                    </span>
                                </div>

                                <p
                                    className="
                                        mt-1
                                        text-lg
                                        font-bold
                                        text-gray-900
                                    "
                                >
                                    {totalCartons}
                                </p>
                            </div>
                        </div>

                        {/* =================================================
                            SELECTED PRODUCTS
                        ================================================== */}
                        <div>
                            {selectedItems.map(
                                (item) => {
                                    const quantity =
                                        Number(
                                            item.quantity ??
                                            0
                                        );

                                    const total =
                                        Number(
                                            item.total ??
                                            0
                                        );

                                    return (
                                        <div
                                            key={
                                                item.productId
                                            }
                                            className="
                                                flex
                                                items-center
                                                justify-between
                                                gap-3
                                                border-b
                                                border-gray-100
                                                px-4
                                                py-3
                                                sm:px-5
                                            "
                                        >
                                            <div
                                                className="
                                                    min-w-0
                                                    flex-1
                                                "
                                            >
                                                <p
                                                    className="
                                                        truncate
                                                        text-sm
                                                        font-semibold
                                                        text-gray-900
                                                    "
                                                >
                                                    {
                                                        item.name
                                                    }
                                                </p>

                                                <p
                                                    className="
                                                        mt-0.5
                                                        text-xs
                                                        text-gray-500
                                                    "
                                                >
                                                    {
                                                        quantity
                                                    }{" "}
                                                    {quantity ===
                                                        1
                                                        ? "Carton"
                                                        : "Cartons"}
                                                </p>
                                            </div>

                                            <span
                                                className="
                                                    shrink-0
                                                    whitespace-nowrap
                                                    text-sm
                                                    font-semibold
                                                    text-gray-900
                                                "
                                            >
                                                ₹
                                                {formatAmount(
                                                    total
                                                )}
                                            </span>
                                        </div>
                                    );
                                }
                            )}
                        </div>

                        {/* =================================================
                            PRICING SUMMARY
                        ================================================== */}
                        <div
                            className="
                                border-t
                                border-gray-200
                                px-4
                                py-3
                                sm:px-5
                            "
                        >
                            {/* Products Total */}
                            <div
                                className="
                                    flex
                                    items-center
                                    justify-between
                                    gap-3
                                    py-1.5
                                "
                            >
                                <span
                                    className="
                                        min-w-0
                                        text-sm
                                        text-gray-600
                                    "
                                >
                                    Products Total
                                </span>

                                <span
                                    className="
                                        shrink-0
                                        whitespace-nowrap
                                        text-sm
                                        font-semibold
                                        text-gray-900
                                    "
                                >
                                    ₹
                                    {formatAmount(
                                        pricing.productsTotal
                                    )}
                                </span>
                            </div>
                            <div
                                className="
                                    flex
                                    items-center
                                    justify-between
                                    gap-3
                                    py-1.5
                                "
                            >
                                <span
                                    className="
                                        min-w-0
                                        text-sm
                                        text-gray-600
                                    "
                                >
                                    CartonBox Total
                                </span>

                                <span
                                    className="
                                        shrink-0
                                        whitespace-nowrap
                                        text-sm
                                        font-semibold
                                        text-gray-900
                                    "
                                >
                                    {
                                        pricing.cartonBoxCount
                                    }
                                </span>
                            </div>


                            {/* Packaging Charge */}
                            {hasPackaging && (
                                <div
                                    className="
                                        flex
                                        items-center
                                        justify-between
                                        gap-3
                                        py-1.5
                                    "
                                >
                                    <span
                                        className="
                                            min-w-0
                                            text-sm
                                            text-gray-600
                                        "
                                    >
                                        Packaging Charge (
                                        {
                                            pricing.packagingPercent
                                        }
                                        %)
                                    </span>

                                    <span
                                        className="
                                            shrink-0
                                            whitespace-nowrap
                                            text-sm
                                            font-semibold
                                            text-gray-900
                                        "
                                    >
                                        ₹
                                        {formatAmount(
                                            pricing.packagingCharge
                                        )}
                                    </span>
                                </div>
                            )}

                            {/* GST */}
                            {hasGst && (
                                <div
                                    className="
                                        flex
                                        items-center
                                        justify-between
                                        gap-3
                                        py-1.5
                                    "
                                >
                                    <span
                                        className="
                                            min-w-0
                                            text-sm
                                            text-gray-600
                                        "
                                    >
                                        GST (
                                        {
                                            gstPercent
                                        }
                                        %)
                                    </span>

                                    <span
                                        className="
                                            shrink-0
                                            whitespace-nowrap
                                            text-sm
                                            font-semibold
                                            text-gray-900
                                        "
                                    >
                                        ₹
                                        {formatAmount(
                                            pricing.gstAmount
                                        )}
                                    </span>
                                </div>
                            )}

                            {/* Divider */}
                            <div
                                className="
                                    my-2
                                    border-t
                                    border-dashed
                                    border-gray-300
                                "
                            />

                            {/* Grand Total */}
                            <div
                                className="
                                    flex
                                    items-center
                                    justify-between
                                    gap-3
                                "
                            >
                                <div className="min-w-0">
                                    <p
                                        className="
                                            flex
                                            items-center
                                            gap-1.5
                                            text-base
                                            font-bold
                                            text-gray-900
                                        "
                                    >
                                        <ReceiptIndianRupee
                                            size={17}
                                        />

                                        <span>
                                            Grand Total
                                        </span>
                                    </p>

                                    <p
                                        className="
                                            mt-0.5
                                            text-xs
                                            text-gray-500
                                        "
                                    >
                                        {
                                            totalDescription
                                        }
                                    </p>
                                </div>

                                <span
                                    className="
                                        shrink-0
                                        whitespace-nowrap
                                        text-xl
                                        font-extrabold
                                        text-[var(--color-primary)]
                                        sm:text-2xl
                                    "
                                >
                                    ₹
                                    {formatAmount(
                                        pricing.grandTotal
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* =================================================
                        FOOTER
                    ================================================== */}
                    {onReview && (
                        <div
                            className="
                                shrink-0
                                border-t
                                border-gray-200
                                bg-white
                                p-3
                                sm:p-4
                            "
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    setOpen(false);
                                    onReview();
                                }}
                                className="
                                    flex
                                    w-full
                                    items-center
                                    justify-center
                                    gap-2
                                    rounded-xl
                                    bg-[var(--color-primary)]
                                    px-4
                                    py-3
                                    text-sm
                                    font-semibold
                                    text-white
                                    transition
                                    hover:opacity-90
                                    active:scale-[0.99]
                                    sm:py-3.5
                                "
                            >
                                <span>
                                    Checkout Order
                                </span>

                                <ChevronRight
                                    size={17}
                                />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

export default memo(
    BulkOrderFloatingSummary
);