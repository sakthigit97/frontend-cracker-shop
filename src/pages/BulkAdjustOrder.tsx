import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    ArrowLeft,
    Minus,
    Plus,
    Trash2,
    PackagePlus,
    MapPin,
    ReceiptIndianRupee,
    Save,
    ShoppingBag,
} from "lucide-react";

import {
    useLocation,
    useNavigate,
    useParams,
} from "react-router-dom";

import Button from "../components/ui/Button";
import { useAlert } from "../store/alert.store";
import { useHomeProducts } from "../store/homeProduct.store";
import { useBulkOrderHistoryStore } from "../store/bulkOrderHistory.store";
import defaultImage from "../assets/default-image.png";
import { formatCurrency } from "../utils/pricing";

import type {
    BulkOrderDetailsResponse,
    BulkOrderProduct,
    BulkOrderAddProduct,
    BulkOrderAdjustRequestItem,
    BulkOrderPricing,
} from "../types/bulkOrder";
import { adjustBulkOrder } from "../services/bulkOrder.api";
import BulkAddProductModal from "../components/bulkOrder/BulkAddProductModal";
import {
    useAdminBulkOrderDetailsStore,
} from "../store/adminBulkOrderDetails.store";
import { useAuth } from "../store/auth.store";

interface LocationState {
    order?: BulkOrderDetailsResponse;
    isAdmin?: boolean;
}

interface EditableBulkOrderItem
    extends Omit<BulkOrderProduct, "schemePrice"> {
    schemePrice: number;
    isNew?: boolean;
}


