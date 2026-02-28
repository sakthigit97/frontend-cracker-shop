import { create } from "zustand";
import { getAdminOrderById, updateAdminOrder } from "../services/admin.api";

type State = {
    cache: Record<string, any>;
    loading: boolean;
    error: string | null;
    fetchOrder: (orderId: string, opts: any) => Promise<void>;
    updateOrderInCache: (orderId: string, data: any) => void;
    updateOrder: (
        orderId: string,
        payload: { status?: string; adminComment?: string }
    ) => Promise<void>;
};

export const useAdminOrderDetailsStore = create<State>((set, get) => ({
    cache: {},
    loading: false,
    error: null,
    fetchOrder: async (orderId, opts?: { force?: boolean }) => {
        if (!opts?.force && get().cache[orderId]) return;
        set({ loading: true, error: null });

        try {
            const data = await getAdminOrderById(orderId);

            set((state) => ({
                cache: {
                    ...state.cache,
                    [orderId]: data,
                },
                loading: false,
            }));
        } catch (e: any) {
            set({ loading: false, error: e.message });
        }
    },
    updateOrderInCache: (orderId, data) =>
        set((state) => ({
            cache: {
                ...state.cache,
                [orderId]: data,
            },
        })),
    updateOrder: async (
        orderId,
        payload: { status?: string; adminComment?: string }
    ) => {
        const updated = await updateAdminOrder(orderId, payload);
        set((state) => ({
            cache: {
                ...state.cache,
                [orderId]: updated,
            },
        }));
    },
}));