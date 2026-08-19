import {
    useEffect,
    useMemo,
    useState,
} from "react";

import Button from "../../components/ui/Button";
import Toggle from "../../components/ui/Toggle";

import {
    useAdminBrandsStore,
} from "../../store/adminBrands.store";

import { useAlert } from "../../store/alert.store";

import {
    Link,
    useNavigate,
} from "react-router-dom";

import {
    updateBrandStatus,
    deleteBrand,
} from "../../services/adminBrands.api";

import ConfirmDialog from "../../components/ui/ConfirmDialog";
import ProductSkeleton from "../../components/product/ProductSkeleton";
import EmptyState from "../../components/ui/EmptyState";

export default function AdminBrands() {

    const navigate = useNavigate();

    const {
        brands,
        loading,
        fetchBrands,
        clearCache,
    } = useAdminBrandsStore();

    const { showAlert } = useAlert();

    const [togglingId, setTogglingId] =
        useState<string | null>(null);

    const [deletingId, setDeletingId] =
        useState<string | null>(null);

    const [showDeleteConfirm, setShowDeleteConfirm] =
        useState(false);

    const [brandToDelete, setBrandToDelete] =
        useState<string | null>(null);

    /*
     * Local pagination
     */
    const PAGE_SIZE = 20;

    const [page, setPage] =
        useState(1);

    /*
     * Local filters
     */
    const [filters, setFilters] =
        useState({
            search: "",
            isActive: "" as "" | "true" | "false",
        });

    /*
     * Load all brands once.
     */
    useEffect(() => {

        fetchBrands().catch((err: any) => {

            showAlert({
                type: "error",
                message:
                    err?.message ||
                    "Failed to load brands",
            });

        });

    }, [fetchBrands, showAlert]);

    /*
     * Toggle Active / Inactive
     */
    const handleToggleStatus = async (
        brandId: string,
        current: boolean
    ) => {

        if (togglingId) return;

        try {

            setTogglingId(brandId);

            await updateBrandStatus(
                brandId,
                !current
            );

            showAlert({
                type: "success",
                message: `Brand marked as ${!current
                        ? "Active"
                        : "Inactive"
                    }`,
            });

            /*
             * Update the local list immediately.
             * No need to call the list API again.
             */
            useAdminBrandsStore.setState(
                (state) => ({
                    brands: state.brands.map(
                        (brand: any) =>
                            brand.brandId === brandId
                                ? {
                                    ...brand,
                                    isActive:
                                        !current,
                                }
                                : brand
                    ),
                })
            );

        } catch (err: any) {

            showAlert({
                type: "error",
                message:
                    err?.message ||
                    "Failed to update brand status",
            });

        } finally {

            setTogglingId(null);

        }

    };

    /*
     * Delete click
     */
    const handleDeleteClick = (
        brandId: string
    ) => {

        setBrandToDelete(brandId);
        setShowDeleteConfirm(true);

    };

    /*
     * Confirm delete
     */
    const handleDeleteConfirm = async () => {

        if (!brandToDelete) return;

        try {

            setDeletingId(
                brandToDelete
            );

            await deleteBrand(
                brandToDelete
            );

            showAlert({
                type: "success",
                message:
                    "Brand deleted successfully",
            });

            /*
             * Clear existing list so next fetch
             * gets fresh data.
             */
            clearCache();

            /*
             * Reload the complete brand list.
             */
            await fetchBrands();

            /*
             * Return to first page after deletion.
             */
            setPage(1);

        } catch (err: any) {

            showAlert({
                type: "error",
                message:
                    err?.message ||
                    "Failed to delete brand",
            });

        } finally {

            setDeletingId(null);

            setBrandToDelete(null);

            setShowDeleteConfirm(false);

        }

    };

    /*
     * ============================================================
     * LOCAL SEARCH + STATUS FILTER
     * ============================================================
     */

    const query =
        filters.search
            .trim()
            .toLowerCase();

    const filteredBrands = useMemo(() => {

        return brands.filter(
            (brand: any) => {

                /*
                 * Search by brand name or ID.
                 */
                const matchesSearch =
                    !query ||
                    `${brand.name} ${brand.brandId}`
                        .toLowerCase()
                        .includes(query);

                /*
                 * Active / Inactive filter.
                 */
                const matchesStatus =
                    !filters.isActive ||
                    String(brand.isActive) ===
                    filters.isActive;

                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );

    }, [
        brands,
        query,
        filters.isActive,
    ]);

    /*
     * ============================================================
     * LOCAL PAGINATION
     * ============================================================
     */

    const paginatedBrands = useMemo(() => {

        const start =
            (page - 1) *
            PAGE_SIZE;

        return filteredBrands.slice(
            start,
            start + PAGE_SIZE
        );

    }, [
        filteredBrands,
        page,
    ]);

    const totalPages =
        Math.ceil(
            filteredBrands.length /
            PAGE_SIZE
        );

    /*
     * Reset to page 1 whenever
     * search or status filter changes.
     */
    useEffect(() => {

        setPage(1);

    }, [
        query,
        filters.isActive,
    ]);

    /*
     * If deleting/filtering causes the
     * current page to become invalid,
     * move to the last available page.
     */
    useEffect(() => {

        if (
            totalPages > 0 &&
            page > totalPages
        ) {

            setPage(totalPages);

        }

        if (
            totalPages === 0 &&
            page !== 1
        ) {

            setPage(1);

        }

    }, [
        page,
        totalPages,
    ]);

    return (

        <div className="space-y-4">

            {/* =====================================================
             * HEADER
             * ===================================================== */}

            <div className="
                flex
                flex-col
                sm:flex-row
                sm:items-center
                sm:justify-between
                gap-4
            ">

                <div className="
                    flex
                    items-center
                    gap-3
                    mb-4
                ">

                    <button
                        onClick={() =>
                            navigate(-1)
                        }
                        className="
                            flex
                            items-center
                            justify-center
                            w-9
                            h-9
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

                    <h1 className="
                        text-xl
                        md:text-2xl
                        font-semibold
                        text-[var(--color-primary)]
                    ">
                        Brands
                    </h1>

                </div>

                <Link
                    to="/admin/brands/create"
                    className="w-full sm:w-auto"
                >

                    <Button className="w-full sm:w-auto">
                        Add Brand
                    </Button>

                </Link>

            </div>

            {/* =====================================================
             * FILTERS
             * ===================================================== */}

            <div className="
                grid
                grid-cols-1
                sm:grid-cols-2
                gap-3
            ">

                <input
                    placeholder="Search brand"
                    className="
                        border
                        rounded-md
                        p-2
                    "
                    value={filters.search}
                    onChange={(e) =>
                        setFilters({
                            ...filters,
                            search:
                                e.target.value,
                        })
                    }
                />

                <select
                    className="
                        border
                        rounded-md
                        p-2
                    "
                    value={filters.isActive}
                    onChange={(e) =>
                        setFilters({
                            ...filters,
                            isActive:
                                e.target.value as
                                | ""
                                | "true"
                                | "false",
                        })
                    }
                >

                    <option value="">
                        All Status
                    </option>

                    <option value="true">
                        Active
                    </option>

                    <option value="false">
                        Inactive
                    </option>

                </select>

            </div>

            {/* =====================================================
             * LOADING
             * ===================================================== */}

            {loading && !brands.length && (

                <div className="
                    grid
                    grid-cols-2
                    md:grid-cols-4
                    gap-4
                ">

                    {Array.from({
                        length: 6,
                    }).map((_, i) => (

                        <ProductSkeleton
                            key={i}
                        />

                    ))}

                </div>

            )}

            {/* =====================================================
             * BRAND TABLE
             * ===================================================== */}

            <div className="
                bg-white
                border
                rounded-xl
                overflow-hidden
            ">

                <div className="overflow-x-auto">

                    <table className="
                        w-full
                        text-sm
                        min-w-[650px]
                    ">

                        <thead className="bg-gray-50">

                            <tr>

                                <th className="p-3 text-left">
                                    Name
                                </th>

                                <th className="p-3 text-left">
                                    ID
                                </th>

                                <th className="p-3 text-left">
                                    Status
                                </th>

                                <th className="p-3 text-left">
                                    Action
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {!loading &&
                                paginatedBrands.length > 0 ? (

                                paginatedBrands.map(
                                    (brand: any) => (

                                        <tr
                                            key={
                                                brand.brandId
                                            }
                                            className="
                                                border-t
                                            "
                                        >

                                            {/* Name */}

                                            <td className="p-3">
                                                {brand.name}
                                            </td>

                                            {/* ID */}

                                            <td className="p-3">
                                                {brand.brandId}
                                            </td>

                                            {/* Status */}

                                            <td className="p-3">

                                                <div className="
                                                    flex
                                                    items-center
                                                    gap-2
                                                ">

                                                    <Toggle
                                                        checked={
                                                            brand.isActive ===
                                                            true
                                                        }
                                                        disabled={
                                                            togglingId ===
                                                            brand.brandId
                                                        }
                                                        onChange={() =>
                                                            handleToggleStatus(
                                                                brand.brandId,
                                                                brand.isActive
                                                            )
                                                        }
                                                    />

                                                    <span className="
                                                        text-xs
                                                        font-medium
                                                    ">
                                                        {brand.isActive
                                                            ? "Active"
                                                            : "Inactive"}
                                                    </span>

                                                </div>

                                            </td>

                                            {/* Actions */}

                                            <td className="p-3">

                                                <div className="
                                                    flex
                                                    flex-nowrap
                                                    gap-2
                                                ">

                                                    <Link
                                                        to={`/admin/brands/${brand.brandId}/edit`}
                                                    >

                                                        <Button
                                                            variant="outline"
                                                            className="
                                                                w-full
                                                                sm:w-auto
                                                            "
                                                        >
                                                            Edit
                                                        </Button>

                                                    </Link>

                                                    <Button
                                                        variant="outline"
                                                        className="
                                                            w-full
                                                            border-red-500
                                                            text-red-600
                                                            sm:w-auto
                                                        "
                                                        disabled={
                                                            deletingId ===
                                                            brand.brandId
                                                        }
                                                        onClick={() =>
                                                            handleDeleteClick(
                                                                brand.brandId
                                                            )
                                                        }
                                                    >

                                                        {deletingId ===
                                                            brand.brandId
                                                            ? "Deleting…"
                                                            : "Delete"}

                                                    </Button>

                                                </div>

                                            </td>

                                        </tr>

                                    )
                                )

                            ) : (

                                <tr>

                                    <td
                                        colSpan={4}
                                        className="
                                            p-6
                                            text-center
                                            text-gray-500
                                        "
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

                {/* =================================================
                 * LOCAL PAGINATION
                 * ================================================= */}

                <div className="
                    flex
                    justify-center
                    items-center
                    gap-3
                    p-4
                    border-t
                ">

                    <Button
                        variant="outline"
                        disabled={
                            page === 1 ||
                            loading
                        }
                        onClick={() =>
                            setPage(
                                (currentPage) =>
                                    currentPage - 1
                            )
                        }
                    >
                        ← Previous
                    </Button>

                    <span className="text-sm">

                        Page{" "}
                        {page}{" "}
                        of{" "}
                        {totalPages || 1}

                    </span>

                    <Button
                        variant="outline"
                        disabled={
                            page >= totalPages ||
                            loading ||
                            totalPages === 0
                        }
                        onClick={() =>
                            setPage(
                                (currentPage) =>
                                    currentPage + 1
                            )
                        }
                    >
                        Next →
                    </Button>

                </div>

            </div>

            {/* =====================================================
             * DELETE CONFIRMATION
             * ===================================================== */}

            <ConfirmDialog
                open={
                    showDeleteConfirm
                }
                title="Delete Brand?"
                message={
                    <>
                        Are you sure you want to
                        delete this brand?

                        <br />

                        <span className="
                            text-red-500
                            font-medium
                        ">
                            This action cannot be undone.
                        </span>
                    </>
                }
                confirmText="Yes, Delete"
                cancelText="Cancel"
                loading={
                    deletingId !== null
                }
                onCancel={() => {

                    setShowDeleteConfirm(
                        false
                    );

                    setBrandToDelete(
                        null
                    );

                }}
                onConfirm={
                    handleDeleteConfirm
                }
            />

        </div>

    );
}