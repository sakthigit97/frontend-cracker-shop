import { create } from "zustand";

import {
    getAdminBulkOrderById,
    updateAdminBulkOrder,
} from "../services/adminBulkOrder.api";

interface FetchOptions {
    force?: boolean;
}

interface AdminBulkOrderDetailsState {
    cache: Record<string, any>;

    loading: boolean;
    loaded: boolean;

    fetchOrder: (
        orderId: string,
        options?: FetchOptions
    ) => Promise<void>;
    updateOrder: (
        orderId: string,
        payload: {
            status?: string;
            adminComment?: string;
        }
    ) => Promise<void>;

    clear: () => void;
}

export const useAdminBulkOrderDetailsStore =
    create<AdminBulkOrderDetailsState>((set, get) => ({
        cache: {},

        loading: false,

        loaded: false,

        async fetchOrder(orderId, options) {

            const state = get();

            if (
                state.cache[orderId] &&
                !options?.force
            ) {
                set({ loaded: true });
                return;
            }

            set({
                loading: true,
                loaded: false,
            });

            try {

                const response = await getAdminBulkOrderById(orderId);
                set(state => ({
                    cache: {
                        ...state.cache,
                        [orderId]: response,
                    },
                    loaded: true,
                }));

            } finally {

                set({
                    loading: false,
                });

            }
        },

        async updateOrder(orderId, payload) {
            set({
                loading: false,
            });
            try {
                await updateAdminBulkOrder(
                    orderId,
                    payload
                );

                set((state) => {
                    const existing =
                        state.cache[orderId];

                    if (!existing) {
                        return {
                            loading: false,
                        };
                    }

                    return {
                        cache: {
                            ...state.cache,

                            [orderId]: {
                                ...existing,

                                ...(payload.status
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
                    };
                });
            } finally {

                set({
                    loading: false,
                });
            }
        },

        clear() {
            set({
                cache: {},
                loading: false,
                loaded: false,
            });
        },
    }));