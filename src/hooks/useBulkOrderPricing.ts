import { useMemo } from "react";

import { bulkOrderStore } from "../store/bulkOrder.store";
import { useHomeProducts } from "../store/homeProduct.store";

import { BULK_SCHEMES } from "../constants/bulkScheme";

import {
    createBulkOrderItem,
    calculateBulkPricing,
} from "../utils/bulkPricing";

export function useBulkOrderPricing() {
    const {
        selectedSchemeId,
        quantities,
    } = bulkOrderStore();

    const products =
        useHomeProducts(
            (state) => state.products
        ) ?? [];

    const selectedScheme = useMemo(
        () =>
            BULK_SCHEMES.find(
                (scheme) =>
                    scheme.id === selectedSchemeId
            ) ?? null,
        [selectedSchemeId]
    );

    const orderItems = useMemo(() => {

        if (!selectedScheme) {
            return [];
        }

        return products
            .filter(
                (product) =>
                    (quantities[
                        product.productId
                    ] ?? 0) > 0
            )
            .map((product) =>
                createBulkOrderItem(
                    product,
                    selectedScheme.id,
                    quantities[
                    product.productId
                    ]
                )
            );

    }, [
        products,
        quantities,
        selectedScheme,
    ]);

    const pricing = useMemo(
        () =>
            calculateBulkPricing(
                orderItems
            ),
        [orderItems]
    );

    const selectedProducts = orderItems.length;

    const totalBoxes = useMemo(
        () =>
            orderItems.reduce(
                (total, item) =>
                    total + item.quantity,
                0
            ),
        [orderItems]
    );

    const totalPieces = useMemo(
        () =>
            orderItems.reduce(
                (total, item) =>
                    total +
                    item.quantity *
                    item.bulkQty,
                0
            ),
        [orderItems]
    );

    return {

        selectedScheme,

        orderItems,

        pricing,

        selectedProducts,

        totalBoxes,

        totalPieces,

    };
}