export default function AdjustBulkOrder() {
    const navigate = useNavigate();
    const { orderId } = useParams();
    const location = useLocation();
    const { showAlert } = useAlert();
    const { user } = useAuth();

    const locationState = location.state as LocationState | null;
    const passedOrder = locationState?.order;
    const isAdmin = user?.role === "ADMIN";
    const isStaff = user?.role === "STAFF";
    const isAdminOrStaff = isAdmin || isStaff;

    const [
        showAddProductModal,
        setShowAddProductModal,
    ] = useState(false);

    const {
        order: userOrder,
        fetchingOrder: userFetchingOrder,
        fetchOrder: fetchUserOrder,
        applyAdjustedOrder,
    } = useBulkOrderHistoryStore();

    const {
        cache: adminOrderCache,
        loading: adminFetchingOrder,
        fetchOrder: fetchAdminOrder,
        applyAdjustedOrder: applyAdminAdjustedOrder,
    } = useAdminBulkOrderDetailsStore();

    const {
        products: homeProducts,
        fetchAll: fetchAllProducts,
        loading: productsLoading,
    } = useHomeProducts();

    const availableProducts = useMemo<BulkOrderAddProduct[]>(() => {
        const result: BulkOrderAddProduct[] = [];

        for (const product of homeProducts) {
            const source = product as typeof product & {
                productId?: string;
                bulkOrderBasePrice?: number;
                cartonQty?: number;
                unitPrice?: number;
                schemePrice?: number;
                brandName?: string;
                brand?: string;
                image?: string;
                images?: string[];
            };

            const productId = String(
                source.productId ?? product.id ?? ""
            ).trim();

            const name = product.name?.trim();

            const bulkOrderBasePrice = Number(
                source.bulkOrderBasePrice ?? 0
            );

            const cartonQty = Number(
                source.cartonQty ?? 0
            );

            if (
                !productId ||
                !name ||
                source.isBulkOrderOnly !== true ||
                !Number.isFinite(bulkOrderBasePrice) ||
                bulkOrderBasePrice <= 0 ||
                !Number.isFinite(cartonQty) ||
                cartonQty <= 0
            ) {
                continue;
            }

            const unitPrice = Number(
                source.unitPrice ?? bulkOrderBasePrice
            );

            const schemePrice = Number(
                source.schemePrice ?? unitPrice
            );

            result.push({
                productId,
                name,
                image:
                    source.image ??
                    source.images?.[0],
                brand:
                    source.brandName ??
                    source.brand,
                categoryId:
                    product.categoryId,
                bulkOrderBasePrice,
                cartonQty,
                unitPrice: Number.isFinite(unitPrice)
                    ? unitPrice
                    : bulkOrderBasePrice,
                schemePrice: Number.isFinite(schemePrice)
                    ? schemePrice
                    : bulkOrderBasePrice,
            });
        }

        return result;
    }, [homeProducts]);

    const currentOrder = isAdminOrStaff
        ? adminOrderCache[orderId ?? ""]
        : userOrder ?? passedOrder;

    const [items, setItems] =
        useState<EditableBulkOrderItem[]>(
            () =>
                (passedOrder?.items ?? []).map(
                    mapOrderItem
                )
        );

    const [saving, setSaving] = useState(false);
    const [savedPricing, setSavedPricing] = useState<BulkOrderPricing | null>(null);
    const [initialisedOrderId, setInitialisedOrderId] = useState<string | null>(null);

    useEffect(() => {
        if (!orderId) {
            return;
        }

        if (isAdminOrStaff) {
            if (
                !adminOrderCache[orderId] &&
                !adminFetchingOrder
            ) {
                fetchAdminOrder(orderId);
            }

            return;
        }

        if (
            !userOrder ||
            userOrder.orderId !== orderId
        ) {
            if (!userFetchingOrder) {
                fetchUserOrder(orderId);
            }
        }
    }, [
        orderId,
        isAdmin,
        adminOrderCache,
        adminFetchingOrder,
        fetchAdminOrder,
        userOrder,
        userFetchingOrder,
        fetchUserOrder,
    ]);

    useEffect(() => {
        if (!currentOrder) {
            return;
        }

        if (
            initialisedOrderId ===
            currentOrder.orderId
        ) {
            return;
        }

        setInitialisedOrderId(
            currentOrder.orderId
        );

        setSavedPricing(null);
        setItems(
            currentOrder.items.map(
                mapOrderItem
            )
        );
    }, [
        currentOrder,
        initialisedOrderId,
    ]);

    const canAdjust =
        !!currentOrder &&
        currentOrder.status !== "PACKED" &&
        currentOrder.status !== "CANCELLED";

    const orderDetailsPath = isAdmin
        ? `/admin/bulk-orders/${currentOrder?.orderId}`
        : isStaff
            ? `/staff/bulk-orders/${currentOrder?.orderId}`
            : `/bulk-orders/${currentOrder?.orderId}`;

    const calculatedItems =
        useMemo(() => {
            return items.map((item) => ({
                ...item,
                total:
                    item.unitPrice *
                    item.cartonQty *
                    item.quantity,
            }));
        }, [items]);


    const productTotal =
        useMemo(() => {
            return calculatedItems.reduce(
                (sum, item) =>
                    sum + item.total,
                0
            );
        }, [calculatedItems]);

    const pricingSource =
        savedPricing ??
        currentOrder?.pricing;

    const packagingPercent =
        pricingSource?.packagingPercent ?? 0;

    const gstPercent =
        pricingSource?.gstPercent ?? 0;

    const previewPackagingCharge =
        Math.round(
            (productTotal * packagingPercent) / 100
        );

    const previewGstPercent =
        gstPercent / 2;

    const previewGstAmount =
        Math.round(
            (
                (productTotal +
                    previewPackagingCharge) *
                previewGstPercent
            ) / 100
        );

    const previewGrandTotal =
        productTotal +
        previewPackagingCharge +
        previewGstAmount;

    const totalCartons = useMemo(() => {
        return calculatedItems.reduce(
            (sum, item) => sum + item.quantity,
            0
        );
    }, [calculatedItems]);

    const hasProductChanges = useMemo(() => {
        if (!currentOrder) {
            return false;
        }

        if (
            items.length !==
            currentOrder.items.length
        ) {
            return true;
        }

        return items.some((item) => {
            const originalItem =
                currentOrder.items.find(
                    (original: any) =>
                        original.productId ===
                        item.productId
                );

            if (!originalItem) {
                return true;
            }

            return (
                originalItem.quantity !==
                item.quantity ||
                originalItem.cartonQty !==
                item.cartonQty
            );
        });
    }, [
        currentOrder,
        items,
    ]);


    function updateQuantity(
        productId: string,
        delta: number
    ) {
        setItems((current) =>
            current.map((item) => {
                if (
                    item.productId !==
                    productId
                ) {
                    return item;
                }

                const nextQuantity =
                    item.quantity + delta;

                if (nextQuantity < 1) {
                    return item;
                }

                return {
                    ...item,
                    quantity:
                        nextQuantity,
                };
            })
        );
    }


    function setQuantity(
        productId: string,
        value: number
    ) {
        if (
            !Number.isFinite(value) ||
            value < 1
        ) {
            return;
        }

        setItems((current) =>
            current.map((item) =>
                item.productId ===
                    productId
                    ? {
                        ...item,
                        quantity:
                            Math.floor(
                                value
                            ),
                    }
                    : item
            )
        );
    }


    function removeItem(
        productId: string
    ) {
        setItems((current) =>
            current.filter(
                (item) =>
                    item.productId !==
                    productId
            )
        );
    }


    function updateCartonQty(
        productId: string,
        value: number
    ) {
        if (!isAdminOrStaff) {
            return;
        }

        if (
            !Number.isFinite(value) ||
            value < 1
        ) {
            return;
        }

        setItems((current) =>
            current.map((item) =>
                item.productId ===
                    productId
                    ? {
                        ...item,
                        cartonQty:
                            Math.floor(
                                value
                            ),
                    }
                    : item
            )
        );
    }
    async function handleAddProduct() {
        setShowAddProductModal(true);

        try {
            await fetchAllProducts();
        } catch (error) {
            console.error(
                "Failed to load products for bulk order adjustment.",
                error
            );

            showAlert({
                type: "error",
                message:
                    "Unable to load products. Please try again.",
            });
        }
    }

    function handleProductAdd(
        product: BulkOrderAddProduct
    ) {
        setItems((current) => {
            const alreadyExists = current.some(
                (item) =>
                    item.productId ===
                    product.productId
            );

            if (alreadyExists) {
                return current;
            }

            const newItem: EditableBulkOrderItem = {
                productId: product.productId,
                name: product.name,
                image: product.image,
                brand: product.brand,
                categoryId: product.categoryId,
                bulkOrderBasePrice: product.bulkOrderBasePrice,
                cartonQty: product.cartonQty,
                unitPrice: product.unitPrice,
                schemePrice: product.schemePrice ??
                    product.unitPrice,
                quantity: 1,
                total:
                    product.unitPrice *
                    product.cartonQty,
                isNew: true,
            };

            return [...current, newItem];
        });

        setShowAddProductModal(false);
    }

    async function handleSave() {
        if (saving) {
            return;
        }

        if (!currentOrder) {
            showAlert({
                type: "error",
                message:
                    "Bulk order could not be loaded.",
            });

            return;
        }

        if (!canAdjust) {
            showAlert({
                type: "error",
                message:
                    "This order can no longer be adjusted.",
            });

            return;
        }

        if (!hasProductChanges) {
            return;
        }

        if (calculatedItems.length === 0) {
            showAlert({
                type: "error",
                message:
                    "Please keep at least one product in the order.",
            });

            return;
        }

        for (const item of calculatedItems) {
            if (
                !Number.isInteger(item.quantity) ||
                item.quantity < 1
            ) {
                showAlert({
                    type: "error",
                    message:
                        `Invalid quantity for ${item.name}.`,
                });

                return;
            }

            if (
                !Number.isInteger(item.cartonQty) ||
                item.cartonQty < 1
            ) {
                showAlert({
                    type: "error",
                    message:
                        `Invalid carton quantity for ${item.name}.`,
                });

                return;
            }
        }

        const items: BulkOrderAdjustRequestItem[] =
            calculatedItems.map((item) => ({
                productId:
                    item.productId,

                quantity:
                    item.quantity,

                ...(isAdmin
                    ? {
                        cartonQty:
                            item.cartonQty,
                    }
                    : {}),
            }));

        setSaving(true);

        try {
            const result = await adjustBulkOrder(
                currentOrder.orderId,
                items
            );

            setItems(
                result.items.map(mapOrderItem)
            );

            setSavedPricing(
                result.pricing
            );

            if (isAdmin) {
                applyAdminAdjustedOrder({
                    orderId: result.orderId,
                    items: result.items,
                    pricing: result.pricing,
                });
            } else {
                applyAdjustedOrder({
                    orderId: result.orderId,
                    items: result.items,
                    pricing: result.pricing,
                });
            }

            showAlert({
                type: "success",
                message: "Bulk order updated successfully.",
            });
            navigate(
                orderDetailsPath,
                {
                    replace: true,
                }
            );
        } catch (error: any) {
            console.error(
                "Failed to adjust bulk order.",
                error
            );

            showAlert({
                type: "error",
                message:
                    error?.message ||
                    "Failed to update bulk order. Please try again.",
            });
        } finally {
            setSaving(false);
        }
    }
    const isFetchingOrder =
        isAdmin
            ? adminFetchingOrder
            : userFetchingOrder;

    if (
        isFetchingOrder &&
        !currentOrder
    ) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-10">
                <div className="animate-pulse space-y-5">
                    <div className="h-8 w-48 rounded-lg bg-gray-200" />

                    <div className="h-24 rounded-2xl bg-gray-200" />

                    <div className="h-80 rounded-2xl bg-gray-200" />
                </div>
            </div>
        );
    }


    if (
        !isFetchingOrder &&
        !currentOrder
    ) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-16">
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">

                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                        <ShoppingBag
                            size={26}
                            className="text-gray-500"
                        />
                    </div>

                    <h2 className="mt-4 text-xl font-semibold text-gray-900">
                        Bulk Order Not Found
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                        We could not find the bulk order you
                        are trying to adjust.
                    </p>

                    <div className="mt-6">
                        <Button
                            onClick={() =>
                                navigate(
                                    "/bulk-orders"
                                )
                            }
                        >
                            Back to Bulk Orders
                        </Button>
                    </div>

                </div>
            </div>
        );
    }


    /*
     * TypeScript guard.
     */
    if (!currentOrder) {
        return null;
    }


    /*
     * --------------------------------------------------
     * Order cannot be adjusted
     * --------------------------------------------------
     */

    if (!canAdjust) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-10">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">

                    <h2 className="text-lg font-semibold text-amber-900">
                        Order cannot be adjusted
                    </h2>

                    <p className="mt-2 text-sm text-amber-800">
                        This bulk order can no longer be
                        modified because it has already moved
                        beyond the adjustment stage.
                    </p>

                    <div className="mt-5">
                        <Button
                            variant="secondary"
                            onClick={() =>
                                navigate(
                                    orderDetailsPath
                                )
                            }
                        >
                            Back to Order
                        </Button>
                    </div>

                </div>
            </div>
        );
    }


    /*
     * --------------------------------------------------
     * Render
     * --------------------------------------------------
     */

    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-7">

            {/* Header */}
            <div className="mb-5 flex items-center gap-3">

                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            orderDetailsPath
                        )
                    }
                    className="
                        flex h-9 w-9 shrink-0
                        items-center justify-center
                        rounded-full
                        bg-[var(--color-primary)]
                        text-white
                        shadow-sm
                        transition
                        hover:scale-105
                        active:scale-95
                    "
                    aria-label="Back"
                >
                    <ArrowLeft size={18} />
                </button>


                <div className="min-w-0">
                    <h1 className="truncate text-xl font-semibold text-gray-900 sm:text-2xl">
                        Adjust Bulk Order
                    </h1>

                    <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                        Order ID:{" "}
                        <span className="font-medium text-gray-700">
                            {currentOrder.orderId}
                        </span>
                    </p>
                </div>


                {isAdmin && (
                    <span className="ml-auto shrink-0 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                        Admin
                    </span>
                )}

            </div>


            {/* Info */}
            <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <div className="flex items-start gap-3">

                    <PackagePlus
                        size={20}
                        className="mt-0.5 shrink-0 text-blue-700"
                    />

                    <div className="min-w-0">

                        <p className="text-sm font-semibold text-blue-900">
                            {isAdmin
                                ? "Admin adjustment"
                                : "You can adjust your bulk order"}
                        </p>

                        <p className="mt-0.5 text-xs leading-5 text-blue-700 sm:text-sm">
                            {isAdmin
                                ? "You can change quantities, remove or add products, and update carton quantities."
                                : "You can change quantities, remove existing products, or add new products."}
                        </p>

                    </div>
                </div>
            </div>


            {/* Main layout */}
            <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">

                {/* Products */}
                <section className="min-w-0 rounded-2xl border border-gray-200 bg-white shadow-sm">

                    <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-4 sm:px-5">

                        <div className="min-w-0">

                            <div className="flex items-center gap-2">

                                <ShoppingBag
                                    size={19}
                                    className="shrink-0 text-[var(--color-primary)]"
                                />

                                <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
                                    Products
                                </h2>

                            </div>

                            <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                                {calculatedItems.length}{" "}
                                {calculatedItems.length === 1
                                    ? "product"
                                    : "products"}
                            </p>

                        </div>


                        <button
                            type="button"
                            onClick={
                                handleAddProduct
                            }
                            className="
                                flex shrink-0
                                items-center gap-1.5
                                rounded-lg
                                border border-[var(--color-primary)]
                                px-3 py-2
                                text-xs font-semibold
                                text-[var(--color-primary)]
                                transition
                                hover:bg-[var(--color-primary)]
                                hover:text-white
                                sm:px-4
                                sm:text-sm
                            "
                        >
                            <Plus size={16} />

                            <span>
                                Add Product
                            </span>
                        </button>

                    </div>


                    {calculatedItems.length === 0 ? (
                        <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">

                            <PackagePlus
                                size={42}
                                className="text-gray-300"
                            />

                            <h3 className="mt-3 text-base font-semibold text-gray-800">
                                No products
                            </h3>

                            <p className="mt-1 max-w-sm text-sm text-gray-500">
                                Add at least one product
                                before saving the order.
                            </p>

                            <button
                                type="button"
                                onClick={
                                    handleAddProduct
                                }
                                className="mt-4 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white"
                            >
                                Add Product
                            </button>

                        </div>
                    ) : (
                        <div>
                            <div className="overflow-hidden">
                                {/* Desktop table header */}
                                <div className="hidden grid-cols-[minmax(180px,1fr)_130px_120px_100px_130px] items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:grid sm:px-5">
                                    <span>Product</span>
                                    <span className="text-center">Carton</span>
                                    <span className="text-center">Carton Content</span>
                                    <span className="text-center">Price</span>
                                    <span className="text-right">Total</span>
                                </div>
                                {calculatedItems.map(
                                    (item) => (
                                        <BulkOrderItemRow
                                            key={
                                                item.productId
                                            }
                                            item={item}
                                            isAdminOrStaff={isAdminOrStaff}
                                            onIncrease={() =>
                                                updateQuantity(
                                                    item.productId,
                                                    1
                                                )
                                            }
                                            onDecrease={() =>
                                                updateQuantity(
                                                    item.productId,
                                                    -1
                                                )
                                            }
                                            onQuantityChange={(
                                                value
                                            ) =>
                                                setQuantity(
                                                    item.productId,
                                                    value
                                                )
                                            }
                                            onCartonQtyChange={(
                                                value
                                            ) =>
                                                updateCartonQty(
                                                    item.productId,
                                                    value
                                                )
                                            }
                                            onRemove={() =>
                                                removeItem(
                                                    item.productId
                                                )
                                            }
                                        />
                                    )
                                )}

                            </div>

                        </div>
                    )}

                </section>


                {/* Right side */}
                <div className="space-y-5">

                    {/* Pricing */}
                    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">

                        <div className="border-b border-gray-200 px-4 py-4 sm:px-5">

                            <div className="flex items-center gap-2">

                                <ReceiptIndianRupee
                                    size={19}
                                    className="text-[var(--color-primary)]"
                                />

                                <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
                                    Pricing Summary
                                </h2>

                            </div>

                        </div>


                        <div className="space-y-3 px-4 py-4 sm:px-5">

                            <SummaryRow
                                label="Products Total"
                                value={
                                    productTotal
                                }
                            />

                            <SummaryRow
                                isnotPrice={true}
                                label="Cartonbox Total"
                                value={
                                    totalCartons
                                }
                            />

                            {packagingPercent > 0 && (
                                <SummaryRow
                                    label={`Packaging (${packagingPercent}%)`}
                                    value={previewPackagingCharge}
                                    muted
                                />
                            )}


                            {gstPercent > 0 && (
                                <SummaryRow
                                    label={`GST (${gstPercent}%)`}
                                    value={previewGstAmount}
                                    muted
                                />
                            )}


                            <div className="border-t border-dashed border-gray-300 pt-3">

                                <div className="flex items-center justify-between gap-3">

                                    <span className="font-semibold text-gray-900">
                                        Current Grand Total
                                    </span>

                                    <span className="whitespace-nowrap text-xl font-bold text-[var(--color-primary)]">
                                        ₹
                                        {formatCurrency(
                                            previewGrandTotal
                                        )}
                                    </span>

                                </div>

                            </div>


                            {hasProductChanges && (
                                <div className="rounded-lg bg-amber-50 px-3 py-2">

                                    <p className="text-xs leading-5 text-amber-800">
                                        Product changes detected.
                                    </p>

                                </div>
                            )}

                        </div>

                    </section>


                    {/* Address */}
                    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">

                        <div className="border-b border-gray-200 px-4 py-4 sm:px-5">

                            <div className="flex items-center gap-2">

                                <MapPin
                                    size={19}
                                    className="text-[var(--color-primary)]"
                                />

                                <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
                                    Delivery Address
                                </h2>

                            </div>

                        </div>


                        <div className="px-4 py-4 sm:px-5">

                            <p className="text-sm font-semibold text-gray-900">
                                {
                                    currentOrder
                                        .address
                                        .fullName
                                }
                            </p>


                            <p className="mt-1 text-sm leading-5 text-gray-600">

                                {
                                    currentOrder
                                        .address
                                        .addressLine1
                                }

                                {currentOrder
                                    .address
                                    .addressLine2 && (
                                        <>
                                            <br />

                                            {
                                                currentOrder
                                                    .address
                                                    .addressLine2
                                            }
                                        </>
                                    )}

                                <br />

                                {
                                    currentOrder
                                        .address
                                        .city
                                }
                                ,{" "}
                                {
                                    currentOrder
                                        .address
                                        .state
                                }{" "}
                                -{" "}
                                {
                                    currentOrder
                                        .address
                                        .pincode
                                }

                            </p>


                            <p className="mt-2 text-sm font-medium text-gray-700">
                                {
                                    currentOrder
                                        .address
                                        .mobile
                                }
                            </p>

                        </div>

                    </section>


                    {/* Actions */}
                    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">

                        <div className="flex flex-col gap-3">

                            <Button
                                onClick={
                                    handleSave
                                }
                                disabled={
                                    saving ||
                                    !hasProductChanges ||
                                    calculatedItems.length === 0
                                }
                            >
                                <span className="flex items-center justify-center gap-2">

                                    <Save
                                        size={18}
                                    />

                                    {saving
                                        ? "Saving..."
                                        : "Save Changes"}

                                </span>
                            </Button>


                            <Button
                                variant="secondary"
                                onClick={() =>
                                    navigate(
                                        orderDetailsPath
                                    )
                                }
                                disabled={
                                    saving
                                }
                            >
                                Cancel
                            </Button>

                        </div>

                    </section>

                </div>

            </div>

            <BulkAddProductModal
                open={showAddProductModal}
                products={availableProducts}
                existingProductIds={items.map(
                    (item) => item.productId
                )}
                loading={productsLoading}
                onClose={() =>
                    setShowAddProductModal(false)
                }
                onAdd={handleProductAdd}
            />
        </div>
    );
}


