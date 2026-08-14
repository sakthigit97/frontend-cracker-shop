import {
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    Check,
    PackagePlus,
    Search,
    X,
} from "lucide-react";

import defaultImage from "../../assets/default-image.png";
import { formatCurrency } from "../../utils/pricing";
import type { BulkOrderAddProduct } from "../../types/bulkOrder";

interface BulkAddProductModalProps {
    open: boolean;
    products: BulkOrderAddProduct[];
    existingProductIds: string[];
    loading?: boolean;
    onClose: () => void;
    onAdd: (product: BulkOrderAddProduct) => void;
}

export default function BulkAddProductModal({
    open,
    products,
    existingProductIds,
    loading = false,
    onClose,
    onAdd,
}: BulkAddProductModalProps) {
    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(
        () => new Set()
    );

    useEffect(() => {
        if (!open) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        const previousPaddingRight = document.body.style.paddingRight;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previousOverflow;
            document.body.style.paddingRight = previousPaddingRight;
        };
    }, [open]);

    useEffect(() => {
        if (!open) {
            return;
        }

        setSearch("");
        setSelectedIds(new Set());
    }, [open]);

    const existingIds = useMemo(
        () => new Set(existingProductIds),
        [existingProductIds]
    );

    const availableProducts = useMemo(() => {
        return products.filter(
            (product) =>
                !existingIds.has(product.productId)
        );
    }, [products, existingIds]);

    const filteredProducts = useMemo(() => {
        const value = search.trim().toLowerCase();

        if (!value) {
            return availableProducts;
        }

        return availableProducts.filter((product) => {
            const name =
                product.name?.toLowerCase() ?? "";
            const brand =
                product.brand?.toLowerCase() ?? "";

            return (
                name.includes(value) ||
                brand.includes(value)
            );
        });
    }, [availableProducts, search]);

    const selectedProducts = useMemo(() => {
        if (selectedIds.size === 0) {
            return [];
        }

        return availableProducts.filter((product) =>
            selectedIds.has(product.productId)
        );
    }, [availableProducts, selectedIds]);

    function toggleProduct(productId: string) {
        setSelectedIds((current) => {
            const next = new Set(current);

            if (next.has(productId)) {
                next.delete(productId);
            } else {
                next.add(productId);
            }

            return next;
        });
    }

    function handleDone() {
        if (selectedProducts.length === 0) {
            return;
        }

        /*
         * Add the selected products one by one.
         * The parent owns the order state; this modal only
         * handles selection.
         */
        selectedProducts.forEach((product) => {
            onAdd(product);
        });

        onClose();
    }

    function handleClose() {
        if (loading) {
            return;
        }

        onClose();
    }

    if (!open) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 sm:p-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-add-product-title"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    handleClose();
                }
            }}
        >
            <div
                className="flex max-h-[calc(100dvh-24px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-40px)]"
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
            >
                {/* Header */}
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 sm:px-6 sm:py-5">
                    <div className="min-w-0">
                        <h2
                            id="bulk-add-product-title"
                            className="text-lg font-semibold text-gray-900 sm:text-xl"
                        >
                            Add Product
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Select one or more products to add to this bulk order.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={loading}
                        className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Close"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Search */}
                <div className="shrink-0 border-b border-gray-200 px-5 py-4 sm:px-6">
                    <div className="relative">
                        <Search
                            size={19}
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                            type="search"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Search by product name or brand"
                            autoFocus
                            className="h-12 w-full rounded-xl border border-gray-300 bg-white pl-11 pr-11 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                        />

                        {search && (
                            <button
                                type="button"
                                onClick={() =>
                                    setSearch("")
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                aria-label="Clear search"
                            >
                                <X size={17} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Products */}
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    {loading ? (
                        <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[var(--color-primary)]" />
                            <p className="mt-4 text-sm font-medium text-gray-700">
                                Loading products...
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                Products are loaded once and searched locally.
                            </p>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                                <Search
                                    size={25}
                                    className="text-gray-400"
                                />
                            </div>

                            <h3 className="mt-4 text-base font-semibold text-gray-800">
                                {availableProducts.length === 0
                                    ? "No products available"
                                    : "No products found"}
                            </h3>

                            <p className="mt-1 max-w-sm text-sm text-gray-500">
                                {availableProducts.length === 0
                                    ? "All available products are already included in this order."
                                    : "Try a different product name or brand."}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredProducts.map((product) => {
                                const selected = selectedIds.has(
                                    product.productId
                                );

                                return (
                                    <button
                                        key={product.productId}
                                        type="button"
                                        onClick={() =>
                                            toggleProduct(
                                                product.productId
                                            )
                                        }
                                        className={`flex w-full items-center gap-3 px-5 py-4 text-left transition sm:px-6 ${selected
                                                ? "bg-blue-50"
                                                : "bg-white hover:bg-gray-50"
                                            }`}
                                    >
                                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 sm:h-20 sm:w-20">
                                            <img
                                                src={
                                                    product.image ||
                                                    defaultImage
                                                }
                                                alt={product.name}
                                                className="h-full w-full object-contain"
                                                onError={(event) => {
                                                    event.currentTarget.src =
                                                        defaultImage;
                                                }}
                                            />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="line-clamp-2 text-sm font-semibold text-gray-900 sm:text-base">
                                                {product.name}
                                            </p>

                                            {product.brand && (
                                                <p className="mt-0.5 truncate text-xs text-gray-500 sm:text-sm">
                                                    {product.brand}
                                                </p>
                                            )}

                                            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 sm:text-sm">
                                                <span>
                                                    Bulk Price: {" "}
                                                    <strong className="text-gray-800">
                                                        ₹
                                                        {formatCurrency(
                                                            product.bulkOrderBasePrice
                                                        )}
                                                    </strong>
                                                </span>

                                                <span>
                                                    Carton: {" "}
                                                    <strong className="text-gray-800">
                                                        {product.cartonQty}
                                                    </strong>
                                                </span>
                                            </div>
                                        </div>

                                        <div
                                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition sm:h-8 sm:w-8 ${selected
                                                    ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                                                    : "border-gray-300 bg-white text-transparent"
                                                }`}
                                            aria-hidden="true"
                                        >
                                            <Check size={17} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-200 bg-white px-5 py-3 sm:px-6 sm:py-4">
                    <p className="text-xs text-gray-500 sm:text-sm">
                        {selectedProducts.length > 0
                            ? `${selectedProducts.length} product${selectedProducts.length === 1 ? "" : "s"} selected`
                            : `${availableProducts.length} product${availableProducts.length === 1 ? "" : "s"} available`}
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={handleDone}
                            disabled={
                                loading ||
                                selectedProducts.length === 0
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <PackagePlus size={17} />
                            Add Selected
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}