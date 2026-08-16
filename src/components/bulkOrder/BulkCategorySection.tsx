import { memo, useMemo, useState } from "react";
import {
    ChevronDown,
    ChevronRight,
} from "lucide-react";

import BulkProductRow from "./BulkProductRow";

import type { Product } from "../../types/product";
import type {
    BulkOrderProduct,
    BulkScheme,
} from "../../types/bulkOrder";

interface BulkCategorySectionProps {
    categoryName: string;
    products: Product[];
    scheme: BulkScheme;
    items: BulkOrderProduct[];
    onQuantityChange: (
        productId: string,
        quantity: number
    ) => void;
}

function BulkCategorySection({
    categoryName,
    products,
    scheme,
    items,
    onQuantityChange,
}: BulkCategorySectionProps) {
    const [expanded, setExpanded] =
        useState(true);

    /* --------------------------------
     * Items lookup
     * -------------------------------- */

    const itemsByProductId = useMemo(() => {
        return new Map(
            items.map((item) => [
                item.productId,
                item,
            ])
        );
    }, [items]);

    /* --------------------------------
     * Selected product count
     * -------------------------------- */

    const selectedItems = useMemo(() => {
        return products.reduce(
            (count, product) => {
                const item =
                    itemsByProductId.get(
                        product.id
                    );

                return (
                    (item?.quantity ?? 0) > 0
                        ? count + 1
                        : count
                );
            },
            0
        );
    }, [
        products,
        itemsByProductId,
    ]);

    return (
        <section
            className="
                w-full
                overflow-hidden
                rounded-xl
                border
                border-gray-200
                bg-white
            "
        >
            {/* =====================================================
                CATEGORY HEADER
                ===================================================== */}

            <button
                type="button"
                onClick={() =>
                    setExpanded(
                        (previous) =>
                            !previous
                    )
                }
                aria-expanded={expanded}
                className="
                    flex
                    w-full
                    items-center
                    justify-between
                    gap-3
                    bg-slate-800
                    px-3
                    py-3
                    text-white
                    transition
                    hover:bg-slate-700
                    sm:px-4
                    sm:py-3.5
                "
            >
                {/* Left */}
                <div
                    className="
                        flex
                        min-w-0
                        flex-1
                        items-center
                        gap-2.5
                        sm:gap-3
                    "
                >
                    {/* Indicator */}
                    <span
                        className="
                            h-2
                            w-2
                            shrink-0
                            rounded-full
                            bg-yellow-400
                            sm:h-2.5
                            sm:w-2.5
                        "
                    />

                    {/* Category information */}
                    <div
                        className="
                            min-w-0
                            flex-1
                            text-left
                        "
                    >
                        <div
                            className="
                                flex
                                min-w-0
                                flex-wrap
                                items-baseline
                                gap-x-3
                                gap-y-0.5
                            "
                        >
                            <h3
                                className="
                                    min-w-0
                                    truncate
                                    text-sm
                                    font-semibold
                                    uppercase
                                    leading-5
                                    sm:text-base
                                    lg:text-lg
                                "
                            >
                                {categoryName}
                            </h3>

                            <span
                                className="
                                    shrink-0
                                    text-[11px]
                                    leading-4
                                    text-slate-300
                                    sm:text-xs
                                    lg:text-sm
                                "
                            >
                                {products.length}{" "}
                                {products.length === 1
                                    ? "Product"
                                    : "Products"}

                                {selectedItems > 0 && (
                                    <>
                                        {" "}
                                        •{" "}
                                        {
                                            selectedItems
                                        }{" "}
                                        Selected
                                    </>
                                )}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Expand icon */}
                {expanded ? (
                    <ChevronDown
                        className="
                            h-5
                            w-5
                            shrink-0
                            sm:h-6
                            sm:w-6
                        "
                    />
                ) : (
                    <ChevronRight
                        className="
                            h-5
                            w-5
                            shrink-0
                            sm:h-6
                            sm:w-6
                        "
                    />
                )}
            </button>

            {/* =====================================================
                PRODUCTS
                ===================================================== */}

            {expanded && (
                <div className="w-full">

                    <table
                        className="
                            w-full
                            table-fixed
                            border-collapse
                        "
                    >
                        {/* =================================================
                            COLUMN HEADER

                            Hidden on mobile because BulkProductRow
                            uses its own responsive mobile layout.
                            ================================================= */}

                        <thead
                            className="
                                hidden
                                lg:table-header-group
                            "
                        >
                            <tr
                                className="
                                    border-b
                                    border-gray-200
                                    bg-gray-50
                                "
                            >
                                {/* Product */}
                                <th
                                    scope="col"
                                    className="
                                        px-5
                                        py-3
                                        text-left
                                        text-xs
                                        font-semibold
                                        uppercase
                                        tracking-wide
                                        text-gray-600
                                    "
                                >
                                    Product
                                </th>

                                {/* Carton */}
                                <th
                                    scope="col"
                                    className="
                                        w-[160px]
                                        px-4
                                        py-3
                                        text-center
                                        text-xs
                                        font-semibold
                                        uppercase
                                        tracking-wide
                                        text-gray-600
                                    "
                                >
                                    Carton
                                </th>

                                {/* Carton Content */}
                                <th
                                    scope="col"
                                    className="
                                        w-[150px]
                                        px-4
                                        py-3
                                        text-center
                                        text-xs
                                        font-semibold
                                        uppercase
                                        tracking-wide
                                        text-gray-600
                                    "
                                >
                                    Carton Content
                                </th>

                                {/* Price */}
                                <th
                                    scope="col"
                                    className="
                                        w-[120px]
                                        px-4
                                        py-3
                                        text-right
                                        text-xs
                                        font-semibold
                                        uppercase
                                        tracking-wide
                                        text-gray-600
                                    "
                                >
                                    Price
                                </th>

                                {/* Total */}
                                <th
                                    scope="col"
                                    className="
                                        w-[150px]
                                        px-5
                                        py-3
                                        text-right
                                        text-xs
                                        font-semibold
                                        uppercase
                                        tracking-wide
                                        text-gray-600
                                    "
                                >
                                    Total
                                </th>
                            </tr>
                        </thead>

                        {/* =================================================
                            PRODUCT ROWS
                            ================================================= */}

                        <tbody>
                            {products.map(
                                (product) => {
                                    const item =
                                        itemsByProductId.get(
                                            product.id
                                        );

                                    return (
                                        <BulkProductRow
                                            key={
                                                product.id
                                            }
                                            product={
                                                product
                                            }
                                            scheme={
                                                scheme
                                            }
                                            quantity={
                                                item?.quantity ??
                                                0
                                            }
                                            onQuantityChange={
                                                onQuantityChange
                                            }
                                        />
                                    );
                                }
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

export default memo(
    BulkCategorySection
);