import { create } from "zustand";
import { getAdminBrands } from "../services/adminBrands.api";

interface Filters {
    search?: string;
    isActive?: "" | "true" | "false";
}

interface PageData {
    items: any[];
    nextCursor: string | null;
}

interface BrandState {
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

const cursorKey = (cursor?: string | null) =>
    cursor || "first";

export const useAdminBrandsStore = create<BrandState>((set, get) => ({
    cache: {},
    loading: false,

    async fetchPage(filters, cursor = null) {
        const fKey = filterKey(filters);
        const cKey = cursorKey(cursor);

        const cached = get().cache[fKey]?.[cKey];
        if (cached) return cached;

        set({ loading: true });

        try {
            const apiRes = await getAdminBrands({
                search: filters.search || undefined,
                isActive: filters.isActive || undefined,
                cursor: cursor || undefined,
            });

            const res: PageData = {
                items: apiRes.items || [],
                nextCursor: apiRes.nextCursor ?? null,
            };

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