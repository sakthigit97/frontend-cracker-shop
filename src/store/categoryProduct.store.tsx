import { createContext, useContext, useState } from "react";
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

    const fetchInitial = async (categoryId: string) => {
        const existing = data[categoryId];
        if (existing?.hasFetched) return;

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
                `/products/category/${categoryId}?limit=8`
            );

            setData((prev) => ({
                ...prev,
                [categoryId]: {
                    items: res.data.items,
                    nextCursor: res.data.pagination.nextCursor,
                    loading: false,
                    hasFetched: true,
                },
            }));
        } catch {
            setData((prev) => ({
                ...prev,
                [categoryId]: {
                    items: [],
                    nextCursor: null,
                    loading: false,
                    hasFetched: true,
                },
            }));
        }
    };

    const fetchMore = async (categoryId: string) => {
        const current = data[categoryId];
        if (!current || !current.nextCursor || current.loading) return;

        setData((prev) => ({
            ...prev,
            [categoryId]: {
                ...current,
                loading: true,
            },
        }));

        try {
            const res = await apiFetch(
                `/products/category/${categoryId}?limit=8&cursor=${encodeURIComponent(
                    current.nextCursor
                )}`
            );

            setData((prev) => ({
                ...prev,
                [categoryId]: {
                    items: [...current.items, ...res.data.items],
                    nextCursor: res.data.pagination.nextCursor,
                    loading: false,
                    hasFetched: true,
                },
            }));
        } catch {
            setData((prev) => ({
                ...prev,
                [categoryId]: {
                    ...current,
                    loading: false,
                },
            }));
        }
    };

    return (
        <CategoryProductContext.Provider
            value={{ data, fetchInitial, fetchMore }}
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