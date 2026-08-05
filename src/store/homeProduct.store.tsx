import {
    createContext,
    useContext,
    useState,
    useRef,
} from "react";
import { apiFetch } from "../services/api";
import type { Product } from "../types/product";

interface HomeProductState {
    products: Product[];
    popularProducts: Product[];
    nextCursor: string | null;
    loading: boolean;
    hasFetched: boolean;
    fetchAll: () => Promise<void>;
    fetchInitial: () => Promise<void>;
    fetchMore: () => Promise<void>;
    fetchPopular: () => Promise<void>;
}

const HomeProductContext = createContext<HomeProductState | null>(null);

export function HomeProductProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [products, setProducts] = useState<Product[]>([]);
    const [popularProducts, setPopularProducts] = useState<Product[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [hasFetched, setHasFetched] = useState(false);
    const [hasFetchedPopular, setHasFetchedPopular] = useState(false);
    const [hasFetchedAll, setHasFetchedAll] = useState(false);

    const fetchingInitialRef = useRef(false);
    const fetchingAllRef = useRef(false);
    const fetchingPopularRef = useRef(false);
    const fetchingMoreRef = useRef(false);

    const fetchInitial = async () => {
        if (hasFetched || fetchingInitialRef.current) return;

        fetchingInitialRef.current = true;

        try {
            setLoading(true);

            const res = await apiFetch("/products?limit=5000");

            setProducts(res.data.items || []);
            setNextCursor(res.data.pagination.nextCursor ?? null);
            setHasFetched(true);
        } catch (err) {
            console.error("Failed to fetch initial products.", err);
            throw err;
        } finally {
            fetchingInitialRef.current = false;
            setLoading(false);
        }
    };

    const fetchAll = async () => {
        if (hasFetchedAll || fetchingAllRef.current) return;

        fetchingAllRef.current = true;

        try {
            setLoading(true);

            const res = await apiFetch("/products/all");

            setProducts(res.data.items || []);
            setNextCursor(null);

            setHasFetched(true);
            setHasFetchedAll(true);
        } catch (err) {
            console.error("Failed to fetch all products.", err);
            throw err;
        } finally {
            fetchingAllRef.current = false;
            setLoading(false);
        }
    };

    const fetchMore = async () => {
        if (
            !nextCursor ||
            loading ||
            fetchingMoreRef.current
        ) {
            return;
        }

        fetchingMoreRef.current = true;

        try {
            setLoading(true);

            const res = await apiFetch(
                `/products?limit=8&cursor=${encodeURIComponent(nextCursor)}`
            );

            setProducts((prev) => [
                ...prev,
                ...(res.data.items || []),
            ]);

            setNextCursor(res.data.pagination.nextCursor ?? null);
        } catch (err) {
            console.error("Failed to fetch more products.", err);
            throw err;
        } finally {
            fetchingMoreRef.current = false;
            setLoading(false);
        }
    };

    const fetchPopular = async () => {
        if (hasFetchedPopular || fetchingPopularRef.current) return;

        fetchingPopularRef.current = true;

        try {
            const res = await apiFetch("/products/popular?limit=8");

            setPopularProducts(res.data.items || []);
            setHasFetchedPopular(true);
        } catch (err) {
            console.error("Failed to fetch popular products.", err);
            throw err;
        } finally {
            fetchingPopularRef.current = false;
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
                fetchAll,
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
        throw new Error(
            "useHomeProducts must be used inside HomeProductProvider"
        );
    }

    return ctx;
}