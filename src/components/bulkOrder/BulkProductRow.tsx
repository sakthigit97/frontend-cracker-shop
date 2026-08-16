import { memo, useMemo } from "react";
import { Minus, Plus } from "lucide-react";

import defaultImage from "../../assets/default-image.png";
import type { Product } from "../../types/product";
import type { BulkScheme } from "../../types/bulkOrder";
import { calculateBulkUnitPrice } from "../../utils/bulkPricing";

interface BulkProductRowProps {
    product: Product;
    scheme: BulkScheme;
    quantity: number;
    onQuantityChange: (
        productId: string,
        quantity: number
    ) => void;
}

function BulkProductRow({
    product,
    scheme,
    quantity,
    onQuantityChange,
}: BulkProductRowProps) {
    /* --------------------------------
     * Pricing
     * -------------------------------- */

    const unitPrice = useMemo(
        () =>
            calculateBulkUnitPrice(
                product,
                scheme
            ),
        [product, scheme]
    );

    const cartonQty = Number(
        product.cartonQty || 0
    );

    const total = useMemo(
        () =>
            quantity *
            cartonQty *
            unitPrice,
        [
            quantity,
            cartonQty,
            unitPrice,
        ]
    );

    /* --------------------------------
     * Quantity handlers
     * -------------------------------- */

    const increase = () => {
        onQuantityChange(
            product.id,
            quantity + 1
        );
    };

    const decrease = () => {
        onQuantityChange(
            product.id,
            Math.max(0, quantity - 1)
        );
    };

    const handleQuantityInput = (
        value: string
    ) => {
        if (value === "") {
            onQuantityChange(
                product.id,
                0
            );

            return;
        }

        const parsed = Number(value);

        if (
            !Number.isInteger(parsed) ||
            parsed < 0
        ) {
            return;
        }

        onQuantityChange(
            product.id,
            parsed
        );
    };

    /* --------------------------------
     * Formatting
     * -------------------------------- */

    const formattedUnitPrice =
        unitPrice.toLocaleString("en-IN");

    const formattedCartonQty =
        cartonQty.toLocaleString("en-IN");

    const formattedTotal =
        total.toLocaleString("en-IN");

    /* --------------------------------
     * Image
     * -------------------------------- */

    const productImage =
        product.images?.[0]?.trim() ||
        defaultImage;

    return (
        <>
            {/* =========================================================
                DESKTOP
                ========================================================= */}

            <tr
                className="
                    hidden
                    lg:table-row
                    border-b
                    border-gray-100
                    transition-colors
                    hover:bg-gray-50
                "
            >
                {/* Product */}
                <td
                    className="
                        w-auto
                        min-w-0
                        px-5
                        py-4
                    "
                >
                    <div
                        className="
                            flex
                            min-w-0
                            items-center
                            gap-3
                        "
                    >
                        {/* Image */}
                        <img
                            src={productImage}
                            alt={product.name}
                            className="
                                h-12
                                w-12
                                shrink-0
                                rounded-lg
                                border
                                border-gray-200
                                bg-white
                                object-contain
                                p-1
                            "
                            loading="lazy"
                            onError={(e) => {
                                e.currentTarget.onerror =
                                    null;

                                e.currentTarget.src =
                                    defaultImage;
                            }}
                        />

                        {/* Name */}
                        <div className="min-w-0">
                            <p
                                className="
                                    truncate
                                    text-sm
                                    font-semibold
                                    text-gray-900
                                    xl:text-base
                                "
                                title={product.name}
                            >
                                {product.name}
                            </p>
                        </div>
                    </div>
                </td>

                {/* Carton */}
                <td
                    className="
                        w-[160px]
                        px-4
                        py-4
                        text-center
                    "
                >
                    <div className="flex justify-center">
                        <div
                            className="
                                inline-flex
                                overflow-hidden
                                rounded-md
                                border
                                border-gray-300
                                bg-white
                            "
                        >
                            <button
                                type="button"
                                onClick={decrease}
                                disabled={
                                    quantity === 0
                                }
                                aria-label={`Decrease cartons for ${product.name}`}
                                className="
                                    flex
                                    h-9
                                    w-9
                                    shrink-0
                                    items-center
                                    justify-center
                                    border-r
                                    border-gray-300
                                    bg-gray-100
                                    text-gray-700
                                    transition
                                    hover:bg-gray-200
                                    disabled:cursor-not-allowed
                                    disabled:opacity-40
                                "
                            >
                                <Minus
                                    size={14}
                                />
                            </button>

                            <input
                                type="number"
                                min={0}
                                step={1}
                                value={quantity}
                                onChange={(e) =>
                                    handleQuantityInput(
                                        e.target.value
                                    )
                                }
                                aria-label={`Carton quantity for ${product.name}`}
                                className="
                                    h-9
                                    w-12
                                    border-0
                                    bg-white
                                    text-center
                                    text-sm
                                    font-semibold
                                    text-gray-900
                                    outline-none
                                    focus:ring-0
                                "
                            />

                            <button
                                type="button"
                                onClick={increase}
                                aria-label={`Increase cartons for ${product.name}`}
                                className="
                                    flex
                                    h-9
                                    w-9
                                    shrink-0
                                    items-center
                                    justify-center
                                    border-l
                                    border-primary
                                    bg-primary
                                    text-white
                                    transition
                                    hover:opacity-90
                                "
                            >
                                <Plus
                                    size={14}
                                />
                            </button>
                        </div>
                    </div>
                </td>

                {/* Carton Content */}
                <td
                    className="
                        w-[150px]
                        px-4
                        py-4
                        text-center
                    "
                >
                    <span
                        className="
                            whitespace-nowrap
                            text-sm
                            text-gray-600
                        "
                    >
                        {formattedCartonQty}{" "}
                        {product.packUnit}
                    </span>
                </td>

                {/* Price */}
                <td
                    className="
                        w-[120px]
                        px-4
                        py-4
                        text-right
                    "
                >
                    <span
                        className="
                            whitespace-nowrap
                            text-sm
                            font-semibold
                            text-gray-800
                        "
                    >
                        ₹{formattedUnitPrice}
                    </span>
                </td>

                {/* Total */}
                <td
                    className="
                        w-[150px]
                        px-5
                        py-4
                        text-right
                    "
                >
                    {quantity > 0 ? (
                        <span
                            className="
                                whitespace-nowrap
                                text-lg
                                font-bold
                                text-gray-900
                            "
                        >
                            ₹{formattedTotal}
                        </span>
                    ) : (
                        <span
                            className="
                                whitespace-nowrap
                                text-sm
                                text-gray-400
                            "
                        >
                            Select quantity
                        </span>
                    )}
                </td>
            </tr>

            {/* =========================================================
                MOBILE / TABLET
                ========================================================= */}

            <tr className="lg:hidden">
                <td
                    colSpan={5}
                    className="
                        border-b
                        border-gray-100
                        p-0
                    "
                >
                    <div
                        className="
                            w-full
                            px-3
                            py-4
                            sm:px-4
                            sm:py-4
                        "
                    >
                        {/* Product */}
                        <div
                            className="
                                flex
                                min-w-0
                                items-center
                                gap-3
                            "
                        >
                            {/* Image */}
                            <img
                                src={productImage}
                                alt={product.name}
                                className="
                                    h-12
                                    w-12
                                    shrink-0
                                    rounded-lg
                                    border
                                    border-gray-200
                                    bg-white
                                    object-contain
                                    p-1
                                    sm:h-14
                                    sm:w-14
                                "
                                loading="lazy"
                                onError={(e) => {
                                    e.currentTarget.onerror =
                                        null;

                                    e.currentTarget.src =
                                        defaultImage;
                                }}
                            />

                            {/* Product name */}
                            <div className="min-w-0 flex-1">
                                <p
                                    className="
                                        truncate
                                        text-sm
                                        font-semibold
                                        text-gray-900
                                        sm:text-base
                                    "
                                    title={
                                        product.name
                                    }
                                >
                                    {product.name}
                                </p>
                            </div>
                        </div>

                        {/* Mobile details */}
                        <div
                            className="
                                mt-4
                                grid
                                grid-cols-2
                                gap-3
                                border-t
                                border-gray-100
                                pt-4
                                sm:grid-cols-4
                                sm:items-end
                            "
                        >
                            {/* Carton */}
                            <div className="min-w-0">
                                <p
                                    className="
                                        mb-1.5
                                        text-[11px]
                                        font-medium
                                        uppercase
                                        tracking-wide
                                        text-gray-500
                                    "
                                >
                                    Carton
                                </p>

                                <div
                                    className="
                                        flex
                                        w-fit
                                        overflow-hidden
                                        rounded-md
                                        border
                                        border-gray-300
                                        bg-white
                                    "
                                >
                                    <button
                                        type="button"
                                        onClick={
                                            decrease
                                        }
                                        disabled={
                                            quantity ===
                                            0
                                        }
                                        aria-label={`Decrease cartons for ${product.name}`}
                                        className="
                                            flex
                                            h-9
                                            w-9
                                            shrink-0
                                            items-center
                                            justify-center
                                            border-r
                                            border-gray-300
                                            bg-gray-100
                                            text-gray-700
                                            disabled:cursor-not-allowed
                                            disabled:opacity-40
                                        "
                                    >
                                        <Minus
                                            size={14}
                                        />
                                    </button>

                                    <input
                                        type="number"
                                        min={0}
                                        step={1}
                                        value={
                                            quantity
                                        }
                                        onChange={(e) =>
                                            handleQuantityInput(
                                                e.target
                                                    .value
                                            )
                                        }
                                        aria-label={`Carton quantity for ${product.name}`}
                                        className="
                                            h-9
                                            w-12
                                            border-0
                                            bg-white
                                            text-center
                                            text-sm
                                            font-semibold
                                            text-gray-900
                                            outline-none
                                            focus:ring-0
                                        "
                                    />

                                    <button
                                        type="button"
                                        onClick={
                                            increase
                                        }
                                        aria-label={`Increase cartons for ${product.name}`}
                                        className="
                                            flex
                                            h-9
                                            w-9
                                            shrink-0
                                            items-center
                                            justify-center
                                            border-l
                                            border-primary
                                            bg-primary
                                            text-white
                                        "
                                    >
                                        <Plus
                                            size={14}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Carton content */}
                            <div
                                className="
                                    min-w-0
                                    text-right
                                    sm:text-center
                                "
                            >
                                <p
                                    className="
                                        text-[11px]
                                        font-medium
                                        uppercase
                                        tracking-wide
                                        text-gray-500
                                    "
                                >
                                    Carton Content
                                </p>

                                <p
                                    className="
                                        mt-1
                                        whitespace-nowrap
                                        text-sm
                                        font-medium
                                        text-gray-700
                                    "
                                >
                                    {formattedCartonQty}{" "}
                                    {
                                        product.packUnit
                                    }
                                </p>
                            </div>

                            {/* Price */}
                            <div
                                className="
                                    min-w-0
                                    text-left
                                    sm:text-center
                                "
                            >
                                <p
                                    className="
                                        text-[11px]
                                        font-medium
                                        uppercase
                                        tracking-wide
                                        text-gray-500
                                    "
                                >
                                    Price
                                </p>

                                <p
                                    className="
                                        mt-1
                                        whitespace-nowrap
                                        text-sm
                                        font-semibold
                                        text-gray-800
                                    "
                                >
                                    ₹
                                    {
                                        formattedUnitPrice
                                    }
                                </p>
                            </div>

                            {/* Total */}
                            <div
                                className="
                                    min-w-0
                                    text-right
                                "
                            >
                                <p
                                    className="
                                        text-[11px]
                                        font-medium
                                        uppercase
                                        tracking-wide
                                        text-gray-500
                                    "
                                >
                                    Total
                                </p>

                                {quantity > 0 ? (
                                    <p
                                        className="
                                            mt-1
                                            whitespace-nowrap
                                            text-lg
                                            font-bold
                                            text-primary
                                        "
                                    >
                                        ₹
                                        {
                                            formattedTotal
                                        }
                                    </p>
                                ) : (
                                    <p
                                        className="
                                            mt-1
                                            text-xs
                                            text-gray-400
                                        "
                                    >
                                        Select quantity
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        </>
    );
}

export default memo(
    BulkProductRow
);