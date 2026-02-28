import { useEffect, useMemo } from "react";
import { cartStore } from "../store/cart.store";
import { useCartProductsStore } from "../store/cartProducts.store";

export function useCartProducts() {
    const items = cartStore((s) => s.items);
    const { products, fetchProducts, loading } = useCartProductsStore();

    const productIds = useMemo(
        () => Object.keys(items),
        [items]
    );

    useEffect(() => {
        if (productIds.length === 0) return;
        fetchProducts(productIds);
    }, [productIds, fetchProducts]);

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