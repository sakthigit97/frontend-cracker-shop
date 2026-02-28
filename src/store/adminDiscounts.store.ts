import { create } from "zustand";
import { listDiscounts } from "../services/adminDiscounts.api";

type Discount = {
    discountId: string;
    discountMode: string;
    discountType: string;
    discountValue: number;
    priority: number;
    targetId: string;
    isActive: boolean;
};

type DiscountState = {
    discounts: Discount[];
    loading: boolean;
    fetchDiscounts: () => Promise<void>;
    refreshDiscounts: () => Promise<void>;
    clearCache: () => void;
};

export const useAdminDiscountsStore = create<DiscountState>((set, get) => ({
    discounts: [],
    loading: false,
    fetchDiscounts: async () => {
        if (get().discounts.length > 0) return;
        set({ loading: true });
        const res = await listDiscounts();
        set({
            discounts: res.items || [],
            loading: false,
        });
    },
    refreshDiscounts: async () => {
        set({ loading: true });
        const res = await listDiscounts();
        set({
            discounts: res.items || [],
            loading: false,
        });
    },
    clearCache: () => {
        set({ discounts: [] });
    },
}));
