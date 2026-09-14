import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import ProductSkeleton from "../../components/product/ProductSkeleton";

import {
    getComboPackages,
} from "../../services/product.api";

import { useAlert } from "../../store/alert.store";

export default function AdminComboPackagesPage() {
    const navigate = useNavigate();
    const { showAlert } = useAlert();

    const [combos, setCombos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchComboPackages = async () => {
        try {
            setLoading(true);

            const response = await getComboPackages();

            /*
             * apiFetch may return the response body directly
             * or an object containing the data.
             */
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

                                            {/* Actions */}
                                            <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end">
                                                <Button
                                                    type="button"
                                                    onClick={() =>
                                                        navigate(
                                                            `/admin/combo-packages/edit/${combo.comboId}`
                                                        )
                                                    }
                                                >
                                                    Edit
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
        </div>
    );
}