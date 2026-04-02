import { create } from "zustand";
import { getProductReport } from "../services/adminProductReport.api";

const cache: Record<string, any> = {};

export interface Product {
    productId: string;
    name: string;
    quantity: number;
    revenue: number;
}

export interface ProductReportResponse {
    revenueLeaders: Product[];
    highDemand: Product[];
    underPerforming: Product[];
    insights: string[];
}

interface State {
    data: ProductReportResponse | null;
    loading: boolean;
    error: string | null;
    fetch: (
        range?: string,
        fromDate?: string,
        toDate?: string
    ) => Promise<void>;
}

export const useProductReportStore = create<State>((set) => ({
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
            const data = await getProductReport({
                range,
                fromDate,
                toDate,
            });

            cache[key] = data;

            set({ data, loading: false });
        } catch {
            set({ error: "Failed to load product report", loading: false });
        }
    },
}));