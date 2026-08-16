import { memo } from "react";
import type { Product } from "../../types/product";
import defaultImage from "../../assets/default-image.png";

interface Props {
    product: Product;
    quantity: number;
    onIncrease: () => void;
    onDecrease: () => void;
    onChange: (qty: number) => void;
    onProductClick: () => void;
}

function QuickEstimateTableRow({
    product,
    quantity,
    onIncrease,
    onDecrease,
    onChange,
    onProductClick,
}: Props) {
    const availableQty = product.qty || 0;
    const total = product.price * quantity;

    const imageSrc =
        product.image?.trim() || defaultImage;

    const hasPack =
        Number(product.packQuantity) > 0 &&
        Boolean(product.packUnit?.trim());

    return (
        <tr
            className="
                border-b
                border-gray-100
                hover:bg-gray-50
                transition-colors
            "
        >
            {/* =====================================================
                PRODUCT IMAGE
            ===================================================== */}
            <td className="py-2 px-3 w-24">
                <img
                    src={imageSrc}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = defaultImage;
                    }}
                    className="
                        h-11
                        w-11
                        object-contain
                        rounded-md
                        border
                        border-gray-200
                        bg-white
                        p-0.5
                    "
                />
            </td>

            {/* =====================================================
                PRODUCT
            ===================================================== */}
            <td className="py-2 px-3 min-w-[260px]">
                <div className="flex flex-col justify-center min-w-0">

                    {/* Product Name */}
                    <button
                        type="button"
                        onClick={onProductClick}
                        className="
                            w-fit
                            max-w-full
                            text-left
                            text-[17px]
                            font-semibold
                            text-blue-600
                            hover:text-blue-700
                            hover:underline
                            transition-colors
                            leading-5
                            break-words
                        "
                    >
                        {product.name}
                    </button>

                    {/* Discount / Net Rate */}
                    {(product.discountText ||
                        !product.isComboPackage) && (
                            <span
                                className="
                                mt-1
                                w-fit
                                inline-flex
                                items-center
                                rounded-full
                                bg-green-50
                                border
                                border-green-200
                                px-2
                                py-0.5
                                text-[11px]
                                font-semibold
                                text-green-700
                                leading-4
                                whitespace-nowrap
                            "
                            >
                                {product.discountText || "NET RATE"}
                            </span>
                        )}
                </div>
            </td>

            {/* =====================================================
                PACK
            ===================================================== */}
            <td className="py-2 px-3 text-center min-w-[120px]">
                {hasPack ? (
                    <span
                        className="
                            inline-flex
                            items-center
                            justify-center
                            gap-1.5
                            rounded-full
                            bg-gray-100
                            px-3
                            py-1.5
                            text-xs
                            font-semibold
                            text-gray-700
                            whitespace-nowrap
                        "
                    >
                        <span className="text-gray-500">
                            📦
                        </span>

                        <span>
                            {product.packQuantity}{"/"}
                            {product.packUnit}
                        </span>
                    </span>
                ) : (
                    <span className="text-gray-400">
                        -
                    </span>
                )}
            </td>

            {/* =====================================================
                MRP
            ===================================================== */}
            <td className="text-center py-2 px-3 whitespace-nowrap">
                {product.isComboPackage ? (
                    <span className="text-gray-500">
                        ₹{product.price}
                    </span>
                ) : product.originalPrice ? (
                    <span className="line-through text-gray-400">
                        ₹{product.originalPrice}
                    </span>
                ) : (
                    "-"
                )}
            </td>

            {/* =====================================================
                CURRENT PRICE
            ===================================================== */}
            <td className="text-center py-2 px-3 whitespace-nowrap">
                <span
                    className="
                        text-lg
                        font-extrabold
                        text-[var(--color-primary)]
                    "
                >
                    ₹{product.price}
                </span>
            </td>

            {/* =====================================================
                QUANTITY
            ===================================================== */}
            <td className="text-center py-2 px-3">
                {availableQty === 0 ? (
                    <span className="text-red-500 text-sm whitespace-nowrap">
                        Out of Stock
                    </span>
                ) : (
                    <div
                        className="
                            inline-flex
                            items-center
                            border
                            border-gray-200
                            rounded-lg
                            overflow-hidden
                            bg-white
                        "
                    >
                        <button
                            type="button"
                            onClick={onDecrease}
                            className="
                                w-10
                                h-8
                                bg-gray-100
                                hover:bg-gray-200
                                text-lg
                                font-bold
                                transition-colors
                            "
                        >
                            −
                        </button>

                        <input
                            type="number"
                            value={quantity}
                            min={0}
                            step={1}
                            onChange={(e) => {
                                const qty =
                                    Number(e.target.value);

                                if (Number.isNaN(qty)) {
                                    return;
                                }

                                onChange(qty);
                            }}
                            className="
                                w-14
                                h-8
                                text-center
                                outline-none
                                border-x
                                border-gray-200
                                text-sm
                                font-medium
                            "
                        />

                        <button
                            type="button"
                            onClick={onIncrease}
                            className="
                                w-10
                                h-8
                                bg-[var(--color-primary)]
                                text-white
                                hover:opacity-90
                                transition-opacity
                                text-lg
                                font-bold
                            "
                        >
                            +
                        </button>
                    </div>
                )}
            </td>

            {/* =====================================================
                TOTAL
            ===================================================== */}
            <td className="text-right py-2 px-3 whitespace-nowrap">
                <span className="font-bold text-gray-900">
                    ₹{total}
                </span>
            </td>
        </tr>
    );
}

export default memo(QuickEstimateTableRow);