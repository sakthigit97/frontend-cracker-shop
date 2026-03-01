import { useEffect, useRef, useState } from "react";
import Button from "../ui/Button";
import { apiFetch } from "../../services/api";
import type { Product } from "../../types/product";
import EmptyState from "../ui/EmptyState";

type SelectedItem = Product & {
    quantity: number;
};

type Props = {
    open: boolean;
    onClose: () => void;
    onAdd: (items: {
        productId: string;
        name: string;
        price: number;
        quantity: number;
        image?: string;
    }[]) => void;
};

const SEARCH_LIMIT = 8;
const MIN_SEARCH_LEN = 3;
const DEBOUNCE_MS = 1000;

export default function AddOrderItemModal({
    open,
    onClose,
    onAdd,
}: Props) {
    const [search, setSearch] = useState("");
    const [results, setResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<Record<string, SelectedItem>>({});
    const searchCache = useRef<Record<string, Product[]>>({});
    const debounceRef = useRef<number | null>(null);
    const lastSearchedRef = useRef<string>("");

    useEffect(() => {
        if (!open) {
            setSearch("");
            setResults([]);
            setSelected({});
            searchCache.current = {};
            lastSearchedRef.current = "";
        }
    }, [open]);

    const findPrefixCache = (term: string) => {
        const keys = Object.keys(searchCache.current)
            .filter((k) => term.startsWith(k))
            .sort((a, b) => b.length - a.length);
        return keys.length ? searchCache.current[keys[0]] : null;
    };

    useEffect(() => {
        if (!open) return;

        if (search.length < MIN_SEARCH_LEN) {
            lastSearchedRef.current = "";
            setResults([]);
            return;
        }

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = window.setTimeout(async () => {
            if (lastSearchedRef.current === search) return;
            lastSearchedRef.current = search;

            if (searchCache.current[search]) {
                setResults(searchCache.current[search]);
                return;
            }

            const prefixResults = findPrefixCache(search);
            if (prefixResults && prefixResults.length < SEARCH_LIMIT) {
                const filtered = prefixResults.filter((p) =>
                    p.name.toLowerCase().includes(search.toLowerCase())
                );

                searchCache.current[search] = filtered;
                setResults(filtered);
                return;
            }

            try {
                setLoading(true);
                const res = await apiFetch(
                    `/products?search=${encodeURIComponent(search)}&limit=${SEARCH_LIMIT}`
                );

                const items = res.data.items || [];
                searchCache.current[search] = items;
                setResults(items);
            } finally {
                setLoading(false);
            }
        }, DEBOUNCE_MS);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [search, open]);

    if (!open) return null;
    const toggleSelect = (p: Product) => {
        setSelected((prev) => {
            if (prev[p.id]) {
                const copy = { ...prev };
                delete copy[p.id];
                return copy;
            }
            return { ...prev, [p.id]: { ...p, quantity: 1 } };
        });
    };

    const updateQty = (id: string, delta: number) => {
        setSelected((prev) => ({
            ...prev,
            [id]: {
                ...prev[id],
                quantity: Math.max(1, prev[id].quantity + delta),
            },
        }));
    };

    const selectedItems = Object.values(selected);

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center px-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl flex flex-col max-h-[85vh]">
                {/* HEADER */}
                <div className="px-4 py-3 border-b">
                    <h2 className="font-semibold text-[var(--color-primary)]">
                        Add Items to Order
                    </h2>
                </div>

                {/* SEARCH */}
                <div className="p-4">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search product (min 3 letters)"
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                </div>

                {/* RESULTS */}
                <div className="flex-1 overflow-y-auto px-4">
                    {search.length < MIN_SEARCH_LEN && (
                        <p className="text-sm text-gray-400 text-center mt-6">
                            Start typing to search products
                        </p>
                    )}

                    {loading && (
                        <p className="text-sm text-gray-500 text-center mt-6">
                            Searching…
                        </p>
                    )}

                    {!loading &&
                        results.map((p) => {
                            const isSelected = !!selected[p.id];

                            return (
                                <div
                                    key={p.id}
                                    className="flex items-center justify-between py-3 border-b last:border-b-0"
                                >
                                    <div
                                        className="flex-1 pr-3 cursor-pointer"
                                        onClick={() => toggleSelect(p)}
                                    >
                                        <p className="text-sm font-medium text-[var(--color-primary)]">
                                            {p.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            ₹{p.price}
                                        </p>
                                    </div>

                                    {isSelected ? (
                                        <div className="w-[110px] h-[34px] flex items-center justify-between px-2 rounded-lg bg-[var(--color-primary)] text-white text-xs font-semibold">
                                            <button onClick={() => updateQty(p.id, -1)}>−</button>
                                            <span>{selected[p.id].quantity}</span>
                                            <button onClick={() => updateQty(p.id, 1)}>+</button>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            className="px-3 py-1.5 text-xs"
                                            onClick={() => toggleSelect(p)}
                                        >
                                            Add
                                        </Button>
                                    )}
                                </div>
                            );
                        })}

                    {!loading &&
                        search.length >= MIN_SEARCH_LEN &&
                        results.length === 0 && (
                            <EmptyState
                                title="No products found"
                                description="Try adjusting your search or explore other categories."
                            />
                        )}
                </div>

                {/* FOOTER */}
                <div className="border-t px-4 py-3 flex items-center justify-between bg-white">
                    <p className="text-sm text-gray-500">
                        {selectedItems.length} selected
                    </p>

                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>

                        <Button
                            disabled={selectedItems.length === 0}
                            onClick={() => {
                                onAdd(
                                    selectedItems.map((i) => ({
                                        productId: i.id,
                                        name: i.name,
                                        price: i.price,
                                        quantity: i.quantity,
                                        image: i.image,
                                    }))
                                );
                                onClose();
                            }}
                        >
                            Add
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
