import { create } from "zustand";
import { fetchProductsBatch } from "../services/product.api";

type CartProduct = {
    id: string;
    name: string;
    price: number;
    image?: string;
    brand?: string;
    originalPrice?: number;
    discountText?: string;
    isComboPackage?: boolean;
};

interface CartProductsState {
    products: Record<string, CartProduct>;
    loading: boolean;
    fetchProducts: (ids: string[]) => Promise<void>;
    clear: () => void;
}

export const useCartProductsStore = create<CartProductsState>(
    (set, get) => ({
        products: {},
        loading: false,
        fetchProducts: async (ids) => {
            if (ids.length === 0) {
                set({
                    products: {},
                    loading: false,
                });
                return;
            }

            const existing = get().products;

            const missingIds = ids.filter(
                (id) => !existing[id]
            );

            if (missingIds.length === 0) {
                return;
            }

            set({ loading: true });

            try {
                const data = await fetchProductsBatch(
                    missingIds
                );

                set((state) => {
                    const map = { ...state.products };

                    data.forEach((p: any) => {
                        map[p.productId] = {
                            id: p.productId,
                            name: p.name,
                            price: p.price,
                            image: p.image,
                            brand: p.brandId,
                            originalPrice: p.originalPrice,
                            discountText: p.discountText,
                            isComboPackage:
                                !!p.isComboPackage,
                        };
                    });

                    return {
                        products: map,
                        loading: false,
                    };
                });
            } finally {
                set({ loading: false });
            }
        },

        clear: () => set({ products: {} }),
    })
);