import { useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import Toggle from "../../components/ui/Toggle";
import { useAdminCategoriesStore } from "../../store/adminCategories.store";
import { useAlert } from "../../store/alert.store";
import { Link } from "react-router-dom";
import { useDebounce } from "../../utils/useDebounce";

import {
    updateCategoryStatus,
    deleteCategory,
} from "../../services/adminCategories.api";

import ConfirmDialog from "../../components/ui/ConfirmDialog";
export default function AdminCategories() {
    const { fetchPage, loading, clearCache } = useAdminCategoriesStore();
    const { showAlert } = useAlert();

    const [page, setPage] = useState(1);
    const [data, setData] = useState<any>(null);

    const [togglingId, setTogglingId] = useState<string | null>(null);

    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] =
        useState<string | null>(null);

    const [filters, setFilters] = useState({
        search: "",
        isActive: "" as "" | "true" | "false",
    });

    const debouncedSearch = useDebounce(filters.search, 1000);
    const effectiveFilters = useMemo(
        () => ({
            search: debouncedSearch,
            isActive: filters.isActive,
        }),
        [debouncedSearch, filters.isActive]
    );

    useEffect(() => {
        setPage(1);
    }, [effectiveFilters]);

    useEffect(() => {
        loadCategories();
    }, [page, effectiveFilters]);

    const loadCategories = async () => {
        try {
            const res = await fetchPage(effectiveFilters, page);
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
                <h1 className="text-xl font-semibold">Categories</h1>

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
                    <>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i} className="border-t animate-pulse">
                                <td className="p-3">
                                    <div className="h-4 w-40 bg-gray-200 rounded" />
                                </td>

                                <td className="p-3">
                                    <div className="h-4 w-20 bg-gray-200 rounded" />
                                </td>

                                <td className="p-3">
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <div className="h-8 w-20 bg-gray-200 rounded-lg" />
                                        <div className="h-8 w-20 bg-gray-200 rounded-lg" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[600px]">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-3 text-left">Name</th>
                                    <th className="p-3 text-left">Status</th>
                                    <th className="p-3 text-left">Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {data?.items?.length ? (
                                    data.items.map((c: any) => (
                                        <tr
                                            key={c.categoryId}
                                            className="border-t"
                                        >
                                            {/* Name */}
                                            <td className="p-3">{c.name}</td>

                                            {/* Status */}
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
                                            No categories found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {(page > 1 || data?.nextCursor) && (
                    <div className="flex justify-center gap-3 p-4 border-t">
                        {page > 1 && (
                            <Button
                                variant="outline"
                                onClick={() => setPage((p) => p - 1)}
                            >
                                Previous
                            </Button>
                        )}

                        {data?.nextCursor && (
                            <Button
                                variant="outline"
                                disabled={loading}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Next
                            </Button>
                        )}
                    </div>
                )}
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