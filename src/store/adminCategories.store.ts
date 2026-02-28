import { create } from "zustand";
import { getAdminCategories } from "../services/adminCategories.api";

type Filters = {
    search: string;
    isActive: "" | "true" | "false";
};

interface CategoryState {
    cache: Record<string, any>;
    loading: boolean;
    fetchPage: (filters: Filters, page: number) => Promise<any>;
    clearCache: () => void;
}

export const useAdminCategoriesStore = create<CategoryState>((set, get) => ({
    cache: {},
    loading: false,

    async fetchPage(filters, page) {
        const key = `${filters.search}|${filters.isActive}|${page}`;
        const cached = get().cache[key];

        if (cached) {
            return cached;
        }

        set({ loading: true });

        try {
            const res = await getAdminCategories({
                search: filters.search || undefined,
                isActive: filters.isActive || undefined,
                cursor:
                    page > 1
                        ? get().cache[`${filters.search}|${filters.isActive}|${page - 1}`]
                            ?.nextCursor
                        : undefined,
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