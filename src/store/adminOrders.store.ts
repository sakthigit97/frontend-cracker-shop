import { create } from "zustand";
import { getAdminOrders } from "../services/admin.api";

export interface AdminOrderFilters {
    status: string;
    dateRange: "today" | "7" | "30";
    orderId?: string;
}

interface OrdersCache {
    items: any[];
    nextCursor: any | null;
    initialized: boolean;
}

interface AdminOrdersState {
    filters: AdminOrderFilters;
    data: Record<string, OrdersCache>;
    loading: Record<string, boolean>;

    setFilters: (f: AdminOrderFilters) => void;
    fetchInitial: () => Promise<void>;
    fetchMore: () => Promise<void>;
    clear: () => void;
}

function buildApiParams(filters: AdminOrderFilters) {
    const now = Date.now();
    let fromDate: number;

    if (filters.dateRange === "today") {
        fromDate = new Date().setHours(0, 0, 0, 0);
    } else {
        fromDate =
            now - Number(filters.dateRange) * 24 * 60 * 60 * 1000;
    }

    return {
        status: filters.status,
        fromDate,
        toDate: now,
        orderId: filters.orderId,
        limit: 10,
    };
}

export const useAdminOrdersStore = create<AdminOrdersState>(
    (set, get) => ({
        filters: {
            status: "ORDER_PLACED",
            dateRange: "today",
        },
        data: {},
        loading: {},

        setFilters: (filters) => {
            set({ filters });
        },

        fetchInitial: async () => {
            const { filters, data, loading } = get();

            // ✅ SEMANTIC CACHE KEY (FIX)
            const key = JSON.stringify({
                status: filters.status,
                dateRange: filters.dateRange,
                orderId: filters.orderId || null,
            });

            if (data[key]?.initialized || loading[key]) return;

            set({
                loading: { ...loading, [key]: true },
            });

            try {
                const res = await getAdminOrders(
                    buildApiParams(filters)
                );

                set((state) => ({
                    data: {
                        ...state.data,
                        [key]: {
                            items: res.items,
                            nextCursor: res.nextCursor ?? null,
                            initialized: true,
                        },
                    },
                }));
            } finally {
                set((state) => ({
                    loading: { ...state.loading, [key]: false },
                }));
            }
        },

        fetchMore: async () => {
            const { filters, data, loading } = get();

            const key = JSON.stringify({
                status: filters.status,
                dateRange: filters.dateRange,
                orderId: filters.orderId || null,
            });

            const cache = data[key];
            if (!cache?.nextCursor || loading[key]) return;

            set({
                loading: { ...loading, [key]: true },
            });

            try {
                const res = await getAdminOrders({
                    ...buildApiParams(filters),
                    cursor: cache.nextCursor,
                });

                set((state) => ({
                    data: {
                        ...state.data,
                        [key]: {
                            ...cache,
                            items: [...cache.items, ...res.items],
                            nextCursor: res.nextCursor ?? null,
                        },
                    },
                }));
            } finally {
                set((state) => ({
                    loading: { ...state.loading, [key]: false },
                }));
            }
        },

        clear: () => set({ data: {}, loading: {} }),
    })
);