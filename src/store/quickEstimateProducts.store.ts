import { create } from "zustand";
import { apiFetch } from "../services/api";
import type { Product } from "../types/product";

interface QuickEstimateProductsState {
    products: Record<string, Product>;
    loading: boolean;
    fetchProducts: (
        productIds: string[]
    ) => Promise<void>;
}

export const useQuickEstimateProductsStore =
    create<QuickEstimateProductsState>(
        (set) => ({
            products: {},
            loading: false,
            fetchProducts: async (
                productIds
            ) => {

                if (
                    productIds.length === 0
                ) {
                    return;
                }

                try {

                    set({
                        loading: true,
                    });

                    const res =
                        await apiFetch(
                            "/products/cart",
                            {
                                method:
                                    "POST",
                                body: JSON.stringify(
                                    {
                                        productIds,
                                    }
                                ),
                            }
                        );

                    const map:
                        Record<
                            string,
                            Product
                        > = {};

                    (
                        res.data.items ||
                        []
                    ).forEach(
                        (
                            product: Product
                        ) => {

                            map[
                                product.id
                            ] = product;
                        }
                    );

                    set({
                        products: map,
                    });

                } finally {

                    set({
                        loading: false,
                    });
                }
            },
        })
    );