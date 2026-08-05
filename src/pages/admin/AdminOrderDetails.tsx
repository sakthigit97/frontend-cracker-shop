import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    STATUS_LABELS,
    STATUS_COLORS,
    STATUS_ORDER,
} from "../../utils/orderStatus";
import { useAdminOrderDetailsStore } from "../../store/adminOrderDetails.store";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import ProductSkeleton from "../../components/product/ProductSkeleton";
import { useAlert } from "../../store/alert.store";
import { useLocation } from "react-router-dom";
import EmptyState from "../../components/ui/EmptyState";
import defaultImage from "../../assets/default-image.png";
import { downloadInvoice } from "../../utils/pdf/downloadInvoice";
import { useConfigStore } from "../../store/config.store";
import { useAdminOrdersStore } from "../../store/adminOrders.store";
import { restoreOrderApi } from "../../services/order.api";
import { useOrdersStore } from "../../store/orders.store";

export default function AdminOrderDetails() {
    const { orderId = "" } = useParams();
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const location = useLocation();
    const [downloading, setDownloading] = useState(false);
    const { cache, fetchOrder, loading, updateOrder } = useAdminOrderDetailsStore();
    const updateOrderListCache = useAdminOrdersStore((s) => s.updateOrderInCache);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingPayload, setPendingPayload] = useState<{
        status?: string;
        adminComment?: string;
        mobile: string;
        amount: string;
    } | null>(null);
    const config = useConfigStore((s) => s.config);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const clearOrdersCache = useOrdersStore((s) => s.clear);
    const clearAdminOrdersCache = useAdminOrdersStore((s) => s.clear);

    const order = cache[orderId];
    useEffect(() => {
        const shouldForce = (location.state as any)?.forceRefresh === true;
        fetchOrder(orderId, { force: shouldForce });
        if (shouldForce) {
            navigate(location.pathname, { replace: true });
        }
    }, [
        orderId,
        fetchOrder,
        navigate,
        location.pathname,
        location.state,
    ]);

    useEffect(() => {
        if (order) {
            setComment(order.adminComment || "");
            setSelectedStatus(order.status);
        }
    }, [order]);

    const isTerminal = order?.status === "DISPATCHED" || order?.status === "CANCELLED";
    const canAdjust = STATUS_ORDER.indexOf(order?.status) < STATUS_ORDER.indexOf("ORDER_PACKED");
    const canDownloadInvoice = STATUS_ORDER.indexOf(order?.status) >=
        STATUS_ORDER.indexOf("PAYMENT_CONFIRMED") &&
        order.status !== "CANCELLED";

    const isCancelled = order?.status === "CANCELLED";
    const currentIndex = STATUS_ORDER.indexOf(order?.status);
    const availableStatuses = STATUS_ORDER.filter((status, index) => {
        if (status === "CANCELLED") return true;
        return index >= currentIndex;
    });

    async function handleRestore() {
        try {
            setRestoring(true);

            await restoreOrderApi(order.orderId);

            clearOrdersCache();
            clearAdminOrdersCache();

            await fetchOrder(order.orderId, {
                force: true,
            });

            showAlert({
                type: "success",
                message: "Order Reopened Successfully",
                duration: 1500,
            });

            navigate("/admin/orders", {
                replace: true,
            });
        } catch (err: any) {
            showAlert({
                type: "error",
                message:
                    err.message ||
                    "Unable to reopen order",
            });
        } finally {
            setRestoring(false);
        }
    }


    async function handleDownloadInvoice() {
        if (downloading) return;

        try {
            setDownloading(true);
            await new Promise((resolve) => setTimeout(resolve, 0));

            await downloadInvoice({
                order,
                config,
            });
        } catch (err: any) {
            showAlert({
                type: "error",
                message: err.message || "Unable to download invoice",
            });
        } finally {
            setDownloading(false);
        }
    }
    if (!order && loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <ProductSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="bg-white border rounded-xl p-8 text-center max-w-sm w-full">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg
                            className="h-6 w-6 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>

                    <EmptyState
                        title="Order not found"
                        description="Try explore other order."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        The order you are trying to view does not exist or may have been removed.
                    </p>
                </div>
            </div>
        );
    }
    const canSubmit =
        selectedStatus !== order.status ||
        comment !== (order.adminComment || "");
    return (
        <div className="space-y-6">
            <div className="bg-white border rounded-xl p-4 space-y-3">

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
                        Order Details
                    </h1>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <h1 className="text-base font-semibold text-[var(--color-primary)] break-all">
                            {order.orderId}
                        </h1>

                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(order.orderId);
                                showAlert({
                                    type: "success",
                                    message: "Order ID copied"
                                });
                            }}

                            className="p-1.5 rounded-md border hover:bg-gray-100 active:bg-gray-200"
                            aria-label="Copy Order ID"
                            title="Copy Order ID"
                        >
                            <svg
                                className="h-4 w-4 text-gray-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2M16 8h2a2 2 0 012 2v8a2 2 0 01-2 2h-8a2 2 0 01-2-2v-2"
                                />
                            </svg>
                        </button>
                    </div>

                    <p className="text-xs text-gray-500">
                        Created on {new Date(order.createdAt).toLocaleString("en-IN")}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                        {canAdjust && (
                            <Button
                                variant="outline"
                                className="px-3 py-1.5 text-xs"
                                disabled={!canAdjust || submitting}
                                onClick={() =>
                                    navigate(`/admin/orders/${order.orderId}/adjust`, {
                                        state: { order, isAdmin: true },
                                    })
                                }
                            >
                                Adjust Order
                            </Button>
                        )}

                        {isCancelled && (
                            <Button
                                disabled={restoring}
                                onClick={handleRestore}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                {restoring ? "Reopening..." : "Reopen Order"}
                            </Button>
                        )}

                        {canDownloadInvoice && (
                            <Button
                                variant="secondary"
                                className="px-3 py-1.5 text-xs"
                                onClick={handleDownloadInvoice}
                            >
                                {downloading ? " Downloading Invoice..." : " Download Invoice"}
                            </Button>
                        )}

                        <span
                            className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full"
                            style={{
                                backgroundColor: `${STATUS_COLORS[order.status]}20`,
                                color: STATUS_COLORS[order.status],
                            }}
                        >
                            {STATUS_LABELS[order.status]}
                        </span>
                    </div>
                </div>

                <div className="h-px bg-gray-100" />

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <div>
                        <span className="text-gray-500">Total</span>{" "}
                        <span className="font-semibold text-gray-900">
                            ₹{order.finalPayable}
                        </span>
                    </div>

                    {order.expectedDelivery && (
                        <div>
                            <span className="text-gray-500">Expected Delivery</span>{" "}
                            <span className="font-medium text-gray-800">
                                {new Date(order.expectedDelivery).toLocaleDateString("en-IN")}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* ITEMS */}
            <div className="bg-white border rounded-xl divide-y max-h-[60vh] overflow-y-auto">
                {order.items.map((item: any, idx: number) => (
                    <div key={item.productId || idx} className="p-4 flex gap-4">
                        <img
                            src={item.image || defaultImage}
                            onError={(e) => {
                                e.currentTarget.src = defaultImage;
                            }}
                            className="w-14 h-14 rounded object-cover"
                            loading="lazy"
                        />

                        <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold">{item.name}</p>

                                {item.isComboPackage && (
                                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-100 text-blue-700">
                                        Combo
                                    </span>
                                )}
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">

                                {item.originalPrice &&
                                    item.originalPrice > item.price && (
                                        <span className="line-through text-gray-400">
                                            ₹{item.originalPrice}
                                        </span>
                                    )}

                                <span className="font-semibold text-[var(--color-primary)]">
                                    ₹{item.price}
                                </span>

                                {item.discountText && (
                                    <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5 font-semibold">
                                        {item.discountText}
                                    </span>
                                )}
                            </div>

                            <div className="mt-1 text-xs text-gray-500">
                                ₹{item.price} × {item.quantity}
                            </div>
                        </div>

                        <p className="text-sm font-medium">
                            ₹{item.total}
                        </p>
                    </div>
                ))}
            </div>

            {/* PAYMENT + ADDRESS */}
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-white border rounded-xl p-4">
                    <h3 className="text-sm font-semibold mb-2">Payment</h3>
                    <p className="text-sm">{order.paymentMode}</p>
                    <p className="text-xs text-gray-500">{order.paymentStatus}</p>
                </div>

                <div className="bg-white border rounded-xl p-4">
                    <h3 className="text-sm font-semibold mb-2">Address</h3>
                    <p className="text-sm whitespace-pre-line">{order.address}</p>
                </div>
            </div>

            {/* ADMIN ACTIONS */}
            {!isTerminal && (
                <div className="bg-white border rounded-xl p-4 space-y-4">
                    <h3 className="text-sm font-semibold">Admin Actions</h3>

                    <div>
                        <label className="text-xs text-gray-500 block mb-1">
                            Update Status
                        </label>

                        <div className="relative">
                            <select
                                value={selectedStatus}
                                onChange={(e) => {
                                    setSelectedStatus(e.target.value);
                                }}
                                className="w-full appearance-none border rounded-lg px-3 py-2 pr-10 text-sm bg-white"
                            >
                                <option value="" disabled>Status</option>
                                {availableStatuses.map((s) => (
                                    <option key={s} value={s}>
                                        {STATUS_LABELS[s]}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 block mb-1">
                            Admin Comment
                        </label>
                        <textarea
                            rows={3}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full border rounded px-3 py-2 text-sm"
                        />
                    </div>

                    <Button
                        disabled={!canSubmit || submitting}
                        onClick={() => {
                            if (!canSubmit) return;
                            setPendingPayload({
                                status: selectedStatus !== order.status
                                    ? selectedStatus
                                    : undefined,
                                adminComment: comment !== order.adminComment ? comment : undefined,
                                mobile: order.userId || '',
                                amount: order.totalAmount || 0
                            });
                            setShowConfirm(true);
                        }}
                    >
                        Submit
                    </Button>
                </div>
            )}
            {isTerminal && (
                <p className="text-xs text-gray-500">
                    This order is completed and cannot be modified.
                </p>
            )}
            <ConfirmDialog
                open={showConfirm}
                title="Confirm update?"
                description="Are you sure you want to update this order?"
                confirmText="Yes, update"
                cancelText="Cancel"
                onConfirm={async () => {
                    if (!pendingPayload || submitting) return;

                    setShowConfirm(false);
                    setSubmitting(true);

                    try {
                        await updateOrder(
                            order.orderId,
                            pendingPayload
                        );
                        showAlert({
                            type: "success",
                            message: "Order updated successfully",
                            duration: 1500,
                        });

                        setSelectedStatus(
                            pendingPayload.status ?? selectedStatus
                        );

                        updateOrderListCache(order.orderId, {
                            status: pendingPayload.status ?? order.status,
                            adminComment:
                                pendingPayload.adminComment ??
                                order.adminComment,
                        });
                        await fetchOrder(orderId, { force: true });
                    } catch (err: any) {
                        showAlert({
                            type: "error",
                            message: err?.message || "Failed to update order",
                        });
                    } finally {
                        setSubmitting(false);
                        setPendingPayload(null);
                    }
                }}
                onCancel={() => {
                    setShowConfirm(false);
                    setPendingPayload(null);
                }}
            />
        </div>
    );
}
