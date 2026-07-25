import { createContext, useContext, useRef, useState } from "react";
import { apiFetch } from "../services/api";

type CatalogItem = {
    id: string;
    name: string;
    image: string;
};

interface CatalogState {
    categories: CatalogItem[];
    brands: CatalogItem[];
    loadingCategory: boolean;
    loadingBrand: boolean;
    fetchCategories: () => Promise<void>;
    fetchBrands: () => Promise<void>;
}

const CatalogContext = createContext<CatalogState | null>(null);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
    const [categories, setCategories] = useState<CatalogItem[]>([]);
    const [brands, setBrands] = useState<CatalogItem[]>([]);
    const categoryRequestRef = useRef(false);
    const brandRequestRef = useRef(false);
    const [loadingCategory, setLoadingCategory] = useState(false);
    const [loadingBrand, setLoadingBrand] = useState(false);

    const fetchCategories = async () => {
        if (categoryRequestRef.current || categories.length > 0) return;

        categoryRequestRef.current = true;
        setLoadingCategory(true);

        try {
            const res = await apiFetch("/categories");
            setCategories(res.data.items);
        } finally {
            categoryRequestRef.current = false;
            setLoadingCategory(false);
        }
    };

    const fetchBrands = async () => {
        if (brandRequestRef.current || brands.length > 0) return;

        brandRequestRef.current = true;
        setLoadingBrand(true);

        try {
            const res = await apiFetch("/brands");
            setBrands(res.data.items);
        } finally {
            brandRequestRef.current = false;
            setLoadingBrand(false);
        }
    };

    return (
        <CatalogContext.Provider
            value={{
                categories,
                brands,
                loadingCategory,
                loadingBrand,
                fetchCategories,
                fetchBrands,
            }}
        >
            {children}
        </CatalogContext.Provider>
    );
}

export function useCatalog() {
    const ctx = useContext(CatalogContext);
    if (!ctx) throw new Error("useCatalog must be used inside CatalogProvider");
    return ctx;
}