import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import ProductSkeleton from "../../components/product/ProductSkeleton";
import EmptyState from "../../components/ui/EmptyState";
import { useHomeProducts } from "../../store/homeProduct.store";
import defaultImage from "../../assets/default-image.png";
import {
    getComboPackage,
    updateComboPackage,
} from "../../services/product.api";
import { useAlert } from "../../store/alert.store";
import { useConfigStore } from "../../store/config.store";
import { sortProductsByCategoryAndSequence } from "../../utils/sequncerUtil";
import { useCatalog } from "../../store/catalog.store";


export default function AdminEditComboPackagePage() {
    const navigate = useNavigate();
    const { comboId } = useParams<{ comboId: string }>();

    const {
        products,
        loading: productsLoading,
        fetchAll,
    } = useHomeProducts();

    const {
        categories,
        fetchCategories,
    } = useCatalog();

    const { showAlert } = useAlert();
    const config = useConfigStore((s) => s.config);
    const [loadingCombo, setLoadingCombo] = useState(true);
    const [updatingCombo, setUpdatingCombo] = useState(false);
    const [productSearch, setProductSearch] = useState("");
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
        []
    );
    const [comboName, setComboName] = useState("");
    const [targetPrice, setTargetPrice] = useState("");
    const [step, setStep] = useState<1 | 3>(1);

    useEffect(() => {
        fetchAll();
        fetchCategories();
    }, []);

    useEffect(() => {
        if (!comboId) {
            showAlert({
                type: "error",
                message: "Combo package ID is missing.",
            });

            navigate("/admin/combo-packages");
            return;
        }

        const loadCombo = async () => {
            try {
                setLoadingCombo(true);

                const response: any = await getComboPackage(comboId);
                const combo = response?.data ?? response;
                setComboName(combo?.name ?? "");
                setTargetPrice(
                    combo?.price !== undefined &&
                        combo?.price !== null
                        ? String(combo.price)
                        : ""
                );

                setSelectedProductIds(
                    Array.isArray(combo?.productIds)
                        ? combo.productIds
                        : []
                );
            } catch (error: any) {
                console.error(
                    "Load combo package failed:",
                    error
                );

                showAlert({
                    type: "error",
                    message:
                        error?.message ||
                        "Unable to load combo package.",
                });

                navigate("/admin/combo-packages");
            } finally {
                setLoadingCombo(false);
            }
        };

        loadCombo();
    }, [comboId]);

    let filteredProducts = useMemo(() => {
        const query = productSearch.trim().toLowerCase();

        return products.filter((product: any) => {
            if (
                product.isRetailOnly !== true ||
                product.isComboPackage === true
            ) {
                return false;
            }

            if (!query) {
                return true;
            }

            return product.name
                ?.toLowerCase()
                .includes(query);
        });
    }, [products, productSearch]);

    filteredProducts = sortProductsByCategoryAndSequence(
        filteredProducts,
        categories,
        true
    );

    const selectedProducts = useMemo(() => {
        const selectedIds = new Set(selectedProductIds);

        return products.filter(
            (product: any) =>
                product.isRetailOnly === true &&
                product.isComboPackage !== true &&
                selectedIds.has(product.id)
        );
    }, [products, selectedProductIds]);

    const getProductPrice = (product: any) =>
        Number(
            product.discountedPrice ??
            product.price ??
            0
        );
    const selectedProductsTotal = useMemo(() => {
        return selectedProducts.reduce(
            (total, product: any) =>
                total + getProductPrice(product),
            0
        );
    }, [selectedProducts]);

    const packagingPercent = Number(
        config?.packagingPercent || 0
    );

    const packagingAmount = useMemo(() => {
        return Math.round(
            selectedProductsTotal *
            packagingPercent /
            100
        );
    }, [selectedProductsTotal, packagingPercent]);

    const packageTotal = useMemo(() => {
        return selectedProductsTotal + packagingAmount;
    }, [selectedProductsTotal, packagingAmount]);

    const numericTargetPrice = Number(targetPrice) || 0;

    const remainingAmount =
        numericTargetPrice - packageTotal;

    const targetReached =
        numericTargetPrice > 0 &&
        packageTotal >= numericTargetPrice;

    const targetExceeded =
        numericTargetPrice > 0 &&
        packageTotal > numericTargetPrice;

    const selectedTotalInCents = Math.round(
        packageTotal * 100
    );

    const targetPriceInCents = Math.round(
        numericTargetPrice * 100
    );

    const targetExactlyReached =
        numericTargetPrice > 0 &&
        selectedProductIds.length > 0 &&
        selectedTotalInCents === targetPriceInCents;

    const targetReachedOrExceeded =
        numericTargetPrice > 0 &&
        selectedProductIds.length > 0 &&
        selectedTotalInCents >= targetPriceInCents;


    const toggleProduct = (productId: string) => {
        setSelectedProductIds((current) =>
            current.includes(productId)
                ? current.filter(
                    (id) => id !== productId
                )
                : [...current, productId]
        );
    };

    // ------------------------------------------------------------
    // Move to review
    // ------------------------------------------------------------

    const handleNext = () => {
        if (selectedProductIds.length === 0) {
            return;
        }

        if (!targetReachedOrExceeded) {
            return;
        }

        setStep(3);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    // ------------------------------------------------------------
    // Update combo
    // ------------------------------------------------------------

    const handleUpdateCombo = async () => {
        if (updatingCombo) {
            return;
        }

        if (!comboId) {
            return;
        }

        if (selectedProductIds.length === 0) {
            return;
        }

        if (!targetReachedOrExceeded) {
            return;
        }

        try {
            setUpdatingCombo(true);

            await updateComboPackage(comboId, {
                productIds: selectedProductIds,
            });

            showAlert({
                type: "success",
                message:
                    "Combo package updated successfully.",
                duration: 2000,
            });

            navigate("/admin/combo-packages");
        } catch (error: any) {
            console.error(
                "Update combo package failed:",
                error
            );

            showAlert({
                type: "error",
                message:
                    error?.message ||
                    "Unable to update combo package.",
            });
        } finally {
            setUpdatingCombo(false);
        }
    };

    // ------------------------------------------------------------
    // Image helper
    // ------------------------------------------------------------

    const getProductImage = (product: any) =>
        product.image ||
        product.imageUrl ||
        product.images?.[0] ||
        defaultImage;

    if (loadingCombo) {
        return (
            <div className="w-full px-3 sm:px-4 pb-8">
                <div className="mx-auto w-full max-w-6xl">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />

                            <div className="space-y-2">
                                <div className="h-5 w-56 bg-gray-100 rounded animate-pulse" />
                                <div className="h-3 w-80 bg-gray-100 rounded animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ------------------------------------------------------------
    // Render
    // ------------------------------------------------------------

    return (
        <div className="w-full px-3 sm:px-4 pb-8">
            <div className="mx-auto w-full max-w-6xl">
                <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 md:p-8 space-y-5 sm:space-y-6 shadow-sm overflow-hidden">

                    {/* Header */}

                    <div>
                        <div className="flex items-start gap-3">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-[var(--color-primary)] text-white hover:scale-105 active:scale-95 transition"
                                aria-label="Go back"
                            >
                                ←
                            </button>

                            <div className="min-w-0 flex-1">
                                <h1 className="text-xl sm:text-2xl font-semibold text-[var(--color-primary)] leading-tight">
                                    Edit Combo Package
                                </h1>

                                <p className="text-sm text-gray-500 mt-1.5 max-w-2xl">
                                    Update the products included in this combo package.
                                </p>
                            </div>
                        </div>

                        {/* Step indicator */}

                        <div className="mt-5 flex items-center gap-2 text-xs sm:text-sm">
                            <div
                                className={`
                                    flex items-center gap-2
                                    px-3 py-1.5
                                    rounded-full
                                    border
                                    ${step === 1
                                        ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                                        : "bg-green-50 text-green-700 border-green-200"
                                    }
                                `}
                            >
                                <span className="font-semibold">
                                    1
                                </span>

                                <span>Build</span>
                            </div>

                            <div className="h-px w-6 sm:w-10 bg-gray-300" />

                            <div
                                className={`
                                    flex items-center gap-2
                                    px-3 py-1.5
                                    rounded-full
                                    border
                                    ${step === 3
                                        ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                                        : "bg-gray-50 text-gray-500 border-gray-200"
                                    }
                                `}
                            >
                                <span className="font-semibold">
                                    2
                                </span>

                                <span>Review</span>
                            </div>
                        </div>
                    </div>

                    {step === 1 && (
                        <>
                            {/* Combo Details */}

                            <div className="space-y-4 border border-gray-200 rounded-xl p-4 sm:p-5">
                                <div>
                                    <p className="text-sm sm:text-base font-semibold text-gray-900">
                                        Combo Details
                                    </p>

                                    <p className="text-xs text-gray-500 mt-1">
                                        Combo name and target price cannot be changed while editing.
                                    </p>
                                </div>

                                {/* Combo Name */}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Combo Name
                                    </label>

                                    <input
                                        type="text"
                                        value={comboName}
                                        readOnly
                                        disabled
                                        className="border border-gray-200 rounded-lg px-3 py-3 w-full text-sm sm:text-base bg-gray-100 text-gray-600 cursor-not-allowed"
                                    />
                                </div>

                                {/* Target Price */}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Target Price (₹)
                                    </label>

                                    <input
                                        type="number"
                                        value={targetPrice}
                                        readOnly
                                        disabled
                                        className="border border-gray-200 rounded-lg px-3 py-3 w-full text-sm sm:text-base bg-gray-100 text-gray-600 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {/* Product Selection */}

                            <div className="space-y-4 border border-gray-200 rounded-xl p-4 sm:p-5">

                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <div>
                                        <p className="text-sm sm:text-base font-semibold text-gray-900">
                                            Select Products
                                        </p>

                                        <p className="text-xs text-gray-500 mt-1">
                                            Existing products are already selected. Each selected product is quantity 1.
                                        </p>
                                    </div>

                                    {selectedProductIds.length > 0 && (
                                        <div className="self-start sm:self-auto px-3 py-1.5 rounded-full bg-gray-100 text-xs sm:text-sm font-semibold text-gray-700">
                                            {selectedProductIds.length} selected
                                        </div>
                                    )}
                                </div>

                                {/* Search */}

                                <div className="relative">
                                    <input
                                        type="text"
                                        value={productSearch}
                                        onChange={(e) =>
                                            setProductSearch(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Search products..."
                                        className="border border-gray-300 rounded-lg px-3 py-3 w-full text-sm sm:text-base outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition"
                                    />

                                    {productSearch && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setProductSearch(
                                                    ""
                                                )
                                            }
                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition text-sm"
                                            aria-label="Clear search"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>

                                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1 text-xs text-gray-500">
                                    {productSearch && (
                                        <span className="text-[var(--color-primary)] font-medium">
                                            Local search
                                        </span>
                                    )}
                                </div>
                                {selectedProductIds.length > 0 && (
                                    <div
                                        className={`
                                            rounded-xl
                                            border
                                            p-4
                                            transition-all
                                            ${targetExceeded
                                                ? "border-red-300 bg-red-50"
                                                : targetReached
                                                    ? "border-green-300 bg-green-50"
                                                    : "border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5"
                                            }
                                        `}
                                    >
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-600">
                                                    Products Selected
                                                </p>
                                                <p className="text-xl font-bold text-gray-900 mt-1">
                                                    {selectedProductIds.length}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-gray-600">
                                                    Selected Products Value
                                                </p>
                                                <p
                                                    className={`
                                                        text-xl font-bold mt-1
                                                        ${targetExceeded
                                                            ? "text-red-600"
                                                            : "text-gray-900"
                                                        }
                                                    `}
                                                >
                                                    ₹{selectedProductsTotal.toFixed(2)}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-gray-600">
                                                    Packaging Fee ({packagingPercent}%)
                                                </p>
                                                <p className="text-xl font-bold text-gray-900 mt-1">
                                                    ₹{packagingAmount.toFixed(2)}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-gray-600">
                                                    Package Total
                                                </p>
                                                <p className="text-xl font-bold text-[var(--color-primary)] mt-1">
                                                    ₹{packageTotal.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-gray-200/70">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-xs font-medium text-gray-500">
                                                    Target Price
                                                </p>
                                                <p className="text-lg font-bold text-gray-900">
                                                    ₹{numericTargetPrice.toFixed(2)}
                                                </p>
                                            </div>

                                            <div className="mt-3">
                                                {targetExceeded ? (
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-base leading-none">
                                                            ⚠
                                                        </span>
                                                        <p className="text-sm font-semibold text-red-600">
                                                            Target price exceeded by ₹
                                                            {Math.abs(remainingAmount).toFixed(2)}
                                                        </p>
                                                    </div>
                                                ) : targetReached ? (
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-base leading-none">
                                                            ✓
                                                        </span>
                                                        <p className="text-sm font-semibold text-green-600">
                                                            Target price reached
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm font-medium text-gray-600">
                                                        ₹{remainingAmount.toFixed(2)} remaining to reach target
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}




                                <div className="flex justify-end">
                                    <Button
                                        type="button"
                                        onClick={handleNext}
                                        disabled={
                                            !targetReachedOrExceeded
                                        }
                                        className="w-full sm:w-auto min-w-[150px]"
                                    >
                                        Review Changes
                                    </Button>
                                </div>

                                {(productsLoading ||
                                    loadingCombo) &&
                                    products.length === 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                            {Array.from({
                                                length: 8,
                                            }).map(
                                                (_, index) => (
                                                    <ProductSkeleton
                                                        key={
                                                            index
                                                        }
                                                    />
                                                )
                                            )}
                                        </div>
                                    )}

                                {/* Empty */}

                                {!productsLoading &&
                                    filteredProducts.length ===
                                    0 && (
                                        <div className="py-6">
                                            <EmptyState
                                                title="No products found"
                                                description="Try another product name."
                                            />
                                        </div>
                                    )}


                                {filteredProducts.length > 0 && (
                                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[650px] text-sm">
                                                <thead>
                                                    <tr className="bg-[var(--color-primary)] text-white">
                                                        <th className="px-3 py-3 text-left font-semibold w-[80px]">
                                                            Image
                                                        </th>

                                                        <th className="px-3 py-3 text-left font-semibold">
                                                            Product
                                                        </th>

                                                        <th className="px-3 py-3 text-right font-semibold w-[140px]">
                                                            Price
                                                        </th>

                                                        <th className="px-3 py-3 text-center font-semibold w-[130px]">
                                                            Select
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {filteredProducts.map((product: any) => {
                                                        const selected =
                                                            selectedProductIds.includes(product.id);

                                                        const productPrice =
                                                            getProductPrice(product);

                                                        const productImg =
                                                            getProductImage(product);

                                                        return (
                                                            <tr
                                                                key={product.id}
                                                                onClick={() =>
                                                                    toggleProduct(product.id)
                                                                }
                                                                className={`
                                    cursor-pointer
                                    border-b border-gray-100
                                    transition-colors
                                    ${selected
                                                                        ? "bg-[var(--color-primary)]/5"
                                                                        : "bg-white hover:bg-gray-50"
                                                                    }
                                `}
                                                            >
                                                                <td className="px-3 py-2">
                                                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-50 border border-gray-200">
                                                                        <img
                                                                            src={productImg}
                                                                            alt={
                                                                                product.name ||
                                                                                "Product"
                                                                            }
                                                                            onError={(event) => {
                                                                                event.currentTarget.src =
                                                                                    defaultImage;
                                                                            }}
                                                                            className="w-full h-full object-contain p-1"
                                                                        />
                                                                    </div>
                                                                </td>

                                                                <td className="px-3 py-2">
                                                                    <div className="flex items-center gap-2">
                                                                        {selected && (
                                                                            <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                                                ✓
                                                                            </span>
                                                                        )}

                                                                        <span
                                                                            className={`
                                                font-semibold
                                                ${selected
                                                                                    ? "text-[var(--color-primary)]"
                                                                                    : "text-gray-900"
                                                                                }
                                            `}
                                                                        >
                                                                            {product.name}
                                                                        </span>
                                                                    </div>
                                                                </td>

                                                                <td className="px-3 py-2 text-right">
                                                                    <span className="font-bold text-gray-900">
                                                                        ₹
                                                                        {productPrice.toFixed(2)}
                                                                    </span>
                                                                </td>

                                                                <td className="px-3 py-2 text-center">
                                                                    <span
                                                                        className={`
                                            inline-flex
                                            items-center
                                            justify-center
                                            min-w-[80px]
                                            px-3
                                            py-1.5
                                            rounded-full
                                            text-xs
                                            font-semibold
                                            ${selected
                                                                                ? "bg-[var(--color-primary)] text-white"
                                                                                : "bg-gray-100 text-gray-600"
                                                                            }
                                        `}
                                                                    >
                                                                        {selected
                                                                            ? "Selected"
                                                                            : "Select"}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <div className="space-y-5">

                            <div className="border border-gray-200 rounded-xl p-4 sm:p-5">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <p className="text-base font-semibold text-gray-900">
                                            Review Combo Package
                                        </p>

                                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                            Verify the selected products before updating.
                                        </p>
                                    </div>

                                    <span
                                        className={`
                                            self-start sm:self-auto
                                            text-xs font-semibold
                                            px-3 py-1.5
                                            rounded-full
                                            border
                                            ${targetExceeded
                                                ? "bg-red-50 text-red-700 border-red-200"
                                                : "bg-green-50 text-green-700 border-green-200"
                                            }
                                        `}
                                    >
                                        {targetExceeded
                                            ? "Target Exceeded"
                                            : "Ready to Update"}
                                    </span>
                                </div>
                            </div>

                            {/* Combo Details */}

                            <div className="border border-gray-200 rounded-xl p-4 sm:p-5">
                                <p className="text-sm font-semibold text-gray-900 mb-4">
                                    Combo Details
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

                                    <div className="rounded-lg bg-gray-50 border border-gray-200 p-3.5">
                                        <p className="text-xs text-gray-500">
                                            Combo Name
                                        </p>

                                        <p className="text-sm font-semibold text-gray-900 mt-1 break-words">
                                            {
                                                comboName
                                            }
                                        </p>
                                    </div>

                                    <div className="rounded-lg bg-gray-50 border border-gray-200 p-3.5">
                                        <p className="text-xs text-gray-500">
                                            Target Price
                                        </p>

                                        <p className="text-sm font-semibold text-gray-900 mt-1">
                                            ₹
                                            {numericTargetPrice.toFixed(
                                                2
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Price Summary */}

                            <div
                                className={`
                                    rounded-xl
                                    border
                                    p-4 sm:p-5
                                    ${targetExceeded
                                        ? "border-red-200 bg-red-50"
                                        : "border-green-200 bg-green-50"
                                    }
                                `}
                            >

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                                    {/* Products Selected */}
                                    <div>
                                        <p className="text-xs text-gray-600">
                                            Products Selected
                                        </p>

                                        <p className="text-xl font-bold text-gray-900 mt-1">
                                            {selectedProductIds.length}
                                        </p>
                                    </div>

                                    {/* Product Value */}
                                    <div>
                                        <p className="text-xs text-gray-600">
                                            Product Value
                                        </p>

                                        <p
                                            className={`
                text-xl font-bold mt-1
                ${targetExceeded
                                                    ? "text-red-600"
                                                    : "text-gray-900"
                                                }
            `}
                                        >
                                            ₹{selectedProductsTotal.toFixed(2)}
                                        </p>
                                    </div>

                                    {/* Packaging Fee */}
                                    <div>
                                        <p className="text-xs text-gray-600">
                                            Packaging Fee ({packagingPercent}%)
                                        </p>

                                        <p className="text-xl font-bold text-gray-900 mt-1">
                                            ₹{packagingAmount.toFixed(2)}
                                        </p>
                                    </div>

                                    {/* Final Package Total */}
                                    <div>
                                        <p className="text-xs text-gray-600">
                                            Final Package Total
                                        </p>

                                        <p className="text-xl font-bold text-[var(--color-primary)] mt-1">
                                            ₹{packageTotal.toFixed(2)}
                                        </p>
                                    </div>

                                </div>

                                <div className="mt-4 pt-3 border-t border-gray-200/70">
                                    {targetExceeded ? (
                                        <div className="flex items-start gap-2">
                                            <span className="text-base">
                                                ⚠
                                            </span>

                                            <p className="text-sm font-semibold text-red-600">
                                                Package total exceeds the target by ₹
                                                {Math.abs(
                                                    remainingAmount
                                                ).toFixed(
                                                    2
                                                )}
                                            </p>
                                        </div>
                                    ) : targetExactlyReached ? (
                                        <div className="flex items-start gap-2">
                                            <span className="text-base">
                                                ✓
                                            </span>

                                            <p className="text-sm font-semibold text-green-700">
                                                Package total exactly matches the target price
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-sm font-medium text-gray-600">
                                            Package total has reached the target.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Selected Products */}

                            <div className="border border-gray-200 rounded-xl p-4 sm:p-5">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                                    <div>
                                        <p className="text-sm sm:text-base font-semibold text-gray-900">
                                            Selected Products
                                        </p>
                                    </div>

                                    <span className="self-start sm:self-auto text-xs sm:text-sm font-semibold text-[var(--color-primary)]">
                                        {
                                            selectedProducts.length
                                        }{" "}
                                        products
                                    </span>
                                </div>

                                <div className="space-y-2.5">
                                    {selectedProducts.map(
                                        (
                                            product: any,
                                            index: number
                                        ) => {
                                            const productPrice =
                                                getProductPrice(
                                                    product
                                                );

                                            const productImg =
                                                getProductImage(
                                                    product
                                                );

                                            return (
                                                <div
                                                    key={
                                                        product.id
                                                    }
                                                    className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-gray-200 p-3 sm:p-3.5 bg-white"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0 flex-1">

                                                        <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                                                            {
                                                                index +
                                                                1
                                                            }
                                                        </div>

                                                        <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
                                                            <img
                                                                src={
                                                                    productImg
                                                                }
                                                                alt={
                                                                    product.name ||
                                                                    "Product"
                                                                }
                                                                onError={(
                                                                    event
                                                                ) => {
                                                                    event.currentTarget.src =
                                                                        defaultImage;
                                                                }}
                                                                className="w-full h-full object-contain p-1"
                                                            />
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-medium text-gray-900 break-words">
                                                                {
                                                                    product.name
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="sm:pl-3 sm:text-right">
                                                        <p className="text-sm sm:text-base font-semibold text-[var(--color-primary)]">
                                                            ₹
                                                            {productPrice.toFixed(
                                                                2
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            </div>

                            {/* Actions */}

                            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setStep(1);

                                        window.scrollTo({
                                            top: 0,
                                            behavior: "smooth",
                                        });
                                    }}
                                    className="w-full sm:w-auto"
                                >
                                    ← Back
                                </Button>

                                <Button
                                    type="button"
                                    onClick={
                                        handleUpdateCombo
                                    }
                                    disabled={
                                        updatingCombo
                                    }
                                    className="w-full sm:w-auto min-w-[150px]"
                                >
                                    {updatingCombo
                                        ? "Updating..."
                                        : "Update Combo"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}