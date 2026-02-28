import { create } from "zustand";
import {
    listAdminCategories,
    listAdminBrands,
    listAdminProducts,
} from "../services/adminDiscounts.api";

type TargetState = {
    categories: any[];
    brands: any[];
    products: any[];
    loaded: boolean;
    loading: boolean;
    loadAllTargets: () => Promise<void>;
    clearCache: () => void;
};

export const useAdminTargetsStore = create<TargetState>((set, get) => ({
    categories: [],
    brands: [],
    products: [],
    loaded: false,
    loading: false,
    loadAllTargets: async () => {
        if (get().loaded) return;

        try {
            set({ loading: true });

            const [catRes, brandRes, prodRes] = await Promise.all([
                listAdminCategories(),
                listAdminBrands(),
                listAdminProducts(),
            ]);

            set({
                categories: catRes.items || catRes,
                brands: brandRes.items || brandRes,
                products: prodRes.items || prodRes,
                loaded: true,
            });
        } catch (err) {
            console.error("Failed to load targets", err);
        } finally {
            set({ loading: false });
        }
    },
    clearCache: () =>
        set({
            categories: [],
            brands: [],
            products: [],
            loaded: false,
        }),
}));