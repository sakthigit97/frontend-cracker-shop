import { create } from "zustand";
import { getMyOrdersApi } from "../services/order.api";

interface OrdersState {
    orders: any[];
    loading: boolean;
    lastFetchedAt: number | null;
    nextCursor: string | null;
    fetchInitial: (force?: boolean) => Promise<void>;
    fetchMore: () => Promise<void>;
    clear: () => void;
}

const CACHE_TTL = 2 * 60 * 1000;
const PAGE_SIZE = 10;
export const useOrdersStore = create<OrdersState>((set, get) => ({
    orders: [],
    loading: false,
    lastFetchedAt: null,
    nextCursor: null,
    fetchInitial: async (force = false) => {
        const { orders, lastFetchedAt } = get();

        const isCacheValid =
            !force &&
            orders.length > 0 &&
            lastFetchedAt &&
            Date.now() - lastFetchedAt < CACHE_TTL;

        if (isCacheValid) {
            return;
        }

        set({ loading: true });

        try {
            const res = await getMyOrdersApi(PAGE_SIZE);

            set({
                orders: Array.isArray(res.items) ? res.items : [],
                nextCursor: res.nextCursor ?? null,
                lastFetchedAt: Date.now(),
                loading: false,
            });
        } catch (err) {
            console.error("Fetch orders failed", err);
            set({ loading: false });
        }
    },
    fetchMore: async () => {
        const { nextCursor, loading, orders } = get();
        if (!nextCursor || loading) return;

        set({ loading: true });

        try {
            const res = await getMyOrdersApi(PAGE_SIZE, nextCursor);

            set({
                orders: [...orders, ...(res.items ?? [])],
                nextCursor: res.nextCursor ?? null,
                loading: false,
            });
        } catch (err) {
            console.error("Fetch more orders failed", err);
            set({ loading: false });
        }
    },
    clear: () =>
        set({
            orders: [],
            lastFetchedAt: null,
            nextCursor: null,
            loading: false,
        }),
}));