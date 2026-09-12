import { create } from "zustand";

import {
    getAdminBulkOrderById,
    updateAdminBulkOrder,
} from "../services/adminBulkOrder.api";

import { useAdminDashboardStore } from "./admin.store";
import { restoreBulkOrder } from "../services/bulkOrder.api";
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

    restoring: boolean;

    error: string | null;

    fetchOrder: (
        orderId: string,
        options?: FetchOptions
    ) => Promise<void>;

    updateOrder: (
        orderId: string,
        payload: UpdatePayload
    ) => Promise<any>;

    restoreOrder: (
        orderId: string
    ) => Promise<void>;

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
            restoring: false,

            loaded: false,

            error: null,
            fetchOrder: async (
                orderId,
                options = {}
            ) => {
                if (!orderId) {
                    return;
                }

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

            restoreOrder: async (orderId) => {
                if (!orderId) {
                    throw new Error("Order ID is required.");
                }

                set({
                    restoring: true,
                    error: null,
                });

                try {
                    await restoreBulkOrder(orderId);
                    await get().fetchOrder(orderId, {
                        force: true,
                    });

                    await useAdminBulkOrdersStore
                        .getState()
                        .fetchInitial(true);

                    await useAdminDashboardStore
                        .getState()
                        .fetch(true);
                } catch (err: any) {
                    console.error(
                        "Failed to reopen bulk order:",
                        err
                    );

                    set({
                        error:
                            err?.message ??
                            "Failed to reopen bulk order.",
                    });

                    throw err;
                } finally {
                    set({
                        restoring: false,
                    });
                }
            },

            applyAdjustedOrder: ({
                orderId,
                items,
                pricing,
            }) => {
                if (!orderId) {
                    return;
                }
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