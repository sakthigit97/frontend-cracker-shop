import { apiFetch } from "./api";

export const fetchProductsBatch = async (
    productIds: string[]
) => {
    if (productIds.length === 0) return [];

    const res = await apiFetch("/products/batch", {
        method: "POST",
        body: JSON.stringify({ productIds }),
    });

    return res.items as Array<{
        id: string;
        name: string;
        price: number;
        image: string;
        brand?: string;
        stock?: number;
    }>;
};