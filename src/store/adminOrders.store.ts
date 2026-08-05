import { create } from "zustand";
import { getAdminOrders } from "../services/admin.api";

export interface AdminOrderFilters {
    status: string;
    dateRange: "all" | "today" | "7" | "30";
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
    fetchInitial: (force?: boolean) => Promise<void>;
    fetchMore: () => Promise<void>;
    clear: () => void;
    updateOrderInCache: (
        orderId: string,
        updates: Partial<any>
    ) => void;
}

function buildCacheKey(filters: AdminOrderFilters) {
    return JSON.stringify({
        status: filters.status,
        dateRange: filters.dateRange,
        orderId: filters.orderId || null,
    });
}

function buildApiParams(filters: AdminOrderFilters) {
    const now = Date.now();
    if (filters.dateRange === "all") {
        return {
            status: filters.status,
            orderId: filters.orderId,
            limit: 10,
        };
    }
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
        fetchInitial: async (force = false) => {
            const { filters, data, loading } = get();
            const key = buildCacheKey(filters);
            if (!force && (data[key]?.initialized || loading[key])) {
                return;
            }
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
            } catch (error) {
                console.error(error);
            }
            finally {
                set((state) => ({
                    loading: { ...state.loading, [key]: false },
                }));
            }
        },
        updateOrderInCache: (orderId, updates) =>
            set((state) => {
                const data = { ...state.data };

                Object.keys(data).forEach((key) => {
                    const filters: AdminOrderFilters = JSON.parse(key);
                    data[key] = {
                        ...data[key],
                        items: data[key].items
                            .map((order) =>
                                order.orderId === orderId
                                    ? {
                                        ...order,
                                        ...updates,
                                    }
                                    : order
                            )
                            .filter((order) => {
                                if (
                                    filters.status &&
                                    order.status !== filters.status
                                ) {
                                    return false;
                                }

                                return true;
                            }),
                    };
                });

                return { data };
            }),
        fetchMore: async () => {
            const { filters, data, loading } = get();
            const key = buildCacheKey(filters);
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

                set((state) => {
                    const latest = state.data[key];

                    if (!latest) {
                        return state;
                    }

                    return {
                        data: {
                            ...state.data,
                            [key]: {
                                ...latest,
                                items: [...latest.items, ...res.items],
                                nextCursor: res.nextCursor ?? null,
                            },
                        },
                    };
                });
            } finally {
                set((state) => ({
                    loading: { ...state.loading, [key]: false },
                }));
            }
        },

        clear: () => set({ data: {}, loading: {} }),
    })
);