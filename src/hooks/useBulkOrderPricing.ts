import { useMemo } from "react";
import { bulkOrderStore } from "../store/bulkOrder.store";
import { useConfigStore } from "../store/config.store";
import { calculateBulkPricing } from "../utils/bulkPricing";

interface UseBulkOrderPricingProps {
    state?: string;
}

export function useBulkOrderPricing({
    state = "Tamil Nadu",
}: UseBulkOrderPricingProps = {}) {
    const {
        scheme,
        items,
    } = bulkOrderStore();

    const config = useConfigStore(
        (store) => store.config
    );

    const configReady = useConfigStore(
        (store) => store.configReady
    );

    const loading = useConfigStore(
        (store) => store.loading
    );

    const pricing = useMemo(
        () =>
            calculateBulkPricing({
                items,
                scheme,
                state,
                config,
            }),
        [
            items,
            scheme,
            state,
            config,
        ]
    );

    const pricingReady =
        configReady &&
        !loading &&
        !!config;

    const selectedProducts =
        items.length;

    const totalBoxes = useMemo(
        () =>
            items.reduce(
                (total, item) =>
                    total + item.quantity,
                0
            ),
        [items]
    );

    const totalPieces = useMemo(
        () =>
            items.reduce(
                (total, item) =>
                    total +
                    item.quantity *
                    item.cartonQty,
                0
            ),
        [items]
    );

    return {
        selectedScheme: scheme,
        orderItems: items,
        pricing,
        pricingReady,
        selectedProducts,
        totalBoxes,
        totalPieces,
    };
}