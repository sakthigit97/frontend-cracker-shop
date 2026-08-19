import { create } from "zustand";
import { getAdminBrands } from "../services/adminBrands.api";

interface BrandState {
    brands: any[];
    loading: boolean;
    loaded: boolean;

    fetchBrands: () => Promise<any[]>;

    clearCache: () => void;
}

export const useAdminBrandsStore = create<BrandState>(
    (set, get) => ({
        brands: [],
        loading: false,
        loaded: false,

        async fetchBrands() {
            if (get().loaded) {
                return get().brands;
            }

            set({
                loading: true,
            });

            try {
                const apiRes = await getAdminBrands({});
                const brands = apiRes.items || [];

                set({
                    brands,
                    loaded: true,
                });

                return brands;
            } finally {
                set({
                    loading: false,
                });
            }
        },

        clearCache() {
            set({
                brands: [],
                loaded: false,
            });
        },
    })
);