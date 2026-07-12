import { memo } from "react";
import type { Product } from "../../types/product";
import defaultImage from "../../assets/default-image.png";


interface Props {
    product: Product;
    quantity: number;
    onIncrease: () => void;
    onDecrease: () => void;
    onChange: (qty: number) => void;
}

function QuickEstimateTableRow({
    product,
    quantity,
    onIncrease,
    onDecrease,
    onChange,
}: Props) {
    const availableQty = product.qty || 0;

    const total = product.price * quantity;

    return (
        <tr className="border-b hover:bg-gray-50">

            <td className="p-2 w-24">

                <img
                    src={product.image || defaultImage}
                    className="h-14 w-14 object-contain rounded-md border bg-white"
                />

            </td>

            <td className="p-2">

                <div className="font-semibold">
                    {product.name}
                </div>

                {product.brand && (
                    <div className="text-xs text-gray-500 mt-1">
                        {product.brand}
                    </div>
                )}

                {product.discountText && (
                    <span
                        className="
                        inline-block
                        mt-2
                        px-1
                        py-1
                        rounded-full
                        text-xs
                        bg-green-100
                        text-green-700
                    "
                    >
                        {product.discountText}
                    </span>
                )}

            </td>

            <td className="text-center p-2">

                {product.originalPrice ? (

                    <span className="line-through text-gray-400">

                        ₹{product.originalPrice}

                    </span>

                ) : (

                    "-"

                )}

            </td>

            <td className="text-center p-2">

                <span className="font-bold text-[var(--color-primary)]">

                    ₹{product.price}

                </span>

            </td>

            <td className="text-center p-2">

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
                                h-10
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

                                const qty =
                                    Number(e.target.value);

                                if (
                                    Number.isNaN(qty)
                                )
                                    return;

                                onChange(qty);

                            }}
                            className="
                                w-14
                                h-10
                                text-center
                                outline-none
                                border-x
                            "
                        />

                        <button
                            onClick={onIncrease}
                            className="
                                w-10
                                h-10
                                bg-[var(--color-primary)]
                                text-white
                            "
                        >
                            +
                        </button>

                    </div>

                )}

            </td>

            <td className="text-right p-2">

                <span className="font-bold">

                    ₹{total}

                </span>

            </td>

        </tr>
    );
}

export default memo(QuickEstimateTableRow);