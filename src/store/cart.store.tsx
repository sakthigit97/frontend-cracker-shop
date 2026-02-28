import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItems = Record<string, any>;

export interface CartState {
  items: CartItems;
  hydrated: boolean;
  dirty: boolean;
  dirtyItems: CartItems;
  locked: boolean;
  addItem: (productId: string, qty?: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  hydrate: (items: CartItems) => void;
  markDirty: () => void;
  clearDirty: () => void;
  clearDirtyItems: () => void;
  lock: () => void;
  unlock: () => void;
  resetToGuest: () => void;
}

export const cartStore = create<CartState>()(
  persist(
    (set) => ({
      items: {},
      hydrated: false,
      dirty: false,
      dirtyItems: {},
      locked: false,

      addItem: (productId, qty = 1) =>
        set((state) => {
          if (state.locked) return state;

          const nextQty = (state.items[productId] || 0) + qty;
          const items = { ...state.items };
          const dirtyItems = { ...state.dirtyItems };

          if (nextQty <= 0) {
            delete items[productId];
            dirtyItems[productId] = 0;
          } else {
            items[productId] = nextQty;
            dirtyItems[productId] = nextQty;
          }

          return {
            items,
            dirtyItems,
            dirty: true,
          };
        }),

      removeItem: (productId) =>
        set((state) => {
          if (state.locked) return state;

          const items = { ...state.items };
          const dirtyItems = { ...state.dirtyItems };

          delete items[productId];
          dirtyItems[productId] = 0;

          return {
            items,
            dirtyItems,
            dirty: true,
          };
        }),

      clear: () =>
        set({
          items: {},
          dirtyItems: {},
          hydrated: true,
          dirty: true,
          locked: false,
        }),

      hydrate: (items) =>
        set({
          items,
          hydrated: true,
          dirty: false,
          dirtyItems: {},
        }),

      resetToGuest: () =>
        set({
          items: {},
          hydrated: false,
          dirty: false,
          dirtyItems: {},
          locked: false,
        }),

      markDirty: () => set({ dirty: true }),
      clearDirty: () => set({ dirty: false }),
      clearDirtyItems: () => set({ dirtyItems: {} }),

      lock: () => set({ locked: true }),
      unlock: () => set({ locked: false }),
    }),
    {
      name: "guest_cart",
      partialize: (state) => ({
        items: state.items,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.items) {
          state.hydrate(state.items);
        }
      },
    }
  )
);