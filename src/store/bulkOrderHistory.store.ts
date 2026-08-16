import { create } from "zustand";
import {
    cancelBulkOrder,
    createBulkOrder,
    getBulkOrder,
    getBulkOrders,
} from "../services/bulkOrder.api";
import type {
    BulkOrderDetailsResponse,
    BulkOrderResponse,
    CreateBulkOrderRequest,
    BulkOrderProduct,
    BulkOrderPricing,
} from "../types/bulkOrder";

export interface BulkOrderSummary {
    orderId: string;
    status: string;
    schemeId: string;
    createdAt: number;
    pricing: {
        grandTotal: number;
    };
    items: {
        productId: string;
        quantity: number;
    }[];
    customer?: {
        name?: string;
        mobile?: string;
    };
}

interface BulkOrderHistoryStore {
    orders: BulkOrderSummary[];

    order: BulkOrderDetailsResponse | null;

    loading: boolean;
    creating: boolean;
    fetchingOrders: boolean;
    fetchingOrder: boolean;
    cancelling: boolean;

    nextCursor?: any;

    ordersLoaded: boolean;

    orderCache: Record<
        string,
        BulkOrderDetailsResponse
    >;

    createOrder: (
        payload: CreateBulkOrderRequest
    ) => Promise<BulkOrderResponse>;

    fetchOrders: (
        force?: boolean
    ) => Promise<void>;

    fetchOrder: (
        orderId: string,
        force?: boolean
    ) => Promise<void>;

    cancelOrder: (
        orderId: string
    ) => Promise<void>;

    /*
     * Update the currently cached order/list immediately
     * after a successful bulk-order adjustment.
     */
    applyAdjustedOrder: (params: {
        orderId: string;
        items: BulkOrderProduct[];
        pricing: BulkOrderPricing;
    }) => void;

    clearOrder: () => void;

    clear: () => void;
}

export const useBulkOrderHistoryStore =
    create<BulkOrderHistoryStore>((set, get) => ({
        orders: [],

        order: null,

        loading: false,
        creating: false,
        fetchingOrders: false,
        fetchingOrder: false,
        cancelling: false,

        nextCursor: undefined,

        ordersLoaded: false,

        orderCache: {},

        /*
         * --------------------------------------------------
         * CREATE ORDER
         * --------------------------------------------------
         */
        async createOrder(payload) {
            set({
                creating: true,
            });

            try {
                const response =
                    await createBulkOrder(payload);

                /*
                 * Do not keep the old order list marked as
                 * fully loaded after creating a new order.
                 */
                set({
                    ordersLoaded: false,
                });

                return response;
            } finally {
                set({
                    creating: false,
                });
            }
        },

        /*
         * --------------------------------------------------
         * FETCH ORDERS
         * --------------------------------------------------
         */
        async fetchOrders(force = false) {
            if (
                get().ordersLoaded &&
                !force
            ) {
                return;
            }

            set({
                fetchingOrders: true,
            });

            try {
                const response =
                    await getBulkOrders();

                set({
                    orders: response.items,
                    ordersLoaded: true,
                });
            } finally {
                set({
                    fetchingOrders: false,
                });
            }
        },

        /*
         * --------------------------------------------------
         * FETCH SINGLE ORDER
         * --------------------------------------------------
         */
        async fetchOrder(
            orderId,
            force = false
        ) {
            const cached =
                get().orderCache[orderId];

            /*
             * Use the latest Zustand cache unless
             * explicitly forced.
             */
            if (
                cached &&
                !force
            ) {
                set({
                    order: cached,
                });

                return;
            }

            set({
                fetchingOrder: true,
            });

            try {
                const response =
                    await getBulkOrder(orderId);

                set((state) => ({
                    order: response,

                    orderCache: {
                        ...state.orderCache,

                        [orderId]:
                            response,
                    },
                }));
            } finally {
                set({
                    fetchingOrder: false,
                });
            }
        },

        /*
         * --------------------------------------------------
         * APPLY ADJUSTED ORDER
         *
         * This is the important new method.
         *
         * It updates:
         *
         * 1. Current order details
         * 2. Single-order cache
         * 3. Bulk order list
         *
         * No browser refresh is required.
         * --------------------------------------------------
         */
        applyAdjustedOrder({
            orderId,
            items,
            pricing,
        }) {
            set((state) => {
                /*
                 * ------------------------------------------
                 * Update detailed order cache
                 * ------------------------------------------
                 */
                const cachedOrder =
                    state.orderCache[
                    orderId
                    ];

                const updatedCachedOrder =
                    cachedOrder
                        ? {
                            ...cachedOrder,

                            items,

                            pricing,
                        }
                        : null;

                /*
                 * ------------------------------------------
                 * Update currently opened order
                 * ------------------------------------------
                 */
                const updatedCurrentOrder =
                    state.order &&
                        state.order.orderId ===
                        orderId
                        ? {
                            ...state.order,

                            items,

                            pricing,
                        }
                        : state.order;

                /*
                 * ------------------------------------------
                 * Update order list
                 * ------------------------------------------
                 */
                const updatedOrders =
                    state.orders.map(
                        (order) => {
                            if (
                                order.orderId !==
                                orderId
                            ) {
                                return order;
                            }

                            return {
                                ...order,

                                pricing: {
                                    ...order.pricing,

                                    grandTotal:
                                        pricing.grandTotal,
                                },

                                items:
                                    items.map(
                                        (
                                            item
                                        ) => ({
                                            productId:
                                                item.productId,

                                            quantity:
                                                item.quantity,
                                        })
                                    ),
                            };
                        }
                    );

                return {
                    orders:
                        updatedOrders,

                    order:
                        updatedCurrentOrder,

                    orderCache:
                        updatedCachedOrder
                            ? {
                                ...state.orderCache,

                                [orderId]:
                                    updatedCachedOrder,
                            }
                            : state.orderCache,
                };
            });
        },

        /*
         * --------------------------------------------------
         * CANCEL ORDER
         * --------------------------------------------------
         */
        async cancelOrder(orderId) {
            set({
                cancelling: true,
            });

            try {
                await cancelBulkOrder(
                    orderId
                );

                set((state) => {
                    const updatedOrder =
                        state.order &&
                            state.order.orderId ===
                            orderId
                            ? {
                                ...state.order,

                                status:
                                    "CANCELLED",
                            }
                            : state.order;

                    return {
                        orders:
                            state.orders.map(
                                (order) =>
                                    order.orderId ===
                                        orderId
                                        ? {
                                            ...order,

                                            status:
                                                "CANCELLED",
                                        }
                                        : order
                            ),

                        order:
                            updatedOrder,

                        orderCache:
                            updatedOrder
                                ? {
                                    ...state.orderCache,

                                    [orderId]:
                                        updatedOrder,
                                }
                                : state.orderCache,
                    };
                });
            } finally {
                set({
                    cancelling: false,
                });
            }
        },

        /*
         * --------------------------------------------------
         * CLEAR CURRENT ORDER
         * --------------------------------------------------
         */
        clearOrder() {
            set({
                order: null,
            });
        },

        /*
         * --------------------------------------------------
         * CLEAR EVERYTHING
         * --------------------------------------------------
         */
        clear() {
            set({
                orders: [],

                order: null,

                nextCursor:
                    undefined,

                loading: false,

                ordersLoaded: false,

                orderCache: {},

                creating: false,

                fetchingOrders: false,

                fetchingOrder: false,

                cancelling: false,
            });
        },
    }));