/*
 * ------------------------------------------------------
 * Product Row
 * ------------------------------------------------------
 */

interface BulkOrderItemRowProps {
    item: EditableBulkOrderItem;
    isAdminOrStaff: boolean;
    onIncrease: () => void;
    onDecrease: () => void;

    onQuantityChange: (value: number) => void;

    onCartonQtyChange: (value: number) => void;

    onRemove: () => void;
}

function BulkOrderItemRow({
    item,
    isAdminOrStaff,
    onIncrease,
    onDecrease,
    onQuantityChange,
    onCartonQtyChange,
    onRemove,
}: BulkOrderItemRowProps) {
    const packUnit =
        (item as EditableBulkOrderItem & {
            packUnit?: string;
        }).packUnit || "";

    return (
        <div className="border-b border-gray-100 last:border-b-0">

            {/* Desktop / Tablet */}
            <div className="hidden grid-cols-[minmax(180px,1fr)_130px_120px_100px_130px] items-center gap-3 px-4 py-4 sm:grid sm:px-5">
                {/* Product */}
                <div className="flex min-w-0 items-center gap-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                        <img
                            src={item.image || defaultImage}
                            alt={item.name}
                            className="h-full w-full object-contain"
                            onError={(event) => {
                                event.currentTarget.src =
                                    defaultImage;
                            }}
                        />
                    </div>

                    <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-gray-900">
                            {item.name}
                        </h3>
                    </div>
                </div>

                {/* Carton / Quantity */}
                <div className="flex justify-center">
                    <div className="flex items-center rounded-lg border border-gray-300 bg-white">

                        <button
                            type="button"
                            onClick={onDecrease}
                            disabled={item.quantity <= 1}
                            className="
                                flex h-9 w-9 items-center justify-center
                                text-gray-600 transition
                                hover:bg-gray-50
                                disabled:cursor-not-allowed
                                disabled:opacity-40
                            "
                            aria-label="Decrease quantity"
                        >
                            <Minus size={15} />
                        </button>

                        <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(event) =>
                                onQuantityChange(
                                    Number(event.target.value)
                                )
                            }
                            className="
                                h-9 w-14
                                border-x border-gray-300
                                text-center text-sm font-semibold
                                outline-none
                            "
                        />

                        <button
                            type="button"
                            onClick={onIncrease}
                            className="
                                flex h-9 w-9 items-center justify-center
                                text-gray-600 transition
                                hover:bg-gray-50
                            "
                            aria-label="Increase quantity"
                        >
                            <Plus size={15} />
                        </button>
                    </div>
                </div>

                {/* Carton Content */}
                <div className="text-center">
                    {isAdminOrStaff ? (
                        <input
                            type="number"
                            min={1}
                            value={item.cartonQty}
                            onChange={(event) =>
                                onCartonQtyChange(
                                    Number(event.target.value)
                                )
                            }
                            className="
                                h-9 w-20 rounded-lg
                                border border-gray-300
                                bg-white px-2
                                text-center text-sm font-medium
                                outline-none
                                focus:border-[var(--color-primary)]
                                focus:ring-2
                                focus:ring-[var(--color-primary)]/10
                            "
                            aria-label={`Carton content for ${item.name}`}
                        />
                    ) : (
                        <span className="text-sm font-medium text-gray-700">
                            {item.cartonQty}/{packUnit}
                        </span>
                    )}
                </div>

                {/* Price */}
                <div className="text-center">
                    <span className="text-sm font-semibold text-gray-800">
                        ₹{formatCurrency(item.unitPrice)}
                    </span>
                </div>

                {/* Total */}
                <div className="flex items-center justify-end gap-2">
                    <div className="text-right">
                        <p className="text-[11px] text-gray-500">
                            Item Total
                        </p>

                        <p className="whitespace-nowrap text-base font-bold text-[var(--color-primary)]">
                            ₹{formatCurrency(item.total)}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onRemove}
                        className="
                            rounded-lg p-2
                            text-gray-400 transition
                            hover:bg-red-50
                            hover:text-red-600
                        "
                        aria-label={`Remove ${item.name}`}
                    >
                        <Trash2 size={17} />
                    </button>
                </div>
            </div>

            {/* Mobile */}
            <div className="p-4 sm:hidden">

                <div className="flex gap-3">

                    {/* Image */}
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                        <img
                            src={item.image || defaultImage}
                            alt={item.name}
                            className="h-full w-full object-contain"
                            onError={(event) => {
                                event.currentTarget.src =
                                    defaultImage;
                            }}
                        />
                    </div>

                    {/* Name + Remove */}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">

                            <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-gray-900">
                                {item.name}
                            </h3>

                            <button
                                type="button"
                                onClick={onRemove}
                                className="
                                    shrink-0 rounded-lg p-1.5
                                    text-gray-400
                                    hover:bg-red-50
                                    hover:text-red-600
                                "
                                aria-label={`Remove ${item.name}`}
                            >
                                <Trash2 size={17} />
                            </button>

                        </div>

                        {item.brand && (
                            <p className="mt-0.5 truncate text-xs text-gray-500">
                                {item.brand}
                            </p>
                        )}
                    </div>
                </div>

                {/* Mobile details */}
                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">

                    {/* Carton */}
                    <div>
                        <p className="text-xs text-gray-500">
                            Carton
                        </p>

                        <div className="mt-1 flex items-center rounded-lg border border-gray-300 w-fit">

                            <button
                                type="button"
                                onClick={onDecrease}
                                disabled={item.quantity <= 1}
                                className="
                                    flex h-8 w-8 items-center
                                    justify-center text-gray-600
                                    disabled:opacity-40
                                "
                                aria-label="Decrease quantity"
                            >
                                <Minus size={14} />
                            </button>

                            <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(event) =>
                                    onQuantityChange(
                                        Number(event.target.value)
                                    )
                                }
                                className="
                                    h-8 w-12
                                    border-x border-gray-300
                                    text-center text-sm font-semibold
                                    outline-none
                                "
                            />

                            <button
                                type="button"
                                onClick={onIncrease}
                                className="
                                    flex h-8 w-8 items-center
                                    justify-center text-gray-600
                                "
                                aria-label="Increase quantity"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Carton Content */}
                    <div>
                        <p className="text-xs text-gray-500">
                            Carton Content
                        </p>

                        {isAdminOrStaff ? (
                            <input
                                type="number"
                                min={1}
                                value={item.cartonQty}
                                onChange={(event) =>
                                    onCartonQtyChange(
                                        Number(event.target.value)
                                    )
                                }
                                className="
                                    mt-1 h-8 w-20 rounded-lg
                                    border border-gray-300
                                    px-2 text-center text-sm
                                    font-medium outline-none
                                "
                            />
                        ) : (
                            <p className="mt-1 text-sm font-semibold text-gray-800">
                                {item.cartonQty}/{packUnit}
                            </p>
                        )}
                    </div>

                    {/* Price */}
                    <div>
                        <p className="text-xs text-gray-500">
                            Price
                        </p>

                        <p className="mt-1 text-sm font-semibold text-gray-800">
                            ₹{formatCurrency(item.unitPrice)}
                        </p>
                    </div>

                    {/* Total */}
                    <div className="text-right">
                        <p className="text-xs text-gray-500">
                            Total
                        </p>

                        <p className="mt-1 text-base font-bold text-[var(--color-primary)]">
                            ₹{formatCurrency(item.total)}
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}

