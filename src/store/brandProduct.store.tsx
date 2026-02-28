import { createContext, useContext, useState } from "react";
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

    const fetchInitial = async (brandId: string) => {
        const existing = data[brandId];
        if (existing?.hasFetched) return;

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
                `/products/brand/${brandId}?limit=8`
            );

            setData((prev) => ({
                ...prev,
                [brandId]: {
                    items: res.data.items,
                    nextCursor: res.data.pagination.nextCursor,
                    loading: false,
                    hasFetched: true,
                },
            }));
        } catch {
            setData((prev) => ({
                ...prev,
                [brandId]: {
                    items: [],
                    nextCursor: null,
                    loading: false,
                    hasFetched: true,
                },
            }));
        }
    };

    const fetchMore = async (brandId: string) => {
        const current = data[brandId];
        if (!current || !current.nextCursor || current.loading) return;

        setData((prev) => ({
            ...prev,
            [brandId]: {
                ...current,
                loading: true,
            },
        }));

        try {
            const res = await apiFetch(
                `/products/brand/${brandId}?limit=8&cursor=${encodeURIComponent(
                    current.nextCursor
                )}`
            );

            setData((prev) => ({
                ...prev,
                [brandId]: {
                    items: [...current.items, ...res.data.items],
                    nextCursor: res.data.pagination.nextCursor,
                    loading: false,
                    hasFetched: true,
                },
            }));
        } catch {
            setData((prev) => ({
                ...prev,
                [brandId]: {
                    ...current,
                    loading: false,
                },
            }));
        }
    };

    return (
        <BrandProductContext.Provider
            value={{ data, fetchInitial, fetchMore }}
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