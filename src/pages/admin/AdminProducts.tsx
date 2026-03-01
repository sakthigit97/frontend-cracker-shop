import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import { useAdminProductsStore } from "../../store/adminProducts.store";
import { useMetaStore } from "../../store/meta.store";
import { useDebounce } from "../../utils/useDebounce";
import { useAlert } from "../../store/alert.store";
import Toggle from "../../components/ui/Toggle";
import { deactivateProduct, deleteProduct } from "../../services/adminProducts.api";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";

export default function AdminProducts() {
    const { fetchPage, loading, clearCache } = useAdminProductsStore();
    const { brands, categories, load } = useMetaStore();
    const [cursor, setCursor] = useState<string | null>(null);
    const [cursorStack, setCursorStack] = useState<string[]>([]);
    const [data, setData] = useState<any>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const { showAlert } = useAlert();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(
        null
    );

    const [filters, setFilters] = useState({
        search: "",
        brandId: "",
        categoryId: "",
        isActive: "",
    });

    const brandMap = useMemo(
        () => Object.fromEntries(brands.map(b => [b.id, b.name])),
        [brands]
    );

    const categoryMap = useMemo(
        () => Object.fromEntries(categories.map(c => [c.id, c.name])),
        [categories]
    );

    const debouncedSearch = useDebounce(filters.search, 1000);
    const effectiveFilters = useMemo(
        () => ({
            ...filters,
            search: debouncedSearch,
        }),
        [debouncedSearch, filters.brandId, filters.categoryId, filters.isActive]
    );

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        setCursor(null);
        setCursorStack([]);
    }, [effectiveFilters]);

    useEffect(() => {
        loadProducts();
    }, [cursor, effectiveFilters]);

    const loadProducts = async () => {
        const res = await fetchPage(effectiveFilters, cursor);
        setData(res);
    };

    const handleToggleStatus = async (
        productId: string,
        current: string
    ) => {
        if (!data || togglingId) return;
        const next = current === "true" ? "false" : "true";
        setData((prev: any) => ({
            ...prev,
            items: prev.items.map((p: any) =>
                p.productId === productId
                    ? { ...p, isActive: next }
                    : p
            ),
        }));

        try {
            setTogglingId(productId);
            await deactivateProduct(productId);
        } catch (err: any) {
            setData((prev: any) => ({
                ...prev,
                items: prev.items.map((p: any) =>
                    p.productId === productId
                        ? { ...p, isActive: current }
                        : p
                ),
            }));

            showAlert({
                type: "error",
                message: err?.message || "Failed to update status",
            });
        } finally {
            setTogglingId(null);
        }
    };


    const handleDeleteClick = (productId: string) => {
        setSelectedProductId(productId);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!selectedProductId) return;

        try {
            setDeletingId(selectedProductId);

            await deleteProduct(selectedProductId);

            showAlert({
                type: "success",
                message: "Product deleted successfully",
            });

            clearCache();
            loadProducts();
        } catch (err: any) {
            showAlert({
                type: "error",
                message: err?.message || "Failed to delete product",
            });
        } finally {
            setDeletingId(null);
            setShowDeleteConfirm(false);
            setSelectedProductId(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-3">
                <h1 className="text-xl font-semibold">Products</h1>

                <div className="flex gap-2">
                    <Link to="/admin/products/bulk-import">
                        <Button variant="outline">
                            Bulk Upload
                        </Button>
                    </Link>

                    <Link to="/admin/products/create">
                        <Button>
                            Add Product
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                    placeholder="Search product name"
                    className="border rounded-md p-2 w-full"
                    value={filters.search}
                    onChange={(e) =>
                        setFilters({ ...filters, search: e.target.value })
                    }
                />

                <select
                    className="border rounded-md p-2 w-full"
                    value={filters.isActive}
                    onChange={(e) =>
                        setFilters({ ...filters, isActive: e.target.value })
                    }
                >
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                </select>

                <select
                    className="border rounded-md p-2 w-full"
                    value={filters.brandId}
                    onChange={(e) =>
                        setFilters({ ...filters, brandId: e.target.value })
                    }
                >
                    <option value="">All Brands</option>
                    {Array.isArray(brands) &&
                        brands.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                            </option>
                        ))}
                </select>

                <select
                    className="border rounded-md p-2 w-full"
                    value={filters.categoryId}
                    onChange={(e) =>
                        setFilters({ ...filters, categoryId: e.target.value })
                    }
                >
                    <option value="">All Categories</option>
                    {Array.isArray(categories) &&
                        categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                </select>
            </div>

            <div className="bg-white border rounded-xl overflow-hidden">
                <div className="overflow-x-auto sm:overflow-visible">
                    <table className="w-full text-sm min-w-[520px] sm:min-w-0">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3 text-left">Name</th>
                                <th className="p-3 text-left">Price</th>
                                <th className="p-3 text-left">Available Quantity</th>
                                <th className="p-3 text-left">Brand</th>
                                <th className="p-3 text-left">Category</th>
                                <th className="p-3 text-left">Status</th>
                                <th className="p-3 text-left">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.items?.length ? (
                                data.items.map((p: any) => (
                                    <tr key={p.productId} className="border-t">
                                        <td className="p-3">{p.name}</td>
                                        <td className="p-3">₹{p.price}</td>
                                        <td className="p-3">{p.quantity || 0}</td>
                                        <td>{brandMap[p.brandId] || "-"}</td>
                                        <td>{categoryMap[p.categoryId] || "-"}</td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-3">
                                                <Toggle
                                                    checked={p.isActive === "true"}
                                                    disabled={togglingId === p.productId}
                                                    onChange={() => handleToggleStatus(p.productId, p.isActive)}
                                                />

                                                <span
                                                    className={`text-xs font-medium px-2 py-1 rounded-full
                                                            ${p.isActive === "true"
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-gray-200 text-gray-600"
                                                        }`}
                                                >
                                                    {p.isActive === "true" ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="p-3 ">
                                            <div className="flex gap-2">
                                                <Link to={`/admin/products/${p.productId}/edit`}>
                                                    <Button variant="outline">
                                                        Edit
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="outline"
                                                    className="border-red-500 text-red-600"
                                                    disabled={
                                                        deletingId === p.productId
                                                    }
                                                    onClick={() =>
                                                        handleDeleteClick(
                                                            p.productId
                                                        )
                                                    }
                                                >
                                                    {deletingId === p.productId
                                                        ? "Deleting…"
                                                        : "Delete"}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="p-6 text-center text-gray-500">
                                        <EmptyState
                                            title="No products found"
                                            description="Try explore other products."
                                        />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {(cursorStack.length > 0 || data?.nextCursor) && (
                    <div className="flex justify-center items-center gap-3 p-4 border-t">

                        {cursorStack.length > 0 && (
                            <button
                                onClick={() => {
                                    const prevCursor = cursorStack[cursorStack.length - 1];
                                    setCursorStack(stack => stack.slice(0, -1));
                                    setCursor(prevCursor);
                                }}
                                className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-gray-100 transition"
                            >
                                ← Previous
                            </button>
                        )}

                        {data?.nextCursor && (
                            <button
                                onClick={() => {
                                    setCursorStack(prev => [...prev, cursor || ""]);
                                    setCursor(data.nextCursor);
                                }}
                                disabled={loading}
                                className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-gray-100 transition disabled:opacity-50"
                            >
                                Next →
                            </button>
                        )}
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={showDeleteConfirm}
                title="Delete Product?"
                message={
                    <>
                        Are you sure you want to delete this product?
                        <br />
                        <span className="text-red-500 font-medium">
                            This action cannot be undone.
                        </span>
                    </>
                }
                confirmText="Yes, Delete"
                cancelText="Cancel"
                loading={!!deletingId}
                onCancel={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDelete}
            />
        </div>
    );
}