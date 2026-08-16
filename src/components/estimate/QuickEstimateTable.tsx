import { quickEstimateStore } from "../../store/quickEstimate.store";
import type { Product } from "../../types/product";
import QuickEstimateTableRow from "./QuickEstimateTableRow";
import defaultImage from "../../assets/default-image.png";
import { Fragment } from "react";

interface ProductGroup {
    categoryId: string;
    categoryName: string;
    sortOrder: number;
    products: Product[];
}

interface Props {
    groupedProducts: ProductGroup[];
    onProductClick: (id: string) => void;
}

export default function QuickEstimateTable({
    groupedProducts,
    onProductClick,
}: Props) {
    const items = quickEstimateStore((s) => s.items);
    const addItem = quickEstimateStore((s) => s.addItem);
    const removeItem = quickEstimateStore((s) => s.removeItem);

    return (

        <div className="w-full">
            <div className="hidden lg:block overflow-x-auto rounded-xl border bg-white shadow-sm">

                <table className="w-full">

                    <thead>

                        <tr className="bg-[var(--color-primary)] text-white">

                            <th className="text-left p-4 w-24">
                                Image
                            </th>

                            <th className="text-left p-4">
                                Product
                            </th>

                            <th className="text-center p-4 w-28">
                                MRP
                            </th>

                            <th className="text-center p-4 w-28">
                                Price
                            </th>

                            <th className="text-center p-4 w-48">
                                Quantity
                            </th>

                            <th className="text-right p-4 w-32">
                                Total
                            </th>

                        </tr>

                    </thead>

                    <tbody>
                        {groupedProducts.map((group) => (
                            <Fragment key={group.categoryId}>
                                <tr>
                                    <td colSpan={6} className="pt-2 pb-1">

                                        <div
                                            className="
                                                relative
                                                bg-slate-800
                                                text-white
                                                rounded-md
                                                py-2
                                                px-4
                                                shadow-sm
                                            "
                                        >

                                            <span
                                                className="
                                                absolute
                                                left-4
                                                top-1/2
                                                -translate-y-1/2
                                                text-orange-400
                                                text-lg
                                            "
                                            >
                                                ✦
                                            </span>

                                            <div className="flex justify-center">
                                                <span
                                                    className="
                                                    uppercase
                                                    font-bold
                                                    tracking-wider
                                                    text-[15px]
                                                "
                                                >
                                                    {group.categoryName}
                                                </span>
                                            </div>

                                            <span
                                                className="
                                                absolute
                                                right-4
                                                top-1/2
                                                -translate-y-1/2
                                                text-xs
                                                text-slate-300
                                            "
                                            >
                                                {group.products.length} Items
                                            </span>

                                        </div>

                                    </td>
                                </tr>
                                {group.products.map((product) => {
                                    const qty = Number(items[product.id] ?? 0);
                                    return (
                                        <QuickEstimateTableRow
                                            key={product.id}
                                            product={product}
                                            quantity={qty}
                                            onProductClick={() =>
                                                onProductClick(product.id)
                                            }
                                            onIncrease={() =>
                                                addItem(product.id, 1)
                                            }
                                            onDecrease={() => {
                                                if (qty <= 1)
                                                    removeItem(product.id);
                                                else
                                                    addItem(product.id, -1);
                                            }}
                                            onChange={(newQty) => {
                                                if (newQty <= 0) {
                                                    removeItem(product.id);
                                                    return;
                                                }

                                                addItem(product.id, newQty - qty);
                                            }}
                                        />
                                    );
                                })}
                            </Fragment>
                        ))}
                    </tbody>

                </table>

            </div>
            <div className="lg:hidden space-y-5">

                {groupedProducts.map((group) => (
                    <Fragment key={group.categoryId}>
                        <div
                            className="
        bg-slate-800
        rounded-xl
        px-4
        py-3
        mb-3
        shadow
    "
                        >
                            <h3
                                className="
            text-center
            text-white
            font-bold
            uppercase
            tracking-wider
            text-sm
        "
                            >
                                {group.categoryName}
                            </h3>

                            <p className="text-center text-slate-300 text-xs mt-1">
                                {group.products.length} Products
                            </p>
                        </div>

                        <div className="space-y-3">

                            {group.products.map((product) => {

                                const qty = Number(items[product.id] ?? 0);

                                return (

                                    <div
                                        key={product.id}
                                        className="
                                bg-white
                                rounded-xl
                                border
                                shadow-sm
                                p-3
                            "
                                    >

                                        <div
                                            className="
                                                flex
                                                gap-3
                                                cursor-pointer
                                            "
                                            onClick={() => onProductClick(product.id)}
                                        >

                                            <img
                                                src={product.image?.trim() || defaultImage}
                                                alt={product.name}
                                                onError={(e) => {
                                                    e.currentTarget.onerror = null;
                                                    e.currentTarget.src = defaultImage;
                                                }}
                                                className="h-11 w-11 object-contain border rounded-md"
                                            />

                                            <div className="flex-1">

                                                <span
                                                    className="
                                            inline-block
                                            text-sm
                                            font-semibold
                                            text-blue-600
                                            hover:text-blue-700
                                            hover:underline
                                            cursor-pointer
                                            transition-colors
                                        "
                                                >
                                                    {product.name}
                                                </span>

                                                {Number(product.packQuantity) > 0 &&
                                                    product.packUnit?.trim() && (
                                                        <div className="mt-1">
                                                            <span className="
                                                                    inline-flex
                                                                    items-center
                                                                    rounded-full
                                                                    bg-gray-100
                                                                    px-2 py-0.5
                                                                    text-[11px]
                                                                    font-semibold
                                                                    text-gray-700
                                                                ">
                                                                📦 {product.packQuantity} {product.packUnit}
                                                            </span>
                                                        </div>
                                                    )}

                                                <div className="mt-1 min-h-[20px]">
                                                    {!product.isComboPackage && (
                                                        <span
                                                            className="
                                                                inline-flex
                                                                items-center
                                                                rounded-full
                                                                bg-green-100
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

                                                    {product.isComboPackage && product.discountText && (
                                                        <span
                                                            className="
                                                                inline-flex
                                                                items-center
                                                                rounded-full
                                                                bg-green-100
                                                                px-2
                                                                py-0.5
                                                                text-[11px]
                                                                font-semibold
                                                                text-green-700
                                                            "
                                                        >
                                                            {product.discountText}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="mt-2">
                                                    <span className="font-bold text-[var(--color-primary)]">
                                                        ₹{product.price}
                                                    </span>

                                                    {product.originalPrice && (
                                                        <span className="ml-2 text-xs line-through text-gray-400">
                                                            ₹{product.originalPrice}
                                                        </span>
                                                    )}

                                                </div>

                                            </div>

                                        </div>

                                        <div className="flex justify-between items-center mt-3">

                                            <div
                                                className="
                                        inline-flex
                                        border
                                        rounded-lg
                                        overflow-hidden
                                    "
                                            >

                                                <button
                                                    className="w-10 h-10 bg-gray-100"
                                                    onClick={() => {

                                                        if (qty <= 1)
                                                            removeItem(product.id);
                                                        else
                                                            addItem(product.id, -1);

                                                    }}
                                                >
                                                    −
                                                </button>

                                                <input
                                                    className="w-12 text-center border-x"
                                                    value={qty}
                                                    onChange={(e) => {

                                                        const value = Number(e.target.value);

                                                        if (Number.isNaN(value))
                                                            return;

                                                        if (value <= 0) {
                                                            removeItem(product.id);
                                                            return;
                                                        }

                                                        addItem(
                                                            product.id,
                                                            value - qty
                                                        );

                                                    }}
                                                />

                                                <button
                                                    className="
                                            w-10
                                            h-10
                                            bg-[var(--color-primary)]
                                            text-white
                                        "
                                                    onClick={() =>
                                                        addItem(product.id, 1)
                                                    }
                                                >
                                                    +
                                                </button>

                                            </div>

                                            <div className="font-bold">
                                                ₹{product.price * qty}
                                            </div>

                                        </div>

                                    </div>

                                );

                            })}
                        </div>
                    </Fragment>
                ))}
            </div>
        </div>
    );

}