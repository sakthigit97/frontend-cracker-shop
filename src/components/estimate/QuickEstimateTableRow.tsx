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

    return (
        <tr className="border-b hover:bg-gray-50">

            <td className="py-2 px-3 w-24">
                <img
                    src={product.image || defaultImage}
                    alt={product.name}
                    className="
                        h-11
                        w-11
                        object-contain
                        rounded-md
                        border
                        bg-white
                        p-0.5
                    "
                />
            </td>
            <td className="py-2 px-3">

                <div className="flex flex-col justify-center">

                    <button
                        type="button"
                        onClick={onProductClick}
                        className="
                w-fit
                text-left
                text-[17px]
                font-semibold
                text-blue-600
                hover:text-blue-700
                hover:underline
                transition-colors
                leading-5
            "
                    >
                        {product.name}
                    </button>

                    <div className="flex items-center gap-2 mt-1">

                        {(product.discountText || !product.isComboPackage) && (
                            <span
                                className="
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
                                "
                            >
                                {product.discountText || "NET RATE"}
                            </span>
                        )}

                        {product.brand && (
                            <span className="text-[11px] text-gray-500">
                                {product.brand}
                            </span>
                        )}

                    </div>

                </div>

            </td>

            <td className="text-center py-2 px-3">
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

            <td className="text-center py-2 px-3">
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

            <td className="text-center py-2 px-3">

                {availableQty === 0 ? (

                    <span className="text-red-500 text-sm">
                        Out of Stock
                    </span>

                ) : (

                    <div
                        className="
                            inline-flex
                            items-center
                            border
                            rounded-lg
                            overflow-hidden
                        "
                    >

                        <button
                            onClick={onDecrease}
                            className="
                                w-10
                                h-8
                                bg-gray-100
                                hover:bg-gray-200
                                text-lg
                                font-bold
                            "
                        >
                            −
                        </button>

                        <input
                            value={quantity}
                            min={0}
                            step={1}
                            onChange={(e) => {
                                const qty = Number(e.target.value);

                                if (Number.isNaN(qty)) return;

                                onChange(qty);
                            }}
                            className="
                                w-14
                                h-8
                                text-center
                                outline-none
                                border-x
                            "
                        />

                        <button
                            onClick={onIncrease}
                            className="
                                w-10
                                h-8
                                bg-[var(--color-primary)]
                                text-white
                            "
                        >
                            +
                        </button>

                    </div>

                )}

            </td>

            <td className="text-right py-2 px-3">

                <span className="font-bold">
                    ₹{total}
                </span>

            </td>

        </tr>
    );
}

export default memo(QuickEstimateTableRow);