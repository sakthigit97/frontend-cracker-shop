import { create } from "zustand";
import { apiFetch } from "../services/api";
import type { Product } from "../types/product";

interface QuickEstimateProductsState {
    products: Record<string, Product>;
    loading: boolean;
    fetchProducts: (productIds: string[]) => Promise<void>;
    clear: () => void;
}

export const useQuickEstimateProductsStore =
    create<QuickEstimateProductsState>((set, get) => ({
        products: {},
        loading: false,

        fetchProducts: async (productIds) => {
            if (productIds.length === 0) {
                set({
                    products: {},
                    loading: false,
                });
                return;
            }

            const existing = get().products;

            const missingIds = productIds.filter(
                (id) => !existing[id]
            );

            if (missingIds.length === 0) {
                return;
            }

            try {
                set({
                    loading: true,
                });

                const res = await apiFetch("/products/cart", {
                    method: "POST",
                    body: JSON.stringify({
                        productIds: missingIds,
                    }),
                });

                set((state) => {
                    const map: Record<string, Product> = {};
                    productIds.forEach((id) => {
                        if (state.products[id]) {
                            map[id] = state.products[id];
                        }
                    });

                    (res.data.items || []).forEach(
                        (product: Product) => {
                            map[product.id] = product;
                        }
                    );

                    return {
                        products: map,
                        loading: false,
                    };
                });
            } finally {
                set({
                    loading: false,
                });
            }
        },

        clear: () =>
            set({
                products: {},
            }),
    }));