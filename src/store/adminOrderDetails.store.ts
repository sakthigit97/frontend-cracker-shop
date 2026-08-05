import { create } from "zustand";
import {
    getAdminOrderById,
    updateAdminOrder,
} from "../services/admin.api";

type UpdatePayload = {
    status?: string;
    adminComment?: string;
};

type State = {
    cache: Record<string, any>;
    loading: boolean;
    error: string | null;

    fetchOrder: (
        orderId: string,
        opts?: { force?: boolean }
    ) => Promise<void>;

    updateOrder: (
        orderId: string,
        payload: UpdatePayload
    ) => Promise<any>;

    clear: () => void;
};

export const useAdminOrderDetailsStore =
    create<State>((set, get) => ({
        cache: {},
        loading: false,
        error: null,

        fetchOrder: async (
            orderId,
            opts = {}
        ) => {
            if (!orderId) return;

            if (
                !opts.force &&
                get().cache[orderId]
            ) {
                return;
            }

            set({
                loading: true,
                error: null,
            });

            try {
                const data =
                    await getAdminOrderById(orderId);

                set((state) => ({
                    cache: {
                        ...state.cache,
                        [orderId]: data,
                    },
                }));
            } catch (e: any) {
                set({
                    error:
                        e?.message ??
                        "Failed to fetch order.",
                });

                throw e;
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
            set({
                loading: true,
                error: null,
            });

            try {
                const updated =
                    await updateAdminOrder(
                        orderId,
                        payload
                    );

                set((state) => ({
                    cache: {
                        ...state.cache,
                        [orderId]: {
                            ...state.cache[orderId],
                            ...updated,
                        },
                    },
                }));

                return updated;
            } catch (e: any) {
                set({
                    error:
                        e?.message ??
                        "Failed to update order.",
                });

                throw e;
            } finally {
                set({
                    loading: false,
                });
            }
        },

        clear: () =>
            set({
                cache: {},
                loading: false,
                error: null,
            }),
    }));