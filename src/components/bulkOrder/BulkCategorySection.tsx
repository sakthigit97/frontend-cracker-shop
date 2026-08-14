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
    const [expanded, setExpanded] = useState(true);

    const itemsByProductId = useMemo(() => {
        return new Map(
            items.map((item) => [
                item.productId,
                item,
            ])
        );
    }, [items]);

    const selectedItems = useMemo(() => {
        return products.reduce(
            (count, product) => {
                const item = itemsByProductId.get(product.id);
                return (item?.quantity ?? 0) > 0 ? count + 1 : count;
            },
            0
        );
    }, [products, itemsByProductId]);

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

            <button
                type="button"
                onClick={() =>
                    setExpanded((previous) => !previous)
                }
                className="flex w-full items-center justify-between bg-slate-800 px-3 py-2.5 text-white transition hover:bg-slate-700 sm:px-4 sm:py-3"
            >
                <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                    <div className="h-2 w-2 shrink-0 rounded-full bg-yellow-400 sm:h-2.5 sm:w-2.5" />

                    <div className="min-w-0 flex-1">
                        {/* Category name */}
                        <h3 className="truncate text-sm font-semibold uppercase leading-5 sm:text-base lg:inline lg:text-lg">
                            {categoryName}
                        </h3>

                        {/* Product count */}
                        <p className="text-[11px] leading-4 text-slate-300 sm:text-xs lg:ml-3 lg:inline lg:text-sm">
                            {products.length} Products
                            {selectedItems > 0 &&
                                ` • ${selectedItems} Selected`}
                        </p>
                    </div>
                </div>

                {expanded ? (
                    <ChevronDown className="ml-2 h-5 w-5 shrink-0 lg:h-6 lg:w-6" />
                ) : (
                    <ChevronRight className="ml-2 h-5 w-5 shrink-0 lg:h-6 lg:w-6" />
                )}
            </button>
            {expanded && (
                <div>
                    {products.map((product) => {
                        const item = itemsByProductId.get(
                            product.id
                        );

                        return (
                            <BulkProductRow
                                key={product.id}
                                product={product}
                                scheme={scheme}
                                quantity={
                                    item?.quantity ?? 0
                                }
                                onQuantityChange={
                                    onQuantityChange
                                }
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default memo(BulkCategorySection);