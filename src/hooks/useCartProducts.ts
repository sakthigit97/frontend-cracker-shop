import { useEffect, useMemo } from "react";
import { cartStore } from "../store/cart.store";
import { useCartProductsStore } from "../store/cartProducts.store";

export function useCartProducts() {
    const items = cartStore((s) => s.items);
    const productIds = useMemo(
        () => Object.keys(items),
        [items]
    );

    const { products, fetchProducts, loading, clear } = useCartProductsStore();
    useEffect(() => {
        if (productIds.length === 0) {
            clear();
            return;
        }

        fetchProducts(productIds);
    }, [productIds, fetchProducts, clear]);


    const merged = useMemo(() => {
        return productIds
            .map((id) => {
                const p = products[id];
                if (!p) return null;

                return {
                    ...p,
                    quantity: items[id],
                };
            })
            .filter(
                (p): p is NonNullable<typeof p> => p !== null
            );
    }, [products, items, productIds]);

    return { products: merged, loading };
}