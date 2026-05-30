import { create } from "zustand";
import { apiFetch } from "../services/api";

interface MetaState {
    brands: any[];
    categories: any[];
    packageTags: any[];
    lastLoaded: number | null;
    TTL: number;
    load: () => Promise<void>;
}

export const useMetaStore = create<MetaState>((set, get) => ({
    brands: [],
    categories: [],
    packageTags: [],
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

        const [brandsRes, categoriesRes, configRes] = await Promise.all([
            apiFetch("/brands"),
            apiFetch("/categories"),
            apiFetch("/config"),
        ]);

        set({
            brands: brandsRes?.data?.items || [],
            categories: categoriesRes?.data?.items || [],
            lastLoaded: Date.now(),
            packageTags: configRes?.packageTags || [],
        });
    },
}));