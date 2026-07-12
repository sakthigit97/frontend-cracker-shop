import { useEffect, useMemo } from "react";
import { useCartProductsStore } from "../store/cartProducts.store";
import { quickEstimateStore } from "../store/quickEstimate.store";


export function useQuickEstimateProducts() {
    const items = quickEstimateStore((s) => s.items);
    const { products, fetchProducts, loading } = useCartProductsStore();
    const productIds = useMemo(
        () => Object.keys(items),
        [items]
    );

    useEffect(() => {
        if (productIds.length === 0) {
            return;
        }

        fetchProducts(productIds);
    }, [fetchProducts, productIds.join(",")]);

    const merged = useMemo(() => {
        return productIds
            .map((id) => {
                const qty = Number(items[id] ?? 0);

                if (qty <= 0) return null;

                const p = products[id];
                if (!p) return null;

                return {
                    ...p,
                    quantity: qty,
                };
            })
            .filter(
                (p): p is NonNullable<typeof p> => p !== null
            );
    }, [products, items, productIds]);

    return { products: merged, loading };
}