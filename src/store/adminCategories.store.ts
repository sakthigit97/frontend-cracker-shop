import { create } from "zustand";
import { getAdminCategories } from "../services/adminCategories.api";

type Filters = {
    search?: string;
    isActive?: "" | "true" | "false";
};

interface PageData {
    items: any[];
    nextCursor: string | null;
}

interface CategoryState {
    cache: Record<string, Record<string, PageData>>;
    loading: boolean;
    fetchPage: (
        filters: Filters,
        cursor?: string | null
    ) => Promise<PageData>;
    clearCache: () => void;
}

const filterKey = (filters: Filters) =>
    JSON.stringify(filters || {});

const cursorKey = (cursor?: string | null) => cursor || "first";

export const useAdminCategoriesStore = create<CategoryState>((set, get) => ({
    cache: {},
    loading: false,

    async fetchPage(filters, cursor = null) {
        const fKey = filterKey(filters);
        const cKey = cursorKey(cursor);

        const cached = get().cache[fKey]?.[cKey];
        if (cached) return cached;

        set({ loading: true });

        try {
            const res = await getAdminCategories({
                search: filters.search || undefined,
                isActive: filters.isActive || undefined,
                cursor: cursor || undefined,
            });

            set((state) => ({
                cache: {
                    ...state.cache,
                    [fKey]: {
                        ...(state.cache[fKey] || {}),
                        [cKey]: res,
                    },
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