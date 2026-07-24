import { create } from "zustand";
import { apiFetch } from "../services/api";

export interface Category {
    id: string;
    name: string;
    sortOrder: number;
    isActive: boolean;
}

interface CategoryStore {
    items: Category[];
    loading: boolean;
    hasFetched: boolean;
    fetchAllCategory: () => Promise<void>;
    getCategoryName: (id?: string) => string;
    clear: () => void;
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
    items: [],
    loading: false,
    hasFetched: false,
    fetchAllCategory: async () => {
        if (get().hasFetched) return;

        set({ loading: true });

        try {
            const res = await apiFetch("/categories");

            set({
                items: res.data.items,
                loading: false,
                hasFetched: true,
            });
        } catch {
            set({
                items: [],
                loading: false,
                hasFetched: true,
            });
        }
    },

    getCategoryName: (id?: string) => {
        if (!id) return "Others";

        return (
            get().items.find((c) => c.id === id)?.name ??
            "Others"
        );
    },

    clear: () =>
        set({
            items: [],
            hasFetched: false,
        }),
}));