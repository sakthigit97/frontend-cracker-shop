import { memo, useEffect, useMemo } from "react";
import BulkCategorySection from "./BulkCategorySection";
import type { Product } from "../../types/product";
import type { BulkSchemeId } from "../../types/bulkOrder";
import { useCatalog } from "../../store/catalog.store";
import { sortProductsByCategoryAndSequence } from "../../utils/sequncerUtil";

interface BulkProductTableProps {
    products: Product[];
    search: string;
    schemeId: BulkSchemeId;
    items: any[];
    onQuantityChange: (
        productId: string,
        quantity: number
    ) => void;
}

function BulkProductTable({
    products,
    search,
    schemeId,
    items,
    onQuantityChange,
}: BulkProductTableProps) {
    const { categories, fetchCategories } = useCatalog();

    useEffect(() => {
        fetchCategories();
    }, []);

    const filteredProducts = useMemo(() => {

        const keyword = search.trim().toLowerCase();
        if (!keyword) {
            return products;
        }

        return products.filter((product) => {

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

        });

    }, [products, search]);

    const sortedProducts = useMemo(() => {
        return sortProductsByCategoryAndSequence(
            filteredProducts,
            categories
        );
    }, [filteredProducts, categories]);

    const groupedProducts = useMemo(() => {
        const map = new Map<
            string,
            {
                category: any;
                products: Product[];
            }
        >();

        sortedProducts.forEach((product: any) => {
            const category = categories.find(
                (c) => c.id === product.categoryId
            );

            const categoryId = product.categoryId ?? "others";
            const categoryName = category?.name ?? "Others";

            if (!map.has(categoryId)) {
                map.set(categoryId, {
                    category: category ?? {
                        id: categoryId,
                        name: categoryName,
                    },
                    products: [],
                });
            }

            map.get(categoryId)!.products.push(product);
        });

        return Array.from(map.values());
    }, [filteredProducts, categories]);

    if (groupedProducts.length === 0) {

        return (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-20 text-center">

                <h3 className="text-xl font-semibold">
                    No Products Found
                </h3>

                <p className="mt-3 text-gray-500">
                    Try searching with a different
                    keyword.
                </p>

            </div>

        );

    }

    return (

        <div className="space-y-6">
            {groupedProducts.map((group) => (
                <BulkCategorySection
                    key={group.category.id}
                    categoryName={group.category.name}
                    products={group.products}
                    schemeId={schemeId}
                    items={items}
                    onQuantityChange={onQuantityChange}
                />
            ))}
        </div>

    );

}

export default memo(BulkProductTable);