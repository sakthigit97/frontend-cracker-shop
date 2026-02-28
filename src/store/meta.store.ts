import { create } from "zustand";
import { apiFetch } from "../services/api";

interface MetaState {
    brands: any[];
    categories: any[];
    lastLoaded: number | null;
    TTL: number;
    load: () => Promise<void>;
}

export const useMetaStore = create<MetaState>((set, get) => ({
    brands: [],
    categories: [],
    lastLoaded: null,
    TTL: 10 * 60 * 1000,

    async load() {
        const { lastLoaded, TTL, brands, categories } = get();
        if (
            lastLoaded &&
            Date.now() - lastLoaded < TTL &&
            brands.length &&
            categories.length
        ) {
            return;
        }

        const [brandsRes, categoriesRes] = await Promise.all([
            apiFetch("/brands"),
            apiFetch("/categories"),
        ]);

        set({
            brands: brandsRes?.data?.items || [],
            categories: categoriesRes?.data?.items || [],
            lastLoaded: Date.now(),
        });
    },
}));