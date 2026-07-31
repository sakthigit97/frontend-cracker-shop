import { create } from "zustand";

import {
    getAdminBulkOrders,
} from "../services/adminBulkOrder.api";

export interface AdminBulkOrderFilters {
    status: string;
    dateRange: "all" | "today" | "7" | "30";
    orderId?: string;
}

interface OrdersCache {
    items: any[];
    nextCursor: any | null;
    initialized: boolean;
}

interface AdminBulkOrdersState {

    filters: AdminBulkOrderFilters;

    data: Record<string, OrdersCache>;

    loading: Record<string, boolean>;

    setFilters: (
        filters: AdminBulkOrderFilters
    ) => void;

    fetchInitial: () => Promise<void>;

    fetchMore: () => Promise<void>;

    clear: () => void;

}

function buildApiParams(
    filters: AdminBulkOrderFilters
) {

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

        fromDate = new Date().setHours(
            0,
            0,
            0,
            0
        );

    } else {

        fromDate =
            now -
            Number(filters.dateRange) *
            24 *
            60 *
            60 *
            1000;

    }

    return {

        status: filters.status,

        fromDate,

        toDate: now,

        orderId: filters.orderId,

        limit: 10,

    };

}

export const useAdminBulkOrdersStore =
    create<AdminBulkOrdersState>(
        (set, get) => ({

            filters: {

                status: "ORDER_PLACED",

                dateRange: "today",

            },

            data: {},

            loading: {},

            setFilters: (filters) => {

                set({
                    filters,
                });

            },

            fetchInitial: async () => {

                const {
                    filters,
                    data,
                    loading,
                } = get();

                const key = JSON.stringify({

                    status: filters.status,

                    dateRange: filters.dateRange,

                    orderId:
                        filters.orderId || null,

                });

                if (
                    data[key]?.initialized ||
                    loading[key]
                ) {

                    return;

                }

                set({

                    loading: {

                        ...loading,

                        [key]: true,

                    },

                });

                try {

                    const response =
                        await getAdminBulkOrders(
                            buildApiParams(filters)
                        );

                    set((state) => ({

                        data: {

                            ...state.data,

                            [key]: {

                                items:
                                    response.items,

                                nextCursor:
                                    response.nextCursor ??
                                    null,

                                initialized: true,

                            },

                        },

                    }));

                } finally {

                    set((state) => ({

                        loading: {

                            ...state.loading,

                            [key]: false,

                        },

                    }));

                }

            },

            fetchMore: async () => {

                const {
                    filters,
                    data,
                    loading,
                } = get();

                const key = JSON.stringify({

                    status: filters.status,

                    dateRange:
                        filters.dateRange,

                    orderId:
                        filters.orderId || null,

                });

                const cache =
                    data[key];

                if (
                    !cache?.nextCursor ||
                    loading[key]
                ) {

                    return;

                }

                set({

                    loading: {

                        ...loading,

                        [key]: true,

                    },

                });

                try {

                    const response =
                        await getAdminBulkOrders({

                            ...buildApiParams(
                                filters
                            ),

                            cursor:
                                cache.nextCursor,

                        });

                    set((state) => ({

                        data: {

                            ...state.data,

                            [key]: {

                                ...cache,

                                items: [

                                    ...cache.items,

                                    ...response.items,

                                ],

                                nextCursor:
                                    response.nextCursor ??
                                    null,

                            },

                        },

                    }));

                } finally {

                    set((state) => ({

                        loading: {

                            ...state.loading,

                            [key]: false,

                        },

                    }));

                }

            },

            clear: () =>

                set({

                    data: {},

                    loading: {},

                }),

        })
    );