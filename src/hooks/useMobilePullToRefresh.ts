
import { Capacitor } from "@capacitor/core";
import { useEffect, useRef } from "react";

export function useMobilePullToRefresh(
    containerRef: React.RefObject<HTMLElement | null>,
    onRefresh: () => Promise<void>
) {
    const startY = useRef<number | null>(null);
    const refreshing = useRef(false);

    useEffect(() => {
        if (Capacitor.getPlatform() !== "android") return;

        const container = containerRef.current;
        if (!container) return;

        const handleTouchStart = (event: TouchEvent) => {
            if (refreshing.current || container.scrollTop > 0) {
                startY.current = null;
                return;
            }

            startY.current = event.touches[0].clientY;
        };

        const handleTouchEnd = async (event: TouchEvent) => {
            if (startY.current === null || refreshing.current) return;

            const distance = event.changedTouches[0].clientY - startY.current;
            startY.current = null;

            if (distance < 75 || container.scrollTop > 0) return;

            refreshing.current = true;

            try {
                await onRefresh();
            } catch (error) {
                console.error("Pull-to-refresh failed:", error);
            } finally {
                refreshing.current = false;
            }
        };

        container.addEventListener("touchstart", handleTouchStart, {
            passive: true,
        });
        container.addEventListener("touchend", handleTouchEnd, {
            passive: true,
        });

        return () => {
            container.removeEventListener("touchstart", handleTouchStart);
            container.removeEventListener("touchend", handleTouchEnd);
        };
    }, [containerRef, onRefresh]);
}
