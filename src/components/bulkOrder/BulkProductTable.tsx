import { memo, useEffect, useMemo } from "react";
import BulkCategorySection from "./BulkCategorySection";
import type { Product } from "../../types/product";
import type {
    BulkOrderProduct,
    BulkScheme,
} from "../../types/bulkOrder";
import { useCatalog } from "../../store/catalog.store";
import { sortProductsByCategoryAndSequence } from "../../utils/sequncerUtil";

interface BulkProductTableProps {
    products: Product[];
    search: string;
    scheme: BulkScheme;
    items: BulkOrderProduct[];
    onQuantityChange: (
        productId: string,
        quantity: number
    ) => void;
}

interface CategoryGroup {
    category: {
        id: string;
        name: string;
    };
    products: Product[];
}

function BulkProductTable({
    products,
    search,
    scheme,
    items,
    onQuantityChange,
}: BulkProductTableProps) {
    const {
        categories,
        fetchCategories,
    } = useCatalog();

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const bulkOrderProducts = useMemo(
        () =>
            products.filter((product) => {
                const isBulkOrderOnly =
                    product?.isBulkOrderOnly === true;
                const hasBulkOrderBasePrice =
                    Number(
                        product.bulkOrderBasePrice ?? 0
                    ) > 0;

                const hasCartonQty = Number(
                    product.cartonQty ?? 0
                ) > 0;

                return (
                    isBulkOrderOnly &&
                    (
                        hasBulkOrderBasePrice ||
                        hasCartonQty
                    )
                );
            }),
        [products]
    );


    const filteredProducts = useMemo(() => {
        const keyword = search
            .trim()
            .toLowerCase();

        if (!keyword) {
            return bulkOrderProducts;
        }

        return bulkOrderProducts.filter(
            (product) => {
                return (
                    product.name
                        ?.toLowerCase()
                        .includes(keyword) ||
                    product.searchText
                        ?.toLowerCase()
                        .includes(keyword) ||
                    product.categoryId
                        ?.toLowerCase()
                        .includes(keyword) ||
                    product.brand
                        ?.toLowerCase()
                        .includes(keyword)
                );
            }
        );
    }, [bulkOrderProducts, search]);

    const sortedProducts =
        useMemo(() => {
            return sortProductsByCategoryAndSequence(
                filteredProducts,
                categories
            );
        }, [
            filteredProducts,
            categories,
        ]);

    const groupedProducts =
        useMemo<CategoryGroup[]>(() => {
            const map = new Map<
                string,
                CategoryGroup
            >();

            sortedProducts.forEach(
                (product) => {
                    const category =
                        categories.find(
                            (category) =>
                                category.id ===
                                product.categoryId
                        );

                    const categoryId =
                        product.categoryId ??
                        "others";

                    const categoryName =
                        category?.name ??
                        "Others";

                    if (
                        !map.has(
                            categoryId
                        )
                    ) {
                        map.set(
                            categoryId,
                            {
                                category:
                                    category
                                        ? {
                                            id: category.id,
                                            name: category.name,
                                        }
                                        : {
                                            id: categoryId,
                                            name: categoryName,
                                        },
                                products: [],
                            }
                        );
                    }

                    map
                        .get(categoryId)!
                        .products.push(
                            product
                        );
                }
            );

            return Array.from(
                map.values()
            );
        }, [
            sortedProducts,
            categories,
        ]);

    if (
        groupedProducts.length ===
        0
    ) {
        return (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-20 text-center">
                <h3 className="text-xl font-semibold">
                    No Products Found
                </h3>

                <p className="mt-3 text-gray-500">
                    Try searching with a
                    different keyword.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {groupedProducts.map(
                (group) => (
                    <BulkCategorySection
                        key={
                            group.category
                                .id
                        }
                        categoryName={
                            group.category
                                .name
                        }
                        products={
                            group.products
                        }
                        scheme={scheme}
                        items={items}
                        onQuantityChange={
                            onQuantityChange
                        }
                    />
                )
            )}
        </div>
    );
}

export default memo(
    BulkProductTable
);