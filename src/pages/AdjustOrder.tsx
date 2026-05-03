import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useMemo, useRef, useState } from "react";
import Button from "../components/ui/Button";
import AddOrderItemModal from "../components/orders/AddOrderItemModal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { adjustOrderApi } from "../services/order.api";
import { useOrdersStore } from "../store/orders.store";
import { useAlert } from "../store/alert.store";
import { calculateOrderAmounts } from "../utils/pricing";
import { useConfigStore } from "../store/config.store";

type AdjustOrderItem = {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    discountText?: string;
    originalPrice?: number;
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
            originalPrice: i.originalPrice
        }))
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
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [shakeSave, setShakeSave] = useState(false);
    const triggerShake = () => {
        setShakeSave(true);
        setTimeout(() => setShakeSave(false), 400);
    };
    const isEmpty = items.length === 0;
    const subtotal = useMemo(
        () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        [items]
    );
    const derivedState = order?.state || (order?.address?.includes("Tamil Nadu") ? "Tamil Nadu" : "Other");
    const { packagingCharge, gstAmount, grandTotal } = useMemo(
        () =>

            calculateOrderAmounts({
                totalAmount: subtotal,
                packagingPercent,
                gstPercent,
                state: derivedState,
                config,
            }),
        [subtotal, packagingPercent, gstPercent, config]
    );
    const oldTotal = useMemo(
        () =>
            order.items.reduce(
                (sum: number, i: any) => sum + i.total,
                0
            ),
        [order.items]
    );

    const diffAmount = grandTotal - oldTotal;
    const updateQty = (productId: string, delta: number) => {
        if (!canAdjust) return;
        setDirty(true);

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
        setDirty(true);
        setItems((prev) =>
            prev.filter((item) => item.productId !== productId)
        );
    };

    const handleAddItem = (newItems: AdjustOrderItem[]) => {
        if (!canAdjust) return;
        setDirty(true);

        setItems((prev) => {
            const map = new Map<string, AdjustOrderItem>();
            prev.forEach((i) => map.set(i.productId, { ...i }));

            newItems.forEach((i) => {
                const existing = map.get(i.productId);
                if (existing) existing.quantity += i.quantity;
                else map.set(i.productId, i);
            });

            return Array.from(map.values());
        });
    };

    async function handleSave() {
        if (!orderId) return;

        const pincode =
            order?.pincode ||
            order?.address?.match(/\b\d{6}\b/)?.[0];

        if (!pincode) {
            showAlert({
                type: "error",
                message: "Pincode not found for validation",
            });
            return;
        }

        const validation = await validateMinimumOrder(
            pincode,
            subtotal
        );

        if (!validation.valid) {
            showAlert({
                type: "error",
                message: validation.message || "Minimum order not met",
            });
            return;
        }

        try {
            setSaving(true);

            const updatedOrder = await adjustOrderApi(
                orderId,
                items.map((i) => ({
                    productId: i.productId,
                    quantity: i.quantity,
                }))
            );

            clearOrdersCache();

            showAlert({
                type: "success",
                message: "Order updated successfully",
                duration: 1500,
            });
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
            setDirty(false);
        }
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">

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
                    Adjust Order
                </h1>
            </div>

            <p className="text-sm text-gray-500 mb-2">
                Order ID: <span className="font-medium">{orderId}</span>
            </p>

            {dirty && canAdjust && (
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

            <div className="bg-white rounded-2xl border shadow-sm flex flex-col h-[70vh]">
                <div className="flex-1 overflow-y-auto divide-y">
                    {items.map((item) => (
                        <div
                            key={item.productId}
                            className="p-4 flex gap-4 sm:flex-row flex-col"
                        >
                            <img
                                src={item.image}
                                className="w-16 h-16 object-contain rounded-md"
                            />

                            <div className="flex-1">
                                <h3 className="font-medium text-[var(--color-primary)]">
                                    {item.name}
                                </h3>
                                <div className="text-xs mt-1 flex flex-col gap-1">

                                    {item.discountText && (
                                        <span className="text-green-600 font-semibold">
                                            {item.discountText}
                                        </span>
                                    )}

                                    <div className="flex items-center gap-2 flex-wrap text-gray-600">


                                        {item.originalPrice && item.originalPrice > item.price && (
                                            <span className="line-through text-gray-400">
                                                ₹{item.originalPrice}
                                            </span>
                                        )}

                                        <span className="font-medium text-[var(--color-primary)]">
                                            ₹{item.price}
                                        </span>

                                        <span>
                                            × {item.quantity}
                                        </span>
                                    </div>
                                </div>
                                <p className="font-semibold">
                                    ₹{item.price * item.quantity}
                                </p>
                            </div>

                            <div className="flex gap-3 sm:flex-col sm:items-end">
                                <div
                                    className={`w-[120px] h-[38px] flex items-center justify-between px-3 rounded-lg
                                    ${canAdjust
                                            ? "bg-[var(--color-primary)] text-white"
                                            : "bg-gray-200 text-gray-400"
                                        }`}
                                >
                                    <button
                                        disabled={!canAdjust || item.quantity === 1}
                                        onClick={() => updateQty(item.productId, -1)}
                                    >
                                        −
                                    </button>
                                    <span>{item.quantity}</span>
                                    <button
                                        disabled={!canAdjust}
                                        onClick={() => updateQty(item.productId, 1)}
                                    >
                                        +
                                    </button>
                                </div>

                                <button
                                    disabled={!canAdjust}
                                    onClick={() => removeItem(item.productId)}
                                    className="text-xs text-red-500"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="border-t px-4 py-4 bg-white">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <Button
                            variant="outline"
                            disabled={!canAdjust}
                            onClick={() => setShowAddItem(true)}
                            className="w-full sm:w-auto"
                        >
                            + Add Item
                        </Button>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
                            <div className="text-center sm:text-left">
                                <p className="text-sm text-gray-500">Updated Total</p>
                                <div className="text-sm space-y-1 text-right sm:text-left">
                                    <p>Subtotal: ₹{subtotal}</p>

                                    {packagingCharge > 0 && (
                                        <p className="text-gray-600">
                                            Packaging ({packagingPercent}%): ₹{packagingCharge}
                                        </p>
                                    )}

                                    {gstAmount > 0 && (
                                        <p className="text-gray-600">
                                            GST ({gstPercent}%): ₹{gstAmount}
                                        </p>
                                    )}

                                    <p className="text-xl font-bold text-[var(--color-primary)]">
                                        ₹{grandTotal}
                                    </p>
                                </div>
                            </div>

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
                                    className="px-8 py-3 text-base w-full sm:w-auto"
                                    onClick={() => setShowSaveConfirm(true)}
                                >
                                    {saving ? "Saving…" : "Save Changes"}
                                </Button>
                            </div>

                            {!hasChanges && canAdjust && (
                                <p className="text-xs text-gray-400 text-center sm:text-right mt-1">
                                    No changes to save
                                </p>
                            )}
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
                    <div className="space-y-1">
                        <p className="text-sm">Old Total: ₹{oldTotal}</p>
                        <p className="font-semibold">
                            New Total: ₹{grandTotal}
                        </p>
                        {diffAmount !== 0 && (
                            <p
                                className={`text-sm font-medium ${diffAmount > 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                    }`}
                            >
                                {diffAmount > 0 ? "+" : "−"}₹{Math.abs(diffAmount)}
                            </p>
                        )}
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