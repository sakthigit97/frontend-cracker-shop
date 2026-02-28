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
    cache: Record<string, Record<number, PageData>>;
    loading: boolean;

    fetchPage: (
        filters: QueryKey,
        page: number,
        cursor?: string | null
    ) => Promise<PageData>;

    clearCache: () => void;
}

const keyOf = (filters: QueryKey) =>
    JSON.stringify(filters || {});

export const useAdminProductsStore = create<AdminProductsState>((set, get) => ({
    cache: {},
    loading: false,

    async fetchPage(filters, page, cursor) {
        const key = keyOf(filters);
        const cached = get().cache[key]?.[page];
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
                [key]: {
                    ...(state.cache[key] || {}),
                    [page]: res,
                },
            },
        }));

        return res;
    },

    clearCache() {
        set({ cache: {} });
    },
}));