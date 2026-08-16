import { create } from "zustand";

import {
    getAdminBulkOrderById,
    updateAdminBulkOrder,
} from "../services/adminBulkOrder.api";

import { useAdminDashboardStore } from "./admin.store";
import { useAdminBulkOrdersStore } from "./adminBulkOrders.store";

interface FetchOptions {
    force?: boolean;
}

interface UpdatePayload {
    status?: string;
    adminComment?: string;
}

interface ApplyAdjustedOrderPayload {
    orderId: string;
    items: any[];
    pricing: any;
}

interface AdminBulkOrderDetailsState {
    cache: Record<string, any>;

    loading: boolean;

    loaded: boolean;

    error: string | null;

    fetchOrder: (
        orderId: string,
        options?: FetchOptions
    ) => Promise<void>;

    updateOrder: (
        orderId: string,
        payload: UpdatePayload
    ) => Promise<any>;

    /**
     * Immediately synchronize an adjusted bulk order
     * across:
     *
     * 1. Admin order-details cache
     * 2. Admin bulk-order list cache
     *
     * No additional API request is required because
     * the adjust-order API already returns the latest
     * items and pricing.
     */
    applyAdjustedOrder: (
        payload: ApplyAdjustedOrderPayload
    ) => void;

    clear: () => void;
}

export const useAdminBulkOrderDetailsStore =
    create<AdminBulkOrderDetailsState>(
        (set, get) => ({
            cache: {},

            loading: false,

            loaded: false,

            error: null,

            /* --------------------------------
             * Fetch Order
             * -------------------------------- */

            fetchOrder: async (
                orderId,
                options = {}
            ) => {
                if (!orderId) {
                    return;
                }

                /*
                 * Use cached order unless
                 * force refresh is requested.
                 */
                if (
                    !options.force &&
                    get().cache[orderId]
                ) {
                    set({
                        loaded: true,
                    });

                    return;
                }

                set({
                    loading: true,
                    loaded: false,
                    error: null,
                });

                try {
                    const data =
                        await getAdminBulkOrderById(
                            orderId
                        );

                    set((state) => ({
                        cache: {
                            ...state.cache,

                            [orderId]: data,
                        },

                        loaded: true,

                        error: null,
                    }));
                } catch (err: any) {
                    console.error(
                        "Failed to fetch bulk order:",
                        err
                    );

                    set({
                        error:
                            err?.message ??
                            "Failed to fetch bulk order.",

                        loaded: false,
                    });

                    throw err;
                } finally {
                    set({
                        loading: false,
                    });
                }
            },

            /* --------------------------------
             * Update Order
             * -------------------------------- */

            updateOrder: async (
                orderId,
                payload
            ) => {
                if (!orderId) {
                    throw new Error(
                        "Order ID is required."
                    );
                }

                set({
                    loading: true,
                    error: null,
                });

                try {
                    const updated =
                        await updateAdminBulkOrder(
                            orderId,
                            payload
                        );

                    /*
                     * Update detail-page cache
                     * immediately.
                     */
                    set((state) => {
                        const existing =
                            state.cache[orderId];

                        if (!existing) {
                            return {
                                error: null,
                            };
                        }

                        return {
                            cache: {
                                ...state.cache,

                                [orderId]: {
                                    ...existing,

                                    ...updated,

                                    ...(payload.status !==
                                        undefined
                                        ? {
                                            status:
                                                payload.status,
                                        }
                                        : {}),

                                    ...(payload.adminComment !==
                                        undefined
                                        ? {
                                            adminComment:
                                                payload.adminComment,
                                        }
                                        : {}),
                                },
                            },

                            loaded: true,

                            error: null,
                        };
                    });

                    /*
                     * Update all matching cached
                     * bulk-order list results.
                     *
                     * Existing status-filter behavior
                     * is preserved.
                     */
                    useAdminBulkOrdersStore
                        .getState()
                        .updateOrderInCache(
                            orderId,
                            {
                                ...updated,

                                ...payload,
                            }
                        );

                    /*
                     * Status changes can affect
                     * admin dashboard counts.
                     */
                    if (payload.status) {
                        await useAdminDashboardStore
                            .getState()
                            .fetch(true);
                    }

                    return updated;
                } catch (err: any) {
                    console.error(
                        "Failed to update bulk order:",
                        err
                    );

                    set({
                        error:
                            err?.message ??
                            "Failed to update bulk order.",
                    });

                    throw err;
                } finally {
                    set({
                        loading: false,
                    });
                }
            },

            /* --------------------------------
             * Apply Adjusted Order
             * -------------------------------- */

            applyAdjustedOrder: ({
                orderId,
                items,
                pricing,
            }) => {
                if (!orderId) {
                    return;
                }

                /*
                 * ------------------------------------------
                 * 1. Update admin detail-page cache
                 * ------------------------------------------
                 *
                 * The Admin Bulk Order Details page reads:
                 *
                 * cache[orderId]
                 *
                 * Therefore update the exact same object
                 * that the page is rendering.
                 */
                set((state) => {
                    const existing =
                        state.cache[orderId];

                    if (!existing) {
                        return {
                            error: null,
                        };
                    }

                    return {
                        cache: {
                            ...state.cache,

                            [orderId]: {
                                ...existing,

                                items,

                                pricing,
                            },
                        },

                        loaded: true,

                        error: null,
                    };
                });

                /*
                 * ------------------------------------------
                 * 2. Update admin bulk-order list cache
                 * ------------------------------------------
                 *
                 * Do NOT fetch the API again.
                 *
                 * The adjustment API has already returned
                 * the latest items and pricing.
                 *
                 * updateOrderInCache() also preserves the
                 * existing status-filter behavior.
                 */
                useAdminBulkOrdersStore
                    .getState()
                    .updateOrderInCache(
                        orderId,
                        {
                            items,

                            pricing,
                        }
                    );
            },

            clear: () => {
                set({
                    cache: {},
                    loading: false,
                    loaded: false,
                    error: null,
                });
            },
        })
    );