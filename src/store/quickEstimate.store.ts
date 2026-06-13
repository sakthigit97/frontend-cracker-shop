import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface QuickEstimateState {
    items: Record<string, number>;
    addItem: (id: string, qty?: number) => void;
    removeItem: (id: string) => void;
    clear: () => void;
}

export const quickEstimateStore =
    create<QuickEstimateState>()(
        persist(
            (set) => ({
                items: {},
                addItem: (id, qty = 1) =>
                    set((state) => {
                        const next = (state.items[id] || 0) + qty;
                        const items = {
                            ...state.items,
                        };

                        if (next <= 0)
                            delete items[id];
                        else
                            items[id] = next;
                        return { items };
                    }),

                removeItem: (id) =>
                    set((state) => {
                        const items = {
                            ...state.items,
                        };

                        delete items[id];
                        return { items };
                    }),
                clear: () =>
                    set({
                        items: {},
                    }),
            }),
            {
                name: "quick_estimate",
            }
        )
    );