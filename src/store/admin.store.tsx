import { create } from "zustand";
import { getAdminDashboard } from "../services/admin.api";
import { STATUS_ORDER } from "../utils/orderStatus";

interface AdminDashboardState {
    data: any | null;
    loading: boolean;
    error: string | null;
    lastFetched: number | null;
    fetch: () => Promise<void>;
    clearCache: () => void;
}

const CACHE_TTL = 60 * 1000;
export const useAdminDashboardStore = create<AdminDashboardState>(
    (set, get) => ({
        data: null,
        loading: false,
        error: null,
        lastFetched: null,

        fetch: async () => {
            const { data, lastFetched, loading } = get();
            if (loading) return;

            if (data && lastFetched && Date.now() - lastFetched < CACHE_TTL) {
                return;
            }

            set({ loading: true, error: null });

            try {
                const res = await getAdminDashboard();
                const safeBreakdown: Record<string, number> = {};
                STATUS_ORDER.forEach((s) => {
                    safeBreakdown[s] = res.statusBreakdown?.[s] ?? 0;
                });

                set({
                    data: {
                        ...res,
                        statusBreakdown: safeBreakdown,
                    },
                    lastFetched: Date.now(),
                });
            } catch (err: any) {
                set({ error: err.message || "Failed to load dashboard" });
            } finally {
                set({ loading: false });
            }
        },

        clearCache: () =>
            set({
                data: null,
                lastFetched: null,
                error: null,
            }),
    })
);
