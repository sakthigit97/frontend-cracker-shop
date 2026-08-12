import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import ProductSkeleton from "../components/product/ProductSkeleton";
import type { BulkOrderProduct } from "../types/bulkOrder";
import { useAlert } from "../store/alert.store";
import { useBulkOrderHistoryStore } from "../store/bulkOrderHistory.store";
import defaultImage from "../assets/default-image.png"
import { formatCurrency } from "../utils/pricing";
import { downloadBulkInvoice } from "../utils/pdf/downloadBulkInvoice";

import { ORDER_STATUS_CONFIG } from "../utils/orderStatus";
import { useConfigStore } from "../store/config.store";
import { formatDateTime } from "../utils/date";
const TERMINAL_STATUS = "CANCELLED";
const CANCELLABLE_STATUSES = [
    "ORDER_PLACED",
    "ORDER_CONFIRMED",
    "PAYMENT_CONFIRMED",
];

export default function BulkOrderDetails() {
    const navigate = useNavigate();
    const { orderId } = useParams();
    const config = useConfigStore((s) => s.config);
    const gstPercentage = config?.gstPercent;
    const packagePercent = config?.packagingPercent;
    const {
        order,
        fetchingOrder,
        cancelling,
        fetchOrder,
        cancelOrder,
        clearOrder,
    } = useBulkOrderHistoryStore();
    const { showAlert } = useAlert();
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (!orderId) {
            return;
        }
        fetchOrder(orderId);
    }, [orderId, fetchOrder, clearOrder]);

    async function handleCancel() {
        if (!order) {
            return;
        }

        try {
            await cancelOrder(order.orderId);

            showAlert({
                type: "success",
                message: "Bulk Order Cancelled Successfully",
                duration: 1500,
            });

            navigate("/bulk-orders", {
                replace: true,
            });
        } catch (err: any) {
            showAlert({
                type: "error",
                message: err.message ?? "Unable to cancel bulk order.",
            });
        }
    }

    async function handleDownloadInvoice() {
        if (!order || !config) return;
        if (downloading) return;

        setDownloading(true);
        await new Promise((resolve) => setTimeout(resolve, 0));
        try {
            await downloadBulkInvoice(
                order,
                config
            );
        } catch (err: any) {
            showAlert({
                type: "error",
                message: err.message || "Unable to download invoice",
            });
        } finally {
            setDownloading(false);
        }
    }

    if (fetchingOrder) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({
                    length: 8,
                }).map((_, index) => (
                    <ProductSkeleton key={index} />
                ))}
            </div>
        );
    }

    if (!order) {
        return (
            <div className="py-20 text-center px-4 space-y-4">
                <p className="text-sm text-[var(--color-muted)]">
                    Bulk Order not found.
                </p>

                <Button onClick={() => navigate("/bulk-orders")}>
                    Back To Bulk Orders
                </Button>
            </div>
        );
    }

    const STATUS_KEYS = Object.keys(ORDER_STATUS_CONFIG);
    const currentIndex = STATUS_KEYS.indexOf(order.status);
    const isCancelled = order.status === TERMINAL_STATUS;
    const canCancel = CANCELLABLE_STATUSES.includes(order.status);
    const canDownloadInvoice = [
        "PAYMENT_CONFIRMED",
        "ORDER_PACKED",
        "DISPATCHED",
    ].includes(order.status);

    return (
        <div className="max-w-5xl mx-auto p-4 space-y-6">
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <button
                        onClick={() => navigate(-1)}
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

                    <h1 className="text-xl md:text-2xl font-semibold text-[var(--color-primary)]">
                        Bulk Order Details
                    </h1>
                </div>

                <p className="text-sm text-[var(--color-muted)]">
                    <span className="font-semibold text-[var(--color-primary)]">
                        Order ID :
                    </span>{" "}
                    {order.orderId}
                </p>

                <p className="text-sm text-[var(--color-muted)] mt-2">
                    <span className="font-semibold text-[var(--color-primary)]">
                        Scheme :
                    </span>{" "}
                    {order.schemeId}
                </p>

                <p className="text-sm text-[var(--color-muted)] mt-2">
                    <span className="font-semibold text-[var(--color-primary)]">
                        Placed On :
                    </span>{" "}
                    {formatDateTime(order.createdAt)}
                </p>
            </div>

            {isCancelled && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                    <h3 className="font-semibold text-red-600 mb-2">
                        ❌ Bulk Order Cancelled
                    </h3>

                    <p className="text-sm text-red-500">
                        This bulk order has been cancelled and will not be processed
                        further.
                    </p>
                </div>
            )}

            {!isCancelled && (
                <div className="bg-[var(--color-surface)] border rounded-xl p-5">
                    <h3 className="font-semibold text-[var(--color-primary)] mb-5">
                        Order Tracking
                    </h3>

                    <div className="flex flex-col gap-5">
                        {STATUS_KEYS.map((statusKey, index) => {
                            const status = ORDER_STATUS_CONFIG[statusKey];
                            let indicatorClass = "border-gray-300 text-gray-400";
                            let helperText = "";
                            if (index <= currentIndex) {
                                indicatorClass = "bg-green-500 border-green-500 text-white";
                            } else if (index === currentIndex + 1) {
                                indicatorClass = "bg-yellow-400 border-yellow-400 text-black";
                                helperText = "Pending";
                            }

                            return (
                                <div key={statusKey} className="flex items-start gap-3">
                                    <div
                                        className={`
                                            flex
                                            h-9
                                            w-9
                                            items-center
                                            justify-center
                                            rounded-full
                                            border
                                            text-xs
                                            font-semibold
                                            ${indicatorClass}
                                        `}
                                    >
                                        {index + 1}
                                    </div>

                                    <div className="flex-1">
                                        <p
                                            className={`
                                                text-sm
                                                font-medium
                                                ${index <= currentIndex
                                                    ? "text-[var(--color-primary)]"
                                                    : "text-[var(--color-muted)]"
                                                }
                                            `}
                                        >
                                            {status.label}
                                        </p>

                                        {helperText && (
                                            <p className="mt-1 text-xs text-amber-600 font-medium">
                                                {helperText}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="bg-[var(--color-surface)] border rounded-xl p-5">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-medium">Current Status</span>

                    <span
                        className={`
                            px-3
                            py-1
                            rounded-full
                            text-xs
                            font-semibold
                            ${ORDER_STATUS_CONFIG[order.status]?.className ??
                            "bg-gray-100 text-gray-700"
                            }
                        `}
                    >
                        {ORDER_STATUS_CONFIG[order.status]?.label ?? order.status}
                    </span>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                    <div>
                        <p className="text-sm font-semibold mb-2">Customer Name</p>
                        <p className="text-sm text-[var(--color-muted)]">
                            {order.address.fullName || "-"}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm font-semibold mb-2">Mobile Number</p>

                        <p className="text-sm text-[var(--color-muted)]">
                            {order.address?.mobile || "-"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-[var(--color-surface)] border rounded-xl p-5">
                <h3 className="font-semibold text-[var(--color-primary)] mb-4">
                    Delivery Address
                </h3>

                <div className="grid md:grid-cols-2 gap-5">
                    <div>
                        <p className="text-sm font-medium mb-1">Address Line 1</p>

                        <p className="text-sm text-[var(--color-muted)]">
                            {order.address?.addressLine1 || "-"}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm font-medium mb-1">Address Line 2</p>

                        <p className="text-sm text-[var(--color-muted)]">
                            {order.address?.addressLine2 || "-"}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm font-medium mb-1">City</p>

                        <p className="text-sm text-[var(--color-muted)]">
                            {order.address?.city || "-"}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm font-medium mb-1">State</p>

                        <p className="text-sm text-[var(--color-muted)]">
                            {order.address?.state || "-"}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm font-medium mb-1">Pincode</p>

                        <p className="text-sm text-[var(--color-muted)]">
                            {order.address?.pincode || "-"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-[var(--color-surface)] border rounded-xl p-5">
                <h3 className="font-semibold text-[var(--color-primary)] mb-4">
                    Products ({order.items.length})
                </h3>
                <div
                    className="
                        space-y-4
                        max-h-[420px]
                        overflow-y-auto
                        pr-2
                    "
                >
                    {order.items.map((item: BulkOrderProduct) => (
                        <div
                            key={item.productId}
                            className="flex justify-between items-start border-b last:border-0 pb-4"
                        >
                            <div className="flex gap-4">
                                <img
                                    src={item.image || defaultImage}
                                    alt={item.name}
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = defaultImage;
                                    }}
                                    className="w-20 h-20 rounded-lg border object-cover"
                                />

                                <div>
                                    <p className="font-semibold">{item.name}</p>

                                    {item.brand && (
                                        <p className="text-sm text-[var(--color-muted)]">
                                            {item.brand}
                                        </p>
                                    )}

                                    <p className="text-sm text-[var(--color-muted)] mt-2">
                                        Quantity : {item.quantity}
                                    </p>

                                    <p className="text-sm text-[var(--color-muted)]">
                                        Rate : ₹{formatCurrency(item.schemePrice)}
                                    </p>

                                    <p className="text-sm text-[var(--color-muted)]">
                                        Carton Qty : ₹{item.cartonQty}
                                    </p>
                                </div>
                            </div>

                            <div className="text-right">
                                <p className="font-semibold">₹{formatCurrency(item.total)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-[var(--color-surface)] border rounded-xl p-5">
                <h3 className="font-semibold text-[var(--color-primary)] mb-4">
                    Pricing Summary
                </h3>

                <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span>Products Total</span>

                        <span>₹{formatCurrency(order.pricing.productTotal)}</span>
                    </div>

                    {(order.pricing?.packagingCharge ?? 0) > 0 && (
                        <div className="flex justify-between">
                            <span>Packaging Charge ({packagePercent}%)</span>
                            <span>₹{formatCurrency(order.pricing.packagingCharge)}</span>
                        </div>
                    )}

                    {(order.pricing?.gstAmount ?? 0) > 0 && (
                        <div className="flex justify-between">
                            <span>GST ({gstPercentage}%)</span>
                            <span>₹{formatCurrency(order.pricing.gstAmount)}</span>
                        </div>
                    )}

                    <div className="border-t pt-4 flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-[var(--color-primary)]">
                                Grand Total
                            </p>
                        </div>

                        <span className="text-2xl font-bold text-[var(--color-primary)]">
                            ₹{formatCurrency(order.pricing.grandTotal)}
                        </span>
                    </div>
                </div>
            </div>

            {order.remarks && (
                <div className="bg-[var(--color-surface)] border rounded-xl p-5">
                    <h3 className="font-semibold text-[var(--color-primary)] mb-3">
                        Remarks
                    </h3>

                    <p className="text-sm whitespace-pre-wrap text-[var(--color-muted)]">
                        {order.remarks}
                    </p>
                </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">

                {canDownloadInvoice && (
                    <Button
                        variant="secondary"
                        onClick={handleDownloadInvoice}
                    >
                        {downloading ? "Downloading...." : "Download Invoice"}
                    </Button>
                )}

                {canCancel && (
                    <Button
                        disabled={cancelling}
                        onClick={() => setShowCancelConfirm(true)}
                        className="bg-red-500 hover:bg-red-600 text-white"
                    >
                        {cancelling
                            ? "Cancelling..."
                            : "Cancel Order"}
                    </Button>
                )}

            </div>

            <ConfirmDialog
                open={showCancelConfirm}
                title="Cancel Bulk Order?"
                message={
                    <>
                        Are you sure you want to cancel this bulk order?
                        <br />
                        <span className="text-red-500 font-medium">
                            This action cannot be undone.
                        </span>
                    </>
                }
                confirmText="Yes, Cancel"
                cancelText="No"
                loading={cancelling}
                onCancel={() => setShowCancelConfirm(false)}
                onConfirm={async () => {
                    setShowCancelConfirm(false);
                    await handleCancel();
                }}
            />
        </div>
    );
}
