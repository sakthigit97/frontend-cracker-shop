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
    createOrder: (payload: CreateBulkOrderRequest) => Promise<BulkOrderResponse>;
    fetchOrders: (force?: boolean) => Promise<void>;
    fetchOrder: (
        orderId: string,
        force?: boolean
    ) => Promise<void>;
    cancelOrder: (orderId: string) => Promise<void>;
    clearOrder: () => void;
    clear: () => void;
    ordersLoaded: boolean;
    orderCache: Record<
        string,
        BulkOrderDetailsResponse
    >;
}

export const useBulkOrderHistoryStore = create<BulkOrderHistoryStore>(
    (set, get) => ({
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
        async createOrder(payload) {
            set({
                creating: true,
            });

            try {

                const response =
                    await createBulkOrder(payload);

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
        async fetchOrders(force = false) {
            if (get().ordersLoaded && !force) {
                return;
            }
            set({
                fetchingOrders: true,
            });
            try {
                const response = await getBulkOrders();
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
        async fetchOrder(orderId, force = false) {

            const cached = get().orderCache[orderId];
            if (cached && !force) {

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

                        [orderId]: response,

                    },

                }));

            } finally {

                set({
                    fetchingOrder: false,
                });

            }

        },
        async cancelOrder(orderId) {
            set({
                cancelling: true,
            });

            try {
                await cancelBulkOrder(orderId);
                set((state) => {

                    const updatedOrder =
                        state.order &&
                            state.order.orderId === orderId
                            ? {
                                ...state.order,
                                status: "CANCELLED",
                            }
                            : state.order;

                    return {

                        orders: state.orders.map((order) =>
                            order.orderId === orderId
                                ? {
                                    ...order,
                                    status: "CANCELLED",
                                }
                                : order
                        ),

                        order: updatedOrder,

                        orderCache: updatedOrder
                            ? {
                                ...state.orderCache,
                                [orderId]: updatedOrder,
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

        clearOrder() {
            set({
                order: null,
            });
        },
        clear() {
            set({
                orders: [],
                order: null,
                nextCursor: undefined,
                loading: false,
                ordersLoaded: false,
                orderCache: {},
                creating: false,
                fetchingOrders: false,
                fetchingOrder: false,
                cancelling: false,
            });
        },
    })
);
