import { useEffect } from "react";
import { cartStore } from "../store/cart.store";

export function useCartStorageSync() {
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key !== "guest_cart" || !e.newValue) return;

            try {
                const parsed = JSON.parse(e.newValue);

                if (!parsed?.state?.items) return;
                cartStore.setState((state) => ({
                    ...state,
                    items: parsed.state.items,
                }));
            } catch {
            }
        };

        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);
}
