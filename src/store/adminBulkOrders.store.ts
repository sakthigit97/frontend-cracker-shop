import { create } from "zustand";
import { getAdminBulkOrders } from "../services/adminBulkOrder.api";

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

    error: string | null;

    setFilters: (
        filters: AdminBulkOrderFilters
    ) => void;

    fetchInitial: (
        force?: boolean
    ) => Promise<void>;

    fetchMore: () => Promise<void>;

    updateOrderInCache: (
        orderId: string,
        updates: Partial<any>
    ) => void;

    clear: () => void;
}

/* ---------------------------------------------------------
 * Cache Key
 * --------------------------------------------------------- */

function buildCacheKey(
    filters: AdminBulkOrderFilters
) {
    return JSON.stringify({
        status: filters.status,
        dateRange: filters.dateRange,
        orderId: filters.orderId || null,
    });
}

/* ---------------------------------------------------------
 * API Params
 * --------------------------------------------------------- */

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

/* ---------------------------------------------------------
 * Store
 * --------------------------------------------------------- */

export const useAdminBulkOrdersStore =
    create<AdminBulkOrdersState>(
        (set, get) => ({

            filters: {
                status: "ORDER_PLACED",
                dateRange: "today",
            },

            data: {},

            loading: {},

            error: null,

            /* -------------------------------------------------
             * Filters
             * ------------------------------------------------- */

            setFilters: (filters) => {
                set({
                    filters,
                    error: null,
                });
            },

            /* -------------------------------------------------
             * Initial Fetch
             * ------------------------------------------------- */

            fetchInitial: async (
                force = false
            ) => {
                const {
                    filters,
                    data,
                    loading,
                } = get();

                const key =
                    buildCacheKey(filters);

                if (
                    !force &&
                    (
                        data[key]?.initialized ||
                        loading[key]
                    )
                ) {
                    return;
                }

                set({
                    error: null,

                    loading: {
                        ...loading,
                        [key]: true,
                    },
                });

                try {
                    const response =
                        await getAdminBulkOrders(
                            buildApiParams(
                                filters
                            )
                        );

                    set((state) => ({
                        data: {
                            ...state.data,

                            [key]: {
                                items:
                                    response.items ??
                                    [],

                                nextCursor:
                                    response.nextCursor ??
                                    null,

                                initialized: true,
                            },
                        },

                        error: null,
                    }));
                } catch (err: any) {
                    console.error(
                        "Failed to fetch admin bulk orders:",
                        err
                    );

                    set({
                        error:
                            err?.message ??
                            "Failed to fetch bulk orders.",
                    });
                } finally {
                    set((state) => ({
                        loading: {
                            ...state.loading,
                            [key]: false,
                        },
                    }));
                }
            },

            /* -------------------------------------------------
             * Update Existing Cached Orders
             *
             * Same behavior as Retail Admin Orders:
             *
             * If status changes from:
             *
             * ORDER_PLACED -> PAID
             *
             * the order is removed from ORDER_PLACED cache.
             *
             * It is NOT artificially inserted into PAID cache.
             * PAID cache will be fetched normally.
             * ------------------------------------------------- */

            updateOrderInCache: (
                orderId,
                updates
            ) =>
                set((state) => {
                    const updatedData = {
                        ...state.data,
                    };

                    Object.keys(
                        updatedData
                    ).forEach((key) => {
                        const cache =
                            updatedData[key];

                        if (!cache) {
                            return;
                        }

                        const cachedFilters:
                            AdminBulkOrderFilters =
                            JSON.parse(key);

                        const updatedItems =
                            cache.items
                                .map((order) => {
                                    if (
                                        order.orderId !==
                                        orderId
                                    ) {
                                        return order;
                                    }

                                    return {
                                        ...order,
                                        ...updates,
                                    };
                                })
                                .filter((order) => {
                                    if (
                                        cachedFilters.status &&
                                        order.status !==
                                            cachedFilters.status
                                    ) {
                                        return false;
                                    }

                                    return true;
                                });

                        updatedData[key] = {
                            ...cache,
                            items: updatedItems,
                        };
                    });

                    return {
                        data: updatedData,
                    };
                }),

            /* -------------------------------------------------
             * Fetch More
             * ------------------------------------------------- */

            fetchMore: async () => {
                const {
                    filters,
                    data,
                    loading,
                } = get();

                const key =
                    buildCacheKey(filters);

                const cache =
                    data[key];

                if (
                    !cache?.nextCursor ||
                    loading[key]
                ) {
                    return;
                }

                set({
                    error: null,

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

                    set((state) => {
                        const latest =
                            state.data[key];

                        if (!latest) {
                            return state;
                        }

                        return {
                            data: {
                                ...state.data,

                                [key]: {
                                    ...latest,

                                    items: [
                                        ...latest.items,

                                        ...(response.items ??
                                            []),
                                    ],

                                    nextCursor:
                                        response.nextCursor ??
                                        null,
                                },
                            },

                            error: null,
                        };
                    });
                } catch (err: any) {
                    console.error(
                        "Failed to fetch more bulk orders:",
                        err
                    );

                    set({
                        error:
                            err?.message ??
                            "Failed to load more bulk orders.",
                    });
                } finally {
                    set((state) => ({
                        loading: {
                            ...state.loading,
                            [key]: false,
                        },
                    }));
                }
            },

            /* -------------------------------------------------
             * Clear
             * ------------------------------------------------- */

            clear: () => {
                set({
                    data: {},
                    loading: {},
                    error: null,
                });
            },
        })
    );