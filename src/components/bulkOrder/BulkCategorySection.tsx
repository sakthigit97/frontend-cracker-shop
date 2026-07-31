import { memo, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import BulkProductRow from "./BulkProductRow";
import type { Product } from "../../types/product";
import type {
    BulkOrderProduct,
    BulkSchemeId,
} from "../../types/bulkOrder";

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
                className="flex w-full items-center justify-between bg-slate-800 px-3 py-2 sm:px-4 sm:py-3 lg:px-5 lg:py-3 text-white transition hover:bg-slate-700"
            >
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="h-2 w-2 rounded-full bg-yellow-400 sm:h-2.5 sm:w-2.5" />

                    <div>

                        <h3 className="text-[15px] font-semibold uppercase leading-5 sm:text-base lg:text-lg">
                            {categoryName}
                        </h3>

                        <p className="mt-0.5 text-[11px] text-slate-300 sm:text-xs lg:text-sm">
                            {products.length} Products
                            {selectedItems > 0 &&
                                ` • ${selectedItems} Selected`}
                        </p>

                    </div>

                </div>

                {expanded ? (
                    <ChevronDown className="h-5 w-5 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                ) : (
                    <ChevronRight className="h-5 w-5 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                )}
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