import { createContext, useContext, useState } from "react";
import { apiFetch } from "../services/api";
import type { Product } from "../types/product";

interface HomeProductState {
    products: Product[];
    popularProducts: Product[];
    nextCursor: string | null;
    loading: boolean;
    hasFetched: boolean;
    fetchInitial: () => Promise<void>;
    fetchMore: () => Promise<void>;
    fetchPopular: () => Promise<void>;
}
const HomeProductContext = createContext<HomeProductState | null>(null);

export function HomeProductProvider({ children }: { children: React.ReactNode }) {
    const [products, setProducts] = useState<Product[]>([]);
    const [popularProducts, setPopularProducts] = useState<Product[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);
    const [hasFetchedPopular, setHasFetchedPopular] = useState(false);

    const fetchInitial = async () => {
        if (hasFetched) return;
        try {
            setLoading(true);
            const res = await apiFetch("/products?limit=1000");
            setProducts(res.data.items);
            setNextCursor(res.data.pagination.nextCursor);
            setHasFetched(true);
        } finally {
            setLoading(false);
        }
    };

    const fetchMore = async () => {
        if (!nextCursor || loading) return;
        try {
            setLoading(true);
            const res = await apiFetch(
                `/products?limit=8&cursor=${encodeURIComponent(nextCursor)}`
            );

            setProducts((prev) => [...prev, ...res.data.items]);
            setNextCursor(res.data.pagination.nextCursor);
        } finally {
            setLoading(false);
        }
    };

    const fetchPopular = async () => {
        if (hasFetchedPopular) return;
        try {
            const res = await apiFetch("/products/popular?limit=8");
            setPopularProducts(res.data.items || []);
            setHasFetchedPopular(true);
        } catch (err) {
            console.error("Failed to fetch popular products", err);
        }
    };

    return (
        <HomeProductContext.Provider
            value={{
                products,
                popularProducts,
                nextCursor,
                loading,
                hasFetched,
                fetchInitial,
                fetchMore,
                fetchPopular,
            }}
        >
            {children}
        </HomeProductContext.Provider>
    );
}

export function useHomeProducts() {
    const ctx = useContext(HomeProductContext);
    if (!ctx) {
        throw new Error("useHomeProducts must be used inside HomeProductProvider");
    }
    return ctx;
}