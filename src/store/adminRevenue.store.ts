import { create } from "zustand";
import { getRevenueReport } from "../services/adminRevenue.api";
import type { RevenueResponse } from "../services/adminRevenue.api";

interface State {
    data: RevenueResponse | null;
    loading: boolean;
    error: string | null;
    fetch: (
        range?: string,
        fromDate?: string,
        toDate?: string
    ) => Promise<void>;
}

const cache: Record<string, RevenueResponse> = {};
export const useAdminRevenueStore = create<State>((set) => ({
    data: null,
    loading: false,
    error: null,

    fetch: async (range?: string, fromDate?: string, toDate?: string) => {
        const key = JSON.stringify({ range, fromDate, toDate });

        if (cache[key]) {
            set({ data: cache[key] });
            return;
        }

        set({ loading: true, error: null });

        try {
            const data = await getRevenueReport({
                range,
                fromDate,
                toDate,
            });

            cache[key] = data;

            set({ data, loading: false });
        } catch (err) {
            set({ error: "Failed to load revenue", loading: false });
        }
    },
}));