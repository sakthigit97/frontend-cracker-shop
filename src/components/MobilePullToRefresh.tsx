import { Capacitor } from "@capacitor/core";
import {
    type ReactNode,
    useRef,
    useState,
    useCallback,
} from "react";

interface MobilePullToRefreshProps {
    children: ReactNode;
    onRefresh?: () => Promise<void>;
}

const THRESHOLD = 75;

export default function MobilePullToRefresh({
    children,
    onRefresh,
}: MobilePullToRefreshProps) {
    const isAndroid = Capacitor.getPlatform() === "android";

    const startY = useRef(0);
    const [pullDistance, setPullDistance] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    const handleTouchStart = useCallback(
        (event: React.TouchEvent<HTMLDivElement>) => {
            if (!isAndroid || refreshing) return;

            // Only start a gesture when the page is already at the top.
            if (event.currentTarget.scrollTop === 0) {
                startY.current = event.touches[0].clientY;
            } else {
                startY.current = 0;
            }
        },
        [isAndroid, refreshing]
    );

    const handleTouchMove = useCallback(
        (event: React.TouchEvent<HTMLDivElement>) => {
            if (!isAndroid || refreshing || startY.current === 0) return;

            const distance = event.touches[0].clientY - startY.current;

            if (distance > 0 && event.currentTarget.scrollTop === 0) {
                setPullDistance(Math.min(distance * 0.5, 100));
            }
        },
        [isAndroid, refreshing]
    );

    const handleTouchEnd = useCallback(async () => {
        startY.current = 0;

        if (pullDistance < THRESHOLD * 0.5 || !onRefresh || refreshing) {
            setPullDistance(0);
            return;
        }

        setRefreshing(true);

        try {
            await onRefresh();
        } finally {
            setRefreshing(false);
            setPullDistance(0);
        }
    }, [onRefresh, pullDistance, refreshing]);

    // On web, render children directly with no wrapper or gesture handling.
    if (!isAndroid) {
        return <>{children}</>;
    }

    return (
        <div
            style={{
                height: "100%",
                overflowY: "auto",
                overscrollBehaviorY: "contain",
                WebkitOverflowScrolling: "touch",
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={() => {
                startY.current = 0;
                setPullDistance(0);
            }}
        >
            <div
                style={{
                    height: pullDistance > 0 || refreshing ? 44 : 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    fontSize: 13,
                }}
            >
                {refreshing
                    ? "Refreshing..."
                    : pullDistance > 0
                        ? "↓ Pull to refresh"
                        : null}
            </div>

            {children}
        </div>
    );
}