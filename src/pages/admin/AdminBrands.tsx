import { useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import Toggle from "../../components/ui/Toggle";
import { useAdminBrandsStore } from "../../store/adminBrands.store";
import { useAlert } from "../../store/alert.store";
import { Link } from "react-router-dom";
import { useDebounce } from "../../utils/useDebounce";

import {
    updateBrandStatus,
    deleteBrand,
} from "../../services/adminBrands.api";

import ConfirmDialog from "../../components/ui/ConfirmDialog";
export default function AdminBrands() {
    const { fetchPage, loading, clearCache } = useAdminBrandsStore();
    const { showAlert } = useAlert();

    const [page, setPage] = useState(1);
    const [data, setData] = useState<any>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [brandToDelete, setBrandToDelete] = useState<string | null>(null);

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
        loadBrands();
    }, [page, effectiveFilters]);

    const loadBrands = async () => {
        try {
            const res = await fetchPage(effectiveFilters, page);
            setData(res);
        } catch (err: any) {
            showAlert({
                type: "error",
                message: err?.message || "Failed to load brands",
            });
        }
    };

    const handleToggleStatus = async (brandId: string, current: boolean) => {
        if (togglingId) return;

        try {
            setTogglingId(brandId);

            await updateBrandStatus(brandId, !current);

            showAlert({
                type: "success",
                message: `Brand marked as ${!current ? "Active" : "Inactive"}`,
            });

            clearCache();
            loadBrands();
        } catch (err: any) {
            showAlert({
                type: "error",
                message: err?.message || "Failed to update brand status",
            });
        } finally {
            setTogglingId(null);
        }
    };

    const handleDeleteClick = (brandId: string) => {
        setBrandToDelete(brandId);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        if (!brandToDelete) return;

        try {
            setDeletingId(brandToDelete);

            await deleteBrand(brandToDelete);

            showAlert({
                type: "success",
                message: "Brand deleted successfully",
            });

            clearCache();
            loadBrands();
        } catch (err: any) {
            showAlert({
                type: "error",
                message: err?.message || "Failed to delete brand",
            });
        } finally {
            setDeletingId(null);
            setBrandToDelete(null);
            setShowDeleteConfirm(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-semibold">Brands</h1>

                <Link to="/admin/brands/create">
                    <Button>Add Brand</Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                    placeholder="Search brand"
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
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[650px]">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3 text-left">Name</th>
                                <th className="p-3 text-left">Status</th>
                                <th className="p-3 text-left">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading && (
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
                            )}
                            {!loading && data?.items?.length ? (
                                data.items.map((b: any) => (
                                    <tr key={b.brandId} className="border-t">
                                        <td className="p-3">{b.name}</td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <Toggle
                                                    checked={b.isActive === true}
                                                    disabled={togglingId === b.brandId}
                                                    onChange={() =>
                                                        handleToggleStatus(b.brandId, b.isActive)
                                                    }
                                                />

                                                <span className="text-xs font-medium">
                                                    {b.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                                                <Link to={`/admin/brands/${b.brandId}/edit`}>
                                                    <Button variant="outline" className="w-full sm:w-auto">
                                                        Edit
                                                    </Button>
                                                </Link>

                                                <Button
                                                    variant="outline"
                                                    className="w-full border-red-500 text-red-600 sm:w-auto"
                                                    disabled={deletingId === b.brandId}
                                                    onClick={() => handleDeleteClick(b.brandId)}
                                                >
                                                    {deletingId === b.brandId
                                                        ? "Deleting…"
                                                        : "Delete"}
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
                                        No brands found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ---------- PAGINATION ---------- */}
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
                title="Delete Brand?"
                message={
                    <>
                        Are you sure you want to delete this brand?
                        <br />
                        <span className="text-red-500 font-medium">
                            This action cannot be undone.
                        </span>
                    </>
                }
                confirmText="Yes, Delete"
                cancelText="Cancel"
                loading={deletingId !== null}
                onCancel={() => {
                    setShowDeleteConfirm(false);
                    setBrandToDelete(null);
                }}
                onConfirm={handleDeleteConfirm}
            />
        </div>
    );
}