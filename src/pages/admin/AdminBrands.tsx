import { useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import Toggle from "../../components/ui/Toggle";
import { useAdminBrandsStore } from "../../store/adminBrands.store";
import { useAlert } from "../../store/alert.store";
import { Link, useNavigate } from "react-router-dom";
import {
    updateBrandStatus,
    deleteBrand,
} from "../../services/adminBrands.api";

import ConfirmDialog from "../../components/ui/ConfirmDialog";
import ProductSkeleton from "../../components/product/ProductSkeleton";
import EmptyState from "../../components/ui/EmptyState";
export default function AdminBrands() {
    const navigate = useNavigate();
    const { fetchPage, loading, clearCache } = useAdminBrandsStore();
    const { showAlert } = useAlert();
    const [data, setData] = useState<any>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [brandToDelete, setBrandToDelete] = useState<string | null>(null);
    const PAGE_SIZE = 20;
    const [page, setPage] = useState(1);

    const [filters, setFilters] = useState({
        search: "",
        isActive: "" as "" | "true" | "false",
    });


    useEffect(() => {
        loadBrands();
    }, []);

    const loadBrands = async () => {
        try {
            const res = await fetchPage({}, null);
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
            setData((prev: any) => ({
                ...prev,
                items: prev.items.map((b: any) =>
                    b.brandId === brandId
                        ? { ...b, isActive: !current }
                        : b
                ),
            }));
            clearCache();

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
    const query = filters.search.trim().toLowerCase();
    const filteredBrands = useMemo(() => {
        return (data?.items ?? []).filter((b: any) => {
            const matchesSearch =
                !query ||
                (`${b.name} ${b.brandId}`)
                    .toLowerCase()
                    .includes(query);

            const matchesStatus =
                !filters.isActive ||
                String(b.isActive) === filters.isActive;

            return (
                matchesSearch &&
                matchesStatus
            );
        });
    }, [
        data?.items,
        query,
        filters.isActive,
    ]);
    const paginatedBrands = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;

        return filteredBrands.slice(
            start,
            start + PAGE_SIZE
        );
    }, [filteredBrands, page]);
    const totalPages = Math.ceil(
        filteredBrands.length / PAGE_SIZE
    );
    useEffect(() => {
        setPage(1);
    }, [query, filters.isActive]);
    useEffect(() => {
        if (page > totalPages && totalPages > 0) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

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
                        Brands
                    </h1>
                </div>

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

            {loading && !data && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <ProductSkeleton key={i} />
                    ))}
                </div>
            )}
            <div className="bg-white border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[650px]">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3 text-left">Name</th>
                                <th className="p-3 text-left">ID</th>
                                <th className="p-3 text-left">Status</th>
                                <th className="p-3 text-left">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {!loading && paginatedBrands.length ? (
                                paginatedBrands.map((b: any) => (
                                    <tr key={b.brandId} className="border-t">
                                        <td className="p-3">{b.name}</td>
                                        <td>{b.brandId}</td>
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
                                        <EmptyState
                                            title="No brands found"
                                            description="Try explore other brands."
                                        />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
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