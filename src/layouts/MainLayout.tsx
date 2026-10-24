import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Outlet } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

export default function MainLayout() {
  const mainRef = useRef<HTMLElement>(null);
  const startYRef = useRef<number | null>(null);
  const refreshingRef = useRef(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (Capacitor.getPlatform() !== "android") return;

    const main = mainRef.current;
    if (!main) return;

    const handleTouchStart = (event: TouchEvent) => {
      if (refreshingRef.current || main.scrollTop > 0) {
        startYRef.current = null;
        return;
      }

      const target = event.target as HTMLElement;
      if (
        target.closest(
          'input, textarea, select, button, a, [contenteditable="true"]'
        )
      ) {
        startYRef.current = null;
        return;
      }

      startYRef.current = event.touches[0].clientY;
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (startYRef.current === null || refreshingRef.current) return;

      const endY = event.changedTouches[0].clientY;
      const pullDistance = endY - startYRef.current;

      startYRef.current = null;

      if (main.scrollTop <= 0 && pullDistance >= 80) {
        refreshingRef.current = true;
        setRefreshKey((previous) => previous + 1);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            refreshingRef.current = false;
          });
        });
      }
    };

    main.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    main.addEventListener("touchend", handleTouchEnd, {
      passive: true,
    });

    return () => {
      main.removeEventListener("touchstart", handleTouchStart);
      main.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return (
    <div className="h-full flex flex-col">
      <Header />

      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto bg-[var(--color-background)] pt-16"
      >
        <div key={refreshKey}>
          <Outlet />
        </div>
      </main>

      <Footer />
    </div>
  );
}