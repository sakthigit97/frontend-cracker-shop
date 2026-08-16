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
            <div
                className="
                    hidden
                    lg:block
                    w-full
                    max-h-[70vh]
                    overflow-auto
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    shadow-sm
                    scrollbar-hide
                "
            >
                <table className="w-full min-w-[1050px] border-collapse">
                    {/* =================================================
                        FIXED / STICKY HEADER
                        ================================================= */}
                    <thead
                        className="
                            sticky
                            top-0
                            z-30
                        "
                    >
                        <tr className="bg-[var(--color-primary)] text-white">
                            <th
                                className="
                                    text-left
                                    px-4
                                    py-3
                                    w-24
                                    whitespace-nowrap
                                    font-semibold
                                "
                            >
                                Image
                            </th>

                            <th
                                className="
                                    text-left
                                    px-4
                                    py-3
                                    min-w-[320px]
                                    font-semibold
                                "
                            >
                                Product
                            </th>

                            <th
                                className="
                                    text-center
                                    px-4
                                    py-3
                                    w-36
                                    whitespace-nowrap
                                    font-semibold
                                "
                            >
                                Unit
                            </th>

                            <th
                                className="
                                    text-center
                                    px-4
                                    py-3
                                    w-28
                                    whitespace-nowrap
                                    font-semibold
                                "
                            >
                                MRP
                            </th>

                            <th
                                className="
                                    text-center
                                    px-4
                                    py-3
                                    w-28
                                    whitespace-nowrap
                                    font-semibold
                                "
                            >
                                Price
                            </th>

                            <th
                                className="
                                    text-center
                                    px-4
                                    py-3
                                    w-48
                                    whitespace-nowrap
                                    font-semibold
                                "
                            >
                                Quantity
                            </th>

                            <th
                                className="
                                    text-right
                                    px-4
                                    py-3
                                    w-32
                                    whitespace-nowrap
                                    font-semibold
                                "
                            >
                                Total
                            </th>
                        </tr>
                    </thead>

                    {/* =================================================
                        PRODUCTS
                        ================================================= */}
                    <tbody>
                        {groupedProducts.map((group) => (
                            <Fragment key={group.categoryId}>
                                {/* =====================================
                                    CATEGORY HEADER
                                    ===================================== */}
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="
                                            pt-2
                                            pb-1
                                            bg-white
                                        "
                                    >
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
                                            {/* Left Icon */}
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

                                            {/* Category Name */}
                                            <div className="flex justify-center px-20">
                                                <span
                                                    className="
                                                        uppercase
                                                        font-bold
                                                        tracking-wider
                                                        text-[15px]
                                                        text-center
                                                    "
                                                >
                                                    {group.categoryName}
                                                </span>
                                            </div>

                                            {/* Item Count */}
                                            <span
                                                className="
                                                    absolute
                                                    right-4
                                                    top-1/2
                                                    -translate-y-1/2
                                                    text-xs
                                                    text-slate-300
                                                    whitespace-nowrap
                                                "
                                            >
                                                {group.products.length} Items
                                            </span>
                                        </div>
                                    </td>
                                </tr>

                                {/* =====================================
                                    PRODUCTS
                                    ===================================== */}
                                {group.products.map((product) => {
                                    const qty = Number(
                                        items[product.id] ?? 0
                                    );

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
                                                if (qty <= 1) {
                                                    removeItem(product.id);
                                                } else {
                                                    addItem(
                                                        product.id,
                                                        -1
                                                    );
                                                }
                                            }}
                                            onChange={(newQty) => {
                                                if (newQty <= 0) {
                                                    removeItem(product.id);
                                                    return;
                                                }

                                                addItem(
                                                    product.id,
                                                    newQty - qty
                                                );
                                            }}
                                        />
                                    );
                                })}
                            </Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* =========================================================
                MOBILE
                ========================================================= */}
            <div className="lg:hidden space-y-5">
                {groupedProducts.map((group) => (
                    <Fragment key={group.categoryId}>
                        {/* Category Header */}
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

                            <p
                                className="
                                    text-center
                                    text-slate-300
                                    text-xs
                                    mt-1
                                "
                            >
                                {group.products.length} Products
                            </p>
                        </div>

                        {/* Mobile Products */}
                        <div className="space-y-3">
                            {group.products.map((product) => {
                                const qty = Number(
                                    items[product.id] ?? 0
                                );

                                return (
                                    <div
                                        key={product.id}
                                        className="
                                            bg-white
                                            rounded-xl
                                            border
                                            border-gray-200
                                            shadow-sm
                                            p-3
                                        "
                                    >
                                        {/* Product */}
                                        <div
                                            className="
                                                flex
                                                gap-3
                                                cursor-pointer
                                            "
                                            onClick={() =>
                                                onProductClick(product.id)
                                            }
                                        >
                                            <img
                                                src={
                                                    product.image?.trim() ||
                                                    defaultImage
                                                }
                                                alt={product.name}
                                                loading="lazy"
                                                decoding="async"
                                                onError={(e) => {
                                                    e.currentTarget.onerror =
                                                        null;
                                                    e.currentTarget.src =
                                                        defaultImage;
                                                }}
                                                className="
                                                    h-11
                                                    w-11
                                                    shrink-0
                                                    object-contain
                                                    border
                                                    border-gray-200
                                                    rounded-md
                                                    bg-white
                                                "
                                            />

                                            <div className="flex-1 min-w-0">
                                                {/* Product Name */}
                                                <span
                                                    className="
                                                        block
                                                        text-sm
                                                        font-semibold
                                                        text-blue-600
                                                        hover:text-blue-700
                                                        hover:underline
                                                        break-words
                                                    "
                                                >
                                                    {product.name}
                                                </span>

                                                {/* Pack */}
                                                {Number(
                                                    product.packQuantity
                                                ) > 0 &&
                                                    product.packUnit?.trim() && (
                                                        <div className="mt-1">
                                                            <span
                                                                className="
                                                                    inline-flex
                                                                    items-center
                                                                    rounded-full
                                                                    bg-gray-100
                                                                    px-2
                                                                    py-0.5
                                                                    text-[11px]
                                                                    font-semibold
                                                                    text-gray-700
                                                                    whitespace-nowrap
                                                                "
                                                            >
                                                                📦{" "}
                                                                {
                                                                    product.packQuantity
                                                                }{"/"}
                                                                {
                                                                    product.packUnit
                                                                }
                                                            </span>
                                                        </div>
                                                    )}

                                                {/* Discount */}
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
                                                            {product.discountText ||
                                                                "NET RATE"}
                                                        </span>
                                                    )}

                                                    {product.isComboPackage &&
                                                        product.discountText && (
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
                                                                {
                                                                    product.discountText
                                                                }
                                                            </span>
                                                        )}
                                                </div>

                                                {/* Price */}
                                                <div className="mt-2">
                                                    <span className="font-bold text-[var(--color-primary)]">
                                                        ₹
                                                        {product.price.toLocaleString(
                                                            "en-IN"
                                                        )}
                                                    </span>

                                                    {product.originalPrice && (
                                                        <span className="ml-2 text-xs line-through text-gray-400">
                                                            ₹
                                                            {product.originalPrice.toLocaleString(
                                                                "en-IN"
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quantity + Total */}
                                        <div
                                            className="
                                                flex
                                                justify-between
                                                items-center
                                                mt-3
                                            "
                                        >
                                            <div
                                                className="
                                                    inline-flex
                                                    border
                                                    border-gray-200
                                                    rounded-lg
                                                    overflow-hidden
                                                "
                                            >
                                                <button
                                                    type="button"
                                                    className="
                                                        w-10
                                                        h-10
                                                        bg-gray-100
                                                        hover:bg-gray-200
                                                    "
                                                    onClick={() => {
                                                        if (qty <= 1) {
                                                            removeItem(
                                                                product.id
                                                            );
                                                        } else {
                                                            addItem(
                                                                product.id,
                                                                -1
                                                            );
                                                        }
                                                    }}
                                                >
                                                    −
                                                </button>

                                                <input
                                                    type="number"
                                                    min={0}
                                                    step={1}
                                                    className="
                                                        w-12
                                                        text-center
                                                        border-x
                                                        border-gray-200
                                                        outline-none
                                                    "
                                                    value={qty}
                                                    onChange={(e) => {
                                                        const value =
                                                            Number(
                                                                e.target.value
                                                            );

                                                        if (
                                                            Number.isNaN(
                                                                value
                                                            )
                                                        ) {
                                                            return;
                                                        }

                                                        if (value <= 0) {
                                                            removeItem(
                                                                product.id
                                                            );
                                                            return;
                                                        }

                                                        addItem(
                                                            product.id,
                                                            value - qty
                                                        );
                                                    }}
                                                />

                                                <button
                                                    type="button"
                                                    className="
                                                        w-10
                                                        h-10
                                                        bg-[var(--color-primary)]
                                                        text-white
                                                        hover:opacity-90
                                                    "
                                                    onClick={() =>
                                                        addItem(
                                                            product.id,
                                                            1
                                                        )
                                                    }
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <div className="font-bold text-gray-900">
                                                ₹
                                                {(
                                                    product.price * qty
                                                ).toLocaleString(
                                                    "en-IN"
                                                )}
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