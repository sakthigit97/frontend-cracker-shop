import { create } from "zustand";
import { apiFetch } from "../services/api";

interface Product {
    productId: string;
    name: string;
    price: number;
    brandId: string;
    categoryId: string;
    isActive: string;
}

interface QueryKey {
    search?: string;
    brandId?: string;
    categoryId?: string;
    isActive?: string;
}

interface PageData {
    items: Product[];
    nextCursor: string | null;
}

interface AdminProductsState {
    cache: Record<string, Record<string, PageData>>;
    loading: boolean;

    fetchPage: (
        filters: QueryKey,
        cursor?: string | null
    ) => Promise<PageData>;

    clearCache: () => void;
}

const keyOf = (filters: QueryKey) =>
    JSON.stringify(filters || {});

const cursorKey = (cursor?: string | null) =>
    cursor || "first";

export const useAdminProductsStore = create<AdminProductsState>((set, get) => ({
    cache: {},
    loading: false,

    async fetchPage(filters, cursor = null) {
        const filterKey = keyOf(filters);
        const cKey = cursorKey(cursor);

        const cached = get().cache[filterKey]?.[cKey];
        if (cached) return cached;

        set({ loading: true });

        const qs = new URLSearchParams();
        qs.set("limit", "20");
        if (cursor) qs.set("cursor", cursor);
        if (filters.search) qs.set("search", filters.search);
        if (filters.brandId) qs.set("brandId", filters.brandId);
        if (filters.categoryId) qs.set("categoryId", filters.categoryId);
        if (filters.isActive) qs.set("isActive", filters.isActive);

        const res = await apiFetch(`/admin/products?${qs.toString()}`);

        set((state) => ({
            loading: false,
            cache: {
                ...state.cache,
                [filterKey]: {
                    ...(state.cache[filterKey] || {}),
                    [cKey]: res,
                },
            },
        }));

        return res;
    },

    clearCache() {
        set({ cache: {} });
    },
}));