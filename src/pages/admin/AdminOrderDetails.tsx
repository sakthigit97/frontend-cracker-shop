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

export default function AdminOrderDetails() {
    const { orderId = "" } = useParams();
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const location = useLocation();

    const { cache, fetchOrder, loading, updateOrder } =
        useAdminOrderDetailsStore();

    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingPayload, setPendingPayload] = useState<{
        status?: string;
        adminComment?: string;
    } | null>(null);

    const [selectedStatus, setSelectedStatus] = useState("");
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const order = cache[orderId];
    useEffect(() => {
        const shouldForce = (location.state as any)?.forceRefresh === true;
        fetchOrder(orderId, { force: shouldForce });
        if (shouldForce) {
            navigate(location.pathname, { replace: true });
        }
    }, [orderId]);

    useEffect(() => {
        if (order) {
            setComment(order.adminComment || "");
            setSelectedStatus(order.status);
        }
    }, [order]);

    const isTerminal =
        order?.status === "DISPATCHED" || order?.status === "CANCELLED";
    const canAdjust = !isTerminal;

    const canDownloadInvoice =
        STATUS_ORDER.indexOf(order?.status) >=
        STATUS_ORDER.indexOf("PAYMENT_CONFIRMED") &&
        order.status !== "CANCELLED";

    async function handleDownloadInvoice() {
        try {

            const auth = localStorage.getItem("auth");
            const token = auth ? JSON.parse(auth).token : null;

            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/orders/${order.orderId}/invoice`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { Authorization: `Bearer ${token}` }),
                    },
                }
            );

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || "Invoice download failed");
            }

            const blob = await res.blob();

            // 🔹 Ensure it is PDF
            if (blob.type !== "application/pdf") {
                throw new Error("Invalid invoice file received");
            }

            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = `invoice-${order.orderId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            showAlert({
                type: "error",
                message: err.message || "Unable to download invoice",
            });
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

                    <h2 className="text-sm font-semibold text-gray-800">
                        Order not found
                    </h2>
                    <p className="mt-1 text-xs text-gray-500">
                        The order you are trying to view does not exist or may have been removed.
                    </p>
                </div>
            </div>
        );
    }

    const canSubmit =
        selectedStatus !== "" || comment !== order.adminComment;

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="bg-white border rounded-xl p-4 space-y-3">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <h1 className="text-base font-semibold text-[var(--color-primary)] break-all">
                            {order.orderId}
                        </h1>

                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(order.orderId);
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

                        {canDownloadInvoice && (
                            <Button
                                variant="secondary"
                                className="px-3 py-1.5 text-xs"
                                onClick={handleDownloadInvoice}
                            >
                                Download Invoice
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
                            ₹{order.totalAmount}
                        </span>
                    </div>

                    {order.expectedDelivery && (
                        <div>
                            <span className="text-gray-500">Expected</span>{" "}
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
                            src={item.image || "/placeholder.png"}
                            onError={(e) =>
                                (e.currentTarget.src = "/placeholder.png")
                            }
                            className="w-14 h-14 rounded object-cover"
                            loading="lazy"
                        />

                        <div className="flex-1">
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-gray-500">
                                Qty {item.quantity} x {item.price}
                            </p>
                        </div>

                        <p className="text-sm font-medium">
                            ₹{item.price * item.quantity}
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
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="w-full appearance-none border rounded-lg px-3 py-2 pr-10 text-sm bg-white"
                            >
                                <option value="">Status</option>
                                {STATUS_ORDER.map((s) => (
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
                                status: selectedStatus || undefined,
                                adminComment:
                                    comment !== order.adminComment ? comment : undefined,
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
                        await updateOrder(order.orderId, pendingPayload);
                        showAlert({
                            type: "success",
                            message: "Order updated successfully",
                            duration: 1500,
                        });
                        setSelectedStatus("");
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
