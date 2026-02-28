import { create } from "zustand";
import { getAdminBrands } from "../services/adminBrands.api";

interface BrandState {
    cache: Record<string, any>;
    loading: boolean;
    fetchPage: (filters: any, page: number) => Promise<any>;
    clearCache: () => void;
}

export const useAdminBrandsStore = create<BrandState>((set, get) => ({
    cache: {},
    loading: false,

    async fetchPage(filters, page) {
        const key = JSON.stringify({ filters, page });
        const cached = get().cache[key];

        if (cached) {
            return cached;
        }

        set({ loading: true });

        try {
            const res = await getAdminBrands({
                ...filters,
                cursor: page > 1 ? filters.cursor : undefined,
            });

            set((state) => ({
                cache: {
                    ...state.cache,
                    [key]: res,
                },
            }));

            return res;
        } finally {
            set({ loading: false });
        }
    },

    clearCache() {
        set({ cache: {} });
    },
}));