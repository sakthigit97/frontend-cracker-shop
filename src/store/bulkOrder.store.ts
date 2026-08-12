import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
    BulkOrderAddress,
    BulkOrderProduct,
    BulkScheme,
    BulkOrderStep,
} from "../types/bulkOrder";

import { BULK_ORDER_STEPS } from "../constants/bulkOrderSteps";

interface BulkOrderStore {
    step: BulkOrderStep;
    scheme: BulkScheme | null;
    adminCode: string;
    adminCodeVerified: boolean;
    search: string;
    items: BulkOrderProduct[];
    address: BulkOrderAddress | null;
    loading: boolean;
    setStep: (step: BulkOrderStep) => void;
    nextStep: () => void;
    previousStep: () => void;
    setScheme: (
        scheme: BulkScheme | null
    ) => void;
    setAdminCode: (
        code: string
    ) => void;
    setAdminCodeVerified: (
        verified: boolean
    ) => void;
    setSearch: (
        search: string
    ) => void;

    setLoading: (
        loading: boolean
    ) => void;

    setAddress: (
        address: BulkOrderAddress
    ) => void;

    setQuantity: (
        productId: string,
        quantity: number
    ) => void;

    addItem: (
        item: BulkOrderProduct
    ) => void;

    updateQuantity: (
        productId: string,
        quantity: number
    ) => void;

    removeItem: (
        productId: string
    ) => void;

    clearItems: () => void;

    clearAll: () => void;
}

export const bulkOrderStore =
    create<BulkOrderStore>()(
        persist(
            (set, get) => ({
                step:
                    BULK_ORDER_STEPS.SCHEME,

                scheme: null,

                adminCode: "",

                adminCodeVerified:
                    false,

                search: "",

                items: [],

                address: null,

                loading: false,

                /* --------------------------------
                 * Step Navigation
                 * -------------------------------- */

                setStep: (step) =>
                    set({
                        step,
                    }),

                nextStep: () =>
                    set((state) => ({
                        step: Math.min(
                            state.step + 1,
                            BULK_ORDER_STEPS.REVIEW
                        ) as BulkOrderStep,
                    })),

                previousStep: () =>
                    set((state) => ({
                        step: Math.max(
                            state.step - 1,
                            BULK_ORDER_STEPS.SCHEME
                        ) as BulkOrderStep,
                    })),

                /* --------------------------------
                 * Scheme
                 * -------------------------------- */

                setScheme: (scheme) =>
                    set({
                        scheme,
                        items: [],
                        search: "",
                        adminCode: "",

                        adminCodeVerified:
                            false,
                    }),

                setAdminCode: (adminCode) =>
                    set({
                        adminCode,
                        adminCodeVerified: false,
                    }),

                setAdminCodeVerified: (
                    adminCodeVerified
                ) =>
                    set({
                        adminCodeVerified,
                    }),


                setSearch: (search) =>
                    set({
                        search,
                    }),

                setLoading: (loading) =>
                    set({
                        loading,
                    }),
                setAddress: (address) =>
                    set({
                        address,
                    }),

                setQuantity: (
                    productId,
                    quantity
                ) =>
                    set((state) => {
                        if (quantity <= 0) {
                            return {
                                items:
                                    state.items.filter(
                                        (item) =>
                                            item.productId !==
                                            productId
                                    ),
                            };
                        }

                        return {
                            items:
                                state.items.map(
                                    (item) => {
                                        if (
                                            item.productId !==
                                            productId
                                        ) {
                                            return item;
                                        }

                                        return {
                                            ...item,
                                            quantity,
                                            total:
                                                quantity *
                                                item.cartonQty *
                                                item.unitPrice,
                                        };
                                    }
                                ),
                        };
                    }),

                addItem: (item) =>
                    set((state) => {
                        const existing =
                            state.items.find(
                                (currentItem) =>
                                    currentItem.productId ===
                                    item.productId
                            );

                        if (existing) {
                            return {
                                items:
                                    state.items.map(
                                        (currentItem) =>
                                            currentItem.productId ===
                                                item.productId
                                                ? item
                                                : currentItem
                                    ),
                            };
                        }

                        return {
                            items: [
                                ...state.items,
                                item,
                            ],
                        };
                    }),

                updateQuantity: (
                    productId,
                    quantity
                ) => {
                    if (quantity <= 0) {
                        get().removeItem(
                            productId
                        );

                        return;
                    }

                    set((state) => ({
                        items:
                            state.items.map(
                                (item) => {
                                    if (
                                        item.productId !==
                                        productId
                                    ) {
                                        return item;
                                    }

                                    return {
                                        ...item,
                                        quantity,
                                        total:
                                            quantity *
                                            item.cartonQty *
                                            item.unitPrice,
                                    };
                                }
                            ),
                    }));
                },

                removeItem: (productId) =>
                    set((state) => ({
                        items:
                            state.items.filter(
                                (item) =>
                                    item.productId !==
                                    productId
                            ),
                    })),

                clearItems: () =>
                    set({
                        items: [],
                    }),
                clearAll: () =>
                    set({
                        step:
                            BULK_ORDER_STEPS.SCHEME,

                        scheme: null,

                        adminCode: "",

                        adminCodeVerified:
                            false,

                        search: "",

                        items: [],

                        address: null,

                        loading: false,
                    }),
            }),
            {
                name: "bulk-order-store",
            }
        )
    );