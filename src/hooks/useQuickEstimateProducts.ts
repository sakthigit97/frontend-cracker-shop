import { useMemo } from "react";
import { quickEstimateStore } from "../store/quickEstimate.store";
import { useHomeProducts } from "../store/homeProduct.store";

export function useQuickEstimateProducts() {
    const items = quickEstimateStore((s) => s.items);

    const { products } = useHomeProducts();

    const merged = useMemo(() => {
        return products
            .filter((p) => (items[p.id] ?? 0) > 0)
            .map((p) => ({
                ...p,
                quantity: items[p.id],
            }));
    }, [products, items]);

    return {
        products: merged,
        loading: false,
    };
}