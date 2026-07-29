import { memo, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import BulkProductRow from "./BulkProductRow";

import type { Product } from "../../types/product";
import type {
    BulkOrderProduct,
    BulkSchemeId,
} from "../../types/bulkOrder";
import { getSchemePrice } from "../../utils/bulkPricing";

interface BulkCategorySectionProps {
    categoryName: string;
    products: Product[];
    schemeId: BulkSchemeId;
    items: BulkOrderProduct[];
    onQuantityChange: (
        productId: string,
        quantity: number
    ) => void;
}

function BulkCategorySection({
    categoryName,
    products,
    schemeId,
    items,
    onQuantityChange,
}: BulkCategorySectionProps) {

    const [expanded, setExpanded] = useState(true);

    const categoryTotal = useMemo(() => {

        return products.reduce((total, product) => {

            const item = items.find(
                (x) => x.productId === product.id
            );

            const qty = item?.quantity ?? 0;

            if (qty === 0) {
                return total;
            }

            const price = getSchemePrice(
                product,
                schemeId
            );

            return total + qty * price;

        }, 0);

    }, [
        products,
        items,
        schemeId,
    ]);

    const selectedItems = useMemo(() => {

        return products.reduce((count, product) => {

            const item = items.find(
                (x) => x.productId === product.id
            );

            if ((item?.quantity ?? 0) > 0) {
                return count + 1;
            }

            return count;

        }, 0);

    }, [
        products,
        items,
    ]);

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="flex w-full items-center justify-between bg-slate-800 px-5 py-3 text-white transition hover:bg-slate-700"
            >
                <div className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />

                    <div>
                        <h3 className="text-lg font-semibold uppercase tracking-wide">
                            {categoryName}
                        </h3>

                        <p className="text-sm text-slate-300">
                            {products.length} Products
                            {selectedItems > 0 &&
                                ` • ${selectedItems} Selected`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {expanded ? (
                        <ChevronDown size={20} />
                    ) : (
                        <ChevronRight size={20} />
                    )}
                </div>
            </button>   
            {expanded && (

                <div>

                    {products.map((product) => {

                        const item = items.find(
                            (x) => x.productId === product.id
                        );

                        return (
                            <BulkProductRow
                                key={product.id}
                                product={product}
                                schemeId={schemeId}
                                quantity={item?.quantity ?? 0}
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