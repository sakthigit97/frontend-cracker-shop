import { useEffect, useRef } from "react";
import { cartStore } from "../store/cart.store";
import { apiFetch } from "../services/api";

export function useCartSync(isLoggedIn: boolean) {
    const dirtyItems = cartStore((s) => s.dirtyItems);
    const hydrated = cartStore((s) => s.hydrated);
    const clearDirty = cartStore((s) => s.clearDirty);
    const clearDirtyItems = cartStore((s) => s.clearDirtyItems);
    const locked = cartStore((s) => s.locked);

    const retryCountRef = useRef(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const baseDelay = 4000;
    const maxDelay = 20000;

    const delay = Math.min(
        baseDelay * Math.pow(2, retryCountRef.current),
        maxDelay
    );

    useEffect(() => {
        if (!isLoggedIn) return;
        if (!hydrated) return;
        if (locked) return;
        if (Object.keys(dirtyItems).length === 0) return;

        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
            const runSync = async () => {
                try {
                    await apiFetch("/cart/sync", {
                        method: "POST",
                        body: JSON.stringify({
                            items: dirtyItems,
                            mode: "partial",
                        }),
                    });

                    clearDirty();
                    clearDirtyItems();
                    retryCountRef.current = 0;
                } catch (err) {
                    retryCountRef.current += 1;
                    console.error("Cart sync failed, retry scheduled", err);
                }
            };

            if ("requestIdleCallback" in window) {
                (window as any).requestIdleCallback(runSync, { timeout: 8000 });
            } else {
                runSync();
            }
        }, delay);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [
        dirtyItems,
        hydrated,
        isLoggedIn,
        locked,
        delay,
        clearDirty,
        clearDirtyItems,
    ]);

    useEffect(() => {
        if (!isLoggedIn) return;

        const onUnload = () => {
            if (locked) return;
            if (!hydrated) return;
            if (Object.keys(dirtyItems).length === 0) return;

            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }

            try {
                navigator.sendBeacon(
                    "/cart/sync",
                    JSON.stringify({
                        items: dirtyItems,
                        mode: "partial",
                    })
                );
            } catch { }
        };

        window.addEventListener("beforeunload", onUnload);
        window.addEventListener("pagehide", onUnload);

        return () => {
            window.removeEventListener("beforeunload", onUnload);
            window.removeEventListener("pagehide", onUnload);
        };
    }, [dirtyItems, hydrated, isLoggedIn, locked]);
}
