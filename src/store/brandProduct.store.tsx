import {
    createContext,
    useContext,
    useState,
    useRef,
} from "react";
import { apiFetch } from "../services/api";
import type { Product } from "../types/product";

type BrandProductState = {
    items: Product[];
    nextCursor: string | null;
    loading: boolean;
    hasFetched: boolean;
};

interface StoreState {
    data: Record<string, BrandProductState>;
    fetchInitial: (brandId: string) => Promise<void>;
    fetchMore: (brandId: string) => Promise<void>;
}

const BrandProductContext = createContext<StoreState | null>(null);

export function BrandProductProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [data, setData] = useState<Record<string, BrandProductState>>({});

    const fetchingInitialRef = useRef<Record<string, boolean>>({});
    const fetchingMoreRef = useRef<Record<string, boolean>>({});

    const fetchInitial = async (brandId: string) => {
        const existing = data[brandId];

        if (
            existing?.hasFetched ||
            fetchingInitialRef.current[brandId]
        ) {
            return;
        }

        fetchingInitialRef.current[brandId] = true;

        setData((prev) => ({
            ...prev,
            [brandId]: {
                items: [],
                nextCursor: null,
                loading: true,
                hasFetched: false,
            },
        }));

        try {
            const res = await apiFetch(
                `/products/brand/${brandId}?limit=2000`
            );

            setData((prev) => ({
                ...prev,
                [brandId]: {
                    items: res.data.items || [],
                    nextCursor: res.data.pagination.nextCursor ?? null,
                    loading: false,
                    hasFetched: true,
                },
            }));
        } catch (err) {
            console.error(
                `Failed to fetch products for brand: ${brandId}`,
                err
            );

            setData((prev) => ({
                ...prev,
                [brandId]: {
                    items: [],
                    nextCursor: null,
                    loading: false,
                    hasFetched: true,
                },
            }));

            throw err;
        } finally {
            fetchingInitialRef.current[brandId] = false;
        }
    };

    const fetchMore = async (brandId: string) => {
        const current = data[brandId];

        if (
            !current ||
            !current.nextCursor ||
            current.loading ||
            fetchingMoreRef.current[brandId]
        ) {
            return;
        }

        fetchingMoreRef.current[brandId] = true;

        setData((prev) => ({
            ...prev,
            [brandId]: {
                ...prev[brandId],
                loading: true,
            },
        }));

        try {
            const res = await apiFetch(
                `/products/brand/${brandId}?limit=8&cursor=${encodeURIComponent(
                    current.nextCursor
                )}`
            );

            setData((prev) => {
                const latest = prev[brandId];

                if (!latest) {
                    return prev;
                }

                return {
                    ...prev,
                    [brandId]: {
                        ...latest,
                        items: [
                            ...latest.items,
                            ...(res.data.items || []),
                        ],
                        nextCursor:
                            res.data.pagination.nextCursor ?? null,
                        loading: false,
                        hasFetched: true,
                    },
                };
            });
        } catch (err) {
            console.error(
                `Failed to fetch more products for brand: ${brandId}`,
                err
            );

            setData((prev) => ({
                ...prev,
                [brandId]: {
                    ...prev[brandId],
                    loading: false,
                },
            }));

            throw err;
        } finally {
            fetchingMoreRef.current[brandId] = false;
        }
    };

    return (
        <BrandProductContext.Provider
            value={{
                data,
                fetchInitial,
                fetchMore,
            }}
        >
            {children}
        </BrandProductContext.Provider>
    );
}

export function useBrandProducts(brandId: string) {
    const ctx = useContext(BrandProductContext);

    if (!ctx) {
        throw new Error(
            "useBrandProducts must be used inside BrandProductProvider"
        );
    }

    return {
        ...(ctx.data[brandId] || {
            items: [],
            nextCursor: null,
            loading: false,
            hasFetched: false,
        }),
        fetchInitial: () => ctx.fetchInitial(brandId),
        fetchMore: () => ctx.fetchMore(brandId),
    };
}