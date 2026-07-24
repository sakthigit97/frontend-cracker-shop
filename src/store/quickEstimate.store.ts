import { create } from "zustand";
import { persist } from "zustand/middleware";

const EXPIRY_MS = 30 * 60 * 1000;
export interface QuickEstimateState {
    items: Record<string, number>;
    lastUpdated: number;
    addItem: (id: string, qty?: number) => void;
    removeItem: (id: string) => void;
    clear: () => void;
}

export const quickEstimateStore = create<QuickEstimateState>()(
    persist(
        (set) => ({
            items: {},
            lastUpdated: Date.now(),

            addItem: (id, qty = 1) =>
                set((state) => {
                    if (!id) return state;

                    const current = state.items[id] || 0;
                    const next = current + qty;

                    const items = { ...state.items };

                    if (next <= 0) {
                        delete items[id];
                    } else {
                        items[id] = next;
                    }

                    return {
                        items,
                        lastUpdated: Date.now(),
                    };
                }),

            removeItem: (id) =>
                set((state) => {
                    const items = { ...state.items };
                    delete items[id];

                    return {
                        items,
                        lastUpdated: Date.now(),
                    };
                }),

            clear: () =>
                set({
                    items: {},
                    lastUpdated: Date.now(),
                }),
        }),
        {
            name: "quick_estimate",

            merge: (persistedState: any, currentState) => {
                if (!persistedState) return currentState;

                const expired =
                    Date.now() - (persistedState.lastUpdated || 0) > EXPIRY_MS;

                if (expired) {
                    return {
                        ...currentState,
                        items: {},
                        lastUpdated: Date.now(),
                    };
                }

                return {
                    ...currentState,
                    ...persistedState,
                };
            },
        }
    )
);