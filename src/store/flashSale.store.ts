import { create } from "zustand";
import { apiFetch } from "../services/api";
export interface FlashSale {
    flashSaleId: string;
    productId: string;

    header: string;
    description?: string;

    imageUrl: string;

    originalPrice: number;
    salePrice: number;

    startAt: string;
    endAt: string;

    status: "SCHEDULED" | "ACTIVE" | "CANCELLED";

    createdAt: string;
    updatedAt: string;
}

interface FlashSaleState {
    flashSales: FlashSale[];
    loading: boolean;
    fetchActive: () => Promise<void>;
}

export const useFlashSaleStore =
    create<FlashSaleState>((set) => ({
        flashSales: [],
        loading: false,

        fetchActive: async () => {
            set({ loading: true });

            try {
                const response = await apiFetch(
                    "/flash-sales/active",
                    { method: "GET" },
                    import.meta.env.VITE_API_BASE_URL_V1
                );

                set({
                    flashSales: response?.items ?? [],
                    loading: false,
                });
            } catch (error) {
                console.error(
                    "Failed to fetch active flash sales",
                    error
                );

                set({
                    flashSales: [],
                    loading: false,
                });
            }
        },
    }));