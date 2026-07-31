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
    setQuantity: (
        productId: string,
        quantity: number
    ) => void;
    address: BulkOrderAddress | null;
    loading: boolean;
    setStep: (step: BulkOrderStep) => void;
    nextStep: () => void;
    previousStep: () => void;
    setScheme: (scheme: BulkScheme | null) => void;
    setAdminCode: (code: string) => void;
    setAdminCodeVerified: (verified: boolean) => void;
    setSearch: (search: string) => void;
    setLoading: (loading: boolean) => void;
    setAddress: (address: BulkOrderAddress) => void;
    addItem: (item: BulkOrderProduct) => void;
    updateQuantity: (
        productId: string,
        quantity: number
    ) => void;
    removeItem: (productId: string) => void;
    clearItems: () => void;
    clearAll: () => void;
}

export const bulkOrderStore = create<BulkOrderStore>()(
    persist(
        (set, get) => ({
            step: BULK_ORDER_STEPS.SCHEME,
            scheme: null,
            adminCode: "",
            adminCodeVerified: false,
            search: "",
            items: [],
            address: null,
            loading: false,
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

            setScheme: (scheme) =>
                set({
                    scheme,
                    items: [],
                    search: "",
                }),

            setAdminCode: (adminCode) =>
                set({
                    adminCode,
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

            setQuantity: (productId, quantity) =>
                set((state) => {

                    const items = [...state.items];

                    const index = items.findIndex(
                        (x) => x.productId === productId
                    );

                    if (quantity <= 0) {
                        return {
                            items: items.filter(
                                (x) => x.productId !== productId
                            ),
                        };
                    }

                    if (index >= 0) {

                        items[index] = {
                            ...items[index],
                            quantity,
                            total: quantity *
                                items[index].cartonQty *
                                items[index].unitPrice,
                        };

                    } else {
                        return { items };
                    }
                    return { items };
                }),


            addItem: (item) => {

                const items = get().items;
                const exists = items.find(
                    (x) =>
                        x.productId === item.productId
                );

                if (exists) {

                    set({
                        items: items.map((x) =>
                            x.productId === item.productId
                                ? item
                                : x
                        ),
                    });

                    return;

                }

                set({
                    items: [
                        ...items,
                        item,
                    ],
                });

            },

            updateQuantity: (
                productId,
                quantity
            ) => {

                if (quantity <= 0) {

                    get().removeItem(productId);

                    return;

                }

                set({

                    items: get().items.map(
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

                });

            },

            removeItem: (
                productId
            ) =>

                set({

                    items: get().items.filter(
                        (item) =>
                            item.productId !==
                            productId
                    ),

                }),

            clearItems: () =>

                set({

                    items: [],

                }),

            clearAll: () =>

                set({

                    step: BULK_ORDER_STEPS.SCHEME,

                    scheme: null,

                    adminCode: "",

                    adminCodeVerified: false,

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