import { useMemo } from "react";
import { bulkOrderStore } from "../store/bulkOrder.store";
import { calculateBulkPricing } from "../utils/bulkPricing";

export function useBulkOrderPricing() {
    const {
        scheme,
        items,
    } = bulkOrderStore();
    const pricing = useMemo(
        () =>
            calculateBulkPricing({
                items,
                scheme,
            }),
        [items, scheme]
    );

    const selectedProducts = items.length;
    const totalBoxes = useMemo(
        () =>
            items.reduce(
                (total, item) => total + item.quantity,
                0
            ),
        [items]
    );

    const totalPieces = useMemo(
        () =>
            items.reduce(
                (total, item) =>
                    total +
                    item.quantity * item.cartonQty,
                0
            ),
        [items]
    );

    return {
        selectedScheme: scheme,
        orderItems: items,
        pricing,
        selectedProducts,
        totalBoxes,
        totalPieces,
    };
}