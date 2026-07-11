import { useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import Toggle from "../../components/ui/Toggle";
import { useAdminCategoriesStore } from "../../store/adminCategories.store";
import { useAlert } from "../../store/alert.store";
import { Link, useNavigate } from "react-router-dom";

import {
    updateCategoryStatus,
    deleteCategory,
} from "../../services/adminCategories.api";

import ConfirmDialog from "../../components/ui/ConfirmDialog";
import ProductSkeleton from "../../components/product/ProductSkeleton";
import EmptyState from "../../components/ui/EmptyState";
export default function AdminCategories() {
    const { fetchPage, loading, clearCache } = useAdminCategoriesStore();
    const { showAlert } = useAlert();
    const [data, setData] = useState<any>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const navigate = useNavigate();

    const [filters, setFilters] = useState({
        search: "",
        isActive: "" as "" | "true" | "false",
    });
    const PAGE_SIZE = 20;
    const [page, setPage] = useState(1);


    useEffect(() => {
        loadCategories();
    }, []);

    const query = filters.search.trim().toLowerCase();
    const filteredCategories = useMemo(() => {
        return (data?.items ?? []).filter((c: any) => {
            const matchesSearch =
                !query ||
                (`${c.name} ${c.categoryId}`)
                    .toLowerCase()
                    .includes(query);

            const matchesStatus =
                !filters.isActive ||
                String(c.isActive) === filters.isActive;

            return matchesSearch && matchesStatus;
        });
    }, [
        data?.items,
        query,
        filters.isActive,
    ]);

    const paginatedCategories = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;

        return filteredCategories.slice(
            start,
            start + PAGE_SIZE
        );
    }, [filteredCategories, page]);

    const totalPages = Math.ceil(
        filteredCategories.length / PAGE_SIZE
    );

    useEffect(() => {
        setPage(1);
    }, [query, filters.isActive]);

    useEffect(() => {
        if (page > totalPages && totalPages > 0) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    const loadCategories = async () => {
        try {
            const res = await fetchPage({}, null);
            setData(res);
        } catch (err: any) {
            showAlert({
                type: "error",
                message: err?.message || "Failed to load categories",
            });
        }
    };

    const handleToggleStatus = async (
        categoryId: string,
        current: boolean
    ) => {
        if (togglingId) return;

        try {
            setTogglingId(categoryId);

            await updateCategoryStatus(categoryId, !current);
            setData((prev: any) => ({
                ...prev,
                items: prev.items.map((c: any) =>
                    c.categoryId === categoryId
                        ? { ...c, isActive: !current }
                        : c
                ),
            }));

            showAlert({
                type: "success",
                message: `Category marked as ${!current ? "Active" : "Inactive"}`,
            });
            clearCache();
        } catch (err: any) {
            showAlert({
                type: "error",
                message: err?.message || "Failed to update category status",
            });
        } finally {
            setTogglingId(null);
        }
    };

    const handleDeleteClick = (categoryId: string) => {
        setSelectedCategoryId(categoryId);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedCategoryId) return;

        try {
            setDeletingId(selectedCategoryId);

            await deleteCategory(selectedCategoryId);

            showAlert({
                type: "success",
                message: "Category deleted successfully",
            });

            setData((prev: any) => ({
                ...prev,
                items: prev.items.filter(
                    (c: any) => c.categoryId !== selectedCategoryId
                ),
            }));

            clearCache();
        } catch (err: any) {
            showAlert({
                type: "error",
                message: err?.message || "Failed to delete category",
            });
        } finally {
            setDeletingId(null);
            setShowDeleteConfirm(false);
            setSelectedCategoryId(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">

                <div className="flex items-center gap-3 mb-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="
                                flex items-center justify-center
                                w-9 h-9
                                rounded-full
                                bg-[var(--color-primary)]
                                text-white
                                shadow-sm

                                hover:scale-105
                                active:scale-95
                                transition-all
                                "
                    >
                        ←
                    </button>
                    <h1 className="text-xl md:text-2xl font-semibold text-[var(--color-primary)]">
                        Categories
                    </h1>
                </div>
                <Link to="/admin/categories/create">
                    <Button>Add Category</Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                    placeholder="Search category"
                    className="border rounded-md p-2"
                    value={filters.search}
                    onChange={(e) =>
                        setFilters({ ...filters, search: e.target.value })
                    }
                />

                <select
                    className="border rounded-md p-2"
                    value={filters.isActive}
                    onChange={(e) =>
                        setFilters({
                            ...filters,
                            isActive: e.target.value as any,
                        })
                    }
                >
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                </select>
            </div>

            <div className="bg-white border rounded-xl overflow-hidden">
                {/* Loading UI */}
                {loading && !data ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <ProductSkeleton key={i} />
                        ))}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[600px]">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-3 text-left">Name</th>
                                    <th className="p-3 text-left">ID</th>
                                    <th className="p-3 text-left">Status</th>
                                    <th className="p-3 text-left">Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {paginatedCategories.length ? (
                                    paginatedCategories.map((c: any) => (
                                        <tr
                                            key={c.categoryId}
                                            className="border-t"
                                        >
                                            <td className="p-3">{c.name}</td>
                                            <td className="p-3">{c.categoryId}</td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <Toggle
                                                        checked={c.isActive}
                                                        disabled={
                                                            togglingId ===
                                                            c.categoryId
                                                        }
                                                        onChange={() =>
                                                            handleToggleStatus(
                                                                c.categoryId,
                                                                c.isActive
                                                            )
                                                        }
                                                    />

                                                    <span className="text-xs font-medium">
                                                        {c.isActive
                                                            ? "Active"
                                                            : "Inactive"}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="p-3">
                                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">

                                                    <Link
                                                        to={`/admin/categories/${c.categoryId}/edit`}
                                                        className="w-full sm:w-auto"
                                                    >
                                                        <Button
                                                            variant="outline"
                                                            className="w-full sm:w-auto min-w-[90px]"
                                                        >
                                                            Edit
                                                        </Button>
                                                    </Link>

                                                    <Button
                                                        variant="outline"
                                                        className="
                                                        w-full sm:w-auto min-w-[90px]
                                                        border-red-500 text-red-600
                                                        hover:bg-red-50
                                                    "
                                                        disabled={deletingId === c.categoryId}
                                                        onClick={() => handleDeleteClick(c.categoryId)}
                                                    >
                                                        {deletingId === c.categoryId ? "Deleting…" : "Delete"}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="p-6 text-center text-gray-500"
                                        >
                                            <EmptyState
                                                title="No categories found"
                                                description="Try explore other categories."
                                            />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex justify-center items-center gap-3 p-4 border-t">
                    <Button
                        variant="outline"
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        ← Previous
                    </Button>

                    <span className="text-sm">
                        Page {page} of {totalPages || 1}
                    </span>

                    <Button
                        variant="outline"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Next →
                    </Button>
                </div>

            </div>

            <ConfirmDialog
                open={showDeleteConfirm}
                title="Delete Category?"
                message={
                    <>
                        Are you sure you want to delete this category?
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
                onConfirm={handleDeleteConfirm}
            />
        </div>
    );
}