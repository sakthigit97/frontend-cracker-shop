import { create } from "zustand";
import { fetchProductsBatch } from "../services/product.api";

type CartProduct = {
    id: string;
    name: string;
    price: number;
    image?: string;
    brand?: string;
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
            const existing = get().products;
            const missingIds = ids.filter((id) => !existing[id]);

            if (missingIds.length === 0) return;

            set({ loading: true });

            const data = await fetchProductsBatch(missingIds);

            set((state) => {
                const map = { ...state.products };

                data.forEach((p: any) => {
                    map[p.productId] = {
                        id: p.productId,
                        name: p.name,
                        price: p.price,
                        image: p.imageUrls?.[0],
                        brand: p.brandId,
                    };
                });

                return { products: map, loading: false };
            });
        },

        clear: () => set({ products: {} }),
    })
);