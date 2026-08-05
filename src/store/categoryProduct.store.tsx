import {
    createContext,
    useContext,
    useState,
    useRef,
} from "react";
import { apiFetch } from "../services/api";
import type { Product } from "../types/product";

type CategoryProductState = {
    items: Product[];
    nextCursor: string | null;
    loading: boolean;
    hasFetched: boolean;
};

interface StoreState {
    data: Record<string, CategoryProductState>;
    fetchInitial: (categoryId: string) => Promise<void>;
    fetchMore: (categoryId: string) => Promise<void>;
}

const CategoryProductContext = createContext<StoreState | null>(null);

export function CategoryProductProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [data, setData] = useState<Record<string, CategoryProductState>>({});

    const fetchingInitialRef = useRef<Record<string, boolean>>({});
    const fetchingMoreRef = useRef<Record<string, boolean>>({});

    const fetchInitial = async (categoryId: string) => {
        const existing = data[categoryId];

        if (
            existing?.hasFetched ||
            fetchingInitialRef.current[categoryId]
        ) {
            return;
        }

        fetchingInitialRef.current[categoryId] = true;

        setData((prev) => ({
            ...prev,
            [categoryId]: {
                items: [],
                nextCursor: null,
                loading: true,
                hasFetched: false,
            },
        }));

        try {
            const res = await apiFetch(
                `/products/category/${categoryId}?limit=1000`
            );

            setData((prev) => ({
                ...prev,
                [categoryId]: {
                    items: res.data.items || [],
                    nextCursor: res.data.pagination.nextCursor ?? null,
                    loading: false,
                    hasFetched: true,
                },
            }));
        } catch (err) {
            console.error(
                `Failed to fetch products for category: ${categoryId}`,
                err
            );

            setData((prev) => ({
                ...prev,
                [categoryId]: {
                    items: [],
                    nextCursor: null,
                    loading: false,
                    hasFetched: true,
                },
            }));

            throw err;
        } finally {
            fetchingInitialRef.current[categoryId] = false;
        }
    };

    const fetchMore = async (categoryId: string) => {
        const current = data[categoryId];

        if (
            !current ||
            !current.nextCursor ||
            current.loading ||
            fetchingMoreRef.current[categoryId]
        ) {
            return;
        }

        fetchingMoreRef.current[categoryId] = true;

        setData((prev) => ({
            ...prev,
            [categoryId]: {
                ...prev[categoryId],
                loading: true,
            },
        }));

        try {
            const res = await apiFetch(
                `/products/category/${categoryId}?limit=2000&cursor=${encodeURIComponent(
                    current.nextCursor
                )}`
            );

            setData((prev) => {
                const latest = prev[categoryId];

                if (!latest) {
                    return prev;
                }

                return {
                    ...prev,
                    [categoryId]: {
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
                `Failed to fetch more products for category: ${categoryId}`,
                err
            );

            setData((prev) => ({
                ...prev,
                [categoryId]: {
                    ...prev[categoryId],
                    loading: false,
                },
            }));

            throw err;
        } finally {
            fetchingMoreRef.current[categoryId] = false;
        }
    };

    return (
        <CategoryProductContext.Provider
            value={{
                data,
                fetchInitial,
                fetchMore,
            }}
        >
            {children}
        </CategoryProductContext.Provider>
    );
}

export function useCategoryProducts(categoryId: string) {
    const ctx = useContext(CategoryProductContext);

    if (!ctx) {
        throw new Error(
            "useCategoryProducts must be used inside CategoryProductProvider"
        );
    }

    return {
        ...(ctx.data[categoryId] || {
            items: [],
            nextCursor: null,
            loading: false,
            hasFetched: false,
        }),
        fetchInitial: () => ctx.fetchInitial(categoryId),
        fetchMore: () => ctx.fetchMore(categoryId),
    };
}