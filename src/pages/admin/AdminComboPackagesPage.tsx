import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import ProductSkeleton from "../../components/product/ProductSkeleton";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

import {
    getComboPackages,
    deleteComboPackage,
} from "../../services/product.api";

import { useAlert } from "../../store/alert.store";

export default function AdminComboPackagesPage() {
    const navigate = useNavigate();
    const { showAlert } = useAlert();

    const [combos, setCombos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingComboId, setDeletingComboId] =
        useState<string | null>(null);

    const [showDeleteConfirm, setShowDeleteConfirm] =
        useState(false);

    const [selectedCombo, setSelectedCombo] =
        useState<{
            comboId: string;
            name: string;
        } | null>(null);

    const handleDeleteClick = (
        comboId: string,
        comboName: string
    ) => {
        setSelectedCombo({
            comboId,
            name: comboName,
        });

        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedCombo) {
            return;
        }

        const comboId = selectedCombo.comboId;

        try {
            setDeletingComboId(comboId);

            await deleteComboPackage(comboId);

            // Remove the deleted combo immediately from the UI
            setCombos((currentCombos) =>
                currentCombos.filter(
                    (combo) =>
                        combo.comboId !== comboId
                )
            );

            showAlert({
                type: "success",
                message:
                    "Combo package deleted successfully",
                duration: 2000,
            });
        } catch (error: any) {
            console.error(
                "Delete combo package failed:",
                error
            );

            showAlert({
                type: "error",
                message:
                    error?.message ||
                    "Unable to delete combo package.",
            });
        } finally {
            setShowDeleteConfirm(false);
            setSelectedCombo(null);
            setDeletingComboId(null);
        }
    };

    const fetchComboPackages = async () => {
        try {
            setLoading(true);

            const response = await getComboPackages();
            const data =
                Array.isArray(response)
                    ? response
                    : response?.data || [];

            setCombos(data);
        } catch (error: any) {
            console.error(
                "Failed to fetch combo packages:",
                error
            );

            showAlert({
                type: "error",
                message:
                    error?.message ||
                    "Unable to load combo packages.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComboPackages();
    }, []);

    return (
        <div className="flex justify-center px-4">
            <div className="w-full max-w-7xl">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                Combo Packages
                            </h1>

                            <p className="text-sm text-gray-500 mt-1">
                                Manage your combo packages and
                                their products.
                            </p>
                        </div>

                        <Button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/admin/combo-packages/create"
                                )
                            }
                        >
                            + Create Combo
                        </Button>
                    </div>

                    {/* Loading */}
                    {loading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {Array.from({
                                length: 6,
                            }).map((_, index) => (
                                <ProductSkeleton
                                    key={index}
                                />
                            ))}
                        </div>
                    )}

                    {/* Empty */}
                    {!loading && combos.length === 0 && (
                        <EmptyState
                            title="No combo packages found"
                            description="Create your first combo package to get started."
                        />
                    )}

                    {/* Combo list */}
                    {!loading && combos.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {combos.map(
                                (combo: any) => (
                                    <div
                                        key={
                                            combo.comboId ||
                                            combo.productId
                                        }
                                        className="border border-gray-200 rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow"
                                    >
                                        {/* Image */}
                                        <div className="h-44 bg-gray-100 flex items-center justify-center">
                                            {combo.imageUrl ? (
                                                <img
                                                    src={
                                                        combo.imageUrl
                                                    }
                                                    alt={
                                                        combo.name
                                                    }
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="text-gray-400 text-sm">
                                                    No image
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="p-5">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <h2 className="font-semibold text-lg text-gray-900">
                                                        {
                                                            combo.name
                                                        }
                                                    </h2>

                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {
                                                            combo.productCount
                                                        }{" "}
                                                        product
                                                        {combo.productCount !==
                                                            1
                                                            ? "s"
                                                            : ""}
                                                    </p>
                                                </div>

                                                <span className="font-bold text-lg text-gray-900 whitespace-nowrap">
                                                    ₹
                                                    {Number(
                                                        combo.price ||
                                                        0
                                                    ).toFixed(
                                                        2
                                                    )}
                                                </span>
                                            </div>

                                            {/* Products */}
                                            {combo.products
                                                ?.length >
                                                0 && (
                                                    <div className="mt-4 space-y-2">
                                                        {combo.products
                                                            .slice(
                                                                0,
                                                                4
                                                            )
                                                            .map(
                                                                (
                                                                    product: any
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            product.productId
                                                                        }
                                                                        className="flex items-center gap-3"
                                                                    >
                                                                        <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                                                            {product.imageUrl ? (
                                                                                <img
                                                                                    src={
                                                                                        product.imageUrl
                                                                                    }
                                                                                    alt={
                                                                                        product.name
                                                                                    }
                                                                                    className="w-full h-full object-cover"
                                                                                />
                                                                            ) : (
                                                                                <div className="w-full h-full" />
                                                                            )}
                                                                        </div>

                                                                        <p className="text-sm text-gray-700 truncate">
                                                                            {
                                                                                product.name
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                )
                                                            )}

                                                        {combo.products
                                                            .length >
                                                            4 && (
                                                                <p className="text-xs text-gray-500 pl-12">
                                                                    +
                                                                    {combo.products
                                                                        .length -
                                                                        4}{" "}
                                                                    more
                                                                </p>
                                                            )}
                                                    </div>
                                                )}

                                            <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() =>
                                                        navigate(
                                                            `/admin/combo-packages/edit/${combo.comboId}`
                                                        )
                                                    }
                                                >
                                                    Edit
                                                </Button>

                                                <Button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDeleteClick(
                                                            combo.comboId,
                                                            combo.name
                                                        )
                                                    }
                                                    disabled={
                                                        deletingComboId === combo.comboId
                                                    }
                                                    className="bg-red-600 hover:bg-red-700"
                                                >
                                                    {deletingComboId === combo.comboId
                                                        ? "Deleting..."
                                                        : "Delete"}
                                                </Button>
                                            </div>

                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>
            <ConfirmDialog
                open={showDeleteConfirm}
                title="Delete Combo Package?"
                message={
                    <>
                        Are you sure you want to delete{" "}
                        <span className="font-semibold">
                            "{selectedCombo?.name}"
                        </span>
                        ?
                        <br />

                        <span className="text-red-500 font-medium">
                            This will also remove the combo mapping
                            from all mapped products.
                        </span>
                        <br />

                        <span className="text-red-500 font-medium">
                            This action cannot be undone.
                        </span>
                    </>
                }
                confirmText="Yes, Delete"
                cancelText="Cancel"
                loading={
                    selectedCombo !== null &&
                    deletingComboId ===
                    selectedCombo.comboId
                }
                onCancel={() => {
                    setShowDeleteConfirm(false);
                    setSelectedCombo(null);
                }}
                onConfirm={handleDeleteConfirm}
            />
        </div>
    );
}