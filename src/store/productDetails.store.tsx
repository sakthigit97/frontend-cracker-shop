import { createContext, useContext, useState } from "react";
import { apiFetch } from "../services/api";
import type { ProductDetails } from "../types/product";

type ProductDetailsState = {
    data: ProductDetails | null;
    loading: boolean;
    hasFetched: boolean;
};

interface StoreState {
    data: Record<string, ProductDetailsState>;
    fetchProduct: (productId: string) => Promise<void>;
}

const ProductDetailsContext = createContext<StoreState | null>(null);
export function ProductDetailsProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [data, setData] = useState<Record<string, ProductDetailsState>>({});

    const fetchProduct = async (productId: string) => {
        const existing = data[productId];
        if (existing?.hasFetched) return;

        setData((prev) => ({
            ...prev,
            [productId]: {
                data: null,
                loading: true,
                hasFetched: false,
            },
        }));

        try {
            const res = await apiFetch(`/products/details/${productId}`);

            setData((prev) => ({
                ...prev,
                [productId]: {
                    data: res.data,
                    loading: false,
                    hasFetched: true,
                },
            }));
        } catch {
            setData((prev) => ({
                ...prev,
                [productId]: {
                    data: null,
                    loading: false,
                    hasFetched: true,
                },
            }));
        }
    };

    return (
        <ProductDetailsContext.Provider value={{ data, fetchProduct }}>
            {children}
        </ProductDetailsContext.Provider>
    );
}

export function useProductDetails(productId: string) {
    const ctx = useContext(ProductDetailsContext);
    if (!ctx) {
        throw new Error(
            "useProductDetails must be used inside ProductDetailsProvider"
        );
    }

    return (
        ctx.data[productId] || {
            data: null,
            loading: false,
            hasFetched: false,
        }
    );
}

export function useFetchProductDetails() {
    const ctx = useContext(ProductDetailsContext);
    if (!ctx) {
        throw new Error(
            "useFetchProductDetails must be used inside ProductDetailsProvider"
        );
    }
    return ctx.fetchProduct;
}