import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useMemo, useRef, useState } from "react";
import Button from "../components/ui/Button";
import AddOrderItemModal from "../components/orders/AddOrderItemModal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { adjustOrderApi } from "../services/order.api";
import { useOrdersStore } from "../store/orders.store";
import { useAlert } from "../store/alert.store";
import { calculateOrderAmounts, formatCurrency } from "../utils/pricing";
import { calculateOrderPricingBreakdown } from "../utils/orderPricing";
import { useConfigStore } from "../store/config.store";
import defaultImage from "../assets/default-image.png";
import { calculateCouponDiscount } from "../utils/coupon";
import { sortProductsBySequence } from "../utils/sequncerUtil";

type AdjustOrderItem = {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    discountText?: string;
    originalPrice?: number;
    isComboPackage?: boolean;
    packQuantity?: number;
    packUnit?: string;
    sequenceNumber?: number;
};

export default function AdjustOrder() {
    const navigate = useNavigate();
    const location = useLocation();
    const { orderId } = useParams();
    const { showAlert } = useAlert();
    const clearOrdersCache = useOrdersStore((s) => s.clear);
    const order = location.state?.order;
    const config = useConfigStore((s) => s.config);
    const packagingPercent = config?.packagingPercent ?? 0;
    const gstPercent = config?.gstPercent ?? 0;
    const disableGstForTN = config?.disableGstForTN || false;

    const originalItemsRef = useRef(
        order.items.map((i: any) => ({
            productId: i.productId,
            quantity: i.quantity,
        }))
    );

    const originalItems = originalItemsRef.current;
    const isAdmin = location.state?.isAdmin === true;
    const canAdjust = isAdmin || order.status === "ORDER_PLACED";


    const [items, setItems] = useState<AdjustOrderItem[]>(() =>
        order.items.map((i: any) => ({
            productId: i.productId,
            name: i.name,
            quantity: i.quantity,
            price: i.total / i.quantity,
            image: i.image,
            discountText: i.discountText,
            originalPrice: i.originalPrice,
            isComboPackage: i.isComboPackage,
            packQuantity: i.packQuantity,
            packUnit: i.packUnit,
            sequenceNumber: i.sequenceNumber,
        }))
    );
    const sortedItems = useMemo(
        () => sortProductsBySequence(items),
        [items]
    );

    if (!order) {
        return (
            <div className="py-20 text-center space-y-4 px-4">
                <p className="text-sm text-[var(--color-muted)]">
                    Order details not available.
                </p>

                <Button
                    onClick={() =>
                        navigate(
                            isAdmin ? "/admin/orders" : "/orders"
                        )
                    }
                >
                    {isAdmin ? "Back to Orders" : "Back to My Orders"}
                </Button>
            </div>
        );
    }

    const hasChanges = useMemo(() => {
        if (items.length !== originalItems.length) return true;

        const map = new Map(
            originalItems.map((i: any) => [i.productId, i.quantity])
        );

        for (const item of items) {
            if (!map.has(item.productId)) return true;
            if (map.get(item.productId) !== item.quantity) return true;
        }

        return false;
    }, [items, originalItems]);

    const [showAddItem, setShowAddItem] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [shakeSave, setShakeSave] = useState(false);
    const triggerShake = () => {
        setShakeSave(true);
        setTimeout(() => setShakeSave(false), 400);
    };
    const isEmpty = items.length === 0;
    const pricingBreakdown = useMemo(
        () => calculateOrderPricingBreakdown(items),
        [items]
    );

    const subtotal = pricingBreakdown.productSubtotal;
    const couponCode = order.couponCode ?? null;
    const couponType = order.couponType ?? null;
    const couponValue = Number(order.couponValue ?? 0);

    const derivedState = order?.state ||
        (order?.address?.includes("Tamil Nadu")
            ? "Tamil Nadu"
            : "Other");

    const pricing = useMemo(() => {
        if (!hasChanges) {
            return {
                packagingCharge: order.packagingCharge,
                amountBeforeDiscount: order.amountBeforeDiscount,
                couponDiscount: order.couponDiscount,
                amountAfterDiscount: order.amountAfterDiscount,
                gstAmount: order.gstAmount,
                grandTotal: order.grandTotal,
            };
        }

        const packagingCharge = Math.round(
            (pricingBreakdown.nonComboProductTotal * packagingPercent) / 100
        );
        const amountBeforeDiscount = pricingBreakdown.productSubtotal + packagingCharge;
        const couponDiscount = calculateCouponDiscount({
            amountBeforeDiscount,
            couponType,
            couponValue,
        });

        const {
            gstAmount,
            grandTotal,
        } = calculateOrderAmounts({
            nonComboProductTotal: pricingBreakdown.nonComboProductTotal,
            comboPackageTotal: pricingBreakdown.comboPackageTotal,
            couponDiscount,
            packagingPercent,
            gstPercent,
            state: derivedState,
            config,
        });

        return {
            packagingCharge,
            amountBeforeDiscount,
            couponDiscount,
            amountAfterDiscount: amountBeforeDiscount - couponDiscount,
            gstAmount,
            grandTotal,
        };

    }, [
        hasChanges,
        order,
        pricingBreakdown,
        couponType,
        couponValue,
        packagingPercent,
        gstPercent,
        derivedState,
        config,
    ]);

    const {
        packagingCharge,
        amountBeforeDiscount,
        couponDiscount,
        amountAfterDiscount,
        gstAmount,
        grandTotal,
    } = pricing;

    const walletUsed = Number(order.walletUsed ?? 0);
    const finalPayable = Math.max(
        grandTotal - walletUsed,
        0
    );

    const oldTotal = Number(order.grandTotal || 0);
    const diffAmount = grandTotal - oldTotal;
    const updateQty = (productId: string, delta: number) => {
        if (!canAdjust) return;
        setItems((prev) =>
            prev.map((item) =>
                item.productId === productId
                    ? { ...item, quantity: Math.max(1, item.quantity + delta) }
                    : item
            )
        );
    };

    async function validateMinimumOrder(
        pincode: string,
        amount: number
    ): Promise<{ valid: boolean; message?: string }> {
        try {
            const res = await fetch(
                `https://api.postalpincode.in/pincode/${pincode}`
            );
            const data = await res.json();

            if (!data || data[0].Status !== "Success") {
                return {
                    valid: false,
                    message: "Invalid pincode",
                };
            }

            const state = data[0].PostOffice[0].State;
            let minAmount = config?.otherStateMinOrderValue || 5000;
            if (state === "Tamil Nadu") {
                minAmount = config?.tnMinOrderValue || 3000;
            }

            if (amount < minAmount) {
                return {
                    valid: false,
                    message: `Minimum order for ${state} is ₹${minAmount}`,
                };
            }

            return { valid: true };

        } catch {
            return {
                valid: false,
                message: "Unable to validate pincode",
            };
        }
    }

    const removeItem = (productId: string) => {
        if (!canAdjust) return;
        setItems((prev) =>
            prev.filter((item) => item.productId !== productId)
        );
    };

    const handleAddItem = (newItems: AdjustOrderItem[]) => {
        if (!canAdjust) return;

        setItems((prev) => {
            const map = new Map<string, AdjustOrderItem>();
            prev.forEach((i) => map.set(i.productId, { ...i }));
            newItems.forEach((i) => {
                const existing = map.get(i.productId);
                if (existing) existing.quantity += i.quantity;
                else map.set(i.productId, i);
            });
            const updatedItems = Array.from(map.values());
            return updatedItems;
        });
    };

    async function handleSave() {
        if (!orderId) return;

        const pincode = order?.pincode || order?.address?.match(/\b\d{6}\b/)?.[0];
        const mobile = order.userId || 0;

        if (!pincode) {
            showAlert({
                type: "error",
                message: "Pincode not found for validation",
            });
            return;
        }

        const validation = await validateMinimumOrder(
            pincode,
            grandTotal
        );

        if (!validation.valid) {
            showAlert({
                type: "error",
                message: validation.message || "Minimum order not met",
            });
            return;
        }
        if (saving) return;
        try {
            setSaving(true);
            const updatedOrder = await adjustOrderApi(mobile, orderId, {
                items: items.map(i => ({
                    productId: i.productId,
                    quantity: i.quantity,
                })),
                couponCode,
                walletUsed: order.walletUsed ?? 0,
            });
            showAlert({
                type: "success",
                message: "Order updated successfully",
                duration: 1500,
            });

            clearOrdersCache();

            navigate(
                isAdmin
                    ? `/admin/orders/${orderId}`
                    : `/orders/${orderId}`,
                {
                    replace: true,
                    state: isAdmin
                        ? { forceRefresh: true }
                        : { order: updatedOrder },
                }
            );

        } catch (err: any) {
            showAlert({
                type: "error",
                message: err.message || "Failed to update order",
            });
        } finally {
            setSaving(false);
            setShowSaveConfirm(false);
        }
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">

            <div className="flex items-center gap-3 mb-4">
                <button
                    data-enter-submit="true"
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
                    Adjust Order
                </h1>
            </div>

            <p className="text-sm text-gray-500 mb-2">
                Order ID: <span className="font-medium">{orderId}</span>
            </p>

            {hasChanges && canAdjust && (
                <div className="mb-3 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                    <p className="text-sm text-orange-600 font-medium">
                        You have unsaved changes
                    </p>
                </div>
            )}

            {!canAdjust && (
                <div className="mb-4 rounded-lg bg-gray-100 border p-3">
                    <p className="text-sm text-gray-700">
                        This order has been confirmed and cannot be adjusted.
                    </p>
                </div>
            )}

            <div className="bg-white rounded-2xl border shadow-sm">

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[1100px] table-fixed text-sm">

                        <colgroup>
                            <col className="w-[30%]" />
                            <col className="w-[12%]" />
                            <col className="w-[11%]" />
                            <col className="w-[12%]" />
                            <col className="w-[12%]" />
                            <col className="w-[13%]" />
                            <col className="w-[10%]" />
                        </colgroup>

                        <thead className="bg-gray-50">

                            <tr className="border-b border-gray-200">

                                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                    Product
                                </th>

                                <th className="px-4 py-3 text-center font-semibold text-gray-700">
                                    Unit
                                </th>

                                <th className="px-4 py-3 text-right font-semibold text-gray-700">
                                    MRP
                                </th>

                                <th className="px-4 py-3 text-center font-semibold text-gray-700">
                                    Discount
                                </th>

                                <th className="px-4 py-3 text-right font-semibold text-gray-700">
                                    Offer Price
                                </th>

                                <th className="px-4 py-3 text-center font-semibold text-gray-700">
                                    Qty
                                </th>

                                <th className="px-4 py-3 text-right font-semibold text-gray-700">
                                    Total
                                </th>

                            </tr>

                        </thead>

                        <tbody className="divide-y divide-gray-100">

                            {sortedItems.map((item) => {

                                const packQuantity =
                                    Number(item.packQuantity ?? 0);

                                const packUnit =
                                    item.packUnit?.trim();

                                const hasPack =
                                    packQuantity > 0 &&
                                    Boolean(packUnit);

                                const itemTotal =
                                    Number(item.price ?? 0) *
                                    Number(item.quantity ?? 0);

                                return (
                                    <tr
                                        key={item.productId}
                                        className="
                            align-middle
                            hover:bg-gray-50
                        "
                                    >

                                        {/* Product */}
                                        <td className="px-4 py-3">

                                            <div className="flex min-w-0 items-center gap-3">

                                                <img
                                                    src={
                                                        item.image?.trim() ||
                                                        defaultImage
                                                    }
                                                    alt={item.name}
                                                    onError={(event) => {
                                                        event.currentTarget.onerror =
                                                            null;

                                                        event.currentTarget.src =
                                                            defaultImage;
                                                    }}
                                                    className="
                                        h-12
                                        w-12
                                        shrink-0
                                        rounded-lg
                                        border
                                        border-gray-200
                                        bg-white
                                        object-cover
                                    "
                                                    loading="lazy"
                                                />

                                                <div className="min-w-0">

                                                    <div className="flex items-center gap-2">

                                                        <h3 className="
                                            truncate
                                            text-base
                                            font-semibold
                                            text-[var(--color-primary)]
                                        ">
                                                            {item.name}
                                                        </h3>

                                                        {item.isComboPackage && (
                                                            <span className="
                                                                shrink-0
                                                                rounded-full
                                                                bg-blue-100
                                                                px-2
                                                                py-0.5
                                                                text-[10px]
                                                                font-semibold
                                                                text-blue-700
                                                            ">
                                                                Combo
                                                            </span>
                                                        )}

                                                    </div>

                                                </div>

                                            </div>

                                        </td>

                                        {/* Unit */}
                                        <td className="px-4 py-3 text-center">

                                            {hasPack ? (
                                                <span className="
                                                    inline-flex
                                                    whitespace-nowrap
                                                    rounded-full
                                                    bg-gray-100
                                                    px-2.5
                                                    py-1
                                                    text-xs
                                                    font-medium
                                                    text-gray-700
                                                ">
                                                    {packQuantity}/{packUnit}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">
                                                    -
                                                </span>
                                            )}

                                        </td>

                                        {/* MRP */}
                                        <td className="px-4 py-3 text-right whitespace-nowrap">

                                            {item.originalPrice &&
                                                item.originalPrice > item.price ? (
                                                <span className="
                                                    font-medium
                                                    text-gray-400
                                                    line-through
                                                ">
                                                    ₹{formatCurrency(item.originalPrice)}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">
                                                    ₹{formatCurrency(item.price)}
                                                </span>
                                            )}

                                        </td>

                                        {/* Discount */}
                                        <td className="px-4 py-3 text-center whitespace-nowrap">

                                            {item.discountText ? (
                                                <span className="
                                                    inline-flex
                                                    rounded-full
                                                    bg-green-100
                                                    px-2
                                                    py-0.5
                                                    text-xs
                                                    font-semibold
                                                    text-green-700
                                                ">
                                                    {item.discountText}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">
                                                    NET RATE
                                                </span>
                                            )}

                                        </td>

                                        {/* Offer Price */}
                                        <td className="px-4 py-3 text-right whitespace-nowrap">

                                            <span className="
                                                    font-semibold
                                                    text-[var(--color-primary)]
                                                ">
                                                ₹{formatCurrency(item.price)}
                                            </span>

                                        </td>

                                        {/* Qty */}
                                        <td className="px-4 py-3">

                                            <div className="flex flex-col items-center gap-1">

                                                <div
                                                    className={`
                                                        w-[120px]
                                                        h-[38px]
                                                        flex
                                                        items-center
                                                        justify-between
                                                        px-3
                                                        rounded-lg
                                                        ${canAdjust
                                                            ? "bg-[var(--color-primary)] text-white"
                                                            : "bg-gray-200 text-gray-400"
                                                        }
                                                    `}
                                                >

                                                    <button
                                                        type="button"
                                                        disabled={
                                                            !canAdjust ||
                                                            item.quantity === 1
                                                        }
                                                        onClick={() =>
                                                            updateQty(
                                                                item.productId,
                                                                -1
                                                            )
                                                        }
                                                        className="
                                                            text-lg
                                                            disabled:opacity-40
                                                        "
                                                    >
                                                        −
                                                    </button>

                                                    <span className="font-medium">
                                                        {item.quantity}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        disabled={!canAdjust}
                                                        onClick={() =>
                                                            updateQty(
                                                                item.productId,
                                                                1
                                                            )
                                                        }
                                                        className="
                                                            text-lg
                                                            disabled:opacity-40
                                                        "
                                                    >
                                                        +
                                                    </button>

                                                </div>

                                                <button
                                                    type="button"
                                                    disabled={!canAdjust}
                                                    onClick={() =>
                                                        removeItem(
                                                            item.productId
                                                        )
                                                    }
                                                    className="
                                                        text-xs
                                                        text-red-500
                                                        hover:text-red-600
                                                        disabled:opacity-40
                                                    "
                                                >
                                                    Remove
                                                </button>

                                            </div>

                                        </td>

                                        {/* Total */}
                                        <td className="px-4 py-3 text-right whitespace-nowrap">

                                            <span className="
                                                font-semibold
                                                text-gray-900
                                            ">
                                                ₹{formatCurrency(itemTotal)}
                                            </span>

                                        </td>

                                    </tr>
                                );
                            })}

                        </tbody>

                    </table>

                </div>

                <div className="border-t bg-white p-6">

                    <div className="grid lg:grid-cols-[160px_1fr] gap-8 items-start">

                        {/* Left */}
                        <div>
                            <Button
                                variant="outline"
                                disabled={!canAdjust}
                                onClick={() => setShowAddItem(true)}
                                className="w-full"
                            >
                                + Add Item
                            </Button>
                        </div>

                        <div className="flex-1 flex flex-col items-end gap-5">
                            {/* Summary */}
                            <div className="w-full max-w-[420px] rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm">
                                <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4">
                                    Updated Order Summary
                                </h3>

                                <div className="space-y-2 text-sm">

                                    <div className="flex justify-between">
                                        <span>Products Total</span>
                                        <span>₹{formatCurrency(subtotal)}</span>
                                    </div>

                                    {pricingBreakdown.comboPackageTotal > 0 && (
                                        <div className="flex justify-between items-center text-gray-600">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span>Combo Packages</span>

                                                <span
                                                    className="
                                                        rounded-full
                                                        bg-green-100
                                                        text-green-700
                                                        text-[10px]
                                                        font-medium
                                                        px-2
                                                        py-0.5
                                                    "
                                                >
                                                    Inclusive Of Packaging Charges
                                                </span>
                                            </div>
                                            <span>₹{formatCurrency(pricingBreakdown.comboPackageTotal)}</span>
                                        </div>
                                    )}

                                    {pricingBreakdown.nonComboProductTotal > 0 && (
                                        <div className="flex justify-between text-gray-600">
                                            <span>Non Combo Products</span>
                                            <span>₹{formatCurrency(pricingBreakdown.nonComboProductTotal)}</span>
                                        </div>
                                    )}

                                    {packagingCharge > 0 && (
                                        <div className="flex justify-between text-gray-600">
                                            <span>Packaging Charge ({packagingPercent}%)</span>
                                            <span>₹{formatCurrency(packagingCharge)}</span>
                                        </div>
                                    )}

                                    {couponCode && (
                                        <>
                                            <div className="border-t pt-3 flex justify-between font-medium">
                                                <span>Amount Before Discount</span>
                                                <span>₹{formatCurrency(amountBeforeDiscount)}</span>
                                            </div>

                                            <div className="flex justify-between text-green-600">
                                                <span>
                                                    Coupon Savings{" "}
                                                    {couponType === "PERCENTAGE"
                                                        ? `(${couponValue}%)`
                                                        : `(Flat ₹${couponValue})`}
                                                </span>
                                                <span>-₹{formatCurrency(couponDiscount)}</span>
                                            </div>

                                            <div className="flex justify-between font-medium">
                                                <span>Amount After Discount</span>
                                                <span>₹{formatCurrency(amountAfterDiscount)}</span>
                                            </div>
                                        </>
                                    )}

                                    {gstAmount > 0 && (
                                        <div className="flex justify-between text-gray-600">
                                            <span>GST ({gstPercent}%)</span>
                                            <span>₹{formatCurrency(gstAmount)}</span>
                                        </div>
                                    )}

                                    <div className="border-t my-3" />

                                    <div className="space-y-2">

                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-[var(--color-primary)]">
                                                    Grand Total
                                                </p>

                                                <p className="text-xs text-gray-500">
                                                    {disableGstForTN && derivedState == 'Tamil Nadu'
                                                        ? "Inclusive of Packaging Charges"
                                                        : "Inclusive of GST & Packaging Charges"}
                                                </p>
                                            </div>

                                            <span className="text-2xl font-bold text-[var(--color-primary)]">
                                                <span>₹{formatCurrency(grandTotal)}</span>
                                            </span>
                                        </div>

                                        {walletUsed > 0 && (
                                            <>
                                                <div className="border-t pt-3 flex justify-between text-green-600">
                                                    <span className="font-medium">
                                                        Wallet Applied
                                                    </span>

                                                    <span className="font-semibold">
                                                        -₹{formatCurrency(walletUsed)}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between items-center border-t pt-3">
                                                    <div>
                                                        <p className="font-semibold text-[var(--color-primary)]">
                                                            Amount Payable
                                                        </p>

                                                        <p className="text-xs text-gray-500">
                                                            Amount to be paid
                                                        </p>
                                                    </div>

                                                    <span className="text-2xl font-bold">
                                                        ₹{formatCurrency(finalPayable)}
                                                    </span>
                                                </div>
                                            </>
                                        )}

                                    </div>

                                </div>

                            </div>

                            {/* Save */}
                            <div className="w-full max-w-[420px] flex flex-col items-center gap-2">
                                <div
                                    onClick={() => {
                                        if (!hasChanges && canAdjust && !saving) {
                                            triggerShake();
                                        }
                                    }}
                                    className={shakeSave ? "animate-shake" : ""}
                                >
                                    <Button
                                        disabled={!canAdjust || !hasChanges || isEmpty || saving}
                                        className="w-full py-3 text-base"
                                        onClick={() => setShowSaveConfirm(true)}
                                    >
                                        {saving ? "Saving..." : "Save Changes"}
                                    </Button>
                                </div>

                                {!hasChanges && canAdjust && (
                                    <p className="text-xs text-gray-400">
                                        No changes to save
                                    </p>
                                )}

                            </div>

                        </div>

                    </div>
                </div>

            </div>
            <AddOrderItemModal
                open={showAddItem}
                onClose={() => setShowAddItem(false)}
                onAdd={handleAddItem}
            />

            <ConfirmDialog
                open={showLeaveConfirm}
                title="Discard changes?"
                description="You have unsaved changes. Are you sure?"
                confirmText="Discard"
                cancelText="Stay"
                onConfirm={() => navigate(-1)}
                onCancel={() => setShowLeaveConfirm(false)}
            />

            <ConfirmDialog
                open={showSaveConfirm}
                title="Confirm Order Adjustment"
                message={
                    <div className="space-y-2">

                        <p className="text-sm">
                            Previous Total:
                            <span className="font-semibold">
                                {" "}₹{oldTotal}
                            </span>
                        </p>

                        <p className="text-sm">
                            Updated Total:
                            <span className="font-semibold">
                                {" "}₹{grandTotal}
                            </span>
                        </p>

                        {diffAmount !== 0 && (
                            <p
                                className={`text-sm font-semibold ${diffAmount > 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                    }`}
                            >
                                Difference:
                                {" "}
                                {diffAmount > 0 ? "+" : "-"}₹
                                {Math.abs(diffAmount)}
                            </p>
                        )}

                        <div className="border-t pt-3 space-y-2 text-sm">

                            <div className="flex justify-between">
                                <span>Products Total</span>
                                <span>₹{subtotal}</span>
                            </div>

                            {pricingBreakdown.comboPackageTotal > 0 && (
                                <div className="flex justify-between text-gray-600">
                                    <span>Combo Packages</span>
                                    <span>₹{pricingBreakdown.comboPackageTotal}</span>
                                </div>
                            )}

                            {pricingBreakdown.nonComboProductTotal > 0 && (
                                <div className="flex justify-between text-gray-600">
                                    <span>Non Combo Products</span>
                                    <span>₹{pricingBreakdown.nonComboProductTotal}</span>
                                </div>
                            )}

                            {packagingCharge > 0 && (
                                <div className="flex justify-between text-gray-600">
                                    <span>Packaging Charge ({packagingPercent}%)</span>
                                    <span>₹{packagingCharge}</span>
                                </div>
                            )}

                            {couponCode && (
                                <>
                                    <div className="border-t pt-2 flex justify-between font-medium">
                                        <span>Amount Before Discount</span>
                                        <span>₹{amountBeforeDiscount}</span>
                                    </div>

                                    <div className="flex justify-between text-green-600">
                                        <span>
                                            Coupon Savings{" "}
                                            {couponType === "PERCENTAGE"
                                                ? `(${couponValue}%)`
                                                : `(Flat ₹${couponValue})`}
                                        </span>

                                        <span>-₹{couponDiscount}</span>
                                    </div>

                                    <div className="flex justify-between font-medium">
                                        <span>Amount After Discount</span>
                                        <span>₹{amountAfterDiscount}</span>
                                    </div>
                                </>
                            )}

                            {gstAmount > 0 && (
                                <div className="flex justify-between text-gray-600">
                                    <span>GST ({gstPercent}%)</span>
                                    <span>₹{gstAmount}</span>
                                </div>
                            )}

                            <div className="border-t pt-2 flex justify-between text-lg font-bold">
                                <span>Grand Total</span>
                                <span>₹{grandTotal}</span>
                            </div>

                        </div>
                    </div>
                }
                confirmText="Confirm"
                cancelText="Cancel"
                onConfirm={handleSave}
                onCancel={() => setShowSaveConfirm(false)}
            />
        </div>
    );
}