function mapOrderItem(
    item: BulkOrderProduct
): EditableBulkOrderItem {
    return {
        productId:
            item.productId,

        name:
            item.name,

        image:
            item.image,

        brand:
            item.brand,

        categoryId:
            item.categoryId,

        bulkOrderBasePrice:
            item.bulkOrderBasePrice,

        cartonQty:
            item.cartonQty,

        unitPrice:
            item.unitPrice,

        schemePrice:
            item.schemePrice ??
            item.unitPrice,

        quantity:
            item.quantity,

        total:
            item.total,
    };
}


/*
 * ------------------------------------------------------
 * Summary Row
 * ------------------------------------------------------
 */

interface SummaryRowProps {
    isnotPrice?: boolean;
    label: string;
    value: number;
    muted?: boolean;
}


function SummaryRow({
    isnotPrice = false,
    label,
    value,
    muted = false,
}: SummaryRowProps) {
    return (
        <div className="flex items-center justify-between gap-3">

            <span
                className={
                    muted
                        ? "text-sm text-gray-500"
                        : "text-sm font-medium text-gray-700"
                }
            >
                {label}
            </span>


            <span
                className={
                    muted
                        ? "whitespace-nowrap text-sm font-medium text-gray-700"
                        : "whitespace-nowrap text-sm font-semibold text-gray-900"
                }
            >
                {!isnotPrice ? "₹" : ""}
                {formatCurrency(value)}
            </span>

        </div>
    );
}